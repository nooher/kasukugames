import type React from 'react'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ArrowLeft, Heart, Clock, RotateCcw, Trophy, Zap, Building2, Eye, Hash, Palette, Brain } from 'lucide-react'

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
} as const

const RADIUS = 14
const PILL = 999

const GLASS = {
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)',
} as const

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
type TaskType = 'color_match' | 'count_stream' | 'spot_diff' | 'sequence_memory'

interface FloorBlock {
  color: string
  label: string
  taskType: TaskType
  speedBonus: number
}

type GamePhase = 'menu' | 'playing' | 'task_intro' | 'task_active' | 'floor_complete' | 'floor_failed' | 'game_over'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const MAX_LIVES = 3
const FLOOR_COLORS = [C.accent, C.emerald, C.sapphire, C.violet, C.amber, C.rose]
const TASK_TYPES: TaskType[] = ['color_match', 'count_stream', 'spot_diff', 'sequence_memory']
const TASK_NAMES: Record<TaskType, string> = {
  color_match: 'Color Match',
  count_stream: 'Count Stream',
  spot_diff: 'Spot the Odd',
  sequence_memory: 'Sequence Recall',
}
const TASK_ICONS: Record<TaskType, typeof Palette> = {
  color_match: Palette,
  count_stream: Hash,
  spot_diff: Eye,
  sequence_memory: Brain,
}
const TASK_DESCRIPTIONS: Record<TaskType, string> = {
  color_match: 'Match the target color from flashing options',
  count_stream: 'Count how many target items appear in a rapid stream',
  spot_diff: 'Find the item that is different from the rest',
  sequence_memory: 'Remember and replay the shown sequence',
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getTimerForFloor(floor: number): number {
  // Start at 8s, decrease by 0.3s per floor, minimum 3s
  return Math.max(3, 8 - floor * 0.3)
}

function getDistractorCount(floor: number): number {
  return Math.min(6, Math.floor(floor / 2) + 1)
}

/* ------------------------------------------------------------------ */
/*  Color Match Task                                                  */
/* ------------------------------------------------------------------ */
interface ColorMatchState {
  targetColor: string
  options: string[]
  correctIndex: number
  flashingIndices: number[]
}

function generateColorMatch(floor: number): ColorMatchState {
  const palette = shuffle([C.accent, C.emerald, C.sapphire, C.violet, C.amber, C.rose])
  const optionCount = Math.min(6, 3 + Math.floor(floor / 3))
  const options = palette.slice(0, optionCount)
  const correctIndex = rand(0, options.length - 1)
  const targetColor = options[correctIndex]
  const distractorCount = getDistractorCount(floor)
  const flashingIndices: number[] = []
  for (let i = 0; i < distractorCount; i++) {
    flashingIndices.push(rand(0, options.length - 1))
  }
  return { targetColor, options, correctIndex, flashingIndices }
}

/* ------------------------------------------------------------------ */
/*  Count Stream Task                                                 */
/* ------------------------------------------------------------------ */
interface CountStreamState {
  targetSymbol: string
  stream: string[]
  correctCount: number
  currentIndex: number
  options: number[]
}

const STREAM_SYMBOLS = ['●', '■', '▲', '◆', '★', '✦']

function generateCountStream(floor: number): CountStreamState {
  const target = pick(STREAM_SYMBOLS)
  const others = STREAM_SYMBOLS.filter(s => s !== target)
  const streamLen = Math.min(20, 8 + floor * 2)
  const correctCount = rand(2, Math.min(streamLen - 2, 4 + Math.floor(floor / 2)))
  const stream: string[] = []
  // Place target symbols
  const positions = new Set<number>()
  while (positions.size < correctCount) {
    positions.add(rand(0, streamLen - 1))
  }
  for (let i = 0; i < streamLen; i++) {
    stream.push(positions.has(i) ? target : pick(others))
  }
  // Generate answer options
  const options = shuffle([correctCount, correctCount + 1, correctCount - 1, correctCount + 2].filter(n => n >= 0))
  return { targetSymbol: target, stream, correctCount, currentIndex: -1, options }
}

/* ------------------------------------------------------------------ */
/*  Spot Difference Task                                              */
/* ------------------------------------------------------------------ */
interface SpotDiffState {
  items: { color: string; shape: string; isOdd: boolean }[]
  correctIndex: number
}

function generateSpotDiff(floor: number): SpotDiffState {
  const shapes = ['●', '■', '▲', '◆']
  const colors = [C.accent, C.emerald, C.sapphire, C.violet, C.amber, C.rose]
  const normalShape = pick(shapes)
  const normalColor = pick(colors)
  const oddShape = pick(shapes.filter(s => s !== normalShape))
  const oddColor = pick(colors.filter(c => c !== normalColor))
  const count = Math.min(12, 4 + floor)
  const correctIndex = rand(0, count - 1)
  const items = Array.from({ length: count }, (_, i) => {
    if (i === correctIndex) {
      // At higher floors, the difference is subtler (only color OR shape changes)
      if (floor > 4) {
        return { color: oddColor, shape: normalShape, isOdd: true }
      }
      return { color: oddColor, shape: oddShape, isOdd: true }
    }
    return { color: normalColor, shape: normalShape, isOdd: false }
  })
  return { items, correctIndex }
}

/* ------------------------------------------------------------------ */
/*  Sequence Memory Task                                              */
/* ------------------------------------------------------------------ */
interface SequenceMemoryState {
  sequence: number[]
  gridSize: number
  phase: 'showing' | 'input'
  showIndex: number
  playerInput: number[]
}

function generateSequenceMemory(floor: number): SequenceMemoryState {
  const seqLen = Math.min(8, 3 + Math.floor(floor / 2))
  const gridSize = Math.min(9, 4 + Math.floor(floor / 3))
  const sequence: number[] = []
  for (let i = 0; i < seqLen; i++) {
    sequence.push(rand(0, gridSize - 1))
  }
  return { sequence, gridSize, phase: 'showing', showIndex: -1, playerInput: [] }
}

/* ------------------------------------------------------------------ */
/*  Distractor Component                                              */
/* ------------------------------------------------------------------ */
function Distractors({ count, containerRef }: { count: number; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [positions, setPositions] = useState<{ x: number; y: number; size: number; color: string; opacity: number }[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions(
        Array.from({ length: count }, () => ({
          x: rand(0, 100),
          y: rand(0, 100),
          size: rand(4, 16),
          color: pick([C.accent, C.emerald, C.violet, C.amber, C.rose, C.sapphire]),
          opacity: Math.random() * 0.3 + 0.1,
        }))
      )
    }, 400)
    return () => clearInterval(interval)
  }, [count])

  void containerRef

  return (
    <>
      {positions.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: p.size > 10 ? 4 : PILL,
            background: p.color,
            opacity: p.opacity,
            pointerEvents: 'none',
            transition: 'all 300ms ease',
            zIndex: 0,
          }}
        />
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */
interface Props {
  onBack: () => void
}

