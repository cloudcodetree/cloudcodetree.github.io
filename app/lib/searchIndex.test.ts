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

// The Worker records a miss only for intent=submit, because the file it feeds is
// committed to a public repo and typeahead fragments must not be published.
describe('hybridSearch intent', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

  const stub = () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).endsWith('/blog/search-index.json')) {
        return new Response(JSON.stringify([{ id: 'a', title: 'Claude Code tips', excerpt: '', tags: ['AI'], date: '09-07-2026' }]), { status: 200, headers: { 'content-type': 'application/json' } });
      }
      return new Response(JSON.stringify({ results: [{ id: 'a', score: 0.8 }] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  };
  const searchUrl = (m: ReturnType<typeof stub>) =>
    String(m.mock.calls.map(([u]) => String(u)).find((u) => u.includes('/api/search')));

  it('marks a deliberate search with intent=submit', async () => {
    const fetchMock = stub();
    const { hybridSearch } = await import('./searchIndex');
    await hybridSearch('claude', { deliberate: true });
    expect(searchUrl(fetchMock)).toBe('/api/search?q=claude&intent=submit');
  });

  it('leaves a typeahead search unmarked', async () => {
    const fetchMock = stub();
    const { hybridSearch } = await import('./searchIndex');
    await hybridSearch('claude');
    expect(searchUrl(fetchMock)).toBe('/api/search?q=claude');
  });
});
