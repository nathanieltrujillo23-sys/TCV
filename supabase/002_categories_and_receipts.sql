-- Adds expense categories and receipt/invoice attachments.
-- Run this in the Supabase SQL editor (same place schema.sql was run) —
-- it's safe to run more than once.

alter table transactions add column if not exists category text;
alter table transactions add column if not exists receipt_path text;

alter table managed_list_items drop constraint if exists managed_list_items_category_check;
alter table managed_list_items add constraint managed_list_items_category_check
  check (category in ('vendor', 'accountMethod', 'firm', 'item', 'category'));

-- Private bucket for receipt/invoice attachments, one folder per user
-- (receipts/<user_id>/<transaction_id>/<filename>).
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "Users manage their own receipts" on storage.objects;
create policy "Users manage their own receipts"
  on storage.objects for all
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
