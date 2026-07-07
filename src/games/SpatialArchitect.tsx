import type React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Heart, Clock, RotateCcw, Trophy, Zap, Eye, Scissors } from 'lucide-react'
import { sfxTap, sfxCorrect, sfxWrong, sfxGameOver, sfxLevelUp, sfxCombo } from '../lib/sfx'
import { Particle, ScorePop, correctBurst, wrongBurst, confettiBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle, comboGlowStyle } from '../lib/vfx'

/* ------------------------------------------------------------------ */
/*  Design tokens                                                     */
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
} as const

const RADIUS = { sm: 8, md: 14, lg: 20 }
const PILL = 999

const GLASS = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
} as const

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type PuzzleType = 'rotation' | 'mirror' | 'paper_fold'
type Point = [number, number]

interface Shape {
  cells: Point[]
  color: string
}

interface Puzzle {
  type: PuzzleType
  reference: Shape
  options: Shape[]
  correctIndex: number
  /** For paper fold: fold line + punch position */
  foldData?: {
    foldAxis: 'horizontal' | 'vertical'
    punchPos: Point
  }
}

type GamePhase = 'menu' | 'playing' | 'feedback' | 'gameover'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const GRID = 6
const TIMER_SECONDS = 25
const MAX_LIVES = 3
const POINTS_BASE = 100
const POINTS_SPEED = 50
const SPEED_THRESHOLD = 10
const BLOCK_COLORS = [C.violet, C.teal, C.sapphire, C.emerald, C.amber, C.rose]
const PUZZLE_TYPES: PuzzleType[] = ['rotation', 'mirror', 'paper_fold']

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Generate a connected polyomino of size n on a 6x6 grid */
function generateShape(size: number): Point[] {
  const cells: Point[] = [[3, 3]]
  const visited = new Set<string>()
  visited.add('3,3')

  while (cells.length < size) {
    const base = cells[Math.floor(Math.random() * cells.length)]
    const dirs: Point[] = [[0, -1], [0, 1], [-1, 0], [1, 0]]
    const d = dirs[Math.floor(Math.random() * dirs.length)]
    const nx = base[0] + d[0]
    const ny = base[1] + d[1]
    const key = `${nx},${ny}`
    if (nx >= 0 && nx < GRID && ny >= 0 && ny < GRID && !visited.has(key)) {
      cells.push([nx, ny])
      visited.add(key)
    }
  }

  return normalizeShape(cells)
}

/** Translate shape so min x,y = 0 */
function normalizeShape(cells: Point[]): Point[] {
  const minX = Math.min(...cells.map(c => c[0]))
  const minY = Math.min(...cells.map(c => c[1]))
  return cells.map(c => [c[0] - minX, c[1] - minY] as Point).sort((a, b) => a[1] - b[1] || a[0] - b[0])
}

/** Rotate shape 90 degrees clockwise */
function rotateShape(cells: Point[]): Point[] {
  return normalizeShape(cells.map(([x, y]) => [GRID - 1 - y, x] as Point))
}

/** Mirror shape horizontally */
function mirrorShape(cells: Point[]): Point[] {
  const maxX = Math.max(...cells.map(c => c[0]))
  return normalizeShape(cells.map(([x, y]) => [maxX - x, y] as Point))
}

/** Check if two shapes are identical */
function shapesEqual(a: Point[], b: Point[]): boolean {
  if (a.length !== b.length) return false
  const na = normalizeShape(a)
  const nb = normalizeShape(b)
  return na.every((c, i) => c[0] === nb[i][0] && c[1] === nb[i][1])
}

/** Generate a distinct distractor (rotated/mirrored but not matching target) */
function generateDistractor(original: Point[], target: Point[]): Point[] {
  // Try random rotations + optional mirror
  for (let attempt = 0; attempt < 50; attempt++) {
    let shape = [...original]
    const rotations = randInt(1, 3)
    for (let r = 0; r < rotations; r++) shape = rotateShape(shape)
    if (Math.random() > 0.5) shape = mirrorShape(shape)
    // Also try shifting a cell
    if (Math.random() > 0.6 && shape.length > 3) {
      const shifted = [...shape]
      const idx = randInt(0, shifted.length - 1)
      const dx = randInt(-1, 1)
      const dy = randInt(-1, 1)
      shifted[idx] = [shifted[idx][0] + dx, shifted[idx][1] + dy] as Point
      shape = normalizeShape(shifted)
    }
    if (!shapesEqual(shape, target) && !shapesEqual(shape, original)) {
      return shape
    }
  }
  // Fallback: just remove a cell and add adjacent
  const fallback = [...original]
  if (fallback.length > 2) {
    fallback.pop()
  }
  return normalizeShape(fallback)
}

