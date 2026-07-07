# Part 26 — Observability & FinOps, for real (Langfuse/Grafana, live cost, load test)

**Phase:** P5 · **Data mode:** INFRA · **Bible note:** (none)

---

## 1. Objective

The learner instruments the running DealFinder stack with end-to-end observability
— LLM trace capture (Langfuse), infrastructure metrics (Grafana/Prometheus), live
token-cost accounting, and a locust load test — then uses the resulting dashboards
to find and fix a real latency hotspot.

---

## 2. Prerequisites

- Part 20 — Closing the MLOps loop (drift → retrain → eval gate → canary)
- Part 22 — Serve it fast & cheap (FastAPI, semantic cache, batching)
- Part 23 — Inference optimization, for real (quant, vLLM, routing; benchmarked)
- Part 24 — Containerize & ship (Docker, CI/CD, IaC/Terraform)
- Part 25 — Cloud & Kubernetes (managed Postgres, secrets mgmt)

---

## 3. By the end, the learner can…

- Wire Langfuse tracing into the extraction and agent layers so every LLM call is
  captured with token counts, latency, and model name — searchable by session.
- Export Prometheus metrics from FastAPI (request count, p50/p95/p99 latency,
  cache hit rate) and visualise them in a pre-built Grafana dashboard.
- Compute live per-request LLM cost from token counts × model rate card and surface
  it as a `/metrics` gauge so FinOps alerts are data-driven, not estimated.
- Run a locust load test against the live deal-score endpoint and read the generated
  profile to identify the dominant bottleneck (typically the extractor, not the model).
- Set a cost-budget alert (Langfuse or Grafana) that fires when projected daily LLM
  spend exceeds a configurable threshold.

---

## 4. Data

**INFRA — no snapshot rows are scored in this part.** The observability stack wraps
the already-running application from Parts 22–25; the data flowing through it is the
live electronics search traffic the app itself generates.

**Load-test corpus (reproducible):** the locust script replays the 18 queries from the
frozen snapshot as the workload (`electronics-2026-07.json` `query` field, unique).
This gives a deterministic request mix: 18 query strings, weighted uniformly, covering
all 11 categories. No live API calls during the load test — the `aggregate.py` layer
is mocked to return the cached snapshot results (identical to the CI shim used in
earlier parts) so the test measures app latency, not third-party API RTT.

**Hero-cast items appear in Langfuse trace examples** because the locust script
includes `"noise cancelling headphones"` as one of the 18 replay queries. The
Langfuse UI screenshots in the tutorial show real trace data for that query.

**Cost model (pinned numbers from model rate cards, not invented):**
- `gpt-4o-mini` (extractor, Part 6): $0.15/1M input tokens, $0.60/1M output tokens.
- Extraction of one headphone title (~40 tokens in, ~60 tokens out):
  input cost = 40 × $0.15/1M = $0.000006; output = 60 × $0.60/1M = $0.000036.
  Per-item cost ≈ $0.000042. At 1,000 extractions/day → $0.042/day.
- These rates are sourced from the OpenAI pricing page at tutorial authoring time;
  the tutorial notes they change and shows how to update the rate card dict.

---

## 5. Worked example

**Scenario: a load test reveals the extractor is the bottleneck.**

The learner starts locust with 10 concurrent users replaying the 18 queries. After
2 minutes the Grafana dashboard shows:

```
p95 /search latency:  1,840 ms
p95 /score  latency:    210 ms
cache hit rate:          61 %
```

Drilling into Langfuse, every `"noise cancelling headphones"` request shows a
`extraction` span of ~1,200 ms. The Sony WH-1000XM5 title
(`"Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones..."`)
triggers a second extraction call because the semantic cache missed (the title
hash is unique per retailer). The Macy's listing at $248 and the Costco listing
at $162.97 generate two separate extractor traces — exactly the dedup scenario
from Part 1, now visible as a cost event.

Langfuse trace summary for the hero query (one request):

```
session: locust-run-001  query: noise cancelling headphones
  ├─ aggregate          42 ms   (mock)
  ├─ dedup              3 ms
  ├─ extraction [x4]   1,190 ms  ← 4 items not in semantic cache
  │    tokens: 160 in / 240 out   cost: $0.000168
  ├─ deal_score         28 ms
  └─ rerank             18 ms
total: 1,281 ms   session_cost: $0.000168
```

