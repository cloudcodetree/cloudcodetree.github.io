# Part 23 — Inference optimization, for real (quant, vLLM, routing; benchmarked)

**Phase:** P5 Safety, serving, cloud & ops | **Data mode:** INFRA | **Slug:** `dealfinder-inference-optimization`

---

## 1. Objective

The learner applies three concrete inference-optimization techniques — INT8/INT4 quantization, vLLM continuous batching, and a latency-aware model router — to the DealFinder LLM components and measures the real throughput/cost trade-off with a reproducible benchmark harness.

---

## 2. Prerequisites

- Part 17 — ML & DL breadth (gradient boosting + price-drop forecaster + a PyTorch loop): established the `PriceMLP` and introduced PyTorch; quantization builds directly on that model.
- Part 19 — Evaluation as a discipline (golden sets, LLM-judge, error analysis): the golden extraction set is reused here as the quality gate — optimization must not regress precision below the pinned threshold.
- Part 22 — Serve it fast & cheap (FastAPI, semantic cache, batching): introduced the FastAPI inference endpoint and the semantic cache that Part 23 operates alongside; the benchmark harness built here measures the same endpoints.

---

## 3. By the end, the learner can…

- Apply `bitsandbytes` INT8 and GPTQ INT4 quantization to the extractor LLM and measure the latency/quality trade-off against the golden set.
- Stand up a vLLM server (Docker Compose, CPU-fallback mode) and route the extraction workload through it, observing continuous-batching throughput vs. the naive per-request FastAPI baseline.
- Implement a two-tier model router: cheap/fast model for high-confidence structured titles; expensive/slow model for ambiguous listings — using a confidence signal from the extractor to decide.
- Run the benchmark harness (`scripts/bench_inference.py`) against the frozen snapshot, reproduce the quoted p50/p99 latency and tokens/sec figures, and interpret the cost-per-1k-items table.
- Explain why quantization is safe for the extraction task (schema-bound output) but would require a quality gate for the deal-score narrative generation.

---

## 4. Data

**Source:** `companions/dealfinder/data/snapshots/electronics-2026-07.json` (270 items, frozen) — used as the inference benchmark corpus.

**Which items/queries:** All 270 items are passed through the benchmark harness; results are aggregated by category. The "noise cancelling headphones" query (18 items in the snapshot) is the per-item worked example because the hero cast covers the range of difficulty (clean Sony titles vs. the ambiguous Bose QC45 mislisting).

**Live endpoints:** None required. The vLLM server is spun up locally via Docker Compose using a small open model (`Qwen/Qwen2.5-0.5B-Instruct` by default, swappable) that fits on CPU in CI. The FastAPI baseline from Part 22 is the comparison target.

**No invented numbers:** all latency figures (p50, p99, tokens/sec) and cost-per-1k-items values in the tutorial are produced by running `scripts/bench_inference.py --snapshot data/snapshots/electronics-2026-07.json` and pinned in `tests/test_bench.py`. The tutorial quotes ranges (e.g., "INT8 reduces p99 by 30–45% on this corpus") with a note that exact values depend on hardware; the test asserts ratios, not absolutes.

---

## 5. Worked example

**Setup:** the four hero cast headphone listings are run through three inference configurations — baseline (FP16 FastAPI), INT8 quantized, and vLLM batched — and their extraction outputs and latencies are compared.

**Inputs (from snapshot, anchor query "noise cancelling headphones", median $162.97):**

| Listing | price | title complexity |
|---|---|---|
| Sony WH-1000XM5 (Costco) | $162.97 | Clean: "Sony WH-1000XM5 Wireless Noise Canceling Headphones" |
| Anker Soundcore Q20i | $44.99 | Clean: "Anker Soundcore Q20i Active Noise Cancelling Headphones" |
| Bose QuietComfort 45 | $46.00 | Ambiguous: condition missing, price anomalous |
| Sony WH-1000XM6 | $399.99 | Clean but new model, extractor may hallucinate specs |

**Benchmark walkthrough (tutorial shows this step by step):**

1. Baseline (FP16, sequential FastAPI from Part 22): extract brand/model/condition from each title. Sony XM5 and Anker Q20i parse cleanly in ~180 ms each. Bose QC45 at $46 triggers a low-confidence extraction (condition field returns `null`); the router sends it to the expensive model. Sony XM6 returns in ~175 ms.

