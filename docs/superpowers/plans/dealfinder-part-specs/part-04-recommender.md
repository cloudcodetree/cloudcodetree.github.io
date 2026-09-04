# Part 04 — Recommender (content + collaborative)

**Phase:** P1 | **Data mode:** SNAP | **Slug:** `dealfinder-recommender`

---

## 1. Objective

Build a two-mode electronics recommender — content-based (cosine similarity over
fastembed title embeddings) and item–item collaborative filtering over a small
real interaction log — and understand where each mode wins and fails on
heterogeneous consumer-electronics data.

---

## 2. Prerequisites

- Part 1: Data layer, normalization & the snapshot
- Part 3: "Is it a good deal?" — median vs. model

---

## 3. By the end, the learner can…

- Embed product titles with `BAAI/bge-small-en-v1.5` (384-dim) and retrieve the
  top-k most similar items by cosine distance.
- Explain why content similarity alone promotes irrelevant items (a Sony XM5 is
  more similar to other headphones than to an equally-priced competing deal).
- Build an item–item co-occurrence matrix from a small interaction log and blend
  its signal with the content score via a tunable α-weight.
- Diagnose and filter out the "same-product echo" — dedup-merged items
  (e.g., XM5 at $162.97 and XM5 at $248) that inflate similarity without adding
  value.
- Serve a `GET /recommend/{item_id}?k=5` endpoint and verify results against the
  frozen snapshot.

---

## 4. Data

**Source:** `companions/dealfinder/data/snapshots/electronics-2026-07.json`
(270 items, 18 queries, 11 categories). Headphones subset = 15 items. Retailer-brand pollution = 156/270.

**Interaction log:** `companions/dealfinder/data/interactions-sample.json` — a
hand-authored 40-session synthetic-but-realistic log (NEW file introduced in this
part; sessions reference real `id` values from the snapshot). Each session is a
list of item ids viewed in sequence. Design constraints: ≥3 sessions containing
both the XM5 (`id` from snapshot) and the Q20i, to make co-occurrence non-zero
and demonstrable; ≥2 sessions where the Bose QC45 appears with the XM5 (produces
the "echo" false-positive the part guards against).

**Embeddings:** computed at part startup via fastembed
(`BAAI/bge-small-en-v1.5`) over `title` field of all 270 items; cached to
`companions/dealfinder/data/embeddings-2026-07.npy` (committed). No GPU required.

