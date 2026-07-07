import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  Shield,
  Heart,
  Briefcase,
  BarChart3,
  Target,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { sfxTap, sfxClick, sfxLevelUp } from '../lib/sfx';

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */
const C = {
  obsidian: '#0b0f14',
  ink: '#111820',
  slate: '#1a2230',
  carbon: '#141c28',
  emerald: '#00c97b',
  teal: '#00b4d8',
  sapphire: '#3a86ff',
  violet: '#7b2ff7',
  amber: '#f59e0b',
  rose: '#f43f5e',
  white: '#f0f4f8',
  muted: '#7a8ba0',
  dim: '#3d4f63',
  border: '#1f2d3d',
  surface: '#151d2b',
  radius: { sm: 8, md: 14, lg: 20 },
  shadow: '0 4px 20px rgba(0,0,0,0.5)',
  highlight: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  transition: '300ms ease',
} as const;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Domain = 'Investment' | 'Health' | 'Relationships' | 'Career';

interface ChoiceScenario {
  kind: 'choice';
  domain: Domain;
  prompt: string;
  risky: { label: string; detail: string; score: number };
  safe: { label: string; detail: string; score: number };
}

interface SliderScenario {
  kind: 'slider';
  domain: Domain;
  prompt: string;
  sliderLabel: string;
  lowLabel: string;
  highLabel: string;
}

type Scenario = ChoiceScenario | SliderScenario;

type RiskProfile = 'Conservative' | 'Moderate' | 'Aggressive' | 'Daredevil';

/* ------------------------------------------------------------------ */
/*  Domain config                                                      */
/* ------------------------------------------------------------------ */
const DOMAIN_META: Record<Domain, { color: string; Icon: typeof TrendingUp }> = {
  Investment: { color: C.amber, Icon: TrendingUp },
  Health: { color: C.emerald, Icon: Shield },
  Relationships: { color: C.rose, Icon: Heart },
  Career: { color: C.sapphire, Icon: Briefcase },
};