export default function FocusTower({ onBack }: Props) {
  /* ---- Core state ---- */
  const [phase, setPhase] = useState<GamePhase>('menu')
  const [floor, setFloor] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [score, setScore] = useState(0)
  const [tower, setTower] = useState<FloorBlock[]>([])
  const [highScore, setHighScore] = useState(() => {
    try { return Number(localStorage.getItem('focusTower_hs') ?? 0) } catch { return 0 }
  })

  /* ---- Task state ---- */
  const [currentTask, setCurrentTask] = useState<TaskType>('color_match')
  const [timer, setTimer] = useState(0)
  const [timerMax, setTimerMax] = useState(8)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const taskStartRef = useRef(Date.now())
  const containerRef = useRef<HTMLDivElement>(null)

  /* ---- Task-specific state ---- */
  const [colorMatch, setColorMatch] = useState<ColorMatchState | null>(null)
  const [countStream, setCountStream] = useState<CountStreamState | null>(null)
  const [spotDiff, setSpotDiff] = useState<SpotDiffState | null>(null)
  const [seqMemory, setSeqMemory] = useState<SequenceMemoryState | null>(null)

  /* ---- Flashing distractor state for color match ---- */
  const [flashActive, setFlashActive] = useState<Set<number>>(new Set())

  /* ---- Cleanup ---- */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => () => clearTimer(), [clearTimer])

  /* ---- Start a new game ---- */
  const startGame = useCallback(() => {
    setPhase('playing')
    setFloor(0)
    setLives(MAX_LIVES)
    setScore(0)
    setTower([])
    // Immediately start first floor
    setTimeout(() => startFloor(0), 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- Start a floor ---- */
  const startFloor = useCallback((floorNum: number) => {
    const task = TASK_TYPES[floorNum % TASK_TYPES.length]
    setCurrentTask(task)
    setPhase('task_intro')

    // Auto-advance to active after brief intro
    setTimeout(() => {
      beginTask(task, floorNum)
    }, 1500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---- Begin the actual task ---- */
  const beginTask = useCallback((task: TaskType, floorNum: number) => {
    clearTimer()
    const t = getTimerForFloor(floorNum)
    setTimerMax(t)
    setTimer(t)
    taskStartRef.current = Date.now()
    setPhase('task_active')

    switch (task) {
      case 'color_match':
        setColorMatch(generateColorMatch(floorNum))
        break
      case 'count_stream': {
        const cs = generateCountStream(floorNum)
        setCountStream(cs)
        // Animate the stream
        let idx = 0
        const streamInterval = setInterval(() => {
          setCountStream(prev => prev ? { ...prev, currentIndex: idx } : null)
          idx++
          if (idx >= cs.stream.length) {
            clearInterval(streamInterval)
          }
        }, Math.max(200, 500 - floorNum * 30))
        break
      }
      case 'spot_diff':
        setSpotDiff(generateSpotDiff(floorNum))
        break
      case 'sequence_memory': {
        const sm = generateSequenceMemory(floorNum)
        setSeqMemory(sm)
        // Show sequence one by one
        let showIdx = 0
        const seqInterval = setInterval(() => {
          setSeqMemory(prev => prev ? { ...prev, showIndex: showIdx } : null)
          showIdx++
          if (showIdx >= sm.sequence.length) {
            clearInterval(seqInterval)
            setTimeout(() => {
              setSeqMemory(prev => prev ? { ...prev, phase: 'input', showIndex: -1 } : null)
            }, 600)
          }
        }, Math.max(400, 800 - floorNum * 40))
        break
      }
    }

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        const next = Math.max(0, prev - 0.1)
        if (next <= 0) {
          clearTimer()
          handleFailure()
        }
        return next
      })
    }, 100)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimer])

  /* ---- Floor complete ---- */
  const handleSuccess = useCallback(() => {
    clearTimer()
    const elapsed = (Date.now() - taskStartRef.current) / 1000
    const speedBonus = elapsed < timerMax * 0.4 ? 50 : elapsed < timerMax * 0.6 ? 25 : 0
    const floorScore = 100 + speedBonus

    const newBlock: FloorBlock = {
      color: FLOOR_COLORS[floor % FLOOR_COLORS.length],
      label: TASK_NAMES[currentTask],
      taskType: currentTask,
      speedBonus,
    }

    setScore(prev => prev + floorScore)
    setTower(prev => [...prev, newBlock])
    setPhase('floor_complete')

    setTimeout(() => {
      const nextFloor = floor + 1
      setFloor(nextFloor)
      startFloor(nextFloor)
    }, 1500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimer, floor, currentTask, timerMax])

  /* ---- Floor failed ---- */
  const handleFailure = useCallback(() => {
    clearTimer()
    setLives(prev => {
      const next = prev - 1
      if (next <= 0) {
        setPhase('game_over')
        setScore(s => {
          const final = s
          setHighScore(hs => {
            const newHs = Math.max(hs, final)
            try { localStorage.setItem('focusTower_hs', String(newHs)) } catch { /* noop */ }
            return newHs
          })
          return final
        })
        return 0
      }
      // Remove top floor if tower has blocks
      setTower(prev => prev.length > 0 ? prev.slice(0, -1) : prev)
      setPhase('floor_failed')
      setTimeout(() => {
        startFloor(floor)
      }, 1500)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTimer, floor])

  /* ---- Color match flash distractors ---- */
  useEffect(() => {
    if (phase !== 'task_active' || currentTask !== 'color_match' || !colorMatch) return
    const interval = setInterval(() => {
      const newFlash = new Set<number>()
      for (const idx of colorMatch.flashingIndices) {
        if (Math.random() > 0.5) newFlash.add(idx)
      }
      setFlashActive(newFlash)
    }, 300)
    return () => clearInterval(interval)
  }, [phase, currentTask, colorMatch])

  /* ---- Task handlers ---- */
  const handleColorPick = useCallback((index: number) => {
    if (!colorMatch || phase !== 'task_active') return
    if (index === colorMatch.correctIndex) {
      handleSuccess()
    } else {
      handleFailure()
    }
  }, [colorMatch, phase, handleSuccess, handleFailure])

  const handleCountPick = useCallback((value: number) => {
    if (!countStream || phase !== 'task_active') return
    if (value === countStream.correctCount) {
      handleSuccess()
    } else {
      handleFailure()
    }
  }, [countStream, phase, handleSuccess, handleFailure])

  const handleSpotPick = useCallback((index: number) => {
    if (!spotDiff || phase !== 'task_active') return
    if (index === spotDiff.correctIndex) {
      handleSuccess()
    } else {
      handleFailure()
    }
  }, [spotDiff, phase, handleSuccess, handleFailure])

  const handleSeqPick = useCallback((cellIndex: number) => {
    if (!seqMemory || phase !== 'task_active' || seqMemory.phase !== 'input') return
    const nextInput = [...seqMemory.playerInput, cellIndex]
    const expectedSoFar = seqMemory.sequence.slice(0, nextInput.length)
    const correct = nextInput.every((v, i) => v === expectedSoFar[i])

    if (!correct) {
      handleFailure()
      return
    }

    setSeqMemory(prev => prev ? { ...prev, playerInput: nextInput } : null)

    if (nextInput.length === seqMemory.sequence.length) {
      handleSuccess()
    }
  }, [seqMemory, phase, handleSuccess, handleFailure])

  /* ---- Timer bar percentage ---- */
  const timerPct = timerMax > 0 ? (timer / timerMax) * 100 : 0
  const timerColor = timerPct > 50 ? C.accent : timerPct > 25 ? C.amber : C.error

  /* ---- Distractor count ---- */
  const distractorCount = useMemo(() => getDistractorCount(floor), [floor])

  /* ================================================================ */
  /*  Render helpers                                                   */
  /* ================================================================ */

  const renderLives = () => (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <Heart
          key={i}
          size={18}
          fill={i < lives ? C.error : 'transparent'}
          color={i < lives ? C.error : C.dim}
        />
      ))}
    </div>
  )

  const renderTimerBar = () => (
    <div style={{
      width: '100%',
      height: 6,
      background: C.border,
      borderRadius: PILL,
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      <div style={{
        width: `${timerPct}%`,
        height: '100%',
        background: timerColor,
        borderRadius: PILL,
        transition: 'width 100ms linear, background 300ms ease',
      }} />
    </div>
  )

  const renderTower = (maxVisible = 8) => {
    const visible = tower.slice(-maxVisible)
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        gap: 2,
        minHeight: 60,
      }}>
        {visible.map((block, i) => (
          <div
            key={i}
            style={{
              width: Math.max(40, 100 - i * 4),
              height: 18,
              background: block.color,
              borderRadius: 4,
              ...GLASS,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 9, color: C.text, fontWeight: 600, opacity: 0.8 }}>
              {block.speedBonus > 0 ? '⚡' : ''}
            </span>
          </div>
        ))}
        {/* Foundation */}
        <div style={{
          width: 120,
          height: 8,
          background: C.dim,
          borderRadius: 4,
        }} />
      </div>
    )
  }

  /* ---- Task renderers ---- */

  const renderColorMatch = () => {
    if (!colorMatch) return null
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>Tap the matching color</p>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: RADIUS,
          background: colorMatch.targetColor,
          margin: '0 auto 20px',
          ...GLASS,
        }} />
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          justifyContent: 'center',
          position: 'relative',
        }}>
          {colorMatch.options.map((color, i) => {
            const isFlashing = flashActive.has(i)
            return (
              <button
                key={i}
                onClick={() => handleColorPick(i)}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: RADIUS,
                  background: isFlashing
                    ? pick(FLOOR_COLORS.filter(c => c !== color))
                    : color,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 150ms ease, background 200ms ease',
                  transform: isFlashing ? `scale(${0.9 + Math.random() * 0.2})` : 'scale(1)',
                  ...GLASS,
                }}
              />
            )
          })}
        </div>
      </div>
    )
  }

  const renderCountStream = () => {
    if (!countStream) return null
    const showingStream = countStream.currentIndex < countStream.stream.length
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>
          Count how many <span style={{ color: C.accent, fontWeight: 700, fontSize: 20 }}>{countStream.targetSymbol}</span> appear
        </p>
        {showingStream ? (
          <div style={{
            fontSize: 48,
            fontWeight: 700,
            color: C.text,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {countStream.currentIndex >= 0 && countStream.currentIndex < countStream.stream.length
              ? countStream.stream[countStream.currentIndex]
              : '...'}
          </div>
        ) : (
          <div>
            <p style={{ color: C.text, fontSize: 15, marginBottom: 16, fontWeight: 600 }}>
              How many?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {countStream.options.map((val, i) => (
                <button
                  key={i}
                  onClick={() => handleCountPick(val)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: RADIUS,
                    background: C.card,
                    border: `2px solid ${C.border}`,
                    color: C.text,
                    fontSize: 22,
                    fontWeight: 700,
                    cursor: 'pointer',
                    ...GLASS,
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderSpotDiff = () => {
    if (!spotDiff) return null
    const cols = spotDiff.items.length <= 6 ? 3 : 4
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Find the odd one out</p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 10,
          maxWidth: 280,
          margin: '0 auto',
        }}>
          {spotDiff.items.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSpotPick(i)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: RADIUS,
                background: C.card,
                border: `2px solid ${C.border}`,
                color: item.color,
                fontSize: 28,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...GLASS,
              }}
            >
              {item.shape}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderSequenceMemory = () => {
    if (!seqMemory) return null
    const cols = seqMemory.gridSize <= 4 ? 2 : 3
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
          {seqMemory.phase === 'showing' ? 'Watch the sequence...' : 'Replay the sequence!'}
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 10,
          maxWidth: 240,
          margin: '0 auto',
        }}>
          {Array.from({ length: seqMemory.gridSize }, (_, i) => {
            const isHighlighted = seqMemory.phase === 'showing' &&
              seqMemory.showIndex >= 0 &&
              seqMemory.sequence[seqMemory.showIndex] === i
            const isInputted = seqMemory.phase === 'input' && seqMemory.playerInput.includes(i)
            return (
              <button
                key={i}
                onClick={() => handleSeqPick(i)}
                disabled={seqMemory.phase === 'showing'}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: RADIUS,
                  background: isHighlighted ? C.accent : isInputted ? C.emerald : C.card,
                  border: `2px solid ${isHighlighted ? C.accent : C.border}`,
                  cursor: seqMemory.phase === 'input' ? 'pointer' : 'default',
                  transition: 'background 200ms ease',
                  ...GLASS,
                }}
              />
            )
          })}
        </div>
        {seqMemory.phase === 'input' && (
          <p style={{ color: C.dim, fontSize: 12, marginTop: 10 }}>
            {seqMemory.playerInput.length} / {seqMemory.sequence.length}
          </p>
        )}
      </div>
    )
  }

  const renderTask = () => {
    switch (currentTask) {
      case 'color_match': return renderColorMatch()
      case 'count_stream': return renderCountStream()
      case 'spot_diff': return renderSpotDiff()
      case 'sequence_memory': return renderSequenceMemory()
    }
  }

  /* ================================================================ */
  /*  Main render                                                      */
  /* ================================================================ */

  const TaskIcon = TASK_ICONS[currentTask]

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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
            padding: 0,
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Building2 size={18} color={C.accent} />
          <span style={{ fontWeight: 700, fontSize: 16 }}>Focus Tower</span>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* ---- MENU ---- */}
      {phase === 'menu' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          gap: 24,
        }}>
          {/* Tower icon */}
          <div style={{
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            gap: 3,
            marginBottom: 8,
          }}>
            {FLOOR_COLORS.map((color, i) => (
              <div
                key={i}
                style={{
                  width: 80 - i * 8,
                  height: 16,
                  background: color,
                  borderRadius: 4,
                  ...GLASS,
                }}
              />
            ))}
            <div style={{ width: 100, height: 6, background: C.dim, borderRadius: 4 }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, color: C.accent }}>
              Focus Tower
            </h1>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>
              Build your tower by completing focus challenges. Each floor is a different mini-task.
              Distractions increase as you climb. Stay sharp!
            </p>
          </div>

          {highScore > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: C.card,
              borderRadius: RADIUS,
              ...GLASS,
            }}>
              <Trophy size={16} color={C.amber} />
              <span style={{ color: C.amber, fontWeight: 600, fontSize: 14 }}>
                Best: {highScore}
              </span>
            </div>
          )}

          {/* Task preview */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            width: '100%',
            maxWidth: 320,
          }}>
            {TASK_TYPES.map(t => {
              const Icon = TASK_ICONS[t]
              return (
                <div
                  key={t}
                  style={{
                    padding: '12px 14px',
                    background: C.card,
                    borderRadius: RADIUS,
                    border: `1px solid ${C.border}`,
                    ...GLASS,
                  }}
                >
                  <Icon size={16} color={C.accent} />
                  <p style={{ fontSize: 12, fontWeight: 600, marginTop: 6, color: C.text }}>
                    {TASK_NAMES[t]}
                  </p>
                  <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                    {TASK_DESCRIPTIONS[t]}
                  </p>
                </div>
              )
            })}
          </div>

          <button
            onClick={startGame}
            style={{
              padding: '14px 48px',
              background: C.accent,
              color: C.ink,
              border: 'none',
              borderRadius: PILL,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              ...GLASS,
              marginTop: 8,
            }}
          >
            Start Building
          </button>
        </div>
      )}

      {/* ---- PLAYING / ACTIVE STATES ---- */}
      {phase !== 'menu' && phase !== 'game_over' && (
        <div style={{ padding: '16px 20px', position: 'relative', zIndex: 5 }}>
          {/* Stats bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {renderLives()}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                background: C.card,
                borderRadius: PILL,
                border: `1px solid ${C.border}`,
              }}>
                <Building2 size={14} color={C.accent} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>F{floor + 1}</span>
              </div>
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
              <Zap size={14} color={C.amber} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>{score}</span>
            </div>
          </div>

          {/* Timer */}
          {phase === 'task_active' && renderTimerBar()}

          {/* Tower visualization */}
          <div style={{
            display: 'flex',
            gap: 20,
            alignItems: 'flex-end',
          }}>
            {/* Mini tower on the side */}
            <div style={{
              padding: '12px 8px',
              background: C.card,
              borderRadius: RADIUS,
              border: `1px solid ${C.border}`,
              minWidth: 80,
              ...GLASS,
            }}>
              {renderTower(6)}
            </div>

            {/* Task area */}
            <div style={{
              flex: 1,
              padding: 20,
              background: C.card,
              borderRadius: RADIUS,
              border: `1px solid ${C.border}`,
              position: 'relative',
              overflow: 'hidden',
              minHeight: 260,
              ...GLASS,
            }}>
              {/* Distractors behind the task */}
              {phase === 'task_active' && (
                <Distractors count={distractorCount} containerRef={containerRef} />
              )}

              <div style={{ position: 'relative', zIndex: 2 }}>
                {/* Task intro */}
                {phase === 'task_intro' && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200,
                    gap: 12,
                  }}>
                    <TaskIcon size={32} color={C.accent} />
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>
                      {TASK_NAMES[currentTask]}
                    </h2>
                    <p style={{ color: C.muted, fontSize: 13, textAlign: 'center' }}>
                      {TASK_DESCRIPTIONS[currentTask]}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: C.dim,
                      fontSize: 12,
                    }}>
                      <Clock size={14} />
                      <span>{getTimerForFloor(floor).toFixed(1)}s</span>
                    </div>
                  </div>
                )}

                {/* Active task */}
                {phase === 'task_active' && renderTask()}

                {/* Floor complete */}
                {phase === 'floor_complete' && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200,
                    gap: 12,
                  }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: PILL,
                      background: C.success,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Trophy size={28} color={C.ink} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.success }}>
                      Floor Complete!
                    </h2>
                    <p style={{ color: C.muted, fontSize: 13 }}>
                      +100 pts{tower.length > 0 && tower[tower.length - 1].speedBonus > 0
                        ? ` + ${tower[tower.length - 1].speedBonus} speed bonus`
                        : ''}
                    </p>
                  </div>
                )}

                {/* Floor failed */}
                {phase === 'floor_failed' && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 200,
                    gap: 12,
                  }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: PILL,
                      background: C.error,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Heart size={28} color={C.ink} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: C.error }}>
                      Tower Crumbles!
                    </h2>
                    <p style={{ color: C.muted, fontSize: 13 }}>
                      Lost a floor. {lives} {lives === 1 ? 'life' : 'lives'} remaining.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- GAME OVER ---- */}
      {phase === 'game_over' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          gap: 20,
        }}>
          {/* Final tower */}
          <div style={{
            padding: '16px 12px',
            background: C.card,
            borderRadius: RADIUS,
            border: `1px solid ${C.border}`,
            ...GLASS,
          }}>
            {renderTower(12)}
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 600, color: C.error }}>
            Tower Collapsed!
          </h1>
          <p style={{ color: C.muted, fontSize: 14 }}>
            You reached floor {floor + 1} and built {tower.length} floors
          </p>

          <div style={{
            display: 'flex',
            gap: 20,
            marginTop: 8,
          }}>
            <div style={{
              textAlign: 'center',
              padding: '12px 20px',
              background: C.card,
              borderRadius: RADIUS,
              ...GLASS,
            }}>
              <Zap size={20} color={C.amber} />
              <p style={{ fontSize: 24, fontWeight: 600, color: C.text, marginTop: 4 }}>{score}</p>
              <p style={{ fontSize: 11, color: C.muted }}>Score</p>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '12px 20px',
              background: C.card,
              borderRadius: RADIUS,
              ...GLASS,
            }}>
              <Trophy size={20} color={C.amber} />
              <p style={{ fontSize: 24, fontWeight: 600, color: C.amber, marginTop: 4 }}>{highScore}</p>
              <p style={{ fontSize: 11, color: C.muted }}>Best</p>
            </div>
          </div>

          <button
            onClick={startGame}
            style={{
              padding: '14px 48px',
              background: C.accent,
              color: C.ink,
              border: 'none',
              borderRadius: PILL,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              ...GLASS,
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <RotateCcw size={18} />
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
