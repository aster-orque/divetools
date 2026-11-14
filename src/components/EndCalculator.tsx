'use client'

import { useMemo, useRef } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  DEFAULT_STATE, DEPTHS, LIMS, MIXES, MODES, SPECS, STORAGE_KEY, bestMix, ceil, density, end, floor, frac, K, maxDepth,
  maxDepthDensity, minHe, mixName, narcIndex, pAbs, sanitizeState,
} from '@/lib/end/engine'
import type { EndState, Mode } from '@/lib/end/engine'
import {
  Card, Choice, HowBlocks, HowCard, Pill, SectionHead, Segmented, Stepper, T, Tile, U, Verdict, clampTo, copyText, fill, makeNum,
  secondaryBtn, stepValue, useToast, usePersistentState,
} from './tool-ui'
import type { Lvl } from './tool-ui'

type Labels = typeof fr.end
/** Code couleur des gaz : O2 vert, N2 bleu Orque (air), He gris (gaz inerte, léger). */
const GAS = { o2: '#16a34a', n2: '#1284c7', he: '#9ca3af' }

/** Échelle de profondeur : réel à gauche, END à droite. */
function Scale({ d, endV, valid, L }: { d: number; endV: number; valid: boolean; L: Labels['res'] }) {
  const max = Math.max(40, Math.ceil(Math.max(d, endV, 0) / 20) * 20), H = 200, top = 14, h = H - top - 8
  const y = (v: number) => top + Math.max(0, Math.min(1, v / max)) * h
  const ticks: number[] = []
  for (let v = 0; v <= max; v += max > 100 ? 40 : 20) ticks.push(v)
  const mk = (v: number, col: string, txt: string, side: boolean) => {
    const yy = y(v), x = side ? 76 : 50
    return (
      <g>
        <circle cx={x + 8} cy={yy} r="6" fill={col} stroke="#fff" strokeWidth="1.5" />
        <text x={x + 8} y={yy + (side ? 18 : -10)} fontSize="10.5" fontWeight="700" textAnchor="middle" fill={col}>{txt}</text>
      </g>
    )
  }
  return (
    <svg viewBox={`0 0 120 ${H}`} aria-hidden className="h-auto w-[104px] shrink-0 sm:w-[120px]">
      <defs>
        <linearGradient id="end-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bae6fd" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <rect x="46" y={top} width="62" height={h} rx="6" fill="url(#end-water)" />
      {ticks.map((v) => (
        <g key={v}>
          <line x1="40" x2="46" y1={y(v)} y2={y(v)} stroke="#9ca3af" />
          <text x="36" y={y(v) + 4} fontSize="10" textAnchor="end" fill="#6b7280">{v}</text>
        </g>
      ))}
      {valid && endV < d - 0.5 && <line x1="58" y1={y(d)} x2="84" y2={y(Math.max(0, endV))} stroke="#fff" strokeWidth="1.5" strokeDasharray="3 3" />}
      {mk(d, '#131418', L.scaleReal, false)}
      {valid && mk(Math.max(0, endV), '#1284c7', 'END', true)}
    </svg>
  )
}

