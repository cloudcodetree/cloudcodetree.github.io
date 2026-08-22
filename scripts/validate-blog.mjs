#!/usr/bin/env node
/**
 * validate-blog.mjs — assert public/blog/posts.json is internally consistent.
 * Used by the validate-blog hook and by CI. Exits non-zero with messages on failure.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FEED_WINDOW, FEED_WINDOW_LIMIT } from './lib/feed-window.mjs';
import { isFeedEra } from './lib/feed-era.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = path.join(ROOT, 'public', 'blog');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const FEED = path.join(ROOT, 'content', 'feed.xml');
const TOMBSTONES = path.join(ROOT, 'content', 'removed-posts.json');
const REQUIRED =['id', 'title', 'excerpt', 'author', 'date', 'tags', 'readTime', 'content', 'image'];

/**
 * Tag vocabulary — see "Per-item fields" in docs/ai-news-feed-contract.md.
 * Keep the two in sync: adding a tag here without adding it there (or vice versa)
 * is how the site's topic filter ends up with three chips for one topic.
 */
const CONTENT_TYPES = ['News', 'Workflow', 'Tutorial'];
const TOPIC_TAGS = [
  'LLM', 'Agents', 'Claude Code', 'MCP', 'Best Practices', 'Developer Tools',
  'RAG', 'Embeddings', 'Fine-Tuning', 'Vectors', 'Self-Hosting', 'HuggingFace',
  'Security', 'AWS', 'Cloud', 'Design', 'Claude Design', 'Design-to-Code', 'UI/UX',
  // Track tags (five-track aggregator pilot, 2026-08-22)
  'Frontier', 'Team Adoption', 'AI for Your Role', 'Everyday AI', 'Building AI Products',
  // Topic tags introduced by the pilot run
  'Metrics', 'Marketing', 'Policy', 'QA', 'Video AI', 'VLM', 'Video Generation', 'Local AI',
];
const KNOWN_TAGS = new Set(['AI', ...CONTENT_TYPES, ...TOPIC_TAGS]);
/** Retired tags that must never come back (duplicates that fragment the filter). */
const BANNED_TAGS = new Map([['AI News', 'News']]);

/* Scope of the tag rules (feed era vs frozen back-catalogue) lives in
 * scripts/lib/feed-era.mjs, shared with normalize-tags.mjs so the rule that FINDS
 * a tag problem and the rule that FIXES it cannot disagree about scope. */

/**
 * Backstop for the rolling feed window. Nothing breaks the moment the feed grows —
 * the damage is gradual and invisible: each routine run reads the whole feed to
 * dedup, so an un-trimmed feed quietly stops fitting in context and the dedup guard
 * weakens without any failure to notice. This warns before that happens.
 *
 * A warning, not an error: an oversized feed is never a reason to block a deploy.
 *
 * NOTE: reading the feed here is only ever a SIZE check. Tag enforcement is scoped
 * by publish date (isFeedEra), deliberately NOT by feed membership — see above.
 */
/**
 * A removed post must actually be gone from posts.json.
 *
 * remove-post.mjs edits BOTH content/feed.xml and public/blog/posts.json, which
 * makes it easy to commit half the removal — stage `content/` and forget
 * `public/`, and the item vanishes from the feed while the page keeps building
 * and deploying from posts.json. That happened once and the post stayed live
 * through a green deploy, because nothing cross-checked the two.
 *
 * An error, not a warning: a post the owner asked to unpublish is still online.
 */
async function checkTombstones(posts, errors) {
  if (!existsSync(TOMBSTONES)) return;
  const removed = JSON.parse(await readFile(TOMBSTONES, 'utf8'));
  const ids = new Set(posts.map((p) => p.id));
  for (const t of removed) {
    if (t?.id && ids.has(t.id)) {
      errors.push(
        `"${t.id}" is listed in content/removed-posts.json but is STILL in posts.json — ` +
          'the removal was only half-committed (did you stage public/blog/posts.json?). ' +
          'Re-run scripts/remove-post.mjs or restore the deletion.',
      );
    }
  }
}

