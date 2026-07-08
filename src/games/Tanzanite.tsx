/* ============================================================================
   TANZANITE — "The Merelani Deep"    ·  KasukuGames flagship
   A complete gemstone-journey simulation: mine → heat-treat → cut → grade →
   certify → trade → build your Tanzanite house. Every mechanic is real science.
   ============================================================================ */
import { useEffect, useRef, useState, useCallback } from 'react'
import { sfxTap, sfxCorrect, sfxWrong, sfxReveal, sfxLevelUp, sfxScore, sfxClick } from '../lib/sfx'
import {
  type Particle, burstParticles, tickParticles, renderParticleStyle,
} from '../lib/vfx'
import {
  MINERAL, STRATA, BLOCKS, SHAPES, CODEX, RANKS, UPGRADE_META, TREAT_IDEAL,
  strataAt, digRough, treat, cutStone, grade, certify, makeOffers, rankOf, upgradeCost,
  gemColor, colorGradeOf, clamp01, round2,
  type BlockId, type Rough, type Treated, type Cut, type Graded, type Upgrades, type Offer,
} from '../lib/tanzanite'

interface Props { onBack: () => void; onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void }

// ── bespoke tanzanite palette (its own premium identity) ───────────────────
const C = {
  bg: '#0b0a1e', bg2: '#141033', panel: 'rgba(30,24,66,0.72)', panelSolid: '#1b1642',
  line: 'rgba(150,140,220,0.18)', text: '#eae7ff', dim: '#a59fd0', faint: '#6f6aa0',
  blue: '#4f5bd5', violet: '#7a5cf0', gold: '#d9b46a', good: '#5fd39a', bad: '#e06a7a',
}
const SAVE_KEY = 'kg_tanzanite_v1'

type Stage = 'hub' | 'mine' | 'treat' | 'cut' | 'grade' | 'certify' | 'market' | 'codex' | 'shop'

interface Save {
  tznite: number; upgrades: Upgrades; codex: string[]
  totalEarned: number; stonesSold: number; bestValue: number; deepest: number
  block: BlockId | null; depth: number; inventory: Rough[]
}
const freshSave = (): Save => ({
  tznite: 250, upgrades: { drill: 0, furnace: 0, lapidary: 0, lab: 0 }, codex: ['discovery'],
  totalEarned: 0, stonesSold: 0, bestValue: 0, deepest: 0, block: null, depth: 0, inventory: [],
})
function loadSave(): Save {
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || ''); return { ...freshSave(), ...s } } catch { return freshSave() }
}

let _rngState = (Date.now() % 2147483647) || 1
const rng = () => { _rngState = (_rngState * 48271) % 2147483647; return _rngState / 2147483647 }

