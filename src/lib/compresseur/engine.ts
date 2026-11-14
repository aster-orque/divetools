/**
 * Rentabilité d'un compresseur : logique pure, portée à l'identique du modèle `compresseur.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 *  - air dans un bloc : facteur de compressibilité Z (1,00 à 100 bar, 1,03 à 200, 1,11 à 300) ;
 *  - électricité : puissance ÷ 0,9 ; cartouches : capacité ÷ 2 tous les +10 °C au-dessus de 20 °C ;
 *  - amortissement sur la plus courte des durées (années prévues ou heures de vie).
 */

/** Facteur de compressibilité de l'air vers 15–20 °C, P en bar absolu. */
export function zAir(P: number) { return 1 - 2.1e-4 * P + 1.9e-6 * P * P }
/** Litres d'air libre (1 bar) contenus dans un bloc de V litres à la pression P (bar relatif). */
export function airL(V: number, P: number) { const a = P + 1; return V * (a / zAir(a) - 1) }
const MOTOR_EFF = 0.9

export type CompParams = {
  achat: number; install: number; debit: number; kw: number; rend: number; ans: number; vieH: number; revente: number
  n: number; vol: number; pf: number; pr: number; prix: number; trajets: number
  kwh: number; temp: number; filtre: number; filtreM3: number; filtreMin: number
  rev: number; revH: number; revAns: number; nAna: number; ana: number; ctrl: number; divers: number; mo: number
}
type Base = { hPer: number; volM3: number; filtreLifeM3: number; invest: number }

/** Toutes les dépenses d'une année pour n gonflages. */
export function yearCosts(p: CompParams, n: number, r: Base) {
  const hYear = r.hPer * n, m3Year = r.volM3 * n
  const cart = Math.max(r.filtreLifeM3 > 0 ? m3Year / r.filtreLifeM3 : 0, p.filtreMin)
  const revs = Math.max(p.revH > 0 ? hYear / p.revH : 0, p.revAns > 0 ? 1 / p.revAns : 0)
  const vieAns = Math.min(p.ans, hYear > 0 && p.vieH > 0 ? p.vieH / hYear : Infinity)
  const energie = ((hYear * p.kw) / MOTOR_EFF) * p.kwh
  const filtres = cart * p.filtre
  const revisions = revs * p.rev
  const mo = hYear * p.mo
  const analyses = p.nAna * p.ana
  const controles = p.ctrl
  const divers = p.divers
  const amort = vieAns > 0 ? Math.max(0, r.invest - p.revente) / vieAns : 0
  const cash = energie + filtres + revisions + mo + analyses + controles + divers
  const total = cash + amort
  const recettes = n * p.prix + p.trajets
  return {
    hYear, m3Year, cart, revs, vieAns, kwh: (hYear * p.kw) / MOTOR_EFF, energie, filtres, revisions, mo, analyses, controles, divers, amort,
    cash, total, recettes, gain: recettes - total, cashNet: recettes - cash,
  }
}

export function calc(p: CompParams) {
  const volL = Math.max(0, airL(p.vol, p.pf) - airL(p.vol, p.pr))
  const volIdeal = p.vol * Math.max(0, p.pf - p.pr)
  const volM3 = volL / 1000
  const debitReel = (p.debit * p.rend) / 100
  const minPer = debitReel > 0 ? volL / debitReel : 0
  const hPer = minPer / 60
  const tempF = Math.pow(2, -(p.temp - 20) / 10) // ≈ moitié moins de capacité tous les +10 °C
  const filtreLifeM3 = p.filtreM3 * tempF
  const filtreLifeH = debitReel > 0 ? filtreLifeM3 / (debitReel * 0.06) : 0
  const invest = p.achat + p.install
  const base: Base = { hPer, volM3, filtreLifeM3, invest }
  const y = yearCosts(p, p.n, base)
  const revient = p.n > 0 ? y.total / p.n : 0
  // Coût d'un gonflage de plus (au-delà des minimums annuels)
  const dn = 100, c2 = yearCosts(p, p.n + dn, base)
  const marginal = (c2.total - y.total) / dn
  const marge = p.prix - marginal
  // Seuil : plus petit n où le gain devient positif (balayage puis affinage).
  const g = (n: number) => yearCosts(p, n, base).gain
  let seuil = Infinity
  if (g(0) >= 0) seuil = 0
  else {
    let prev = 0
    for (let i = 0; i <= 600; i++) {
      const n = Math.pow(10, i / 100) // 1 → 1 000 000
      if (g(n) >= 0) {
        let lo = prev, hi = n
        for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (g(m) >= 0) hi = m; else lo = m }
        seuil = hi
        break
      }
      prev = n
    }
  }
  const payback = y.cashNet > 0 ? invest / y.cashNet : Infinity
  return { volL, volIdeal, volM3, debitReel, minPer, hPer, tempF, filtreLifeM3, filtreLifeH, invest, ...y, revient, marginal, marge, seuil, payback }
}
export type CompResult = ReturnType<typeof calc>

