import { describe, expect, it, vi } from 'vitest';
import { handleFeed, parseTopics, type FeedEnv } from './feed';
import type { CacheLike } from './search';

const ctx = { waitUntil: (p: Promise<unknown>) => { void p; } } as unknown as ExecutionContext;

function fakeCache(): CacheLike & { store: Map<string, Response> } {
  const store = new Map<string, Response>();
  return {
    store,
    match: async (req) => store.get(req.url)?.clone(),
    put: async (req, res) => { store.set(req.url, res.clone()); },
  };
}

// ---- fixtures: the per-topic feeds generate-feeds.mjs writes ---------------

const RSS_HEAD = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>`;

/** s-* are the newest (March), then b-* (February), then a-* (January). */
function pubDateFor(guid: string): string {
  const [prefix, n] = guid.split('-');
  const month = prefix === 's' ? 2 : prefix === 'b' ? 1 : 0;
  return new Date(Date.UTC(2026, month, Number(n), 12)).toUTCString();
}

function item(guid: string): string {
  return `  <item>
    <title><![CDATA[Post ${guid}]]></title>
    <link>https://cloudcodetree.com/ai-news/${guid}/</link>
    <guid isPermaLink="false">${guid}</guid>
    <pubDate>${pubDateFor(guid)}</pubDate>
    <dc:creator><![CDATA[Chris Harper]]></dc:creator>
    <description><![CDATA[excerpt for ${guid}]]></description>
  </item>`;
}

function topicFeed(tag: string, slug: string, guids: string[]): string {
  return `${RSS_HEAD}
    <title>${tag} · AI News · CloudCodeTree</title>
    <link>https://cloudcodetree.com/ai-news/topic/${slug}/</link>
    <atom:link href="https://cloudcodetree.com/ai-news/topic/${slug}/feed.xml" rel="self" type="application/rss+xml" />
    <description>AI News posts tagged ${tag}.</description>
    <language>en-us</language>
    <generator>cloudcodetree generate-feeds.mjs</generator>
    <lastBuildDate>Mon, 08 Sep 2026 00:00:00 GMT</lastBuildDate>
${guids.map(item).join('\n')}
  </channel>
</rss>
`;
}

const nn = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1).padStart(2, '0'));
const SHARED = nn(5).map((n) => `s-${n}`);          // in BOTH topic feeds
const ONLY_A = nn(10).map((n) => `a-${n}`);
const ONLY_B = nn(10).map((n) => `b-${n}`);

const STATIC_FEEDS: Record<string, string> = {
  'claude-code': topicFeed('Claude Code', 'claude-code', SHARED.concat(ONLY_A)),
  security: topicFeed('Security', 'security', SHARED.concat(ONLY_B)),
  // A feed that breaks the item-boundary assumption: a post body quoting the
  // literal string <item> swallows the real boundary and loses posts silently.
  poisoned: topicFeed('Poisoned', 'poisoned', ['a-01']).replace(
    'excerpt for a-01',
    'an RSS <item> looks like this',
  ),
};

function stubEnv(): FeedEnv & { assetFetch: ReturnType<typeof vi.fn> } {
  const assetFetch = vi.fn(async (req: Request) => {
    const { pathname } = new URL(req.url);
    const m = pathname.match(/^\/ai-news\/topic\/([^/]+)\/feed\.xml$/);
    const body = m ? STATIC_FEEDS[m[1]] : undefined;
    if (!body) {
      // Every other path: the static /ai-news/feed.xml, or a real miss.
      if (pathname === '/ai-news/feed.xml') {
        return new Response('<rss>static</rss>', { status: 200, headers: { 'content-type': 'application/rss+xml' } });
      }
      return new Response('not found', { status: 404 });
    }
    return new Response(body, { status: 200, headers: { 'content-type': 'application/rss+xml' } });
  });
  return { assetFetch, ASSETS: { fetch: assetFetch } as unknown as Fetcher };
}

const req = (query = '', method = 'GET') =>
  new Request(`https://cloudcodetree.com/ai-news/feed.xml${query}`, { method });

const guidsOf = (xml: string) => Array.from(xml.matchAll(/<guid[^>]*>([^<]+)<\/guid>/g), (m) => m[1]);

describe('parseTopics', () => {
  it('trims, lowercases, drops empties, dedupes and sorts', () => {
    expect(parseTopics(' Security ,claude-code')).toEqual({ kind: 'ok', slugs: ['claude-code', 'security'] });
    expect(parseTopics('security,,security')).toEqual({ kind: 'ok', slugs: ['security'] });
  });

  it('treats a missing or empty parameter as "no filter"', () => {
    expect(parseTopics(null)).toEqual({ kind: 'none' });
    expect(parseTopics('')).toEqual({ kind: 'none' });
    expect(parseTopics('  , ,')).toEqual({ kind: 'none' });
  });

  it('rejects non-slug input and more than ten topics', () => {
    expect(parseTopics('Claude Code')).toEqual({ kind: 'invalid' });
    expect(parseTopics('claude--code')).toEqual({ kind: 'invalid' });
    expect(parseTopics('-security')).toEqual({ kind: 'invalid' });
    expect(parseTopics('a,b,c,d,e,f,g,h,i,j,k')).toEqual({ kind: 'invalid' });
  });
});

