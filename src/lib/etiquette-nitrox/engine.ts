/**
 * Étiquette nitrox : logique pure, portée à l'identique du modèle `etiquette-nitrox.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 * Arrondis côté sécurité (modèle) :
 * - étiquette et MOD : % O2 arrondi au-dessus (Nx plus riche = MOD plus courte) ;
 * - ordinateur : % O2 arrondi en dessous (plus d'azote compté = désaturation plus prudente) ;
 * - MOD toujours arrondie au mètre inférieur.
 */

export const MIXES = [28, 30, 32, 34, 36, 40, 50] as const
export const PRESSURES = [180, 200, 210, 230] as const
export const PP_CHOICES = [1.4, 1.6] as const
export const STEP_COUNT = 6
/** Écart accepté entre l'analyse et le mélange demandé (points de % O2). */
export const TOL = 1
/** Au-delà de cet écart (points de % O2), l'écart est signalé en rouge. */
export const BAD_GAP = 3
/** Au-delà de ce % O2 : hors nitrox de plongée courant (usage déco). */
export const DECO_O2 = 40

/** Champs de l'étiquette à mettre en évidence à chaque étape. */
export type LabelField = 'type' | 'o2' | 'mod' | 'pp' | 'p' | 'date' | 'ini'
export const HIGHLIGHT: LabelField[][] = [[], ['type', 'o2'], ['mod', 'pp'], ['p'], ['date', 'ini'], []]

export type CheckId = 'mark' | 'cool' | 'cal' | 'copy' | 'reg' | 'ordi'
export const CHECKS_START: CheckId[] = ['mark', 'cool', 'cal']
export const CHECKS_END: CheckId[] = ['copy', 'reg', 'ordi']

export type View = 'eti' | 'reg'

export type LabelState = {
  mix: number
  o2: number
  p: number
  pp: number
  ini: string
  nom: string
  bloc: string
  /** AAAA-MM-JJ */
  date: string
  step: number
  reached: number
  chk: Partial<Record<CheckId, boolean>>
  view: View
}

export const STORAGE_KEY = 'etiquette-nitrox-v3'

export const DEFAULT_STATE: LabelState = {
  mix: 32, o2: 32, p: 200, pp: 1.4, ini: '', nom: '', bloc: '', date: '', step: 0, reached: 0, chk: {}, view: 'eti',
}

/** Bornes et pas des steppers (data-min / data-max / data-step du modèle). */
export type NumKey = 'mix' | 'o2' | 'pp' | 'p'
export const FIELD_SPECS: Record<NumKey, { step: number; min: number; max: number }> = {
  mix: { step: 1, min: 21, max: 100 },
  o2: { step: 0.1, min: 21, max: 100 },
  pp: { step: 0.1, min: 1, max: 1.6 },
  p: { step: 10, min: 10, max: 300 },
}

export function clamp(k: NumKey, v: number): number {
  const s = FIELD_SPECS[k]
  return Math.min(s.max, Math.max(s.min, v))
}

/** + / − d'un pas (même calcul que le modèle : recalage sur le pas, arrondi au 1/10). */
export function bump(k: NumKey, cur: number, dir: -1 | 1): number {
  const step = FIELD_SPECS[k].step
  return clamp(k, Math.round(Math.round((cur + dir * step) / step) * step * 10) / 10)
}

/** Nx à écrire sur l'étiquette : % analysé arrondi au-dessus. */
export const nxLabel = (o2: number) => Math.ceil(o2 - 1e-9)
/** % O2 à régler dans l'ordinateur : % analysé arrondi en dessous. */
export const nxComputer = (o2: number) => Math.floor(o2 + 1e-9)
/** MOD (m) arrondie au mètre inférieur. */
export const mod = (pp: number, pct: number) => Math.max(0, Math.floor((pp / (pct / 100) - 1) * 10 + 1e-9))
/** MOD de l'étiquette : calculée avec le Nx de l'étiquette. */
export const modLabel = (pp: number, o2: number) => mod(pp, nxLabel(o2))

export type Analysis = { level: 'ok' | 'mid' | 'low'; gap: number; richer: boolean }
export function analysis(o2: number, mix: number): Analysis {
  const d = Math.round((o2 - mix) * 10) / 10
  const gap = Math.abs(d)
  return { level: gap <= TOL ? 'ok' : gap > BAD_GAP ? 'low' : 'mid', gap, richer: d > 0 }
}

export const allChecked = (chk: LabelState['chk'], ids: CheckId[]) => ids.every((id) => chk[id])

export function todayIso(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** AAAA-MM-JJ → JJ/MM/AA (format de l'étiquette). */
export function shortDate(s: string): string {
  const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s || '')
  return m ? `${m[3]}/${m[2]}/${m[1].slice(2)}` : ''
}

/** Relit l'état mémorisé (localStorage) en ne gardant que des valeurs valides. */
export function sanitizeState(raw: unknown): LabelState | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.o2 !== 'number') return null
  const num = (k: NumKey) => (typeof r[k] === 'number' && Number.isFinite(r[k]) ? clamp(k, r[k] as number) : DEFAULT_STATE[k])
  const str = (k: 'ini' | 'nom' | 'bloc', max: number) => (typeof r[k] === 'string' ? (r[k] as string).slice(0, max) : '')
  const int = (k: 'step' | 'reached') => {
    const v = r[k]
    return typeof v === 'number' && Number.isInteger(v) ? Math.min(STEP_COUNT - 1, Math.max(0, v)) : 0
  }
  const chk: LabelState['chk'] = {}
  if (r.chk && typeof r.chk === 'object') {
    for (const id of [...CHECKS_START, ...CHECKS_END]) if ((r.chk as Record<string, unknown>)[id] === true) chk[id] = true
  }
  const reached = int('reached')
  return {
    mix: num('mix'), o2: num('o2'), p: num('p'), pp: num('pp'),
    ini: str('ini', 4).toUpperCase(), nom: str('nom', 40), bloc: str('bloc', 12).toUpperCase(),
    date: todayIso(), // une étiquette se fait le jour de l'analyse
    step: Math.min(int('step'), reached), reached, chk,
    view: r.view === 'reg' ? 'reg' : 'eti',
  }
}
