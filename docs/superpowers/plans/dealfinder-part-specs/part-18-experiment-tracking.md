# Part 18 — Experiment tracking & model registry (MLflow)

**Slug:** `dealfinder-experiment-tracking`  
**Phase:** P4 — ML rigor & MLOps  
**Data mode:** SNAP  
**Bible note:** GAP #2

---

## 1. Objective

The learner instruments the Part 17 gradient-boosted deal-score model with MLflow so every training run is logged, compared, and promoted to a versioned model registry — turning ad-hoc experiments into a reproducible audit trail.

---

## 2. Prerequisites

- Part 3: "Is it a good deal?" — median vs. model (baseline deal score, snapshot labels)
- Part 15: Dataset engineering (temporal split, label schema, leakage guards)
- Part 17: ML & DL breadth (the GBM price model being tracked here)

---

## 3. By the end, the learner can…

- Launch a local MLflow tracking server and log params, metrics, and artifacts from a training run with three lines of code.
- Compare two or more runs in the MLflow UI (e.g., `max_depth=4` vs. `max_depth=8`) and identify the best by validation MAE.
- Register the winning model in the MLflow Model Registry, assign it a stage (`Staging` → `Production`), and load it by alias in downstream code.
- Reproduce any past run exactly by pinning to its `run_id` and committed snapshot version.
- Write a pytest fixture that asserts a new run's MAE stays within a tolerance band of the registered Production model (the eval gate wired in Part 20).

---

## 4. Data

**Source:** frozen snapshot `companions/dealfinder/data/snapshots/electronics-2026-07.json` (270 items, 18 queries).

Subset used:

- **Query filter:** `query == "noise cancelling headphones"` → ~18 items for the worked example walkthrough (the hero cast lives here).
- **Full training set:** all 270 items, `category`-stratified 80/10/10 train/val/test split produced by `data/make_splits.py` (introduced Part 15). The val split (27 items) is the one MLflow logs `val_mae` against.
- No live API calls; MLflow tracking server runs at `http://127.0.0.1:5000` (local, no cloud account needed).

---

## 5. Worked example

**Setup:** `mlflow server --backend-store-uri sqlite:///mlruns.db --default-artifact-root ./mlartifacts`

**Run A — baseline (`max_depth=4`, `n_estimators=100`):**

```python
with mlflow.start_run(run_name="gbm-depth4"):
    mlflow.log_params({"max_depth": 4, "n_estimators": 100, "features": "cat+brand_tier+condition"})
    model = train_price_model(X_train, y_train, max_depth=4, n_estimators=100)
    val_mae = evaluate(model, X_val, y_val)          # → ~$28.40 on the 27-item val split
    mlflow.log_metric("val_mae", val_mae)
    mlflow.sklearn.log_model(model, "price_model")
```

**Run B — deeper tree (`max_depth=8`, `n_estimators=200`):**

Same code, different params. Val MAE → ~$23.10 (title embeddings carry more signal with the deeper tree).

**Hero cast predictions logged as artifacts (Run B):**

| Item | actual | predicted | residual |
|---|---|---|---|
| Sony WH-1000XM5 @ Costco | $162.97 | $158.20 | −$4.77 |
| Sony WH-1000XM5 @ Macy's | $248.00 | $158.20 | +$89.80 (overpriced flag) |
| Anker Soundcore Q20i | $44.99 | $52.30 | −$7.31 (true deal confirmed) |
| Bose QuietComfort 45 | $46.00 | $189.40 | +$143.40 (trap — price model agrees) |
| Sony WH-1000XM6 | $399.99 | $381.60 | −$18.39 |

All five rows are logged as a CSV artifact (`hero_predictions.csv`) under Run B. The Bose trap residual (+$143) is the visual payoff: the model flags it even though `deal_pct` said "72% off."

**Registry promotion:**

```python
mlflow.register_model(f"runs:/{run_b_id}/price_model", "DealFinderPriceModel")
client.transition_model_version_stage("DealFinderPriceModel", version=1, stage="Production")
```

Loading in `score.py`: `model = mlflow.sklearn.load_model("models:/DealFinderPriceModel/Production")`.

---

## 6. Companion code

**Existing modules touched:**

- `dealfinder/train.py` — add `mlflow.start_run` context, `log_params`, `log_metrics`, `log_model` calls; add `--run-name` CLI flag.
- `dealfinder/score.py` — replace hardcoded `joblib.load` with `mlflow.sklearn.load_model("models:/DealFinderPriceModel/Production")`.
- `dealfinder/evaluate.py` — expose `val_mae` / `val_r2` as return values so `train.py` can log them.

**New files:**

- `dealfinder/registry.py` — thin wrapper: `promote_to_production(run_id, model_name)`, `get_production_model(model_name)`.
- `tests/test_registry_gate.py` — pytest: trains a fresh run, asserts `val_mae < registered_production_mae * 1.05` (5% tolerance).
- `mlflow/` directory (gitignored except `mlruns.db` schema migration notes).

**Step tag:** `step-18-experiment-tracking` in `tutorial-dealfinder`. New part — no prior step covers this.

**Code delta:** ~120 lines (train.py patch ~40, registry.py ~35, test ~30, score.py patch ~15).

---

## 7. Animations

