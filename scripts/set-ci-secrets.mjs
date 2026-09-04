#!/usr/bin/env node
/**
 * set-ci-secrets.mjs — arm the production Worker deploy in CI.
 *
 * Reads CLOUDFLARE_API_TOKEN (and optionally CLOUDFLARE_ACCOUNT_ID) from .env
 * itself — the token never enters tool output or shell history. Verifies the
 * token against Cloudflare, then sets the GitHub repo secrets the
 * `deploy-worker` job in .github/workflows/deploy.yml reads, and flips the
 * ENABLE_WORKER_DEPLOY repo variable that gates it.
 *
 *   node scripts/set-ci-secrets.mjs            # verify + set + enable
 *   node scripts/set-ci-secrets.mjs --verify   # verify the token only
 *
 * Prints only booleans and public identifiers.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const ACCOUNT_ID_DEFAULT = '2473c9873f03835b5779ea7c11d41106'; // public, not a secret
const REPO = 'cloudcodetree/cloudcodetree.github.io';

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
const token = env.CLOUDFLARE_API_TOKEN;
const accountId = env.CLOUDFLARE_ACCOUNT_ID || ACCOUNT_ID_DEFAULT;
const verifyOnly = process.argv.includes('--verify');

if (!token) {
  console.error('✗ CLOUDFLARE_API_TOKEN is not set in .env');
  console.error('  Create one at https://dash.cloudflare.com/profile/api-tokens with the');
  console.error('  "Edit Cloudflare Workers" template, then add CLOUDFLARE_API_TOKEN=<token> to .env');
  process.exit(1);
}

// 1. Verify the token is active and can see the account's Workers.
const verify = await (await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
  headers: { authorization: `Bearer ${token}` },
})).json();
const active = verify.success && verify.result?.status === 'active';
console.log(`token active: ${active}`);
if (!active) { console.error(verify.errors); process.exit(1); }

const scripts = await (await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`, {
  headers: { authorization: `Bearer ${token}` },
})).json();
const names = (scripts.result ?? []).map((s) => s.id);
console.log(`can list workers: ${scripts.success} (${names.join(', ') || 'none'})`);
if (!scripts.success) { console.error(scripts.errors); process.exit(1); }
if (!names.includes('cct-site')) { console.error('✗ token cannot see cct-site — wrong account or missing Workers Scripts:Edit'); process.exit(1); }

if (verifyOnly) process.exit(0);

// 2. Set the repo secrets + the gating variable via gh (authenticated locally).
function gh(args, input) {
  const r = spawnSync('gh', args, { input, encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr.trim()); process.exit(r.status ?? 1); }
}
gh(['secret', 'set', 'CLOUDFLARE_API_TOKEN', '--repo', REPO], token);
gh(['secret', 'set', 'CLOUDFLARE_ACCOUNT_ID', '--repo', REPO], accountId);
gh(['variable', 'set', 'ENABLE_WORKER_DEPLOY', '--repo', REPO, '--body', 'true']);
console.log('secrets set: true (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)');
console.log('ENABLE_WORKER_DEPLOY: true');
