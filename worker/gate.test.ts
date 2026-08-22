import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet } from 'jose';
import worker, { type Env } from './index';
import { setJwksForTesting } from './auth';

const SUPABASE_URL = 'https://demo-ref.supabase.co';
let signValid: () => Promise<string>;
let signExpired: () => Promise<string>;

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256' };
  setJwksForTesting(createLocalJWKSet({ keys: [jwk] }));
  const base = () =>
    new SignJWT({ email: 'v@example.com' })
      .setProtectedHeader({ alg: 'ES256', kid: 'k1' })
      .setSubject('user-123')
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setIssuedAt();
  signValid = () => base().setExpirationTime('1h').sign(privateKey);
  signExpired = () => base().setExpirationTime('-1h').sign(privateKey);
});

function makeEnv(overrides: Partial<Record<string, unknown>> = {}) {
  const assetFetch = vi.fn(async () => new Response('demo bytes', { status: 200 }));
  const restFetch = vi.fn(async () => new Response(null, { status: 201 }));
  vi.stubGlobal('fetch', restFetch);
  const env = {
    ASSETS: { fetch: assetFetch },
    PRODUCTION_HOSTNAME: 'cloudcodetree.com',
    SUPABASE_URL,
    SUPABASE_ANON_KEY: 'anon-key',
    ...overrides,
  } as unknown as Env;
  const waits: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => waits.push(p) } as unknown as ExecutionContext;
  return { env, ctx, assetFetch, restFetch, waits };
}

const DEMO = 'https://x.dev/projects/span-calculator/demo/';

function req(url: string, init: RequestInit & { cookie?: string; navigate?: boolean } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set('cookie', init.cookie);
  if (init.navigate) headers.set('sec-fetch-mode', 'navigate');
  return new Request(url, { ...init, headers });
}

describe('demo gate', () => {
  it('302s a signed-out visitor to the detail page with signin+next', async () => {
    const { env, ctx, assetFetch } = makeEnv();
    const res = await worker.fetch(req(DEMO), env, ctx);
    expect(res.status).toBe(302);
    const loc = new URL(res.headers.get('location')!, DEMO);
    expect(loc.pathname).toBe('/projects/span-calculator/');
    expect(loc.searchParams.get('signin')).toBe('1');
    expect(loc.searchParams.get('next')).toBe('/projects/span-calculator/demo/');
    expect(assetFetch).not.toHaveBeenCalled();
  });

  it('302s an expired token', async () => {
    const { env, ctx } = makeEnv();
    const res = await worker.fetch(req(DEMO, { cookie: `cct_session=${await signExpired()}` }), env, ctx);
    expect(res.status).toBe(302);
  });

  it('serves the asset for a valid token', async () => {
    const { env, ctx, assetFetch } = makeEnv();
    const res = await worker.fetch(req(DEMO, { cookie: `cct_session=${await signValid()}`, navigate: true }), env, ctx);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('demo bytes');
    expect(assetFetch).toHaveBeenCalledTimes(1);
  });

  it('logs exactly one demo_open for a navigation, none for sub-assets', async () => {
    const { env, ctx, restFetch, waits } = makeEnv();
    const cookie = `cct_session=${await signValid()}`;
    await worker.fetch(req(DEMO, { cookie, navigate: true }), env, ctx);
    await worker.fetch(req(`${DEMO}assets/app.js`, { cookie }), env, ctx);
    await Promise.all(waits);
    expect(restFetch).toHaveBeenCalledTimes(1);
    const [url, init] = restFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(url)).toBe(`${SUPABASE_URL}/rest/v1/demo_events`);
    const headers = new Headers(init.headers);
    expect(headers.get('authorization')).toContain('Bearer ');
    expect(headers.get('apikey')).toBe('anon-key');
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ event: 'demo_open', slug: 'span-calculator', user_id: 'user-123' });
  });

  it('a failing events write never affects the response', async () => {
    const { env, ctx, waits } = makeEnv();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('supabase down'); }));
    const res = await worker.fetch(req(DEMO, { cookie: `cct_session=${await signValid()}`, navigate: true }), env, ctx);
    expect(res.status).toBe(200);
    await expect(Promise.all(waits)).resolves.toBeDefined();
  });

  it('fails closed (503) when JWKS is unreachable', async () => {
    const { env, ctx, assetFetch } = makeEnv();
    setJwksForTesting((() => { throw new TypeError('fetch failed'); }) as never);
    const res = await worker.fetch(req(DEMO, { cookie: `cct_session=${await signValid()}` }), env, ctx);
    expect(res.status).toBe(503);
    expect(assetFetch).not.toHaveBeenCalled();
  });
});

describe('/api/session', () => {
  it('mints an HttpOnly cookie for a valid token', async () => {
    const { env, ctx } = makeEnv();
    // fresh jwks (previous test poisoned it)
    const { publicKey, privateKey } = await generateKeyPair('ES256');
    const jwk = { ...(await exportJWK(publicKey)), kid: 'k2', alg: 'ES256' };
    setJwksForTesting(createLocalJWKSet({ keys: [jwk] }));
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: 'k2' })
      .setSubject('user-9')
      .setIssuer(`${SUPABASE_URL}/auth/v1`)
      .setExpirationTime('1h')
      .sign(privateKey);
    const res = await worker.fetch(
      req('https://x.dev/api/session', { method: 'POST', body: JSON.stringify({ access_token: token }) }),
      env, ctx,
    );
    expect(res.status).toBe(204);
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toContain('cct_session=');
    expect(cookie).toContain('HttpOnly');
  });

  it('401s an invalid token without setting a cookie', async () => {
    const { env, ctx } = makeEnv();
    const res = await worker.fetch(
      req('https://x.dev/api/session', { method: 'POST', body: JSON.stringify({ access_token: 'garbage' }) }),
      env, ctx,
    );
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  it('DELETE clears the cookie', async () => {
    const { env, ctx } = makeEnv();
    const res = await worker.fetch(req('https://x.dev/api/session', { method: 'DELETE' }), env, ctx);
    expect(res.status).toBe(204);
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('405s other methods', async () => {
    const { env, ctx } = makeEnv();
    const res = await worker.fetch(req('https://x.dev/api/session', { method: 'GET' }), env, ctx);
    expect(res.status).toBe(405);
  });

  it('unknown /api/* is 404', async () => {
    const { env, ctx } = makeEnv();
    const res = await worker.fetch(req('https://x.dev/api/nope', { method: 'GET' }), env, ctx);
    expect(res.status).toBe(404);
  });
});