export default function Tanzanite({ onBack, onGameEnd }: Props) {
  const [save, setSave] = useState<Save>(loadSave)
  const [stage, setStage] = useState<Stage>('hub')
  // work-in-progress stone through the pipeline
  const [wipRough, setWipRough] = useState<Rough | null>(null)
  const [wipTreated, setWipTreated] = useState<Treated | null>(null)
  const [wipCut, setWipCut] = useState<Cut | null>(null)
  const [wipGraded, setWipGraded] = useState<Graded | null>(null)
  const [cert, setCert] = useState<{ serial: string; hash: string; bonus: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const persist = useCallback((s: Save) => { setSave(s); try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)) } catch { /* */ } }, [])
  const flash = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(t => (t === m ? null : t)), 2200) }, [])

  const unlockCodex = useCallback((id: string) => {
    setSave(prev => {
      if (prev.codex.includes(id)) return prev
      const next = { ...prev, codex: [...prev.codex, id] }
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)) } catch { /* */ }
      const f = CODEX.find(c => c.id === id)
      if (f) window.setTimeout(() => flash(`Codex unlocked — ${f.title}`), 400)
      return next
    })
  }, [flash])

  // report a session "score" (total earned) when leaving, for the arcade leaderboard
  const back = () => { onGameEnd?.({ score: save.totalEarned, accuracy: 1, level: rankOf(save.totalEarned).index + 1, maxScore: save.totalEarned }); onBack() }

  const rank = rankOf(save.totalEarned)

  return (
    <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(1200px 700px at 50% -10%, ${C.bg2}, ${C.bg})`, color: C.text, fontFamily: 'system-ui, sans-serif', overflow: 'auto' }}>
      <style>{`@keyframes tzspin{0%{transform:rotateY(0) rotate(0)}100%{transform:rotateY(360deg) rotate(360deg)}}`}</style>
      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 5, background: 'linear-gradient(#0b0a1eee,#0b0a1e00)' }}>
        <button onClick={stage === 'hub' ? back : () => setStage('hub')} style={btnGhost}>‹ {stage === 'hub' ? 'Exit' : 'Site'}</button>
        <div style={{ flex: 1 }} />
        <Chip label={rank.title} />
        <Chip label={`${fmt(save.tznite)} TzNITE`} gold />
      </div>

      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '4px 16px 90px' }}>
        {stage === 'hub' && <Hub save={save} rank={rank} wip={{ wipRough, wipTreated, wipCut, wipGraded, cert }} go={setStage} />}
        {stage === 'mine' && <Mine save={save} persist={persist} rng={rng} unlockCodex={unlockCodex} onExtract={(r: Rough) => { setWipRough(r); setWipTreated(null); setWipCut(null); setWipGraded(null); setCert(null); flash(`Extracted ${round2(r.caratRough)} ct rough — take it to the kiln.`); }} go={setStage} flash={flash} />}
        {stage === 'treat' && <TreatLab save={save} rough={wipRough} unlockCodex={unlockCodex} onDone={(t: Treated) => { setWipTreated(t); }} go={setStage} />}
        {stage === 'cut' && <CutRoom save={save} treated={wipTreated} unlockCodex={unlockCodex} onDone={(c: Cut) => setWipCut(c)} go={setStage} />}
        {stage === 'grade' && <GradeRoom cut={wipCut} unlockCodex={unlockCodex} onDone={(g: Graded) => setWipGraded(g)} go={setStage} />}
        {stage === 'certify' && <CertRoom save={save} graded={wipGraded} cert={cert} unlockCodex={unlockCodex} onCertify={(g: Graded) => { const c = certify(g); setCert(c); sfxReveal(); flash(`Certified — ${c.serial}`) }} go={setStage} />}
        {stage === 'market' && <Market save={save} graded={wipGraded} cert={cert} persist={persist} rng={rng} unlockCodex={unlockCodex}
          onSold={() => { setWipRough(null); setWipTreated(null); setWipCut(null); setWipGraded(null); setCert(null) }} go={setStage} flash={flash} />}
        {stage === 'shop' && <Shop save={save} persist={persist} flash={flash} />}
        {stage === 'codex' && <Codex save={save} />}
      </div>
    </div>
  )
}

/* ─────────────────────────  GEM RENDER (pleochroic)  ───────────────────── */
function Gem({ blue, orient = 1, size = 120, spin = false }: { blue: number; orient?: number; size?: number; spin?: boolean }) {
  const { face, glow } = gemColor(blue, orient)
  const s = size
  return (
    <div style={{ width: s, height: s, position: 'relative', filter: `drop-shadow(0 0 ${s * 0.18}px ${glow})`, animation: spin ? 'tzspin 6s linear infinite' : undefined }}>
      <svg viewBox="0 0 100 100" width={s} height={s}>
        <defs>
          <linearGradient id="tzg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="0.28" stopColor={face} stopOpacity="0.95" />
            <stop offset="1" stopColor={face} />
          </linearGradient>
        </defs>
        {/* emerald-cut style facets */}
        <polygon points="50,4 82,26 82,74 50,96 18,74 18,26" fill="url(#tzg)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        <polygon points="50,4 82,26 50,40 18,26" fill="#ffffff" opacity="0.18" />
        <polygon points="18,26 50,40 50,96 18,74" fill="#000" opacity="0.16" />
        <polygon points="82,26 50,40 50,96 82,74" fill="#000" opacity="0.28" />
        <polygon points="50,40 68,52 50,70 32,52" fill="#fff" opacity="0.12" />
        <polygon points="34,16 46,10 42,22" fill="#fff" opacity="0.55" />
      </svg>
    </div>
  )
}

/* ─────────────────────────────────  HUB  ───────────────────────────────── */
function Hub({ save, rank, wip, go }: any) {
  const { wipRough, wipTreated, wipCut, wipGraded, cert } = wip
  const stone = wipGraded || wipCut || wipTreated || wipRough
  const blue = wipGraded?.blue ?? wipCut?.blue ?? wipTreated?.blue ?? 0
  const orient = wipGraded?.orientBlue ?? wipCut?.orientBlue ?? 1
  const nextStage = !wipRough ? null : !wipTreated ? 'treat' : (wipTreated.cracked ? 'market' : !wipCut ? 'cut' : !wipGraded ? 'grade' : !cert ? 'certify' : 'market')
  const nextLabel: any = { treat: 'Heat-treat', cut: 'Cut & polish', grade: 'Grade it', certify: 'Certify', market: 'Take to market' }
  const pct = rank.next ? Math.min(100, Math.round((save.totalEarned - RANKS[rank.index].at) / (rank.next - RANKS[rank.index].at) * 100)) : 100

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ textAlign: 'center', padding: '18px 0 6px' }}>
        <Gem blue={stone ? blue : 0.85} orient={orient} size={132} spin={!stone} />
        <h1 style={{ margin: '10px 0 2px', fontSize: 27, fontWeight: 800, letterSpacing: '-0.02em', background: `linear-gradient(90deg,${C.blue},${C.violet},${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TANZANITE</h1>
        <div style={{ color: C.dim, fontSize: 13, letterSpacing: '0.14em' }}>THE MERELANI DEEP</div>
      </div>

      {/* rank progress */}
      <Panel>
        <Row><b>{rank.title}</b><span style={{ color: C.dim, fontSize: 12 }}>{rank.next ? `${fmt(save.totalEarned)} / ${fmt(rank.next)} earned` : 'Max rank'}</span></Row>
        <div style={{ height: 8, borderRadius: 8, background: '#00000055', overflow: 'hidden', marginTop: 8 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${C.blue},${C.gold})` }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: C.dim, flexWrap: 'wrap' }}>
          <span>Stones sold <b style={{ color: C.text }}>{save.stonesSold}</b></span>
          <span>Best stone <b style={{ color: C.gold }}>{fmt(save.bestValue)}</b></span>
          <span>Deepest <b style={{ color: C.text }}>{save.deepest} m</b></span>
        </div>
      </Panel>

      {/* current stone in the pipeline */}
      {stone ? (
        <Panel accent>
          <Row><b>Stone in hand</b><span style={{ color: C.gold, fontSize: 12 }}>{round2((wipCut?.carat ?? wipRough.caratRough))} ct</span></Row>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <Gem blue={blue} orient={orient} size={64} />
            <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5 }}>
              {wipGraded ? <>Graded <b style={{ color: C.text }}>{wipGraded.colorGrade}</b> · {wipGraded.clarityGrade} · {fmt(wipGraded.value)} TzNITE{cert ? ' · certified' : ''}</>
                : wipTreated?.cracked ? <span style={{ color: C.bad }}>Cracked in the kiln — salvage what you can at market.</span>
                : wipTreated ? <>Treated · blue {Math.round(wipTreated.blue * 100)}%</>
                : <>Rough from Block {wipRough.block}, {wipRough.depth} m — reddish-brown, blue still locked inside.</>}
            </div>
          </div>
          {nextStage && <button onClick={() => go(nextStage)} style={{ ...btnPrimary, marginTop: 12, width: '100%' }}>{nextLabel[nextStage]} →</button>}
        </Panel>
      ) : (
        <button onClick={() => go('mine')} style={{ ...btnPrimary, padding: 16, fontSize: 16 }}>⛏  Descend the mine</button>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => go('mine')} style={btnTile}>⛏<div style={tileLabel}>Mine</div></button>
        <button onClick={() => go('shop')} style={btnTile}>⚙<div style={tileLabel}>Upgrades</div></button>
        <button onClick={() => go('codex')} style={btnTile}>📖<div style={tileLabel}>Codex ({save.codex.length}/{CODEX.length})</div></button>
        <button onClick={() => go('market')} style={btnTile} disabled={!wipGraded}><span style={{ opacity: wipGraded ? 1 : 0.4 }}>💠</span><div style={tileLabel}>Market</div></button>
      </div>
      <div style={{ textAlign: 'center', color: C.faint, fontSize: 11, marginTop: 4 }}>Blue gem zoisite · {MINERAL.formula} · found only at Merelani, Tanzania</div>
    </div>
  )
}

/* ─────────────────────────────────  MINE  ──────────────────────────────── */
function Mine({ save, persist, rng, onExtract, go, unlockCodex, flash }: any) {
  const [block, setBlock] = useState<BlockId | null>(save.block)
  const [depth, setDepth] = useState<number>(save.depth || 0)
  const [stamina, setStamina] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [parts, setParts] = useState<Particle[]>([])
  const maxStamina = 10 + save.upgrades.drill * 3
  const step = 8 + save.upgrades.drill * 3

  useEffect(() => { if (block && stamina === 0 && log.length === 0) setStamina(maxStamina) }, [block]) // eslint-disable-line

  useEffect(() => {
    if (!parts.length) return
    const t = setInterval(() => setParts(p => { const n = tickParticles(p); if (!n.length) clearInterval(t); return n }), 33)
    return () => clearInterval(t)
  }, [parts.length])

  if (!block) return (
    <div style={{ display: 'grid', gap: 12 }}>
      <H title="Choose your block" sub="Merelani is split into mining blocks. Deeper, richer blocks pay more — and punish more." />
      {BLOCKS.map(b => (
        <button key={b.id} onClick={() => { sfxClick(); setBlock(b.id); persist({ ...save, block: b.id }) }} style={{ ...panelBase, textAlign: 'left', cursor: 'pointer', display: 'block' }}>
          <Row><b>{b.name}</b><span style={{ fontSize: 11, color: C.gold }}>grade ×{b.gradeMul} · risk ×{b.hazardMul}</span></Row>
          <div style={{ color: C.dim, fontSize: 12.5, marginTop: 4 }}>{b.hint}</div>
        </button>
      ))}
    </div>
  )

  const strata = strataAt(depth)

  function dig() {
    if (stamina <= 0) { flash('Shift over — haul up to rest.'); return }
    sfxTap()
    const nd = depth + step
    setDepth(nd); setStamina(s => s - 1)
    persist({ ...save, depth: nd, deepest: Math.max(save.deepest, nd) })
    if (nd >= 300 && !save.codex.includes('formed')) unlockCodex('formed')
    if (nd >= 600) unlockCodex('rarity')
    // hazard?
    const s2 = strataAt(nd)
    if (rng() < s2.hazard * BLOCKS.find(b => b.id === block)!.hazardMul * 0.5) {
      sfxWrong()
      setStamina(0)
      setLog(l => [`⚠ Tremor at ${nd} m — the shift is called off. You climb out.`, ...l].slice(0, 6))
      return
    }
    // find?
    const r = digRough(block!, nd, rng)
    if (r) {
      sfxCorrect()
      setParts(burstParticles(50, 40, C.violet, 20))
      setLog(l => [`💎 Struck a pocket at ${nd} m — ${round2(r.caratRough)} ct rough (Block ${block}).`, ...l].slice(0, 6))
      onExtract(r); go('treat')
    } else {
      setLog(l => [`${s2.name}: ${s2.rock}. Nothing yet.`, ...l].slice(0, 6))
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <H title={`Block ${block} · ${depth} m`} sub={`${strata.name} — ${strata.note}`} />
      {/* shaft */}
      <div style={{ position: 'relative', height: 180, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.line}`, background: `linear-gradient(180deg, #2a2140, #120e26)` }}>
        {STRATA.map((s, i) => {
          const top = Math.max(0, Math.min(100, (s.from - Math.max(0, depth - 90)) / 180 * 100))
          const h = (s.to - s.from) / 180 * 100
          return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${top}%`, height: `${h}%`, background: i % 2 ? '#ffffff08' : '#00000022', borderTop: '1px solid #ffffff14' }}>
            <span style={{ position: 'absolute', left: 8, top: 4, fontSize: 9.5, color: C.faint }}>{s.name}</span>
          </div>
        })}
        {parts.map((p, i) => <div key={i} style={renderParticleStyle(p)} />)}
        <div style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)', fontSize: 30 }}>⛏</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>{Array.from({ length: maxStamina }).map((_, i) => <div key={i} style={{ flex: 1, height: 6, borderRadius: 4, background: i < stamina ? C.gold : '#ffffff18' }} />)}</div>
      <button onClick={dig} disabled={stamina <= 0} style={{ ...btnPrimary, padding: 15, opacity: stamina <= 0 ? 0.5 : 1 }}>{stamina <= 0 ? 'Shift over — haul up' : `Dig deeper  (−1 · ${stamina} left)`}</button>
      {stamina <= 0 && <button onClick={() => { setStamina(maxStamina); setLog([]) }} style={btnGhost}>Rest & start a new shift</button>}
      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.7 }}>{log.map((l, i) => <div key={i} style={{ opacity: 1 - i * 0.13 }}>{l}</div>)}</div>
    </div>
  )
}

/* ──────────────────────────────  TREAT LAB  ────────────────────────────── */
function TreatLab({ save, rough, onDone, go, unlockCodex }: any) {
  const [phase, setPhase] = useState<'aim' | 'hold' | 'done'>('aim')
  const [temp, setTemp] = useState<number | null>(null)
  const [holdOk, setHoldOk] = useState(0)
  const [needle, setNeedle] = useState(TREAT_IDEAL.min)
  const dir = useRef(1)
  const speed = 5.5 - save.upgrades.furnace * 0.5
  const windowPad = save.upgrades.furnace * 12 // furnace upgrade widens safe window
  const result = useRef<Treated | null>(null)

  useEffect(() => { unlockCodex('vanadium') }, []) // eslint-disable-line
  useEffect(() => {
    if (phase !== 'aim') return
    const t = setInterval(() => setNeedle(n => {
      let nn = n + dir.current * speed
      if (nn >= TREAT_IDEAL.max) { nn = TREAT_IDEAL.max; dir.current = -1 }
      if (nn <= TREAT_IDEAL.min) { nn = TREAT_IDEAL.min; dir.current = 1 }
      return nn
    }), 24)
    return () => clearInterval(t)
  }, [phase, speed])

  // hold ring shrinks; release near the middle
  const holdT = useRef(0)
  useEffect(() => {
    if (phase !== 'hold') return
    holdT.current = 0
    const t = setInterval(() => { holdT.current += 0.02; setHoldOk(1 - Math.abs(0.5 - (holdT.current % 1)) * 2) }, 20)
    return () => clearInterval(t)
  }, [phase])

  if (!rough) return <Empty go={go} />

  const loW = TREAT_IDEAL.lo - windowPad, hiW = TREAT_IDEAL.hi + windowPad
  function lockTemp() { sfxTap(); setTemp(needle); setPhase('hold') }
  function fire() {
    sfxReveal()
    const t = treat(rough, temp!, clamp01(holdOk))
    result.current = t; setPhase('done')
    if (t.cracked) sfxWrong(); else sfxCorrect()
    if (!save.codex.includes('heat')) unlockCodex('heat')
    onDone(t)
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <H title="Heat-treatment kiln" sub={`Rough tanzanite is reddish-brown. Near ${TREAT_IDEAL.lo}–${TREAT_IDEAL.hi}°C, vanadium flips and the blue appears. Overshoot fractured rough and it cracks.`} />
      <div style={{ textAlign: 'center' }}><Gem blue={phase === 'done' ? (result.current!.cracked ? result.current!.blue * 0.5 : result.current!.blue) : (temp ? 0.1 : 0)} orient={1} size={110} /></div>

      {phase === 'aim' && <>
        <TempBar needle={needle} loW={loW} hiW={hiW} />
        <button onClick={lockTemp} style={{ ...btnPrimary, padding: 14 }}>Lock temperature</button>
        <Hint>Stop the needle inside the blue window. A better kiln (upgrade) widens it.</Hint>
      </>}

      {phase === 'hold' && <>
        <div style={{ textAlign: 'center', color: C.dim, fontSize: 13 }}>Locked at <b style={{ color: temp! >= loW && temp! <= hiW ? C.good : C.bad }}>{Math.round(temp!)}°C</b>. Hold the soak — release at the centre.</div>
        <div style={{ display: 'grid', placeItems: 'center', height: 120 }}>
          <div style={{ position: 'relative', width: 110, height: 110 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${C.line}` }} />
            <div style={{ position: 'absolute', inset: `${(1 - (holdOk)) * 40}px`, borderRadius: '50%', border: `4px solid ${holdOk > 0.7 ? C.good : C.gold}`, transition: 'inset 0.02s linear' }} />
          </div>
        </div>
        <button onClick={fire} style={{ ...btnPrimary, padding: 14 }}>Release & fire</button>
      </>}

      {phase === 'done' && <>
        <Panel accent>
          {result.current!.cracked
            ? <div style={{ color: C.bad }}><b>It cracked.</b> Firing overshot through internal fractures. The stone survives but clarity took a hit — you can still salvage value at market.</div>
            : <div><b style={{ color: C.good }}>Transformation complete.</b> Blue driven to <b>{Math.round(result.current!.blue * 100)}%</b>. Clarity now {Math.round(result.current!.clarityAfter * 100)}%.</div>}
        </Panel>
        <button onClick={() => go(result.current!.cracked ? 'cut' : 'cut')} style={{ ...btnPrimary, padding: 14 }}>To the cutting wheel →</button>
      </>}
    </div>
  )
}
function TempBar({ needle, loW, hiW }: { needle: number; loW: number; hiW: number }) {
  const pct = (v: number) => (v - TREAT_IDEAL.min) / (TREAT_IDEAL.max - TREAT_IDEAL.min) * 100
  return (
    <div style={{ position: 'relative', height: 40, borderRadius: 10, background: 'linear-gradient(90deg,#6a4a2e,#b06a3a,#d98a4a,#e0c060,#e07a5a,#c04a5a)', border: `1px solid ${C.line}` }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(loW)}%`, width: `${pct(hiW) - pct(loW)}%`, background: 'rgba(120,160,255,0.35)', border: '1px solid rgba(160,190,255,0.8)', borderRadius: 6 }} />
      <div style={{ position: 'absolute', top: -6, bottom: -6, left: `${pct(needle)}%`, width: 3, background: '#fff', boxShadow: '0 0 8px #fff' }} />
      <span style={{ position: 'absolute', left: 6, top: 11, fontSize: 10, color: '#fff9' }}>{TREAT_IDEAL.min}°</span>
      <span style={{ position: 'absolute', right: 6, top: 11, fontSize: 10, color: '#fff9' }}>{TREAT_IDEAL.max}°</span>
    </div>
  )
}

/* ──────────────────────────────  CUT ROOM  ─────────────────────────────── */
function CutRoom({ save, treated, onDone, go, unlockCodex }: any) {
  const [orient, setOrient] = useState(0.5)
  const [shape, setShape] = useState<string>(SHAPES[1].id)
  useEffect(() => { unlockCodex('pleo') }, []) // eslint-disable-line
  if (!treated) return <Empty go={go} />
  // lapidary upgrade reduces the weight penalty of chasing blue
  const lapMul = 1 - save.upgrades.lapidary * 0.12
  const preview = cutStone(treated, shape, orient * lapMul)
  const g = grade(preview)

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <H title="Lapidary — cut for the blue" sub="Tanzanite is pleochroic: the same crystal shows blue, violet and burgundy down different axes. Orient the table to the blue — but chasing blue costs carat weight." />
      <div style={{ textAlign: 'center' }}><Gem blue={treated.blue} orient={0.4 + orient * 1.2} size={120} /></div>

      <Panel>
        <Row><span style={{ color: C.dim, fontSize: 12 }}>Orient to blue axis</span><b style={{ color: C.blue }}>{Math.round(orient * 100)}%</b></Row>
        <input type="range" min={0} max={1} step={0.01} value={orient} onChange={e => { setOrient(+e.target.value); sfxTap() }} style={{ width: '100%', accentColor: C.blue }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.faint }}><span>keep weight (violet)</span><span>chase blue (lighter)</span></div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {SHAPES.map(s => (
          <button key={s.id} onClick={() => { setShape(s.id); sfxClick() }} style={{ ...panelBase, padding: 10, cursor: 'pointer', border: `1px solid ${shape === s.id ? C.violet : C.line}`, background: shape === s.id ? '#2a2160' : panelBase.background }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>{s.name}</div>
            <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{Math.round(s.yield * 100)}% yield</div>
          </button>
        ))}
      </div>

      <Panel accent>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', fontSize: 12 }}>
          <div><div style={{ color: C.faint, fontSize: 10 }}>CARAT</div><b style={{ fontSize: 16 }}>{round2(preview.carat)}</b></div>
          <div><div style={{ color: C.faint, fontSize: 10 }}>COLOUR</div><b style={{ fontSize: 16, color: C.blue }}>{colorGradeOf(g.colorScore).grade.split(' ')[0]}</b></div>
          <div><div style={{ color: C.faint, fontSize: 10 }}>EST. VALUE</div><b style={{ fontSize: 16, color: C.gold }}>{fmt(g.value)}</b></div>
        </div>
      </Panel>
      <button onClick={() => { const c = cutStone(treated, shape, orient * lapMul); onDone(c); sfxReveal(); go('grade') }} style={{ ...btnPrimary, padding: 14 }}>Cut the stone →</button>
      <Hint>{SHAPES.find(s => s.id === shape)!.note}</Hint>
    </div>
  )
}

/* ────────────────────────────────  GRADE  ──────────────────────────────── */
function GradeRoom({ cut, onDone, go, unlockCodex }: any) {
  const [g] = useState<Graded | null>(cut ? grade(cut) : null)
  useEffect(() => { if (g) { onDone(g); unlockCodex('grade'); sfxScore() } }, []) // eslint-disable-line
  if (!g) return <Empty go={go} />
  const rows = [
    ['Colour', g.colorGrade, C.blue], ['Clarity', g.clarityGrade, C.text],
    ['Cut', g.cutGrade, C.text], ['Carat', `${round2(g.carat)} ct`, C.text],
  ]
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <H title="Grading report — the 4 Cs" sub="Colour dominates tanzanite value. A vivid, medium-dark violetish-blue is the summit." />
      <div style={{ textAlign: 'center' }}><Gem blue={g.blue} orient={g.orientBlue} size={120} /></div>
      <Panel accent>
        {rows.map(([k, v, col]: any) => <Row key={k}><span style={{ color: C.dim }}>{k}</span><b style={{ color: col }}>{v}</b></Row>)}
        <div style={{ height: 1, background: C.line, margin: '10px 0' }} />
        <Row><b>Appraised value</b><b style={{ color: C.gold, fontSize: 18 }}>{fmt(g.value)} TzNITE</b></Row>
        <div style={{ marginTop: 6 }}><div style={{ height: 6, borderRadius: 6, background: '#00000055' }}><div style={{ width: `${g.colorScore}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg,${C.blue},${C.violet})` }} /></div><div style={{ fontSize: 10.5, color: C.faint, marginTop: 3 }}>Colour score {g.colorScore}/100</div></div>
      </Panel>
      <button onClick={() => go('certify')} style={{ ...btnPrimary, padding: 14 }}>Authenticate & certify →</button>
    </div>
  )
}

/* ──────────────────────────────  CERTIFY  ──────────────────────────────── */
function CertRoom({ save, graded, cert, onCertify, go, unlockCodex }: any) {
  useEffect(() => { unlockCodex('ecert') }, []) // eslint-disable-line
  if (!graded) return <Empty go={go} />
  const fee = 120 + save.upgrades.lab * 40
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <H title="Tanzanite eCertificate" sub="A blockchain-anchored certificate of authenticity records the stone’s identity and origin — tamper-proof provenance that fights counterfeits and lifts value ~22%." />
      {!cert ? <>
        <Panel><Row><span style={{ color: C.dim }}>Certification fee</span><b>{fee} TzNITE</b></Row><Row><span style={{ color: C.dim }}>Premium if certified</span><b style={{ color: C.good }}>+22% value</b></Row></Panel>
        <button onClick={() => { if (save.tznite < fee) return; onCertify(graded); }} disabled={save.tznite < fee} style={{ ...btnPrimary, padding: 14, opacity: save.tznite < fee ? 0.5 : 1 }}>{save.tznite < fee ? 'Not enough TzNITE' : `Certify (−${fee})`}</button>
        <button onClick={() => go('market')} style={btnGhost}>Skip — sell uncertified</button>
      </> : <>
        <div style={{ borderRadius: 14, padding: 18, background: `linear-gradient(135deg,#1a1450,#2a1e66)`, border: `1px solid ${C.violet}`, boxShadow: `0 0 30px ${C.violet}44` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ letterSpacing: '0.1em' }}>eCERTIFICATE</b><Gem blue={graded.blue} orient={graded.orientBlue} size={40} /></div>
          <div style={{ fontFamily: 'monospace', fontSize: 15, color: C.gold, margin: '12px 0 4px' }}>{cert.serial}</div>
          <div style={{ fontSize: 11, color: C.dim, fontFamily: 'monospace', wordBreak: 'break-all' }}>hash: {cert.hash}{cert.hash}</div>
          <div style={{ fontSize: 12, color: C.dim, marginTop: 10, lineHeight: 1.6 }}>{round2(graded.carat)} ct · {graded.colorGrade} · {graded.clarityGrade}<br />Origin: Merelani, Block {graded.block} · {graded.depth} m</div>
        </div>
        <button onClick={() => go('market')} style={{ ...btnPrimary, padding: 14 }}>Take to market →</button>
      </>}
    </div>
  )
}

