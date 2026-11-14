'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent, ReactNode } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  BFT_Q, COEFS, CYCLE, DEFAULT_STATE, DIRS, HALF, KT_MMIN, KT_MS, SPECS, STORAGE_KEY, THRS, bft, calmWindows, clock, currentAt, driftOver,
  level, mod, rowsFromSimple, sample, sanitizeState, siteSimple, slacks, toMin,
} from '@/lib/courants/engine'
import type { CurState, NumKey, Site, Tab, Vec, Wind } from '@/lib/courants/engine'
import {
  Card, Fold, HowBlocks, Pill, SectionHead, Segmented, Stepper, SubLabel, T, TimeField, Toggle, U, clampTo, copyText, fill, makeNum,
  secondaryBtn, stepValue, useToast, usePersistentState,
} from './tool-ui'
import type { Lvl } from './tool-ui'

type Labels = typeof fr.courants
const COL = { flot: '#1284c7', jusant: '#0c3256', wind: '#9ca3af', fg: '#131418', muted: '#6b7280', line: '#e5e7eb' }
const LVL_COL: Record<Lvl, string> = { ok: '#1284c7', mid: '#f59e0b', low: '#dc2626' }
const LVL_BADGE: Record<Lvl, string> = { ok: 'bg-primary-50 text-primary-600', mid: 'bg-amber-50 text-amber-700', low: 'bg-red-50 text-red-700' }
const LVL_BOX: Record<Lvl, string> = { ok: 'border-l-primary bg-gray-50', mid: 'border-l-amber-500 bg-amber-50', low: 'border-l-red-600 bg-red-50' }
const LVL_TITLE: Record<Lvl, string> = { ok: 'text-primary-600', mid: 'text-amber-700', low: 'text-red-700' }

/** Arrondi au dixième des coordonnées SVG (évite un écart d'hydratation serveur / navigateur sur les sinus). */
const r1 = (x: number) => Math.round(x * 10) / 10

/** Flèche partant du centre (0, 0), longueur en unités SVG, cap en degrés (0 = nord). */
function Arrow({ len, dir, color, w, dash }: { len: number; dir: number; color: string; w: number; dash?: boolean }) {
  if (len < 0.5) return null
  const a = ((dir - 90) * Math.PI) / 180, x = Math.cos(a) * len, y = Math.sin(a) * len
  const hs = Math.min(10, Math.max(5, len * 0.3)), b1 = a + Math.PI - 0.45, b2 = a + Math.PI + 0.45
  return (
    <g>
      <line x1="0" y1="0" x2={r1(x - Math.cos(a) * hs * 0.6)} y2={r1(y - Math.sin(a) * hs * 0.6)} stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray={dash ? '4 4' : undefined} />
      <path d={`M${r1(x)} ${r1(y)} L${r1(x + Math.cos(b1) * hs)} ${r1(y + Math.sin(b1) * hs)} L${r1(x + Math.cos(b2) * hs)} ${r1(y + Math.sin(b2) * hs)}Z`} fill={color} />
    </g>
  )
}

function Compass({ c, L }: { c: ReturnType<typeof currentAt>; L: Labels['res'] }) {
  const R = 64, mx = Math.max(c.total.v, c.tide.v, c.wind.v, 0.5), sc = (R - 6) / mx
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30)
  return (
    <svg viewBox="-80 -80 160 160" role="img" aria-label={L.compassAria} className="h-auto w-[132px] shrink-0 sm:w-[150px]">
      <circle r={R} fill="#f9fafb" stroke={COL.line} />
      {ticks.map((d) => { const a = ((d - 90) * Math.PI) / 180; return <line key={d} x1={r1(Math.cos(a) * (R - 5))} y1={r1(Math.sin(a) * (R - 5))} x2={r1(Math.cos(a) * R)} y2={r1(Math.sin(a) * R)} stroke={COL.line} strokeWidth="2" /> })}
      {L.nesw.map((n, i) => { const a = ((i * 90 - 90) * Math.PI) / 180; return <text key={n} x={r1(Math.cos(a) * (R + 9))} y={r1(Math.sin(a) * (R + 9) + 4)} textAnchor="middle" fontSize="11" fontWeight="700" fill={COL.muted}>{n}</text> })}
      {c.wind.v > 0 && <Arrow len={c.wind.v * sc} dir={c.wind.dir} color={COL.wind} w={3} dash />}
      <Arrow len={c.tide.v * sc} dir={c.tide.dir} color={c.tide.phase === 'jusant' ? COL.jusant : COL.flot} w={3} />
      {c.wind.v > 0 && <Arrow len={c.total.v * sc} dir={c.total.dir} color={COL.fg} w={5} />}
      <circle r="4" fill={COL.fg} />
    </svg>
  )
}

