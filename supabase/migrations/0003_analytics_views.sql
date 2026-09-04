-- Owner-facing views in a PRIVATE schema. `analytics` must never be added to
-- PostgREST's exposed schemas: a view runs with its owner's privileges, so an
-- API-reachable view over demo_events would hand every signed-in visitor the
-- read access the RLS policy deliberately withholds. Query these from the SQL
-- editor / dashboard only.
create schema if not exists analytics;

create or replace view analytics.v_signups_daily as
select
  date_trunc('day', u.created_at)::date as day,
  coalesce(u.raw_app_meta_data ->> 'provider', 'unknown') as provider,
  count(*) as signups
from auth.users u
group by 1, 2
order by 1 desc, 2;

create or replace view analytics.v_demo_opens as
select
  e.slug,
  count(*) as total_opens,
  count(distinct e.user_id) as unique_viewers,
  min(e.created_at) as first_open,
  max(e.created_at) as last_open
from public.demo_events e
where e.event = 'demo_open'
group by e.slug
order by total_opens desc;

-- The literal "whom" answer: email, name, company, which demo, when.
create or replace view analytics.v_recent_activity as
select
  e.created_at,
  u.email,
  p.full_name,
  p.company,
  p.role,
  e.event,
  e.slug,
  e.country
from public.demo_events e
join auth.users u on u.id = e.user_id
left join public.profiles p on p.user_id = e.user_id
order by e.created_at desc
limit 500;
