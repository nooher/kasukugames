-- KasukuGames real leaderboard table.
-- Run once in the Kasuku Supabase project (ujokjnfdhtswomhgjkfp)
-- → Dashboard → SQL Editor → paste → Run.
-- After this, ranks become real: every signed-in player's XP is upserted and
-- the leaderboard reads the top players across all devices.

create table if not exists public.kg_scores (
  id          uuid primary key references auth.users(id) on delete cascade,
  handle      text,
  name        text,
  avatar      text,
  photo_url   text,
  xp          integer not null default 0,
  level       integer not null default 1,
  total_games integer not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.kg_scores enable row level security;

-- Anyone (even anon) can read the leaderboard.
drop policy if exists kg_scores_read on public.kg_scores;
create policy kg_scores_read on public.kg_scores
  for select using (true);

-- A signed-in user can only write their OWN row (id must equal their auth uid).
drop policy if exists kg_scores_insert_own on public.kg_scores;
create policy kg_scores_insert_own on public.kg_scores
  for insert with check (auth.uid() = id);

drop policy if exists kg_scores_update_own on public.kg_scores;
create policy kg_scores_update_own on public.kg_scores
  for update using (auth.uid() = id);

-- Faster top-N ordering.
create index if not exists kg_scores_xp_idx on public.kg_scores (xp desc);
