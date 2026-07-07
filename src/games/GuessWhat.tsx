import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, Sparkles, Eye, EyeOff, ChevronRight, Heart, Star, Crown, Check, X, UserCircle, Lock, RotateCcw, Zap } from 'lucide-react';
import { COLOR, RADIUS, MOTION, solidBtn } from '../lib/design';
import { sfxTap, sfxCorrect, sfxWrong, sfxReveal } from '../lib/sfx';

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
  accent: COLOR.rose,
  emerald: COLOR.emerald,
  sapphire: COLOR.sapphire,
  violet: COLOR.violet,
  amber: COLOR.amber,
  teal: COLOR.teal,
  gold: COLOR.gold,
  surface: COLOR.surface,
} as const;

const glass = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)',
};

const PLAYER_COLORS = [C.accent, C.sapphire, C.emerald, C.violet];

/* ------------------------------------------------------------------ */
/*  Question bank                                                      */
/* ------------------------------------------------------------------ */
interface Question {
  template: string;           // [name] placeholder
  options: string[];           // 4 plausible answers
}

type Category = 'preferences' | 'memories' | 'personality' | 'secrets';

const CATEGORY_META: Record<Category, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  preferences: { label: 'Preferences', color: C.accent, icon: <Heart size={18} />, desc: 'Tastes, favorites, and dream scenarios' },
  memories: { label: 'Memories', color: C.sapphire, icon: <Star size={18} />, desc: 'Past experiences and nostalgic moments' },
  personality: { label: 'Personality', color: C.emerald, icon: <Zap size={18} />, desc: 'Reactions, habits, and quirks' },
  secrets: { label: 'Secrets', color: C.violet, icon: <Lock size={18} />, desc: 'Hidden talents and guilty pleasures' },
};

