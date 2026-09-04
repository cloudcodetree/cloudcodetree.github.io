# Part 19 — Evaluation as a discipline (golden sets, LLM-judge, error analysis)

**Phase:** P4 | **Data mode:** SNAP | **Bible note:** GAP #1

---

## 1. Objective

Build a structured evaluation harness for the DealFinder price model and LLM extractor — golden sets, an LLM-judge for free-text signals, and a systematic error-analysis loop — so every code change produces a score you can trust.

---

## 2. Prerequisites

- Part 6 — Structured extraction (messy titles → schema) [extractor under test]
- Part 17 — ML & DL breadth (gradient boosting + price-drop forecaster) [price model under test]
- Part 18 — Experiment tracking & model registry (MLflow) [run history, model versioning]

---

## 3. By the end, the learner can…

- Construct a golden evaluation set from the frozen snapshot with deliberate coverage of true positives, false positives, and outliers.
- Score the price model against the golden set with reproducible metrics (MAE, precision@k) pinned by a pytest assert.
- Run an LLM-judge prompt that grades free-text deal summaries for factual accuracy and flag rate.
- Perform a structured error-analysis pass that buckets failures by category and directs the next training iteration.
- Wire the eval gate into the MLflow run so a regression blocks promotion (see Part 20).

---

## 4. Data

**Source:** `companions/dealfinder/data/snapshots/electronics-2026-07.json` (270 items, 18 queries).

