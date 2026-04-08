import asyncio
import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Query
import httpx

router = APIRouter(tags=["equity"])

ALPACA_BASE_URL = os.environ.get("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")
ALPACA_DATA_URL = os.environ.get("ALPACA_DATA_URL", "https://data.alpaca.markets")
ALPACA_KEY = lambda: os.environ["ALPACA_API_KEY_ID"]
ALPACA_SECRET = lambda: os.environ["ALPACA_API_SECRET_KEY"]

def _auth():
    return {"APCA-API-KEY-ID": ALPACA_KEY(), "APCA-API-SECRET-KEY": ALPACA_SECRET()}

# Simple in-memory cache
_equity_cache: dict = {}
_equity_lock = asyncio.Lock()
_CACHE_TTL = 3600  # 1 hour

def _cached(key: str, ttl: int = _CACHE_TTL):
    entry = _equity_cache.get(key)
    if entry and (datetime.now(timezone.utc) - entry["ts"]).total_seconds() < ttl:
        return entry["data"]
    return None

def _store(key: str, data):
    _equity_cache[key] = {"data": data, "ts": datetime.now(timezone.utc)}
    return data

@router.get("/equity-curve")
async def get_equity_curve(period: str = Query(default="1M")):
    """Portfolio history + SPY benchmark, normalized to same start value."""
    cache_key = f"equity_{period}"
    async with _equity_lock:
        cached = _cached(cache_key)
        if cached:
            return cached

    # Map UI period to Alpaca period param
    period_map = {"1W": "1W", "1M": "1M", "3M": "3M", "ALL": "6M"}
    alpaca_period = period_map.get(period, "1M")

    # Fetch portfolio history
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            port_resp = await client.get(
                f"{ALPACA_BASE_URL}/v2/account/portfolio/history",
                headers=_auth(),
                params={"timeframe": "1D", "period": alpaca_period},
            )
            port_resp.raise_for_status()
            port_data = port_resp.json()
    except httpx.HTTPError as e:
        return {"error": str(e), "portfolio": [], "spy": []}

    timestamps = port_data.get("timestamp", [])
    equity = port_data.get("equity", [])

    if not timestamps or not equity:
        return {"portfolio": [], "spy": [], "period": period}

    # Fetch SPY bars from Alpaca data API
    start_dt = datetime.fromtimestamp(timestamps[0], tz=timezone.utc)
    end_dt = datetime.fromtimestamp(timestamps[-1], tz=timezone.utc) + timedelta(days=1)
    start_str = start_dt.strftime("%Y-%m-%dT00:00:00Z")
    end_str = end_dt.strftime("%Y-%m-%dT00:00:00Z")

    spy_data = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            spy_resp = await client.get(
                f"{ALPACA_DATA_URL}/v2/stocks/SPY/bars",
                headers=_auth(),
                params={"timeframe": "1Day", "start": start_str, "end": end_str, "limit": 500, "feed": "iex"},
            )
            spy_resp.raise_for_status()
            bars = spy_resp.json().get("bars", [])
            spy_data = [{"t": b["t"], "v": b["c"]} for b in bars]
    except httpx.HTTPError:
        spy_data = []  # SPY unavailable, return empty

    # Normalize SPY to start at same value as portfolio
    portfolio_start = next((v for v in equity if v and v > 0), None)
    spy_start = spy_data[0]["v"] if spy_data else None
    spy_normalized = []
    if spy_start and portfolio_start:
        for item in spy_data:
            spy_normalized.append({
                "t": item["t"],
                "v": round(item["v"] / spy_start * portfolio_start, 2)
            })

    result = {
        "period": period,
        "portfolio": [
            {"t": datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d"), "v": round(v, 2)}
            for ts, v in zip(timestamps, equity)
            if v is not None
        ],
        "spy": spy_normalized,
    }
    async with _equity_lock:
        _store(cache_key, result)
    return result
