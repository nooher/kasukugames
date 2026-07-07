import type React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Heart, Clock, RotateCcw, Trophy, Zap } from 'lucide-react'
import { sfxTap, sfxCorrect, sfxWrong, sfxLevelUp, sfxGameOver, sfxScore, sfxTimer } from '../lib/sfx'
import { type Particle, type ScorePop, correctBurst, wrongBurst, confettiBurst, tickParticles, renderParticleStyle, createScorePop, tickScorePops, scorePopStyle, screenShakeStyle } from '../lib/vfx'

/* ------------------------------------------------------------------ */
/*  Design tokens                                                     */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#1a2230',
  card: '#151d2b',
  border: '#1f2d3d',
  accent: '#3a86ff',
  success: '#00c97b',
  error: '#f43f5e',
  text: '#f0f4f8',
  muted: '#7a8ba0',
  warn: '#f59e0b',
} as const

const RADIUS = 14
const PILL = 999

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type Shape = 'circle' | 'square' | 'triangle' | 'diamond'
type ShapeColor = string
type ShapeSize = 'sm' | 'md' | 'lg'
type Rotation = 0 | 90 | 180 | 270

interface CellData {
  shape: Shape
  color: ShapeColor
  size: ShapeSize
  count: number
  rotation: Rotation
}

interface Puzzle {
  grid: (CellData | null)[][] // NxN, bottom-right is null
  answer: CellData
  options: CellData[]
  gridDim: number
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const SHAPES: Shape[] = ['circle', 'square', 'triangle', 'diamond']
const COLORS: ShapeColor[] = [C.accent, C.success, C.error, C.warn, '#a78bfa', '#f97316']
const SIZES: ShapeSize[] = ['sm', 'md', 'lg']
const SIZE_PX: Record<ShapeSize, number> = { sm: 14, md: 22, lg: 30 }
const ROTATIONS: Rotation[] = [0, 90, 180, 270]

const TIMER_SECONDS = 30
const POINTS_CORRECT = 100
const POINTS_SPEED_BONUS = 50
const POINTS_WRONG = -25
const SPEED_THRESHOLD = 10
const MAX_LIVES = 3

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function idx(val: string, arr: readonly string[]): number {
  return arr.indexOf(val)
}

function wrap<T>(arr: readonly T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length]
}

function cellEq(a: CellData, b: CellData): boolean {
  return a.shape === b.shape && a.color === b.color && a.size === b.size && a.count === b.count && a.rotation === b.rotation
}

/* ------------------------------------------------------------------ */
/*  Rule engine                                                       */
/* ------------------------------------------------------------------ */
type RuleAxis = 'row' | 'col'
type RuleKind = 'shape' | 'color' | 'size' | 'count' | 'rotation'

interface Rule {
  axis: RuleAxis
  kind: RuleKind
}

function applyRule(base: CellData, rule: Rule, step: number): CellData {
  const out = { ...base }
  switch (rule.kind) {
    case 'shape':
      out.shape = wrap(SHAPES, idx(base.shape, SHAPES) + step)
      break
    case 'color':
      out.color = wrap(COLORS, idx(base.color, COLORS) + step)
      break
    case 'size':
      out.size = wrap(SIZES, idx(base.size, SIZES) + step)
      break
    case 'count':
      out.count = Math.max(1, Math.min(4, base.count + step))
      break
    case 'rotation':
      out.rotation = wrap(ROTATIONS, ROTATIONS.indexOf(base.rotation) + step) as Rotation
      break
  }
  return out
}

function gridDimForLevel(level: number): number {
  return level >= 7 ? 4 : 3
}

