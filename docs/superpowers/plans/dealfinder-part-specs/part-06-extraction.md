# Part 06 — Structured extraction (messy titles → schema)

**Phase:** P1 | **Data mode:** SNAP+LLM | **Slug:** `dealfinder-extraction`

---

## 1. Objective

The learner builds a dual-path extractor that turns noisy, retailer-polluted
electronics listing titles into validated `ListingSpecs`, using an LLM as the
primary path and a deterministic regex fallback so the pipeline never fails.

---

## 2. Prerequisites

- Part 1 — Data layer, normalization & the snapshot (snapshot loaded; `Product`
  schema known; `brand` field understood as retailer, not manufacturer)
- Part 3 — "Is it a good deal?" (two-signal deal score established; `brand_tier`
  concept introduced; why true brand matters for the model)
- Part 5 — Semantic search (embeddings pipeline in place; `fastembed` dependency
  already installed)

---

## 3. By the end, the learner can…

- Explain why the snapshot's `brand` field is retailer noise (156/270 rows) and
  why manufacturer extraction must come from the title.
- Write a Pydantic schema (`ListingSpecs`) and validate arbitrary LLM JSON output
  into it, catching and rejecting malformed fields before they enter the pipeline.
- Implement `rule_extract` (deterministic regex) as an offline-safe fallback and
  test it without any API key.
- Wire `llm_extract` to an OpenAI-compatible client with a graceful degradation
  chain: explicit client → OpenRouter → `rule_extract`.
- Verify that extraction improves `brand_tier` signal for a real hero-cast listing.

---

## 4. Data

**Source:** `companions/dealfinder/data/snapshots/electronics-2026-07.json`
(270 items, 18 queries, 11 categories).

**Specific items used:**

| Snapshot item | title (as stored) | brand field (as stored) |
|---|---|---|
| Sony WH-1000XM5 $162.97 | "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling..." | "Costco" |
| Sony WH-1000XM5 $248 | "Sony WH-1000XM5 Wireless Noise Canceling Headphones..." | "Macy's" |
| Anker Soundcore Q20i $44.99 | "Soundcore by Anker Q20i Hybrid Active Noise Cancelling..." | varies by retailer |
| Bose QuietComfort 45 $46 | "Bose QuietComfort 45 Bluetooth Wireless Headphones..." | seller name |

**Query used for all examples:** `"noise cancelling headphones"` (snapshot median
`$162.97`; 15 items for this query in the snapshot).

**Retailer-pollution audit (reproducible):** run
`python -c "import json; d=json.load(open('data/snapshots/electronics-2026-07.json')); retailers=['Walmart','Target','Costco','Macy','Best Buy','Amazon']; print(sum(1 for x in d if any(r in (x.get('brand') or '') for r in retailers)), 'of', len(d))"` — expected output in the range of 156/270.

---

## 5. Worked example

**Input title (Sony XM5 at Costco):**
```
"Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Overhead Headphones"
```
**`brand` field in snapshot:** `"Costco"` (retailer pollution)

**Step 1 — `rule_extract`:**
Regex scans for known electronics manufacturers. Matches `"Sony"` in title →
`ListingSpecs(brand="Sony", ...)`. No LLM call needed; works offline.

**Step 2 — `llm_extract` prompt (shown to learner verbatim):**
```
Extract electronics specs from the listing as JSON with keys:
brand (string|null), model (string|null), condition (new|refurb|used|null).
Use null if absent. Return ONLY the JSON.

Listing: Sony WH-1000XM5 Wireless Industry Leading Noise Canceling...
```
**LLM response (realistic):**
```json
{"brand": "Sony", "model": "WH-1000XM5", "condition": "new"}
```
**Pydantic validation:** parses cleanly into `ListingSpecs`. Brand is now `"Sony"`,
not `"Costco"`.

