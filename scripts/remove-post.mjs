#!/usr/bin/env node
/**
 * remove-post.mjs — unpublish a post, permanently.
 *
 * Deleting a post needs three things to stay consistent, which is why this is a
 * script and not a hand-edit:
 *
 *   1. drop the `<item>` from content/feed.xml  (else the next ingest re-adds it)
 *   2. drop the entry from public/blog/posts.json  (the archive the site renders)
 *   3. record it in content/removed-posts.json  (a tombstone, so the removal is
 *      auditable and a future run can tell "deliberately removed" from "lost")
 *
 * Step 3 matters because ingest-feed.mjs is a MERGE: it never deletes. Without a
 * record, the only evidence a post was removed on purpose is a commit message.
 *
 * The post's URL will 404 after the next build. That is the intended outcome —
 * there is no redirect stub. Nothing is lost from git history either way.
 *
 * Usage:
 *   node scripts/remove-post.mjs <post-id> --reason "why" [--dry-run]
 */

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FEED = path.join(ROOT, 'content', 'feed.xml');
const POSTS_JSON = path.join(ROOT, 'public', 'blog', 'posts.json');
const TOMBSTONES = path.join(ROOT, 'content', 'removed-posts.json');

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const id = argv.find((a) => !a.startsWith('--'));
const reasonIdx = argv.indexOf('--reason');
const reason = reasonIdx !== -1 ? argv[reasonIdx + 1] : '';

if (!id) {
  console.error('✗ usage: node scripts/remove-post.mjs <post-id> --reason "why" [--dry-run]');
  process.exit(1);
}
if (!reason) {
  console.error('✗ --reason is required; a removal with no recorded reason is indistinguishable from data loss');
  process.exit(1);
}

async function main() {
  const posts = JSON.parse(await readFile(POSTS_JSON, 'utf8'));
  const post = posts.find((p) => p.id === id);
  const xml = await readFile(FEED, 'utf8');
  const inFeed = xml.includes(`>${id}<`);

  if (!post && !inFeed) {
    console.error(`✗ "${id}" is in neither posts.json nor content/feed.xml — nothing to remove`);
    process.exit(1);
  }

  console.log(`post:    ${post ? post.title : '(not in posts.json)'}`);
  console.log(`date:    ${post ? post.date : '—'}`);
  console.log(`tags:    ${post ? JSON.stringify(post.tags) : '—'}`);
  console.log(`in feed: ${inFeed ? 'yes' : 'no (already outside the rolling window)'}`);

  // 1. feed.xml — drop the whole <item> block containing this guid.
  let nextXml = xml;
  if (inFeed) {
    let removed = 0;
    nextXml = xml.replace(/[ \t]*<item>[\s\S]*?<\/item>\n?/g, (block) =>
      block.includes(`>${id}<`) ? (removed++, '') : block,
    );
    if (removed !== 1) {
      console.error(`✗ expected to remove exactly 1 <item>, matched ${removed} — aborting`);
      process.exit(1);
    }
  }

  // 2. posts.json — drop the entry.
  const nextPosts = posts.filter((p) => p.id !== id);

  // 3. tombstone.
  const tombs = existsSync(TOMBSTONES) ? JSON.parse(await readFile(TOMBSTONES, 'utf8')) : [];
  if (!tombs.some((t) => t.id === id)) {
    tombs.unshift({ id, title: post?.title ?? null, date: post?.date ?? null, reason });
  }

  if (dryRun) {
    console.log(`\n[dry-run] posts.json ${posts.length} → ${nextPosts.length}`);
    console.log(`[dry-run] feed.xml items ${(xml.match(/<item>/g) || []).length} → ${(nextXml.match(/<item>/g) || []).length}`);
    console.log(`[dry-run] tombstones → ${tombs.length}`);
    return;
  }

  if (inFeed) await writeFile(FEED, nextXml);
  await writeFile(POSTS_JSON, `${JSON.stringify(nextPosts, null, 2)}\n`);
  await writeFile(TOMBSTONES, `${JSON.stringify(tombs, null, 2)}\n`);

  console.log(`\n✓ posts.json — ${posts.length} → ${nextPosts.length}`);
  if (inFeed) console.log('✓ feed.xml   — item removed');
  console.log(`✓ tombstone recorded in content/removed-posts.json (${tombs.length} total)`);
  console.log(`\n  /ai-news/${id}/ will 404 after the next build. Rebuild and redeploy to take effect.`);
}

main().catch((e) => { console.error('✗ remove-post failed:', e.message); process.exit(1); });
