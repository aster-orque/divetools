/**
 * Élimination du CNS en surface : logique pure, portée à l'identique des modèles
 * `cns-intervalle.html` et `cns-reduction.html` (moteurs identiques).
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 * CNS restant = CNS fin × 2^(−t/T), arrondi au % supérieur.
 * Intervalle = T × log₂(CNS fin ÷ CNS voulu), arrondi à la minute supérieure.
 * T = 90 min (convention Baker, Shearwater, Subsurface) ou 120 min (option prudente).
 */

export const HALF = 90
export const HALVES = [90, 120] as const
export type Half = (typeof HALVES)[number]
const EPS = 1e-9

/** CNS restant exact après t minutes. */
export const residual = (cns: number, t: number, half: number = HALF) => cns * Math.pow(2, -t / half)
/** CNS restant arrondi au % supérieur. */
export const residualUp = (cns: number, t: number, half: number = HALF) => Math.ceil(residual(cns, t, half) - EPS)
/** Minutes (arrondi supérieur) pour que le CNS restant exact soit ≤ target ; 0 si déjà atteint. */
export const timeTo = (cns: number, target: number, half: number = HALF) =>
  cns <= target ? 0 : Math.ceil(half * Math.log2(cns / target) - EPS)

export type Level = 'ok' | 'mid' | 'low'
/** Résiduel : de la marge sous 80 %, vigilance de 80 à 100 %, danger au-delà (Réduction). */
export const level = (r: number): Level => (r < 80 ? 'ok' : r <= 100 ? 'mid' : 'low')
/** Total en fin de plongée suivante : ≤ 80 % conseillé, 100 % = limite. */
export const nextLevel = (tot: number): Level => (tot <= 80 ? 'ok' : tot <= 100 ? 'mid' : 'low')

/** Durée lisible : 45 min, 1 h 30, 2 h. */
export const hm = (m: number) => {
  m = Math.round(m)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), r = m % 60
  return `${h} h${r ? ` ${String(r).padStart(2, '0')}` : ''}`
}

/** « 14:05 » + minutes → { hhmm, day } (day = jours de décalage, J+1…). */
export function addClock(hhmm: string, add: number): { hhmm: string; day: number } | null {
  const x = /^(\d{1,2}):(\d{2})/.exec(hhmm || '')
  if (!x) return null
  const tot = +x[1] * 60 + +x[2] + Math.round(add)
  const day = Math.floor(tot / 1440), t = ((tot % 1440) + 1440) % 1440
  return { hhmm: `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, day }
}
export const nowHM = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
/** Minutes écoulées depuis l'heure de sortie (sur 24 h). */
export function sinceExit(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm || '')
  if (!m) return null
  const b = +m[1] * 60 + +m[2]
  const n = new Date(), now = n.getHours() * 60 + n.getMinutes()
  return (((now - b) % 1440) + 1440) % 1440
}

// ── Intervalle CNS (modèle cns-intervalle.html) ──
export const GOALS = [30, 20, 10] as const
export const PAUSES = [60, 90, 120, 180, 240] as const
export type IntState = { mode: 'int' | 'red'; fin: number; goal: number; next: number; pause: number; half: Half }
export const INT_DEFAULT: IntState = { mode: 'int', fin: 60, goal: 30, next: 0, pause: 90, half: 90 }
export const INT_KEY = 'cns-intervalle-v2'
export const INT_SPECS = {
  fin: { step: 1, min: 1, max: 200 },
  goal: { step: 1, min: 1, max: 200 },
  next: { step: 1, min: 0, max: 150 },
  pause: { step: 5, min: 0, max: 1440 },
} as const
/** Zones des ordinateurs : jusqu'à 80 %, jusqu'à 100 %, au-delà. */
export const zone = (v: number): Level => (v <= 80 ? 'ok' : v <= 100 ? 'mid' : 'low')

// ── Réduction du CNS (modèle cns-reduction.html) ──
export const RED_QC = [30, 50, 60, 80, 100] as const
export const RED_QT = [30, 60, 90, 120, 180, 360, 720] as const
export type RedState = { cns: number; t: number; nx: number; exit: string; half: Half }
export const RED_DEFAULT: RedState = { cns: 60, t: 120, nx: 20, exit: '', half: 90 }
export const RED_KEY = 'orque-cns-reduction-v1'
export const RED_SPECS = {
  cns: { step: 1, min: 1, max: 200 },
  t: { step: 15, min: 0, max: 1440 },
  nx: { step: 5, min: 0, max: 150 },
} as const

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const clampK = (v: unknown, s: { min: number; max: number }, d: number) => (fin(v) ? Math.min(s.max, Math.max(s.min, Math.round(v))) : d)
const halfOf = (x: unknown): Half => (x === 120 ? 120 : 90)

export function sanitizeInt(raw: unknown): IntState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!fin(s.fin)) return null
  return {
    mode: s.mode === 'red' ? 'red' : 'int',
    fin: clampK(s.fin, INT_SPECS.fin, INT_DEFAULT.fin),
    goal: clampK(s.goal, INT_SPECS.goal, INT_DEFAULT.goal),
    next: clampK(s.next, INT_SPECS.next, INT_DEFAULT.next),
    pause: clampK(s.pause, INT_SPECS.pause, INT_DEFAULT.pause),
    half: halfOf(s.half),
  }
}
export function sanitizeRed(raw: unknown): RedState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!fin(s.cns) || !fin(s.t)) return null
  return {
    cns: clampK(s.cns, RED_SPECS.cns, RED_DEFAULT.cns),
    t: clampK(s.t, RED_SPECS.t, RED_DEFAULT.t),
    nx: clampK(s.nx, RED_SPECS.nx, RED_DEFAULT.nx),
    exit: typeof s.exit === 'string' && /^\d{1,2}:\d{2}$/.test(s.exit) ? s.exit : '',
    half: halfOf(s.half),
  }
}

/** Pas « intelligent » du modèle Réduction : se cale sur le multiple du pas. */
export function redBump(v: number, d: number) {
  const st = Math.abs(d)
  return d > 0 ? Math.floor(v / st) * st + st : Math.ceil(v / st) * st - st
}
