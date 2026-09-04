# Part 32 — Ship & operate (Playwright e2e, load/chaos, runbook)

**Phase:** P7 Ship · **Data mode:** — · **Bible note:** (none)

---

## 1. Objective

The learner writes a full Playwright end-to-end test suite, runs a load and chaos
test against the deployed DealFinder SaaS, and codifies an ops runbook that covers
the most likely production failures — so the system can be operated and debugged by
someone other than its author.

---

## 2. Prerequisites

- Part 24 — Containerize & ship (Docker, CI/CD, IaC/Terraform)
- Part 25 — Cloud & Kubernetes (managed Postgres, secrets mgmt)
- Part 26 — Observability & FinOps (Langfuse/Grafana, live cost, load test)
- Part 27 — Front end for real (React/Next, state, a11y, SSE streaming)
- Part 28 — Auth & accounts (Supabase Auth, RBAC)
- Part 30 — Payments & SaaS mechanics (Stripe, metering, plan gating)
- Part 31 — Security & compliance at scale (OWASP-LLM, PII/GDPR, abuse)

---

## 3. By the end, the learner can…

- Write Playwright e2e tests that cover the full user journey: anonymous search →
  sign-up → saved search → plan upgrade → gated feature access.
- Run a locust load test against the deployed app and interpret p95 latency and
  error-rate results across all API tiers simultaneously.
- Inject chaos (container kill, network partition, upstream API outage) and verify
  the circuit breaker and fallback paths from Part 9 hold under real load.
- Write and maintain an ops runbook with incident playbooks for the five most likely
  production failure modes (aggregator timeout, DB connection exhaustion, LLM API
  outage, Stripe webhook backlog, quota abuse spike).
- Add the e2e suite to the GitHub Actions deploy pipeline so it gates every
  production release.

---

## 4. Data

**No snapshot rows are scored in this part.** Tests run against the live deployed
app (staging environment from Part 24/25). Where reproducibility is needed:

- **E2e test fixtures:** the Playwright suite seeds the test account and saved search
  using the 18 queries from the frozen snapshot (`electronics-2026-07.json` `query`
  field) so the request mix is deterministic. The hero query `"noise cancelling
  headphones"` is used for the primary search journey test.
- **Load test corpus:** identical to Part 26 — locust replays the 18 snapshot queries
  uniformly. The Part 26 locustfile is extended (not replaced) with chaos scenarios.
- **Hero cast items appear in e2e assertions:** the search result for
  `"noise cancelling headphones"` must surface at least one result with price ≤
  $162.97 (the snapshot median); this is an observable postcondition for the staging
  environment because the live aggregator returns real Google Shopping data. The
  assertion is written as `price <= 200` (loose bound) to accommodate live price
  drift while still catching a broken aggregator.
- **No invented numbers.** Latency budgets (p95 targets) are derived from the Part 26
  locust baseline: `/search` p95 1,840 ms cold / 620 ms warm-cache. The e2e suite
  asserts response time < 5,000 ms (2.5× the cold baseline) — a conservative
  regression guard, not a performance SLA.

---

## 5. Worked example

**Scenario: the full user journey, e2e.**

The Playwright test opens the staging app, searches for `"noise cancelling
headphones"`, and asserts:

1. At least four result cards render within 5,000 ms.
2. The Sony WH-1000XM5 card appears (title match, case-insensitive substring).
3. The Anker Soundcore Q20i card appears and its displayed price is ≤ $50
   (sanity-checks the deal-score pipeline has not inverted).
4. A "Deal alert" badge is NOT shown on the Bose QuietComfort 45 card at $46
   (the false-positive guard from Part 3 must hold in the deployed app).

The learner then signs up with a test account, saves the search, and asserts the
saved search appears in the dashboard. They upgrade to "Pro" using Stripe's test
card `4242 4242 4242 4242`, assert plan gating unlocks the "Export CSV" button, and
cancel — asserting the button reverts on next page load.

**Chaos test scenario (conducted separately from the e2e suite):**

With 20 locust users running, the learner kills the aggregator container:

```bash
docker kill dealfinder-aggregate
```

Expected (from Part 9 circuit breaker): within 10 seconds, `/search` returns
HTTP 200 with `source: "cache"` or HTTP 503 with `{"error": "aggregator_unavailable"}`.
The test asserts the app never returns an unhandled 500. When the container restarts,
the circuit breaker resets within 30 seconds (configurable `recovery_timeout`).

**Runbook excerpt (incident: LLM API outage):**

