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
  muhuri?: string
}

function muhuriOf(verified?: boolean, kind?: string | null): string | undefined {
  if (!verified) return undefined
  if (kind === 'founder') return 'founder'
  if (kind === 'admin' || kind === 'moderator') return 'admin'
  if (kind === 'creator') return 'creator'
  return 'verified'
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

/** Submit my aggregate stats through the server-authoritative anti-cheat function
 *  (kg_submit_stats): forces id = auth.uid(), keeps xp/total_games monotonic, and
 *  rate-limits the increase so a forged mega-jump is clamped. Direct writes to
 *  kg_scores are revoked, so this RPC is the only write path. Throttled; silently
 *  no-ops if unauthenticated or the function isn't provisioned. */
export async function pushMyStats(p: MyStats, force = false): Promise<void> {
  try {
    const now = Date.now()
    if (!force && now - lastPush < 15000) return
    lastPush = now
    const { data } = await supabase.auth.getUser()
    const uid = data?.user?.id
    if (!uid) return
    await supabase.rpc('kg_submit_stats', {
      p_handle: p.username,
      p_name: p.displayName,
      p_avatar: p.avatar,
      p_photo: p.photoUrl,
      p_xp: Math.round(p.xp) || 0,
      p_level: p.level || 1,
      p_total_games: p.totalGames || 0,
    })
  } catch { /* function not provisioned yet — ignore */ }
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
    // Pull verification badges from profiles so they show on the board.
    const badge: Record<string, string | undefined> = {}
    try {
      const ids = data.map(r => r.id).filter(Boolean)
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, verified, verified_kind').in('id', ids)
        for (const p of profs || []) badge[p.id] = muhuriOf(p.verified, p.verified_kind)
      }
    } catch { /* badges optional */ }
    return data.map(r => ({
      id: r.id,
      handle: r.handle,
      name: r.name || r.handle,
      avatar: r.avatar || '🎮',
      photoUrl: r.photo_url ?? null,
      xp: r.xp || 0,
      level: r.level || 1,
      totalGames: r.total_games || 0,
      muhuri: badge[r.id],
    }))
  } catch {
    return null
  }
}
