/* ============================================================================
   TANZANITE — "The Merelani Deep"    ·  KasukuGames flagship
   A complete gemstone-journey serious game: prospect → mine → heat-treat →
   cut → grade → certify → trade, with a rough bag, a stone vault, live smelt,
   mine & market events, commissions, trophies and a global house leaderboard.
   Every mechanic is grounded in real tanzanite science.
   ============================================================================ */
import { useEffect, useRef, useState, useCallback } from 'react'
import { sfxTap, sfxCorrect, sfxWrong, sfxReveal, sfxLevelUp, sfxScore, sfxClick } from '../lib/sfx'
import { type Particle, burstParticles, tickParticles, renderParticleStyle } from '../lib/vfx'
import { loadProfile } from '../lib/rewards'
import { pushHouse, fetchHouses, type HouseEntry } from '../lib/tanzaniteCloud'
import {
  MINERAL, STRATA, BLOCKS, SHAPES, CODEX, RANKS, UPGRADE_META, TREAT_IDEAL, TROPHIES, TIER_COLOR,
  strataAt, digRough, bonusRough, geodeRough, rollMineEvent, rollMarketEvent, treat, cutStone, grade, certify,
  makeOffers, rankOf, upgradeCost, gemColor, colorGradeOf, clamp01, round2,
  generateContract, contractMet, collectionValue,
  type BlockId, type Rough, type Treated, type Cut, type Graded, type Upgrades, type Offer,
  type MineEvent, type MarketEvent, type Contract,
} from '../lib/tanzanite'

interface Props { onBack: () => void; onGameEnd?: (r: { score: number; accuracy: number; level: number; maxScore?: number; timeMs?: number }) => void }

const C = {
  bg: '#0b0a1e', bg2: '#141033', panel: 'rgba(30,24,66,0.72)',
  line: 'rgba(150,140,220,0.18)', text: '#eae7ff', dim: '#a59fd0', faint: '#6f6aa0',
  blue: '#4f5bd5', violet: '#7a5cf0', gold: '#d9b46a', good: '#5fd39a', bad: '#e06a7a',
}
const SAVE_KEY = 'kg_tanzanite_v2'
type Stage = 'hub' | 'mine' | 'bag' | 'treat' | 'cut' | 'grade' | 'certify' | 'market'
  | 'codex' | 'shop' | 'contracts' | 'trophies' | 'vault' | 'ranks'

interface Save {
  tznite: number; upgrades: Upgrades; codex: string[]
  totalEarned: number; stonesSold: number; bestValue: number; deepest: number
  block: BlockId | null; depth: number
  inventory: Rough[]; vault: Graded[]; trophies: string[]
  contract: Contract | null; contractsDone: number; stonesProcessed: number
  soundOn: boolean; seenIntro: boolean
}
const freshSave = (): Save => ({
  tznite: 250, upgrades: { drill: 0, furnace: 0, lapidary: 0, lab: 0 }, codex: ['discovery'],
  totalEarned: 0, stonesSold: 0, bestValue: 0, deepest: 0, block: null, depth: 0,
  inventory: [], vault: [], trophies: [], contract: null, contractsDone: 0, stonesProcessed: 0,
  soundOn: true, seenIntro: false,
})
function loadSave(): Save {
  try {
    const s = { ...freshSave(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '') }
    // Self-heal: drop any malformed rough/stone that could crash a render.
    s.inventory = (Array.isArray(s.inventory) ? s.inventory : []).filter((r: any) => r && typeof r.caratRough === 'number')
    s.vault = (Array.isArray(s.vault) ? s.vault : []).filter((g: any) => g && typeof g.carat === 'number')
    return s
  } catch { return freshSave() }
}

let _rngState = (Date.now() % 2147483647) || 1
const rng = () => { _rngState = (_rngState * 48271) % 2147483647; return _rngState / 2147483647 }
const BAG_BASE = 4

export default function Tanzanite({ onBack, onGameEnd }: Props) {
  const [save, setSave] = useState<Save>(loadSave)
  const [stage, setStage] = useState<Stage>('hub')
  const [rough, setRough] = useState<Rough | null>(null)
  const [treated, setTreated] = useState<Treated | null>(null)
  const [cut, setCut] = useState<Cut | null>(null)
  const [graded, setGraded] = useState<Graded | null>(null)
  const [cert, setCert] = useState<{ serial: string; hash: string; bonus: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [trophyPop, setTrophyPop] = useState<string | null>(null)
  const saveRef = useRef(save); saveRef.current = save

  const sound = save.soundOn
  const sfx = { tap: () => sound && sfxTap(), correct: () => sound && sfxCorrect(), wrong: () => sound && sfxWrong(), reveal: () => sound && sfxReveal(), up: () => sound && sfxLevelUp(), score: () => sound && sfxScore(), click: () => sound && sfxClick() }

  const persist = useCallback((s: Save) => { setSave(s); saveRef.current = s; try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)) } catch { /* */ } }, [])
  const patch = useCallback((f: (s: Save) => Save) => persist(f(saveRef.current)), [persist])
  const flash = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(t => (t === m ? null : t)), 2400) }, [])

  const unlockCodex = useCallback((id: string) => {
    if (saveRef.current.codex.includes(id)) return
    patch(s => ({ ...s, codex: [...s.codex, id] }))
    const f = CODEX.find(c => c.id === id); if (f) window.setTimeout(() => flash(`Codex — ${f.title}`), 300)
  }, [patch, flash])

  const earnTrophy = useCallback((id: string) => {
    if (saveRef.current.trophies.includes(id)) return
    patch(s => ({ ...s, trophies: [...s.trophies, id] }))
    if (save.soundOn) sfxLevelUp()
    setTrophyPop(id); window.setTimeout(() => setTrophyPop(t => (t === id ? null : t)), 3200)
  }, [patch, save.soundOn])

  // push global house standing on mount + when net worth changes
  const netWorth = save.totalEarned + collectionValue(save.vault)
  useEffect(() => {
    const p = loadProfile()
    if (!p) return
    void pushHouse({ handle: p.username, name: p.displayName, avatar: p.avatar, photoUrl: p.photoUrl, netWorth, bestStone: save.bestValue, stonesSold: save.stonesSold, deepest: save.deepest, rankTitle: rankOf(save.totalEarned).title }, true)
  }, [netWorth]) // eslint-disable-line

  const back = () => { onGameEnd?.({ score: netWorth, accuracy: 1, level: rankOf(save.totalEarned).index + 1, maxScore: netWorth }); onBack() }
  const rank = rankOf(save.totalEarned)
  const startProcess = (r: Rough) => { setRough(r); setTreated(null); setCut(null); setGraded(null); setCert(null); setStage('treat') }

  if (!save.seenIntro) return <Intro onStart={() => patch(s => ({ ...s, seenIntro: true }))} />

  return (
    <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(1200px 700px at 50% -10%, ${C.bg2}, ${C.bg})`, color: C.text, fontFamily: 'system-ui, sans-serif', overflow: 'auto' }}>
      <style>{`@keyframes tzspin{to{transform:rotateY(360deg) rotate(360deg)}}@keyframes tzpulse{0%,100%{opacity:.5}50%{opacity:1}}@keyframes tzpop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}@keyframes tzrise{0%{transform:translateY(20px);opacity:0}100%{transform:translateY(0);opacity:1}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', position: 'sticky', top: 0, zIndex: 5, background: 'linear-gradient(#0b0a1eee,#0b0a1e00)' }}>
        <button onClick={stage === 'hub' ? back : () => setStage('hub')} style={btnGhost}>‹ {stage === 'hub' ? 'Exit' : 'Site'}</button>
        <div style={{ flex: 1 }} />
        <Chip label={rank.title} />
        <Chip label={`${fmt(save.tznite)} TzNITE`} gold />
      </div>

      {toast && <div style={toastStyle}>{toast}</div>}
      {trophyPop && <TrophyToast id={trophyPop} />}

      <div style={{ maxWidth: 660, margin: '0 auto', padding: '4px 16px 96px' }}>
        {stage === 'hub' && <Hub save={save} rank={rank} netWorth={netWorth} wip={{ rough, treated, cut, graded, cert }} go={setStage} resume={rough ? () => setStage(!treated ? 'treat' : treated.cracked ? 'market' : !cut ? 'cut' : !graded ? 'grade' : !cert ? 'certify' : 'market') : null} />}
        {stage === 'mine' && <Mine save={save} patch={patch} sfx={sfx} unlockCodex={unlockCodex} earnTrophy={earnTrophy} go={setStage} flash={flash} />}
        {stage === 'bag' && <Bag save={save} patch={patch} onProcess={startProcess} go={setStage} />}
        {stage === 'treat' && <TreatLab save={save} rough={rough} sfx={sfx} unlockCodex={unlockCodex} earnTrophy={earnTrophy} onDone={setTreated} go={setStage} />}
        {stage === 'cut' && <CutRoom save={save} treated={treated} sfx={sfx} unlockCodex={unlockCodex} onDone={setCut} go={setStage} />}
        {stage === 'grade' && <GradeRoom cut={cut} sfx={sfx} unlockCodex={unlockCodex} earnTrophy={earnTrophy} onDone={setGraded} go={setStage} />}
        {stage === 'certify' && <CertRoom save={save} graded={graded} cert={cert} patch={patch} sfx={sfx} unlockCodex={unlockCodex} earnTrophy={earnTrophy} onCertify={(g: Graded) => { const c = certify(g); setCert(c); patch(s => ({ ...s, tznite: s.tznite - (120 + s.upgrades.lab * 40) })); sfx.reveal(); flash(`Certified — ${c.serial}`) }} go={setStage} />}
        {stage === 'market' && <Market save={save} graded={graded} cert={cert} patch={patch} sfx={sfx} unlockCodex={unlockCodex} earnTrophy={earnTrophy} flash={flash} clearWip={() => { setRough(null); setTreated(null); setCut(null); setGraded(null); setCert(null) }} go={setStage} />}
        {stage === 'shop' && <Shop save={save} patch={patch} sfx={sfx} flash={flash} />}
        {stage === 'contracts' && <Contracts save={save} patch={patch} sfx={sfx} go={setStage} />}
        {stage === 'trophies' && <Trophies save={save} />}
        {stage === 'vault' && <Vault save={save} netWorth={netWorth} />}
        {stage === 'ranks' && <Ranks />}
        {stage === 'codex' && <Codex save={save} />}
      </div>
    </div>
  )
}

