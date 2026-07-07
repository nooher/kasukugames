import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { RADIUS, MOTION, solidBtn } from '../lib/design';
import { sfxTap, sfxCorrect, sfxReveal, sfxGameOver, sfxLevelUp } from '../lib/sfx';

/* ── palette (dark party theme, no gradients) ── */
const C = {
  bg: '#080c12',
  card: '#151d2b',
  border: '#1e2a3a',
  text: '#e8edf5',
  muted: '#8899aa',
  dim: '#3a4a5c',
  glass: 'rgba(255,255,255,0.04)',
  green: '#22c55e',
  red: '#ef4444',
  amber: '#f59e0b',
  teal: '#14b8a6',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
};

const AVATARS = ['lion', 'tiger', 'fox', 'panda', 'koala', 'frog', 'butterfly', 'octopus'] as const;
const AVATAR_EMOJI: Record<string, string> = {
  lion: '\u{1F981}', tiger: '\u{1F42F}', fox: '\u{1F98A}', panda: '\u{1F43C}',
  koala: '\u{1F428}', frog: '\u{1F438}', butterfly: '\u{1F98B}', octopus: '\u{1F419}',
};
const PLAYER_COLORS = [C.green, C.red, C.blue, C.purple, C.pink, C.orange, C.teal, C.amber];

/* ── types ── */
type GameMode = 'friends' | 'spicy' | 'custom';
type Phase = 'setup' | 'spinning' | 'challenge' | 'summary';

interface Player {
  name: string;
  avatar: typeof AVATARS[number];
  spins: number;
  skipped: number;
  completed: number;
  boldest: number;
}

interface Challenge {
  text: string;
  type: 'question' | 'dare' | 'creative' | 'relationship';
}

const MODE_META: Record<GameMode, { label: string; swLabel: string; color: string; desc: string }> = {
  friends: { label: 'Friends', swLabel: 'Marafiki', color: C.green, desc: 'Fun, clean challenges for everyone' },
  spicy: { label: 'Spicy', swLabel: 'Viungo', color: C.red, desc: 'Adults only. Intimate and bold.' },
  custom: { label: 'Custom', swLabel: 'Desturi', color: C.amber, desc: 'Your own questions and dares' },
};