**Golden set construction:**
- Filter to anchor query `"noise cancelling headphones"` (15 items in snapshot).
- From those 15, hand-label 8 as the golden set, chosen to cover all verdict classes:
  - Sony WH-1000XM5 @ $162.97 (Costco) → label `fair` (sits at median $162.97, deal_pct ≈ 0%)
  - Sony WH-1000XM5 @ $248.00 (Macy's) → label `overpriced` (dedup duplicate; 52% above median)
  - Anker Soundcore Q20i @ $44.99 → label `deal` (72% below median; true positive)
  - Bose QuietComfort 45 @ $46.00 → label `suspicious` (deal_pct says 72% off a $329 flagship; false positive trap)
  - Sony WH-1000XM6 @ $399.99 → label `premium` (145% above median; legitimately top-tier)
  - Three additional mid-range items from snapshot to reach 8 total (real ids from the snapshot).
- Cross-category stress items: 2 items from `accessories` category where naive deal_pct is pathological (deal_pct < −500%) — label `outlier`. These come from the snapshot's accessories rows; no values invented.

**Metrics computed entirely from the snapshot:**
- Price model MAE on the 8-item golden set (derived from Part 17's trained model).
- Precision@3 for deal ranking over the full 15 noise-cancelling-headphones items.
- LLM-judge pass rate on 8 generated deal summaries.

No live API calls in this part.

---

## 5. Worked example

**Input:** golden set row — Bose QuietComfort 45, price $46.00, query `"noise cancelling headphones"`, snapshot median $162.97.

**Naive signal:** `deal_pct` = (162.97 − 46.00) / 162.97 = **71.8%** → system ranks it #1 deal. The extractor produces: `{ brand: "Bose", model: "QuietComfort 45", condition: "new", price: 46.00 }`.

**Price model residual (Part 17 model):** predicted fair price for a Bose QC45 in `new` condition ≈ $245 → residual = $245 − $46 = **+$199**. Combined two-signal score demotes it from #1 to `suspicious`.

**LLM-judge call:** pass the deal summary `"Bose QuietComfort 45 noise cancelling headphones — $46, 72% below median, brand new condition"` to the judge prompt. Judge grades: `{ factual: false, reason: "Price inconsistent with new-condition flagship MSRP; likely refurb or mislisting" }`. Flag rate on this golden set: 1/8 = **12.5%**.

**Error analysis:** bucket failures by category → the 2 `accessories` outlier items both have `deal_pct < −500%`; root cause = accessories priced against a cross-category median. Recommendation: category-aware median (motivates Part 20's retrain trigger).

**Golden set precision@3:** after two-signal reranking, top-3 deals are Anker Q20i ($44.99), one mid-range item, and the XM5 at $162.97 (fair). Bose QC45 is now rank 6. Precision@3 = 3/3 = **1.0** (all three are genuinely fair or better). Naive median-only precision@3 = 2/3 (Bose QC45 was in top-3 before the model guard).

---

## 6. Companion code

**Existing modules touched:**
- `dealfinder/evaluate.py` — NEW file introduced in this part; houses `build_golden_set()`, `score_price_model()`, `run_llm_judge()`, `error_analysis_report()`.
- `dealfinder/price_model.py` — imported (read-only); the trained model from Part 17.
- `dealfinder/aggregate.py` — imported for `deal_pct` computation.
- `tests/test_evaluate.py` — NEW; pins MAE and precision@3 with pytest asserts.

**Step tags:** `step-19a` (golden set + price model eval) → `step-19b` (LLM-judge + error analysis report). Both are new steps in the `tutorial-dealfinder` companion repo on branch `draft/electronics-regen`.

**Code delta:** ~180 lines net new (`evaluate.py` + test file). No existing module is modified.

---

## 7. Animations

1. **REUSE `EvalGauntlet`** — re-theme the 4 cases from tent items to the 8 electronics golden-set rows (Sony XM5 fair ✓, Anker Q20i deal ✓, Bose QC45 suspicious ✗ naive / ✓ after model, Sony XM6 premium ✓). The stamp-and-flip motion makes visible how each item enters the gauntlet, is graded, and tallies a score. Change the label from `exact_match` to `precision@3` and show the naive vs. two-signal comparison in the footer.

2. **NEW — `ErrorBuckets`** — visual metaphor: a horizontal bar chart of failure counts by category (audio, accessories, misc), animated bars that grow left-to-right with Framer Motion `scaleX`. Each bar is labelled with the root-cause tag (e.g., "cross-category median", "condition mismatch", "outlier price"). No shapes reused from other components; the distinct shape is a **stacked-bar / funnel of category buckets** showing where the model bleeds precision. Static-export-safe: all data hardcoded from the golden set run.

---

## 8. Teaching beats

1. **Why eval is not optional** — the Bose QC45 example: the system currently promotes a $46 flagship to #1. Without a golden set you wouldn't know.
2. **Build the golden set** — coverage criteria (true positives, false positives, outliers, price tiers). Code: `build_golden_set()` reading from snapshot.
3. **Score the price model** — MAE on 8 items; run `score_price_model()`, see the Bose residual at +$199, confirm it moves from rank 1 to rank 6.
4. **Precision@k** — what it measures, why it fits ranking tasks better than accuracy. Compute naive vs. two-signal for the headphones query.
5. **LLM-judge** — prompt design: judge is given item title + price + deal summary, returns `{ factual, reason }`. Show the Bose verdict. Discuss cost (~$0.002/call at Haiku rates) and non-determinism mitigation (temperature=0, seed).
6. **Error analysis** — `error_analysis_report()` groups misses by category; the accessories outliers cluster immediately. This directly motivates the retrain in Part 20.
7. **Pin it** — `tests/test_evaluate.py`: `assert mae < 80` and `assert precision_at_3 >= 0.9`. These run in CI.

---

## 9. Cross-references

**Back:** Part 18 — Experiment tracking & model registry (MLflow) logged the model run and checkpointed the trained price model; this part consumes that artifact via `mlflow.artifacts.load_model` and adds the eval score as a metric to the same run.

**Forward:** Part 20 — Closing the MLOps loop (drift → retrain → eval gate → canary) ingests the error-analysis report from this part as its drift signal; the category-bucket breakdown (`accessories` outliers) is the trigger condition for the selective retrain.

---

## 10. Reproducibility checks

```python
# tests/test_evaluate.py
from dealfinder.evaluate import build_golden_set, score_price_model, precision_at_k

golden = build_golden_set("companions/dealfinder/data/snapshots/electronics-2026-07.json",
                           query="noise cancelling headphones", n=8)
assert len(golden) == 8

mae, ranked = score_price_model(golden)
assert mae < 80, f"MAE {mae:.1f} exceeds threshold"

p3 = precision_at_k(ranked, k=3)
assert p3 >= 0.9, f"precision@3 {p3:.2f} below threshold"

# Confirm Bose QC45 is NOT in top-3 after two-signal scoring
top3_ids = [item["id"] for item in ranked[:3]]
bose_id = next(g["id"] for g in golden if "QuietComfort 45" in g["title"])
assert bose_id not in top3_ids, "Bose QC45 false-positive still in top-3"
```

All asserts run offline against the frozen snapshot. No API call, no GPU.

---

## 11. Risks / notes

- **LLM-judge non-determinism:** the judge prompt runs at `temperature=0`; the tutorial notes the output can still vary across model versions. The test does NOT assert judge verdicts — it asserts only that the call returns a dict with `factual` and `reason` keys and that flag_rate is computed without error. Actual judge output is logged, not pinned.
- **Model artifact dependency:** `score_price_model()` requires the Part 17 trained model. The companion repo step `step-19a` bundles a pre-trained checkpoint (`models/price_model_v1.pkl`, 42 KB, committed) so this part can run standalone without completing Part 17 first.
- **LLM API cost:** 8 judge calls × ~400 tokens ≈ $0.016 at Claude Haiku pricing. Acceptable for a tutorial; `run_llm_judge()` accepts a `dry_run=True` flag that returns a canned response for CI.
- **Golden set label subjectivity:** the 3 mid-range items added to reach 8 are chosen from real snapshot ids (documented in `evaluate.py` comments with their snapshot `id` values). Labels are encoded as a dict literal in the function — not inferred by a model — so they are stable and reviewable.
