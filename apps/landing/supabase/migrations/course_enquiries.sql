create table if not exists course_enquiries (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete set null,
  course_title text,
  button_clicked text default 'Apply Now',
  terms_accepted boolean default true,
  full_name text not null,
  email text not null,
  phone text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table course_enquiries enable row level security;

drop policy if exists "Allow public insert course_enquiries" on course_enquiries;
create policy "Allow public insert course_enquiries" on course_enquiries for insert to anon, authenticated with check (true);

drop policy if exists "Allow public select course_enquiries" on course_enquiries;
create policy "Allow public select course_enquiries" on course_enquiries for select to anon, authenticated using (true);

drop policy if exists "Allow public update course_enquiries" on course_enquiries;
create policy "Allow public update course_enquiries" on course_enquiries for update to anon, authenticated using (true);

drop policy if exists "Allow public delete course_enquiries" on course_enquiries;
create policy "Allow public delete course_enquiries" on course_enquiries for delete to anon, authenticated using (true);
