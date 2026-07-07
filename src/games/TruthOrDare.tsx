import React, { useState, useCallback, useRef } from 'react';
import {
  ArrowLeft, Plus, Trash2, Play, Flame, Smile, Brain,
  Check, SkipForward, Trophy, ChevronRight, Sparkles,
  RotateCcw, Star, X,
} from 'lucide-react';
import { RADIUS, MOTION, solidBtn } from '../lib/design';

/* ------------------------------------------------------------------ */
/*  Theme                                                              */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#080c12',
  card: '#151d2b',
  border: '#1c2940',
  text: '#e8edf5',
  muted: '#8494a7',
  dim: '#4a5d75',
  truth: '#3a86ff',
  dare: '#f43f5e',
  mild: '#00c97b',
  spicy: '#f43f5e',
  funny: '#f59e0b',
  deep: '#7b2ff7',
  glass: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)',
} as const;

const AVATARS = ['🦁', '🐯', '🦊', '🐼', '🐨', '🐸', '🦋', '🐙'];

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */
type Category = 'mild' | 'spicy' | 'funny' | 'deep';

const TRUTHS: Record<Category, string[]> = {
  mild: [
    "What's your most embarrassing autocorrect fail?",
    "What's the last lie you told?",
    "What's the weirdest food combination you secretly enjoy?",
    "Have you ever pretended to laugh at a joke you didn't get?",
    "What's the longest you've gone without showering?",
    "What's your guilty pleasure TV show?",
    "Have you ever stalked someone on social media? Who?",
    "What's the most childish thing you still do?",
    "What's the most ridiculous thing you've Googled?",
    "If you could swap lives with someone here for a day, who?",
    "What's the worst gift you've ever received but pretended to like?",
    "What's a song you know all the lyrics to but won't admit?",
    "Have you ever eaten food off the floor?",
    "What's your most irrational fear?",
    "What was your worst haircut ever?",
    "Have you ever re-gifted a present?",
    "What's the most embarrassing thing in your search history?",
    "What's a trend you secretly love but publicly judge?",
  ],
  spicy: [
    "Text your partner 'I'm thinking about you' right now.",
    "What's the most attractive quality of the person on your left?",
    "Describe your ideal romantic evening in detail.",
    "What's the boldest romantic gesture you've ever made?",
    "What physical feature do you notice first in someone?",
    "What's a secret fantasy you've never shared?",
    "Have you ever had a crush on a friend's partner?",
    "What's the most romantic thing anyone has done for you?",
    "If you could kiss anyone in this room, who would it be?",
    "What's your biggest turn-off?",
    "Have you ever written a love letter? What did it say?",
    "What's the most embarrassing thing you've done to impress a crush?",
    "Describe your first kiss in three words.",
    "What's the cheesiest pickup line that would actually work on you?",
    "Have you ever been caught staring at someone?",
    "What's the most romantic movie scene that makes you melt?",
    "If you could relive one romantic moment, what would it be?",
    "What's a compliment that would instantly make you blush?",
  ],
  funny: [
    "Do your best impression of a celebrity. Everyone guesses who.",
    "What's the dumbest thing you've ever said in public?",
    "If your life had a theme song, what would it be?",
    "What would your autobiography title be?",
    "If animals could talk, which would be the rudest?",
    "What's the weirdest dream you've ever had?",
    "If you were a superhero, what useless power would you have?",
    "What's the most ridiculous thing you've done to avoid someone?",
    "If you could only eat one food forever, what would it be?",
    "What's the funniest thing you've witnessed but couldn't laugh at?",
    "If you were a ghost, who would you haunt first and why?",
    "What's the silliest thing you believed as a child?",
    "If you could add a word to the dictionary, what would it be?",
    "What's the most absurd excuse you've used to get out of plans?",
    "If your pet could talk, what would it say about you?",
    "What would you do with an extra arm?",
    "If you were arrested with no explanation, what would people assume?",
    "What's the worst piece of advice you've ever followed?",
  ],
  deep: [
    "What's something you've never told anyone in this room?",
    "What's your biggest fear about the future?",
    "What's a mistake you're grateful you made?",
    "If you could send a message to your 10-year-old self, what would it say?",
    "What's the hardest thing you've ever had to forgive?",
    "What do you wish people understood about you?",
    "What's the biggest risk you've ever taken?",
    "If you had one year to live, what would you change right now?",
    "What's something you pretend to be okay with but aren't?",
    "Who has had the biggest impact on who you are today?",
    "What's a belief you held strongly but changed your mind about?",
    "What's the loneliest you've ever felt?",
    "If you could relive one day of your life, which one?",
    "What are you most proud of that no one knows about?",
    "What do you think is your biggest weakness?",
    "What would you do differently if you knew nobody would judge you?",
    "What's a question you're afraid to know the answer to?",
    "What does success actually mean to you — not what others expect?",
  ],
};

