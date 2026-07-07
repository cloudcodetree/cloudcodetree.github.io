# Part 05 — Semantic Search (Embeddings, BM25, RRF, Rerank)

**Slug:** `dealfinder-search`
**Phase:** P1 — Real data & the aggregator
**Data mode:** SNAP

---

## 1. Objective

Build a hybrid search pipeline over the electronics snapshot that fuses dense
embedding retrieval (fastembed) with BM25 keyword matching via Reciprocal Rank
Fusion, then applies a cross-encoder rerank — and demonstrate why each layer is
necessary on real, noisy product titles.

---

## 2. Prerequisites

- Part 1: Data layer, normalization & the snapshot (snapshot on disk, id/title/embedding fields understood)
- Part 3: "Is it a good deal?" — median vs. model (deal_pct semantics, hero cast introduced)
- Part 4: Recommender — content + collaborative (fastembed BAAI/bge-small-en-v1.5 already wired; embedding matrix in place)

---

## 3. By the end, the learner can…

- Explain why keyword search alone fails on product titles ("WH-1000XM5" has no
  common vocabulary with "noise cancelling headphones").
- Build a BM25 index over 270 titles (rank\_bm25) and query it programmatically.
- Generate and cache BAAI/bge-small-en-v1.5 embeddings for all snapshot items.
- Fuse BM25 and dense ranked lists with Reciprocal Rank Fusion (k=60) and explain
  the k hyperparameter trade-off.
- Apply a cross-encoder rerank pass (ms-marco-MiniLM-L-6-v2 or fastembed rerank)
  to produce a final top-k that outperforms either signal alone.

---

## 4. Data

Source: `companions/dealfinder/data/snapshots/electronics-2026-07.json` (270 items, frozen).

Fields used: `id`, `title`, `category`, `price`, `deal_pct`, `median_price_at_capture`.

Working query: **"noise cancelling headphones"** (18 items in snapshot under this
query; snapshot median **$162.97**).

BM25 is built over all 270 titles (cross-category retrieval is intentionally included
to show the failure mode of keyword-only search on model numbers). Dense retrieval
uses the 384-dim embeddings already generated in Part 4 (reuse cached
`companions/dealfinder/data/embeddings.npy` + `companions/dealfinder/data/ids.json`).

No live API calls; no GPU required (fastembed CPU inference, ~2s for 270 items on
first run, cached thereafter).

---

## 5. Worked Example

**Query:** "noise cancelling headphones"

**BM25 top-3** (term overlap wins, but model numbers rank poorly):
1. Sony WH-1000XM5 @ $162.97 (Costco) — title contains "noise cancelling headphones" verbatim
2. Sony WH-1000XM6 @ $399.99 — partial match
3. Anker Soundcore Q20i @ $44.99 — "noise" + partial match

**Dense top-3** (semantic similarity, cosine):
1. Bose QuietComfort 45 @ $46 — embedding captures "quiet" ≈ "noise cancelling"; floats
   to rank 1 on semantics alone despite being the false-positive trap
2. Sony WH-1000XM5 @ $162.97 (Costco)
3. Anker Soundcore Q20i @ $44.99

**RRF (k=60) fused top-3:**
1. Sony WH-1000XM5 @ $162.97 (Costco) — consistent rank across both lists
2. Anker Soundcore Q20i @ $44.99
3. Bose QuietComfort 45 @ $46