**False-positive hook:** same flow on Bose QC 45 at $46 → extraction yields
`brand="Bose"`, `condition="new"` (no "refurb" in title; defaults to new) — the extractor correctly
returns what the title says; the *deal-score guard* (Part 3's model residual) is
what flags the price as implausible. The tutorial makes this division of
responsibility explicit: extraction's job is truth-from-text, not deal validation.

---

## 6. Companion code

**Module:** `companions/dealfinder/dealfinder/extract.py`
(exists; written for the tent domain — this part **rewrites it for electronics**).

**Also touched:** `companions/dealfinder/dealfinder/features.py`
(`BRAND_TIER` dict updated from tent brands to electronics manufacturers: Sony,
Bose, Apple, Samsung, Anker, Jabra, Sennheiser, etc., mapped to tiers 1–3).

**Step tags:** this part maps to a **NEW** step tag `step-06` in
`tutorial-dealfinder`. The delta introduced:

1. `ListingSpecs` gains electronics fields: `brand`, `model`, `condition`
   (replaces tent-specific `capacity`, `weight_kg`, `season`).
2. `rule_extract` regex patterns updated for electronics manufacturer names and
   condition keywords (`"Renewed"`, `"Refurbished"`, `"Open Box"`).
3. `build_prompt` updated with electronics-specific schema description.
4. `BRAND_TIER` in `features.py` maps real electronics manufacturers → tier.
5. A new `run_extract.py` CLI entrypoint (already stubbed; filled in this part).

**Tests:** `tests/test_extract.py` — all offline, no API key. Asserts
`rule_extract` on the four hero-cast titles; asserts `parse_llm_json` rejects
a bad field type (e.g. `condition: 42`).

---

## 7. Animations

**Animation 1 — REUSE `ExtractFlow`**, re-themed to electronics.
Replace the tent-spec example nodes with:
- Input node: raw title string `"Sony WH-1000XM5 Wireless Industry Leading..."`
- Intermediate node: LLM call box (temperature=0, JSON-only prompt)
- Output node: `ListingSpecs` card showing `brand: "Sony"`, `model: "WH-1000XM5"`, `condition: "new"`
- Fallback branch (dashed): `rule_extract` → same output shape
Visual metaphor: funnel with two input tubes (LLM / regex) converging to one
validated output shape. Makes the dual-path + single-schema contract visible.

**Animation 2 — REUSE `SchemaGate`**, re-themed.
Show the Pydantic validation step: good JSON (green path, passes through gate) vs
malformed JSON — e.g. `{"brand": 42}` or `{"condition": "maybe"}` (red path,
gate blocks, error surfaced). One gate shape; two flow paths. Makes the
"schema as the contract" concept visible without prose.

---

## 8. Teaching beats

1. **Concept — the retailer-pollution problem:** show the snapshot stat (156/270
   `brand` rows hold a retailer name). Explain why `brand_tier` computed from the
   raw field is wrong and how that corrupts the deal model (Part 3 callback).

2. **Code — define `ListingSpecs`:** write the Pydantic model with electronics
   fields. Demonstrate `model_validate` raises on bad input. The schema is the
   contract.

3. **Code — `rule_extract`:** build the regex path for manufacturer names and
   condition keywords. Run it live on the Sony XM5 title. No API key, instant
   feedback, testable in CI.

4. **Concept — why regex alone fails:** show a title like `"Renewed Wireless
   Headphones Bluetooth 5.0 V4 - Noise Cancelling"` (real-pattern title from
   category) — no manufacturer, brand=null. The regex returns null correctly;
   the LLM can often do better.

5. **Code — `build_prompt` + `parse_llm_json`:** write the prompt (schema
   explicit, "ONLY JSON"), then write the JSON extractor with code-fence
   tolerance. Show `parse_llm_json` validate the LLM output into `ListingSpecs`.

6. **Code — `llm_extract` degradation chain:** wire client → OpenRouter →
   `rule_extract`. Run with `OPENROUTER_API_KEY` set; run again without — same
   output shape both times.

7. **Proof — hero cast roundup:** extract all four hero-cast headphone titles;
   print a table: title → brand_tier (raw field) → brand_tier (extracted). The
   column that uses extracted brand is more accurate for the deal model.

8. **Code — `BRAND_TIER` update in `features.py`:** replace the placeholder tent
   brands with the real electronics tier map. Confirm `featurize` now returns a
   non-trivial `brand_tier` for the Sony and Anker listings.

---

## 9. Cross-references

**Back:** Part 5 (Semantic search) established the embeddings pipeline and showed
that title text carries signal hand-features miss — this part complements that by
pulling *structured* signal out of the same title text.

**Forward:** Part 7 (Live multi-source connectors) ingests listings in real time;
`llm_extract` runs on every new listing as it arrives, so the clean `brand` and
`condition` fields are available to the deal model from first ingest.

---

## 10. Reproducibility checks

```python
# test_extract.py (offline, no API key)

from dealfinder.extract import rule_extract

def test_sony_xm5_brand():
    title = "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Overhead Headphones"
    specs = rule_extract(title)
    assert specs.brand == "Sony"

def test_anker_brand():
    title = "Soundcore by Anker Q20i Hybrid Active Noise Cancelling Headphones"
    specs = rule_extract(title)
    assert specs.brand == "Anker"

def test_condition_refurb():
    title = "Bose QuietComfort 45 Renewed Bluetooth Wireless Headphones"
    specs = rule_extract(title)
    assert specs.condition == "refurb"

def test_parse_rejects_bad_field():
    import pytest
    from dealfinder.extract import parse_llm_json
    with pytest.raises(Exception):
        parse_llm_json('{"brand": 42}')

def test_brand_tier_coverage():
    from dealfinder.features import BRAND_TIER
    for name in ["Sony", "Bose", "Anker", "Apple", "Samsung"]:
        assert name in BRAND_TIER, f"{name} missing from BRAND_TIER"
```

**Retailer-pollution count:** the snapshot audit script above must print a value
≥ 100 (conservative floor); the tutorial prose quotes "156 of 270" and must match
the snapshot.

---

## 11. Risks / notes

- **LLM non-determinism:** `llm_extract` runs at `temperature=0` to minimize
  variance, but output format can still drift across model versions. `parse_llm_json`
  defends against this; the tutorial notes that structured-output mode (if the
  provider supports it) is the production hardening step (covered in Part 10).

- **API cost:** the worked example calls the LLM once per listing shown. The
  tutorial gates all LLM calls behind an env-var check; learners without a key
  follow the same flow via `rule_extract` and see identical output shapes. Estimated
  cost for the four hero-cast calls: < $0.01 at `gpt-4o-mini` rates.

- **OpenRouter availability:** the degradation chain means a throttled or
  unavailable model is silent — the tutorial explicitly shows what to `except` and
  why swallowing the exception (falling back to regex) is intentional here vs.
  surfaces-the-error in production monitoring (Part 26).

- **`features.py` mutation:** updating `BRAND_TIER` in this part changes the
  feature matrix shape used in Part 3's tests. The companion repo step tag ensures
  Part 3 tests pin their expected values against the tent-era `BRAND_TIER`; Part 6's
  step tag re-runs those tests with the electronics map and updates the goldens.
