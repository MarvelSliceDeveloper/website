-- Add is_read column to submission tables that are missing it

alter table career_submissions add column if not exists is_read boolean default false;
alter table contact_submissions add column if not exists is_read boolean default false;
alter table form_submissions add column if not exists is_read boolean default false;

-- Enable RLS if not already enabled (safe to re-run)
alter table career_submissions enable row level security;
alter table contact_submissions enable row level security;
alter table form_submissions enable row level security;

-- Allow admin reads (policy safe to re-create)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Allow admin read career_submissions') then
    create policy "Allow admin read career_submissions" on career_submissions
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow admin update career_submissions') then
    create policy "Allow admin update career_submissions" on career_submissions
      for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow admin read contact_submissions') then
    create policy "Allow admin read contact_submissions" on contact_submissions
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow admin update contact_submissions') then
    create policy "Allow admin update contact_submissions" on contact_submissions
      for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow admin read form_submissions') then
    create policy "Allow admin read form_submissions" on form_submissions
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow admin update form_submissions') then
    create policy "Allow admin update form_submissions" on form_submissions
      for update using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public insert career_submissions') then
    create policy "Allow public insert career_submissions" on career_submissions
      for insert with check (true);
  end if;
end $$;
