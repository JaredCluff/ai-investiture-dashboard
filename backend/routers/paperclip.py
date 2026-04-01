import asyncio
import os
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import JSONResponse

from services.redactor import redact


def _require_board_auth(x_api_key: str = Header(default="")) -> None:
    """Require a valid dashboard API key for board-only endpoints."""
    expected = os.environ.get("DASHBOARD_API_KEY", "")
    if not expected or x_api_key != expected:
        raise HTTPException(status_code=401, detail="Board access only. Authentication required.")


def _normalize_agent_status(agent: dict, tickets: list[dict] | None = None) -> str:
    """Map raw Paperclip agent status to display status using heartbeat + ticket activity."""
    raw_status = agent.get("status", "offline")
    heartbeat = agent.get("lastHeartbeatAt")
    agent_id = agent.get("id")

    # Check ticket activity to determine working status
    if tickets and agent_id:
        has_work = any(
            t.get("assigneeAgentId") == agent_id
            and t.get("status") in ("in_progress", "todo", "backlog")
            for t in tickets
        )
        if has_work:
            return "active"

    if heartbeat:
        try:
            hb_dt = datetime.fromisoformat(heartbeat.replace("Z", "+00:00"))
            age_seconds = (datetime.now(timezone.utc) - hb_dt).total_seconds()
            if age_seconds < 300:
                return "active"
            if age_seconds < 3600:
                return "idle"
            return "offline"
        except (ValueError, TypeError):
            pass

    # No heartbeat and no tickets — treat "error" as "offline" (session exited normally)
    if raw_status == "error":
        return "offline"
    return raw_status

router = APIRouter()


def _paperclip_url() -> str:
    return os.environ.get("PAPERCLIP_URL", "http://localhost:3100").rstrip("/")


def _paperclip_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {os.environ['PAPERCLIP_TOKEN']}"}


def _company_id() -> str:
    return os.environ["PAPERCLIP_COMPANY_ID"]


@router.get("/agents")
async def get_agents(_: None = Depends(_require_board_auth)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_paperclip_url()}/api/companies/{_company_id()}/agents",
                headers=_paperclip_headers(),
                timeout=10.0,
            )
        resp.raise_for_status()
        return redact(resp.json())
    except httpx.HTTPError as e:
        return JSONResponse({"error": str(e), "source": "paperclip"}, status_code=502)


@router.get("/org")
async def get_org(_: None = Depends(_require_board_auth)):
    try:
        async with httpx.AsyncClient() as client:
            agents_resp, tickets_resp = await asyncio.gather(
                client.get(
                    f"{_paperclip_url()}/api/companies/{_company_id()}/agents",
                    headers=_paperclip_headers(),
                    timeout=10.0,
                ),
                client.get(
                    f"{_paperclip_url()}/api/companies/{_company_id()}/issues",
                    headers=_paperclip_headers(),
                    params={"limit": 200},
                    timeout=10.0,
                ),
            )
        agents_resp.raise_for_status()
        raw_agents = agents_resp.json()
        raw_tickets = tickets_resp.json() if tickets_resp.status_code == 200 else []
        agents = redact(raw_agents)
        if isinstance(agents, list) and isinstance(raw_agents, list):
            for agent, raw in zip(agents, raw_agents):
                agent["status"] = _normalize_agent_status(raw, raw_tickets)
    except httpx.HTTPError as e:
        return JSONResponse({"error": str(e), "source": "paperclip"}, status_code=502)

    return {
        "company": {
            "name": "AI-Investiture",
            "description": "AI-driven investment management platform",
        },
        "agents": agents,
    }


@router.get("/tickets")
async def get_tickets(
    status: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    _: None = Depends(_require_board_auth),
):
    params: dict = {"limit": limit}
    if status:
        params["status"] = status

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_paperclip_url()}/api/companies/{_company_id()}/issues",
                headers=_paperclip_headers(),
                params=params,
                timeout=10.0,
            )
        resp.raise_for_status()
        return redact(resp.json())
    except httpx.HTTPError as e:
        return JSONResponse({"error": str(e), "source": "paperclip"}, status_code=502)


async def _resolve_issue_id(identifier: str) -> str | None:
    """Resolve a human-readable identifier (e.g. 'AII-18') to an internal issue ID."""
    try:
        async with httpx.AsyncClient() as client:
            # First try fetching by identifier query param
            resp = await client.get(
                f"{_paperclip_url()}/api/companies/{_company_id()}/issues",
                headers=_paperclip_headers(),
                params={"identifier": identifier, "limit": 10},
                timeout=10.0,
            )
        resp.raise_for_status()
        data = resp.json()
        issues = data if isinstance(data, list) else data.get("issues", data.get("data", []))
        for issue in issues:
            if issue.get("identifier") == identifier:
                return issue.get("id")
    except httpx.HTTPError:
        pass

    # Fall back: fetch recent issues and search
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_paperclip_url()}/api/companies/{_company_id()}/issues",
                headers=_paperclip_headers(),
                params={"limit": 100},
                timeout=10.0,
            )
        resp.raise_for_status()
        data = resp.json()
        issues = data if isinstance(data, list) else data.get("issues", data.get("data", []))
        for issue in issues:
            if issue.get("identifier") == identifier:
                return issue.get("id")
    except httpx.HTTPError:
        pass

    return None


@router.get("/tickets/{identifier}")
async def get_ticket(identifier: str, _: None = Depends(_require_board_auth)):
    issue_id = await _resolve_issue_id(identifier)
    if not issue_id:
        return JSONResponse(
            {"error": f"Issue '{identifier}' not found", "source": "paperclip"},
            status_code=404,
        )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_paperclip_url()}/api/issues/{issue_id}",
                headers=_paperclip_headers(),
                timeout=10.0,
            )
        resp.raise_for_status()
        return redact(resp.json())
    except httpx.HTTPError as e:
        return JSONResponse({"error": str(e), "source": "paperclip"}, status_code=502)


@router.get("/tickets/{identifier}/comments")
async def get_ticket_comments(identifier: str, _: None = Depends(_require_board_auth)):
    issue_id = await _resolve_issue_id(identifier)
    if not issue_id:
        return JSONResponse(
            {"error": f"Issue '{identifier}' not found", "source": "paperclip"},
            status_code=404,
        )

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_paperclip_url()}/api/issues/{issue_id}/comments",
                headers=_paperclip_headers(),
                timeout=10.0,
            )
        resp.raise_for_status()
        return redact(resp.json())
    except httpx.HTTPError as e:
        return JSONResponse({"error": str(e), "source": "paperclip"}, status_code=502)
