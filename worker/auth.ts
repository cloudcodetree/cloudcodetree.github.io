/// <reference types="@cloudflare/workers-types" />
// Auth core for the demo gate. Verifies Supabase ES256 access tokens against
// the project's public JWKS — no Supabase secret exists in Worker env, ever.
// (The service-role key must never appear here; enforcement lives in RLS.)

import { createRemoteJWKSet, jwtVerify, errors as joseErrors, type JWTPayload, type JWTVerifyGetKey } from 'jose';

/** Auth failed because the token is bad — redirect the visitor to sign in. */
export class InvalidTokenError extends Error {}
/** Auth could not run because JWKS is unreachable — fail closed with a 503. */
export class JwksUnavailableError extends Error {}

export interface Verifier {
  /** Key resolver — the remote JWKS in production, a local set in tests. */
  jwks: JWTVerifyGetKey;
}

// One remote JWKS per isolate; jose caches keys + handles rotation internally.
let remoteJwks: JWTVerifyGetKey | null = null;
function defaultJwks(supabaseUrl: string) {
  remoteJwks ??= createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', supabaseUrl));
  return remoteJwks;
}

const VALIDATION_ERRORS = [
  joseErrors.JWTExpired,
  joseErrors.JWTClaimValidationFailed,
  joseErrors.JWSSignatureVerificationFailed,
  joseErrors.JWSInvalid,
  joseErrors.JWTInvalid,
  joseErrors.JWKSNoMatchingKey,
  joseErrors.JOSEAlgNotAllowed,
];

export async function verifyToken(
  token: string,
  supabaseUrl: string,
  jwks: Verifier['jwks'] = defaultJwks(supabaseUrl),
): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${supabaseUrl}/auth/v1`,
      algorithms: ['ES256'],
    });
    return payload;
  } catch (err) {
    // Bad token → sign-in redirect; anything else (JWKS transport/parse
    // trouble) → fail CLOSED via a distinct error the router turns into 503.
    if (VALIDATION_ERRORS.some((E) => err instanceof E)) {
      throw new InvalidTokenError((err as Error).message);
    }
    throw new JwksUnavailableError((err as Error).message);
  }
}

export const COOKIE = 'cct_session';

export function mintCookie(token: string, maxAgeSeconds: number): string {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearCookie(): string {
  return `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function readCookie(request: Request): string | null {
  const header = request.headers.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE && v.length) return v.join('=');
  }
  return null;
}

/** Open-redirect guard: only same-origin demo paths survive. */
export function safeNext(raw: string): string | null {
  return /^\/projects\/[a-z0-9-]+\/demo\//.test(raw) ? raw : null;
}
