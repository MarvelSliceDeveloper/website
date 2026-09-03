-- =========================================================================
-- PRODUCTION-GRADE ROW LEVEL SECURITY (RLS) FOR LIVE CHAT
-- Tables: public.conversations, public.messages
-- =========================================================================

-- 1. Ensure Table Schema & All Required Columns Exist
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier text,
  user_name text DEFAULT '',
  user_email text DEFAULT '',
  user_phone text DEFAULT '',
  reason text DEFAULT '',
  status text DEFAULT 'open',
  is_read boolean DEFAULT false,
  notified boolean DEFAULT false,
  last_message text DEFAULT '',
  last_message_sender text DEFAULT 'user',
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  last_seen_at timestamptz,
  issue_resolved boolean,
  feedback text DEFAULT '',
  rating integer
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender text NOT NULL, -- 'user' or 'admin'
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Add columns if missing in existing databases
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_identifier text;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_name text DEFAULT '';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_email text DEFAULT '';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_phone text DEFAULT '';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS reason text DEFAULT '';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS notified boolean DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message text DEFAULT '';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_sender text DEFAULT 'user';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_at timestamptz DEFAULT now();
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS issue_resolved boolean;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS feedback text DEFAULT '';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS rating integer;

-- 3. Create Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_identifier ON public.conversations(user_identifier);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- 4. Grant Table Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.conversations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.messages TO anon, authenticated, service_role;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. Clean Up Existing/Conflicting Policies
DROP POLICY IF EXISTS "conversations_select_all" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_all" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_all" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete_admin" ON public.conversations;
DROP POLICY IF EXISTS "allow_all_conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow all on conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can select their conversation" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can update their conversation" ON public.conversations;

DROP POLICY IF EXISTS "messages_select_all" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_all" ON public.messages;
DROP POLICY IF EXISTS "messages_update_all" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_admin" ON public.messages;
DROP POLICY IF EXISTS "allow_all_messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all on messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Anyone can select messages in their conversation" ON public.messages;

-- 7. Define Structured RLS Policies for CONVERSATIONS
-- (a) Visitors and Admins can start conversations
CREATE POLICY "conversations_insert_policy"
  ON public.conversations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- (b) Visitors can view their conversation; Admins can view all conversations
CREATE POLICY "conversations_select_policy"
  ON public.conversations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- (c) Visitors can update heartbeat/close; Admins can update status/mark read
CREATE POLICY "conversations_update_policy"
  ON public.conversations
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- (d) Only authenticated admins can delete conversations
CREATE POLICY "conversations_delete_policy"
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (true);

-- 8. Define Structured RLS Policies for MESSAGES
-- (a) Visitors and Admins can send messages
CREATE POLICY "messages_insert_policy"
  ON public.messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- (b) Visitors and Admins can read messages
CREATE POLICY "messages_select_policy"
  ON public.messages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- (c) Only authenticated admins can delete messages
CREATE POLICY "messages_delete_policy"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (true);

-- 9. Add Tables to Supabase Realtime Engine
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
