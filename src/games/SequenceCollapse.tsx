import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Heart, Zap, Trophy, RotateCcw, Clock, Brain, Star } from 'lucide-react';
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver, sfxLevelUp, sfxCombo } from '../lib/sfx';
import { type Particle, type ScorePop, correctBurst, wrongBurst, confettiBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle, comboGlowStyle } from '../lib/vfx';

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

/* ------------------------------------------------------------------ */
/*  Sequence color palette (for color-type sequences)                  */
/* ------------------------------------------------------------------ */
const SEQ_COLORS: { name: string; hex: string }[] = [
  { name: 'Red', hex: '#e74c3c' },
  { name: 'Blue', hex: '#3498db' },
  { name: 'Green', hex: '#2ecc71' },
  { name: 'Yellow', hex: '#f1c40f' },
  { name: 'Purple', hex: '#9b59b6' },
  { name: 'Orange', hex: '#e67e22' },
  { name: 'Cyan', hex: '#00bcd4' },
  { name: 'Pink', hex: '#ec407a' },
];

/* ------------------------------------------------------------------ */
/*  Shape definitions                                                  */
/* ------------------------------------------------------------------ */
const SHAPE_NAMES = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon', 'cross', 'star'] as const;
type ShapeName = (typeof SHAPE_NAMES)[number];

const SHAPE_COLORS = ['#3a86ff', '#00c97b', '#f59e0b', '#7b2ff7', '#00b4d8', '#f43f5e', '#ec407a', '#e67e22'];

function renderShapeSVG(shape: ShapeName, size: number, fill: string): React.ReactNode {
  const half = size / 2;
  const commonProps = { width: size, height: size, viewBox: `0 0 ${size} ${size}`, xmlns: 'http://www.w3.org/2000/svg' };

  switch (shape) {
    case 'circle':
      return <svg {...commonProps}><circle cx={half} cy={half} r={half * 0.8} fill={fill} /></svg>;
    case 'square':
      return <svg {...commonProps}><rect x={size * 0.1} y={size * 0.1} width={size * 0.8} height={size * 0.8} rx={2} fill={fill} /></svg>;
    case 'triangle':
      return <svg {...commonProps}><polygon points={`${half},${size * 0.1} ${size * 0.9},${size * 0.9} ${size * 0.1},${size * 0.9}`} fill={fill} /></svg>;
    case 'diamond':
      return <svg {...commonProps}><polygon points={`${half},${size * 0.05} ${size * 0.95},${half} ${half},${size * 0.95} ${size * 0.05},${half}`} fill={fill} /></svg>;
    case 'pentagon': {
      const pts = Array.from({ length: 5 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        return `${half + half * 0.8 * Math.cos(a)},${half + half * 0.8 * Math.sin(a)}`;
      }).join(' ');
      return <svg {...commonProps}><polygon points={pts} fill={fill} /></svg>;
    }
    case 'hexagon': {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 6;
        return `${half + half * 0.8 * Math.cos(a)},${half + half * 0.8 * Math.sin(a)}`;
      }).join(' ');
      return <svg {...commonProps}><polygon points={pts} fill={fill} /></svg>;
    }
    case 'cross':
      return (
        <svg {...commonProps}>
          <rect x={size * 0.35} y={size * 0.1} width={size * 0.3} height={size * 0.8} rx={2} fill={fill} />
          <rect x={size * 0.1} y={size * 0.35} width={size * 0.8} height={size * 0.3} rx={2} fill={fill} />
        </svg>
      );
    case 'star': {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        const r = i % 2 === 0 ? half * 0.8 : half * 0.35;
        return `${half + r * Math.cos(a)},${half + r * Math.sin(a)}`;
      }).join(' ');
      return <svg {...commonProps}><polygon points={pts} fill={fill} /></svg>;
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Chip accent palette (for number chips)                             */
/* ------------------------------------------------------------------ */
const CHIP_COLORS = [C.sapphire, C.emerald, C.teal, C.violet, C.amber, C.rose];

