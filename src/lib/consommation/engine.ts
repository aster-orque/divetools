// Moteur de calcul de l'outil « Consommation d'air » (slug : consommation).
// Transcription fidèle de `version beta outils/Consommation/consommation.html`.
// Modèle gaz parfait, eau « théorique » : 10 m d'eau = 1 bar, 1 bar en surface.
// Aucune lecture du DOM ni d'état React : tout est pur et testable.

// ── Types ──────────────────────────────────────────────────────────────────────
export type TabId = 'pression' | 'conso' | 'auto' | 'comp'

/** Réglages partagés entre les onglets, enregistrés tels quels dans le localStorage. */
export type Settings = {
  /** Conso surface (L/min), partagée par Pression, Autonomie et Comparer */
  sac: number
  /** Ma conso : volume unitaire du bloc (L) */
  cV: number
  /** Ma conso : bloc bi (2 × cV) */
  cBi: boolean
  /** Ma conso : pression de départ (bar) */
  cP0: number
  /** Ma conso : pression de sortie (bar) */
  cP1: number
  /** Ma conso : durée (min) */
  cT: number
  /** Ma conso : profondeur moyenne (m) */
  cD: number
  /** Autonomie / Comparer : volume unitaire du bloc (L) */
  V: number
  /** Autonomie / Comparer : bloc bi (2 × V) */
  bi: boolean
  /** Autonomie / Comparer : pression de départ (bar) */
  P0: number
  /** Profondeur partagée Pression / Autonomie (m) */
  d: number
  /** Comparer : profondeur A (m) */
  ka: number
  /** Comparer : profondeur B (m) */
  kb: number
  /** Dernier onglet ouvert */
  tab: TabId
}

export type NumericKey = { [K in keyof Settings]: Settings[K] extends number ? K : never }[keyof Settings]
export type BoolKey = 'cBi' | 'bi'

export type FieldSpec = { min: number; max: number; step: number }

export type ConsoLevelKey = 'veryCalm' | 'calm' | 'average' | 'high' | 'veryHigh'

/** Bloc de référence : volume unitaire et mono/bi. */
export type Tank = { unitL: number; bi: boolean }

// ── Constantes ─────────────────────────────────────────────────────────────────
export const STORAGE_KEY = 'conso-air-v2'
export const TAB_IDS: readonly TabId[] = ['pression', 'conso', 'auto', 'comp']

export const DEFAULT_SETTINGS: Settings = {
  sac: 18, cV: 12, cBi: false, cP0: 200, cP1: 60, cT: 45, cD: 18,
  V: 12, bi: false, P0: 200, d: 20, ka: 10, kb: 30, tab: 'pression',
}

/** Bornes et pas des steppers (data-min / data-max / data-step de l'original). */
export const FIELD_SPECS = {
  sac: { min: 6, max: 50, step: 1 },     // L/min
  cV: { min: 1, max: 20, step: 0.5 },    // L
  V: { min: 1, max: 20, step: 0.5 },     // L
  cP0: { min: 10, max: 300, step: 10 },  // bar
  P0: { min: 10, max: 300, step: 10 },   // bar
  cP1: { min: 0, max: 300, step: 10 },   // bar
  cT: { min: 1, max: 300, step: 1 },     // min
  cD: { min: 0, max: 60, step: 1 },      // m
} as const satisfies Partial<Record<NumericKey, FieldSpec>>

export type StepperKey = keyof typeof FIELD_SPECS

/** Profondeur maximale des curseurs et de la colonne d'eau (m). */
export const MAX_DEPTH_M = 60
/** Profondeurs des barres 0 → 60 m (m). */
export const DEPTHS_M: readonly number[] = [0, 10, 20, 30, 40, 50, 60]

/** Raccourcis de volume unitaire (L). */
export const MONO_VOLUMES_L: readonly number[] = [10, 12, 15, 18]
export const BI_VOLUMES_L: readonly number[] = [7, 10, 12]
/** Volume unitaire repris quand on passe de mono à bi (ou l'inverse) hors liste (L). */
export const FALLBACK_UNIT_VOLUME_L = 12

