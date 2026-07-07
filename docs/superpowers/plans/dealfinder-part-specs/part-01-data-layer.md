# Part 01 — Data layer, normalization & the snapshot

**Part:** 1 of 33 | **Phase:** P1 Real data & aggregator | **Data mode:** SNAP+LIVE  
**Slug:** `dealfinder-data-layer`

---

## 1. Objective

Build the two data entry-points — a live Google Shopping connector and a snapshot loader — then normalize the raw results into a clean, typed schema and freeze the 270-item `electronics-2026-07.json` snapshot the rest of the course runs on.

---

## 2. Prerequisites

None. This is the course entry point.

---

## 3. By the end, the learner can…

- Stand up the RapidAPI Google Shopping connector and issue a query that returns real listings.
- Load and validate `electronics-2026-07.json` against the canonical item schema.
- Explain why `brand` holds the retailer in 154/270 rows and use a title-parsing heuristic to extract the true manufacturer.
- Identify the dedup problem (Sony WH-1000XM5 at $162.97 vs $248) and collapse duplicates to the cheapest in-stock source.
- Freeze and version a snapshot via `data/build_snapshot.py` for reproducible downstream work.

---

## 4. Data

**Snapshot:** `companions/dealfinder/data/snapshots/electronics-2026-07.json` — 270 items, 18 queries, 11 categories. All prose numbers and assertions derive from this file; none are invented.