/* ------------------------------------------------------------------ */
/*  Puzzle generators                                                 */
/* ------------------------------------------------------------------ */
function generateRotationPuzzle(level: number): Puzzle {
  const size = Math.min(4 + Math.floor(level / 3), 8)
  const cells = generateShape(size)
  const color = pick(BLOCK_COLORS)

  const rotations = randInt(1, 3)
  let correct = [...cells]
  for (let i = 0; i < rotations; i++) correct = rotateShape(correct)

  const options: Shape[] = []
  const correctIndex = randInt(0, 3)

  for (let i = 0; i < 4; i++) {
    if (i === correctIndex) {
      options.push({ cells: correct, color })
    } else {
      const distractor = generateDistractor(cells, correct)
      options.push({ cells: distractor, color })
    }
  }

  return {
    type: 'rotation',
    reference: { cells, color },
    options,
    correctIndex,
  }
}

function generateMirrorPuzzle(level: number): Puzzle {
  const size = Math.min(4 + Math.floor(level / 3), 8)
  const cells = generateShape(size)
  const color = pick(BLOCK_COLORS)

  const correct = mirrorShape(cells)

  // Ensure reference and correct are different
  if (shapesEqual(cells, correct)) {
    return generateMirrorPuzzle(level) // re-roll symmetric shapes
  }

  const options: Shape[] = []
  const correctIndex = randInt(0, 3)

  for (let i = 0; i < 4; i++) {
    if (i === correctIndex) {
      options.push({ cells: correct, color })
    } else {
      const distractor = generateDistractor(cells, correct)
      options.push({ cells: distractor, color })
    }
  }

  return {
    type: 'mirror',
    reference: { cells, color },
    options,
    correctIndex,
  }
}

function generatePaperFoldPuzzle(level: number): Puzzle {
  const foldAxis: 'horizontal' | 'vertical' = Math.random() > 0.5 ? 'horizontal' : 'vertical'

  // Generate punch positions on one side of the fold
  const numPunches = Math.min(1 + Math.floor(level / 4), 3)
  const punches: Point[] = []

  for (let i = 0; i < numPunches; i++) {
    let px: number
    let py: number
    if (foldAxis === 'vertical') {
      px = randInt(0, 2) // Left half
      py = randInt(0, GRID - 1)
    } else {
      px = randInt(0, GRID - 1)
      py = randInt(0, 2) // Top half
    }
    punches.push([px, py])
  }

  // Correct unfolded result: original punches + mirrored punches
  const correct: Point[] = []
  for (const [px, py] of punches) {
    correct.push([px, py])
    if (foldAxis === 'vertical') {
      correct.push([GRID - 1 - px, py])
    } else {
      correct.push([px, GRID - 1 - py])
    }
  }
  const normalCorrect = normalizeShape(correct)

  const color = pick(BLOCK_COLORS)
  const options: Shape[] = []
  const correctIndex = randInt(0, 3)

  for (let i = 0; i < 4; i++) {
    if (i === correctIndex) {
      options.push({ cells: normalCorrect, color })
    } else {
      // Distractor: shift one punch or use wrong axis
      const wrongPunches: Point[] = []
      for (const [px, py] of punches) {
        wrongPunches.push([px, py])
        if (foldAxis === 'vertical') {
          const offset = randInt(-1, 1)
          wrongPunches.push([Math.max(0, Math.min(GRID - 1, GRID - 1 - px + offset)), py])
        } else {
          const offset = randInt(-1, 1)
          wrongPunches.push([px, Math.max(0, Math.min(GRID - 1, GRID - 1 - py + offset))])
        }
      }
      const dist = normalizeShape(wrongPunches)
      if (shapesEqual(dist, normalCorrect)) {
        // Just shift everything
        const shifted = wrongPunches.map(([x, y]) => [Math.min(x + 1, GRID - 1), y] as Point)
        options.push({ cells: normalizeShape(shifted), color })
      } else {
        options.push({ cells: dist, color })
      }
    }
  }

  // Reference shows the folded paper with punch
  const foldedCells = punches
  return {
    type: 'paper_fold',
    reference: { cells: foldedCells, color },
    options,
    correctIndex,
    foldData: { foldAxis, punchPos: punches[0] },
  }
}

