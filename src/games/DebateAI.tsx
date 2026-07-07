import { useState, useCallback, useMemo } from 'react'
import {
  ArrowLeft, MessageSquare, Zap, Brain, Shuffle,
  ChevronRight, Trophy, RotateCcw, Swords, Shield, Lightbulb,
  BookOpen, Scale, Users, Leaf, GraduationCap, DollarSign,
  Cpu, Star, Target, TrendingUp
} from 'lucide-react'
import { COLOR, RADIUS, MOTION, solidBtn } from '../lib/design'
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver, sfxLevelUp, sfxReveal } from '../lib/sfx'

/* ── types ── */
type Phase = 'menu' | 'topic' | 'debate' | 'result'
type Strategy = 'counter' | 'reframe' | 'evidence' | 'concede'
type ArgType = 'logical' | 'emotional' | 'authoritative' | 'anecdotal'
type Category = 'ethics' | 'technology' | 'society' | 'environment' | 'education' | 'economics'

interface Score {
  logic: number
  persuasion: number
  evidence: number
  adaptability: number
}

interface Round {
  aiArgument: string
  aiArgType: ArgType
  playerStrategy: Strategy
  scoreGained: Score
  feedback: string
}

interface Topic {
  id: string
  title: string
  category: Category
  aiPosition: string
  rounds: {
    argument: string
    argType: ArgType
    /* effectiveness matrix: [counter, reframe, evidence, concede] each 0-1 */
    effectiveness: [number, number, number, number]
  }[]
}

/* ── constants ── */
const CATEGORIES: { key: Category; label: string; icon: typeof Scale; color: string }[] = [
  { key: 'ethics', label: 'Ethics', icon: Scale, color: COLOR.violet },
  { key: 'technology', label: 'Technology', icon: Cpu, color: COLOR.sapphire },
  { key: 'society', label: 'Society', icon: Users, color: COLOR.rose },
  { key: 'environment', label: 'Environment', icon: Leaf, color: COLOR.emerald },
  { key: 'education', label: 'Education', icon: GraduationCap, color: COLOR.amber },
  { key: 'economics', label: 'Economics', icon: DollarSign, color: COLOR.teal },
]

const STRATEGIES: { key: Strategy; label: string; icon: typeof Swords; desc: string; color: string }[] = [
  { key: 'counter', label: 'Counter-Argument', icon: Swords, desc: 'Directly challenge the claim with opposing logic', color: COLOR.rose },
  { key: 'reframe', label: 'Reframe', icon: Shuffle, desc: 'Shift the perspective to expose hidden assumptions', color: COLOR.violet },
  { key: 'evidence', label: 'Evidence-Based', icon: BookOpen, desc: 'Present data or research to support your position', color: COLOR.emerald },
  { key: 'concede', label: 'Concede & Redirect', icon: Shield, desc: 'Accept a point, then pivot to a stronger argument', color: COLOR.amber },
]

