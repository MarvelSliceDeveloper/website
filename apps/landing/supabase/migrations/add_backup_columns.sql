alter table public.site_settings add column if not exists ga_measurement_id text;
alter table public.site_settings add column if not exists blog_mobile_hero_image text;
alter table public.nav_pages add column if not exists mobile_hero_image text;
alter table public.career_page_content add column if not exists mobile_hero_image text;
alter table public.banking_testimonials add column if not exists bank_name text;