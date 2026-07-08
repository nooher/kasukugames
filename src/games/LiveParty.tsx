import { useState, useEffect, useRef, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { RADIUS, MOTION } from '../lib/design'
import { sfxTap, sfxReveal, sfxCorrect, sfxLevelUp } from '../lib/sfx'
import { LiveRoom, LIVE_GAMES, type LivePlayer, type LiveMsg } from '../lib/liveRoom'

/* dark party palette (no gradients) */
const C = {
  bg: '#080c12', card: '#151d2b', card2: '#1b2536', border: '#243247',
  text: '#e8edf5', muted: '#8ea0b5', dim: '#4a5c72',
  green: '#22c55e', red: '#ef4444', amber: '#f59e0b', teal: '#14b8a6',
  blue: '#3b82f6', purple: '#a855f7', pink: '#ec4899', orange: '#f97316',
}
const SEAT_COLORS = [C.pink, C.blue, C.green, C.purple, C.orange, C.teal, C.amber, C.red]

type Screen = 'lobby' | 'menu' | 'spin' | 'tod' | 'nhie'
interface GState {
  screen: Screen
  turnIdx?: number
  // spin
  spinNonce?: number
  spinAngle?: number
  spinning?: boolean
  landedId?: string
  // truth or dare
  askerId?: string
  targetId?: string
  kind?: 'truth' | 'dare' | null
  prompt?: string | null
  // never have i ever
  nhiePrompt?: string
  nhieVotes?: Record<string, 'have' | 'never'>
  nhieRevealed?: boolean
}

const TRUTHS = [
  'What first made you fall for your partner?',
  'What is one thing you have never told me but always wanted to?',
  'What is your favourite memory of us?',
  'What is something small I do that you secretly love?',
  'If we could relive one day together, which would you pick?',
  'What is one dream you have for us in five years?',
  'What is the most attractive thing about me right now?',
  'When did you last think about me and smile?',
]
const DARES = [
  'Send a voice note saying what you love most about me.',
  'Do your best impression of me right now.',
  'Blow a kiss to the camera and hold eye contact for 10 seconds.',
  'Text me three emojis that describe how you feel about me.',
  'Sing one line of “our” song.',
  'Give the screen your most charming smile for 5 seconds.',
  'Describe our next date in one sentence — make it romantic.',
  'Say “I love you” in the most dramatic way you can.',
]
const NHIE = [
  'Never have I ever stalked your social media before we got together.',
  'Never have I ever fallen asleep on a call with you.',
  'Never have I ever re-read our old messages.',
  'Never have I ever been jealous over something small.',
  'Never have I ever pretended to like something just because you did.',
  'Never have I ever planned our future in my head.',
  'Never have I ever saved a photo of you as my favourite.',
  'Never have I ever missed you within an hour of saying bye.',
]
const REACTIONS = ['❤️', '😂', '🔥', '😮', '👏', '💋', '🥰', '😳']

const rid = () => Math.random().toString(36).slice(2)
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

interface Props {
  me: LivePlayer
  code: string
  isHost: boolean
  onExit: () => void
  initialGame?: string
}

export default function LiveParty({ me, code, isHost, onExit, initialGame }: Props) {
  const roomRef = useRef<LiveRoom | null>(null)
  const [players, setPlayers] = useState<LivePlayer[]>([])
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [g, setG] = useState<GState>({ screen: 'lobby' })
  const gRef = useRef(g); gRef.current = g
  const playersRef = useRef(players); playersRef.current = players
  const [floats, setFloats] = useState<{ id: string; emoji: string; x: number }[]>([])
  const [chat, setChat] = useState<{ id: string; from: string; name: string; text: string }[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatText, setChatText] = useState('')
  const [copied, setCopied] = useState(false)

  const nameOf = (id?: string) => playersRef.current.find(p => p.id === id)?.name || 'Someone'

  // ── authoritative state push (host only) ──
  const pushState = useCallback((next: GState) => {
    setG(next); gRef.current = next
    roomRef.current?.send('state', next)
  }, [])

  // ── connect ──
  useEffect(() => {
    const room = new LiveRoom(code, me, isHost)
    roomRef.current = room
    let prevCount = 0
    const offP = room.onPlayers(list => {
      setPlayers(list)
      if (list.length > prevCount && prevCount > 0) { try { navigator.vibrate?.(60) } catch { /* unsupported */ } }
      prevCount = list.length
      // host re-syncs authoritative state so late joiners catch up
      if (isHost) roomRef.current?.send('state', gRef.current)
    })
    const offS = room.onStatus(setStatus)
    const offM = room.onMessage((m: LiveMsg) => {
      if (m.from === me.id) return
      if (m.t === 'state' && !isHost) { setG(m.d); gRef.current = m.d }
      else if (m.t === 'act' && isHost) applyAction(m.from, m.d)
      else if (m.t === 'reaction') spawnFloat(m.d.emoji)
      else if (m.t === 'chat') setChat(c => [...c.slice(-40), { id: rid(), from: m.from, name: m.d.name, text: m.d.text }])
    })
    room.connect()
    return () => { offP(); offS(); offM(); room.leave() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── host: apply a guest action ──
  const applyAction = (from: string, d: any) => {
    const cur = gRef.current
    if (d.a === 'spin') doSpin()
    else if (d.a === 'toTod') startTod(cur.landedId || from)
    else if (d.a === 'kind') pushState({ ...cur, kind: d.kind, prompt: null })
    else if (d.a === 'prompt') pushState({ ...cur, prompt: d.text })
    else if (d.a === 'doneTurn') nextTurn()
    else if (d.a === 'vote') {
      const votes = { ...(cur.nhieVotes || {}), [from]: d.choice }
      pushState({ ...cur, nhieVotes: votes })
    }
    else if (d.a === 'reveal') pushState({ ...cur, nhieRevealed: true })
    else if (d.a === 'nextNhie') startNhie()
    else if (d.a === 'menu') pushState({ screen: 'menu' })
  }

  // ── host game flows (read the live roster via ref, so guest-triggered
  //    actions applied through the mount-time message handler stay correct) ──
  const ids = () => playersRef.current.map(p => p.id)
  const orderIds = ids() // for render-scope views
  const startMenu = () => pushState({ screen: 'menu' })

  const doSpin = () => {
    sfxTap()
    const order = ids()
    const n = order.length
    if (n === 0) return
    const targetIdx = Math.floor(Math.random() * n)
    const per = 360 / n
    const base = (gRef.current.spinAngle || 0)
    const angle = base + 360 * 5 + (360 - targetIdx * per)
    pushState({ screen: 'spin', spinNonce: (gRef.current.spinNonce || 0) + 1, spinAngle: angle, spinning: true, landedId: undefined })
    setTimeout(() => {
      sfxReveal()
      pushState({ ...gRef.current, spinning: false, landedId: ids()[targetIdx] })
    }, 3300)
  }

  const startTod = (targetId: string) => {
    const askerId = gRef.current.landedId && gRef.current.landedId !== targetId ? gRef.current.landedId : (me.id)
    pushState({ screen: 'tod', askerId: askerId, targetId, kind: null, prompt: null })
  }
  const nextTurn = () => {
    const cur = gRef.current
    const order = ids()
    const n = order.length
    const curAsker = cur.askerId ? order.indexOf(cur.askerId) : 0
    const nextAsker = (curAsker + 1) % Math.max(1, n)
    const nextTarget = n > 1 ? (nextAsker + 1) % n : nextAsker
    pushState({ screen: 'tod', askerId: order[nextAsker], targetId: order[nextTarget], kind: null, prompt: null })
  }
  const beginTod = () => {
    const order = ids()
    const n = order.length
    const askerIdx = Math.max(0, order.indexOf(me.id))
    const targetIdx = n > 1 ? (askerIdx + 1) % n : askerIdx
    pushState({ screen: 'tod', askerId: order[askerIdx], targetId: order[targetIdx], kind: null, prompt: null })
  }
  const startNhie = () => pushState({ screen: 'nhie', nhiePrompt: pick(NHIE), nhieVotes: {}, nhieRevealed: false })
  // Host taps Start — go straight into the challenged game, or the picker.
  const launchInitial = () => {
    if (initialGame === 'spin') pushState({ screen: 'spin', spinAngle: 0, spinning: false })
    else if (initialGame === 'tod') beginTod()
    else if (initialGame === 'nhie') startNhie()
    else startMenu()
  }

  // ── actions (host acts directly, guest sends) ──
  const act = (payload: any, hostFn: () => void) => { if (isHost) hostFn(); else roomRef.current?.send('act', payload) }

  const onSpin = () => act({ a: 'spin' }, doSpin)
  const onToTod = () => act({ a: 'toTod' }, () => startTod(gRef.current.landedId || me.id))
  const onPickKind = (kind: 'truth' | 'dare') => { sfxTap(); act({ a: 'kind', kind }, () => pushState({ ...gRef.current, kind, prompt: null })) }
  const onSendPrompt = (text: string) => { sfxCorrect(); act({ a: 'prompt', text }, () => pushState({ ...gRef.current, prompt: text })) }
  const onDoneTurn = () => { sfxLevelUp(); act({ a: 'doneTurn' }, nextTurn) }
  const onVote = (choice: 'have' | 'never') => {
    sfxTap()
    if (isHost) { const votes = { ...(gRef.current.nhieVotes || {}), [me.id]: choice }; pushState({ ...gRef.current, nhieVotes: votes }) }
    else roomRef.current?.send('act', { a: 'vote', choice })
  }
  const onReveal = () => { sfxReveal(); act({ a: 'reveal' }, () => pushState({ ...gRef.current, nhieRevealed: true })) }
  const onNextNhie = () => act({ a: 'nextNhie' }, startNhie)
  const onBackMenu = () => act({ a: 'menu' }, startMenu)

  // ── reactions + chat (peer broadcast) ──
  const spawnFloat = (emoji: string) => {
    const id = rid(); const x = 10 + Math.random() * 80
    setFloats(f => [...f, { id, emoji, x }])
    setTimeout(() => setFloats(f => f.filter(z => z.id !== id)), 2600)
  }
  const react = (emoji: string) => { spawnFloat(emoji); roomRef.current?.send('reaction', { emoji }) }
  const sendChat = () => {
    const text = chatText.trim(); if (!text) return
    setChat(c => [...c.slice(-40), { id: rid(), from: me.id, name: me.name, text }])
    roomRef.current?.send('chat', { name: me.name, text })
    setChatText('')
  }

  const inviteUrl = `https://games.kasuku.tz/play?room=${code}&live=1&from=${encodeURIComponent(me.name)}&u=${encodeURIComponent(me.handle)}`
  const share = async () => {
    const msg = `Join me for a LIVE game on KasukuGames! 🎮 Room ${code}\n${inviteUrl}`
    try {
      if (navigator.share) { await navigator.share({ title: 'KasukuGames Live', text: msg, url: inviteUrl }); return }
    } catch { /* fall through to copy */ }
    try { await navigator.clipboard.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Join me for a LIVE game on KasukuGames! 🎮\n${inviteUrl}`)}`, '_blank')

  const seatColor = (id: string) => SEAT_COLORS[Math.max(0, orderIds.indexOf(id)) % SEAT_COLORS.length]
  const Avatar = ({ p, size = 44 }: { p: LivePlayer; size?: number }) => (
    p.photoUrl
      ? <img src={p.photoUrl} alt={p.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${seatColor(p.id)}` }} />
      : <div style={{ width: size, height: size, borderRadius: '50%', background: seatColor(p.id) + '22', border: `2px solid ${seatColor(p.id)}`, display: 'grid', placeItems: 'center', fontSize: size * 0.5 }}>{p.avatar || '🎮'}</div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: C.bg, color: C.text, zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      {/* floating reactions */}
      {floats.map(f => (
        <div key={f.id} style={{ position: 'absolute', left: `${f.x}%`, bottom: 80, fontSize: 40, pointerEvents: 'none', animation: 'kgfloat 2.5s ease-out forwards', zIndex: 50 }}>{f.emoji}</div>
      ))}
      <style>{`@keyframes kgfloat{0%{opacity:0;transform:translateY(0) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translateY(-320px) scale(1.4)}}
        @keyframes kgpulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onExit} style={ghost}>← Exit</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1 }}>LIVE ROOM</div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 3 }}>{code}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: status === 'connected' ? C.green : C.amber }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'connected' ? C.green : C.amber, animation: status !== 'connected' ? 'kgpulse 1s infinite' : 'none' }} />
          {status === 'connected' ? `${players.length} online` : status === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column' }}>
        {g.screen === 'lobby' && (
          <Lobby players={players} me={me} isHost={isHost} onStart={launchInitial} onShare={share} onWhatsApp={shareWhatsApp} copied={copied} Avatar={Avatar} initialGame={initialGame} />
        )}
        {g.screen === 'menu' && (
          <Menu isHost={isHost} onSpin={() => act({ a: 'menu' }, doSpin)} onSpinStart={() => { if (isHost) pushState({ screen: 'spin', spinAngle: 0, spinning: false }) }} onTod={() => { if (isHost) beginTod() }} onNhie={() => { if (isHost) startNhie() }} />
        )}
        {g.screen === 'spin' && (
          <SpinView g={g} players={players} me={me} isHost={isHost} onSpin={onSpin} onToTod={onToTod} onBack={onBackMenu} seatColor={seatColor} Avatar={Avatar} nameOf={nameOf} />
        )}
        {g.screen === 'tod' && (
          <TodView g={g} me={me} isHost={isHost} nameOf={nameOf} onPickKind={onPickKind} onSendPrompt={onSendPrompt} onDone={onDoneTurn} onBack={onBackMenu} />
        )}
        {g.screen === 'nhie' && (
          <NhieView g={g} me={me} players={players} isHost={isHost} onVote={onVote} onReveal={onReveal} onNext={onNextNhie} onBack={onBackMenu} Avatar={Avatar} />
        )}
      </div>

      {/* reactions + chat bar */}
      <div style={{ borderTop: `1px solid ${C.border}`, background: C.card, padding: '8px 12px' }}>
        {chatOpen && (
          <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {chat.length === 0 && <div style={{ color: C.dim, fontSize: 12, textAlign: 'center' }}>Say something 💬</div>}
            {chat.map(m => <div key={m.id} style={{ fontSize: 13 }}><b style={{ color: m.from === me.id ? C.teal : C.pink }}>{m.name}:</b> {m.text}</div>)}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 4, flex: 1, overflowX: 'auto' }}>
            {REACTIONS.map(e => <button key={e} onClick={() => react(e)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: 2 }}>{e}</button>)}
          </div>
          <button onClick={() => setChatOpen(o => !o)} style={{ ...ghost, padding: '6px 10px' }}>{chatOpen ? '▾' : '💬'}</button>
        </div>
        {chatOpen && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input value={chatText} onChange={e => setChatText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Message…" style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, color: C.text, padding: '8px 12px', fontSize: 14, outline: 'none' }} />
            <button onClick={sendChat} style={solidBtn(C.teal)}>Send</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── sub-views ── */
function Lobby({ players, me, isHost, onStart, onShare, onWhatsApp, copied, Avatar, initialGame }: any) {
  const others = players.filter((p: LivePlayer) => p.id !== me.id)
  const gm = LIVE_GAMES.find(x => x.id === initialGame)
  const startLabel = gm && gm.id !== 'party' ? `Start ${gm.name} ${gm.emoji}` : 'Start playing →'
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 22 }}>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{isHost ? 'Your Live Room' : 'You joined!'}</div>
        <div style={{ color: C.muted, marginTop: 6 }}>{isHost ? 'Share the room, wait for them to join, then start.' : 'Waiting for the host to start the game…'}</div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {players.map((p: LivePlayer) => (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Avatar p={p} size={64} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.id === me.id ? 'You' : p.name}</div>
          </div>
        ))}
        {others.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.5 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: `2px dashed ${C.dim}`, display: 'grid', placeItems: 'center', animation: 'kgpulse 1.4s infinite' }}>⏳</div>
            <div style={{ fontSize: 12, color: C.muted }}>Waiting…</div>
          </div>
        )}
      </div>
      {isHost && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onShare} style={{ ...solidBtn(C.blue), flex: 1 }}>{copied ? 'Copied ✓' : 'Share link'}</button>
            <button onClick={onWhatsApp} style={{ ...solidBtn(C.green), flex: 1 }}>WhatsApp</button>
          </div>
          <button onClick={onStart} disabled={players.length < 2} style={{ ...solidBtn(players.length < 2 ? C.dim : C.pink), opacity: players.length < 2 ? 0.6 : 1, padding: '14px', fontSize: 16 }}>
            {players.length < 2 ? 'Waiting for a player…' : startLabel}
          </button>
        </div>
      )}
    </div>
  )
}

