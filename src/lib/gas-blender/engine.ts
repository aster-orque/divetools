// Moteur de calcul de l'outil « Gonflage nitrox » (slug : gas-blender).
// Transcription fidèle de `version beta outils/Gas blender/gas-blender.html`.
// Méthode des pressions partielles : gaz parfaits, isotherme, lecture manomètre à 10 bar près.
// Aucune lecture du DOM ni d'état React, aucun texte affiché : le composant formate tout.

// ── Constantes (mêmes noms et valeurs que l'original) ─────────────────────────
/** bar : en dessous, on considère 0 */
export const EPS = 0.05
/** Précision de lecture manomètre (bar) */
export const STEP = 10
/** Tolérance acceptée sur le % O2 final (fraction : 2 points, cohérent avec une lecture à 10 bar) */
export const TOL = 0.02
/** Mélanges courants proposés en raccourci (% O2) */
export const MIXES: readonly number[] = [28, 30, 32, 36, 40, 50, 80]

export const STORAGE_KEY = 'gas-blender-v1'
export const TAB_STORAGE_KEY = STORAGE_KEY + '-tab'

export type TabId = 'melange' | 'stocks' | 'plan'
export const TAB_IDS: readonly TabId[] = ['melange', 'stocks', 'plan']

// ── Saisie ─────────────────────────────────────────────────────────────────────
/** Champ numérique d'un gaz : nombre, ou '' quand il est vide ou illisible (comme l'original). */
export type NumOrEmpty = number | ''

/** Une carte « Gaz disponibles », telle qu'enregistrée dans le localStorage. */
export type GasInput = {
  /** Nom saisi (donnée libre, rendue par React) */
  name: string
  /** % O2 (0–100) */
  f: NumOrEmpty
  /** Pression du tampon, ou pression max du compresseur (bar) */
  p: NumOrEmpty
  /** Volume d'une bouteille (L) ; vide = source continue (compresseur) */
  v: NumOrEmpty
  /** Nombre de bouteilles identiques (1–20) */
  n?: NumOrEmpty
  /** Ouverture des ×N : true / absent = en cascade, false = tous ensemble */
  c?: boolean
}

export type NewGasKind = 'o2' | 'nx' | 'airb' | 'comp'

/**
 * Gaz ajoutés par les boutons « + ». Mêmes valeurs que l'original ; seuls les noms
 * (« O2 pur », « Tampon nitrox »…) viennent des dictionnaires, pour être traduits.
 */
export const NEW_GAS: Record<NewGasKind, Omit<GasInput, 'name'>> = {
  o2: { f: 100, p: 200, v: 50, n: 1 },
  nx: { f: 36, p: 220, v: 50, n: 1 },
  airb: { f: 21, p: 230, v: 50, n: 1 },
  comp: { f: 21, p: 300, v: '' },
}

/** État complet de l'outil (S de l'original). */
export type BlendState = {
  /** Volume d'un bloc (L) */
  vol: number
  /** Nombre de blocs sur la rampe */
  nb: number
  /** Pression restante (bar) */
  p1: number
  /** % O2 restant */
  f1: number
  /** % O2 voulu */
  f2: number
  /** Pression finale (bar) */
  p2: number
  gases: GasInput[]
  /** % O2 analysé */
  ana?: number
  /** Gonflage pour lequel `ana` a été saisi (sinon on repart du % attendu) */
  anaKey?: string
}

/** Valeurs par défaut (DEF de l'original) : gaz donnés par leur type, noms fournis par l'UI. */
export const DEF = {
  vol: 12, nb: 1, p1: 50, f1: 21, f2: 32, p2: 200,
  gases: ['o2', 'nx', 'comp'] as const satisfies readonly NewGasKind[],
}

export function newGas(kind: NewGasKind, name: string): GasInput {
  return { name, ...NEW_GAS[kind] }
}

export function defaultState(names: Record<NewGasKind, string>): BlendState {
  const { gases, ...rest } = DEF
  return { ...rest, gases: gases.map((k) => newGas(k, names[k])) }
}

export type FieldSpec = { min: number; max: number; step: number }
export type StepperKey = 'vol' | 'nb' | 'p1' | 'f1' | 'f2' | 'p2' | 'ana'

