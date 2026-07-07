// KasukuGames floating audio player.
// REAL tracks: Quran (Islamic Network CDN) + Bible/Psalms/Proverbs (LibriVox,
// public domain) + singing bowls + white noise (CC0 via archive.org). Plus a
// built-in generative ambience engine (works fully offline).
// `cors: true` = safe to route through the Web-Audio EQ chain (archive.org
// sends Access-Control-Allow-Origin: *). The Quran CDN has no CORS, so those
// play on a raw element (still full quality) without EQ.

export type AudioCategory = 'music' | 'quran' | 'bible' | 'soundbath' | 'ambient' | 'gaming' | 'brainmassage' | 'study'

export interface AudioTrack {
  id: string
  title: string
  artist: string
  category: AudioCategory
  src?: string
  cors?: boolean
  duration?: number
}

const QURAN = (n: number) => `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${n}.mp3`
const IA = (id: string, file: string) => `https://archive.org/download/${id}/${file}`

export const BUILT_IN_TRACKS: AudioTrack[] = [
  // ── Real recitations — Quran (Mishary Alafasy, Islamic Network CDN) ──
  { id: 'q_fatiha', title: 'Al-Fatiha', artist: 'Quran · Mishary Alafasy', category: 'quran', src: QURAN(1) },
  { id: 'q_yaseen', title: 'Surah Ya-Sin', artist: 'Quran · Mishary Alafasy', category: 'quran', src: QURAN(36) },
  { id: 'q_rahman', title: 'Ar-Rahman', artist: 'Quran · Mishary Alafasy', category: 'quran', src: QURAN(55) },
  { id: 'q_mulk', title: 'Al-Mulk', artist: 'Quran · Mishary Alafasy', category: 'quran', src: QURAN(67) },
  { id: 'q_ikhlas', title: 'Al-Ikhlas', artist: 'Quran · Mishary Alafasy', category: 'quran', src: QURAN(112) },
  { id: 'q_falaq', title: 'Al-Falaq', artist: 'Quran · Mishary Alafasy', category: 'quran', src: QURAN(113) },
  { id: 'q_nas', title: 'An-Nas', artist: 'Quran · Mishary Alafasy', category: 'quran', src: QURAN(114) },
  // ── Real readings — Bible (LibriVox, Public Domain) ──
  { id: 'b_psalm1', title: 'Psalm 1 (KJV)', artist: 'Bible · LibriVox (PD)', category: 'bible', cors: true, src: IA('psalms_kjv_1202_librivox', 'psalms_01_kjv_64kb.mp3') },
  { id: 'b_psalm8', title: 'Psalm 8 (KJV)', artist: 'Bible · LibriVox (PD)', category: 'bible', cors: true, src: IA('psalms_kjv_1202_librivox', 'psalms_08_kjv_64kb.mp3') },
  { id: 'b_john3', title: 'John 3', artist: 'Bible · LibriVox (PD)', category: 'bible', cors: true, src: IA('the_gospel_according_to_saint_john_asv_ss_librivox', 'john_03_asv_64kb.mp3') },
  { id: 'b_prov3', title: 'Proverbs 3', artist: 'Bible · LibriVox (PD)', category: 'bible', cors: true, src: IA('proverbs_kjv_mp_librivox', 'proverbs_03_kjv_64kb.mp3') },
  // ── Real recording — Sound bath (CC0) ──
  { id: 'sb_bowls', title: 'Singing Bowls (Live)', artist: 'Sound Bath · Public Domain', category: 'soundbath', cors: true, src: IA('SingingBowlImprovisation', 'bowls_64kb.mp3') },
  // ── Real recording — Study / focus (CC0) ──
  { id: 'st_white', title: 'White Noise', artist: 'Study · Public Domain', category: 'study', src: IA('WhiteNoise_296', 'whitestatic_64kb.mp3'), cors: true },
  // ── Generative ambience engine (offline, no network) ──
  { id: 'rain', title: 'Night Rain', artist: 'Ambient Engine', category: 'ambient' },
  { id: 'ocean', title: 'Calm Ocean', artist: 'Ambient Engine', category: 'ambient' },
  { id: 'forest', title: 'Morning Forest', artist: 'Ambient Engine', category: 'ambient' },
  { id: 'fire', title: 'Evening Fire', artist: 'Ambient Engine', category: 'ambient' },
  { id: 'tibetan', title: 'Tibetan Bowls', artist: 'Sound Bath Engine', category: 'soundbath' },
  { id: 'crystal', title: 'Crystal Bowl Healing', artist: 'Sound Bath Engine', category: 'soundbath' },
  { id: 'binaural', title: 'Focus Binaural 40Hz', artist: 'Study Engine', category: 'study' },
  // Gaming music (generative)
  { id: 'game_synthwave', title: 'Synthwave Drive', artist: 'Gaming Engine', category: 'gaming' },
  { id: 'game_arcade', title: '8-Bit Arcade', artist: 'Gaming Engine', category: 'gaming' },
  { id: 'game_epic', title: 'Epic Boss Battle', artist: 'Gaming Engine', category: 'gaming' },
  { id: 'game_focus', title: 'Focus Grind', artist: 'Gaming Engine', category: 'gaming' },
  // Brain-massage sounds (generative)
  { id: 'bm_theta', title: 'Theta Calm · 6Hz', artist: 'Brain Massage Engine', category: 'brainmassage' },
  { id: 'bm_alpha', title: 'Alpha Focus · 10Hz', artist: 'Brain Massage Engine', category: 'brainmassage' },
  { id: 'bm_delta', title: 'Deep Sleep · 2Hz', artist: 'Brain Massage Engine', category: 'brainmassage' },
  { id: 'bm_isochronic', title: 'Isochronic Pulse', artist: 'Brain Massage Engine', category: 'brainmassage' },
  { id: 'bm_brown', title: 'Warm Brown Noise', artist: 'Brain Massage Engine', category: 'brainmassage' },
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
