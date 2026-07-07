import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Lightbulb,
  Clock,
  Star,
  Send,
  Trophy,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#1a2230',
  obsidian: '#0b0f14',
  ink: '#111820',
  card: '#151d2b',
  carbon: '#141c28',
  border: '#1f2d3d',
  violet: '#7b2ff7',
  pink: '#e879f9',
  emerald: '#00c97b',
  teal: '#00b4d8',
  sapphire: '#3a86ff',
  amber: '#f59e0b',
  rose: '#f43f5e',
  text: '#f0f4f8',
  muted: '#7a8ba0',
  dim: '#3d4f63',
  radius: 14,
  radiusSm: 8,
  radiusLg: 20,
  transition: '200ms ease',
} as const;

const GLASS_SHADOW = '0 4px 20px rgba(0,0,0,0.5)';
const GLASS_HIGHLIGHT = 'inset 0 1px 0 rgba(255,255,255,0.04)';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Category =
  | 'structural'
  | 'decorative'
  | 'tool'
  | 'weapon'
  | 'musical'
  | 'artistic'
  | 'scientific'
  | 'social';

interface SubmittedUse {
  text: string;
  points: number;
  categories: Category[];
}

interface RoundResult {
  object: string;
  uses: SubmittedUse[];
  totalPoints: number;
  bestUse: string;
}

type GamePhase = 'menu' | 'playing' | 'roundEnd' | 'gameEnd';

/* ------------------------------------------------------------------ */
/*  Object pool (15+)                                                  */
/* ------------------------------------------------------------------ */
const OBJECTS = [
  'paperclip', 'brick', 'shoe', 'pencil', 'spoon',
  'newspaper', 'rubber band', 'empty bottle', 'fork',
  'sock', 'tennis ball', 'umbrella', 'pillow',
  'ladder', 'mirror', 'bucket', 'rope',
  'cardboard box', 'toothbrush', 'clothespin',
];

/* ------------------------------------------------------------------ */
/*  Category detection keywords                                        */
/* ------------------------------------------------------------------ */
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  structural: [
    'build', 'support', 'hold', 'prop', 'bridge', 'wall', 'frame', 'scaffold',
    'brace', 'stack', 'tower', 'connect', 'attach', 'fasten', 'join', 'mount',
    'lever', 'wedge', 'block', 'pillar', 'foundation', 'arch', 'beam', 'shelf',
  ],
  decorative: [
    'decor', 'ornament', 'display', 'hang', 'arrange', 'design', 'fashion',
    'jewelry', 'necklace', 'earring', 'vase', 'wreath', 'garland', 'centerpiece',
    'art piece', 'sculpture', 'mobile', 'accent', 'beautif', 'pretty', 'flower',
  ],
  tool: [
    'open', 'cut', 'scrape', 'dig', 'stir', 'measure', 'pry', 'screwdriver',
    'hammer', 'ruler', 'pick', 'scoop', 'lever', 'fix', 'repair', 'tighten',
    'loosen', 'chisel', 'poke', 'scratch', 'sharpen', 'flatten', 'press',
  ],
  weapon: [
    'weapon', 'defend', 'throw', 'launch', 'catapult', 'slingshot', 'sword',
    'shield', 'spear', 'arrow', 'projectile', 'whip', 'flick', 'attack',
    'fight', 'protect', 'guard', 'trap', 'shoot', 'fling',
  ],
  musical: [
    'music', 'drum', 'beat', 'rhythm', 'instrument', 'sound', 'play', 'shake',
    'rattle', 'whistle', 'chime', 'bell', 'strum', 'tap', 'bang', 'clang',
    'sing', 'note', 'melody', 'tune', 'percussion', 'horn', 'flute',
  ],
  artistic: [
    'paint', 'draw', 'sculpt', 'canvas', 'stamp', 'print', 'sketch', 'color',
    'dye', 'craft', 'collage', 'mosaic', 'mold', 'carve', 'engrave', 'create',
    'art', 'stencil', 'ink', 'pattern', 'weave', 'knit', 'origami', 'puppet',
  ],
  scientific: [
    'experiment', 'test', 'measure', 'conduct', 'magnet', 'electric', 'weight',
    'balance', 'pendulum', 'lens', 'microscope', 'funnel', 'filter', 'solar',
    'circuit', 'physics', 'chemistry', 'observe', 'lab', 'sample', 'react',
  ],
  social: [
    'game', 'teach', 'gift', 'share', 'trade', 'signal', 'communicate',
    'bookmark', 'token', 'symbol', 'message', 'gesture', 'award', 'trophy',
    'prize', 'party', 'joke', 'prank', 'trick', 'story', 'prop', 'costume',
  ],
};

