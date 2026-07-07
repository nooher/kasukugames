import { useState, useCallback, useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { COLOR, RADIUS, MOTION, SHADOW, GLASS, TYPOGRAPHY, SPACING } from '../lib/design'
import { sfxTap, sfxCorrect, sfxWrong, sfxScore, sfxClick, sfxGameOver, sfxLevelUp } from '../lib/sfx'

interface Props {
  onBack: () => void
  onGameEnd?: (r: {
    score: number
    accuracy: number
    level: number
    maxScore?: number
    timeMs?: number
  }) => void
}

// ── Card & Suit types ──

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

interface Card {
  suit: Suit
  rank: Rank
  id: string
}

type PlayerIndex = 0 | 1 | 2 | 3

interface TrickPlay {
  player: PlayerIndex
  card: Card
}

interface PlayerState {
  hand: Card[]
  tricks: number
  totalScore: number
  name: string
}

type Phase = 'menu' | 'dealing' | 'playing' | 'trickEnd' | 'roundEnd' | 'gameOver'

// ── Constants ──

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const RANK_NAMES: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
}
const TARGET_SCORE = 21
const TRICK_DELAY = 1200
const DEAL_DELAY = 800

const SUIT_COLORS: Record<Suit, string> = {
  spades: COLOR.white,
  clubs: COLOR.white,
  hearts: '#b84040',
  diamonds: '#b84040',
}

const PLAYER_POSITIONS: Record<number, { label: string; align: CSSProperties }> = {
  0: { label: 'You', align: { bottom: 0, left: '50%', transform: 'translateX(-50%)' } },
  1: { label: 'West', align: { left: 0, top: '50%', transform: 'translateY(-50%)' } },
  2: { label: 'North', align: { top: 0, left: '50%', transform: 'translateX(-50%)' } },
  3: { label: 'East', align: { right: 0, top: '50%', transform: 'translateY(-50%)' } },
}

const LS_KEY = 'kasuku_albastini_best'

function getBest(): number {
  try { return parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0 } catch { return 0 }
}
function setBest(n: number) {
  try { localStorage.setItem(LS_KEY, String(n)) } catch { /* noop */ }
}

// ── Deck helpers ──

function makeDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push({ suit, rank: rank as Rank, id: `${suit}_${rank}` })
    }
  }
  return deck
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 }
  return [...hand].sort((a, b) => {
    const sd = suitOrder[a.suit] - suitOrder[b.suit]
    if (sd !== 0) return sd
    return a.rank - b.rank
  })
}

// ── AI logic ──

function getPlayableCards(hand: Card[], leadSuit: Suit | null): Card[] {
  if (!leadSuit) return hand
  const following = hand.filter(c => c.suit === leadSuit)
  return following.length > 0 ? following : hand
}

function aiPickCard(
  hand: Card[],
  currentTrick: TrickPlay[],
  trumpSuit: Suit,
  leadSuit: Suit | null,
): Card {
  const playable = getPlayableCards(hand, leadSuit)
  if (playable.length === 1) return playable[0]

  // Determine current winning card in the trick
  let winningRank = 0
  let winnerTrumped = false
  for (const tp of currentTrick) {
    const isTrump = tp.card.suit === trumpSuit
    const isLead = tp.card.suit === leadSuit
    if (isTrump && !winnerTrumped) {
      winningRank = tp.card.rank
      winnerTrumped = true
    } else if (isTrump && winnerTrumped) {
      if (tp.card.rank > winningRank) winningRank = tp.card.rank
    } else if (isLead && !winnerTrumped) {
      if (tp.card.rank > winningRank) winningRank = tp.card.rank
    }
  }

  // If leading, play lowest card
  if (currentTrick.length === 0) {
    // Prefer non-trump low cards
    const nonTrump = playable.filter(c => c.suit !== trumpSuit)
    const pool = nonTrump.length > 0 ? nonTrump : playable
    return pool.reduce((low, c) => c.rank < low.rank ? c : low, pool[0])
  }

  // Try to win with the lowest possible winning card
  const leadCards = playable.filter(c => c.suit === leadSuit)
  const trumpCards = playable.filter(c => c.suit === trumpSuit)

  if (leadCards.length > 0 && !winnerTrumped) {
    // Can follow suit — find lowest card that beats current winner
    const winners = leadCards.filter(c => c.rank > winningRank)
    if (winners.length > 0) {
      return winners.reduce((low, c) => c.rank < low.rank ? c : low, winners[0])
    }
    // Can't beat — dump lowest
    return leadCards.reduce((low, c) => c.rank < low.rank ? c : low, leadCards[0])
  }

  if (leadCards.length > 0 && winnerTrumped) {
    // Someone trumped and we're following suit — dump lowest
    return leadCards.reduce((low, c) => c.rank < low.rank ? c : low, leadCards[0])
  }

  // Void in lead suit
  if (trumpCards.length > 0) {
    if (winnerTrumped) {
      // Need higher trump
      const higherTrumps = trumpCards.filter(c => c.rank > winningRank)
      if (higherTrumps.length > 0) {
        return higherTrumps.reduce((low, c) => c.rank < low.rank ? c : low, higherTrumps[0])
      }
    } else {
      // Trump with lowest trump
      return trumpCards.reduce((low, c) => c.rank < low.rank ? c : low, trumpCards[0])
    }
  }

  // Discard lowest
  return playable.reduce((low, c) => c.rank < low.rank ? c : low, playable[0])
}