const QUESTIONS: Record<Category, Question[]> = {
  preferences: [
    { template: "What's [name]'s dream vacation destination?", options: ["A secluded tropical island", "A bustling city like Tokyo", "A European countryside villa", "An African safari adventure"] },
    { template: "What would [name] eat for their last meal?", options: ["A perfectly grilled steak dinner", "Homemade comfort food from childhood", "An extravagant sushi omakase", "A massive pizza with everything on it"] },
    { template: "What superpower would [name] choose?", options: ["Teleportation", "Reading minds", "Time travel", "Invisibility"] },
    { template: "What would [name] do if they won the lottery?", options: ["Travel the world for a year", "Start a business", "Buy a dream house and invest the rest", "Give most of it to family and charity"] },
    { template: "What's [name]'s ideal weekend morning?", options: ["Sleeping in until noon", "An early workout followed by brunch", "Coffee and a good book on the couch", "Cooking an elaborate breakfast"] },
    { template: "What era would [name] want to live in?", options: ["The Roaring 1920s", "Ancient Rome at its peak", "The far future, year 3000", "The 1980s, peak pop culture"] },
    { template: "What animal would [name] want as an exotic pet?", options: ["A baby penguin", "A red panda", "A miniature pig", "A parrot that can hold conversations"] },
    { template: "What's [name]'s go-to karaoke song?", options: ["A classic power ballad", "The latest pop hit", "An old-school hip-hop anthem", "Something absolutely ridiculous for laughs"] },
    { template: "Where would [name] want to live if money was no object?", options: ["A penthouse in Manhattan", "A beachfront villa in Zanzibar", "A cozy cabin in the Swiss Alps", "A modern home in Kyoto, Japan"] },
    { template: "What would [name] binge-watch on a rainy day?", options: ["A true crime documentary series", "A classic sitcom from start to finish", "An intense thriller or sci-fi show", "A reality TV competition"] },
    { template: "What cuisine does [name] secretly crave the most?", options: ["Spicy Thai street food", "Rich Italian pasta dishes", "Japanese ramen at 2 AM", "Mexican tacos with all the fixings"] },
    { template: "What car would [name] drive in their fantasy garage?", options: ["A matte black sports car", "A vintage convertible", "A fully loaded luxury SUV", "An electric hypercar"] },
    { template: "What skill would [name] master instantly if they could?", options: ["Playing piano like a concert virtuoso", "Speaking every language fluently", "Professional-level cooking", "Expert martial arts"] },
    { template: "What's [name]'s ideal date night?", options: ["A candlelit dinner at a rooftop restaurant", "A fun adventure like go-karting or hiking", "A cozy movie night with snacks at home", "A spontaneous road trip to somewhere new"] },
    { template: "What would [name] want their dream job title to be?", options: ["Chief Vibes Officer", "Professional World Traveler", "Creative Director of Everything", "Retired at 35"] },
    { template: "What type of music does [name] listen to when nobody is around?", options: ["Emotional sad songs", "Guilty-pleasure pop from the 2000s", "Hardcore rap or metal", "Classical or jazz instrumentals"] },
  ],
  memories: [
    { template: "What would [name] say was their most embarrassing moment?", options: ["Something that happened at school in front of everyone", "An awkward moment on a date or with a crush", "A public wardrobe malfunction or fall", "Saying something wildly wrong in a serious setting"] },
    { template: "What's [name]'s favorite childhood memory?", options: ["Family trips and vacations", "Playing outside with neighborhood friends", "A special birthday or holiday celebration", "A quiet moment with a parent or grandparent"] },
    { template: "What was [name]'s childhood dream job?", options: ["Astronaut or scientist", "Doctor or lawyer", "Professional athlete", "Actor, singer, or artist"] },
    { template: "What's the bravest thing [name] has ever done?", options: ["Standing up to someone who was wrong", "Moving somewhere completely new alone", "Pursuing a dream everyone doubted", "Helping a stranger in a dangerous situation"] },
    { template: "What memory would [name] relive if they could?", options: ["A perfect day with close friends", "Their graduation or a big achievement", "A magical travel experience", "A simple family dinner from childhood"] },
    { template: "What was [name]'s first concert or big event?", options: ["A huge pop star's concert", "A local festival or community event", "A sports game that went to the wire", "They've never actually been to one yet"] },
    { template: "What lesson did [name] learn the hard way?", options: ["Not everyone who smiles at you is your friend", "Money doesn't fix everything", "You have to speak up for yourself", "Procrastination always catches up to you"] },
    { template: "What was [name]'s worst fashion phase?", options: ["An all-black everything era", "Overly baggy clothes that didn't fit", "Trying way too hard to look trendy", "A hairstyle they deeply regret now"] },
    { template: "What school subject did [name] secretly enjoy?", options: ["Math (the answers are always definite)", "Art or music class", "History (the stories were fascinating)", "Science experiments and labs"] },
    { template: "What's the funniest thing that's ever happened to [name]?", options: ["An autocorrect text that went horribly wrong", "A misunderstanding that escalated hilariously", "Falling or tripping at the worst possible moment", "A prank that backfired on everyone involved"] },
    { template: "What's [name]'s biggest 'what if' moment in life?", options: ["A career or school path they didn't take", "A relationship they walked away from", "A move to another city or country they almost made", "A risky opportunity they played it safe on"] },
    { template: "What childhood toy or item does [name] still think about?", options: ["A beloved stuffed animal or doll", "A specific video game or console", "A bike or outdoor toy", "A book or collection they built over years"] },
    { template: "What's the best gift [name] ever received?", options: ["Something handmade or deeply personal", "A surprise trip or experience", "A gadget or item they'd wanted for years", "Money that came at exactly the right time"] },
    { template: "What's [name]'s proudest accomplishment that few people know about?", options: ["Overcoming a personal struggle silently", "A creative project they finished on their own", "Helping someone through a really dark time", "Learning something difficult without any help"] },
    { template: "What was [name]'s worst travel experience?", options: ["Getting completely lost in a foreign place", "A flight delay or cancellation disaster", "Food poisoning in another country", "Losing luggage with everything important in it"] },
    { template: "What was [name] like as a teenager?", options: ["The quiet, observant one in the group", "The loudest, most energetic person in any room", "The rebellious one who questioned everything", "The responsible, mature-beyond-their-years type"] },
  ],
  personality: [
    { template: "How would [name] react to finding a spider in their room?", options: ["Calmly catch it and release it outside", "Scream and leave the room immediately", "Grab a shoe and handle business", "Call someone else to deal with it"] },
    { template: "What does [name] do when they're bored?", options: ["Scroll social media for hours", "Start a random new project or hobby", "Text everyone in their contacts to hang out", "Reorganize or clean something that doesn't need it"] },
    { template: "How does [name] handle being angry?", options: ["Goes completely silent and distant", "Vents to someone they trust right away", "Works out or does something physical", "Writes it out or processes it alone first"] },
    { template: "What role does [name] play in a friend group?", options: ["The planner who organizes everything", "The comedian who keeps everyone laughing", "The therapist everyone confides in", "The spontaneous one with wild ideas"] },
    { template: "How does [name] act when they have a crush?", options: ["Becomes awkwardly quiet and avoids eye contact", "Gets extra funny and charming around them", "Pretends they don't care at all (overcompensating)", "Tells everyone except the actual person"] },
    { template: "What's [name]'s conflict resolution style?", options: ["Address it head-on, clear the air immediately", "Avoid it and hope it resolves itself", "Write a long thoughtful message about it", "Use humor to defuse the tension first"] },
    { template: "How would [name] survive a zombie apocalypse?", options: ["Lead a group and build a fortress", "Go solo and trust nobody", "Find the scientists and help find a cure", "Honestly? Probably wouldn't make it past day one"] },
    { template: "What's [name]'s texting style?", options: ["Full sentences with proper grammar", "Short replies, heavy on emojis", "Voice notes instead of typing", "Takes three days to reply but sends an essay"] },
    { template: "How does [name] act at a party where they know nobody?", options: ["Find the pet or the snack table", "Become best friends with one random person", "Stand in a corner and observe everything", "Leave after 20 minutes"] },
    { template: "What's [name]'s approach to a big decision?", options: ["Pro/con list and research for days", "Go with their gut feeling immediately", "Ask everyone they know for advice", "Avoid deciding until the last possible moment"] },
    { template: "How does [name] react to receiving a compliment?", options: ["Deflect it immediately ('Oh, this old thing?')", "Light up and say thank you genuinely", "Get visibly uncomfortable and change the subject", "Return a bigger compliment right back"] },
    { template: "What does [name] do at 3 AM when they can't sleep?", options: ["Fall into a deep internet rabbit hole", "Raid the kitchen for a midnight snack", "Stare at the ceiling having a philosophical crisis", "Put on a podcast or music and wait it out"] },
    { template: "How does [name] behave on a road trip?", options: ["Takes over the aux cord and DJs the whole ride", "Falls asleep within the first 30 minutes", "Is the navigator giving constant directions", "Points at every interesting thing out the window"] },
    { template: "What's [name]'s reaction to a surprise party?", options: ["Genuinely shocked and emotional", "Immediately suspicious — they already knew", "Awkwardly overwhelmed and needs a minute", "Thrilled and immediately the life of the party"] },
    { template: "How would [name] describe themselves in three words?", options: ["Loyal, funny, overthinking", "Ambitious, caring, stubborn", "Creative, chill, curious", "Honest, intense, independent"] },
    { template: "What does [name] do when someone is clearly lying to them?", options: ["Call it out directly and immediately", "Play along and gather more evidence first", "Say nothing but remember it forever", "Give them a look that says 'I know'"] },
  ],
  secrets: [
    { template: "What's [name]'s hidden talent nobody expects?", options: ["They can sing surprisingly well", "They're secretly a great cook or baker", "They can draw or paint beautifully", "They can do impressions of famous people"] },
    { template: "What does [name] secretly judge people for?", options: ["Bad grammar and spelling", "Being rude to service workers", "Their taste in music or movies", "How they load a dishwasher or organize things"] },
    { template: "What's [name]'s guilty pleasure they'd never admit?", options: ["A trashy reality TV show", "A specific junk food they'll eat an entire bag of", "Re-reading old texts or social media posts", "Singing dramatically alone in the car"] },
    { template: "What's [name]'s secret fear that surprises people?", options: ["Deep water or the open ocean", "Being forgotten or not mattering", "Small enclosed spaces", "Growing old and having regrets"] },
    { template: "What does [name] do when absolutely nobody is watching?", options: ["Have full conversations with themselves", "Dance like nobody's watching (literally)", "Practice speeches or arguments in the mirror", "Google their own name or look at old photos"] },
    { template: "What secret snack does [name] eat at midnight?", options: ["Cereal straight from the box", "Cheese — just cheese, by itself", "Something spicy with hot sauce on everything", "Ice cream eaten directly from the container"] },
    { template: "What would [name] never want their parents to find out?", options: ["How many times they've called in 'sick'", "The real story behind that one night", "How much money they've actually spent on something dumb", "A friendship or relationship they kept hidden"] },
    { template: "What's [name]'s most unpopular opinion?", options: ["A beloved movie or show is actually terrible", "A food everyone loves is genuinely disgusting", "A popular life advice is completely wrong", "A celebrity everyone adores is overrated"] },
    { template: "What's [name]'s secret dream they haven't told anyone?", options: ["Writing a book or creating something major", "Living abroad in a completely different culture", "Starting a business doing something they love", "Performing on stage — music, comedy, or acting"] },
    { template: "What habit does [name] have that they try to hide?", options: ["Procrastinating until the very last second", "Stalking people's social media profiles deeply", "Talking to their pet like it's a real person", "Hoarding random things they 'might need someday'"] },
    { template: "What's [name]'s emotional support content?", options: ["A specific TV show they've rewatched 5+ times", "A playlist that fixes any bad mood", "A comfort food that heals everything", "A YouTube channel or creator they watch religiously"] },
    { template: "What's the pettiest thing [name] has ever done?", options: ["Unfollowed someone over a minor disagreement", "Remembered an insult from years ago and brought it up", "Gone out of their way to prove someone wrong", "Kept score of favors and called it out eventually"] },
    { template: "What lie does [name] tell most often?", options: ["'I'm on my way!' (hasn't left yet)", "'I'm fine' (absolutely not fine)", "'I've seen that' (has definitely not seen it)", "'I don't care' (cares very deeply)"] },
    { template: "What would [name] change about themselves if nobody would know?", options: ["Their level of confidence", "A physical feature they're self-conscious about", "Their ability to not overthink everything", "Their financial situation instantly"] },
    { template: "What does [name] pretend to like but actually can't stand?", options: ["A popular food that everyone seems to love", "Small talk with acquaintances", "A genre of music their friends are into", "Going out when they'd rather stay home"] },
    { template: "What's the weirdest thing [name] has googled recently?", options: ["A random medical symptom spiral", "Something deeply philosophical at 2 AM", "How to do something embarrassingly basic", "Whether a dream they had means something"] },
  ],
};

