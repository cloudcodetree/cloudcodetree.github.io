# Part 08 — Scraping responsibly (Apify/Shopify/Firecrawl; ToS/robots)

**Phase:** P1 | **Data mode:** LIVE | **Step tags:** step-33, step-37

---

## 1. Objective

The learner builds a scraping layer that fetches real product listings from retailer pages using Apify actors and Firecrawl, understands when scraping is the right tool versus a structured API, and hard-codes the ToS/robots.txt checks that make a scraper responsible enough to ship.

---

## 2. Prerequisites

- Part 1 — Data layer, normalization & the snapshot (snapshot shape, connectors pattern)
- Part 7 — Live multi-source connectors (real APIs, OAuth, affiliate) (connector interface, circuit breaker sketch)

---

## 3. By the end, the learner can…

- Decide between a structured API (Part 7) and a scraper based on ToS, robots.txt, and data-freshness needs.
- Run an Apify actor (`apify/google-shopping-scraper`) and a Firecrawl crawl against a retailer URL, normalizing the raw HTML/JSON output into the snapshot item schema.
- Implement a `robots.txt` guard that refuses to scrape a URL whose Disallow rules cover the target path.
- Integrate a scraped source as a named connector in `aggregate.py` so it participates in the dedup + deal-score pipeline.
- Cap request rate and set a `User-Agent` that identifies the bot, matching the practices expected by responsible scraping conventions.

---

## 4. Data

**Mode:** LIVE — this part is about obtaining data, not processing a frozen set. No snapshot items are re-quoted as "from this part's run" because scraper output is non-deterministic across time.

**Snapshot role:** the frozen snapshot (`companions/dealfinder/data/snapshots/electronics-2026-07.json`) was itself produced by the Apify connector this part builds; the 270 items are the ground truth for "what a healthy scraper run looks like." The part uses the snapshot only to show the expected output shape (18 queries → ~15 items each, `source: "apify"` or `source: "firecrawl"`, same `id/query/category/title/brand/price/…` fields).

**Live endpoints used:**
- Apify REST API: `POST /v2/acts/apify~google-shopping-scraper/runs` + `GET /v2/acts/apify~google-shopping-scraper/runs/{runId}/dataset/items`
- Firecrawl scrape endpoint: `POST https://api.firecrawl.dev/v1/scrape` with `formats: ["json"]` and a Shopify-style retailer URL (e.g., a public storefront listing page)
- robots.txt: `GET <retailer_origin>/robots.txt` — evaluated before every domain is scraped

**No eBay:** eBay sandbox returns test data in this environment; exclude it exactly as in the snapshot.

---

## 5. Worked example

**Query:** `"noise cancelling headphones"` — the hero-cast anchor query.

**Step 1 — ToS / robots.txt check.**
Before firing the Apify actor at `bestbuy.com`, the guard fetches `https://www.bestbuy.com/robots.txt`. The relevant section disallows `/search*`. The guard logs `BLOCKED bestbuy.com /search* (robots.txt Disallow)` and skips the domain. The part shows the exact log line and explains why obeying it matters (legal, ethical, rate-limit avoidance).

**Step 2 — Apify actor run.**
Target: Google Shopping for `"noise cancelling headphones"`. The actor returns raw JSON; a normalizer maps each item:
```
raw["title"]    → item["title"]     e.g. "Sony WH-1000XM5 Wireless Headphones"
raw["price"]    → item["price"]     e.g. 162.97
raw["merchant"] → item["brand"]     e.g. "Costco"   ← retailer, not manufacturer (expected messiness)
raw["link"]     → item["url"]
```
The Sony WH-1000XM5 at $162.97 from Costco and at $248 from Macy's both appear in the raw output — exactly the dedup pair from the hero cast. The normalizer assigns both the same `id` pattern (`noise-cancelling-headphones-sony-wh1000xm5`); Part 9 (dedup) will collapse them. Here the part shows both rows entering the connector output unchanged.

**Step 3 — Firecrawl scrape (Shopify storefront).**
Target: a public Shopify-powered audio accessories storefront. `POST /v1/scrape` with `jsonOptions.schema` set to the item schema. The Anker Soundcore Q20i at $44.99 appears; the Bose QuietComfort 45 at $46 appears. The part notes the Bose price looks like a mislisting at scrape time — that concern is deferred to Part 3 (model residual), not handled here.

**Step 4 — Rate limiting.**
The scraper sleeps 2 s between requests to the same domain, sets `User-Agent: DealFinderBot/1.0 (+https://cloudcodetree.com)`, and caps concurrent Apify runs at 2. The part shows the `asyncio.Semaphore(2)` pattern.

**Expected output shape** (matches snapshot):
```json
{
  "id": "noise-cancelling-headphones-sony-wh1000xm5-costco",
  "query": "noise cancelling headphones",
  "category": "audio",
  "title": "Sony WH-1000XM5 Wireless Headphones",
  "brand": "Costco",
  "price": 162.97,
  "currency": "USD",
  "source": "apify",
  "marketplace": "google_shopping",
  "url": "https://…",
  "image_url": "https://…",
  "deal_pct": null,
  "median_price_at_capture": null
}
```
`deal_pct` and `median_price_at_capture` are null at scrape time; they are filled downstream by `aggregate.py`.

---

## 6. Companion code

**NEW part** — no existing module covers scraping directly.

**New module:** `companions/dealfinder/dealfinder/scrapers.py`
- `ApifyConnector(BaseConnector)` — wraps the Apify actor run + poll + dataset fetch
- `FirecrawlConnector(BaseConnector)` — wraps the Firecrawl scrape endpoint
- `robots_guard(url: str) -> bool` — fetches and evaluates robots.txt; used by both connectors
- `RateLimiter` — token-bucket per domain, `asyncio.Semaphore` for global concurrency cap

