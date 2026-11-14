/**
 * Bilan thermique d'un plongeur : logique pure, portée à l'identique du modèle `bilan-thermique.html`.
 * Aucune formule, constante ni arrondi n'a été modifié. Pertes en watts, énergies en kJ.
 *
 *   Bilan (W) = production métabolique − pertes respiratoires − pertes à travers la peau
 *
 * Respiration : n = P·V ÷ (R·T), Cp molaire 29,1 (O2, N2) / 20,8 (He) ; humidification (Magnus).
 * Peau : noyau à 37 °C, résistances en série (tissus + combinaison + couche limite), Du Bois.
 * Néoprène : R × (0,15 + 0,85 ÷ P). Réserve : 3,47 kJ/(kg·K) ; un surplus ne se stocke pas.
 */

const R = 8.314462 // J/(mol·K)
const RV = 461.5 // J/(kg·K), constante spécifique de la vapeur d'eau
const CP_N2O2 = 29.1 // J/(mol·K)
const CP_HE = 20.8 // J/(mol·K)
export const C_BODY = 3.47 // kJ/(kg·K)
export const T_CORE = 37 // °C
const K0 = 273.15
/** Parts de la surface corporelle (Lund & Browder simplifié). */
export const ZONES = { head: 0.07, hands: 0.05 } as const

export type ActKey = 'repos' | 'calme' | 'modere' | 'soutenu'
/** Production (W), ventilation conseillée (L/min surface), isolation tissulaire et couche limite (m²K/W). */
export const ACTIVITIES: Record<ActKey, { M: number; rmv: number; rt: number; rb: number }> = {
  repos: { M: 110, rmv: 14, rt: 0.09, rb: 0.006 },
  calme: { M: 200, rmv: 18, rt: 0.07, rb: 0.004 },
  modere: { M: 320, rmv: 24, rt: 0.055, rb: 0.003 },
  soutenu: { M: 480, rmv: 34, rt: 0.045, rb: 0.003 },
}
export const ACT_KEYS = Object.keys(ACTIVITIES) as ActKey[]
// Résistances surface (m²K/W).
export const R_WET_MM = 0.016 // néoprène humide, par mm, rinçage compris
export const R_SEMI_MM = 0.019 // semi-étanche, rinçage réduit
const R_DRYNEO_MM = 0.0185 // néoprène sec (coque d'étanche)
const R_TRILAM = 0.01 // coque trilaminée + film d'air
export type UnderKey = 'fin' | 'moyen' | 'epais' | 'polaire'
export const UNDERSUITS: Record<UnderKey, { r: number }> = {
  fin: { r: 0.1 }, moyen: { r: 0.18 }, epais: { r: 0.27 }, polaire: { r: 0.36 },
}
export const UNDER_KEYS = Object.keys(UNDERSUITS) as UnderKey[]
const ARGON_GAIN = 1.1 // conductivité de l'argon −32 % vs air ; gain réel modeste

export const pAmb = (depth: number, salt = true) => 1.01325 + depth * (salt ? 0.1005 : 0.0981) // bar
export const crush = (P: number) => 0.15 + 0.85 / Math.max(P, 1)
export const psat = (T: number) => 610.94 * Math.exp((17.625 * T) / (T + 243.04)) // Pa (Magnus)
const latent = (T: number) => (2501 - 2.36 * T) * 1000 // J/kg
export const duBois = (kg: number, cm: number) => 0.007184 * Math.pow(kg, 0.425) * Math.pow(cm, 0.725) // m²
export const cpMix = (fHe: number) => (1 - fHe) * CP_N2O2 + fHe * CP_HE

export function respiratory({ P, rmv, tGas, tExh, fHe }: { P: number; rmv: number; tGas: number; tExh: number; fHe: number }) {
  const V = rmv / 1000 / 60 // m³/s réels
  const nDot = (P * 1e5 * V) / (R * (tGas + K0)) // mol/s
  const sensible = nDot * cpMix(fHe) * (tExh - tGas)
  const mDot = (psat(tExh) * V) / (RV * (tExh + K0)) // kg/s
  const humid = mDot * latent(tExh)
  return { sensible, humid, total: sensible + humid, nDot }
}

export type SuitType = 'humide' | 'semi' | 'etanche'
export type Suit = { type: SuitType; mm: number; under: UnderKey; shell: 'trilam' | 'neoprene'; argon: boolean; covered: boolean }
/** Résistance de la protection sur le corps et sur la tête/mains, à la pression P. */
export function suitR(suit: Suit, P: number) {
  const c = crush(P)
  let body: number, extr: number
  if (suit.type === 'etanche') {
    const shell = suit.shell === 'neoprene' ? 4 * R_DRYNEO_MM * c : R_TRILAM
    const under = (UNDERSUITS[suit.under] || UNDERSUITS.moyen).r * (suit.argon ? ARGON_GAIN : 1)
    body = shell + under
    extr = 5 * R_WET_MM * c // cagoule + gants humides 5 mm
  } else {
    const perMm = suit.type === 'semi' ? R_SEMI_MM : R_WET_MM
    body = suit.mm * perMm * c
    extr = Math.min(suit.mm, 7) * R_WET_MM * c
  }
  return { body, extr: suit.covered ? extr : 0 }
}

