import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  process.env.CLOUDFLARE_API_TOKEN = 'test-token';
  process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
  vi.resetModules();
});
afterEach(() => { vi.unstubAllGlobals(); });

const ok = (result) => new Response(JSON.stringify({ success: true, result }), { status: 200, headers: { 'content-type': 'application/json' } });

describe('embed', () => {
  it('posts batches of 50 to Workers AI and concatenates the vectors', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(init.body) });
      return ok({ shape: [calls.at(-1).body.text.length, 2], data: calls.at(-1).body.text.map((_, i) => [i, i]) });
    }));
    const { embed } = await import('./cf-search.mjs');
    const out = await embed(Array.from({ length: 70 }, (_, i) => `t${i}`));
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toBe('https://api.cloudflare.com/client/v4/accounts/acct/ai/run/@cf/baai/bge-base-en-v1.5');
    expect(calls[0].body.text).toHaveLength(50);
    expect(out).toHaveLength(70);
  });

  it('retries a 5xx after a 1000 ms backoff then succeeds', async () => {
    vi.useFakeTimers();
    try {
      let n = 0;
      vi.stubGlobal('fetch', vi.fn(async () => (n++ === 0 ? new Response('boom', { status: 503 }) : ok({ data: [[1]] }))));
      const { embed } = await import('./cf-search.mjs');
      const p = embed(['x']);
      await vi.advanceTimersByTimeAsync(999);
      expect(n).toBe(1);
      await vi.advanceTimersByTimeAsync(1);
      await expect(p).resolves.toEqual([[1]]);
      expect(n).toBe(2);
    } finally { vi.useRealTimers(); }
  });

  it('rejects a non-JSON 2xx body with a clear error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>oops</html>', { status: 200 })));
    const { embed } = await import('./cf-search.mjs');
    await expect(embed(['x'])).rejects.toThrow(/non-JSON body/);
  });
});

describe('vectorize', () => {
  it('upserts ndjson lines', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => { calls.push({ url: String(url), init }); return ok({ mutationId: 'm' }); }));
    const { vectorizeUpsert } = await import('./cf-search.mjs');
    await vectorizeUpsert([{ id: 'a#0', values: [1, 2], metadata: { postId: 'a' } }, { id: 'b#0', values: [3, 4], metadata: { postId: 'b' } }]);
    expect(calls[0].url).toBe('https://api.cloudflare.com/client/v4/accounts/acct/vectorize/v2/indexes/cct-search/upsert');
    expect(calls[0].init.headers['content-type']).toBe('application/x-ndjson');
    expect(calls[0].init.body.trim().split('\n').map((l) => JSON.parse(l).id)).toEqual(['a#0', 'b#0']);
  });

  it('delete is a no-op on an empty list', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const { vectorizeDelete } = await import('./cf-search.mjs');
    await vectorizeDelete([]);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('manifest', () => {
  it('getManifest returns null on 404 and parses JSON on 200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));
    let mod = await import('./cf-search.mjs');
    expect(await mod.getManifest()).toBeNull();
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ version: 1, posts: {} }), { status: 200 })));
    mod = await import('./cf-search.mjs');
    expect(await mod.getManifest()).toEqual({ version: 1, posts: {} });
  });

  it('putManifest writes a FLAT key (a "/" would be percent-encoded and read back as a 404)', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => { calls.push({ url: String(url), init }); return ok({}); }));
    const { putManifest, MANIFEST_KEY } = await import('./cf-search.mjs');
    expect(MANIFEST_KEY).not.toContain('/');
    await putManifest({ version: 1, posts: {} });
    expect(calls[0].url).toBe('https://api.cloudflare.com/client/v4/accounts/acct/r2/buckets/cct-blog-images/objects/search-manifest.json');
  });
});

describe('related mirror', () => {
  it('getRelated returns null on 404 and parses JSON on 200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));
    let mod = await import('./cf-search.mjs');
    expect(await mod.getRelated()).toBeNull();
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ a: ['b'] }), { status: 200 })));
    mod = await import('./cf-search.mjs');
    expect(await mod.getRelated()).toEqual({ a: ['b'] });
  });

  it('getRelated throws on any other non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('boom', { status: 500 })));
    const { getRelated } = await import('./cf-search.mjs');
    await expect(getRelated()).rejects.toThrow(/related: HTTP 500/);
  });

  it('putRelated PUTs the flat object key with no-cache', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => { calls.push({ url: String(url), init }); return ok({}); }));
    const { putRelated } = await import('./cf-search.mjs');
    await putRelated({ a: ['b'] });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.cloudflare.com/client/v4/accounts/acct/r2/buckets/cct-blog-images/objects/search-related.json');
    expect(calls[0].init.method).toBe('PUT');
    expect(calls[0].init.headers['cache-control']).toBe('no-cache');
    expect(calls[0].init.headers['content-type']).toBe('application/json');
    expect(calls[0].init.body).toBe('{"a":["b"]}');
  });
});