/* ------------------------------------------------------------------ */
/*  Sequence element types                                             */
/* ------------------------------------------------------------------ */
type SeqKind = 'number' | 'color' | 'shape' | 'mixed';

interface SeqElement {
  kind: SeqKind;
  value?: number;
  colorName?: string;
  colorHex?: string;
  shapeName?: ShapeName;
  shapeColor?: string;
}

function elemEq(a: SeqElement, b: SeqElement): boolean {
  return a.value === b.value && a.colorName === b.colorName && a.shapeName === b.shapeName;
}

function elemKey(el: SeqElement): string {
  return `${el.value ?? ''}_${el.colorName ?? ''}_${el.shapeName ?? ''}`;
}

/* ------------------------------------------------------------------ */
/*  Puzzle                                                             */
/* ------------------------------------------------------------------ */
interface Puzzle {
  elements: SeqElement[];
  answer: SeqElement;
  options: SeqElement[];
  label: string;
  kind: SeqKind;
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = shuffle(arr);
  return shuffled.slice(0, n);
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

function triangularNum(n: number): number {
  return (n * (n + 1)) / 2;
}

/* ------------------------------------------------------------------ */
/*  Number decoy generation                                            */
/* ------------------------------------------------------------------ */
function numDecoys(answer: number, count: number): number[] {
  const decoys = new Set<number>();
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, 4, -4, 5, -5]);
  for (const o of offsets) {
    if (decoys.size >= count) break;
    const v = answer + o;
    if (v !== answer && v >= 0) decoys.add(v);
  }
  while (decoys.size < count) {
    const v = answer + randInt(-8, 8);
    if (v !== answer && v >= 0) decoys.add(v);
  }
  return [...decoys].slice(0, count);
}

/* ------------------------------------------------------------------ */
/*  Number sequence generators                                         */
/* ------------------------------------------------------------------ */
type NumSeqType = 'arithmetic' | 'geometric' | 'fibonacci' | 'primes' | 'squares' | 'triangular' | 'alternating' | 'threeOp';

function buildNumberPuzzle(level: number): Puzzle {
  const seqLen = Math.min(4 + Math.floor(level / 3), 8);

  /* pick type based on level */
  const pool: NumSeqType[] = ['arithmetic'];
  if (level >= 2) pool.push('arithmetic'); /* weight it */
  if (level >= 4) pool.push('geometric');
  if (level >= 5) pool.push('fibonacci', 'squares');
  if (level >= 6) pool.push('primes', 'triangular');
  if (level >= 7) pool.push('alternating');
  if (level >= 10) pool.push('threeOp');

  const type = pick(pool);
  let seq: number[] = [];
  let label: string;

  switch (type) {
    case 'arithmetic': {
      const step = randInt(2, 4 + Math.floor(level / 2));
      const start = randInt(1, 20);
      for (let i = 0; i <= seqLen; i++) seq.push(start + step * i);
      label = `+${step}`;
      break;
    }
    case 'geometric': {
      const ratio = randInt(2, 3);
      const start = randInt(1, 4);
      for (let i = 0; i <= seqLen; i++) seq.push(start * Math.pow(ratio, i));
      label = `x${ratio}`;
      break;
    }
    case 'fibonacci': {
      const a = randInt(1, 5);
      const b = randInt(1, 5);
      seq = [a, b];
      while (seq.length <= seqLen) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
      label = 'Fibonacci-like';
      break;
    }
    case 'primes': {
      const offset = randInt(0, 4);
      for (let i = 1; i <= seqLen + 1; i++) seq.push(nthPrime(i + offset));
      label = 'Primes';
      break;
    }
    case 'squares': {
      const offset = randInt(1, 4);
      for (let i = offset; i <= seqLen + offset; i++) seq.push(i * i);
      label = 'Perfect squares';
      break;
    }
    case 'triangular': {
      const offset = randInt(1, 4);
      for (let i = offset; i <= seqLen + offset; i++) seq.push(triangularNum(i));
      label = 'Triangular numbers';
      break;
    }
    case 'alternating': {
      const stepA = randInt(2, 5);
      const stepB = randInt(2, 5);
      const start = randInt(1, 10);
      seq = [start];
      for (let i = 1; i <= seqLen; i++) {
        seq.push(seq[i - 1] + (i % 2 === 1 ? stepA : stepB));
      }
      label = `Alt +${stepA}/+${stepB}`;
      break;
    }
    case 'threeOp': {
      const ops = [randInt(2, 4), randInt(1, 3), randInt(2, 5)];
      const opNames = ['+', '+', '+'];
      /* randomize between add and multiply */
      if (Math.random() > 0.5) { opNames[0] = 'x'; }
      if (Math.random() > 0.5) { opNames[2] = 'x'; }
      const start = randInt(2, 6);
      seq = [start];
      for (let i = 1; i <= seqLen; i++) {
        const opIdx = (i - 1) % 3;
        const prev = seq[i - 1];
        if (opNames[opIdx] === 'x') {
          seq.push(prev * ops[opIdx]);
        } else {
          seq.push(prev + ops[opIdx]);
        }
      }
      label = `3-op: ${opNames.map((n, i) => `${n}${ops[i]}`).join(' / ')}`;
      break;
    }
  }

  const answer = seq[seqLen];
  const visible = seq.slice(0, seqLen);
  const decoys = numDecoys(answer, 3);

  const toEl = (v: number): SeqElement => ({ kind: 'number', value: v });
  const allOptions = shuffle([toEl(answer), ...decoys.map(toEl)]);

  return {
    elements: visible.map(toEl),
    answer: toEl(answer),
    options: allOptions,
    label,
    kind: 'number',
  };
}

