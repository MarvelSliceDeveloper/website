-- Custom Register: replace roll number with optional experience field.

alter table if exists public.custom_register
  add column if not exists experience text;
