import { supabase } from './kasuku-bridge'

// Shared per-game world records on Supabase (kg_game_records). Unlike the local
// same-device records, these are cross-user: when another player beats a record
// you held, you get notified the next time you open the app.

const SNAP_KEY = 'kg_records_snapshot'

/** After a game, take the world record if your score beats it. */
export async function pushRecord(gameId: string, gameName: string, score: number): Promise<void> {
  try {
    if (!score) return
    const { data: u } = await supabase.auth.getUser()
    const uid = u?.user?.id
    if (!uid) return
    const { data: cur } = await supabase.from('kg_game_records').select('score').eq('game_id', gameId).maybeSingle()
    if (cur && score <= (cur.score || 0)) return
    await supabase.from('kg_game_records').upsert({
      game_id: gameId, game_name: gameName, holder_id: uid, score: Math.round(score), updated_at: new Date().toISOString(),
    }, { onConflict: 'game_id' })
  } catch { /* table not provisioned yet */ }
}

/** On load: notify me about any record I held that someone else has since taken. */
export async function checkLostRecords(notify: (game: string, by: string) => void): Promise<void> {
  try {
    const { data: u } = await supabase.auth.getUser()
    const myId = u?.user?.id
    if (!myId) return
    const { data } = await supabase.from('kg_game_records').select('game_id, game_name, holder_id').limit(300)
    if (!Array.isArray(data)) return

    let snap: Record<string, string> = {}
    try { snap = JSON.parse(localStorage.getItem(SNAP_KEY) || '{}') } catch { /* ignore */ }

    const lost = data.filter(r => snap[r.game_id] === myId && r.holder_id && r.holder_id !== myId)
    if (lost.length) {
      const ids = [...new Set(lost.map(r => r.holder_id))]
      const { data: profs } = await supabase.from('profiles').select('id, name').in('id', ids)
      const nameOf: Record<string, string> = Object.fromEntries((profs || []).map(p => [p.id, p.name]))
      for (const r of lost) notify(r.game_name || r.game_id, nameOf[r.holder_id] || 'Someone')
    }

    const next: Record<string, string> = {}
    for (const r of data) if (r.holder_id) next[r.game_id] = r.holder_id
    localStorage.setItem(SNAP_KEY, JSON.stringify(next))
  } catch { /* ignore */ }
}
