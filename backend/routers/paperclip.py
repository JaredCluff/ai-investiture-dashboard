import os

import httpx
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from services.redactor import redact

router = APIRouter()


def _paperclip_url() -> str:
    return os.environ.get("PAPERCLIP_URL", "http://localhost:3100").rstrip("/")


def _paperclip_headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {os.environ['PAPERCLIP_TOKEN']}"}


def _company_id() -> str:
    return os.environ["PAPERCLIP_COMPANY_ID"]


@router.get("/agents")
async def get_agents():
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
async def get_org():
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{_paperclip_url()}/api/companies/{_company_id()}/agents",
                headers=_paperclip_headers(),
                timeout=10.0,
            )
        resp.raise_for_status()
        agents = redact(resp.json())
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
    limit: int = Query(default=50),
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
async def get_ticket(identifier: str):
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
async def get_ticket_comments(identifier: str):
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
