# Part 22 — Serve it fast & cheap (FastAPI, semantic cache, batching)

**Phase:** P5 — Safety, serving, cloud & ops
**Data mode:** LIVE
**Bible note:** (none)

---

## 1. Objective

The learner evolves the existing `serve.py` FastAPI stub into a production-ready serving layer — adding a semantic cache, request batching, and response-time / cost instrumentation — so the DealFinder API handles concurrent traffic without multiplying LLM calls.

---

## 2. Prerequisites

- Part 1 — Data layer, normalization & the snapshot (snapshot schema, `aggregate.py`)
- Part 5 — Semantic search (embeddings, BM25, RRF, rerank; `embed.py`, `search.py`)
- Part 9 — Tiered aggregation & resilience (circuit breaker, dedup; `aggregate.py`)
- Part 13 — pgvector persistence + semantic search over live deals (`pgstore.py`, live search path)
- Part 14 — The web app (SSE streaming; established the `/search` and `/semantic` contracts)
- Part 21 — Safety, security & governance (guardrail middleware already in `serve.py`)

---

## 3. By the end, the learner can…

- Wire a `SemanticCache` in front of the `/search` and `/semantic` endpoints so semantically-equivalent queries (cosine sim ≥ 0.95) return in < 5 ms with zero LLM tokens spent.
- Batch concurrent embedding requests into a single model call using a `BulkEmbedder` with a configurable flush window (50 ms default), measuring throughput improvement against a baseline.
- Add `/healthz`, `/metrics` (Prometheus-compatible), and `/batch-deals` endpoints with documented latency budgets.
- Load-test the live server with `locust` against the electronics corpus and read the Prometheus latency histogram to identify the p99 bottleneck.
- Explain the cost trade-off: semantic cache hit = $0 + ~3 ms; miss = ~$0.002 + ~420 ms (OpenAI `text-embedding-3-small` batch, 270-item corpus).

---

## 4. Data

**Mode:** LIVE — the running FastAPI server is exercised against live query traffic, with the frozen snapshot as the backing search index.

**Snapshot used:** `companions/dealfinder/data/snapshots/electronics-2026-07.json` — 270 items, 18 queries. The embeddings for all 270 items are pre-computed at server startup (one batch call); no per-request re-embedding of the corpus. The semantic cache is warmed with the 18 snapshot queries during the tutorial's demo warmup step.

**Quoted numbers (all reproducible):**

- 270 items embedded at startup in 1 batch call (not 270 serial calls).
- Snapshot median for "noise cancelling headphones": **$162.97**.
- Cache threshold: cosine sim ≥ 0.95 (tunable; default in `cache.py:SemanticCache`).
- Baseline p50 latency (no cache, no batch): ~420 ms per `/semantic` request (single embedding call + vector scan).
- Cached p50 latency: < 5 ms (vector similarity lookup, no model call).
- Batch flush window: 50 ms; batch size cap: 32 requests.
- Locust load: 20 concurrent users, 60 s ramp, against `http://localhost:8000`.

---

## 5. Worked example

The tutorial walks through a live `uvicorn` session with the frozen snapshot as the backing index.

**Step 1 — Baseline (no cache, no batch).**
`GET /semantic?q=noise+cancelling+headphones&k=4` returns the 4 hero-cast items:
```json
[
  {"title": "Sony WH-1000XM5", "price": 162.97, "deal_pct": 0.0},
  {"title": "Anker Soundcore Q20i", "price": 44.99, "deal_pct": 72.4},
  {"title": "Bose QuietComfort 45", "price": 46.0, "deal_pct": 71.8},
  {"title": "Sony WH-1000XM6", "price": 399.99, "deal_pct": -145.4}
]
```
Server log: `embed_ms=418 scan_ms=2 total_ms=420`. Cost: 1 embedding call.

**Step 2 — Semantically equivalent second query.**
`GET /semantic?q=headphones+with+noise+cancellation&k=4` — different string, same meaning. With the semantic cache enabled, cosine sim against the stored "noise cancelling headphones" embedding = **0.973 ≥ 0.95**. Server log: `cache=HIT embed_ms=0 total_ms=3`. Returns the same ranked list. Cost: $0.

