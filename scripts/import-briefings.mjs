#!/usr/bin/env node
/**
 * import-briefings.mjs — explode the daily "AI Developer Briefing" markdown files
 * into INDIVIDUAL blog posts (one per bullet/item). The "AI Developer Briefing — <date>"
 * wrapper is just the internal digest format; on the blog each item stands alone.
 *
 * Deterministic, no LLM, no web fetch. Every source link is preserved.
 *
 * For each bullet it produces a post:
 *   - title   = the bold lead-in
 *   - body    = the item's prose (inline links intact) + a "Sources" footer
 *   - eyebrow = the section it came from (Workflow / Strategy / AI News)
 *   - date    = the briefing's date (MM-DD-YYYY)
 *
 * It rebuilds all briefing-derived posts each run (idempotent) and preserves any
 * hand-written posts (e.g. the legacy 2024 articles, the "Context Is the New
 * Bottleneck" piece).
 *
 * Usage:
 *   node scripts/import-briefings.mjs "<dir>" [--commit]
 */

import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugify, estimateReadTime, deriveExcerpt, inferTags } from './publish-post.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = path.join(ROOT, 'public', 'blog');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const ARROW = ' → ';
const CDN = 'https://github.com/cloudcodetree/cloudcodetree.github.io/releases/download/blog-images';
const PLACEHOLDER_IMAGE = `${CDN}/_default.png`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

// Posts whose ids come from this importer (so re-runs are idempotent).
const isBriefingId = (id) => /^ai-dev-brief-\d{8}$/.test(id) || /^\d{4}-\d{2}-\d{2}-\d{2}-/.test(id);

function categoryOf(section) {
  const s = section.toLowerCase();
  if (s.includes('workflow')) return { eyebrow: 'Workflow', tag: 'Developer Tools' };
  if (s.includes('strateg') || s.includes('best practice')) return { eyebrow: 'Strategy', tag: 'Best Practices' };
  if (s.includes('news')) return { eyebrow: 'AI News', tag: 'AI News' };
  return { eyebrow: section, tag: 'AI' };
}

/** Split a bullet's body into prose and a sources footer, preserving links. */
function splitSources(rest) {
  const arrow = rest.indexOf(ARROW);
  if (arrow >= 0) {
    const prose = rest.slice(0, arrow).trim();
    const md = rest.slice(arrow + ARROW.length).split('|').map((s) => s.trim()).filter(Boolean).join(' · ');
    return { prose, footer: md ? `*Sources: ${md}*` : '' };
  }
  const m = rest.match(/\s*\*([^*]+)\*\s*$/); // trailing italic publication names (older format)
  if (m) return { prose: rest.slice(0, m.index).trim(), footer: `*Source: ${m[1].trim()}*` };
  return { prose: rest.trim(), footer: '' };
}

/** Parse a briefing file into an ordered list of { section, text } bullets. */
function parseBullets(raw) {
  const lines = raw.replace(/^﻿/, '').split(/\r?\n/);
  const bullets = [];
  let section = 'AI News';
  let buf = null;
  const flush = () => { if (buf && buf.trim()) bullets.push({ section, text: buf.trim() }); buf = null; };
  for (const line of lines) {
    if (/^#\s/.test(line)) { flush(); continue; }
    const h = /^##\s+(.+)/.exec(line);
    if (h) { flush(); section = h[1].replace(/[^\p{L}\p{N}\s&./-]/gu, '').trim(); continue; }
    if (/^---\s*$/.test(line)) { flush(); continue; }
    if (/^\s*[-*]\s+/.test(line)) { flush(); buf = line.replace(/^\s*[-*]\s+/, ''); continue; }
    if (buf != null) { if (line.trim() === '') flush(); else buf += ' ' + line.trim(); }
  }
  flush();
  return bullets;
}

/** Turn one bullet into a post {entry, body}, or null if unparseable. */
function bulletToPost(bullet, iso, n) {
  const t = /^\*\*([\s\S]+?)\*\*/.exec(bullet.text);
  if (!t) return null;
  const title = t[1].replace(/^["“]|["”]$/g, '').replace(/\s+/g, ' ').trim();
  let rest = bullet.text.slice(t[0].length).replace(/^\s*(?:[—–]|-)\s+/, '').trim();
  if (!title || !rest) return null;

  const { prose, footer } = splitSources(rest);
  if (!prose) return null;

  const [y, m, d] = iso.split('-').map(Number);
  const cat = categoryOf(bullet.section);
  const id = `${iso}-${String(n).padStart(2, '0')}-${slugify(title).slice(0, 48)}`;
  const body = prose + (footer ? `\n\n---\n${footer}\n` : '\n');
  const tags = [...new Set(['AI', cat.tag, ...inferTags(prose)])].slice(0, 4);

  return {
    entry: {
      id,
      title,
      excerpt: deriveExcerpt(prose),
      author: 'Chris Harper',
      date: `${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}-${y}`,
      tags,
      readTime: estimateReadTime(prose),
      content: body,
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes('--commit');
  const dir = args.find((a) => !a.startsWith('--'));
  if (!dir || !existsSync(path.resolve(dir))) {
    console.error('Usage: node scripts/import-briefings.mjs "<dir>" [--commit]');
    process.exit(1);
  }
  const srcDir = path.resolve(dir);

  const files = (await readdir(srcDir))
    .filter((f) => /^\d{4}-\d{2}-\d{2}-ai-briefing\.md$/.test(f))
    .sort()
    .reverse(); // newest day first

  const posts = [];
  for (const f of files) {
    const iso = f.slice(0, 10);
    const bullets = parseBullets(await readFile(path.join(srcDir, f), 'utf8'));
    let n = 0;
    for (const b of bullets) {
      const post = bulletToPost(b, iso, n + 1);
      if (post) { n++; posts.push(post); }
    }
    console.log(`• ${iso}: ${n} items`);
  }

  const existing = existsSync(POSTS_JSON) ? JSON.parse(await readFile(POSTS_JSON, 'utf8')) : [];
  const existingById = new Map(existing.map((p) => [p.id, p]));
  const preserved = existing.filter((p) => !isBriefingId(p.id));
  // Rebuild briefing posts, but keep an already-uploaded CDN image for the same id.
  const rebuilt = posts.map((p) => ({
    ...p.entry,
    image: existingById.get(p.entry.id)?.image || PLACEHOLDER_IMAGE,
  }));
  const next = [...rebuilt, ...preserved];
  await writeFile(POSTS_JSON, JSON.stringify(next, null, 2) + '\n');

  console.log(`\n✓ Published ${posts.length} individual posts (+${preserved.length} preserved) → ${next.length} total.`);

  if (commit) {
    const { execFileSync } = await import('node:child_process');
    execFileSync('git', ['add', 'public/blog/'], { cwd: ROOT, stdio: 'inherit' });
    execFileSync('git', ['commit', '-m', `blog: import ${posts.length} AI briefing items as individual posts`], { cwd: ROOT, stdio: 'inherit' });
  }
}

main().catch((e) => {
  console.error('✗ import-briefings failed:', e.message);
  process.exit(1);
});
