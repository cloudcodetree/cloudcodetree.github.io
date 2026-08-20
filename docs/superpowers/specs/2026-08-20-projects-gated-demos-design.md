# Projects Section with Auth-Gated Live Demos — Design

**Date:** 2026-08-20
**Status:** Approved (brainstorming session)
**Supersedes:** `2026-07-30-projects-demos-design.md` (never implemented)

## Goal

Add a **Projects** section to cloudcodetree.com:

- `/projects` — **public** gallery of cards summarizing each project.
- `/projects/<slug>` — **public** detail page: long-form write-up, source links,
  screen recordings, screenshots.
- `/projects/<slug>/demo/*` — **gated** live demo, reachable only by an
  authenticated visitor, enforced server-side.

Capture **who signs up and who opens which demo**, tied to a verified identity.

## Decisions

Settled during brainstorming; each replaces or extends the 2026-07-30 spec.

| Question | Decision |
|---|---|
| Where are demos served from? | **Move the whole site to Cloudflare Workers.** A single gateway Worker owns `/projects/*/demo/*`. GitHub Pages is retired. |
| What kind of demos? | **Static front-ends only.** Server-backed projects (DealFinder, backlot, homestead-finder) get detail pages with no demo button. |
| Where are analytics read? | **Supabase dashboard + saved SQL views.** No admin UI in Phase 1. |
| Identity + signup data | **Google OAuth + magic link**, plus a **skippable** one-time profile step (name, company, role). |
| Existing GitHub Pages demos | **Unpublish them.** The gated copy becomes the only URL. Redirect stubs where an old URL may be linked. |
| Screen recordings | **Cloudflare R2** (`cct-media`), free egress. |
| Demo build delivery | **Vendored into the site deploy** from pinned release artifacts. |
| Repo topology | **Separate repos**, pinned `artifact` version in the manifest, env-driven base paths. |

### Why Supabase (re-evaluated 2026-08-20)

The requirement is not "an auth provider" — it is **auth plus a SQL analytics
store**, because reading analytics was settled as saved SQL views. That
eliminates most of the field: Clerk, Auth0, Cognito, and Entra ID are auth-only,
so each would add a database vendor rather than remove one.

- **Cloudflare Access** — zero auth code and single-vendor, but **free for 50
  users**, then $7/user/month. A public signup funnel makes that a bill that
  scales with success. Rejected.
- **Cloudflare-native (D1 + OpenAuth/better-auth)** — appealing now that
  hosting is Cloudflare, and D1 has a SQL console. But it means owning token
  issuance, session lifecycle, and magic-link replay protection, and Cloudflare
  cannot send email, so magic links still need Resend — not actually
  single-vendor. Rejected for now; the strongest alternative if consolidation
  later outweighs owning security-critical code.
- **Firebase Auth** — best-in-class Google sign-in and Google sends the
  magic-link email, but Firestore is not SQL; the "whom" questions would need a
  BigQuery export and a second system. Fights the analytics decision. Rejected.
- **Cognito / Entra ID** — magic links need custom Lambda triggers or OTP user
  flows; heavy ops for a portfolio gate. Rejected.
- **Vercel** — no auth product, and we are not hosting there. Not applicable.

**Decision: Supabase.** The only option satisfying auth *and* the SQL analytics
decision on one free tier with no security-critical code to own.

**Amendment — keepalive.** Supabase free-tier projects pause after roughly a
week of inactivity, and a paused project means auth is down for the next
visitor. A portfolio site can genuinely go a week without a signup, so Phase 2
adds a scheduled GitHub Actions job issuing a trivial query to keep the project
warm. Confirm current pausing behavior when the project is created; $25/month
Pro removes the concern entirely if it becomes noisy.

### Why a single gateway instead of per-demo Workers

Cloudflare Workers Assets serves matching static files at the edge **without
invoking the Worker script**, which would bypass any gate. Setting
`run_worker_first: ["/api/*", "/projects/*/demo/*"]` inverts that for exactly
those paths: the Worker runs first and decides whether to return the asset.
Everything else stays edge-fast with zero Worker invocations.

