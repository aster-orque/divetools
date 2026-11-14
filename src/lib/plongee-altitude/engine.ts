/**
 * Plongée en altitude : logique pure, portée à l'identique du modèle `ead-altitude.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 * Pression atmosphérique : atmosphère normalisée OACI, P(h) = 1,01325 × (1 − 2,25577e-5 × h)^5,25588.
 * Variante « règle des cours » (FFESSM) : P altitude = 1 − h/10 000, P mer = 1 bar.
 * Variante « pression mesurée » : P altitude saisie (baromètre, ordinateur).
 * Coefficient Chauvin : k = P mer ÷ P altitude.
 * EAD en mer (nitrox) : (prof + 10) × (1 − FO2) ÷ 0,79 − 10.
 * Profondeur de table = EAD × k, au mètre supérieur. Palier réel = palier ÷ k, au décimètre supérieur.
 * Vitesse en altitude = vitesse ÷ k, au dixième inférieur. Pas de correction eau douce (marge en faveur du plongeur).
 */

export const P_SEA = 1.01325
/** Profondeurs des lignes de la table MN90 (m). */
export const MN90 = [6, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60, 62, 65] as const
export type Mode = 'oaci' | 'cours' | 'mesure'
export type TableKind = 'mn90' | 'autre'

export const pAlt = (h: number) => P_SEA * Math.pow(1 - 2.25577e-5 * h, 5.25588)
export const pCours = (h: number) => 1 - h / 10000
export const coef = (h: number) => P_SEA / pAlt(h)
export const ead = (prof: number, o2: number) => ((prof + 10) * (1 - o2 / 100)) / 0.79 - 10
/** Pression en surface du lac et pression de référence en mer selon la méthode choisie. */
export function surface(s: { mode: Mode; alt: number; pm: number }) {
  if (s.mode === 'cours') return { pa: pCours(s.alt), ps: 1 }
  if (s.mode === 'mesure') return { pa: s.pm, ps: P_SEA }
  return { pa: pAlt(s.alt), ps: P_SEA }
}
export const mn90Line = (d: number): number | null => MN90.find((x) => x >= d - 1e-9) ?? null

export type AltState = { alt: number; prof: number; o2: number; v: number; mode: Mode; pm: number; table: TableKind }
export function compute(s: AltState) {
  const { pa, ps } = surface(s), k = ps / pa, f = s.o2 / 100
  const air = s.o2 <= 21
  const e = air ? s.prof : Math.max(0, ead(s.prof, s.o2))
  const fictRaw = e * k
  const fict = Math.max(0, Math.ceil(fictRaw - 1e-9))
  const stops = [3, 6, 9].map((p) => ({ table: p, real: Math.ceil((p / k) * 10 - 1e-9) / 10 }))
  const v = Math.floor((s.v / k) * 10 + 1e-9) / 10
  const pp = f * (pa + s.prof / 10)
  const mod16 = Math.max(0, Math.floor((1.6 / f - pa) * 10 + 1e-9))
  const mod14 = Math.max(0, Math.floor((1.4 / f - pa) * 10 + 1e-9))
  const vStops = Math.floor((6 / k) * 10 + 1e-9) / 10 // MN90 : 6 m/min entre paliers
  return { pa, ps, k, air, ead: e, fictRaw, fict, stops, v, vStops, pp, mod14, mod16, line: mn90Line(fict) }
}
export type AltResult = ReturnType<typeof compute>

// ── Réglages de l'outil (modèle) ──
export const ALTS = [500, 1000, 1500, 2000, 2500] as const
export const MIXES = [21, 32, 36, 40] as const
export const SPEEDS: readonly { v: number; key: 'mn90' | 'buhl' | 'ordi'; table: TableKind }[] = [
  { v: 15, key: 'mn90', table: 'mn90' },
  { v: 10, key: 'buhl', table: 'autre' },
  { v: 9, key: 'ordi', table: 'autre' },
]
export const DEFAULT_STATE: AltState = { alt: 1000, prof: 20, o2: 21, v: 15, mode: 'oaci', pm: 0.9, table: 'mn90' }
export const STORAGE_KEY = 'ead-altitude-v1'
/** pm est saisi en mbar (×1000). */
export const SPECS = {
  alt: { step: 50, min: 300, max: 4000 },
  pm: { step: 5, min: 600, max: 980 },
  prof: { step: 1, min: 1, max: 60 },
  o2: { step: 1, min: 21, max: 50 },
  v: { step: 1, min: 5, max: 20 },
} as const
export type NumKey = keyof typeof SPECS

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
export function sanitizeState(raw: unknown): AltState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!fin(s.alt)) return null
  const D = DEFAULT_STATE
  const cl = (k: Exclude<NumKey, 'pm'>, v: unknown, d: number) => (fin(v) ? Math.min(SPECS[k].max, Math.max(SPECS[k].min, v)) : d)
  return {
    alt: cl('alt', s.alt, D.alt), prof: cl('prof', s.prof, D.prof), o2: cl('o2', s.o2, D.o2), v: cl('v', s.v, D.v),
    mode: s.mode === 'cours' || s.mode === 'mesure' ? s.mode : 'oaci',
    pm: fin(s.pm) ? Math.min(0.98, Math.max(0.6, s.pm)) : D.pm,
    table: s.table === 'autre' ? 'autre' : 'mn90',
  }
}
