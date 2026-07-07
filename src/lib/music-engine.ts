let ctx: AudioContext | null = null
function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function noise(ac: AudioContext, duration: number): AudioBufferSourceNode {
  const len = ac.sampleRate * duration
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  }
  const src = ac.createBufferSource()
  src.buffer = buf
  src.loop = true
  return src
}

// ── Shared effects chain (3-band EQ + reverb) ────────────────────────────────
// Both generative tracks AND the <audio> element route through this, so EQ /
// reverb "change how you hear it" apply to everything the player emits.
interface Fx {
  input: GainNode
  low: BiquadFilterNode; mid: BiquadFilterNode; high: BiquadFilterNode
  dry: GainNode; wet: GainNode; out: GainNode
}
let fx: Fx | null = null
let elementSource: MediaElementAudioSourceNode | null = null

function makeImpulse(ac: AudioContext): AudioBuffer {
  const len = Math.floor(ac.sampleRate * 2.6)
  const buf = ac.createBuffer(2, len, ac.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4)
  }
  return buf
}

function getFx(): Fx {
  const ac = getCtx()
  if (fx) return fx
  const input = ac.createGain()
  const low = ac.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 220
  const mid = ac.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1100; mid.Q.value = 0.7
  const high = ac.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 3400
  const conv = ac.createConvolver(); conv.buffer = makeImpulse(ac)
  const dry = ac.createGain(); dry.gain.value = 1
  const wet = ac.createGain(); wet.gain.value = 0
  const out = ac.createGain(); out.gain.value = 1
  input.connect(low); low.connect(mid); mid.connect(high)
  high.connect(dry); dry.connect(out)
  high.connect(conv); conv.connect(wet); wet.connect(out)
  out.connect(ac.destination)
  fx = { input, low, mid, high, dry, wet, out }
  return fx
}

interface GenNodes {
  sources: AudioScheduledSourceNode[]
  gains: GainNode[]
  master: GainNode
  lfo?: OscillatorNode[]
}

type Generator = (ac: AudioContext, master: GainNode) => GenNodes

function rain(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []
  const gains: GainNode[] = []

  const n = noise(ac, 4)
  const bp = ac.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 800
  bp.Q.value = 0.4
  const g = ac.createGain()
  g.gain.value = 0.35
  n.connect(bp).connect(g).connect(master)
  n.start()
  sources.push(n)
  gains.push(g)

  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 4000
  const n2 = noise(ac, 3)
  const g2 = ac.createGain()
  g2.gain.value = 0.12
  n2.connect(hp).connect(g2).connect(master)
  n2.start()
  sources.push(n2)
  gains.push(g2)

  const lfoNode = ac.createOscillator()
  lfoNode.type = 'sine'
  lfoNode.frequency.value = 0.08
  const lfoGain = ac.createGain()
  lfoGain.gain.value = 200
  lfoNode.connect(lfoGain).connect(bp.frequency)
  lfoNode.start()
  sources.push(lfoNode)

  const drip = ac.createOscillator()
  drip.type = 'sine'
  drip.frequency.value = 2400
  const dripG = ac.createGain()
  dripG.gain.value = 0
  drip.connect(dripG).connect(master)
  drip.start()
  sources.push(drip)
  gains.push(dripG)

  const dripLfo = ac.createOscillator()
  dripLfo.type = 'square'
  dripLfo.frequency.value = 0.3
  const dripLfoG = ac.createGain()
  dripLfoG.gain.value = 0.03
  dripLfo.connect(dripLfoG).connect(dripG.gain)
  dripLfo.start()
  sources.push(dripLfo)

  return { sources, gains, master, lfo: [lfoNode, dripLfo] }
}

