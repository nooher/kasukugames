/* Global "Tanzanite House" leaderboard — cross-device, on the shared Kasuku
   Supabase. Degrades gracefully to null if unauthenticated or table absent. */
import { supabase } from './kasuku-bridge'

export interface HouseEntry {
  id: string; handle: string; name: string; avatar: string | null; photo_url: string | null
  net_worth: number; best_stone: number; stones_sold: number; deepest: number; rank_title: string
}

export interface PushHouse {
  handle: string; name: string; avatar: string; photoUrl: string | null
  netWorth: number; bestStone: number; stonesSold: number; deepest: number; rankTitle: string
}

let last = 0
/** Upsert my Tanzanite house standing. Throttled 10s; no-ops if signed out. */
export async function pushHouse(s: PushHouse, force = false): Promise<void> {
  if (!supabase) return
  const now = Date.now()
  if (!force && now - last < 10_000) return
  last = now
  try {
    const { data: u } = await supabase.auth.getUser()
    const uid = u?.user?.id
    if (!uid) return
    await supabase.from('kg_tanzanite').upsert({
      id: uid, handle: s.handle, name: s.name, avatar: s.avatar, photo_url: s.photoUrl,
      net_worth: Math.round(s.netWorth), best_stone: Math.round(s.bestStone),
      stones_sold: s.stonesSold, deepest: s.deepest, rank_title: s.rankTitle,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  } catch { /* table not provisioned / offline */ }
}

export async function fetchHouses(limit = 50): Promise<HouseEntry[] | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase.from('kg_tanzanite')
      .select('id, handle, name, avatar, photo_url, net_worth, best_stone, stones_sold, deepest, rank_title')
      .order('net_worth', { ascending: false }).limit(limit)
    if (error) return null
    return (data ?? []) as HouseEntry[]
  } catch { return null }
}

export async function myRank(uid: string): Promise<number | null> {
  if (!supabase) return null
  try {
    const { data } = await supabase.from('kg_tanzanite').select('id').order('net_worth', { ascending: false }).limit(500)
    if (!data) return null
    const i = data.findIndex((r: { id: string }) => r.id === uid)
    return i < 0 ? null : i + 1
  } catch { return null }
}
