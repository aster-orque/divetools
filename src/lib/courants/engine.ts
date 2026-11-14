/**
 * Courants de marée : logique pure, portée à l'identique du modèle `courants.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 *  - coefficient : V = V_ME + (V_VE − V_ME) × (C − 45) ÷ 50, extrapolée hors 45–95, jamais négative ;
 *  - forme : sinus (règle 50/90) ou douzièmes (1/3, 2/3, 1, 1, 2/3, 1/3) ;
 *  - marée semi-diurne de 12 h 25 (745 min) ; vent : 3 % de sa vitesse, sous le vent ;
 *  - résultant : somme vectorielle ; dérive : intégrale du courant sur la plongée.
 */

export const CYCLE = 745 // min, durée d'une marée semi-diurne (12 h 25)
export const HALF = CYCLE / 2 // 372,5 min
export const ME = 45
export const VE = 95
export const KT_MS = 1852 / 3600 // 1 nœud en m/s
export const KT_MMIN = 1852 / 60 // 1 nœud en m/min
const DOUZ = [1, 2, 3, 3, 2, 1].map((x) => x / 3)
export const mod = (a: number, n: number) => ((a % n) + n) % n
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => mod((r * 180) / Math.PI, 360)

export type Profile = 'sinus' | 'douziemes'
export type Vec = { v: number; dir: number }
export type AtlasRow = { dir: number; ve: number; me: number }
export type SimpleSite = {
  mode: 'simple'; slack: number; flood: number; profile: Profile; floodDir: number; ebbDir: number
  floodVE: number; floodME: number; ebbVE: number; ebbME: number
}
export type Site = SimpleSite | { mode: 'atlas'; rows: AtlasRow[] }
export type Tide = Vec & { phase: 'flot' | 'jusant' | null; f: number | null }
export type Wind = { speed: number; from: number; k: number }

