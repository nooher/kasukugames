import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './kasuku-bridge'

// ── Live Rooms ──────────────────────────────────────────────────────────────
// Sovereign real-time multiplayer over Supabase Realtime (presence + broadcast).
// No extra servers, no polling. The HOST holds authoritative game state and
// broadcasts it; guests render it and send actions back. Presence gives us the
// live roster (who's in the room right now).

export interface LivePlayer {
  id: string          // stable per player (handle or generated)
  handle: string
  name: string
  avatar: string      // emoji fallback
  photoUrl?: string | null
  online_at?: string
}

export type NotifStyle = 'gentle' | 'buzz' | 'flash'

export interface LiveInvite {
  code: string
  game: string        // 'party' | 'spin' | 'tod' | 'nhie'
  gameName?: string
  notif?: NotifStyle
  fromHandle: string
  fromName: string
  fromAvatar: string
  fromPhoto?: string | null
}

// Games that can be launched directly inside a live room.
export const LIVE_GAMES: { id: string; name: string; emoji: string }[] = [
  { id: 'spin', name: 'Spin the Bottle', emoji: '🍾' },
  { id: 'tod', name: 'Truth or Dare', emoji: '🎯' },
  { id: 'nhie', name: 'Never Have I Ever', emoji: '🙈' },
  { id: 'wyr', name: 'Would You Rather', emoji: '🤔' },
  { id: 'tot', name: 'This or That', emoji: '💞' },
  { id: 'trivia', name: 'Trivia Duel', emoji: '🧠' },
  { id: 'ttl', name: 'Two Truths & a Lie', emoji: '🕵️' },
  { id: 'gma', name: 'Guess My Answer', emoji: '💘' },
  { id: 'hot', name: 'Hot Takes', emoji: '🌶️' },
  { id: 'er', name: 'Emoji Riddle', emoji: '🧩' },
  { id: 'wc', name: 'Word Chain', emoji: '🔗' },
  { id: 'story', name: 'Story Builder', emoji: '📖' },
  { id: 'mlt', name: 'Most Likely To', emoji: '👉' },
  { id: 'rps', name: 'Rock Paper Scissors', emoji: '✊' },
  { id: 'party', name: 'Surprise — pick together', emoji: '🎉' },
]

export type LiveMsg = { t: string; from: string; d?: any }

const ROOM_PREFIX = 'kg-room-'
const USER_PREFIX = 'kg-user-'

export function makeRoomCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no confusables (I/O/0/1)
  let code = ''
  for (let i = 0; i < 5; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

export class LiveRoom {
  readonly code: string
  readonly me: LivePlayer
  readonly isHost: boolean
  private channel: RealtimeChannel | null = null
  private msgHandlers = new Set<(m: LiveMsg) => void>()
  private playersHandlers = new Set<(p: LivePlayer[]) => void>()
  private statusHandlers = new Set<(s: 'connecting' | 'connected' | 'error') => void>()
  players: LivePlayer[] = []

  constructor(code: string, me: LivePlayer, isHost: boolean) {
    this.code = code.toUpperCase()
    this.me = me
    this.isHost = isHost
  }

  onMessage(fn: (m: LiveMsg) => void) { this.msgHandlers.add(fn); return () => this.msgHandlers.delete(fn) }
  onPlayers(fn: (p: LivePlayer[]) => void) { this.playersHandlers.add(fn); return () => this.playersHandlers.delete(fn) }
  onStatus(fn: (s: 'connecting' | 'connected' | 'error') => void) { this.statusHandlers.add(fn); return () => this.statusHandlers.delete(fn) }

  connect() {
    this.statusHandlers.forEach(h => h('connecting'))
    const channel = supabase.channel(`${ROOM_PREFIX}${this.code}`, {
      config: { presence: { key: this.me.id }, broadcast: { self: false } },
    })
    this.channel = channel

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<LivePlayer>()
      const seen = new Map<string, LivePlayer>()
      for (const key of Object.keys(state)) {
        const meta = state[key][0] as LivePlayer | undefined
        if (meta && meta.id) seen.set(meta.id, meta)
      }
      // stable order: host first, then by name — so turn order is deterministic
      this.players = Array.from(seen.values()).sort((a, b) => a.id.localeCompare(b.id))
      this.playersHandlers.forEach(h => h(this.players))
    })

    channel.on('broadcast', { event: 'm' }, ({ payload }) => {
      this.msgHandlers.forEach(h => h(payload as LiveMsg))
    })

    channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ ...this.me, online_at: new Date().toISOString() })
        this.statusHandlers.forEach(h => h('connected'))
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        this.statusHandlers.forEach(h => h('error'))
      }
    })
  }

  send(t: string, d?: any) {
    if (!this.channel) return
    this.channel.send({ type: 'broadcast', event: 'm', payload: { t, from: this.me.id, d } as LiveMsg })
  }

  leave() {
    if (this.channel) {
      try { this.channel.unsubscribe() } catch { /* ignore */ }
      try { supabase.removeChannel(this.channel) } catch { /* ignore */ }
      this.channel = null
    }
    this.msgHandlers.clear()
    this.playersHandlers.clear()
    this.statusHandlers.clear()
  }
}

// ── Personal invite channel ─────────────────────────────────────────────────
// Every signed-in user listens on kg-user-<handle>. To ping someone who's
// online, we briefly join their channel, broadcast the invite, then leave.

export function listenForInvites(myHandle: string, onInvite: (inv: LiveInvite) => void): () => void {
  const handle = myHandle.trim().toLowerCase()
  if (!handle) return () => {}
  const ch = supabase.channel(`${USER_PREFIX}${handle}`, { config: { broadcast: { self: false } } })
  ch.on('broadcast', { event: 'live-invite' }, ({ payload }) => onInvite(payload as LiveInvite))
  ch.subscribe()
  return () => { try { supabase.removeChannel(ch) } catch { /* ignore */ } }
}

export async function sendLiveInvite(targetHandle: string, invite: LiveInvite): Promise<void> {
  const handle = targetHandle.trim().toLowerCase()
  if (!handle) return
  const ch = supabase.channel(`${USER_PREFIX}${handle}`, { config: { broadcast: { self: false } } })
  await new Promise<void>(resolve => {
    let done = false
    const finish = () => { if (!done) { done = true; resolve() } }
    ch.subscribe(status => { if (status === 'SUBSCRIBED') finish() })
    setTimeout(finish, 4000) // don't hang if realtime is slow
  })
  await ch.send({ type: 'broadcast', event: 'live-invite', payload: invite })
  setTimeout(() => { try { supabase.removeChannel(ch) } catch { /* ignore */ } }, 1500)
}
