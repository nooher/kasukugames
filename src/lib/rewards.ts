import { PALETTE } from './brand'

export type MuhuriType = 'founder' | 'admin' | 'creator' | 'verified' | 'player'

export interface Muhuri {
  type: MuhuriType
  label: string
  color: string
  sealColor: string
}

export const MUHURI_META: Record<MuhuriType, Muhuri> = {
  founder:  { type: 'founder',  label: 'Founder',   color: '#c9a96e', sealColor: '#D4A017' },
  admin:    { type: 'admin',    label: 'Admin',      color: '#8aada8', sealColor: '#33623F' },
  creator:  { type: 'creator',  label: 'Creator',    color: '#c4a882', sealColor: '#c4a882' },
  verified: { type: 'verified', label: 'Verified',   color: '#2F6FB0', sealColor: '#2F6FB0' },
  player:   { type: 'player',   label: 'Player',     color: '#a89a86', sealColor: '#a89a86' },
}

const BUILTIN_MUHURI: Record<string, MuhuriType> = {
  anaim: 'founder',
}

const MUHURI_STORE_KEY = 'kg_muhuri_assignments'

function loadMuhuriAssignments(): Record<string, MuhuriType> {
  try { return JSON.parse(localStorage.getItem(MUHURI_STORE_KEY) || '{}') }
  catch { return {} }
}

function saveMuhuriAssignments(assignments: Record<string, MuhuriType>) {
  localStorage.setItem(MUHURI_STORE_KEY, JSON.stringify(assignments))
}

export function getMuhuri(username: string): MuhuriType {
  const key = username.toLowerCase()
  if (BUILTIN_MUHURI[key]) return BUILTIN_MUHURI[key]
  const assigned = loadMuhuriAssignments()
  return assigned[key] || 'player'
}

export function setMuhuri(username: string, muhuri: MuhuriType) {
  const key = username.toLowerCase()
  if (BUILTIN_MUHURI[key]) return
  const assigned = loadMuhuriAssignments()
  if (muhuri === 'player') {
    delete assigned[key]
  } else {
    assigned[key] = muhuri
  }
  saveMuhuriAssignments(assigned)
}

export function getAllMuhuriAssignments(): Record<string, MuhuriType> {
  return { ...BUILTIN_MUHURI, ...loadMuhuriAssignments() }
}

export function isFounderOrAdmin(muhuri: MuhuriType): boolean {
  return muhuri === 'founder' || muhuri === 'admin'
}

export function isVerifiedTier(muhuri: MuhuriType): boolean {
  return muhuri === 'founder' || muhuri === 'admin' || muhuri === 'creator' || muhuri === 'verified'
}

export interface PlayerProfile {
  id: string
  username: string
  displayName: string
  avatar: string
  photoUrl: string | null
  muhuri: MuhuriType
  level: number
  xp: number
  totalGames: number
  totalScore: number
  streakDays: number
  longestStreak: number
  lastPlayedAt: number
  joinedAt: number
  rank: RankTier
  badges: string[]
  teamId: string | null
  friendIds: string[]
  coupledWith: string | null
}

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'legend'

export const RANK_META: Record<RankTier, { label: string; minXP: number; color: string; icon: string }> = {
  bronze:   { label: 'Bronze',   minXP: 0,      color: '#b8936e', icon: 'shield' },
  silver:   { label: 'Silver',   minXP: 5000,   color: '#a8a098', icon: 'shield' },
  gold:     { label: 'Gold',     minXP: 15000,  color: '#c9a96e', icon: 'award' },
  platinum: { label: 'Platinum', minXP: 40000,  color: '#8aada8', icon: 'crown' },
  diamond:  { label: 'Diamond',  minXP: 100000, color: '#b8a0c8', icon: 'gem' },
  master:   { label: 'Master',   minXP: 250000, color: '#c8847a', icon: 'trophy' },
  legend:   { label: 'Legend',   minXP: 500000, color: '#c4a882', icon: 'flame' },
}

export function getRankForXP(xp: number): RankTier {
  const tiers = Object.entries(RANK_META).reverse() as [RankTier, typeof RANK_META[RankTier]][]
  for (const [tier, meta] of tiers) {
    if (xp >= meta.minXP) return tier
  }
  return 'bronze'
}

