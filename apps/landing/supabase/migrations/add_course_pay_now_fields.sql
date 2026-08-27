-- Migration: Add Pay Now URL and Left CTA Action fields to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS pay_now_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cta_left_action text DEFAULT 'choice_popup';
