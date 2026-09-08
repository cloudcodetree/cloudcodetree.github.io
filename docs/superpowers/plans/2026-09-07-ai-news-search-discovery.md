# AI News Search and Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hybrid search (meaning + keywords) over every AI News post, a Related strip on every article, and a real page + feed per topic tag, all on the Cloudflare Free plan and degrading to keyword-only when the Worker path is unavailable.

**Architecture:** A CI script embeds changed posts through the Workers AI REST API and upserts them into the Vectorize index `cct-search`; its own state (per-post content hash, chunk count, post-level mean vector) lives in a small manifest object on the existing R2 bucket, from which it also computes `related.json` at build time. At request time the existing Worker answers `GET /api/search?q=` by embedding the query with the `AI` binding and querying `VECTORIZE`; the browser runs MiniSearch over a static index and merges both lists with reciprocal rank fusion. Topic pages, topic feeds, and the Related strip are prerendered.

**Tech Stack:** Next.js 15 static export, React 19, MUI v7, Cloudflare Workers + Workers AI (`@cf/baai/bge-base-en-v1.5`, 768 d) + Vectorize, R2 (manifest), MiniSearch, vitest, OpenTofu (Cloudflare provider ~> 5.23).

**Spec:** `docs/superpowers/specs/2026-09-07-ai-news-search-discovery-design.md`

**One deliberate deviation from the spec:** the indexer keeps its diff state and post vectors in an R2 manifest (`search/manifest.json` in bucket `cct-blog-images`) instead of listing vectors back out of Vectorize with `list-vectors` + `getByIds`. Same behavior (diff-based embedding, related posts from every post vector), fewer unknown API limits, and the mean vectors needed for related posts are exactly what the manifest stores. Task 14 records this in the spec.

## Global Constraints

- Static export stays: every route is prerendered (`output: 'export'`, `trailingSlash: true`); hrefs carry trailing slashes.
- Never hand-edit `public/blog/posts.json`. Generated files (`related.json`, `search-index.json`, topic feeds) are gitignored and rebuilt at prebuild.
- Embedding model `@cf/baai/bge-base-en-v1.5`, 768 dimensions, 512-token input cap; chunks are at most 350 words.
- Vectorize index name `cct-search`, cosine metric. Vector ids are `<postId>#<n>`.
- `/api/search`: GET only (405 otherwise); `q` trimmed, capped at 200 chars, empty → 400; `topK` 20; cache 1 hour; any upstream failure or missing binding → 503 with `Retry-After: 60`; never log query text.
- Client: 250 ms debounce, 2 s timeout, dropdown shows 8, RRF constant `k = 60`.
- Related strip: up to 5 posts. Topic pages: every tag except `AI`; slug = lowercased, non-alphanumerics → `-`, trimmed.
- Free plan only: no new paid products. Rate limit rule: `/api/search`, 30 requests / 10 s per IP, block (429), 10 s mitigation.
- Index step in CI never fails the deploy; PR builds run the indexer with `--dry-run`.
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Add paths explicitly to `git add`; never `git add .`.
- Tests: `pnpm test` (vitest) and `pnpm run typecheck:worker` must stay green after every task. `pnpm run lint` before the PR.

## File Structure

| Path | Responsibility |
|---|---|
| `scripts/lib/topics.mjs` (+ `.d.ts`) | Tag → slug, topic list with counts. Single source for scripts AND app code. |
| `scripts/lib/search-text.mjs` | Markdown → text, post text, chunking, content hash. Pure. |
| `scripts/lib/search-vectors.mjs` | cosine, mean vector, related-post ranking, float32 ⇄ base64. Pure. |
| `scripts/lib/search-plan.mjs` | Diff current posts against the manifest → embed / delete plan. Pure. |
| `scripts/lib/cf-search.mjs` | REST client: Workers AI embed, Vectorize upsert/delete, manifest get/put on R2. |
| `scripts/index-search.mjs` | Orchestrator with `--dry-run`; writes `public/blog/related.json`. |
| `scripts/generate-feeds.mjs` | + `public/blog/search-index.json`, topic feeds, topic sitemap URLs. |
| `scripts/validate-blog.mjs` | + every id in `related.json` exists. |
| `scripts/check-parity.mjs` | + 5 contract cases. |
| `worker/search.ts` (+ `search.test.ts`) | `/api/search` handler. |
| `worker/index.ts` | Route `/api/search` → handler; `Env` gains `AI`, `VECTORIZE`. |
| `wrangler.jsonc` | `ai` + `vectorize` bindings, prod and staging. |
| `app/lib/searchMerge.ts` (+ `.test.ts`) | RRF merge. Pure. |
| `app/lib/searchIndex.ts` | Lazy MiniSearch index loader (module-level cache) + hybrid `search()`. |
| `app/components/SearchBox.tsx` | Masthead field, dropdown, keyboard nav. |
| `app/components/RelatedPosts.tsx` | Related strip. |
| `app/components/BlogPage.tsx` | + `heading`/`intro`/`topic`/`feedPath`/`emptyMessage` props, SearchBox, chips as links. |
| `app/components/BlogPost.tsx` | + SearchBox, `related` prop → strip. |
| `app/ai-news/[id]/page.tsx` | Reads `related.json`, passes `related`. |
| `app/ai-news/search/page.tsx` + `app/components/SearchResults.tsx` | Results page (noindex). |
| `app/ai-news/topic/[slug]/page.tsx` | Topic pages. |
| `.github/workflows/deploy.yml` | Index step (main) / dry-run step (PRs). |
| `infra/ratelimit.tf` | Zone rate-limiting rule. |
| `CLAUDE.md`, spec | Docs. |

---

### Task 1: Topic slugs — the one shared source

**Files:**
- Create: `scripts/lib/topics.mjs`
- Create: `scripts/lib/topics.d.ts`
- Test: `scripts/lib/topics.test.mjs`

**Interfaces:**
- Produces: `slugForTag(tag: string): string`; `topicTags(posts: {tags: string[]}[]): { tag: string; slug: string; count: number }[]` (sorted by count desc, then tag asc; excludes the tag `AI`, case-insensitive); `HIDDEN_TAG = 'ai'`.

- [ ] **Step 1: Write the failing test**

```js
// scripts/lib/topics.test.mjs
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { slugForTag, topicTags } from './topics.mjs';

describe('slugForTag', () => {
  it('lowercases and hyphenates', () => {
    expect(slugForTag('Claude Code')).toBe('claude-code');
    expect(slugForTag('UI/UX')).toBe('ui-ux');
    expect(slugForTag('Fine-Tuning')).toBe('fine-tuning');
    expect(slugForTag('AI for Your Role')).toBe('ai-for-your-role');
    expect(slugForTag('  Design-to-Code ')).toBe('design-to-code');
  });

  it('never collides across the live vocabulary', () => {
    const posts = JSON.parse(readFileSync('public/blog/posts.json', 'utf8'));
    const tags = [...new Set(posts.flatMap((p) => p.tags))];
    const slugs = tags.map(slugForTag);
    expect(new Set(slugs).size).toBe(tags.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe('topicTags', () => {
  it('counts, sorts, and hides AI', () => {
    const posts = [
      { tags: ['AI', 'News', 'Security'] },
      { tags: ['AI', 'Security'] },
      { tags: ['ai', 'Tutorial'] },
    ];
    expect(topicTags(posts)).toEqual([
      { tag: 'Security', slug: 'security', count: 2 },
      { tag: 'News', slug: 'news', count: 1 },
      { tag: 'Tutorial', slug: 'tutorial', count: 1 },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run scripts/lib/topics.test.mjs`
Expected: FAIL — cannot find module `./topics.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
// scripts/lib/topics.mjs
/**
 * Topic tags → URL slugs. The ONE definition for scripts (feeds, sitemap) and
 * app code (topic routes, chip links), so a page and its feed can never
 * disagree about a slug.
 */
export const HIDDEN_TAG = 'ai'; // on every post; never a topic

export function slugForTag(tag) {
  return String(tag)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Every topic with its post count, most-used first, ties alphabetical. */
export function topicTags(posts) {
  const counts = new Map();
  for (const p of posts) {
    for (const t of p.tags || []) {
      if (t.toLowerCase() === HIDDEN_TAG) continue;
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, slug: slugForTag(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
```

```ts
// scripts/lib/topics.d.ts
export const HIDDEN_TAG: string;
export function slugForTag(tag: string): string;
export function topicTags(posts: { tags: string[] }[]): { tag: string; slug: string; count: number }[];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run scripts/lib/topics.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/topics.mjs scripts/lib/topics.d.ts scripts/lib/topics.test.mjs
git commit -m "feat(search): topic slugs, one source for scripts and app

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Post text and chunking

**Files:**
- Create: `scripts/lib/search-text.mjs`
- Test: `scripts/lib/search-text.test.mjs`

**Interfaces:**
- Produces: `stripMarkdown(md: string): string`; `postText(post): string` (title, excerpt, tags, body joined by newlines); `chunkText(text, { maxWords = 350, overlap = 40 }): string[]`; `chunkPost(post): { id: string; text: string }[]` with ids `<postId>#<n>`; `postHash(post): string` (16 hex chars of sha256 over `postText`).

- [ ] **Step 1: Write the failing test**

```js
// scripts/lib/search-text.test.mjs
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run scripts/lib/search-text.test.mjs`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```js
// scripts/lib/search-text.mjs
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
  const clean = String(text).replace(/\s+/g, ' ').trim();
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run scripts/lib/search-text.test.mjs`
Expected: PASS. If the sentence-overlap assertion is flaky on your split, tighten the test to `expect(chunks[1]).toContain(chunks[0].split(' ').slice(-3).join(' '))` — the contract is "tail words reappear", not an exact offset.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/search-text.mjs scripts/lib/search-text.test.mjs
git commit -m "feat(search): post text, chunking, content hash

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Vector math and related-post ranking

