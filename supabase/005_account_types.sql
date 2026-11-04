-- 005: account types. Signups say whether they are an individual or a
-- business; individuals pick an employment status (one option is trader) and
-- businesses say whether they trade. Businesses get the ledger; traders and
-- trading businesses get the trade journal. Owners and admins get everything.
-- Run in the Supabase SQL editor. Safe to run twice. No ledger rows change.

alter table public.profiles add column if not exists account_type text;
alter table public.profiles add column if not exists employment text;
alter table public.profiles add column if not exists business_trades boolean not null default false;

alter table public.profiles drop constraint if exists profiles_account_type_check;
alter table public.profiles add constraint profiles_account_type_check
  check (account_type is null or account_type in ('person', 'business'));

alter table public.profiles drop constraint if exists profiles_employment_check;
alter table public.profiles add constraint profiles_employment_check
  check (employment is null or employment in
    ('student', 'employed', 'self_employed', 'trader', 'retired', 'not_working', 'other'));

-- Users may change their own answers later (Account page). Role stays locked.
grant update (full_name, locale, disclaimer_accepted_at, account_type, employment, business_trades)
  on public.profiles to authenticated;

-- New signups: copy the answers from the signup form into the profile. Values
-- come from the browser, so anything outside the allowed lists is dropped, and
-- role is never read from them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_type text := meta->>'account_type';
  v_employment text := meta->>'employment';
  v_trades boolean := false;
begin
  if v_type is null or v_type not in ('person', 'business') then
    v_type := null;
  end if;

  if v_type is distinct from 'person' or v_employment is null or v_employment not in
    ('student', 'employed', 'self_employed', 'trader', 'retired', 'not_working', 'other') then
    v_employment := null;
  end if;

  if v_type = 'business' and meta->>'business_trades' = 'true' then
    v_trades := true;
  end if;

  insert into public.profiles (id, account_type, employment, business_trades)
  values (new.id, v_type, v_employment, v_trades)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Who may use which tool. Mirrored in src/lib/access.ts for the screens.
create or replace function public.has_ledger_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (role in ('owner', 'admin') or account_type = 'business')
  );
$$;

create or replace function public.has_journal_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (
        role in ('owner', 'admin')
        or (account_type = 'person' and employment = 'trader')
        or (account_type = 'business' and business_trades)
      )
  );
$$;

grant execute on function public.has_ledger_access() to anon, authenticated;
grant execute on function public.has_journal_access() to anon, authenticated;

-- Ledger: rows stay private to their account; the account needs ledger access.
-- Every existing policy on these tables is looked up and dropped first.
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

create policy "Ledger users manage their own transactions"
  on public.transactions for all to authenticated
  using (user_id = auth.uid() and public.has_ledger_access())
  with check (user_id = auth.uid() and public.has_ledger_access());

create policy "Ledger users manage their own presets"
  on public.presets for all to authenticated
  using (user_id = auth.uid() and public.has_ledger_access())
  with check (user_id = auth.uid() and public.has_ledger_access());

create policy "Ledger users manage their own managed list items"
  on public.managed_list_items for all to authenticated
  using (user_id = auth.uid() and public.has_ledger_access())
  with check (user_id = auth.uid() and public.has_ledger_access());

create policy "Ledger users manage their own audit log"
  on public.audit_log for all to authenticated
  using (user_id = auth.uid() and public.has_ledger_access())
  with check (user_id = auth.uid() and public.has_ledger_access());

drop policy if exists "Staff manage their own receipts" on storage.objects;
drop policy if exists "Ledger users manage their own receipts" on storage.objects;
create policy "Ledger users manage their own receipts"
  on storage.objects for all to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text and public.has_ledger_access())
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text and public.has_ledger_access());
