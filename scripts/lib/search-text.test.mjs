import { describe, expect, it } from 'vitest';
import { stripMarkdown, postText, chunkText, chunkPost, postHash } from './search-text.mjs';

const words = (n, w = 'word') => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ');

describe('stripMarkdown', () => {
  it('drops code fences, images, and syntax but keeps link text', () => {
    const md = '# Title\n\nSee [the docs](https://x.y) and `code`.\n\n```js\nconst a = 1;\n```\n\n![alt](img.png)\n- **bold** item';
    expect(stripMarkdown(md)).toBe('Title See the docs and code. bold item');
  });
});

describe('chunkText', () => {
  it('keeps a short text as one chunk', () => {
    expect(chunkText(words(100))).toEqual([words(100)]);
  });

  it('splits long text on sentence boundaries with overlap', () => {
    const sentence = (i) => `Sentence ${i} has exactly six words.`;
    const text = Array.from({ length: 120 }, (_, i) => sentence(i)).join(' '); // 720 words
    const chunks = chunkText(text, { maxWords: 350, overlap: 40 });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    for (const c of chunks) expect(c.split(' ').length).toBeLessThanOrEqual(350 + 6);
    // Overlap: the tail of chunk 0 reappears at the head of chunk 1.
    const tail = chunks[0].split(' ').slice(-12).join(' ');
    expect(chunks[1].startsWith(tail.split(' ').slice(0, 6).join(' ')) || chunks[1].includes(tail)).toBe(true);
    expect(chunks[chunks.length - 1]).toContain('Sentence 119');
  });

  it('hard-splits a single sentence longer than maxWords', () => {
    const chunks = chunkText(words(800), { maxWords: 350, overlap: 40 });
    expect(chunks.length).toBe(3);
    expect(chunks[0].split(' ').length).toBe(350);
  });
});

describe('chunkPost + postHash', () => {
  const post = { id: 'p1', title: 'T', excerpt: 'E', tags: ['AI', 'News'], content: words(60) };

  it('ids chunks by post id and index', () => {
    expect(chunkPost(post)).toEqual([{ id: 'p1#0', text: postText(post) }]);
  });

  it('hash is stable and changes with content', () => {
    const a = postHash(post);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(postHash({ ...post })).toBe(a);
    expect(postHash({ ...post, content: words(61) })).not.toBe(a);
  });
});
