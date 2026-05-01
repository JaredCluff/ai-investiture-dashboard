import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import httpx
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from routers.paperclip import _require_board_auth

router = APIRouter()

_CHECK_TIMEOUT = 4.0  # per-service timeout; total < 5s because all run in parallel


def _service(name: str, status: str, **extra) -> dict:
    return {"name": name, "status": status, **extra}


async def _tcp_check(host: str, port: int, name: str) -> dict:
    """Check service reachability via TCP connect (no HTTP required)."""
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port), timeout=_CHECK_TIMEOUT
        )
        writer.close()
        await writer.wait_closed()
        return _service(name, "ok")
    except asyncio.TimeoutError:
        return _service(name, "down", error="timeout")
    except Exception as e:
        return _service(name, "down", error=str(e)[:120])


async def _http_check(client: httpx.AsyncClient, url: str, name: str) -> dict:
    try:
        resp = await client.get(url, timeout=_CHECK_TIMEOUT)
        ok = resp.status_code < 400
        return _service(name, "ok" if ok else "degraded", http_code=resp.status_code)
    except httpx.TimeoutException:
        return _service(name, "down", error="timeout")
    except Exception as e:
        return _service(name, "down", error=str(e)[:120])


async def _alpaca_check(client: httpx.AsyncClient) -> dict:
    """Check Alpaca reachability and return account status for Layout indicator."""
    base = os.environ.get("ALPACA_BASE_URL", "").rstrip("/")
    if not base:
        return _service("alpaca", "unknown", error="ALPACA_BASE_URL not set",
                        connected=False, account_number="", account_status="")
    headers = {
        "APCA-API-KEY-ID": os.environ.get("ALPACA_API_KEY_ID", ""),
        "APCA-API-SECRET-KEY": os.environ.get("ALPACA_API_SECRET_KEY", ""),
    }
    try:
        resp = await client.get(f"{base}/v2/account", headers=headers, timeout=_CHECK_TIMEOUT)
        connected = resp.status_code == 200
        account_number = ""
        account_status = ""
        if connected:
            body = resp.json()
            account_number = body.get("account_number", "")
            account_status = body.get("status", "")
        status = "ok" if connected else "degraded"
        return _service("alpaca", status, http_code=resp.status_code,
                        connected=connected, account_number=account_number,
                        account_status=account_status)
    except httpx.TimeoutException:
        return _service("alpaca", "down", error="timeout",
                        connected=False, account_number="", account_status="")
    except Exception as e:
        return _service("alpaca", "down", error=str(e)[:120],
                        connected=False, account_number="", account_status="")


async def _agent_heartbeats() -> dict:
    paperclip_url = os.environ.get("PAPERCLIP_URL", "http://localhost:3100").rstrip("/")
    paperclip_token = os.environ.get("PAPERCLIP_TOKEN", "")
    company_id = os.environ.get("PAPERCLIP_COMPANY_ID", "")
    now = datetime.now(timezone.utc)
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{paperclip_url}/api/companies/{company_id}/agents",
                headers={"Authorization": f"Bearer {paperclip_token}"},
                timeout=_CHECK_TIMEOUT,
            )
        resp.raise_for_status()
        agents = resp.json()
        result = []
        for a in agents:
            hb = a.get("lastHeartbeatAt")
            age_h: float | None = None
            freshness = "unknown"
            if hb:
                try:
                    hb_dt = datetime.fromisoformat(hb.replace("Z", "+00:00"))
                    age_h = round((now - hb_dt).total_seconds() / 3600, 1)
                    freshness = "fresh" if age_h < 6 else ("stale" if age_h < 24 else "dead")
                except ValueError:
                    pass
            result.append({
                "role": a.get("nameKey", a.get("name", "unknown")),
                "status": a.get("status", "unknown"),
                "adapter": a.get("adapterType"),
                "freshness": freshness,
                "age_hours": age_h,
                "last_heartbeat": hb,
            })
        return {"status": "ok", "agents": result}
    except httpx.TimeoutException:
        return {"status": "down", "error": "timeout", "agents": []}
    except Exception as e:
        return {"status": "error", "error": str(e)[:120], "agents": []}


def _trade_halt_state() -> dict:
    """Read current halt flag state for inclusion in /api/status."""
    halt_path = Path(os.environ.get("AII_HALT_FLAG_PATH", "/data/logs/trade_halt.flag"))
    if not halt_path.exists():
        return {"halted": False}
    try:
        data = json.loads(halt_path.read_text())
        return data
    except Exception:
        return {"halted": True, "reason": "flag file unreadable"}


def _cron_supervisor() -> dict:
    log_path = Path("/data/logs/health-cron.log")
    now = datetime.now(timezone.utc)
    try:
        if not log_path.exists():
            return _service("cron_supervisor", "unknown", reason="log not found")
        mtime = log_path.stat().st_mtime
        mtime_dt = datetime.fromtimestamp(mtime, tz=timezone.utc)
        age_h = round((now - mtime_dt).total_seconds() / 3600, 1)
        status = "ok" if age_h < 2 else ("stale" if age_h < 6 else "down")
        return _service(
            "cron_supervisor",
            status,
            last_run=mtime_dt.isoformat(),
            age_hours=age_h,
        )
    except Exception as e:
        return _service("cron_supervisor", "error", error=str(e)[:120])


@router.get("/status")
async def get_status(_: None = Depends(_require_board_auth)):
    """Aggregate health of all AI-Investiture services. Returns within 5 seconds."""
    checked_at = datetime.now(timezone.utc).isoformat()

    async with httpx.AsyncClient() as client:
        http_results = await asyncio.gather(
            _http_check(client, "http://aii-pr-agent:8390/health", "pr_agent"),
            _http_check(client, "http://ai-investiture-dashboard:80/health", "nginx"),
            _tcp_check("host.containers.internal", 14222, "nats"),
            _alpaca_check(client),
        )

    agents_result, cron_result, halt_state = await asyncio.gather(
        _agent_heartbeats(),
        asyncio.to_thread(_cron_supervisor),
        asyncio.to_thread(_trade_halt_state),
    )

    pr_agent, nginx, nats, alpaca = http_results

    services = {
        "backend": _service("backend", "ok"),
        "pr_agent": pr_agent,
        "nginx": nginx,
        "nats": nats,
        "alpaca": alpaca,
        "cron_supervisor": cron_result,
    }

    degraded_statuses = {"down", "degraded", "stale", "error"}
    service_statuses = [v["status"] for v in services.values()]
    if any(s == "down" for s in service_statuses):
        overall = "degraded"
    elif any(s in degraded_statuses for s in service_statuses):
        overall = "degraded"
    else:
        overall = "ok"

    # Include top-level Alpaca fields for backward compat with Layout status indicator
    return JSONResponse({
        "status": overall,
        "connected": alpaca.get("connected", False),
        "account_number": alpaca.get("account_number", ""),
        "checked_at": checked_at,
        "services": services,
        "agent_heartbeats": agents_result,
        "trade_halt": halt_state,
    })
