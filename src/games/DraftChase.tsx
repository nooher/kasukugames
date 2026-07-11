import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Trophy, Zap, Target, Brain, Calculator, Users, ChevronRight, RotateCcw, Type, Timer, Grid3X3, Link } from 'lucide-react';
import { RADIUS, MOTION, solidBtn, COLOR } from '../lib/design';
import { sfxTap, sfxCorrect, sfxWrong, sfxLevelUp, sfxGameOver, sfxCountdown, sfxCountdownGo, sfxScore } from '../lib/sfx';
import { type Particle, type ScorePop, correctBurst, wrongBurst, confettiBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle } from '../lib/vfx';

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
  accent: COLOR.sapphire,
  p1: COLOR.emerald,
  p2: COLOR.amber,
  win: COLOR.emerald,
  lose: COLOR.rose,
} as const;

const glass = (accent?: string): React.CSSProperties => ({
  background: C.card,
  border: `1px solid ${accent ? accent + '30' : C.border}`,
  borderRadius: RADIUS.lg,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.5)`,
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Phase =
  | 'setup'
  | 'round-intro'
  | 'playing'
  | 'draft-result'
  | 'pass-phone'
  | 'chase-result'
  | 'round-result'
  | 'game-over';

type ChallengeType = 'speed-tap' | 'color-match' | 'number-memory' | 'quick-math' | 'speed-type' | 'reaction-time' | 'pattern-match' | 'word-chain';

interface RoundResult {
  challenge: ChallengeType;
  drafterName: string;
  chaserName: string;
  draftScore: number;
  chaseScore: number;
  winner: 'drafter' | 'chaser' | 'tie';
}

/* ------------------------------------------------------------------ */
/*  Challenge definitions                                              */
/* ------------------------------------------------------------------ */
const CHALLENGE_INFO: Record<ChallengeType, { name: string; desc: string; icon: React.ReactNode }> = {
  'speed-tap': { name: 'Speed Tap', desc: 'Tap as fast as you can in 5 seconds!', icon: <Zap size={28} /> },
  'color-match': { name: 'Color Match', desc: 'Tap the word whose INK color is named — Stroop effect!', icon: <Target size={28} /> },
  'number-memory': { name: 'Number Memory', desc: 'Memorize the number sequence, then type it back!', icon: <Brain size={28} /> },
  'quick-math': { name: 'Quick Math', desc: 'Solve arithmetic problems in 10 seconds!', icon: <Calculator size={28} /> },
  'speed-type': { name: 'Speed Type', desc: 'Type the word as fast and accurately as you can!', icon: <Type size={28} /> },
  'reaction-time': { name: 'Reaction Time', desc: 'Wait for green, then tap as fast as possible!', icon: <Timer size={28} /> },
  'pattern-match': { name: 'Pattern Match', desc: 'Memorize the pattern, then reproduce it!', icon: <Grid3X3 size={28} /> },
  'word-chain': { name: 'Word Chain', desc: 'Type as many words as you can starting with the given letter!', icon: <Link size={28} /> },
};

const CHALLENGES: ChallengeType[] = ['speed-tap', 'color-match', 'number-memory', 'quick-math', 'speed-type', 'reaction-time', 'pattern-match', 'word-chain'];

const TRASH_TALK = {
  destroyed: [
    'DESTROYED!', 'OBLITERATED!', 'NOT EVEN CLOSE!', 'ABSOLUTE CARNAGE!',
    'DEMOLISHED!', 'ANNIHILATED!', 'STEAMROLLED!', 'BLOWN AWAY!',
    'NO CONTEST!', 'UTTERLY CRUSHED!', 'RUNAWAY ROUT!', 'GAME OVER, MAN!',
  ],
  solid: [
    'Solid win!', 'Clean victory!', 'Nicely done!', 'Dominant!',
    'Well played!', 'Strong showing!', 'Comfortable win!', 'That is the way!',
    'Convincing stuff!', 'Textbook execution!', 'In control throughout!', 'A cut above!',
  ],
  close: [
    'By a hair!', 'Photo finish!', 'Squeaked by!', 'Nail-biter!',
    'Right at the wire!', 'Down to the wire!', 'Too close to call!', 'Barely edged it!',
    'Heart-stopper!', 'Skin of the teeth!', 'A whisker apart!', 'Clutch finish!',
  ],
  tie: [
    'Dead heat!', 'Perfectly matched!', 'Mirror image!', 'Identical!',
    'Neck and neck!', 'Even Steven!', 'All square!', 'Dead level!',
    'Two of a kind!', 'Locked together!', 'No daylight between them!', 'Stalemate!',
  ],
};

function getTrashTalk(diff: number): string {
  if (diff === 0) return pick(TRASH_TALK.tie);
  if (diff >= 5) return pick(TRASH_TALK.destroyed);
  if (diff >= 2) return pick(TRASH_TALK.solid);
  return pick(TRASH_TALK.close);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickChallenge(used: ChallengeType[]): ChallengeType {
  const available = CHALLENGES.filter(c => !used.includes(c));
  if (available.length === 0) return pick(CHALLENGES);
  return pick(available);
}

/* ------------------------------------------------------------------ */
/*  Stroop data                                                        */
/* ------------------------------------------------------------------ */
const STROOP_COLORS = [
  { name: 'RED', hex: '#ef4444' },
  { name: 'BLUE', hex: '#3b82f6' },
  { name: 'GREEN', hex: '#22c55e' },
  { name: 'YELLOW', hex: '#eab308' },
  { name: 'PURPLE', hex: '#a855f7' },
  { name: 'ORANGE', hex: '#f97316' },
];

function generateStroopPrompt(): { word: string; inkColor: { name: string; hex: string }; options: { name: string; hex: string }[] } {
  const inkColor = pick(STROOP_COLORS);
  let word: string;
  do {
    word = pick(STROOP_COLORS).name;
  } while (word === inkColor.name);

  const others = STROOP_COLORS.filter(c => c.name !== inkColor.name);
  const shuffled = [inkColor, pick(others), pick(others.filter(o => o.name !== pick(others).name))]
    .filter((v, i, a) => a.findIndex(x => x.name === v.name) === i);
  while (shuffled.length < 3) {
    const extra = pick(STROOP_COLORS.filter(c => !shuffled.find(s => s.name === c.name)));
    shuffled.push(extra);
  }
  const options = shuffled.sort(() => Math.random() - 0.5);
  return { word, inkColor, options };
}

/* ------------------------------------------------------------------ */
/*  Speed-type data                                                    */
/* ------------------------------------------------------------------ */
const SPEED_TYPE_WORDS = [
  'velocity', 'quantum', 'python', 'rocket', 'galaxy',
  'phoenix', 'matrix', 'cipher', 'shadow', 'turbo',
  'blitz', 'prism', 'nexus', 'orbit', 'ember',
  'swift', 'coral', 'frost', 'spark', 'drift',
  'lunar', 'solar', 'viper', 'storm', 'blaze',
  'crystal', 'dragon', 'falcon', 'horizon', 'zenith',
  'thunder', 'comet', 'meteor', 'nebula', 'plasma',
  'photon', 'neutron', 'proton', 'vortex', 'cosmos',
  'stellar', 'pulsar', 'quasar', 'aurora', 'eclipse',
  'gravity', 'magnet', 'circuit', 'binary', 'pixel',
  'vector', 'kernel', 'syntax', 'cursor', 'packet',
  'module', 'thread', 'socket', 'buffer', 'cache',
  'jaguar', 'panther', 'cheetah', 'cobra', 'raven',
  'osprey', 'marlin', 'badger', 'walrus', 'lizard',
  'ranger', 'hunter', 'sniper', 'pilot', 'ninja',
  'samurai', 'ronin', 'katana', 'saber', 'arrow',
  'canyon', 'summit', 'tundra', 'glacier', 'meadow',
  'harbor', 'meridian', 'compass', 'beacon', 'anchor',
];

/* ------------------------------------------------------------------ */
/*  Pattern-match data                                                 */
/* ------------------------------------------------------------------ */
function generatePattern(difficulty: number): boolean[] {
  const cellCount = 9;
  const highlighted = Math.min(2 + difficulty, 7);
  const grid = Array(cellCount).fill(false);
  const indices: number[] = [];
  while (indices.length < highlighted) {
    const idx = Math.floor(Math.random() * cellCount);
    if (!indices.includes(idx)) {
      indices.push(idx);
      grid[idx] = true;
    }
  }
  return grid;
}

/* ------------------------------------------------------------------ */
/*  Word-chain data                                                    */
/* ------------------------------------------------------------------ */
const WORD_CHAIN_LETTERS = 'ABCDEFGHIJKLMNOPRSTW'.split('');

const COMMON_WORDS: Record<string, string[]> = {
  A: ['ace','act','add','age','ago','aid','aim','air','all','and','ant','any','ape','arc','are','ark','arm','art','ask','ate'],
  B: ['bad','bag','ban','bar','bat','bay','bed','bee','bet','bid','big','bin','bit','bow','box','boy','bud','bug','bun','bus','but','buy'],
  C: ['cab','can','cap','car','cat','cop','cow','cry','cub','cup','cut'],
  D: ['dad','dam','day','den','dew','did','dig','dim','dip','dog','dot','dry','dub','dud','due','dug','dun','duo','dye'],
  E: ['ear','eat','eel','egg','ego','elm','emu','end','era','eve','ewe','eye'],
  F: ['fad','fan','far','fat','fax','fed','fee','few','fig','fin','fir','fit','fix','fly','foe','fog','for','fox','fry','fun','fur'],
  G: ['gag','gal','gap','gas','gem','get','gig','gin','gnu','god','got','gum','gun','gut','guy','gym'],
  H: ['had','ham','has','hat','hay','hen','her','hew','hex','hid','him','hip','his','hit','hob','hog','hop','hot','how','hub','hue','hug','hum','hut'],
  I: ['ice','icy','ill','imp','ink','inn','ion','ire','irk','its','ivy'],
  J: ['jab','jag','jam','jar','jaw','jay','jet','jig','job','jog','jot','joy','jug','jut'],
  K: ['keg','ken','key','kid','kin','kit'],
  L: ['lab','lad','lag','lap','law','lay','led','leg','let','lid','lie','lip','lit','log','lot','low','lug'],
  M: ['mad','man','map','mar','mat','maw','may','men','met','mid','mix','mob','mod','mop','mow','mud','mug','mum'],
  N: ['nab','nag','nap','net','new','nil','nip','nit','nod','nor','not','now','nub','nun','nut'],
  O: ['oak','oar','oat','odd','ode','off','oft','ohm','oil','old','one','opt','orb','ore','our','out','owe','owl','own'],
  P: ['pad','pal','pan','par','pat','paw','pay','pea','peg','pen','per','pet','pie','pig','pin','pit','ply','pod','pop','pot','pow','pro','pry','pub','pug','pun','pup','pus','put'],
  R: ['rag','ram','ran','rap','rat','raw','ray','red','ref','rib','rid','rig','rim','rip','rob','rod','roe','rot','row','rub','rug','rum','run','rut','rye'],
  S: ['sac','sad','sag','sap','sat','saw','say','sea','set','sew','shy','sin','sip','sir','sis','sit','six','ski','sky','sly','sob','sod','son','sop','sot','sow','soy','spa','spy','sub','sue','sum','sun','sup'],
  T: ['tab','tad','tag','tan','tap','tar','tax','tea','ten','the','thy','tie','tin','tip','toe','ton','too','top','tow','toy','try','tub','tug','tun','two'],
  W: ['wad','wag','war','was','wax','way','web','wed','wet','who','why','wig','win','wit','woe','wok','won','woo','wow'],
};

function isValidWord(word: string, letter: string): boolean {
  if (word.length < 3) return false;
  if (word[0].toUpperCase() !== letter.toUpperCase()) return false;
  const known = COMMON_WORDS[letter.toUpperCase()];
  if (known && known.includes(word.toLowerCase())) return true;
  if (word.length >= 4) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/*  Mini-challenge components                                          */
/* ------------------------------------------------------------------ */
function SpeedTapChallenge({ onComplete }: { onComplete: (score: number) => void }) {
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [started, setStarted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (started && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [started, timeLeft]);

  useEffect(() => {
    if (started && timeLeft === 0) {
      const timer = setTimeout(() => onComplete(taps), 400);
      return () => clearTimeout(timer);
    }
  }, [started, timeLeft, taps, onComplete]);

  const handleTap = () => {
    if (!started) setStarted(true);
    if (timeLeft > 0) { sfxTap(); setTaps(t => t + 1); }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, fontWeight: 600, color: C.text, marginBottom: 8 }}>{taps}</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
        {!started ? 'TAP TO START!' : timeLeft > 0 ? `${timeLeft}s remaining` : 'TIME!'}
      </div>
      <button
        onClick={handleTap}
        disabled={started && timeLeft === 0}
        style={{
          ...solidBtn(COLOR.sapphire),
          width: 180, height: 180, borderRadius: '50%',
          fontSize: 20, justifyContent: 'center',
          opacity: (started && timeLeft === 0) ? 0.4 : 1,
          transform: taps > 0 ? 'scale(0.95)' : 'scale(1)',
          transition: `transform 60ms ease`,
        }}
      >
        {!started ? 'TAP!' : timeLeft > 0 ? 'TAP!' : 'DONE'}
      </button>
    </div>
  );
}

function ColorMatchChallenge({ onComplete }: { onComplete: (score: number) => void }) {
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [prompt, setPrompt] = useState(generateStroopPrompt);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const totalRounds = 10;

  const handlePick = (colorName: string) => {
    if (round >= totalRounds) return;
    const correct = colorName === prompt.inkColor.name;
    if (correct) { sfxCorrect(); setScore(s => s + 1); } else { sfxWrong(); }
    setFlash(correct ? 'correct' : 'wrong');
    setTimeout(() => {
      setFlash(null);
      if (round + 1 >= totalRounds) {
        onComplete(score + (correct ? 1 : 0));
      } else {
        setRound(r => r + 1);
        setPrompt(generateStroopPrompt());
      }
    }, 300);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{round + 1} / {totalRounds}</div>
      <div style={{
        fontSize: 56, fontWeight: 700, color: prompt.inkColor.hex, marginBottom: 32,
        textShadow: `0 0 20px ${prompt.inkColor.hex}40`,
        transition: `color ${MOTION.snap}`,
      }}>
        {prompt.word}
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>What COLOR is the ink?</div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {prompt.options.map(opt => (
          <button
            key={opt.name}
            onClick={() => handlePick(opt.name)}
            style={{
              ...solidBtn(opt.hex),
              minWidth: 90, justifyContent: 'center',
              boxShadow: flash === 'correct' ? `0 0 20px ${COLOR.emerald}80` :
                flash === 'wrong' ? `0 0 20px ${COLOR.rose}80` : `0 2px 12px ${opt.hex}50`,
            }}
          >
            {opt.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberMemoryChallenge({ onComplete }: { onComplete: (score: number) => void }) {
  const [phase, setPhase] = useState<'show' | 'input' | 'done'>('show');
  const [sequence, setSequence] = useState('');
  const [input, setInput] = useState('');
  const [level, setLevel] = useState(3);
  const [score, setScore] = useState(0);
  const [showTime, setShowTime] = useState(3);

  const generateSequence = useCallback((len: number) => {
    return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
  }, []);

  useEffect(() => {
    setSequence(generateSequence(level));
    setPhase('show');
    setShowTime(Math.min(2 + level * 0.5, 6));
  }, [level, generateSequence]);

  useEffect(() => {
    if (phase === 'show') {
      const timer = setTimeout(() => {
        setPhase('input');
        setInput('');
      }, showTime * 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, showTime]);

  const handleSubmit = () => {
    if (input === sequence) {
      sfxCorrect();
      setScore(s => s + 1);
      setLevel(l => l + 1);
    } else {
      sfxWrong();
      setPhase('done');
      setTimeout(() => onComplete(score), 600);
    }
  };

  if (phase === 'done') {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: C.muted, marginBottom: 8 }}>Sequence was: {sequence}</div>
        <div style={{ fontSize: 14, color: C.dim }}>You entered: {input}</div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Level {level - 2} ({level} digits)</div>
      {phase === 'show' ? (
        <div style={{
          fontSize: 48, fontWeight: 600, color: C.text, letterSpacing: 8,
          fontFamily: 'monospace',
        }}>
          {sequence}
        </div>
      ) : (
        <div>
          <input
            autoFocus
            type="text"
            inputMode="numeric"
            value={input}
            onChange={e => setInput(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="Type the number..."
            style={{
              ...glass(),
              padding: '14px 20px',
              fontSize: 28, fontWeight: 700, color: C.text,
              textAlign: 'center', letterSpacing: 6, fontFamily: 'monospace',
              width: '100%', maxWidth: 300, outline: 'none',
            }}
          />
          <div style={{ marginTop: 16 }}>
            <button onClick={handleSubmit} style={solidBtn(COLOR.sapphire)}>Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickMathChallenge({ onComplete }: { onComplete: (score: number) => void }) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [problem, setProblem] = useState(generateProblem);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function generateProblem() {
    const ops = ['+', '-', '×'] as const;
    const op = pick([...ops]);
    let a: number, b: number, answer: number;
    if (op === '+') {
      a = Math.floor(Math.random() * 50) + 5;
      b = Math.floor(Math.random() * 50) + 5;
      answer = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 50) + 20;
      b = Math.floor(Math.random() * a);
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 12) + 2;
      b = Math.floor(Math.random() * 12) + 2;
      answer = a * b;
    }
    const wrong1 = answer + Math.floor(Math.random() * 5) + 1;
    const wrong2 = answer - Math.floor(Math.random() * 5) - 1;
    const wrong3 = answer + (Math.random() > 0.5 ? 10 : -10);
    const choices = [answer, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
    return { text: `${a} ${op} ${b}`, answer, choices };
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      const timer = setTimeout(() => onComplete(score), 400);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, score, onComplete]);

  const handleAnswer = (choice: number) => {
    if (timeLeft === 0) return;
    const correct = choice === problem.answer;
    if (correct) { sfxCorrect(); setScore(s => s + 1); } else { sfxWrong(); }
    setFlash(correct ? 'correct' : 'wrong');
    setTimeout(() => {
      setFlash(null);
      setProblem(generateProblem());
    }, 250);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: timeLeft <= 3 ? COLOR.rose : C.muted, fontWeight: 700, marginBottom: 8 }}>
        {timeLeft}s | Score: {score}
      </div>
      <div style={{ fontSize: 40, fontWeight: 600, color: C.text, marginBottom: 24 }}>{problem.text} = ?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 280, margin: '0 auto' }}>
        {problem.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(c)}
            style={{
              ...glass(flash === 'correct' ? COLOR.emerald : flash === 'wrong' ? COLOR.rose : undefined),
              padding: '14px 0', fontSize: 22, fontWeight: 700, color: C.text,
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Speed Type challenge                                               */
/* ------------------------------------------------------------------ */
function SpeedTypeChallenge({ onComplete }: { onComplete: (score: number) => void }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [words] = useState(() => {
    const shuffled = [...SPEED_TYPE_WORDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  });
  const [input, setInput] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const totalWords = 5;

  const currentWord = words[wordIndex] || '';

  const handleChange = (val: string) => {
    if (!startTime) setStartTime(Date.now());
    setInput(val);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 5;
    const typed = input.trim().toLowerCase();
    const target = currentWord.toLowerCase();

    let charCorrect = 0;
    for (let i = 0; i < Math.min(typed.length, target.length); i++) {
      if (typed[i] === target[i]) charCorrect++;
    }
    const accuracy = target.length > 0 ? charCorrect / target.length : 0;
    const speedBonus = Math.max(0, Math.round((5 - elapsed) * 2));
    const accuracyPoints = Math.round(accuracy * 10);
    const roundScore = accuracyPoints + speedBonus;

    if (accuracy >= 0.8) { sfxCorrect(); } else { sfxWrong(); }
    setFlash(accuracy >= 0.8 ? 'correct' : 'wrong');

    const newTotal = totalScore + roundScore;
    setTotalScore(newTotal);

    setTimeout(() => {
      setFlash(null);
      if (wordIndex + 1 >= totalWords) {
        onComplete(newTotal);
      } else {
        setWordIndex(w => w + 1);
        setInput('');
        setStartTime(null);
      }
    }, 400);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
        {wordIndex + 1} / {totalWords} | Score: {totalScore}
      </div>
      <div style={{
        fontSize: 40, fontWeight: 600, color: C.text, marginBottom: 24,
        letterSpacing: 3, fontFamily: 'monospace',
        textShadow: flash === 'correct' ? `0 0 20px ${COLOR.emerald}60` :
          flash === 'wrong' ? `0 0 20px ${COLOR.rose}60` : 'none',
      }}>
        {currentWord}
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Type it as fast as you can!</div>
      <input
        autoFocus
        type="text"
        value={input}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder="Type here..."
        style={{
          ...glass(),
          padding: '14px 20px',
          fontSize: 24, fontWeight: 600, color: C.text,
          textAlign: 'center', letterSpacing: 3, fontFamily: 'monospace',
          width: '100%', maxWidth: 300, outline: 'none',
          marginBottom: 16,
        }}
      />
      <div>
        <button onClick={handleSubmit} style={solidBtn(COLOR.sapphire)}>Submit</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reaction Time challenge                                            */
/* ------------------------------------------------------------------ */
function ReactionTimeChallenge({ onComplete }: { onComplete: (score: number) => void }) {
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<'wait' | 'ready' | 'go' | 'result' | 'done'>('wait');
  const [times, setTimes] = useState<number[]>([]);
  const [goTime, setGoTime] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  const [tooEarly, setTooEarly] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalAttempts = 3;

  const startAttempt = useCallback(() => {
    setTooEarly(false);
    setPhase('ready');
    const delay = 1000 + Math.random() * 4000;
    timerRef.current = setTimeout(() => {
      setGoTime(Date.now());
      setPhase('go');
    }, delay);
  }, []);

  useEffect(() => {
    startAttempt();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTap = () => {
    if (phase === 'ready') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTooEarly(true);
      sfxWrong();
      setTimeout(() => {
        startAttempt();
      }, 1000);
      return;
    }
    if (phase === 'go') {
      const reactionMs = Date.now() - goTime;
      setLastTime(reactionMs);
      sfxCorrect();
      const newTimes = [...times, reactionMs];
      setTimes(newTimes);
      setPhase('result');
      setTimeout(() => {
        if (newTimes.length >= totalAttempts) {
          const avgMs = newTimes.reduce((s, t) => s + t, 0) / newTimes.length;
          const score = Math.max(0, Math.round(1000 / (avgMs / 100)));
          setPhase('done');
          setTimeout(() => onComplete(score), 300);
        } else {
          setAttempt(a => a + 1);
        }
      }, 1200);
    }
  };

  const bgColor = phase === 'ready' ? '#991b1b' : phase === 'go' ? '#166534' : C.card;
  const borderColor = phase === 'ready' ? '#ef4444' : phase === 'go' ? '#22c55e' : C.border;

  if (phase === 'done') {
    const avgMs = times.reduce((s, t) => s + t, 0) / times.length;
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: C.muted, marginBottom: 8 }}>Average: {Math.round(avgMs)}ms</div>
        <div style={{ fontSize: 14, color: C.dim }}>Calculating score...</div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
        Attempt {attempt + 1} / {totalAttempts}
        {times.length > 0 && ` | Best: ${Math.min(...times)}ms`}
      </div>
      {tooEarly && (
        <div style={{
          fontSize: 18, fontWeight: 600, color: COLOR.rose, marginBottom: 12,
        }}>
          Too early! Wait for green.
        </div>
      )}
      <button
        onClick={handleTap}
        style={{
          background: bgColor,
          border: `2px solid ${borderColor}`,
          borderRadius: RADIUS.lg,
          width: '100%', maxWidth: 300, height: 200,
          cursor: 'pointer', color: '#fff',
          fontSize: 22, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: `background 80ms ease, border-color 80ms ease`,
          margin: '0 auto',
        }}
      >
        {phase === 'wait' && 'Get ready...'}
        {phase === 'ready' && 'WAIT...'}
        {phase === 'go' && 'TAP NOW!'}
        {phase === 'result' && `${lastTime}ms`}
      </button>
      {phase === 'result' && (
        <div style={{ fontSize: 14, color: C.muted, marginTop: 12 }}>
          {lastTime < 200 ? 'Lightning fast!' : lastTime < 350 ? 'Nice reflexes!' : 'Keep practicing!'}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pattern Match challenge                                            */
/* ------------------------------------------------------------------ */
function PatternMatchChallenge({ onComplete }: { onComplete: (score: number) => void }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'show' | 'input' | 'feedback'>('show');
  const [pattern, setPattern] = useState<boolean[]>(() => generatePattern(0));
  const [playerPattern, setPlayerPattern] = useState<boolean[]>(Array(9).fill(false));
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const totalRounds = 4;

  useEffect(() => {
    if (phase === 'show') {
      const showDuration = Math.max(1200, 2500 - round * 300);
      const timer = setTimeout(() => {
        setPhase('input');
        setPlayerPattern(Array(9).fill(false));
      }, showDuration);
      return () => clearTimeout(timer);
    }
  }, [phase, round]);

  const toggleCell = (idx: number) => {
    if (phase !== 'input') return;
    sfxTap();
    setPlayerPattern(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const handleSubmit = () => {
    if (phase !== 'input') return;
    let correct = 0;
    for (let i = 0; i < 9; i++) {
      if (playerPattern[i] === pattern[i]) correct++;
    }
    const roundScore = Math.round((correct / 9) * 10);
    const isCorrect = correct === 9;

    if (isCorrect) { sfxCorrect(); } else { sfxWrong(); }
    setFlash(isCorrect ? 'correct' : 'wrong');
    setScore(s => s + roundScore);

    setPhase('feedback');
    setTimeout(() => {
      setFlash(null);
      if (round + 1 >= totalRounds) {
        onComplete(score + roundScore);
      } else {
        const nextRound = round + 1;
        setRound(nextRound);
        setPattern(generatePattern(nextRound));
        setPhase('show');
      }
    }, 800);
  };

  const cellSize = 64;
  const gap = 6;

  const renderGrid = (grid: boolean[], interactive: boolean) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(3, ${cellSize}px)`,
      gap,
      justifyContent: 'center',
      margin: '0 auto 20px',
    }}>
      {grid.map((on, i) => (
        <button
          key={i}
          onClick={() => interactive && toggleCell(i)}
          style={{
            width: cellSize, height: cellSize,
            borderRadius: RADIUS.sm,
            border: `2px solid ${on ? COLOR.sapphire : C.border}`,
            background: on ? COLOR.sapphire : C.card,
            cursor: interactive ? 'pointer' : 'default',
            transition: `background ${MOTION.snap}, border-color ${MOTION.snap}`,
          }}
        />
      ))}
    </div>
  );

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
        Round {round + 1} / {totalRounds} | Score: {score}
      </div>
      {phase === 'show' && (
        <>
          <div style={{ fontSize: 14, color: COLOR.amber, fontWeight: 600, marginBottom: 12 }}>
            MEMORIZE THIS PATTERN
          </div>
          {renderGrid(pattern, false)}
        </>
      )}
      {phase === 'input' && (
        <>
          <div style={{ fontSize: 14, color: C.muted, fontWeight: 600, marginBottom: 12 }}>
            Reproduce the pattern
          </div>
          {renderGrid(playerPattern, true)}
          <button onClick={handleSubmit} style={solidBtn(COLOR.sapphire)}>Submit</button>
        </>
      )}
      {phase === 'feedback' && (
        <>
          <div style={{
            fontSize: 18, fontWeight: 600, marginBottom: 12,
            color: flash === 'correct' ? COLOR.emerald : COLOR.rose,
          }}>
            {flash === 'correct' ? 'Perfect match!' : 'Not quite!'}
          </div>
          {renderGrid(pattern, false)}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Word Chain challenge                                               */
/* ------------------------------------------------------------------ */
function WordChainChallenge({ onComplete }: { onComplete: (score: number) => void }) {
  const [letter] = useState(() => pick(WORD_CHAIN_LETTERS));
  const [input, setInput] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [started, setStarted] = useState(false);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (started && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [started, timeLeft]);

  useEffect(() => {
    if (started && timeLeft === 0) {
      const timer = setTimeout(() => onComplete(words.length), 400);
      return () => clearTimeout(timer);
    }
  }, [started, timeLeft, words.length, onComplete]);

  const handleSubmit = () => {
    const word = input.trim().toLowerCase();
    if (!word) return;

    if (!started) setStarted(true);

    if (words.includes(word)) {
      sfxWrong();
      setFlash('wrong');
      setTimeout(() => setFlash(null), 300);
      setInput('');
      return;
    }

    if (isValidWord(word, letter)) {
      sfxCorrect();
      setWords(prev => [...prev, word]);
      setFlash('correct');
    } else {
      sfxWrong();
      setFlash('wrong');
    }
    setTimeout(() => setFlash(null), 300);
    setInput('');
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: timeLeft <= 3 && started ? COLOR.rose : C.muted, fontWeight: 700, marginBottom: 8 }}>
        {!started ? 'Type to start!' : `${timeLeft}s`} | Words: {words.length}
      </div>
      <div style={{
        fontSize: 64, fontWeight: 700, color: COLOR.sapphire, marginBottom: 16,
        textShadow: `0 0 30px ${COLOR.sapphire}40`,
      }}>
        {letter}
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
        Words starting with "{letter}" (3+ letters)
      </div>
      <input
        autoFocus
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
        disabled={started && timeLeft === 0}
        placeholder={`${letter}...`}
        style={{
          ...glass(flash === 'correct' ? COLOR.emerald : flash === 'wrong' ? COLOR.rose : undefined),
          padding: '14px 20px',
          fontSize: 22, fontWeight: 600, color: C.text,
          textAlign: 'center', width: '100%', maxWidth: 300, outline: 'none',
          marginBottom: 12,
        }}
      />
      <div>
        <button
          onClick={handleSubmit}
          disabled={started && timeLeft === 0}
          style={{
            ...solidBtn(COLOR.sapphire),
            opacity: (started && timeLeft === 0) ? 0.4 : 1,
          }}
        >
          Add Word
        </button>
      </div>
      {words.length > 0 && (
        <div style={{
          marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6,
          justifyContent: 'center', maxHeight: 80, overflowY: 'auto',
        }}>
          {words.map((w, i) => (
            <span key={i} style={{
              ...glass(COLOR.emerald),
              padding: '4px 10px', fontSize: 12, color: COLOR.emerald, fontWeight: 600,
              borderRadius: RADIUS.full,
            }}>
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main game component                                                */
/* ------------------------------------------------------------------ */
export default function DraftChase({ onBack, onGameEnd, duo }: { onBack: () => void; onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void; duo?: { me: string; them: string } | null }) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [p1Name, setP1Name] = useState('');
  const [p2Name, setP2Name] = useState('');
  const [currentRound, setCurrentRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeType>('speed-tap');
  const [usedChallenges, setUsedChallenges] = useState<ChallengeType[]>([]);
  const [isDrafterP1, setIsDrafterP1] = useState(true);
  const [draftScore, setDraftScore] = useState(0);
  const [chaseScore, setChaseScore] = useState(0);
  const [isChasing, setIsChasing] = useState(false);
  const [passCountdown, setPassCountdown] = useState(3);
  const [showScoreAnim, setShowScoreAnim] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [scorePops, setScorePops] = useState<ScorePop[]>([]);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const totalRounds = 7;

  /* ---- Comeback + match-point logic ---- */
  const p1Wins = results.filter(r => (r.winner === 'drafter' && r.drafterName === p1Name) || (r.winner === 'chaser' && r.chaserName === p1Name)).length;
  const p2Wins = results.filter(r => (r.winner === 'drafter' && r.drafterName === p2Name) || (r.winner === 'chaser' && r.chaserName === p2Name)).length;

  const winsToWin = Math.ceil(totalRounds / 2); // 4 wins needed in best of 7
  const p1IsMatchPoint = p1Wins === winsToWin - 1;
  const p2IsMatchPoint = p2Wins === winsToWin - 1;
  const isMatchPoint = p1IsMatchPoint || p2IsMatchPoint;

  const comebackThreshold = (loserWins: number, leaderWins: number): boolean => {
    return (loserWins === 0 && leaderWins >= 3) || (loserWins === 1 && leaderWins >= 3);
  };

  const p1NeedsComeback = comebackThreshold(p1Wins, p2Wins);
  const p2NeedsComeback = comebackThreshold(p2Wins, p1Wins);
  const comebackActive = p1NeedsComeback || p2NeedsComeback;
  const comebackPlayerName = p1NeedsComeback ? p1Name : p2NeedsComeback ? p2Name : null;

  const getComebackMultiplier = (playerName: string): number => {
    if (p1NeedsComeback && playerName === p1Name) return 1.5;
    if (p2NeedsComeback && playerName === p2Name) return 1.5;
    return 1.0;
  };

  useEffect(() => {
    if (particles.length === 0 && scorePops.length === 0 && shakeIntensity <= 0.01) return;
    const tick = () => {
      setParticles(prev => tickParticles(prev));
      setScorePops(prev => tickScorePops(prev));
      setShakeIntensity(prev => prev * 0.85);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0.01]);

  useEffect(() => {
    if (phase === 'game-over') {
      const p1Tot = results.reduce((s, r) => s + (r.drafterName === p1Name ? r.draftScore : r.chaseScore), 0);
      const p2Tot = results.reduce((s, r) => s + (r.drafterName === p2Name ? r.draftScore : r.chaseScore), 0);
      const p1W = results.filter(r => (r.winner === 'drafter' && r.drafterName === p1Name) || (r.winner === 'chaser' && r.chaserName === p1Name)).length;
      const p2W = results.filter(r => (r.winner === 'drafter' && r.drafterName === p2Name) || (r.winner === 'chaser' && r.chaserName === p2Name)).length;
      onGameEnd?.({ score: Math.max(p1Tot, p2Tot), accuracy: totalRounds > 0 ? Math.max(p1W, p2W) / totalRounds : 0, level: 1 });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const drafterName = isDrafterP1 ? p1Name : p2Name;
  const chaserName = isDrafterP1 ? p2Name : p1Name;

  const startGame = (name1?: string, name2?: string) => {
    const n1 = (name1 ?? p1Name).trim();
    const n2 = (name2 ?? p2Name).trim();
    if (!n1 || !n2) return;
    sfxTap();
    setPhase('round-intro');
    const ch = pickChallenge([]);
    setCurrentChallenge(ch);
    setUsedChallenges([ch]);
  };

  /* ---- Invited "duo" flow: pre-fill both names and skip setup ---- */
  useEffect(() => {
    if (duo) {
      setP1Name(duo.me);
      setP2Name(duo.them);
      startGame(duo.me, duo.them);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startPlaying = () => {
    setPhase('playing');
    setIsChasing(false);
  };

  const applyMultiplier = useCallback((score: number, playerName: string): number => {
    const mult = getComebackMultiplier(playerName);
    return Math.round(score * mult);
  }, [p1NeedsComeback, p2NeedsComeback, p1Name, p2Name]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDraftComplete = useCallback((score: number) => {
    sfxScore();
    const finalScore = applyMultiplier(score, drafterName);
    setDraftScore(finalScore);
    setPhase('draft-result');
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 3;
      setParticles(prev => [...prev, ...correctBurst(cx, cy)]);
      setScorePops(prev => [...prev, createScorePop(cx, cy, finalScore, '#3a86ff')]);
    }
  }, [applyMultiplier, drafterName]);

  const startPassPhone = () => {
    setPassCountdown(3);
    setPhase('pass-phone');
  };

  useEffect(() => {
    if (phase === 'pass-phone' && passCountdown > 0) {
      sfxCountdown();
      const timer = setTimeout(() => setPassCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (phase === 'pass-phone' && passCountdown === 0) {
      sfxCountdownGo();
    }
  }, [phase, passCountdown]);

  const startChase = () => {
    setIsChasing(true);
    setPhase('playing');
  };

  const onChaseComplete = useCallback((score: number) => {
    const finalScore = applyMultiplier(score, chaserName);
    setChaseScore(finalScore);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 3;
      if (finalScore > draftScore) {
        setParticles(prev => [...prev, ...correctBurst(cx, cy)]);
        setScorePops(prev => [...prev, createScorePop(cx, cy, 'WIN!', '#00c97b')]);
      } else if (finalScore < draftScore) {
        setParticles(prev => [...prev, ...wrongBurst(cx, cy)]);
        setShakeIntensity(3);
      }
    }
    setShowScoreAnim(true);
    setTimeout(() => {
      setShowScoreAnim(false);
      const winner: 'drafter' | 'chaser' | 'tie' = finalScore > draftScore ? 'chaser' : finalScore < draftScore ? 'drafter' : 'tie';
      const result: RoundResult = {
        challenge: currentChallenge,
        drafterName,
        chaserName,
        draftScore,
        chaseScore: finalScore,
        winner,
      };
      setResults(prev => [...prev, result]);
      setPhase('round-result');
    }, 2000);
    setPhase('chase-result');
  }, [draftScore, currentChallenge, drafterName, chaserName, applyMultiplier]);

  const nextRound = () => {
    const next = currentRound + 1;
    // Check if someone has clinched the match
    const newP1Wins = results.filter(r => (r.winner === 'drafter' && r.drafterName === p1Name) || (r.winner === 'chaser' && r.chaserName === p1Name)).length;
    const newP2Wins = results.filter(r => (r.winner === 'drafter' && r.drafterName === p2Name) || (r.winner === 'chaser' && r.chaserName === p2Name)).length;
    if (next >= totalRounds || newP1Wins >= winsToWin || newP2Wins >= winsToWin) {
      sfxGameOver();
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setParticles(prev => [...prev, ...confettiBurst(rect.width / 2, rect.height / 3)]);
      }
      setPhase('game-over');
      return;
    }
    sfxLevelUp();
    setCurrentRound(next);
    setIsDrafterP1(!isDrafterP1);
    const ch = pickChallenge(usedChallenges);
    setCurrentChallenge(ch);
    setUsedChallenges(prev => [...prev, ch]);
    setDraftScore(0);
    setChaseScore(0);
    setPhase('round-intro');
  };

  const resetGame = () => {
    setPhase('setup');
    setP1Name('');
    setP2Name('');
    setCurrentRound(0);
    setResults([]);
    setUsedChallenges([]);
    setIsDrafterP1(true);
    setDraftScore(0);
    setChaseScore(0);
  };

  /* ---- render helpers ---- */

  const matchPointBanner = isMatchPoint && phase !== 'setup' && phase !== 'game-over' && (
    <div style={{
      background: COLOR.rose,
      color: '#fff',
      textAlign: 'center',
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      borderRadius: RADIUS.sm,
      marginBottom: 12,
      boxShadow: `0 0 20px ${COLOR.rose}50`,
      animation: 'matchPointPulse 1.5s ease-in-out infinite',
    }}>
      MATCH POINT — {p1IsMatchPoint ? p1Name : p2Name}
    </div>
  );

  const comebackBanner = comebackActive && !isMatchPoint && phase !== 'setup' && phase !== 'game-over' && (
    <div style={{
      background: COLOR.amber,
      color: '#fff',
      textAlign: 'center',
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      borderRadius: RADIUS.sm,
      marginBottom: 12,
      boxShadow: `0 0 16px ${COLOR.amber}40`,
    }}>
      COMEBACK MODE — {comebackPlayerName} gets 1.5x score
    </div>
  );

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
        <ArrowLeft size={22} />
      </button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.text, letterSpacing: '-0.02em' }}>Draft & Chase</div>
      </div>
      {phase !== 'setup' && phase !== 'game-over' && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {Array.from({ length: totalRounds }).map((_, i) => {
            const r = results[i];
            let bg = C.dim + '40';
            if (r) {
              const p1Won = (r.winner === 'drafter' && r.drafterName === p1Name) || (r.winner === 'chaser' && r.chaserName === p1Name);
              bg = r.winner === 'tie' ? C.muted : p1Won ? C.p1 : C.p2;
            } else if (i === currentRound) {
              bg = C.accent;
            }
            return <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: bg, transition: `background ${MOTION.fast}` }} />;
          })}
        </div>
      )}
    </div>
  );

  const scoreBar = phase !== 'setup' && phase !== 'game-over' && (
    <div style={{ ...glass(), padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.p1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p1Name}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: C.text }}>{p1Wins}</div>
      </div>
      <div style={{ fontSize: 12, color: C.dim, fontWeight: 700 }}>ROUND {currentRound + 1}/{totalRounds}</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.p2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p2Name}</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: C.text }}>{p2Wins}</div>
      </div>
    </div>
  );

  /* ---- phases ---- */

  const renderSetup = () => (
    <div style={{ ...glass(), padding: 32, textAlign: 'center' }}>
      <Users size={40} color={C.accent} style={{ marginBottom: 16 }} />
      <div style={{ fontSize: 24, fontWeight: 600, color: C.text, marginBottom: 8 }}>Draft & Chase</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.5 }}>
        Set a score. Dare them to beat it.<br />Best of 7 rounds wins.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280, margin: '0 auto 24px' }}>
        <input
          autoFocus
          value={p1Name}
          onChange={e => setP1Name(e.target.value)}
          placeholder="Player 1 name"
          style={{
            ...glass(C.p1), padding: '12px 16px', fontSize: 16, fontWeight: 600,
            color: C.text, outline: 'none', textAlign: 'center',
          }}
        />
        <input
          value={p2Name}
          onChange={e => setP2Name(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') startGame(); }}
          placeholder="Player 2 name"
          style={{
            ...glass(C.p2), padding: '12px 16px', fontSize: 16, fontWeight: 600,
            color: C.text, outline: 'none', textAlign: 'center',
          }}
        />
      </div>
      <button
        onClick={() => startGame()}
        disabled={!p1Name.trim() || !p2Name.trim()}
        style={{
          ...solidBtn(C.accent),
          opacity: (!p1Name.trim() || !p2Name.trim()) ? 0.4 : 1,
          justifyContent: 'center', width: '100%', maxWidth: 280,
        }}
      >
        Start Game <ChevronRight size={18} />
      </button>
    </div>
  );

  const renderRoundIntro = () => {
    const info = CHALLENGE_INFO[currentChallenge];
    return (
      <div style={{ ...glass(), padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
          Round {currentRound + 1} of {totalRounds}
        </div>
        <div style={{
          width: 64, height: 64, borderRadius: RADIUS.lg, background: C.accent + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent,
          margin: '0 auto 16px',
        }}>
          {info.icon}
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, color: C.text, marginBottom: 8 }}>{info.name}</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>{info.desc}</div>
        <div style={{
          ...glass(C.p1), padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Zap size={16} color={isDrafterP1 ? C.p1 : C.p2} />
          <span style={{ fontSize: 14, fontWeight: 700, color: isDrafterP1 ? C.p1 : C.p2 }}>{drafterName}</span>
          <span style={{ fontSize: 13, color: C.muted }}>drafts first</span>
        </div>
        <button onClick={startPlaying} style={{ ...solidBtn(C.accent), justifyContent: 'center', width: '100%' }}>
          Let's Go! <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  const renderPlaying = () => {
    const playerColor = isChasing ? (isDrafterP1 ? C.p2 : C.p1) : (isDrafterP1 ? C.p1 : C.p2);
    const playerName = isChasing ? chaserName : drafterName;
    const hasComeback = getComebackMultiplier(playerName) > 1;
    return (
      <div style={{ ...glass(), padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: playerColor }}>{playerName}</div>
            {hasComeback && (
              <span style={{
                background: COLOR.amber, color: '#fff', fontSize: 10, fontWeight: 600,
                padding: '2px 6px', borderRadius: RADIUS.full, letterSpacing: '0.04em',
              }}>
                1.5x
              </span>
            )}
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: isChasing ? COLOR.rose : C.accent,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {isChasing ? 'CHASING' : 'DRAFTING'}
          </div>
        </div>
        {isChasing && (
          <div style={{
            ...glass(COLOR.amber), padding: '8px 14px', marginBottom: 16,
            fontSize: 13, color: COLOR.amber, fontWeight: 700, textAlign: 'center',
          }}>
            Target to beat: {draftScore}
          </div>
        )}
        {currentChallenge === 'speed-tap' && <SpeedTapChallenge onComplete={isChasing ? onChaseComplete : onDraftComplete} />}
        {currentChallenge === 'color-match' && <ColorMatchChallenge onComplete={isChasing ? onChaseComplete : onDraftComplete} />}
        {currentChallenge === 'number-memory' && <NumberMemoryChallenge onComplete={isChasing ? onChaseComplete : onDraftComplete} />}
        {currentChallenge === 'quick-math' && <QuickMathChallenge onComplete={isChasing ? onChaseComplete : onDraftComplete} />}
        {currentChallenge === 'speed-type' && <SpeedTypeChallenge onComplete={isChasing ? onChaseComplete : onDraftComplete} />}
        {currentChallenge === 'reaction-time' && <ReactionTimeChallenge onComplete={isChasing ? onChaseComplete : onDraftComplete} />}
        {currentChallenge === 'pattern-match' && <PatternMatchChallenge onComplete={isChasing ? onChaseComplete : onDraftComplete} />}
        {currentChallenge === 'word-chain' && <WordChainChallenge onComplete={isChasing ? onChaseComplete : onDraftComplete} />}
      </div>
    );
  };

  const renderDraftResult = () => (
    <div style={{ ...glass(), padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        {drafterName}'s Draft
      </div>
      <div style={{
        fontSize: 72, fontWeight: 700, color: C.text, lineHeight: 1,
        textShadow: `0 0 40px ${C.accent}40`,
      }}>
        {draftScore}
      </div>
      <div style={{ fontSize: 14, color: C.muted, margin: '12px 0 28px' }}>
        Can {chaserName} beat this?
      </div>
      <button onClick={startPassPhone} style={{ ...solidBtn(C.p2), justifyContent: 'center', width: '100%' }}>
        Pass to {chaserName} <ChevronRight size={18} />
      </button>
    </div>
  );

  const renderPassPhone = () => (
    <div style={{ ...glass(), padding: 40, textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: (isDrafterP1 ? C.p2 : C.p1) + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', fontSize: 36, color: C.muted,
      }}>
        <RotateCcw size={32} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 8 }}>
        Pass the phone to
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: isDrafterP1 ? C.p2 : C.p1, marginBottom: 24 }}>
        {chaserName}
      </div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
        {passCountdown > 0
          ? `Starting in ${passCountdown}...`
          : 'Ready to chase!'}
      </div>
      {passCountdown === 0 && (
        <button onClick={startChase} style={{ ...solidBtn(isDrafterP1 ? C.p2 : C.p1), justifyContent: 'center', width: '100%' }}>
          Start Chase! <Zap size={18} />
        </button>
      )}
    </div>
  );

  const renderChaseResult = () => {
    const latestResult = results[results.length - 1];
    if (!latestResult && !showScoreAnim) return null;

    return (
      <div style={{ ...glass(), padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
          Score Comparison
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: isDrafterP1 ? C.p1 : C.p2, marginBottom: 4 }}>{drafterName}</div>
            <div style={{ fontSize: 48, fontWeight: 700, color: C.text }}>{draftScore}</div>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 600 }}>DRAFT</div>
          </div>
          <div style={{ fontSize: 24, color: C.dim, fontWeight: 600 }}>vs</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: isDrafterP1 ? C.p2 : C.p1, marginBottom: 4 }}>{chaserName}</div>
            <div style={{
              fontSize: 48, fontWeight: 700, color: C.text,
              animation: showScoreAnim ? 'pulse 0.5s ease-in-out' : 'none',
            }}>
              {chaseScore}
            </div>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 600 }}>CHASE</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 8 }}>Calculating...</div>
      </div>
    );
  };

  const renderRoundResult = () => {
    const r = results[results.length - 1];
    if (!r) return null;
    const diff = Math.abs(r.draftScore - r.chaseScore);
    const trashTalk = getTrashTalk(diff);
    const winnerName = r.winner === 'drafter' ? r.drafterName : r.winner === 'chaser' ? r.chaserName : null;
    const winColor = winnerName === p1Name ? C.p1 : winnerName === p2Name ? C.p2 : C.muted;

    return (
      <div style={{ ...glass(), padding: 32, textAlign: 'center' }}>
        <div style={{
          fontSize: 32, fontWeight: 700, color: r.winner === 'tie' ? C.muted : winColor,
          marginBottom: 8, textShadow: `0 0 30px ${winColor}40`,
        }}>
          {trashTalk}
        </div>
        {r.winner === 'tie' ? (
          <div style={{ fontSize: 16, color: C.muted, marginBottom: 20 }}>It's a tie this round!</div>
        ) : (
          <div style={{ fontSize: 16, color: C.muted, marginBottom: 20 }}>
            <span style={{ color: winColor, fontWeight: 700 }}>{winnerName}</span> wins the round!
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ ...glass(isDrafterP1 ? C.p1 + '30' : C.p2 + '30'), padding: '12px 20px', minWidth: 100 }}>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, marginBottom: 4 }}>{r.drafterName}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: C.text }}>{r.draftScore}</div>
          </div>
          <div style={{ ...glass(isDrafterP1 ? C.p2 + '30' : C.p1 + '30'), padding: '12px 20px', minWidth: 100 }}>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 600, marginBottom: 4 }}>{r.chaserName}</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: C.text }}>{r.chaseScore}</div>
          </div>
        </div>
        <button onClick={nextRound} style={{ ...solidBtn(C.accent), justifyContent: 'center', width: '100%' }}>
          {currentRound + 1 >= totalRounds || p1Wins >= winsToWin || p2Wins >= winsToWin ? 'See Final Results' : 'Next Round'} <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  const renderGameOver = () => {
    const winner = p1Wins > p2Wins ? p1Name : p2Wins > p1Wins ? p2Name : null;
    const winnerColor = winner === p1Name ? C.p1 : winner === p2Name ? C.p2 : C.muted;

    return (
      <div>
        <div style={{ ...glass(), padding: 32, textAlign: 'center', marginBottom: 16 }}>
          <Trophy size={48} color={winnerColor} style={{ marginBottom: 12 }} />
          <div style={{
            fontSize: 14, fontWeight: 700, color: C.muted, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 8,
          }}>
            {winner ? 'Champion' : 'Draw'}
          </div>
          <div style={{
            fontSize: 36, fontWeight: 700, color: winnerColor, marginBottom: 4,
            textShadow: `0 0 40px ${winnerColor}40`,
          }}>
            {winner || 'Tied!'}
          </div>
          <div style={{ fontSize: 16, color: C.muted }}>
            {p1Wins} - {p2Wins}
          </div>
        </div>

        <div style={{ ...glass(), padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Round Breakdown
          </div>
          {results.map((r, i) => {
            const rWinner = r.winner === 'drafter' ? r.drafterName : r.winner === 'chaser' ? r.chaserName : null;
            const rColor = rWinner === p1Name ? C.p1 : rWinner === p2Name ? C.p2 : C.muted;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: i < results.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: rColor + '20',
                    color: rColor, fontSize: 11, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>
                    {CHALLENGE_INFO[r.challenge].name}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.drafterName === p1Name ? C.p1 : C.p2 }}>
                    {r.draftScore}
                  </span>
                  <span style={{ fontSize: 11, color: C.dim }}>vs</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.chaserName === p1Name ? C.p1 : C.p2 }}>
                    {r.chaseScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={resetGame} style={{ ...solidBtn(C.accent), flex: 1, justifyContent: 'center' }}>
            <RotateCcw size={16} /> Play Again
          </button>
          <button onClick={onBack} style={{ ...solidBtn(C.dim), justifyContent: 'center' }}>
            Exit
          </button>
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{
      minHeight: '100vh', background: C.bg, padding: '20px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      maxWidth: 420, margin: '0 auto',
      position: 'relative', overflow: 'hidden',
      ...screenShakeStyle(shakeIntensity),
    }}>
      <style>{`
        @keyframes matchPointPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      {header}
      {matchPointBanner}
      {comebackBanner}
      {scoreBar}
      {phase === 'setup' && renderSetup()}
      {phase === 'round-intro' && renderRoundIntro()}
      {phase === 'playing' && renderPlaying()}
      {phase === 'draft-result' && renderDraftResult()}
      {phase === 'pass-phone' && renderPassPhone()}
      {phase === 'chase-result' && renderChaseResult()}
      {phase === 'round-result' && renderRoundResult()}
      {phase === 'game-over' && renderGameOver()}
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </div>
  );
}
