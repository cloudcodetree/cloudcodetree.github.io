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

// Gated: /projects/<slug>/ (landing page) and /projects/<slug>/demo/*.
// Public: the gallery (/projects/) and its cover images (/projects/covers/*).
const GATED_PATH = /^\/projects\/(?!covers\/)([a-z0-9-]+)\/(demo\/)?/;

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

    const gated = url.pathname.match(GATED_PATH);
    if (gated) return gate(request, env, ctx, url, gated[1], !!gated[2]);

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

// Sign-in lives in the site chrome; the gallery is the public page that hosts
// the ?signin=1 handler, so every gated path bounces there with `next`.
function signinRedirect(url: URL): Response {
  const dest = new URL('/projects/', url);
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
  isDemo: boolean,
): Promise<Response> {
  // Misconfiguration must fail closed, never open.
  if (!env.SUPABASE_URL) return new Response('auth unavailable', { status: 503 });

  const token = readCookie(request);
  if (!token) return signinRedirect(url);

  try {
    const payload = await verifyToken(token, env.SUPABASE_URL);
    // Analytics: only demo opens are events; landing-page views are not.
    if (isDemo && isNavigation(request) && typeof payload.sub === 'string') {
      logDemoOpen(env, ctx, { token, userId: payload.sub, slug, request });
    }
    return env.ASSETS.fetch(request);
  } catch (err) {
    if (err instanceof InvalidTokenError) return signinRedirect(url);
    if (err instanceof JwksUnavailableError) return new Response('auth unavailable', { status: 503 });
    throw err;
  }
}
