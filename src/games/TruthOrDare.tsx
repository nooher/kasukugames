import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, Play, Flame,
  Check, SkipForward, Trophy, ChevronRight, Sparkles,
  RotateCcw, X, Users, Heart, Settings, ThumbsUp,
} from 'lucide-react';
import { RADIUS, MOTION, solidBtn } from '../lib/design';
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver, sfxReveal, sfxLevelUp } from '../lib/sfx';

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
  rafiki: '#00c97b',
  spicy: '#f43f5e',
  custom: '#7b2ff7',
  glass: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)',
} as const;

const AVATARS = ['🦁', '🐯', '🦊', '🐼', '🐨', '🐸', '🦋', '🐙'];

/* ------------------------------------------------------------------ */
/*  Content: 50+ truths and 50+ dares per mode                         */
/* ------------------------------------------------------------------ */
type GameMode = 'rafiki' | 'spicy' | 'custom';

const TRUTHS_RAFIKI: string[] = [
  "What's your most embarrassing autocorrect fail?",
  "What's the last lie you told?",
  "What's the weirdest food combination you secretly enjoy?",
  "Have you ever pretended to laugh at a joke you didn't get?",
  "What's the longest you've gone without showering?",
  "What's your guilty pleasure TV show?",
  "Have you ever stalked someone on social media? Who?",
  "What's the most childish thing you still do?",
  "What's the most ridiculous thing you've ever Googled?",
  "If you could swap lives with someone here for a day, who?",
  "What's the worst gift you've ever received but pretended to like?",
  "What's a song you know all the lyrics to but won't admit?",
  "Have you ever eaten food off the floor?",
  "What's your most irrational fear?",
  "What was your worst haircut ever?",
  "Have you ever re-gifted a present?",
  "What's the most embarrassing thing in your search history?",
  "What's a trend you secretly love but publicly judge?",
  "What is the dumbest thing you've ever said in public?",
  "If your life had a theme song, what would it be?",
  "What would your autobiography title be?",
  "What's the weirdest dream you've ever had?",
  "If you were a superhero, what useless power would you have?",
  "What's the most ridiculous thing you've done to avoid someone?",
  "What's the funniest thing you've witnessed but couldn't laugh at?",
  "What's the silliest thing you believed as a child?",
  "What's the most absurd excuse you've used to get out of plans?",
  "What's the worst piece of advice you've ever followed?",
  "What's the most embarrassing thing your parents caught you doing?",
  "What's the longest you've binge-watched something in one sitting?",
  "What's a skill you pretend to have but really don't?",
  "What's the most cringe thing on your social media from years ago?",
  "What's the worst thing you've done as a houseguest?",
  "If you could only eat one food forever, what would it be?",
  "What's the pettiest reason you stopped talking to someone?",
  "What habit do you have that you know is annoying?",
  "What's the most money you've wasted on something stupid?",
  "What's the most embarrassing photo on your phone right now?",
  "What's a movie everyone loves that you secretly think is terrible?",
  "Have you ever blamed someone else for something you did?",
  "What's the weirdest thing you do when you're alone?",
  "What nickname do you secretly hate?",
  "What's the most desperate thing you've done when hungry?",
  "If you had to delete every app on your phone except three, which three?",
  "What's the most over-the-top thing you've done for attention?",
  "What's something you did as a kid that still makes you cringe?",
  "Have you ever pretended to be sick to avoid something? What?",
  "What's the worst fashion choice you've ever made?",
  "Have you ever accidentally sent a message to the wrong person? What happened?",
  "What's your most controversial food opinion?",
  "What's the longest grudge you've ever held?",
  "What rule do you break on a regular basis?",
];

