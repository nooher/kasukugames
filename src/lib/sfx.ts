// Cinematic sound engine for KasukuGames — Netflix/HBO-grade synthesized audio.
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

// --- Reverb / convolver ---

let reverbNode: ConvolverNode | null = null

function getReverb(): ConvolverNode {
  const ac = getCtx()
  if (reverbNode) return reverbNode
  const len = ac.sampleRate * 2.5
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      const t = i / ac.sampleRate
      d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 2.8) * 0.4
    }
  }
  reverbNode = ac.createConvolver()
  reverbNode.buffer = buf
  return reverbNode
}

// --- Core cinematic synth helpers ---

function createGain(ac: AudioContext, vol: number, t: number): GainNode {
  const g = ac.createGain()
  g.gain.setValueAtTime(vol, t)
  return g
}

function pad(freq: number, duration: number, vol = 0.04, detune = 6) {
  const ac = getCtx()
  const now = ac.currentTime
  const mix = createGain(ac, 0, now)
  mix.gain.linearRampToValueAtTime(vol, now + duration * 0.3)
  mix.gain.setValueAtTime(vol, now + duration * 0.6)
  mix.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  const reverb = getReverb()
  const dry = createGain(ac, 0.6, now)
  const wet = createGain(ac, 0.4, now)

  mix.connect(dry).connect(ac.destination)
  mix.connect(wet).connect(reverb).connect(ac.destination)

  for (let d = -detune; d <= detune; d += detune) {
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.detune.value = d + (Math.random() - 0.5) * 2
    osc.connect(mix)
    osc.start(now)
    osc.stop(now + duration)
  }
}

function cinematicTone(freq: number, duration: number, opts: {
  type?: OscillatorType
  vol?: number
  attack?: number
  decay?: number
  sustain?: number
  release?: number
  reverb?: number
  filter?: number
  detune?: number
} = {}) {
  const ac = getCtx()
  const now = ac.currentTime
  const {
    type = 'sine',
    vol = 0.12,
    attack = 0.02,
    decay = 0.1,
    sustain = 0.7,
    release = duration * 0.4,
    reverb: reverbMix = 0.3,
    filter: filterFreq = 0,
    detune: detuneAmt = 0,
  } = opts

  const master = createGain(ac, 0, now)
  master.gain.linearRampToValueAtTime(vol, now + attack)
  master.gain.linearRampToValueAtTime(vol * sustain, now + attack + decay)
  master.gain.setValueAtTime(vol * sustain, now + duration - release)
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  let dest: AudioNode = master
  if (filterFreq > 0) {
    const filt = ac.createBiquadFilter()
    filt.type = 'lowpass'
    filt.frequency.value = filterFreq
    filt.Q.value = 1.5
    master.connect(filt)
    dest = filt
  }

  const dry = createGain(ac, 1 - reverbMix, now)
  const wet = createGain(ac, reverbMix, now)
  dest.connect(dry).connect(ac.destination)
  dest.connect(wet).connect(getReverb()).connect(ac.destination)

  const osc = ac.createOscillator()
  osc.type = type
  osc.frequency.value = freq
  osc.detune.value = detuneAmt
  osc.connect(master)
  osc.start(now)
  osc.stop(now + duration + 0.1)
}

function subBass(freq: number, duration: number, vol = 0.15) {
  const ac = getCtx()
  const now = ac.currentTime
  const osc = ac.createOscillator()
  const gain = createGain(ac, 0, now)
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.linearRampToValueAtTime(vol, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(now)
  osc.stop(now + duration)
}

function atmosphericNoise(duration: number, vol = 0.02, highcut = 2000) {
  const ac = getCtx()
  const now = ac.currentTime
  const bufferSize = Math.floor(ac.sampleRate * duration)
  const buffer = ac.createBuffer(2, bufferSize, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1)
    }
  }
  const src = ac.createBufferSource()
  src.buffer = buffer
  const gain = createGain(ac, 0, now)
  gain.gain.linearRampToValueAtTime(vol, now + duration * 0.3)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = highcut
  lp.Q.value = 0.5
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 80
  src.connect(hp).connect(lp).connect(gain)
  const wet = createGain(ac, 0.5, now)
  gain.connect(wet).connect(getReverb()).connect(ac.destination)
  const dry = createGain(ac, 0.5, now)
  gain.connect(dry).connect(ac.destination)
  src.start(now)
  src.stop(now + duration)
}

function fmBell(carrier: number, ratio: number, index: number, duration: number, vol = 0.08) {
  const ac = getCtx()
  const now = ac.currentTime
  const modFreq = carrier * ratio
  const mod = ac.createOscillator()
  const modGain = createGain(ac, carrier * index, now)
  modGain.gain.exponentialRampToValueAtTime(1, now + duration)
  mod.frequency.value = modFreq
  mod.connect(modGain)

  const car = ac.createOscillator()
  car.frequency.value = carrier
  modGain.connect(car.frequency)

  const env = createGain(ac, 0, now)
  env.gain.linearRampToValueAtTime(vol, now + 0.005)
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  const wet = createGain(ac, 0.35, now)
  env.connect(wet).connect(getReverb()).connect(ac.destination)
  const dry = createGain(ac, 0.65, now)
  env.connect(dry).connect(ac.destination)

  car.connect(env)
  mod.start(now)
  car.start(now)
  mod.stop(now + duration)
  car.stop(now + duration)
}

