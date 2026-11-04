-- 006: trade journal. Trading accounts, trades, each trader's own checklist
-- rules and trading window, screenshots, daily notes, and AI reviews.
-- Every table: rows are private to their account AND the account needs
-- journal access (individual traders, trading businesses, owners, admins).
-- Run in the Supabase SQL editor. Safe to run twice. No ledger rows change.

-- ---------------------------------------------------------------------------
-- Each trader's settings: trading window and which stand-aside days apply.
-- ---------------------------------------------------------------------------
create table if not exists public.journal_settings (
  user_id uuid primary key references auth.users on delete cascade default auth.uid(),
  window_start time,
  window_end time,
  timezone text not null default 'America/New_York',
  avoid_fridays boolean not null default false,
  avoid_news_days boolean not null default false,
  avoid_holidays boolean not null default false,
  avoid_thanksgiving_week boolean not null default false,
  avoid_late_december boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint journal_settings_window_check check (
    (window_start is null and window_end is null) or (window_start < window_end)
  )
);

-- Each trader's own checklist, in order.
create table if not exists public.journal_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  label text not null check (char_length(label) between 1 and 200),
  position int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_journal_rules_user on public.journal_rules (user_id, position);

-- ---------------------------------------------------------------------------
-- Trading accounts (prop firm evaluations, funded accounts, personal).
-- ---------------------------------------------------------------------------
create table if not exists public.trading_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  label text not null check (char_length(label) between 1 and 120),
  firm text,
  account_type text check (account_type in ('evaluation', 'funded', 'personal')),
  platform text default 'Tradesea / Rithmic',
  starting_balance numeric(12,2),
  max_drawdown numeric(12,2),
  drawdown_type text check (drawdown_type in ('eod_trailing', 'intraday_trailing', 'static')),
  daily_loss_limit numeric(12,2),
  profit_target numeric(12,2),
  consistency_pct numeric(5,2) check (consistency_pct is null or (consistency_pct > 0 and consistency_pct <= 100)),
  status text not null default 'active' check (status in ('active', 'passed', 'failed', 'closed')),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

-- ---------------------------------------------------------------------------
-- Trades. P&L and R are computed in the app (src/lib/tradeMath.ts) and stored.
-- rule_checks holds the trader's checklist answers as
-- [{ "rule_id": uuid, "label": text, "followed": boolean }], keeping the label
-- so history still reads correctly if a rule is later renamed or removed.
-- ---------------------------------------------------------------------------
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  account_id uuid,
  instrument text not null check (instrument in ('NQ', 'MNQ', 'ES', 'MES', 'YM', 'MYM', 'RTY', 'M2K')),
  direction text not null check (direction in ('long', 'short')),
  entry_time timestamptz not null,
  exit_time timestamptz,
  entry_price numeric(10,2) not null,
  exit_price numeric(10,2),
  stop_price numeric(10,2),
  target_price numeric(10,2),
  contracts int not null check (contracts > 0),
  fees numeric(8,2) not null default 0 check (fees >= 0),
  points numeric(10,2),
  gross_pnl numeric(12,2),
  net_pnl numeric(12,2),
  r_multiple numeric(6,2),
  in_window boolean,
  stand_aside_day boolean,
  rule_checks jsonb not null default '[]'::jsonb check (jsonb_typeof(rule_checks) = 'array'),
  setup_grade text check (setup_grade in ('A', 'B', 'C', 'F')),
  emotion text check (emotion is null or char_length(emotion) <= 200),
  notes text check (notes is null or char_length(notes) <= 10000),
  tags text[] not null default '{}',
  source text not null default 'manual' check (source in ('manual', 'import')),
  external_id text,
  created_at timestamptz not null default now(),
  unique (user_id, external_id),
  unique (id, user_id),
  -- A trade can only point at an account owned by the same person.
  foreign key (account_id, user_id) references public.trading_accounts (id, user_id) on delete restrict
);
create index if not exists idx_trades_user_entry on public.trades (user_id, entry_time desc);

