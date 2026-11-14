/**
 * END (profondeur équivalente narcotique) et densité d'un mélange : logique pure, portée à
 * l'identique du modèle `end.html`. Aucune formule, constante ni arrondi n'a été modifié.
 *
 * END O2 + N2 : [P × (1 − fHe) − 1] × 10 ; N2 seul : [P × fN2 ÷ 0,79 − 1] × 10 ;
 * tous gaz : He compté × 0,23. Densité : P × Σ f·ρ, gaz à 20 °C. Eau de mer, 10 m par bar.
 */

export type Mode = 'on' | 'n2' | 'all'
type Frac = { o2: number; he: number; n2: number }

/** Puissance narcotique relative (N2 = 1). */
export const K = { n2: 1, o2: 1, he: 0.23 } as const
/** bar, eau de mer */
export const pAbs = (d: number) => d / 10 + 1
export const frac = (o2: number, he: number): Frac => ({ o2: o2 / 100, he: he / 100, n2: 1 - o2 / 100 - he / 100 })
/** Coefficient « narcotique » du mélange, comparé à l'air (air = 1). */
export const coef = (f: Frac, mode: Mode) =>
  mode === 'n2' ? f.n2 / 0.79 : mode === 'all' ? f.n2 * K.n2 + f.o2 * K.o2 + f.he * K.he : f.n2 + f.o2
export const end = (d: number, o2: number, he: number, mode: Mode) => (pAbs(d) * coef(frac(o2, he), mode) - 1) * 10
export const maxDepth = (endMax: number, o2: number, he: number, mode: Mode) => {
  const c = coef(frac(o2, he), mode)
  return c > 0 ? ((endMax / 10 + 1) / c - 1) * 10 : Infinity
}
/** Hélium mini (fraction) à O2 constant pour respecter endMax à la profondeur d. */
export const minHe = (endMax: number, d: number, o2: number, mode: Mode) => {
  const P = pAbs(d), target = (endMax / 10 + 1) / P, fo2 = o2 / 100
  let he: number
  if (mode === 'n2') he = 1 - fo2 - 0.79 * target
  else if (mode === 'all') he = (1 - target) / (1 - K.he)
  else he = 1 - target
  return Math.max(0, he)
}
export const narcIndex = (d: number, o2: number, he: number) => pAbs(d) * coef(frac(o2, he), 'all')
/** Masse volumique des gaz purs à 20 °C et 1 atm (g/L). */
export const RHO = { o2: 1.331, n2: 1.165, he: 0.166 } as const
export const rhoMix = (o2: number, he: number) => {
  const f = frac(o2, he)
  return f.o2 * RHO.o2 + f.n2 * RHO.n2 + f.he * RHO.he
}
export const density = (d: number, o2: number, he: number) => pAbs(d) * rhoMix(o2, he)
export const maxDepthDensity = (lim: number, o2: number, he: number) => (lim / rhoMix(o2, he) - 1) * 10
/** Mélange idéal : O2 le plus riche pour ppO2max (arrondi bas, plafonné à 40 %), He mini pour endMax (arrondi haut). */
export const bestMix = (d: number, ppo2max: number, endMax: number, mode: Mode) => {
  const o2 = Math.min(40, Math.floor((ppo2max / pAbs(d)) * 100 + 1e-9))
  const he = Math.max(0, Math.ceil(minHe(endMax, d, o2, mode) * 100 - 1e-9))
  return o2 + he <= 100 ? { o2, he } : null
}
export const ceil = (x: number) => Math.ceil(x - 1e-9)
export const floor = (x: number) => Math.floor(x + 1e-9)

/** Nom du mélange (Air, Nx32, Tx 18/45, Héliox 10/90, O₂ pur). */
export function mixName(o2: number, he: number, heliox: string, pureO2: string) {
  return he ? (o2 + he === 100 ? heliox + ' ' : 'Tx ') + o2 + '/' + he : o2 === 21 ? 'Air' : o2 === 100 ? pureO2 : 'Nx' + o2
}

// ── Réglages de l'interface (modèle) ──
export const MIXES = [
  { n: 'Air', o2: 21, he: 0 }, { n: 'Nx32', o2: 32, he: 0 }, { n: 'Nx36', o2: 36, he: 0 }, { n: 'Tx 21/35', o2: 21, he: 35, s: 60 },
  { n: 'Tx 18/45', o2: 18, he: 45, s: 70 }, { n: 'Tx 15/55', o2: 15, he: 55, s: 80 }, { n: 'Tx 12/65', o2: 12, he: 65, s: 100 }, { n: 'Tx 10/70', o2: 10, he: 70, s: 120 },
] as const
export const DEPTHS = [20, 30, 40, 50, 60, 70, 80, 100] as const
export const LIMS = [24, 30, 36, 40] as const
export const MODES: readonly Mode[] = ['on', 'n2', 'all']
export const SPECS = {
  o2: { step: 1, min: 5, max: 100 },
  he: { step: 1, min: 0, max: 95 },
  d: { step: 1, min: 0, max: 200 },
} as const

export type EndState = { o2: number; he: number; d: number; mode: Mode; lim: number }
export const DEFAULT_STATE: EndState = { o2: 18, he: 45, d: 60, mode: 'on', lim: 30 }
export const STORAGE_KEY = 'orque-end-v1'

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
export function sanitizeState(raw: unknown): EndState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!fin(s.o2)) return null
  const D = DEFAULT_STATE
  const cl = (k: keyof typeof SPECS, v: unknown, d: number) => (fin(v) ? Math.min(SPECS[k].max, Math.max(SPECS[k].min, v)) : d)
  return {
    o2: cl('o2', s.o2, D.o2), he: cl('he', s.he, D.he), d: cl('d', s.d, D.d),
    mode: s.mode === 'n2' || s.mode === 'all' ? s.mode : 'on',
    lim: fin(s.lim) ? Math.min(100, Math.max(0, s.lim)) : D.lim,
  }
}
