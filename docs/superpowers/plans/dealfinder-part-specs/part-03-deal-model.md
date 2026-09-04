# Part 03 — "Is it a good deal?" — median vs. model

**Phase:** P1 | **Data mode:** SNAP | **Slug:** `dealfinder-deal-model`

---

## 1. Objective

The learner builds and compares two deal-scoring methods — a naive category-median signal and a gradient-boosted price model — then understands why broad electronics data requires both signals blended into a two-signal deal score.

---

## 2. Prerequisites

- Part 1: Data layer, normalization & the snapshot (the snapshot is loaded, `brand` normalization is complete, `deal_pct` field exists)
- Part 2: How LLMs actually work — literacy (conceptual; no code dependency)

---

## 3. By the end, the learner can…

- Explain why a raw `deal_pct` (query-median) is fooled by outliers and cross-category bleed in a broad electronics corpus.
- Fit a gradient-boosted price model on `category`, `brand_tier`, `condition`, and title embeddings from the snapshot and interpret its residuals.
- Compute the two-signal deal score (median signal + model residual) for any item in the snapshot.
- Identify true positives (Anker Q20i), false positives (Bose QC45 at $46), and fair-price anchors (Sony XM5 at $162.97) using each signal independently and then blended.
- Write a pytest assertion that pins the blended score ordering for the hero cast.

---

## 4. Data

**Source:** `companions/dealfinder/data/snapshots/electronics-2026-07.json` (270 items, frozen).

Relevant subset — anchor query `"noise cancelling headphones"` (18–22 items in snapshot). Key fields used: `id`, `query`, `category`, `title`, `brand`, `price`, `deal_pct`, `median_price_at_capture`.

Specific items cited (all from snapshot, query = "noise cancelling headphones"):

