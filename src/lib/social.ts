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

// Demo/mock leaderboard removed — the board shows only real players from the
// live kg_scores table (see src/lib/leaderboard.ts).
