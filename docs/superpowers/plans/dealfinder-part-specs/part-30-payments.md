# Part 30 — Payments & SaaS mechanics (Stripe, metering, plan gating)

**Phase:** P6 | **Data mode:** LIVE | **Bible steps:** NEW

---

## 1. Objective

The learner wires Stripe Checkout + the Billing Portal into DealFinder, meters saved-search usage against plan limits, and gates the deal-score API behind entitlement checks — so the app earns revenue without breaking for users who are mid-session when they hit a limit.

---

## 2. Prerequisites

- Part 27 (Front end for real — React/Next, state, a11y, SSE streaming): the Next.js UI the payment flows drop into.
- Part 28 (Auth & accounts — Supabase Auth, RBAC): the user identity + roles that entitlements attach to.
- Part 29 (Saved searches & the periodic-suggestions worker): the feature being metered (saved searches are the usage unit).
- Part 24 (Containerize & ship): the CI/CD pipeline that will carry the new Stripe webhook handler to prod.

---

## 3. By the end, the learner can…

- Create Stripe Products + Prices for a Free/Pro/Team tier model and attach them to Supabase user rows via a `subscriptions` table.
- Implement a `/api/stripe/webhook` handler that verifies `Stripe-Signature`, handles `checkout.session.completed` and `customer.subscription.deleted`, and keeps the DB in sync — idempotently (replay-safe).
- Gate a FastAPI endpoint (`GET /deals/search`) behind a plan entitlement check: Free users get 5 API calls/day (metered at the edge); Pro users get unlimited.
- Build a usage-metering middleware that increments a Redis counter per user per UTC day and returns `429` with a `Retry-After` header when the limit is hit.
- Add a Stripe Billing Portal link so subscribers can cancel or upgrade without contacting support.

---

## 4. Data

**Mode: LIVE — Stripe test-mode APIs + Supabase live instance + Redis (already provisioned in Part 25).**

No snapshot items are needed for the payment flow itself. Snapshot data enters only in the metered endpoint: the deal-score API from Part 3/22 runs against the live aggregator (Part 7/9), but the metering middleware is exercised with a query for "noise cancelling headphones" — the anchor query — because its behavior is well-understood and deterministic enough to demonstrate the 429 gate without flaky live pricing.

Concrete reproducible numbers:
- Plan limits: Free = 5 searches/day, Pro = unlimited (defined as Stripe Product metadata, not hardcoded).
- Test-mode Stripe prices: `price_free` ($0/mo), `price_pro` ($19/mo), `price_team` ($79/mo) — created via `stripe fixtures` CLI and committed to `stripe/fixtures.json` in the companion repo.
- Redis TTL on the daily counter: `86400 - (seconds elapsed in UTC day)` so the counter expires at midnight UTC, not a rolling 24 h.

---

## 5. Worked example

**Scenario:** a Free-tier user — identified by their Supabase JWT, anchored to the Sony XM5 / Anker Q20i demo account created in Part 28 — runs their 5th and 6th searches for "noise cancelling headphones".

**Walkthrough:**

1. Requests 1–5: `GET /deals/search?q=noise+cancelling+headphones` — the metering middleware reads `usage:{user_id}:{date}` from Redis (currently 4), increments to 5, allows through. Response includes `X-RateLimit-Remaining: 0`.
2. Request 6: middleware reads counter = 5, returns `HTTP 429 {"error":"free_limit_reached","limit":5,"reset_at":"2026-07-08T00:00:00Z"}`. The UI surfaces a "Upgrade to Pro" CTA.
3. User clicks "Upgrade" → `POST /api/stripe/create-checkout` → Stripe Checkout session in test mode with `price_pro` ($19/mo) → redirects to `stripe.com/pay/...` (test card `4242 4242 4242 4242`).
4. On success, Stripe sends `checkout.session.completed` to `/api/stripe/webhook`. Handler: verifies signature, upserts `subscriptions` row (`user_id`, `stripe_customer_id`, `plan=pro`, `status=active`), clears the Redis rate-limit key so the user can search immediately.
5. Next request: middleware checks `subscriptions` table (cached in Redis for 60 s), sees `plan=pro`, bypasses counter. The Anker Q20i ($44.99, deal_pct ≈ 72% under median $162.97) returns as before — no data change, only the gate changed.
6. User cancels: Stripe `customer.subscription.deleted` webhook fires → handler sets `plan=free`, Redis cache invalidated. Next search hits the counter again.

