/**
 * % CNS d'une plongée : logique pure, portée à l'identique du modèle `cns.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 * PpO2 = FO2 × (prof/10 + 1), en eau de mer.
 * CNS = résiduel + Σ temps × 100 ÷ limite NOAA(PpO2), total arrondi au % supérieur.
 * Au-delà de 1,6 bar : règle Shearwater (le taux monte jusqu'à 1,65 bar, puis 15 %/min).
 * Élimination en surface : CNS × 2^(−t/90) (ou /120).
 */

/** NOAA Diving Manual : limite d'exposition unique (min) par PpO2 (bar). */
export const NOAA: readonly (readonly [number, number])[] = [
  [0.6, 720], [0.7, 570], [0.8, 450], [0.9, 360], [1.0, 300], [1.1, 240], [1.2, 210], [1.3, 180], [1.4, 150], [1.5, 120], [1.6, 45],
]
const EPS = 1e-9
export type Method = 'interp' | 'up'
export const ppO2 = (fo2: number, depth: number) => fo2 * (depth / 10 + 1)

/** Taux en % CNS par minute. */
export function rate(pp: number, method: Method = 'interp') {
  pp = Math.round(pp * 10000) / 10000
  if (pp <= 0.5 + EPS) return 0
  if (pp <= 0.6 + EPS) return 100 / 720
  if (pp > 1.6 + EPS) return pp >= 1.65 - EPS ? 15 : 100 / 45 + ((15 - 100 / 45) * (pp - 1.6)) / 0.05 // hors table (comme Shearwater)
  if (method === 'up') {
    for (const [p, l] of NOAA) if (p >= pp - EPS) return 100 / l
  }
  for (let i = 1; i < NOAA.length; i++) {
    const [p1, l1] = NOAA[i - 1], [p2, l2] = NOAA[i]
    if (pp <= p2 + EPS) return 100 / (l1 + ((l2 - l1) * (pp - p1)) / (p2 - p1))
  }
  return 100 / 45
}
export const limit = (pp: number, method: Method = 'interp') => {
  const r = rate(pp, method)
  return r > 0 ? 100 / r : Infinity
}

/** Transit à vitesse constante : intégration (point milieu). */
function transit(fo2: number, d0: number, d1: number, v: number, method: Method) {
  const t = Math.abs(d0 - d1) / v
  if (t <= 0) return { t: 0, cns: 0, ppMax: ppO2(fo2, Math.max(d0, d1)) }
  const n = 200
  let s = 0
  for (let i = 0; i < n; i++) {
    const d = d0 + ((d1 - d0) * (i + 0.5)) / n
    s += rate(ppO2(fo2, d), method)
  }
  return { t, cns: (s / n) * t, ppMax: ppO2(fo2, Math.max(d0, d1)) }
}

export type SegKind = 'fond' | 'niveau' | 'palier' | 'rem'
export type Seg = {
  kind: SegKind; depth: number; fo2: number; pp: number; t: number; cns: number; lim: number | null
  /** Remontée / descente : profondeurs de départ et d'arrivée. */
  from?: number; to?: number; deco?: boolean
}
export type Plan = {
  residual: number; fo2: number; depth: number; tb: number
  levels: { depth: number; t: number }[]
  stops: { depth: number; t: number; gas: 'fond' | 'deco' }[]
  fo2Deco: number | null; ascent: boolean; v: number; method: Method
}