**Files:**
- Create: `scripts/lib/search-vectors.mjs`
- Test: `scripts/lib/search-vectors.test.mjs`

**Interfaces:**
- Produces: `cosine(a: number[], b: number[]): number`; `meanVector(vs: number[][]): number[]`; `encodeVector(v: number[]): string` (base64 of Float32Array) and `decodeVector(s: string): number[]`; `relatedFor(entries: { id: string; vector: number[]; date: number }[], { k = 5, recencyWeight = 0.02 } = {}): Record<string, string[]>` where `date` is epoch days; score = cosine + recencyWeight × normalized recency of the *candidate* (newest = 1).

- [ ] **Step 1: Write the failing test**

```js
// scripts/lib/search-vectors.test.mjs
import { describe, expect, it } from 'vitest';
import { cosine, meanVector, encodeVector, decodeVector, relatedFor } from './search-vectors.mjs';

describe('vector math', () => {
  it('cosine of identical vectors is 1, orthogonal is 0', () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
  });
  it('mean averages per dimension', () => {
    expect(meanVector([[1, 2], [3, 4]])).toEqual([2, 3]);
  });
  it('base64 round-trips at float32 precision', () => {
    const v = [0.1, -0.25, 3];
    const back = decodeVector(encodeVector(v));
    expect(back.length).toBe(3);
    back.forEach((x, i) => expect(x).toBeCloseTo(v[i], 5));
  });
});

describe('relatedFor', () => {
  const entries = [
    { id: 'a', vector: [1, 0, 0], date: 100 },
    { id: 'b', vector: [0.9, 0.1, 0], date: 200 },
    { id: 'c', vector: [0, 1, 0], date: 300 },
    { id: 'd', vector: [0.9, 0.1, 0.01], date: 50 },
  ];
  it('ranks by cosine, never includes self, caps at k', () => {
    const rel = relatedFor(entries, { k: 2 });
    expect(rel.a).toHaveLength(2);
    expect(rel.a).not.toContain('a');
    expect(new Set(rel.a)).toEqual(new Set(['b', 'd']));
    expect(rel.c[0]).not.toBe('c');
  });
  it('breaks near-ties toward the newer post', () => {
    const tie = [
      { id: 'x', vector: [1, 0], date: 10 },
      { id: 'old', vector: [1, 0], date: 0 },
      { id: 'new', vector: [1, 0], date: 1000 },
    ];
    expect(relatedFor(tie, { k: 2 }).x).toEqual(['new', 'old']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run scripts/lib/search-vectors.test.mjs`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```js
// scripts/lib/search-vectors.mjs
export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export function meanVector(vs) {
  const out = new Array(vs[0].length).fill(0);
  for (const v of vs) for (let i = 0; i < v.length; i++) out[i] += v[i];
  return out.map((x) => x / vs.length);
}

export function encodeVector(v) {
  return Buffer.from(new Float32Array(v).buffer).toString('base64');
}

export function decodeVector(s) {
  const buf = Buffer.from(s, 'base64');
  return Array.from(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
}

/**
 * For every entry, its k nearest by cosine with a small recency nudge so a
 * near-tie favors the newer post. `date` is any monotonic number (epoch days).
 */
export function relatedFor(entries, { k = 5, recencyWeight = 0.02 } = {}) {
  const dates = entries.map((e) => e.date);
  const min = Math.min(...dates), max = Math.max(...dates);
  const recency = (d) => (max === min ? 0 : (d - min) / (max - min));
  const out = {};
  for (const self of entries) {
    out[self.id] = entries
      .filter((o) => o.id !== self.id)
      .map((o) => ({ id: o.id, score: cosine(self.vector, o.vector) + recencyWeight * recency(o.date) }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, k)
      .map((x) => x.id);
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run scripts/lib/search-vectors.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/search-vectors.mjs scripts/lib/search-vectors.test.mjs
git commit -m "feat(search): vector math and related-post ranking

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: The index plan (diff against the manifest)

**Files:**
- Create: `scripts/lib/search-plan.mjs`
- Test: `scripts/lib/search-plan.test.mjs`

**Interfaces:**
- Consumes: `postHash` from Task 2.
- Produces: `planIndex(posts, manifest): { toEmbed: post[]; toDelete: string[]; unchanged: number }`. The manifest shape (also produced by Task 6) is `{ version: 1; model: string; posts: Record<postId, { hash: string; chunks: number; date: number; v: string }> }` where `v` is the base64 mean vector.
- `toDelete` holds vector ids: every chunk id of a post that vanished, plus the chunk ids of a changed post beyond what it will re-upsert is NOT known yet (chunk count may shrink), so for a changed post include ALL its old chunk ids; the orchestrator deletes first, then upserts.

- [ ] **Step 1: Write the failing test**

```js
// scripts/lib/search-plan.test.mjs
import { describe, expect, it } from 'vitest';
import { planIndex } from './search-plan.mjs';
import { postHash } from './search-text.mjs';

const post = (id, content) => ({ id, title: 't', excerpt: 'e', tags: ['AI'], content, date: '09-07-2026' });

describe('planIndex', () => {
  it('embeds new posts and leaves unchanged ones alone', () => {
    const a = post('a', 'alpha');
    const manifest = { version: 1, model: 'm', posts: { a: { hash: postHash(a), chunks: 1, date: 1, v: '' } } };
    const plan = planIndex([a, post('b', 'beta')], manifest);
    expect(plan.toEmbed.map((p) => p.id)).toEqual(['b']);
    expect(plan.toDelete).toEqual([]);
    expect(plan.unchanged).toBe(1);
  });

  it('re-embeds a changed post and deletes its old chunk ids first', () => {
    const a = post('a', 'alpha v2');
    const manifest = { version: 1, model: 'm', posts: { a: { hash: 'stale', chunks: 3, date: 1, v: '' } } };
    const plan = planIndex([a], manifest);
    expect(plan.toEmbed.map((p) => p.id)).toEqual(['a']);
    expect(plan.toDelete).toEqual(['a#0', 'a#1', 'a#2']);
  });

  it('deletes every chunk of a vanished post', () => {
    const manifest = { version: 1, model: 'm', posts: { gone: { hash: 'x', chunks: 2, date: 1, v: '' } } };
    const plan = planIndex([], manifest);
    expect(plan.toDelete).toEqual(['gone#0', 'gone#1']);
    expect(plan.toEmbed).toEqual([]);
  });

  it('treats a missing manifest as empty', () => {
    const plan = planIndex([post('a', 'x')], null);
    expect(plan.toEmbed).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run scripts/lib/search-plan.test.mjs`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write minimal implementation**

```js
// scripts/lib/search-plan.mjs
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run scripts/lib/search-plan.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/search-plan.mjs scripts/lib/search-plan.test.mjs
git commit -m "feat(search): diff planner against the index manifest

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Cloudflare REST client (embed, upsert, delete, manifest)

**Files:**
- Modify: `scripts/lib/r2.mjs` (export credentials; `r2Put` accepts a cache-control override)
- Create: `scripts/lib/cf-search.mjs`
- Test: `scripts/lib/cf-search.test.mjs`

**Interfaces:**
- Consumes: `cfCredentials()` (new export from `r2.mjs`) → `{ token, accountId }`; `r2Put(key, body, contentType, cacheControl?)`.
- Produces (all `async`): `embed(texts: string[]): Promise<number[][]>` (batches of 50, 3 retries with backoff); `vectorizeUpsert(vectors: { id, values, metadata }[]): Promise<void>` (ndjson, batches of 1000); `vectorizeDelete(ids: string[]): Promise<void>` (batches of 1000; no-op on empty); `getManifest(): Promise<Manifest | null>`; `putManifest(m: Manifest): Promise<void>`. Constants: `INDEX_NAME = 'cct-search'`, `MODEL = '@cf/baai/bge-base-en-v1.5'`, `MANIFEST_KEY = 'search/manifest.json'`.

- [ ] **Step 1: Confirm the two Vectorize REST paths before coding**

Run:
```bash
curl -s https://developers.cloudflare.com/api/resources/vectorize/subresources/indexes/methods/upsert/ | grep -o 'accounts/{account_id}/vectorize/v2/indexes/{index_name}/upsert' | head -1
curl -s https://developers.cloudflare.com/api/resources/vectorize/subresources/indexes/methods/delete_by_ids/ | grep -o 'accounts/{account_id}/vectorize/v2/indexes/{index_name}/delete_by_ids' | head -1
```
Expected: each prints its path once. If a path differs, use the printed one in Step 4 (the request bodies below — `application/x-ndjson` lines of `{id, values, metadata}` for upsert, JSON `{ ids: [] }` for delete — are from the same pages).

- [ ] **Step 2: Export credentials from r2.mjs and allow a cache-control override**

In `scripts/lib/r2.mjs`, rename the private `credentials()` to an exported `cfCredentials()` (update the two call sites in the same file: `r2Ready`, `r2Put`), and change `r2Put`'s signature to:

```js
export async function r2Put(key, body, contentType = contentTypeFor(key), cacheControl = CACHE_CONTROL) {
  const { token, accountId } = cfCredentials();
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is not set');
  const res = await fetch(`${API}/accounts/${accountId}/r2/buckets/${R2_BUCKET}/objects/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}`, 'content-type': contentType, 'cache-control': cacheControl },
    body,
  });
```
(the rest of the function is unchanged). Also export `API`: `export const API = 'https://api.cloudflare.com/client/v4';`.

Run: `pnpm test` — Expected: existing tests still PASS (nothing imports the old private name).

- [ ] **Step 3: Write the failing test**

```js
// scripts/lib/cf-search.test.mjs
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  process.env.CLOUDFLARE_API_TOKEN = 'test-token';
  process.env.CLOUDFLARE_ACCOUNT_ID = 'acct';
  vi.resetModules();
});
afterEach(() => { vi.unstubAllGlobals(); });

const ok = (result) => new Response(JSON.stringify({ success: true, result }), { status: 200, headers: { 'content-type': 'application/json' } });

describe('embed', () => {
  it('posts batches of 50 to Workers AI and concatenates the vectors', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      calls.push({ url: String(url), body: JSON.parse(init.body) });
      return ok({ shape: [calls.at(-1).body.text.length, 2], data: calls.at(-1).body.text.map((_, i) => [i, i]) });
    }));
    const { embed } = await import('./cf-search.mjs');
    const out = await embed(Array.from({ length: 70 }, (_, i) => `t${i}`));
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toBe('https://api.cloudflare.com/client/v4/accounts/acct/ai/run/@cf/baai/bge-base-en-v1.5');
    expect(calls[0].body.text).toHaveLength(50);
    expect(out).toHaveLength(70);
  });

  it('retries a 5xx then succeeds', async () => {
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async () => (n++ === 0 ? new Response('boom', { status: 503 }) : ok({ data: [[1]] }))));
    const { embed } = await import('./cf-search.mjs');
    await expect(embed(['x'])).resolves.toEqual([[1]]);
    expect(n).toBe(2);
  });
});

describe('vectorize', () => {
  it('upserts ndjson lines', async () => {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => { calls.push({ url: String(url), init }); return ok({ mutationId: 'm' }); }));
    const { vectorizeUpsert } = await import('./cf-search.mjs');
    await vectorizeUpsert([{ id: 'a#0', values: [1, 2], metadata: { postId: 'a' } }, { id: 'b#0', values: [3, 4], metadata: { postId: 'b' } }]);
    expect(calls[0].url).toBe('https://api.cloudflare.com/client/v4/accounts/acct/vectorize/v2/indexes/cct-search/upsert');
    expect(calls[0].init.headers['content-type']).toBe('application/x-ndjson');
    expect(calls[0].init.body.trim().split('\n').map((l) => JSON.parse(l).id)).toEqual(['a#0', 'b#0']);
  });

  it('delete is a no-op on an empty list', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const { vectorizeDelete } = await import('./cf-search.mjs');
    await vectorizeDelete([]);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('manifest', () => {
  it('getManifest returns null on 404 and parses JSON on 200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));
    let mod = await import('./cf-search.mjs');
    expect(await mod.getManifest()).toBeNull();
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ version: 1, posts: {} }), { status: 200 })));
    mod = await import('./cf-search.mjs');
    expect(await mod.getManifest()).toEqual({ version: 1, posts: {} });
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm exec vitest run scripts/lib/cf-search.test.mjs`
Expected: FAIL — cannot find module.

- [ ] **Step 5: Write minimal implementation**

```js
// scripts/lib/cf-search.mjs
/**
 * cf-search.mjs — the three Cloudflare calls the search indexer makes.
 *
 *   embed()            Workers AI REST, @cf/baai/bge-base-en-v1.5 (768 d)
 *   vectorizeUpsert()  Vectorize v2 REST, ndjson body
 *   vectorizeDelete()  Vectorize v2 REST, JSON { ids }
 *
 * plus the indexer's own state: a manifest object on the existing R2 bucket
 * (public read via img.cloudcodetree.com, write via r2Put). The token is the
 * CI token (Workers AI Read + Vectorize Edit + R2 Edit); its value never
 * enters tool output.
 */
import { API, IMG_ORIGIN, cfCredentials, r2Put } from './r2.mjs';

export const INDEX_NAME = 'cct-search';
export const MODEL = '@cf/baai/bge-base-en-v1.5';
export const MANIFEST_KEY = 'search/manifest.json';
const EMBED_BATCH = 50;
const VEC_BATCH = 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cf(pathname, init, attempts = 3) {
  const { token, accountId } = cfCredentials();
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is not set');
  const url = `${API}/accounts/${accountId}/${pathname}`;
  let last;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await sleep(500 * 2 ** i);
    const res = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, ...(init.headers || {}) } });
    if (res.status >= 500 || res.status === 429) { last = new Error(`${pathname}: HTTP ${res.status}`); continue; }
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
      throw new Error(`${pathname}: HTTP ${res.status} ${JSON.stringify(json.errors || '')}`);
    }
    return json.result;
  }
  throw last;
}

export async function embed(texts) {
  const out = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const batch = texts.slice(i, i + EMBED_BATCH);
    const result = await cf(`ai/run/${MODEL}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: batch }),
    });
    out.push(...result.data);
  }
  return out;
}

