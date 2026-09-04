# Infrastructure (OpenTofu)

Owns account-level state: the Cloudflare zone and DNS records, R2 buckets,
the Worker's custom domain, the Supabase project and auth settings, the
Google OAuth client, and GitHub Actions secrets. Matches the homestead.deals
OpenTofu setup.

**Does NOT own the Worker itself.** The script, its assets, and everything
under `assets` in `wrangler.jsonc` (`_headers`, `html_handling`,
`not_found_handling`, `run_worker_first`, bindings) belong to wrangler.
`cloudflare_workers_script` *can* manage them — which is exactly why the rule
needs stating: two writers on one resource produce drift, and the AI News
routine deploys content daily.

The database schema, RLS policies, and views will be SQL migrations under
`supabase/migrations/` (Phase 2). Forced, not preferred: the Supabase
provider has no resource for tables, policies, or views.

## Phase plan

- **Phase 0 (now):** walking skeleton, local state, zero resources.
- **Phase 1:** `r2.tf` — the `cct-media` bucket.
- **Phase 2:** `supabase.tf`, `google_oauth.tf`, `github.tf`.
- **Phase 3:** `dns.tf` + `worker.tf` — the zone and its 11 records arrive via
  `import` blocks (the zone already exists, scanned from Route53), so
  `tofu plan` proves no-changes against reality before cutover. The zone
  settings applied 2026-08-20 (`always_use_https=on`, `min_tls_version=1.2`)
  get imported then too.

## Use

    cd infra
    export CLOUDFLARE_API_TOKEN=...   # only needed once resources exist
    tofu init
    tofu validate
    tofu plan
