"""
marketing.py — Marketing queue and brand metrics endpoints (AII-337)

Serves:
  GET /api/marketing/queue   — scheduled social posts from brand-queue.json
  GET /api/marketing/config  — brand config (channel, handle, cadence)

Auth: read auth (X-API-Key or Authorization: Bearer <AGENT_READ_TOKEN>)
"""

import json
import os
from pathlib import Path

from fastapi import APIRouter, Depends

from routers.paperclip import _require_read_auth

router = APIRouter(tags=["marketing"])

# brand-queue.json lives alongside analytics.jsonl in the logs volume
_LOGS_DIR = Path(os.environ.get("ANALYTICS_LOG", "/data/logs/analytics.jsonl")).parent
_QUEUE_PATH = _LOGS_DIR / "brand-queue.json"


def _load_queue() -> dict:
    if not _QUEUE_PATH.exists():
        return {"posts": [], "version": "1.0", "primary_channel": "twitter"}
    try:
        return json.loads(_QUEUE_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {"posts": [], "error": "Failed to read queue"}


@router.get("/marketing/queue")
async def get_marketing_queue(
    _: None = Depends(_require_read_auth),
) -> dict:
    """Return scheduled social posts sorted by date."""
    data = _load_queue()
    posts = data.get("posts", [])
    posts_sorted = sorted(posts, key=lambda p: p.get("scheduled_date", ""))
    return {
        "primary_channel": data.get("primary_channel", "twitter"),
        "handle": data.get("handle", ""),
        "total": len(posts_sorted),
        "posts": posts_sorted,
    }


@router.get("/marketing/config")
async def get_marketing_config(
    _: None = Depends(_require_read_auth),
) -> dict:
    """Return brand config metadata."""
    data = _load_queue()
    return {
        "version": data.get("version", "1.0"),
        "generated_at": data.get("generated_at"),
        "primary_channel": data.get("primary_channel", "twitter"),
        "handle": data.get("handle", ""),
        "ticket": data.get("ticket"),
    }
