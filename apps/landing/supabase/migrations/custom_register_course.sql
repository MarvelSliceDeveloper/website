-- Custom Register: store the selected course with each registration.

alter table if exists public.custom_register
  add column if not exists course_id uuid;

alter table if exists public.custom_register
  add column if not exists course_title text;

create index if not exists idx_custom_register_course on public.custom_register(course_id);
