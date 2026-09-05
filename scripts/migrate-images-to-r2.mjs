#!/usr/bin/env node
/**
 * migrate-images-to-r2.mjs — one-time move of blog images from the GitHub
 * Release "blog-images" to R2 (https://img.cloudcodetree.com).
 *
 *   node scripts/migrate-images-to-r2.mjs [--dry-run] [--concurrency 8]
 *
 * For every post whose `image` still points at the Release: download the
 * asset (following GitHub's redirect), upload it to R2 under the same file
 * name, verify the public URL answers with an image, then rewrite the URL in
 * posts.json — through this script, never by hand. Idempotent: objects that
 * already exist in R2 are not re-uploaded, posts already on R2 are skipped,
 * and the Release is left untouched as a fallback. Prints a summary and exits
 * non-zero if any image could not be moved (posts.json is still written for
 * the ones that succeeded).
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_CDN, contentTypeFor, imageUrl, r2Exists, r2Put, r2Ready } from './lib/r2.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_JSON = path.join(ROOT, 'public', 'blog', 'posts.json');
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const CONCURRENCY = Number(argv[argv.indexOf('--concurrency') + 1]) || 8;

if (!r2Ready()) { console.error('✗ CLOUDFLARE_API_TOKEN is not set (env or .env)'); process.exit(1); }

const posts = JSON.parse(await readFile(POSTS_JSON, 'utf8'));
const todo = posts.filter((p) => typeof p.image === 'string' && p.image.startsWith(LEGACY_CDN + '/'));
const keys = [...new Set(todo.map((p) => p.image.slice(LEGACY_CDN.length + 1)))];
console.log(`posts: ${posts.length}  on the Release: ${todo.length}  distinct objects: ${keys.length}${DRY ? '  (dry run)' : ''}`);

const moved = new Set();
const failed = new Map();

async function moveOne(key) {
  if (await r2Exists(key)) { moved.add(key); return; }
  if (DRY) { moved.add(key); return; }
  const res = await fetch(`${LEGACY_CDN}/${key}`, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`download HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) throw new Error(`download too small (${buf.length} bytes)`);
  await r2Put(key, buf, contentTypeFor(key));
  if (!(await r2Exists(key))) throw new Error('uploaded but the public URL does not answer with an image');
  moved.add(key);
}

let i = 0;
async function worker() {
  while (i < keys.length) {
    const key = keys[i++];
    try { await moveOne(key); }
    catch (err) { failed.set(key, err.message); }
    const done = moved.size + failed.size;
    if (done % 50 === 0 || done === keys.length) console.log(`  ${done}/${keys.length} (${failed.size} failed)`);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, keys.length) }, worker));

let rewritten = 0;
for (const p of todo) {
  const key = p.image.slice(LEGACY_CDN.length + 1);
  if (moved.has(key)) { p.image = imageUrl(key); rewritten++; }
}
if (!DRY && rewritten) await writeFile(POSTS_JSON, JSON.stringify(posts, null, 2) + '\n');

console.log(`\n${DRY ? 'would rewrite' : 'rewrote'} ${rewritten} post image URL(s); ${moved.size} object(s) on R2; ${failed.size} failed`);
for (const [key, why] of failed) console.log(`  ✗ ${key}: ${why}`);
process.exit(failed.size ? 1 : 0);
