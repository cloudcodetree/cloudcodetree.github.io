# Part 15 — Dataset Engineering (Sampling, Labeling, Leakage, Temporal Splits)

**Phase:** P3 Data engineering at scale
**Data mode:** SNAP
**Slug:** `dealfinder-dataset-engineering`

---

## 1. Objective

Build a labeled "good-deal" dataset from the electronics snapshot with correct temporal splits, leakage-free features, and a programmatic labeling function — the foundation every ML part in Phase 4 trains on.

---

## 2. Prerequisites

- Part 1: Data layer, normalization & the snapshot (snapshot format, `brand` → retailer bug, category taxonomy)
- Part 3: "Is it a good deal?" — median vs. model (naive deal_pct signal, two-signal deal score concept, why median alone fails)
- Part 6: Structured extraction — messy titles → schema (condition parsing, title-extracted brand tier)

---

## 3. By the end, the learner can…

- Write a deterministic labeling function that converts `deal_pct` + model residual into a binary good-deal label, with explicit rules for the Bose QC45 false-positive class.
- Apply stratified sampling across 11 categories to avoid the accessories/components imbalance swamping the training set.
- Identify and seal the three leakage vectors specific to price data (price-at-capture in features, query-level median as a feature, future-knowledge median).
- Produce a train/val/test split that respects query-group boundaries (no same-query items split across folds).
- Articulate why `median_price_at_capture` is a label-leaking feature and how to replace it with a holdout-safe proxy.

---

## 4. Data

**Source:** frozen snapshot `companions/dealfinder/data/snapshots/electronics-2026-07.json` (270 items, 18 queries, 11 categories).

**Specific items and stats used:**

| Field | Value |
|---|---|
| Total items | 270 |
| Queries | 18 (including anchor "noise cancelling headphones") |
| Categories | 11; `accessories` = 34 items (largest); `smart-home` = 9 (smallest) |
| `deal_pct` range | −3785% … +91.7% |
| Anchor query median | $162.97 |
| Items with `deal_pct` > 60% (candidates for labeling) | ~22 |
| Items with `deal_pct` < −100% (outlier/mislisted) | ~8 |

**Labeling function inputs (all from snapshot, no external fetch):** `price`, `deal_pct`, `median_price_at_capture`, `category`, condition parsed from title (Part 6), brand tier derived from title (Part 6).

**No live endpoints used in this part.** All numbers come from the committed snapshot file.

---

## 5. Worked example

**Anchor query: "noise cancelling headphones" (snapshot median $162.97)**

The tutorial walks through applying the labeling function to four hero-cast items:

| Item | Price | deal_pct | Label | Rule that fires |
|---|---|---|---|---|
| Sony WH-1000XM5 (Costco) | $162.97 | 0% | `neutral` | Within ±15% of query median → `neutral` band |
| Anker Soundcore Q20i | $44.99 | −72.4% | `good_deal=1` | >50% under median, condition=new, residual < −$30 → true positive |
| Bose QuietComfort 45 | $46.00 | −71.8% | `suspicious=1` (excluded from positive class) | >50% under median BUT brand-tier=premium AND condition token absent → flag as false-positive trap; excluded from `good_deal=1` |
| Sony WH-1000XM6 | $399.99 | +145% | `good_deal=0` | Above median; clearly full price |

The tutorial shows exactly why the naive `deal_pct > 50%` label assigns Bose QC45 and Anker Q20i the same label, then demonstrates the corrected labeling function that separates them.

**Label distribution after labeling (reproducible from snapshot):**

- `good_deal=1`: ~18 items (~6.7%)
- `suspicious`: ~9 items (excluded from train/test)
- `good_deal=0`: ~243 items
- Class imbalance ratio: ~13.5:1 → motivates next-part discussion of class weights.

---

## 6. Companion code

**NEW part** — no existing step tag covers dataset engineering at this fidelity.

**Step tag introduced:** `step-15-dataset-engineering` in `tutorial-dealfinder`.

**Existing modules touched:**
- `dealfinder/data/snapshot_loader.py` — add `load_with_labels()` that runs the labeling function and returns a `pd.DataFrame` with `good_deal`, `suspicious`, `split` columns.
- `dealfinder/features/label.py` — **new file**: `make_label(row, residual) -> str` deterministic labeling function; `SUSPICIOUS_THRESHOLD`, `DEAL_THRESHOLD` constants; `flag_suspicious(row)` brand-tier + condition guard.
- `dealfinder/features/splits.py` — **new file**: `make_query_group_split(df, seed=42) -> pd.DataFrame` that assigns train/val/test by query group (never splitting items from the same query across folds); uses `sklearn.model_selection.GroupShuffleSplit`.
- `dealfinder/features/leakage.py` — **new file**: `drop_leaking_columns(df) -> pd.DataFrame`; documents the three banned columns with inline comments explaining each.
- `tests/test_labels.py` — **new**: pins label counts and split sizes against snapshot.

**Code delta:** ~180 lines across four files; no model training in this part (that is Part 17).

---

## 7. Animations

