import { supabase } from './kasuku-bridge'

// People come from the shared Kasuku follow graph (`follows` table:
// follower_id → following_id). So anyone you follow each other with on Kasuku
// shows up in KasukuGames automatically — on both sides — and can be challenged
// to a live game. No manual re-adding needed.

export interface KasukuPerson {
  id: string
  handle: string
  name: string
  photoUrl: string | null
  mutual: boolean   // you follow each other
}

export async function fetchKasukuPeople(): Promise<KasukuPerson[]> {
  try {
    const { data: u } = await supabase.auth.getUser()
    const me = u?.user?.id
    if (!me) return []
    const [followingRes, followersRes] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', me),
      supabase.from('follows').select('follower_id').eq('following_id', me),
    ])
    const following = new Set((followingRes.data || []).map((r: any) => r.following_id))
    const followers = new Set((followersRes.data || []).map((r: any) => r.follower_id))
    const ids = Array.from(new Set([...following, ...followers])).filter(id => id && id !== me)
    if (!ids.length) return []
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, handle, name, avatar_url')
      .in('id', ids)
    return (profs || [])
      .map((p: any) => ({
        id: p.id,
        handle: p.handle,
        name: p.name || p.handle,
        photoUrl: p.avatar_url ?? null,
        mutual: following.has(p.id) && followers.has(p.id),
      }))
      .filter(p => p.handle)
      .sort((a, b) => Number(b.mutual) - Number(a.mutual) || a.name.localeCompare(b.name))
  } catch {
    return []
  }
}

// When you add someone by their Kasuku username in KasukuGames, follow them on
// Kasuku too — so if they follow back it becomes mutual and you appear on each
// other's People. Silently no-ops if unauthenticated / already following.
export async function followOnKasuku(handle: string): Promise<boolean> {
  try {
    const { data: u } = await supabase.auth.getUser()
    const me = u?.user?.id
    const h = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!me || !h) return false
    const { data: prof } = await supabase.from('profiles').select('id').eq('handle', h).single()
    if (!prof?.id || prof.id === me) return false
    await supabase.from('follows').insert({ follower_id: me, following_id: prof.id })
    return true
  } catch {
    return false // already following (unique violation) or blocked — fine
  }
}
