-- Columns present in the live Supabase database (and referenced by the
-- 02_seed_data.sql backup) but missing from schema.sql / prior migrations.
alter table public.site_settings add column if not exists ga_measurement_id text;
alter table public.site_settings add column if not exists blog_mobile_hero_image text;
alter table public.nav_pages add column if not exists mobile_hero_image text;
