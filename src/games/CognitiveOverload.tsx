import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Trophy, RotateCcw, Heart, Zap, Clock,
  Flame, Stethoscope, Shield, Truck, CloudLightning,
  Zap as Power, Droplets, Radio, AlertTriangle,
  Monitor, AlertOctagon, Plane, Anchor,
} from 'lucide-react';
import { sfxTap, sfxCorrect, sfxWrong, sfxCombo, sfxLevelUp, sfxGameOver } from '../lib/sfx';
import { type Particle, type ScorePop, correctBurst, wrongBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle, comboGlowStyle } from '../lib/vfx';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const T = {
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
} as const;

const GLASS = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
} as const;

/* ------------------------------------------------------------------ */
/*  Priority system                                                    */
/* ------------------------------------------------------------------ */
type Priority = 'critical' | 'high' | 'medium' | 'low';

const PRIORITY_CONFIG: Record<Priority, { color: string; points: number; label: string; expiry: number }> = {
  critical: { color: T.rose, points: 40, label: 'CRITICAL', expiry: 8 },
  high:     { color: T.amber, points: 30, label: 'HIGH', expiry: 12 },
  medium:   { color: T.teal, points: 20, label: 'MEDIUM', expiry: 18 },
  low:      { color: T.dim, points: 10, label: 'LOW', expiry: 25 },
};

const PRIORITY_ORDER: Priority[] = ['critical', 'high', 'medium', 'low'];

/* ------------------------------------------------------------------ */
/*  Item categories                                                    */
/* ------------------------------------------------------------------ */
interface Category {
  name: string;
  icon: typeof Flame;
}

const CATEGORIES: Category[] = [
  { name: 'Fire', icon: Flame },
  { name: 'Medical', icon: Stethoscope },
  { name: 'Security', icon: Shield },
  { name: 'Transport', icon: Truck },
  { name: 'Weather', icon: CloudLightning },
  { name: 'Power', icon: Power },
  { name: 'Water', icon: Droplets },
  { name: 'Comms', icon: Radio },
  { name: 'Cyber', icon: Monitor },
  { name: 'Hazmat', icon: AlertOctagon },
  { name: 'Aviation', icon: Plane },
  { name: 'Maritime', icon: Anchor },
];

/* ------------------------------------------------------------------ */
/*  Item descriptions per category                                     */
/* ------------------------------------------------------------------ */
const DESCRIPTIONS: Record<string, string[]> = {
  Fire: ['Structure fire reported', 'Wildfire approaching', 'Gas leak detected', 'Smoke in subway'],
  Medical: ['Cardiac arrest', 'Multi-vehicle trauma', 'Allergic reaction', 'Pediatric emergency'],
  Security: ['Armed suspect', 'Perimeter breach', 'Missing person', 'Crowd disturbance'],
  Transport: ['Road collapse', 'Bridge obstruction', 'Rail derailment', 'Airport closure'],
  Weather: ['Tornado warning', 'Flash flood alert', 'Lightning strike', 'Severe hail'],
  Power: ['Grid failure', 'Transformer fire', 'Blackout zone', 'Overload cascade'],
  Water: ['Pipeline burst', 'Reservoir breach', 'Contamination alert', 'Dam pressure'],
  Comms: ['Tower offline', 'Network saturated', 'Signal jamming', 'Relay failure'],
  Cyber: ['System intrusion detected', 'Data exfiltration alert', 'Ransomware spreading', 'Unauthorized access'],
  Hazmat: ['Chemical spill', 'Radiation leak', 'Toxic fumes', 'Biohazard containment breach'],
  Aviation: ['Engine failure reported', 'Runway obstruction', 'Bird strike damage', 'Cabin depressurization'],
  Maritime: ['Vessel taking water', 'Cargo shift emergency', 'Man overboard', 'Navigation failure'],
};

/* ------------------------------------------------------------------ */
/*  Level configs                                                      */
/* ------------------------------------------------------------------ */
interface LevelConfig {
  maxItems: number;
  spawnInterval: number; // ms between new items
  name: string;
}

