/**
 * MOD : logique pure, portée à l'identique du modèle `mod.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 * Conventions : en mer, 1 bar en surface et 10 m d'eau par bar (usage français, tables MN90).
 * En eau douce, 10,2 m par bar, et pression de surface réduite avec l'altitude
 * (atmosphère standard OACI : 1,01325 × (1 − 2,25577e-5 × h)^5,25588 bar),
 * plafonnée à 1 bar pour rester cohérente avec la mer et ne jamais allonger la MOD.
 * MOD arrondie au mètre inférieur, profondeur mini d'un mélange hypoxique au mètre supérieur.
 */

export const EPS = 1e-9

export type Water = 'sea' | 'fresh'
export type Env = { water: Water; alt: number }
export const SEA: Env = { water: 'sea', alt: 0 }

export function mPerBar(env: Env = SEA) {
  return env.water === 'fresh' ? 10.2 : 10
}
export function pSurf(env: Env = SEA) {
  return env.water === 'fresh' && env.alt > 0 ? Math.min(1, 1.01325 * Math.pow(1 - 2.25577e-5 * env.alt, 5.25588)) : 1
}
/** Pression absolue (bar) maximale pour une ppO2 et un % O2. */
export function pMax(pp: number, o2: number) {
  return pp / (o2 / 100)
}
/** MOD brute (m) ; négative = mélange inutilisable à cette ppO2. */
export function modRaw(pp: number, o2: number, env: Env = SEA) {
  return (pMax(pp, o2) - pSurf(env)) * mPerBar(env)
}
/** MOD arrondie au mètre inférieur. */
export function mod(pp: number, o2: number, env: Env = SEA) {
  return Math.floor(modRaw(pp, o2, env) + EPS)
}
/** ppO2 à une profondeur donnée. */
export function ppAt(depth: number, o2: number, env: Env = SEA) {
  return (depth / mPerBar(env) + pSurf(env)) * o2 / 100
}
/** Profondeur minimale d'un mélange hypoxique (ppO2 plancher 0,16 bar), arrondie au mètre supérieur. */
export function minDepth(o2: number, env: Env = SEA, ppMin = 0.16) {
  const d = (ppMin / (o2 / 100) - pSurf(env)) * mPerBar(env)
  return d <= 0 ? 0 : Math.ceil(d - EPS)
}

// ── Réglages de l'outil (modèle) ──
export const MIXES = [21, 28, 32, 36, 40, 50, 80, 100] as const
export const PPS = [1.2, 1.4, 1.5, 1.6] as const
export const TABLE_PPS = [1.2, 1.4, 1.5, 1.6] as const

export type ModState = { o2: number; pp: number; water: Water; alt: number; d: number }
export const DEFAULT_STATE: ModState = { o2: 32, pp: 1.4, water: 'sea', alt: 0, d: 30 }
export const STORAGE_KEY = 'orque-mod-v1'

export const SPECS = {
  o2: { step: 1, min: 5, max: 100 },
  pp: { step: 0.05, min: 0.5, max: 2 },
  alt: { step: 100, min: 0, max: 4000 },
  d: { step: 1, min: 0, max: 200 },
} as const
export type NumKey = keyof typeof SPECS

/** Arrondi d'une saisie libre (modèle : ppO2 au centième, O2 au dixième, le reste à l'unité). */
export function roundInput(k: NumKey, v: number) {
  return k === 'pp' ? Math.round(v * 100) / 100 : k === 'o2' ? Math.round(v * 10) / 10 : Math.round(v)
}

const fin = (x: unknown) => typeof x === 'number' && Number.isFinite(x)
export function sanitizeState(raw: unknown): ModState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!fin(s.o2) || !fin(s.pp)) return null
  return {
    ...DEFAULT_STATE,
    o2: s.o2 as number,
    pp: s.pp as number,
    water: s.water === 'fresh' ? 'fresh' : 'sea',
    alt: fin(s.alt) ? (s.alt as number) : 0,
    d: fin(s.d) ? (s.d as number) : 30,
  }
}

/** Statut d'une profondeur prévue. */
export type CheckLevel = 'ok' | 'mid' | 'hypo' | 'tox'
export function checkDepth(pd: number, pp: number): CheckLevel {
  if (pd < 0.16) return 'hypo'
  if (pd <= pp + EPS) return 'ok'
  if (pd <= 1.6 + EPS) return 'mid'
  return 'tox'
}