```
Symptom : /search returns results but all `extracted_brand` fields are null.
Grafana  : langfuse_extraction_errors_total rising; llm_cost_usd flat (no calls).
Cause    : gpt-4o-mini API unreachable or rate-limited.
Playbook :
  1. Check https://status.openai.com
  2. kubectl logs -l app=dealfinder-api --tail=50 | grep "extraction"
  3. If rate limit: scale down extractor concurrency in api.py MAX_EXTRACT_CONCURRENCY.
  4. If API down: extraction degrades gracefully (Part 6 fallback = raw title,
     no structured fields). Deal score still runs on title embedding + category.
  5. Alert resolves automatically when API recovers; no restart required.
```

---

## 6. Companion code

**Existing modules touched:**
- `companions/dealfinder/locustfile.py` (Part 26) — add chaos task class
  (`KillAggregatorUser`) and a `--chaos` CLI flag; extend the 18-query task with
  a `@task(weight=1)` that calls a `/test/chaos/kill-aggregate` endpoint (staging
  only, gated by `CHAOS_ENABLED=true` env var).
- `.github/workflows/deploy.yml` (Part 24) — add a `e2e` job that runs the
  Playwright suite against the staging deployment after it passes health checks,
  before promoting to production.

**New modules (this part introduces):**
- `companions/dealfinder/tests/e2e/test_user_journey.py` — Playwright test suite
  (pytest-playwright); fixtures for test account, Stripe test mode, staging URL
  from env var `STAGING_URL`.
- `companions/dealfinder/tests/e2e/test_chaos.py` — chaos test scenarios: container
  kill, network partition (via `tc netem`), upstream mock returning 503.
- `companions/dealfinder/ops/runbook.md` — the committed runbook; five incident
  playbooks; links to Grafana dashboard panels and Langfuse queries by name.
- `companions/dealfinder/ops/healthcheck.sh` — shell script that checks all
  services (API, DB, Redis, aggregator, Stripe webhook queue depth) and exits
  non-zero if any is degraded; wired into the Kubernetes liveness probe.

**Step tags in `tutorial-dealfinder`:** NEW — `step-32-ship-operate`. Adds four
new files and extends two existing ones. Squashed after Part 31's
`step-31-security-compliance` tag.

---

## 7. Animations

**Animation 1 — REUSE `AgentLoop`**, re-themed to the e2e test lifecycle.
Relabel the loop stages: `Plan` → `Test authored`, `Act` → `Playwright runs`,
`Observe` → `Assertions evaluated`, `Reflect` → `CI gate pass/fail`. The loop
rotates continuously; a "failure" event injects a red flash on `Assertions
evaluated` and shows "PR blocked" before the loop resumes. Visual metaphor: the
test suite is itself an agent checking the system's behaviour on every deploy.
One shape: the circular loop with stage labels — already `AgentLoop`'s anchor
shape; no new shape introduced.

**Animation 2 — NEW: `ChaosRecovery`.**
Visual metaphor: a pipeline of labelled service boxes (`Aggregator`, `API`,
`Cache`, `DB`) connected by arrows. An animated "fault bolt" lands on
`Aggregator`, turning it red and severing the arrow from `API`. A counter shows
`open circuit` ticking up (0 → 10 s). Then `Cache` box glows green — traffic
reroutes via cache path (dashed arrow). After 30 s the `Aggregator` box recovers
(turns green), the circuit closes, and the direct arrow re-illuminates. Concept
made visible: the circuit breaker does not require a human to restore service;
the system self-heals when the dependency recovers. One distinct shape: the
**fault bolt** (a jagged lightning shape that severs a connection) — does not
appear in any other component.

---

## 8. Teaching beats

1. **Concept — the three test layers of a deployed SaaS.** Unit (Parts 3–20), e2e
   (this part), and chaos. Each catches a different failure class; all three are
   needed in the deploy pipeline.
2. **Code — `test_user_journey.py`.** Write the anonymous search test first; run it
   against staging. Extend to the sign-up → saved search → plan upgrade flow. Show
   the Playwright trace viewer — it's the e2e equivalent of a Langfuse trace.
3. **Proof — hero-cast assertions.** Run the suite; confirm the Sony XM5, Anker Q20i,
   and Bose QC45 assertions all pass. The Bose "no deal badge" assertion is the
   most important — it confirms the two-signal deal score from Part 3 is live.
4. **Code — CI integration.** Add the `e2e` job to `deploy.yml`; show the GitHub
   Actions YAML diff. Explain why e2e runs against staging, not production.
5. **Concept — chaos engineering.** What a circuit breaker failure looks like without
   chaos testing (discovered in production, at 2 a.m.). Show `ChaosRecovery` animation.
6. **Code — `test_chaos.py` + locust chaos task.** Kill the aggregator container; watch
   locust error rate spike then recover. Assert HTTP 503 (not 500) within 10 s.
