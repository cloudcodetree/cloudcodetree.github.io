# Part 14 — The web app (search UI, live/semantic toggle)

**Phase:** P2 · **Data mode:** LIVE · **Companion step:** 30 (NEW)

---

## 1. Objective

Build a browser-accessible search UI over the running DealFinder backend that lets a user type a query, toggle between keyword and semantic search, and see live deal results with two-signal deal scores rendered in real time via Server-Sent Events (SSE).

---

## 2. Prerequisites

- Part 1: Data layer, normalization & the snapshot
- Part 5: Semantic search (embeddings, BM25, RRF, rerank)
- Part 9: Tiered aggregation & resilience (early-stop, circuit breaker, dedup)
- Part 11: The agent (ReAct, text-to-SQL, tools, HITL)
- Part 13: pgvector persistence & semantic search over live deals

---

## 3. By the end, the learner can…

- Serve a static `index.html` + Vanilla JS front end from the FastAPI backend with no build step.
- Wire a search form to the `/search` and `/search/semantic` FastAPI endpoints and render paginated deal cards.
- Stream aggregator progress updates to the browser via SSE (`/search/stream`) so the UI updates as sources reply, not after all are done.
- Toggle between live-aggregator (keyword, BM25) and pgvector semantic search modes within the same UI.
- Read a two-signal deal score (cross-source median + model residual) from the API response and display a clear "great deal / fair / suspicious" badge based on the blended score.

---

## 4. Data

**Mode:** LIVE — the running FastAPI app (`dealfinder/api.py`) must be up with real connectors (Part 7/9) and pgvector populated (Part 13).

Anchor query used throughout the tutorial: **"noise cancelling headphones"** — the same 18-query universe from the frozen snapshot ensures the live results include the hero cast items (the Sony XM5 and Anker Q20i appear consistently for this query against Google Shopping). No snapshot items are fabricated in prose; the snapshot serves as the reference for expected price ranges only:

- Snapshot median for this query: **$162.97**
- Expected price range from live aggregator: $44.99 (Anker Q20i) – $399.99 (Sony XM6)

The `/search/stream` SSE endpoint is the live endpoint under test. The snapshot is not served by the UI; it is the calibration baseline for the worked example narrative.

---

## 5. Worked example

**Input:** User types "noise cancelling headphones" and clicks Search (keyword mode, default).

The SSE stream opens. The browser console shows source-by-source progress events:

```
data: {"source": "google_shopping", "count": 12, "elapsed_ms": 340}
data: {"source": "bestbuy_scraper", "count": 8, "elapsed_ms": 890}
data: {"done": true, "total": 20, "deduped": 17}
```

Deal cards render as each source batch arrives. Three hero-cast cards appear:

| Card | Price | deal_score | Badge |
|---|---|---|---|
| Anker Soundcore Q20i | $44.99 | +0.72 (72% under median $162.97) | GREAT DEAL |
| Sony WH-1000XM5 (Costco) | $162.97 | 0.00 (at median) | FAIR PRICE |
| Bose QuietComfort 45 | $46.00 | model residual flags anomaly (-2.1σ) | SUSPICIOUS |

The Bose card renders with a warning badge: "Price is 86% below median — verify condition before buying." The model residual (Part 3/4) fires the guard because a $329-MSRP flagship at $46 is a statistical outlier across category + brand_tier features.

**Semantic toggle:** User clicks "Semantic" — the UI POSTs to `/search/semantic?q=noise+cancelling+headphones`. pgvector returns the nearest-neighbour embeddings (BAAI/bge-small-en-v1.5, 384-dim). The Sony XM5 and XM6 both surface even if the query were rephrased as "active noise reduction over-ear" — demonstrating the semantic advantage over BM25.

---

## 6. Companion code

**NEW step:** `step-30` in `tutorial-dealfinder` (no prior step covers this).

Files introduced in this step:

- `dealfinder/static/index.html` — single-file UI: search form, mode toggle, deal card template, SSE client (EventSource API, ~150 lines of Vanilla JS + inline CSS).
- `dealfinder/api.py` — adds `GET /search/stream` SSE endpoint (wraps the existing `aggregate()` tiered call, yields `text/event-stream` progress events) and `StaticFiles` mount for `dealfinder/static/`.
- `dealfinder/deal_score.py` — exports `render_badge(deal_pct, residual_z)` → `"GREAT_DEAL" | "FAIR" | "SUSPICIOUS"` (thresholds: deal_pct ≥ 0.30 AND residual_z < 2.0 → GREAT_DEAL; residual_z ≥ 2.0 → SUSPICIOUS regardless of deal_pct).

Reuses without modification: `dealfinder/aggregate.py` (tiered aggregation, circuit breaker from Part 9), `dealfinder/search.py` (BM25 + RRF from Part 5), `dealfinder/pgvector_store.py` (semantic search from Part 13).

Compare URL pattern: `github.com/cloudcodetree/tutorial-dealfinder/compare/step-29...step-30`

---

## 7. Animations

**Animation 1 — REUSE `HybridFusion`** re-themed: relabel the two input lanes as "Keyword / BM25" and "Semantic / pgvector" (instead of the original two-source fusion). The merge node shows RRF score combination. Electronics-specific: use headphone card shapes in the output lane. Concept made visible: why the toggle matters — two retrieval paths, one ranked list.