const TRUTHS_SPICY: string[] = [
  "What's your biggest sexual fantasy you've never told anyone?",
  "Have you ever faked an orgasm? Tell us the story.",
  "What's the most scandalous thing you've done that nobody here knows about?",
  "What's the wildest place you've ever hooked up?",
  "Who in this room would you most want to see naked?",
  "What's the dirtiest text you've ever sent? Read it out loud.",
  "Have you ever had a crush on a friend's partner?",
  "What's the kinkiest thing you've ever done?",
  "What's your body count? Be honest.",
  "What's the most embarrassing thing that happened during sex?",
  "Have you ever been caught in the act? Tell the story.",
  "What's the biggest age gap you've had with someone you were with?",
  "What turns you on that you'd be embarrassed to admit?",
  "Have you ever sent or received nudes? From who?",
  "What's the worst date you've ever been on?",
  "If you could hook up with any celebrity, who and why?",
  "What's the most desperate thing you've done to get someone's attention?",
  "Have you ever cheated or been cheated on?",
  "What's one thing you want to try in bed but haven't yet?",
  "Have you ever had a one-night stand you regretted?",
  "What's the most revealing outfit you've ever worn?",
  "Have you ever lied about your relationship status to hook up with someone?",
  "What's the longest you've gone without sex while in a relationship?",
  "Describe the best kiss you've ever had in detail.",
  "Have you ever made out with someone within an hour of meeting them?",
  "What's the most money you've spent to impress a date?",
  "Have you ever stalked an ex online? How deep did you go?",
  "What's something you've done behind a partner's back?",
  "If you had to rate your kissing ability 1-10, what would you give yourself?",
  "What's the naughtiest thing you've done at a party?",
  "Have you ever used a dating app while in a relationship?",
  "What's the biggest lie you told to get laid?",
  "What's your go-to move to seduce someone?",
  "What's the most awkward morning-after experience you've had?",
  "Have you ever had a friends-with-benefits situation? How did it end?",
  "What's the most inappropriate crush you've ever had?",
  "Show the last DM you sent that you're embarrassed about.",
  "What's the wildest party story you have?",
  "Have you ever skinny-dipped? Where and with who?",
  "What's a red flag you consistently ignore in partners?",
  "What's the most risque photo on your phone right now?",
  "What's something you only do when you're drunk?",
  "Have you ever pretended to like something in bed that you actually hated?",
  "What's the most embarrassing thing you've called out during sex?",
  "What's your biggest dealbreaker that most people would find shallow?",
  "Have you ever had a dream about someone in this room? What happened?",
  "What's the worst excuse you've given for not going on a second date?",
  "Tell us about a time you were rejected in the most embarrassing way.",
  "What's the most scandalous rumor about you that's actually true?",
  "Have you ever ghosted someone? Why?",
  "What's something your ex did that you actually miss?",
  "What's the most embarrassing thing in your browser history right now?",
];

const DARES_RAFIKI: string[] = [
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
  "Talk without closing your mouth for the next minute.",
  "Do your best animal impression — group picks the animal.",
  "Let the group send one text from your phone.",
  "Eat a spoonful of a condiment chosen by the group.",
  "Wear your shirt inside out for the next 3 rounds.",
  "Do a dramatic reading of your last sent text message.",
  "Hold an ice cube in your hand until it melts.",
  "Do your best impression of a celebrity — everyone guesses who.",
  "Speak in an accent for the next 3 rounds.",
  "Make up a 30-second rap about the person on your left.",
  "Act out the last emoji you sent — everyone guesses.",
  "Narrate everything you do in third person for 2 rounds.",
  "Do a dramatic soap opera scene by yourself — include the crying.",
  "Try to juggle any 3 items. You have 30 seconds.",
  "Pretend you're a news anchor reporting on this game.",
  "Sing everything you say for the next round.",
  "Do 20 seconds of your best dance.",
  "Try to lick your own elbow for 15 seconds.",
  "Make the ugliest face you can and hold it for 10 seconds.",
  "Invent a new handshake with the person across from you.",
  "Talk to your hand like it's a puppet for 30 seconds.",
  "Stand up and do the chicken dance right now.",
  "Let someone tickle you for 10 seconds.",
  "Post an embarrassing childhood photo on your story (or show the group).",
  "Do the worm (or attempt it) on the floor.",
  "Do your best impression of a baby learning to walk.",
  "Stack as many things on your head as you can in 20 seconds.",
  "Speak only in questions for the next 2 rounds.",
  "Do a fashion walk across the room using only items in this room as props.",
  "Let someone style your hair however they want — keep it for 3 rounds.",
  "Eat something without using your hands.",
  "Balance a book on your head and walk across the room.",
  "Do your best beatbox for 20 seconds.",
  "Talk in slow motion for the next 2 rounds.",
  "Let the person to your right draw on your face with a washable marker.",
  "Do 15 seconds of your best moonwalk.",
  "Pretend to be a waiter and take everyone's fake food orders.",
  "Do push-ups until it's your turn again (or as many as you can).",
  "Call a random contact and tell them a joke — put it on speaker.",
  "Speak in song lyrics only for the next 2 rounds.",
  "Act like you just won an Oscar — give your acceptance speech.",
  "Let the group assign you a new name for the rest of the game.",
];

