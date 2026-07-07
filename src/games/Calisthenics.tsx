import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ArrowLeft, Trophy, Clock, Zap, Dumbbell, Flame, ChevronRight, Check, Play, Pause, SkipForward, Star, TrendingUp, RotateCcw } from 'lucide-react'
import { sfxTap, sfxCorrect, sfxLevelUp, sfxGameOver, sfxCountdown, sfxCountdownGo, sfxScore } from '../lib/sfx'
import { type Particle, type ScorePop, confettiBurst, burstParticles, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle } from '../lib/vfx'

/* ------------------------------------------------------------------ */
/*  Design tokens                                                     */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#1a2230',
  ink: '#111820',
  card: '#151d2b',
  border: '#1f2d3d',
  accent: '#00b4d8',
  success: '#00c97b',
  error: '#f43f5e',
  text: '#f0f4f8',
  muted: '#7a8ba0',
  dim: '#3d4f63',
  amber: '#f59e0b',
  violet: '#7b2ff7',
  sapphire: '#3a86ff',
  emerald: '#00c97b',
  rose: '#f43f5e',
  coral: '#ff6b6b',
  warmGold: '#fbbf24',
} as const

const RADIUS = 14
const PILL = 999

const GLASS = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
} as const

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void
}

type MuscleGroup = 'upper' | 'core' | 'lower' | 'full'

interface Exercise {
  id: string
  name: string
  group: MuscleGroup
  targetMuscles: string
  difficulty: number // 1-5
  isTimeBased: boolean
  baseReps: number // reps or seconds
  met: number // metabolic equivalent
  formCues: string[]
}

type WorkoutMode = 'quick' | 'standard' | 'beast' | 'custom'

type Phase = 'menu' | 'mode_select' | 'level_select' | 'countdown' | 'warmup' | 'exercise' | 'rest' | 'cooldown' | 'summary'

interface WorkoutExercise {
  exercise: Exercise
  reps: number // adjusted for level
  sets: number
  currentSet: number
}

interface PersonalBest {
  totalScore: number
  totalReps: number
  totalTime: number
  bestLevel: number
}

