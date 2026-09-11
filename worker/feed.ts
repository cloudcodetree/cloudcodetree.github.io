/// <reference types="@cloudflare/workers-types" />

import type { CacheLike } from './search';

/**
 * GET /{ai-news|tutorials}/feed.xml?topics=<slug,slug> — a reader feed for a multi-topic
 * selection made in the Topics flyout.
 *
 * Without `topics` this is the static file, byte for byte: the request goes
 * straight to the assets binding. With it, the Worker merges the per-topic
 * feeds `generate-feeds.mjs` already publishes at
 * /{ai-news|tutorials}/topic/<slug>/feed.xml — no posts.json in the Worker, no second
 * renderer to keep in sync with the item markup. Items are deduped by guid,
 * sorted newest-first, and capped like every other feed. Responses are cached
 * by the NORMALIZED selection for an hour, in the Worker (Cache API) and at
 * the edge (Cache-Control), so a shared subscription URL costs one build.
 */
export interface FeedEnv {
  ASSETS: Fetcher;
}

const MAX_TOPICS = 10;
const ITEM_LIMIT = 20;
const TTL_SECONDS = 3600;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TITLE_SUFFIX = ' · AI News · CloudCodeTree';

export type Topics =
  | { kind: 'none' }                    // no filter — serve the static file
  | { kind: 'ok'; slugs: string[] }
  | { kind: 'invalid' };

/** `" Security ,claude-code"` → `['claude-code', 'security']`. */
export function parseTopics(raw: string | null): Topics {
  if (!raw) return { kind: 'none' };
  const parts = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!parts.length) return { kind: 'none' };
  const slugs = Array.from(new Set(parts)).sort();
  if (slugs.length > MAX_TOPICS) return { kind: 'invalid' };
  if (!slugs.every((s) => SLUG.test(s))) return { kind: 'invalid' };
  return { kind: 'ok', slugs };
}

const uncdata = (s: string) => s.replace(/^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/, '$1').trim();
const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface FeedItem { guid: string; time: number; xml: string }

/**
 * Pull the tag name and the raw <item> blocks out of one of our own feeds.
 *
 * The input is ONLY ever a feed generate-feeds.mjs wrote, and item boundaries
 * are found with the literal strings `<item>` / `</item>`. That is safe purely
 * because that generator never emits those literals inside CDATA — a post body
 * quoting `<item>` would swallow a real boundary and silently drop posts from
 * the merged feed. The count check below turns that from a silent wrong answer
 * into a thrown error, which handleFeed reports as a 503.
 */
export function parseTopicFeed(body: string, slug: string): { tag: string; items: FeedItem[] } {
  const head = body.split('<item>')[0];
  const title = head.match(/<title>([\s\S]*?)<\/title>/);
  const tag = title ? uncdata(title[1]).replace(TITLE_SUFFIX, '').replace(' · Tutorials · CloudCodeTree', '').trim() || slug : slug;
  const items: FeedItem[] = [];
  const blocks = Array.from(body.matchAll(/<item>[\s\S]*?<\/item>/g), (m) => m[0]);
  const opens = (body.match(/<item>/g) || []).length;
  if (opens !== blocks.length) {
    // Deliberately no slug in the message: it is logged, and which topics a
    // reader asked for is theirs. The counts say what went wrong.
    throw new Error(`item boundary mismatch: ${opens} markers, ${blocks.length} parsed`);
  }
  for (const xml of blocks) {
    const guid = xml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);
    const pubDate = xml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    if (!guid) continue;
    const time = pubDate ? Date.parse(uncdata(pubDate[1])) : NaN;
    items.push({ guid: uncdata(guid[1]), time: isNaN(time) ? 0 : time, xml });
  }
  return { tag, items };
}

function channel({ title, desc, self, link, itemsXml, now }: {
  title: string; desc: string; self: string; link: string; itemsXml: string; now: string;
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xmlEscape(title)}</title>
    <link>${link}</link>
    <atom:link href="${xmlEscape(self)}" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(desc)}</description>
    <language>en-us</language>
    <generator>cloudcodetree worker/feed.ts</generator>
    <lastBuildDate>${now}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;
}

function defaultCache(): CacheLike | undefined {
  const c = (globalThis as unknown as { caches?: { default: CacheLike } }).caches;
  return c?.default;
}

export async function handleFeed(
  request: Request,
  env: FeedEnv,
  ctx: ExecutionContext,
  cache: CacheLike | undefined = defaultCache(),
): Promise<Response> {
  if (request.method !== 'GET') return new Response('method not allowed', { status: 405, headers: { allow: 'GET' } });

  const url = new URL(request.url);
  const section = url.pathname === '/tutorials/feed.xml' ? 'tutorials' : 'ai-news';
  const label = section === 'tutorials' ? 'Tutorials' : 'AI News';
  const topics = parseTopics(url.searchParams.get('topics'));
  if (topics.kind === 'none') return env.ASSETS.fetch(request);
  if (topics.kind === 'invalid') return Response.json({ error: 'invalid topics' }, { status: 400 });

  const { slugs } = topics;
  const self = new URL(`/${section}/feed.xml?topics=${slugs.join(',')}`, request.url).toString();
  const cacheKey = new Request(self, { method: 'GET' });
  const hit = await cache?.match(cacheKey);
  if (hit) return hit;

  const started = Date.now();
  const tags: string[] = [];
  const merged = new Map<string, FeedItem>();
  // A failed fetch or a feed that violates parseTopicFeed's boundary assumption
  // is an upstream problem: answer 503 (retryable, never cached), never a
  // quietly incomplete feed and never an unhandled 500.
  try {
    for (const slug of slugs) {
      const source = new URL(`/${section}/topic/${slug}/feed.xml`, request.url).toString();
      const res = await env.ASSETS.fetch(new Request(source, { method: 'GET' }));
      if (res.status === 404) continue;                    // unknown topic — skip it
      if (!res.ok) return unavailable();
      const { tag, items } = parseTopicFeed(await res.text(), slug);
      tags.push(tag);
      for (const it of items) if (!merged.has(it.guid)) merged.set(it.guid, it); // first wins
    }
  } catch (err) {
    console.log(JSON.stringify({ event: 'feed_error', message: (err as Error).message.slice(0, 200) }));
    return unavailable();
  }
  if (!tags.length) return Response.json({ error: 'no such topics' }, { status: 404 });

  const items = Array.from(merged.values()).sort((a, b) => b.time - a.time).slice(0, ITEM_LIMIT);
  const origin = new URL(request.url).origin;
  const body = channel({
    title: `${label} · ${tags.join(' + ')} · CloudCodeTree`,
    desc: `${label}${section === 'ai-news' ? ' posts' : ''} tagged ${tags.join(' or ')}.`,
    self,
    link: section === 'tutorials' ? `${origin}/tutorials/` : `${origin}/`,
    itemsXml: items.map((it) => it.xml).join('\n'),
    now: new Date().toUTCString(),
  });
  // Counts only: a subscription URL is a reader's interest profile, not log fodder.
  console.log(JSON.stringify({ event: 'feed', topics: slugs.length, items: items.length, ms: Date.now() - started }));

  const res = new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': `public, max-age=${TTL_SECONDS}`,
    },
  });
  if (cache) ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

function unavailable(): Response {
  return Response.json({ error: 'feed unavailable' }, { status: 503, headers: { 'retry-after': '60', 'cache-control': 'no-store' } });
}
