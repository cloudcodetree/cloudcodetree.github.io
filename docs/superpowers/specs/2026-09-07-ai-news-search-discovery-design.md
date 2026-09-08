# AI News search and discovery — design

Date: 2026-09-07. Status: approved in conversation, awaiting written review.
Sub-project 1 of 4 in "the blog is more than a document" (search and
discovery → reader interaction → personalization → subscriptions).
Diagram: https://claude.ai/code/artifact/c6f739b4-0c2f-4266-979b-62682c6243d1

## Context

The site has been one Cloudflare Worker (`cct-site`) since 2026-09-05, with
Workers Static Assets serving the Next.js static export and the Worker
running only for `run_worker_first` paths (`/api/*`, the demo gate,
`/admin/*`). Identity and append-only analytics live in Supabase. Blog
images live on R2. The AI News blog itself is still a pure document: 857
posts (about 262k words, 40 tags) inlined in `public/blog/posts.json`,
prerendered to `/ai-news/<id>/`, with a client-side tag filter and no text
search.

This sub-project gives the blog real search and discovery without adding a
database, a paid tier, or a second deploy path.

## Decision: content in git, state in the database, indexes derived on deploy

Post bodies stay in `posts.json`, committed by the cloud routine and built
from the checkout. That keeps every build reproducible from git alone and
keeps every article prerendered. Nothing in the four planned sub-projects
needs bodies in a database:

- Search is a derived index (Vectorize), rebuilt incrementally on deploy.
- Related posts and topic pages are computed at build time.
- Reactions, bookmarks, and read state (later) are per-user rows in
  Supabase keyed by post id.
- A personalized feed (later) needs post metadata at request time; the
  Worker can read its own static assets, so a slim index is already
  reachable with no database.

The post id is the contract between all of them; it equals the feed GUID
and never changes.

Revisit when either trigger fires: the site needs to write posts at request
time (authoring UI, browser-editable drafts), or `posts.json` outgrows the
pipeline (roughly past 20 MB; it grows about 3 MB a year). At that point D1
on the same Worker is the natural home, and the move is mechanical because
everything downstream keys on post id. Note that D1's Free plan enforces
daily read/write limits as of 2026-09-01, another reason not to put article
rendering on a database path now.

## Goals

1. Hybrid search over every post: meaning (embeddings) plus keywords, with
   search-as-you-type in the AI News masthead and a shareable results page.
2. Related posts under every article, precomputed at build time.
3. A real page per topic tag, with its own metadata and RSS feed.
4. Free tier by construction: no path to a surprise bill; failures degrade
   to keyword-only search rather than a broken page.
5. No change to how posts are authored, ingested, validated, or deployed.

## Non-goals (explicitly out of scope)

Comments (the owner does not want them), reactions and bookmarks, the
personalized feed, email or push subscriptions, query analytics, and any
move of post bodies out of git. Each later sub-project gets its own spec.

## Architecture

Two pipelines share one Vectorize index, `cct-search` (768 dimensions,
cosine metric), on the existing Worker's account.

### Indexing — CI, deploy job, after image re-hosting, before the Next build

`scripts/index-search.mjs`:

1. Reads `posts.json`. Builds one document per post from title, excerpt,
   tags, and body (Markdown stripped to text).
2. Chunks. Posts under about 350 words are one vector; longer ones split at
   about 350 words on sentence boundaries with a short overlap. Vector ids
   are `<postId>#<n>`. Metadata per vector: `postId` (string), `date`
   (number, epoch days), `hash` (content hash of the whole post).
3. Diffs. Reads the last run's manifest from R2 (`search-manifest.json`: per
   post hash, chunk count, date, mean vector — a flat key, because the R2 API
   put percent-encodes a `/`), embeds only posts whose hash
   changed or that are new, upserts their vectors, and deletes vectors of
   posts that vanished. A run with nothing changed makes zero model calls.
4. Embeds through the Workers AI REST API with `@cf/baai/bge-base-en-v1.5`
   (768 dimensions, 512-token input cap; chunk size keeps every input under
   the cap). Batches inputs; retries with backoff.
5. Related posts. Uses the manifest's post vectors, ranks each post's
   neighbors by cosine similarity with a small recency tiebreak, and writes
   `public/blog/related.json` (`{ [postId]: [id, id, id, id, id] }`).
   Gitignored, generated like `feed.xml`. Each successful run also mirrors it
   to R2 as `search-related.json`; without a token (local builds, PR builds)
   the script writes that mirror instead — stale neighbors beat an empty strip
   — and falls back to an empty file only when no mirror exists.