describe('handleFeed', () => {
  it('serves the static file untouched when no topics are given', async () => {
    const env = stubEnv();
    const request = req();
    const res = await handleFeed(request, env, ctx, fakeCache());
    expect(env.assetFetch).toHaveBeenCalledTimes(1);
    expect(env.assetFetch.mock.calls[0][0]).toBe(request);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<rss>static</rss>');
  });

  it('405 on a non-GET request', async () => {
    const res = await handleFeed(req('?topics=security', 'POST'), stubEnv(), ctx, fakeCache());
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET');
  });

  it('400 on an invalid slug or more than ten topics', async () => {
    const bad = await handleFeed(req('?topics=Claude%20Code'), stubEnv(), ctx, fakeCache());
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: 'invalid topics' });
    const many = await handleFeed(req('?topics=a,b,c,d,e,f,g,h,i,j,k'), stubEnv(), ctx, fakeCache());
    expect(many.status).toBe(400);
  });

  it('merges two topic feeds: dedupes shared guids, newest first, capped at 20', async () => {
    const env = stubEnv();
    const res = await handleFeed(req('?topics=claude-code,security'), env, ctx, fakeCache());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8');
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
    const body = await res.text();
    const guids = guidsOf(body);
    // 25 distinct posts across the two feeds; the newest 20 survive.
    expect(guids.length).toBe(20);
    expect(guids[0]).toBe('s-05');
    expect(guids[guids.length - 1]).toBe('a-06');
    expect(guids.filter((g) => g === 's-01')).toEqual(['s-01']);   // shared, kept once
    expect(guids).not.toContain('a-05');                            // trimmed by the cap
    expect(body).toContain('<title>AI News · Claude Code + Security · CloudCodeTree</title>');
    expect(body).toContain('<description>AI News posts tagged Claude Code or Security.</description>');
    expect(body).toContain('<atom:link href="https://cloudcodetree.com/ai-news/feed.xml?topics=claude-code,security" rel="self" type="application/rss+xml" />');
    expect(body).toContain('<link>https://cloudcodetree.com/</link>');
    expect(body).toContain('xmlns:media="http://search.yahoo.com/mrss/"');
    expect(body).toContain('<generator>cloudcodetree worker/feed.ts</generator>');
  });

  it('skips an unknown topic but still serves the known one', async () => {
    const env = stubEnv();
    const res = await handleFeed(req('?topics=security,not-a-topic'), env, ctx, fakeCache());
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(guidsOf(body)).toEqual(SHARED.concat(ONLY_B).slice().sort().reverse().slice(0, 20));
    expect(body).toContain('<title>AI News · Security · CloudCodeTree</title>');
  });

  it('404 when every topic is unknown', async () => {
    const res = await handleFeed(req('?topics=nope,also-nope'), stubEnv(), ctx, fakeCache());
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'no such topics' });
  });

  it('503s rather than silently dropping items when a body contains a literal <item>', async () => {
    const res = await handleFeed(req('?topics=poisoned'), stubEnv(), ctx, fakeCache());
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('60');
  });

  it('serves a cache hit without touching the assets binding', async () => {
    const env = stubEnv();
    const cache = fakeCache();
    const first = await handleFeed(req('?topics=claude-code,security'), env, ctx, cache);
    const firstBody = await first.text();
    expect(env.assetFetch).toHaveBeenCalledTimes(2);
    const second = await handleFeed(req('?topics=claude-code,security'), env, ctx, cache);
    expect(env.assetFetch).toHaveBeenCalledTimes(2);
    expect(await second.text()).toBe(firstBody);
  });

  it('normalizes before caching, so a messy query hits the same entry', async () => {
    const env = stubEnv();
    const cache = fakeCache();
    await handleFeed(req('?topics=claude-code,security'), env, ctx, cache);
    await handleFeed(req('?topics=%20Security%20,claude-code'), env, ctx, cache);
    expect(env.assetFetch).toHaveBeenCalledTimes(2);
    expect(Array.from(cache.store.keys())).toEqual([
      'https://cloudcodetree.com/ai-news/feed.xml?topics=claude-code,security',
    ]);
  });
});

it('keeps tutorial topic feeds and cache keys separate from AI News', async () => {
  const cache = fakeCache();
  const env = stubEnv();
  await handleFeed(req('?topics=security'), env, ctx, cache);
  const source = topicFeed('Security', 'security', ['a-01']).replaceAll('AI News', 'Tutorials').replaceAll('/ai-news/', '/tutorials/');
  const fetcher = vi.fn(async () => new Response(source));
  const tutorialEnv = { ASSETS: { fetch: fetcher } as unknown as Fetcher };
  const response = await handleFeed(new Request('https://cloudcodetree.com/tutorials/feed.xml?topics=security'), tutorialEnv, ctx, cache);
  expect(fetcher.mock.calls.length).toBe(1);
  const body = await response.text();
  expect(body).toContain('<title>Tutorials · Security · CloudCodeTree</title>');
  expect(body).toContain('<link>https://cloudcodetree.com/tutorials/</link>');
  expect(body).not.toContain('AI News');
  expect(Array.from(cache.store.keys())).toEqual([
    'https://cloudcodetree.com/ai-news/feed.xml?topics=security',
    'https://cloudcodetree.com/tutorials/feed.xml?topics=security',
  ]);
});
