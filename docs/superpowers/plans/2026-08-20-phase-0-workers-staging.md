# Phase 0 — Workers Staging & Parity Gate: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Serve the existing site from a Cloudflare Worker on a `workers.dev` staging origin and prove, with an automated contract test, that it behaves identically to the live GitHub Pages site — without touching cloudcodetree.com.

**Architecture:** A single Worker (`cct-site`) binds `./out` — the same static export `next build` already produces — as static assets. Ordinary pages are served at the edge without invoking Worker code; the handler is a pass-through that exists to establish config, tests, and deployment. A staging build variant makes assets self-referencing and marks the origin `noindex`. A parity script asserts an explicit behavioral contract against both origins.

**Tech Stack:** Cloudflare Workers Static Assets, Wrangler 4.x, Vitest (plain Node pool), Terraform 1.9+ with `cloudflare/cloudflare ~> 5.23`, Next.js 15 static export, pnpm 10, Node 22 (CI).

**Spec:** `docs/superpowers/specs/2026-08-20-projects-gated-demos-design.md`

## Global Constraints

- **cloudcodetree.com must not be affected by any task in this phase.** No DNS change, no custom domain, no change to `.github/workflows/deploy.yml`'s gh-pages deploy path.
- **Terraform must never declare anything inside the Worker** — not `assets`, not `assets.config`, not `run_worker_first`, not bindings. `wrangler.jsonc` is the single source of truth for those. (Spec: *Infrastructure as Code → Dual-write rule*.)
- Asset routing options required for GitHub Pages parity: `not_found_handling: "404-page"` and `html_handling: "force-trailing-slash"`.
- `run_worker_first` is `["/api/*", "/projects/*/demo/*"]` from the start. Those paths 404 until Phase 2; declaring them now proves the config deploys.
- Staging asset URLs must be **relative**. Production keeps `https://cloudcodetree.com`.
- Package manager is **pnpm**. CI uses Node 22 and pnpm 10.
- Commit after every task. Do not squash tasks together.

---

### Task 1: Wrangler config, pass-through Worker, and test harness

**Files:**
- Create: `wrangler.jsonc`, `worker/index.ts`, `worker/index.test.ts`, `worker/tsconfig.json`, `vitest.config.ts`
- Modify: `tsconfig.json` (exclude `worker`), `package.json` (devDeps + scripts)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `worker/index.ts` default export `{ fetch(request: Request, env: Env): Promise<Response> }`, and `export interface Env { ASSETS: Fetcher; PRODUCTION_HOSTNAME: string }`. Task 7 deploys this. Phase 2 replaces the body of `fetch`.

- [ ] **Step 1: Install dev dependencies**

```bash
pnpm add -D wrangler @cloudflare/workers-types vitest
pnpm exec wrangler --version   # expect 4.x
```

We deliberately do **not** use `@cloudflare/vitest-pool-workers`. It would require a built `out/` directory to exist before tests run. The Worker's logic is testable with a stubbed `ASSETS` fetcher on the plain Node pool, which is faster and has no build dependency. Revisit only if Phase 2 needs a real Workers runtime API.

- [ ] **Step 2: Write the failing test**

Create `worker/index.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import worker, { type Env } from './index';

function stubEnv() {
  const assetFetch = vi.fn(async (_request: Request) =>
    new Response('<!doctype html><title>ok</title>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }),
  );
  const env = {
    ASSETS: { fetch: assetFetch },
    PRODUCTION_HOSTNAME: 'cloudcodetree.com',
  } as unknown as Env;
  return { env, assetFetch };
}

describe('pass-through worker', () => {
  it('returns the asset response unchanged', async () => {
    const { env } = stubEnv();
    const res = await worker.fetch(new Request('https://cloudcodetree.com/about/'), env);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<title>ok</title>');
  });

  it('forwards the request to the assets binding verbatim', async () => {
    const { env, assetFetch } = stubEnv();
    const request = new Request('https://cloudcodetree.com/projects/span-calculator/demo/');
    await worker.fetch(request, env);
    expect(assetFetch).toHaveBeenCalledTimes(1);
    expect(assetFetch.mock.calls[0][0]).toBe(request);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Create `vitest.config.ts` first (the runner needs somewhere to look):

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['worker/**/*.test.ts', 'scripts/**/*.test.mjs'],
    environment: 'node',
  },
});
```

Add to `package.json` `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck:worker": "tsc -p worker/tsconfig.json"
```

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./index"`.

- [ ] **Step 4: Write the minimal implementation**

Create `worker/index.ts`:

```ts
/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ASSETS: Fetcher;
  /** Canonical production hostname. Any other hostname is a staging origin. */
  PRODUCTION_HOSTNAME: string;
}

/**
 * Phase 0: pass-through.
 *
 * This handler runs for only two kinds of request:
 *   1. paths matched by `run_worker_first` — the /api and per-demo routes —
 *      which have no assets behind them until Phase 2 and so 404 for now;
 *   2. requests matching no static asset, where deferring to ASSETS applies
 *      `not_found_handling: "404-page"` and returns public/404.html.
 *
 * Every ordinary page is served at the edge without invoking this code.
 */
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
```

