import asyncio
import os
import re
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str
    limit: int = Field(default=10, ge=1, le=100)

router = APIRouter(tags=["content"])

AGENTS_DIR = Path(os.environ.get("AGENTS_DIR", "/data/agents"))
BLOG_DIR = Path(os.environ.get("BLOG_DIR", "/data/blog"))
KN_RETRIEVAL_URL = os.environ.get("KN_RETRIEVAL_URL", "http://localhost:8003")
KN_INTERNAL_SERVICE_TOKEN = os.environ.get("KN_INTERNAL_SERVICE_TOKEN", "")
KN_INGESTION_URL = os.environ.get("KN_INGESTION_URL", "http://host.containers.internal:8004")

DISCLAIMER_TEXT = "\n\n---\n*This is not investment advice. AI-Investiture manages its own proprietary capital only.*\n"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_research_file(path: Path, agent_role: str) -> dict | None:
    try:
        text = path.read_text(encoding="utf-8")
        # Extract title from first # heading
        title_match = re.search(r'^#\s+(.+)$', text, re.MULTILINE)
        title = title_match.group(1).strip() if title_match else path.stem
        # Extract date from content (look for **Date:** pattern or frontmatter)
        date_match = re.search(r'\*\*Date:\*\*\s*(.+)', text)
        if date_match:
            date_str = date_match.group(1).strip()
        else:
            iso_match = re.search(r'(\d{4}-\d{2}-\d{2})', path.stem)
            date_str = iso_match.group(1) if iso_match else None
        # Summary: first non-heading prose paragraph (skip metadata, tables, rules)
        lines = text.split('\n')
        summary = ''
        for line in lines:
            stripped = line.strip()
            if (stripped
                    and not stripped.startswith('#')
                    and not stripped.startswith('**')
                    and not stripped.startswith('|')
                    and not stripped.startswith('---')
                    and not stripped.startswith('>')
                    and len(stripped) > 30):
                summary = stripped[:200] + ('...' if len(stripped) > 200 else '')
                break
        return {
            "id": path.stem,
            "title": title,
            "author_role": agent_role,
            "date": date_str,
            "summary": summary,
            "filename": path.name,
        }
    except Exception:
        return None


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Parse YAML-like frontmatter from --- delimited block."""
    if not text.startswith('---'):
        return {}, text
    end = text.find('---', 3)
    if end == -1:
        return {}, text
    fm_text = text[3:end].strip()
    body = text[end + 3:].strip()
    meta = {}
    for line in fm_text.split('\n'):
        if ':' in line:
            k, _, v = line.partition(':')
            meta[k.strip()] = v.strip().strip('"\'')
    return meta, body


def _parse_tags(raw: str) -> list[str]:
    """Split tag string into list, handling both 'a, b' and YAML '[a, b]' syntax."""
    return [t.strip() for t in raw.strip().strip("[]").split(",") if t.strip()]


async def _index_to_kn(title: str, content: str, source: str, metadata: dict) -> None:
    """Index a document into Knowledge Nexus. Intended to be called via asyncio.create_task — never awaited directly from GET endpoints."""
    if not KN_INTERNAL_SERVICE_TOKEN:
        return
    headers = {
        "Content-Type": "application/json",
        "X-User-ID": "ai-investiture-backend",
        "X-Internal-Service-Token": KN_INTERNAL_SERVICE_TOKEN,
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{KN_INGESTION_URL}/research/ingest",
                headers=headers,
                json={"title": title, "content": content, "source": source, "metadata": metadata},
            )
    except Exception:
        pass  # best-effort, never block the response


# ---------------------------------------------------------------------------
# Research endpoints
# ---------------------------------------------------------------------------

@router.get("/research")
async def list_research():
    reports = []
    if AGENTS_DIR.exists():
        for agent_dir in AGENTS_DIR.iterdir():
            if agent_dir.is_dir():
                role = agent_dir.name
                for md_file in agent_dir.rglob("AII-*.md"):
                    parsed = parse_research_file(md_file, role)
                    if parsed:
                        reports.append(parsed)
    reports.sort(key=lambda r: r.get("date") or "", reverse=True)
    return reports


@router.post("/research/index-all")
async def index_all_research():
    """Index all research files and blog posts into Knowledge Nexus."""
    indexed = []
    errors = []

    if AGENTS_DIR.exists():
        for agent_dir in AGENTS_DIR.iterdir():
            if agent_dir.is_dir():
                for md_file in agent_dir.rglob("AII-*.md"):
                    parsed = parse_research_file(md_file, agent_dir.name)
                    if parsed:
                        try:
                            await _index_to_kn(
                                title=parsed["title"],
                                content=md_file.read_text(encoding="utf-8"),
                                source=f"research/{md_file.stem}",
                                metadata={
                                    "report_id": md_file.stem,
                                    "author_role": parsed["author_role"],
                                    "date": parsed.get("date"),
                                },
                            )
                            indexed.append(md_file.stem)
                        except Exception as e:
                            errors.append({"file": md_file.stem, "error": str(e)})

    if BLOG_DIR.exists():
        for md_file in BLOG_DIR.glob("*.md"):
            try:
                text = md_file.read_text(encoding="utf-8")
                meta, body = parse_frontmatter(text)
                await _index_to_kn(
                    title=meta.get("title", md_file.stem),
                    content=body,
                    source=f"blog/{md_file.stem}",
                    metadata={"slug": md_file.stem, "date": meta.get("date")},
                )
                indexed.append(f"blog/{md_file.stem}")
            except Exception as e:
                errors.append({"file": str(md_file), "error": str(e)})

    return {"indexed": indexed, "errors": errors}


@router.get("/research/{report_id}")
async def get_research(report_id: str):
    if not re.match(r'^[a-zA-Z0-9_\-]+$', report_id):
        raise HTTPException(status_code=400, detail="Invalid report ID")
    if AGENTS_DIR.exists():
        for agent_dir in AGENTS_DIR.iterdir():
            if agent_dir.is_dir():
                for md_file in agent_dir.rglob(f"{report_id}.md"):
                    parsed = parse_research_file(md_file, agent_dir.name)
                    if parsed:
                        text = md_file.read_text(encoding="utf-8")
                        parsed["content"] = text
                        asyncio.create_task(_index_to_kn(
                            title=parsed["title"],
                            content=text,
                            source=f"research/{report_id}",
                            metadata={
                                "report_id": report_id,
                                "author_role": parsed["author_role"],
                                "date": parsed.get("date"),
                            },
                        ))
                        return parsed
    raise HTTPException(status_code=404, detail="Report not found")


# ---------------------------------------------------------------------------
# Blog endpoints
# ---------------------------------------------------------------------------

@router.get("/blog")
async def list_blog():
    posts = []
    if BLOG_DIR.exists():
        for md_file in sorted(BLOG_DIR.glob("*.md"), reverse=True):
            try:
                text = md_file.read_text(encoding="utf-8")
                meta, body = parse_frontmatter(text)
                slug = md_file.stem
                title = meta.get("title") or slug
                posts.append({
                    "slug": slug,
                    "title": title,
                    "date": meta.get("date"),
                    "author": meta.get("author", "Portfolio Manager"),
                    "tags": _parse_tags(meta.get("tags", "")),
                    "summary": meta.get("summary") or body[:200],
                })
            except Exception:
                continue
    return posts


@router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    safe_slug = re.sub(r'[^a-zA-Z0-9_\-]', '', slug)
    if BLOG_DIR.exists():
        md_file = BLOG_DIR / f"{safe_slug}.md"
        if md_file.exists():
            text = md_file.read_text(encoding="utf-8")
            meta, body = parse_frontmatter(text)
            if "not investment advice" not in body.lower():
                body += DISCLAIMER_TEXT
            asyncio.create_task(_index_to_kn(
                title=meta.get("title", safe_slug),
                content=body,
                source=f"blog/{safe_slug}",
                metadata={
                    "slug": safe_slug,
                    "date": meta.get("date"),
                    "author": meta.get("author", "Portfolio Manager"),
                    "tags": _parse_tags(meta.get("tags", "")),
                },
            ))
            return {
                "slug": safe_slug,
                "title": meta.get("title", safe_slug),
                "date": meta.get("date"),
                "author": meta.get("author", "Portfolio Manager"),
                "tags": _parse_tags(meta.get("tags", "")),
                "content": body,
            }
    raise HTTPException(status_code=404, detail="Post not found")


# ---------------------------------------------------------------------------
# Search endpoint
# ---------------------------------------------------------------------------

@router.post("/search")
async def search(body: SearchRequest):
    query, limit = body.query, body.limit
    if not query.strip():
        return {"answer": None, "citations": [], "results": []}
    headers = {
        "Content-Type": "application/json",
        "X-User-ID": "ai-investiture-backend",
        "X-Internal-Service-Token": KN_INTERNAL_SERVICE_TOKEN,
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{KN_RETRIEVAL_URL}/query/unified",
                headers=headers,
                json={
                    "query": query,
                    "max_results": limit,
                    "generate_answer": True,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "answer": data.get("answer") or None,
                "answer_confidence": data.get("answer_confidence"),
                "citations": data.get("citations", []),
                "chunks": [
                    {
                        "title": c.get("title") or c.get("metadata", {}).get("title") or c.get("source", ""),
                        "snippet": c.get("content", "")[:300],
                        "source": c.get("source", ""),
                        "score": c.get("score"),
                    }
                    for c in data.get("chunks", [])[:limit]
                ],
                "query_type": data.get("query_type"),
                "processing_time_ms": data.get("processing_time_ms"),
            }
    except httpx.HTTPError:
        return {"error": "Search service unavailable", "answer": None, "citations": [], "chunks": []}