Because the gate then exists exactly once, in this repo, the 2026-07-30 spec's
`@cloudcodetree/demo-gate` npm package and per-demo Cloudflare projects are
unnecessary and are dropped.

## Architecture

```
registrar → Cloudflare DNS  (migrated off Route53)
                │
cloudcodetree.com → Worker "cct-site"
  ├─ assets binding → ./out          ← edge-served, Worker never runs
  └─ run_worker_first:
       "/api/*"                      ← session endpoints
       "/projects/*/demo/*"          ← the gate
                │
  ┌─────────────┴──────────────┐
Supabase "cct-demos"      Cloudflare R2 "cct-media"
identity · profiles       recordings · screenshots
demo_events
```

### Routes

| Route | Access | Rendering |
|---|---|---|
| `/projects` | public | static — cards from `app/projects/manifest.ts` |
| `/projects/<slug>` | public | static — MDX long-form, chips, repo link, media, launch CTA |
| `/projects/<slug>/demo/*` | **gated** | Worker-served, verified per request |
| `/api/session` | — | Worker only: `POST` mints cookie, `DELETE` signs out |

`trailingSlash: true` exports the detail page to
`out/projects/<slug>/index.html`, so nothing Next generates occupies
`/projects/<slug>/demo/` — that subtree is free for the vendored demo build.

Sign-in is a **dialog on the detail page**, not a separate route, so the prompt
keeps the project's context and the redirect target is where the visitor was.

## Request lifecycle

1. Visitor clicks **Launch demo** on `/projects/<slug>`.
2. Signed out → dialog: *Continue with Google* / *email me a link*.
3. Supabase returns to `/projects/<slug>?next=/projects/<slug>/demo/`;
   `supabase-js` stores the session in `localStorage`.
4. Page `POST`s the access token to `/api/session`. The Worker verifies it
   against Supabase's JWKS and sets `cct_session` —
   `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`.
5. Navigate to the demo. Worker verifies the cookie, logs the open, serves.
6. On expiry (~1h) the Worker `302`s to `/projects/<slug>?signin=1&next=…`; the
   page silently refreshes via `supabase-js`, re-mints the cookie, and bounces
   back to `next`. Invisible unless the refresh token is also dead.
7. **Open-redirect guard:** `next` must be a same-origin path matching
   `^/projects/[a-z0-9-]+/demo/`.

### Design notes

- **The cookie holds the JWT itself**, not an opaque session ID. A JWT is
  self-verifying, so the Worker validates it with cached public keys and zero
  network calls — which matters when one demo page load fires ~30 gated asset
  requests. The cost is that sessions cannot be revoked early; they expire in an
  hour. Acceptable for a portfolio gate.
- **The cookie is `HttpOnly`,** so JavaScript cannot write it and `/api/session`
  must exist. That round trip buys XSS-proof sessions. This is a strict
  improvement over the 2026-07-30 design, which required a JS-readable
  cross-subdomain cookie and accepted the risk.
- **Asymmetric (ES256) JWT signing** is enabled on Supabase so the Worker
  verifies against public JWKS. **No Supabase secret is ever deployed to
  Cloudflare.**
- JWKS is cached per isolate. **JWKS unreachable → fail closed** (503), never
  fail open.

## Identity and data model

Supabase project **`cct-demos`**: magic link + Google, asymmetric signing on,
redirect allowlist `https://cloudcodetree.com/projects/*` and
`http://localhost:3000/projects/*`.

### `auth.users` (built in)

This *is* the signup log. `created_at` answers "how many signed up, when";
Google populates `raw_user_meta_data` with name and avatar. No capture code
needed.

### `profiles`

`user_id` (PK → `auth.users`), `full_name`, `company`, `role`,
`skipped boolean default false`, `created_at`.

RLS: a user may select/insert/update **only their own row**.

After first sign-in, a missing row triggers the skippable dialog. **Skip writes
`skipped = true`** so the visitor is never asked twice.

### `demo_events`

`id`, `user_id` (→ `auth.users`), `event`, `slug`, `created_at`, `country`,
`referrer`.

`event` is constrained to `'demo_open'` (a gated demo's entry document was
served) and `'profile_saved'`. Signups are **not** logged here — `auth.users`
already records them, and duplicating that invites the two to disagree.

