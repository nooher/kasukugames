import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ArrowLeft, Wind, Clock, RotateCcw, Trophy, Zap, Heart, Shield, Moon, Activity, ChevronRight, AlertTriangle, Info, X } from 'lucide-react'
import { sfxTap, sfxCorrect, sfxLevelUp, sfxGameOver, sfxCountdown, sfxCountdownGo, sfxTimer } from '../lib/sfx'

/* ------------------------------------------------------------------ */
/*  Design tokens                                                     */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#0f1923',
  ink: '#111820',
  card: '#141e2b',
  border: '#1c2a3a',
  accent: '#5ea8c8',
  success: '#5eb89a',
  error: '#c87a7a',
  warning: '#c8a86e',
  text: '#e8edf2',
  muted: '#6e8098',
  dim: '#3a4d62',
  inhale: '#5ea8c8',
  hold: '#c8a86e',
  exhale: '#5eb89a',
  recovery: '#9a7ec8',
} as const

const RADIUS = 14
const PILL = 999

const GLASS = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
} as const

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type BreathMode = 'box' | 'wim_hof' | 'apnea' | 'relaxation' | 'pranayama'
type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'hold_out' | 'recovery' | 'power_breath' | 'rest'
type GamePhase = 'menu' | 'info' | 'countdown' | 'active' | 'round_complete' | 'session_complete'

interface SessionRecord {
  mode: BreathMode
  date: number
  totalTimeMs: number
  roundsCompleted: number
  bestHoldMs: number
  score: number
}

interface PersonalBests {
  bestHoldMs: number
  longestSessionMs: number
  streakDays: number
  lastSessionDate: string
  totalSessions: number
}

/* ------------------------------------------------------------------ */
/*  Mode configurations                                               */
/* ------------------------------------------------------------------ */
interface ModeConfig {
  name: string
  shortDesc: string
  science: string
  citation: string
  totalRounds: number
  icon: typeof Wind
  color: string
}

const MODE_CONFIGS: Record<BreathMode, ModeConfig> = {
  box: {
    name: 'Box Breathing',
    shortDesc: '4-4-4-4 cycle. Used by Navy SEALs for stress control.',
    science: 'Activates the parasympathetic nervous system via vagal tone modulation. The equal-ratio pattern stabilizes CO2 levels, reducing cortisol and adrenaline. Studies show improved HRV and reduced anxiety within 5 minutes.',
    citation: 'Ma et al., 2017 (Frontiers in Psychology). Zaccaro et al., 2018 (Frontiers in Human Neuroscience).',
    totalRounds: 4,
    icon: Shield,
    color: C.inhale,
  },
  wim_hof: {
    name: 'Wim Hof Method',
    shortDesc: '30 power breaths, max hold, 15s recovery. 3 rounds.',
    science: 'Controlled hyperventilation lowers CO2 and raises blood pH (respiratory alkalosis). The subsequent breath hold triggers the diving reflex, activating spleen contraction and adrenaline release. Studies show voluntary influence over the innate immune response.',
    citation: 'Kox et al., 2014 (PNAS). Muzik et al., 2018 (NeuroImage).',
    totalRounds: 3,
    icon: Zap,
    color: C.warning,
  },
  apnea: {
    name: 'Apnea Training',
    shortDesc: 'Progressive breath holds with rest. Builds CO2 tolerance.',
    science: 'Gradually extends breath-hold capacity by training chemoreceptor tolerance to elevated CO2 and reduced O2. Increases oxygen efficiency and strengthens the diaphragm. Used by freedivers to extend static apnea times.',
    citation: 'Schagatay et al., 2012 (Respiratory Physiology & Neurobiology). Lindholm & Lundgren, 2009 (J Appl Physiol).',
    totalRounds: 5,
    icon: Activity,
    color: C.accent,
  },
  relaxation: {
    name: '4-7-8 Relaxation',
    shortDesc: 'Inhale 4s, Hold 7s, Exhale 8s. For sleep and anxiety.',
    science: 'The extended exhale activates the parasympathetic branch, lowering heart rate and blood pressure. The prolonged hold allows full gas exchange. Dr. Andrew Weil popularized this as a "natural tranquilizer for the nervous system."',
    citation: 'Weil, 2015 (Arizona Center for Integrative Medicine). Jerath et al., 2006 (Medical Hypotheses).',
    totalRounds: 4,
    icon: Moon,
    color: C.recovery,
  },
  pranayama: {
    name: 'Alternate Nostril',
    shortDesc: 'Nadi Shodhana: left in, hold, right out, right in, hold, left out.',
    science: 'Balances sympathetic and parasympathetic activation across both hemispheres. fMRI studies show bilateral cortical activation. Improves cardiovascular function, lowers systolic blood pressure, and improves respiratory endurance.',
    citation: 'Telles et al., 2014 (Int J Yoga). Ghiya & Lee, 2012 (Medical Science Monitor).',
    totalRounds: 6,
    icon: Wind,
    color: C.success,
  },
} as const

