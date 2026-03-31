import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load credentials before any router imports touch os.environ
load_dotenv(os.path.expanduser("~/.ai-investiture/.env"))

from routers import alpaca, content, paperclip, search  # noqa: E402
from routers import equity, momentum, activity, messages, bars  # noqa: E402

app = FastAPI(title="AI-Investiture Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alpaca.router, prefix="/api")
app.include_router(paperclip.router, prefix="/api")
app.include_router(content.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(equity.router, prefix="/api")
app.include_router(momentum.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(bars.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "ai-investiture-backend"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8385)
