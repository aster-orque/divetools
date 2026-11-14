/**
 * OTU (toxicité pulmonaire de l'oxygène) : logique pure, portée à l'identique du modèle `otu.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 * OTU = t × ((PpO2 − 0,5) ÷ 0,5)^(5/6), zéro sous 0,5 bar (UPTD, Bardin & Lambertsen 1970).
 * Descente et remontée (E. Baker) : intégrale exacte quand la PpO2 varie linéairement.
 * REPEX (NOAA) : dose admise par jour et plafond cumulé ; on retient le plus petit des deux.
 */

const K = 5 / 6 // exposant du modèle UPTD (pente −1,2 de Bardin & Lambertsen)
export const amb = (d: number) => 1 + d / 10 // bar absolus, eau de mer
export const ppo2 = (o2: number, d: number) => (o2 / 100) * amb(d)
const x = (pp: number) => Math.max(0, (pp - 0.5) / 0.5)
/** OTU par minute. */
export const rate = (pp: number) => Math.pow(x(pp), K)
export const dose = (o2: number, d: number, t: number) => t * rate(ppo2(o2, d))
/** Intégrale exacte quand la PpO2 varie linéairement (descente, remontée) — E. Baker. */
export function ramp(pi: number, pf: number, t: number) {
  if (t <= 0) return 0
  if (Math.abs(pf - pi) < 1e-9) return t * rate(pi)
  return ((3 / 11) * t) / (pf - pi) * (Math.pow(x(pf), 11 / 6) - Math.pow(x(pi), 11 / 6))
}

/** Perte de capacité vitale médiane (%) : Bardin & Lambertsen 1970 (courbes de Clark), interpolation linéaire. */
export const VC: readonly (readonly [number, number])[] = [[615, 2], [825, 4], [1035, 6], [1230, 8], [1425, 10], [1815, 15], [2190, 20]]
export function vc(u: number): { v: number; below?: boolean; above?: boolean } {
  if (u < VC[0][0]) return { below: true, v: 2 }
  if (u > VC[VC.length - 1][0]) return { above: true, v: 20 }
  for (let i = 1; i < VC.length; i++) {
    const [u0, v0] = VC[i - 1], [u1, v1] = VC[i]
    if (u <= u1) return { v: v0 + ((v1 - v0) * (u - u0)) / (u1 - u0) }
  }
  return { above: true, v: 20 }
}

/** REPEX (Hamilton et al., NOAA) : OTU admis par jour et cumul maximal, jours 1 à 14 (puis 300 / jour). */
export const REPEX_DAY = [850, 700, 620, 525, 460, 420, 380, 350, 330, 310, 300, 300, 300, 300] as const
export const REPEX_TOT = [850, 1400, 1860, 2100, 2300, 2520, 2660, 2800, 2970, 3100, 3300, 3600, 3900, 4200] as const
export type LimKind = 'day' | 'multi' | 'vc'
/** Dose admise aujourd'hui. Plusieurs jours : la plus petite entre la dose du jour et ce qui reste sur le cumul. */
export function limit(kind: LimKind, day = 1, prevDays = 0) {
  if (kind === 'vc') return 615
  if (kind === 'multi') {
    const i = Math.min(14, Math.max(1, day)) - 1
    return Math.max(0, Math.min(REPEX_DAY[i], REPEX_TOT[i] - prevDays))
  }
  return 850
}

export type SegIn = { o2: number; d: number; t: number }
export type PieceKind = 'seg' | 'desc' | 'asc'
export type Piece = { kind: PieceKind; i: number; o2: number; d0: number; d1: number; t: number; pp0: number; pp1: number; otu: number }
export type Opt = { ramps?: boolean; vDesc?: number; vAsc?: number }

/** Profil : segments à profondeur constante, avec ou sans descente / remontée. Le premier est le fond, sa durée compte la descente. */
export function profile(segs: SegIn[], opt: Opt = {}) {
  const P: Piece[] = [], vD = opt.vDesc || 20, vA = opt.vAsc || 10
  const push = (kind: PieceKind, i: number, o2: number, d0: number, d1: number, t: number) => {
    const pp0 = ppo2(o2, d0), pp1 = ppo2(o2, d1)
    P.push({ kind, i, o2, d0, d1, t, pp0, pp1, otu: ramp(pp0, pp1, t) })
  }
  segs.forEach((s, i) => {
    if (!opt.ramps) return push('seg', i, s.o2, s.d, s.d, s.t)
    if (i === 0) {
      const td = s.d / vD
      push('desc', 0, s.o2, 0, s.d, Math.min(td, s.t))
      push('seg', 0, s.o2, s.d, s.d, Math.max(0, s.t - td))
    } else {
      const p = segs[i - 1], dd = s.d - p.d
      if (dd) push(dd > 0 ? 'desc' : 'asc', i, p.o2, p.d, s.d, Math.abs(dd) / (dd > 0 ? vD : vA))
      push('seg', i, s.o2, s.d, s.d, s.t)
    }
  })
  if (opt.ramps) {
    const l = segs[segs.length - 1]
    if (l.d > 0) push('asc', segs.length, l.o2, l.d, 0, l.d / vA)
  }
  return P
}

