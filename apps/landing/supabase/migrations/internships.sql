create table if not exists internships (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  role_category_id uuid references role_categories(id) on delete set null,
  location text,
  type text default 'Internship',
  duration text,
  stipend text,
  experience text,
  apply_url text,
  description text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table internships enable row level security;

create policy "Allow public insert internships"
on internships for insert
with check (true);

create policy "Allow public select internships"
on internships for select
using (true);

create policy "Allow public update internships"
on internships for update
using (true);

create policy "Allow public delete internships"
on internships for delete
using (true);