RLS: **`insert` only**, `with check (user_id = auth.uid())`, and **no `select`
policy at all** — the table is write-only through the API.

The Worker writes events by calling PostgREST with **the visitor's own JWT**,
the one it just verified from the cookie. RLS enforces that a row's `user_id`
matches the token subject. Nobody can forge events for another user, and the
**service-role key never exists in Worker env**, so there is no
bypass-everything credential to leak. Reads happen in the Supabase dashboard,
authenticated separately as the site owner.

Two implementation requirements:

- **Log only on navigation requests** (`Sec-Fetch-Mode: navigate`, or a path
  ending `/demo/`). Otherwise one page load writes ~30 rows.
- **Wrap the write in `ctx.waitUntil()`** so a slow Supabase never delays
  serving the demo.

### Saved SQL views

Ship with the schema so the target questions are one click in the dashboard:

- `v_signups_daily` — count by day, split by provider.
- `v_demo_opens` — per-slug totals and unique viewers.
- `v_recent_activity` — `auth.users` ⋈ `profiles` ⋈ `demo_events`, newest
  first. The literal "whom" answer: email, name, company, which demo, when.

These views live in a private `analytics` schema that is **not** added to
Supabase's exposed-schema list, so PostgREST cannot reach them. This matters:
a view executes with its owner's privileges, so an API-reachable view over
`demo_events` would hand every signed-in visitor the read access the RLS
policy deliberately withholds. Queries run from the SQL editor, authenticated
as the owner.

## Gallery and detail pages

### Manifest — `app/projects/manifest.ts`

Curated and hand-maintained, the single source of truth, mirroring
`app/tutorials/manifest.ts`.

```ts
export interface ProjectMedia {
  type: 'video' | 'image';
  src: string;        // R2 URL
  caption: string;
}

export interface Project {
  slug: string;              // 'span-calculator'
  title: string;
  summary: string;           // 1–2 sentences, card copy
  tech: string[];            // chips
  repoUrl?: string;          // omitted for private repos
  externalUrl?: string;      // public link for ungated things
  demo?: {
    status: 'live' | 'coming-soon';
    artifact?: string;       // pinned release tag, e.g. 'v1.4.0'
  };
  cover: string;             // R2 URL
  media?: ProjectMedia[];
  featured?: boolean;
  order?: number;
}
```

`demo` present and `status: 'live'` means the gallery renders a launch button
and the deploy workflow vendors that artifact. The manifest is the only place
that knows whether a build arrived by release download or otherwise.

### Pages

- `/projects` — `ProjectsList` in the site's glass-card style, mirroring
  `TutorialsList` (cards, tech filter, per-page).
- `/projects/<slug>` — MDX at `app/projects/(detail)/<slug>/page.mdx` with
  `app/projects/(detail)/layout.tsx`, mirroring
  `app/tutorials/(article)/`. Reuses `mdx-components.tsx`, `<Callout>`, and the
  Shiki `CodeBlock`.
- Nav (`ClientLayout.tsx`) becomes **AI News · Tutorials · Projects · About**.
- `ProjectsPage.tsx` is rewritten: the fictional `featuredProjects` array and
  the live GitHub API repo fetch are **deleted** (rate limits, noise, and
  loading/error states all disappear; the page renders statically). A "more on
  GitHub →" footer button remains.

### Auth UI

- Signed out: **"Sign in to launch"** → dialog (Google button + email field →
  "check your inbox" state).
- Signed in: **"Launch demo"** → `POST /api/session`, then navigate.
- `?signin=1&next=` arrivals: silent refresh and redirect if a session exists,
  otherwise the dialog pre-wired to `next`.
- Account chip shows the signed-in email and a sign-out action.
- Env baked into the static build: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public by design; enforcement is in the
  Worker).

## Demo delivery

Demo repos stay independent. Each publishes its build as a release asset; this
repo's deploy workflow downloads the **pinned** tag from the manifest and
extracts it to `out/projects/<slug>/demo/`.

