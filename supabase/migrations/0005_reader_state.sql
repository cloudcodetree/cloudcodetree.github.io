-- Per-reader state for AI News posts: what has been opened, what is saved.
-- Sparse by construction — a row exists only for a post the reader has opened
-- or saved. post_id is the posts.json id (the same key search, related posts
-- and the feeds use).
create table public.reader_state (
  user_id    uuid not null references auth.users (id) on delete cascade,
  post_id    text not null check (post_id ~ '^[a-z0-9-]{1,80}$'),
  saved      boolean not null default false,
  read_at    timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.reader_state enable row level security;

-- A reader may read and write exactly their own rows; nothing else. No delete
-- policy: unsaving sets saved = false, so read state survives it.
create policy "reader_state_select_own" on public.reader_state
  for select to authenticated using (user_id = (select auth.uid()));
create policy "reader_state_insert_own" on public.reader_state
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "reader_state_update_own" on public.reader_state
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- The /saved page's only query.
create index reader_state_saved_idx on public.reader_state (user_id) where saved;