export type Sens = 'frileux' | 'normal' | 'resistant'
/** Sensibilité au froid : module l'isolation des tissus. */
export const SENSITIVITY: Record<Sens, number> = { frileux: 0.8, normal: 1, resistant: 1.25 }

type Zone = { A: number; R: number; G: number; Q: number }
export function skin({ P, tWater, area, suit, act, tCore = T_CORE, sens = 1 }: {
  P: number; tWater: number; area: number; suit: Suit; act: (typeof ACTIVITIES)[ActKey]; tCore?: number; sens?: number
}) {
  const s = suitR(suit, P)
  const rt = act.rt * sens
  const rIn = rt + act.rb
  const fE = ZONES.head + ZONES.hands
  const zones: { body: Zone; extr: Zone } = {
    body: { A: area * (1 - fE), R: rIn + s.body, G: 0, Q: 0 },
    extr: { A: area * fE, R: rIn + s.extr, G: 0, Q: 0 },
  }
  const dT = tCore - tWater
  let G = 0
  for (const z of Object.values(zones)) { z.G = z.A / z.R; z.Q = z.G * dT; G += z.G }
  return { total: G * dT, G, zones, rSuit: s, insulLeft: crush(P), tSkin: tCore - (G * dT * rt) / area }
}

export type PhaseIn = { depth: number; minutes: number; tWater: number; activity: ActKey; rmv: number; M?: number | null; tGas?: number | null }
export type ThermoInput = {
  mass: number; height: number; area?: number; sensitivity: Sens; tExh: number; fHe: number; salt: boolean; suit: Suit
  fond: PhaseIn; palier: PhaseIn | null
}
type Common = ThermoInput & { area: number }
export type Phase = ReturnType<typeof phase>

/** Une phase (fond ou palier). */
export function phase(p: PhaseIn, common: Common) {
  const P = pAmb(p.depth, common.salt)
  const act = ACTIVITIES[p.activity] || ACTIVITIES.repos
  const M = p.M != null ? p.M : act.M
  const tGas = p.tGas != null ? p.tGas : p.tWater
  const resp = respiratory({ P, rmv: p.rmv, tGas, tExh: common.tExh, fHe: common.fHe })
  const sk = skin({ P, tWater: p.tWater, area: common.area, suit: common.suit, act, sens: SENSITIVITY[common.sensitivity] || 1 })
  const losses = resp.total + sk.total
  const balance = M - losses
  const s = p.minutes * 60
  const heatKJ = (balance * s) / 1000
  return {
    P, M, act, resp, skin: sk, losses, balance,
    spentKJ: (M * s) / 1000, heatKJ,
    dTbody: heatKJ / (C_BODY * common.mass),
    minPerDeg: balance < 0 ? (C_BODY * common.mass * 1000) / -balance / 60 : Infinity,
  }
}

export type Level = 'ok' | 'mid' | 'low'
export function compute(input: ThermoInput) {
  const area = input.area || duBois(input.mass, input.height)
  const common: Common = { ...input, area }
  const fond = phase(input.fond, common)
  const palier = input.palier && input.palier.minutes > 0 ? phase(input.palier, common) : null
  const parts = [fond, palier].filter((x): x is Phase => !!x)
  const sum = (k: 'spentKJ' | 'heatKJ') => parts.reduce((a, x) => a + x[k], 0)
  const spentKJ = sum('spentKJ'), heatKJ = sum('heatKJ')
  // Un surplus de chaleur est évacué : seuls les déficits entament la réserve.
  const debtKJ = parts.reduce((a, x) => a + Math.min(0, x.heatKJ), 0)
  const dTbody = debtKJ / (C_BODY * input.mass)
  let level: Level = 'ok'
  if (dTbody <= -2.5) level = 'low'
  else if (dTbody <= -1) level = 'mid'
  return { area, fond, palier, spentKJ, heatKJ, debtKJ, dTbody, level }
}
export type ThermoResult = ReturnType<typeof compute>

export type AdviceKey = 'etanche' | 'semi' | 'humide7' | 'humide5' | 'humide3'
/** Conseil de protection selon la T° de l'eau la plus froide (ordres de grandeur). */
export function advice(tMin: number): AdviceKey {
  if (tMin < 10) return 'etanche'
  if (tMin < 15) return 'semi'
  if (tMin < 20) return 'humide7'
  if (tMin < 25) return 'humide5'
  return 'humide3'
}
export const lvlOf = (dT: number): Level => (dT <= -2.5 ? 'low' : dT <= -1 ? 'mid' : 'ok')