async function checkFeedWindow(warnings) {
  if (!existsSync(FEED)) return;
  const xml = await readFile(FEED, 'utf8');
  const count = (xml.match(/<item>/g) || []).length;
  if (count < FEED_WINDOW_LIMIT) return;
  warnings.push(
    `content/feed.xml holds ${count} items — past the ${FEED_WINDOW}-item window ` +
      `(warns at ${FEED_WINDOW_LIMIT}). Run "node scripts/trim-feed.mjs"; if this keeps ` +
      'recurring, the publishing routine has stopped running it.',
  );
}


async function main() {
  const errors = [];
  const warnings = [];
  let enforced = 0;

  if (!existsSync(POSTS_JSON)) {
    console.error('✗ public/blog/posts.json is missing');
    process.exit(1);
  }

  let posts;
  try {
    posts = JSON.parse(await readFile(POSTS_JSON, 'utf8'));
  } catch (e) {
    console.error(`✗ posts.json is not valid JSON: ${e.message}`);
    process.exit(1);
  }

  if (!Array.isArray(posts)) errors.push('posts.json must be a JSON array');

  const seen = new Set();
  for (const [i, p] of (posts || []).entries()) {
    const where = `entry[${i}] (${p && p.id ? p.id : '?'})`;
    for (const f of REQUIRED) {
      if (p[f] === undefined || p[f] === null || p[f] === '') errors.push(`${where}: missing "${f}"`);
    }
    if (p.id && seen.has(p.id)) errors.push(`${where}: duplicate id "${p.id}"`);
    if (p.id) seen.add(p.id);
    if (p.tags && !Array.isArray(p.tags)) errors.push(`${where}: "tags" must be an array`);
    if (p.readTime !== undefined && typeof p.readTime !== 'number') errors.push(`${where}: "readTime" must be a number`);
    if (p.date && !/^\d{2}-\d{2}-\d{4}$/.test(p.date)) errors.push(`${where}: "date" must be MM-DD-YYYY (got "${p.date}")`);
    if (p.image && !/^https?:\/\//.test(p.image) && !p.image.startsWith('/')) errors.push(`${where}: "image" must be a URL or absolute path (got "${p.image}")`);

    // Tag vocabulary — feed-era posts only (see isFeedEra()).
    if (Array.isArray(p.tags) && isFeedEra(p)) {
      enforced++;
      for (const t of p.tags) {
        if (BANNED_TAGS.has(t)) {
          errors.push(`${where}: retired tag "${t}" — use "${BANNED_TAGS.get(t)}" instead`);
        } else if (!KNOWN_TAGS.has(t)) {
          warnings.push(`${where}: unknown tag "${t}" — add it to validate-blog.mjs + docs/ai-news-feed-contract.md, or fix the typo`);
        }
      }
      const types = p.tags.filter((t) => CONTENT_TYPES.includes(t));
      if (types.length === 0) {
        errors.push(`${where}: missing a content-type tag (one of ${CONTENT_TYPES.join(', ')})`);
      } else if (types.length > 1) {
        warnings.push(`${where}: ${types.length} content-type tags (${types.join(', ')}) — expected exactly one`);
      }
      if (!p.tags.includes('AI')) warnings.push(`${where}: missing the baseline "AI" tag`);
    }
  }

  await checkFeedWindow(warnings);
  await checkTombstones(posts, errors);

  for (const w of warnings) console.warn(`  ! ${w}`);

  if (errors.length) {
    console.error(`✗ blog validation failed (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const warned = warnings.length ? `, ${warnings.length} warning(s)` : '';
  console.log(`✓ blog OK — ${posts.length} posts (tag rules on ${enforced} feed-era), posts.json consistent${warned}`);
}

main();
