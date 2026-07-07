import React, { useState, useMemo } from 'react';
import { ArrowLeft, BookOpen, Check, X, Sparkles, RotateCcw, ChevronRight } from 'lucide-react';
import { sfxClick, sfxCorrect, sfxWrong, sfxLevelUp, sfxGameOver } from '../lib/sfx';

/* ═══════════════════════════════════════════════════════════════════════
   Scripture Quest — respectful, educational knowledge challenges across the
   world's major faiths: Bible, Quran, Torah, Bhagavad Gita, Buddhist sutras.
   Scholarly tone, no judgement — learning about traditions, not ranking them.
   ═══════════════════════════════════════════════════════════════════════ */

interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

const C = {
  obsidian: '#0b0f14', ink: '#111820', slate: '#1a2230', surface: '#151d2b',
  gold: '#d4a94a', emerald: '#00c97b', teal: '#00b4d8', rose: '#f43f5e',
  white: '#f0f4f8', muted: '#7a8ba0', dim: '#3d4f63', border: '#1f2d3d',
};

type Faith = 'christianity' | 'islam' | 'judaism' | 'hinduism' | 'buddhism';
interface Q { faith: Faith; q: string; options: string[]; answer: number; note: string; }

const FAITHS: { key: Faith; label: string; text: string; glyph: string; color: string }[] = [
  { key: 'christianity', label: 'Christianity', text: 'The Bible', glyph: '✝️', color: '#6ea8fe' },
  { key: 'islam', label: 'Islam', text: 'The Quran', glyph: '☪️', color: '#2a9d8f' },
  { key: 'judaism', label: 'Judaism', text: 'The Torah', glyph: '✡️', color: '#5b8def' },
  { key: 'hinduism', label: 'Hinduism', text: 'Bhagavad Gita', glyph: '🕉️', color: '#f59e0b' },
  { key: 'buddhism', label: 'Buddhism', text: 'The Sutras', glyph: '☸️', color: '#e0a458' },
];

