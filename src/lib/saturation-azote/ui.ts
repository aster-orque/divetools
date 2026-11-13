/**
 * Saturation en azote : interface (graphiques SVG animés, réglages, vues Découverte / Simple / Détaillé).
 * Portée du script d'interface du modèle `saturation-azote.html`. Le dessin reste impératif (SVG en
 * chaînes, requestAnimationFrame) : c'est le plus fluide pour une animation à 60 images/s.
 * Les règles pédagogiques (vue Découverte, repère 12 m, seuils de vitesse de charge) sont celles du
 * modèle, sans changement. Seuls les textes viennent du dictionnaire (FR / EN).
 */
import * as E from './engine'
import type { Gas, Sim, State } from './engine'
import type fr from '@/i18n/dictionaries/fr'

export type UILabels = typeof fr.saturation.ui

type Mode = 'peda' | 'simple' | 'adv'
type St = {
  mode: Mode; depth: number; time: number; stops: { depth: number; time: number }[]
  bg: number; bgCustom: boolean; dc: string; dcO2: number; sw: number; ppB: number; ppD: number
  asc: number; sp: number; surf: number; speed: number; sel: number; t: number
}
type Host = HTMLElement & { _key?: string; _w?: number; _static?: string; _show?: () => void }
type Ext = { maxPi: number; maxPt: number; maxMean: number; maxRef: number; maxRatio: number; maxGroup: number; maxPeda: number }
type SimX = Sim & { t12: number | null }
type Cmp = { charge?: number; fondN?: number; fondA?: number; outN: number; outA: number; excess: number; lead: number | null; endN: number; endA: number }

export const STORAGE_KEY = 'saturation-azote-v3'
const DEF: St = { mode: 'simple', depth: 40, time: 20, stops: [{ depth: 3, time: 5 }], bg: 21, bgCustom: false, dc: 'none', dcO2: 50, sw: 6, ppB: 1.4, ppD: 1.6, asc: 10, sp: 1.0, surf: 30, speed: 2, sel: 4, t: 0 }

/** Remplace {clé} par sa valeur. */
const tpl = (s: string, v: Record<string, string | number> = {}) => s.replace(/\{(\w+)\}/g, (a, k: string) => (k in v ? String(v[k]) : a))

