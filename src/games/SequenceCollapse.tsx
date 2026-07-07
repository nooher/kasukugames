import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Heart, Zap, Trophy, RotateCcw, Clock, Brain } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const C = {
  obsidian: '#0b0f14',
  ink: '#111820',
  slate: '#1a2230',
  carbon: '#141c28',
  emerald: '#00c97b',
  teal: '#00b4d8',
  sapphire: '#3a86ff',
  violet: '#7b2ff7',
  amber: '#f59e0b',
  rose: '#f43f5e',
  white: '#f0f4f8',
  muted: '#7a8ba0',
  dim: '#3d4f63',
  border: '#1f2d3d',
  surface: '#151d2b',
  radius: { sm: 8, md: 14, lg: 20 },
  shadow: '0 4px 20px rgba(0,0,0,0.5)',
  edge: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  transition: '250ms ease',
} as const;

/* chip palette — cycles through accents per element */
const CHIP_COLORS = [C.sapphire, C.emerald, C.teal, C.violet, C.amber, C.rose];

/* ------------------------------------------------------------------ */
/*  Sequence generators                                                */
/* ------------------------------------------------------------------ */
type SeqType =
  | 'arithmetic'
  | 'geometric'
  | 'fibonacci'
  | 'alternating'
  | 'primes'
  | 'squares'
  | 'triangular'
  | 'mixed';

