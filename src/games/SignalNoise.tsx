import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Clock,
  Heart,
  Star,
  Trophy,
  Zap,
  Target,
  RotateCcw,
  ChevronRight,
  Eye,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  DESIGN TOKENS                                                      */
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
} as const;

const GLASS = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
};

const R = { sm: 8, md: 14, lg: 20 };

/* ------------------------------------------------------------------ */
/*  RULE ENGINE                                                        */
/* ------------------------------------------------------------------ */

const PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]);
const ANIMALS = ['cat', 'dog', 'fox', 'owl', 'bat', 'ant', 'bee', 'elk', 'emu', 'hen', 'cow', 'pig', 'yak', 'ram', 'ape', 'rat'];
const NON_ANIMALS = ['car', 'box', 'hat', 'sun', 'pen', 'cup', 'bag', 'map', 'key', 'tin', 'jar', 'rug', 'pan', 'fan', 'ice', 'mud', 'log', 'net', 'pie', 'gem', 'oak', 'dew', 'fog', 'wax', 'ore', 'ash'];
const FRUITS = ['apple', 'mango', 'grape', 'lemon', 'peach', 'berry', 'melon', 'guava', 'plum', 'pear', 'lime', 'kiwi', 'fig', 'date'];
const NON_FRUITS = ['table', 'chair', 'stone', 'cloud', 'flame', 'river', 'sword', 'tower', 'crown', 'chess', 'stamp', 'globe', 'brick', 'scale', 'paint', 'wheel', 'badge'];
const COLORS_LIST = ['red', 'blue', 'gold', 'pink', 'gray', 'teal', 'lime', 'cyan', 'navy', 'plum'];
const NON_COLORS = ['run', 'big', 'hot', 'fly', 'old', 'new', 'top', 'low', 'dry', 'raw', 'mad', 'far', 'odd', 'sad', 'fit', 'set', 'cut', 'hit'];