/* ------------------------------------------------------------------ */
/*  12 scenarios (3 per domain, mix of choice + slider)                */
/* ------------------------------------------------------------------ */
const SCENARIOS: Scenario[] = [
  // --- Investment ---
  {
    kind: 'choice',
    domain: 'Investment',
    prompt: 'You have TSh 1,000,000 saved up. A trusted friend offers you a deal with a 60% chance to triple your money, but a 40% chance to lose it all.',
    risky: { label: 'Go all in', detail: '60% chance to win TSh 3M, 40% chance to lose everything', score: 95 },
    safe: { label: 'Keep it safe', detail: 'Your TSh 1M stays in the bank earning 5% interest', score: 10 },
  },
  {
    kind: 'slider',
    domain: 'Investment',
    prompt: 'You inherit TSh 5,000,000. How much would you put into a volatile but high-growth stock portfolio vs a guaranteed fixed deposit?',
    sliderLabel: 'Amount in volatile stocks',
    lowLabel: 'All fixed deposit',
    highLabel: 'All in stocks',
  },
  {
    kind: 'choice',
    domain: 'Investment',
    prompt: 'Your side business is breaking even. A competitor offers to buy it for TSh 2M today, or you could invest TSh 500K more to grow it — risky but could be worth TSh 10M in 2 years.',
    risky: { label: 'Invest and grow', detail: 'Spend TSh 500K more, aim for TSh 10M in 2 years', score: 85 },
    safe: { label: 'Sell now', detail: 'Take the guaranteed TSh 2M and walk away', score: 15 },
  },

  // --- Health ---
  {
    kind: 'choice',
    domain: 'Health',
    prompt: 'You have a minor knee injury. A marathon you have been training for is in 2 days. Your doctor says running is risky but not dangerous.',
    risky: { label: 'Run the marathon', detail: 'Push through — you trained 6 months for this', score: 80 },
    safe: { label: 'Skip and recover', detail: 'Rest now, there will be other marathons', score: 15 },
  },
  {
    kind: 'slider',
    domain: 'Health',
    prompt: 'A new experimental supplement claims to boost energy by 40%, but long-term studies are incomplete. How willing are you to try it?',
    sliderLabel: 'Willingness to try',
    lowLabel: 'Wait for full studies',
    highLabel: 'Start immediately',
  },
  {
    kind: 'choice',
    domain: 'Health',
    prompt: 'You can get a free health screening today. There is a 5% chance it could reveal something serious. Some people prefer not to know.',
    risky: { label: 'Get the screening', detail: 'Face whatever the results say — knowledge is power', score: 70 },
    safe: { label: 'Skip it for now', detail: 'Ignorance is bliss, you feel fine', score: 20 },
  },

  // --- Relationships ---
  {
    kind: 'choice',
    domain: 'Relationships',
    prompt: 'You have strong feelings for a close friend. Confessing could deepen the bond or ruin the friendship entirely.',
    risky: { label: 'Confess your feelings', detail: 'Risk the friendship for something deeper', score: 90 },
    safe: { label: 'Stay friends', detail: 'Protect what you have, keep feelings private', score: 10 },
  },
  {
    kind: 'slider',
    domain: 'Relationships',
    prompt: 'You are offered a dream job in another city. Your partner cannot move. How far are you willing to stretch the relationship for career opportunity?',
    sliderLabel: 'Priority on career vs relationship',
    lowLabel: 'Stay for the relationship',
    highLabel: 'Take the job no matter what',
  },
  {
    kind: 'choice',
    domain: 'Relationships',
    prompt: 'A friend borrowed TSh 200,000 and hasn\'t paid back. They ask for TSh 300,000 more for an emergency. They have always been loyal.',
    risky: { label: 'Lend the money', detail: 'Trust your friend — loyalty matters most', score: 75 },
    safe: { label: 'Decline gently', detail: 'Protect yourself — they still owe you', score: 20 },
  },

  // --- Career ---
  {
    kind: 'choice',
    domain: 'Career',
    prompt: 'You have a stable government job. A startup offers you equity and 2x salary but it could fold in 6 months.',
    risky: { label: 'Join the startup', detail: '2x pay + equity, but the company might not survive', score: 90 },
    safe: { label: 'Keep the gov job', detail: 'Stable income, pension, predictable life', score: 10 },
  },
  {
    kind: 'slider',
    domain: 'Career',
    prompt: 'You can pitch a bold unconventional idea to your CEO. If it works you get promoted. If it fails you look foolish. How bold do you go?',
    sliderLabel: 'Boldness of the pitch',
    lowLabel: 'Safe, proven idea',
    highLabel: 'Wild, game-changing idea',
  },
  {
    kind: 'choice',
    domain: 'Career',
    prompt: 'You are offered a fully-funded PhD abroad (4 years away) or an immediate promotion to senior manager. The PhD could open bigger doors later.',
    risky: { label: 'Take the PhD', detail: '4 years of sacrifice for potentially bigger future gains', score: 70 },
    safe: { label: 'Take the promotion', detail: 'Immediate reward, proven path upward', score: 25 },
  },
];

/* ------------------------------------------------------------------ */
/*  Population averages (fake data for comparison)                     */
/* ------------------------------------------------------------------ */
const POP_AVG: Record<Domain, number> = {
  Investment: 48,
  Health: 42,
  Relationships: 55,
  Career: 51,
};

/* ------------------------------------------------------------------ */
/*  Helper: classify risk profile                                      */
/* ------------------------------------------------------------------ */
function classify(score: number): RiskProfile {
  if (score < 30) return 'Conservative';
  if (score < 55) return 'Moderate';
  if (score < 75) return 'Aggressive';
  return 'Daredevil';
}

function profileColor(p: RiskProfile): string {
  switch (p) {
    case 'Conservative': return C.teal;
    case 'Moderate': return C.emerald;
    case 'Aggressive': return C.amber;
    case 'Daredevil': return C.rose;
  }
}

