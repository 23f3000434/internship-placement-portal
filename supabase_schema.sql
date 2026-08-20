-- ==============================================================================
-- G H RAISONI CENTRAL INTERNSHIP & PLACEMENT PORTAL (INTERNTRACK)
-- SUPABASE DATABASE SETUP SCRIPT
-- ==============================================================================
-- Run this in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/etnmaluhlgwvwjpxvnof/sql/new
-- 2. Paste this SQL and click "Run" (CMD + Enter / Ctrl + Enter)
-- ==============================================================================

-- 1. Create the central synchronized portal ledger table
create table if not exists public.portal_data (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz default now()
);

-- 2. Enable Row Level Security
alter table public.portal_data enable row level security;

-- 3. Create permissive policy for the anonymous public client key
drop policy if exists "Allow public anon access to portal_data" on public.portal_data;
create policy "Allow public anon access to portal_data"
on public.portal_data
for all
to anon, authenticated
using (true)
with check (true);

-- 4. Enable Realtime for live updates across laptops & phones
alter publication supabase_realtime add table public.portal_data;
