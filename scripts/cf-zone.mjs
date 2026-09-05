#!/usr/bin/env node
/**
 * cf-zone.mjs — the few zone-level operations the cutover needs, driven by the
 * API token in .env (CLOUDFLARE_API_TOKEN; the value never enters tool output).
 *
 *   node scripts/cf-zone.mjs status         # routes, redirect rules, DNS summary
 *   node scripts/cf-zone.mjs purge          # purge the whole edge cache (after a flip)
 *   node scripts/cf-zone.mjs www-redirect   # ensure the www → apex 301 rule exists
 *
 * Long-term these belong to OpenTofu (infra/); this script is the bridge until
 * the zone is imported there. Every write is idempotent.
 */
import { readFileSync } from 'node:fs';

const ZONE = 'cloudcodetree.com';
const API = 'https://api.cloudflare.com/client/v4';

function parseEnv(p) {
  const out = {};
  try {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return out;
}
const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const token = env.CLOUDFLARE_API_TOKEN || env.CLODFLARE_API_TOKEN;
if (!token) { console.error('✗ CLOUDFLARE_API_TOKEN is not set in .env'); process.exit(1); }

async function cf(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json();
  if (!json.success) {
    const err = new Error(`${method} ${path}: ${json.errors?.map((e) => `${e.code} ${e.message}`).join('; ')}`);
    err.code = json.errors?.[0]?.code;
    throw err;
  }
  return json.result;
}

const zone = (await cf('GET', `/zones?name=${ZONE}`))[0];
if (!zone) { console.error(`✗ zone ${ZONE} not visible to this token`); process.exit(1); }

const WWW_RULE = {
  description: 'www -> apex 301 (path + query preserved); replaces the GitHub Pages redirect',
  expression: `(http.host eq "www.${ZONE}")`,
  action: 'redirect',
  enabled: true,
  action_parameters: {
    from_value: {
      status_code: 301,
      preserve_query_string: true,
      target_url: { expression: `concat("https://${ZONE}", http.request.uri.path)` },
    },
  },
};

const cmd = process.argv[2];
if (cmd === 'status') {
  const routes = await cf('GET', `/zones/${zone.id}/workers/routes`);
  console.log('worker routes:', routes.length ? routes.map((r) => `${r.pattern} → ${r.script}`).join(', ') : '(none)');
  let rules = [];
  try { rules = (await cf('GET', `/zones/${zone.id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`)).rules ?? []; }
  catch (e) { if (e.code !== 10003) throw e; }
  console.log('redirect rules:', rules.length ? rules.map((r) => `${r.description} [${r.enabled ? 'on' : 'off'}]`).join(', ') : '(none)');
  const dns = await cf('GET', `/zones/${zone.id}/dns_records?per_page=100`);
  for (const r of dns.filter((r) => ['A', 'AAAA', 'CNAME'].includes(r.type))) console.log(`  ${r.type} ${r.name} → ${r.content} proxied=${r.proxied}`);
} else if (cmd === 'purge') {
  await cf('POST', `/zones/${zone.id}/purge_cache`, { purge_everything: true });
  console.log('✓ edge cache purged for', ZONE);
} else if (cmd === 'www-redirect') {
  let existing = null;
  try { existing = await cf('GET', `/zones/${zone.id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`); }
  catch (e) { if (e.code !== 10003) throw e; }
  const rules = existing?.rules ?? [];
  if (rules.some((r) => r.expression === WWW_RULE.expression)) { console.log('✓ www redirect rule already present'); process.exit(0); }
  await cf('PUT', `/zones/${zone.id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, {
    description: existing?.description || 'Zone redirects',
    rules: [...rules.map(({ id, version, last_updated, ref, ...keep }) => keep), WWW_RULE],
  });
  console.log('✓ www → apex redirect rule created');
} else {
  console.error('usage: node scripts/cf-zone.mjs status|purge|www-redirect');
  process.exit(2);
}
