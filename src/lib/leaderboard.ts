import { supabase } from './kasuku-bridge'

// Real cross-device leaderboard on the shared Kasuku Supabase.
// Requires a `kg_scores` table (see the SQL in the project notes / README).
// Everything degrades gracefully: if the table doesn't exist yet, reads return
// null and the UI falls back to the demo board.

export interface LiveEntry {
  id: string
  handle: string
  name: string
  avatar: string
  photoUrl: string | null
  xp: number
  level: number
  totalGames: number
}

export interface MyStats {
  username: string
  displayName: string
  avatar: string
  photoUrl: string | null
  xp: number
  level: number
  totalGames: number
}

let lastPush = 0

/** Upsert my aggregate stats. Throttled; silently no-ops if unauthenticated or
 *  the table is missing. */
export async function pushMyStats(p: MyStats, force = false): Promise<void> {
  try {
    const now = Date.now()
    if (!force && now - lastPush < 15000) return
    lastPush = now
    const { data } = await supabase.auth.getUser()
    const uid = data?.user?.id
    if (!uid) return
    await supabase.from('kg_scores').upsert({
      id: uid,
      handle: p.username,
      name: p.displayName,
      avatar: p.avatar,
      photo_url: p.photoUrl,
      xp: Math.round(p.xp) || 0,
      level: p.level || 1,
      total_games: p.totalGames || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  } catch { /* table not provisioned yet — ignore */ }
}

/** Top players by XP. Returns null if the table isn't available. */
export async function fetchLeaderboard(limit = 100): Promise<LiveEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from('kg_scores')
      .select('id, handle, name, avatar, photo_url, xp, level, total_games')
      .order('xp', { ascending: false })
      .limit(limit)
    if (error || !Array.isArray(data)) return null
    return data.map(r => ({
      id: r.id,
      handle: r.handle,
      name: r.name || r.handle,
      avatar: r.avatar || '🎮',
      photoUrl: r.photo_url ?? null,
      xp: r.xp || 0,
      level: r.level || 1,
      totalGames: r.total_games || 0,
    }))
  } catch {
    return null
  }
}
