import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Brain, Trophy, Clock, Zap, RotateCcw, ChevronRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const T = {
  bg: '#1a2230',
  surface: '#151d2b',
  border: '#1f2d3d',
  accent: '#7b2ff7',
  success: '#00c97b',
  error: '#f43f5e',
  text: '#f0f4f8',
  muted: '#7a8ba0',
  radius: 14,
  pill: 999,
} as const;

/* ------------------------------------------------------------------ */
/*  Level configs                                                      */
/* ------------------------------------------------------------------ */
const LEVELS: { cols: number; rows: number; pairs: number }[] = [
  { cols: 4, rows: 3, pairs: 6 },
  { cols: 4, rows: 4, pairs: 8 },
  { cols: 5, rows: 4, pairs: 10 },
  { cols: 6, rows: 4, pairs: 12 },
  { cols: 6, rows: 5, pairs: 15 },
];

const SYMBOLS = ['🧠', '🎯', '⚡', '🔥', '💎', '🌟', '🎵', '🌊', '🦁', '🌺', '🎨', '🔮', '🏆', '🌙', '🍀'];

const MAX_TIME = 180; // 3 minutes

function peekTime(level: number): number {
  return Math.max(1, 3 - level * 0.3);
}

/* ------------------------------------------------------------------ */
/*  Card type                                                          */
/* ------------------------------------------------------------------ */
interface Card {
  id: number;
  symbol: string;
  matched: boolean;
}

/* ------------------------------------------------------------------ */
/*  Shuffle                                                            */
/* ------------------------------------------------------------------ */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------------------------------------------ */
/*  Build deck                                                         */
/* ------------------------------------------------------------------ */
function buildDeck(pairs: number): Card[] {
  const chosen = shuffle(SYMBOLS).slice(0, pairs);
  const cards: Card[] = [];
  chosen.forEach((s, i) => {
    cards.push({ id: i * 2, symbol: s, matched: false });
    cards.push({ id: i * 2 + 1, symbol: s, matched: false });
  });
  return shuffle(cards);
}

/* ------------------------------------------------------------------ */
/*  Format time                                                        */
/* ------------------------------------------------------------------ */
function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Game phases                                                        */
/* ------------------------------------------------------------------ */
type Phase = 'peek' | 'play' | 'levelComplete' | 'victory' | 'timeUp';