function ocean(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []
  const gains: GainNode[] = []

  const n = noise(ac, 6)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 400
  lp.Q.value = 1.2
  const g = ac.createGain()
  g.gain.value = 0.4
  n.connect(lp).connect(g).connect(master)
  n.start()
  sources.push(n)
  gains.push(g)

  const lfo = ac.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 0.06
  const lfoG = ac.createGain()
  lfoG.gain.value = 350
  lfo.connect(lfoG).connect(lp.frequency)
  lfo.start()
  sources.push(lfo)

  const lfo2 = ac.createOscillator()
  lfo2.type = 'sine'
  lfo2.frequency.value = 0.12
  const lfoG2 = ac.createGain()
  lfoG2.gain.value = 0.15
  lfo2.connect(lfoG2).connect(g.gain)
  lfo2.start()
  sources.push(lfo2)

  const n2 = noise(ac, 5)
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 6000
  const g2 = ac.createGain()
  g2.gain.value = 0.06
  n2.connect(hp).connect(g2).connect(master)
  n2.start()
  sources.push(n2)
  gains.push(g2)

  const sub = ac.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = 55
  const subG = ac.createGain()
  subG.gain.value = 0.08
  sub.connect(subG).connect(master)
  sub.start()
  sources.push(sub)
  gains.push(subG)

  const subLfo = ac.createOscillator()
  subLfo.type = 'sine'
  subLfo.frequency.value = 0.04
  const subLfoG = ac.createGain()
  subLfoG.gain.value = 0.06
  subLfo.connect(subLfoG).connect(subG.gain)
  subLfo.start()
  sources.push(subLfo)

  return { sources, gains, master, lfo: [lfo, lfo2, subLfo] }
}

function forest(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []
  const gains: GainNode[] = []

  const n = noise(ac, 4)
  const bp = ac.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 1200
  bp.Q.value = 0.3
  const g = ac.createGain()
  g.gain.value = 0.15
  n.connect(bp).connect(g).connect(master)
  n.start()
  sources.push(n)
  gains.push(g)

  const wind = noise(ac, 3)
  const wlp = ac.createBiquadFilter()
  wlp.type = 'lowpass'
  wlp.frequency.value = 600
  const wg = ac.createGain()
  wg.gain.value = 0.1
  wind.connect(wlp).connect(wg).connect(master)
  wind.start()
  sources.push(wind)
  gains.push(wg)

  const wlfo = ac.createOscillator()
  wlfo.type = 'sine'
  wlfo.frequency.value = 0.15
  const wlfoG = ac.createGain()
  wlfoG.gain.value = 0.06
  wlfo.connect(wlfoG).connect(wg.gain)
  wlfo.start()
  sources.push(wlfo)

  const birdFreqs = [2800, 3200, 3600, 4200, 4800]
  for (const f of birdFreqs) {
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = f
    const bg = ac.createGain()
    bg.gain.value = 0
    osc.connect(bg).connect(master)
    osc.start()
    sources.push(osc)
    gains.push(bg)

    const trill = ac.createOscillator()
    trill.type = 'sine'
    trill.frequency.value = 5 + Math.random() * 8
    const trillG = ac.createGain()
    trillG.gain.value = 0.02 + Math.random() * 0.01
    trill.connect(trillG).connect(bg.gain)
    trill.start()
    sources.push(trill)

    const chirpLfo = ac.createOscillator()
    chirpLfo.type = 'sine'
    chirpLfo.frequency.value = 0.05 + Math.random() * 0.15
    const chirpLfoG = ac.createGain()
    chirpLfoG.gain.value = f * 0.15
    chirpLfo.connect(chirpLfoG).connect(osc.frequency)
    chirpLfo.start()
    sources.push(chirpLfo)
  }

  return { sources, gains, master }
}

function fire(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []
  const gains: GainNode[] = []

  const n = noise(ac, 3)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 500
  lp.Q.value = 2
  const g = ac.createGain()
  g.gain.value = 0.3
  n.connect(lp).connect(g).connect(master)
  n.start()
  sources.push(n)
  gains.push(g)

  const crackle = noise(ac, 2)
  const cbp = ac.createBiquadFilter()
  cbp.type = 'bandpass'
  cbp.frequency.value = 3000
  cbp.Q.value = 4
  const cg = ac.createGain()
  cg.gain.value = 0
  crackle.connect(cbp).connect(cg).connect(master)
  crackle.start()
  sources.push(crackle)
  gains.push(cg)

  const crackleLfo = ac.createOscillator()
  crackleLfo.type = 'sawtooth'
  crackleLfo.frequency.value = 2.5
  const crackleLfoG = ac.createGain()
  crackleLfoG.gain.value = 0.08
  crackleLfo.connect(crackleLfoG).connect(cg.gain)
  crackleLfo.start()
  sources.push(crackleLfo)

  const hiss = noise(ac, 2)
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 5000
  const hg = ac.createGain()
  hg.gain.value = 0.04
  hiss.connect(hp).connect(hg).connect(master)
  hiss.start()
  sources.push(hiss)
  gains.push(hg)

  const rumble = ac.createOscillator()
  rumble.type = 'sine'
  rumble.frequency.value = 60
  const rg = ac.createGain()
  rg.gain.value = 0.06
  rumble.connect(rg).connect(master)
  rumble.start()
  sources.push(rumble)
  gains.push(rg)

  const rumbleLfo = ac.createOscillator()
  rumbleLfo.type = 'sine'
  rumbleLfo.frequency.value = 0.2
  const rLfoG = ac.createGain()
  rLfoG.gain.value = 0.04
  rumbleLfo.connect(rLfoG).connect(rg.gain)
  rumbleLfo.start()
  sources.push(rumbleLfo)

  return { sources, gains, master }
}