interface Rule {
  label: string;
  generate: (count: number) => { signals: string[]; noise: string[] };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

const RULES: Rule[] = [
  {
    label: 'Find all PRIME numbers',
    generate: (count) => {
      const primeArr = shuffle([...PRIMES]);
      const signalCount = Math.min(count, primeArr.length);
      const signals = primeArr.slice(0, signalCount).map(String);
      const noise: string[] = [];
      while (noise.length < count * 3) {
        const n = randInt(1, 99);
        if (!PRIMES.has(n)) noise.push(String(n));
      }
      return { signals, noise: noise.slice(0, count * 3) };
    },
  },
  {
    label: 'Find all EVEN numbers',
    generate: (count) => {
      const signals: string[] = [];
      const used = new Set<number>();
      while (signals.length < count) {
        const n = randInt(1, 50) * 2;
        if (!used.has(n)) { used.add(n); signals.push(String(n)); }
      }
      const noise: string[] = [];
      while (noise.length < count * 3) {
        const n = randInt(0, 24) * 2 + 1;
        if (!used.has(n)) { used.add(n); noise.push(String(n)); }
      }
      return { signals, noise };
    },
  },
  {
    label: 'Find all ANIMALS',
    generate: (count) => {
      const signals = pickN(ANIMALS, Math.min(count, ANIMALS.length));
      const noise = pickN(NON_ANIMALS, Math.min(count * 3, NON_ANIMALS.length));
      return { signals, noise };
    },
  },
  {
    label: 'Find numbers GREATER than 50',
    generate: (count) => {
      const signals: string[] = [];
      const used = new Set<number>();
      while (signals.length < count) {
        const n = randInt(51, 99);
        if (!used.has(n)) { used.add(n); signals.push(String(n)); }
      }
      const noise: string[] = [];
      while (noise.length < count * 3) {
        const n = randInt(1, 50);
        if (!used.has(n)) { used.add(n); noise.push(String(n)); }
      }
      return { signals, noise };
    },
  },
  {
    label: 'Find words starting with vowels',
    generate: (count) => {
      const vowelWords = ['ant', 'owl', 'eel', 'ape', 'ice', 'oak', 'egg', 'ear', 'eye', 'art', 'age', 'oil', 'air', 'arm', 'inn', 'urn'];
      const conWords = ['bat', 'cat', 'dog', 'fox', 'hat', 'jar', 'key', 'log', 'map', 'net', 'pen', 'rug', 'sun', 'tin', 'wax', 'gem'];
      return { signals: pickN(vowelWords, Math.min(count, vowelWords.length)), noise: pickN(conWords, Math.min(count * 3, conWords.length)) };
    },
  },
  {
    label: 'Find all FRUITS',
    generate: (count) => {
      const signals = pickN(FRUITS, Math.min(count, FRUITS.length));
      const noise = pickN(NON_FRUITS, Math.min(count * 3, NON_FRUITS.length));
      return { signals, noise };
    },
  },
  {
    label: 'Find multiples of 3',
    generate: (count) => {
      const signals: string[] = [];
      const used = new Set<number>();
      while (signals.length < count) {
        const n = randInt(1, 33) * 3;
        if (!used.has(n)) { used.add(n); signals.push(String(n)); }
      }
      const noise: string[] = [];
      while (noise.length < count * 3) {
        const n = randInt(1, 99);
        if (n % 3 !== 0 && !used.has(n)) { used.add(n); noise.push(String(n)); }
      }
      return { signals, noise };
    },
  },
  {
    label: 'Find all COLOR names',
    generate: (count) => {
      const signals = pickN(COLORS_LIST, Math.min(count, COLORS_LIST.length));
      const noise = pickN(NON_COLORS, Math.min(count * 3, NON_COLORS.length));
      return { signals, noise };
    },
  },
  {
    label: 'Find PERFECT SQUARES',
    generate: (count) => {
      const squares = [1, 4, 9, 16, 25, 36, 49, 64, 81];
      const signals = pickN(squares, Math.min(count, squares.length)).map(String);
      const noise: string[] = [];
      const sqSet = new Set(squares);
      const used = new Set<number>();
      while (noise.length < count * 3) {
        const n = randInt(1, 99);
        if (!sqSet.has(n) && !used.has(n)) { used.add(n); noise.push(String(n)); }
      }
      return { signals, noise };
    },
  },
  {
    label: 'Find 3-letter words',
    generate: (count) => {
      const threes = ['cat', 'dog', 'sun', 'map', 'box', 'key', 'pen', 'net', 'fox', 'owl', 'ice', 'gem'];
      const others = ['table', 'chair', 'stone', 'cloud', 'flame', 'river', 'tower', 'crown', 'globe', 'brick', 'paint', 'wheel', 'scale', 'badge', 'stamp', 'sword'];
      return { signals: pickN(threes, Math.min(count, threes.length)), noise: pickN(others, Math.min(count * 3, others.length)) };
    },
  },
  {
    label: 'Find SINGLE-DIGIT numbers',
    generate: (count) => {
      const singles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const signals = pickN(singles, Math.min(count, singles.length)).map(String);
      const noise: string[] = [];
      const used = new Set<number>();
      while (noise.length < count * 3) {
        const n = randInt(10, 99);
        if (!used.has(n)) { used.add(n); noise.push(String(n)); }
      }
      return { signals, noise };
    },
  },
  {
    label: 'Find words with double letters',
    generate: (count) => {
      const doubles = ['book', 'moon', 'bell', 'ball', 'wall', 'tree', 'deer', 'seed', 'cool', 'feel', 'good', 'pool'];
      const singles = ['bold', 'dust', 'fast', 'grim', 'hunt', 'just', 'king', 'lamp', 'mist', 'nest', 'palm', 'risk', 'silk', 'vast', 'wild', 'zinc'];
      return { signals: pickN(doubles, Math.min(count, doubles.length)), noise: pickN(singles, Math.min(count * 3, singles.length)) };
    },
  },
];

/* ------------------------------------------------------------------ */
/*  CELL STATE                                                         */
/* ------------------------------------------------------------------ */
interface Cell {
  id: number;
  value: string;
  isSignal: boolean;
  found: boolean;
  wrong: boolean;
}

/* ------------------------------------------------------------------ */
/*  GAME PHASES                                                        */
/* ------------------------------------------------------------------ */
type Phase = 'menu' | 'playing' | 'roundEnd' | 'gameOver';

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
}