/* ────────────────────────────────  MARKET  ─────────────────────────────── */
function Market({ save, graded, cert, persist, rng, onSold, go, unlockCodex, flash }: any) {
  const [offers] = useState<Offer[]>(() => graded ? makeOffers(graded, !!cert, rng) : [])
  const [done, setDone] = useState<number | null>(null)
  if (!graded) return <Empty go={go} />
  useEffect(() => { if (offers.some(o => o.kind === 'collector')) unlockCodex('legacy') }, []) // eslint-disable-line

  function sell(o: Offer) {
    const gross = Math.round(graded.value * o.mult)
    sfxLevelUp()
    const before = rankOf(save.totalEarned).index
    const next = { ...save, tznite: save.tznite + gross, totalEarned: save.totalEarned + gross, stonesSold: save.stonesSold + 1, bestValue: Math.max(save.bestValue, gross) }
    persist(next); setDone(gross)
    if (rankOf(next.totalEarned).index > before) window.setTimeout(() => flash(`Promoted to ${rankOf(next.totalEarned).title}!`), 500)
    onSold()
  }

  if (done != null) return (
    <div style={{ display: 'grid', gap: 14, textAlign: 'center', paddingTop: 20 }}>
      <div style={{ fontSize: 40 }}>💠</div>
      <h2 style={{ margin: 0 }}>Sold for <span style={{ color: C.gold }}>{fmt(done)}</span> TzNITE</h2>
      <div style={{ color: C.dim, fontSize: 13 }}>Every finer, certified stone you sell builds the Tanzanite house — and keeps more of Merelani’s value at home.</div>
      <button onClick={() => go('mine')} style={{ ...btnPrimary, padding: 14 }}>Back to the mine →</button>
      <button onClick={() => go('hub')} style={btnGhost}>Return to site</button>
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <H title="The trading floor" sub="Colour is king and scarcity rules. Quick cash pays least; a certified, vivid stone can draw a collector paying far more — “sell less, for more.”" />
      <div style={{ textAlign: 'center' }}><Gem blue={graded.blue} orient={graded.orientBlue} size={90} /></div>
      <Panel><Row><b>{round2(graded.carat)} ct · {graded.colorGrade}</b><span style={{ color: cert ? C.good : C.faint, fontSize: 12 }}>{cert ? 'Certified ✓' : 'Uncertified'}</span></Row><Row><span style={{ color: C.dim, fontSize: 12 }}>Appraised</span><b style={{ color: C.gold }}>{fmt(graded.value)}</b></Row></Panel>
      {offers.map((o, i) => (
        <button key={i} onClick={() => sell(o)} style={{ ...panelBase, textAlign: 'left', cursor: 'pointer', display: 'block', border: `1px solid ${o.kind === 'collector' ? C.gold : C.line}` }}>
          <Row><b>{o.buyer}</b><b style={{ color: o.kind === 'collector' ? C.gold : C.text }}>{fmt(Math.round(graded.value * o.mult))}</b></Row>
          <div style={{ fontSize: 11.5, color: C.dim, marginTop: 3 }}>{o.note}</div>
        </button>
      ))}
    </div>
  )
}

