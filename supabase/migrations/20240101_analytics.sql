-- Create analytics_logs table
create table if not exists public.analytics_logs (
  id uuid default gen_random_uuid() primary key,
  event_type text not null, -- 'page_view', 'login', 'register'
  path text,
  user_id uuid references auth.users(id),
  session_id text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.analytics_logs enable row level security;

-- Policies
-- 1. Allow inserts from anyone (for page views) - ideally restrict to server-side only via service key, but for client-side tracking we might need this.
-- However, we plan to use Middleware (Server-side), so we will use Service Key there.
-- But just in case we track from client:
create policy "Allow public insert" on public.analytics_logs for insert with check (true);

-- 2. Allow read only for admins
create policy "Allow admin read" on public.analytics_logs for select using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
