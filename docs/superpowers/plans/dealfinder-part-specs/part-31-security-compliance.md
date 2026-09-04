# Part 31 — Security & compliance at scale (OWASP-LLM, PII/GDPR, abuse)

**Phase:** P6 · **Data mode:** — · **Slug:** `dealfinder-security-compliance`

---

## 1. Objective

Harden the live DealFinder SaaS against the OWASP Top-10 for LLM Applications,
scrub PII from search logs and deal data in compliance with GDPR Article 17, and
implement rate-limit / abuse-detection middleware — so the learner can articulate
and demonstrate the security posture of a production LLM product during an
engineering review.

---

## 2. Prerequisites

- Part 21 — Safety, security & governance (injection, PII, model card) — the
  foundation: prompt-injection guards and the model card.
- Part 25 — Cloud & Kubernetes (managed Postgres, secrets mgmt) — where secrets
  and the database live.
- Part 26 — Observability & FinOps (Langfuse/Grafana) — the tracing layer that
  now needs PII-safe log scrubbing.
- Part 28 — Auth & accounts (Supabase Auth, RBAC) — user identity that the
  rate-limiter and GDPR deletion hooks operate on.
- Part 30 — Payments & SaaS mechanics (Stripe, metering, plan gating) — the
  billing tier that drives the per-plan abuse thresholds.

---

## 3. By the end, the learner can…

- Enumerate the OWASP LLM Top-10 risks relevant to DealFinder and map each to a
  concrete mitigation already in the codebase or added in this part.
- Add a PII scrubber that redacts email addresses, phone numbers, and credit-card
  patterns from Langfuse traces and Postgres query logs before they leave the
  application boundary.
- Implement a sliding-window rate limiter (Redis-backed) that enforces per-plan
  request quotas and returns RFC 7807 `429 Too Many Requests` with a
  `Retry-After` header.
- Write a GDPR "right to erasure" endpoint (`DELETE /account`) that removes all
  user rows, saved searches, and Langfuse traces tied to a user ID within 30 days,
  and pass the accompanying audit test.
- Produce a one-page security runbook (as a committed `docs/security-runbook.md`)
  covering incident triage for a prompt-injection attempt, a PII leak, and an
  abuse spike.

---

## 4. Data

**Mode: —** (no snapshot rows are scored; no live APIs are called for deal data).

The DealFinder app is already running from Parts 25–30 and this part operates on
its traffic, logs, and database schema.

**Snapshot used for one concrete demonstration only:** the 270-item frozen snapshot
(`companions/dealfinder/data/snapshots/electronics-2026-07.json`) provides the
18 query strings as the synthetic "organic traffic" corpus that the abuse-detection
tests replay. The `"noise cancelling headphones"` query appears among the 18, so
hero-cast items surface naturally in the rate-limiter tests without inventing
separate inputs.

**PII scrubber test fixture (committed, not from snapshot):**
```python
FIXTURE_TRACE = {
    "query": "noise cancelling headphones for john.doe@example.com",
    "result_title": "Sony WH-1000XM5",
    "user_note": "call me at 555-867-5309"
}
EXPECTED_SCRUBBED = {
    "query": "noise cancelling headphones for [EMAIL]",
    "result_title": "Sony WH-1000XM5",
    "user_note": "call me at [PHONE]"
}
```
The Sony WH-1000XM5 title is left intact (not PII); only the injected PII tokens
are redacted. This fixture is deterministic and requires no API call.

---

## 5. Worked example

**Scenario: an abuse spike + PII leak, caught and contained.**

1. A free-tier user issues 60 requests in 60 seconds (limit: 20/min). The
   sliding-window rate limiter (Redis key: `ratelimit:<user_id>:noise+cancelling+headphones`)
   detects the overage on request 21. The API returns:
   ```
   HTTP 429 Too Many Requests
   Retry-After: 43
   Content-Type: application/problem+json
   {"type": "https://dealfinder.com/errors/rate-limit",
    "title": "Rate limit exceeded",
    "detail": "Free plan: 20 requests/minute. Upgrade to Pro for 200/minute.",
    "plan": "free", "limit": 20, "window_seconds": 60}
   ```
   The Grafana dashboard (Part 26) shows a spike in `http_requests_total{status="429"}`.

2. A learner deliberately submits: `q=headphones for alice@corp.com`. Without the
   scrubber, the Langfuse trace logs the raw query including the email. With the
   scrubber active, the trace shows `"noise cancelling headphones for [EMAIL]"`.
   The Sony WH-1000XM5 result ($162.97 Costco) and Anker Q20i ($44.99) still appear
   correctly — scrubbing touches only PII tokens, not product data.

