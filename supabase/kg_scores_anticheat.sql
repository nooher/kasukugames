-- KasukuGames — leaderboard anti-cheat (server-authoritative XP)
-- Run once in the Kasuku Supabase project (ujokjnfdhtswomhgjkfp). Idempotent.
--
-- Problem: the client used to upsert its own absolute `xp` straight into kg_scores,
-- so anyone could set xp = 999999999 and top the board. Fix: all writes now go
-- through a SECURITY DEFINER function that (a) forces id = auth.uid(), (b) keeps xp and
-- total_games MONOTONIC (never decrease), and (c) RATE-LIMITS the increase so an instant
-- mega-jump is clamped while real play / offline accrual is never touched. Direct
-- INSERT/UPDATE on kg_scores is then revoked so the function is the only write path.

create or replace function public.kg_submit_stats(
  p_handle       text,
  p_name         text,
  p_avatar       text,
  p_photo        text,
  p_xp           integer,
  p_level        integer,
  p_total_games  integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_now    timestamptz := now();
  v_old    public.kg_scores%rowtype;
  v_elapsed numeric;
  v_xp_allow    integer;
  v_games_allow integer;
  v_xp     integer;
  v_games  integer;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_old from public.kg_scores where id = v_uid;

  if not found then
    -- First submission for this account: accept a sane snapshot (clamp absurd values).
    v_xp    := greatest(0, least(coalesce(p_xp, 0), 5000000));
    v_games := greatest(0, least(coalesce(p_total_games, 0), 1000000));
    insert into public.kg_scores(id, handle, name, avatar, photo_url, xp, level, total_games, updated_at)
    values (v_uid, p_handle, p_name, p_avatar, p_photo, v_xp, greatest(1, coalesce(p_level, 1)), v_games, v_now);
    return;
  end if;

  v_elapsed := greatest(0, extract(epoch from (v_now - v_old.updated_at)));

  -- Generous allowance: legit play (a few dozen xp per game, minutes each) and offline
  -- accrual over hours stay well under it; only absurd instant jumps get clamped.
  -- base 5000 + 50 xp per second since the last update (elapsed capped at 1 day).
  v_xp_allow    := 5000 + (least(v_elapsed, 86400) * 50)::integer;
  v_games_allow := 50   + (least(v_elapsed, 86400) / 20)::integer;

  v_xp    := greatest(v_old.xp,          least(coalesce(p_xp, v_old.xp),                   v_old.xp + v_xp_allow));
  v_games := greatest(v_old.total_games, least(coalesce(p_total_games, v_old.total_games), v_old.total_games + v_games_allow));

  update public.kg_scores set
    handle      = coalesce(p_handle, handle),
    name        = coalesce(p_name, name),
    avatar      = coalesce(p_avatar, avatar),
    photo_url   = coalesce(p_photo, photo_url),
    xp          = v_xp,
    level       = greatest(1, coalesce(p_level, level)),
    total_games = v_games,
    updated_at  = v_now
  where id = v_uid;
end;
$$;

-- Only authenticated users may call it; the function itself enforces the rest.
revoke all on function public.kg_submit_stats(text,text,text,text,integer,integer,integer) from public;
grant execute on function public.kg_submit_stats(text,text,text,text,integer,integer,integer) to authenticated;

-- Close the direct-write bypass so the validated function is the ONLY way in.
-- (Reads stay open; the SECURITY DEFINER function still writes as owner.)
revoke insert, update on public.kg_scores from anon, authenticated, public;
-- Defense in depth: no client should ever delete/truncate leaderboard rows.
revoke delete, truncate on public.kg_scores from anon, authenticated, public;
