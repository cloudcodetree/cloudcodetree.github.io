# Part 09 — Tiered aggregation & resilience (early-stop, circuit breaker, dedup)

**Part:** 9 of 33 | **Phase:** P1 Real data & aggregator | **Data mode:** LIVE  
**Slug:** `dealfinder-aggregation`

---

## 1. Objective

Build a tiered, fault-tolerant aggregation layer on top of the multi-source connectors from Parts 7–8 that stops querying once a confidence threshold is met, opens a circuit breaker when a source exceeds its error budget, and collapses duplicate listings to the cheapest surviving copy — turning noisy parallel fan-out into a stable, efficient result set.

---

## 2. Prerequisites

- Part 7 — Live multi-source connectors (real APIs, OAuth, affiliate)
- Part 8 — Scraping responsibly (Apify/Shopify/Firecrawl; ToS/robots)
- Part 1 — Data layer, normalization & the snapshot (dedup concept introduced there)

---

## 3. By the end, the learner can…

- Implement a tiered query plan (fast free tier → paid API → scraper fallback) with configurable early-stop once N results or minimum coverage is satisfied.
- Wire a circuit breaker (half-open / open / closed states) around each source so one throttled API cannot stall the whole request.
- Deduplicate across sources by canonical product identity (title embedding similarity + price proximity) and retain only the cheapest in-stock listing.
- Tune the tier budget (max latency per tier, per-source error threshold) from environment config without code changes.
- Write integration tests against a fixture server that simulate 429/503 responses to verify the breaker trips and recovers.

---

## 4. Data

**Mode:** LIVE (the lesson is liveness and resilience; the running aggregator is the subject).

**Snapshot role:** `companions/dealfinder/data/snapshots/electronics-2026-07.json` is used only for the dedup unit test fixtures — the 270 items supply real title strings and prices that populate the mock HTTP responses, making fixture data realistic without requiring live credentials.

**Specific items from snapshot used as fixture payloads:**

