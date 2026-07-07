# Part 07 Spec — Live multi-source connectors (real APIs, OAuth, affiliate)

**Number:** 7 | **Slug:** `dealfinder-live-sources` | **Phase:** P1 | **Data mode:** LIVE
**Bible ref:** §7 map row 7; steps 30/36/38

---

## 1. Objective

Build production-grade, authenticated connectors to three real product-data sources — eBay Browse API (OAuth 2.0), RapidAPI Google Shopping (key-auth), and BestBuy Affiliate API (key-auth) — wire them behind a unified `Source` protocol, and verify that the same "noise cancelling headphones" query returns live listings from all three.

---

## 2. Prerequisites

- Part 1: Data layer, normalization & the snapshot (connector base, `Source` protocol, snapshot schema)
- Part 6: Structured extraction (title → clean fields; needed for normalizing heterogeneous source payloads)

---

## 3. By the end, the learner can…

- Obtain and store OAuth 2.0 client-credentials tokens for eBay Browse and refresh them automatically before expiry.
- Query RapidAPI Google Shopping and BestBuy Affiliate with API-key auth; handle rate-limit headers (`X-RateLimit-Remaining`, `Retry-After`) defensively.
- Implement a `Source` ABC with a uniform `search(query, max_results) -> list[RawListing]` return type so new sources drop in without touching the aggregator.
- Map each source's raw JSON onto the shared item schema (`id, query, category, title, brand, price, currency, source, marketplace, url, image_url`) with field-presence guards for missing keys.
- Run an end-to-end smoke test that hits all three live APIs and confirms ≥1 result per source for a known query.

---

## 4. Data

**Mode:** LIVE — this part's lesson *is* real network I/O.

**Endpoints exercised:**

| Source | Auth | Key endpoint |
|---|---|---|
| eBay Browse API | OAuth 2.0 client-credentials (`/identity/v1/oauth2/token`) | `GET /buy/browse/v1/item_summary/search?q=…` |
| RapidAPI Google Shopping | `X-RapidAPI-Key` header | `GET rapidapi.com/…/search?q=…` (same host used in Part 1 ingest) |
| BestBuy Affiliate | `apiKey` query param | `GET api.bestbuy.com/v1/products(search=…)` |

**Snapshot role:** The frozen snapshot is used in two places only — (a) as the expected schema reference that all three connectors must conform to (checked by `validate_listing()` in `dealfinder/normalize.py`), and (b) as golden fixture data in the unit tests (`tests/fixtures/ebay_raw.json`, `rapidapi_raw.json`, `bestbuy_raw.json`) so CI runs offline.

**Query used for smoke test:** `"noise cancelling headphones"` — identical to the anchor query that produced the snapshot's 18-item headphones subset (snapshot median $162.97).

No snapshot items are modified in this part; this part adds new live rows to the runtime catalog, not to the committed snapshot.

---

## 5. Worked example

**Query:** `"noise cancelling headphones"` fired against all three sources simultaneously via `asyncio.gather`.

eBay Browse returns a page of results. Expect to see:
- A Sony WH-1000XM5 listing (historically $149–$199 on eBay) mapped to `source="ebay"`, `marketplace="ebay"`.
- The connector sets `deal_pct = None` at ingestion time — the aggregator (Part 9) computes it against the cross-source median once all sources are merged.

RapidAPI Google Shopping (same vendor as the snapshot) returns the familiar set including:
- Sony WH-1000XM5 at Costco ($162.97 in snapshot, live price may drift slightly) — `source="google_shopping"`, `marketplace="costco"`.
- Anker Soundcore Q20i ~$44.99 — mapped faithfully; `brand` field will hold the retailer string (same messiness as snapshot; Part 6 extraction cleans it downstream).

BestBuy Affiliate returns in-store/online stock:
- Bose QuietComfort 45 may appear at BestBuy's sale price ($199–$249 typical). This is the *correct* BestBuy price — not the $46 trap from the snapshot (which came from a third-party listing on Google Shopping). The contrast is worth calling out in prose: the same product, two sources, very different prices. That contrast motivates the dedup + source-trust weighting in Part 9.

**Connector output (post-normalize, one row):**
```json
{
  "id": "ebay-v1|271843901234",
  "query": "noise cancelling headphones",
  "category": null,
  "title": "Sony WH-1000XM5 Wireless Noise Canceling Headphones - Black",
  "brand": "SONY",
  "price": 159.99,
  "currency": "USD",
  "source": "ebay",
  "marketplace": "ebay",
  "url": "https://www.ebay.com/itm/271843901234",
  "image_url": "https://i.ebayimg.com/images/…",
  "deal_pct": null,
  "median_price_at_capture": null
}
```
`category` and `deal_pct` are `null` here; both are filled by the aggregator (Part 9) after cross-source merging.

---

## 6. Companion code

**NEW part** — no pre-existing step tag covers eBay Browse OAuth or BestBuy Affiliate.

**Existing modules touched:**
- `dealfinder/sources/base.py` — `Source` ABC (exists from Part 1; this part adds `authenticate()` to the contract)
- `dealfinder/normalize.py` — `validate_listing()` (exists; this part adds `source`-field normalization per connector)

