import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, X, Play, Heart, Skull, Trophy, Crown, Sparkles, Users, ChevronRight, RotateCcw, Hand, Flame, Shield, PenLine, Trash2, AlertTriangle } from 'lucide-react';
import { RADIUS, MOTION, solidBtn } from '../lib/design';
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver, sfxReveal, sfxLevelUp } from '../lib/sfx';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#080c12',
  card: '#151d2b',
  border: '#1c2940',
  text: '#e8edf5',
  muted: '#8494a7',
  dim: '#4a5d75',
  rose: '#f43f5e',
  emerald: '#00c97b',
  amber: '#f59e0b',
  sapphire: '#3a86ff',
  violet: '#7b2ff7',
  teal: '#00b4d8',
  coral: '#ff6b6b',
  gold: '#fbbf24',
  glass: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)',
  glassHover: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6)',
} as const;

/* ------------------------------------------------------------------ */
/*  Mode definitions                                                   */
/* ------------------------------------------------------------------ */
type Mode = 'clean' | 'spicy' | 'custom';

const MODE_META: Record<Mode, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  clean: { label: 'Clean', color: C.emerald, icon: <Shield size={18} />, description: 'Family-friendly fun for mixed groups' },
  spicy: { label: 'Spicy', color: C.rose, icon: <Flame size={18} />, description: 'Adults only — genuinely provocative' },
  custom: { label: 'Custom', color: C.violet, icon: <PenLine size={18} />, description: 'Add your own statements to the mix' },
};

const CUSTOM_STORAGE_KEY = 'kasuku-nhie-custom';

/* ------------------------------------------------------------------ */
/*  Statements — 80+ per mode                                          */
/* ------------------------------------------------------------------ */
const CLEAN_STATEMENTS: string[] = [
  'been on a plane',
  'eaten sushi',
  'pulled an all-nighter',
  'been to a concert',
  'had a pet fish',
  'gone camping',
  'broken a bone',
  'been on TV',
  'met someone famous',
  'won a trophy',
  'been to a wedding',
  'dyed my hair',
  'ridden a horse',
  'been to another country',
  'eaten an entire pizza by myself',
  'fallen asleep in class',
  'been in a food fight',
  'gone skiing or snowboarding',
  'gotten a speeding ticket',
  'sung karaoke',
  'been to a theme park',
  'stayed up for 24 hours straight',
  'read an entire book in one day',
  'lost my phone',
  'been stung by a bee',
  'cooked a meal from scratch',
  'bungee jumped',
  'gone skydiving',
  'swum with sharks',
  'climbed a mountain',
  'tried surfing',
  'traveled solo to a foreign country',
  'slept outside under the stars',
  'gone scuba diving',
  'ridden a motorcycle',
  'gone white water rafting',
  'gone zip-lining',
  'called a teacher "mom" or "dad"',
  'waved at someone who was not waving at me',
  'sent a text to the wrong person',
  'walked into a glass door',
  'tripped in public and pretended to jog',
  'laughed so hard I snorted',
  'had food stuck in my teeth all day',
  'forgotten someone\'s name right after they told me',
  'been caught talking to myself',
  'walked into the wrong bathroom',
  'tried to push a pull door in front of people',
  'worn my shirt inside out all day without noticing',
  'said goodbye to someone then walked the same direction',
  'replied "you too" when a waiter said "enjoy your meal"',
  'accidentally liked an old photo while scrolling',
  'been caught singing loudly in my car',
  'spilled a drink on someone at a party',
  'cried during a movie in the theater',
  'talked to my pet like a human',
  'pretended to text to avoid someone',
  'faked being sick to skip something',
  'eaten food off the floor',
  'let someone else take the blame',
  'forgotten my own phone number',
  'walked into a room and forgot why',
  'gotten lost in my own city',
  'worn mismatched socks on purpose',
  'binge-watched an entire series in one day',
  'done karaoke completely sober',
  'been scared by my own reflection',
  'laughed at something I should not have',
  'had a dream so good I tried to go back to sleep',
  'accidentally called someone the wrong name to their face',
  'burned food so badly the smoke alarm went off',
  'danced alone in my room for over an hour',
  'waved back at someone waving to the person behind me',
  'been the last person picked for a team',
  'cried over a commercial',
  'pretended to know a song and made up the lyrics',
  'gone an entire day without realizing I had something on my face',
  'fallen off a chair in public',
  'accidentally hit reply-all',
  'slept through an alarm for something important',
  'locked myself out of my house',
  'had my stomach growl incredibly loudly in a quiet room',
  'said something out loud I meant to say in my head',
  'thought today was a different day of the week',
  'eaten cereal for dinner more than three nights in a row',
];

