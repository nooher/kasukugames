import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { RADIUS, MOTION, solidBtn, COLOR } from '../lib/design';
import { sfxTap, sfxCorrect, sfxWrong, sfxLevelUp, sfxGameOver, sfxClick, sfxScore } from '../lib/sfx';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
  onGameEnd?: (r: {
    score: number;
    accuracy: number;
    level: number;
    maxScore?: number;
    timeMs?: number;
  }) => void;
}

/* ------------------------------------------------------------------ */
/*  Palette                                                            */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#0d1117',
  felt: '#1a2a1a',
  card: '#faf7f2',
  cardBack: '#2a4030',
  cardBackAccent: '#3a5a44',
  border: '#1c2940',
  text: '#e8edf5',
  muted: '#8494a7',
  dim: '#4a5d75',
  hearts: '#c8424a',
  diamonds: '#c87842',
  clubs: '#2a5040',
  spades: '#1a1a2e',
  wild: '#c9a96e',
  overlay: 'rgba(10,14,20,0.85)',
  active: COLOR.emerald,
  accent: COLOR.sapphire,
  warning: COLOR.amber,
  error: COLOR.rose,
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
type Suit = typeof SUITS[number];

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
type Rank = typeof RANKS[number];

type SpecialKind = 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

interface Card {
  id: number;
  suit: Suit;
  rank: Rank;
  special: SpecialKind | null;
  points: number;
}

interface Player {
  name: string;
  hand: Card[];
  isHuman: boolean;
  totalScore: number;
  calledLastCard: boolean;
}

type Phase =
  | 'setup'
  | 'dealing'
  | 'playing'
  | 'choose-suit'
  | 'round-over'
  | 'game-over';

type Direction = 1 | -1;

/* ------------------------------------------------------------------ */
/*  Card logic                                                         */
/* ------------------------------------------------------------------ */
let nextCardId = 0;

function pointsForRank(rank: Rank, special: SpecialKind | null): number {
  if (special === 'wild' || special === 'wild4') return 50;
  if (special === 'draw2') return 20;
  if (special === 'skip' || special === 'reverse') return 20;
  if (rank === 'A') return 15;
  if (rank === 'K' || rank === 'Q' || rank === 'J') return 10;
  return parseInt(rank);
}

function buildDeck(): Card[] {
  const cards: Card[] = [];

  // Standard 52 cards with specials assigned
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let special: SpecialKind | null = null;
      // Jacks are skip, Queens are reverse, Kings(spades/clubs) are draw2
      if (rank === 'J') special = 'skip';
      else if (rank === 'Q') special = 'reverse';
      else if (rank === '2') special = 'draw2';

      cards.push({
        id: nextCardId++,
        suit,
        rank,
        special,
        points: pointsForRank(rank, special),
      });
    }
  }

  // 4 Wilds (Ace of each suit acts as wild when used, but we add dedicated wilds)
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: nextCardId++,
      suit: SUITS[i],
      rank: 'A',
      special: 'wild',
      points: 50,
    });
  }

  // 2 Wild Draw 4
  for (let i = 0; i < 2; i++) {
    cards.push({
      id: nextCardId++,
      suit: SUITS[i],
      rank: 'A',
      special: 'wild4',
      points: 50,
    });
  }

  return cards;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlayCard(card: Card, topCard: Card, chosenSuit: Suit | null): boolean {
  if (card.special === 'wild' || card.special === 'wild4') return true;
  const matchSuit = chosenSuit || topCard.suit;
  if (card.suit === matchSuit) return true;
  if (card.rank === topCard.rank) return true;
  return false;
}

function handPoints(hand: Card[]): number {
  return hand.reduce((s, c) => s + c.points, 0);
}

/* ------------------------------------------------------------------ */
/*  Suit colors + SVG                                                  */
/* ------------------------------------------------------------------ */
function suitColor(suit: Suit): string {
  switch (suit) {
    case 'hearts': return C.hearts;
    case 'diamonds': return C.diamonds;
    case 'clubs': return C.clubs;
    case 'spades': return C.spades;
  }
}

function SuitIcon({ suit, size = 14 }: { suit: Suit; size?: number }) {
  const col = suitColor(suit);

  switch (suit) {
    case 'hearts':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
            2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
            C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
            c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            fill={col} />
        </svg>
      );
    case 'diamonds':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 2L4 12l8 10 8-10z" fill={col} />
        </svg>
      );
    case 'clubs':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" fill={col} />
          <circle cx="7" cy="14" r="4" fill={col} />
          <circle cx="17" cy="14" r="4" fill={col} />
          <rect x="11" y="14" width="2" height="6" fill={col} />
        </svg>
      );
    case 'spades':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 2C12 2 4 10 4 14c0 2.76 2.24 5 5 5
            .93 0 1.8-.25 2.54-.69L11 22h2l-.54-3.69
            C13.2 18.75 14.07 19 15 19c2.76 0 5-2.24 5-5
            C20 10 12 2 12 2z"
            fill={col} />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Card rendering                                                     */