**New modules introduced:**
- `dealfinder/sources/ebay.py` — `EbaySource(Source)`: OAuth token manager (client-credentials, auto-refresh 2 min before expiry stored in `~/.dealfinder/tokens/ebay.json`), `search()` implementation, field mapping.
- `dealfinder/sources/bestbuy.py` — `BestBuySource(Source)`: API key auth, `search()`, field mapping.
- `dealfinder/sources/rapidapi_google.py` — refactored from the Part 1 ingest script into the `Source` protocol (same HTTP logic, new interface).
- `tests/test_sources_live.py` — marked `@pytest.mark.live`; skipped in CI unless `LIVE_TESTS=1`.
- `tests/test_sources_unit.py` — offline tests using fixture JSON (`tests/fixtures/`).

**Step tags:** `step-07a` (eBay OAuth + unit tests), `step-07b` (BestBuy + RapidAPI refactor + smoke test).
Compare URL pattern: `github.com/cloudcodetree/tutorial-dealfinder/compare/step-06...step-07b`

---

## 7. Animations

**Animation 1 — NEW: `OAuthFlow`**
Visual metaphor: two boxes ("Your App" and "eBay Auth Server") with a token packet that travels right (POST `/token`), transforms into a stamped envelope (access token), bounces back left, then gets cached with a countdown timer ticking toward expiry — at which point a refresh arrow fires automatically. Makes the client-credentials grant + proactive refresh visible without any prose. Distinct shape: rounded rectangle "app" node + hexagonal "auth server" node (never used elsewhere).

**Animation 2 — REUSE: `ExtractFlow`** re-themed to electronics.
Show three source bubbles (eBay / Google Shopping / BestBuy) each emitting a differently-shaped raw JSON blob that feeds into a single `normalize()` funnel and exits as identical `RawListing` rectangles. Replaces the tent-data labels with electronics connector names. Concept made visible: one schema, many source shapes.

---

## 8. Teaching beats

1. **Concept — why three sources:** show the snapshot's `source` value distribution (Google Shopping dominates; eBay = 0; BestBuy = 0). Liveness and price diversity require real connectors.
2. **Code — `Source` ABC extension:** add `authenticate() -> None` to the base; explain why auth is separate from `search()` (token reuse across calls).
3. **Code — eBay OAuth:** walk the client-credentials flow; show `token_manager.py` auto-refresh logic with the 2-min buffer.
4. **Proof — eBay unit test:** replay `tests/fixtures/ebay_raw.json` through `EbaySource._normalize()`; assert required fields present, `price > 0`, `currency == "USD"`.
5. **Code — BestBuy + RapidAPI refactor:** show how the same `Source` interface drops in with minimal diff.
6. **Proof — live smoke test:** `pytest -m live tests/test_sources_live.py` — all three sources return ≥1 result for "noise cancelling headphones". Show truncated stdout.
7. **Concept — source trust contrast:** the Bose QC45 at $46 (Google Shopping third-party) vs $199–$249 (BestBuy direct). Same product, radically different price. Flags that source metadata matters — teaser for Part 9 trust weighting.
8. **Forward hook:** these three connectors are the inputs to Part 9's tiered aggregator; Part 9 will compute `deal_pct` and handle dedup.

---

## 9. Cross-references

**Back:** Part 6 (Structured extraction) delivers `validate_listing()` and the title-normalization pipeline that the connectors in this part rely on to clean retailer-polluted `brand` fields before emitting `RawListing` objects.

**Forward:** Part 8 (Scraping responsibly) adds Apify and Firecrawl as additional `Source` implementations using the same ABC introduced here, and covers ToS/robots.txt obligations for the scraping path.

---

## 10. Reproducibility checks

| Assert | How pinned |
|---|---|
| `validate_listing(row)` passes for every row in `tests/fixtures/ebay_raw.json` (normalized) | Unit test; fixture committed; runs in CI offline |
| `validate_listing(row)` passes for every row in `tests/fixtures/bestbuy_raw.json` (normalized) | Unit test; fixture committed |
| `validate_listing(row)` passes for every row in `tests/fixtures/rapidapi_raw.json` (normalized) | Unit test; fixture committed |
| Snapshot median for "noise cancelling headphones" == $162.97 | Asserted in `tests/test_snapshot.py` (established in Part 1; must stay green) |
| Live smoke test: ≥1 result per source for query "noise cancelling headphones" | `@pytest.mark.live`; gated by `LIVE_TESTS=1`; not run in CI by default |

---

## 11. Risks / notes

- **eBay OAuth credentials:** learner must create a developer app at developer.ebay.com; sandbox vs production is a common confusion point. Tutorial explicitly says "use Production environment" and links the app creation page. Client ID + Secret go in `.env`; the pre-commit secret-scan hook already blocks accidental commits of these.
- **RapidAPI key already exists** from Part 1 — the tutorial notes this and reuses `RAPIDAPI_KEY` from `.env` with no new signup required.
- **BestBuy Affiliate approval:** BestBuy's affiliate program has a 1–3 business day review. Tutorial provides a mock fixture so learners can proceed immediately; the live test is opt-in.
- **Rate limits:** eBay Browse allows 5,000 calls/day (sandbox: 500); RapidAPI free tier is 10 req/s. The `Source.search()` implementation adds a `rate_limit_delay` kwarg (default 0.2s) and reads `Retry-After` on 429 — shown in the code walkthrough.
- **Non-determinism:** live results vary by date, geography, and availability. All quoted prices in prose (Anker ~$44.99, Sony ~$162.97) are "representative of snapshot capture" with "live prices may differ" caveat. Only the unit tests pin exact values; the smoke test only asserts count ≥ 1.
- **No GPU required.** This part is pure network I/O and JSON normalization.
