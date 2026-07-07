// Synthesized sound effects + haptic feedback for KasukuGames.
// All sounds generated via Web Audio API — zero external files.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx || ctx.state === 'closed') {
    ctx = new AudioContext()
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
  return ctx
}

function vibrate(pattern: number | number[]) {
  try {
    navigator?.vibrate?.(pattern)
  } catch { /* unsupported */ }
}

// --- Core synth helpers ---

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.15, attack = 0.01, release = 0.1) {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, ac.currentTime)
  gain.gain.linearRampToValueAtTime(vol, ac.currentTime + attack)
  gain.gain.linearRampToValueAtTime(0, ac.currentTime + duration - release)
  osc.connect(gain).connect(ac.destination)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + duration)
}

function playNoise(duration: number, vol = 0.04) {
  const ac = getCtx()
  const bufferSize = ac.sampleRate * duration
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5
  }
  const src = ac.createBufferSource()
  src.buffer = buffer
  const gain = ac.createGain()
  const filter = ac.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 6000
  gain.gain.setValueAtTime(vol, ac.currentTime)
  gain.gain.linearRampToValueAtTime(0, ac.currentTime + duration)
  src.connect(filter).connect(gain).connect(ac.destination)
  src.start()
}

// --- Launch screen sounds ---

export function sfxLetterDrop() {
  const freq = 200 + Math.random() * 400
  playTone(freq, 0.06, 'sine', 0.03, 0.005, 0.04)
}

export function sfxLetterSettle() {
  playTone(880, 0.12, 'sine', 0.08, 0.005, 0.08)
  playTone(1320, 0.15, 'triangle', 0.05, 0.02, 0.1)
  vibrate(15)
}

export function sfxShapesAppear() {
  const ac = getCtx()
  const now = ac.currentTime
  // Rising crystalline chord
  const freqs = [523, 659, 784] // C5, E5, G5
  freqs.forEach((f, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = f
    gain.gain.setValueAtTime(0, now + i * 0.12)
    gain.gain.linearRampToValueAtTime(0.08, now + i * 0.12 + 0.05)
    gain.gain.linearRampToValueAtTime(0.03, now + i * 0.12 + 0.4)
    gain.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.8)
    osc.connect(gain).connect(ac.destination)
    osc.start(now + i * 0.12)
    osc.stop(now + i * 0.12 + 0.8)
  })
  vibrate([20, 80, 20, 80, 30])
}

export function sfxLaunchComplete() {
  playTone(440, 0.5, 'sine', 0.06, 0.01, 0.3)
  playNoise(0.15, 0.02)
  vibrate([10, 40, 10])
}

// --- Game interaction sounds ---

export function sfxTap() {
  playTone(600, 0.05, 'sine', 0.08, 0.003, 0.03)
  vibrate(8)
}

export function sfxCorrect() {
  const ac = getCtx()
  const now = ac.currentTime
  // Two-note rising chime
  ;[523, 784].forEach((f, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = f
    gain.gain.setValueAtTime(0, now + i * 0.08)
    gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02)
    gain.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.2)
    osc.connect(gain).connect(ac.destination)
    osc.start(now + i * 0.08)
    osc.stop(now + i * 0.08 + 0.2)
  })
  vibrate([12, 30, 12])
}

export function sfxWrong() {
  const ac = getCtx()
  const now = ac.currentTime
  // Low buzz
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sawtooth'
  osc.frequency.value = 150
  gain.gain.setValueAtTime(0.1, now)
  gain.gain.linearRampToValueAtTime(0, now + 0.25)
  osc.connect(gain).connect(ac.destination)
  osc.start(now)
  osc.stop(now + 0.25)
  vibrate([50, 30, 50])
}

export function sfxLevelUp() {
  const ac = getCtx()
  const now = ac.currentTime
  // Rising arpeggio
  ;[440, 554, 659, 880].forEach((f, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'triangle'
    osc.frequency.value = f
    gain.gain.setValueAtTime(0, now + i * 0.07)
    gain.gain.linearRampToValueAtTime(0.1, now + i * 0.07 + 0.02)
    gain.gain.linearRampToValueAtTime(0, now + i * 0.07 + 0.25)
    osc.connect(gain).connect(ac.destination)
    osc.start(now + i * 0.07)
    osc.stop(now + i * 0.07 + 0.25)
  })
  vibrate([15, 50, 15, 50, 30])
}

export function sfxGameOver() {
  const ac = getCtx()
  const now = ac.currentTime
  // Descending notes
  ;[440, 370, 311, 261].forEach((f, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    gain.gain.setValueAtTime(0, now + i * 0.15)
    gain.gain.linearRampToValueAtTime(0.08, now + i * 0.15 + 0.02)
    gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.3)
    osc.connect(gain).connect(ac.destination)
    osc.start(now + i * 0.15)
    osc.stop(now + i * 0.15 + 0.3)
  })
  vibrate([80, 60, 120])
}

export function sfxCountdown() {
  playTone(440, 0.1, 'square', 0.06, 0.005, 0.06)
  vibrate(15)
}

export function sfxCountdownGo() {
  playTone(880, 0.2, 'triangle', 0.1, 0.01, 0.12)
  vibrate([20, 30, 40])
}

export function sfxScore() {
  playTone(1046, 0.08, 'sine', 0.06, 0.005, 0.05)
  vibrate(5)
}

export function sfxCombo(streak: number) {
  const base = 440 + streak * 50
  playTone(base, 0.1, 'triangle', 0.08 + streak * 0.01, 0.005, 0.06)
  playTone(base * 1.5, 0.12, 'sine', 0.04, 0.01, 0.08)
  vibrate(10 + streak * 3)
}

export function sfxClick() {
  playNoise(0.03, 0.06)
  vibrate(5)
}

export function sfxReveal() {
  playTone(660, 0.15, 'sine', 0.06, 0.01, 0.1)
  playTone(990, 0.2, 'triangle', 0.03, 0.03, 0.12)
}

export function sfxTimer() {
  playTone(1000, 0.04, 'square', 0.04, 0.003, 0.02)
}
