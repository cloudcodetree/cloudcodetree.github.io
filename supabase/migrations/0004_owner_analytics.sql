-- Owner-only read access to the analytics, for the /admin/analytics page.
--
-- demo_events stays write-only through the API (no select policy) and the
-- analytics schema stays unexposed. Instead one SECURITY DEFINER function
-- returns the views' rows, and it refuses everyone who is not listed in
-- site_owners. The Worker gates /admin/* on the same user id, so a visitor
-- has to get past both the edge and the database to read anything.
create table public.site_owners (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
-- RLS on, no policies: the table is invisible through the API by design.
alter table public.site_owners enable row level security;

insert into public.site_owners (user_id)
values ('e57766e4-81ca-438e-bb08-e45735dfda2c') -- chris@cloudcodetree.com
on conflict do nothing;

create or replace function public.owner_analytics(section text)
returns jsonb
language plpgsql
security definer
set search_path = public, analytics
as $$
begin
  if not exists (select 1 from public.site_owners o where o.user_id = (select auth.uid())) then
    raise exception 'not an owner' using errcode = '42501';
  end if;

  return case section
    when 'signups' then (select coalesce(jsonb_agg(to_jsonb(v)), '[]'::jsonb) from analytics.v_signups_daily v)
    when 'opens'   then (select coalesce(jsonb_agg(to_jsonb(v)), '[]'::jsonb) from analytics.v_demo_opens v)
    when 'recent'  then (select coalesce(jsonb_agg(to_jsonb(v)), '[]'::jsonb) from analytics.v_recent_activity v)
    else '[]'::jsonb
  end;
end
$$;

revoke all on function public.owner_analytics(text) from public;
grant execute on function public.owner_analytics(text) to authenticated;