6. Dry-run mode (`--dry-run`) runs the chunker and the diff on the real
   corpus without calling the model or writing to the index; PR builds use
   it.

Cost: the whole corpus embeds for roughly a fifth of one day's free Workers
AI allocation; one vector per post is about 660k stored dimensions against
a 5 million Free-plan cap, so chunking has ample headroom.

### Query — runtime, on the Worker

`GET /api/search?q=<text>` (already under `run_worker_first` via `/api/*`),
implemented in `worker/search.ts` and routed from `worker/index.ts`:

1. Method must be GET (405 otherwise). `q` is trimmed and capped at 200
   characters; empty gets 400.
2. Normalized query is the Cache API key. A hit returns immediately. Misses
   are cached for one hour, and the response carries
   `Cache-Control: public, max-age=3600` so the edge caches too.
3. Embeds the query with the `AI` binding, queries the `VECTORIZE` binding
   with `topK: 20`, collapses chunks to the best score per post, and
   returns `{ results: [{ id, score }] }`. No post content leaves the
   Worker; the browser hydrates titles and excerpts from the index it
   already holds.
4. A Workers AI or Vectorize quota error (Free-plan overage fails the call
   rather than billing) returns 503 with `Retry-After`. Any other upstream
   failure also returns 503. The client treats both as "keyword-only".
5. Logs count and latency only, never the query text.

Bindings in `wrangler.jsonc` for both production and staging: `ai`
(`AI`) and `vectorize` (`VECTORIZE` → `cct-search`). Staging reads the same
index and never writes to it; beta is noindex and the content is identical.

## Search UI

**Entry point.** A search field in the AI News masthead on the front page,
the legacy `/ai-news/` list, topic pages, and every article page, next to
the existing view toggle. On focus it lazily loads the keyword index, so
readers who never search pay nothing.

**Keyword index.** `public/blog/search-index.json`, emitted by
`scripts/generate-feeds.mjs` at prebuild alongside the sitemap: `id`,
`title`, `excerpt`, `tags`, `date` per post (about 300 KB, gitignored). In
the browser, MiniSearch (about 8 KB gzipped, no dependencies) indexes it
once with prefix and fuzzy matching, title weighted above excerpt.

**Search-as-you-type.** Each keystroke queries MiniSearch instantly. After a
250 ms debounce the client calls `/api/search` and merges the two lists
with reciprocal rank fusion (`app/lib/searchMerge.ts`, pure and tested), so
a post present in both lists rises. The dropdown shows the top eight with
title, date, and matched tags; arrow keys and Enter work; the last row is
"See all results". If the Worker call fails, returns 429/503, or exceeds
two seconds, keyword results stand alone and nothing visibly changes.

**Results page.** `/ai-news/search/?q=` is a static shell that reads the
query from the URL on the client, runs the same merged search, and renders
the full list with the existing card and list views and pagination. It is
`noindex`. A query with no results shows the topic chips.

**Reuse.** Result rows reuse the tag pill and card components from
`BlogPage`; the search index and the slim index `BlogPage` already embeds
are the same shape.

## Discovery

**Related posts.** Every article page gets a "Related" strip under the body
(`app/components/RelatedPosts.tsx`) with up to five posts from
`related.json`, rendered at build time by `app/ai-news/[id]/page.tsx` in
compact card form. No entry, no strip. Baked HTML means zero request-time
cost and crawlable internal links.

**Topic pages.** `app/ai-news/topic/[slug]/page.tsx`, one static route per
tag present in `posts.json` except the ubiquitous `AI`, including the three
content-type tags (News / Workflow / Tutorial), which matches the chips.
Slug = lowercased, hyphenated tag (`Claude Code` → `claude-code`); the slug
function is tested against the whole vocabulary for collisions. The page
reuses `BlogPage` with the posts prefiltered and a title set to the tag, so
view toggle and page size work as on the front page; chips navigate to other
topic pages; legacy `?topics=` links still filter client-side. Metadata: title "<Tag> · AI News", description with the post count,
canonical URL. New tags in the feed create their page on the next build.

**Chips become links.** Front-page topic chips link to their topic page.
Existing `?tags=` links keep working through the current client-side path.

**Feeds and sitemap.** Every topic page goes into the sitemap. Each gets a
per-topic RSS feed at `/ai-news/topic/<slug>/feed.xml`, emitted by
`generate-feeds.mjs` in the main feed's item format.

## Operations

