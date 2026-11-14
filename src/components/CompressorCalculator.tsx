'use client'

import { useMemo, useRef } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import { DEFAULT_STATE, N_QUICK, PRESETS, PRESET_KEYS, SPECS, STORAGE_KEY, bump, calc, sanitizeState } from '@/lib/compresseur/engine'
import type { CompParams, CompState } from '@/lib/compresseur/engine'
import {
  Card, Fold, HowBlocks, HowCard, Pill, SectionHead, Stepper, SubLabel, T, Verdict, clampTo, copyText, fill, makeNum, secondaryBtn,
  useToast, usePersistentState,
} from './tool-ui'

type Labels = typeof fr.compresseur
type K = keyof CompParams
const STACK = ['#0c4a6e', '#1284c7', '#38bdf8', '#7dd3fc', '#bae6fd', '#9ca3af']

export default function CompressorCalculator({ labels }: { labels: Labels }) {
  const L = labels
  const [s, setS] = usePersistentState<CompState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const N = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const nf = (x: number, d = 0) => N.d(Math.round(x * 10 ** d) / 10 ** d, d)
  const eur = (x: number, d = 2) => fill(L.eur, { v: nf(x, d) })
  const eur0 = (x: number) => eur(x, 0)
  const sgn = (x: number, f: (v: number) => string = eur0) => (x > 0.004 ? '+' : x < -0.004 ? '−' : '') + f(Math.abs(x))
  const ansTxt = (y: number) => (!Number.isFinite(y) ? L.never : y < 1 ? fill(L.months, { n: nf(Math.max(1, Math.ceil(y * 12))) }) : fill(L.years, { n: nf(y, 1) }))
  const { say, node: toast } = useToast(true)
  const resRef = useRef<HTMLDivElement>(null)
  const sp = { decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase }
  const setK = (k: K, v: number) => setS((p) => ({ ...p, [k]: v, preset: PRESET_KEYS.includes(k as (typeof PRESET_KEYS)[number]) ? null : p.preset }))
  const field = (k: K) => {
    const f = L.f[k]
    return (
      <Stepper key={k} label={f[0]} sub={f[1] || undefined} unit={f[2]} ariaLabel={f[0]} display={nf(s[k], SPECS[k].d)} {...sp}
        onBump={(dir) => setK(k, bump(k, s[k], dir))} onSet={(v) => setK(k, clampTo(v, SPECS[k].mi, SPECS[k].ma))} />
    )
  }
  const fields = (ks: K[]) => <div className="grid gap-2">{ks.map(field)}</div>

  // ── Calculs (modèle) ──
  const R = calc(s)
  const badPr = s.pr >= s.pf
  const ok = s.n > 0 && !badPr
  const W: { err?: boolean; t: string }[] = []
  if (badPr) W.push({ err: true, t: L.w.pr })
  if (s.n === 0) W.push({ err: true, t: L.w.n })
  if (s.n > 0 && R.marge <= 0) W.push({ err: true, t: fill(L.w.marge, { p: eur(s.prix), m: eur(R.marginal) }) })
  if (R.hYear > 2000) W.push({ t: fill(L.w.hours, { h: nf(R.hYear) }) })
  if (s.n > 0 && R.vieAns < s.ans - 0.05) W.push({ t: fill(L.w.life, { h: nf(s.vieH), y: nf(R.vieAns, 1), a: s.ans }) })
  if (s.revente > R.invest) W.push({ t: L.w.resale })
  if (s.temp >= 35) W.push({ t: L.w.hot })
  if (s.nAna === 0) W.push({ t: L.w.ana })

  const seuilN = Math.ceil(R.seuil)
  const perWeek = s.n / 52
  type V = { tone: 'ok' | 'mid' | 'low'; t: string; x: string } | null
  let verdict: V = null
  if (ok) {
    const minPrice = eur(R.revient - s.trajets / s.n)
    if (R.marge <= 0) verdict = { tone: 'low', t: L.v.noT, x: fill(L.v.noMarge, { m: eur(R.marginal) }) }
    else if (!Number.isFinite(R.seuil)) verdict = { tone: 'low', t: L.v.noT, x: fill(L.v.noEver, { p: minPrice }) }
    else if (R.gain < 0) verdict = { tone: 'low', t: L.v.notYetT, x: fill(L.v.notYet, { n: nf(Math.ceil(R.seuil - s.n)), p: minPrice }) }
    else if (R.payback > R.vieAns) verdict = { tone: 'mid', t: L.v.lateT, x: fill(L.v.late, { y: ansTxt(R.payback), v: nf(R.vieAns, 1) }) }
    else verdict = { tone: 'ok', t: L.v.okT, x: (R.seuil > 0 ? fill(L.v.okX, { k: nf(s.n / R.seuil, 1) }) : L.v.okX0) + fill(L.v.okY, { y: ansTxt(R.payback) }) }
  }

  // Années : argent cumulé (barres)
  const years: number[] = []
  if (ok) {
    const Ny = Math.min(15, Math.max(1, Math.ceil(R.vieAns - 1e-9)))
    for (let y = 0; y <= Ny; y++) years.push(-R.invest + y * R.cashNet + (y === Ny && R.vieAns <= Ny + 1e-9 ? Math.min(s.revente, R.invest) : 0))
  }
  const ymx = Math.max(...years.map(Math.abs), 1)

  // Répartition par gonflage
  const per = (x: number) => (ok ? x / s.n : 0)
  const parts = ([
    [L.stack.amort, per(R.amort), fill(L.stack.amortSub, { y: nf(R.vieAns, 1) })],
    [L.stack.fixed, per(R.analyses + R.controles + R.divers), L.stack.fixedSub],
    [L.stack.elec, per(R.energie), fill(L.stack.elecSub, { k: nf(per(R.kwh), 2) })],
    [L.stack.filters, per(R.filtres), fill(R.cart >= 2 ? L.stack.cartsSub : L.stack.cartSub, { n: nf(R.cart, 1) })],
    [L.stack.revs, per(R.revisions), fill(L.stack.revsSub, { n: nf(R.revs, 1) })],
    [L.stack.mo, per(R.mo), ''],
  ] as [string, number, string][]).map((p, i) => ({ t: p[0], v: p[1], sub: p[2], c: STACK[i] })).filter((p, i) => p.v > 0.00001 || i !== 5)
  const tot = parts.reduce((a, p) => a + p.v, 0) || 1

  // Scénarios
  const base = s.n || 1000
  let rows = [0.25, 0.5, 1, 1.5, 2, 3].map((k) => Math.round((base * k) / 50) * 50).filter((n) => n > 0)
  if (s.n > 0) rows.push(s.n)
  if (Number.isFinite(R.seuil) && R.seuil > 0) rows.push(seuilN)
  rows = [...new Set(rows)].sort((a, b) => a - b)

  const summary = () => [
    L.copyTpl.title,
    fill(L.copyTpl.comp, { a: eur0(s.achat), i: eur0(s.install), d: nf(s.debit), kw: nf(s.kw, 1) }),
    fill(L.copyTpl.act, { n: nf(s.n), v: s.vol, pr: s.pr, pf: s.pf, p: eur(s.prix) }),
    fill(L.copyTpl.cost, { v: eur(R.revient) }),
    fill(L.copyTpl.gain, { v: sgn(R.gain) }),
    fill(L.copyTpl.seuil, { v: Number.isFinite(R.seuil) ? fill(L.copyTpl.seuilN, { n: nf(seuilN) }) : L.copyTpl.never }),
    fill(L.copyTpl.payback, { v: ansTxt(R.payback) }),
  ].join('\n')

  const kpi = (lbl: string, val: string, sub: string, cls = 'text-black', main = false) => (
    <div className={`min-w-0 rounded-xl border px-3 py-2 ${main ? 'col-span-2 border-primary-200 bg-primary-50' : 'border-gray-200'}`}>
      <small className="block text-xs font-semibold text-gray-500">{lbl}</small>
      <b className={`block font-extrabold leading-tight tabular-nums ${main ? 'text-[34px]' : 'text-[21px]'} ${cls}`}>{val}</b>
      <div className="mt-0.5 text-[11.5px] font-medium leading-snug text-gray-500">{sub}</div>
    </div>
  )
  const gainCls = !ok ? 'text-black' : R.gain >= 0 ? 'text-primary-600' : 'text-red-700'

  return (
    <div className="flex flex-col gap-3 pb-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-7 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-3">
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <div className="mb-2.5 grid grid-cols-3 gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" aria-pressed={s.preset === p.id} onClick={() => setS((q) => ({ ...q, ...p.v, preset: p.id }))}
                className={`min-h-12 rounded-xl border px-2 py-1.5 text-left leading-tight transition-colors ${s.preset === p.id ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'}`}>
                <b className="block text-[13.5px] font-bold">{L.presets[p.id]}</b>
                <small className={`block text-[11px] font-medium ${s.preset === p.id ? 'text-white/85' : 'text-gray-500'}`}>{fill(L.presetSub, { d: p.debit, kw: nf(p.kw, 1) })}</small>
              </button>
            ))}
          </div>
          {fields(['achat', 'install', 'debit', 'kw'])}
          <Fold title={L.s1.more}>
            {fields(['rend', 'ans', 'vieH', 'revente'])}
            <p className={`mt-2 ${T.small}`}>{L.s1.moreHint}</p>
          </Fold>
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <SubLabel first>{L.s2.perYear}</SubLabel>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {N_QUICK.map((n) => <Pill key={n} on={s.n === n} onClick={() => setK('n', n)}>{nf(n)}</Pill>)}
          </div>
          {fields(['n', 'vol', 'pf', 'pr', 'prix'])}
          {badPr && <p className="mt-1.5 text-xs font-semibold text-red-700">{L.w.pr}</p>}
          {s.n > 0 && <p className={`mt-2 ${T.small}`}>{fill(L.s2.hint, { w: nf(perWeek, perWeek < 10 ? 1 : 0), l: nf(R.volL), m: nf(R.minPer, 1) })}</p>}
          <Fold title={L.s2.trips}>
            {fields(['trajets'])}
            <p className={`mt-2 ${T.small}`}>{L.s2.tripsHint}</p>
          </Fold>
        </Card>

        <Card>
          <SectionHead no={3} title={L.s3.title} help={L.s3.help} />
          <SubLabel first>{L.s3.elec}</SubLabel>
          {fields(['kwh', 'temp'])}
          <p className={`mt-1.5 ${T.small}`}>
            {s.temp === 20 ? L.s3.tempHint20 : fill(R.tempF < 1 ? L.s3.tempLess : L.s3.tempMore, { t: s.temp, p: nf(Math.abs(R.tempF - 1) * 100) })}
          </p>
          <SubLabel>{L.s3.filters}</SubLabel>
          {fields(['filtre', 'filtreM3', 'filtreMin'])}
          <p className={`mt-1.5 ${T.small}`}>{fill(L.s3.filterHint, { h: nf(R.filtreLifeH), n: nf(R.volM3 > 0 ? R.filtreLifeM3 / R.volM3 : 0) })}</p>
          <SubLabel>{L.s3.revs}</SubLabel>
          {fields(['rev', 'revH', 'revAns'])}
          <SubLabel>{L.s3.fixed}</SubLabel>
          {fields(['nAna', 'ana', 'ctrl', 'divers'])}
          <Fold title={L.s3.mo}>
            {fields(['mo'])}
            <p className={`mt-2 ${T.small}`}>{L.s3.moHint}</p>
          </Fold>
        </Card>

        <div>
          <HowCard title={L.how.title}>
            <HowBlocks sections={L.how.sections} foot={L.how.foot} />
          </HowCard>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div ref={resRef} className="scroll-mt-24">
          <Card aria-live="polite" className="border-l-[6px] border-l-primary">
            <div className="grid grid-cols-2 gap-2">
              {kpi(L.k.cost, ok ? eur(R.revient) : '–', ok ? fill(L.k.costSub, { m: eur(R.marginal) }) : '', 'text-black', true)}
              {kpi(L.k.gain, ok ? sgn(R.gain) : '–', L.k.gainSub, gainCls)}
              {kpi(L.k.payback, ok ? ansTxt(R.payback) : '–', fill(L.k.paybackSub, { v: eur0(R.invest) }))}
              {kpi(L.k.seuil, !Number.isFinite(R.seuil) ? L.never : fill(L.k.seuilV, { n: nf(seuilN) }), Number.isFinite(R.seuil) ? fill(L.k.seuilSub, { n: nf(seuilN / 52, 0) }) : L.k.seuilLow)}
              {kpi(L.k.marge, ok ? sgn(s.prix - R.revient, eur) : '–', L.k.margeSub)}
            </div>
            {verdict && <Verdict tone={verdict.tone} title={verdict.t}>{verdict.x}</Verdict>}
            {W.length > 0 && (
              <ul className="mt-2.5 grid gap-1.5">
                {W.map((x) => (
                  <li key={x.t} className={`rounded-xl border-l-[5px] px-3 py-2 text-[13px] font-medium leading-snug ${x.err ? 'border-l-red-600 bg-red-50 text-red-800' : 'border-l-amber-500 bg-amber-50 text-amber-900'}`}>{x.t}</li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card>
          <SectionHead title={L.gauge.title} className="mb-3" />
          {ok && Number.isFinite(R.seuil) ? (() => {
            const mx = Math.max(s.n, R.seuil) * 1.3 || 1, ps = (R.seuil / mx) * 100, pn = (s.n / mx) * 100
            return (
              <>
                <div className="relative mt-5 h-3.5 rounded-full bg-red-200">
                  <div className="absolute inset-y-0 right-0 rounded-r-full bg-primary-200" style={{ left: `${ps}%` }} />
                  <div className="absolute -bottom-1 -top-1 w-0 border-l-2 border-dashed border-black/50" style={{ left: `${ps}%` }} />
                  <div className="absolute -top-5 -translate-x-1/2 text-[18px] leading-none text-black" style={{ left: `${Math.min(98, Math.max(2, pn))}%` }}>▼</div>
                </div>
                <div className="mt-2 flex justify-between gap-2 text-[13px] font-medium text-gray-600">
                  <span>{L.gauge.seuil} <b className="text-black">{nf(seuilN)}</b> {L.gauge.unit}</span>
                  <span>{L.gauge.you} <b className="text-black">{nf(s.n)}</b></span>
                </div>
                <p className={`mt-1.5 ${T.small}`}>{fill(L.gauge.foot, { m: eur(R.marge) })}</p>
              </>
            )
          })() : <p className={T.small}>{L.gauge.none}</p>}
        </Card>

        {ok && (
          <Card>
            <SectionHead title={L.yrs.title} className="mb-3" />
            <div className="grid gap-1">
              {years.map((c, y) => (
                <div key={y} className="grid grid-cols-[52px_1fr_84px] items-center gap-2 text-[12.5px]">
                  <span className="font-semibold text-gray-500">{y === 0 ? L.yrs.buy : fill(L.yrs.year, { n: y })}</span>
                  <div className="relative h-3 rounded-full bg-gray-100">
                    <i className="absolute left-1/2 top-[-2px] h-4 w-px bg-gray-300" />
                    <i className={`absolute inset-y-0 rounded-full ${c >= 0 ? 'bg-primary' : 'bg-red-500'}`}
                      style={c >= 0 ? { left: '50%', width: `${(Math.abs(c) / ymx) * 50}%` } : { right: '50%', width: `${(Math.abs(c) / ymx) * 50}%` }} />
                  </div>
                  <b className={`text-right font-bold tabular-nums ${c >= 0 ? 'text-primary-600' : 'text-red-700'}`}>{sgn(c)}</b>
                </div>
              ))}
            </div>
            <p className={`mt-2 ${T.small}`}>{L.yrs.foot}{s.revente > 0 ? L.yrs.footResale : ''}.</p>
          </Card>
        )}

        <Card>
          <SectionHead title={L.stack.title} className="mb-3" />
          <div className="flex h-4 overflow-hidden rounded-full bg-gray-100">
            {parts.map((p) => <i key={p.t} title={p.t} style={{ width: `${(p.v / tot) * 100}%`, background: p.c }} />)}
          </div>
          <ul className="mt-2.5 divide-y divide-gray-100 text-[13px]">
            {parts.map((p) => (
              <li key={p.t} className="flex items-center gap-2 py-1.5">
                <i className="h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/5" style={{ background: p.c }} />
                <span className="min-w-0 flex-1 font-semibold text-gray-700">{p.t}{p.sub && <small className="block text-xs font-medium text-gray-500">{p.sub}</small>}</span>
                <span className="w-10 text-right text-xs font-medium tabular-nums text-gray-500">{nf((p.v / tot) * 100)} %</span>
                <b className="w-16 text-right font-bold tabular-nums text-black">{eur(p.v)}</b>
              </li>
            ))}
            <li className="flex items-center gap-2 py-1.5 font-bold text-black">
              <span className="flex-1 pl-[18px]">{L.stack.total}</span>
              <b className="text-right tabular-nums">{ok ? eur(R.revient) : '–'}</b>
            </li>
          </ul>
        </Card>

        <Card>
          <SectionHead title={L.sc.title} help={L.sc.help} className="mb-3" />
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-[13px] tabular-nums">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                <tr>{L.sc.cols.map((c, i) => <th key={c} className={`px-2.5 py-2 ${i ? 'text-right' : 'text-left'}`}>{c}</th>)}</tr>
              </thead>
              <tbody className="font-medium text-gray-700">
                {rows.map((n) => {
                  const x = calc({ ...s, n }), me = n === s.n, se = Number.isFinite(R.seuil) && n === seuilN && !me
                  return (
                    <tr key={n} onClick={() => { setK('n', n); say(fill(L.sc.picked, { n: nf(n) })) }}
                      className={`cursor-pointer border-t border-gray-100 transition-colors ${me ? 'bg-primary-50 font-bold text-black' : se ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-2.5 py-1.5">{nf(n)}{se ? L.sc.seuil : ''}</td>
                      <td className="px-2.5 py-1.5 text-right">{eur(x.revient)}</td>
                      <td className={`px-2.5 py-1.5 text-right font-bold ${x.gain >= 0 ? 'text-primary-600' : 'text-red-700'}`}>{sgn(x.gain)}</td>
                      <td className="px-2.5 py-1.5 text-right">{ansTxt(x.payback)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:flex-1">
          <SectionHead title={L.facts.title} className="mb-3" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {([
              [L.facts.hours, `${nf(R.hYear)} h`], [L.facts.air, `${nf(R.m3Year)} m³`], [L.facts.kwh, `${nf(R.kwh)} kWh`], [L.facts.carts, nf(R.cart, 1)],
              [L.facts.revs, nf(R.revs, 1)], [L.facts.spend, eur0(R.total)], [s.trajets > 0 ? L.facts.incomeTrips : L.facts.income, eur0(R.recettes)], [L.facts.life, fill(L.years, { n: nf(R.vieAns, 1) })],
            ] as const).map(([a, b]) => (
              <div key={a} className="min-w-0 rounded-xl bg-gray-50 px-2.5 py-2">
                <small className="block text-[11.5px] font-semibold text-gray-500">{a}</small>
                <b className="block text-[15px] font-extrabold tabular-nums text-black">{b}</b>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" className={secondaryBtn} onClick={() => copyText(summary(), say, L.copied, L.copyFail)}>{L.copy}</button>
            <button type="button" className={secondaryBtn} onClick={() => { setS(DEFAULT_STATE); say(L.resetDone) }}>{L.reset}</button>
          </div>
        </Card>
      </div>

      {/* Barre résultat fixe en bas sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 text-left text-white">
          <span className="min-w-0"><small className="block text-[11.5px] font-semibold opacity-85">{L.k.cost}</small><b className="text-[17px] font-extrabold tabular-nums">{ok ? eur(R.revient) : '–'}</b></span>
          <span className="min-w-0 text-right"><small className="block text-[11.5px] font-semibold opacity-85">{L.k.gain}</small><b className="text-[17px] font-extrabold tabular-nums">{ok ? sgn(R.gain) : '–'}</b></span>
        </button>
      </div>
      {toast}
    </div>
  )
}
