/* ============================================================================
   TANZANITE — "The Merelani Deep"  ·  science + game logic (pure)
   ----------------------------------------------------------------------------
   Every constant and formula here is grounded in the real mineralogy, gemology
   and mining of tanzanite (blue gem zoisite), found only at Merelani, Tanzania.
   Sources baked in: pleochroism, vanadium heat-treatment (~550-600C), the 4Cs,
   Ca2Al3(SiO4)3(OH), orthorhombic, Mohs 6-7, SG 3.35, RI 1.685-1.725,
   discovery 1967, named by Tiffany & Co., ~1000x rarer than diamond.
   ============================================================================ */

// ── Hard mineral facts (used verbatim in the Codex / assay) ────────────────
export const MINERAL = {
  species: 'Zoisite (blue gem variety)',
  group: 'Epidote group',
  formula: 'Ca₂Al₃(SiO₄)₃(OH)',
  crystalSystem: 'Orthorhombic',
  mohs: '6–7',
  sg: 3.35,
  riLow: 1.685,
  riHigh: 1.725,
  birefringence: '0.004–0.009',
  colorant: 'Vanadium (V), traces of chromium',
  locality: 'Merelani Hills, Manyara, Tanzania',
  discovered: 1967,
  namedBy: 'Tiffany & Co. (Tanzania + Zoisite)',
  formedMa: 585, // Ma, Pan-African / East African Orogeny metamorphism
} as const

// ── Mine geology: real Merelani stratigraphy, top to deep ──────────────────
export interface Strata {
  from: number; to: number            // depth in metres
  name: string
  rock: string
  note: string
  findChance: number                  // base probability a dig here hits rough
  gradeBias: number                   // 0..1 quality bias of rough found here
  hazard: number                      // 0..1 tremor / water / gas risk per dig
}
export const STRATA: Strata[] = [
  { from: 0,   to: 40,  name: 'Overburden',         rock: 'Lateritic soil & gravel', note: 'Weathered surface cover. No gem zoisite here — just the way down.', findChance: 0.02, gradeBias: 0.1, hazard: 0.02 },
  { from: 40,  to: 120, name: 'Graphitic Gneiss',   rock: 'Graphite-bearing gneiss', note: 'The host rock. Its graphite is why Merelani air runs low on oxygen at depth.', findChance: 0.10, gradeBias: 0.3, hazard: 0.10 },
  { from: 120, to: 300, name: 'The Tanzanite Reef', rock: 'Boudinaged calc-silicate veins', note: 'Gem pockets sit in “boudins” — sausage-shaped swells pinched off during folding ~585 Ma.', findChance: 0.34, gradeBias: 0.6, hazard: 0.20 },
  { from: 300, to: 600, name: 'Deep Folds',         rock: 'Fold-hinge vein systems', note: 'Richer pockets gather in fold hinges — but tremors, heat and flooding rise fast.', findChance: 0.28, gradeBias: 0.85, hazard: 0.38 },
  { from: 600, to: 1100,name: 'The Abyss',          rock: 'Deep metamorphic front', note: 'Beyond ~600 m few dare go. The finest “D-block” rough on Earth — at the greatest risk.', findChance: 0.22, gradeBias: 1.0, hazard: 0.55 },
]
export function strataAt(depth: number): Strata {
  return STRATA.find(s => depth >= s.from && depth < s.to) ?? STRATA[STRATA.length - 1]
}

export const BLOCKS = [
  { id: 'A', name: 'Block A', hint: 'Artisanal ground — forgiving, modest grade.', gradeMul: 0.85, hazardMul: 0.8 },
  { id: 'B', name: 'Block B', hint: 'The old mechanised block — balanced.', gradeMul: 1.0, hazardMul: 1.0 },
  { id: 'C', name: 'Block C', hint: 'Contested reef — high grade, high tremor.', gradeMul: 1.15, hazardMul: 1.2 },
  { id: 'D', name: 'Block D', hint: 'The legendary block — the finest blue, the deepest danger.', gradeMul: 1.35, hazardMul: 1.45 },
] as const
export type BlockId = typeof BLOCKS[number]['id']

// ── The stone as it moves through the pipeline ─────────────────────────────
export interface Rough {
  id: string
  caratRough: number       // rough weight
  vanadium: number         // 0..1 — blue potential locked in the crystal
  clarity: number          // 0..1 — internal cleanliness (eye-clean = high)
  fracture: number         // 0..1 — pre-existing fractures (heat risk)
  depth: number            // where it came from
  block: BlockId
}
export interface Treated extends Rough {
  blue: number             // 0..1 — how fully vanadium was driven to blue
  clarityAfter: number     // clarity can drop if fired through fractures
  cracked: boolean
}
export interface Cut extends Treated {
  shapeId: string
  orientBlue: number       // 0..1 — how well the table was oriented to the blue axis
  carat: number            // final weight after cutting (yield loss)
  brilliance: number       // 0..1 — cut quality
}
export interface Graded extends Cut {
  colorScore: number       // 0..100
  clarityGrade: string
  colorGrade: string       // Exceptional / Vivid / ...
  cutGrade: string
  value: number            // TzNITE, uncertified
}

