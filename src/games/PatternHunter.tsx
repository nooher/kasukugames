import type React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Heart, Clock, RotateCcw, Trophy, Zap, Search, ChevronRight } from 'lucide-react'
import { sfxTap, sfxCorrect, sfxWrong, sfxLevelUp, sfxGameOver, sfxCombo, sfxTimer } from '../lib/sfx'
import type { Particle, ScorePop } from '../lib/vfx'
import {
  correctBurst, wrongBurst, confettiBurst,
  tickParticles, renderParticleStyle,
  createScorePop, tickScorePops, scorePopStyle,
  screenShakeStyle, comboGlowStyle, streakGlow,
} from '../lib/vfx'

/* ------------------------------------------------------------------ */
/*  Design tokens                                                     */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#1a2230',
  ink: '#111820',
  card: '#151d2b',
  border: '#1f2d3d',
  accent: '#00c97b',
  teal: '#00b4d8',
  sapphire: '#3a86ff',
  violet: '#7b2ff7',
  amber: '#f59e0b',
  error: '#f43f5e',
  text: '#f0f4f8',
  muted: '#7a8ba0',
  dim: '#3d4f63',
  obsidian: '#0b0f14',
  carbon: '#141c28',
} as const

const RADIUS = 14
const PILL = 999

const GLASS: React.CSSProperties = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type ElementKind = 'number' | 'shape' | 'color'

interface SequenceElement {
  kind: ElementKind
  value: number
  display: string
  color?: string
}

interface PuzzleRule {
  label: string
  description: string
}

interface Puzzle {
  sequence: SequenceElement[]
  rule: PuzzleRule
  decoys: PuzzleRule[]
  nextElement: SequenceElement
  kind: ElementKind
}

interface Props {
  onBack: () => void
}

/* ------------------------------------------------------------------ */
/*  Shape SVGs                                                        */
/* ------------------------------------------------------------------ */
const SHAPE_NAMES = ['circle', 'square', 'triangle', 'diamond', 'pentagon', 'hexagon'] as const

function renderShape(index: number, size: number, fill: string): React.ReactElement {
  const half = size / 2
  switch (SHAPE_NAMES[index % SHAPE_NAMES.length]) {
    case 'circle':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={half} cy={half} r={half - 2} fill={fill} />
        </svg>
      )
    case 'square':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <rect x={2} y={2} width={size - 4} height={size - 4} rx={3} fill={fill} />
        </svg>
      )
    case 'triangle':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon points={`${half},3 ${size - 3},${size - 3} 3,${size - 3}`} fill={fill} />
        </svg>
      )
    case 'diamond':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon points={`${half},2 ${size - 2},${half} ${half},${size - 2} 2,${half}`} fill={fill} />
        </svg>
      )
    case 'pentagon': {
      const pts = Array.from({ length: 5 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
        return `${half + (half - 3) * Math.cos(angle)},${half + (half - 3) * Math.sin(angle)}`
      }).join(' ')
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon points={pts} fill={fill} />
        </svg>
      )
    }
    case 'hexagon': {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
        return `${half + (half - 3) * Math.cos(angle)},${half + (half - 3) * Math.sin(angle)}`
      }).join(' ')
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon points={pts} fill={fill} />
        </svg>
      )
    }
  }
}

/* ------------------------------------------------------------------ */
/*  Color palette for color-type puzzles                              */
/* ------------------------------------------------------------------ */
const COLOR_PALETTE = [C.accent, C.teal, C.sapphire, C.violet, C.amber, C.error]
const COLOR_NAMES = ['Emerald', 'Teal', 'Sapphire', 'Violet', 'Amber', 'Rose']

/* ------------------------------------------------------------------ */
/*  Puzzle generators                                                 */
/* ------------------------------------------------------------------ */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/* --- Number sequence generators --- */

function genArithmetic(len: number): { seq: number[]; step: number; start: number } {
  const step = pick([2, 3, 4, 5, 6, 7, -2, -3])
  const start = randInt(1, 20)
  const seq = Array.from({ length: len }, (_, i) => start + step * i)
  return { seq, step, start }
}

function genGeometric(len: number): { seq: number[]; ratio: number; start: number } {
  const ratio = pick([2, 3])
  const start = pick([1, 2, 3])
  const seq = Array.from({ length: len }, (_, i) => start * Math.pow(ratio, i))
  return { seq, ratio, start }
}

