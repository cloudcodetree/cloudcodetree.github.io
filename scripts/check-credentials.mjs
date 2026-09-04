#!/usr/bin/env node
/**
 * check-credentials.mjs — verify the credentials this project needs actually
 * work, and have the right scopes, before a deploy fails with an opaque
 * authorization error.
 *
 * Cloudflare API tokens are scoped per-permission and per-resource, so a token
 * that authenticates fine can still be unable to do the one thing you need.
 * This probes real capability endpoints rather than trusting /verify.
 *
 * Never prints secret values — only whether each check passed.
 *
 * Usage:
 *   export CLOUDFLARE_ACCOUNT_ID=...  CLOUDFLARE_API_TOKEN=...
 *   export AWS_ACCESS_KEY_ID=...      AWS_SECRET_ACCESS_KEY=...
 *   node scripts/check-credentials.mjs
 */

const API = 'https://api.cloudflare.com/client/v4';

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

function present(name) {
  const value = process.env[name];
  const ok = typeof value === 'string' && value.length > 0;
  record(`${name} is set`, ok, ok ? `${value.length} chars` : 'missing from environment');
  return ok;
}

async function cf(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  let body = {};
  try { body = await res.json(); } catch { /* non-JSON error page */ }
  return { status: res.status, ok: res.ok && body.success !== false, body };
}

async function main() {
  console.log('\nCloudflare\n----------');

  const hasAccount = present('CLOUDFLARE_ACCOUNT_ID');
  const hasToken = present('CLOUDFLARE_API_TOKEN');

  if (hasToken) {
    const verify = await cf('/user/tokens/verify', process.env.CLOUDFLARE_API_TOKEN);
    record(
      'API token is valid and active',
      verify.ok,
      verify.ok ? verify.body.result?.status ?? 'active' : `HTTP ${verify.status}`,
    );
  }

  if (hasToken && hasAccount) {
    const account = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;

    // Capability probes. A token can verify successfully and still lack these.
    const workers = await cf(`/accounts/${account}/workers/scripts`, token);
    record(
      'token can reach Workers Scripts (needs Workers Scripts:Edit)',
      workers.ok,
      workers.ok ? `${workers.body.result?.length ?? 0} script(s) in account` : `HTTP ${workers.status}`,
    );

    const buckets = await cf(`/accounts/${account}/r2/buckets`, token);
    const names = buckets.body?.result?.buckets?.map((b) => b.name) ?? [];
    record(
      'token can reach R2 (needs Workers R2 Storage:Edit)',
      buckets.ok,
      buckets.ok ? `${names.length} bucket(s)` : `HTTP ${buckets.status}`,
    );

    if (buckets.ok) {
      record(
        'Terraform state bucket cct-tfstate exists',
        names.includes('cct-tfstate'),
        names.includes('cct-tfstate')
          ? 'ready'
          : 'run: pnpm exec wrangler r2 bucket create cct-tfstate',
      );
    }
  }

  console.log('\nR2 S3-compatible credentials (Terraform backend)\n------------------------------------------------');
  // These are a DIFFERENT credential type from the API token above: an
  // access-key/secret pair issued under R2 > Manage API tokens. Verifying them
  // requires SigV4 signing, so presence and shape are checked here and
  // `terraform init` is the real proof.
  const hasKey = present('AWS_ACCESS_KEY_ID');
  const hasSecret = present('AWS_SECRET_ACCESS_KEY');
  if (hasKey && hasSecret) {
    console.log('  ℹ these are proven by `terraform init -backend-config=backend.hcl`');
  }

  const failed = results.filter((r) => !r.ok);
  console.log('');
  if (failed.length > 0) {
    console.error(`✗ ${failed.length} of ${results.length} checks failed`);
    process.exit(1);
  }
  console.log(`✓ all ${results.length} checks passed`);
}

await main();
