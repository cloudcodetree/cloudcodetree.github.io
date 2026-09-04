# Part 33 — Case study + system-design interview on the real, deployed SaaS

**Phase:** P7 — Ship
**Data mode:** —
**Bible note:** (none)

---

## 1. Objective

The learner tours the complete, deployed DealFinder SaaS as a unified system — tracing one user request end-to-end through every layer built across Parts 1–32 — and then practices answering senior-engineer system-design interview questions about it with concrete numbers from the real app.

---

## 2. Prerequisites

- Part 32 — Ship & operate (Playwright e2e, load/chaos, runbook; the fully deployed app this part interrogates)
- Parts 1–31 broadly — this part assumes the learner has completed the full course; it references specific parts by name as it walks each layer

---

## 3. By the end, the learner can…

- Narrate the complete DealFinder request path — query ingestion → aggregation → dedup → deal scoring → semantic rerank → auth gate → SSE delivery → UI render — with latency and cost figures from the running app.
- Answer the canonical system-design question "design a real-time deal-finder" at a senior-engineer level, citing tradeoffs actually encountered in this build (e.g. why category-aware median + model residual beats a naive single signal; why pgvector over a dedicated vector DB for this scale).
- Identify which architectural decisions are load-bearing vs. incidental and explain what would change at 10× traffic.
- Articulate the MLOps loop (drift → retrain → eval gate → canary, Part 20) as a continuous process, not a one-time event.
- Construct a one-page system diagram from memory and annotate it with the latencies, cost centers, and failure modes discovered during Parts 24–26 and 32.

---

## 4. Data

**Mode:** Concept + running app. No new snapshot queries are introduced; all numbers come from two sources:

1. **Frozen snapshot** (`companions/dealfinder/data/snapshots/electronics-2026-07.json`, 270 items, 18 queries) — quoted metrics (R², MAE, precision@k, deal_pct ranges, median) are the same values pinned in the individual parts' reproducibility checks. Nothing is re-derived here.
2. **The running deployed app** — end-to-end latency, cost dashboard figures (Langfuse/Grafana from Part 26), and Playwright e2e timings from Part 32 are quoted from live observations. The tutorial tells the learner which `prom-query` or Grafana panel to open for each figure, so they can reproduce it against their own deployment.

**Snapshot values used in the walkthrough (all previously pinned):**
- Anchor query: "noise cancelling headphones"; snapshot median **$162.97**.
- Deal score for Anker Q20i at $44.99: **~72% under median**, model residual confirms genuine value (positive residual: fair-price model predicts ~$80–$90, actual $44.99 → positive deal).
- Deal score for Bose QC45 at $46.00: median says ~72% off, model residual flags it (**negative residual**: fair-price model predicts ~$280+ for a flagship, actual $46 is a ~$234 gap → false positive caught by the model guard, Part 3).
- `deal_pct` range in the full snapshot: **−3785% … +91.7%** (the outlier motivation from the bible).

---

## 5. Worked example

The tutorial walks one user session end-to-end using the hero cast, then uses that walkthrough as the answer skeleton for a system-design question.

**Session trace — "noise cancelling headphones", authenticated pro user:**

1. **Browser → Next.js UI (Part 27):** User types query, hits Enter. React state dispatches `GET /search?q=noise+cancelling+headphones&semantic=true&k=8`. JWT in `Authorization: Bearer <token>` (Supabase RS256, Part 28).
2. **FastAPI auth gate (Part 28):** `verify_jwt` runs in < 1 ms in-process; `plan = pro` → semantic endpoint permitted.
3. **Live aggregator (Parts 7–9):** `aggregate.py` fans out to Google Shopping (RapidAPI) and Apify scrapers; circuit breaker (Part 9) short-circuits any source that breaches the 2-second timeout; results merge. For the anchor query, expect 15–25 raw results including both the Costco XM5 ($162.97) and Macy's XM5 ($248).
4. **Dedup (Part 9):** Title-similarity dedup (cosine ≥ 0.92 threshold) collapses the two XM5 listings → cheapest kept ($162.97, Costco). 1 duplicate removed.
5. **Deal scoring — two signals (Parts 3, 17):**
   - Cross-source median for "noise cancelling headphones": **$162.97**. Anker Q20i deal_pct ≈ 72.4%; Bose QC45 deal_pct ≈ 71.8%; XM5 deal_pct ≈ 0.0%.
   - Gradient-boosted model residual (Part 17): Bose QC45 residual = predicted ~$280 − actual $46 = **+$234 gap → flagged as suspicious** (deal_score discounted); Anker Q20i residual = predicted ~$85 − actual $44.99 = **+$40 → confirmed genuine deal**.