export async function vectorizeUpsert(vectors) {
  for (let i = 0; i < vectors.length; i += VEC_BATCH) {
    const body = vectors.slice(i, i + VEC_BATCH).map((v) => JSON.stringify(v)).join('\n') + '\n';
    await cf(`vectorize/v2/indexes/${INDEX_NAME}/upsert`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-ndjson' },
      body,
    });
  }
}

export async function vectorizeDelete(ids) {
  for (let i = 0; i < ids.length; i += VEC_BATCH) {
    await cf(`vectorize/v2/indexes/${INDEX_NAME}/delete_by_ids`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ids: ids.slice(i, i + VEC_BATCH) }),
    });
  }
}

/** The last run's manifest, read through the public bucket domain (cache-busted). */
export async function getManifest() {
  const res = await fetch(`${IMG_ORIGIN}/${MANIFEST_KEY}?v=${Date.now()}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`manifest: HTTP ${res.status}`);
  return res.json();
}

export async function putManifest(manifest) {
  await r2Put(MANIFEST_KEY, JSON.stringify(manifest), 'application/json', 'no-cache');
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm exec vitest run scripts/lib/cf-search.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/r2.mjs scripts/lib/cf-search.mjs scripts/lib/cf-search.test.mjs
git commit -m "feat(search): Cloudflare REST client for embed, Vectorize, and the manifest

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: The indexer orchestrator

**Files:**
- Create: `scripts/index-search.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Tasks 2–5. `chunkPost`, `postHash` (search-text); `meanVector`, `encodeVector`, `decodeVector`, `relatedFor` (search-vectors); `planIndex` (search-plan); `embed`, `vectorizeUpsert`, `vectorizeDelete`, `getManifest`, `putManifest`, `MODEL` (cf-search); `r2Ready` (r2).
- Produces: `public/blog/related.json` — `Record<postId, postId[]>`, `{}` when nothing is known. Exit code 0 in every "no token" / dry-run situation; non-zero only when a Cloudflare call fails after retries (CI wraps it so the deploy still proceeds — Task 12).

- [ ] **Step 1: Write the script**

```js
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

  const manifest = dryRun && !process.env.CI ? null : await getManifest().catch((e) => {
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
```

- [ ] **Step 2: Gitignore the generated files**

Append to `.gitignore` under the "Generated reader feeds" block:

```
# Generated by scripts/index-search.mjs (build-time related posts) and
# scripts/generate-feeds.mjs (keyword search index, per-topic feeds)
/public/blog/related.json
/public/blog/search-index.json
/public/ai-news/topic/
```

- [ ] **Step 3: Run the dry run locally (no token needed)**

Run: `node scripts/index-search.mjs --dry-run`
Expected: with no token in `.env`, prints the "! CLOUDFLARE_API_TOKEN not set" warning, writes `public/blog/related.json` containing `{}`, exits 0. With a token in `.env` (the owner's machine), prints a plan line with 857 posts to embed and "dry run — nothing sent", still exit 0.

Then: `git status --short` — Expected: `related.json` does NOT appear (ignored).

- [ ] **Step 4: Commit**

```bash
git add scripts/index-search.mjs .gitignore
git commit -m "feat(search): indexer orchestrator with dry-run and related.json

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Generated files — keyword index, topic feeds, sitemap, validation

**Files:**
- Modify: `scripts/generate-feeds.mjs`
- Modify: `scripts/validate-blog.mjs`

**Interfaces:**
- Consumes: `topicTags` (Task 1).
- Produces: `public/blog/search-index.json` — array of `{ id, title, excerpt, tags, date }` newest-first; `public/ai-news/topic/<slug>/{feed,rss,index}.xml`; sitemap entries `/ai-news/topic/<slug>/` and `/ai-news/search/` is NOT in the sitemap (noindex).

- [ ] **Step 1: Add the search index and topic feeds to generate-feeds**

In `scripts/generate-feeds.mjs`:

1. Add the import: `import { topicTags } from './lib/topics.mjs';`
2. Refactor the per-item RSS rendering into a function so topic feeds reuse it. Replace the `const rssItems = feedPosts.map(({ p, html, img, date }) => { … }).join('\n');` block with:

```js
  const renderItem = ({ p, html, img, date }) => {
    const link = `${SITE}/ai-news/${p.id}/`;
    const cats = (p.tags || []).map((t) => `    <category>${cdata(t)}</category>`).join('\n');
    const media = img
      ? `    <media:content url="${xml(img.url)}" medium="image" type="${img.type}" />\n` +
        `    <media:thumbnail url="${xml(img.url)}" />\n`
      : '';
    const figure = img ? `<p><img src="${xml(img.url)}" alt="" /></p>\n` : '';
    return `  <item>
    <title>${cdata(p.title)}</title>
    <link>${xml(link)}</link>
    <guid isPermaLink="false">${xml(p.id)}</guid>
    <pubDate>${rfc822(date)}</pubDate>
    <dc:creator>${cdata(p.author)}</dc:creator>
${cats ? cats + '\n' : ''}    <description>${cdata(p.excerpt || '')}</description>
    <content:encoded>${cdata(figure + html)}</content:encoded>
${media}  </item>`;
  };
  const rssItems = feedPosts.map(renderItem).join('\n');
```

3. After the `await writeAll('ai-news', aiBody, feedPosts.length);` line, add:

```js
  // Per-topic feeds: /ai-news/topic/<slug>/feed.xml (same item format, newest 20 with that tag).
  const topics = topicTags(posts);
  for (const { tag, slug } of topics) {
    const tagged = items.filter(({ p }) => (p.tags || []).includes(tag)).slice(0, FEED_LIMIT);
    const body = rssChannel({
      title: `${tag} · AI News · CloudCodeTree`,
      desc: `AI News posts tagged ${tag}.`,
      self: `${SITE}/ai-news/topic/${slug}/feed.xml`,
      link: `${SITE}/ai-news/topic/${slug}/`,
      itemsXml: tagged.map(renderItem).join('\n'),
      now,
    });
    await writeAll(`ai-news/topic/${slug}`, body, `${tagged.length} items`);
  }

  // Keyword search index for the browser (MiniSearch): no bodies, newest-first.
  const searchIndex = posts.map((p) => ({ id: p.id, title: p.title, excerpt: p.excerpt || '', tags: p.tags || [], date: p.date }));
  await writeFile(path.join(BLOG_DIR, 'search-index.json'), JSON.stringify(searchIndex));
  console.log(`✓ blog/search-index.json (${searchIndex.length} posts) → public/`);
```

4. In the sitemap's `staticRoutes`, after the `{ loc: \`${SITE}/\`, … }` entry add:

```js
    ...topics.map((t) => ({ loc: `${SITE}/ai-news/topic/${t.slug}/`, lastmod: newest, priority: '0.5' })),
```
(`topics` is defined above; move its `const` above `staticRoutes` if you placed it later.)

Note `writeAll` currently logs `${n} items`; passing a string label is fine because it interpolates.

- [ ] **Step 2: Run it**

Run: `node scripts/generate-feeds.mjs && ls public/ai-news/topic | head -3 && node -e "const i=require('./public/blog/search-index.json');console.log(i.length, Object.keys(i[0]))" && grep -c '/ai-news/topic/' public/sitemap.xml`
Expected: topic directories listed (e.g. `agents best-practices claude-code`), `857 [ 'id', 'title', 'excerpt', 'tags', 'date' ]`, and a topic count of 39 (every tag except AI).

- [ ] **Step 3: Validate related.json ids in validate-blog**

In `scripts/validate-blog.mjs`, add after `checkTombstones`:

```js
const RELATED_JSON = path.join(BLOG_DIR, 'related.json');

/**
 * related.json is generated (scripts/index-search.mjs) from the search
 * manifest, which can lag posts.json by a run. A neighbor id that no longer
 * exists would render a dead card, so it is an error — but only when the
 * file exists (local builds without a token never write one).
 */
async function checkRelated(posts, errors) {
  if (!existsSync(RELATED_JSON)) return;
  const related = JSON.parse(await readFile(RELATED_JSON, 'utf8'));
  const ids = new Set(posts.map((p) => p.id));
  for (const [id, neighbors] of Object.entries(related)) {
    if (!ids.has(id)) errors.push(`related.json: "${id}" is not in posts.json`);
    for (const n of neighbors) if (!ids.has(n)) errors.push(`related.json: "${id}" points at missing post "${n}"`);
    if (neighbors.includes(id)) errors.push(`related.json: "${id}" lists itself`);
  }
}
```
and call it in `main()` right after `await checkTombstones(posts, errors);`:
```js
  await checkRelated(posts, errors);
```

- [ ] **Step 4: Prove the check**

Run:
```bash
echo '{"2026-09-07-07-tool-description-field-claude-function-selection":["nope"]}' > public/blog/related.json && node scripts/validate-blog.mjs; echo "exit=$?"
node scripts/index-search.mjs --dry-run && node scripts/validate-blog.mjs
```
Expected: first command prints `points at missing post "nope"` and `exit=1`; second regenerates a valid file and prints `✓ blog OK`.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-feeds.mjs scripts/validate-blog.mjs
git commit -m "feat(search): keyword index, per-topic feeds, topic sitemap entries, related.json validation

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: The Worker endpoint `/api/search`

**Files:**
- Create: `worker/search.ts`
- Test: `worker/search.test.ts`
- Modify: `worker/index.ts` (route + `Env`)
- Modify: `wrangler.jsonc` (bindings, prod + staging)

**Interfaces:**
- Produces: `normalizeQuery(raw: string | null): string | null`; `collapseMatches(matches: { id: string; score: number }[]): { id: string; score: number }[]`; `handleSearch(request: Request, env: SearchEnv, ctx: ExecutionContext, cache?: CacheLike): Promise<Response>`; `type SearchEnv = { AI?: Ai; VECTORIZE?: Vectorize }`; `type CacheLike = { match(req: Request): Promise<Response | undefined>; put(req: Request, res: Response): Promise<void> }`.
- Response body: `{ results: { id: string; score: number }[] }`.

- [ ] **Step 1: Write the failing test**

```ts
// worker/search.test.ts
import { describe, expect, it, vi } from 'vitest';
import { collapseMatches, handleSearch, normalizeQuery, type CacheLike, type SearchEnv } from './search';

const ctx = { waitUntil: (p: Promise<unknown>) => { void p; } } as unknown as ExecutionContext;

function fakeCache(): CacheLike & { store: Map<string, Response> } {
  const store = new Map<string, Response>();
  return {
    store,
    match: async (req) => store.get(req.url)?.clone(),
    put: async (req, res) => { store.set(req.url, res.clone()); },
  };
}

function stubEnv(opts: { matches?: { id: string; score: number }[]; aiError?: Error } = {}): SearchEnv & { ai: ReturnType<typeof vi.fn> } {
  const ai = vi.fn(async () => { if (opts.aiError) throw opts.aiError; return { shape: [1, 3], data: [[0.1, 0.2, 0.3]] }; });
  const query = vi.fn(async () => ({ matches: opts.matches ?? [{ id: 'p1#0', score: 0.9 }] }));
  return { ai, AI: { run: ai } as unknown as Ai, VECTORIZE: { query } as unknown as Vectorize };
}

const req = (q: string | null, method = 'GET') =>
  new Request(`https://cloudcodetree.com/api/search${q === null ? '' : `?q=${encodeURIComponent(q)}`}`, { method });

describe('normalizeQuery', () => {
  it('trims, collapses whitespace, lowercases, caps at 200', () => {
    expect(normalizeQuery('  Claude   Code ')).toBe('claude code');
    expect(normalizeQuery('')).toBeNull();
    expect(normalizeQuery(null)).toBeNull();
    expect(normalizeQuery('x'.repeat(300))!.length).toBe(200);
  });
});

describe('collapseMatches', () => {
  it('keeps the best chunk per post and sorts descending', () => {
    const out = collapseMatches([
      { id: 'a#1', score: 0.5 }, { id: 'b#0', score: 0.8 }, { id: 'a#0', score: 0.7 }, { id: 'c', score: 0.6 },
    ]);
    expect(out).toEqual([{ id: 'b', score: 0.8 }, { id: 'a', score: 0.7 }, { id: 'c', score: 0.6 }]);
  });
});

describe('handleSearch', () => {
  it('405 on non-GET, 400 on empty query', async () => {
    const env = stubEnv();
    expect((await handleSearch(req('x', 'POST'), env, ctx, fakeCache())).status).toBe(405);
    expect((await handleSearch(req(null), env, ctx, fakeCache())).status).toBe(400);
    expect((await handleSearch(req('   '), env, ctx, fakeCache())).status).toBe(400);
  });

  it('embeds, queries, collapses, and returns ids + scores with a 1h cache header', async () => {
    const env = stubEnv({ matches: [{ id: 'p1#0', score: 0.9 }, { id: 'p1#1', score: 0.4 }, { id: 'p2#0', score: 0.6 }] });
    const res = await handleSearch(req('rag'), env, ctx, fakeCache());
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=3600');
    expect(await res.json()).toEqual({ results: [{ id: 'p1', score: 0.9 }, { id: 'p2', score: 0.6 }] });
    expect(env.ai).toHaveBeenCalledWith('@cf/baai/bge-base-en-v1.5', { text: ['rag'] });
  });

  it('serves a cache hit without calling the model', async () => {
    const env = stubEnv();
    const cache = fakeCache();
    await handleSearch(req('Rag'), env, ctx, cache);
    await handleSearch(req('rag  '), env, ctx, cache);
    expect(env.ai).toHaveBeenCalledTimes(1);
  });

  it('503 + Retry-After when the model fails or a binding is missing', async () => {
    const res = await handleSearch(req('x'), stubEnv({ aiError: new Error('3040: out of capacity') }), ctx, fakeCache());
    expect(res.status).toBe(503);
    expect(res.headers.get('retry-after')).toBe('60');
    const res2 = await handleSearch(req('x'), {} as SearchEnv, ctx, fakeCache());
    expect(res2.status).toBe(503);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run worker/search.test.ts`
Expected: FAIL — cannot find module `./search`.

- [ ] **Step 3: Write the handler**

```ts
// worker/search.ts
/// <reference types="@cloudflare/workers-types" />

/**
 * GET /api/search?q=<text> — semantic half of the AI News hybrid search.
 *
 * Embeds the query with Workers AI (bge-base, 768 d), queries the Vectorize
 * index, collapses chunk hits to their best-scoring post, and returns only
 * post ids + scores: the browser already holds titles and excerpts. Responses
 * are cached by normalized query for an hour, in the Worker (Cache API) and
 * at the edge (Cache-Control). Any upstream failure — including the Free
 * plan's daily allocation running out, which FAILS the call rather than
 * billing — is a 503 the client treats as "keyword-only for now". The query
 * text is never logged.
 */
export interface SearchEnv {
  AI?: Ai;
  VECTORIZE?: Vectorize;
}

export interface CacheLike {
  match(req: Request): Promise<Response | undefined>;
  put(req: Request, res: Response): Promise<void>;
}

export const MODEL = '@cf/baai/bge-base-en-v1.5';
const TOP_K = 20;
const MAX_QUERY = 200;
const TTL_SECONDS = 3600;

export function normalizeQuery(raw: string | null): string | null {
  if (!raw) return null;
  const q = raw.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, MAX_QUERY);
  return q.length ? q : null;
}

/** `<postId>#<n>` → best score per postId, descending. */
export function collapseMatches(matches: { id: string; score: number }[]): { id: string; score: number }[] {
  const best = new Map<string, number>();
  for (const m of matches) {
    const id = m.id.split('#')[0];
    if ((best.get(id) ?? -Infinity) < m.score) best.set(id, m.score);
  }
  return [...best.entries()].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
}

function defaultCache(): CacheLike | undefined {
  const c = (globalThis as unknown as { caches?: { default: CacheLike } }).caches;
  return c?.default;
}

export async function handleSearch(
  request: Request,
  env: SearchEnv,
  ctx: ExecutionContext,
  cache: CacheLike | undefined = defaultCache(),
): Promise<Response> {
  if (request.method !== 'GET') return new Response('method not allowed', { status: 405, headers: { allow: 'GET' } });
  const q = normalizeQuery(new URL(request.url).searchParams.get('q'));
  if (!q) return Response.json({ error: 'q is required' }, { status: 400 });

  const cacheKey = new Request(new URL(`/api/search?q=${encodeURIComponent(q)}`, request.url).toString(), { method: 'GET' });
  const hit = await cache?.match(cacheKey);
  if (hit) return hit;

  if (!env.AI || !env.VECTORIZE) return unavailable();

  const started = Date.now();
  try {
    const emb = (await env.AI.run(MODEL, { text: [q] })) as { data: number[][] };
    const { matches } = await env.VECTORIZE.query(emb.data[0], { topK: TOP_K, returnMetadata: 'none' });
    const results = collapseMatches(matches);
    console.log(JSON.stringify({ event: 'search', results: results.length, ms: Date.now() - started }));
    const res = Response.json({ results }, { headers: { 'cache-control': `public, max-age=${TTL_SECONDS}` } });
    if (cache) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    console.log(JSON.stringify({ event: 'search_error', message: (err as Error).message.slice(0, 200) }));
    return unavailable();
  }
}

function unavailable(): Response {
  return Response.json({ error: 'search unavailable' }, { status: 503, headers: { 'retry-after': '60', 'cache-control': 'no-store' } });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run worker/search.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Route it and declare the bindings**

In `worker/index.ts`:
- add `import { handleSearch } from './search';`
- extend `Env`:
```ts
  /** Workers AI + Vectorize — the search endpoint. Optional so a missing binding degrades to 503, never a crash. */
  AI?: Ai;
  VECTORIZE?: Vectorize;
```
- in `fetch`, before the generic `/api/` 404:
```ts
    if (url.pathname === '/api/search' || url.pathname === '/api/search/') {
      return handleSearch(request, env, ctx);
    }
```

In `wrangler.jsonc`, add to the top level (after `"observability"`) AND inside `"env": { "staging": { … } }`:
```jsonc
  // Search: Workers AI embeds the query, Vectorize holds the post chunks.
  // Both on the Free plan; the index is filled by scripts/index-search.mjs in CI.
  "ai": { "binding": "AI" },
  "vectorize": [{ "binding": "VECTORIZE", "index_name": "cct-search" }],
```

- [ ] **Step 6: Typecheck and full test run**

Run: `pnpm run typecheck:worker && pnpm test`
Expected: both green. If `Ai` or `Vectorize` types are missing, `@cloudflare/workers-types` is too old — it is pinned at `^5.20260819.1`, which has them; run `pnpm install` if `node_modules` is stale.

- [ ] **Step 7: Commit**

```bash
git add worker/search.ts worker/search.test.ts worker/index.ts wrangler.jsonc
git commit -m "feat(search): /api/search on the Worker with AI + Vectorize bindings

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Client search core — RRF merge and the lazy MiniSearch index

**Files:**
- Modify: `package.json` (add `minisearch`)
- Modify: `vitest.config.ts` (include `app/lib/**/*.test.ts`)
- Create: `app/lib/searchMerge.ts`
- Test: `app/lib/searchMerge.test.ts`
- Create: `app/lib/searchIndex.ts`

**Interfaces:**
- Produces: `rrfMerge(lists: string[][], k = 60): string[]`; `RRF_K = 60`.
- Produces: `type SearchDoc = { id: string; title: string; excerpt: string; tags: string[]; date: string }`; `loadIndex(): Promise<{ docs: Map<string, SearchDoc>; keyword(q: string): string[] }>` (module-level promise cache, fetches `/blog/search-index.json`); `hybridSearch(q: string, opts?: { signal?: AbortSignal }): Promise<{ ids: string[]; semantic: boolean }>` — keyword ids merged with `/api/search` ids via RRF; `semantic: false` when the Worker call failed, timed out (2 s), or returned non-200.

- [ ] **Step 1: Install and configure**

Run: `pnpm add minisearch@^7`
Edit `vitest.config.ts` include to: `include: ['worker/**/*.test.ts', 'scripts/**/*.test.mjs', 'app/lib/**/*.test.ts'],`

- [ ] **Step 2: Write the failing test**

```ts
// app/lib/searchMerge.test.ts
import { describe, expect, it } from 'vitest';
import { rrfMerge } from './searchMerge';

describe('rrfMerge', () => {
  it('a post in both lists outranks one in either alone', () => {
    expect(rrfMerge([['a', 'b', 'c'], ['c', 'd']])[0]).toBe('c');
  });
  it('returns the single list unchanged when the other is empty', () => {
    expect(rrfMerge([['a', 'b'], []])).toEqual(['a', 'b']);
  });
  it('dedupes and keeps every id', () => {
    const out = rrfMerge([['a', 'b'], ['b', 'x']]);
    expect(new Set(out)).toEqual(new Set(['a', 'b', 'x']));
    expect(out).toHaveLength(3);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run app/lib/searchMerge.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 4: Implement**

```ts
// app/lib/searchMerge.ts
/** Reciprocal rank fusion: score(id) = Σ 1 / (k + rank_in_list). Pure. */
export const RRF_K = 60;

export function rrfMerge(lists: string[][], k = RRF_K): string[] {
  const score = new Map<string, number>();
  for (const list of lists) {
    list.forEach((id, i) => score.set(id, (score.get(id) ?? 0) + 1 / (k + i + 1)));
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
```

```ts
// app/lib/searchIndex.ts
'use client';

import MiniSearch from 'minisearch';
import { rrfMerge } from './searchMerge';

export interface SearchDoc { id: string; title: string; excerpt: string; tags: string[]; date: string }

interface Loaded { docs: Map<string, SearchDoc>; keyword(q: string): string[] }

const SEMANTIC_TIMEOUT_MS = 2000;
let loading: Promise<Loaded> | null = null;

/** Fetch + index once per page load; every SearchBox shares it. */
export function loadIndex(): Promise<Loaded> {
  if (!loading) {
    loading = fetch('/blog/search-index.json')
      .then((r) => { if (!r.ok) throw new Error(`search-index ${r.status}`); return r.json() as Promise<SearchDoc[]>; })
      .then((list) => {
        const mini = new MiniSearch<SearchDoc>({
          fields: ['title', 'excerpt', 'tags'],
          storeFields: [],
          searchOptions: { boost: { title: 2 }, prefix: true, fuzzy: 0.2 },
        });
        mini.addAll(list);
        const docs = new Map(list.map((d) => [d.id, d]));
        return { docs, keyword: (q: string) => mini.search(q).map((r) => String(r.id)) };
      })
      .catch((e) => { loading = null; throw e; });
  }
  return loading;
}

async function semantic(q: string, signal?: AbortSignal): Promise<string[] | null> {
  const timeout = AbortSignal.timeout(SEMANTIC_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: combined });
    if (!res.ok) return null;
    const body = (await res.json()) as { results: { id: string }[] };
    return body.results.map((r) => r.id);
  } catch {
    return null;
  }
}

/** Keyword results immediately merged with semantic ones; semantic:false means keyword-only. */
export async function hybridSearch(q: string, opts: { signal?: AbortSignal } = {}): Promise<{ ids: string[]; semantic: boolean }> {
  const { keyword } = await loadIndex();
  const kw = keyword(q);
  const sem = await semantic(q, opts.signal);
  if (!sem) return { ids: kw, semantic: false };
  return { ids: rrfMerge([kw, sem]), semantic: true };
}
```

- [ ] **Step 5: Run tests and the type check**

Run: `pnpm test && pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | grep -E 'searchIndex|searchMerge' ; echo "tsc-filtered-exit=$?"`
Expected: vitest PASS; the grep prints nothing (exit 1 from grep is fine — it means no errors mention these files). `AbortSignal.any` needs `lib: dom` ≥ TS 5.4 typings; the repo is on TS ~5.8.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts app/lib/searchMerge.ts app/lib/searchMerge.test.ts app/lib/searchIndex.ts
git commit -m "feat(search): RRF merge and the lazy MiniSearch index

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: SearchBox in the masthead (list + article pages)

**Files:**
- Create: `app/components/SearchBox.tsx`
- Modify: `app/components/BlogPage.tsx` (render the box in the masthead)
- Modify: `app/components/BlogPost.tsx` (render the box next to the back button)

**Interfaces:**
- Consumes: `loadIndex`, `hybridSearch`, `SearchDoc` (Task 9); `SERIF`, `MONO`, `ACCENT`, `LINK`, `formatLongDate` (blogShared).
- Produces: `<SearchBox />` (no props). Behavior: lazy-loads the index on focus; keyword results on every keystroke; semantic merge after a 250 ms pause; dropdown of 8 with title, date, up to 2 topic tags; ArrowUp/ArrowDown/Enter/Escape; Enter with no highlighted row navigates to `/ai-news/search/?q=`; the last row is "See all results".

- [ ] **Step 1: Write the component**

```tsx
// app/components/SearchBox.tsx
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Box, InputBase, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MONO, SERIF, ACCENT, LINK, formatLongDate } from './blogShared';
import { loadIndex, hybridSearch, type SearchDoc } from '../lib/searchIndex';

const DEBOUNCE_MS = 250;
const SHOW = 8;
const border = '1px solid rgba(148,163,184,0.22)';

export default function SearchBox() {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SearchDoc[]>([]);
  const [semantic, setSemantic] = useState(false);
  const [active, setActive] = useState(-1);
  const seq = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const wrap = useRef<HTMLDivElement>(null);

  // Instant keyword pass on every keystroke; semantic merge after a pause.
  useEffect(() => {
    const term = q.trim();
    abort.current?.abort();
    if (!term) { setRows([]); setSemantic(false); setActive(-1); return; }
    const mine = ++seq.current;
    loadIndex().then(({ docs, keyword }) => {
      if (mine !== seq.current) return;
      setRows(keyword(term).slice(0, SHOW).map((id) => docs.get(id)!).filter(Boolean));
    }).catch(() => {});
    const ctl = new AbortController();
    abort.current = ctl;
    const t = window.setTimeout(async () => {
      try {
        const { ids, semantic: ok } = await hybridSearch(term, { signal: ctl.signal });
        if (mine !== seq.current) return;
        const { docs } = await loadIndex();
        setRows(ids.slice(0, SHOW).map((id) => docs.get(id)!).filter(Boolean));
        setSemantic(ok);
      } catch { /* keyword rows stand */ }
    }, DEBOUNCE_MS);
    return () => { window.clearTimeout(t); ctl.abort(); };
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const resultsHref = `/ai-news/search/?q=${encodeURIComponent(q.trim())}`;
  const items = rows.length; // + 1 for "See all results"

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
    else if (e.key === 'Escape') { setOpen(false); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (!q.trim()) return;
      if (active >= 0 && active < items) router.push(`/ai-news/${rows[active].id}/`);
      else router.push(resultsHref);
      setOpen(false);
    }
  };

  const showList = open && q.trim().length > 0;

  return (
    <Box ref={wrap} sx={{ position: 'relative', width: { xs: '100%', sm: 320 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75, border, borderRadius: 999, background: 'rgba(43,43,45,0.6)', '&:focus-within': { borderColor: ACCENT } }}>
        <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <InputBase
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => { setOpen(true); loadIndex().catch(() => {}); }}
          onKeyDown={onKey}
          placeholder="Search AI News"
          inputProps={{ 'aria-label': 'Search AI News', 'aria-controls': listId, 'aria-expanded': showList, 'aria-autocomplete': 'list', role: 'combobox' }}
          sx={{ flex: 1, fontFamily: MONO, fontSize: 13, color: 'text.primary' }}
        />
      </Box>

      {showList && (
        <Box id={listId} role="listbox" sx={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20, border, borderRadius: 1, background: '#1d1f20', boxShadow: '0 12px 32px rgba(0,0,0,0.45)', overflow: 'hidden' }}>
          {rows.length === 0 && (
            <Typography sx={{ p: 1.5, fontFamily: MONO, fontSize: 12, color: 'text.secondary' }}>// no matches yet</Typography>
          )}
          {rows.map((d, i) => (
            <Box key={d.id} component={Link} href={`/ai-news/${d.id}/`} role="option" aria-selected={active === i}
              onMouseEnter={() => setActive(i)} onClick={() => setOpen(false)}
              sx={{ display: 'block', px: 1.5, py: 1.1, textDecoration: 'none', borderTop: i ? border : 'none', background: active === i ? 'rgba(148,188,227,0.12)' : 'transparent' }}>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: 15, lineHeight: 1.2, color: 'text.primary' }}>{d.title}</Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: 'text.secondary', mt: 0.4 }}>
                {formatLongDate(d.date)}{d.tags.filter((t) => t.toLowerCase() !== 'ai').slice(0, 2).map((t) => ` · ${t}`).join('')}
              </Typography>
            </Box>
          ))}
          <Box component={Link} href={resultsHref} role="option" aria-selected={active === items}
            onMouseEnter={() => setActive(items)} onClick={() => setOpen(false)}
            sx={{ display: 'flex', justifyContent: 'space-between', px: 1.5, py: 1, textDecoration: 'none', borderTop: border, background: active === items ? 'rgba(148,188,227,0.12)' : 'transparent' }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 12, color: LINK }}>See all results →</Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: 'text.secondary' }}>{semantic ? 'keyword + meaning' : 'keyword'}</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Mount it in BlogPage and BlogPost**

`app/components/BlogPage.tsx`: add `import SearchBox from './SearchBox';` and, in the "Controls: view switcher + page size" `<Box>`, make the left group hold the box first:

```tsx
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flex: 1 }}>
          <SearchBox />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: 'text.secondary' }}>Per page</Typography>
            <Select … (unchanged) … />
          </Box>
        </Box>
```
(the existing `Per page` `<Box>` moves inside the new wrapper; the `ToggleButtonGroup` stays as the right-hand sibling.)

`app/components/BlogPost.tsx`: add `import SearchBox from './SearchBox';` and replace the `{backButton}` render with:

```tsx
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 4 }}>
          {backButton}
          <SearchBox />
        </Box>
```
and drop the `sx={{ mb: 4 }}` from the `backButton` `<Button>` so the wrapper owns the spacing.

- [ ] **Step 3: See it in the browser**

Run: `rm -rf out && pnpm run dev` and open http://localhost:3000/ . Type `claude` in the box.
Expected: results appear on the first keystroke (keyword); the footer row reads `keyword` (no Worker in dev, so the semantic call 404s and the box stays keyword-only, no console errors beyond the 404). Arrow keys move the highlight; Enter on a row opens the article; Enter with nothing highlighted goes to `/ai-news/search/?q=claude` (404 until Task 11). Open an article: the box sits beside "← Back to AI News".

- [ ] **Step 4: Lint and commit**

Run: `pnpm run lint`
Expected: no errors (warnings about hook deps are fine only if pre-existing).

```bash
git add app/components/SearchBox.tsx app/components/BlogPage.tsx app/components/BlogPost.tsx
git commit -m "feat(search): search-as-you-type box in the AI News masthead and articles

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Results page and BlogPage's presentation props

**Files:**
- Modify: `app/components/BlogPage.tsx` (new optional props)
- Create: `app/components/SearchResults.tsx`
- Create: `app/ai-news/search/page.tsx`

**Interfaces:**
- Produces on `BlogPage`: `heading?: string` (default `'AI News'`), `intro?: React.ReactNode` (default the tagline), `feedPath?: string` (default `'/feed.xml'`; drives the Subscribe button + copied URL), `emptyMessage?: string`, `topic?: { tag: string; slug: string }` (highlights that chip; used by Task 12), `showSearch?: boolean` (default `true`).
- `SearchResults` reads `?q=` from `window.location` on mount, runs `hybridSearch`, orders the slim `posts` prop by the returned ids, and renders `<BlogPage>` with `heading="Search"`.

- [ ] **Step 1: Add the props to BlogPage**

Change the props interface and defaults:

```tsx
interface BlogPageProps {
  /** Slim (content-free) index of every post, newest-first, embedded at build time. */
  posts: BlogPost[];
  heading?: string;
  intro?: React.ReactNode;
  feedPath?: string;
  emptyMessage?: string;
  topic?: { tag: string; slug: string };
  showSearch?: boolean;
}

export default function BlogPage({
  posts, heading = 'AI News', intro = 'Daily field notes on AI-assisted engineering.',
  feedPath = '/feed.xml', emptyMessage, topic, showSearch = true,
}: BlogPageProps) {
```

Then: the masthead `<Typography component="h1">` renders `{heading}`; the tagline `<Typography>` renders `{intro}`; `copyFeedUrl` uses `` `${window.location.origin}${feedPath}` `` and the fallback `window.open(feedPath, …)`; the Subscribe `<a href>` is `{feedPath}` and the small caption reads `` cloudcodetree.com{feedPath} ``; `<SearchBox />` renders only when `showSearch`; the empty state uses `emptyMessage ?? (posts.length === 0 ? '// no posts yet' : '// no posts match those topics — clear a filter above')`. Leave `topic` unused until Task 12 (TypeScript allows an unused destructured prop; add `void topic;` if lint complains).

- [ ] **Step 2: Write the results component and route**

```tsx
// app/components/SearchResults.tsx
'use client';

import { useEffect, useState } from 'react';
import BlogPage from './BlogPage';
import type { BlogPost } from './blogShared';
import { hybridSearch } from '../lib/searchIndex';

interface Props { posts: BlogPost[] }

export default function SearchResults({ posts }: Props) {
  const [q, setQ] = useState('');
  const [state, setState] = useState<{ ids: string[]; semantic: boolean; done: boolean }>({ ids: [], semantic: false, done: false });

  useEffect(() => {
    const term = (new URLSearchParams(window.location.search).get('q') || '').trim();
    setQ(term);
    if (!term) { setState({ ids: [], semantic: false, done: true }); return; }
    document.title = `“${term}” · Search · AI News`;
    hybridSearch(term)
      .then((r) => setState({ ...r, done: true }))
      .catch(() => setState({ ids: [], semantic: false, done: true }));
  }, []);

  const byId = new Map(posts.map((p) => [p.id, p]));
  const ordered = state.ids.map((id) => byId.get(id)).filter((p): p is BlogPost => Boolean(p));
  const intro = !q
    ? 'Type a query in the box below.'
    : !state.done
      ? `Searching for “${q}”…`
      : `${ordered.length} result${ordered.length === 1 ? '' : 's'} for “${q}” · ${state.semantic ? 'keyword + meaning' : 'keyword only'}`;

  return (
    <BlogPage
      posts={ordered}
      heading="Search"
      intro={intro}
      emptyMessage={!q ? '// enter a search above' : state.done ? '// nothing matched — try fewer or different words' : '// searching…'}
    />
  );
}
```

```tsx
// app/ai-news/search/page.tsx
import type { Metadata } from 'next';
import fs from 'node:fs';
import path from 'node:path';
import ClientLayout from '../../components/ClientLayout';
import SearchResults from '../../components/SearchResults';
import type { BlogPost } from '../../components/blogShared';

// Query-driven, so never indexed; the canonical for any query is the list itself.
export const metadata: Metadata = {
  title: 'Search · AI News · CloudCodeTree',
  description: 'Search every AI News post by keyword and by meaning.',
  robots: { index: false, follow: true },
  alternates: { canonical: 'https://cloudcodetree.com/' },
};

export default function SearchPage() {
  const file = path.join(process.cwd(), 'public', 'blog', 'posts.json');
  const posts = JSON.parse(fs.readFileSync(file, 'utf8')) as BlogPost[];
  const slim = posts.map(({ content, ...rest }) => rest);
  return (
    <ClientLayout>
      <SearchResults posts={slim} />
    </ClientLayout>
  );
}
```

- [ ] **Step 3: Verify in dev**

Open http://localhost:3000/ai-news/search/?q=rag .
Expected: heading "Search", intro shows a count and "keyword only" (no Worker in dev), cards render, pagination works, the topic chips still narrow the results, and the page's own search box works. Empty `?q=` shows "// enter a search above".

- [ ] **Step 4: Lint and commit**

```bash
pnpm run lint
git add app/components/BlogPage.tsx app/components/SearchResults.tsx app/ai-news/search/page.tsx
git commit -m "feat(search): results page at /ai-news/search/ and BlogPage presentation props

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Topic pages and chips as links

**Files:**
- Create: `app/ai-news/topic/[slug]/page.tsx`
- Modify: `app/components/BlogPage.tsx` (chips link to topic pages; the current topic is highlighted)

**Interfaces:**
- Consumes: `topicTags`, `slugForTag` from `scripts/lib/topics.mjs` (typed by `topics.d.ts`); `BlogPage` props from Task 11.

- [ ] **Step 1: The route**

```tsx
// app/ai-news/topic/[slug]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'node:fs';
import path from 'node:path';
import ClientLayout from '../../../components/ClientLayout';
import BlogPage from '../../../components/BlogPage';
import type { BlogPost } from '../../../components/blogShared';
import { topicTags } from '../../../../scripts/lib/topics.mjs';

function readPosts(): BlogPost[] {
  const file = path.join(process.cwd(), 'public', 'blog', 'posts.json');
  return JSON.parse(fs.readFileSync(file, 'utf8')) as BlogPost[];
}

// One static page per topic tag (every tag except AI). A new tag in the feed
// gets its page on the next build — generate-feeds.mjs adds the matching feed
// and sitemap entry from the same topicTags() list.
export function generateStaticParams() {
  return topicTags(readPosts()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = topicTags(readPosts()).find((t) => t.slug === slug);
  if (!topic) return { title: 'AI News · CloudCodeTree' };
  const url = `https://cloudcodetree.com/ai-news/topic/${slug}/`;
  return {
    title: `${topic.tag} · AI News · CloudCodeTree`,
    description: `${topic.count} AI News post${topic.count === 1 ? '' : 's'} tagged ${topic.tag}: daily field notes on AI-assisted engineering.`,
    alternates: { canonical: url, types: { 'application/rss+xml': `${url}feed.xml` } },
    openGraph: { title: `${topic.tag} · AI News`, url, siteName: 'CloudCodeTree', type: 'website' },
  };
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const posts = readPosts();
  const topic = topicTags(posts).find((t) => t.slug === slug);
  if (!topic) notFound();
  const slim = posts.filter((p) => p.tags.includes(topic.tag)).map(({ content, ...rest }) => rest);
  return (
    <ClientLayout>
      <BlogPage
        posts={slim}
        heading={topic.tag}
        intro={`${topic.count} post${topic.count === 1 ? '' : 's'} tagged ${topic.tag}.`}
        feedPath={`/ai-news/topic/${slug}/feed.xml`}
        topic={{ tag: topic.tag, slug }}
      />
    </ClientLayout>
  );
}
```

If `tsc` rejects the `.mjs` import from `app/`, add `"allowJs": true` is already set; the `.d.ts` beside the module supplies types. If Next's ESLint `import/no-relative-packages`-style rule complains, add `// eslint-disable-next-line` on that import — it is the deliberate single source.

- [ ] **Step 2: Chips become links**

In `BlogPage.tsx`:
- import `slugForTag`: `import { slugForTag } from '../../scripts/lib/topics.mjs';` and `Link` is already imported.
- In the "Topic filter" block, render each chip as a link, highlighted when it is the page's topic OR is in `selectedTags` (legacy `?topics=` links):

```tsx
          {topics.map(({ tag, count }) => {
            const on = topic?.tag === tag || selectedTags.includes(tag);
            return (
              <Chip
                key={tag}
                component={Link}
                href={`/ai-news/topic/${slugForTag(tag)}/`}
                clickable
                label={`${tag} ${count}`}
                size="small"
                sx={{ …unchanged sx… }}
              />
            );
          })}
```
Remove the `onClick={() => toggleTag(tag)}` and delete the now-unused `toggleTag` function. Keep `clearTags` and the "Clear" chip — they still serve `?topics=` links. Keep `selectedTags` and its URL sync unchanged.

- [ ] **Step 3: Verify**

Run: `pnpm run build 2>&1 | grep -E 'topic/|error' | head -5 && ls out/ai-news/topic | wc -l`
Expected: build succeeds; `39` topic directories in `out/ai-news/topic/`, each containing `index.html` and `feed.xml`. Then `rm -rf out` (build and dev share `./out`).

In dev: open http://localhost:3000/ai-news/topic/claude-code/ — heading "Claude Code", the Claude Code chip highlighted, Subscribe copies `/ai-news/topic/claude-code/feed.xml`. On http://localhost:3000/ click a chip → navigates to its topic page. http://localhost:3000/?topics=Security still filters client-side.

- [ ] **Step 4: Lint and commit**

```bash
pnpm run lint
git add 'app/ai-news/topic/[slug]/page.tsx' app/components/BlogPage.tsx
git commit -m "feat(discovery): a static page per topic; chips link to them

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 13: The Related strip

**Files:**
- Create: `app/components/RelatedPosts.tsx`
- Modify: `app/components/BlogPost.tsx` (`related` prop)
- Modify: `app/ai-news/[id]/page.tsx` (read `related.json`)

**Interfaces:**
- Produces: `<RelatedPosts posts={BlogPost[]} />` renders nothing for an empty list; otherwise a "Related" strip of compact cards with a `data-related` attribute on the wrapper (the parity contract looks for it).
- `BlogPost` gains `related?: BlogPost[]`.

- [ ] **Step 1: Component**

```tsx
// app/components/RelatedPosts.tsx
'use client';

import { Box, Typography, Grid } from '@mui/material';
import Link from 'next/link';
import { BlogPost, SERIF, MONO, LINK, formatLongDate } from './blogShared';
import { Corners } from './Blueprint';

const border = '1px solid rgba(148,163,184,0.12)';

/** Up to five nearest posts by meaning, chosen at build time (public/blog/related.json). */
export default function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (!posts.length) return null;
  return (
    <Box component="section" data-related aria-labelledby="related-heading" sx={{ mt: 6 }}>
      <Typography id="related-heading" sx={{ fontFamily: MONO, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'text.secondary', mb: 2 }}>
        Related
      </Typography>
      <Grid container spacing={2}>
        {posts.map((p) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.id}>
            <Box component={Link} href={`/ai-news/${p.id}/`}
              sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, height: '100%', p: 2, border, position: 'relative', textDecoration: 'none', transition: 'border-color .2s', '&:hover': { borderColor: 'rgba(148,188,227,0.55)' } }}>
              <Corners />
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: 'text.secondary', letterSpacing: '0.04em' }}>{formatLongDate(p.date)}</Typography>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.2, color: 'text.primary', '&:hover': { color: LINK } }}>{p.title}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
```

- [ ] **Step 2: Wire it**

`BlogPost.tsx`: signature becomes `export default function BlogPost({ post, related = [] }: { post: Post; related?: Post[] })`; add `import RelatedPosts from './RelatedPosts';` and render `<RelatedPosts posts={related} />` immediately after the closing `</Card>`.

`app/ai-news/[id]/page.tsx`: add

```ts
function readRelated(): Record<string, string[]> {
  // Generated by scripts/index-search.mjs; absent on local builds without a token.
  const file = path.join(process.cwd(), 'public', 'blog', 'related.json');
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}
```
and in `Page`:
```tsx
  const posts = readPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) notFound();
  const byId = new Map(posts.map((p) => [p.id, p]));
  const related = (readRelated()[id] || [])
    .map((rid) => byId.get(rid))
    .filter((p): p is Post => Boolean(p))
    .map(({ content, ...rest }) => rest as Post);
  return (
    <ClientLayout>
      <BlogPost post={post} related={related} />
    </ClientLayout>
  );
```
(replace the existing `readPosts().find(...)` line accordingly).

- [ ] **Step 3: Prove it with a hand-made related.json**

Run:
```bash
node -e "const p=require('./public/blog/posts.json');const r={};r[p[0].id]=p.slice(1,6).map(x=>x.id);require('fs').writeFileSync('public/blog/related.json',JSON.stringify(r))"
```
Open the newest article in dev (`/ai-news/<p[0].id>/`).
Expected: a "Related" strip with five cards under the body. Open any other article: no strip. Then restore: `node scripts/index-search.mjs --dry-run` (writes `{}` without a token).

- [ ] **Step 4: Lint and commit**

```bash
pnpm run lint
git add app/components/RelatedPosts.tsx app/components/BlogPost.tsx 'app/ai-news/[id]/page.tsx'
git commit -m "feat(discovery): Related strip on every article from build-time neighbors

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 14: CI, parity contract, rate limit, docs

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Modify: `scripts/check-parity.mjs`
- Create: `infra/ratelimit.tf`
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-09-07-ai-news-search-discovery-design.md`

- [ ] **Step 1: CI steps**

In `.github/workflows/deploy.yml`, in the `build` job between "Validate research log ↔ feed consistency" and "Build":

```yaml
    # Search index: embed changed posts (Workers AI) into Vectorize and write
    # public/blog/related.json for the build. Diff-based, so an unchanged
    # corpus makes zero model calls. Never fails the deploy — content always
    # ships; the next push catches the index up.
    - name: Index posts for search
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      run: node scripts/index-search.mjs || echo "::warning title=search index::index-search failed; search runs keyword-only until the next push"

    - name: Dry-run the search indexer (PR builds)
      if: github.event_name != 'push'
      run: node scripts/index-search.mjs --dry-run
```

- [ ] **Step 2: Parity cases**

Append to `CONTRACT` in `scripts/check-parity.mjs`:

```js
  // Search + discovery (2026-09). /api/search is 503 until the bindings and
  // index exist — both are acceptable "delivered" states; 404 is not.
  { path: '/api/search?q=claude+code',            status: [200, 503], contentType: /application\/json/ },
  { path: '/api/search',                          status: 400 },
  { path: '/ai-news/search/',                     status: 200, contentType: /text\/html/ },
  { path: '/ai-news/topic/claude-code/',          status: 200, contentType: /text\/html/, bodyIncludes: 'Claude Code' },
  { path: '/ai-news/topic/claude-code/feed.xml',  status: 200, bodyIncludes: '<rss' },
  // Oldest post (frozen back-catalog, never trimmed): the Related strip is
  // baked in once the index has run at least once on main.
  { path: '/ai-news/2026-05-28-19-amd-venice-enters-production-on-tsmc-2nm/', status: 200, bodyIncludes: 'data-related' },
```
The `data-related` case will fail on beta until the index has run on `main` once; that is expected and documented in Task 15.

- [ ] **Step 3: Rate limit in OpenTofu**

```hcl
# infra/ratelimit.tf
# Zone rate limiting (phase http_ratelimit). Free plan: one rule, 10 s period,
# 10 s mitigation, block only. Protects the one endpoint that calls a model:
# /api/search. Everything else is static and cached at the edge.

resource "cloudflare_ruleset" "ratelimit" {
  zone_id     = cloudflare_zone.cloudcodetree.id
  name        = "default"
  description = "Zone rate limits"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules = [
    {
      ref         = "search-api-30-per-10s"
      description = "/api/search: 30 requests per 10 s per IP → 429 for 10 s"
      expression  = "(http.request.uri.path eq \"/api/search\")"
      action      = "block"
      enabled     = true
      ratelimit = {
        characteristics     = ["cf.colo.id", "ip.src"]
        period              = 10
        requests_per_period = 30
        mitigation_timeout  = 10
      }
    },
  ]
}
```

Run: `node scripts/tofu.mjs plan`
Expected: `Plan: 1 to add, 0 to change, 0 to destroy.` If the provider reports the `ref` must be a hex string, drop the `ref` line (it only pins identity across applies). Do NOT apply yet — Task 15 applies after the endpoint exists.

- [ ] **Step 4: Docs**

`CLAUDE.md`:
- In **Blog ("AI News")** add a paragraph after "Rendering.":

> **Search + discovery (2026-09).** Hybrid search: keywords in the browser (MiniSearch over the generated `public/blog/search-index.json`) merged by reciprocal rank fusion with meaning from `GET /api/search?q=` (`worker/search.ts`: Workers AI `bge-base` embeds the query, Vectorize index `cct-search` answers; 1 h cache; 503 = keyword-only). The index is filled by `node scripts/index-search.mjs` in the CI deploy job (diff-based; state = `search/manifest.json` on the R2 bucket), which also writes the generated `public/blog/related.json` behind the **Related** strip on every article. `/ai-news/topic/<slug>/` (+ `feed.xml`) exists per tag from `scripts/lib/topics.mjs` — the ONE slug source for scripts and app code. `--dry-run` never touches Cloudflare; no token = keyword-only + no related posts, never a failed build.

- In **Deployment → Environments/CI** mention the two bindings (`ai`, `vectorize`) and that the CI token carries Workers AI Read + Vectorize Edit.

Spec: under "Indexing", replace step 3's "Lists the index's existing ids and hashes (Vectorize `list-vectors` + `getByIds`)" with "Reads the last run's manifest from R2 (`search/manifest.json`: per post hash, chunk count, date, mean vector)" and step 5's "Fetches every vector back" with "Uses the manifest's post vectors". Add one line under Operations: "Indexer state: the R2 manifest; deleting it forces a full re-embed on the next run."

- [ ] **Step 5: Commit**

```bash
pnpm test && pnpm run typecheck:worker
git add .github/workflows/deploy.yml scripts/check-parity.mjs infra/ratelimit.tf CLAUDE.md docs/superpowers/specs/2026-09-07-ai-news-search-discovery-design.md
git commit -m "chore(search): CI index step, parity cases, rate-limit rule, docs

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 15: Owner setup, beta, PR

This task has owner-only steps. Do the code-only parts first; stop and hand the owner the two commands when you reach them.

- [ ] **Step 1: Beta before any Cloudflare setup (proves the degraded path)**

```bash
rm -rf out && pnpm run build:staging && pnpm run deploy:staging
node scripts/check-parity.mjs --origin https://beta.cloudcodetree.com
```
Expected: every case passes except `data-related` (no index yet) and `/api/search` returns 503 (bindings declared, index absent → Worker deploy may FAIL if the Vectorize index does not exist yet; if `wrangler deploy` errors with "index not found", do Step 2 first, then redeploy). In a browser on beta: search box shows keyword results and the footer says `keyword`.

- [ ] **Step 2: OWNER — create the index (once)**

```bash
pnpm exec wrangler vectorize create cct-search --dimensions=768 --metric=cosine
pnpm exec wrangler vectorize create-metadata-index cct-search --property-name=postId --type=string
pnpm exec wrangler vectorize create-metadata-index cct-search --property-name=date --type=number
pnpm exec wrangler vectorize list-metadata-index cct-search
```
Expected: index created; both metadata indexes listed. Metadata indexes must exist BEFORE the first upsert.

- [ ] **Step 3: OWNER — re-mint the CI token**

In the Cloudflare dashboard, edit the existing token (or create a replacement with the same scopes as `docs/superpowers/plans/2026-08-25-cutover-runbook.md` "Step 2" lists) and ADD: **Workers AI: Read** and **Vectorize: Edit** (account scope). Put the value in `.env` as `CLOUDFLARE_API_TOKEN=…`, then:

```bash
node scripts/set-ci-secrets.mjs
node scripts/index-search.mjs --dry-run
node scripts/index-search.mjs
```
Expected: secrets updated; dry run plans 857 posts; the real run embeds them (a few minutes; ~2,300 vectors), uploads the manifest, writes a populated `related.json`. Re-run `node scripts/index-search.mjs` — Expected: `0 post(s) to embed … 857 unchanged`, zero model calls.

- [ ] **Step 4: Beta, for real**

```bash
rm -rf out && pnpm run build:staging && pnpm run deploy:staging
node scripts/check-parity.mjs --origin https://beta.cloudcodetree.com --sweep
node scripts/tofu.mjs apply
```
Expected: contract all green including `data-related`; `/api/search?q=claude+code` returns 200 JSON with ids; sweep all-200 (it now includes 39 topic pages); tofu adds the rate-limit rule.

Browser on https://beta.cloudcodetree.com/ (hard reload — stale edge cache bites): type a query → keyword rows instantly, footer flips to `keyword + meaning` within a second; Enter → results page with a count; open an article → Related strip; open `/ai-news/topic/security/` and its `feed.xml`. Take one screenshot of each for the PR.

- [ ] **Step 5: PR**

```bash
pnpm run lint && pnpm test && pnpm run typecheck:worker
git push -u origin feat/ai-news-search
gh pr create --base main --title "AI News search and discovery" --body-file - <<'MD'
Hybrid search (Workers AI + Vectorize for meaning, MiniSearch in the browser for keywords), a Related strip on every article, and a page + feed per topic tag. Free plan throughout; without bindings or a token everything degrades to keyword-only.

Spec: docs/superpowers/specs/2026-09-07-ai-news-search-discovery-design.md
Plan: docs/superpowers/plans/2026-09-07-ai-news-search-discovery.md

Verified on beta: parity contract + sweep green, search box / results / related / topic page screenshots attached.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
MD
```
After merge, CI indexes (no-op if beta's run already synced), deploys, then:
```bash
node scripts/check-parity.mjs --origin https://cloudcodetree.com --sweep
```
Expected: all green on production.

---

## Self-review (done while writing)

- **Spec coverage:** indexing (T2–T6), query endpoint (T8), search UI + results (T9–T11), related (T13), topic pages + feeds + sitemap (T7, T12), operations: bindings (T8), token/index setup (T15), cost cap (by construction, T8 503), cache + rate limit (T8, T14), CI failure policy (T14), local dev degrade (T9/T10), CSP unchanged (nothing to do), testing (each task), acceptance (T14 parity, T15 beta), rollout (T15), docs (T14). The spec's "validate every topic slug in the sitemap has a page" is satisfied by construction (both derive from `topicTags()`), plus the collision test in T1.
- **Deviation recorded:** manifest on R2 instead of Vectorize list/getByIds (header + T14 spec edit).
- **Simplification vs. spec:** chips are links everywhere; "further chip narrowing" on a topic page becomes navigation to another topic. `?topics=` links still filter client-side.
- **Type consistency:** `topicTags` → `{tag, slug, count}` used identically in T7 and T12; `hybridSearch` returns `{ ids, semantic }` in T9 and is consumed as such in T10/T11; `handleSearch` cache param typed `CacheLike` in T8 test and impl; manifest shape identical in T4, T5, T6.
