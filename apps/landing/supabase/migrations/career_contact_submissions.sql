-- Career "Contact Us" form submissions (like contact_submissions)
create table if not exists career_contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table career_contact_submissions enable row level security;

create policy "Allow public insert career_contact_submissions"
on career_contact_submissions for insert
with check (true);

create policy "Allow public select career_contact_submissions"
on career_contact_submissions for select
using (true);

create policy "Allow public update career_contact_submissions"
on career_contact_submissions for update
using (true);

create policy "Allow public delete career_contact_submissions"
on career_contact_submissions for delete
using (true);