function tibetan(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []
  const gains: GainNode[] = []
  const bowlFreqs = [174, 285, 396, 528, 639]

  for (const freq of bowlFreqs) {
    const carrier = ac.createOscillator()
    carrier.type = 'sine'
    carrier.frequency.value = freq

    const mod = ac.createOscillator()
    mod.type = 'sine'
    mod.frequency.value = freq * 1.002
    const modG = ac.createGain()
    modG.gain.value = freq * 0.3
    mod.connect(modG).connect(carrier.frequency)
    mod.start()
    sources.push(mod)

    const bg = ac.createGain()
    bg.gain.value = 0.06
    carrier.connect(bg).connect(master)
    carrier.start()
    sources.push(carrier)
    gains.push(bg)

    const trem = ac.createOscillator()
    trem.type = 'sine'
    trem.frequency.value = 0.15 + Math.random() * 0.1
    const tremG = ac.createGain()
    tremG.gain.value = 0.025
    trem.connect(tremG).connect(bg.gain)
    trem.start()
    sources.push(trem)

    const h2 = ac.createOscillator()
    h2.type = 'sine'
    h2.frequency.value = freq * 2.01
    const h2g = ac.createGain()
    h2g.gain.value = 0.02
    h2.connect(h2g).connect(master)
    h2.start()
    sources.push(h2)
    gains.push(h2g)
  }

  const pad = ac.createOscillator()
  pad.type = 'triangle'
  pad.frequency.value = 110
  const padG = ac.createGain()
  padG.gain.value = 0.03
  pad.connect(padG).connect(master)
  pad.start()
  sources.push(pad)
  gains.push(padG)

  return { sources, gains, master }
}

function crystal(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []
  const gains: GainNode[] = []
  const freqs = [528, 639, 741, 852, 963]

  for (const freq of freqs) {
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const bg = ac.createGain()
    bg.gain.value = 0.045
    osc.connect(bg).connect(master)
    osc.start()
    sources.push(osc)
    gains.push(bg)

    const detune = ac.createOscillator()
    detune.type = 'sine'
    detune.frequency.value = freq * 1.001
    const dg = ac.createGain()
    dg.gain.value = 0.03
    detune.connect(dg).connect(master)
    detune.start()
    sources.push(detune)
    gains.push(dg)

    const trem = ac.createOscillator()
    trem.type = 'sine'
    trem.frequency.value = 0.1 + Math.random() * 0.08
    const tremG = ac.createGain()
    tremG.gain.value = 0.02
    trem.connect(tremG).connect(bg.gain)
    trem.start()
    sources.push(trem)
  }

  const shimmer = noise(ac, 2)
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 8000
  const sg = ac.createGain()
  sg.gain.value = 0.015
  shimmer.connect(hp).connect(sg).connect(master)
  shimmer.start()
  sources.push(shimmer)
  gains.push(sg)

  return { sources, gains, master }
}

function binaural(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []
  const gains: GainNode[] = []

  const merger = ac.createChannelMerger(2)
  merger.connect(master)

  const left = ac.createOscillator()
  left.type = 'sine'
  left.frequency.value = 200
  const lg = ac.createGain()
  lg.gain.value = 0.15
  left.connect(lg).connect(merger, 0, 0)
  left.start()
  sources.push(left)
  gains.push(lg)

  const right = ac.createOscillator()
  right.type = 'sine'
  right.frequency.value = 240
  const rg = ac.createGain()
  rg.gain.value = 0.15
  right.connect(rg).connect(merger, 0, 1)
  right.start()
  sources.push(right)
  gains.push(rg)

  const pad1 = ac.createOscillator()
  pad1.type = 'triangle'
  pad1.frequency.value = 100
  const p1g = ac.createGain()
  p1g.gain.value = 0.04
  pad1.connect(p1g).connect(master)
  pad1.start()
  sources.push(pad1)
  gains.push(p1g)

  const pad2 = ac.createOscillator()
  pad2.type = 'sine'
  pad2.frequency.value = 150
  const p2g = ac.createGain()
  p2g.gain.value = 0.03
  pad2.connect(p2g).connect(master)
  pad2.start()
  sources.push(pad2)
  gains.push(p2g)

  const atm = noise(ac, 3)
  const alp = ac.createBiquadFilter()
  alp.type = 'lowpass'
  alp.frequency.value = 300
  const ag = ac.createGain()
  ag.gain.value = 0.04
  atm.connect(alp).connect(ag).connect(master)
  atm.start()
  sources.push(atm)
  gains.push(ag)

  return { sources, gains, master }
}

