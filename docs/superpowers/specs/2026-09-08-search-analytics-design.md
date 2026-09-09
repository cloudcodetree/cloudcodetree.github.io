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
Logging misses deliberately therefore adds no new *retention* — it only makes
them findable without scanning every request.

**Correction (2026-09-08, after review): retention was the wrong frame, and the
paragraph above understated this.** `content/search-misses.jsonl` is committed
to `cloudcodetree.github.io`, which is a **PUBLIC repository**. Cloudflare's
seven-day request log is private to the account; this file is world-readable,
permanent, and mirrored by anyone who clones the repo. That is a change of
**audience**, not merely of durability, and the original text never said so.

The owner's decision: keep the file public, but only record searches a person
actually committed to, and scrub the obvious hazards.

- **Deliberate searches only.** `SearchBox` fires on a 250 ms pause with no
  minimum length, so a naive implementation would publish keystroke fragments
  of everything anyone ever typed. The results page sends `intent=submit`
  (`hybridSearch(q, { deliberate: true })`); the typeahead does not, and the
  Worker records nothing without it.
- **Three scrub rules**, applied in `logMiss()` before anything is written:
  skip `q.length < 3`; skip `/\S+@\S+/` (email-ish); skip `/\d{7,}/` (a long
  digit run — phone, card, account or order number). They are cheap and
  deliberately narrow: they catch the shapes that would be actively harmful to
  publish, not everything conceivably private.
- **Cache interaction.** The cache key stays the normalized `q` alone — adding
  the intent would double the model calls for every reader who types and then
  submits. A typeahead call therefore usually fills the cache first, so a
  deliberate search often returns from cache *before* the miss check; the
  handler reads the cached body on that path and records the miss anyway.
  Without that, the searches that matter most would be the only ones never
  recorded.

Two consequences to accept knowingly:

- A miss's text becomes permanent and public once harvested. Only deliberate
  zero-result queries are harvested; successful searches are never written down.
