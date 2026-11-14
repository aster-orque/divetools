'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  DEFAULT_STATE, LIMS, MIXES, SPECS, STORAGE_KEY, clean, compute, fromQuery, mod, sanitizeState, tableDepths,
} from '@/lib/ead/engine'
import type { EadResult, EadState, NumKey } from '@/lib/ead/engine'
import {
  Box, Card, Choice, Formula, SectionHead, Segmented, Stepper, SubLabel, T, clampTo, copyText, fill, makeNum, secondaryBtn,
  stepValue, useHeaderHeight, usePersistentState, useToast, ZONE_FILL, ZoneDefs, ZoneLegend,
} from './tool-ui'
import type { Tone } from './tool-ui'

type Labels = typeof fr.ead

const COL = { real: '#bae6fd', equiv: '#1284c7' }
const TILE: Record<Tone, string> = {
  ok: 'border-transparent bg-gray-50',
  mid: 'border-amber-500 bg-amber-50',
  low: 'border-red-600 bg-red-50',
  info: 'border-transparent bg-gray-50',
}
const TILE_TXT: Record<Tone, string> = { ok: 'text-gray-500', mid: 'text-amber-700', low: 'text-red-700', info: 'text-gray-500' }

/** Échelle horizontale des zones de ppO2 (≤ 1,4 / 1,4 à 1,6 / > 1,6) avec la profondeur choisie. */
function ZoneBar({ r, label, aria }: { r: EadResult; label: (d: number) => string; aria: string }) {
  // Largeur réelle mesurée (modèle) : le texte garde sa taille quelle que soit la largeur de la carte.
  const ref = useRef<SVGSVGElement>(null)
  const [W, setW] = useState(320)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setW(Math.max(240, Math.round(el.clientWidth || 320)))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const max = Math.max(40, Math.ceil((Math.max(r.d, Math.min(r.m16raw, 70)) + 6) / 10) * 10)
  const x = (v: number) => Math.max(0, Math.min(W, (v / max) * W))
  const a = x(Math.max(0, r.m14raw)), b = x(Math.max(0, r.m16raw)), px = x(r.d)
  const ticks: number[] = []
  for (let t = 0; t <= max; t += 10) ticks.push(t)
  const lx = Math.max(18, Math.min(W - 18, px))
  return (
    <svg ref={ref} viewBox={`0 0 ${W} 58`} role="img" aria-label={aria} className="block h-auto w-full overflow-visible">
      <ZoneDefs horizontal />
      <clipPath id="ead-zone"><rect x="0" y="16" width={W} height="14" rx="5" /></clipPath>
      <g clipPath="url(#ead-zone)">
        <rect x="0" y="16" width={a} height="14" fill={ZONE_FILL.ok} />
        <rect x={a} y="16" width={Math.max(0, b - a)} height="14" fill={ZONE_FILL.mid} />
        <rect x={b} y="16" width={Math.max(0, W - b)} height="14" fill={ZONE_FILL.bad} />
      </g>
      {b > 0 && b < W && <line x1={b} x2={b} y1="13" y2="33" stroke="#dc2626" strokeWidth="2" strokeDasharray="3 2" />}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1="30" y2="34" stroke="#9ca3af" />
          <text x={x(t)} y="46" fontSize="10" fontWeight="500" fill="#6b7280" textAnchor={t === 0 ? 'start' : t === max ? 'end' : 'middle'}>{label(t)}</text>
        </g>
      ))}
      <line x1={px} x2={px} y1="10" y2="32" stroke="#131418" strokeWidth="2.5" />
      <text x={lx} y="8" fontSize="11" fontWeight="700" fill="#131418" textAnchor="middle">{label(r.d)}</text>
    </svg>
  )
}

