#!/usr/bin/env node
/**
 * configure-auth.mjs — wire the Supabase auth config via the Management API.
 *
 * Reads everything from .env itself (secrets never enter tool output):
 *   SUPABASE_ACCESS_TOKEN (accepts the GOOGLE_ACCESS_TOKEN name too — sbp_…)
 *   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 * Sets: Google provider on, site URL, and the redirect allowlist for
 * staging + production + localhost. Prints only booleans and public URLs.
 */
import { readFileSync } from 'node:fs';

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
const token = [env.SUPABASE_ACCESS_TOKEN, env.GOOGLE_ACCESS_TOKEN].find((t) => t?.startsWith('sbp_'));
const ref = env.SUPABASE_PROJECT_ID ?? new URL(env.SUPABASE_PROJECT_URL).hostname.split('.')[0];
const clientId = env.GOOGLE_CLIENT_ID;
const clientSecret = env.GOOGLE_CLIENT_SECRET;
if (!token || !ref || !clientId || !clientSecret) {
  console.error('✗ missing one of: sbp_ token, project ref, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
  process.exit(1);
}

const API = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

const before = await (await fetch(API, { headers })).json();
if (before.message) { console.error(`✗ management API: ${before.message}`); process.exit(1); }
console.log('before:', {
  google_enabled: before.external_google_enabled,
  github_enabled: before.external_github_enabled,
  linkedin_enabled: before.external_linkedin_oidc_enabled,
  site_url: before.site_url,
  uri_allow_list: before.uri_allow_list || '(empty)',
});

// Sign-in returns visitors to whatever page they were on, so every path on
// our origins is a valid return target (** = any depth in Supabase's globs).
// Default site URL is the origin that owns sign-in today; pass --site-url to
// move it (the cutover runbook sets https://cloudcodetree.com at the apex flip).
const siteArg = process.argv.indexOf('--site-url');
const SITE_URL = siteArg > -1 ? process.argv[siteArg + 1] : 'https://cct-site-staging.chris-247.workers.dev';
if (!/^https?:\/\/[^/]+$/.test(SITE_URL)) { console.error(`✗ --site-url must be an origin, got: ${SITE_URL}`); process.exit(1); }

const ALLOW = [
  'https://cct-site-staging.chris-247.workers.dev/**',
  'https://beta.cloudcodetree.com/**',
  'https://cloudcodetree.com/**',
  'http://localhost:3000/**',
].join(',');

const res = await fetch(API, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    site_url: SITE_URL,
    uri_allow_list: ALLOW,
    external_google_enabled: true,
    external_google_client_id: clientId,
    external_google_secret: clientSecret,
    ...(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET
      ? {
          external_linkedin_oidc_enabled: true,
          external_linkedin_oidc_client_id: env.LINKEDIN_CLIENT_ID,
          external_linkedin_oidc_secret: env.LINKEDIN_CLIENT_SECRET,
        }
      : {}),
    ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
      ? {
          external_github_enabled: true,
          external_github_client_id: env.GITHUB_CLIENT_ID,
          external_github_secret: env.GITHUB_CLIENT_SECRET,
        }
      : {}),
  }),
});
if (!res.ok) { console.error(`✗ PATCH failed: ${res.status} ${await res.text()}`); process.exit(1); }

const after = await (await fetch(API, { headers })).json();
console.log('after:', {
  google_enabled: after.external_google_enabled,
  github_enabled: after.external_github_enabled,
  linkedin_enabled: after.external_linkedin_oidc_enabled,
  site_url: after.site_url,
  uri_allow_list: after.uri_allow_list,
});
console.log('\n✓ auth config applied');