export function compute(plan: Plan) {
  const m = plan.method || 'interp'
  const segs: Seg[] = []
  const ppB = ppO2(plan.fo2, plan.depth)
  segs.push({ kind: 'fond', depth: plan.depth, fo2: plan.fo2, pp: ppB, t: plan.tb, cns: plan.tb * rate(ppB, m), lim: limit(ppB, m) })
  let cur = plan.depth, gas = plan.fo2
  const asc = (to: number) => {
    if (!plan.ascent || cur === to) return
    const r = transit(gas, cur, to, plan.v || 10, m)
    segs.push({ kind: 'rem', depth: cur, from: cur, to, fo2: gas, pp: r.ppMax, t: r.t, cns: r.cns, lim: null })
  }
  for (const l of plan.levels || []) {
    if (!(l.t > 0)) continue
    asc(l.depth)
    cur = l.depth
    const pp = ppO2(gas, l.depth)
    segs.push({ kind: 'niveau', depth: l.depth, fo2: gas, pp, t: l.t, cns: l.t * rate(pp, m), lim: limit(pp, m) })
  }
  const lastDepth = cur
  const stops = (plan.stops || []).filter((s) => s.t > 0 && s.depth < cur).sort((a, b) => b.depth - a.depth)
  for (const s of stops) {
    asc(s.depth)
    cur = s.depth
    if (s.gas === 'deco' && plan.fo2Deco) gas = plan.fo2Deco
    const pp = ppO2(gas, s.depth)
    segs.push({ kind: 'palier', depth: s.depth, fo2: gas, pp, t: s.t, cns: s.t * rate(pp, m), lim: limit(pp, m), deco: gas !== plan.fo2 })
  }
  asc(0)
  const dive = segs.reduce((a, s) => a + s.cns, 0)
  const exact = (plan.residual || 0) + dive
  const total = Math.ceil(exact - 1e-6)
  const rB = rate(ppB, m)
  const others = exact - segs[0].cns
  const tbMax = (target: number) => (rB > 0 ? Math.max(0, (target - others) / rB) : Infinity)
  return { segs, dive, exact, total, ppB, lastDepth, tbMax80: tbMax(80), tbMax100: tbMax(100), ppMax: Math.max(...segs.map((s) => s.pp)) }
}
export type CnsResult = ReturnType<typeof compute>

/** Élimination en surface : demi-vie 90 min par défaut, 120 en option prudente. */
export const decay = (cns: number, t: number, half = 90) => cns * Math.pow(2, -t / half)
/** Budget de la plongée suivante pour finir sous 80 %, après t min de surface. */
export const nextBudget = (cns: number, t: number, half = 90) => Math.max(0, 80 - Math.ceil(decay(cns, t, half) - 1e-6))

// ── Réglages de l'outil (modèle) ──
export const BASE_STOPS = [12, 9, 6, 3] as const
export const MIXES_BOTTOM = [21, 28, 32, 36, 40] as const
export const MIXES_DECO = [0, 50, 80, 100] as const
export const DECAY_STEPS = [90, 180, 360, 540] as const
export const MAX_LEVELS = 4

export type CnsState = {
  resMode: 'known' | 'prev'; res: number; prevCns: number; si: number
  fo2: number; depth: number; tb: number
  levels: { d: number; t: number }[]
  fo2Deco: number
  stops: Record<string, number>
  extra: number[]
  gasSel: Record<string, 'fond' | 'deco'>
  ascent: boolean; v: number; method: Method; half: 90 | 120
}
export const DEFAULT_STATE: CnsState = {
  resMode: 'known', res: 0, prevCns: 40, si: 120, fo2: 32, depth: 30, tb: 40, levels: [], fo2Deco: 0,
  stops: { 12: 0, 9: 0, 6: 0, 3: 3 }, extra: [], gasSel: {}, ascent: true, v: 10, method: 'interp', half: 90,
}
export const STORAGE_KEY = 'orque-cns-v1'
export const SPECS = {
  res: { step: 1, min: 0, max: 150 },
  prevCns: { step: 1, min: 0, max: 150 },
  si: { step: 15, min: 0, max: 1440 },
  fo2: { step: 1, min: 10, max: 100 },
  depth: { step: 1, min: 0, max: 120 },
  tb: { step: 1, min: 0, max: 600 },
  v: { step: 1, min: 3, max: 20 },
  lvlD: { step: 1, min: 0, max: 120 },
  lvlT: { step: 1, min: 0, max: 600 },
  stop: { step: 1, min: 0, max: 300 },
} as const
export type NumKey = 'res' | 'prevCns' | 'si' | 'fo2' | 'depth' | 'tb' | 'v'