function genFibLike(len: number): { seq: number[]; a: number; b: number } {
  const a = randInt(1, 4)
  const b = randInt(1, 4)
  const seq = [a, b]
  for (let i = 2; i < len; i++) seq.push(seq[i - 1] + seq[i - 2])
  return { seq, a, b }
}

function genSquares(len: number): { seq: number[]; offset: number } {
  const offset = randInt(1, 5)
  const seq = Array.from({ length: len }, (_, i) => (i + offset) * (i + offset))
  return { seq, offset }
}

function genPrimes(len: number): number[] {
  const primes: number[] = []
  let n = 2
  while (primes.length < len) {
    let isPrime = true
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) { isPrime = false; break }
    }
    if (isPrime) primes.push(n)
    n++
  }
  return primes
}

function genAlternating(len: number): { seq: number[]; stepA: number; stepB: number; startA: number; startB: number } {
  const stepA = pick([2, 3, 4])
  const stepB = pick([5, 6, 7])
  const startA = randInt(1, 10)
  const startB = randInt(20, 40)
  const seq: number[] = []
  for (let i = 0; i < len; i++) {
    seq.push(i % 2 === 0 ? startA + (Math.floor(i / 2)) * stepA : startB + (Math.floor(i / 2)) * stepB)
  }
  return { seq, stepA, stepB, startA, startB }
}

function genTriangular(len: number): number[] {
  return Array.from({ length: len }, (_, i) => ((i + 1) * (i + 2)) / 2)
}

/* --- Compound / exception generators for high difficulty --- */

function genArithmeticWithException(len: number): { seq: number[]; step: number; exceptionIndex: number } {
  const step = pick([3, 4, 5])
  const start = randInt(2, 10)
  const exceptionIndex = pick([2, 3, 4].filter(i => i < len))
  const seq = Array.from({ length: len }, (_, i) => {
    const val = start + step * i
    return i === exceptionIndex ? val + step : val
  })
  return { seq, step, exceptionIndex }
}

/* ------------------------------------------------------------------ */
/*  Build puzzle for given level                                      */
/* ------------------------------------------------------------------ */
function buildPuzzle(level: number): Puzzle {
  const len = Math.min(5 + Math.floor(level / 3), 8)
  const difficulty = Math.min(Math.floor(level / 2), 5)

  // Decide kind based on level
  const kindPool: ElementKind[] = level < 3 ? ['number'] : level < 6 ? ['number', 'shape'] : ['number', 'shape', 'color']
  const kind = pick(kindPool)

  if (kind === 'color') {
    return buildColorPuzzle(len)
  }
  if (kind === 'shape') {
    return buildShapePuzzle(len)
  }
  return buildNumberPuzzle(len, difficulty)
}

