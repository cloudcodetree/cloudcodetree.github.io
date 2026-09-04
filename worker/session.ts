/// <reference types="@cloudflare/workers-types" />
// POST /api/session — the only writer of the HttpOnly session cookie.
// JavaScript cannot set an HttpOnly cookie, which is exactly the point: the
// browser hands supabase-js's access token to this endpoint once, and from
// then on the token rides in a cookie XSS cannot read.

import { InvalidTokenError, JwksUnavailableError, clearCookie, mintCookie, verifyToken } from './auth';

export interface SessionEnv {
  SUPABASE_URL: string;
}

const MAX_AGE_CAP = 3600;

export async function handleSession(request: Request, env: SessionEnv): Promise<Response> {
  if (request.method === 'DELETE') {
    return new Response(null, { status: 204, headers: { 'set-cookie': clearCookie() } });
  }
  if (request.method !== 'POST') {
    return new Response('method not allowed', { status: 405, headers: { allow: 'POST, DELETE' } });
  }

  let token: unknown;
  try {
    token = (await request.json<{ access_token?: unknown }>()).access_token;
  } catch {
    return new Response('bad request', { status: 400 });
  }
  if (typeof token !== 'string' || token.length === 0 || token.length > 8192) {
    return new Response('bad request', { status: 400 });
  }

  try {
    const payload = await verifyToken(token, env.SUPABASE_URL);
    // Cookie lifetime follows the token's, capped at an hour.
    const ttl = Math.min(MAX_AGE_CAP, Math.max(0, (payload.exp ?? 0) - Math.floor(Date.now() / 1000)));
    return new Response(null, { status: 204, headers: { 'set-cookie': mintCookie(token, ttl) } });
  } catch (err) {
    if (err instanceof InvalidTokenError) return new Response('invalid token', { status: 401 });
    if (err instanceof JwksUnavailableError) return new Response('auth unavailable', { status: 503 });
    throw err;
  }
}
