# Part 28 — Auth & accounts (Supabase Auth, RBAC)

**Phase:** P6 — Full-stack SaaS
**Data mode:** LIVE
**Bible note:** (none)

---

## 1. Objective

The learner adds Supabase Auth (email/password + Google OAuth) to the DealFinder web app and enforces a two-tier RBAC model — free vs. pro — so protected API endpoints and UI features gate correctly based on the authenticated user's plan.

---

## 2. Prerequisites

- Part 14 — The web app (search UI, live/semantic toggle, SSE; the Next.js/FastAPI surface this part secures)
- Part 21 — Safety, security & governance (existing guardrail middleware in `serve.py`)
- Part 22 — Serve it fast & cheap (the FastAPI endpoint surface; `/search`, `/semantic`, `/batch-deals`)
- Part 25 — Cloud & Kubernetes (managed Postgres, secrets management; Supabase Postgres is the user store)
- Part 27 — Front end for real (React/Next.js component tree, state management, SSE streaming; the UI Part 28 extends)

---

## 3. By the end, the learner can…

- Stand up Supabase Auth (email/password + Google OAuth) for the DealFinder app and wire the JWT into both the Next.js frontend and the FastAPI backend.
- Enforce a two-tier RBAC model (`free` / `pro`) using Supabase Row Level Security (RLS) policies and a FastAPI `require_plan` dependency.
- Gate UI features (semantic search, batch deals, result history) behind plan checks without exposing business logic to the client.
- Write tests that assert a `free` user receives `HTTP 403` on pro-only endpoints and that a `pro` user passes through, using mocked JWTs.
- Explain why stateless JWT verification (Supabase's RS256 public key) is preferable to a DB round-trip on every request for a search API at volume.

---

## 4. Data

**Mode:** LIVE — Supabase Auth is a live external service; the DealFinder Supabase project (Postgres + Auth) runs against the learner's own free-tier Supabase project created during Part 25.

**Snapshot used for query examples:** `companions/dealfinder/data/snapshots/electronics-2026-07.json` — 270 items, 18 queries. All search examples in the worked walkthrough hit the live FastAPI server backed by this snapshot's pre-computed embeddings. No snapshot numbers change; the auth layer is additive.

**Quoted numbers (all reproducible):**
- Snapshot median for "noise cancelling headphones": **$162.97**.
- Free plan: up to **5 searches/day**, text-only results, no history.
- Pro plan: unlimited searches, semantic toggle enabled, batch endpoint (`/batch-deals`) accessible, saved history.
- JWT RS256 verify time (Supabase public key, in-process): < 1 ms (no DB call).
- Supabase free tier: 50,000 MAU — sufficient for the tutorial and the course's Stripe-gated pro upgrade in Part 30.

---

## 5. Worked example

The tutorial walks through a live session with a running Supabase project and the FastAPI server from Part 22.

**Step 1 — Unauthenticated request.**
`GET /semantic?q=noise+cancelling+headphones&k=4` with no `Authorization` header → `HTTP 401 Unauthorized`. The response body: `{"detail": "Not authenticated"}`.

**Step 2 — Sign up as a free user.**
In the Next.js UI, the learner registers `demo@example.com`. Supabase creates the user, assigns `plan = free` (default, stored in `profiles` table via a Postgres trigger on `auth.users`). The UI receives a Supabase JWT; the browser stores it in `localStorage` (the tutorial also discusses `httpOnly` cookie tradeoffs).

**Step 3 — Authenticated free user hits semantic search.**
`GET /semantic?q=noise+cancelling+headphones&k=4` with `Authorization: Bearer <jwt>` → `HTTP 403 Forbidden`. Response: `{"detail": "Semantic search requires a Pro plan"}`. The FastAPI `require_plan("pro")` dependency decoded the JWT, confirmed `plan = free` from the `profiles` table (cached on JWT claims via Supabase custom claims), and rejected the request.

**Step 4 — Same user hits text search (free endpoint).**
`GET /search?q=noise+cancelling+headphones&k=4` → `HTTP 200`. Returns the hero cast:
```json
[
  {"title": "Sony WH-1000XM5", "price": 162.97, "deal_pct": 0.0},
  {"title": "Anker Soundcore Q20i", "price": 44.99, "deal_pct": 72.4},
  {"title": "Bose QuietComfort 45", "price": 46.0, "deal_pct": 71.8},
  {"title": "Sony WH-1000XM6", "price": 399.99, "deal_pct": -145.4}
]
```
Free user sees results but the UI hides the "Semantic" toggle (grey, locked icon).

**Step 5 — Upgrade to pro (manual, pre-Stripe).**
The tutorial uses a Supabase SQL editor snippet to set `plan = pro` for the demo user (Stripe billing is Part 30). On the next request, the JWT custom claim reflects the upgrade (the tutorial shows how to refresh the session token to pick up the new claim). `GET /semantic?q=noise+cancelling+headphones&k=4` now returns `HTTP 200` with the same hero cast, plus embedding similarity scores. The "Semantic" toggle in the UI is now active.

---

## 6. Companion code

**Existing modules modified:**
- `dealfinder/serve.py` — adds `require_auth` and `require_plan(tier)` FastAPI dependencies using `python-jose` to verify Supabase RS256 JWTs. The existing guardrail middleware (Part 21) remains at position 0; auth middleware sits at position 1. `/search` gains `require_auth`; `/semantic` and `/batch-deals` gain `require_plan("pro")`.
- `app/` (Next.js) — adds `@supabase/ssr` client wrapper in `app/lib/supabase.ts`; `AuthProvider` context in `app/components/AuthProvider.tsx`; `LoginModal` / `SignUpModal` components; `useAuth` hook. Existing `SearchBar`, `ResultsList`, and the SSE stream hook from Part 27 gain plan-aware gating (semantic toggle disabled for free).

**New in this part:**
- `dealfinder/auth.py` — `verify_jwt(token) -> UserClaims` (RS256 public key fetched once at startup from `SUPABASE_JWT_SECRET`); `require_auth` dependency; `require_plan(tier)` dependency factory.
- `supabase/migrations/0001_profiles.sql` — `profiles` table (`user_id FK auth.users, plan text DEFAULT 'free'`), RLS policy (users can read only their own row), Postgres trigger to insert a profile row on sign-up.
- `tests/test_auth.py` — parametrized tests with mocked JWTs (no live Supabase needed in CI).

**Step tags:** `step-28` in `tutorial-dealfinder`. NEW part. Diff from `step-27` to `step-28` touches `serve.py`, adds `auth.py`, adds `supabase/migrations/0001_profiles.sql`, and adds the Next.js auth components.

---

## 7. Animations

**Animation 1 — NEW `AuthGateFlow`:** Visual metaphor: a horizontal pipeline with three labeled stations — "Client (JWT)", "FastAPI middleware", "Endpoint". A JWT token (shown as a small key icon with the label `plan: free`) travels left to right. At the middleware station, the key is held up against a lock; for `free` → `semantic`, the lock turns red and the token is deflected downward with a `403` badge. The pipeline then replays with `plan: pro` — the lock turns green, the token passes through, and a result card with the Sony XM5 ($162.97) emerges on the right. Hard-coded labels, Framer Motion path animation, no runtime data. Concept made visible: stateless JWT verification intercepts at the middleware boundary, not in the endpoint handler.

**Animation 2 — NEW `RBACMatrix`:** A 2×4 grid: rows = `free` / `pro`; columns = `/search`, `/semantic`, `/batch-deals`, `/history`. Each cell is either a green checkmark or a red lock icon, with a brief label (e.g. "5/day" for free `/search`). Framer Motion: cells animate in row by row. When the learner clicks a locked cell, a tooltip shows the plan required. Concept made visible: RBAC is a capability matrix, not a collection of ad-hoc `if` statements — the matrix is the spec, the `require_plan` dependency is its enforcement.

---

## 8. Teaching beats

1. **Why auth is last in the web tier (not first in the course).** The app is worth protecting only once it has something valuable: real deals, semantic search, history. The ordering is intentional — functionality first, then a security boundary.
2. **Supabase Auth setup.** Create a Supabase project; enable Email and Google providers; copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET` into `.env.local` and the FastAPI `.env`. Walk the Supabase dashboard to show where the JWT secret lives.
3. **The profiles table and RLS.** Apply `0001_profiles.sql`. Explain RLS: the DB enforces row ownership, so even a compromised app can't read another user's profile. Show the trigger that bootstraps `plan = free` on sign-up.
4. **JWT verification in FastAPI.** Walk `auth.py:verify_jwt`. Show that RS256 verification is in-process (< 1 ms) — no DB call on the hot path. Contrast with session-cookie approaches.
5. **`require_plan` dependency.** Wire it into `/semantic` and `/batch-deals`. Show the `AuthGateFlow` animation. Run `curl` as a free user → `403`; as a pro user → `200`.
6. **Next.js auth wiring.** Add `AuthProvider`, `LoginModal`, `useAuth`. Gate the Semantic toggle: `disabled={plan !== 'pro'}`. The UI reflects plan state without a round-trip — it reads the JWT claims from the Supabase session object.
7. **Google OAuth.** Enable Google in the Supabase dashboard; add the redirect URL. Show the one-line change in `LoginModal`. Explain the OAuth flow (redirect → Supabase handles the exchange → JWT returned to the app).
8. **Proof.** `pytest tests/test_auth.py` — all green. Show the mocked JWT approach so CI runs fully offline.

---

## 9. Cross-references

**Back:** Part 27 (Front end for real) built the React/Next.js component tree and SSE streaming — this part adds the auth layer on top of that UI without changing the search logic or SSE contract. The `SearchBar` and `ResultsList` from Part 27 are extended, not replaced.

**Forward:** Part 29 (Saved searches & the periodic-suggestions worker) builds on the authenticated user model introduced here — `user_id` from the JWT becomes the foreign key for saved searches, and the pro plan gate from `require_plan` is reused to limit the suggestions worker to pro users.

---

## 10. Reproducibility checks

```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from dealfinder.serve import app
from dealfinder.auth import UserClaims

FREE_CLAIMS  = UserClaims(user_id="user-free",  email="free@example.com",  plan="free")
PRO_CLAIMS   = UserClaims(user_id="user-pro",   email="pro@example.com",   plan="pro")

def make_client(claims):
    with patch("dealfinder.auth.verify_jwt", return_value=claims):
        yield TestClient(app, headers={"Authorization": "Bearer fake"})

def test_free_user_can_text_search():
    with make_client(FREE_CLAIMS) as client:
        r = client.get("/search?q=noise+cancelling+headphones&k=4")
        assert r.status_code == 200
        prices = [item["price"] for item in r.json()]
        assert 162.97 in prices   # Sony XM5 at snapshot median

def test_free_user_blocked_from_semantic():
    with make_client(FREE_CLAIMS) as client:
        r = client.get("/semantic?q=noise+cancelling+headphones&k=4")
        assert r.status_code == 403

def test_pro_user_can_semantic():
    with make_client(PRO_CLAIMS) as client:
        r = client.get("/semantic?q=noise+cancelling+headphones&k=4")
        assert r.status_code == 200

def test_pro_user_can_batch():
    with make_client(PRO_CLAIMS) as client:
        r = client.post("/batch-deals", json={"queries": ["noise cancelling headphones"]})
        assert r.status_code == 200

def test_unauthenticated_returns_401():
    client = TestClient(app)  # no auth header
    r = client.get("/search?q=noise+cancelling+headphones")
    assert r.status_code == 401
```

The `162.97 in prices` assertion is reproducible against the frozen snapshot — the Sony XM5 at Costco is the median anchor and always appears in the top-k for the anchor query.

---

## 11. Risks / notes

- **Supabase project required.** Unlike Parts 1–26 (which run fully offline against the snapshot), Part 28 requires a live Supabase project. The tutorial provides a setup checklist and links to Supabase's free tier (no credit card, 50k MAU). CI tests mock `verify_jwt` so they run offline.
- **JWT custom claims require a Supabase Edge Function or DB hook.** The `plan` claim must be embedded in the JWT at sign-in time (not fetched per-request). The tutorial provides a minimal Postgres trigger + Supabase hook that writes `plan` to `auth.users.raw_app_meta_data` so it appears in the JWT. This is a moderately fiddly Supabase config step — the tutorial shows the exact SQL and dashboard clicks.
- **Google OAuth callback URL.** Learners running on `localhost:3000` must add `http://localhost:3000/auth/callback` as an allowed redirect in the Google Cloud Console. The tutorial provides the exact steps and a note that production will use the cloudcodetree.com URL.
- **Session refresh after plan upgrade.** The tutorial's "manual upgrade" step (SQL editor) requires the learner to sign out and back in to pick up the new JWT claim. Part 30 (Stripe webhook) will automate this via a Supabase admin call — the tutorial explicitly notes the limitation and defers the fix.
- **No GPU, no significant cost.** Auth verification is in-process; no LLM calls in this part. Supabase free tier covers all tutorial traffic. Total cloud cost for this part: $0.
- **Token storage tradeoff.** The tutorial stores the JWT in `localStorage` for simplicity. It explicitly discusses `httpOnly` cookies as the more secure option and defers the migration to Part 31 (Security & compliance at scale) to avoid scope creep here.