/** Vitesse pour un coefficient donné, à partir des vitesses VE (coef 95) et ME (coef 45). */
export function coefSpeed(vve: number, vme: number, C: number) {
  return Math.max(0, vme + ((vve - vme) * (C - ME)) / (VE - ME))
}
/** Fraction du maximum atteinte à la fraction f (0→1) d'une demi-marée de courant. */
export function shape(f: number, profile: Profile) {
  if (f <= 0 || f >= 1) return 0
  if (profile === 'douziemes') return DOUZ[Math.min(5, Math.floor(f * 6))]
  return Math.sin(Math.PI * f)
}
export const vec = (v: number, dir: number) => ({ x: v * Math.sin(rad(dir)), y: v * Math.cos(rad(dir)) }) // x = est, y = nord
export const unvec = (p: { x: number; y: number }): Vec => ({ v: Math.hypot(p.x, p.y), dir: Math.hypot(p.x, p.y) < 1e-9 ? 0 : deg(Math.atan2(p.x, p.y)) })
export function add(a: Vec, b: Vec) {
  const p = vec(a.v, a.dir), q = vec(b.v, b.dir)
  return unvec({ x: p.x + q.x, y: p.y + q.y })
}
/** Modèle simple : étale de PM décalée de `slack` min par rapport à la PM, flot de durée `flood` min. */
export function simpleAt(site: SimpleSite, t: number, C: number): Tide {
  const flood = Math.min(CYCLE - 60, Math.max(60, site.flood || HALF))
  const ebb = CYCLE - flood
  const ph = mod(t - (site.slack || 0), CYCLE) // 0 = étale de pleine mer, le jusant commence
  if (ph < ebb) {
    const f = ph / ebb
    return { v: coefSpeed(site.ebbVE, site.ebbME, C) * shape(f, site.profile), dir: site.ebbDir, phase: 'jusant', f }
  }
  const f = (ph - ebb) / flood
  return { v: coefSpeed(site.floodVE, site.floodME, C) * shape(f, site.profile), dir: site.floodDir, phase: 'flot', f }
}
/** Modèle atlas : 13 valeurs horaires (PM−6 … PM+6), interpolation linéaire des composantes (heure marée ≈ 62 min). */
export function atlasAt(site: { rows: AtlasRow[] }, t: number, C: number): Tide {
  const rows = site.rows
  const tw = mod(t + HALF, CYCLE) - HALF
  const x = (tw * 12) / CYCLE + 6
  const i = Math.min(11, Math.floor(x)), f = x - i
  const a = vec(coefSpeed(rows[i].ve, rows[i].me, C), rows[i].dir)
  const b = vec(coefSpeed(rows[i + 1].ve, rows[i + 1].me, C), rows[i + 1].dir)
  const r = unvec({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f })
  return { v: r.v, dir: r.dir, phase: null, f: null }
}
export function tideAt(site: Site, t: number, C: number): Tide {
  return site.mode === 'atlas' ? atlasAt(site, t, C) : simpleAt(site, t, C)
}
/** Dérive due au vent : `k` × vitesse du vent, vers où le vent va (le vent est donné « venant de »). */
export function windDrift(ws: number, wfrom: number, k?: number | null): Vec {
  return { v: Math.max(0, ws) * (k == null ? 0.03 : k), dir: mod(wfrom + 180, 360) }
}
/** Courant total à l'instant t (min par rapport à la PM). */
export function currentAt(site: Site, t: number, C: number, wind: Wind | null) {
  const tide = tideAt(site, t, C)
  const w = wind ? windDrift(wind.speed, wind.from, wind.k) : { v: 0, dir: 0 }
  return { tide, wind: w, total: add(tide, w) }
}
const round = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d
/** Remplit un tableau horaire « atlas » depuis le modèle simple. */
export function rowsFromSimple(site: SimpleSite): AtlasRow[] {
  const rows: AtlasRow[] = []
  for (let h = -6; h <= 6; h++) {
    const t = (h * CYCLE) / 12
    const a = simpleAt(site, t, VE), b = simpleAt(site, t, ME)
    rows.push({ dir: a.v > 0 ? a.dir : b.v > 0 ? b.dir : a.dir, ve: round(a.v, 1), me: round(b.v, 1) })
  }
  return rows
}
/** Échantillonne le courant de t0 à t1 (min) par pas de `step` min. */
export function sample(site: Site, C: number, wind: Wind | null, t0: number, t1: number, step: number) {
  const out: ({ t: number } & ReturnType<typeof currentAt>)[] = []
  for (let t = t0; t <= t1 + 1e-9; t += step) out.push({ t, ...currentAt(site, t, C, wind) })
  return out
}
export type CalmWindow = { start: number; end: number; min: number; tMin: number; openStart: boolean; openEnd?: boolean }
/** Créneaux où la vitesse totale reste sous le seuil, entre t0 et t1 (pas de 1 min). */
export function calmWindows(site: Site, C: number, wind: Wind | null, thr: number, t0: number, t1: number) {
  const res: CalmWindow[] = []
  let cur: CalmWindow | null = null
  for (let t = t0; t <= t1; t++) {
    const v = currentAt(site, t, C, wind).total.v
    if (v < thr) {
      if (!cur) cur = { start: t, end: t, min: v, tMin: t, openStart: t === t0 }
      cur.end = t
      if (v < cur.min) { cur.min = v; cur.tMin = t }
    } else if (cur) { res.push(cur); cur = null }
  }
  if (cur) { cur.openEnd = true; res.push(cur) }
  return res
}
/** Étales (minimums locaux de la vitesse du courant de marée seul) entre t0 et t1. */
export function slacks(site: Site, C: number, t0: number, t1: number) {
  const res: { t: number; v: number }[] = []
  const v = (t: number) => tideAt(site, t, C).v
  let prev = v(t0 - 1), cur = v(t0)
  for (let t = t0; t <= t1; t++) {
    const next = v(t + 1)
    if (cur <= prev && cur < next) {
      // plateau éventuel (douzièmes) : on prend son milieu
      let s = t
      while (s > t0 - 720 && Math.abs(v(s - 1) - cur) < 1e-12) s--
      if (v(s - 1) > cur) res.push({ t: Math.round((s + t) / 2), v: cur })
    }
    prev = cur; cur = next
  }
  return res
}
/** Dérive pendant une plongée : intégrale vectorielle du courant total → distance (m) et cap. */
export function driftOver(site: Site, C: number, wind: Wind | null, t0: number, dur: number) {
  let x = 0, y = 0
  const n = Math.max(1, Math.round(dur))
  const dt = dur / n
  for (let i = 0; i < n; i++) {
    const c = currentAt(site, t0 + (i + 0.5) * dt, C, wind).total
    const p = vec(c.v, c.dir)
    x += p.x * dt; y += p.y * dt
  }
  const r = unvec({ x, y })
  return { dist: r.v * KT_MMIN, dir: r.dir }
}
export type Level = 'ok' | 'mid' | 'low'
export type LevelKey = 'faible' | 'modere' | 'fort' | 'tresFort'
/** Niveau de difficulté pour un plongeur, en nœuds. */
export function level(v: number): { k: Level; label: LevelKey } {
  if (v < 0.5) return { k: 'ok', label: 'faible' }
  if (v < 1) return { k: 'mid', label: 'modere' }
  if (v < 2) return { k: 'low', label: 'fort' }
  return { k: 'low', label: 'tresFort' }
}

// ── Réglages de l'interface (modèle) ──
export const COEFS = [45, 70, 95, 110] as const
export const BFT_Q = [[2, 5], [3, 9], [4, 13], [5, 19], [6, 24], [7, 30]] as const
export const THRS = [0.3, 0.5, 0.8, 1] as const
export const DIRS = [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SO', 225], ['O', 270], ['NO', 315]] as const
/** Échelle de Beaufort à partir de la vitesse du vent (nœuds). */
export const bft = (w: number) => {
  const L = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64]
  let i = 0
  while (i < L.length && w >= L[i]) i++
  return i
}

