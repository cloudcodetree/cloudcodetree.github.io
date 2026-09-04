# Cutover runbook — cloudcodetree.com → Cloudflare Worker

Everything below EXCEPT step 7 is preparation that changes nothing visible.
Step 7 — switching nameservers at the registrar — is the owner's trigger.
Rollback at any point: re-point nameservers at Route53 (TTLs are 300s;
propagation is minutes) and re-enable the gh-pages workflow.

## Already done (verified on staging)

- Parity: contract 20/20 both origins; sweep all-200 against each origin's
  own sitemap. Staging noindex; production build variant carries no noindex.
- Zone exists in Cloudflare (pending), 11 records verified against Route53;
  MX unproxied; SPF + DMARC staged; `always_use_https on`, TLS 1.2.
- All four app demos vendored + gated (302, zero bytes signed-out);
  `_redirects` 301s every legacy Pages path, bare + splat forms.
- Auth E2E proven (Google + GitHub + LinkedIn + magic link); analytics rows
  landing; keepalive cron committed (arms on merge to main).
- deploy.yml has the production Worker job, gated on repo variable
  `ENABLE_WORKER_DEPLOY` — inert until secrets + variable exist.

## Execution order — staged so the switch is a toggle, not a leap

The nameserver change happens EARLY, while it changes nothing visible; the
actual move to the Worker happens LAST, as an instantly-reversible route.

1. **Merge to main** (owner's call on timing — merging puts the redesign live
   on GitHub Pages ahead of the platform switch; merging later keeps the old
   site untouched until step 6. Both orders work).
2. **CI credentials** (once): Cloudflare API token (Workers Scripts:Edit +
   R2:Edit) → repo secrets CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID,
   repo variable ENABLE_WORKER_DEPLOY=true.
3. **First production Worker deploy** (CI on main, or locally:
   `pnpm run build && node scripts/fetch-demo-artifacts.mjs && npx wrangler deploy`).
   Verify at cct-site.chris-247.workers.dev: parity contract, four demo 302s,
   legacy-path 301s.
4. **OWNER: switch nameservers** at the registrar to
   henrik.ns.cloudflare.com / meg.ns.cloudflare.com — while the Cloudflare
   zone still points at GitHub Pages (verified replica; ssl=full;
   always_use_https=on). The site serves byte-identically through the
   Cloudflare proxy. Verify: zone goes active; site unchanged; mail records
   answering (`dig MX cloudcodetree.com @henrik.ns.cloudflare.com`).
   Rollback: NS back to Route53 (TTLs 300s — verify they still are, first).
5. **Subdomain dress rehearsal**: attach `beta.cloudcodetree.com` as a
   custom domain on the cct-site Worker (zone is active now, so it works).
   Add https://beta.cloudcodetree.com/projects/* to the Supabase redirect
   allowlist (scripts/configure-auth.mjs). Then run the FULL checklist on
   beta: parity contract + sweep, sign-in E2E on a real-domain origin, gated
   demo end-to-end, legacy-path 301s, http→https. This is production in
   everything but name.
6. **Apex flip — the toggle**: add Worker routes `cloudcodetree.com/*` and
   `www.cloudcodetree.com/*` → cct-site (routes overlay the proxied A/CNAME
   records; no DNS edits). Instantly live. Rollback: delete the routes —
   traffic falls back to the proxied GitHub Pages origin in seconds, DNS
   untouched. Update Supabase site_url to https://cloudcodetree.com.
7. **Verify on the real domain**: parity + sweep against
   https://cloudcodetree.com; one gated demo E2E; www; http→https;
   feeds byte-identical.
8. **Retire the old path** (after a comfortable soak): remove the Pages
   custom domain + public/CNAME; Pages OFF on the five project repos;
   delete the gh-pages deploy job; keep the gh-pages branch two weeks.
   Optionally convert the routes to proper Worker custom domains (cosmetic).
   Remove `beta` or keep it as a persistent pre-prod alias (recommended:
   keep — future redesigns get a real-domain rehearsal for free).
9. **After-cutover hygiene** (non-blocking): DKIM TXT once generated;
   OpenTofu zone import (tofu plan proving no-changes against live DNS);
   CLAUDE.md deployment rewrite; drop `pnpm run deploy`.

## What the cutover cannot break (verified)

Feeds (URLs + GUIDs identical), article/tutorial URLs, search canonicals,
inbound mail (MX recreated, SPF/DMARC only add), bookmarks. Losses are
scoped to: cloudcodetree.github.io (accepted), and the five legacy Pages
paths — which now 301 to their successors.

## Status — 2026-09-04

- **Step 1 (merge): DONE.** `draft/dealfinder` merged to `main` via PR #1
  (`c4622f76`) after reconciling 215 routine commits (conflicts only in
  `.gitignore`, `package.json`, `pnpm-workspace.yaml`; resolved as supersets).
  The PR's CI build (Linux, pnpm 10, frozen lockfile) was green before merging.
  The routine's own pipeline (`pnpm install --frozen-lockfile` → `ingest-feed`
  → `validate-blog` → `validate-research-log`) was run on the merged tree:
  no-op, all green. Supabase keepalive dispatched from `main`: succeeded.
- **Step 3 (prod Worker deploy): DONE** from the merged tree — version
  `1d4face3…`, parity contract 20/20 on `cct-site.chris-247.workers.dev`,
  gate 302 / legacy 301 / CSP present. No routes attached yet.
- **Step 5 (beta): re-verified** on the merged tree — contract 20/20, sweep
  850/850, and a fresh-visitor demo request lands on the public landing page
  with the sign-in dialog (GitHub / Google / LinkedIn / magic link).
- **Step 2 (CI credentials): BLOCKED on a Cloudflare API token.** The MCP
  session cannot mint tokens (error 9109) and this session could not set repo
  secrets directly. Once `CLOUDFLARE_API_TOKEN` is in `.env`,
  `node scripts/set-ci-secrets.mjs` verifies it and sets both secrets plus
  `ENABLE_WORKER_DEPLOY=true`. Prove it with one push to `main` and a new
  version on `wrangler deployments list`.
- **Step 6 (apex flip): HELD until step 2 is proven**, so the routine's next
  push can never land on a dead origin. The flip itself: add
  `{ "pattern": "cloudcodetree.com/*", "zone_name": "cloudcodetree.com" }` to the
  prod `routes` in `wrangler.jsonc`, `pnpm run deploy:prod`, then
  `node scripts/configure-auth.mjs --site-url https://cloudcodetree.com`, then
  purge the zone cache. **Do not route `www` yet**: the Worker only runs for
  `run_worker_first` paths, so a `www` route would serve duplicate content.
  GitHub Pages keeps answering `www` with its 301 to the apex until the zone
  gets a Single Redirect rule (`http.host eq "www.cloudcodetree.com"` → 301
  `concat("https://cloudcodetree.com", http.request.uri.path)`, query
  preserved) — creating that rule was blocked in this session; add it in the
  dashboard or via OpenTofu, and only then retire the Pages custom domain.
- **Step 8 facts:** only `code_compare` and `backlot` still have Pages sites;
  `span-calculator`, `motion-expression`, `sheetwise` have none to turn off.
