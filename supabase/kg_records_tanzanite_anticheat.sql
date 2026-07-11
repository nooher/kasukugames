-- KasukuGames — anti-cheat for the per-game record board and the Tanzanite house board
-- Run once in the Kasuku Supabase project (ujokjnfdhtswomhgjkfp). Idempotent.
-- Same pattern as kg_scores: all writes go through SECURITY DEFINER functions that
-- force id/holder = auth.uid() and validate the values; direct writes are revoked.

-- ── Per-game world records (kg_game_records) ─────────────────────────────────
-- One row per game_id. A claim is only accepted if it STRICTLY beats the current
-- record; the holder becomes the caller. Absurd scores are capped.
create or replace function public.kg_submit_record(
  p_game_id   text,
  p_game_name text,
  p_score     integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_cur integer;
  v_score integer;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  v_score := greatest(0, least(coalesce(p_score, 0), 100000000)); -- cap absurd values

  select score into v_cur from public.kg_game_records where game_id = p_game_id;

  if not found then
    insert into public.kg_game_records(game_id, game_name, holder_id, score, updated_at)
    values (p_game_id, p_game_name, v_uid, v_score, now());
  elsif v_score > coalesce(v_cur, 0) then
    update public.kg_game_records
      set holder_id = v_uid, score = v_score,
          game_name = coalesce(p_game_name, game_name), updated_at = now()
      where game_id = p_game_id;
  end if; -- did not beat it → no-op
end;
$$;

revoke all on function public.kg_submit_record(text,text,integer) from public;
grant execute on function public.kg_submit_record(text,text,integer) to authenticated;
revoke insert, update, delete, truncate on public.kg_game_records from anon, authenticated, public;

-- ── Tanzanite house board (kg_tanzanite) ─────────────────────────────────────
-- net_worth is a TRADING figure (can legitimately fall), so it is NOT monotonic —
-- but we cap absurd values and rate-limit the per-update INCREASE so nobody jumps to
-- 1e12 in one shot. "Best ever" fields (best_stone, deepest, stones_sold) are monotonic.
create or replace function public.kg_submit_house(
  p_handle      text,
  p_name        text,
  p_avatar      text,
  p_photo       text,
  p_net_worth   bigint,
  p_best_stone  bigint,
  p_stones_sold integer,
  p_deepest     integer,
  p_rank_title  text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := now();
  v_old public.kg_tanzanite%rowtype;
  v_elapsed numeric;
  v_allow bigint;
  v_net bigint;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select * into v_old from public.kg_tanzanite where id = v_uid;

  if not found then
    insert into public.kg_tanzanite(id, handle, name, avatar, photo_url, net_worth, best_stone, stones_sold, deepest, rank_title, updated_at)
    values (
      v_uid, p_handle, p_name, p_avatar, p_photo,
      greatest(0, least(coalesce(p_net_worth,0), 1000000000000)),
      greatest(0, least(coalesce(p_best_stone,0), 1000000000000)),
      greatest(0, least(coalesce(p_stones_sold,0), 100000000)),
      greatest(0, least(coalesce(p_deepest,0), 100000000)),
      p_rank_title, v_now
    );
    return;
  end if;

  v_elapsed := greatest(0, extract(epoch from (v_now - v_old.updated_at)));
  -- very generous so real trading is never clamped; only blocks instant mega-jumps.
  v_allow := 10000000 + (least(v_elapsed, 86400) * 10000)::bigint;
  -- net worth may fall freely, but a rise is capped to old + allowance (and a hard cap).
  v_net := greatest(0, least(coalesce(p_net_worth, v_old.net_worth), v_old.net_worth + v_allow, 1000000000000));

  update public.kg_tanzanite set
    handle      = coalesce(p_handle, handle),
    name        = coalesce(p_name, name),
    avatar      = coalesce(p_avatar, avatar),
    photo_url   = coalesce(p_photo, photo_url),
    net_worth   = v_net,
    best_stone  = greatest(v_old.best_stone,  least(coalesce(p_best_stone,  v_old.best_stone),  1000000000000)),
    stones_sold = greatest(v_old.stones_sold, least(coalesce(p_stones_sold, v_old.stones_sold), 100000000)),
    deepest     = greatest(v_old.deepest,     least(coalesce(p_deepest,     v_old.deepest),     100000000)),
    rank_title  = coalesce(p_rank_title, rank_title),
    updated_at  = v_now
  where id = v_uid;
end;
$$;

revoke all on function public.kg_submit_house(text,text,text,text,bigint,bigint,integer,integer,text) from public;
grant execute on function public.kg_submit_house(text,text,text,text,bigint,bigint,integer,integer,text) to authenticated;
revoke insert, update, delete, truncate on public.kg_tanzanite from anon, authenticated, public;
