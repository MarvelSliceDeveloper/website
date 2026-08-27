-- ============================================================
-- MARVEL SLICE — SCHEMA (optimised)
-- ============================================================
-- Run in Supabase SQL Editor. No auth / RLS required.
-- Run the RLS disable block at the bottom if tables were created with RLS enabled.
-- Uncomment to reset:
-- drop schema public cascade; create
--  schema public;
-- ============================================================
-- NOTE: If site_settings already exists without blog_heading/blog_subheading,
-- run the alter statements at the bottom of this file (search "ALTER TABLE site_settings").

create extension if not exists "pgcrypto";

-- 1. Site settings
create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(),
  logo_url text,
  contact_email text,
  contact_phone text,
  blog_hero_image text,
  social_links jsonb default '{}',
  updated_at timestamptz default now()
);

-- 2. Navigation items
create table if not exists nav_items (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references nav_items(id) on delete cascade,
  parent_label text,
  label text not null,
  path text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_nav_items_parent on nav_items(parent_id);
create index if not exists idx_nav_items_path on nav_items(path);
create index if not exists idx_nav_items_parent_label on nav_items(parent_label);

-- 3. Courses
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  checklist_items jsonb default '[]',
  hero_image_url text,
  video_thumbnail_url text,
  video_url text,
  nav_item_id uuid references nav_items(id) on delete set null,
  rating numeric default 4.5,
  review_count int default 0,
  learner_count int default 0,
  cta_left text default 'Talk to Advisor',
  cta_right text default 'Download Brochure',
  duration text,
  mode text,
  status text default 'Active',
  curriculum jsonb default '[]',
  is_published boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_courses_nav_item on courses(nav_item_id);

-- Add new columns for existing databases
alter table courses add column if not exists duration text;
alter table courses add column if not exists mode text;
alter table courses add column if not exists status text default 'Active';
alter table courses add column if not exists curriculum jsonb default '[]';
alter table courses add column if not exists show_pricing boolean default false;
alter table courses add column if not exists cta_heading text;
alter table courses add column if not exists cta_description text;
alter table courses add column if not exists cta_text text;
alter table courses add column if not exists cta_link text;
alter table courses add column if not exists cta_phone text;
alter table courses add column if not exists cta_background_image text;
alter table courses add column if not exists start_date timestamptz;
alter table projects add column if not exists difficulty text;
alter table projects add column if not exists technologies jsonb default '[]';
alter table certifications add column if not exists skills_earned jsonb default '[]';

-- 4. Key highlights per course
create table if not exists highlights (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade not null,
  icon text,
  label text not null,
  sort_order int default 0
);
create index if not exists idx_highlights_course on highlights(course_id);

-- 5. Overview Q&A per course
create table if not exists overview_faqs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade not null,
  question text not null,
  answer text not null,
  list_items jsonb default '[]',
  sort_order int default 0
);
create index if not exists idx_overview_faqs_course on overview_faqs(course_id);

-- 7. Projects per course
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade not null,
  title text not null,
  description text,
  sort_order int default 0
);
create index if not exists idx_projects_course on projects(course_id);

-- 8. Certification per course
create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade not null,
  description text,
  image_url text,
  certificate_image_url text,
  recognized_companies jsonb default '[]',
  unique(course_id)
);

-- 9. Alumni companies
create table if not exists alumni_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  sort_order int default 0
);

-- 10. General FAQs per course
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade not null,
  question text not null,
  answer text not null,
  sort_order int default 0
);
create index if not exists idx_faqs_course on faqs(course_id);

-- 11. Tags (shared across courses and blog)
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- 12. Course–Tag M2M
create table if not exists course_tags (
  course_id uuid references courses(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (course_id, tag_id)
);
create index if not exists idx_course_tags_tag on course_tags(tag_id);

-- 14. Course tabs
create table if not exists course_tabs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade not null,
  label text not null,
  content_type text not null default 'rich_text',
  content jsonb default '{}',
  sort_order int default 0
);
create index if not exists idx_course_tabs_course on course_tabs(course_id);

-- 16. Nav category pages
create table if not exists nav_pages (
  id uuid primary key default gen_random_uuid(),
  nav_item_id uuid references nav_items(id) on delete cascade not null unique,
  heading text,
  subheading text,
  hero_image text,
  sections jsonb default '[]',
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 17. Home page sections
create table if not exists home_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  heading text,
  subheading text,
  content jsonb default '{}',
  is_active boolean default true,
  sort_order int default 0,
  updated_at timestamptz default now()
);

