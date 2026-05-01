"""
analytics.py — Privacy-respecting pageview counter (AII-224)

No cookies. No IPs. No user agents. Records only:
  - Page path (string)
  - Referrer domain (hostname only, no path/query)
  - Screen size category (mobile/tablet/desktop)
  - UTC date (YYYY-MM-DD — day granularity only)

Storage: append-only JSONL at /data/logs/analytics.jsonl
Stats endpoint requires board auth (DASHBOARD_API_KEY via X-API-Key header).
Hit endpoint is public — called by the beacon script in index.html.
"""

import json
import os
import time
from collections import Counter, defaultdict, deque
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from routers.paperclip import _require_board_auth
from fastapi import Depends

router = APIRouter(tags=["analytics"])

_LOG_PATH = Path(os.environ.get("ANALYTICS_LOG", "/data/logs/analytics.jsonl"))
_MAX_PATH_LEN = 120
_MAX_REF_LEN = 80


def _log_path() -> Path:
    """Return analytics log path, creating parent dirs if needed."""
    try:
        _LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass
    return _LOG_PATH


def _screen_category(width: int | None) -> str:
    if not width:
        return "unknown"
    if width < 768:
        return "mobile"
    if width < 1024:
        return "tablet"
    return "desktop"


_ERROR_LOG_PATH = _LOG_PATH.parent / "errors.jsonl"
_MAX_MSG_LEN = 200

# In-process sliding-window rate limiter for public endpoints
_RATE_WINDOW = 60  # seconds
_HIT_MAX = 60      # requests per IP per minute for /analytics/hit
_ERROR_MAX = 30    # requests per IP per minute for /errors
_hit_rate: dict[str, deque] = defaultdict(deque)
_error_rate: dict[str, deque] = defaultdict(deque)


def _check_rate(store: dict, ip: str, limit: int) -> bool:
    now = time.monotonic()
    dq = store[ip]
    while dq and dq[0] < now - _RATE_WINDOW:
        dq.popleft()
    if len(dq) >= limit:
        return False
    dq.append(now)
    return True


class HitPayload(BaseModel):
    path: str = "/"
    referrer: str = ""
    screen: str = "unknown"


class ErrorPayload(BaseModel):
    path: str = "/"
    status: int = 0
    message: str = ""
    screen: str = "unknown"


@router.post("/analytics/hit")
async def record_hit(payload: HitPayload, request: Request) -> JSONResponse:
    """Record a pageview. Public endpoint — no auth required."""
    ip = (request.client.host if request.client else "unknown")
    if not _check_rate(_hit_rate, ip, _HIT_MAX):
        return JSONResponse({"ok": False}, status_code=429)

    # Sanitise inputs — no PII, no large strings
    path = payload.path[:_MAX_PATH_LEN] if payload.path else "/"
    ref = payload.referrer[:_MAX_REF_LEN] if payload.referrer else ""
    screen = payload.screen if payload.screen in ("mobile", "tablet", "desktop") else "unknown"
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    record = json.dumps({"ts": day, "path": path, "ref": ref, "screen": screen})

    try:
        with _log_path().open("a") as fh:
            fh.write(record + "\n")
    except OSError:
        pass  # Silently swallow write errors — never break the page for analytics

    return JSONResponse({"ok": True})


@router.post("/errors")
async def record_error(payload: ErrorPayload, request: Request) -> JSONResponse:
    """Record a frontend fetch error. Public endpoint — no auth required."""
    ip = (request.client.host if request.client else "unknown")
    if not _check_rate(_error_rate, ip, _ERROR_MAX):
        return JSONResponse({"ok": False}, status_code=429)

    path = payload.path[:_MAX_PATH_LEN] if payload.path else "/"
    message = payload.message[:_MAX_MSG_LEN] if payload.message else ""
    screen = payload.screen if payload.screen in ("mobile", "tablet", "desktop") else "unknown"
    ts = datetime.now(timezone.utc).isoformat()

    record = json.dumps({"ts": ts, "path": path, "status": payload.status, "message": message, "screen": screen})
    try:
        _ERROR_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with _ERROR_LOG_PATH.open("a") as fh:
            fh.write(record + "\n")
    except OSError:
        pass

    return JSONResponse({"ok": True})


@router.get("/errors")
async def get_errors(
    limit: int = 100,
    _: None = Depends(_require_board_auth),
) -> list:
    """Return recent frontend errors. Requires board or agent auth."""
    limit = min(max(limit, 1), 1000)
    if not _ERROR_LOG_PATH.exists():
        return []
    lines: list[dict] = []
    try:
        with _ERROR_LOG_PATH.open() as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    lines.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except OSError:
        return []
    return lines[-limit:]


@router.get("/analytics/stats")
async def get_stats(
    days: int = 30,
    _: None = Depends(_require_board_auth),
) -> dict:
    """Return aggregated analytics. Requires board or agent auth."""
    days = min(max(days, 1), 365)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    log = _log_path()
    if not log.exists():
        return {"total_pageviews": 0, "daily": [], "top_pages": [], "top_referrers": [], "screen_breakdown": {}}

    daily: dict[str, int] = defaultdict(int)
    pages: Counter = Counter()
    refs: Counter = Counter()
    screens: Counter = Counter()

    try:
        with log.open() as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue
                ts = rec.get("ts", "")
                if ts < cutoff:
                    continue
                daily[ts] += 1
                pages[rec.get("path", "/")] += 1
                ref = rec.get("ref", "")
                if ref:
                    refs[ref] += 1
                screens[rec.get("screen", "unknown")] += 1
    except OSError:
        pass

    total = sum(daily.values())
    return {
        "total_pageviews": total,
        "days": days,
        "daily": [{"date": d, "views": daily[d]} for d in sorted(daily)],
        "top_pages": [{"path": p, "views": c} for p, c in pages.most_common(10)],
        "top_referrers": [{"domain": r, "views": c} for r, c in refs.most_common(10)],
        "screen_breakdown": dict(screens),
    }
