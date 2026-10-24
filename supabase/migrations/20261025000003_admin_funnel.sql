-- Voronka: tashrif -> loyiha/demo -> tahlil yoki aloqa -> soʻrov. Hisob: kunlik noyob tashrif (kun + sid).
create or replace function public.admin_funnel(p_days integer default 30)
returns jsonb
language plpgsql
stable
set search_path to ''
as $$
declare
  v_days int := greatest(least(coalesce(p_days, 30), 365), 1);
  v_today date := (now() at time zone 'Asia/Tashkent')::date;
  v_from timestamptz := ((v_today - (v_days - 1))::timestamp) at time zone 'Asia/Tashkent';
  r record;
begin
  if not private.is_admin() then
    raise exception 'Ruxsat yoq' using errcode = '42501';
  end if;

  with v as (
    select (created_at at time zone 'Asia/Tashkent')::date as d, sid, kind, name, path
    from public.analytics_events
    where created_at >= v_from
  ),
  s as (
    select d, sid,
      bool_or(kind = 'view') as seen,
      bool_or((kind = 'view' and (path like '/loyihalar%' or path like '/demolar%')) or (kind = 'event' and name = 'demo_open')) as projects,
      bool_or(kind = 'view' and (path like '/tahlil%' or path like '/aloqa%' or path like '/narxlar%')) as intent,
      bool_or(kind = 'event' and name in ('order_submit', 'analysis_lead')) as lead
    from v group by d, sid
  )
  select count(*) filter (where seen) as visitors,
         count(*) filter (where projects) as projects,
         count(*) filter (where intent) as intent,
         count(*) filter (where lead) as leads
  into r from s;

  return jsonb_build_object('visitors', r.visitors, 'projects', r.projects, 'intent', r.intent, 'leads', r.leads);
end $$;

revoke all on function public.admin_funnel(integer) from public, anon;
grant execute on function public.admin_funnel(integer) to authenticated;
