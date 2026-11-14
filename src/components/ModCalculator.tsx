'use client'

import { useEffect, useMemo, useState } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  DEFAULT_STATE, EPS, MIXES, PPS, SPECS, STORAGE_KEY, TABLE_PPS, checkDepth, minDepth, mod, modRaw, pMax, ppAt, roundInput, sanitizeState,
} from '@/lib/mod/engine'
import type { Env, ModState, NumKey } from '@/lib/mod/engine'
import {
  Box, Bullets, Card, Chip, Choice, Formula, HowCard, SectionHead, Segmented, Stepper, T, copyText, fill, makeNum,
  secondaryBtn, stepValue, useHeaderHeight, usePersistentState, useToast,
} from './tool-ui'
import type { Tone } from './tool-ui'

type Labels = typeof fr.mod

/** Jauge : zone respirable (bleu), au-delà de la MOD (hachuré), limite absolue 1,6 (pointillé rouge), zone hypoxique en surface. */
function Gauge({ m, m16, hyp, aria }: { m: number; m16: number; hyp: number; aria: string }) {
  const H = 240, W = 112, top = 10, bot = H - 10, x0 = 42, w = W - 46
  const maxD = Math.max(10, Math.ceil((Math.max(m, m16, 0) * 1.2) / 10) * 10)
  const y = (d: number) => top + (bot - top) * Math.min(1, Math.max(0, d) / maxD)
  const stepT = maxD > 80 ? 20 : 10
  const ticks: number[] = []
  for (let d = 0; d <= maxD; d += stepT) ticks.push(d)
  const ym = y(Math.max(m, 0)), yh = y(hyp), y16 = y(m16)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block h-full min-h-[220px] w-full">
      <defs>
        <linearGradient id="mod-wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
        <pattern id="mod-hz" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#f9fafb" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="#dc2626" strokeWidth="3" opacity=".35" />
        </pattern>
        <clipPath id="mod-gc"><rect x={x0} y={top} width={w} height={bot - top} rx="8" /></clipPath>
      </defs>
      <g clipPath="url(#mod-gc)">
        <rect x={x0} y={top} width={w} height={bot - top} fill="url(#mod-hz)" />
        {m > hyp && <rect x={x0} y={yh} width={w} height={ym - yh} fill="url(#mod-wg)" />}
      </g>
      {m16 > m && m16 <= maxD && <line x1={x0} x2={W - 4} y1={y16} y2={y16} stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />}
      {hyp > 0 && <line x1="38" x2={W - 2} y1={yh} y2={yh} stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />}
      <line x1="38" x2={W - 2} y1={ym} y2={ym} stroke="#facc15" strokeWidth="4" strokeLinecap="round" />
      {ticks.map((d) => (
        <g key={d}>
          <line x1="34" x2="40" y1={y(d)} y2={y(d)} stroke="#9ca3af" />
          <text x="30" y={y(d) + 4} textAnchor="end" fontSize="11" fontWeight="500" fill="#6b7280">{d}</text>
        </g>
      ))}
    </svg>
  )
}