const CATEGORY_COLORS: Record<Category, string> = {
  structural: C.sapphire,
  decorative: C.pink,
  tool: C.amber,
  weapon: C.rose,
  musical: C.violet,
  artistic: C.teal,
  scientific: C.emerald,
  social: '#ff9f43',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function detectCategories(text: string): Category[] {
  const lower = text.toLowerCase();
  const found: Category[] = [];
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.push(cat as Category);
    }
  }
  if (found.length === 0) {
    found.push('social');
  }
  return found;
}

function scoreUse(text: string, existingUses: SubmittedUse[]): number {
  let pts = 10; // base
  // Word length bonus
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 4) pts += 5;
  if (words.length >= 7) pts += 5;
  if (words.length >= 10) pts += 5;
  // Unique word bonus
  const existingWords = new Set(
    existingUses.flatMap((u) =>
      u.text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3)
    )
  );
  const newUniqueWords = words.filter(
    (w) => w.length > 3 && !existingWords.has(w.toLowerCase())
  );
  pts += newUniqueWords.length * 2;
  return pts;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickObjects(count: number): string[] {
  return shuffleArray(OBJECTS).slice(0, count);
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const ROUNDS_PER_GAME = 5;
const ROUND_SECONDS = 60;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
}

export default function ImpossibleUses({ onBack }: Props) {
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [objects, setObjects] = useState<string[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [input, setInput] = useState('');
  const [uses, setUses] = useState<SubmittedUse[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usesEndRef = useRef<HTMLDivElement>(null);

  const currentObject = objects[currentRound] ?? '';

  /* ---- Timer ---- */
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentRound]);

  /* ---- Auto-end round when time runs out ---- */
  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) {
      endRound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  /* ---- Auto-scroll uses list ---- */
  useEffect(() => {
    usesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [uses.length]);

  /* ---- Focus input when playing ---- */
  useEffect(() => {
    if (phase === 'playing') {
      inputRef.current?.focus();
    }
  }, [phase, currentRound]);

  /* ---- Handlers ---- */
  const startGame = useCallback(() => {
    const picked = pickObjects(ROUNDS_PER_GAME);
    setObjects(picked);
    setCurrentRound(0);
    setRoundResults([]);
    setUses([]);
    setTimeLeft(ROUND_SECONDS);
    setPhase('playing');
  }, []);

  const endRound = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const totalPoints = uses.reduce((s, u) => s + u.points, 0);
    const bestUse =
      uses.length > 0
        ? uses.reduce((a, b) => (b.points > a.points ? b : a)).text
        : '(none)';
    const result: RoundResult = {
      object: currentObject,
      uses: [...uses],
      totalPoints,
      bestUse,
    };
    setRoundResults((prev) => [...prev, result]);
    setPhase('roundEnd');
  }, [uses, currentObject]);

  const nextRound = useCallback(() => {
    if (currentRound + 1 >= ROUNDS_PER_GAME) {
      setPhase('gameEnd');
    } else {
      setCurrentRound((r) => r + 1);
      setUses([]);
      setInput('');
      setTimeLeft(ROUND_SECONDS);
      setPhase('playing');
    }
  }, [currentRound]);

  const submitUse = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || phase !== 'playing') return;
    // Duplicate check
    if (uses.some((u) => u.text.toLowerCase() === trimmed.toLowerCase())) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const categories = detectCategories(trimmed);
    const points = scoreUse(trimmed, uses);
    setUses((prev) => [...prev, { text: trimmed, points, categories }]);
    setInput('');
  }, [input, phase, uses]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitUse();
      }
    },
    [submitUse]
  );

  /* ---- Compute category diversity bonus for round end ---- */
  const categoryDiversityBonus = useCallback((roundUses: SubmittedUse[]) => {
    const allCats = new Set(roundUses.flatMap((u) => u.categories));
    return allCats.size * 5;
  }, []);

  /* ---- Styles ---- */
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: C.obsidian,
    color: C.text,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    background: C.ink,
    borderBottom: `1px solid ${C.border}`,
    boxShadow: GLASS_SHADOW,
  };

  const backBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: C.muted,
    cursor: 'pointer',
    padding: 8,
    borderRadius: C.radiusSm,
    display: 'flex',
    alignItems: 'center',
    transition: C.transition,
  };

  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: C.radius,
    padding: 24,
    boxShadow: `${GLASS_SHADOW}, ${GLASS_HIGHLIGHT}`,
  };

  const primaryBtnStyle: React.CSSProperties = {
    background: C.violet,
    color: C.text,
    border: 'none',
    borderRadius: C.radius,
    padding: '14px 32px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: C.transition,
    boxShadow: `${GLASS_SHADOW}, ${GLASS_HIGHLIGHT}`,
  };

  /* ================================================================== */
  /*  MENU                                                               */
  /* ================================================================== */
  if (phase === 'menu') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Impossible Uses</span>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            gap: 32,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: C.radiusLg,
              background: C.violet,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `${GLASS_SHADOW}, ${GLASS_HIGHLIGHT}`,
            }}
          >
            <Lightbulb size={40} color={C.text} />
          </div>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 600,
                margin: '0 0 12px 0',
                color: C.text,
              }}
            >
              Impossible Uses
            </h1>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              Think of as many unusual, creative uses for everyday objects as you
              can. You have 60 seconds per round across 5 rounds. The more
              creative and diverse your ideas, the higher you score.
            </p>
          </div>
          <div
            style={{
              ...cardStyle,
              width: '100%',
              maxWidth: 360,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={16} color={C.violet} />
              <span style={{ fontSize: 14, color: C.muted }}>
                60 seconds per round
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Star size={16} color={C.pink} />
              <span style={{ fontSize: 14, color: C.muted }}>
                Scored on quantity, creativity, and diversity
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={16} color={C.amber} />
              <span style={{ fontSize: 14, color: C.muted }}>
                8 categories to discover
              </span>
            </div>
          </div>
          <button style={primaryBtnStyle} onClick={startGame}>
            <Zap size={18} />
            Start Game
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /*  PLAYING                                                            */
  /* ================================================================== */
  if (phase === 'playing') {
    const timerPct = (timeLeft / ROUND_SECONDS) * 100;
    const timerColor = timeLeft <= 10 ? C.rose : timeLeft <= 20 ? C.amber : C.violet;
    const roundPoints = uses.reduce((s, u) => s + u.points, 0);

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>
            Round {currentRound + 1}/{ROUNDS_PER_GAME}
          </span>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: timerColor,
              fontWeight: 700,
              fontSize: 18,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Clock size={16} />
            {timeLeft}s
          </div>
        </div>

        {/* Timer bar */}
        <div
          style={{
            height: 4,
            background: C.border,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: `${timerPct}%`,
              background: timerColor,
              transition: 'width 1s linear, background 0.5s ease',
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 20,
            gap: 16,
            overflow: 'hidden',
          }}
        >
          {/* Object card */}
          <div
            style={{
              ...cardStyle,
              textAlign: 'center',
              padding: '20px 24px',
            }}
          >
            <p
              style={{
                margin: '0 0 4px 0',
                fontSize: 13,
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                fontWeight: 600,
              }}
            >
              Find uses for
            </p>
            <h2
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 600,
                color: C.pink,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {currentObject}
            </h2>
          </div>

          {/* Score bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 4px',
            }}
          >
            <span style={{ fontSize: 13, color: C.muted }}>
              {uses.length} use{uses.length !== 1 ? 's' : ''} submitted
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.violet }}>
              {roundPoints} pts
            </span>
          </div>

          {/* Uses list */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              minHeight: 0,
            }}
          >
            {uses.map((u, i) => (
              <div
                key={i}
                style={{
                  background: C.carbon,
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  animation: 'fadeSlideIn 300ms ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 14, color: C.text }}>{u.text}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.violet,
                      marginLeft: 8,
                      flexShrink: 0,
                    }}
                  >
                    +{u.points}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {u.categories.map((cat) => (
                    <span
                      key={cat}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: CATEGORY_COLORS[cat],
                        background: C.ink,
                        borderRadius: 999,
                        padding: '2px 10px',
                        textTransform: 'capitalize',
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div ref={usesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              animation: shake ? 'shakeX 400ms ease' : undefined,
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a creative use..."
              style={{
                flex: 1,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: C.radius,
                padding: '14px 16px',
                fontSize: 15,
                color: C.text,
                outline: 'none',
                transition: C.transition,
              }}
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = C.violet;
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = C.border;
              }}
            />
            <button
              onClick={submitUse}
              disabled={!input.trim()}
              style={{
                background: input.trim() ? C.violet : C.dim,
                color: C.text,
                border: 'none',
                borderRadius: C.radius,
                width: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
                transition: C.transition,
                boxShadow: input.trim()
                  ? `${GLASS_SHADOW}, ${GLASS_HIGHLIGHT}`
                  : 'none',
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shakeX {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
        `}</style>
      </div>
    );
  }

  /* ================================================================== */
  /*  ROUND END                                                          */
  /* ================================================================== */
  if (phase === 'roundEnd') {
    const lastResult = roundResults[roundResults.length - 1];
    if (!lastResult) return null;
    const divBonus = categoryDiversityBonus(lastResult.uses);
    const total = lastResult.totalPoints + divBonus;

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtnStyle} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            Round {currentRound + 1} Complete
          </span>
        </div>
        <div
          style={{
            flex: 1,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            overflowY: 'auto',
          }}
        >
          {/* Summary card */}
          <div
            style={{
              ...cardStyle,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: C.radius,
                background: C.violet,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                boxShadow: `${GLASS_SHADOW}, ${GLASS_HIGHLIGHT}`,
              }}
            >
              <Star size={28} color={C.text} />
            </div>
            <div>
              <p
                style={{
                  margin: '0 0 4px 0',
                  fontSize: 13,
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Object: {lastResult.object}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 36,
                  fontWeight: 600,
                  color: C.violet,
                }}
              >
                {total}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: C.muted }}>
                points this round
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 24,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                    color: C.pink,
                  }}
                >
                  {lastResult.uses.length}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: C.muted }}>
                  Uses
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                    color: C.emerald,
                  }}
                >
                  +{divBonus}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: C.muted }}>
                  Diversity Bonus
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                    color: C.amber,
                  }}
                >
                  {new Set(lastResult.uses.flatMap((u) => u.categories)).size}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: C.muted }}>
                  Categories
                </p>
              </div>
            </div>
          </div>

          {/* Best use */}
          {lastResult.uses.length > 0 && (
            <div
              style={{
                ...cardStyle,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 18px',
              }}
            >
              <Sparkles size={18} color={C.pink} />
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: C.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  Most Creative Use
                </p>
                <p
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: 15,
                    color: C.text,
                    fontWeight: 600,
                  }}
                >
                  {lastResult.bestUse}
                </p>
              </div>
            </div>
          )}

          {/* All uses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontWeight: 600,
              }}
            >
              All Uses
            </p>
            {lastResult.uses.map((u, i) => (
              <div
                key={i}
                style={{
                  background: C.carbon,
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color:
                        u.text === lastResult.bestUse ? C.pink : C.text,
                      fontWeight: u.text === lastResult.bestUse ? 700 : 400,
                    }}
                  >
                    {u.text}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.violet,
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    +{u.points}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {u.categories.map((cat) => (
                    <span
                      key={cat}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: CATEGORY_COLORS[cat],
                        background: C.ink,
                        borderRadius: 999,
                        padding: '2px 10px',
                        textTransform: 'capitalize',
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Next button */}
          <button
            style={{ ...primaryBtnStyle, width: '100%', marginTop: 8 }}
            onClick={nextRound}
          >
            {currentRound + 1 >= ROUNDS_PER_GAME ? (
              <>
                <Trophy size={18} />
                See Final Results
              </>
            ) : (
              <>
                <ChevronRight size={18} />
                Next Round
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /*  GAME END                                                           */
  /* ================================================================== */
  const grandTotal = roundResults.reduce((s, r) => {
    const div = categoryDiversityBonus(r.uses);
    return s + r.totalPoints + div;
  }, 0);
  const bestRound = roundResults.reduce(
    (best, r, i) => {
      const div = categoryDiversityBonus(r.uses);
      const t = r.totalPoints + div;
      return t > best.score ? { index: i, score: t } : best;
    },
    { index: 0, score: 0 }
  );
  const allUses = roundResults.flatMap((r) => r.uses);
  const mostCreativeUse =
    allUses.length > 0
      ? allUses.reduce((a, b) => (b.points > a.points ? b : a)).text
      : '(none)';
  const totalUsesCount = allUses.length;
  const allCategories = new Set(allUses.flatMap((u) => u.categories));

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button style={backBtnStyle} onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontSize: 18, fontWeight: 700 }}>Game Complete</span>
      </div>
      <div
        style={{
          flex: 1,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto',
        }}
      >
        {/* Trophy card */}
        <div
          style={{
            ...cardStyle,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: C.radiusLg,
              background: C.violet,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              boxShadow: `${GLASS_SHADOW}, ${GLASS_HIGHLIGHT}`,
            }}
          >
            <Trophy size={36} color={C.text} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 48,
                fontWeight: 600,
                color: C.violet,
              }}
            >
              {grandTotal}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: 15, color: C.muted }}>
              Total Creativity Score
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: C.pink,
                }}
              >
                {totalUsesCount}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: C.muted }}>
                Total Uses
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: C.emerald,
                }}
              >
                {allCategories.size}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: C.muted }}>
                Categories
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: C.amber,
                }}
              >
                R{bestRound.index + 1}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: 12, color: C.muted }}>
                Best Round
              </p>
            </div>
          </div>
        </div>

        {/* Most creative use */}
        <div
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
          }}
        >
          <Sparkles size={18} color={C.pink} />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: C.muted,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Most Creative Use Overall
            </p>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: 15,
                color: C.text,
                fontWeight: 600,
              }}
            >
              {mostCreativeUse}
            </p>
          </div>
        </div>

        {/* Per-round breakdown */}
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: C.muted,
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 600,
          }}
        >
          Round Breakdown
        </p>
        {roundResults.map((r, i) => {
          const div = categoryDiversityBonus(r.uses);
          return (
            <div
              key={i}
              style={{
                background: C.carbon,
                border: `1px solid ${C.border}`,
                borderRadius: C.radiusSm,
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                  }}
                >
                  R{i + 1}: {r.object}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: C.muted }}>
                  {r.uses.length} uses
                </p>
              </div>
              <span
                style={{ fontSize: 18, fontWeight: 700, color: C.violet }}
              >
                {r.totalPoints + div}
              </span>
            </div>
          );
        })}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            style={{
              ...primaryBtnStyle,
              flex: 1,
              background: C.dim,
            }}
            onClick={onBack}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button
            style={{ ...primaryBtnStyle, flex: 1 }}
            onClick={startGame}
          >
            <RotateCcw size={18} />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
