#!/usr/bin/env node
// Runs in a separate job from image decoding. Treat its artifact as data only:
// allow known post ids, regular bounded JPEG files, and safe attribution URLs.
import { readFile, writeFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageUrl, r2Put, isHosted, PLACEHOLDER } from './lib/r2.mjs';

export function imageUpdate(entry, post) {
  if (!entry || !post || !/^[a-z0-9][a-z0-9-]{0,127}$/.test(entry.id) || entry.id !== post.id) return null;
  if (entry.imageSource !== post.imageSource) return null;
  if (isHosted(post.image) && post.image !== PLACEHOLDER) return null;
  const update = { image: imageUrl(`${entry.id}.jpg`) };
  if (entry.imageCredit && typeof entry.imageCredit === 'string' && entry.imageCredit.length <= 200) {
    if (typeof entry.imageCreditUrl !== 'string' || !/^https:\/\/www\.pexels\.com\//.test(entry.imageCreditUrl)) return null;
    update.imageCredit = entry.imageCredit;
    update.imageCreditUrl = entry.imageCreditUrl;
  }
  return update;
}
export function validJpeg(bytes) {
  return bytes.length >= 4 && bytes.length <= 10_000_000 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}
async function main() {
  const dir = path.resolve(process.argv[2] || '.prepared-images');
  const postsFile = path.resolve('public/blog/posts.json');
  const posts = JSON.parse(await readFile(postsFile, 'utf8'));
  const byId = new Map(posts.map((post) => [post.id, post]));
  const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest) || manifest.length > posts.length) throw new Error('Invalid image manifest');
  let uploaded = 0;
  for (const entry of manifest) {
    const post = byId.get(entry.id);
    const update = imageUpdate(entry, post);
    if (!update) throw new Error('Image manifest does not match the current post');
    const file = path.join(dir, `${entry.id}.jpg`);
    const stat = await lstat(file);
    if (!stat.isFile() || stat.size > 10_000_000) throw new Error('Invalid prepared file');
    const bytes = await readFile(file);
    if (!validJpeg(bytes)) throw new Error('Prepared file is not a bounded JPEG');
    await r2Put(`${entry.id}.jpg`, bytes, 'image/jpeg');
    Object.assign(post, update);
    uploaded++;
  }
  if (uploaded) await writeFile(postsFile, JSON.stringify(posts, null, 2) + '\n');
  console.log(`✓ uploaded ${uploaded} prepared images`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