// ── Réglages de l'interface (modèle) ──
export const MM: Record<'humide' | 'semi', readonly number[]> = { humide: [3, 5, 7, 9], semi: [5, 6, 7, 8] }
export const SPECS = {
  fD: { step: 1, min: 0, max: 120 }, fT: { step: 1, min: 1, max: 240 }, fW: { step: 1, min: 0, max: 34 },
  pD: { step: 1, min: 0, max: 30 }, pT: { step: 1, min: 1, max: 180 }, pW: { step: 1, min: 0, max: 34 },
  he: { step: 5, min: 5, max: 95 }, fV: { step: 1, min: 6, max: 60 }, pV: { step: 1, min: 6, max: 60 },
  kg: { step: 1, min: 30, max: 160 }, cm: { step: 1, min: 120, max: 220 },
  fM: { step: 10, min: 60, max: 900 }, pM: { step: 10, min: 60, max: 900 }, tE: { step: 1, min: 25, max: 37 },
} as const
export type NumKey = keyof typeof SPECS

export type ThermoState = {
  fD: number; fT: number; fW: number; act: ActKey; palOn: boolean; pD: number; pT: number; pW: number
  type: SuitType; mm: number; under: UnderKey; shell: 'trilam' | 'neoprene'; suitGas: 'air' | 'argon'; covered: boolean
  gas: 'air' | 'tx'; he: number; sens: Sens; fV: number; pV: number; kg: number; cm: number; water: 'mer' | 'douce'; fM: number; pM: number; tE: number
}
export const DEFAULT_STATE: ThermoState = {
  fD: 30, fT: 35, fW: 14, act: 'calme', palOn: true, pD: 5, pT: 5, pW: 16,
  type: 'humide', mm: 7, under: 'moyen', shell: 'trilam', suitGas: 'air', covered: true,
  gas: 'air', he: 35, sens: 'normal', fV: 18, pV: 14, kg: 75, cm: 175, water: 'mer', fM: 200, pM: 110, tE: 34,
}
export const STORAGE_KEY = 'orque-bilan-thermique-v1'

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const oneOf = <T extends string>(v: unknown, list: readonly T[], d: T): T => ((list as readonly unknown[]).includes(v) ? (v as T) : d)
export function sanitizeState(raw: unknown): ThermoState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  const D = DEFAULT_STATE
  const out = { ...D }
  for (const k of Object.keys(SPECS) as NumKey[]) if (fin(s[k])) out[k] = Math.min(SPECS[k].max, Math.max(SPECS[k].min, s[k] as number))
  out.act = oneOf(s.act, ACT_KEYS, D.act)
  out.under = oneOf(s.under, UNDER_KEYS, D.under)
  out.type = oneOf(s.type, ['humide', 'semi', 'etanche'] as const, D.type)
  out.shell = oneOf(s.shell, ['trilam', 'neoprene'] as const, D.shell)
  out.suitGas = oneOf(s.suitGas, ['air', 'argon'] as const, D.suitGas)
  out.gas = oneOf(s.gas, ['air', 'tx'] as const, D.gas)
  out.sens = oneOf(s.sens, ['frileux', 'normal', 'resistant'] as const, D.sens)
  out.water = oneOf(s.water, ['mer', 'douce'] as const, D.water)
  if (typeof s.palOn === 'boolean') out.palOn = s.palOn
  if (typeof s.covered === 'boolean') out.covered = s.covered
  if (fin(s.mm) && (out.type === 'etanche' || MM[out.type].includes(s.mm))) out.mm = s.mm
  return out
}

/** Entrée du moteur à partir des réglages (comme le modèle). */
export function suitOf(s: ThermoState): Suit {
  return { type: s.type, mm: s.mm, under: s.under, shell: s.shell, argon: s.suitGas === 'argon', covered: s.covered }
}
export function inputOf(s: ThermoState): ThermoInput {
  return {
    mass: s.kg, height: s.cm, sensitivity: s.sens, tExh: s.tE, fHe: s.gas === 'tx' ? s.he / 100 : 0, salt: s.water === 'mer', suit: suitOf(s),
    fond: { depth: s.fD, minutes: s.fT, tWater: s.fW, activity: s.act, rmv: s.fV, M: s.fM },
    palier: s.palOn ? { depth: s.pD, minutes: s.pT, tWater: s.pW, activity: 'repos', rmv: s.pV, M: s.pM } : null,
  }
}
/** Protections comparées dans « Et si tu changeais de protection ? ». */
export const ALT_SUITS: Partial<ThermoState>[] = [
  { type: 'humide', mm: 5 }, { type: 'humide', mm: 7 }, { type: 'semi', mm: 7 },
  { type: 'etanche', shell: 'trilam', under: 'fin', suitGas: 'air' },
  { type: 'etanche', shell: 'trilam', under: 'moyen', suitGas: 'air' },
  { type: 'etanche', shell: 'trilam', under: 'epais', suitGas: 'argon' },
]