const LEVELS: LevelConfig[] = [
  { maxItems: 3, spawnInterval: 4000, name: 'Dispatch Trainee' },
  { maxItems: 5, spawnInterval: 3200, name: 'Junior Operator' },
  { maxItems: 7, spawnInterval: 2600, name: 'Senior Operator' },
  { maxItems: 10, spawnInterval: 2000, name: 'Emergency Director' },
];

/* ------------------------------------------------------------------ */
/*  Triage item type                                                   */
/* ------------------------------------------------------------------ */
interface TriageItem {
  id: number;
  priority: Priority;
  category: Category;
  description: string;
  spawnTime: number;
  expiresAt: number;
  timeLeft: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
let nextId = 0;

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createItem(now: number): TriageItem {
  const roll = Math.random();
  const priority: Priority =
    roll < 0.15 ? 'critical' :
    roll < 0.40 ? 'high' :
    roll < 0.70 ? 'medium' : 'low';

  const category = pickRandom(CATEGORIES);
  const desc = pickRandom(DESCRIPTIONS[category.name]);
  const config = PRIORITY_CONFIG[priority];

  return {
    id: nextId++,
    priority,
    category,
    description: desc,
    spawnTime: now,
    expiresAt: now + config.expiry * 1000,
    timeLeft: config.expiry,
  };
}

/* ------------------------------------------------------------------ */
/*  Secondary tasks                                                    */
/* ------------------------------------------------------------------ */
interface MathProblem {
  a: number;
  b: number;
  op: '+' | '-' | 'x';
  answer: number;
  options: number[];
}

function generateMath(): MathProblem {
  const ops: MathProblem['op'][] = ['+', '-', 'x'];
  const op = pickRandom(ops);
  let a: number, b: number, answer: number;
  if (op === '+') {
    a = 2 + Math.floor(Math.random() * 48);
    b = 2 + Math.floor(Math.random() * 48);
    answer = a + b;
  } else if (op === '-') {
    a = 10 + Math.floor(Math.random() * 90);
    b = 2 + Math.floor(Math.random() * (a - 2));
    answer = a - b;
  } else {
    a = 2 + Math.floor(Math.random() * 12);
    b = 2 + Math.floor(Math.random() * 12);
    answer = a * b;
  }
  const wrong1 = answer + (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 5));
  let wrong2 = answer + (Math.random() < 0.5 ? 2 : -2) * (1 + Math.floor(Math.random() * 3));
  if (wrong2 === wrong1 || wrong2 === answer) wrong2 = answer + 7;
  const options = [answer, wrong1, wrong2].sort(() => Math.random() - 0.5);
  return { a, b, op, answer, options };
}

interface WordQuestion {
  word: string;
  category: string;
  isAnimal: boolean;
}

const ANIMALS = ['TIGER', 'EAGLE', 'SHARK', 'PYTHON', 'FALCON', 'DOLPHIN', 'COBRA', 'PANTHER', 'HAWK', 'WOLF'];
const NON_ANIMALS = ['HAMMER', 'BRIDGE', 'ROCKET', 'CANYON', 'MARBLE', 'SUMMIT', 'BEACON', 'PRISM', 'VAULT', 'CIPHER'];

function generateWord(): WordQuestion {
  const isAnimal = Math.random() < 0.5;
  const word = pickRandom(isAnimal ? ANIMALS : NON_ANIMALS);
  return { word, category: 'animal', isAnimal };
}

/* ------------------------------------------------------------------ */
/*  Level progression thresholds                                       */
/* ------------------------------------------------------------------ */
const LEVEL_THRESHOLDS = [0, 8, 20, 40];