/** Choix d'une direction : pas de 5° et 8 raccourcis. */
function DirPicker({ value, onChange, L }: { value: number; onChange: (d: number) => void; L: Labels['dir'] }) {
  const [draft, setDraft] = useState<string | null>(null)
  const set = (v: number) => onChange(mod(Math.round(v), 360))
  const btn = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-medium text-black shadow-soft transition-colors hover:border-primary hover:text-primary'
  return (
    <div>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 py-1.5 pl-3 pr-1.5">
        <span className="text-xs font-medium text-gray-500">{L.precise}</span>
        <div className="flex items-center gap-1">
          <button type="button" aria-label={L.minus} className={btn} onClick={() => set(value - 5)}>−</button>
          <label className="flex w-[64px] flex-col items-center leading-tight">
            <input inputMode="numeric" aria-label={L.aria} value={draft ?? String(Math.round(value)).padStart(3, '0')}
              onFocus={(e) => { setDraft(String(Math.round(value))); e.currentTarget.select() }}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
              onBlur={() => { const v = parseFloat(draft ?? ''); if (Number.isFinite(v)) set(v); setDraft(null) }}
              className="w-full border-b-2 border-transparent bg-transparent text-center text-[20px] font-extrabold tabular-nums text-black outline-none focus:border-primary" />
            <small className="text-[11px] font-semibold text-gray-500">{L.deg}</small>
          </label>
          <button type="button" aria-label={L.plus} className={btn} onClick={() => set(value + 5)}>+</button>
        </div>
      </div>
      <div className="mt-1.5 grid grid-cols-8 gap-1">
        {DIRS.map(([n, d], i) => (
          <button key={n} type="button" aria-pressed={Math.round(value) === d} onClick={() => set(d)}
            className={`min-h-9 rounded-lg border text-[12px] font-bold transition-colors ${Math.round(value) === d ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-black hover:border-primary'}`}>
            {L.eight[i]}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Largeur réelle d'un élément (graphe responsive). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.getBoundingClientRect().width))
    ro.observe(el)
    setW(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

export default function CurrentsCalculator({ labels }: { labels: Labels }) {
  const L = labels
  const [s, setS] = usePersistentState<CurState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const N = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const nf1 = (x: number) => N.d(x, 1)
  const kt = (v: number) => nf1(Math.round(v * 10) / 10)
  const card = (d: number) => L.cards[Math.round(mod(d, 360) / 22.5) % 16]
  const d3 = (d: number) => String(Math.round(mod(d, 360)) % 360).padStart(3, '0') + '°'
  const dirTxt = (d: number) => d3(d) + ' ' + card(d)
  const hm = (m: number) => { const sg = m < 0 ? '−' : '+'; m = Math.abs(Math.round(m)); return sg + Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') }
  const dur = (m: number) => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? h + ' h ' + String(r).padStart(2, '0') : r + ' min' }
  const relPM = (t: number) => { const w = mod(t + HALF, CYCLE) - HALF; return Math.abs(w) < 3 ? L.atPM : L.hw + ' ' + hm(w) }
  const dist = (m: number) => (m >= 1000 ? N.upTo(Math.round(m / 100) / 10, 1) + ' km' : Math.round(m / 10) * 10 + ' m')
  const { say, node: toast } = useToast(true)
  const resRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const set = <K extends keyof CurState>(k: K, v: CurState[K]) => setS((p) => ({ ...p, [k]: v }))
  const sp = { decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase }
  const stp = (k: NumKey, display: string) => ({
    display,
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) })),
    onSet: (v: number) => setS((p) => ({ ...p, [k]: +clampTo(Math.round(v / SPECS[k].step) * SPECS[k].step, SPECS[k].min, SPECS[k].max).toFixed(3) })),
    ...sp,
  })

  // ── Modèle ──
  const site: Site = s.mode === 'atlas' ? { mode: 'atlas', rows: s.rows } : siteSimple(s)
  const windOf = (on: boolean): Wind | null => (on && s.windOn && s.ws > 0 ? { speed: s.ws, from: s.wfrom, k: s.k / 100 } : null)
  const pm = toMin(s.pm)
  const d0 = toMin(s.dive), t0 = d0 - pm
  const w = windOf(true)

  const dive = useMemo(() => {
    const c = currentAt(site, t0, s.coef, w)
    const pts = ([['start', t0], ['mid', t0 + s.dur / 2], ['end', t0 + s.dur]] as const).map(([n, t]) => ({ n, t, c: currentAt(site, t, s.coef, w).total }))
    const sl = slacks(site, s.coef, t0 - 400, t0 + 800)
    const nextSl = sl.find((x) => x.t >= t0 - 1)
    const prevSl = [...sl].reverse().find((x) => x.t < t0 - 1)
    const drift = driftOver(site, s.coef, w, t0, s.dur)
    const vmax = Math.max(...sample(site, s.coef, w, t0, t0 + s.dur, 1).map((x) => x.total.v))
    const calmest = (s0: number) => {
      let bt = s0, bv = Infinity
      for (let t = s0 - 120; t <= s0 + 120; t++) { const v = currentAt(site, t, s.coef, w).total.v; if (v < bv) { bv = v; bt = t } }
      return bt
    }
    const nearSl = prevSl && prevSl.t - s.dur / 2 >= t0 - 15 ? prevSl.t : nextSl ? nextSl.t : null
    const best = nearSl == null ? null : w ? calmest(nearSl) : nearSl
    const vBest = best == null ? 0 : Math.max(...sample(site, s.coef, w, best - s.dur / 2, best + s.dur / 2, 1).map((x) => x.total.v))
    const tip = best != null && vmax >= 0.5 && vBest < vmax - 0.15 && Math.abs(best - s.dur / 2 - t0) >= 5
    return { c, pts, nextSl, prevSl, drift, vmax, best, vBest, tip }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, t0])
  const { c } = dive
  const lv = level(c.total.v)
  const cls = level(dive.vmax).k

  const when = (x: { t: number }) => (x.t - t0 < 1 ? L.res.now : fill(L.res.inT, { d: dur(x.t - t0) }))
  const lines: ReactNode[] = []
  if (dive.nextSl) lines.push(dive.nextSl.v < 0.2
    ? <>{L.res.nextSlack} <b>{clock(dive.nextSl.t + pm)}</b> ({when(dive.nextSl)})</>
    : <>{fill(L.res.noSlack, { v: kt(dive.nextSl.v) })} <b>{clock(dive.nextSl.t + pm)}</b> ({when(dive.nextSl)})</>)
  if (dive.prevSl && t0 - dive.prevSl.t < 90) lines.push(fill(dive.prevSl.v < 0.2 ? L.res.prevSlack : L.res.prevMin, { h: clock(dive.prevSl.t + pm), d: dur(t0 - dive.prevSl.t) }))
  lines.push(<>{fill(L.res.drift, { d: dur(s.dur) })} <b>{dist(dive.drift.dist)}</b> {fill(L.res.towards, { c: card(dive.drift.dir) })}</>)
  const title = dive.vmax < 0.5 ? L.res.titleWeak : dive.vmax < 1 ? L.res.titleMid : L.res.titleStrong
  const adv2 = dive.vmax >= 1 ? L.res.advStrong : dive.vmax >= 0.5 ? L.res.advMid : ''

  const summary = () => [
    fill(L.copyTpl.l1, { dive: s.dive, d: dur(s.dur), pm: s.pm, coef: s.coef }),
    fill(L.copyTpl.l2, { v: kt(c.total.v), dir: dirTxt(c.total.dir), w: w ? fill(L.copyTpl.wind, { t: kt(c.tide.v), w: kt(c.wind.v) }) : '' }),
    fill(L.copyTpl.l3, { v: kt(dive.vmax), d: dist(dive.drift.dist), c: card(dive.drift.dir) }),
    dive.nextSl ? fill(dive.nextSl.v < 0.2 ? L.copyTpl.slack : L.copyTpl.minV, { h: clock(dive.nextSl.t + pm) }) : '',
    L.copyTpl.foot,
  ].filter(Boolean).join('\n')

  const goTab = (t: Tab) => set('tab', t)
  const setDive = (m: number) => set('dive', clock(m))
  const nowDive = () => { const d = new Date(); setDive(Math.round((d.getHours() * 60 + d.getMinutes()) / 5) * 5) }
  const slackDive = () => { const n = slacks(site, s.coef, t0, t0 + 800)[0]; if (n) setDive(Math.round((n.t - s.dur / 2 + pm) / 5) * 5) }
  const meWarn = s.mode === 'simple' && (s.floodME > s.floodVE || (s.adv && s.ebbME > s.ebbVE))
  const coefTxt = s.coef < 55 ? L.s1.coefME : s.coef < 85 ? L.s1.coefMid : s.coef <= 100 ? L.s1.coefVE : L.s1.coefGVE

  return (
    <div className="flex flex-col gap-3 pb-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-7 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-3">
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <div className="grid gap-2">
            <TimeField label={L.s1.pm} sub={L.s1.pmSub} value={s.pm} aria={L.s1.pm} onChange={(v) => { if (v) set('pm', v) }} />
            <Stepper label={L.s1.coef} sub={coefTxt} unit="" ariaLabel={L.s1.coef} {...stp('coef', String(s.coef))} />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {COEFS.map((v, i) => (
              <button key={v} type="button" aria-pressed={s.coef === v} onClick={() => set('coef', v)}
                className={`min-h-11 rounded-xl border px-1 text-[13px] font-bold leading-tight transition-colors ${s.coef === v ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'}`}>
                {v}<small className="block text-[10.5px] font-medium opacity-80">{L.s1.coefQ[i]}</small>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <Segmented<'simple' | 'atlas'> ariaLabel={L.s2.title} value={s.mode} onChange={(v) => set('mode', v)}
            options={[{ v: 'simple', label: L.s2.simple }, { v: 'atlas', label: L.s2.atlas }]} />
          {s.mode === 'simple' ? (
            <>
              <SubLabel>{L.s2.max}</SubLabel>
              <div className="grid gap-2">
                <Stepper label={L.s2.ve} sub={L.s2.veSub} unit={L.knots} ariaLabel={L.s2.ve} {...stp('floodVE', nf1(s.floodVE))} />
                <Stepper label={L.s2.me} sub={L.s2.meSub} unit={L.knots} ariaLabel={L.s2.me} {...stp('floodME', nf1(s.floodME))} />
              </div>
              {meWarn && <div className="mt-2 rounded-xl border-l-[5px] border-l-amber-500 bg-amber-50 px-3 py-2 text-[13px] font-medium text-amber-800">{L.s2.meWarn}</div>}
              <SubLabel>{L.s2.floodDir} <span className="font-bold text-black">{dirTxt(s.floodDir)}</span></SubLabel>
              <DirPicker value={s.floodDir} onChange={(v) => set('floodDir', v)} L={L.dir} />
              <SubLabel>{L.s2.slack}</SubLabel>
              <Stepper label={L.s2.slackRel} sub={s.slack === 0 ? L.s2.slackAt : fill(L.s2.slackTxt, { h: hm(s.slack) })} unit="min" ariaLabel={L.s2.slack}
                {...stp('slack', s.slack === 0 ? '0' : hm(s.slack))} />
              <SubLabel>{L.s2.shape}</SubLabel>
              <Segmented<'sinus' | 'douziemes'> ariaLabel={L.s2.shape} value={s.profile} onChange={(v) => set('profile', v)}
                options={[{ v: 'sinus', label: L.s2.sinus, sub: L.s2.sinusSub }, { v: 'douziemes', label: L.s2.douz, sub: L.s2.douzSub }]} />
              <Fold title={L.s2.adv} sub={L.s2.advSub} open={s.adv} onToggle={(o) => { if (o !== s.adv) set('adv', o) }}>
                <div className="grid gap-2">
                  <Stepper label={L.s2.flood} sub={fill(L.s2.ebbTxt, { d: dur(CYCLE - s.flood) })} unit="min" ariaLabel={L.s2.flood} {...stp('flood', dur(s.flood))} />
                  <Stepper label={L.s2.ebbVE} sub={L.s2.veSub} unit={L.knots} ariaLabel={L.s2.ebbVE} {...stp('ebbVE', nf1(s.ebbVE))} />
                  <Stepper label={L.s2.ebbME} sub={L.s2.meSub} unit={L.knots} ariaLabel={L.s2.ebbME} {...stp('ebbME', nf1(s.ebbME))} />
                </div>
                <SubLabel>
                  {L.s2.ebbDir} <span className="font-bold text-black">{dirTxt(s.ebbDir)}</span>
                  <button type="button" onClick={() => set('ebbDir', mod(s.floodDir + 180, 360))} className="ml-2 font-semibold text-primary underline underline-offset-2">{L.s2.ebbOpp}</button>
                </SubLabel>
                <DirPicker value={s.ebbDir} onChange={(v) => set('ebbDir', v)} L={L.dir} />
              </Fold>
            </>
          ) : (
            <>
              <p className={`mb-2 mt-3 ${T.help}`}>{L.s2.atlasHelp}</p>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-[13px] tabular-nums">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                    <tr>{L.s2.atlasCols.map((h, i) => <th key={h} className={`px-2 py-2 ${i ? 'text-center' : 'text-left'}`}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {s.rows.map((r, i) => {
                      const h = i - 6
                      const cell = (f: 'dir' | 've' | 'me') => {
                        const shown = f === 'dir' ? String(Math.round(r.dir)) : N.d(r[f], 1)
                        return (
                          <td className="px-1 py-1">
                            <input key={`${f}${shown}`} inputMode={f === 'dir' ? 'numeric' : 'decimal'} defaultValue={shown} aria-label={`${L.s2.atlasCols[f === 'dir' ? 1 : f === 've' ? 2 : 3]} ${h}`}
                              onFocus={(e) => e.currentTarget.select()}
                              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                              onBlur={(e) => {
                                const txt = e.currentTarget.value
                                setS((p) => {
                                  const rows = p.rows.map((x) => ({ ...x }))
                                  const row = rows[i]
                                  // notation atlas « 12,06 » (dixièmes de nœud VE,ME) tapée dans une case de vitesse
                                  const m = /^\s*(\d{1,2})\s*[,;/-]\s*(\d{2})\s*$/.exec(txt)
                                  if (f !== 'dir' && m && (+m[1] >= 10 || m[2][0] === '0')) { row.ve = +m[1] / 10; row.me = +m[2] / 10 }
                                  else {
                                    let v = parseFloat(txt.replace(',', '.'))
                                    if (!Number.isFinite(v) || v < 0) v = 0
                                    if (f === 'dir') row.dir = mod(Math.round(v), 360)
                                    else row[f] = Math.min(15, Math.round(v * 10) / 10)
                                  }
                                  return { ...p, rows }
                                })
                              }}
                              className="h-9 w-full min-w-0 rounded-lg border border-gray-200 bg-white text-center font-semibold text-black outline-none focus:border-primary" />
                          </td>
                        )
                      }
                      return (
                        <tr key={h} className={`border-t border-gray-100 ${h === 0 ? 'bg-primary-50' : ''}`}>
                          <td className="whitespace-nowrap px-2 py-1 text-xs font-bold text-gray-700">{h === 0 ? L.hw : `${L.hw} ${h > 0 ? '+' : '−'}${Math.abs(h)}`}</td>
                          {cell('dir')}{cell('ve')}{cell('me')}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <button type="button" onClick={() => set('rows', rowsFromSimple(siteSimple(s)))} className="mt-2 text-[13px] font-semibold text-primary underline underline-offset-2">{L.s2.fillAtlas}</button>
            </>
          )}
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div ref={tabsRef} className="scroll-mt-24">
          <Segmented<Tab> ariaLabel={L.tabs.aria} value={s.tab} onChange={goTab} className="bg-white shadow-soft"
            options={(['plongee', 'jour', 'rose', 'methode'] as const).map((t) => ({ v: t, label: L.tabs[t] }))} />
        </div>

        {s.tab === 'plongee' && (
          <>
            <Card>
              <SectionHead no={3} title={L.s3.title} help={L.s3.help} />
              <div className="grid gap-2">
                <TimeField label={L.s3.dive} sub={relPM(t0)} value={s.dive} aria={L.s3.dive} onChange={(v) => { if (v) set('dive', v) }} action={{ label: L.s3.now, onClick: nowDive }} />
                <button type="button" onClick={slackDive} className={`${secondaryBtn} min-h-11`}>{L.s3.toSlack}</button>
                <Stepper label={L.s3.dur} unit="min" ariaLabel={L.s3.dur} {...stp('dur', String(s.dur))} />
              </div>
              <SubLabel>{L.s3.wind}</SubLabel>
              <Toggle label={L.s3.windOn} on={s.windOn} onChange={(v) => set('windOn', v)} />
              {s.windOn && (
                <div className="mt-2">
                  <Stepper label={L.s3.ws} sub={fill(L.s3.bft, { f: bft(s.ws) })} unit={L.knots} ariaLabel={L.s3.ws} {...stp('ws', String(s.ws))} />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {BFT_Q.map(([f, v]) => <Pill key={f} on={s.ws === v} onClick={() => set('ws', v)}>F{f}</Pill>)}
                  </div>
                  <SubLabel>{L.s3.wfrom} <span className="font-bold text-black">{dirTxt(s.wfrom)}</span></SubLabel>
                  <DirPicker value={s.wfrom} onChange={(v) => set('wfrom', v)} L={L.dir} />
                  <Fold title={L.s3.k} sub={`${nf1(s.k)} %`}>
                    <Stepper label={L.s3.kPart} sub={L.s3.kSub} unit="%" ariaLabel={L.s3.kPart} {...stp('k', nf1(s.k))} />
                  </Fold>
                </div>
              )}
            </Card>

            <div ref={resRef} className="scroll-mt-36">
              <Card aria-live="polite" className="border-l-[6px] border-l-primary">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-gray-500">{L.res.cap}</p>
                    <p key={kt(c.total.v)} className="animate-number-pop text-[52px] font-extrabold leading-[1.05] tabular-nums text-black max-[380px]:text-[44px]">{kt(c.total.v)}<U>{L.kt}</U></p>
                    <p className="text-[13px] font-medium leading-snug text-gray-500">
                      {fill(L.res.sub, { dir: dirTxt(c.total.dir), ms: nf1(c.total.v * KT_MS), mm: Math.round(c.total.v * KT_MMIN) })}
                    </p>
                    <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${LVL_BADGE[lv.k]}`}>{L.levels[lv.label]}</span>
                  </div>
                  <Compass c={c} L={L.res} />
                </div>
                <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200">
                  {([
                    [c.tide.phase === 'jusant' ? COL.jusant : COL.flot, L.res.tide, (c.tide.phase ? fill(L.res.phase, { p: L.res[c.tide.phase] }) : '') + fill(L.res.coef, { c: s.coef }), c.tide],
                    ...(w ? [
                      [COL.wind, L.res.windCur, fill(L.res.windTxt, { k: nf1(s.k), ws: s.ws, c: card(s.wfrom) }), c.wind],
                      [COL.fg, L.res.total, L.res.totalTxt, c.total],
                    ] : []),
                  ] as [string, string, string, Vec][]).map(([col, a, b, v]) => (
                    <div key={a} className="flex items-center gap-2.5 px-3 py-2">
                      <i className="h-3 w-3 shrink-0 rounded-full" style={{ background: col }} />
                      <span className="min-w-0 flex-1 text-[13px] font-semibold text-gray-700">{a}<small className="block text-xs font-medium text-gray-500">{b}</small></span>
                      <b className="whitespace-nowrap text-[14px] font-bold tabular-nums text-black">{kt(v.v)} {L.kt} · {card(v.dir)}</b>
                    </div>
                  ))}
                </div>
                <SubLabel>{L.res.during}</SubLabel>
                <div className="grid grid-cols-3 gap-2">
                  {dive.pts.map((p) => {
                    const mx = Math.max(1.5, ...dive.pts.map((q) => q.c.v)), l = level(p.c.v).k
                    return (
                      <div key={p.n} className="min-w-0 rounded-xl border border-gray-200 px-2.5 py-2">
                        <small className="block text-xs font-semibold text-gray-500">{L.res.pts[p.n]} · {clock(p.t + pm)}</small>
                        <b className="text-[20px] font-extrabold tabular-nums text-black">{kt(p.c.v)}</b> <span className="text-xs font-medium text-gray-500">{L.kt} {card(p.c.dir)}</span>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100"><i className="block h-full rounded-full" style={{ width: `${Math.min(100, (p.c.v / mx) * 100)}%`, background: LVL_COL[l] }} /></div>
                      </div>
                    )
                  })}
                </div>
                <div className={`mt-2.5 rounded-xl border-l-[5px] px-3 py-2.5 ${LVL_BOX[cls]}`}>
                  <p className={`text-[15px] font-extrabold leading-snug ${LVL_TITLE[cls]}`}>{title}</p>
                  <p className="text-[13px] font-medium leading-snug text-gray-600">{fill(L.res.maxDuring, { v: kt(dive.vmax) })} {adv2}</p>
                  <div className="mt-1.5 space-y-0.5 text-[13px] font-medium leading-snug text-gray-700">{lines.map((x, i) => <p key={i}>{x}</p>)}</div>
                  {dive.tip && dive.best != null && (
                    <div className="mt-2.5">
                      <button type="button" onClick={() => setDive(dive.best! - s.dur / 2 + pm)} className="min-h-11 w-full rounded-xl bg-primary px-4 text-[14px] font-bold text-white transition-colors hover:bg-primary-600">
                        {fill(L.res.useBest, { h: clock(dive.best - s.dur / 2 + pm) })}
                      </button>
                      <p className="mt-1 text-[12.5px] font-medium text-gray-600">
                        {fill(L.res.bestTxt, { what: w || (dive.nextSl && dive.nextSl.v >= 0.2) ? L.res.calmest : L.res.theSlack, h: clock(dive.best + pm), a: kt(dive.vBest), b: kt(dive.vmax) })}
                      </p>
                    </div>
                  )}
                </div>
                <button type="button" className={`${secondaryBtn} mt-3 w-full`} onClick={() => copyText(summary(), say, L.copied, L.copyFail)}>{L.copy}</button>
              </Card>
            </div>
          </>
        )}

        {s.tab === 'jour' && <DayTab s={s} site={site} windOf={windOf} pm={pm} L={L} kt={kt} card={card} relPM={relPM} dur={dur} nf1={nf1}
          setThr={(v) => set('thr', v)} stpThr={stp('thr', nf1(s.thr))} setDayWind={(v) => set('dayWind', v)}
          plunge={(m) => { setS((p) => ({ ...p, dive: clock(m), tab: 'plongee' })); tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} />}

        {s.tab === 'rose' && <RoseTab s={s} site={site} windOf={windOf} pm={pm} t0={t0} L={L} kt={kt} dirTxt={dirTxt} nf1={nf1} setRoseWind={(v) => set('roseWind', v)} />}

        {s.tab === 'methode' && (
          <Card className="space-y-2 text-[13.5px] font-medium leading-relaxed text-gray-700">
            <HowBlocks sections={L.method.sections} foot={L.method.foot} />
          </Card>
        )}
      </div>

      {/* Barre résultat fixe en bas sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => { goTab('plongee'); setTimeout(() => resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30) }}
          className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 text-white">
          <span className="text-[13px] font-semibold opacity-90">{fill(L.cta, { h: s.dive })} · {L.levels[lv.label]}</span>
          <b className="text-xl font-extrabold tabular-nums">{kt(c.total.v)} {L.kt}</b>
        </button>
      </div>
      {toast}
    </div>
  )
}

type Common = {
  s: CurState; site: Site; windOf: (on: boolean) => Wind | null; pm: number; L: Labels; kt: (v: number) => string; nf1: (x: number) => string
}

function DayTab({ s, site, windOf, pm, L, kt, card, relPM, dur, nf1, stpThr, setThr, setDayWind, plunge }: Common & {
  card: (d: number) => string; relPM: (t: number) => string; dur: (m: number) => string
  stpThr: Omit<Parameters<typeof Stepper>[0], 'label' | 'unit' | 'ariaLabel'>; setThr: (v: number) => void; setDayWind: (v: boolean) => void; plunge: (m: number) => void
}) {
  const [boxRef, cw] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const w = s.dayWind ? windOf(true) : null
  const W = Math.round(Math.max(300, cw || 640)), H = W < 500 ? 250 : 280
  const Lf = 30, Rt = 14, Tp = 36, B = 52, pw = W - Lf - Rt, ph = H - Tp - B, narrow = W < 500
  const d0 = toMin(s.dive)
  const data = useMemo(() => {
    const day: { m: number; v: number }[] = []
    for (let m = 0; m <= 1440; m += 15) day.push({ m, v: currentAt(site, m - pm, s.coef, w).total.v })
    const bars = day.slice(0, 96).map((d) => currentAt(site, d.m + 7.5 - pm, s.coef, w).total.v)
    const arrows: { h: number; c: Vec }[] = []
    for (let h = 1; h < 24; h += narrow ? 2 : 1) arrows.push({ h, c: currentAt(site, h * 60 - pm, s.coef, w).total })
    const wins = calmWindows(site, s.coef, w, s.thr, -pm, 1440 - pm)
    return { vmax: Math.max(1, ...day.map((d) => d.v)), bars, arrows, wins }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, pm, narrow])
  const top = Math.ceil(data.vmax * 2) / 2
  const X = (m: number) => Lf + (m / 1440) * pw, Y = (v: number) => Tp + ph - (v / top) * ph
  const grid: number[] = []
  for (let v = 0; v <= top + 1e-9; v += top > 3 ? 1 : 0.5) grid.push(v)
  const hours: number[] = []
  for (let h = 0; h <= 24; h += narrow ? 6 : 3) hours.push(h)
  const tides: { k: 'pm' | 'bm'; m: number }[] = []
  for (let k = -2; k <= 2; k++) { const p = pm + k * CYCLE, b = p + HALF; if (p >= 0 && p <= 1440) tides.push({ k: 'pm', m: p }); if (b >= 0 && b <= 1440) tides.push({ k: 'bm', m: b }) }
  const bw = pw / 96
  const readM = hover ?? mod(d0, 1440)
  const rc = currentAt(site, readM - pm, s.coef, w).total, rl = level(rc.v).k
  const fmtV = (v: number) => nf1(v).replace(/[,.]0$/, '')
  const go = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    setHover(Math.round(Math.min(1440, Math.max(0, ((px - Lf) / pw) * 1440)) / 5) * 5)
  }
  return (
    <>
      <Card>
        <SectionHead title={L.day.title} help={L.day.help} />
        <div ref={boxRef}>
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-none select-none" role="img" aria-label={L.day.title}
            onPointerDown={(e) => { go(e); e.currentTarget.setPointerCapture(e.pointerId) }}
            onPointerMove={(e) => { if (e.buttons || e.pointerType === 'mouse') go(e) }}
            onPointerLeave={() => setHover(null)}>
            <g fontSize="10.5" fill={COL.muted}>
              {grid.map((v) => <g key={v}><line x1={Lf} x2={W - Rt} y1={Y(v)} y2={Y(v)} stroke={COL.line} /><text x={Lf - 6} y={Y(v) + 4} textAnchor="end">{fmtV(v)}</text></g>)}
              <text x={Lf - 6} y={Tp - 6} textAnchor="end">{L.kt}</text>
            </g>
            {[[d0, d0 + s.dur], [d0 - 1440, d0 + s.dur - 1440]].map(([a, b], i) => {
              const x1 = Math.max(0, a), x2 = Math.min(1440, b)
              return x2 > x1 ? <rect key={i} x={X(x1)} y={Tp} width={X(x2) - X(x1)} height={ph} fill="#1284c7" opacity=".12" rx="3" /> : null
            })}
            {data.bars.map((v, i) => <rect key={i} x={X(i * 15) + 0.6} y={Y(v)} width={bw - 1.2} height={Math.max(0.5, Tp + ph - Y(v))} fill={LVL_COL[level(v).k]} rx="1" />)}
            {s.thr < top && <line x1={Lf} x2={W - Rt} y1={Y(s.thr)} y2={Y(s.thr)} stroke={COL.fg} strokeDasharray="5 4" opacity=".55" />}
            <g fontSize="10.5" fill={COL.muted}>
              {hours.map((h) => <g key={h}><line x1={X(h * 60)} x2={X(h * 60)} y1={Tp + ph} y2={Tp + ph + 4} stroke="#9ca3af" /><text x={X(h * 60)} y={Tp + ph + 16} textAnchor="middle">{h}h</text></g>)}
              {tides.map((t) => t.k === 'pm'
                ? <g key={`p${t.m}`}><path d={`M${X(t.m)} ${Tp + ph + 22}l-5 8h10z`} fill="#1284c7" /><text x={X(t.m)} y={Tp + ph + 44} textAnchor="middle" fontWeight="700" fill="#1284c7">{narrow ? '' : `${L.hw} `}{clock(t.m)}</text></g>
                : <g key={`b${t.m}`}><path d={`M${X(t.m)} ${Tp + ph + 30}l-5 -8h10z`} fill={COL.muted} /><text x={X(t.m)} y={Tp + ph + 44} textAnchor="middle">{narrow ? '' : `${L.day.bm} `}{clock(t.m)}</text></g>)}
            </g>
            {data.arrows.map(({ h, c }) => c.v < 0.1
              ? <circle key={h} cx={X(h * 60)} cy="12" r="1.8" fill={COL.muted} />
              : <g key={h} transform={`translate(${X(h * 60).toFixed(1)} 12) rotate(${c.dir.toFixed(0)})`} stroke={LVL_COL[level(c.v).k]} strokeWidth="2" strokeLinecap="round" fill="none"><path d="M0 7V-7M-4 -3 0 -7 4 -3" /></g>)}
            {hover != null && <line x1={X(hover)} x2={X(hover)} y1={Tp} y2={Tp + ph} stroke={COL.fg} strokeWidth="1.5" opacity=".7" />}
          </svg>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 text-[13px]">
          <span className="font-medium text-gray-700">{hover == null ? `${L.day.atDive} · ` : ''}<b className="font-bold text-black">{clock(readM)}</b> <span className="text-xs text-gray-500">{relPM(readM - pm)}</span></span>
          <span><b className="font-bold tabular-nums" style={{ color: LVL_COL[rl] }}>{kt(rc.v)} {L.kt}</b> <span className="text-xs text-gray-500">{fill(L.res.towards, { c: card(rc.dir) })}</span></span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-xs font-medium text-gray-500">
          {(['ok', 'mid', 'low'] as const).map((k) => <span key={k}><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] align-[-1px]" style={{ background: LVL_COL[k] }} />{L.day.keys[k]}</span>)}
          <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] bg-primary/20 align-[-1px]" />{L.day.keys.dive}</span>
          <span>┅ {L.day.keys.thr}</span>
          <span className="text-primary">▲ {L.hw}</span><span>▼ {L.day.bm}</span>
        </div>
        {s.windOn && <Toggle className="mt-3" label={L.day.withWind} on={s.dayWind} onChange={setDayWind} />}
      </Card>

      <Card>
        <SectionHead title={L.wins.title} help={L.wins.help} />
        <Stepper label={L.wins.thr} unit={L.knots} ariaLabel={L.wins.thr} {...stpThr} />
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {THRS.map((v, i) => (
            <button key={v} type="button" aria-pressed={s.thr === v} onClick={() => setThr(v)}
              className={`min-h-11 rounded-xl border px-1 text-[13px] font-bold leading-tight transition-colors ${s.thr === v ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'}`}>
              {nf1(v).replace(/[,.]0$/, '')} {L.kt}{L.wins.thrQ[i] && <small className="block text-[10.5px] font-medium opacity-80">{L.wins.thrQ[i]}</small>}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2">
          {data.wins.length ? data.wins.map((x) => {
            const a = x.start + pm, b = x.end + pm, len = x.end - x.start
            const short = !x.openStart && !x.openEnd && len < s.dur
            return (
              <div key={x.start} className={`flex items-center gap-3 rounded-xl border border-l-[5px] border-gray-200 px-3 py-2 ${short ? 'border-l-amber-500' : 'border-l-primary'}`}>
                <div className="min-w-0 flex-1">
                  <b className="block text-[15px] font-extrabold tabular-nums text-black">
                    {x.openStart && x.openEnd ? L.wins.allDay : `${x.openStart ? L.wins.from : ''}${clock(a)} → ${x.openEnd ? '24:00' : clock(b)}`}
                  </b>
                  <span className="text-[12px] font-medium text-gray-500">
                    {fill(L.wins.line, { d: dur(len), thr: nf1(s.thr), v: kt(x.min), h: clock(x.tMin + pm) })}
                    {short && <b className="font-semibold text-amber-700"> · {fill(L.wins.short, { d: dur(s.dur) })}</b>}
                  </span>
                </div>
                <button type="button" onClick={() => plunge(x.tMin - s.dur / 2 + pm)} className="min-h-10 shrink-0 rounded-full border border-primary px-3 text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white">{L.wins.dive}</button>
              </div>
            )
          }) : (
            <div className="rounded-xl border-l-[5px] border-l-amber-500 bg-amber-50 px-3 py-2.5">
              <p className="text-[15px] font-extrabold text-amber-700">{fill(L.wins.noneT, { thr: nf1(s.thr) })}</p>
              <p className="text-[13px] font-medium text-gray-600">{L.wins.none}{w ? L.wins.noneWind : ''}. {L.wins.noneTip}</p>
            </div>
          )}
        </div>
      </Card>
    </>
  )
}

function RoseTab({ s, site, windOf, pm, t0, L, kt, dirTxt, nf1, setRoseWind }: Common & { t0: number; dirTxt: (d: number) => string; setRoseWind: (v: boolean) => void }) {
  const w = s.roseWind ? windOf(true) : null, hr = CYCLE / 12
  const pts = Array.from({ length: 13 }, (_, i) => { const h = i - 6, t = h * hr; return { h, t, c: currentAt(site, t, s.coef, w).total } })
  const vmax = Math.max(0.5, ...pts.map((p) => p.c.v)), stepR = vmax > 3 ? 1 : 0.5, top = Math.ceil(vmax / stepR) * stepR, R = 130, sc = R / top
  const rings: number[] = []
  for (let v = stepR; v <= top + 1e-9; v += stepR) rings.push(v)
  const tw = mod(t0 + HALF, CYCLE) - HALF, hDive = Math.round(tw / hr)
  const col = (h: number) => (h < 0 ? COL.flot : h > 0 ? COL.jusant : COL.fg)
  const tip = (p: (typeof pts)[number]) => { const a = ((p.c.dir - 90) * Math.PI) / 180; return [Math.cos(a) * p.c.v * sc, Math.sin(a) * p.c.v * sc] }
  // étiquettes : regroupe les heures dont les pointes se touchent (même direction, rayons proches)
  const lab = pts.filter((p) => p.c.v * sc >= 14).map((p) => ({ p, r: p.c.v * sc, db: Math.round(p.c.dir / 10) % 36 })).sort((x, y) => x.db - y.db || x.r - y.r)
  const groups: { db: number; dir: number; last: number; rmax: number; items: (typeof pts)[number][] }[] = []
  lab.forEach((it) => {
    const g = groups[groups.length - 1]
    if (g && g.db === it.db && it.r - g.last < 20) { g.items.push(it.p); g.last = it.r; g.rmax = it.r }
    else groups.push({ db: it.db, dir: it.p.c.dir, last: it.r, rmax: it.r, items: [it.p] })
  })
  const hLbl = (h: number) => (h === 0 ? L.hw : (h > 0 ? '+' : '−') + Math.abs(h))
  return (
    <Card>
      <SectionHead title={L.rose.title} help={L.rose.help} />
      <svg viewBox="-170 -170 340 340" role="img" aria-label={L.rose.title} className="mx-auto block h-auto w-full max-w-[420px]">
        <g fontSize="10.5" fill={COL.muted}>
          {rings.map((v) => <g key={v}><circle r={v * sc} fill="none" stroke={COL.line} /><text x="3" y={-v * sc - 3}>{nf1(v).replace(/[,.]0$/, '')} {L.kt}</text></g>)}
        </g>
        {DIRS.map(([, d], i) => {
          const a = ((d - 90) * Math.PI) / 180
          return <g key={d}><line x1="0" y1="0" x2={r1(Math.cos(a) * R)} y2={r1(Math.sin(a) * R)} stroke={COL.line} /><text x={r1(Math.cos(a) * (R + 16))} y={r1(Math.sin(a) * (R + 16) + 4)} textAnchor="middle" fontSize="11" fontWeight="700" fill={COL.muted}>{L.dir.eight[i]}</text></g>
        })}
        <polyline points={pts.map((p) => tip(p).map((x) => x.toFixed(1)).join(',')).join(' ')} fill="none" stroke={COL.muted} strokeDasharray="2 3" opacity=".6" />
        {pts.map((p) => <g key={p.h} opacity={p.h === hDive ? 1 : 0.8}><Arrow len={p.c.v * sc} dir={p.c.dir} color={col(p.h)} w={p.h === hDive ? 4 : 2.2} /></g>)}
        {groups.map((g) => {
          const a = ((g.dir - 90) * Math.PI) / 180, r = g.rmax - 6, nx = Math.sin(a) * 11, ny = -Math.cos(a) * 11
          const items = [...g.items].sort((x, y) => x.h - y.h)
          return (
            <text key={`${g.db}-${g.rmax}`} x={(Math.cos(a) * r + nx).toFixed(1)} y={(Math.sin(a) * r + ny + 4).toFixed(1)} textAnchor="middle" fontSize="11" fontWeight="700">
              {items.map((p, i) => <tspan key={p.h} fill={col(p.h)}>{i ? ' ' : ''}{hLbl(p.h)}</tspan>)}
            </text>
          )
        })}
        <circle r="3.5" fill={COL.fg} />
      </svg>
      <div className="mt-1 flex flex-wrap justify-center gap-x-3.5 gap-y-1 text-xs font-medium text-gray-500">
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-[-1px]" style={{ background: COL.flot }} />{L.rose.before}</span>
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-[-1px]" style={{ background: COL.jusant }} />{L.rose.after}</span>
      </div>
      {s.windOn && <Toggle className="mt-3" label={L.day.withWind} on={s.roseWind} onChange={setRoseWind} />}
      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-[13px] tabular-nums">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
            <tr>{L.rose.cols.map((h, i) => <th key={h} className={`px-2.5 py-2 ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr>
          </thead>
          <tbody className="font-medium text-gray-700">
            {pts.map((p) => (
              <tr key={p.h} className={`border-t border-gray-100 ${p.h === hDive ? 'bg-primary-50 font-bold' : ''}`}>
                <td className="px-2.5 py-1.5"><i className="mr-1.5 inline-block h-2 w-2 rounded-full align-[1px]" style={{ background: col(p.h) }} />{p.h === 0 ? L.hw : `${L.hw} ${hLbl(p.h)}`}</td>
                <td className="px-2.5 py-1.5">{clock(pm + p.t)}</td>
                <td className="px-2.5 py-1.5">{p.c.v < 0.05 ? '–' : dirTxt(p.c.dir)}</td>
                <td className="px-2.5 py-1.5 text-right"><b style={{ color: LVL_COL[level(p.c.v).k] }}>{kt(p.c.v)}</b> {L.kt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