**Animation 1 — REUSE `RunHistory`**, re-themed from "live vs. offline CI lanes" to "experiment run comparison."  
Re-skin the two lanes as **Run A (depth=4)** and **Run B (depth=8)**; cells become metric stamps (`val_mae=$28.40`, `val_mae=$23.10`); the verdict row reads `"Run B wins → promoted to Production"`. The core shape (horizontal strip of stamped cells, two-lane contrast) is unchanged. This makes the comparison UI visceral without a new component.

**Animation 2 — NEW: `ModelRegistryFlow`**  
Visual metaphor: a vertical pipeline of three labeled stages (`Staging → Validation Gate → Production`) connected by animated arrows. A model card (showing `DealFinderPriceModel v1, MAE $23.10`) slides down the pipeline stage-by-stage on scroll. At the `Validation Gate` node, a tolerance-check badge pulses green ("MAE within 5% band"). The shape is a vertical swim-lane with flowing connector lines — distinct from every existing component. Makes the "registry is a promotion gate, not just storage" concept visible at a glance. Static-safe: all text in DOM, Framer Motion `whileInView`.

---

## 8. Teaching beats

1. **Problem** — two coworkers train the same model; neither can reproduce the other's numbers. No params, no artifact, no audit trail.
2. **Concept** — MLflow anatomy: Tracking (runs/params/metrics/artifacts) vs. Registry (versioned model lineage + stages).
3. **Code: instrument `train.py`** — three-line `mlflow.start_run` wrap; show the UI after Run A.
4. **Code: run comparison** — Run B with `max_depth=8`; open the Compare view; highlight `val_mae` column.
5. **Hero cast walkthrough** — log `hero_predictions.csv` as artifact; zoom in on Bose trap residual (+$143); this is the Bose false-positive proof that motivated the whole price model.
6. **Code: registry promotion** — `register_model` → `transition_stage("Production")`; update `score.py` to load by alias.
7. **Code: eval gate test** — `tests/test_registry_gate.py` asserts 5% tolerance; run it; it's the hook Part 20 (drift → retrain) will call in CI.
8. **Proof** — `mlflow runs list --experiment-name dealfinder` prints both runs; the registered model page shows `v1 Production`. Everything is reproducible from `run_id`.

---

## 9. Cross-references

**Back (Part 17):** Part 17 ("ML & DL breadth") hands off a trained gradient-boosted model evaluated in a notebook — this part picks up that model and puts it under systematic version control so the next training run doesn't silently overwrite the last.

**Forward (Part 19):** Part 19 ("Evaluation as a discipline") builds on the `hero_predictions.csv` artifact logged here, extending it into a formal golden set and LLM-judge pass; the registered Production model loaded via `mlflow.sklearn.load_model` is the target of that evaluation sweep.

---

## 10. Reproducibility checks

```python
# tests/test_experiment_tracking.py
def test_run_b_val_mae():
    """Run B (depth=8, n_estimators=200) must hit val_mae < 25.00 on the 27-item val split."""
    model = train_price_model(X_val_split, y_val_split, max_depth=8, n_estimators=200)
    mae = evaluate(model, X_val_split, y_val_split)
    assert mae < 25.00, f"val_mae={mae:.2f} exceeds ceiling"

def test_hero_bose_residual():
    """Bose QC45 @ $46 residual must exceed +$100 (price model flags the trap)."""
    model = mlflow.sklearn.load_model("models:/DealFinderPriceModel/Production")
    bose = snapshot_item("bose-quietcomfort-45-46usd")   # from fixture
    residual = model.predict([[...bose_features...]])[0] - 46.0
    assert residual > 100.0, f"Bose residual={residual:.2f}, expected >100"

def test_registry_gate_tolerance():
    """A fresh training run's val_mae must be within 5% of the Production model's."""
    prod_mae = get_production_mae("DealFinderPriceModel")
    new_mae = train_and_evaluate(X_train, y_train, X_val, y_val)
    assert new_mae <= prod_mae * 1.05
```

Snapshot path is pinned: `SNAPSHOT = "companions/dealfinder/data/snapshots/electronics-2026-07.json"`. All tests run offline (no MLflow server needed — use `mlflow.set_tracking_uri("sqlite:///test_mlruns.db")` in the fixture).

---

## 11. Risks / notes

- **MLflow server not required for logging.** If learners skip `mlflow server`, runs log to `./mlruns/` (file-based). The tutorial shows the UI as optional enrichment; the registry tests use an in-process SQLite URI so CI never needs a daemon.
- **Non-determinism in GBM.** Pin `random_state=42` in all `train.py` calls. The `val_mae < 25.00` ceiling gives a 2-point buffer over the ~$23.10 expected value.
- **MLflow version.** Pin `mlflow==2.13.*` in `pyproject.toml`; the `sklearn` flavor API changed in 2.14 for autolog. The tutorial uses explicit logging (not autolog) to keep the lesson legible.
- **No GPU, no cloud.** Everything runs locally on CPU in under 10 seconds for 270 items. No AWS/GCP credentials needed.
- **Registry stages deprecated in MLflow 2.x+.** The part uses `MlflowClient.set_registered_model_alias("champion")` as the primary pattern (the new API), with a note that `transition_model_version_stage` still works on 2.13 but is legacy.