/* ────────────────────────────────  SHOP  ──────────────────────────────── */
function Shop({ save, persist, flash }: any) {
  const keys = Object.keys(UPGRADE_META) as (keyof Upgrades)[]
  function buy(k: keyof Upgrades) {
    const lvl = save.upgrades[k]
    if (lvl >= UPGRADE_META[k].max) return
    const cost = upgradeCost(k, lvl)
    if (save.tznite < cost) { flash('Not enough TzNITE'); return }
    sfxLevelUp()
    persist({ ...save, tznite: save.tznite - cost, upgrades: { ...save.upgrades, [k]: lvl + 1 } })
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <H title="Upgrade your operation" sub="Reinvest TzNITE. Every level compounds — deeper digs, a wider safe kiln, less weight lost, a richer certified premium." />
      {keys.map(k => {
        const lvl = save.upgrades[k], meta = UPGRADE_META[k], maxed = lvl >= meta.max, cost = upgradeCost(k, lvl)
        return (
          <Panel key={k}>
            <Row><b>{meta.name}</b><span style={{ fontSize: 11, color: C.gold }}>Lv {lvl}/{meta.max}</span></Row>
            <div style={{ color: C.dim, fontSize: 12, margin: '4px 0 8px' }}>{meta.note}</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>{Array.from({ length: meta.max }).map((_, i) => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < lvl ? C.violet : '#ffffff18' }} />)}</div>
            <button onClick={() => buy(k)} disabled={maxed || save.tznite < cost} style={{ ...btnPrimary, width: '100%', padding: 10, opacity: maxed ? 0.4 : save.tznite < cost ? 0.5 : 1 }}>{maxed ? 'Maxed' : `Upgrade — ${fmt(cost)}`}</button>
          </Panel>
        )
      })}
    </div>
  )
}