Create `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "cct-site",
  "main": "worker/index.ts",
  "compatibility_date": "2026-08-20",
  "assets": {
    "directory": "./out",
    "binding": "ASSETS",
    // Matches GitHub Pages' /about -> /about/ redirect; consistent with
    // trailingSlash: true in next.config.js.
    "html_handling": "force-trailing-slash",
    // Serve public/404.html on a miss, as Pages does. The default ("none")
    // would return a bare 404 and break parity.
    "not_found_handling": "404-page",
    // These paths 404 until Phase 2. Declared now so the array form is proven
    // to deploy before anything depends on it.
    "run_worker_first": ["/api/*", "/projects/*/demo/*"]
  },
  "observability": { "enabled": true },
  "vars": { "PRODUCTION_HOSTNAME": "cloudcodetree.com" },
  "env": {
    "staging": {
      "name": "cct-site-staging",
      "vars": { "PRODUCTION_HOSTNAME": "cloudcodetree.com" },
      "assets": {
        "directory": "./out",
        "binding": "ASSETS",
        "html_handling": "force-trailing-slash",
        "not_found_handling": "404-page",
        "run_worker_first": ["/api/*", "/projects/*/demo/*"]
      }
    }
  }
}
```

The `env.staging` block repeats `assets` and `vars` deliberately — Wrangler does not inherit every key into named environments, and a silently-empty `assets` block on staging would be a confusing failure. Step 6 verifies the resolved config.

Create `worker/tsconfig.json` (the root config targets the browser; Worker code must not see DOM types):

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "lib": ["esnext"],
    "types": ["@cloudflare/workers-types"],
    "noEmit": true
  },
  "include": ["**/*.ts"]
}
```

Modify `tsconfig.json` — change the `exclude` array so `next build` does not type-check Worker code with DOM libs:

```json
"exclude": ["node_modules", "worker"]
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS, 2 tests.

Run: `pnpm run typecheck:worker`
Expected: no output, exit 0.

- [ ] **Step 6: Verify the Wrangler config resolves for both environments**

```bash
pnpm exec wrangler deploy --dry-run
pnpm exec wrangler deploy --env staging --dry-run
```

Expected: both succeed and print the resolved config. Confirm in the output that **`run_worker_first` lists both patterns** and that the **staging run reports an assets directory**. If staging shows no assets binding, the `env.staging.assets` block is not being read — fix it before continuing; every later task depends on staging serving assets.

`./out` may not exist yet. If wrangler errors on the missing directory, run `pnpm run build` first.

- [ ] **Step 7: Verify the site serves locally**

```bash
pnpm run build
pnpm exec wrangler dev --env staging
# in another shell:
curl -sI http://localhost:8787/about/ | head -1        # expect 200
curl -sI http://localhost:8787/about  | head -2        # expect 301 -> /about/
curl -sI http://localhost:8787/nope/  | head -1        # expect 404
curl -s  http://localhost:8787/nope/  | grep -c "404"  # expect >0 (404.html served)
```

**Note:** `next build` and `wrangler dev` both use `./out`. Per project convention, after any production build, `rm -rf out` and restart `pnpm run dev` before returning to Next dev-server work.

- [ ] **Step 8: Commit**

```bash
git add wrangler.jsonc worker/ vitest.config.ts tsconfig.json package.json pnpm-lock.yaml
git commit -m "feat(worker): pass-through Cloudflare Worker serving the static export

Binds ./out as static assets with 404-page and force-trailing-slash
handling to match GitHub Pages. Declares run_worker_first for the Phase 2
gate paths now so the array form is proven to deploy. Worker code is
type-checked separately from the app so it never sees DOM libs."
```

---

### Task 2: Rewrite `_headers` for Workers, guarded by a CSP validator

**Files:**
- Create: `scripts/validate-csp.mjs`, `scripts/validate-csp.test.mjs`
- Modify: `public/_headers`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `scripts/validate-csp.mjs` exporting `parseCsp(headersText): Map<string, string[]>` and `findViolations(csp, requiredOrigins): string[]`. Task 6 runs this script in CI.

**Why this task exists:** `public/_headers` is titled "for GitHub Pages", but **GitHub Pages ignores `_headers` entirely** — it has never been enforced. Workers Assets supports it natively, so migrating switches on an untested policy. As written it omits `https://assets.calendly.com` from `script-src` (breaking `/about/schedule`) and applies `Cache-Control: no-store` to `/*` (disabling caching for every content-hashed bundle).

- [ ] **Step 1: Write the failing test**

Create `scripts/validate-csp.test.mjs`:

```js
import { describe, expect, it } from 'vitest';
import { parseCsp, findViolations } from './validate-csp.mjs';

const SAMPLE = `/*
  Content-Security-Policy: default-src 'self'; script-src 'self' https://a.example; frame-src https://b.example;
  X-Frame-Options: SAMEORIGIN
`;

describe('parseCsp', () => {
  it('extracts directives and their sources', () => {
    const csp = parseCsp(SAMPLE);
    expect(csp.get('script-src')).toEqual(["'self'", 'https://a.example']);
    expect(csp.get('frame-src')).toEqual(['https://b.example']);
  });

  it('returns an empty map when no CSP header is present', () => {
    expect(parseCsp('/*\n  X-Frame-Options: DENY\n').size).toBe(0);
  });
});

describe('findViolations', () => {
  it('reports a required origin missing from its directive', () => {
    const csp = parseCsp(SAMPLE);
    const missing = findViolations(csp, [{ origin: 'https://c.example', directive: 'script-src' }]);
    expect(missing).toEqual(['script-src is missing https://c.example']);
  });

  it('reports nothing when every required origin is present', () => {
    const csp = parseCsp(SAMPLE);
    expect(findViolations(csp, [{ origin: 'https://a.example', directive: 'script-src' }])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test scripts/validate-csp.test.mjs`
Expected: FAIL — `Failed to resolve import "./validate-csp.mjs"`.

- [ ] **Step 3: Write the implementation**

Create `scripts/validate-csp.mjs`:

```js
#!/usr/bin/env node
/**
 * validate-csp.mjs — guard public/_headers against silently breaking a
 * third-party integration.
 *
 * GitHub Pages ignored _headers entirely, so this policy was never enforced
 * until the site moved to Cloudflare Workers. That migration is exactly when a
 * missing script-src entry becomes a broken page, so the origins the site
 * actually loads at runtime are asserted here and checked in CI.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/** Origins the site FETCHES at runtime. Each must be allowed by its directive. */
