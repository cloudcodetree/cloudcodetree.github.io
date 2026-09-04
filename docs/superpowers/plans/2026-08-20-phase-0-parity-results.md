# Phase 0 — Parity Gate Results

**Date:** 2026-08-20 (evening run)
**Staging:** https://cct-site-staging.chris-247.workers.dev (version `97c01580`)
**Production:** https://cloudcodetree.com (GitHub Pages, untouched)
**Tool:** `node scripts/check-parity.mjs --origin <url> [--sweep]`

## Results

| Check | Production | Staging |
|---|---|---|
| Contract (20 cases) | ✓ 20/20 | ✓ 20/20 |
| Sitemap sweep (own sitemap) | ✓ 731/731 at 200 | ✓ 626/626 at 200 |
| `X-Robots-Tag: noindex` | absent (correct) | present (correct) |
| Prod-prefixed asset refs in HTML | n/a | 0 (correct) |
| `/projects/*/demo/` gate path | n/a | 404 via Worker (`run_worker_first` array deployed) |
| `/_next/static/*` Cache-Control | Pages defaults | `public, max-age=31536000, immutable` |
| Browser check `/about/schedule/` | — | renders, **zero console errors** (screenshot in session) |
| Browser check `/about/contact/` | — | renders; only pre-existing a11y nit (form field id/name) |

## Contract calibration notes

- `/about` (bare): Pages 301 vs Workers 307 — accepted as `[301, 307, 308]`.
  Canonical tags + trailing-slash sitemap URLs carry canonicalization; recorded
  in `KNOWN_DIFFERENCES`.
- `/404.html`: Workers normalizes the extension (307 → `/404/`); Pages serves
  200. Real misses serve the identical 404 page on both (asserted).
- Transient 503s: GitHub Pages sheds load under an 8-concurrent burst — 41
  URLs 503'd in-sweep, every one 200 fetched alone. Workers served the same
  burst clean. Sweep now retries 503/429 with backoff.
- Sweep uses the origin's **own** sitemap. Local tree vs production content
  drift is real and bidirectional: prod has ~105 daily-routine blog posts this
  branch predates; this branch has 37 DealFinder tutorial parts prod lacks.

## Deviations from the written plan

- Deploy happened via local `wrangler login` OAuth (Task 6's CI workflow and
  API token deferred — no machine deploys needed yet).
- OpenTofu (not Terraform), local state (R2 backend commented, ready to flip).
  Zero resources by design; `tofu plan` = no changes.
- 33-CSP-violation blank-page failure mode found and fixed before this run
  (production-prefixed assets + enforced CSP); the browser check exists
  because the contract structurally cannot catch it.

## Verdict

**Phase 0 exit criteria met.** Workers serves the site identically to GitHub
Pages within documented, reasoned differences. Phase 1 (public gallery) is
unblocked. cloudcodetree.com remains on GitHub Pages; deploy.yml untouched.

**Open item:** staging currently serves the `draft/dealfinder` working tree,
which includes 37 unpublished tutorial parts (noindex'd, obscure URL, but
public). Decide: leave, take down, or redeploy from a main-based build.
