-- ============================================================
-- MARVEL SLICE — CUSTOM LINK-BASED MOCK EXAM SYSTEM MIGRATION
-- ============================================================

-- 1. Custom Mock Exams Table
create table if not exists public.custom_mock_exams (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text default 'General',
  time_limit_mins integer default 20,
  total_marks integer default 100,
  question_count_option integer default 25,
  registration_start_time timestamptz,
  exam_start_time timestamptz,
  rules_text text,
  feedback_questions jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Custom Mock Exam Questions Table
create table if not exists public.custom_mock_exam_questions (
  id uuid primary key default gen_random_uuid(),
  custom_mock_exam_id uuid references public.custom_mock_exams(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_option integer not null default 0,
  explanation text default '',
  marks integer default 1,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- 3. Custom Mock Exam Registrations Table
create table if not exists public.custom_mock_exam_registrations (
  id uuid primary key default gen_random_uuid(),
  custom_mock_exam_id uuid references public.custom_mock_exams(id) on delete cascade,
  user_name text not null,
  user_email text not null,
  user_phone text not null,
  user_dob date not null,
  user_department text not null,
  user_year text not null,
  user_college text not null,
  candidate_photo text,
  created_at timestamptz default now(),
  unique(custom_mock_exam_id, user_email)
);

-- 4. Custom Mock Exam Submissions Table
create table if not exists public.custom_mock_exam_submissions (
  id uuid primary key default gen_random_uuid(),
  custom_mock_exam_id uuid references public.custom_mock_exams(id) on delete cascade,
  registration_id uuid references public.custom_mock_exam_registrations(id) on delete set null,
  user_name text not null,
  user_email text not null,
  user_phone text not null,
  user_dob date,
  user_department text,
  user_year text,
  user_college text,
  candidate_photo text,
  score numeric default 0,
  total_questions integer default 0,
  correct_answers integer default 0,
  wrong_answers integer default 0,
  answers jsonb default '{}'::jsonb,
  feedback_answers jsonb default '{}'::jsonb,
  time_taken_seconds integer default 0,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.custom_mock_exams enable row level security;
alter table public.custom_mock_exam_questions enable row level security;
alter table public.custom_mock_exam_registrations enable row level security;
alter table public.custom_mock_exam_submissions enable row level security;

create policy "Allow public read custom_mock_exams" on public.custom_mock_exams for select using (true);
create policy "Allow admin write custom_mock_exams" on public.custom_mock_exams for all using (true);

create policy "Allow public read custom_mock_exam_questions" on public.custom_mock_exam_questions for select using (true);
create policy "Allow admin write custom_mock_exam_questions" on public.custom_mock_exam_questions for all using (true);

create policy "Allow public insert custom_mock_exam_registrations" on public.custom_mock_exam_registrations for insert with check (true);
create policy "Allow public select custom_mock_exam_registrations" on public.custom_mock_exam_registrations for select using (true);
create policy "Allow admin write custom_mock_exam_registrations" on public.custom_mock_exam_registrations for all using (true);

create policy "Allow public insert custom_mock_exam_submissions" on public.custom_mock_exam_submissions for insert with check (true);
create policy "Allow public select custom_mock_exam_submissions" on public.custom_mock_exam_submissions for select using (true);
create policy "Allow admin write custom_mock_exam_submissions" on public.custom_mock_exam_submissions for all using (true);
