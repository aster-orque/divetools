/**
 * PpO2 : logique pure, portée à l'identique du modèle `ppo2.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 * env = { ps: pression en surface (bar), k: mètres d'eau par bar }.
 * Mer : 1 bar en surface, 10 m par bar. Eau douce : 10,2 m par bar, pression de surface selon
 * l'atmosphère standard (1 bar au niveau de la mer).
 * Arrondis prudents : ppO2 affichée vers le haut (vers le bas sous 0,5 bar pour ne pas masquer
 * une hypoxie), MOD et meilleur mélange vers le bas, profondeur mini vers le haut.
 */

export type Env = { ps: number; k: number }
export type WaterKind = 'mer' | 'douce'
export const SEA: Env = { ps: 1, k: 10 }

/** Gomme les erreurs de virgule flottante. */
export const clean = (x: number) => Math.round(x * 1e6) / 1e6
/** Atmosphère standard, 1 bar au niveau de la mer. */
export const surf = (alt: number) => clean(Math.pow(1 - 2.25577e-5 * alt, 5.25588))
export const env = (water: WaterKind, alt: number): Env => ({ ps: water === 'douce' ? surf(alt || 0) : 1, k: water === 'douce' ? 10.2 : 10 })
export const pabs = (d: number, e: Env = SEA) => clean(e.ps + d / e.k)
export const pp = (o2: number, d: number, e: Env = SEA) => clean((o2 / 100) * (e.ps + d / e.k))
/** Profondeur max (m), vers le bas. */
export const mod = (o2: number, ppmax: number, e: Env = SEA) => Math.floor(clean((ppmax / (o2 / 100) - e.ps) * e.k))
/** Profondeur mini (m), vers le haut. */
export const minDepth = (o2: number, ppmin: number, e: Env = SEA) => Math.max(0, Math.ceil(clean((ppmin / (o2 / 100) - e.ps) * e.k)))
/** Meilleur mélange (%), vers le bas. */
export const bestMix = (d: number, ppmax: number, e: Env = SEA) => Math.min(100, Math.floor(clean((ppmax / pabs(d, e)) * 100)))
export type Level = 'hypo' | 'ok' | 'mid' | 'tox'
export const level = (p: number, lim = 1.4): Level => {
  p = clean(p)
  return p < 0.16 ? 'hypo' : p <= lim ? 'ok' : p <= 1.6 ? 'mid' : 'tox'
}
/** Arrondi prudent de l'affichage. */
export const disp = (p: number) => {
  p = clean(p)
  return p >= 0.5 ? Math.ceil(clean(p * 100)) / 100 : Math.floor(clean(p * 100)) / 100
}

// ── Réglages de l'outil (modèle) ──
export const MIXES = [21, 32, 36, 40, 50, 100] as const
export const DEPTHS = [10, 20, 30, 40, 50, 60] as const
export const LIMS = [1.2, 1.3, 1.4, 1.5, 1.6] as const

export type PpState = { o2: number; d: number; lim: number; water: WaterKind; alt: number }
export const DEFAULT_STATE: PpState = { o2: 32, d: 30, lim: 1.4, water: 'mer', alt: 0 }
export const STORAGE_KEY = 'orque-ppo2-v2'

export const SPECS = {
  o2: { step: 1, min: 5, max: 100 },
  d: { step: 1, min: 0, max: 150 },
  alt: { step: 100, min: 0, max: 4000 },
} as const
export type NumKey = keyof typeof SPECS

const fin = (x: unknown) => typeof x === 'number' && Number.isFinite(x)
export function sanitizeState(raw: unknown): PpState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!fin(s.o2) || !fin(s.d)) return null
  return {
    o2: s.o2 as number,
    d: s.d as number,
    lim: (LIMS as readonly number[]).includes(s.lim as number) ? (s.lim as number) : 1.4,
    water: s.water === 'douce' ? 'douce' : 'mer',
    alt: fin(s.alt) ? (s.alt as number) : 0,
  }
}
