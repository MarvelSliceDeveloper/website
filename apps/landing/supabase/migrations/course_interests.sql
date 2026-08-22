create table if not exists course_interests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete set null,
  course_title text,
  button_clicked text default 'Apply Now',
  terms_accepted boolean default true,
  launch_date timestamptz,
  full_name text not null,
  email text not null,
  phone text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table course_interests 
add column if not exists button_clicked text default 'Apply Now',
add column if not exists terms_accepted boolean default true;

alter table course_interests enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public insert course_interests') then
    create policy "Allow public insert course_interests"
    on course_interests for insert to anon, authenticated
    with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public select course_interests') then
    create policy "Allow public select course_interests"
    on course_interests for select to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public update course_interests') then
    create policy "Allow public update course_interests"
    on course_interests for update to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public delete course_interests') then
    create policy "Allow public delete course_interests"
    on course_interests for delete to anon, authenticated
    using (true);
  end if;
end $$;