// ── Réglages de l'interface (modèle) ──
type PresetVals = Pick<CompParams, 'achat' | 'install' | 'debit' | 'kw' | 'ans' | 'vieH' | 'revente' | 'filtre' | 'filtreM3' | 'rev' | 'revH' | 'revAns' | 'nAna' | 'ana' | 'ctrl' | 'divers'>
export type PresetId = 'port' | 'club' | 'centre'
/** Modèles types : ordres de grandeur, aucune marque. */
export const PRESETS: { id: PresetId; debit: number; kw: number; v: PresetVals }[] = [
  { id: 'port', debit: 100, kw: 2.2, v: { achat: 4000, install: 300, debit: 100, kw: 2.2, ans: 8, vieH: 3000, revente: 500, filtre: 40, filtreM3: 130, rev: 250, revH: 500, revAns: 1, nAna: 1, ana: 150, ctrl: 50, divers: 100 } },
  { id: 'club', debit: 250, kw: 5.5, v: { achat: 15000, install: 3000, debit: 250, kw: 5.5, ans: 10, vieH: 10000, revente: 2000, filtre: 90, filtreM3: 620, rev: 500, revH: 500, revAns: 1, nAna: 1, ana: 150, ctrl: 150, divers: 200 } },
  { id: 'centre', debit: 450, kw: 11, v: { achat: 32000, install: 8000, debit: 450, kw: 11, ans: 12, vieH: 20000, revente: 4000, filtre: 160, filtreM3: 2480, rev: 800, revH: 500, revAns: 1, nAna: 2, ana: 150, ctrl: 300, divers: 400 } },
]
export type CompState = CompParams & { preset: PresetId | null }
export const DEFAULT_STATE: CompState = { preset: 'club', ...PRESETS[1].v, rend: 90, n: 2000, vol: 12, pf: 230, pr: 50, prix: 4, trajets: 0, kwh: 0.25, temp: 20, filtreMin: 1, mo: 0 }
export const STORAGE_KEY = 'compresseur-v2'
export const N_QUICK = [500, 1000, 2000, 5000, 10000] as const

/** Champs : pas, min, max, décimales (modèle). */
export const SPECS: Record<keyof CompParams, { st: number; mi: number; ma: number; d: number }> = {
  achat: { st: 500, mi: 0, ma: 500000, d: 0 }, install: { st: 500, mi: 0, ma: 200000, d: 0 }, debit: { st: 10, mi: 10, ma: 5000, d: 0 }, kw: { st: 0.1, mi: 0.1, ma: 100, d: 1 },
  rend: { st: 5, mi: 50, ma: 100, d: 0 }, ans: { st: 1, mi: 1, ma: 40, d: 0 }, vieH: { st: 500, mi: 500, ma: 100000, d: 0 }, revente: { st: 500, mi: 0, ma: 500000, d: 0 },
  n: { st: 100, mi: 0, ma: 200000, d: 0 }, vol: { st: 1, mi: 1, ma: 50, d: 0 }, pf: { st: 10, mi: 50, ma: 300, d: 0 }, pr: { st: 10, mi: 0, ma: 300, d: 0 }, prix: { st: 0.5, mi: 0, ma: 100, d: 2 },
  trajets: { st: 100, mi: 0, ma: 100000, d: 0 },
  kwh: { st: 0.01, mi: 0, ma: 2, d: 2 }, temp: { st: 1, mi: 5, ma: 45, d: 0 },
  filtre: { st: 10, mi: 0, ma: 5000, d: 0 }, filtreM3: { st: 10, mi: 10, ma: 20000, d: 0 }, filtreMin: { st: 1, mi: 0, ma: 12, d: 0 },
  rev: { st: 50, mi: 0, ma: 20000, d: 0 }, revH: { st: 50, mi: 10, ma: 10000, d: 0 }, revAns: { st: 1, mi: 1, ma: 10, d: 0 },
  nAna: { st: 1, mi: 0, ma: 12, d: 0 }, ana: { st: 10, mi: 0, ma: 2000, d: 0 }, ctrl: { st: 50, mi: 0, ma: 20000, d: 0 }, divers: { st: 50, mi: 0, ma: 50000, d: 0 },
  mo: { st: 1, mi: 0, ma: 200, d: 0 },
}
export const PRESET_KEYS = Object.keys(PRESETS[0].v) as (keyof PresetVals)[]
/** Pas du stepper (arrondi au centième, comme le modèle). */
export const bump = (k: keyof CompParams, v: number, dir: -1 | 1) => {
  const { st, mi, ma } = SPECS[k]
  return Math.min(ma, Math.max(mi, Math.round(Math.round((v + dir * st) / st) * st * 100) / 100))
}

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
export function sanitizeState(raw: unknown): CompState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!fin(s.n)) return null
  const out: CompState = { ...DEFAULT_STATE }
  for (const k of Object.keys(SPECS) as (keyof CompParams)[]) if (fin(s[k])) out[k] = Math.min(SPECS[k].ma, Math.max(SPECS[k].mi, s[k] as number))
  out.preset = s.preset === 'port' || s.preset === 'club' || s.preset === 'centre' ? s.preset : null
  return out
}
