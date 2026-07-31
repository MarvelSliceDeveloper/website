-- ============================================================
-- MARVEL SLICE — SERVICES MODULE SCHEMA
-- Run in Supabase SQL Editor after main schema.sql
-- ============================================================

-- 1. Service Categories
create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text,
  description text,
  status boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 2. Services (main table)
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category_id uuid references service_categories(id) on delete set null,
  icon text,
  thumbnail text,
  banner text,
  short_description text,
  description text,
  duration text,
  mode text,
  price numeric,
  discount numeric,
  badge text,
  difficulty text,
  language text default 'English',
  certificate boolean default false,
  placement_support boolean default false,
  internship boolean default false,
  eligibility text,
  curriculum jsonb default '[]',
  learning_outcomes jsonb default '[]',
  requirements jsonb default '[]',
  highlights jsonb default '[]',
  featured boolean default false,
  popular boolean default false,
  trending boolean default false,
  status text default 'draft',
  sort_order int default 0,
  seo_title text,
  seo_description text,
  seo_keywords text,
  meta_image text,
  canonical_url text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_services_category on services(category_id);
create index if not exists idx_services_status on services(status);
create index if not exists idx_services_featured on services(featured);
create index if not exists idx_services_sort on services(sort_order);

-- 3. Service Benefits
create table if not exists service_benefits (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  icon text,
  title text,
  description text,
  sort_order int default 0
);

create index if not exists idx_service_benefits_service on service_benefits(service_id);

-- 4. Service Steps (Timeline)
create table if not exists service_steps (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  title text,
  description text,
  icon text,
  step_order int default 0
);

create index if not exists idx_service_steps_service on service_steps(service_id);

-- 5. Service Gallery
create table if not exists service_gallery (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  image text,
  caption text,
  type text default 'image',
  sort_order int default 0
);

create index if not exists idx_service_gallery_service on service_gallery(service_id);

-- 6. Service Testimonials
create table if not exists service_testimonials (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  student_name text,
  photo text,
  course text,
  company text,
  rating numeric default 5,
  review text,
  sort_order int default 0
);

create index if not exists idx_service_testimonials_service on service_testimonials(service_id);

-- 7. Service FAQs
create table if not exists service_faqs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  question text,
  answer text,
  sort_order int default 0,
  is_active boolean default true,
  category text
);

create index if not exists idx_service_faqs_service on service_faqs(service_id);

-- 8. Service Statistics
create table if not exists service_statistics (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) on delete cascade,
  title text,
  value text,
  icon text,
  sort_order int default 0
);

create index if not exists idx_service_statistics_service on service_statistics(service_id);

-- Updated_at trigger
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'services_updated_at') then
    create trigger services_updated_at before update on services
      for each row execute function update_updated_at();
  end if;
end $$;

-- Disable RLS (same as other tables)
do $$ declare tbl text;
begin
  for tbl in select tablename from pg_tables
    where schemaname = 'public'
    and tablename in ('services','service_categories','service_benefits','service_steps','service_gallery','service_testimonials','service_faqs','service_statistics')
  loop
    execute format('alter table %I disable row level security;', tbl);
  end loop;
end $$;
