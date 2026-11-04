-- 008: client portal. Lesson progress for every signed in account, plus an
-- owner-only summary of client progress. Lesson text lives in the code
-- (src/content/lessons), not the database.
-- Run in the Supabase SQL editor. Safe to run twice. No ledger rows change.

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  lesson_id text not null check (char_length(lesson_id) between 1 and 80),
  completed_at timestamptz not null default now(),
  quiz_score int check (quiz_score is null or quiz_score between 0 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

drop policy if exists "Users manage their own lesson progress" on public.lesson_progress;
create policy "Users manage their own lesson progress"
  on public.lesson_progress for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Owners read all lesson progress" on public.lesson_progress;
create policy "Owners read all lesson progress"
  on public.lesson_progress for select to authenticated
  using (public.is_owner());

-- Owner view: one row per client with lessons completed. Returns nothing for
-- anyone who is not an owner. Emails come from auth.users, which the browser
-- can't read directly, so this runs with elevated rights but checks is_owner().
create or replace function public.client_progress()
returns table (
  user_id uuid,
  email text,
  account_type text,
  lessons_completed int,
  average_score int,
  last_activity timestamptz,
  joined_at timestamptz
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
    max(lp.completed_at),
    u.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.lesson_progress lp on lp.user_id = p.id
  where public.is_owner() and p.role = 'client'
  group by p.id, u.email, p.account_type, u.created_at
  order by max(lp.completed_at) desc nulls last, u.created_at desc;
$$;

revoke execute on function public.client_progress() from public, anon;
grant execute on function public.client_progress() to authenticated;