function buildNumberPuzzle(len: number, difficulty: number): Puzzle {
  // Pick a generator based on difficulty
  type GenType = 'arith' | 'geo' | 'fib' | 'squares' | 'primes' | 'alt' | 'tri' | 'arithExc'
  const easyPool: GenType[] = ['arith', 'geo']
  const midPool: GenType[] = ['arith', 'geo', 'fib', 'squares', 'primes']
  const hardPool: GenType[] = ['fib', 'squares', 'primes', 'alt', 'tri', 'arithExc']
  const pool = difficulty < 2 ? easyPool : difficulty < 4 ? midPool : hardPool
  const gen = pick(pool)

  let sequence: number[]
  let rule: PuzzleRule
  let nextVal: number
  let decoyRules: PuzzleRule[]

  switch (gen) {
    case 'arith': {
      const { seq, step } = genArithmetic(len + 1)
      sequence = seq.slice(0, len)
      nextVal = seq[len]
      const dir = step > 0 ? 'Add' : 'Subtract'
      rule = { label: `${dir} ${Math.abs(step)}`, description: `Each term ${step > 0 ? 'increases' : 'decreases'} by ${Math.abs(step)}` }
      decoyRules = [
        { label: `Multiply by ${Math.abs(step)}`, description: `Each term is multiplied by ${Math.abs(step)}` },
        { label: `Add ${Math.abs(step) + 1}`, description: `Each term increases by ${Math.abs(step) + 1}` },
        { label: 'Fibonacci-like sum', description: 'Each term is the sum of the two before it' },
      ]
      break
    }
    case 'geo': {
      const { seq, ratio } = genGeometric(len + 1)
      sequence = seq.slice(0, len)
      nextVal = seq[len]
      rule = { label: `Multiply by ${ratio}`, description: `Each term is ${ratio}x the previous` }
      decoyRules = [
        { label: `Add ${ratio}`, description: `Each term increases by ${ratio}` },
        { label: `Power of ${ratio}`, description: `Each term is ${ratio} raised to a power` },
        { label: 'Doubling then halving', description: 'Alternates between doubling and halving' },
      ]
      break
    }
    case 'fib': {
      const { seq } = genFibLike(len + 1)
      sequence = seq.slice(0, len)
      nextVal = seq[len]
      rule = { label: 'Sum of previous two', description: 'Each term = sum of two preceding terms' }
      decoyRules = [
        { label: 'Multiply previous two', description: 'Each term = product of two preceding terms' },
        { label: 'Add increasing step', description: 'Step size grows by 1 each time' },
        { label: 'Double previous', description: 'Each term is double the previous' },
      ]
      break
    }
    case 'squares': {
      const { seq, offset } = genSquares(len + 1)
      sequence = seq.slice(0, len)
      nextVal = seq[len]
      rule = { label: 'Perfect squares', description: `Sequence of consecutive perfect squares (starting at ${offset}^2)` }
      decoyRules = [
        { label: 'Triangular numbers', description: 'Each term is a triangular number' },
        { label: 'Add increasing step', description: 'Differences increase by a constant' },
        { label: 'Prime numbers', description: 'Each term is the next prime' },
      ]
      break
    }
    case 'primes': {
      const allP = genPrimes(len + 1)
      sequence = allP.slice(0, len)
      nextVal = allP[len]
      rule = { label: 'Prime numbers', description: 'Each term is the next prime number' }
      decoyRules = [
        { label: 'Odd numbers', description: 'Each term is the next odd number' },
        { label: 'Add increasing step', description: 'Differences increase by 1 each time' },
        { label: 'Perfect squares', description: 'Each term is a perfect square' },
      ]
      break
    }
    case 'alt': {
      const { seq, stepA, stepB } = genAlternating(len + 1)
      sequence = seq.slice(0, len)
      nextVal = seq[len]
      rule = { label: `Two interleaved sequences`, description: `Odd positions +${stepA}, even positions +${stepB}` }
      decoyRules = [
        { label: `Add ${stepA + stepB}`, description: `Each term increases by ${stepA + stepB}` },
        { label: 'Fibonacci-like', description: 'Sum of previous two terms' },
        { label: `Multiply by 2`, description: 'Each term doubles' },
      ]
      break
    }
    case 'tri': {
      const allT = genTriangular(len + 1)
      sequence = allT.slice(0, len)
      nextVal = allT[len]
      rule = { label: 'Triangular numbers', description: 'n*(n+1)/2 for consecutive n' }
      decoyRules = [
        { label: 'Perfect squares', description: 'Consecutive perfect squares' },
        { label: 'Add increasing step', description: 'Step grows by 1' },
        { label: 'Fibonacci sums', description: 'Each is sum of previous two' },
      ]
      break
    }
    case 'arithExc': {
      const { seq, step, exceptionIndex } = genArithmeticWithException(len + 1)
      sequence = seq.slice(0, len)
      nextVal = seq[len]
      rule = { label: `+${step} with skip at position ${exceptionIndex + 1}`, description: `Adds ${step} each step, but position ${exceptionIndex + 1} skips ahead by +${step * 2}` }
      decoyRules = [
        { label: `Add ${step}`, description: `Simple +${step} sequence` },
        { label: 'Two interleaved sequences', description: 'Alternating between two progressions' },
        { label: 'Fibonacci-like', description: 'Sum of previous two terms' },
      ]
      break
    }
  }

  const allRules = shuffle([rule, ...decoyRules])
  const seq: SequenceElement[] = sequence.map(v => ({ kind: 'number' as const, value: v, display: String(v) }))
  const next: SequenceElement = { kind: 'number', value: nextVal, display: String(nextVal) }

  return { sequence: seq, rule, decoys: allRules.filter(r => r.label !== rule.label), nextElement: next, kind: 'number' }
}