/* ------------------------------------------------------------------ */
/*  Exercise library (30+ exercises)                                  */
/* ------------------------------------------------------------------ */
const EXERCISES: Exercise[] = [
  // Upper body
  { id: 'pushup_std', name: 'Push-ups', group: 'upper', targetMuscles: 'Chest, Triceps, Anterior Deltoids', difficulty: 2, isTimeBased: false, baseReps: 10, met: 3.8, formCues: ['Hands shoulder-width apart', 'Body in a straight line from head to heels', 'Lower chest to just above the floor', 'Exhale as you push up'] },
  { id: 'pushup_diamond', name: 'Diamond Push-ups', group: 'upper', targetMuscles: 'Triceps, Inner Chest', difficulty: 3, isTimeBased: false, baseReps: 8, met: 4.0, formCues: ['Hands together forming a diamond shape', 'Elbows track close to your body', 'Lower slowly, press up with control', 'Keep core braced throughout'] },
  { id: 'pushup_wide', name: 'Wide Push-ups', group: 'upper', targetMuscles: 'Outer Chest, Shoulders', difficulty: 2, isTimeBased: false, baseReps: 10, met: 3.8, formCues: ['Hands placed wider than shoulder-width', 'Fingers angled slightly outward', 'Lower until upper arms are parallel to floor', 'Do not flare elbows past 90 degrees'] },
  { id: 'pushup_decline', name: 'Decline Push-ups', group: 'upper', targetMuscles: 'Upper Chest, Shoulders, Triceps', difficulty: 3, isTimeBased: false, baseReps: 8, met: 4.2, formCues: ['Feet elevated on a sturdy surface', 'Hands slightly wider than shoulders', 'Lower chest toward the floor', 'Keep hips from sagging or piking'] },
  { id: 'pushup_pike', name: 'Pike Push-ups', group: 'upper', targetMuscles: 'Shoulders, Triceps, Upper Chest', difficulty: 4, isTimeBased: false, baseReps: 6, met: 4.5, formCues: ['Hips high forming an inverted V', 'Head moves toward the floor between hands', 'Elbows bend at roughly 90 degrees', 'Press back up by extending arms fully'] },
  { id: 'dips_bench', name: 'Bench Dips', group: 'upper', targetMuscles: 'Triceps, Anterior Deltoids, Chest', difficulty: 2, isTimeBased: false, baseReps: 10, met: 3.5, formCues: ['Hands on edge of bench behind you', 'Lower until elbows reach 90 degrees', 'Keep back close to the bench', 'Push through palms to return up'] },
  { id: 'plank_std', name: 'Plank Hold', group: 'upper', targetMuscles: 'Core, Shoulders, Back', difficulty: 2, isTimeBased: true, baseReps: 30, met: 3.0, formCues: ['Forearms on the ground, elbows under shoulders', 'Body in one straight line', 'Squeeze glutes and brace abs', 'Do not let hips sag or pike up'] },
  { id: 'plank_side', name: 'Side Plank', group: 'upper', targetMuscles: 'Obliques, Shoulders, Hip Abductors', difficulty: 3, isTimeBased: true, baseReps: 20, met: 3.2, formCues: ['Stack feet or stagger for balance', 'Elbow directly under shoulder', 'Lift hips to form a straight line', 'Hold without rotating trunk'] },
  { id: 'arm_circles', name: 'Arm Circles', group: 'upper', targetMuscles: 'Deltoids, Rotator Cuff', difficulty: 1, isTimeBased: true, baseReps: 20, met: 2.5, formCues: ['Arms extended straight out to sides', 'Make controlled circular motions', 'Start small, gradually increase size', 'Keep shoulders down, away from ears'] },

  // Core
  { id: 'crunch', name: 'Crunches', group: 'core', targetMuscles: 'Rectus Abdominis', difficulty: 1, isTimeBased: false, baseReps: 15, met: 3.0, formCues: ['Hands behind head, do not pull neck', 'Curl shoulders off the floor', 'Exhale at the top of the crunch', 'Lower with control, do not drop'] },
  { id: 'leg_raise', name: 'Leg Raises', group: 'core', targetMuscles: 'Lower Abs, Hip Flexors', difficulty: 3, isTimeBased: false, baseReps: 10, met: 3.5, formCues: ['Lie flat, hands under hips for support', 'Raise legs to 90 degrees with control', 'Lower slowly without touching the floor', 'Press lower back into the ground'] },
  { id: 'mountain_climber', name: 'Mountain Climbers', group: 'core', targetMuscles: 'Core, Hip Flexors, Shoulders', difficulty: 3, isTimeBased: true, baseReps: 30, met: 8.0, formCues: ['Start in a high plank position', 'Drive one knee toward chest rapidly', 'Alternate legs in a running motion', 'Keep hips level, do not bounce'] },
  { id: 'russian_twist', name: 'Russian Twists', group: 'core', targetMuscles: 'Obliques, Rectus Abdominis', difficulty: 2, isTimeBased: false, baseReps: 20, met: 3.5, formCues: ['Sit with knees bent, feet slightly off floor', 'Lean back to about 45 degrees', 'Rotate torso side to side with control', 'Keep chest lifted, not rounded'] },
  { id: 'flutter_kick', name: 'Flutter Kicks', group: 'core', targetMuscles: 'Lower Abs, Hip Flexors', difficulty: 2, isTimeBased: true, baseReps: 30, met: 3.8, formCues: ['Lie flat, hands under glutes', 'Lift legs a few inches off the floor', 'Alternate small up-and-down kicks', 'Keep lower back pressed to the floor'] },
  { id: 'hollow_body', name: 'Hollow Body Hold', group: 'core', targetMuscles: 'Transverse Abdominis, Rectus Abdominis', difficulty: 4, isTimeBased: true, baseReps: 20, met: 3.5, formCues: ['Arms extended overhead, legs straight', 'Lift shoulders and legs off the floor', 'Press lower back flat into the ground', 'Hold the banana shape without arching'] },
  { id: 'bicycle_crunch', name: 'Bicycle Crunches', group: 'core', targetMuscles: 'Obliques, Rectus Abdominis', difficulty: 2, isTimeBased: false, baseReps: 20, met: 3.5, formCues: ['Hands behind head, elbows wide', 'Bring opposite elbow to opposite knee', 'Extend the other leg fully', 'Rotate from the torso, not the neck'] },
  { id: 'dead_bug', name: 'Dead Bug', group: 'core', targetMuscles: 'Core Stabilizers, Hip Flexors', difficulty: 2, isTimeBased: false, baseReps: 10, met: 3.0, formCues: ['Lie on back, arms and legs raised', 'Extend opposite arm and leg simultaneously', 'Keep lower back glued to the floor', 'Return to start with control'] },
  { id: 'plank_shoulder_tap', name: 'Plank Shoulder Taps', group: 'core', targetMuscles: 'Core, Shoulders, Anti-rotation', difficulty: 3, isTimeBased: false, baseReps: 12, met: 4.0, formCues: ['Start in a high plank position', 'Tap opposite shoulder with one hand', 'Minimize hip rotation throughout', 'Keep feet wider for more stability'] },

  // Lower body
  { id: 'squat_std', name: 'Squats', group: 'lower', targetMuscles: 'Quadriceps, Glutes, Hamstrings', difficulty: 1, isTimeBased: false, baseReps: 15, met: 5.0, formCues: ['Feet shoulder-width apart, toes slightly out', 'Push hips back and down', 'Keep chest up and knees tracking over toes', 'Descend until thighs are parallel to floor'] },
  { id: 'squat_jump', name: 'Jump Squats', group: 'lower', targetMuscles: 'Quadriceps, Glutes, Calves', difficulty: 3, isTimeBased: false, baseReps: 10, met: 8.0, formCues: ['Squat down to parallel', 'Explode upward, extending fully', 'Land softly on the balls of your feet', 'Immediately descend into the next rep'] },
  { id: 'squat_pistol', name: 'Pistol Squats', group: 'lower', targetMuscles: 'Quadriceps, Glutes, Balance', difficulty: 5, isTimeBased: false, baseReps: 4, met: 5.5, formCues: ['Stand on one leg, other extended forward', 'Squat down on the standing leg fully', 'Arms forward for counterbalance', 'Drive through heel to stand back up'] },
  { id: 'squat_sumo', name: 'Sumo Squats', group: 'lower', targetMuscles: 'Inner Thighs, Glutes, Quadriceps', difficulty: 2, isTimeBased: false, baseReps: 12, met: 5.0, formCues: ['Feet wider than shoulder-width, toes turned out', 'Lower hips straight down', 'Keep torso upright throughout', 'Squeeze glutes at the top'] },
  { id: 'lunge_fwd', name: 'Forward Lunges', group: 'lower', targetMuscles: 'Quadriceps, Glutes, Hamstrings', difficulty: 2, isTimeBased: false, baseReps: 10, met: 4.0, formCues: ['Step forward into a long stride', 'Lower back knee toward the floor', 'Front knee stays over the ankle', 'Push back to starting position'] },
  { id: 'lunge_reverse', name: 'Reverse Lunges', group: 'lower', targetMuscles: 'Glutes, Hamstrings, Quadriceps', difficulty: 2, isTimeBased: false, baseReps: 10, met: 4.0, formCues: ['Step backward into a long stride', 'Lower back knee toward the floor', 'Keep front shin vertical', 'Drive through front heel to return'] },
  { id: 'calf_raise', name: 'Calf Raises', group: 'lower', targetMuscles: 'Gastrocnemius, Soleus', difficulty: 1, isTimeBased: false, baseReps: 20, met: 2.5, formCues: ['Stand with feet hip-width apart', 'Rise onto the balls of your feet', 'Pause at the top for one second', 'Lower slowly with control'] },
  { id: 'wall_sit', name: 'Wall Sit', group: 'lower', targetMuscles: 'Quadriceps, Glutes', difficulty: 3, isTimeBased: true, baseReps: 30, met: 3.0, formCues: ['Back flat against a wall', 'Slide down until thighs are parallel to floor', 'Knees at 90 degrees, directly over ankles', 'Keep hands off your thighs'] },
  { id: 'glute_bridge', name: 'Glute Bridges', group: 'lower', targetMuscles: 'Glutes, Hamstrings, Core', difficulty: 1, isTimeBased: false, baseReps: 15, met: 3.5, formCues: ['Lie on back, knees bent, feet flat', 'Drive hips up by squeezing glutes', 'Pause at the top for one second', 'Lower hips without touching the floor'] },
  { id: 'single_leg_bridge', name: 'Single-Leg Bridges', group: 'lower', targetMuscles: 'Glutes, Hamstrings, Core', difficulty: 3, isTimeBased: false, baseReps: 8, met: 3.8, formCues: ['Extend one leg straight up or forward', 'Drive hips up on the planted leg', 'Keep hips level, do not rotate', 'Lower with control'] },

  // Full body
  { id: 'burpee', name: 'Burpees', group: 'full', targetMuscles: 'Full Body Compound', difficulty: 4, isTimeBased: false, baseReps: 8, met: 8.0, formCues: ['Squat down, place hands on the floor', 'Jump feet back into a plank', 'Perform a push-up at the bottom', 'Jump feet forward, then explode upward'] },
  { id: 'bear_crawl', name: 'Bear Crawls', group: 'full', targetMuscles: 'Shoulders, Core, Quadriceps', difficulty: 3, isTimeBased: true, baseReps: 20, met: 6.0, formCues: ['On all fours, lift knees just off the floor', 'Move opposite hand and foot forward', 'Keep hips low and stable', 'Take small, controlled steps'] },
  { id: 'inchworm', name: 'Inchworms', group: 'full', targetMuscles: 'Hamstrings, Core, Shoulders', difficulty: 2, isTimeBased: false, baseReps: 6, met: 4.0, formCues: ['Stand tall, then fold forward to the floor', 'Walk hands out to a plank position', 'Walk hands back toward feet', 'Roll up to standing one vertebra at a time'] },
  { id: 'jumping_jack', name: 'Jumping Jacks', group: 'full', targetMuscles: 'Full Body, Cardiovascular', difficulty: 1, isTimeBased: true, baseReps: 30, met: 7.0, formCues: ['Start with feet together, arms at sides', 'Jump feet wide while raising arms overhead', 'Land softly on the balls of your feet', 'Return to start in one smooth motion'] },
  { id: 'high_knees', name: 'High Knees', group: 'full', targetMuscles: 'Hip Flexors, Core, Cardiovascular', difficulty: 2, isTimeBased: true, baseReps: 30, met: 8.0, formCues: ['Run in place lifting knees to hip height', 'Pump arms in opposition', 'Land on the balls of your feet', 'Keep a brisk, rhythmic pace'] },
  { id: 'squat_thrust', name: 'Squat Thrusts', group: 'full', targetMuscles: 'Full Body Compound', difficulty: 3, isTimeBased: false, baseReps: 8, met: 7.0, formCues: ['Squat down, place hands on the floor', 'Jump feet back to plank', 'Jump feet back to squat position', 'Stand up to complete the rep'] },
]

