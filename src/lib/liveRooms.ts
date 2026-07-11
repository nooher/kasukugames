// ── Saved live rooms ─────────────────────────────────────────────────────────
// Live rooms are ephemeral Supabase Realtime channels — leaving used to lose the
// code forever. We remember the rooms a player is in (locally) so they can rejoin
// after an accidental exit, a refresh, or a dropped connection, as long as a
// playmate is still there. Cleared only when the player deliberately closes a room.

export interface SavedRoom {
  code: string
  isHost: boolean
  game?: string        // last game id launched in the room
  gameName?: string
  withName?: string    // who they're playing with (best-effort label)
  savedAt: number
}

const KEY = 'kg_live_rooms'

export function loadSavedRooms(): SavedRoom[] {
  try {
    const d = localStorage.getItem(KEY)
    if (!d) return []
    const rooms = JSON.parse(d) as SavedRoom[]
    // Drop anything older than 12h — stale rooms are almost certainly closed.
    const fresh = rooms.filter(r => r && r.code && Date.now() - (r.savedAt || 0) < 12 * 3600_000)
    if (fresh.length !== rooms.length) localStorage.setItem(KEY, JSON.stringify(fresh))
    return fresh
  } catch {
    return []
  }
}

export function rememberRoom(room: Omit<SavedRoom, 'savedAt'>) {
  if (!room.code) return
  const code = room.code.toUpperCase()
  const rooms = loadSavedRooms().filter(r => r.code !== code)
  rooms.unshift({ ...room, code, savedAt: Date.now() })
  try { localStorage.setItem(KEY, JSON.stringify(rooms.slice(0, 8))) } catch { /* ignore */ }
}

export function forgetRoom(code: string) {
  const c = (code || '').toUpperCase()
  try { localStorage.setItem(KEY, JSON.stringify(loadSavedRooms().filter(r => r.code !== c))) } catch { /* ignore */ }
}
