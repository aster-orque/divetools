'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  DEFAULT_STATE, PRESETS, SPECS, STORAGE_KEY, bumpValue, compute, equipped, estimate, pick, sanitizeState,
} from '@/lib/lestage/engine'
import type { GlobalKey, LestState, Metal, Suit, Tank, TankKey, Water } from '@/lib/lestage/engine'
import { Box, Card, Stepper, SubLabel, T, copyText, fill, makeNum, secondaryBtn, useHeaderHeight, usePersistentState, useToast } from './tool-ui'

type Labels = typeof fr.lestage
type Which = 'A' | 'B'

/** Couleurs Orque : A = config habituelle (noir), B = nouvelle config (bleu Orque). */
const COL = { A: '#131418', B: '#1284c7' }
const SUIT_IDS: Suit[] = ['aucune', '3', '5', '7', 'etanche']
const WATER_IDS: Water[] = ['douce', 'mer', 'sale']

function TankIcon({ mat, n }: { mat: Metal; n: number }) {
  const col = mat === 'alu' ? '#b9c2cf' : '#6b7a90'
  const one = (x: number) => (
    <g key={x}>
      <rect x={x} y="6" width={n > 1 ? 6 : 10} height="23" rx="3" fill={col} />
      <rect x={x + (n > 1 ? 1.5 : 3)} y="1" width="3" height="5" fill={col} />
    </g>
  )
  return <svg viewBox="0 0 16 30" aria-hidden="true" className="h-[30px] w-4 shrink-0 max-[400px]:w-3">{n > 1 ? [one(1), one(9)] : one(3)}</svg>
}

/** Petit sélecteur à boutons (Mono/Bi, Acier/Alu, eau, combinaison, mode). */
function Seg<V extends string | number>({ value, options, onChange, cols, tone = COL.A, small = false, white = false }: {
  value: V; options: { v: V; label: ReactNode; sub?: ReactNode }[]; onChange: (v: V) => void; cols: number; tone?: string; small?: boolean; white?: boolean
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.v === value
        return (
          <button key={String(o.v)} type="button" aria-pressed={on} onClick={() => onChange(o.v)}
            className={`rounded-xl border px-0.5 font-semibold leading-tight transition-all duration-200 ease-out-expo active:scale-[0.98] ${
              small ? 'min-h-10 text-[12.5px]' : 'min-h-11 text-sm'
            } ${on ? 'text-white' : `border-gray-200 text-black hover:border-gray-300 ${white ? 'bg-white' : 'bg-gray-50'}`}`}
            style={on ? { background: tone, borderColor: tone } : undefined}>
            {o.label}
            {o.sub && <small className={`block text-[11px] font-medium ${on ? 'text-white/85' : 'text-gray-500'}`}>{o.sub}</small>}
          </button>
        )
      })}
    </div>
  )
}

