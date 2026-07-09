// Premium visual effects for KasukuGames — particles, screen shake, score pops, confetti, streaks.

export interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  opacity: number
  life: number
  maxLife: number
  type: 'circle' | 'star' | 'spark' | 'confetti'
  rotation: number
  rotationSpeed: number
}

let nextId = 0

function makeParticle(x: number, y: number, color: string, type: Particle['type'] = 'circle'): Particle {
  const angle = Math.random() * Math.PI * 2
  const speed = 1 + Math.random() * 4
  const life = 30 + Math.random() * 40
  return {
    id: nextId++,
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 2,
    size: 3 + Math.random() * 5,
    color,
    opacity: 1,
    life,
    maxLife: life,
    type,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
  }
}

/** True when the OS "reduce motion" setting is on — bursts then return [] so no
 *  particle VFX render (respects vestibular sensitivity). */
export function prefersReducedMotion(): boolean {
  try { return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

export function burstParticles(x: number, y: number, color: string, count = 12): Particle[] {
  if (prefersReducedMotion()) return []
  return Array.from({ length: count }, () => makeParticle(x, y, color))
}

export function correctBurst(x: number, y: number): Particle[] {
  if (prefersReducedMotion()) return []
  const colors = ['#33623F', '#4a8a54', '#c9a96e', '#8aada8']
  return Array.from({ length: 16 }, () => {
    const c = colors[Math.floor(Math.random() * colors.length)]
    return makeParticle(x, y, c, Math.random() > 0.5 ? 'star' : 'spark')
  })
}

export function wrongBurst(x: number, y: number): Particle[] {
  if (prefersReducedMotion()) return []
  const colors = ['#c8847a', '#a05040', '#d4a017']
  return Array.from({ length: 8 }, () => {
    const c = colors[Math.floor(Math.random() * colors.length)]
    const p = makeParticle(x, y, c, 'circle')
    p.vy = Math.sin(Math.random() * Math.PI * 2) * 2
    p.vx = (Math.random() - 0.5) * 3
    return p
  })
}

export function confettiBurst(x: number, y: number): Particle[] {
  if (prefersReducedMotion()) return []
  const colors = ['#c9a96e', '#33623F', '#2F6FB0', '#c8847a', '#8aada8', '#b8a0c8', '#f0ebe3']
  return Array.from({ length: 30 }, () => {
    const c = colors[Math.floor(Math.random() * colors.length)]
    const p = makeParticle(x, y, c, 'confetti')
    p.vx = (Math.random() - 0.5) * 8
    p.vy = -3 - Math.random() * 6
    p.size = 4 + Math.random() * 6
    p.life = 50 + Math.random() * 40
    p.maxLife = p.life
    p.rotationSpeed = (Math.random() - 0.5) * 20
    return p
  })
}

export function streakGlow(streak: number): string {
  if (streak >= 10) return 'rgba(201,169,110,0.25)'
  if (streak >= 5) return 'rgba(51,98,63,0.2)'
  if (streak >= 3) return 'rgba(138,173,168,0.15)'
  return 'transparent'
}

export function tickParticles(particles: Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.12,
      vx: p.vx * 0.98,
      life: p.life - 1,
      opacity: Math.max(0, p.life / p.maxLife),
      rotation: p.rotation + p.rotationSpeed,
    }))
    .filter(p => p.life > 0)
}

export function renderParticleStyle(p: Particle): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: p.x,
    top: p.y,
    width: p.size,
    height: p.size,
    opacity: p.opacity,
    pointerEvents: 'none',
    transform: `rotate(${p.rotation}deg)`,
    transition: 'none',
  }

  switch (p.type) {
    case 'circle':
      return { ...base, borderRadius: '50%', backgroundColor: p.color }
    case 'star':
      return {
        ...base,
        width: 0, height: 0,
        borderLeft: `${p.size / 2}px solid transparent`,
        borderRight: `${p.size / 2}px solid transparent`,
        borderBottom: `${p.size}px solid ${p.color}`,
        backgroundColor: 'transparent',
      }
    case 'spark':
      return {
        ...base,
        width: p.size * 0.3,
        height: p.size,
        borderRadius: p.size,
        backgroundColor: p.color,
      }
    case 'confetti':
      return {
        ...base,
        width: p.size,
        height: p.size * 0.5,
        borderRadius: 1,
        backgroundColor: p.color,
      }
  }
}

export interface ScorePop {
  id: number
  x: number
  y: number
  text: string
  color: string
  age: number
}

let nextPopId = 0

export function createScorePop(x: number, y: number, value: number | string, color = '#c9a96e'): ScorePop {
  return {
    id: nextPopId++,
    x: x + (Math.random() - 0.5) * 20,
    y,
    text: typeof value === 'number' ? `+${value}` : value,
    color,
    age: 0,
  }
}

export function tickScorePops(pops: ScorePop[]): ScorePop[] {
  return pops
    .map(p => ({ ...p, y: p.y - 1.5, age: p.age + 1 }))
    .filter(p => p.age < 40)
}

export function scorePopStyle(pop: ScorePop): React.CSSProperties {
  const progress = pop.age / 40
  return {
    position: 'absolute',
    left: pop.x,
    top: pop.y,
    fontSize: 18 + (1 - progress) * 6,
    fontWeight: 700,
    color: pop.color,
    opacity: 1 - progress * progress,
    pointerEvents: 'none',
    transform: `scale(${1 + (1 - progress) * 0.3})`,
    fontVariantNumeric: 'tabular-nums',
    textShadow: `0 1px 4px ${pop.color}40`,
    transition: 'none',
    whiteSpace: 'nowrap',
  }
}

export function screenShakeStyle(intensity: number): React.CSSProperties {
  if (intensity <= 0) return {}
  const x = (Math.random() - 0.5) * intensity * 4
  const y = (Math.random() - 0.5) * intensity * 4
  return { transform: `translate(${x}px, ${y}px)` }
}

export function comboGlowStyle(streak: number, accentColor: string): React.CSSProperties {
  if (streak < 3) return {}
  const intensity = Math.min(streak / 15, 1)
  return {
    boxShadow: `inset 0 0 ${20 + intensity * 40}px ${accentColor}${Math.round(intensity * 25).toString(16).padStart(2, '0')}`,
  }
}
