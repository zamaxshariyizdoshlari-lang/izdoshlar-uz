-- Statistika (anonim hisoblagich), demo-saytlar va ularning ombori.
-- Statistika: cookie yoʻq, IP saqlanmaydi; "sid" har kun yangilanadigan qaytarib boʻlmaydigan xesh.

-- ============ Statistika hodisalari ============
create table public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  sid text not null,
  kind text not null check (kind in ('view', 'event')),
  name text not null default '' check (char_length(name) <= 40),
  path text not null default '' check (char_length(path) <= 300),
  referrer text not null default '' check (char_length(referrer) <= 200),
  utm_source text not null default '' check (char_length(utm_source) <= 100),
  utm_medium text not null default '' check (char_length(utm_medium) <= 100),
  utm_campaign text not null default '' check (char_length(utm_campaign) <= 100),
  device text not null default 'desktop' check (device in ('desktop', 'mobile', 'tablet')),
  browser text not null default '' check (char_length(browser) <= 40),
  os text not null default '' check (char_length(os) <= 40),
  country text not null default '' check (char_length(country) <= 2),
  lang text not null default '' check (char_length(lang) <= 10),
  meta jsonb not null default '{}'
);
create index analytics_events_created_idx on public.analytics_events (created_at desc);
create index analytics_events_kind_created_idx on public.analytics_events (kind, created_at desc);

alter table public.analytics_events enable row level security;
revoke all on public.analytics_events from anon, authenticated;
grant select on public.analytics_events to authenticated;
create policy "admin statistikani koradi" on public.analytics_events for select to authenticated using (private.is_admin());

