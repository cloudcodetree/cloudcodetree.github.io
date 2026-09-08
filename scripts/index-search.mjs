#!/usr/bin/env node
/**
 * index-search.mjs — keep the Vectorize index `cct-search` in step with
 * public/blog/posts.json, and write public/blog/related.json for the build.
 *
 *   node scripts/index-search.mjs            embed changed posts, upsert, delete, write related.json
 *   node scripts/index-search.mjs --dry-run  plan only: no model calls, no writes to Cloudflare
 *
 * State between runs is the manifest on R2 (search-manifest.json): per post,
 * the content hash, chunk count, date, and the post's mean vector (base64
 * float32). A run with nothing changed makes zero model calls. Each successful
 * run also mirrors related.json to R2 (search-related.json), so a run WITHOUT a
 * CLOUDFLARE_API_TOKEN can fall back to the last mirror — stale neighbors beat
 * no neighbors — and writes an empty related.json only if even that is
 * unavailable. Either way it exits 0: local builds and PR builds must never
 * depend on Cloudflare.
 *
 * Failure mid-run is safe: deletes are applied first and are idempotent, the
 * manifest is only written after a successful upsert, so the next run's plan
 * simply re-queues the same posts. The cost is a changed post being
 * unsearchable until that next run.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { r2Ready } from './lib/r2.mjs';
import { chunkPost, postHash } from './lib/search-text.mjs';
import { meanVector, encodeVector, decodeVector, relatedFor } from './lib/search-vectors.mjs';
import { planIndex } from './lib/search-plan.mjs';
import { MODEL, embed, vectorizeUpsert, vectorizeDelete, getManifest, putManifest, getRelated, putRelated } from './lib/cf-search.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_JSON = path.join(ROOT, 'public', 'blog', 'posts.json');
const RELATED_JSON = path.join(ROOT, 'public', 'blog', 'related.json');
const RELATED_K = 5;

/** MM-DD-YYYY → epoch days (integer). */
export function epochDays(mdY) {
  const [mm, dd, yyyy] = String(mdY).split('-').map(Number);
  return Math.floor(Date.UTC(yyyy, mm - 1, dd) / 86_400_000);
}

/** Compute related.json from the manifest's vectors, write it, and return it. */
async function writeRelated(manifest, posts) {
  const known = (manifest && manifest.posts) || {};
  const ids = new Set(posts.map((p) => p.id));
  const entries = Object.entries(known)
    .filter(([id]) => ids.has(id))
    .map(([id, m]) => ({ id, vector: decodeVector(m.v), date: m.date }));
  const related = entries.length ? relatedFor(entries, { k: RELATED_K }) : {};
  await writeFile(RELATED_JSON, JSON.stringify(related));
  console.log(`✓ related.json (${Object.keys(related).length} posts) → public/blog/`);
  return related;
}

/**
 * No token: serve the last mirror if R2 still has one (stale neighbors beat an
 * empty strip), otherwise an empty file. validate-blog.mjs still checks every
 * id, so a mirror that has fallen behind a removal fails the build rather than
 * rendering a dead card.
 */
async function writeMirroredRelated() {
  const mirror = await getRelated().catch((e) => {
    console.warn(`! related mirror unavailable (${e.message})`);
    return null;
  });
  const related = mirror && typeof mirror === 'object' && !Array.isArray(mirror) ? mirror : {};
  await writeFile(RELATED_JSON, JSON.stringify(related));
  console.log(
    related === mirror
      ? `✓ related.json (${Object.keys(related).length} posts) from the last R2 mirror → public/blog/`
      : '✓ related.json (empty — no usable R2 mirror) → public/blog/',
  );
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const posts = JSON.parse(await readFile(POSTS_JSON, 'utf8'));

  if (!r2Ready()) {
    console.warn('! CLOUDFLARE_API_TOKEN not set — skipping search indexing (keyword-only search, related posts from the last mirror)');
    if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REF === 'refs/heads/main') {
      console.log('::warning title=search index::CLOUDFLARE_API_TOKEN missing — related posts served from the last mirror (or empty) and the index was not updated');
    }
    await writeMirroredRelated();
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
  for (const c of flat) if (!c.text.trim()) throw new Error(`post ${c.post.id} produced an empty chunk (${c.id})`);
  const vectors = flat.length ? await embed(flat.map((c) => c.text)) : [];
  if (vectors.length !== flat.length) throw new Error(`embed returned ${vectors.length} vectors for ${flat.length} chunks`);
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

  if (plan.toEmbed.length || plan.toDelete.length) {
    await putManifest(next);
    // Prove the round trip. A manifest that writes but does not read back (a
    // key encoding mismatch, a bucket that is not the public one) is silent:
    // every later run would just re-embed the whole corpus.
    const check = await getManifest();
    if (!check || Object.keys(check.posts || {}).length !== Object.keys(next.posts).length) {
      throw new Error('manifest did not round-trip through R2');
    }
  }
  console.log(`✓ index in sync — ${Object.keys(next.posts).length} posts, ${upserts.length} vectors upserted`);
  const related = await writeRelated(next, posts);
  await putRelated(related);
  console.log(`✓ related.json mirrored to R2 (${Object.keys(related).length} posts)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(`✗ index-search failed: ${e.message}`); process.exit(1); });
}