/* ───────────────────────────────  GEM  ─────────────────────────────────── */
function Gem({ blue, orient = 1, size = 120, spin = false }: { blue: number; orient?: number; size?: number; spin?: boolean }) {
  const { face, glow } = gemColor(blue, orient); const s = size
  return (
    <div style={{ width: s, height: s, position: 'relative', filter: `drop-shadow(0 0 ${s * 0.18}px ${glow})`, animation: spin ? 'tzspin 7s linear infinite' : undefined }}>
      <svg viewBox="0 0 100 100" width={s} height={s}>
        <defs><linearGradient id={`tzg${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.85" /><stop offset="0.28" stopColor={face} stopOpacity="0.95" /><stop offset="1" stopColor={face} /></linearGradient></defs>
        <polygon points="50,4 82,26 82,74 50,96 18,74 18,26" fill={`url(#tzg${size})`} stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        <polygon points="50,4 82,26 50,40 18,26" fill="#ffffff" opacity="0.18" />
        <polygon points="18,26 50,40 50,96 18,74" fill="#000" opacity="0.16" />
        <polygon points="82,26 50,40 50,96 82,74" fill="#000" opacity="0.28" />
        <polygon points="50,40 68,52 50,70 32,52" fill="#fff" opacity="0.12" />
        <polygon points="34,16 46,10 42,22" fill="#fff" opacity="0.55" />
      </svg>
    </div>
  )
}

/* ─────────────────────────────  INTRO  ─────────────────────────────────── */
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(900px 600px at 50% 30%, ${C.bg2}, ${C.bg})`, color: C.text, display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 460, textAlign: 'center' }}>
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 8 }}><Gem blue={0.9} size={120} spin /></div>
        <h1 style={{ margin: '6px 0 2px', fontSize: 30, fontWeight: 800, background: `linear-gradient(90deg,${C.blue},${C.violet},${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TANZANITE</h1>
        <div style={{ color: C.dim, letterSpacing: '0.16em', fontSize: 12 }}>THE MERELANI DEEP</div>
        <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.7, margin: '18px 0' }}>
          On a small stretch of Tanzanian earth lies the only tanzanite on Earth — a gem <b style={{ color: C.text }}>1000× rarer than diamond</b>. Mine it, unlock its blue in the kiln, cut for its living colour, certify it, and trade it to build a great <b style={{ color: C.gold }}>Tanzanite House</b>. Sell less, for more.
        </p>
        <button onClick={onStart} style={{ ...btnPrimary, padding: '14px 28px', fontSize: 16 }}>Begin ⛏</button>
        <div style={{ color: C.faint, fontSize: 11, marginTop: 14 }}>{MINERAL.formula} · discovered 1967 · named by {MINERAL.namedBy.split(' (')[0]}</div>
      </div>
    </div>
  )
}

