-- Custom Register (public registration form + admin Registrations inbox)
-- Table + open RLS policies (same pattern as other public submission tables).

create table if not exists public.custom_register (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  reg_no text,
  college_name text,
  address text,
  degree text,
  department text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.custom_register enable row level security;

drop policy if exists public_select_custom_register on public.custom_register;
drop policy if exists public_insert_custom_register on public.custom_register;
drop policy if exists public_update_custom_register on public.custom_register;
drop policy if exists public_delete_custom_register on public.custom_register;

create policy public_select_custom_register on public.custom_register for select to anon, authenticated using (true);
create policy public_insert_custom_register on public.custom_register for insert to anon, authenticated with check (true);
create policy public_update_custom_register on public.custom_register for update to anon, authenticated using (true);
create policy public_delete_custom_register on public.custom_register for delete to anon, authenticated using (true);

create index if not exists idx_custom_register_created on public.custom_register(created_at desc);
create index if not exists idx_custom_register_email on public.custom_register(email);
