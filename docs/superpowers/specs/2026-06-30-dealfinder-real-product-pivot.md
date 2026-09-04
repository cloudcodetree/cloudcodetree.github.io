# DealFinder — Real Product / SaaS Pivot

**Date:** 2026-06-30
**Supersedes the framing of:** `2026-06-29-dealfinder-ai-engineering-capstone-design.md`
(the 15-part course is kept and **re-aimed**, not discarded).

## Why

The course was built on a **synthetic tent catalog** — great for teaching, but the
user's intent is a **real, usable tool**: a deal **scraper/aggregator** that works on
**real data**, deployed, and ultimately a **full end-to-end SaaS** (with real
budget/cost monitoring, not a synthetic demo).

## Decisions (locked with the user)

- **Data sources:** "all of them," behind the existing `DealSource` interface —
  official/affiliate **APIs** (RapidAPI Real-Time Product Search, eBay, Best Buy),
  managed scraping via **Apify** actors, and a keyless real source (**iTunes**) that
  works with zero setup. Each connector reads its token from the env and sits out
  when absent. Self-run scraping only where a site permits it.
- **Sequence:** **real tool first, SaaS later.** Don't build auth/billing before the
  core tool is genuinely usable on real data.
- **Course:** **re-aim it at the real tool** — keep the 15-part spine + animations,
  swap synthetic data for real connectors, and add "go-live / productionize for
  real" parts.
- **Budget/cost monitoring is a real feature**, not a synthetic demo (operational
  FinOps on actual API/LLM spend; later, per-user budgets in the SaaS).
- **Hosting:** the product is a **deployed service** (FastAPI + Postgres/pgvector +
  a scheduled worker), NOT GitHub Pages (static). The course *site* links to the
  live app.

## Architecture (target)

```
              ┌── ApiSource → RapidAPI / eBay / Best Buy ──┐
search "item" ┼── ApifySource → managed scrapers ──────────┼─→ normalize → dedup
              └── ItunesSource (keyless) / permitted scrape ┘        → rank by value
                                                                     → web app / API
```

- **Rank-by-value on real data:** no synthetic "fair price" — the deal signal is the
  market: `% below the median of all offers` for the query (source-agnostic). The
  Part-3 price model becomes an *optional* enrichment where price history exists.
- **Backend:** FastAPI service; Postgres (+pgvector) store/search; scheduled worker
  for "periodic suggestions"; real `CostTracker` wired to live calls + budget alerts.
- **Frontend:** web app (search → ranked deal cards); then SaaS layers.

## Phased roadmap

- **Phase 0 — DONE (companion step 30):** real multi-source connectors
  (iTunes live, RapidAPI/Apify token-gated), `aggregate()`, FastAPI `/search` +
  `/sources` + a `/` web UI. Runs live, real data, no synthetic catalog. Offline
  tests with stub sources.
- **Phase 1 — real retail + persistence:** wire RapidAPI + Apify with the user's free
  tokens; Postgres (+pgvector) for storage and semantic search over real items;
  deploy a public instance (Render/Fly/Railway).
- **Phase 2 — SaaS:** accounts, saved searches, the periodic-suggestions worker,
  **real cost/budget monitoring** dashboard + alerts, email/push notifications.
- **Phase 3 — billing & tiers.**
- **Course re-aim (parallel):** each part's synthetic step gains a real-data variant;
  new parts cover live data sourcing, hosting, accounts, and alerts.

## Open items / needs from the user

- A **free RapidAPI key** and/or **Apify token** to light up real retail deals
  (env: `RAPIDAPI_KEY`, `APIFY_TOKEN`, optional `APIFY_ACTOR`).
- Choice of **host** for the public instance (Render / Fly / Railway).

## Out of scope (for now)

Self-operated large-scale scraping of sites that disallow it; payments until Phase 3.