/* ──────────────────────────────  HUB  ──────────────────────────────────── */
function Hub({ save, rank, netWorth, wip, go, resume }: any) {
  const { rough, treated, cut, graded, cert } = wip
  const blue = graded?.blue ?? cut?.blue ?? treated?.blue ?? 0
  const orient = graded?.orientBlue ?? cut?.orientBlue ?? 1
  const pct = rank.next ? Math.min(100, Math.round((save.totalEarned - RANKS[rank.index].at) / (rank.next - RANKS[rank.index].at) * 100)) : 100
  const nextLabel: any = { treat: 'Heat-treat', cut: 'Cut & polish', grade: 'Grade it', certify: 'Certify', market: 'Take to market' }
  const contract = save.contract
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
        <Gem blue={rough ? blue : 0.85} orient={orient} size={128} spin={!rough} />
        <h1 style={{ margin: '8px 0 0', fontSize: 25, fontWeight: 800, background: `linear-gradient(90deg,${C.blue},${C.violet},${C.gold})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TANZANITE</h1>
        <div style={{ color: C.dim, fontSize: 12, letterSpacing: '0.14em' }}>THE MERELANI DEEP</div>
      </div>

      <Panel>
        <Row><b>{rank.title}</b><span style={{ color: C.dim, fontSize: 12 }}>{rank.next ? `${fmt(save.totalEarned)} / ${fmt(rank.next)}` : 'Max rank'}</span></Row>
        <div style={{ height: 8, borderRadius: 8, background: '#00000055', overflow: 'hidden', marginTop: 8 }}><div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${C.blue},${C.gold})` }} /></div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12, color: C.dim, flexWrap: 'wrap' }}>
          <span>House worth <b style={{ color: C.gold }}>{fmt(netWorth)}</b></span>
          <span>Sold <b style={{ color: C.text }}>{save.stonesSold}</b></span>
          <span>Best <b style={{ color: C.text }}>{fmt(save.bestValue)}</b></span>
          <span>Deepest <b style={{ color: C.text }}>{save.deepest} m</b></span>
        </div>
      </Panel>

      {contract && <button onClick={() => go('contracts')} style={{ ...panelBase, cursor: 'pointer', textAlign: 'left', border: `1px solid ${C.gold}66` }}>
        <Row><b style={{ color: C.gold }}>◆ Commission — {contract.buyer}</b><span style={{ fontSize: 11, color: C.dim }}>{contract.expiresIn} stones left</span></Row>
        <div style={{ fontSize: 12, color: C.dim, marginTop: 4 }}>Wants ≥{contract.minCarat} ct · colour ≥{contract.minColor}{contract.needCert ? ' · certified' : ''} → <b style={{ color: C.gold }}>{fmt(contract.reward)}</b></div>
      </button>}

      {rough ? (
        <Panel accent>
          <Row><b>In hand</b><span style={{ color: C.gold, fontSize: 12 }}>{round2(cut?.carat ?? rough.caratRough)} ct</span></Row>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <Gem blue={blue} orient={orient} size={60} />
            <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5, flex: 1 }}>
              {graded ? <>Graded <b style={{ color: C.text }}>{graded.colorGrade}</b> · {fmt(graded.value)}{cert ? ' · certified' : ''}</>
                : treated?.cracked ? <span style={{ color: C.bad }}>Cracked — salvage at market.</span>
                : treated ? <>Treated · blue {Math.round(treated.blue * 100)}%</>
                : <>Rough · Block {rough.block}, {rough.depth} m.</>}
            </div>
          </div>
          {resume && <button onClick={resume} style={{ ...btnPrimary, marginTop: 12, width: '100%' }}>{nextLabel[!treated ? 'treat' : treated.cracked ? 'market' : !cut ? 'cut' : !graded ? 'grade' : !cert ? 'certify' : 'market']} →</button>}
        </Panel>
      ) : save.inventory.length ? (
        <button onClick={() => go('bag')} style={{ ...btnPrimary, padding: 15, fontSize: 15 }}>💼  Open the bag · {save.inventory.length} rough</button>
      ) : (
        <button onClick={() => go('mine')} style={{ ...btnPrimary, padding: 16, fontSize: 16 }}>⛏  Descend the mine</button>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Tile icon="⛏" label="Mine" onClick={() => go('mine')} />
        <Tile icon="💼" label={`Bag ${save.inventory.length}`} onClick={() => go('bag')} />
        <Tile icon="◆" label="Commissions" onClick={() => go('contracts')} />
        <Tile icon="🏛" label={`Vault ${save.vault.length}`} onClick={() => go('vault')} />
        <Tile icon="🏆" label={`Trophies ${save.trophies.length}/${TROPHIES.length}`} onClick={() => go('trophies')} />
        <Tile icon="🌍" label="House ranks" onClick={() => go('ranks')} />
        <Tile icon="⚙" label="Upgrades" onClick={() => go('shop')} />
        <Tile icon="📖" label={`Codex ${save.codex.length}/${CODEX.length}`} onClick={() => go('codex')} />
        <Tile icon="💠" label="Market" onClick={() => go('market')} dim={!graded} />
      </div>
      <div style={{ textAlign: 'center', color: C.faint, fontSize: 11 }}>Blue gem zoisite · {MINERAL.formula} · found only at Merelani, Tanzania</div>
    </div>
  )
}