export default function WeightCalculator({ labels }: { labels: Labels }) {
  const L = labels
  const n = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const [s, setS] = usePersistentState<LestState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const [adjOpen, setAdjOpen] = useState<Record<Which, boolean>>({ A: false, B: false })
  const headerH = useHeaderHeight()
  const toast = useToast(true)
  const outRef = useRef<HTMLDivElement>(null)

  // En mode estimé, le poids équipé est déduit de ton poids et de ta combinaison (modèle).
  useEffect(() => {
    if (s.mode !== 'est') return
    const body = Math.round(equipped(s.weight, s.suit))
    if (body !== s.body) setS((p) => ({ ...p, body }))
  }, [s.mode, s.weight, s.suit, s.body, setS])

  const nf = (x: number, d = 1) => n.d(Math.round(x * 10 ** d) / 10 ** d, d)
  const kg = (x: number, d = 1) => `${nf(x, d)} kg`
  const sg = (x: number, d = 1) => `${x > 0.05 ? '+' : x < -0.05 ? '−' : ''}${nf(Math.abs(x), d)} kg`
  const half = (x: number) => { const r = Math.round(x * 2) / 2; return n.d(r, r % 1 ? 1 : 0) }

  const stepperProps = { decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase }
  const showV = (k: keyof typeof SPECS, v: number) => (SPECS[k].step < 1 ? nf(v, 1) : nf(v, 0))
  const gStp = (k: GlobalKey) => ({
    display: showV(k, s[k]),
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, [k]: bumpValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) })),
    onSet: (v: number) => setS((p) => ({ ...p, [k]: Math.min(SPECS[k].max, Math.max(SPECS[k].min, v)) })),
    ...stepperProps,
  })
  const tStp = (w: Which, k: TankKey) => ({
    display: showV(k, s[w][k]),
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, [w]: { ...p[w], [k]: bumpValue(p[w][k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max), pre: 'perso' } })),
    onSet: (v: number) => setS((p) => ({ ...p, [w]: { ...p[w], [k]: Math.min(SPECS[k].max, Math.max(SPECS[k].min, v)), pre: 'perso' } })),
    ...stepperProps,
  })
  const setTank = (w: Which, patch: Partial<Tank>) => setS((p) => ({ ...p, [w]: { ...p[w], ...patch } }))

  // ── Calculs ──
  const startLest = s.mode === 'est' ? estimate(s.A, s).rounded : s.lest
  const r = compute(s.A, s.B, { ...s, lest: startLest })
  const ch = r.change
  const verdictCls = Math.abs(ch) < 0.25 ? 'same' : ch > 0 ? 'add' : 'rem'
  const big = verdictCls === 'same' ? L.res.keep : fill(ch > 0 ? L.res.add : L.res.remove, { kg: half(Math.abs(ch)) })
  const bigColor = verdictCls === 'same' ? '#131418' : COL.B
  const matName = (m: Metal) => L.mat[m]
  const desc = (c: Tank) => fill(L.desc, {
    bi: c.n > 1 ? L.biPrefix : '', v: n.d(c.v, c.v % 1 ? 1 : 0), mat: matName(c.mat), m: nf(c.m, 1), p: c.p,
  })

  const rows: [string, string, string][] = [[
    L.why.tank, sg(r.tanks),
    fill(L.why.tankLine, { how: r.tanks > 0.05 ? L.why.floatsMore : r.tanks < -0.05 ? L.why.sinksMore : L.why.same, res: s.res }),
  ]]
  if (s.A.eau !== s.B.eau) rows.push([L.why.water, sg(r.water), fill(L.why.waterLine, { from: L.from[s.A.eau], to: L.to[s.B.eau], body: s.body })])

  const warns: [string, string][] = []
  if (startLest + r.delta < -0.25) warns.push(['mid', fill(L.warn.tooHeavy, { kg: kg(-(startLest + r.delta)) })])
  if (s.A.p < s.res || s.B.p < s.res) warns.push(['mid', fill(L.warn.underRes, { res: s.res })])
  if (r.gasB > 2.5) warns.push(['info', fill(L.warn.gasWeight, { kg: kg(r.gasB) })])

  const swap = () => {
    const rounded = r.rounded
    setS((p) => ({ ...p, A: p.B, B: p.A, lest: rounded, mode: 'known' }))
    toast.say(fill(L.toast.swapped, { kg: half(rounded) }))
  }
  const reset = () => {
    setS(JSON.parse(JSON.stringify(DEFAULT_STATE)))
    setAdjOpen({ A: false, B: false })
  }
  const copy = () => copyText(
    fill(L.copyText, {
      a: desc(s.A), ea: L.inWater[s.A.eau], lest: half(startLest), est: s.mode === 'est' ? L.estimatedTag : '',
      b: desc(s.B), eb: L.inWater[s.B.eau], delta: sg(r.delta), rounded: half(r.rounded),
    }),
    toast.say, L.toast.copied, L.toast.fail,
  )

  // ── Carte d'une config ──
  const tankCard = (w: Which) => {
    const c = s[w], tone = COL[w]
    return (
      <Card>
        <SubLabel first>{L.cfg.tank}</SubLabel>
        <div className="grid grid-cols-3 gap-1.5 max-[340px]:grid-cols-2">
          {[...PRESETS.map((p) => p.id), 'perso'].map((id) => {
            const on = c.pre === id
            const p = PRESETS.find((x) => x.id === id)
            const t = L.presets[id as keyof typeof L.presets]
            return (
              <button key={id} type="button" aria-pressed={on}
                onClick={() => {
                  if (id === 'perso') { setTank(w, { pre: 'perso' }); setAdjOpen((o) => ({ ...o, [w]: true })) }
                  else setS((q) => ({ ...q, [w]: { ...pick(id), eau: q[w].eau } }))
                }}
                className={`flex min-h-[52px] items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all duration-200 ease-out-expo active:scale-[0.98] max-[400px]:gap-1 max-[400px]:px-1.5 ${
                  on ? 'text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-gray-300'
                }`}
                style={on ? { background: tone, borderColor: tone } : undefined}>
                {p && <TankIcon mat={p.mat} n={p.n} />}
                <span className="min-w-0">
                  <b className="block whitespace-nowrap text-[13.5px] font-bold leading-tight max-[400px]:text-[12.5px]">{t.t}</b>
                  <small className={`block text-[11.5px] font-medium leading-tight max-[400px]:text-[11px] ${on ? 'text-white/85' : 'text-gray-500'}`}>{t.d}</small>
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-[13.5px] font-medium text-gray-700"
          title={fill(L.cfg.sumTitle, { res: s.res })}>
          <span className="min-w-0">{desc(c)}</span>
          <b className="whitespace-nowrap font-bold tabular-nums text-black">{sg(w === 'A' ? r.fA : r.fB)}</b>
        </div>
        <details className="mt-2" open={adjOpen[w]} onToggle={(e) => { const open = e.currentTarget.open; setAdjOpen((o) => (o[w] === open ? o : { ...o, [w]: open })) }}>
          <summary className="cursor-pointer list-none py-1.5 text-[13.5px] font-semibold text-primary marker:hidden [&::-webkit-details-marker]:hidden">
            {L.cfg.adjust} {adjOpen[w] ? '▴' : '▾'}
          </summary>
          <div className="mt-1 grid gap-1.5">
            <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 py-2 pl-3 pr-2">
              <span className="text-[14px] font-semibold text-gray-700">{L.cfg.count}</span>
              <div className="w-[184px] shrink-0 max-[400px]:w-[164px]">
                <Seg cols={2} small white tone={tone} value={c.n} onChange={(v) => setTank(w, { n: v, pre: 'perso', rob: v > 1 ? 1.8 : 0.7 })}
                  options={[{ v: 1, label: L.cfg.mono }, { v: 2, label: L.cfg.bi }]} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 py-2 pl-3 pr-2">
              <span className="text-[14px] font-semibold text-gray-700">{L.cfg.material}</span>
              <div className="w-[184px] shrink-0 max-[400px]:w-[164px]">
                <Seg cols={2} small white tone={tone} value={c.mat} onChange={(v) => setTank(w, { mat: v, pre: 'perso' })}
                  options={[{ v: 'acier', label: L.mat.acierCap }, { v: 'alu', label: L.mat.aluCap }]} />
              </div>
            </div>
            <Stepper label={L.cfg.capacity} sub={L.cfg.capacitySub} unit="L" ariaLabel={L.cfg.capacity} {...tStp(w, 'v')} />
            <Stepper label={L.cfg.mass} sub={L.cfg.massSub} unit="kg" ariaLabel={L.cfg.mass} {...tStp(w, 'm')} />
            <Stepper label={L.cfg.valve} sub={L.cfg.valveSub} unit="kg" ariaLabel={L.cfg.valve} {...tStp(w, 'rob')} />
            <Stepper label={L.cfg.fill} sub={L.cfg.fillSub} unit="bar" ariaLabel={L.cfg.fill} {...tStp(w, 'p')} />
          </div>
        </details>
        <SubLabel>{L.cfg.water}</SubLabel>
        <Seg cols={3} tone={tone} value={c.eau} onChange={(v) => setTank(w, { eau: v })}
          options={WATER_IDS.map((x) => ({ v: x, label: L.waters[x].t, sub: L.waters[x].d }))} />
        {w === 'A' ? (
          <>
            <SubLabel>{L.cfg.yourLest}</SubLabel>
            <Seg cols={2} tone={tone} value={s.mode} onChange={(v) => setS((p) => ({ ...p, mode: v }))}
              options={[{ v: 'known', label: L.cfg.known }, { v: 'est', label: L.cfg.unknown }]} />
            {s.mode === 'known' ? (
              <div className="mt-1.5"><Stepper label={L.cfg.lest} sub={L.cfg.lestSub} unit="kg" ariaLabel={L.cfg.lest} {...gStp('lest')} /></div>
            ) : (
              <div>
                <div className="mt-1.5"><Stepper label={L.cfg.weight} sub={L.cfg.weightSub} unit="kg" ariaLabel={L.cfg.weight} {...gStp('weight')} /></div>
                <SubLabel>{L.cfg.suit}</SubLabel>
                <Seg cols={5} small tone={tone} value={s.suit} onChange={(v) => setS((p) => ({ ...p, suit: v }))}
                  options={SUIT_IDS.map((x) => ({ v: x, label: L.suits[x].t, sub: L.suits[x].d || undefined }))} />
                <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] font-medium text-gray-700">
                  {L.cfg.estA} <b className="text-[15px] font-extrabold text-black">{half(estimate(s.A, s).rounded)} kg</b>
                  <br />{L.cfg.estB}
                </div>
              </div>
            )}
          </>
        ) : (
          s.A.eau !== s.B.eau && s.mode !== 'est' && (
            <div className="mt-1.5"><Stepper label={L.cfg.body} sub={L.cfg.bodySub} unit="kg" ariaLabel={L.cfg.body} {...gStp('body')} /></div>
          )
        )}
      </Card>
    )
  }

  const head = (no: number, title: string, help: string, color: string) => (
    <div className="mb-2.5 flex items-start gap-2.5">
      <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: color }}>{no}</span>
      <div className="min-w-0">
        <h2 className={T.sectionTitle}>{title}</h2>
        <p className={`mt-0.5 ${T.help}`}>{help}</p>
      </div>
    </div>
  )

  // ── Visualisation ──
  const vals = [r.fA, r.fB, r.fullA, r.fullB]
  const M = Math.max(3, Math.ceil(Math.max(...vals.map(Math.abs)) + 0.5))
  const pos = (x: number) => `${(50 + (x / M) * 46).toFixed(1)}%`
  const track = (w: Which, f0: number, f1: number) => {
    const col = COL[w], lo = Math.min(f0, f1), hi = Math.max(f0, f1)
    return (
      <div className="relative mb-2.5 h-11 rounded-[10px]" style={{ background: 'linear-gradient(90deg,#f3f4f6 0 50%,#f0f9ff 50% 100%)' }}>
        <span className="absolute bottom-1 left-1/2 top-1 w-0.5 bg-gray-400/50" />
        <span className="absolute top-1 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-px text-[11px] font-extrabold text-white" style={{ left: pos((f0 + f1) / 2), background: col }}>
          {w === 'A' ? L.viz.usual : L.viz.new}
        </span>
        <span className="absolute top-[26px] h-1.5 rounded-sm opacity-60" style={{ left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})`, background: col }} />
        <span className="absolute top-[22px] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px]" style={{ left: pos(f1), borderColor: col, background: col }} title={L.viz.full} />
        <span className="absolute top-[22px] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px] bg-white" style={{ left: pos(f0), borderColor: col }} title={L.viz.reserve} />
      </div>
    )
  }

  const ctaText = verdictCls === 'same' ? fill(L.cta.keep, { kg: half(r.rounded) }) : `${big} → ${half(r.rounded)} kg`

  return (
    <div className="pb-24 lg:pb-0">
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start lg:gap-7">
        <div className="flex min-w-0 flex-col">
          {head(1, L.s1.title, L.s1.help, COL.A)}
          {tankCard('A')}
          <button type="button" onClick={swap}
            className="my-3 min-h-10 w-full rounded-xl border border-dashed border-gray-300 text-[13px] font-semibold text-primary transition-colors hover:border-primary">
            ⇅ {L.swap}
          </button>
          {head(2, L.s2.title, L.s2.help, COL.B)}
          {tankCard('B')}
          <details className="group mt-3 rounded-2xl border border-gray-200 bg-white shadow-soft">
            <summary className="flex cursor-pointer list-none justify-between px-4 py-3 font-semibold text-black marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
              {L.settings.title}<span aria-hidden className="text-gray-400 transition-transform group-open:rotate-180">▾</span>
            </summary>
            <div className="px-4 pb-4 sm:px-5">
              <div className="grid gap-1.5">
                <Stepper label={L.settings.res} sub={L.settings.resSub} unit="bar" ariaLabel={L.settings.res} {...gStp('res')} />
                <Stepper label={L.settings.o2} sub={L.settings.o2Sub} unit="% O2" ariaLabel={L.settings.o2} {...gStp('o2')} />
              </div>
              <p className={`mt-2.5 ${T.small}`}>{L.settings.foot}</p>
            </div>
          </details>
        </div>

        <div ref={outRef} className="flex min-w-0 scroll-mt-24 flex-col gap-3 lg:sticky" style={{ top: headerH + 16 }}>
          <section aria-live="polite" className="rounded-2xl border-2 border-gray-200 bg-white px-4 py-4 shadow-soft sm:p-5">
            {s.mode === 'est' && <p className="mb-1.5 text-[12.5px] font-medium text-gray-500">{fill(L.res.fromEst, { kg: half(startLest) })}</p>}
            <p key={big} className="animate-number-pop text-[34px] font-extrabold leading-tight tabular-nums" style={{ color: bigColor }}>{big}</p>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3.5 py-3">
              <span className="text-[13.5px] font-medium text-gray-500">{L.res.newLest}<br />{L.inWater[s.B.eau]}</span>
              <b className="text-[26px] font-extrabold tabular-nums text-black">{half(r.rounded)} <em className="text-sm font-semibold not-italic text-gray-500">kg</em></b>
            </div>
            <p className="mt-1.5 text-[12.5px] font-medium text-gray-500">
              {fill(L.res.exact, { l0: nf(startLest, 1), op: r.delta >= 0 ? '+' : '−', d: kg(Math.abs(r.delta)), tot: kg(Math.max(0, startLest + r.delta)) })}
            </p>
            <div className="mt-3 grid gap-1 text-[13.5px] font-medium">
              {rows.map(([k, v, sub], i) => (
                <div key={k} className={`grid grid-cols-[1fr_auto] items-baseline gap-x-2 py-1.5 ${i ? 'border-t border-gray-200' : ''}`}>
                  <span className="text-gray-700">{k}</span>
                  <b className="whitespace-nowrap font-bold tabular-nums text-black">{v}</b>
                  <small className="col-span-2 -mt-0.5 text-xs font-medium text-gray-500">{sub}</small>
                </div>
              ))}
              {rows.length > 1 && (
                <div className="grid grid-cols-[1fr_auto] gap-x-2 border-t-2 border-gray-200 py-1.5 font-bold">
                  <span>{L.why.total}</span><b className="tabular-nums">{sg(r.delta)}</b>
                </div>
              )}
            </div>
            {warns.map(([t, line]) => <Box key={line} tone={t === 'mid' ? 'mid' : 'info'}>{line}</Box>)}
            <Box tone="mid" title={L.theory.title}>{L.theory.line}</Box>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className={secondaryBtn} onClick={copy}>{L.res.copy}</button>
              <button type="button" className={secondaryBtn} onClick={reset}>{L.res.reset}</button>
            </div>
          </section>

          <Card>
            <SubLabel first>{L.viz.title}</SubLabel>
            <div className="mt-1.5">
              <div className="mb-1 flex justify-between text-[11.5px] font-semibold text-gray-500">
                <span>{L.viz.sinks}</span><span>0</span><span>{L.viz.floats}</span>
              </div>
              {track('A', r.fA, r.fullA)}
              {track('B', r.fB, r.fullB)}
            </div>
            <div className="flex flex-wrap gap-3.5 text-xs font-medium text-gray-500">
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-gray-500 bg-gray-500 align-[-1px]" />{L.viz.full}</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full border-2 border-gray-500 align-[-1px]" />{fill(L.viz.at, { res: s.res })}</span>
            </div>
            <table className="mt-1.5 w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th />
                  <th className="py-1 pl-2 text-right text-[11.5px] font-bold" style={{ color: COL.A }}>{L.viz.usual}</th>
                  <th className="py-1 pl-2 text-right text-[11.5px] font-bold" style={{ color: COL.B }}>{L.viz.new}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {([
                  [L.viz.full, sg(r.fullA), sg(r.fullB)],
                  [fill(L.viz.at, { res: s.res }), sg(r.fA), sg(r.fB)],
                  [L.viz.gasUsed, kg(r.gasA), kg(r.gasB)],
                  [L.viz.water, L.waterName[s.A.eau], L.waterName[s.B.eau]],
                ] as const).map(([k, a, b]) => (
                  <tr key={k} className="border-t border-gray-200">
                    <td className="py-1.5 text-left font-medium text-gray-500">{k}</td>
                    <td className="whitespace-nowrap py-1.5 pl-2 text-right font-semibold">{a}</td>
                    <td className="whitespace-nowrap py-1.5 pl-2 text-right font-semibold">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={`mt-2.5 ${T.small}`}>{L.viz.foot}</p>
          </Card>

          <Card>
            <SubLabel first>{L.check.beforeTitle}</SubLabel>
            <p className="mb-1 text-[13.5px] font-medium leading-relaxed text-gray-700">{L.check.before}</p>
            <SubLabel>{L.check.title}</SubLabel>
            <ol className="grid gap-1.5 text-[13.5px] font-medium text-gray-700">
              {L.check.steps.map((st, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11.5px] font-bold text-gray-500">{i + 1}</span>
                  {fill(st, { res: s.res })}
                </li>
              ))}
            </ol>
            <p className={`mt-2.5 ${T.small}`}>{L.check.foot}</p>
          </Card>

          <details className="group rounded-2xl border border-gray-200 bg-white shadow-soft">
            <summary className="flex cursor-pointer list-none justify-between px-4 py-3 font-semibold text-black marker:hidden sm:px-5 [&::-webkit-details-marker]:hidden">
              {L.how.title}<span aria-hidden className="text-gray-400 transition-transform group-open:rotate-180">▾</span>
            </summary>
            <div className="space-y-2 px-4 pb-4 text-[13.5px] font-medium leading-relaxed text-gray-700 sm:px-5">
              {L.how.paras.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
            </div>
          </details>
        </div>
      </div>

      {/* Barre résultat fixe en bas sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => outRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex min-h-[52px] w-full items-center justify-between rounded-xl bg-primary px-4 text-base font-bold text-white">
          <span>{ctaText}</span><span className="text-[13px] font-semibold opacity-85">{L.cta.detail}</span>
        </button>
      </div>
      {toast.node}
    </div>
  )
}
