#!/usr/bin/env node
/**
 * trim-feed.mjs — keep content/feed.xml to a rolling window of recent items.
 *
 * WHY. content/feed.xml was append-only ("the feed is the archive"), which was true
 * before posts.json existed in its current form. It isn't any more: `ingest-feed.mjs`
 * MERGES rather than rebuilds, so posts already in public/blog/posts.json survive
 * being absent from the feed. posts.json is the durable archive; the feed only needs
 * to carry enough recent history for the publishing routine to dedup against.
 *
 * The cost of leaving it unbounded is not disk (~9 MB/year) — it is that all three
 * daily runs are instructed to READ the whole feed to dedup. At 1.9 MB / 531 items
 * that no longer fits comfortably in a run's context, so the dedup guard silently
 * degrades exactly as the archive it is guarding against grows.
 *
 * SAFETY. An item is only ever dropped when its <guid> is already present in
 * posts.json. An item not yet ingested is never removed, whatever its age — so
 * running this before ingest cannot lose a post. Nothing is truly deleted either
 * way: every trimmed item stays in git history.
 *
 * Usage:
 *   node scripts/trim-feed.mjs [--keep N] [--dry-run]
 *
 * Default window is 120 items (~2 weeks at the current ~8 posts/day), comfortably
 * longer than the contract's ~10-day freshness guard.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FEED_WINDOW } from './lib/feed-window.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FEED = path.join(ROOT, 'content', 'feed.xml');
const POSTS_JSON = path.join(ROOT, 'public', 'blog', 'posts.json');

const DEFAULT_KEEP = FEED_WINDOW;

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const keepArg = argv.indexOf('--keep');
const KEEP = keepArg !== -1 ? Number(argv[keepArg + 1]) : DEFAULT_KEEP;

if (!Number.isInteger(KEEP) || KEEP < 1) {
  console.error(`✗ --keep must be a positive integer (got "${argv[keepArg + 1]}")`);
  process.exit(1);
}

async function main() {
  if (!existsSync(FEED)) { console.error('✗ content/feed.xml missing'); process.exit(1); }
  if (!existsSync(POSTS_JSON)) { console.error('✗ public/blog/posts.json missing'); process.exit(1); }

  const xml = await readFile(FEED, 'utf8');
  const ingested = new Set(JSON.parse(await readFile(POSTS_JSON, 'utf8')).map((p) => p.id));

  const items = [...xml.matchAll(/<item>[\s\S]*?<\/item>/g)].map((m, i) => {
    const raw = m[0];
    const guid = raw.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1]?.trim() ?? null;
    const pub = raw.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.trim();
    const when = pub ? Date.parse(pub) : NaN;
    return { raw, guid, order: i, when: Number.isNaN(when) ? -Infinity : when };
  });

  if (items.length <= KEEP) {
    console.log(`✓ feed has ${items.length} item(s), window is ${KEEP} — nothing to trim`);
    return;
  }

  // Rank by pubDate (newest first) rather than trusting document order; ties and
  // undated items fall back to their existing position.
  const ranked = [...items].sort((a, b) => b.when - a.when || a.order - b.order);
  const keep = new Set(ranked.slice(0, KEEP).map((it) => it.order));

  const dropped = [];
  const heldBack = [];
  for (const it of items) {
    if (keep.has(it.order)) continue;
    // Never drop something ingest hasn't captured yet.
    if (!it.guid || !ingested.has(it.guid)) { heldBack.push(it.guid ?? '(no guid)'); keep.add(it.order); continue; }
    dropped.push(it.guid);
  }

  for (const g of heldBack) console.warn(`  ! kept (not yet in posts.json): ${g}`);

  if (!dropped.length) {
    console.log(`✓ nothing droppable — ${items.length} item(s) all within the window or un-ingested`);
    return;
  }

  const kept = items.filter((it) => keep.has(it.order));
  let idx = 0;
  const next = xml.replace(/<item>[\s\S]*?<\/item>\n?/g, (match) => {
    const mine = items[idx++];
    if (!keep.has(mine.order)) return '';
    return match;
  });

  const before = Buffer.byteLength(xml);
  const after = Buffer.byteLength(next);
  const pct = (((before - after) / before) * 100).toFixed(0);

  if (dryRun) {
    console.log(`[dry-run] would drop ${dropped.length}, keep ${kept.length}`);
    console.log(`[dry-run] ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB (−${pct}%)`);
    console.log(`[dry-run] oldest kept: ${ranked[KEEP - 1]?.guid}`);
    return;
  }

  await writeFile(FEED, next);
  console.log(`✓ feed trimmed — dropped ${dropped.length}, kept ${kept.length}`);
  console.log(`  ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB (−${pct}%)`);
  console.log('  (dropped items remain in posts.json and in git history)');
}

main().catch((e) => { console.error('✗ trim-feed failed:', e.message); process.exit(1); });