/* ──────────────────────────────  MINE  ─────────────────────────────────── */
function Mine({ save, patch, sfx, unlockCodex, earnTrophy, go, flash }: any) {
  const [block, setBlock] = useState<BlockId | null>(save.block)
  const [depth, setDepth] = useState<number>(save.depth || 0)
  const [stamina, setStamina] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [parts, setParts] = useState<Particle[]>([])
  const [event, setEvent] = useState<MineEvent | null>(null)
  const [seamBoost, setSeamBoost] = useState(0)
  const bag = BAG_BASE + save.upgrades.drill
  const maxStamina = 10 + save.upgrades.drill * 3
  const step = 8 + save.upgrades.drill * 3
  const inv = useRef<Rough[]>([...save.inventory])

  useEffect(() => { if (block && stamina === 0 && !log.length) setStamina(maxStamina) }, [block]) // eslint-disable-line
  useEffect(() => { if (!parts.length) return; const t = setInterval(() => setParts(p => { const n = tickParticles(p); if (!n.length) clearInterval(t); return n }), 33); return () => clearInterval(t) }, [parts.length])

  if (!block) return (
    <div style={{ display: 'grid', gap: 12 }}>
      <H title="Choose your block" sub="Merelani is split into mining blocks. Deeper, richer ground pays more — and punishes more." />
      {BLOCKS.map(b => <button key={b.id} onClick={() => { sfx.click(); setBlock(b.id); patch((s: Save) => ({ ...s, block: b.id })); unlockCodex('blocks') }} style={{ ...panelBase, textAlign: 'left', cursor: 'pointer', display: 'block' }}>
        <Row><b>{b.name}</b><span style={{ fontSize: 11, color: C.gold }}>grade ×{b.gradeMul} · risk ×{b.hazardMul}</span></Row>
        <div style={{ color: C.dim, fontSize: 12.5, marginTop: 4 }}>{b.hint}</div>
      </button>)}
    </div>
  )

  const strata = strataAt(depth)
  const addRough = (r: Rough | null) => { if (!r) return false; if (inv.current.length >= bag) { flash('Bag is full — process or sell first.'); return false } inv.current.push(r); patch((s: Save) => ({ ...s, inventory: [...inv.current] })); return true }

  function resolveEvent(ev: MineEvent) {
    if (ev.kind === 'bad') { sfx.wrong(); setStamina(ev.id === 'rockfall' ? Math.max(0, Math.floor(stamina / 2)) : 0); setEvent(ev); unlockCodex('oxygen') }
    else if (ev.id === 'vug') { addRough(bonusRough(block!, depth, rng)); setParts(burstParticles(50, 40, C.violet, 16)); setEvent(ev) }
    else if (ev.id === 'geode') { earnTrophy('geode'); const r = geodeRough(block!, depth, rng); addRough(r); setParts(burstParticles(50, 40, C.gold, 30)); sfx.up(); setEvent(ev) }
    else if (ev.id === 'seam') { setSeamBoost(0.25); setEvent(ev) }
    else { unlockCodex('formed'); setEvent(ev) }
  }

  function dig() {
    if (stamina <= 0) { flash('Shift over — rest.'); return }
    sfx.tap()
    const nd = depth + step; setDepth(nd); setStamina(s => s - 1)
    patch((s: Save) => ({ ...s, depth: nd, deepest: Math.max(s.deepest, nd) }))
    if (nd >= 120) earnTrophy('reef'); if (nd >= 300) unlockCodex('formed'); if (nd > 600) { earnTrophy('abyss'); unlockCodex('rarity') }
    const s2 = strataAt(nd); const blk = BLOCKS.find(b => b.id === block)!
    const ev = rollMineEvent(s2.hazard, blk.hazardMul, rng)
    if (ev) { resolveEvent(ev); return }
    let r = digRough(block!, nd, rng)
    if (!r && seamBoost && rng() < seamBoost) r = digRough(block!, nd + 80, () => 0.5)
    if (r) { sfx.correct(); setParts(burstParticles(50, 40, C.violet, 18)); if (addRough(r)) setLog(l => [`💎 Struck a pocket at ${nd} m — ${round2(r!.caratRough)} ct to the bag.`, ...l].slice(0, 6)) }
    else setLog(l => [`${s2.name}: ${s2.rock}. Nothing yet.`, ...l].slice(0, 6))
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {event && <EventModal ev={event} onClose={() => setEvent(null)} />}
      <H title={`Block ${block} · ${depth} m`} sub={`${strata.name} — ${strata.note}`} />
      <div style={{ position: 'relative', height: 176, borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.line}`, background: 'linear-gradient(180deg,#2a2140,#120e26)' }}>
        {STRATA.map((s, i) => { const top = Math.max(0, Math.min(100, (s.from - Math.max(0, depth - 90)) / 180 * 100)); const h = (s.to - s.from) / 180 * 100; return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${top}%`, height: `${h}%`, background: i % 2 ? '#ffffff08' : '#00000022', borderTop: '1px solid #ffffff14' }}><span style={{ position: 'absolute', left: 8, top: 4, fontSize: 9.5, color: C.faint }}>{s.name}</span></div> })}
        {parts.map((p, i) => <div key={i} style={renderParticleStyle(p)} />)}
        <div style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)', fontSize: 30 }}>⛏</div>
        <div style={{ position: 'absolute', right: 8, top: 6, fontSize: 11, color: C.dim }}>Bag {save.inventory.length}/{bag}</div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>{Array.from({ length: maxStamina }).map((_, i) => <div key={i} style={{ flex: 1, height: 6, borderRadius: 4, background: i < stamina ? C.gold : '#ffffff18' }} />)}</div>
      <button onClick={dig} disabled={stamina <= 0} style={{ ...btnPrimary, padding: 15, opacity: stamina <= 0 ? 0.5 : 1 }}>{stamina <= 0 ? 'Shift over' : `Dig deeper (−1 · ${stamina})`}</button>
      {stamina <= 0 && <div style={{ display: 'flex', gap: 8 }}><button onClick={() => { setStamina(maxStamina); setLog([]); setSeamBoost(0) }} style={{ ...btnGhost, flex: 1 }}>New shift</button>{save.inventory.length > 0 && <button onClick={() => go('bag')} style={{ ...btnPrimary, flex: 1 }}>Bag ({save.inventory.length}) →</button>}</div>}
      <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.7 }}>{log.map((l, i) => <div key={i} style={{ opacity: 1 - i * 0.13 }}>{l}</div>)}</div>
    </div>
  )
}
function EventModal({ ev, onClose }: { ev: MineEvent; onClose: () => void }) {
  const col = ev.kind === 'jackpot' ? C.gold : ev.kind === 'bad' ? C.bad : ev.kind === 'good' ? C.good : C.blue
  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#0008', display: 'grid', placeItems: 'center', zIndex: 30, padding: 24 }}>
    <div style={{ ...panelBase, maxWidth: 360, border: `1px solid ${col}`, boxShadow: `0 0 40px ${col}55`, animation: 'tzpop .3s' }}>
      <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 6 }}>{ev.kind === 'jackpot' ? '💎' : ev.kind === 'bad' ? '⚠' : ev.kind === 'good' ? '✨' : '🪨'}</div>
      <h3 style={{ margin: 0, textAlign: 'center', color: col }}>{ev.title}</h3>
      <p style={{ fontSize: 13, color: C.dim, textAlign: 'center', lineHeight: 1.6 }}>{ev.body}</p>
      <button onClick={onClose} style={{ ...btnPrimary, width: '100%' }}>Continue</button>
    </div>
  </div>
}

/* ──────────────────────────────  BAG  ──────────────────────────────────── */
function Bag({ save, patch, onProcess, go }: any) {
  const bag = BAG_BASE + save.upgrades.drill
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <H title={`The rough bag · ${save.inventory.length}/${bag}`} sub="Every rough you hauled up. Pick one to run through the kiln, wheel and grading bench." />
      {save.inventory.length === 0 ? <Empty go={go} /> : save.inventory.map((r: Rough) => (
        <Panel key={r.id}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Gem blue={0.08} size={54} />
            <div style={{ flex: 1 }}>
              <Row><b>{round2(r.caratRough)} ct rough</b><span style={{ fontSize: 11, color: C.gold }}>Block {r.block} · {r.depth} m</span></Row>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.dim, marginTop: 4 }}>
                <span>vanadium <b style={{ color: C.blue }}>{Math.round(r.vanadium * 100)}%</b></span>
                <span>clarity {Math.round(r.clarity * 100)}%</span>
                <span>fracture {Math.round(r.fracture * 100)}%</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => { patch((s: Save) => ({ ...s, inventory: s.inventory.filter(x => x.id !== r.id) })); onProcess(r) }} style={{ ...btnPrimary, flex: 1 }}>Process →</button>
            <button onClick={() => patch((s: Save) => ({ ...s, inventory: s.inventory.filter(x => x.id !== r.id), tznite: s.tznite + Math.round(r.caratRough * 6) }))} style={btnGhost}>Sell rough (+{Math.round(r.caratRough * 6)})</button>
          </div>
        </Panel>
      ))}
      <button onClick={() => go('mine')} style={btnGhost}>Back to the mine →</button>
    </div>
  )
}