/** Bornes et pas des steppers (data-step / data-min / data-max de l'original). */
export const FIELD_SPECS: Record<StepperKey, FieldSpec> = {
  vol: { step: 0.5, min: 0.5, max: 50 }, // L
  nb: { step: 1, min: 1, max: 30 },      // blocs
  p1: { step: 10, min: 0, max: 300 },    // bar
  f1: { step: 1, min: 0, max: 100 },     // % O2
  f2: { step: 1, min: 21, max: 100 },    // % O2
  p2: { step: 10, min: 10, max: 300 },   // bar
  ana: { step: 0.1, min: 0, max: 100 },  // % O2
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** Bouton − / + : pas ajouté, recalé sur la grille du pas, arrondi au dixième, borné (bump de l'original). */
export function bumpValue(value: number, dir: -1 | 1, spec: FieldSpec): number {
  return clamp(Math.round(Math.round((value + dir * spec.step) / spec.step) * spec.step * 10) / 10, spec.min, spec.max)
}

/** Saisie clavier d'un stepper : virgule acceptée, bornée, PAS recalée sur le pas (comme l'original). null si illisible. */
export function parseStepperInput(raw: string, spec: FieldSpec): number | null {
  const v = parseFloat(raw.replace(',', '.'))
  return Number.isFinite(v) ? clamp(v, spec.min, spec.max) : null
}

/** Saisie d'un champ de carte gaz. Nombre : entier borné 1–20. */
export function parseGasField(raw: string, k: 'f' | 'p' | 'v' | 'n'): NumOrEmpty {
  const v = parseFloat(raw.replace(',', '.'))
  if (raw.trim() === '' || !Number.isFinite(v)) return ''
  return k === 'n' ? Math.min(20, Math.max(1, Math.round(v))) : v
}

/** Blocs sur la rampe (NB() de l'original). */
export function rampCount(nb: number): number {
  return Math.max(1, Math.round(+nb || 1))
}

/** Volume total gonflé (L) : une rampe de n blocs de V litres = un bloc de n·V litres. */
export function blockVolume(s: BlendState): number {
  return s.vol * rampCount(s.nb)
}

/** Source continue (compresseur) : pas de volume. */
export function isCont(g: GasInput): boolean {
  return g.v === '' || !(+g.v > 0)
}

export function nTanks(g: GasInput): number {
  return Math.min(20, Math.max(1, Math.round(+(g.n ?? '') || 1)))
}

/** Type affiché sur la carte (kindTxt de l'original). */
export type GasCardKind =
  | { kind: 'continuous' }
  | { kind: 'buffer' }
  | { kind: 'multi'; n: number; together: boolean }

export function gasCardKind(g: GasInput): GasCardKind {
  if (isCont(g)) return { kind: 'continuous' }
  const n = nTanks(g)
  return n > 1 ? { kind: 'multi', n, together: g.c === false } : { kind: 'buffer' }
}

/** Champs encadrés en rouge (markBad) : le gaz est alors ignoré du calcul. */
export function gasFieldErrors(g: GasInput): { f: boolean; p: boolean } {
  return {
    f: !(g.f !== '' && +g.f >= 0 && +g.f <= 100),
    p: !(g.p !== '' && +g.p > 0),
  }
}

export function validGas(g: GasInput): boolean {
  return g.f !== '' && g.p !== '' && Number.isFinite(+g.f) && Number.isFinite(+g.p) && +g.f >= 0 && +g.f <= 100 && +g.p > 0
}

/** Couleur d'un gaz : O2 pur, nitrox, air (color() de l'original). f en fraction. */
export type GasColor = 'o2' | 'nx' | 'air'
export function gasColor(f: number): GasColor {
  return f > 0.999 ? 'o2' : f > 0.215 ? 'nx' : 'air'
}

/** Profondeur max (m) pour une ppO2 donnée : floor((ppO2/f − 1)·10). f en fraction. */
export function mod(f: number, pp: number): number {
  return Math.floor((pp / f - 1) * 10)
}

export const downS = (x: number): number => Math.floor(x / STEP + 1e-9) * STEP
export const upS = (x: number): number => Math.ceil(x / STEP - 1e-9) * STEP

// ── Gaz lus (readGases) ────────────────────────────────────────────────────────
/**
 * Nom d'un gaz, structuré pour être formaté par l'UI :
 * `name` (ou « Gaz {fPct} % » si vide) + « ×times » si times > 0 + « n°seq » si seq > 0.
 */
export type GasLabel = {
  /** Nom saisi, sans espaces autour ('' = sans nom) */
  name: string
  /** % O2 saisi, pour le nom par défaut d'un gaz sans nom */
  fPct: number
  /** ×N : N bouteilles ouvertes ensemble, ou nombre total d'un groupe en cascade (0 = rien) */
  times: number
  /** Numéro de doublon dans une cascade (0 = rien) */
  seq: number
}

/** Identité d'un nom (deux gaz au même nom affiché ont la même clé). */
export function labelKey(l: GasLabel): string {
  return `${l.name === '' ? '\u0001' + l.fPct : l.name}\u0000${l.times}\u0000${l.seq}`
}

/** Une bouteille (ou un lot « tous ensemble ») d'un groupe de tampons. */
export type Member = {
  label: GasLabel
  /** Pression avant gonflage (bar) */
  pmax: number
  /** Volume (L) ; N·V pour un lot ouvert ensemble */
  vol: number
  /** Nombre de bouteilles du lot (1 si seule) */
  k: number
  /** Volume d'une bouteille du lot (L) */
  unit: number
}

/** Source de gaz après validation et regroupement. */
export type BlendGas = {
  /** Index dans la liste lue */
  id: number
  label: GasLabel
  /** Clé de dédoublonnage (nom affiché + % O2) */
  key: string
  /** Fraction d'O2 */
  f: number
  /** Pression max (bar) : du compresseur, ou du tampon le plus rempli du groupe */
  pmax: number
  /** Volume total (L) ; null = source continue */
  vol: number | null
  /** ×N du premier lot lu (tous ensemble) */
  k?: number
  unit?: number
  /** Tampons du groupe, du moins rempli au plus rempli ; null = source continue */
  members: Member[] | null
}

/**
 * Lit la liste : valide, développe les ×N, regroupe les tampons d'un même % O2 en cascade
 * (du moins rempli au plus rempli) et numérote les noms en double.
 */
export function readGases(inputs: GasInput[]): BlendGas[] {
  type Raw = { label: GasLabel; f: number; pmax: number; vol: number | null; k?: number; unit?: number }
  const raw: Raw[] = []
  for (const g of inputs.filter(validGas)) {
    const label: GasLabel = { name: String(g.name).trim(), fPct: +g.f, times: 0, seq: 0 }
    const vol = +g.v > 0 ? +g.v : null
    const x: Raw = { label, f: +g.f / 100, pmax: +g.p, vol }
    const n = vol ? nTanks(g) : 1
    // Tous ensemble : les N bouteilles ouvertes en même temps = un seul tampon de N·V litres
    if (vol && n > 1 && g.c === false) raw.push({ ...x, label: { ...label, times: n }, vol: n * vol, k: n, unit: vol })
    else for (let i = 0; i < n; i++) raw.push({ ...x })
  }

  type Group = Omit<BlendGas, 'id' | 'key'>
  const out: Group[] = []
  const byF = new Map<number, Group & { members: Member[] }>()
  for (const g of raw) {
    if (!g.vol) {
      out.push({ ...g, members: null })
      continue
    }
    const k = Math.round(g.f * 1000)
    let grp = byF.get(k)
    if (!grp) {
      grp = { ...g, members: [] }
      byF.set(k, grp)
      out.push(grp)
    }
    grp.members.push({ label: g.label, pmax: g.pmax, vol: g.vol, k: g.k || 1, unit: g.unit || g.vol })
  }
  for (const g of byF.values()) {
    const m = g.members
    m.sort((a, b) => a.pmax - b.pmax)
    // Noms identiques : on les numérote pour les distinguer
    const cnt = new Map<string, number>()
    const seen = new Map<string, number>()
    for (const x of m) cnt.set(labelKey(x.label), (cnt.get(labelKey(x.label)) || 0) + 1)
    for (const x of m) {
      const key = labelKey(x.label)
      if ((cnt.get(key) || 0) > 1) {
        const seq = (seen.get(key) || 0) + 1
        seen.set(key, seq)
        x.label = { ...x.label, seq }
      }
    }
    g.pmax = Math.max(...m.map((x) => x.pmax))
    g.vol = m.reduce((a, x) => a + x.vol, 0)
    if (m.length > 1) g.label = { name: m[0].label.name, fPct: m[0].label.fPct, times: m.reduce((a, x) => a + x.k, 0), seq: 0 }
  }
  return out.map((g, id) => Object.assign(g, { id, key: labelKey(g.label) + '|' + g.f }) as BlendGas)
}

// ── Algo ───────────────────────────────────────────────────────────────────────
export type PairStep = { gas: BlendGas; bar: number }

/**
 * Résout une paire de gaz pour aller de (f1,p1) à (f2,p2).
 * Renvoie les quantités exactes (bar), ou null si une est négative.
 */
export function solvePair(a: BlendGas, b: BlendGas, f1: number, p1: number, f2: number, p2: number): PairStep[] | null {
  const dP = p2 - p1
  const dO2 = f2 * p2 - f1 * p1
  if (Math.abs(a.f - b.f) < 1e-9) return null
  const xa = (dO2 - b.f * dP) / (a.f - b.f)
  const xb = dP - xa
  if (xa < -EPS || xb < -EPS) return null
  return [{ gas: a, bar: Math.max(0, xa) }, { gas: b, bar: Math.max(0, xb) }].filter((s) => s.bar > EPS)
}

export type FillResult =
  | { ok: true; rests: number[] | null; used: number[]; lastRest: number | null }
  | { ok: false; limit: number; top: Member | null; topFrom: number }

/**
 * Monte le bloc (V litres) de « from » à « g » bar avec un gaz. Tampons : équilibrage successif
 * en cascade, du moins rempli au plus rempli. Compresseur : limité à sa pression max.
 */
export function fillGas(gas: BlendGas, pressures: number[] | null, V: number, from: number, g: number): FillResult {
  if (!gas.vol || !gas.members || !pressures) {
    return g > gas.pmax + EPS ? { ok: false, limit: gas.pmax, top: null, topFrom: from } : { ok: true, rests: null, used: [], lastRest: null }
  }
  const members = gas.members
  const rests = pressures.slice()
  const used: number[] = []
  let pp = from
  let top: Member | null = null
  let topFrom = from
  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    if (pp >= g - EPS || rests[i] <= pp + EPS) continue
    top = m
    topFrom = pp
    const to = Math.min(g, (m.vol * rests[i] + V * pp) / (m.vol + V))
    rests[i] -= (to - pp) * V / m.vol
    pp = to
    used.push(i)
  }
  if (pp < g - EPS) {
    return { ok: false, limit: pp, top: top ?? members[members.length - 1], topFrom }
  }
  return { ok: true, rests, used, lastRest: rests[used[used.length - 1]] }
}

/** Une étape « remplir jusqu'à » du plan. */
export type Step = {
  gas: BlendGas
  /** bar ajoutés */
  bar: number
  /** Pression manomètre visée (bar) */
  gauge: number
  /** Mélange du bloc après l'étape (fraction) */
  mix: number
  /** Pression restante dans le dernier tampon ouvert (bar) ; null = compresseur */
  rest: number | null
  /** Pression restante de chaque tampon du groupe (bar) ; null = compresseur */
  rests: number[] | null
  /** Index des tampons ouverts, dans l'ordre */
  used: number[]
}

/** Gaz qui empêche un plan : il faudrait monter à `need` bar, on plafonne à `limit`. */
export type Blocking = {
  gas: BlendGas
  need: number
  limit: number
  from: number
  /** Tampon de la cascade sur lequel on bute (null pour un compresseur) */
  top: Member | null
}

export type RunOk = { ok: true; steps: Step[]; p: number; mix: number }
export type RunFail = { ok: false; blocking: Blocking | null }

/** Exécute une suite de [gaz, pression manomètre visée] en tenant compte des tampons. */
export function run(f1: number, p0: number, V: number, targets: [BlendGas, number][]): RunOk | RunFail {
  let p = p0
  let o2 = f1 * p0
  const steps: Step[] = []
  for (const [gas, g] of targets) {
    if (g <= p + EPS) continue
    const r = fillGas(gas, gas.vol && gas.members ? gas.members.map((m) => m.pmax) : null, V, p, g)
    if (!r.ok) return { ok: false, blocking: { gas, need: g, limit: r.limit, from: r.top ? r.topFrom : p, top: r.top } }
    o2 += gas.f * (g - p)
    steps.push({ gas, bar: g - p, gauge: g, mix: o2 / g, rest: gas.vol ? r.lastRest : null, rests: r.rests, used: r.used })
    p = g
  }
  return { ok: true, steps, p, mix: p > 0 ? o2 / p : 0 }
}

/** Choisit l'arrondi à 10 bar de la pression intermédiaire qui donne le mélange le plus proche. */
export function plan(f1: number, p0: number, V: number, ord: PairStep[], f2: number, p2: number): RunOk | RunFail {
  let cands: [BlendGas, number][][]
  if (ord.length === 1) cands = [[[ord[0].gas, p2]]]
  else {
    const g = p0 + ord[0].bar
    cands = [...new Set([downS(g), upS(g)])].map((c) => [[ord[0].gas, Math.min(c, p2)], [ord[1].gas, p2]])
  }
  let best: RunOk | null = null
  let blocking: Blocking | null = null
  for (const c of cands) {
    const r = run(f1, p0, V, c)
    if (!r.ok) {
      blocking = blocking || r.blocking
      continue
    }
    if (!r.steps.length) continue
    // À écart égal, on garde le mélange le moins riche (profondeur max plus sûre)
    const d = Math.abs(r.mix - f2)
    const bd = best ? Math.abs(best.mix - f2) : Infinity
    if (d < bd - 1e-9 || (best && Math.abs(d - bd) <= 1e-9 && r.mix < best.mix)) best = r
  }
  return best || { ok: false, blocking }
}

/** Essaie les deux ordres (le plus riche d'abord par défaut). */
export function orderSteps(steps: PairStep[], f1: number, p0: number, V: number, f2: number, p2: number): RunOk | RunFail {
  const first = steps.slice().sort((s, t) => t.gas.f - s.gas.f)
  const orders = steps.length === 2 ? [first, first.slice().reverse()] : [first]
  let blocking: Blocking | null = null
  for (const ord of orders) {
    const r = plan(f1, p0, V, ord, f2, p2)
    if (r.ok) return r
    blocking = blocking || r.blocking
  }
  return { ok: false, blocking }
}

/**
 * Pression minimale du tampon pour amener le bloc de b.from à b.need par équilibrage
 * (en cascade : pression requise dans le dernier tampon utilisé).
 */
export function required(b: Blocking, V: number): number {
  const tVol = b.top ? b.top.vol : (b.gas.vol ?? NaN)
  return (b.need * (tVol + V) - V * b.from) / tVol
}

/** Combien de gonflages identiques le tampon peut encore faire après celui-ci (plafonné à 20). */
export function moreFills(st: Step, V: number): number {
  const from = st.gauge - st.bar
  let pr = (st.rests ?? []).slice()
  let k = 0
  while (k < 20) {
    const r = fillGas(st.gas, pr, V, from, st.gauge)
    if (!r.ok || !r.rests) break
    pr = r.rests
    k++
  }
  return k
}

/** État du stock d'un tampon après une étape : tight = « Juste », last = « Dernier gonflage », low = « Assez, stock bas ». */
export type StockLevel = 'tight' | 'last' | 'low' | 'ok'
export type StockState = { k: number; level: StockLevel; cls: 'ok' | 'mid' }

export function stockState(st: Step, V: number): StockState {
  const k = moreFills(st, V)
  const margin = (st.rest ?? NaN) - st.gauge
  if (margin < 10) return { k, level: 'tight', cls: 'mid' }
  if (k === 0) return { k, level: 'last', cls: 'mid' }
  if (k <= 2) return { k, level: 'low', cls: 'mid' }
  return { k, level: 'ok', cls: 'ok' }
}

/** Ce qui bloque, prêt à formater (blockingText de l'original). */
export type BlockingInfo =
  | { kind: 'buffer'; name: GasLabel; requiredBar: number; plural: boolean; hasBar: number }
  | { kind: 'continuous'; name: GasLabel; maxBar: number; needBar: number }

export function describeBlocking(b: Blocking, V: number): BlockingInfo {
  if (b.gas.vol) {
    const t = b.top || b.gas
    return {
      kind: 'buffer',
      name: b.top ? b.top.label : b.gas.label,
      requiredBar: upS(required(b, V)),
      plural: (t.k ?? 0) > 1,
      hasBar: t.pmax,
    }
  }
  return { kind: 'continuous', name: b.gas.label, maxBar: b.gas.pmax, needBar: b.need }
}

export type KoReason =
  | { kind: 'alreadyAbove' }
  | { kind: 'notRichEnough' }
  /** Il faudrait un gaz à `maxF` (fraction) ou moins */
  | { kind: 'tooRich'; maxF: number }
  | { kind: 'blocked'; info: BlockingInfo }
  | { kind: 'gapTooSmall' }

export type OkSolution = {
  ok: true
  /** Gaz du titre, dans l'ordre des étapes */
  gases: BlendGas[]
  steps: Step[]
  /** Pression finale (bar) */
  p: number
  /** Mélange final (fraction) */
  mix: number
  /** bar d'O2 pur ajoutés */
  o2: number
  /** Écart absolu avec la cible (fraction) */
  dev: number
}

export type KoSolution = {
  ok: false
  gases: BlendGas[]
  reason: KoReason
  blocking: Blocking | null
}

export type Solution = OkSolution | KoSolution

/** Toutes les combinaisons (1 ou 2 gaz) pour un résiduel donné, classées. */
export function solutions(gases: BlendGas[], V: number, f1: number, p1: number, f2: number, p2: number): Solution[] {
  const res: Solution[] = []
  const seen = new Set<string>()
  const pairs: [BlendGas, BlendGas][] = []
  for (let i = 0; i < gases.length; i++) for (let j = i + 1; j < gases.length; j++) pairs.push([gases[i], gases[j]])
  if (gases.length === 1) pairs.push([gases[0], { ...gases[0], f: -1 }]) // gaz seul : faux partenaire jamais retenu
  for (const [a, b] of pairs) {
    if (Math.abs(a.f - b.f) < 1e-9) continue
    const titleGases = b.f < 0 ? [a] : [a, b]
    const steps = solvePair(a, b, f1, p1, f2, p2)
    if (!steps || steps.some((s) => s.gas.f < 0)) {
      const real = [a, b].filter((g) => g.f >= 0)
      const hi = Math.max(...real.map((g) => g.f))
      let reason: KoReason
      if (p2 <= p1) reason = { kind: 'alreadyAbove' }
      else if ((f2 * p2 - f1 * p1) / (p2 - p1) > hi) reason = { kind: 'notRichEnough' }
      else reason = { kind: 'tooRich', maxF: Math.max(0, (f2 * p2 - f1 * p1) / (p2 - p1)) }
      res.push({ ok: false, gases: titleGases, reason, blocking: null })
      continue
    }
    if (!steps.length) continue
    const key = steps.map((s) => s.gas.key + s.gas.f).sort().join('|')
    if (seen.has(key)) continue
    seen.add(key)
    const r = orderSteps(steps, f1, p1, V, f2, p2)
    if (!r.ok) {
      res.push({
        ok: false,
        gases: steps.map((s) => s.gas),
        blocking: r.blocking,
        reason: r.blocking ? { kind: 'blocked', info: describeBlocking(r.blocking, V) } : { kind: 'gapTooSmall' },
      })
      continue
    }
    const o2 = r.steps.filter((s) => s.gas.f > 0.999).reduce((x, s) => x + s.bar, 0)
    res.push({ ok: true, gases: r.steps.map((s) => s.gas), steps: r.steps, p: r.p, mix: r.mix, o2, dev: Math.abs(r.mix - f2) })
  }
  // Chaque gaz seul (ajout validé par Maxime, absent de l'original) : avec 2 gaz ou plus, un gaz seul
  // n'apparaissait que s'il tombait pile sur la cible. On le propose aussi s'il arrive dans la
  // tolérance (TOL) : ex. compléter à l'air ou avec un tampon Nx32 sans manipuler d'O2 pur.
  if (gases.length > 1 && p2 > p1 + EPS) {
    for (const g of gases) {
      const key = g.key + g.f
      if (seen.has(key)) continue
      const r = run(f1, p1, V, [[g, p2]])
      if (!r.ok || !r.steps.length || Math.abs(r.mix - f2) > TOL + 1e-9) continue
      seen.add(key)
      const o2 = g.f > 0.999 ? r.steps[0].bar : 0
      res.push({ ok: true, gases: [g], steps: r.steps, p: r.p, mix: r.mix, o2, dev: Math.abs(r.mix - f2) })
    }
  }
  // Classement : possibles d'abord, dans la tolérance, sans O2 pur, moins d'O2 pur, plus proche de la cible
  const n = (b: boolean) => (b ? 1 : 0)
  res.sort((s, t) => (n(t.ok) - n(s.ok)) || (s.ok && t.ok
    ? (n(s.dev > TOL) - n(t.dev > TOL)) || (n(s.o2 > EPS) - n(t.o2 > EPS)) || (s.o2 - t.o2) || (s.dev - t.dev)
    : 0) || 0)
  return res
}

// ── Orchestration (render() de l'original, sans le HTML) ──────────────────────
export type InputError = 'incomplete' | 'range' | 'noGas'
export type PlanMode = 'direct' | 'bleed' | 'reduced'

/** Données d'un plan affiché (planHTML / altHTML). */
export type PlanView = {
  sol: OkSolution
  /** Pression de départ du dessin (bar) */
  p1: number
  /** Pression visée du dessin (bar) */
  p2: number
  /** Vidange préalable jusqu'à cette pression (bar), sinon null */
  bleed: number | null
  /** Dans la tolérance : « Plan recommandé », sinon « Meilleur plan possible » */
  good: boolean
}

export type MainView =
  | { kind: 'plan'; plan: PlanView }
  /** Cible impossible ; `best` = pression finale max atteignable au bon mélange */
  | { kind: 'impossible'; best: { pf: number; plan: PlanView } | null }

/** Cartes « En bref » (setSum de l'original). */
export type Summary = {
  /** Vidange : jusqu'à `to` bar, soit −`drop` bar ; `thenAdd` = des gaz sont ensuite ajoutés */
  bleed: { to: number; drop: number; thenAdd: boolean } | null
  /** Gaz à ajouter : plan retenu (dont O2 pur), ou total brut quand aucun plan n'est retenu */
  add: { kind: 'plan'; bar: number; o2Bar: number | null } | { kind: 'total'; bar: number } | null
  /** Pas de plan et bloc trop plein : bar à vider */
  drain: number | null
  /** Rampe : gaz à fournir en litres (arrondis à 10 L), total et par source */
  litres: { total: number; perGas: { gas: BlendGas; litres: number }[] } | null
  /** Profondeur max du mélange réellement attendu */
  mod: { f: number; mod14: number; mod16: number; expectedDiffers: boolean }
  /** Plus de 40 % d'O2 (cible ou attendu) */
  o2Alert: boolean
}

export type TileStatus =
  | 'unlimited' | 'enough' | 'tight' | 'last' | 'low'
  | 'enoughAfterBleed' | 'enoughFor' | 'notEnough' | 'unused'

/** Tuile « Tes stocks » (tilesHTML de l'original). */
export type Tile = {
  gas: BlendGas
  level: 'ok' | 'mid' | 'low' | 'off'
  status: TileStatus
  /** Mini-bloc : niveau avant (pâle) et après (plein) ; null = illimité (∞) */
  icon: { before: number | null; after: number | null }
  /** Gaz donné : +bar, jusqu'à gauge (tampon) ou max (compresseur) */
  gives: { bar: number; gauge: number | null; max: number | null } | null
  /** Tampons du groupe : pression avant → après */
  members: { member: Member; after: number }[] | null
  /** Tampons ouverts en cascade (si plus d'un) */
  cascade: Member[] | null
  /** Encore k gonflages identiques (null si sans objet) */
  again: number | null
  /** Ligne rouge : pression requise sans vidange / pour la pression d'origine */
  missing: { reduced: boolean; p2: number; req: number } | null
  /** Stock insuffisant : il en a `has`, il en faudrait `req` */
  shortage: { who: GasLabel; multi: boolean; has: number; req: number; limit: number; need: number } | null
}

export type ComputedOutcome = {
  status: 'computed'
  gases: BlendGas[]
  /** Volume du bloc ou de la rampe (L) */
  V: number
  f2: number
  p1: number
  p2: number
  mode: PlanMode
  /** Plan dans la tolérance trouvé sans vidange */
  direct: boolean
  chosen: OkSolution | null
  /** Pression finale effectivement visée (pression réduite en mode reduced) */
  pfin: number
  /** Pression du bloc au début du gonflage (après vidange éventuelle) */
  from: number
  main: MainView
  tiles: Tile[]
  alts: OkSolution[]
  rejected: KoSolution[]
  summary: Summary
  /** Gaz ignorés (champ invalide) */
  ignored: number
}

export type BlendOutcome =
  | { status: 'error'; errors: InputError[] }
  | { status: 'nothing'; summary: Summary }
  | ComputedOutcome

function summarize(
  fm: number, c: OkSolution | null, from: number | null,
  ctx: { p1: number; f2: number; dP: number; nb: number; V: number },
): Summary {
  const { p1, f2, dP, nb, V } = ctx
  const L = (b: number) => Math.round(b * V / 10) * 10
  let add: Summary['add'] = null
  let drain: number | null = null
  let litres: Summary['litres'] = null
  if (c) {
    if (c.steps.length && from !== null) {
      add = { kind: 'plan', bar: c.p - from, o2Bar: c.o2 > EPS ? c.o2 : null }
      if (nb > 1) {
        // Rampe : gaz total à fournir par source, en litres détendus (bar × volume de la rampe)
        const by: { g: BlendGas; bar: number }[] = []
        for (const st of c.steps) {
          const x = by.find((y) => y.g === st.gas)
          if (x) x.bar += st.bar
          else by.push({ g: st.gas, bar: st.bar })
        }
        litres = { total: L(c.p - from), perGas: by.map((x) => ({ gas: x.g, litres: L(x.bar) })) }
      }
    }
  } else if (dP > EPS) add = { kind: 'total', bar: dP }
  else if (dP < -EPS) drain = -dP
  return {
    bleed: from !== null && from < p1 - EPS ? { to: from, drop: p1 - from, thenAdd: !!c && c.steps.length > 0 } : null,
    add,
    drain,
    litres,
    mod: { f: fm, mod14: mod(fm, 1.4), mod16: mod(fm, 1.6), expectedDiffers: Math.abs(fm - f2) > 0.0005 },
    o2Alert: Math.max(f2, fm) > 0.40 + 1e-9,
  }
}

/** Une tuile par gaz disponible : est-ce qu'il y en a assez pour ce gonflage ? */
export function buildTiles(
  gases: BlendGas[], chosen: OkSolution | null, direct: boolean, issues: KoSolution[],
  V: number, mode: PlanMode, pf: number, p2: number,
): Tile[] {
  return gases.map((g): Tile => {
    const st = chosen ? chosen.steps.find((x) => x.gas === g) : undefined
    const bl = issues.find((x) => x.blocking?.gas === g)?.blocking ?? null
    const req = bl ? upS(required(bl, V)) : NaN
    const base: Tile = {
      gas: g, level: 'off', status: 'unused',
      icon: g.vol ? { before: g.pmax, after: g.pmax } : { before: null, after: null },
      gives: null, members: null, cascade: null, again: null, missing: null, shortage: null,
    }
    if (st && !g.vol) {
      return { ...base, level: 'ok', status: 'unlimited', gives: { bar: st.bar, gauge: null, max: g.pmax } }
    }
    if (st && g.members && st.rests) {
      const s8 = stockState(st, V)
      const rests = st.rests
      const status: TileStatus = bl && mode === 'bleed' ? 'enoughAfterBleed'
        : bl && mode === 'reduced' ? 'enoughFor'
        : s8.level === 'ok' ? 'enough' : s8.level // level 'ok' ⇔ cls 'ok'
      const ti = g.members.length - 1
      return {
        ...base,
        level: bl && !direct ? 'mid' : s8.cls,
        status,
        icon: { before: g.members[ti].pmax, after: rests[ti] },
        gives: { bar: st.bar, gauge: st.gauge, max: null },
        members: g.members.map((member, i) => ({ member, after: rests[i] })),
        cascade: st.used.length > 1 ? st.used.map((i) => g.members![i]) : null,
        again: s8.k,
        missing: bl && !direct ? { reduced: mode === 'reduced', p2, req } : null,
      }
    }
    if (bl && (!direct || !chosen)) {
      const who = bl.top || g
      return {
        ...base,
        level: 'low',
        status: 'notEnough',
        shortage: { who: who.label, multi: (g.members?.length ?? 0) > 1, has: who.pmax, req, limit: bl.limit, need: bl.need },
      }
    }
    return base
  })
}

/** Calcul complet à partir de l'état de l'outil. */
export function computeBlend(s: BlendState): BlendOutcome {
  const nb = rampCount(s.nb)
  const V = s.vol * nb
  const f1 = s.f1 / 100
  const p1 = +s.p1
  const f2 = s.f2 / 100
  const p2 = +s.p2
  const gases = readGases(s.gases)
  const errors: InputError[] = []
  if (![V, f1, p1, f2, p2].every(Number.isFinite) || !(V > 0)) errors.push('incomplete')
  if ([f1, f2, ...gases.map((g) => g.f)].some((x) => x < 0 || x > 1)) errors.push('range')
  if (gases.length === 0) errors.push('noGas')
  if (errors.length) return { status: 'error', errors }

  const dP = p2 - p1
  const dO2 = f2 * p2 - f1 * p1
  const ctx = { p1, f2, dP, nb, V }
  if (Math.abs(dP) <= EPS && Math.abs(dO2) <= EPS) return { status: 'nothing', summary: summarize(f2, null, null, ctx) }

  const tooFull = p1 > p2 + EPS && Math.abs(f1 - f2) <= TOL
  const sols = tooFull ? [] : solutions(gases, V, f1, p1, f2, p2)
  const ok = sols.filter((x): x is OkSolution => x.ok)
  const ko = sols.filter((x): x is KoSolution => !x.ok)
  const alts = ok.slice()
  let chosen: OkSolution | null = null
  let direct = false
  let mode: PlanMode = 'direct'
  let pfin = p2
  let from = p1
  let main: MainView
  const view = (sol: OkSolution, vp2: number, bleed: number | null): PlanView => ({ sol, p1, p2: vp2, bleed, good: sol.dev <= TOL })

  if (tooFull) {
    // Déjà au bon mélange mais trop plein : il suffit de vider jusqu'à la pression voulue
    chosen = { ok: true, gases: [], steps: [], p: p2, mix: f1, o2: 0, dev: Math.abs(f1 - f2) }
    mode = 'bleed'
    from = p2
    main = { kind: 'plan', plan: view(chosen, p2, p2) }
  } else if (ok.length && ok[0].dev <= TOL) {
    chosen = alts.shift() ?? null
    direct = true
    main = { kind: 'plan', plan: view(ok[0], p2, null) }
  } else {
    // Vidange : plus haute pression résiduelle (pas de 10 bar) qui rend une solution possible
    let found: { s: OkSolution; pd: number } | null = null
    for (let pd = downS(Math.min(p1, p2)); pd >= 0 && !found; pd -= STEP) {
      if (pd >= p1 - EPS) continue
      const x = solutions(gases, V, f1, pd, f2, p2).find((y): y is OkSolution => y.ok && y.dev <= TOL)
      if (x) found = { s: x, pd }
    }
    if (found) {
      chosen = found.s
      mode = 'bleed'
      from = found.pd
      main = { kind: 'plan', plan: view(found.s, p2, found.pd) }
    } else if (ok.length) {
      chosen = alts.shift() ?? null
      main = { kind: 'plan', plan: view(ok[0], p2, null) }
    } else {
      // Repli : plus haute pression finale atteignable au bon mélange avec les stocks actuels
      let best: { s: OkSolution; pf: number } | null = null
      for (let pf = downS(p2 - EPS); pf > p1 + EPS && !best; pf -= STEP) {
        const x = solutions(gases, V, f1, p1, f2, pf).find((y): y is OkSolution => y.ok && y.dev <= TOL)
        if (x) best = { s: x, pf }
      }
      main = { kind: 'impossible', best: best ? { pf: best.pf, plan: view(best.s, best.pf, null) } : null }
      if (best) {
        chosen = best.s
        mode = 'reduced'
        pfin = best.pf
      }
    }
  }
  const issues = ko.filter((x) => x.blocking && x.blocking.gas.vol)
  return {
    status: 'computed',
    gases, V, f2, p1, p2, mode, direct, chosen, pfin, from, main,
    tiles: buildTiles(gases, chosen, direct, issues, V, mode, pfin, p2),
    alts,
    rejected: ko,
    summary: chosen ? summarize(chosen.mix, chosen, from, ctx) : summarize(f2, null, null, ctx),
    ignored: s.gases.filter((g) => !validGas(g)).length,
  }
}

// ── Analyse finale ─────────────────────────────────────────────────────────────
/** Le % analysé repart du % attendu dès que le gonflage demandé change (clé de l'original). */
export function analysisKey(s: BlendState): string {
  return [s.vol, s.nb, s.p1, s.f1, s.f2, s.p2].join('|')
}

/** % O2 attendu proposé par défaut dans le champ d'analyse (au dixième). */
export function expectedAnalysisPct(chosen: OkSolution): number {
  return Math.round(chosen.mix * 1000) / 10
}

export type AnalysisResult =
  | { valid: false }
  | {
    valid: true
    /** % analysé (fraction) */
    fa: number
    /** Écart avec la cible (fraction, signé) */
    d: number
    /** ok : ±1 point · mid : ±2 points · low : au-delà */
    level: 'ok' | 'mid' | 'low'
    mod14: number
    mod16: number
    /** Plan de correction (vider jusqu'à pd puis recompléter) ; null = impossible ; undefined si conforme */
    fix?: { pd: number; sol: OkSolution } | null
  }

export function analyse(gases: BlendGas[], V: number, f2: number, pf: number, anaPct: number): AnalysisResult {
  const fa = anaPct / 100
  const d = fa - f2
  if (!(fa >= 0.21 && fa <= 1)) return { valid: false }
  const level = Math.abs(d) <= 0.01 + 1e-9 ? 'ok' : Math.abs(d) <= TOL + 1e-9 ? 'mid' : 'low'
  const out: AnalysisResult = { valid: true, fa, d, level, mod14: mod(fa, 1.4), mod16: mod(fa, 1.6) }
  if (level !== 'ok') {
    // Correction : vider le moins possible puis recompléter avec les gaz dispo pour revenir à ±1 point
    let fix: { pd: number; sol: OkSolution } | null = null
    for (let pd = downS(pf - EPS); pd >= 0 && !fix; pd -= STEP) {
      const x = solutions(gases, V, fa, pd, f2, pf).find((y): y is OkSolution => y.ok && y.dev <= 0.01 + 1e-9)
      if (x) fix = { pd, sol: x }
    }
    out.fix = fix
  }
  return out
}

// ── État mémorisé ──────────────────────────────────────────────────────────────
function numOrEmpty(v: unknown): NumOrEmpty {
  if (typeof v === 'number') return Number.isFinite(v) ? v : ''
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(+v)) return +v
  return ''
}