export function mountSaturation(root: HTMLElement, L: UILabels, locale: string): () => void {
  const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = root) => r.querySelector(s) as T
  const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = root) => [...r.querySelectorAll(s)] as T[]
  const rootStyle = getComputedStyle(root)
  const css = (v: string) => rootStyle.getPropertyValue(v).trim()
  const nf = locale === 'en' ? 'en-US' : 'fr-FR'
  const fmt = (n: number, d = 0) => (isFinite(n) ? n : 0).toLocaleString(nf, { maximumFractionDigits: d, minimumFractionDigits: d })
  const fmtS = (n: number, d = 2) => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n), d)
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
  const fmtT = (m: number) => { const r = Math.floor(m + 1e-6); return r >= 60 ? tpl(L.hm, { h: Math.floor(r / 60), m: String(r % 60).padStart(2, '0') }) : tpl(L.minutes, { m: r }) }
  const esc = (s: string | number) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
  const gasName = (g: Gas) => {
    const o = Math.round(g.o2 * 100)
    if (o === 21) return L.gasAir
    if (o === 100) return L.gasO2
    return tpl(L.gasNitrox, { o })
  }

  /** Les quantités sont affichées en « × la surface » : 1× = azote respiré en surface à l'air. */
  const surfEq = () => E.piN2(S.sp, E.AIR)
  const xf = (v: number) => v / surfEq()
  const fx = (v: number) => '×' + fmt(xf(v), 1)
  const fois = (v: number) => tpl(L.times, { n: fmt(xf(v), 1) })
  const GROUPS = [
    { name: L.groups[0], lower: L.groupsLower[0], a: 0, b: 5, c: '--fast' },
    { name: L.groups[1], lower: L.groupsLower[1], a: 5, b: 10, c: '--mid' },
    { name: L.groups[2], lower: L.groupsLower[2], a: 10, b: 16, c: '--slow' },
  ]
  type G = (typeof GROUPS)[number]
  const groupMean = (st: State, g: G) => st.comp.slice(g.a, g.b).reduce((s, c) => s + c.pN2, 0) / (g.b - g.a)
  // Vue simple : le « corps » est représenté par un seul tissu de référence (compartiment 3,
  // demi-vie 12,5 min), assez rapide pour qu'on voie la charge à l'échelle d'une plongée.
  // Vue détaillée : moyenne des 16 compartiments.
  const REF = 2
  const body = (st: State) => (S.mode === 'peda' ? pedaAt(st.t) * surfEq() : S.mode === 'simple' ? st.comp[REF].pN2 : st.meanN2)
  const bodyMax = () => (S.mode === 'peda' ? ext.maxPeda * surfEq() : S.mode === 'simple' ? ext.maxRef : ext.maxMean)
  const isPeda = () => S.mode === 'peda'

  // ── Vue découverte : règle pédagogique ────────────────────────────────────
  // Pas de calcul de tissus. Unité : 1 = azote de l'air respiré en surface (un « + »).
  // Au fond, le corps s'approche de l'eau selon 1 − (1 − u)^k (u = part du temps au fond écoulée),
  // k grandit avec la profondeur : plus c'est profond, plus on approche vite de l'équilibre ; à la fin
  // du temps au fond on y est presque (95 %), quels que soient le temps et la profondeur.
  // Remontée sous 12 m : on garde sa charge. Au-dessus de 12 m : on rend. En surface : lentement.
  let pedaT: number[] = [], pedaB: number[] = [], pedaP: number[] = []
  function computePeda() {
    pedaT = []; pedaB = []; pedaP = []
    const ambX = (st: State) => (st.phase === 'surface' ? 1 : xf(st.piN2))
    const fond = sim.segments.find((sg) => sg.phase === 'fond')
    const tb0 = fond ? fond.t0 : 0, tb1 = fond ? fond.t1 : 0
    const D = fond ? fond.d0 : sim.maxDepth, k = Math.max(1, D / 12)
    const aB = xf(E.piN2(E.pAmb(D, S.sp), fond ? fond.gas : bottomGas()))
    const dt = Math.max(0.05, sim.tEnd / 4000)
    let B = 1, Bd = 1, P = 0
    for (let t = 0; t <= sim.tEnd + dt / 2; t += dt) {
      const tt = Math.min(t, sim.tEnd), st = E.stateAt(sim, tt)
      if (tt <= tb0) { B = 1 + (aB - 1) * 0.08 * (tb0 > 0 ? tt / tb0 : 1); Bd = B }
      else if (tt <= tb1) { const u = (tt - tb0) / Math.max(1e-6, tb1 - tb0); P = 1 - Math.pow(1 - u, k); B = Bd + (aB * 0.95 - Bd) * P }
      else if (st.phase === 'surface') B -= 0.08 * (B - 1) * dt
      else if (st.depth <= 12 || sim.maxDepth <= 12) { const a = ambX(st); if (B > a) B -= 0.25 * (B - a) * dt }
      pedaT.push(tt); pedaB.push(B); pedaP.push(P)
    }
    ext.maxPeda = Math.max(...pedaB)
  }
  const pedaProg = (t: number) => (pedaT.length ? pedaP[clamp(Math.round(t / (pedaT[1] - pedaT[0] || 1)), 0, pedaP.length - 1)] : 0)
  function pedaAt(t: number) {
    if (!pedaT.length) return 1
    const dt = pedaT[1] - pedaT[0] || 1, i = clamp(Math.floor(t / dt), 0, pedaT.length - 2), f = clamp((t - pedaT[i]) / dt, 0, 1)
    return pedaB[i] + (pedaB[i + 1] - pedaB[i]) * f
  }
  const gap = (st: State, v = body(st)) => (st.phase === 'surface' ? surfEq() : st.piN2) - v

  // ── État ───────────────────────────────────────────────────────────────────
  const S: St = JSON.parse(JSON.stringify(DEF))
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (s && typeof s === 'object') {
      for (const k of Object.keys(DEF) as (keyof St)[]) {
        const v = s[k]
        if (k === 'stops') { if (Array.isArray(v)) S.stops = v.filter((x) => x && isFinite(x.depth) && isFinite(x.time)).map((x) => ({ depth: clamp(+x.depth, 1, 30), time: clamp(+x.time, 1, 60) })) }
        else if (k === 'mode') { if (v === 'peda' || v === 'simple' || v === 'adv') S.mode = v }
        else if (k === 'dc') { if (['none', '50', '80', '100', 'custom'].includes(v)) S.dc = v }
        else if (k === 'bgCustom') S.bgCustom = v === true
        else if (typeof v === 'number' && isFinite(v)) (S as Record<string, unknown>)[k] = v
      }
    }
  } catch { /* stockage indisponible */ }
  // Bornes des réglages (mêmes que les steppers du modèle).
  S.depth = clamp(Math.round(S.depth), 5, 60); S.time = clamp(S.time, 1, 180); S.bg = clamp(S.bg, 21, 100); S.dcO2 = clamp(S.dcO2, 22, 100)
  S.sw = clamp(S.sw, 3, 30); S.ppB = clamp(S.ppB, 1.2, 1.6); S.ppD = clamp(S.ppD, 1.2, 1.6); S.asc = clamp(S.asc, 3, 18)
  S.sp = clamp(S.sp, 0.7, 1.1); S.surf = clamp(S.surf, 0, 720); S.sel = clamp(Math.round(S.sel), 0, 15)
  if (![1, 2, 5].includes(S.speed)) S.speed = 2
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)) } catch { /* ignoré */ } }

  let sim!: SimX, samples!: State[], ext!: Ext, cur!: State
  const bottomGas = () => E.gas(S.bg / 100)
  const decoGas = () => (S.dc === 'none' ? null : E.gas((S.dc === 'custom' ? S.dcO2 : +S.dc) / 100))
  const autoSw = () => { const g = decoGas(); if (g) S.sw = clamp(Math.floor(E.modOf(g, S.ppD, S.sp) / 3) * 3 || 3, 3, 30) }
  const gasColor = (g: Gas | null) => (!g ? css('--air') : g.o2 >= 0.99 ? css('--o2') : Math.abs(g.o2 - 0.21) < 0.005 ? css('--air') : sim && g === sim.cfg.decoGas ? css('--nxd') : css('--nx'))
  const grpColor = (i: number) => css(i < 5 ? '--fast' : i < 10 ? '--mid' : '--slow')

  // Écouteurs à retirer au démontage.
  const offs: (() => void)[] = []
  const on = <K extends keyof HTMLElementEventMap>(el: EventTarget, ev: K, fn: (e: HTMLElementEventMap[K]) => void) => {
    el.addEventListener(ev, fn as EventListener)
    offs.push(() => el.removeEventListener(ev, fn as EventListener))
  }

  // ── Steppers ─────────────────────────────────────────────────────────────
  type StepOpts = { get: () => number; set: (v: number) => void; step: number; min: number; max: number; unit?: string; dec?: number; label?: string }
  const allSteppers: Host[] = []
  const timers = new Set<ReturnType<typeof setTimeout>>()
  function stepper(host: Host, o: StepOpts) {
    host.innerHTML = `<div class="stp"><button type="button" aria-label="${esc(L.minus)}">−</button><label><input inputmode="decimal" aria-label="${esc(o.label || '')}"><small>${o.unit || ''}</small></label><button type="button" aria-label="${esc(L.plus)}">+</button></div>`
    const [mi, pl] = $$<HTMLButtonElement>('button', host), inp = $<HTMLInputElement>('input', host)
    const show = () => { if (document.activeElement !== inp) inp.value = fmt(o.get(), o.dec || 0) }
    const set = (v: number) => { o.set(clamp(Math.round(v / o.step) * o.step, o.min, o.max)); changed() }
    ;([[mi, -1], [pl, 1]] as const).forEach(([b, dir]) => {
      let t: ReturnType<typeof setTimeout> | undefined, iv: ReturnType<typeof setInterval> | undefined
      const stop = () => { if (t) { clearTimeout(t); timers.delete(t) } if (iv) { clearInterval(iv); timers.delete(iv) } }
      const bump = () => set(o.get() + dir * o.step)
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); bump(); t = setTimeout(() => { iv = setInterval(bump, 80); timers.add(iv) }, 420); timers.add(t) })
      ;(['pointerup', 'pointerleave', 'pointercancel'] as const).forEach((ev) => b.addEventListener(ev, stop))
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bump() } })
    })
    inp.addEventListener('change', () => { const v = parseFloat(inp.value.replace(',', '.')); if (isFinite(v)) set(v); else show() })
    inp.addEventListener('focus', () => inp.select())
    inp.addEventListener('blur', show)
    host._show = show; show(); allSteppers.push(host)
    return host
  }
  stepper($('#sa-stpTime'), { get: () => S.time, set: (v) => (S.time = v), step: 1, min: 1, max: 180, unit: 'min', label: L.time })
  stepper($('#sa-stpSw'), { get: () => S.sw, set: (v) => (S.sw = v), step: 1, min: 3, max: 30, unit: 'm', label: L.switchAt })
  stepper($('#sa-stpSurf'), { get: () => S.surf, set: (v) => (S.surf = v), step: 15, min: 0, max: 720, unit: 'min', label: L.surf })
  stepper($('#sa-stpAsc'), { get: () => S.asc, set: (v) => (S.asc = v), step: 1, min: 3, max: 18, unit: 'm/min', label: L.asc })
  stepper($('#sa-stpPpB'), { get: () => S.ppB, set: (v) => (S.ppB = v), step: 0.1, dec: 1, min: 1.2, max: 1.6, unit: 'bar', label: L.ppBottom })
  stepper($('#sa-stpPpD'), { get: () => S.ppD, set: (v) => (S.ppD = v), step: 0.1, dec: 1, min: 1.2, max: 1.6, unit: 'bar', label: L.ppDeco })
  stepper($('#sa-stpSp'), { get: () => S.sp, set: (v) => (S.sp = v), step: 0.01, dec: 2, min: 0.7, max: 1.1, unit: 'bar', label: L.sp })

  on($('#sa-rDepth'), 'input', (e) => { S.depth = +(e.target as HTMLInputElement).value; changed() })

  function renderStops() {
    const box = $('#sa-stops')
    box.innerHTML = S.stops.length ? '' : `<span class="why">${esc(L.noStops)}</span>`
    S.stops.forEach((st, i) => {
      const r = document.createElement('div')
      r.className = 'stopr'
      r.innerHTML = `<b>${esc(tpl(L.stopN, { n: i + 1 }))}</b><span class="d"></span><span class="t"></span><button class="x" type="button" aria-label="${esc(L.remove)}">✕</button>`
      box.appendChild(r)
      stepper($('.d', r), { get: () => st.depth, set: (v) => (st.depth = v), step: 1, min: 1, max: 30, unit: 'm', label: L.stopDepth })
      stepper($('.t', r), { get: () => st.time, set: (v) => (st.time = v), step: 1, min: 1, max: 60, unit: 'min', label: L.stopTime })
      $('.x', r).addEventListener('click', () => { S.stops.splice(i, 1); renderStops(); changed() })
    })
  }
  on($('#sa-addStop'), 'click', () => {
    const deepest = S.stops.length ? Math.max(...S.stops.map((s) => s.depth)) : 0
    S.stops.push({ depth: Math.min(30, deepest + 3), time: 3 })
    S.stops.sort((a, b) => b.depth - a.depth)
    renderStops(); changed()
  })

  $('#sa-bgPills').innerHTML = [21, 32, 36, 40].map((v) => `<button class="pill" type="button" data-v="${v}">${v === 21 ? esc(L.gasAir) : esc(tpl(L.gasNitrox, { o: v }))}</button>`).join('') + `<button class="pill" type="button" data-v="custom">${esc(L.custom)}</button>`
  on($('#sa-bgPills'), 'click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-v]'); if (!b) return
    if (b.dataset.v === 'custom') { S.bgCustom = true; if (S.bg <= 21) S.bg = 28 } else { S.bgCustom = false; S.bg = +b.dataset.v! }
    changed()
  })
  stepper($('#sa-stpBgO2'), { get: () => S.bg, set: (v) => (S.bg = v), step: 1, min: 21, max: 100, unit: '%', label: L.bgO2Aria })
  stepper($('#sa-stpDcO2'), { get: () => S.dcO2, set: (v) => { S.dcO2 = v; autoSw() }, step: 1, min: 22, max: 100, unit: '%', label: L.dcO2Aria })
  $('#sa-dcPills').innerHTML = ([['none', L.decoSame], ['50', tpl(L.gasNitrox, { o: 50 })], ['80', tpl(L.gasNitrox, { o: 80 })], ['100', L.gasO2], ['custom', L.custom]] as const)
    .map(([v, n]) => `<button class="pill" type="button" data-v="${v}">${esc(n)}</button>`).join('')
  on($('#sa-dcPills'), 'click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-v]'); if (!b) return
    S.dc = b.dataset.v!
    autoSw()
    changed()
  })
  on($('#sa-modeSeg'), 'click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-mode]'); if (b) { S.mode = b.dataset.mode as Mode; changed() } })
  on($('#sa-speedSeg'), 'click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-v]'); if (b) { S.speed = +b.dataset.v!; syncUI(); save() } })

  // ── Simulation ───────────────────────────────────────────────────────────
  function compute() {
    // Vue découverte : plongée à l'air, sans gaz de palier ; un arrêt fixe au-dessus de 12 m
    // (6 m, 8 min) pour voir le corps se vider.
    const peda = isPeda()
    const stops = peda ? (S.depth > 8 ? [{ depth: 6, time: 8 }] : [])
      : S.stops.filter((s) => s.depth < S.depth).sort((a, b) => b.depth - a.depth)
    sim = E.simulate({
      levels: [{ depth: S.depth, time: S.time }, ...stops.map((s) => ({ depth: s.depth, time: s.time }))],
      descentRate: 20, ascentRate: peda ? 10 : S.asc,
      bottomGas: peda ? E.AIR : bottomGas(), decoGas: peda ? null : decoGas(), switchDepth: S.sw,
      surfaceP: S.sp, surfaceTime: S.surf,
    }) as SimX
    samples = E.sample(sim, Math.min(900, Math.max(300, Math.round(sim.tEnd * 4))))
    sim.segments.forEach((s) => { samples.push(E.stateAt(sim, s.t0 + 1e-7), E.stateAt(sim, s.t1 - 1e-7)) })
    samples.sort((a, b) => a.t - b.t)
    ext = { maxPi: 0, maxPt: 0, maxMean: 0, maxRef: 0, maxRatio: 0, maxGroup: 0, maxPeda: 0 }
    for (const st of samples) {
      ext.maxPi = Math.max(ext.maxPi, st.piN2)
      ext.maxMean = Math.max(ext.maxMean, st.meanN2)
      ext.maxRef = Math.max(ext.maxRef, st.comp[REF].pN2)
      GROUPS.forEach((g) => (ext.maxGroup = Math.max(ext.maxGroup, groupMean(st, g))))
      for (const c of st.comp) { ext.maxPt = Math.max(ext.maxPt, c.pN2); ext.maxRatio = Math.max(ext.maxRatio, c.ratio) }
    }
    // Dernier passage à 12 m en remontant (repère pédagogique de la vue simple).
    sim.t12 = null
    for (const sg of sim.segments) {
      if (sg.phase === 'surface') break
      if (sg.d0 > 12 && sg.d1 <= 12) sim.t12 = sg.t0 + ((sg.d0 - 12) / (sg.d0 - sg.d1)) * (sg.t1 - sg.t0)
      else if (sg.d1 > 12) sim.t12 = null
    }
    computeAir()
    computePeda()
    S.t = clamp(S.t, 0, sim.tEnd)
  }

  // ── Comparaison nitrox / air ───────────────────────────────────────────────
  // Même plongée (mêmes niveaux, vitesses, gaz de déco), seul le gaz du fond change : de l'air.
  let simAir: Sim | null = null, samplesAir: State[] | null = null, cmp: Cmp | null = null
  function computeAir() {
    simAir = null; samplesAir = null; cmp = null
    if (S.bg <= 21 || isPeda()) return
    const sAir = E.simulate(Object.assign({}, sim.cfg, { bottomGas: E.AIR }))
    simAir = sAir
    samplesAir = samples.map((st) => E.stateAt(sAir, st.t))
    const at = (sm: Sim, t: number) => body(E.stateAt(sm, t))
    const fond = sim.segments.find((sg) => sg.phase === 'fond')
    const eq = surfEq()
    const ts = sim.tSurface
    const c: Cmp = { outN: at(sim, ts), outA: at(sAir, ts), excess: 0, lead: null, endN: 0, endA: 0 }
    if (fond && fond.t1 > fond.t0) {
      const rN = (at(sim, fond.t1) - at(sim, fond.t0)) / (fond.t1 - fond.t0)
      const rA = (at(sAir, fond.t1) - at(sAir, fond.t0)) / (fond.t1 - fond.t0)
      c.charge = rA > 1e-6 ? 1 - rN / rA : 0
      c.fondN = at(sim, fond.t1); c.fondA = at(sAir, fond.t1)
    }
    c.excess = c.outA - eq > 1e-6 ? 1 - (c.outN - eq) / (c.outA - eq) : 0
    // Décharge : combien de minutes de surface il faut au corps « à l'air » pour redescendre au
    // niveau où sort le corps « au nitrox ».
    const long = E.simulate(Object.assign({}, sim.cfg, { bottomGas: E.AIR, surfaceTime: 24 * 60 }))
    if (c.outA - c.outN > 1e-4) {
      let lo = 0, hi = 24 * 60
      if (at(long, ts + hi) <= c.outN) {
        for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (at(long, ts + m) > c.outN) lo = m; else hi = m }
        c.lead = hi
      }
    }
    c.endN = at(sim, sim.tEnd); c.endA = at(sAir, sim.tEnd)
    cmp = c
  }
  const pct = (r: number) => fmt(Math.abs(r) * 100, 0) + ' %'
  function renderCmp() {
    const box = $('#sa-cmpAir')
    box.hidden = !cmp || isPeda()
    if (!cmp || isPeda() || !simAir || !samplesAir) return
    const sA = samplesAir
    const name = gasName(sim.cfg.bottomGas), aN = body(cur), aA = body(E.stateAt(simAir, cur.t))
    $('#sa-cmpTitle').textContent = tpl(L.cmpTitle, { gas: name })
    const d = aA - surfEq() > 0.005 ? 1 - (aN - surfEq()) / (aA - surfEq()) : 0
    $('#sa-cmpVals').innerHTML = `<span><i style="--c:${css('--n2')}"></i>${esc(tpl(L.cmpBody, { gas: name }))} <b>${fx(aN)}</b></span><span><i class="dash" style="--c:${css('--ghost')}"></i>${esc(L.cmpAir)} <b>${fx(aA)}</b></span>` +
      (d > 0.02 ? `<span class="less">${tpl(esc(L.cmpLess), { p: `<b>${pct(d)}</b>` })}</span>` : '')
    const series: Series[] = [
      { v: (_st, k) => body(sA[k!]), vNow: () => aA, color: css('--ghost'), dash: '7 6', w: 2.5 },
      { v: (st) => body(st), vNow: () => aN, color: css('--n2'), w: 4 },
    ]
    cmpChart($('#sa-cmpChart'), 'c' + prof._key + S.bg, series, sA)
    const f: string[] = []
    if (cmp.charge! > 0.01) f.push(`<li>${tpl(L.cmpCharge, { p: pct(cmp.charge!), n: fx(cmp.fondN!), a: fx(cmp.fondA!) })}</li>`)
    f.push(`<li>${tpl(L.cmpOut, { n: fx(cmp.outN), a: fx(cmp.outA), p: pct(cmp.excess) })}</li>`)
    if (cmp.lead !== null && cmp.lead >= 1) f.push(`<li>${tpl(L.cmpLead, { t: fmtT(cmp.lead), gas: esc(name) })}</li>`)
    if (S.surf > 0) f.push(`<li>${tpl(L.cmpEnd, { t: fmtT(S.surf), n: fx(cmp.endN), a: fx(cmp.endA) })}</li>`)
    $('#sa-cmpFacts').innerHTML = f.join('')
  }
  type Series = { name?: string; v: (st: State, k?: number) => number; vNow?: () => number; color: string; dash?: string; w?: number }
  function cmpChart(host: Host, key: string, series: Series[], sA: State[]) {
    const w = W(host), h = w < 560 ? 170 : 190, ml = 40, mr = 10, mt = 10, mb = 24
    const iw = w - ml - mr, ih = h - mt - mb, eq = surfEq()
    const yMax = Math.max(...sA.map((s) => body(s)), bodyMax()) / eq * 1.08
    const X = (t: number) => ml + (t / sim.tEnd) * iw, Y = (v: number) => mt + ih - ((v / eq - 1) / Math.max(0.1, yMax - 1)) * ih
    if (host._key !== key || host._w !== w) {
      let g = ''
      const ys = niceStep(yMax - 1, 3)
      for (let v = 1; v <= yMax + 1e-9; v += ys) g += `<line x1="${ml}" x2="${w - mr}" y1="${Y(v * eq)}" y2="${Y(v * eq)}" stroke="${css('--grid')}"/><text x="${ml - 6}" y="${Y(v * eq) + 4}" font-size="11" fill="${css('--muted')}" text-anchor="end">×${fmt(v, ys < 1 ? 1 : 0)}</text>`
      const xs = niceStep(sim.tEnd, Math.max(3, Math.floor(iw / 80)))
      for (let t = 0; t <= sim.tEnd - xs * 0.45; t += xs) g += `<text x="${X(t)}" y="${mt + ih + 16}" font-size="11" fill="${css('--muted')}" text-anchor="middle">${fmt(t)}</text>`
      g += `<text x="${w - mr}" y="${mt + ih + 16}" font-size="11" fill="${css('--muted')}" text-anchor="end">min</text>`
      if (sim.tSurface < sim.tEnd) g += `<rect x="${X(sim.tSurface)}" y="${mt}" width="${X(sim.tEnd) - X(sim.tSurface)}" height="${ih}" fill="${css('--soft')}"/><text x="${(X(sim.tSurface) + X(sim.tEnd)) / 2}" y="${mt + 14}" font-size="11" fill="${css('--muted')}" text-anchor="middle">${esc(L.chartSurface)}</text>`
      // Écart entre les deux courbes : l'azote économisé
      const top = samples.map((st, k) => [X(st.t), Y(body(sA[k]))]), bot = samples.map((st) => [X(st.t), Y(body(st))]).reverse()
      g += `<path d="${pathOf(top.concat(bot))}Z" fill="rgba(18,132,199,.10)"/>`
      series.forEach((s) => { g += `<path d="${pathOf(samples.map((st, k) => [X(st.t), Y(s.v(st, k))]))}" fill="none" stroke="${s.color}" stroke-width="${s.w}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>` })
      host._static = g; host._key = key; host._w = w
    }
    const x = X(cur.t)
    let c = `<line x1="${x}" x2="${x}" y1="${mt}" y2="${mt + ih}" stroke="${css('--fg')}" stroke-width="1.4" opacity=".35"/>`
    series.forEach((s) => { c += `<circle cx="${x}" cy="${Y(s.vNow!())}" r="5.5" fill="${s.color}" stroke="${css('--bg')}" stroke-width="2.5"/>` })
    host.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block">${host._static}${c}</svg>`
  }

  // ── Outils de dessin ───────────────────────────────────────────────────────
  const W = (el: HTMLElement) => Math.max(260, Math.floor(el.clientWidth || 600))
  const niceStep = (range: number, target: number) => { const raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p }
  const pathOf = (pts: number[][]) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('')
  const PHASE: Record<E.Phase, string> = { descente: L.phases.descent, fond: L.phases.bottom, 'remontée': L.phases.ascent, palier: L.phases.stop, niveau: L.phases.stop, surface: L.phases.surface }
  const PHASE_C: Record<E.Phase, string> = { descente: '#e0f2fe', fond: '#bae6fd', 'remontée': '#e0f2fe', palier: '#ede9fe', niveau: '#ede9fe', surface: '#f3f4f6' }

  /** Rangée de « + » : n signes (fraction pour le dernier) à partir de (x, y), espacés de dx. */
  function plusRow(x: number, y: number, n: number, dx: number, color: string, size: number) {
    let s = ''
    const full = Math.floor(n + 1e-9), frac = n - full
    for (let j = 0; j < full; j++) s += `<text x="${x + j * dx}" y="${y}" font-size="${size}" font-weight="800" fill="${color}" text-anchor="middle">+</text>`
    if (frac > 0.08) s += `<text x="${x + full * dx}" y="${y}" font-size="${size}" font-weight="800" fill="${color}" text-anchor="middle" opacity="${(0.2 + 0.8 * frac).toFixed(2)}">+</text>`
    return s
  }

  // ── Vitesse de charge (vue simple) ─────────────────────────────────────────
  /** Écart eau − corps, en « fois l'azote de surface ». C'est lui qui fixe la vitesse de charge :
   *  il grandit avec la profondeur et diminue à mesure que le corps se remplit. */
  const gapX = (st: State) => gap(st) / surfEq()
  const SPEED = L.chargeSpeeds
  const speedLevel = (gx: number) => (gx < 1 ? 0 : gx < 2.5 ? 1 : gx < 4.5 ? 2 : 3)
  const mix = (a: string, b: string, k: number) => { const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})` }
  /** Couleur de charge : jaune pâle (lente) → orange → rouge (très rapide). */
  const chargeColor = (gx: number) => { const k = clamp(gx / 5.5, 0, 1); return k < 0.5 ? mix('#fbbf24', '#f97316', k * 2) : mix('#f97316', '#dc2626', (k - 0.5) * 2) }
  /** État pédagogique de la vue simple : sous le repère 12 m on se charge, au-dessus (en fin de
   *  plongée) on désature. Pour une plongée qui ne dépasse jamais 12 m, on suit le calcul. */
  function simpleState(st: State) {
    if (st.phase === 'surface') return 'out'
    if (sim.maxDepth > 12) return sim.t12 !== null && st.t >= sim.t12 ? 'out' : 'in'
    return gap(st) > 0.01 ? 'in' : 'out'
  }

  // ── Le graphique principal ─────────────────────────────────────────────────
  const prof = $<SVGSVGElement>('#sa-prof') as unknown as SVGSVGElement & { _key?: string; _static?: string }
  const profWrap = $('#sa-profWrap')
  let PX: { inv: (px: number) => number } | null = null
  /** Largeur moyenne d'un caractère de la bulle (12,5 px, Poppins semi-gras). */
  const CHAR_W = 7.1
  /** Couleur du trait en vue découverte (charge) : un seul orange, sans nuance de vitesse. */
  const PEDA_IN = '#f97316'
  function drawProfile() {
    const peda = isPeda(), simple = S.mode !== 'adv'
    const gNow = cur.phase === 'surface' ? E.AIR : cur.gas
    const w = W(profWrap), narrow = w < 560
    const dMax = Math.max(15, Math.ceil((sim.maxDepth * 1.12) / 5) * 5)
    // Vue découverte : l'échelle de droite est faite de « + » (doses d'azote dans l'eau), sans chiffres.
    const rowsD: number[] = [0]
    for (let d = 10; d <= dMax - 3; d += 10) rowsD.push(d)
    if (!rowsD.some((d) => Math.abs(d - sim.maxDepth) < 5)) rowsD.push(sim.maxDepth)
    const doses = (d: number) => xf(E.piN2(E.pAmb(d, S.sp), gNow))
    const PDX = 9
    const nMaxP = Math.ceil(Math.max(1, ...(peda ? rowsD : [0, Math.floor(dMax / 10) * 10]).map(doses)) - 0.08)
    const h = narrow ? 330 : 410, ml = 46, mr = peda ? Math.max(28, 16 + nMaxP * PDX) : Math.max(simple ? 50 : 44, 16 + nMaxP * PDX), mt = 24, mb = peda ? 34 : 26
    const iw = w - ml - mr, ih = h - mt - mb
    // Échelle du temps en deux parties : la plongée occupe l'essentiel de la largeur, le temps passé
    // en surface ensuite est resserré à droite (il sert à voir la désaturation, pas à la lire en détail).
    const tS = sim.tSurface, hasSurf = S.surf > 0 && sim.tEnd > tS + 1e-6
    const fD = hasSurf ? (narrow ? 0.76 : 0.8) : 1, xs0 = ml + fD * iw
    const X = (t: number) => (!hasSurf || t <= tS ? ml + (t / (hasSurf ? tS : sim.tEnd)) * fD * iw : xs0 + ((t - tS) / (sim.tEnd - tS)) * (iw - fD * iw))
    const Y = (d: number) => mt + (d / dMax) * ih
    PX = { inv: (px: number) => (!hasSurf || px <= xs0 ? ((px - ml) / (fD * iw)) * (hasSurf ? tS : sim.tEnd) : tS + ((px - xs0) / (iw - fD * iw)) * (sim.tEnd - tS)) }
    $('#sa-chartAmb').textContent = peda ? L.chartAmbPeda : simple ? tpl(L.chartAmbSimple, { gas: gasName(gNow) }) : tpl(L.chartAmbAdv, { gas: gasName(gNow) })
    const key = JSON.stringify([S.depth, S.time, S.stops, S.bg, S.dc, S.dcO2, S.sw, S.asc, S.sp, S.surf, S.ppB, S.mode, w, gasName(gNow)])
    if (prof._key !== key) {
      const MUTED = css('--muted'), DIM = css('--dim'), PI = css('--pi')
      const route = samples.map((s) => [X(s.t), Y(s.depth)])
      // Couleur du trait pour chaque point : charge (orange, plus ou moins soutenu) ou décharge (bleu).
      const colAt = (b: State) => {
        if (peda) return simpleState(b) === 'in' ? PEDA_IN : css('--down')
        if (simple) return simpleState(b) === 'in' ? chargeColor(Math.max(0, gapX(b))) : css('--down')
        const gv = gap(b)
        return gv > 0.01 ? chargeColor(gapX(b)) : gv < -0.01 ? css('--down') : MUTED
      }
      // Dégradé horizontal qui suit le trajet ; les changements d'état restent nets (deux arrêts au même endroit).
      let stops = '', prevC = ''
      samples.forEach((b, k) => {
        const c = colAt(b), o = clamp((route[k][0] - ml) / iw, 0, 1).toFixed(4)
        if (c !== prevC && prevC) stops += `<stop offset="${o}" stop-color="${prevC}"/>`
        if (c !== prevC || k === samples.length - 1 || k % 6 === 0) stops += `<stop offset="${o}" stop-color="${c}"/>`
        prevC = c
      })
      let g = `<defs><filter id="sa-sh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#0c4a6e" flood-opacity=".18"/></filter>` +
        `<linearGradient id="sa-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1284c7" stop-opacity=".05"/><stop offset="1" stop-color="#1284c7" stop-opacity=".2"/></linearGradient>` +
        `<linearGradient id="sa-route" gradientUnits="userSpaceOnUse" x1="${ml}" y1="0" x2="${ml + iw}" y2="0">${stops}</linearGradient></defs>`
      // Coupure d'échelle : le temps en surface est resserré à droite, sur fond gris très clair.
      if (hasSurf) {
        g += `<rect x="${xs0}" y="${mt}" width="${ml + iw - xs0}" height="${ih}" fill="${css('--soft')}"/>`
        g += `<text x="${(xs0 + ml + iw) / 2}" y="${mt + 20}" font-size="12" font-weight="500" fill="${DIM}" text-anchor="middle">${esc(L.chartSurface)}</text>`
      }
      // Lignes de profondeur tous les 10 m
      for (let d = 10; d <= dMax; d += 10) {
        g += `<line x1="${ml}" x2="${ml + iw}" y1="${Y(d)}" y2="${Y(d)}" stroke="${css('--line')}" stroke-dasharray="2 4"/>`
        if (!(Math.abs(Y(d) - Y(12)) < 22 && dMax >= 12)) g += `<text x="${ml - 8}" y="${Y(d) + 4}" font-size="12" font-weight="500" fill="${MUTED}" text-anchor="end">${d} m</text>`
      }
      // Échelle de droite : azote dans l'eau à chaque profondeur
      if (peda) {
        rowsD.forEach((d) => { g += plusRow(ml + iw + 10 + PDX / 2, Y(d) + 5, doses(d), PDX, PI, 15) })
      } else {
        // Vues simple et détaillée : les mêmes « + » que la pastille du plongeur (le référentiel), avec
        // la valeur en dessous (×N en simple, PiN₂ en bar en détaillé).
        const lab = (d: number, v: string) => plusRow(ml + iw + 10 + PDX / 2, Y(d) + 1, doses(d), PDX, PI, 14) +
          `<text x="${ml + iw + 10}" y="${Y(d) + 14}" font-size="11" font-weight="600" fill="${PI}" opacity=".8">${v}</text>`
        g += lab(0, simple ? '×1' : fmt(surfEq(), 2))
        for (let d = 10; d <= dMax; d += 10) {
          const v = E.piN2(E.pAmb(d, S.sp), gNow)
          g += lab(d, simple ? fx(v) : fmt(v, 1))
        }
      }
      // Axe du temps (vue découverte : les phases de la plongée à la place des minutes)
      if (peda) g += phaseBand(X, mt + ih + 8, 22)
      else {
        const tD = hasSurf ? tS : sim.tEnd
        const xs = niceStep(tD, Math.max(3, Math.floor((fD * iw) / 80)))
        for (let t = 0; t <= tD - xs * 0.45; t += xs) g += `<text x="${X(t)}" y="${h - 6}" font-size="12" font-weight="500" fill="${DIM}" text-anchor="middle">${fmt(t)}</text>`
        g += `<text x="${hasSurf ? xs0 : ml + iw}" y="${h - 6}" font-size="12" font-weight="600" fill="${MUTED}" text-anchor="${hasSurf ? 'middle' : 'end'}">${fmt(tD)}${hasSurf ? '' : ' min'}</text>`
        if (hasSurf) g += `<text x="${ml + iw}" y="${h - 6}" font-size="12" font-weight="500" fill="${DIM}" text-anchor="end">${fmt(sim.tEnd)} min</text>`
      }
      // Zone trop profonde pour le gaz (PMU)
      const bmod = E.modOf(sim.cfg.bottomGas, S.ppB, S.sp)
      if (!peda && sim.maxDepth > bmod) {
        const xe = hasSurf ? xs0 : ml + iw
        g += `<rect x="${ml}" y="${Y(bmod)}" width="${xe - ml}" height="${Y(dMax) - Y(bmod)}" fill="rgba(220,38,38,.07)"/>`
        g += `<line x1="${ml}" x2="${xe}" y1="${Y(bmod)}" y2="${Y(bmod)}" stroke="${css('--bad')}" stroke-width="1.2" stroke-dasharray="4 4" opacity=".6"/>`
      }
      // Surface
      g += `<line x1="${ml}" x2="${ml + iw}" y1="${mt}" y2="${mt}" stroke="${PI}" stroke-width="2"/>`
      // Repère 12 m, et en vues découverte / simple ce qui se passe de chaque côté
      if (dMax >= 12) {
        g += `<line x1="${ml}" x2="${ml + iw}" y1="${Y(12)}" y2="${Y(12)}" stroke="${css('--primary-700')}" stroke-width="1.5" stroke-dasharray="6 5" opacity=".5"/>`
        g += `<rect x="4" y="${Y(12) - 10}" width="${ml - 10}" height="20" rx="10" fill="${css('--primary')}"/><text x="${4 + (ml - 10) / 2}" y="${Y(12) + 4}" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">12 m</text>`
      }
      // Trajet : la zone parcourue est remplie d'un dégradé bleu (plus foncé en profondeur) ; le trajet
      // à venir est en pointillés gris, la partie déjà jouée en trait plein coloré (découpée à chaque image).
      const routeD = pathOf(route)
      g += `<path d="${routeD}L${route[route.length - 1][0].toFixed(1)} ${mt}L${route[0][0].toFixed(1)} ${mt}Z" fill="url(#sa-sea)" clip-path="url(#sa-past)"/>`
      g += `<path d="${routeD}" fill="none" stroke="${css('--future')}" stroke-width="2.5" stroke-dasharray="5 5" stroke-linejoin="round" stroke-linecap="round" opacity=".8"/>`
      g += `<path d="${routeD}" fill="none" stroke="url(#sa-route)" stroke-width="${peda ? 4.5 : 4}" stroke-linejoin="round" stroke-linecap="round" clip-path="url(#sa-past)"/>`
      if (sim.tSwitch !== null) g += `<circle cx="${X(sim.tSwitch)}" cy="${Y(S.sw)}" r="6" fill="${gasColor(sim.cfg.decoGas)}" stroke="#fff" stroke-width="2.5"/>`
      prof._static = g; prof._key = key
    }

    // ---- partie dynamique : curseur, plongeur, bulles
    const x = X(cur.t), y = Y(cur.depth)
    let d = `<clipPath id="sa-past"><rect x="0" y="0" width="${x.toFixed(1)}" height="${h}"/></clipPath>`
    d += `<line x1="${x}" x2="${x}" y1="${mt}" y2="${mt + ih}" stroke="${css('--primary')}" stroke-width="1.5" stroke-dasharray="3 4" opacity=".45"/>`
    const surf = cur.depth < 0.3, gc = gasColor(cur.gas)
    // Le plongeur : une petite silhouette (combinaison, bloc couleur du gaz, masque, palmes), tournée dans
    // le sens du trajet : tête vers le bas à la descente, vers le haut à la remontée, à plat en surface.
    const ang = (() => {
      if (surf) return 0
      const t0 = Math.max(0, cur.t - 0.4), t1 = Math.min(sim.tEnd, cur.t + 0.4)
      const dx = X(t1) - X(t0), dy = Y(E.stateAt(sim, t1).depth) - Y(E.stateAt(sim, t0).depth)
      return dx <= 0 ? 0 : clamp((Math.atan2(dy, dx) * 180) / Math.PI, -35, 35)
    })()
    const SUIT = css('--primary-700'), SKIN = '#fcd9b6'
    d += `<ellipse cx="${x}" cy="${y}" rx="38" ry="20" fill="${gc}" opacity=".12"/>`
    d += `<g transform="translate(${x} ${y}) rotate(${ang.toFixed(1)}) scale(1.45)" filter="url(#sa-sh)">` +
      // palmes
      `<path d="M-14 0.5 L-26 -5 Q-28 1 -26 6 Z" fill="${css('--primary')}" stroke="#fff" stroke-width="1"/>` +
      // jambes
      `<path d="M-2 1 L-15 2.5" stroke="${SUIT}" stroke-width="5" stroke-linecap="round"/>` +
      // corps
      `<ellipse cx="4" cy="0.5" rx="9" ry="5" fill="${SUIT}"/>` +
      // bloc sur le dos
      `<rect x="-6" y="-8.5" width="15" height="5.5" rx="2.75" fill="${gc}" stroke="#fff" stroke-width="1.2"/>` +
      // bras tendu vers l'avant
      `<path d="M7 2.5 L15 5.5" stroke="${SUIT}" stroke-width="3" stroke-linecap="round"/>` +
      // tête, masque, détendeur
      `<circle cx="15.5" cy="-0.5" r="4.6" fill="${SUIT}"/>` +
      `<circle cx="14.6" cy="0.6" r="1.6" fill="${SKIN}"/>` +
      `<rect x="16.2" y="-3.6" width="4.4" height="3.6" rx="1.2" fill="#bae6fd" stroke="#fff" stroke-width="1"/>` +
      `<circle cx="19.2" cy="2.4" r="1.4" fill="${gc}"/>` +
      `</g>`
    if (!surf) d += `<g transform="translate(${x + 30} ${y - 16})" opacity=".8"><circle class="bub" r="2.2" fill="#fff" stroke="${css('--pi')}" stroke-width="1.2"/><circle class="bub" style="animation-delay:.55s" cx="3" cy="-3" r="1.6" fill="#fff" stroke="${css('--pi')}" stroke-width="1.2"/><circle class="bub" style="animation-delay:1.1s" cx="-2" cy="-2" r="1.3" fill="#fff" stroke="${css('--pi')}" stroke-width="1.2"/></g>`
    // Pastille de « + » au-dessus du plongeur : l'azote stocké dans son corps (même unité que l'échelle).
    let pillHalf = 0
    {
      const n = xf(body(cur)), cnt = Math.ceil(n - 0.08), bwid = Math.max(1, cnt) * 11 + 14, by = y - 36 < mt + 2 ? y + 36 : y - 36
      const bx = clamp(x - bwid / 2, ml + 2, ml + iw - bwid - 2)
      pillHalf = Math.max(x - bx, bx + bwid - x)
      d += `<rect x="${bx}" y="${by - 11}" width="${bwid}" height="22" rx="11" fill="#fff" stroke="${css('--n2')}" stroke-width="1.5" filter="url(#sa-sh)"/>` + plusRow(bx + 7 + 5.5, by + 5, n, 11, css('--n2'), 15)
    }
    // Bulle de commentaire à côté du plongeur : ce qu'il vit, à la 1re personne.
    {
      const say = diverSays()
      if (say) {
        const maxW = Math.min(270, Math.max(190, iw * 0.6)), cpl = Math.floor((maxW - 20) / CHAR_W)
        const lines = wrapWords(say.t, cpl), lw = Math.max(...lines.map((l) => l.length)) * CHAR_W + 20, lh = lines.length * 16 + 12
        const gapX0 = Math.max(44, pillHalf + 8)
        let bx = x + gapX0, side = 'r'
        if (bx + lw > ml + iw - 2) { bx = x - gapX0 - lw; side = 'l' }
        if (bx < ml + 2) { bx = clamp(x - lw / 2, ml + 2, ml + iw - lw - 2); side = 'c' }
        let by = side === 'c' ? (y - 50 - lh < mt + 2 ? y + 46 : y - 50 - lh) : (y - lh - 10 < mt + 2 ? y + 6 : y - lh - 10)
        by = clamp(by, mt + 2, h - mb - lh - 2)
        const ty = clamp(y - 4, by + 8, by + lh - 8)
        const tail = side === 'r' ? `M${bx + 1} ${ty - 5} L${bx - 7} ${ty} L${bx + 1} ${ty + 5}Z` : side === 'l' ? `M${bx + lw - 1} ${ty - 5} L${bx + lw + 7} ${ty} L${bx + lw - 1} ${ty + 5}Z` : ''
        d += `<g class="talk"><rect x="${bx}" y="${by}" width="${lw}" height="${lh}" rx="10" fill="#fff" stroke="${say.c}" stroke-width="1.5" filter="url(#sa-sh)"/>${tail ? `<path d="${tail}" fill="${say.c}"/>` : ''}`
        lines.forEach((l, i) => { d += `<text x="${bx + 10}" y="${by + 20 + i * 16}" font-size="12.5" font-weight="600" fill="${css('--fg')}">${esc(l)}</text>` })
        d += '</g>'
      }
    }
    prof.setAttribute('width', String(w)); prof.setAttribute('height', String(h)); prof.setAttribute('viewBox', `0 0 ${w} ${h}`)
    prof.innerHTML = prof._static + d
    profWrap.classList.toggle('paused', !playing)
    renderGauge(w)
  }

  const wrapWords = (t: string, n: number) => {
    const out: string[] = []; let line = ''
    t.split(' ').forEach((w) => { if ((line + ' ' + w).trim().length > n && line) { out.push(line); line = w } else line = (line + ' ' + w).trim() })
    if (line) out.push(line)
    return out
  }
  /** Ce que dit le plongeur, adapté au niveau de l'onglet. Renvoie { t: texte, c: couleur du cadre }. */
  function diverSays(): { t: string; c: string } {
    const D = L.diver
    const UP = css('--up'), DOWN = css('--down'), EQ = css('--eq'), HOT = css('--hot')
    const water = cur.phase === 'surface' ? surfEq() : cur.piN2
    const asc = cur.phase === 'remontée' || cur.phase === 'palier' || cur.phase === 'niveau'
    const isDeco = sim.tSwitch !== null && cur.t >= sim.tSwitch && cur.phase !== 'surface'
    const justIn = sim.t12 !== null && cur.t >= sim.t12 && cur.t < sim.t12 + 1.2 && cur.phase !== 'surface'
    if (cur.t < 0.05) return { t: S.mode === 'adv' ? D.startAdv : isPeda() ? D.startPeda : D.startSimple, c: EQ }
    if (isPeda()) {
      const st = simpleState(cur), pr = pedaProg(cur.t)
      if (cur.phase === 'surface') return pedaAt(cur.t) < 1.25 ? { t: D.pedaBackEq, c: EQ } : { t: D.pedaFinishing, c: DOWN }
      if (st === 'in') {
        if (cur.phase === 'descente') return { t: D.pedaDescent, c: UP }
        if (asc && cur.depth > 12) return { t: D.pedaKeep, c: UP }
        return pr > 0.9 ? { t: D.pedaAlmostSat, c: HOT } : { t: D.pedaCharging, c: UP }
      }
      return justIn ? { t: D.pedaEnterZone, c: DOWN } : { t: D.pedaDesat, c: DOWN }
    }
    if (S.mode === 'simple') {
      const st = simpleState(cur), r = body(cur) / water
      if (cur.phase === 'surface') return r < 1.06 ? { t: D.simpleBackEq, c: EQ } : { t: D.simpleSurfDesat, c: DOWN }
      if (st === 'in') {
        if (cur.phase === 'descente') return { t: D.simpleDescent, c: UP }
        if (asc && cur.depth > 12) return { t: D.simpleAscCharging, c: UP }
        if (r >= 0.97) return { t: D.simpleSat, c: HOT }
        if (r >= 0.85) return { t: D.simpleNearSat, c: HOT }
        return { t: tpl(D.simpleCharging, { body: fx(body(cur)), water: fx(water) }), c: UP }
      }
      if (justIn) return { t: D.simpleEnterZone, c: DOWN }
      if (isDeco) return { t: D.simpleDecoGas, c: DOWN }
      return { t: cur.phase === 'palier' || cur.phase === 'niveau' ? D.simpleStop : D.simpleDesat, c: DOWN }
    }
    // Vue détaillée : par familles de tissus, valeurs du modèle.
    const st = GROUPS.map((g) => { const v = groupMean(cur, g); return { name: g.lower, v, r: v / water, gv: gap(cur, v) } })
    const ins = st.filter((g) => g.gv > 0.01), outs = st.filter((g) => g.gv < -0.01)
    const maxM = Math.max(...cur.comp.map((c) => c.ratio))
    const warn = maxM > 1 ? ' ' + tpl(D.warnOver, { p: fmt(maxM * 100, 0) }) : maxM > 0.9 ? ' ' + tpl(D.warnNear, { p: fmt(maxM * 100, 0) }) : ''
    if (cur.phase === 'surface') return { t: (outs.length === 3 ? D.advSurfAll : D.advSurfSome) + warn, c: DOWN }
    if (cur.phase === 'descente') return { t: tpl(D.advDescent, { pi: fmt(water, 2) }), c: UP }
    if (outs.length === 0) {
      const c1 = cur.comp[0].pN2 / water
      if (cur.phase === 'remontée' && cur.depth > 12) return { t: D.advAscCharging + warn, c: UP }
      if (c1 > 0.9) return { t: tpl(D.advFastSat, { p: fmt(cur.comp[0].pN2, 2) }) + warn, c: HOT }
      return { t: D.advAllCharging + warn, c: UP }
    }
    if (ins.length === 0) return { t: (isDeco ? D.advDecoAll : D.advAllDesat) + warn, c: DOWN }
    const names = (arr: { name: string }[]) => arr.map((g) => g.name).join(D.and)
    return { t: (justIn ? D.advZone12 : '') + tpl(D.advMixed, { outs: names(outs), ins: names(ins) }) + warn, c: maxM > 0.9 ? HOT : DOWN }
  }

  /** Jauges sous le graphique : « Azote dans l'air ambiant » et « dans ton corps » (ou les 3 familles de tissus). */
  function renderGauge(w: number) {
    if (isPeda()) return renderGaugePeda()
    const simple = S.mode === 'simple'
    const water = cur.phase === 'surface' ? surfEq() : cur.piN2
    type Row = { name: string; v: number; c: string; water?: boolean; ghost?: boolean }
    const rows: Row[] = [{ name: simple ? L.gaugeAmb : Math.min(w, 560) >= 470 ? L.gaugeAmbAdvLong : L.gaugeAmbAdvShort, v: water, c: css('--pi'), water: true }]
    if (simple) rows.push({ name: L.gaugeBody, v: body(cur), c: css('--n2') })
    if (simple && simAir) rows.push({ name: L.gaugeIfAir, v: body(E.stateAt(simAir, cur.t)), c: css('--ghost'), ghost: true })
    if (!simple) GROUPS.forEach((g) => rows.push({ name: tpl(L.gaugeTissues, { g: g.lower }), v: groupMean(cur, g), c: css(g.c) }))
    const vMax = Math.max(ext.maxPi, simple ? ext.maxRef : ext.maxGroup) * 1.02
    let html = rows.map((r) => {
      const gv = gap(cur, r.v)
      const arrow = r.water || simple ? '' : gv > 0.01 ? '▲' : gv < -0.01 ? '▼' : '='
      const ac = gv > 0.01 ? 'pos' : gv < -0.01 ? 'neg' : 'zero'
      const pc = clamp((r.v / vMax) * 100, 1.5, 100).toFixed(1)
      return `<div class="g-row${r.ghost ? ' ghost' : ''}"><div class="g-top"><span class="g-name"><i style="background:${r.c}"></i>${esc(r.name)}</span><b>${simple ? fx(r.v) : fmt(r.v, 2)}${arrow ? `<em class="${ac}">${arrow}</em>` : ''}</b></div><div class="g-bar"><span style="width:${pc}%;background:${r.c}"></span></div>${simple ? `<div class="g-note">${esc(tpl(L.gaugeTimesSimple, { n: fmt(xf(r.v), 1) }))}</div>` : ''}</div>`
    }).join('')
    if (simple) {
      const st = simpleState(cur)
      let foot: string
      if (cur.t < 0.05) foot = `<span style="color:${css('--muted')}">${esc(L.gaugeEq)}</span>`
      else if (st === 'in') {
        const gx = Math.max(0, gapX(cur)), lv = speedLevel(gx), c = chargeColor(gx)
        foot = `<span style="color:${c}">${esc(tpl(w >= 420 ? L.gaugeIn : L.gaugeInShort, { s: SPEED[lv] }))}</span><span class="lv">${[0, 1, 2, 3].map((i) => `<span${i <= lv ? ` style="background:${c}"` : ''}></span>`).join('')}</span>`
      } else foot = `<span style="color:${css('--down')}">${esc(L.gaugeOut)}</span>`
      html += `<div class="g-foot">${foot}</div>`
    }
    $('#sa-gauge').innerHTML = html
  }

  /** Vue découverte : deux rangées de « + », sans chiffres. */
  function renderGaugePeda() {
    const a = cur.phase === 'surface' ? 1 : xf(cur.piN2), b = pedaAt(cur.t)
    const nMax = Math.ceil(Math.max(a, b, xf(ext.maxPi), 1) - 0.08)
    // cap : pour le corps, les cases vides jusqu'au niveau de l'air sont teintées (c'est sa saturation max ici).
    const row = (nm: string, n: number, c: string, cap = 0, note = '') => {
      let p = ''
      for (let j = 0; j < nMax; j++) {
        const fr = clamp(n - j, 0, 1)
        p += fr > 0.08 ? `<span style="color:${c};opacity:${(0.25 + 0.75 * fr).toFixed(2)}">+</span>` : j < Math.ceil(cap - 0.08) ? '<span class="cap">+</span>' : '<span class="off">+</span>'
      }
      return `<div class="g-row"><div class="g-top"><span class="g-name"><i style="background:${c}"></i>${esc(nm)}</span></div><div class="g-plus">${p}</div>${note ? `<div class="g-note">${esc(note)}</div>` : ''}</div>`
    }
    const st = simpleState(cur)
    let msg: string, mc = css('--muted')
    if (cur.t < 0.05) msg = L.gaugePedaEq
    else if (st === 'in') { const eqq = cur.phase === 'fond' && pedaProg(cur.t) > 0.9; msg = eqq ? L.gaugePedaNearEq : L.gaugePedaIn; mc = eqq ? css('--muted') : PEDA_IN }
    else { msg = L.gaugePedaOut; mc = css('--down') }
    $('#sa-gauge').innerHTML = row(L.gaugeAmb, a, css('--pi')) + row(L.gaugeBody, b, css('--n2'), a, L.gaugePedaMax) + `<div class="g-foot"><span style="color:${mc}">${esc(msg)}</span></div>`
  }

  let dragging = false
  const tFromEvent = (e: PointerEvent) => { const r = prof.getBoundingClientRect(); return clamp(PX!.inv(e.clientX - r.left), 0, sim.tEnd) }
  on(profWrap, 'pointerdown', (e) => { dragging = true; profWrap.setPointerCapture(e.pointerId); pause(); setT(tFromEvent(e)) })
  on(profWrap, 'pointermove', (e) => { if (dragging) setT(tFromEvent(e)) })
  on(profWrap, 'pointerup', () => { dragging = false; save() })
  on(profWrap, 'pointercancel', () => { dragging = false; save() })

  // ── Lecture (indépendante des images/s) ────────────────────────────────────
  let playing = false, last = 0, raf = 0
  const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>'
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4.5" width="4.2" height="15" rx="1"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1"/></svg>'
  function play() { if (S.t >= sim.tEnd - 1e-6) S.t = 0; playing = true; last = performance.now(); raf = requestAnimationFrame(tick); syncPlay() }
  function pause() { playing = false; cancelAnimationFrame(raf); syncPlay(); save() }
  function syncPlay() { const b = $('#sa-play'); b.innerHTML = playing ? ICON_PAUSE : ICON_PLAY; b.setAttribute('aria-label', playing ? L.pause : L.play); profWrap.classList.toggle('paused', !playing) }
  function tick(now: number) {
    const dt = Math.min(0.25, (now - last) / 1000); last = now
    const f = cur && cur.phase === 'surface' ? 4 : 1 // la surface défile plus vite
    S.t = Math.min(sim.tEnd, S.t + dt * S.speed * f)
    update()
    if (S.t >= sim.tEnd) { pause(); return }
    raf = requestAnimationFrame(tick)
  }
  on($('#sa-play'), 'click', () => (playing ? pause() : play()))
  on($('#sa-reset'), 'click', () => { pause(); setT(0) })
  const slider = $<HTMLInputElement>('#sa-tSlider')
  on(slider, 'input', () => { pause(); setT((+slider.value / 1000) * sim.tEnd) })
  function setT(t: number) { S.t = clamp(t, 0, sim.tEnd); update() }

  // ── Phrase sous le graphique ───────────────────────────────────────────────
  function renderSay() {
    const Y = L.say
    const water = cur.phase === 'surface' ? surfEq() : cur.piN2
    const where = cur.phase === 'surface' ? Y.atSurface : tpl(Y.atDepth, { d: fmt(cur.depth) })
    const isDeco = sim.tSwitch !== null && cur.t >= sim.tSwitch && cur.phase !== 'surface'
    const badO2 = cur.phase !== 'surface' && cur.ppO2 > (isDeco ? S.ppD : S.ppB) + 1e-9
    const asc = cur.phase === 'remontée' || cur.phase === 'palier' || cur.phase === 'niveau'
    let a: string, s2: string
    if (cur.t < 0.05) { a = Y.start; s2 = Y.startHint }
    else if (cur.phase === 'surface') {
      a = isPeda() ? (pedaAt(cur.t) < 1.25 ? Y.pedaOutAlmost : Y.pedaOutStill) : tpl(Y.outBody, { n: fois(body(cur)) })
      s2 = isPeda() ? Y.pedaOutHint : Y.outHint
    }
    else if (isPeda()) {
      const st = simpleState(cur), pr = pedaProg(cur.t)
      if (st === 'in') {
        if (asc && cur.depth > 12) { a = tpl(Y.pedaAscKeep, { where }); s2 = Y.pedaAscKeepHint }
        else if (cur.phase === 'descente') { a = tpl(Y.pedaDescent, { where }); s2 = Y.pedaDescentHint }
        else if (cur.phase === 'fond' && pr > 0.9) { a = tpl(Y.pedaNearEq, { where }); s2 = Y.pedaNearEqHint }
        else { a = tpl(Y.pedaFilling, { where }); s2 = cur.depth >= 30 ? Y.pedaFillingDeep : Y.pedaFillingShallow }
      } else { a = sim.maxDepth > 12 ? Y.pedaGiveBack12 : tpl(Y.pedaGiveBack, { where }); s2 = Y.pedaGiveBackHint }
    }
    else if (S.mode === 'simple') {
      const st = simpleState(cur), lv = speedLevel(Math.max(0, gapX(cur)))
      const nums = { where, n: fois(water), s: SPEED[lv], water: fx(water), body: fx(body(cur)) }
      if (st === 'in') {
        if (asc && cur.depth > 12) { a = tpl(Y.simpleAscCharging, nums); s2 = Y.simpleAscChargingHint }
        else if (cur.phase === 'descente') { a = tpl(Y.simpleDescent, nums); s2 = Y.simpleDescentHint }
        else {
          a = tpl(Y.simpleCharging, nums)
          s2 = body(cur) / water > 0.97 ? Y.hintSat
            : body(cur) / water > 0.85 ? Y.hintNearSat
            : body(cur) / water > 0.6 ? Y.hintWellFilled
            : cur.depth >= 35 ? Y.hintDeep
            : cur.depth > 22 ? Y.hintUntilSat
            : cur.depth > 15 ? Y.hintNotDeep
            : cur.depth > 0 ? Y.hintShallow
            : Y.hintUntilSat
        }
      } else {
        a = sim.maxDepth > 12 ? Y.simpleGiveBack12 : tpl(Y.simpleGiveBack, nums)
        s2 = isDeco ? tpl(Y.simpleDecoHint, { gas: gasName(cur.gas) }) : Y.simpleGiveBackHint
      }
    } else {
      const g = gap(cur)
      if (g > 0.01) { a = tpl(Y.advIn, { where, pi: fmt(water, 2), n: fois(water), mean: fmt(cur.meanN2, 2) }); s2 = Y.advInHint }
      else if (g < -0.01) { a = tpl(Y.advOut, { where, pi: fmt(water, 2), mean: fmt(cur.meanN2, 2) }); s2 = Y.advOutHint }
      else { a = tpl(Y.advEq, { where, pi: fmt(water, 2) }); s2 = '' }
    }
    if (badO2 && !isPeda()) s2 = tpl(Y.badO2, { pp: fmt(cur.ppO2, 2) }) + ' ' + s2
    $('#sa-say').textContent = a; $('#sa-say2').textContent = s2
    $('#sa-tLabel').textContent = isPeda() ? '' : fmtT(cur.t)
    slider.value = String(Math.round((S.t / sim.tEnd) * 1000))
  }

  // ── Vue détaillée : éléments repliés ───────────────────────────────────────
  function phaseBand(X: (t: number) => number, y: number, h: number) {
    const groups: { p: string; ph: E.Phase; t0: number; t1: number }[] = []
    sim.segments.forEach((s) => { const p = PHASE[s.phase]; const g = groups[groups.length - 1]; if (g && g.p === p) g.t1 = s.t1; else groups.push({ p, ph: s.phase, t0: s.t0, t1: s.t1 }) })
    return groups.map((g) => {
      const x0 = X(g.t0), x1 = X(g.t1), wd = x1 - x0
      return `<rect x="${x0}" y="${y}" width="${Math.max(0, wd - 1)}" height="${h}" rx="4" fill="${PHASE_C[g.ph]}"/>` +
        (wd > g.p.length * 6.4 + 6 ? `<text x="${(x0 + x1) / 2}" y="${y + h / 2 + 4}" font-size="11" font-weight="600" fill="#0c4a6e" text-anchor="middle">${esc(g.p)}</text>` : '')
    }).join('')
  }
  function timeChart(host: Host, key: string, o: { h?: number; yMax: number; series: Series[] }) {
    const w = W(host), h = o.h || 230, ml = 34, mr = 10, mt = 12, mb = 50
    const iw = w - ml - mr, ih = h - mt - mb
    const X = (t: number) => ml + (t / sim.tEnd) * iw, Y = (v: number) => mt + ih - (Math.min(v, o.yMax) / o.yMax) * ih
    if (host._key !== key || host._w !== w) {
      let g = ''
      const ys = niceStep(o.yMax, 4)
      for (let v = 0; v <= o.yMax + 1e-9; v += ys) g += `<line x1="${ml}" x2="${w - mr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${css('--grid')}"/><text x="${ml - 6}" y="${Y(v) + 4}" font-size="11" fill="${css('--muted')}" text-anchor="end">${fmt(v, ys < 1 ? 1 : 0)}</text>`
      const xs = niceStep(sim.tEnd, Math.max(3, Math.floor(iw / 80)))
      for (let t = 0; t <= sim.tEnd - xs * 0.45; t += xs) g += `<text x="${X(t)}" y="${mt + ih + 15}" font-size="11" fill="${css('--muted')}" text-anchor="middle">${fmt(t)}</text>`
      g += `<text x="${w - mr}" y="${mt + ih + 15}" font-size="11" fill="${css('--muted')}" text-anchor="end">min</text>`
      g += phaseBand(X, mt + ih + 24, 20)
      o.series.forEach((s) => { g += `<path d="${pathOf(samples.map((st) => [X(st.t), Y(s.v(st))]))}" fill="none" stroke="${s.color}" stroke-width="${s.w || 2.5}" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>` })
      host._static = g; host._key = key; host._w = w
    }
    const x = X(cur.t)
    let c = `<line x1="${x}" x2="${x}" y1="${mt}" y2="${mt + ih}" stroke="${css('--fg')}" stroke-width="1.4" opacity=".35"/>`
    o.series.forEach((s) => { c += `<circle cx="${x}" cy="${Y(s.v(cur))}" r="6" fill="${s.color}" stroke="${css('--bg')}" stroke-width="2.5"/>` })
    host.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${host._static}${c}</svg>`
  }
  const valsHTML = (series: Series[]) => series.map((s) => `<span class="val"><i class="${s.dash ? 'dash' : ''}" style="--c:${s.color};background:${s.color}"></i>${esc(s.name!)} <b>${fmt(s.v(cur), 2)} bar</b></span>`).join('')

  const dCurves = $<HTMLDetailsElement>('#sa-dCurves'), d16 = $<HTMLDetailsElement>('#sa-d16')
  function renderCurves() {
    if (!dCurves.open) return
    const series: Series[] = [
      { name: L.seriesBreathed, v: (s) => s.piN2, color: css('--pi'), dash: '6 5', w: 2 },
      ...GROUPS.map((g) => ({ name: g.name, v: (s: State) => groupMean(s, g), color: css(g.c), w: 3.5 })),
    ]
    $('#sa-gVals').innerHTML = valsHTML(series)
    timeChart($('#sa-gChart'), 'g' + prof._key, { h: 260, yMax: Math.max(ext.maxPi, ext.maxPt) * 1.08, series })
  }

  function renderBars() {
    const host = $('#sa-bars'), w = W(host), h = w < 560 ? 230 : 260, ml = 40, mr = 6, mt = 22, mb = 40
    const iw = w - ml - mr, ih = h - mt - mb, bw = iw / 16
    const yMax = Math.max(1.1, Math.ceil(ext.maxRatio * 10) / 10 + 0.05)
    const Y = (v: number) => mt + ih - (clamp(v, 0, yMax) / yMax) * ih
    let g = ''
    ;[0, 0.25, 0.5, 0.75].forEach((v) => (g += `<line x1="${ml}" x2="${w - mr}" y1="${Y(v)}" y2="${Y(v)}" stroke="${css('--grid')}"/><text x="${ml - 6}" y="${Y(v) + 4}" font-size="11" fill="${css('--muted')}" text-anchor="end">${v * 100} %</text>`))
    g += `<rect x="${ml}" y="${mt}" width="${iw}" height="${Y(1) - mt}" fill="rgba(225,29,72,.06)"/><line x1="${ml}" x2="${w - mr}" y1="${Y(1)}" y2="${Y(1)}" stroke="${css('--mv')}" stroke-width="2.5"/><text x="${ml - 6}" y="${Y(1) + 4}" font-size="11" font-weight="700" fill="${css('--mv')}" text-anchor="end">100 %</text><text x="${w - mr - 4}" y="${Y(1) - 6}" font-size="11.5" font-weight="700" fill="${css('--mv')}" text-anchor="end">${esc(L.barsLimit)}</text>`
    cur.comp.forEach((c, i) => {
      const x = ml + i * bw + bw * 0.15, bwi = bw * 0.7, sel = i === S.sel, over = c.ratio > 1
      const arrow = c.rate > 0.002 ? '▲' : c.rate < -0.002 ? '▼' : ''
      g += `<g data-c="${i}" style="cursor:pointer"><rect x="${ml + i * bw}" y="${mt}" width="${bw}" height="${ih + mb}" fill="${sel ? 'rgba(18,132,199,.08)' : 'transparent'}" rx="6"/>`
      g += `<rect x="${x}" y="${Y(c.ratio)}" width="${bwi}" height="${Math.max(0, mt + ih - Y(c.ratio))}" rx="${Math.min(5, bwi / 3)}" fill="${over ? css('--bad') : grpColor(i)}" opacity="${sel ? 1 : 0.85}"/>`
      if (arrow) g += `<text x="${x + bwi / 2}" y="${Y(c.ratio) - 5}" font-size="${bw < 24 ? 9 : 11}" fill="${c.rate > 0 ? css('--up') : css('--down')}" text-anchor="middle">${arrow}</text>`
      g += `<text x="${x + bwi / 2}" y="${h - mb + 16}" font-size="${bw < 24 ? 10 : 12}" font-weight="${sel ? 800 : 600}" fill="${sel ? css('--fg') : css('--muted')}" text-anchor="middle">${i + 1}</text></g>`
    })
    g += `<text x="${ml}" y="${h - 6}" font-size="11.5" fill="${css('--fast')}">${esc(L.barsFast)}</text><text x="${w - mr}" y="${h - 6}" font-size="11.5" fill="${css('--slow')}" text-anchor="end">${esc(L.barsSlow)}</text>`
    host.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${g}</svg>`
  }
  on($('#sa-bars'), 'click', (e) => { const el = (e.target as Element).closest<SVGGElement>('[data-c]'); if (el) selectC(+el.dataset.c!) })
  function selectC(i: number) { S.sel = i; save(); render16() }
  $('#sa-csel').innerHTML = E.ZHL16C.halfTimes.map((_h, i) => `<button type="button" data-i="${i}" style="border-bottom:3px solid ${grpColor(i)}">C${i + 1}</button>`).join('')
  on($('#sa-csel'), 'click', (e) => { const b = (e.target as HTMLElement).closest<HTMLElement>('[data-i]'); if (b) selectC(+b.dataset.i!) })
  function renderComp() {
    const i = S.sel, c = cur.comp[i]
    $('#sa-selTitle').textContent = tpl(L.selTitle, { i: i + 1, h: fmt(c.halfTime, 1) })
    $$('#sa-csel button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i! === i)))
    const rc = c.rate > 0.0005 ? 'pos' : c.rate < -0.0005 ? 'neg' : 'zero'
    $('#sa-kpis').innerHTML = ([
      [L.kpis[0], `${fmt(c.pN2, 2)}<em>bar</em>`],
      [L.kpis[1], `${fmt(c.m, 2)}<em>bar</em>`],
      [L.kpis[2], `${fmtS(c.margin, 2)}<em>bar</em>`, c.margin < 0],
      [L.kpis[3], `<span class="${rc}">${fmtS(c.rate, 3)}</span><em>bar/min</em>`],
    ] as [string, string, boolean?][]).map(([k, v, bad]) => `<div class="kpi${bad ? ' bad' : ''}"><small>${esc(k)}</small><b>${v}</b></div>`).join('')
    const series: Series[] = [
      { name: L.seriesLimit, v: (s) => s.comp[i].m, color: css('--mv'), w: 2.2 },
      { name: L.seriesBreathed, v: (s) => s.piN2, color: css('--pi'), dash: '6 5', w: 2 },
      { name: tpl(L.seriesComp, { i: i + 1 }), v: (s) => s.comp[i].pN2, color: css('--n2'), w: 4 },
    ]
    $('#sa-cVals').innerHTML = valsHTML(series.slice().reverse())
    const yMax = Math.min(Math.max(ext.maxPi, ext.maxPt) * 1.6, Math.max(...samples.map((s) => s.comp[i].m))) * 1.05
    timeChart($('#sa-cChart'), 'c' + i + prof._key, { h: 240, yMax: Math.max(yMax, ext.maxPi * 1.1), series })
  }
  function renderTable() {
    const rows = cur.comp.map((c, i) => {
      const rc = c.rate > 0.0005 ? 'pos' : c.rate < -0.0005 ? 'neg' : 'zero'
      return `<tr class="${i === S.sel ? 'sel' : ''}" data-i="${i}"><td><span class="gdot" style="background:${grpColor(i)}"></span>C${i + 1}</td><td>${fmt(c.halfTime, 1)} min</td><td>${fmt(c.pN2, 3)}</td><td>${fmt(cur.pAmb, 3)}</td><td>${fmt(c.m, 3)}</td><td style="${c.margin < 0 ? 'color:var(--bad)' : ''}">${fmtS(c.margin, 3)}</td><td>${fmt(c.ratio * 100, 0)} %</td><td class="${rc}">${fmtS(c.rate, 4)}</td></tr>`
    }).join('')
    $('#sa-ctab').innerHTML = `<thead><tr>${L.tableHead.map((t) => `<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody>`
  }
  on($('#sa-ctab'), 'click', (e) => { const r = (e.target as HTMLElement).closest<HTMLElement>('tr[data-i]'); if (r) selectC(+r.dataset.i!) })
  function render16() { if (!d16.open) return; renderBars(); renderComp(); renderTable() }
  $$<HTMLDetailsElement>('details.info', root).forEach((d) => on(d, 'toggle', () => update()))

  // ── Synchronisation des réglages ───────────────────────────────────────────
  function syncUI() {
    $$('#sa-modeSeg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === S.mode)))
    $('#sa-advView').hidden = S.mode !== 'adv'
    $('#sa-advNote').hidden = S.mode !== 'adv'
    // Vue découverte : pas de réglages, la courbe d'une plongée type s'affiche directement.
    $('#sa-setCard').hidden = isPeda()
    $('#sa-step2N').hidden = isPeda()
    // Vue découverte épurée : ni légende du haut, ni code couleur du trait, ni vitesse de lecture.
    ;['#sa-legTop', '#sa-lgItemC', '#sa-lgItemE', '#sa-speedRow'].forEach((q) => ($(q).hidden = isPeda()))
    $('#sa-gasSet').hidden = isPeda()
    $('#sa-leadN').textContent = isPeda() ? L.leadPeda : L.leadSimple
    $('#sa-more').hidden = isPeda()
    $('#sa-checks').hidden = isPeda()
    const plus = `<b style="color:var(--pi)">+</b> <b style="color:var(--n2)">+</b>`
    $('#sa-lgCharge').textContent = isPeda() ? L.legendChargePeda : L.legendCharge
    $('#sa-lgChargeI').style.background = isPeda() ? PEDA_IN : ''
    $('#sa-lgPlus').innerHTML = `<span>${plus} ${esc(isPeda() ? L.legendPlusPeda : L.legendPlusSimple)}</span>`
    $('#sa-lgAmb').innerHTML = `<i style="background:var(--pi)"></i><span>${S.mode === 'adv' ? L.legendAmbAdv : L.legendAmbSimple}</span>`
    $$('#sa-speedSeg button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v! === S.speed)))
    $$('#sa-bgPills button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === 'custom' ? !!S.bgCustom : !S.bgCustom && +b.dataset.v! === S.bg)))
    $('#sa-bgO2Row').hidden = !S.bgCustom
    $('#sa-dcO2Row').hidden = S.dc !== 'custom'
    $$('#sa-dcPills button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S.dc)))
    allSteppers.forEach((s) => s.isConnected && s._show!())
    $<HTMLInputElement>('#sa-rDepth').value = String(S.depth)
    $('#sa-vDepth').innerHTML = `${S.depth}<small>m</small>`
    const bg = bottomGas(), bmod = E.modOf(bg, S.ppB, S.sp), dg = decoGas()
    const bgMod = $('#sa-bgMod')
    bgMod.textContent = tpl(L.pmu, { v: fmt(Math.floor(bmod * 10) / 10, 1) })
    bgMod.classList.toggle('bad', S.depth > bmod)
    $('#sa-swRow').hidden = !dg
    const dcMod = $('#sa-dcMod')
    dcMod.hidden = !dg
    if (dg) { const dmod = E.modOf(dg, S.ppD, S.sp); dcMod.textContent = tpl(L.pmu, { v: fmt(Math.floor(dmod * 10) / 10, 1) }); dcMod.classList.toggle('bad', S.sw > dmod) }
    const parts: string[] = []
    if (S.stops.length) parts.push(S.stops.map((s) => `${s.depth} m ${s.time}′`).join(', '))
    if (dg) parts.push(tpl(L.moreSumAt, { gas: gasName(dg), d: S.sw }))
    $('#sa-moreSum').textContent = parts.join(' · ') || L.moreEmpty
    const ch = E.checks(sim, { bottom: S.ppB, deco: S.ppD })
    $('#sa-checks').innerHTML = ch.map((c) => `<div class="alert">${esc(tpl(L.alertDeep, { gas: gasName(c.gas), d: fmt(c.depth, 0), mod: fmt(Math.floor(c.mod * 10) / 10, 1), pp: fmt(c.ppo2, 2), max: fmt(c.max, 1) }))}</div>`).join('')
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────
  function update() {
    cur = E.stateAt(sim, S.t)
    drawProfile()
    renderSay()
    renderCmp()
    if (S.mode === 'adv') { renderCurves(); render16() }
  }
  function changed() { compute(); syncUI(); update(); save() }

  renderStops()
  syncPlay()
  changed()
  let rz: ReturnType<typeof setTimeout> | undefined
  const ro = new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(update, 60) })
  ro.observe(root)

  return () => {
    cancelAnimationFrame(raf)
    clearTimeout(rz)
    ro.disconnect()
    timers.forEach((t) => { clearTimeout(t); clearInterval(t) })
    offs.forEach((f) => f())
  }
}