interface Puzzle {
  sequence: number[];
  answer: number;
  decoys: number[];
  label: string;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

function nthPrime(n: number): number {
  let count = 0;
  let num = 1;
  while (count < n) {
    num++;
    if (isPrime(num)) count++;
  }
  return num;
}

function triangular(n: number): number {
  return (n * (n + 1)) / 2;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateDecoys(answer: number, count: number): number[] {
  const decoys = new Set<number>();
  /* close decoys */
  const offsets = [-2, -1, 1, 2, 3, -3, 4, -4];
  for (const o of shuffle(offsets)) {
    if (decoys.size >= count) break;
    const v = answer + o;
    if (v !== answer) decoys.add(v);
  }
  /* fallback random nearby */
  while (decoys.size < count) {
    const v = answer + Math.floor(Math.random() * 11) - 5;
    if (v !== answer) decoys.add(v);
  }
  return [...decoys].slice(0, count);
}

function buildPuzzle(level: number): Puzzle {
  const seqLen = Math.min(5 + Math.floor(level / 3), 8);
  const types: SeqType[] = [
    'arithmetic',
    'geometric',
    'fibonacci',
    'primes',
    'squares',
    'triangular',
    'alternating',
    'mixed',
  ];
  /* weight harder types at higher levels */
  const pool: SeqType[] = [];
  const maxIdx = Math.min(Math.floor(level / 1.5) + 2, types.length);
  for (let i = 0; i < maxIdx; i++) pool.push(types[i]);
  const type = pool[Math.floor(Math.random() * pool.length)];

  let seq: number[] = [];
  let answer: number;
  let label: string;

  switch (type) {
    case 'arithmetic': {
      const step = Math.floor(Math.random() * 6) + 2 + Math.floor(level / 3);
      const start = Math.floor(Math.random() * 20) + 1;
      for (let i = 0; i <= seqLen; i++) seq.push(start + step * i);
      label = `+${step}`;
      break;
    }
    case 'geometric': {
      const ratio = Math.floor(Math.random() * 3) + 2;
      const start = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i <= seqLen; i++) seq.push(start * Math.pow(ratio, i));
      label = `×${ratio}`;
      break;
    }
    case 'fibonacci': {
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      seq = [a, b];
      while (seq.length <= seqLen) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
      label = 'Fibonacci-like';
      break;
    }
    case 'primes': {
      const offset = Math.floor(Math.random() * 4);
      for (let i = 1; i <= seqLen + 1; i++) seq.push(nthPrime(i + offset));
      label = 'Primes';
      break;
    }
    case 'squares': {
      const offset = Math.floor(Math.random() * 3) + 1;
      for (let i = offset; i <= seqLen + offset; i++) seq.push(i * i);
      label = 'Perfect squares';
      break;
    }
    case 'triangular': {
      const offset = Math.floor(Math.random() * 3) + 1;
      for (let i = offset; i <= seqLen + offset; i++) seq.push(triangular(i));
      label = 'Triangular';
      break;
    }
    case 'alternating': {
      const stepA = Math.floor(Math.random() * 4) + 2;
      const stepB = Math.floor(Math.random() * 4) + 3;
      const start = Math.floor(Math.random() * 10) + 1;
      seq = [start];
      for (let i = 1; i <= seqLen; i++) {
        seq.push(seq[i - 1] + (i % 2 === 1 ? stepA : stepB));
      }
      label = `Alt +${stepA}/+${stepB}`;
      break;
    }
    case 'mixed': {
      const stepAdd = Math.floor(Math.random() * 3) + 1;
      const stepMul = 2;
      const start = Math.floor(Math.random() * 5) + 2;
      seq = [start];
      for (let i = 1; i <= seqLen; i++) {
        seq.push(i % 2 === 1 ? seq[i - 1] * stepMul : seq[i - 1] + stepAdd);
      }
      label = `×${stepMul} / +${stepAdd}`;
      break;
    }
  }

  answer = seq[seqLen];
  const visible = seq.slice(0, seqLen);
  const decoys = generateDecoys(answer, 3);

  return { sequence: visible, answer, decoys, label };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
}

type GameState = 'menu' | 'playing' | 'correct' | 'wrong' | 'gameover';

export default function SequenceCollapse({ onBack }: Props) {
  const [state, setState] = useState<GameState>('menu');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [timer, setTimer] = useState(20);
  const [fadeIn, setFadeIn] = useState(false);
  const [streakBonus, setStreakBonus] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountRef = useRef(true);

  /* cleanup on unmount */
  useEffect(() => {
    mountRef.current = true;
    return () => {
      mountRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* start a new puzzle */
  const nextPuzzle = useCallback(
    (lvl: number) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setFadeIn(false);
      const p = buildPuzzle(lvl);
      setPuzzle(p);
      setOptions(shuffle([p.answer, ...p.decoys]));
      setSelected(null);
      setTimer(20);
      setState('playing');

      /* fade-in animation trigger */
      requestAnimationFrame(() => {
        if (mountRef.current) setFadeIn(true);
      });

      /* countdown */
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            /* time-out counts as wrong */
            setLives((prev) => {
              const next = prev - 1;
              if (next <= 0) {
                setState('gameover');
              } else {
                setState('wrong');
              }
              return next;
            });
            setStreakBonus(0);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    },
    [],
  );

  /* handle answer pick */
  const handlePick = useCallback(
    (value: number) => {
      if (state !== 'playing' || selected !== null || !puzzle) return;
      if (timerRef.current) clearInterval(timerRef.current);
      setSelected(value);

      if (value === puzzle.answer) {
        const timeBonus = Math.floor(timer * 5);
        const levelBonus = level * 10;
        const streak = streakBonus + 1;
        const streakPts = streak >= 3 ? streak * 5 : 0;
        setScore((s) => s + levelBonus + timeBonus + streakPts);
        setStreakBonus(streak);
        setState('correct');
      } else {
        setStreakBonus(0);
        setLives((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            setState('gameover');
          } else {
            setState('wrong');
          }
          return next;
        });
      }
    },
    [state, selected, puzzle, timer, level, streakBonus],
  );

  /* advance after correct/wrong feedback */
  const advance = useCallback(() => {
    if (state === 'correct') {
      const next = level + 1;
      setLevel(next);
      nextPuzzle(next);
    } else if (state === 'wrong') {
      nextPuzzle(level);
    }
  }, [state, level, nextPuzzle]);

  /* start game */
  const startGame = useCallback(() => {
    setLevel(1);
    setScore(0);
    setLives(3);
    setStreakBonus(0);
    nextPuzzle(1);
  }, [nextPuzzle]);

  /* ---------------------------------------------------------------- */
  /*  Styles                                                           */
  /* ---------------------------------------------------------------- */
  const wrap: React.CSSProperties = {
    minHeight: '100vh',
    background: C.obsidian,
    color: C.white,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 16px 40px',
  };

  const headerRow: React.CSSProperties = {
    width: '100%',
    maxWidth: 640,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  };

  const backBtn: React.CSSProperties = {
    background: C.surface,
    border: 'none',
    color: C.muted,
    borderRadius: C.radius.sm,
    padding: '8px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    boxShadow: `${C.edge}, ${C.shadow}`,
    transition: C.transition,
  };

  const badge: React.CSSProperties = {
    background: C.surface,
    borderRadius: C.radius.sm,
    padding: '6px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: `${C.edge}, ${C.shadow}`,
  };

  const card: React.CSSProperties = {
    background: C.carbon,
    borderRadius: C.radius.lg,
    padding: 28,
    width: '100%',
    maxWidth: 640,
    boxShadow: `${C.edge}, ${C.shadow}`,
    border: `1px solid ${C.border}`,
  };

  const chipRow: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 28,
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 400ms ease, transform 400ms ease',
  };

  const chipBase: React.CSSProperties = {
    minWidth: 52,
    height: 52,
    borderRadius: C.radius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 20,
    boxShadow: `${C.edge}, ${C.shadow}`,
    transition: `transform ${C.transition}`,
  };

  const questionChip: React.CSSProperties = {
    ...chipBase,
    background: C.slate,
    border: `2px dashed ${C.sapphire}`,
    color: C.sapphire,
    fontSize: 24,
    animation: 'pulse-glow 1.5s ease-in-out infinite',
  };

  const optionGrid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 500ms ease 150ms, transform 500ms ease 150ms',
  };