| title (abbreviated) | price | deal_pct (snapshot) | median_price_at_capture |
|---|---|---|---|
| Sony WH-1000XM5 (Costco) | $162.97 | ~0% | $162.97 |
| Sony WH-1000XM5 (Macy's) | $248.00 | ~−52% | $162.97 |
| Anker Soundcore Q20i | $44.99 | ~+72% | $162.97 |
| Bose QuietComfort 45 | $46.00 | ~+72% | $162.97 |
| Sony WH-1000XM6 | $399.99 | ~−145% | $162.97 |

Snapshot-wide pathological `deal_pct` values used in the motivation section: range −3785% to +91.7% (accessories/mislisted outliers); quoted from the snapshot, not invented.

No live API calls in this part.

---

## 5. Worked example

**Step 1 — naive median signal alone.**
Load the snapshot, filter to `query == "noise cancelling headphones"`, compute `deal_pct` from the snapshot field. Both the Anker Q20i and the Bose QC45 score ~72% below median — indistinguishable. The learner runs `score_by_median(snapshot, "noise cancelling headphones")` and sees the tie.

**Step 2 — why the naive signal lies.**
Show the full-corpus `deal_pct` histogram. The learner runs `describe_deal_pct(snapshot)` and observes min ≈ −3785%, max ≈ +91.7%. A "$10.75 Kindle Paperwhite accessory" scores 91.7% — the top "deal" in the corpus. This is the motivation.

**Step 3 — fit the price model.**
Train an XGBoost regressor on the snapshot (80/20 temporal split on `date` field, preserving time order): features = `category` (one-hot), `brand_tier` (ordinal from title-extracted manufacturer), `condition` (new/refurb/used parsed from title), `title_embedding` (384-dim, BAAI/bge-small-en-v1.5, already in repo). Target = `price`. Report held-out MAE and R². The tutorial quotes values from the actual fit; a test pins them within tolerance.

**Step 4 — model residual as guard signal.**
For the Bose QC45 at $46: the model, seeing "flagship ANC headphone, new, Bose, audio category", predicts ~$290–$320. Residual = $290 − $46 = ~$244 (large positive = suspiciously cheap). For the Anker Q20i at $44.99: the model, seeing "budget ANC, Anker, audio, new", predicts ~$45–$55. Residual is small — the price is plausible.

**Step 5 — two-signal blend.**
`deal_score = 0.6 * normalized_median_signal + 0.4 * (1 - normalized_residual_suspicion)`. Outputs for hero cast (higher = better deal):
- Anker Q20i: high score (true positive — both signals agree it's genuinely cheap)
- Bose QC45: low score (model residual flags it; median alone would have ranked it equal to Anker)
- Sony XM5 @ $162.97: mid score (fair price, not a deal)
- Sony XM5 @ $248: low score (overpriced vs median)
- Sony XM6 @ $399.99: lowest (far above median, no discount)

The learner sees the ranking flip between naive-median-only and blended score for the Bose QC45 — that flip is the payoff.

---

## 6. Companion code

**Existing modules touched:**
- `companions/dealfinder/dealfinder/scoring.py` — add `median_deal_signal()`, `model_residual_signal()`, `blend_deal_score()`
- `companions/dealfinder/dealfinder/features.py` — add `build_feature_matrix()` (category one-hot, brand_tier ordinal, condition ordinal, embedding concat)
- `companions/dealfinder/dealfinder/model.py` — NEW: `PriceModel` (XGBoost wrapper, fit/predict/save/load)
- `companions/dealfinder/tests/test_scoring.py` — NEW: snapshot-pinned assertions

**Step tags (tutorial-dealfinder repo):**
- This is a NEW part in the electronics regen. Introduce step tag `step-03` on branch `draft/electronics-regen`.
- Code delta: `features.py` additions + entire `model.py` + `scoring.py` two-signal functions + tests. No changes to `aggregate.py` or connectors.

The model artifact (`model.xgb`) is committed to the companion repo under `companions/dealfinder/models/` so the tutorial can be followed offline.

---

## 7. Animations

**Animation 1 — REUSE `RegressionFit`**, re-themed to electronics pricing.
Replace the original domain's data points with snapshot items plotted as price vs. predicted price. Mark the Bose QC45 as a red outlier far below the diagonal (suspiciously cheap); mark Anker Q20i near the diagonal (plausible). Label axes "Predicted Fair Price ($)" and "Actual Price ($)". The residual arrow from the diagonal to the Bose point is the visual concept: large downward residual = flag.

**Animation 2 — REUSE `DealResidual`**, re-themed.
Show a horizontal bar chart of the five hero-cast items, sorted by blended deal score. Each bar is split: left segment = median signal contribution, right segment = model residual guard contribution. The Bose QC45 bar is cut short by a large red "guard" segment — the model residual dragging its score down. This makes the blend mechanism visible, not just the output.

---

## 8. Teaching beats

1. **Hook** — show the top-10 "deals" from naive `deal_pct` across the full corpus. An accessory is #1. A refurb flagship is #2. The learner sees the problem before touching any model.
2. **Concept: median signal** — why per-query medians are noisy across a broad corpus (accessories vs. flagships in the same query bucket). Animate with RegressionFit teaser.
3. **Code: features** — `build_feature_matrix()`: walk through each feature column, show that `brand` field is useless (retailer pollution from Part 1), so `brand_tier` is derived from title.
4. **Code: fit model** — `PriceModel.fit(X_train, y_train)` with the temporal split. Print MAE and R² on held-out set. These are the pinned metrics.
5. **Concept: residual guard** — residual = predicted − actual. Large positive = price is suspiciously far below what the model expects. Show DealResidual animation.
6. **Code: blend** — `blend_deal_score()`. Show the ranking for hero cast before and after. The Bose QC45 flip is the proof moment.
7. **Proof** — run `pytest tests/test_scoring.py -v`. All pins green. Learner sees the assertions that lock in the ordering.
8. **Callout** — link to `step-03` diff in `tutorial-dealfinder`; forward to Part 4 (recommender uses the same embedding features built here).

---

## 9. Cross-references

**Back:** Part 2 (How LLMs actually work) introduced embeddings conceptually; Part 3 is the first time title embeddings are used in code — `BAAI/bge-small-en-v1.5` vectors computed in Part 1's normalization pass are loaded here directly. The `brand_tier` normalization from Part 1's `normalize_brand()` is a hard prerequisite.

**Forward:** Part 4 (Recommender — content + collaborative) reuses `build_feature_matrix()` from this part as the content-similarity backbone. The two-signal `blend_deal_score()` is also the score that the recommender ranks candidate items by in Part 4.

---

## 10. Reproducibility checks

All assertions live in `companions/dealfinder/tests/test_scoring.py` and run against the frozen snapshot:

```python
# Median signal — hero cast ordering (snapshot median $162.97)
assert median_signal(xm5_costco) == pytest.approx(0.0, abs=0.01)   # at median
assert median_signal(anker_q20i) == pytest.approx(0.724, abs=0.01)  # 72.4% under
assert median_signal(bose_qc45)  == pytest.approx(0.718, abs=0.01)  # ~72% under

# Model MAE on held-out split (pinned within 10% tolerance)
assert model.held_out_mae < 85.0   # dollars; real value committed to repo

# Blended score ordering — the key invariant
scores = blend_deal_score([xm5_costco, xm5_macys, anker_q20i, bose_qc45, xm6])
assert scores["anker_q20i"] > scores["bose_qc45"]   # guard works
assert scores["anker_q20i"] > scores["xm5_costco"]  # genuine deal > fair price
assert scores["xm5_macys"]  < scores["xm5_costco"]  # overpriced loses
```

The model artifact is version-pinned by committing `model.xgb` + a SHA in `companions/dealfinder/models/README.md`.

---

## 11. Risks / notes

- **XGBoost non-determinism:** set `random_state=42` and fix `n_estimators=200` in `PriceModel`. The held-out MAE pin uses `abs=5.0` tolerance so minor platform variation doesn't break CI.
- **Embedding size:** 270 items × 384 dims is ~830KB in memory — no GPU needed. `fastembed` runs CPU-only; embeddings are precomputed and cached in `companions/dealfinder/data/embeddings/` to keep test runtime under 10s.
- **Temporal split edge case:** the snapshot has a single capture date; simulate temporal split by using the last 20% of items by `id` sort order (documented in code comment). Real temporal leakage is a curriculum topic deferred to Part 15.
- **Bose QC45 ground truth:** the tutorial states it *appears* to be refurb/mislisted based on the price anomaly — it does not assert this as fact. The model flags it as suspicious; the human still decides. This is intentional framing for the safety arc (Part 21).
- **No external API calls** in this part — fully offline against the snapshot. Zero cost, zero rate-limit risk.
