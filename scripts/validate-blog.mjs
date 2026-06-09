#!/usr/bin/env node
/**
 * validate-blog.mjs — assert public/blog/posts.json is internally consistent.
 * Used by the validate-blog hook and by CI. Exits non-zero with messages on failure.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = path.join(ROOT, 'public', 'blog');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const REQUIRED = ['id', 'title', 'excerpt', 'author', 'date', 'tags', 'readTime', 'content', 'image'];

async function main() {
  const errors = [];

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
  }

  if (errors.length) {
    console.error(`✗ blog validation failed (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✓ blog OK — ${posts.length} posts, posts.json consistent`);
}

main();