---

## 6. Companion code

**Existing modules used:**
- `dealfinder/api.py` (the FastAPI app — adds metering middleware and `/deals/search` gate)
- `dealfinder/db.py` (Supabase client from Part 28 — adds `subscriptions` table queries)
- `dealfinder/search.py` (the metered endpoint)

**NEW modules this part introduces:**
- `dealfinder/billing.py` — Stripe client wrapper: `create_checkout_session`, `create_portal_session`, `handle_webhook`
- `dealfinder/metering.py` — Redis-backed per-user daily counter: `increment_and_check(user_id, plan) -> (allowed, remaining, reset_at)`
- `stripe/fixtures.json` — Stripe CLI fixtures defining the three Products + Prices (committed; idempotent via `stripe fixtures create`)

**Step tags in `tutorial-dealfinder`:**
- `step-35` — NEW: `dealfinder/billing.py`, `dealfinder/metering.py`, `/api/stripe/webhook` route, Supabase `subscriptions` migration, `stripe/fixtures.json`
- `step-36` — NEW: Next.js `UpgradeBanner` component, Billing Portal link in account settings, `X-RateLimit-*` headers consumed by the UI

**Code delta:**
- `dealfinder/api.py`: add `MeteringMiddleware` (Starlette `BaseHTTPMiddleware`), wire `/api/stripe/create-checkout` + `/api/stripe/create-portal` + `/api/stripe/webhook` routes.
- `supabase/migrations/003_subscriptions.sql` — NEW: `subscriptions(id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end)`.

---

## 7. Animations

**Animation 1 — NEW: `BillingGate`**

Visual metaphor: a horizontal pipeline of search requests (small rectangles, left-to-right) flowing toward a gate node. A counter badge above the gate ticks 1→2→3→4→5; on the 6th request the gate turns red and the rectangle is deflected downward to a "Upgrade CTA" node. When the Stripe webhook fires, the gate flips green and the counter resets. Concept made visible: metering is a stateful side-effect that wraps the real work — it doesn't touch the deal data at all. One distinct shape: the gate icon (a horizontal sliding bolt, not an X).

**Animation 2 — NEW: `WebhookSync`**

Visual metaphor: three columns — `Stripe`, `Webhook Handler`, `Supabase`. An event bubble originates in Stripe (`checkout.session.completed`), crosses to the handler (which shows a signature-verify checkmark), then a write arrow lands in Supabase (`plan: pro`). A second path shows a replay of the same event — the handler's idempotency check (deduplicated by `stripe_subscription_id`) short-circuits before the DB write. Concept made visible: webhook handlers must be replay-safe; the idempotency path is a first-class code branch, not a nice-to-have.

---

## 8. Teaching beats

1. **Concept — why not just check a DB column on every request:** show the latency cost of a Postgres round-trip per API call; introduce Redis as the fast entitlement cache with a 60 s TTL, with the DB as the source of truth on cache miss.
2. **Code — Stripe fixtures:** run `stripe fixtures create stripe/fixtures.json` to provision Products + Prices in test mode; inspect in Stripe Dashboard. Establishes that plan definitions live in version control, not in a browser.
3. **Concept — the metering middleware:** walk `MeteringMiddleware.__call__`; show that it runs before the route handler and short-circuits with `429` without executing any search logic. Cheap by design.
4. **Code — Checkout session:** `stripe.checkout.Session.create(...)` — walk the params (`price`, `success_url`, `cancel_url`, `client_reference_id=user_id`); show the test-mode redirect.
5. **Code — webhook handler:** verify `stripe.Webhook.construct_event(payload, sig_header, secret)` → catch `SignatureVerificationError`; show the idempotency pattern (`INSERT … ON CONFLICT DO NOTHING`).
6. **Proof — end-to-end test:** `pytest tests/billing/test_metering.py` — simulate 5 allowed + 1 blocked request against a Redis test instance; assert `429` on the 6th and `200` after the webhook fires. All assertions run offline against the test-mode Stripe fixture.
7. **Concept — Billing Portal:** one `stripe.billing_portal.Session.create(customer=...)` call; the learner never builds a cancellation UI. The portal handles proration, failed payments, and plan changes.

---

## 9. Cross-references

