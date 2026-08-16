#!/usr/bin/env node
/**
 * validate-research-log.mjs — structural guard against the "log says published,
 * content missing" failure mode.
 *
 * The daily routine writes a research log claiming which posts it published. If
 * its commit drops content/feed.xml / posts.json (a real bug we hit), the log
 * looks healthy while the posts are gone. This guard makes that impossible to
 * ship: every post listed under a '### Published' section in
 * content/research-log/*.md MUST exist in public/blog/posts.json. Exit 1 otherwise.
 *
 * Checked against posts.json, NOT content/feed.xml. posts.json is what actually
 * renders on the site, so "did the content ship?" is precisely a posts.json
 * question. It is also the only source that stays correct now that scripts/
 * trim-feed.mjs keeps the feed to a rolling window — checking the feed would fail
 * every log older than that window, for posts that are live and fine.
 *
 * Matching is by the YYYY-MM-DD-NN PREFIX (run-date + item number), not the full
 * guid: the routine sometimes logs a slightly different slug tail than the id
 * that ends up in the feed (cosmetic drift). The prefix still uniquely ties a log
 * entry to its post, so a genuinely-dropped post (no matching prefix in the feed)
 * still fails — while harmless slug drift no longer blocks the deploy.
 *
 * Runs in CI next to validate-blog.mjs.
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG_DIR = path.join(ROOT, 'content', 'research-log');
const POSTS_JSON = path.join(ROOT, 'public', 'blog', 'posts.json');

// A blog guid: YYYY-MM-DD-NN-slug
const GUID = /\b(\d{4}-\d{2}-\d{2}-\d{2}-[a-z0-9-]+)\b/g;
// Run-date + item number — the stable part a log entry and its post always share.
const PREFIX = /^(\d{4}-\d{2}-\d{2}-\d{2})/;

async function main() {
  if (!existsSync(LOG_DIR)) { console.log('✓ research-log: no log dir, nothing to check'); return; }
  if (!existsSync(POSTS_JSON)) { console.error('✗ public/blog/posts.json missing'); process.exit(1); }

  const posts = JSON.parse(await readFile(POSTS_JSON, 'utf8'));
  const publishedPrefixes = new Set(
    posts.map((p) => (String(p.id ?? '').match(PREFIX) || [])[1]).filter(Boolean),
  );

  const files = (await readdir(LOG_DIR)).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
  const missing = [];
  for (const f of files) {
    const text = await readFile(path.join(LOG_DIR, f), 'utf8');
    // Each '### Published' section, up to the next heading.
    for (const part of text.split(/^###\s+Published\s*$/mi).slice(1)) {
      const section = part.split(/^#{2,3}\s/m)[0];
      for (const m of section.matchAll(GUID)) {
        const pfx = (m[1].match(PREFIX) || [])[1];
        if (!pfx || !publishedPrefixes.has(pfx)) missing.push(`${f}: ${m[1]}`);
      }
    }
  }

  if (missing.length) {
    console.error(`✗ research-log claims ${missing.length} published post(s) NOT present in public/blog/posts.json`);
    console.error('  (a run committed its log but dropped the feed/posts content, OR the log is inaccurate):');
    for (const x of missing) console.error('   - ' + x);
    process.exit(1);
  }
  console.log('✓ research-log OK — every published guid exists in posts.json');
}

main().catch((e) => { console.error('✗ validate-research-log failed:', e.message); process.exit(1); });