/** Les 7 blocs du comparateur et du tableau (ordre de l'original). */
export const TANK_PRESETS: readonly Tank[] = [
  { unitL: 10, bi: false }, { unitL: 12, bi: false }, { unitL: 15, bi: false }, { unitL: 18, bi: false },
  { unitL: 7, bi: true }, { unitL: 10, bi: true }, { unitL: 12, bi: true },
]

/** Bloc de référence de l'onglet Pression : 12 L à 200 bar. */
export const PRESSURE_TAB_TANK_L = 12
export const PRESSURE_TAB_TANK_BAR = 200

/** En dessous de cette pression de sortie, alerte « réserve entamée » (bar). */
export const RESERVE_BAR = 50

/** Seuils du badge de conso surface (L/min, borne haute exclue). */
export const CONSO_LEVELS: readonly { below: number; key: ConsoLevelKey }[] = [
  { below: 12, key: 'veryCalm' },
  { below: 16, key: 'calm' },
  { below: 20, key: 'average' },
  { below: 25, key: 'high' },
  { below: Infinity, key: 'veryHigh' },
]

/** Maximum minimal de la jauge de conso (L/min) : au-delà du dernier seuil (25) pour que les 5 couleurs restent visibles. */
export const CONSO_SCALE_MIN_MAX = 30

// ── Calculs de base ────────────────────────────────────────────────────────────
/** Pression absolue (bar) : P = 1 + profondeur / 10. */
export function pressureAbsBar(depthM: number): number {
  return 1 + depthM / 10
}

/** Volume total du bloc (L) : 2 × unitaire pour un bi. */
export function totalVolumeL(unitL: number, bi: boolean): number {
  return unitL * (bi ? 2 : 1)
}

/**
 * Autonomie simulée (min) : bloc vidé jusqu'à 0 bar à profondeur constante,
 * sans réserve, sans remontée ni palier. V × P0 / (conso × P).
 */
export function autonomyMin(volumeL: number, startBar: number, sacLpm: number, depthM: number): number {
  return volumeL * startBar / (sacLpm * pressureAbsBar(depthM))
}

/** Conso au fond (L/min) = conso surface × P. */
export function bottomConsumptionLpm(sacLpm: number, depthM: number): number {
  return sacLpm * pressureAbsBar(depthM)
}

/** Minutes affichées partout dans l'outil : tronquées (Math.floor), jamais arrondies au-dessus. */
export function shownMinutes(min: number): number {
  return Math.floor(min)
}

/** Durée d'un bar au mano (s) = V / conso au fond × 60. */
export function secondsPerBar(volumeL: number, bottomLpm: number): number {
  return volumeL / bottomLpm * 60
}

/** Baisse du mano (bar/min) = conso au fond / V. */
export function gaugeDropBarPerMin(volumeL: number, bottomLpm: number): number {
  return bottomLpm / volumeL
}

// ── Ma conso ───────────────────────────────────────────────────────────────────
export type ConsoResult = {
  /** Gaz respiré (L) = V × (P départ − P sortie) */
  usedL: number
  /** Pression absolue moyenne (bar) */
  avgPressureBar: number
  /** Conso ramenée en surface (L/min) = gaz respiré / (durée × P moyenne) */
  sacLpm: number
  /** Conso à la profondeur moyenne (L/min) = gaz respiré / durée */
  rmvLpm: number
  /** Calcul exploitable : gaz respiré > 0 */
  valid: boolean
}

export function calcConso(
  volumeL: number, startBar: number, endBar: number, durationMin: number, avgDepthM: number,
): ConsoResult {
  const usedL = volumeL * (startBar - endBar)
  const avgPressureBar = pressureAbsBar(avgDepthM)
  return {
    usedL,
    avgPressureBar,
    sacLpm: usedL / (durationMin * avgPressureBar),
    rmvLpm: usedL / durationMin,
    valid: usedL > 0,
  }
}

/** Badge de conso : premier seuil strictement supérieur. NaN → dernier niveau (l'original plantait). */
export function rateConso(sacLpm: number): ConsoLevelKey {
  return (CONSO_LEVELS.find((l) => sacLpm < l.below) ?? CONSO_LEVELS[CONSO_LEVELS.length - 1]).key
}

