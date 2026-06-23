#!/usr/bin/env node
/**
 * validate-research-log.mjs — structural guard against the "log says published,
 * content missing" failure mode.
 *
 * The daily routine writes a research log claiming which posts it published. If
 * its commit drops content/feed.xml / posts.json (a real bug we hit), the log
 * looks healthy while the posts are gone. This guard makes that impossible to
 * ship: every post-guid listed under a '### Published' section in
 * content/research-log/*.md MUST exist in content/feed.xml. Exit 1 otherwise.
 *
 * Runs in CI next to validate-blog.mjs.
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG_DIR = path.join(ROOT, 'content', 'research-log');
const FEED = path.join(ROOT, 'content', 'feed.xml');

// A blog guid: YYYY-MM-DD-NN-slug
const GUID = /\b(\d{4}-\d{2}-\d{2}-\d{2}-[a-z0-9-]+)\b/g;

async function main() {
  if (!existsSync(LOG_DIR)) { console.log('✓ research-log: no log dir, nothing to check'); return; }
  if (!existsSync(FEED)) { console.error('✗ content/feed.xml missing'); process.exit(1); }

  const feed = await readFile(FEED, 'utf8');
  const feedGuids = new Set([...feed.matchAll(/<guid[^>]*>([^<]+)<\/guid>/g)].map((m) => m[1].trim()));

  const files = (await readdir(LOG_DIR)).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
  const missing = [];
  for (const f of files) {
    const text = await readFile(path.join(LOG_DIR, f), 'utf8');
    // Each '### Published' section, up to the next heading.
    for (const part of text.split(/^###\s+Published\s*$/mi).slice(1)) {
      const section = part.split(/^#{2,3}\s/m)[0];
      for (const m of section.matchAll(GUID)) {
        if (!feedGuids.has(m[1])) missing.push(`${f}: ${m[1]}`);
      }
    }
  }

  if (missing.length) {
    console.error(`✗ research-log claims ${missing.length} published post(s) NOT present in content/feed.xml`);
    console.error('  (a run committed its log but dropped the feed/posts content, OR the log is inaccurate):');
    for (const x of missing) console.error('   - ' + x);
    process.exit(1);
  }
  console.log('✓ research-log OK — every published guid exists in the feed');
}

main().catch((e) => { console.error('✗ validate-research-log failed:', e.message); process.exit(1); });