// ── Cutting shapes: real trade-off of yield (weight kept) vs brilliance ────
export const SHAPES = [
  { id: 'round',    name: 'Round Brilliant', yield: 0.42, brilliance: 1.00, note: 'Most fire, most weight lost.' },
  { id: 'oval',     name: 'Oval',            yield: 0.52, brilliance: 0.92, note: 'Flattering, keeps colour.' },
  { id: 'cushion',  name: 'Cushion',         yield: 0.56, brilliance: 0.88, note: 'Deep, saturated colour.' },
  { id: 'emerald',  name: 'Emerald Cut',     yield: 0.62, brilliance: 0.78, note: 'Shows clarity; big yield.' },
  { id: 'pear',     name: 'Pear',            yield: 0.50, brilliance: 0.90, note: 'Elegant, balanced.' },
  { id: 'trillion', name: 'Trillion',        yield: 0.46, brilliance: 0.85, note: 'Bold, modern, lively.' },
] as const

// ── Colour grade scale (vivid blue-violet is king) ─────────────────────────
export function colorGradeOf(score: number): { grade: string; mul: number } {
  if (score >= 90) return { grade: 'Exceptional (AAAA)', mul: 3.4 }
  if (score >= 78) return { grade: 'Vivid (AAA)',        mul: 2.3 }
  if (score >= 62) return { grade: 'Intense (AA)',       mul: 1.5 }
  if (score >= 45) return { grade: 'Fine (A)',           mul: 1.0 }
  if (score >= 28) return { grade: 'Pale',               mul: 0.55 }
  return { grade: 'Greyish', mul: 0.3 }
}
export function clarityGradeOf(c: number): { grade: string; mul: number } {
  if (c >= 0.92) return { grade: 'Loupe-clean (IF)', mul: 1.25 }
  if (c >= 0.80) return { grade: 'Eye-clean (VVS)',  mul: 1.10 }
  if (c >= 0.62) return { grade: 'VS',               mul: 1.0 }
  if (c >= 0.42) return { grade: 'SI',               mul: 0.82 }
  return { grade: 'Included (I)', mul: 0.6 }
}
export function cutGradeOf(b: number): { grade: string; mul: number } {
  if (b >= 0.9)  return { grade: 'Excellent', mul: 1.15 }
  if (b >= 0.75) return { grade: 'Very Good', mul: 1.05 }
  if (b >= 0.55) return { grade: 'Good',      mul: 1.0 }
  return { grade: 'Fair', mul: 0.88 }
}

// ── Treatment model: the real vanadium chemistry, as a sweet-spot ──────────
// Ideal window ~550-600C. Under-fire -> stays brown; over-fire through
// fractures -> clarity loss / crack. Higher vanadium -> more blue achievable.
export const TREAT_IDEAL = { lo: 550, hi: 600, min: 380, max: 780 }
export function treat(r: Rough, tempC: number, holdOk: number): Treated {
  const centre = (TREAT_IDEAL.lo + TREAT_IDEAL.hi) / 2
  const half = (TREAT_IDEAL.hi - TREAT_IDEAL.lo) / 2 + 45      // tolerance band
  const proximity = Math.max(0, 1 - Math.abs(tempC - centre) / half) // 0..1
  // Blue achieved: proximity x hold quality x how much vanadium is present.
  const blue = clamp01(proximity * (0.55 + 0.45 * holdOk) * (0.45 + 0.75 * r.vanadium))
  // Over-firing past the window, especially through fractures, damages clarity.
  const over = Math.max(0, tempC - TREAT_IDEAL.hi) / (TREAT_IDEAL.max - TREAT_IDEAL.hi)
  const stress = over * (0.4 + 0.6 * r.fracture)
  const cracked = stress > 0.72 || (r.fracture > 0.8 && over > 0.5)
  const clarityAfter = clamp01(r.clarity - stress * 0.5 - (cracked ? 0.3 : 0))
  return { ...r, blue, clarityAfter, cracked }
}

