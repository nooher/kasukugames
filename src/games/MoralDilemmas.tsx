import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Scale, Heart, Shield, Users, Brain, Clock, ChevronRight } from 'lucide-react';
import { sfxTap, sfxClick, sfxReveal, sfxLevelUp } from '../lib/sfx';

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
  radiusSm: 8,
  radiusMd: 14,
  radiusLg: 20,
  transition: '300ms ease',
  glass: {
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Moral framework types                                              */
/* ------------------------------------------------------------------ */
type MoralFramework = 'utilitarian' | 'deontological' | 'virtue' | 'care';

const FRAMEWORK_INFO: Record<MoralFramework, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  utilitarian: {
    label: 'Utilitarian',
    color: C.sapphire,
    icon: <Users size={18} />,
    description: 'You prioritize the greatest good for the greatest number. Outcomes matter most to you — you weigh consequences and choose the path that maximizes overall well-being, even when it requires difficult trade-offs.',
  },
  deontological: {
    label: 'Deontological',
    color: C.amber,
    icon: <Scale size={18} />,
    description: 'You believe in universal moral rules that should never be broken, regardless of consequences. Duty, rights, and principles guide your decisions — some actions are simply wrong, no matter the outcome.',
  },
  virtue: {
    label: 'Virtue Ethics',
    color: C.emerald,
    icon: <Brain size={18} />,
    description: 'You focus on character and ask "What would a good person do?" You seek the balanced, wise response that cultivates moral excellence and reflects integrity, courage, and practical wisdom.',
  },
  care: {
    label: 'Care Ethics',
    color: C.violet,
    icon: <Heart size={18} />,
    description: 'You center relationships, empathy, and responsibility to those closest to you. You believe morality arises from our connections and obligations to others, especially the vulnerable.',
  },
};

/* ------------------------------------------------------------------ */
/*  Scenario data                                                      */
/* ------------------------------------------------------------------ */
interface Choice {
  text: string;
  framework: MoralFramework;
}

