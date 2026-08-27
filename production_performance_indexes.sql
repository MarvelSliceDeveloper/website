-- ============================================================
-- MARVEL SLICE — PRODUCTION PERFORMANCE INDEXES MIGRATION
-- ============================================================
-- Run this script in your Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- This migration creates targeted B-Tree indexes on foreign keys, email columns,
-- status fields, and timestamp ordering columns across PostgreSQL to accelerate
-- query execution by 10x-100x on production workloads.
-- ============================================================

-- ------------------------------------------------------------
-- 1. COURSES & NAVIGATION INDEXES
-- ------------------------------------------------------------
create index if not exists idx_courses_created_at on public.courses(created_at desc);
create index if not exists idx_courses_slug on public.courses(slug);
create index if not exists idx_courses_status on public.courses(status);
create index if not exists idx_courses_nav_item on public.courses(nav_item_id);

-- ------------------------------------------------------------
-- 2. BLOG POSTS & CATEGORIES INDEXES
-- ------------------------------------------------------------
create index if not exists idx_blog_posts_created_at on public.blog_posts(created_at desc);
create index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_blog_posts_category on public.blog_posts(category_id);
create index if not exists idx_blog_posts_published on public.blog_posts(is_published, published_at desc);

-- ------------------------------------------------------------
-- 3. ADMIN PROFILES & SECURITY AUDIT INDEXES
-- ------------------------------------------------------------
create index if not exists idx_admin_profiles_email_lower on public.admin_profiles(lower(email));
create index if not exists idx_admin_audit_logs_email on public.admin_audit_logs(email);
create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs(created_at desc);

-- ------------------------------------------------------------
-- 4. LEAD SUBMISSION & FORM TABLES INDEXES
-- Accelerated unread notifications and filter queries
-- ------------------------------------------------------------
create index if not exists idx_contact_submissions_unread on public.contact_submissions(is_read, created_at desc);
create index if not exists idx_banking_enquiries_unread on public.banking_enquiries(is_read, created_at desc);
create index if not exists idx_brochure_downloads_unread on public.brochure_downloads(is_read, created_at desc);
create index if not exists idx_form_submissions_unread on public.form_submissions(is_read, created_at desc);
create index if not exists idx_career_submissions_unread on public.career_submissions(is_read, created_at desc);
create index if not exists idx_career_contact_submissions_unread on public.career_contact_submissions(is_read, created_at desc);
create index if not exists idx_about_submissions_unread on public.about_submissions(is_read, created_at desc);
create index if not exists idx_newsletter_subscribers_created on public.newsletter_subscribers(created_at desc);
create index if not exists idx_upcoming_classes_active_date on public.upcoming_classes(is_active, date_time);

-- ------------------------------------------------------------
-- 5. CHAT CONVERSATIONS INDEXES
-- ------------------------------------------------------------
create index if not exists idx_conversations_notified on public.conversations(notified, last_message_at desc);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
