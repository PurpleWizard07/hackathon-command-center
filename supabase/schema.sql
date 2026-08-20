-- Hackathon Command Center - cloud persistence schema.
--
-- One JSONB row per signed-in user, mirroring the same `CommandCenterData`
-- document the app used to keep in localStorage. Paste this whole file into
-- the Supabase dashboard's SQL editor (a fresh project's SQL Editor -> New
-- query) and run it once.

create table if not exists public.hackathon_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.hackathon_data enable row level security;

-- Each signed-in user can only ever see or touch their own row.
create policy "select own row" on public.hackathon_data
  for select using (auth.uid() = user_id);

create policy "insert own row" on public.hackathon_data
  for insert with check (auth.uid() = user_id);

create policy "update own row" on public.hackathon_data
  for update using (auth.uid() = user_id);

create policy "delete own row" on public.hackathon_data
  for delete using (auth.uid() = user_id);