function profileInsight(p: RiskProfile, domainScores: Record<Domain, number>): string {
  const highest = (Object.entries(domainScores) as [Domain, number][]).sort((a, b) => b[1] - a[1])[0];
  const lowest = (Object.entries(domainScores) as [Domain, number][]).sort((a, b) => a[1] - b[1])[0];

  const base: Record<RiskProfile, string> = {
    Conservative: 'You value security and predictability. You carefully weigh options before committing and prefer known outcomes over uncertain gains. This serves you well in preserving what you have, though you may sometimes miss opportunities that require a leap of faith.',
    Moderate: 'You strike a balance between caution and ambition. You are willing to take calculated risks when the odds are favorable, but you do not chase reckless bets. This balanced approach tends to produce steady, sustainable growth across life domains.',
    Aggressive: 'You lean into uncertainty with confidence. You see risk as opportunity and are comfortable with volatility. While this can yield outsized rewards, be mindful of the downside in domains where losses are not easily recovered.',
    Daredevil: 'You thrive on bold moves and high stakes. You trust your instincts and are willing to bet big for big returns. This fearless approach can lead to extraordinary outcomes, but also significant setbacks. Your appetite for risk is well above average.',
  };

  return `${base[p]} Notably, you are most risk-tolerant in ${highest[0]} and most cautious in ${lowest[0]}.`;
}

/* ------------------------------------------------------------------ */
/*  Reusable style helpers                                             */
/* ------------------------------------------------------------------ */
const glassCard = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: C.surface,
  borderRadius: C.radius.lg,
  border: `1px solid ${C.border}`,
  boxShadow: `${C.highlight}, ${C.shadow}`,
  ...extra,
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void;
}

type Phase = 'intro' | 'scenario' | 'results';

