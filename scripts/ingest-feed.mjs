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
 * unless --refresh-images. Image work needs an authenticated `gh` plus sharp
 * (npm; falls back to macOS `sips`); without them, posts get the placeholder —
 * which the rehost-images CI job then fixes on the next push to main. XML is
 * parsed with fast-xml-parser, so node_modules must be installed where this
 * runs (true everywhere it runs: CI, cloud agents, and the repo checkout).
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
import { XMLParser } from 'fast-xml-parser';

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
// Optional: when set (e.g. in the rehost-images CI job), posts with no source
// image get a relevant Pexels stock photo instead of the placeholder.
const PEXELS_KEY = process.env.PEXELS_API_KEY || '';
const TMP = path.join(os.tmpdir(), 'cct-ingest-images');
const DEFAULT_AUTHOR = 'Chris Harper';
const UA = 'Mozilla/5.0 (compatible; cloudcodetree-blog/1.0; +https://cloudcodetree.com)';

// --- XML parsing (fast-xml-parser) ------------------------------------------
// Real parser instead of regexes so malformed feeds fail loudly (parse error)
// rather than silently mis-extracting fields. CDATA bodies pass through
// untouched; entities outside CDATA are decoded; values stay strings.

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,       // keep "2026", guids, etc. as strings
  parseAttributeValue: false,
  isArray: (name, jpath) => jpath === 'rss.channel.item' || name === 'category',
});

/** Text content of a parsed node ('' if absent; unwraps attribute-bearing nodes). */
function text(node) {
  if (node == null) return '';
  if (Array.isArray(node)) return text(node[0]);
  if (typeof node === 'object') return text(node['#text']);
  return String(node);
}

/** url attribute of a parsed node like <media:content url="…"/> ('' if absent). */
function urlAttr(node) {
  const n = Array.isArray(node) ? node[0] : node;
  return n && typeof n === 'object' && n['@_url'] ? String(n['@_url']) : '';
}

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
/** RFC-822 pubDate → ISO 8601 (or '' if unparseable) — keeps the time of day. */
function toISO(pubDate) {
  const d = new Date(pubDate);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}
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

/** True if buf starts like a real image (JPEG/PNG/GIF/WebP/HEIF-family). */
function looksLikeImage(buf) {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true; // PNG
  if (buf.toString('ascii', 0, 4) === 'GIF8') return true; // GIF
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return true; // WebP
  if (buf.toString('ascii', 4, 8) === 'ftyp') return true; // HEIC/AVIF
  return false;
}

async function downloadTo(url, dst, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        // 4xx won't get better on retry; 5xx/429 might.
        if (res.status < 500 && res.status !== 429) return false;
        throw new Error(`HTTP ${res.status}`);
      }
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct && !ct.startsWith('image/')) return false;
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.length || !looksLikeImage(buf)) return false;
      await writeFile(dst, buf);
      return true;
    } catch {
      if (i < attempts) await new Promise((r) => setTimeout(r, 1000 * 2 ** (i - 1)));
    }
  }
  return false;
}
let sharpMod; // lazy-loaded so the script still parses if sharp isn't installed
async function compress(src, dst) {
  // Prefer sharp (cross-platform — cloud agents run on Linux); fall back to
  // sips (macOS built-in) so a bare local checkout without node_modules works.
  try {
    sharpMod ??= (await import('sharp')).default;
    await sharpMod(src)
      .rotate() // honor EXIF orientation
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 78 })
      .toFile(dst);
    return existsSync(dst);
  } catch { /* sharp missing or failed — try sips */ }
  try { execFileSync('sips', ['-Z', '1200', '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', src, '--out', dst], { stdio: 'ignore' }); return existsSync(dst); }
  catch { return false; }
}
function uploadAsset(file) {
  try { execFileSync('gh', ['release', 'upload', RELEASE_TAG, file, '--clobber'], { stdio: 'ignore' }); return true; }
  catch { return false; }
}

/** Download one src URL → compress → upload to the CDN as <id>.jpg. Returns ok. */
async function hostImage(srcUrl, id) {
  await mkdir(TMP, { recursive: true, mode: 0o700 });
  const raw = path.join(TMP, `${id}.raw`);
  const jpg = path.join(TMP, `${id}.jpg`);
  if (!(await downloadTo(srcUrl, raw))) return false;
  if (!(await compress(raw, jpg))) { await rm(raw, { force: true }); return false; }
  await rm(raw, { force: true });
  if (!uploadAsset(jpg)) { await rm(jpg, { force: true }); return false; }
  return true;
}

