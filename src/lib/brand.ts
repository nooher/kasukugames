export const BRAND = {
  name: 'KasukuGames',
  tagline: 'Olympics of the Mind',
  sub: 'Cognitive Performance Platform',
  by: 'Laetoli',
  version: '1.0.0',
} as const

// Theme-aware: PALETTE resolves live from the current theme (its keys match
// theme.ts exactly), so games importing it follow the dark/light toggle.
// Previously it was fixed-light, which white-screened games in the default
// DARK theme. The tanzanite-earth accents are identical across both themes;
// only surfaces/text flip.
import { getPalette, loadTheme, type Palette } from './theme'

export const PALETTE: Palette = new Proxy({} as Palette, {
  get: (_t, key: string) => (getPalette(loadTheme()) as Record<string, string>)[key],
}) as Palette

export const RANK_COLORS = {
  bronze: '#b8936e',
  silver: '#a8a098',
  gold: '#c9a96e',
  platinum: '#8aada8',
  diamond: '#b8a0c8',
  master: '#c8847a',
  legend: '#c4a882',
} as const
