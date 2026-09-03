-- =========================================================================
-- FIX LIVE CHAT ROW LEVEL SECURITY (RLS) POLICIES & PERMISSIONS
-- Copy and paste this script into your Supabase SQL Editor and click "Run".
-- =========================================================================

-- 1. Ensure table schema has all required columns
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

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender text not null,
  content text not null,
  created_at timestamptz default now()
);

-- 2. Add any potentially missing columns if tables already existed
alter table public.conversations add column if not exists user_identifier text;
alter table public.conversations add column if not exists user_name text default '';
alter table public.conversations add column if not exists user_email text default '';
alter table public.conversations add column if not exists user_phone text default '';
alter table public.conversations add column if not exists reason text default '';
alter table public.conversations add column if not exists status text default 'open';
alter table public.conversations add column if not exists created_at timestamptz default now();
alter table public.conversations add column if not exists last_message_at timestamptz default now();
alter table public.conversations add column if not exists closed_at timestamptz;
alter table public.conversations add column if not exists last_seen_at timestamptz;
alter table public.conversations add column if not exists issue_resolved boolean;
alter table public.conversations add column if not exists feedback text default '';
alter table public.conversations add column if not exists rating integer;

-- 3. Grant table permissions to anon & authenticated roles
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.conversations to anon, authenticated, service_role;
grant all on table public.messages to anon, authenticated, service_role;

-- 4. Enable Row Level Security (RLS)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- 5. Drop any old or restrictive policies
drop policy if exists "Anyone can insert conversations" on public.conversations;
drop policy if exists "Anyone can select their conversation" on public.conversations;
drop policy if exists "Anyone can update their conversation" on public.conversations;
drop policy if exists "Authenticated can update conversations" on public.conversations;
drop policy if exists "Admin manage conversations" on public.conversations;
drop policy if exists "Allow all on conversations" on public.conversations;

drop policy if exists "Anyone can insert messages" on public.messages;
drop policy if exists "Anyone can select messages in their conversation" on public.messages;
drop policy if exists "Allow all on messages" on public.messages;

-- 6. Create permissive RLS policies for live visitor chat & admin access
create policy "Allow all on conversations"
  on public.conversations
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "Allow all on messages"
  on public.messages
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- 7. Add tables to Supabase Realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
exception when others then null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
exception when others then null;
end $$;
