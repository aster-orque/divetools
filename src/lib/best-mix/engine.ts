/**
 * Best mix : logique pure, portée à l'identique du modèle `best-mix.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 * Calcul en mer, 10 m par bar partout (plus prudent en lac).
 * % O2 arrondi à l'inférieur, MOD au mètre inférieur, EAD au mètre supérieur.
 */

export const EPS = 1e-9
export const pAbs = (d: number) => d / 10 + 1
/** % O2 maximal (entier, arrondi inférieur), plafonné à 100. */
export function bestMix(d: number, pp: number) {
  return Math.min(100, Math.floor((pp / pAbs(d)) * 100 + EPS))
}
/** ppO2 d'un mélange (en %) à une profondeur. */
export function ppO2(o2: number, d: number) {
  return (o2 / 100) * pAbs(d)
}
/** MOD (m, arrondi inférieur), bornée à 0. */
export function mod(o2: number, pp: number) {
  return Math.max(0, Math.floor((pp / (o2 / 100) - 1) * 10 + EPS))
}
/** EAD (m, arrondi supérieur), 0 si négative. */
export function ead(o2: number, d: number) {
  return Math.max(0, Math.ceil(((d + 10) * (1 - o2 / 100)) / 0.79 - 10 - EPS))
}
export const CLUB = [21, 32, 36, 40, 50, 80, 100] as const
/** Mélange du club le plus riche autorisé (null si même l'air dépasse). */
export function clubPick(d: number, pp: number): number | null {
  const b = bestMix(d, pp)
  const ok = CLUB.filter((m) => m <= b)
  return ok.length ? ok[ok.length - 1] : null
}
/** Limite NOAA d'exposition unique (min), interpolée entre les lignes du tableau. */
const CNS_NOAA: [number, number][] = [[0.6, 720], [0.7, 570], [0.8, 450], [0.9, 360], [1.0, 300], [1.1, 240], [1.2, 210], [1.3, 180], [1.4, 150], [1.5, 120], [1.6, 45]]
export function cnsLimit(p: number) {
  if (p < 0.6 - EPS) return Infinity
  if (p > 1.6 + EPS) return 0
  for (let i = 1; i < CNS_NOAA.length; i++) {
    const [p1, l1] = CNS_NOAA[i], [p0, l0] = CNS_NOAA[i - 1]
    if (p <= p1 + EPS) return Math.floor(l0 + ((l1 - l0) * (p - p0)) / (p1 - p0) + EPS)
  }
  return CNS_NOAA[0][1]
}
/** Masse volumique du gaz au fond (g/L), O2 1,429 et N2 1,2506 g/L à 1 atm. */
export function density(o2: number, d: number) {
  const f = o2 / 100
  return (pAbs(d) / 1.01325) * (f * 1.429 + (1 - f) * 1.2506)
}
/**
 * Temps sans palier indicatif : Bühlmann ZH-L16C (azote), GF haut 85 %, descente 20 m/min,
 * remontée non comptée. Pression réelle : 1,01325 bar + 0,1 bar/m. Renvoie des minutes entières.
 */
const ZH_T = [5, 8, 12.5, 18.5, 27, 38.3, 54.3, 77, 109, 146, 187, 239, 305, 390, 498, 635]
const ZH_A = [1.1696, 1.0, 0.8618, 0.7562, 0.62, 0.5043, 0.441, 0.4, 0.375, 0.35, 0.3295, 0.3065, 0.2835, 0.261, 0.248, 0.2327]
const ZH_B = [0.5578, 0.6514, 0.7222, 0.7825, 0.8126, 0.8434, 0.8693, 0.891, 0.9092, 0.9222, 0.9319, 0.9403, 0.9477, 0.9544, 0.9602, 0.9653]
export function ndl(o2: number, d: number, gf = 0.85, max = 200) {
  if (d <= 0) return Infinity
  const PS = 1.01325, W = 0.0627, fn = 1 - o2 / 100, rate = 20, td = d / rate
  const k = ZH_T.map((h) => Math.LN2 / h)
  let t = k.map(() => (PS - W) * 0.7902)
  // descente (équation de Schreiner)
  t = t.map((p0, i) => {
    const pi0 = (PS - W) * fn, r = 0.1 * rate * fn
    return pi0 + r * (td - 1 / k[i]) - (pi0 - p0 - r / k[i]) * Math.exp(-k[i] * td)
  })
  const pi = (PS + d / 10 - W) * fn
  const ok = (ts: number[]) => ts.every((p, i) => (p - ZH_A[i] * gf) / (gf / ZH_B[i] + 1 - gf) <= PS + EPS)
  let last = 0
  for (let m = Math.ceil(td); m <= max; m++) {
    const dt = m - td, ts = t.map((p0, i) => p0 + (pi - p0) * (1 - Math.exp(-k[i] * dt)))
    if (!ok(ts)) return last
    last = m
  }
  return Infinity
}

// ── Réglages de l'outil (modèle) ──
export const PPS = [1.2, 1.4, 1.6] as const
export const DEPTHS = [20, 25, 30, 35, 40] as const
export const REF_ROWS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60] as const

export type BestMixState = { d: number; pp: number }
export const DEFAULT_STATE: BestMixState = { d: 30, pp: 1.4 }
export const STORAGE_KEY = 'best-mix-v1'
export const SPECS = {
  d: { step: 1, min: 0, max: 100 },
  pp: { step: 0.05, min: 1, max: 1.6 },
} as const
export type NumKey = keyof typeof SPECS

export function sanitizeState(raw: unknown): BestMixState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (typeof s.d !== 'number' || typeof s.pp !== 'number' || !Number.isFinite(s.d) || !Number.isFinite(s.pp)) return null
  return { d: s.d, pp: s.pp }
}
