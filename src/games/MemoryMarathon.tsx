import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Brain, Trophy, Clock, Zap, RotateCcw, ChevronRight } from 'lucide-react';
import { sfxReveal, sfxCorrect, sfxWrong, sfxLevelUp, sfxGameOver, sfxCombo, sfxTap, sfxScore } from '../lib/sfx';
import {
  type Particle, type ScorePop,
  correctBurst, wrongBurst, confettiBurst,
  tickParticles, renderParticleStyle,
  createScorePop, tickScorePops, scorePopStyle,
  screenShakeStyle, comboGlowStyle,
} from '../lib/vfx';

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
/*  SVG shape renderers (15 distinct geometric shapes)                  */
/* ------------------------------------------------------------------ */
type ShapeRenderer = (sz: number, color: string) => React.ReactElement;

const SHAPES: ShapeRenderer[] = [
  /* 0  circle   */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="13" fill={c} /></svg>,
  /* 1  square   */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="24" height="24" rx="3" fill={c} /></svg>,
  /* 2  triangle */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon points="16,3 29,28 3,28" fill={c} /></svg>,
  /* 3  diamond  */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon points="16,2 30,16 16,30 2,16" fill={c} /></svg>,
  /* 4  star     */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon points="16,2 20,12 30,12 22,19 25,29 16,23 7,29 10,19 2,12 12,12" fill={c} /></svg>,
  /* 5  hexagon  */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill={c} /></svg>,
  /* 6  pentagon */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon points="16,2 30,12 25,28 7,28 2,12" fill={c} /></svg>,
  /* 7  cross    */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M12,4 h8 v8 h8 v8 h-8 v8 h-8 v-8 h-8 v-8 h8z" fill={c} /></svg>,
  /* 8  heart    */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16,28 C6,20 2,14 2,9 C2,5 5,2 9,2 C12,2 14,4 16,6 C18,4 20,2 23,2 C27,2 30,5 30,9 C30,14 26,20 16,28Z" fill={c} /></svg>,
  /* 9  crescent */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M20,2 A14,14 0 1,0 20,30 A10,10 0 1,1 20,2Z" fill={c} /></svg>,
  /* 10 arrow    */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon points="16,2 28,18 22,18 22,30 10,30 10,18 4,18" fill={c} /></svg>,
  /* 11 bolt     */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon points="18,2 8,18 14,18 12,30 24,14 18,14 20,2" fill={c} /></svg>,
  /* 12 droplet  */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16,2 C16,2 6,16 6,22 C6,27 10,30 16,30 C22,30 26,27 26,22 C26,16 16,2 16,2Z" fill={c} /></svg>,
  /* 13 octagon  */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><polygon points="11,2 21,2 30,11 30,21 21,30 11,30 2,21 2,11" fill={c} /></svg>,
  /* 14 ring     */ (sz, c) => <svg width={sz} height={sz} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="11" fill="none" stroke={c} strokeWidth="5" /></svg>,
];

const COLORS = [
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#00c97b', // green
  '#f59e0b', // amber
  '#7b2ff7', // purple
  '#06b6d4', // teal
  '#ec4899', // pink
  '#ef4444', // red
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f97316', // orange
  '#8b5cf6', // violet
  '#14b8a6', // cyan
  '#eab308', // yellow
  '#a855f7', // fuchsia
];

/* ------------------------------------------------------------------ */
/*  Memory types                                                       */
/* ------------------------------------------------------------------ */
type MemoryType = 'standard' | 'colorOnly' | 'shapeOnly' | 'sequence';

const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  standard: 'Memorize the cards...',
  colorOnly: 'Match by COLOR (ignore shape)...',
  shapeOnly: 'Match by SHAPE (ignore color)...',
  sequence: 'Memorize the ORDER of pairs...',
};

/* ------------------------------------------------------------------ */
/*  Level configs                                                      */
/* ------------------------------------------------------------------ */
const LEVELS: { cols: number; rows: number; pairs: number; memoryType: MemoryType }[] = [
  { cols: 4, rows: 3, pairs: 6,  memoryType: 'standard' },
  { cols: 4, rows: 4, pairs: 8,  memoryType: 'standard' },
  { cols: 5, rows: 4, pairs: 10, memoryType: 'colorOnly' },
  { cols: 6, rows: 4, pairs: 12, memoryType: 'shapeOnly' },
  { cols: 6, rows: 5, pairs: 15, memoryType: 'sequence' },
  { cols: 6, rows: 6, pairs: 18, memoryType: 'standard' },
];

const MAX_TIME = 240; // 4 minutes

function peekTime(level: number): number {
  return Math.max(1, 3 - level * 0.3);
}

