/**
 * Saturation en azote : moteur physique, porté à l'identique du modèle `saturation-azote.html`
 * (Bühlmann ZH-L16C, azote seul). Aucune formule, constante ni arrondi n'a été modifié.
 *
 * Indépendant de l'interface et de la fréquence d'affichage : chaque état est calculé de façon
 * exacte (Haldane à pression constante, Schreiner pour une variation linéaire de pression).
 * Architecture prévue pour l'hélium (trimix) et les facteurs de gradient : voir gf et he.
 */

export const LN2 = Math.LN2
/** bar, pression de vapeur d'eau alvéolaire (Bühlmann). */
export const PH2O = 0.0627

export type Model = { label: string; halfTimes: number[]; a: number[]; b: number[]; k: number[] }

/**
 * Compartiments ZH-L16C, azote. Source : A. A. Bühlmann, « Tauchmedizin » (2002), table ZH-L16C,
 * compartiment 1b (5 min). Coefficients a (bar) et b (sans unité).
 */
const HALF_TIMES = [5.0, 8.0, 12.5, 18.5, 27.0, 38.3, 54.3, 77.0, 109.0, 146.0, 187.0, 239.0, 305.0, 390.0, 498.0, 635.0]
export const ZHL16C: Model = {
  label: 'Bühlmann ZH-L16C',
  halfTimes: HALF_TIMES,
  a: [1.1696, 1.0, 0.8618, 0.7562, 0.62, 0.5043, 0.441, 0.4, 0.375, 0.35, 0.3295, 0.3065, 0.2835, 0.261, 0.248, 0.2327],
  b: [0.5578, 0.6514, 0.7222, 0.7825, 0.8126, 0.8434, 0.8693, 0.891, 0.9092, 0.9222, 0.9319, 0.9403, 0.9477, 0.9544, 0.9602, 0.9653],
  k: HALF_TIMES.map((h) => LN2 / h),
}
export const N = HALF_TIMES.length

export type Group = 'rapide' | 'intermédiaire' | 'lent'
/** Familles de compartiments (affichage). */
export const groupOf = (i: number): Group => (i < 5 ? 'rapide' : i < 10 ? 'intermédiaire' : 'lent')

// ── Pressions et gaz ─────────────────────────────────────────────────────────

/** Pression ambiante absolue (bar) en eau de mer : Pamb = Psurface + profondeur / 10. */
export const pAmb = (depth: number, surfaceP = 1.0) => surfaceP + Math.max(0, depth) / 10
/** Profondeur (m) pour une pression absolue donnée. */
export const depthOf = (p: number, surfaceP = 1.0) => Math.max(0, (p - surfaceP) * 10)

/** Gaz : { o2, he } en fractions ; l'azote est le complément. */
export type Gas = { o2: number; he: number; n2: number }
export const gas = (o2: number, he = 0): Gas => ({ o2, he, n2: Math.max(0, 1 - o2 - he) })
export const AIR = gas(0.21)

/** Pression partielle inspirée d'azote : PiN2 = (Pamb − PH2O) × FN2. */
export const piN2 = (p: number, g: Gas) => Math.max(0, p - PH2O) * g.n2
export const ppO2 = (p: number, g: Gas) => p * g.o2
/** Profondeur maximale d'utilisation (m) pour une ppO2 maximale donnée. */
export const modOf = (g: Gas, ppo2Max: number, surfaceP = 1.0) => depthOf(ppo2Max / g.o2, surfaceP)

// ── Cinétique d'un compartiment ──────────────────────────────────────────────

/** Haldane : pression inspirée constante pi pendant t minutes. */
export const haldane = (p0: number, pi: number, k: number, t: number) => p0 + (pi - p0) * (1 - Math.exp(-k * t))
/** Schreiner : pression inspirée linéaire pi(t) = pi0 + r·t (r en bar/min). */
export const schreiner = (p0: number, pi0: number, r: number, k: number, t: number) =>
  pi0 + r * (t - 1 / k) - (pi0 - p0 - r / k) * Math.exp(-k * t)
/** Vitesse instantanée (bar/min) : dP/dt = k · (Pi − P). > 0 chargement, < 0 déchargement. */
export const rateOf = (p: number, pi: number, k: number) => k * (pi - p)

/** Valeur M (bar) : M = a + Pamb / b. Le facteur de gradient gf (1 = 100 %) est prévu pour plus
 *  tard : Mgf = Pamb + gf × (M − Pamb). Non utilisé dans cette version (gf = 1). */
export const mValue = (i: number, p: number, gf = 1, c: Model = ZHL16C) => {
  const m = c.a[i] + p / c.b[i]
  return p + gf * (m - p)
}
/** Pression ambiante minimale tolérée par un compartiment (bar) : (P − a) × b. */
export const toleratedP = (i: number, pt: number, c: Model = ZHL16C) => (pt - c.a[i]) * c.b[i]

