/**
 * Composition trimix (meilleur mélange de fond) : logique pure, portée à l'identique du modèle
 * `trimix-composition.html`. Aucune formule, constante ni arrondi n'a été modifié.
 *
 *   FO2 = ppO2 max ÷ P abs ; FN2 = 0,79 × (END/10 + 1) ÷ P abs (ou FN2 + FO2 si O2 narcotique) ;
 *   FHe = 1 − FO2 − FN2. Densité à 0 °C (O2 1,429 ; N2 1,251 ; He 0,1786 g/L).
 *   Arrondi côté sécurité : O2 à l'inférieur, puis N2 à l'inférieur à partir de l'O2 retenu, He = le reste.
 */

export const RHO = { o2: 1.429, n2: 1.251, he: 0.1786 } as const // g/L à 0 °C, 1 atm
export const DENS_OK = 5.2
export const DENS_MAX = 6.2
export const PP_MIN = 0.16 // plancher hypoxique par défaut
const EPS = 1e-9
export const pAbs = (d: number) => d / 10 + 1
export const mod = (pp: number, fo2: number) => (pp / fo2 - 1) * 10
const floorD = (x: number) => Math.floor(x + EPS)
const ceilD = (x: number) => Math.ceil(x - EPS)

/** END d'un mélange (fractions 0–1) à la profondeur d (m). */
export function endOf(d: number, fo2: number, fn2: number, o2narc: boolean) {
  const narc = o2narc ? fn2 + fo2 : fn2 / 0.79
  return (d + 10) * narc - 10
}
/** Densité du gaz respiré (g/L) à la profondeur d. */
export function density(d: number, fo2: number, fn2: number, fhe: number) {
  return pAbs(d) * (fo2 * RHO.o2 + fn2 * RHO.n2 + fhe * RHO.he)
}
/** Mélange idéal exact (fractions 0–1, non arrondies). */
export function ideal(d: number, ppMax: number, end: number, o2narc: boolean) {
  const P = pAbs(d)
  const fo2 = Math.min(1, ppMax / P)
  const narcTot = (end / 10 + 1) / P
  const fn2 = o2narc ? narcTot - fo2 : 0.79 * narcTot
  const fhe = 1 - fo2 - fn2
  return { fo2, fn2, fhe, P }
}
/** Fraction d'azote maximale (0–1) pour que la densité au fond reste ≤ cap, à FO2 donnée. */
export function fn2ForDensity(d: number, fo2: number, cap: number) {
  return (cap / pAbs(d) - fo2 * RHO.o2 - (1 - fo2) * RHO.he) / (RHO.n2 - RHO.he)
}

export type Kind = 'trimix' | 'nitrox' | 'air' | 'heliox'
export type Note = 'noHe' | 'heliox' | 'hypoxic' | 'travel' | 'densHigh' | 'densMid' | 'ppHigh' | 'densCapKO'
export type TxInput = { depth: number; ppMax: number; end: number; o2narc?: boolean; ppMin?: number; densMax?: number }
export type TxResult = ReturnType<typeof compute>

/** Calcul complet. densMax : g/L, 0 ou absent = libre. */
export function compute(o: TxInput) {
  const d = o.depth, ppMax = o.ppMax, end = o.end, o2narc = !!o.o2narc, ppMin = o.ppMin ?? PP_MIN
  const cap = o.densMax && o.densMax > 0 ? o.densMax : 0
  const ex = ideal(d, ppMax, end, o2narc)
  const P = ex.P
  // Limite sur l'azote : l'END, et éventuellement la densité maximale choisie.
  let bind: 'end' | 'density' = 'end'
  if (cap) {
    const fd = fn2ForDensity(d, ex.fo2, cap)
    if (fd < ex.fn2 - EPS) { ex.fn2 = fd; ex.fhe = 1 - ex.fo2 - fd; bind = 'density' }
  }
  let kind: Kind = 'trimix'
  let o2: number, he: number, n2: number
  if (ex.fhe <= EPS) {
    // L'END visée (et la densité) sont respectées sans hélium : un nitrox (ou de l'air) suffit.
    kind = ex.fo2 > 0.21 + EPS ? 'nitrox' : 'air'
    o2 = kind === 'air' ? 21 : Math.min(100, floorD(ex.fo2 * 100))
    he = 0; n2 = 100 - o2
  } else if (ex.fn2 <= EPS) {
    // Plus de place pour l'azote (O2 narcotique et END très faible, ou densité) : héliox.
    kind = 'heliox'
    o2 = floorD(ex.fo2 * 100); he = 100 - o2; n2 = 0
  } else {
    // O2 arrondi en dessous, puis N2 arrondi en dessous à partir de l'O2 retenu ; l'hélium prend le reste.
    o2 = floorD(ex.fo2 * 100)
    const narcTot = ((end / 10 + 1) / P) * 100
    let n2max = o2narc ? narcTot - o2 : 0.79 * narcTot
    if (cap) n2max = Math.min(n2max, fn2ForDensity(d, o2 / 100, cap) * 100)
    n2 = Math.max(0, floorD(n2max))
    he = 100 - o2 - n2
  }
  const f = { o2: o2 / 100, he: he / 100, n2: n2 / 100 }
  const pp = { o2: f.o2 * P, n2: f.n2 * P, he: f.he * P }
  const endReal = endOf(d, f.o2, f.n2, o2narc)
  const dens = density(d, f.o2, f.n2, f.he)
  const minRaw = mod(ppMin, f.o2)
  const minDepth = Math.max(0, ceilD(minRaw))
  const mod14 = Math.max(0, floorD(mod(1.4, f.o2)))
  const mod16 = Math.max(0, floorD(mod(1.6, f.o2)))
  const modMax = Math.max(0, floorD(mod(ppMax, f.o2)))
  const name = kind === 'air' ? 'Air' : kind === 'nitrox' ? 'Nx ' + o2 : kind === 'heliox' ? 'Hx ' + o2 + '/' + he : 'Tx ' + o2 + '/' + he
  const notes: Note[] = []
  if (kind === 'air' || kind === 'nitrox') notes.push('noHe')
  if (kind === 'heliox') notes.push('heliox')
  if (f.o2 < ppMin - EPS) notes.push('hypoxic')
  if (minDepth > 0) notes.push('travel')
  if (dens > DENS_MAX + EPS) notes.push('densHigh')
  else if (dens > DENS_OK + EPS) notes.push('densMid')
  if (pp.o2 > 1.6 + EPS) notes.push('ppHigh')
  if (cap && dens > cap + 1e-6) notes.push('densCapKO')
  return {
    input: { depth: d, ppMax, end, o2narc, ppMin },
    exact: { o2: ex.fo2 * 100, n2: ex.fn2 * 100, he: ex.fhe * 100 },
    kind, name, pct: { o2, he, n2 }, f, P, pp,
    endReal, dens, bind: kind === 'trimix' || kind === 'heliox' ? bind : ('none' as const), minDepth, minRaw, mod14, mod16, modMax, notes,
    normoxic: f.o2 >= ppMin - EPS,
  }
}