function buildShapePuzzle(len: number): Puzzle {
  // Cycling through shapes with a fixed step
  const step = pick([1, 2, 3])
  const startIdx = randInt(0, 5)
  const indices = Array.from({ length: len + 1 }, (_, i) => (startIdx + i * step) % SHAPE_NAMES.length)
  const sequence: SequenceElement[] = indices.slice(0, len).map(idx => ({
    kind: 'shape' as const,
    value: idx,
    display: SHAPE_NAMES[idx],
  }))
  const nextElement: SequenceElement = {
    kind: 'shape',
    value: indices[len],
    display: SHAPE_NAMES[indices[len]],
  }
  const rule: PuzzleRule = {
    label: `Rotate shapes by ${step}`,
    description: `Cycle through shapes, advancing ${step} position${step > 1 ? 's' : ''} each step`,
  }
  const decoyRules: PuzzleRule[] = [
    { label: 'Random shapes', description: 'Shapes appear in random order' },
    { label: `Rotate shapes by ${step === 1 ? 2 : 1}`, description: `Advance ${step === 1 ? 2 : 1} shape(s) each step` },
    { label: 'Reverse cycle', description: 'Shapes cycle backward through the list' },
  ]
  return { sequence, rule, decoys: shuffle([rule, ...decoyRules]).filter(r => r.label !== rule.label), nextElement, kind: 'shape' }
}

