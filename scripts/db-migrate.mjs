#!/usr/bin/env node
/**
 * db-migrate.mjs — apply supabase/migrations/*.sql in order, idempotently.
 *
 * Reads the connection string from .env itself (SUPABASE_DIRECT_CON_STRING);
 * the credential never appears in command lines or output. Applied filenames
 * are recorded in public.schema_migrations so re-runs skip them.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

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
let conn = env.SUPABASE_DIRECT_CON_STRING ?? env.DATABASE_URL;
if (!conn) {
  console.error('✗ SUPABASE_DIRECT_CON_STRING not found in .env');
  process.exit(1);
}
// Supabase copies the string with a [YOUR-PASSWORD] placeholder; the real
// password lives in SUPABASE_DB_PASSWORD. Splice it in, URL-encoded.
if (env.SUPABASE_DB_PASSWORD) {
  if (conn.includes('[YOUR-PASSWORD]')) {
    conn = conn.replace('[YOUR-PASSWORD]', encodeURIComponent(env.SUPABASE_DB_PASSWORD));
  } else {
    // Password may also be present-but-wrong (copied placeholder variants);
    // rebuild it from parts to be safe.
    try {
      const u = new URL(conn);
      u.password = encodeURIComponent(env.SUPABASE_DB_PASSWORD);
      conn = u.toString();
    } catch {}
  }
}

const dir = path.resolve('supabase/migrations');
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

const client = new pg.Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(
    'create table if not exists public.schema_migrations (filename text primary key, applied_at timestamptz not null default now())',
  );
  const { rows } = await client.query('select filename from public.schema_migrations');
  const done = new Set(rows.map((r) => r.filename));

  for (const file of files) {
    if (done.has(file)) { console.log(`· ${file} (already applied)`); continue; }
    const sql = readFileSync(path.join(dir, file), 'utf8');
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into public.schema_migrations (filename) values ($1)', [file]);
      await client.query('commit');
      console.log(`✓ ${file}`);
    } catch (err) {
      await client.query('rollback');
      console.error(`✗ ${file}: ${err.message}`);
      process.exit(1);
    }
  }
  console.log('\nall migrations applied');
} finally {
  await client.end();
}