export default function EndCalculator({ labels }: { labels: Labels }) {
  const L = labels
  const [s, setS] = usePersistentState<EndState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const N = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const nf = N.d
  const { say, node: toast } = useToast(true)
  const resRef = useRef<HTMLDivElement>(null)
  const sp = { decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase }
  const stp = (k: keyof typeof SPECS) => ({
    display: nf(s[k]),
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) })),
    onSet: (v: number) => setS((p) => ({ ...p, [k]: clampTo(v, SPECS[k].min, SPECS[k].max) })),
    ...sp,
  })
  const name = (o2: number, he: number) => mixName(o2, he, L.heliox, L.pureO2)

  // ── Calculs (modèle) ──
  const f = frac(s.o2, s.he), valid = f.n2 >= -1e-9
  const P = pAbs(s.d), ppo2 = P * f.o2
  const raw = { on: end(s.d, s.o2, s.he, 'on'), n2: end(s.d, s.o2, s.he, 'n2'), all: end(s.d, s.o2, s.he, 'all') }
  const shown = (m: Mode) => Math.max(0, ceil(raw[m]))
  const v = shown(s.mode)
  const st: Lvl = v <= s.lim ? (v > s.lim - 3 ? 'mid' : 'ok') : 'low'
  const rho = density(s.d, s.o2, s.he)
  const rhoSt: Lvl = rho <= 5.2 + 1e-9 ? 'ok' : rho <= 6.2 + 1e-9 ? 'mid' : 'low'
  const alerts: { tone: Lvl | 'info'; t: string; x: string }[] = []
  if (valid) {
    if (rhoSt === 'low') alerts.push({ tone: 'low', t: fill(L.al.densT, { r: nf(rho, 1) }), x: L.al.dens })
    if (ppo2 > 1.6 + 1e-9) alerts.push({ tone: 'low', t: fill(L.al.ppHighT, { pp: nf(ppo2, 2) }), x: L.al.ppHigh })
    else if (ppo2 > 1.4 + 1e-9) alerts.push({ tone: 'mid', t: fill(L.al.ppMidT, { pp: nf(ppo2, 2) }), x: L.al.ppMid })
    if (ppo2 < 0.16 - 1e-9) alerts.push({ tone: 'low', t: fill(L.al.hypoT, { pp: nf(ppo2, 2) }), x: L.al.hypo })
    if (s.o2 < 16 && ppo2 >= 0.16) alerts.push({ tone: 'mid', t: L.al.surfT, x: fill(L.al.surf, { o2: s.o2, d: Math.max(0, ceil((0.16 / f.o2 - 1) * 10)) }) })
    if (s.mode !== 'n2' && s.o2 > 21 && s.he === 0 && raw.n2 < raw.on - 0.5) alerts.push({ tone: 'info', t: L.al.nxT, x: L.al.nx })
  }
  const md = maxDepth(s.lim, s.o2, s.he, s.mode)
  const mod14 = floor((1.4 / f.o2 - 1) * 10)
  const heP = ceil(minHe(s.lim, s.d, s.o2, s.mode) * 100)
  const bm = bestMix(s.d, 1.4, s.lim, s.mode)
  const same = !!bm && bm.o2 === s.o2 && bm.he === s.he
  const pct = (x: number) => Math.max(0, x * 100)

  const summary = () => {
    const sh = (m: Mode) => Math.max(0, ceil(end(s.d, s.o2, s.he, m)))
    return fill(L.copyTpl, {
      mix: name(s.o2, s.he), d: s.d, on: sh('on'), n2: sh('n2'), all: sh('all'), pp: nf(ppo2, 2), rho: nf(rho, 1),
      lim: s.lim, md: Math.max(0, floor(md)), mode: L.modes[s.mode].tile,
    })
  }
  const verdictTxt = st === 'low' ? L.res.over : st === 'mid' ? L.res.near : L.res.within

  return (
    <div className="flex flex-col gap-3 pb-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-7 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-3">
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <div className="grid grid-cols-4 gap-1.5">
            {MIXES.map((m) => (
              <Choice key={m.n} on={m.o2 === s.o2 && m.he === s.he} onClick={() => setS((p) => ({ ...p, o2: m.o2, he: m.he }))} className="py-1 leading-tight">
                {m.n}
                <small className="block text-[10.5px] font-medium opacity-80">{'s' in m ? `≤ ${m.s} m` : ' '}</small>
              </Choice>
            ))}
          </div>
          <div className={`mt-2.5 grid gap-2 rounded-xl ${valid ? '' : 'ring-2 ring-red-500 ring-offset-2'}`}>
            <Stepper label={L.s1.o2} unit="% O₂" ariaLabel={L.s1.o2Aria} {...stp('o2')} />
            <Stepper label={L.s1.he} unit="% He" ariaLabel={L.s1.heAria} {...stp('he')} />
          </div>
          <div className="mt-3 flex h-7 overflow-hidden rounded-lg text-[12px] font-bold text-white" aria-hidden>
            {([['o2', f.o2, s.o2], ['n2', f.n2, pct(f.n2)], ['he', f.he, s.he]] as const).map(([k, fr, val]) => (
              <div key={k} className="flex items-center justify-center transition-[flex-basis] duration-300" style={{ flexBasis: `${pct(fr)}%`, background: GAS[k] }}>
                {fr >= 0.08 ? `${nf(val)} %` : ''}
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-xs font-medium text-gray-500">
            {(['o2', 'n2', 'he'] as const).map((k) => (
              <span key={k}><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] align-[-1px]" style={{ background: GAS[k] }} />{L.s1.legend[k]}</span>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <Stepper label={L.s2.depth} unit="m" ariaLabel={L.s2.depthAria} {...stp('d')} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEPTHS.map((d) => <Pill key={d} on={s.d === d} onClick={() => setS((p) => ({ ...p, d }))}>{d} m</Pill>)}
          </div>
        </Card>

        <Card className="lg:flex-1">
          <SectionHead no={3} title={L.s3.title} help={L.s3.help} />
          <Segmented<Mode> ariaLabel={L.s3.title} value={s.mode} onChange={(m) => setS((p) => ({ ...p, mode: m }))}
            options={MODES.map((m) => ({ v: m, label: L.modes[m].seg, sub: L.modes[m].orgs }))} />
          <p className={`mt-2 ${T.small}`}>{L.modes[s.mode].note}</p>
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
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-gray-500">{L.modes[s.mode].lbl}</p>
                {valid ? (
                  <>
                    <p key={v} className="animate-number-pop text-[52px] font-extrabold leading-[1.05] tabular-nums text-black max-[380px]:text-[44px]">{v}<U>m</U></p>
                    <p className="text-[13px] font-medium leading-snug text-gray-500">
                      {fill(L.res.sub, { d: s.d, v })}{raw[s.mode] < 0 ? L.res.belowSurface : ''}.
                    </p>
                    <Verdict tone={st} title={fill(verdictTxt, { lim: s.lim })} />
                  </>
                ) : (
                  <>
                    <p className="text-[52px] font-extrabold leading-[1.05] text-gray-300">–</p>
                    <p className="text-[13px] font-medium text-gray-500">{L.res.invalidSub}</p>
                    <Verdict tone="low" title={L.res.invalidT}>{L.res.invalid}</Verdict>
                  </>
                )}
              </div>
              <Scale d={s.d} endV={valid ? raw[s.mode] : 0} valid={valid} L={L.res} />
            </div>
            {valid && (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {MODES.map((m) => (
                    <button key={m} type="button" aria-pressed={m === s.mode} onClick={() => setS((p) => ({ ...p, mode: m }))}
                      className={`min-w-0 rounded-xl border px-2.5 py-2 text-left transition-colors ${m === s.mode ? 'border-primary bg-primary-50' : 'border-gray-200 bg-white hover:border-primary'}`}>
                      <small className="block truncate text-xs font-semibold text-gray-500">{L.modes[m].tile}</small>
                      <b className="block text-[20px] font-extrabold tabular-nums text-black">{shown(m)}<U>m</U></b>
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5">
                  <b className={`whitespace-nowrap text-[22px] font-extrabold tabular-nums ${rhoSt === 'ok' ? 'text-black' : rhoSt === 'mid' ? 'text-amber-700' : 'text-red-700'}`}>{nf(rho, 1)}<U>g/L</U></b>
                  <div className="min-w-0 flex-1">
                    <div className="relative h-2.5 rounded-full" style={{ background: 'linear-gradient(90deg,#1284c7 0 61.9%,#f59e0b 61.9% 73.8%,#dc2626 73.8%)' }}>
                      <i className="absolute -top-1 h-[18px] w-1 -translate-x-1/2 rounded-full bg-black ring-2 ring-white transition-[left] duration-300" style={{ left: `${Math.min(100, (rho / 8.4) * 100)}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs font-medium leading-snug text-gray-500">{L.dens.label} · {L.dens[rhoSt]}</p>
                  </div>
                </div>
                {alerts.map((a) => a.tone === 'info'
                  ? <div key={a.t} className="mt-2.5 rounded-xl border-l-[5px] border-l-gray-200 bg-gray-50 px-3 py-2.5"><p className="text-[15px] font-extrabold text-black">{a.t}</p><p className="text-[13px] font-medium leading-snug text-gray-600">{a.x}</p></div>
                  : <Verdict key={a.t} tone={a.tone} title={a.t}>{a.x}</Verdict>)}
              </>
            )}
          </Card>
        </div>

        <Card>
          <SectionHead title={L.lim.title} help={L.lim.help} />
          <div className="flex flex-wrap gap-1.5">
            {LIMS.map((l) => <Pill key={l} on={s.lim === l} onClick={() => setS((p) => ({ ...p, lim: l }))}>END {l} m</Pill>)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Tile label={L.lim.maxD} value={!valid ? '–' : Number.isFinite(md) ? <>{nf(Math.max(0, floor(md)))}<U>m</U></> : '∞'}
              sub={valid ? fill(L.lim.maxDSub, { lim: s.lim }) + (Number.isFinite(md) && mod14 < floor(md) ? fill(L.lim.maxDPp, { m: Math.max(0, mod14) }) : '') : undefined} />
            <Tile label={fill(L.lim.minHe, { d: s.d })} value={!valid || heP + s.o2 > 100 ? '–' : <>{nf(heP)}<U>% He</U></>}
              sub={!valid ? undefined : heP + s.o2 > 100 ? fill(L.lim.minHeNo, { o2: s.o2 }) : heP === 0 ? fill(L.lim.minHeZero, { o2: s.o2 }) : fill(L.lim.minHeSub, { o2: s.o2, he: s.he }) + (s.he >= heP ? ' ✓' : '')} />
            <Tile label={L.lim.rho} value={!valid ? '–' : <>{nf(Math.max(0, floor(maxDepthDensity(5.2, s.o2, s.he))))}<U>m</U></>}
              sub={valid ? fill(L.lim.rhoSub, { m: Math.max(0, floor(maxDepthDensity(6.2, s.o2, s.he))) }) : undefined} />
            <button type="button" disabled={!valid || !bm || same}
              onClick={() => { if (bm) { setS((p) => ({ ...p, o2: bm.o2, he: bm.he })); say(L.lim.applied) } }}
              className="min-w-0 rounded-xl border-2 border-primary bg-primary-50 px-3 py-2 text-left transition-colors enabled:hover:bg-primary-100 disabled:border-gray-200 disabled:bg-white">
              <small className="block text-xs font-semibold text-gray-500">{fill(L.lim.best, { d: s.d })}</small>
              <b className="block text-[22px] font-extrabold leading-tight tabular-nums text-primary-600">{valid && bm ? name(bm.o2, bm.he) : '–'}</b>
              <div className="mt-0.5 text-[11.5px] font-medium leading-snug text-gray-500">
                {!valid ? '' : !bm ? L.lim.bestNo : fill(L.lim.bestSub, {
                  pp: nf((P * bm.o2) / 100, 2), e: Math.max(0, ceil(end(s.d, bm.o2, bm.he, s.mode))), r: nf(density(s.d, bm.o2, bm.he), 1),
                }) + (same ? L.lim.bestSame : L.lim.bestTry)}
              </div>
            </button>
          </div>
        </Card>

        <Card className="lg:flex-1">
          <SectionHead title={L.pp.title} help={valid ? fill(L.pp.help, { d: s.d, p: nf(P, 1) }) : undefined} />
          {valid && (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-[13px] tabular-nums">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                  <tr>{L.pp.cols.map((c, i) => <th key={c} className={`px-2.5 py-2 ${i ? 'text-right' : 'text-left'}`}>{c}</th>)}</tr>
                </thead>
                <tbody className="font-medium text-gray-700">
                  {([['o2', f.o2, K.o2], ['n2', f.n2, K.n2], ['he', f.he, K.he]] as const).map(([k, fr, kk]) => (
                    <tr key={k} className="border-t border-gray-100">
                      <td className="px-2.5 py-2"><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-[-1px]" style={{ background: GAS[k] }} />{L.pp.gas[k]}</td>
                      <td className="px-2.5 py-2 text-right">{nf(fr * 100, Math.abs(fr * 100 - Math.round(fr * 100)) > 1e-6 ? 1 : 0)} %</td>
                      <td className="px-2.5 py-2 text-right font-bold text-black">{nf(P * fr, 2)}</td>
                      <td className="px-2.5 py-2 text-right">× {nf(kk, 2)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 bg-gray-50 font-bold text-black">
                    <td className="px-2.5 py-2">{L.pp.index}</td><td />
                    <td className="px-2.5 py-2 text-right">{nf(narcIndex(s.d, s.o2, s.he), 2)}</td>
                    <td className="px-2.5 py-2 text-right text-xs font-medium text-gray-500">{L.pp.air}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 lg:mt-auto lg:pt-3">
            <button type="button" className={secondaryBtn} disabled={!valid} onClick={() => copyText(summary(), say, L.copied, L.copyFail)}>{L.copy}</button>
            <button type="button" className={secondaryBtn} onClick={() => { setS(DEFAULT_STATE); say(L.resetDone) }}>{L.reset}</button>
          </div>
        </Card>
      </div>

      {/* Barre résultat fixe en bas sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 text-white">
          <span className="text-[13px] font-semibold opacity-90">{fill(L.cta, { mix: name(s.o2, s.he), d: s.d })}</span>
          <b className="text-xl font-extrabold tabular-nums">{valid ? `END ${v} m` : '–'}</b>
        </button>
      </div>
      {toast}
    </div>
  )
}