/* ------------------------------------------------------------------ */
/*  Warmup / cooldown exercises                                       */
/* ------------------------------------------------------------------ */
const WARMUP_EXERCISES: { name: string; duration: number; cue: string }[] = [
  { name: 'Neck Rolls', duration: 15, cue: 'Slow circles in each direction' },
  { name: 'Arm Swings', duration: 15, cue: 'Forward and backward arm swings' },
  { name: 'Hip Circles', duration: 15, cue: 'Large circles with your hips' },
  { name: 'Leg Swings', duration: 15, cue: 'Forward and side leg swings' },
  { name: 'Light Jog in Place', duration: 20, cue: 'Easy pace to raise heart rate' },
  { name: 'Dynamic Stretches', duration: 20, cue: 'Lunges with twist, toe touches' },
]

const COOLDOWN_EXERCISES: { name: string; duration: number; cue: string }[] = [
  { name: 'Walking in Place', duration: 20, cue: 'Slow pace, deep breaths' },
  { name: 'Quad Stretch', duration: 15, cue: 'Hold each leg for 15 seconds' },
  { name: 'Hamstring Stretch', duration: 15, cue: 'Seated or standing forward fold' },
  { name: 'Chest Opener', duration: 15, cue: 'Clasp hands behind back, lift' },
  { name: 'Child\'s Pose', duration: 20, cue: 'Kneel, reach arms forward, relax' },
  { name: 'Deep Breathing', duration: 15, cue: 'Inhale 4s, hold 4s, exhale 6s' },
]

/* ------------------------------------------------------------------ */
/*  Workout generation                                                */
/* ------------------------------------------------------------------ */
const MODE_CONFIGS: Record<Exclude<WorkoutMode, 'custom'>, { exercises: number; sets: number; restSec: number; label: string; minutes: number }> = {
  quick: { exercises: 5, sets: 1, restSec: 20, label: 'Quick Burn', minutes: 5 },
  standard: { exercises: 8, sets: 2, restSec: 30, label: 'Standard', minutes: 15 },
  beast: { exercises: 10, sets: 3, restSec: 25, label: 'Beast Mode', minutes: 30 },
}

function buildWorkout(mode: Exclude<WorkoutMode, 'custom'>, level: number): WorkoutExercise[] {
  const cfg = MODE_CONFIGS[mode]
  const difficultyRange = getDifficultyRange(level)

  // Select exercises balanced across muscle groups
  const groups: MuscleGroup[] = ['upper', 'core', 'lower', 'full']
  const selected: Exercise[] = []
  const perGroup = Math.ceil(cfg.exercises / groups.length)

  for (const group of groups) {
    const pool = EXERCISES.filter(e => e.group === group && e.difficulty >= difficultyRange[0] && e.difficulty <= difficultyRange[1])
    const shuffled = shuffleArr(pool)
    selected.push(...shuffled.slice(0, perGroup))
  }

  const workout = shuffleArr(selected).slice(0, cfg.exercises)

  return workout.map(exercise => ({
    exercise,
    reps: scaleReps(exercise.baseReps, level),
    sets: cfg.sets,
    currentSet: 0,
  }))
}

function getDifficultyRange(level: number): [number, number] {
  if (level <= 2) return [1, 2]
  if (level <= 4) return [1, 3]
  if (level <= 6) return [2, 4]
  if (level <= 8) return [2, 5]
  return [3, 5]
}

function scaleReps(base: number, level: number): number {
  const multiplier = 0.6 + level * 0.15  // 0.75 at L1 to 2.1 at L10
  return Math.round(base * multiplier)
}