**After cross-encoder rerank:** The reranker scores each (query, title) pair jointly.
The Bose QC45 entry at $46 is flagged with a lower rerank score than at its normal
market price context because the title does not assert a sale condition — the price
anomaly is visible to downstream deal scoring (Part 3's model residual), not the
ranker. Final top-5 order: XM5 (Costco) → XM5 (Macy's, $248, dedup candidate from
Part 1) → Anker Q20i → Bose QC45 → XM6.

The tutorial shows the learner that dedup (Part 1) and the price guard (Part 3) are
the right layers to catch the Bose false positive — search's job is relevance, not
deal validation.

---

## 6. Companion Code

**Existing modules used:**
- `companions/dealfinder/search.py` — NEW file introduced in this part
- `companions/dealfinder/embeddings.py` — REUSED from Part 4 (load cached embeddings)
- `companions/dealfinder/data/snapshots/electronics-2026-07.json` — REUSED
- `companions/dealfinder/data/embeddings.npy` + `ids.json` — REUSED from Part 4

**New file: `search.py`** introduces:
- `BM25Index` class wrapping `rank_bm25.BM25Okapi` over tokenized titles
- `dense_search(query, embeddings, ids, top_k)` — cosine similarity via numpy dot
- `reciprocal_rank_fusion(ranked_lists, k=60)` — pure Python, no deps
- `rerank(query, candidates)` — wraps fastembed `TextEmbedding` reranker or
  `cross_encoder` (configurable; defaults to fastembed to avoid a new pip dep)
- `hybrid_search(query, top_k=10)` — composes all four

**Step tags:** `step-05` in `tutorial-dealfinder` repo. Delta from `step-04`:
add `search.py`, add `tests/test_search.py`, update `requirements.txt` with
`rank-bm25>=0.2.2`.

---

## 7. Animations

**Animation 1 — REUSE `HybridFusion`**, re-themed to electronics.
Replace the existing tent/outdoor example data with the three headphone results
(BM25 lane, dense lane, RRF merge lane). The component already visualizes two
ranked streams converging into one fused list — exactly the concept. Relabel
stream A as "BM25 (keyword)" and stream B as "Dense (embedding)".

**Animation 2 — NEW: `RankingLens`**
Visual metaphor: a query token "noise cancelling headphones" illuminates a field
of product cards. Cards glow in proportion to their BM25 score (keyword overlap,
shown as highlighted matching terms in yellow) versus their semantic score (a
radial gradient halo). The learner sees the Bose QC45 card glow bright on the
semantic halo but dim on keyword overlap — and vice versa for the XM5.
Framer Motion: staggered entry of cards, `animate={{ opacity, scale }}` driven by
static BM25/dense score props. No runtime fetch; scores are hardcoded from the
snapshot run. Distinct shape: the dual-light metaphor (spotlight + halo) is
unique — no other component uses it.

---

## 8. Teaching Beats

1. **Concept — why keyword fails on electronics:** Run BM25 on "noise cancelling
   headphones"; show model numbers with no term overlap score 0.
2. **Code — BM25Index:** Build the index over all 270 titles; query it; inspect
   `scores` array. 3 lines.
3. **Concept — dense retrieval:** Cosine similarity over the Part 4 embedding
   matrix. Introduce the Bose QC45 false positive rising to rank 1 on semantics.
4. **Code — dense\_search:** Numpy dot + argsort. 5 lines.
5. **Concept — RRF:** Why simply averaging scores fails (different score scales);
   rank positions are stable. Show k=60 dampens outlier rank boosts.
6. **Code — reciprocal\_rank\_fusion:** The 10-line pure-Python implementation.
7. **Proof — RRF beats either alone:** Tabulate precision@5 on the hero cast
   (BM25: 3/5, dense: 3/5, RRF: 4/5). Values from `tests/test_search.py`.
8. **Concept — rerank:** Cross-encoders see (query, doc) jointly; they're slower
   but more accurate for top-k reordering. Budget: rerank only the top-20 RRF
   candidates.
9. **Code — rerank wrapper:** 15 lines around fastembed reranker.
10. **Proof — final ranked list:** Show the XM5 (Costco) at $162.97 at rank 1;
    Anker Q20i at rank 2. Note that the Bose QC45 at $46 remains in top-5 —
    its removal is a *deal scoring* job (Part 3), not search's responsibility.

---

## 9. Cross-References

**Back (Part 4 — Recommender):** Part 4 built the fastembed embedding matrix over
real title data; Part 5 reuses those embeddings directly — loading
`embeddings.npy` in one call — so you get hybrid search for free on top of the
recommender's pre-computed representations.

**Forward (Part 6 — Structured extraction):** The search results in Part 5 expose
a new problem: "Bose QuietComfort 45" and "BOSE QC45 Wireless" are the same
product but rank as separate results. Part 6 teaches structured extraction to pull
canonical brand, model, and condition from messy titles so dedup and ranking can
operate on normalized entities rather than raw strings.

---

## 10. Reproducibility Checks

All asserts run against the frozen snapshot in `tests/test_search.py` (step-05):

```python
# BM25 rank of XM5 (Costco) for "noise cancelling headphones" in top-3
assert bm25_results[0]["id"] == "xm5-costco-162"  # exact id from snapshot

# Dense rank of Bose QC45 is rank 1 or 2 (semantic similarity)
dense_ids = [r["id"] for r in dense_results[:3]]
assert "bose-qc45-46" in dense_ids

# RRF precision@5: at least 4 of the 5 hero cast items in top-5
rrf_ids = {r["id"] for r in rrf_results[:5]}
hero_ids = {"xm5-costco-162", "anker-q20i-44", "bose-qc45-46", "xm6-399", "xm5-macys-248"}
assert len(rrf_ids & hero_ids) >= 4

# Reranked top-1 is XM5 Costco
assert reranked_results[0]["id"] == "xm5-costco-162"
```

Snapshot item ids in the asserts must match the actual `id` field values in
`electronics-2026-07.json` — the authoring agent must verify these before writing
the tutorial prose.

---

## 11. Risks / Notes

- **fastembed model download (first run):** BAAI/bge-small-en-v1.5 (~130MB) is
  cached by fastembed in `~/.cache/fastembed`. Part 4 already downloads it; Part 5
  reuses the cache. Tutorial must note: first run after a clean clone takes ~30s.
  The `--no-images` pattern from ingest is not applicable here; just warn learners.
- **Non-determinism in reranker scores:** fastembed reranker is deterministic for
  the same model version. Pin `fastembed>=0.3.0` in requirements.txt and note the
  version in the test. If a learner sees a different top-k order, it's a version
  mismatch.
- **BM25 tokenization of model numbers:** "WH-1000XM5" tokenizes to ["wh",
  "1000xm5"] with simple whitespace split. The tutorial acknowledges this and
  shows a character-level n-gram tokenizer as a one-paragraph aside — not a full
  detour.
- **No GPU needed:** All compute (fastembed CPU, BM25, numpy) runs on a MacBook or
  a free Colab CPU tier. Rerank over 20 candidates takes <1s.
- **Cross-encoder alternative:** If fastembed's reranker model is unavailable, fall
  back to a second cosine similarity pass with a larger embedding model. The code
  uses a `RERANKER` env var to switch; tests mock it to avoid download in CI.
