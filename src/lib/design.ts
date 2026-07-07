import type { CSSProperties } from 'react'

// KasukuGames — Cognitive Performance Platform
// Solid filled, thick fluid colors. Glass FINISH (edge highlight + float shadow),
// NOT translucent. Crispy, silky, slick, smooth. Better than Spotify + Calm.

export const COLOR = {
  // Deep fluid fills — thick, saturated, opaque
  obsidian: '#0b0f14',
  ink: '#111820',
  slate: '#1a2230',
  carbon: '#141c28',

  // Jewel accents — solid, punchy
  emerald: '#00c97b',
  teal: '#00b4d8',
  sapphire: '#3a86ff',
  violet: '#7b2ff7',
  amber: '#f59e0b',
  rose: '#f43f5e',
  gold: '#fbbf24',
  coral: '#ff6b6b',

  // Cognitive target palette
  memory: '#7b2ff7',
  executive: '#3a86ff',
  pattern: '#00c97b',
  speed: '#f59e0b',
  social: '#f43f5e',
  language: '#00b4d8',
  creativity: '#e879f9',
  strategy: '#06b6d4',

  // Neutrals
  white: '#f0f4f8',
  muted: '#7a8ba0',
  dim: '#3d4f63',
  border: '#1f2d3d',
  surface: '#151d2b',
} as const

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
} as const

export const MOTION = {
  snap: '120ms cubic-bezier(.25,.46,.45,.94)',
  fast: '200ms cubic-bezier(.25,.46,.45,.94)',
  med: '320ms cubic-bezier(.25,.46,.45,.94)',
  slow: '500ms cubic-bezier(.16,1,.3,1)',
  spring: '400ms cubic-bezier(.34,1.56,.64,1)',
} as const

export function card(accent?: string): CSSProperties {
  return {
    background: COLOR.slate,
    border: `1px solid ${accent ? accent + '30' : COLOR.border}`,
    borderRadius: RADIUS.lg,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.5)`,
    transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
  }
}

export function cardHover(accent?: string): CSSProperties {
  return {
    transform: 'translateY(-2px)',
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${accent || COLOR.emerald}40`,
  }
}

export function solidBtn(color: string): CSSProperties {
  return {
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: RADIUS.full,
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: `transform ${MOTION.snap}, box-shadow ${MOTION.snap}`,
    boxShadow: `0 2px 12px ${color}50`,
  }
}

export function chip(color: string): CSSProperties {
  return {
    background: color + '20',
    color: color,
    border: `1px solid ${color}30`,
    borderRadius: RADIUS.full,
    padding: '4px 12px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }
}
