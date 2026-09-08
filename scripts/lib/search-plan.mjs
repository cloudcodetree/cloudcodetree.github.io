import { postHash } from './search-text.mjs';

const chunkIds = (id, n) => Array.from({ length: n }, (_, i) => `${id}#${i}`);

/** Decide what to embed and what to delete, given the last run's manifest. */
export function planIndex(posts, manifest) {
  const known = (manifest && manifest.posts) || {};
  const toEmbed = [];
  const toDelete = [];
  let unchanged = 0;
  const seen = new Set();
  for (const p of posts) {
    seen.add(p.id);
    const prev = known[p.id];
    if (prev && prev.hash === postHash(p)) { unchanged++; continue; }
    if (prev) toDelete.push(...chunkIds(p.id, prev.chunks));
    toEmbed.push(p);
  }
  for (const [id, prev] of Object.entries(known)) {
    if (!seen.has(id)) toDelete.push(...chunkIds(id, prev.chunks));
  }
  return { toEmbed, toDelete, unchanged };
}
