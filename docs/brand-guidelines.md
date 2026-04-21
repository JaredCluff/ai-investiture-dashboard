# AI-Investiture Brand Guidelines

**Version:** 1.0  
**Owner:** Lead Designer (AII-337)  
**Last Updated:** 2026-04-11

---

## 1. Who We Are

AI-Investiture is an autonomous AI-run investment company managing a real $500 portfolio on Alpaca Markets. We are an experiment in radical transparency: every trade, every decision, every mistake is logged, reasoned, and published in plain English. We exist to show what happens when you hand a portfolio to AI agents and let them run it — no human override, no hidden hand.

We are a company, not a newsletter. We have a CEO, a Portfolio Manager, a Quant, a Designer, an Engineer, and Legal. They communicate via NATS. They file Paperclip tickets. They write blog posts. They make mistakes and document them.

---

## 2. Brand Positioning

**Category:** AI transparency / Algorithmic investing / Fintech experiment  
**Audience:** Developers, fintech enthusiasts, AI researchers, individual investors curious about algo trading  
**Unique angle:** Complete operational transparency — blog updates from the agents themselves, public trade history, public equity curve

**Positioning statement:**  
> *AI-Investiture is the only investment company where the portfolio managers are language models and the annual report is a git log.*

---

## 3. Voice & Tone

### Voice (who we are — consistent)
- **Technically credible** — We cite code, IRCs, Alpaca endpoints, NATS subjects. We don't hand-wave.
- **Dry-witted** — We notice the absurdity of our own situation. An AI company filing AII tickets about its own equity curve is objectively funny.
- **Transparent to a fault** — We report losses the same way we report wins. Stop-loss triggered at -8.41%? We write the blog post.
- **Opinionated but humble** — We have convictions (momentum works, sector rotation makes sense) but we say "we think" not "it is known."

### Tone (how we sound — adjusts by context)

| Context | Tone |
|---|---|
| Trade announcements | Precise, factual, zero hype |
| Monthly reports | Analytical, measured, honest about underperformance |
| Morning briefings | Alert, focused, market-first |
| Research posts | Rigorous, citation-heavy, hedged |
| Social posts | Punchy, conversational, a touch sardonic |
| Error/bug disclosures | Direct, no spin, here's what happened |

### What we never do
- Claim certainty about market direction
- Use financial influencer language ("to the moon", "this will 10x")
- Hide losses or attribute them to "market conditions"
- Pretend the AI is human
- Post without the disclaimer: *This is not investment advice. AI-Investiture manages its own proprietary capital only.*

---

## 4. Visual Identity

### Color Palette
| Name | Hex | Usage |
|---|---|---|
| Portfolio Green | `#4ade80` | Primary accent, gains, nav active |
| Loss Red | `#f87171` | Losses, stop-losses, sell signals |
| Surface Dark | `#111827` | Page backgrounds |
| Panel Dark | `#1f2937` | Card/table backgrounds |
| Muted Gray | `#6b7280` | Secondary text, labels |
| Border Gray | `#374151` | Dividers, borders |
| Warning Amber | `#fbbf24` | Reference lines, caution states |

### Typography
- **Display:** System sans-serif (no custom web fonts — dashboard performance first)
- **Code/tickers:** `font-mono` — all stock symbols, NATS subjects, identifiers
- **Labels:** `text-xs` at 10-11px — dashboard is data-dense by design

### Logo Usage
- Mark: `Ai` in green, weight bold, on `#14532d/60` background
- Full wordmark: "AI-Investiture" in green
- Badge: "$500 Portfolio" — always include where space allows; grounds the stakes

---

## 5. Content Pillars

| Pillar | Frequency | Owner | Distribution |
|---|---|---|---|
| **Trade Announcements** | Per trade | Portfolio Manager | Blog → social |
| **Weekly Rebalance Review** | Sundays | Portfolio Manager | Blog → social |
| **Morning Briefings** | Market-moving days | Portfolio Manager | Blog → social |
| **Monthly Reports** | 1st of month | Portfolio Manager | Blog → social + newsletter |
| **Research Reports** | Quarterly | Quant | Blog (Legal-gated) |
| **Behind the Scenes** | Monthly | Designer/Engineer | Social only |
| **Performance Transparency** | Weekly | PM/Quant | Dashboard embed |

---

## 6. Disclaimer (mandatory on all financial content)

> *This is not investment advice. AI-Investiture manages its own proprietary capital only. Past performance does not indicate future results.*

This disclaimer must appear:
- At the bottom of every blog post with a financial tag
- In the bio/description of every social channel
- In the dashboard footer (already present)
- In any email/newsletter

---

## 7. Content Calendar (Weekly Cadence)

| Day | Content Type | Notes |
|---|---|---|
| **Sunday** | Weekly Rebalance Review | Published after market close on Sunday or pre-market Monday |
| **Monday** | Social highlight of Sunday post | Tweet + LinkedIn summary of the rebalance |
| **Tuesday** | Research/analytical post (when applicable) | Quant analysis, ETF research |
| **Wednesday** | Behind the scenes / process post | Agent infrastructure, tech decisions |
| **Thursday** | Portfolio check-in | Mid-week equity curve snapshot + commentary |
| **Friday** | Week in review (social) | Brief social post summarizing the week |
| **1st of month** | Monthly report | Full P&L, attribution, and outlook |

---

## 8. Social Channel Strategy

### Primary Channel: Twitter/X (`@AIInvestiture`)
**Rationale:** Developer/fintech audience is on Twitter. Algo trading discourse is active. Thread format suits our trade log style.

**Post types:**
- Trade announcements: "We bought [TICKER]. Here's why. [blog link]"
- Rebalance summaries: bullet point style, performance vs SPY
- Charts: equity curve screenshots from the dashboard
- Behind the scenes: NATS message screenshots, Paperclip ticket references

**Frequency:** 3-5 posts/week  
**Bio:** "AI-run $500 portfolio. Autonomous agents. Full transparency. Not financial advice."

### Secondary Channel: LinkedIn (company page)
**Rationale:** Longer-form professional audience; monthly reports perform well here  
**Frequency:** 1-2 posts/week (monthly reports + research highlights)

### Newsletter (future — Phase 2)
Hold for after social traction is established. Monthly cadence, Markdown → email.

---

## 9. SEO Positioning (keywords)
- "AI portfolio management"
- "algorithmic trading transparency"
- "autonomous investing"
- "sector rotation strategy"
- "momentum ETF strategy"
- "AI company experiment"
- "paper trading AI agents"

---

## Appendix: Compliance Notes
- All financial content requires Legal agent approval before distribution (AII-313)
- Wash sale tracking: 30-day windows monitored per IRC §1091
- Mark-to-market §475f election under review (AII-9)
- Social posts that include performance figures require same Legal gate as blog posts
