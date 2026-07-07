import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, X, Play, Heart, Skull, Trophy, Crown, Sparkles, Users, Shuffle, ChevronRight, RotateCcw, Hand } from 'lucide-react';
import { RADIUS, MOTION, solidBtn } from '../lib/design';

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
/*  Category definitions                                               */
/* ------------------------------------------------------------------ */
type Category = 'innocent' | 'adventurous' | 'embarrassing' | 'romantic';

const CATEGORY_META: Record<Category, { label: string; color: string; emoji: string; description: string }> = {
  innocent: { label: 'Innocent', color: C.emerald, emoji: '🌿', description: 'Lighthearted fun for everyone' },
  adventurous: { label: 'Adventurous', color: C.amber, emoji: '🔥', description: 'For the bold and daring' },
  embarrassing: { label: 'Embarrassing', color: C.coral, emoji: '😳', description: 'Cringe-worthy confessions' },
  romantic: { label: 'Romantic', color: C.rose, emoji: '💕', description: 'Love and heartbreak stories' },
};

/* ------------------------------------------------------------------ */
/*  Statements — 25+ per category                                      */
/* ------------------------------------------------------------------ */
const STATEMENTS: Record<Category, string[]> = {
  innocent: [
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
  ],
  adventurous: [
    'bungee jumped',
    'snuck out of the house',
    'skinny-dipped',
    'gone skydiving',
    'hitchhiked',
    'swum with sharks',
    'eaten something still alive',
    'gotten a tattoo on a whim',
    'gone on a road trip with no destination',
    'climbed a mountain',
    'tried surfing',
    'done karaoke sober in front of strangers',
    'traveled solo to a foreign country',
    'slept outside under the stars',
    'gone scuba diving',
    'ridden a motorcycle',
    'crashed a party',
    'done a polar bear plunge',
    'explored an abandoned building',
    'gone white water rafting',
    'eaten a ghost pepper',
    'pierced something unusual',
    'gone zip-lining',
    'snuck into a movie theater',
    'danced on a table',
  ],
  embarrassing: [
    'called a teacher "mom" or "dad"',
    'waved at someone who wasn\'t waving at me',
    'sent a text to the wrong person',
    'walked into a glass door',
    'tripped in public and pretended to jog',
    'laughed so hard I snorted',
    'had food stuck in my teeth all day',
    'accidentally liked an old photo while stalking someone',
    'replied "you too" when a waiter said "enjoy your meal"',
    'forgotten someone\'s name right after they told me',
    'been caught talking to myself',
    'accidentally sent a screenshot to the person in it',
    'waved back at someone waving to the person behind me',
    'walked into the wrong bathroom',
    'had my card declined on a date',
    'fallen asleep during a meeting or class and been called out',
    'said goodbye to someone then walked the same direction',
    'tried to push a pull door in front of people',
    'autocorrect sent something horribly wrong',
    'accidentally called my boss "babe" or "honey"',
    'clogged someone else\'s toilet',
    'been caught singing loudly in my car',
    'spilled a drink on someone at a party',
    'accidentally butt-dialed someone during gossip about them',
    'worn my shirt inside out all day without noticing',
  ],
  romantic: [
    'had a crush on a friend\'s partner',
    'written a love letter',
    'been on a blind date',
    'kissed someone on the first date',
    'had a secret admirer',
    'been stood up on a date',
    'dated someone my friends didn\'t approve of',
    'gone back to an ex',
    'had a holiday romance',
    'been in love with two people at the same time',
    'had a crush on a coworker',
    'said "I love you" first',
    'been heartbroken',
    'had a long-distance relationship',
    'been someone\'s rebound',
    'stalked an ex on social media',
    'pretended to like something to impress a crush',
    'written poetry about someone',
    'had a dream about a friend and couldn\'t look them in the eye',
    'faked interest in a hobby to be near someone',
    'had a crush on someone way older or younger',
    'been rejected in a dramatic way',
    'had a relationship that lasted less than a week',
    'created a fake dating profile',
    'fallen for someone over text before meeting them',
  ],
};

/* ------------------------------------------------------------------ */
/*  Game types                                                         */
/* ------------------------------------------------------------------ */
interface Player {
  name: string;
  lives: number;
  totalLost: number;
  roundEliminated: number | null;
  responses: boolean[]; // true = "I have"
}

