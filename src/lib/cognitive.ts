// Cognitive target taxonomy — every game declares its primary training targets.
// Grounded in Baddeley (working memory), Kahneman (System 1/2), Csikszentmihalyi (flow),
// Gardner (multiple intelligences), Sweller (cognitive load), Deci & Ryan (SDT).

export type CognitiveTarget =
  | 'working-memory'
  | 'executive-function'
  | 'pattern-recognition'
  | 'processing-speed'
  | 'social-intelligence'
  | 'emotional-intelligence'
  | 'negotiation'
  | 'creativity'
  | 'strategic-planning'
  | 'linguistic-fluency'
  | 'probabilistic-reasoning'
  | 'cognitive-flexibility'
  | 'theory-of-mind'
  | 'decision-making'
  | 'sustained-attention'
  | 'spatial-reasoning'
  | 'visual-perception'

export const TARGET_META: Record<CognitiveTarget, { label: string; color: string; icon: string }> = {
  'working-memory': { label: 'Working Memory', color: '#b8a0c8', icon: 'brain' },
  'executive-function': { label: 'Executive Function', color: '#c4a882', icon: 'cpu' },
  'pattern-recognition': { label: 'Pattern Recognition', color: '#a8b89a', icon: 'scan' },
  'processing-speed': { label: 'Processing Speed', color: '#c9a96e', icon: 'zap' },
  'social-intelligence': { label: 'Social Intelligence', color: '#c8847a', icon: 'users' },
  'emotional-intelligence': { label: 'Emotional Intelligence', color: '#c89ab8', icon: 'heart' },
  'negotiation': { label: 'Negotiation', color: '#c8986a', icon: 'handshake' },
  'creativity': { label: 'Creativity', color: '#c89ab8', icon: 'lightbulb' },
  'strategic-planning': { label: 'Strategic Planning', color: '#8ab8c8', icon: 'target' },
  'linguistic-fluency': { label: 'Linguistic Fluency', color: '#8aada8', icon: 'languages' },
  'probabilistic-reasoning': { label: 'Probabilistic Reasoning', color: '#b8a0c8', icon: 'dice5' },
  'cognitive-flexibility': { label: 'Cognitive Flexibility', color: '#8aada8', icon: 'shuffle' },
  'theory-of-mind': { label: 'Theory of Mind', color: '#c89ab8', icon: 'eye' },
  'decision-making': { label: 'Decision Making', color: '#c8847a', icon: 'crosshair' },
  'sustained-attention': { label: 'Sustained Attention', color: '#8ab8c8', icon: 'focus' },
  'spatial-reasoning': { label: 'Spatial Reasoning', color: '#b8a0c8', icon: 'box' },
  'visual-perception': { label: 'Visual Perception', color: '#8ab8c8', icon: 'eye' },
}

export type GameCategory =
  | 'iq-arena'
  | 'fast-brain'
  | 'language-arena'
  | 'creativity-lab'
  | 'psychological'
  | 'social'
  | 'party'
  | 'mental-endurance'
  | 'medical'
  | 'ai-games'
  | 'classic'

export const CATEGORY_META: Record<GameCategory, { label: string; sub: string; color: string }> = {
  'iq-arena': { label: 'IQ Arena', sub: 'Classic intelligence challenges', color: '#c4a882' },
  'fast-brain': { label: 'Fast Brain', sub: 'Reaction + thinking', color: '#c9a96e' },
  'language-arena': { label: 'Language Arena', sub: 'Linguistic mastery', color: '#8aada8' },
  'creativity-lab': { label: 'Creativity Lab', sub: 'Divergent thinking', color: '#c89ab8' },
  'psychological': { label: 'Psychological', sub: 'Self-discovery', color: '#c8847a' },
  'social': { label: 'Social Games', sub: 'Human connection', color: '#c8986a' },
  'party': { label: 'Party', sub: 'Multiplayer & couples', color: '#c89ab8' },
  'mental-endurance': { label: 'Mental Endurance', sub: 'Cognitive marathons', color: '#8ab8c8' },
  'medical': { label: 'Medical', sub: 'Clinical reasoning', color: '#a8b89a' },
  'ai-games': { label: 'AI Games', sub: 'Human vs machine', color: '#b8a0c8' },
  'classic': { label: 'Classic', sub: 'Timeless arcade', color: '#a8a098' },
}

export interface GameDef {
  id: string
  title: string
  subtitle: string
  category: GameCategory
  targets: CognitiveTarget[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  players: '1' | '2' | '2-4' | '2-8' | '2-10' | '2+'
  duration: string
  description: string
}

export interface GameScore {
  gameId: string
  score: number
  maxScore: number
  accuracy: number
  timeMs: number
  level: number
  date: number
}

export function saveScore(s: GameScore) {
  const key = `kg_scores_${s.gameId}`
  const existing: GameScore[] = JSON.parse(localStorage.getItem(key) || '[]')
  existing.push(s)
  if (existing.length > 100) existing.splice(0, existing.length - 100)
  localStorage.setItem(key, JSON.stringify(existing))
}

export function getScores(gameId: string): GameScore[] {
  return JSON.parse(localStorage.getItem(`kg_scores_${gameId}`) || '[]')
}

export function getBestScore(gameId: string): GameScore | null {
  const scores = getScores(gameId)
  if (scores.length === 0) return null
  return scores.reduce((best, s) => s.score > best.score ? s : best)
}
