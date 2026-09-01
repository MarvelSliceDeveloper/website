-- SQL Migration: Create legal_pages table, RLS policies, and Seed Data for Marvel Slice
-- Copy & paste this entire script into your Supabase SQL Editor and click "Run".

-- 1. Create legal_pages table if it doesn't exist
create table if not exists public.legal_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  title text default '',
  intro text default '',
  sections jsonb default '[]'::jsonb,
  is_published boolean default true,
  updated_at timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.legal_pages enable row level security;

-- 3. Reset RLS policies to prevent duplication errors
drop policy if exists "Allow public select legal_pages" on public.legal_pages;
drop policy if exists "Allow public insert legal_pages" on public.legal_pages;
drop policy if exists "Allow public update legal_pages" on public.legal_pages;
drop policy if exists "Allow public delete legal_pages" on public.legal_pages;

-- 4. Create RLS policies for CRUD operations
create policy "Allow public select legal_pages" on public.legal_pages for select using (true);
create policy "Allow public insert legal_pages" on public.legal_pages for insert with check (true);
create policy "Allow public update legal_pages" on public.legal_pages for update using (true);
create policy "Allow public delete legal_pages" on public.legal_pages for delete using (true);

-- 5. Feed initial Terms & Conditions data
insert into public.legal_pages (page_key, title, intro, sections, is_published, updated_at)
values (
  'terms',
  'Terms & Conditions',
  'Welcome to Marvel Slice. By accessing or using our website, courses, and educational services, you agree to be bound by the following terms and conditions.',
  jsonb_build_array(
    jsonb_build_object('id', '1', 'heading', '1. Acceptance of Terms', 'body', 'By accessing or using our platform, courses, and educational services, you confirm that you have read, understood, and agree to these Terms & Conditions. If you do not agree, please refrain from using our services.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', '2', 'heading', '2. Educational Services & Enrollment', 'body', 'Marvel Slice provides software training, competitive exam coaching, and career guidance. Course enrollments are subject to availability and payment verification. We reserve the right to refine curriculum or class schedules to maximize learning outcomes.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', '3', 'heading', '3. Intellectual Property Rights', 'body', 'All study materials, video content, branding, logos, and course assets provided by Marvel Slice are protected by copyright and intellectual property laws. Redistribution, resale, or unauthorized sharing of course content is strictly prohibited.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', '4', 'heading', '4. User Responsibilities & Conduct', 'body', 'Users must provide accurate registration details and maintain the confidentiality of their credentials. Any unauthorized access, tampering, or misuse of our digital systems may result in immediate suspension of services.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', '5', 'heading', '5. Contact & Inquiries', 'body', 'If you have questions or require clarification regarding these Terms & Conditions, please contact us through our official support email or contact form.', 'heading_align', 'left', 'body_align', 'left')
  ),
  true,
  now()
)
on conflict (page_key) do update set
  title = excluded.title,
  intro = excluded.intro,
  sections = excluded.sections,
  is_published = excluded.is_published,
  updated_at = now();

-- 6. Feed initial Privacy Policy data
insert into public.legal_pages (page_key, title, intro, sections, is_published, updated_at)
values (
  'privacy',
  'Privacy Policy',
  'At Marvel Slice, we respect your privacy and are dedicated to safeguarding the personal data you share with us.',
  jsonb_build_array(
    jsonb_build_object('id', '1', 'heading', '1. Information We Collect', 'body', 'We collect personal information that you voluntarily provide when registering for courses, filling enquiry forms, or contacting us. This includes your name, email address, phone number, and educational interests.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', '2', 'heading', '2. How We Use Your Information', 'body', 'We utilize your information to deliver course materials, process enrollments, respond to inquiries, send relevant updates, and improve overall platform user experience.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', '3', 'heading', '3. Data Security & Protection', 'body', 'We implement industry-standard technical and organizational security measures to protect your personal information against unauthorized access, loss, or disclosure. We do not sell or trade your data to third parties.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', '4', 'heading', '4. Cookies & Usage Analytics', 'body', 'Our platform uses cookies and analytical tools to understand user behavior and optimize performance. You can manage or disable cookie preferences through your web browser settings.', 'heading_align', 'left', 'body_align', 'left'),
    jsonb_build_object('id', '5', 'heading', '5. Updates to This Policy', 'body', 'We may update this Privacy Policy periodically to reflect changes in legal or operational practices. Continued use of our website constitutes acceptance of any revisions.', 'heading_align', 'left', 'body_align', 'left')
  ),
  true,
  now()
)
on conflict (page_key) do update set
  title = excluded.title,
  intro = excluded.intro,
  sections = excluded.sections,
  is_published = excluded.is_published,
  updated_at = now();
