# Projects Section with Auth-Gated Live Demos — Design

**Date:** 2026-07-30
**Status:** Approved (brainstorming session)

## Goal

Add a **Projects** section to cloudcodetree.com: a curated gallery of repo projects
where selected projects have **live hosted demos** that require **signup to view**,
with **real access control** (server-enforced, not client-side theater).

Phase 1 ships the full pipeline with **one pilot demo: span-calculator**.

## Requirements (from brainstorming)

- **Signup purpose:** real access control — demos genuinely locked, only
  authenticated users can reach them.
- **Demo form:** live hosted web apps (not videos or embedded sandboxes).
- **Hosting/enforcement:** Cloudflare Workers.
- **Identity:** Supabase Auth, **magic link only** (no passwords, no OAuth).
- **Architecture style:** per-demo Workers with shared auth middleware
  (approach B) — each demo is its own Cloudflare project on its own subdomain.
- **Phase 1 demo lineup:** span-calculator only. Everything else appears in the
  gallery as a card without a demo button.

### Why two vendors (considered and settled)

- Cloudflare alone: CF Access is single-vendor but caps at 50 users free, uses a
  Cloudflare-hosted login, and the user list lives in their dashboard. Hand-rolled
  auth on Workers still needs a third-party email sender (CF cannot send email)
  and makes us own security-critical auth code. Rejected.
- Supabase alone: no static/app hosting story. Rejected.
- **Decision:** Cloudflare hosts + enforces; Supabase does identity (user table
  we own, unlimited-ish users, branded signup on our site).

### Rejected approaches (recorded)

- **Single gateway Worker, path-per-demo (approach A):** less per-demo wiring,
  but user chose per-demo isolation.
- **Client-side-only gate (approach C):** does not provide real access control on
  a static host — anyone can fetch the underlying assets directly.

## Architecture

Four pieces:

```
cloudcodetree.com (GitHub Pages, static, public)
  └── /projects  — gallery + sign-in UI (supabase-js, magic link)
        │  writes cookie: cct_demo_session  Domain=.cloudcodetree.com
        ▼
span-calculator.demos.cloudcodetree.com (Cloudflare Worker, per demo)
  └── withAuth() from @cloudcodetree/demo-gate
        │  verifies Supabase JWT via public JWKS
        ▼
Supabase project "cct-demos" — identity only (users, magic-link email, tokens)
```

1. **Identity — Supabase** (new free-tier project `cct-demos`). Magic-link email
   auth only. Asymmetric JWT signing (ES256) enabled so Workers verify tokens
   with Supabase's public JWKS — no secrets deployed to demos.
2. **Gallery — this repo.** `/projects` route added to nav; curated manifest;
   sign-in UI; session-cookie management.
3. **Shared gate — new repo `cloudcodetree/demo-gate`**, published to npm as
   `@cloudcodetree/demo-gate`. All auth logic in one place; demos version-bump.
4. **Demos — one Worker per demo, in the demo's own repo.** Pilot:
   `span-calculator` at `span-calculator.demos.cloudcodetree.com`.

### Cross-domain SSO mechanism

After magic-link login on `cloudcodetree.com/projects`, the gallery writes the
Supabase access token to cookie `cct_demo_session` with
`Domain=.cloudcodetree.com; Secure; SameSite=Lax; Path=/`, lifetime matched to
the access token (~1h). Browsers send it to `*.demos.cloudcodetree.com`
automatically. Demo Workers never talk to Supabase at request time beyond cached
JWKS.

**Token refresh via redirect loop:** expired/missing token → Worker 302s to
`https://cloudcodetree.com/projects?signin=1&next=<original-url>` → gallery
silently refreshes the session from localStorage (supabase-js), rewrites the
cookie, bounces back to `next`. If no session exists, the magic-link dialog opens
pre-wired to continue to `next` after login.

**Accepted trade-off:** the cookie is JS-written so it cannot be `HttpOnly`.
Threat model is a portfolio demo gate; nothing behind it is sensitive.

**Open-redirect guard:** the gallery only honors `next` values matching
`https://*.demos.cloudcodetree.com/...`.

## Gallery (this repo)

### Manifest — `app/projects/manifest.ts`

Curated, hand-maintained, single source of truth (same philosophy as
`app/tutorials/manifest.ts`):