/* ------------------------------------------------------------------ */
/*  Inject keyframes once                                              */
/* ------------------------------------------------------------------ */
const STYLE_ID = 'memory-marathon-keyframes';
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes mm-pop {
      0% { transform: scale(0.8); opacity: 0; }
      60% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes mm-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
    @keyframes mm-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(123,47,247,0.4); }
      50% { box-shadow: 0 0 0 8px rgba(123,47,247,0); }
    }
  `;
  document.head.appendChild(style);
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MemoryMarathon({ onBack }: Props) {
  const [level, setLevel] = useState(0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>('peek');
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [locked, setLocked] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const peekRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* inject keyframes */
  useEffect(() => { ensureKeyframes(); }, []);

  /* ---------- start level ---------- */
  const startLevel = useCallback((lvl: number) => {
    const cfg = LEVELS[lvl];
    const newDeck = buildDeck(cfg.pairs);
    setDeck(newDeck);
    setFlipped([]);
    setMatchesFound(0);
    setMoves(0);
    setStreak(0);
    setLocked(true);
    setPhase('peek');

    // peek: show all cards briefly
    peekRef.current = setTimeout(() => {
      setPhase('play');
      setLocked(false);
    }, peekTime(lvl) * 1000);
  }, []);

  /* ---------- init ---------- */
  useEffect(() => {
    startLevel(0);
    return () => {
      if (peekRef.current) clearTimeout(peekRef.current);
    };
  }, [startLevel]);

  /* ---------- global timer ---------- */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= MAX_TIME) {
          setPhase('timeUp');
          setLocked(true);
          return MAX_TIME;
        }
        return prev + 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  /* stop timer on terminal phases */
  useEffect(() => {
    if (phase === 'victory' || phase === 'timeUp') {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [phase]);

  /* ---------- card click ---------- */
  const handleClick = (idx: number) => {
    if (locked) return;
    if (phase !== 'play') return;
    if (flipped.includes(idx)) return;
    if (deck[idx].matched) return;

    const next = [...flipped, idx];
    setFlipped(next);

    if (next.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);
      const [a, b] = next;
      if (deck[a].symbol === deck[b].symbol) {
        // match
        const newStreak = streak + 1;
        setStreak(newStreak);
        const bonus = newStreak > 1 ? 20 : 0;
        setScore(s => s + 50 + bonus);
        const newMatches = matchesFound + 1;
        setMatchesFound(newMatches);

        setTimeout(() => {
          setDeck(d => d.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c));
          setFlipped([]);
          setLocked(false);

          // check level complete
          const cfg = LEVELS[level];
          if (newMatches >= cfg.pairs) {
            if (level >= LEVELS.length - 1) {
              setPhase('victory');
              setLocked(true);
            } else {
              setPhase('levelComplete');
              setLocked(true);
            }
          }
        }, 500);
      } else {
        // mismatch
        setStreak(0);
        setScore(s => Math.max(0, s - 10));
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  /* ---------- next level ---------- */
  const advanceLevel = () => {
    const next = level + 1;
    setLevel(next);
    startLevel(next);
  };

  /* ---------- restart ---------- */
  const restart = () => {
    setLevel(0);
    setScore(0);
    setElapsed(0);
    setPhase('peek');
    startLevel(0);
    // restart timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= MAX_TIME) {
          setPhase('timeUp');
          setLocked(true);
          return MAX_TIME;
        }
        return prev + 1;
      });
    }, 1000);
  };

  /* ---------- derived ---------- */
  const cfg = LEVELS[level];
  const isRevealed = (idx: number) => phase === 'peek' || flipped.includes(idx) || deck[idx]?.matched;

  /* ================================================================ */
  /*  Styles                                                           */
  /* ================================================================ */
  const s = {
    wrapper: {
      minHeight: '100vh',
      background: T.bg,
      color: T.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    },
    header: {
      width: '100%',
      maxWidth: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      gap: 12,
      flexWrap: 'wrap' as const,
    },
    backBtn: {
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      color: T.text,
      padding: '8px 12px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 14,
    },
    stat: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: T.pill,
      padding: '6px 14px',
      fontSize: 13,
      fontWeight: 600,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: `repeat(${cfg.cols}, 1fr)`,
      gap: 10,
      padding: '0 20px 20px',
      maxWidth: 560,
      width: '100%',
    },
    cardOuter: {
      aspectRatio: '1',
      perspective: '600px',
      cursor: 'pointer',
    },
    cardInner: (revealed: boolean, matched: boolean, isMiss: boolean): React.CSSProperties => ({
      width: '100%',
      height: '100%',
      position: 'relative',
      transformStyle: 'preserve-3d',
      transition: 'transform 0.4s ease',
      transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
      animation: matched ? 'mm-pop 0.4s ease' : isMiss ? 'mm-shake 0.4s ease' : undefined,
    }),
    cardFace: {
      position: 'absolute' as const,
      inset: 0,
      borderRadius: T.radius,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backfaceVisibility: 'hidden' as const,
    },
    cardBack: {
      background: '#2a1a4e',
      border: `2px solid ${T.accent}44`,
    },
    cardFront: (matched: boolean): React.CSSProperties => ({
      background: matched ? '#0a2a1a' : T.surface,
      border: `2px solid ${matched ? T.success + '66' : T.border}`,
      transform: 'rotateY(180deg)',
    }),
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: T.bg + 'f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    },
    modal: {
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      padding: '40px 36px',
      textAlign: 'center' as const,
      maxWidth: 380,
      width: '90%',
    },
    btn: (color: string): React.CSSProperties => ({
      background: color,
      color: '#fff',
      border: 'none',
      borderRadius: T.pill,
      padding: '12px 28px',
      fontSize: 15,
      fontWeight: 700,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    }),
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div style={s.wrapper}>
      {/* --- Header --- */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={s.stat}>
          <Brain size={14} color={T.accent} />
          Lvl {level + 1}
        </div>
        <div style={s.stat}>
          <Zap size={14} color={T.success} />
          {score}
        </div>
        <div style={s.stat}>
          {matchesFound}/{cfg.pairs}
        </div>
        <div style={{ ...s.stat, color: elapsed >= 150 ? T.error : T.text }}>
          <Clock size={14} />
          {fmt(elapsed)}
        </div>
      </div>

      {/* --- Peek banner --- */}
      {phase === 'peek' && (
        <div style={{
          color: T.accent,
          fontSize: 14,
          fontWeight: 600,
          padding: '8px 20px 4px',
          animation: 'mm-pulse 1s infinite',
          borderRadius: T.pill,
        }}>
          Memorize the cards...
        </div>
      )}

      {/* --- Grid --- */}
      <div style={s.grid}>
        {deck.map((card, idx) => {
          const revealed = isRevealed(idx);
          return (
            <div key={card.id} style={s.cardOuter} onClick={() => handleClick(idx)}>
              <div style={s.cardInner(revealed, card.matched, false)}>
                {/* Back face (face-down) */}
                <div style={{ ...s.cardFace, ...s.cardBack }}>
                  <Brain size={22} color={T.accent + '88'} />
                </div>
                {/* Front face (face-up, rotated 180) */}
                <div style={{ ...s.cardFace, ...s.cardFront(card.matched) }}>
                  <span style={{ fontSize: cfg.pairs > 10 ? 26 : 32, userSelect: 'none' }}>
                    {card.symbol}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- Level Complete Overlay --- */}
      {phase === 'levelComplete' && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <Trophy size={48} color={T.success} style={{ marginBottom: 12 }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Level {level + 1} Complete</h2>
            <p style={{ color: T.muted, margin: '0 0 6px', fontSize: 14 }}>
              {moves} moves &middot; Score: {score}
            </p>
            <p style={{ color: T.muted, margin: '0 0 20px', fontSize: 13 }}>
              {streak > 1 ? `Best streak: ${streak} consecutive matches` : 'Try chaining matches for bonus points'}
            </p>
            <button style={s.btn(T.accent)} onClick={advanceLevel}>
              Level {level + 2} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* --- Victory Overlay --- */}
      {phase === 'victory' && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <Trophy size={56} color="#f5c542" style={{ marginBottom: 12 }} />
            <h2 style={{ margin: '0 0 4px', fontSize: 24 }}>Memory Marathon Complete</h2>
            <p style={{ color: T.success, fontWeight: 700, fontSize: 28, margin: '8px 0' }}>
              {score} pts
            </p>
            <div style={{ color: T.muted, fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
              <div>Time: {fmt(elapsed)}</div>
              <div>Total Moves: {moves}</div>
              <div>All 5 levels cleared</div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button style={s.btn(T.surface)} onClick={onBack}>
                <ArrowLeft size={14} /> Exit
              </button>
              <button style={s.btn(T.accent)} onClick={restart}>
                <RotateCcw size={14} /> Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Time Up Overlay --- */}
      {phase === 'timeUp' && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <Clock size={48} color={T.error} style={{ marginBottom: 12 }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Time's Up</h2>
            <p style={{ color: T.muted, margin: '0 0 6px', fontSize: 14 }}>
              Reached Level {level + 1} &middot; Score: {score}
            </p>
            <p style={{ color: T.muted, margin: '0 0 20px', fontSize: 13 }}>
              Complete all levels within 3 minutes to win
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button style={s.btn(T.surface)} onClick={onBack}>
                <ArrowLeft size={14} /> Exit
              </button>
              <button style={s.btn(T.accent)} onClick={restart}>
                <RotateCcw size={14} /> Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
