'use client'

import { useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  DENS_CAPS, DENS_MAX, DENS_OK, DEFAULT_STATE, PPMINS, QUICK, SPECS, STORAGE_KEY, compute, nearestStandard, sanitizeState, table,
} from '@/lib/trimix-composition/engine'
import type { TxResult, TxState } from '@/lib/trimix-composition/engine'
import {
  Card, HowBlocks, HowCard, Pill, SectionHead, Segmented, Stepper, SubLabel, T, Tile, U, Verdict, clampTo, copyText, fill, makeNum,
  secondaryBtn, stepValue, useToast, usePersistentState,
} from './tool-ui'
import type { Lvl } from './tool-ui'

type Labels = typeof fr.trimix
const GAS = { o2: '#16a34a', n2: '#1284c7', he: '#9ca3af' }
const LVL_COL: Record<Lvl, string> = { ok: '#1284c7', mid: '#f59e0b', low: '#dc2626' }
const levelDens = (d: number): Lvl => (d > DENS_MAX + 1e-9 ? 'low' : d > DENS_OK + 1e-9 ? 'mid' : 'ok')

function GasBar({ p, className = 'h-3.5' }: { p: TxResult['pct']; className?: string }) {
  return (
    <div className={`flex overflow-hidden rounded-full bg-gray-100 ${className}`} aria-hidden>
      {(['o2', 'he', 'n2'] as const).map((k) => <i key={k} className="transition-[width] duration-300" style={{ width: `${p[k]}%`, background: GAS[k] }} />)}
    </div>
  )
}

/** Plage d'utilisation : trop peu d'O2 (orange), utilisable (bleu Orque), au-delà de la ppO2 max (rouge). */
function Range({ R, d, L }: { R: TxResult; d: number; L: Labels['range'] }) {
  const mn = R.minDepth, mx = R.modMax
  const top = Math.max(d, Math.min(mx, d * 1.6), 20)
  const scale = Math.ceil((top + 5) / 10) * 10
  const W = 340, H = 92, x0 = 14, x1 = W - 14, y = 34, h = 16
  const X = (m: number) => x0 + (Math.min(m, scale) / scale) * (x1 - x0)
  const ticks: number[] = []
  for (let m = 0; m <= scale; m += scale > 100 ? 20 : 10) ticks.push(m)
  const xd = X(d)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={fill(L.aria, { a: mn, b: mx })} className="block h-auto w-full">
      <rect x={x0} y={y} width={x1 - x0} height={h} rx="4" fill="#f3f4f6" />
      {mn > 0 && <rect x={x0} y={y} width={X(mn) - x0} height={h} fill="#f59e0b" opacity=".75" />}
      <rect x={X(mn)} y={y} width={Math.max(0, X(mx) - X(mn))} height={h} fill="#1284c7" opacity=".85" />
      {mx < scale && <rect x={X(mx)} y={y} width={x1 - X(mx)} height={h} fill="#dc2626" opacity=".7" />}
      {ticks.map((m) => (
        <g key={m}>
          <line x1={X(m)} x2={X(m)} y1={y + h} y2={y + h + 4} stroke="#9ca3af" />
          <text x={X(m)} y={y + h + 16} fontSize="10" textAnchor="middle" fill="#6b7280">{m}</text>
        </g>
      ))}
      <text x={x1} y={y + h + 28} fontSize="10" textAnchor="end" fill="#6b7280">{L.axis}</text>
      <line x1={xd} x2={xd} y1={y - 6} y2={y + h + 2} stroke="#131418" strokeWidth="2" />
      <text x={Math.min(Math.max(xd, 40), W - 40)} y={y - 10} fontSize="11" fontWeight="700" textAnchor="middle" fill="#131418">{fill(L.dive, { d })}</text>
    </svg>
  )
}

