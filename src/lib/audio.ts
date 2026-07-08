// KasukuGames floating audio player.
// REAL tracks: Quran (Islamic Network CDN) + Bible/Psalms/Proverbs (LibriVox,
// public domain) + singing bowls + white noise (CC0 via archive.org). Plus a
// built-in generative ambience engine (works fully offline).
// `cors: true` = safe to route through the Web-Audio EQ chain (archive.org
// sends Access-Control-Allow-Origin: *). The Quran CDN has no CORS, so those
// play on a raw element (still full quality) without EQ.

export type AudioCategory = 'music' | 'quran' | 'bible' | 'soundbath' | 'ambient' | 'gaming' | 'brainmassage' | 'study' | 'audiobook'

export interface AudioTrack {
  id: string
  title: string
  artist: string
  category: AudioCategory
  src?: string
  cors?: boolean
  duration?: number
}

const QURAN = (n: number, edition = 'ar.alafasy') => `https://cdn.islamic.network/quran/audio-surah/128/${edition}/${n}.mp3`
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
  // Abdul Basit Abdus Samad (Murattal)
  { id: 'q_ab_fatiha', title: 'Al-Fatiha', artist: 'Quran · Abdul Basit (Murattal)', category: 'quran', src: QURAN(1, 'ar.abdulbasitmurattal') },
  { id: 'q_ab_yaseen', title: 'Surah Ya-Sin', artist: 'Quran · Abdul Basit (Murattal)', category: 'quran', src: QURAN(36, 'ar.abdulbasitmurattal') },
  { id: 'q_ab_rahman', title: 'Ar-Rahman', artist: 'Quran · Abdul Basit (Murattal)', category: 'quran', src: QURAN(55, 'ar.abdulbasitmurattal') },
  { id: 'q_ab_mulk', title: 'Al-Mulk', artist: 'Quran · Abdul Basit (Murattal)', category: 'quran', src: QURAN(67, 'ar.abdulbasitmurattal') },
  // Abdul Basit (Mujawwad — melodic)
  { id: 'q_abm_fatiha', title: 'Al-Fatiha', artist: 'Quran · Abdul Basit (Mujawwad)', category: 'quran', src: QURAN(1, 'ar.abdulbasitmujawwad') },
  { id: 'q_abm_rahman', title: 'Ar-Rahman', artist: 'Quran · Abdul Basit (Mujawwad)', category: 'quran', src: QURAN(55, 'ar.abdulbasitmujawwad') },
  // Abdullah Basfar
  { id: 'q_bf_fatiha', title: 'Al-Fatiha', artist: 'Quran · Abdullah Basfar', category: 'quran', src: QURAN(1, 'ar.abdullahbasfar') },
  { id: 'q_bf_yaseen', title: 'Surah Ya-Sin', artist: 'Quran · Abdullah Basfar', category: 'quran', src: QURAN(36, 'ar.abdullahbasfar') },
  { id: 'q_bf_kahf', title: 'Al-Kahf', artist: 'Quran · Abdullah Basfar', category: 'quran', src: QURAN(18, 'ar.abdullahbasfar') },
  { id: 'q_bf_waqiah', title: 'Al-Waqiah', artist: 'Quran · Abdullah Basfar', category: 'quran', src: QURAN(56, 'ar.abdullahbasfar') },
  // ── Real readings — Bible (LibriVox, Public Domain) ──
  { id: 'b_psalm1', title: 'Psalm 1 (KJV)', artist: 'Bible · LibriVox (PD)', category: 'bible', cors: true, src: IA('psalms_kjv_1202_librivox', 'psalms_01_kjv_64kb.mp3') },
  { id: 'b_psalm8', title: 'Psalm 8 (KJV)', artist: 'Bible · LibriVox (PD)', category: 'bible', cors: true, src: IA('psalms_kjv_1202_librivox', 'psalms_08_kjv_64kb.mp3') },
  { id: 'b_john3', title: 'John 3', artist: 'Bible · LibriVox (PD)', category: 'bible', cors: true, src: IA('the_gospel_according_to_saint_john_asv_ss_librivox', 'john_03_asv_64kb.mp3') },
  { id: 'b_prov3', title: 'Proverbs 3', artist: 'Bible · LibriVox (PD)', category: 'bible', cors: true, src: IA('proverbs_kjv_mp_librivox', 'proverbs_03_kjv_64kb.mp3') },
  // ── Real recording — Sound bath (CC0) ──
  { id: 'sb_bowls', title: 'Singing Bowls (Live)', artist: 'Sound Bath · Public Domain', category: 'soundbath', cors: true, src: IA('SingingBowlImprovisation', 'bowls_64kb.mp3') },
  // ── Real recording — Study / focus (CC0) ──
  { id: 'st_white', title: 'White Noise', artist: 'Study · Public Domain', category: 'study', src: IA('WhiteNoise_296', 'whitestatic_64kb.mp3'), cors: true },
  // ── Audiobooks — real, from the Kasuku library (founder preview + public domain) ──
  { id: 'ab_silt', title: 'SILT · Chapter 1', artist: 'Audiobook · Ally A. Nooher (preview)', category: 'audiobook', cors: true, src: IA('ksk-zfhj9ut-s1', 'ch-01.mp3') },
  { id: 'ab_equiano1', title: 'Equiano · Chapter 1', artist: 'Audiobook · Olaudah Equiano (PD)', category: 'audiobook', cors: true, src: IA('interestingnarrative_librivox', 'interestingnarrative_01_equiano.mp3') },
  { id: 'ab_equiano2', title: 'Equiano · Chapter 2', artist: 'Audiobook · Olaudah Equiano (PD)', category: 'audiobook', cors: true, src: IA('interestingnarrative_librivox', 'interestingnarrative_02_equiano.mp3') },
  { id: 'ab_12years', title: 'Twelve Years a Slave · Ch 1', artist: 'Audiobook · Solomon Northup (PD)', category: 'audiobook', cors: true, src: IA('12yearsaslave_1303_librivox', 'twelveyearsaslave_01_northup.mp3') },
  { id: 'ab_slavegirl', title: 'Life of a Slave Girl · Ch 1', artist: 'Audiobook · Harriet Jacobs (PD)', category: 'audiobook', cors: true, src: IA('incidents_life_slave_girl_0806_librivox', 'incidentsslavegirl_01_jacobs.mp3') },
  { id: 'ab_negrolit', title: 'The Negro in Literature · Ch 1', artist: 'Audiobook · Benjamin Brawley (PD)', category: 'audiobook', cors: true, src: IA('negroinliterature_2102_librivox', 'negroinliterature_01_brawley.mp3') },
  // ── Real recordings — bundled & self-hosted (offline, mp3, EQ-ready) ──
  { id: 'nat_ocean', title: 'Ocean Waves', artist: 'Nature · Field Recording', category: 'ambient', src: '/sounds/ocean.mp3', cors: true },
  { id: 'nat_river', title: 'River', artist: 'Nature · Field Recording', category: 'ambient', src: '/sounds/river.mp3', cors: true },
  { id: 'nat_stream', title: 'Mountain Stream', artist: 'Nature · Field Recording', category: 'ambient', src: '/sounds/stream.mp3', cors: true },
  { id: 'nat_forest', title: 'Forest Birds', artist: 'Nature · Field Recording', category: 'ambient', src: '/sounds/forest.mp3', cors: true },
  { id: 'nat_fire', title: 'Fireplace', artist: 'Nature · Field Recording', category: 'ambient', src: '/sounds/fire.mp3', cors: true },
  { id: 'sb_tibetan_r', title: 'Tibetan Bowl', artist: 'Sound Bath', category: 'soundbath', src: '/sounds/bowl.mp3', cors: true },
  { id: 'sb_handpan', title: 'Handpan', artist: 'Sound Bath', category: 'soundbath', src: '/sounds/handpan.mp3', cors: true },
  { id: 'nat_kalobela', title: 'Kalobela Beach', artist: 'Nature · Bukoba (Public Domain)', category: 'ambient', src: '/sounds/kalobela.mp3', cors: true },
  // ── Generative ambience engine (offline, no network) ──
  { id: 'rain', title: 'Night Rain', artist: 'Ambient Engine', category: 'ambient' },
  { id: 'tibetan', title: 'Tibetan Bowls (Engine)', artist: 'Sound Bath Engine', category: 'soundbath' },
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
