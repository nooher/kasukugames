// KasukuGames floating audio player — local music, Quran, Bible, sound bath.
// No external APIs — all local/uploaded files + built-in ambient tracks.

export interface AudioTrack {
  id: string
  title: string
  artist: string
  category: 'music' | 'quran' | 'bible' | 'soundbath' | 'ambient'
  src?: string
  duration?: number
}

export const BUILT_IN_TRACKS: AudioTrack[] = [
  { id: 'rain', title: 'Mvua ya Usiku', artist: 'Ambient', category: 'ambient' },
  { id: 'ocean', title: 'Bahari Tulivu', artist: 'Ambient', category: 'ambient' },
  { id: 'forest', title: 'Msitu wa Asubuhi', artist: 'Ambient', category: 'ambient' },
  { id: 'fire', title: 'Moto wa Jioni', artist: 'Ambient', category: 'ambient' },
  { id: 'tibetan', title: 'Tibetan Singing Bowls', artist: 'Sound Bath', category: 'soundbath' },
  { id: 'crystal', title: 'Crystal Bowl Healing', artist: 'Sound Bath', category: 'soundbath' },
  { id: 'binaural', title: 'Focus Binaural 40Hz', artist: 'Sound Bath', category: 'soundbath' },
  { id: 'alfatiha', title: 'Al-Fatiha', artist: 'Quran', category: 'quran' },
  { id: 'yaseen', title: 'Surah Yasin', artist: 'Quran', category: 'quran' },
  { id: 'arrahman', title: 'Ar-Rahman', artist: 'Quran', category: 'quran' },
  { id: 'psalm23', title: 'Psalm 23', artist: 'Bible', category: 'bible' },
  { id: 'john316', title: 'John 3:16', artist: 'Bible', category: 'bible' },
  { id: 'proverbs3', title: 'Proverbs 3:5-6', artist: 'Bible', category: 'bible' },
]

export type PlayerState = {
  track: AudioTrack | null
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  repeat: boolean
  shuffle: boolean
  queue: AudioTrack[]
  queueIndex: number
}

export const initialPlayerState: PlayerState = {
  track: null,
  playing: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  repeat: false,
  shuffle: false,
  queue: [],
  queueIndex: -1,
}

export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function getLocalTracks(): AudioTrack[] {
  try {
    return JSON.parse(localStorage.getItem('kg_local_tracks') || '[]')
  } catch { return [] }
}

export function addLocalTrack(track: AudioTrack) {
  const existing = getLocalTracks()
  existing.push(track)
  localStorage.setItem('kg_local_tracks', JSON.stringify(existing))
}