const MODE_ORDER: BreathMode[] = ['box', 'wim_hof', 'apnea', 'relaxation', 'pranayama']

/* ------------------------------------------------------------------ */
/*  Safety warnings                                                   */
/* ------------------------------------------------------------------ */
const SAFETY_WARNINGS = [
  'Stop immediately if you feel dizzy, lightheaded, or see spots.',
  'Never practice breath holds in or near water.',
  'Consult a doctor if you have respiratory or cardiovascular conditions.',
  'Do not practice while driving or operating machinery.',
  'If you have epilepsy, uncontrolled hypertension, or are pregnant, consult your physician first.',
] as const

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const LS_KEY_RECORDS = 'breathHold_records'
const LS_KEY_BESTS = 'breathHold_bests'

function loadRecords(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY_RECORDS)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveRecords(records: SessionRecord[]) {
  try {
    // Keep last 100 sessions
    localStorage.setItem(LS_KEY_RECORDS, JSON.stringify(records.slice(-100)))
  } catch { /* noop */ }
}

function loadBests(): PersonalBests {
  try {
    const raw = localStorage.getItem(LS_KEY_BESTS)
    return raw ? JSON.parse(raw) : { bestHoldMs: 0, longestSessionMs: 0, streakDays: 0, lastSessionDate: '', totalSessions: 0 }
  } catch {
    return { bestHoldMs: 0, longestSessionMs: 0, streakDays: 0, lastSessionDate: '', totalSessions: 0 }
  }
}

function saveBests(bests: PersonalBests) {
  try { localStorage.setItem(LS_KEY_BESTS, JSON.stringify(bests)) } catch { /* noop */ }
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  if (min > 0) return `${min}:${sec.toString().padStart(2, '0')}`
  return `${sec}s`
}