3. The GDPR deletion endpoint is called for a test user:
   ```
   DELETE /account
   Authorization: Bearer <token>
   ```
   The handler runs: delete `saved_searches` rows, delete `users` row, enqueue a
   Langfuse trace-deletion job (async, 30-day SLA). Response:
   ```json
   {"status": "erasure_scheduled", "user_id": "usr_xxx",
    "saved_searches_deleted": 3, "traces_queued_for_deletion": 12}
   ```
   An audit log row is written to `erasure_audit` (never deleted; GDPR requires
   proof of deletion, not the data itself). The accompanying test asserts no user
   row remains in `users` after the call.

---

## 6. Companion code

**Existing modules touched:**
- `companions/dealfinder/api.py` — add rate-limit middleware (FastAPI dependency),
  GDPR deletion endpoint (`DELETE /account`), OWASP-LLM prompt-injection guard
  extended from Part 21 to cover indirect injection via product titles.
- `companions/dealfinder/observability.py` (Part 26) — wrap the Langfuse `generation`
  call with `pii_scrub()` before trace emission.
- `companions/dealfinder/db.py` — add `erasure_audit` table migration; add
  `delete_user_data(user_id)` transactional helper.

**New modules (this part introduces):**
- `companions/dealfinder/security/pii_scrubber.py` — regex + spaCy NER hybrid
  scrubber; patterns for email, phone, card numbers; returns redacted copy with
  `[EMAIL]`/`[PHONE]`/`[CARD]` tokens.
- `companions/dealfinder/security/rate_limiter.py` — Redis sliding-window limiter;
  per-plan thresholds dict (`{"free": 20, "pro": 200, "enterprise": 2000}` req/min);
  returns `(allowed: bool, retry_after_seconds: int)`.
- `companions/dealfinder/security/owasp_llm_map.py` — data-only module: a dict
  mapping each OWASP LLM Top-10 item to its mitigation status in DealFinder
  (`implemented`, `partial`, `out_of_scope`). Used by the runbook generator.
- `docs/security-runbook.md` — generated by `scripts/generate-security-runbook.py`
  from `owasp_llm_map.py` + hand-edited playbooks for the three incident types.

**Step tags in `tutorial-dealfinder`:** NEW — `step-31-pii-scrubber`,
`step-31-rate-limiter`, `step-31-gdpr-deletion`. Three fine-grained tags so
learners can diff each hardening layer independently.

---

## 7. Animations

**Animation 1 — REUSE `SchemaGate`**, re-themed to security.
`SchemaGate` currently shows a field-validation gate blocking a malformed record.
Re-theme: the left side shows a raw Langfuse trace payload containing
`john.doe@example.com`; the gate node is labelled "PII Scrubber"; the right side
shows the scrubbed payload `[EMAIL]`. Use the same two-box + gate shape — one
rectangle left (raw), one diamond gate (scrubber rules), one rectangle right
(clean). Concept made visible: PII never crosses the logging boundary in plaintext.

**Animation 2 — NEW: `SlidingWindow`.**
Visual metaphor: a horizontal timeline (the "window") 60 seconds wide, sliding
left as time advances. Filled circles represent requests; the first 20 are green
(allowed); circles 21–60 are red (blocked). A counter above reads `21 / 20 —
RATE LIMITED`. As the window slides, older green circles drop off the left edge
and the counter decrements back below 20, turning green again. One distinct shape:
the **sliding timeline bar** with circle tokens — does not appear in any other
component. Concept made visible: why a sliding window (not a fixed-window reset)
prevents burst abuse at window boundaries.

---

## 8. Teaching beats

1. **Concept — OWASP LLM Top-10 for DealFinder.** Walk `owasp_llm_map.py`:
   LLM01 prompt injection (mitigated in Part 21 + extended here for indirect
   injection via scraped titles), LLM02 insecure output handling (mitigated:
   extracted fields are schema-validated before use), LLM06 sensitive info
   disclosure (mitigated: PII scrubber, this part). Mark `partial` and `out_of_scope`
   items honestly. Show that "compliant" is a spectrum, not a boolean.
2. **Code — `pii_scrubber.py`.** Write and test the regex tier first (fast, zero
   cost); add the spaCy NER tier for person names (slower, optional). Run against
   the fixture; confirm `[EMAIL]` and `[PHONE]` appear; confirm Sony WH-1000XM5
   title is untouched. `SchemaGate` animation here.
3. **Code — integrate scrubber into `observability.py`.** Wrap the Langfuse
   generation call; run the hero query manually; open the Langfuse UI to confirm
   no email appears in the trace.