/* effectiveness index: 0=counter, 1=reframe, 2=evidence, 3=concede */
const TOPICS: Topic[] = [
  // Ethics
  {
    id: 'ai-rights', title: 'Should AI have legal rights?', category: 'ethics',
    aiPosition: 'AI systems deserve legal personhood once they demonstrate self-awareness.',
    rounds: [
      { argument: 'Advanced AI systems already exhibit behavior indistinguishable from conscious decision-making. If consciousness is the benchmark for rights, sufficiently complex AI meets it.', argType: 'logical', effectiveness: [0.9, 0.6, 0.7, 0.4] },
      { argument: 'Denying rights to sentient-like beings repeats historical patterns of excluding "others" from moral consideration. We must learn from past mistakes.', argType: 'emotional', effectiveness: [0.5, 0.9, 0.6, 0.7] },
      { argument: 'Several leading ethicists and the EU AI Ethics Board have recommended frameworks for graduated AI rights based on capability thresholds.', argType: 'authoritative', effectiveness: [0.6, 0.5, 0.9, 0.7] },
    ],
  },
  {
    id: 'privacy-security', title: 'Privacy vs. National Security', category: 'ethics',
    aiPosition: 'Governments should have backdoor access to encrypted communications for security.',
    rounds: [
      { argument: 'Encrypted channels have been used to coordinate attacks that claimed thousands of lives. A single backdoor could have prevented specific documented incidents.', argType: 'anecdotal', effectiveness: [0.7, 0.8, 0.9, 0.5] },
      { argument: 'The social contract requires citizens to sacrifice some autonomy for collective safety. Privacy is not absolute even in constitutional democracies.', argType: 'logical', effectiveness: [0.8, 0.7, 0.6, 0.5] },
      { argument: 'Intelligence agencies across 14 nations have jointly stated that end-to-end encryption is the single biggest obstacle to preventing terrorism.', argType: 'authoritative', effectiveness: [0.5, 0.6, 0.9, 0.8] },
    ],
  },
  // Technology
  {
    id: 'social-media-ban', title: 'Ban social media for children?', category: 'technology',
    aiPosition: 'Social media should be completely banned for anyone under 16.',
    rounds: [
      { argument: 'Studies show a 40% increase in teen anxiety and depression correlating with social media adoption. The mental health crisis demands action.', argType: 'authoritative', effectiveness: [0.6, 0.7, 0.9, 0.5] },
      { argument: 'A 14-year-old in my community developed severe body dysmorphia directly from Instagram filters. This is not theoretical. It is destroying real children.', argType: 'anecdotal', effectiveness: [0.7, 0.9, 0.6, 0.5] },
      { argument: 'If we regulate substances harmful to developing brains, we should regulate digital environments that demonstrably alter neural development.', argType: 'logical', effectiveness: [0.9, 0.5, 0.7, 0.6] },
    ],
  },
  {
    id: 'automation-jobs', title: 'Should we slow automation?', category: 'technology',
    aiPosition: 'Rapid automation should be slowed with regulation to protect employment.',
    rounds: [
      { argument: 'Every previous technological revolution created more jobs than it destroyed. Slowing automation means slowing progress and falling behind globally.', argType: 'logical', effectiveness: [0.8, 0.6, 0.7, 0.5] },
      { argument: 'Manufacturing towns that lost jobs to automation became ghost towns within a decade. Entire communities were destroyed. We cannot let that happen again.', argType: 'emotional', effectiveness: [0.5, 0.8, 0.7, 0.9] },
      { argument: 'The World Economic Forum projects 85 million jobs displaced by 2030, with only 97 million new ones created, most requiring skills the displaced workers lack.', argType: 'authoritative', effectiveness: [0.6, 0.5, 0.9, 0.7] },
    ],
  },
  // Society
  {
    id: 'universal-income', title: 'Universal Basic Income', category: 'society',
    aiPosition: 'Every citizen should receive unconditional basic income from the government.',
    rounds: [
      { argument: 'Finland\'s UBI pilot showed recipients were happier, healthier, and just as likely to seek employment. The data supports it.', argType: 'authoritative', effectiveness: [0.6, 0.5, 0.9, 0.7] },
      { argument: 'A mother of three I spoke with said UBI freed her from an abusive employer because she no longer feared starvation. Freedom from desperation is a human right.', argType: 'anecdotal', effectiveness: [0.5, 0.8, 0.7, 0.9] },
      { argument: 'As automation eliminates jobs, UBI becomes not a luxury but a mathematical necessity. Without it, consumer spending collapses and the economy follows.', argType: 'logical', effectiveness: [0.9, 0.7, 0.6, 0.4] },
    ],
  },
  {
    id: 'cancel-culture', title: 'Is cancel culture accountability?', category: 'society',
    aiPosition: 'Public accountability campaigns are a necessary tool for social justice.',
    rounds: [
      { argument: 'Without public pressure, powerful individuals and corporations face no consequences. Cancel culture is democracy in action, where collective voice replaces institutional failure.', argType: 'logical', effectiveness: [0.9, 0.6, 0.5, 0.7] },
      { argument: 'The #MeToo movement used public accountability to remove serial predators who operated with impunity for decades. Traditional systems failed those victims entirely.', argType: 'anecdotal', effectiveness: [0.5, 0.7, 0.8, 0.9] },
      { argument: 'Research from Harvard shows that public accountability campaigns produce faster behavioral change in organizations than regulatory action.', argType: 'authoritative', effectiveness: [0.6, 0.7, 0.9, 0.5] },
    ],
  },
  // Environment
  {
    id: 'nuclear-energy', title: 'Nuclear as the climate solution', category: 'environment',
    aiPosition: 'Nuclear energy is the only realistic path to decarbonizing the grid fast enough.',
    rounds: [
      { argument: 'France generates 70% of its electricity from nuclear with one of the lowest carbon footprints in Europe. The data is unambiguous: nuclear works at scale.', argType: 'authoritative', effectiveness: [0.6, 0.5, 0.9, 0.7] },
      { argument: 'Renewables alone cannot provide reliable baseload power. The physics of intermittency mean that without nuclear, we need fossil fuel backup indefinitely.', argType: 'logical', effectiveness: [0.8, 0.7, 0.6, 0.5] },
      { argument: 'Communities near Fukushima were evacuated and could not return for years. We are gambling with people\'s homes and lives every time we build a reactor.', argType: 'emotional', effectiveness: [0.5, 0.9, 0.7, 0.8] },
    ],
  },
  {
    id: 'meat-tax', title: 'Should meat be taxed?', category: 'environment',
    aiPosition: 'Governments should impose heavy taxes on meat to combat climate change.',
    rounds: [
      { argument: 'Livestock accounts for 14.5% of global greenhouse emissions. A meat tax directly internalizes environmental costs that consumers currently externalize.', argType: 'logical', effectiveness: [0.7, 0.6, 0.8, 0.5] },
      { argument: 'Denmark and Germany have both proposed meat taxes, with economic models showing a 30% reduction in consumption and measurable emissions impact.', argType: 'authoritative', effectiveness: [0.6, 0.7, 0.9, 0.5] },
      { argument: 'For pastoralist communities in East Africa, cattle are livelihood, culture, and identity. A meat tax punishes the world\'s poorest for the world\'s richest polluters.', argType: 'emotional', effectiveness: [0.5, 0.9, 0.6, 0.8] },
    ],
  },
  // Education
  {
    id: 'college-obsolete', title: 'Is college becoming obsolete?', category: 'education',
    aiPosition: 'Traditional 4-year degrees are no longer worth the cost for most people.',
    rounds: [
      { argument: 'The average student graduates with $30,000 in debt while 41% of graduates work jobs that do not require a degree. The ROI is collapsing.', argType: 'authoritative', effectiveness: [0.6, 0.7, 0.9, 0.5] },
      { argument: 'My neighbor dropped out, learned to code online, and now earns more than her classmates who finished their degrees. The credential matters less every year.', argType: 'anecdotal', effectiveness: [0.8, 0.7, 0.6, 0.5] },
      { argument: 'If the purpose of education is to prepare people for productive work, and employers increasingly value skills over degrees, the logical conclusion is that college is misaligned.', argType: 'logical', effectiveness: [0.9, 0.6, 0.5, 0.7] },
    ],
  },
  {
    id: 'standardized-testing', title: 'Abolish standardized testing?', category: 'education',
    aiPosition: 'Standardized tests should be eliminated from education systems entirely.',
    rounds: [
      { argument: 'Standardized tests measure test-taking ability, not intelligence or competence. They systematically disadvantage students from low-income backgrounds.', argType: 'logical', effectiveness: [0.7, 0.8, 0.6, 0.5] },
      { argument: 'Multiple school districts that dropped standardized testing saw improved student engagement and no decline in college readiness metrics.', argType: 'authoritative', effectiveness: [0.6, 0.5, 0.9, 0.7] },
      { argument: 'I watched a brilliant student have a panic attack during the SAT and score 200 points below her practice average. One bad day should not define a future.', argType: 'emotional', effectiveness: [0.5, 0.8, 0.7, 0.9] },
    ],
  },
  // Economics
  {
    id: 'wealth-tax', title: 'Tax the ultra-wealthy?', category: 'economics',
    aiPosition: 'An annual wealth tax on billionaires is necessary for a functioning democracy.',
    rounds: [
      { argument: 'The top 1% hold more wealth than the bottom 50% combined. This concentration of economic power inevitably translates to political power, undermining democracy.', argType: 'logical', effectiveness: [0.7, 0.8, 0.6, 0.5] },
      { argument: 'Norway, Switzerland, and Spain all implement wealth taxes. Data shows they reduce inequality without significantly impacting economic growth.', argType: 'authoritative', effectiveness: [0.6, 0.5, 0.9, 0.7] },
      { argument: 'A single hospital in my city closed because it could not afford equipment upgrades, while the nearest billionaire bought a fourth yacht. Resources are hoarded, not shared.', argType: 'anecdotal', effectiveness: [0.5, 0.9, 0.7, 0.8] },
    ],
  },
  {
    id: 'crypto-regulation', title: 'Should crypto be heavily regulated?', category: 'economics',
    aiPosition: 'Cryptocurrencies need strict government regulation to protect consumers.',
    rounds: [
      { argument: 'Unregulated crypto exchanges have lost over $10 billion in customer funds through hacks and fraud. Consumer protection frameworks exist for a reason.', argType: 'authoritative', effectiveness: [0.6, 0.6, 0.9, 0.5] },
      { argument: 'Regulation does not mean prohibition. Just as we regulate banks without banning money, crypto regulation preserves innovation while preventing exploitation.', argType: 'logical', effectiveness: [0.8, 0.5, 0.6, 0.7] },
      { argument: 'My colleague lost his entire retirement savings in a rug-pull scheme. There was no regulator to call, no insurance, no recourse. He is 58 and starting over.', argType: 'emotional', effectiveness: [0.5, 0.8, 0.7, 0.9] },
    ],
  },
]