export function getLevel(xp: number): number {
  return Math.floor(1 + Math.sqrt(xp / 100))
}

export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100
}

export function xpToNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const level = getLevel(xp)
  const currentLevelXP = xpForLevel(level)
  const nextLevelXP = xpForLevel(level + 1)
  const progress = (xp - currentLevelXP) / (nextLevelXP - currentLevelXP)
  return { current: xp - currentLevelXP, needed: nextLevelXP - currentLevelXP, progress: Math.min(1, progress) }
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  requirement: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export const BADGES: Badge[] = [
  { id: 'first-game', name: 'Mwanzo', description: 'Complete your first game', icon: 'play', color: PALETTE.emerald, requirement: 'Play 1 game', rarity: 'common' },
  { id: 'streak-7', name: 'Msimamo', description: '7-day streak', icon: 'flame', color: PALETTE.amber, requirement: '7 consecutive days', rarity: 'common' },
  { id: 'streak-30', name: 'Nguvu', description: '30-day streak', icon: 'flame', color: PALETTE.rose, requirement: '30 consecutive days', rarity: 'rare' },
  { id: 'streak-100', name: 'Hadithi', description: '100-day streak', icon: 'flame', color: PALETTE.violet, requirement: '100 consecutive days', rarity: 'legendary' },
  { id: 'all-categories', name: 'Msomi', description: 'Play every category', icon: 'grid', color: PALETTE.sapphire, requirement: 'Play all 8 categories', rarity: 'rare' },
  { id: 'perfect-score', name: 'Ukamilifu', description: 'Perfect score in any game', icon: 'star', color: PALETTE.gold, requirement: '100% accuracy', rarity: 'epic' },
  { id: 'speed-demon', name: 'Haraka', description: 'Top 1% processing speed', icon: 'zap', color: PALETTE.amber, requirement: 'Elite speed ranking', rarity: 'epic' },
  { id: 'memory-king', name: 'Kumbukumbu', description: 'Level 10 in Memory Marathon', icon: 'brain', color: PALETTE.violet, requirement: 'Memory Marathon level 10', rarity: 'epic' },
  { id: 'team-founder', name: 'Kiongozi', description: 'Found a team', icon: 'users', color: PALETTE.teal, requirement: 'Create a team', rarity: 'common' },
  { id: 'couple-sync', name: 'Pamoja', description: 'Complete 10 couple challenges', icon: 'heart', color: PALETTE.rose, requirement: '10 couple challenges', rarity: 'rare' },
  { id: 'social-butterfly', name: 'Rafiki', description: '10 friends added', icon: 'users', color: PALETTE.fuchsia, requirement: '10 friends', rarity: 'common' },
  { id: 'games-50', name: 'Mchezaji', description: 'Play 50 games', icon: 'gamepad', color: PALETTE.emerald, requirement: '50 total games', rarity: 'common' },
  { id: 'games-500', name: 'Bingwa', description: 'Play 500 games', icon: 'trophy', color: PALETTE.gold, requirement: '500 total games', rarity: 'epic' },
  { id: 'top-10', name: 'Mfalme', description: 'Reach top 10 global', icon: 'crown', color: PALETTE.rose, requirement: 'Global top 10', rarity: 'legendary' },
  { id: 'night-owl', name: 'Bundi', description: 'Play at midnight', icon: 'moon', color: PALETTE.violet, requirement: 'Play between 00:00-04:00', rarity: 'rare' },
  { id: 'moral-explorer', name: 'Hekima', description: 'Complete Moral Dilemmas', icon: 'scale', color: PALETTE.teal, requirement: 'Finish all dilemmas', rarity: 'rare' },
]

export interface DailyChallenge {
  id: string
  title: string
  description: string
  gameId: string
  target: number
  xpReward: number
  type: 'score' | 'accuracy' | 'streak' | 'speed' | 'games'
}