/* ------------------------------------------------------------------ */
/*  Card type                                                          */
/* ------------------------------------------------------------------ */
interface Card {
  id: number;
  shapeIdx: number;
  colorIdx: number;
  matchKey: string;
  matched: boolean;
  seqOrder?: number;
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
function buildDeck(pairs: number, memoryType: MemoryType): Card[] {
  const cards: Card[] = [];

  if (memoryType === 'colorOnly') {
    // Pairs share the same color but have different shapes
    const colorPool = shuffle([...Array(COLORS.length).keys()]).slice(0, pairs);
    const shapePool = shuffle([...Array(SHAPES.length).keys()]);
    colorPool.forEach((cIdx, i) => {
      const s1 = shapePool[i % shapePool.length];
      const s2 = shapePool[(i + pairs) % shapePool.length !== s1 ? (i + pairs) % shapePool.length : (i + pairs + 1) % shapePool.length];
      const key = `color-${cIdx}`;
      cards.push({ id: i * 2, shapeIdx: s1, colorIdx: cIdx, matchKey: key, matched: false });
      cards.push({ id: i * 2 + 1, shapeIdx: s2 === s1 ? (s2 + 1) % SHAPES.length : s2, colorIdx: cIdx, matchKey: key, matched: false });
    });
  } else if (memoryType === 'shapeOnly') {
    // Pairs share the same shape but have different colors
    const shapePool = shuffle([...Array(SHAPES.length).keys()]).slice(0, pairs);
    const colorPool = shuffle([...Array(COLORS.length).keys()]);
    shapePool.forEach((sIdx, i) => {
      const c1 = colorPool[i % colorPool.length];
      const c2raw = colorPool[(i + pairs) % colorPool.length];
      const c2 = c2raw === c1 ? colorPool[(i + pairs + 1) % colorPool.length] : c2raw;
      const key = `shape-${sIdx}`;
      cards.push({ id: i * 2, shapeIdx: sIdx, colorIdx: c1, matchKey: key, matched: false });
      cards.push({ id: i * 2 + 1, shapeIdx: sIdx, colorIdx: c2, matchKey: key, matched: false });
    });
  } else {
    // standard or sequence: identical shape+color pairs
    const symbolPool: Array<[number, number]> = [];
    for (let i = 0; i < Math.min(SHAPES.length, COLORS.length); i++) {
      symbolPool.push([i, i]);
    }
    // extra combos beyond 15 if needed
    for (let i = 0; i < SHAPES.length && symbolPool.length < pairs + 5; i++) {
      for (let j = 0; j < COLORS.length && symbolPool.length < pairs + 5; j++) {
        if (i !== j) symbolPool.push([i, j]);
      }
    }
    const chosen = shuffle(symbolPool).slice(0, pairs);
    chosen.forEach(([sIdx, cIdx], i) => {
      const key = `${sIdx}-${cIdx}`;
      cards.push({ id: i * 2, shapeIdx: sIdx, colorIdx: cIdx, matchKey: key, matched: false });
      cards.push({ id: i * 2 + 1, shapeIdx: sIdx, colorIdx: cIdx, matchKey: key, matched: false });
    });
  }

  const shuffled = shuffle(cards);

  if (memoryType === 'sequence') {
    // Assign sequence order based on first appearance of each matchKey
    const seen = new Map<string, number>();
    let seq = 0;
    shuffled.forEach(card => {
      if (!seen.has(card.matchKey)) {
        seen.set(card.matchKey, seq++);
      }
      card.seqOrder = seen.get(card.matchKey)!;
    });
  }

  return shuffled;
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
/*  Personal best                                                      */
/* ------------------------------------------------------------------ */
const HS_KEY = 'memoryMarathon_hs';

function loadBest(): number {
  try {
    const v = localStorage.getItem(HS_KEY);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch { return 0; }
}

function saveBest(score: number): void {
  try { localStorage.setItem(HS_KEY, String(score)); } catch { /* noop */ }
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
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MemoryMarathon({ onBack, onGameEnd }: Props) {
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
  const [bestScore, setBestScore] = useState(loadBest);
  const [isNewBest, setIsNewBest] = useState(false);
  const [nextSeq, setNextSeq] = useState(0);
  const matchesRef = useRef(0);
  const mismatchesRef = useRef(0);
  const gameStartRef = useRef(Date.now());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const peekRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- VFX state ---------- */
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const vfxFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ---------- VFX animation loop ---------- */
  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      setParticles(prev => prev.length ? tickParticles(prev) : prev);
      setScorePops(prev => prev.length ? tickScorePops(prev) : prev);
      setShakeIntensity(prev => (prev > 0 ? prev * 0.85 : 0));
      vfxFrameRef.current = requestAnimationFrame(tick);
    };
    vfxFrameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(vfxFrameRef.current);
    };
  }, []);