/* ────────────────────────────────  CODEX  ─────────────────────────────── */
function Codex({ save }: any) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <H title="The Tanzanite Codex" sub={`${save.codex.length} of ${CODEX.length} facts unlocked — earned by playing. All are real.`} />
      {CODEX.map(f => {
        const got = save.codex.includes(f.id)
        return (
          <Panel key={f.id}>
            <Row><b style={{ color: got ? C.text : C.faint }}>{got ? f.title : '???'}</b>{got && <span style={{ color: C.gold, fontSize: 11 }}>✦</span>}</Row>
            <div style={{ color: got ? C.dim : C.faint, fontSize: 12.5, marginTop: 4, lineHeight: 1.55 }}>{got ? f.body : 'Locked — keep mining, treating and trading to reveal this.'}</div>
          </Panel>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────  primitives  ───────────────────────────── */
const panelBase: React.CSSProperties = { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, width: '100%', color: C.text }
function Panel({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return <div style={{ ...panelBase, border: `1px solid ${accent ? 'rgba(150,120,240,0.5)' : C.line}`, boxShadow: accent ? `0 0 24px rgba(120,90,240,0.15)` : undefined }}>{children}</div>
}
function Row({ children }: { children: React.ReactNode }) { return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>{children}</div> }
function H({ title, sub }: { title: string; sub?: string }) { return <div><h2 style={{ margin: '4px 0 2px', fontSize: 20, fontWeight: 800 }}>{title}</h2>{sub && <div style={{ color: C.dim, fontSize: 12.5, lineHeight: 1.5 }}>{sub}</div>}</div> }
function Hint({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 11.5, color: C.faint, fontStyle: 'italic', textAlign: 'center' }}>{children}</div> }
function Chip({ label, gold }: { label: string; gold?: boolean }) { return <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 999, background: gold ? 'rgba(217,180,106,0.15)' : 'rgba(120,110,200,0.15)', color: gold ? C.gold : C.dim, border: `1px solid ${gold ? 'rgba(217,180,106,0.3)' : C.line}` }}>{label}</span> }
function Empty({ go }: { go: any }) { return <div style={{ textAlign: 'center', padding: 40 }}><div style={{ color: C.dim }}>No stone in hand.</div><button onClick={() => go('mine')} style={{ ...btnPrimary, marginTop: 14 }}>Go mine →</button></div> }

const btnPrimary: React.CSSProperties = { background: `linear-gradient(90deg,${C.blue},${C.violet})`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', padding: '11px 16px' }
const btnGhost: React.CSSProperties = { background: 'transparent', color: C.dim, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 13, cursor: 'pointer', padding: '8px 14px' }
const btnTile: React.CSSProperties = { ...panelBase, cursor: 'pointer', fontSize: 22, textAlign: 'center', padding: '14px 8px' }
const tileLabel: React.CSSProperties = { fontSize: 12, color: C.dim, marginTop: 4, fontWeight: 600 }
const toastStyle: React.CSSProperties = { position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: '#2a2160ee', color: C.text, padding: '9px 16px', borderRadius: 999, fontSize: 13, border: `1px solid ${C.violet}`, boxShadow: '0 8px 30px #0008' }

function fmt(n: number): string { return Math.round(n).toLocaleString('en-US') }