/* ------------------------------------------------------------------ */
/*  Color sequence generators                                          */
/* ------------------------------------------------------------------ */
function buildColorPuzzle(level: number): Puzzle {
  /* Pattern length increases with level */
  const patternLen = Math.min(2 + Math.floor(level / 3), 5);
  const palette = pickN(SEQ_COLORS, patternLen);
  const pattern = palette.map(c => c);

  /* How many full repeats + partial to show */
  const totalLen = Math.min(patternLen * 2 + Math.floor(level / 4), patternLen * 3 + 1);
  const fullSeq: typeof SEQ_COLORS = [];
  for (let i = 0; i <= totalLen; i++) {
    fullSeq.push(pattern[i % patternLen]);
  }

  const answer = fullSeq[totalLen];
  const visible = fullSeq.slice(0, totalLen);

  const toEl = (c: { name: string; hex: string }): SeqElement => ({
    kind: 'color',
    colorName: c.name,
    colorHex: c.hex,
  });

  /* Decoys: colors NOT equal to answer */
  const otherColors = SEQ_COLORS.filter(c => c.name !== answer.name);
  const decoyColors = pickN(otherColors, 3);
  const allOptions = shuffle([toEl(answer), ...decoyColors.map(toEl)]);

  return {
    elements: visible.map(toEl),
    answer: toEl(answer),
    options: allOptions,
    label: `${patternLen}-color pattern`,
    kind: 'color',
  };
}

/* ------------------------------------------------------------------ */
/*  Shape sequence generators                                          */
/* ------------------------------------------------------------------ */
function buildShapePuzzle(level: number): Puzzle {
  const patternLen = Math.min(2 + Math.floor(level / 4), 5);
  const shapes = pickN([...SHAPE_NAMES], patternLen);
  const colors = pickN(SHAPE_COLORS, patternLen);

  const totalLen = Math.min(patternLen * 2 + Math.floor(level / 3), patternLen * 3 + 1);
  const fullSeq: { shape: ShapeName; color: string }[] = [];
  for (let i = 0; i <= totalLen; i++) {
    fullSeq.push({ shape: shapes[i % patternLen], color: colors[i % patternLen] });
  }

  const ans = fullSeq[totalLen];
  const visible = fullSeq.slice(0, totalLen);

  const toEl = (s: { shape: ShapeName; color: string }): SeqElement => ({
    kind: 'shape',
    shapeName: s.shape,
    shapeColor: s.color,
  });

  /* Decoys: different shapes */
  const otherShapes = SHAPE_NAMES.filter(s => s !== ans.shape);
  const decoyShapes = pickN([...otherShapes], 3);
  const decoyEls = decoyShapes.map(s => toEl({ shape: s, color: pick(SHAPE_COLORS) }));
  const allOptions = shuffle([toEl(ans), ...decoyEls]);

  return {
    elements: visible.map(toEl),
    answer: toEl(ans),
    options: allOptions,
    label: `${patternLen}-shape pattern`,
    kind: 'shape',
  };
}