-- 18. Blog categories
create table if not exists blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int default 0
);

-- 19. Blog posts
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  image_url text,
  category_id uuid references blog_categories(id) on delete set null,
  author text default 'Admin',
  published_at timestamptz,
  is_published boolean default false,
  is_featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_blog_posts_category on blog_posts(category_id);
create index if not exists idx_blog_posts_published on blog_posts(is_published, published_at desc);
create index if not exists idx_courses_created_at on public.courses(created_at desc);
create index if not exists idx_courses_slug on public.courses(slug);
create index if not exists idx_courses_status on public.courses(status);
create index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_contact_submissions_unread on public.contact_submissions(is_read, created_at desc);
create index if not exists idx_banking_enquiries_unread on public.banking_enquiries(is_read, created_at desc);
create index if not exists idx_brochure_downloads_unread on public.brochure_downloads(is_read, created_at desc);
create index if not exists idx_form_submissions_unread on public.form_submissions(is_read, created_at desc);
create index if not exists idx_career_submissions_unread on public.career_submissions(is_read, created_at desc);
create index if not exists idx_career_contact_submissions_unread on public.career_contact_submissions(is_read, created_at desc);
create index if not exists idx_about_submissions_unread on public.about_submissions(is_read, created_at desc);

-- 20. Blog post–Tag M2M
create table if not exists blog_post_tags (
  post_id uuid references blog_posts(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
create index if not exists idx_blog_post_tags_tag on blog_post_tags(tag_id);

-- 21. Newsletter subscribers
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  subscribed_at timestamptz default now()
);

alter table newsletter_subscribers enable row level security;
alter table newsletter_subscribers add column if not exists is_read boolean default false;
alter table newsletter_subscribers add column if not exists created_at timestamptz default now();
update newsletter_subscribers set created_at = subscribed_at where created_at is null and subscribed_at is not null;

drop policy if exists "Anyone can insert newsletter subscribers" on newsletter_subscribers;
create policy "Anyone can insert newsletter subscribers"
  on newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Authenticated can view newsletter subscribers" on newsletter_subscribers;
create policy "Authenticated can view newsletter subscribers"
  on newsletter_subscribers for select
  to authenticated
  using (true);

-- 22. Admin profiles
create table if not exists admin_profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  password_hash text not null,
  role text default 'editor' check (role in ('master_admin', 'admin', 'manager', 'editor')),
  created_at timestamptz default now()
);

-- 23. Career submissions form
create table if not exists career_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  department text,
  category text,
  description text,
  file_url text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 23a. Career "Contact Us" form submissions (like contact_submissions)
create table if not exists career_contact_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table career_contact_submissions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public insert career_contact_submissions') then
    create policy "Allow public insert career_contact_submissions"
    on career_contact_submissions for insert to anon, authenticated
    with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public select career_contact_submissions') then
    create policy "Allow public select career_contact_submissions"
    on career_contact_submissions for select to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public update career_contact_submissions') then
    create policy "Allow public update career_contact_submissions"
    on career_contact_submissions for update to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public delete career_contact_submissions') then
    create policy "Allow public delete career_contact_submissions"
    on career_contact_submissions for delete to anon, authenticated
    using (true);
  end if;
end $$;

-- 23b. About page enquiries (floating contact button)
create table if not exists about_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  subject text,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_about_submissions_created on about_submissions(created_at desc);

alter table about_submissions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public insert about_submissions') then
    create policy "Allow public insert about_submissions"
    on about_submissions for insert to anon, authenticated
    with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public select about_submissions') then
    create policy "Allow public select about_submissions"
    on about_submissions for select to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public delete about_submissions') then
    create policy "Allow public delete about_submissions"
    on about_submissions for delete to anon, authenticated
    using (true);
  end if;
end $$;

-- 24. Create career-uploads storage bucket with public upload access
insert into storage.buckets (id, name, public)
values ('career-uploads', 'career-uploads', true)
on conflict (id) do nothing;

-- Allow public uploads to career-uploads bucket
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public upload career-uploads') then
    create policy "Allow public upload career-uploads"
    on storage.objects for insert
    with check (bucket_id = 'career-uploads');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public read career-uploads') then
    create policy "Allow public read career-uploads"
    on storage.objects for select
    using (bucket_id = 'career-uploads');
  end if;
end $$;

-- 25. Create all storage buckets used by the app
do $$
declare
  b text;
  buckets text[] := array['hero-images', 'course-thumbnails', 'certificates', 'company-logos', 'nav-icons', 'pages'];
