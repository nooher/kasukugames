import type { CSSProperties } from 'react'

// KasukuGames — Cognitive Performance Platform
// $5B design system. Solid filled, thick fluid colors. Glass FINISH
// (edge highlight + float shadow), NOT translucent/blur.
// Crispy, silky, slick, smooth. Better than Spotify + Calm + Duolingo.

export const COLOR = {
  // Deep fluid fills — thick, saturated, opaque
  obsidian: '#0b0f14',
  ink: '#111820',
  slate: '#1a2230',
  carbon: '#141c28',

  // Deep hero backdrop
  bgDeep: '#060a10',

  // Active/interactive surface
  cardActive: '#1e2a3e',

  // Jewel accents — solid, punchy
  emerald: '#00c97b',
  teal: '#00b4d8',
  sapphire: '#3a86ff',
  violet: '#7b2ff7',
  amber: '#f59e0b',
  rose: '#f43f5e',
  gold: '#fbbf24',
  coral: '#ff6b6b',

  // Semantic
  success: '#00c97b',
  warning: '#f59e0b',
  error: '#f43f5e',

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

export const TYPOGRAPHY = {
  display: {
    fontSize: 48,
    fontWeight: 900,
    letterSpacing: '-0.04em',
    lineHeight: 1.05,
  },
  heading: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
  },
  subheading: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  body: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.6,
  },
  caption: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
    lineHeight: 1.4,
  },
  mono: {
    fontVariantNumeric: 'tabular-nums',
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
} as const

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 64,
} as const

export const SHADOW = {
  sm: '0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)',
  md: '0 4px 20px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
  lg: '0 8px 40px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)',
  xl: '0 16px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)',
  glow: (color: string) =>
    `0 4px 24px ${color}35, 0 8px 48px ${color}20, 0 0 2px ${color}50`,
} as const

export const GLASS = {
  highlight: 'inset 0 1px 0 rgba(255,255,255,0.06)',
  edge: '0 0 0 1px rgba(255,255,255,0.04)',
} as const

// ── Style functions ──────────────────────────────────────────

export function card(accent?: string): CSSProperties {
  return {
    background: COLOR.slate,
    border: `1px solid ${accent ? accent + '30' : COLOR.border}`,
    borderRadius: RADIUS.lg,
    boxShadow: [
      GLASS.highlight,
      GLASS.edge,
      '0 6px 28px rgba(0,0,0,0.5)',
      '0 2px 8px rgba(0,0,0,0.35)',
    ].join(', '),
    transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
  }
}

export function cardHover(accent?: string): CSSProperties {
  const accentColor = accent || COLOR.emerald
  return {
    transform: 'translateY(-3px) scale(1.005)',
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.08)',
      `0 0 0 1px ${accentColor}40`,
      '0 12px 40px rgba(0,0,0,0.6)',
      '0 4px 12px rgba(0,0,0,0.4)',
      `0 0 24px ${accentColor}15`,
    ].join(', '),
  }
}

export function glassCard(): CSSProperties {
  return {
    background: COLOR.slate,
    border: `1px solid ${COLOR.border}`,
    borderRadius: RADIUS.lg,
    boxShadow: [
      GLASS.highlight,
      GLASS.edge,
      '0 8px 40px rgba(0,0,0,0.55)',
      '0 4px 16px rgba(0,0,0,0.35)',
    ].join(', '),
    transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
  }
}

export function heroGlow(color: string): CSSProperties {
  return {
    boxShadow: [
      `0 0 60px ${color}20`,
      `0 0 120px ${color}12`,
      `0 0 200px ${color}08`,
    ].join(', '),
  }
}

export function premiumBtn(color: string): CSSProperties {
  return {
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: RADIUS.full,
    padding: '12px 28px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: [
      `inset 0 1px 0 rgba(255,255,255,0.15)`,
      `0 4px 20px ${color}40`,
      `0 2px 8px ${color}30`,
    ].join(', '),
    transition: `transform ${MOTION.snap}, box-shadow ${MOTION.snap}`,
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
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.12)',
      `0 4px 16px ${color}40`,
      `0 2px 6px ${color}25`,
    ].join(', '),
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