function generatePuzzle(level: number): Puzzle {
  const typeIndex = level % 3
  const puzzleType = PUZZLE_TYPES[typeIndex]
  switch (puzzleType) {
    case 'rotation': return generateRotationPuzzle(level)
    case 'mirror': return generateMirrorPuzzle(level)
    case 'paper_fold': return generatePaperFoldPuzzle(level)
  }
}

/* ------------------------------------------------------------------ */
/*  SVG Shape renderer                                                */
/* ------------------------------------------------------------------ */
function ShapeGrid({ cells, color, size = 120, highlight, dimmed }: {
  cells: Point[]
  color: string
  size?: number
  highlight?: string
  dimmed?: boolean
}) {
  const cellSize = size / GRID
  const borderColor = highlight ?? C.border

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={0} y={0} width={size} height={size} rx={RADIUS.sm} fill={C.surface} stroke={borderColor} strokeWidth={1.5} />
      {/* Grid lines */}
      {Array.from({ length: GRID - 1 }).map((_, i) => (
        <g key={i}>
          <line x1={(i + 1) * cellSize} y1={0} x2={(i + 1) * cellSize} y2={size} stroke={C.border} strokeWidth={0.5} strokeOpacity={0.3} />
          <line x1={0} y1={(i + 1) * cellSize} x2={size} y2={(i + 1) * cellSize} stroke={C.border} strokeWidth={0.5} strokeOpacity={0.3} />
        </g>
      ))}
      {/* Blocks */}
      {cells.map(([x, y], i) => (
        <rect
          key={i}
          x={x * cellSize + 1}
          y={y * cellSize + 1}
          width={cellSize - 2}
          height={cellSize - 2}
          rx={3}
          fill={dimmed ? C.dim : color}
          opacity={dimmed ? 0.4 : 1}
        />
      ))}
    </svg>
  )
}