export const stopDepths = (s: CnsState) => [...new Set([...s.extra, ...BASE_STOPS])].sort((a, b) => b - a)
export const lastLevelDepth = (s: CnsState) => {
  let d = s.depth
  for (const l of s.levels) if (l.t > 0) d = l.d
  return d
}
export const resEff = (s: CnsState) => (s.resMode === 'prev' ? Math.ceil(decay(s.prevCns, s.si, s.half) - 1e-6) : s.res)
/** Gaz d'un palier : choix explicite, sinon auto (déco si PpO2 ≤ 1,6). */
export function stopGas(s: CnsState, d: number): 'fond' | 'deco' {
  if (!s.fo2Deco) return 'fond'
  const sel = s.gasSel[d]
  if (sel === 'fond' || sel === 'deco') return sel
  return ppO2(s.fo2Deco / 100, d) <= 1.6 + 1e-9 ? 'deco' : 'fond'
}
export function planOf(s: CnsState): Plan {
  return {
    residual: resEff(s), fo2: s.fo2 / 100, depth: s.depth, tb: s.tb, fo2Deco: s.fo2Deco ? s.fo2Deco / 100 : null,
    levels: s.levels.map((l) => ({ depth: +l.d || 0, t: +l.t || 0 })),
    stops: stopDepths(s).map((d) => ({ depth: d, t: +s.stops[d] || 0, gas: stopGas(s, d) })),
    ascent: s.ascent, v: s.v, method: s.method,
  }
}
/** Ligne(s) de la table NOAA utilisées (surlignées dans « Comprendre »). */
export function usedNoaaRows(r: CnsResult, method: Method) {
  const used = new Set<number>()
  for (const s of r.segs) if (s.kind !== 'rem' && s.pp > 0.5) {
    const p = Math.round(s.pp * 1000) / 1000
    const i = NOAA.findIndex(([q]) => q >= p - 1e-9)
    if (i < 0) used.add(NOAA.length - 1)
    else {
      used.add(i)
      if (method !== 'up' && i > 0 && Math.abs(NOAA[i][0] - p) > 1e-9) used.add(i - 1)
    }
  }
  return used
}

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
export function sanitizeState(raw: unknown): CnsState | null {
  if (!raw || typeof raw !== 'object') return null
  const j = raw as Record<string, unknown>
  const D = DEFAULT_STATE
  const num = (k: NumKey) => (fin(j[k]) ? Math.min(SPECS[k].max, Math.max(SPECS[k].min, j[k] as number)) : D[k])
  const stops: Record<string, number> = { ...D.stops }
  if (j.stops && typeof j.stops === 'object') for (const [k, v] of Object.entries(j.stops as Record<string, unknown>)) if (fin(v) && /^\d+$/.test(k)) stops[k] = v
  const gasSel: Record<string, 'fond' | 'deco'> = {}
  if (j.gasSel && typeof j.gasSel === 'object') for (const [k, v] of Object.entries(j.gasSel as Record<string, unknown>)) if (v === 'fond' || v === 'deco') gasSel[k] = v
  return {
    resMode: j.resMode === 'prev' ? 'prev' : 'known',
    res: num('res'), prevCns: num('prevCns'), si: num('si'), fo2: num('fo2'), depth: num('depth'), tb: num('tb'), v: num('v'),
    levels: Array.isArray(j.levels)
      ? (j.levels as unknown[]).filter((l): l is { d: number; t: number } => !!l && typeof l === 'object' && fin((l as { d: unknown }).d) && fin((l as { t: unknown }).t)).slice(0, MAX_LEVELS).map((l) => ({ d: l.d, t: l.t }))
      : [],
    fo2Deco: (MIXES_DECO as readonly number[]).includes(j.fo2Deco as number) ? (j.fo2Deco as number) : 0,
    stops,
    extra: Array.isArray(j.extra) ? (j.extra as unknown[]).filter(fin) : [],
    gasSel,
    ascent: typeof j.ascent === 'boolean' ? j.ascent : D.ascent,
    method: j.method === 'up' ? 'up' : 'interp',
    half: j.half === 120 ? 120 : 90,
  }
}
