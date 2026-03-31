import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Query, HTTPException
import httpx

router = APIRouter(tags=["bars"])

ALPACA_DATA_URL = os.environ.get("ALPACA_DATA_URL", "https://data.alpaca.markets")
ALPACA_KEY = lambda: os.environ["ALPACA_API_KEY_ID"]
ALPACA_SECRET = lambda: os.environ["ALPACA_API_SECRET_KEY"]


def _auth():
    return {"APCA-API-KEY-ID": ALPACA_KEY(), "APCA-API-SECRET-KEY": ALPACA_SECRET()}


# In-memory cache
_bars_cache: dict = {}
_CACHE_TTL = 300  # 5 min for intraday, 1h for daily


def _get_cache(key):
    e = _bars_cache.get(key)
    if e and (datetime.now(timezone.utc) - e["ts"]).total_seconds() < e["ttl"]:
        return e["data"]
    return None


def _set_cache(key, data, ttl=300):
    _bars_cache[key] = {"data": data, "ts": datetime.now(timezone.utc), "ttl": ttl}
    return data


TIMEFRAME_MAP = {
    "1D": ("1Hour", timedelta(days=1)),
    "1W": ("1Day", timedelta(weeks=1)),
    "1M": ("1Day", timedelta(days=30)),
    "3M": ("1Day", timedelta(days=90)),
}


@router.get("/bars/{symbol}")
async def get_bars(symbol: str, period: str = Query(default="1M")):
    """OHLCV bars for a symbol from Alpaca data API."""
    symbol = symbol.upper()
    cache_key = f"bars_{symbol}_{period}"
    cached = _get_cache(cache_key)
    if cached:
        return cached

    timeframe_str, delta = TIMEFRAME_MAP.get(period, ("1Day", timedelta(days=30)))
    end = datetime.now(timezone.utc)
    start = end - delta

    ttl = 300 if period == "1D" else 3600

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{ALPACA_DATA_URL}/v2/stocks/{symbol}/bars",
                headers=_auth(),
                params={
                    "timeframe": timeframe_str,
                    "start": start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "end": end.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "limit": 500,
                    "feed": "iex",
                    "adjustment": "all",
                },
            )
            resp.raise_for_status()
            bars = resp.json().get("bars", [])
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=str(e))

    result = {
        "symbol": symbol,
        "period": period,
        "bars": [
            {"t": b["t"], "o": b["o"], "h": b["h"], "l": b["l"], "c": b["c"], "v": b["v"]}
            for b in bars
        ],
    }
    return _set_cache(cache_key, result, ttl)
