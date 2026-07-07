import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react'

type LaunchScreenProps = {
  onComplete: () => void
}

type FallingLetter = {
  char: string
  x: number
  y: number
  speed: number
  opacity: number
  targetX: number
  targetY: number
  isTarget: boolean
  targetIndex: number
  settled: boolean
  color: string
}

const TITLE = 'KasukuGames'
const BG_COLOR = '#0f0d0a'
const STAGE1_DURATION = 2000
const STAGE2_DURATION = 2000
const STAGE3_DURATION = 1000
const TOTAL_DURATION = STAGE1_DURATION + STAGE2_DURATION + STAGE3_DURATION

const LETTER_COLORS = [
  'rgba(201,169,110,0.4)',
  '#c4a882',
  'rgba(236,230,220,0.3)',
  'rgba(201,169,110,0.6)',
  'rgba(196,168,130,0.5)',
]

const NOISE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

const ORBIT_STYLES = `
@keyframes orbit-triangle {
  from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
}
@keyframes orbit-circle {
  from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
}
@keyframes orbit-square {
  from { transform: rotate(0deg) translateX(160px) rotate(0deg); }
  to { transform: rotate(360deg) translateX(160px) rotate(-360deg); }
}
@keyframes shape-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
`

function LaunchScreen({ onComplete }: LaunchScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lettersRef = useRef<FallingLetter[]>([])
  const animFrameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const [stage, setStage] = useState<number>(1)
  const [fadeOut, setFadeOut] = useState(false)

  const initLetters = useCallback((width: number, height: number) => {
    const letters: FallingLetter[] = []
    const centerX = width / 2
    const centerY = height / 2
    const charWidth = 28
    const totalWidth = TITLE.length * charWidth
    const startX = centerX - totalWidth / 2

    for (let i = 0; i < TITLE.length; i++) {
      letters.push({
        char: TITLE[i],
        x: startX + i * charWidth + charWidth / 2,
        y: -50 - Math.random() * 300,
        speed: 2 + Math.random() * 3,
        opacity: 0.6 + Math.random() * 0.4,
        targetX: startX + i * charWidth + charWidth / 2,
        targetY: centerY,
        isTarget: true,
        targetIndex: i,
        settled: false,
        color: LETTER_COLORS[Math.floor(Math.random() * LETTER_COLORS.length)],
      })
    }

    const noiseCount = 40
    for (let i = 0; i < noiseCount; i++) {
      const char = NOISE_CHARS[Math.floor(Math.random() * NOISE_CHARS.length)]
      letters.push({
        char,
        x: Math.random() * width,
        y: -50 - Math.random() * 600,
        speed: 1.5 + Math.random() * 4,
        opacity: 0.15 + Math.random() * 0.25,
        targetX: Math.random() * width,
        targetY: height + 100,
        isTarget: false,
        targetIndex: -1,
        settled: false,
        color: LETTER_COLORS[Math.floor(Math.random() * LETTER_COLORS.length)],
      })
    }

    lettersRef.current = letters
  }, [])

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!startTimeRef.current) {
      startTimeRef.current = timestamp
    }

    const elapsed = timestamp - startTimeRef.current
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, width, height)

    const inStage2 = elapsed > STAGE1_DURATION
    const convergeProgress = inStage2
      ? Math.min((elapsed - STAGE1_DURATION) / 800, 1)
      : 0

    for (const letter of lettersRef.current) {
      if (!inStage2) {
        letter.y += letter.speed
      } else if (letter.isTarget && !letter.settled) {
        const ease = convergeProgress * convergeProgress * (3 - 2 * convergeProgress)
        letter.x = letter.x + (letter.targetX - letter.x) * ease * 0.1
        letter.y = letter.y + (letter.targetY - letter.y) * ease * 0.1

        if (
          Math.abs(letter.x - letter.targetX) < 1 &&
          Math.abs(letter.y - letter.targetY) < 1
        ) {
          letter.x = letter.targetX
          letter.y = letter.targetY
          letter.settled = true
        }
      } else if (!letter.isTarget) {
        letter.opacity = Math.max(0, letter.opacity - 0.01)
        letter.y += letter.speed * 0.5
      }

      if (letter.opacity > 0) {
        ctx.font = "600 32px 'DM Sans', 'Inter', system-ui, sans-serif"
        ctx.fillStyle = letter.color
        ctx.globalAlpha = letter.opacity
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(letter.char, letter.x, letter.y)
      }
    }

    ctx.globalAlpha = 1

    if (elapsed < STAGE1_DURATION + STAGE2_DURATION) {
      animFrameRef.current = requestAnimationFrame(animate)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      if (lettersRef.current.length === 0) {
        initLetters(canvas.width, canvas.height)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    animFrameRef.current = requestAnimationFrame(animate)

    const stage2Timer = setTimeout(() => setStage(2), STAGE1_DURATION)
    const stage3Timer = setTimeout(() => {
      setStage(3)
      setFadeOut(true)
    }, STAGE1_DURATION + STAGE2_DURATION)
    const completeTimer = setTimeout(() => onComplete(), TOTAL_DURATION)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animFrameRef.current)
      clearTimeout(stage2Timer)
      clearTimeout(stage3Timer)
      clearTimeout(completeTimer)
    }
  }, [animate, initLetters, onComplete])

  const containerStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    backgroundColor: BG_COLOR,
    opacity: fadeOut ? 0 : 1,
    transition: 'opacity 1s ease-out',
    overflow: 'hidden',
  }

  const canvasStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: stage >= 2 ? 0 : 1,
    transition: 'opacity 0.8s ease-out',
  }

  const centerOverlayStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: stage >= 2 ? 1 : 0,
    transition: 'opacity 0.6s ease-in',
  }

  const titleStyle: CSSProperties = {
    fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    fontSize: '32px',
    fontWeight: 600,
    color: '#c4a882',
    letterSpacing: '-0.02em',
    position: 'relative',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
    padding: '12px 24px',
    borderRadius: '4px',
  }

  const orbitContainerStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
  }

  const triangleStyle: CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeft: '9px solid transparent',
    borderRight: '9px solid transparent',
    borderBottom: '16px solid #c4a882',
    top: '-8px',
    left: '-9px',
    animation: 'orbit-triangle 3s linear infinite, shape-fade-in 0.5s ease-out',
  }

  const circleStyle: CSSProperties = {
    position: 'absolute',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#a8b89a',
    top: '-8px',
    left: '-8px',
    animation: 'orbit-circle 5s linear infinite, shape-fade-in 0.5s ease-out 0.2s both',
  }

  const squareStyle: CSSProperties = {
    position: 'absolute',
    width: '16px',
    height: '16px',
    borderRadius: '2px',
    backgroundColor: '#c8847a',
    top: '-8px',
    left: '-8px',
    animation: 'orbit-square 7s linear infinite, shape-fade-in 0.5s ease-out 0.4s both',
  }

  return (
    <div style={containerStyle}>
      <style>{ORBIT_STYLES}</style>
      <canvas ref={canvasRef} style={canvasStyle} />
      <div style={centerOverlayStyle}>
        <div style={titleStyle}>{TITLE}</div>
        {stage >= 2 && (
          <div style={orbitContainerStyle}>
            <div style={triangleStyle} />
            <div style={circleStyle} />
            <div style={squareStyle} />
          </div>
        )}
      </div>
    </div>
  )
}

export default LaunchScreen