/**
 * Valide un état lu dans le localStorage. L'original reprenait l'objet tel quel dès que `gases`
 * était un tableau ; ici une valeur de mauvais type est remplacée par la valeur par défaut,
 * pour qu'une donnée corrompue ne puisse pas casser l'outil. null = rien d'exploitable.
 */
export function sanitizeState(raw: unknown, fallback: BlendState): BlendState | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.gases)) return null
  const num = (k: 'vol' | 'nb' | 'p1' | 'f1' | 'f2' | 'p2') => {
    const v = r[k]
    return typeof v === 'number' && Number.isFinite(v) ? v : fallback[k]
  }
  const gases: GasInput[] = r.gases
    .filter((g): g is Record<string, unknown> => !!g && typeof g === 'object')
    .map((g) => {
      const out: GasInput = {
        name: typeof g.name === 'string' ? g.name : typeof g.name === 'number' ? String(g.name) : '',
        f: numOrEmpty(g.f),
        p: numOrEmpty(g.p),
        v: numOrEmpty(g.v),
      }
      if ('n' in g) out.n = numOrEmpty(g.n)
      if (typeof g.c === 'boolean') out.c = g.c
      return out
    })
  const state: BlendState = { vol: num('vol'), nb: num('nb'), p1: num('p1'), f1: num('f1'), f2: num('f2'), p2: num('p2'), gases }
  if (!(state.nb >= 1)) state.nb = 1
  if (typeof r.ana === 'number' && Number.isFinite(r.ana)) state.ana = r.ana
  if (typeof r.anaKey === 'string') state.anaKey = r.anaKey
  return state
}

export function sanitizeTab(raw: unknown): TabId {
  return typeof raw === 'string' && (TAB_IDS as readonly string[]).includes(raw) ? (raw as TabId) : 'melange'
}
