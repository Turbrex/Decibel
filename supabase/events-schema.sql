-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- It is NOT executed automatically by anything in this repo or by GitHub Actions.

-- ---------------------------------------------------------------------------
-- events table
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date timestamptz not null,
  location text,
  link text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "Events readable by signed-in users" on public.events;
create policy "Events readable by signed-in users"
  on public.events for select
  to authenticated
  using (true);

drop policy if exists "Only admins can insert events" on public.events;
create policy "Only admins can insert events"
  on public.events for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Only admins can update events" on public.events;
create policy "Only admins can update events"
  on public.events for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Only admins can delete events" on public.events;
create policy "Only admins can delete events"
  on public.events for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------------
-- settings table (site-wide key/value, admin-only in both directions so the
-- Discord webhook URL stored here is never readable by a regular signed-up
-- user, only by the admin account)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value text
);

alter table public.settings enable row level security;

drop policy if exists "Only admins can read settings" on public.settings;
create policy "Only admins can read settings"
  on public.settings for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Only admins can insert settings" on public.settings;
create policy "Only admins can insert settings"
  on public.settings for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Only admins can update settings" on public.settings;
create policy "Only admins can update settings"
  on public.settings for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ---------------------------------------------------------------------------
-- Mark the existing admin account as admin. app_metadata (unlike
-- user_metadata) can only be changed via SQL/service-role, never by the user
-- themselves through the client SDK -- that's what makes it safe to use for
-- authorization in the RLS policies above.
-- ---------------------------------------------------------------------------
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@decibel.band';

-- IMPORTANT: app_metadata is baked into the JWT at login time. After running
-- this, log out and log back in on the site as admin@decibel.band so the new
-- token actually carries the "role":"admin" claim.
