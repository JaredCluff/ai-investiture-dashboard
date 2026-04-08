import os
import httpx
from fastapi import APIRouter, Depends, Query
from services.redactor import redact
from routers.paperclip import _require_board_auth

router = APIRouter(tags=["activity"])

PAPERCLIP_URL = lambda: os.environ.get("PAPERCLIP_URL", "http://localhost:3100").rstrip("/")
PAPERCLIP_TOKEN = lambda: os.environ["PAPERCLIP_TOKEN"]
COMPANY_ID = lambda: os.environ["PAPERCLIP_COMPANY_ID"]

AGENT_NAME_MAP = {
    "engineer": "Engineer",
    "portfolio-manager": "Portfolio Manager",
    "researcher": "Researcher",
    "cto": "CTO",
}

@router.get("/activity")
async def get_activity(limit: int = Query(default=20, ge=1, le=200), _: None = Depends(_require_board_auth)):
    """Recent agent actions from Paperclip ticket updates."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{PAPERCLIP_URL()}/api/companies/{COMPANY_ID()}/issues",
                headers={"Authorization": f"Bearer {PAPERCLIP_TOKEN()}"},
                params={"limit": limit},
                timeout=10.0,
            )
        resp.raise_for_status()
        issues = redact(resp.json())
        if isinstance(issues, dict):
            issues = issues.get("issues", [])
        # Sort by updatedAt descending
        issues.sort(key=lambda x: x.get("updatedAt", ""), reverse=True)
        activities = []
        for issue in issues[:limit]:
            identifier = issue.get("identifier", "")
            title = issue.get("title", "")[:60]
            status = issue.get("status", "")
            updated = issue.get("updatedAt", "")
            # Determine agent from identifier prefix or assignee
            agent = "System"
            # Map common patterns
            if "AII-" in identifier:
                num = int(identifier.split("-")[1]) if identifier.split("-")[1].isdigit() else 0
                if num in range(1, 9):
                    agent = "CTO"
                elif num in range(9, 18):
                    agent = "Researcher"
                elif num in range(18, 31):
                    agent = "Engineer"
                else:
                    agent = "Portfolio Manager"
            activities.append({
                "agent": agent,
                "action": f"{'Completed' if status == 'done' else 'Updated'} {identifier}: {title}",
                "identifier": identifier,
                "status": status,
                "timestamp": updated,
            })
        return activities
    except httpx.HTTPError:
        return []
