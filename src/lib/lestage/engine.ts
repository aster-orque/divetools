/**
 * Lestage : logique pure, portée à l'identique du modèle `lestage.html`.
 * Aucune formule, constante ni arrondi n'a été modifié.
 *
 * Flottabilité d'un bloc = eau déplacée (métal + robinet + capacité) − masse (bloc + robinet + gaz).
 * Masse du gaz : gaz réel (Z de l'air), comparée à la pression de réserve.
 * Ajustement = écart de flottabilité entre les deux configs + effet de la densité de l'eau sur le poids équipé.
 * Lest arrondi au 0,5 kg le plus proche, jamais négatif.
 */

export const RHO = { acier: 7.85, alu: 2.7, laiton: 8.5, douce: 1.0, mer: 1.025, sale: 1.029 } as const
export type Metal = 'acier' | 'alu'
export type Water = 'douce' | 'mer' | 'sale'

/** Facteur de compressibilité de l'air à 15 °C (ajustement quadratique, ±1 % de 0 à 300 bar). */
export const zAir = (p: number) => 1 - 2.5e-4 * p + 1.8e-6 * p * p
/** Masse volumique du gaz à 1 bar, 15 °C (g/L). Le reste est compté comme de l'azote + argon (28,16 g/mol). */
export const gasRho1 = (o2: number) => ((o2 / 100) * 32 + (1 - o2 / 100) * 28.16) / (0.083145 * 288.15)
/** Masse de gaz (kg) dans n blocs de v litres à p bar. */
export const gasMass = (v: number, n: number, p: number, o2: number) => (p <= 0 ? 0 : (v * n * p * gasRho1(o2)) / zAir(p) / 1000)

export type Tank = { pre: string; n: number; v: number; m: number; mat: Metal; p: number; rob: number; eau: Water }

/** Flottabilité (kg) d'une configuration de blocs à une pression donnée. */
export function buoyancy(c: Tank, p: number, o2: number) {
  const vMetal = (c.n * c.m) / RHO[c.mat]
  const vRob = c.rob / RHO.laiton
  const vol = vMetal + c.n * c.v + vRob // litres déplacés
  const mass = c.n * c.m + c.rob + gasMass(c.v, c.n, p, o2)
  return RHO[c.eau] * vol - mass
}

export type Opts = { res: number; o2: number; lest: number; body: number }
/** Calcul complet : A = config connue (lest connu), B = nouvelle config. */
export function compute(A: Tank, B: Tank, o: Opts) {
  const fA = buoyancy(A, o.res, o.o2), fB = buoyancy(B, o.res, o.o2)
  const tanks = fB - fA // plomb à ajouter pour compenser les blocs
  const water = o.body * (RHO[B.eau] / RHO[A.eau] - 1) // plomb à ajouter pour compenser l'eau
  const delta = tanks + water
  const exact = Math.max(0, o.lest + delta)
  const rounded = Math.max(0, Math.round(exact * 2) / 2)
  return {
    fA, fB, tanks, water, delta, exact, rounded,
    fullA: buoyancy(A, A.p, o.o2), fullB: buoyancy(B, B.p, o.o2),
    gasA: Math.max(0, gasMass(A.v, A.n, A.p, o.o2) - gasMass(A.v, A.n, o.res, o.o2)),
    gasB: Math.max(0, gasMass(B.v, B.n, B.p, o.o2) - gasMass(B.v, B.n, o.res, o.o2)),
    change: rounded - o.lest,
  }
}

/**
 * Lest de départ quand on ne le connaît pas : règle en % du poids (mer, bloc alu 11 L de référence),
 * puis corrigée par la physique pour le bloc et l'eau réels.
 */
export type Suit = 'aucune' | '3' | '5' | '7' | 'etanche'
export const SUITS: Record<Suit, { pct: number; add: number; kg: number }> = {
  aucune: { pct: 0.02, add: 0, kg: 1 }, '3': { pct: 0.05, add: 0, kg: 2 }, '5': { pct: 0.08, add: 0, kg: 3 },
  '7': { pct: 0.1, add: 0, kg: 5 }, etanche: { pct: 0.1, add: 4, kg: 8 },
}
export const REF: Tank = { pre: 'ref', n: 1, v: 11.1, m: 14.3, mat: 'alu', rob: 0.7, eau: 'mer', p: 200 }
/** + combinaison + gilet et détendeurs (~4 kg). */
export const equipped = (body: number, suit: Suit) => body + SUITS[suit].kg + 4
export function estimate(A: Tank, o: { res: number; o2: number; weight: number; suit: Suit }) {
  const s = SUITS[o.suit], rule = o.weight * s.pct + s.add
  const r = compute(REF, A, { res: o.res, o2: o.o2, lest: rule, body: equipped(o.weight, o.suit) })
  return { rule, exact: r.exact, rounded: r.rounded }
}

