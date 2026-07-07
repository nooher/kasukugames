import { PALETTE } from './brand'

export type RelationType =
  | 'husband' | 'wife' | 'hubby' | 'wifey' | 'partner' | 'bae'
  | 'friend' | 'bestfriend' | 'bff'
  | 'brother' | 'sister' | 'sibling'
  | 'son' | 'daughter' | 'parent'
  | 'classmate' | 'colleague' | 'teammate'

export interface Connection {
  id: string
  displayName: string
  username: string
  avatar: string
  relation: RelationType
  contactMethod: 'whatsapp' | 'instagram' | 'username'
  contactValue: string
  addedAt: number
  lastPlayed: number | null
  gamesPlayed: number
  wins: number
  losses: number
  shareProfilePic: boolean
}

export interface GameInvite {
  id: string
  fromId: string
  fromName: string
  fromAvatar: string
  fromRelation: RelationType
  gameType: string
  gameName: string
  message: string
  timestamp: number
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  data?: any
}

export const RELATION_META: Record<RelationType, { label: string; labelSw: string; color: string; inviteVerb: string; pokeVerb: string; emoji: string }> = {
  husband:   { label: 'Husband',     labelSw: 'Mume',       color: PALETTE.sapphire, inviteVerb: 'is challenging',   pokeVerb: 'is daring',         emoji: '💙' },
  wife:      { label: 'Wife',        labelSw: 'Mke',        color: PALETTE.rose,     inviteVerb: 'is poking',        pokeVerb: 'wants a quick game', emoji: '💖' },
  hubby:     { label: 'Hubby',       labelSw: 'Beb',        color: PALETTE.sapphire, inviteVerb: 'is daring',        pokeVerb: 'is up for mischief', emoji: '😏' },
  wifey:     { label: 'Wifey',       labelSw: 'Bebi',       color: PALETTE.rose,     inviteVerb: 'is teasing',       pokeVerb: 'wants to play',      emoji: '💕' },
  partner:   { label: 'Partner',     labelSw: 'Mpenzi',     color: PALETTE.violet,   inviteVerb: 'is challenging',   pokeVerb: 'wants a round',      emoji: '💜' },
  bae:       { label: 'Bae',         labelSw: 'Bae',        color: PALETTE.fuchsia,  inviteVerb: 'is teasing',       pokeVerb: 'misses you',         emoji: '🔥' },
  friend:    { label: 'Friend',      labelSw: 'Rafiki',     color: PALETTE.emerald,  inviteVerb: 'is challenging',   pokeVerb: 'wants to compete',   emoji: '🤝' },
  bestfriend:{ label: 'Best Friend', labelSw: 'Rafiki wa Moyo', color: PALETTE.teal, inviteVerb: 'is calling out',   pokeVerb: 'says prove it',      emoji: '⚡' },
  bff:       { label: 'BFF',         labelSw: 'BFF',        color: PALETTE.cyan,     inviteVerb: 'is challenging',   pokeVerb: 'double-dares you',   emoji: '✨' },
  brother:   { label: 'Brother',     labelSw: 'Kaka',       color: PALETTE.amber,    inviteVerb: 'is challenging',   pokeVerb: 'says you can\'t beat this', emoji: '💪' },
  sister:    { label: 'Sister',      labelSw: 'Dada',       color: PALETTE.coral,    inviteVerb: 'is daring',        pokeVerb: 'is waiting',         emoji: '👑' },
  sibling:   { label: 'Sibling',     labelSw: 'Ndugu',      color: PALETTE.orange,   inviteVerb: 'just beat you at', pokeVerb: 'is bored — play?',   emoji: '🎯' },
  son:       { label: 'Son',         labelSw: 'Mwana',      color: PALETTE.sapphire, inviteVerb: 'is challenging',   pokeVerb: 'wants to play',      emoji: '⭐' },
  daughter:  { label: 'Daughter',    labelSw: 'Binti',      color: PALETTE.rose,     inviteVerb: 'is challenging',   pokeVerb: 'wants quality time', emoji: '🌟' },
  parent:    { label: 'Parent',      labelSw: 'Mzazi',      color: PALETTE.gold,     inviteVerb: 'is challenging',   pokeVerb: 'wants to play',      emoji: '🏠' },
  classmate: { label: 'Classmate',   labelSw: 'Mwanafunzi Mwenzio', color: PALETTE.lime, inviteVerb: 'is challenging', pokeVerb: 'started a game', emoji: '📚' },
  colleague: { label: 'Colleague',   labelSw: 'Mwenzako',   color: PALETTE.teal,     inviteVerb: 'is challenging',   pokeVerb: 'needs a break',      emoji: '💼' },
  teammate:  { label: 'Teammate',    labelSw: 'Mchezaji Mwenzio', color: PALETTE.emerald, inviteVerb: 'is rallying', pokeVerb: 'needs your help',    emoji: '🏆' },
}

