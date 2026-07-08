import { supabase } from './kasuku-bridge'

// Global online presence. Every signed-in KasukuGames player joins one shared
// channel and tracks their handle, so anywhere in the app we can show a live
// green "online now" light for the people who are actually here right now.

export function joinOnline(handle: string, onChange: (online: Set<string>) => void): () => void {
  const h = handle.trim().toLowerCase()
  if (!h) return () => {}
  const ch = supabase.channel('kg-online', { config: { presence: { key: h } } })
  ch.on('presence', { event: 'sync' }, () => {
    const state = ch.presenceState<{ handle: string }>()
    const set = new Set<string>()
    for (const key of Object.keys(state)) {
      const meta = state[key][0] as { handle?: string } | undefined
      if (meta?.handle) set.add(meta.handle.toLowerCase())
    }
    onChange(set)
  })
  ch.subscribe(async status => { if (status === 'SUBSCRIBED') await ch.track({ handle: h }) })
  return () => { try { supabase.removeChannel(ch) } catch { /* ignore */ } }
}
