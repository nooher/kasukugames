import { useCallback, useState } from 'react'
import type { CSSProperties } from 'react'
import { RADIUS } from '../lib/design'
import { useEffect } from 'react'
import { useLiveRoom } from '../lib/useLiveRoom'
import { rememberRoom } from '../lib/liveRooms'
import type { LivePlayer } from '../lib/liveRoom'

// ── Generic "how well do you know each other" LIVE game ──────────────────────
// The reusable two-device engine behind CouplesQuizLive and GuessWhatLive, built on
// the multiplayer SDK (useLiveRoom). Each round one partner is the "subject": they
// secretly answer a question about themselves on their device; the other guesses on
// theirs; the answer is revealed and scored. Games only supply their title, categories
// and question bank — all networking, host migration, turns and scoring live here.

const C = {
  bg: '#080c12', card: '#151d2b', border: '#1c2940',
  text: '#e8edf5', muted: '#8494a7', dim: '#4a5d75',
  rose: '#f43f5e', emerald: '#10b981', gold: '#f5c451', amber: '#f59e0b',
}
const TOTAL_ROUNDS = 10

export interface QuizItem {
  /** Stable key for de-duplication (e.g. the raw template/question text). */
  key: string
  options: string[]
  /** Render the question text given the subject's first name (games that don't
   *  reference the name just ignore it). */
  text: (subjectFirstName: string) => string
}
export interface QuizCategory { key: string; label: string; color: string; desc: string }

export interface LiveKnowYouProps {
  me: LivePlayer
  code: string
  isHost: boolean
  onExit: () => void
  title: string
  accent?: string
  gameId?: string
  categories: QuizCategory[]
  bank: Record<string, QuizItem[]>
}

type Phase = 'lobby' | 'category' | 'answering' | 'guessing' | 'reveal' | 'results'
interface QState {
  phase: Phase
  categoryKey: string | 'mix' | null
  round: number
  subjectId: string | null
  question: { text: string; options: string[]; categoryLabel: string } | null
  answer: number | null
  guess: number | null
  scores: Record<string, number>
  used: string[]
}
const INITIAL: QState = {
  phase: 'lobby', categoryKey: null, round: 0, subjectId: null,
  question: null, answer: null, guess: null, scores: {}, used: [],
}

const firstName = (n: string) => (n || 'Partner').split(' ')[0]