**A pinned artifact version in the manifest is a submodule pointer without the
git plumbing:** which demo version is live becomes a reviewable line in a diff,
`git revert` restores the previous demo, and site CI never installs a single
demo dependency. Submodules and a full monorepo were considered and rejected —
submodules for their ergonomics tax (detached HEAD, `submodules: recursive` in
CI, PATs for private repos, N toolchains per site deploy) and absorption for
losing the standalone repos as portfolio artifacts.

### Base paths

Gated demos serve from `/projects/<slug>/demo/`, so their assets must resolve
there. Demo repos must **not** hardcode that path:

- Prefer relative asset URLs (`base: './'` in Vite, `"homepage": "."` in CRA).
  Sufficient for any demo without history-mode client routing.
- Demos that do route on real paths read the base from an env var:
  `base: process.env.DEMO_BASE ?? '/'`, defaulting to standalone-correct and
  overridden only in the release build.

### Per-demo recipe

1. Set the base path per above.
2. Add a release workflow publishing `dist/` as `demo-build.tar.gz`.
3. **Disable GitHub Pages** for the repo; leave a redirect stub if the old URL
   may be linked; update README badges.
4. Add a manifest entry with `demo.artifact` pinned to the release tag.
5. Write the detail page MDX.

## Media

Cloudflare R2 bucket **`cct-media`**, served from a `media.cloudcodetree.com`
custom domain. `scripts/upload-project-media.mjs` mirrors the existing blog
image uploader. Media is never committed to the repo, consistent with the
standing rule for blog images.

## Build and deploy

New and changed files in this repo:

```
wrangler.jsonc                      # Worker + assets config
worker/
  index.ts                          # router: /api/*, /projects/*/demo/*
  auth.ts                           # JWKS fetch/cache, verify, cookie mint
  events.ts                         # PostgREST insert via visitor's own JWT
  *.test.ts                         # vitest
app/projects/
  manifest.ts
  page.tsx
  (detail)/layout.tsx
  (detail)/<slug>/page.mdx
app/components/
  ProjectsList.tsx  ProjectCard.tsx
  SignInDialog.tsx  ProfileDialog.tsx  LaunchDemoButton.tsx
app/lib/supabaseClient.ts
scripts/
  fetch-demo-artifacts.mjs          # manifest → gh release download → out/
  upload-project-media.mjs          # R2
```

```jsonc
// wrangler.jsonc
{
  "name": "cct-site",
  "main": "worker/index.ts",
  "assets": {
    "directory": "./out",
    "binding": "ASSETS",
    "run_worker_first": ["/api/*", "/projects/*/demo/*"]
  },
  "vars": { "SUPABASE_URL": "…", "SUPABASE_ANON_KEY": "…" },
  "routes": [{ "pattern": "cloudcodetree.com", "custom_domain": true }]
}
```

`.github/workflows/deploy.yml` becomes: `prebuild feeds` → `next build` →
`node scripts/fetch-demo-artifacts.mjs` → `wrangler deploy`. The gh-pages
publish step and `pnpm run deploy` are retired. The `rehost-images` job is
unchanged. New secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## Error handling

- Auth failures are **redirects**, never error pages.
- JWKS unreachable → **fail closed**, brief 503.
- Event-logging failures are swallowed inside `ctx.waitUntil()` and never affect
  the response.
- Magic-link send failure → inline error in the dialog, including the
  rate-limit case.
- `next` values failing the guard are discarded and the visitor lands on
  `/projects/<slug>`.

## Testing

Worker vitest suite carries the security weight:

- valid token serves the asset;
- expired, forged, and missing tokens each `302` to the detail page;
- JWKS unreachable returns 503 (fail closed), never serves;
- `next` outside `^/projects/[a-z0-9-]+/demo/` is rejected;
- a navigation request logs exactly one event; sub-asset requests log none.

Plus: existing lint/type/build gates; a post-deploy CI smoke check that an
unauthenticated `curl -I` of the pilot demo returns `302`; and a manual pass
over Google sign-in, magic link, profile skip, and the expiry bounce.

## Phasing

**Cloudflare gives every Worker a free `*.workers.dev` origin, and this design's
cookie is same-origin — so the entire system, gate included, can be built and
verified on `workers.dev` while cloudcodetree.com keeps serving from GitHub
Pages, untouched.** DNS moves last, after everything is proven, as its own
phase. Each phase ships independently.

