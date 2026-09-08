#!/usr/bin/env node
/**
 * index-search.mjs — keep the Vectorize index `cct-search` in step with
 * public/blog/posts.json, and write public/blog/related.json for the build.
 *
 *   node scripts/index-search.mjs            embed changed posts, upsert, delete, write related.json
 *   node scripts/index-search.mjs --dry-run  plan only: no model calls, no writes to Cloudflare
 *
 * State between runs is the manifest on R2 (search/manifest.json): per post,
 * the content hash, chunk count, date, and the post's mean vector (base64
 * float32). A run with nothing changed makes zero model calls. Without a
 * CLOUDFLARE_API_TOKEN the script writes an EMPTY related.json and exits 0 —
 * local builds and PR builds must never depend on Cloudflare.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { r2Ready } from './lib/r2.mjs';
import { chunkPost, postHash } from './lib/search-text.mjs';
import { meanVector, encodeVector, decodeVector, relatedFor } from './lib/search-vectors.mjs';
import { planIndex } from './lib/search-plan.mjs';
import { MODEL, embed, vectorizeUpsert, vectorizeDelete, getManifest, putManifest } from './lib/cf-search.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_JSON = path.join(ROOT, 'public', 'blog', 'posts.json');
const RELATED_JSON = path.join(ROOT, 'public', 'blog', 'related.json');
const RELATED_K = 5;

/** MM-DD-YYYY → epoch days (integer). */
export function epochDays(mdY) {
  const [mm, dd, yyyy] = String(mdY).split('-').map(Number);
  return Math.floor(Date.UTC(yyyy, mm - 1, dd) / 86_400_000);
}

async function writeRelated(manifest, posts) {
  const known = (manifest && manifest.posts) || {};
  const ids = new Set(posts.map((p) => p.id));
  const entries = Object.entries(known)
    .filter(([id]) => ids.has(id))
    .map(([id, m]) => ({ id, vector: decodeVector(m.v), date: m.date }));
  const related = entries.length ? relatedFor(entries, { k: RELATED_K }) : {};
  await writeFile(RELATED_JSON, JSON.stringify(related));
  console.log(`✓ related.json (${Object.keys(related).length} posts) → public/blog/`);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const posts = JSON.parse(await readFile(POSTS_JSON, 'utf8'));

  if (!r2Ready()) {
    console.warn('! CLOUDFLARE_API_TOKEN not set — skipping search indexing (keyword-only search, no related posts)');
    await writeRelated(null, posts);
    return;
  }

  const manifest = await getManifest().catch((e) => {
    console.warn(`! manifest unavailable (${e.message}); treating as empty`);
    return null;
  });
  if (manifest && manifest.model && manifest.model !== MODEL) {
    console.warn(`! manifest was built with ${manifest.model}; re-embedding everything for ${MODEL}`);
    manifest.posts = {};
  }

  const plan = planIndex(posts, manifest);
  const chunked = plan.toEmbed.map((p) => ({ post: p, chunks: chunkPost(p) }));
  const totalChunks = chunked.reduce((n, c) => n + c.chunks.length, 0);
  console.log(`▸ plan: ${plan.toEmbed.length} post(s) to embed (${totalChunks} chunks), ${plan.toDelete.length} vector(s) to delete, ${plan.unchanged} unchanged`);

  if (dryRun) {
    console.log('✓ dry run — nothing sent to Cloudflare');
    await writeRelated(manifest, posts);
    return;
  }

  if (plan.toDelete.length) await vectorizeDelete(plan.toDelete);

  const next = { version: 1, model: MODEL, posts: { ...((manifest && manifest.posts) || {}) } };
  for (const id of Object.keys(next.posts)) if (!posts.some((p) => p.id === id)) delete next.posts[id];

  // Embed in one flat pass so batching stays efficient, then re-group per post.
  const flat = chunked.flatMap(({ post, chunks }) => chunks.map((c) => ({ post, ...c })));
  const vectors = flat.length ? await embed(flat.map((c) => c.text)) : [];
  const upserts = flat.map((c, i) => ({
    id: c.id,
    values: vectors[i],
    metadata: { postId: c.post.id, date: epochDays(c.post.date), hash: postHash(c.post) },
  }));
  if (upserts.length) await vectorizeUpsert(upserts);

  let offset = 0;
  for (const { post, chunks } of chunked) {
    const own = vectors.slice(offset, offset + chunks.length);
    offset += chunks.length;
    next.posts[post.id] = {
      hash: postHash(post),
      chunks: chunks.length,
      date: epochDays(post.date),
      v: encodeVector(meanVector(own)),
    };
  }

  if (plan.toEmbed.length || plan.toDelete.length) await putManifest(next);
  console.log(`✓ index in sync — ${Object.keys(next.posts).length} posts, ${upserts.length} vectors upserted`);
  await writeRelated(next, posts);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(`✗ index-search failed: ${e.message}`); process.exit(1); });
}