// ── Trick resolution ──

function determineTrickWinner(trick: TrickPlay[], trumpSuit: Suit): PlayerIndex {
  const leadSuit = trick[0].card.suit
  let best = trick[0]
  for (let i = 1; i < trick.length; i++) {
    const tp = trick[i]
    const bestIsTrump = best.card.suit === trumpSuit
    const curIsTrump = tp.card.suit === trumpSuit
    if (curIsTrump && !bestIsTrump) {
      best = tp
    } else if (curIsTrump && bestIsTrump) {
      if (tp.card.rank > best.card.rank) best = tp
    } else if (!curIsTrump && !bestIsTrump && tp.card.suit === leadSuit) {
      if (tp.card.rank > best.card.rank) best = tp
    }
  }
  return best.player
}

// ── SVG suit paths ──

function SuitIcon({ suit, size = 16 }: { suit: Suit; size?: number }) {
  const color = SUIT_COLORS[suit]
  const s = size
  const half = s / 2

  if (suit === 'hearts') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={color}
        />
      </svg>
    )
  }
  if (suit === 'diamonds') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L22 12L12 22L2 12L12 2Z" fill={color} />
      </svg>
    )
  }
  if (suit === 'clubs') {
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
        <circle cx={half} cy={s * 0.3} r={s * 0.22} fill={color} />
        <circle cx={s * 0.3} cy={s * 0.55} r={s * 0.22} fill={color} />
        <circle cx={s * 0.7} cy={s * 0.55} r={s * 0.22} fill={color} />
        <rect x={half - s * 0.06} y={s * 0.5} width={s * 0.12} height={s * 0.4} rx={1} fill={color} />
      </svg>
    )
  }
  // spades
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C12 2 4 10 4 14.5C4 17.54 6.46 20 9.5 20c1.4 0 2.5-.5 2.5-.5V23h-1.5c-.28 0-.5.22-.5.5s.22.5.5.5h3c.28 0 .5-.22.5-.5s-.22-.5-.5-.5H12v-3.5s1.1.5 2.5.5c3.04 0 5.5-2.46 5.5-5.5C20 10 12 2 12 2z"
        fill={color}
      />
    </svg>
  )
}

// ── Card component ──