function getRestDuration(mode: Exclude<WorkoutMode, 'custom'>, level: number): number {
  const base = MODE_CONFIGS[mode].restSec
  const reduction = Math.floor(level * 1.5) // reduce rest as level increases
  return Math.max(10, base - reduction)
}

function estimateCalories(exercises: WorkoutExercise[], bodyWeightKg: number): number {
  let total = 0
  for (const we of exercises) {
    const durationMin = we.exercise.isTimeBased
      ? (we.reps * we.sets) / 60
      : (we.reps * we.sets * 3) / 60 // ~3 sec per rep average
    total += (we.exercise.met * bodyWeightKg * durationMin) / 60
  }
  return Math.round(total)
}

function shuffleArr<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const GROUP_COLORS: Record<MuscleGroup, string> = {
  upper: C.sapphire,
  core: C.amber,
  lower: C.emerald,
  full: C.violet,
}

const GROUP_LABELS: Record<MuscleGroup, string> = {
  upper: 'Upper Body',
  core: 'Core',
  lower: 'Lower Body',
  full: 'Full Body',
}

const LS_KEY = 'kasuku_calisthenics_pb'

function loadPB(): PersonalBest {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as PersonalBest
  } catch { /* ignore */ }
  return { totalScore: 0, totalReps: 0, totalTime: 0, bestLevel: 0 }
}

