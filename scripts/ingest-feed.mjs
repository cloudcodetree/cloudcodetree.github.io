#!/usr/bin/env node
/**
 * ingest-feed.mjs — turn an RSS 2.0 + Media RSS feed into blog posts.
 *
 * Reads the syndication feed the "AI Developer News" task maintains
 * (default: content/feed.xml) and UPSERTS each <item> into the blog:
 *   - writes public/blog/<guid>.md           (the item's Markdown body)
 *   - re-hosts its Media RSS image →           public/blog/images/<guid>.<ext>
 *   - merges a posts.json entry (keyed by id == guid), newest-first.
 *
 * It is a MERGE, not a rebuild: posts already in posts.json that are not in the
 * feed are preserved (the historical back-catalog, hand-written one-offs). Feed
 * items overwrite their matching id. Idempotent — re-running with the same feed
 * is a no-op. Images are cached by id and reused unless --refresh-images.
 *
 * Field mapping (feed → posts.json / file):
 *   <guid>            → id + filename stem        <title>          → title
 *   <dc:creator>      → author (default Chris Harper)
 *   <pubDate> (RFC822)→ date (MM-DD-YYYY)         <category>*      → tags[] (default ["AI"])
 *   <description>     → excerpt (plain, <=200)    <content:encoded>→ <id>.md body (Markdown)
 *   <media:content url> / <media:thumbnail url>   → image (re-hosted), imageSource = <link>
 *
 * Usage:
 *   node scripts/ingest-feed.mjs [feed.xml] [--out <blogDir>] [--no-images] [--refresh-images]
 * Defaults: feed = content/feed.xml, blogDir = public/blog.
 */

import { readFile, writeFile, readdir, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const positional = argv.filter((a) => !a.startsWith('--'));
const outIdx = argv.indexOf('--out');
const FEED = path.resolve(ROOT, positional[0] || 'content/feed.xml');
const BLOG_DIR = path.resolve(ROOT, outIdx >= 0 ? argv[outIdx + 1] : 'public/blog');
const IMAGES_DIR = path.join(BLOG_DIR, 'images');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const NO_IMAGES = flags.has('--no-images');
const REFRESH = flags.has('--refresh-images');

const PLACEHOLDER = '/blog/images/_default.png';
const DEFAULT_AUTHOR = 'Chris Harper';
const UA = 'Mozilla/5.0 (compatible; cloudcodetree-blog/1.0; +https://cloudcodetree.com)';
const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

// --- tiny XML helpers (the feed is a controlled, well-formed format) --------

function decodeEntities(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Inner content of <tag>…</tag> (first match). CDATA is returned verbatim
 *  (literal — for Markdown bodies); plain text is entity-decoded. */
function getTag(item, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(item);
  if (!m) return '';
  const raw = m[1];
  const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(raw);
  return cdata ? cdata[1] : decodeEntities(raw.trim());
}

/** All inner contents of repeated <tag>…</tag> (e.g. <category>). */
function getAllTags(item, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(item))) {
    const raw = m[1];
    const cdata = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(raw);
    out.push(cdata ? cdata[1].trim() : decodeEntities(raw.trim()));
  }
  return out;
}

/** Value of an attribute on the first matching self-closing/open tag. */
function getAttr(item, tag, attr) {
  const re = new RegExp(`<${tag}\\b[^>]*\\b${attr}=["']([^"']+)["'][^>]*>`, 'i');
  const m = re.exec(item);
  return m ? decodeEntities(m[1]) : '';
}

function splitItems(xml) {
  return xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];
}