**Exact items used in the walkthrough:**
- Sony WH-1000XM5 @ $162.97 (Costco) — query item, median = $162.97, fair value $285.15 → FAIR
- Sony WH-1000XM5 @ $248 (Macy's) — same product, must be filtered by dedup guard
- Anker Soundcore Q20i @ $44.99 — appears in co-occurrence; content similarity ~0.71, fair $108.33, resid_frac 0.585 → DEAL
- Bose QuietComfort 45 @ $46.00 — high content similarity (~0.78) but co-occurrence low; fair $285.15, resid_frac 0.839 → SUSPICIOUS
- Sony WH-1000XM6 @ $399.99 — top content hit (same product family) → OVERPRICED; filtered by price-tier guard (price > 2× query item → deprioritised)

---

## 5. Worked example

**Query:** recommend items similar to Sony WH-1000XM5 @ $162.97 (Costco).

**Step 1 — Content retrieval (top-5 by cosine sim, no filters):**

| Rank | Title (truncated) | Price | Sim | Badge |
|------|-------------------|-------|-----|-------|
| 1 | Sony WH-1000XM5 (Macy's) | $248 | 0.98 | – |
| 2 | Sony WH-1000XM6 | $399.99 | 0.91 | OVERPRICED |
| 3 | Bose QuietComfort 45 | $46.00 | 0.78 | SUSPICIOUS |
| 4 | Anker Soundcore Q20i | $44.99 | 0.71 | DEAL |
| 5 | Sony WH-1000XM4 | $199.00 | 0.69 | – |

Rank 1 is a dedup duplicate. Rank 2 is out-of-budget. Rank 3 is the trap item
(refurb/mislisted). Raw content ranking is not safe to serve.

**Step 2 — Apply guards:**
- Drop items sharing the same `canonical_id` (dedup guard): removes XM5 Macy's.
- Soft-penalise items with `deal_pct` residual flagged as "too good to be true"
  (from Part 3's model): Bose QC45 drops to rank 5.

**Step 3 — Blend with co-occurrence (α=0.4):**

Blended score = (1−α)·content_sim + α·collab_sim (normalised 0–1).

The Q20i's co-occurrence signal (appeared in 6/40 sessions alongside XM5) pushes
it to rank 2. Final top-3 served: XM5 XM4 · Q20i · XM6 (price-penalised).

**Learner observes:** collaborative signal surfaces the honest budget deal (Q20i)
above the suspicious bargain (QC45). The blend is the point.

---

## 6. Companion code

**Existing modules (pre-part):**
- `dealfinder/aggregate.py` — deal_pct + median; used for the deal-residual guard
- `dealfinder/embeddings.py` — fastembed wrapper (introduced Part 5, but the
  embedding generation is pulled forward here as a read-only utility; Part 5 adds
  BM25+RRF on top)
- `dealfinder/dedup.py` — canonical_id merge (Part 1)

**New in this part:**
- `dealfinder/recommender.py` — `ContentRecommender`, `CollabRecommender`,
  `HybridRecommender(alpha)`, `GET /recommend/{item_id}` FastAPI route
- `companions/dealfinder/data/interactions-sample.json` — interaction log (40 sessions)
- `companions/dealfinder/data/embeddings-2026-07.npy` — precomputed embedding cache

**Step tags (tutorial-dealfinder repo):** `step-04a` (content-only endpoint) →
`step-04b` (collab matrix + hybrid blend). This part is NEW — no prior step tag.

**Code delta:** ~200 lines net (recommender module + tests + interaction log).

---

## 7. Animations

**Animation 1 — REUSE `HybridFusion`**, re-themed to electronics.
Replace the tent-era inputs with two electronics signals: a cosine-similarity bar
(content) and a co-occurrence bar (collaborative). The fusion node shows the
α-weighted blend → ranked output list. Data values match the worked example
(content_sim: 0.71 for Q20i, collab_sim: normalised from 6/40 ≈ 0.60).

**Animation 2 — NEW: `EchoFilter`**
Visual metaphor: a mirror (echo chamber) in which the same product card reflects
back three times at different prices (XM5 @ $163, $248, hypothetical $199).
The dedup guard slides a "break-the-mirror" pane across, collapsing the three
reflections into one canonical card. Framer Motion: cards fan out from a single
point, then collapse back when the guard activates. Concept made visible: why
identical-product duplicates must be removed before any similarity ranking, or
the top-k is dominated by the same item under different retailer listings. Static
SVG card shapes; no runtime fetch.

---

## 8. Teaching beats

1. **Concept — the recommendation problem:** given one product, find five others
   a user is likely to want. Two independent signals exist: what the product *is*
   (content) and what users do together (co-occurrence). Neither alone is enough.
2. **Code — embed titles:** run fastembed `BAAI/bge-small-en-v1.5` over the 270 snapshot titles; inspect
   the 384-dim vector for the XM5. Show cosine distance heatmap for the
   "noise cancelling headphones" anchor subset (15 items).
3. **Proof — content retrieval works, then fails:** `ContentRecommender.recommend(xm5_id, k=5)` →
   show the raw top-5 including the dedup duplicate and the Bose trap. Make the
   failure concrete.
4. **Code — dedup guard + deal-residual filter:** add `canonical_id` filter and
   the Part 3 residual flag. Re-run; XM5 Macy's and QC45 fall out.
5. **Concept — collaborative filtering at small scale:** co-occurrence matrix
   from 40 sessions. No matrix factorisation needed at 270 items; direct
   dot-product is fine. Explain when you'd upgrade to ALS/LightFM.
6. **Code — build `CollabRecommender`:** load `interactions-sample.json`, build
   item–item co-occurrence, normalise. `collab.recommend(xm5_id, k=5)`.
7. **Code — `HybridRecommender(alpha=0.4)`:** blend scores, show Q20i rise.
   Tune α with a one-liner grid search over a tiny held-out set from the interaction log.
8. **Proof — serve the endpoint:** `GET /recommend/{xm5_id}?k=5` returns JSON
   with the blended ranking. Assert Q20i is in top-3 (pinned test).
9. **EchoFilter animation** — show the dedup guard concept visually before
   moving to the forward reference.

---

## 9. Cross-references

**Back (Part 3 — "Is it a good deal?" — median vs. model):** Part 3 gave us the
two-signal deal score and flagged the Bose QC45 as a residual outlier; Part 4
imports that residual flag directly as a guard inside the recommender — so the
same false-positive the price model caught is automatically deprioritised in
recommendations.

**Forward (Part 5 — Semantic search: embeddings, BM25, RRF, rerank):** Part 4
generates and caches the fastembed embeddings that Part 5 reuses as its vector
index; Part 5 adds BM25 and reciprocal-rank fusion on top of the same 384-dim
vectors, turning the recommender's similarity layer into a full hybrid search
system.

---

## 10. Reproducibility checks

All asserts run against the committed snapshot + interaction log:

```python
# test_recommender.py
def test_content_top5_includes_qm5_macy_before_dedup():
    recs = ContentRecommender(embeddings, items).recommend(XM5_COSTCO_ID, k=5)
    ids = [r.id for r in recs]
    assert XM5_MACYS_ID in ids  # duplicate surfaces before guard

def test_dedup_guard_removes_same_canonical():
    recs = HybridRecommender(alpha=0.4, dedup=True).recommend(XM5_COSTCO_ID, k=5)
    ids = [r.id for r in recs]
    assert XM5_MACYS_ID not in ids

def test_q20i_in_top3_after_blend():
    recs = HybridRecommender(alpha=0.4, dedup=True).recommend(XM5_COSTCO_ID, k=5)
    ids = [r.id for r in recs]
    assert Q20I_ID in ids[:3]

def test_collab_matrix_xm5_q20i_nonzero():
    collab = CollabRecommender(interactions)
    assert collab.matrix[XM5_COSTCO_ID][Q20I_ID] >= 3  # ≥3 co-sessions
```

Content similarity values (0.71, 0.78, 0.91, 0.98) are verified at embedding
generation time and stored in `tests/fixtures/sim-spot-checks.json`; the test
asserts each within ±0.03 (fp32 determinism across platforms).

---

## 11. Risks / notes

- **Embedding determinism:** fastembed `BAAI/bge-small-en-v1.5` is deterministic
  given the same model weights; the `.npy` cache is committed so CI never re-runs
  inference. Tolerance ±0.03 on spot-check sims handles any fp32/fp64 mismatch.
- **Interaction log is hand-authored:** clearly documented in code comments and
  the MDX. It is not presented as real user data — the lesson is the *mechanics*
  of co-occurrence, not the validity of the log. A callout box in the MDX says
  "In production you'd replace this with real clickstream; Part 29 (Saved searches
  & suggestions worker) wires the live signal."
- **No GPU required:** fastembed runs on CPU; the 270-item embed takes ~2 s on an
  M-series Mac. The `.npy` cache means learners never wait.
- **Small-N collab:** 270 items × 40 sessions produces a sparse matrix. The part
  notes this and explains why the direct dot-product is fine here; it explicitly
  says where you'd switch to ALS (≥10k items) so learners know the boundary.
- **α tuning is illustrative:** the grid search is over a tiny held-out set (8
  sessions) to show the *concept* of hyperparameter search. Results are stable
  enough to pin (α=0.4 is the winner) but the part notes this would use proper
  cross-validation at production scale.