**Step 3 — Batch endpoint.**
`POST /batch-deals` with body `{"queries": ["noise cancelling headphones", "wireless earbuds", "gaming headset"]}` — the `BulkEmbedder` collects the 3 queries, waits up to 50 ms for more, then fires one `openai.embeddings.create(input=[...])` call. Server log: `batch_size=3 embed_ms=440 per_query_ms=147`. Demonstrates the 3× cost reduction vs. serial calls.

**Step 4 — Load test.**
`locust -f tests/locustfile.py --users 20 --spawn-rate 5 --run-time 60s`. After cache warmup (18 queries from the snapshot): p50=4 ms, p99=22 ms, cache hit rate ≈ 78%. Without cache: p50=430 ms, p99=1100 ms. The `GET /metrics` endpoint shows the Prometheus histogram confirming the improvement.

---

## 6. Companion code

**Existing modules modified:**
- `dealfinder/serve.py` — the central delta: adds `SemanticCache` injection into `/search` and `/semantic`; adds `/batch-deals` router; adds Prometheus middleware; exposes `/metrics`. The existing `/healthz`, `/sources`, and `/deal/{id}` endpoints are unchanged.
- `dealfinder/cache.py` — already contains `SemanticCache` (threshold, `put`, `get`). This part adds `invalidate(max_age_s)` for TTL expiry and a `stats()` method (hit count, miss count) consumed by `/metrics`.
- `dealfinder/embed.py` — adds `BulkEmbedder`: an asyncio queue + background flush task; used by the batch endpoint and the cache-miss path.

**New in this part:**
- `dealfinder/metrics.py` — thin Prometheus wrapper (`prometheus-client`): counters for cache hits/misses, histograms for embed and total request latency.
- `tests/locustfile.py` — Locust load scenario: 60 % `/semantic` (rotating the 18 snapshot queries), 30 % `/search`, 10 % `/batch-deals`.
- `tests/test_serve.py` — `TestClient` tests (no live server needed): pins cache hit on semantically equivalent queries, pins batch endpoint response shape.

**Step tags:** `step-22` in `tutorial-dealfinder`. NEW part. Diff from `step-21` to `step-22` touches only `serve.py`, `cache.py`, `embed.py`, and adds `metrics.py`, `tests/locustfile.py`, `tests/test_serve.py`.

---

## 7. Animations

**Animation 1 — REUSE `SemanticCacheViz`** re-themed to electronics: replace the tent queries with electronics queries. Row 1: `"noise cancelling headphones"` → miss → compute & store (420 ms · $0.002). Row 2: `"headphones with noise cancellation"` → **semantic hit** → cached (3 ms · $0). Row 3: `"gaming headset"` → miss → compute & store. The green/grey hit/miss color logic and the timing display are already correct; only the query strings change.

**Animation 2 — NEW `BatchFunnelViz`:** Visual metaphor: three independent request streams (labeled `q1`, `q2`, `q3`) flow in from the left as separate colored dots with timestamps. A 50 ms countdown timer counts down in the center. When the timer fires, the three dots merge into one wide arrow that passes through a single "model call" box, then fans back out into three response dots on the right. Above the model box: `1 call · $0.002`. To the left of it, three hypothetical serial arrows show `3 calls · $0.006` in grey (crossed out). Framer Motion: stagger the incoming dots, animate the countdown, merge+fan. Static-export-safe — hard-coded values from the worked example. Concept made visible: batching is a time-window trade (50 ms latency budget) for a proportional cost reduction (÷ batch_size).

---

## 8. Teaching beats

1. **The serving problem.** Show the `/semantic` endpoint from Part 14: each call re-embeds the query. At 20 concurrent users, that's 20 serial OpenAI calls. Monthly cost at 10 rps: ~$172. Motivate caching and batching.
2. **Semantic cache.** Walk `cache.py:SemanticCache` — cosine threshold, `put`, `get`. Explain why string equality fails ("cheap headphones" ≠ "affordable headphones" but they should share a cache entry). Show the 0.973 similarity for the hero-cast pair.
3. **Wire the cache into `serve.py`.** Inject `SemanticCache` as a FastAPI dependency. Show the before/after logs: 420 ms → 3 ms on the second request. Add `stats()` → `/metrics`.
4. **TTL and invalidation.** Production deal prices change. Add `invalidate(max_age_s=300)` — a background task clears stale entries every 5 minutes. Discuss the trade-off: stale deal data vs. cost.
5. **Batch embedder.** Introduce `BulkEmbedder`: asyncio queue, flush on 50 ms timeout or 32 items. Show the cost math: 3 queries serial = $0.006; batched = $0.002. Wire into `/batch-deals`.
6. **Prometheus metrics.** Add `prometheus-client`; instrument `cache_hits`, `cache_misses`, `embed_latency_seconds` histogram. Expose at `/metrics`. Show `curl localhost:8000/metrics` output.
7. **Load test.** Run Locust against the live server (frozen snapshot backing index). Read p50/p99 before and after cache warmup. Show the histogram shift.
8. **Proof.** `pytest tests/test_serve.py` — green. Key assertions: cache hit fires on semantically equivalent query; batch endpoint returns results for all queries; `/metrics` returns valid Prometheus text.

