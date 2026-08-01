-- ============================================================
-- MARVEL SLICE — TRAINING MODULE SCHEMA
-- Run in Supabase SQL Editor after main schema.sql
-- ============================================================

-- 1. Training Categories
create table if not exists training_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text,
  description text,
  status boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 2. Training Programs (main table)
create table if not exists training_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category_id uuid references training_categories(id) on delete set null,
  icon text,
  thumbnail text,
  banner text,
  short_description text,
  description text,
  duration text,
  mode text,
  difficulty text,
  price numeric,
  discount numeric,
  badge text,
  eligibility text,
  learning_outcomes jsonb default '[]',
  modules jsonb default '[]',
  benefits jsonb default '[]',
  skills jsonb default '[]',
  placement_support text,
  certificate boolean default false,
  assessment text,
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

create index if not exists idx_training_category on training_programs(category_id);
create index if not exists idx_training_status on training_programs(status);
create index if not exists idx_training_featured on training_programs(featured);
create index if not exists idx_training_sort on training_programs(sort_order);

-- 3. Training Modules
create table if not exists training_modules (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references training_programs(id) on delete cascade,
  title text,
  duration text,
  topics jsonb default '[]',
  outcomes text,
  sort_order int default 0
);

create index if not exists idx_training_modules_training on training_modules(training_id);

-- 4. Training Skills
create table if not exists training_skills (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references training_programs(id) on delete cascade,
  icon text,
  title text,
  description text,
  sort_order int default 0
);

create index if not exists idx_training_skills_training on training_skills(training_id);

-- 5. Training Benefits
create table if not exists training_benefits (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references training_programs(id) on delete cascade,
  icon text,
  title text,
  description text,
  sort_order int default 0
);

create index if not exists idx_training_benefits_training on training_benefits(training_id);

-- 6. Training Gallery
create table if not exists training_gallery (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references training_programs(id) on delete cascade,
  image text,
  caption text,
  type text default 'image',
  sort_order int default 0
);

create index if not exists idx_training_gallery_training on training_gallery(training_id);

-- 7. Training Testimonials
create table if not exists training_testimonials (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references training_programs(id) on delete cascade,
  student_name text,
  photo text,
  college text,
  company text,
  rating numeric default 5,
  review text,
  sort_order int default 0
);

create index if not exists idx_training_testimonials_training on training_testimonials(training_id);

-- 8. Training FAQs
create table if not exists training_faqs (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references training_programs(id) on delete cascade,
  question text,
  answer text,
  sort_order int default 0,
  is_active boolean default true,
  category text
);

create index if not exists idx_training_faqs_training on training_faqs(training_id);

-- 9. Training Statistics
create table if not exists training_statistics (
  id uuid primary key default gen_random_uuid(),
  training_id uuid references training_programs(id) on delete cascade,
  title text,
  value text,
  icon text,
  sort_order int default 0
);

create index if not exists idx_training_statistics_training on training_statistics(training_id);

-- Updated_at trigger
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'training_programs_updated_at') then
    create trigger training_programs_updated_at before update on training_programs
      for each row execute function update_updated_at();
  end if;
end $$;

-- Disable RLS
do $$ declare tbl text;
begin
  for tbl in select tablename from pg_tables
    where schemaname = 'public'
    and tablename in ('training_programs','training_categories','training_modules','training_skills','training_benefits','training_gallery','training_testimonials','training_faqs','training_statistics')
  loop
    execute format('alter table %I disable row level security;', tbl);
  end loop;
end $$;