export default function RiskAppetite({ onBack, onGameEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [sliderVal, setSliderVal] = useState(50);
  const [animating, setAnimating] = useState(false);
  const [hovered, setHovered] = useState<'risky' | 'safe' | null>(null);

  const scenario = SCENARIOS[idx];
  const progress = SCENARIOS.length > 0 ? ((idx) / SCENARIOS.length) * 100 : 0;

  const advance = useCallback((score: number) => {
    sfxTap();
    setAnimating(true);
    setAnswers(prev => [...prev, score]);
    setTimeout(() => {
      if (idx + 1 >= SCENARIOS.length) {
        sfxLevelUp();
        setPhase('results');
      } else {
        setIdx(prev => prev + 1);
        setSliderVal(50);
        setHovered(null);
      }
      setAnimating(false);
    }, 350);
  }, [idx]);

  /* ---- Report score at results ---- */
  useEffect(() => {
    if (phase === 'results' && answers.length >= SCENARIOS.length) {
      const domainScores: Record<Domain, number[]> = {
        Investment: [], Health: [], Relationships: [], Career: [],
      };
      SCENARIOS.forEach((s, i) => { domainScores[s.domain].push(answers[i]); });
      const domainAvg = Object.fromEntries(
        (Object.entries(domainScores) as [Domain, number[]][]).map(([d, scores]) => [
          d, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        ])
      ) as Record<Domain, number>;
      const overall = Math.round(Object.values(domainAvg).reduce((a, b) => a + b, 0) / 4);
      onGameEnd?.({
        score: overall,
        accuracy: 1.0,
        level: 1,
        maxScore: 100,
      });
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* -- Results computation -- */
  const results = useMemo(() => {
    if (answers.length < SCENARIOS.length) return null;

    const domainScores: Record<Domain, number[]> = {
      Investment: [], Health: [], Relationships: [], Career: [],
    };
    SCENARIOS.forEach((s, i) => {
      domainScores[s.domain].push(answers[i]);
    });

    const domainAvg = Object.fromEntries(
      (Object.entries(domainScores) as [Domain, number[]][]).map(([d, scores]) => [
        d,
        Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      ])
    ) as Record<Domain, number>;

    const overall = Math.round(
      Object.values(domainAvg).reduce((a, b) => a + b, 0) / 4
    );

    return { domainAvg, overall, profile: classify(overall) };
  }, [answers]);

  /* ================================================================ */
  /*  INTRO                                                            */
  /* ================================================================ */
  if (phase === 'intro') {
    return (
      <div style={{ minHeight: '100vh', background: C.obsidian, color: C.white, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>Back</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', gap: 32 }}>
          <div style={{
            width: 88, height: 88, borderRadius: C.radius.lg, background: C.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${C.border}`,
            boxShadow: `${C.highlight}, ${C.shadow}`,
          }}>
            <Target size={40} color={C.amber} />
          </div>

          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Risk Appetite
            </h1>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              12 real-life scenarios across Investment, Health, Relationships, and Career.
              There are no right or wrong answers — just discover your true risk tolerance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {(Object.entries(DOMAIN_META) as [Domain, typeof DOMAIN_META.Investment][]).map(([d, m]) => (
              <div key={d} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: C.radius.sm,
                background: C.carbon, border: `1px solid ${C.border}`,
              }}>
                <m.Icon size={16} color={m.color} />
                <span style={{ fontSize: 13, color: C.white, fontWeight: 500 }}>{d}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => { sfxClick(); setPhase('scenario'); }}
            style={{
              background: C.amber, color: C.obsidian, border: 'none',
              borderRadius: C.radius.md, padding: '14px 48px', fontSize: 16,
              fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em',
              boxShadow: C.shadow, transition: C.transition,
            }}
          >
            Begin Discovery
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  RESULTS                                                          */
  /* ================================================================ */
  if (phase === 'results' && results) {
    const pc = profileColor(results.profile);
    const insight = profileInsight(results.profile, results.domainAvg);

    return (
      <div style={{ minHeight: '100vh', background: C.obsidian, color: C.white, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>Back</span>
        </div>

        <div style={{ flex: 1, padding: '0 20px 40px', maxWidth: 520, margin: '0 auto', width: '100%' }}>
          {/* Overall profile */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', background: C.surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', border: `2px solid ${pc}`,
              boxShadow: `${C.highlight}, 0 0 24px ${pc}33`,
            }}>
              <Flame size={36} color={pc} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px', color: pc }}>
              {results.profile}
            </h2>
            <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>
              Overall risk score: {results.overall}/100
            </p>
          </div>

          {/* Domain breakdown */}
          <div style={{ ...glassCard({ padding: '20px 24px', marginBottom: 20 }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BarChart3 size={18} color={C.amber} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>Domain Breakdown</span>
            </div>

            {(Object.entries(DOMAIN_META) as [Domain, typeof DOMAIN_META.Investment][]).map(([domain, meta]) => {
              const score = results.domainAvg[domain];
              const avg = POP_AVG[domain];
              return (
                <div key={domain} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <meta.Icon size={14} color={meta.color} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{domain}</span>
                    </div>
                    <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{score}/100</span>
                  </div>
                  {/* Your score bar */}
                  <div style={{ height: 10, background: C.carbon, borderRadius: 5, position: 'relative', marginBottom: 4 }}>
                    <div style={{
                      height: '100%', borderRadius: 5, background: meta.color,
                      width: `${score}%`, transition: 'width 800ms ease',
                    }} />
                    {/* Population average marker */}
                    <div style={{
                      position: 'absolute', top: -3, left: `${avg}%`, transform: 'translateX(-50%)',
                      width: 2, height: 16, background: C.muted, borderRadius: 1,
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: C.dim }}>You: {score}</span>
                    <span style={{ fontSize: 11, color: C.dim }}>Avg: {avg}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Insight */}
          <div style={{ ...glassCard({ padding: '20px 24px', marginBottom: 24 }) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Target size={18} color={C.amber} />
              <span style={{ fontSize: 15, fontWeight: 600 }}>Your Risk Pattern</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: C.muted, margin: 0 }}>
              {insight}
            </p>
          </div>

          {/* Play again */}
          <button
            onClick={() => { sfxTap(); setPhase('intro'); setIdx(0); setAnswers([]); setSliderVal(50); }}
            style={{
              width: '100%', background: C.surface, color: C.amber, border: `1px solid ${C.border}`,
              borderRadius: C.radius.md, padding: '14px 0', fontSize: 15,
              fontWeight: 600, cursor: 'pointer',
              boxShadow: `${C.highlight}, ${C.shadow}`, transition: C.transition,
            }}
          >
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  SCENARIO                                                         */
  /* ================================================================ */
  const meta = DOMAIN_META[scenario.domain];

  return (
    <div style={{ minHeight: '100vh', background: C.obsidian, color: C.white, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4 }}>
          <ArrowLeft size={22} />
        </button>
        <span style={{ color: C.muted, fontSize: 14, fontWeight: 500 }}>
          {idx + 1} / {SCENARIOS.length}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: C.radius.sm, background: C.carbon, border: `1px solid ${C.border}` }}>
          <meta.Icon size={14} color={meta.color} />
          <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>{scenario.domain}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: C.carbon, margin: '0 20px' }}>
        <div style={{
          height: '100%', background: C.amber, borderRadius: 2,
          width: `${progress}%`, transition: 'width 350ms ease',
        }} />
      </div>

      {/* Card area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '24px 20px',
        opacity: animating ? 0 : 1, transform: animating ? 'translateX(-20px)' : 'translateX(0)',
        transition: `opacity 300ms ease, transform 300ms ease`,
      }}>
        <div style={{ ...glassCard({ padding: '28px 24px', maxWidth: 480, width: '100%' }) }}>
          {/* Prompt */}
          <p style={{ fontSize: 16, lineHeight: 1.7, margin: '0 0 28px', fontWeight: 500 }}>
            {scenario.prompt}
          </p>

          {scenario.kind === 'choice' ? (
            /* -- Binary choice -- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Risky option */}
              <button
                onMouseEnter={() => setHovered('risky')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => advance(scenario.risky.score)}
                style={{
                  background: hovered === 'risky' ? C.carbon : C.ink,
                  border: `1px solid ${hovered === 'risky' ? C.amber : C.border}`,
                  borderRadius: C.radius.md, padding: '16px 20px',
                  textAlign: 'left', cursor: 'pointer', color: C.white,
                  transition: C.transition,
                  boxShadow: hovered === 'risky' ? `${C.highlight}, 0 0 12px ${C.amber}22` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{scenario.risky.label}</span>
                  <Flame size={16} color={C.amber} />
                </div>
                <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{scenario.risky.detail}</span>
              </button>

              {/* Safe option */}
              <button
                onMouseEnter={() => setHovered('safe')}
                onMouseLeave={() => setHovered(null)}
                onClick={() => advance(scenario.safe.score)}
                style={{
                  background: hovered === 'safe' ? C.carbon : C.ink,
                  border: `1px solid ${hovered === 'safe' ? C.teal : C.border}`,
                  borderRadius: C.radius.md, padding: '16px 20px',
                  textAlign: 'left', cursor: 'pointer', color: C.white,
                  transition: C.transition,
                  boxShadow: hovered === 'safe' ? `${C.highlight}, 0 0 12px ${C.teal}22` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{scenario.safe.label}</span>
                  <Shield size={16} color={C.teal} />
                </div>
                <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{scenario.safe.detail}</span>
              </button>
            </div>
          ) : (
            /* -- Slider -- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: C.amber }}>{sliderVal}%</span>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{scenario.sliderLabel}</div>
              </div>

              <div style={{ position: 'relative', padding: '0 4px' }}>
                {/* Track background */}
                <div style={{
                  height: 8, borderRadius: 4, background: C.carbon,
                  position: 'absolute', top: '50%', left: 4, right: 4,
                  transform: 'translateY(-50%)',
                }} />
                {/* Filled track */}
                <div style={{
                  height: 8, borderRadius: 4, background: C.amber,
                  position: 'absolute', top: '50%', left: 4,
                  width: `calc(${sliderVal}% - 8px)`,
                  transform: 'translateY(-50%)',
                  transition: 'width 50ms ease',
                }} />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderVal}
                  onChange={e => setSliderVal(Number(e.target.value))}
                  style={{
                    width: '100%', position: 'relative', zIndex: 1,
                    appearance: 'none', WebkitAppearance: 'none',
                    background: 'transparent', cursor: 'pointer', height: 24,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: C.dim }}>{scenario.lowLabel}</span>
                <span style={{ fontSize: 12, color: C.dim }}>{scenario.highLabel}</span>
              </div>

              <button
                onClick={() => advance(sliderVal)}
                style={{
                  background: C.amber, color: C.obsidian, border: 'none',
                  borderRadius: C.radius.md, padding: '13px 0', fontSize: 15,
                  fontWeight: 700, cursor: 'pointer', marginTop: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: C.shadow, transition: C.transition,
                }}
              >
                Confirm
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