function meditationPad(ac: AudioContext, master: GainNode, root: number, character: 'warm' | 'bright' | 'deep'): GenNodes {
  const sources: AudioScheduledSourceNode[] = []
  const gains: GainNode[] = []

  const intervals = character === 'warm' ? [1, 1.25, 1.5, 2]
    : character === 'bright' ? [1, 1.333, 1.5, 2, 2.667]
    : [1, 1.5, 2, 3]

  for (const ratio of intervals) {
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = root * ratio
    const g = ac.createGain()
    g.gain.value = 0.04 / ratio
    osc.connect(g).connect(master)
    osc.start()
    sources.push(osc)
    gains.push(g)

    const det = ac.createOscillator()
    det.type = 'sine'
    det.frequency.value = root * ratio * 1.003
    const dg = ac.createGain()
    dg.gain.value = 0.025 / ratio
    det.connect(dg).connect(master)
    det.start()
    sources.push(det)
    gains.push(dg)

    const trem = ac.createOscillator()
    trem.type = 'sine'
    trem.frequency.value = 0.08 + Math.random() * 0.06
    const tg = ac.createGain()
    tg.gain.value = 0.015
    trem.connect(tg).connect(g.gain)
    trem.start()
    sources.push(trem)
  }

  const n = noise(ac, 3)
  const filt = ac.createBiquadFilter()
  filt.type = character === 'deep' ? 'lowpass' : 'bandpass'
  filt.frequency.value = character === 'deep' ? 200 : character === 'bright' ? 2000 : 800
  filt.Q.value = 0.5
  const ng = ac.createGain()
  ng.gain.value = 0.03
  n.connect(filt).connect(ng).connect(master)
  n.start()
  sources.push(n)
  gains.push(ng)

  const sub = ac.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = root / 2
  const sg = ac.createGain()
  sg.gain.value = 0.035
  sub.connect(sg).connect(master)
  sub.start()
  sources.push(sub)
  gains.push(sg)

  return { sources, gains, master }
}

// ── Brain-massage generators (binaural beats + isochronic + brown noise) ──
function binauralBeat(ac: AudioContext, master: GainNode, carrier: number, beat: number): GenNodes {
  const sources: AudioScheduledSourceNode[] = []; const gains: GainNode[] = []
  const merger = ac.createChannelMerger(2); merger.connect(master)
  const mk = (freq: number, chan: number) => {
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq
    const g = ac.createGain(); g.gain.value = 0.16
    o.connect(g).connect(merger, 0, chan); o.start(); sources.push(o); gains.push(g)
  }
  mk(carrier, 0); mk(carrier + beat, 1)
  const pad = ac.createOscillator(); pad.type = 'sine'; pad.frequency.value = carrier / 2
  const pg = ac.createGain(); pg.gain.value = 0.05; pad.connect(pg).connect(master); pad.start()
  sources.push(pad); gains.push(pg)
  return { sources, gains, master }
}

function isochronic(ac: AudioContext, master: GainNode, freq: number, pulse: number): GenNodes {
  const sources: AudioScheduledSourceNode[] = []; const gains: GainNode[] = []
  const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq
  const g = ac.createGain(); g.gain.value = 0.0001
  o.connect(g).connect(master); o.start(); sources.push(o); gains.push(g)
  const lfo = ac.createOscillator(); lfo.type = 'square'; lfo.frequency.value = pulse
  const lg = ac.createGain(); lg.gain.value = 0.2
  lfo.connect(lg).connect(g.gain); lfo.start(); sources.push(lfo); gains.push(lg)
  return { sources, gains, master, lfo: [lfo] }
}

function brownNoise(ac: AudioContext, master: GainNode): GenNodes {
  const src = noise(ac, 4)
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 480
  const lp2 = ac.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 900
  const g = ac.createGain(); g.gain.value = 0.5
  src.connect(lp).connect(lp2).connect(g).connect(master); src.start()
  return { sources: [src], gains: [g], master }
}