/* ------------------------------------------------------------------ */
/*  Keyframe injection (runs once)                                     */
/* ------------------------------------------------------------------ */
const STYLE_ID = 'cognitive-overload-keyframes';
function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes co-pulse {
      0%, 100% { box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5); }
      50% { box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5), 0 0 16px 4px var(--pulse-color); }
    }
    @keyframes co-flash {
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }
    @keyframes co-correct {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.08); }
      100% { transform: scale(0.8); opacity: 0; }
    }
    @keyframes co-wrong {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
    @keyframes co-expire {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0.6); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

type Phase = 'menu' | 'playing' | 'gameover';

export default function CognitiveOverload({ onBack, onGameEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('menu');
  const [items, setItems] = useState<TriageItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(0);
  const [combo, setCombo] = useState(0);
  const [triaged, setTriaged] = useState(0);
  const [animating, setAnimating] = useState<Record<number, 'correct' | 'wrong' | 'expire'>>({});
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [expired, setExpired] = useState(0);
  const [mathProblem, setMathProblem] = useState<MathProblem | null>(null);
  const [wordQuestion, setWordQuestion] = useState<WordQuestion | null>(null);
  const [mathAnswered, setMathAnswered] = useState(false);
  const [wordAnswered, setWordAnswered] = useState(false);

  const tickRef = useRef<number>(0);
  const spawnRef = useRef<number>(0);
  const itemsRef = useRef(items);
  const livesRef = useRef(lives);
  const levelRef = useRef(level);
  const triagedRef = useRef(triaged);
  const feedbackTimer = useRef<number>(0);
  const mathTimerRef = useRef<number>(0);
  const wordTimerRef = useRef<number>(0);
  const expiredRef = useRef(expired);
  expiredRef.current = expired;
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  itemsRef.current = items;
  livesRef.current = lives;
  levelRef.current = level;
  triagedRef.current = triaged;

  useEffect(() => { ensureKeyframes(); }, []);

  /* ---- Report score at game over ---- */
  useEffect(() => {
    if (phase === 'gameover') {
      const total = triaged + expired;
      const efficiency = total > 0 ? triaged / total : 0;
      onGameEnd?.({
        score,
        accuracy: efficiency,
        level,
      });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Level progression ---- */
  useEffect(() => {
    if (triaged >= 8 && level === 0) { sfxLevelUp(); setLevel(1); }
    else if (triaged >= 20 && level === 1) { sfxLevelUp(); setLevel(2); }
    else if (triaged >= 40 && level === 2) { sfxLevelUp(); setLevel(3); }
  }, [triaged, level]);

  /* ---- VFX rAF loop ---- */
  const vfxActive = particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0;
  useEffect(() => {
    if (!vfxActive) return;
    const loop = () => {
      setParticles(prev => prev.length ? tickParticles(prev) : prev);
      setScorePops(prev => prev.length ? tickScorePops(prev) : prev);
      setShakeIntensity(prev => prev > 0.01 ? prev * 0.85 : 0);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [vfxActive]);

  const getRelativePos = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  /* ---- Spawn loop ---- */
  const spawnLoop = useCallback(() => {
    const cfg = LEVELS[levelRef.current];
    if (itemsRef.current.length < cfg.maxItems) {
      const item = createItem(Date.now());
      setItems(prev => [...prev, item]);
    }
  }, []);

  /* ---- Tick loop (update timers, expire items) ---- */
  const tick = useCallback(() => {
    const now = Date.now();
    setItems(prev => {
      const next: TriageItem[] = [];
      let lostLife = false;
      let expiredThisTick = 0;

      for (const item of prev) {
        const timeLeft = Math.max(0, (item.expiresAt - now) / 1000);
        if (timeLeft <= 0) {
          expiredThisTick++;
          if (item.priority === 'critical' || item.priority === 'high') {
            lostLife = true;
          }
          setAnimating(a => ({ ...a, [item.id]: 'expire' }));
          setTimeout(() => setAnimating(a => {
            const { [item.id]: _, ...rest } = a;
            return rest;
          }), 400);
          continue;
        }
        next.push({ ...item, timeLeft });
      }

      if (expiredThisTick > 0) {
        setExpired(e => e + expiredThisTick);
      }

      if (lostLife) {
        const newLives = livesRef.current - 1;
        setLives(newLives);
        setCombo(0);
        sfxWrong();
        setShakeIntensity(6);
        showFeedback('ITEM EXPIRED!', T.rose);
        if (newLives <= 0) {
          sfxGameOver();
          setPhase('gameover');
        }
      }
      return next;
    });
  }, []);

  const showFeedback = useCallback((text: string, color: string) => {
    setFeedback({ text, color });
    clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 1200);
  }, []);

  /* ---- Start / stop game loops ---- */
  useEffect(() => {
    if (phase !== 'playing') return;

    tickRef.current = window.setInterval(tick, 200);
    const cfg = LEVELS[levelRef.current];
    spawnRef.current = window.setInterval(spawnLoop, cfg.spawnInterval);

    // Spawn initial items
    const now = Date.now();
    const initial: TriageItem[] = [];
    for (let i = 0; i < Math.min(2, LEVELS[level].maxItems); i++) {
      initial.push(createItem(now));
    }
    setItems(initial);

    return () => {
      clearInterval(tickRef.current);
      clearInterval(spawnRef.current);
    };
  }, [phase, tick, spawnLoop, level]);

  /* ---- Update spawn interval on level change ---- */
  useEffect(() => {
    if (phase !== 'playing') return;
    clearInterval(spawnRef.current);
    const cfg = LEVELS[level];
    spawnRef.current = window.setInterval(spawnLoop, cfg.spawnInterval);
    return () => clearInterval(spawnRef.current);
  }, [level, phase, spawnLoop]);

  /* ---- Secondary task: math ticker (level 2+) ---- */
  useEffect(() => {
    if (phase !== 'playing' || level < 1) {
      setMathProblem(null);
      clearInterval(mathTimerRef.current);
      return;
    }
    setMathProblem(generateMath());
    setMathAnswered(false);
    mathTimerRef.current = window.setInterval(() => {
      setMathProblem(generateMath());
      setMathAnswered(false);
    }, 10000);
    return () => clearInterval(mathTimerRef.current);
  }, [phase, level]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Secondary task: word verification (level 3+) ---- */
  useEffect(() => {
    if (phase !== 'playing' || level < 2) {
      setWordQuestion(null);
      clearInterval(wordTimerRef.current);
      return;
    }
    setWordQuestion(generateWord());
    setWordAnswered(false);
    wordTimerRef.current = window.setInterval(() => {
      setWordQuestion(generateWord());
      setWordAnswered(false);
    }, 12000);
    return () => clearInterval(wordTimerRef.current);
  }, [phase, level]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Secondary task handlers ---- */
  const handleMathAnswer = useCallback((chosen: number) => {
    if (!mathProblem || mathAnswered) return;
    sfxTap();
    setMathAnswered(true);
    if (chosen === mathProblem.answer) {
      setScore(s => s + 15);
      showFeedback('+15 Math', T.sapphire);
    }
  }, [mathProblem, mathAnswered, showFeedback]);

  const handleWordAnswer = useCallback((answeredYes: boolean) => {
    if (!wordQuestion || wordAnswered) return;
    sfxTap();
    setWordAnswered(true);
    const correct = answeredYes === wordQuestion.isAnimal;
    if (correct) {
      setScore(s => s + 10);
      showFeedback('+10 Word', T.teal);
    } else {
      setScore(s => Math.max(0, s - 5));
      showFeedback('-5 Wrong', T.rose);
    }
  }, [wordQuestion, wordAnswered, showFeedback]);

  /* ---- Handle triage click ---- */
  const handleTriage = useCallback((item: TriageItem, e?: React.MouseEvent) => {
    if (phase !== 'playing') return;
    if (animating[item.id]) return;

    // Check if there's any higher-priority item on screen
    const currentItems = itemsRef.current;
    const clickedIdx = PRIORITY_ORDER.indexOf(item.priority);

    const hasHigher = currentItems.some(it =>
      it.id !== item.id && PRIORITY_ORDER.indexOf(it.priority) < clickedIdx
    );

    if (hasHigher) {
      // Wrong order
      sfxWrong();
      if (e) {
        const pos = getRelativePos(e);
        setParticles(prev => [...prev, ...wrongBurst(pos.x, pos.y)]);
      }
      setShakeIntensity(5);
      setAnimating(a => ({ ...a, [item.id]: 'wrong' }));
      setTimeout(() => setAnimating(a => {
        const { [item.id]: _, ...rest } = a;
        return rest;
      }), 500);
      setCombo(0);
      showFeedback('WRONG ORDER!', T.amber);
      return;
    }

    // Correct triage
    sfxCorrect();
    const config = PRIORITY_CONFIG[item.priority];
    const elapsed = (Date.now() - item.spawnTime) / 1000;
    const speedBonus = Math.max(0, Math.floor((config.expiry - elapsed) * 2));
    const comboBonus = combo * 5;
    const totalPoints = config.points + speedBonus + comboBonus;

    if (e) {
      const pos = getRelativePos(e);
      setParticles(prev => [...prev, ...correctBurst(pos.x, pos.y)]);
      setScorePops(prev => [...prev, createScorePop(pos.x, pos.y, totalPoints, T.emerald)]);
    }

    setScore(s => s + totalPoints);
    setCombo(c => c + 1);
    setTriaged(t => t + 1);
    if (combo + 1 > 1) sfxCombo(combo + 1);

    setAnimating(a => ({ ...a, [item.id]: 'correct' }));
    setTimeout(() => {
      setItems(prev => prev.filter(it => it.id !== item.id));
      setAnimating(a => {
        const { [item.id]: _, ...rest } = a;
        return rest;
      });
    }, 350);

    showFeedback(`+${totalPoints}`, T.emerald);
  }, [phase, combo, animating, showFeedback]);

  /* ---- Start game ---- */
  const startGame = useCallback(() => {
    sfxTap();
    nextId = 0;
    setScore(0);
    setLives(3);
    setLevel(0);
    setCombo(0);
    setTriaged(0);
    setItems([]);
    setAnimating({});
    setFeedback(null);
    setExpired(0);
    setMathProblem(null);
    setWordQuestion(null);
    setMathAnswered(false);
    setWordAnswered(false);
    setPhase('playing');
  }, []);

  /* ---- Shared styles ---- */
  const btnStyle = (bg: string): React.CSSProperties => ({
    background: bg,
    color: T.white,
    border: 'none',
    borderRadius: T.radius.md,
    padding: '12px 28px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    ...GLASS,
  });

  const pillStyle = (bg: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: bg,
    color: T.white,
    borderRadius: 999,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
  });

  /* ================================================================== */
  /*  MENU                                                               */
  /* ================================================================== */
  if (phase === 'menu') {
    return (
      <div style={{ minHeight: '100vh', background: T.obsidian, color: T.white, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={22} />
          </button>
          <AlertTriangle size={22} color={T.rose} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>Cognitive Overload</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              <AlertTriangle size={64} color={T.rose} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: T.rose }}>Cognitive Overload</h1>
            <p style={{ color: T.muted, marginTop: 8, fontSize: 14, maxWidth: 380, lineHeight: 1.5 }}>
              Emergency dispatch is flooding in. Triage incoming incidents by priority -- critical first, then high, medium, low. Miss a critical item and you lose a life.
            </p>
          </div>

          {/* Priority legend */}
          <div style={{
            background: T.surface, borderRadius: T.radius.md, padding: 20,
            display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 340,
            ...GLASS,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, marginBottom: 4 }}>PRIORITY POINTS</div>
            {PRIORITY_ORDER.map(p => {
              const cfg = PRIORITY_CONFIG[p];
              return (
                <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={pillStyle(cfg.color)}>{cfg.label}</span>
                  <span style={{ color: T.white, fontSize: 14, fontWeight: 600 }}>{cfg.points} pts</span>
                </div>
              );
            })}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4, fontSize: 12, color: T.muted }}>
              Speed + combo bonuses for fast, consecutive correct triages
            </div>
          </div>

          <button onClick={startGame} style={btnStyle(T.rose)}>
            Begin Shift
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /*  GAME OVER                                                          */
  /* ================================================================== */
  if (phase === 'gameover') {
    return (
      <div style={{ minHeight: '100vh', background: T.obsidian, color: T.white, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={22} />
          </button>
          <AlertTriangle size={22} color={T.rose} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>Cognitive Overload</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32 }}>
          <Trophy size={56} color={T.rose} />
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Shift Over</h2>
          {(() => {
            const total = triaged + expired;
            const efficiency = total > 0 ? Math.round((triaged / total) * 100) : 0;
            const rank = efficiency >= 90 ? 'Elite' : efficiency >= 70 ? 'Proficient' : efficiency >= 50 ? 'Adequate' : 'Needs Training';
            const rankColor = efficiency >= 90 ? T.emerald : efficiency >= 70 ? T.sapphire : efficiency >= 50 ? T.amber : T.rose;
            return (
              <div style={{
                background: T.surface, borderRadius: T.radius.md, padding: 24, width: '100%', maxWidth: 300,
                display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center', ...GLASS,
              }}>
                <div>
                  <div style={{ fontSize: 40, fontWeight: 600, color: T.rose }}>{score}</div>
                  <div style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>TOTAL SCORE</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{triaged}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>Triaged</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{expired}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>Expired</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{LEVELS[level].name.split(' ')[0]}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>Rank</div>
                  </div>
                </div>
                {/* Efficiency bar */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>TRIAGE EFFICIENCY</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: rankColor }}>{efficiency}%</span>
                  </div>
                  <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${efficiency}%`, height: '100%', background: rankColor, borderRadius: 3 }} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: rankColor }}>{rank}</div>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={startGame} style={btnStyle(T.rose)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RotateCcw size={16} /> Try Again
              </span>
            </button>
            <button onClick={onBack} style={btnStyle(T.dim)}>
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /*  PLAYING                                                            */
  /* ================================================================== */
  const lvl = LEVELS[level];

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: T.obsidian, color: T.white, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', ...screenShakeStyle(shakeIntensity), ...comboGlowStyle(combo, T.violet) }}>
      {/* ---- Top bar ---- */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: `1px solid ${T.border}`, background: T.ink,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <AlertTriangle size={18} color={T.rose} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>Dispatch</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Level */}
          <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{lvl.name}</span>

          {/* Combo */}
          {combo > 1 && (
            <span style={pillStyle(T.violet)}>
              <Zap size={12} /> x{combo}
            </span>
          )}

          {/* Score */}
          <span style={{ fontSize: 15, fontWeight: 700, color: T.rose, minWidth: 50, textAlign: 'right' }}>{score}</span>

          {/* Lives */}
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                size={16}
                fill={i < lives ? T.rose : 'transparent'}
                color={i < lives ? T.rose : T.dim}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---- Feedback toast ---- */}
      {feedback && (
        <div style={{
          position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
          background: T.surface, color: feedback.color, padding: '8px 20px',
          borderRadius: 999, fontSize: 16, fontWeight: 600, zIndex: 100,
          border: `2px solid ${feedback.color}`,
          ...GLASS,
        }}>
          {feedback.text}
        </div>
      )}

      {/* ---- Level progress bar ---- */}
      {(() => {
        const currentThreshold = LEVEL_THRESHOLDS[level] ?? 0;
        const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? null;
        const progressPct = nextThreshold !== null
          ? Math.min(100, ((triaged - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
          : 100;
        const nextName = level < LEVELS.length - 1 ? LEVELS[level + 1].name : null;
        return (
          <div style={{
            padding: '4px 16px 6px', background: T.carbon, borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 10, color: T.muted, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {nextName ? `Next: ${nextName}` : 'MAX RANK'}
            </span>
            <div style={{ flex: 1, height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${progressPct}%`, height: '100%',
                background: T.violet, borderRadius: 2, transition: 'width 300ms ease',
              }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.violet, whiteSpace: 'nowrap' }}>
              {triaged}/{nextThreshold ?? triaged}
            </span>
          </div>
        );
      })()}

      {/* ---- Secondary tasks strip ---- */}
      {mathProblem && level >= 1 && (
        <div style={{
          padding: '6px 16px', background: T.ink, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: T.sapphire, fontWeight: 600, letterSpacing: 0.3 }}>
            {mathProblem.a} {mathProblem.op} {mathProblem.b} = ?
          </span>
          {mathAnswered ? (
            <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Answered</span>
          ) : (
            mathProblem.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleMathAnswer(opt)}
                style={{
                  background: T.slate, border: `1px solid ${T.sapphire}40`, borderRadius: T.radius.sm,
                  color: T.white, padding: '3px 14px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', minWidth: 40,
                }}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}

      {wordQuestion && level >= 2 && (
        <div style={{
          padding: '6px 16px', background: T.ink, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: T.teal, fontWeight: 600 }}>
            Is {wordQuestion.word} an {wordQuestion.category}?
          </span>
          {wordAnswered ? (
            <span style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>Answered</span>
          ) : (
            <>
              <button
                onClick={() => handleWordAnswer(true)}
                style={{
                  background: T.slate, border: `1px solid ${T.emerald}40`, borderRadius: T.radius.sm,
                  color: T.emerald, padding: '3px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                YES
              </button>
              <button
                onClick={() => handleWordAnswer(false)}
                style={{
                  background: T.slate, border: `1px solid ${T.rose}40`, borderRadius: T.radius.sm,
                  color: T.rose, padding: '3px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                NO
              </button>
            </>
          )}
        </div>
      )}

      {/* ---- Instructions bar ---- */}
      <div style={{
        padding: '6px 16px', background: T.carbon, fontSize: 11, color: T.muted,
        textAlign: 'center', borderBottom: `1px solid ${T.border}`,
      }}>
        Triage by priority: <span style={{ color: T.rose, fontWeight: 600 }}>CRITICAL</span> first
      </div>

      {/* ---- Grid ---- */}
      <div style={{
        flex: 1, padding: 16, display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12, alignContent: 'start', overflowY: 'auto',
      }}>
        {items.map(item => {
          const cfg = PRIORITY_CONFIG[item.priority];
          const urgent = item.timeLeft < 3;
          const anim = animating[item.id];
          const Icon = item.category.icon;
          const pct = item.timeLeft / (cfg.expiry);

          return (
            <button
              key={item.id}
              onClick={(e) => handleTriage(item, e)}
              style={{
                position: 'relative',
                background: T.surface,
                border: `2px solid ${urgent ? cfg.color : T.border}`,
                borderRadius: T.radius.md,
                padding: 16,
                cursor: 'pointer',
                textAlign: 'left',
                color: T.white,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transition: 'transform 150ms ease, border-color 200ms ease',
                ['--pulse-color' as string]: cfg.color,
                animation: anim === 'correct'
                  ? 'co-correct 350ms ease forwards'
                  : anim === 'wrong'
                  ? 'co-wrong 500ms ease'
                  : anim === 'expire'
                  ? 'co-expire 400ms ease forwards'
                  : urgent
                  ? 'co-pulse 1s ease infinite'
                  : 'none',
                ...GLASS,
              }}
            >
              {/* Top row: priority badge + category */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={pillStyle(cfg.color)}>{cfg.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.muted }}>
                  <Icon size={16} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{item.category.name}</span>
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                {item.description}
              </div>

              {/* Timer bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={13} color={urgent ? cfg.color : T.muted} />
                <div style={{
                  flex: 1, height: 4, background: T.border, borderRadius: 2, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct * 100}%`,
                    height: '100%',
                    background: urgent ? cfg.color : T.muted,
                    borderRadius: 2,
                    transition: 'width 200ms linear',
                  }} />
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, minWidth: 28, textAlign: 'right',
                  color: urgent ? cfg.color : T.muted,
                  animation: urgent ? 'co-flash 600ms ease infinite' : 'none',
                }}>
                  {Math.ceil(item.timeLeft)}s
                </span>
              </div>

              {/* Points hint */}
              <div style={{ fontSize: 11, color: T.dim, fontWeight: 600 }}>
                +{cfg.points} pts
              </div>
            </button>
          );
        })}

        {/* Empty state */}
        {items.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            padding: 48, color: T.muted,
          }}>
            <Radio size={32} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Awaiting dispatch...</span>
          </div>
        )}
      </div>
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </div>
  );
}