const DARES_SPICY: string[] = [
  "Give a lap dance to the person on your left.",
  "Kiss the person across from you for 10 seconds.",
  "Remove an article of clothing of the group's choice.",
  "Let someone go through your DMs for 60 seconds — no deleting.",
  "Send a flirty text to your most recent contact — read it aloud.",
  "Whisper the dirtiest thing you can think of in the ear of the person to your right.",
  "Give someone in the room a hickey.",
  "Sit on someone's lap for the next 2 rounds.",
  "Do your sexiest dance for 30 seconds.",
  "Let someone body-paint a word on your stomach.",
  "Show the group your most embarrassing photo and explain the story.",
  "Lick your lips seductively while making eye contact with everyone in the room.",
  "Demonstrate your best fake moan — make it convincing.",
  "Let someone blindfold you and guess who's touching your face.",
  "Post 'I'm single and ready to mingle' on your story (or pretend to call an ex).",
  "Slow dance with someone for 30 seconds — no music.",
  "Let the group choose someone for you to spoon with for 2 minutes.",
  "Show the last person you searched for on Instagram.",
  "Serenade someone in the room with the most romantic song you know.",
  "Hold eye contact with the person across from you for 60 seconds — no laughing.",
  "Take a body shot off someone (or simulate it with water).",
  "Tell the group about your most embarrassing hookup in detail.",
  "Let someone write a Tinder bio for you — and you have to use it for 24 hours.",
  "Act out your go-to flirting technique on someone here.",
  "Send 'I had a dream about you last night' to the fifth contact in your phone.",
  "Let someone pick your outfit for the rest of the night from what's available.",
  "Give someone a 30-second shoulder massage.",
  "Play a romantic scene from a movie with someone — group picks the scene.",
  "Describe in detail the last dream you had about someone.",
  "Take a suggestive selfie and show the group (you don't have to post it).",
  "Let the group go through your search history for 30 seconds.",
  "Do your best strip-tease impression (keep it PG-13 or don't — your call).",
  "Text your ex 'thinking about you' — or show us you would if you could.",
  "Bite your lip and wink at three different people.",
  "Feed the person next to you something in the most romantic way possible.",
  "Reenact the last time you flirted with someone — use props.",
  "Let someone put their hands anywhere on you for 10 seconds (with consent).",
  "Wear someone else's shirt for the next 3 rounds.",
  "Give a dramatic marriage proposal to the person on your right — on one knee.",
  "Play 7 minutes in heaven with someone (or do a 2-minute closet dare).",
  "Write a love letter to the person across from you and read it aloud.",
  "Tell us the most NSFW thing on your phone right now — show or describe.",
  "Let someone pick a contact and you have to send them a heart emoji with no context.",
  "Recreate a famous romantic movie kiss with someone willing.",
  "Draw a tattoo on someone's body with a marker — they can't see it first.",
  "Do your best impression of what you look like during an orgasm.",
  "Pick someone and tell them the first thing you noticed about them — be honest.",
  "Suck on an ice cube seductively for 15 seconds.",
  "Let someone put lipstick on you blindfolded.",
  "Describe your most embarrassing moment in a relationship.",
  "Call your most recent ex and tell them one thing you miss about them — on speaker.",
  "Give the person to your left a compliment that would make them blush.",
];

/* ------------------------------------------------------------------ */
/*  Custom questions localStorage                                      */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = 'kasuku-tod-custom';

interface CustomQuestions {
  truths: string[];
  dares: string[];
}

function loadCustom(): CustomQuestions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        truths: Array.isArray(parsed.truths) ? parsed.truths : [],
        dares: Array.isArray(parsed.dares) ? parsed.dares : [],
      };
    }
  } catch { /* ignore */ }
  return { truths: [], dares: [] };
}

