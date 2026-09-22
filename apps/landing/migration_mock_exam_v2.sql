-- ============================================================
-- MARVEL SLICE — MOCK EXAM SYSTEM V2 MIGRATION
-- ============================================================
-- Migration to upgrade Banking Mock Exam features:
-- 1. Scheduled Exam Start & Registration Start times (with 10-min timing guard)
-- 2. Question count selection (25, 50, 75, 100)
-- 3. Custom exam rules & guidelines text
-- 4. Candidate Registration extended details (Dept, Year, College, Candidate Photo)
-- 5. Server time synchronization RPC function (tamper-proof timing checks)
-- ============================================================

-- 1. Extend mock_exams table
alter table public.mock_exams add column if not exists question_count_option integer default 25;
alter table public.mock_exams add column if not exists registration_start_time timestamptz;
alter table public.mock_exams add column if not exists exam_start_time timestamptz;
alter table public.mock_exams add column if not exists rules_text text;

-- 2. Extend mock_exam_submissions table
alter table public.mock_exam_submissions add column if not exists user_department text;
alter table public.mock_exam_submissions add column if not exists user_year text;
alter table public.mock_exam_submissions add column if not exists user_college text;
alter table public.mock_exam_submissions add column if not exists candidate_photo text;

-- 3. RPC function to get current server time (prevents browser clock manipulation)
create or replace function public.get_server_time()
returns timestamptz
language sql
stable
security definer
as $$
  select now();
$$;

grant execute on function public.get_server_time() to anon, authenticated;