/* ── challenge banks ── */
const FRIENDS_CHALLENGES: Challenge[] = [
  // questions (20+)
  { text: 'What is the most embarrassing thing that happened to you this year?', type: 'question' },
  { text: 'If you could swap lives with anyone here for a day, who would it be?', type: 'question' },
  { text: 'What is your most irrational fear?', type: 'question' },
  { text: 'What is the last lie you told?', type: 'question' },
  { text: 'If you had to delete all but 3 apps on your phone, which would you keep?', type: 'question' },
  { text: 'What is the weirdest dream you have ever had?', type: 'question' },
  { text: 'What is your guilty pleasure TV show or movie?', type: 'question' },
  { text: 'If you could have dinner with any person dead or alive, who would you pick?', type: 'question' },
  { text: 'What is the most childish thing you still do?', type: 'question' },
  { text: 'What song do you secretly sing in the shower?', type: 'question' },
  { text: 'Have you ever pretended to like a gift? What was it?', type: 'question' },
  { text: 'What is something you have never told anyone in this room?', type: 'question' },
  { text: 'What is the worst date you have ever been on?', type: 'question' },
  { text: 'If you won the lottery tomorrow, what is the first thing you would buy?', type: 'question' },
  { text: 'What is your most unpopular opinion?', type: 'question' },
  { text: 'If you could master one skill overnight, what would it be?', type: 'question' },
  { text: 'What is the dumbest thing you have ever done on a dare?', type: 'question' },
  { text: 'Who was your first celebrity crush?', type: 'question' },
  { text: 'What is your biggest pet peeve about the person to your left?', type: 'question' },
  { text: 'What would your autobiography be called?', type: 'question' },
  // dares (20+)
  { text: 'Do your best impression of someone in this room. Others guess who.', type: 'dare' },
  { text: 'Let the group go through your camera roll for 30 seconds.', type: 'dare' },
  { text: 'Send a voice note to the last person you texted saying "I miss you."', type: 'dare' },
  { text: 'Do 10 push-ups right now.', type: 'dare' },
  { text: 'Speak in an accent for the next 3 rounds.', type: 'dare' },
  { text: 'Let someone in the group post a story on your social media.', type: 'dare' },
  { text: 'Dance for 30 seconds with no music.', type: 'dare' },
  { text: 'Call a friend and sing "Happy Birthday" to them right now.', type: 'dare' },
  { text: 'Do your best runway walk across the room.', type: 'dare' },
  { text: 'Stack 5 items from the room on your head and hold for 10 seconds.', type: 'dare' },
  { text: 'Let the person to your right draw something on your hand with a pen.', type: 'dare' },
  { text: 'Eat a spoonful of something spicy or sour from the kitchen.', type: 'dare' },
  { text: 'Give a 30-second motivational speech about the person across from you.', type: 'dare' },
  { text: 'Do the worm or attempt to breakdance.', type: 'dare' },
  { text: 'Hold a plank position until the next person finishes their challenge.', type: 'dare' },
  { text: 'Let the group choose your profile picture for the next 24 hours.', type: 'dare' },
  { text: 'Recreate a famous movie scene with the person next to you.', type: 'dare' },
  { text: 'Speak without using the letter "S" for the next 2 rounds.', type: 'dare' },
  { text: 'Do your best stand-up comedy bit for 1 minute.', type: 'dare' },
  { text: 'Wear your shirt inside out for the rest of the game.', type: 'dare' },
  // creative (10+)
  { text: 'In 60 seconds, draw a portrait of the person to your right. Show everyone.', type: 'creative' },
  { text: 'Make up a rap verse about your day and perform it.', type: 'creative' },
  { text: 'Come up with a new handshake with the person across from you in 30 seconds.', type: 'creative' },
  { text: 'Invent a cocktail using 3 ingredients from the room. Name it.', type: 'creative' },
  { text: 'Write a haiku about the person who spun the bottle.', type: 'creative' },
  { text: 'Tell a 2-sentence horror story that makes everyone shiver.', type: 'creative' },
  { text: 'Create a superhero identity for yourself: name, power, weakness.', type: 'creative' },
  { text: 'Act out a commercial for an imaginary product. Sell it hard.', type: 'creative' },
  { text: 'Compose a short love poem for anyone in the room.', type: 'creative' },
  { text: 'Pitch a terrible movie idea and make it sound amazing.', type: 'creative' },
  { text: 'In 20 seconds, build something from objects around you. Present your masterpiece.', type: 'creative' },
  // relationship (10+)
  { text: 'What is your favorite memory with someone in this room?', type: 'relationship' },
  { text: 'Give a genuine compliment to every player in the room.', type: 'relationship' },
  { text: 'Who in this room would you trust with your deepest secret?', type: 'relationship' },
  { text: 'What is the nicest thing someone in this room has done for you?', type: 'relationship' },
  { text: 'If you had to be stranded on an island with one person here, who?', type: 'relationship' },
  { text: 'What quality do you admire most in the person to your left?', type: 'relationship' },
  { text: 'Who in this room do you think would make the best leader and why?', type: 'relationship' },
  { text: 'Share a time when someone in this room made you laugh the hardest.', type: 'relationship' },
  { text: 'If you could relive one moment with someone here, what would it be?', type: 'relationship' },
  { text: 'What is one thing you wish you could tell someone in this room?', type: 'relationship' },
  { text: 'Who in this room knows you best? Test them with a question.', type: 'relationship' },
];

