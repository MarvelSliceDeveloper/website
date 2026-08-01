-- Run this in your Supabase Dashboard SQL Editor

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_identifier text,
  user_name text default '',
  status text default 'open',
  created_at timestamptz default now(),
  last_message_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Enable Realtime for both tables
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;

-- RLS: allow public insert/select on both tables scoped by conversation
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Anyone can insert conversations"
  on conversations for insert to anon, authenticated
  with check (true);

create policy "Anyone can select their conversation"
  on conversations for select to anon, authenticated
  using (true);

create policy "Authenticated can update conversations"
  on conversations for update to authenticated
  using (true);

create policy "Anyone can insert messages"
  on messages for insert to anon, authenticated
  with check (true);

create policy "Anyone can select messages in their conversation"
  on messages for select to anon, authenticated
  using (true);

-- Index for faster listing
create index idx_messages_conversation_id on messages(conversation_id);
create index idx_conversations_last_message_at on conversations(last_message_at desc);
