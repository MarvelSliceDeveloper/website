-- Migration: Create tables for Banking Mock Exams, Questions, and Submissions
create table if not exists public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text default 'Banking',
  time_limit_mins integer not null default 20,
  total_marks integer default 100,
  pass_marks integer default 40,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.mock_exam_questions (
  id uuid primary key default gen_random_uuid(),
  mock_exam_id uuid references public.mock_exams(id) on delete cascade,
  question_text text not null,
  options jsonb not null default '[]'::jsonb,
  correct_option integer not null default 0,
  explanation text,
  marks integer default 1,
  order_index integer default 0,
  created_at timestamptz default now()
);

create table if not exists public.mock_exam_submissions (
  id uuid primary key default gen_random_uuid(),
  mock_exam_id uuid references public.mock_exams(id) on delete cascade,
  user_name text not null,
  user_email text not null,
  user_phone text not null,
  score integer default 0,
  total_questions integer default 0,
  correct_answers integer default 0,
  wrong_answers integer default 0,
  answers jsonb default '{}'::jsonb,
  time_taken_seconds integer default 0,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS and public policies
alter table public.mock_exams enable row level security;
drop policy if exists "Allow public select mock_exams" on public.mock_exams;
create policy "Allow public select mock_exams" on public.mock_exams for select to anon, authenticated using (true);
drop policy if exists "Allow public insert mock_exams" on public.mock_exams;
create policy "Allow public insert mock_exams" on public.mock_exams for insert to anon, authenticated with check (true);
drop policy if exists "Allow public update mock_exams" on public.mock_exams;
create policy "Allow public update mock_exams" on public.mock_exams for update to anon, authenticated using (true);
drop policy if exists "Allow public delete mock_exams" on public.mock_exams;
create policy "Allow public delete mock_exams" on public.mock_exams for delete to anon, authenticated using (true);

alter table public.mock_exam_questions enable row level security;
drop policy if exists "Allow public select mock_exam_questions" on public.mock_exam_questions;
create policy "Allow public select mock_exam_questions" on public.mock_exam_questions for select to anon, authenticated using (true);
drop policy if exists "Allow public insert mock_exam_questions" on public.mock_exam_questions;
create policy "Allow public insert mock_exam_questions" on public.mock_exam_questions for insert to anon, authenticated with check (true);
drop policy if exists "Allow public update mock_exam_questions" on public.mock_exam_questions;
create policy "Allow public update mock_exam_questions" on public.mock_exam_questions for update to anon, authenticated using (true);
drop policy if exists "Allow public delete mock_exam_questions" on public.mock_exam_questions;
create policy "Allow public delete mock_exam_questions" on public.mock_exam_questions for delete to anon, authenticated using (true);

alter table public.mock_exam_submissions enable row level security;
drop policy if exists "Allow public select mock_exam_submissions" on public.mock_exam_submissions;
create policy "Allow public select mock_exam_submissions" on public.mock_exam_submissions for select to anon, authenticated using (true);
drop policy if exists "Allow public insert mock_exam_submissions" on public.mock_exam_submissions;
create policy "Allow public insert mock_exam_submissions" on public.mock_exam_submissions for insert to anon, authenticated with check (true);
drop policy if exists "Allow public update mock_exam_submissions" on public.mock_exam_submissions;
create policy "Allow public update mock_exam_submissions" on public.mock_exam_submissions for update to anon, authenticated using (true);
drop policy if exists "Allow public delete mock_exam_submissions" on public.mock_exam_submissions;
create policy "Allow public delete mock_exam_submissions" on public.mock_exam_submissions for delete to anon, authenticated using (true);
