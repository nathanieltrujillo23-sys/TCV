-- 004: roles (owner, admin, client), profiles, contact form inbox, and
-- tightened ledger access. Run in the Supabase SQL editor. Safe to run twice.
--
-- After this runs, the ledger only works for accounts with role 'owner' or
-- 'admin'. Assign roles in the same SQL run (see the Phase 0 instructions),
-- otherwise the ledger looks empty until you do. No ledger rows are changed.

-- ---------------------------------------------------------------------------
-- Profiles: one row per sign-in account, holding its role.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'client',
  full_name text,
  locale text not null default 'en' check (locale in ('en', 'es')),
  disclaimer_accepted_at timestamptz,
  created_at timestamptz default now()
);

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'admin', 'client'));

alter table public.profiles enable row level security;

-- Users may edit only these columns of their own row, never role or id.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, locale, disclaimer_accepted_at) on public.profiles to authenticated;

drop policy if exists "Users read their own profile" on public.profiles;
create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Every new signup gets a 'client' profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts created before this migration get a 'client' profile too.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- Role checks used by policies. security definer lets them read profiles
-- without tripping the profiles policies.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner');
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('owner', 'admin'));
$$;

grant execute on function public.is_owner() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Contact form inbox: anyone may submit, only owners may read.
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  topic text check (topic is null or char_length(topic) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can send a contact message" on public.contact_messages;
create policy "Anyone can send a contact message"
  on public.contact_messages for insert to anon, authenticated
  with check (status = 'new');

drop policy if exists "Owners read contact messages" on public.contact_messages;
create policy "Owners read contact messages"
  on public.contact_messages for select to authenticated
  using (public.is_owner());

drop policy if exists "Owners update contact messages" on public.contact_messages;
create policy "Owners update contact messages"
  on public.contact_messages for update to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ---------------------------------------------------------------------------
-- Tighten the ledger: rows stay private to their account AND the account must
-- be staff (owner or admin). Every existing policy on these tables is dropped
-- by looking it up, not by name, because Postgres combines policies with OR:
-- one leftover loose policy would silently keep the old access.
-- ---------------------------------------------------------------------------
do $$
declare
  pol record;
begin
  for pol in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('transactions', 'presets', 'managed_list_items', 'audit_log')
  loop
    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end;
$$;

create policy "Staff manage their own transactions"
  on public.transactions for all to authenticated
  using (user_id = auth.uid() and public.is_staff())
  with check (user_id = auth.uid() and public.is_staff());

create policy "Staff manage their own presets"
  on public.presets for all to authenticated
  using (user_id = auth.uid() and public.is_staff())
  with check (user_id = auth.uid() and public.is_staff());

create policy "Staff manage their own managed list items"
  on public.managed_list_items for all to authenticated
  using (user_id = auth.uid() and public.is_staff())
  with check (user_id = auth.uid() and public.is_staff());

create policy "Staff manage their own audit log"
  on public.audit_log for all to authenticated
  using (user_id = auth.uid() and public.is_staff())
  with check (user_id = auth.uid() and public.is_staff());

-- Receipts bucket: same rule for the files.
drop policy if exists "Users manage their own receipts" on storage.objects;
drop policy if exists "Staff manage their own receipts" on storage.objects;
create policy "Staff manage their own receipts"
  on storage.objects for all to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text and public.is_staff())
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text and public.is_staff());