function formatTimePrecise(ms: number): string {
  const sec = ms / 1000
  if (sec < 60) return `${sec.toFixed(1)}s`
  const min = Math.floor(sec / 60)
  const remSec = sec - min * 60
  return `${min}:${remSec.toFixed(0).padStart(2, '0')}`
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function getPhaseColor(phase: BreathPhase): string {
  switch (phase) {
    case 'inhale': return C.inhale
    case 'hold': case 'hold_out': return C.hold
    case 'exhale': return C.exhale
    case 'recovery': return C.recovery
    case 'power_breath': return C.warning
    case 'rest': return C.dim
  }
}

function getPhaseLabel(phase: BreathPhase, mode: BreathMode): string {
  switch (phase) {
    case 'inhale':
      if (mode === 'pranayama') return 'INHALE (LEFT)'
      return 'INHALE'
    case 'hold': return 'HOLD'
    case 'hold_out': return 'HOLD (EMPTY)'
    case 'exhale':
      if (mode === 'pranayama') return 'EXHALE (RIGHT)'
      return 'EXHALE'
    case 'recovery': return 'RECOVERY BREATH'
    case 'power_breath': return 'POWER BREATH'
    case 'rest': return 'REST'
  }
}

/** Estimate heart rate zone from breathing pattern */
function estimateHRZone(phase: BreathPhase, mode: BreathMode, holdDurationMs: number): { bpm: string; zone: string; color: string } {
  if (mode === 'wim_hof' && phase === 'power_breath') {
    return { bpm: '90-110', zone: 'Elevated', color: C.warning }
  }
  if (phase === 'hold' || phase === 'hold_out') {
    const secs = holdDurationMs / 1000
    if (secs > 60) return { bpm: '45-55', zone: 'Deep Calm', color: C.recovery }
    if (secs > 30) return { bpm: '50-60', zone: 'Relaxed', color: C.success }
    return { bpm: '55-65', zone: 'Calm Hold', color: C.success }
  }
  if (phase === 'inhale') return { bpm: '65-75', zone: 'Active Intake', color: C.inhale }
  if (phase === 'exhale') return { bpm: '55-65', zone: 'Parasympathetic', color: C.exhale }
  return { bpm: '60-70', zone: 'Resting', color: C.muted }
}

/* ------------------------------------------------------------------ */
/*  Breathing sequence generators                                     */
/* ------------------------------------------------------------------ */
interface BreathStep {
  phase: BreathPhase
  durationMs: number
  /** -1 means user-controlled (hold as long as possible) */
  userControlled?: boolean
  nostril?: 'left' | 'right'
}

function generateBoxSequence(): BreathStep[] {
  // One cycle: inhale 4, hold 4, exhale 4, hold 4
  return [
    { phase: 'inhale', durationMs: 4000 },
    { phase: 'hold', durationMs: 4000 },
    { phase: 'exhale', durationMs: 4000 },
    { phase: 'hold_out', durationMs: 4000 },
  ]
}

function generateWimHofSequence(round: number): BreathStep[] {
  // 30 power breaths (simplified as rapid in/out), then max hold, then recovery
  void round
  const steps: BreathStep[] = []
  for (let i = 0; i < 30; i++) {
    steps.push({ phase: 'power_breath', durationMs: 1500 }) // quick deep inhale+let go
  }
  steps.push({ phase: 'hold_out', durationMs: -1, userControlled: true }) // hold as long as possible
  steps.push({ phase: 'recovery', durationMs: 15000 }) // recovery inhale+hold 15s
  return steps
}

function generateApneaSequence(round: number): BreathStep[] {
  // Progressive: start at 20s hold, increase 10% each round, with rest between
  const baseHold = 20000
  const holdTime = Math.round(baseHold * Math.pow(1.1, round))
  return [
    { phase: 'inhale', durationMs: 4000 },
    { phase: 'hold', durationMs: holdTime },
    { phase: 'exhale', durationMs: 4000 },
    { phase: 'rest', durationMs: Math.max(holdTime, 20000) }, // rest at least as long as hold
  ]
}

function generateRelaxationSequence(): BreathStep[] {
  // 4-7-8 pattern
  return [
    { phase: 'inhale', durationMs: 4000 },
    { phase: 'hold', durationMs: 7000 },
    { phase: 'exhale', durationMs: 8000 },
  ]
}

function generatePranayamaSequence(): BreathStep[] {
  // Alternate nostril: L-in, hold, R-out, R-in, hold, L-out
  return [
    { phase: 'inhale', durationMs: 4000, nostril: 'left' },
    { phase: 'hold', durationMs: 4000 },
    { phase: 'exhale', durationMs: 4000, nostril: 'right' },
    { phase: 'inhale', durationMs: 4000, nostril: 'right' },
    { phase: 'hold', durationMs: 4000 },
    { phase: 'exhale', durationMs: 4000, nostril: 'left' },
  ]
}

function getSequenceForMode(mode: BreathMode, round: number): BreathStep[] {
  switch (mode) {
    case 'box': return generateBoxSequence()
    case 'wim_hof': return generateWimHofSequence(round)
    case 'apnea': return generateApneaSequence(round)
    case 'relaxation': return generateRelaxationSequence()
    case 'pranayama': return generatePranayamaSequence()
  }
}

/* ------------------------------------------------------------------ */
/*  Breathing Circle Component                                        */
/* ------------------------------------------------------------------ */
function BreathingCircle({ phase, progress, color, size = 200, nostril }: {
  phase: BreathPhase
  progress: number // 0-1
  color: string
  size?: number
  nostril?: 'left' | 'right'
}) {
  // Scale: inhale expands (0.4 -> 1.0), exhale contracts (1.0 -> 0.4), hold stays at current
  let scale: number
  let opacity: number

  switch (phase) {
    case 'inhale':
      scale = 0.4 + progress * 0.6
      opacity = 0.5 + progress * 0.4
      break
    case 'exhale':
      scale = 1.0 - progress * 0.6
      opacity = 0.9 - progress * 0.4
      break
    case 'hold':
      scale = 1.0
      opacity = 0.7 + Math.sin(progress * Math.PI * 4) * 0.15
      break
    case 'hold_out':
      scale = 0.4
      opacity = 0.5 + Math.sin(progress * Math.PI * 2) * 0.1
      break
    case 'power_breath':
      // Rapid pulsing
      scale = 0.5 + Math.abs(Math.sin(progress * Math.PI)) * 0.5
      opacity = 0.6 + Math.abs(Math.sin(progress * Math.PI)) * 0.3
      break
    case 'recovery':
      scale = 0.7 + Math.sin(progress * Math.PI * 0.5) * 0.2
      opacity = 0.6 + progress * 0.2
      break
    case 'rest':
      scale = 0.5
      opacity = 0.4 + Math.sin(progress * Math.PI * 2) * 0.1
      break
  }

  const circleSize = size * scale

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Outer ring */}
      <div style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${color}20`,
      }} />
      {/* Inner circle */}
      <div style={{
        width: circleSize,
        height: circleSize,
        borderRadius: '50%',
        background: color,
        opacity,
        transition: phase === 'power_breath'
          ? 'width 200ms ease, height 200ms ease, opacity 200ms ease'
          : 'width 800ms cubic-bezier(.2,.65,.3,.9), height 800ms cubic-bezier(.2,.65,.3,.9), opacity 600ms ease',
        boxShadow: `0 0 ${30 + scale * 20}px ${color}30, 0 0 ${60 + scale * 40}px ${color}15`,
      }} />
      {/* Nostril indicator for pranayama */}
      {nostril && (
        <div style={{
          position: 'absolute',
          top: -8,
          [nostril === 'left' ? 'left' : 'right']: size * 0.25,
          background: color,
          color: C.bg,
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: PILL,
          letterSpacing: '0.05em',
        }}>
          {nostril === 'left' ? 'L' : 'R'}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void
}

export default function BreathHold({ onBack, onGameEnd }: Props) {
  /* ---- Core state ---- */
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu')
  const [selectedMode, setSelectedMode] = useState<BreathMode>('box')
  const [infoMode, setInfoMode] = useState<BreathMode | null>(null)
  const [showSafety, setShowSafety] = useState(false)

  /* ---- Session state ---- */
  const [currentRound, setCurrentRound] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [sequence, setSequence] = useState<BreathStep[]>([])
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale')
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [phaseTimeMs, setPhaseTimeMs] = useState(0)
  const [totalTimeMs, setTotalTimeMs] = useState(0)
  const [score, setScore] = useState(0)
  const [sessionBestHold, setSessionBestHold] = useState(0)
  const [currentHoldMs, setCurrentHoldMs] = useState(0)
  const [wimHofBreathCount, setWimHofBreathCount] = useState(0)
  const [countdownValue, setCountdownValue] = useState(3)
  const [roundHoldTimes, setRoundHoldTimes] = useState<number[]>([])

  /* ---- Persistence state ---- */
  const [records, setRecords] = useState<SessionRecord[]>(() => loadRecords())
  const [bests, setBests] = useState<PersonalBests>(() => loadBests())

  /* ---- Refs ---- */
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionStartRef = useRef(Date.now())
  const phaseStartRef = useRef(Date.now())
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const userHoldActiveRef = useRef(false)

  /* ---- Cleanup ---- */
  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }, [])

  useEffect(() => () => clearAllTimers(), [clearAllTimers])

  /* ---- Personal bests updater ---- */
  const updateBests = useCallback((holdMs: number, sessionMs: number) => {
    setBests(prev => {
      const today = todayStr()
      let streakDays = prev.streakDays
      if (prev.lastSessionDate) {
        const lastDate = new Date(prev.lastSessionDate)
        const todayDate = new Date(today)
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000)
        if (diffDays === 1) {
          streakDays = prev.streakDays + 1
        } else if (diffDays > 1) {
          streakDays = 1
        }
        // Same day: keep streak
      } else {
        streakDays = 1
      }

      const next: PersonalBests = {
        bestHoldMs: Math.max(prev.bestHoldMs, holdMs),
        longestSessionMs: Math.max(prev.longestSessionMs, sessionMs),
        streakDays,
        lastSessionDate: today,
        totalSessions: prev.totalSessions + 1,
      }
      saveBests(next)
      return next
    })
  }, [])

  /* ---- HR estimation ---- */
  const hrEstimate = useMemo(() =>
    estimateHRZone(breathPhase, selectedMode, currentHoldMs),
    [breathPhase, selectedMode, currentHoldMs]
  )

  /* ---- Countdown ---- */
  const startCountdown = useCallback(() => {
    sfxTap()
    setGamePhase('countdown')
    setCountdownValue(3)

    let count = 3
    const cdInterval = setInterval(() => {
      count--
      if (count > 0) {
        sfxCountdown()
        setCountdownValue(count)
      } else {
        clearInterval(cdInterval)
        sfxCountdownGo()
        beginSession()
      }
    }, 1000)

    intervalRef.current = cdInterval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode])

  /* ---- Begin session ---- */
  const beginSession = useCallback(() => {
    sessionStartRef.current = Date.now()
    setCurrentRound(0)
    setScore(0)
    setSessionBestHold(0)
    setTotalTimeMs(0)
    setRoundHoldTimes([])
    setWimHofBreathCount(0)
    startRound(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode])

  /* ---- Start a round ---- */
  const startRound = useCallback((roundNum: number) => {
    const seq = getSequenceForMode(selectedMode, roundNum)
    setSequence(seq)
    setCurrentStepIndex(0)
    setCurrentRound(roundNum)
    setGamePhase('active')
    userHoldActiveRef.current = false
    startStep(seq, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMode])

  /* ---- Start a step within a round ---- */
  const startStep = useCallback((seq: BreathStep[], stepIdx: number) => {
    clearAllTimers()
    if (stepIdx >= seq.length) {
      // Round complete
      completeRound()
      return
    }

    const step = seq[stepIdx]
    setBreathPhase(step.phase)
    setPhaseProgress(0)
    setPhaseTimeMs(0)
    setCurrentHoldMs(0)
    phaseStartRef.current = Date.now()

    if (step.phase === 'power_breath') {
      setWimHofBreathCount(stepIdx + 1)
    }

    if (step.userControlled) {
      // User-controlled hold -- no auto-advance
      userHoldActiveRef.current = true
      tickRef.current = setInterval(() => {
        const elapsed = Date.now() - phaseStartRef.current
        setPhaseTimeMs(elapsed)
        setCurrentHoldMs(elapsed)
        setTotalTimeMs(Date.now() - sessionStartRef.current)
        // Slow pulse for progress display
        setPhaseProgress((elapsed / 1000 % 4) / 4)
        // Periodic timer tick
        if (Math.floor(elapsed / 1000) !== Math.floor((elapsed - 50) / 1000)) {
          sfxTimer()
        }
      }, 50)
    } else {
      // Timed step
      const dur = step.durationMs
      tickRef.current = setInterval(() => {
        const elapsed = Date.now() - phaseStartRef.current
        const prog = Math.min(elapsed / dur, 1)
        setPhaseProgress(prog)
        setPhaseTimeMs(elapsed)
        setTotalTimeMs(Date.now() - sessionStartRef.current)
        if (step.phase === 'hold' || step.phase === 'hold_out') {
          setCurrentHoldMs(elapsed)
        }

        if (prog >= 1) {
          // Auto-advance to next step
          if (step.phase === 'hold' || step.phase === 'hold_out') {
            setSessionBestHold(prev => Math.max(prev, elapsed))
          }
          sfxTap()
          const nextIdx = stepIdx + 1
          setCurrentStepIndex(nextIdx)
          startStep(seq, nextIdx)
        }
      }, 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearAllTimers])

  /* ---- End user-controlled hold ---- */
  const endUserHold = useCallback(() => {
    if (!userHoldActiveRef.current) return
    userHoldActiveRef.current = false
    const holdTime = Date.now() - phaseStartRef.current
    setSessionBestHold(prev => Math.max(prev, holdTime))
    setRoundHoldTimes(prev => [...prev, holdTime])
    sfxCorrect()

    // Award score for hold duration
    const holdScore = Math.round(holdTime / 100)
    setScore(prev => prev + holdScore)

    // Advance to next step
    const nextIdx = currentStepIndex + 1
    setCurrentStepIndex(nextIdx)
    startStep(sequence, nextIdx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStepIndex, sequence])

  /* ---- Complete a round ---- */
  const completeRound = useCallback(() => {
    clearAllTimers()
    sfxLevelUp()

    // Score for round completion
    const roundBonus = 100 + currentRound * 25
    setScore(prev => prev + roundBonus)

    const config = MODE_CONFIGS[selectedMode]
    const nextRound = currentRound + 1

    if (nextRound >= config.totalRounds) {
      // Session complete
      finishSession()
    } else {
      setGamePhase('round_complete')
      // Auto-advance after brief pause
      setTimeout(() => {
        startRound(nextRound)
      }, 2500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearAllTimers, currentRound, selectedMode])

  /* ---- Finish session ---- */
  const finishSession = useCallback(() => {
    clearAllTimers()
    sfxGameOver()
    const totalMs = Date.now() - sessionStartRef.current
    setTotalTimeMs(totalMs)
    setGamePhase('session_complete')

    const config = MODE_CONFIGS[selectedMode]

    // Calculate final score
    const finalScore = score + 200 // completion bonus

    // Compute adherence (accuracy): how well they followed timing
    const accuracy = Math.min(1, (currentRound + 1) / config.totalRounds)

    // Save record
    const record: SessionRecord = {
      mode: selectedMode,
      date: Date.now(),
      totalTimeMs: totalMs,
      roundsCompleted: currentRound + 1,
      bestHoldMs: sessionBestHold,
      score: finalScore,
    }
    const newRecords = [...records, record]
    setRecords(newRecords)
    saveRecords(newRecords)

    // Update personal bests
    updateBests(sessionBestHold, totalMs)

    // Report to parent
    onGameEnd?.({
      score: finalScore,
      accuracy,
      level: currentRound + 1,
      maxScore: config.totalRounds * 200 + 200,
      timeMs: totalMs,
    })

    setScore(finalScore)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearAllTimers, selectedMode, score, currentRound, sessionBestHold, records, updateBests, onGameEnd])

  /* ---- Abort session ---- */
  const abortSession = useCallback(() => {
    clearAllTimers()
    userHoldActiveRef.current = false
    setGamePhase('menu')
  }, [clearAllTimers])

  /* ---- Mode records ---- */
  const modeRecords = useMemo(() => {
    return records.filter(r => r.mode === selectedMode).slice(-10)
  }, [records, selectedMode])

  const currentStep = sequence[currentStepIndex] || null

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  const config = MODE_CONFIGS[selectedMode]

  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: `1px solid ${C.border}`,
        position: 'relative',
        zIndex: 10,
      }}>
        <button
          onClick={gamePhase === 'active' || gamePhase === 'countdown' ? abortSession : onBack}
          style={{
            background: 'none',
            border: 'none',
            color: C.muted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            padding: 0,
          }}
        >
          <ArrowLeft size={18} />
          {gamePhase === 'active' || gamePhase === 'countdown' ? 'Stop' : 'Back'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Wind size={18} color={C.accent} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Breath Hold</span>
        </div>
        <button
          onClick={() => setShowSafety(true)}
          style={{
            background: 'none',
            border: 'none',
            color: C.warning,
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <AlertTriangle size={18} />
        </button>
      </div>

      {/* ---- SAFETY MODAL ---- */}
      {showSafety && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: C.card,
            borderRadius: RADIUS,
            padding: 24,
            maxWidth: 400,
            width: '100%',
            border: `1px solid ${C.border}`,
            ...GLASS,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color={C.warning} />
                <h2 style={{ fontSize: 18, fontWeight: 600, color: C.warning }}>Safety Warnings</h2>
              </div>
              <button
                onClick={() => setShowSafety(false)}
                style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>
            {SAFETY_WARNINGS.map((w, i) => (
              <div key={i} style={{
                display: 'flex',
                gap: 10,
                padding: '10px 0',
                borderTop: i > 0 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: C.error,
                  flexShrink: 0,
                  marginTop: 6,
                }} />
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- INFO MODAL ---- */}
      {infoMode !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: C.card,
            borderRadius: RADIUS,
            padding: 24,
            maxWidth: 420,
            width: '100%',
            border: `1px solid ${C.border}`,
            ...GLASS,
          }}>
            {(() => {
              const mConfig = MODE_CONFIGS[infoMode]
              const ModeIcon = mConfig.icon
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ModeIcon size={20} color={mConfig.color} />
                      <h2 style={{ fontSize: 18, fontWeight: 600, color: mConfig.color }}>{mConfig.name}</h2>
                    </div>
                    <button
                      onClick={() => setInfoMode(null)}
                      style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0 }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                      PHYSIOLOGICAL BASIS
                    </h3>
                    <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{mConfig.science}</p>
                  </div>
                  <div style={{
                    background: C.bg,
                    borderRadius: 10,
                    padding: 12,
                    border: `1px solid ${C.border}`,
                  }}>
                    <h3 style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 6 }}>
                      REFERENCES
                    </h3>
                    <p style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>{mConfig.citation}</p>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* ---- MENU ---- */}
      {gamePhase === 'menu' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 20px',
          gap: 20,
          maxWidth: 440,
          margin: '0 auto',
        }}>
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: C.accent, marginBottom: 6 }}>
              Breath Hold Challenge
            </h1>
            <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
              Respiratory training backed by science. Build CO2 tolerance, activate your parasympathetic system, and improve breath-hold capacity.
            </p>
          </div>

          {/* Personal bests bar */}
          {bests.totalSessions > 0 && (
            <div style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              {[
                { label: 'Best Hold', value: formatTime(bests.bestHoldMs), icon: Clock, color: C.hold },
                { label: 'Longest', value: formatTime(bests.longestSessionMs), icon: Trophy, color: C.warning },
                { label: 'Streak', value: `${bests.streakDays}d`, icon: Zap, color: C.success },
                { label: 'Sessions', value: String(bests.totalSessions), icon: Activity, color: C.accent },
              ].map((stat, i) => {
                const StatIcon = stat.icon
                return (
                  <div key={i} style={{
                    padding: '8px 12px',
                    background: C.card,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    textAlign: 'center',
                    minWidth: 72,
                    ...GLASS,
                  }}>
                    <StatIcon size={14} color={stat.color} />
                    <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 2 }}>{stat.value}</p>
                    <p style={{ fontSize: 9, color: C.muted, letterSpacing: '0.04em' }}>{stat.label}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Mode selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MODE_ORDER.map(mode => {
              const mc = MODE_CONFIGS[mode]
              const ModeIcon = mc.icon
              const isSelected = selectedMode === mode
              return (
                <button
                  key={mode}
                  onClick={() => { sfxTap(); setSelectedMode(mode) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    background: isSelected ? mc.color + '18' : C.card,
                    borderRadius: RADIUS,
                    border: `1.5px solid ${isSelected ? mc.color + '50' : C.border}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    ...GLASS,
                    transition: 'border-color 200ms ease, background 200ms ease',
                  }}
                >
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: isSelected ? mc.color : C.dim,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 200ms ease',
                  }}>
                    <ModeIcon size={20} color={isSelected ? C.bg : C.muted} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: isSelected ? mc.color : C.text }}>
                      {mc.name}
                    </p>
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>
                      {mc.shortDesc}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setInfoMode(mode) }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.dim,
                      cursor: 'pointer',
                      padding: 4,
                      flexShrink: 0,
                    }}
                  >
                    <Info size={16} />
                  </button>
                </button>
              )
            })}
          </div>

          {/* Session history mini */}
          {modeRecords.length > 0 && (
            <div style={{
              padding: 14,
              background: C.card,
              borderRadius: RADIUS,
              border: `1px solid ${C.border}`,
              ...GLASS,
            }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
                Recent {config.name} Sessions
              </h3>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 40 }}>
                {modeRecords.map((r, i) => {
                  const maxScore = Math.max(...modeRecords.map(rr => rr.score), 1)
                  const h = Math.max(4, (r.score / maxScore) * 36)
                  return (
                    <div
                      key={i}
                      title={`Score: ${r.score} | Hold: ${formatTime(r.bestHoldMs)}`}
                      style={{
                        flex: 1,
                        height: h,
                        background: config.color,
                        borderRadius: 3,
                        opacity: 0.4 + (i / modeRecords.length) * 0.6,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Start button */}
          <button
            onClick={startCountdown}
            style={{
              padding: '14px 48px',
              background: config.color,
              color: C.bg,
              border: 'none',
              borderRadius: PILL,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              ...GLASS,
            }}
          >
            Begin Session
            <ChevronRight size={18} />
          </button>

          {/* Safety reminder */}
          <button
            onClick={() => setShowSafety(true)}
            style={{
              background: 'none',
              border: 'none',
              color: C.dim,
              cursor: 'pointer',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 0,
            }}
          >
            <AlertTriangle size={12} />
            Read safety warnings before starting
          </button>
        </div>
      )}

      {/* ---- COUNTDOWN ---- */}
      {gamePhase === 'countdown' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          gap: 24,
        }}>
          <p style={{ color: C.muted, fontSize: 14, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            {config.name}
          </p>
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 56,
            fontWeight: 600,
            color: C.bg,
            boxShadow: `0 0 40px ${config.color}40`,
          }}>
            {countdownValue}
          </div>
          <p style={{ color: C.dim, fontSize: 13 }}>Get comfortable and relax</p>
        </div>
      )}

      {/* ---- ACTIVE SESSION ---- */}
      {gamePhase === 'active' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 20px',
          gap: 16,
        }}>
          {/* Top stats bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: C.card,
              borderRadius: PILL,
              border: `1px solid ${C.border}`,
            }}>
              <Clock size={14} color={C.muted} />
              <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {formatTimePrecise(totalTimeMs)}
              </span>
            </div>
            <div style={{
              padding: '4px 12px',
              background: C.card,
              borderRadius: PILL,
              border: `1px solid ${C.border}`,
              fontSize: 12,
              fontWeight: 600,
              color: C.muted,
            }}>
              Round {currentRound + 1} / {config.totalRounds}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: C.card,
              borderRadius: PILL,
              border: `1px solid ${C.border}`,
            }}>
              <Zap size={14} color={C.warning} />
              <span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{score}</span>
            </div>
          </div>

          {/* HR Zone estimation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            background: C.card,
            borderRadius: PILL,
            border: `1px solid ${C.border}`,
          }}>
            <Heart size={14} color={hrEstimate.color} />
            <span style={{ fontSize: 11, color: hrEstimate.color, fontWeight: 600 }}>
              ~{hrEstimate.bpm} bpm
            </span>
            <span style={{ fontSize: 10, color: C.dim }}>
              {hrEstimate.zone}
            </span>
          </div>

          {/* Wim Hof breath counter */}
          {selectedMode === 'wim_hof' && breathPhase === 'power_breath' && (
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: C.warning,
              letterSpacing: '0.04em',
            }}>
              Breath {wimHofBreathCount} / 30
            </div>
          )}

          {/* Phase label */}
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: getPhaseColor(breathPhase),
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
          }}>
            {getPhaseLabel(breathPhase, selectedMode)}
          </div>

          {/* Breathing circle */}
          <BreathingCircle
            phase={breathPhase}
            progress={phaseProgress}
            color={getPhaseColor(breathPhase)}
            size={220}
            nostril={currentStep?.nostril}
          />

          {/* Phase timer */}
          <div style={{
            fontSize: 32,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: getPhaseColor(breathPhase),
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          }}>
            {formatTimePrecise(phaseTimeMs)}
          </div>

          {/* Instruction text */}
          <p style={{ fontSize: 13, color: C.muted, textAlign: 'center', maxWidth: 300 }}>
            {breathPhase === 'inhale' && 'Breathe in slowly through your nose'}
            {breathPhase === 'hold' && 'Hold your breath -- stay relaxed'}
            {breathPhase === 'hold_out' && !currentStep?.userControlled && 'Hold with lungs empty'}
            {breathPhase === 'hold_out' && currentStep?.userControlled && 'Hold as long as you can. Tap below when you need to breathe.'}
            {breathPhase === 'exhale' && 'Breathe out slowly through your mouth'}
            {breathPhase === 'recovery' && 'Deep breath in and hold. Recover.'}
            {breathPhase === 'power_breath' && 'Deep breath in, then let go. Do not force the exhale.'}
            {breathPhase === 'rest' && 'Breathe normally. Recover before next hold.'}
          </p>

          {/* User-controlled hold: release button */}
          {currentStep?.userControlled && userHoldActiveRef.current && (
            <button
              onClick={endUserHold}
              style={{
                padding: '16px 40px',
                background: C.error,
                color: C.text,
                border: 'none',
                borderRadius: PILL,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                ...GLASS,
                marginTop: 8,
              }}
            >
              Release -- Breathe
            </button>
          )}

          {/* Phase progress bar */}
          {!currentStep?.userControlled && (
            <div style={{
              width: '100%',
              maxWidth: 300,
              height: 4,
              background: C.border,
              borderRadius: PILL,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${phaseProgress * 100}%`,
                height: '100%',
                background: getPhaseColor(breathPhase),
                borderRadius: PILL,
                transition: 'width 100ms linear',
              }} />
            </div>
          )}

          {/* Round progress dots */}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {Array.from({ length: config.totalRounds }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i < currentRound ? C.success : i === currentRound ? config.color : C.dim,
                  opacity: i <= currentRound ? 1 : 0.4,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---- ROUND COMPLETE ---- */}
      {gamePhase === 'round_complete' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          gap: 16,
        }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: C.success,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Trophy size={28} color={C.bg} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: C.success }}>
            Round {currentRound + 1} Complete
          </h2>
          <p style={{ color: C.muted, fontSize: 13 }}>
            Preparing next round...
          </p>
          {roundHoldTimes.length > 0 && (
            <div style={{
              padding: '10px 20px',
              background: C.card,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              ...GLASS,
            }}>
              <p style={{ fontSize: 12, color: C.muted }}>
                Hold time: <span style={{ color: C.hold, fontWeight: 600 }}>
                  {formatTimePrecise(roundHoldTimes[roundHoldTimes.length - 1])}
                </span>
              </p>
            </div>
          )}
          {/* Round progress dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: config.totalRounds }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: i <= currentRound ? C.success : C.dim,
                  opacity: i <= currentRound ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---- SESSION COMPLETE ---- */}
      {gamePhase === 'session_complete' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 24px',
          gap: 20,
          maxWidth: 400,
          margin: '0 auto',
        }}>
          {/* Completion badge */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 40px ${config.color}30`,
          }}>
            <Trophy size={36} color={C.bg} />
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 600, color: config.color }}>
            Session Complete
          </h1>
          <p style={{ color: C.muted, fontSize: 13, textAlign: 'center' }}>
            {config.name} -- {config.totalRounds} rounds completed
          </p>

          {/* Stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            width: '100%',
          }}>
            {[
              { label: 'Score', value: String(score), icon: Zap, color: C.warning },
              { label: 'Duration', value: formatTime(totalTimeMs), icon: Clock, color: C.accent },
              { label: 'Best Hold', value: sessionBestHold > 0 ? formatTimePrecise(sessionBestHold) : '--', icon: Shield, color: C.hold },
              { label: 'Sessions', value: String(bests.totalSessions), icon: Activity, color: C.success },
            ].map((stat, i) => {
              const StatIcon = stat.icon
              return (
                <div key={i} style={{
                  padding: '14px 12px',
                  background: C.card,
                  borderRadius: RADIUS,
                  border: `1px solid ${C.border}`,
                  textAlign: 'center',
                  ...GLASS,
                }}>
                  <StatIcon size={18} color={stat.color} />
                  <p style={{ fontSize: 20, fontWeight: 600, color: C.text, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    {stat.value}
                  </p>
                  <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.04em' }}>{stat.label}</p>
                </div>
              )
            })}
          </div>

          {/* Improvement indicator */}
          {modeRecords.length >= 2 && (() => {
            const prev = modeRecords[modeRecords.length - 2]
            const curr = modeRecords[modeRecords.length - 1]
            if (!prev || !curr) return null
            const diff = curr.score - prev.score
            if (diff === 0) return null
            return (
              <div style={{
                padding: '8px 16px',
                background: diff > 0 ? C.success + '15' : C.error + '15',
                borderRadius: PILL,
                border: `1px solid ${diff > 0 ? C.success + '30' : C.error + '30'}`,
                fontSize: 12,
                fontWeight: 600,
                color: diff > 0 ? C.success : C.error,
              }}>
                {diff > 0 ? '+' : ''}{diff} pts vs last session
              </div>
            )
          })()}

          {/* Hold times per round (Wim Hof / Apnea) */}
          {roundHoldTimes.length > 0 && (
            <div style={{
              width: '100%',
              padding: 14,
              background: C.card,
              borderRadius: RADIUS,
              border: `1px solid ${C.border}`,
              ...GLASS,
            }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 10 }}>
                Hold Times by Round
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 50 }}>
                {roundHoldTimes.map((ht, i) => {
                  const maxHt = Math.max(...roundHoldTimes, 1)
                  const h = Math.max(6, (ht / maxHt) * 44)
                  return (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        height: h,
                        background: C.hold,
                        borderRadius: 4,
                        marginBottom: 4,
                      }} />
                      <span style={{ fontSize: 9, color: C.dim }}>{formatTimePrecise(ht)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Streak */}
          {bests.streakDays > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: C.card,
              borderRadius: PILL,
              border: `1px solid ${C.border}`,
              ...GLASS,
            }}>
              <Zap size={16} color={C.warning} />
              <span style={{ fontSize: 13, fontWeight: 600, color: C.warning }}>
                {bests.streakDays}-day streak
              </span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button
              onClick={() => { sfxTap(); setGamePhase('menu') }}
              style={{
                padding: '12px 24px',
                background: C.card,
                color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: PILL,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                ...GLASS,
              }}
            >
              <ArrowLeft size={16} />
              Menu
            </button>
            <button
              onClick={startCountdown}
              style={{
                padding: '12px 24px',
                background: config.color,
                color: C.bg,
                border: 'none',
                borderRadius: PILL,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                ...GLASS,
              }}
            >
              <RotateCcw size={16} />
              Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
