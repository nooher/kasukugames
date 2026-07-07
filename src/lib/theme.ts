export type Theme = 'dark' | 'light'

const THEME_KEY = 'kg_theme'

export function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* ignore */ }
  return 'dark'
}

export function saveTheme(theme: Theme) {
  localStorage.setItem(THEME_KEY, theme)
}

export const DARK_PALETTE = {
  bg: '#080c12',
  surface: '#0f1520',
  card: '#151d2b',
  cardHover: '#1a2535',
  border: '#1c2940',
  borderLight: '#243352',

  text: '#e8edf5',
  textMuted: '#8494a7',
  textDim: '#4a5d75',

  sapphire: '#3a86ff',
  emerald: '#00c97b',
  amber: '#f59e0b',
  violet: '#7b2ff7',
  rose: '#f43f5e',
  teal: '#00b4d8',
  coral: '#ff6b6b',
  gold: '#fbbf24',
  fuchsia: '#e879f9',
  cyan: '#22d3ee',
  orange: '#f97316',
  lime: '#84cc16',
} as const

export const LIGHT_PALETTE = {
  bg: '#f8f9fc',
  surface: '#ffffff',
  card: '#ffffff',
  cardHover: '#f4f5f8',
  border: '#e2e6ee',
  borderLight: '#d0d5e0',

  text: '#1a1f2e',
  textMuted: '#5a6478',
  textDim: '#8895a8',

  sapphire: '#3a86ff',
  emerald: '#00c97b',
  amber: '#f59e0b',
  violet: '#7b2ff7',
  rose: '#f43f5e',
  teal: '#00b4d8',
  coral: '#ff6b6b',
  gold: '#fbbf24',
  fuchsia: '#e879f9',
  cyan: '#22d3ee',
  orange: '#f97316',
  lime: '#84cc16',
} as const

export type Palette = { [K in keyof typeof DARK_PALETTE]: string }

export function getPalette(theme: Theme): Palette {
  return theme === 'light' ? LIGHT_PALETTE : DARK_PALETTE
}

export const RANK_COLORS = {
  bronze: '#cd7f32',
  silver: '#b0b8c4',
  gold: '#fbbf24',
  platinum: '#00b4d8',
  diamond: '#7b2ff7',
  master: '#f43f5e',
  legend: '#ff6b6b',
} as const