export const REQUIRED = [
  { origin: 'https://api.web3forms.com', directive: 'script-src' },  // contact form
  { origin: 'https://api.web3forms.com', directive: 'connect-src' }, // form POST
  { origin: 'https://assets.calendly.com', directive: 'script-src' },// scheduling widget
  { origin: 'https://calendly.com', directive: 'frame-src' },        // scheduling iframe
];

export function parseCsp(headersText) {
  const line = headersText
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.toLowerCase().startsWith('content-security-policy:'));
  const map = new Map();
  if (!line) return map;
  const value = line.slice(line.indexOf(':') + 1).trim();
  for (const directive of value.split(';')) {
    const parts = directive.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) continue;
    map.set(parts[0], parts.slice(1));
  }
  return map;
}

export function findViolations(csp, required = REQUIRED) {
  const problems = [];
  for (const { origin, directive } of required) {
    const sources = csp.get(directive) ?? [];
    if (!sources.includes(origin)) problems.push(`${directive} is missing ${origin}`);
  }
  return problems;
}

async function main() {
  const file = path.join(process.cwd(), 'public', '_headers');
  const csp = parseCsp(await readFile(file, 'utf8'));
  if (csp.size === 0) {
    console.error('✗ no Content-Security-Policy found in public/_headers');
    process.exit(1);
  }
  const problems = findViolations(csp);
  if (problems.length > 0) {
    console.error('✗ CSP would block origins the site actually uses:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`✓ CSP allows all ${REQUIRED.length} required origins`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test scripts/validate-csp.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 5: Run the validator against the CURRENT `_headers` and watch it catch the bug**

Run: `node scripts/validate-csp.mjs`
Expected: **FAIL** with `script-src is missing https://assets.calendly.com`.

This is the regression the task exists to prevent. Confirm you see it before fixing it.

- [ ] **Step 6: Rewrite `public/_headers`**

Replace the entire file with:

```
# Served by Cloudflare Workers Static Assets.
#
# IMPORTANT: GitHub Pages ignored this file entirely, so this policy was inert
# until the Workers migration. It is live now. Changes here can break pages.
# `node scripts/validate-csp.mjs` (run in CI) guards the origins the site
# fetches at runtime.
#
# Phase 2 must add the Supabase project origin and Google's accounts origin to
# connect-src, or sign-in will be blocked.

/*
  Content-Security-Policy: default-src 'self' https:; script-src 'self' 'unsafe-inline' https://api.web3forms.com https://assets.calendly.com https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.web3forms.com; frame-src https://calendly.com;
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()

# Content-hashed bundles: safe to cache forever. The previous file applied
# no-store to /*, which would have disabled caching for these entirely.
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

Changes from the previous file: added `https://assets.calendly.com` to `script-src`; removed the `Cache-Control: no-cache, no-store` block on `/*` and the `Pragma`/`Expires` companions, leaving Workers Assets' ETag-based defaults for HTML; removed the dead `/assets/*` rule (Vite-era — Next serves `/_next/static/*`); removed `X-XSS-Protection`, which is deprecated and can itself introduce vulnerabilities in older browsers.

- [ ] **Step 7: Run the validator again**

Run: `node scripts/validate-csp.mjs`
Expected: `✓ CSP allows all 4 required origins`.

- [ ] **Step 8: Verify in a real browser that the CSP breaks nothing**

```bash
pnpm run build && pnpm exec wrangler dev --env staging
```

Open each of these and confirm the **browser console shows zero CSP violation errors**, and that the described element actually renders:

| URL | Must work |
|---|---|
| `http://localhost:8787/about/schedule/` | Calendly widget loads and renders (this is the one the old CSP broke) |
| `http://localhost:8787/about/contact/` | Contact form renders and submits |
| `http://localhost:8787/` | Blog list renders with post images |
| `http://localhost:8787/tutorials/` | Tutorial cards render with cover images |

Then confirm caching headers:

```bash
# Pick a real bundle path out of the built HTML, then check its cache header:
BUNDLE=$(grep -o '/_next/static/[^"]*\.js' out/index.html | head -1)
curl -sI "http://localhost:8787$BUNDLE" | grep -i cache-control
# expect: cache-control: public, max-age=31536000, immutable
```

- [ ] **Step 9: Commit**

```bash
git add public/_headers scripts/validate-csp.mjs scripts/validate-csp.test.mjs
git commit -m "fix(headers): make _headers correct now that Workers will enforce it

GitHub Pages ignores _headers, so this CSP was never enforced. Workers
Assets honors it natively, which would have shipped a broken scheduling
page (assets.calendly.com absent from script-src) and disabled caching
for every hashed bundle (no-store on /*).

Adds scripts/validate-csp.mjs so a future integration cannot be added
without its origin, following the repo's existing validate-*.mjs pattern."
```

---

### Task 3: Staging build variant — relative assets and `noindex`

**Files:**
- Create: `scripts/mark-staging-build.mjs`, `scripts/mark-staging-build.test.mjs`
- Modify: `next.config.js:12`, `package.json` (scripts)

**Interfaces:**
- Consumes: `public/_headers` from Task 2 (the script appends to its built copy).
- Produces: `scripts/mark-staging-build.mjs` exporting `appendNoindexRule(outDir: string): Promise<'appended' | 'already-present'>`, and a `pnpm run build:staging` script. Task 6 calls `build:staging` in CI.

**Why:** `next.config.js:12` hardcodes `assetPrefix: 'https://cloudcodetree.com'` for production builds. A staging build carrying that prefix would load its JS and CSS **from production**, so every parity check would pass for the wrong reason. Separately, an indexable staging copy of a 500-post blog would compete with production in search.

- [ ] **Step 1: Write the failing test**

Create `scripts/mark-staging-build.test.mjs`:

```js
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { appendNoindexRule } from './mark-staging-build.mjs';

let dir;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'staging-'));
  await writeFile(path.join(dir, '_headers'), '/*\n  X-Frame-Options: SAMEORIGIN\n');
});

describe('appendNoindexRule', () => {
  it('appends a site-wide noindex rule', async () => {
    expect(await appendNoindexRule(dir)).toBe('appended');
    const text = await readFile(path.join(dir, '_headers'), 'utf8');
    expect(text).toContain('X-Robots-Tag: noindex, nofollow');
    expect(text).toContain('X-Frame-Options: SAMEORIGIN'); // preserves existing rules
  });

  it('is idempotent', async () => {
    await appendNoindexRule(dir);
    expect(await appendNoindexRule(dir)).toBe('already-present');
    const text = await readFile(path.join(dir, '_headers'), 'utf8');
    expect(text.match(/X-Robots-Tag/g)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test scripts/mark-staging-build.test.mjs`
Expected: FAIL — `Failed to resolve import "./mark-staging-build.mjs"`.

- [ ] **Step 3: Write the implementation**

Create `scripts/mark-staging-build.mjs`:

```js
#!/usr/bin/env node
/**
 * mark-staging-build.mjs — make a build unindexable.
 *
 * Applied to the built out/_headers rather than set by the Worker, because the
 * Worker only runs for run_worker_first paths and asset misses. A Worker-set
 * header would miss every ordinary page. Production never runs this script.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MARKER = 'X-Robots-Tag: noindex, nofollow';
const RULE = `

# --- staging only: never index this origin ---
/*
  ${MARKER}
`;

export async function appendNoindexRule(outDir) {
  const file = path.join(outDir, '_headers');
  const current = await readFile(file, 'utf8');
  if (current.includes(MARKER)) return 'already-present';
  await writeFile(file, current + RULE);
  return 'appended';
}

async function main() {
  const outDir = process.argv[2] ?? 'out';
  const result = await appendNoindexRule(outDir);
  console.log(`✓ staging noindex rule ${result} in ${outDir}/_headers`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test scripts/mark-staging-build.test.mjs`
Expected: PASS, 2 tests.

- [ ] **Step 5: Make `assetPrefix` environment-driven**

In `next.config.js`, replace line 12:

```js
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cloudcodetree.com' : '',
```

with:

```js
  // SITE_ORIGIN overrides the asset origin. Staging sets it to '' so assets are
  // relative and resolve against whatever origin is serving the build — a
  // staging build that pointed at production would make parity checks pass for
  // the wrong reason. Unset falls back to the production behavior.
  assetPrefix:
    process.env.SITE_ORIGIN !== undefined
      ? process.env.SITE_ORIGIN
      : process.env.NODE_ENV === 'production'
        ? 'https://cloudcodetree.com'
        : '',
```

The `!== undefined` check is load-bearing: `SITE_ORIGIN=''` is a meaningful value (relative assets) and `??` or `||` would discard it.

Add to `package.json` `scripts`:

```json
"build:staging": "SITE_ORIGIN= pnpm run build && node scripts/mark-staging-build.mjs out",
```

- [ ] **Step 6: Verify both build variants produce the right asset URLs**

```bash
pnpm run build && grep -c 'https://cloudcodetree.com/_next' out/index.html   # expect > 0
rm -rf out
pnpm run build:staging
grep -c 'https://cloudcodetree.com/_next' out/index.html                     # expect 0
grep -c '"/_next/static' out/index.html                                      # expect > 0
grep -A1 'staging only' out/_headers                                         # expect the noindex rule
```

Expected: production build emits absolute production URLs; staging build emits relative ones and carries the noindex rule.

- [ ] **Step 7: Commit**

```bash
git add next.config.js package.json scripts/mark-staging-build.mjs scripts/mark-staging-build.test.mjs
git commit -m "feat(build): staging build variant with relative assets and noindex

assetPrefix becomes SITE_ORIGIN-driven so a staging build never loads its
JS and CSS from production, which would make parity checks pass for the
wrong reason. The built out/_headers gains a site-wide noindex rule so a
staging copy of the blog cannot compete with production in search."
```

---

### Task 4: Parity contract script

**Files:**
- Create: `scripts/check-parity.mjs`, `scripts/check-parity.test.mjs`

**Interfaces:**
- Consumes: `public/sitemap.xml` (generated by `scripts/generate-feeds.mjs` at prebuild).
- Produces: `scripts/check-parity.mjs` exporting `CONTRACT`, `evaluateCase(testCase, {status, headers, body}): string[]`, and `sitemapPaths(xml): string[]`. Task 7 runs it against both origins.

**Design note:** this compares each origin against an **explicit behavioral contract**, not against a diff of the other origin's HTML. Diffing bodies is a dead end — two builds differ by Next build ID and feed timestamps even from identical source, producing noise that hides real failures. Both origins serve the same build, so content equality is a given; what is genuinely in question is *serving behavior*: status codes, redirects, content types, and 404 handling. Production must pass the contract too — that is what proves the contract describes reality rather than our assumptions.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-parity.test.mjs`:

```js
import { describe, expect, it } from 'vitest';
import { evaluateCase, sitemapPaths } from './check-parity.mjs';

describe('evaluateCase', () => {
  const testCase = {
    path: '/about/',
    status: 200,
    contentType: /text\/html/,
    bodyIncludes: '<html',
  };

  it('returns no failures when everything matches', () => {
    const failures = evaluateCase(testCase, {
      status: 200,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      body: '<html lang="en">',
    });
    expect(failures).toEqual([]);
  });

  it('reports a status mismatch', () => {
    const failures = evaluateCase(testCase, {
      status: 404,
      headers: new Headers({ 'content-type': 'text/html' }),
      body: '<html>',
    });
    expect(failures).toContain('expected status 200, got 404');
  });

  it('reports a missing body marker', () => {
    const failures = evaluateCase(testCase, {
      status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      body: 'nope',
    });
    expect(failures).toContain('body does not contain "<html"');
  });

  it('reports a redirect Location mismatch', () => {
    const redirectCase = { path: '/about', status: 301, location: '/about/' };
    const failures = evaluateCase(redirectCase, {
      status: 301,
      headers: new Headers({ location: '/elsewhere/' }),
      body: '',
    });
    expect(failures).toContain('expected Location /about/, got /elsewhere/');
  });
});

describe('sitemapPaths', () => {
  it('extracts pathnames from absolute sitemap URLs', () => {
    const xml = `<?xml version="1.0"?><urlset>
      <url><loc>https://cloudcodetree.com/</loc></url>
      <url><loc>https://cloudcodetree.com/about/</loc></url>
      <url><loc>https://cloudcodetree.com/ai-news/some-post/</loc></url>
    </urlset>`;
    expect(sitemapPaths(xml)).toEqual(['/', '/about/', '/ai-news/some-post/']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test scripts/check-parity.test.mjs`
Expected: FAIL — `Failed to resolve import "./check-parity.mjs"`.

- [ ] **Step 3: Write the implementation**

Create `scripts/check-parity.mjs`:

```js
#!/usr/bin/env node
/**
 * check-parity.mjs — assert an origin serves the site the way GitHub Pages does.
 *
 * Usage:
 *   node scripts/check-parity.mjs --origin https://cloudcodetree.com
 *   node scripts/check-parity.mjs --origin https://cct-site-staging.<sub>.workers.dev --sweep
 *
 * Run it against PRODUCTION first. A failure there means the contract below is
 * wrong, not that production is broken — correct the contract and re-run.
 * Only a contract that passes on production is evidence of anything on staging.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

/** Behavioral contract. Every case must hold on both origins. */
export const CONTRACT = [
  { path: '/',                        status: 200, contentType: /text\/html/, bodyIncludes: '<html' },
  { path: '/about/',                  status: 200, contentType: /text\/html/, bodyIncludes: '<html' },
  { path: '/about',                   status: 301, location: '/about/' },
  { path: '/tutorials/',              status: 200, contentType: /text\/html/ },
  { path: '/ai-news/',                status: 200, contentType: /text\/html/ },
  { path: '/about/resume/',           status: 200, contentType: /text\/html/ },
  { path: '/about/contact/',          status: 200, contentType: /text\/html/ },
  { path: '/about/schedule/',         status: 200, contentType: /text\/html/ },
  { path: '/blog/',                   status: 200, contentType: /text\/html/ },
  { path: '/resume/',                 status: 200, contentType: /text\/html/ },
  { path: '/contact/',                status: 200, contentType: /text\/html/ },
  { path: '/schedule/',               status: 200, contentType: /text\/html/ },
  { path: '/robots.txt',              status: 200, bodyIncludes: 'Sitemap:' },
  { path: '/sitemap.xml',             status: 200, bodyIncludes: '<urlset' },
  { path: '/feed.xml',                status: 200, bodyIncludes: '<rss' },
  { path: '/rss.xml',                 status: 200, bodyIncludes: '<rss' },
  { path: '/index.xml',               status: 200, bodyIncludes: '<rss' },
  { path: '/ai-news/feed.xml',        status: 200, bodyIncludes: '<rss' },
  { path: '/tutorials/feed.xml',      status: 200, bodyIncludes: '<rss' },
  { path: '/404.html',                status: 200, bodyIncludes: '404' },
  { path: '/definitely-not-a-page/',  status: 404, bodyIncludes: '404' },
];

export function evaluateCase(testCase, { status, headers, body }) {
  const failures = [];
  if (testCase.status !== undefined && status !== testCase.status) {
    failures.push(`expected status ${testCase.status}, got ${status}`);
  }
  if (testCase.location !== undefined) {
    const actual = headers.get('location');
    const normalized = actual && actual.startsWith('http') ? new URL(actual).pathname : actual;
    if (normalized !== testCase.location) {
      failures.push(`expected Location ${testCase.location}, got ${normalized}`);
    }
  }
  if (testCase.contentType !== undefined) {
    const actual = headers.get('content-type') ?? '';
    if (!testCase.contentType.test(actual)) {
      failures.push(`expected content-type matching ${testCase.contentType}, got "${actual}"`);
    }
  }
  if (testCase.bodyIncludes !== undefined && !body.includes(testCase.bodyIncludes)) {
    failures.push(`body does not contain "${testCase.bodyIncludes}"`);
  }
  return failures;
}

export function sitemapPaths(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

async function probe(origin, urlPath) {
  const res = await fetch(new URL(urlPath, origin), { redirect: 'manual' });
  return { status: res.status, headers: res.headers, body: await res.text() };
}

async function inBatches(items, size, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const origin = args[args.indexOf('--origin') + 1];
  const sweep = args.includes('--sweep');
  if (!origin || origin.startsWith('--')) {
    console.error('usage: check-parity.mjs --origin <url> [--sweep]');
    process.exit(2);
  }

  let failed = 0;
  console.log(`\n▸ contract (${CONTRACT.length} cases) against ${origin}`);
  for (const testCase of CONTRACT) {
    const failures = evaluateCase(testCase, await probe(origin, testCase.path));
    if (failures.length > 0) {
      failed += 1;
      console.error(`  ✗ ${testCase.path}`);
      for (const f of failures) console.error(`      ${f}`);
    }
  }
  if (failed === 0) console.log('  ✓ all contract cases pass');

  if (sweep) {
    const xml = await readFile(path.join(process.cwd(), 'public', 'sitemap.xml'), 'utf8');
    const paths = sitemapPaths(xml);
    console.log(`\n▸ sweep (${paths.length} sitemap URLs) against ${origin}`);
    const results = await inBatches(paths, 8, async (p) => {
      const res = await fetch(new URL(p, origin), { redirect: 'manual', method: 'GET' });
      return { path: p, status: res.status };
    });
    const bad = results.filter((r) => r.status !== 200);
    for (const r of bad) console.error(`  ✗ ${r.path} → ${r.status}`);
    failed += bad.length;
    if (bad.length === 0) console.log(`  ✓ all ${paths.length} URLs return 200`);
  }

  console.log('');
  if (failed > 0) {
    console.error(`✗ ${failed} failure(s) against ${origin}`);
    process.exit(1);
  }
  console.log(`✓ ${origin} satisfies the parity contract`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test scripts/check-parity.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 5: Calibrate the contract against production**

Run: `node scripts/check-parity.mjs --origin https://cloudcodetree.com`

Expected on the first run: **some cases fail.** Every failure here is a wrong assumption in `CONTRACT`, not a broken production site. For each one, check what production actually does (`curl -sI https://cloudcodetree.com/<path>`) and correct the case. Common corrections: `/about` may 301 or 302; the `/blog/` stub's status; whether `404.html` is reachable directly.

Repeat until production passes cleanly. **Do not proceed until it does** — an uncalibrated contract cannot prove anything about staging.

- [ ] **Step 6: Run the full sweep against production**

```bash
pnpm run feeds   # ensure public/sitemap.xml exists locally
node scripts/check-parity.mjs --origin https://cloudcodetree.com --sweep
```

Expected: all contract cases pass and all sitemap URLs return 200. This takes a few minutes — the sitemap holds 500+ article URLs.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-parity.mjs scripts/check-parity.test.mjs
git commit -m "test(parity): behavioral contract for GitHub Pages -> Workers migration

Asserts status codes, redirects, content types, and 404 handling against an
origin, plus a sweep over every sitemap URL. Compares each origin to an
explicit contract rather than diffing HTML between origins: two builds
differ by Next build ID and feed timestamps even from identical source, and
that noise would hide real failures. The contract is calibrated against
production first, so passing on staging is evidence rather than assumption."
```

---

### Task 5: Terraform bootstrap

**Files:**
- Create: `infra/backend.tf`, `infra/providers.tf`, `infra/variables.tf`, `infra/backend.hcl.example`, `infra/README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: an initialized Terraform working directory with remote state on R2 and the Cloudflare provider configured. Phase 1 adds `r2.tf`; Phase 2 adds `supabase.tf`, `google_oauth.tf`, `github.tf`; Phase 3 adds `dns.tf` and `worker.tf`.

**Scope note:** this phase manages **no resources**. The deliverable is a working `terraform plan` that reports no changes — a walking skeleton that proves backend, credentials, and provider config before any real resource depends on them.

- [ ] **Step 1: Create the state bucket (the one manual bootstrap step)**

```bash
pnpm exec wrangler r2 bucket create cct-tfstate
pnpm exec wrangler r2 bucket list   # confirm it exists
```

Terraform cannot create the bucket that stores its own state. This is the documented exception; everything after it is codified.

Then create an R2 **S3-compatible API token** in the Cloudflare dashboard (R2 → Manage API tokens, Object Read & Write on `cct-tfstate`) and export it:

```bash
export AWS_ACCESS_KEY_ID=<r2 access key id>
export AWS_SECRET_ACCESS_KEY=<r2 secret access key>
export CLOUDFLARE_API_TOKEN=<workers + r2 token>
```

- [ ] **Step 2: Write the Terraform configuration**

Create `infra/backend.tf`:

```hcl
terraform {
  required_version = ">= 1.9.0"

  # R2 is S3-compatible, so the s3 backend works with checksum and region
  # validation disabled. use_lockfile gives state locking without DynamoDB.
  backend "s3" {
    key    = "cloudcodetree/terraform.tfstate"
    region = "auto"

    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
    use_lockfile                = true
  }
}
```

Create `infra/providers.tf`:

```hcl
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.23"
    }
  }
}

# Reads CLOUDFLARE_API_TOKEN from the environment.
provider "cloudflare" {}
```

Providers for Supabase, Google, and GitHub arrive in Phase 2 alongside the resources that need them — declaring them now would download providers for resources that do not exist.

Create `infra/variables.tf`:

```hcl
variable "cloudflare_account_id" {
  description = "Cloudflare account that owns the Worker, R2 buckets, and zone."
  type        = string
}
```

Create `infra/backend.hcl.example`:

```hcl
# Copy to backend.hcl and fill in. Not committed: it carries the account ID.
# terraform init -backend-config=backend.hcl
bucket    = "cct-tfstate"
endpoints = { s3 = "https://<CLOUDFLARE_ACCOUNT_ID>.r2.cloudflarestorage.com" }
```

Create `infra/README.md`:

```markdown
# Infrastructure

Terraform owns account-level state: Cloudflare zone and DNS records, R2
buckets, the Worker's custom domain, the Supabase project and auth settings,
the Google OAuth client, and GitHub Actions secrets.

**Terraform does NOT own the Worker itself.** The script, its static assets,
and everything under `assets` in `wrangler.jsonc` — `_headers`,
`html_handling`, `not_found_handling`, `run_worker_first`, bindings — are
wrangler's. `cloudflare_workers_script` *can* manage them, which is exactly
why the rule needs stating: two writers on one resource produce state drift.
The AI News routine publishes daily, and Terraform must stay out of that path.

The database schema, RLS policies, and views are SQL migrations under
`supabase/migrations/`. This is forced, not preferred: the Supabase provider
has no resource for tables, policies, or views.

## Setup

    pnpm exec wrangler r2 bucket create cct-tfstate   # once, out of band
    cp backend.hcl.example backend.hcl               # fill in the account ID
    export AWS_ACCESS_KEY_ID=...                     # R2 S3 API token
    export AWS_SECRET_ACCESS_KEY=...
    export CLOUDFLARE_API_TOKEN=...
    terraform init -backend-config=backend.hcl
    terraform plan -var-file=terraform.tfvars
```

Add to `.gitignore`:

```
# Terraform
/infra/.terraform/
/infra/backend.hcl
/infra/terraform.tfvars
*.tfstate
*.tfstate.*
crash.log
```

- [ ] **Step 3: Initialize and verify**

```bash
cd infra
cp backend.hcl.example backend.hcl   # fill in the real account ID
echo 'cloudflare_account_id = "<your account id>"' > terraform.tfvars
terraform init -backend-config=backend.hcl
terraform validate
terraform plan -var-file=terraform.tfvars
```

Expected: `init` succeeds and reports the S3 backend configured; `validate` reports success; `plan` reports **"No changes. Your infrastructure matches the configuration."**

If `init` fails on the backend, the usual causes are a missing `use_path_style`, a wrong endpoint URL, or R2 credentials exported as Cloudflare rather than S3-compatible tokens.

- [ ] **Step 4: Confirm state landed in R2**

```bash
pnpm exec wrangler r2 object get cct-tfstate/cloudcodetree/terraform.tfstate --file=/tmp/state.json && head -c 200 /tmp/state.json
```

Expected: a JSON state file with `"resources": []`.

- [ ] **Step 5: Commit**

```bash
cd .. && git add infra/ .gitignore
git commit -m "infra: Terraform bootstrap with remote state on R2

Walking skeleton only — no resources yet. Proves the backend, credentials,
and provider config work before any real resource depends on them. State
locking uses use_lockfile, so no DynamoDB equivalent is needed.

Documents the ownership boundary: Terraform never declares anything inside
the Worker (wrangler owns it, and it ships on every content push), and the
database schema stays in SQL migrations because the Supabase provider has
no resource for tables, policies, or views."
```

---

### Task 6: CI workflow for staging deploys

**Files:**
- Create: `.github/workflows/deploy-staging.yml`
- Modify: `.github/workflows/deploy.yml` (add the CSP validator to the existing build job only)

**Interfaces:**
- Consumes: `pnpm run build:staging` (Task 3), `scripts/validate-csp.mjs` (Task 2), `wrangler.jsonc` `env.staging` (Task 1).
- Produces: a deployed `cct-site-staging` Worker and its `workers.dev` URL, printed in the job summary. Task 7 uses that URL.

**Constraint reminder:** the existing `deploy` job publishing to gh-pages must remain untouched. Production continues shipping from GitHub Pages throughout this phase.

- [ ] **Step 1: Add repository secrets**

In GitHub → Settings → Secrets and variables → Actions, add:

- `CLOUDFLARE_API_TOKEN` — a token with `Workers Scripts: Edit` and `Workers R2 Storage: Edit`
- `CLOUDFLARE_ACCOUNT_ID`

- [ ] **Step 2: Create the staging workflow**

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy staging Worker

# Staging only. Never touches cloudcodetree.com or the gh-pages branch.
on:
  workflow_dispatch:
  push:
    branches: [ 'feat/workers-staging' ]

permissions:
  contents: read

concurrency:
  group: staging-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Unit tests
        run: pnpm test

      - name: Validate CSP covers every origin the site fetches
        run: node scripts/validate-csp.mjs

      - name: Build (staging variant — relative assets, noindex)
        run: pnpm run build:staging

      - name: Deploy to the staging Worker
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env staging

      - name: Record the staging URL
        run: |
          echo "### Staging deployed" >> "$GITHUB_STEP_SUMMARY"
          echo "Worker: \`cct-site-staging\`" >> "$GITHUB_STEP_SUMMARY"
          echo "Run the parity gate against its workers.dev URL." >> "$GITHUB_STEP_SUMMARY"
```

- [ ] **Step 3: Add the CSP validator to the production build job**

In `.github/workflows/deploy.yml`, inside the **`build`** job only, add a step immediately after `Validate research log ↔ feed consistency`:

```yaml
    - name: Validate CSP covers every origin the site fetches
      run: node scripts/validate-csp.mjs
```

Do not modify the `rehost-images` or `deploy` jobs.

- [ ] **Step 4: Push the branch and run the workflow**

```bash
git add .github/workflows/deploy-staging.yml .github/workflows/deploy.yml
git commit -m "ci: staging Worker deploy workflow

Builds the staging variant and deploys cct-site-staging on demand or on
pushes to feat/workers-staging. Deliberately independent of deploy.yml:
production keeps shipping from GitHub Pages for the whole of Phase 0.
Also wires the CSP validator into the production build job, so the headers
file cannot regress once Workers starts enforcing it."
git push -u origin feat/workers-staging
```

- [ ] **Step 5: Verify the deploy succeeded**

Check the Actions run. Expected: all steps green, and the wrangler step prints a `https://cct-site-staging.<subdomain>.workers.dev` URL. Record that URL — Task 7 needs it.

If the wrangler step fails with a missing assets directory, `build:staging` did not produce `out/`; check the build step's log.

---

### Task 7: Run the parity gate and record the exit criteria

**Files:**
- Create: `docs/superpowers/plans/2026-08-20-phase-0-parity-results.md`

**Interfaces:**
- Consumes: the staging URL from Task 6, `scripts/check-parity.mjs` from Task 4.
- Produces: a recorded pass/fail result. Phase 1 does not begin until this is green.

- [ ] **Step 1: Run the contract against staging**

```bash
STAGING=https://cct-site-staging.<subdomain>.workers.dev
node scripts/check-parity.mjs --origin "$STAGING"
```

Expected: all contract cases pass. Any failure is a real serving difference between Workers Assets and GitHub Pages — investigate before proceeding. The likely suspects, in order: `html_handling` not matching Pages' trailing-slash redirect; `not_found_handling` not serving `404.html`; a `_headers` rule changing a content type.

- [ ] **Step 2: Run the full sweep against staging**

```bash
pnpm run feeds
node scripts/check-parity.mjs --origin "$STAGING" --sweep
```

Expected: every sitemap URL returns 200 on staging. This is the check that catches path-resolution differences a handful of manual clicks would miss across 500+ articles.

- [ ] **Step 3: Verify the staging-only behaviors**

```bash
# Staging must be unindexable:
curl -sI "$STAGING/" | grep -i x-robots-tag
# expect: x-robots-tag: noindex, nofollow

# Production must NOT be:
curl -sI https://cloudcodetree.com/ | grep -ci x-robots-tag
# expect: 0

# Staging assets must be relative, not pointing at production:
curl -s "$STAGING/" | grep -c 'https://cloudcodetree.com/_next'
# expect: 0

# The Phase 2 gate paths must be reachable-but-empty, proving run_worker_first deployed:
curl -sI "$STAGING/projects/anything/demo/" | head -1
# expect: 404 (the Worker ran and ASSETS found nothing)
```

- [ ] **Step 4: Spot-check the two pages the old CSP would have broken**

Open `$STAGING/about/schedule/` and `$STAGING/about/contact/` in a browser. Confirm the Calendly widget renders, the contact form renders, and the console shows **zero** CSP violations.

- [ ] **Step 5: Record the results**

Create `docs/superpowers/plans/2026-08-20-phase-0-parity-results.md` with: the staging URL, the date, the contract pass/fail count, the sweep URL count, any contract cases corrected during calibration and why, and confirmation of the four staging-only checks. Paste the actual command output — the point of this file is evidence, not assertion.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-08-20-phase-0-parity-results.md
git commit -m "docs: Phase 0 parity gate results

Records the evidence that the staging Worker serves the site identically to
GitHub Pages: contract cases, full sitemap sweep, and the staging-only
noindex and relative-asset checks. Phase 1 is unblocked."
```

---

## Phase 0 exit criteria

Phase 1 does not start until all of these hold:

- [ ] `pnpm test` passes (Worker, CSP validator, staging marker, parity evaluator).
- [ ] `node scripts/validate-csp.mjs` passes, and it **failed** against the original `_headers` — proving the guard works.
- [ ] The parity contract passes against **production** (calibration) and against **staging** (the actual gate).
- [ ] The sitemap sweep returns 200 for every URL on staging.
- [ ] Staging returns `X-Robots-Tag: noindex, nofollow`; production does not.
- [ ] Staging HTML contains **zero** references to `https://cloudcodetree.com/_next`.
- [ ] `/projects/<anything>/demo/` returns 404 from the Worker, proving `run_worker_first`'s array form deployed.
- [ ] `terraform plan` reports no changes, with state in R2.
- [ ] `cloudcodetree.com` still serves from GitHub Pages, unchanged, and `deploy.yml`'s gh-pages path is untouched.
