import os
import json
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter(tags=["momentum"])

AGENTS_DIR = Path(os.environ.get("AGENTS_DIR", "/data/agents"))

SECTOR_NAMES = {
    "XLK": "Technology", "XLF": "Financials", "XLE": "Energy",
    "XLV": "Health Care", "XLY": "Cons. Discret.", "XLP": "Cons. Staples",
    "XLI": "Industrials", "XLU": "Utilities", "XLC": "Comm. Services",
    "XLRE": "Real Estate",
}

@router.get("/momentum")
async def get_momentum():
    scores_path = AGENTS_DIR / "portfolio-manager" / "live-scores.json"
    if scores_path.exists():
        try:
            data = json.loads(scores_path.read_text())
            scores = data.get("scores", [])
            date = data.get("date")
            result = []
            for s in scores:
                ticker = s.get("ticker", "")
                result.append({
                    "ticker": ticker,
                    "sector": SECTOR_NAMES.get(ticker, ticker),
                    "momentum_score": s["momentum_score"] if "momentum_score" in s else s.get("score"),
                    "r_1w": s["r_1w"] if "r_1w" in s else s.get("r1w"),
                    "r_1m": s["r_1m"] if "r_1m" in s else s.get("r1m"),
                    "r_3m": s["r_3m"] if "r_3m" in s else s.get("r3m"),
                    "price": s.get("price"),
                    "sma_50": s["sma_50"] if "sma_50" in s else s.get("sma50"),
                    "above_sma": s.get("above_sma", False),
                    "eligible": s.get("eligible"),
                    "exclusion_reason": s.get("exclusion_reason"),
                    "dist_pct": s.get("dist_pct"),
                })
            return {"scores": result, "date": date, "stale": False}
        except Exception:
            pass
    return {"scores": [], "date": None, "stale": True}