/* ─────────────────────────  TREAT (animated smelt)  ────────────────────── */
function TreatLab({ save, rough, sfx, onDone, go, unlockCodex, earnTrophy }: any) {
  const [phase, setPhase] = useState<'aim' | 'hold' | 'smelt' | 'done'>('aim')
  const [temp, setTemp] = useState<number | null>(null)
  const [holdOk, setHoldOk] = useState(0)
  const [needle, setNeedle] = useState(TREAT_IDEAL.min)
  const [smelt, setSmelt] = useState(0)
  const [parts, setParts] = useState<Particle[]>([])
  const dir = useRef(1)
  const speed = 5.5 - save.upgrades.furnace * 0.5
  const pad = save.upgrades.furnace * 12
  const result = useRef<Treated | null>(null)
  useEffect(() => { unlockCodex('vanadium') }, []) // eslint-disable-line

  useEffect(() => { if (phase !== 'aim') return; const t = setInterval(() => setNeedle(n => { let nn = n + dir.current * speed; if (nn >= TREAT_IDEAL.max) { nn = TREAT_IDEAL.max; dir.current = -1 } if (nn <= TREAT_IDEAL.min) { nn = TREAT_IDEAL.min; dir.current = 1 } return nn }), 24); return () => clearInterval(t) }, [phase, speed])
  const holdT = useRef(0)
  useEffect(() => { if (phase !== 'hold') return; holdT.current = 0; const t = setInterval(() => { holdT.current += 0.02; setHoldOk(1 - Math.abs(0.5 - (holdT.current % 1)) * 2) }, 20); return () => clearInterval(t) }, [phase])
  // the cinematic smelt: ramp 0->1 over ~2.2s, then reveal. Uses a time-based
  // interval (not rAF, which pauses on a backgrounded tab) + a safety net so it
  // can never soft-lock.
  useEffect(() => {
    if (phase !== 'smelt') return
    const t0 = performance.now()
    let done = false
    const finish = () => { if (done) return; done = true; const r = result.current!; if (r.cracked) sfx.wrong(); else { sfx.correct(); if (r.blue > 0.12) earnTrophy('first-blue') } setPhase('done'); onDone(r) }
    const iv = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / 2200)
      setSmelt(p)
      setParts(pp => tickParticles([...pp, ...burstParticles(50, 60, '#e0904a', 2)]).slice(-40))
      if (p >= 1) { clearInterval(iv); finish() }
    }, 45)
    const safety = window.setTimeout(finish, 4200)
    return () => { clearInterval(iv); clearTimeout(safety) }
  }, [phase]) // eslint-disable-line

  if (!rough) return <Empty go={go} />
  const loW = TREAT_IDEAL.lo - pad, hiW = TREAT_IDEAL.hi + pad
  const shownBlue = phase === 'smelt' ? smelt * (result.current?.blue ?? 0) : phase === 'done' ? (result.current!.cracked ? result.current!.blue * 0.5 : result.current!.blue) : (temp ? 0.08 : 0)

  function fire() { const t = treat(rough, temp!, clamp01(holdOk)); result.current = t; if (!save.codex.includes('heat')) unlockCodex('heat'); setPhase('smelt') }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <H title="Heat-treatment kiln" sub={`Rough tanzanite is reddish-brown. Near ${TREAT_IDEAL.lo}–${TREAT_IDEAL.hi}°C the vanadium flips and the blue appears. Overshoot fractured rough and it cracks.`} />
      <div style={{ textAlign: 'center', position: 'relative', height: 150 }}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          {(phase === 'smelt' || phase === 'hold') && <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,150,60,${0.15 + (phase === 'smelt' ? smelt : holdOk) * 0.35}), transparent 70%)` }} />}
          <Gem blue={shownBlue} orient={1} size={112} />
        </div>
        {parts.map((p, i) => <div key={i} style={renderParticleStyle(p)} />)}
      </div>

      {phase === 'aim' && <><TempBar needle={needle} loW={loW} hiW={hiW} /><button onClick={() => { sfx.tap(); setTemp(needle); setPhase('hold') }} style={{ ...btnPrimary, padding: 14 }}>Lock temperature</button><Hint>Stop the needle inside the blue window. A better kiln widens it.</Hint></>}
      {phase === 'hold' && <><div style={{ textAlign: 'center', color: C.dim, fontSize: 13 }}>Locked at <b style={{ color: temp! >= loW && temp! <= hiW ? C.good : C.bad }}>{Math.round(temp!)}°C</b>. Hold the soak — release at the centre.</div><div style={{ display: 'grid', placeItems: 'center', height: 110 }}><div style={{ position: 'relative', width: 100, height: 100 }}><div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${C.line}` }} /><div style={{ position: 'absolute', inset: `${(1 - holdOk) * 38}px`, borderRadius: '50%', border: `4px solid ${holdOk > 0.7 ? C.good : C.gold}` }} /></div></div><button onClick={fire} style={{ ...btnPrimary, padding: 14 }}>Release & fire</button></>}
      {phase === 'smelt' && <div style={{ textAlign: 'center', color: C.gold, fontSize: 14, fontWeight: 700, animation: 'tzpulse 1s infinite' }}>Firing… {Math.round(smelt * (temp ?? 0))}°C</div>}
      {phase === 'done' && <><Panel accent>{result.current!.cracked ? <div style={{ color: C.bad }}><b>It cracked.</b> The fire overshot through internal fractures — clarity fell, but you can still salvage value.</div> : <div><b style={{ color: C.good }}>The blue awakens.</b> Vanadium driven to <b>{Math.round(result.current!.blue * 100)}%</b>; clarity {Math.round(result.current!.clarityAfter * 100)}%.</div>}</Panel><button onClick={() => go('cut')} style={{ ...btnPrimary, padding: 14 }}>To the cutting wheel →</button></>}
    </div>
  )
}
function TempBar({ needle, loW, hiW }: { needle: number; loW: number; hiW: number }) {
  const pct = (v: number) => (v - TREAT_IDEAL.min) / (TREAT_IDEAL.max - TREAT_IDEAL.min) * 100
  return <div style={{ position: 'relative', height: 40, borderRadius: 10, background: 'linear-gradient(90deg,#6a4a2e,#b06a3a,#d98a4a,#e0c060,#e07a5a,#c04a5a)', border: `1px solid ${C.line}` }}>
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pct(loW)}%`, width: `${pct(hiW) - pct(loW)}%`, background: 'rgba(120,160,255,0.35)', border: '1px solid rgba(160,190,255,0.8)', borderRadius: 6 }} />
    <div style={{ position: 'absolute', top: -6, bottom: -6, left: `${pct(needle)}%`, width: 3, background: '#fff', boxShadow: '0 0 8px #fff' }} />
    <span style={{ position: 'absolute', left: 6, top: 11, fontSize: 10, color: '#fff9' }}>{TREAT_IDEAL.min}°</span><span style={{ position: 'absolute', right: 6, top: 11, fontSize: 10, color: '#fff9' }}>{TREAT_IDEAL.max}°</span>
  </div>
}

/* ──────────────────────────────  CUT  ──────────────────────────────────── */
function CutRoom({ save, treated, sfx, onDone, go, unlockCodex }: any) {
  const [orient, setOrient] = useState(0.5); const [shape, setShape] = useState<string>(SHAPES[1].id)
  useEffect(() => { unlockCodex('pleo') }, []) // eslint-disable-line
  if (!treated) return <Empty go={go} />
  const lapMul = 1 - save.upgrades.lapidary * 0.12
  const g = grade(cutStone(treated, shape, orient * lapMul))
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <H title="Lapidary — cut for the blue" sub="Tanzanite is pleochroic: the same crystal shows blue, violet and burgundy down different axes. Orient the table to the blue — but chasing blue costs carat weight." />
      <div style={{ textAlign: 'center' }}><Gem blue={treated.blue} orient={0.4 + orient * 1.2} size={118} /></div>
      <Panel>
        <Row><span style={{ color: C.dim, fontSize: 12 }}>Orient to blue axis</span><b style={{ color: C.blue }}>{Math.round(orient * 100)}%</b></Row>
        <input type="range" min={0} max={1} step={0.01} value={orient} onChange={e => { setOrient(+e.target.value); sfx.tap() }} style={{ width: '100%', accentColor: C.blue }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.faint }}><span>keep weight (violet)</span><span>chase blue (lighter)</span></div>
      </Panel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>{SHAPES.map(s => <button key={s.id} onClick={() => { setShape(s.id); sfx.click() }} style={{ ...panelBase, padding: 10, cursor: 'pointer', border: `1px solid ${shape === s.id ? C.violet : C.line}`, background: shape === s.id ? '#2a2160' : panelBase.background }}><div style={{ fontSize: 12.5, fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{Math.round(s.yield * 100)}% yield</div></button>)}</div>
      <Panel accent><div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', fontSize: 12 }}><div><div style={{ color: C.faint, fontSize: 10 }}>CARAT</div><b style={{ fontSize: 16 }}>{round2(g.carat)}</b></div><div><div style={{ color: C.faint, fontSize: 10 }}>COLOUR</div><b style={{ fontSize: 16, color: C.blue }}>{colorGradeOf(g.colorScore).grade.split(' ')[0]}</b></div><div><div style={{ color: C.faint, fontSize: 10 }}>EST. VALUE</div><b style={{ fontSize: 16, color: C.gold }}>{fmt(g.value)}</b></div></div></Panel>
      <button onClick={() => { onDone(cutStone(treated, shape, orient * lapMul)); sfx.reveal(); go('grade') }} style={{ ...btnPrimary, padding: 14 }}>Cut the stone →</button>
      <Hint>{SHAPES.find(s => s.id === shape)!.note}</Hint>
    </div>
  )
}

/* ─────────────────────────────  GRADE  ─────────────────────────────────── */
function GradeRoom({ cut, sfx, onDone, go, unlockCodex, earnTrophy }: any) {
  const [g] = useState<Graded | null>(cut ? grade(cut) : null)
  useEffect(() => { if (g) { onDone(g); unlockCodex('grade'); sfx.score(); if (g.colorScore >= 90) earnTrophy('exceptional') } }, []) // eslint-disable-line
  if (!g) return <Empty go={go} />
  const rows: any[] = [['Colour', g.colorGrade, C.blue], ['Clarity', g.clarityGrade, C.text], ['Cut', g.cutGrade, C.text], ['Carat', `${round2(g.carat)} ct`, C.text]]
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <H title="Grading report — the 4 Cs" sub="Colour dominates tanzanite value. A vivid, medium-dark violetish-blue is the summit." />
      <div style={{ textAlign: 'center' }}><Gem blue={g.blue} orient={g.orientBlue} size={118} /></div>
      <Panel accent>{rows.map(([k, v, col]) => <Row key={k}><span style={{ color: C.dim }}>{k}</span><b style={{ color: col }}>{v}</b></Row>)}<div style={{ height: 1, background: C.line, margin: '10px 0' }} /><Row><b>Appraised value</b><b style={{ color: C.gold, fontSize: 18 }}>{fmt(g.value)} TzNITE</b></Row><div style={{ marginTop: 6 }}><div style={{ height: 6, borderRadius: 6, background: '#00000055' }}><div style={{ width: `${g.colorScore}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg,${C.blue},${C.violet})` }} /></div><div style={{ fontSize: 10.5, color: C.faint, marginTop: 3 }}>Colour score {g.colorScore}/100</div></div></Panel>
      <button onClick={() => go('certify')} style={{ ...btnPrimary, padding: 14 }}>Authenticate & certify →</button>
    </div>
  )
}

/* ────────────────────────────  CERTIFY  ────────────────────────────────── */
function CertRoom({ save, graded, cert, onCertify, go, unlockCodex, earnTrophy }: any) {
  useEffect(() => { unlockCodex('ecert') }, []) // eslint-disable-line
  if (!graded) return <Empty go={go} />
  const fee = 120 + save.upgrades.lab * 40
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <H title="Tanzanite eCertificate" sub="A blockchain-anchored certificate records the stone’s identity and origin — tamper-proof provenance that fights counterfeits and lifts value ~22%." />
      {!cert ? <>
        <Panel><Row><span style={{ color: C.dim }}>Certification fee</span><b>{fee} TzNITE</b></Row><Row><span style={{ color: C.dim }}>Premium if certified</span><b style={{ color: C.good }}>+22% value</b></Row></Panel>
        <button onClick={() => { if (save.tznite < fee) return; onCertify(graded); earnTrophy('first-cert') }} disabled={save.tznite < fee} style={{ ...btnPrimary, padding: 14, opacity: save.tznite < fee ? 0.5 : 1 }}>{save.tznite < fee ? 'Not enough TzNITE' : `Certify (−${fee})`}</button>
        <button onClick={() => go('market')} style={btnGhost}>Skip — sell uncertified</button>
      </> : <>
        <div style={{ borderRadius: 14, padding: 18, background: 'linear-gradient(135deg,#1a1450,#2a1e66)', border: `1px solid ${C.violet}`, boxShadow: `0 0 30px ${C.violet}44` }}>
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

/* ─────────────────────────────  MARKET  ────────────────────────────────── */
function Market({ save, graded, cert, patch, sfx, unlockCodex, earnTrophy, flash, clearWip, go }: any) {
  const [mkt] = useState<MarketEvent>(() => rollMarketEvent(rng))
  const [offers] = useState<Offer[]>(() => graded ? makeOffers(graded, !!cert, rng) : [])
  const [done, setDone] = useState<{ gross: number; kept: boolean } | null>(null)
  useEffect(() => { if (graded && offers.some(o => o.kind === 'collector')) unlockCodex('legacy') }, []) // eslint-disable-line

  const finishStone = (extra?: (s: Save) => Save) => {
    // contract check + expiry decrement
    patch((s: Save) => {
      let n = { ...s, stonesProcessed: s.stonesProcessed + 1 }
      if (n.contract) {
        if (contractMet(graded, !!cert, n.contract)) { n = { ...n, tznite: n.tznite + n.contract.reward, totalEarned: n.totalEarned + n.contract.reward, contract: null, contractsDone: n.contractsDone + 1 }; window.setTimeout(() => flash(`Commission fulfilled — +${fmt(s.contract!.reward)}!`), 700); if (n.contractsDone >= 3) earnTrophy('contract3') }
        else { const left = n.contract.expiresIn - 1; n = { ...n, contract: left <= 0 ? null : { ...n.contract, expiresIn: left } } }
      }
      return extra ? extra(n) : n
    })
    clearWip()
  }

  function sell(o: Offer) {
    const gross = Math.round(graded.value * o.mult * mkt.mult)
    sfx.up()
    patch((s: Save) => ({ ...s, tznite: s.tznite + gross, totalEarned: s.totalEarned + gross, stonesSold: s.stonesSold + 1, bestValue: Math.max(s.bestValue, gross) }))
    earnTrophy('first-sale'); if (o.kind === 'collector') earnTrophy('collector')
    const before = rankOf(saveRefRank(save)).index
    finishStone()
    const after = rankOf(save.totalEarned + gross).index
    if (after > before) { const t = rankOf(save.totalEarned + gross).title; window.setTimeout(() => flash(`Promoted to ${t}!`), 500); if (t === 'Tanzanite House') earnTrophy('house'); if (after >= RANKS.length - 1) earnTrophy('legend') }
    setDone({ gross, kept: false })
  }
  function keep() {
    sfx.reveal(); finishStone((s: Save) => ({ ...s, vault: [...s.vault, { ...graded }] }))
    if (save.vault.length + 1 >= 5) earnTrophy('vault5'); unlockCodex('vault')
    setDone({ gross: 0, kept: true })
  }

  if (done) return (
    <div style={{ display: 'grid', gap: 14, textAlign: 'center', paddingTop: 20 }}>
      <div style={{ fontSize: 40 }}>{done.kept ? '🏛' : '💠'}</div>
      <h2 style={{ margin: 0 }}>{done.kept ? 'Held in your vault' : <>Sold for <span style={{ color: C.gold }}>{fmt(done.gross)}</span> TzNITE</>}</h2>
      <div style={{ color: C.dim, fontSize: 13 }}>{done.kept ? 'The finest stones appreciate as the deposit nears its end.' : 'Every finer, certified stone builds the Tanzanite house — and keeps Merelani’s value at home.'}</div>
      <button onClick={() => go(save.inventory.length ? 'bag' : 'mine')} style={{ ...btnPrimary, padding: 14 }}>{save.inventory.length ? 'Open the bag →' : 'Back to the mine →'}</button>
      <button onClick={() => go('hub')} style={btnGhost}>Return to site</button>
    </div>
  )

  if (!graded) return <Empty go={go} />
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <H title="The trading floor" sub="Colour is king and scarcity rules. A certified, vivid stone can draw a collector paying far more — sell less, for more." />
      <div style={{ ...panelBase, border: `1px solid ${mkt.mult >= 1.1 ? C.good : mkt.mult < 1 ? C.bad : C.line}`, fontSize: 12.5 }}>📰 <b>Market:</b> {mkt.headline} <span style={{ color: mkt.mult >= 1.1 ? C.good : mkt.mult < 1 ? C.bad : C.dim }}>({mkt.mult >= 1 ? '+' : ''}{Math.round((mkt.mult - 1) * 100)}%)</span></div>
      <div style={{ textAlign: 'center' }}><Gem blue={graded.blue} orient={graded.orientBlue} size={86} /></div>
      <Panel><Row><b>{round2(graded.carat)} ct · {graded.colorGrade}</b><span style={{ color: cert ? C.good : C.faint, fontSize: 12 }}>{cert ? 'Certified ✓' : 'Uncertified'}</span></Row></Panel>
      {offers.map((o, i) => <button key={i} onClick={() => sell(o)} style={{ ...panelBase, textAlign: 'left', cursor: 'pointer', display: 'block', border: `1px solid ${o.kind === 'collector' ? C.gold : C.line}` }}><Row><b>{o.buyer}</b><b style={{ color: o.kind === 'collector' ? C.gold : C.text }}>{fmt(Math.round(graded.value * o.mult * mkt.mult))}</b></Row><div style={{ fontSize: 11.5, color: C.dim, marginTop: 3 }}>{o.note}</div></button>)}
      <button onClick={keep} style={{ ...panelBase, textAlign: 'left', cursor: 'pointer', display: 'block', border: `1px dashed ${C.violet}` }}><Row><b style={{ color: C.violet }}>🏛 Keep in the vault</b><span style={{ fontSize: 11, color: C.dim }}>appreciates ×1.4</span></Row><div style={{ fontSize: 11.5, color: C.dim, marginTop: 3 }}>Hold this stone as an heirloom instead of selling.</div></button>
    </div>
  )
}
function saveRefRank(s: Save) { return s.totalEarned }

/* ───────────────────────────  CONTRACTS  ──────────────────────────────── */
function Contracts({ save, patch, sfx, go }: any) {
  const rankIdx = rankOf(save.totalEarned).index
  const [offerC] = useState<Contract>(() => generateContract(rankIdx, rng))
  const c = save.contract
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <H title="Commissions" sub="Houses commission specific stones — a set carat, colour and certificate. Deliver to spec on your next stones for a premium." />
      {c ? <Panel accent>
        <Row><b style={{ color: C.gold }}>◆ {c.buyer}</b><span style={{ fontSize: 11, color: C.dim }}>{c.expiresIn} stones left</span></Row>
        <div style={{ fontSize: 13, color: C.dim, margin: '8px 0', lineHeight: 1.6 }}>Wants a stone of <b style={{ color: C.text }}>≥{c.minCarat} ct</b>, colour score <b style={{ color: C.text }}>≥{c.minColor}</b>{c.needCert ? <>, <b style={{ color: C.text }}>certified</b></> : ''}.</div>
        <Row><span style={{ color: C.dim }}>Reward</span><b style={{ color: C.gold, fontSize: 16 }}>{fmt(c.reward)}</b></Row>
        <button onClick={() => { patch((s: Save) => ({ ...s, contract: null })); sfx.click() }} style={{ ...btnGhost, marginTop: 10, width: '100%' }}>Abandon commission</button>
      </Panel> : <>
        <div style={{ color: C.dim, fontSize: 13 }}>No active commission. A house is offering:</div>
        <Panel>
          <Row><b style={{ color: C.gold }}>◆ {offerC.buyer}</b><span style={{ fontSize: 11, color: C.dim }}>within {offerC.expiresIn} stones</span></Row>
          <div style={{ fontSize: 13, color: C.dim, margin: '8px 0', lineHeight: 1.6 }}>≥{offerC.minCarat} ct · colour ≥{offerC.minColor}{offerC.needCert ? ' · certified' : ''}</div>
          <Row><span style={{ color: C.dim }}>Reward</span><b style={{ color: C.gold, fontSize: 16 }}>{fmt(offerC.reward)}</b></Row>
          <button onClick={() => { patch((s: Save) => ({ ...s, contract: offerC })); sfx.up(); go('hub') }} style={{ ...btnPrimary, marginTop: 10, width: '100%' }}>Accept commission</button>
        </Panel>
      </>}
    </div>
  )
}

/* ────────────────────────────  TROPHIES  ──────────────────────────────── */
function Trophies({ save }: any) {
  const earned = save.trophies.length, plat = save.trophies.includes('legend')
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <H title="Trophies" sub={`${earned} of ${TROPHIES.length} earned${plat ? ' · Platinum unlocked 🏆' : ''}`} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {TROPHIES.map(tr => { const got = save.trophies.includes(tr.id); return (
          <div key={tr.id} style={{ ...panelBase, opacity: got ? 1 : 0.5, border: `1px solid ${got ? TIER_COLOR[tr.tier] : C.line}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 18, filter: got ? 'none' : 'grayscale(1)' }}>🏆</span><b style={{ fontSize: 13, color: got ? C.text : C.faint }}>{got ? tr.name : '???'}</b></div>
            <div style={{ fontSize: 11, color: got ? C.dim : C.faint, marginTop: 4 }}>{got ? tr.desc : 'Locked'}</div>
            <div style={{ fontSize: 10, color: TIER_COLOR[tr.tier], marginTop: 4, textTransform: 'uppercase', fontWeight: 700 }}>{tr.tier}</div>
          </div>
        ) })}
      </div>
    </div>
  )
}
function TrophyToast({ id }: { id: string }) {
  const tr = TROPHIES.find(t => t.id === id); if (!tr) return null
  return <div style={{ position: 'fixed', top: 56, left: '50%', transform: 'translateX(-50%)', zIndex: 25, background: '#1b1642', border: `1px solid ${TIER_COLOR[tr.tier]}`, borderRadius: 12, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', boxShadow: `0 8px 30px ${TIER_COLOR[tr.tier]}55`, animation: 'tzpop .35s' }}>
    <span style={{ fontSize: 22 }}>🏆</span><div><div style={{ fontSize: 10, color: TIER_COLOR[tr.tier], textTransform: 'uppercase', fontWeight: 700 }}>{tr.tier} trophy</div><b style={{ fontSize: 14, color: C.text }}>{tr.name}</b></div>
  </div>
}

/* ─────────────────────────────  VAULT  ─────────────────────────────────── */
function Vault({ save, netWorth }: any) {
  const collVal = collectionValue(save.vault)
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <H title="The Vault" sub="Your kept stones — heirlooms of the house. They appreciate and count toward your house worth." />
      <Panel accent><Row><b>Collection value</b><b style={{ color: C.gold, fontSize: 18 }}>{fmt(collVal)}</b></Row><Row><span style={{ color: C.dim, fontSize: 12 }}>Total house worth</span><b style={{ color: C.text }}>{fmt(netWorth)}</b></Row></Panel>
      {save.vault.length === 0 ? <div style={{ color: C.dim, fontSize: 13, textAlign: 'center', padding: 20 }}>Empty. At the market, choose “Keep in the vault” to hold a stone.</div> :
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{save.vault.map((g: Graded, i: number) => <Panel key={i}><div style={{ textAlign: 'center' }}><Gem blue={g.blue} orient={g.orientBlue} size={56} /></div><div style={{ fontSize: 12, textAlign: 'center', marginTop: 6 }}><b>{round2(g.carat)} ct</b><div style={{ color: C.dim, fontSize: 11 }}>{g.colorGrade.split(' ')[0]} · {fmt(Math.round(g.value * 1.4))}</div></div></Panel>)}</div>}
    </div>
  )
}

/* ─────────────────────  RANKS (global leaderboard)  ────────────────────── */
function Ranks() {
  const [rows, setRows] = useState<HouseEntry[] | null | undefined>(undefined)
  const me = loadProfile()
  useEffect(() => { fetchHouses(50).then(setRows) }, [])
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <H title="Tanzanite House rankings" sub="The great houses of Merelani, ranked worldwide by house worth. Sell and keep fine stones to climb." />
      {rows === undefined ? <div style={{ color: C.dim, textAlign: 'center', padding: 20 }}>Loading the world…</div>
        : rows === null ? <div style={{ color: C.dim, textAlign: 'center', padding: 20 }}>Sign in to Kasuku to join the global rankings.</div>
        : rows.length === 0 ? <div style={{ color: C.dim, textAlign: 'center', padding: 20 }}>Be the first house on the board — sell a stone to appear.</div>
        : rows.map((r, i) => { const mine = me && r.handle === me.username; return (
          <div key={r.id} style={{ ...panelBase, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${mine ? C.gold : C.line}`, background: mine ? '#2a2160' : panelBase.background }}>
            <div style={{ width: 26, textAlign: 'center', fontWeight: 800, color: i < 3 ? C.gold : C.faint }}>{i + 1}</div>
            {r.photo_url ? <img src={r.photo_url} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#3a2f66', display: 'grid', placeItems: 'center' }}>{r.avatar || '💎'}</div>}
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name || r.handle}{mine ? ' (you)' : ''}</div><div style={{ fontSize: 11, color: C.dim }}>{r.rank_title} · {r.stones_sold} sold</div></div>
            <b style={{ color: C.gold, fontSize: 13 }}>{fmt(r.net_worth)}</b>
          </div>
        ) })}
    </div>
  )
}

/* ─────────────────────────────  SHOP  ─────────────────────────────────── */
function Shop({ save, patch, sfx, flash }: any) {
  const keys = Object.keys(UPGRADE_META) as (keyof Upgrades)[]
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <H title="Upgrade your operation" sub="Reinvest TzNITE. Every level compounds — deeper safer digs, a wider kiln window, less weight lost, a richer certified premium, and a bigger bag." />
      {keys.map(k => { const lvl = save.upgrades[k], meta = UPGRADE_META[k], maxed = lvl >= meta.max, cost = upgradeCost(k, lvl); return (
        <Panel key={k}>
          <Row><b>{meta.name}</b><span style={{ fontSize: 11, color: C.gold }}>Lv {lvl}/{meta.max}</span></Row>
          <div style={{ color: C.dim, fontSize: 12, margin: '4px 0 8px' }}>{meta.note}{k === 'drill' ? ' Also +1 bag slot.' : ''}</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>{Array.from({ length: meta.max }).map((_, i) => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < lvl ? C.violet : '#ffffff18' }} />)}</div>
          <button onClick={() => { if (maxed || save.tznite < cost) { if (!maxed) flash('Not enough TzNITE'); return } sfx.up(); patch((s: Save) => ({ ...s, tznite: s.tznite - cost, upgrades: { ...s.upgrades, [k]: lvl + 1 } })) }} disabled={maxed || save.tznite < cost} style={{ ...btnPrimary, width: '100%', padding: 10, opacity: maxed ? 0.4 : save.tznite < cost ? 0.5 : 1 }}>{maxed ? 'Maxed' : `Upgrade — ${fmt(cost)}`}</button>
        </Panel>
      ) })}
    </div>
  )
}

/* ─────────────────────────────  CODEX  ─────────────────────────────────── */
function Codex({ save }: any) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <H title="The Tanzanite Codex" sub={`${save.codex.length} of ${CODEX.length} facts unlocked by playing — all real.`} />
      {CODEX.map(f => { const got = save.codex.includes(f.id); return <Panel key={f.id}><Row><b style={{ color: got ? C.text : C.faint }}>{got ? f.title : '???'}</b>{got && <span style={{ color: C.gold, fontSize: 11 }}>✦</span>}</Row><div style={{ color: got ? C.dim : C.faint, fontSize: 12.5, marginTop: 4, lineHeight: 1.55 }}>{got ? f.body : 'Locked — keep mining, treating and trading to reveal this.'}</div></Panel> })}
    </div>
  )
}

/* ───────────────────────────  primitives  ─────────────────────────────── */
const panelBase: React.CSSProperties = { background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, width: '100%', color: C.text }
function Panel({ children, accent }: { children: React.ReactNode; accent?: boolean }) { return <div style={{ ...panelBase, border: `1px solid ${accent ? 'rgba(150,120,240,0.5)' : C.line}`, boxShadow: accent ? '0 0 24px rgba(120,90,240,0.15)' : undefined }}>{children}</div> }
function Row({ children }: { children: React.ReactNode }) { return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>{children}</div> }
function H({ title, sub }: { title: string; sub?: string }) { return <div><h2 style={{ margin: '4px 0 2px', fontSize: 20, fontWeight: 800 }}>{title}</h2>{sub && <div style={{ color: C.dim, fontSize: 12.5, lineHeight: 1.5 }}>{sub}</div>}</div> }
function Hint({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 11.5, color: C.faint, fontStyle: 'italic', textAlign: 'center' }}>{children}</div> }
function Chip({ label, gold }: { label: string; gold?: boolean }) { return <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 11px', borderRadius: 999, background: gold ? 'rgba(217,180,106,0.15)' : 'rgba(120,110,200,0.15)', color: gold ? C.gold : C.dim, border: `1px solid ${gold ? 'rgba(217,180,106,0.3)' : C.line}` }}>{label}</span> }
function Tile({ icon, label, onClick, dim }: { icon: string; label: string; onClick: () => void; dim?: boolean }) { return <button onClick={onClick} disabled={dim} style={{ ...panelBase, cursor: dim ? 'default' : 'pointer', fontSize: 20, textAlign: 'center', padding: '13px 6px', opacity: dim ? 0.45 : 1 }}>{icon}<div style={{ fontSize: 11.5, color: C.dim, marginTop: 4, fontWeight: 600 }}>{label}</div></button> }
function Empty({ go }: { go: any }) { return <div style={{ textAlign: 'center', padding: 40 }}><div style={{ color: C.dim }}>No stone here.</div><button onClick={() => go('mine')} style={{ ...btnPrimary, marginTop: 14 }}>Go mine →</button></div> }
const btnPrimary: React.CSSProperties = { background: `linear-gradient(90deg,${C.blue},${C.violet})`, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', padding: '11px 16px' }
const btnGhost: React.CSSProperties = { background: 'transparent', color: C.dim, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 13, cursor: 'pointer', padding: '8px 14px' }
const toastStyle: React.CSSProperties = { position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: '#2a2160ee', color: C.text, padding: '9px 16px', borderRadius: 999, fontSize: 13, border: `1px solid ${C.violet}`, boxShadow: '0 8px 30px #0008' }
function fmt(n: number): string { return Math.round(n).toLocaleString('en-US') }
