# Reader state: bookmarks and read/unread — design

Date: 2026-09-09. Status: approved in conversation.
Sub-project B of "reader features" (A search analytics ✓ → **B reader state** →
C reactions → D highlights).

## Goal

A signed-in reader can see what they have already read and save posts for
later. On an archive of 862 posts growing by ~3/day, "what's new since I was
last here" is the thing a returning reader most needs.

This is the first reader-facing reason to have an account on the site —
until now sign-in existed only to open gated demos.

## Decisions taken

- **Opening an article marks it read.** No extra click; matches the
  daily-briefing shape of the blog.
- **Read posts dim in place, with a "Hide read" toggle.** Nothing vanishes
  unless the reader asks. The archive stays browsable.
- **Saved posts get a dedicated `/saved` page**, not just a filter.
- **Signed-in only.** Signed-out readers see none of these controls — not a
  teased feature they cannot use. (Reactions, sub-project C, will be the
  anonymous one.)

## Data

One table, following `profiles` exactly (same RLS shape, same "browser talks
to Supabase directly with the reader's JWT" pattern — no Worker involvement,
no service key anywhere):

```sql
create table public.reader_state (
  user_id    uuid not null references auth.users (id) on delete cascade,
  post_id    text not null check (post_id ~ '^[a-z0-9-]{1,80}$'),
  saved      boolean not null default false,
  read_at    timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
```

Sparse by construction: a row exists only for a post the reader has opened or
saved. `post_id` is the `posts.json` id — the same contract search, related
posts and the feeds all key on.

RLS: select / insert / update own rows only, mirroring the three `profiles`
policies. **No delete policy** — unsaving sets `saved = false` rather than
removing the row, so read state survives it.

Index: `create index reader_state_saved_idx on public.reader_state (user_id)
where saved;` — the `/saved` page's only query.

## Behavior

### Marking read

`BlogPost` fires one upsert on mount: `{ user_id, post_id, read_at: now() }`
with `onConflict: 'user_id,post_id'`, merging rather than overwriting `saved`.
Fire-and-forget: never awaited before render, failures swallowed exactly as
`logDemoOpen` does. Signed out → no call at all. Re-opening a read post
rewrites `read_at`; that is acceptable and keeps "last read" honest.

### The list

`BlogPage` loads the reader's state once per page load — a single
`select post_id, saved, read_at` — into a `Map`, and holds it in a context so
pagination, topic filtering and the view switcher never re-query. Read posts
get reduced opacity and a small "Read" marker; a **Hide read** toggle sits in
the controls row beside the topics button and composes with search, topics,
view and page size. Both the toggle and the dimming render only when signed
in; signed-out readers get today's list, unchanged.

### Saving

A bookmark control on the article page and on each list card toggles `saved`
and updates the in-memory map optimistically, reverting on failure.

### `/saved`

A real route with its own title and empty state, `robots: noindex` (the
content is per-reader). Static export means the page ships a shell: it renders
the empty state, then fills in once auth resolves and the saved ids arrive.
It reuses `BlogPage` the way topic pages do, so cards, pagination, search and
topic filtering all work inside it. Signed out, it shows a sign-in prompt
rather than an empty list.

## Risks and what they cost

- **Per-reader content on a prerendered page.** `/saved` must never serve one
  reader's HTML to another. It is `noindex`, ships empty, and populates only
  client-side. The same is true of the dimming: the server-rendered list is
  always the signed-out view, and read state is applied after hydration.
- **Write volume.** One upsert per article opened. At this traffic that is
  nothing; if it ever matters, debounce or batch on unload.
- **A reader with thousands of rows.** The list query returns every row for
  the user. At 862 posts the ceiling is 862 rows — a few tens of KB. Revisit
  only if the archive grows an order of magnitude.

## Non-goals

Reactions (C) and highlights (D). No anonymous state — nothing is stored for
signed-out readers, so there is no local-to-account merge path to write. No
cross-device conflict handling beyond last-write-wins, which is correct for a
boolean and a timestamp.

## Testing

- **Migration:** applied via `scripts/db-migrate.mjs`; RLS proven by trying to
  read another user's row and getting zero rows back.
- **Unit:** the pure parts — merging a state map into a post list, the
  hide-read filter composing with topic and search filters.
- **Browser, signed in:** open an article → it dims in the list; toggle Hide
  read → it disappears; save it → it appears on `/saved`; unsave → it leaves
  `/saved` but stays marked read.
- **Browser, signed out:** no toggle, no dimming, no bookmark control, and
  `/saved` shows a sign-in prompt. The list is byte-identical to today.
- **Parity:** `/saved/` returns 200 and carries `noindex`.