const BANK: Q[] = [
  // Christianity — the Bible
  { faith: 'christianity', q: 'In which book does the six-day account of creation appear?', options: ['Genesis', 'Exodus', 'Psalms', 'Matthew'], answer: 0, note: 'Genesis (Bereshit), the first book of the Bible, opens with the creation narrative.' },
  { faith: 'christianity', q: 'How many apostles did Jesus choose?', options: ['7', '10', '12', '40'], answer: 2, note: 'The Twelve Apostles are named in the Gospels of Matthew, Mark and Luke.' },
  { faith: 'christianity', q: 'Which Gospel is traditionally attributed to a physician?', options: ['Mark', 'Luke', 'John', 'Acts'], answer: 1, note: 'Luke is traditionally identified as a physician and a companion of Paul.' },
  { faith: 'christianity', q: 'The blessings in the Sermon on the Mount are called the…', options: ['Parables', 'Beatitudes', 'Psalms', 'Proverbs'], answer: 1, note: 'The Beatitudes ("Blessed are…") open the Sermon on the Mount in Matthew 5.' },
  { faith: 'christianity', q: 'Who received the Ten Commandments on Mount Sinai?', options: ['Abraham', 'David', 'Moses', 'Elijah'], answer: 2, note: 'Moses received the commandments on Sinai in the book of Exodus.' },
  { faith: 'christianity', q: 'What is the first book of the New Testament?', options: ['Genesis', 'Matthew', 'Romans', 'Revelation'], answer: 1, note: 'Matthew opens the New Testament with the genealogy and birth of Jesus.' },
  // Islam — the Quran
  { faith: 'islam', q: 'How many chapters (surahs) are in the Quran?', options: ['99', '110', '114', '120'], answer: 2, note: 'The Quran contains 114 surahs, varying greatly in length.' },
  { faith: 'islam', q: 'The opening chapter of the Quran is called…', options: ['Al-Baqarah', 'Al-Fatiha', 'Al-Ikhlas', 'Ya-Sin'], answer: 1, note: 'Al-Fatiha ("The Opening") is recited in every unit of the daily prayers.' },
  { faith: 'islam', q: 'The pilgrimage to Mecca, a pillar of Islam, is the…', options: ['Zakat', 'Sawm', 'Hajj', 'Salah'], answer: 2, note: 'The Hajj is performed in Dhul-Hijjah by those who are able.' },
  { faith: 'islam', q: 'The first word revealed to Prophet Muhammad was…', options: ['"Iqra" (Recite)', '"Salaam"', '"Allahu"', '"Bismillah"'], answer: 0, note: 'Tradition holds the first revelation began "Iqra" — "Recite/Read" (Surah Al-Alaq).' },
  { faith: 'islam', q: 'Giving alms as one of the Five Pillars is called…', options: ['Shahada', 'Zakat', 'Hajj', 'Wudu'], answer: 1, note: 'Zakat is obligatory almsgiving, purifying wealth by sharing with those in need.' },
  { faith: 'islam', q: 'The holy month of fasting is…', options: ['Rajab', 'Shawwal', 'Ramadan', 'Muharram'], answer: 2, note: 'Muslims fast from dawn to sunset throughout the month of Ramadan.' },
  // Judaism — the Torah
  { faith: 'judaism', q: 'How many books make up the Torah?', options: ['3', '5', '7', '12'], answer: 1, note: 'The Torah (Pentateuch) has five books: Genesis, Exodus, Leviticus, Numbers, Deuteronomy.' },
  { faith: 'judaism', q: 'The weekly day of rest in Judaism is…', options: ['Yom Kippur', 'Shabbat', 'Purim', 'Sukkot'], answer: 1, note: 'Shabbat runs from Friday evening to Saturday nightfall, a day of rest and prayer.' },
  { faith: 'judaism', q: 'The festival commemorating the Exodus from Egypt is…', options: ['Hanukkah', 'Passover', 'Shavuot', 'Rosh Hashanah'], answer: 1, note: 'Passover (Pesach) recalls the liberation of the Israelites, marked by the Seder meal.' },
  { faith: 'judaism', q: 'The central prayer affirming one God begins "Shema…"', options: ['Yisrael', 'Adonai', 'Shalom', 'Torah'], answer: 0, note: '"Shema Yisrael" — "Hear, O Israel" — is Judaism\'s foundational declaration of faith.' },
  { faith: 'judaism', q: 'The Day of Atonement is called…', options: ['Yom Kippur', 'Purim', 'Sukkot', 'Tu BiShvat'], answer: 0, note: 'Yom Kippur is the holiest day of the Jewish year, marked by fasting and repentance.' },
  // Hinduism — Bhagavad Gita
  { faith: 'hinduism', q: 'The Bhagavad Gita is a dialogue between Arjuna and…', options: ['Rama', 'Krishna', 'Shiva', 'Hanuman'], answer: 1, note: 'On the field of Kurukshetra, Krishna counsels the warrior Arjuna.' },
  { faith: 'hinduism', q: 'The Gita forms part of which great epic?', options: ['Ramayana', 'Vedas', 'Mahabharata', 'Puranas'], answer: 2, note: 'The Bhagavad Gita sits within the Mahabharata, one of India\'s two great epics.' },
  { faith: 'hinduism', q: 'The cycle of birth, death and rebirth is called…', options: ['Moksha', 'Samsara', 'Dharma', 'Karma'], answer: 1, note: 'Samsara is the cycle of rebirth; liberation from it is called moksha.' },
  { faith: 'hinduism', q: 'The path of selfless action taught in the Gita is…', options: ['Bhakti Yoga', 'Karma Yoga', 'Jnana Yoga', 'Raja Yoga'], answer: 1, note: 'Karma Yoga is acting rightly without attachment to the fruits of action.' },
  { faith: 'hinduism', q: 'The sacred syllable regarded as the sound of the universe is…', options: ['Om', 'Namaste', 'Shanti', 'Veda'], answer: 0, note: 'Om (Aum) is chanted as the primordial sound in many Indian traditions.' },
  // Buddhism — the sutras
  { faith: 'buddhism', q: 'The founder of Buddhism is known by the title…', options: ['Bodhisattva', 'The Buddha', 'Arhat', 'Lama'], answer: 1, note: 'Siddhartha Gautama became "the Buddha" — "the Awakened One" — after his enlightenment.' },
  { faith: 'buddhism', q: 'The Four Noble Truths concern the nature of…', options: ['Karma', 'Suffering', 'Rebirth', 'Meditation'], answer: 1, note: 'They diagnose suffering (dukkha), its cause, its cessation, and the path beyond it.' },
  { faith: 'buddhism', q: 'The way beyond suffering is the Noble…', options: ['Fourfold Way', 'Eightfold Path', 'Middle Circle', 'Tenfold Path'], answer: 1, note: 'The Noble Eightfold Path includes right view, intention, speech, action and more.' },
  { faith: 'buddhism', q: 'The state of liberation and peace in Buddhism is…', options: ['Nirvana', 'Samsara', 'Dukkha', 'Dharma'], answer: 0, note: 'Nirvana is the extinguishing of craving and the end of the cycle of suffering.' },
  { faith: 'buddhism', q: 'A concise, memorable Buddhist teaching text is called a…', options: ['Psalm', 'Sutra', 'Surah', 'Verse'], answer: 1, note: 'A sutra (Pali: sutta) is a discourse, often recording the teachings of the Buddha.' },
  { faith: 'buddhism', q: 'The teaching that all things are impermanent is called…', options: ['Anicca', 'Metta', 'Karuna', 'Samadhi'], answer: 0, note: 'Anicca — impermanence — is one of the three marks of existence.' },
];

