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

type Screen = 'lobby' | 'menu' | 'spin' | 'tod' | 'nhie' | 'choice' | 'trivia' | 'mlt' | 'rps'
interface GState {
  screen: Screen
  turnIdx?: number
  // shared competitive scoreboard (playerId -> points)
  scores?: Record<string, number>
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
  // would-you-rather / this-or-that (shared A/B vote)
  choiceKind?: 'wyr' | 'tot'
  choicePrompt?: { a: string; b: string }
  choiceVotes?: Record<string, 'a' | 'b'>
  choiceRevealed?: boolean
  // trivia duel
  triviaCat?: string
  triviaRound?: number
  triviaQ?: { q: string; options: string[]; answer: number; cat: string }
  triviaVotes?: Record<string, number>
  triviaRevealed?: boolean
  // most likely to
  mltPrompt?: string
  mltVotes?: Record<string, string>
  mltRevealed?: boolean
  // rock paper scissors
  rpsPicks?: Record<string, 'r' | 'p' | 's'>
  rpsRevealed?: boolean
  rpsWins?: Record<string, number>
  rpsRound?: number
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
const WYR = [
  { a: 'Travel the world together', b: 'Build a dream home together' },
  { a: 'A quiet night in', b: 'A wild night out' },
  { a: 'Forehead kisses', b: 'Long hugs' },
  { a: 'Text all day', b: 'One long call at night' },
  { a: 'Breakfast in bed', b: 'A midnight snack run' },
  { a: 'Cook together', b: 'Order in and chill' },
  { a: 'Slow dancing', b: 'Singing in the car' },
  { a: 'Surprise gifts', b: 'Handwritten notes' },
  { a: 'Rewatch a favourite', b: 'Try something new' },
  { a: 'Sunrise together', b: 'Sunset together' },
]
const TOT = [
  { a: 'Coffee', b: 'Tea' }, { a: 'Beach', b: 'Mountains' }, { a: 'Morning', b: 'Night' },
  { a: 'Sweet', b: 'Savoury' }, { a: 'Call', b: 'Text' }, { a: 'City', b: 'Village' },
  { a: 'Cats', b: 'Dogs' }, { a: 'Movies', b: 'Music' }, { a: 'Summer', b: 'Rainy season' },
  { a: 'Plan ahead', b: 'Go with the flow' }, { a: 'Save', b: 'Spend' }, { a: 'Spicy', b: 'Mild' },
]

interface TriviaQ { q: string; options: string[]; answer: number; cat: string }
const TRIVIA: TriviaQ[] = [
  // Tanzania / Africa
  { cat: 'Tanzania', q: 'What is the highest mountain in Africa?', options: ['Mt Kenya', 'Mt Kilimanjaro', 'Mt Meru', 'Rwenzori'], answer: 1 },
  { cat: 'Tanzania', q: 'What is the capital city of Tanzania?', options: ['Dar es Salaam', 'Arusha', 'Dodoma', 'Mwanza'], answer: 2 },
  { cat: 'Tanzania', q: 'Which lake is the largest in Africa?', options: ['Lake Tanganyika', 'Lake Malawi', 'Lake Victoria', 'Lake Nyasa'], answer: 2 },
  { cat: 'Tanzania', q: 'Zanzibar is famous for producing which spice?', options: ['Cinnamon', 'Cloves', 'Pepper', 'Ginger'], answer: 1 },
  { cat: 'Tanzania', q: 'The Serengeti is famous for which annual event?', options: ['The Great Migration', 'The Rift Eruption', 'The Long Rain', 'The Salt Harvest'], answer: 0 },
  { cat: 'Tanzania', q: 'What is the national language of Tanzania?', options: ['English', 'Swahili', 'Chagga', 'Sukuma'], answer: 1 },
  { cat: 'Africa', q: 'Which river is the longest in the world?', options: ['Congo', 'Zambezi', 'Nile', 'Niger'], answer: 2 },
  { cat: 'Africa', q: 'How many countries are in Africa?', options: ['48', '54', '60', '45'], answer: 1 },
  // General
  { cat: 'General', q: 'How many continents are there?', options: ['5', '6', '7', '8'], answer: 2 },
  { cat: 'General', q: 'What is the largest planet in our solar system?', options: ['Saturn', 'Jupiter', 'Neptune', 'Earth'], answer: 1 },
  { cat: 'General', q: 'How many colours are in a rainbow?', options: ['5', '6', '7', '8'], answer: 2 },
  { cat: 'General', q: 'What is the smallest prime number?', options: ['0', '1', '2', '3'], answer: 2 },
  { cat: 'General', q: 'How many sides does a hexagon have?', options: ['5', '6', '7', '8'], answer: 1 },
  { cat: 'General', q: 'What is the currency of Tanzania?', options: ['Shilling', 'Franc', 'Naira', 'Cedi'], answer: 0 },
  // Science
  { cat: 'Science', q: 'What gas do plants absorb from the air?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], answer: 2 },
  { cat: 'Science', q: 'How many bones are in the adult human body?', options: ['206', '201', '212', '198'], answer: 0 },
  { cat: 'Science', q: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], answer: 2 },
  { cat: 'Science', q: 'What organ pumps blood through the body?', options: ['Liver', 'Heart', 'Lungs', 'Kidney'], answer: 1 },
  { cat: 'Science', q: 'What is the speed of light (approx)?', options: ['300,000 km/s', '30,000 km/s', '3,000 km/s', '3 million km/s'], answer: 0 },
  // Faith
  { cat: 'Faith', q: 'How many books are in the Christian New Testament?', options: ['27', '39', '66', '24'], answer: 0 },
  { cat: 'Faith', q: 'How many surahs are in the Quran?', options: ['99', '114', '120', '110'], answer: 1 },
  { cat: 'Faith', q: 'What is the first month of the Islamic calendar?', options: ['Ramadan', 'Muharram', 'Shawwal', 'Rajab'], answer: 1 },
  { cat: 'Faith', q: 'In the Bible, who built the ark?', options: ['Moses', 'Abraham', 'Noah', 'David'], answer: 2 },
  // Sport & Culture
  { cat: 'Sport', q: 'How many players are on a football (soccer) team on the pitch?', options: ['9', '10', '11', '12'], answer: 2 },
  { cat: 'Sport', q: 'How often are the Summer Olympics held?', options: ['Every 2 years', 'Every 3 years', 'Every 4 years', 'Every 5 years'], answer: 2 },
  { cat: 'Sport', q: 'Which country has won the most FIFA World Cups?', options: ['Germany', 'Brazil', 'Argentina', 'Italy'], answer: 1 },
  { cat: 'Culture', q: '"Hakuna Matata" means what?', options: ['Good morning', 'No worries', 'Thank you', 'Welcome'], answer: 1 },
  { cat: 'Culture', q: 'What does "Asante" mean in Swahili?', options: ['Hello', 'Please', 'Thank you', 'Goodbye'], answer: 2 },
]
const MLT = [
  'become famous one day',
  'send a text to the wrong person',
  'cry during a movie',
  'forget an anniversary',
  'become a millionaire',
  'sleep through an alarm',
  'start a business',
  'sing loudly in the shower',
  'travel the world',
  'win an argument every time',
  'eat the last slice of food',
  'get lost with GPS on',
  'laugh at the wrong moment',
  'plan the perfect surprise',
  'stay calm in a crisis',
  'adopt ten pets',
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
    else if (d.a === 'choicevote') {
      const votes = { ...(cur.choiceVotes || {}), [from]: d.choice }
      pushState({ ...cur, choiceVotes: votes })
    }
    else if (d.a === 'choicereveal') pushState({ ...cur, choiceRevealed: true })
    else if (d.a === 'nextChoice') startChoice(cur.choiceKind || 'wyr')
    else if (d.a === 'tvote') pushState({ ...cur, triviaVotes: { ...(cur.triviaVotes || {}), [from]: d.choice } })
    else if (d.a === 'treveal') revealTrivia()
    else if (d.a === 'tnext') nextTrivia()
    else if (d.a === 'mvote') pushState({ ...cur, mltVotes: { ...(cur.mltVotes || {}), [from]: d.target } })
    else if (d.a === 'mreveal') revealMlt()
    else if (d.a === 'mnext') nextMlt()
    else if (d.a === 'rpick') pushState({ ...cur, rpsPicks: { ...(cur.rpsPicks || {}), [from]: d.choice } })
    else if (d.a === 'rreveal') revealRps()
    else if (d.a === 'rnext') nextRps()
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
  const startChoice = (kind: 'wyr' | 'tot') => pushState({ screen: 'choice', choiceKind: kind, choicePrompt: pick(kind === 'wyr' ? WYR : TOT), choiceVotes: {}, choiceRevealed: false })

  // ── shared scoreboard ──
  const keepScores = () => gRef.current.scores || {}

  // ── Trivia Duel ──
  const pickTrivia = (cat: string, avoid?: string): TriviaQ => {
    const pool = cat === 'Mixed' ? TRIVIA : TRIVIA.filter(q => q.cat === cat)
    const base = pool.filter(q => q.q !== avoid)
    const src = base.length ? base : pool
    const picked = src[Math.floor(Math.random() * src.length)]
    const order = picked.options.map((o, i) => ({ o, i })).sort(() => Math.random() - 0.5)
    return { q: picked.q, options: order.map(x => x.o), answer: order.findIndex(x => x.i === picked.answer), cat: picked.cat }
  }
  const startTrivia = (cat: string) => pushState({ screen: 'trivia', triviaCat: cat, triviaRound: 1, triviaQ: pickTrivia(cat), triviaVotes: {}, triviaRevealed: false, scores: keepScores() })
  const revealTrivia = () => {
    const cur = gRef.current; const q = cur.triviaQ; if (!q) return
    const s = { ...(cur.scores || {}) }
    for (const [pid, choice] of Object.entries(cur.triviaVotes || {})) if (choice === q.answer) s[pid] = (s[pid] || 0) + 10
    pushState({ ...cur, triviaRevealed: true, scores: s })
  }
  const nextTrivia = () => { const cur = gRef.current; pushState({ ...cur, triviaRound: (cur.triviaRound || 1) + 1, triviaQ: pickTrivia(cur.triviaCat || 'Mixed', cur.triviaQ?.q), triviaVotes: {}, triviaRevealed: false }) }

  // ── Most Likely To ──
  const startMlt = () => pushState({ screen: 'mlt', mltPrompt: pick(MLT), mltVotes: {}, mltRevealed: false, scores: keepScores() })
  const revealMlt = () => {
    const cur = gRef.current; const tally: Record<string, number> = {}
    for (const t of Object.values(cur.mltVotes || {})) tally[t] = (tally[t] || 0) + 1
    let top = ''; let max = 0
    for (const [id, n] of Object.entries(tally)) if (n > max) { max = n; top = id }
    const s = { ...(cur.scores || {}) }; if (top) s[top] = (s[top] || 0) + 5
    pushState({ ...cur, mltRevealed: true, scores: s })
  }
  const nextMlt = () => pushState({ ...gRef.current, mltPrompt: pick(MLT), mltVotes: {}, mltRevealed: false })

  // ── Rock Paper Scissors ──
  const RPS_BEATS: Record<string, string> = { r: 's', p: 'r', s: 'p' }
  const startRps = () => pushState({ screen: 'rps', rpsPicks: {}, rpsRevealed: false, rpsWins: {}, rpsRound: 1, scores: keepScores() })
  const revealRps = () => {
    const cur = gRef.current; const order = ids(); const picks = cur.rpsPicks || {}
    const wins: Record<string, number> = {}
    for (const a of order) for (const b of order) if (a !== b && picks[a] && picks[b] && RPS_BEATS[picks[a]] === picks[b]) wins[a] = (wins[a] || 0) + 1
    let max = -1; for (const id of order) max = Math.max(max, wins[id] || 0)
    const winners = order.filter(id => (wins[id] || 0) === max && max > 0)
    const rw = { ...(cur.rpsWins || {}) }; const s = { ...(cur.scores || {}) }
    if (winners.length === 1) { rw[winners[0]] = (rw[winners[0]] || 0) + 1; s[winners[0]] = (s[winners[0]] || 0) + 5 }
    pushState({ ...cur, rpsRevealed: true, rpsWins: rw, scores: s })
  }
  const nextRps = () => pushState({ ...gRef.current, rpsPicks: {}, rpsRevealed: false, rpsRound: (gRef.current.rpsRound || 1) + 1 })

  // Host taps Start — go straight into the challenged game, or the picker.
  const launchInitial = () => {
    if (initialGame === 'spin') pushState({ screen: 'spin', spinAngle: 0, spinning: false })
    else if (initialGame === 'tod') beginTod()
    else if (initialGame === 'nhie') startNhie()
    else if (initialGame === 'wyr') startChoice('wyr')
    else if (initialGame === 'tot') startChoice('tot')
    else if (initialGame === 'trivia') startTrivia('Mixed')
    else if (initialGame === 'mlt') startMlt()
    else if (initialGame === 'rps') startRps()
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
  const onChoiceVote = (choice: 'a' | 'b') => {
    sfxTap()
    if (isHost) { const votes = { ...(gRef.current.choiceVotes || {}), [me.id]: choice }; pushState({ ...gRef.current, choiceVotes: votes }) }
    else roomRef.current?.send('act', { a: 'choicevote', choice })
  }
  const onChoiceReveal = () => { sfxReveal(); act({ a: 'choicereveal' }, () => pushState({ ...gRef.current, choiceRevealed: true })) }
  const onChoiceNext = () => act({ a: 'nextChoice' }, () => startChoice(gRef.current.choiceKind || 'wyr'))
  const onTriviaVote = (choice: number) => { sfxTap(); if (isHost) pushState({ ...gRef.current, triviaVotes: { ...(gRef.current.triviaVotes || {}), [me.id]: choice } }); else roomRef.current?.send('act', { a: 'tvote', choice }) }
  const onTriviaReveal = () => { sfxReveal(); act({ a: 'treveal' }, revealTrivia) }
  const onTriviaNext = () => act({ a: 'tnext' }, nextTrivia)
  const onMltVote = (target: string) => { sfxTap(); if (isHost) pushState({ ...gRef.current, mltVotes: { ...(gRef.current.mltVotes || {}), [me.id]: target } }); else roomRef.current?.send('act', { a: 'mvote', target }) }
  const onMltReveal = () => { sfxReveal(); act({ a: 'mreveal' }, revealMlt) }
  const onMltNext = () => act({ a: 'mnext' }, nextMlt)
  const onRpsPick = (choice: 'r' | 'p' | 's') => { sfxTap(); if (isHost) pushState({ ...gRef.current, rpsPicks: { ...(gRef.current.rpsPicks || {}), [me.id]: choice } }); else roomRef.current?.send('act', { a: 'rpick', choice }) }
  const onRpsReveal = () => { sfxReveal(); act({ a: 'rreveal' }, revealRps) }
  const onRpsNext = () => act({ a: 'rnext' }, nextRps)
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

      {/* scoreboard strip (shown once anyone has points) */}
      {g.scores && Object.keys(g.scores).length > 0 && g.screen !== 'lobby' && g.screen !== 'menu' && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 14px', borderBottom: `1px solid ${C.border}`, background: C.card }}>
          {[...players].map(p => ({ p, sc: g.scores![p.id] || 0 })).sort((a, b) => b.sc - a.sc).map(({ p, sc }, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, padding: '3px 10px', borderRadius: 999, background: i === 0 && sc > 0 ? C.amber + '22' : C.bg, border: `1px solid ${i === 0 && sc > 0 ? C.amber : C.border}` }}>
              {i === 0 && sc > 0 && <span style={{ fontSize: 12 }}>👑</span>}
              <span style={{ fontSize: 12, fontWeight: 600 }}>{p.id === me.id ? 'You' : p.name.split(' ')[0]}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.amber }}>{sc}</span>
            </div>
          ))}
        </div>
      )}

      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column' }}>
        {g.screen === 'lobby' && (
          <Lobby players={players} me={me} isHost={isHost} onStart={launchInitial} onShare={share} onWhatsApp={shareWhatsApp} copied={copied} Avatar={Avatar} initialGame={initialGame} />
        )}
        {g.screen === 'menu' && (
          <Menu isHost={isHost} onSpinStart={() => { if (isHost) pushState({ screen: 'spin', spinAngle: 0, spinning: false }) }} onTod={() => { if (isHost) beginTod() }} onNhie={() => { if (isHost) startNhie() }} onWyr={() => { if (isHost) startChoice('wyr') }} onTot={() => { if (isHost) startChoice('tot') }} onTrivia={() => { if (isHost) startTrivia('Mixed') }} onMlt={() => { if (isHost) startMlt() }} onRps={() => { if (isHost) startRps() }} />
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
        {g.screen === 'choice' && (
          <ChoiceView g={g} me={me} players={players} isHost={isHost} onVote={onChoiceVote} onReveal={onChoiceReveal} onNext={onChoiceNext} onBack={onBackMenu} Avatar={Avatar} nameOf={nameOf} />
        )}
        {g.screen === 'trivia' && (
          <TriviaView g={g} me={me} players={players} isHost={isHost} onVote={onTriviaVote} onReveal={onTriviaReveal} onNext={onTriviaNext} onBack={onBackMenu} />
        )}
        {g.screen === 'mlt' && (
          <MltView g={g} me={me} players={players} isHost={isHost} onVote={onMltVote} onReveal={onMltReveal} onNext={onMltNext} onBack={onBackMenu} seatColor={seatColor} Avatar={Avatar} nameOf={nameOf} />
        )}
        {g.screen === 'rps' && (
          <RpsView g={g} me={me} players={players} isHost={isHost} onPick={onRpsPick} onReveal={onRpsReveal} onNext={onRpsNext} onBack={onBackMenu} Avatar={Avatar} nameOf={nameOf} />
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

function Menu({ isHost, onSpinStart, onTod, onNhie, onWyr, onTot, onTrivia, onMlt, onRps }: any) {
  const items = [
    { key: 'trivia', label: 'Trivia Duel', emoji: '🧠', color: C.green, fn: onTrivia },
    { key: 'spin', label: 'Spin the Bottle', emoji: '🍾', color: C.pink, fn: onSpinStart },
    { key: 'tod', label: 'Truth or Dare', emoji: '🎯', color: C.purple, fn: onTod },
    { key: 'nhie', label: 'Never Have I Ever', emoji: '🙈', color: C.teal, fn: onNhie },
    { key: 'wyr', label: 'Would You Rather', emoji: '🤔', color: C.blue, fn: onWyr },
    { key: 'tot', label: 'This or That — do you match?', emoji: '💞', color: C.orange, fn: onTot },
    { key: 'mlt', label: 'Most Likely To', emoji: '👉', color: C.amber, fn: onMlt },
    { key: 'rps', label: 'Rock Paper Scissors', emoji: '✊', color: C.red, fn: onRps },
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

function ChoiceView({ g, me, players, isHost, onVote, onReveal, onNext, onBack, Avatar, nameOf }: any) {
  const votes = g.choiceVotes || {}
  const myVote = votes[me.id]
  const p = g.choicePrompt || { a: '', b: '' }
  const isWyr = g.choiceKind === 'wyr'
  const matched = g.choiceKind === 'tot' && players.length === 2 && players.every((pl: LivePlayer) => votes[pl.id]) &&
    votes[players[0].id] === votes[players[1].id]
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center', fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>{isWyr ? 'Would you rather…' : 'This or that — do you match?'}</div>

      {!g.choiceRevealed ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(['a', 'b'] as const).map((k, i) => (
              <button key={k} onClick={() => onVote(k)} style={{
                background: myVote === k ? (i === 0 ? C.blue : C.orange) : C.card,
                border: myVote === k ? `2px solid ${i === 0 ? C.blue : C.orange}` : `1px solid ${C.border}`,
                borderRadius: RADIUS.lg, padding: '22px 20px', color: C.text, fontSize: 18, fontWeight: 700, cursor: 'pointer', textAlign: 'center', transition: `all ${MOTION.fast}`,
              }}>{p[k]}</button>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(votes).length}/{players.length} answered</div>
          {isHost && <button onClick={onReveal} disabled={Object.keys(votes).length === 0} style={{ ...solidBtn(Object.keys(votes).length ? C.amber : C.dim), opacity: Object.keys(votes).length ? 1 : 0.5 }}>Reveal 👀</button>}
          {!isHost && <div style={{ textAlign: 'center', color: C.dim, fontSize: 12 }}>Host reveals when everyone's in</div>}
        </>
      ) : (
        <>
          {g.choiceKind === 'tot' && players.length === 2 && (
            <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: matched ? C.pink : C.blue }}>{matched ? 'You match! 💞' : 'Opposites attract 😄'}</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((pl: LivePlayer) => (
              <div key={pl.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '10px 14px' }}>
                <Avatar p={pl} size={34} />
                <div style={{ flex: 1, fontWeight: 600 }}>{pl.id === me.id ? 'You' : (nameOf?.(pl.id) || pl.name)}</div>
                <div style={{ fontWeight: 700, color: votes[pl.id] === 'a' ? C.blue : C.orange }}>{votes[pl.id] ? p[votes[pl.id] as 'a' | 'b'] : '—'}</div>
              </div>
            ))}
          </div>
          {isHost ? <button onClick={onNext} style={solidBtn(C.teal)}>Next one →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host will bring the next one…</div>}
        </>
      )}
    </div>
  )
}

function TriviaView({ g, me, players, isHost, onVote, onReveal, onNext, onBack }: any) {
  const q = g.triviaQ || { q: '', options: [], answer: -1, cat: '' }
  const votes = g.triviaVotes || {}
  const myVote = votes[me.id]
  const answered = Object.keys(votes).length
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>🧠 Trivia · {q.cat}</span>
        <span style={{ fontSize: 11, color: C.muted }}>Round {g.triviaRound || 1}</span>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: 20, fontSize: 18, fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>{q.q}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((opt: string, i: number) => {
          const chosen = myVote === i
          const correct = g.triviaRevealed && i === q.answer
          const wrongPick = g.triviaRevealed && chosen && i !== q.answer
          const bg = correct ? C.green : wrongPick ? C.red : chosen ? C.blue : C.card2
          return (
            <button key={i} disabled={g.triviaRevealed || myVote !== undefined} onClick={() => onVote(i)} style={{
              background: bg, border: `1px solid ${correct ? C.green : wrongPick ? C.red : chosen ? C.blue : C.border}`, borderRadius: RADIUS.md, padding: '14px 16px', color: C.text, fontSize: 15, fontWeight: 600, textAlign: 'left',
              cursor: (g.triviaRevealed || myVote !== undefined) ? 'default' : 'pointer', opacity: (g.triviaRevealed && !correct && !chosen) ? 0.55 : 1,
            }}>{String.fromCharCode(65 + i)}. {opt}{correct ? '  ✓' : ''}</button>
          )
        })}
      </div>
      {!g.triviaRevealed ? (
        <>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{answered}/{players.length} answered{myVote !== undefined ? ' · locked in ✓' : ''}</div>
          {isHost && <button onClick={onReveal} disabled={!answered} style={{ ...solidBtn(answered ? C.amber : C.dim), opacity: answered ? 1 : 0.5 }}>Reveal answer 👀</button>}
        </>
      ) : (
        isHost ? <button onClick={onNext} style={solidBtn(C.green)}>Next question →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host will bring the next question…</div>
      )}
    </div>
  )
}

function MltView({ g, me, players, isHost, onVote, onReveal, onNext, onBack, Avatar, nameOf }: any) {
  const votes = g.mltVotes || {}
  const myVote = votes[me.id]
  const tally: Record<string, number> = {}
  for (const t of Object.values(votes)) tally[t as string] = (tally[t as string] || 0) + 1
  const maxV = Math.max(0, ...Object.values(tally))
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>👉 Most likely to</div>
        <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3 }}>{g.mltPrompt}?</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {players.map((p: LivePlayer) => {
          const chosen = myVote === p.id
          const count = tally[p.id] || 0
          const isTop = g.mltRevealed && count > 0 && count === maxV
          return (
            <button key={p.id} disabled={g.mltRevealed || myVote !== undefined} onClick={() => onVote(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isTop ? C.amber + '22' : chosen ? C.blue + '22' : C.card, border: `1px solid ${isTop ? C.amber : chosen ? C.blue : C.border}`, borderRadius: RADIUS.md, padding: '10px 14px', cursor: (g.mltRevealed || myVote !== undefined) ? 'default' : 'pointer', color: C.text }}>
              <Avatar p={p} size={34} />
              <div style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>{p.id === me.id ? 'You' : (nameOf?.(p.id) || p.name)}</div>
              {g.mltRevealed && <span style={{ fontWeight: 800, color: isTop ? C.amber : C.muted }}>{count} {count === 1 ? 'vote' : 'votes'}{isTop ? ' 👑' : ''}</span>}
            </button>
          )
        })}
      </div>
      {!g.mltRevealed ? (
        <>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(votes).length}/{players.length} voted</div>
          {isHost && <button onClick={onReveal} disabled={!Object.keys(votes).length} style={{ ...solidBtn(Object.keys(votes).length ? C.amber : C.dim), opacity: Object.keys(votes).length ? 1 : 0.5 }}>Reveal 👀</button>}
        </>
      ) : (isHost ? <button onClick={onNext} style={solidBtn(C.teal)}>Next one →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host will bring the next one…</div>)}
    </div>
  )
}

