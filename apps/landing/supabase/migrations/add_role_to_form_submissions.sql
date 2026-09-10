-- Migration: Add role column to form_submissions table for home page demo form
alter table public.form_submissions add column if not exists role text;
