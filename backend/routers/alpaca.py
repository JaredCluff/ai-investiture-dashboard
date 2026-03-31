import os
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from services.cache import alpaca_cache

router = APIRouter()


def _alpaca_headers() -> dict[str, str]:
    return {
        "APCA-API-KEY-ID": os.environ["ALPACA_API_KEY_ID"],
        "APCA-API-SECRET-KEY": os.environ["ALPACA_API_SECRET_KEY"],
    }


def _base_url() -> str:
    return os.environ["ALPACA_BASE_URL"].rstrip("/")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/status")
async def get_status():
    cache_key = "alpaca:status"
    cached = alpaca_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_base_url()}/v2/account",
                headers=_alpaca_headers(),
                timeout=10.0,
            )
        connected = resp.status_code == 200
        account_number = ""
        status = ""
        if connected:
            data = resp.json()
            account_number = data.get("account_number", "")
            status = data.get("status", "")
        result = {
            "connected": connected,
            "account_number": account_number,
            "status": status,
            "last_check": _now_iso(),
        }
    except httpx.HTTPError as e:
        return JSONResponse({"error": str(e)}, status_code=502)

    alpaca_cache.set(cache_key, result)
    return result


@router.get("/portfolio")
async def get_portfolio():
    cache_key = "alpaca:portfolio"
    cached = alpaca_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_base_url()}/v2/account",
                headers=_alpaca_headers(),
                timeout=10.0,
            )
        resp.raise_for_status()
        data = resp.json()
    except httpx.HTTPError as e:
        return JSONResponse({"error": str(e)}, status_code=502)

    equity = float(data.get("equity", 0))
    last_equity = float(data.get("last_equity", 0))
    pnl = equity - last_equity
    pnl_pct = (pnl / last_equity * 100) if last_equity else 0.0

    result = {
        "equity": equity,
        "cash": float(data.get("cash", 0)),
        "buying_power": float(data.get("buying_power", 0)),
        "portfolio_value": float(data.get("portfolio_value", 0)),
        "pnl": pnl,
        "pnl_pct": pnl_pct,
        "day_trade_count": int(data.get("daytrade_count", 0)),
        "pdt_eligible": bool(data.get("pattern_day_trader", False)),
        "last_updated": _now_iso(),
    }

    alpaca_cache.set(cache_key, result)
    return result


@router.get("/positions")
async def get_positions():
    cache_key = "alpaca:positions"
    cached = alpaca_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_base_url()}/v2/positions",
                headers=_alpaca_headers(),
                timeout=10.0,
            )
        resp.raise_for_status()
        raw = resp.json()
    except httpx.HTTPError as e:
        return JSONResponse({"error": str(e)}, status_code=502)

    positions = [
        {
            "symbol": p.get("symbol", ""),
            "qty": float(p.get("qty", 0)),
            "side": p.get("side", ""),
            "market_value": float(p.get("market_value", 0)),
            "cost_basis": float(p.get("cost_basis", 0)),
            "unrealized_pl": float(p.get("unrealized_pl", 0)),
            "unrealized_plpc": float(p.get("unrealized_plpc", 0)) * 100,
            "current_price": float(p.get("current_price", 0)),
            "avg_entry_price": float(p.get("avg_entry_price", 0)),
        }
        for p in raw
    ]

    alpaca_cache.set(cache_key, positions)
    return positions


@router.get("/trades")
async def get_trades():
    cache_key = "alpaca:trades"
    cached = alpaca_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_base_url()}/v2/orders",
                headers=_alpaca_headers(),
                params={"status": "all", "limit": 100, "direction": "desc"},
                timeout=10.0,
            )
        resp.raise_for_status()
        raw = resp.json()
    except httpx.HTTPError as e:
        return JSONResponse({"error": str(e)}, status_code=502)

    trades = [
        {
            "id": o.get("id", ""),
            "symbol": o.get("symbol", ""),
            "side": o.get("side", ""),
            "qty": float(o.get("qty") or 0),
            "notional": float(o["notional"]) if o.get("notional") else None,
            "filled_qty": float(o.get("filled_qty") or 0),
            "filled_avg_price": float(o["filled_avg_price"]) if o.get("filled_avg_price") else None,
            "order_type": o.get("order_type", ""),
            "status": o.get("status", ""),
            "submitted_at": o.get("submitted_at"),
            "filled_at": o.get("filled_at"),
        }
        for o in raw
    ]

    alpaca_cache.set(cache_key, trades)
    return trades


@router.get("/account/history")
async def get_account_history():
    cache_key = "alpaca:account_history"
    cached = alpaca_cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_base_url()}/v2/account/portfolio/history",
                headers=_alpaca_headers(),
                params={"timeframe": "1D", "period": "1M"},
                timeout=10.0,
            )
        resp.raise_for_status()
        result = resp.json()
    except httpx.HTTPError as e:
        return JSONResponse({"error": str(e)}, status_code=502)

    alpaca_cache.set(cache_key, result)
    return result