// ── Cutting: orientation to the pleochroic blue axis + shape yield ─────────
export function cutStone(t: Treated, shapeId: string, orientBlue: number): Cut {
  const shape = SHAPES.find(s => s.id === shapeId) ?? SHAPES[0]
  // Orienting for blue costs weight; cutting for weight costs colour. The
  // player's orient (0..1) trades directly against yield.
  const yieldPenalty = orientBlue * 0.18            // chase blue -> lose weight
  const carat = round2(t.caratRough * (shape.yield - yieldPenalty))
  const brilliance = clamp01(shape.brilliance * (0.7 + 0.3 * orientBlue))
  return { ...t, shapeId, orientBlue, carat: Math.max(0.05, carat), brilliance }
}

// ── Final grading + value ──────────────────────────────────────────────────
export function grade(c: Cut): Graded {
  // Colour score: blue driven in treatment x how well it faces up (orient) x clarity halo.
  const colorScore = Math.round(clamp01(c.blue * (0.55 + 0.45 * c.orientBlue)) * 100)
  const col = colorGradeOf(colorScore)
  const cl = clarityGradeOf(c.clarityAfter)
  const cut = cutGradeOf(c.brilliance)
  // Per-carat price rises with size (large vivid tanzanite is disproportionately rare).
  const sizePremium = 1 + Math.min(2.2, Math.pow(c.carat, 0.9) * 0.16)
  const base = 42 // TzNITE / ct baseline for Fine colour
  const value = Math.round(base * c.carat * sizePremium * col.mul * cl.mul * cut.mul)
  return { ...c, colorScore, colorGrade: col.grade, clarityGrade: cl.grade, cutGrade: cut.grade, value: Math.max(1, value) }
}

// ── eCertificate (MetanzaNite provenance) ──────────────────────────────────
export function certify(g: Graded): { serial: string; hash: string; bonus: number } {
  const seed = `${g.id}:${g.carat}:${g.colorScore}:${g.clarityGrade}:${g.block}`
  const hash = fnv1a(seed)
  const serial = `TZ-${g.block}-${hash.slice(0, 4).toUpperCase()}-${hash.slice(4, 8).toUpperCase()}`
  return { serial, hash, bonus: 0.22 } // certified stones fetch ~22% more
}

// ── Market: buyers, scarcity, "sell less for more" ─────────────────────────
export interface Offer { buyer: string; kind: 'quick' | 'fair' | 'collector'; mult: number; note: string }
export function makeOffers(g: Graded, certified: boolean, rng: () => number): Offer[] {
  const c = certified ? 1.22 : 1
  const jitter = () => 0.92 + rng() * 0.16
  const offers: Offer[] = [
    { buyer: 'Arusha broker',        kind: 'quick',     mult: 0.72 * c * jitter(), note: 'Cash today, no questions.' },
    { buyer: 'Dar es Salaam house',  kind: 'fair',      mult: 1.0 * c * jitter(),  note: 'Market rate for the grade.' },
  ]
  // Collectors only chase certified, high-grade stones — the President's doctrine:
  // sell fewer, finer stones for far more.
  if (certified && g.colorScore >= 78) {
    offers.push({ buyer: 'International collector', kind: 'collector', mult: 1.55 * jitter(), note: 'Pays a premium for a rare, certified vivid stone.' })
  }
  return offers
}

// ── Progression: ranks + upgrades ──────────────────────────────────────────
export const RANKS = [
  { at: 0,      title: 'Artisanal Digger' },
  { at: 1500,   title: 'Pit Foreman' },
  { at: 6000,   title: 'Licensed Broker' },
  { at: 18000,  title: 'Master Cutter' },
  { at: 45000,  title: 'Certified Grader' },
  { at: 100000, title: 'Tanzanite House' },
  { at: 250000, title: 'Legend of Merelani' },
] as const
export function rankOf(tznite: number): { title: string; next?: number; index: number } {
  let idx = 0
  for (let i = 0; i < RANKS.length; i++) if (tznite >= RANKS[i].at) idx = i
  return { title: RANKS[idx].title, next: RANKS[idx + 1]?.at, index: idx }
}

export interface Upgrades { drill: number; furnace: number; lapidary: number; lab: number }
export const UPGRADE_META = {
  drill:    { name: 'Diamond Drill', max: 5, base: 800,  note: 'Dig faster & deeper per shift.' },
  furnace:  { name: 'Kiln Control',  max: 5, base: 1200, note: 'Wider safe heat window.' },
  lapidary: { name: 'Master Wheel',  max: 5, base: 1500, note: 'Less weight lost when chasing blue.' },
  lab:      { name: 'Assay Lab',     max: 5, base: 2200, note: 'Higher certified premium.' },
} as const
export function upgradeCost(kind: keyof Upgrades, level: number): number {
  return Math.round(UPGRADE_META[kind].base * Math.pow(1.8, level))
}