/* ------------------------------------------------------------------ */
/*  Mixed sequence generators                                          */
/* ------------------------------------------------------------------ */
function buildMixedPuzzle(level: number): Puzzle {
  /* Numbers follow a pattern, displayed on colored backgrounds that also follow a pattern */
  const numStep = randInt(2, 3 + Math.floor(level / 3));
  const start = randInt(1, 10);
  const colorPatternLen = Math.min(2 + Math.floor(level / 5), 4);
  const palette = pickN(SEQ_COLORS, colorPatternLen);

  const seqLen = Math.min(4 + Math.floor(level / 3), 7);
  const fullNums: number[] = [];
  const fullColors: typeof SEQ_COLORS = [];

  for (let i = 0; i <= seqLen; i++) {
    fullNums.push(start + numStep * i);
    fullColors.push(palette[i % colorPatternLen]);
  }

  const answerNum = fullNums[seqLen];
  const answerColor = fullColors[seqLen];
  const visibleNums = fullNums.slice(0, seqLen);
  const visibleColors = fullColors.slice(0, seqLen);

  const toEl = (v: number, c: { name: string; hex: string }): SeqElement => ({
    kind: 'mixed',
    value: v,
    colorName: c.name,
    colorHex: c.hex,
  });

  const answerEl = toEl(answerNum, answerColor);

  /* Decoys: wrong number OR wrong color */
  const decoys: SeqElement[] = [];
  /* Wrong number, right color */
  const wrongNums = numDecoys(answerNum, 2);
  for (const wn of wrongNums) {
    decoys.push(toEl(wn, answerColor));
  }
  /* Right number, wrong color */
  const wrongColor = SEQ_COLORS.filter(c => c.name !== answerColor.name);
  decoys.push(toEl(answerNum, pick(wrongColor)));

  const allOptions = shuffle([answerEl, ...decoys.slice(0, 3)]);

  return {
    elements: visibleNums.map((v, i) => toEl(v, visibleColors[i])),
    answer: answerEl,
    options: allOptions,
    label: `+${numStep} + ${colorPatternLen}-color`,
    kind: 'mixed',
  };
}

