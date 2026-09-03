-- Current Affairs Table Migration
create table if not exists current_affairs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  content text,
  category text not null default 'National Affairs',
  source text default 'News',
  source_url text unique,
  image_url text,
  published_at timestamptz default now(),
  importance text default 'Medium',
  is_published boolean default true,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table current_affairs enable row level security;

-- Public access policies
drop policy if exists "Allow public select current_affairs" on current_affairs;
create policy "Allow public select current_affairs" on current_affairs for select to anon, authenticated using (true);

drop policy if exists "Allow public insert current_affairs" on current_affairs;
create policy "Allow public insert current_affairs" on current_affairs for insert to anon, authenticated with check (true);

drop policy if exists "Allow public update current_affairs" on current_affairs;
create policy "Allow public update current_affairs" on current_affairs for update to anon, authenticated using (true);

drop policy if exists "Allow public delete current_affairs" on current_affairs;
create policy "Allow public delete current_affairs" on current_affairs for delete to anon, authenticated using (true);

-- Indexes for fast querying & filtering
create index if not exists idx_current_affairs_category_published on current_affairs (category, published_at desc);
create index if not exists idx_current_affairs_published_at on current_affairs (published_at desc);