/* ------------------------------------------------------------------ */
const CARD_W = 72;
const CARD_H = 100;

function specialLabel(special: SpecialKind): string {
  switch (special) {
    case 'skip': return 'S';
    case 'reverse': return 'R';
    case 'draw2': return '+2';
    case 'wild': return 'W';
    case 'wild4': return '+4';
  }
}

function specialFullLabel(special: SpecialKind): string {
  switch (special) {
    case 'skip': return 'SKIP';
    case 'reverse': return 'REV';
    case 'draw2': return 'DRAW 2';
    case 'wild': return 'WILD';
    case 'wild4': return 'WILD +4';
  }
}

interface CardViewProps {
  card: Card;
  playable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  faceDown?: boolean;
  small?: boolean;
}

function CardView({ card, playable, selected, onClick, style, faceDown, small }: CardViewProps) {
  const w = small ? 48 : CARD_W;
  const h = small ? 68 : CARD_H;
  const isWild = card.special === 'wild' || card.special === 'wild4';
  const col = isWild ? C.wild : suitColor(card.suit);
  const fontSize = small ? 11 : 15;

  if (faceDown) {
    return (
      <div
        style={{
          width: w,
          height: h,
          borderRadius: RADIUS.sm,
          background: C.cardBack,
          border: `2px solid ${C.cardBackAccent}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          ...style,
        }}
      >
        {/* Cross-hatch pattern */}
        <div style={{
          position: 'absolute', inset: 4,
          borderRadius: 4,
          border: `1px solid ${C.cardBackAccent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: 8,
            background: C.cardBackAccent,
          }} />
        </div>
      </div>
    );
  }

  const displayRank = isWild
    ? specialLabel(card.special as SpecialKind)
    : (card.special ? specialLabel(card.special) : card.rank);

  return (
    <div
      onClick={onClick}
      style={{
        width: w,
        height: h,
        borderRadius: RADIUS.sm,
        background: C.card,
        border: `2px solid ${selected ? C.active : (playable ? col + '80' : '#d0c8bc')}`,
        boxShadow: selected
          ? `0 4px 16px ${C.active}40, 0 0 0 2px ${C.active}`
          : playable
            ? `0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px ${col}30`
            : '0 1px 4px rgba(0,0,0,0.15)',
        cursor: playable ? 'pointer' : 'default',
        flexShrink: 0,
        position: 'relative',
        transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
        transform: selected ? 'translateY(-12px)' : 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Top-left rank + suit */}
      <div style={{
        position: 'absolute', top: 4, left: 5,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
      }}>
        <span style={{
          fontSize, fontWeight: 700, color: col, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {displayRank}
        </span>
        {!isWild && <SuitIcon suit={card.suit} size={small ? 10 : 12} />}
      </div>

      {/* Center */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 2,
      }}>
        {isWild ? (
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', width: 28 }}>
            {SUITS.map(s => <SuitIcon key={s} suit={s} size={small ? 8 : 12} />)}
          </div>
        ) : (
          <SuitIcon suit={card.suit} size={small ? 18 : 28} />
        )}
        {card.special && (
          <span style={{
            fontSize: small ? 7 : 9, fontWeight: 600, color: col,
            letterSpacing: '0.04em', textAlign: 'center',
          }}>
            {specialFullLabel(card.special)}
          </span>
        )}
      </div>

      {/* Bottom-right rank + suit (inverted) */}
      <div style={{
        position: 'absolute', bottom: 4, right: 5,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
        transform: 'rotate(180deg)',
      }}>
        <span style={{
          fontSize, fontWeight: 700, color: col, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {displayRank}
        </span>
        {!isWild && <SuitIcon suit={card.suit} size={small ? 10 : 12} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Back of card (draw pile)                                           */
/* ------------------------------------------------------------------ */
function DrawPile({ count, onClick, canDraw }: { count: number; onClick: () => void; canDraw: boolean }) {
  return (
    <div
      onClick={canDraw ? onClick : undefined}
      style={{
        position: 'relative',
        cursor: canDraw ? 'pointer' : 'default',
        width: CARD_W + 8,
        height: CARD_H + 8,
      }}
    >
      {/* Stacked cards effect */}
      {[4, 2, 0].map(offset => (
        <div
          key={offset}
          style={{
            position: 'absolute',
            top: offset,
            left: offset,
            width: CARD_W,
            height: CARD_H,
            borderRadius: RADIUS.sm,
            background: C.cardBack,
            border: `2px solid ${C.cardBackAccent}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        />
      ))}
      {/* Label */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.cardBackAccent, letterSpacing: '0.04em' }}>
          DRAW
        </span>
        <span style={{ fontSize: 18, fontWeight: 700, color: C.muted, fontVariantNumeric: 'tabular-nums' }}>
          {count}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Strategy                                                        */
/* ------------------------------------------------------------------ */
function aiChooseCard(
  hand: Card[],
  topCard: Card,
  chosenSuit: Suit | null,
  drawStack: number,
): number {
  const playable = hand
    .map((c, i) => ({ card: c, index: i }))
    .filter(({ card }) => canPlayCard(card, topCard, chosenSuit));

  if (playable.length === 0) return -1;

  // If draw stack is active, must play a draw2 if possible to stack
  if (drawStack > 0) {
    const draw2 = playable.find(p => p.card.special === 'draw2');
    if (draw2) return draw2.index;
    return -1; // Must draw
  }

  // Prefer action cards to slow opponent
  const skip = playable.find(p => p.card.special === 'skip');
  if (skip && hand.length <= 4) return skip.index;

  const reverse = playable.find(p => p.card.special === 'reverse');
  if (reverse && hand.length <= 4) return reverse.index;

  const draw2 = playable.find(p => p.card.special === 'draw2');
  if (draw2 && hand.length <= 5) return draw2.index;

  // Save wilds for when no other option or near end
  const nonWild = playable.filter(p => p.card.special !== 'wild' && p.card.special !== 'wild4');
  if (nonWild.length > 0) {
    // Prefer matching suit, then highest points
    const suitMatch = nonWild.filter(p => p.card.suit === (chosenSuit || topCard.suit));
    if (suitMatch.length > 0) {
      suitMatch.sort((a, b) => b.card.points - a.card.points);
      return suitMatch[0].index;
    }
    nonWild.sort((a, b) => b.card.points - a.card.points);
    return nonWild[0].index;
  }

  // Use wild draw 4 before regular wild
  const wild4 = playable.find(p => p.card.special === 'wild4');
  if (wild4) return wild4.index;

  return playable[0].index;
}

function aiChooseSuit(hand: Card[]): Suit {
  // Pick the suit we have most of
  const counts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
  for (const c of hand) {
    if (c.special !== 'wild' && c.special !== 'wild4') {
      counts[c.suit]++;
    }
  }
  let best: Suit = 'hearts';
  let max = -1;
  for (const s of SUITS) {
    if (counts[s] > max) { max = counts[s]; best = s; }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LastCard({ onBack, onGameEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [pile, setPile] = useState<Card[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);
  const [drawStack, setDrawStack] = useState(0);
  const [chosenSuit, setChosenSuit] = useState<Suit | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [message, setMessage] = useState('');
  const [roundWinner, setRoundWinner] = useState(-1);
  const [_lastPlayedCard, setLastPlayedCard] = useState<Card | null>(null);
  const [animatingCard, setAnimatingCard] = useState(false);
  const [showLastCardBtn, setShowLastCardBtn] = useState(false);
  const [lastCardPenalty, setLastCardPenalty] = useState(false);
  const [gameWinner, setGameWinner] = useState(-1);
  const startTimeRef = useRef(0);
  const roundsRef = useRef(0);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const WIN_SCORE = 500;

  // Cleanup AI timer on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  /* ---- Deal a new round ---- */
  const dealRound = useCallback((existingPlayers?: Player[]) => {
    const pls = existingPlayers || players;
    let newDeck = shuffle(buildDeck());

    const newPlayers = pls.map(p => ({ ...p, hand: [] as Card[], calledLastCard: false }));
    // Deal 7 cards each
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < newPlayers.length; j++) {
        const card = newDeck.pop()!;
        newPlayers[j].hand.push(card);
      }
    }

    // Find a non-special starting card for the pile
    let startIdx = newDeck.findIndex(c => !c.special);
    if (startIdx === -1) startIdx = 0;
    const startCard = newDeck.splice(startIdx, 1)[0];

    setPlayers(newPlayers);
    setDeck(newDeck);
    setPile([startCard]);
    setCurrentPlayer(0);
    setDirection(1);
    setDrawStack(0);
    setChosenSuit(null);
    setMessage('');
    setRoundWinner(-1);
    setLastPlayedCard(null);
    setAnimatingCard(false);
    setShowLastCardBtn(false);
    setLastCardPenalty(false);
    setPhase('playing');
    startTimeRef.current = Date.now();
    roundsRef.current++;
  }, [players]);

  /* ---- Start game ---- */
  const startGame = useCallback(() => {
    const names = ['You', 'Binti', 'Mzee', 'Kaka'];
    const pls: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
      pls.push({
        name: names[i],
        hand: [],
        isHuman: i === 0,
        totalScore: 0,
        calledLastCard: false,
      });
    }
    sfxTap();
    dealRound(pls);
  }, [playerCount, dealRound]);

  /* ---- Draw cards from deck ---- */
  const drawCards = useCallback((count: number, _playerIdx: number): {
    newDeck: Card[];
    drawnCards: Card[];
  } => {
    let d = [...deck];
    const drawn: Card[] = [];
    for (let i = 0; i < count; i++) {
      if (d.length === 0) {
        // Reshuffle pile except top card
        const top = pile[pile.length - 1];
        d = shuffle(pile.slice(0, -1));
        setPile([top]);
      }
      if (d.length > 0) {
        drawn.push(d.pop()!);
      }
    }
    return { newDeck: d, drawnCards: drawn };
  }, [deck, pile]);

  /* ---- Next player index ---- */
  const nextPlayerIdx = useCallback((from: number, dir: Direction): number => {
    return ((from + dir) + players.length) % players.length;
  }, [players.length]);

  /* ---- Check round end ---- */
  const checkRoundEnd = useCallback((updatedPlayers: Player[]): boolean => {
    const winnerIdx = updatedPlayers.findIndex(p => p.hand.length === 0);
    if (winnerIdx === -1) return false;

    // Calculate points from other players' hands
    let pts = 0;
    for (let i = 0; i < updatedPlayers.length; i++) {
      if (i !== winnerIdx) {
        pts += handPoints(updatedPlayers[i].hand);
      }
    }

    const newPlayers = updatedPlayers.map((p, i) => ({
      ...p,
      totalScore: i === winnerIdx ? p.totalScore + pts : p.totalScore,
    }));

    setPlayers(newPlayers);
    setRoundWinner(winnerIdx);
    sfxLevelUp();

    // Check game over
    if (newPlayers[winnerIdx].totalScore >= WIN_SCORE) {
      setGameWinner(winnerIdx);
      setPhase('game-over');
      sfxGameOver();
      if (onGameEnd) {
        onGameEnd({
          score: newPlayers[0].totalScore,
          accuracy: newPlayers[0].totalScore >= WIN_SCORE ? 1 : 0,
          level: roundsRef.current,
          maxScore: WIN_SCORE,
          timeMs: Date.now() - startTimeRef.current,
        });
      }
    } else {
      setPhase('round-over');
    }

    return true;
  }, [onGameEnd]);

  /* ---- Play a card (for any player) ---- */
  const playCard = useCallback((playerIdx: number, cardIdx: number, wildSuit?: Suit) => {
    const player = players[playerIdx];
    const card = player.hand[cardIdx];
    const newHand = player.hand.filter((_, i) => i !== cardIdx);
    const newPile = [...pile, card];

    let newDir = direction;
    let newDrawStack = drawStack;
    let newChosenSuit: Suit | null = null;
    let skipNext = false;

    // Handle special effects
    if (card.special === 'reverse') {
      newDir = (direction * -1) as Direction;
      if (players.length === 2) skipNext = true; // In 2-player, reverse acts as skip
    }
    if (card.special === 'skip') {
      skipNext = true;
    }
    if (card.special === 'draw2') {
      newDrawStack = drawStack + 2;
    }
    if (card.special === 'wild' || card.special === 'wild4') {
      newChosenSuit = wildSuit || null;
      if (card.special === 'wild4') {
        newDrawStack = drawStack + 4;
      }
    }

    const newPlayers = players.map((p, i) => {
      if (i === playerIdx) {
        return { ...p, hand: newHand };
      }
      return p;
    });

    // Handle last card call mechanic
    if (newHand.length === 1 && player.isHuman) {
      setShowLastCardBtn(true);
      // Player has 3 seconds to call it
      setTimeout(() => {
        setShowLastCardBtn(false);
        setLastCardPenalty(prev => {
          // Check if they called it by now
          if (!newPlayers[playerIdx].calledLastCard && newHand.length === 1) {
            return true;
          }
          return prev;
        });
      }, 3000);
    }

    setPlayers(newPlayers);
    setPile(newPile);
    setDirection(newDir);
    setDrawStack(newDrawStack);
    setChosenSuit(newChosenSuit);
    setLastPlayedCard(card);
    setAnimatingCard(true);

    sfxScore();

    setTimeout(() => {
      setAnimatingCard(false);

      // Check round end
      if (checkRoundEnd(newPlayers)) return;

      // Determine next player
      let next = nextPlayerIdx(playerIdx, newDir);
      if (skipNext) {
        setMessage(`${newPlayers[next].name} skipped!`);
        next = nextPlayerIdx(next, newDir);
      }

      setCurrentPlayer(next);
    }, 400);
  }, [players, pile, direction, drawStack, checkRoundEnd, nextPlayerIdx]);

  /* ---- Human draws ---- */
  const humanDraw = useCallback(() => {
    if (phase !== 'playing' || currentPlayer !== 0 || animatingCard) return;

    const count = drawStack > 0 ? drawStack : 1;
    const { newDeck, drawnCards } = drawCards(count, 0);

    const newPlayers = players.map((p, i) => {
      if (i === 0) {
        return { ...p, hand: [...p.hand, ...drawnCards], calledLastCard: false };
      }
      return p;
    });

    setPlayers(newPlayers);
    setDeck(newDeck);
    setDrawStack(0);
    sfxClick();

    if (count > 1) {
      setMessage(`You drew ${count} cards!`);
    }

    const next = nextPlayerIdx(0, direction);
    setCurrentPlayer(next);
  }, [phase, currentPlayer, animatingCard, drawStack, drawCards, players, nextPlayerIdx, direction]);

  /* ---- Human plays ---- */
  const humanPlay = useCallback((cardIdx: number) => {
    if (phase !== 'playing' || currentPlayer !== 0 || animatingCard) return;

    const card = players[0].hand[cardIdx];
    const topCard = pile[pile.length - 1];

    // If draw stack active, can only play draw2 to stack or must draw
    if (drawStack > 0 && card.special !== 'draw2') {
      sfxWrong();
      setMessage('You must play a +2 or draw!');
      return;
    }

    if (!canPlayCard(card, topCard, chosenSuit)) {
      sfxWrong();
      setMessage('Card does not match!');
      return;
    }

    if (card.special === 'wild' || card.special === 'wild4') {
      // Show suit chooser
      setPhase('choose-suit');
      // Store the card index temporarily
      setMessage(String(cardIdx));
      return;
    }

    playCard(0, cardIdx);
  }, [phase, currentPlayer, animatingCard, players, pile, drawStack, chosenSuit, playCard]);

  /* ---- Choose wild suit ---- */
  const chooseSuit = useCallback((suit: Suit) => {
    const cardIdx = parseInt(message);
    setPhase('playing');
    setMessage('');
    sfxTap();
    playCard(0, cardIdx, suit);
  }, [message, playCard]);

  /* ---- Call Last Card ---- */
  const callLastCard = useCallback(() => {
    setShowLastCardBtn(false);
    setLastCardPenalty(false);
    sfxCorrect();
    setMessage('LAST CARD!');
    const newPlayers = players.map((p, i) => {
      if (i === 0) return { ...p, calledLastCard: true };
      return p;
    });
    setPlayers(newPlayers);
    setTimeout(() => setMessage(''), 1500);
  }, [players]);

  /* ---- Handle last card penalty ---- */
  useEffect(() => {
    if (!lastCardPenalty) return;
    // Penalty: draw 2 cards
    const { newDeck, drawnCards } = drawCards(2, 0);
    const newPlayers = players.map((p, i) => {
      if (i === 0) {
        return { ...p, hand: [...p.hand, ...drawnCards], calledLastCard: false };
      }
      return p;
    });
    setPlayers(newPlayers);
    setDeck(newDeck);
    setLastCardPenalty(false);
    setMessage('Penalty! +2 cards');
    sfxWrong();
    setTimeout(() => setMessage(''), 2000);
  }, [lastCardPenalty]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- AI turn ---- */
  useEffect(() => {
    if (phase !== 'playing') return;
    if (animatingCard) return;
    if (players.length === 0) return;
    if (players[currentPlayer]?.isHuman) return;

    aiTimerRef.current = setTimeout(() => {
      const player = players[currentPlayer];
      if (!player) return;
      const topCard = pile[pile.length - 1];

      const cardIdx = aiChooseCard(player.hand, topCard, chosenSuit, drawStack);

      if (cardIdx === -1) {
        // AI must draw
        const count = drawStack > 0 ? drawStack : 1;
        const { newDeck, drawnCards } = drawCards(count, currentPlayer);
        const newPlayers = players.map((p, i) => {
          if (i === currentPlayer) {
            return { ...p, hand: [...p.hand, ...drawnCards], calledLastCard: false };
          }
          return p;
        });
        setPlayers(newPlayers);
        setDeck(newDeck);
        setDrawStack(0);
        setMessage(`${player.name} draws ${count}`);
        sfxClick();

        const next = nextPlayerIdx(currentPlayer, direction);
        setCurrentPlayer(next);
      } else {
        const card = player.hand[cardIdx];
        let wildSuit: Suit | undefined;
        if (card.special === 'wild' || card.special === 'wild4') {
          wildSuit = aiChooseSuit(player.hand);
        }

        // AI calls last card automatically when at 2 cards (about to go to 1)
        if (player.hand.length === 2) {
          setMessage(`${player.name}: LAST CARD!`);
        }

        playCard(currentPlayer, cardIdx, wildSuit);
      }
    }, 800 + Math.random() * 600);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [phase, currentPlayer, animatingCard, players, pile, chosenSuit, drawStack, drawCards, direction, nextPlayerIdx, playCard]);

  /* ---- Clear message after a delay ---- */
  useEffect(() => {
    if (!message || phase === 'choose-suit') return;
    const t = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(t);
  }, [message, phase]);

  /* ------------------------------------------------------------------ */
  /*  Render: Setup                                                     */
  /* ------------------------------------------------------------------ */
  if (phase === 'setup') {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, color: C.text,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 24, gap: 32,
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute', top: 16, left: 16,
            background: 'none', border: 'none', color: C.muted,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 14, fontWeight: 500,
          }}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em',
            color: C.text, margin: 0,
          }}>
            Last Card
          </h1>
          <p style={{ color: C.muted, fontSize: 15, marginTop: 8 }}>
            Shed your cards before everyone else
          </p>
        </div>

        <div style={{
          background: C.felt,
          borderRadius: RADIUS.lg,
          padding: 32,
          border: `1px solid ${C.border}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', gap: 20,
          alignItems: 'center', minWidth: 280,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.muted, letterSpacing: '0.06em' }}>
            PLAYERS
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            {[2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => { setPlayerCount(n); sfxClick(); }}
                style={{
                  ...(playerCount === n ? solidBtn(C.active) : {}),
                  background: playerCount === n ? C.active : 'transparent',
                  color: playerCount === n ? '#fff' : C.muted,
                  border: playerCount === n ? 'none' : `1px solid ${C.border}`,
                  borderRadius: RADIUS.full,
                  padding: '10px 24px',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: `all ${MOTION.fast}`,
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div style={{
            fontSize: 12, color: C.dim, textAlign: 'center', lineHeight: 1.6,
            maxWidth: 220,
          }}>
            Match by suit or rank. Use specials to block opponents.
            First to {WIN_SCORE} points wins the match.
          </div>

          <button
            onClick={startGame}
            style={{
              ...solidBtn(C.active),
              padding: '14px 40px',
              fontSize: 16,
              marginTop: 8,
            }}
          >
            Deal Cards
          </button>
        </div>

        {/* Rules summary */}
        <div style={{
          maxWidth: 340, fontSize: 12, color: C.dim, lineHeight: 1.7,
          textAlign: 'left',
        }}>
          <div style={{ fontWeight: 600, color: C.muted, marginBottom: 6 }}>SPECIAL CARDS</div>
          <div><span style={{ color: C.text, fontWeight: 600 }}>2</span> -- Draw 2 (stackable)</div>
          <div><span style={{ color: C.text, fontWeight: 600 }}>J</span> -- Skip next player</div>
          <div><span style={{ color: C.text, fontWeight: 600 }}>Q</span> -- Reverse direction</div>
          <div><span style={{ color: C.wild, fontWeight: 600 }}>Wild</span> -- Choose any suit</div>
          <div><span style={{ color: C.wild, fontWeight: 600 }}>Wild +4</span> -- Choose suit, next draws 4</div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Game Over                                                 */
  /* ------------------------------------------------------------------ */
  if (phase === 'game-over') {
    const winner = players[gameWinner];
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, color: C.text,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 24, gap: 24,
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: C.muted,
          letterSpacing: '0.06em',
        }}>
          MATCH COMPLETE
        </div>
        <div style={{
          fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em',
          color: winner.isHuman ? C.active : C.error,
        }}>
          {winner.isHuman ? 'You Win!' : `${winner.name} Wins`}
        </div>

        {/* Scoreboard */}
        <div style={{
          background: C.felt, borderRadius: RADIUS.lg, padding: 24,
          border: `1px solid ${C.border}`, minWidth: 260,
        }}>
          {players.map((p, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: i < players.length - 1 ? `1px solid ${C.border}` : 'none',
              color: i === gameWinner ? C.active : C.text,
              fontWeight: i === gameWinner ? 600 : 400,
            }}>
              <span>{p.name}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                {p.totalScore}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button onClick={onBack} style={{
            ...solidBtn(C.dim),
            background: 'transparent',
            color: C.muted,
            border: `1px solid ${C.border}`,
          }}>
            <ArrowLeft size={16} /> Exit
          </button>
          <button onClick={() => { setPhase('setup'); sfxClick(); }} style={solidBtn(C.active)}>
            <RotateCcw size={16} /> New Match
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Round Over                                                 */
  /* ------------------------------------------------------------------ */
  if (phase === 'round-over') {
    const winner = players[roundWinner];
    return (
      <div style={{
        minHeight: '100vh', background: C.bg, color: C.text,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: 24, gap: 20,
        fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: C.muted,
          letterSpacing: '0.06em',
        }}>
          ROUND {roundsRef.current} COMPLETE
        </div>
        <div style={{
          fontSize: 28, fontWeight: 600,
          color: winner.isHuman ? C.active : C.error,
        }}>
          {winner.isHuman ? 'You won the round!' : `${winner.name} wins the round`}
        </div>

        {/* Scores */}
        <div style={{
          background: C.felt, borderRadius: RADIUS.lg, padding: 20,
          border: `1px solid ${C.border}`, minWidth: 240,
        }}>
          {players.map((p, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0',
              color: i === roundWinner ? C.active : C.text,
              fontWeight: i === roundWinner ? 600 : 400,
            }}>
              <span>{p.name}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                {p.totalScore} / {WIN_SCORE}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => dealRound()}
          style={{ ...solidBtn(C.active), padding: '14px 36px', fontSize: 16 }}
        >
          Next Round
        </button>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: Choose Suit (wild overlay)                                 */
  /* ------------------------------------------------------------------ */
  const suitChooser = phase === 'choose-suit' && (
    <div style={{
      position: 'fixed', inset: 0, background: C.overlay,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: C.felt, borderRadius: RADIUS.lg, padding: 32,
        border: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.muted, letterSpacing: '0.04em' }}>
          CHOOSE SUIT
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          {SUITS.map(s => (
            <button
              key={s}
              onClick={() => chooseSuit(s)}
              style={{
                width: 56, height: 56, borderRadius: RADIUS.md,
                background: suitColor(s) + '20',
                border: `2px solid ${suitColor(s)}60`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: `transform ${MOTION.fast}`,
              }}
            >
              <SuitIcon suit={s} size={28} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ------------------------------------------------------------------ */
  /*  Render: Playing                                                    */
  /* ------------------------------------------------------------------ */
  const topCard = pile[pile.length - 1];
  const humanHand = players[0]?.hand || [];
  const isHumanTurn = currentPlayer === 0 && !animatingCard;

  // Check which cards in hand are playable
  const playableIndices = new Set<number>();
  if (isHumanTurn) {
    humanHand.forEach((c, i) => {
      if (drawStack > 0) {
        if (c.special === 'draw2') playableIndices.add(i);
      } else if (canPlayCard(c, topCard, chosenSuit)) {
        playableIndices.add(i);
      }
    });
  }

  const canDrawFromPile = isHumanTurn;

  // Direction arrow character
  const dirArrow = direction === 1 ? '⟳' : '⟲';

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      display: 'flex', flexDirection: 'column',
      fontFamily: "'SF Pro Display', -apple-system, sans-serif",
      overflow: 'hidden', position: 'relative',
    }}>
      {suitChooser}

      {/* Top bar: back + scores */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', color: C.muted,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{
            fontSize: 20, color: direction === 1 ? C.active : C.warning,
            transition: `color ${MOTION.fast}`,
          }}>
            {dirArrow}
          </span>
          <span style={{ fontSize: 12, color: C.muted, fontWeight: 600, letterSpacing: '0.04em' }}>
            R{roundsRef.current}
          </span>
        </div>
      </div>

      {/* Opponent hands (top) */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 24,
        padding: '4px 16px 8px', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {players.slice(1).map((p, idx) => {
          const pIdx = idx + 1;
          const isActive = currentPlayer === pIdx;
          return (
            <div key={pIdx} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              opacity: isActive ? 1 : 0.6,
              transition: `opacity ${MOTION.fast}`,
            }}>
              <div style={{
                display: 'flex', gap: 2, justifyContent: 'center',
              }}>
                {p.hand.slice(0, 10).map((c, ci) => (
                  <CardView key={c.id} card={c} faceDown small
                    style={{
                      marginLeft: ci > 0 ? -32 : 0,
                    }}
                  />
                ))}
                {p.hand.length > 10 && (
                  <span style={{ fontSize: 11, color: C.muted, alignSelf: 'center', marginLeft: 4 }}>
                    +{p.hand.length - 10}
                  </span>
                )}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{
                  fontSize: 12, fontWeight: isActive ? 600 : 400,
                  color: isActive ? C.active : C.muted,
                }}>
                  {p.name}
                </span>
                <span style={{
                  fontSize: 11, color: C.dim,
                  fontVariantNumeric: 'tabular-nums', fontWeight: 700,
                }}>
                  {p.hand.length}
                </span>
                <span style={{
                  fontSize: 10, color: C.dim,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  ({p.totalScore}pts)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center: play area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 32, position: 'relative', minHeight: 160,
      }}>
        {/* Draw stack indicator */}
        {drawStack > 0 && (
          <div style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            background: C.error + '30',
            border: `1px solid ${C.error}60`,
            borderRadius: RADIUS.full,
            padding: '4px 16px',
            fontSize: 13, fontWeight: 600, color: C.error,
          }}>
            Stack: +{drawStack}
          </div>
        )}

        {/* Draw pile */}
        <DrawPile count={deck.length} onClick={humanDraw} canDraw={canDrawFromPile} />

        {/* Play pile */}
        <div style={{ position: 'relative' }}>
          {topCard && (
            <CardView
              card={topCard}
              style={{
                transition: `transform ${MOTION.spring}`,
                transform: animatingCard ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          )}
          {/* Chosen suit indicator */}
          {chosenSuit && (
            <div style={{
              position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', alignItems: 'center', gap: 4,
              background: suitColor(chosenSuit) + '25',
              border: `1px solid ${suitColor(chosenSuit)}40`,
              borderRadius: RADIUS.full,
              padding: '2px 10px',
            }}>
              <SuitIcon suit={chosenSuit} size={14} />
              <span style={{ fontSize: 10, color: suitColor(chosenSuit), fontWeight: 600, textTransform: 'capitalize' }}>
                {chosenSuit}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Message toast */}
      {message && phase === 'playing' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: C.felt,
          border: `1px solid ${C.border}`,
          borderRadius: RADIUS.lg,
          padding: '10px 24px',
          fontSize: 15, fontWeight: 600, color: C.text,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 50,
          pointerEvents: 'none',
          animation: 'fadeInUp 200ms ease-out',
        }}>
          {message}
        </div>
      )}

      {/* Last Card button */}
      {showLastCardBtn && (
        <div style={{
          position: 'absolute', bottom: 160, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
        }}>
          <button
            onClick={callLastCard}
            style={{
              ...solidBtn(C.warning),
              padding: '14px 32px',
              fontSize: 16,
              animation: 'pulse 600ms ease-in-out infinite',
            }}
          >
            LAST CARD!
          </button>
        </div>
      )}

      {/* Turn indicator */}
      <div style={{
        textAlign: 'center', padding: '4px 0',
        fontSize: 12, fontWeight: 600,
        color: isHumanTurn ? C.active : C.muted,
        letterSpacing: '0.04em',
      }}>
        {isHumanTurn ? 'YOUR TURN' : `${players[currentPlayer]?.name?.toUpperCase()} IS PLAYING...`}
      </div>

      {/* Player score bar */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 16, padding: '2px 0',
        fontSize: 11, color: C.dim,
      }}>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          Score: <span style={{ color: C.text, fontWeight: 700 }}>{players[0]?.totalScore || 0}</span> / {WIN_SCORE}
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          Cards: <span style={{ color: C.text, fontWeight: 700 }}>{humanHand.length}</span>
        </span>
      </div>

      {/* Player's hand (bottom fan) */}
      <div style={{
        padding: '8px 8px 20px',
        display: 'flex', justifyContent: 'center',
        overflowX: 'auto', overflowY: 'visible',
        flexShrink: 0,
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          position: 'relative',
          paddingBottom: 8,
        }}>
          {humanHand.map((card, i) => {
            const total = humanHand.length;
            // Fan spread: tighter overlap with more cards
            const overlap = Math.max(28, 60 - total * 2);
            const centerIdx = (total - 1) / 2;
            const fanAngle = Math.min(2.5, 30 / total);
            const angle = (i - centerIdx) * fanAngle;
            const yOffset = Math.abs(i - centerIdx) * (total > 6 ? 2 : 1);
            const isPlayable = playableIndices.has(i);

            return (
              <div
                key={card.id}
                style={{
                  marginLeft: i > 0 ? -overlap + CARD_W : 0,
                  transform: `rotate(${angle}deg) translateY(${yOffset}px)`,
                  transformOrigin: 'bottom center',
                  transition: `transform ${MOTION.fast}`,
                  zIndex: i,
                  position: 'relative',
                }}
              >
                <CardView
                  card={card}
                  playable={isPlayable}
                  onClick={isPlayable ? () => humanPlay(i) : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, -40%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