6. **Semantic rerank (Parts 5, 13):** pgvector cosine search over title embeddings (BAAI/bge-small-en-v1.5, 384-dim); BM25+RRF hybrid rerank (Part 5) → final ranked list. XM5 ($162.97) anchors position 1; Q20i ($44.99) surfaces at position 2 with a "Genuine deal" badge; QC45 ($46) is shown at position 5 with a "Verify condition" warning.
7. **SSE stream (Parts 14, 27):** Results streamed as newline-delimited JSON events. First event within ~800 ms of request (p50, from Part 26 Grafana panel `dealfinder_search_latency_seconds`); full stream complete in ~1.4 s (p50).
8. **Saved search (Part 29):** Because `plan = pro`, the query is persisted to `saved_searches` (Postgres via Supabase); the periodic-suggestions worker will resurface it if prices drop > 15% within 7 days.

**System-design interview format (the tutorial poses the question, then annotates each answer with the architectural decision from the course):**

> "Design a deal-finding service that aggregates prices from 3+ sources in real time, surfaces genuine deals (not just low prices), and serves 10k DAU."

The learner's answer skeleton maps directly to the trace above: aggregator fan-out with circuit breaker → dedup → two-signal deal score → semantic rerank → SSE delivery → auth/RBAC → persistence. For each layer the tutorial cites the part where it was built and the tradeoff that was resolved (e.g. "we chose pgvector over Pinecone at this scale because it co-locates with our Supabase Postgres, eliminating a network hop — Part 13").

---

## 6. Companion code

**No new code.** This part introduces no code delta. It is a capstone synthesis and interview-prep part.

**Modules referenced (read-only):**
- `dealfinder/aggregate.py` (Parts 7–9): the aggregator + circuit breaker
- `dealfinder/deal_score.py` (Parts 3, 17): the two-signal scorer
- `dealfinder/serve.py` (Parts 22, 28): FastAPI, auth middleware, SSE
- `dealfinder/search.py` (Parts 5, 13): pgvector + BM25 + RRF
- `dealfinder/auth.py` (Part 28): JWT verification

**Step tag:** `step-33` in `tutorial-dealfinder`. This tag is the final tag on `main` — it adds only `docs/system-design-qa.md` (the interview Q&A scaffold the learner fills in) and `docs/architecture-diagram.md` (Mermaid diagram generated from the full system). No Python or Next.js files are modified.

---

## 7. Animations

**Animation 1 — REUSE `AgentLoop` re-themed as `RequestLifecycle`:** The existing `AgentLoop` circular-pipeline component is re-themed with electronics-domain labels: stages become "Aggregate", "Dedup", "Score", "Rerank", "Stream", "Render". Each stage node shows a latency badge (e.g. "Aggregate ~400ms", "Score ~20ms"). The animation cycles once on mount, then pauses. Concept made visible: the request is a pipeline, not a monolith — each stage has its own latency budget and failure mode.

**Animation 2 — NEW `SystemLayerStack`:** Visual metaphor: a vertical stack of labeled rectangles, each representing an architectural layer (from bottom to top): "Postgres + pgvector", "FastAPI + auth", "Aggregator (fan-out)", "Deal scorer", "SSE stream", "Next.js UI". Two vertical arrows run alongside: a green "happy path" arrow flows upward through all layers; a red "fault injection" arrow (chaos from Part 32) strikes the "Aggregator" layer and the circuit-breaker icon activates (the layer pulses amber), while the path reroutes around it and continues upward. Framer Motion entrance animation (stagger per layer), then the fault-injection replay on click. Concept made visible: the system is layered with defined fault boundaries — a source failure doesn't propagate to the user.

---

## 8. Teaching beats

