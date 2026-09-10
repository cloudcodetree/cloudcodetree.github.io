# Infrastructure (OpenTofu)

Owns the Cloudflare zone `cloudcodetree.com` — the zone itself, its DNS
records, its settings, the www→apex redirect rule — and the R2 bucket that
holds the blog images. Local state, single operator. Since the Route 53
hosted zone was deleted (2026-09-05) this configuration is the only copy of
the DNS outside Cloudflare, which is the point of it.

**Does NOT own** (two writers on one object produce drift):

- the Worker `cct-site` / `cct-site-staging`: script, assets, routes, and the
  `beta.cloudcodetree.com` custom domain (its AAAA record) — `wrangler.jsonc`
- the R2 custom domain `img.cloudcodetree.com` and the CNAME it creates — the
  provider cannot import it (see `r2.tf`); it was attached with wrangler
- Supabase (auth settings live in `scripts/configure-auth.mjs`, schema in
  `supabase/migrations/`), the OAuth clients, GitHub Actions secrets
  (`scripts/set-ci-secrets.mjs`)

## Files

| File | Contents |
|---|---|
| `zone.tf` | `cloudflare_zone` + settings (always_use_https, automatic_https_rewrites, ssl=full, min_tls 1.2) |
| `dns.tf` | Proxied apex AAAA placeholder (`100::`) for the Worker route, CNAME www, MX ×6, TXT SPF / DMARC / DKIM |
| `redirects.tf` | the `http_request_dynamic_redirect` ruleset: www → apex 301 |
| `r2.tf` | bucket `cct-blog-images` |
| `imports.tf` | one `import` block per resource, so a fresh checkout rebuilds state instead of re-creating anything |

## Use

The provider reads `CLOUDFLARE_API_TOKEN` from the environment. The wrapper
loads it from `.env` so it never has to be exported or pasted:

    node scripts/tofu.mjs init
    node scripts/tofu.mjs plan      # "No changes" is the healthy answer
    node scripts/tofu.mjs apply

Everything after the script name goes to `tofu` verbatim.

- **Drift check:** `plan` against a healthy zone prints `No changes`. Anything
  else means someone changed DNS or a setting in the dashboard — decide
  whether the config or the dashboard is right, then apply or edit.
- **Fresh checkout, no state:** `init` then `apply` — the `import` blocks
  pull every resource into state; nothing is created.
- **Adding a record:** add the resource, `plan`, `apply`. No import block is
  needed for new resources.
- The token needs: Zone Read, DNS Edit, Zone Settings Edit, Single Redirect
  Edit, Workers R2 Storage Edit (the CI token has all of them).

State is local and gitignored (`terraform.tfstate*`, `.terraform/`,
`.terraform.lock.hcl`). Shared state (an R2 backend) is sketched in
`backend.tf` for when a second operator or CI applies appear.