begin
  foreach b in array buckets loop
    insert into storage.buckets (id, name, public)
    values (b, b, true)
    on conflict (id) do nothing;

    if not exists (select 1 from pg_policies where policyname = 'Allow public upload ' || b) then
      execute format(
        'create policy %I on storage.objects for insert with check (bucket_id = %L)',
        'Allow public upload ' || b, b
      );
    end if;

    if not exists (select 1 from pg_policies where policyname = 'Allow public read ' || b) then
      execute format(
        'create policy %I on storage.objects for select using (bucket_id = %L)',
        'Allow public read ' || b, b
      );
    end if;
  end loop;
end $$;

-- For existing databases, run:
-- alter table admin_profiles drop constraint if exists admin_profiles_id_fkey;
-- alter table admin_profiles alter column id set default gen_random_uuid();
-- alter table admin_profiles add column if not exists email text;
-- alter table admin_profiles add column if not exists password_hash text;
-- alter table admin_profiles add column if not exists created_at timestamptz default now();
-- alter table admin_profiles alter column email set not null;
-- alter table admin_profiles alter column password_hash set not null;
-- alter table admin_profiles alter column full_name set not null;
-- alter table admin_profiles drop constraint if exists admin_profiles_role_check;
-- alter table admin_profiles add constraint admin_profiles_role_check check (role in ('master_admin', 'admin', 'editor', 'manager'));
-- alter table admin_profiles add constraint admin_profiles_email_key unique (email);

-- ============================================================
-- AUTO-UPDATE updated_at trigger
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'site_settings_updated_at') then
    create trigger site_settings_updated_at before update on site_settings for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'nav_pages_updated_at') then
    create trigger nav_pages_updated_at before update on nav_pages for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'home_sections_updated_at') then
    create trigger home_sections_updated_at before update on home_sections for each row execute function update_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'blog_posts_updated_at') then
    create trigger blog_posts_updated_at before update on blog_posts for each row execute function update_updated_at();
  end if;
end $$;

-- ============================================================
-- Ensure constraints exist on EXISTING tables (safe to re-run)
-- CREATE TABLE IF NOT EXISTS skips tables that already exist,
-- so constraints defined inline won't be applied. These ALTER
-- statements fix that for existing databases.
-- ============================================================

-- nav_pages: ensure NOT NULL + UNIQUE on nav_item_id
do $$ begin
  alter table nav_pages alter column nav_item_id set not null;
exception when others then null; end $$;
do $$ begin
  alter table nav_pages add constraint nav_pages_nav_item_id_key unique (nav_item_id);
exception when others then null; end $$;
do $$ begin
  alter table nav_pages add constraint nav_pages_nav_item_id_fkey
    foreign key (nav_item_id) references nav_items(id) on delete cascade;
exception when others then null; end $$;

-- Add form_config column to nav_pages for career page form customization
do $$ begin
  alter table nav_pages add column form_config jsonb default '{}';
exception when others then null; end $$;

-- Ensure RLS is disabled on all tables
do $$ declare tbl text;
begin
  for tbl in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I disable row level security;', tbl);
  end loop;
end $$;

-- Unique active nav_item per path (prevents future duplicates)
create unique index if not exists idx_nav_items_unique_active_path
  on nav_items (path) where is_active = true and path is not null;

-- Enable pgcrypto for server-side bcrypt hashing
create extension if not exists pgcrypto;

-- Enable RLS on admin_profiles (only RPC functions can access it)
alter table admin_profiles enable row level security;

-- Ensure profile_pic column exists before functions reference it
alter table admin_profiles add column if not exists profile_pic text;

-- ------------------------------------------------------------
-- ADMIN AUDIT LOGS TABLE
-- ------------------------------------------------------------
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_profiles(id) on delete set null,
  email text not null,
  event text not null,
  ip_address text,
  user_agent text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_admin_audit_logs_email on public.admin_audit_logs(email);
create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs(created_at);

