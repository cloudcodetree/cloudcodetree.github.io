# Part 29 — Saved searches & the periodic-suggestions worker

**Phase:** P6 | **Data mode:** LIVE | **Bible note:** (none)

---

## 1. Objective

The learner adds persistent saved searches to the DealFinder SaaS — backed by Supabase Postgres — and wires a background worker that re-runs each saved search on a schedule, diffs the results against the last snapshot, and pushes new deal alerts to the user via SSE or email.

---

## 2. Prerequisites

- Part 13 (pgvector persistence + semantic search over live deals): Postgres/Supabase schema already established; the learner knows the connection pattern.
- Part 14 (The web app — search UI, live/semantic toggle, SSE): SSE streaming already wired; the saved-search results will use the same SSE channel.
- Part 22 (Serve it fast & cheap — FastAPI, semantic cache, batching): the FastAPI app that the worker calls internally.
- Part 28 (Auth & accounts — Supabase Auth, RBAC): `user_id` is available in the JWT; the saved-searches table is row-level-secured to the owning user.

---

## 3. By the end, the learner can…

- Design and migrate a `saved_searches` table with RLS so each user's searches are invisible to others, using Supabase's SQL editor and migration files.
- Implement a REST endpoint (`POST /searches`, `GET /searches`, `DELETE /searches/{id}`) that persists a query + filters under the authenticated user's `user_id`.
- Write a periodic worker (APScheduler or a cron container job) that re-runs every saved search against the live aggregator, computes which items are new or improved deals since the last run, and persists the diff.
- Deliver deal alerts to the browser via the existing SSE channel, and optionally via email (SendGrid/Resend), gated by the user's notification preference.
- Test the worker deterministically by injecting a mock aggregator that returns a known item set — no live API calls in CI.

---

## 4. Data

**Mode: LIVE** — the worker calls the live aggregator (`dealfinder/aggregate.py`) on each schedule tick.

**Snapshot use (reproducibility anchor):** the frozen snapshot (`companions/dealfinder/data/snapshots/electronics-2026-07.json`, 270 items, query "noise cancelling headphones", median $162.97) is used only in unit tests via a mock aggregator. No snapshot data is quoted as a live output; all live numbers are presented as "your results will vary."

**Concrete reproducible numbers (from snapshot, used in tests only):**
- Mock aggregator for query "noise cancelling headphones" returns the 4 hero-cast items: Sony WH-1000XM5 @ $162.97 (Costco), Anker Soundcore Q20i @ $44.99, Bose QC45 @ $46, Sony WH-1000XM6 @ $399.99.
- A second mock tick drops the WH-1000XM5 price to $149.00 (simulated retailer drop); the diff produces one `price_drop` alert entry for that item.
- Alert threshold: price drop ≥ 5% or a new item enters the top-5 ranked results.

**Database:** Supabase Postgres (same instance as Part 13/28). New table: `saved_searches`; new table: `search_alerts`.