4. **Concept — sliding-window rate limiting.** `SlidingWindow` animation here.
   Compare fixed-window (burst attack possible at window boundary) vs. sliding-window
   (smoothed). Show the Redis key structure: `ratelimit:<user_id>` sorted set of
   request timestamps, `ZREMRANGEBYSCORE` + `ZCARD` pattern.
5. **Code — `rate_limiter.py` and middleware.** Wire as a FastAPI dependency;
   replay the 18-query abuse test; watch Grafana show `429` spike. Show the
   `Retry-After` header value computed from window remainder.
6. **Concept — GDPR right to erasure.** Distinguish deletion (user data) from
   retention (audit proof). Show the two-table pattern: `users` is deleted;
   `erasure_audit` is append-only.
7. **Code — `DELETE /account`.** Walk the transactional helper in `db.py`;
   run the test user deletion; query `erasure_audit` to confirm the row. Assert
   `SELECT COUNT(*) FROM users WHERE id = 'usr_xxx'` returns 0.
8. **Proof — security runbook.** Open `docs/security-runbook.md`; walk the
   three incident playbooks (injection, PII leak, abuse spike). Explain that a
   runbook without a test is a guess — link each step back to the tests above.

---

## 9. Cross-references

**Back-reference (Part 30):** "Part 30 — Payments & SaaS mechanics introduced plan
tiers and metering. This part uses those same plan definitions (`free`, `pro`,
`enterprise`) as the thresholds for the rate limiter; the Stripe plan a user is on
determines how many requests per minute they are allowed before receiving a 429."

**Forward-reference (Part 32):** "Part 32 — Ship & operate runs Playwright end-to-end
tests and a chaos suite against the fully secured app. The rate-limiter and GDPR
deletion endpoint you built here are both tested in the e2e suite, and the security
runbook is the basis for the production incident-response checklist."

---

## 10. Reproducibility checks

| Assert | How pinned |
|---|---|
| PII scrubber redacts `john.doe@example.com` → `[EMAIL]` and `555-867-5309` → `[PHONE]` | `test_security.py::test_pii_scrubber_fixture` — exact string equality against `EXPECTED_SCRUBBED` |
| Sony WH-1000XM5 title is not modified by scrubber | `test_security.py::test_pii_scrubber_preserves_product_title` |
| Request 21 in a 60-req/60-sec burst returns `allowed=False`, `retry_after > 0` | `test_security.py::test_rate_limiter_free_tier_exceeded` — uses a fake Redis (fakeredis) |
| `delete_user_data("usr_test")` removes user row and inserts erasure audit row | `test_security.py::test_gdpr_deletion` — SQLite in-memory DB |
| `owasp_llm_map.py` contains keys for all 10 OWASP LLM items | `test_security.py::test_owasp_map_completeness` — asserts `len(OWASP_LLM_MAP) == 10` |

All five tests run offline with no live API calls (fakeredis, SQLite, fixture data).

---

## 11. Risks / notes

- **spaCy model download.** The NER tier of `pii_scrubber.py` requires
  `python -m spacy download en_core_web_sm` (~12 MB). CI must include this step;
  the tutorial notes it and provides a flag `--no-ner` to fall back to regex-only
  for learners on slow connections. Regex-only still passes all pinned tests.
- **Redis dependency.** The rate limiter requires a running Redis instance.
  `fakeredis` (`pip install fakeredis`) is used in tests; Docker Compose from
  Part 24 already includes a Redis container. No new infra is introduced.
- **GDPR Langfuse trace deletion** is async (30-day SLA is the legal requirement).
  The tutorial covers the queue-and-confirm pattern but does not implement the
  async deletion worker (marked `TODO` in the runbook and `out_of_scope` in
  `owasp_llm_map.py`). Learners are directed to Langfuse's built-in user-data
  deletion API for production use.
- **OWASP LLM Top-10 is a living document.** The map is versioned (`OWASP_LLM_VERSION
  = "1.1"` in `owasp_llm_map.py`); a comment notes learners should re-audit on
  major version bumps.
- **No GPU, no LLM calls required.** PII scrubbing, rate limiting, and GDPR
  deletion are all pure Python + Redis + Postgres. The spaCy NER model runs on CPU
  in < 50 ms per trace.
- **Security runbook is a committed Markdown file**, not generated on every build.
  `scripts/generate-security-runbook.py` is provided so teams can regenerate it
  after updating `owasp_llm_map.py`, but the committed version is the canonical
  artifact the tutorial links to.