```ts
interface Project {
  slug: string;            // 'span-calculator'
  title: string;
  description: string;     // 1-2 sentences
  tech: string[];          // chips
  repoUrl?: string;        // omitted for private repos
  demoUrl?: string;        // presence = "has demo"
  status?: 'live' | 'coming-soon';
}
```

Phase 1 content: portfolio-worthy repos (span-calculator, motion-expression,
code_compare, backlot, homestead-finder, mac-desktop-navigator,
midea-mini-split-tools — content, editable anytime). Private repos: card without
repo link. Tutorial companion repos excluded (already under /tutorials).

### Page — `/projects`

- Rewrite `ProjectsPage` in the site's glass-card style (consistent with
  `TutorialsList`). Drop the fictional `featuredProjects` **and** the live
  GitHub-API repo fetch (rate limits, noise, loading/error states all go away;
  page renders statically from the manifest). Keep a "more on GitHub →" footer
  button.
- Nav (`ClientLayout.tsx`) becomes **AI News · Tutorials · Projects · About**.

### Auth UI

- Signed out: demo buttons read **"Sign in to launch"** → magic-link dialog
  (email field → "check your inbox" state). Account chip shows signed-in email /
  sign-out.
- Signed in: **"Launch demo"** → rewrite session cookie, open demo in new tab.
- `?signin=1&next=` arrivals: silent refresh + redirect if session exists,
  otherwise dialog pre-wired to `next`.
- Supabase redirect allowlist: `https://cloudcodetree.com/projects`,
  `http://localhost:3000/projects`.
- Env: `NEXT_PUBLIC_SUPABASE_URL` + anon key baked into the static build (anon
  key is public by design; enforcement lives in the Workers).

## demo-gate package

New public repo `cloudcodetree/demo-gate` → npm `@cloudcodetree/demo-gate`
(TypeScript).

- Single export `withAuth(options)` → Worker fetch handler wrapping the
  static-assets binding (`env.ASSETS`).
- Verification: `jose` against
  `<SUPABASE_URL>/auth/v1/.well-known/jwks.json` (cached per isolate);
  checks signature, `exp`, issuer.
- Failure → 302 to `<GALLERY_URL>?signin=1&next=<original-url>`.
- JWKS unreachable → **fail closed**, brief 503.
- Config via Worker vars: `SUPABASE_URL`, `GALLERY_URL` (public values).
- Tests (vitest): valid passes; expired/forged/missing redirect; JWKS-down 503.

## Demo Worker recipe (pilot: span-calculator)

In the demo's own repo:

1. `wrangler.jsonc` — static assets binding + custom domain
   `span-calculator.demos.cloudcodetree.com`.
2. `worker/index.ts` (~10 lines) — `withAuth` wrapping assets.
3. GitHub Actions deploy via `wrangler-action`
   (repo secret `CLOUDFLARE_API_TOKEN`), building the app first if needed.
4. Post-deploy smoke check in CI: unauthenticated `curl` of the demo URL must
   return 302 to the gallery.

Adding demo #N later = repeat this recipe + one manifest entry.

## One-time infrastructure

1. **Supabase** `cct-demos`: magic link only, asymmetric signing on, redirect
   allowlist set. Built-in email service (hourly cap acceptable at portfolio
   scale; custom SMTP is a later upgrade).
2. **DNS migration Route53 → Cloudflare free** (prerequisite for Workers custom
   domains on this zone; subdomain-only delegation is CF-Enterprise): recreate
   the 4 GitHub Pages A records, `www` CNAME, and any MX/TXT records; switch
   nameservers at the registrar. GitHub Pages hosting unchanged.
3. **Cloudflare**: Workers custom domains under `demos.cloudcodetree.com`.

## Error handling

- Gate: fail closed (503) on JWKS outage; all auth failures are redirects, not
  error pages.
- Gallery: inline error on magic-link send failure (incl. rate-limit message);
  `next` validation as above.

## Testing

- `demo-gate`: vitest unit suite (the security-critical surface).
- Gallery: existing lint/type/build gates; manual flow test (sign up → launch →
  new tab demo; expired-cookie bounce).
- Demo CI: post-deploy unauthenticated 302 smoke check.

## Phasing

- **Phase 1 (this spec):** DNS migration, Supabase setup, demo-gate package,
  span-calculator demo, gallery page + nav.
- **Later (own specs if needed):** more demos (motion-expression, code_compare
  are near-free repeats of the recipe; server-backed apps like backlot are
  bigger), custom SMTP, per-user analytics.