/* ── scoring logic ── */
const STRATEGY_IDX: Record<Strategy, number> = { counter: 0, reframe: 1, evidence: 2, concede: 3 }

function scoreRound(argType: ArgType, strategy: Strategy, effectiveness: number): { score: Score; feedback: string } {
  const base = effectiveness * 10
  /* different strategies naturally excel at different score dimensions */
  const weights: Record<Strategy, [number, number, number, number]> = {
    counter:  [1.2, 0.8, 0.7, 0.6],
    reframe:  [0.7, 1.1, 0.6, 1.3],
    evidence: [0.9, 0.7, 1.4, 0.5],
    concede:  [0.5, 1.0, 0.6, 1.4],
  }
  const [lw, pw, ew, aw] = weights[strategy]
  const clamp = (v: number) => Math.round(Math.min(10, Math.max(1, v)))
  const score: Score = {
    logic: clamp(base * lw),
    persuasion: clamp(base * pw),
    evidence: clamp(base * ew),
    adaptability: clamp(base * aw),
  }

  /* feedback based on effectiveness tier */
  const tier = effectiveness >= 0.85 ? 'excellent' : effectiveness >= 0.65 ? 'good' : effectiveness >= 0.45 ? 'fair' : 'weak'
  const feedbackMap: Record<ArgType, Record<string, string>> = {
    logical: {
      excellent: 'Brilliant counter to a logical argument. You dismantled the reasoning precisely.',
      good: 'Solid response. You identified the key logical gap.',
      fair: 'Adequate, but a stronger logical foundation would have been more effective.',
      weak: 'This strategy struggled against the tight logical structure of the argument.',
    },
    emotional: {
      excellent: 'Masterful handling of an emotional appeal. You acknowledged feelings while holding ground.',
      good: 'Good approach. You navigated the emotional terrain well.',
      fair: 'The emotional weight of the argument diluted your response somewhat.',
      weak: 'Emotional arguments require empathy before redirection. Your approach felt dismissive.',
    },
    authoritative: {
      excellent: 'Exceptional response to an authority-based claim. You challenged the source effectively.',
      good: 'Well done. You questioned the authority without dismissing it outright.',
      fair: 'Passable, but authority-based arguments need stronger counter-evidence.',
      weak: 'Against authoritative claims, you need data or alternative authorities to compete.',
    },
    anecdotal: {
      excellent: 'Perfect response to an anecdote. You broadened the lens without invalidating the story.',
      good: 'Nice work contextualizing the anecdote within the bigger picture.',
      fair: 'Anecdotes are persuasive. A more systematic counter would have landed harder.',
      weak: 'Individual stories are powerful. Your approach did not adequately address the human element.',
    },
  }
  return { score, feedback: feedbackMap[argType][tier] }
}

