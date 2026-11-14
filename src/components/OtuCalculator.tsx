'use client'

import { useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import { ADD, DEFAULT_STATE, MIXES, REPEX_DAY, REPEX_TOT, SPECS, STORAGE_KEY, compute, limit, rate, sanitizeState } from '@/lib/otu/engine'
import type { GlobalKey, OtuResult, OtuState, SegKey, SegName } from '@/lib/otu/engine'
import {
  Card, Formula, Gauge, HowCard, LVL_TXT, SectionHead, Segmented, Stepper, SubLabel, T, Tile, U, Verdict, clampTo, fill, makeNum, stepValue,
  usePersistentState,
} from './tool-ui'

type Labels = typeof fr.otu
/** Couleur de PpO2 : gris sous 0,5 bar, bleu Orque, orange de 1,4 à 1,6, rouge au-delà. */
const ppColor = (pp: number) => (pp <= 0.5 ? '#9ca3af' : pp > 1.605 ? '#dc2626' : pp > 1.405 ? '#f59e0b' : '#1284c7')

function Profile({ R, ramps, L, f }: { R: OtuResult; ramps: boolean; L: Labels['prof']; f: (v: number, d?: number) => string }) {
  const P = R.pieces, Tt = R.runtime
  if (!Tt) return null
  const maxD = Math.max(...P.map((q) => Math.max(q.d0, q.d1)), 1)
  const W = 360, H = 110, Lm = 30, Rm = 8, Tp = 14, B = 18
  const X = (t: number) => Lm + ((W - Lm - Rm) * t) / Tt, Y = (d: number) => Tp + ((H - Tp - B) * d) / maxD
  const els: ReactNode[] = [], defs: ReactNode[] = []
  let t = 0
  if (!ramps) {
    let prevD = 0
    P.forEach((q, i) => {
      els.push(<line key={`v${i}`} x1={X(t)} y1={Y(prevD)} x2={X(t)} y2={Y(q.d0)} stroke="#e5e7eb" strokeWidth="2" />)
      prevD = q.d0
      t += q.t
    })
    els.push(<line key="vend" x1={X(Tt)} y1={Y(prevD)} x2={X(Tt)} y2={Y(0)} stroke="#e5e7eb" strokeWidth="2" />)
    t = 0
  }
  P.forEach((q, i) => {
    const x0 = X(t), x1 = X(t + q.t)
    if (Math.abs(q.pp0 - q.pp1) > 1e-6) {
      const id = `otu-g${i}`
      defs.push(
        <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={x0} x2={x1} y1="0" y2="0">
          <stop offset="0" stopColor={ppColor(q.pp0)} /><stop offset="1" stopColor={ppColor(q.pp1)} />
        </linearGradient>,
      )
      els.push(<line key={`p${i}`} x1={x0} y1={Y(q.d0)} x2={x1} y2={Y(q.d1)} stroke={`url(#${id})`} strokeWidth="4" strokeLinecap="round" />)
    } else {
      els.push(<line key={`p${i}`} x1={x0} y1={Y(q.d0)} x2={x1} y2={Y(q.d1)} stroke={ppColor(q.pp0)} strokeWidth="4" strokeLinecap="round" />)
      if (q.kind === 'seg' && x1 - x0 > 34) els.push(<text key={`t${i}`} x={(x0 + x1) / 2} y={Y(q.d0) - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="#131418">{f(q.otu, q.otu < 10 ? 1 : 0)}</text>)
    }
    t += q.t
  })
  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="mb-1 flex justify-between gap-2 text-xs font-semibold text-gray-500"><span>{L.cap}</span><span className="font-medium">{ramps ? L.ramps : L.flat}</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={L.aria} className="block h-auto w-full">
        <defs>{defs}</defs>
        {[0, maxD].map((d) => <text key={d} x={Lm - 4} y={Y(d) + 3} textAnchor="end" fontSize="10" fill="#6b7280">{f(d)} m</text>)}
        <line x1={Lm} y1={Y(0)} x2={W - Rm} y2={Y(0)} stroke="#e5e7eb" strokeDasharray="3 3" />
        <text x={W - Rm} y={H - 2} textAnchor="end" fontSize="10" fill="#6b7280">{f(Math.round(Tt))} min</text>
        {els}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-gray-500">
        {[['#9ca3af', L.l1], ['#1284c7', L.l2], ['#f59e0b', L.l3], ['#dc2626', L.l4]].map(([c, l]) => (
          <span key={l}><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: c }} />{l}</span>
        ))}
      </div>
    </div>
  )
}

