create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table contact_submissions enable row level security;

create policy "Allow public insert contact_submissions"
on contact_submissions for insert
with check (true);

create policy "Allow public select contact_submissions"
on contact_submissions for select
using (true);

create policy "Allow public delete contact_submissions"
on contact_submissions for delete
using (true);