/** prev : OTU déjà faits aujourd'hui avant cette plongée. */
export function compute(segs: SegIn[], lim: number, opt: Opt = {}, prev = 0) {
  const pieces = profile(segs, opt)
  const dive = pieces.reduce((a, r) => a + r.otu, 0)
  const day = prev + dive
  const rows = segs.map((s, i) => {
    const pp = ppo2(s.o2, s.d)
    return { ...s, pp, rate: rate(pp), otu: pieces.filter((q) => q.kind === 'seg' && q.i === i).reduce((a, q) => a + q.otu, 0) }
  })
  const r0 = rows[0], bottom = pieces.find((q) => q.kind === 'seg' && q.i === 0)!
  const desc = opt.ramps ? pieces[0].t : 0
  const rest = day - bottom.otu // tout sauf le temps passé au fond
  const tmax = r0.rate ? Math.max(0, desc + (lim - rest) / r0.rate) : Infinity
  const ramps = pieces.filter((q) => q.kind !== 'seg').reduce((a, q) => a + q.otu, 0)
  const runtime = pieces.reduce((a, q) => a + q.t, 0)
  return { pieces, rows, dive, day, ramps, runtime, tmax, left: lim - day, pct: lim ? day / lim : Infinity, vc: vc(day) }
}
export type OtuResult = ReturnType<typeof compute>

// ── Réglages de l'outil (modèle) ──
export const MIXES = [21, 28, 32, 36, 40, 50, 80, 100] as const
export type SegName = 'fond' | 'deco' | 'o2' | 'free'
export type Seg = SegIn & { n: SegName }
export const ADD: Record<Exclude<SegName, 'fond'>, { o2?: number; d: number; t: number }> = {
  deco: { d: 3, t: 5 },
  o2: { o2: 100, d: 6, t: 10 },
  free: { d: 15, t: 10 },
}
export type OtuState = { segs: Seg[]; lim: LimKind; day: number; prev: number; prevDays: number; ramps: boolean; vDesc: number; vAsc: number }
export const DEFAULT_STATE: OtuState = { segs: [{ o2: 32, d: 30, t: 40, n: 'fond' }], lim: 'day', day: 1, prev: 0, prevDays: 0, ramps: false, vDesc: 20, vAsc: 10 }
export const STORAGE_KEY = 'orque-otu-v2'
export const SPECS = {
  o2: { step: 1, min: 5, max: 100 },
  d: { step: 1, min: 0, max: 150 },
  t: { step: 1, min: 1, max: 600 },
  vDesc: { step: 1, min: 5, max: 30 },
  vAsc: { step: 1, min: 3, max: 18 },
  prev: { step: 5, min: 0, max: 2000 },
  day: { step: 1, min: 1, max: 14 },
  prevDays: { step: 10, min: 0, max: 4200 },
} as const
export type GlobalKey = 'vDesc' | 'vAsc' | 'prev' | 'day' | 'prevDays'
export type SegKey = 'o2' | 'd' | 't'

const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const NAMES: Record<string, SegName> = { fond: 'fond', Fond: 'fond', deco: 'deco', Palier: 'deco', o2: 'o2', 'Palier O2': 'o2', free: 'free', Niveau: 'free' }
export function sanitizeState(raw: unknown): OtuState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!Array.isArray(s.segs) || !s.segs.length) return null
  const cl = (k: keyof typeof SPECS, v: unknown, d: number) => (fin(v) ? Math.min(SPECS[k].max, Math.max(SPECS[k].min, v)) : d)
  const segs: Seg[] = (s.segs as unknown[]).filter((q): q is Record<string, unknown> => !!q && typeof q === 'object').map((q, i) => ({
    o2: cl('o2', q.o2, 32), d: cl('d', q.d, 30), t: cl('t', q.t, 10),
    n: i === 0 ? 'fond' : (NAMES[String(q.n)] ?? 'free'),
  }))
  if (!segs.length) return null
  const D = DEFAULT_STATE
  return {
    segs,
    lim: s.lim === 'multi' || s.lim === 'vc' ? s.lim : 'day',
    day: cl('day', s.day, D.day), prev: cl('prev', s.prev, D.prev), prevDays: cl('prevDays', s.prevDays, D.prevDays),
    ramps: typeof s.ramps === 'boolean' ? s.ramps : D.ramps,
    vDesc: cl('vDesc', s.vDesc, D.vDesc), vAsc: cl('vAsc', s.vAsc, D.vAsc),
  }
}
