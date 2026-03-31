import os
import httpx
from fastapi import APIRouter
from services.redactor import redact

router = APIRouter(tags=["messages"])

PAPERCLIP_URL = lambda: os.environ.get("PAPERCLIP_URL", "http://localhost:3100").rstrip("/")
PAPERCLIP_TOKEN = lambda: os.environ["PAPERCLIP_TOKEN"]
COMPANY_ID = lambda: os.environ["PAPERCLIP_COMPANY_ID"]

@router.get("/messages")
async def get_messages(limit: int = 50):
    """Agent message history derived from Paperclip ticket events."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{PAPERCLIP_URL()}/api/companies/{COMPANY_ID()}/issues",
                headers={"Authorization": f"Bearer {PAPERCLIP_TOKEN()}"},
                params={"limit": min(limit, 100)},
                timeout=10.0,
            )
        resp.raise_for_status()
        issues = redact(resp.json())
        if isinstance(issues, dict):
            issues = issues.get("issues", [])
        issues.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        messages = []
        for issue in issues[:limit]:
            identifier = issue.get("identifier", "")
            status = issue.get("status", "")
            created = issue.get("createdAt", "")
            # Determine from/to based on ticket type and number
            num_str = identifier.split("-")[1] if "-" in identifier else "0"
            num = int(num_str) if num_str.isdigit() else 0
            if status == "done":
                msg_type = "result"
                from_agent = "Engineer" if 18 <= num <= 33 else "Portfolio Manager" if num >= 31 else "Researcher"
                to_agent = "CTO"
            else:
                msg_type = "task"
                from_agent = "CTO"
                to_agent = "Engineer" if 18 <= num <= 33 else "Portfolio Manager" if num >= 31 else "Researcher"
            messages.append({
                "id": issue.get("id", ""),
                "subject": f"agent.{'result' if msg_type == 'result' else 'task'}.{to_agent.lower().replace(' ', '-')}",
                "from": from_agent,
                "to": to_agent,
                "type": msg_type,
                "identifier": identifier,
                "preview": issue.get("title", "")[:80],
                "timestamp": created,
            })
        return messages
    except httpx.HTTPError:
        return []