export default function LiveKnowYouGame({ me, code, isHost, onExit, title, accent = '#f43f5e', gameId, categories, bank }: LiveKnowYouProps) {
  const [copied, setCopied] = useState(false)
  const inviteUrl = `https://games.kasuku.tz/play?room=${code}&live=1${gameId ? `&g=${gameId}` : ''}`
  const shareInvite = async () => {
    const text = `Join me for a live ${title} on KasukuGames! 💞\n${inviteUrl}`
    try {
      if (navigator.share) { await navigator.share({ title: `${title} — live`, text, url: inviteUrl }); return }
    } catch { /* fall through to copy */ }
    try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }
  const catKeys = categories.map(c => c.key)
  const labelOf = (key: string) => categories.find(c => c.key === key)?.label || key

  const pickQuestion = (cat: string | 'mix', used: string[]) => {
    const key = cat === 'mix' ? catKeys[Math.floor(Math.random() * catKeys.length)] : cat
    const items = bank[key] || []
    const pool = items.filter(q => !used.includes(q.key))
    const list = pool.length ? pool : items
    const item = list[Math.floor(Math.random() * list.length)]
    return { item, categoryKey: key, categoryLabel: labelOf(key) }
  }

  const reducer = useCallback((s: QState, action: any, from: string): QState => {
    switch (action?.type) {
      case 'answer':
        if (s.phase !== 'answering' || from !== s.subjectId) return s
        return { ...s, answer: action.option, phase: 'guessing' }
      case 'guess': {
        if (s.phase !== 'guessing' || from === s.subjectId) return s
        const correct = action.option === s.answer
        const scores = correct ? { ...s.scores, [from]: (s.scores[from] ?? 0) + 1 } : s.scores
        return { ...s, guess: action.option, scores, phase: 'reveal' }
      }
      default:
        return s
    }
  }, [])

  const room = useLiveRoom<QState>({ code, me, isHost, initialState: INITIAL, reducer })
  const { players, status, state, isHost: amHost } = room

  const pair = players.slice(0, 2)
  const other = pair.find(p => p.id !== me.id) || null
  const nameOf = (id: string | null) => players.find(p => p.id === id)?.name || 'Partner'

  // Remember this room so an accidental exit / refresh can be recovered from
  // "Your live rooms" while a partner is still in.
  useEffect(() => {
    rememberRoom({ code, isHost: amHost, game: gameId, gameName: title, withName: other?.name })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, players.length])

  const beginRound = (roundIdx: number, cat: string | 'mix', prevUsed: string[], prevScores: Record<string, number>) => {
    const subjectId = pair.length === 2 ? pair[roundIdx % 2].id : me.id
    const subjectFirstName = firstName(nameOf(subjectId))
    const { item, categoryLabel } = pickQuestion(cat, prevUsed)
    room.setState({
      phase: 'answering', categoryKey: cat, round: roundIdx, subjectId,
      question: { text: item.text(subjectFirstName), options: item.options, categoryLabel },
      answer: null, guess: null, scores: prevScores, used: [...prevUsed, item.key],
    })
  }
  const start = (cat: string | 'mix') => beginRound(0, cat, [], Object.fromEntries(pair.map(p => [p.id, 0])))
  const next = () => {
    if (state.round + 1 >= TOTAL_ROUNDS) { room.setState({ ...state, phase: 'results' }); return }
    beginRound(state.round + 1, state.categoryKey || 'mix', state.used, state.scores)
  }
  const playAgain = () => room.setState(INITIAL)

  const btn = (bg: string, extra?: CSSProperties): CSSProperties => ({ background: bg, border: 'none', borderRadius: RADIUS.md, color: '#fff', padding: '13px 18px', fontSize: 15, fontWeight: 700, cursor: 'pointer', ...extra })
  const wrap: CSSProperties = { position: 'fixed', inset: 0, background: C.bg, color: C.text, zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }

  const iAmSubject = state.subjectId === me.id
  const subjectName = firstName(nameOf(state.subjectId))
  const q = state.question

  const Card = ({ children }: { children: any }) => (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560, width: '100%', margin: '0 auto' }}>{children}</div>
  )
  const Waiting = ({ who, what }: { who: string; what: string }) => (
    <div style={{ margin: 'auto', textAlign: 'center', color: C.muted }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{who}</div>
      <div style={{ fontSize: 14, marginTop: 4 }}>{what}</div>
    </div>
  )

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => { room.leave(); onExit() }} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: RADIUS.md, color: C.muted, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>← Exit</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1 }}>{title.toUpperCase()} · LIVE</div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 3 }}>{code}</div>
        </div>
        <div style={{ fontSize: 12, color: status === 'connected' ? C.emerald : C.amber }}>
          {status === 'connected' ? `${players.length} online` : status === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
        </div>
      </div>

      {state.phase !== 'lobby' && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '8px 12px', borderBottom: `1px solid ${C.border}`, background: C.card }}>
          {pair.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 12px', borderRadius: 999, background: C.bg, border: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{p.id === me.id ? 'You' : firstName(p.name)}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: C.gold }}>{state.scores[p.id] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {state.phase === 'lobby' && (
        <Card>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <div style={{ fontSize: 44 }}>💞</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{amHost ? `Your ${title} Room` : 'You joined!'}</div>
            <div style={{ color: C.muted, marginTop: 6, fontSize: 14 }}>Two devices — how well do you really know each other?</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {players.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: '12px 16px' }}>
                <span style={{ fontSize: 22 }}>{p.avatar || '🙂'}</span>
                <span style={{ fontWeight: 700 }}>{p.id === me.id ? `${p.name} (you)` : p.name}</span>
              </div>
            ))}
          </div>
          <button onClick={shareInvite} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, color: C.text, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
            {copied ? '✓ Link copied' : '🔗 Invite your partner (share link)'}
          </button>
          {amHost ? (
            players.length < 2
              ? <div style={{ textAlign: 'center', color: C.muted, marginTop: 4 }}>Waiting for your partner to join…</div>
              : <button onClick={() => room.setState({ ...INITIAL, phase: 'category' })} style={{ ...btn(accent), marginTop: 4 }}>Choose a category →</button>
          ) : (
            <div style={{ textAlign: 'center', color: C.muted, marginTop: 4 }}>Waiting for the host to start…</div>
          )}
        </Card>
      )}

      {state.phase === 'category' && (
        <Card>
          <div style={{ fontSize: 20, fontWeight: 800, textAlign: 'center' }}>Pick a category</div>
          {!amHost && <div style={{ textAlign: 'center', color: C.muted }}>Host is choosing…</div>}
          {amHost && (
            <>
              <button onClick={() => start('mix')} style={{ ...btn(accent), textAlign: 'left' }}>🎲 Random Mix<div style={{ fontSize: 12, fontWeight: 500, opacity: 0.85 }}>Questions from every category</div></button>
              {categories.map(cat => (
                <button key={cat.key} onClick={() => start(cat.key)} style={{ background: C.card, border: `1px solid ${cat.color}55`, borderRadius: RADIUS.lg, padding: '14px 16px', color: C.text, textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700, color: cat.color }}>{cat.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{cat.desc}</div>
                </button>
              ))}
            </>
          )}
        </Card>
      )}

      {state.phase === 'answering' && q && (
        <Card>
          <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, letterSpacing: 1 }}>ROUND {state.round + 1}/{TOTAL_ROUNDS} · {q.categoryLabel.toUpperCase()}</div>
          {iAmSubject ? (
            <>
              <div style={{ fontSize: 13, color: accent, textAlign: 'center', fontWeight: 700 }}>About you — answer honestly (secret)</div>
              <div style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', margin: '6px 0 10px' }}>{q.text}</div>
              {q.options.map((o, i) => (
                <button key={i} onClick={() => room.act({ type: 'answer', option: i })} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: '14px 16px', color: C.text, textAlign: 'left', cursor: 'pointer', fontSize: 15 }}>{o}</button>
              ))}
            </>
          ) : (
            <Waiting who={`${subjectName} is answering…`} what="They're picking their honest answer. You'll guess next." />
          )}
        </Card>
      )}

      {state.phase === 'guessing' && q && (
        <Card>
          <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, letterSpacing: 1 }}>ROUND {state.round + 1}/{TOTAL_ROUNDS} · {q.categoryLabel.toUpperCase()}</div>
          {!iAmSubject ? (
            <>
              <div style={{ fontSize: 13, color: C.gold, textAlign: 'center', fontWeight: 700 }}>What did {subjectName} pick?</div>
              <div style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', margin: '6px 0 10px' }}>{q.text}</div>
              {q.options.map((o, i) => (
                <button key={i} onClick={() => room.act({ type: 'guess', option: i })} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: '14px 16px', color: C.text, textAlign: 'left', cursor: 'pointer', fontSize: 15 }}>{o}</button>
              ))}
            </>
          ) : (
            <Waiting who={`${firstName(nameOf(other?.id ?? null))} is guessing…`} what="They're trying to guess what you picked." />
          )}
        </Card>
      )}

      {state.phase === 'reveal' && q && (
        <Card>
          {(() => {
            const correct = state.guess === state.answer
            return (
              <>
                <div style={{ textAlign: 'center', fontSize: 40 }}>{correct ? '✅' : '❌'}</div>
                <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: correct ? C.emerald : C.rose }}>{correct ? 'Nailed it!' : 'Not quite'}</div>
                <div style={{ fontSize: 17, fontWeight: 700, textAlign: 'center', margin: '4px 0 8px' }}>{q.text}</div>
                {q.options.map((o, i) => {
                  const isAnswer = i === state.answer
                  const isGuess = i === state.guess
                  return (
                    <div key={i} style={{ borderRadius: RADIUS.lg, padding: '12px 16px', fontSize: 15, background: isAnswer ? C.emerald + '22' : C.card, border: `1px solid ${isAnswer ? C.emerald : isGuess ? C.rose : C.border}`, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span>{o}</span>
                      <span style={{ fontSize: 12, color: C.muted }}>{isAnswer ? `${subjectName}'s answer` : isGuess ? 'guessed' : ''}</span>
                    </div>
                  )
                })}
                {amHost
                  ? <button onClick={next} style={{ ...btn(accent), marginTop: 8 }}>{state.round + 1 >= TOTAL_ROUNDS ? 'See results →' : 'Next round →'}</button>
                  : <div style={{ textAlign: 'center', color: C.muted, marginTop: 8 }}>Waiting for {firstName(nameOf(state.subjectId === me.id ? (other?.id ?? null) : state.subjectId))}…</div>}
              </>
            )
          })()}
        </Card>
      )}

      {state.phase === 'results' && (
        <Card>
          {(() => {
            const ranked = [...pair].map(p => ({ p, s: state.scores[p.id] ?? 0 })).sort((a, b) => b.s - a.s)
            const tie = ranked.length === 2 && ranked[0].s === ranked[1].s
            return (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <div style={{ fontSize: 46 }}>{tie ? '🤝' : '🏆'}</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>{tie ? "It's a tie!" : `${ranked[0].p.id === me.id ? 'You' : firstName(ranked[0].p.name)} know each other best`}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                  {ranked.map(({ p, s }, i) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${i === 0 && !tie ? C.gold : C.border}`, borderRadius: RADIUS.lg, padding: '12px 16px' }}>
                      <span style={{ fontSize: 20 }}>{p.avatar || '🙂'}</span>
                      <span style={{ flex: 1, textAlign: 'left', fontWeight: 700 }}>{p.id === me.id ? `${p.name} (you)` : p.name}</span>
                      <span style={{ fontWeight: 800, color: C.gold }}>{s}/{TOTAL_ROUNDS}</span>
                    </div>
                  ))}
                </div>
                {amHost
                  ? <button onClick={playAgain} style={{ ...btn(accent), marginTop: 16, width: '100%' }}>Play again</button>
                  : <div style={{ color: C.muted, marginTop: 16 }}>Waiting for host…</div>}
                <button onClick={() => { room.leave(); onExit() }} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, borderRadius: RADIUS.md, padding: '11px', width: '100%', marginTop: 10, cursor: 'pointer' }}>Exit</button>
              </div>
            )
          })()}
        </Card>
      )}
    </div>
  )
}
