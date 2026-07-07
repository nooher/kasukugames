import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Heart, Zap, Trophy, RotateCcw } from 'lucide-react';
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver, sfxLevelUp } from '../lib/sfx';
import { type Particle, type ScorePop, correctBurst, wrongBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle } from '../lib/vfx';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#1a2230',
  card: '#151d2b',
  border: '#1f2d3d',
  accent: '#f59e0b',
  success: '#00c97b',
  error: '#f43f5e',
  text: '#f0f4f8',
  muted: '#7a8ba0',
  radius: 14,
  pill: 999,
  transition: '200ms ease',
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Criterion = 'FASTEST' | 'SAFEST' | 'SMARTEST';

interface Option {
  emoji: string;
  label: string;
}

interface ScenarioSet {
  criterion: Criterion;
  options: [Option, Option, Option];
  /** index (0-2) of the correct answer for this criterion */
  answer: number;
}

/* ------------------------------------------------------------------ */
/*  Scenario data (15+ sets)                                           */
/* ------------------------------------------------------------------ */
const SCENARIOS: ScenarioSet[] = [
  // ---- FASTEST ----
  {
    criterion: 'FASTEST',
    options: [
      { emoji: '🛣️', label: 'Take the highway — fast but risky' },
      { emoji: '🏘️', label: 'Take side streets — slow but safe' },
      { emoji: '📱', label: 'Check the traffic app first' },
    ],
    answer: 0,
  },
  {
    criterion: 'FASTEST',
    options: [
      { emoji: '🚶', label: 'Walk to the meeting across campus' },
      { emoji: '🚴', label: 'Grab a bike and ride there' },
      { emoji: '🗺️', label: 'Study the campus map first' },
    ],
    answer: 1,
  },
  {
    criterion: 'FASTEST',
    options: [
      { emoji: '📧', label: 'Send a detailed email to the team' },
      { emoji: '📞', label: 'Call them right now' },
      { emoji: '📋', label: 'Write a formal memo and print it' },
    ],
    answer: 1,
  },
  {
    criterion: 'FASTEST',
    options: [
      { emoji: '🏃', label: 'Sprint to catch the departing bus' },
      { emoji: '🚕', label: 'Wait and hail a taxi instead' },
      { emoji: '⏰', label: 'Check the schedule for the next one' },
    ],
    answer: 0,
  },
  {
    criterion: 'FASTEST',
    options: [
      { emoji: '✈️', label: 'Book a direct flight overnight' },
      { emoji: '🚌', label: 'Take the overnight bus — cheaper' },
      { emoji: '🔍', label: 'Compare all transport options online' },
    ],
    answer: 0,
  },
  // ---- SAFEST ----
  {
    criterion: 'SAFEST',
    options: [
      { emoji: '⚡', label: 'Fix the fuse box yourself right now' },
      { emoji: '🔦', label: 'Use a flashlight and wait for morning' },
      { emoji: '📞', label: 'Call a licensed electrician' },
    ],
    answer: 2,
  },
  {
    criterion: 'SAFEST',
    options: [
      { emoji: '🌊', label: 'Swim across the swollen river' },
      { emoji: '🌉', label: 'Walk upstream to the bridge' },
      { emoji: '🪵', label: 'Build a raft from driftwood' },
    ],
    answer: 1,
  },
  {
    criterion: 'SAFEST',
    options: [
      { emoji: '🔥', label: 'Run back in for your phone' },
      { emoji: '🚪', label: 'Evacuate and call emergency services' },
      { emoji: '🧯', label: 'Grab the extinguisher and fight it' },
    ],
    answer: 1,
  },
  {
    criterion: 'SAFEST',
    options: [
      { emoji: '🐻', label: 'Shout and wave your arms at the bear' },
      { emoji: '🏃', label: 'Turn around and run fast' },
      { emoji: '🧍', label: 'Back away slowly and stay calm' },
    ],
    answer: 2,
  },
  {
    criterion: 'SAFEST',
    options: [
      { emoji: '⛰️', label: 'Continue the hike in the storm' },
      { emoji: '🏕️', label: 'Set up camp and wait it out' },
      { emoji: '🏔️', label: 'Take the steep shortcut downhill' },
    ],
    answer: 1,
  },
  // ---- SMARTEST ----
  {
    criterion: 'SMARTEST',
    options: [
      { emoji: '💸', label: 'Invest all savings in one hot stock' },
      { emoji: '📊', label: 'Diversify across several funds' },
      { emoji: '🛏️', label: 'Keep all cash under the mattress' },
    ],
    answer: 1,
  },
  {
    criterion: 'SMARTEST',
    options: [
      { emoji: '🎓', label: 'Research the topic before the exam' },
      { emoji: '🍀', label: 'Wing it and hope for the best' },
      { emoji: '📝', label: 'Copy a friend\'s old answers' },
    ],
    answer: 0,
  },
  {
    criterion: 'SMARTEST',
    options: [
      { emoji: '🔨', label: 'Start building without a blueprint' },
      { emoji: '📐', label: 'Draft a plan and gather materials' },
      { emoji: '🏪', label: 'Buy the most expensive tools first' },
    ],
    answer: 1,
  },
  {
    criterion: 'SMARTEST',
    options: [
      { emoji: '🤝', label: 'Negotiate the contract terms first' },
      { emoji: '✍️', label: 'Sign immediately — seize the deal' },
      { emoji: '🗑️', label: 'Ignore the offer entirely' },
    ],
    answer: 0,
  },
  {
    criterion: 'SMARTEST',
    options: [
      { emoji: '🧪', label: 'Test on a small sample before launch' },
      { emoji: '🚀', label: 'Ship it to everyone right away' },
      { emoji: '⏳', label: 'Wait indefinitely for perfection' },
    ],
    answer: 0,
  },
  {
    criterion: 'FASTEST',
    options: [
      { emoji: '🔧', label: 'Fix the leak yourself with duct tape' },
      { emoji: '📱', label: 'Search for a tutorial online' },
      { emoji: '🪣', label: 'Place a bucket and call a plumber' },
    ],
    answer: 0,
  },
  {
    criterion: 'SAFEST',
    options: [
      { emoji: '🚗', label: 'Drive through the flooded road' },
      { emoji: '🔄', label: 'Turn around and find another route' },
      { emoji: '⏸️', label: 'Park and wait for the water to drop' },
    ],
    answer: 1,
  },
  {
    criterion: 'SMARTEST',
    options: [
      { emoji: '💬', label: 'Ask for feedback before finalizing' },
      { emoji: '🤫', label: 'Keep it secret until the big reveal' },
      { emoji: '📢', label: 'Announce it publicly before it\'s ready' },
    ],
    answer: 0,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function criterionLabel(c: Criterion): string {
  return { FASTEST: 'FASTEST', SAFEST: 'SAFEST', SMARTEST: 'SMARTEST' }[c];
}

function criterionColor(c: Criterion): string {
  return { FASTEST: C.accent, SAFEST: C.success, SMARTEST: '#6366f1' }[c];
}

function getTimerDuration(round: number): number {
  if (round > 10) return 1200;
  if (round > 5) return 1500;
  return 2000;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
}

type Phase = 'ready' | 'playing' | 'feedback' | 'gameover';

export default function SplitDecision({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [queue, setQueue] = useState<ScenarioSet[]>([]);
  const [current, setCurrent] = useState<ScenarioSet | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [timerFrac, setTimerFrac] = useState(1);
  const [pressedIdx, setPressedIdx] = useState<number | null>(null);

  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const answeredRef = useRef(false);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const vfxRafRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ---------- VFX animation loop ---------- */
  useEffect(() => {
    if (particles.length === 0 && scorePops.length === 0 && shakeIntensity <= 0.1) return;
    const tick = () => {
      setParticles(prev => tickParticles(prev));
      setScorePops(prev => tickScorePops(prev));
      setShakeIntensity(prev => prev * 0.85);
      vfxRafRef.current = requestAnimationFrame(tick);
    };
    vfxRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(vfxRafRef.current);
  }, [particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0.1]);

  /* ---------- queue management ---------- */
  const refillQueue = useCallback(() => {
    const q = shuffle(SCENARIOS);
    setQueue(q);
    return q;
  }, []);

  const nextRound = useCallback(
    (q?: ScenarioSet[], r?: number) => {
      let working = q ?? queue;
      if (working.length === 0) {
        working = shuffle(SCENARIOS);
        setQueue(working);
      }
      const next = working[0];
      setQueue(working.slice(1));
      setCurrent(next);
      setChosen(null);
      setTimerFrac(1);
      answeredRef.current = false;
      setPhase('playing');

      const duration = getTimerDuration(r ?? round);
      startTimeRef.current = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const frac = Math.max(0, 1 - elapsed / duration);
        setTimerFrac(frac);
        if (frac <= 0) {
          if (!answeredRef.current) {
            sfxWrong();
            answeredRef.current = true;
            setChosen(-1); // timeout
            setPhase('feedback');
          }
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [queue, round],
  );

  /* ---------- start / restart ---------- */
  const startGame = useCallback(() => {
    sfxTap();
    setRound(1);
    setScore(0);
    setLives(3);
    const q = refillQueue();
    nextRound(q, 1);
  }, [refillQueue, nextRound]);

  /* ---------- handle choice ---------- */
  const handleChoice = useCallback(
    (idx: number) => {
      if (answeredRef.current || phase !== 'playing' || !current) return;
      answeredRef.current = true;
      cancelAnimationFrame(rafRef.current);
      setChosen(idx);
      setPhase('feedback');
    },
    [phase, current],
  );

  /* ---------- feedback effect ---------- */
  useEffect(() => {
    if (phase !== 'feedback' || current === null) return;

    const correct = chosen === current.answer;
    const elapsed = performance.now() - startTimeRef.current;
    const fast = elapsed < 1000;

    let newScore = score;
    let newLives = lives;

    if (correct) {
      sfxCorrect();
      const rect = containerRef.current?.getBoundingClientRect();
      const cx = rect ? rect.width / 2 : 200;
      const cy = rect ? rect.height / 2 : 300;
      setParticles(prev => [...prev, ...correctBurst(cx, cy)]);
      setScorePops(prev => [...prev, createScorePop(cx, cy - 40, 100 + (fast ? 50 : 0), '#00c97b')]);
      newScore += 100 + (fast ? 50 : 0);
    } else {
      sfxWrong();
      const rect = containerRef.current?.getBoundingClientRect();
      const cx = rect ? rect.width / 2 : 200;
      const cy = rect ? rect.height / 2 : 300;
      setParticles(prev => [...prev, ...wrongBurst(cx, cy)]);
      setShakeIntensity(6);
      newLives -= 1;
    }

    setScore(newScore);
    setLives(newLives);

    const timeout = setTimeout(() => {
      if (newLives <= 0) {
        sfxGameOver();
        setShakeIntensity(10);
        setPhase('gameover');
      } else {
        sfxLevelUp();
        const newRound = round + 1;
        setRound(newRound);
        nextRound(undefined, newRound);
      }
    }, 900);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ---------- cleanup ---------- */
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  /* --- shared header --- */
  const header = (showStats: boolean) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <button
        onClick={onBack}
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.radius,
          color: C.text,
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          transition: C.transition,
        }}
      >
        <ArrowLeft size={18} />
      </button>

      {showStats && (
        <>
          <span
            style={{
              color: C.muted,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            ROUND {round}
          </span>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Trophy size={16} color={C.accent} />
            <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{score}</span>
          </div>

          <div style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                size={18}
                fill={i < lives ? C.error : 'transparent'}
                color={i < lives ? C.error : C.border}
                style={{ transition: C.transition }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  /* --- VFX overlay --- */
  const vfxOverlay = (
    <>
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </>
  );

  /* --- READY screen --- */
  if (phase === 'ready') {
    return (
      <div ref={containerRef} style={{...containerStyle, ...screenShakeStyle(shakeIntensity)}}>
        {header(false)}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          <Zap size={56} color={C.accent} />
          <h1 style={{ color: C.text, fontSize: 28, margin: 0, fontWeight: 600 }}>
            Split Decision
          </h1>
          <p
            style={{
              color: C.muted,
              fontSize: 15,
              textAlign: 'center',
              maxWidth: 340,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Three options appear. Pick the right one before time runs out.
            Speed matters — answer under 1 second for a bonus.
          </p>
          <button onClick={startGame} style={primaryBtnStyle}>
            Start Game
          </button>
        </div>
        {vfxOverlay}
      </div>
    );
  }

  /* --- GAME OVER screen --- */
  if (phase === 'gameover') {
    return (
      <div ref={containerRef} style={{...containerStyle, ...screenShakeStyle(shakeIntensity)}}>
        {header(false)}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
          }}
        >
          <Trophy size={56} color={C.accent} />
          <h1 style={{ color: C.text, fontSize: 28, margin: 0, fontWeight: 600 }}>
            Game Over
          </h1>
          <p style={{ color: C.muted, fontSize: 15, margin: 0 }}>
            You reached round {round}
          </p>
          <p
            style={{
              color: C.accent,
              fontSize: 36,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {score}
          </p>
          <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>POINTS</p>
          <button onClick={startGame} style={{ ...primaryBtnStyle, gap: 8, display: 'flex', alignItems: 'center' }}>
            <RotateCcw size={18} />
            Play Again
          </button>
        </div>
        {vfxOverlay}
      </div>
    );
  }

  /* --- PLAYING / FEEDBACK --- */
  if (!current) return null;

  const cColor = criterionColor(current.criterion);
  const duration = getTimerDuration(round);
  const isCorrect = chosen === current.answer;

  return (
    <div ref={containerRef} style={{...containerStyle, ...screenShakeStyle(shakeIntensity)}}>
      {header(true)}

      {/* Criterion badge */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: cColor,
            color: '#000',
            fontWeight: 600,
            fontSize: 14,
            padding: '6px 20px',
            borderRadius: C.pill,
            letterSpacing: 1.5,
          }}
        >
          Choose the {criterionLabel(current.criterion)} option
        </span>
      </div>

      {/* Timer bar */}
      <div
        style={{
          height: 6,
          borderRadius: 3,
          background: C.border,
          marginBottom: 28,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 3,
            width: `${timerFrac * 100}%`,
            background: timerFrac > 0.3 ? cColor : C.error,
            transition: phase === 'feedback' ? 'none' : 'background 200ms ease',
          }}
        />
      </div>

      {/* Cards */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          justifyContent: 'center',
        }}
      >
        {current.options.map((opt, idx) => {
          const isFeedback = phase === 'feedback';
          const isAnswer = idx === current.answer;
          const wasChosen = idx === chosen;

          let borderColor: string = C.border;
          let bg: string = C.card;

          if (isFeedback) {
            if (isAnswer) {
              borderColor = C.success;
              bg = '#0a2a1e';
            } else if (wasChosen && !isCorrect) {
              borderColor = C.error;
              bg = '#2a0a14';
            }
          }

          const isPressed = pressedIdx === idx && phase === 'playing';

          return (
            <button
              key={idx}
              onClick={() => handleChoice(idx)}
              onPointerDown={() => setPressedIdx(idx)}
              onPointerUp={() => setPressedIdx(null)}
              onPointerLeave={() => setPressedIdx(null)}
              disabled={phase !== 'playing'}
              style={{
                background: bg,
                border: `2px solid ${borderColor}`,
                borderRadius: C.radius,
                padding: '20px 18px',
                cursor: phase === 'playing' ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                transition: `transform 120ms ease, border-color ${C.transition}, background ${C.transition}`,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{opt.emoji}</span>
              <span
                style={{
                  color: C.text,
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {opt.label}
              </span>

              {isFeedback && isAnswer && (
                <span
                  style={{
                    marginLeft: 'auto',
                    color: C.success,
                    fontWeight: 600,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  CORRECT
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Speed tier hint */}
      <p
        style={{
          textAlign: 'center',
          color: C.muted,
          fontSize: 12,
          marginTop: 16,
          margin: '16px 0 0',
        }}
      >
        {duration <= 1200
          ? 'EXTREME — 1.2s timer'
          : duration <= 1500
            ? 'FAST — 1.5s timer'
            : '2s timer'}
      </p>
      {vfxOverlay}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */
const containerStyle: React.CSSProperties = {
  background: C.bg,
  minHeight: '100vh',
  padding: '20px 16px',
  display: 'flex',
  flexDirection: 'column',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  maxWidth: 480,
  margin: '0 auto',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
};

const primaryBtnStyle: React.CSSProperties = {
  background: C.accent,
  color: '#000',
  border: 'none',
  borderRadius: C.pill,
  padding: '14px 36px',
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  transition: C.transition,
};
