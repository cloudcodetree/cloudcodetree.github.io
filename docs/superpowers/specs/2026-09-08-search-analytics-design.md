# Search analytics: what readers look for and cannot find — design

Date: 2026-09-08. Status: approved in conversation.
Sub-project A of "reader features" (A search analytics → B reader state →
C reactions → D highlights). Follows
`docs/superpowers/specs/2026-09-07-ai-news-search-discovery-design.md`.

## Goal

Learn which searches return nothing, so the publishing routine can pick
topics that readers actually wanted and could not find. Owner-facing only.
No new infrastructure, no new credential in the browser, no paid product.

## The privacy position, stated plainly

`worker/search.ts` deliberately logs counts and latency, never the query.
That property does **not** hold at the platform level: Cloudflare's own
request logging records the full URL, query string included, for roughly
seven days. Verified 2026-09-08 against the live Worker:

```
GET https://cloudcodetree.com/api/search?q=claude+code
```

So query text is already retained by the platform whatever the handler does.
Logging misses deliberately therefore adds **no new exposure** — it only makes
them findable without scanning every request. What this design adds that is
genuinely new is *durability*: harvested misses outlive the seven-day window
in a committed file.

Two consequences to accept knowingly:

- A miss's text becomes permanent once harvested. Only zero-result queries
  are harvested; successful searches are never written down.
- If retention of query text is ever unacceptable, the lever is Cloudflare
  observability itself (`observability.enabled` in `wrangler.jsonc`), not the
  handler. Turning it off also costs all Worker debugging.

## Non-goals

Storing successful queries; click-through or result-position tracking; any
per-visitor identity; a runtime analytics API; anything that writes to
Supabase (searchers are anonymous, and the existing `demo_events` path
depends on a signed-in visitor's JWT — writing anonymously would need either
a service key in the Worker, which this codebase has always refused, or an
insert policy anyone with the public anon key could flood).

Workers Analytics Engine is the purpose-built tool and was rejected only
because its free-plan availability could not be confirmed from the docs, and
this project is free-plan-only. Revisit if that changes.

## Design

### 1. Emit — `worker/search.ts`

When the collapsed result list is empty, emit one structured log line beside
the existing success log:

```ts
console.log(JSON.stringify({ event: 'search_miss', q }));
```

`q` is the already-normalized query (trimmed, whitespace-collapsed,
lowercased, capped at 200 chars). Nothing else is added: no IP, no country,
no identity. Successful searches keep logging `{ event: 'search', results, ms }`
with no query text.

A cache hit returns before the handler reaches this point, so a repeated
miss inside the one-hour cache window is logged once. That undercounts
frequency and is fine: the signal wanted is *which* queries fail, not how
many times.

**What "empty" means: nothing cleared the relevance floor.** Vectorize always
returns `topK` nearest neighbours, so an empty *unfiltered* list happens only
when the index itself is empty — as written above, the miss log would
essentially never fire, and a reader asking for something the archive lacks
would be handed twenty irrelevant posts. The handler therefore drops matches
below a cosine floor before deciding anything:

```ts
const MIN_SCORE = 0.7;
const results = collapseMatches(matches).filter((r) => r.score >= MIN_SCORE);
```

0.7 is measured, not guessed — top score of 15 queries against the live index,
2026-09-08:

- **Covered topics:** claude code hooks 0.854, rag evaluation 0.796, mcp server
  auth 0.791, prompt caching 0.758, embeddings drift 0.735, postgres connection
  pooling 0.711
- **Not covered:** kubernetes operator pattern 0.657, terraform state locking
  0.652, vim keybindings 0.636, django middleware 0.630
- **Nonsense:** zzqqxx 0.631, lasagna 0.616, weather 0.587, sourdough 0.583,
  my cat is sick 0.516

The nearest points either side of the floor are 0.657 and 0.711, so the split is
clean. The second and third bands overlapping is correct and wanted: "vim
keybindings" is a genuine miss — a real thing the reader wanted and the archive
does not have — not noise, and both bands should log.

The floor lives in the handler, not in `collapseMatches`, which stays a pure
best-score-per-post fold. And an empty semantic list is not an empty page: the
client (`app/lib/searchIndex.ts`) merges these results with its own keyword
index, so keyword hits still reach the reader when the semantic half returns
nothing.

### 2. Harvest — `scripts/harvest-search-misses.mjs`

Queries the Workers observability API for `search_miss` events since the last
harvest and appends new ones to `content/search-misses.jsonl` (one JSON object
per line, committed):

```json
{"q":"langgraph checkpointing","first_seen":"2026-09-08","count":3}
```

Rules:

- Dedupe on `q`. A query already in the file has its `count` incremented and
  its `first_seen` left alone.
- The file is append-friendly and human-greppable; order is by first sighting.
- Uses `CLOUDFLARE_API_TOKEN` (already carries the needed account scope) via
  the same `cfCredentials()` helper the other scripts use. Never prints it.
- `--days N` (default 2) bounds the query window; the observability API caps
  at 7 days, and CI runs daily, so 2 gives overlap without gaps.
- `--dry-run` prints what it would append and writes nothing.
- Exits 0 when the token is absent or the API fails, printing a warning. This
  never blocks a deploy — it is telemetry.

### 3. Schedule — `.github/workflows/deploy.yml`

A step in the `rehost-images` job (which already commits to `main` and holds
`contents: write`), after the image re-host and before its commit step, so the
harvested file rides the commit that job already makes. Main pushes only.

### 4. Surface — the routine and the dashboard

**The routine.** `docs/ai-news-feed-contract.md` gains a short section telling
the run to read `content/search-misses.jsonl` when choosing topics, and to
treat a miss as evidence of demand rather than an instruction — a miss may be
off-topic for the blog, and the volume rules still apply.

**The dashboard.** `/admin/analytics/` gains a "Search misses" panel. Because
the file is committed, the server route reads it at build time and passes the
rows as a prop, exactly as `app/ai-news/[id]/page.tsx` reads `related.json`.
No new endpoint, no new credential, no client fetch. The panel shows the most
recent misses with their counts, and renders nothing when the file is absent
or empty.

## Testing

- **Unit (vitest):** the dedupe/merge function is pure and tested — a new
  query appends; a repeat increments `count` and preserves `first_seen`; a
  malformed line is skipped rather than throwing; ordering is stable.
- **Worker:** a search whose Vectorize response yields no matches emits
  exactly one `search_miss` log with the normalized query, and a search with
  matches emits none.
- **End to end:** run the harvester with `--dry-run` against the live account
  and confirm it reports the probe queries this session generated.

## Rollout

Land behind nothing: with no token the harvester is a no-op, the panel is
empty, and the handler's extra log line is inert until someone searches for
something that misses. The file starts empty and fills over days.