const QUIZ_LEN = 8;
function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export default function ScriptureQuest({ onBack, onGameEnd }: Props) {
  const [faith, setFaith] = useState<Faith | 'all' | null>(null);
  const [quiz, setQuiz] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const begin = (f: Faith | 'all') => {
    sfxLevelUp();
    const pool = f === 'all' ? BANK : BANK.filter(x => x.faith === f);
    const qs = shuffle(pool).slice(0, Math.min(QUIZ_LEN, pool.length)).map(x => {
      const order = shuffle(x.options.map((_, i) => i));
      return { ...x, options: order.map(i => x.options[i]), answer: order.indexOf(x.answer) };
    });
    setFaith(f); setQuiz(qs); setIdx(0); setPicked(null); setScore(0); setStreak(0); setBest(0); setCorrect(0); setDone(false);
  };

  const q = quiz[idx];

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) {
      sfxCorrect();
      setScore(s => s + 100 + streak * 20);
      setCorrect(c => c + 1);
      setStreak(st => { const n = st + 1; setBest(b => Math.max(b, n)); return n; });
    } else { sfxWrong(); setStreak(0); }
  };

  const next = () => {
    sfxClick();
    if (idx + 1 >= quiz.length) {
      sfxGameOver();
      setDone(true);
      const acc = quiz.length ? correct / quiz.length : 0;
      onGameEnd?.({ score, accuracy: acc, level: 1, maxScore: quiz.length * 100 });
    } else { setIdx(i => i + 1); setPicked(null); }
  };

  const meta = useMemo(() => (faith && faith !== 'all' ? FAITHS.find(f => f.key === faith) : null), [faith]);

  /* ── select ── */
  if (!faith) {
    return (
      <div style={wrap}>
        <Header onBack={onBack} />
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <BookOpen size={44} color={C.gold} style={{ margin: '8px auto' }} />
            <h2 style={{ color: C.white, fontSize: 25, margin: '0 0 6px' }}>Scripture Quest</h2>
            <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.6 }}>A respectful, scholarly journey through the world's great traditions. Choose a path — or test yourself across all faiths.</p>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {FAITHS.map(f => (
              <button key={f.key} onClick={() => begin(f.key)} style={{ ...row, borderColor: C.border }}>
                <span style={{ fontSize: 24 }}>{f.glyph}</span>
                <span style={{ flex: 1, textAlign: 'left' }}><span style={{ color: C.white, fontWeight: 700, display: 'block' }}>{f.label}</span><span style={{ color: C.muted, fontSize: 12 }}>{f.text}</span></span>
                <ChevronRight size={18} color={C.dim} />
              </button>
            ))}
            <button onClick={() => begin('all')} style={{ ...row, background: C.slate, borderColor: C.gold }}>
              <Sparkles size={22} color={C.gold} />
              <span style={{ flex: 1, textAlign: 'left', color: C.white, fontWeight: 700 }}>All faiths <span style={{ color: C.muted, fontWeight: 400, fontSize: 12 }}>· grand quest</span></span>
              <ChevronRight size={18} color={C.gold} />
            </button>
          </div>
          <p style={{ color: C.dim, fontSize: 11, textAlign: 'center', marginTop: 18, lineHeight: 1.6 }}>Presented for learning and respect — every tradition treated as a source of wisdom.</p>
        </div>
      </div>
    );
  }

  /* ── results ── */
  if (done) {
    const acc = quiz.length ? Math.round((correct / quiz.length) * 100) : 0;
    return (
      <div style={wrap}>
        <Header onBack={onBack} />
        <div style={{ maxWidth: 420, margin: '0 auto', padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 46, margin: '10px 0' }}>{meta?.glyph || '📜'}</div>
          <h2 style={{ color: C.white, fontSize: 26, margin: '0 0 4px' }}>Quest complete</h2>
          <p style={{ color: C.muted, marginBottom: 18 }}>{meta ? meta.label : 'All faiths'}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 26, flexWrap: 'wrap' }}>
            <Stat label="Score" value={score} color={C.gold} />
            <Stat label="Correct" value={`${correct}/${quiz.length}`} color={C.emerald} />
            <Stat label="Accuracy" value={`${acc}%`} color={C.teal} />
            <Stat label="Best streak" value={best} color={C.rose} />
          </div>
          <button onClick={() => setFaith(null)} style={{ ...cta, width: '100%', marginBottom: 10 }}><RotateCcw size={18} /> Another quest</button>
          <button onClick={onBack} style={{ ...ghost, width: '100%' }}>Back to games</button>
        </div>
      </div>
    );
  }

  /* ── question ── */
  return (
    <div style={wrap}>
      <Header onBack={onBack} />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ color: C.muted, fontSize: 12 }}>Question {idx + 1} / {quiz.length}</span>
          <span style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: C.gold, fontWeight: 800, fontSize: 14 }}>{score}</span>
            {streak > 1 && <span style={{ color: C.emerald, fontSize: 12, fontWeight: 700 }}>🔥 {streak}</span>}
          </span>
        </div>
        <div style={{ height: 4, background: C.ink, borderRadius: 999, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(idx / quiz.length) * 100}%`, background: C.gold, transition: '300ms' }} />
        </div>

        <div style={{ background: C.ink, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          {faith === 'all' && <span style={{ color: FAITHS.find(f => f.key === q.faith)?.color, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{FAITHS.find(f => f.key === q.faith)?.label}</span>}
          <h3 style={{ color: C.white, fontSize: 18, lineHeight: 1.4, margin: '6px 0 0' }}>{q.q}</h3>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {q.options.map((opt, i) => {
            const isAns = i === q.answer, isPick = i === picked;
            let bg = C.surface, bd = C.border, fg = C.white;
            if (picked !== null) {
              if (isAns) { bg = 'rgba(0,201,123,0.14)'; bd = C.emerald; fg = C.emerald; }
              else if (isPick) { bg = 'rgba(244,63,94,0.14)'; bd = C.rose; fg = C.rose; }
            }
            return (
              <button key={i} onClick={() => choose(i)} disabled={picked !== null} style={{ display: 'flex', alignItems: 'center', gap: 12, background: bg, border: `1px solid ${bd}`, borderRadius: 12, padding: '14px 16px', color: fg, fontSize: 15, fontWeight: 600, cursor: picked === null ? 'pointer' : 'default', textAlign: 'left' }}>
                <span style={{ flex: 1 }}>{opt}</span>
                {picked !== null && isAns && <Check size={18} />}
                {picked !== null && isPick && !isAns && <X size={18} />}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div style={{ marginTop: 16, background: C.slate, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}`, borderRadius: 10, padding: 14 }}>
            <div style={{ color: C.gold, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>{picked === q.answer ? 'Correct' : 'Good to know'}</div>
            <p style={{ color: C.white, fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{q.note}</p>
            <button onClick={next} style={{ ...cta, marginTop: 12, width: '100%', justifyContent: 'center' }}>{idx + 1 >= quiz.length ? 'See results' : 'Next'} <ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div style={{ background: C.ink, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', minWidth: 70 }}>
      <div style={{ color, fontSize: 20, fontWeight: 800 }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.obsidian, zIndex: 5 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}><ArrowLeft size={22} /></button>
      <div><div style={{ color: C.white, fontWeight: 800, fontSize: 17 }}>Scripture Quest</div><div style={{ color: C.muted, fontSize: 11 }}>Wisdom of the world's faiths</div></div>
    </div>
  );
}

const wrap: React.CSSProperties = { minHeight: '100%', background: C.obsidian, color: C.white, fontFamily: 'Inter, system-ui, sans-serif' };
const cta: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, background: C.gold, color: C.obsidian, border: 'none', borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 800, cursor: 'pointer' };
const ghost: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.surface, color: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const row: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, background: C.ink, border: '1px solid', borderRadius: 14, padding: '14px 16px', cursor: 'pointer' };