const SPICY_CHALLENGES: Challenge[] = [
  // questions (20+)
  { text: 'What is your biggest turn-on that you have never told anyone?', type: 'question' },
  { text: 'Describe your most passionate kiss in detail.', type: 'question' },
  { text: 'What is the boldest place you have ever been intimate?', type: 'question' },
  { text: 'What is a fantasy you have never acted on?', type: 'question' },
  { text: 'Have you ever had a crush on someone in this room? Who?', type: 'question' },
  { text: 'What is the most attractive feature of the person to your right?', type: 'question' },
  { text: 'Describe your ideal romantic evening in three sentences.', type: 'question' },
  { text: 'What is the most daring outfit you have ever worn?', type: 'question' },
  { text: 'Have you ever sent a risky text you immediately regretted?', type: 'question' },
  { text: 'What part of your body are you most confident about?', type: 'question' },
  { text: 'Describe the most romantic gesture anyone has ever made for you.', type: 'question' },
  { text: 'What is the biggest age gap you have dated?', type: 'question' },
  { text: 'If you could kiss anyone in this room right now, who?', type: 'question' },
  { text: 'What is the most seductive thing someone has ever said to you?', type: 'question' },
  { text: 'Rate your own kissing skills from 1-10 and justify it.', type: 'question' },
  { text: 'Have you ever been caught in a compromising situation? Spill.', type: 'question' },
  { text: 'What is the shortest time you have waited before your first kiss on a date?', type: 'question' },
  { text: 'What do you wear to bed? Be honest.', type: 'question' },
  { text: 'What is the most embarrassing thing that has happened to you during intimacy?', type: 'question' },
  { text: 'Who in this room has the most attractive voice?', type: 'question' },
  { text: 'What is the naughtiest thing on your bucket list?', type: 'question' },
  // dares (20+)
  { text: 'Give the person to your left a slow 10-second neck massage.', type: 'dare' },
  { text: 'Whisper something seductive into the ear of the person across from you.', type: 'dare' },
  { text: 'Kiss the person nearest to you on the cheek for at least 3 seconds.', type: 'dare' },
  { text: 'Let someone in the room trace a word on your back with their finger. Guess it.', type: 'dare' },
  { text: 'Do your most seductive dance move for 15 seconds.', type: 'dare' },
  { text: 'Hold hands with the person to your right and look into their eyes for 30 seconds.', type: 'dare' },
  { text: 'Give a one-minute back rub to the person the group chooses.', type: 'dare' },
  { text: 'Bite your lip and wink at every player in the room one by one.', type: 'dare' },
  { text: 'Let someone blindfold you and guess who is touching your hand.', type: 'dare' },
  { text: 'Remove one article of clothing. Your choice.', type: 'dare' },
  { text: 'Give the person across from you a forehead kiss.', type: 'dare' },
  { text: 'Text your crush or partner: "I cannot stop thinking about you." Screenshot it.', type: 'dare' },
  { text: 'Do your best impression of a romantic movie confession to someone here.', type: 'dare' },
  { text: 'Sit on the lap of the person the group picks for the rest of this round.', type: 'dare' },
  { text: 'Let the person to your left feed you something while blindfolded.', type: 'dare' },
  { text: 'Slow dance with the nearest person for 20 seconds, no music.', type: 'dare' },
  { text: 'Read aloud the last flirty text you sent or received.', type: 'dare' },
  { text: 'Demonstrate your signature kiss move on your own hand.', type: 'dare' },
  { text: 'Give a sensual compliment to each person in the room.', type: 'dare' },
  { text: 'Close your eyes and let someone apply lipstick or chapstick on you.', type: 'dare' },
  { text: 'Kiss the back of the hand of the person across from you.', type: 'dare' },
  // creative (10+)
  { text: 'Write a steamy 2-line love note and read it aloud to the person the group picks.', type: 'creative' },
  { text: 'Perform a dramatic soap opera love confession scene with the nearest player.', type: 'creative' },
  { text: 'Describe your ideal partner using only sounds and gestures, no words.', type: 'creative' },
  { text: 'Recreate the spaghetti kiss scene from Lady and the Tramp with someone here (use your imagination).', type: 'creative' },
  { text: 'Narrate an imaginary romantic movie trailer starring you and the person to your right.', type: 'creative' },
  { text: 'Create a flirty pickup line on the spot and deliver it to the person across from you.', type: 'creative' },
  { text: 'Choreograph a 15-second couples dance with the nearest player. Perform it.', type: 'creative' },
  { text: 'Paint a portrait of passion using only 3 words. Explain your art.', type: 'creative' },
  { text: 'Compose a 4-line love poem about the person to your left and recite it dramatically.', type: 'creative' },
  { text: 'Act out a telenovela breakup scene, then a makeup scene, in 30 seconds.', type: 'creative' },
  // relationship (10+)
  { text: 'What is the most intimate non-physical moment you have shared with someone?', type: 'relationship' },
  { text: 'Describe the moment you knew you were deeply attracted to your last partner.', type: 'relationship' },
  { text: 'What is your love language and how do you want it expressed?', type: 'relationship' },
  { text: 'What is the most vulnerable thing a partner has ever shared with you?', type: 'relationship' },
  { text: 'Who in this room would you go on a date with if you were single?', type: 'relationship' },
  { text: 'Have you ever fallen for a close friend? What happened?', type: 'relationship' },
  { text: 'What is the most romantic thing you have ever done for someone?', type: 'relationship' },
  { text: 'Describe your first kiss in vivid detail.', type: 'relationship' },
  { text: 'What physical feature do you notice first on a potential partner?', type: 'relationship' },
  { text: 'If you had to marry someone in this room, who and why?', type: 'relationship' },
  { text: 'What is the deepest emotional connection you have ever felt?', type: 'relationship' },
  { text: 'What is the boldest thing you have ever done to get someone to notice you?', type: 'relationship' },
];

const STORAGE_KEY = 'kasuku-stb-custom';

function loadCustom(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s: unknown) => typeof s === 'string' && s.trim()) : [];
  } catch { return []; }
}

