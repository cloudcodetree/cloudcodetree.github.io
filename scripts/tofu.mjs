#!/usr/bin/env node
/**
 * tofu.mjs — run OpenTofu in infra/ with the Cloudflare token from .env.
 *
 *   node scripts/tofu.mjs init
 *   node scripts/tofu.mjs plan
 *   node scripts/tofu.mjs apply
 *
 * The provider reads CLOUDFLARE_API_TOKEN from the environment; this wrapper
 * loads it from .env (or .env.local) so the value never has to be exported in
 * a shell or pasted into a command. Everything after the script name is passed
 * to `tofu` verbatim.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const env = { ...parseEnv(path.join(ROOT, '.env')), ...parseEnv(path.join(ROOT, '.env.local')) };
const token = process.env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_API_TOKEN || env.CLODFLARE_API_TOKEN;
if (!token) { console.error('✗ CLOUDFLARE_API_TOKEN is not set (env or .env)'); process.exit(1); }

const r = spawnSync('tofu', process.argv.slice(2), {
  cwd: path.join(ROOT, 'infra'),
  stdio: 'inherit',
  env: { ...process.env, CLOUDFLARE_API_TOKEN: token, TF_IN_AUTOMATION: '1' },
});
process.exit(r.status ?? 1);
