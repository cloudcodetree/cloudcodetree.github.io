-- Hardening pass over 0005. (0005 is already applied — this migration, not an
-- edit to that file, is how the shipped schema changes.)

-- 1. Widen the post_id shape. 80 chars left ~6 to spare over the longest id in
--    a 862-post archive growing ~3/day, and nothing upstream enforced the
--    pattern, so the first over-long or uppercase id would have failed BOTH
--    writes silently. 128 plus a leading-alphanumeric anchor; the same regex is
--    now asserted over posts.json by scripts/validate-blog.mjs, so the file and
--    this constraint cannot drift.
alter table public.reader_state drop constraint reader_state_post_id_check;
alter table public.reader_state add constraint reader_state_post_id_check
  check (post_id ~ '^[a-z0-9][a-z0-9-]{0,127}$');

-- 2. Drop the partial saved index. It was in the design spec, but the spec was
--    wrong: /saved is served from the same single `select post_id, saved,
--    read_at` the list uses — there is no query with a `saved` predicate for a
--    partial index to serve — and `user_id` is already the leading column of
--    the primary key. It could never be chosen by the planner.
drop index if exists public.reader_state_saved_idx;

-- 3. updated_at becomes server time. The client used to send it, which meant it
--    could be backdated by a wrong clock or simply omitted from a payload (an
--    upsert only writes the columns it sends). A trigger cannot be forgotten.
create or replace function public.reader_state_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger reader_state_set_updated_at
  before insert or update on public.reader_state
  for each row execute function public.reader_state_touch_updated_at();