export default function OtuCalculator({ labels, locale }: { labels: Labels; locale: string }) {
  const L = labels
  const n = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const [s, setS] = usePersistentState<OtuState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const resRef = useRef<HTMLDivElement>(null)
  const f = (v: number, d = 0) => n.d(v, d)
  const fv = (v: number) => n.d(v, v % 1 ? 1 : 0)
  const mixName = (o2: number) => (o2 === 21 ? L.mixAir : o2 === 100 ? L.mixO2 : o2 < 21 ? fill(L.mixLean, { o2: fv(o2) }) : `Nx${fv(o2)}`)
  const sp = { decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase }
  const gStp = (k: GlobalKey) => ({
    display: fv(s[k]),
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) })),
    onSet: (v: number) => setS((p) => ({ ...p, [k]: clampTo(v, SPECS[k].min, SPECS[k].max) })),
    ...sp,
  })
  const sStp = (i: number, k: SegKey) => {
    const upd = (fn: (v: number) => number) => setS((p) => ({ ...p, segs: p.segs.map((q, j) => (j === i ? { ...q, [k]: fn(q[k]) } : q)) }))
    return {
      display: fv(s.segs[i][k]),
      onBump: (dir: -1 | 1) => upd((v) => stepValue(v, dir, SPECS[k].step, SPECS[k].min, SPECS[k].max)),
      onSet: (v: number) => upd(() => clampTo(v, SPECS[k].min, SPECS[k].max)),
      ...sp,
    }
  }
  const durTxt = (m: number, html = true) => {
    if (!Number.isFinite(m)) return '∞'
    m = Math.floor(m)
    if (m < 60) return html ? <>{f(m)}<U>min</U></> : `${f(m)} min`
    const h = Math.floor(m / 60), r = String(m % 60).padStart(2, '0')
    return html ? <>{h}<U>h</U> {r}</> : `${h} h ${r}`
  }

  // ── Calculs (modèle) ──
  const lim = limit(s.lim, s.day, s.prevDays)
  const R = compute(s.segs, lim, { ramps: s.ramps, vDesc: s.vDesc, vAsc: s.vAsc }, s.prev)
  const r0 = R.rows[0]
  const dive = Math.ceil(R.dive), day = Math.ceil(R.day)
  const pct = R.pct
  const gTone = pct > 1 ? 'low' : pct >= 0.8 ? 'mid' : 'ok'
  const di = s.day - 1
  const limTxt = s.lim === 'day' ? L.s2.txtDay
    : s.lim === 'multi' ? (s.day > 1 && REPEX_TOT[di] - s.prevDays < REPEX_DAY[di] ? fill(L.s2.txtCap, { lim: f(lim) }) : L.s2.txtMulti)
      : L.s2.txtVc
  const hi = R.pieces.filter((q) => q.pp0 > 1.605 || q.pp1 > 1.605)
  const box = hi.length ? { tone: 'low' as const, t: L.res.hiT, x: L.res.hiX }
    : pct > 1 ? { tone: 'low' as const, t: L.res.overT, x: L.res.overX }
      : pct >= 0.8 ? { tone: 'mid' as const, t: L.res.nearT, x: L.res.nearX }
        : { tone: 'ok' as const, t: L.res.okT, x: R.dive < 1 ? L.res.okNone : L.res.okX }
  const ppTone = r0.pp > 1.605 ? 'low' : r0.pp > 1.405 ? 'mid' : undefined
  const v = R.vc
  const showDetail = s.segs.length > 1 || s.ramps || s.prev > 0
  const pps: number[] = []
  for (let p = 50; p <= 160; p += 5) pps.push(p / 100)
  const near = Math.round(r0.pp * 20) / 20
  const barTone = pct > 1 || hi.length ? 'low' : pct >= 0.8 ? 'mid' : 'ok'

  const addSeg = (k: Exclude<SegName, 'fond'>) => setS((p) => {
    const a = ADD[k], last = p.segs[p.segs.length - 1]
    return { ...p, segs: [...p.segs, { o2: a.o2 ?? last.o2, d: a.d, t: a.t, n: k }] }
  })
  const pill = 'min-h-10 rounded-full border border-dashed border-primary bg-white px-3.5 py-1.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white'
  const limOpts = [{ v: 'day' as const, label: L.s2.day, sub: L.s2.daySub }, { v: 'multi' as const, label: L.s2.multi, sub: L.s2.multiSub }, { v: 'vc' as const, label: L.s2.vc, sub: L.s2.vcSub }]

  const segFields = (i: number) => (
    <>
      <div className="mb-2 grid grid-cols-4 gap-1.5">
        {MIXES.map((m) => {
          const on = s.segs[i].o2 === m
          return (
            <button key={m} type="button" aria-pressed={on} onClick={() => setS((p) => ({ ...p, segs: p.segs.map((q, j) => (j === i ? { ...q, o2: m } : q)) }))}
              className={`min-h-[40px] rounded-xl border text-[13px] font-bold tabular-nums transition-all duration-200 ease-out-expo active:scale-95 ${on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'}`}>
              {mixName(m)}
            </button>
          )
        })}
      </div>
      <div className="grid gap-1.5">
        <Stepper label={L.s1.o2} sub={L.s1.o2Sub} unit="%" ariaLabel={L.s1.o2} {...sStp(i, 'o2')} />
        <Stepper label={L.s1.depth} sub={i === 0 ? L.s1.depthSub : undefined} unit="m" ariaLabel={L.s1.depth} {...sStp(i, 'd')} />
        <Stepper label={L.s1.time} sub={i === 0 ? L.s1.timeSubBottom : L.s1.timeSub} unit="min" ariaLabel={L.s1.time} {...sStp(i, 't')} />
      </div>
    </>
  )

  return (
    <div className="flex flex-col gap-3 pb-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-7 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-3">
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          {segFields(0)}
          {s.segs.slice(1).map((q, k) => {
            const i = k + 1, row = R.rows[i]
            return (
              <div key={i} className="mt-3 rounded-xl border border-gray-200 p-2.5">
                <div className="mb-2 flex items-center gap-2">
                  <b className="text-sm font-bold text-black">{L.names[q.n]}</b>
                  <span className="text-xs font-medium tabular-nums text-gray-500">{f(row.pp, 2)} bar · {f(row.otu, 1)} OTU</span>
                  <button type="button" onClick={() => setS((p) => ({ ...p, segs: p.segs.filter((_, j) => j !== i) }))}
                    className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600">{L.s1.remove}</button>
                </div>
                {segFields(i)}
              </div>
            )
          })}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button type="button" className={pill} onClick={() => addSeg('deco')}>{L.s1.addDeco}</button>
            <button type="button" className={pill} onClick={() => addSeg('o2')}>{L.s1.addO2}</button>
            <button type="button" className={pill} onClick={() => addSeg('free')}>{L.s1.addFree}</button>
          </div>
          <label className="mt-3 flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2">
            <span className="text-[14px] font-semibold leading-snug text-gray-700">{L.s1.ramps}<small className="block text-xs font-medium text-gray-500">{L.s1.rampsSub}</small></span>
            <input type="checkbox" checked={s.ramps} onChange={(e) => setS((p) => ({ ...p, ramps: e.target.checked }))} className="peer sr-only" />
            <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${s.ramps ? 'bg-primary' : 'bg-gray-300'}`}>
              <i className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${s.ramps ? 'left-[22px]' : 'left-0.5'}`} />
            </span>
          </label>
          {s.ramps && (
            <div className="mt-1.5 grid gap-1.5">
              <Stepper label={L.s1.vDesc} unit="m/min" ariaLabel={L.s1.vDesc} {...gStp('vDesc')} />
              <Stepper label={L.s1.vAsc} unit="m/min" ariaLabel={L.s1.vAsc} {...gStp('vAsc')} />
            </div>
          )}
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <Stepper label={L.s2.prev} sub={L.s2.prevSub} unit="OTU" ariaLabel={L.s2.prev} {...gStp('prev')} />
          <SubLabel>{L.s2.limit}</SubLabel>
          <Segmented ariaLabel={L.s2.limit} value={s.lim} onChange={(x) => setS((p) => ({ ...p, lim: x }))} options={limOpts} />
          {s.lim === 'multi' && (
            <div className="mt-2 grid gap-1.5">
              <Stepper label={L.s2.dayNo} sub={fill(L.s2.dayNoSub, { d: f(REPEX_DAY[di]), t: f(REPEX_TOT[di]) })} unit={L.s2.dayUnit} ariaLabel={L.s2.dayNo} {...gStp('day')} />
              {s.day > 1 && <Stepper label={L.s2.prevDays} sub={L.s2.prevDaysSub} unit="OTU" ariaLabel={L.s2.prevDays} {...gStp('prevDays')} />}
            </div>
          )}
          <p className={`mt-2 ${T.small}`}>{limTxt}</p>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div ref={resRef} className="scroll-mt-24">
          <Card aria-live="polite">
            <p className="text-[12.5px] font-semibold text-gray-500">{s.prev ? L.res.capThis : L.res.capDive}</p>
            <p className="flex flex-wrap items-baseline gap-x-2">
              <b key={dive} className="animate-number-pop text-[52px] font-extrabold leading-[1.05] tabular-nums text-black max-[380px]:text-[44px]">{f(dive)}</b>
              <span className="text-xl font-semibold text-gray-500">OTU</span>
              {s.prev > 0 && <span className="text-[13px] font-medium text-gray-500">{fill(L.res.onDay, { d: f(day) })}</span>}
            </p>
            <Gauge max={1} value={Number.isFinite(pct) ? pct : 1} tone={gTone} zones={[{ from: 0.8, to: 1, k: 'mid' }]} ticks={[{ v: 0.8 }]} />
            <div className="mt-1.5 flex justify-between gap-2 text-xs font-medium tabular-nums text-gray-500">
              <span className={gTone === 'ok' ? 'text-black' : LVL_TXT[gTone]}>{Number.isFinite(pct) ? fill(L.res.pctOf, { p: f(Math.ceil(pct * 100)) }) : L.res.reached}</span>
              <span>{fill(L.res.limit, { l: f(lim) })}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Tile label={L.res.pp} tone={ppTone} value={<>{f(r0.pp, 2)}<U>bar</U></>} sub={r0.pp <= 0.5 ? L.res.ppNone : fill(L.res.ppRate, { r: f(r0.rate, 2) })} />
              <Tile label={L.res.tmax} tone={R.tmax < r0.t ? 'low' : undefined} value={durTxt(R.tmax)}
                sub={!Number.isFinite(R.tmax) ? L.res.tmaxNone : fill(L.res.tmaxAt, { d: f(r0.d), mix: mixName(r0.o2) }) + (s.segs.length > 1 || s.prev ? L.res.tmaxRest : '')} />
              <Tile label={L.res.vc} value={v.below ? <>&lt; 2<U>%</U></> : v.above ? <>&gt; 20<U>%</U></> : <>≈ {f(Math.round(v.v))}<U>%</U></>} sub={L.res.vcSub} />
              <Tile label={L.res.left} tone={R.left < 0 ? 'low' : undefined}
                value={R.left >= 0 ? <>{f(Math.floor(R.left))}<U>OTU</U></> : <>−{f(Math.ceil(-R.left))}<U>OTU</U></>}
                sub={R.left >= 0 ? L.res.leftOk : L.res.leftOver} />
            </div>
            <Verdict tone={box.tone} title={box.t}>{box.x}</Verdict>
            <Profile R={R} ramps={s.ramps} L={L.prof} f={f} />
            {showDetail && (
              <table className="mt-3 w-full border-collapse text-[13px] tabular-nums">
                <thead><tr>{L.detail.head.map((h, i) => <th key={h} className={`border-b border-gray-200 px-1 pb-1 text-[11px] font-semibold text-gray-500 ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
                <tbody>
                  {R.rows.map((row, i) => (
                    <tr key={i}>
                      <td className="border-b border-gray-100 px-1 py-1.5">{L.names[s.segs[i].n]} · {mixName(row.o2)} {f(row.d)} m</td>
                      <td className="border-b border-gray-100 px-1 text-right">{f(row.pp, 2)}</td>
                      <td className="border-b border-gray-100 px-1 text-right">{f(R.pieces.find((q) => q.kind === 'seg' && q.i === i)!.t)}</td>
                      <td className="border-b border-gray-100 px-1 text-right">{f(row.otu, 1)}</td>
                    </tr>
                  ))}
                  {s.ramps && (
                    <tr>
                      <td className="border-b border-gray-100 px-1 py-1.5">{L.detail.ramps}</td><td className="border-b border-gray-100" />
                      <td className="border-b border-gray-100 px-1 text-right">{f(R.pieces.filter((q) => q.kind !== 'seg').reduce((a, q) => a + q.t, 0))}</td>
                      <td className="border-b border-gray-100 px-1 text-right">{f(R.ramps, 1)}</td>
                    </tr>
                  )}
                  <tr className="font-bold text-black"><td className="px-1 py-1.5">{L.detail.dive}</td><td /><td className="px-1 text-right">{f(Math.round(R.runtime))}</td><td className="px-1 text-right">{f(dive)}</td></tr>
                  {s.prev > 0 && (
                    <>
                      <tr><td className="px-1 py-1.5">{L.detail.prev}</td><td /><td /><td className="px-1 text-right">{f(s.prev)}</td></tr>
                      <tr className="font-bold text-black"><td className="px-1 py-1.5">{L.detail.day}</td><td /><td /><td className="px-1 text-right">{f(day)}</td></tr>
                    </>
                  )}
                </tbody>
              </table>
            )}
            <a href={`/${locale}/cns`} className="mt-3 inline-block text-[13px] font-semibold text-primary underline-offset-2 hover:underline">{L.res.cns} →</a>
          </Card>
        </div>

        <HowCard title={L.ref.title}>
          <p className={T.small}>{L.ref.help}</p>
          <table className="w-full border-collapse text-[13px] tabular-nums">
            <thead><tr>{L.ref.head.map((h, i) => <th key={h} className={`border-b border-gray-200 px-1.5 py-1 text-xs font-semibold text-gray-500 ${i ? 'text-right' : 'text-left'}`}>{fill(h, { l: f(lim) })}</th>)}</tr></thead>
            <tbody>
              {pps.map((p) => {
                const rt = rate(p), me = Math.abs(p - near) < 1e-6
                return (
                  <tr key={p} className={me ? 'bg-primary-50 font-bold text-black' : p > 1.405 ? 'text-amber-700' : ''}>
                    <td className="border-b border-gray-100 px-1.5 py-1">{f(p, 2)}</td>
                    <td className="border-b border-gray-100 px-1.5 py-1 text-right">{f(rt, 2)}</td>
                    <td className="border-b border-gray-100 px-1.5 py-1 text-right">{rt ? durTxt(lim / rt, false) : '∞'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </HowCard>

        <HowCard title={L.how.title}>
          {L.how.blocks.map((b) => (
            <div key={b.h} className="space-y-1.5">
              <p className="font-bold text-black">{b.h}</p>
              {b.p && <p>{b.p}</p>}
              {b.f.map((x) => <Formula key={x}>{x}</Formula>)}
            </div>
          ))}
          <p className={T.small}>{L.how.foot}</p>
        </HowCard>
      </div>

      {/* Barre résultat fixe en bas sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <b className={`whitespace-nowrap text-[24px] font-extrabold leading-none tabular-nums ${barTone === 'ok' ? 'text-black' : LVL_TXT[barTone]}`}>{f(s.prev ? day : dive)} OTU</b>
          <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-snug text-gray-500">
            {fill(L.cta.sub, { p: Number.isFinite(pct) ? f(Math.ceil(pct * 100)) : '—', pp: f(r0.pp, 2) })}
          </span>
          <button type="button" onClick={() => resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="min-h-[46px] rounded-xl bg-primary px-4 text-sm font-bold text-white">{L.cta.go}</button>
        </div>
      </div>
    </div>
  )
}
