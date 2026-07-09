import type { CSSProperties } from 'react'

// KasukuGames — Cognitive Performance Platform
// Warm cream organic design system. Solid filled, warm tones. Glass FINISH
// (edge highlight + float shadow), NOT translucent/blur.
// Ultra-luxury, ultra-elite, advanced engineering.

import { loadTheme } from './theme'

// Warm cream (light) palette. The tanzanite-earth ACCENTS (emerald/teal/
// sapphire/violet/amber/rose/gold/coral + semantic + cognitive targets) are
// theme-independent; only the ink/surface/text keys flip between themes.
const LIGHT_COLOR = {
  // Ink/text (dark on cream)
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

type ColorKey = keyof typeof LIGHT_COLOR

// Dark counterpart: same accents, ink→light, surfaces→dark. So games importing
// COLOR work in the default DARK theme (were previously white-screening).
const DARK_COLOR: Record<ColorKey, string> = {
  obsidian: '#ece6dc', ink: '#e2dacd', slate: '#c8bfae', carbon: '#ece6dc',
  bgDeep: '#0f0d0a', cardActive: '#1c1812',
  emerald: '#a8b89a', teal: '#8aada8', sapphire: '#c4a882', violet: '#b8a0c8',
  amber: '#c9a96e', rose: '#c8847a', gold: '#c9a96e', coral: '#d4937a',
  success: '#a8b89a', warning: '#c9a96e', error: '#c8847a',
  memory: '#b8a0c8', executive: '#c4a882', pattern: '#a8b89a', speed: '#c9a96e',
  social: '#c8847a', language: '#8aada8', creativity: '#c89ab8', strategy: '#8ab8c8',
  white: '#ece6dc', muted: '#8a7e6e', dim: '#5a5044', border: '#2a2418', surface: '#161310',
}

// Theme-aware: resolves live from the current theme on each access.
export const COLOR = new Proxy({} as Record<ColorKey, string>, {
  get: (_t, key: string) => (loadTheme() === 'light' ? LIGHT_COLOR : DARK_COLOR)[key as ColorKey],
}) as Record<ColorKey, string>

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
} as const

export const MOTION = {
  snap: '100ms cubic-bezier(.2,.65,.3,.9)',
  fast: '180ms cubic-bezier(.2,.65,.3,.9)',
  med: '280ms cubic-bezier(.2,.65,.3,.9)',
  slow: '500ms cubic-bezier(.16,1,.3,1)',
  spring: '400ms cubic-bezier(.34,1.56,.64,1)',
} as const

export const TYPOGRAPHY = {
  display: {
    fontSize: 64,
    fontWeight: 600,
    letterSpacing: '-0.03em',
    lineHeight: 0.95,
  },
  heading: {
    fontSize: 32,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  subheading: {
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
  },
  body: {
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.65,
  },
  caption: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    lineHeight: 1.4,
  },
  mono: {
    fontVariantNumeric: 'tabular-nums',
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
} as const

export const SPACING = {
  xs: 6,
  sm: 10,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 72,
  section: 96,
} as const

export const SHADOW = {
  sm: '0 1px 3px rgba(20,16,10,0.03)',
  md: '0 2px 8px rgba(20,16,10,0.04), 0 4px 16px rgba(20,16,10,0.03)',
  lg: '0 4px 12px rgba(20,16,10,0.04), 0 8px 32px rgba(20,16,10,0.05)',
  xl: '0 6px 16px rgba(20,16,10,0.04), 0 16px 48px rgba(20,16,10,0.06)',
  glow: (color: string) =>
    `0 4px 24px ${color}20, 0 8px 48px ${color}12, 0 0 2px ${color}30`,
} as const

export const GLASS = {
  highlight: 'inset 0 1px 0 rgba(255,255,255,0.08)',
  edge: '0 1px 2px rgba(20,16,10,0.12)',
} as const

// -- Style functions --

export function card(accent?: string, bg = '#ffffff', border = '#e8e0d4'): CSSProperties {
  return {
    background: bg,
    border: `1px solid ${accent ? accent + '30' : border}`,
    borderRadius: 20,
    boxShadow: [
      GLASS.highlight,
      GLASS.edge,
      '0 2px 8px rgba(20,16,10,0.04)',
      '0 4px 16px rgba(20,16,10,0.03)',
    ].join(', '),
    transition: `transform ${MOTION.fast}, box-shadow ${MOTION.fast}`,
  }
}

export function cardHover(accent?: string): CSSProperties {
  const accentColor = accent || COLOR.emerald
  return {
    transform: 'translateY(-2px) scale(1.003)',
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.08)',
      `0 0 0 1px ${accentColor}40`,
      '0 4px 12px rgba(20,16,10,0.04)',
      '0 8px 32px rgba(20,16,10,0.05)',
      `0 0 24px ${accentColor}10`,
    ].join(', '),
  }
}

export function glassCard(bg = '#ffffff', border = '#e8e0d4'): CSSProperties {
  return {
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 20,
    boxShadow: [
      GLASS.highlight,
      GLASS.edge,
      '0 2px 8px rgba(20,16,10,0.04)',
      '0 4px 16px rgba(20,16,10,0.03)',
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
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: '0.02em',
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
    fontWeight: 600,
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
    fontWeight: 600,
    letterSpacing: '0.04em',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  }
}
