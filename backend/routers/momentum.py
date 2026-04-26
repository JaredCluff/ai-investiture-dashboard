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
                    "momentum_score": s.get("momentum_score") or s.get("score"),
                    "r_1w": s.get("r_1w") or s.get("r1w"),
                    "r_1m": s.get("r_1m") or s.get("r1m"),
                    "r_3m": s.get("r_3m") or s.get("r3m"),
                    "price": s.get("price"),
                    "sma_50": s.get("sma_50") or s.get("sma50"),
                    "above_sma": s.get("above_sma", False),
                    "eligible": s.get("eligible"),
                    "exclusion_reason": s.get("exclusion_reason"),
                    "dist_pct": s.get("dist_pct"),
                })
            return {"scores": result, "date": date, "stale": False}
        except Exception:
            pass
    return {"scores": [], "date": None, "stale": True}
