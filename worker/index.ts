/// <reference types="@cloudflare/workers-types" />

import { InvalidTokenError, JwksUnavailableError, readCookie, verifyToken } from './auth';
import { handleSession } from './session';
import { isNavigation, logDemoOpen } from './events';

export interface Env {
  ASSETS: Fetcher;
  /** Canonical production hostname. Any other hostname is a staging origin. */
  PRODUCTION_HOSTNAME: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const DEMO_PATH = /^\/projects\/([a-z0-9-]+)\/demo\//;

/**
 * This handler runs only for `run_worker_first` paths (/api/*, the demo
 * gate) and asset misses; every ordinary page is served at the edge.
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/session' || url.pathname === '/api/session/') {
      return handleSession(request, env);
    }
    if (url.pathname.startsWith('/api/')) {
      return new Response('not found', { status: 404 });
    }

    const demo = url.pathname.match(DEMO_PATH);
    if (demo) return gate(request, env, ctx, url, demo[1]);

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

function signinRedirect(url: URL, slug: string): Response {
  const dest = new URL(`/projects/${slug}/`, url);
  dest.searchParams.set('signin', '1');
  dest.searchParams.set('next', url.pathname);
  return Response.redirect(dest.toString(), 302);
}

async function gate(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL,
  slug: string,
): Promise<Response> {
  // Misconfiguration must fail closed, never open.
  if (!env.SUPABASE_URL) return new Response('auth unavailable', { status: 503 });

  const token = readCookie(request);
  if (!token) return signinRedirect(url, slug);

  try {
    const payload = await verifyToken(token, env.SUPABASE_URL);
    if (isNavigation(request) && typeof payload.sub === 'string') {
      logDemoOpen(env, ctx, { token, userId: payload.sub, slug, request });
    }
    return env.ASSETS.fetch(request);
  } catch (err) {
    if (err instanceof InvalidTokenError) return signinRedirect(url, slug);
    if (err instanceof JwksUnavailableError) return new Response('auth unavailable', { status: 503 });
    throw err;
  }
}
