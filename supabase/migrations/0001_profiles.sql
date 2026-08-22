-- Optional, skippable visitor profile — filled by the one-time dialog after
-- first sign-in. Skip writes skipped=true so the dialog never re-asks.
create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  company    text,
  role       text,
  skipped    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A visitor may read and write exactly their own row; nothing else.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