export function generateDailyChallenges(day: number): DailyChallenge[] {
  const pool: DailyChallenge[] = [
    { id: 'dc-matrix', title: 'Matrix Master', description: 'Score 500+ in Matrix Forge', gameId: 'matrix-forge', target: 500, xpReward: 150, type: 'score' },
    { id: 'dc-speed', title: 'Haraka Sana', description: 'Complete Split Decision with 90%+ accuracy', gameId: 'split-decision', target: 90, xpReward: 200, type: 'accuracy' },
    { id: 'dc-memory', title: 'Kumbuka', description: 'Reach level 4 in Memory Marathon', gameId: 'memory-marathon', target: 4, xpReward: 175, type: 'score' },
    { id: 'dc-words', title: 'Maneno', description: 'Forge 15 words in Word Forge', gameId: 'word-forge', target: 15, xpReward: 150, type: 'score' },
    { id: 'dc-focus', title: 'Umakini', description: 'Build 8 floors in Focus Tower', gameId: 'focus-tower', target: 8, xpReward: 250, type: 'score' },
    { id: 'dc-triage', title: 'Dharura', description: 'Score 300+ in Cognitive Overload', gameId: 'cognitive-overload', target: 300, xpReward: 200, type: 'score' },
    { id: 'dc-pattern', title: 'Mtafiti', description: 'Find 5 patterns in Pattern Hunter', gameId: 'pattern-hunter', target: 5, xpReward: 175, type: 'score' },
    { id: 'dc-signal', title: 'Ishara', description: 'Clear 4 rounds in Signal vs Noise', gameId: 'signal-noise', target: 4, xpReward: 150, type: 'score' },
    { id: 'dc-3games', title: 'Tatu', description: 'Play any 3 different games', gameId: '*', target: 3, xpReward: 100, type: 'games' },
    { id: 'dc-sequence', title: 'Mfuatano', description: 'Score 400+ in Sequence Collapse', gameId: 'sequence-collapse', target: 400, xpReward: 175, type: 'score' },
  ]
  const seed = day % pool.length
  return [pool[seed], pool[(seed + 3) % pool.length], pool[(seed + 7) % pool.length]]
}

export function calculateGameXP(score: number, accuracy: number, level: number, streakDays: number): number {
  const base = Math.floor(score * 0.5)
  const accuracyBonus = accuracy >= 0.9 ? 50 : accuracy >= 0.7 ? 25 : 0
  const levelBonus = level * 10
  const streakMultiplier = 1 + Math.min(streakDays * 0.05, 0.5)
  return Math.floor((base + accuracyBonus + levelBonus) * streakMultiplier)
}

const PROFILE_KEY = 'kg_profile'

export function loadProfile(): PlayerProfile | null {
  try {
    const data = localStorage.getItem(PROFILE_KEY)
    if (!data) return null
    const p = JSON.parse(data) as PlayerProfile
    if (!p.muhuri) {
      p.muhuri = getMuhuri(p.username)
      p.photoUrl = p.photoUrl ?? null
      saveProfile(p)
    }
    return p
  } catch { return null }
}

export function saveProfile(profile: PlayerProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export function createProfile(username: string, displayName: string): PlayerProfile {
  const profile: PlayerProfile = {
    id: `p_${Date.now().toString(36)}`,
    username,
    displayName,
    avatar: '🧠',
    photoUrl: null,
    muhuri: getMuhuri(username),
    level: 1,
    xp: 0,
    totalGames: 0,
    totalScore: 0,
    streakDays: 0,
    longestStreak: 0,
    lastPlayedAt: 0,
    joinedAt: Date.now(),
    rank: 'bronze',
    badges: [],
    teamId: null,
    friendIds: [],
    coupledWith: null,
  }
  saveProfile(profile)
  return profile
}

export function updateProfileAfterGame(score: number, accuracy: number, level: number): PlayerProfile | null {
  const profile = loadProfile()
  if (!profile) return null

  const now = Date.now()
  const today = new Date(now).toDateString()
  const lastDay = profile.lastPlayedAt ? new Date(profile.lastPlayedAt).toDateString() : ''
  const yesterday = new Date(now - 86400000).toDateString()

  if (lastDay === yesterday) {
    profile.streakDays += 1
  } else if (lastDay !== today) {
    profile.streakDays = 1
  }
  profile.longestStreak = Math.max(profile.longestStreak, profile.streakDays)

  const xpGained = calculateGameXP(score, accuracy, level, profile.streakDays)
  profile.xp += xpGained
  profile.totalGames += 1
  profile.totalScore += score
  profile.level = getLevel(profile.xp)
  profile.rank = getRankForXP(profile.xp)
  profile.lastPlayedAt = now

  saveProfile(profile)
  return profile
}