7. **Tool — the runbook.** Walk through `runbook.md`; explain each incident playbook was
   written by working backward from a real Grafana alert the learner has now seen fire.
   The runbook is a first-class deliverable, not documentation written after the fact.
8. **Concept — operability as a design principle.** A system that can't be debugged by
   someone other than its author is not production-ready. The runbook, healthcheck
   script, and e2e suite are the operability layer — written before Part 33's
   system-design interview because interviewers ask about it.

---

## 9. Cross-references

**Back:** Part 31 (Security & compliance at scale) hardened the system against abuse,
injection, and PII leakage — Part 32 assumes those controls are in place and verifies
them hold under load (the chaos test includes a synthetic abuse burst to confirm rate
limiting does not degrade the circuit breaker's recovery path).

**Forward:** Part 33 (Case study + system-design interview) uses the deployed,
operated, tested system as its artefact — the interviewee's answer to "how do you
know it works in production?" is the e2e suite, the chaos test results, and the
runbook built in Part 32.

---

## 10. Reproducibility checks

```python
# test_part32_unit.py — runs in CI without a live deployment

def test_chaos_locust_task_registered():
    """KillAggregatorUser task exists and is gated by CHAOS_ENABLED."""
    from dealfinder.locustfile import KillAggregatorUser
    import os
    os.environ["CHAOS_ENABLED"] = "false"
    user = KillAggregatorUser(environment=None)
    assert user.chaos_enabled is False

def test_healthcheck_script_is_executable():
    import os, stat
    path = "companions/dealfinder/ops/healthcheck.sh"
    mode = os.stat(path).st_mode
    assert bool(mode & stat.S_IXUSR), "healthcheck.sh must be executable"

def test_runbook_contains_five_playbooks():
    with open("companions/dealfinder/ops/runbook.md") as f:
        content = f.read()
    playbooks = [line for line in content.splitlines()
                 if line.startswith("## Incident:")]
    assert len(playbooks) == 5, f"Expected 5 incident playbooks, found {len(playbooks)}"

def test_e2e_snapshot_queries_used():
    """E2e fixture must reference all 18 snapshot queries."""
    import json
    with open("companions/dealfinder/data/snapshots/electronics-2026-07.json") as f:
        items = json.load(f)
    queries = {item["query"] for item in items}
    assert len(queries) == 18

# The Playwright e2e suite itself (test_user_journey.py) is run in the CI
# `e2e` job against STAGING_URL; it is not re-run here (requires live deployment).
# The hero-cast assertions that must pass:
#   - Sony WH-1000XM5 card present (title substring match)
#   - Anker Soundcore Q20i price <= 50
#   - Bose QuietComfort 45 does NOT carry a "Deal" badge
```

---

## 11. Risks / notes

- **Playwright requires a live staging deployment.** The e2e suite cannot run against
  mocks — it validates the full stack. CI must provision staging (Part 24/25 Terraform)
  before the `e2e` job runs. If staging is not available (e.g., first repo clone), the
  `e2e` job is skipped, not failed, via a `STAGING_URL` env-var guard.
- **Chaos tests are destructive by design.** The `CHAOS_ENABLED=true` flag must never
  be set in the production environment. The tutorial is explicit: chaos tests run
  against a dedicated chaos namespace in staging, not the same namespace as the e2e
  suite. The `healthcheck.sh` script confirms `CHAOS_ENABLED` is unset before any
  production deploy step proceeds.
- **Stripe e2e requires Stripe test mode keys.** The plan-upgrade test uses Stripe's
  test card `4242 4242 4242 4242` and the test-mode webhook secret. These must be
  set in the staging environment secrets (Part 25 secrets management). CI uses the
  same test-mode keys; no real charges are made.
- **Hero-cast assertions may drift with live data.** The Anker Q20i `price <= 50`
  and Sony XM5 title-match assertions are written against live aggregator results —
  if the product is discontinued or the listing changes, the test may fail for a
  legitimate reason unrelated to code. The tutorial documents this as a known trade-off
  of e2e tests against live data and instructs learners to treat such failures as a
  data investigation, not a code bug.
- **No GPU required.** All test infrastructure (Playwright, locust, chaos scripts,
  healthcheck) runs on CPU. The deployed app itself uses the GBM deal-score model on
  CPU and `gpt-4o-mini` via API — no accelerator required in staging.
- **Non-determinism in load-test latency numbers.** The p95 values in the worked
  example (1,840 ms / 620 ms) are from the Part 26 baseline; Part 32 does not
  re-quote them as pinned metrics. The e2e response-time assertion (`< 5,000 ms`) is
  deliberately loose to avoid flaky CI on shared staging infrastructure.
