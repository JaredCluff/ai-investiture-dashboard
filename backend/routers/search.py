import os
import glob
import re
from dataclasses import dataclass

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

router = APIRouter()

AGENTS_DIR = os.environ.get("AGENTS_DIR", os.path.expanduser("~/.ai-investiture/agents"))
BLOG_DIR = os.environ.get("BLOG_DIR", os.path.expanduser("~/.ai-investiture/blog"))


@dataclass
class SearchResult:
    title: str
    snippet: str
    source: str
    score: float
    filename: str


def _load_documents() -> list[dict]:
    """Load all markdown documents from agent dirs and blog."""
    docs = []

    # Research reports
    for path in glob.glob(f"{AGENTS_DIR}/*/AII-*.md"):
        with open(path) as f:
            content = f.read()
        role = path.split("/agents/")[-1].split("/")[0] if "/agents/" in path else "unknown"
        title = os.path.basename(path).replace(".md", "")
        for line in content.split("\n"):
            if line.startswith("# "):
                title = line[2:].strip()
                break
        docs.append({"title": title, "content": content, "source": f"research/{role}", "filename": os.path.basename(path)})

    # Strategy docs
    for path in glob.glob(f"{AGENTS_DIR}/portfolio-manager/*.md"):
        fn = os.path.basename(path)
        if fn == "role-prompt.md":
            continue
        with open(path) as f:
            content = f.read()
        title = fn.replace(".md", "").replace("-", " ").title()
        for line in content.split("\n"):
            if line.startswith("# "):
                title = line[2:].strip()
                break
        docs.append({"title": title, "content": content, "source": "strategy", "filename": fn})

    # Blog posts
    for path in sorted(glob.glob(f"{BLOG_DIR}/*.md")):
        with open(path) as f:
            content = f.read()
        fn = os.path.basename(path)
        title = fn.replace(".md", "").replace("-", " ").title()
        for line in content.split("\n"):
            if line.startswith("# "):
                title = line[2:].strip()
                break
        docs.append({"title": title, "content": content, "source": "blog", "filename": fn})

    return docs


def _search_docs(query: str, limit: int = 10) -> list[dict]:
    """Simple keyword search with relevance scoring."""
    docs = _load_documents()
    terms = [t.lower() for t in query.split() if len(t) > 1]
    if not terms:
        return []

    results = []
    for doc in docs:
        content_lower = doc["content"].lower()
        title_lower = doc["title"].lower()

        # Score: title matches worth 3x, content matches worth 1x
        score = 0.0
        for term in terms:
            title_count = title_lower.count(term)
            content_count = content_lower.count(term)
            score += title_count * 3.0 + content_count * 0.5

        if score > 0:
            # Extract snippet around first match
            snippet = ""
            for term in terms:
                idx = content_lower.find(term)
                if idx >= 0:
                    start = max(0, idx - 80)
                    end = min(len(doc["content"]), idx + 120)
                    snippet = "..." + doc["content"][start:end].replace("\n", " ").strip() + "..."
                    break
            if not snippet:
                snippet = doc["content"][:200].replace("\n", " ").strip() + "..."

            results.append({
                "title": doc["title"],
                "snippet": snippet,
                "source": doc["source"],
                "score": round(score, 2),
                "filename": doc["filename"],
            })

    results.sort(key=lambda r: r["score"], reverse=True)
    return results[:limit]


@router.get("/search")
async def search(query: str = Query(..., min_length=1), limit: int = Query(default=10, le=50)):
    try:
        results = _search_docs(query, limit)
        return {
            "query": query,
            "results": results,
            "total": len(results),
            "engine": "local-fulltext",
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
