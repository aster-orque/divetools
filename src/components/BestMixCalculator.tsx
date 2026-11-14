'use client'

import { useMemo } from 'react'
import type { ReactNode } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  CLUB, DEFAULT_STATE, DEPTHS, EPS, PPS, REF_ROWS, SPECS, STORAGE_KEY, bestMix, clubPick, cnsLimit, density, ead, mod, ndl, pAbs, ppO2,
  sanitizeState,
} from '@/lib/best-mix/engine'
import type { BestMixState, NumKey } from '@/lib/best-mix/engine'
import {
  Box, Card, Formula, Pill, SectionHead, Stepper, T, clampTo, copyText, fill, makeNum, secondaryBtn, stepValue,
  usePersistentState, useToast,
} from './tool-ui'
import type { Tone } from './tool-ui'

type Labels = typeof fr.bestMix

/** Couleurs des gaz (code couleur Orque) : O2 vert, nitrox jaune, air bleu ; azote en gris. */
const GAS = { o2: '#16a34a', nx: '#eab308', air: '#1284c7' }

export default function BestMixCalculator({ labels }: { labels: Labels }) {
  const L = labels
  const n = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const [s, setS] = usePersistentState<BestMixState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const toast = useToast()

  const n1 = (v: number) => n.upTo(v, 1)
  const n2 = (v: number) => n.d(v, 2)
  const ppTxt = (v: number) => n.r(v, 1, 2)
  const mixName = (m: number) => (m >= 100 ? 'O2' : m <= 21 ? L.mixAir : `Nx${m}`)

  const set = (k: NumKey, v: number) => setS((p) => ({ ...p, [k]: v }))
  const bump = (k: NumKey) => (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) }))
  const stp = (k: NumKey, display: string) => ({
    display, onBump: bump(k), onSet: (v: number) => set(k, clampTo(v, SPECS[k].min, SPECS[k].max)),
    decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase,
  })

  // ── Calculs ──
  const d = s.d, pp = s.pp, P = pAbs(d), raw = (pp / P) * 100, b = bestMix(d, pp)
  const box: [Tone, string, string][] = []
  let tone: 'ok' | 'mid' | 'low' = 'ok'
  let cap: string, big: ReactNode, ln: string
  if (b < 21) {
    tone = 'low'
    cap = L.res.none
    big = <>{n1(Math.floor(raw * 10 + EPS) / 10)}<em className="ml-1.5 text-xl font-bold not-italic tracking-normal text-gray-500">% O2</em></>
    ln = L.res.lessThanAir
    box.push(['low', L.box.airTooRich, fill(L.box.airTooRichLine, { d: n1(d), pp: n2(ppO2(21, d)), lim: ppTxt(pp), m: mod(21, pp) })])
  } else {
    cap = b >= 100 ? L.res.o2 : L.res.yours
    big = b >= 100
      ? <>O2<em className="ml-1.5 text-xl font-bold not-italic tracking-normal text-gray-500">100 %</em></>
      : <>Nx{b}<em className="ml-1.5 text-xl font-bold not-italic tracking-normal text-gray-500">{b} % O2</em></>
    ln = fill(L.res.line, { d: n1(d), pp: ppTxt(pp) })
    if (b < 22) box.push(['mid', L.box.airOk, L.box.airOkLine])
    if (pp > 1.4 + EPS) { tone = 'mid'; box.push(['mid', L.box.over14, fill(L.box.over14Line, { pp: ppTxt(pp) })]) }
    if (b >= 100 && d > 0) box.push(['info', L.box.pureO2, L.box.pureO2Line])
    if (d > 40 && b >= 21) box.push(['mid', L.box.narcosis, fill(L.box.narcosisLine, { m: ead(b, d) })])
  }
  if (b >= 21 && density(b, d) > 6.2) box.push(['mid', L.box.dense, fill(L.box.denseLine, { d: n1(d) })])
  if (b > 40 && b < 100) box.push(['info', L.box.over40, L.box.over40Line])
  const shown = b < 21 ? raw : b
  const bigTone = tone === 'ok' ? 'text-black' : tone === 'mid' ? 'text-amber-700' : 'text-red-700'

  const kpi = (label: string, value: ReactNode, sub: string, wide = false) => (
    <div key={label} className={`min-w-0 rounded-xl bg-gray-50 px-2.5 py-2 ${wide ? 'col-span-3' : 'col-span-2'}`}>
      <small className="block text-[11.5px] font-semibold text-gray-500">{label}</small>
      <b className="text-[22px] font-extrabold tabular-nums text-black max-[380px]:text-[19px]">{value}</b>
      <span className="block text-[11.5px] font-medium leading-snug text-gray-500">{sub}</span>
    </div>
  )
  const u = (x: string) => <em className="ml-px text-[13px] font-semibold not-italic text-gray-500">{x}</em>
  const ppB = ppO2(b, d), cns = cnsLimit(ppB), dens = density(b, d)

  const ndlBlock = (() => {
    if (!(b >= 22 && d >= 9)) return null
    const na = ndl(21, d), nm = ndl(b, d)
    const f = (v: number) => (Number.isFinite(v) ? `${v} min` : L.ndl.over200)
    const top = Math.max(Number.isFinite(nm) ? nm : 200, Number.isFinite(na) ? na : 200, 1)
    const w = (v: number) => `${Math.round(((Number.isFinite(v) ? v : 200) / top) * 100)}%`
    const gain = Number.isFinite(nm) && Number.isFinite(na) ? `+${nm - na} min` : Number.isFinite(na) ? L.ndl.longer : ''
    return (
      <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5">
        <h4 className="flex items-baseline justify-between gap-2 text-[13px] font-bold text-black">
          {fill(L.ndl.title, { d: n1(d) })}<span className="tabular-nums text-primary-600">{gain}</span>
        </h4>
        {[{ k: L.mixAir, v: na, c: GAS.air }, { k: mixName(b), v: nm, c: b >= 100 ? GAS.o2 : GAS.nx }].map((r) => (
          <div key={r.k} className="mt-1.5 grid grid-cols-[52px_1fr_64px] items-center gap-2 text-[13px] font-medium tabular-nums">
            <span>{r.k}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-200"><i className="block h-full rounded-full transition-[width] duration-300" style={{ width: w(r.v), background: r.c }} /></div>
            <b className="text-right font-bold">{f(r.v)}</b>
          </div>
        ))}
        <p className="mt-1.5 text-[11.5px] font-medium text-gray-500">{L.ndl.note}</p>
      </div>
    )
  })()

  const slate = () => {
    if (b < 21) return fill(L.slate.none, { d: n1(d), pp: ppTxt(pp), m: mod(21, pp) })
    const pick = clubPick(d, pp)
    return fill(L.slate.ok, { d: n1(d), pp: ppTxt(pp), mix: mixName(b), b, ppb: n2(ppO2(b, d)), m: mod(b, pp), e: ead(b, d) })
      + (pick && pick !== b ? fill(L.slate.club, { mix: mixName(pick), m: mod(pick, pp) }) : '')
  }

  const pick = clubPick(d, pp)

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[460px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="flex min-w-0 flex-col gap-3">
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <Stepper label={L.s1.depth} unit="m" ariaLabel={L.s1.depthAria} {...stp('d', n1(s.d))} />
          <div className="mb-4 mt-2 flex flex-wrap gap-1.5">
            {DEPTHS.map((x) => <Pill key={x} on={s.d === x} onClick={() => set('d', x)}>{x} m</Pill>)}
          </div>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} className="mb-2" />
          <div className="grid grid-cols-3 gap-1.5">
            {PPS.map((p, i) => {
              const on = Math.abs(p - pp) < EPS
              return (
                <button key={p} type="button" aria-pressed={on} onClick={() => set('pp', p)}
                  className={`rounded-xl border px-2.5 py-2 text-left transition-all duration-200 ease-out-expo active:scale-[0.98] ${
                    on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'
                  }`}>
                  <b className="block text-[17px] font-extrabold tabular-nums">{ppTxt(p)}</b>
                  <small className={`block text-[11.5px] font-medium leading-tight ${on ? 'text-white/85' : 'text-gray-500'}`}>{L.s2.names[i]}</small>
                </button>
              )
            })}
          </div>
          <div className="mt-1.5">
            <Stepper label={L.s2.other} unit="bar" ariaLabel={L.s2.otherAria} {...stp('pp', ppTxt(s.pp))} />
          </div>
        </Card>

        <Card aria-live="polite">
          <p className="text-[12.5px] font-semibold text-gray-500">{cap}</p>
          <p key={b} className={`my-1 animate-number-pop text-[56px] font-extrabold leading-none tracking-[-0.02em] tabular-nums max-[380px]:text-[46px] ${bigTone}`}>{big}</p>
          <p className="text-[13.5px] font-medium text-gray-500">{ln}</p>
          <div aria-hidden className="mb-1 mt-3.5 flex h-2 overflow-hidden rounded-full bg-gray-200">
            <i className="block rounded-full transition-[width] duration-300" style={{ width: `${shown}%`, background: GAS.o2 }} />
          </div>
          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span><b className="font-bold text-black">O2</b> {b < 21 ? n1(Math.floor(raw * 10) / 10) : b} %</span>
            <span><b className="font-bold text-black">N2</b> {b < 21 ? n1(100 - Math.floor(raw * 10) / 10) : 100 - b} %</span>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-1.5">
            {b >= 21 ? (
              <>
                {kpi(L.kpi.pp, <>{n2(ppB)}{u('bar')}</>, fill(L.kpi.ppSub, { pp: ppTxt(pp) }))}
                {kpi('MOD', <>{mod(b, pp)}{u('m')}</>, fill(L.kpi.modSub, { pp: ppTxt(pp) }) + (pp < 1.6 - EPS ? fill(L.kpi.modSub16, { m: mod(b, 1.6) }) : ''))}
                {kpi('EAD', <>{ead(b, d)}{u('m')}</>, L.kpi.eadSub)}
                {kpi(L.kpi.cns, Number.isFinite(cns) ? <>{cns}{u('min')}</> : '—', fill(L.kpi.cnsSub, { pp: n2(ppB) }), true)}
                {kpi(L.kpi.density, <>{n.d(dens, 1)}{u('g/L')}</>, Math.round(dens * 10) / 10 > 5.2 ? L.kpi.densityOver : L.kpi.densityRef, true)}
              </>
            ) : (
              <>
                {kpi(L.kpi.ppAir, <>{n2(ppO2(21, d))}{u('bar')}</>, fill(L.kpi.ppSub, { pp: ppTxt(pp) }))}
                {kpi(L.kpi.modAir, <>{mod(21, pp)}{u('m')}</>, fill(L.kpi.modSub, { pp: ppTxt(pp) }))}
                {kpi(L.kpi.pressure, <>{n1(P)}{u('bar')}</>, L.kpi.pressureSub)}
              </>
            )}
          </div>
          {ndlBlock}
          {box.map(([t, title, line]) => <Box key={title} tone={t} title={title}>{line}</Box>)}
          <button type="button" className={`${secondaryBtn} mt-3 w-full`} onClick={() => copyText(slate(), toast.say, L.toast.copied, L.toast.fail)}>
            {L.copy}
          </button>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <Card>
          <h3 className="mb-1 text-[15px] font-bold text-black">{L.club.title}</h3>
          <p className={`mb-2.5 ${T.help}`}>{L.club.help}</p>
          <div className="grid gap-1.5">
            {CLUB.map((m) => {
              const ok = m <= b, isPick = m === pick
              const tag = isPick ? L.club.best : ok ? 'OK' : L.club.tooRich
              return (
                <div key={m} className={`grid grid-cols-[64px_1fr_auto] items-center gap-2.5 rounded-xl border-2 px-3 py-2 ${
                  isPick ? 'border-primary bg-primary-50' : ok ? 'border-transparent bg-gray-50' : 'border-transparent bg-gray-50 opacity-55'
                }`}>
                  <span className="text-[17px] font-extrabold tabular-nums text-black">{mixName(m)}</span>
                  <span className="text-[12.5px] font-medium leading-snug tabular-nums text-gray-500">
                    {fill(L.club.detail, { pp: n2(ppO2(m, d)), m: mod(m, pp) })}{ok ? fill(L.club.ead, { e: ead(m, d) }) : ''}
                  </span>
                  <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isPick ? 'bg-primary text-white' : ok ? 'bg-primary-100 text-primary-600' : 'bg-red-50 text-red-700'
                  }`}>{tag}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 text-[15px] font-bold text-black">{L.ref.title}</h3>
          <p className={`mb-2.5 ${T.help}`}>{L.ref.help}</p>
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[280px] border-separate border-spacing-[3px] text-[14px] tabular-nums">
              <thead>
                <tr>
                  <th className="px-1 text-left text-[11.5px] font-bold text-gray-500">{L.ref.depth}</th>
                  {PPS.map((p) => <th key={p} className="px-1 text-center text-[11.5px] font-bold text-gray-500">{ppTxt(p)} bar</th>)}
                </tr>
              </thead>
              <tbody>
                {REF_ROWS.map((r) => (
                  <tr key={r}>
                    <td className={`pl-1 text-left font-semibold ${r === d ? 'text-primary' : 'text-black'}`}>{r} m</td>
                    {PPS.map((p) => {
                      const v = bestMix(r, p), on = r === d && Math.abs(p - pp) < EPS
                      return (
                        <td key={p} className="p-0 text-center">
                          <button type="button" onClick={() => { setS({ d: r, pp: p }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                            className={`min-h-9 w-full rounded-lg font-semibold transition-colors ${
                              on ? 'bg-primary text-white' : v < 21 ? 'bg-gray-50 text-[12.5px] font-medium text-gray-400 hover:bg-gray-100' : 'bg-gray-50 text-black hover:bg-gray-100'
                            }`}>
                            {v < 21 ? '—' : v >= 100 ? 'O2' : `${v} %`}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`mt-2.5 ${T.small}`}>{L.ref.foot}</p>
        </Card>

        <details className="group rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-soft sm:px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-bold text-black marker:hidden [&::-webkit-details-marker]:hidden">
            {L.how.title}
            <span aria-hidden className="text-xl font-normal text-gray-400 transition-transform duration-200 group-open:rotate-45">+</span>
          </summary>
          <div className="mt-1 text-[13.5px] font-medium leading-relaxed text-gray-700">
            {L.how.steps.map((st) => (
              <div key={st.h} className="mt-2.5">
                <p><b className="text-black">{st.h}</b>{st.p ? ` ${st.p}` : ''}</p>
                {st.f && <div className="mt-1"><Formula>{st.f}</Formula></div>}
                {st.after && <p className="mt-1">{st.after}</p>}
              </div>
            ))}
            <p className="mt-2.5"><b className="text-black">{L.how.exampleTitle}</b> {L.how.example}</p>
            <p className="mt-2.5 font-bold text-black">{L.how.knowTitle}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">{L.how.know.map((k) => <li key={k}>{k}</li>)}</ul>
          </div>
        </details>
      </div>
      {toast.node}
    </div>
  )
}