/** Valeur appliquée aux autres onglets : arrondie au dixième, puis bornée aux limites du stepper conso (6–50 L/min). */
export function roundSacForShare(sacLpm: number): number {
  return clamp(Math.round(sacLpm * 10) / 10, FIELD_SPECS.sac.min, FIELD_SPECS.sac.max)
}

/** Maximum de la jauge (L/min) : au moins 30, sinon 1,2 × la valeur arrondie au multiple de 5 supérieur. */
export function consoScaleMax(sacLpm: number): number {
  return Math.max(CONSO_SCALE_MIN_MAX, Math.ceil(sacLpm * 1.2 / 5) * 5)
}

/** Position (%) d'une valeur sur la jauge, plafonnée à 100. */
export function consoScalePct(valueLpm: number, scaleMax: number): number {
  return Math.min(100, valueLpm / scaleMax * 100)
}

// ── Steppers et bloc ───────────────────────────────────────────────────────────
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** Bouton − / + : ajoute un pas, recale sur la grille du pas, borne. */
export function stepValue(value: number, dir: -1 | 1, spec: FieldSpec): number {
  return clamp(Math.round((value + dir * spec.step) / spec.step) * spec.step, spec.min, spec.max)
}

/** Saisie clavier (à la validation) : virgule acceptée, recalée sur le pas le plus proche, bornée. null si illisible. */
export function parseFieldInput(raw: string, spec: FieldSpec): number | null {
  const v = parseFloat(raw.trim().replace(',', '.'))
  return Number.isFinite(v) ? clamp(Math.round(v / spec.step) * spec.step, spec.min, spec.max) : null
}

/** Même bloc : même type (mono/bi) et même volume unitaire. */
export function sameTank(a: Tank, b: Tank): boolean {
  return a.unitL === b.unitL && a.bi === b.bi
}

/** Passage mono ↔ bi : garde le volume unitaire s'il existe dans la nouvelle liste, sinon 12 L. */
export function unitVolumeAfterModeSwitch(unitL: number, wasBi: boolean, toBi: boolean): number {
  if (wasBi === toBi) return unitL
  const list = toBi ? BI_VOLUMES_L : MONO_VOLUMES_L
  return list.includes(unitL) ? unitL : FALLBACK_UNIT_VOLUME_L
}

// ── Comparer ───────────────────────────────────────────────────────────────────
export type AbComparison = {
  aMin: number
  bMin: number
  /** Plus courte / plus longue autonomie et leurs profondeurs (égalité → A considéré comme « lo ») */
  loMin: number
  hiMin: number
  loDepthM: number
  hiDepthM: number
  /** Écart entre les minutes affichées (tronquées) : « 40 min vs 24 min » → 16 */
  diffMin: number
  /** Rapport hi / lo sur les minutes affichées (valeurs exactes si la plus courte s'affiche 0 min) */
  ratio: number
}

export function compareDepths(
  volumeL: number, startBar: number, sacLpm: number, depthAM: number, depthBM: number,
): AbComparison {
  const aMin = autonomyMin(volumeL, startBar, sacLpm, depthAM)
  const bMin = autonomyMin(volumeL, startBar, sacLpm, depthBM)
  const aIsLo = aMin <= bMin
  const loMin = aIsLo ? aMin : bMin
  const hiMin = aIsLo ? bMin : aMin
  const loShown = shownMinutes(loMin)
  const hiShown = shownMinutes(hiMin)
  return {
    aMin, bMin, loMin, hiMin,
    loDepthM: aIsLo ? depthAM : depthBM,
    hiDepthM: aIsLo ? depthBM : depthAM,
    diffMin: hiShown - loShown,
    ratio: loShown > 0 ? hiShown / loShown : hiMin / loMin,
  }
}

/**
 * Blocs des barres A/B : les 7 préréglages, plus le bloc de l'utilisateur s'il n'y figure pas
 * (même type et même volume unitaire), le tout trié par volume total.
 */
export function compareTankList(current: Tank): Tank[] {
  if (TANK_PRESETS.some((t) => sameTank(t, current))) return [...TANK_PRESETS]
  return [...TANK_PRESETS, current].sort((x, y) => totalVolumeL(x.unitL, x.bi) - totalVolumeL(y.unitL, y.bi))
}