const CONNECTIONS_KEY = 'kg_connections'
const INVITES_KEY = 'kg_invites'

export function loadConnections(): Connection[] {
  try {
    const d = localStorage.getItem(CONNECTIONS_KEY)
    if (d) return JSON.parse(d)
  } catch {}
  return []
}

export function saveConnections(conns: Connection[]) {
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(conns))
}

export function addConnection(conn: Omit<Connection, 'id' | 'addedAt' | 'lastPlayed' | 'gamesPlayed' | 'wins' | 'losses'>): Connection {
  const conns = loadConnections()
  const full: Connection = {
    ...conn,
    id: `conn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    addedAt: Date.now(),
    lastPlayed: null,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
  }
  conns.push(full)
  saveConnections(conns)
  return full
}

export function removeConnection(id: string) {
  const conns = loadConnections().filter(c => c.id !== id)
  saveConnections(conns)
}

export function loadInvites(): GameInvite[] {
  try {
    const d = localStorage.getItem(INVITES_KEY)
    if (d) return JSON.parse(d)
  } catch {}
  return []
}

export function saveInvites(invites: GameInvite[]) {
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites.slice(0, 50)))
}

export function createInvite(
  from: { id: string; displayName: string; avatar: string },
  conn: Connection,
  gameType: string,
  gameName: string,
  data?: any,
): GameInvite {
  const invites = loadInvites()
  const invite: GameInvite = {
    id: `inv_${Date.now().toString(36)}`,
    fromId: from.id,
    fromName: from.displayName,
    fromAvatar: from.avatar,
    fromRelation: conn.relation,
    gameType,
    gameName,
    message: generateInviteMessage(from.displayName, conn, gameType, gameName),
    timestamp: Date.now(),
    status: 'pending',
    data,
  }
  invites.unshift(invite)
  saveInvites(invites)
  return invite
}

export function generateInviteMessage(_fromName: string, conn: Connection, gameType: string, gameName: string): string {
  const meta = RELATION_META[conn.relation]
  const isRomantic = ['husband', 'wife', 'hubby', 'wifey', 'partner', 'bae'].includes(conn.relation)
  const isSibling = ['brother', 'sister', 'sibling'].includes(conn.relation)

  if (gameType === 'truth-or-dare') {
    if (isRomantic) return `Your ${meta.label.toLowerCase()} ${meta.pokeVerb}... Truth or Dare? 😏🔥`
    if (isSibling) return `Your ${meta.label.toLowerCase()} dares you to play Truth or Dare. Think you can handle it? 💪`
    return `Your ${meta.label.toLowerCase()} wants to play Truth or Dare! In the mood? 🎯`
  }
  if (gameType === 'never-have-i-ever') {
    if (isRomantic) return `Your ${meta.label.toLowerCase()} started Never Have I Ever... secrets coming out? 👀💕`
    return `Your ${meta.label.toLowerCase()} started Never Have I Ever. How well do you really know each other? 🤔`
  }
  if (gameType === 'guess-what') {
    if (isRomantic) return `Your ${meta.label.toLowerCase()} is testing how well you know them. Guess What? 💭💖`
    return `Your ${meta.label.toLowerCase()} is testing you — Guess What? Think you know them? 🧠`
  }
  if (gameType === 'record-broken') {
    if (isSibling) return `Your ${meta.label.toLowerCase()} just DESTROYED your record in ${gameName}! You taking that? 😤`
    if (isRomantic) return `Your ${meta.label.toLowerCase()} just broke your ${gameName} record! Rematch time? 💪`
    return `Your ${meta.label.toLowerCase()} just broke your record in ${gameName}! Can you reclaim it? 🏆`
  }
  if (gameType === 'draft-chase') {
    if (isRomantic) return `Your ${meta.label.toLowerCase()} ${meta.inviteVerb} you to Draft & Chase. Ready to be caught? 🏃‍♂️💨`
    return `Your ${meta.label.toLowerCase()} started a Draft & Chase. Can you keep up? ⚡`
  }
  if (isRomantic) return `Your ${meta.label.toLowerCase()} ${meta.pokeVerb}. In a mood to play ${gameName}? ${meta.emoji}`
  if (isSibling) return `Your ${meta.label.toLowerCase()} ${meta.pokeVerb} — ${gameName}. You in? ${meta.emoji}`
  return `Your ${meta.label.toLowerCase()} ${meta.inviteVerb} you to ${gameName}! ${meta.emoji}`
}

export function generateWhatsAppInvite(fromName: string, conn: Connection, gameType: string, gameName: string): string {
  const msg = generateInviteMessage(fromName, conn, gameType, gameName)
  const link = `https://games.kasuku.tz/play?invite=${gameType}&from=${encodeURIComponent(fromName)}`
  return `https://wa.me/${conn.contactValue.replace(/\D/g, '')}?text=${encodeURIComponent(`${msg}\n\n🎮 ${link}`)}`
}

export function generateInstagramInvite(fromName: string, conn: Connection, gameType: string, gameName: string): string {
  const msg = generateInviteMessage(fromName, conn, gameType, gameName)
  return `https://ig.me/m/${conn.contactValue.replace('@', '')}?text=${encodeURIComponent(msg)}`
}

export const PARTY_GAMES = [
  {
    id: 'truth-or-dare',
    name: 'Truth or Dare',
    nameSw: 'Ukweli au Changamoto',
    description: 'Take turns choosing truth or dare — spicy, fun, or mild',
    minPlayers: 2,
    maxPlayers: 8,
    icon: '🔥',
    color: PALETTE.rose,
    categories: ['mild', 'spicy', 'funny', 'deep'] as const,
  },
  {
    id: 'never-have-i-ever',
    name: 'Never Have I Ever',
    nameSw: 'Sijawahi',
    description: 'Discover what your friends have (or haven\'t) done',
    minPlayers: 2,
    maxPlayers: 10,
    icon: '🙈',
    color: PALETTE.violet,
    categories: ['innocent', 'adventurous', 'embarrassing', 'romantic'] as const,
  },
  {
    id: 'guess-what',
    name: 'Guess What',
    nameSw: 'Nadhani Nini',
    description: 'How well do you really know each other?',
    minPlayers: 2,
    maxPlayers: 4,
    icon: '🧠',
    color: PALETTE.sapphire,
    categories: ['preferences', 'memories', 'personality', 'secrets'] as const,
  },
  {
    id: 'draft-chase',
    name: 'Draft & Chase',
    nameSw: 'Fukuza',
    description: 'Take turns setting scores — can they catch you?',
    minPlayers: 2,
    maxPlayers: 2,
    icon: '⚡',
    color: PALETTE.amber,
    categories: ['speed', 'memory', 'logic', 'mixed'] as const,
  },
]
