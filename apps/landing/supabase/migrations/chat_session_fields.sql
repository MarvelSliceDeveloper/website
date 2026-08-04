-- Add email, phone, reason, closed_at to conversations table for chat session info
alter table conversations add column if not exists user_email text default '';
alter table conversations add column if not exists user_phone text default '';
alter table conversations add column if not exists reason text default '';
alter table conversations add column if not exists closed_at timestamptz;
alter table conversations add column if not exists last_seen_at timestamptz;
alter table conversations add column if not exists issue_resolved boolean;
alter table conversations add column if not exists feedback text default '';
alter table conversations add column if not exists rating integer;

-- Auto-delete chat messages older than 7 days (visitor details are kept)
create or replace function delete_old_chat_messages()
returns void
language sql
as $$
  delete from messages where created_at < now() - interval '7 days';
$$;

-- Allow anon users to update their conversations (needed for close flow from chat widget)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Anyone can update their conversation') then
    create policy "Anyone can update their conversation"
    on conversations for update to anon, authenticated
    using (true);
  end if;
end $$;

-- Schedule the cleanup to run daily via pg_cron (if extension available)
-- Uncomment if pg_cron is enabled on your Supabase project:
-- select cron.schedule('delete-old-chat-messages', '0 0 * * *', 'select delete_old_chat_messages();');