**Modified:** `companions/dealfinder/dealfinder/aggregate.py` — registers the two new connectors alongside the existing RapidAPI connector from Part 7.

**Step tags:**
- `step-33` — `scrapers.py` + robots guard + rate limiter
- `step-37` — integration into `aggregate.py`; end-to-end `python -m dealfinder search "noise cancelling headphones" --sources apify,firecrawl` passes the CI smoke test

---

## 7. Animations

**Animation 1 — NEW: `ScraperDecisionTree`**
Visual metaphor: a branching flowchart with two labeled paths — "Structured API available?" → YES → Part 7 connector; NO → "robots.txt allows?" → YES → scraper; NO → blocked (red node). Each decision node is a rounded rectangle; edges are animated dashes that travel left-to-right as the learner reads. The YES/NO labels appear as the dashes complete. Concept made visible: when to scrape vs. when to use an API, and the mandatory robots.txt gate. One distinct shape: rounded-rectangle decision nodes.

**Animation 2 — REUSE: `ExtractFlow`** (re-themed to electronics)
Already exists in `app/components/mdx/`. Re-theme: replace the tent-catalog field labels with `raw["merchant"] → brand`, `raw["price"] → price`, `raw["link"] → url`. The animated pipeline shows raw scraper JSON flowing left → normalizer box → canonical item schema on the right. No new shape needed; the concept (field mapping/normalization) is what the animation must show.

---

## 8. Teaching beats

1. **Concept — API vs. scraper decision.** When does a retailer not offer an affiliate API? Show the decision tree animation. Introduce the ToS / robots.txt obligation upfront, not as an afterthought.
2. **Code — robots guard.** Write `robots_guard()` first; run it against `bestbuy.com/robots.txt`; show the BLOCKED log. Students see the guard working before the scraper is wired in.
3. **Code — ApifyConnector.** Configure the actor, fire a run for `"noise cancelling headphones"`, poll until `SUCCEEDED`, fetch dataset items. Show raw JSON. Discuss the `brand` = retailer messiness (expected; callback to Part 1).
4. **Worked example — hero cast appears.** Sony XM5 at $162.97 (Costco) and $248 (Macy's) both land in the output. Name them explicitly; note the dedup will happen in Part 9.
5. **Code — FirecrawlConnector.** Scrape a Shopify storefront. Show the `jsonOptions.schema` parameter; show the Anker and Bose rows. Flag the Bose $46 price as suspicious — defer to Part 3.
6. **Code — rate limiter.** Add the `asyncio.Semaphore(2)` + 2 s domain sleep + User-Agent. Run the combined connector; show the timing log.
7. **Proof — integration test.** `python -m dealfinder search "noise cancelling headphones" --sources apify,firecrawl` returns ≥ 10 items, all conforming to the item schema (validated by `validate-blog`-equivalent schema check). Output shape matches snapshot.

---

## 9. Cross-references

**Back:** Part 7 — Live multi-source connectors (real APIs, OAuth, affiliate) established the `BaseConnector` interface and the RapidAPI connector that `ApifyConnector` now extends. The robots guard is the missing ToS layer Part 7 deferred.

**Forward:** Part 9 — Tiered aggregation & resilience (early-stop, circuit breaker, dedup) takes the two raw scraper outputs (including the Sony XM5 duplicate pair) and shows how the aggregator merges, deduplicates, and applies circuit-breaker logic across all live sources.

---

## 10. Reproducibility checks

- `test_robots_guard_blocks_bestbuy`: asserts `robots_guard("https://www.bestbuy.com/search?q=headphones")` returns `False` (uses a recorded robots.txt fixture, not a live fetch, so CI is offline-safe).
- `test_apify_connector_output_schema`: mocks the Apify dataset endpoint with a 3-item fixture drawn from the snapshot; asserts each item has `id, query, category, title, brand, price, currency, source, marketplace, url` and that `price` is a float > 0.
- `test_firecrawl_connector_output_schema`: same pattern with a Firecrawl fixture response.
- `test_rate_limiter_respects_semaphore`: fires 5 concurrent requests against a mock server; asserts no more than 2 are in flight simultaneously (checked via a counter in the mock).
- No snapshot metrics (R², MAE, deal_pct) are quoted in this part — all live-mode; no numeric pins required.

---

## 11. Risks / notes

- **Apify costs:** each actor run costs Apify compute units. The tutorial uses the free-tier Apify account with a `maxItems: 20` cap per run to stay within quota. Document this cap explicitly; the learner should not run uncapped queries.
- **Firecrawl rate limits:** free tier is 500 pages/month. The tutorial scrapes one storefront URL per worked example. Warn the learner to set `limit: 1` in the crawl options.
- **robots.txt non-determinism:** retailer robots.txt files change. The robots guard test uses a committed fixture (`tests/fixtures/bestbuy-robots.txt`), not a live fetch. The tutorial notes this explicitly.
- **Scraper fragility:** HTML structure changes break scrapers. Apify actors abstract this; Firecrawl's LLM-extraction mode is more resilient than CSS selectors. The part leans on both for this reason and names fragility as a known cost of scraping vs. structured APIs.
- **No eBay:** the sandbox returns synthetic test data. Exclude eBay from all scraper runs in this part, consistent with the snapshot.
- **Legal disclaimer:** the tutorial includes a one-paragraph note that ToS violation is a legal risk in some jurisdictions and that learners must evaluate their target site's terms before deploying scrapers commercially.