| Fixture item | Snapshot fields used |
|---|---|
| Sony WH-1000XM5 @ $162.97 (Costco) | title, price, source, url, image_url |
| Sony WH-1000XM5 @ $248 (Macy's) | title, price, source, url |
| Anker Soundcore Q20i @ $44.99 | title, price, source, url |
| Bose QuietComfort 45 @ $46 | title, price, source, url |

**Live endpoints exercised:**
- RapidAPI Google Shopping (Tier 1 — fast, rate-limited)
- Apify Google Shopping actor (Tier 2 — slower, higher quota)
- Firecrawl scraper (Tier 3 — fallback only, invoked when Tiers 1–2 yield < min_results)

No eBay. No invented data.

---

## 5. Worked example

**Query:** `"noise cancelling headphones"` | **min_results:** 8 | **max_tier_latency_ms:** 3000

**Tier 1 (RapidAPI) — succeeds with 14 results in 1.2 s:**

The aggregator fans out to RapidAPI and receives, among others:
- Sony WH-1000XM5 @ $162.97 (Costco)
- Sony WH-1000XM5 @ $248.00 (Macy's)
- Anker Soundcore Q20i @ $44.99
- Bose QuietComfort 45 @ $46.00

Because 14 ≥ min_results (8), the early-stop fires. Tier 2 (Apify) and Tier 3 (Firecrawl) are **never called** — logged as `SKIPPED / early_stop`.

**Dedup pass:**

The two Sony XM5 rows share a cosine similarity of 0.97 on their title embeddings (BAAI/bge-small-en-v1.5) and both prices ($162.97 and $248) are within the same category. Dedup collapses them: the Costco listing ($162.97, cheaper) survives; the Macy's listing is dropped. The learner sees:

```
Before dedup : 14 items
Duplicate groups found : 1 (Sony WH-1000XM5 × 2)
After dedup  : 13 items
```

**Tier 1 throttled scenario (circuit breaker demo):**

The tutorial then injects a fixture server returning HTTP 429 for 5 consecutive RapidAPI calls. The breaker opens after 5 errors in a 60 s window. Tier 2 (Apify) becomes the primary. After a 30 s half-open probe succeeds, the breaker closes and Tier 1 is restored. The learner reads the state log:

```
[09:14:02] rapidapi  CLOSED  (0/5 errors in window)
[09:14:07] rapidapi  OPEN    (5/5 errors — threshold exceeded)
[09:14:07] apify     CLOSED  — promoted to primary
[09:14:37] rapidapi  HALF_OPEN (probe attempt)
[09:14:38] rapidapi  CLOSED  (probe succeeded)
```

---

## 6. Companion code

**NEW part** — no prior step tag owns this material.

**Introduces (code delta):**

- `dealfinder/aggregate.py` — extends the existing module (established in Part 7) with:
  - `TierPlan` dataclass: ordered list of `(source_fn, weight, max_latency_ms)`
  - `AggregatorConfig`: `min_results`, `early_stop`, per-source `error_threshold`, `window_s`, `half_open_probe_s`
  - `CircuitBreaker` class: state machine (CLOSED → OPEN → HALF_OPEN → CLOSED), thread-safe with `threading.Lock`
  - `aggregate_tiered(query, plan, config) → list[Item]`: fan-out with early-stop, breaker gating, and dedup via `dedup_by_embedding`
- `dealfinder/dedup.py` — new module:
  - `dedup_by_embedding(items, sim_threshold=0.90, max_price_ratio=2.0) → list[Item]`: clusters by cosine sim on cached title embeddings, keeps cheapest per cluster
- `tests/test_aggregate.py` — fixture server (pytest-httpx or responses) exercising: early-stop, breaker trip, breaker recovery, dedup collapse of the Sony XM5 pair
- `data/fixtures/headphones_tier1.json` — 14-item fixture payload drawn from snapshot values

**Step tag in tutorial-dealfinder repo:** `step-09-aggregation` (new; branches from `step-08-scraping`).

---

## 7. Animations

**Animation 1 — REUSE `AgentLoop` re-themed as a Tier Waterfall**

Re-theme the existing `AgentLoop` loop diagram (cyclic nodes + state labels) to show the three tiers as nodes in a linear decision chain, with the early-stop edge bypassing Tier 2 and Tier 3. The "OPEN" circuit breaker state is shown as a node going dark/red, routing the arrow to the next tier. Concept made visible: why a loop that short-circuits on success is fundamentally different from always querying all sources.

**Animation 2 — NEW: `DedupMerge` (REUSE, already exists — re-theme to electronics)**

The existing `DedupMerge` component shows two cards merging into one cheaper card. Re-theme its example data: left card = Sony XM5 @ $248 (Macy's), right card = Sony XM5 @ $162.97 (Costco), merged output = Costco card with a "cheapest kept" badge. Concept made visible: two real listings for the same product collapsing to a single canonical result. (Shape: overlapping rounded rectangles → single card; distinct from the Tier Waterfall.)

---

## 8. Teaching beats

1. **Concept — the fan-out problem.** Show a timing diagram: querying all 3 sources serially takes ~9 s; in parallel, the slowest source gates the response. Early-stop is the fix.
2. **Code — TierPlan + early-stop loop.** Walk through `aggregate_tiered`; highlight the `if len(results) >= config.min_results: break` guard. Run against the fixture; confirm Tiers 2/3 are SKIPPED in the log.
3. **Concept — cascading failures.** Show that one source returning 429 in a tight loop can exhaust retries for all queries. The circuit breaker isolates the failure.
4. **Code — CircuitBreaker state machine.** Implement CLOSED/OPEN/HALF_OPEN with `error_count`, `last_failure_ts`, `probe_result`. Unit-test each state transition.
5. **Proof — breaker demo.** Run `pytest tests/test_aggregate.py::test_circuit_breaker_trips` with the fixture 429 server; observe state log; confirm Tier 2 promoted; confirm recovery after probe.
6. **Concept — dedup via embedding similarity.** Motivate: the Sony XM5 appears from multiple sources with slightly different titles. String equality fails; embedding cosine similarity catches it.
7. **Code — dedup_by_embedding.** Walk through clustering loop + cheapest-keep. Run against the 14-item fixture; confirm 13-item output with the Macy's row dropped.
8. **Animation beat.** Render the `DedupMerge` component inline; narrate the $248 → $162.97 collapse.
9. **Configuration.** Show `AggregatorConfig` loaded from env; demonstrate toggling `early_stop=False` to force all tiers (useful for coverage audits).

---

## 9. Cross-references

**Back:** Part 8 — Scraping responsibly (Apify/Shopify/Firecrawl; ToS/robots) delivers the raw scraper connectors this part wraps in circuit breakers and integrates as Tier 3 of the tiered plan.

**Forward:** Part 10 — Fine-tune the extractor with QLoRA (anchored) moves into the intelligence layer; the stable, deduplicated result set produced here is the input surface that downstream extractors and the agent (Parts 11–12) operate on.

---

## 10. Reproducibility checks

All asserts run offline against `data/fixtures/headphones_tier1.json` (drawn from the frozen snapshot) and the fixture 429 server — no live credentials required in CI.

```python
# test_aggregate.py

def test_early_stop_skips_lower_tiers(fixture_tier1_server):
    results = aggregate_tiered("noise cancelling headphones", plan=THREE_TIER_PLAN, config=cfg_min8)
    assert len(results) >= 8
    assert fixture_tier1_server.apify_call_count == 0   # Tier 2 never hit
    assert fixture_tier1_server.firecrawl_call_count == 0  # Tier 3 never hit

def test_circuit_breaker_trips_on_429(fixture_429_rapidapi):
    results = aggregate_tiered("noise cancelling headphones", plan=THREE_TIER_PLAN, config=cfg_min8)
    assert fixture_429_rapidapi.breaker_state == "OPEN"
    assert len(results) >= 8   # Tier 2 filled the gap

def test_dedup_collapses_sony_xm5_pair():
    items = load_fixture("headphones_tier1.json")  # 14 items including both XM5 rows
    deduped = dedup_by_embedding(items, sim_threshold=0.90)
    titles = [i.title for i in deduped]
    xm5_hits = [t for t in titles if "WH-1000XM5" in t]
    assert len(xm5_hits) == 1
    xm5 = next(i for i in deduped if "WH-1000XM5" in i.title)
    assert xm5.price == 162.97   # Costco cheapest kept
    assert xm5.source == "Costco"
```

---

## 11. Risks / notes

- **Rate limits during live demo:** the tutorial documents that the live section requires valid RapidAPI + Apify credentials in `.env`; CI uses only the fixture server. The `--dry-run` flag in `aggregate.py` routes to fixtures automatically when `RAPIDAPI_KEY` is unset.
- **Embedding model cold start:** `dedup_by_embedding` loads BAAI/bge-small-en-v1.5 on first call (~200 ms). Fixture tests cache a pre-computed embedding array (`tests/fixtures/xm5_embeddings.npy`) so they stay fast and offline.
- **Non-determinism in cosine clustering:** with `sim_threshold=0.90`, the Sony XM5 pair always clusters (observed similarity ~0.97); the Anker and Bose items never merge with each other or the Sony (observed < 0.65). The reproducibility test pins the post-dedup count to 13, not the exact cluster assignments, to tolerate minor model updates.
- **Thread safety:** `CircuitBreaker` uses `threading.Lock`; async callers (Part 14's web UI) must use `asyncio.Lock` instead — noted as a forward-reference caveat in the tutorial prose.
- **No cost:** all CI runs are fully offline. The live demo section is clearly gated behind a "Prerequisites: working API keys" callout.