export const SPECS = {
  coef: { step: 1, min: 20, max: 120 },
  floodVE: { step: 0.1, min: 0, max: 9 },
  floodME: { step: 0.1, min: 0, max: 9 },
  slack: { step: 15, min: -360, max: 360 },
  flood: { step: 15, min: 120, max: 600 },
  ebbVE: { step: 0.1, min: 0, max: 9 },
  ebbME: { step: 0.1, min: 0, max: 9 },
  dur: { step: 5, min: 5, max: 240 },
  ws: { step: 1, min: 0, max: 60 },
  k: { step: 0.5, min: 1, max: 5 },
  thr: { step: 0.1, min: 0.1, max: 2 },
} as const
export type NumKey = keyof typeof SPECS
export type Tab = 'plongee' | 'jour' | 'rose' | 'methode'

export type CurState = {
  pm: string; coef: number; mode: 'simple' | 'atlas'; profile: Profile; slack: number; floodDir: number; floodVE: number; floodME: number
  flood: number; ebbVE: number; ebbME: number; ebbDir: number; adv: boolean; rows: AtlasRow[]
  dive: string; dur: number; windOn: boolean; ws: number; wfrom: number; k: number; thr: number; dayWind: boolean; roseWind: boolean; tab: Tab
}
const BASE = {
  pm: '10:30', coef: 80, mode: 'simple' as const, profile: 'sinus' as const, slack: 0, floodDir: 90, floodVE: 2.4, floodME: 1.2,
  flood: 375, ebbVE: 2.4, ebbME: 1.2, ebbDir: 270, adv: false,
  dive: '10:15', dur: 50, windOn: false, ws: 13, wfrom: 270, k: 3, thr: 0.5, dayWind: true, roseWind: false, tab: 'plongee' as Tab,
}
/** Site du modèle simple ; sans « Flot et jusant différents », jusant = flot inversé. */
export function siteSimple(S: Omit<CurState, 'rows'>): SimpleSite {
  const adv = S.adv
  return {
    mode: 'simple', slack: S.slack, profile: S.profile, floodDir: S.floodDir, floodVE: S.floodVE, floodME: S.floodME,
    flood: adv ? S.flood : HALF, ebbVE: adv ? S.ebbVE : S.floodVE, ebbME: adv ? S.ebbME : S.floodME,
    ebbDir: adv ? S.ebbDir : mod(S.floodDir + 180, 360),
  }
}
export const DEFAULT_STATE: CurState = { ...BASE, rows: rowsFromSimple(siteSimple(BASE)) }
export const STORAGE_KEY = 'orque-courants-v1'

const HHMM = /^\d{1,2}:\d{2}$/
/** N'accepte que des valeurs du bon type (stockage ancien ou corrompu), comme le modèle. */
export function sanitizeState(raw: unknown): CurState | null {
  if (!raw || typeof raw !== 'object') return null
  const saved = raw as Record<string, unknown>
  const S: Record<string, unknown> = { ...DEFAULT_STATE }
  for (const k of Object.keys(BASE) as (keyof typeof BASE)[]) {
    const v = saved[k], d = BASE[k]
    if (typeof d === 'number' ? typeof v === 'number' && Number.isFinite(v) : typeof d === 'boolean' ? typeof v === 'boolean' : typeof v === 'string') S[k] = v
  }
  if (!HHMM.test(S.pm as string)) S.pm = BASE.pm
  if (!HHMM.test(S.dive as string)) S.dive = BASE.dive
  if (S.mode !== 'simple' && S.mode !== 'atlas') S.mode = 'simple'
  if (S.profile !== 'sinus' && S.profile !== 'douziemes') S.profile = 'sinus'
  if (!['plongee', 'jour', 'rose', 'methode'].includes(S.tab as string)) S.tab = 'plongee'
  for (const k of Object.keys(SPECS) as NumKey[]) S[k] = Math.min(SPECS[k].max, Math.max(SPECS[k].min, S[k] as number))
  for (const k of ['floodDir', 'ebbDir', 'wfrom'] as const) S[k] = mod(Math.round(S[k] as number), 360)
  const rows = saved.rows
  S.rows = Array.isArray(rows) && rows.length === 13 && rows.every((r) => r && [r.dir, r.ve, r.me].every(Number.isFinite))
    ? rows.map((r) => ({ dir: r.dir, ve: r.ve, me: r.me }))
    : rowsFromSimple(siteSimple(S as unknown as CurState))
  return S as unknown as CurState
}

// ── Heures ──
export const toMin = (s: string) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(s || '')
  return m ? +m[1] * 60 + +m[2] : 0
}
export const clock = (m: number) => {
  m = mod(Math.round(m), 1440)
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
}