function buildColorPuzzle(len: number): Puzzle {
  const step = pick([1, 2])
  const startIdx = randInt(0, COLOR_PALETTE.length - 1)
  const indices = Array.from({ length: len + 1 }, (_, i) => (startIdx + i * step) % COLOR_PALETTE.length)
  const sequence: SequenceElement[] = indices.slice(0, len).map(idx => ({
    kind: 'color' as const,
    value: idx,
    display: COLOR_NAMES[idx],
    color: COLOR_PALETTE[idx],
  }))
  const nextElement: SequenceElement = {
    kind: 'color',
    value: indices[len],
    display: COLOR_NAMES[indices[len]],
    color: COLOR_PALETTE[indices[len]],
  }
  const rule: PuzzleRule = {
    label: `Color cycle +${step}`,
    description: `Colors advance by ${step} in the palette each step`,
  }
  const decoyRules: PuzzleRule[] = [
    { label: 'Random colors', description: 'Colors appear randomly' },
    { label: `Color cycle +${step === 1 ? 2 : 1}`, description: `Colors advance by ${step === 1 ? 2 : 1}` },
    { label: 'Reverse color cycle', description: 'Colors move backward through the palette' },
  ]
  return { sequence, rule, decoys: shuffle([rule, ...decoyRules]).filter(r => r.label !== rule.label), nextElement, kind: 'color' }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function PatternHunter({ onBack }: Props) {
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [phase, setPhase] = useState<'rule' | 'predict' | 'result' | 'gameover'>('rule')
  const [puzzle, setPuzzle] = useState<Puzzle>(() => buildPuzzle(1))
  const [options, setOptions] = useState<PuzzleRule[]>([])
  const [selectedRule, setSelectedRule] = useState<number | null>(null)
  const [, setRuleCorrect] = useState(false)
  const [prediction, setPrediction] = useState('')
  const [predictionOptions, setPredictionOptions] = useState<SequenceElement[]>([])
  const [selectedPrediction, setSelectedPrediction] = useState<number | null>(null)
  const [timer, setTimer] = useState(30)
  const [resultMsg, setResultMsg] = useState('')
  const [resultOk, setResultOk] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [highScore, setHighScore] = useState(0)

  /* VFX state */
  const [particles, setParticles] = useState<Particle[]>([])
  const [scorePops, setScorePops] = useState<ScorePop[]>([])
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const vfxFrameRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // VFX animation loop — runs whenever there are active particles, pops, or shake
  const vfxActive = particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0.01
  useEffect(() => {
    if (!vfxActive) return
    const tick = () => {
      setParticles(prev => tickParticles(prev))
      setScorePops(prev => tickScorePops(prev))
      setShakeIntensity(prev => prev * 0.85)
      vfxFrameRef.current = requestAnimationFrame(tick)
    }
    vfxFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(vfxFrameRef.current)
  }, [vfxActive])

  /** Get click position relative to the game container */
  const relativePos = (e: React.MouseEvent): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 200, y: 300 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // Build shuffled options when puzzle changes
  useEffect(() => {
    const allOpts = shuffle([puzzle.rule, ...puzzle.decoys.slice(0, 3)])
    setOptions(allOpts)
  }, [puzzle])

  // Timer
  const timerLimit = Math.max(15, 30 - Math.floor(level / 2) * 2)

  const startTimer = useCallback(() => {
    setTimer(timerLimit)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [timerLimit])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Handle timer expiry
  useEffect(() => {
    if (timer > 0 && timer <= 5 && (phase === 'rule' || phase === 'predict')) {
      sfxTimer()
    }
    if (timer === 0 && (phase === 'rule' || phase === 'predict')) {
      stopTimer()
      sfxWrong()
      // Burst at center of container on timeout
      const cx = containerRef.current ? containerRef.current.clientWidth / 2 : 200
      const cy = containerRef.current ? containerRef.current.clientHeight / 2 : 300
      setParticles(prev => [...prev, ...wrongBurst(cx, cy)])
      setShakeIntensity(5)
      const newLives = lives - 1
      setLives(newLives)
      setStreak(0)
      if (newLives <= 0) {
        setPhase('gameover')
        setHighScore(prev => Math.max(prev, score))
        setParticles(prev => [...prev, ...confettiBurst(cx, cy)])
      } else {
        setResultMsg('Time ran out!')
        setResultOk(false)
        setPhase('result')
      }
    }
  }, [timer, phase, lives, score, stopTimer])

  // Start timer on new puzzle / phase
  useEffect(() => {
    if (phase === 'rule' || phase === 'predict') {
      startTimer()
    }
    return () => stopTimer()
  }, [phase, level, startTimer, stopTimer])

  const handleRuleSelect = (idx: number, e?: React.MouseEvent) => {
    if (selectedRule !== null) return
    sfxTap()
    setSelectedRule(idx)
    stopTimer()

    const chosen = options[idx]
    const correct = chosen.label === puzzle.rule.label
    const pos = e ? relativePos(e) : { x: 200, y: 300 }

    if (correct) {
      sfxCorrect()
      setRuleCorrect(true)
      setParticles(prev => [...prev, ...correctBurst(pos.x, pos.y)])
      setShakeIntensity(3)
      // Build prediction options
      const wrongPredictions: SequenceElement[] = []
      const next = puzzle.nextElement

      if (puzzle.kind === 'number') {
        const offsets = shuffle([-2, -1, 1, 2, 3, -3]).slice(0, 3)
        for (const off of offsets) {
          const v = next.value + off
          if (v !== next.value) {
            wrongPredictions.push({ kind: 'number', value: v, display: String(v) })
          }
        }
      } else if (puzzle.kind === 'shape') {
        const usedIndices = new Set([next.value])
        while (wrongPredictions.length < 3) {
          const ri = randInt(0, SHAPE_NAMES.length - 1)
          if (!usedIndices.has(ri)) {
            usedIndices.add(ri)
            wrongPredictions.push({ kind: 'shape', value: ri, display: SHAPE_NAMES[ri] })
          }
        }
      } else {
        const usedIndices = new Set([next.value])
        while (wrongPredictions.length < 3) {
          const ri = randInt(0, COLOR_PALETTE.length - 1)
          if (!usedIndices.has(ri)) {
            usedIndices.add(ri)
            wrongPredictions.push({ kind: 'color', value: ri, display: COLOR_NAMES[ri], color: COLOR_PALETTE[ri] })
          }
        }
      }
      setPredictionOptions(shuffle([next, ...wrongPredictions.slice(0, 3)]))
      setTimeout(() => {
        setPhase('predict')
        setSelectedRule(null)
        startTimer()
      }, 800)
    } else {
      sfxWrong()
      setParticles(prev => [...prev, ...wrongBurst(pos.x, pos.y)])
      setShakeIntensity(5)
      const newLives = lives - 1
      setLives(newLives)
      setStreak(0)
      if (newLives <= 0) {
        sfxGameOver()
        setHighScore(prev => Math.max(prev, score))
        setParticles(prev => [...prev, ...confettiBurst(pos.x, pos.y)])
        setPhase('gameover')
      } else {
        setResultMsg(`Wrong rule! The pattern was: ${puzzle.rule.label}`)
        setResultOk(false)
        setPhase('result')
      }
    }
  }

  const handlePrediction = (idx: number, e?: React.MouseEvent) => {
    if (selectedPrediction !== null) return
    sfxTap()
    setSelectedPrediction(idx)
    stopTimer()

    const chosen = predictionOptions[idx]
    const correct = chosen.value === puzzle.nextElement.value && chosen.kind === puzzle.nextElement.kind
    const pos = e ? relativePos(e) : { x: 200, y: 300 }

    if (correct) {
      sfxCorrect()
      const timeBonus = Math.floor(timer * 2)
      const streakBonus = streak * 5
      const levelPoints = 10 + level * 5 + timeBonus + streakBonus
      const newScore = score + levelPoints
      setScore(newScore)
      sfxCombo(streak + 1)
      setStreak(s => s + 1)
      setParticles(prev => [...prev, ...correctBurst(pos.x, pos.y)])
      setScorePops(prev => [...prev, createScorePop(pos.x, pos.y - 20, levelPoints)])
      setShakeIntensity(4)
      setResultMsg(`+${levelPoints} points! (${timeBonus} time bonus, ${streakBonus} streak bonus)`)
      setResultOk(true)
    } else {
      sfxWrong()
      setParticles(prev => [...prev, ...wrongBurst(pos.x, pos.y)])
      setShakeIntensity(6)
      const newLives = lives - 1
      setLives(newLives)
      setStreak(0)
      if (newLives <= 0) {
        sfxGameOver()
        setHighScore(prev => Math.max(prev, score))
        setParticles(prev => [...prev, ...confettiBurst(pos.x, pos.y)])
        setPhase('gameover')
        return
      }
      setResultMsg(`Wrong prediction! Next was: ${puzzle.nextElement.display}`)
      setResultOk(false)
    }
    setTimeout(() => setPhase('result'), 600)
  }

  const nextRound = () => {
    if (resultOk) sfxLevelUp()
    const newLevel = resultOk ? level + 1 : level
    setLevel(newLevel)
    const newPuzzle = buildPuzzle(newLevel)
    setPuzzle(newPuzzle)
    setSelectedRule(null)
    setSelectedPrediction(null)
    setPrediction('')
    setRuleCorrect(false)
    setPhase('rule')
  }

  const restart = () => {
    setLevel(1)
    setLives(3)
    setScore(0)
    setStreak(0)
    setPhase('rule')
    setSelectedRule(null)
    setSelectedPrediction(null)
    setPrediction('')
    setRuleCorrect(false)
    setPuzzle(buildPuzzle(1))
  }

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                   */
  /* ---------------------------------------------------------------- */

  const renderElement = (el: SequenceElement, size = 48) => {
    if (el.kind === 'number') {
      return (
        <div style={{
          width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: C.card, borderRadius: 8, border: `1px solid ${C.border}`,
          color: C.text, fontSize: size * 0.4, fontWeight: 700, fontFamily: 'monospace',
          ...GLASS,
        }}>
          {el.display}
        </div>
      )
    }
    if (el.kind === 'shape') {
      return (
        <div style={{
          width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: C.card, borderRadius: 8, border: `1px solid ${C.border}`,
          ...GLASS,
        }}>
          {renderShape(el.value, size * 0.6, C.accent)}
        </div>
      )
    }
    // color
    return (
      <div style={{
        width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.card, borderRadius: 8, border: `1px solid ${C.border}`,
        ...GLASS,
      }}>
        <div style={{
          width: size * 0.6, height: size * 0.6, borderRadius: size * 0.15,
          background: el.color ?? C.accent,
        }} />
      </div>
    )
  }

  const renderPredictionOption = (el: SequenceElement, size = 56) => {
    if (el.kind === 'number') return el.display
    if (el.kind === 'shape') return renderShape(el.value, size * 0.5, C.accent)
    return (
      <div style={{
        width: size * 0.5, height: size * 0.5, borderRadius: size * 0.1,
        background: el.color ?? C.accent,
      }} />
    )
  }

  /* ---------------------------------------------------------------- */
  /*  Main render                                                      */
  /* ---------------------------------------------------------------- */

  // suppress unused var warning
  void prediction
  void setPrediction

  return (
    <div ref={containerRef} style={{
      minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      ...screenShakeStyle(shakeIntensity),
      ...comboGlowStyle(streak, C.accent),
      backgroundColor: streakGlow(streak) !== 'transparent' ? undefined : C.bg,
      backgroundImage: streakGlow(streak) !== 'transparent' ? `radial-gradient(ellipse at center, ${streakGlow(streak)}, ${C.bg} 70%)` : undefined,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
        borderBottom: `1px solid ${C.border}`, background: C.obsidian,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: C.muted, cursor: 'pointer',
          display: 'flex', alignItems: 'center', padding: 4,
        }}>
          <ArrowLeft size={22} />
        </button>
        <Search size={20} color={C.accent} />
        <span style={{ fontWeight: 700, fontSize: 18, color: C.text }}>Pattern Hunter</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {Array.from({ length: 3 }, (_, i) => (
              <Heart key={i} size={16} fill={i < lives ? C.error : 'none'} color={i < lives ? C.error : C.dim} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.amber }}>
            <Zap size={14} />
            <span style={{ fontWeight: 600 }}>{streak}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.accent }}>
            <Trophy size={14} />
            <span style={{ fontWeight: 600 }}>{score}</span>
          </div>
        </div>
      </div>

      {/* Level & Timer bar */}
      {phase !== 'gameover' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
          background: C.carbon,
        }}>
          <span style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>LEVEL {level}</span>
          <div style={{ flex: 1, height: 6, background: C.border, borderRadius: PILL, overflow: 'hidden' }}>
            <div style={{
              width: `${(timer / timerLimit) * 100}%`,
              height: '100%',
              background: timer <= 5 ? C.error : timer <= 10 ? C.amber : C.accent,
              borderRadius: PILL,
              transition: 'width 1s linear, background 300ms ease',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: timer <= 5 ? C.error : C.muted, fontWeight: 600 }}>
            <Clock size={13} />
            {timer}s
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20, gap: 24, overflowY: 'auto' }}>

        {/* RULE PHASE */}
        {phase === 'rule' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>Find the hidden rule</p>
            </div>

            {/* Sequence display */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
              padding: 20, background: C.card, borderRadius: RADIUS, border: `1px solid ${C.border}`,
              width: '100%', maxWidth: 520, ...GLASS,
            }}>
              {puzzle.sequence.map((el, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {renderElement(el)}
                  {i < puzzle.sequence.length - 1 && (
                    <ChevronRight size={16} color={C.dim} />
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ChevronRight size={16} color={C.dim} />
                <div style={{
                  width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, border: `2px dashed ${C.dim}`, color: C.dim, fontSize: 20, fontWeight: 700,
                }}>
                  ?
                </div>
              </div>
            </div>

            {/* Rule options */}
            <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ color: C.muted, fontSize: 13, fontWeight: 600, margin: 0 }}>WHAT IS THE RULE?</p>
              {options.map((opt, i) => {
                const isSelected = selectedRule === i
                const isCorrect = opt.label === puzzle.rule.label
                const showResult = selectedRule !== null
                const bg = showResult
                  ? isCorrect ? C.accent : isSelected ? C.error : C.card
                  : isSelected ? C.accent : C.card
                const textColor = (showResult && isCorrect) || isSelected ? C.obsidian : C.text
                return (
                  <button
                    key={i}
                    onClick={(e) => handleRuleSelect(i, e)}
                    disabled={selectedRule !== null}
                    style={{
                      background: bg, color: textColor, border: `1px solid ${showResult && isCorrect ? C.accent : C.border}`,
                      borderRadius: RADIUS, padding: '14px 18px', textAlign: 'left', cursor: selectedRule !== null ? 'default' : 'pointer',
                      transition: '200ms ease', fontWeight: 600, fontSize: 15,
                      ...GLASS,
                    }}
                  >
                    <div>{opt.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 400, opacity: 0.7, marginTop: 2 }}>{opt.description}</div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* PREDICT PHASE */}
        {phase === 'predict' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{
                display: 'inline-block', background: C.accent, color: C.obsidian, borderRadius: PILL,
                padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 8,
              }}>
                RULE IDENTIFIED
              </div>
              <p style={{ color: C.text, fontSize: 16, fontWeight: 600, margin: '4px 0' }}>
                {puzzle.rule.label}
              </p>
              <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                Now predict the next element
              </p>
            </div>

            {/* Sequence with blank */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
              padding: 20, background: C.card, borderRadius: RADIUS, border: `1px solid ${C.border}`,
              width: '100%', maxWidth: 520, ...GLASS,
            }}>
              {puzzle.sequence.map((el, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {renderElement(el)}
                  {i < puzzle.sequence.length - 1 && <ChevronRight size={16} color={C.dim} />}
                </div>
              ))}
              <ChevronRight size={16} color={C.dim} />
              <div style={{
                width: 48, height: 48, borderRadius: 8, border: `2px solid ${C.accent}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.accent, fontSize: 20, fontWeight: 700,
              }}>
                ?
              </div>
            </div>

            {/* Prediction options */}
            <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ color: C.muted, fontSize: 13, fontWeight: 600, margin: 0 }}>WHAT COMES NEXT?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {predictionOptions.map((opt, i) => {
                  const isSelected = selectedPrediction === i
                  const isCorrect = opt.value === puzzle.nextElement.value && opt.kind === puzzle.nextElement.kind
                  const showResult = selectedPrediction !== null
                  const bg = showResult
                    ? isCorrect ? C.accent : isSelected ? C.error : C.card
                    : isSelected ? C.accent : C.card
                  const textColor = (showResult && isCorrect) || isSelected ? C.obsidian : C.text
                  return (
                    <button
                      key={i}
                      onClick={(e) => handlePrediction(i, e)}
                      disabled={selectedPrediction !== null}
                      style={{
                        background: bg, color: textColor, border: `1px solid ${showResult && isCorrect ? C.accent : C.border}`,
                        borderRadius: RADIUS, padding: 16, cursor: selectedPrediction !== null ? 'default' : 'pointer',
                        transition: '200ms ease', fontWeight: 700, fontSize: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 64,
                        ...GLASS,
                      }}
                    >
                      {renderPredictionOption(opt)}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* RESULT PHASE */}
        {phase === 'result' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            padding: 32, background: C.card, borderRadius: RADIUS, border: `1px solid ${C.border}`,
            width: '100%', maxWidth: 420, marginTop: 40, ...GLASS,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: resultOk ? C.accent : C.error,
            }}>
              {resultOk ? <Trophy size={28} color={C.obsidian} /> : <Heart size={28} color={C.text} />}
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0, textAlign: 'center', color: resultOk ? C.accent : C.error }}>
              {resultOk ? 'Correct!' : 'Incorrect'}
            </p>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, textAlign: 'center' }}>
              {resultMsg}
            </p>
            <button
              onClick={nextRound}
              style={{
                background: C.accent, color: C.obsidian, border: 'none', borderRadius: PILL,
                padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                ...GLASS,
              }}
            >
              {resultOk ? 'Next Level' : 'Try Again'}
            </button>
          </div>
        )}

        {/* GAME OVER */}
        {phase === 'gameover' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            padding: 32, background: C.card, borderRadius: RADIUS, border: `1px solid ${C.border}`,
            width: '100%', maxWidth: 420, marginTop: 40, ...GLASS,
          }}>
            <Trophy size={48} color={C.accent} />
            <p style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Game Over</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 16, color: C.muted, margin: 0 }}>
                Final Score: <span style={{ color: C.accent, fontWeight: 700 }}>{score}</span>
              </p>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
                Level Reached: <span style={{ color: C.text, fontWeight: 600 }}>{level}</span>
              </p>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
                Best Score: <span style={{ color: C.amber, fontWeight: 600 }}>{Math.max(highScore, score)}</span>
              </p>
            </div>
            <button
              onClick={restart}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: C.accent, color: C.obsidian, border: 'none', borderRadius: PILL,
                padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                ...GLASS,
              }}
            >
              <RotateCcw size={16} /> Play Again
            </button>
          </div>
        )}
      </div>

      {/* VFX particles */}
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}

      {/* VFX score pops */}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </div>
  )
}