function generatePuzzle(level: number): Puzzle {
  const gridDim = gridDimForLevel(level)

  // Decide how many rules based on level
  let numRules: number
  if (level <= 3) numRules = 1
  else if (level <= 6) numRules = 3
  else if (level <= 9) numRules = 3
  else numRules = 4

  // Pick distinct rule kinds (include rotation)
  const allKinds: RuleKind[] = shuffle(['shape', 'color', 'size', 'count', 'rotation'] as RuleKind[])
  const rules: Rule[] = []

  // First rule always on rows
  rules.push({ axis: 'row', kind: allKinds[0] })
  if (numRules >= 2) rules.push({ axis: 'col', kind: allKinds[1] })
  if (numRules >= 3) rules.push({ axis: pick(['row', 'col'] as RuleAxis[]), kind: allKinds[2] })
  if (numRules >= 4) rules.push({ axis: pick(['row', 'col'] as RuleAxis[]), kind: allKinds[3] })

  // At level 8+, allow combined transformations: a single rule step
  // may affect two properties at once. We add a "combo" rule that
  // piggybacks an extra kind on an existing axis.
  if (level >= 8 && numRules >= 3) {
    const usedKinds = new Set(rules.map(r => r.kind))
    const remaining = (['shape', 'color', 'size', 'count', 'rotation'] as RuleKind[]).filter(k => !usedKinds.has(k))
    if (remaining.length > 0) {
      rules.push({ axis: rules[0].axis, kind: remaining[0] })
    }
  }

  // Build base cell for (0,0)
  const base: CellData = {
    shape: pick(SHAPES),
    color: pick(COLORS),
    size: pick(SIZES),
    count: pick([1, 2, 3]),
    rotation: pick(ROTATIONS),
  }

  // Build NxN grid
  const grid: (CellData | null)[][] = []

  for (let r = 0; r < gridDim; r++) {
    const row: (CellData | null)[] = []
    for (let c = 0; c < gridDim; c++) {
      let cell = { ...base }
      for (const rule of rules) {
        const step = rule.axis === 'row' ? c : r
        cell = applyRule(cell, rule, step)
      }
      row.push(cell)
    }
    grid.push(row)
  }

  // The answer is bottom-right
  const lastR = gridDim - 1
  const lastC = gridDim - 1
  const answer = grid[lastR][lastC] as CellData
  grid[lastR][lastC] = null

  // Generate distractors
  const distractors: CellData[] = []
  while (distractors.length < 5) {
    const d: CellData = {
      shape: pick(SHAPES),
      color: pick(COLORS),
      size: pick(SIZES),
      count: pick([1, 2, 3, 4]),
      rotation: pick(ROTATIONS),
    }
    if (!cellEq(d, answer) && !distractors.some(x => cellEq(x, d))) {
      distractors.push(d)
    }
  }

  const options = shuffle([answer, ...distractors])

  return { grid, answer, options, gridDim }
}