-- ============ Demo-saytlar ============
create table public.demos (
  id bigint generated always as identity primary key,
  slug text not null unique default '',
  title text not null check (char_length(trim(title)) >= 2),
  description text not null default '',
  category text not null default 'sayt' check (category in ('sayt', 'bot', 'erp', 'kontent', 'boshqa')),
  kind text not null check (kind in ('url', 'files')),
  url text not null default '' check (url = '' or url ~* '^https://'),
  entry text not null default 'index.html' check (char_length(entry) <= 200),
  cover_url text not null default '',
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create or replace function private.set_demo_slug() returns trigger
language plpgsql set search_path = '' as $$
declare base text; candidate text; n int := 2;
begin
  if tg_op = 'UPDATE' then
    new.slug := old.slug;
    return new;
  end if;
  if new.slug is null or new.slug = '' then
    base := trim(both '-' from regexp_replace(lower(translate(new.title, 'ʻʼ‘’''', '')), '[^a-z0-9]+', '-', 'g'));
    base := left(coalesce(nullif(base, ''), 'demo'), 60);
    candidate := base;
    while exists (select 1 from public.demos d where d.slug = candidate) loop
      candidate := base || '-' || n;
      n := n + 1;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end $$;
create trigger demos_slug before insert or update on public.demos
  for each row execute function private.set_demo_slug();

alter table public.demos enable row level security;
revoke insert, update, delete, truncate on public.demos from anon;
create policy "oqish: korsatilganlar, admin hammasini" on public.demos for select to anon, authenticated using (published or private.is_admin());
create policy "admin qoshadi" on public.demos for insert to authenticated with check (private.is_admin());
create policy "admin yangilaydi" on public.demos for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin ochiradi" on public.demos for delete to authenticated using (private.is_admin());

-- Yuklangan demo fayllari. DIQQAT: Supabase HTML'ni text/plain qilib beradi; sayt ularni sandbox iframe'da oʻzi koʻrsatadi.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('demos', 'demos', true, 26214400, array[
  'text/html', 'text/css', 'text/javascript', 'application/javascript', 'application/json', 'text/plain',
  'application/manifest+json', 'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif',
  'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', 'font/woff', 'font/woff2', 'font/ttf', 'font/otf'
])
on conflict (id) do nothing;

create policy "admin demolarni koradi" on storage.objects for select to authenticated
  using (bucket_id = 'demos' and private.is_admin());
create policy "admin demo yuklaydi" on storage.objects for insert to authenticated
  with check (bucket_id = 'demos' and private.is_admin());
create policy "admin demoni yangilaydi" on storage.objects for update to authenticated
  using (bucket_id = 'demos' and private.is_admin()) with check (bucket_id = 'demos' and private.is_admin());
create policy "admin demoni ochiradi" on storage.objects for delete to authenticated
  using (bucket_id = 'demos' and private.is_admin());

-- ============ Statistika hisobi (faqat admin) ============
create or replace function public.admin_stats(p_days int default 30)
returns jsonb language plpgsql stable set search_path = '' as $$
declare
  v_days int := greatest(least(coalesce(p_days, 30), 365), 1);
  v_today date := (now() at time zone 'Asia/Tashkent')::date;
  v_from timestamptz := ((v_today - (v_days - 1))::timestamp) at time zone 'Asia/Tashkent';
  v_prev_from timestamptz := ((v_today - (2 * v_days - 1))::timestamp) at time zone 'Asia/Tashkent';
  cur jsonb; prev jsonb;
begin
  if not private.is_admin() then
    raise exception 'Ruxsat yoq' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'visitors', coalesce((select count(distinct (((created_at at time zone 'Asia/Tashkent')::date), sid)) from public.analytics_events where kind = 'view' and created_at >= v_from), 0),
    'views', (select count(*) from public.analytics_events where kind = 'view' and created_at >= v_from),
    'orders', (select count(*) from public.orders where created_at >= v_from),
    'demo_opens', (select count(*) from public.analytics_events where kind = 'event' and name = 'demo_open' and created_at >= v_from)
  ) into cur;

  select jsonb_build_object(
    'visitors', coalesce((select count(distinct (((created_at at time zone 'Asia/Tashkent')::date), sid)) from public.analytics_events where kind = 'view' and created_at >= v_prev_from and created_at < v_from), 0),
    'views', (select count(*) from public.analytics_events where kind = 'view' and created_at >= v_prev_from and created_at < v_from),
    'orders', (select count(*) from public.orders where created_at >= v_prev_from and created_at < v_from),
    'demo_opens', (select count(*) from public.analytics_events where kind = 'event' and name = 'demo_open' and created_at >= v_prev_from and created_at < v_from)
  ) into prev;

  return jsonb_build_object(
    'days', v_days,
    'current', cur,
    'previous', prev,
    'live', (select count(distinct sid) from public.analytics_events where created_at > now() - interval '5 minutes'),
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object('date', d.day::date, 'visitors', coalesce(v.visitors, 0), 'views', coalesce(v.views, 0), 'orders', coalesce(o.orders, 0)) order by d.day), '[]')
      from generate_series(v_today - (v_days - 1), v_today, interval '1 day') as d(day)
      left join (
        select (created_at at time zone 'Asia/Tashkent')::date as day, count(distinct sid) as visitors, count(*) as views
        from public.analytics_events where kind = 'view' and created_at >= v_from group by 1
      ) v on v.day = d.day::date
      left join (
        select (created_at at time zone 'Asia/Tashkent')::date as day, count(*) as orders
        from public.orders where created_at >= v_from group by 1
      ) o on o.day = d.day::date
    ),
    'hourly', (
      select coalesce(jsonb_agg(jsonb_build_object('hour', h.hour, 'views', coalesce(x.views, 0)) order by h.hour), '[]')
      from generate_series(0, 23) as h(hour)
      left join (
        select extract(hour from created_at at time zone 'Asia/Tashkent')::int as hour, count(*) as views
        from public.analytics_events where kind = 'view' and created_at >= v_from group by 1
      ) x on x.hour = h.hour
    ),
    'pages', (select coalesce(jsonb_agg(t), '[]') from (
      select path, count(*) as views, count(distinct sid) as visitors from public.analytics_events
      where kind = 'view' and created_at >= v_from group by path order by views desc limit 10) t),
    'referrers', (select coalesce(jsonb_agg(t), '[]') from (
      select coalesce(nullif(referrer, ''), '') as name, count(distinct (((created_at at time zone 'Asia/Tashkent')::date), sid)) as visitors from public.analytics_events
      where kind = 'view' and created_at >= v_from group by 1 order by visitors desc limit 10) t),
    'utm', (select coalesce(jsonb_agg(t), '[]') from (
      select utm_source as name, count(distinct (((created_at at time zone 'Asia/Tashkent')::date), sid)) as visitors from public.analytics_events
      where kind = 'view' and created_at >= v_from and utm_source <> '' group by 1 order by visitors desc limit 10) t),
    'devices', (select coalesce(jsonb_agg(t), '[]') from (
      select device as name, count(distinct (((created_at at time zone 'Asia/Tashkent')::date), sid)) as visitors from public.analytics_events
      where kind = 'view' and created_at >= v_from group by 1 order by visitors desc) t),
    'browsers', (select coalesce(jsonb_agg(t), '[]') from (
      select coalesce(nullif(browser, ''), 'Nomaʼlum') as name, count(distinct (((created_at at time zone 'Asia/Tashkent')::date), sid)) as visitors from public.analytics_events
      where kind = 'view' and created_at >= v_from group by 1 order by visitors desc limit 8) t),
    'os', (select coalesce(jsonb_agg(t), '[]') from (
      select coalesce(nullif(os, ''), 'Nomaʼlum') as name, count(distinct (((created_at at time zone 'Asia/Tashkent')::date), sid)) as visitors from public.analytics_events
      where kind = 'view' and created_at >= v_from group by 1 order by visitors desc limit 8) t),
    'countries', (select coalesce(jsonb_agg(t), '[]') from (
      select coalesce(nullif(country, ''), '') as name, count(distinct (((created_at at time zone 'Asia/Tashkent')::date), sid)) as visitors from public.analytics_events
      where kind = 'view' and created_at >= v_from group by 1 order by visitors desc limit 10) t),
    'events', (select coalesce(jsonb_agg(t), '[]') from (
      select name, count(*) as count from public.analytics_events
      where kind = 'event' and created_at >= v_from group by name order by count desc limit 15) t),
    'demos', (select coalesce(jsonb_agg(t), '[]') from (
      select meta ->> 'slug' as slug, count(*) as opens from public.analytics_events
      where kind = 'event' and name = 'demo_open' and created_at >= v_from and meta ? 'slug' group by 1 order by opens desc limit 10) t),
    'orders_by_status', (select coalesce(jsonb_agg(t), '[]') from (
      select status as name, count(*) as count from public.orders where created_at >= v_from group by 1 order by count desc) t),
    'orders_by_service', (select coalesce(jsonb_agg(t), '[]') from (
      select service_type as name, count(*) as count from public.orders where created_at >= v_from group by 1 order by count desc) t)
  );
end $$;
revoke execute on function public.admin_stats(int) from public, anon;
grant execute on function public.admin_stats(int) to authenticated;
