import { describe, expect, it } from 'vitest';
import { buildArchive, listing } from './blog-archive.mjs';
const post = (id) => ({ id: `post-${id}`, title: `Post ${id}`, tags: ['AI', 'RAG'], content: `Body ${id}` });
describe('static archive delivery', () => {
  it('preserves every post and body without embedding bodies in metadata', () => {
    const input = Array.from({ length: 215 }, (_, i) => post(i));
    const archive = buildArchive(input);
    expect(archive.chunks.flatMap((c) => JSON.parse(c.text)).map((p) => p.id)).toEqual(input.map((p) => p.id));
    expect(archive.slim.every((p) => !('content' in p))).toBe(true);
    expect(listing(archive).initial).toHaveLength(20);
    expect(archive.bodies.every((b, i) => JSON.parse(b.text).content === input[i].content)).toBe(true);
  });
  it('keeps historical chunk URLs when new posts arrive', () => {
    const input = Array.from({ length: 215 }, (_, i) => post(i));
    const before = buildArchive(input);
    const after = buildArchive([post('new'), ...input]);
    expect(after.chunks.slice(1)).toEqual(before.chunks.slice(1));
    expect(after.chunks[0].url).not.toBe(before.chunks[0].url);
  });
});