// ── Gaming generators ──
function synthwave(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []; const gains: GainNode[] = []
  for (const f of [110, 130.81, 164.81]) {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900
    const g = ac.createGain(); g.gain.value = 0.045
    o.connect(lp).connect(g).connect(master); o.start(); sources.push(o); gains.push(g)
  }
  const bass = ac.createOscillator(); bass.type = 'triangle'; bass.frequency.value = 55
  const bg = ac.createGain(); bg.gain.value = 0.0001; bass.connect(bg).connect(master); bass.start()
  sources.push(bass); gains.push(bg)
  const lfo = ac.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 2
  const lg = ac.createGain(); lg.gain.value = 0.18; lfo.connect(lg).connect(bg.gain); lfo.start()
  sources.push(lfo); gains.push(lg)
  return { sources, gains, master, lfo: [lfo] }
}

function arcade(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []; const gains: GainNode[] = []
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, i) => {
    const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = f
    const g = ac.createGain(); g.gain.value = 0.0001
    o.connect(g).connect(master); o.start(); sources.push(o); gains.push(g)
    const lfo = ac.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 8 + i * 0.9
    const lg = ac.createGain(); lg.gain.value = 0.06
    lfo.connect(lg).connect(g.gain); lfo.start(); sources.push(lfo); gains.push(lg)
  })
  const bass = ac.createOscillator(); bass.type = 'triangle'; bass.frequency.value = 130.81
  const bg = ac.createGain(); bg.gain.value = 0.05; bass.connect(bg).connect(master); bass.start()
  sources.push(bass); gains.push(bg)
  return { sources, gains, master }
}

function epic(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []; const gains: GainNode[] = []
  const bus = ac.createGain(); bus.gain.value = 0.9; bus.connect(master)
  for (const f of [65.41, 98, 130.81, 196]) {
    const o = ac.createOscillator(); o.type = f < 100 ? 'sine' : 'triangle'; o.frequency.value = f
    const g = ac.createGain(); g.gain.value = 0.06; o.connect(g).connect(bus); o.start()
    sources.push(o); gains.push(g)
  }
  const swell = ac.createOscillator(); swell.type = 'sine'; swell.frequency.value = 0.08
  const sg = ac.createGain(); sg.gain.value = 0.35; swell.connect(sg).connect(bus.gain); swell.start()
  sources.push(swell); gains.push(sg)
  const drum = noise(ac, 2)
  const dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 120
  const dg = ac.createGain(); dg.gain.value = 0.0001; drum.connect(dlp).connect(dg).connect(master); drum.start()
  sources.push(drum); gains.push(dg)
  const dlfo = ac.createOscillator(); dlfo.type = 'square'; dlfo.frequency.value = 1
  const dlg = ac.createGain(); dlg.gain.value = 0.5; dlfo.connect(dlg).connect(dg.gain); dlfo.start()
  sources.push(dlfo); gains.push(dlg)
  return { sources, gains, master, lfo: [swell, dlfo] }
}

function focusDrive(ac: AudioContext, master: GainNode): GenNodes {
  const sources: AudioScheduledSourceNode[] = []; const gains: GainNode[] = []
  const src = noise(ac, 4)
  const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2000; bp.Q.value = 0.6
  const g = ac.createGain(); g.gain.value = 0.07; src.connect(bp).connect(g).connect(master); src.start()
  sources.push(src); gains.push(g)
  const bass = ac.createOscillator(); bass.type = 'sine'; bass.frequency.value = 65.41
  const bg = ac.createGain(); bg.gain.value = 0.0001; bass.connect(bg).connect(master); bass.start()
  sources.push(bass); gains.push(bg)
  const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 2
  const lg = ac.createGain(); lg.gain.value = 0.12; lfo.connect(lg).connect(bg.gain); lfo.start()
  sources.push(lfo); gains.push(lg)
  return { sources, gains, master, lfo: [lfo] }
}

