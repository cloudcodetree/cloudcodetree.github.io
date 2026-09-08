/// <reference types="@cloudflare/workers-types" />

/**
 * GET /api/search?q=<text> — semantic half of the AI News hybrid search.
 *
 * Embeds the query with Workers AI (bge-base, 768 d), queries the Vectorize
 * index, collapses chunk hits to their best-scoring post, drops anything below
 * MIN_SCORE, and returns only post ids + scores: the browser already holds
 * titles and excerpts. Responses
 * are cached by normalized query for an hour, in the Worker (Cache API) and
 * at the edge (Cache-Control). Any upstream failure — including the Free
 * plan's daily allocation running out, which FAILS the call rather than
 * billing — is a 503 the client treats as "keyword-only for now".
 *
 * A successful search logs its count and latency and never its text. The one
 * exception is a DELIBERATE search (`intent=submit`) where nothing cleared the
 * floor: that logs the normalized query as `search_miss` so
 * scripts/harvest-search-misses.mjs can make it durable in a file committed to
 * a public repo. See logMiss() for the rules and
 * docs/superpowers/specs/2026-09-08-search-analytics-design.md for why.
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
/**
 * Cosine floor for a semantic match. Vectorize always returns topK, so
 * without this a nonsense query yields 20 irrelevant posts and never logs a
 * miss. Measured against the live index 2026-09-08: covered topics score
 * 0.706-0.854 (`vectorize`, a core topic here, tops out at 0.706), uncovered
 * and nonsense queries 0.516-0.657. The gap is therefore [0.657, 0.706] and
 * 0.68 sits near its middle — 0.70 would have left a core topic 0.006 of
 * headroom. Anything below this is "we have nothing on that", which is exactly
 * what a miss means. Search stays hybrid, so keyword hits still reach the
 * reader when the semantic half returns nothing.
 */
const MIN_SCORE = 0.68;

export function normalizeQuery(raw: string | null): string | null {
  if (!raw) return null;
  const q = raw.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, MAX_QUERY);
  return q.length ? q : null;
}

export function collapseMatches(
  matches: { id: string; score: number; metadata?: Record<string, unknown> }[],
): { id: string; score: number }[] {
  const best = new Map<string, number>();
  for (const m of matches) {
    // The vector id is a hash (Vectorize caps ids at 64 bytes); the real post
    // id rides in indexed metadata. The split is a fallback for older vectors.
    const postId = typeof m.metadata?.postId === 'string' ? m.metadata.postId : m.id.split('#')[0];
    if ((best.get(postId) ?? -Infinity) < m.score) best.set(postId, m.score);
  }
  return Array.from(best.entries(), ([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
}

/**
 * Write down one zero-result search — the only search text this codebase ever
 * records, and only for a DELIBERATE search (`intent=submit`), because
 * scripts/harvest-search-misses.mjs lands it in a file committed to a PUBLIC
 * repo. Typeahead fragments are therefore never recorded, and three cheap
 * guards drop anything that could carry something personal. `top` is the best
 * collapsed score before the floor, so the floor stays re-derivable from real
 * traffic; it is omitted when the answer came from cache and the scores are
 * no longer available.
 */
function logMiss(q: string, top: number | null): void {
  if (q.length < 3) return;
  if (/\S+@\S+/.test(q)) return; // email-ish
  if (/\d{7,}/.test(q)) return; // phone / card / account number
  console.log(JSON.stringify(top === null ? { event: 'search_miss', q } : { event: 'search_miss', q, top }));
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
  const url = new URL(request.url);
  const q = normalizeQuery(url.searchParams.get('q'));
  if (!q) return Response.json({ error: 'q is required' }, { status: 400 });
  // The results page sends intent=submit; the typeahead box does not.
  const deliberate = url.searchParams.get('intent') === 'submit';

  // Keyed on the query alone, deliberately: adding intent would double the
  // model calls for every search a reader submits after typing it.
  const cacheKey = new Request(new URL(`/api/search?q=${encodeURIComponent(q)}`, request.url).toString(), { method: 'GET' });

  if (!env.AI || !env.VECTORIZE) return unavailable();

  const started = Date.now();
  // The cache lookup lives inside the try on purpose: a throwing Cache API is
  // an upstream failure like any other, and must degrade to the 503 the client
  // reads as "keyword-only for now" — never an unhandled 500.
  try {
    const hit = await cache?.match(cacheKey);
    if (hit) {
      // A typeahead call for the same query usually fills the cache first, so
      // the deliberate search that follows returns from here — before the miss
      // check below ever runs. Read the cached body instead, or the searches
      // that matter most would be the only ones never recorded. Failing to
      // read it is not worth degrading a good response, so it stays silent.
      if (deliberate) {
        try {
          const cached = (await hit.clone().json()) as { results?: unknown[] };
          if (!cached.results || cached.results.length === 0) logMiss(q, null);
        } catch { /* unreadable cached body: nothing to record */ }
      }
      return hit;
    }
    const emb = (await env.AI.run(MODEL, { text: [q] })) as { data: number[][] };
    // Full metadata, not the indexed projection: Vectorize caps indexed
    // metadata at 64 bytes per field, and 14 of our post-id slugs are
    // longer, so 'indexed' silently truncates postId and the browser can't
    // hydrate the result. 'all' returns the complete stored metadata.
    const { matches } = await env.VECTORIZE.query(emb.data[0], { topK: TOP_K, returnMetadata: 'all' });
    // The floor lives here, not in collapseMatches: collapse stays a pure
    // best-score-per-post fold, relevance is a policy of the endpoint.
    const collapsed = collapseMatches(matches);
    const results = collapsed.filter((r) => r.score >= MIN_SCORE);
    console.log(JSON.stringify({ event: 'search', results: results.length, ms: Date.now() - started }));
    // See the privacy section of
    // docs/superpowers/specs/2026-09-08-search-analytics-design.md for what is
    // recorded and why; logMiss() holds the rules.
    if (results.length === 0 && deliberate) {
      logMiss(q, collapsed.length ? Number(collapsed[0].score.toFixed(3)) : 0);
    }
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