**Animation 2 — NEW: `SSEStream`** — visual metaphor: a horizontal pipe from Server to Browser, segmented into labeled chunks ("google_shopping · 12 items", "bestbuy · 8 items", "done"). Each chunk lights up in sequence as if flowing through the pipe. The browser end shows a deal-card stack growing as chunks arrive, contrasted with a greyed-out "waiting for all sources" bar that shows what a naïve request/response would look like. Concept made visible: SSE lets the UI update incrementally — latency perception vs. actual latency. Static-export-safe: Framer Motion `animate` on segment opacity + card-stack height, no runtime fetch.

---

## 8. Teaching beats

1. **Concept: why a UI at all?** The agent (Part 11) and MCP server (Part 12) are API surfaces — the UI is the product the end user actually touches. Motivation: the same FastAPI that powers the agent can serve a browser with zero extra infrastructure.
2. **Code: mount `StaticFiles` + serve `index.html`.** One `app.mount("/", StaticFiles(..., html=True))` line. Run `uvicorn dealfinder.api:app` and open `localhost:8000`.
3. **Concept: request/response vs. SSE.** A single `/search` call blocks until all sources finish (~2–4 s with circuit breakers). SSE emits partial results as sources reply. Show latency difference with the hero query.
4. **Code: `EventSource` client + `yield` SSE endpoint.** Walk through the `async for source, batch in aggregate_stream(q):` generator pattern in `api.py`, then the `new EventSource(url)` listener in `index.html`.
5. **Proof: live run.** `uvicorn dealfinder.api:app --reload`, open browser, type "noise cancelling headphones." First card (Anker Q20i, $44.99, GREAT DEAL badge) appears within ~400 ms of the Google Shopping source responding.
6. **Concept: mode toggle.** Click Semantic — the same query hits pgvector. Results differ: semantic mode surfaces the Sony XM6 even without exact keyword match. Explain why (embedding similarity vs. BM25 term frequency).
7. **Code: badge logic.** `render_badge()` — two-signal rule. Show Bose QC45 at $46 triggering SUSPICIOUS because residual_z = 2.3 (model says fair price ≈ $180, actual = $46 → 2.9σ below).
8. **Proof: badge correctness.** Run `pytest tests/test_deal_score.py` — three parametrized cases cover all three badge states using snapshot-derived inputs.

---

## 9. Cross-references

**Back:** Part 13 (pgvector persistence & semantic search over live deals) built the vector store that powers the semantic search toggle in this part's UI — without it, the Semantic mode button would have nothing to query.

**Forward:** Part 15 (dataset engineering: sampling, labeling, leakage, temporal splits) zooms out from the live product to ask how we'd systematically build and audit training data at scale — the web app's query logs become the seed for the labeling pipeline.

---

## 10. Reproducibility checks

```python
# tests/test_deal_score.py
from dealfinder.deal_score import render_badge

def test_great_deal():
    # Anker Q20i: 72% under median, model residual z=0.4
    assert render_badge(deal_pct=0.72, residual_z=0.4) == "GREAT_DEAL"

def test_fair_price():
    # Sony XM5 at median: deal_pct=0.0, residual_z=0.1
    assert render_badge(deal_pct=0.0, residual_z=0.1) == "FAIR"

def test_suspicious():
    # Bose QC45 at $46: deal_pct=0.72 but residual_z=2.3 (anomaly)
    assert render_badge(deal_pct=0.72, residual_z=2.3) == "SUSPICIOUS"
```

Thresholds pinned in `dealfinder/deal_score.py`: `GREAT_DEAL` requires `deal_pct >= 0.30 AND residual_z < 2.0`; `SUSPICIOUS` requires `residual_z >= 2.0`.

The SSE endpoint integration test (`tests/test_api_sse.py`) mocks `aggregate_stream` with a two-source fixture and asserts that three `data:` events arrive (two source events + done) using `httpx.AsyncClient` with `stream()`.

---

## 11. Risks / notes

- **Live API availability:** The Google Shopping connector (Part 7) can hit rate limits during tutorial runs. Mitigate: `aggregate.py` circuit breaker falls back to the pgvector cache automatically — the tutorial notes this and tells learners to run `--dry-run` mode (mock aggregator) if they lack API credentials.
- **SSE in Safari:** `EventSource` is supported in Safari 14+ but close-and-reconnect behaviour differs. The tutorial uses a single SSE connection per query (not persistent); this avoids the reconnect edge case. Noted in a `<Callout type="warning">`.
- **No build step:** The UI is intentionally Vanilla JS in a single `index.html` — no Node, no bundler. This keeps the part focused on the backend SSE pattern. Part 27 (Front end for real) introduces React/Next. Cross-reference explicitly so learners know this is a deliberate simplification.
- **CORS:** `uvicorn` serves both API and static from the same origin — no CORS headers needed for this part. Part 27/24 (containerize) will address cross-origin when the front end is a separate domain.
- **Non-determinism:** Live aggregator results vary by run. All badge assertions in tests use the mock fixture, not live calls. The worked-example prose says "you will see results similar to…" and anchors to the snapshot median $162.97 as the stable reference.