const GENERATORS: Record<string, Generator> = {
  rain,
  ocean,
  forest,
  fire,
  tibetan,
  crystal,
  binaural,
  alfatiha: (ac, m) => meditationPad(ac, m, 130.81, 'warm'),
  yaseen: (ac, m) => meditationPad(ac, m, 110, 'deep'),
  arrahman: (ac, m) => meditationPad(ac, m, 146.83, 'warm'),
  psalm23: (ac, m) => meditationPad(ac, m, 164.81, 'bright'),
  john316: (ac, m) => meditationPad(ac, m, 123.47, 'warm'),
  proverbs3: (ac, m) => meditationPad(ac, m, 98, 'deep'),
  // gaming
  game_synthwave: synthwave,
  game_arcade: arcade,
  game_epic: epic,
  game_focus: focusDrive,
  // brain massage
  bm_theta: (ac, m) => binauralBeat(ac, m, 200, 6),
  bm_alpha: (ac, m) => binauralBeat(ac, m, 220, 10),
  bm_delta: (ac, m) => binauralBeat(ac, m, 150, 2),
  bm_isochronic: (ac, m) => isochronic(ac, m, 210, 7),
  bm_brown: brownNoise,
}

const TRACK_DURATION: Record<string, number> = {
  rain: 600, ocean: 600, forest: 600, fire: 600,
  tibetan: 480, crystal: 480, binaural: 480,
  alfatiha: 300, yaseen: 420, arrahman: 360,
  psalm23: 300, john316: 300, proverbs3: 300,
  game_synthwave: 600, game_arcade: 600, game_epic: 600, game_focus: 600,
  bm_theta: 900, bm_alpha: 900, bm_delta: 900, bm_isochronic: 900, bm_brown: 900,
}

export interface MusicEngine {
  play(trackId: string, volume: number): void
  stop(): void
  pause(): void
  resume(): void
  setVolume(v: number): void
  isPlaying(): boolean
  getTrackId(): string | null
  getDuration(trackId: string): number
  /** Route an <audio> element through the shared EQ/reverb chain (once). */
  connectElement(el: HTMLAudioElement): void
  /** 3-band EQ in dB (roughly -12..+12). */
  setEQ(low: number, mid: number, high: number): void
  /** Reverb/space amount 0..1. */
  setReverb(amount: number): void
}

export function createMusicEngine(): MusicEngine {
  let nodes: GenNodes | null = null
  let currentTrack: string | null = null
  let playing = false
  let savedVolume = 0.8

  function stop() {
    if (nodes) {
      for (const s of nodes.sources) {
        try { s.stop() } catch { /* already stopped */ }
      }
      nodes = null
    }
    currentTrack = null
    playing = false
  }

  function play(trackId: string, volume: number) {
    stop()
    const gen = GENERATORS[trackId]
    if (!gen) return

    savedVolume = volume
    const ac = getCtx()
    const master = ac.createGain()
    master.gain.value = volume
    master.connect(getFx().input)

    nodes = gen(ac, master)
    currentTrack = trackId
    playing = true
  }

  function pause() {
    if (nodes && playing) {
      nodes.master.gain.setTargetAtTime(0, getCtx().currentTime, 0.05)
      playing = false
    }
  }

  function resume() {
    if (nodes && !playing) {
      nodes.master.gain.setTargetAtTime(savedVolume, getCtx().currentTime, 0.05)
      playing = true
    }
  }

  function setVolume(v: number) {
    savedVolume = v
    if (nodes) {
      nodes.master.gain.setTargetAtTime(v, getCtx().currentTime, 0.05)
    }
  }

  function connectElement(el: HTMLAudioElement) {
    const ac = getCtx()
    if (ac.state === 'suspended') ac.resume().catch(() => {})
    if (elementSource) return
    try {
      elementSource = ac.createMediaElementSource(el)
      elementSource.connect(getFx().input)
    } catch { /* already connected elsewhere, or unsupported */ }
  }

  function setEQ(low: number, mid: number, high: number) {
    const f = getFx(); const now = getCtx().currentTime
    f.low.gain.setTargetAtTime(low, now, 0.04)
    f.mid.gain.setTargetAtTime(mid, now, 0.04)
    f.high.gain.setTargetAtTime(high, now, 0.04)
  }

  function setReverb(amount: number) {
    const a = Math.max(0, Math.min(1, amount))
    const f = getFx(); const now = getCtx().currentTime
    f.wet.gain.setTargetAtTime(a, now, 0.05)
    f.dry.gain.setTargetAtTime(1 - 0.4 * a, now, 0.05)
  }

  return {
    play,
    stop,
    pause,
    resume,
    setVolume,
    isPlaying: () => playing,
    getTrackId: () => currentTrack,
    getDuration: (id: string) => TRACK_DURATION[id] || 300,
    connectElement,
    setEQ,
    setReverb,
  }
}
