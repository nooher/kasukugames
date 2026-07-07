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
  bg: '#1a1610',
  surface: '#221e16',
  card: '#2a2418',
  cardHover: '#332c1e',
  border: '#3a3228',
  borderLight: '#4a4032',

  text: '#f0ece4',
  textMuted: '#a89a86',
  textDim: '#6e6050',

  sapphire: '#c4a882',
  emerald: '#a8b89a',
  amber: '#c9a96e',
  violet: '#b8a0c8',
  rose: '#c8847a',
  teal: '#8aada8',
  coral: '#d4937a',
  gold: '#c9a96e',
  fuchsia: '#c89ab8',
  cyan: '#8ab8c8',
  orange: '#c8986a',
  lime: '#a8b882',
} as const

export const LIGHT_PALETTE = {
  bg: '#f5f0e8',
  surface: '#faf7f2',
  card: '#ffffff',
  cardHover: '#f9f5ee',
  border: '#e8e0d4',
  borderLight: '#ede6da',

  text: '#2c2418',
  textMuted: '#8a7e6e',
  textDim: '#b5a997',

  sapphire: '#c4a882',
  emerald: '#a8b89a',
  amber: '#c9a96e',
  violet: '#b8a0c8',
  rose: '#c8847a',
  teal: '#8aada8',
  coral: '#d4937a',
  gold: '#c9a96e',
  fuchsia: '#c89ab8',
  cyan: '#8ab8c8',
  orange: '#c8986a',
  lime: '#a8b882',
} as const

export type Palette = { [K in keyof typeof DARK_PALETTE]: string }

export function getPalette(theme: Theme): Palette {
  return theme === 'light' ? LIGHT_PALETTE : DARK_PALETTE
}

export const RANK_COLORS = {
  bronze: '#b8936e',
  silver: '#a8a098',
  gold: '#c9a96e',
  platinum: '#8aada8',
  diamond: '#b8a0c8',
  master: '#c8847a',
  legend: '#c4a882',
} as const
