-- ============================================================
-- COMPLETE LIVE CHAT DATABASE SCHEMA & REALTIME CONFIGURATION
-- Copy & paste this entire script into your Supabase SQL Editor and click "Run".
-- ============================================================

-- 1. Create conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_identifier text,
  user_name text default '',
  user_email text default '',
  user_phone text default '',
  reason text default '',
  status text default 'open',
  created_at timestamptz default now(),
  last_message_at timestamptz default now(),
  closed_at timestamptz,
  last_seen_at timestamptz,
  issue_resolved boolean,
  feedback text default '',
  rating integer
);

-- 2. Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender text not null,
  content text not null,
  created_at timestamptz default now()
);

-- 3. Enable Performance Indexes
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_conversations_last_message_at on public.conversations(last_message_at desc);
create index if not exists idx_conversations_user_identifier on public.conversations(user_identifier);

-- 4. Enable Row Level Security (RLS)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Reset existing RLS policies to prevent duplicates
drop policy if exists "Anyone can insert conversations" on public.conversations;
drop policy if exists "Anyone can select their conversation" on public.conversations;
drop policy if exists "Anyone can update their conversation" on public.conversations;
drop policy if exists "Authenticated can update conversations" on public.conversations;

drop policy if exists "Anyone can insert messages" on public.messages;
drop policy if exists "Anyone can select messages in their conversation" on public.messages;

-- Create RLS Policies for conversations
create policy "Anyone can insert conversations"
  on public.conversations for insert to anon, authenticated
  with check (true);

create policy "Anyone can select their conversation"
  on public.conversations for select to anon, authenticated
  using (true);

create policy "Anyone can update their conversation"
  on public.conversations for update to anon, authenticated
  using (true);

-- Create RLS Policies for messages
create policy "Anyone can insert messages"
  on public.messages for insert to anon, authenticated
  with check (true);

create policy "Anyone can select messages in their conversation"
  on public.messages for select to anon, authenticated
  using (true);

-- 5. Enable Realtime Engine for Live Chat
do $$ begin
  alter publication supabase_realtime add table conversations;
exception when others then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table messages;
exception when others then null;
end $$;

-- 6. Message Cleanup Helper Function (Deletes messages older than 7 days)
create or replace function delete_old_chat_messages()
returns void
language sql
as $$
  delete from public.messages where created_at < now() - interval '7 days';
$$;
