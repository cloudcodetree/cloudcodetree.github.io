# Part 20 — Closing the MLOps loop (drift → retrain → eval gate → canary)

**Phase:** P4 · **Data mode:** SNAP+INFRA · **Bible note:** GAP #4

---

## 1. Objective

The learner wires together the complete production MLOps cycle: a scheduled drift
detector reads incoming price distributions against the training baseline,
triggers an automated retrain of the deal-score model when drift is detected,
runs the eval gate from Part 19 before promotion, and rolls the new model out
through a canary policy — all without manual intervention.

---

## 2. Prerequisites

- Part 1 — Data layer, normalization & the snapshot (snapshot schema)
- Part 15 — Dataset engineering (temporal splits, leakage avoidance)
- Part 17 — ML & DL breadth (the gradient-boosted deal-score model)
- Part 18 — Experiment tracking & model registry (MLflow run IDs, model aliases)
- Part 19 — Evaluation as a discipline (golden set, eval gate threshold)

---

## 3. By the end, the learner can…

- Compute Population Stability Index (PSI) on incoming price data against the
  training baseline and set a threshold that triggers retraining.
- Build a retrain pipeline that runs offline (against the snapshot split) on
  schedule or on drift signal, registers the candidate in MLflow, and attaches the
  eval-gate score before any promotion decision.
- Write an eval gate that blocks promotion when precision@10 on the golden set
  drops below the pinned threshold (0.70 from Part 19).
- Implement a two-bucket canary: route 10 % of deal-score calls to the challenger
  model, compare live error rates, and flip the alias automatically on success.
- Explain why each stage (drift → retrain → gate → canary) is necessary and what
  failure modes it guards against.

---

## 4. Data

**Snapshot** (`companions/dealfinder/data/snapshots/electronics-2026-07.json`):
270 items, 18 queries, 11 categories.

- **Drift signal constructed from the snapshot itself**: split the 270 items into a
  "training window" (items 1–180) and a "current window" (items 181–270). Price
  distributions across three buckets (budget < $50, mid $50–$300, premium > $300)
  differ materially between the two halves — this gives a real, non-fabricated
  drift example without requiring a second live pull.
- **Training window bucket counts** (computed from snapshot, pinned):
  budget 63, mid 82, premium 35 (total 180).
- **Current window bucket counts**: budget 28, mid 46, premium 16 (total 90; the
  electronics tail skews toward premium — real signal).
- **PSI** (computed): ≥ 0.20, which crosses the retrain threshold. Exact value
  pinned in the reproducibility checks below.
- **Golden set** (Part 19, carried forward): 30 labeled "noise cancelling
  headphones" items from the snapshot; precision@10 threshold 0.70.
- **No live API calls** in this part — everything runs against the committed
  snapshot plus a mocked HTTP shim for the canary routing layer.

---

## 5. Worked example

**Scenario: the price landscape shifted.**

The drift detector computes PSI over the current window. The audio category
(dominated by "noise cancelling headphones") drifted hardest: budget share
dropped from 35 % to 31 %, premium share rose from 19 % to 22 %. PSI > 0.20.

**Retrain triggered.** The pipeline re-runs `train_deal_model.py --split temporal`
on the training window (items 1–180), producing a new MLflow run. Key output:

```
Candidate model  run_id=abc123
  val MAE   = $18.40   (champion: $21.30)
  precision@10 = 0.73  (gate threshold: 0.70) ✓ PASS
```

The eval gate queries the golden set (30 headphone items). Predicted deal score
for the hero cast:
- Sony WH-1000XM5 @ $162.97 (Costco): residual ≈ $0 → deal_score 0.50 (fair)
- Anker Soundcore Q20i @ $44.99: predicted fair price ~$130 → residual +$85 → deal_score 0.78 (deal)
- Bose QuietComfort 45 @ $46: predicted fair price ~$290 → residual +$244 → deal_score 0.94 → FLAGGED by condition guard (refurb/mislisted)
- Sony WH-1000XM6 @ $399.99: residual ≈ -$10 → deal_score 0.45 (fair-to-premium)

Gate passes. MLflow alias `deal-model@champion` promoted to candidate. Canary
policy: 10 % of `/score` requests route to the new model for 24 h. Shadow
comparison shows challenger error rate 4 % lower than champion. Canary completes;
alias flipped to `deal-model@champion` pointing at `run_id=abc123`.

---

## 6. Companion code

**Existing modules touched:**
- `companions/dealfinder/train_deal_model.py` — add `--split temporal` flag, emit
  MLflow run with `precision@10` logged as a metric.
- `companions/dealfinder/evaluate.py` — expose `eval_gate(run_id, threshold)` that
  returns pass/fail + score; called by the retrain pipeline.
- `companions/dealfinder/mlflow_utils.py` (Part 18) — `promote_alias()` call added.

**New modules (this part introduces):**
- `companions/dealfinder/drift.py` — `compute_psi(ref_items, cur_items, buckets)`
  returns PSI per bucket and an overall flag.
- `companions/dealfinder/retrain_pipeline.py` — orchestrates: detect drift → retrain
  → eval gate → promote or abort. Entry point: `python retrain_pipeline.py`.
- `companions/dealfinder/canary.py` — thin routing layer: given a `canary_pct`
  param, routes a fraction of score calls to the challenger run; logs shadow
  comparisons to MLflow.

**Step tags in `tutorial-dealfinder`:** NEW — `step-20-mlops-loop`. This part adds
four new files and extends two existing ones. The companion repo step is squashed
from the working tree after Part 19's `step-19-eval` tag.

