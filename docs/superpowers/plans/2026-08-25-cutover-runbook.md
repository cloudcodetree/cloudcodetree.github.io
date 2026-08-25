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

## Execution order

1. **Merge to main.** The redesign, Projects, gate, and workflows ship to the
   repo; gh-pages keeps publishing, so cloudcodetree.com serves the NEW
   design from GitHub Pages… no wait — it serves whatever main builds, which
   includes the redesign. If the redesign should NOT go live pre-cutover,
   do steps 2–6 first and merge last. Owner's call; both orders work.
2. **CI credentials** (once): create a Cloudflare API token (Workers
   Scripts:Edit + R2:Edit), add repo secrets CLOUDFLARE_API_TOKEN /
   CLOUDFLARE_ACCOUNT_ID, set repo variable ENABLE_WORKER_DEPLOY=true.
3. **First production Worker deploy** (via CI on main, or locally:
   `pnpm run build && node scripts/fetch-demo-artifacts.mjs &&
   npx wrangler deploy`). Verify at cct-site.chris-247.workers.dev:
   parity contract + the four demo 302s + legacy-path 301s.
4. **Attach custom domains to the Worker** (Cloudflare dash → cct-site →
   Domains & Routes): `cloudcodetree.com` AND `www.cloudcodetree.com`
   (www's CNAME dies with Pages — attaching it here is the fix).
   Both show "pending" until nameservers move — that's expected.
5. **Update Supabase auth config** for production:
   `node scripts/configure-auth.mjs` after editing its site_url to
   https://cloudcodetree.com (keep staging + localhost in the allow list),
   and add `https://cloudcodetree.com` to the Google client's authorized
   redirect... (not needed: Google's redirect URI is the Supabase callback,
   unchanged). Flip GOOGLE/GitHub/LinkedIn nothing — provider config is
   origin-independent.
6. **Verify Route53 TTLs are still 300** on the four A records + www.
7. **OWNER: switch nameservers at the registrar** to
   henrik.ns.cloudflare.com / meg.ns.cloudflare.com.
8. **Watch it land** (minutes): zone goes active; run
   `node scripts/check-parity.mjs --origin https://cloudcodetree.com --sweep`;
   click one gated demo end-to-end; `curl -I http://cloudcodetree.com`
   (expect 301 https); check www.
9. **Retire Pages**: remove the custom domain from the repo's Pages settings;
   delete public/CNAME; set the five project repos' Pages OFF
   (span-calculator, motion-expression, code_compare, backlot, sheetwise);
   delete the gh-pages `deploy` job from deploy.yml. Keep the gh-pages
   branch two weeks as rollback ballast, then delete.
10. **After-cutover hygiene** (non-blocking): DKIM TXT once generated;
    OpenTofu import of the zone (needs a token with Zone/DNS edit — the
    import makes `tofu plan` prove no-changes against live DNS);
    CLAUDE.md deployment section rewrite; delete `pnpm run deploy` script.

## What the cutover cannot break (verified)

Feeds (URLs + GUIDs identical), article/tutorial URLs, search canonicals,
inbound mail (MX recreated, SPF/DMARC only add), bookmarks. Losses are
scoped to: cloudcodetree.github.io (accepted), and the five legacy Pages
paths — which now 301 to their successors.
