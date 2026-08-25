-- Banking Testimonials Table Schema
create table if not exists banking_testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  exam_name text,
  quote text not null,
  rating int default 5,
  avatar_url text,
  badge_text text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table banking_testimonials enable row level security;

drop policy if exists "Allow public select banking_testimonials" on banking_testimonials;
create policy "Allow public select banking_testimonials" on banking_testimonials for select to anon, authenticated using (true);

drop policy if exists "Allow public insert banking_testimonials" on banking_testimonials;
create policy "Allow public insert banking_testimonials" on banking_testimonials for insert to anon, authenticated with check (true);

drop policy if exists "Allow public update banking_testimonials" on banking_testimonials;
create policy "Allow public update banking_testimonials" on banking_testimonials for update to anon, authenticated using (true);

drop policy if exists "Allow public delete banking_testimonials" on banking_testimonials;
create policy "Allow public delete banking_testimonials" on banking_testimonials for delete to anon, authenticated using (true);