  const timerBar: React.CSSProperties = {
    width: '100%',
    height: 6,
    background: C.slate,
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  };

  const timerFill: React.CSSProperties = {
    height: '100%',
    width: `${(timer / 20) * 100}%`,
    background: timer <= 5 ? C.rose : C.sapphire,
    borderRadius: 3,
    transition: 'width 1s linear, background 300ms ease',
  };

  const bigBtn: React.CSSProperties = {
    background: C.sapphire,
    color: '#fff',
    border: 'none',
    borderRadius: C.radius.md,
    padding: '16px 40px',
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: `${C.edge}, ${C.shadow}`,
    transition: C.transition,
    marginTop: 20,
  };

  /* ---------------------------------------------------------------- */
  /*  keyframes                                                        */
  /* ---------------------------------------------------------------- */
  const keyframesStyle = `
    @keyframes pulse-glow {
      0%, 100% { box-shadow: ${C.edge}, 0 0 0 0 rgba(58,134,255,0.25); }
      50% { box-shadow: ${C.edge}, 0 0 18px 4px rgba(58,134,255,0.3); }
    }
  `;

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */
  const renderLives = () => (
    <div style={badge}>
      {Array.from({ length: 3 }, (_, i) => (
        <Heart
          key={i}
          size={16}
          fill={i < lives ? C.rose : C.dim}
          color={i < lives ? C.rose : C.dim}
        />
      ))}
    </div>
  );