// ── Codex: real facts, unlocked as you play ────────────────────────────────
export interface CodexFact { id: string; title: string; body: string }
export const CODEX: CodexFact[] = [
  { id: 'discovery', title: 'A find in 1967', body: 'Tanzanite was found in 1967 on the plains of Merelani, in the foothills of Kilimanjaro near Arusha — the only place on Earth it occurs.' },
  { id: 'name', title: 'Named by Tiffany', body: 'Tiffany & Co. coined “Tanzanite” from Tanzania + zoisite, launching it as the gemstone of the 20th century.' },
  { id: 'species', title: 'It is blue zoisite', body: `Mineralogically it is gem zoisite of the epidote group — ${MINERAL.formula}, orthorhombic, Mohs ${MINERAL.mohs}, SG ${MINERAL.sg}.` },
  { id: 'pleo', title: 'The three-coloured stone', body: 'Tanzanite is strongly pleochroic (tri/dichroic): the same crystal shows blue, violet and burgundy down different optical axes. Cutters orient the table to face up the finest blue.' },
  { id: 'vanadium', title: 'Vanadium makes the blue', body: 'Trace vanadium colours tanzanite. In the ground most rough is reddish-brown; the blue is usually latent until heat unlocks it.' },
  { id: 'heat', title: 'The 600° transformation', body: 'Gentle heating near 550–600°C changes the vanadium’s state, driving out the brown and revealing a stable vivid blue-violet — a permanent, accepted treatment.' },
  { id: 'formed', title: 'Born ~585 million years ago', body: 'Merelani’s gems crystallised during the Pan-African orogeny, ~585 Ma, when colliding continents metamorphosed the rock and pinched off gem-bearing “boudins”.' },
  { id: 'rarity', title: '1000× rarer than diamond', body: 'From a single ~7×2 km deposit, tanzanite is roughly a thousand times rarer than diamond — a true “generational gem” that may be mined out within a lifetime.' },
  { id: 'ri', title: 'Reading the light', body: `A refractometer reads tanzanite at RI ${MINERAL.riLow}–${MINERAL.riHigh} with low birefringence (${MINERAL.birefringence}) — part of how a lab tells it apart from imitations.` },
  { id: 'grade', title: 'Colour is king', body: 'Of the 4Cs, colour dominates tanzanite value: a deep, vivid violetish-blue of medium-dark tone commands the top grades and prices.' },
  { id: 'legacy', title: 'Sell less, for more', body: 'Tanzania’s vision is to preserve value by selling fewer, finer, certified stones at higher prices — keeping more of the benefit at home.' },
  { id: 'ecert', title: 'Provenance on-chain', body: 'A tamper-proof eCertificate records each stone’s identity and origin, fighting counterfeits and letting a buyer trust a stone’s journey from Merelani.' },
]

// ── small helpers ──────────────────────────────────────────────────────────
export function clamp01(x: number): number { return x < 0 ? 0 : x > 1 ? 1 : x }
export function round2(x: number): number { return Math.round(x * 100) / 100 }
export function fnv1a(str: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return (h >>> 0).toString(16).padStart(8, '0')
}
// A pleochroic colour for the rendered gem, from blue-drive + orientation.
export function gemColor(blue: number, orient = 1): { face: string; glow: string } {
  // blue 0 = reddish-brown rough; blue 1 = vivid violet-blue. Orient shifts hue.
  const b = clamp01(blue)
  if (b < 0.12) return { face: '#7a4a2e', glow: 'rgba(150,90,50,0.5)' }  // rough brown
  const hue = 250 - orient * 18                          // 232..250 (violet->blue)
  const light = 34 + b * 20
  const sat = 45 + b * 45
  return {
    face: `hsl(${hue} ${sat}% ${light}%)`,
    glow: `hsla(${hue} ${sat}% ${light + 14}% / ${0.35 + b * 0.4})`,
  }
}

// deterministic-ish rough generator
let _seq = 0
export function digRough(block: BlockId, depth: number, rng: () => number): Rough | null {
  const s = strataAt(depth)
  const blk = BLOCKS.find(b => b.id === block)!
  if (rng() > s.findChance) return null
  const q = clamp01(s.gradeBias * blk.gradeMul * (0.6 + rng() * 0.6))
  return {
    id: `r${Date.now().toString(36)}${(_seq++).toString(36)}`,
    caratRough: round2(0.8 + rng() * 5 + q * 6),         // 0.8 .. ~12 ct rough
    vanadium: clamp01(0.35 + q * 0.6 + (rng() - 0.5) * 0.2),
    clarity: clamp01(0.45 + q * 0.4 + (rng() - 0.5) * 0.25),
    fracture: clamp01(0.5 - q * 0.35 + (rng() - 0.5) * 0.3),
    depth, block,
  }
}
