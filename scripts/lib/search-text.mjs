import { createHash } from 'node:crypto';

/** Markdown → plain text good enough for an embedding model. */
export function stripMarkdown(md) {
  return String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function postText(post) {
  return [post.title, post.excerpt, (post.tags || []).join(', '), stripMarkdown(post.content)]
    .filter(Boolean)
    .join('\n');
}

const wordCount = (s) => s.split(/\s+/).filter(Boolean).length;

/** Split on sentence boundaries; carry `overlap` trailing words into the next chunk. */
export function chunkText(text, { maxWords = 350, overlap = 40 } = {}) {
  const clean = String(text).trim();
  if (wordCount(clean) <= maxWords) return [clean];

  // Sentences; a single sentence longer than maxWords is hard-split by words.
  const sentences = (clean.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [clean])
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) => {
      const w = s.split(' ');
      if (w.length <= maxWords) return [s];
      const parts = [];
      for (let i = 0; i < w.length; i += maxWords) parts.push(w.slice(i, i + maxWords).join(' '));
      return parts;
    });

  const chunks = [];
  let cur = [];
  let curWords = 0;
  for (const s of sentences) {
    const n = wordCount(s);
    if (curWords + n > maxWords && cur.length) {
      chunks.push(cur.join(' '));
      const tail = cur.join(' ').split(' ').slice(-overlap);
      cur = tail.length ? [tail.join(' ')] : [];
      curWords = tail.length;
      // If tail + next sentence exceeds maxWords, start fresh without tail
      if (curWords + n > maxWords) {
        cur = [];
        curWords = 0;
      }
    }
    cur.push(s);
    curWords += n;
  }
  if (cur.length) chunks.push(cur.join(' '));
  return chunks;
}

export function chunkPost(post) {
  return chunkText(postText(post)).map((text, i) => ({ id: `${post.id}#${i}`, text }));
}

export function postHash(post) {
  return createHash('sha256').update(postText(post)).digest('hex').slice(0, 16);
}