/** Évalue un mélange donné (% entiers) à une profondeur. */
export function evalMix(d: number, o2: number, he: number, o2narc: boolean, ppMin = PP_MIN) {
  const n2 = 100 - o2 - he, P = pAbs(d)
  return {
    o2, he, n2, name: 'Tx ' + o2 + '/' + he,
    ppO2: (o2 / 100) * P, end: endOf(d, o2 / 100, n2 / 100, o2narc), dens: density(d, o2 / 100, n2 / 100, he / 100),
    minDepth: Math.max(0, ceilD(mod(ppMin, o2 / 100))),
  }
}

/** Trimix « standards » usuels (familles GUE / Divesoft). */
export const STANDARDS = [[21, 35], [18, 45], [15, 55], [12, 65], [10, 70]] as const

/** Gaz standard le moins chargé en hélium qui respecte ppO2 max, END visée et densité max. null si aucun. */
export function nearestStandard(d: number, ppMax: number, end: number, o2narc: boolean, densMax: number, ppMin: number) {
  for (const [o2, he] of STANDARDS) {
    const m = evalMix(d, o2, he, o2narc, ppMin)
    if (m.ppO2 <= ppMax + EPS && m.end <= end + EPS && (!densMax || m.dens <= densMax + EPS)) return m
  }
  return null
}

/** Tableau de repères : une ligne par profondeur. */
export function table(depths: number[], ppMax: number, end: number, o2narc: boolean, ppMin: number, densMax: number) {
  return depths.map((d) => compute({ depth: d, ppMax, end: Math.min(end, d), o2narc, ppMin, densMax }))
}

// ── Réglages de l'interface (modèle) ──
export const QUICK = { depth: [40, 50, 60, 70, 80, 90, 100, 120], ppMax: [1.2, 1.3, 1.4], end: [24, 30, 35, 40] } as const
export const SPECS = {
  depth: { step: 1, min: 10, max: 150 },
  ppMax: { step: 0.05, min: 0.5, max: 1.6 },
  end: { step: 1, min: 0, max: 60 },
} as const
export const PPMINS = [0.16, 0.18, 0.21] as const
export const DENS_CAPS = [0, 6.2, 5.2] as const

export type TxState = { depth: number; ppMax: number; end: number; o2narc: boolean; ppMin: number; densMax: number }
export const DEFAULT_STATE: TxState = { depth: 60, ppMax: 1.4, end: 30, o2narc: false, ppMin: 0.16, densMax: 6.2 }
export const STORAGE_KEY = 'trimix-composition-v2'

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
export function sanitizeState(raw: unknown): TxState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!fin(s.depth)) return null
  const D = DEFAULT_STATE
  const cl = (k: keyof typeof SPECS, v: unknown, d: number) => (fin(v) ? Math.min(SPECS[k].max, Math.max(SPECS[k].min, v)) : d)
  return {
    depth: cl('depth', s.depth, D.depth), ppMax: cl('ppMax', s.ppMax, D.ppMax), end: cl('end', s.end, D.end),
    o2narc: typeof s.o2narc === 'boolean' ? s.o2narc : D.o2narc,
    ppMin: (PPMINS as readonly unknown[]).includes(s.ppMin) ? (s.ppMin as number) : D.ppMin,
    densMax: (DENS_CAPS as readonly unknown[]).includes(s.densMax) ? (s.densMax as number) : D.densMax,
  }
}