**Back:** Part 29 (Saved searches & the periodic-suggestions worker) introduced the usage unit being metered here — saved searches. Part 30 closes the loop: the suggestions worker already reads `user.plan` from Supabase (established in Part 28) to decide how many suggestions to generate; Part 30 makes that plan field authoritative by tying it to a live Stripe subscription.

**Forward:** Part 31 (Security & compliance at scale — OWASP-LLM, PII/GDPR, abuse) extends the billing infrastructure by adding abuse-detection guardrails: rate-limit bypass attempts, fraudulent card patterns, and GDPR deletion that must also cancel the Stripe subscription and purge the `subscriptions` row. The webhook handler built here is the integration point.

---

## 10. Reproducibility checks

```python
# tests/billing/test_metering.py
import fakeredis, pytest
from dealfinder.metering import increment_and_check

@pytest.fixture
def redis():
    return fakeredis.FakeRedis()

def test_free_tier_gate(redis):
    for i in range(5):
        allowed, remaining, _ = increment_and_check("user-1", "free", redis=redis)
        assert allowed
        assert remaining == 4 - i
    allowed, _, _ = increment_and_check("user-1", "free", redis=redis)
    assert not allowed  # 6th call blocked

def test_pro_tier_bypass(redis):
    for _ in range(100):
        allowed, remaining, _ = increment_and_check("user-2", "pro", redis=redis)
        assert allowed
        assert remaining is None  # unlimited sentinel
```

```python
# tests/billing/test_webhook.py
# Uses stripe-mock or the recorded test-mode event payload committed to fixtures/
def test_checkout_completed_upserts_subscription(client, supabase_test_db):
    payload = open("stripe/fixtures/checkout_completed.json").read()
    sig = stripe.WebhookSignature.generate_header(payload, STRIPE_WEBHOOK_SECRET)
    r = client.post("/api/stripe/webhook", data=payload,
                    headers={"Stripe-Signature": sig})
    assert r.status_code == 200
    row = supabase_test_db.table("subscriptions").select("*").eq("user_id", "user-1").single().execute()
    assert row.data["plan"] == "pro"
    assert row.data["status"] == "active"

def test_webhook_idempotent(client, supabase_test_db):
    # Send the same event twice — row count must not increase
    payload = open("stripe/fixtures/checkout_completed.json").read()
    sig = stripe.WebhookSignature.generate_header(payload, STRIPE_WEBHOOK_SECRET)
    client.post("/api/stripe/webhook", data=payload, headers={"Stripe-Signature": sig})
    client.post("/api/stripe/webhook", data=payload, headers={"Stripe-Signature": sig})
    rows = supabase_test_db.table("subscriptions").select("id").eq("user_id", "user-1").execute()
    assert len(rows.data) == 1
```

Metering anchor: for "noise cancelling headphones", the Free-tier 429 fires after exactly 5 `GET /deals/search` calls; the Redis key `usage:user-1:2026-07-08` must equal 5 after those calls (assert directly against fakeredis).

---

## 11. Risks / notes

- **Stripe webhook secret in env:** `STRIPE_WEBHOOK_SECRET` is a different value in test mode vs. prod; the tutorial uses Stripe CLI's `stripe listen --forward-to localhost:8000/api/stripe/webhook` for local dev, which injects its own signing secret. Document both paths clearly; the `.env.example` in the companion repo shows both vars.
- **Redis TTL drift across midnight UTC:** counter expiry is set to `86400 - seconds_into_day` on first write; if the Redis server clock drifts, a user could get a slightly shorter or longer day. Acceptable for rate-limiting; call it out as a known trade-off, not a bug to fix.
- **Stripe test-mode only:** the tutorial never uses real money. `stripe/fixtures.json` and the committed webhook payload (`stripe/fixtures/checkout_completed.json`) allow all billing tests to run offline in CI without a Stripe account. Stripe CLI must be installed locally for the end-to-end walkthrough (free, no account required for test mode).
- **Supabase RLS on `subscriptions`:** the migration must add a Row Level Security policy so users can read their own row but not others'; the webhook handler uses the `service_role` key (server-side only, never in the browser) to write. This is a security invariant — call it out explicitly and add a test that the anon key cannot read another user's subscription.
- **Non-determinism:** the metered endpoint calls the live aggregator (Part 9), so pricing results may vary. Tests mock the aggregator at the HTTP boundary (respx); the 429 gate test does not depend on deal results at all.