// --- field transforms -------------------------------------------------------

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** RFC-822 pubDate → "MM-DD-YYYY". Falls back to leading YYYY-MM-DD in the id. */
function toMDY(pubDate, id) {
  const d = new Date(pubDate);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${mm}-${dd}-${d.getUTCFullYear()}`;
  }
  // very defensive textual parse: "Mon, 09 Jun 2026 12:00:00 GMT"
  const m = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(pubDate || '');
  if (m && MONTHS[m[2].toLowerCase()]) {
    return `${String(MONTHS[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}-${m[3]}`;
  }
  const fromId = /^(\d{4})-(\d{2})-(\d{2})/.exec(id);
  if (fromId) return `${fromId[2]}-${fromId[3]}-${fromId[1]}`;
  throw new Error(`unparseable pubDate "${pubDate}" for ${id}`);
}

/** MM-DD-YYYY → sortable YYYYMMDD number. */
function dateKey(mdy) {
  const [mm, dd, yyyy] = mdy.split('-');
  return Number(`${yyyy}${mm}${dd}`);
}

function stripMd(s) {
  return String(s)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')          // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')         // links → text
    .replace(/[*_`#>]/g, '')                          // emphasis/heading/code marks
    .replace(/\s+/g, ' ')
    .trim();
}

function excerptFrom(description, body) {
  const base = (description && description.trim()) || stripMd(body);
  return base.length > 200 ? base.slice(0, 197).trimEnd() + '…' : base;
}

const readTime = (body) => Math.max(1, Math.ceil((body.trim().split(/\s+/).filter(Boolean).length) / 200));

// --- images -----------------------------------------------------------------

function cachedImage(id) {
  for (const ext of IMG_EXTS) {
    if (existsSync(path.join(IMAGES_DIR, `${id}.${ext}`))) return `/blog/images/${id}.${ext}`;
  }
  return null;
}

async function downloadImage(url, id) {
  let res;
  try {
    res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
  } catch { return null; }
  if (!res.ok) return null;
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct && !ct.startsWith('image/')) return null;
  const ext = ct.includes('png') ? 'png'
    : ct.includes('webp') ? 'webp'
    : ct.includes('gif') ? 'gif'
    : ct.includes('avif') ? 'avif'
    : ct.includes('svg') ? 'svg'
    : ct.includes('jpeg') || ct.includes('jpg') ? 'jpg'
    : (url.match(/\.(png|webp|gif|avif|svg)(?:\?|$)/i)?.[1]?.toLowerCase() || 'jpg');
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) return null;
  await mkdir(IMAGES_DIR, { recursive: true });
  for (const e of IMG_EXTS) { const p = path.join(IMAGES_DIR, `${id}.${e}`); if (existsSync(p)) await rm(p, { force: true }); }
  await writeFile(path.join(IMAGES_DIR, `${id}.${ext}`), buf);
  return `/blog/images/${id}.${ext}`;
}

async function resolveImage(item, id) {
  if (NO_IMAGES) return PLACEHOLDER;
  if (!REFRESH) { const c = cachedImage(id); if (c) return c; }
  const url = getAttr(item, 'media:content', 'url') || getAttr(item, 'media:thumbnail', 'url');
  if (!url) return PLACEHOLDER;
  return (await downloadImage(url, id)) || PLACEHOLDER;
}

// --- main -------------------------------------------------------------------

async function main() {
  if (!existsSync(FEED)) { console.error(`✗ feed not found: ${path.relative(ROOT, FEED)}`); process.exit(1); }
  await mkdir(BLOG_DIR, { recursive: true });
  await mkdir(IMAGES_DIR, { recursive: true });

  const xml = await readFile(FEED, 'utf8');
  const items = splitItems(xml);
  if (!items.length) { console.error('✗ no <item> elements in feed'); process.exit(1); }

  const existing = existsSync(POSTS_JSON) ? JSON.parse(await readFile(POSTS_JSON, 'utf8')) : [];
  const byId = new Map(existing.map((p) => [p.id, p]));

  let upserted = 0, withImg = 0;
  for (const item of items) {
    const id = getTag(item, 'guid').trim();
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) { console.warn(`! skipping item with bad/missing guid: "${id}"`); continue; }

    const title = getTag(item, 'title').trim();
    const link = getTag(item, 'link').trim();
    const author = getTag(item, 'dc:creator').trim() || DEFAULT_AUTHOR;
    const body = getTag(item, 'content:encoded').trim();
    const tags = getAllTags(item, 'category').filter(Boolean);
    const date = toMDY(getTag(item, 'pubDate').trim(), id);
    const excerpt = excerptFrom(getTag(item, 'description'), body);
    const image = await resolveImage(item, id);
    if (image !== PLACEHOLDER) withImg++;

    await writeFile(path.join(BLOG_DIR, `${id}.md`), body.endsWith('\n') ? body : body + '\n');

    byId.set(id, {
      id, title, excerpt, author, date,
      tags: tags.length ? tags : ['AI'],
      readTime: readTime(body),
      filename: `${id}.md`,
      image,
      ...(link ? { imageSource: link } : {}),
    });
    upserted++;
  }

  // Newest day first; within a day, item order ascending (…-01 before …-02),
  // matching the existing posts.json convention so merges don't churn order.
  const merged = [...byId.values()].sort((a, b) =>
    (dateKey(b.date) - dateKey(a.date)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  await writeFile(POSTS_JSON, JSON.stringify(merged, null, 2) + '\n');

  console.log(`✓ ingested ${upserted} feed item(s) (${withImg} with re-hosted images) → ${merged.length} total posts`);
}

main().catch((e) => { console.error('✗ ingest-feed failed:', e.message); process.exit(1); });