/** Lignes du tableau : 0 → 60 m, plus A et B, sans doublon, triées. */
export function heatTableDepths(depthAM: number, depthBM: number): number[] {
  return [...new Set([...DEPTHS_M, depthAM, depthBM])].sort((x, y) => x - y)
}

export type HeatCell = {
  /** Minutes affichées : Math.floor(k × max), comme l'original */
  minutes: number
  /** Intensité de couleur (0–1) = (10 + k × 75) % arrondi */
  alpha: number
}

/** Tableau profondeur × bloc (7 préréglages). k = autonomie / autonomie max du tableau. */
export function heatTable(depthsM: number[], startBar: number, sacLpm: number): HeatCell[][] {
  const values = depthsM.map((d) => TANK_PRESETS.map((t) => autonomyMin(totalVolumeL(t.unitL, t.bi), startBar, sacLpm, d)))
  const hm = Math.max(...values.flat())
  return values.map((row) => row.map((v) => {
    const k = v / hm
    return { minutes: Math.floor(k * hm), alpha: Math.round(10 + k * 75) / 100 }
  }))
}

// ── Géométrie SVG ──────────────────────────────────────────────────────────────
/** Colonne d'eau : viewBox 120 × 320, surface à y = 14, 60 m à y = 14 + 292. */
export const COLUMN = { width: 120, height: 320, top: 14, span: 292 } as const
/** Rayon du ballon en surface (unités SVG). */
export const BALLOON_SURFACE_R = 26

export function columnDepthToY(depthM: number): number {
  return COLUMN.top + depthM / MAX_DEPTH_M * COLUMN.span
}

/** y (unités SVG) → profondeur entière bornée 0–60 m. */
export function columnYToDepth(y: number): number {
  return Math.round(Math.min(MAX_DEPTH_M, Math.max(0, (y - COLUMN.top) / COLUMN.span * MAX_DEPTH_M)))
}

/** Ballon : volume ∝ 1/P, donc rayon ∝ 1/∛P. Centre borné dans la colonne. */
export function balloon(depthM: number): { r: number; cy: number; volumePct: number } {
  const p = pressureAbsBar(depthM)
  const r = BALLOON_SURFACE_R / Math.cbrt(p)
  const y = columnDepthToY(depthM)
  return { r, cy: Math.max(r + 12, Math.min(COLUMN.height - r - 2, y)), volumePct: 1 / p * 100 }
}

/** Manomètre : viewBox 200 × 180, centre (100, 100), arc de 270° démarrant à 135°. */
export const GAUGE = { cx: 100, cy: 100, startRad: Math.PI * 0.75, spanRad: Math.PI * 1.5, tickStepBar: 50 } as const

/** Pleine échelle du mano (bar) : 300, ou la pression de départ si elle est plus haute. */
export function gaugeMaxBar(startBar: number): number {
  return Math.max(300, startBar)
}

export function gaugeAngle(valueBar: number, maxBar: number): number {
  return GAUGE.startRad + GAUGE.spanRad * valueBar / maxBar
}

export function polar(angleRad: number, r: number): [number, number] {
  return [GAUGE.cx + r * Math.cos(angleRad), GAUGE.cy + r * Math.sin(angleRad)]
}

export function gaugeArcPath(fromBar: number, toBar: number, maxBar: number, r: number): string {
  const a0 = gaugeAngle(fromBar, maxBar)
  const a1 = gaugeAngle(toBar, maxBar)
  const [x0, y0] = polar(a0, r)
  const [x1, y1] = polar(a1, r)
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1}`
}

// ── État mémorisé ──────────────────────────────────────────────────────────────
/**
 * Fusionne un objet lu dans le localStorage avec les valeurs par défaut.
 * L'original faisait un Object.assign sans contrôle ; ici une valeur de mauvais type
 * est ignorée (valeur par défaut). Les nombres ne sont pas rebornés, comme l'original.
 */
export function sanitizeSettings(raw: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS }
  if (!raw || typeof raw !== 'object') return out
  const r = raw as Record<string, unknown>
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    const v = r[key]
    if (key === 'tab') {
      if (typeof v === 'string' && (TAB_IDS as readonly string[]).includes(v)) out.tab = v as TabId
    } else if (key === 'cBi' || key === 'bi') {
      if (typeof v === 'boolean') out[key] = v
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      out[key] = v
    }
  }
  return out
}
