import { beforeAll, describe, expect, it } from 'vitest';
import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet } from 'jose';
import {
  verifyToken,
  mintCookie,
  clearCookie,
  safeNext,
  InvalidTokenError,
  JwksUnavailableError,
  type Verifier,
} from './auth';

const SUPABASE_URL = 'https://demo-ref.supabase.co';
const ISSUER = `${SUPABASE_URL}/auth/v1`;

let jwks: Verifier['jwks'];
let sign: (mutate?: (jwt: SignJWT) => SignJWT) => Promise<string>;
let wrongKeySign: () => Promise<string>;

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const { privateKey: strangerKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'ES256' };
  jwks = createLocalJWKSet({ keys: [jwk] });

  sign = (mutate = (j) => j) =>
    mutate(
      new SignJWT({ email: 'v@example.com' })
        .setProtectedHeader({ alg: 'ES256', kid: 'k1' })
        .setSubject('user-123')
        .setIssuer(ISSUER)
        .setIssuedAt()
        .setExpirationTime('1h'),
    ).sign(privateKey);

  wrongKeySign = () =>
    new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: 'k1' })
      .setSubject('user-123')
      .setIssuer(ISSUER)
      .setExpirationTime('1h')
      .sign(strangerKey);
});

describe('verifyToken', () => {
  it('accepts a valid token and returns the subject', async () => {
    const payload = await verifyToken(await sign(), SUPABASE_URL, jwks);
    expect(payload.sub).toBe('user-123');
  });

  it('rejects an expired token as invalid', async () => {
    const token = await sign((j) => j.setExpirationTime('-1h'));
    await expect(verifyToken(token, SUPABASE_URL, jwks)).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects a forged signature as invalid', async () => {
    await expect(verifyToken(await wrongKeySign(), SUPABASE_URL, jwks)).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects a wrong issuer as invalid', async () => {
    const token = await sign((j) => j.setIssuer('https://evil.example/auth/v1'));
    await expect(verifyToken(token, SUPABASE_URL, jwks)).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects garbage as invalid', async () => {
    await expect(verifyToken('not-a-jwt', SUPABASE_URL, jwks)).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('maps JWKS transport failure to JwksUnavailableError (the 503 path)', async () => {
    const downJwks = (() => { throw new TypeError('fetch failed'); }) as unknown as Verifier['jwks'];
    await expect(verifyToken(await sign(), SUPABASE_URL, downJwks)).rejects.toBeInstanceOf(JwksUnavailableError);
  });
});

describe('cookies', () => {
  it('mints an HttpOnly, Secure, Lax, path=/ session cookie', () => {
    const c = mintCookie('tok.abc', 3600);
    expect(c).toContain('cct_session=tok.abc');
    for (const attr of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=3600']) {
      expect(c).toContain(attr);
    }
  });

  it('clears with Max-Age=0', () => {
    expect(clearCookie()).toContain('cct_session=;');
    expect(clearCookie()).toContain('Max-Age=0');
  });
});

describe('safeNext', () => {
  it('accepts a demo path', () => {
    expect(safeNext('/projects/span-calculator/demo/')).toBe('/projects/span-calculator/demo/');
  });
  it('accepts a project landing page', () => {
    expect(safeNext('/projects/span-calculator/')).toBe('/projects/span-calculator/');
  });
  it.each([
    'https://evil.example/',
    '//evil.example/x',
    '/about/',
    '/projects/',
    '/projects/covers/x.png',
    '/projects/UPPER/demo/',
    '',
  ])('rejects %s', (raw) => {
    expect(safeNext(raw)).toBeNull();
  });
});
