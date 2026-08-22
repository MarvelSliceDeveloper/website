create table if not exists upcoming_course_interests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete set null,
  course_title text,
  launch_date timestamptz,
  full_name text not null,
  email text not null,
  phone text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table upcoming_course_interests enable row level security;

drop policy if exists "Allow public insert upcoming_course_interests" on upcoming_course_interests;
create policy "Allow public insert upcoming_course_interests" on upcoming_course_interests for insert to anon, authenticated with check (true);

drop policy if exists "Allow public select upcoming_course_interests" on upcoming_course_interests;
create policy "Allow public select upcoming_course_interests" on upcoming_course_interests for select to anon, authenticated using (true);

drop policy if exists "Allow public update upcoming_course_interests" on upcoming_course_interests;
create policy "Allow public update upcoming_course_interests" on upcoming_course_interests for update to anon, authenticated using (true);

drop policy if exists "Allow public delete upcoming_course_interests" on upcoming_course_interests;
create policy "Allow public delete upcoming_course_interests" on upcoming_course_interests for delete to anon, authenticated using (true);