**One-time setup.**
- Owner, with wrangler signed in: create the index (`wrangler vectorize
  create cct-search --dimensions=768 --metric=cosine`) and, before the
  first insert, metadata indexes on `postId` (string) and `date` (number).
  Vectorize cannot add metadata indexes after vectors exist, and the
  personalization feed will want to filter on date.
- Owner, in the dashboard: re-mint the CI token with Workers AI Read and
  Vectorize Edit added to its current scopes, drop it in `.env`, and run
  `node scripts/set-ci-secrets.mjs`. Until then the index step skips with a
  warning and search runs keyword-only.
- `node scripts/tofu.mjs apply` for the rate-limiting rule below.

**Cost is capped by construction.** On the Free plan, exceeding the daily
Workers AI allocation or the Vectorize quota fails the call rather than
billing. Nothing in this design can produce an invoice.

**Abuse and load.** Cache API plus edge cache by normalized query (one
hour). A zone rate-limiting rule on `/api/search` in OpenTofu
(`infra/ratelimit.tf`): 429 above 30 requests per 10 seconds per IP. The
Free plan includes one such rule. Query length cap and GET-only as above.

**Failure policy in CI.** The index step retries with backoff and, if
Workers AI or Vectorize is down, exits with a GitHub warning annotation but
does not fail the deploy: the routine's posts always ship, the script is
diff-based so the next push catches up, and `related.json` still builds
from whatever the index already holds.

**Indexer state.** The R2 manifest (`search-manifest.json`, read on every
tokened run including `--dry-run`; world-readable on the public bucket,
derived only from public content) and the `search-related.json` mirror;
deleting the manifest forces a full re-embed on the next run.

**CSP.** `connect-src 'self'` already covers `/api/search`; no change to
`public/_headers`.

**Local development.** Next dev has no Worker, so `/api/search` is absent
and the box degrades to keyword-only. Worker code is exercised through unit
tests with mocked bindings; the real path is verified on beta.

## Testing

**Worker (vitest, beside the gate and admin tests):** chunk collapse keeps
the best score per post; cache hit skips the model; empty and over-long
queries get 400; a quota error becomes 503 with Retry-After; non-GET gets
405.

**Indexer:** the chunker as a pure function (short posts one chunk, long
ones split on sentence boundaries with overlap, stable ids); the diff logic
(unchanged hash → no embed call, changed hash → re-embed, missing post →
delete); related-post ranking on a tiny synthetic vector set with a known
answer.

**Client:** reciprocal rank fusion (a post in both lists outranks one in
either alone; a failed semantic call returns the keyword list unchanged);
the slug function against every tag in the vocabulary.

**Build-time checks:** `validate-blog.mjs` verifies every id in
`related.json` exists in `posts.json` and every topic slug in the sitemap
has a page. PR builds run the indexer in dry-run mode.

**Acceptance:** `check-parity.mjs` gains five contract cases (a query, an
empty query, a topic page, a topic feed, a Related strip on a known
article). End to end on beta in a browser: type a query and see keyword
hits instantly and semantic hits merge in; open the results page from a
shared URL; open an article and see the Related strip; open a topic page
and its feed. Then the same contract against production.

## Rollout

1. Land the code on a feature branch behind nothing: with no bindings or
   token, everything degrades to keyword-only and empty Related strips, so
   the branch is safe to deploy to beta at any point.
2. Owner creates the index and re-mints the token.
3. Deploy to beta; run the acceptance list above.
4. PR to `main`; CI indexes and deploys; run the contract against
   production.
5. Update `CLAUDE.md` (Blog section: search, topic pages, related posts;
   Deployment: the two new bindings and the token scopes).

## Files

New: `scripts/index-search.mjs`, `worker/search.ts` (+ `search.test.ts`),
`app/components/SearchBox.tsx`, `app/components/RelatedPosts.tsx`,
`app/lib/searchMerge.ts` (+ test), `app/ai-news/search/page.tsx`,
`app/ai-news/topic/[slug]/page.tsx`, `infra/ratelimit.tf`.
Generated (gitignored): `public/blog/search-index.json`,
`public/blog/related.json`.
Modified: `wrangler.jsonc`, `worker/index.ts`,
`.github/workflows/deploy.yml`, `scripts/generate-feeds.mjs`,
`scripts/validate-blog.mjs`, `scripts/check-parity.mjs`,
`app/components/BlogPage.tsx`, `app/components/BlogPost.tsx`,
`app/ai-news/[id]/page.tsx`, `app/ai-news/page.tsx`, `package.json`
(minisearch), `.gitignore`, `CLAUDE.md`.
