'use client'

import { useEffect, useMemo, useState } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  GOALS, HALVES, INT_DEFAULT, INT_KEY, INT_SPECS, PAUSES, addClock, hm, nowHM, residualUp, sanitizeInt, timeTo, zone,
} from '@/lib/cns-surface/engine'
import type { IntState } from '@/lib/cns-surface/engine'
import {
  Bullets, Card, Formula, Gauge, HowCard, LVL_FILL, LVL_TXT, Pill, SectionHead, Segmented, Stepper, T, TimeField, U, Verdict,
  clampTo, fill, stepValue, usePersistentState,
} from './tool-ui'

type Labels = typeof fr.cnsInterval
type Key = keyof typeof INT_SPECS

export default function CnsIntervalCalculator({ labels, locale }: { labels: Labels; locale: string }) {
  const L = labels
  const [s, setS] = usePersistentState<IntState>(INT_KEY, INT_DEFAULT, sanitizeInt)
  // L'heure de sortie n'est pas mémorisée : on part de maintenant (après montage, pas d'écart d'hydratation).
  const [exit, setExit] = useState('')
  useEffect(() => setExit(nowHM()), [])
  const nf = useMemo(() => new Intl.NumberFormat(L.numberLocale, { maximumFractionDigits: 0 }), [L.numberLocale])
  const r0 = (x: number) => nf.format(Math.round(x))

  const stp = (k: Key) => ({
    display: r0(s[k]),
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, INT_SPECS[k].step, INT_SPECS[k].min, INT_SPECS[k].max) })),
    onSet: (v: number) => setS((p) => ({ ...p, [k]: clampTo(Math.round(v), INT_SPECS[k].min, INT_SPECS[k].max) })),
    decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase,
  })
  const clk = (m: number) => {
    const c = addClock(exit, m)
    return c ? c.hhmm + (c.day ? fill(L.dayPlus, { n: c.day }) : '') : null
  }
  const H = s.half, fin = s.fin
  const bigDur = (m: number) => {
    const h = Math.floor(m / 60), mm = m % 60
    return h ? <>{h}<U>h</U>{mm ? ` ${String(mm).padStart(2, '0')}` : ''}</> : <>{mm}<U>min</U></>
  }

  // ── Résultat (modèle) ──
  const isInt = s.mode === 'int'
  const t = timeTo(fin, s.goal, H), at = residualUp(fin, t, H)
  const left = residualUp(fin, s.pause, H)
  const gaugeTo = isInt ? (t ? at : fin) : left
  const warns: { tone: 'ok' | 'mid' | 'low'; t: string; x?: string; fix?: number }[] = []
  if (fin > 100) warns.push({ tone: 'low', t: L.res.over100T, x: L.res.over100 })
  else if (fin > 80) warns.push({ tone: 'mid', t: L.res.over80T, x: L.res.over80 })
  if (isInt && s.next > 0) {
    const start = t ? at : fin, end = start + s.next, z = end > 100 ? 'low' : end > 80 ? 'mid' : 'ok', fix = 80 - s.next
    warns.push({
      tone: z, t: fill(L.res.endT, { end }),
      x: `${fill(L.res.end, { start, next: s.next })} ${z === 'ok' ? L.res.endOk : fix >= 1 ? L.res.endOver : L.res.endTooBig}`,
      fix: z !== 'ok' && fix >= 1 ? fix : undefined,
    })
  }
  if (isInt && s.goal >= 80) warns.push({ tone: 'mid', t: fill(L.res.goalHighT, { goal: r0(s.goal) }), x: L.res.goalHigh })

  // Échelle par demi-vies (0, 1, 2, 3, 4, 6), plus le point visé
  const tgt = isInt ? t : s.pause
  const rows = [0, 1, 2, 3, 4, 6].map((k) => ({ t: k * H, v: residualUp(fin, k * H, H), hit: false }))
  if (tgt > 0 && !rows.some((r) => r.t === tgt)) rows.push({ t: tgt, v: residualUp(fin, tgt, H), hit: true })
  rows.sort((a, b) => a.t - b.t)
  const maxV = Math.max(fin, 1)

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-7">
      <div className="flex min-w-0 flex-col gap-3">
        <Segmented ariaLabel={L.tabs.int} value={s.mode} onChange={(v) => setS((p) => ({ ...p, mode: v }))} className="bg-white shadow-soft"
          options={[{ v: 'int', label: L.tabs.int }, { v: 'red', label: L.tabs.red }]} />

        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <div className="grid gap-2">
            <Stepper label={L.s1.fin} sub={L.s1.finSub} unit="%" ariaLabel={L.s1.finAria} {...stp('fin')} />
            <TimeField label={L.s1.exit} aria={L.s1.exitAria} value={exit} onChange={setExit} action={{ label: L.s1.now, onClick: () => setExit(nowHM()) }} />
          </div>
          <a href={`/${locale}/cns`} className="mt-3 inline-block text-[13px] font-semibold text-primary underline-offset-2 hover:underline">{L.s1.calc} →</a>
        </Card>

        {isInt ? (
          <Card>
            <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
            <div className="mb-2 flex flex-wrap gap-1.5">
              {GOALS.map((g) => <Pill key={g} on={s.goal === g} onClick={() => setS((p) => ({ ...p, goal: g }))}>{g} %</Pill>)}
            </div>
            <div className="grid gap-2">
              <Stepper label={L.s2.goal} sub={L.s2.goalSub} unit="%" ariaLabel={L.s2.goalAria} {...stp('goal')} />
              <Stepper label={L.s2.next} sub={L.s2.nextSub} unit="%" ariaLabel={L.s2.nextAria} {...stp('next')} />
            </div>
          </Card>
        ) : (
          <Card>
            <SectionHead no={2} title={L.s2red.title} help={L.s2red.help} />
            <div className="mb-2 flex flex-wrap gap-1.5">
              {PAUSES.map((p) => <Pill key={p} on={s.pause === p} onClick={() => setS((q) => ({ ...q, pause: p }))}>{hm(p)}</Pill>)}
            </div>
            <Stepper label={L.s2red.pause} sub={s.pause >= 60 ? hm(s.pause) : L.s2red.pauseSub} unit="min" ariaLabel={L.s2red.pauseAria} {...stp('pause')} />
          </Card>
        )}

        <Card>
          <SectionHead title={L.half.title} help={L.half.help} className="mb-3" />
          <Segmented ariaLabel={L.half.title} value={s.half} onChange={(v) => setS((p) => ({ ...p, half: v }))}
            options={HALVES.map((h) => ({ v: h, label: `${h} min`, sub: h === 90 ? L.half.std : L.half.safe }))} />
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <Card aria-live="polite" className={`border-l-[6px] ${isInt && t === 0 ? 'border-l-primary' : 'border-l-primary'}`}>
          {isInt ? (
            t === 0 ? (
              <>
                <p className="text-[12.5px] font-semibold text-gray-500">{L.res.min}</p>
                <p className="text-[52px] font-extrabold leading-[1.05] tabular-nums text-black">0<U>min</U></p>
                <p className="text-[13px] font-medium text-gray-500">{fill(L.res.already, { fin: r0(fin), goal: r0(s.goal) })}</p>
              </>
            ) : (
              <>
                <p className="text-[12.5px] font-semibold text-gray-500">{L.res.wait}</p>
                <p key={t} className="animate-number-pop text-[52px] font-extrabold leading-[1.05] tabular-nums text-black max-[380px]:text-[44px]">{bigDur(t)}</p>
                <p className="text-[13px] font-medium text-gray-500">
                  {fill(L.res.from, { fin: r0(fin), goal: r0(s.goal) })}{s.next > 0 || s.goal >= 80 ? '' : fill(L.res.room, { room: r0(80 - s.goal) })}
                </p>
                {clk(t) && <p className="mt-2 inline-block rounded-full bg-primary-50 px-3 py-1 text-[14px] font-medium text-primary-600">{L.res.at} <b className="font-extrabold">{clk(t)}</b></p>}
              </>
            )
          ) : (
            <>
              <p className="text-[12.5px] font-semibold text-gray-500">{fill(L.res.leftAfter, { d: hm(s.pause) })}</p>
              <p key={left} className={`animate-number-pop text-[52px] font-extrabold leading-[1.05] tabular-nums ${zone(left) === 'ok' ? 'text-black' : LVL_TXT[zone(left)]}`}>{left}<U>%</U></p>
              <p className="text-[13px] font-medium text-gray-500">{left < 80 ? fill(L.res.leftOk, { room: 80 - left }) : fill(L.res.leftNo, { left })}</p>
              {clk(s.pause) && <p className="mt-2 inline-block rounded-full bg-primary-50 px-3 py-1 text-[14px] font-medium text-primary-600">{L.res.atTime} <b className="font-extrabold">{clk(s.pause)}</b></p>}
            </>
          )}
          <Gauge max={120} value={gaugeTo} ghost={fin} tone={zone(gaugeTo)}
            zones={[{ from: 80, to: 100, k: 'mid' }, { from: 100, to: 120, k: 'bad' }]} ticks={[{ v: 80 }, { v: 100 }]}
            scale={[{ v: 0, label: '0' }, { v: 80, label: '80' }, { v: 100, label: '100' }, { v: 120, label: '120 %' }]} />
          <div className="mt-1 flex justify-between gap-2 text-xs font-medium tabular-nums text-gray-500">
            <span>{fill(L.res.gFrom, { v: r0(fin) })}</span>
            <span className="font-semibold text-black">{fill(isInt ? L.res.gStart : L.res.gAfter, { v: r0(gaugeTo) })}</span>
          </div>
          {warns.map((w) => (
            <Verdict key={w.t} tone={w.tone} title={w.t}>
              {w.x}
              {w.fix !== undefined && (
                <>
                  <br />
                  <button type="button" onClick={() => setS((p) => ({ ...p, goal: w.fix! }))}
                    className="mt-1.5 min-h-9 rounded-full border border-primary bg-white px-3 text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white">
                    {fill(L.res.endFix, { fix: w.fix })}
                  </button>
                </>
              )}
            </Verdict>
          ))}
        </Card>

        <Card className="flex flex-col lg:flex-1">
          <SectionHead title={L.ladder.title} help={fill(L.ladder.sub, { h: hm(H) })} className="mb-3" />
          <div className="grid gap-1.5">
            {rows.map((r) => {
              const c = clk(r.t), hit = r.hit || (r.t === tgt && tgt > 0)
              return (
                <div key={r.t} className={`grid grid-cols-[92px_minmax(0,1fr)_48px] items-center gap-2.5 rounded-xl px-2.5 py-1.5 ${hit ? 'bg-primary-50 ring-1 ring-inset ring-primary' : 'bg-gray-50'}`}>
                  <span className="text-[13px] font-semibold tabular-nums text-black">
                    {r.t ? `+${hm(r.t)}` : L.ladder.exit}
                    {c && <small className="block text-[11px] font-medium text-gray-500">{c}</small>}
                  </span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-white">
                    <i className={`block h-full rounded-full ${LVL_FILL[zone(r.v)]}`} style={{ width: `${Math.max(2, (r.v / maxV) * 100)}%` }} />
                  </span>
                  <b className="text-right text-[14px] font-extrabold tabular-nums text-black">{r.v} %</b>
                </div>
              )
            })}
          </div>
          <p className={`mt-2 lg:mt-auto lg:pt-2 ${T.small}`}>{fill(L.ladder.note, { h: hm(6 * H) })}</p>
        </Card>

        <HowCard title={L.how.title}>
          <p>{L.how.intro}</p>
          {L.how.formulas.map((f) => <Formula key={f}>{f}</Formula>)}
          <Bullets items={L.how.items} />
          <p>{L.how.keep}</p>
          <p className={T.small}>{L.how.foot}</p>
        </HowCard>
      </div>
    </div>
  )
}
