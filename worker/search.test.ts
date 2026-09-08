import { describe, expect, it, vi } from 'vitest';
import { collapseMatches, handleSearch, normalizeQuery, type CacheLike, type SearchEnv } from './search';

const ctx = { waitUntil: (p: Promise<unknown>) => { void p; } } as unknown as ExecutionContext;

function fakeCache(): CacheLike & { store: Map<string, Response> } {
  const store = new Map<string, Response>();
  return {
    store,
    match: async (req) => store.get(req.url)?.clone(),
    put: async (req, res) => { store.set(req.url, res.clone()); },
  };
}

function stubEnv(opts: { matches?: { id: string; score: number; metadata?: Record<string, unknown> }[]; aiError?: Error } = {}): SearchEnv & { ai: ReturnType<typeof vi.fn>; query: ReturnType<typeof vi.fn> } {
  const ai = vi.fn(async () => { if (opts.aiError) throw opts.aiError; return { shape: [1, 3], data: [[0.1, 0.2, 0.3]] }; });
  const query = vi.fn(async () => ({ matches: opts.matches ?? [{ id: 'p1#0', score: 0.9 }] }));
  return { ai, query, AI: { run: ai } as unknown as Ai, VECTORIZE: { query } as unknown as Vectorize };
}

const req = (q: string | null, method = 'GET') =>
  new Request(`https://cloudcodetree.com/api/search${q === null ? '' : `?q=${encodeURIComponent(q)}`}`, { method });

describe('normalizeQuery', () => {
  it('trims, collapses whitespace, lowercases, caps at 200', () => {
    expect(normalizeQuery('  Claude   Code ')).toBe('claude code');
    expect(normalizeQuery('')).toBeNull();
    expect(normalizeQuery(null)).toBeNull();
    expect(normalizeQuery('x'.repeat(300))!.length).toBe(200);
  });
});

describe('collapseMatches', () => {
  it('falls back to splitting the id when no postId metadata is present', () => {
    const out = collapseMatches([
      { id: 'a#1', score: 0.5 }, { id: 'b#0', score: 0.8 }, { id: 'a#0', score: 0.7 }, { id: 'c', score: 0.6 },
    ]);
    expect(out).toEqual([{ id: 'b', score: 0.8 }, { id: 'a', score: 0.7 }, { id: 'c', score: 0.6 }]);
  });

  it('prefers metadata.postId (real hashed ids collapse to the real post id)', () => {
    const out = collapseMatches([
      { id: 'aaaaaaaaaaaaaaaaaaaaaaaa#1', score: 0.5, metadata: { postId: 'post-a' } },
      { id: 'bbbbbbbbbbbbbbbbbbbbbbbb#0', score: 0.8, metadata: { postId: 'post-b' } },
      { id: 'aaaaaaaaaaaaaaaaaaaaaaaa#0', score: 0.7, metadata: { postId: 'post-a' } },
    ]);
    expect(out).toEqual([{ id: 'post-b', score: 0.8 }, { id: 'post-a', score: 0.7 }]);
  });
});

describe('handleSearch', () => {
  it('405 on non-GET, 400 on empty query', async () => {
    const env = stubEnv();
    expect((await handleSearch(req('x', 'POST'), env, ctx, fakeCache())).status).toBe(405);
    expect((await handleSearch(req(null), env, ctx, fakeCache())).status).toBe(400);
    expect((await handleSearch(req('   '), env, ctx, fakeCache())).status).toBe(400);
  });

  it('embeds, queries, collapses, and returns ids + scores with a 1h cache header', async () => {
    const env = stubEnv({ matches: [{ id: 'p1#0', score: 0.9 }, { id: 'p1#1', score: 0.4 }, { id: 'p2#0', score: 0.6 }] });
    const res = await handleSearch(req('rag'), env, ctx, fakeCache());
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
    expect(await res.json()).toEqual({ results: [{ id: 'p1', score: 0.9 }, { id: 'p2', score: 0.6 }] });
    expect(env.ai).toHaveBeenCalledWith('@cf/baai/bge-base-en-v1.5', { text: ['rag'] });
    expect(env.query).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ returnMetadata: 'all' }));
  });

  it('returns a post id longer than 64 bytes whole (Vectorize truncates the indexed projection there)', async () => {
    const longId = '2026-09-07-05-llamaindex-citation-query-engine-rag-attributed-answers';
    expect(longId.length).toBe(69);
    const env = stubEnv({ matches: [{ id: 'hash#0', score: 0.9, metadata: { postId: longId } }] });
    const res = await handleSearch(req('llamaindex citation query engine'), env, ctx, fakeCache());
    const body = (await res.json()) as { results: { id: string; score: number }[] };
    expect(body.results[0].id.length).toBe(69);
    expect(body.results[0].id).toBe(longId);
    // Guards the real bug: only 'all' returns untruncated metadata, so a
    // regression to the indexed projection fails this assertion.
    expect(env.query).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ returnMetadata: 'all' }));
  });

  it('serves a cache hit without calling the model', async () => {
    const env = stubEnv();
    const cache = fakeCache();
    await handleSearch(req('Rag'), env, ctx, cache);
    await handleSearch(req('rag  '), env, ctx, cache);
    expect(env.ai).toHaveBeenCalledTimes(1);
  });

  it('503 + Retry-After when the model fails or a binding is missing', async () => {
    const res = await handleSearch(req('x'), stubEnv({ aiError: new Error('3040: out of capacity') }), ctx, fakeCache());
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('60');
    const res2 = await handleSearch(req('x'), {} as SearchEnv, ctx, fakeCache());
    expect(res2.status).toBe(503);
  });

  it('503 (not 500) when the Cache API itself throws', async () => {
    const cache: CacheLike = {
      match: async () => { throw new Error('cache exploded'); },
      put: async () => {},
    };
    const res = await handleSearch(req('rag'), stubEnv(), ctx, cache);
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('60');
  });

  it('logs one search_miss carrying the normalized query when nothing matches, and none when something does', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logged = () => log.mock.calls.map((c) => JSON.parse(String(c[0])) as { event: string; q?: string });
    try {
      await handleSearch(req('  Zzqqxx   Nonexistent Topic '), stubEnv({ matches: [] }), ctx, fakeCache());
      expect(logged().filter((e) => e.event === 'search_miss')).toEqual([
        { event: 'search_miss', q: 'zzqqxx nonexistent topic' },
      ]);
      // The success log stays as it was: counts and latency, never the query.
      expect(logged().filter((e) => e.event === 'search')).toEqual([{ event: 'search', results: 0, ms: expect.any(Number) }]);

      log.mockClear();
      await handleSearch(req('rag'), stubEnv(), ctx, fakeCache());
      expect(logged().filter((e) => e.event === 'search_miss')).toEqual([]);
    } finally {
      log.mockRestore();
    }
  });
});