**Live endpoints used:** `GET /search?q=<query>&limit=10` (the app's own FastAPI endpoint, which calls the live aggregator internally). No direct RapidAPI or Apify calls from the worker code — all aggregation is delegated to the existing `aggregate.py` layer.

---

## 5. Worked example

**Scenario:** a user saves a search for "noise cancelling headphones" with a budget filter of $200.

**Walkthrough the tutorial shows:**

1. User clicks "Save this search" in the UI (Part 14's search bar). A `POST /searches` request is sent with body `{"query": "noise cancelling headphones", "filters": {"max_price": 200}, "notify": true}`. The API inserts a row into `saved_searches` with `user_id` from the JWT, `last_result_ids = ["xm5-costco", "q20i", "bose-qc45"]`, `last_run_at = now()`.

2. The periodic worker fires (every 6 hours by default). For this saved search it calls `GET /search?q=noise+cancelling+headphones&limit=10&max_price=200`. The live aggregator returns current results. The worker compares `result_ids` against `last_result_ids`.

3. In the tutorial's deterministic walkthrough (using the mock tick): the Sony WH-1000XM5 drops from $162.97 → $149.00 — a 8.6% drop, exceeding the 5% alert threshold. The worker writes one row to `search_alerts`: `{saved_search_id, item_id: "xm5-costco", alert_type: "price_drop", old_price: 162.97, new_price: 149.00, pct_change: -8.6}`.

4. The SSE channel (`/events?user_id=…`) pushes the alert JSON to the open browser tab. The UI displays a toast: "Sony WH-1000XM5 dropped to $149.00 — 8.6% off since your last check."

5. If `notify: true` and the user has an email on record (from Part 28's profile), a Resend/SendGrid call sends a one-line deal alert email. Email is fire-and-forget; failures are logged, not retried (retry logic is flagged as a Phase 7 / production hardening concern).

---

## 6. Companion code

**Existing modules used:**
- `dealfinder/aggregate.py` — called by the worker (no changes)
- `dealfinder/api.py` — gains three new route handlers (`/searches` CRUD)
- `dealfinder/auth.py` — `get_current_user()` dependency reused from Part 28
- `dealfinder/db.py` — Supabase client reused from Part 13/28

**New modules this part introduces:**
- `dealfinder/saved_searches.py` — CRUD logic + diff computation
- `dealfinder/worker.py` — APScheduler setup, the periodic job function, alert dispatch
- `dealfinder/notifications.py` — thin email adapter (Resend SDK or SendGrid)

**Step tags in `tutorial-dealfinder`:**
- `step-29` — NEW: all of the above; `supabase/migrations/20260707_saved_searches.sql` (table DDL + RLS policies); `tests/unit/test_worker_diff.py`

**Code delta:**
- `supabase/migrations/20260707_saved_searches.sql` — NEW (`saved_searches` + `search_alerts` tables, RLS: `user_id = auth.uid()`)
- `dealfinder/saved_searches.py` — NEW (180–220 lines: `save_search`, `list_searches`, `delete_search`, `compute_diff`)
- `dealfinder/worker.py` — NEW (APScheduler `BackgroundScheduler`; job: iterate open saved searches, call internal search endpoint, persist diff, enqueue alerts)
- `dealfinder/notifications.py` — NEW (50 lines; `send_deal_alert_email` wrapping Resend/SendGrid; disabled if `NOTIFY_PROVIDER` env var unset)
- `dealfinder/api.py` — MODIFIED (add `router.include_router(searches_router)`)
- `tests/unit/test_worker_diff.py` — NEW (mock aggregator, two-tick test, asserts on diff output)

---

## 7. Animations

**Animation 1 — NEW: `SavedSearchCycle`**

Visual metaphor: a circular clock-face with four arc segments labelled "Save query", "Worker tick", "Diff results", "Alert fired." A single item card (showing the Sony WH-1000XM5, price dropping from $162.97 → $149.00) animates along the arc, pausing at "Diff results" where a green badge reads "−8.6%", then arriving at "Alert fired" where a notification bell pulses. Shape: circle with orbiting card — distinct from all existing components (none use a clock/orbit metaphor). Makes visible the *latency gap* between a user saving a search and an alert arriving; clarifies that the worker is asynchronous, not real-time.

**Animation 2 — REUSE: `DriftMonitor`** (re-themed)

Re-label the axes: x-axis = "worker tick (6h intervals)", y-axis = "top-5 item set overlap with previous tick." The hero-cast query starts at 100% overlap; at tick 3 the WH-1000XM5 price drop causes the overlap to dip, triggering the alert threshold line. The existing drift-detection shape (time series + threshold band) is exactly the right metaphor for "when did results change enough to notify?"

---

## 8. Teaching beats

1. **Concept — why saved searches are hard:** a naive "re-run and email" loop misses the diff problem; without storing `last_result_ids` and prices, every tick looks like a new result set. Motivate the `search_alerts` table.
2. **Code — database migration:** walk the `saved_searches` DDL; show the RLS policy (`user_id = auth.uid()`); run `supabase db push` and verify in the Supabase dashboard.
3. **Code — REST endpoints:** implement `POST /searches` with the `get_current_user` dependency; show that a request without a valid JWT returns 401 (Part 28's guard, unchanged).
4. **Concept — the diff algorithm:** `compute_diff(old_ids, old_prices, new_results)` — new items in top-5, items that dropped ≥ 5% in price, items that left top-5. Keep it simple (set arithmetic + price comparison); no ML here.
5. **Code — the worker:** show APScheduler setup in `worker.py`; walk the job function; show how it iterates `saved_searches` rows and calls the internal search endpoint (localhost, no external network in tests).
6. **Code — notification dispatch:** show `notifications.py`; wire it into the worker; demonstrate disabling it by leaving `NOTIFY_PROVIDER` unset (safe default for dev/CI).
7. **Proof — deterministic unit test:** two-tick mock test: tick 1 seeds `last_result_ids`; tick 2 drops XM5 price to $149.00; assert `search_alerts` has exactly one row with `pct_change ≈ -8.6` and `alert_type = "price_drop"`.

---

## 9. Cross-references

**Back:** Part 28 (Auth & accounts — Supabase Auth, RBAC) established the `user_id` JWT claim, the Supabase client singleton, and RLS as the access-control primitive. Part 29 inherits all three unchanged — the saved-searches table is just another RLS-guarded table in the same Supabase project.

**Forward:** Part 30 (Payments & SaaS mechanics — Stripe, metering, plan gating) will gate the number of saved searches a user can have behind their subscription plan: free tier = 3 saved searches, paid tier = unlimited. The `saved_searches` table count becomes the metering signal Stripe billing reads.

---

## 10. Reproducibility checks

```python
# tests/unit/test_worker_diff.py

from dealfinder.saved_searches import compute_diff

TICK_1 = [
    {"id": "xm5-costco",  "price": 162.97},
    {"id": "q20i",        "price": 44.99},
    {"id": "bose-qc45",   "price": 46.00},
    {"id": "xm6",         "price": 399.99},
]
TICK_2 = [
    {"id": "xm5-costco",  "price": 149.00},  # price drop
    {"id": "q20i",        "price": 44.99},
    {"id": "bose-qc45",   "price": 46.00},
    {"id": "xm6",         "price": 399.99},
]

def test_price_drop_detected():
    alerts = compute_diff(TICK_1, TICK_2, threshold_pct=0.05)
    assert len(alerts) == 1
    a = alerts[0]
    assert a["item_id"] == "xm5-costco"
    assert a["alert_type"] == "price_drop"
    assert abs(a["pct_change"] - (-0.086)) < 0.001  # -8.6%
    assert a["old_price"] == 162.97
    assert a["new_price"] == 149.00

def test_no_alert_below_threshold():
    tick_small = [{"id": "xm5-costco", "price": 160.00}, *TICK_1[1:]]
    alerts = compute_diff(TICK_1, tick_small, threshold_pct=0.05)
    # 1.8% drop < 5% threshold
    assert all(a["item_id"] != "xm5-costco" for a in alerts)
```

```sql
-- Verify RLS: a request authenticated as user B cannot read user A's saved searches.
-- Run in Supabase SQL editor after seeding one row for user A:
SELECT count(*) FROM saved_searches;  -- must return 0 when JWT is user B's
```

---

## 11. Risks / notes

- **APScheduler in a container:** the worker runs in the same FastAPI process via `BackgroundScheduler` for simplicity; the tutorial notes this is fine for a single-instance deploy (Part 24's VM) but warns that horizontal scaling requires an external scheduler (Celery + Redis, or a separate cron container). A `WORKER_ENABLED=false` env flag disables it for read-replicas.
- **Live API cost:** the worker calls the live aggregator for every saved search on every tick. With many users this becomes expensive. The tutorial notes the semantic cache from Part 22 absorbs repeated identical queries; unique queries hit the real APIs. Defer rate-limit handling to Part 31.
- **Email provider keys:** `NOTIFY_PROVIDER` (e.g., `resend`) and `NOTIFY_API_KEY` are documented in `.env.example`; unset by default so CI never sends email. The tutorial explicitly does not require a real email provider to complete the coding steps — the unit test mocks `send_deal_alert_email`.
- **Non-determinism in live results:** all live output is presented as "your results will vary." The only quoted numbers (−8.6% drop, $162.97 median) are from the mock/snapshot path, which is fully deterministic.
- **RLS test in CI:** Supabase RLS can't be easily tested without a running Postgres instance. The tutorial provides a manual SQL verification step for local dev and documents a `supabase start` (local Docker) command for learners who want the full test in CI.
