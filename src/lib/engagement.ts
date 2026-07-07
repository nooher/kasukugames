const ENG_KEY = 'kg_engagement'

export interface EngagementState {
  lastLoginDate: string
  consecutiveLogins: number
  totalLogins: number
  lastWeeklyReward: string
  luckyDrawsToday: number
  lastLuckyDraw: string
  comebackDays: number
  lastActivity: number
  milestones: string[]
  loginRewardsCollected: number[]
  seasonalEventsJoined: string[]
}

export const LOGIN_REWARD_SCHEDULE = [
  { day: 1, tokens: 5, label: 'Siku 1' },
  { day: 2, tokens: 5, label: 'Siku 2' },
  { day: 3, tokens: 10, label: 'Siku 3' },
  { day: 4, tokens: 10, label: 'Siku 4' },
  { day: 5, tokens: 15, label: 'Siku 5' },
  { day: 6, tokens: 20, label: 'Siku 6' },
  { day: 7, tokens: 50, label: 'Bonus ya Wiki!', special: true },
]

export const MILESTONES = [
  { id: 'games_10', label: '10 Games', threshold: 10, tokens: 50, check: (s: any) => s.totalGames >= 10 },
  { id: 'games_50', label: '50 Games', threshold: 50, tokens: 150, check: (s: any) => s.totalGames >= 50 },
  { id: 'games_100', label: '100 Games', threshold: 100, tokens: 300, check: (s: any) => s.totalGames >= 100 },
  { id: 'games_500', label: '500 Games', threshold: 500, tokens: 1000, check: (s: any) => s.totalGames >= 500 },
  { id: 'streak_7', label: 'One Week Streak', threshold: 7, tokens: 100, check: (s: any) => s.streakDays >= 7 },
  { id: 'streak_30', label: 'One Month Streak', threshold: 30, tokens: 500, check: (s: any) => s.streakDays >= 30 },
  { id: 'level_5', label: 'Level 5', threshold: 5, tokens: 50, check: (s: any) => s.level >= 5 },
  { id: 'level_10', label: 'Level 10', threshold: 10, tokens: 150, check: (s: any) => s.level >= 10 },
  { id: 'level_25', label: 'Level 25', threshold: 25, tokens: 500, check: (s: any) => s.level >= 25 },
  { id: 'xp_10k', label: '10,000 XP', threshold: 10000, tokens: 200, check: (s: any) => s.xp >= 10000 },
  { id: 'xp_100k', label: '100,000 XP', threshold: 100000, tokens: 1000, check: (s: any) => s.xp >= 100000 },
]

export const LUCKY_DRAW_PRIZES = [
  { tokens: 5, weight: 40, label: '5 Tokens' },
  { tokens: 10, weight: 25, label: '10 Tokens' },
  { tokens: 25, weight: 15, label: '25 Tokens' },
  { tokens: 50, weight: 10, label: '50 Tokens' },
  { tokens: 100, weight: 7, label: '100 Tokens!' },
  { tokens: 500, weight: 2, label: '500 Tokens!!' },
  { tokens: 1000, weight: 1, label: 'JACKPOT 1000!!!' },
]

export function loadEngagement(): EngagementState {
  try {
    const d = localStorage.getItem(ENG_KEY)
    if (d) return JSON.parse(d)
  } catch {}
  return {
    lastLoginDate: '',
    consecutiveLogins: 0,
    totalLogins: 0,
    lastWeeklyReward: '',
    luckyDrawsToday: 0,
    lastLuckyDraw: '',
    comebackDays: 0,
    lastActivity: 0,
    milestones: [],
    loginRewardsCollected: [],
    seasonalEventsJoined: [],
  }
}

export function saveEngagement(state: EngagementState) {
  localStorage.setItem(ENG_KEY, JSON.stringify(state))
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export function processLogin(): { tokens: number; day: number; isComeback: boolean; comebackBonus: number } {
  const eng = loadEngagement()
  const today = todayStr()
  let tokens = 0
  let comebackBonus = 0
  let isComeback = false

  if (eng.lastLoginDate === today) {
    return { tokens: 0, day: eng.consecutiveLogins, isComeback: false, comebackBonus: 0 }
  }

  const gap = eng.lastLoginDate ? daysBetween(eng.lastLoginDate, today) : 0

  if (gap > 3 && eng.totalLogins > 0) {
    isComeback = true
    comebackBonus = Math.min(gap * 5, 100)
    tokens += comebackBonus
  }

  if (gap === 1 || eng.lastLoginDate === '') {
    eng.consecutiveLogins = Math.min(eng.consecutiveLogins + 1, 7)
  } else if (gap > 1) {
    eng.consecutiveLogins = 1
  }

  const dayReward = LOGIN_REWARD_SCHEDULE[eng.consecutiveLogins - 1]
  if (dayReward) tokens += dayReward.tokens

  eng.lastLoginDate = today
  eng.totalLogins++
  eng.lastActivity = Date.now()
  saveEngagement(eng)

  return { tokens, day: eng.consecutiveLogins, isComeback, comebackBonus }
}

export function spinLuckyDraw(): { tokens: number; label: string } | null {
  const eng = loadEngagement()
  const today = todayStr()

  if (eng.lastLuckyDraw === today && eng.luckyDrawsToday >= 1) return null

  const totalWeight = LUCKY_DRAW_PRIZES.reduce((s, p) => s + p.weight, 0)
  let roll = Math.random() * totalWeight
  let prize = LUCKY_DRAW_PRIZES[0]
  for (const p of LUCKY_DRAW_PRIZES) {
    roll -= p.weight
    if (roll <= 0) { prize = p; break }
  }

  eng.lastLuckyDraw = today
  eng.luckyDrawsToday = (eng.lastLuckyDraw === today ? eng.luckyDrawsToday : 0) + 1
  saveEngagement(eng)

  return { tokens: prize.tokens, label: prize.label }
}

export function checkMilestones(profile: any): Array<{ id: string; label: string; tokens: number }> {
  const eng = loadEngagement()
  const newMilestones: Array<{ id: string; label: string; tokens: number }> = []

  for (const m of MILESTONES) {
    if (!eng.milestones.includes(m.id) && m.check(profile)) {
      eng.milestones.push(m.id)
      newMilestones.push({ id: m.id, label: m.label, tokens: m.tokens })
    }
  }

  if (newMilestones.length > 0) saveEngagement(eng)
  return newMilestones
}

export function getStreakProtectionAvailable(): boolean {
  const purchases = JSON.parse(localStorage.getItem('kg_purchases') || '[]')
  return purchases.includes('streak-shield')
}
