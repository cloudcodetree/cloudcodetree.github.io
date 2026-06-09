#!/usr/bin/env node
/**
 * ingest-feed.mjs — turn an RSS 2.0 + Media RSS feed into blog posts.
 *
 * Reads the syndication feed the "AI Developer News" task maintains
 * (default: content/feed.xml) and UPSERTS each <item> into public/blog/posts.json
 * (keyed by <guid> == id). Post bodies are stored INLINE in posts.json (no .md
 * files). Featured images are downloaded, compressed (sips, 1200px / JPEG q78),
 * and uploaded to the GitHub Release "blog-images" — posts.json stores the CDN
 * URL, so images never live in the repo.
 *
 * It is a MERGE, not a rebuild: posts already in posts.json that aren't in the
 * feed are preserved. Idempotent; an image already uploaded for an id is reused
 * unless --refresh-images. Requires `gh` (authenticated) and `sips` (macOS) for
 * image work; without them, posts get the placeholder image.
 *
 * Usage:
 *   node scripts/ingest-feed.mjs [feed.xml] [--no-images] [--refresh-images]
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const positional = argv.filter((a) => !a.startsWith('--'));
const FEED = path.resolve(ROOT, positional[0] || 'content/feed.xml');
const POSTS_JSON = path.join(ROOT, 'public', 'blog', 'posts.json');
const NO_IMAGES = flags.has('--no-images');
const REFRESH = flags.has('--refresh-images');

const REPO = 'cloudcodetree/cloudcodetree.github.io';
const RELEASE_TAG = 'blog-images';
const CDN = `https://github.com/${REPO}/releases/download/${RELEASE_TAG}`;
const PLACEHOLDER = `${CDN}/_default.png`;
const TMP = path.join(os.tmpdir(), 'cct-ingest-images');
const DEFAULT_AUTHOR = 'Chris Harper';
const UA = 'Mozilla/5.0 (compatible; cloudcodetree-blog/1.0; +https://cloudcodetree.com)';

// --- tiny XML helpers (the feed is a controlled, well-formed format) --------

function decodeEntities(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
function getTag(item, tag) {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(item);
  if (!m) return '';
  const cdataMatch = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(m[1]);
  return cdataMatch ? cdataMatch[1] : decodeEntities(m[1].trim());
}
function getAllTags(item, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(item))) {
    const c = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/.exec(m[1]);
    out.push(c ? c[1].trim() : decodeEntities(m[1].trim()));
  }
  return out;
}
function getAttr(item, tag, attr) {
  const m = new RegExp(`<${tag}\\b[^>]*\\b${attr}=["']([^"']+)["'][^>]*>`, 'i').exec(item);
  return m ? decodeEntities(m[1]) : '';
}
const splitItems = (xml) => xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];

// --- field transforms -------------------------------------------------------

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function toMDY(pubDate, id) {
  const d = new Date(pubDate);
  if (!isNaN(d.getTime())) {
    return `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}-${d.getUTCFullYear()}`;
  }
  const m = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(pubDate || '');
  if (m && MONTHS[m[2].toLowerCase()]) return `${String(MONTHS[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}-${m[3]}`;
  const f = /^(\d{4})-(\d{2})-(\d{2})/.exec(id);
  if (f) return `${f[2]}-${f[3]}-${f[1]}`;
  throw new Error(`unparseable pubDate "${pubDate}" for ${id}`);
}
const dateKey = (mdy) => { const [mm, dd, yyyy] = mdy.split('-'); return Number(`${yyyy}${mm}${dd}`); };
function stripMd(s) {
  return String(s).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
}
function excerptFrom(description, body) {
  const base = (description && description.trim()) || stripMd(body);
  return base.length > 200 ? base.slice(0, 197).trimEnd() + '…' : base;
}
const readTime = (body) => Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 200));

// --- images: download → compress (sips) → upload to GitHub Release ----------

async function downloadTo(url, dst) {
  let res;
  try { res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(15000) }); }
  catch { return false; }
  if (!res.ok) return false;
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct && !ct.startsWith('image/')) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) return false;
  await writeFile(dst, buf);
  return true;
}
function compress(src, dst) {
  try { execFileSync('sips', ['-Z', '1200', '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', src, '--out', dst], { stdio: 'ignore' }); return existsSync(dst); }
  catch { return false; }
}
function uploadAsset(file) {
  try { execFileSync('gh', ['release', 'upload', RELEASE_TAG, file, '--clobber'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

/** Resolve a featured image for one post → a CDN URL (or the placeholder). */
async function resolveImage(item, id, existing) {
  if (NO_IMAGES) return PLACEHOLDER;
  // reuse an already-uploaded image unless refreshing
  if (!REFRESH && existing && existing.startsWith(CDN) && !existing.endsWith('_default.png')) return existing;
  const url = getAttr(item, 'media:content', 'url') || getAttr(item, 'media:thumbnail', 'url');
  if (!url) return PLACEHOLDER;
  await mkdir(TMP, { recursive: true });
  const raw = path.join(TMP, `${id}.raw`);
  const jpg = path.join(TMP, `${id}.jpg`);
  if (!(await downloadTo(url, raw))) return PLACEHOLDER;
  if (!compress(raw, jpg)) { await rm(raw, { force: true }); return PLACEHOLDER; }
  await rm(raw, { force: true });
  if (!uploadAsset(jpg)) return PLACEHOLDER;
  return `${CDN}/${id}.jpg`;
}

// --- main -------------------------------------------------------------------

async function main() {
  if (!existsSync(FEED)) { console.error(`✗ feed not found: ${path.relative(ROOT, FEED)}`); process.exit(1); }
  const items = splitItems(await readFile(FEED, 'utf8'));
  if (!items.length) { console.error('✗ no <item> elements in feed'); process.exit(1); }

  const existing = existsSync(POSTS_JSON) ? JSON.parse(await readFile(POSTS_JSON, 'utf8')) : [];
  const byId = new Map(existing.map((p) => [p.id, p]));

  let upserted = 0, withImg = 0;
  for (const item of items) {
    const id = getTag(item, 'guid').trim();
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) { console.warn(`! skipping item with bad/missing guid: "${id}"`); continue; }

    const body = getTag(item, 'content:encoded').trim();
    const link = getTag(item, 'link').trim();
    const tags = getAllTags(item, 'category').filter(Boolean);
    const image = await resolveImage(item, id, byId.get(id)?.image);
    if (image !== PLACEHOLDER) withImg++;

    byId.set(id, {
      id,
      title: getTag(item, 'title').trim(),
      excerpt: excerptFrom(getTag(item, 'description'), body),
      author: getTag(item, 'dc:creator').trim() || DEFAULT_AUTHOR,
      date: toMDY(getTag(item, 'pubDate').trim(), id),
      tags: tags.length ? tags : ['AI'],
      readTime: readTime(body),
      image,
      ...(link ? { imageSource: link } : {}),
      content: body,
    });
    upserted++;
  }

  // Newest day first; within a day, ascending item order (…-01 before …-02).
  const merged = [...byId.values()].sort((a, b) =>
    (dateKey(b.date) - dateKey(a.date)) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  await writeFile(POSTS_JSON, JSON.stringify(merged, null, 2) + '\n');
  await rm(TMP, { recursive: true, force: true });

  console.log(`✓ ingested ${upserted} feed item(s) (${withImg} with CDN images) → ${merged.length} total posts`);
}

main().catch((e) => { console.error('✗ ingest-feed failed:', e.message); process.exit(1); });
