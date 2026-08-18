-- Adds a recurring flag (with weekly/monthly frequency) for expenses.
-- Run this in the Supabase SQL editor — safe to run more than once.

alter table transactions add column if not exists recurring boolean default false;
alter table transactions add column if not exists recurring_frequency text;

alter table transactions drop constraint if exists transactions_recurring_frequency_check;
alter table transactions add constraint transactions_recurring_frequency_check
  check (recurring_frequency is null or recurring_frequency in ('weekly', 'monthly'));