export default function SignalNoise({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('menu');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [cells, setCells] = useState<Cell[]>([]);
  const [rule, setRule] = useState<Rule>(RULES[0]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [totalSignals, setTotalSignals] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return Number(localStorage.getItem('signalnoise_high') ?? 0); } catch { return 0; }
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ---- grid size per round ---- */
  const getGridSize = useCallback((r: number) => {
    if (r <= 2) return 5;
    if (r <= 4) return 6;
    if (r <= 7) return 7;
    return 8;
  }, []);

  const getTimeLimit = useCallback((r: number) => {
    return Math.max(8, 16 - r);
  }, []);

  const getSignalCount = useCallback((r: number, totalCells: number) => {
    const base = Math.max(3, Math.floor(totalCells * 0.2));
    return Math.min(base + Math.floor(r / 3), Math.floor(totalCells * 0.35));
  }, []);

  /* ---- start round ---- */
  const startRound = useCallback((r: number, currentScore: number, currentLives: number) => {
    const size = getGridSize(r);
    const totalCells = size * size;
    const sigCount = getSignalCount(r, totalCells);
    const chosenRule = RULES[(r - 1) % RULES.length];
    const { signals, noise } = chosenRule.generate(sigCount);

    const allValues: { value: string; isSignal: boolean }[] = [
      ...signals.map((v) => ({ value: v, isSignal: true })),
      ...noise.slice(0, totalCells - signals.length).map((v) => ({ value: v, isSignal: false })),
    ];

    // pad if needed
    while (allValues.length < totalCells) {
      allValues.push({ value: String(randInt(1, 99)), isSignal: false });
    }

    const shuffled = shuffle(allValues).slice(0, totalCells);
    const newCells: Cell[] = shuffled.map((c, i) => ({
      id: i,
      value: c.value,
      isSignal: c.isSignal,
      found: false,
      wrong: false,
    }));

    setRule(chosenRule);
    setCells(newCells);
    setTotalSignals(shuffled.filter((c) => c.isSignal).length);
    setFoundCount(0);
    setRound(r);
    setScore(currentScore);
    setLives(currentLives);
    const tl = getTimeLimit(r);
    setTimeLeft(tl);
    setPhase('playing');
  }, [getGridSize, getTimeLimit, getSignalCount]);

  /* ---- timer ---- */
  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase('roundEnd');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  /* ---- check all found ---- */
  useEffect(() => {
    if (phase === 'playing' && foundCount > 0 && foundCount >= totalSignals) {
      if (timerRef.current) clearInterval(timerRef.current);
      // bonus for clearing with time left
      setScore((s) => s + timeLeft * 5);
      setPhase('roundEnd');
    }
  }, [foundCount, totalSignals, phase, timeLeft]);

  /* ---- cell click ---- */
  const handleClick = useCallback((id: number) => {
    if (phase !== 'playing') return;
    setCells((prev) => {
      const cell = prev[id];
      if (cell.found || cell.wrong) return prev;

      const next = [...prev];
      if (cell.isSignal) {
        next[id] = { ...cell, found: true };
        setScore((s) => s + 10 + streak * 2);
        setStreak((s) => {
          const ns = s + 1;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });
        setFoundCount((f) => f + 1);
      } else {
        next[id] = { ...cell, wrong: true };
        setScore((s) => Math.max(0, s - 5));
        setStreak(0);
        setLives((l) => {
          const nl = l - 1;
          if (nl <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            setTimeout(() => setPhase('gameOver'), 400);
          }
          return nl;
        });
        // flash reset
        setTimeout(() => {
          setCells((p) => {
            const r = [...p];
            r[id] = { ...r[id], wrong: false };
            return r;
          });
        }, 500);
      }
      return next;
    });
  }, [phase, streak]);

  /* ---- next round ---- */
  const nextRound = useCallback(() => {
    startRound(round + 1, score, lives);
  }, [round, score, lives, startRound]);

  /* ---- new game ---- */
  const newGame = useCallback(() => {
    setStreak(0);
    setBestStreak(0);
    startRound(1, 0, 3);
  }, [startRound]);

  /* ---- save high score ---- */
  useEffect(() => {
    if (phase === 'gameOver' && score > highScore) {
      setHighScore(score);
      try { localStorage.setItem('signalnoise_high', String(score)); } catch { /* */ }
    }
  }, [phase, score, highScore]);

  /* ---- grid cols ---- */
  const gridSize = getGridSize(round);

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  /* ---- MENU ---- */
  if (phase === 'menu') {
    return (
      <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif" }}>
        <button onClick={onBack} style={{ position: 'absolute', top: 20, left: 20, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <ArrowLeft size={18} /> Back
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: R.lg, background: C.surface, ...GLASS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={36} color={C.amber} />
          </div>
          <h1 style={{ color: C.white, fontSize: 32, fontWeight: 700, margin: 0 }}>Signal vs Noise</h1>
          <p style={{ color: C.muted, fontSize: 15, margin: 0, textAlign: 'center', maxWidth: 360 }}>
            Find meaningful signals in floods of information. Spot the pattern, ignore the noise.
          </p>
        </div>

        <div style={{ background: C.surface, borderRadius: R.lg, padding: 24, ...GLASS, maxWidth: 380, width: '100%', marginBottom: 24 }}>
          <h3 style={{ color: C.amber, fontSize: 14, fontWeight: 600, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>How to play</h3>
          <ul style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
            <li>Each round shows a <span style={{ color: C.amber }}>target rule</span></li>
            <li>Click cells that match the rule</li>
            <li>Correct = <span style={{ color: C.emerald }}>+points</span>, Wrong = <span style={{ color: C.rose }}>-life</span></li>
            <li>3 lives, timer gets shorter each round</li>
            <li>Find all signals for a time bonus</li>
          </ul>
        </div>

        {highScore > 0 && (
          <div style={{ color: C.muted, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={16} color={C.amber} /> Best: {highScore}
          </div>
        )}

        <button
          onClick={newGame}
          style={{
            background: C.amber,
            color: C.obsidian,
            border: 'none',
            borderRadius: R.md,
            padding: '14px 48px',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          Start Game <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  /* ---- GAME OVER ---- */
  if (phase === 'gameOver') {
    const isNew = score >= highScore && score > 0;
    return (
      <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif" }}>
        <div style={{ background: C.surface, borderRadius: R.lg, padding: 32, ...GLASS, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <Trophy size={48} color={isNew ? C.amber : C.muted} style={{ marginBottom: 16 }} />
          <h2 style={{ color: C.white, fontSize: 28, fontWeight: 700, margin: '0 0 4px' }}>Game Over</h2>
          <p style={{ color: C.muted, fontSize: 14, margin: '0 0 24px' }}>Round {round}</p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
            <div>
              <div style={{ color: C.amber, fontSize: 32, fontWeight: 700 }}>{score}</div>
              <div style={{ color: C.muted, fontSize: 12, textTransform: 'uppercase' }}>Score</div>
            </div>
            <div>
              <div style={{ color: C.teal, fontSize: 32, fontWeight: 700 }}>{bestStreak}</div>
              <div style={{ color: C.muted, fontSize: 12, textTransform: 'uppercase' }}>Best Streak</div>
            </div>
          </div>

          {isNew && (
            <div style={{ color: C.amber, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
              <Star size={14} style={{ marginRight: 4 }} /> New High Score!
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={onBack} style={{ background: C.slate, color: C.muted, border: 'none', borderRadius: R.sm, padding: '12px 24px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
              <ArrowLeft size={14} style={{ marginRight: 6 }} /> Exit
            </button>
            <button onClick={newGame} style={{ background: C.amber, color: C.obsidian, border: 'none', borderRadius: R.sm, padding: '12px 24px', fontSize: 14, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={14} /> Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- ROUND END ---- */
  if (phase === 'roundEnd') {
    const allFound = foundCount >= totalSignals;
    return (
      <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif" }}>
        <div style={{ background: C.surface, borderRadius: R.lg, padding: 32, ...GLASS, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          {allFound ? (
            <Zap size={48} color={C.amber} style={{ marginBottom: 16 }} />
          ) : (
            <Target size={48} color={C.muted} style={{ marginBottom: 16 }} />
          )}
          <h2 style={{ color: C.white, fontSize: 24, fontWeight: 700, margin: '0 0 4px' }}>
            {allFound ? 'All Signals Found!' : 'Time\'s Up!'}
          </h2>
          <p style={{ color: C.muted, fontSize: 14, margin: '0 0 20px' }}>
            Round {round} complete
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ color: C.emerald, fontSize: 24, fontWeight: 700 }}>{foundCount}/{totalSignals}</div>
              <div style={{ color: C.muted, fontSize: 12, textTransform: 'uppercase' }}>Found</div>
            </div>
            <div>
              <div style={{ color: C.amber, fontSize: 24, fontWeight: 700 }}>{score}</div>
              <div style={{ color: C.muted, fontSize: 12, textTransform: 'uppercase' }}>Score</div>
            </div>
            <div>
              <div style={{ color: C.rose, fontSize: 24, fontWeight: 700 }}>{lives}</div>
              <div style={{ color: C.muted, fontSize: 12, textTransform: 'uppercase' }}>Lives</div>
            </div>
          </div>
          <button onClick={nextRound} style={{ background: C.amber, color: C.obsidian, border: 'none', borderRadius: R.sm, padding: '12px 36px', fontSize: 15, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto' }}>
            Next Round <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ---- PLAYING ---- */
  const timeRatio = timeLeft / getTimeLimit(round);
  const timeColor = timeRatio > 0.5 ? C.amber : timeRatio > 0.25 ? '#e67e22' : C.rose;

  return (
    <div style={{ minHeight: '100vh', background: C.obsidian, display: 'flex', flexDirection: 'column', fontFamily: "'Inter','SF Pro Display',system-ui,sans-serif" }}>
      {/* TOP BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.amber }}>
            <Star size={16} /> <span style={{ fontWeight: 700, fontSize: 15 }}>{score}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.rose }}>
            {[...Array(3)].map((_, i) => (
              <Heart key={i} size={16} fill={i < lives ? C.rose : 'transparent'} color={i < lives ? C.rose : C.dim} />
            ))}
          </div>
          <div style={{ color: C.muted, fontSize: 13, fontWeight: 600 }}>R{round}</div>
        </div>
      </div>

      {/* TIMER BAR */}
      <div style={{ height: 4, background: C.carbon }}>
        <div style={{ height: '100%', width: `${timeRatio * 100}%`, background: timeColor, transition: 'width 1s linear, background 0.3s' }} />
      </div>

      {/* RULE */}
      <div style={{ textAlign: 'center', padding: '14px 16px 10px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.surface, borderRadius: R.md, padding: '8px 18px', ...GLASS }}>
          <Target size={16} color={C.amber} />
          <span style={{ color: C.white, fontSize: 14, fontWeight: 600 }}>{rule.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 8 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>
            <Clock size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            {timeLeft}s
          </span>
          <span style={{ color: C.emerald, fontSize: 12 }}>
            {foundCount}/{totalSignals} found
          </span>
          {streak >= 3 && (
            <span style={{ color: C.amber, fontSize: 12, fontWeight: 700 }}>
              <Zap size={12} style={{ marginRight: 2, verticalAlign: -1 }} />
              {streak}x streak!
            </span>
          )}
        </div>
      </div>

      {/* GRID */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gap: 6,
            maxWidth: 480,
            width: '100%',
          }}
        >
          {cells.map((cell) => {
            let bg: string = C.slate;
            let borderColor: string = C.border;
            let textColor: string = C.white;

            if (cell.found) {
              bg = C.emerald;
              borderColor = C.emerald;
              textColor = C.obsidian;
            } else if (cell.wrong) {
              bg = C.rose;
              borderColor = C.rose;
              textColor = C.white;
            }

            return (
              <button
                key={cell.id}
                onClick={() => handleClick(cell.id)}
                disabled={cell.found}
                style={{
                  aspectRatio: '1',
                  background: bg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: R.sm,
                  color: textColor,
                  fontSize: gridSize <= 6 ? 14 : 12,
                  fontWeight: 600,
                  cursor: cell.found ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s, border-color 0.15s',
                  padding: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  ...(cell.found ? {} : GLASS),
                }}
              >
                {cell.value}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
