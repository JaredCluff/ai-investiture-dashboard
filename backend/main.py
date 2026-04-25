import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

# Load credentials before any router imports touch os.environ
load_dotenv(os.path.expanduser("~/.ai-investiture/.env"))

from routers import alpaca, content, paperclip, search  # noqa: E402
from routers import equity, momentum, activity, messages, bars, analytics  # noqa: E402
from routers import status  # noqa: E402
from routers import trade  # noqa: E402
from routers import marketing  # noqa: E402

app = FastAPI(title="AI-Investiture Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8384",
        "http://localhost:5173",
        "https://investments.knowledgenexus.ai",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)

_DASHBOARD_API_KEY = os.environ.get("DASHBOARD_API_KEY", "")

_PUBLIC_POST_PATHS = {"/api/analytics/hit"}

@app.middleware("http")
async def api_key_middleware(request: Request, call_next) -> Response:
    """Require X-API-Key header on all /api/ POST routes except health and public analytics."""
    if (
        _DASHBOARD_API_KEY
        and request.url.path.startswith("/api/")
        and request.method not in ("GET", "HEAD", "OPTIONS")
        and request.url.path not in _PUBLIC_POST_PATHS
    ):
        key = request.headers.get("X-API-Key", "")
        if key != _DASHBOARD_API_KEY:
            return Response(
                content='{"detail":"Unauthorized"}',
                status_code=401,
                media_type="application/json",
            )
    return await call_next(request)

app.include_router(alpaca.router, prefix="/api")
app.include_router(paperclip.router, prefix="/api")
app.include_router(content.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(equity.router, prefix="/api")
app.include_router(momentum.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(bars.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(status.router, prefix="/api")
app.include_router(trade.router, prefix="/api")
app.include_router(marketing.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ai-investiture-backend"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8385)