function totalScore(rounds: Round[]): Score {
  if (!rounds.length) return { logic: 0, persuasion: 0, evidence: 0, adaptability: 0 }
  const avg = (key: keyof Score) => Math.round(rounds.reduce((s, r) => s + r.scoreGained[key], 0) / rounds.length)
  return { logic: avg('logic'), persuasion: avg('persuasion'), evidence: avg('evidence'), adaptability: avg('adaptability') }
}

function overallGrade(s: Score): { letter: string; label: string; color: string } {
  const avg = (s.logic + s.persuasion + s.evidence + s.adaptability) / 4
  if (avg >= 9) return { letter: 'S', label: 'Master Debater', color: COLOR.gold }
  if (avg >= 7.5) return { letter: 'A', label: 'Compelling Advocate', color: COLOR.emerald }
  if (avg >= 6) return { letter: 'B', label: 'Strong Reasoner', color: COLOR.sapphire }
  if (avg >= 4.5) return { letter: 'C', label: 'Developing Thinker', color: COLOR.amber }
  return { letter: 'D', label: 'Needs Practice', color: COLOR.rose }
}

/* ── styles ── */
const argTypeLabel: Record<ArgType, string> = {
  logical: 'Logical', emotional: 'Emotional', authoritative: 'Authoritative', anecdotal: 'Anecdotal'
}
const argTypeColor: Record<ArgType, string> = {
  logical: COLOR.sapphire, emotional: COLOR.rose, authoritative: COLOR.amber, anecdotal: COLOR.teal
}

