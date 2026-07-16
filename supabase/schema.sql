-- CredKit Supabase schema
-- Run this once in the Supabase SQL Editor, then run certificates_seed.sql.

-- =========================================================================
-- 1) OUTCOME EVENTS (the moat) - anonymous, insert-only from the browser
-- =========================================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text,
  type text not null,
  role text,
  degree text,
  college text,
  score int,
  cert_title text,
  cert_provider text,
  meta jsonb
);

alter table public.events enable row level security;

-- Students can only INSERT events. No read/update/delete from the browser;
-- you read the data via the Supabase dashboard / service role.
drop policy if exists "anon can insert events" on public.events;
create policy "anon can insert events"
  on public.events for insert to anon with check (true);

-- =========================================================================
-- 2) CERTIFICATE CATALOG - public, read-only from the browser
-- =========================================================================
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  provider text,
  title text not null,
  cost text,            -- free | cheap | paid
  price_note text,
  hours int,
  level text,           -- Beginner | Intermediate | Advanced
  cert_type text,
  recognized boolean default false,
  subjects jsonb,       -- array of topic strings, e.g. ["SEO","Email"]
  value text,
  url text,
  proof_tip text,
  created_at timestamptz default now()
);

alter table public.certificates enable row level security;

-- Anyone can READ the catalog. Edits happen via dashboard / service role only.
drop policy if exists "anon can read certificates" on public.certificates;
create policy "anon can read certificates"
  on public.certificates for select to anon using (true);
