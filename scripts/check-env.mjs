#!/usr/bin/env node
/**
 * check-env.mjs — report the SHAPE of local env config without exposing values.
 *
 * The repo deliberately denies Claude (and any tool) direct reads of .env*.
 * This script honors that intent: it loads the file itself and prints only
 * which expected names are present/missing, value lengths, and the one value
 * that is public by definition — the Supabase project URL, which ships in
 * every built page and in the committed CSP.
 */
import { readFileSync, existsSync } from 'node:fs';

const EXPECTED = [
  // Baked into the static build (public by design):
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  // Forwarded to the Worker at deploy time (same values, Worker-side names):
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
];

// The user's .env uses their own names; map them to the canonical ones.
const ALIASES = {
  NEXT_PUBLIC_SUPABASE_URL: ['SUPABASE_PROJECT_URL', 'SUPABASE_URL'],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ['SUPABASE_PUB_KEY', 'SUPABASE_ANON_KEY'],
  SUPABASE_URL: ['SUPABASE_PROJECT_URL', 'NEXT_PUBLIC_SUPABASE_URL'],
  SUPABASE_ANON_KEY: ['SUPABASE_PUB_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
};

export function resolveEnv(env) {
  const out = {};
  for (const [name, aliases] of Object.entries(ALIASES)) {
    out[name] = env[name] ?? aliases.map((a) => env[a]).find(Boolean);
  }
  return out;
}

function parseEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = { ...parseEnv('.env'), ...parseEnv('.env.local') };
const names = Object.keys(env);
if (names.length === 0) {
  console.error('✗ no .env / .env.local found (or empty)');
  process.exit(1);
}

console.log(`found ${names.length} var(s): ${names.join(', ')}\n`);

let missing = 0;
const resolved = resolveEnv(env);
for (const name of EXPECTED) {
  const value = resolved[name];
  if (value) {
    console.log(`✓ ${name.padEnd(30)} resolved (${value.length} chars)`);
  } else {
    console.log(`✗ ${name.padEnd(30)} MISSING`);
    missing += 1;
  }
}

const url = resolved.NEXT_PUBLIC_SUPABASE_URL;
if (url) {
  try {
    const origin = new URL(url).origin;
    const ok = /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(origin);
    console.log(`\nSupabase origin (public, needed in the committed CSP): ${origin}${ok ? '' : '  ⚠ unexpected shape'}`);
  } catch {
    console.log('\n⚠ SUPABASE_URL is not a valid URL');
  }
}

process.exit(missing ? 1 : 0);
