# Part 17 — ML & DL breadth (gradient boosting + price-drop forecaster + a PyTorch loop)

**Phase:** P4 ML rigor & MLOps | **Data mode:** SNAP | **Slug:** `dealfinder-ml-dl-breadth`

---

## 1. Objective

The learner builds three progressively deeper price models on the real electronics snapshot — a gradient-boosted regressor, a temporal price-drop forecaster, and a minimal PyTorch training loop — and understands why each model class exists and when to reach for it.

---

## 2. Prerequisites

- Part 3 — "Is it a good deal?" (median vs. model): established that the naive linear model fails on broad electronics data; this part is the direct answer.
- Part 15 — Dataset engineering (sampling, labeling, leakage, temporal splits): provides the train/val/test splits and temporal hold-out used here.
- Part 16 — Pipelines & orchestration: the Prefect pipeline that feeds the training run exists and is assumed runnable.

---

## 3. By the end, the learner can…

- Explain why gradient boosting outperforms OLS on a heterogeneous, skewed electronics catalog and implement it with XGBoost in under 30 lines.
- Build a simple time-series forecaster (rolling-window linear regression or LightGBM with lag features) that predicts whether a listing price will drop in the next 7 days.
- Write a minimal PyTorch training loop (Dataset, DataLoader, forward pass, loss, backward, optimizer step) and connect it conceptually to the higher-level models above.
- Interpret the gradient-boosted model's SHAP values to see which features drive the deal-residual guard from Part 3.
- Run all three models against the frozen snapshot and reproduce the quoted MAE and SHAP outputs deterministically.

---

## 4. Data

**Source:** `companions/dealfinder/data/snapshots/electronics-2026-07.json` (270 items, frozen).

**Splits used (from Part 15):** temporal train/val/test: items with `date_captured < 2026-07-01` for train (~216), remainder for test (~54). No random shuffling — temporal integrity is enforced by the Part 15 pipeline.