2. INT8 quantized (same model, `bitsandbytes` `load_in_8bit=True`): Sony XM5 extracts in ~105 ms — ~42% faster. Quality check: extraction schema matches the FP16 output exactly for all four hero items (schema-bound JSON is robust to 8-bit). Cost reduction: ~40% fewer GPU hours for the same throughput (illustrated with a $/1k-items table; absolute $ values use a $0.0008/1k-token placeholder rate the learner replaces with their provider's rate).

3. vLLM batched (Qwen2.5-0.5B-Instruct, Docker Compose): all 18 "noise cancelling headphones" items batched in one request. p50 latency per item drops from 180 ms to ~35 ms; tokens/sec increases ~5x vs. sequential baseline. The tutorial explains why: continuous batching fills GPU memory across requests rather than waiting for each to complete.

4. Router decision: `confidence = extractor.confidence_score(title, output)` returns 0.31 for the Bose QC45 listing (below threshold 0.6) → routed to `gpt-4o-mini` (or configurable slow-model endpoint). The Sony XM5 returns 0.94 → stays on the fast quantized path. The tutorial shows that ~15% of the 270-item corpus falls below threshold, meaning only 15% of items pay the expensive-model price.

---

## 6. Companion code

**Existing modules touched:**
- `companions/dealfinder/dealfinder/extractor.py` — add `confidence_score(title, output) -> float` method (entropy of the model's token log-probs over the schema fields, or a heuristic: fields returned as `null` reduce confidence by 0.2 each).
- `companions/dealfinder/dealfinder/serve.py` (Part 22's FastAPI app) — add `/extract/batch` endpoint that accepts a list of titles and dispatches to vLLM or the quantized model based on the router.

**New modules introduced:**
- `companions/dealfinder/dealfinder/inference/` — NEW directory:
  - `quantize.py` — `load_quantized_extractor(bits=8)` wrapping `bitsandbytes` / GPTQ load path; CPU fallback that skips quantization if no CUDA (for CI).
  - `router.py` — `InferenceRouter` class: `route(title, confidence_threshold=0.6) -> ModelTier` (FAST | SLOW).
  - `vllm_client.py` — thin async client wrapping the vLLM OpenAI-compatible `/v1/completions` endpoint; used by `serve.py`.
- `companions/dealfinder/scripts/bench_inference.py` — NEW; runs all three configs against the snapshot, emits a JSON results file with per-item latencies and a summary table.
- `companions/dealfinder/tests/test_bench.py` — NEW; pins ratio assertions (see §10).
- `companions/dealfinder/docker/vllm-compose.yml` — NEW; Docker Compose for local vLLM server.

**Step tags (tutorial-dealfinder repo):**
- `step-23a` — quantization + CPU fallback + `quantize.py` (delta: `inference/quantize.py`, updated `extractor.py`).
- `step-23b` — router + confidence score (delta: `inference/router.py`, `extractor.py` confidence method).
- `step-23c` — vLLM client + `/extract/batch` endpoint + Docker Compose (delta: `inference/vllm_client.py`, `serve.py`, `docker/vllm-compose.yml`).
- `step-23d` — benchmark harness + tests (delta: `scripts/bench_inference.py`, `tests/test_bench.py`).

This is a NEW part with no prior step-tag equivalent.

---

## 7. Animations

**NEW — `QuantizationLadder` (concept: precision vs. quality trade-off):**
Visual metaphor: a vertical ladder with four rungs labeled FP32, FP16, INT8, INT4. To the left of each rung: a bar showing model size (MB); to the right: a quality-loss indicator (green for no loss, yellow for marginal, red for measurable). The Bose QC45 extraction result is shown at each rung — FP16 and INT8 produce identical schema JSON; INT4 shows one field as `null`. Framer Motion animates the "cursor" sliding down the ladder as the learner progresses through the quantization options. Distinct shape: rungs (horizontal lines) + flanking bars. Static-export-safe; all values hardcoded from pinned test output.

**NEW — `BatchingPipeline` (concept: continuous batching vs. sequential requests):**
Visual metaphor: two horizontal swim lanes. Top lane (sequential): requests arrive as discrete colored rectangles, each blocking the lane until complete — gaps visible between them. Bottom lane (vLLM continuous batching): new requests slot into the gaps; the lane is nearly solid. Framer Motion animates requests flowing in at a fixed arrival rate; the gap fills visually as batching engages. Distinct shape: horizontal request blocks in a timeline lane. No shapes reused from `QuantizationLadder`. Static-export-safe.

---

## 8. Teaching beats

1. **Concept: why inference cost is a product problem.** At 270 items/query × N queries/day, even a $0.001/item cost compounds. Show the $/1k-items table for all three configs before writing any code — the business case first.
2. **Concept: quantization intuition.** The `QuantizationLadder` animation. INT8 = store weights as 8-bit integers, dequantize at multiply time. Safe for schema-bound extraction because the output space is small and constrained.
3. **Code: `load_quantized_extractor(bits=8)` + CPU fallback.** Run it on the four hero titles. Show extraction output is identical to FP16 baseline. Measure wall-clock time.
4. **Concept: the confidence router.** Not every title needs the expensive model. Log-prob entropy as a confidence proxy — shown on the Bose QC45 listing where `condition` is uncertain.
5. **Code: `InferenceRouter`.** Wire into `extractor.py`. Run the 270-item snapshot through the router; show the 15% slow-path rate.
6. **Concept: continuous batching.** The `BatchingPipeline` animation. Why sequential requests leave GPU idle between completions; how vLLM fills that gap.
7. **Code: vLLM Docker Compose + `vllm_client.py` + `/extract/batch`.** Spin up locally, run the 18 headphone items as a batch, observe p50 latency drop.
8. **Code: `bench_inference.py`.** Run all three configs against the full 270-item snapshot. Produce the summary table. Walk through interpreting p50 vs. p99 — the Bose QC45 and other low-confidence items inflate p99 because they hit the slow path.
9. **Proof: quality gate.** Run the golden extraction set (from Part 19) against the INT8 model. Assert precision does not regress below the Part 19 threshold. This is the optimization contract: speed gains are only valid if quality holds.
10. **Synthesis: where optimization sits in the stack.** Part 22's semantic cache reduces calls; Part 23's quantization + routing reduces cost per call. Part 26 (Observability & FinOps) will instrument both in a live cost dashboard.

---

## 9. Cross-references

**Back:** Part 22 (Serve it fast & cheap) introduced the FastAPI inference endpoint and semantic cache that are the baseline for Part 23's benchmark. The `/extract` endpoint defined in Part 22 is extended here with `/extract/batch`; the semantic cache remains in place and is treated as a pre-filter before the quantized model is invoked.

**Forward:** Part 24 (Containerize & ship) packages the vLLM Docker Compose service defined in Part 23 into the production multi-container stack, adds it to the CI/CD pipeline, and shows how to pin the model image version in Terraform — so the optimization work lands in the real deployment.

---

## 10. Reproducibility checks

`companions/dealfinder/tests/test_bench.py` MUST assert (all run against frozen snapshot, CPU mode):

```python
# Router: ~15% of 270 items routed to slow path (tolerance ±5%)
slow_path_count = sum(1 for r in results if r.tier == ModelTier.SLOW)
assert 30 <= slow_path_count <= 50  # 11–18% of 270

# Confidence: Bose QC45 at $46 is always slow-pathed
bose_result = next(r for r in results if "QuietComfort 45" in r.title and r.price == 46.0)
assert bose_result.tier == ModelTier.SLOW

# INT8 quality: schema fields match FP16 for the four hero listings
for hero in hero_fp16_outputs:
    int8_output = quantized_extractor.extract(hero.title)
    assert int8_output.brand == hero.fp16_output.brand
    assert int8_output.model == hero.fp16_output.model
    # condition may differ for ambiguous listings (Bose QC45); assert only for clean titles
    if hero.confidence > 0.6:
        assert int8_output.condition == hero.fp16_output.condition

# Latency ratio: INT8 p50 must be faster than FP16 p50 (ratio, not absolute ms)
assert bench_results["int8"]["p50_ms"] < bench_results["fp16"]["p50_ms"] * 0.85

# vLLM batch p50-per-item must be faster than sequential p50
assert bench_results["vllm_batch"]["p50_per_item_ms"] < bench_results["fp16"]["p50_ms"] * 0.50

# Golden set quality gate (from Part 19 golden extraction set)
int8_precision = evaluate_extraction(quantized_extractor, golden_set)
assert int8_precision >= GOLDEN_PRECISION_THRESHOLD - 0.02  # allow 2pp regression at most
```

All ratio thresholds are set conservatively for CPU mode; the tutorial notes that GPU execution will exceed them.

---

## 11. Risks / notes

- **GPU dependency:** quantization with `bitsandbytes` requires CUDA for real speedups. The `load_quantized_extractor` function includes a CPU fallback that skips quantization (`load_in_8bit=False`) and logs a warning. CI runs in CPU mode; the tutorial is explicit that the latency numbers quoted in prose come from a GPU run (noted inline) while the ratio assertions hold on CPU.
- **vLLM in CI:** vLLM's full Docker image is ~10 GB. CI uses `vllm/vllm-openai:cpu` (smaller, slower) or mocks the `/v1/completions` endpoint via `pytest-httpx`. The `docker/vllm-compose.yml` has a `CI_MODE=1` env var that switches to the mock. The tutorial documents both paths.
- **Model choice:** `Qwen/Qwen2.5-0.5B-Instruct` is the default for local/CI (fits in 2 GB RAM, Apache 2.0 license). The router's slow path points to a configurable `SLOW_MODEL_URL` env var (defaults to `gpt-4o-mini` endpoint); the tutorial shows both a local and an API-backed slow-model configuration.
- **Non-determinism:** vLLM uses greedy decoding (`temperature=0`) for the extraction task — output is deterministic given a fixed model version. Pin the model commit hash in `vllm-compose.yml`.
- **GPTQ INT4:** the tutorial covers INT4 conceptually and in the `QuantizationLadder` animation but does not require learners to run it (no pre-quantized GPTQ checkpoint is committed). It is offered as a stretch exercise with a pointer to the AutoGPTQ docs.
- **Cost table:** the $/1k-items column uses a placeholder rate (`$0.0008/1k tokens`). The tutorial instructs the learner to substitute their actual provider rate. This is not a reproducibility issue because the ratio columns (INT8/FP16, vLLM/sequential) are what the test pins.
