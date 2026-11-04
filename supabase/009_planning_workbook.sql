-- 009: planning workbook. One private workbook per account (snapshot, goals,
-- checklist). Only the account itself can read or change it; owners see just
-- whether a client has started or finished, through client_progress().
-- Run in the Supabase SQL editor. Safe to run twice. No existing rows change.

create table if not exists public.planning_workbooks (
  user_id uuid primary key references auth.users on delete cascade default auth.uid(),
  data jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planning_workbooks_data_object check (jsonb_typeof(data) = 'object'),
  -- Generous for a few dozen lines of numbers, but stops runaway uploads.
  constraint planning_workbooks_data_size check (pg_column_size(data) <= 100000)
);

alter table public.planning_workbooks enable row level security;

drop policy if exists "Users manage their own workbook" on public.planning_workbooks;
create policy "Users manage their own workbook"
  on public.planning_workbooks for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- The owner report gains two columns, so the function is replaced (its return
-- type changes, which "create or replace" alone cannot do).
drop function if exists public.client_progress();
create function public.client_progress()
returns table (
  user_id uuid,
  email text,
  account_type text,
  lessons_completed int,
  average_score int,
  last_activity timestamptz,
  joined_at timestamptz,
  workbook_started boolean,
  workbook_completed boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    u.email::text,
    p.account_type,
    count(lp.id)::int,
    round(avg(lp.quiz_score))::int,
    greatest(max(lp.completed_at), max(w.updated_at)),
    u.created_at,
    bool_or(w.user_id is not null),
    bool_or(w.completed_at is not null)
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.lesson_progress lp on lp.user_id = p.id
  left join public.planning_workbooks w on w.user_id = p.id
  where public.is_owner() and p.role = 'client'
  group by p.id, u.email, p.account_type, u.created_at
  order by greatest(max(lp.completed_at), max(w.updated_at)) desc nulls last, u.created_at desc;
$$;

revoke execute on function public.client_progress() from public, anon;
grant execute on function public.client_progress() to authenticated;
