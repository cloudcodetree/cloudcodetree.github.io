-- Append-only analytics. The Worker writes AS THE VISITOR (their JWT), so the
-- with-check below is the enforcement that nobody logs events for anyone else.
-- There is deliberately NO select policy: the table is write-only through the
-- API — even its own author reads zero rows via PostgREST. Reads happen in the
-- dashboard/SQL editor, authenticated as the project owner.
create table public.demo_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  event      text not null check (event in ('demo_open', 'profile_saved')),
  slug       text not null check (slug ~ '^[a-z0-9-]{1,64}$'),
  country    text,
  referrer   text,
  created_at timestamptz not null default now()
);

alter table public.demo_events enable row level security;

create policy "demo_events_insert_own" on public.demo_events
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Signups are NOT logged here — auth.users already records them, and
-- duplicating that invites the two to disagree.

create index demo_events_slug_created_idx on public.demo_events (slug, created_at desc);
create index demo_events_user_idx on public.demo_events (user_id);