type Phase = 'setup' | 'playing' | 'responding' | 'roundResult' | 'results';

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
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function NeverHaveIEver({ onBack }: { onBack: () => void }) {
  // Setup state
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [selectedCategories, setSelectedCategories] = useState<Set<Category>>(new Set(['innocent']));
  // Game state
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [round, setRound] = useState(0);
  const [statements, setStatements] = useState<string[]>([]);
  const [currentStatement, setCurrentStatement] = useState('');
  const [currentCategory, setCurrentCategory] = useState<Category>('innocent');
  const [responses, setResponses] = useState<Map<number, boolean>>(new Map());
  const [revealStatement, setRevealStatement] = useState(false);
  const [, setShowRoundResult] = useState(false);

  const MAX_ROUNDS = 20;
  const MAX_LIVES = 10;

  // Active players (still have lives)
  const activePlayers = useMemo(() => players.filter(p => p.lives > 0), [players]);
  const activeIndices = useMemo(() => {
    const indices: number[] = [];
    players.forEach((p, i) => { if (p.lives > 0) indices.push(i); });
    return indices;
  }, [players]);

  // Build statement pool from selected categories
  const buildStatementPool = useCallback(() => {
    const pool: { statement: string; category: Category }[] = [];
    selectedCategories.forEach(cat => {
      STATEMENTS[cat].forEach(s => pool.push({ statement: s, category: cat }));
    });
    const shuffled = shuffle(pool);
    return shuffled;
  }, [selectedCategories]);

  // Start game
  const startGame = useCallback(() => {
    const validNames = playerNames.filter(n => n.trim().length > 0);
    if (validNames.length < 2) return;
    if (selectedCategories.size === 0) return;

    const pool = buildStatementPool();
    const stmts = pool.map(p => p.statement);

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
  }, [playerNames, selectedCategories, buildStatementPool]);

  // Next round
  const nextRound = useCallback(() => {
    if (round >= statements.length || round >= MAX_ROUNDS || activePlayers.length <= 1) {
      setPhase('results');
      return;
    }

    setCurrentStatement(statements[round]);
    // Determine category of current statement
    for (const cat of Array.from(selectedCategories)) {
      if (STATEMENTS[cat].includes(statements[round])) {
        setCurrentCategory(cat);
        break;
      }
    }
    setResponses(new Map());
    setRevealStatement(false);
    setShowRoundResult(false);
    setPhase('responding');

    // Trigger reveal animation
    setTimeout(() => setRevealStatement(true), 100);
  }, [round, statements, activePlayers.length, selectedCategories]);

  // Start first round when entering playing phase
  useEffect(() => {
    if (phase === 'playing') {
      nextRound();
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle player response
  const handleResponse = useCallback((playerIndex: number, iHave: boolean) => {
    setResponses(prev => {
      const next = new Map(prev);
      next.set(playerIndex, iHave);
      return next;
    });
  }, []);

  // All active players have responded?
  const allResponded = useMemo(() => {
    return activeIndices.every(i => responses.has(i));
  }, [activeIndices, responses]);

  // Submit round responses
  const submitRound = useCallback(() => {
    if (!allResponded) return;

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
  }, [allResponded, responses, round]);

  // Advance to next round
  const advanceRound = useCallback(() => {
    const remaining = players.filter(p => {
      if (p.lives <= 0) return false;
      const resp = responses.get(players.indexOf(p));
      if (resp === true && p.lives === 1) return false;
      return true;
    });

    if (remaining.length <= 1 || round + 1 >= MAX_ROUNDS || round + 1 >= statements.length) {
      setPhase('results');
      return;
    }

    setRound(r => r + 1);
    setPhase('playing');
  }, [players, responses, round, statements.length]);

  // Check after players update
  useEffect(() => {
    if (phase === 'roundResult') {
      // Will be handled by advanceRound
    }
  }, [players, phase]);

  // Compute superlatives for results
  const superlatives = useMemo(() => {
    if (players.length === 0) return null;

    const sorted = [...players].sort((a, b) => {
      if (a.lives !== b.lives) return b.lives - a.lives;
      return (a.roundEliminated ?? Infinity) - (b.roundEliminated ?? Infinity);
    });

    const lastStanding = sorted[0];
    const mostWild = [...players].sort((a, b) => b.totalLost - a.totalLost)[0];
    const mostInnocent = [...players].sort((a, b) => a.totalLost - b.totalLost)[0];
    const firstOut = [...players].filter(p => p.roundEliminated !== null).sort((a, b) => (a.roundEliminated ?? 99) - (b.roundEliminated ?? 99))[0] || null;

    return { lastStanding, mostWild, mostInnocent, firstOut, ranking: sorted };
  }, [players]);

  // Toggle category
  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  // Restart
  const restart = useCallback(() => {
    setPhase('setup');
    setPlayers([]);
    setRound(0);
    setStatements([]);
    setResponses(new Map());
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

  /* ------------------------------------------------------------------ */
  /*  SETUP PHASE                                                        */
  /* ------------------------------------------------------------------ */
  if (phase === 'setup') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {/* Header */}
        <div style={headerStyle}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
            <ArrowLeft size={20} />
          </button>
          <Hand size={22} style={{ color: C.rose }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Never Have I Ever</div>
            <div style={{ fontSize: 12, color: C.muted }}>Party game for 2-10 players</div>
          </div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Players section */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: C.sapphire }} />
              Players ({playerNames.filter(n => n.trim()).length}/10)
            </div>

            {/* Player list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {playerNames.map((name, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: [C.rose, C.sapphire, C.emerald, C.amber, C.violet, C.teal, C.coral, C.gold, C.rose, C.sapphire][i % 10],
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

          {/* Category selection */}
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shuffle size={16} style={{ color: C.amber }} />
              Categories
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([cat, meta]) => {
                const selected = selectedCategories.has(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    style={{
                      background: selected ? meta.color + '18' : C.bg,
                      border: `1px solid ${selected ? meta.color + '60' : C.border}`,
                      borderRadius: RADIUS.md,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: `all ${MOTION.fast}`,
                      boxShadow: selected ? `0 0 12px ${meta.color}20` : 'none',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: selected ? meta.color : C.text, marginBottom: 4 }}>
                      {meta.emoji} {meta.label}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.3 }}>
                      {meta.description}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: C.dim, marginTop: 8, textAlign: 'center' }}>
              Select one or more categories. Tap to toggle.
            </div>
          </div>

          {/* Rules */}
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>How to Play</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              1. Everyone starts with 10 lives<br />
              2. A statement appears: "Never have I ever..."<br />
              3. Each player taps "I Have" if they've done it, or "I Haven't" if not<br />
              4. Players who HAVE done it lose a life<br />
              5. Reach 0 lives and you're out. Last one standing wins!
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startGame}
            disabled={playerNames.filter(n => n.trim()).length < 2 || selectedCategories.size === 0}
            style={{
              ...solidBtn(C.rose),
              width: '100%',
              justifyContent: 'center',
              padding: '14px 24px',
              fontSize: 16,
              opacity: playerNames.filter(n => n.trim()).length < 2 ? 0.4 : 1,
            }}
          >
            <Play size={18} /> Start Game
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  RESPONDING PHASE — show statement, collect taps                    */
  /* ------------------------------------------------------------------ */
  if (phase === 'responding') {
    const catMeta = CATEGORY_META[currentCategory];
    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        {/* Header */}
        <div style={headerStyle}>
          <Hand size={20} style={{ color: C.rose }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Round {round + 1}</span>
            <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>of {Math.min(MAX_ROUNDS, statements.length)}</span>
          </div>
          <div style={{
            background: catMeta.color + '20', color: catMeta.color,
            borderRadius: RADIUS.full, padding: '4px 12px', fontSize: 11, fontWeight: 700,
          }}>
            {catMeta.label}
          </div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Statement card */}
          <div style={{
            ...cardStyle,
            marginBottom: 24,
            textAlign: 'center',
            border: `1px solid ${catMeta.color}30`,
            transform: revealStatement ? 'translateY(0)' : 'translateY(30px)',
            opacity: revealStatement ? 1 : 0,
            transition: `transform ${MOTION.spring}, opacity ${MOTION.med}`,
          }}>
            <div style={{ fontSize: 13, color: catMeta.color, fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Never have I ever...
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4 }}>
              {currentStatement}
            </div>
          </div>

          {/* Player response grid */}
          <div style={{ display: 'grid', gridTemplateColumns: activePlayers.length <= 4 ? '1fr' : '1fr 1fr', gap: 10 }}>
            {players.map((player, idx) => {
              if (player.lives <= 0) return null;
              const hasResponded = responses.has(idx);
              const response = responses.get(idx);
              const pColor = [C.rose, C.sapphire, C.emerald, C.amber, C.violet, C.teal, C.coral, C.gold, C.rose, C.sapphire][idx % 10];

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
                      width: 24, height: 24, borderRadius: '50%', background: pColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                    }}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{player.name}</div>
                      <LifeDots lives={player.lives} max={MAX_LIVES} color={pColor} />
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
                          color: C.rose, fontSize: 12, fontWeight: 700, cursor: 'pointer',
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
                          color: C.emerald, fontSize: 12, fontWeight: 700, cursor: 'pointer',
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
                      fontSize: 12, fontWeight: 700,
                      transition: `all ${MOTION.fast}`,
                    }}>
                      {response ? '🙈 I Have' : '😇 I Haven\'t'}
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
          <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>Round {round + 1} Results</div>
        </div>

        <div style={{ padding: 20, maxWidth: 520, margin: '0 auto' }}>
          {/* Statement recap */}
          <div style={{ ...cardStyle, marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Never have I ever...</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{currentStatement}</div>
          </div>

          {/* Guilty list */}
          {guiltyPlayers.length > 0 ? (
            <div style={{ ...cardStyle, marginBottom: 16, border: `1px solid ${C.rose}30` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.rose, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Skull size={15} /> Lost a life ({guiltyPlayers.length})
              </div>
              {guiltyPlayers.map(i => {
                const p = players[i];
                const pColor = [C.rose, C.sapphire, C.emerald, C.amber, C.violet, C.teal, C.coral, C.gold, C.rose, C.sapphire][i % 10];
                const justEliminated = p.lives === 0;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: pColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff',
                    }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                      <LifeDots lives={p.lives} max={MAX_LIVES} color={pColor} />
                    </div>
                    {justEliminated && (
                      <div style={{
                        background: C.rose + '20', color: C.rose, borderRadius: RADIUS.full,
                        padding: '3px 10px', fontSize: 11, fontWeight: 700,
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
              <div style={{ fontSize: 15, fontWeight: 700 }}>Everyone is innocent this round!</div>
            </div>
          )}

          {/* Safe list */}
          {activeIndices.filter(i => !responses.get(i)).length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 20, border: `1px solid ${C.emerald}30` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.emerald, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Heart size={15} /> Safe
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {activeIndices.filter(i => !responses.get(i)).map(i => {
                  const pColor = [C.rose, C.sapphire, C.emerald, C.amber, C.violet, C.teal, C.coral, C.gold, C.rose, C.sapphire][i % 10];
                  return (
                    <div key={i} style={{
                      background: pColor + '18', border: `1px solid ${pColor}30`,
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
    const { lastStanding, mostWild, mostInnocent, firstOut, ranking } = superlatives;

    const awards: { label: string; icon: React.ReactNode; player: Player | null; color: string; subtitle: string }[] = [
      { label: 'Last Standing', icon: <Crown size={20} />, player: lastStanding, color: C.gold, subtitle: `${lastStanding.lives} lives remaining` },
      { label: 'Most Wild', icon: <Sparkles size={20} />, player: mostWild, color: C.rose, subtitle: `Lost ${mostWild.totalLost} lives` },
      { label: 'Most Innocent', icon: <Heart size={20} />, player: mostInnocent, color: C.emerald, subtitle: `Only lost ${mostInnocent.totalLost} lives` },
      { label: 'First Out', icon: <Skull size={20} />, player: firstOut, color: C.coral, subtitle: firstOut ? `Eliminated round ${firstOut.roundEliminated}` : 'Nobody eliminated' },
    ];

    return (
      <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <div style={headerStyle}>
          <Trophy size={20} style={{ color: C.gold }} />
          <div style={{ flex: 1, fontSize: 18, fontWeight: 700 }}>Game Over</div>
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
            <div style={{ fontSize: 13, color: C.gold, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Winner
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>
              {lastStanding.name}
            </div>
            <div style={{ fontSize: 14, color: C.muted }}>
              Survived with {lastStanding.lives} {lastStanding.lives === 1 ? 'life' : 'lives'} remaining
            </div>
          </div>

          {/* Superlative awards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {awards.map((award, i) => (
              <div key={i} style={{
                ...cardStyle,
                padding: 14,
                textAlign: 'center',
                border: `1px solid ${award.color}25`,
              }}>
                <div style={{ color: award.color, marginBottom: 6 }}>{award.icon}</div>
                <div style={{ fontSize: 11, color: award.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {award.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
                  {award.player?.name ?? '—'}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>{award.subtitle}</div>
              </div>
            ))}
          </div>

          {/* Full ranking */}
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Final Standings</div>
            {ranking.map((player, i) => {
              const pIdx = players.indexOf(player);
              const pColor = [C.rose, C.sapphire, C.emerald, C.amber, C.violet, C.teal, C.coral, C.gold, C.rose, C.sapphire][pIdx % 10];
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
                    width: 28, height: 28, borderRadius: '50%', background: pColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{player.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {player.lives > 0 ? `${player.lives} lives left` : `Out round ${player.roundEliminated}`}
                      {' · '}{player.totalLost} lost
                    </div>
                  </div>
                  <LifeDots lives={player.lives} max={MAX_LIVES} color={pColor} />
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
                fontWeight: 700,
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

  /* Fallback — should not reach */
  return null;
}
