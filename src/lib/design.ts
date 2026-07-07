import type { CSSProperties } from 'react'

// KasukuGames — Cognitive Performance Platform
// Warm cream organic design system. Solid filled, warm tones. Glass FINISH
// (edge highlight + float shadow), NOT translucent/blur.
// Crispy, silky, slick, smooth. Better than Spotify + Calm + Duolingo.

export const COLOR = {
  // Warm cream fills
  obsidian: '#1a1610',
  ink: '#221e16',
  slate: '#2a2418',
  carbon: '#221e16',

  // Deep hero backdrop
  bgDeep: '#f5f0e8',

  // Active/interactive surface
  cardActive: '#f9f5ee',

  // Warm accents — solid, organic
  emerald: '#a8b89a',
  teal: '#8aada8',
  sapphire: '#c4a882',
  violet: '#b8a0c8',
  amber: '#c9a96e',
  rose: '#c8847a',
  gold: '#c9a96e',
  coral: '#d4937a',

  // Semantic
  success: '#a8b89a',
  warning: '#c9a96e',
  error: '#c8847a',

  // Cognitive target palette
  memory: '#b8a0c8',
  executive: '#c4a882',
  pattern: '#a8b89a',
  speed: '#c9a96e',
  social: '#c8847a',
  language: '#8aada8',
  creativity: '#c89ab8',
  strategy: '#8ab8c8',

  // Neutrals
  white: '#2c2418',
  muted: '#8a7e6e',
  dim: '#b5a997',
  border: '#e8e0d4',
  surface: '#faf7f2',
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
  sm: '0 2px 8px rgba(44,36,24,0.06), 0 1px 3px rgba(44,36,24,0.04)',
  md: '0 4px 20px rgba(44,36,24,0.08), 0 2px 8px rgba(44,36,24,0.05)',
  lg: '0 8px 40px rgba(44,36,24,0.10), 0 4px 16px rgba(44,36,24,0.06)',
  xl: '0 16px 64px rgba(44,36,24,0.12), 0 8px 24px rgba(44,36,24,0.08)',
  glow: (color: string) =>
    `0 4px 24px ${color}25, 0 8px 48px ${color}15, 0 0 2px ${color}35`,
} as const

export const GLASS = {
  highlight: 'inset 0 1px 0 rgba(255,255,255,0.5)',
  edge: '0 1px 3px rgba(44,36,24,0.08)',
} as const

// ── Style functions ──────────────────────────────────────────

export function card(accent?: string): CSSProperties {
  return {
    background: '#ffffff',
    border: `1px solid ${accent ? accent + '30' : '#e8e0d4'}`,
    borderRadius: RADIUS.lg,
    boxShadow: [
      GLASS.highlight,
      GLASS.edge,
      '0 6px 28px rgba(44,36,24,0.06)',
      '0 2px 8px rgba(44,36,24,0.04)',
    ].join(', '),
    transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
  }
}

export function cardHover(accent?: string): CSSProperties {
  const accentColor = accent || COLOR.emerald
  return {
    transform: 'translateY(-3px) scale(1.005)',
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.5)',
      `0 0 0 1px ${accentColor}40`,
      '0 12px 40px rgba(44,36,24,0.10)',
      '0 4px 12px rgba(44,36,24,0.06)',
      `0 0 24px ${accentColor}10`,
    ].join(', '),
  }
}

export function glassCard(): CSSProperties {
  return {
    background: '#ffffff',
    border: '1px solid #e8e0d4',
    borderRadius: RADIUS.lg,
    boxShadow: [
      GLASS.highlight,
      GLASS.edge,
      '0 8px 40px rgba(44,36,24,0.08)',
      '0 4px 16px rgba(44,36,24,0.05)',
    ].join(', '),
    transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
  }
}

export function heroGlow(color: string): CSSProperties {
  return {
    boxShadow: [
      `0 0 60px ${color}15`,
      `0 0 120px ${color}08`,
      `0 0 200px ${color}05`,
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
      `inset 0 1px 0 rgba(255,255,255,0.25)`,
      `0 4px 20px ${color}30`,
      `0 2px 8px ${color}20`,
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
      'inset 0 1px 0 rgba(255,255,255,0.2)',
      `0 4px 16px ${color}30`,
      `0 2px 6px ${color}20`,
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
