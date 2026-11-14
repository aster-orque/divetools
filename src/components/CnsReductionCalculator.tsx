'use client'

import { useEffect, useMemo, useState } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  HALVES, RED_DEFAULT, RED_KEY, RED_QC, RED_QT, RED_SPECS, addClock, hm, level as lvlOf, nextLevel, redBump, residual,
  residualUp, sanitizeRed, sinceExit, timeTo,
} from '@/lib/cns-surface/engine'
import type { RedState } from '@/lib/cns-surface/engine'
import {
  Card, Formula, Gauge, HowCard, Pill, SectionHead, Segmented, Stepper, T, TimeField, Tile, U, Verdict, LVL_FILL, LVL_TXT, clampTo, fill, makeNum, usePersistentState,
} from './tool-ui'

type Labels = typeof fr.cnsReduction
const TONE_TXT = LVL_TXT
const BAR_FILL = LVL_FILL

export default function CnsReductionCalculator({ labels, locale }: { labels: Labels; locale: string }) {
  const L = labels
  const n = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const [s, setS] = usePersistentState<RedState>(RED_KEY, RED_DEFAULT, sanitizeRed)
  // « Maintenant » : recalculé chaque minute pour le bouton « Calculer pour maintenant »
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const stp = (k: keyof typeof RED_SPECS, d: number) => ({
    display: String(s[k]),
    onBump: (dir: -1 | 1) => setS((p) => ({
      ...p, [k]: clampTo(k === 'cns' ? p[k] + dir * d : redBump(p[k], dir * d), RED_SPECS[k].min, RED_SPECS[k].max),
    })),
    onSet: (v: number) => setS((p) => ({ ...p, [k]: clampTo(Math.round(v), RED_SPECS[k].min, RED_SPECS[k].max) })),
    decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase,
  })
  const clock = (add: number) => {
    const c = addClock(s.exit, add)
    return c ? c.hhmm + (c.day ? fill(L.dayPlus, { n: c.day }) : '') : ''
  }
  const pct = (v: number) => `${n.d(v)} %`

  // ── Calculs (modèle) ──
  const c = s.cns, t = s.t, H = s.half
  const r = residualUp(c, t, H), lv = lvlOf(r)
  const exact = residual(c, t, H)
  const tiny = exact < 1
  const max = Math.max(100, c)
  const lim = Math.max(0, 80 - s.nx)
  const tNx = lim >= 1 ? timeTo(c, lim, H) : Infinity
  const t5 = timeTo(c, 5, H)
  const ex = tiny ? ` ${L.res.tiny}` : Math.abs(exact - r) > 0.05 ? ` ${fill(L.res.exactUp, { v: n.upTo(Math.round(exact * 10) / 10, 1) })}` : ''
  const waitTxt = Number.isFinite(tNx) && tNx > t
    ? ` ${fill(s.nx ? L.res.waitNext : L.res.waitBack, { d: hm(tNx - t), nx: s.nx })}${s.exit ? fill(L.res.waitAt, { h: clock(tNx) }) : ''}.`
    : ''
  const verdict = lv === 'ok'
    ? { t: L.res.okT, x: fill(L.res.okL, { r, ex, room: 80 - r }) }
    : lv === 'mid'
      ? { t: L.res.midT, x: fill(L.res.midL, { r, ex }) + waitTxt }
      : { t: L.res.lowT, x: fill(L.res.lowL, { r, ex }) + waitTxt }

  const at = (m: number) => (s.exit ? ` · ${clock(m)}` : '')
  const se = sinceExit(s.exit)

  const tot = r + s.nx, nl = nextLevel(tot), room = 80 - r
  const nextBox = nl === 'ok'
    ? { t: L.next.okT, x: fill(L.next.okL, { tot }) + (room > s.nx ? fill(L.next.okRoom, { room }) : '') }
    : nl === 'mid'
      ? { t: L.next.midT, x: fill(L.next.midL, { tot }) + waitTxt + (room > 0 ? fill(L.next.midRoom, { room }) : '') }
      : { t: L.next.lowT, x: fill(L.next.lowL, { tot }) }

  const steps = [0, 1, 2, 3, 4, 5, 6].map((k) => k * H)
  const near = steps.reduce((a, x) => (Math.abs(x - t) < Math.abs(a - t) ? x : a), steps[0])
  const barsLim = lim >= 1 ? fill(s.nx ? L.bars.lim : L.bars.limNoNext, { lim, nx: s.nx }) : fill(L.bars.limNone, { nx: s.nx })

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-7">
      <div className="flex min-w-0 flex-col gap-3">
        <p className="text-[13px] font-medium text-gray-500">
          {L.other.text}{' '}
          <a href={`/${locale}/cns-intervalle`} className="font-semibold text-primary underline-offset-2 hover:underline">{L.other.link} →</a>
        </p>
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <Stepper label={L.s1.cns} sub={L.s1.cnsSub} unit="%" ariaLabel={L.s1.cnsAria} {...stp('cns', 1)} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {RED_QC.map((v) => <Pill key={v} on={s.cns === v} onClick={() => setS((p) => ({ ...p, cns: v }))}>{v} %</Pill>)}
          </div>
          <a href={`/${locale}/cns`} className="mt-3 inline-block text-[13px] font-semibold text-primary underline-offset-2 hover:underline">{L.s1.calc} →</a>
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <Stepper label={L.s2.t} sub={hm(t)} unit="min" ariaLabel={L.s2.tAria} {...stp('t', 15)} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {RED_QT.map((v) => <Pill key={v} on={s.t === v} onClick={() => setS((p) => ({ ...p, t: v }))}>{hm(v)}</Pill>)}
          </div>
          <div className="mt-2">
            <TimeField label={L.s2.exit} sub={L.s2.exitSub} aria={L.s2.exitAria} value={s.exit} clearLabel={L.s2.clear}
              onChange={(v) => setS((p) => ({ ...p, exit: v }))} />
          </div>
          {se !== null && se !== t && (
            <button type="button" onClick={() => setS((p) => ({ ...p, t: se }))}
              className="mt-2 min-h-11 w-full rounded-xl border border-dashed border-primary bg-primary-50 px-3 text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white">
              {fill(L.s2.now, { d: hm(se) })}
            </button>
          )}
        </Card>

        <Card>
          <SectionHead title={L.half.title} help={L.half.help} className="mb-3" />
          <Segmented ariaLabel={L.half.title} value={s.half} onChange={(v) => setS((p) => ({ ...p, half: v }))}
            options={HALVES.map((h) => ({ v: h, label: `${h} min`, sub: h === 90 ? L.half.std : L.half.safe }))} />
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <Card aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12.5px] font-semibold text-gray-500">{L.res.k}</p>
              <p key={r} className={`animate-number-pop text-[52px] font-extrabold leading-[1.05] tabular-nums max-[380px]:text-[44px] ${lv === 'ok' ? 'text-black' : TONE_TXT[lv]}`}>
                {tiny ? '< 1' : r}<U>%</U>
              </p>
            </div>
            <p className="text-right text-[13px] font-medium text-gray-500">
              {L.res.from} <b className="font-bold tabular-nums text-black">{pct(c)}</b><br />
              {L.res.after} <b className="font-bold tabular-nums text-black">{hm(t)}{s.exit ? ` (${clock(t)})` : ''}</b>
            </p>
          </div>
          <Gauge max={max} value={r} ghost={c} tone={lv} ticks={[{ v: lim, dashed: true }]}
            zones={[{ from: 80, to: 100, k: 'mid' }, ...(max > 100 ? [{ from: 100, to: max, k: 'bad' as const }] : [])]}
            scale={[
              { v: 0, label: '0' },
              ...(lim >= 10 && lim <= max - 15 ? [{ v: lim, label: String(lim) }] : []),
              ...(max > 100 ? [{ v: 100, label: '100' }] : []),
              { v: max, label: `${max} %` },
            ]} />
          <Verdict tone={lv} title={verdict.t}>
            {verdict.x}
            {c > 100 && <><br /><b className="text-black">{fill(L.res.over100, { c })}</b></>}
          </Verdict>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Tile
              label={s.nx ? fill(L.res.tileNext, { nx: s.nx }) : L.res.tileBack}
              value={!Number.isFinite(tNx) ? '—' : tNx === 0 ? L.res.already : hm(tNx)}
              sub={!Number.isFinite(tNx) ? L.res.tooBig : tNx === 0 ? L.res.fromExit : (t >= tNx ? `${L.res.reached} ✓` : fill(L.res.still, { d: hm(tNx - t) })) + at(tNx)}
            />
            <Tile
              label={L.res.tile5}
              value={t5 === 0 ? L.res.already : hm(t5)}
              sub={(t5 === 0 ? L.res.under5 : t >= t5 ? `${L.res.reached} ✓` : fill(L.res.still, { d: hm(t5 - t) })) + (t5 ? at(t5) : '')}
            />
          </div>
        </Card>

        <Card>
          <SectionHead no={3} title={L.next.title} help={L.next.help} />
          <Stepper label={L.next.nx} sub={L.next.nxSub} unit="%" ariaLabel={L.next.nxAria} {...stp('nx', 5)} />
          <p className="mt-3 flex flex-wrap items-baseline gap-x-1.5 text-sm font-medium tabular-nums text-gray-500" aria-live="polite">
            <b className="text-[22px] font-extrabold text-black">{pct(r)}</b>{L.next.residual} +
            <b className="text-[22px] font-extrabold text-black">{pct(s.nx)}</b>{L.next.planned} =
            <b className={`text-[30px] font-extrabold ${nl === 'ok' ? 'text-black' : TONE_TXT[nl]}`}>{pct(tot)}</b>
          </p>
          <Verdict tone={nl} title={nextBox.t}>{nextBox.x}</Verdict>
        </Card>

        <Card>
          <SectionHead title={fill(L.bars.title, { h: hm(H) })} help={fill(L.bars.sub, { h: hm(H) })} className="mb-3" />
          <div className="grid grid-cols-7 items-end gap-1.5">
            {steps.map((x) => {
              const v = residualUp(c, x, H), l = lvlOf(v), on = x === near && Math.abs(x - t) < H / 2
              return (
                <button key={x} type="button" onClick={() => setS((p) => ({ ...p, t: x }))} aria-label={fill(L.bars.aria, { d: hm(x), v })}
                  className="group flex min-w-0 flex-col items-center gap-1">
                  <span className="text-xs font-bold tabular-nums text-black">{v}</span>
                  <span className={`relative h-[110px] w-full overflow-hidden rounded-lg bg-gray-100 ${on ? 'ring-2 ring-inset ring-primary' : 'group-hover:ring-1 group-hover:ring-inset group-hover:ring-primary'}`}>
                    <i className={`absolute inset-x-0 bottom-0 rounded-t-lg ${BAR_FILL[l]}`} style={{ height: `${Math.min(100, (v / max) * 100)}%` }} />
                    {lim >= 1 && <i className="absolute inset-x-0 border-t-2 border-dashed border-black/40" style={{ bottom: `${(lim / max) * 100}%` }} />}
                  </span>
                  <span className={`whitespace-nowrap text-[11px] tabular-nums ${on ? 'font-bold text-primary' : 'font-medium text-gray-500'}`}>
                    {x === 0 ? L.bars.exit : hm(x).replace(' min', '′')}
                  </span>
                </button>
              )
            })}
          </div>
          <p className={`mt-2 ${T.small}`}>{barsLim}</p>
        </Card>

        <HowCard title={L.how.title}>
          <p>{L.how.intro}</p>
          {L.how.formulas.map((f) => <Formula key={f}>{f}</Formula>)}
          <p>{L.how.rounding}</p>
          <table className="w-full border-collapse text-[13px] tabular-nums">
            <thead>
              <tr>{L.how.tableHead.map((h) => <th key={h} className="border-b border-gray-200 px-1.5 py-1 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
            </thead>
            <tbody>
              {L.how.table.map((row) => (
                <tr key={row.join()}>{row.map((cell, i) => <td key={i} className="border-b border-gray-100 px-1.5 py-1">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
          <p className="font-bold text-black">{L.how.keepTitle}</p>
          <ul className="list-disc space-y-1 pl-5">{L.how.keep.map((k) => <li key={k}>{k}</li>)}</ul>
          <p>{L.how.note}</p>
          <p className={T.small}>{L.how.foot}</p>
        </HowCard>
      </div>
    </div>
  )
}