const SPICY_STATEMENTS: string[] = [
  'sent a nude',
  'had a crush on my friend\'s partner',
  'been caught doing something I shouldn\'t',
  'hooked up with someone I met that day',
  'lied about my body count',
  'had a one night stand',
  'been walked in on during sex',
  'sent a text to the wrong person that was meant to be dirty',
  'kissed someone of the same gender',
  'done something sexual in a public place',
  'faked an orgasm',
  'slept with an ex after the breakup',
  'had a friends-with-benefits arrangement',
  'ghosted someone after sleeping with them',
  'been the other woman or the other man',
  'had a threesome',
  'sexted a stranger',
  'been handcuffed or tied up',
  'hooked up with a coworker',
  'been caught watching porn',
  'slept with someone to get over someone else',
  'had sex in a car',
  'used a dating app just for hookups',
  'lied about my age to someone I was interested in',
  'had a sugar daddy or sugar mama',
  'flirted my way out of a ticket',
  'kissed someone at midnight on New Year\'s who I didn\'t know',
  'gone commando to an important event',
  'drunk-texted an ex',
  'had a walk of shame',
  'skinny-dipped with strangers',
  'been in a love triangle',
  'had sex on the first date',
  'made out with someone in a bathroom',
  'been propositioned by someone much older',
  'told someone I loved them and didn\'t mean it',
  'kept a relationship secret',
  'had phone sex',
  'been to a strip club',
  'hooked up with someone whose name I didn\'t know',
  'pretended to be single when I wasn\'t',
  'had a crush on a teacher or professor',
  'role-played in the bedroom',
  'screenshotted someone\'s DMs to show my friends',
  'stalked an ex\'s new partner on social media',
  'gone back to someone I said I was done with',
  'let someone take a suggestive photo of me',
  'slid into someone\'s DMs at 2 AM',
  'been turned on at a completely inappropriate time',
  'had a fantasy about someone in this room',
  'made out with two different people in the same night',
  'been kicked out of a bar or club',
  'done a body shot',
  'woken up next to someone and not remembered how I got there',
  'cheated on a partner',
  'been cheated on and stayed',
  'had an affair with a married person',
  'told a lie to get someone into bed',
  'been caught sneaking someone out in the morning',
  'sent a spicy photo to the wrong person',
  'had sex in someone else\'s bed without them knowing',
  'been to an adult store with friends',
  'used food during intimacy',
  'been with someone more than ten years older or younger',
  'had a rebound that turned into a relationship',
  'flashed someone intentionally',
  'made a sex tape',
  'had a no-strings-attached vacation fling',
  'lied about where I was to hook up with someone',
  'had a crush on my best friend',
  'been in a relationship where the physical part was the only good part',
  'tried to make someone jealous on purpose',
  'hooked up at a house party while people were in the next room',
  'been caught making out in public by someone I knew',
  'matched with someone I know on a dating app and swiped right',
  'had a secret social media account for flirting',
  'told my friends a hookup was better than it actually was',
  'given a fake number to someone hitting on me',
  'had a situationship that lasted over six months',
  'kept dating someone just because the sex was good',
  'been so attracted to someone I couldn\'t form words',
  'used someone\'s Netflix after we stopped seeing each other',
  'practiced kissing on my hand or a pillow',
  'had a romantic dream about a friend and acted weird around them after',
];

/* ------------------------------------------------------------------ */
/*  Game types                                                         */
/* ------------------------------------------------------------------ */
interface Player {
  name: string;
  lives: number;
  totalLost: number;
  roundEliminated: number | null;
  responses: boolean[];
}

type Phase = 'setup' | 'playing' | 'responding' | 'roundResult' | 'results';

const MAX_ROUNDS = 20;
const MAX_LIVES = 10;