| Phase | Ships | cloudcodetree.com affected? |
|---|---|---|
| **0 · Workers staging** | `wrangler.jsonc`, pass-through Worker, deploy to `cct-site.<sub>.workers.dev`, parity verified against Pages | **No** |
| **1 · Public gallery** | manifest, `/projects`, detail MDX pages, nav update, R2 media — built and verified on staging | No |
| **2 · Gate** | Supabase, Google OAuth, `/api/session`, Worker gate, `demo_events` + views, profile dialog, pilot demo (span-calculator) — verified on staging | No |
| **3 · Cutover** | DNS Route53 → Cloudflare, custom domain, Pages retired, pilot demo's Pages unpublished | **Yes** — the only phase that touches it |
| **4 · More demos** | repeat the per-demo recipe | Yes |

Phase 3 is isolated deliberately: it is the only step whose blast radius is the
entire site, it ships **no new code**, and by the time it runs every behavior it
switches over has already been observed working on staging.

The implementation plan should break at these phase boundaries. Phase 4 is a
documented recipe, not a plan.

## Verification before cutover

### Staging hygiene

- **`assetPrefix` must become environment-driven.** It currently hardcodes
  `https://cloudcodetree.com` in `next.config.js`, which would make a staging
  build pull its assets from production and silently invalidate every parity
  check. The staging build sets it to the `workers.dev` origin or empty.
- **Two asset-routing options are required for GitHub Pages parity:**
  `not_found_handling: "404-page"` so unmatched paths serve `public/404.html` as
  Pages does (the default, `"none"`, returns a bare 404), and
  `html_handling: "force-trailing-slash"` to match Pages' `/about` → `/about/`
  redirect, consistent with `trailingSlash: true`.
- **Staging must not be indexed.** The staging build appends a site-wide
  `X-Robots-Tag: noindex, nofollow` rule to `out/_headers`, so the staging
  origin cannot compete with production in search. Doing this in `_headers`
  rather than in the Worker is deliberate: the Worker runs only for
  `run_worker_first` paths and asset misses, so a Worker-set header would miss
  every ordinary page. A build-time rule covers every response with zero Worker
  invocations, and production simply never runs that step.
- Supabase redirect allowlist and the Google OAuth authorized-redirect URIs must
  list the staging origin alongside production and `localhost:3000`.

### Parity gate (Phase 0 exit criteria)

A script walks every path in the generated `sitemap.xml`, plus `/feed.xml`,
`/robots.txt`, `/sitemap.xml`, the `/blog` and `/blog/<id>` redirect stubs, the
legacy `/resume`, `/contact`, `/schedule` stubs, and a known-missing path, and
compares production against staging. **Cutover does not proceed until:**

- every path returns the same status code from both origins;
- HTML bodies match once the origin hostname is normalized;
- trailing-slash behavior is identical (`/about` → `/about/` on both);
- the 404 path serves the same `404.html`;
- `feed.xml`, `sitemap.xml`, and `robots.txt` are byte-identical after
  hostname normalization.

The blog is 500+ prerendered articles, so this is a real crawl, not a spot
check — and it is exactly the kind of check that catches a Workers Assets
path-resolution difference that a handful of manual clicks would miss.

### Gate verification (Phase 2 exit criteria)

Beyond the vitest suite, observed on the staging origin in a real browser:

- signed out, `curl -I` of the demo path returns `302` and **no demo bytes**;
- Google sign-in and magic link each reach the demo;
- the profile dialog appears once, and **Skip** prevents it reappearing;
- a `demo_open` row lands in `demo_events` with the right `user_id` and `slug`,
  and exactly one row per page load — not thirty;
- an expired cookie bounces through the silent refresh without the visitor
  noticing (force it by shortening `Max-Age`);
- a hand-crafted `next=https://evil.example/` is rejected;
- with JWKS blocked, the demo returns 503 and never serves.

### Cutover procedure (Phase 3)

1. **Lower Route53 TTLs to 300s at least a day ahead** so rollback propagates in
   minutes rather than hours. This is the single highest-leverage step and it
   must happen *before* cutover day, not during it.