---

## 9. Cross-references

**Back:** Part 21 (Safety, security & governance) added injection-shield middleware and PII scrubbing to `serve.py` — this part builds on top of that middleware stack without removing it. The guardrail layer remains at position 0 in the FastAPI middleware chain; the semantic cache and batch logic sit behind it.

**Forward:** Part 23 (Inference optimization, for real) takes the serving layer further — quantized model weights, vLLM for throughput, and request routing between a fast quantized path and a quality path — benchmarked against the same Locust scenario introduced here.

---

## 10. Reproducibility checks

```python
# tests/test_serve.py
from fastapi.testclient import TestClient
from dealfinder.serve import app

client = TestClient(app)

def test_semantic_cache_hit():
    r1 = client.get("/semantic?q=noise+cancelling+headphones&k=4")
    assert r1.status_code == 200
    r2 = client.get("/semantic?q=headphones+with+noise+cancellation&k=4")
    assert r2.status_code == 200
    assert r2.headers.get("X-Cache") == "HIT"
    assert int(r2.headers.get("X-Response-Ms", 9999)) < 10  # < 10 ms

def test_semantic_hero_cast_order():
    r = client.get("/semantic?q=noise+cancelling+headphones&k=4")
    items = r.json()
    prices = [item["price"] for item in items]
    assert 162.97 in prices   # Sony XM5 at median
    assert 44.99 in prices    # Anker Q20i honest deal
    assert 46.0 in prices     # Bose QC45 false-positive trap

def test_batch_deals_returns_all_queries():
    r = client.post("/batch-deals", json={
        "queries": ["noise cancelling headphones", "wireless earbuds", "gaming headset"]
    })
    assert r.status_code == 200
    results = r.json()
    assert len(results) == 3

def test_metrics_endpoint_contains_cache_counter():
    r = client.get("/metrics")
    assert "cache_hits_total" in r.text
    assert "cache_misses_total" in r.text
    assert "embed_latency_seconds" in r.text
```

The `X-Response-Ms < 10` assertion pins the cache speedup. The hero-cast price assertions are reproducible against the frozen snapshot (median $162.97 is invariant).

---

## 11. Risks / notes

- **OpenAI API key required for cache-miss path.** The `TestClient` tests mock the embedding call (`monkeypatch` on `embed.py:embed_text`) so CI runs fully offline. The tutorial's live demo section clearly gates on `OPENAI_API_KEY` being set.
- **Locust load test is optional / local only.** CI skips it (marked `@pytest.mark.locust`). The tutorial runs it manually; results are quoted from a developer laptop (M2 MacBook Pro, 16 GB) and marked as indicative, not absolute.
- **Cache threshold sensitivity.** A threshold of 0.95 is tight enough to avoid false hits across unrelated electronics categories (e.g., "gaming headset" vs. "gaming mouse" have sim ≈ 0.61 in the snapshot embedding space). The tutorial shows a threshold sweep (0.85, 0.90, 0.95) and explains the precision/recall trade-off.
- **asyncio flush window.** The 50 ms batch window adds latency to the first request in a batch. The tutorial acknowledges this: batching is beneficial under load, not for single-user interactive use. The `/semantic` endpoint (single-query path) does NOT use the batch window — it uses the cache directly or a direct embed call.
- **No GPU required.** `embed.py` uses `fastembed` locally for the corpus index; the batched OpenAI call is for query embeddings only. The inference optimization requiring GPU is explicitly deferred to Part 23.
- **Cost.** The entire tutorial demo costs < $0.05 in OpenAI embedding calls (270-item corpus once + ~30 cache-miss queries during the demo).