/* ------------------------------------------------------------------ */
/*  Game types                                                         */
/* ------------------------------------------------------------------ */
type Phase = 'setup' | 'category' | 'subject-pick' | 'pass-phone' | 'guessing' | 'reveal' | 'round-end' | 'results';

interface Player {
  name: string;
  score: number;
  correctGuesses: number;
  timesGuessedWrong: number; // how many times others guessed wrong about this player
}

interface RoundState {
  subjectIndex: number;
  questionIndex: number;
  subjectAnswer: number | null;
  guesses: Record<number, number>; // playerIndex -> their guess
  revealed: boolean;
}

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
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props { onBack: () => void }

export default function GuessWhat({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [players, setPlayers] = useState<Player[]>([{ name: '', score: 0, correctGuesses: 0, timesGuessedWrong: 0 }, { name: '', score: 0, correctGuesses: 0, timesGuessedWrong: 0 }]);
  const [category, setCategory] = useState<Category | null>(null);
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [questionCursor, setQuestionCursor] = useState(0);
  const [round, setRound] = useState<RoundState>({ subjectIndex: 0, questionIndex: 0, subjectAnswer: null, guesses: {}, revealed: false });
  const [currentGuesser, setCurrentGuesser] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [totalRoundsPerPlayer] = useState(3);
  const [subjectRoundCount, setSubjectRoundCount] = useState(0); // rounds completed by current subject
  const [currentSubjectIdx, setCurrentSubjectIdx] = useState(0);
  const [revealAnim, setRevealAnim] = useState(false);
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  // Pair compatibility tracking: pairKey "i-j" -> { correct, total }
  const pairStats = useRef<Record<string, { correct: number; total: number }>>({});

  const totalRounds = players.length * totalRoundsPerPlayer;
  const currentQuestion = questionPool[questionCursor] || null;

  /* ---- Setup helpers ---- */
  const addPlayer = () => {
    if (players.length < 4) setPlayers(p => [...p, { name: '', score: 0, correctGuesses: 0, timesGuessedWrong: 0 }]);
  };
  const removePlayer = (i: number) => {
    if (players.length > 2) setPlayers(p => p.filter((_, idx) => idx !== i));
  };
  const setPlayerName = (i: number, name: string) => {
    setPlayers(p => p.map((pl, idx) => idx === i ? { ...pl, name } : pl));
  };
  const canStart = players.every(p => p.name.trim().length > 0);

  /* ---- Start game ---- */
  const startGame = (cat: Category) => {
    setCategory(cat);
    const pool = shuffle(QUESTIONS[cat]);
    setQuestionPool(pool);
    setQuestionCursor(0);
    setCurrentSubjectIdx(0);
    setSubjectRoundCount(0);
    setRoundsPlayed(0);
    pairStats.current = {};
    // Reset scores
    setPlayers(ps => ps.map(p => ({ ...p, score: 0, correctGuesses: 0, timesGuessedWrong: 0 })));
    setRound({ subjectIndex: 0, questionIndex: 0, subjectAnswer: null, guesses: {}, revealed: false });
    setPhase('subject-pick');
  };

  /* ---- Subject picks answer ---- */
  const subjectPickAnswer = (optionIdx: number) => {
    sfxTap();
    setRound(r => ({ ...r, subjectAnswer: optionIdx }));
    setPhase('pass-phone');
  };

  /* ---- Start guessing round ---- */
  const startGuessing = () => {
    sfxTap();
    // Find first guesser (skip subject)
    let g = 0;
    if (g === currentSubjectIdx) g++;
    setCurrentGuesser(g);
    setPhase('guessing');
  };

  /* ---- Player guesses ---- */
  const playerGuess = (optionIdx: number) => {
    sfxTap();
    setRound(r => ({ ...r, guesses: { ...r.guesses, [currentGuesser]: optionIdx } }));

    // Find next guesser
    let next = currentGuesser + 1;
    while (next < players.length && next === currentSubjectIdx) next++;
    if (next >= players.length) {
      // All guessed -> reveal
      setTimeout(() => {
        sfxReveal();
        setRevealAnim(true);
        setPhase('reveal');
      }, 300);
    } else {
      setCurrentGuesser(next);
      // Brief pass-phone between guessers
      setPhase('pass-phone');
    }
  };

  /* ---- Process reveal & scoring ---- */
  useEffect(() => {
    if (phase !== 'reveal' || !revealAnim) return;
    const answer = round.subjectAnswer!;
    let anyCorrect = false;

    const updatedPlayers = [...players];
    for (const [gIdxStr, guess] of Object.entries(round.guesses)) {
      const gIdx = Number(gIdxStr);
      const pairKey = [Math.min(gIdx, currentSubjectIdx), Math.max(gIdx, currentSubjectIdx)].join('-');
      if (!pairStats.current[pairKey]) pairStats.current[pairKey] = { correct: 0, total: 0 };
      pairStats.current[pairKey].total++;

      if (guess === answer) {
        sfxCorrect();
        updatedPlayers[gIdx].score += 10;
        updatedPlayers[gIdx].correctGuesses++;
        pairStats.current[pairKey].correct++;
        anyCorrect = true;
      }
    }
    if (!anyCorrect) {
      updatedPlayers[currentSubjectIdx].score += 5;
      updatedPlayers[currentSubjectIdx].timesGuessedWrong++;
    }
    setPlayers(updatedPlayers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, revealAnim]);

  /* ---- Next round ---- */
  const nextRound = () => {
    sfxTap();
    setRevealAnim(false);
    const newRoundsPlayed = roundsPlayed + 1;
    setRoundsPlayed(newRoundsPlayed);

    if (newRoundsPlayed >= totalRounds) {
      setPhase('results');
      return;
    }

    const newSubjectRound = subjectRoundCount + 1;
    let newSubjectIdx = currentSubjectIdx;
    let newSubjectRoundCount = newSubjectRound;

    if (newSubjectRound >= totalRoundsPerPlayer) {
      newSubjectIdx = currentSubjectIdx + 1;
      newSubjectRoundCount = 0;
    }

    setCurrentSubjectIdx(newSubjectIdx);
    setSubjectRoundCount(newSubjectRoundCount);
    setQuestionCursor(c => c + 1);
    setRound({ subjectIndex: newSubjectIdx, questionIndex: newRoundsPlayed, subjectAnswer: null, guesses: {}, revealed: false });
    setPhase('subject-pick');
  };

  /* ---- Restart ---- */
  const restart = () => {
    setPhase('setup');
    setPlayers([{ name: '', score: 0, correctGuesses: 0, timesGuessedWrong: 0 }, { name: '', score: 0, correctGuesses: 0, timesGuessedWrong: 0 }]);
    setCategory(null);
    setQuestionPool([]);
    setQuestionCursor(0);
    setRoundsPlayed(0);
    pairStats.current = {};
  };

  /* ---- Compatibility computation ---- */
  const getCompatibility = (i: number, j: number): number => {
    const key = [Math.min(i, j), Math.max(i, j)].join('-');
    const stats = pairStats.current[key];
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.correct / stats.total) * 100);
  };

  /* ---- Styles ---- */
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: C.bg,
    color: C.text,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '20px',
    maxWidth: 520,
    margin: '0 auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  };

  const backBtn: React.CSSProperties = {
    background: 'none',
    border: `1px solid ${C.border}`,
    borderRadius: RADIUS.md,
    color: C.muted,
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${MOTION.fast}`,
  };

  const cardStyle = (accent?: string): React.CSSProperties => ({
    background: C.card,
    border: `1px solid ${accent ? accent + '30' : C.border}`,
    borderRadius: RADIUS.lg,
    padding: 20,
    ...glass,
    transition: `all ${MOTION.fast}`,
  });

  const inputStyle: React.CSSProperties = {
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: RADIUS.md,
    color: C.text,
    padding: '10px 14px',
    fontSize: 14,
    width: '100%',
    outline: 'none',
    transition: `border-color ${MOTION.fast}`,
  };

  const optionBtn = (color: string, selected: boolean, correct?: boolean, wrong?: boolean): React.CSSProperties => ({
    background: correct ? color + '25' : wrong ? C.accent + '15' : selected ? color + '20' : C.bg,
    border: `1.5px solid ${correct ? color : wrong ? C.accent + '60' : selected ? color + '60' : C.border}`,
    borderRadius: RADIUS.md,
    padding: '14px 16px',
    color: C.text,
    fontSize: 14,
    cursor: phase === 'reveal' ? 'default' : 'pointer',
    textAlign: 'left' as const,
    width: '100%',
    transition: `all ${MOTION.fast}`,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    ...glass,
  });

  const labelBadge = (color: string): React.CSSProperties => ({
    background: color + '20',
    color,
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: RADIUS.full,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  });

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  /* ---- SETUP ---- */
  if (phase === 'setup') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtn} onClick={onBack}><ArrowLeft size={18} /></button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Guess What</h1>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>How well do you really know each other?</p>
          </div>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={16} color={C.accent} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Players ({players.length}/4)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {players.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLAYER_COLORS[i], flexShrink: 0 }} />
                <input
                  style={inputStyle}
                  placeholder={`Player ${i + 1} name`}
                  value={p.name}
                  onChange={e => setPlayerName(i, e.target.value)}
                  maxLength={16}
                />
                {players.length > 2 && (
                  <button
                    style={{ ...backBtn, padding: 6 }}
                    onClick={() => removePlayer(i)}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {players.length < 4 && (
            <button
              style={{ background: 'none', border: `1px dashed ${C.dim}`, borderRadius: RADIUS.md, color: C.muted, padding: '8px', width: '100%', marginTop: 10, cursor: 'pointer', fontSize: 13 }}
              onClick={addPlayer}
            >
              + Add Player
            </button>
          )}
        </div>

        <button
          style={{ ...solidBtn(C.accent), width: '100%', justifyContent: 'center', opacity: canStart ? 1 : 0.4, pointerEvents: canStart ? 'auto' : 'none', padding: '14px 24px', fontSize: 15 }}
          onClick={() => canStart && setPhase('category')}
        >
          Choose Category <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  /* ---- CATEGORY SELECT ---- */
  if (phase === 'category') {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtn} onClick={() => setPhase('setup')}><ArrowLeft size={18} /></button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Pick a Category</h1>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{players.length} players, {totalRounds} rounds</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][]).map(([key, meta]) => (
            <button
              key={key}
              style={{ ...cardStyle(meta.color), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}
              onClick={() => startGame(key)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = meta.color + '50'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = meta.color + '30'; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: RADIUS.md, background: meta.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                {meta.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{meta.label}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{meta.desc}</div>
              </div>
              <ChevronRight size={16} color={C.dim} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---- SUBJECT PICKS ANSWER ---- */
  if (phase === 'subject-pick' && currentQuestion) {
    const subject = players[currentSubjectIdx];
    const questionText = currentQuestion.template.replace('[name]', subject.name);

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button style={backBtn} onClick={restart}><ArrowLeft size={18} /></button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Round {roundsPlayed + 1}/{totalRounds}</span>
              <span style={labelBadge(CATEGORY_META[category!].color)}>{CATEGORY_META[category!].label}</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: C.border, borderRadius: RADIUS.full, height: 4, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: C.accent, height: '100%', borderRadius: RADIUS.full, width: `${((roundsPlayed) / totalRounds) * 100}%`, transition: `width ${MOTION.med}` }} />
        </div>

        <div style={{ ...cardStyle(PLAYER_COLORS[currentSubjectIdx]), marginBottom: 20, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
            <Lock size={14} color={PLAYER_COLORS[currentSubjectIdx]} />
            <span style={{ fontSize: 11, fontWeight: 700, color: PLAYER_COLORS[currentSubjectIdx], textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {subject.name}'s turn — pick secretly
            </span>
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4, margin: '12px 0 0' }}>{questionText}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              style={optionBtn(PLAYER_COLORS[currentSubjectIdx], false)}
              onClick={() => subjectPickAnswer(i)}
              onMouseEnter={() => setHoveredOption(i)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: hoveredOption === i ? PLAYER_COLORS[currentSubjectIdx] + '30' : C.bg, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0, transition: `all ${MOTION.fast}` }}>
                {String.fromCharCode(65 + i)}
              </div>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---- PASS THE PHONE ---- */
  if (phase === 'pass-phone') {
    const nextPlayer = Object.keys(round.guesses).length === 0
      ? (() => { let g = 0; if (g === currentSubjectIdx) g++; return g; })()
      : currentGuesser;
    const isFirstPass = Object.keys(round.guesses).length === 0;

    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: PLAYER_COLORS[nextPlayer] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${PLAYER_COLORS[nextPlayer]}40` }}>
            <UserCircle size={40} color={PLAYER_COLORS[nextPlayer]} />
          </div>
          <div>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Pass the phone to
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 600, margin: 0, color: PLAYER_COLORS[nextPlayer] }}>
              {players[nextPlayer].name}
            </h2>
            <p style={{ fontSize: 13, color: C.dim, marginTop: 8 }}>
              {isFirstPass ? `Guess what ${players[currentSubjectIdx].name} chose` : `Your turn to guess`}
            </p>
          </div>

          {/* Peek at secret answer toggle */}
          {!isFirstPass && (
            <div style={{ fontSize: 12, color: C.dim }}>
              Don't peek at the screen until it's your turn!
            </div>
          )}

          <button
            style={{ ...solidBtn(PLAYER_COLORS[nextPlayer]), padding: '14px 32px', fontSize: 15 }}
            onClick={startGuessing}
          >
            I'm Ready <Eye size={16} />
          </button>
        </div>
      </div>
    );
  }

  /* ---- GUESSING ---- */
  if (phase === 'guessing' && currentQuestion) {
    const subject = players[currentSubjectIdx];
    const guesser = players[currentGuesser];
    const questionText = currentQuestion.template.replace('[name]', subject.name);
    const guessersRemaining = players.filter((_, i) => i !== currentSubjectIdx && !(i in round.guesses) && i !== currentGuesser).length;

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLAYER_COLORS[currentGuesser] }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: PLAYER_COLORS[currentGuesser] }}>{guesser.name}'s Guess</span>
              {guessersRemaining > 0 && (
                <span style={{ fontSize: 11, color: C.dim }}>({guessersRemaining} more after)</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle(), marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 4px' }}>What did {subject.name} pick?</p>
          <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>{questionText}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQuestion.options.map((opt, i) => (
            <button
              key={i}
              style={optionBtn(PLAYER_COLORS[currentGuesser], false)}
              onClick={() => playerGuess(i)}
              onMouseEnter={() => setHoveredOption(i)}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: hoveredOption === i ? PLAYER_COLORS[currentGuesser] + '30' : C.bg, border: `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0, transition: `all ${MOTION.fast}` }}>
                {String.fromCharCode(65 + i)}
              </div>
              <span>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ---- REVEAL ---- */
  if (phase === 'reveal' && currentQuestion) {
    const subject = players[currentSubjectIdx];
    const questionText = currentQuestion.template.replace('[name]', subject.name);
    const correctIdx = round.subjectAnswer!;
    const guessEntries = Object.entries(round.guesses).map(([k, v]) => ({ playerIdx: Number(k), guess: v }));
    const correctGuessers = guessEntries.filter(g => g.guess === correctIdx);

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>The Answer Is In</span>
          </div>
        </div>

        <div style={{ ...cardStyle(PLAYER_COLORS[currentSubjectIdx]), marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: C.muted, margin: '0 0 8px' }}>{questionText}</p>
        </div>

        {/* Options with reveal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {currentQuestion.options.map((opt, i) => {
            const isCorrect = i === correctIdx;
            const guessersOnThis = guessEntries.filter(g => g.guess === i);

            return (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{
                  ...optionBtn(C.emerald, false, isCorrect, !isCorrect && guessersOnThis.length > 0),
                  cursor: 'default',
                  animation: isCorrect && revealAnim ? 'reveal-pulse 0.6s ease' : undefined,
                }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: isCorrect ? C.emerald + '30' : C.bg, border: `1.5px solid ${isCorrect ? C.emerald : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isCorrect ? <Check size={14} color={C.emerald} /> : <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{String.fromCharCode(65 + i)}</span>}
                  </div>
                  <span style={{ flex: 1, fontWeight: isCorrect ? 700 : 400 }}>{opt}</span>
                  {isCorrect && <span style={labelBadge(C.emerald)}>Answer</span>}
                </div>
                {/* Show who guessed this */}
                {guessersOnThis.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, marginLeft: 36, flexWrap: 'wrap' }}>
                    {guessersOnThis.map(g => (
                      <span key={g.playerIdx} style={{ ...labelBadge(PLAYER_COLORS[g.playerIdx]), display: 'flex', alignItems: 'center', gap: 4 }}>
                        {g.guess === correctIdx ? <Check size={10} /> : <X size={10} />}
                        {players[g.playerIdx].name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Score summary for this round */}
        <div style={{ ...cardStyle(), marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: C.muted }}>Round Scoring</div>
          {correctGuessers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {correctGuessers.map(g => (
                <div key={g.playerIdx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={14} color={C.emerald} />
                  <span style={{ color: PLAYER_COLORS[g.playerIdx], fontWeight: 700 }}>{players[g.playerIdx].name}</span>
                  <span style={{ color: C.emerald, fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>+10</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} color={C.amber} />
              <span style={{ color: PLAYER_COLORS[currentSubjectIdx], fontWeight: 700 }}>{subject.name}</span>
              <span style={{ color: C.muted, fontSize: 13 }}>fooled everyone!</span>
              <span style={{ color: C.amber, fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>+5</span>
            </div>
          )}
        </div>

        <button
          style={{ ...solidBtn(C.accent), width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}
          onClick={nextRound}
        >
          {roundsPlayed + 1 >= totalRounds ? 'See Results' : 'Next Round'} <ChevronRight size={16} />
        </button>

        <style>{`
          @keyframes reveal-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 0 24px ${C.emerald}40; }
            100% { transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  /* ---- RESULTS ---- */
  if (phase === 'results') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const soulReader = [...players].sort((a, b) => b.correctGuesses - a.correctGuesses)[0];
    const mysteryPerson = [...players].sort((a, b) => b.timesGuessedWrong - a.timesGuessedWrong)[0];

    // Build compatibility pairs
    const pairs: { i: number; j: number; pct: number }[] = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairs.push({ i, j, pct: getCompatibility(i, j) });
      }
    }

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>Game Over</h1>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{CATEGORY_META[category!].label} — {totalRounds} rounds</p>
          </div>
        </div>

        {/* Podium */}
        <div style={{ ...cardStyle(C.gold), marginBottom: 16, textAlign: 'center' }}>
          <Crown size={28} color={C.gold} style={{ marginBottom: 8 }} />
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: C.gold }}>{sorted[0].name}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 600 }}>{sorted[0].score} pts</p>
        </div>

        {/* Scoreboard */}
        <div style={{ ...cardStyle(), marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 12 }}>Final Standings</div>
          {sorted.map((p, i) => {
            const origIdx = players.indexOf(p);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < sorted.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontWeight: 600, fontSize: 16, color: i === 0 ? C.gold : C.dim, width: 24, textAlign: 'center' }}>
                  {i + 1}
                </span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PLAYER_COLORS[origIdx] }} />
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{p.score}</span>
              </div>
            );
          })}
        </div>

        {/* Awards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ ...cardStyle(C.sapphire), textAlign: 'center', padding: 16 }}>
            <Eye size={20} color={C.sapphire} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: C.sapphire, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Soul Reader</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{soulReader.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{soulReader.correctGuesses} correct guesses</div>
          </div>
          <div style={{ ...cardStyle(C.violet), textAlign: 'center', padding: 16 }}>
            <EyeOff size={20} color={C.violet} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: C.violet, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Mystery Person</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{mysteryPerson.name}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Fooled others {mysteryPerson.timesGuessedWrong}x</div>
          </div>
        </div>

        {/* Compatibility */}
        {pairs.length > 0 && (
          <div style={{ ...cardStyle(), marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Heart size={16} color={C.accent} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>Compatibility Scores</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pairs.sort((a, b) => b.pct - a.pct).map((pair, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ color: PLAYER_COLORS[pair.i], fontWeight: 600, fontSize: 13 }}>{players[pair.i].name}</span>
                    <span style={{ color: C.dim, fontSize: 11 }}>&</span>
                    <span style={{ color: PLAYER_COLORS[pair.j], fontWeight: 600, fontSize: 13 }}>{players[pair.j].name}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 600, fontSize: 15, color: pair.pct >= 70 ? C.emerald : pair.pct >= 40 ? C.amber : C.accent }}>
                      {pair.pct}%
                    </span>
                  </div>
                  <div style={{ background: C.border, borderRadius: RADIUS.full, height: 5, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      borderRadius: RADIUS.full,
                      width: `${pair.pct}%`,
                      background: pair.pct >= 70 ? C.emerald : pair.pct >= 40 ? C.amber : C.accent,
                      transition: `width ${MOTION.slow}`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{ ...solidBtn(C.dim), flex: 1, justifyContent: 'center', padding: '14px 24px' }}
            onClick={restart}
          >
            <RotateCcw size={16} /> New Game
          </button>
          <button
            style={{ ...solidBtn(C.accent), flex: 1, justifyContent: 'center', padding: '14px 24px' }}
            onClick={onBack}
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  /* ---- Fallback (shouldn't reach) ---- */
  return <div style={containerStyle}><p>Loading...</p></div>;
}
