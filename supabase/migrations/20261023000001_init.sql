-- Izdoshlar: asosiy sxema, xavfsizlik qoidalari (RLS) va rasm ombori.
-- Tamoyil: ochiq foydalanuvchi faqat "saytda koʻrsatish" belgilangan kontentni OʻQIY oladi.
-- Buyurtma yozish faqat Edge Function (service_role) orqali. Boshqaruv faqat `admins` jadvalidagilarga.

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- ============ Adminlar ============
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security; -- siyosat yoʻq: faqat service_role/definer funksiya koʻradi
revoke all on public.admins from anon, authenticated;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;

-- ============ Kontent jadvallari ============
create table public.projects (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  category text not null check (category in ('sayt', 'erp', 'ai-bot', 'kontent')),
  summary text not null default '',
  problem text not null default '',
  solution text not null default '',
  result text not null default '',
  tech text[] not null default '{}',
  cover_url text not null default '',
  screenshots text[] not null default '{}',
  featured boolean not null default false,
  placeholder boolean not null default false,
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.packages (
  id bigint generated always as identity primary key,
  key text not null unique,
  name text not null,
  tagline text not null default '',
  price_text text not null default '',
  popular boolean not null default false,
  features text[] not null default '{}',
  published boolean not null default true,
  sort_order int not null default 0
);

create table public.comparison_rows (
  id bigint generated always as identity primary key,
  label text not null,
  "values" jsonb not null default '[]', -- masalan [false, true, "6 oy"]
  published boolean not null default true,
  sort_order int not null default 0
);

create table public.addons (
  id bigint generated always as identity primary key,
  name text not null,
  text text not null default '',
  price_text text not null default '',
  published boolean not null default true,
  sort_order int not null default 0
);

create table public.testimonials (
  id bigint generated always as identity primary key,
  author text not null,
  role text not null default '',
  text text not null,
  published boolean not null default true,
  sort_order int not null default 0
);

create table public.faq (
  id bigint generated always as identity primary key,
  scope text not null default 'home' check (scope in ('home', 'pricing')),
  question text not null,
  answer text not null,
  published boolean not null default true,
  sort_order int not null default 0
);

create table public.posts (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  description text not null default '',
  body text not null default '',
  date date not null default current_date,
  published boolean not null default true
);

create table public.products (
  id bigint generated always as identity primary key,
  slug text not null unique default '',
  title text not null check (char_length(trim(title)) >= 2),
  description text not null default '',
  category text not null default 'boshqa' check (category in ('taqdimot', 'shablon', 'video', 'boshqa')),
  price_text text not null default '',
  cover_url text not null default '',
  published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Mahsulot slug'i nomidan avtomatik yaratiladi va keyin oʻzgarmaydi
create or replace function private.set_product_slug() returns trigger
language plpgsql set search_path = '' as $$
declare base text; candidate text; n int := 2;
begin
  if tg_op = 'UPDATE' then
    new.slug := old.slug;
    return new;
  end if;
  if new.slug is null or new.slug = '' then
    base := trim(both '-' from regexp_replace(lower(translate(new.title, 'ʻʼ‘’''', '')), '[^a-z0-9]+', '-', 'g'));
    base := left(coalesce(nullif(base, ''), 'mahsulot'), 60);
    candidate := base;
    while exists (select 1 from public.products p where p.slug = candidate) loop
      candidate := base || '-' || n;
      n := n + 1;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end $$;
create trigger products_slug before insert or update on public.products
  for each row execute function private.set_product_slug();

-- Ochiq oʻqish (faqat koʻrsatilganlar) va admin boshqaruvi
do $$
declare t text;
begin
  foreach t in array array['projects', 'packages', 'comparison_rows', 'addons', 'testimonials', 'faq', 'posts', 'products'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon', t);
    execute format('create policy "oqish: korsatilganlar, admin hammasini" on public.%I for select to anon, authenticated using (published or private.is_admin())', t);
    execute format('create policy "admin qoshadi" on public.%I for insert to authenticated with check (private.is_admin())', t);
    execute format('create policy "admin yangilaydi" on public.%I for update to authenticated using (private.is_admin()) with check (private.is_admin())', t);
    execute format('create policy "admin ochiradi" on public.%I for delete to authenticated using (private.is_admin())', t);
  end loop;
end $$;

-- ============ Buyurtmalar ============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null default 'order' check (kind in ('order', 'demo')),
  status text not null default 'yangi' check (status in ('yangi', 'muzokara', 'jarayonda', 'tugadi')),
  status_changed_at timestamptz,
  admin_note text not null default '',
  name text not null check (char_length(name) between 2 and 100),
  phone text not null default '' check (phone = '' or phone ~ '^\+998[0-9]{9}$'),
  telegram text not null default '' check (char_length(telegram) <= 33),
  audience text not null default 'business' check (audience in ('school', 'business')),
  service_type text not null check (service_type in ('website', 'erp', 'timetable', 'bot', 'ai', 'content', 'other')),
  package text not null default 'custom' check (package in ('start', 'pro', 'maktab_biznes', 'custom')),
  budget_range text not null default 'unknown' check (budget_range in ('unknown', 'low', 'mid', 'high', 'talk')),
  description text not null default '' check (char_length(description) <= 3000),
  file_url text not null default '' check (char_length(file_url) <= 500),
  school_name text not null default '' check (char_length(school_name) <= 150),
  student_count int check (student_count is null or student_count between 1 and 100000),
  current_system text not null default '' check (char_length(current_system) <= 150),
  source_page text not null default '' check (char_length(source_page) <= 200),
  ip_hash text not null default '',
  consented_at timestamptz,
  notified_at timestamptz,
  notify_error text not null default ''
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create table public.order_status_changes (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status text not null,
  to_status text not null,
  changed_at timestamptz not null default now(),
  changed_by uuid
);
create index order_status_changes_order_idx on public.order_status_changes (order_id);

alter table public.orders enable row level security;
alter table public.order_status_changes enable row level security;
revoke all on public.orders from anon, authenticated;
revoke all on public.order_status_changes from anon, authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_status_changes to authenticated;

create policy "admin buyurtmalarni koradi" on public.orders for select to authenticated using (private.is_admin());
create policy "admin buyurtmani yangilaydi" on public.orders for update to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy "admin tarixni koradi" on public.order_status_changes for select to authenticated using (private.is_admin());

-- Admin faqat status va admin_note ni oʻzgartira oladi; har bir status oʻzgarishi tarixga yoziladi.
-- service_role (Edge Function) va dashboard (postgres) uchun cheklov yoʻq.
create or replace function private.orders_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce((select auth.role()), '') in ('authenticated', 'anon') then
    if (to_jsonb(new) - array['status', 'admin_note', 'status_changed_at'])
       is distinct from (to_jsonb(old) - array['status', 'admin_note', 'status_changed_at']) then
      raise exception 'Faqat status va admin_note ozgartiriladi' using errcode = '42501';
    end if;
  end if;
  if new.status is distinct from old.status then
    new.status_changed_at := now();
    insert into public.order_status_changes (order_id, from_status, to_status, changed_by)
    values (old.id, old.status, new.status, (select auth.uid()));
  end if;
  return new;
end $$;
create trigger orders_guard before update on public.orders
  for each row execute function private.orders_guard();

-- ============ Tezlikni cheklash (faqat Edge Function) ============
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

create or replace function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_hits int;
begin
  insert into public.rate_limits as rl (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then now() else rl.window_start end,
    hits = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1 else rl.hits + 1 end
  returning rl.hits into v_hits;
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;
  return v_hits <= p_limit;
end $$;
revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

-- Boshqaruv sahifasi: joriy foydalanuvchi admin ekanini tekshirish (faqat kirgan foydalanuvchi)
create or replace function public.am_i_admin() returns boolean
language sql stable set search_path = '' as $$ select private.is_admin() $$;
revoke execute on function public.am_i_admin() from public, anon;
grant execute on function public.am_i_admin() to authenticated;

-- ============ Rasm ombori ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "admin rasmlarni koradi" on storage.objects for select to authenticated
  using (bucket_id = 'media' and private.is_admin());
create policy "admin rasm yuklaydi" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and private.is_admin());
create policy "admin rasmni yangilaydi" on storage.objects for update to authenticated
  using (bucket_id = 'media' and private.is_admin()) with check (bucket_id = 'media' and private.is_admin());
create policy "admin rasmni ochiradi" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and private.is_admin());