  const renderTimer = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...badge }}>
      <Clock size={14} color={timer <= 5 ? C.rose : C.muted} />
      <span style={{ color: timer <= 5 ? C.rose : C.white, fontVariantNumeric: 'tabular-nums' }}>
        {timer}s
      </span>
    </div>
  );

  const optionStyle = (value: number): React.CSSProperties => {
    let bg: string = C.surface;
    let borderColor: string = C.border;
    let color: string = C.white;

    if (selected !== null) {
      if (value === puzzle?.answer) {
        bg = C.emerald;
        borderColor = C.emerald;
        color = '#000';
      } else if (value === selected) {
        bg = C.rose;
        borderColor = C.rose;
        color = '#fff';
      }
    }

    return {
      background: bg,
      border: `2px solid ${borderColor}`,
      borderRadius: C.radius.md,
      padding: '16px 12px',
      fontSize: 22,
      fontWeight: 700,
      color,
      cursor: selected !== null ? 'default' : 'pointer',
      textAlign: 'center',
      boxShadow: `${C.edge}, ${C.shadow}`,
      transition: C.transition,
    };
  };

  /* ---------------------------------------------------------------- */
  /*  Menu screen                                                      */
  /* ---------------------------------------------------------------- */
  if (state === 'menu') {
    return (
      <div style={wrap}>
        <style>{keyframesStyle}</style>
        <div style={headerRow}>
          <button style={backBtn} onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <div style={{ ...card, textAlign: 'center' }}>
          <Brain size={56} color={C.sapphire} style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Sequence Collapse
          </h1>
          <p style={{ color: C.muted, fontSize: 15, margin: '0 0 24px', lineHeight: 1.6 }}>
            Predict the next element in increasingly complex number sequences.
            Arithmetic, geometric, Fibonacci, primes and more.
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 20,
              marginBottom: 28,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ ...badge, gap: 8 }}>
              <Heart size={14} fill={C.rose} color={C.rose} /> 3 Lives
            </div>
            <div style={{ ...badge, gap: 8 }}>
              <Clock size={14} color={C.sapphire} /> 20s Timer
            </div>
            <div style={{ ...badge, gap: 8 }}>
              <Zap size={14} color={C.amber} /> Speed Bonus
            </div>
          </div>
          <button style={bigBtn} onClick={startGame}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Game over screen                                                 */
  /* ---------------------------------------------------------------- */
  if (state === 'gameover') {
    return (
      <div style={wrap}>
        <style>{keyframesStyle}</style>
        <div style={headerRow}>
          <button style={backBtn} onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <div style={{ ...card, textAlign: 'center' }}>
          <Trophy size={56} color={C.amber} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Game Over</h2>
          <p style={{ color: C.muted, fontSize: 15, margin: '0 0 8px' }}>
            You reached level {level}
          </p>
          <p
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: C.sapphire,
              margin: '12px 0 28px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {score}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button style={bigBtn} onClick={startGame}>
              <RotateCcw size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Play Again
            </button>
            <button
              style={{ ...bigBtn, background: C.surface, color: C.muted }}
              onClick={onBack}
            >
              Quit
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Playing / correct / wrong screens                                */
  /* ---------------------------------------------------------------- */
  return (
    <div style={wrap}>
      <style>{keyframesStyle}</style>

      {/* Header */}
      <div style={headerRow}>
        <button style={backBtn} onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {renderLives()}
          {renderTimer()}
          <div style={{ ...badge, color: C.sapphire }}>
            <Zap size={14} color={C.sapphire} /> {score}
          </div>
        </div>
      </div>

      <div style={card}>
        {/* Level + timer bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Level {level}
          </span>
          {streakBonus >= 2 && (
            <span style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>
              {streakBonus}x streak
            </span>
          )}
        </div>
        <div style={timerBar}>
          <div style={timerFill} />
        </div>

        {/* Sequence chips */}
        {puzzle && (
          <>
            <div style={chipRow}>
              {puzzle.sequence.map((val, i) => (
                <div
                  key={i}
                  style={{
                    ...chipBase,
                    background: CHIP_COLORS[i % CHIP_COLORS.length],
                    color: '#fff',
                    transitionDelay: `${i * 60}ms`,
                    transform: fadeIn ? 'scale(1)' : 'scale(0.7)',
                    opacity: fadeIn ? 1 : 0,
                  }}
                >
                  {val}
                </div>
              ))}
              <div style={questionChip}>?</div>
            </div>

            {/* Feedback text */}
            {state === 'correct' && (
              <p
                style={{
                  textAlign: 'center',
                  color: C.emerald,
                  fontWeight: 700,
                  fontSize: 16,
                  margin: '0 0 16px',
                }}
              >
                Correct! Pattern: {puzzle.label}
              </p>
            )}
            {state === 'wrong' && (
              <p
                style={{
                  textAlign: 'center',
                  color: C.rose,
                  fontWeight: 700,
                  fontSize: 16,
                  margin: '0 0 16px',
                }}
              >
                Wrong! Answer was {puzzle.answer} ({puzzle.label})
              </p>
            )}

            {/* Options grid */}
            <div style={optionGrid}>
              {options.map((val) => (
                <button
                  key={val}
                  style={optionStyle(val)}
                  onClick={() => handlePick(val)}
                  disabled={selected !== null}
                >
                  {val}
                </button>
              ))}
            </div>

            {/* Next button after answer */}
            {(state === 'correct' || state === 'wrong') && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button style={bigBtn} onClick={advance}>
                  {state === 'correct' ? 'Next Level' : 'Try Again'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
