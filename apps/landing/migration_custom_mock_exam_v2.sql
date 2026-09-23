-- ==============================================================================
-- MARVEL SLICE — CUSTOM MOCK EXAM ENHANCEMENTS MIGRATION (V2)
-- Features: Allowed Degrees, Section Categories, Academic Marks, Address & Breakdown
-- Run this query in your Supabase SQL Editor or Postgres Console.
-- ==============================================================================

-- 1. Add Allowed Degrees and Section Categories to custom_mock_exams table
ALTER TABLE public.custom_mock_exams 
  ADD COLUMN IF NOT EXISTS allowed_degrees jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS exam_categories jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS exam_end_time timestamptz,
  ADD COLUMN IF NOT EXISTS exam_mode text DEFAULT 'questions';

-- 2. Add Section Category Name to custom_mock_exam_questions table
ALTER TABLE public.custom_mock_exam_questions 
  ADD COLUMN IF NOT EXISTS category_name text DEFAULT 'General';

-- 3. Add Extended Academic Details (Degree, Address, 10th %, 12th %, CGPA) to custom_mock_exam_registrations table
ALTER TABLE public.custom_mock_exam_registrations 
  ADD COLUMN IF NOT EXISTS user_degree text,
  ADD COLUMN IF NOT EXISTS user_address text,
  ADD COLUMN IF NOT EXISTS user_10th_mark numeric,
  ADD COLUMN IF NOT EXISTS user_12th_mark numeric,
  ADD COLUMN IF NOT EXISTS user_cgpa numeric;

-- 4. Add Extended Academic Details and Category Scores Breakdown to custom_mock_exam_submissions table
ALTER TABLE public.custom_mock_exam_submissions 
  ADD COLUMN IF NOT EXISTS user_degree text,
  ADD COLUMN IF NOT EXISTS user_address text,
  ADD COLUMN IF NOT EXISTS user_10th_mark numeric,
  ADD COLUMN IF NOT EXISTS user_12th_mark numeric,
  ADD COLUMN IF NOT EXISTS user_cgpa numeric,
  ADD COLUMN IF NOT EXISTS category_scores jsonb DEFAULT '{}'::jsonb;
