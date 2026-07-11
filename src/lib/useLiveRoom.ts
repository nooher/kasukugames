import { useEffect, useRef, useState, useCallback } from 'react'
import { LiveRoom, type LivePlayer, type LiveMsg } from './liveRoom'

// ── Multiplayer SDK: useLiveRoom ─────────────────────────────────────────────
// Reusable real-time multiplayer for ANY game, extracted from the proven LiveParty
// implementation. The HOST holds authoritative state and broadcasts it; guests render
// it and send actions back. Presence gives the live roster and automatic host
// migration (the present player with the lowest id is host, so if the host drops the
// next player takes over). Games only supply a reducer that maps (state, action) →
// state; the transport, migration, and re-sync are handled here.
//
//   const room = useLiveRoom<MyState>({
//     code, me, isHost, initialState,
//     reducer: (state, action, fromId) => nextState,   // host-side only
//   })
//   room.players / room.status / room.isHost / room.state
//   room.act({ type: 'move', ... })   // guest → host (host applies locally)
//   room.setState(next)               // host only: set + broadcast authoritative state
//   room.react('🎉') / room.leave()
//
// See src/games/LiveParty.tsx for the reference implementation this generalizes.

export type RoomStatus = 'connecting' | 'connected' | 'error'

export interface UseLiveRoomOpts<S> {
  code: string
  me: LivePlayer
  isHost: boolean
  initialState: S
  /** Host-side reducer: apply a guest (or local) action to authoritative state. */
  reducer?: (state: S, action: any, fromId: string) => S
  /** Optional side-channel handlers for non-state messages. */
  onReaction?: (emoji: string, fromId: string) => void
  onChat?: (msg: { name: string; text: string; fromId: string }) => void
}

export interface LiveRoomApi<S> {
  players: LivePlayer[]
  status: RoomStatus
  isHost: boolean
  state: S
  /** Host only: replace authoritative state and broadcast it. No-op for guests. */
  setState: (next: S | ((prev: S) => S)) => void
  /** Send an action toward the host. If you ARE the host it applies immediately. */
  act: (action: any) => void
  react: (emoji: string) => void
  chat: (name: string, text: string) => void
  /** Raw broadcast escape hatch. */
  send: (t: string, d?: any) => void
  leave: () => void
}

export function useLiveRoom<S>(opts: UseLiveRoomOpts<S>): LiveRoomApi<S> {
  const { code, me, isHost, initialState, reducer, onReaction, onChat } = opts

  const roomRef = useRef<LiveRoom | null>(null)
  const [players, setPlayers] = useState<LivePlayer[]>([])
  const [status, setStatus] = useState<RoomStatus>('connecting')
  const [state, setStateRaw] = useState<S>(initialState)

  // Refs so the message handlers (bound once) always see current values.
  const stateRef = useRef<S>(state); stateRef.current = state
  const playersRef = useRef<LivePlayer[]>(players); playersRef.current = players
  const reducerRef = useRef(reducer); reducerRef.current = reducer
  const onReactionRef = useRef(onReaction); onReactionRef.current = onReaction
  const onChatRef = useRef(onChat); onChatRef.current = onChat

  // Host is COMPUTED (migration): the present player with the lowest id. Falls back to
  // the initial isHost prop before the first presence sync.
  const amHost = players.length ? players[0].id === me.id : isHost
  const amHostRef = useRef(amHost); amHostRef.current = amHost

  // Host-authoritative setState: update locally + broadcast. Guests are ignored.
  const setState = useCallback((next: S | ((prev: S) => S)) => {
    if (!amHostRef.current) return
    const value = typeof next === 'function' ? (next as (p: S) => S)(stateRef.current) : next
    stateRef.current = value
    setStateRaw(value)
    roomRef.current?.send('state', value)
  }, [])

  const act = useCallback((action: any) => {
    if (amHostRef.current) {
      // I'm the host — apply directly.
      const r = reducerRef.current
      if (r) setState(r(stateRef.current, action, me.id))
    } else {
      roomRef.current?.send('act', action)
    }
  }, [me.id, setState])

  const react = useCallback((emoji: string) => { roomRef.current?.send('reaction', { emoji }) }, [])
  const chat = useCallback((name: string, text: string) => { roomRef.current?.send('chat', { name, text }) }, [])
  const send = useCallback((t: string, d?: any) => { roomRef.current?.send(t, d) }, [])
  const leave = useCallback(() => { roomRef.current?.leave() }, [])

  useEffect(() => {
    const room = new LiveRoom(code, me, isHost)
    roomRef.current = room

    const offP = room.onPlayers(list => {
      setPlayers(list)
      // Whoever is currently host re-broadcasts authoritative state so joiners (and a
      // freshly-promoted host after migration) stay caught up.
      if (amHostRef.current) room.send('state', stateRef.current)
    })
    const offS = room.onStatus(setStatus)
    const offM = room.onMessage((m: LiveMsg) => {
      if (m.from === me.id) return
      if (m.t === 'state' && !amHostRef.current) {
        stateRef.current = m.d as S
        setStateRaw(m.d as S)
      } else if (m.t === 'act' && amHostRef.current) {
        const r = reducerRef.current
        if (r) {
          const next = r(stateRef.current, m.d, m.from)
          stateRef.current = next
          setStateRaw(next)
          room.send('state', next)
        }
      } else if (m.t === 'reaction') {
        onReactionRef.current?.(m.d?.emoji, m.from)
      } else if (m.t === 'chat') {
        onChatRef.current?.({ name: m.d?.name, text: m.d?.text, fromId: m.from })
      }
    })

    room.connect()
    return () => { offP(); offS(); offM(); room.leave() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  return { players, status, isHost: amHost, state, setState, act, react, chat, send, leave }
}