Fix applied: add the extractor result to the semantic cache (Part 22) keyed on
title hash. Cache hit rate climbs to 84 % after the second locust run; p95 drops
to 620 ms. The Grafana dashboard shows the before/after in the same session — the
"fix" is visible without restarting the tutorial.

---

## 6. Companion code

**Existing modules touched:**
- `companions/dealfinder/extract.py` — add `@langfuse_trace` decorator; emit span
  with `model`, `input_tokens`, `output_tokens`, `latency_ms`.
- `companions/dealfinder/agent.py` — same decorator on tool calls; group by
  `session_id` passed from the request context.
- `companions/dealfinder/api.py` (Part 22) — add `prometheus_fastapi_instrumentator`
  middleware; expose `/metrics` endpoint; add `llm_cost_usd` Gauge updated per
  request from token counts × rate card.
- `companions/dealfinder/cache.py` (Part 22) — instrument cache hits/misses as
  Prometheus counters.

**New modules (this part introduces):**
- `companions/dealfinder/observability.py` — Langfuse client singleton, rate card
  dict, `compute_request_cost(model, in_tok, out_tok)` helper, cost-budget alert
  function.
- `companions/dealfinder/locustfile.py` — locust `HttpUser` replaying the 18 snapshot
  queries; `@task` weight distribution uniform; mock mode flag.
- `companions/dealfinder/dashboards/grafana-dealfinder.json` — committed Grafana
  dashboard JSON (importable); panels: request rate, p50/p95 latency, cache hit rate,
  cumulative LLM cost, top-5 slowest spans (from Langfuse data source).

**Step tags in `tutorial-dealfinder`:** NEW — `step-26-observability`. Adds three
new files and extends three existing ones. Squashed from the working tree after
Part 25's `step-25-cloud-k8s` tag.

---

## 7. Animations

**Animation 1 — REUSE `CostDashboard`**, re-themed to electronics.
Swap any tent-specific labels for the DealFinder panels: the three dials become
"p95 latency (ms)", "cache hit %", and "daily LLM cost ($)". Dial values use the
before-fix numbers from the worked example (1,840 ms / 61 % / $0.042/day). A
"Fix applied" button click animates the dials to the after-fix values (620 ms / 84 %
/ $0.018/day). Shape: three circular gauges — already the `CostDashboard` anchor
shape; no new shape introduced here.

**Animation 2 — NEW: `TraceWaterfall`.**
Visual metaphor: a horizontal waterfall / flame chart. A single request enters from
the left as a labelled bar (`/search 1,281 ms`). It fans out into five child spans
stacked vertically: `aggregate`, `dedup`, `extraction ×4`, `deal_score`, `rerank`.
The `extraction` span is rendered in amber and visibly dominates (~93 % of the bar).
A "cache warm" toggle collapses the extraction span to a thin green sliver (cache
hit), shrinking the total bar to ~620 ms. Concept made visible: observability makes
the bottleneck self-evident; the cache fix is not a guess. One distinct shape: the
**span bar** (a rectangle with a left-anchor timestamp tick) — does not appear in
any other component.

---

## 8. Teaching beats

1. **Concept — the two observability planes.** LLM traces (Langfuse: what the model
   did, how many tokens, what it cost) vs. infra metrics (Prometheus/Grafana: how
   fast, how many, how loaded). Both are needed; neither alone is sufficient.
2. **Code — `observability.py`.** Write the Langfuse client wrapper, the rate card
   dict, and `compute_request_cost`. Run a single extraction against the mock; confirm
   the trace appears in the Langfuse UI.
3. **Code — instrument `extract.py` and `agent.py`.** Add the `@langfuse_trace`
   decorator. Rerun the agent on the hero query; walk through the Langfuse session
   view showing the four extraction sub-spans.
4. **Code — instrument `api.py`.** Add Prometheus middleware and `/metrics`. Hit the
   endpoint; pipe output to `curl localhost:8000/metrics | grep dealfinder`. Show the
   `llm_cost_usd` gauge incrementing.
5. **Tool — Grafana dashboard.** Import `grafana-dealfinder.json`; tour the six
   panels. Show `CostDashboard` animation.
6. **Code — `locustfile.py`.** Run `locust -f locustfile.py --headless -u 10 -r 2
   --run-time 2m`; read the HTML report. Show `TraceWaterfall` animation; point to the
   extraction bottleneck.
7. **Fix — warm the extractor cache.** Add title-hash key to the semantic cache;
   re-run locust; compare dashboards. p95 drops, cost drops.