/* ------------------------------------------------------------------ */
/*  SVG shape renderer                                                */
/* ------------------------------------------------------------------ */
function ShapeSVG({ cell, cellSize }: { cell: CellData; cellSize: number }) {
  const s = SIZE_PX[cell.size]
  const gap = 2
  const count = cell.count
  // Layout: place shapes in a row, centered
  const totalW = count * s + (count - 1) * gap
  const startX = (cellSize - totalW) / 2

  const shapes: React.ReactNode[] = []
  for (let i = 0; i < count; i++) {
    const cx = startX + i * (s + gap) + s / 2
    const cy = cellSize / 2
    const half = s / 2

    switch (cell.shape) {
      case 'circle':
        shapes.push(
          <circle key={i} cx={cx} cy={cy} r={half} fill={cell.color} />
        )
        break
      case 'square':
        shapes.push(
          <rect key={i} x={cx - half} y={cy - half} width={s} height={s} fill={cell.color} />
        )
        break
      case 'triangle': {
        const pts = `${cx},${cy - half} ${cx - half},${cy + half} ${cx + half},${cy + half}`
        shapes.push(
          <polygon key={i} points={pts} fill={cell.color} />
        )
        break
      }
      case 'diamond': {
        const pts = `${cx},${cy - half} ${cx + half},${cy} ${cx},${cy + half} ${cx - half},${cy}`
        shapes.push(
          <polygon key={i} points={pts} fill={cell.color} />
        )
        break
      }
    }
  }

  const rot = cell.rotation || 0
  return (
    <svg width={cellSize} height={cellSize} viewBox={`0 0 ${cellSize} ${cellSize}`}>
      {rot !== 0 ? (
        <g transform={`rotate(${rot}, ${cellSize / 2}, ${cellSize / 2})`}>
          {shapes}
        </g>
      ) : (
        shapes
      )}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void
  onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void
}

type GamePhase = 'playing' | 'correct' | 'wrong' | 'gameover'

export default function MatrixForge({ onBack, onGameEnd }: Props) {
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [highestLevel, setHighestLevel] = useState(1)
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [puzzle, setPuzzle] = useState<Puzzle>(() => generatePuzzle(1))
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const [selected, setSelected] = useState<number | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [scorePops, setScorePops] = useState<ScorePop[]>([])
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [speedBonusVisible, setSpeedBonusVisible] = useState(false)
  const speedBonusTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(Date.now())
  const correctRef = useRef(0)
  const attemptsRef = useRef(0)
  const gameStartRef = useRef(Date.now())

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(TIMER_SECONDS)
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        if (prev <= 6) sfxTimer()
        return prev - 1
      })
    }, 1000)
  }, [])

  // Handle timer expiry
  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing') {
      handleWrong()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase])

  // Start timer on new puzzle
  useEffect(() => {
    if (phase === 'playing') {
      startTimer()
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase, puzzle, startTimer])

  // VFX animation loop
  const vfxActive = particles.length > 0 || scorePops.length > 0 || shakeIntensity > 0
  useEffect(() => {
    if (!vfxActive) return
    const loop = () => {
      setParticles(prev => prev.length ? tickParticles(prev) : prev)
      setScorePops(prev => prev.length ? tickScorePops(prev) : prev)
      setShakeIntensity(prev => prev > 0.01 ? prev * 0.85 : 0)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [vfxActive])

  // Report score when game ends
  useEffect(() => {
    if (phase === 'gameover') {
      const total = attemptsRef.current
      const correct = correctRef.current
      onGameEnd?.({ score, accuracy: total > 0 ? correct / total : 0, level: highestLevel, timeMs: Date.now() - gameStartRef.current })
    }
  }, [phase, score, highestLevel, onGameEnd])

  const getRelativePos = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleWrong = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    sfxWrong()
    attemptsRef.current++
    setShakeIntensity(4)
    const newLives = lives - 1
    setLives(newLives)
    setScore(prev => Math.max(0, prev + POINTS_WRONG))
    if (newLives <= 0) {
      sfxGameOver()
      setPhase('gameover')
    } else {
      setPhase('wrong')
      setTimeout(() => {
        nextPuzzle(level)
      }, 1200)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lives, level])

  const nextPuzzle = (nextLevel: number) => {
    setPuzzle(generatePuzzle(nextLevel))
    setSelected(null)
    setPhase('playing')
  }

  const handleSelect = (index: number, e: React.MouseEvent) => {
    if (phase !== 'playing' || selected !== null) return
    setSelected(index)
    if (timerRef.current) clearInterval(timerRef.current)

    const option = puzzle.options[index]
    if (cellEq(option, puzzle.answer)) {
      sfxCorrect()
      correctRef.current++
      attemptsRef.current++
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      const speedBonus = elapsed < SPEED_THRESHOLD ? POINTS_SPEED_BONUS : 0
      setScore(prev => prev + POINTS_CORRECT + speedBonus)
      sfxScore()
      if (speedBonus > 0) {
        setSpeedBonusVisible(true)
        if (speedBonusTimer.current) clearTimeout(speedBonusTimer.current)
        speedBonusTimer.current = setTimeout(() => setSpeedBonusVisible(false), 2000)
      }
      const pos = getRelativePos(e)
      setParticles(prev => [...prev, ...correctBurst(pos.x, pos.y)])
      setScorePops(prev => [...prev, createScorePop(pos.x, pos.y, POINTS_CORRECT + speedBonus, C.success)])
      const next = level + 1
      setLevel(next)
      setHighestLevel(prev => Math.max(prev, next))
      setPhase('correct')
      setTimeout(() => {
        sfxLevelUp()
        setParticles(prev => [...prev, ...confettiBurst(pos.x, pos.y)])
        nextPuzzle(next)
      }, 1000)
    } else {
      const pos = getRelativePos(e)
      setParticles(prev => [...prev, ...wrongBurst(pos.x, pos.y)])
      setShakeIntensity(6)
      handleWrong()
    }
  }

  const resetGame = () => {
    sfxTap()
    correctRef.current = 0
    attemptsRef.current = 0
    gameStartRef.current = Date.now()
    setLevel(1)
    setScore(0)
    setLives(MAX_LIVES)
    setPhase('playing')
    setSelected(null)
    setPuzzle(generatePuzzle(1))
  }

  // Responsive grid size
  const gridSize = 'min(500px, 90vw)'
  const cellGap = 6
  const cellSizeNum = 80 // used for SVG viewBox

  /* ---------------------------------------------------------------- */
  /*  Styles                                                          */
  /* ---------------------------------------------------------------- */
  const s: Record<string, React.CSSProperties> = {
    root: {
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
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
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS,
      color: C.text,
      padding: '8px 10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      transition: 'border-color 200ms ease',
    },
    chip: {
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: PILL,
      padding: '6px 14px',
      fontSize: 13,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    timerBar: {
      width: '100%',
      maxWidth: 540,
      height: 6,
      background: C.card,
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
    gridWrapper: {
      width: gridSize,
      maxWidth: 500,
      aspectRatio: '1',
      display: 'grid',
      gridTemplateColumns: `repeat(${puzzle.gridDim}, 1fr)`,
      gridTemplateRows: `repeat(${puzzle.gridDim}, 1fr)`,
      gap: cellGap,
      marginBottom: 28,
    },
    cell: {
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'border-color 200ms ease',
      overflow: 'hidden',
    },
    emptyCell: {
      background: C.card,
      border: `2px dashed ${C.border}`,
      borderRadius: RADIUS,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 36,
      fontWeight: 700,
      color: C.muted,
    },
    optionsGrid: {
      width: gridSize,
      maxWidth: 500,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: cellGap,
    },
    optionCell: {
      background: C.card,
      border: `2px solid ${C.border}`,
      borderRadius: RADIUS,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      aspectRatio: '1',
      transition: 'border-color 200ms ease, transform 200ms ease',
    },
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(26, 34, 48, 0.92)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    },
    gameOverCard: {
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: RADIUS,
      padding: '40px 36px',
      textAlign: 'center' as const,
      maxWidth: 380,
      width: '90vw',
    },
    playAgainBtn: {
      background: C.accent,
      color: '#fff',
      border: 'none',
      borderRadius: PILL,
      padding: '12px 32px',
      fontSize: 16,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 24,
      transition: 'opacity 200ms ease',
    },
    label: {
      fontSize: 12,
      color: C.muted,
      textTransform: 'uppercase' as const,
      letterSpacing: 1,
      marginBottom: 4,
    },
    bigNum: {
      fontSize: 48,
      fontWeight: 700,
      lineHeight: 1,
    },
    feedbackBanner: {
      width: '100%',
      maxWidth: 540,
      textAlign: 'center' as const,
      padding: '8px 0',
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 8,
      borderRadius: RADIUS,
      transition: 'opacity 200ms ease',
    },
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  const timerPct = (timeLeft / TIMER_SECONDS) * 100
  const timerColor = timerPct > 40 ? C.accent : timerPct > 15 ? C.warn : C.error

  return (
    <div ref={containerRef} style={{ ...s.root, position: 'relative', overflow: 'hidden', ...screenShakeStyle(shakeIntensity) }}>
      <style>{`@keyframes sbFade { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-12px); } }`}</style>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack} aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <div style={s.chip}>
          <Zap size={14} color={C.accent} />
          <span>Level {level}</span>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={s.chip}>
            <Trophy size={14} color={C.warn} />
            <span>{score}</span>
          </div>
          {speedBonusVisible && (
            <span style={{
              position: 'absolute',
              left: '100%',
              marginLeft: 8,
              color: C.warn,
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              animation: 'sbFade 2s ease-out forwards',
            }}>
              SPEED BONUS +{POINTS_SPEED_BONUS}
            </span>
          )}
        </div>
        <div style={{ ...s.chip, marginLeft: 'auto' }}>
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <Heart
              key={i}
              size={14}
              fill={i < lives ? C.error : 'transparent'}
              color={i < lives ? C.error : C.muted}
            />
          ))}
        </div>
      </div>

      {/* Timer bar */}
      <div style={s.timerBar}>
        <div
          style={{
            ...s.timerFill,
            width: `${timerPct}%`,
            backgroundColor: timerColor,
          }}
        />
      </div>

      {/* Timer seconds */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, color: timerColor, fontSize: 13, fontWeight: 600 }}>
        <Clock size={14} />
        <span>{timeLeft}s</span>
      </div>

      {/* Feedback banner */}
      {phase === 'correct' && (
        <div style={{ ...s.feedbackBanner, color: C.success }}>
          Correct! +100
        </div>
      )}
      {phase === 'wrong' && (
        <div style={{ ...s.feedbackBanner, color: C.error }}>
          Wrong answer. -25
        </div>
      )}

      {/* 3x3 Grid */}
      <div style={s.gridWrapper}>
        {puzzle.grid.flat().map((cell, i) =>
          cell === null ? (
            <div key={i} style={s.emptyCell}>?</div>
          ) : (
            <div key={i} style={s.cell}>
              <ShapeSVG cell={cell} cellSize={cellSizeNum} />
            </div>
          )
        )}
      </div>

      {/* Answer options */}
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 10, fontWeight: 500 }}>
        Pick the missing piece
      </div>
      <div style={s.optionsGrid}>
        {puzzle.options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = cellEq(opt, puzzle.answer)
          let borderColor: string = C.border
          if (isSelected && phase === 'correct') borderColor = C.success
          else if (isSelected && phase === 'wrong') borderColor = C.error
          else if (phase !== 'playing' && isCorrect) borderColor = C.success
          else if (isSelected) borderColor = C.accent

          return (
            <div
              key={i}
              style={{
                ...s.optionCell,
                borderColor,
                transform: isSelected ? 'scale(0.96)' : 'scale(1)',
                opacity: phase !== 'playing' && !isSelected && !isCorrect ? 0.4 : 1,
              }}
              onClick={(e) => handleSelect(i, e)}
            >
              <ShapeSVG cell={opt} cellSize={cellSizeNum} />
            </div>
          )
        })}
      </div>

      {/* Game over overlay */}
      {phase === 'gameover' && (
        <div style={s.overlay}>
          <div style={s.gameOverCard}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Game Over</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginBottom: 8 }}>
              <div>
                <div style={s.label}>Score</div>
                <div style={{ ...s.bigNum, color: C.accent }}>{score}</div>
              </div>
              <div>
                <div style={s.label}>Best Level</div>
                <div style={{ ...s.bigNum, color: C.success }}>{highestLevel}</div>
              </div>
            </div>
            <button style={s.playAgainBtn} onClick={resetGame}>
              <RotateCcw size={16} />
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* VFX particles */}
      {particles.map(p => (
        <div key={p.id} style={renderParticleStyle(p)} />
      ))}
      {scorePops.map(pop => (
        <div key={pop.id} style={scorePopStyle(pop)}>{pop.text}</div>
      ))}
    </div>
  )
}
