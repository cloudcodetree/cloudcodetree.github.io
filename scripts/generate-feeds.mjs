#!/usr/bin/env node
/**
 * generate-feeds.mjs — build the public reader feed from public/blog/posts.json.
 *
 * Output: public/feed.xml — RSS 2.0 + Media RSS + content:encoded, for feed
 * readers and "subscribe" links. Featured images are referenced by absolute URL
 * so they render in any reader. Runs automatically as `prebuild` (and `npm run
 * feeds`); regenerated from posts.json each build, so it's never hand-maintained.
 *
 * This EMITS the site's own feed (site → readers). It is separate from the
 * INGEST feed at content/feed.xml (task → site); different files, no collision.
 * No external dependencies.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const BLOG_DIR = path.join(PUBLIC, 'blog');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');

const SITE = 'https://cloudcodetree.com';
const FEED_TITLE = 'AI News — cloudcodetree';
const FEED_DESC = 'Daily field notes on AI-assisted engineering.';

const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif', svg: 'image/svg+xml' };
const mimeFor = (p) => MIME[(p.split('.').pop() || '').toLowerCase()] || 'image/jpeg';

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cdata = (s) => `<![CDATA[${String(s).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

/** MM-DD-YYYY → Date (noon UTC, stable). */
function toDate(mdY) {
  const [mm, dd, yyyy] = mdY.split('-').map(Number);
  return new Date(Date.UTC(yyyy, mm - 1, dd, 12, 0, 0));
}
const rfc822 = (d) => d.toUTCString();

/** Minimal, safe Markdown→HTML for the controlled post bodies. */
function mdToHtml(md) {
  return md.replace(/\r\n/g, '\n').trim().split(/\n{2,}/).map((b) => {
    b = b.trim();
    if (!b) return '';
    if (/^---+$/.test(b)) return '<hr />';
    return `<p>${inline(b)}</p>`;
  }).filter(Boolean).join('\n');
}
function inline(s) {
  s = xml(s);
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);
  s = s.replace(/\*\*([^*]+?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
  s = s.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, (_, p, t) => `${p}<em>${t}</em>`);
  return s;
}

// Images are CDN URLs (GitHub Release assets); no local file to inspect.
function imageInfo(post) {
  if (!post.image) return null;
  return { url: post.image, type: mimeFor(post.image) };
}

async function main() {
  if (!existsSync(POSTS_JSON)) { console.error('✗ posts.json missing'); process.exit(1); }
  const posts = JSON.parse(await readFile(POSTS_JSON, 'utf8'));
  const now = rfc822(new Date());

  // Post bodies are inlined in posts.json (no per-post .md files).
  const items = posts.map((p) => ({ p, html: mdToHtml(p.content || ''), img: imageInfo(p), date: toDate(p.date) }));

  const rssItems = items.map(({ p, html, img, date }) => {
    const link = `${SITE}/ai-news/${p.id}/`;
    const cats = (p.tags || []).map((t) => `    <category>${cdata(t)}</category>`).join('\n');
    const media = img
      ? `    <media:content url="${xml(img.url)}" medium="image" type="${img.type}" />\n` +
        `    <media:thumbnail url="${xml(img.url)}" />\n`
      : '';
    const figure = img ? `<p><img src="${xml(img.url)}" alt="" /></p>\n` : '';
    return `  <item>
    <title>${cdata(p.title)}</title>
    <link>${xml(link)}</link>
    <guid isPermaLink="false">${xml(p.id)}</guid>
    <pubDate>${rfc822(date)}</pubDate>
    <dc:creator>${cdata(p.author)}</dc:creator>
${cats ? cats + '\n' : ''}    <description>${cdata(p.excerpt || '')}</description>
    <content:encoded>${cdata(figure + html)}</content:encoded>
${media}  </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xml(FEED_TITLE)}</title>
    <link>${SITE}/ai-news/</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${xml(FEED_DESC)}</description>
    <language>en-us</language>
    <generator>cloudcodetree generate-feeds.mjs</generator>
    <lastBuildDate>${now}</lastBuildDate>
${rssItems}
  </channel>
</rss>
`;
  await writeFile(path.join(PUBLIC, 'feed.xml'), rss);
  const withImg = items.filter((it) => it.img).length;
  console.log(`✓ feed.xml (${items.length} items, ${withImg} with images) → public/`);
}

main().catch((e) => { console.error('✗ generate-feeds failed:', e.message); process.exit(1); });