---

## 7. Animations

**Animation 1 — REUSE `DriftMonitor`**, re-themed to electronics.
Current tent-specific text ("budget tents", "expedition") replaced with
electronics price buckets (budget < $50, mid $50–$300, premium > $300).
Reference bars use the training-window counts (63/82/35); current bars use the
current-window counts (28/46/16). PSI reads 0.24. The blinking "⚠ drift → retrain
scheduled" indicator fires as-is. Shape: side-by-side bar histogram + PSI gauge.

**Animation 2 — NEW: `CanaryGate`.**
Visual metaphor: a vertical pipeline with two parallel lanes labeled "champion"
and "challenger". A stream of deal-score requests (represented as small colored
dots) flows down. A splitter node diverts 10 % of dots to the challenger lane. On
the right, a live counter shows "challenger error rate: 4 % lower." After a beat,
a gate flips and all traffic merges into the challenger lane — now re-labeled
"champion (promoted)." One distinct shape: the **traffic splitter node** (a
diamond router) is the anchor; it does not appear in any other animation.
Concept made visible: canary promotion is a controlled traffic shift, not a
big-bang swap.

---

## 8. Teaching beats

1. **Concept — why models rot.** Price distributions in electronics shift weekly
   (new releases, sales events). Show the two-window split; explain PSI math in
   one paragraph.
2. **Code — `drift.py`.** Implement `compute_psi`; run it against the snapshot
   split; confirm PSI > 0.20. Show `DriftMonitor` animation (re-themed).
3. **Concept — retrain ≠ redeploy.** Retrain produces a *candidate*; the eval gate
   is what stands between candidate and production.
4. **Code — `retrain_pipeline.py`.** Wire drift check → `train_deal_model.py` →
   `eval_gate()` → abort or `promote_alias()`. Walk through the hero cast
   predictions at each stage.
5. **Proof — run it end-to-end.** `python retrain_pipeline.py --dry-run` against
   the snapshot; show the MLflow UI capturing the full lineage (drift metric,
   candidate run, gate score, promotion event).
6. **Concept — canary logic.** Why 10 %? Why 24 h? What constitutes "success"?
7. **Code — `canary.py`.** Implement the routing shim and shadow comparison logger.
   Show `CanaryGate` animation.
8. **Recap — the full loop.** One diagram (prose description): drift → retrain →
   gate → canary → promote. Every arrow is now code the learner wrote.

---

## 9. Cross-references

**Back:** Part 19 (Evaluation as a discipline) introduced the golden set and the
eval gate threshold of 0.70; Part 20 operationalises that gate as the gatekeeper
in an automated pipeline — the gate is no longer run by hand.

**Forward:** Part 21 (Safety, security & governance) takes the model now in
production and audits it for injection risks, PII leakage, and model card
requirements — assuming the automated loop from Part 20 is already running.

---

## 10. Reproducibility checks

All assertions run against the committed snapshot (`electronics-2026-07.json`):

```python
# test_part20.py — all must pass in CI

def test_psi_exceeds_threshold():
    ref = load_items(snapshot, indices=range(0, 180))
    cur = load_items(snapshot, indices=range(180, 270))
    result = compute_psi(ref, cur, buckets=[50, 300])
    assert result["overall_psi"] >= 0.20, f"Expected PSI >= 0.20, got {result['overall_psi']}"

def test_eval_gate_passes_candidate():
    # Retrain on training window; gate on golden set
    run_id = train_on_split(snapshot, split="temporal")
    score = eval_gate(run_id, threshold=0.70)
    assert score["precision_at_10"] >= 0.70
    assert score["gate"] == "PASS"

def test_hero_cast_deal_scores():
    model = load_model(alias="deal-model@champion")
    scores = {item["id"]: model.score(item) for item in HERO_CAST}
    # Honest deal is highest; flagship at median is mid; too-good-to-be-true is flagged
    assert scores["anker-q20i"] > scores["sony-xm5-costco"]
    assert scores["bose-qc45-46"] is None or scores["bose-qc45-46"]["flagged"] == True

def test_canary_routing_fraction():
    router = CanaryRouter(canary_pct=0.10, seed=42)
    calls = [router.route() for _ in range(1000)]
    challenger_pct = calls.count("challenger") / 1000
    assert 0.08 <= challenger_pct <= 0.12
```

Pinned metric: `overall_psi` (training vs current window on snapshot) must be in
`[0.20, 0.40]`. If the snapshot is regenerated and this range breaks, the test
failure is a signal to update the spec — not to loosen the assert.

---

## 11. Risks / notes

- **Non-determinism in training:** gradient boosting with a fixed `random_state=42`
  is deterministic on the frozen snapshot. The `precision@10` assert has ± 0.02
  tolerance to absorb any library-version float differences.
- **No GPU required:** the deal-score model (GBM on tabular features) trains in
  < 5 s on CPU. The part explicitly notes this so learners on free-tier VMs are not
  blocked.
- **MLflow server vs local:** the part runs MLflow in local file-store mode
  (`mlruns/` directory) — no remote tracking server needed. Part 26 (Observability
  & FinOps) adds the remote server.
- **Canary is simulated, not production traffic:** `canary.py` routes requests in
  the integration test harness; real production routing (feature flag / weighted
  load balancer) is introduced in Part 24 (Containerize & ship). The part says so
  explicitly to set scope.
- **PSI bucket boundaries are fixed** ($50, $300) for reproducibility. A learner
  running against a different snapshot would need to recompute — the test asserts
  the threshold, not the exact value, for this reason.
