// Per-game visual identity — a distinct icon + gradient for every game so the
// arcade reads as a curated storefront rather than a flat list. Gradients are
// keyed off category (harmonised with the warm Kasuku / Tanzanite palette but
// pushed richer for storefront vibrancy); the icon is per-game.

import {
  Gem, Grid3x3, Binary, GitFork, Radar, Type, Lightbulb, Brain, Building2,
  Layers3, ScanSearch, Boxes, Scale, Dices, Grid2x2, Blocks, Stethoscope,
  Bot, Flame, Eye, MessageCircleQuestion, Swords, Waypoints, WalletCards,
  Spade, Landmark, Dumbbell, Wind, BookOpen, Wine, Heart, Gamepad2,
  type LucideIcon,
} from 'lucide-react'
import type { GameCategory, GameDef } from './cognitive'

export interface GameArt {
  Icon: LucideIcon
  from: string
  to: string
  glow: string
}

// Category → gradient duo (from, to). Warm-earth DNA, storefront saturation.
const CATEGORY_GRADIENT: Record<GameCategory, [string, string]> = {
  'flagship': ['#7b6cf0', '#4a90d9'],       // tanzanite — blue-violet, the real gem
  'iq-arena': ['#d4b06a', '#b08a4e'],
  'fast-brain': ['#e0a95c', '#d47a4a'],
  'language-arena': ['#7fb0a8', '#579089'],
  'creativity-lab': ['#d98bc4', '#bd5fa4'],
  'psychological': ['#d98a76', '#c15e56'],
  'social': ['#d69a6a', '#c07a4e'],
  'party': ['#e879b0', '#d4487e'],
  'couples': ['#e05b82', '#c2385e'],
  'card-games': ['#c99a66', '#a87848'],
  'board-games': ['#8a9ad0', '#5e70b4'],
  'fitness': ['#78c082', '#4f9e5c'],
  'faith': ['#d9c46a', '#bfa444'],
  'mental-endurance': ['#7ab4d0', '#5290b2'],
  'medical': ['#9cc09c', '#6fa07c'],
  'ai-games': ['#ac8bd0', '#8460b4'],
  'classic': ['#b4ac9a', '#8f8676'],
}

// Per-game icon.
const GAME_ICON: Record<string, LucideIcon> = {
  'tanzanite': Gem,
  'matrix-forge': Grid3x3,
  'sequence-collapse': Binary,
  'split-decision': GitFork,
  'signal-noise': Radar,
  'word-forge': Type,
  'impossible-uses': Lightbulb,
  'memory-marathon': Brain,
  'focus-tower': Building2,
  'cognitive-overload': Layers3,
  'pattern-hunter': ScanSearch,
  'spatial-architect': Boxes,
  'moral-dilemmas': Scale,
  'risk-appetite': Dices,
  'brick-breaker': Grid2x2,
  'tetris-flow': Blocks,
  'diagnosis-sprint': Stethoscope,
  'debate-ai': Bot,
  'truth-or-dare': Flame,
  'never-have-i-ever': Eye,
  'guess-what': MessageCircleQuestion,
  'draft-chase': Swords,
  'snake': Waypoints,
  'last-card': WalletCards,
  'albastini': Spade,
  'monopoly': Landmark,
  'calisthenics': Dumbbell,
  'breath-hold': Wind,
  'scripture-quest': BookOpen,
  'spin-the-bottle': Wine,
  'couples-quiz': Heart,
}

export function getGameArt(game: GameDef): GameArt {
  const [from, to] = CATEGORY_GRADIENT[game.category] ?? ['#c4a882', '#a88a5e']
  return {
    Icon: GAME_ICON[game.id] ?? Gamepad2,
    from,
    to,
    glow: to,
  }
}

export function categoryGradient(cat: GameCategory): [string, string] {
  return CATEGORY_GRADIENT[cat] ?? ['#c4a882', '#a88a5e']
}
