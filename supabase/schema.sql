-- TRUCAPITALVENTURES ledger, core schema
-- Run this in the Supabase SQL editor after creating a new project.

create extension if not exists "uuid-ossp";

-- One row per logged transaction (income or expense)
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  type text not null check (type in ('income', 'expense')),
  date timestamptz not null,
  amount numeric(12,2) not null,
  accounts int,           -- income only: number of accounts; total = amount * accounts
  purchases int,          -- expense only: number of purchases; total = amount * purchases
  item text,               -- expense only
  vendor text,              -- expense: "where bought"; income: firm/source
  account_method text,      -- expense only: card/bank used
  preset_id uuid,
  created_at timestamptz default now()
);

create index idx_transactions_user_date on transactions (user_id, date desc);

-- Saved quick-log presets
create table presets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  type text not null check (type in ('income', 'expense')),
  label text not null,
  item text,
  vendor text,
  account_method text,
  default_price numeric(12,2),
  default_purchases int,
  firm text,
  default_accounts int,
  default_amount numeric(12,2),
  created_at timestamptz default now()
);

create index idx_presets_user on presets (user_id);

-- Managed dropdown lists: vendors, cards/banks, firms, items
create table managed_list_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  category text not null check (category in ('vendor', 'accountMethod', 'firm', 'item')),
  name text not null,
  created_at timestamptz default now(),
  unique (user_id, category, name)
);

create index idx_managed_list_items_user on managed_list_items (user_id, category);

-- Audit log: full before/after snapshot of every create/update/delete
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  transaction_id uuid not null,
  action text not null check (action in ('create', 'update', 'delete')),
  timestamp timestamptz not null default now(),
  before jsonb,
  after jsonb
);

create index idx_audit_log_user_timestamp on audit_log (user_id, timestamp desc);

-- Row level security: every table scoped to its owning user.
alter table transactions enable row level security;
alter table presets enable row level security;
alter table managed_list_items enable row level security;
alter table audit_log enable row level security;

create policy "Users manage their own transactions"
  on transactions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage their own presets"
  on presets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage their own managed list items"
  on managed_list_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users manage their own audit log"
  on audit_log for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