function CardFace({
  card,
  onClick,
  disabled,
  highlighted,
  small,
  faceDown,
  animateIn,
}: {
  card: Card
  onClick?: () => void
  disabled?: boolean
  highlighted?: boolean
  small?: boolean
  faceDown?: boolean
  animateIn?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const w = small ? 48 : 68
  const h = small ? 70 : 98
  const color = SUIT_COLORS[card.suit]

  if (faceDown) {
    return (
      <div
        style={{
          width: w,
          height: h,
          borderRadius: RADIUS.sm,
          background: COLOR.emerald,
          border: `1px solid ${COLOR.border}`,
          boxShadow: SHADOW.sm,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: animateIn ? 1 : 0.9,
          transition: `opacity ${MOTION.fast}`,
        }}
      >
        <div style={{
          width: w - 10,
          height: h - 10,
          borderRadius: RADIUS.sm - 2,
          border: `1px solid rgba(255,255,255,0.15)`,
        }} />
      </div>
    )
  }

  const canClick = onClick && !disabled

  return (
    <div
      onClick={canClick ? onClick : undefined}
      onMouseEnter={() => canClick && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: w,
        height: h,
        borderRadius: RADIUS.sm,
        background: highlighted ? COLOR.cardActive : '#fff',
        border: `1.5px solid ${highlighted ? COLOR.amber : COLOR.border}`,
        boxShadow: [
          GLASS.highlight,
          GLASS.edge,
          highlighted ? SHADOW.glow(COLOR.amber) : SHADOW.sm,
        ].join(', '),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: small ? 3 : 5,
        cursor: canClick ? 'pointer' : 'default',
        opacity: disabled ? 0.45 : 1,
        transform: hovered && canClick ? 'translateY(-8px) scale(1.04)' : animateIn ? 'translateY(0)' : 'none',
        transition: `transform ${MOTION.spring}, opacity ${MOTION.fast}, box-shadow ${MOTION.fast}`,
        userSelect: 'none',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Top-left rank + suit */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
        <span style={{
          fontSize: small ? 11 : 15,
          fontWeight: 700,
          color,
          lineHeight: 1,
          ...TYPOGRAPHY.mono,
        }}>
          {RANK_NAMES[card.rank]}
        </span>
        <SuitIcon suit={card.suit} size={small ? 10 : 13} />
      </div>

      {/* Center suit large */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <SuitIcon suit={card.suit} size={small ? 18 : 26} />
      </div>

      {/* Bottom-right rank + suit (inverted) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 0,
        transform: 'rotate(180deg)',
      }}>
        <span style={{
          fontSize: small ? 11 : 15,
          fontWeight: 700,
          color,
          lineHeight: 1,
          ...TYPOGRAPHY.mono,
        }}>
          {RANK_NAMES[card.rank]}
        </span>
        <SuitIcon suit={card.suit} size={small ? 10 : 13} />
      </div>
    </div>
  )
}

// ── Main component ──

export default function Albastini({ onBack, onGameEnd }: Props) {
  const startTimeRef = useRef(0)
  const [phase, setPhase] = useState<Phase>('menu')
  const [numPlayers, setNumPlayers] = useState(4)
  const [players, setPlayers] = useState<PlayerState[]>([])
  const [trumpSuit, setTrumpSuit] = useState<Suit>('spades')
  const [currentTrick, setCurrentTrick] = useState<TrickPlay[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<PlayerIndex>(0)
  const [, setLeadPlayer] = useState<PlayerIndex>(0)
  const [roundNum, setRoundNum] = useState(1)
  const [lastTrickWinner, setLastTrickWinner] = useState<PlayerIndex | null>(null)
  const [message, setMessage] = useState('')
  const [bestScore, setBestScore] = useState(getBest)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  // Timer for AI delays
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  // ── Deal a new round ──

  const dealRound = useCallback((
    prevPlayers: PlayerState[],
    nPlayers: number,
    round: number,
  ): { dealtPlayers: PlayerState[]; trump: Suit; firstPlayer: PlayerIndex } => {
    const deck = shuffle(makeDeck())
    const cardsPerPlayer = Math.floor(52 / nPlayers)
    const newPlayers: PlayerState[] = prevPlayers.map((p, i) => ({
      ...p,
      hand: sortHand(deck.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer)),
      tricks: 0,
    }))

    // Trump is determined by the last card dealt (or an extra turned-up card)
    const trumpCard = deck[nPlayers * cardsPerPlayer] || deck[deck.length - 1]
    const trump = trumpCard.suit

    // Dealer rotates each round; player after dealer leads
    const dealer = ((round - 1) % nPlayers) as PlayerIndex
    const firstPlayer = ((dealer + 1) % nPlayers) as PlayerIndex

    return { dealtPlayers: newPlayers, trump, firstPlayer }
  }, [])

  // ── Start game ──

  const startGame = useCallback((nPlayers: number) => {
    sfxTap()
    startTimeRef.current = performance.now()
    const names = ['You', 'West', 'North', 'East'].slice(0, nPlayers)
    const initial: PlayerState[] = names.map(name => ({
      hand: [],
      tricks: 0,
      totalScore: 0,
      name,
    }))
    setNumPlayers(nPlayers)
    setRoundNum(1)
    setCurrentTrick([])
    setLastTrickWinner(null)
    setSelectedCard(null)

    setPhase('dealing')
    setMessage('Dealing cards...')

    const { dealtPlayers, trump, firstPlayer } = dealRound(initial, nPlayers, 1)

    timerRef.current = setTimeout(() => {
      setPlayers(dealtPlayers)
      setTrumpSuit(trump)
      setCurrentPlayer(firstPlayer)
      setLeadPlayer(firstPlayer)
      setPhase('playing')
      setMessage(firstPlayer === 0 ? 'Your turn -- pick a card' : `${dealtPlayers[firstPlayer].name} leads...`)
      sfxClick()
    }, DEAL_DELAY)
  }, [dealRound])

  // ── Play a card ──

  const playCard = useCallback((playerIdx: PlayerIndex, card: Card) => {
    sfxScore()

    setPlayers(prev => {
      const next = [...prev]
      next[playerIdx] = {
        ...next[playerIdx],
        hand: next[playerIdx].hand.filter(c => c.id !== card.id),
      }
      return next
    })

    const newTrick: TrickPlay[] = [...currentTrick, { player: playerIdx, card }]
    setCurrentTrick(newTrick)
    setSelectedCard(null)

    // Check if trick is complete
    if (newTrick.length === numPlayers) {
      // Resolve trick
      const winner = determineTrickWinner(newTrick, trumpSuit)
      setLastTrickWinner(winner)
      setPhase('trickEnd')
      setMessage(`${players[winner].name} wins the trick!`)
      sfxCorrect()

      timerRef.current = setTimeout(() => {
        setPlayers(prev => {
          const next = [...prev]
          next[winner] = {
            ...next[winner],
            tricks: next[winner].tricks + 1,
          }
          return next
        })

        setCurrentTrick([])
        setLastTrickWinner(null)

        // Check if round is over (all cards played)
        const handsEmpty = players.every((p, i) => {
          const cardCount = p.hand.length - (i === playerIdx ? 1 : (newTrick.some(t => t.player === i) ? 1 : 0))
          return cardCount <= 0
        })

        if (handsEmpty) {
          // End of round — tally scores
          setPlayers(prev => {
            const scored = prev.map((p, idx) => ({
              ...p,
              totalScore: p.totalScore + p.tricks + (idx === winner ? 1 : 0),
            }))

            // Check for game over
            const maxScore = Math.max(...scored.map(s => s.totalScore))
            if (maxScore >= TARGET_SCORE) {
              const gameWinner = scored.findIndex(s => s.totalScore === maxScore)
              setPhase('gameOver')
              const playerScore = scored[0].totalScore
              if (playerScore > getBest()) {
                setBest(playerScore)
                setBestScore(playerScore)
              }
              if (gameWinner === 0) {
                setMessage('You win the game!')
                sfxLevelUp()
              } else {
                setMessage(`${scored[gameWinner].name} wins the game`)
                sfxGameOver()
              }
              onGameEnd?.({
                score: playerScore,
                accuracy: maxScore > 0 ? playerScore / maxScore : 0,
                level: roundNum,
                maxScore: maxScore,
                timeMs: performance.now() - startTimeRef.current,
              })
              return scored
            }

            // Next round
            const nextRound = roundNum + 1
            setRoundNum(nextRound)
            setPhase('roundEnd')
            setMessage(`Round ${roundNum} complete! Starting round ${nextRound}...`)

            timerRef.current = setTimeout(() => {
              const { dealtPlayers, trump, firstPlayer } = dealRound(scored, numPlayers, nextRound)
              setPlayers(dealtPlayers)
              setTrumpSuit(trump)
              setCurrentPlayer(firstPlayer)
              setLeadPlayer(firstPlayer)
              setCurrentTrick([])
              setPhase('playing')
              setMessage(firstPlayer === 0 ? 'Your turn -- pick a card' : `${dealtPlayers[firstPlayer].name} leads...`)
              sfxClick()
            }, DEAL_DELAY)

            return scored
          })
          return
        }

        // Next trick — winner leads
        setCurrentPlayer(winner)
        setLeadPlayer(winner)
        setPhase('playing')
        if (winner === 0) {
          setMessage('You won! Lead the next trick')
        } else {
          setMessage(`${players[winner].name} leads...`)
        }
      }, TRICK_DELAY)
    } else {
      // Next player
      const nextP = ((playerIdx + 1) % numPlayers) as PlayerIndex
      setCurrentPlayer(nextP)
      if (nextP === 0) {
        setMessage('Your turn -- pick a card')
      } else {
        setMessage(`${players[nextP].name} is thinking...`)
      }
    }
  }, [currentTrick, numPlayers, trumpSuit, players, roundNum, dealRound, onGameEnd])

  // ── AI plays automatically ──

  useEffect(() => {
    if (phase !== 'playing' || currentPlayer === 0) return
    const leadSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null
    const hand = players[currentPlayer]?.hand
    if (!hand || hand.length === 0) return

    timerRef.current = setTimeout(() => {
      const card = aiPickCard(hand, currentTrick, trumpSuit, leadSuit)
      playCard(currentPlayer, card)
    }, 600 + Math.random() * 400)
  }, [phase, currentPlayer, currentTrick, players, trumpSuit, playCard])

  // ── Human plays ──

  const handleCardClick = useCallback((card: Card) => {
    if (phase !== 'playing' || currentPlayer !== 0) return

    const leadSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null
    const playable = getPlayableCards(players[0].hand, leadSuit)
    if (!playable.some(c => c.id === card.id)) {
      sfxWrong()
      setMessage(`You must follow ${leadSuit}!`)
      return
    }

    if (selectedCard === card.id) {
      // Confirm play
      playCard(0 as PlayerIndex, card)
    } else {
      setSelectedCard(card.id)
      sfxClick()
    }
  }, [phase, currentPlayer, currentTrick, players, selectedCard, playCard])

  // ── Styles ──

  const containerStyle: CSSProperties = {
    background: COLOR.surface,
    borderRadius: RADIUS.lg,
    border: `1px solid ${COLOR.border}`,
    boxShadow: [GLASS.highlight, GLASS.edge, SHADOW.lg].join(', '),
    padding: SPACING.md,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: SPACING.sm,
    maxWidth: 720,
    width: '100%',
    userSelect: 'none',
    margin: '0 auto',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  }

  const backBtnStyle: CSSProperties = {
    background: 'none',
    border: `1px solid ${COLOR.border}`,
    borderRadius: RADIUS.sm,
    color: COLOR.muted,
    fontSize: 13,
    padding: '4px 12px',
    cursor: 'pointer',
    flexShrink: 0,
  }

  const statStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    lineHeight: 1.2,
    minWidth: 40,
  }

  const statLabelStyle: CSSProperties = {
    ...TYPOGRAPHY.caption,
    color: COLOR.muted,
    fontSize: 9,
  }

  const statValStyle: CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: COLOR.white,
    ...TYPOGRAPHY.mono,
  }

  const trumpBadgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: RADIUS.full,
    background: SUIT_COLORS[trumpSuit] === '#b84040' ? '#b8404018' : `${COLOR.white}12`,
    border: `1px solid ${SUIT_COLORS[trumpSuit]}30`,
    fontSize: 12,
    fontWeight: 600,
    color: SUIT_COLORS[trumpSuit],
  }

  const playAreaStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: 500,
    aspectRatio: '1.2',
    minHeight: 260,
    borderRadius: RADIUS.lg,
    background: '#e8e2d6',
    border: `1px solid ${COLOR.border}`,
    boxShadow: `inset 0 2px 8px rgba(20,16,10,0.04)`,
    overflow: 'hidden',
  }

  const centerTrickStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  }

  const playerLabelStyle = (idx: number): CSSProperties => {
    const pos = PLAYER_POSITIONS[idx]
    return {
      position: 'absolute',
      ...pos.align,
      padding: '3px 10px',
      borderRadius: RADIUS.sm,
      background: currentPlayer === idx && phase === 'playing' ? COLOR.amber + '30' : 'rgba(255,255,255,0.6)',
      border: `1px solid ${currentPlayer === idx && phase === 'playing' ? COLOR.amber + '50' : 'transparent'}`,
      fontSize: 11,
      fontWeight: 600,
      color: COLOR.white,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2,
      margin: idx === 0 ? '0 0 4px 0' : idx === 2 ? '4px 0 0 0' : '0 4px',
      transition: `background ${MOTION.fast}, border-color ${MOTION.fast}`,
      zIndex: 2,
    }
  }

  const handStyle: CSSProperties = {
    display: 'flex',
    gap: -8,
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: '100%',
    padding: '4px 0',
    minHeight: 80,
  }

  const overlayStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(250,247,242,0.92)',
    gap: SPACING.sm,
    zIndex: 10,
    borderRadius: RADIUS.lg,
  }

  const msgStyle: CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: COLOR.white,
    textAlign: 'center',
    minHeight: 20,
    transition: `color ${MOTION.fast}`,
  }

  const playBtnStyle: CSSProperties = {
    background: COLOR.emerald,
    color: '#fff',
    border: 'none',
    borderRadius: RADIUS.full,
    fontSize: 15,
    fontWeight: 600,
    padding: '10px 28px',
    cursor: 'pointer',
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.2)',
      `0 4px 16px ${COLOR.emerald}30`,
    ].join(', '),
    transition: `transform ${MOTION.snap}`,
  }

  const scoreboardStyle: CSSProperties = {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: `repeat(${numPlayers}, 1fr)`,
    gap: 6,
  }

  const scoreCellStyle = (idx: number): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    padding: '6px 4px',
    borderRadius: RADIUS.sm,
    background: idx === 0 ? COLOR.emerald + '12' : 'rgba(255,255,255,0.4)',
    border: `1px solid ${idx === 0 ? COLOR.emerald + '30' : COLOR.border}`,
  })

  // ── Get playable set for highlighting ──

  const leadSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null
  const humanPlayable = phase === 'playing' && currentPlayer === 0
    ? getPlayableCards(players[0]?.hand || [], leadSuit)
    : []

  // ── Render ──

  // Menu screen
  if (phase === 'menu') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={onBack}>Back</button>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: SPACING.md,
          padding: `${SPACING.lg}px 0`,
        }}>
          <h1 style={{
            ...TYPOGRAPHY.heading,
            color: COLOR.white,
            margin: 0,
          }}>
            Albastini
          </h1>
          <p style={{
            ...TYPOGRAPHY.body,
            color: COLOR.muted,
            textAlign: 'center',
            maxWidth: 340,
            margin: 0,
          }}>
            East African trick-taking card game. Win tricks by playing the highest card
            of the lead suit, or trump to steal. First to {TARGET_SCORE} points wins.
          </p>

          {bestScore > 0 && (
            <div style={{
              ...TYPOGRAPHY.caption,
              color: COLOR.amber,
              fontSize: 11,
            }}>
              PERSONAL BEST: {bestScore} pts
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm, alignItems: 'center' }}>
            <span style={{ ...TYPOGRAPHY.caption, color: COLOR.muted, fontSize: 10 }}>
              PLAYERS
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {([2, 3, 4] as const).map(n => (
                <button
                  key={n}
                  onClick={() => startGame(n)}
                  style={{
                    ...playBtnStyle,
                    background: n === 4 ? COLOR.emerald : 'transparent',
                    color: n === 4 ? '#fff' : COLOR.white,
                    border: n === 4 ? 'none' : `1px solid ${COLOR.border}`,
                    boxShadow: n === 4 ? playBtnStyle.boxShadow : 'none',
                    padding: '10px 22px',
                  }}
                >
                  {n} Players
                </button>
              ))}
            </div>
          </div>

          <div style={{
            ...TYPOGRAPHY.body,
            color: COLOR.dim,
            fontSize: 12,
            textAlign: 'center',
            maxWidth: 320,
            lineHeight: 1.6,
          }}>
            Click a card once to select, click again to play.
            You must follow the lead suit if you can.
            Trump suit beats all others.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={onBack}>Back</button>
        <div style={trumpBadgeStyle}>
          TRUMP <SuitIcon suit={trumpSuit} size={14} />
        </div>
        <div style={statStyle}>
          <span style={statLabelStyle}>ROUND</span>
          <span style={statValStyle}>{roundNum}</span>
        </div>
        <div style={statStyle}>
          <span style={{ ...statLabelStyle, color: COLOR.amber }}>BEST</span>
          <span style={{ ...statValStyle, color: COLOR.amber }}>{bestScore}</span>
        </div>
      </div>

      {/* Message bar */}
      <div style={msgStyle}>{message}</div>

      {/* Scoreboard */}
      <div style={scoreboardStyle}>
        {players.map((p, i) => (
          <div key={i} style={scoreCellStyle(i)}>
            <span style={{ ...TYPOGRAPHY.caption, color: COLOR.muted, fontSize: 9 }}>
              {p.name}
            </span>
            <span style={{
              fontSize: 18,
              fontWeight: 600,
              color: COLOR.white,
              ...TYPOGRAPHY.mono,
            }}>
              {p.totalScore}
            </span>
            <span style={{ fontSize: 10, color: COLOR.dim }}>
              {p.tricks} trick{p.tricks !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Play area */}
      <div style={playAreaStyle}>
        {/* Player position labels */}
        {players.map((p, i) => {
          if (i >= numPlayers) return null
          return (
            <div key={`label-${i}`} style={playerLabelStyle(i)}>
              <span>{p.name}</span>
              <span style={{ fontSize: 9, color: COLOR.dim }}>{p.hand.length} cards</span>
            </div>
          )
        })}

        {/* Trick area — center */}
        <div style={centerTrickStyle}>
          {currentTrick.map((tp) => (
            <div
              key={tp.card.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                animation: 'none',
              }}
            >
              <span style={{ fontSize: 9, color: COLOR.muted, fontWeight: 600 }}>
                {players[tp.player]?.name}
              </span>
              <CardFace card={tp.card} small animateIn />
            </div>
          ))}

          {currentTrick.length === 0 && phase === 'playing' && (
            <span style={{ color: COLOR.dim, fontSize: 13 }}>
              {currentPlayer === 0 ? 'Play a card' : 'Waiting...'}
            </span>
          )}
        </div>

        {/* Trick end / round end overlay */}
        {(phase === 'trickEnd' || phase === 'roundEnd') && (
          <div style={overlayStyle}>
            <span style={{
              ...TYPOGRAPHY.subheading,
              color: lastTrickWinner === 0 ? COLOR.emerald : COLOR.white,
            }}>
              {message}
            </span>
          </div>
        )}

        {/* Game over overlay */}
        {phase === 'gameOver' && (
          <div style={overlayStyle}>
            <span style={{ ...TYPOGRAPHY.caption, color: COLOR.muted, letterSpacing: '0.1em' }}>
              GAME OVER
            </span>
            <span style={{
              fontSize: 40,
              fontWeight: 600,
              color: players[0]?.totalScore >= Math.max(...players.map(p => p.totalScore))
                ? COLOR.emerald
                : COLOR.rose,
              lineHeight: 1,
            }}>
              {players[0]?.totalScore ?? 0}
            </span>
            <span style={{ color: COLOR.muted, fontSize: 13 }}>{message}</span>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {players.map((p, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  fontSize: 12,
                  color: COLOR.dim,
                }}>
                  <span style={{ fontWeight: 600, color: COLOR.white }}>{p.name}</span>
                  <span>{p.totalScore} pts</span>
                </div>
              ))}
            </div>

            <button
              style={{ ...playBtnStyle, marginTop: 8 }}
              onClick={() => startGame(numPlayers)}
            >
              Play Again
            </button>
            <button
              style={{ ...backBtnStyle, marginTop: 4 }}
              onClick={() => setPhase('menu')}
            >
              Menu
            </button>
          </div>
        )}

        {/* Dealing overlay */}
        {phase === 'dealing' && (
          <div style={overlayStyle}>
            <span style={{ ...TYPOGRAPHY.subheading, color: COLOR.white }}>Dealing...</span>
          </div>
        )}
      </div>

      {/* Player hand (human = player 0) */}
      {phase === 'playing' && players[0] && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          width: '100%',
        }}>
          <span style={{ ...TYPOGRAPHY.caption, color: COLOR.muted, fontSize: 9 }}>YOUR HAND</span>
          <div style={handStyle}>
            {players[0].hand.map(card => {
              const isPlayable = humanPlayable.some(c => c.id === card.id)
              const isSelected = selectedCard === card.id
              return (
                <CardFace
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card)}
                  disabled={currentPlayer !== 0 || !isPlayable}
                  highlighted={isSelected}
                  animateIn
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Show hand in non-playing phases too if cards remain */}
      {phase !== 'playing' && phase !== 'gameOver' && players[0]?.hand.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          width: '100%',
          opacity: 0.6,
        }}>
          <span style={{ ...TYPOGRAPHY.caption, color: COLOR.muted, fontSize: 9 }}>YOUR HAND</span>
          <div style={handStyle}>
            {players[0].hand.map(card => (
              <CardFace key={card.id} card={card} disabled small />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
