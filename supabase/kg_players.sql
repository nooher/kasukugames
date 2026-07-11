-- KasukuGames — cloud-synced player data
-- Run once in the Supabase SQL editor (shared Kasuku project ujokjnfdhtswomhgjkfp),
-- or via the Management API. Additive and idempotent — safe to re-run.
--
-- One row per authenticated player, keyed by auth.uid(). Mirrors the player's local
-- state (profile, wallet, records, purchases) so switching device / clearing cache no
-- longer wipes progress. The client keeps localStorage as an offline mirror and
-- reconciles on sign-in (higher XP wins), then pushes changes back debounced. RLS is
-- owner-only — leaderboards are served separately by kg_scores.

create extension if not exists "pgcrypto";

create table if not exists public.kg_players (
  id           uuid primary key references auth.users(id) on delete cascade,
  handle       text,
  xp           integer not null default 0,
  total_games  integer not null default 0,
  profile      jsonb   not null default '{}'::jsonb,
  wallet       jsonb   not null default '{}'::jsonb,
  records      jsonb   not null default '{}'::jsonb,
  purchases    jsonb   not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.kg_players enable row level security;

drop policy if exists kg_players_select on public.kg_players;
create policy kg_players_select on public.kg_players
  for select using (auth.uid() = id);

drop policy if exists kg_players_insert on public.kg_players;
create policy kg_players_insert on public.kg_players
  for insert with check (auth.uid() = id);

drop policy if exists kg_players_update on public.kg_players;
create policy kg_players_update on public.kg_players
  for update using (auth.uid() = id);