interface Scenario {
  id: number;
  title: string;
  context: string;
  dilemma: string;
  choices: Choice[];
  icon: React.ReactNode;
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: 'The Runaway Trolley',
    context: 'A trolley is barreling toward five workers on the track. You stand beside a lever that can divert it to a side track where one worker is standing.',
    dilemma: 'Do you pull the lever?',
    icon: <Shield size={24} />,
    choices: [
      { text: 'Pull the lever — saving five lives outweighs one', framework: 'utilitarian' },
      { text: 'Do not intervene — actively causing a death is wrong', framework: 'deontological' },
      { text: 'Consider what a person of integrity would do in this moment', framework: 'virtue' },
    ],
  },
  {
    id: 2,
    title: 'The Transplant Surgeon',
    context: 'You are a surgeon with five patients who will die without organ transplants. A healthy patient comes in for a routine check-up whose organs would save all five.',
    dilemma: 'Would you sacrifice the one to save the five?',
    icon: <Heart size={24} />,
    choices: [
      { text: 'No — harvesting organs violates the patient\'s fundamental rights', framework: 'deontological' },
      { text: 'Consider it — five lives saved is a greater total good', framework: 'utilitarian' },
      { text: 'No — a virtuous doctor would never betray a patient\'s trust', framework: 'virtue' },
    ],
  },
  {
    id: 3,
    title: 'The Whistleblower',
    context: 'You discover your company is dumping toxic waste illegally. Reporting it will likely cost you your job and devastate your family financially, but protect thousands of residents downstream.',
    dilemma: 'Do you blow the whistle?',
    icon: <Scale size={24} />,
    choices: [
      { text: 'Report it — the health of thousands outweighs personal cost', framework: 'utilitarian' },
      { text: 'Report it — honesty and truth-telling are moral duties', framework: 'deontological' },
      { text: 'Protect your family first — your primary obligation is to them', framework: 'care' },
    ],
  },
  {
    id: 4,
    title: 'The Lifeboat',
    context: 'A ship has sunk. Your lifeboat holds 10 safely but 15 are clinging to it. If no one leaves, the boat will sink and all will drown.',
    dilemma: 'How do you decide who stays?',
    icon: <Users size={24} />,
    choices: [
      { text: 'Save 10 at random — maximize the number of survivors', framework: 'utilitarian' },
      { text: 'No one should be forced off — we share the risk equally', framework: 'deontological' },
      { text: 'Prioritize the children and those who depend on others', framework: 'care' },
    ],
  },
  {
    id: 5,
    title: 'The Promising Lie',
    context: 'Your best friend\'s terminal diagnosis gives them six months. They are about to sign a major life contract and ask you directly: "Am I going to be okay?"',
    dilemma: 'Do you tell them the truth?',
    icon: <Heart size={24} />,
    choices: [
      { text: 'Tell the truth — they have a right to make informed decisions', framework: 'deontological' },
      { text: 'Lie to protect them — their remaining time should be peaceful', framework: 'care' },
      { text: 'Find a compassionate way to be honest — courage with kindness', framework: 'virtue' },
    ],
  },
  {
    id: 6,
    title: 'The Surveillance State',
    context: 'The government proposes mandatory surveillance of all digital communications. Data shows it would prevent 90% of terrorist attacks but eliminates all personal privacy.',
    dilemma: 'Do you support the policy?',
    icon: <Shield size={24} />,
    choices: [
      { text: 'Support it — preventing mass casualties justifies the trade-off', framework: 'utilitarian' },
      { text: 'Oppose it — privacy is a fundamental right that cannot be traded', framework: 'deontological' },
      { text: 'Oppose it — a good society does not treat citizens as suspects', framework: 'virtue' },
    ],
  },
  {
    id: 7,
    title: 'The Triage Nurse',
    context: 'Two patients arrive simultaneously. One is a young mother of three. The other is an elderly researcher close to curing a rare disease. You have resources to save only one.',
    dilemma: 'Who do you treat first?',
    icon: <Heart size={24} />,
    choices: [
      { text: 'The researcher — their cure could save thousands more', framework: 'utilitarian' },
      { text: 'The young mother — her children depend on her', framework: 'care' },
      { text: 'Use a fair protocol — no one\'s life is worth more than another\'s', framework: 'deontological' },
    ],
  },
  {
    id: 8,
    title: 'The Stolen Medicine',
    context: 'Your child is gravely ill and needs medicine you cannot afford. The pharmacy has it but refuses to lower the price or offer credit.',
    dilemma: 'Do you steal the medicine?',
    icon: <Scale size={24} />,
    choices: [
      { text: 'Steal it — your child\'s life is the highest priority', framework: 'care' },
      { text: 'Stealing is wrong regardless of the reason', framework: 'deontological' },
      { text: 'A courageous parent does what is needed — but seeks to make it right after', framework: 'virtue' },
    ],
  },
  {
    id: 9,
    title: 'The Self-Driving Car',
    context: 'You are programming an autonomous vehicle\'s emergency protocol. In an unavoidable accident, should the car protect its passenger or minimize total casualties by swerving into a barrier?',
    dilemma: 'How do you program the car?',
    icon: <Brain size={24} />,
    choices: [
      { text: 'Minimize total casualties — the math is clear', framework: 'utilitarian' },
      { text: 'Protect the passenger — you have a duty to those who trust your product', framework: 'care' },
      { text: 'Neither — the car should not be programmed to choose who dies', framework: 'deontological' },
    ],
  },
  {
    id: 10,
    title: 'The War Journalist',
    context: 'You photograph a starving child being stalked by a vulture. Helping the child means losing the photo that could galvanize global aid for millions.',
    dilemma: 'Do you take the photo or help the child?',
    icon: <Users size={24} />,
    choices: [
      { text: 'Take the photo — it will save far more lives through awareness', framework: 'utilitarian' },
      { text: 'Help the child — the person in front of you matters most right now', framework: 'care' },
      { text: 'A person of true character saves the child, then tells the story', framework: 'virtue' },
    ],
  },
  {
    id: 11,
    title: 'The Loyal Employee',
    context: 'Your colleague and close friend has been underperforming. Your manager asks for your honest assessment, knowing your friend will be fired if you tell the truth.',
    dilemma: 'What do you tell your manager?',
    icon: <Scale size={24} />,
    choices: [
      { text: 'Be honest — your duty to the truth and the company comes first', framework: 'deontological' },
      { text: 'Protect your friend — loyalty to those who trust you matters', framework: 'care' },
      { text: 'Find a way to be honest while also helping your friend improve', framework: 'virtue' },
    ],
  },
  {
    id: 12,
    title: 'The Resource Allocation',
    context: 'You lead a nonprofit with limited funds. You can either build a well that serves 500 people for decades or provide emergency food to 2,000 people facing famine this month.',
    dilemma: 'How do you allocate the funds?',
    icon: <Users size={24} />,
    choices: [
      { text: 'Build the well — long-term infrastructure serves more people overall', framework: 'utilitarian' },
      { text: 'Feed the hungry now — you cannot ignore immediate suffering', framework: 'care' },
      { text: 'Both options have merit — choose what reflects the organization\'s core mission', framework: 'virtue' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Hardcoded baseline "average" profile                               */
/* ------------------------------------------------------------------ */
const BASELINE: Record<MoralFramework, number> = {
  utilitarian: 32,
  deontological: 28,
  virtue: 22,
  care: 18,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void;
}

type Phase = 'intro' | 'playing' | 'results';

export default function MoralDilemmas({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<MoralFramework[]>([]);
  const [timer, setTimer] = useState(30);
  const [fade, setFade] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scenario = SCENARIOS[currentIndex];
  const total = SCENARIOS.length;

  /* Timer logic */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setTimer(30);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    if (phase === 'playing') {
      startTimer();
    }
    return clearTimer;
  }, [phase, currentIndex, startTimer, clearTimer]);

  /* Auto-advance when timer hits 0 — skip with no answer recorded */
  useEffect(() => {
    if (timer === 0 && phase === 'playing' && selectedChoice === null) {
      handleTimerExpiry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  const handleTimerExpiry = () => {
    /* Pick a random framework when time runs out */
    const frameworks: MoralFramework[] = ['utilitarian', 'deontological', 'virtue', 'care'];
    const randomFw = frameworks[Math.floor(Math.random() * frameworks.length)];
    advanceToNext(randomFw);
  };

  const advanceToNext = (framework: MoralFramework) => {
    clearTimer();
    const newAnswers = [...answers, framework];
    setAnswers(newAnswers);

    if (currentIndex + 1 >= total) {
      setFade(false);
      setTimeout(() => {
        sfxLevelUp();
        setPhase('results');
        setFade(true);
      }, 300);
    } else {
      setFade(false);
      setTimeout(() => {
        sfxReveal();
        setCurrentIndex(prev => prev + 1);
        setSelectedChoice(null);
        setFade(true);
      }, 300);
    }
  };

  const handleChoice = (index: number) => {
    if (selectedChoice !== null) return;
    sfxTap();
    setSelectedChoice(index);
    const framework = scenario.choices[index].framework;
    setTimeout(() => advanceToNext(framework), 600);
  };

  const handleRestart = () => {
    sfxTap();
    setPhase('intro');
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedChoice(null);
    setTimer(30);
  };

  /* ---- Compute results ---- */
  const computeProfile = (): Record<MoralFramework, number> => {
    const counts: Record<MoralFramework, number> = { utilitarian: 0, deontological: 0, virtue: 0, care: 0 };
    answers.forEach(fw => { counts[fw]++; });
    const t = answers.length || 1;
    return {
      utilitarian: Math.round((counts.utilitarian / t) * 100),
      deontological: Math.round((counts.deontological / t) * 100),
      virtue: Math.round((counts.virtue / t) * 100),
      care: Math.round((counts.care / t) * 100),
    };
  };

  /* ================================================================== */
  /*  Shared styles                                                      */
  /* ================================================================== */
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: C.obsidian,
    color: C.white,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box',
  };

  const cardStyle: React.CSSProperties = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: C.radiusLg,
    padding: '28px',
    width: '100%',
    maxWidth: 640,
    ...C.glass,
  };

  /* ================================================================== */
  /*  INTRO                                                              */
  /* ================================================================== */
  if (phase === 'intro') {
    return (
      <div style={containerStyle}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: C.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              padding: '8px 0',
              marginBottom: 24,
            }}
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: C.rose,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Scale size={32} color={C.white} />
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 12px', color: C.white }}>
              Moral Dilemmas
            </h1>
            <p style={{ fontSize: 15, color: C.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
              Explore 12 classic ethical scenarios with no right or wrong answers. Each choice
              reflects a different moral framework. At the end, discover your unique moral profile.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 28,
            }}>
              {(Object.keys(FRAMEWORK_INFO) as MoralFramework[]).map(fw => {
                const info = FRAMEWORK_INFO[fw];
                return (
                  <div key={fw} style={{
                    background: C.carbon,
                    border: `1px solid ${C.border}`,
                    borderRadius: C.radiusMd,
                    padding: '14px',
                    textAlign: 'left',
                    ...C.glass,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: info.color }}>{info.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: info.color }}>{info.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.5 }}>
                      {info.description.slice(0, 80)}...
                    </p>
                  </div>
                );
              })}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: C.muted,
              fontSize: 13,
              marginBottom: 20,
            }}>
              <Clock size={14} />
              <span>30 seconds per dilemma</span>
            </div>

            <button
              onClick={() => { sfxClick(); setPhase('playing'); setFade(true); }}
              style={{
                width: '100%',
                padding: '14px',
                background: C.rose,
                color: C.white,
                border: 'none',
                borderRadius: C.radiusMd,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                ...C.glass,
              }}
            >
              Begin Exploration
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /*  RESULTS                                                            */
  /* ================================================================== */
  if (phase === 'results') {
    const profile = computeProfile();
    const frameworks = Object.keys(FRAMEWORK_INFO) as MoralFramework[];
    const dominant = frameworks.reduce((a, b) => (profile[a] >= profile[b] ? a : b));

    return (
      <div style={{ ...containerStyle, opacity: fade ? 1 : 0, transition: `opacity ${C.transition}` }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: C.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              padding: '8px 0',
              marginBottom: 24,
            }}
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div style={cardStyle}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>
              Your Moral Profile
            </h2>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 28px', textAlign: 'center' }}>
              Based on your responses across {total} scenarios
            </p>

            {/* Bar chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 }}>
              {frameworks.map(fw => {
                const info = FRAMEWORK_INFO[fw];
                const pct = profile[fw];
                const base = BASELINE[fw];
                return (
                  <div key={fw}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: info.color }}>{info.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{info.label}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: info.color }}>{pct}%</span>
                    </div>
                    {/* Player bar */}
                    <div style={{
                      width: '100%',
                      height: 10,
                      background: C.carbon,
                      borderRadius: 5,
                      overflow: 'hidden',
                      marginBottom: 4,
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: info.color,
                        borderRadius: 5,
                        transition: 'width 800ms ease',
                      }} />
                    </div>
                    {/* Baseline bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        flex: 1,
                        height: 4,
                        background: C.carbon,
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${base}%`,
                          height: '100%',
                          background: C.dim,
                          borderRadius: 2,
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap' }}>avg {base}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dominant framework description */}
            <div style={{
              background: C.carbon,
              border: `1px solid ${FRAMEWORK_INFO[dominant].color}33`,
              borderRadius: C.radiusMd,
              padding: '20px',
              marginBottom: 24,
              ...C.glass,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ color: FRAMEWORK_INFO[dominant].color }}>{FRAMEWORK_INFO[dominant].icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: FRAMEWORK_INFO[dominant].color }}>
                  Primary: {FRAMEWORK_INFO[dominant].label}
                </span>
              </div>
              <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.7 }}>
                {FRAMEWORK_INFO[dominant].description}
              </p>
            </div>

            {/* All framework descriptions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
              {frameworks.filter(fw => fw !== dominant).map(fw => {
                const info = FRAMEWORK_INFO[fw];
                return (
                  <div key={fw} style={{
                    background: C.carbon,
                    border: `1px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    padding: '14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ color: info.color }}>{info.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: info.color }}>{info.label}</span>
                      <span style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}>{profile[fw]}%</span>
                    </div>
                    <p style={{ fontSize: 12, color: C.dim, margin: 0, lineHeight: 1.6 }}>
                      {info.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleRestart}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: C.carbon,
                  color: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusMd,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <button
                onClick={onBack}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: C.rose,
                  color: C.white,
                  border: 'none',
                  borderRadius: C.radiusMd,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  ...C.glass,
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================== */
  /*  PLAYING                                                            */
  /* ================================================================== */
  const timerPct = (timer / 30) * 100;
  const timerColor = timer <= 5 ? C.rose : timer <= 10 ? C.amber : C.dim;

  return (
    <div style={{ ...containerStyle, opacity: fade ? 1 : 0, transition: `opacity ${C.transition}` }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: C.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              padding: '8px 0',
            }}
          >
            <ArrowLeft size={18} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: timerColor }}>
              <Clock size={16} />
              <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{timer}s</span>
            </div>
            <span style={{ fontSize: 13, color: C.muted }}>
              {currentIndex + 1} / {total}
            </span>
          </div>
        </div>

        {/* Timer bar */}
        <div style={{
          width: '100%',
          height: 3,
          background: C.carbon,
          borderRadius: 2,
          marginBottom: 24,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${timerPct}%`,
            height: '100%',
            background: timerColor,
            borderRadius: 2,
            transition: 'width 1s linear, background 300ms ease',
          }} />
        </div>

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          {SCENARIOS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i < currentIndex ? C.rose : i === currentIndex ? C.white : C.dim,
                transition: `background ${C.transition}`,
              }}
            />
          ))}
        </div>

        {/* Scenario card */}
        <div style={cardStyle}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: C.radiusSm,
              background: C.rose,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {scenario.icon}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: C.white }}>
              {scenario.title}
            </h2>
          </div>

          <p style={{
            fontSize: 14,
            color: C.muted,
            lineHeight: 1.7,
            margin: '0 0 16px',
          }}>
            {scenario.context}
          </p>

          <p style={{
            fontSize: 16,
            color: C.white,
            fontWeight: 600,
            lineHeight: 1.5,
            margin: '0 0 24px',
          }}>
            {scenario.dilemma}
          </p>

          {/* Choices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scenario.choices.map((choice, i) => {
              const isSelected = selectedChoice === i;
              const info = FRAMEWORK_INFO[choice.framework];
              return (
                <button
                  key={i}
                  onClick={() => handleChoice(i)}
                  disabled={selectedChoice !== null}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '16px 18px',
                    background: isSelected ? info.color : C.carbon,
                    color: isSelected ? C.white : C.white,
                    border: `1px solid ${isSelected ? info.color : C.border}`,
                    borderRadius: C.radiusMd,
                    fontSize: 14,
                    lineHeight: 1.5,
                    cursor: selectedChoice !== null ? 'default' : 'pointer',
                    opacity: selectedChoice !== null && !isSelected ? 0.4 : 1,
                    transition: `all ${C.transition}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    ...C.glass,
                  }}
                >
                  <span style={{ flex: 1 }}>{choice.text}</span>
                  {isSelected && (
                    <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8, whiteSpace: 'nowrap' }}>
                      {info.label}
                    </span>
                  )}
                  {!isSelected && selectedChoice === null && (
                    <ChevronRight size={16} style={{ opacity: 0.3, flexShrink: 0 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