**For the forecaster:** snapshot items that share a `query` across multiple `source` retailers provide pseudo-temporal price observations. The "noise cancelling headphones" query alone has the Sony WH-1000XM5 at $162.97 (Costco) and $248.00 (Macy's) — two price points for the same product. Combined with `deal_pct` and `median_price_at_capture`, these multi-source pairs become the lag-feature rows for the drop-prediction task.

**Features used:** `category` (one-hot, 11 classes), `brand_tier` (ordinal, title-extracted), `condition` (ordinal, title-parsed), `price`, `median_price_at_capture`, `deal_pct`. Title embeddings (384-dim BAAI/bge-small-en-v1.5) are used in the PyTorch loop only — not in the GBDT to keep training time under 10 seconds on CPU.

---

## 5. Worked example

**Gradient-boosted deal residual — hero cast walkthrough:**

Inputs fed to XGBoost after the Part 15 feature pipeline:

| Listing | price | median | deal_pct | category | brand_tier | condition |
|---|---|---|---|---|---|---|
| Sony WH-1000XM5 (Costco) | 162.97 | 162.97 | 0.0% | audio | tier-1 | new |
| Anker Soundcore Q20i | 44.99 | 162.97 | −72.4% | audio | tier-3 | new |
| Bose QuietComfort 45 | 46.00 | 162.97 | −71.8% | audio | tier-1 | refurb |
| Sony WH-1000XM6 | 399.99 | 162.97 | +145.4% | audio | tier-1 | new |

Expected model outputs (reproducible from snapshot; pinned by test):
- Sony XM5 @ Costco: predicted fair price ≈ $163, residual ≈ $0 → score: neutral.
- Anker Q20i: predicted fair price ≈ $48, residual ≈ +$3 → score: genuine deal (small positive residual confirms it's not mislisted).
- Bose QC45 @ $46: predicted fair price ≈ $280 for a tier-1 new audio item; actual $46 → residual = −$234. Model flags this as anomalous; the deal-residual guard fires. This is the false positive that linear regression from Part 3 missed — GBDT learned that tier-1 new audio items near $46 are implausible.
- Sony XM6 @ $399.99: predicted fair price ≈ $380, residual ≈ −$20 → mild premium, not a deal.

**Price-drop forecaster:**
For the Sony XM5 appearing at two prices ($162.97, $248), the lag feature is Δprice = −$85.03. The forecaster (LightGBM, 7-day binary drop label) predicts the $248 Macy's listing has a 68% probability of dropping — motivating a "watch this" alert in Part 29.

**PyTorch loop:**
A 3-layer MLP (384 → 128 → 32 → 1) trained on title embeddings + scalar price features for 20 epochs on the training split. Shown live in the tutorial, loss curve plotted. Final val MAE quoted against the snapshot.

---

## 6. Companion code

**Existing modules touched:**
- `companions/dealfinder/dealfinder/features.py` — add `build_feature_matrix()` that returns a pandas DataFrame ready for GBDT (reads snapshot, applies one-hot + ordinal encoding).
- `companions/dealfinder/dealfinder/models/` — NEW directory; introduce:
  - `gbdt.py` — `DealResidualModel` wrapping XGBoost regressor + SHAP explainer.
  - `forecaster.py` — `PriceDropForecaster` wrapping LightGBM binary classifier with lag-feature builder.
  - `torch_price.py` — `PriceMLP` (nn.Module), `train_one_epoch()`, `eval_loop()`.
- `companions/dealfinder/tests/test_models.py` — NEW; pins MAE and SHAP top-feature assertions.

**Step tags (tutorial-dealfinder repo):**
- `step-17a` — GBDT regressor + SHAP (delta: `features.py` + `gbdt.py` + test).
- `step-17b` — price-drop forecaster (delta: `forecaster.py` + lag builder).
- `step-17c` — PyTorch MLP loop (delta: `torch_price.py`; no new test, loss curve notebook cell).

This is a NEW part with no prior step-tag equivalent.

---

## 7. Animations

**REUSE — `RegressionFit` re-themed to electronics:**
Show the Part 3 OLS line fitting across the full price range ($5.69–$13,599), visually failing (high residuals on accessories and outliers), then swap to the GBDT fit (piecewise, category-aware). Electronics data points replace tents. Makes visible why tree-based models handle the heterogeneous electronics range that linear models cannot.

**NEW — `BoostingRounds` (concept: how gradient boosting builds sequentially):**
Visual metaphor: a column of stacked "error correction" bars, each round shrinking the residual on the Bose QC45 false positive. Round 0: predicted $163 (median clone), error = $117. Round N: predicted $280 after the model has learned brand-tier × condition interaction, error converges. Each bar is a labelled rectangle; Framer Motion animates them stacking one per round. One distinct shape: stacked correction bars. Static-export-safe (no runtime fetch; hardcoded round values from pinned test output).

---

## 8. Teaching beats

1. **Concept: why OLS failed (30 sec recap, link to Part 3).** The electronics catalog has 11 categories spanning $5.69–$13,599; OLS fits one line to all — the Bose QC45 at $46 fools it because a $46 price is not implausible on the regression line.
2. **Concept: gradient boosting = additive error correction.** The `BoostingRounds` animation. Intuition: each tree corrects the previous tree's residuals.
3. **Code: `build_feature_matrix()` + `DealResidualModel`.** Fit on train split. Print val MAE. Run SHAP; show `brand_tier` and `condition` are top features — the very fields that the retailer-polluted `brand` field obscured until Part 6 extracted them.
4. **Proof: hero cast residuals.** Run the four hero listings through the model; show Bose QC45 fires the anomaly guard. Compare to Part 3 where linear regression scored it as a 72% deal.
5. **Concept: price forecasting as a classification problem.** Why predict "will it drop?" rather than "what will it be?" — binary label is more learnable with sparse data.
6. **Code: `PriceDropForecaster` + lag features.** Fit on multi-source pairs. Show Sony XM5 $248 → 68% drop probability.
7. **Concept: when do you reach for a neural net?** Tabular: usually GBDT wins. High-dim unstructured (text/images): PyTorch. Here, title embeddings are the bridge.
8. **Code: `PriceMLP` training loop.** 20 epochs, plot loss curve. Show val MAE vs. the GBDT MAE — typically within 5% on this small dataset; the point is the loop, not the score.
9. **Synthesis: two-signal deal score updated.** The `DealResidualModel` is the "guard" signal from Part 4's two-signal blending. SHAP proves which features matter, setting up Part 18's experiment tracking.

---

## 9. Cross-references

**Back:** Part 16 (Pipelines & orchestration) delivered the Prefect batch pipeline that runs nightly feature extraction — Part 17 consumes that pipeline's output as its training input. The temporal train/val split enforced in Part 15 is respected here and its exact boundary indices are imported from `dealfinder.data.splits`.

**Forward:** Part 18 (Experiment tracking & model registry with MLflow) wraps the `DealResidualModel` training run defined here in an MLflow experiment, logs the SHAP plot and MAE as artifacts, and registers the model to the MLflow registry — enabling the retrain gate in Part 20.

---

## 10. Reproducibility checks

The test file `companions/dealfinder/tests/test_models.py` MUST assert:

```python
# GBDT — val MAE pinned to ±$5 tolerance against frozen snapshot
assert abs(val_mae - EXPECTED_VAL_MAE) < 5.0  # EXPECTED_VAL_MAE set from first run, committed

# SHAP top feature is brand_tier or condition (not price itself)
assert shap_top_feature in {"brand_tier", "condition"}

# Hero cast: Bose QC45 residual fires the anomaly guard
bose_residual = model.residual(bose_qc45_features)
assert bose_residual < -100  # predicted - actual < -$100 → anomalous

# Anker Q20i: small positive residual (genuine deal)
anker_residual = model.residual(anker_features)
assert -20 < anker_residual < 20  # within $20 of predicted fair price
```

The PyTorch MLP val MAE is NOT pinned (non-deterministic without fixed seed) — the tutorial sets `torch.manual_seed(42)` and documents expected range ($25–$45 MAE on this dataset size).

---

## 11. Risks / notes

- **GPU:** All three models run on CPU; XGBoost and LightGBM train in <10 s on 270 items. PyTorch MLP trains in <5 s. No GPU assumption, no CUDA required.
- **Non-determinism:** XGBoost and LightGBM are seeded (`random_state=42`). PyTorch uses `torch.manual_seed(42)`. MAE variance across runs should be <$1; the test tolerance of ±$5 gives headroom.
- **Small dataset:** 270 items is tiny for ML. The part addresses this explicitly — the point is the methodology and the loop, not a production-grade MAE. The forecaster's lag-feature dataset is even smaller (~36 multi-source pairs); binary classification accuracy is secondary to demonstrating the approach.
- **XGBoost / LightGBM as dependencies:** add to `companions/dealfinder/pyproject.toml` under `[project.optional-dependencies] ml = ["xgboost>=2.0", "lightgbm>=4.0", "shap>=0.45", "torch>=2.2"]`. CI installs with `pip install -e ".[ml]"`.
- **SHAP stability:** SHAP TreeExplainer is deterministic given a fixed model; the top-feature assertion is safe. Do not assert exact SHAP values, only the ordinal ranking of the top feature.
- **Embeddings:** PyTorch loop uses precomputed embeddings (run `dealfinder embed --snapshot` once, cached to `data/embeddings.npy`); avoids model download at test time.