// Map a post's tags to a concrete, non-cliché Pexels search term.
const PEXELS_QUERY_MAP = [
  [/security/i, 'cyber security abstract'],
  [/rag|embedding|vector|knowledge base/i, 'data network abstract'],
  [/lora|fine.?tun|self.?host|model/i, 'computer server hardware'],
  [/claude code|agent|mcp|workflow|developer tools|best practices/i, 'software developer workspace'],
  [/cloud|aws/i, 'data center'],
  [/react|frontend|web/i, 'web design code'],
];
function pexelsQuery(post) {
  const tags = (post.tags || []).filter((t) => t.toLowerCase() !== 'ai');
  const hay = `${tags.join(' ')} ${post.title || ''}`;
  for (const [re, q] of PEXELS_QUERY_MAP) if (re.test(hay)) return q;
  return 'technology abstract';
}
/** Scrape an article page's real og:image / twitter:image → absolute URL or ''. */
async function ogImageFrom(pageUrl) {
  if (!pageUrl) return '';
  let html;
  try {
    const res = await fetch(pageUrl, { headers: { 'user-agent': UA, accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if (!res.ok) return '';
    if (!(res.headers.get('content-type') || '').toLowerCase().includes('html')) return '';
    html = (await res.text()).slice(0, 200_000); // the <head> is plenty
  } catch { return ''; }
  const tags = '(?:og:image:secure_url|og:image|twitter:image)';
  const m =
    new RegExp(`<meta[^>]+(?:property|name)=["']${tags}["'][^>]+content=["']([^"']+)["']`, 'i').exec(html) ||
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${tags}["']`, 'i').exec(html);
  if (!m) return '';
  try { return new URL(m[1].replace(/&amp;/g, '&'), pageUrl).href; } catch { return ''; }
}

/** Pick a relevant Pexels photo for a post → { src, credit:{name,url} } or null. */
async function pexelsPick(post, id) {
  const q = pexelsQuery(post);
  let data;
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=15&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.warn(`! ${id}: Pexels HTTP ${res.status}`); return null; }
    data = await res.json();
  } catch (e) { console.warn(`! ${id}: Pexels query failed (${e.message})`); return null; }
  const photos = data?.photos || [];
  if (!photos.length) return null;
  // Deterministic spread so different posts don't all get photo #1.
  let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const p = photos[h % photos.length];
  return { src: p.src?.large2x || p.src?.large || p.src?.original, credit: { name: p.photographer, url: p.url } };
}

/** Resolve a featured image for one post → { url, credit? } (CDN URL or placeholder). */
async function resolveImage(item, id, existing, post) {
  // reuse an already-uploaded image unless refreshing (even with --no-images:
  // that flag means "don't fetch/upload", never "discard existing CDN images")
  if (!REFRESH && existing && existing.startsWith(CDN) && !existing.endsWith('_default.png')) return { url: existing };
  if (NO_IMAGES) return { url: PLACEHOLDER };

  // 1) The image URL the feed provided directly (if it's a real image).
  const srcUrl = urlAttr(item['media:content']) || urlAttr(item['media:thumbnail']);
  if (srcUrl) {
    if (await hostImage(srcUrl, id)) return { url: `${CDN}/${id}.jpg` };
    console.warn(`! ${id}: feed media image failed (${srcUrl})`);
  }
  // 2) The article's real og:image, scraped from its link (the feed media URL is
  //    often missing or a dead guess; the article's own og:image is reliable).
  const ogUrl = await ogImageFrom(post?.link);
  if (ogUrl) {
    if (await hostImage(ogUrl, id)) { console.log(`  ${id}: og:image from article`); return { url: `${CDN}/${id}.jpg` }; }
    console.warn(`! ${id}: og:image failed (${ogUrl})`);
  }
  // 3) Pexels stock fallback (only when a key is configured, e.g. CI).
  if (PEXELS_KEY) {
    const pick = await pexelsPick(post, id);
    if (pick?.src && await hostImage(pick.src, id)) {
      console.log(`  ${id}: Pexels stock by "${pexelsQuery(post)}" (© ${pick.credit.name})`);
      return { url: `${CDN}/${id}.jpg`, credit: pick.credit };
    }
  }
  console.warn(`! ${id}: no image — using placeholder`);
  return { url: PLACEHOLDER };
}

/** Warn up front if image hosting can't work, instead of failing silently per item. */
function checkImagePrereqs() {
  if (NO_IMAGES) return;
  try { execFileSync('gh', ['release', 'view', RELEASE_TAG, '--repo', REPO, '--json', 'tagName'], { stdio: 'ignore' }); }
  catch {
    console.warn(`! cannot reach GitHub Release "${RELEASE_TAG}" (gh missing/unauthenticated or release absent) — new images will use the placeholder`);
  }
}

// --- main -------------------------------------------------------------------

async function main() {
  if (!existsSync(FEED)) { console.error(`✗ feed not found: ${path.relative(ROOT, FEED)}`); process.exit(1); }
  let doc;
  try {
    doc = parser.parse(await readFile(FEED, 'utf8'), true); // true = validate XML
  } catch (e) {
    console.error(`✗ feed is not well-formed XML: ${e.message}`);
    process.exit(1);
  }
  const items = doc?.rss?.channel?.item ?? [];
  if (!items.length) { console.error('✗ no <item> elements in feed'); process.exit(1); }

  const existing = existsSync(POSTS_JSON) ? JSON.parse(await readFile(POSTS_JSON, 'utf8')) : [];
  const byId = new Map(existing.map((p) => [p.id, p]));

  checkImagePrereqs();

  let upserted = 0, withImg = 0, failed = 0;
  for (const item of items) {
    const id = text(item.guid).trim();
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) { console.warn(`! skipping item with bad/missing guid: "${id}"`); continue; }

    // One malformed item shouldn't abort the whole ingest.
    try {
      const body = text(item['content:encoded']).trim();
      if (!body) { console.warn(`! skipping ${id}: empty <content:encoded>`); failed++; continue; }
      const title = text(item.title).trim();
      if (!title) { console.warn(`! skipping ${id}: empty <title>`); failed++; continue; }
      const link = text(item.link).trim();
      const tags = (item.category ?? []).map((c) => text(c).trim()).filter(Boolean);
      const tagsArr = tags.length ? tags : ['AI'];
      const prior = byId.get(id);
      const { url: image, credit } = await resolveImage(item, id, prior?.image, { tags: tagsArr, title, link });
      if (image !== PLACEHOLDER) withImg++;
      // Attribution: use this run's credit, else carry over a prior one if the image is unchanged.
      const creditFields = credit
        ? { imageCredit: credit.name, imageCreditUrl: credit.url }
        : (image === prior?.image && prior?.imageCredit
            ? { imageCredit: prior.imageCredit, imageCreditUrl: prior.imageCreditUrl } : {});

      byId.set(id, {
        id,
        title,
        excerpt: excerptFrom(text(item.description), body),
        author: text(item['dc:creator']).trim() || DEFAULT_AUTHOR,
        date: toMDY(text(item.pubDate).trim(), id),
        ...(toISO(text(item.pubDate).trim()) ? { publishedAt: toISO(text(item.pubDate).trim()) } : {}),
        tags: tagsArr,
        readTime: readTime(body),
        image,
        ...creditFields,
        ...(link ? { imageSource: link } : {}),
        content: body,
      });
      upserted++;
    } catch (e) {
      console.warn(`! skipping ${id}: ${e.message}`);
      failed++;
    }
  }
  if (failed) console.warn(`! ${failed} feed item(s) skipped — fix the feed and re-run`);

  // Newest day first; within a day, newest publish time first (so a later
  // run's posts appear on top). Posts without publishedAt (pre-feed
  // back-catalog) keep the original ascending item order.
  const ts = (p) => p.publishedAt || '';
  const merged = [...byId.values()].sort((a, b) =>
    (dateKey(b.date) - dateKey(a.date)) ||
    (ts(b) < ts(a) ? -1 : ts(b) > ts(a) ? 1 : 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  await writeFile(POSTS_JSON, JSON.stringify(merged, null, 2) + '\n');
  await rm(TMP, { recursive: true, force: true });

  console.log(`✓ ingested ${upserted} feed item(s) (${withImg} with CDN images) → ${merged.length} total posts`);
}

main().catch((e) => { console.error('✗ ingest-feed failed:', e.message); process.exit(1); });
