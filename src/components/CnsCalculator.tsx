'use client'

import { useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  DECAY_STEPS, DEFAULT_STATE, MAX_LEVELS, MIXES_BOTTOM, MIXES_DECO, NOAA, SPECS, STORAGE_KEY, compute, decay, lastLevelDepth,
  nextBudget, planOf, ppO2, resEff, sanitizeState, stopDepths, stopGas, usedNoaaRows,
} from '@/lib/cns/engine'
import type { CnsState, NumKey, Seg } from '@/lib/cns/engine'
import {
  Card, Formula, Gauge, HowCard, LVL_TXT, Rich, SectionHead, Segmented, Stepper, SubLabel, T, Tile, U, Verdict, clampTo,
  copyText, fill, makeNum, secondaryBtn, stepValue, usePersistentState, useToast,
} from './tool-ui'

type Labels = typeof fr.cns
const GAS = { o2: '#16a34a', nx: '#eab308' }
const SEGCOL = { fond: '#1284c7', niveau: '#7dd3fc', palier: '#0c4a6e', rem: '#9ca3af' }
const gasColor = (pct: number) => (pct >= 100 ? GAS.o2 : GAS.nx)
const E9 = 1e-9

/** Pastille de PpO2 : bleu Orque, orange au-delà de 1,4, rouge au-delà de 1,6. */
function PpPill({ pp, children }: { pp: number; children: ReactNode }) {
  const c = pp > 1.6 + E9 ? 'bg-red-50 text-red-700' : pp > 1.4 + E9 ? 'bg-amber-50 text-amber-700' : 'bg-primary-50 text-primary-600'
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-semibold tabular-nums ${c}`}>{children}</span>
}

function Toggle({ label, sub, on, onChange }: { label: string; sub: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
      <span className="text-[14px] font-semibold leading-snug text-gray-700">
        {label}
        <small className="block text-xs font-medium text-gray-500">{sub}</small>
      </span>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${on ? 'bg-primary' : 'bg-gray-300'}`}>
        <i className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </label>
  )
}