function RpsView({ g, me, players, isHost, onPick, onReveal, onNext, onBack, Avatar, nameOf }: any) {
  const picks = g.rpsPicks || {}
  const myPick = picks[me.id]
  const allPicked = players.length > 0 && players.every((p: LivePlayer) => picks[p.id])
  const ICON: Record<string, string> = { r: '✊', p: '✋', s: '✌️' }
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button onClick={onBack} style={{ ...ghost, alignSelf: 'flex-start' }}>← Games</button>
      <div style={{ textAlign: 'center', fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>✊ Rock · Paper · Scissors — Round {g.rpsRound || 1}</div>
      {!g.rpsRevealed ? (
        <>
          <div style={{ textAlign: 'center', fontSize: 16, color: C.text }}>{myPick ? 'Locked in — waiting for others…' : 'Make your move'}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {(['r', 'p', 's'] as const).map(k => (
              <button key={k} disabled={!!myPick} onClick={() => onPick(k)} style={{ width: 90, height: 90, borderRadius: RADIUS.lg, fontSize: 38, background: myPick === k ? C.blue : C.card, border: `2px solid ${myPick === k ? C.blue : C.border}`, cursor: myPick ? 'default' : 'pointer', opacity: myPick && myPick !== k ? 0.5 : 1 }}>{ICON[k]}</button>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 13 }}>{Object.keys(picks).length}/{players.length} ready</div>
          {isHost && <button onClick={onReveal} disabled={!Object.keys(picks).length} style={{ ...solidBtn(allPicked ? C.amber : C.dim), opacity: Object.keys(picks).length ? 1 : 0.5 }}>Reveal 👊</button>}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p: LivePlayer) => {
              const wins = (g.rpsWins || {})[p.id] || 0
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '10px 14px' }}>
                  <Avatar p={p} size={34} />
                  <div style={{ flex: 1, fontWeight: 600 }}>{p.id === me.id ? 'You' : (nameOf?.(p.id) || p.name)}</div>
                  <span style={{ fontSize: 24 }}>{ICON[picks[p.id]] || '—'}</span>
                  <span style={{ fontSize: 12, color: C.amber, fontWeight: 700, width: 54, textAlign: 'right' }}>{wins} {wins === 1 ? 'win' : 'wins'}</span>
                </div>
              )
            })}
          </div>
          {isHost ? <button onClick={onNext} style={solidBtn(C.teal)}>Next round →</button> : <div style={{ textAlign: 'center', color: C.muted }}>Host will start the next round…</div>}
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
