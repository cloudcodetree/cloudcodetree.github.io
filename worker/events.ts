/// <reference types="@cloudflare/workers-types" />
// Append-only analytics writes, made AS THE VISITOR: their verified JWT goes in
// the Authorization header and RLS enforces user_id = auth.uid(). No service
// key exists in this Worker, so there is no bypass-everything credential.

export interface EventsEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

/** True for the request that represents a person opening the demo, not the
 * ~30 sub-asset fetches a page load fans out into. */
export function isNavigation(request: Request): boolean {
  return request.headers.get('sec-fetch-mode') === 'navigate';
}

export function logDemoOpen(
  env: EventsEnv,
  ctx: ExecutionContext,
  args: { token: string; userId: string; slug: string; request: Request },
): void {
  ctx.waitUntil(
    fetch(`${env.SUPABASE_URL}/rest/v1/demo_events`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        authorization: `Bearer ${args.token}`,
        'content-type': 'application/json',
        prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event: 'demo_open',
        slug: args.slug,
        user_id: args.userId,
        country: args.request.headers.get('cf-ipcountry') ?? null,
        referrer: args.request.headers.get('referer') ?? null,
      }),
      // A slow or down Supabase must never delay serving the demo; errors are
      // swallowed — analytics is best-effort by design.
    }).catch(() => {}),
  );
}