function Menu({ isHost, onSpinStart, onTod, onNhie }: any) {
  const items = [
    { key: 'spin', label: 'Spin the Bottle', emoji: '🍾', color: C.pink, fn: onSpinStart },
    { key: 'tod', label: 'Truth or Dare', emoji: '🎯', color: C.purple, fn: onTod },
    { key: 'nhie', label: 'Never Have I Ever', emoji: '🙈', color: C.teal, fn: onNhie },
  ]
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: C.muted, marginBottom: 4 }}>{isHost ? 'Pick a game — you both play it live' : 'Host is choosing a game…'}</div>
      {items.map(it => (
        <button key={it.key} onClick={() => isHost && it.fn()} disabled={!isHost} style={{ display: 'flex', alignItems: 'center', gap: 16, background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${it.color}`, borderRadius: RADIUS.lg, padding: '18px 20px', color: C.text, fontSize: 18, fontWeight: 700, cursor: isHost ? 'pointer' : 'default', opacity: isHost ? 1 : 0.6, textAlign: 'left', transition: `all ${MOTION.fast}` }}>
          <span style={{ fontSize: 30 }}>{it.emoji}</span> {it.label}
        </button>
      ))}
    </div>
  )
}

function SpinView({ g, players, me, isHost, onSpin, onToTod, onBack, seatColor, Avatar, nameOf }: any) {
  const n = players.length
  const R = 120
  const landed = g.landedId
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ position: 'relative', width: 300, height: 300 }}>
        {players.map((p: LivePlayer, i: number) => {
          const a = (i / n) * 2 * Math.PI - Math.PI / 2
          const x = 150 + R * Math.cos(a) - 26, y = 150 + R * Math.sin(a) - 26
          const isLanded = landed === p.id
          return (
            <div key={p.id} style={{ position: 'absolute', left: x, top: y, transform: isLanded ? 'scale(1.25)' : 'scale(1)', transition: 'transform .3s', filter: landed && !isLanded ? 'grayscale(.7) opacity(.5)' : 'none' }}>
              <Avatar p={p} size={52} />
              {isLanded && <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: seatColor(p.id) }}>{p.id === me.id ? 'YOU' : p.name}</div>}
            </div>
          )
        })}
        {/* bottle */}
        <div style={{ position: 'absolute', left: 150, top: 150, width: 0, height: 0, transform: `translate(-50%,-50%) rotate(${g.spinAngle || 0}deg)`, transition: g.spinning ? 'transform 3.2s cubic-bezier(.17,.67,.3,1)' : 'none' }}>
          <div style={{ position: 'absolute', left: -8, top: -96, width: 16, height: 96, background: C.amber, borderRadius: 8, boxShadow: `0 0 12px ${C.amber}` }} />
          <div style={{ position: 'absolute', left: -14, top: -14, width: 28, height: 28, borderRadius: '50%', background: C.card2, border: `2px solid ${C.amber}` }} />
        </div>
      </div>
      {landed ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>🍾 It landed on {landed === me.id ? 'you!' : nameOf(landed)}</div>
          {isHost ? <button onClick={onToTod} style={solidBtn(C.purple)}>Truth or Dare →</button> : <div style={{ color: C.muted }}>Host will continue…</div>}
        </div>
      ) : (
        <button onClick={onSpin} disabled={g.spinning} style={{ ...solidBtn(C.pink), padding: '14px 40px', fontSize: 18, opacity: g.spinning ? 0.6 : 1 }}>{g.spinning ? 'Spinning…' : 'SPIN 🍾'}</button>
      )}
    </div>
  )
}

function TodView({ g, me, isHost, nameOf, onPickKind, onSendPrompt, onDone, onBack }: any) {
  const [custom, setCustom] = useState('')
  const iAmAsker = g.askerId === me.id
  const iAmTarget = g.targetId === me.id
  const presets = g.kind === 'truth' ? TRUTHS : g.kind === 'dare' ? DARES : []
  useEffect(() => { setCustom('') }, [g.kind, g.askerId])
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: C.muted }}>{iAmAsker ? 'Your turn to ask' : `${nameOf(g.askerId)} is asking`}</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{iAmTarget ? '💌 It’s for YOU' : `For ${nameOf(g.targetId)}`}</div>
      </div>

      {!g.prompt && !g.kind && (
        iAmAsker ? (
          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            <button onClick={() => onPickKind('truth')} style={{ ...solidBtn(C.blue), flex: 1, padding: 20, fontSize: 18 }}>Truth 💭</button>
            <button onClick={() => onPickKind('dare')} style={{ ...solidBtn(C.pink), flex: 1, padding: 20, fontSize: 18 }}>Dare 🔥</button>
          </div>
        ) : <div style={{ textAlign: 'center', color: C.muted, marginTop: 20, animation: 'kgpulse 1.4s infinite' }}>Waiting for {nameOf(g.askerId)} to choose…</div>
      )}

      {!g.prompt && g.kind && iAmAsker && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, color: C.muted }}>Pick one for {nameOf(g.targetId)}, or write your own:</div>
          {presets.slice(0, 5).map((p: string, i: number) => (
            <button key={i} onClick={() => onSendPrompt(p)} style={{ textAlign: 'left', background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '12px 14px', color: C.text, fontSize: 14, cursor: 'pointer' }}>{p}</button>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input value={custom} onChange={e => setCustom(e.target.value)} placeholder={`Write your own ${g.kind}…`} style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, color: C.text, padding: '10px 12px', fontSize: 14, outline: 'none' }} />
            <button onClick={() => custom.trim() && onSendPrompt(custom.trim())} style={solidBtn(C.teal)}>Send</button>
          </div>
        </div>
      )}
      {!g.prompt && g.kind && !iAmAsker && (
        <div style={{ textAlign: 'center', color: C.muted, marginTop: 20, animation: 'kgpulse 1.4s infinite' }}>{nameOf(g.askerId)} is writing a {g.kind}…</div>
      )}

      {g.prompt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginTop: 10 }}>
          <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{g.kind}</div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: 24, fontSize: 20, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>{g.prompt}</div>
          {iAmTarget && <div style={{ color: C.pink, fontWeight: 700 }}>Your move 💫</div>}
          {(iAmTarget || iAmAsker || isHost) && (
            <button onClick={onDone} style={{ ...solidBtn(C.green), padding: '12px 32px' }}>Done ✓ — next turn</button>
          )}
        </div>
      )}
    </div>
  )
}

function NhieView({ g, me, players, isHost, onVote, onReveal, onNext, onBack, Avatar }: any) {
  const votes = g.nhieVotes || {}
  const myVote = votes[me.id]
  const allVoted = players.length > 0 && players.every((p: LivePlayer) => votes[p.id])
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: 22, fontSize: 20, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>{g.nhiePrompt}</div>

      {!g.nhieRevealed ? (
        <>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => onVote('have')} style={{ ...solidBtn(myVote === 'have' ? C.pink : C.card2), flex: 1, padding: 18, fontSize: 16, border: myVote === 'have' ? `2px solid ${C.pink}` : `1px solid ${C.border}` }}>I have 🙋</button>
            <button onClick={() => onVote('never')} style={{ ...solidBtn(myVote === 'never' ? C.blue : C.card2), flex: 1, padding: 18, fontSize: 16, border: myVote === 'never' ? `2px solid ${C.blue}` : `1px solid ${C.border}` }}>Never 🙅</button>
          </div>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(votes).length}/{players.length} answered</div>
          {isHost && <button onClick={onReveal} disabled={Object.keys(votes).length === 0} style={{ ...solidBtn(allVoted ? C.amber : C.dim), opacity: Object.keys(votes).length === 0 ? 0.5 : 1 }}>Reveal 👀</button>}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p: LivePlayer) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '10px 14px' }}>
                <Avatar p={p} size={36} />
                <div style={{ flex: 1, fontWeight: 600 }}>{p.id === me.id ? 'You' : p.name}</div>
                <div style={{ fontWeight: 700, color: votes[p.id] === 'have' ? C.pink : C.blue }}>{votes[p.id] === 'have' ? 'I have 🙋' : votes[p.id] === 'never' ? 'Never 🙅' : '—'}</div>
              </div>
            ))}
          </div>
          {isHost && <button onClick={onNext} style={solidBtn(C.teal)}>Next one →</button>}
          {!isHost && <div style={{ textAlign: 'center', color: C.muted }}>Host will bring the next one…</div>}
        </>
      )}
    </div>
  )
}

/* shared button styles */
const ghost: CSSProperties = { background: 'none', border: `1px solid ${C.border}`, borderRadius: RADIUS.md, color: C.muted, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }
function solidBtn(bg: string): CSSProperties {
  return { background: bg, border: 'none', borderRadius: RADIUS.md, color: '#fff', padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: `all ${MOTION.fast}` }
}
