/// <reference types="@cloudflare/workers-types" />

/**
 * GET /api/search?q=<text> — semantic half of the AI News hybrid search.
 *
 * Embeds the query with Workers AI (bge-base, 768 d), queries the Vectorize
 * index, collapses chunk hits to their best-scoring post, and returns only
 * post ids + scores: the browser already holds titles and excerpts. Responses
 * are cached by normalized query for an hour, in the Worker (Cache API) and
 * at the edge (Cache-Control). Any upstream failure — including the Free
 * plan's daily allocation running out, which FAILS the call rather than
 * billing — is a 503 the client treats as "keyword-only for now". The query
 * text is never logged.
 */
export interface SearchEnv {
  AI?: Ai;
  VECTORIZE?: Vectorize;
}

export interface CacheLike {
  match(req: Request): Promise<Response | undefined>;
  put(req: Request, res: Response): Promise<void>;
}

export const MODEL = '@cf/baai/bge-base-en-v1.5';
const TOP_K = 20;
const MAX_QUERY = 200;
const TTL_SECONDS = 3600;

export function normalizeQuery(raw: string | null): string | null {
  if (!raw) return null;
  const q = raw.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, MAX_QUERY);
  return q.length ? q : null;
}

/** `<postId>#<n>` → best score per postId, descending. */
export function collapseMatches(matches: { id: string; score: number }[]): { id: string; score: number }[] {
  const best = new Map<string, number>();
  for (const m of matches) {
    const id = m.id.split('#')[0];
    if ((best.get(id) ?? -Infinity) < m.score) best.set(id, m.score);
  }
  return Array.from(best.entries(), ([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
}

function defaultCache(): CacheLike | undefined {
  const c = (globalThis as unknown as { caches?: { default: CacheLike } }).caches;
  return c?.default;
}

export async function handleSearch(
  request: Request,
  env: SearchEnv,
  ctx: ExecutionContext,
  cache: CacheLike | undefined = defaultCache(),
): Promise<Response> {
  if (request.method !== 'GET') return new Response('method not allowed', { status: 405, headers: { allow: 'GET' } });
  const q = normalizeQuery(new URL(request.url).searchParams.get('q'));
  if (!q) return Response.json({ error: 'q is required' }, { status: 400 });

  const cacheKey = new Request(new URL(`/api/search?q=${encodeURIComponent(q)}`, request.url).toString(), { method: 'GET' });
  const hit = await cache?.match(cacheKey);
  if (hit) return hit;

  if (!env.AI || !env.VECTORIZE) return unavailable();

  const started = Date.now();
  try {
    const emb = (await env.AI.run(MODEL, { text: [q] })) as { data: number[][] };
    const { matches } = await env.VECTORIZE.query(emb.data[0], { topK: TOP_K, returnMetadata: 'none' });
    const results = collapseMatches(matches);
    console.log(JSON.stringify({ event: 'search', results: results.length, ms: Date.now() - started }));
    const res = Response.json({ results }, { headers: { 'cache-control': `public, max-age=${TTL_SECONDS}` } });
    if (cache) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    console.log(JSON.stringify({ event: 'search_error', message: (err as Error).message.slice(0, 200) }));
    return unavailable();
  }
}

function unavailable(): Response {
  return Response.json({ error: 'search unavailable' }, { status: 503, headers: { 'retry-after': '60', 'cache-control': 'no-store' } });
}