/* ------------------------------------------------------------------ */
/*  Master puzzle builder                                              */
/* ------------------------------------------------------------------ */
function buildPuzzle(level: number): Puzzle {
  /* Decide which kind based on level */
  const pool: SeqKind[] = ['number'];
  if (level >= 2) pool.push('color');
  if (level >= 4) pool.push('shape');
  if (level >= 7) pool.push('mixed');

  /* Weight numbers more at early levels */
  if (level <= 3) pool.push('number', 'number');
  if (level >= 5 && level <= 8) pool.push('color', 'shape');
  if (level >= 9) pool.push('mixed', 'mixed');

  const kind = pick(pool);

  switch (kind) {
    case 'color': return buildColorPuzzle(level);
    case 'shape': return buildShapePuzzle(level);
    case 'mixed': return buildMixedPuzzle(level);
    default: return buildNumberPuzzle(level);
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

type GameState = 'menu' | 'playing' | 'correct' | 'wrong' | 'gameover';

export default function SequenceCollapse({ onBack, onGameEnd }: Props) {
  const [state, setState] = useState<GameState>('menu');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [selected, setSelected] = useState<number | null>(null); /* index into options */
  const [timer, setTimer] = useState(20);
  const [maxTimer, setMaxTimer] = useState(20);
  const [fadeIn, setFadeIn] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isSpeedRound, setIsSpeedRound] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const mountRef = useRef(true);
  const correctRef = useRef(0);
  const attemptsRef = useRef(0);
  const gameStartRef = useRef(Date.now());
  const answerTimeRef = useRef(Date.now());

  /* cleanup on unmount */
  useEffect(() => {
    mountRef.current = true;
    return () => {
      mountRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* VFX animation loop */
  useEffect(() => {
    if (particles.length === 0 && scorePops.length === 0 && shakeIntensity <= 0.01) return;
    const tick = () => {
      setParticles(prev => tickParticles(prev));
      setScorePops(prev => tickScorePops(prev));
      setShakeIntensity(prev => prev * 0.85);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0.01]);

  /* Report score when game ends */
  useEffect(() => {
    if (state === 'gameover') {
      const total = attemptsRef.current;
      const correct = correctRef.current;
      onGameEnd?.({
        score,
        accuracy: total > 0 ? correct / total : 0,
        level,
        timeMs: Date.now() - gameStartRef.current,
      });
    }
  }, [state, score, level, onGameEnd]);

  /* start a new puzzle */
  const nextPuzzle = useCallback((lvl: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFadeIn(false);

    const speed = lvl > 1 && lvl % 5 === 0;
    setIsSpeedRound(speed);
    const timeLimit = speed ? 3 : Math.max(10, 20 - Math.floor(lvl / 4));
    setMaxTimer(timeLimit);

    const p = buildPuzzle(lvl);
    setPuzzle(p);
    setSelected(null);
    setTimer(timeLimit);
    setState('playing');
    answerTimeRef.current = Date.now();

    requestAnimationFrame(() => {
      if (mountRef.current) setFadeIn(true);
    });

    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          sfxWrong();
          attemptsRef.current++;
          setStreak(0);
          setLives(prev => {
            const next = prev - 1;
            if (next <= 0) {
              sfxGameOver();
              setState('gameover');
            } else {
              setState('wrong');
            }
            return next;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  /* handle answer pick */
  const handlePick = useCallback((idx: number) => {
    if (state !== 'playing' || selected !== null || !puzzle) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(idx);

    const picked = puzzle.options[idx];
    const isCorrect = elemEq(picked, puzzle.answer);

    if (isCorrect) {
      sfxCorrect();
      correctRef.current++;
      attemptsRef.current++;

      const elapsed = Date.now() - answerTimeRef.current;
      const speedBonus = Math.max(0, Math.floor((1 - elapsed / (maxTimer * 1000)) * 50));
      const levelBonus = level * 10;
      const newStreak = streak + 1;
      const streakPts = newStreak >= 3 ? newStreak * 5 : 0;
      const speedRoundBonus = isSpeedRound ? 100 : 0;
      const totalPts = levelBonus + speedBonus + streakPts + speedRoundBonus;

      if (newStreak >= 3) sfxCombo(newStreak);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        setParticles(prev => [...prev, ...correctBurst(cx, cy)]);
        setScorePops(prev => [...prev, createScorePop(cx, cy - 40, totalPts, '#00c97b')]);
      }

      setScore(s => s + totalPts);
      setStreak(newStreak);
      setState('correct');
    } else {
      sfxWrong();
      attemptsRef.current++;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setParticles(prev => [...prev, ...wrongBurst(rect.width / 2, rect.height / 2)]);
        setShakeIntensity(3);
      }
      setStreak(0);
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) {
          sfxGameOver();
          setState('gameover');
        } else {
          setState('wrong');
        }
        return next;
      });
    }
  }, [state, selected, puzzle, level, streak, isSpeedRound, maxTimer]);

  /* advance after feedback */
  const advance = useCallback(() => {
    if (state === 'correct') {
      sfxLevelUp();
      if (containerRef.current && (level + 1) % 5 === 0) {
        const rect = containerRef.current.getBoundingClientRect();
        setParticles(prev => [...prev, ...confettiBurst(rect.width / 2, rect.height / 3)]);
      }
      const next = level + 1;
      setLevel(next);
      nextPuzzle(next);
    } else if (state === 'wrong') {
      sfxTap();
      nextPuzzle(level);
    }
  }, [state, level, nextPuzzle]);

  /* start game */
  const startGame = useCallback(() => {
    sfxTap();
    correctRef.current = 0;
    attemptsRef.current = 0;
    gameStartRef.current = Date.now();
    setLevel(1);
    setScore(0);
    setLives(3);
    setStreak(0);
    nextPuzzle(1);
  }, [nextPuzzle]);

  /* ---------------------------------------------------------------- */
  /*  Element rendering                                                */
  /* ---------------------------------------------------------------- */
  const renderElement = (el: SeqElement, size: number, showLabel: boolean): React.ReactNode => {
    switch (el.kind) {
      case 'number':
        return (
          <span style={{ fontSize: size > 40 ? 20 : 16, fontWeight: 600, color: '#fff' }}>
            {el.value}
          </span>
        );
      case 'color':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: size * 0.7,
              height: size * 0.5,
              borderRadius: C.radius.sm,
              background: el.colorHex,
            }} />
            {showLabel && (
              <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: '0.02em' }}>
                {el.colorName}
              </span>
            )}
          </div>
        );
      case 'shape':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {renderShapeSVG(el.shapeName!, size * 0.65, el.shapeColor || C.sapphire)}
            {showLabel && (
              <span style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: 'capitalize' }}>
                {el.shapeName}
              </span>
            )}
          </div>
        );
      case 'mixed':
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}>
            <span style={{ fontSize: size > 40 ? 18 : 14, fontWeight: 600, color: '#fff' }}>
              {el.value}
            </span>
          </div>
        );
    }
  };

  const getChipBg = (el: SeqElement, idx: number): string => {
    if (el.kind === 'color') return C.slate;
    if (el.kind === 'mixed') return el.colorHex || CHIP_COLORS[idx % CHIP_COLORS.length];
    return CHIP_COLORS[idx % CHIP_COLORS.length];
  };

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
    padding: '4px 8px',
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
    width: `${(timer / maxTimer) * 100}%`,
    background: timer <= 3 ? C.rose : isSpeedRound ? C.amber : C.sapphire,
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

  const getOptionStyle = (idx: number): React.CSSProperties => {
    if (!puzzle) return {};
    const el = puzzle.options[idx];
    let bg: string = C.surface;
    let borderColor: string = C.border;
    let textColor: string = C.white;

    if (selected !== null) {
      const isAnswer = elemEq(el, puzzle.answer);
      if (isAnswer) {
        bg = C.emerald;
        borderColor = C.emerald;
        textColor = '#000';
      } else if (idx === selected) {
        bg = C.rose;
        borderColor = C.rose;
        textColor = '#fff';
      }
    }

    /* For mixed options, show the color background when not in feedback state */
    if (el.kind === 'mixed' && selected === null && el.colorHex) {
      bg = el.colorHex;
      borderColor = el.colorHex;
    }

    return {
      background: bg,
      border: `2px solid ${borderColor}`,
      borderRadius: C.radius.md,
      padding: '14px 12px',
      fontSize: 20,
      fontWeight: 600,
      color: textColor,
      cursor: selected !== null ? 'default' : 'pointer',
      textAlign: 'center' as const,
      boxShadow: `${C.edge}, ${C.shadow}`,
      transition: C.transition,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 60,
      gap: 8,
    };
  };

  /* ---------------------------------------------------------------- */
  /*  Keyframes                                                        */
  /* ---------------------------------------------------------------- */
  const keyframesStyle = `
    @keyframes pulse-glow {
      0%, 100% { box-shadow: ${C.edge}, 0 0 0 0 rgba(58,134,255,0.25); }
      50% { box-shadow: ${C.edge}, 0 0 18px 4px rgba(58,134,255,0.3); }
    }
    @keyframes speed-flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
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
      <Clock size={14} color={timer <= 3 ? C.rose : C.muted} />
      <span style={{
        color: timer <= 3 ? C.rose : C.white,
        fontVariantNumeric: 'tabular-nums',
        animation: timer <= 3 ? 'speed-flash 0.5s ease-in-out infinite' : 'none',
      }}>
        {timer}s
      </span>
    </div>
  );

  const renderOptionContent = (el: SeqElement): React.ReactNode => {
    switch (el.kind) {
      case 'number':
        return <span>{el.value}</span>;
      case 'color':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: el.colorHex,
              border: '2px solid rgba(255,255,255,0.2)',
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 15 }}>{el.colorName}</span>
          </div>
        );
      case 'shape':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {renderShapeSVG(el.shapeName!, 28, el.shapeColor || C.sapphire)}
            <span style={{ fontSize: 14, textTransform: 'capitalize' }}>{el.shapeName}</span>
          </div>
        );
      case 'mixed':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: el.colorHex,
              border: '1px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
            }} />
            <span>{el.value}</span>
          </div>
        );
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Menu screen                                                      */
  /* ---------------------------------------------------------------- */
  if (state === 'menu') {
    return (
      <div ref={containerRef} style={{ ...wrap, position: 'relative', overflow: 'hidden' }}>
        <style>{keyframesStyle}</style>
        <div style={headerRow}>
          <button style={backBtn} onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <div style={{ ...card, textAlign: 'center' }}>
          <Brain size={56} color={C.sapphire} style={{ marginBottom: 16 }} />
          <h1 style={{ fontSize: 32, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Sequence Collapse
          </h1>
          <p style={{ color: C.muted, fontSize: 15, margin: '0 0 24px', lineHeight: 1.6 }}>
            Predict the next element in increasingly complex sequences.
            Numbers, colors, shapes, and mixed patterns -- each level harder than the last.
          </p>

          {/* Feature badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}>
            <div style={{ ...badge, gap: 8 }}>
              <Heart size={14} fill={C.rose} color={C.rose} /> 3 Lives
            </div>
            <div style={{ ...badge, gap: 8 }}>
              <Clock size={14} color={C.sapphire} /> Timed
            </div>
            <div style={{ ...badge, gap: 8 }}>
              <Zap size={14} color={C.amber} /> Speed Rounds
            </div>
          </div>

          {/* Sequence types preview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            marginBottom: 24,
          }}>
            {[
              { label: 'Numbers', desc: 'Arithmetic, primes, Fibonacci', color: C.sapphire },
              { label: 'Colors', desc: 'Repeating color patterns', color: C.emerald },
              { label: 'Shapes', desc: 'Shape and rotation patterns', color: C.violet },
              { label: 'Mixed', desc: 'Combined number + color', color: C.amber },
            ].map(t => (
              <div key={t.label} style={{
                background: C.slate,
                borderRadius: C.radius.md,
                padding: '12px 14px',
                textAlign: 'left',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: t.color, marginBottom: 3 }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
                  {t.desc}
                </div>
              </div>
            ))}
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
    const accuracy = attemptsRef.current > 0
      ? Math.round((correctRef.current / attemptsRef.current) * 100)
      : 0;

    return (
      <div ref={containerRef} style={{ ...wrap, position: 'relative', overflow: 'hidden' }}>
        <style>{keyframesStyle}</style>
        <div style={headerRow}>
          <button style={backBtn} onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <div style={{ ...card, textAlign: 'center' }}>
          <Trophy size={56} color={C.amber} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 28, fontWeight: 600, margin: '0 0 8px' }}>Game Over</h2>
          <p style={{ color: C.muted, fontSize: 15, margin: '0 0 8px' }}>
            You reached level {level}
          </p>
          <p style={{
            fontSize: 40,
            fontWeight: 600,
            color: C.sapphire,
            margin: '12px 0 20px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {score}
          </p>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.emerald }}>{correctRef.current}</div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Correct</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.amber }}>{accuracy}%</div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Accuracy</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: C.violet }}>
                {Math.round((Date.now() - gameStartRef.current) / 1000)}s
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>Time</div>
            </div>
          </div>

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
    <div ref={containerRef} style={{
      ...wrap,
      position: 'relative',
      overflow: 'hidden',
      ...screenShakeStyle(shakeIntensity),
      ...comboGlowStyle(streak, '#f59e0b'),
    }}>
      <style>{keyframesStyle}</style>

      {/* Header HUD */}
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
        {/* Level + streak + speed round indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              Level {level}
            </span>
            {isSpeedRound && (
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.amber,
                background: 'rgba(245,158,11,0.15)',
                padding: '2px 8px',
                borderRadius: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                animation: 'speed-flash 0.8s ease-in-out infinite',
              }}>
                Speed Round
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {puzzle && (
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.dim,
                textTransform: 'capitalize',
              }}>
                {puzzle.kind}
              </span>
            )}
            {streak >= 2 && (
              <span style={{ fontSize: 13, fontWeight: 700, color: C.amber }}>
                <Star size={12} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                {streak}x
              </span>
            )}
          </div>
        </div>

        {/* Timer bar */}
        <div style={timerBar}>
          <div style={timerFill} />
        </div>

        {/* Sequence chips */}
        {puzzle && (
          <>
            <div style={{
              ...chipRow,
              overflowX: 'auto',
              flexWrap: puzzle.elements.length > 6 ? 'nowrap' : 'wrap',
              paddingBottom: 4,
            }}>
              {puzzle.elements.map((el, i) => (
                <div
                  key={i}
                  style={{
                    ...chipBase,
                    background: getChipBg(el, i),
                    color: '#fff',
                    transitionDelay: `${i * 60}ms`,
                    transform: fadeIn ? 'scale(1)' : 'scale(0.7)',
                    opacity: fadeIn ? 1 : 0,
                    flexShrink: 0,
                    minWidth: puzzle.kind === 'shape' ? 56 : 52,
                    minHeight: puzzle.kind === 'shape' ? 56 : 52,
                  }}
                >
                  {renderElement(el, 52, false)}
                </div>
              ))}
              <div style={{
                ...questionChip,
                flexShrink: 0,
                minWidth: puzzle.kind === 'shape' ? 56 : 52,
                minHeight: puzzle.kind === 'shape' ? 56 : 52,
              }}>
                ?
              </div>
            </div>

            {/* Feedback text */}
            {state === 'correct' && (
              <p style={{
                textAlign: 'center',
                color: C.emerald,
                fontWeight: 700,
                fontSize: 16,
                margin: '0 0 16px',
              }}>
                Correct! Pattern: {puzzle.label}
              </p>
            )}
            {state === 'wrong' && (
              <p style={{
                textAlign: 'center',
                color: C.rose,
                fontWeight: 700,
                fontSize: 16,
                margin: '0 0 16px',
              }}>
                Wrong! The answer was:{' '}
                {puzzle.answer.kind === 'number'
                  ? puzzle.answer.value
                  : puzzle.answer.kind === 'color'
                    ? puzzle.answer.colorName
                    : puzzle.answer.kind === 'shape'
                      ? puzzle.answer.shapeName
                      : `${puzzle.answer.value} (${puzzle.answer.colorName})`}
                {' '}({puzzle.label})
              </p>
            )}

            {/* Options grid */}
            <div style={optionGrid}>
              {puzzle.options.map((el, idx) => (
                <button
                  key={elemKey(el) + '_' + idx}
                  style={getOptionStyle(idx)}
                  onClick={() => handlePick(idx)}
                  disabled={selected !== null}
                >
                  {renderOptionContent(el)}
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

      {/* VFX particles */}
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </div>
  );
}
