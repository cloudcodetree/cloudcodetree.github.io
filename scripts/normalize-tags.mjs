#!/usr/bin/env node
/**
 * normalize-tags.mjs — one-time backfill bringing the feed-era posts in line with
 * the tag vocabulary in docs/ai-news-feed-contract.md.
 *
 * Two fixes, both idempotent:
 *
 *   1. `AI News` → `News`. The tag is a duplicate of `News` and splits the site's
 *      topic filter into two chips for one topic. 22 feed items used it.
 *   2. A missing content-type tag (`News` | `Workflow` | `Tutorial`). 28 feed items
 *      have none. Every one of them predates 2026-06-18 — the routine's first nine
 *      days, before the contract's tag rules settled. It has been compliant since.
 *
 * For (2) the classification is spelled out below rather than inferred, so it is
 * reviewable in the diff. Everything in the affected window is an announcement
 * (release / CVE / pricing / shutdown) except the handful of technique posts listed
 * in WORKFLOW_IDS, which are practitioner-bucket writing and get `Workflow`.
 *
 * Writes BOTH content/feed.xml (the source of truth) and public/blog/posts.json, so
 * the fix survives the next `ingest-feed.mjs` run instead of being undone by it.
 *
 * The archive-only back-catalog (150 posts from the retired Desktop importer, not
 * present in feed.xml) is deliberately left alone — see validate-blog.mjs.
 *
 * Usage: node scripts/normalize-tags.mjs [--dry-run]
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isFeedEra } from './lib/feed-era.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FEED = path.join(ROOT, 'content', 'feed.xml');
const POSTS_JSON = path.join(ROOT, 'public', 'blog', 'posts.json');

const CONTENT_TYPES = ['News', 'Workflow', 'Tutorial'];

/**
 * Synonyms the routine has coined that duplicate an existing tag. Left alone they
 * become extra chips in the site's topic filter for a topic that already has one.
 * `null` drops the tag outright.
 */
const ALIASES = new Map([
  ['AI News', 'News'],        // duplicate content-type
  ['Vector Search', 'Vectors'],
  ['Models', 'LLM'],
  ['Foundations', null],      // a curriculum-area label, not a topic
]);

/** Technique/practice posts from the pre-2026-06-18 window → `Workflow`, not `News`. */
const WORKFLOW_IDS = new Set([
  '2026-06-11-02-claude-code-fast-mode-economics',
  '2026-06-09-03-skill-hygiene-untrusted-community-skills',
  '2026-06-09-05-verification-is-the-bottleneck',
  '2026-06-09-06-pin-one-mcp-per-system',
  '2026-06-09-07-agentic-rag-references',
]);

const dryRun = process.argv.includes('--dry-run');

/** Apply every fix to a tag list. Returns a new array; never mutates. */
function normalize(tags, id) {
  let out = (tags || [])
    .map((t) => (ALIASES.has(t) ? ALIASES.get(t) : t))
    .filter((t) => t !== null && t !== undefined && t !== '');
  out = out.filter((t, i) => out.indexOf(t) === i); // aliasing can create a dupe
  if (!out.some((t) => CONTENT_TYPES.includes(t))) {
    out.push(WORKFLOW_IDS.has(id) ? 'Workflow' : 'News');
  }
  if (!out.includes('AI')) out.unshift('AI'); // baseline tag on every post
  return out;
}

async function main() {
  const stats = { renamed: 0, typed: 0, feedItems: 0 };

  // ---- posts.json (feed-era entries only; the pre-cutover archive is frozen) ----
  //
  // Scoped by DATE, not by feed membership. trim-feed.mjs keeps the feed to a
  // rolling ~15-day window, so membership would limit repairs to the last two
  // weeks — which is exactly how a merge once reverted 50 posts' tags that this
  // script then refused to fix. validate-blog.mjs uses the same predicate, so
  // anything it flags, this can repair.
  const feedXml = await readFile(FEED, 'utf8');

  const posts = JSON.parse(await readFile(POSTS_JSON, 'utf8'));
  for (const p of posts) {
    if (!isFeedEra(p)) continue;
    const before = p.tags || [];
    const after = normalize(before, p.id);
    if (JSON.stringify(before) === JSON.stringify(after)) continue;
    if (before.includes('AI News')) stats.renamed++;
    if (!before.some((t) => CONTENT_TYPES.includes(t))) stats.typed++;
    console.log(`  ${p.id}\n    ${JSON.stringify(before)}\n    ${JSON.stringify(after)}`);
    p.tags = after;
  }

  // ---- feed.xml: rewrite each item's <category> block ----
  const newFeed = feedXml.replace(/<item>[\s\S]*?<\/item>/g, (item) => {
    const guid = item.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1]?.trim();
    if (!guid) return item;
    const cats = [...item.matchAll(/<category>([^<]*)<\/category>/g)].map((m) => m[1].trim());
    if (!cats.length) return item;
    const next = normalize(cats, guid);
    if (JSON.stringify(cats) === JSON.stringify(next)) return item;
    stats.feedItems++;
    // Replace the contiguous <category> run with the normalized set.
    let first = true;
    return item.replace(/[ \t]*<category>[^<]*<\/category>\n?/g, (m) => {
      if (!first) return '';
      first = false;
      const indent = m.match(/^[ \t]*/)[0];
      return next.map((t) => `${indent}<category>${t}</category>`).join('\n') + '\n';
    });
  });

  if (dryRun) {
    console.log(`\n[dry-run] posts.json: ${stats.renamed} renamed, ${stats.typed} typed`);
    console.log(`[dry-run] feed.xml: ${stats.feedItems} items would change`);
    return;
  }

  await writeFile(POSTS_JSON, `${JSON.stringify(posts, null, 2)}\n`);
  await writeFile(FEED, newFeed);
  console.log(`\n✓ posts.json — ${stats.renamed} "AI News"→"News", ${stats.typed} content-type added`);
  console.log(`✓ feed.xml   — ${stats.feedItems} items normalized`);
}

main();
