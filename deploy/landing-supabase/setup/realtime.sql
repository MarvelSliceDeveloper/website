-- Stream the tables the landing SPA subscribes to via supabase.channel().
do $$
declare
  t text;
  tables text[] := array[
    'conversations','messages',
    'brochure_downloads','form_submissions','contact_submissions',
    'about_submissions','career_submissions','career_contact_submissions',
    'newsletter_subscribers'
  ];
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach t in array tables loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t)
       and not exists (select 1 from pg_publication_tables
                       where pubname = 'supabase_realtime'
                         and schemaname = 'public' and tablename = t)
    then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;

  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'messages') then
    alter table public.messages replica identity full;
  end if;
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'conversations') then
    alter table public.conversations replica identity full;
  end if;
end $$;
