-- Rewrite old hosted Supabase public URLs to the same-origin base across all
-- text and JSON columns in the public schema.
do $$
declare
  old_url text := 'https://nxlsxywqvvuiljsulito.supabase.co/storage/v1/object/public/';
  new_url text := 'https://marvelslice.com/storage/v1/object/public/';
  r record;
begin
  for r in
    select table_name, column_name, data_type
    from information_schema.columns
    where table_schema = 'public'
      and data_type in ('text','character varying','jsonb','json')
  loop
    if r.data_type in ('jsonb','json') then
      execute format(
        'update public.%I set %I = replace(%I::text, %L, %L)::%s where %I::text like %L',
        r.table_name, r.column_name, r.column_name, old_url, new_url, r.data_type,
        r.column_name, '%' || old_url || '%'
      );
    else
      execute format(
        'update public.%I set %I = replace(%I, %L, %L) where %I like %L',
        r.table_name, r.column_name, r.column_name, old_url, new_url,
        r.column_name, '%' || old_url || '%'
      );
    end if;
  end loop;
end $$;