function saveCustom(items: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/* ── helpers ── */
function pickRandom<T>(arr: T[], used: Set<number>): { item: T; idx: number } | null {
  const available = arr.map((item, idx) => ({ item, idx })).filter(({ idx }) => !used.has(idx));
  if (available.length === 0) return null;
  const pick = available[Math.floor(Math.random() * available.length)];
  return pick;
}

function typeLabel(t: Challenge['type']): string {
  switch (t) {
    case 'question': return 'Question';
    case 'dare': return 'Dare';
    case 'creative': return 'Creative';
    case 'relationship': return 'Relationship';
  }
}

function typeColor(t: Challenge['type']): string {
  switch (t) {
    case 'question': return C.blue;
    case 'dare': return C.red;
    case 'creative': return C.purple;
    case 'relationship': return C.pink;
  }
}

/* ── component ── */
export default function SpinTheBottle({ onBack, onGameEnd }: {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}) {
  const startTime = useRef(Date.now());

  /* state */
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<GameMode>('friends');
  const [players, setPlayers] = useState<Player[]>([
    { name: '', avatar: AVATARS[0], spins: 0, skipped: 0, completed: 0, boldest: 0 },
    { name: '', avatar: AVATARS[1], spins: 0, skipped: 0, completed: 0, boldest: 0 },
  ]);
  const [customItems, setCustomItems] = useState<string[]>(loadCustom);
  const [customDraft, setCustomDraft] = useState('');

  const [bottleAngle, setBottleAngle] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetPlayer, setTargetPlayer] = useState<number | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [passesLeft, setPassesLeft] = useState(3);
  const [roundCount, setRoundCount] = useState(0);
  const [spinnerIdx, setSpinnerIdx] = useState(0);

  const usedFriends = useRef<Set<number>>(new Set());
  const usedSpicy = useRef<Set<number>>(new Set());
  const usedCustom = useRef<Set<number>>(new Set());
  const animFrame = useRef<number>(0);

  /* derived */
  const canStart = useMemo(() => {
    const namedPlayers = players.filter(p => p.name.trim());
    if (namedPlayers.length < 2) return false;
    if (mode === 'custom' && customItems.length === 0) return false;
    return true;
  }, [players, mode, customItems]);

  /* player management */
  const addPlayer = useCallback(() => {
    if (players.length >= 8) return;
    const usedAvatars = new Set(players.map(p => p.avatar));
    const next = AVATARS.find(a => !usedAvatars.has(a)) || AVATARS[0];
    setPlayers(prev => [...prev, { name: '', avatar: next, spins: 0, skipped: 0, completed: 0, boldest: 0 }]);
    sfxTap();
  }, [players]);

  const removePlayer = useCallback((idx: number) => {
    if (players.length <= 2) return;
    setPlayers(prev => prev.filter((_, i) => i !== idx));
    sfxTap();
  }, [players]);

  const updateName = useCallback((idx: number, name: string) => {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, name } : p));
  }, []);

  /* custom question management */
  const addCustom = useCallback(() => {
    const trimmed = customDraft.trim();
    if (!trimmed) return;
    const updated = [...customItems, trimmed];
    setCustomItems(updated);
    saveCustom(updated);
    setCustomDraft('');
    sfxTap();
  }, [customDraft, customItems]);

  const removeCustom = useCallback((idx: number) => {
    const updated = customItems.filter((_, i) => i !== idx);
    setCustomItems(updated);
    saveCustom(updated);
    sfxTap();
  }, [customItems]);

  /* get challenge from pool */
  const getChallenge = useCallback((): Challenge | null => {
    if (mode === 'custom') {
      const customChallenges: Challenge[] = customItems.map(text => ({ text, type: 'dare' as const }));
      const pick = pickRandom(customChallenges, usedCustom.current);
      if (!pick) {
        usedCustom.current.clear();
        return pickRandom(customChallenges, usedCustom.current)?.item ?? null;
      }
      usedCustom.current.add(pick.idx);
      return pick.item;
    }

    const pool = mode === 'friends' ? FRIENDS_CHALLENGES : SPICY_CHALLENGES;
    const used = mode === 'friends' ? usedFriends : usedSpicy;
    const pick = pickRandom(pool, used.current);
    if (!pick) {
      used.current.clear();
      return pickRandom(pool, used.current)?.item ?? null;
    }
    used.current.add(pick.idx);
    return pick.item;
  }, [mode, customItems]);

  /* spin bottle */
  const spinBottle = useCallback(() => {
    if (isSpinning) return;
    sfxTap();
    setIsSpinning(true);
    setTargetPlayer(null);
    setCurrentChallenge(null);

    const activePlayers = players.filter(p => p.name.trim());
    const target = Math.floor(Math.random() * activePlayers.length);
    const targetAngleBase = (target / activePlayers.length) * 360;
    const extraSpins = 3 + Math.floor(Math.random() * 4);
    const finalAngle = bottleAngle + extraSpins * 360 + targetAngleBase + Math.random() * (360 / activePlayers.length);

    const duration = 3000 + Math.random() * 1500;
    const startAngle = bottleAngle;
    const startTs = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTs;
      const progress = Math.min(elapsed / duration, 1);
      // cubic ease-out for deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + (finalAngle - startAngle) * eased;
      setBottleAngle(currentAngle);

      if (progress < 1) {
        animFrame.current = requestAnimationFrame(animate);
      } else {
        setBottleAngle(finalAngle);
        setIsSpinning(false);

        const realTarget = players.findIndex(p => p.name.trim() === activePlayers[target].name);
        setTargetPlayer(realTarget);

        const challenge = getChallenge();
        setCurrentChallenge(challenge);

        setPlayers(prev => prev.map((p, i) =>
          i === realTarget ? { ...p, spins: p.spins + 1 } : p
        ));
        setRoundCount(r => r + 1);

        sfxReveal();
      }
    };

    animFrame.current = requestAnimationFrame(animate);
  }, [isSpinning, players, bottleAngle, getChallenge]);

  /* complete challenge */
  const completeChallenge = useCallback(() => {
    if (targetPlayer === null) return;
    sfxCorrect();
    setPlayers(prev => prev.map((p, i) =>
      i === targetPlayer ? { ...p, completed: p.completed + 1, boldest: p.boldest + 1 } : p
    ));
    setPhase('spinning');
    setTargetPlayer(null);
    setCurrentChallenge(null);
    setSpinnerIdx(prev => (prev + 1) % players.filter(p => p.name.trim()).length);
  }, [targetPlayer, players]);

  /* skip challenge */
  const skipChallenge = useCallback(() => {
    if (targetPlayer === null || passesLeft <= 0) return;
    sfxTap();
    setPassesLeft(p => p - 1);
    setPlayers(prev => prev.map((p, i) =>
      i === targetPlayer ? { ...p, skipped: p.skipped + 1 } : p
    ));
    setPhase('spinning');
    setTargetPlayer(null);
    setCurrentChallenge(null);
    setSpinnerIdx(prev => (prev + 1) % players.filter(p => p.name.trim()).length);
  }, [targetPlayer, passesLeft, players]);

  /* start game */
  const startGame = useCallback(() => {
    if (!canStart) return;
    sfxLevelUp();
    startTime.current = Date.now();
    setPhase('spinning');
    setRoundCount(0);
    setPassesLeft(3);
    usedFriends.current.clear();
    usedSpicy.current.clear();
    usedCustom.current.clear();
  }, [canStart]);

  /* end game */
  const endGame = useCallback(() => {
    sfxGameOver();
    setPhase('summary');
  }, []);

  /* onGameEnd effect */
  useEffect(() => {
    if (phase !== 'summary' || !onGameEnd) return;
    const totalCompleted = players.reduce((s, p) => s + p.completed, 0);
    const totalSpins = players.reduce((s, p) => s + p.spins, 0);
    const accuracy = totalSpins > 0 ? Math.round((totalCompleted / totalSpins) * 100) : 0;
    onGameEnd({
      score: totalCompleted * 10,
      accuracy,
      level: 1,
      maxScore: totalSpins * 10,
      timeMs: Date.now() - startTime.current,
    });
  }, [phase, onGameEnd, players]);

  /* cleanup */
  useEffect(() => () => { cancelAnimationFrame(animFrame.current); }, []);

  /* ── styles ── */
  const wrap: CSSProperties = {
    minHeight: '100vh', background: C.bg, color: C.text,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex', flexDirection: 'column',
  };
  const topBar: CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
    borderBottom: `1px solid ${C.border}`,
  };
  const backBtn: CSSProperties = {
    background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
    fontSize: 22, padding: 4, lineHeight: 1,
  };
  const content: CSSProperties = {
    flex: 1, padding: '20px 20px 40px', maxWidth: 600, margin: '0 auto', width: '100%',
  };

  /* ── SETUP PHASE ── */
  if (phase === 'setup') {
    return (
      <div style={wrap}>
        <div style={topBar}>
          <button style={backBtn} onClick={onBack} aria-label="Back">{'←'}</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Spin the Bottle</div>
            <div style={{ fontSize: 12, color: C.muted }}>Zungusha Chupa</div>
          </div>
        </div>
        <div style={content}>
          {/* Mode selection */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.muted }}>
              MODE / HALI
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(Object.keys(MODE_META) as GameMode[]).map(m => {
                const meta = MODE_META[m];
                const active = mode === m;
                return (
                  <button
                    key={m}
                    onClick={() => { setMode(m); sfxTap(); }}
                    style={{
                      flex: '1 1 0',
                      minWidth: 100,
                      padding: '14px 12px',
                      borderRadius: RADIUS.md,
                      border: `2px solid ${active ? meta.color : C.border}`,
                      background: active ? meta.color + '18' : C.card,
                      color: active ? meta.color : C.text,
                      cursor: 'pointer',
                      transition: `all ${MOTION.fast}`,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{meta.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{meta.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Players */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.muted }}>
              PLAYERS / WACHEZAJI ({players.length}/8)
            </div>
            {players.map((p, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                background: C.card, borderRadius: RADIUS.md, padding: '10px 14px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: RADIUS.full,
                  background: PLAYER_COLORS[i] + '22',
                  border: `2px solid ${PLAYER_COLORS[i]}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {AVATAR_EMOJI[p.avatar]}
                </div>
                <input
                  type="text"
                  value={p.name}
                  onChange={e => updateName(i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  maxLength={20}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: C.text, fontSize: 15, padding: 0,
                  }}
                />
                {players.length > 2 && (
                  <button
                    onClick={() => removePlayer(i)}
                    style={{
                      background: 'none', border: 'none', color: C.dim, cursor: 'pointer',
                      fontSize: 18, padding: 4, lineHeight: 1,
                    }}
                    aria-label="Remove"
                  >{'×'}</button>
                )}
              </div>
            ))}
            {players.length < 8 && (
              <button
                onClick={addPlayer}
                style={{
                  width: '100%', padding: '12px', borderRadius: RADIUS.md,
                  border: `1px dashed ${C.dim}`, background: 'transparent',
                  color: C.muted, cursor: 'pointer', fontSize: 14,
                  transition: `all ${MOTION.fast}`,
                }}
              >
                + Add Player
              </button>
            )}
          </div>

          {/* Custom questions (if custom mode) */}
          {mode === 'custom' && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: C.muted }}>
                CUSTOM QUESTIONS / MASWALI ({customItems.length})
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  value={customDraft}
                  onChange={e => setCustomDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustom()}
                  placeholder="Type a question or dare..."
                  style={{
                    flex: 1, background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: RADIUS.sm, padding: '10px 14px', color: C.text,
                    fontSize: 14, outline: 'none',
                  }}
                />
                <button
                  onClick={addCustom}
                  style={{
                    ...solidBtn(C.amber),
                    padding: '10px 18px', borderRadius: RADIUS.sm, cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, border: 'none',
                  }}
                >+</button>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {customItems.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                    padding: '8px 12px', background: C.glass, borderRadius: RADIUS.sm,
                    fontSize: 13,
                  }}>
                    <span style={{ flex: 1, color: C.text }}>{item}</span>
                    <button
                      onClick={() => removeCustom(i)}
                      style={{
                        background: 'none', border: 'none', color: C.dim,
                        cursor: 'pointer', fontSize: 16, padding: 2, lineHeight: 1,
                      }}
                    >{'×'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={startGame}
            disabled={!canStart}
            style={{
              ...solidBtn(MODE_META[mode].color),
              width: '100%', padding: '16px', borderRadius: RADIUS.md,
              fontSize: 16, fontWeight: 600, border: 'none', cursor: canStart ? 'pointer' : 'not-allowed',
              opacity: canStart ? 1 : 0.4,
              transition: `all ${MOTION.fast}`,
            }}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  /* ── SPINNING / CHALLENGE PHASE ── */
  if (phase === 'spinning' || phase === 'challenge') {
    const activePlayers = players.filter(p => p.name.trim());
    const currentSpinner = activePlayers[spinnerIdx % activePlayers.length];
    const currentSpinnerGlobalIdx = players.findIndex(p => p.name === currentSpinner.name);

    return (
      <div style={wrap}>
        <div style={topBar}>
          <button style={backBtn} onClick={onBack} aria-label="Back">{'←'}</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              Round {roundCount + 1}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>
              {currentSpinner.name} spins
              {' '}{'·'}{' '}Passes: {passesLeft}
            </div>
          </div>
          <button
            onClick={endGame}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.sm,
              color: C.muted, padding: '6px 14px', fontSize: 12, cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            End Game
          </button>
        </div>

        <div style={content}>
          {/* Bottle circle */}
          <div style={{ position: 'relative', width: 300, height: 300, margin: '0 auto 24px' }}>
            {/* Player positions around the circle */}
            {activePlayers.map((p, i) => {
              const angle = (i / activePlayers.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 130;
              const x = 150 + Math.cos(angle) * radius;
              const y = 150 + Math.sin(angle) * radius;
              const globalIdx = players.findIndex(pl => pl.name === p.name);
              const isTarget = targetPlayer !== null && globalIdx === targetPlayer;

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: x - 22, top: y - 22,
                    width: 44, height: 44,
                    borderRadius: RADIUS.full,
                    background: isTarget ? PLAYER_COLORS[globalIdx] + '33' : C.card,
                    border: `2px solid ${isTarget ? PLAYER_COLORS[globalIdx] : C.border}`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    transition: `all ${MOTION.med}`,
                    boxShadow: isTarget ? `0 0 20px ${PLAYER_COLORS[globalIdx]}44` : 'none',
                    zIndex: isTarget ? 2 : 1,
                  }}
                >
                  <div style={{ fontSize: 16, lineHeight: 1 }}>{AVATAR_EMOJI[p.avatar]}</div>
                  <div style={{
                    position: 'absolute', bottom: -18, fontSize: 10, fontWeight: 600,
                    color: isTarget ? PLAYER_COLORS[globalIdx] : C.muted,
                    whiteSpace: 'nowrap', maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis',
                    textAlign: 'center',
                  }}>
                    {p.name}
                  </div>
                </div>
              );
            })}

            {/* SVG Bottle */}
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              style={{
                position: 'absolute',
                left: 110, top: 110,
                transform: `rotate(${bottleAngle}deg)`,
                transition: isSpinning ? 'none' : `transform ${MOTION.med}`,
                zIndex: 3,
              }}
            >
              {/* bottle body */}
              <rect x="34" y="30" width="12" height="32" rx="3" fill={C.teal} />
              {/* bottle neck */}
              <rect x="37" y="14" width="6" height="18" rx="2" fill={C.teal} />
              {/* bottle cap */}
              <rect x="36" y="8" width="8" height="8" rx="2" fill={PLAYER_COLORS[currentSpinnerGlobalIdx]} />
              {/* bottle base */}
              <rect x="32" y="58" width="16" height="6" rx="2" fill={C.teal} />
              {/* pointer indicator */}
              <polygon points="40,2 36,10 44,10" fill={PLAYER_COLORS[currentSpinnerGlobalIdx]} />
            </svg>
          </div>

          {/* Spin button or challenge display */}
          {!currentChallenge && !isSpinning && (
            <button
              onClick={spinBottle}
              style={{
                ...solidBtn(MODE_META[mode].color),
                display: 'block', width: '100%', maxWidth: 280, margin: '40px auto 0',
                padding: '16px 24px', borderRadius: RADIUS.lg, fontSize: 18,
                fontWeight: 700, border: 'none', cursor: 'pointer',
                transition: `all ${MOTION.fast}`,
              }}
            >
              Zungusha! -- Spin!
            </button>
          )}

          {isSpinning && (
            <div style={{
              textAlign: 'center', marginTop: 40, fontSize: 16, color: C.muted,
              fontWeight: 600,
            }}>
              Spinning...
            </div>
          )}

          {/* Challenge card */}
          {currentChallenge && targetPlayer !== null && (
            <div style={{
              marginTop: 32,
              background: C.card,
              border: `1px solid ${PLAYER_COLORS[targetPlayer]}44`,
              borderRadius: RADIUS.lg,
              padding: '24px 20px',
              animation: 'fadeIn 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: RADIUS.full,
                  background: PLAYER_COLORS[targetPlayer] + '22',
                  border: `2px solid ${PLAYER_COLORS[targetPlayer]}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {AVATAR_EMOJI[players[targetPlayer].avatar]}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: PLAYER_COLORS[targetPlayer] }}>
                    {players[targetPlayer].name}
                  </div>
                  <div style={{
                    fontSize: 11, color: typeColor(currentChallenge.type),
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
                  }}>
                    {typeLabel(currentChallenge.type)}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 17, lineHeight: 1.6, fontWeight: 500, marginBottom: 24, color: C.text }}>
                {currentChallenge.text}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={completeChallenge}
                  style={{
                    ...solidBtn(C.green),
                    flex: 1, padding: '14px', borderRadius: RADIUS.md,
                    fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
                  }}
                >
                  Done!
                </button>
                <button
                  onClick={skipChallenge}
                  disabled={passesLeft <= 0}
                  style={{
                    flex: 1, padding: '14px', borderRadius: RADIUS.md,
                    fontSize: 15, fontWeight: 600, border: `1px solid ${C.border}`,
                    background: C.card, color: passesLeft > 0 ? C.muted : C.dim,
                    cursor: passesLeft > 0 ? 'pointer' : 'not-allowed',
                    opacity: passesLeft > 0 ? 1 : 0.4,
                  }}
                >
                  Skip ({passesLeft})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── SUMMARY PHASE ── */
  const activePlayers = players.filter(p => p.name.trim());
  const totalCompleted = activePlayers.reduce((s, p) => s + p.completed, 0);
  const totalSkipped = activePlayers.reduce((s, p) => s + p.skipped, 0);
  const mostSpins = [...activePlayers].sort((a, b) => b.spins - a.spins)[0];
  const boldest = [...activePlayers].sort((a, b) => b.boldest - a.boldest)[0];
  const mostSkipped = [...activePlayers].sort((a, b) => b.skipped - a.skipped)[0];

  const awards: { title: string; swTitle: string; player: Player; color: string }[] = [];
  if (boldest && boldest.boldest > 0) {
    awards.push({ title: 'Boldest Player', swTitle: 'Jasiri Zaidi', player: boldest, color: C.red });
  }
  if (mostSpins && mostSpins.spins > 0) {
    awards.push({ title: 'Bottle Magnet', swTitle: 'Sumaku ya Chupa', player: mostSpins, color: C.teal });
  }
  if (mostSkipped && mostSkipped.skipped > 0) {
    awards.push({ title: 'Most Cautious', swTitle: 'Mwangalifu', player: mostSkipped, color: C.amber });
  }

  return (
    <div style={wrap}>
      <div style={topBar}>
        <button style={backBtn} onClick={onBack} aria-label="Back">{'←'}</button>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Game Over / Mwisho</div>
      </div>
      <div style={content}>
        {/* Stats overview */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28,
        }}>
          {[
            { label: 'Rounds', value: roundCount, color: C.blue },
            { label: 'Completed', value: totalCompleted, color: C.green },
            { label: 'Skipped', value: totalSkipped, color: C.amber },
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.card, borderRadius: RADIUS.md, padding: '16px 12px',
              border: `1px solid ${C.border}`, textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Awards */}
        {awards.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Awards
            </div>
            {awards.map((award, i) => {
              const globalIdx = players.findIndex(p => p.name === award.player.name);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10,
                  background: award.color + '0d', borderRadius: RADIUS.md,
                  padding: '14px 16px', border: `1px solid ${award.color}33`,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: RADIUS.full,
                    background: award.color + '22', border: `2px solid ${award.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {AVATAR_EMOJI[award.player.avatar]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: award.color }}>
                      {award.title}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>{award.swTitle}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: PLAYER_COLORS[globalIdx >= 0 ? globalIdx : 0] }}>
                    {award.player.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Player breakdown */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Player Stats / Takwimu
          </div>
          {activePlayers.map((p, i) => {
            const globalIdx = players.findIndex(pl => pl.name === p.name);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8,
                background: C.card, borderRadius: RADIUS.md, padding: '12px 16px',
                border: `1px solid ${C.border}`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: RADIUS.full,
                  background: PLAYER_COLORS[globalIdx] + '22',
                  border: `2px solid ${PLAYER_COLORS[globalIdx]}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {AVATAR_EMOJI[p.avatar]}
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.muted }}>
                  <span>Spins: <span style={{ color: C.teal, fontWeight: 600 }}>{p.spins}</span></span>
                  <span>Done: <span style={{ color: C.green, fontWeight: 600 }}>{p.completed}</span></span>
                  <span>Skip: <span style={{ color: C.amber, fontWeight: 600 }}>{p.skipped}</span></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setPhase('setup');
              setPlayers(prev => prev.map(p => ({ ...p, spins: 0, skipped: 0, completed: 0, boldest: 0 })));
              setRoundCount(0);
              setPassesLeft(3);
              setTargetPlayer(null);
              setCurrentChallenge(null);
              setBottleAngle(0);
              setSpinnerIdx(0);
              sfxTap();
            }}
            style={{
              ...solidBtn(MODE_META[mode].color),
              flex: 1, padding: '14px', borderRadius: RADIUS.md,
              fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >
            Play Again
          </button>
          <button
            onClick={onBack}
            style={{
              flex: 1, padding: '14px', borderRadius: RADIUS.md,
              fontSize: 15, fontWeight: 600, border: `1px solid ${C.border}`,
              background: C.card, color: C.muted, cursor: 'pointer',
            }}
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