**Animation 1 — REUSE: `EvalGauntlet` re-themed as a "Label Filter Stack"**
Re-theme the existing `EvalGauntlet` component (which already shows items passing through a sequence of gates) with electronics data. Gates: (1) deal_pct threshold, (2) condition guard, (3) brand-tier guard, (4) residual magnitude. Each gate shows the Bose QC45 caught vs. Anker Q20i passing. Makes the labeling function's sequential logic visible as a literal filter stack.

**Animation 2 — NEW: "Query-Group Leak Fence"**
Visual metaphor: a snapshot grid of 270 dots arranged in 18 vertical columns (one per query). A "split line" tries to cut horizontally (random split) — dots from the same column land on both sides, highlighted in red as "leaked." Then the correct cut: whole columns assigned to train/val/test, no column crosses the line, all dots in a column stay together. Framer Motion animates the dots migrating to their correct side. One distinct shape: rounded squares (representing query groups) that cannot be split.

---

## 8. Teaching beats

1. **Concept — why labeling is hard on price data:** show that `deal_pct` alone is a noisy oracle; the Bose QC45 trap proves it. Introduce the two-gate labeling function from Part 3's deal-score definition.
2. **Code — `label.py`:** write `make_label()` live; run it on the four hero-cast items; see the corrected label table.
3. **Concept — leakage taxonomy:** three vectors: (a) `median_price_at_capture` encodes the label, (b) query-level median as a feature uses future items, (c) price-at-capture is the target proxy. Show how each lets a model "cheat."
4. **Code — `leakage.py`:** drop the banned columns; confirm downstream features no longer contain them.
5. **Concept — stratified vs. group-aware splits:** show the accessories imbalance (34 items); show that random split leaks same-query signal.
6. **Code — `splits.py`:** `GroupShuffleSplit` on `query`; verify no query appears in both train and val.
7. **Animation — Label Filter Stack** (beat 2) → makes gate logic concrete.
8. **Animation — Query-Group Leak Fence** (beat 5) → makes the split error and fix visible.
9. **Proof — `test_labels.py`:** `assert label_counts['good_deal'] == 18`, `assert split_sizes['train'] == 189` (70% of 270), no query in both train and val.

---

## 9. Cross-references

**Back:** Part 14 (The web app — search UI, live/semantic toggle, SSE) delivered a working user-facing search surface; now that the product works end-to-end, Part 15 steps back to ask: what labeled data do we actually have, and is it fit for training the price model that guards against false positives?

**Forward:** Part 16 (Pipelines & orchestration — Prefect, batch/stream, dbt, contracts) will automate the labeling + split pipeline so it reruns whenever the snapshot is refreshed; Part 15's `label.py` and `splits.py` are the unit of work Prefect wraps.

---

## 10. Reproducibility checks

All asserts run against the committed snapshot with `seed=42`:

```python
# tests/test_labels.py
def test_label_counts():
    df = load_with_labels()
    assert df[df.good_deal == 1].shape[0] == 18
    assert df[df.suspicious == 1].shape[0] == 9

def test_hero_cast_labels():
    df = load_with_labels()
    anker = df[df.title.str.contains("Soundcore Q20i")].iloc[0]
    assert anker.good_deal == 1
    bose = df[df.title.str.contains("QuietComfort 45")].iloc[0]
    assert bose.suspicious == 1
    assert bose.good_deal == 0

def test_no_query_leakage():
    df = load_with_labels()
    train_queries = set(df[df.split == "train"].query)
    val_queries   = set(df[df.split == "val"].query)
    assert train_queries.isdisjoint(val_queries)

def test_no_leaking_columns():
    df = drop_leaking_columns(load_with_labels())
    for col in ["median_price_at_capture", "deal_pct"]:
        assert col not in df.columns
```

The Bose QC45 `suspicious` label depends on `flag_suspicious()` correctly parsing the title for a condition token; if Part 6's condition extractor changes, this test will catch the drift.

---

## 11. Risks / notes

- **Label subjectivity:** `good_deal=1` for 18 items (6.7%) reflects the actual snapshot distribution; do not inflate the count. If the learner re-runs ingest and picks up new items, counts will drift — the spec tells them to pin against the committed snapshot SHA.
- **`suspicious` exclusion:** the 9 flagged items are excluded from both positive and negative classes in train/val/test to avoid teaching the model on ambiguous signal. They are retained in the DataFrame with `split=None` for qualitative inspection.
- **No GPU, no cost:** entirely CPU, pandas + sklearn. Runs in under 2 seconds on the 270-row snapshot.
- **Non-determinism:** `GroupShuffleSplit` with `seed=42` is deterministic; document the seed explicitly in `splits.py` as a module constant so downstream parts that import the split don't accidentally re-shuffle.
- **Bose QC45 condition-token fragility:** the title "Bose QuietComfort 45" contains no explicit condition token. The `flag_suspicious()` guard relies on brand-tier=premium AND no condition token, which is a heuristic. A note in the tutorial acknowledges this is intentionally simple — Part 19 (Evaluation as a discipline) will revisit with LLM-judge labeling on the ambiguous set.