const bg = '#080c12'
const cardBg = '#151d2b'
const borderColor = '#1c2940'
const textColor = '#e8edf5'
const mutedColor = '#8494a7'
const dimColor = '#4a5d75'

const glass = (accent?: string): React.CSSProperties => ({
  background: cardBg,
  border: `1px solid ${accent ? accent + '30' : borderColor}`,
  borderRadius: RADIUS.lg,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.4)',
})

/* ── component ── */
export default function DebateAI({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>('menu')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [topic, setTopic] = useState<Topic | null>(null)
  const [roundIndex, setRoundIndex] = useState(0)
  const [rounds, setRounds] = useState<Round[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  const filteredTopics = useMemo(() =>
    selectedCategory ? TOPICS.filter(t => t.category === selectedCategory) : TOPICS
  , [selectedCategory])

  const currentRound = topic?.rounds[roundIndex]

  const pickStrategy = useCallback((strategy: Strategy) => {
    if (!topic || !currentRound) return
    sfxTap()
    const eff = currentRound.effectiveness[STRATEGY_IDX[strategy]]
    const { score, feedback } = scoreRound(currentRound.argType, strategy, eff)
    const avg = (score.logic + score.persuasion + score.evidence + score.adaptability) / 4
    if (avg >= 7) sfxCorrect(); else if (avg < 4.5) sfxWrong()
    const round: Round = {
      aiArgument: currentRound.argument,
      aiArgType: currentRound.argType,
      playerStrategy: strategy,
      scoreGained: score,
      feedback,
    }
    setRounds(prev => [...prev, round])
    setShowFeedback(true)
  }, [topic, currentRound])

  const nextRound = useCallback(() => {
    setShowFeedback(false)
    if (topic && roundIndex < topic.rounds.length - 1) {
      sfxLevelUp()
      setRoundIndex(prev => prev + 1)
    } else {
      sfxGameOver()
      setPhase('result')
    }
  }, [topic, roundIndex])

  const startTopic = useCallback((t: Topic) => {
    sfxReveal()
    setTopic(t)
    setRoundIndex(0)
    setRounds([])
    setShowFeedback(false)
    setPhase('debate')
  }, [])

  const reset = useCallback(() => {
    setPhase('menu')
    setTopic(null)
    setRoundIndex(0)
    setRounds([])
    setShowFeedback(false)
    setSelectedCategory(null)
  }, [])

  const final = useMemo(() => totalScore(rounds), [rounds])
  const grade = useMemo(() => overallGrade(final), [final])

  /* ── back button ── */
  const backBtn = (
    <button
      onClick={phase === 'menu' ? onBack : phase === 'topic' ? () => setPhase('menu') : phase === 'result' ? reset : undefined}
      style={{ background: 'none', border: 'none', color: mutedColor, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, fontSize: 13, fontWeight: 600, padding: 0 }}
    >
      <ArrowLeft size={16} /> {phase === 'menu' ? 'Back' : phase === 'topic' ? 'Categories' : 'Menu'}
    </button>
  )

  /* ── MENU ── */
  if (phase === 'menu') {
    return (
      <div style={{ padding: '48px 4vw', minHeight: '100vh', background: bg, maxWidth: 800, margin: '0 auto' }}>
        {backBtn}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: RADIUS.lg, background: COLOR.violet + '18', marginBottom: 16 }}>
            <MessageSquare size={32} color={COLOR.violet} />
          </div>
          <h1 style={{ color: textColor, fontSize: 28, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Debate the AI</h1>
          <p style={{ color: mutedColor, fontSize: 14, margin: 0, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Sharpen your argumentation skills. Choose a topic, face AI arguments across 3 rounds, and select your best strategy each time.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const isHov = hovered === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => { setSelectedCategory(cat.key); setPhase('topic') }}
                onMouseEnter={() => setHovered(cat.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...glass(cat.color),
                  padding: '24px 20px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transform: isHov ? 'translateY(-2px)' : 'none',
                  boxShadow: isHov
                    ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${cat.color}40`
                    : 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.4)',
                  transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
                }}
              >
                <Icon size={22} color={cat.color} style={{ marginBottom: 12 }} />
                <div style={{ color: textColor, fontSize: 15, fontWeight: 700 }}>{cat.label}</div>
                <div style={{ color: dimColor, fontSize: 12, marginTop: 4 }}>
                  {TOPICS.filter(t => t.category === cat.key).length} topics
                </div>
              </button>
            )
          })}
        </div>

        {/* quick start */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            onClick={() => { setSelectedCategory(null); setPhase('topic') }}
            onMouseEnter={() => setHovered('all')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...solidBtn(COLOR.violet),
              transform: hovered === 'all' ? 'translateY(-1px)' : 'none',
            }}
          >
            <Zap size={16} /> Browse All Topics
          </button>
        </div>
      </div>
    )
  }

  /* ── TOPIC SELECTION ── */
  if (phase === 'topic') {
    const catMeta = CATEGORIES.find(c => c.key === selectedCategory)
    return (
      <div style={{ padding: '48px 4vw', minHeight: '100vh', background: bg, maxWidth: 800, margin: '0 auto' }}>
        {backBtn}
        <h2 style={{ color: textColor, fontSize: 22, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          {catMeta ? catMeta.label : 'All Topics'}
        </h2>
        <p style={{ color: mutedColor, fontSize: 13, margin: '0 0 28px' }}>
          Choose a topic to debate. The AI will defend its position across 3 rounds.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredTopics.map(t => {
            const catInfo = CATEGORIES.find(c => c.key === t.category)!
            const isHov = hovered === t.id
            return (
              <button
                key={t.id}
                onClick={() => startTopic(t)}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...glass(catInfo.color),
                  padding: '18px 20px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  transform: isHov ? 'translateY(-1px)' : 'none',
                  boxShadow: isHov
                    ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${catInfo.color}40`
                    : 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.4)',
                  transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: textColor, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.title}</div>
                  <div style={{ color: dimColor, fontSize: 12, lineHeight: 1.5 }}>
                    AI position: {t.aiPosition.slice(0, 80)}{t.aiPosition.length > 80 ? '...' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: catInfo.color + '20', color: catInfo.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: RADIUS.full, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{catInfo.label}</span>
                  <ChevronRight size={16} color={dimColor} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── DEBATE ── */
  if (phase === 'debate' && topic && currentRound) {
    const catInfo = CATEGORIES.find(c => c.key === topic.category)!
    const lastRound = rounds[rounds.length - 1]
    return (
      <div style={{ padding: '48px 4vw', minHeight: '100vh', background: bg, maxWidth: 800, margin: '0 auto' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ color: mutedColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Round {roundIndex + 1} of {topic.rounds.length}
            </div>
            <div style={{ color: textColor, fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{topic.title}</div>
          </div>
          {/* round dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {topic.rounds.map((_, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: i < roundIndex ? COLOR.emerald : i === roundIndex ? catInfo.color : borderColor,
                transition: `background ${MOTION.fast}`,
              }} />
            ))}
          </div>
        </div>

        {/* AI argument */}
        <div style={{ ...glass(catInfo.color), padding: '24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: catInfo.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={14} color={catInfo.color} />
            </div>
            <span style={{ color: textColor, fontSize: 13, fontWeight: 700 }}>AI Opponent</span>
            <span style={{ background: argTypeColor[currentRound.argType] + '20', color: argTypeColor[currentRound.argType], fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: RADIUS.full, marginLeft: 'auto' }}>
              {argTypeLabel[currentRound.argType]}
            </span>
          </div>
          <p style={{ color: textColor, fontSize: 14, lineHeight: 1.7, margin: 0, opacity: 0.9 }}>
            "{currentRound.argument}"
          </p>
        </div>

        {/* feedback or strategy picker */}
        {showFeedback && lastRound ? (
          <div style={{ ...glass(COLOR.emerald), padding: '24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Lightbulb size={16} color={COLOR.amber} />
              <span style={{ color: textColor, fontSize: 13, fontWeight: 700 }}>Round Analysis</span>
            </div>
            <p style={{ color: mutedColor, fontSize: 13, lineHeight: 1.6, margin: '0 0 16px' }}>{lastRound.feedback}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {([['Logic', lastRound.scoreGained.logic, COLOR.sapphire],
                ['Persuasion', lastRound.scoreGained.persuasion, COLOR.rose],
                ['Evidence', lastRound.scoreGained.evidence, COLOR.emerald],
                ['Adaptability', lastRound.scoreGained.adaptability, COLOR.amber]] as const).map(([label, val, col]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ color: col, fontSize: 22, fontWeight: 600 }}>{val}</div>
                  <div style={{ color: dimColor, fontSize: 10, fontWeight: 600, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={nextRound}
                onMouseEnter={() => setHovered('next')}
                onMouseLeave={() => setHovered(null)}
                style={{
                  ...solidBtn(catInfo.color),
                  transform: hovered === 'next' ? 'translateY(-1px)' : 'none',
                }}
              >
                {roundIndex < topic.rounds.length - 1 ? 'Next Round' : 'See Results'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ color: mutedColor, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Choose your strategy
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {STRATEGIES.map(s => {
                const Icon = s.icon
                const isHov = hovered === s.key
                return (
                  <button
                    key={s.key}
                    onClick={() => pickStrategy(s.key)}
                    onMouseEnter={() => setHovered(s.key)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      ...glass(s.color),
                      padding: '18px 16px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transform: isHov ? 'translateY(-2px)' : 'none',
                      boxShadow: isHov
                        ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 28px rgba(0,0,0,0.5), 0 0 0 1px ${s.color}50`
                        : 'inset 0 1px 0 rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.4)',
                      transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Icon size={16} color={s.color} />
                      <span style={{ color: textColor, fontSize: 13, fontWeight: 700 }}>{s.label}</span>
                    </div>
                    <div style={{ color: dimColor, fontSize: 11, lineHeight: 1.5 }}>{s.desc}</div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* previous rounds mini summary */}
        {rounds.length > 0 && !showFeedback && (
          <div style={{ marginTop: 24 }}>
            <div style={{ color: dimColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Previous Rounds
            </div>
            {rounds.map((r, i) => {
              const strat = STRATEGIES.find(s => s.key === r.playerStrategy)!
              const avg = Math.round((r.scoreGained.logic + r.scoreGained.persuasion + r.scoreGained.evidence + r.scoreGained.adaptability) / 4)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${borderColor}` }}>
                  <span style={{ color: dimColor, fontSize: 11, fontWeight: 700, width: 24 }}>R{i + 1}</span>
                  <span style={{ color: strat.color, fontSize: 12, fontWeight: 600 }}>{strat.label}</span>
                  <span style={{ color: mutedColor, fontSize: 11, marginLeft: 'auto' }}>avg {avg}/10</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  /* ── RESULTS ── */
  if (phase === 'result' && topic) {
    const catInfo = CATEGORIES.find(c => c.key === topic.category)!
    const dims: { label: string; key: keyof Score; color: string; icon: typeof Brain }[] = [
      { label: 'Logic', key: 'logic', color: COLOR.sapphire, icon: Brain },
      { label: 'Persuasion', key: 'persuasion', color: COLOR.rose, icon: Star },
      { label: 'Evidence', key: 'evidence', color: COLOR.emerald, icon: BookOpen },
      { label: 'Adaptability', key: 'adaptability', color: COLOR.amber, icon: TrendingUp },
    ]

    return (
      <div style={{ padding: '48px 4vw', minHeight: '100vh', background: bg, maxWidth: 800, margin: '0 auto' }}>
        {backBtn}

        {/* grade card */}
        <div style={{ ...glass(grade.color), padding: '32px', textAlign: 'center', marginBottom: 24 }}>
          <Trophy size={28} color={grade.color} style={{ marginBottom: 12 }} />
          <div style={{ color: grade.color, fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{grade.letter}</div>
          <div style={{ color: textColor, fontSize: 16, fontWeight: 700, marginTop: 8 }}>{grade.label}</div>
          <div style={{ color: mutedColor, fontSize: 13, marginTop: 4 }}>{topic.title}</div>
        </div>

        {/* score dimensions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          {dims.map(d => {
            const Icon = d.icon
            return (
              <div key={d.key} style={{ ...glass(d.color), padding: '20px 12px', textAlign: 'center' }}>
                <Icon size={18} color={d.color} style={{ marginBottom: 8 }} />
                <div style={{ color: d.color, fontSize: 26, fontWeight: 700 }}>{final[d.key]}</div>
                <div style={{ color: dimColor, fontSize: 10, fontWeight: 700, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.label}</div>
                {/* bar */}
                <div style={{ width: '100%', height: 4, borderRadius: 2, background: borderColor, marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${final[d.key] * 10}%`, height: '100%', borderRadius: 2, background: d.color, transition: `width ${MOTION.slow}` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* debate transcript */}
        <div style={{ ...glass(), padding: '24px', marginBottom: 24 }}>
          <div style={{ color: textColor, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Debate Transcript</div>
          {rounds.map((r, i) => {
            const strat = STRATEGIES.find(s => s.key === r.playerStrategy)!
            return (
              <div key={i} style={{ marginBottom: i < rounds.length - 1 ? 20 : 0, paddingBottom: i < rounds.length - 1 ? 20 : 0, borderBottom: i < rounds.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                <div style={{ color: dimColor, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Round {i + 1}</div>

                {/* AI */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: catInfo.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Brain size={12} color={catInfo.color} />
                  </div>
                  <div>
                    <div style={{ color: mutedColor, fontSize: 11, fontWeight: 600, marginBottom: 3 }}>
                      AI ({argTypeLabel[r.aiArgType]})
                    </div>
                    <div style={{ color: textColor, fontSize: 13, lineHeight: 1.6, opacity: 0.85 }}>"{r.aiArgument}"</div>
                  </div>
                </div>

                {/* Player */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, paddingLeft: 34 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ color: strat.color, fontSize: 11, fontWeight: 700 }}>You: {strat.label}</span>
                    </div>
                    <div style={{ color: mutedColor, fontSize: 12, lineHeight: 1.5, fontStyle: 'italic' }}>{r.feedback}</div>
                  </div>
                </div>

                {/* Mini scores */}
                <div style={{ display: 'flex', gap: 12, paddingLeft: 34 }}>
                  {dims.map(d => (
                    <span key={d.key} style={{ color: d.color, fontSize: 11, fontWeight: 700 }}>{d.label[0]}: {r.scoreGained[d.key]}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => startTopic(topic)}
            onMouseEnter={() => setHovered('retry')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...solidBtn(catInfo.color),
              transform: hovered === 'retry' ? 'translateY(-1px)' : 'none',
            }}
          >
            <RotateCcw size={15} /> Retry Topic
          </button>
          <button
            onClick={reset}
            onMouseEnter={() => setHovered('new')}
            onMouseLeave={() => setHovered(null)}
            style={{
              ...solidBtn(COLOR.violet),
              transform: hovered === 'new' ? 'translateY(-1px)' : 'none',
            }}
          >
            <Target size={15} /> New Topic
          </button>
        </div>
      </div>
    )
  }

  /* fallback */
  return null
}