// --- Launch screen sounds ---

export function sfxLetterDrop() {
  const ac = getCtx()
  const now = ac.currentTime
  const freq = 60 + Math.random() * 40
  const osc = ac.createOscillator()
  const gain = createGain(ac, 0, now)
  osc.type = 'sine'
  osc.frequency.value = freq
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.15)
  gain.gain.linearRampToValueAtTime(0.03, now + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 400
  osc.connect(gain).connect(lp).connect(ac.destination)
  osc.start(now)
  osc.stop(now + 0.2)
}

export function sfxLetterSettle() {
  const ac = getCtx()
  const now = ac.currentTime
  const chord = [220, 277, 330, 440]
  chord.forEach((f, i) => {
    const osc = ac.createOscillator()
    const gain = createGain(ac, 0, now)
    osc.type = 'sine'
    osc.frequency.value = f
    const onset = i * 0.06
    gain.gain.setValueAtTime(0, now + onset)
    gain.gain.linearRampToValueAtTime(0.06, now + onset + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + onset + 1.2)
    const wet = createGain(ac, 0.4, now)
    osc.connect(gain)
    gain.connect(wet).connect(getReverb()).connect(ac.destination)
    const dry = createGain(ac, 0.6, now)
    gain.connect(dry).connect(ac.destination)
    osc.start(now + onset)
    osc.stop(now + onset + 1.5)
  })
  pad(110, 2.5, 0.025)
  vibrate(20)
}

export function sfxShapesAppear() {
  const ac = getCtx()
  const now = ac.currentTime

  subBass(55, 3, 0.1)
  atmosphericNoise(4, 0.015, 1200)
  pad(165, 4, 0.03, 4)

  const sweep = ac.createOscillator()
  const sweepGain = createGain(ac, 0, now)
  sweep.type = 'sine'
  sweep.frequency.setValueAtTime(80, now)
  sweep.frequency.exponentialRampToValueAtTime(400, now + 2.5)
  sweepGain.gain.linearRampToValueAtTime(0.04, now + 0.5)
  sweepGain.gain.setValueAtTime(0.04, now + 1.5)
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 3)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(200, now)
  lp.frequency.exponentialRampToValueAtTime(2000, now + 2.5)
  sweep.connect(sweepGain).connect(lp)
  const wet = createGain(ac, 0.4, now)
  lp.connect(wet).connect(getReverb()).connect(ac.destination)
  const dry = createGain(ac, 0.6, now)
  lp.connect(dry).connect(ac.destination)
  sweep.start(now)
  sweep.stop(now + 3.5)

  fmBell(880, 2.01, 1.5, 3, 0.04)
  setTimeout(() => fmBell(1108, 3.01, 1, 2.5, 0.03), 400)
  setTimeout(() => fmBell(1320, 1.41, 2, 2, 0.03), 800)

  vibrate([20, 100, 15, 100, 25])
}

export function sfxLaunchComplete() {
  const ac = getCtx()
  const now = ac.currentTime

  subBass(45, 1.8, 0.18)

  const hit = [110, 165, 220, 330]
  hit.forEach(f => {
    const osc = ac.createOscillator()
    const gain = createGain(ac, 0, now)
    osc.type = 'sine'
    osc.frequency.value = f
    gain.gain.linearRampToValueAtTime(0.1, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2)
    const wet = createGain(ac, 0.5, now)
    osc.connect(gain)
    gain.connect(wet).connect(getReverb()).connect(ac.destination)
    const dry = createGain(ac, 0.5, now)
    gain.connect(dry).connect(ac.destination)
    osc.start(now)
    osc.stop(now + 2.5)
  })

  atmosphericNoise(2, 0.01, 800)

  fmBell(660, 1.41, 1, 2.5, 0.05)

  vibrate([15, 50, 10])
}

// --- Game interaction sounds ---

export function sfxTap() {
  fmBell(1200, 3.5, 0.5, 0.12, 0.05)
  vibrate(8)
}

export function sfxCorrect() {
  const ac = getCtx()
  const now = ac.currentTime
  const notes = [440, 554, 659]
  notes.forEach((f, i) => {
    const osc = ac.createOscillator()
    const gain = createGain(ac, 0, now + i * 0.06)
    osc.type = 'sine'
    osc.frequency.value = f
    gain.gain.linearRampToValueAtTime(0.08, now + i * 0.06 + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.5)

    const osc2 = ac.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = f * 2.01
    const g2 = createGain(ac, 0, now + i * 0.06)
    g2.gain.linearRampToValueAtTime(0.02, now + i * 0.06 + 0.01)
    g2.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.3)

    const wet = createGain(ac, 0.25, now)
    const mix = createGain(ac, 1, now)
    osc.connect(gain).connect(mix)
    osc2.connect(g2).connect(mix)
    mix.connect(wet).connect(getReverb()).connect(ac.destination)
    const dry = createGain(ac, 0.75, now)
    mix.connect(dry).connect(ac.destination)

    osc.start(now + i * 0.06)
    osc.stop(now + i * 0.06 + 0.6)
    osc2.start(now + i * 0.06)
    osc2.stop(now + i * 0.06 + 0.4)
  })
  vibrate([10, 25, 10])
}

