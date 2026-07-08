export interface Team {
  id: string
  name: string
  tag: string
  motto: string
  color: string
  founderId: string
  memberIds: string[]
  totalXP: number
  avgRank: string
  wins: number
  losses: number
  createdAt: number
}

export interface FriendRequest {
  id: string
  fromId: string
  fromUsername: string
  toId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: number
}

export interface CoupleChallenge {
  id: string
  gameId: string
  player1Id: string
  player2Id: string
  player1Score: number | null
  player2Score: number | null
  status: 'waiting' | 'active' | 'complete'
  winnerId: string | null
  createdAt: number
}

export interface TeamChallenge {
  id: string
  gameId: string
  team1Id: string
  team2Id: string
  team1Scores: Record<string, number>
  team2Scores: Record<string, number>
  status: 'open' | 'active' | 'complete'
  winnerId: string | null
  createdAt: number
}

export type CompetitionMode = 'solo' | 'couple' | 'friends' | 'team'

export interface LeaderboardEntry {
  playerId: string
  username: string
  displayName: string
  avatar: string
  rank: string
  level: number
  score: number
  teamTag?: string
  muhuri?: string
}

export interface LeaderboardCategory {
  id: string
  label: string
  description: string
  icon: string
  color: string
}

export const LEADERBOARD_CATEGORIES: LeaderboardCategory[] = [
  { id: 'overall', label: 'Overall', description: 'Total cognitive performance', icon: 'trophy', color: '#fbbf24' },
  { id: 'fastest', label: 'Fastest Thinker', description: 'Processing speed champions', icon: 'zap', color: '#f59e0b' },
  { id: 'smartest', label: 'Highest IQ', description: 'Pattern & reasoning masters', icon: 'brain', color: '#3a86ff' },
  { id: 'creative', label: 'Most Creative', description: 'Divergent thinking leaders', icon: 'lightbulb', color: '#e879f9' },
  { id: 'resilient', label: 'Most Resilient', description: 'Mental endurance champions', icon: 'shield', color: '#00b4d8' },
  { id: 'streaker', label: 'Longest Streak', description: 'Consistency kings', icon: 'flame', color: '#f43f5e' },
  { id: 'social', label: 'Best Teammate', description: 'Team contribution leaders', icon: 'users', color: '#f97316' },
  { id: 'negotiator', label: 'Best Debater', description: 'Argumentation champions', icon: 'message-square', color: '#7b2ff7' },
]

const TEAMS_KEY = 'kg_teams'

export function loadTeams(): Team[] {
  try { return JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]') }
  catch { return [] }
}

export function saveTeams(teams: Team[]) {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams))
}

export function createTeam(name: string, tag: string, motto: string, color: string, founderId: string): Team {
  const team: Team = {
    id: `t_${Date.now().toString(36)}`,
    name, tag, motto, color, founderId,
    memberIds: [founderId],
    totalXP: 0, avgRank: 'bronze',
    wins: 0, losses: 0,
    createdAt: Date.now(),
  }
  const teams = loadTeams()
  teams.push(team)
  saveTeams(teams)
  return team
}

export function getTeamById(teamId: string): Team | null {
  return loadTeams().find(t => t.id === teamId) || null
}

export function generateDemoLeaderboard(category: string): LeaderboardEntry[] {
  const names = [
    { username: 'mtaalamu', displayName: 'BrainAce', avatar: '🧠', muhuri: 'verified' },
    { username: 'haraka_x', displayName: 'Quick Spark', avatar: '⚡', muhuri: 'creator' },
    { username: 'mwanafunzi', displayName: 'Scholar', avatar: '📚' },
    { username: 'jenga_pro', displayName: 'Builder Pro', avatar: '🏗️' },
    { username: 'kimbunga', displayName: 'Storm Mind', avatar: '🌪️', muhuri: 'verified' },
    { username: 'msomi_tz', displayName: 'The Graduate', avatar: '🎓' },
    { username: 'fikra_kali', displayName: 'Sharp Idea', avatar: '💡', muhuri: 'creator' },
    { username: 'nguvu_mental', displayName: 'Mental Muscle', avatar: '💪' },
    { username: 'akili_sharp', displayName: 'Sharp Wit', avatar: '🔬' },
    { username: 'bongo_brain', displayName: 'Genius Gene', avatar: '🧬' },
    { username: 'champion_tz', displayName: 'Champion', avatar: '🏆', muhuri: 'admin' },
    { username: 'mfalme', displayName: 'The Legend', avatar: '👑', muhuri: 'verified' },
    { username: 'daktari_akili', displayName: 'Sage Mind', avatar: '🩺' },
    { username: 'profesa', displayName: 'Professor', avatar: '🎯' },
    { username: 'mchezaji1', displayName: 'Gamer X', avatar: '🎮' },
  ]
  const ranks: string[] = ['legend', 'master', 'diamond', 'diamond', 'platinum', 'platinum', 'gold', 'gold', 'gold', 'silver', 'silver', 'silver', 'bronze', 'bronze', 'bronze']
  const levels = [47, 42, 38, 35, 31, 28, 25, 22, 19, 16, 14, 12, 10, 8, 5]
  const baseScores: Record<string, number[]> = {
    overall: [128400, 115200, 98700, 87300, 76500, 68200, 59100, 51400, 44800, 38200, 32100, 27500, 22800, 18400, 14200],
    fastest: [9850, 9420, 8800, 8200, 7600, 7100, 6500, 5900, 5200, 4700, 4100, 3600, 3100, 2700, 2200],
    smartest: [14200, 13100, 12000, 10800, 9700, 8800, 7900, 7100, 6300, 5600, 5000, 4400, 3800, 3200, 2700],
    creative: [8800, 8100, 7500, 6800, 6200, 5700, 5100, 4600, 4100, 3600, 3200, 2800, 2400, 2000, 1700],
    resilient: [12500, 11400, 10300, 9400, 8500, 7700, 6900, 6200, 5500, 4900, 4300, 3800, 3300, 2800, 2400],
    streaker: [365, 298, 247, 203, 178, 152, 128, 104, 87, 72, 58, 45, 33, 21, 14],
    social: [9200, 8400, 7600, 6900, 6200, 5600, 5000, 4400, 3900, 3400, 2900, 2500, 2100, 1800, 1400],
    negotiator: [7800, 7100, 6500, 5900, 5300, 4800, 4300, 3800, 3400, 3000, 2600, 2300, 1900, 1600, 1300],
  }
  const scores = baseScores[category] || baseScores.overall
  const teamTags = ['AKL', 'BNG', 'TZM', '', 'FKR', '', 'MSM', '', 'KLI', '', 'BNW', '', 'DSM', '', 'DES']

  return names.map((n, i) => ({
    playerId: `demo_${i}`,
    username: n.username,
    displayName: n.displayName,
    avatar: n.avatar,
    rank: ranks[i],
    level: levels[i],
    score: scores[i],
    teamTag: teamTags[i] || undefined,
    muhuri: (n as { muhuri?: string }).muhuri || undefined,
  }))
}