function PaperFoldReference({ cells, color, foldAxis, size = 120 }: {
  cells: Point[]
  color: string
  foldAxis: 'horizontal' | 'vertical'
  size?: number
}) {
  const cellSize = size / GRID
  const mid = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={0} y={0} width={size} height={size} rx={RADIUS.sm} fill={C.surface} stroke={C.border} strokeWidth={1.5} />
      {/* Paper background */}
      {foldAxis === 'vertical' ? (
        <rect x={0} y={0} width={mid} height={size} fill={C.carbon} rx={RADIUS.sm} />
      ) : (
        <rect x={0} y={0} width={size} height={mid} fill={C.carbon} rx={RADIUS.sm} />
      )}
      {/* Fold line */}
      {foldAxis === 'vertical' ? (
        <line x1={mid} y1={0} x2={mid} y2={size} stroke={C.amber} strokeWidth={2} strokeDasharray="4,4" />
      ) : (
        <line x1={0} y1={mid} x2={size} y2={mid} stroke={C.amber} strokeWidth={2} strokeDasharray="4,4" />
      )}
      {/* Punch holes */}
      {cells.map(([x, y], i) => (
        <circle
          key={i}
          cx={x * cellSize + cellSize / 2}
          cy={y * cellSize + cellSize / 2}
          r={cellSize / 3}
          fill={color}
          stroke={C.white}
          strokeWidth={1}
        />
      ))}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export default function SpatialArchitect({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<GamePhase>('menu')
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [streak, setStreak] = useState(0)
  const [timer, setTimer] = useState(TIMER_SECONDS)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [feedbackCorrect, setFeedbackCorrect] = useState(false)
  const [highScore, setHighScore] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [scorePops, setScorePops] = useState<ScorePop[]>([])
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  const startGame = useCallback(() => {
    sfxTap()
    setPhase('playing')
    setLevel(1)
    setScore(0)
    setLives(MAX_LIVES)
    setStreak(0)
    setTimer(TIMER_SECONDS)
    setSelected(null)
    setPuzzle(generatePuzzle(1))
  }, [])

  const nextPuzzle = useCallback(() => {
    sfxLevelUp()
    const next = level + 1
    if (containerRef.current && next % 3 === 0) {
      const rect = containerRef.current.getBoundingClientRect()
      setParticles(prev => [...prev, ...confettiBurst(rect.width / 2, rect.height / 3)])
    }
    setLevel(next)
    setTimer(TIMER_SECONDS)
    setSelected(null)
    setPhase('playing')
    setPuzzle(generatePuzzle(next))
  }, [level])

  const endGame = useCallback(() => {
    sfxGameOver()
    setPhase('gameover')
    setHighScore(prev => Math.max(prev, score))
    if (timerRef.current) clearInterval(timerRef.current)
  }, [score])

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Time's up
          sfxWrong()
          setLives(l => {
            const nl = l - 1
            if (nl <= 0) {
              setTimeout(() => endGame(), 0)
            } else {
              setStreak(0)
              setFeedbackCorrect(false)
              setPhase('feedback')
              setTimeout(() => nextPuzzle(), 1200)
            }
            return nl
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, endGame, nextPuzzle])

  useEffect(() => {
    if (particles.length === 0 && scorePops.length === 0 && shakeIntensity <= 0.01) return
    const tick = () => {
      setParticles(prev => tickParticles(prev))
      setScorePops(prev => tickScorePops(prev))
      setShakeIntensity(prev => prev * 0.85)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0.01])

  const handleSelect = useCallback((index: number) => {
    if (phase !== 'playing' || selected !== null || !puzzle) return
    setSelected(index)

    const isCorrect = index === puzzle.correctIndex
    setFeedbackCorrect(isCorrect)

    if (isCorrect) {
      sfxCorrect()
      const timeBonus = timer > SPEED_THRESHOLD ? POINTS_SPEED : 0
      const streakMultiplier = 1 + streak * 0.25
      const points = Math.round((POINTS_BASE + timeBonus) * streakMultiplier)
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const cx = rect.width / 2
        const cy = rect.height / 2
        setParticles(prev => [...prev, ...correctBurst(cx, cy)])
        setScorePops(prev => [...prev, createScorePop(cx, cy - 40, points, '#00c97b')])
      }
      setScore(s => s + points)
      setStreak(s => {
        const next = s + 1
        if (next >= 2) sfxCombo(next)
        return next
      })
    } else {
      sfxWrong()
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const cx = rect.width / 2
        const cy = rect.height / 2
        setParticles(prev => [...prev, ...wrongBurst(cx, cy)])
        setShakeIntensity(3)
      }
      setStreak(0)
      setLives(l => {
        const nl = l - 1
        if (nl <= 0) {
          setTimeout(() => endGame(), 1200)
        }
        return nl
      })
    }

    setPhase('feedback')
    if (isCorrect || lives > 1) {
      setTimeout(() => nextPuzzle(), 1200)
    }
  }, [phase, selected, puzzle, timer, streak, lives, endGame, nextPuzzle])

  /* ------------------------------------------------------------------ */
  /*  Styles                                                            */
  /* ------------------------------------------------------------------ */
  const S: Record<string, React.CSSProperties> = {
    root: {
      minHeight: '100vh',
      background: C.slate,
      color: C.white,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '16px 16px 40px',
      boxSizing: 'border-box',
    },
    header: {
      width: '100%',
      maxWidth: 540,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
      flexWrap: 'wrap',
    },
    backBtn: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.md,
      color: C.white,
      padding: '8px 10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      ...GLASS,
    },
    chip: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: PILL,
      padding: '6px 14px',
      fontSize: 13,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      ...GLASS,
    },
    timerBar: {
      width: '100%',
      maxWidth: 540,
      height: 6,
      background: C.surface,
      borderRadius: PILL,
      overflow: 'hidden',
      marginBottom: 24,
      border: `1px solid ${C.border}`,
    },
    timerFill: {
      height: '100%',
      borderRadius: PILL,
      transition: 'width 1s linear, background-color 400ms ease',
    },
    card: {
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.lg,
      padding: 32,
      textAlign: 'center' as const,
      maxWidth: 540,
      width: '100%',
      ...GLASS,
    },
    puzzleLabel: {
      fontSize: 14,
      fontWeight: 600,
      color: C.violet,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    instruction: {
      fontSize: 16,
      color: C.muted,
      marginBottom: 20,
    },
    refSection: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 24,
    },
    optionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 12,
      maxWidth: 280,
      margin: '0 auto',
    },
    optionBtn: {
      background: C.carbon,
      border: `2px solid ${C.border}`,
      borderRadius: RADIUS.md,
      cursor: 'pointer',
      padding: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'border-color 200ms ease, transform 100ms ease',
      ...GLASS,
    },
    menuTitle: {
      fontSize: 32,
      fontWeight: 600,
      marginBottom: 8,
      color: C.white,
    },
    menuSub: {
      fontSize: 16,
      color: C.muted,
      marginBottom: 32,
    },
    startBtn: {
      background: C.violet,
      border: 'none',
      borderRadius: RADIUS.md,
      color: C.white,
      padding: '14px 40px',
      fontSize: 16,
      fontWeight: 700,
      cursor: 'pointer',
      ...GLASS,
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: C.carbon,
      border: `1px solid ${C.border}`,
      borderRadius: PILL,
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: 600,
      color: C.muted,
      marginTop: 16,
    },
    streakBadge: {
      background: C.carbon,
      border: `1px solid ${C.amber}`,
      borderRadius: PILL,
      padding: '4px 12px',
      fontSize: 12,
      fontWeight: 700,
      color: C.amber,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    },
    featureRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: 16,
      marginTop: 24,
      flexWrap: 'wrap' as const,
    },
    featureChip: {
      background: C.carbon,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS.sm,
      padding: '8px 14px',
      fontSize: 12,
      color: C.muted,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
  }

  const timerPct = (timer / TIMER_SECONDS) * 100
  const timerColor = timer <= 5 ? C.rose : timer <= 10 ? C.amber : C.violet

  const puzzleTypeLabel = (type: PuzzleType): string => {
    switch (type) {
      case 'rotation': return 'Mental Rotation'
      case 'mirror': return 'Mirror Image'
      case 'paper_fold': return 'Paper Folding'
    }
  }

  const puzzleInstruction = (type: PuzzleType): string => {
    switch (type) {
      case 'rotation': return 'Which option shows this shape rotated?'
      case 'mirror': return 'Which option shows the mirror image?'
      case 'paper_fold': return 'What does the paper look like when unfolded?'
    }
  }

  const puzzleIcon = (type: PuzzleType) => {
    switch (type) {
      case 'rotation': return <RotateCcw size={14} />
      case 'mirror': return <Eye size={14} />
      case 'paper_fold': return <Scissors size={14} />
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Menu screen                                                       */
  /* ------------------------------------------------------------------ */
  if (phase === 'menu') {
    return (
      <div ref={containerRef} style={{ ...S.root, position: 'relative', overflow: 'hidden' }}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={onBack}><ArrowLeft size={18} /></button>
          <span style={{ fontSize: 18, fontWeight: 700 }}>Spatial Architect</span>
        </div>

        <div style={S.card}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            <RotateCcw size={48} color={C.violet} />
          </div>
          <div style={S.menuTitle}>Spatial Architect</div>
          <div style={S.menuSub}>Mental rotation and spatial reasoning</div>

          <div style={S.featureRow}>
            <div style={S.featureChip}>
              <RotateCcw size={14} color={C.violet} /> Rotation
            </div>
            <div style={S.featureChip}>
              <Eye size={14} color={C.teal} /> Mirror
            </div>
            <div style={S.featureChip}>
              <Scissors size={14} color={C.amber} /> Paper Fold
            </div>
          </div>

          <div style={{ marginTop: 24, marginBottom: 24, padding: '16px 0', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.8 }}>
              <div>{TIMER_SECONDS}s per puzzle &middot; {MAX_LIVES} lives</div>
              <div>Streak multiplier &middot; Speed bonuses</div>
              <div>Increasing complexity over 12+ levels</div>
            </div>
          </div>

          <button style={S.startBtn} onClick={startGame}>Start Game</button>

          {highScore > 0 && (
            <div style={S.badge}>
              <Trophy size={12} color={C.amber} /> Best: {highScore}
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /*  Game over screen                                                  */
  /* ------------------------------------------------------------------ */
  if (phase === 'gameover') {
    const isNewHigh = score >= highScore && score > 0
    return (
      <div ref={containerRef} style={{ ...S.root, position: 'relative', overflow: 'hidden' }}>
        <div style={S.header}>
          <button style={S.backBtn} onClick={onBack}><ArrowLeft size={18} /></button>
        </div>

        <div style={S.card}>
          <Trophy size={48} color={isNewHigh ? C.amber : C.muted} style={{ marginBottom: 16 }} />
          <div style={S.menuTitle}>{isNewHigh ? 'New High Score!' : 'Game Over'}</div>
          <div style={{ fontSize: 48, fontWeight: 600, color: C.violet, margin: '16px 0' }}>{score}</div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 8 }}>Level {level} reached</div>
          {highScore > 0 && (
            <div style={S.badge}><Trophy size={12} color={C.amber} /> Best: {highScore}</div>
          )}
          <div style={{ marginTop: 24 }}>
            <button style={S.startBtn} onClick={startGame}>
              <RotateCcw size={16} style={{ marginRight: 8 }} /> Play Again
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <button style={{ ...S.startBtn, background: C.surface, border: `1px solid ${C.border}` }} onClick={onBack}>
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /*  Playing / Feedback screen                                         */
  /* ------------------------------------------------------------------ */
  if (!puzzle) return null

  return (
    <div ref={containerRef} style={{ ...S.root, position: 'relative', overflow: 'hidden', ...screenShakeStyle(shakeIntensity), ...comboGlowStyle(streak, '#f59e0b') }}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={onBack}><ArrowLeft size={18} /></button>
        <div style={S.chip}><Trophy size={14} color={C.amber} /> {score}</div>
        <div style={S.chip}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart key={i} size={14} fill={i < lives ? C.rose : 'transparent'} color={i < lives ? C.rose : C.dim} />
          ))}
        </div>
        <div style={S.chip}><Clock size={14} color={timerColor} /> {timer}s</div>
        <div style={S.chip}>Lv {level}</div>
        {streak >= 2 && (
          <div style={S.streakBadge}><Zap size={12} /> {streak}x</div>
        )}
      </div>

      {/* Timer bar */}
      <div style={S.timerBar}>
        <div style={{ ...S.timerFill, width: `${timerPct}%`, background: timerColor }} />
      </div>

      {/* Puzzle card */}
      <div style={S.card}>
        {/* Type label */}
        <div style={S.puzzleLabel}>
          <span style={{ marginRight: 6 }}>{puzzleIcon(puzzle.type)}</span>
          {puzzleTypeLabel(puzzle.type)}
        </div>
        <div style={S.instruction}>{puzzleInstruction(puzzle.type)}</div>

        {/* Reference shape */}
        <div style={S.refSection}>
          <div style={{ border: `2px solid ${C.violet}`, borderRadius: RADIUS.md, padding: 8, display: 'inline-block' }}>
            {puzzle.type === 'paper_fold' && puzzle.foldData ? (
              <PaperFoldReference
                cells={puzzle.reference.cells}
                color={puzzle.reference.color}
                foldAxis={puzzle.foldData.foldAxis}
                size={140}
              />
            ) : (
              <ShapeGrid cells={puzzle.reference.cells} color={puzzle.reference.color} size={140} />
            )}
          </div>
        </div>

        {/* Options */}
        <div style={S.optionsGrid}>
          {puzzle.options.map((opt, i) => {
            let borderColor: string = C.border
            if (phase === 'feedback' && selected !== null) {
              if (i === puzzle.correctIndex) borderColor = C.emerald
              else if (i === selected) borderColor = C.rose
            } else if (selected === i) {
              borderColor = C.violet
            }

            return (
              <button
                key={i}
                style={{
                  ...S.optionBtn,
                  borderColor,
                  transform: phase === 'feedback' && i === puzzle.correctIndex ? 'scale(1.05)' : 'scale(1)',
                  opacity: phase === 'feedback' && i !== puzzle.correctIndex && i !== selected ? 0.4 : 1,
                }}
                onClick={() => handleSelect(i)}
                disabled={phase === 'feedback'}
              >
                <ShapeGrid
                  cells={opt.cells}
                  color={opt.color}
                  size={110}
                  highlight={borderColor !== C.border ? borderColor : undefined}
                />
              </button>
            )
          })}
        </div>

        {/* Feedback message */}
        {phase === 'feedback' && (
          <div style={{
            marginTop: 16,
            fontSize: 14,
            fontWeight: 700,
            color: feedbackCorrect ? C.emerald : C.rose,
          }}>
            {feedbackCorrect ? 'Correct!' : 'Wrong answer'}
            {feedbackCorrect && streak >= 2 && (
              <span style={{ color: C.amber, marginLeft: 8 }}>{streak}x streak!</span>
            )}
          </div>
        )}
      </div>
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </div>
  )
}