const DARES: Record<Category, string[]> = {
  mild: [
    "Do 10 jumping jacks right now.",
    "Let the group pick your profile picture for the next 24 hours.",
    "Speak in a British accent for the next 2 rounds.",
    "Show the last photo in your camera roll.",
    "Do your best robot dance for 15 seconds.",
    "Let someone draw on your hand with a pen.",
    "Call a friend and sing 'Happy Birthday' to them.",
    "Keep a straight face while everyone tries to make you laugh for 30 seconds.",
    "Show the group your screen time report.",
    "Imitate the person on your right until your next turn.",
    "Post an embarrassing childhood photo on your story (or show the group).",
    "Talk without closing your mouth for the next minute.",
    "Do your best animal impression — group picks the animal.",
    "Let the group send one text from your phone.",
    "Eat a spoonful of a condiment chosen by the group.",
    "Wear your shirt inside out for the next 3 rounds.",
    "Do a dramatic reading of your last sent text message.",
    "Hold an ice cube in your hand until it melts.",
  ],
  spicy: [
    "Give your partner a 10-second back massage.",
    "Whisper something sweet in the ear of the person next to you.",
    "Do your best 'smoldering look' at the camera for everyone to judge.",
    "Serenade someone in the room with any song.",
    "Let someone go through your DMs for 30 seconds.",
    "Describe your ideal partner using only gestures — no words.",
    "Send a flirty text to someone (group picks who, can be anyone).",
    "Slow dance with the nearest person for 20 seconds — no music.",
    "Draw a heart on the cheek of the person across from you.",
    "Give a 30-second motivational speech about why the person on your left is attractive.",
    "Hold eye contact with someone for 30 seconds without laughing.",
    "Let someone restyle your hair however they want.",
    "Recreate a famous romantic movie scene with someone here.",
    "Write a 2-line love poem about the person to your right.",
    "Feed a snack to the person next to you, airplane style.",
    "Give your most dramatic 'will you marry me' proposal to a pillow.",
    "Do a catwalk across the room in slow motion.",
    "Record a voice note saying 'I miss you' and send it to your last contact.",
  ],
  funny: [
    "Do your best impression of a celebrity — everyone guesses who.",
    "Speak in an accent for the next 3 rounds.",
    "Make up a 30-second rap about the person on your left.",
    "Act out the last emoji you sent — everyone guesses.",
    "Do the worm (or attempt it) on the floor.",
    "Narrate everything you do in third person for 2 rounds.",
    "Let someone tickle you for 10 seconds.",
    "Do a dramatic soap opera scene by yourself — include the crying.",
    "Try to juggle any 3 items. You have 30 seconds.",
    "Pretend you're a news anchor reporting on this game.",
    "Sing everything you say for the next round.",
    "Do 20 seconds of your best TikTok dance.",
    "Try to lick your own elbow for 15 seconds.",
    "Do your best impression of a baby learning to walk.",
    "Make the ugliest face you can and hold it for 10 seconds.",
    "Invent a new handshake with the person across from you.",
    "Talk to your hand like it's a puppet for 30 seconds.",
    "Stand up and do the chicken dance right now.",
  ],
  deep: [
    "Call someone you haven't spoken to in months and tell them you appreciate them.",
    "Write down a fear on paper, read it aloud, then tear it up.",
    "Share a voice note to the group saying one thing you love about yourself.",
    "Look someone in the eye and tell them genuinely what you admire about them.",
    "Close your eyes and describe your happiest memory in vivid detail.",
    "Share the lock screen of your phone and explain why you chose it.",
    "Write a letter of forgiveness to someone (you don't have to send it).",
    "Tell the group about a time you failed and what you learned.",
    "Stand up and give a 30-second speech about what matters most in life to you.",
    "Make a promise to yourself out loud, in front of everyone.",
    "Share a photo that has deep meaning to you and explain why.",
    "Tell someone here something you've been holding back.",
    "Describe what you want your life to look like in 10 years.",
    "Thank someone in the room for something specific they've done for you.",
    "Share the most important lesson life has taught you so far.",
    "Put on a song that represents your current emotional state. Explain.",
    "Name three things you're genuinely grateful for right now.",
    "Tell the group about a moment that changed who you are.",
  ],
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Player {
  name: string;
  avatar: string;
  completed: number;
  skipped: number;
  history: { type: 'truth' | 'dare'; prompt: string; done: boolean }[];
}

type Phase = 'setup' | 'turn-start' | 'choose' | 'reveal' | 'summary';

const CATEGORY_META: Record<Category, { label: string; swLabel: string; color: string; icon: React.ReactNode }> = {
  mild:  { label: 'Mild',  swLabel: 'Pole pole', color: C.mild,  icon: <Smile size={18} /> },
  spicy: { label: 'Spicy', swLabel: 'Moto',      color: C.spicy, icon: <Flame size={18} /> },
  funny: { label: 'Funny', swLabel: 'Kucheka',    color: C.funny, icon: <Star size={18} /> },
  deep:  { label: 'Deep',  swLabel: 'Kina',       color: C.deep,  icon: <Brain size={18} /> },
};

const ROUNDS_PER_PLAYER = 3;

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function TruthOrDare({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([
    { name: '', avatar: AVATARS[0], completed: 0, skipped: 0, history: [] },
    { name: '', avatar: AVATARS[1], completed: 0, skipped: 0, history: [] },
  ]);
  const [category, setCategory] = useState<Category>('mild');
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [choice, setChoice] = useState<'truth' | 'dare' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [flipped, setFlipped] = useState(false);

  // Used pool tracking to avoid repeats
  const usedTruths = useRef<Set<string>>(new Set());
  const usedDares = useRef<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);

  const totalTurns = players.length * ROUNDS_PER_PLAYER;
  const currentTurn = currentRound * players.length + currentPlayerIdx;

  /* --- Setup helpers --- */
  const addPlayer = () => {
    if (players.length >= 8) return;
    setPlayers(p => [...p, { name: '', avatar: AVATARS[p.length % AVATARS.length], completed: 0, skipped: 0, history: [] }]);
  };

  const removePlayer = (i: number) => {
    if (players.length <= 2) return;
    setPlayers(p => p.filter((_, idx) => idx !== i));
  };

  const updateName = (i: number, name: string) => {
    setPlayers(p => p.map((pl, idx) => idx === i ? { ...pl, name } : pl));
  };

  const canStart = players.every(p => p.name.trim().length > 0);

  const startGame = () => {
    if (!canStart) return;
    usedTruths.current = new Set();
    usedDares.current = new Set();
    setPlayers(p => p.map(pl => ({ ...pl, completed: 0, skipped: 0, history: [] })));
    setCurrentPlayerIdx(0);
    setCurrentRound(0);
    setPhase('turn-start');
  };

  const pickPrompt = useCallback((type: 'truth' | 'dare') => {
    const pool = type === 'truth' ? TRUTHS[category] : DARES[category];
    const used = type === 'truth' ? usedTruths.current : usedDares.current;
    let available = pool.filter(p => !used.has(p));
    if (available.length === 0) {
      used.clear();
      available = [...pool];
    }
    const picked = available[Math.floor(Math.random() * available.length)];
    used.add(picked);
    return picked;
  }, [category]);

  const handleChoice = (type: 'truth' | 'dare') => {
    setChoice(type);
    setPrompt(pickPrompt(type));
    setFlipped(false);
    setPhase('reveal');
    setTimeout(() => setFlipped(true), 50);
  };

  const handleResult = (done: boolean) => {
    setPlayers(p => p.map((pl, idx) => {
      if (idx !== currentPlayerIdx) return pl;
      return {
        ...pl,
        completed: pl.completed + (done ? 1 : 0),
        skipped: pl.skipped + (done ? 0 : 1),
        history: [...pl.history, { type: choice!, prompt, done }],
      };
    }));

    // Next turn
    let nextPlayer = currentPlayerIdx + 1;
    let nextRound = currentRound;
    if (nextPlayer >= players.length) {
      nextPlayer = 0;
      nextRound += 1;
    }
    if (nextRound >= ROUNDS_PER_PLAYER) {
      setPhase('summary');
    } else {
      setCurrentPlayerIdx(nextPlayer);
      setCurrentRound(nextRound);
      setChoice(null);
      setPhase('turn-start');
    }
  };

  const resetGame = () => {
    setPhase('setup');
    setPlayers(p => p.map(pl => ({ ...pl, completed: 0, skipped: 0, history: [] })));
    setCurrentPlayerIdx(0);
    setCurrentRound(0);
    setChoice(null);
  };

  const currentPlayer = players[currentPlayerIdx];
  const catMeta = CATEGORY_META[category];

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      padding: '0 0 40px',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
          display: 'flex', alignItems: 'center', padding: 4,
          transition: `color ${MOTION.snap}`,
        }}
          onMouseEnter={e => (e.currentTarget.style.color = C.text)}
          onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
            Ukweli au Changamoto
          </h1>
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>Truth or Dare</span>
        </div>
        {phase !== 'setup' && phase !== 'summary' && (
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.muted,
            background: C.card, padding: '4px 12px', borderRadius: RADIUS.full,
            border: `1px solid ${C.border}`,
          }}>
            Raundi {currentRound + 1}/{ROUNDS_PER_PLAYER}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px' }}>

        {/* ============================================================ */}
        {/*  SETUP PHASE                                                  */}
        {/* ============================================================ */}
        {phase === 'setup' && (
          <div style={{ paddingTop: 24 }}>
            {/* Category picker */}
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
              Kiwango — Intensity
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 28 }}>
              {(Object.keys(CATEGORY_META) as Category[]).map(cat => {
                const m = CATEGORY_META[cat];
                const sel = cat === category;
                return (
                  <button key={cat} onClick={() => setCategory(cat)} style={{
                    background: sel ? m.color + '18' : C.card,
                    border: `1px solid ${sel ? m.color + '60' : C.border}`,
                    borderRadius: RADIUS.md,
                    padding: '12px 4px',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    color: sel ? m.color : C.muted,
                    transition: `all ${MOTION.fast}`,
                    boxShadow: sel ? `0 0 20px ${m.color}20` : C.glass,
                  }}>
                    {m.icon}
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</span>
                    <span style={{ fontSize: 9, color: C.dim }}>{m.swLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Players */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Wachezaji — Players ({players.length}/8)
              </label>
              {players.length < 8 && (
                <button onClick={addPlayer} style={{
                  ...solidBtn(C.truth),
                  padding: '4px 12px', fontSize: 11,
                }}>
                  <Plus size={14} /> Ongeza
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {players.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: C.card, borderRadius: RADIUS.md,
                  border: `1px solid ${C.border}`,
                  padding: '8px 12px',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 24, width: 36, textAlign: 'center' }}>{p.avatar}</span>
                  <input
                    ref={i === players.length - 1 ? inputRef : undefined}
                    value={p.name}
                    onChange={e => updateName(i, e.target.value)}
                    placeholder={`Mchezaji ${i + 1}`}
                    maxLength={16}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      color: C.text, fontSize: 15, fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  />
                  {players.length > 2 && (
                    <button onClick={() => removePlayer(i)} style={{
                      background: 'none', border: 'none', color: C.dim, cursor: 'pointer',
                      display: 'flex', padding: 4,
                      transition: `color ${MOTION.snap}`,
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.dare)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.dim)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Start */}
            <button onClick={startGame} disabled={!canStart} style={{
              ...solidBtn(catMeta.color),
              width: '100%', justifyContent: 'center',
              fontSize: 16, padding: '14px 24px',
              opacity: canStart ? 1 : 0.4,
            }}>
              <Play size={18} /> Anza Mchezo — Start Game
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  TURN START                                                    */}
        {/* ============================================================ */}
        {phase === 'turn-start' && (
          <div style={{
            paddingTop: 60,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'fadeSlideIn 400ms ease',
          }}>
            {/* Progress bar */}
            <div style={{
              width: '100%', height: 4, background: C.card,
              borderRadius: RADIUS.full, marginBottom: 40, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${(currentTurn / totalTurns) * 100}%`,
                background: catMeta.color,
                borderRadius: RADIUS.full,
                transition: `width ${MOTION.med}`,
              }} />
            </div>

            <span style={{ fontSize: 56, marginBottom: 12 }}>{currentPlayer.avatar}</span>
            <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              {currentPlayer.name}
            </h2>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 8 }}>
              Zamu yako — Your turn
            </span>
            <div style={{
              display: 'flex', gap: 12, alignItems: 'center',
              fontSize: 11, color: C.dim, marginBottom: 40,
            }}>
              <span>Raundi {currentRound + 1}/{ROUNDS_PER_PLAYER}</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.dim }} />
              <span style={{ color: catMeta.color }}>{catMeta.label}</span>
            </div>

            <button onClick={() => setPhase('choose')} style={{
              ...solidBtn(catMeta.color),
              fontSize: 16, padding: '14px 36px',
            }}>
              Chagua — Choose <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  CHOOSE TRUTH OR DARE                                         */}
        {/* ============================================================ */}
        {phase === 'choose' && (
          <div style={{
            paddingTop: 40,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            animation: 'fadeSlideIn 300ms ease',
          }}>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 32 }}>
              {currentPlayer.avatar} {currentPlayer.name} — chagua moja
            </span>

            <div style={{ display: 'flex', gap: 16, width: '100%' }}>
              {/* Truth */}
              <button onClick={() => handleChoice('truth')} style={{
                flex: 1,
                background: C.card,
                border: `2px solid ${C.truth}40`,
                borderRadius: RADIUS.lg,
                padding: '36px 16px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                boxShadow: C.glass,
                transition: `all ${MOTION.fast}`,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.truth;
                  e.currentTarget.style.boxShadow = `0 0 30px ${C.truth}25, ${C.glass}`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.truth + '40';
                  e.currentTarget.style.boxShadow = C.glass;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: C.truth + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.truth,
                }}>
                  <Sparkles size={28} />
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.truth }}>Ukweli</span>
                <span style={{ fontSize: 12, color: C.muted }}>Truth</span>
              </button>

              {/* Dare */}
              <button onClick={() => handleChoice('dare')} style={{
                flex: 1,
                background: C.card,
                border: `2px solid ${C.dare}40`,
                borderRadius: RADIUS.lg,
                padding: '36px 16px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                boxShadow: C.glass,
                transition: `all ${MOTION.fast}`,
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.dare;
                  e.currentTarget.style.boxShadow = `0 0 30px ${C.dare}25, ${C.glass}`;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.dare + '40';
                  e.currentTarget.style.boxShadow = C.glass;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: C.dare + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.dare,
                }}>
                  <Flame size={28} />
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.dare }}>Changamoto</span>
                <span style={{ fontSize: 12, color: C.muted }}>Dare</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  REVEAL                                                        */}
        {/* ============================================================ */}
        {phase === 'reveal' && (
          <div style={{
            paddingTop: 40,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 24 }}>
              {currentPlayer.avatar} {currentPlayer.name}
            </span>

            {/* Card flip container */}
            <div style={{
              perspective: '1000px',
              width: '100%',
              marginBottom: 32,
            }}>
              <div style={{
                width: '100%',
                minHeight: 220,
                position: 'relative',
                transformStyle: 'preserve-3d',
                transition: `transform 600ms cubic-bezier(.34,1.56,.64,1)`,
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
              }}>
                {/* Card back */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  minHeight: 220,
                  backfaceVisibility: 'hidden',
                  background: choice === 'truth' ? C.truth + '12' : C.dare + '12',
                  border: `2px solid ${choice === 'truth' ? C.truth : C.dare}40`,
                  borderRadius: RADIUS.xl,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: C.glass,
                  padding: 24,
                }}>
                  <span style={{ fontSize: 48, marginBottom: 8 }}>?</span>
                  <span style={{ fontSize: 14, color: C.muted }}>Inafunuliwa...</span>
                </div>

                {/* Card front (prompt) */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  minHeight: 220,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: C.card,
                  border: `2px solid ${choice === 'truth' ? C.truth : C.dare}50`,
                  borderRadius: RADIUS.xl,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 8px 40px ${(choice === 'truth' ? C.truth : C.dare)}20, ${C.glass}`,
                  padding: 28,
                  boxSizing: 'border-box',
                }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 14px', borderRadius: RADIUS.full,
                    background: (choice === 'truth' ? C.truth : C.dare) + '18',
                    color: choice === 'truth' ? C.truth : C.dare,
                    fontSize: 11, fontWeight: 700,
                    marginBottom: 16,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {choice === 'truth' ? <Sparkles size={12} /> : <Flame size={12} />}
                    {choice === 'truth' ? 'Ukweli — Truth' : 'Changamoto — Dare'}
                  </div>
                  <p style={{
                    margin: 0, fontSize: 18, fontWeight: 600,
                    lineHeight: 1.5, textAlign: 'center',
                    color: C.text,
                  }}>
                    {prompt}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {flipped && (
              <div style={{
                display: 'flex', gap: 12, width: '100%',
                animation: 'fadeSlideIn 300ms ease 200ms both',
              }}>
                <button onClick={() => handleResult(false)} style={{
                  flex: 1,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: RADIUS.full,
                  padding: '12px 20px',
                  color: C.muted,
                  fontSize: 14, fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: `all ${MOTION.fast}`,
                  boxShadow: C.glass,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.dim; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                >
                  <SkipForward size={16} /> Ruka — Skip
                </button>
                <button onClick={() => handleResult(true)} style={{
                  ...solidBtn(choice === 'truth' ? C.truth : C.dare),
                  flex: 1,
                  justifyContent: 'center',
                  padding: '12px 20px',
                  fontSize: 14,
                }}>
                  <Check size={16} /> Imefanyika — Done
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/*  SUMMARY                                                       */}
        {/* ============================================================ */}
        {phase === 'summary' && (() => {
          const sorted = [...players].sort((a, b) => b.completed - a.completed);
          const brave = sorted[0];
          const shy = [...players].sort((a, b) => b.skipped - a.skipped)[0];

          return (
            <div style={{ paddingTop: 32, animation: 'fadeSlideIn 400ms ease' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Trophy size={40} style={{ color: C.funny, marginBottom: 8 }} />
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Mchezo Umekwisha!</h2>
                <span style={{ fontSize: 13, color: C.muted }}>Game Over</span>
              </div>

              {/* Awards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
                <div style={{
                  background: C.card, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.mild}30`,
                  padding: 16, textAlign: 'center',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 28 }}>{brave.avatar}</span>
                  <div style={{ fontSize: 11, color: C.mild, fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Jasiri Zaidi — Most Brave
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{brave.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{brave.completed} completed</div>
                </div>
                <div style={{
                  background: C.card, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.deep}30`,
                  padding: 16, textAlign: 'center',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 28 }}>{shy.avatar}</span>
                  <div style={{ fontSize: 11, color: C.deep, fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mwenye Haya — Most Shy
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{shy.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{shy.skipped} skipped</div>
                </div>
              </div>

              {/* Scoreboard */}
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'block' }}>
                Matokeo — Scoreboard
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                {sorted.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: C.card, borderRadius: RADIUS.md,
                    border: `1px solid ${C.border}`,
                    padding: '10px 14px',
                    boxShadow: C.glass,
                  }}>
                    <span style={{
                      fontSize: 14, fontWeight: 800,
                      color: i === 0 ? C.funny : C.dim,
                      width: 20, textAlign: 'center',
                    }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 22 }}>{p.avatar}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        {p.completed} done · {p.skipped} skipped
                      </div>
                    </div>
                    <div style={{
                      background: catMeta.color + '18',
                      color: catMeta.color,
                      borderRadius: RADIUS.full,
                      padding: '4px 12px',
                      fontSize: 13, fontWeight: 800,
                    }}>
                      {p.completed}
                    </div>
                  </div>
                ))}
              </div>

              {/* History per player */}
              <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'block' }}>
                Historia — History
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {players.map((p, pi) => (
                  <div key={pi} style={{
                    background: C.card, borderRadius: RADIUS.lg,
                    border: `1px solid ${C.border}`,
                    padding: 14,
                    boxShadow: C.glass,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 18 }}>{p.avatar}</span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</span>
                    </div>
                    {p.history.map((h, hi) => (
                      <div key={hi} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '6px 0',
                        borderTop: hi > 0 ? `1px solid ${C.border}` : 'none',
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: RADIUS.full,
                          background: (h.type === 'truth' ? C.truth : C.dare) + '18',
                          color: h.type === 'truth' ? C.truth : C.dare,
                          flexShrink: 0,
                          marginTop: 2,
                          textTransform: 'uppercase',
                        }}>
                          {h.type === 'truth' ? 'T' : 'D'}
                        </span>
                        <span style={{
                          fontSize: 12, color: h.done ? C.text : C.dim,
                          textDecoration: h.done ? 'none' : 'line-through',
                          lineHeight: 1.4, flex: 1,
                        }}>
                          {h.prompt}
                        </span>
                        {h.done ? (
                          <Check size={14} style={{ color: C.mild, flexShrink: 0 }} />
                        ) : (
                          <X size={14} style={{ color: C.dim, flexShrink: 0 }} />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Play again */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={onBack} style={{
                  flex: 1, background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: RADIUS.full, padding: '14px 20px',
                  color: C.muted, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: C.glass,
                  transition: `all ${MOTION.fast}`,
                }}>
                  <ArrowLeft size={16} /> Nyumbani — Home
                </button>
                <button onClick={resetGame} style={{
                  ...solidBtn(catMeta.color),
                  flex: 1, justifyContent: 'center',
                  padding: '14px 20px', fontSize: 14,
                }}>
                  <RotateCcw size={16} /> Cheza Tena — Replay
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Global animation keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