export default function CnsCalculator({ labels, locale }: { labels: Labels; locale: string }) {
  const L = labels
  const n = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const [s, setS] = usePersistentState<CnsState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const toast = useToast(true)
  const resRef = useRef<HTMLDivElement>(null)

  const f0 = (x: number) => n.d(Number.isFinite(x) ? x : 0, 0)
  const f1 = (x: number) => n.d(Number.isFinite(x) ? x : 0, 1)
  const f2 = (x: number) => n.d(Number.isFinite(x) ? x : 0, 2)
  const fmtMin = (m: number) => {
    if (!Number.isFinite(m)) return '∞'
    m = Math.floor(m)
    if (m < 60) return `${m} min`
    const h = Math.floor(m / 60), r = m % 60
    return `${h} h${r ? ` ${String(r).padStart(2, '0')}` : ''}`
  }
  const mixName = (p: number) => (p === 21 ? L.mixAir : p === 100 ? L.mixO2 : `Nx${f0(p)}`)
  const sp = { decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase }
  const num = (k: NumKey) => ({
    display: f0(s[k]),
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) })),
    onSet: (v: number) => setS((p) => ({ ...p, [k]: clampTo(Math.round(v / SPECS[k].step) * SPECS[k].step, SPECS[k].min, SPECS[k].max) })),
    ...sp,
  })
  const lvlStp = (i: number, k: 'd' | 't') => {
    const sp2 = k === 'd' ? SPECS.lvlD : SPECS.lvlT
    const upd = (f: (v: number) => number) => setS((p) => ({ ...p, levels: p.levels.map((l, j) => (j === i ? { ...l, [k]: f(l[k]) } : l)) }))
    return {
      display: f0(s.levels[i][k]),
      onBump: (dir: -1 | 1) => upd((v) => stepValue(v, dir, sp2.step, sp2.min, sp2.max)),
      onSet: (v: number) => upd(() => clampTo(Math.round(v), sp2.min, sp2.max)),
      ...sp,
    }
  }
  const stopStp = (d: number) => {
    const upd = (f: (v: number) => number) => setS((p) => ({ ...p, stops: { ...p.stops, [d]: f(p.stops[d] || 0) } }))
    return {
      display: f0(s.stops[d] || 0),
      onBump: (dir: -1 | 1) => upd((v) => stepValue(v, dir, SPECS.stop.step, SPECS.stop.min, SPECS.stop.max)),
      onSet: (v: number) => upd(() => clampTo(Math.round(v), SPECS.stop.min, SPECS.stop.max)),
      ...sp,
    }
  }

  // ── Calculs (modèle) ──
  const RES = resEff(s)
  const r = compute(planOf(s))
  const depths = stopDepths(s)
  const lastD = lastLevelDepth(s)
  const nd = Math.max(...depths) + 3
  const lvl = r.total > 100 ? 'low' : r.total > 80 ? 'mid' : 'ok'
  const lbl = r.total > 100 ? L.res.lblOver100 : r.total > 80 ? L.res.lblOver80 : r.total > 50 ? L.res.lblUnder80 : L.res.lblComfort
  const t80 = r.tbMax80
  const nb = nextBudget(r.exact, 180, s.half)

  const segLabel = (g: Seg) => g.kind === 'fond' ? L.detail.fond
    : g.kind === 'niveau' ? fill(L.detail.niveau, { d: g.depth })
      : g.kind === 'palier' ? fill(L.detail.palier, { d: g.depth })
        : fill((g.to ?? 0) > (g.from ?? 0) ? L.detail.descent : L.detail.ascent, { a: g.from ?? 0, b: g.to ?? 0 })
  const segCol = (g: Seg) => (g.kind === 'palier' && g.deco ? gasColor(Math.round(g.fo2 * 100)) : SEGCOL[g.kind])

  const alerts: { tone: 'mid' | 'low'; t: string; x: string }[] = []
  if (r.ppB > 1.6 + E9) alerts.push({ tone: 'low', t: fill(L.alerts.ppHigh, { pp: f2(r.ppB) }), x: fill(L.alerts.ppHighTox, { m: f0(Math.floor((1.6 / (s.fo2 / 100) - 1) * 10)) }) })
  else if (r.ppB > 1.4 + E9) alerts.push({ tone: 'mid', t: fill(L.alerts.ppHigh, { pp: f2(r.ppB) }), x: L.alerts.ppHighMid })
  const badLvl = r.segs.find((g) => g.kind === 'niveau' && g.pp > 1.6 + E9)
  if (badLvl) alerts.push({ tone: 'low', t: fill(L.alerts.lvlHigh, { seg: segLabel(badLvl), pp: f2(badLvl.pp) }), x: L.alerts.lvlHighX })
  const ignored = depths.filter((d) => s.stops[d] > 0 && d >= r.lastDepth)
  if (ignored.length) alerts.push({ tone: 'mid', t: fill(ignored.length > 1 ? L.alerts.ignoredPl : L.alerts.ignored, { list: ignored.join(', ') }), x: fill(L.alerts.ignoredX, { d: r.lastDepth }) })
  const badStop = r.segs.find((g) => g.kind === 'palier' && g.pp > 1.6 + E9)
  if (badStop) alerts.push({ tone: 'low', t: fill(L.alerts.lvlHigh, { seg: segLabel(badStop), pp: f2(badStop.pp) }), x: L.alerts.stopHighX })
  if (r.total > 100) alerts.push({ tone: 'low', t: L.alerts.over100, x: L.alerts.over100X })
  else if (r.total > 80) alerts.push({ tone: 'mid', t: L.alerts.over80, x: L.alerts.over80X })

  const used = usedNoaaRows(r, s.method)
  const setSum = `${s.ascent ? fill(L.set.ascOn, { v: s.v }) : L.set.ascOff} · ${s.method === 'up' ? L.set.upShort : L.set.interpShort}${s.half === 120 ? ` · ${L.set.halfShort}` : ''}`
  const totDen = Math.max(r.exact, 1e-9)

  const copy = () => {
    const lines = [fill(L.copyText.total, { t: f0(r.total), e: f1(r.exact) })]
    if (RES) lines.push(fill(L.copyText.residual, { r: f0(RES) }))
    for (const g of r.segs) if (g.t > 0) lines.push(fill(L.copyText.seg, { seg: segLabel(g), mix: mixName(Math.round(g.fo2 * 100)), pp: f2(g.pp), t: g.kind === 'rem' ? f1(g.t) : f0(g.t), c: f1(g.cns) }))
    lines.push(fill(L.copyText.table, { m: s.method === 'up' ? L.copyText.up : L.copyText.interp }))
    copyText(lines.join('\n'), toast.say, L.toast.copied, L.toast.fail)
  }
  const reset = () => {
    setS({ ...JSON.parse(JSON.stringify(DEFAULT_STATE)), half: s.half })
    toast.say(L.toast.reset)
  }

  const mixBtn = (on: boolean) => `min-h-[42px] rounded-xl border text-[13px] font-bold tabular-nums transition-all duration-200 ease-out-expo active:scale-95 ${on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'}`
  const addBtn = 'mt-2 min-h-[46px] w-full rounded-xl border-[1.5px] border-dashed border-gray-300 text-sm font-semibold text-primary transition-colors hover:border-primary disabled:cursor-default disabled:text-gray-400 disabled:hover:border-gray-300'

  return (
    <div className="flex flex-col gap-3 pb-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-7 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-3">
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <Segmented ariaLabel={L.s1.title} value={s.resMode} onChange={(v) => setS((p) => ({ ...p, resMode: v }))}
            options={[{ v: 'known', label: L.s1.known, sub: L.s1.knownSub }, { v: 'prev', label: L.s1.prev, sub: L.s1.prevSub }]} />
          <div className="mt-2 grid gap-2">
            {s.resMode === 'prev' ? (
              <>
                <Stepper label={L.s1.prevCns} sub={L.s1.prevCnsSub} unit="%" ariaLabel={L.s1.prevCnsAria} {...num('prevCns')} />
                <Stepper label={L.s1.si} sub={s.si >= 60 ? `= ${fmtMin(s.si)}` : L.s1.siSince} unit="min" ariaLabel={L.s1.siAria} {...num('si')} />
                <div className="flex items-center justify-between gap-2 px-1 text-[13px] font-medium text-gray-600">
                  <span>{L.s1.resCalc} <small className="text-gray-500">{fill(L.s1.resHalf, { h: s.half })}</small></span>
                  <PpPill pp={RES > 80 ? 1.5 : 1}>{f0(RES)} %</PpPill>
                </div>
              </>
            ) : (
              <Stepper label={L.s1.res} sub={L.s1.resSub} unit="%" ariaLabel={L.s1.resAria} {...num('res')} />
            )}
          </div>
          <a href={`/${locale}/cns-intervalle`} className="mt-3 inline-block text-[13px] font-semibold text-primary underline-offset-2 hover:underline">{L.s1.interval} →</a>
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <SubLabel first>{L.s2.mix}</SubLabel>
          <div className="mb-2 grid grid-cols-5 gap-1.5">
            {MIXES_BOTTOM.map((m) => (
              <button key={m} type="button" aria-pressed={s.fo2 === m} onClick={() => setS((p) => ({ ...p, fo2: m }))} className={mixBtn(s.fo2 === m)}>{mixName(m)}</button>
            ))}
          </div>
          <div className="grid gap-2">
            <Stepper label={L.s2.o2} sub={L.s2.o2Sub} unit="% O2" ariaLabel={L.s2.o2Aria} {...num('fo2')} />
            <Stepper label={L.s2.depth} unit="m" ariaLabel={L.s2.depthAria} {...num('depth')} />
            <Stepper label={L.s2.tb} unit="min" ariaLabel={L.s2.tbAria} {...num('tb')} />
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[13px] font-medium text-gray-600">
            <span>{L.s2.ppB}</span><PpPill pp={r.ppB}>{f2(r.ppB)} bar</PpPill>
          </div>
          {s.levels.map((l, i) => {
            const pp = ppO2(s.fo2 / 100, +l.d || 0), no = i + 2
            return (
              <div key={i} className="mt-2 rounded-xl border border-gray-200 p-2">
                <div className="mx-1 mb-1.5 flex items-center gap-2">
                  <b className="text-sm font-bold text-black">{fill(L.s2.level, { n: no })}</b>
                  <span className="ml-auto"><PpPill pp={pp}>PpO2 {f2(pp)}</PpPill></span>
                  <button type="button" aria-label={fill(L.s2.levelDel, { n: no })} onClick={() => setS((p) => ({ ...p, levels: p.levels.filter((_, j) => j !== i) }))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-400 hover:bg-red-50 hover:text-red-600">×</button>
                </div>
                <div className="grid gap-1.5">
                  <Stepper label={L.s2.depth} unit="m" ariaLabel={fill(L.s2.levelD, { n: no })} {...lvlStp(i, 'd')} />
                  <Stepper label={L.s2.time} unit="min" ariaLabel={fill(L.s2.levelT, { n: no })} {...lvlStp(i, 't')} />
                </div>
              </div>
            )
          })}
          <button type="button" className={addBtn} disabled={s.levels.length >= MAX_LEVELS}
            onClick={() => setS((p) => {
              const prev = p.levels.length ? p.levels[p.levels.length - 1].d : p.depth
              return { ...p, levels: [...p.levels, { d: Math.max(3, Math.round((prev * 0.6) / 3) * 3), t: 10 }] }
            })}>
            {L.s2.add}
          </button>
        </Card>

        <Card className="flex flex-col lg:flex-1">
          <SectionHead no={3} title={L.s3.title} help={L.s3.help} />
          <SubLabel first>{L.s3.deco}</SubLabel>
          <div className="mb-2 grid grid-cols-4 gap-1.5">
            {MIXES_DECO.map((m) => (
              <button key={m} type="button" aria-pressed={s.fo2Deco === m} onClick={() => setS((p) => ({ ...p, fo2Deco: m, gasSel: {} }))} className={mixBtn(s.fo2Deco === m)}>
                {m === 0 ? L.none : mixName(m)}
              </button>
            ))}
          </div>
          <div className="grid gap-1.5">
            {depths.map((d) => {
              const hidden = d >= lastD && !s.stops[d] && !s.extra.includes(d)
              if (hidden) return null
              const g = stopGas(s, d), gp = g === 'deco' ? s.fo2Deco : s.fo2, pp = ppO2(gp / 100, d)
              const bad = pp > 1.6 + E9
              return (
                <Stepper key={d} unit="min" ariaLabel={fill(L.s3.stopAria, { d })} {...stopStp(d)}
                  label={
                    <span className="flex flex-wrap items-center gap-1.5">
                      <b className={`min-w-[34px] text-base font-extrabold tabular-nums ${s.stops[d] ? 'text-black' : 'text-gray-400'}`}>{d} m</b>
                      <button type="button" disabled={!s.fo2Deco} title={s.fo2Deco ? L.s3.gasHint : undefined}
                        onClick={() => setS((p) => ({ ...p, gasSel: { ...p.gasSel, [d]: stopGas(p, d) === 'deco' ? 'fond' : 'deco' } }))}
                        className={`min-h-[28px] whitespace-nowrap rounded-full border-[1.5px] bg-white px-2 text-[11.5px] font-bold tabular-nums ${bad ? 'border-red-600 text-red-700' : g === 'deco' ? 'text-black' : 'border-gray-200 text-gray-500'} ${s.fo2Deco ? 'cursor-pointer' : 'cursor-default'}`}
                        style={g === 'deco' && !bad ? { borderColor: gasColor(s.fo2Deco) } : undefined}>
                        {mixName(gp)} · {f2(pp)}
                      </button>
                      {s.extra.includes(d) && (
                        <button type="button" aria-label={fill(L.s3.stopDel, { d })}
                          onClick={() => setS((p) => { const stops = { ...p.stops }; delete stops[d]; return { ...p, extra: p.extra.filter((x) => x !== d), stops } })}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-gray-400 hover:bg-red-50 hover:text-red-600">×</button>
                      )}
                    </span>
                  } />
              )
            })}
          </div>
          <button type="button" className={`${addBtn} lg:mt-auto`} disabled={nd >= lastD}
            onClick={() => setS((p) => ({ ...p, extra: [...p.extra, nd], stops: { ...p.stops, [nd]: 1 } }))}>
            {nd >= lastD ? L.s3.addNo : fill(L.s3.add, { d: nd })}
          </button>
        </Card>

      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div ref={resRef} className="scroll-mt-24">
          <Card aria-live="polite" className={`border-l-[6px] ${lvl === 'ok' ? 'border-l-primary' : lvl === 'mid' ? 'border-l-amber-500' : 'border-l-red-600'}`}>
            <p className="text-[12.5px] font-semibold text-gray-500">{L.res.cap}</p>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p key={r.total} className={`animate-number-pop text-[52px] font-extrabold leading-[1.05] tabular-nums max-[380px]:text-[44px] ${lvl === 'ok' ? 'text-black' : LVL_TXT[lvl]}`}>{f0(r.total)}<U>%</U></p>
              <p className={`text-base font-bold ${LVL_TXT[lvl]}`}>{lbl}</p>
            </div>
            <p className="text-[13px] font-medium text-gray-500">
              {RES ? fill(L.res.subRes, { res: f0(RES), dive: f1(r.dive) }) : fill(L.res.subDive, { dive: f1(r.dive) })} · {fill(L.res.exact, { v: f1(r.exact) })}
            </p>
            <Gauge max={120} value={r.exact} hatchUntil={RES} tone={lvl}
              zones={[{ from: 80, to: 100, k: 'mid' }, { from: 100, to: 120, k: 'bad' }]} ticks={[{ v: 80 }, { v: 100 }]}
              scale={[{ v: 0, label: '0' }, { v: 80, label: '80' }, { v: 100, label: '100' }, { v: 120, label: '120 %' }]} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Tile label={L.res.tmax} tone={Number.isFinite(t80) && t80 < s.tb ? 'low' : undefined}
                value={!Number.isFinite(t80) ? '∞' : t80 <= 0 ? '0 min' : fmtMin(t80)}
                sub={!Number.isFinite(t80) ? L.res.tmaxNone : t80 < s.tb ? L.res.tmaxOver : fill(L.res.tmaxSub, { t100: fmtMin(r.tbMax100) })} />
              <Tile label={L.res.next} tone={nb <= 0 ? 'low' : undefined}
                value={nb <= 0 ? '0 %' : `≤ ${f0(nb)} %`}
                sub={nb <= 0 ? L.res.nextNone : fill(L.res.nextSub, { r: f0(80 - nb) })} />
            </div>
            <p className="mt-3 text-xs font-semibold text-gray-500">{L.res.decay}</p>
            <div className="mt-1.5 grid grid-cols-4 gap-1 text-center">
              {DECAY_STEPS.map((t) => (
                <div key={t} className="min-w-0 rounded-lg bg-gray-50 px-0.5 py-1.5">
                  <small className="block text-[11px] font-medium text-gray-500">{fmtMin(t)}</small>
                  <b className="text-[15px] font-extrabold tabular-nums text-black">{f0(Math.ceil(decay(r.exact, t, s.half) - 1e-6))} %</b>
                </div>
              ))}
            </div>
            {alerts.map((a) => <Verdict key={a.t} tone={a.tone} title={a.t}>{a.x}</Verdict>)}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={copy} className={secondaryBtn}>{L.res.copy}</button>
              <button type="button" onClick={reset} className={secondaryBtn}>{L.res.reset}</button>
            </div>
          </Card>
        </div>

        <Card className="lg:flex-1">
          <SectionHead title={L.detail.title} help={L.detail.help} className="mb-3" />
          <div className="mb-3 flex h-[22px] overflow-hidden rounded-md bg-gray-100">
            {RES > 0 && <i title={L.detail.residual} className="block h-full min-w-[2px] border-r border-white" style={{ width: `${(RES / totDen) * 100}%`, background: 'repeating-linear-gradient(135deg,#9ca3af 0 3px,transparent 3px 6px)' }} />}
            {r.segs.filter((g) => g.cns > 0).map((g, i) => (
              <i key={i} title={segLabel(g)} className="block h-full min-w-[2px] border-r border-white" style={{ width: `${(g.cns / totDen) * 100}%`, background: segCol(g) }} />
            ))}
          </div>
          <table className="w-full border-collapse text-[13px] tabular-nums">
            <thead>
              <tr>
                {L.detail.head.map((h, i) => (
                  <th key={h} className={`whitespace-nowrap border-b border-gray-200 px-1 pb-1.5 text-[11px] font-semibold text-gray-500 ${i === 0 ? 'text-left' : 'text-right'} ${i === 3 ? 'max-sm:hidden' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RES > 0 && (
                <tr>
                  <td className="border-b border-gray-100 px-1 py-1.5"><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-gray-400" />{L.detail.residual}</td>
                  <td className="border-b border-gray-100" /><td className="border-b border-gray-100" /><td className="border-b border-gray-100 max-sm:hidden" />
                  <td className="border-b border-gray-100 px-1 text-right">{f1(RES)}</td>
                </tr>
              )}
              {r.segs.map((g, i) => {
                const hot = g.pp > 1.6 + E9 ? 'font-bold text-red-700' : g.pp > 1.4 + E9 && (g.kind === 'fond' || g.kind === 'niveau') ? 'font-bold text-amber-700' : ''
                const lim = g.lim === null ? '–' : !Number.isFinite(g.lim) ? '∞' : `${g.pp > 1.6 + E9 ? '≈' : ''}${f0(g.lim)} min`
                return (
                  <tr key={i}>
                    <td className="border-b border-gray-100 px-1 py-1.5 font-medium text-black">
                      <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: segCol(g) }} />{segLabel(g)}
                      <small className="block text-[11px] font-medium text-gray-500">
                        {mixName(Math.round(g.fo2 * 100))}{g.kind === 'rem' ? ` · ${s.v} m/min` : ''}
                        {g.lim !== null && <span className="sm:hidden"> · {fill(L.detail.limit, { v: lim })}</span>}
                      </small>
                    </td>
                    <td className={`whitespace-nowrap border-b border-gray-100 px-1 text-right ${hot}`}>{g.kind === 'rem' ? '≤ ' : ''}{f2(g.pp)}</td>
                    <td className="whitespace-nowrap border-b border-gray-100 px-1 text-right">{g.kind === 'rem' ? f1(g.t) : f0(g.t)} min</td>
                    <td className="whitespace-nowrap border-b border-gray-100 px-1 text-right max-sm:hidden">{lim}</td>
                    <td className="whitespace-nowrap border-b border-gray-100 px-1 text-right">{f1(g.cns)}</td>
                  </tr>
                )
              })}
              <tr className="font-bold text-black">
                <td className="px-1 py-1.5">{L.detail.total}</td><td /><td /><td className="max-sm:hidden" />
                <td className="whitespace-nowrap px-1 text-right">{f1(r.exact)} → {f0(r.total)} %</td>
              </tr>
            </tbody>
          </table>
          <p className="mb-1.5 mt-4 text-xs font-semibold text-gray-500">{L.how.noaaIntro}</p>
          <table className="w-full border-collapse text-[13px] tabular-nums">
            <thead><tr>{L.how.noaaHead.map((h) => <th key={h} className="border-b border-gray-200 px-1.5 py-1 text-right text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
            <tbody>
              {NOAA.map(([p, l], i) => (
                <tr key={p} className={used.has(i) ? 'bg-primary-50 font-bold text-black' : ''}>
                  <td className="border-b border-gray-100 px-1.5 py-1 text-right">{n.d(p, 1)}</td>
                  <td className="border-b border-gray-100 px-1.5 py-1 text-right">{f0(l)}</td>
                  <td className="border-b border-gray-100 px-1.5 py-1 text-right">{f2(100 / l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <details className="group rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-soft sm:px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2.5 marker:hidden [&::-webkit-details-marker]:hidden">
            <h2 className="text-[15px] font-bold text-black">{L.set.title}</h2>
            <span className="flex items-center gap-2 text-right text-[13px] font-medium text-gray-500">
              {setSum}
              <span aria-hidden className="text-xl leading-none transition-transform duration-200 group-open:rotate-180">⌄</span>
            </span>
          </summary>
          <div className="mt-3 grid gap-2">
            <Toggle label={L.set.asc} sub={L.set.ascSub} on={s.ascent} onChange={(v) => setS((p) => ({ ...p, ascent: v }))} />
            {s.ascent && <Stepper label={L.set.v} unit="m/min" ariaLabel={L.set.vAria} {...num('v')} />}
          </div>
          <SubLabel>{L.set.method}</SubLabel>
          <Segmented ariaLabel={L.set.method} value={s.method} onChange={(v) => setS((p) => ({ ...p, method: v }))}
            options={[{ v: 'interp', label: L.set.interp, sub: L.set.interpSub }, { v: 'up', label: L.set.up, sub: L.set.upSub }]} />
          <SubLabel>{L.set.half}</SubLabel>
          <Segmented ariaLabel={L.set.half} value={s.half} onChange={(v) => setS((p) => ({ ...p, half: v }))}
            options={[{ v: 90 as const, label: '90 min', sub: L.set.halfStd }, { v: 120 as const, label: '120 min', sub: L.set.halfSafe }]} />
          <p className={`mt-2 ${T.small}`}>{L.set.foot}</p>
        </details>

        <HowCard title={L.how.title}>
          <p>{L.how.intro}</p>
          {L.how.formulas.map((f) => <Formula key={f}>{f}</Formula>)}
          {L.how.items.map((it) => <p key={it.slice(0, 20)}><Rich text={it} /></p>)}
          <p className={T.small}>{L.how.foot}</p>
        </HowCard>
      </div>

      {/* Barre résultat fixe en bas sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <b className={`text-[28px] font-extrabold leading-none tabular-nums ${lvl === 'ok' ? 'text-black' : LVL_TXT[lvl]}`}>{f0(r.total)} %</b>
          <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-gray-500">
            <b className={`block text-sm font-bold ${LVL_TXT[lvl]}`}>{lbl}</b>{fill(L.cta.sub, { pp: f2(r.ppB) })}
          </span>
          <button type="button" onClick={() => resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="min-h-[46px] rounded-xl bg-primary px-4 text-sm font-bold text-white">{L.cta.detail}</button>
        </div>
      </div>
      {toast.node}
    </div>
  )
}