/* ------------------------------------------------------------------ */
/*  Shuffle utility                                                    */
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
/*  Life dots component                                                */
/* ------------------------------------------------------------------ */
function LifeDots({ lives, max, color }: { lives: number; max: number; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i < lives ? color : C.dim + '40',
            transition: `all ${MOTION.spring}`,
            transform: i < lives ? 'scale(1)' : 'scale(0.5)',
            opacity: i < lives ? 1 : 0.3,
            boxShadow: i < lives ? `0 0 6px ${color}60` : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Splash animation overlay                                           */
/* ------------------------------------------------------------------ */
function SplashOverlay({ color, onDone }: { color: string; onDone: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setStage(1));
    const t1 = setTimeout(() => setStage(2), 400);
    const t2 = setTimeout(() => onDone(), 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      {/* Pulsing ring */}
      <div style={{
        width: stage >= 1 ? 200 : 10,
        height: stage >= 1 ? 200 : 10,
        borderRadius: '50%',
        border: `3px solid ${color}`,
        opacity: stage === 2 ? 0 : 0.7,
        transition: 'width 350ms cubic-bezier(.34,1.56,.64,1), height 350ms cubic-bezier(.34,1.56,.64,1), opacity 300ms ease',
      }} />
      {/* Center dot burst */}
      <div style={{
        position: 'absolute',
        width: stage >= 1 ? 60 : 0,
        height: stage >= 1 ? 60 : 0,
        borderRadius: '50%',
        background: color,
        opacity: stage === 2 ? 0 : 0.5,
        transition: 'all 300ms cubic-bezier(.34,1.56,.64,1)',
      }} />
      {/* Radiating particles */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dist = stage >= 1 ? 90 : 0;
        return (
          <div key={i} style={{
            position: 'absolute',
            width: 8, height: 8, borderRadius: '50%',
            background: color,
            opacity: stage === 2 ? 0 : 0.8,
            transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(${stage >= 1 ? 1 : 0})`,
            transition: 'all 400ms cubic-bezier(.34,1.56,.64,1), opacity 250ms ease',
          }} />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  localStorage helpers for custom statements                         */
/* ------------------------------------------------------------------ */
function loadCustomStatements(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((s: unknown) => typeof s === 'string' && (s as string).trim().length > 0);
  } catch { /* ignore */ }
  return [];
}

function saveCustomStatements(stmts: string[]) {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(stmts));
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Player color helper                                                */
/* ------------------------------------------------------------------ */
const PLAYER_COLORS = [C.rose, C.sapphire, C.emerald, C.amber, C.violet, C.teal, C.coral, C.gold, C.rose, C.sapphire];
function pColor(idx: number) { return PLAYER_COLORS[idx % PLAYER_COLORS.length]; }

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function NeverHaveIEver({ onBack, onGameEnd }: { onBack: () => void; onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void }) {
  // Setup state
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [selectedMode, setSelectedMode] = useState<Mode>('clean');
  const [customStatements, setCustomStatements] = useState<string[]>(loadCustomStatements);
  const [customInput, setCustomInput] = useState('');

  // Game state
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(0);
  const [statements, setStatements] = useState<string[]>([]);
  const [currentStatement, setCurrentStatement] = useState('');
  const [responses, setResponses] = useState<Map<number, boolean>>(new Map());
  const [revealStatement, setRevealStatement] = useState(false);
  const [, setShowRoundResult] = useState(false);
  const [showSplash, setShowSplash] = useState<{ color: string } | null>(null);

  // Track per-round majority data for "Biggest Surprise" superlative
  const majorityDiffRef = useRef<Map<number, number>>(new Map());

  // Active players
  const activePlayers = useMemo(() => players.filter(p => p.lives > 0), [players]);
  const activeIndices = useMemo(() => {
    const indices: number[] = [];
    players.forEach((p, i) => { if (p.lives > 0) indices.push(i); });
    return indices;
  }, [players]);

  // Build statement pool
  const buildStatementPool = useCallback((): string[] => {
    let base: string[];
    if (selectedMode === 'clean') {
      base = [...CLEAN_STATEMENTS];
    } else if (selectedMode === 'spicy') {
      base = [...SPICY_STATEMENTS];
    } else {
      // Custom mode: custom statements mixed with clean as fallback
      base = [...customStatements, ...CLEAN_STATEMENTS];
    }
    if (selectedMode !== 'custom' && customStatements.length > 0 && selectedMode === 'clean') {
      // In clean mode, do not mix custom
    }
    return shuffle(base);
  }, [selectedMode, customStatements]);

  // Add custom statement
  const addCustomStatement = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed || customStatements.includes(trimmed)) return;
    const next = [...customStatements, trimmed];
    setCustomStatements(next);
    saveCustomStatements(next);
    setCustomInput('');
    sfxTap();
  }, [customInput, customStatements]);

  // Remove custom statement
  const removeCustomStatement = useCallback((idx: number) => {
    const next = customStatements.filter((_, i) => i !== idx);
    setCustomStatements(next);
    saveCustomStatements(next);
  }, [customStatements]);

  // Start game
  const startGame = useCallback(() => {
    const validNames = playerNames.filter(n => n.trim().length > 0);
    if (validNames.length < 2) return;
    if (selectedMode === 'custom' && customStatements.length === 0) return;
    sfxTap();

    const stmts = buildStatementPool();
    majorityDiffRef.current = new Map();

    setPlayers(validNames.map(name => ({
      name: name.trim(),
      lives: MAX_LIVES,
      totalLost: 0,
      roundEliminated: null,
      responses: [],
    })));
    setStatements(stmts);
    setRound(0);
    setPhase('playing');
  }, [playerNames, selectedMode, customStatements, buildStatementPool]);

  // Next round
  const nextRound = useCallback(() => {
    if (round >= statements.length || round >= MAX_ROUNDS || activePlayers.length <= 1) {
      setPhase('results');
      return;
    }

    setCurrentStatement(statements[round]);
    setResponses(new Map());
    setRevealStatement(false);
    setShowRoundResult(false);
    setPhase('responding');

    setTimeout(() => setRevealStatement(true), 100);
  }, [round, statements, activePlayers.length]);

  // Start first round when entering playing phase
  useEffect(() => {
    if (phase === 'playing') {
      nextRound();
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle player response
  const handleResponse = useCallback((playerIndex: number, iHave: boolean) => {
    if (iHave) {
      sfxWrong();
      setShowSplash({ color: pColor(playerIndex) });
    } else {
      sfxCorrect();
    }
    setResponses(prev => {
      const next = new Map(prev);
      next.set(playerIndex, iHave);
      return next;
    });
  }, []);

  // All active players have responded
  const allResponded = useMemo(() => {
    return activeIndices.every(i => responses.has(i));
  }, [activeIndices, responses]);

  // Submit round responses
  const submitRound = useCallback(() => {
    if (!allResponded) return;
    sfxReveal();

    // Calculate majority for "Biggest Surprise"
    const activeResponses = activeIndices.map(i => responses.get(i));
    const haveCount = activeResponses.filter(r => r === true).length;
    const haventCount = activeResponses.filter(r => r === false).length;
    const majorityIsHave = haveCount >= haventCount;

    activeIndices.forEach(i => {
      const resp = responses.get(i);
      const isMinority = majorityIsHave ? resp === false : resp === true;
      // Only count as "surprise" if they are the minority AND there is a clear majority
      if (isMinority && haveCount !== haventCount) {
        majorityDiffRef.current.set(i, (majorityDiffRef.current.get(i) || 0) + 1);
      }
    });

    setPlayers(prev => {
      const next = prev.map((p, i) => {
        if (p.lives <= 0) return p;
        const resp = responses.get(i);
        const iHave = resp === true;
        const newLives = iHave ? Math.max(0, p.lives - 1) : p.lives;
        return {
          ...p,
          lives: newLives,
          totalLost: p.totalLost + (iHave ? 1 : 0),
          roundEliminated: newLives === 0 && p.roundEliminated === null ? round + 1 : p.roundEliminated,
          responses: [...p.responses, iHave],
        };
      });
      return next;
    });

    setShowRoundResult(true);
    setPhase('roundResult');
  }, [allResponded, responses, round, activeIndices]);

  // Advance to next round
  const advanceRound = useCallback(() => {
    const remaining = players.filter(p => {
      if (p.lives <= 0) return false;
      const resp = responses.get(players.indexOf(p));
      if (resp === true && p.lives === 1) return false;
      return true;
    });

    if (remaining.length <= 1 || round + 1 >= MAX_ROUNDS || round + 1 >= statements.length) {
      sfxGameOver();
      setPhase('results');
      return;
    }

    sfxLevelUp();
    setRound(r => r + 1);
    setPhase('playing');
  }, [players, responses, round, statements.length]);

  // Check after players update
  useEffect(() => {
    if (phase === 'roundResult') {
      // Handled by advanceRound
    }
  }, [players, phase]);

  // Report score at game end
  useEffect(() => {
    if (phase === 'results' && players.length > 0) {
      onGameEnd?.({
        score: round + 1,
        accuracy: 1.0,
        level: 1,
        maxScore: MAX_ROUNDS,
      });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute superlatives for results
  const superlatives = useMemo(() => {
    if (players.length === 0) return null;

    const sorted = [...players].sort((a, b) => {
      if (a.lives !== b.lives) return b.lives - a.lives;
      return (a.roundEliminated ?? Infinity) - (b.roundEliminated ?? Infinity);
    });

    const lastStanding = sorted[0];
    const mostExperienced = [...players].sort((a, b) => b.totalLost - a.totalLost)[0];
    const mostInnocent = [...players].sort((a, b) => a.totalLost - b.totalLost)[0];
    const firstOut = [...players].filter(p => p.roundEliminated !== null).sort((a, b) => (a.roundEliminated ?? 99) - (b.roundEliminated ?? 99))[0] || null;

    // Biggest Surprise: player who most often answered differently from the majority
    let biggestSurprise: Player | null = null;
    let maxSurpriseCount = 0;
    const diffMap = majorityDiffRef.current;
    players.forEach((p, i) => {
      const count = diffMap.get(i) || 0;
      if (count > maxSurpriseCount) {
        maxSurpriseCount = count;
        biggestSurprise = p;
      }
    });

    return { lastStanding, mostExperienced, mostInnocent, firstOut, biggestSurprise, biggestSurpriseCount: maxSurpriseCount, ranking: sorted };
  }, [players]);

  // Restart
  const restart = useCallback(() => {
    setPhase('setup');
    setPlayers([]);
    setRound(0);
    setStatements([]);
    setResponses(new Map());
    majorityDiffRef.current = new Map();
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Shared styles                                                      */
  /* ------------------------------------------------------------------ */
  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: RADIUS.lg,
    boxShadow: C.glass,
    padding: 20,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
  };

  const modeColor = MODE_META[selectedMode].color;

  /* ------------------------------------------------------------------ */
  /*  SETUP PHASE                                                        */
  /* ------------------------------------------------------------------ */
  if (phase === 'setup') {
    const canStart = playerNames.filter(n => n.trim()).length >= 2 && (selectedMode !== 'custom' || customStatements.length > 0);

    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {/* Header */}
        <div style={headerStyle}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <Hand size={22} style={{ color: C.rose }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Never Have I Ever</div>
            <div style={{ fontSize: 12, color: C.muted }}>Party game for 2-10 players</div>
          </div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Players section */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: C.sapphire }} />
              Players ({playerNames.filter(n => n.trim()).length}/10)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {playerNames.map((name, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: pColor(i),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {(name || `P${i + 1}`).charAt(0).toUpperCase()}
                  </div>
                  <input
                    value={name}
                    onChange={e => {
                      const next = [...playerNames];
                      next[i] = e.target.value;
                      setPlayerNames(next);
                    }}
                    placeholder={`Player ${i + 1}`}
                    style={{
                      flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.sm,
                      padding: '8px 12px', color: C.text, fontSize: 14, outline: 'none',
                      transition: `border-color ${MOTION.fast}`,
                    }}
                    onFocus={e => e.target.style.borderColor = C.sapphire}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                  {playerNames.length > 2 && (
                    <button
                      onClick={() => setPlayerNames(prev => prev.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 4, display: 'flex' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {playerNames.length < 10 && (
              <button
                onClick={() => setPlayerNames(prev => [...prev, ''])}
                style={{
                  background: C.bg, border: `1px dashed ${C.border}`, borderRadius: RADIUS.sm,
                  padding: '8px 16px', color: C.muted, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 6, fontSize: 13, width: '100%', justifyContent: 'center',
                  transition: `all ${MOTION.fast}`,
                }}
              >
                <Plus size={14} /> Add Player
              </button>
            )}
          </div>

          {/* Mode selection */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={16} style={{ color: C.amber }} />
              Mode
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(Object.entries(MODE_META) as [Mode, typeof MODE_META[Mode]][]).map(([mode, meta]) => {
                const selected = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => { setSelectedMode(mode); sfxTap(); }}
                    style={{
                      background: selected ? meta.color + '18' : C.bg,
                      border: `1px solid ${selected ? meta.color + '60' : C.border}`,
                      borderRadius: RADIUS.md,
                      padding: '14px 16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: `all ${MOTION.fast}`,
                      boxShadow: selected ? `0 0 12px ${meta.color}20` : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div style={{ color: selected ? meta.color : C.dim }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: selected ? meta.color : C.text, marginBottom: 2 }}>
                        {meta.label}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.3 }}>
                        {meta.description}
                      </div>
                    </div>
                    {selected && (
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', background: meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedMode === 'spicy' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
                padding: '8px 12px', borderRadius: RADIUS.sm,
                background: C.rose + '10', border: `1px solid ${C.rose}25`,
              }}>
                <AlertTriangle size={14} style={{ color: C.rose, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: C.rose }}>Adults only. Seriously.</span>
              </div>
            )}
          </div>

          {/* Custom statements editor (visible when custom mode selected) */}
          {selectedMode === 'custom' && (
            <div style={{ ...cardStyle, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <PenLine size={16} style={{ color: C.violet }} />
                Your Statements ({customStatements.length})
              </div>

              {/* Add new */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCustomStatement(); }}
                  placeholder="e.g. eaten a whole cake alone"
                  style={{
                    flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.sm,
                    padding: '8px 12px', color: C.text, fontSize: 13, outline: 'none',
                    transition: `border-color ${MOTION.fast}`,
                  }}
                  onFocus={e => e.target.style.borderColor = C.violet}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
                <button
                  onClick={addCustomStatement}
                  disabled={!customInput.trim()}
                  style={{
                    ...solidBtn(C.violet),
                    padding: '8px 14px',
                    fontSize: 12,
                    opacity: customInput.trim() ? 1 : 0.4,
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* List */}
              {customStatements.length === 0 ? (
                <div style={{ fontSize: 12, color: C.dim, textAlign: 'center', padding: '12px 0' }}>
                  No custom statements yet. Add some above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                  {customStatements.map((stmt, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px', borderRadius: RADIUS.sm,
                      background: C.bg, border: `1px solid ${C.border}`,
                    }}>
                      <span style={{ flex: 1, fontSize: 12, color: C.text }}>{stmt}</span>
                      <button
                        onClick={() => removeCustomStatement(i)}
                        style={{ background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 2, display: 'flex' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 11, color: C.dim, marginTop: 8 }}>
                Your statements are saved locally and mixed into the deck.
              </div>
            </div>
          )}

          {/* Rules */}
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>How to Play</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              1. Everyone starts with 10 lives<br />
              2. A statement appears: "Never have I ever..."<br />
              3. Each player taps "I Have" if they have done it, or "I Haven't" if not<br />
              4. Players who HAVE done it lose a life<br />
              5. Reach 0 lives and you are out. Last one standing wins!
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startGame}
            disabled={!canStart}
            style={{
              ...solidBtn(C.rose),
              width: '100%',
              justifyContent: 'center',
              padding: '14px 24px',
              fontSize: 16,
              opacity: canStart ? 1 : 0.4,
            }}
          >
            <Play size={18} /> Start Game
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  RESPONDING PHASE                                                   */
  /* ------------------------------------------------------------------ */
  if (phase === 'responding') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {/* Splash overlay */}
        {showSplash && (
          <SplashOverlay color={showSplash.color} onDone={() => setShowSplash(null)} />
        )}

        {/* Header */}
        <div style={headerStyle}>
          <Hand size={20} style={{ color: C.rose }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Round {round + 1}</span>
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>of {Math.min(MAX_ROUNDS, statements.length)}</span>
          </div>
          <div style={{
            background: modeColor + '20', color: modeColor,
            borderRadius: RADIUS.full, padding: '4px 12px', fontSize: 11, fontWeight: 600,
          }}>
            {MODE_META[selectedMode].label}
          </div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Statement card */}
          <div style={{
            ...cardStyle,
            marginBottom: 24,
            textAlign: 'center',
            border: `1px solid ${modeColor}30`,
            transform: revealStatement ? 'translateY(0)' : 'translateY(30px)',
            opacity: revealStatement ? 1 : 0,
            transition: `transform ${MOTION.spring}, opacity ${MOTION.med}`,
          }}>
            <div style={{ fontSize: 13, color: modeColor, fontWeight: 600, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Never have I ever...
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.4 }}>
              {currentStatement}
            </div>
          </div>

          {/* Player response grid */}
          <div style={{ display: 'grid', gridTemplateColumns: activePlayers.length <= 4 ? '1fr' : '1fr 1fr', gap: 10 }}>
            {players.map((player, idx) => {
              if (player.lives <= 0) return null;
              const hasResponded = responses.has(idx);
              const response = responses.get(idx);
              const pc = pColor(idx);

              return (
                <div key={idx} style={{
                  ...cardStyle,
                  padding: 14,
                  border: `1px solid ${hasResponded ? (response ? C.rose + '50' : C.emerald + '50') : C.border}`,
                  transition: `all ${MOTION.fast}`,
                }}>
                  {/* Player name + lives */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: pc,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{player.name}</div>
                      <LifeDots lives={player.lives} max={MAX_LIVES} color={pc} />
                    </div>
                  </div>

                  {/* Response buttons */}
                  {!hasResponded ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleResponse(idx, true)}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: RADIUS.sm,
                          background: C.rose + '20', border: `1px solid ${C.rose}40`,
                          color: C.rose, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: `all ${MOTION.snap}`,
                        }}
                      >
                        I Have
                      </button>
                      <button
                        onClick={() => handleResponse(idx, false)}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: RADIUS.sm,
                          background: C.emerald + '20', border: `1px solid ${C.emerald}40`,
                          color: C.emerald, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          transition: `all ${MOTION.snap}`,
                        }}
                      >
                        I Haven't
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      padding: '10px 0', borderRadius: RADIUS.sm, textAlign: 'center',
                      background: response ? C.rose + '15' : C.emerald + '15',
                      color: response ? C.rose : C.emerald,
                      fontSize: 12, fontWeight: 600,
                      transition: `all ${MOTION.fast}`,
                    }}>
                      {response ? 'I Have' : 'I Haven\'t'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            onClick={submitRound}
            disabled={!allResponded}
            style={{
              ...solidBtn(C.sapphire),
              width: '100%',
              justifyContent: 'center',
              padding: '14px 24px',
              fontSize: 15,
              marginTop: 20,
              opacity: allResponded ? 1 : 0.35,
              transition: `all ${MOTION.fast}`,
            }}
          >
            <ChevronRight size={18} /> Reveal Results
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  ROUND RESULT PHASE                                                 */
  /* ------------------------------------------------------------------ */
  if (phase === 'roundResult') {
    const guiltyPlayers = Array.from(responses.entries()).filter(([_, v]) => v).map(([i]) => i);
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={headerStyle}>
          <Hand size={20} style={{ color: C.rose }} />
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>Round {round + 1} Results</div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Statement recap */}
          <div style={{ ...cardStyle, marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Never have I ever...</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{currentStatement}</div>
          </div>

          {/* Guilty list */}
          {guiltyPlayers.length > 0 ? (
            <div style={{ ...cardStyle, marginBottom: 16, border: `1px solid ${C.rose}30` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.rose, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Skull size={15} /> Lost a life ({guiltyPlayers.length})
              </div>
              {guiltyPlayers.map(i => {
                const p = players[i];
                const pc = pColor(i);
                const justEliminated = p.lives === 0;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: pc,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff',
                    }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <LifeDots lives={p.lives} max={MAX_LIVES} color={pc} />
                    </div>
                    {justEliminated && (
                      <div style={{
                        background: C.rose + '20', color: C.rose, borderRadius: RADIUS.full,
                        padding: '3px 10px', fontSize: 11, fontWeight: 600,
                      }}>
                        ELIMINATED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ ...cardStyle, marginBottom: 16, textAlign: 'center', color: C.emerald }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Everyone is innocent this round!</div>
            </div>
          )}

          {/* Safe list */}
          {activeIndices.filter(i => !responses.get(i)).length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 20, border: `1px solid ${C.emerald}30` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.emerald, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Heart size={15} /> Safe
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {activeIndices.filter(i => !responses.get(i)).map(i => {
                  const pc = pColor(i);
                  return (
                    <div key={i} style={{
                      background: pc + '18', border: `1px solid ${pc}30`,
                      borderRadius: RADIUS.full, padding: '4px 12px', fontSize: 12, fontWeight: 600,
                      color: C.text,
                    }}>
                      {players[i].name}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
            onClick={advanceRound}
            style={{
              ...solidBtn(C.sapphire),
              width: '100%',
              justifyContent: 'center',
              padding: '14px 24px',
              fontSize: 15,
            }}
          >
            {activePlayers.filter(p => p.lives > 0).length <= 1 || round + 1 >= MAX_ROUNDS
              ? <><Trophy size={18} /> See Final Results</>
              : <><ChevronRight size={18} /> Next Round</>
            }
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  RESULTS PHASE                                                      */
  /* ------------------------------------------------------------------ */
  if (phase === 'results' && superlatives) {
    const { lastStanding, mostExperienced, mostInnocent, firstOut, biggestSurprise, biggestSurpriseCount, ranking } = superlatives;

    const awards: { label: string; icon: React.ReactNode; player: Player | null; color: string; subtitle: string }[] = [
      { label: 'Last Standing', icon: <Crown size={20} />, player: lastStanding, color: C.gold, subtitle: `${lastStanding.lives} ${lastStanding.lives === 1 ? 'life' : 'lives'} remaining` },
      { label: 'Most Experienced', icon: <Sparkles size={20} />, player: mostExperienced, color: C.rose, subtitle: `Lost ${mostExperienced.totalLost} lives` },
      { label: 'Most Innocent', icon: <Heart size={20} />, player: mostInnocent, color: C.emerald, subtitle: `Only lost ${mostInnocent.totalLost} lives` },
      { label: 'First Casualty', icon: <Skull size={20} />, player: firstOut, color: C.coral, subtitle: firstOut ? `Eliminated round ${firstOut.roundEliminated}` : 'Nobody eliminated' },
      { label: 'Biggest Surprise', icon: <AlertTriangle size={20} />, player: biggestSurprise, color: C.teal, subtitle: biggestSurprise ? `Went against the group ${biggestSurpriseCount} time${biggestSurpriseCount === 1 ? '' : 's'}` : 'Everyone agreed' },
    ];

    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={headerStyle}>
          <Trophy size={20} style={{ color: C.gold }} />
          <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Game Over</div>
          <div style={{ fontSize: 12, color: C.muted }}>{round + 1} rounds played</div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Winner banner */}
          <div style={{
            ...cardStyle,
            marginBottom: 20,
            textAlign: 'center',
            border: `1px solid ${C.gold}40`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5), 0 0 30px ${C.gold}15`,
            padding: 28,
          }}>
            <Crown size={36} style={{ color: C.gold, marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: C.gold, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Winner
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>
              {lastStanding.name}
            </div>
            <div style={{ fontSize: 14, color: C.muted }}>
              Survived with {lastStanding.lives} {lastStanding.lives === 1 ? 'life' : 'lives'} remaining
            </div>
          </div>

          {/* Superlative awards — top row 2, second row 2, third row 1 centered */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            {awards.slice(0, 4).map((award, i) => (
              <div key={i} style={{
                ...cardStyle,
                padding: 14,
                textAlign: 'center',
                border: `1px solid ${award.color}25`,
              }}>
                <div style={{ color: award.color, marginBottom: 6 }}>{award.icon}</div>
                <div style={{ fontSize: 11, color: award.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {award.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                  {award.player?.name ?? '--'}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{award.subtitle}</div>
              </div>
            ))}
          </div>
          {/* Biggest Surprise - full width */}
          <div style={{
            ...cardStyle,
            padding: 14,
            textAlign: 'center',
            border: `1px solid ${awards[4].color}25`,
            marginBottom: 20,
          }}>
            <div style={{ color: awards[4].color, marginBottom: 6 }}>{awards[4].icon}</div>
            <div style={{ fontSize: 11, color: awards[4].color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {awards[4].label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
              {awards[4].player?.name ?? '--'}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{awards[4].subtitle}</div>
          </div>

          {/* Full ranking */}
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Final Standings</div>
            {ranking.map((player, i) => {
              const pIdx = players.indexOf(player);
              const pc = pColor(pIdx);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderBottom: i < ranking.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: i === 0 ? C.gold : C.dim + '40',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: i === 0 ? '#000' : C.muted,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: pc,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{player.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {player.lives > 0 ? `${player.lives} lives left` : `Out round ${player.roundEliminated}`}
                      {' / '}{player.totalLost} lost
                    </div>
                  </div>
                  <LifeDots lives={player.lives} max={MAX_LIVES} color={pc} />
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={restart}
              style={{
                ...solidBtn(C.sapphire),
                flex: 1,
                justifyContent: 'center',
                padding: '14px 24px',
              }}
            >
              <RotateCcw size={16} /> Play Again
            </button>
            <button
              onClick={onBack}
              style={{
                flex: 1,
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: RADIUS.full,
                padding: '14px 24px',
                color: C.text,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: C.glass,
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
