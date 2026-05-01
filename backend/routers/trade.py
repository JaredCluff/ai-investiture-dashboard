"""Trade control endpoints — kill-switch for halting all trading (AII-314)."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(tags=["trade"])

# Halt flag lives in the shared logs volume (writable from backend container).
# On host: ~/.ai-investiture/logs/trade_halt.flag
# In container: /data/logs/trade_halt.flag
# Strategy module reads the same path via AII_HALT_FLAG_PATH env var.
_HALT_FLAG_PATH = Path(os.environ.get("AII_HALT_FLAG_PATH", "/data/logs/trade_halt.flag"))


def _require_board_auth(x_api_key: str = Header(default="")) -> None:
    expected = os.environ.get("DASHBOARD_API_KEY", "")
    if not expected or x_api_key != expected:
        raise HTTPException(status_code=401, detail="Board access only. Authentication required.")


class HaltRequest(BaseModel):
    reason: str = "Manual kill-switch"


def _read_halt_state() -> dict:
    """Return current halt state as a dict."""
    if not _HALT_FLAG_PATH.exists():
        return {"halted": False}
    try:
        data = json.loads(_HALT_FLAG_PATH.read_text())
        return data
    except Exception:
        # Flag file exists but is unreadable — treat as halted (safe default)
        return {"halted": True, "halted_at": None, "reason": "flag file unreadable", "halted_by": "unknown"}


@router.get("/trade/status")
async def get_trade_status(_: None = Depends(_require_board_auth)):
    """Return current trading halt state."""
    state = _read_halt_state()
    return JSONResponse(state)


@router.post("/trade/halt")
async def halt_trading(req: HaltRequest, _: None = Depends(_require_board_auth)):
    """Activate the trading kill-switch. Writes a halt flag file checked by the strategy module."""
    if _read_halt_state().get("halted"):
        return JSONResponse({"ok": True, "message": "Already halted", "state": _read_halt_state()})

    state = {
        "halted": True,
        "halted_at": datetime.now(timezone.utc).isoformat(),
        "reason": req.reason[:500],
        "halted_by": "api",
    }
    _HALT_FLAG_PATH.parent.mkdir(parents=True, exist_ok=True)
    _HALT_FLAG_PATH.write_text(json.dumps(state, indent=2))
    return JSONResponse({"ok": True, "message": "Trading halted", "state": state})


@router.post("/trade/resume")
async def resume_trading(_: None = Depends(_require_board_auth)):
    """Clear the trading kill-switch flag, allowing orders to proceed."""
    if not _read_halt_state().get("halted"):
        return JSONResponse({"ok": True, "message": "Not currently halted"})

    _HALT_FLAG_PATH.unlink(missing_ok=True)
    return JSONResponse({"ok": True, "message": "Trading resumed"})