-- ------------------------------------------------------------
-- HARDENED READ-ONLY VERIFY_ADMIN RPC (BCRYPT ONLY)
-- ------------------------------------------------------------
drop function if exists public.verify_admin(text, text);
create or replace function public.verify_admin(p_email text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_admin public.admin_profiles%rowtype;
  v_failed_attempts integer;
  v_clean_email text;
begin
  v_clean_email := lower(trim(coalesce(p_email, '')));

  if v_clean_email = '' or p_password is null or length(p_password) = 0 then
    return null;
  end if;

  -- Rate limiting check: max 5 failed attempts in 15 mins
  select count(*)
  into v_failed_attempts
  from public.admin_audit_logs
  where email = v_clean_email
    and event = 'login_failure'
    and created_at > now() - interval '15 minutes';

  if v_failed_attempts >= 5 then
    insert into public.admin_audit_logs (email, event, metadata)
    values (v_clean_email, 'login_lockout', jsonb_build_object('reason', 'Excessive failed login attempts', 'attempt_count', v_failed_attempts));
    
    raise exception 'Account locked due to multiple failed login attempts. Please try again in 15 minutes.';
  end if;

  -- Pure READ-ONLY Bcrypt verification
  select * into v_admin
  from public.admin_profiles
  where lower(trim(email)) = v_clean_email
    and password_hash like '$2%'
    and password_hash = crypt(p_password, password_hash);

  if v_admin.id is null then
    insert into public.admin_audit_logs (email, event)
    values (v_clean_email, 'login_failure');
    
    return null;
  end if;

  insert into public.admin_audit_logs (admin_id, email, event)
  values (v_admin.id, v_clean_email, 'login_success');

  return jsonb_build_object(
    'id', v_admin.id,
    'email', v_admin.email,
    'full_name', v_admin.full_name,
    'role', v_admin.role,
    'profile_pic', v_admin.profile_pic
  );
end;
$$;

revoke all on function public.verify_admin(text, text) from public;
grant execute on function public.verify_admin(text, text) to anon, authenticated;

-- Add created_by to admin_profiles for audit trail
alter table admin_profiles add column if not exists created_by uuid references admin_profiles(id);
alter table admin_profiles add column if not exists profile_pic text;

-- Role hierarchy helper: higher rank = more privileges
drop function if exists role_rank(text);
create or replace function role_rank(p_role text)
returns integer
language sql
immutable
as $$
  select case p_role
    when 'master_admin' then 4
    when 'admin' then 3
    when 'manager' then 2
    when 'editor' then 1
    else 0
  end;
$$;

-- Create admin with server-side bcrypt hash, enforces role hierarchy
drop function if exists create_admin(uuid, text, text, text, text);
create or replace function create_admin(
  p_creator_id uuid,
  p_email text,
  p_full_name text,
  p_role text,
  p_password text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_creator_role text;
  v_creator_rank integer;
  v_target_rank integer;
begin
  select admin_profiles.role into v_creator_role
  from admin_profiles
  where admin_profiles.id = p_creator_id;

  if v_creator_role is null then
    raise exception 'Not authorized';
  end if;

  v_creator_rank := role_rank(v_creator_role);
  v_target_rank := role_rank(p_role);

  -- Creator cannot assign a role above their own level (master_admin is exempt)
  if v_target_rank >= v_creator_rank and v_creator_role != 'master_admin' then
    raise exception 'You can only assign roles below your own level';
  end if;

  if exists (select 1 from admin_profiles where admin_profiles.email = p_email) then
    raise exception 'An admin with this email already exists';
  end if;

  with inserted as (
    insert into admin_profiles (id, email, full_name, role, password_hash, created_by)
    values (
      gen_random_uuid(),
      p_email,
      p_full_name,
      p_role,
      crypt(p_password, gen_salt('bf', 10)),
      p_creator_id
    )
    returning id, email, full_name, role
  )
  select jsonb_build_object('id', i.id, 'email', i.email, 'full_name', i.full_name, 'role', i.role)
  from inserted i;
end;
$$;

-- Delete admin, enforces role hierarchy
drop function if exists delete_admin(uuid, uuid);
create or replace function delete_admin(p_creator_id uuid, p_target_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_creator_role text;
  v_creator_rank integer;
  v_target_rank integer;
begin
  select admin_profiles.role into v_creator_role
  from admin_profiles
  where admin_profiles.id = p_creator_id;

  if v_creator_role is null then
    raise exception 'Not authorized';
  end if;

  if p_creator_id = p_target_id then
    raise exception 'You cannot delete yourself';
  end if;

  v_creator_rank := role_rank(v_creator_role);

  select role_rank(admin_profiles.role) into v_target_rank
  from admin_profiles
  where admin_profiles.id = p_target_id;

  -- Creator cannot delete someone at or above their own level (master_admin is exempt)
  if v_target_rank >= v_creator_rank and v_creator_role != 'master_admin' then
    raise exception 'You cannot delete users with an equal or higher role';
  end if;

  delete from admin_profiles where admin_profiles.id = p_target_id;
end;
$$;

-- Update admin, enforces role hierarchy
drop function if exists update_admin(uuid, uuid, text, text, text, text);
create or replace function update_admin(
  p_editor_id uuid,
  p_target_id uuid,
  p_email text default null,
  p_full_name text default null,
  p_role text default null,
  p_password text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_editor_role text;
  v_editor_rank integer;
  v_target_rank integer;
begin
  select admin_profiles.role into v_editor_role
  from admin_profiles
  where admin_profiles.id = p_editor_id;

  if v_editor_role is null then
    raise exception 'Not authorized';
  end if;

  v_editor_rank := role_rank(v_editor_role);

  select role_rank(admin_profiles.role) into v_target_rank
  from admin_profiles
  where admin_profiles.id = p_target_id;

  -- Editor cannot modify someone at or above their own level (master_admin is exempt)
  if v_target_rank >= v_editor_rank and v_editor_role != 'master_admin' then
    raise exception 'You cannot edit users with an equal or higher role';
  end if;

  update admin_profiles
  set
    email = coalesce(p_email, admin_profiles.email),
    full_name = coalesce(p_full_name, admin_profiles.full_name),
    role = coalesce(p_role, admin_profiles.role),
    password_hash = case
      when p_password is not null then crypt(p_password, gen_salt('bf', 10))
      else admin_profiles.password_hash
    end
  where admin_profiles.id = p_target_id;

  return jsonb_build_object(
    'id', p_target_id,
    'email', coalesce(p_email, (select email from admin_profiles where id = p_target_id)),
    'full_name', coalesce(p_full_name, (select full_name from admin_profiles where id = p_target_id)),
    'role', coalesce(p_role, (select role from admin_profiles where id = p_target_id))
  );
end;
$$;

-- List admin users (any logged-in admin can list)
drop function if exists list_admins(uuid);
create or replace function list_admins(p_viewer_id uuid)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not exists (select 1 from admin_profiles where admin_profiles.id = p_viewer_id) then
    raise exception 'Not authorized';
  end if;

  return (
    select jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'email', a.email,
        'full_name', a.full_name,
        'role', a.role,
        'created_at', a.created_at,
        'created_by', a.created_by
      )
      order by a.created_at desc nulls last
    )
    from admin_profiles a
  );
end;
$$;

-- 25. Form submissions table for home page demo form
create table if not exists form_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable public insert access
alter table form_submissions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public insert form_submissions') then
    create policy "Allow public insert form_submissions"
    on form_submissions for insert
    with check (true);
  end if;
end $$;

-- 25a. Upcoming classes (home page Upcoming Classes section)
create table if not exists upcoming_classes (
  id uuid primary key default gen_random_uuid(),
  course_name text not null,
  batch text,
  date_time text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table upcoming_classes enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public select upcoming_classes') then
    create policy "Allow public select upcoming_classes"
    on upcoming_classes for select to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public insert upcoming_classes') then
    create policy "Allow public insert upcoming_classes"
    on upcoming_classes for insert to anon, authenticated
    with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public update upcoming_classes') then
    create policy "Allow public update upcoming_classes"
    on upcoming_classes for update to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public delete upcoming_classes') then
    create policy "Allow public delete upcoming_classes"
    on upcoming_classes for delete to anon, authenticated
    using (true);
  end if;
end $$;

-- 25b. Upcoming class registrations (Register Now popup form)
create table if not exists upcoming_class_registrations (
  id uuid primary key default gen_random_uuid(),
  upcoming_class_id uuid references upcoming_classes(id) on delete set null,
  course_id uuid references courses(id) on delete set null,
  course_name text,
  batch text,
  full_name text not null,
  email text not null,
  phone text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table upcoming_class_registrations add column if not exists course_id uuid references courses(id) on delete set null;

alter table upcoming_class_registrations enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public insert upcoming_class_registrations') then
    create policy "Allow public insert upcoming_class_registrations"
    on upcoming_class_registrations for insert to anon, authenticated
    with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public select upcoming_class_registrations') then
    create policy "Allow public select upcoming_class_registrations"
    on upcoming_class_registrations for select to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public update upcoming_class_registrations') then
    create policy "Allow public update upcoming_class_registrations"
    on upcoming_class_registrations for update to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public delete upcoming_class_registrations') then
    create policy "Allow public delete upcoming_class_registrations"
    on upcoming_class_registrations for delete to anon, authenticated
    using (true);
  end if;
end $$;

create table if not exists course_enquiries (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete set null,
  course_title text,
  button_clicked text default 'Apply Now',
  terms_accepted boolean default true,
  full_name text not null,
  email text not null,
  phone text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table course_enquiries enable row level security;
drop policy if exists "Allow public insert course_enquiries" on course_enquiries;
create policy "Allow public insert course_enquiries" on course_enquiries for insert to anon, authenticated with check (true);
drop policy if exists "Allow public select course_enquiries" on course_enquiries;
create policy "Allow public select course_enquiries" on course_enquiries for select to anon, authenticated using (true);
drop policy if exists "Allow public update course_enquiries" on course_enquiries;
create policy "Allow public update course_enquiries" on course_enquiries for update to anon, authenticated using (true);
drop policy if exists "Allow public delete course_enquiries" on course_enquiries;
create policy "Allow public delete course_enquiries" on course_enquiries for delete to anon, authenticated using (true);

create table if not exists upcoming_course_interests (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete set null,
  course_title text,
  launch_date timestamptz,
  full_name text not null,
  email text not null,
  phone text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table upcoming_course_interests enable row level security;
drop policy if exists "Allow public insert upcoming_course_interests" on upcoming_course_interests;
create policy "Allow public insert upcoming_course_interests" on upcoming_course_interests for insert to anon, authenticated with check (true);
drop policy if exists "Allow public select upcoming_course_interests" on upcoming_course_interests;
create policy "Allow public select upcoming_course_interests" on upcoming_course_interests for select to anon, authenticated using (true);
drop policy if exists "Allow public update upcoming_course_interests" on upcoming_course_interests;
create policy "Allow public update upcoming_course_interests" on upcoming_course_interests for update to anon, authenticated using (true);
drop policy if exists "Allow public delete upcoming_course_interests" on upcoming_course_interests;
create policy "Allow public delete upcoming_course_interests" on upcoming_course_interests for delete to anon, authenticated using (true);

-- 25c. Auto-promote: courses set to 'Coming Soon' move to 'Active' once their start date arrives
create or replace function promote_upcoming_courses()
returns setof courses
language sql
as $$
  update courses
  set status = 'Active'
  where status = 'Coming Soon'
    and start_date is not null
    and start_date <= now()
  returning *;
$$;

-- 25d. Testimonials (home page Testimonials slider)
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text not null,
  rating int default 5,
  avatar_url text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table testimonials enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Allow public select testimonials') then
    create policy "Allow public select testimonials"
    on testimonials for select to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public insert testimonials') then
    create policy "Allow public insert testimonials"
    on testimonials for insert to anon, authenticated
    with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public update testimonials') then
    create policy "Allow public update testimonials"
    on testimonials for update to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Allow public delete testimonials') then
    create policy "Allow public delete testimonials"
    on testimonials for delete to anon, authenticated
    using (true);
  end if;
end $$;

-- 26. Chat conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_identifier text,
  user_name text default '',
  status text default 'open',
  created_at timestamptz default now(),
  last_message_at timestamptz default now()
);

-- 27. Chat messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender text not null,
  content text not null,
  created_at timestamptz default now()
);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_conversations_last_message_at on conversations(last_message_at desc);

-- Enable Realtime for chat tables (safe to re-run)
do $$
begin
  if not exists (select 1 from pg_publication_rel pr join pg_class c on c.oid = pr.prrelid where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime') and c.relname = 'conversations') then
    alter publication supabase_realtime add table conversations;
  end if;
  if not exists (select 1 from pg_publication_rel pr join pg_class c on c.oid = pr.prrelid where pr.prpubid = (select oid from pg_publication where pubname = 'supabase_realtime') and c.relname = 'messages') then
    alter publication supabase_realtime add table messages;
  end if;
end $$;

-- RLS policies for chat (public insert/select for widget)
alter table conversations enable row level security;
alter table messages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Anyone can insert conversations') then
    create policy "Anyone can insert conversations"
    on conversations for insert to anon, authenticated
    with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Anyone can select conversations') then
    create policy "Anyone can select conversations"
    on conversations for select to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Authenticated can update conversations') then
    create policy "Authenticated can update conversations"
    on conversations for update to anon, authenticated
    using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Anyone can insert messages') then
    create policy "Anyone can insert messages"
    on messages for insert to anon, authenticated
    with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Anyone can select messages') then
    create policy "Anyone can select messages"
    on messages for select to anon, authenticated
    using (true);
  end if;
end $$;

-- 28. Job openings table (dedicated, replaces JSONB sections)
create table if not exists job_openings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null,
  location text,
  type text,
  experience text,
  salary text,
  description text,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 29. Career page content table (hero, section headings, form config)
create table if not exists career_page_content (
  id uuid primary key default gen_random_uuid(),
  hero_image text,
  hero_heading text,
  hero_subheading text,
  culture text,
  culture_heading text default 'Company Culture',
  benefits jsonb default '[]',
  benefits_heading text default 'Benefits & Perks',
  section1_heading text default 'We''re Hiring',
  section1_subheading text,
  section1_description text,
  section2_heading text default 'Job Openings',
  section2_subheading text,
  form_config jsonb default '{}',
  carousel_enabled boolean default false,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add columns that may be missing if table already existed
alter table career_page_content add column if not exists culture_heading text default 'Company Culture';
alter table career_page_content add column if not exists culture text;
alter table career_page_content add column if not exists benefits jsonb default '[]';
alter table career_page_content add column if not exists benefits_heading text default 'Benefits & Perks';
alter table career_page_content add column if not exists section1_heading text default 'We''re Hiring';
alter table career_page_content add column if not exists section1_subheading text;
alter table career_page_content add column if not exists section1_description text;
alter table career_page_content add column if not exists section2_heading text default 'Job Openings';
alter table career_page_content add column if not exists section2_subheading text;
alter table career_page_content add column if not exists form_config jsonb default '{}';
alter table career_page_content add column if not exists carousel_enabled boolean default false;

-- Enable RLS but allow public read for both tables
alter table job_openings enable row level security;
alter table career_page_content enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Anyone can read job_openings') then
    create policy "Anyone can read job_openings"
    on job_openings for select to anon, authenticated
    using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Authenticated can insert job_openings') then
    create policy "Authenticated can insert job_openings"
    on job_openings for insert to anon, authenticated
    with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Authenticated can update job_openings') then
    create policy "Authenticated can update job_openings"
    on job_openings for update to anon, authenticated
    using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Anyone can read career_page_content') then
    create policy "Anyone can read career_page_content"
    on career_page_content for select to anon, authenticated
    using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Authenticated can insert career_page_content') then
    create policy "Authenticated can insert career_page_content"
    on career_page_content for insert to anon, authenticated
    with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Authenticated can update career_page_content') then
    create policy "Authenticated can update career_page_content"
    on career_page_content for update to anon, authenticated
    using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Authenticated can delete job_openings') then
    create policy "Authenticated can delete job_openings"
    on job_openings for delete to anon, authenticated
    using (true);
  end if;
end $$;

-- 30. Role categories table (carousel cards, broad job families)
create table if not exists role_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 31. Update job_openings: add FK to role_categories
alter table job_openings add column if not exists role_category_id uuid references role_categories(id) on delete set null;
alter table job_openings drop column if exists apply_link;

-- Enable RLS for role_categories
alter table role_categories enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Anyone can read role_categories') then
    create policy "Anyone can read role_categories"
    on role_categories for select to anon, authenticated
    using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Authenticated can insert role_categories') then
    create policy "Authenticated can insert role_categories"
    on role_categories for insert to anon, authenticated
    with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Authenticated can update role_categories') then
    create policy "Authenticated can update role_categories"
    on role_categories for update to anon, authenticated
    using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Authenticated can delete role_categories') then
    create policy "Authenticated can delete role_categories"
    on role_categories for delete to anon, authenticated
    using (true);
  end if;
end $$;

-- 32. Brochure downloads table
create table if not exists brochure_downloads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  course_id uuid references courses(id) on delete set null,
  course_title text,
  is_read boolean default false,
  created_at timestamptz default now()
);

alter table brochure_downloads enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Anyone can insert brochure_downloads') then
    create policy "Anyone can insert brochure_downloads"
    on brochure_downloads for insert to anon, authenticated
    with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Anyone can read brochure_downloads') then
    create policy "Anyone can read brochure_downloads"
    on brochure_downloads for select to anon, authenticated
    using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Anyone can update brochure_downloads') then
    create policy "Anyone can update brochure_downloads"
    on brochure_downloads for update to anon, authenticated
    using (true);
  end if;
end $$;

-- Add missing blog page columns to site_settings (safe to re-run)
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'site_settings' and column_name = 'blog_hero_image') then
    alter table site_settings add column blog_hero_image text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'site_settings' and column_name = 'blog_heading') then
    alter table site_settings add column blog_heading text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'site_settings' and column_name = 'blog_subheading') then
    alter table site_settings add column blog_subheading text;
  end if;
end $$;

-- Allow admin to change their own password (requires current password verification)
drop function if exists change_own_password(uuid, text, text);
create or replace function change_own_password(
  p_admin_id uuid,
  p_current_password text,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_stored_hash text;
begin
  select password_hash into v_stored_hash
  from admin_profiles
  where admin_profiles.id = p_admin_id;

  if v_stored_hash is null then
    return jsonb_build_object('error', 'Admin not found');
  end if;

  if v_stored_hash like '$2%' then
    if v_stored_hash != crypt(p_current_password, v_stored_hash) then
      return jsonb_build_object('error', 'Current password is incorrect');
    end if;
  else
    if v_stored_hash != encode(digest(p_current_password, 'sha256'), 'hex') then
      return jsonb_build_object('error', 'Current password is incorrect');
    end if;
  end if;

  update admin_profiles
  set password_hash = crypt(p_new_password, gen_salt('bf', 10))
  where admin_profiles.id = p_admin_id;

  return jsonb_build_object('success', true);
end;
$$;

-- Allow admin to update their own profile (name, profile_pic)
drop function if exists update_own_profile(uuid, text, text);
create or replace function update_own_profile(
  p_admin_id uuid,
  p_full_name text default null,
  p_profile_pic text default null
)
returns jsonb
language plpgsql
security definer
as $$
begin
  update admin_profiles
  set
    full_name = coalesce(p_full_name, admin_profiles.full_name),
    profile_pic = coalesce(p_profile_pic, admin_profiles.profile_pic)
  where admin_profiles.id = p_admin_id;

  return (select to_jsonb(t.*) from (
    select id, email, full_name, role, profile_pic
    from admin_profiles
    where id = p_admin_id
  ) t);
end;
$$;

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

-- Cleanup obsolete / unused legacy tables if they exist
drop table if exists related_courses cascade;
drop table if exists course_fees cascade;
drop table if exists skips cascade;

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

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR ALL TABLES
-- ============================================================
-- DYNAMIC ROW LEVEL SECURITY (RLS) MIGRATION FOR 100% OF TABLES
-- ============================================================
do $$ 
declare
    tbl_record record;
    pol_record record;
    t text;
    is_submission boolean;
    is_sensitive boolean;
begin
    -- Iterate over EVERY table in the public schema dynamically
    for tbl_record in (
        select tablename 
        from pg_tables 
        where schemaname = 'public'
    ) loop
        t := tbl_record.tablename;
        
        -- Enable RLS on every table
        execute format('alter table public.%I enable row level security;', t);
        
        -- Drop existing policies
        for pol_record in (
            select policyname 
            from pg_policies 
            where schemaname = 'public' and tablename = t
        ) loop
            execute format('drop policy if exists %I on public.%I;', pol_record.policyname, t);
        end loop;

        -- Categorize table
        is_submission := (
            t like '%submission%' or t like '%enquir%' or t like '%download%' or 
            t like '%registration%' or t like '%interest%' or t like '%subscriber%' or 
            t in ('contact_submissions', 'course_enquiries', 'banking_enquiries', 'brochure_downloads',
                  'upcoming_class_registrations', 'upcoming_course_interests', 'newsletter_subscribers',
                  'form_submissions', 'about_submissions', 'career_submissions', 'career_contact_submissions', 'enquiries')
        );

        is_sensitive := (
            t like '%admin%' or t in ('admin_profiles', 'conversations', 'messages', 'secrets', 'audit_logs', 'logs')
        );

        -- Assign category policies
        if is_sensitive then
            execute format('create policy %I on public.%I for all to authenticated using (true);', 'admin_all_' || t, t);
        elsif is_submission then
            execute format('create policy %I on public.%I for insert to anon, authenticated with check (true);', 'anon_insert_' || t, t);
            execute format('create policy %I on public.%I for select to authenticated using (true);', 'admin_select_' || t, t);
            execute format('create policy %I on public.%I for update to authenticated using (true);', 'admin_update_' || t, t);
            execute format('create policy %I on public.%I for delete to authenticated using (true);', 'admin_delete_' || t, t);
        else
            execute format('create policy %I on public.%I for select to anon, authenticated using (true);', 'public_select_' || t, t);
            execute format('create policy %I on public.%I for insert to anon, authenticated with check (true);', 'public_insert_' || t, t);
            execute format('create policy %I on public.%I for update to anon, authenticated using (true);', 'public_update_' || t, t);
            execute format('create policy %I on public.%I for delete to anon, authenticated using (true);', 'public_delete_' || t, t);
        end if;
        
    end loop;
end $$;