export default function ModCalculator({ labels }: { labels: Labels }) {
  const L = labels
  const n = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const [s, setS] = usePersistentState<ModState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const headerH = useHeaderHeight()
  const toast = useToast()
  const [canShare, setCanShare] = useState(false)
  useEffect(() => setCanShare(typeof navigator !== 'undefined' && !!navigator.share), [])

  const ppTxt = (v: number) => n.d(v, Math.round(v * 100) % 10 ? 2 : 1)
  const o2Txt = (v: number) => n.d(v, Math.round(v * 10) % 10 ? 1 : 0)
  const mixName = (o2: number) =>
    o2 === 21 ? L.mixAir : o2 === 100 ? L.mixO2 : o2 < 21 ? fill(L.mixHypo, { o2: o2Txt(o2) }) : `Nx${o2Txt(o2)}`
  const show: Record<NumKey, (v: number) => string> = { pp: ppTxt, o2: o2Txt, alt: (v) => String(Math.round(v)), d: (v) => String(Math.round(v)) }

  const set = (k: NumKey, v: number) => setS((p) => ({ ...p, [k]: v }))
  const bump = (k: NumKey) => (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) }))
  /** Saisie libre : arrondie comme le modèle, ignorée hors bornes. */
  const typed = (k: NumKey) => (v: number) => {
    const r = roundInput(k, v)
    if (r >= SPECS[k].min && r <= SPECS[k].max) set(k, r)
  }
  const stp = (k: NumKey) => ({
    display: show[k](s[k]), onBump: bump(k), onSet: typed(k), decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase,
  })

  // ── Calculs ──
  const fresh = s.water === 'fresh'
  const E: Env = { water: s.water, alt: fresh ? s.alt : 0 }
  const m = mod(s.pp, s.o2, E), raw = modRaw(s.pp, s.o2, E), pa = pMax(s.pp, s.o2), m16 = mod(1.6, s.o2, E), hyp = minDepth(s.o2, E)
  const name = mixName(s.o2)
  const place = fresh ? (s.alt > 0 ? fill(L.placeLakeAlt, { alt: n.d(s.alt) }) : L.placeFresh) : L.placeSea

  const msgs: [Tone, string, string][] = []
  if (raw < 0) msgs.push(['low', L.msg.unusable, L.msg.unusableLine])
  if (hyp > 0) msgs.push(['low', L.msg.hypoxic, fill(L.msg.hypoxicLine, { d: hyp })])
  else if (s.o2 < 21) msgs.push(['mid', L.msg.lean, L.msg.leanLine])
  if (s.pp > 1.6) msgs.push(['low', L.msg.over16, L.msg.over16Line])
  else if (s.pp > 1.4) msgs.push(['mid', fill(L.msg.over14, { pp: ppTxt(s.pp) }), L.msg.over14Line])
  if (!msgs.length) msgs.push(['ok', L.msg.note, fill(L.msg.noteLine, { name, m, pp: ppTxt(s.pp) })])

  const pd = ppAt(s.d, s.o2, E)
  const lvl = checkDepth(pd, s.pp)
  const chkTone = lvl === 'ok' ? 'text-primary-600' : lvl === 'mid' ? 'text-amber-700' : 'text-red-700'
  const chkTxt = fill(L.check[lvl], { pp: n.d(pd, 2) })

  const summary = raw >= 0
    ? fill(L.copy.ok, { name, m, pp: ppTxt(s.pp), place }) + (hyp > 0 ? fill(L.copy.hypo, { d: hyp }) : '')
    : fill(L.copy.unusable, { name, pp: ppTxt(s.pp) })

  const result = (
    <Card aria-live="polite">
      <div className="grid grid-cols-[1fr_112px] items-stretch gap-3.5 max-[380px]:grid-cols-[1fr_92px]">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-gray-500">{name} · ppO2 {ppTxt(s.pp)} · {place}</p>
          <p key={`${m}-${raw >= 0}`} className="my-1 animate-number-pop text-[64px] font-extrabold leading-none tracking-[-0.02em] tabular-nums text-black max-[380px]:text-[54px]">
            {raw >= 0 ? <>{m}<span className="ml-1 text-[26px] font-bold tracking-normal text-gray-500">m</span></> : '—'}
          </p>
          <p className="text-[13.5px] font-medium text-gray-500">
            {raw < 0 ? L.subUnusable : hyp > 0 ? <>{L.subRangeA} <b className="text-black">{hyp} m</b> {L.subRangeB} <b className="text-black">{m} m</b>.</>
              : <>{L.subMax} <b className="text-black">{m} m</b> {L.subMaxEnd}</>}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {raw >= 0 ? (
              <>
                {s.pp < 1.6 && m16 > m && <Chip tone="low">{L.chip16} <b>{m16} m</b></Chip>}
                <Chip>{L.chipExact} <b>{n.d(raw, 1)} m</b></Chip>
                <Chip>{L.chipPmax} <b>{n.d(pa, 2)} bar</b></Chip>
              </>
            ) : (
              <Chip>{L.chipSurface} <b>{ppTxt(ppAt(0, s.o2, E))} bar</b></Chip>
            )}
          </div>
        </div>
        <Gauge m={raw >= 0 ? m : 0} m16={m16} hyp={hyp} aria={fill(L.gaugeAria, { m })} />
      </div>
      {msgs.map(([t, title, line]) => <Box key={title} tone={t} title={title}>{line}</Box>)}
      <div className="mt-3">
        <Stepper label={L.checkLabel} sub={<b className={`text-[13px] font-bold ${chkTone}`}>{chkTxt}</b>} unit="m" ariaLabel={L.checkAria} {...stp('d')} />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => copyText(summary, toast.say, L.toast.copied, L.toast.fail)}
          className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(18,132,199,0.3)] transition-all duration-200 ease-out-expo hover:bg-primary-600 active:scale-[0.98]">
          {L.copyBtn}
        </button>
        {canShare && (
          <button type="button" onClick={() => navigator.share({ text: summary }).catch(() => {})} className={secondaryBtn + ' !min-h-11 px-5'}>
            {L.shareBtn}
          </button>
        )}
      </div>
    </Card>
  )

  const how = (
    <HowCard title={L.how.title}>
      <p>{L.how.intro}</p>
      <Formula>{L.how.f1}</Formula>
      <Formula>{L.how.f2}</Formula>
      <Bullets items={L.how.items} />
      <p className={T.small}>{L.how.foot}</p>
    </HowCard>
  )

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start lg:gap-x-7">
      <div className="flex min-w-0 flex-col gap-3 lg:col-start-1">
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <div className="grid grid-cols-4 gap-1.5">
            {MIXES.map((o2) => <Choice key={o2} on={s.o2 === o2} onClick={() => set('o2', o2)}>{mixName(o2)}</Choice>)}
          </div>
          <div className="mt-2">
            <Stepper label={L.s1.o2} sub={L.s1.o2Sub} unit={L.units.pctO2} ariaLabel={L.s1.o2Aria} {...stp('o2')} />
          </div>
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <div className="grid grid-cols-4 gap-1.5">
            {PPS.map((pp, i) => {
              const on = s.pp === pp
              return (
                <button key={pp} type="button" aria-pressed={on} onClick={() => set('pp', pp)}
                  className={`min-h-[52px] rounded-xl border px-0.5 py-1.5 text-center transition-all duration-200 ease-out-expo active:scale-95 ${
                    on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'
                  }`}>
                  <b className="block text-base font-extrabold tabular-nums">{ppTxt(pp)}</b>
                  <small className={`block text-[11px] font-medium leading-tight ${on ? 'text-white/85' : 'text-gray-500'}`}>{L.s2.ppNames[i]}</small>
                </button>
              )
            })}
          </div>
          <div className="mt-2">
            <Stepper label={L.s2.other} unit="bar" ariaLabel={L.s2.otherAria} {...stp('pp')} />
          </div>
        </Card>

        <Card>
          <SectionHead no={3} title={L.s3.title} help={L.s3.help} />
          <Segmented ariaLabel={L.s3.aria} value={s.water} onChange={(v) => setS((p) => ({ ...p, water: v }))}
            options={[{ v: 'sea', label: L.s3.sea }, { v: 'fresh', label: L.s3.fresh }]} />
          {fresh && (
            <div className="mt-2">
              <Stepper label={L.s3.alt} sub={L.s3.altSub} unit="m" ariaLabel={L.s3.altAria} {...stp('alt')} />
            </div>
          )}
        </Card>
      </div>

      <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:col-start-2 lg:row-span-2 lg:row-start-1" style={{ top: headerH + 16 }}>
        {result}
        {how}
      </aside>

      <Card className="min-w-0 lg:col-start-1">
        <SectionHead no={4} title={L.s4.title} help={L.s4.help} />
        <table className="w-full border-collapse text-[14px] tabular-nums">
          <thead>
            <tr>
              <th className="pb-2 text-left text-xs font-semibold text-gray-500">{L.s4.mix}</th>
              {TABLE_PPS.map((p) => <th key={p} className="pb-2 text-right text-xs font-semibold text-gray-500">{ppTxt(p)}</th>)}
            </tr>
          </thead>
          <tbody>
            {MIXES.map((o2) => {
              const on = o2 === s.o2
              return (
                <tr key={o2} onClick={() => { set('o2', o2); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`cursor-pointer border-t border-gray-200 transition-colors ${on ? 'bg-primary-50 font-bold' : 'hover:bg-gray-50'}`}>
                  <td className="py-2 pl-1 text-left font-semibold">{mixName(o2)}</td>
                  {TABLE_PPS.map((p) => {
                    const v = mod(p, o2, E)
                    return <td key={p} className={`py-2 pr-1 text-right ${Math.abs(p - s.pp) < EPS ? 'font-bold text-primary' : ''}`}>{v >= 0 ? v : '—'}</td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className={`mt-2.5 ${T.small}`}>{fill(L.s4.foot, { place: fresh ? place : L.placeSea })}</p>
      </Card>
      {toast.node}
    </div>
  )
}