8. **Cost alert.** Add a Langfuse score threshold alert; configure a Grafana alert on
   `llm_cost_usd > 0.10` (daily budget). Explain why FinOps alerting is a first-class
   concern in production LLM apps, not an afterthought.

---

## 9. Cross-references

**Back:** Part 25 (Cloud & Kubernetes) provisioned the running cluster and managed
secrets — Part 26 assumes the app is deployed and reachable; the observability stack
connects to that live environment. The cost numbers from the locust run are the first
real production cost signal the learner has seen.

**Forward:** Part 27 (Front end for real) builds the React/Next.js UI that calls the
same `/search` and `/score` endpoints instrumented here; learners will see their UI
actions appear as Langfuse traces in real time, closing the loop between the product
surface and the backend observability built in Part 26.

---

## 10. Reproducibility checks

```python
# test_part26.py — all must pass in CI (mock mode, no live LLM calls)

def test_cost_computation():
    # gpt-4o-mini: $0.15/1M in, $0.60/1M out
    cost = compute_request_cost("gpt-4o-mini", input_tokens=40, output_tokens=60)
    assert abs(cost - 0.000042) < 1e-7, f"Cost mismatch: {cost}"

def test_session_cost_hero_query():
    # 4 extractions: 160 in / 240 out total (from worked example)
    cost = compute_request_cost("gpt-4o-mini", input_tokens=160, output_tokens=240)
    assert abs(cost - 0.000168) < 1e-7

def test_locust_replay_uses_all_18_queries():
    queries = load_snapshot_queries("companions/dealfinder/data/snapshots/electronics-2026-07.json")
    assert len(set(queries)) == 18

def test_metrics_endpoint_has_cost_gauge(test_client):
    r = test_client.get("/metrics")
    assert "llm_cost_usd" in r.text

def test_langfuse_trace_emitted(mock_langfuse):
    extract_title("Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones")
    assert mock_langfuse.spans_emitted == 1
    span = mock_langfuse.last_span
    assert span["model"] == "gpt-4o-mini"
    assert span["input_tokens"] > 0

def test_cache_warm_reduces_extraction_spans(test_client, mock_langfuse):
    # First request: 4 items uncached → 4 extraction spans
    test_client.post("/search", json={"query": "noise cancelling headphones"})
    cold_spans = mock_langfuse.span_count("extraction")
    mock_langfuse.reset()
    # Second request: cache warm → 0 extraction spans
    test_client.post("/search", json={"query": "noise cancelling headphones"})
    warm_spans = mock_langfuse.span_count("extraction")
    assert cold_spans == 4
    assert warm_spans == 0
```

Pinned metric: `compute_request_cost("gpt-4o-mini", 40, 60)` == $0.000042 (to 7
decimal places). If OpenAI changes the rate card, the rate card dict in
`observability.py` is updated and this test is updated together — the test exists to
catch accidental drift, not to hardcode production pricing forever.

---

## 11. Risks / notes

- **Langfuse requires a running server (or Langfuse Cloud).** The tutorial uses
  Langfuse Cloud (free tier) for the walkthrough and provides a `docker compose` snippet
  (`langfuse/langfuse`) for fully local operation. CI uses a `mock_langfuse` fixture
  (monkey-patch) so no external service is required in tests.
- **Prometheus + Grafana via Docker Compose.** A `docker-compose.observability.yml`
  is committed alongside the Terraform from Part 24; it adds Prometheus and Grafana
  containers. The tutorial notes this is separate from the Kubernetes deployment
  (Part 25) — for production, learners would use a managed Grafana (e.g., Grafana
  Cloud or AWS Managed Grafana). Keeping the compose approach keeps the part
  self-contained.
- **Token counts are non-deterministic at the API level** (streaming vs. non-streaming
  can differ by a few tokens). The cost tests use `compute_request_cost` directly
  with pinned token counts from the worked example, not end-to-end API calls, so they
  are deterministic.
- **Locust HTML report is not committed.** The tutorial shows a screenshot; the CI
  test only validates the locustfile parses and the 18-query list is correct. A full
  load-test run requires the running app (Part 25 environment) and is not part of the
  automated test suite.
- **No GPU required.** The extractor uses `gpt-4o-mini` via API; the deal-score model
  is GBM on CPU. The observability layer itself has no compute requirements beyond the
  instrumentation overhead (< 2 ms per request in testing).
- **Rate card accuracy.** OpenAI pricing changes; the tutorial instructs learners to
  verify the rate card against `platform.openai.com/pricing` before running in
  production. The committed rate card is correct as of 2026-07-07.