  /* ---------- VFX helpers ---------- */
  const getRelativePos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 200, y: 200 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const spawnCorrectVfx = (x: number, y: number, points: number) => {
    setParticles(prev => [...prev, ...correctBurst(x, y)]);
    setScorePops(prev => [...prev, createScorePop(x, y - 10, points, '#00c97b')]);
    setShakeIntensity(1.5);
  };

  const spawnWrongVfx = (x: number, y: number) => {
    setParticles(prev => [...prev, ...wrongBurst(x, y)]);
    setShakeIntensity(2);
  };

  const spawnConfettiCenter = (big = false) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 280;
    const cy = rect ? rect.height / 2 : 300;
    const burst = confettiBurst(cx, cy);
    if (big) {
      setParticles(prev => [...prev, ...burst, ...confettiBurst(cx - 60, cy), ...confettiBurst(cx + 60, cy)]);
    } else {
      setParticles(prev => [...prev, ...burst]);
    }
  };

  /* inject keyframes */
  useEffect(() => { ensureKeyframes(); }, []);

  /* ---------- check personal best on game end ---------- */
  const checkBest = useCallback((finalScore: number) => {
    const prev = loadBest();
    if (finalScore > prev) {
      saveBest(finalScore);
      setBestScore(finalScore);
      setIsNewBest(true);
    }
  }, []);

  /* ---------- start level ---------- */
  const startLevel = useCallback((lvl: number) => {
    const cfg = LEVELS[lvl];
    const newDeck = buildDeck(cfg.pairs, cfg.memoryType);
    setDeck(newDeck);
    setFlipped([]);
    setMatchesFound(0);
    setMoves(0);
    setStreak(0);
    setLocked(true);
    setPhase('peek');
    setNextSeq(0);

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
      if (phase === 'timeUp') sfxGameOver();
    }
  }, [phase]);

  // Report score when game ends
  useEffect(() => {
    if (phase === 'victory' || phase === 'timeUp') {
      const total = matchesRef.current + mismatchesRef.current;
      checkBest(score);
      onGameEnd?.({ score, accuracy: total > 0 ? matchesRef.current / total : 0, level: level + 1, timeMs: elapsed * 1000 });
    }
  }, [phase, score, level, elapsed, onGameEnd, checkBest]);

  /* ---------- card click ---------- */
  const lastClickPos = useRef<{ x: number; y: number }>({ x: 200, y: 200 });

  const handleClick = (idx: number, e?: React.MouseEvent) => {
    if (locked) return;
    if (phase !== 'play') return;
    if (flipped.includes(idx)) return;
    if (deck[idx].matched) return;

    if (e) lastClickPos.current = getRelativePos(e);

    sfxReveal();
    const next = [...flipped, idx];
    setFlipped(next);

    if (next.length === 2) {
      setLocked(true);
      setMoves(m => m + 1);
      const [a, b] = next;
      const pos = lastClickPos.current;
      const keysMatch = deck[a].matchKey === deck[b].matchKey;
      const cfg = LEVELS[level];

      // Sequence mode: must match in order
      const seqValid = cfg.memoryType !== 'sequence' || deck[a].seqOrder === nextSeq;

      if (keysMatch && seqValid) {
        // match
        matchesRef.current++;
        const newStreak = streak + 1;
        setStreak(newStreak);
        const bonus = newStreak > 1 ? 20 : 0;
        const points = 50 + bonus;
        setScore(s => s + points);
        sfxCorrect();
        sfxScore();
        if (newStreak > 1) sfxCombo(newStreak);
        const newMatches = matchesFound + 1;
        setMatchesFound(newMatches);
        if (cfg.memoryType === 'sequence') setNextSeq(ns => ns + 1);

        // VFX: correct burst + score pop
        spawnCorrectVfx(pos.x, pos.y, points);

        setTimeout(() => {
          setDeck(d => d.map((c, i) => (i === a || i === b) ? { ...c, matched: true } : c));
          setFlipped([]);
          setLocked(false);

          // check level complete
          if (newMatches >= cfg.pairs) {
            if (level >= LEVELS.length - 1) {
              sfxGameOver();
              setPhase('victory');
              setLocked(true);
              spawnConfettiCenter(true);
            } else {
              sfxLevelUp();
              setPhase('levelComplete');
              setLocked(true);
              spawnConfettiCenter(false);
            }
          }
        }, 500);
      } else {
        // mismatch (or wrong sequence)
        mismatchesRef.current++;
        sfxWrong();
        setStreak(0);
        setScore(s => Math.max(0, s - 10));
        spawnWrongVfx(pos.x, pos.y);
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  /* ---------- next level ---------- */
  const advanceLevel = () => {
    sfxTap();
    const next = level + 1;
    setLevel(next);
    startLevel(next);
  };

  /* ---------- restart ---------- */
  const restart = () => {
    sfxTap();
    matchesRef.current = 0;
    mismatchesRef.current = 0;
    gameStartRef.current = Date.now();
    setLevel(0);
    setScore(0);
    setElapsed(0);
    setPhase('peek');
    setIsNewBest(false);
    setNextSeq(0);
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
  const iconSize = cfg.pairs > 12 ? 26 : cfg.pairs > 8 ? 28 : 32;

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
      maxWidth: cfg.cols >= 6 ? 620 : 560,
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
      fontWeight: 600,
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
    <div ref={containerRef} style={{ ...s.wrapper, position: 'relative', overflow: 'hidden', ...screenShakeStyle(shakeIntensity), ...comboGlowStyle(streak, T.accent) }}>
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
        <div style={{ ...s.stat, color: elapsed >= 200 ? T.error : T.text }}>
          <Clock size={14} />
          {fmt(elapsed)}
        </div>
        {bestScore > 0 && (
          <div style={{ ...s.stat, color: T.muted, fontSize: 12 }}>
            <Trophy size={12} color={T.muted} />
            Best: {bestScore}
          </div>
        )}
      </div>

      {/* --- Peek / mode banner --- */}
      {phase === 'peek' && (
        <div style={{
          color: T.accent,
          fontSize: 14,
          fontWeight: 600,
          padding: '8px 20px 4px',
          animation: 'mm-pulse 1s infinite',
          borderRadius: T.pill,
        }}>
          {MEMORY_TYPE_LABELS[cfg.memoryType]}
        </div>
      )}

      {/* --- Sequence indicator --- */}
      {phase === 'play' && cfg.memoryType === 'sequence' && (
        <div style={{
          color: T.accent,
          fontSize: 13,
          fontWeight: 600,
          padding: '4px 16px 8px',
        }}>
          Find pair #{nextSeq + 1} of {cfg.pairs}
        </div>
      )}

      {/* --- Grid --- */}
      <div style={s.grid}>
        {deck.map((card, idx) => {
          const revealed = isRevealed(idx);
          return (
            <div key={card.id} style={s.cardOuter} onClick={(e) => handleClick(idx, e)}>
              <div style={s.cardInner(revealed, card.matched, false)}>
                {/* Back face (face-down) */}
                <div style={{ ...s.cardFace, ...s.cardBack }}>
                  <Brain size={22} color={T.accent + '88'} />
                </div>
                {/* Front face (face-up, rotated 180) */}
                <div style={{ ...s.cardFace, ...s.cardFront(card.matched) }}>
                  <span style={{ userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {SHAPES[card.shapeIdx](iconSize, COLORS[card.colorIdx])}
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
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 600 }}>Level {level + 1} Complete</h2>
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
            <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 600 }}>Memory Marathon Complete</h2>
            {isNewBest && (
              <p style={{ color: '#f5c542', fontWeight: 600, fontSize: 14, margin: '6px 0 0' }}>
                New Best!
              </p>
            )}
            <p style={{ color: T.success, fontWeight: 700, fontSize: 28, margin: '8px 0' }}>
              {score} pts
            </p>
            <div style={{ color: T.muted, fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
              <div>Time: {fmt(elapsed)}</div>
              <div>Total Moves: {moves}</div>
              <div>All {LEVELS.length} levels cleared</div>
              {bestScore > 0 && !isNewBest && <div>Personal Best: {bestScore}</div>}
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
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 600 }}>Time's Up</h2>
            {isNewBest && (
              <p style={{ color: '#f5c542', fontWeight: 600, fontSize: 14, margin: '0 0 6px' }}>
                New Best!
              </p>
            )}
            <p style={{ color: T.muted, margin: '0 0 6px', fontSize: 14 }}>
              Reached Level {level + 1} &middot; Score: {score}
            </p>
            <p style={{ color: T.muted, margin: '0 0 6px', fontSize: 13 }}>
              Complete all levels within 4 minutes to win
            </p>
            {bestScore > 0 && !isNewBest && (
              <p style={{ color: T.muted, margin: '0 0 20px', fontSize: 13 }}>
                Personal Best: {bestScore}
              </p>
            )}
            {(isNewBest || bestScore === 0) && <div style={{ marginBottom: 20 }} />}
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

      {/* --- VFX: Particles --- */}
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}

      {/* --- VFX: Score Pops --- */}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </div>
  );
}