export default function EadCalculator({ labels }: { labels: Labels }) {
  const L = labels
  const n = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const [s, setS, loaded] = usePersistentState<EadState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const headerH = useHeaderHeight()
  const toast = useToast()

  // Lien partageable : ?d=30&o2=32&lim=1.4, appliqué une fois après la lecture de l'état mémorisé.
  const queryDone = useRef(false)
  useEffect(() => {
    if (!loaded || queryDone.current) return
    queryDone.current = true
    if (window.location.search) setS((p) => fromQuery(window.location.search, p))
  }, [loaded, setS])

  const fr0 = (x: number) => n.d(x)
  const show = (v: number) => n.d(v, v % 1 ? 1 : 0)
  const mStr = (v: number) => `${fr0(v)} m`

  const set = (k: NumKey, v: number) => setS((p) => ({ ...p, [k]: v }))
  const bump = (k: NumKey) => (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) }))
  const stp = (k: NumKey) => ({
    display: show(s[k]), onBump: bump(k), onSet: (v: number) => set(k, clampTo(v, SPECS[k].min, SPECS[k].max)),
    decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase,
  })

  // ── Calculs ──
  const r = compute(s.d, s.o2)
  const gain = s.d - r.ead
  const lim = s.lim, ppC = clean(r.pp), limTxt = n.d(lim, 1)
  const mixPhrase = s.o2 === 21 ? L.air : fill(L.ofNx, { o2: n.d(s.o2, s.o2 % 1 ? 1 : 0) })
  const st: [Tone, string, string] = ppC > 1.6
    ? ['low', fill(L.status.tox, { pp: n.d(r.pp, 2) }), fill(L.status.toxLine, { m: fr0(r.m16) })]
    : ppC > lim
      ? ['mid', fill(L.status.over, { lim: limTxt }), fill(L.status.overLine, { pp: n.d(r.pp, 2), m: fr0(mod(lim, r.fo2)) })]
      : ['ok', fill(L.status.ok, { d: fr0(s.d) }), fill(L.status.okLine, { pp: n.d(r.pp, 2), lim: limTxt, m: fr0(mod(lim, r.fo2)) })]
  const ppTone: Tone = ppC > 1.6 ? 'low' : ppC > lim ? 'mid' : 'ok'
  const ppTag = ppC > 1.6 ? L.o2.forbidden : ppC > lim ? fill(L.o2.beyond, { lim: limTxt }) : ppC > 1.4 ? fill(L.o2.under, { lim: limTxt }) : 'OK'
  const tileMod = (val: number, tLim: number) => {
    const over = s.d > val
    return {
      tone: (over ? (tLim === 1.6 ? 'low' : 'mid') : 'ok') as Tone,
      t: over ? fill(L.o2.exceeded, { m: fr0(Math.ceil(clean(s.d - val))) }) : fill(L.o2.margin, { m: fr0(val - s.d) }),
    }
  }
  const t14 = tileMod(r.m14, 1.4), t16 = tileMod(r.m16, 1.6)
  const sc = Math.max(10, s.d)

  const summary = () => fill(L.copyText, {
    mix: s.o2 === 21 ? L.mixAir : `Nx${fr0(s.o2)}`, d: fr0(s.d), ead: r.noN2 ? '—' : mStr(r.ead), pp: n.d(r.pp, 2),
    mn90: r.mn90 == null ? L.offTable : mStr(r.mn90), m14: fr0(r.m14), m16: fr0(r.m16),
  })

  const tile = (label: string, val: ReactNode, sub: string, tone: Tone) => (
    <div className={`min-w-0 rounded-xl border-2 px-3 py-2.5 max-[380px]:px-2 ${TILE[tone]}`}>
      <small className="block truncate text-xs font-semibold text-gray-500">{label}</small>
      <b className={`text-[26px] font-extrabold leading-tight tabular-nums max-[380px]:text-[22px] ${tone === 'ok' ? 'text-black' : TILE_TXT[tone]}`}>{val}</b>
      <div className={`text-xs font-medium ${TILE_TXT[tone]}`}>{sub}</div>
    </div>
  )
  const unit = (u: string) => <em className="ml-0.5 text-sm font-semibold not-italic text-gray-500">{u}</em>

  const inputs = (
    <Card className="max-lg:order-1">
      <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
      <div className="grid gap-1.5">
        <Stepper label={L.s1.depth} sub={L.s1.depthSub} unit="m" ariaLabel={L.s1.depthAria} {...stp('d')} />
        <Stepper label={L.s1.o2} sub={L.s1.o2Sub} unit={L.units.pctO2} ariaLabel={L.s1.o2Aria} {...stp('o2')} />
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {MIXES.map((m) => <Choice key={m} on={s.o2 === m} onClick={() => set('o2', m)}>{m === 21 ? L.mixAir : `Nx${m}`}</Choice>)}
      </div>
      <SubLabel>{L.s1.limit}</SubLabel>
      <Segmented ariaLabel={L.s1.limit} value={s.lim} onChange={(v) => setS((p) => ({ ...p, lim: v }))}
        options={LIMS.map((l, i) => ({ v: l, label: `${n.d(l, 1)} · ${L.s1.limNames[i]}` }))} />
    </Card>
  )

  const result = (
    <Card aria-live="polite" className="max-lg:order-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12.5px] font-semibold text-gray-500">{L.res.k}</p>
          <p key={r.ead} className="animate-number-pop text-[56px] font-extrabold leading-none tracking-[-0.02em] tabular-nums text-black max-[380px]:text-[48px]">
            {r.noN2 ? '—' : <>{fr0(r.ead)}<em className="ml-1 text-[22px] font-bold not-italic tracking-normal text-gray-500">m</em></>}
          </p>
        </div>
        <span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold ${gain > 0 ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
          {gain > 0 ? fill(L.res.gain, { m: fr0(gain) }) : L.res.noGain}
        </span>
      </div>
      <p className="mt-1.5 text-[13.5px] font-medium text-gray-500">
        {r.noN2 ? L.res.pureO2 : s.o2 === 21 ? L.res.isAir : r.raw < 0 ? L.res.negative : fill(L.res.exact, { v: n.d(r.raw, 1) })}
      </p>
      {!r.noN2 && (
        <p className="mt-2.5 text-[15px] font-medium leading-snug text-gray-700">
          {s.o2 === 21 ? L.res.nothing : (
            <>{fill(L.res.sayA, { mix: mixPhrase })} <b className="text-black">{mStr(s.d)}</b>{L.res.sayB} <b className="text-black">{n.d(Math.max(0, r.raw), 1)} m</b>.</>
          )}
        </p>
      )}
      {!r.noN2 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[13px] font-medium tabular-nums text-gray-700">
            {L.res.mn90} <b>{r.mn90 == null ? L.offTable : mStr(r.mn90)}</b>
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[13px] font-medium tabular-nums text-gray-700">
            {L.res.n2} <b>{n.d(r.ppn2, 2)} bar</b> {fill(L.res.n2Instead, { v: n.d(r.ppn2air, 2) })}
            {r.n2cut > 0.0005 ? ` (−${fr0(r.n2cut * 100)} %)` : ''}
          </span>
        </div>
      )}
      <div className="mt-3.5 grid gap-2">
        {[
          { k: L.res.real, v: mStr(s.d), w: (s.d / sc) * 100, c: COL.real },
          { k: L.res.equiv, v: r.noN2 ? '—' : mStr(r.ead), w: r.noN2 ? 0 : (r.ead / sc) * 100, c: COL.equiv },
        ].map((b) => (
          <div key={b.k} className="grid grid-cols-[96px_1fr] items-center gap-2 text-[12.5px] font-medium text-gray-500">
            <span className="leading-tight">{b.k}<b className="block text-sm font-bold tabular-nums text-black">{b.v}</b></span>
            <div className="h-[22px] overflow-hidden rounded-md bg-gray-100">
              <div className="h-full rounded-md transition-[width] duration-300" style={{ width: `${b.w}%`, background: b.c }} />
            </div>
          </div>
        ))}
      </div>
      <Box tone={st[0]} title={st[1]}>{st[2]}</Box>
    </Card>
  )

  const oxygen = (
    <Card className="max-lg:order-3">
      <SectionHead no={2} title={L.o2.title} help={L.o2.help} />
      <div className="grid grid-cols-3 gap-2">
        {tile(L.o2.pp, <>{n.d(r.pp, 2)}{unit('bar')}</>, ppTag, ppTone)}
        {tile(L.o2.max14, <>{fr0(r.m14)}{unit('m')}</>, t14.t, t14.tone)}
        {tile(L.o2.max16, <>{fr0(r.m16)}{unit('m')}</>, t16.t, t16.tone)}
      </div>
      <p className={`mt-2 ${T.small}`}>{L.o2.note}</p>
      <div className="mt-3">
        <ZoneBar r={r} label={mStr} aria={L.o2.zoneAria} />
        <div className="mt-1.5">
          <ZoneLegend items={[{ k: 'ok', label: L.o2.z1 }, { k: 'mid', label: L.o2.z2 }, { k: 'bad', label: L.o2.z3 }]} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className={secondaryBtn} onClick={() => copyText(summary(), toast.say, L.toast.copied, L.toast.fail)}>{L.o2.copy}</button>
        <button type="button" className={secondaryBtn} onClick={() => setS({ ...DEFAULT_STATE })}>{L.o2.reset}</button>
      </div>
    </Card>
  )

  const table = (
    <Card className="max-lg:order-4">
      <SectionHead no={3} title={L.tbl.title} help={L.tbl.help} className="mb-2" />
      <p className={`mb-1.5 ${T.small}`}>{L.tbl.note}</p>
      <div className="-mx-1 overflow-x-auto">
        <table className="w-full border-collapse text-[14px] tabular-nums">
          <thead>
            <tr className="border-b border-gray-200">
              {L.tbl.head.map((h, i) => (
                <th key={h} className={`whitespace-nowrap px-2 py-1.5 text-[11.5px] font-semibold text-gray-500 ${i ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableDepths(r).map((d) => {
              const x = compute(d, s.o2)
              const me = d === r.d
              const ppCls = x.level === 'low' ? 'text-red-700' : x.level === 'mid' ? 'text-amber-700' : ''
              const pick = () => { set('d', d); window.scrollTo({ top: 0, behavior: 'smooth' }) }
              const cells = [mStr(d), x.noN2 ? '—' : mStr(x.ead), x.mn90 == null ? '—' : mStr(x.mn90), n.d(x.pp, 2)]
              return (
                <tr key={d} className={`cursor-pointer border-b border-gray-200 ${me ? 'bg-primary-50 font-bold' : 'hover:bg-gray-50'} ${x.level === 'low' ? 'text-gray-400' : ''}`}>
                  {cells.map((c, i) => (
                    <td key={i} className={`p-0 ${i ? 'text-right' : 'text-left'}`}>
                      <button type="button" onClick={pick} className={`block w-full px-2 py-2.5 text-inherit ${i ? 'text-right' : 'text-left'} ${i === 3 ? ppCls : ''}`}>{c}</button>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )

  const learn = (
    <details className="group rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-soft max-lg:order-5 sm:px-5">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-bold text-black marker:hidden [&::-webkit-details-marker]:hidden">
        {L.how.title}
        <span aria-hidden className="text-xl font-normal text-gray-400 transition-transform duration-200 group-open:rotate-45">+</span>
      </summary>
      <div className="mt-3 space-y-2 text-[13.5px] font-medium leading-relaxed text-gray-700">
        {L.how.blocks.map((b) => (
          <div key={b.h} className="space-y-1.5">
            <h3 className="mt-3 text-sm font-bold text-black">{b.h}</h3>
            {b.p && <p>{b.p}</p>}
            {b.f?.map((f) => <Formula key={f}>{f}</Formula>)}
            {b.after && <p>{b.after}</p>}
          </div>
        ))}
        <h3 className="mt-3 text-sm font-bold text-black">{L.how.keepTitle}</h3>
        <ul className="list-disc space-y-1 pl-5">{L.how.keep.map((k) => <li key={k}>{k}</li>)}</ul>
      </div>
    </details>
  )

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-4">
      <div className="flex min-w-0 flex-col gap-3 max-lg:contents">
        {inputs}
        {table}
      </div>
      <div className="flex min-w-0 flex-col gap-3 max-lg:contents lg:sticky" style={{ top: headerH + 16 }}>
        {result}
        {oxygen}
        {learn}
      </div>
      {toast.node}
    </div>
  )
}