export function sfxWrong() {
  const ac = getCtx()
  const now = ac.currentTime
  const osc = ac.createOscillator()
  const gain = createGain(ac, 0, now)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, now)
  osc.frequency.exponentialRampToValueAtTime(100, now + 0.4)
  gain.gain.linearRampToValueAtTime(0.08, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 600
  osc.connect(gain).connect(lp).connect(ac.destination)
  osc.start(now)
  osc.stop(now + 0.6)

  subBass(50, 0.3, 0.06)
  vibrate([40, 25, 40])
}

export function sfxLevelUp() {
  const ac = getCtx()
  const now = ac.currentTime
  const chord = [220, 277, 330, 440, 554]
  chord.forEach((f, i) => {
    const onset = i * 0.08
    const osc = ac.createOscillator()
    const gain = createGain(ac, 0, now + onset)
    osc.type = 'sine'
    osc.frequency.value = f
    gain.gain.linearRampToValueAtTime(0.07, now + onset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + onset + 1)
    const wet = createGain(ac, 0.35, now)
    osc.connect(gain)
    gain.connect(wet).connect(getReverb()).connect(ac.destination)
    const dry = createGain(ac, 0.65, now)
    gain.connect(dry).connect(ac.destination)
    osc.start(now + onset)
    osc.stop(now + onset + 1.2)
  })

  pad(110, 1.5, 0.02)
  fmBell(880, 1.41, 1.5, 1.2, 0.04)
  vibrate([12, 40, 12, 40, 25])
}

export function sfxGameOver() {
  const ac = getCtx()
  const now = ac.currentTime
  const notes = [330, 277, 220, 165]
  notes.forEach((f, i) => {
    const onset = i * 0.2
    cinematicTone(f, 0.8, {
      vol: 0.06,
      attack: 0.02,
      sustain: 0.5,
      release: 0.4,
      reverb: 0.4,
    })
    const osc = ac.createOscillator()
    const gain = createGain(ac, 0, now + onset)
    osc.type = 'sine'
    osc.frequency.value = f
    gain.gain.linearRampToValueAtTime(0.06, now + onset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + onset + 0.8)
    osc.connect(gain).connect(ac.destination)
    osc.start(now + onset)
    osc.stop(now + onset + 1)
  })
  pad(82.5, 2, 0.02)
  vibrate([60, 50, 100])
}

export function sfxCountdown() {
  subBass(80, 0.2, 0.08)
  fmBell(600, 2.5, 0.8, 0.25, 0.04)
  vibrate(12)
}

export function sfxCountdownGo() {
  const ac = getCtx()
  const now = ac.currentTime
  fmBell(800, 1.41, 1.5, 0.6, 0.07)
  subBass(60, 0.4, 0.1)
  const osc = ac.createOscillator()
  const gain = createGain(ac, 0, now)
  osc.type = 'sine'
  osc.frequency.value = 440
  gain.gain.linearRampToValueAtTime(0.06, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
  const wet = createGain(ac, 0.3, now)
  osc.connect(gain)
  gain.connect(wet).connect(getReverb()).connect(ac.destination)
  const dry = createGain(ac, 0.7, now)
  gain.connect(dry).connect(ac.destination)
  osc.start(now)
  osc.stop(now + 0.5)
  vibrate([15, 25, 30])
}

export function sfxScore() {
  fmBell(1046, 2.01, 0.6, 0.2, 0.04)
  vibrate(5)
}

export function sfxCombo(streak: number) {
  const base = 330 + streak * 40
  const intensity = Math.min(streak / 10, 1)
  fmBell(base, 1.41, 1 + intensity, 0.3 + intensity * 0.3, 0.04 + intensity * 0.04)
  if (streak >= 3) {
    cinematicTone(base * 0.5, 0.4, { vol: 0.03 + intensity * 0.02, reverb: 0.3 })
  }
  if (streak >= 7) {
    pad(base * 0.25, 0.6, 0.015)
  }
  vibrate(8 + streak * 2)
}

export function sfxClick() {
  fmBell(2000, 5, 0.3, 0.06, 0.03)
  vibrate(4)
}

export function sfxReveal() {
  cinematicTone(440, 0.4, { vol: 0.05, attack: 0.05, reverb: 0.35, sustain: 0.6 })
  fmBell(880, 2.01, 0.8, 0.5, 0.03)
}

export function sfxTimer() {
  const ac = getCtx()
  const now = ac.currentTime
  const osc = ac.createOscillator()
  const gain = createGain(ac, 0, now)
  osc.type = 'sine'
  osc.frequency.value = 800
  gain.gain.linearRampToValueAtTime(0.03, now + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
  osc.connect(gain).connect(ac.destination)
  osc.start(now)
  osc.stop(now + 0.1)
}
