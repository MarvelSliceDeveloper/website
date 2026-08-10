create table if not exists legal_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  title text default '',
  intro text default '',
  sections jsonb default '[]'::jsonb,
  is_published boolean default true,
  updated_at timestamptz default now()
);

alter table legal_pages enable row level security;

create policy "Allow public insert legal_pages"
on legal_pages for insert
with check (true);

create policy "Allow public select legal_pages"
on legal_pages for select
using (true);

create policy "Allow public update legal_pages"
on legal_pages for update
using (true);

create policy "Allow public delete legal_pages"
on legal_pages for delete
using (true);