function saveCustom(q: CustomQuestions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Player {
  name: string;
  avatar: string;
  completed: number;
  skipped: number;
  truthCount: number;
  dareCount: number;
  history: { type: 'truth' | 'dare'; prompt: string; done: boolean }[];
}

type Phase = 'setup' | 'spinner' | 'choose' | 'reveal' | 'vote-skip' | 'summary';

const MODE_META: Record<'rafiki' | 'spicy' | 'custom', { label: string; swLabel: string; color: string; icon: React.ReactNode; desc: string }> = {
  rafiki: { label: 'Rafiki', swLabel: 'Marafiki', color: C.rafiki, icon: <Users size={18} />, desc: 'Clean fun for friends' },
  spicy:  { label: 'Spicy',  swLabel: 'Moto',     color: C.spicy,  icon: <Heart size={18} />,  desc: 'Adults only. No limits.' },
  custom: { label: 'Custom', swLabel: 'Maalum',    color: C.custom, icon: <Settings size={18} />, desc: 'Your own questions' },
};

const ROUNDS_PER_PLAYER = 3;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function TruthOrDare({ onBack, onGameEnd }: { onBack: () => void; onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void }) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([
    { name: '', avatar: AVATARS[0], completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] },
    { name: '', avatar: AVATARS[1], completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] },
  ]);
  const [mode, setMode] = useState<GameMode>('rafiki');
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [choice, setChoice] = useState<'truth' | 'dare' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [flipped, setFlipped] = useState(false);

  // Custom questions editor
  const [customQs, setCustomQs] = useState<CustomQuestions>(loadCustom);
  const [customTruthInput, setCustomTruthInput] = useState('');
  const [customDareInput, setCustomDareInput] = useState('');

  // Spinner state
  const [spinnerIdx, setSpinnerIdx] = useState(0);
  const [spinnerDone, setSpinnerDone] = useState(false);
  const spinnerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Vote to skip
  const [skipVotes, setSkipVotes] = useState<Set<number>>(new Set());

  // Used pool tracking
  const usedTruths = useRef<Set<string>>(new Set());
  const usedDares = useRef<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);

  const totalTurns = players.length * ROUNDS_PER_PLAYER;
  const currentTurn = currentRound * players.length + currentPlayerIdx;

  /* --- Get the active content pool --- */
  const getTruthPool = useCallback((): string[] => {
    if (mode === 'rafiki') return TRUTHS_RAFIKI;
    if (mode === 'spicy') return TRUTHS_SPICY;
    return customQs.truths;
  }, [mode, customQs.truths]);

  const getDarePool = useCallback((): string[] => {
    if (mode === 'rafiki') return DARES_RAFIKI;
    if (mode === 'spicy') return DARES_SPICY;
    return customQs.dares;
  }, [mode, customQs.dares]);

  /* --- Setup helpers --- */
  const addPlayer = () => {
    if (players.length >= 8) return;
    setPlayers(p => [...p, { name: '', avatar: AVATARS[p.length % AVATARS.length], completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] }]);
  };

  const removePlayer = (i: number) => {
    if (players.length <= 2) return;
    setPlayers(p => p.filter((_, idx) => idx !== i));
  };

  const updateName = (i: number, name: string) => {
    setPlayers(p => p.map((pl, idx) => idx === i ? { ...pl, name } : pl));
  };

  const canStart = (() => {
    const allNamed = players.every(p => p.name.trim().length > 0);
    if (!allNamed) return false;
    if (mode === 'custom') {
      return customQs.truths.length >= 1 && customQs.dares.length >= 1;
    }
    return true;
  })();

  const startGame = () => {
    if (!canStart) return;
    sfxTap();
    usedTruths.current = new Set();
    usedDares.current = new Set();
    setPlayers(p => p.map(pl => ({ ...pl, completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] })));
    setCurrentPlayerIdx(0);
    setCurrentRound(0);
    startSpinner(0);
  };

  /* --- Spinner animation --- */
  const startSpinner = (targetIdx: number) => {
    setSpinnerDone(false);
    setPhase('spinner');
    setSpinnerIdx(0);

    let tick = 0;
    const totalTicks = 14 + Math.floor(Math.random() * 6);

    const runSpin = () => {
      tick++;
      const delay = 80 + tick * 30 + (tick > totalTicks - 4 ? tick * 40 : 0);
      setSpinnerIdx(prev => (prev + 1) % players.length);

      if (tick >= totalTicks) {
        setSpinnerIdx(targetIdx);
        setTimeout(() => {
          sfxReveal();
          setSpinnerDone(true);
        }, 300);
      } else {
        sfxTap();
        spinnerTimer.current = setTimeout(runSpin, delay);
      }
    };

    spinnerTimer.current = setTimeout(runSpin, 120);
  };

  useEffect(() => {
    return () => {
      if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
    };
  }, []);

  const handleSpinnerContinue = () => {
    setPhase('choose');
  };

  /* --- Pick prompt --- */
  const pickPrompt = useCallback((type: 'truth' | 'dare') => {
    const pool = type === 'truth' ? getTruthPool() : getDarePool();
    const used = type === 'truth' ? usedTruths.current : usedDares.current;
    let available = pool.filter(p => !used.has(p));
    if (available.length === 0) {
      used.clear();
      available = [...pool];
    }
    const picked = available[Math.floor(Math.random() * available.length)];
    used.add(picked);
    return picked;
  }, [getTruthPool, getDarePool]);

  const handleChoice = (type: 'truth' | 'dare') => {
    sfxTap();
    setChoice(type);
    setPrompt(pickPrompt(type));
    setFlipped(false);
    setSkipVotes(new Set());
    setPhase('reveal');
    setTimeout(() => { sfxReveal(); setFlipped(true); }, 50);
  };

  /* --- Vote to skip --- */
  const toggleVote = (playerIdx: number) => {
    sfxTap();
    setSkipVotes(prev => {
      const next = new Set(prev);
      if (next.has(playerIdx)) next.delete(playerIdx);
      else next.add(playerIdx);
      return next;
    });
  };

  const majorityReached = skipVotes.size > players.length / 2;

  useEffect(() => {
    if (majorityReached && phase === 'reveal') {
      const timer = setTimeout(() => {
        handleResult(false, true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [majorityReached, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* --- Handle result --- */
  const handleResult = (done: boolean, _wasVoteSkip = false) => {
    if (done) sfxCorrect(); else sfxWrong();
    setPlayers(p => p.map((pl, idx) => {
      if (idx !== currentPlayerIdx) return pl;
      return {
        ...pl,
        completed: pl.completed + (done ? 1 : 0),
        skipped: pl.skipped + (done ? 0 : 1),
        truthCount: pl.truthCount + (choice === 'truth' ? 1 : 0),
        dareCount: pl.dareCount + (choice === 'dare' ? 1 : 0),
        history: [...pl.history, { type: choice!, prompt, done }],
      };
    }));

    let nextPlayer = currentPlayerIdx + 1;
    let nextRound = currentRound;
    if (nextPlayer >= players.length) {
      nextPlayer = 0;
      nextRound += 1;
    }
    if (nextRound >= ROUNDS_PER_PLAYER) {
      sfxGameOver();
      setPhase('summary');
    } else {
      sfxLevelUp();
      setCurrentPlayerIdx(nextPlayer);
      setCurrentRound(nextRound);
      setChoice(null);
      setSkipVotes(new Set());
      startSpinner(nextPlayer);
    }
  };

  const resetGame = () => {
    setPhase('setup');
    setPlayers(p => p.map(pl => ({ ...pl, completed: 0, skipped: 0, truthCount: 0, dareCount: 0, history: [] })));
    setCurrentPlayerIdx(0);
    setCurrentRound(0);
    setChoice(null);
    setSkipVotes(new Set());
  };

  // Report score at game end
  useEffect(() => {
    if (phase === 'summary') {
      const totalCompleted = players.reduce((s, p) => s + p.completed, 0);
      const totalTurnsPlayed = players.reduce((s, p) => s + p.completed + p.skipped, 0);
      onGameEnd?.({
        score: totalCompleted,
        accuracy: totalTurnsPlayed > 0 ? totalCompleted / totalTurnsPlayed : 0,
        level: 1,
        maxScore: totalTurnsPlayed,
      });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* --- Custom question helpers --- */
  const addCustomTruth = () => {
    const t = customTruthInput.trim();
    if (!t) return;
    const next = { ...customQs, truths: [...customQs.truths, t] };
    setCustomQs(next);
    saveCustom(next);
    setCustomTruthInput('');
  };

  const addCustomDare = () => {
    const d = customDareInput.trim();
    if (!d) return;
    const next = { ...customQs, dares: [...customQs.dares, d] };
    setCustomQs(next);
    saveCustom(next);
    setCustomDareInput('');
  };

  const removeCustomTruth = (i: number) => {
    const next = { ...customQs, truths: customQs.truths.filter((_, idx) => idx !== i) };
    setCustomQs(next);
    saveCustom(next);
  };

  const removeCustomDare = (i: number) => {
    const next = { ...customQs, dares: customQs.dares.filter((_, idx) => idx !== i) };
    setCustomQs(next);
    saveCustom(next);
  };

  const currentPlayer = players[currentPlayerIdx];
  const modeMeta = MODE_META[mode === 'custom' ? 'custom' : mode];
  const modeColor = modeMeta.color;

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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
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
            {/* Mode picker */}
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
              Hali — Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
              {(['rafiki', 'spicy', 'custom'] as const).map(m => {
                const meta = MODE_META[m];
                const sel = m === mode;
                return (
                  <button key={m} onClick={() => setMode(m)} style={{
                    background: sel ? meta.color + '18' : C.card,
                    border: `1px solid ${sel ? meta.color + '60' : C.border}`,
                    borderRadius: RADIUS.md,
                    padding: '14px 4px 10px',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    color: sel ? meta.color : C.muted,
                    transition: `all ${MOTION.fast}`,
                    boxShadow: sel ? `0 0 20px ${meta.color}20` : C.glass,
                  }}>
                    {meta.icon}
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</span>
                    <span style={{ fontSize: 9, color: C.dim }}>{meta.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom questions editor */}
            {mode === 'custom' && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
                  Custom Truths ({customQs.truths.length})
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={customTruthInput}
                    onChange={e => setCustomTruthInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomTruth()}
                    placeholder="Add a truth question..."
                    style={{
                      flex: 1, background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: RADIUS.md, padding: '8px 12px',
                      color: C.text, fontSize: 13, fontWeight: 500,
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <button onClick={addCustomTruth} style={{
                    ...solidBtn(C.truth), padding: '8px 14px', fontSize: 12,
                  }}>
                    <Plus size={14} />
                  </button>
                </div>
                {customQs.truths.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16, maxHeight: 140, overflowY: 'auto' }}>
                    {customQs.truths.map((t, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: C.card, borderRadius: RADIUS.sm,
                        padding: '6px 10px', fontSize: 12, color: C.text,
                        border: `1px solid ${C.border}`,
                      }}>
                        <Sparkles size={12} style={{ color: C.truth, flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                        <button onClick={() => removeCustomTruth(i)} style={{
                          background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 2, display: 'flex',
                        }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}

                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>
                  Custom Dares ({customQs.dares.length})
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={customDareInput}
                    onChange={e => setCustomDareInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomDare()}
                    placeholder="Add a dare..."
                    style={{
                      flex: 1, background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: RADIUS.md, padding: '8px 12px',
                      color: C.text, fontSize: 13, fontWeight: 500,
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                  <button onClick={addCustomDare} style={{
                    ...solidBtn(C.dare), padding: '8px 14px', fontSize: 12,
                  }}>
                    <Plus size={14} />
                  </button>
                </div>
                {customQs.dares.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                    {customQs.dares.map((d, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: C.card, borderRadius: RADIUS.sm,
                        padding: '6px 10px', fontSize: 12, color: C.text,
                        border: `1px solid ${C.border}`,
                      }}>
                        <Flame size={12} style={{ color: C.dare, flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d}</span>
                        <button onClick={() => removeCustomDare(i)} style={{
                          background: 'none', border: 'none', color: C.dim, cursor: 'pointer', padding: 2, display: 'flex',
                        }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}

                {mode === 'custom' && (customQs.truths.length < 1 || customQs.dares.length < 1) && (
                  <div style={{ fontSize: 11, color: C.dare, marginTop: 8 }}>
                    Add at least 1 truth and 1 dare to play custom mode.
                  </div>
                )}
              </div>
            )}

            {/* Players */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
              ...solidBtn(modeColor),
              width: '100%', justifyContent: 'center',
              fontSize: 16, padding: '14px 24px',
              opacity: canStart ? 1 : 0.4,
            }}>
              <Play size={18} /> Anza Mchezo — Start Game
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/*  SPINNER PHASE                                                 */}
        {/* ============================================================ */}
        {phase === 'spinner' && (
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
                background: modeColor,
                borderRadius: RADIUS.full,
                transition: `width ${MOTION.med}`,
              }} />
            </div>

            <span style={{ fontSize: 13, color: C.muted, fontWeight: 600, marginBottom: 24 }}>
              Nani anafuata? — Who's next?
            </span>

            {/* Spinner ring */}
            <div style={{
              display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
              marginBottom: 32,
            }}>
              {players.map((p, i) => {
                const isActive = spinnerIdx === i;
                const isFinal = spinnerDone && spinnerIdx === i;
                return (
                  <div key={i} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '12px 16px',
                    borderRadius: RADIUS.lg,
                    background: isActive ? (isFinal ? modeColor + '25' : C.card) : 'transparent',
                    border: `2px solid ${isActive ? (isFinal ? modeColor : C.dim) : 'transparent'}`,
                    transition: 'all 80ms ease',
                    transform: isFinal ? 'scale(1.15)' : isActive ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isFinal ? `0 0 30px ${modeColor}30` : 'none',
                  }}>
                    <span style={{ fontSize: isFinal ? 40 : 28, transition: 'font-size 200ms ease' }}>
                      {p.avatar}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: isActive ? C.text : C.dim,
                    }}>
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {spinnerDone && (
              <div style={{ animation: 'fadeSlideIn 300ms ease', textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 26, fontWeight: 600, marginBottom: 4, color: modeColor }}>
                  {currentPlayer.name}!
                </h2>
                <span style={{ fontSize: 13, color: C.muted, fontWeight: 500, marginBottom: 24, display: 'block' }}>
                  Zamu yako — Your turn
                </span>
                <div style={{
                  display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: C.dim, marginBottom: 24,
                }}>
                  <span>Raundi {currentRound + 1}/{ROUNDS_PER_PLAYER}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: C.dim }} />
                  <span style={{ color: modeColor }}>{modeMeta.label}</span>
                </div>

                <button onClick={handleSpinnerContinue} style={{
                  ...solidBtn(modeColor),
                  fontSize: 16, padding: '14px 36px',
                }}>
                  Chagua — Choose <ChevronRight size={18} />
                </button>
              </div>
            )}
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
                <span style={{ fontSize: 22, fontWeight: 600, color: C.truth }}>Ukweli</span>
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
                <span style={{ fontSize: 22, fontWeight: 600, color: C.dare }}>Changamoto</span>
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
              marginBottom: 24,
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
                    fontSize: 11, fontWeight: 600,
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

            {/* Vote to skip section */}
            {flipped && (
              <div style={{
                width: '100%', marginBottom: 16,
                animation: 'fadeSlideIn 300ms ease 100ms both',
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: C.muted,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: 8, textAlign: 'center',
                }}>
                  Piga kura kuruka — Vote to skip ({skipVotes.size}/{Math.floor(players.length / 2) + 1} needed)
                </div>
                <div style={{
                  display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap',
                }}>
                  {players.map((p, i) => {
                    const voted = skipVotes.has(i);
                    return (
                      <button key={i} onClick={() => toggleVote(i)} style={{
                        background: voted ? C.dare + '25' : C.card,
                        border: `1px solid ${voted ? C.dare + '60' : C.border}`,
                        borderRadius: RADIUS.full,
                        padding: '4px 10px',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                        color: voted ? C.dare : C.muted,
                        fontSize: 11, fontWeight: 600,
                        transition: `all ${MOTION.snap}`,
                      }}>
                        <span style={{ fontSize: 14 }}>{p.avatar}</span>
                        {voted && <ThumbsUp size={10} />}
                      </button>
                    );
                  })}
                </div>
                {majorityReached && (
                  <div style={{
                    textAlign: 'center', marginTop: 8,
                    fontSize: 12, color: C.dare, fontWeight: 600,
                    animation: 'fadeSlideIn 200ms ease',
                  }}>
                    Majority voted to skip!
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            {flipped && !majorityReached && (
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
                  fontSize: 14, fontWeight: 600,
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
          const truthLover = [...players].sort((a, b) => b.truthCount - a.truthCount)[0];
          const dareTaker = [...players].sort((a, b) => b.dareCount - a.dareCount)[0];
          const totalCompleted = players.reduce((s, p) => s + p.completed, 0);
          const totalSkipped = players.reduce((s, p) => s + p.skipped, 0);
          const totalAll = totalCompleted + totalSkipped;

          return (
            <div style={{ paddingTop: 32, animation: 'fadeSlideIn 400ms ease' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Trophy size={40} style={{ color: '#f59e0b', marginBottom: 8 }} />
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Mchezo Umekwisha!</h2>
                <span style={{ fontSize: 13, color: C.muted }}>Game Over</span>
              </div>

              {/* Game stats bar */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 24,
                marginBottom: 24, padding: '12px 0',
                borderTop: `1px solid ${C.border}`,
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.rafiki }}>{totalCompleted}</div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.dare }}>{totalSkipped}</div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skipped</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.truth }}>{totalAll > 0 ? Math.round((totalCompleted / totalAll) * 100) : 0}%</div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Courage</div>
                </div>
              </div>

              {/* Awards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                <div style={{
                  background: C.card, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.rafiki}30`,
                  padding: 14, textAlign: 'center',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 24 }}>{brave.avatar}</span>
                  <div style={{ fontSize: 10, color: C.rafiki, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Jasiri Zaidi
                  </div>
                  <div style={{ fontSize: 9, color: C.dim }}>Most Brave</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{brave.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{brave.completed} completed</div>
                </div>
                <div style={{
                  background: C.card, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.custom}30`,
                  padding: 14, textAlign: 'center',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 24 }}>{shy.avatar}</span>
                  <div style={{ fontSize: 10, color: C.custom, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mwenye Haya
                  </div>
                  <div style={{ fontSize: 9, color: C.dim }}>Most Shy</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{shy.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{shy.skipped} skipped</div>
                </div>
                <div style={{
                  background: C.card, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.truth}30`,
                  padding: 14, textAlign: 'center',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 24 }}>{truthLover.avatar}</span>
                  <div style={{ fontSize: 10, color: C.truth, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mpenda Ukweli
                  </div>
                  <div style={{ fontSize: 9, color: C.dim }}>Truth Lover</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{truthLover.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{truthLover.truthCount} truths</div>
                </div>
                <div style={{
                  background: C.card, borderRadius: RADIUS.lg,
                  border: `1px solid ${C.dare}30`,
                  padding: 14, textAlign: 'center',
                  boxShadow: C.glass,
                }}>
                  <span style={{ fontSize: 24 }}>{dareTaker.avatar}</span>
                  <div style={{ fontSize: 10, color: C.dare, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Mshujaa
                  </div>
                  <div style={{ fontSize: 9, color: C.dim }}>Dare Devil</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{dareTaker.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{dareTaker.dareCount} dares</div>
                </div>
              </div>

              {/* Scoreboard */}
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'block' }}>
                Matokeo — Scoreboard
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                {sorted.map((p, i) => {
                  const total = p.completed + p.skipped;
                  const pct = total > 0 ? Math.round((p.completed / total) * 100) : 0;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: C.card, borderRadius: RADIUS.md,
                      border: `1px solid ${C.border}`,
                      padding: '10px 14px',
                      boxShadow: C.glass,
                    }}>
                      <span style={{
                        fontSize: 14, fontWeight: 700,
                        color: i === 0 ? '#f59e0b' : C.dim,
                        width: 20, textAlign: 'center',
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 22 }}>{p.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {p.completed} done / {p.skipped} skipped / {p.truthCount}T / {p.dareCount}D
                        </div>
                        {/* Mini bar */}
                        <div style={{
                          marginTop: 4, height: 3, borderRadius: 2,
                          background: C.border, overflow: 'hidden', width: '100%',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 2,
                            width: `${pct}%`,
                            background: pct >= 80 ? C.rafiki : pct >= 50 ? C.truth : C.dare,
                            transition: `width ${MOTION.med}`,
                          }} />
                        </div>
                      </div>
                      <div style={{
                        background: modeColor + '18',
                        color: modeColor,
                        borderRadius: RADIUS.full,
                        padding: '4px 10px',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* History per player */}
              <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'block' }}>
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
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 10, color: C.muted, marginLeft: 'auto' }}>
                        {p.completed}/{p.completed + p.skipped} done
                      </span>
                    </div>
                    {p.history.map((h, hi) => (
                      <div key={hi} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '6px 0',
                        borderTop: hi > 0 ? `1px solid ${C.border}` : 'none',
                      }}>
                        <span style={{
                          fontSize: 9, fontWeight: 600,
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
                          <Check size={14} style={{ color: C.rafiki, flexShrink: 0 }} />
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
                  color: C.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: C.glass,
                  transition: `all ${MOTION.fast}`,
                }}>
                  <ArrowLeft size={16} /> Nyumbani — Home
                </button>
                <button onClick={resetGame} style={{
                  ...solidBtn(modeColor),
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