Key snapshot facts used in this part:
- 154/270 rows: `brand` field is a retailer string ("Walmart - COWIN", "Target", "mountainlifestyle.ca") not a manufacturer.
- Hero query "noise cancelling headphones": 12 items in snapshot, query-median **$162.97**.
- Dedup pair: Sony WH-1000XM5 appears at $162.97 (Costco) and $248.00 (Macy's) — identical normalized title after brand-strip + lowercasing.
- Worst-case `deal_pct`: −3785% (a mispriced outlier); best-case: +91.7% (accessory/mislisting). Both live in the snapshot raw.

**Live:** RapidAPI Google Shopping endpoint (`GET /search?q=<query>&country=us`). Used only in the "connector" section to prove the pipeline works end-to-end; the remainder of the part operates on the snapshot.

**Not used in this part:** eBay (sandbox-only, excluded); Apify (Part 8).

---

## 5. Worked example

**Scenario:** the learner runs the normalizer on the "noise cancelling headphones" slice of the snapshot.

1. **Raw input** — two rows arrive with `brand="Costco"` and `brand="Macy's"`, both titled "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones".
2. **Title extraction** — `extract_brand_from_title(title)` strips retailer tokens and returns `"Sony"`. The function is a 10-line regex + stopword list; no LLM.
3. **Normalization** — `normalize_title(title)` lowercases, removes common suffix noise ("wireless", "industry leading"), yields `"sony wh-1000xm5 noise canceling headphones"`. Same normalized key for both rows.
4. **Dedup** — `dedup_by_normalized_title(rows)` keeps the row with the lower price → Costco at **$162.97** survives; Macy's at **$248.00** is dropped (logged, not silently discarded).
5. **Output** — a single clean `Item` dataclass:  
   `{id, query, category:"audio", title:"Sony WH-1000XM5...", brand:"Sony", price:162.97, currency:"USD", source:"google_shopping", marketplace:"Costco", url:..., image_url:..., deal_pct:<computed>, median_price_at_capture:162.97}`

The worked example runs in under 1 second on the snapshot slice; no API call required.

---

## 6. Companion code

**Existing modules (companions/dealfinder/):**
- `connectors/google_shopping.py` — NEW. Wraps the RapidAPI endpoint; returns `List[RawItem]`.
- `data/normalize.py` — NEW. `extract_brand_from_title`, `normalize_title`, `dedup_by_normalized_title`, `to_item`.
- `data/snapshot.py` — NEW. `load_snapshot(path) -> List[Item]`; validates schema on load; raises on unknown fields.
- `data/build_snapshot.py` — NEW. Orchestrates live connector → normalize → write JSON. Run once to regenerate.

**Step tags in `tutorial-dealfinder` repo:**
- `step-01a` — connector skeleton (env var, HTTP client, rate-limit stub).
- `step-01b` — normalize + dedup (the retailer-brand bug fixed, dedup collapsed).
- `step-01c` — snapshot frozen; `load_snapshot` + schema validation test passing.

**Code delta this part introduces:** ~250 lines net across four new files; no pre-existing module touched.

---

## 7. Animations

**A. NEW — `RetailerBrandSplit`**  
Visual metaphor: a single "brand" field cell cracks open into two lanes — left lane labeled "Retailer" (shows "Walmart - COWIN", "Target", "Costco"), right lane labeled "Manufacturer" (shows "COWIN", generic, "Sony"). A sliding cursor highlights the token boundary the regex finds. Shape: a horizontal split-cell with a diagonal crack line animated via Framer Motion. Makes visible why the raw field is untrustworthy and what extraction does. Static-export-safe: all strings in DOM, no fetch.

**B. REUSE — `DedupMerge`** (re-themed to electronics)  
Replace the tent-era merge example with the Sony WH-1000XM5 pair: two cards labeled "Costco $162.97" and "Macy's $248.00" animate together; the higher-price card fades out with a "dropped" badge; the survivor card pulses green. Concept made visible: cheapest-wins dedup without silent data loss.

---

## 8. Teaching beats

1. **Why real data first** — show the `deal_pct` histogram (range −3785% to +91.7%) from the snapshot; explain this is the curriculum, not a bug to clean away.
2. **Connector** — write `google_shopping.py`; run one live query; inspect the raw JSON; spot the `brand` problem immediately.
3. **Brand extraction** — show 5 raw `brand` values from snapshot; build the 10-line `extract_brand_from_title` heuristic; verify against the hero cast (Sony, Anker, Bose all parse correctly).
4. **Normalization** — `normalize_title`; run the Sony dedup scenario step-by-step; show the log entry for the dropped $248 row.
5. **Snapshot freeze** — run `build_snapshot.py`; show the output file size (≈ 180 KB); load it with `load_snapshot`; confirm 270 items validate.
6. **What you proved** — the snapshot is the stable ground truth; every quoted number in the rest of the course traces back here.

---

## 9. Cross-references

**Back:** This is Part 1 — the course entry point. No prior part.

**Forward:** Part 2 (How LLMs actually work) uses electronics examples drawn from the snapshot categories established here; Part 3 (Is it a good deal? — median vs. model) opens by loading `electronics-2026-07.json` via `data/snapshot.py` and immediately hits the naive-median failure mode the `deal_pct` outliers in this part foreshadow.

---

## 10. Reproducibility checks

```python
# test_part01.py — must pass against electronics-2026-07.json
snapshot = load_snapshot("data/snapshots/electronics-2026-07.json")
assert len(snapshot) == 270
assert sum(1 for item in snapshot if item.brand_raw != item.brand_extracted) == 154

ncb = [i for i in snapshot if i.query == "noise cancelling headphones"]
prices = sorted(i.price for i in ncb)
assert abs(statistics.median(prices) - 162.97) < 0.01   # query-median

sony_after_dedup = [i for i in dedup_by_normalized_title(ncb)
                    if "wh-1000xm5" in i.title.lower()]
assert len(sony_after_dedup) == 1
assert sony_after_dedup[0].price == 162.97               # Costco wins

deal_pcts = [i.deal_pct for i in snapshot]
assert min(deal_pcts) < -3000   # the outlier is still there (not sanitized here)
assert max(deal_pcts) > 90
```

---

## 11. Risks / notes

- **RapidAPI key required** for the live connector section; the snapshot path requires no key. Learners without a key can skip straight to snapshot exercises — the part clearly labels the live section optional for reproducibility.
- **Rate limits:** the live connector uses a 1 req/s sleep; `build_snapshot.py` batches 18 queries and warns if quota is near. Snapshot regeneration is not expected in normal course flow.
- **Snapshot drift:** if a learner regenerates the snapshot, quoted numbers (item count, median) will differ. The part states this explicitly and pins the committed file with a SHA comment in `build_snapshot.py`.
- **Non-determinism:** `extract_brand_from_title` is deterministic (regex + fixed stopword list); no LLM, no randomness. The 154-row retailer-brand count is a fixed property of the committed snapshot, not a runtime computation.
- **eBay absent:** the snapshot excludes eBay (sandbox environment during capture). Part 7 (live connectors) adds eBay live; this part notes the gap without apology.
