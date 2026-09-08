import { afterEach, describe, expect, it, vi } from 'vitest';

describe('hybridSearch with an already-aborted signal', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

  it('never starts the /api/search fetch and returns keyword-only', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).endsWith('/blog/search-index.json')) {
        return new Response(JSON.stringify([{ id: 'a', title: 'Claude Code tips', excerpt: '', tags: ['AI'], date: '09-07-2026' }]), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      if (init?.signal?.aborted) throw new DOMException('aborted', 'AbortError');
      return new Response(JSON.stringify({ results: [{ id: 'a', score: 1 }] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { hybridSearch } = await import('./searchIndex');
    const ctl = new AbortController();
    ctl.abort();
    const out = await hybridSearch('claude', { signal: ctl.signal });
    expect(out.semantic).toBe(false);
    expect(out.ids).toEqual(['a']);
    const apiCalls = fetchMock.mock.calls.filter(([u]) => String(u).includes('/api/search'));
    expect(apiCalls.every(([, init]) => init?.signal?.aborted)).toBe(true);
  });
});
