-- Telegram bot suhbat holati (buyurtma bosqichlari). Faqat service_role (Edge Function) kira oladi.
create table if not exists public.bot_sessions (
  chat_id bigint primary key,
  step text not null check (step in ('consent', 'name', 'phone', 'desc')),
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.bot_sessions enable row level security;
revoke all on public.bot_sessions from anon, authenticated;