1. **Orient: what the course built.** One-paragraph summary of the full arc: real data (Part 1) → intelligence (Parts 2–12) → data engineering (Parts 15–16) → ML rigor (Parts 17–20) → safety/serving (Parts 21–26) → SaaS (Parts 27–31) → operations (Part 32). The `RequestLifecycle` animation plays here.
2. **The request trace.** Walk the hero query ("noise cancelling headphones") through every layer (§5 above). For each layer: name the architectural decision, quote the latency or cost figure, name the part where it was built. The `SystemLayerStack` animation plays here.
3. **The two hero lessons.** (a) Why naive median fails — the Bose QC45 false positive (deal_pct 71.8% but model residual flags it); the Anker Q20i true positive (both signals agree). (b) Why real data from the start changed the course — the `brand` field holding retailer names, the −3785% outlier, and the 11-category heterogeneity forced the right architectural choices (title extraction, category-aware median, gradient boosting).
4. **System-design interview Q&A.** Pose five canonical senior-engineer questions (e.g. "how does your deal score avoid false positives?", "how do you handle a source going down?", "how does the MLOps loop prevent model drift in production?", "what changes at 10× traffic?"). For each: expected answer, the DealFinder answer, and the tradeoff it encodes.
5. **10× scaling discussion.** Walk the parts that would change first at 10× DAU: aggregator fan-out becomes async job queue (Part 9 circuit breaker still holds but throughput needs a worker pool); pgvector remains viable to ~1M embeddings (Part 13); the suggestion worker (Part 29) would need sharding. The tutorial is explicit that what holds and what breaks.
6. **Graduation.** The learner has built a production SaaS from real data to deployed product. The tutorial closes with the companion repo's `main` branch as the reference implementation and a pointer to `docs/system-design-qa.md` as a take-home interview guide.

---

## 9. Cross-references

**Back:** Part 32 (Ship & operate) delivered a fully deployed, Playwright-tested, chaos-validated app with a runbook — this part takes that running system and reads it as a complete architecture to be understood, explained, and defended in an interview context.

**Forward:** None — Part 33 is the final part of the course. The closing beat explicitly names Part 1 (Data layer, normalization & the snapshot) as the decision that made the rest coherent: starting with real, messy data was the differentiating choice.

---

## 10. Reproducibility checks

No new metrics are introduced. All quoted numbers must match the pins from prior parts:

```python
# tests/test_case_study_anchors.py
# Validates that the snapshot values cited in this part's prose are stable.
import json, pathlib

SNAPSHOT = json.loads(
    (pathlib.Path("companions/dealfinder/data/snapshots/electronics-2026-07.json")).read_text()
)

def test_snapshot_item_count():
    assert len(SNAPSHOT) == 270

def test_anchor_query_median():
    from dealfinder.deal_score import category_median
    median = category_median(SNAPSHOT, query="noise cancelling headphones")
    assert abs(median - 162.97) < 0.50  # within 50 cents of the bible value

def test_hero_cast_present():
    titles = [item["title"] for item in SNAPSHOT]
    assert any("WH-1000XM5" in t for t in titles), "Sony XM5 missing from snapshot"
    assert any("Soundcore Q20i" in t for t in titles), "Anker Q20i missing from snapshot"
    assert any("QuietComfort 45" in t for t in titles), "Bose QC45 missing from snapshot"

def test_deal_pct_range():
    pcts = [item["deal_pct"] for item in SNAPSHOT if item.get("deal_pct") is not None]
    assert min(pcts) < -3000, "Lower bound of deal_pct outlier has changed"
    assert max(pcts) > 90.0, "Upper bound of deal_pct has changed"
```

The e2e latency figures (p50 ~800 ms first event, ~1.4 s full stream) are quoted from the Part 32 Playwright trace and the Part 26 Grafana `dealfinder_search_latency_seconds` panel — the tutorial instructs the learner to open these panels in their own deployment rather than asserting a hard number in CI (latency is infrastructure-dependent).

---

## 11. Risks / notes

- **No new environment requirements.** This part reads the already-deployed system from Parts 24–32. No GPU, no new API keys, no new cloud services. Cost: $0 beyond the running infrastructure from prior parts.
- **Latency figures are deployment-dependent.** The p50 figures (~800 ms, ~1.4 s) are illustrative from a standard cloud deployment; the tutorial instructs learners to read their own Grafana panel rather than assert a hard number. The Prometheus query to run is provided verbatim.
- **Interview Q&A is not exhaustive.** Five canonical questions are chosen to cover the key tradeoffs in the build. The tutorial explicitly notes that a real interview panel will probe deeper; the `docs/system-design-qa.md` scaffold in the companion repo has blank sections for the learner to extend.
- **Non-determinism in the live aggregator.** The request trace in §5 is written against the snapshot-backed dev server (Part 14's `USE_SNAPSHOT=true` mode), not the live aggregator, so the exact result set is reproducible. The tutorial notes this distinction and shows how to run both modes.
- **No backward-incompatible changes.** The step-33 tag adds only documentation files to the companion repo; no Python or Next.js code changes. The test suite from Part 32 must remain green at this tag — the tutorial instructs the learner to verify with `pytest` before declaring the course complete.