2. Inventory the existing zone — 4 A records, `www` CNAME, MX, TXT (SPF/DKIM,
   domain verification) — and recreate every record in Cloudflare **before**
   touching nameservers. Missing MX records silently break mail.
3. Add the custom domain to the Worker; switch nameservers at the registrar.
4. Smoke-check the parity script against the real hostname.
5. Remove the GitHub Pages custom domain and the `CNAME` file so GitHub holds no
   dangling claim on the hostname.
6. **Keep the `gh-pages` branch and its workflow intact but disabled for two
   weeks.** Rollback is then: re-enable the workflow, point nameservers back.
7. Unpublish the pilot demo's own GitHub Pages deployment **only after** the
   gated copy is confirmed live on the real domain — not before.

## Risks and open items

1. ~~`run_worker_first` accepting an array of route patterns~~ — **RESOLVED
   2026-08-20.** Cloudflare documents the option as `boolean | string[]`, with
   `*` glob and `!` exception patterns; patterns must begin with `/` or `!/`.
   The single-gateway design is sound.
2. **`public/_headers` becomes live on Workers and is currently wrong.** GitHub
   Pages ignores `_headers` entirely, so this file has never been enforced.
   Workers Assets supports it natively, so migrating switches on a never-tested
   policy. As written it would (a) break `/about/schedule`, whose widget loads
   from `https://assets.calendly.com` — absent from `script-src`; and (b) apply
   `Cache-Control: no-cache, no-store` to `/*`, disabling caching for every
   content-hashed Next.js bundle. Rewrite it in Phase 0; Phase 2 must extend
   `connect-src` to reach Supabase and Google. The `/assets/*` rule is dead
   Vite-era config — Next serves `/_next/static/*`.
3. `public/sw.js` is **registered nowhere** in the app, so there is no stale
   service worker to invalidate at cutover. Left in place; deleting it is
   unrelated cleanup.
4. **DNS cutover** — recreate 4 GitHub Pages A records, the `www` CNAME, and any
   MX/TXT records. Afterward remove the Pages custom domain and the `CNAME` file
   so GitHub holds no dangling claim on the hostname.
5. **Google OAuth** uses only `email`/`profile` — non-sensitive scopes, so
   production publishing should not need verification review. Confirm on the
   consent screen rather than assume.
6. **Supabase built-in SMTP is rate-limited** on the free tier (single-digit
   emails/hour). Acceptable at portfolio scale, and Google sign-in bypasses it.
   Custom SMTP (e.g. Resend) is the upgrade path.
7. **Workers free tier is 100k requests/day**; one demo page load is ~30 gated
   requests. Comfortable, but that is the multiplier.
8. `assetPrefix` in `next.config.js` hardcodes `https://cloudcodetree.com`.
   It must become environment-driven before staging is meaningful — see
   *Verification before cutover*.
9. An hour-long cookie means a long demo session will hit the silent refresh.
   Test that path explicitly.

## Superseded by this spec

From `2026-07-30-projects-demos-design.md`:

- `@cloudcodetree/demo-gate` npm package and its repo — **dropped**, the gate
  lives once in this repo.
- Per-demo Cloudflare Workers and `*.demos.cloudcodetree.com` subdomains —
  **dropped**.
- The JS-readable cross-subdomain cookie and its accepted risk — **dropped** in
  favor of a same-origin `HttpOnly` cookie.
- Magic-link-only identity — **extended** with Google OAuth.
- "Per-user analytics: later" — **now in scope** (Phase 2).

Also retired: the `gh-pages` branch, `pnpm run deploy`, and `ProjectsPage.tsx`'s
`featuredProjects` array and GitHub API fetch. `CLAUDE.md` needs its Deployment,
Navigation, and Project Structure sections rewritten, plus a new Projects
section.

## Out of scope

- Server-backed live demos (DealFinder, backlot, homestead-finder). They get
  detail pages only. A live demo for any of them needs its own spec.
- An owner-facing analytics UI. Reads happen in the Supabase dashboard.
- PostHog or any third-party analytics. The Postgres table is the durable
  source of truth if a richer surface is ever added.
- Custom SMTP.
- Tutorial companion repos, which remain under `/tutorials`.
