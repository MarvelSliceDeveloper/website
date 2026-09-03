-- Migration: Add structured fields to job_openings and internships tables
alter table if exists public.job_openings add column if not exists division text;
alter table if exists public.job_openings add column if not exists key_requirements text;
alter table if exists public.job_openings add column if not exists responsibilities text;
alter table if exists public.job_openings add column if not exists qualifications text;
alter table if exists public.job_openings add column if not exists apply_url text;

alter table if exists public.internships add column if not exists division text;
alter table if exists public.internships add column if not exists key_requirements text;
alter table if exists public.internships add column if not exists responsibilities text;
alter table if exists public.internships add column if not exists qualifications text;