// ── Blocs prédéfinis (modèle) : masses à vide sans robinet, d'après fiches fabricants (Faber, Luxfer). La tare gravée fait foi. ──
export type Preset = { id: string; n: number; v: number; m: number; mat: Metal; p: number; rob: number }
export const PRESETS: Preset[] = [
  { id: 's10', n: 1, v: 10, m: 11.0, mat: 'acier', p: 230, rob: 0.7 },
  { id: 's12', n: 1, v: 12, m: 13.9, mat: 'acier', p: 230, rob: 0.7 },
  { id: 's15', n: 1, v: 15, m: 17.4, mat: 'acier', p: 230, rob: 0.7 },
  { id: 'a11', n: 1, v: 11.1, m: 14.3, mat: 'alu', p: 200, rob: 0.7 },
  { id: 'a6', n: 1, v: 5.7, m: 6.9, mat: 'alu', p: 200, rob: 0.6 },
  { id: 'b10', n: 2, v: 10, m: 11.0, mat: 'acier', p: 230, rob: 1.8 },
  { id: 'b12', n: 2, v: 12, m: 13.9, mat: 'acier', p: 230, rob: 1.8 },
  { id: 's12h', n: 1, v: 12, m: 17.5, mat: 'acier', p: 300, rob: 0.8 }, // fiches D-Center 17,4 kg, ECS/Deepstop ~18 kg
]
export const PRESET_IDS = [...PRESETS.map((p) => p.id), 'perso'] as const
export const pick = (id: string): Omit<Tank, 'eau'> => {
  const p = PRESETS.find((x) => x.id === id) ?? PRESETS[1]
  return { pre: p.id, n: p.n, v: p.v, m: p.m, mat: p.mat, p: p.p, rob: p.rob }
}

export type Mode = 'known' | 'est'
export type LestState = {
  A: Tank; B: Tank; mode: Mode; lest: number; weight: number; suit: Suit; res: number; o2: number; body: number
}
export const DEFAULT_STATE: LestState = {
  A: { ...pick('s12'), eau: 'mer' }, B: { ...pick('a11'), eau: 'mer' }, mode: 'known', lest: 6, weight: 75, suit: '5', res: 50, o2: 21, body: 90,
}
export const STORAGE_KEY = 'lestage-v2'

/** Bornes et pas des steppers (modèle). */
export const SPECS = {
  lest: { step: 0.5, min: 0, max: 40 },
  weight: { step: 1, min: 30, max: 160 },
  body: { step: 1, min: 30, max: 220 },
  res: { step: 10, min: 0, max: 150 },
  o2: { step: 1, min: 21, max: 100 },
  v: { step: 0.5, min: 1, max: 30 },
  m: { step: 0.1, min: 1, max: 40 },
  rob: { step: 0.1, min: 0, max: 5 },
  p: { step: 10, min: 50, max: 350 },
} as const
export type GlobalKey = 'lest' | 'weight' | 'body' | 'res' | 'o2'
export type TankKey = 'v' | 'm' | 'rob' | 'p'

/** Pas d'un stepper (modèle : arrondi au dixième). */
export function bumpValue(v: number, dir: -1 | 1, step: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(Math.round((v + dir * step) / step) * step * 10) / 10))
}

const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const WATERS: Water[] = ['douce', 'mer', 'sale']
function sanitizeTank(raw: unknown, fallback: Tank): Tank {
  if (!raw || typeof raw !== 'object') return fallback
  const t = raw as Record<string, unknown>
  const tank: Tank = {
    pre: typeof t.pre === 'string' && (PRESET_IDS as readonly string[]).includes(t.pre) ? t.pre : 'perso',
    n: t.n === 2 ? 2 : 1,
    v: fin(t.v) ? t.v : fallback.v,
    m: fin(t.m) ? t.m : fallback.m,
    mat: t.mat === 'alu' ? 'alu' : 'acier',
    p: fin(t.p) ? t.p : fallback.p,
    rob: fin(t.rob) ? t.rob : fallback.rob,
    eau: WATERS.includes(t.eau as Water) ? (t.eau as Water) : 'mer',
  }
  // 12 L 300 bar enregistré avec l'ancienne estimation (16,5 kg) : nouvelle masse (modèle)
  if (tank.pre === 's12h' && tank.m === 16.5) tank.m = 17.5
  return tank
}
export function sanitizeState(raw: unknown): LestState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!s.A || !s.B) return null
  const D = DEFAULT_STATE
  return {
    A: sanitizeTank(s.A, D.A),
    B: sanitizeTank(s.B, D.B),
    mode: s.mode === 'est' ? 'est' : 'known',
    lest: fin(s.lest) ? s.lest : D.lest,
    weight: fin(s.weight) ? s.weight : D.weight,
    suit: (Object.keys(SUITS) as Suit[]).includes(s.suit as Suit) ? (s.suit as Suit) : D.suit,
    res: fin(s.res) ? s.res : D.res,
    o2: fin(s.o2) ? s.o2 : D.o2,
    body: fin(s.body) ? s.body : D.body,
  }
}