// ── Profil : niveaux successifs → segments linéaires (profondeur et gaz) ─────

export type Phase = 'descente' | 'fond' | 'remontée' | 'palier' | 'niveau' | 'surface'
export type Level = { depth: number; time: number }
export type Config = {
  /** time = minutes passées sur le niveau (trajets non compris) */
  levels: Level[]
  /** m/min */
  descentRate: number
  ascentRate: number
  bottomGas: Gas
  decoGas: Gas | null
  /** m : passage au gaz de déco à la remontée */
  switchDepth: number
  /** bar */
  surfaceP: number
  /** minutes de suivi après la sortie (à l'air) */
  surfaceTime: number
}
export type Segment = {
  t0: number; t1: number; d0: number; d1: number; gas: Gas; phase: Phase; level: number
  start?: number[]; end?: number[]
}
export type Profile = { segments: Segment[]; tEnd: number; tSurface: number; tSwitch: number | null; maxDepth: number }

export function buildProfile(cfg: Config): Profile {
  type Raw = Omit<Segment, 'gas'>
  const raw: Raw[] = []
  let t = 0, d = 0
  const travel = (to: number, level: number) => {
    if (Math.abs(to - d) < 1e-9) return
    const down = to > d
    const dt = Math.abs(to - d) / (down ? cfg.descentRate : cfg.ascentRate)
    raw.push({ t0: t, t1: t + dt, d0: d, d1: to, phase: down ? 'descente' : 'remontée', level })
    t += dt; d = to
  }
  let maxDepth = 0, deepIdx = 0
  cfg.levels.forEach((L, i) => { if (L.depth > maxDepth) { maxDepth = L.depth; deepIdx = i } })
  cfg.levels.forEach((L, i) => {
    travel(L.depth, i)
    if (L.time > 0) {
      const phase: Phase = i === deepIdx ? 'fond' : i > deepIdx && L.depth <= 9 ? 'palier' : 'niveau'
      raw.push({ t0: t, t1: t + L.time, d0: d, d1: d, phase, level: i })
      t += L.time
    }
  })
  travel(0, cfg.levels.length)
  const tSurface = t
  if (cfg.surfaceTime > 0) raw.push({ t0: t, t1: t + cfg.surfaceTime, d0: 0, d1: 0, phase: 'surface', level: -1 })
  const tEnd = t + Math.max(0, cfg.surfaceTime)

  // Moment du changement de gaz : dernier passage, en remontant, à la profondeur de changement.
  let tSwitch: number | null = null
  if (cfg.decoGas && cfg.switchDepth > 0) {
    for (const s of raw) {
      if (s.phase === 'surface') break
      if (s.d0 > cfg.switchDepth + 1e-9 && s.d1 <= cfg.switchDepth + 1e-9) {
        tSwitch = s.t0 + ((s.d0 - cfg.switchDepth) / (s.d0 - s.d1)) * (s.t1 - s.t0)
      } else if (s.d0 > cfg.switchDepth + 1e-9 || s.d1 > cfg.switchDepth + 1e-9) {
        tSwitch = null // on redescend sous la profondeur de changement : le changement n'est pas encore fait
      }
    }
    // Profil entièrement au-dessus de la profondeur de changement : pas de changement.
    if (tSwitch !== null && tSwitch >= tSurface - 1e-9) tSwitch = null
  }

  // Découpe au moment du changement et affectation des gaz.
  const segments: Segment[] = []
  for (const s of raw) {
    const parts: [number, number][] = (tSwitch !== null && s.t0 < tSwitch - 1e-9 && s.t1 > tSwitch + 1e-9)
      ? [[s.t0, tSwitch], [tSwitch, s.t1]] : [[s.t0, s.t1]]
    for (const [a, b] of parts) {
      const f = (x: number) => s.d0 + ((s.d1 - s.d0) * (x - s.t0)) / (s.t1 - s.t0 || 1)
      const g = s.phase === 'surface' ? AIR : tSwitch !== null && a >= tSwitch - 1e-9 ? cfg.decoGas! : cfg.bottomGas
      segments.push({ t0: a, t1: b, d0: f(a), d1: f(b), gas: g, phase: s.phase, level: s.level })
    }
  }
  return { segments, tEnd, tSurface, tSwitch, maxDepth }
}

// ── Simulation : état exact à l'entrée de chaque segment, puis état à tout instant ──

export type Sim = Profile & { cfg: Config; model: Model; initial: number[] }

export function simulate(cfg: Config, model: Model = ZHL16C): Sim {
  const prof = buildProfile(cfg)
  const sp = cfg.surfaceP
  // Plongeur saturé à la surface, à l'air.
  const p0 = new Array<number>(N).fill(piN2(sp, AIR))
  let cur = p0.slice()
  for (const s of prof.segments) {
    s.start = cur.slice()
    cur = advance(cur, s, s.t1 - s.t0, sp, model)
    s.end = cur.slice()
  }
  return { cfg, model, ...prof, initial: p0 }
}

