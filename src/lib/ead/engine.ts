/**
 * EAD : logique pure, portée à l'identique du modèle `ead.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 * Calcul en mer (10 m par bar, 1 bar en surface), du côté sûr en lac.
 * EAD arrondie au mètre supérieur (jamais sous la surface), MOD au mètre inférieur.
 * Ligne MN90 : la ligne égale ou juste plus profonde que l'EAD ; au-delà de 65 m, hors table.
 */

export const FN2_AIR = 0.79
/** Évite 30,000000001 → 31. */
export const clean = (x: number) => Math.round(x * 1e6) / 1e6
export const pabs = (d: number) => d / 10 + 1
export const ppo2 = (d: number, fo2: number) => fo2 * pabs(d)
export const ppn2 = (d: number, fo2: number) => (1 - fo2) * pabs(d)
export const eadRaw = (d: number, fo2: number) => ((d + 10) * (1 - fo2)) / FN2_AIR - 10
/** Arrondi supérieur, jamais sous la surface. */
export const eadTable = (d: number, fo2: number) => Math.max(0, Math.ceil(clean(eadRaw(d, fo2))))
export const modRaw = (lim: number, fo2: number) => (lim / fo2 - 1) * 10
/** Arrondi inférieur. */
export const mod = (lim: number, fo2: number) => Math.max(0, Math.floor(clean(modRaw(lim, fo2))))
/** Profondeurs des lignes de la table MN90 (m). */
export const MN90 = [6, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50, 52, 55, 58, 60, 62, 65] as const
/** Ligne égale ou plus profonde ; null au-delà de 65 m. */
export const mn90 = (e: number): number | null => MN90.find((x) => x >= e) ?? null
/** Part d'azote en moins par rapport à l'air. */
export const n2cut = (fo2: number) => 1 - (1 - fo2) / FN2_AIR
export type Level = 'ok' | 'mid' | 'low'
export const level = (pp: number): Level => (clean(pp) > 1.6 ? 'low' : clean(pp) > 1.4 ? 'mid' : 'ok')

export function compute(d: number, o2pct: number) {
  const fo2 = o2pct / 100
  const raw = eadRaw(d, fo2), pp = ppo2(d, fo2)
  return {
    d, fo2, pabs: pabs(d), raw, ead: eadTable(d, fo2), noN2: fo2 >= 1,
    pp, ppn2: ppn2(d, fo2), m14: mod(1.4, fo2), m16: mod(1.6, fo2),
    m14raw: modRaw(1.4, fo2), m16raw: modRaw(1.6, fo2), level: level(pp),
    mn90: fo2 >= 1 ? null : mn90(eadTable(d, fo2)), n2cut: n2cut(fo2), ppn2air: FN2_AIR * pabs(d),
  }
}
export type EadResult = ReturnType<typeof compute>

// ── Réglages de l'outil (modèle) ──
export const MIXES = [21, 28, 32, 36, 40] as const
export const LIMS = [1.4, 1.5, 1.6] as const

export type EadState = { d: number; o2: number; lim: number }
export const DEFAULT_STATE: EadState = { d: 30, o2: 32, lim: 1.4 }
export const STORAGE_KEY = 'orque-ead-v1'

export const SPECS = {
  d: { step: 1, min: 0, max: 80 },
  o2: { step: 1, min: 21, max: 100 },
} as const
export type NumKey = keyof typeof SPECS

const fin = (x: unknown) => typeof x === 'number' && Number.isFinite(x)
export function sanitizeState(raw: unknown): EadState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!fin(s.d)) return null
  return {
    d: s.d as number,
    o2: fin(s.o2) ? (s.o2 as number) : DEFAULT_STATE.o2,
    lim: (LIMS as readonly number[]).includes(s.lim as number) ? (s.lim as number) : 1.4,
  }
}

/** Lien partageable : ?d=30&o2=32&lim=1.4 (prioritaire sur l'état mémorisé). */
export function fromQuery(search: string, base: EadState): EadState {
  const q = new URLSearchParams(search)
  const num = (k: string) => parseFloat((q.get(k) || '').replace(',', '.'))
  const next = { ...base }
  if (Number.isFinite(num('d'))) next.d = Math.min(80, Math.max(0, num('d')))
  if (Number.isFinite(num('o2'))) next.o2 = Math.min(100, Math.max(21, num('o2')))
  if ((LIMS as readonly number[]).includes(num('lim'))) next.lim = num('lim')
  return next
}

/** Lignes du tableau « ce mélange à d'autres profondeurs ». */
export function tableDepths(r: EadResult) {
  const top = Math.min(60, Math.max(r.d + 6, Math.floor(r.m16raw)))
  const set = new Set<number>()
  for (let d = 6; d <= top; d += 3) set.add(d)
  set.add(r.d)
  return [...set].sort((p, q) => p - q)
}
