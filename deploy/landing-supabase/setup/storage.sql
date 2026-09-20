-- Public buckets used by the landing admin/media library.
insert into storage.buckets (id, name, public)
values
  ('hero-images','hero-images', true),
  ('course-thumbnails','course-thumbnails', true),
  ('certificates','certificates', true),
  ('company-logos','company-logos', true),
  ('nav-icons','nav-icons', true),
  ('pages','pages', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "landing_public_read" on storage.objects;
create policy "landing_public_read" on storage.objects
  for select
  using (bucket_id in ('hero-images','course-thumbnails','certificates','company-logos','nav-icons','pages'));

drop policy if exists "landing_anon_insert" on storage.objects;
create policy "landing_anon_insert" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id in ('hero-images','course-thumbnails','certificates','company-logos','nav-icons','pages'));

drop policy if exists "landing_anon_delete" on storage.objects;
create policy "landing_anon_delete" on storage.objects
  for delete to anon, authenticated
  using (bucket_id in ('hero-images','course-thumbnails','certificates','company-logos','nav-icons','pages'));