/** Avance les 16 compartiments de dt minutes à l'intérieur d'un segment. */
export function advance(pt: number[], s: Segment, dt: number, sp: number, model: Model): number[] {
  const dur = s.t1 - s.t0
  const pa0 = pAmb(s.d0, sp)
  const pi0 = piN2(pa0, s.gas)
  const rAmb = dur > 0 ? ((s.d1 - s.d0) / 10) / dur : 0 // bar/min
  // Sous la vapeur d'eau (cas théorique) on garde la formule ; ici Pamb ≥ 0,7 bar donc toujours positive.
  const r = rAmb * s.gas.n2
  return pt.map((p, i) => (Math.abs(r) < 1e-12 ? haldane(p, pi0, model.k[i], dt) : schreiner(p, pi0, r, model.k[i], dt)))
}

/** Segment actif à l'instant t (bornes incluses). */
function segmentAt(sim: Sim, t: number): Segment | null {
  const segs = sim.segments
  if (!segs.length) return null
  if (t <= segs[0].t0) return segs[0]
  for (const s of segs) if (t <= s.t1 + 1e-9) return s
  return segs[segs.length - 1]
}

export type Comp = {
  i: number; halfTime: number; group: Group
  pN2: number; rate: number; m: number; margin: number; ratio: number; tolerated: number
}
export type State = {
  t: number; depth: number; pAmb: number; gas: Gas; phase: Phase; piN2: number; ppO2: number
  comp: Comp[]; lead: number; meanN2: number
}

/** État complet à l'instant t (minutes). */
export function stateAt(sim: Sim, t: number): State {
  const sp = sim.cfg.surfaceP, model = sim.model
  t = Math.max(0, Math.min(sim.tEnd, t))
  const s = segmentAt(sim, t)
  if (!s) {
    const pi = piN2(sp, AIR)
    return mk(t, 0, AIR, 'surface', sim.initial.slice(), pi, sp, model)
  }
  const dt = Math.max(0, Math.min(s.t1 - s.t0, t - s.t0))
  const depth = s.t1 > s.t0 ? s.d0 + ((s.d1 - s.d0) * dt) / (s.t1 - s.t0) : s.d0
  const pt = advance(s.start!, s, dt, sp, model)
  const pa = pAmb(depth, sp)
  return mk(t, depth, s.gas, s.phase, pt, piN2(pa, s.gas), pa, model)
}

function mk(t: number, depth: number, g: Gas, phase: Phase, pt: number[], pi: number, pa: number, model: Model): State {
  const comp = pt.map((p, i) => {
    const m = mValue(i, pa, 1, model)
    return {
      i, halfTime: model.halfTimes[i], group: groupOf(i),
      pN2: p, rate: rateOf(p, pi, model.k[i]),
      m, margin: m - p, ratio: p / m,
      tolerated: toleratedP(i, p, model),
    }
  })
  // Compartiment directeur : celui qui est le plus proche de sa valeur M (ratio le plus élevé).
  let lead = 0
  comp.forEach((c, i) => { if (c.ratio > comp[lead].ratio) lead = i })
  const mean = pt.reduce((a, b) => a + b, 0) / pt.length
  return { t, depth, pAmb: pa, gas: g, phase, piN2: pi, ppO2: ppO2(pa, g), comp, lead, meanN2: mean }
}

/** Échantillonnage régulier (pour les courbes). n = nombre d'intervalles. */
export function sample(sim: Sim, n = 400): State[] {
  const out: State[] = []
  for (let j = 0; j <= n; j++) out.push(stateAt(sim, (sim.tEnd * j) / n))
  return out
}

export type Check = { kind: 'deco' | 'bottom'; gas: Gas; mod: number; depth: number; ppo2: number; max: number }

/** Alertes PMU / ppO2 sur un profil. */
export function checks(sim: Sim, lim: { bottom: number; deco: number }): Check[] {
  const sp = sim.cfg.surfaceP, out: Check[] = []
  const seen = new Set<string>()
  for (const s of sim.segments) {
    if (s.phase === 'surface') continue
    const dMax = Math.max(s.d0, s.d1)
    const isDeco = sim.cfg.decoGas && s.gas === sim.cfg.decoGas && sim.tSwitch !== null && s.t0 >= sim.tSwitch - 1e-9
    const max = isDeco ? lim.deco : lim.bottom
    const mod = modOf(s.gas, max, sp)
    if (dMax > mod + 1e-6) {
      const key = isDeco ? 'deco' : 'bottom'
      if (!seen.has(key)) {
        seen.add(key)
        out.push({ kind: key, gas: s.gas, mod, depth: dMax, ppo2: ppO2(pAmb(dMax, sp), s.gas), max })
      }
    }
  }
  return out
}