create table if not exists public.trade_screenshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  trade_id uuid not null,
  kind text not null check (kind in ('htf', 'entry', 'exit', 'other')),
  path text not null,
  created_at timestamptz not null default now(),
  foreign key (trade_id, user_id) references public.trades (id, user_id) on delete cascade
);
create index if not exists idx_trade_screenshots_trade on public.trade_screenshots (trade_id);

-- AI reviews (Phase 4). Owners and admins only, because the free Gemini tier
-- may use the data.
create table if not exists public.trade_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  trade_id uuid not null,
  model text,
  result jsonb not null,
  created_at timestamptz not null default now(),
  foreign key (trade_id, user_id) references public.trades (id, user_id) on delete cascade
);
create index if not exists idx_trade_reviews_user_created on public.trade_reviews (user_id, created_at desc);

create table if not exists public.journal_days (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  day date not null,
  bias text check (bias is null or char_length(bias) <= 200),
  premarket_plan text check (premarket_plan is null or char_length(premarket_plan) <= 10000),
  news_flags text[] not null default '{}',
  post_session text check (post_session is null or char_length(post_session) <= 10000),
  followed_plan boolean,
  created_at timestamptz not null default now(),
  unique (user_id, day)
);

-- ---------------------------------------------------------------------------
-- Row level security.
-- ---------------------------------------------------------------------------
alter table public.journal_settings enable row level security;
alter table public.journal_rules enable row level security;
alter table public.trading_accounts enable row level security;
alter table public.trades enable row level security;
alter table public.trade_screenshots enable row level security;
alter table public.trade_reviews enable row level security;
alter table public.journal_days enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['journal_settings', 'journal_rules', 'trading_accounts', 'trades', 'trade_screenshots', 'journal_days']
  loop
    execute format('drop policy if exists "Journal users manage their own rows" on public.%I', t);
    execute format(
      'create policy "Journal users manage their own rows" on public.%I for all to authenticated '
      || 'using (user_id = auth.uid() and public.has_journal_access()) '
      || 'with check (user_id = auth.uid() and public.has_journal_access())',
      t
    );
  end loop;
end;
$$;

drop policy if exists "Staff manage their own trade reviews" on public.trade_reviews;
create policy "Staff manage their own trade reviews"
  on public.trade_reviews for all to authenticated
  using (user_id = auth.uid() and public.is_staff())
  with check (user_id = auth.uid() and public.is_staff());

-- Private bucket for trade screenshots: trade-screenshots/<user_id>/<trade_id>/<file>
insert into storage.buckets (id, name, public)
values ('trade-screenshots', 'trade-screenshots', false)
on conflict (id) do nothing;

drop policy if exists "Journal users manage their own screenshots" on storage.objects;
create policy "Journal users manage their own screenshots"
  on storage.objects for all to authenticated
  using (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text and public.has_journal_access())
  with check (bucket_id = 'trade-screenshots' and (storage.foldername(name))[1] = auth.uid()::text and public.has_journal_access());

-- ---------------------------------------------------------------------------
-- Owners get Nathaniel's strategy preloaded (once, only if they have none).
-- ---------------------------------------------------------------------------
insert into public.journal_settings (user_id, window_start, window_end, avoid_fridays, avoid_news_days,
  avoid_holidays, avoid_thanksgiving_week, avoid_late_december)
select id, '09:30', '10:30', true, true, true, true, true
from public.profiles where role = 'owner'
on conflict (user_id) do nothing;

insert into public.journal_rules (user_id, label, position)
select p.id, r.label, r.position
from public.profiles p
cross join (values
  ('4 hour bias is clear', 1),
  ('Entry from a higher timeframe fair value gap', 2),
  ('1 minute inversion trigger', 3),
  ('Liquidity confluence (sweep, equal highs or lows, or session level)', 4)
) as r(label, position)
where p.role = 'owner'
  and not exists (select 1 from public.journal_rules j where j.user_id = p.id);