- If retention of query text is ever unacceptable, the lever is Cloudflare
  observability itself (`observability.enabled` in `wrangler.jsonc`), not the
  handler. Turning it off also costs all Worker debugging. Publication is a
  separate lever: stop committing the file, or drop the harvest step.

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
const MIN_SCORE = 0.68;
const results = collapseMatches(matches).filter((r) => r.score >= MIN_SCORE);
```

The floor is measured, not guessed — top score of 15 queries against the live
index, 2026-09-08:

- **Covered topics:** claude code hooks 0.854, rag evaluation 0.796, mcp server
  auth 0.791, prompt caching 0.758, embeddings drift 0.735, postgres connection
  pooling 0.711
- **Not covered:** kubernetes operator pattern 0.657, terraform state locking
  0.652, vim keybindings 0.636, django middleware 0.630
- **Nonsense:** zzqqxx 0.631, lasagna 0.616, weather 0.587, sourdough 0.583,
  my cat is sick 0.516

The second and third bands overlapping is correct and wanted: "vim keybindings"
is a genuine miss — a real thing the reader wanted and the archive does not
have — not noise, and both bands should log.

**Why 0.68 and not 0.70.** `vectorize`, a core topic of this blog, tops out at
**0.706**, so the covered band really starts there, and the gap between covered
and uncovered is `[0.657, 0.706]`. 0.70 sat at the very top of that gap: 0.006
of headroom for a core topic, with 0.043 of the gap wasted below. 0.68 sits near
the middle of the measured gap, which is where a threshold belongs when the
bands either side are this tight.

**This materially changes reader-visible result counts, and that is intended.**
Measured on the live index (unfiltered → above 0.68, with the rejected 0.70 for
comparison): `quantization` 17 → 3 (2 at 0.70); `context window` 19 → 5 (4);
`vectorize` 18 → 7 (3 — the clearest case for the lower floor). The tail was noise — twenty
"related-ish" posts for every query is not a search result, it is a shrug — but
it is a real behaviour change, not a no-op, and it is the reason the floor is a
single named constant rather than a magic number.

One caveat to hold onto: the keyword half of the merge indexes **title, excerpt
and tags only** (`app/lib/searchIndex.ts` builds MiniSearch over those fields),
so **semantic is the only path that reaches post bodies**. An empty semantic
list is still not an empty page — keyword hits survive the merge — but a query
whose only support is deep in a post's body has no keyword fallback, which is
another reason not to set the floor high.

The floor lives in the handler, not in `collapseMatches`, which stays a pure
best-score-per-post fold.

The miss log carries `top`, the best collapsed score before filtering (3 dp), so
the floor can be re-derived from real traffic instead of re-measured by hand; the
harvester keeps it on the row's first sighting. A miss served from cache has no
scores to report and omits it.

### 2. Harvest — `scripts/harvest-search-misses.mjs`

Queries the Workers observability API for `search_miss` events since the last
harvest and appends new ones to `content/search-misses.jsonl` (one JSON object
per line, committed):

```json
{"q":"langgraph checkpointing","first_seen":"2026-09-08","count":3,"top":0.657}
```

Rules:

- Dedupe on `q`. A query already in the file has its `count` incremented and
  its `first_seen` (and `top`) left alone.
- The file is append-friendly and human-greppable; order is by first sighting.
- Uses `CLOUDFLARE_API_TOKEN` (already carries the needed account scope) via
  the same `cfCredentials()` helper the other scripts use. Never prints it.
- **A committed cursor, `content/search-misses.state.json`
  (`{"last_event_ms": N}`), is what keeps `count` honest.** This spec originally
  said "CI runs daily" and sized a fixed 2-day window around that. It was wrong:
  `deploy.yml` is `on: push`, and the publishing routine pushes ~3x/day, so a
  fixed window re-harvests every event ~6 times and `count` — the field the
  dashboard and the routine rank by — is inflated from the first run. Each run
  therefore queries from `max(last_event_ms + 1, now − days)` and, on success,
  records the newest event timestamp it saw.
- `--days N` / `--days=N` (default 2) is the *floor* for that window: it bounds a
  first run or one with lost state, and the observability API caps it at 7 days.
  The window actually used is printed on every run.
- `--dry-run` prints both the new queries and the increments to existing ones,
  and writes nothing.
- Exits 0 when the token is absent or the API fails, printing a warning. This
  never blocks a deploy — it is telemetry, and the workflow step also carries
  `continue-on-error: true` so that is structural rather than conventional.
- It will not, however, write a *truncated* file: only ENOENT counts as "no file
  yet". An unreadable existing file (EACCES, EISDIR) aborts the run, because
  treating it as empty would replace the whole history with the current window.
  Writes go through a temp file + rename, since the workflow uses
  `cancel-in-progress`.
- `validate-blog.mjs` warns (never errors) once the file passes 500 rows — the
  same lesson as the rolling feed window: the routine reads the whole file, so an
  unbounded one quietly stops fitting in context.

### 3. Schedule — `.github/workflows/deploy.yml`

A step in the `rehost-images` job (which already commits to `main` and holds
`contents: write`), after the image re-host and before its commit step, so the
harvested file rides the commit that job already makes. Main pushes only. The
commit step stages both `content/search-misses.jsonl` and the cursor
`content/search-misses.state.json`, and both are committed from the start
(empty / zeroed) because `git diff` — the step's no-op guard — is blind to
untracked files.

### 4. Surface — the routine and the dashboard

**The routine.** `docs/ai-news-feed-contract.md` gains a short section telling
the run to read `content/search-misses.jsonl` when choosing topics, and to
treat a miss as evidence of demand rather than an instruction — a miss may be
off-topic for the blog, and the volume rules still apply.

**The dashboard.** `/admin/analytics/` gains a "Search misses" panel. Because
the file is committed, the server route reads it at build time and passes the
rows as a prop, exactly as `app/ai-news/[id]/page.tsx` reads `related.json`.
No new endpoint, no new credential, no client fetch. The panel shows the 25
highest-`count` misses with their first-seen dates, and renders nothing when the
file is absent or empty. Ranking by count rather than date is deliberate: a
repeated miss is the strongest signal in the file, and a date sort drops it off
the list as soon as 25 newer one-offs arrive.

## Testing

- **Unit (vitest):** the dedupe/merge function is pure and tested — a new
  query appends; a repeat increments `count` and preserves `first_seen`; a
  malformed line is skipped rather than throwing; ordering is stable; a duplicate
  `q` on two lines folds into one row. The cursor is pure and tested too, including
  "harvesting the same window twice does not change counts".
- **Worker:** a search where nothing clears the floor emits exactly one
  `search_miss` with the normalized query and its `top` score, and a search with
  matches emits none; a typeahead search (no `intent=submit`) emits none even when
  it misses; a deliberate search served FROM CACHE still emits exactly one; and each
  scrub rule (short, email-ish, long digit run) emits none.
- **Client:** `hybridSearch(q, { deliberate: true })` sends `intent=submit` and the
  default does not.
- **End to end:** run the harvester with `--dry-run` against the live account
  and confirm it reports the probe queries this session generated.

## Rollout

Land behind nothing: with no token the harvester is a no-op, the panel is
empty, and the handler's extra log line is inert until someone submits a search
that misses. The file starts empty and fills over days.
