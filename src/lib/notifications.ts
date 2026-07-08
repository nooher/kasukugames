const RECORDS_KEY = 'kg_records'
const NOTIF_KEY = 'kg_notifications'

export interface GameRecord {
  gameId: string
  playerId: string
  playerName: string
  score: number
  timestamp: number
}

export interface Notification {
  id: string
  type: 'record_broken' | 'challenge' | 'achievement' | 'social' | 'reward' | 'comeback' | 'milestone'
  title: string
  message: string
  timestamp: number
  read: boolean
  icon: string
  color: string
}

export function loadRecords(): Record<string, GameRecord> {
  try {
    const d = localStorage.getItem(RECORDS_KEY)
    if (d) return JSON.parse(d)
  } catch {}
  return {}
}

function saveRecords(records: Record<string, GameRecord>) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}

export function loadNotifications(): Notification[] {
  try {
    const d = localStorage.getItem(NOTIF_KEY)
    if (d) return JSON.parse(d)
  } catch {}
  return []
}

function saveNotifications(notifs: Notification[]) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs.slice(0, 100)))
}

export function submitScore(gameId: string, gameName: string, playerId: string, playerName: string, score: number): { isNewRecord: boolean; previousHolder?: string } {
  const records = loadRecords()
  const prev = records[gameId]

  if (!prev || score > prev.score) {
    const previousHolder = prev && prev.playerId !== playerId ? prev.playerName : undefined

    records[gameId] = { gameId, playerId, playerName, score, timestamp: Date.now() }
    saveRecords(records)

    if (previousHolder) {
      addNotification({
        type: 'record_broken',
        title: 'Record broken!',
        message: `${playerName} beat your record in ${gameName} with ${score.toLocaleString()}!`,
        icon: 'trophy',
        color: '#f59e0b',
      })
    }

    return { isNewRecord: true, previousHolder }
  }

  return { isNewRecord: false }
}

export function addNotification(partial: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  const notifs = loadNotifications()
  notifs.unshift({
    ...partial,
    id: `n_${Date.now().toString(36)}`,
    timestamp: Date.now(),
    read: false,
  })
  saveNotifications(notifs)

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(partial.title, { body: partial.message, icon: '/icon-192.png' })
  }
}

export function markAllRead() {
  const notifs = loadNotifications()
  notifs.forEach(n => (n.read = true))
  saveNotifications(notifs)
}

export function markRead(id: string) {
  const notifs = loadNotifications()
  const n = notifs.find(x => x.id === id)
  if (n) n.read = true
  saveNotifications(notifs)
}

export function getUnreadCount(): number {
  return loadNotifications().filter(n => !n.read).length
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}
