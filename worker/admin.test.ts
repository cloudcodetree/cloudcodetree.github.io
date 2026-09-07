import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet } from 'jose';
import worker, { type Env } from './index';
import { setJwksForTesting } from './auth';

const SUPABASE_URL = 'https://demo-ref.supabase.co';
const OWNER = 'owner-uuid-1';
let signAs: (sub: string) => Promise<string>;
let validJwks: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256' };
  validJwks = createLocalJWKSet({ keys: [jwk] });
  signAs = (sub) =>
    new SignJWT({ email: `${sub}@example.com` })
      .setProtectedHeader({ alg: 'ES256', kid: 'k1' })
      .setSubject(sub)
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(privateKey);
});

beforeEach(() => setJwksForTesting(validJwks));

function makeEnv(overrides: Partial<Record<string, unknown>> = {}) {
  const assetFetch = vi.fn(async () => new Response('<title>dashboard</title>', { status: 200 }));
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 201 })));
  const env = {
    ASSETS: { fetch: assetFetch },
    PRODUCTION_HOSTNAME: 'cloudcodetree.com',
    SUPABASE_URL,
    SUPABASE_ANON_KEY: 'anon-key',
    OWNER_USER_ID: OWNER,
    ...overrides,
  } as unknown as Env;
  const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;
  return { env, ctx, assetFetch };
}

const ADMIN = 'https://x.dev/admin/analytics/';
const withCookie = (token: string) => new Request(ADMIN, { headers: { cookie: `cct_session=${token}` } });

describe('owner-only /admin/*', () => {
  it('sends a signed-out visitor to the site-wide sign-in with next=/admin/…', async () => {
    const { env, ctx, assetFetch } = makeEnv();
    const res = await worker.fetch(new Request(ADMIN), env, ctx);
    expect(res.status).toBe(302);
    const loc = new URL(res.headers.get('location')!, ADMIN);
    expect(loc.pathname).toBe('/');
    expect(loc.searchParams.get('signin')).toBe('1');
    expect(loc.searchParams.get('next')).toBe('/admin/analytics/');
    expect(assetFetch).not.toHaveBeenCalled();
  });

  it('404s a signed-in visitor who is not the owner (no hint that the page exists)', async () => {
    const { env, ctx, assetFetch } = makeEnv();
    const res = await worker.fetch(withCookie(await signAs('someone-else')), env, ctx);
    expect(res.status).toBe(404);
    expect(assetFetch).not.toHaveBeenCalled();
  });

  it('serves the page to the owner', async () => {
    const { env, ctx, assetFetch } = makeEnv();
    const res = await worker.fetch(withCookie(await signAs(OWNER)), env, ctx);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('dashboard');
    expect(assetFetch).toHaveBeenCalledTimes(1);
  });

  it('404s a forged or garbage cookie', async () => {
    const { env, ctx } = makeEnv();
    const res = await worker.fetch(withCookie('not-a-jwt'), env, ctx);
    expect(res.status).toBe(404);
  });

  it('fails closed when no owner is configured, even for a valid session', async () => {
    const { env, ctx, assetFetch } = makeEnv({ OWNER_USER_ID: undefined });
    const res = await worker.fetch(withCookie(await signAs(OWNER)), env, ctx);
    expect(res.status).toBe(404);
    expect(assetFetch).not.toHaveBeenCalled();
  });

  it('covers /admin and /admin/ but not /administrator-guide/', async () => {
    const { env, ctx, assetFetch } = makeEnv();
    expect((await worker.fetch(new Request('https://x.dev/admin'), env, ctx)).status).toBe(302);
    expect((await worker.fetch(new Request('https://x.dev/admin/'), env, ctx)).status).toBe(302);
    const res = await worker.fetch(new Request('https://x.dev/administrator-guide/'), env, ctx);
    expect(res.status).toBe(200);
    expect(assetFetch).toHaveBeenCalledTimes(1);
  });
});
