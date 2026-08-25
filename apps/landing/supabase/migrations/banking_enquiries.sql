create table if not exists banking_enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  enquiry_type text not null default 'general',
  topic_title text,
  button_clicked text default 'Enquire Now',
  is_read boolean default false,
  terms_accepted boolean default true,
  created_at timestamptz default now()
);

alter table banking_enquiries enable row level security;

drop policy if exists "Allow public insert banking_enquiries" on banking_enquiries;
create policy "Allow public insert banking_enquiries" on banking_enquiries for insert to anon, authenticated with check (true);

drop policy if exists "Allow public select banking_enquiries" on banking_enquiries;
create policy "Allow public select banking_enquiries" on banking_enquiries for select to anon, authenticated using (true);

drop policy if exists "Allow public update banking_enquiries" on banking_enquiries;
create policy "Allow public update banking_enquiries" on banking_enquiries for update to anon, authenticated using (true);

drop policy if exists "Allow public delete banking_enquiries" on banking_enquiries;
create policy "Allow public delete banking_enquiries" on banking_enquiries for delete to anon, authenticated using (true);