export default function TrimixCompositionCalculator({ labels }: { labels: Labels }) {
  const L = labels
  const [s, setS] = usePersistentState<TxState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const N = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const nf = N.d
  const pp2 = (x: number) => nf(x, 2)
  const { say, node: toast } = useToast(true)
  const resRef = useRef<HTMLDivElement>(null)
  const sp = { decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase }
  const stp = (k: keyof typeof SPECS, dec: number) => ({
    display: nf(s[k], dec),
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, [k]: +stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max).toFixed(dec) })),
    onSet: (v: number) => setS((p) => ({ ...p, [k]: +clampTo(Math.round(v / SPECS[k].step) * SPECS[k].step, SPECS[k].min, SPECS[k].max).toFixed(dec) })),
    ...sp,
  })

  // ── Calculs (modèle) ──
  const end = Math.min(s.end, s.depth)
  const R = compute({ depth: s.depth, ppMax: s.ppMax, end, o2narc: s.o2narc, ppMin: s.ppMin, densMax: s.densMax })
  const R0 = s.densMax ? compute({ depth: s.depth, ppMax: s.ppMax, end, o2narc: s.o2narc, ppMin: s.ppMin }) : R
  const p = R.pct, ex = R.exact
  const hasHe = R.kind === 'trimix' || R.kind === 'heliox'
  const std = hasHe ? nearestStandard(s.depth, s.ppMax, end, s.o2narc, s.densMax, s.ppMin) : null
  const dl = levelDens(R.dens)
  const ppo2Lvl: Lvl = R.pp.o2 > 1.6 + 1e-9 ? 'low' : R.pp.o2 > 1.4 + 1e-9 ? 'mid' : 'ok'
  const endR = nf(Math.max(0, R.endReal), 0)
  const kindTxt = R.kind === 'air' || R.kind === 'nitrox' ? L.res.kindNoHe : R.normoxic ? L.res.kindNormo : L.res.kindHypo
  const nameParts = R.name.split(' ')
  const exTxt = (x: number) => (x <= 0 ? '—' : fill(L.res.exact, { v: nf(x, 1) }))

  type Note = { tone: Lvl | 'info'; t: string; x: string; caps?: number[] }
  const notes: Note[] = []
  if (s.end > s.depth) notes.push({ tone: 'info', t: L.n.endClampT, x: fill(L.n.endClamp, { d: s.depth }) })
  if (R.notes.includes('noHe')) notes.push({ tone: 'ok', t: L.n.noHeT, x: fill(L.n.noHe, { d: s.depth, gas: R.kind === 'air' ? L.n.theAir : L.n.thisNx, e: endR, end }) })
  if (R.notes.includes('heliox')) notes.push({ tone: 'info', t: L.n.helioxT, x: L.n.heliox })
  if (R.notes.includes('hypoxic')) notes.push({ tone: 'mid', t: L.n.hypoT, x: fill(L.n.hypo, { o2: p.o2, d: R.minDepth }) })
  if (R.notes.includes('densCapKO')) notes.push({ tone: 'low', t: L.n.capKoT, x: fill(L.n.capKo, { r: nf(R.dens, 1), d: s.depth }) })
  else if (R.notes.includes('densHigh')) notes.push({ tone: 'low', t: L.n.densHighT, x: fill(L.n.densHigh, { r: nf(R.dens, 1) }), caps: [6.2, 5.2] })
  else if (R.notes.includes('densMid')) notes.push({ tone: 'mid', t: L.n.densMidT, x: fill(L.n.densMid, { r: nf(R.dens, 1) }), caps: s.densMax && s.densMax <= 5.2 ? [] : [5.2] })
  if (R.bind === 'density' && R0.name !== R.name) notes.push({ tone: 'info', t: L.n.bindT, x: fill(L.n.bind, { r0: R0.name, he: p.he, cap: nf(s.densMax, 1), e: endR }) })
  if (s.ppMax > 1.4 + 1e-9) notes.push({ tone: 'mid', t: L.n.ppT, x: L.n.pp })

  const depths: number[] = []
  for (let d = 30; d <= 120; d += 10) depths.push(d)
  if (!depths.includes(s.depth)) { depths.push(s.depth); depths.sort((a, b) => a - b) }
  const rows = table(depths, s.ppMax, s.end, s.o2narc, s.ppMin, s.densMax)

  const summary = () => [
    fill(L.copyTpl.l1, { name: R.name, d: s.depth }),
    `O2 ${p.o2} % · He ${p.he} % · N2 ${p.n2} %`,
    fill(L.copyTpl.l2, { pp: pp2(R.pp.o2), e: endR, narc: s.o2narc ? L.copyTpl.narc : '', r: nf(R.dens, 1) }),
    fill(L.copyTpl.l3, { a: R.minDepth, b: R.modMax, m14: R.mod14, m16: R.mod16 }),
    std ? fill(L.copyTpl.l4, { name: std.name }) : '',
  ].filter(Boolean).join('\n')
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: L.title, text: summary() }) } catch { /* annulé */ } }
    else copyText(summary(), say, L.copied, L.copyFail)
  }
  const kv: { lbl: string; v: ReactNode; t?: string; tone?: Lvl }[] = [
    { lbl: 'ppO2', v: <>{pp2(R.pp.o2)}<U>bar</U></>, t: fill(L.res.ppTarget, { v: pp2(s.ppMax) }), tone: ppo2Lvl },
    { lbl: s.o2narc ? L.res.endNarc : L.res.endN2, v: <>{endR}<U>m</U></>, t: fill(L.res.endTarget, { v: end }) },
    { lbl: 'ppN2', v: <>{pp2(R.pp.n2)}<U>bar</U></> },
    { lbl: 'ppHe', v: <>{pp2(R.pp.he)}<U>bar</U></> },
    { lbl: L.res.dens, v: <>{nf(R.dens, 1)}<U>g/L</U></>, t: L.res.densTxt[dl], tone: dl },
    { lbl: fill(L.res.floor, { v: pp2(s.ppMin) }), v: <>{R.minDepth}<U>m</U></>, t: R.minDepth > 0 ? L.res.floorDeep : L.res.floorSurf, tone: R.minDepth > 0 ? 'mid' : 'ok' },
  ]

  return (
    <div className="flex flex-col gap-3 pb-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-7 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-3">
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <Stepper label={L.s1.depth} unit="m" ariaLabel={L.s1.depthAria} {...stp('depth', 0)} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK.depth.map((d) => <Pill key={d} on={s.depth === d} onClick={() => setS((q) => ({ ...q, depth: d }))}>{d} m</Pill>)}
          </div>
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <Stepper label={L.s2.pp} sub={L.s2.ppSub} unit="bar" ariaLabel={L.s2.ppAria} {...stp('ppMax', 2)} />
          <div className="mb-3 mt-2 flex flex-wrap gap-1.5">
            {QUICK.ppMax.map((v) => <Pill key={v} on={s.ppMax === v} onClick={() => setS((q) => ({ ...q, ppMax: v }))}>{nf(v, 1)}</Pill>)}
          </div>
          <Stepper label={L.s2.end} sub={L.s2.endSub} unit="m" ariaLabel={L.s2.endAria} {...stp('end', 0)} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK.end.map((v) => <Pill key={v} on={s.end === v} onClick={() => setS((q) => ({ ...q, end: v }))}>{v} m</Pill>)}
          </div>
          <SubLabel>{L.s2.narc}</SubLabel>
          <Segmented<'0' | '1'> ariaLabel={L.s2.narc} value={s.o2narc ? '1' : '0'} onChange={(v) => setS((q) => ({ ...q, o2narc: v === '1' }))}
            options={[{ v: '0', label: L.s2.narcNo, sub: L.s2.narcNoSub }, { v: '1', label: L.s2.narcYes, sub: L.s2.narcYesSub }]} />
          <SubLabel>{L.s2.ppMin}</SubLabel>
          <Segmented<number> ariaLabel={L.s2.ppMin} value={s.ppMin} onChange={(v) => setS((q) => ({ ...q, ppMin: v }))}
            options={PPMINS.map((v, i) => ({ v, label: nf(v, 2), sub: L.s2.ppMinSub[i] }))} />
          <SubLabel>{L.s2.dens}</SubLabel>
          <Segmented<number> ariaLabel={L.s2.dens} value={s.densMax} onChange={(v) => setS((q) => ({ ...q, densMax: v }))}
            options={DENS_CAPS.map((v, i) => ({ v, label: v ? `≤ ${nf(v, 1)} g/L` : L.s2.densFree, sub: L.s2.densSub[i] }))} />
        </Card>

        <Card className="lg:flex-1">
          <SectionHead title={L.rep.title} help={fill(L.rep.help, {
            pp: pp2(s.ppMax), e: s.end, narc: s.o2narc ? L.rep.narc : '', dens: s.densMax ? fill(L.rep.dens, { v: nf(s.densMax, 1) }) : '',
          })} />
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-[13px] tabular-nums">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                <tr>{L.rep.cols.map((c, i) => <th key={c} className={`px-2.5 py-2 ${i ? 'text-right' : 'text-left'}`}>{c}</th>)}</tr>
              </thead>
              <tbody className="font-medium text-gray-700">
                {rows.map((r) => {
                  const on = r.input.depth === s.depth
                  return (
                    <tr key={r.input.depth} onClick={() => { setS((q) => ({ ...q, depth: r.input.depth })); say(fill(L.rep.picked, { d: r.input.depth })) }}
                      className={`cursor-pointer border-t border-gray-100 transition-colors ${on ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-2.5 py-1.5">{r.input.depth} m</td>
                      <td className={`px-2.5 py-1.5 text-right font-bold ${on ? 'text-primary-600' : 'text-black'}`}>{r.name}</td>
                      <td className="px-2.5 py-1.5 text-right">{r.minDepth ? `${r.minDepth} m` : L.rep.surface}</td>
                      <td className="px-2.5 py-1.5 text-right">
                        <i className="mr-1.5 inline-block h-2 w-2 rounded-full align-[1px]" style={{ background: LVL_COL[levelDens(r.dens)] }} />{nf(r.dens, 1)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className={`mt-2 ${T.small}`}>{L.rep.note}</p>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div ref={resRef} className="scroll-mt-24">
          <Card aria-live="polite" className="border-l-[6px] border-l-primary">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12.5px] font-semibold text-gray-500">{L.res.cap}</p>
                <p key={R.name} className="animate-number-pop text-[46px] font-extrabold leading-[1.05] tabular-nums text-black max-[380px]:text-[40px]">
                  {R.kind === 'air' ? 'Air' : <><span className="mr-2 text-[0.55em] font-bold text-gray-500">{nameParts[0]}</span>{nameParts[1]}</>}
                </p>
              </div>
              <span className={`mt-1 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${R.normoxic ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-700'}`}>{kindTxt}</span>
            </div>
            <GasBar p={p} className="mt-3 h-3.5" />
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {([
                ['o2', p.o2, exTxt(Math.min(100, ex.o2))],
                ['he', p.he, hasHe ? exTxt(ex.he) : L.res.useless],
                ['n2', p.n2, R.kind === 'trimix' ? exTxt(ex.n2) : ' '],
              ] as const).map(([k, v, x]) => (
                <div key={k} className="min-w-0 rounded-xl border border-gray-200 border-t-4 px-2.5 py-2" style={{ borderTopColor: GAS[k] }}>
                  <small className="block text-xs font-semibold text-gray-500">{L.res.gas[k]}</small>
                  <b className="block text-[24px] font-extrabold leading-tight tabular-nums text-black">{v}<U>%</U></b>
                  <div className="text-[11.5px] font-medium text-gray-500">{x}</div>
                </div>
              ))}
            </div>
            <SubLabel>{fill(L.res.bottom, { d: s.depth, p: nf(R.P, 1) })}</SubLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {kv.map((k) => <Tile key={k.lbl} label={k.lbl} value={k.v} sub={k.t} tone={k.tone === 'ok' ? undefined : k.tone} />)}
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              {([
                ['O2', fill(L.binds.o2, { v: pp2(s.ppMax) }), true],
                ['END', hasHe ? (R.bind === 'end' ? L.binds.fixesHe : L.binds.met) : L.binds.already, hasHe && R.bind === 'end'],
                [L.binds.dens, R.bind === 'density' ? L.binds.fixesHe : s.densMax ? L.binds.met : L.binds.free, R.bind === 'density'],
              ] as const).map(([h, t, on]) => (
                <div key={h} className={`rounded-xl border px-2 py-1.5 text-center text-[11.5px] font-medium leading-snug ${on ? 'border-primary bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-500'}`}>
                  <b className={`block text-[13px] font-bold ${on ? 'text-primary-600' : 'text-black'}`}>{h}</b>{t}
                </div>
              ))}
            </div>
            {notes.map((n) => (
              n.tone === 'info' ? (
                <div key={n.t} className="mt-2.5 rounded-xl border-l-[5px] border-l-gray-200 bg-gray-50 px-3 py-2.5">
                  <p className="text-[15px] font-extrabold text-black">{n.t}</p><p className="text-[13px] font-medium leading-snug text-gray-600">{n.x}</p>
                </div>
              ) : (
                <Verdict key={n.t} tone={n.tone} title={n.t}>
                  {n.x}
                  {n.caps && n.caps.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {n.caps.map((c) => (
                        <button key={c} type="button" onClick={() => { setS((q) => ({ ...q, densMax: c })); say(fill(L.n.capped, { v: nf(c, 1) })) }}
                          className="min-h-9 rounded-full border border-current bg-white px-3 text-[12.5px] font-semibold">{fill(L.n.cap, { v: nf(c, 1) })}</button>
                      ))}
                    </span>
                  )}
                </Verdict>
              )
            ))}
            {hasHe && (
              <div className="mt-2.5 rounded-xl border border-gray-200 px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <small className="text-xs font-semibold text-gray-500">{L.std.title}</small>
                  <b className="text-[17px] font-extrabold text-black">{std ? std.name : L.std.none}</b>
                </div>
                <p className="mt-0.5 text-[12.5px] font-medium leading-snug text-gray-500">
                  {std ? <>{fill(L.std.line, { pp: pp2(std.ppO2), e: nf(Math.max(0, std.end), 0), r: nf(std.dens, 1), f: std.minDepth ? `${std.minDepth} m` : L.rep.surface })}<br />{L.std.why}</> : fill(L.std.noneTxt, { d: s.depth })}
                </p>
              </div>
            )}
          </Card>
        </div>

        <Card className="lg:flex lg:flex-1 lg:flex-col">
          <SubLabel first>{L.range.title}</SubLabel>
          <Range R={R} d={s.depth} L={L.range} />
          <p className={`mt-1 ${T.help}`}>{fill(L.range.txt, { a: R.minDepth, b: R.modMax, p1: pp2(s.ppMin), p2: pp2(s.ppMax), m14: R.mod14, m16: R.mod16 })}</p>
          <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-xs font-medium text-gray-500">
            {([['#f59e0b', L.range.lgLow], ['#1284c7', L.range.lgOk], ['#dc2626', L.range.lgHigh]] as const).map(([c, t]) => (
              <span key={t}><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] align-[-1px]" style={{ background: c }} />{t}</span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 lg:mt-auto lg:pt-3">
            <button type="button" className={secondaryBtn} onClick={() => copyText(summary(), say, L.copied, L.copyFail)}>{L.copy}</button>
            <button type="button" className={secondaryBtn} onClick={share}>{L.share}</button>
          </div>
        </Card>

        <div>
          <HowCard title={L.how.title}>
            <HowBlocks sections={L.how.sections} foot={L.how.foot} />
          </HowCard>
        </div>
      </div>

      {/* Barre résultat fixe en bas sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 text-left text-white">
          <span className="min-w-0">
            <b className="block text-[17px] font-extrabold tabular-nums">{R.name}</b>
            <span className="block truncate text-[12px] font-semibold opacity-90">{fill(L.cta, { d: s.depth, pp: pp2(R.pp.o2), e: endR })}</span>
          </span>
          <span className="w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white/70"><GasBar p={p} className="h-2.5" /></span>
        </button>
      </div>
      {toast}
    </div>
  )
}