function savePB(pb: PersonalBest): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(pb)) } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Difficulty stars                                                   */
/* ------------------------------------------------------------------ */
function DifficultyStars({ rating, size = 14, color = C.warmGold }: { rating: number; size?: number; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < rating ? color : 'transparent'}
          color={i < rating ? color : C.dim}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function Calisthenics({ onBack, onGameEnd }: Props) {
  // Phase
  const [phase, setPhase] = useState<Phase>('menu')
  const [mode, setMode] = useState<WorkoutMode>('standard')
  const [level, setLevel] = useState(1)

  // Workout state
  const [workout, setWorkout] = useState<WorkoutExercise[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [currentSet, setCurrentSet] = useState(0)

  // Timer
  const [timer, setTimer] = useState(0)
  const [timerMax, setTimerMax] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown
  const [countdownVal, setCountdownVal] = useState(3)

  // Warmup/cooldown
  const [warmCoolIdx, setWarmCoolIdx] = useState(0)

  // Reps counter
  const [repCount, setRepCount] = useState(0)

  // Stats
  const [totalReps, setTotalReps] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [completedExercises, setCompletedExercises] = useState(0)
  const [startTimeMs, setStartTimeMs] = useState(0)
  const [exercisesCompleted, setExercisesCompleted] = useState<boolean[]>([])

  // Personal best
  const [pb, setPb] = useState<PersonalBest>(loadPB)

  // VFX
  const [vfxParticles, setVfxParticles] = useState<Particle[]>([])
  const [vfxPops, setVfxPops] = useState<ScorePop[]>([])
  const [shakeIntensity, setShakeIntensity] = useState(0)

  // VFX animation loop
  useEffect(() => {
    let raf = 0
    const loop = () => {
      setVfxParticles(prev => tickParticles(prev))
      setVfxPops(prev => tickScorePops(prev))
      setShakeIntensity(prev => prev * 0.85)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Elapsed time tracker
  useEffect(() => {
    if (phase === 'warmup' || phase === 'exercise' || phase === 'rest' || phase === 'cooldown') {
      const iv = setInterval(() => {
        if (!isPaused) setTotalTime(prev => prev + 1)
      }, 1000)
      return () => clearInterval(iv)
    }
  }, [phase, isPaused])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Cleanup timer on unmount
  useEffect(() => clearTimer, [clearTimer])

  const onGameEndRef = useRef(onGameEnd)
  onGameEndRef.current = onGameEnd

  /* ---------------------------------------------------------------- */
  /*  Game end                                                        */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (phase !== 'summary') return
    const totalExercises = workout.length
    const completionRate = totalExercises > 0 ? completedExercises / totalExercises : 0
    const difficultyMultiplier = 1 + (level - 1) * 0.2
    const baseScore = Math.round(totalReps * 10 * difficultyMultiplier)
    const completionBonus = Math.round(completionRate * 500 * difficultyMultiplier)
    const finalScore = baseScore + completionBonus

    const elapsedMs = Date.now() - startTimeMs
    const accuracy = Math.round(completionRate * 100)

    // Update personal bests
    const newPb: PersonalBest = {
      totalScore: Math.max(pb.totalScore, finalScore),
      totalReps: Math.max(pb.totalReps, totalReps),
      totalTime: Math.max(pb.totalTime, totalTime),
      bestLevel: Math.max(pb.bestLevel, level),
    }
    setPb(newPb)
    savePB(newPb)

    onGameEndRef.current?.({
      score: finalScore,
      accuracy,
      level,
      maxScore: Math.round(workout.length * workout[0]?.sets * 150 * difficultyMultiplier + 500 * difficultyMultiplier),
      timeMs: elapsedMs,
    })
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------------------------------------------- */
  /*  Start timer for a duration                                      */
  /* ---------------------------------------------------------------- */
  const startTimer = useCallback((durationSec: number, onComplete: () => void) => {
    clearTimer()
    setTimer(durationSec)
    setTimerMax(durationSec)
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 0.1) {
          clearTimer()
          onComplete()
          return 0
        }
        return prev - 0.1
      })
    }, 100)
  }, [clearTimer])

  /* ---------------------------------------------------------------- */
  /*  Start workout                                                   */
  /* ---------------------------------------------------------------- */
  const startWorkout = useCallback((selectedMode: Exclude<WorkoutMode, 'custom'>, selectedLevel: number) => {
    setMode(selectedMode)
    setLevel(selectedLevel)
    const w = buildWorkout(selectedMode, selectedLevel)
    setWorkout(w)
    setCurrentIdx(0)
    setCurrentSet(0)
    setRepCount(0)
    setTotalReps(0)
    setTotalTime(0)
    setCompletedExercises(0)
    setExercisesCompleted(new Array(w.length).fill(false))
    setStartTimeMs(Date.now())
    setIsPaused(false)

    // Countdown
    setCountdownVal(3)
    setPhase('countdown')
    sfxCountdown()
  }, [])

  /* ---------------------------------------------------------------- */
  /*  Countdown effect                                                */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdownVal <= 0) {
      sfxCountdownGo()
      setWarmCoolIdx(0)
      setPhase('warmup')
      return
    }
    const t = setTimeout(() => {
      sfxCountdown()
      setCountdownVal(prev => prev - 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [phase, countdownVal])

  /* ---------------------------------------------------------------- */
  /*  Warmup phase                                                    */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (phase !== 'warmup') return
    const ex = WARMUP_EXERCISES[warmCoolIdx]
    if (!ex) {
      // Warmup done, go to first exercise
      startExercise(0, 0)
      return
    }
    startTimer(ex.duration, () => {
      sfxCorrect()
      const nextIdx = warmCoolIdx + 1
      if (nextIdx >= WARMUP_EXERCISES.length) {
        startExercise(0, 0)
      } else {
        setWarmCoolIdx(nextIdx)
      }
    })
    return clearTimer
  }, [phase, warmCoolIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------------------------------------------- */
  /*  Start exercise                                                  */
  /* ---------------------------------------------------------------- */
  const startExercise = useCallback((idx: number, set: number) => {
    setCurrentIdx(idx)
    setCurrentSet(set)
    setRepCount(0)
    setPhase('exercise')
    sfxTap()

    const we = workout[idx]
    if (!we) return
    if (we.exercise.isTimeBased) {
      startTimer(we.reps, () => {
        handleExerciseComplete(idx, set)
      })
    }
  }, [workout, startTimer]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------------------------------------------- */
  /*  Handle exercise completion                                      */
  /* ---------------------------------------------------------------- */
  const handleExerciseComplete = useCallback((idx: number, set: number) => {
    clearTimer()
    const we = workout[idx]
    if (!we) return

    const repsForThis = we.exercise.isTimeBased ? we.reps : repCount
    setTotalReps(prev => prev + repsForThis)
    sfxScore()

    const nextSet = set + 1
    if (nextSet < we.sets) {
      // More sets to go -- rest
      const restDur = mode !== 'custom' ? getRestDuration(mode as Exclude<WorkoutMode, 'custom'>, level) : 20
      setPhase('rest')
      startTimer(restDur, () => {
        startExercise(idx, nextSet)
      })
    } else {
      // Exercise fully done
      setCompletedExercises(prev => prev + 1)
      setExercisesCompleted(prev => {
        const next = [...prev]
        next[idx] = true
        return next
      })
      sfxCorrect()
      setVfxParticles(prev => [...prev, ...confettiBurst(window.innerWidth / 2, window.innerHeight / 2)])
      setVfxPops(prev => [...prev, createScorePop(window.innerWidth / 2, window.innerHeight / 2 - 60, '+' + repsForThis + ' reps', C.success)])

      const nextIdx = idx + 1
      if (nextIdx < workout.length) {
        // Rest before next exercise
        const restDur = mode !== 'custom' ? getRestDuration(mode as Exclude<WorkoutMode, 'custom'>, level) : 20
        setPhase('rest')
        startTimer(restDur, () => {
          startExercise(nextIdx, 0)
        })
      } else {
        // All exercises done, cooldown
        sfxLevelUp()
        setWarmCoolIdx(0)
        setPhase('cooldown')
      }
    }
  }, [workout, repCount, mode, level, clearTimer, startTimer, startExercise]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------------------------------------------- */
  /*  Cooldown phase                                                  */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (phase !== 'cooldown') return
    const ex = COOLDOWN_EXERCISES[warmCoolIdx]
    if (!ex) {
      sfxGameOver()
      setPhase('summary')
      return
    }
    startTimer(ex.duration, () => {
      sfxCorrect()
      const nextIdx = warmCoolIdx + 1
      if (nextIdx >= COOLDOWN_EXERCISES.length) {
        sfxGameOver()
        setPhase('summary')
      } else {
        setWarmCoolIdx(nextIdx)
      }
    })
    return clearTimer
  }, [phase, warmCoolIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------------------------------------------- */
  /*  Rep tap handler                                                 */
  /* ---------------------------------------------------------------- */
  const handleRepTap = useCallback(() => {
    if (phase !== 'exercise' || isPaused) return
    const we = workout[currentIdx]
    if (!we || we.exercise.isTimeBased) return

    sfxTap()
    const newCount = repCount + 1
    setRepCount(newCount)

    // Burst for each tap
    setVfxParticles(prev => [...prev, ...burstParticles(window.innerWidth / 2, window.innerHeight / 2, GROUP_COLORS[we.exercise.group], 4)])

    if (newCount >= we.reps) {
      handleExerciseComplete(currentIdx, currentSet)
    }
  }, [phase, isPaused, workout, currentIdx, repCount, currentSet, handleExerciseComplete])

  /* ---------------------------------------------------------------- */
  /*  Skip exercise                                                   */
  /* ---------------------------------------------------------------- */
  const handleSkip = useCallback(() => {
    clearTimer()
    const nextIdx = currentIdx + 1
    if (nextIdx < workout.length) {
      startExercise(nextIdx, 0)
    } else {
      setWarmCoolIdx(0)
      setPhase('cooldown')
    }
  }, [currentIdx, workout.length, clearTimer, startExercise])

  /* ---------------------------------------------------------------- */
  /*  Pause / resume                                                  */
  /* ---------------------------------------------------------------- */
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev)
    sfxTap()
  }, [])

  // Freeze timer when paused
  useEffect(() => {
    if (!timerRef.current) return
    if (isPaused) {
      clearTimer()
    } else if (phase === 'exercise' || phase === 'rest' || phase === 'warmup' || phase === 'cooldown') {
      // Restart the timer with remaining time
      const remaining = timer
      if (remaining > 0) {
        const onComplete = () => {
          if (phase === 'exercise') {
            handleExerciseComplete(currentIdx, currentSet)
          } else if (phase === 'rest') {
            if (currentSet + 1 < (workout[currentIdx]?.sets ?? 1)) {
              startExercise(currentIdx, currentSet + 1)
            } else {
              const nextIdx = currentIdx + 1
              if (nextIdx < workout.length) {
                startExercise(nextIdx, 0)
              } else {
                setWarmCoolIdx(0)
                setPhase('cooldown')
              }
            }
          }
        }
        startTimer(remaining, onComplete)
      }
    }
  }, [isPaused]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------------------------------------------------------- */
  /*  Computed                                                        */
  /* ---------------------------------------------------------------- */
  const currentExercise = workout[currentIdx]
  const timerPct = timerMax > 0 ? (timer / timerMax) * 100 : 0
  const timerColor = timerPct > 50 ? C.accent : timerPct > 25 ? C.amber : C.error
  const caloriesEstimate = useMemo(() => estimateCalories(workout, 70), [workout])

  const finalScore = useMemo(() => {
    if (phase !== 'summary') return 0
    const completionRate = workout.length > 0 ? completedExercises / workout.length : 0
    const difficultyMultiplier = 1 + (level - 1) * 0.2
    return Math.round(totalReps * 10 * difficultyMultiplier + completionRate * 500 * difficultyMultiplier)
  }, [phase, workout.length, completedExercises, level, totalReps])

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: C.bg,
      color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      ...screenShakeStyle(shakeIntensity),
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: `1px solid ${C.border}`,
        background: C.ink,
        zIndex: 10,
      }}>
        <button
          onClick={() => { sfxTap(); clearTimer(); onBack() }}
          style={{
            background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
            borderRadius: RADIUS, fontSize: 14,
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 600, letterSpacing: 0.3 }}>
          Calisthenics
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>

        {/* ---- MENU ---- */}
        {phase === 'menu' && (
          <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
            {/* Hero */}
            <div style={{
              textAlign: 'center', padding: '32px 0 24px',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: PILL,
                background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', ...GLASS,
              }}>
                <Dumbbell size={32} color={C.text} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Calisthenics Challenge</h1>
              <p style={{ color: C.muted, margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                Bodyweight fitness program with progressive difficulty.
                Build strength through scientifically structured workouts.
              </p>
            </div>

            {/* Personal bests */}
            {pb.totalScore > 0 && (
              <div style={{
                background: C.card, borderRadius: RADIUS, padding: 16, marginBottom: 20,
                border: `1px solid ${C.border}`, ...GLASS,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Trophy size={16} color={C.warmGold} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.warmGold }}>Personal Bests</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{pb.totalScore.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Best Score</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.emerald }}>{pb.totalReps}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Best Reps</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.amber }}>Lv{pb.bestLevel}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Best Level</div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode selection */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Select Mode
              </div>
              {(['quick', 'standard', 'beast'] as const).map(m => {
                const cfg = MODE_CONFIGS[m]
                const isSelected = mode === m
                return (
                  <button
                    key={m}
                    onClick={() => { sfxTap(); setMode(m) }}
                    style={{
                      display: 'flex', alignItems: 'center', width: '100%',
                      background: isSelected ? C.card : 'transparent',
                      border: `1px solid ${isSelected ? C.accent : C.border}`,
                      borderRadius: RADIUS, padding: '14px 16px', marginBottom: 8,
                      cursor: 'pointer', color: C.text, textAlign: 'left',
                      transition: 'all 0.15s ease',
                      ...(isSelected ? GLASS : {}),
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: isSelected ? C.accent : C.dim,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: 12, transition: 'background 0.15s ease',
                    }}>
                      {m === 'quick' ? <Zap size={18} color={C.text} /> :
                       m === 'standard' ? <Dumbbell size={18} color={C.text} /> :
                       <Flame size={18} color={C.text} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{cfg.label}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>
                        {cfg.minutes} min / {cfg.exercises} exercises / {cfg.sets} set{cfg.sets > 1 ? 's' : ''}
                      </div>
                    </div>
                    <ChevronRight size={16} color={isSelected ? C.accent : C.dim} />
                  </button>
                )
              })}
            </div>

            {/* Level selection */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Difficulty Level: {level}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(lv => (
                  <button
                    key={lv}
                    onClick={() => { sfxTap(); setLevel(lv) }}
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: lv === level ? C.accent : C.card,
                      border: `1px solid ${lv === level ? C.accent : C.border}`,
                      color: C.text, fontSize: 15, fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {lv}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
                Level {level}: {level <= 3 ? 'Beginner' : level <= 6 ? 'Intermediate' : level <= 8 ? 'Advanced' : 'Elite'} difficulty.
                {level > 1 ? ` More reps, harder exercises, shorter rest.` : ' Lower reps, basic exercises, generous rest.'}
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={() => {
                sfxTap()
                if (mode !== 'custom') startWorkout(mode as Exclude<WorkoutMode, 'custom'>, level)
              }}
              style={{
                width: '100%', padding: '16px 0',
                background: C.accent, border: 'none', borderRadius: PILL,
                color: C.text, fontSize: 17, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 0 24px ${C.accent}44`,
                transition: 'transform 0.1s ease',
              }}
            >
              Start Workout
            </button>
          </div>
        )}

        {/* ---- COUNTDOWN ---- */}
        {phase === 'countdown' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', padding: 20,
          }}>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 2 }}>
              Get Ready
            </div>
            <div style={{
              width: 120, height: 120, borderRadius: PILL,
              background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 56, fontWeight: 700, ...GLASS,
            }}>
              {countdownVal || 'GO'}
            </div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 16 }}>
              {MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS]?.label ?? 'Workout'} / Level {level}
            </div>
          </div>
        )}

        {/* ---- WARMUP ---- */}
        {phase === 'warmup' && (
          <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
            <div style={{
              textAlign: 'center', marginBottom: 24,
            }}>
              <div style={{ fontSize: 13, color: C.amber, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                Warm-up
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {warmCoolIdx + 1} / {WARMUP_EXERCISES.length}
              </div>
            </div>

            {/* Timer bar */}
            <div style={{
              height: 6, borderRadius: 3, background: C.dim, marginBottom: 24, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: C.amber,
                width: `${timerPct}%`,
                transition: 'width 0.1s linear',
              }} />
            </div>

            {WARMUP_EXERCISES[warmCoolIdx] && (
              <div style={{
                background: C.card, borderRadius: RADIUS, padding: 24,
                border: `1px solid ${C.border}`, textAlign: 'center', ...GLASS,
              }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: C.amber, marginBottom: 8 }}>
                  {Math.ceil(timer)}s
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                  {WARMUP_EXERCISES[warmCoolIdx].name}
                </div>
                <div style={{ fontSize: 14, color: C.muted }}>
                  {WARMUP_EXERCISES[warmCoolIdx].cue}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- EXERCISE ---- */}
        {phase === 'exercise' && currentExercise && (
          <div style={{ padding: 20, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {/* Progress bar */}
            <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
              {workout.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i < currentIdx ? C.success :
                              i === currentIdx ? GROUP_COLORS[currentExercise.exercise.group] : C.dim,
                  opacity: i <= currentIdx ? 1 : 0.4,
                  transition: 'background 0.3s ease',
                }} />
              ))}
            </div>

            {/* Exercise info header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.muted }}>
                Exercise {currentIdx + 1}/{workout.length}
                {currentExercise.sets > 1 ? ` -- Set ${currentSet + 1}/${currentExercise.sets}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={togglePause} style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
                  color: C.muted, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}>
                  {isPaused ? <Play size={14} /> : <Pause size={14} />}
                </button>
                <button onClick={handleSkip} style={{
                  background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
                  color: C.muted, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}>
                  <SkipForward size={14} />
                </button>
              </div>
            </div>

            {/* Muscle group badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: GROUP_COLORS[currentExercise.exercise.group] + '22',
              border: `1px solid ${GROUP_COLORS[currentExercise.exercise.group]}44`,
              borderRadius: PILL, padding: '4px 12px', fontSize: 11, fontWeight: 600,
              color: GROUP_COLORS[currentExercise.exercise.group],
              alignSelf: 'flex-start', marginBottom: 12,
            }}>
              {GROUP_LABELS[currentExercise.exercise.group]}
            </div>

            {/* Exercise name + difficulty */}
            <div style={{ marginBottom: 6 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px' }}>
                {currentExercise.exercise.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DifficultyStars rating={currentExercise.exercise.difficulty} />
                <span style={{ fontSize: 12, color: C.muted }}>{currentExercise.exercise.targetMuscles}</span>
              </div>
            </div>

            {/* Timer or rep counter */}
            {currentExercise.exercise.isTimeBased ? (
              <div style={{
                background: C.card, borderRadius: RADIUS, padding: 24,
                border: `1px solid ${C.border}`, textAlign: 'center',
                marginTop: 16, marginBottom: 16, ...GLASS,
              }}>
                <div style={{ fontSize: 56, fontWeight: 700, color: timerColor, fontVariantNumeric: 'tabular-nums' }}>
                  {Math.ceil(timer)}
                </div>
                <div style={{ fontSize: 13, color: C.muted }}>seconds remaining</div>
                {/* Timer bar */}
                <div style={{
                  height: 6, borderRadius: 3, background: C.dim, marginTop: 16, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: timerColor,
                    width: `${timerPct}%`,
                    transition: 'width 0.1s linear',
                  }} />
                </div>
              </div>
            ) : (
              <button
                onClick={handleRepTap}
                style={{
                  background: C.card, borderRadius: RADIUS, padding: 32,
                  border: `2px solid ${GROUP_COLORS[currentExercise.exercise.group]}`,
                  textAlign: 'center', marginTop: 16, marginBottom: 16,
                  cursor: 'pointer', color: C.text, width: '100%',
                  transition: 'transform 0.05s ease',
                  ...GLASS,
                }}
              >
                <div style={{
                  fontSize: 64, fontWeight: 700,
                  color: GROUP_COLORS[currentExercise.exercise.group],
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {repCount}
                </div>
                <div style={{
                  fontSize: 14, color: C.muted, marginTop: 4,
                }}>
                  / {currentExercise.reps} reps -- TAP TO COUNT
                </div>
                {/* Progress ring approximation */}
                <div style={{
                  height: 6, borderRadius: 3, background: C.dim, marginTop: 16, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: GROUP_COLORS[currentExercise.exercise.group],
                    width: `${Math.min(100, (repCount / currentExercise.reps) * 100)}%`,
                    transition: 'width 0.15s ease',
                  }} />
                </div>
              </button>
            )}

            {/* Mark complete button for rep exercises */}
            {!currentExercise.exercise.isTimeBased && (
              <button
                onClick={() => handleExerciseComplete(currentIdx, currentSet)}
                style={{
                  width: '100%', padding: '12px 0',
                  background: 'transparent', border: `1px solid ${C.success}`,
                  borderRadius: PILL, color: C.success, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', marginBottom: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Check size={16} />
                Mark Complete
              </button>
            )}

            {/* Form guidance */}
            <div style={{
              background: C.card, borderRadius: RADIUS, padding: 16,
              border: `1px solid ${C.border}`, marginTop: 'auto',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Form Guide
              </div>
              {currentExercise.exercise.formCues.map((cue, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 8, marginBottom: i < currentExercise.exercise.formCues.length - 1 ? 6 : 0,
                  fontSize: 13, color: C.text, lineHeight: 1.4,
                }}>
                  <span style={{ color: GROUP_COLORS[currentExercise.exercise.group], fontWeight: 600, flexShrink: 0 }}>
                    {i + 1}.
                  </span>
                  {cue}
                </div>
              ))}
            </div>

            {/* Paused overlay */}
            {isPaused && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 20,
              }}>
                <Pause size={48} color={C.muted} />
                <div style={{ fontSize: 20, fontWeight: 600, marginTop: 16 }}>Paused</div>
                <button
                  onClick={togglePause}
                  style={{
                    marginTop: 24, padding: '12px 40px',
                    background: C.accent, border: 'none', borderRadius: PILL,
                    color: C.text, fontSize: 16, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Resume
                </button>
              </div>
            )}
          </div>
        )}

        {/* ---- REST ---- */}
        {phase === 'rest' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', padding: 20,
          }}>
            <div style={{ fontSize: 13, color: C.emerald, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              Rest
            </div>
            <div style={{
              width: 140, height: 140, borderRadius: PILL,
              background: C.card, border: `3px solid ${C.emerald}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              ...GLASS,
            }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: C.emerald, fontVariantNumeric: 'tabular-nums' }}>
                {Math.ceil(timer)}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>seconds</div>
            </div>

            {/* Timer bar */}
            <div style={{
              width: '100%', maxWidth: 300, height: 6, borderRadius: 3,
              background: C.dim, marginTop: 24, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3, background: C.emerald,
                width: `${timerPct}%`, transition: 'width 0.1s linear',
              }} />
            </div>

            {/* Next exercise preview */}
            {workout[currentIdx + (currentSet + 1 < (currentExercise?.sets ?? 1) ? 0 : 1)] && (
              <div style={{
                background: C.card, borderRadius: RADIUS, padding: 16,
                border: `1px solid ${C.border}`, marginTop: 24, width: '100%', maxWidth: 340,
                textAlign: 'center', ...GLASS,
              }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
                  {currentSet + 1 < (currentExercise?.sets ?? 1) ? 'Next Set' : 'Up Next'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {currentSet + 1 < (currentExercise?.sets ?? 1)
                    ? currentExercise?.exercise.name
                    : workout[currentIdx + 1]?.exercise.name ?? 'Cooldown'
                  }
                </div>
              </div>
            )}

            <button
              onClick={() => {
                clearTimer()
                sfxTap()
                if (currentSet + 1 < (currentExercise?.sets ?? 1)) {
                  startExercise(currentIdx, currentSet + 1)
                } else {
                  const nextIdx = currentIdx + 1
                  if (nextIdx < workout.length) {
                    startExercise(nextIdx, 0)
                  } else {
                    setWarmCoolIdx(0)
                    setPhase('cooldown')
                  }
                }
              }}
              style={{
                marginTop: 20, padding: '10px 32px',
                background: 'transparent', border: `1px solid ${C.muted}`,
                borderRadius: PILL, color: C.muted, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Skip Rest
            </button>
          </div>
        )}

        {/* ---- COOLDOWN ---- */}
        {phase === 'cooldown' && (
          <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: C.violet, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                Cool Down
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {warmCoolIdx + 1} / {COOLDOWN_EXERCISES.length}
              </div>
            </div>

            <div style={{
              height: 6, borderRadius: 3, background: C.dim, marginBottom: 24, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3, background: C.violet,
                width: `${timerPct}%`, transition: 'width 0.1s linear',
              }} />
            </div>

            {COOLDOWN_EXERCISES[warmCoolIdx] && (
              <div style={{
                background: C.card, borderRadius: RADIUS, padding: 24,
                border: `1px solid ${C.border}`, textAlign: 'center', ...GLASS,
              }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: C.violet, marginBottom: 8 }}>
                  {Math.ceil(timer)}s
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                  {COOLDOWN_EXERCISES[warmCoolIdx].name}
                </div>
                <div style={{ fontSize: 14, color: C.muted }}>
                  {COOLDOWN_EXERCISES[warmCoolIdx].cue}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                clearTimer()
                sfxTap()
                sfxGameOver()
                setPhase('summary')
              }}
              style={{
                display: 'block', margin: '24px auto 0', padding: '10px 32px',
                background: 'transparent', border: `1px solid ${C.muted}`,
                borderRadius: PILL, color: C.muted, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Skip Cooldown
            </button>
          </div>
        )}

        {/* ---- SUMMARY ---- */}
        {phase === 'summary' && (
          <div style={{ padding: 20, maxWidth: 480, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', padding: '24px 0 20px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: PILL,
                background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', ...GLASS,
              }}>
                <Trophy size={28} color={C.text} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Workout Complete</h2>
              <p style={{ color: C.muted, margin: 0, fontSize: 13 }}>
                {MODE_CONFIGS[mode as keyof typeof MODE_CONFIGS]?.label ?? 'Workout'} / Level {level}
              </p>
            </div>

            {/* Score */}
            <div style={{
              background: C.card, borderRadius: RADIUS, padding: 20,
              border: `1px solid ${C.border}`, marginBottom: 16, textAlign: 'center', ...GLASS,
            }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: C.accent }}>
                {finalScore.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>Total Score</div>
              {finalScore > pb.totalScore && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: C.warmGold + '22', border: `1px solid ${C.warmGold}44`,
                  borderRadius: PILL, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                  color: C.warmGold, marginTop: 8,
                }}>
                  <TrendingUp size={12} /> New Personal Best
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Total Reps', value: totalReps.toString(), color: C.emerald, icon: Dumbbell },
                { label: 'Total Time', value: formatTime(totalTime), color: C.sapphire, icon: Clock },
                { label: 'Exercises Done', value: `${completedExercises}/${workout.length}`, color: C.accent, icon: Check },
                { label: 'Est. Calories', value: `${caloriesEstimate} kcal`, color: C.coral, icon: Flame },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: C.card, borderRadius: RADIUS, padding: 14,
                  border: `1px solid ${C.border}`, textAlign: 'center',
                }}>
                  <stat.icon size={16} color={stat.color} style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Exercises completed list */}
            <div style={{
              background: C.card, borderRadius: RADIUS, padding: 16,
              border: `1px solid ${C.border}`, marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Exercise Summary
              </div>
              {workout.map((we, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderBottom: i < workout.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: exercisesCompleted[i] ? C.success + '22' : C.dim + '22',
                    border: `1px solid ${exercisesCompleted[i] ? C.success : C.dim}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {exercisesCompleted[i] && <Check size={12} color={C.success} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{we.exercise.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>
                      {we.reps} {we.exercise.isTimeBased ? 'sec' : 'reps'} x {we.sets} set{we.sets > 1 ? 's' : ''}
                    </div>
                  </div>
                  <DifficultyStars rating={we.exercise.difficulty} size={10} />
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  sfxTap()
                  setPhase('menu')
                }}
                style={{
                  flex: 1, padding: '14px 0',
                  background: 'transparent', border: `1px solid ${C.border}`,
                  borderRadius: PILL, color: C.muted, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <RotateCcw size={16} />
                New Workout
              </button>
              <button
                onClick={() => { sfxTap(); onBack() }}
                style={{
                  flex: 1, padding: '14px 0',
                  background: C.accent, border: 'none',
                  borderRadius: PILL, color: C.text, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 0 20px ${C.accent}44`,
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* VFX particles */}
        {vfxParticles.map(p => (
          <div key={p.id} style={{
            position: 'fixed', pointerEvents: 'none', zIndex: 50,
            ...renderParticleStyle(p),
          }} />
        ))}
        {vfxPops.map(p => (
          <div key={p.id} style={{
            position: 'fixed', pointerEvents: 'none', zIndex: 50,
            ...scorePopStyle(p),
          }} />
        ))}
      </div>
    </div>
  )
}
