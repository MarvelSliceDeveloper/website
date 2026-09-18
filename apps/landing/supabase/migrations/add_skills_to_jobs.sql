-- Migration: Add skills column to job_openings and internships tables
alter table if exists public.job_openings add column if not exists skills text;
alter table if exists public.internships add column if not exists skills text;
