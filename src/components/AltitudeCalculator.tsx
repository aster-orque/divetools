'use client'

import { useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import { ALTS, DEFAULT_STATE, MIXES, SPECS, SPEEDS, STORAGE_KEY, compute, sanitizeState } from '@/lib/plongee-altitude/engine'
import type { AltResult, AltState, Mode } from '@/lib/plongee-altitude/engine'
import {
  Bullets, Card, Formula, HowCard, Pill, SectionHead, Segmented, Stepper, T, Tile, U, Verdict, clampTo, fill, stepValue, usePersistentState,
} from './tool-ui'

type Labels = typeof fr.altitude
const LAKE = '#38bdf8'
const SEA = '#1284c7'
const ACCENT = '#0369a1'

/** Schéma lac / table : échelle dilatée sur 0–10 m pour que les paliers restent lisibles. */
function Viz({ s, R, L, nf, r0 }: { s: AltState; R: AltResult; L: Labels['viz']; nf: (x: number, d: number) => string; r0: (x: number) => string }) {
  const W = 320, top = 38, bot = 196, x1 = 66, x2 = 208, w = 46
  const maxD = Math.max(15, Math.ceil(Math.max(R.fict, s.prof) / 3) * 3 + 3), zone = 95
  const y = (d: number) => top + (zone * Math.min(d, 10)) / 10 + ((bot - top - zone) * Math.max(0, d - 10)) / (maxD - 10)
  const curve = (ya: number, yb: number) => `M${x1 + w} ${ya} C${x1 + w + 50} ${ya} ${x2 - 50} ${yb} ${x2} ${yb}`
  const ya = y(s.prof), yb = y(R.fict)
  const els: ReactNode[] = []
  R.stops.forEach((st) => {
    const a = y(st.real), b = y(st.table)
    els.push(
      <g key={st.table}>
        <path d={curve(a, b)} fill="none" stroke="#9ca3af" strokeDasharray="3 3" strokeWidth="1.2" />
        <line x1={x1} x2={x1 + w} y1={a} y2={a} stroke={LAKE} strokeWidth="2" />
        <line x1={x2} x2={x2 + w} y1={b} y2={b} stroke={SEA} strokeWidth="2" />
        <text x={x1 - 8} y={a + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#131418">{nf(st.real, 1)}</text>
        <text x={x2 + w + 8} y={b + 4} fontSize="11" fontWeight="600" fill="#131418">{st.table}</text>
      </g>,
    )
  })
  return (
    <svg viewBox={`0 0 ${W} 210`} role="img" aria-label={L.aria} className="mx-auto mt-auto block h-auto w-full max-w-[420px] pt-3">
      <text x={x1 + w / 2} y="14" textAnchor="middle" fontSize="12" fontWeight="700" fill="#131418">{L.lake}</text>
      <text x={x1 + w / 2} y="27" textAnchor="middle" fontSize="10.5" fill="#6b7280">{s.mode === 'mesure' ? '' : `${r0(s.alt)} m · `}{nf(R.pa, 2)} bar</text>
      <text x={x2 + w / 2} y="14" textAnchor="middle" fontSize="12" fontWeight="700" fill="#131418">{L.table}</text>
      <text x={x2 + w / 2} y="27" textAnchor="middle" fontSize="10.5" fill="#6b7280">{L.sea} · {nf(R.ps, 2)} bar</text>
      <rect x={x1} y={top} width={w} height={Math.max(0, ya - top)} rx="4" fill={LAKE} opacity=".22" />
      <rect x={x2} y={top} width={w} height={Math.max(0, yb - top)} rx="4" fill={SEA} opacity=".22" />
      <line x1={x1 - 6} x2={x1 + w + 6} y1={top} y2={top} stroke={LAKE} strokeWidth="2" />
      <line x1={x2 - 6} x2={x2 + w + 6} y1={top} y2={top} stroke={SEA} strokeWidth="2" />
      {els}
      <path d={curve(ya, yb)} fill="none" stroke={ACCENT} strokeWidth="2" />
      <circle cx={x1 + w / 2} cy={ya} r="5" fill={LAKE} />
      <circle cx={x2 + w / 2} cy={yb} r="5" fill={ACCENT} />
      <text x={x1 - 8} y={ya + 4} textAnchor="end" fontSize="11.5" fontWeight="700" fill="#131418">{nf(s.prof, 0)} m</text>
      <text x={x2 + w + 8} y={yb + 4} fontSize="11.5" fontWeight="700" fill={ACCENT}>{R.fict} m</text>
      <text x={W / 2} y={bot + 12} textAnchor="middle" fontSize="10.5" fill="#6b7280">{L.foot}</text>
    </svg>
  )
}

export default function AltitudeCalculator({ labels }: { labels: Labels }) {
  const L = labels
  const [s, setS] = usePersistentState<AltState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const resRef = useRef<HTMLDivElement>(null)
  const fmt = useMemo(() => {
    const cache = new Map<number, Intl.NumberFormat>()
    return (x: number, d: number) => {
      let f = cache.get(d)
      if (!f) cache.set(d, (f = new Intl.NumberFormat(L.numberLocale, { minimumFractionDigits: d, maximumFractionDigits: d })))
      return f.format(x)
    }
  }, [L.numberLocale])
  const nf = fmt
  const r0 = (x: number) => fmt(Math.round(x), 0)
  const sp = { decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase }
  type K = 'alt' | 'prof' | 'o2' | 'v'
  const stp = (k: K) => ({
    display: r0(s[k]),
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) })),
    onSet: (v: number) => setS((p) => ({ ...p, [k]: clampTo(v, SPECS[k].min, SPECS[k].max) })),
    ...sp,
  })
  // Pression mesurée : saisie en mbar, gardée en bar
  const pmStp = {
    display: r0(s.pm * 1000),
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, pm: stepValue(Math.round(p.pm * 1000), dir, SPECS.pm.step, SPECS.pm.min, SPECS.pm.max) / 1000 })),
    onSet: (v: number) => setS((p) => ({ ...p, pm: clampTo(v, SPECS.pm.min, SPECS.pm.max) / 1000 })),
    ...sp,
  }

  // ── Calculs (modèle) ──
  const R = compute(s)
  const mn90 = s.table === 'mn90'
  const lineTxt = mn90 ? (R.line ? fill(L.res.line, { l: R.line }) : L.res.offTable) : L.res.lineOther
  const msgs: { tone: 'mid' | 'low'; t: string; x: string }[] = []
  if (R.pp > 1.6 + 1e-9) msgs.push({ tone: 'low', t: L.res.ppToxT, x: fill(L.res.ppTox, { pp: nf(R.pp, 2), d: r0(s.prof), m: R.mod16 }) })
  else if (R.pp > 1.4 + 1e-9) msgs.push({ tone: 'mid', t: L.res.ppMidT, x: fill(L.res.ppMid, { m: R.mod14 }) })
  if (R.fict > 60) msgs.push({ tone: 'low', t: L.res.offT, x: fill(L.res.off, { d: R.fict }) })
  else if (R.fict >= 40 && R.air) msgs.push({ tone: 'mid', t: L.res.deepT, x: fill(L.res.deep, { d: R.fict }) })
  if (R.pa <= 0.7 + 1e-9) msgs.push({ tone: 'mid', t: L.res.highT, x: L.res.high })

  const pf = s.mode === 'cours' ? `1 − ${r0(s.alt)} ÷ 10 000` : s.mode === 'mesure' ? L.calc.paMeasured : `1,01325 × (1 − 0,0000225577 × ${r0(s.alt)})^5,25588`
  const calc: [string, string, string][] = [
    [L.calc.pa, `${nf(R.pa, 3)} bar`, pf],
    [L.calc.k, nf(R.k, 3), `${s.mode === 'cours' ? '1' : '1,01325'} ÷ ${nf(R.pa, 3)}`],
  ]
  if (!R.air) calc.push([L.calc.ead, `${nf(R.ead, 1)} m`, `(${r0(s.prof)} + 10) × ${nf(1 - s.o2 / 100, 2)} ÷ 0,79 − 10`])
  calc.push([L.calc.fict, `${R.fict} m`, `${nf(R.ead, 1)} × ${nf(R.k, 3)} = ${nf(R.fictRaw, 2)} → ${L.calc.fictUp}`])
  calc.push([L.calc.stops, `${R.stops.map((x) => nf(x.real, 1)).join(' / ')} m`, `3, 6, 9 ÷ ${nf(R.k, 3)} → ${L.calc.stopsUp}`])
  calc.push([L.calc.v, `${nf(R.v, 1)} m/min`, `${r0(s.v)} ÷ ${nf(R.k, 3)} → ${L.calc.vDown}`])
  if (mn90) calc.push([L.calc.vStops, `${nf(R.vStops, 1)} m/min`, `6 ÷ ${nf(R.k, 3)}`])
  calc.push([L.calc.pp, `${nf(R.pp, 2)} bar`, `${nf(s.o2 / 100, 2)} × (${nf(R.pa, 3)} + ${nf(s.prof / 10, 1)})`])
  // Les formules du pas à pas utilisent la virgule décimale française ; en anglais on bascule en point.
  const dec = (x: string) => (L.numberLocale.startsWith('fr') ? x : x.replace(/(\d),(\d)/g, '$1.$2').replace(/(\d) (\d{3})/g, '$1,$2'))

  return (
    <div className="flex flex-col gap-3 pb-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-7 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-3">
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <Segmented<Mode> ariaLabel={L.s1.title} value={s.mode} onChange={(v) => setS((p) => ({ ...p, mode: v }))}
            options={(['oaci', 'cours', 'mesure'] as const).map((m) => ({ v: m, label: L.s1.modes[m], sub: L.s1.modesSub[m] }))} />
          <div className="mt-2">
            {s.mode === 'mesure' ? (
              <>
                <Stepper label={L.s1.pm} sub={L.s1.pmSub} unit="mbar" ariaLabel={L.s1.pm} {...pmStp} />
                <p className={`mt-1.5 ${T.small}`}>{L.s1.pmFoot}</p>
              </>
            ) : (
              <>
                <Stepper label={L.s1.alt} sub={L.s1.altSub} unit="m" ariaLabel={L.s1.alt} {...stp('alt')} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ALTS.map((a) => <Pill key={a} on={s.alt === a} onClick={() => setS((p) => ({ ...p, alt: a }))}>{r0(a)} m</Pill>)}
                </div>
                <p className={`mt-2 ${T.small}`}>{s.mode === 'cours' ? L.s1.noteCours : L.s1.noteOaci}</p>
              </>
            )}
          </div>
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <div className="grid gap-2">
            <Stepper label={L.s2.prof} sub={L.s2.profSub} unit="m" ariaLabel={L.s2.prof} {...stp('prof')} />
            <Stepper label={L.s2.o2} sub={L.s2.o2Sub} unit="% O2" ariaLabel={L.s2.o2} {...stp('o2')} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MIXES.map((m) => <Pill key={m} on={s.o2 === m} onClick={() => setS((p) => ({ ...p, o2: m }))}>{m === 21 ? L.mixAir : `Nx${m}`}</Pill>)}
          </div>
        </Card>

        <Card>
          <SectionHead no={3} title={L.s3.title} help={L.s3.help} />
          <Stepper label={L.s3.v} sub={L.s3.vSub} unit="m/min" ariaLabel={L.s3.v} {...stp('v')} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SPEEDS.map((x) => (
              <Pill key={x.key} on={s.v === x.v && s.table === x.table} onClick={() => setS((p) => ({ ...p, v: x.v, table: x.table }))}>
                {L.s3.speeds[x.key]} · {x.v} m/min
              </Pill>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div ref={resRef} className="flex scroll-mt-24 flex-col lg:flex-1">
          <Card aria-live="polite" className="flex flex-1 flex-col border-l-[6px] border-l-primary">
            <p className="text-[12.5px] font-semibold text-gray-500">{L.res.k}</p>
            <p key={R.fict} className="animate-number-pop text-[52px] font-extrabold leading-[1.05] tabular-nums text-black max-[380px]:text-[44px]">{R.fict}<U>m</U></p>
            <p className="text-[13px] font-medium text-gray-500">
              {fill(L.res.instead, { d: r0(s.prof) })}{R.air ? '' : fill(L.res.asAir, { mix: `Nx${s.o2}` })}. <b className="font-bold text-black">{lineTxt}</b>
            </p>
            <p className="mb-1.5 mt-3 text-xs font-semibold text-gray-500">{L.res.stops}</p>
            <div className="grid grid-cols-3 gap-2">
              {R.stops.map((st) => <Tile key={st.table} label={fill(L.res.stop, { d: st.table })} value={<>{nf(st.real, 1)}<U>m</U></>} sub={L.res.inLake} />)}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Tile label={L.res.v} value={<>{nf(R.v, 1)}<U>m/min</U></>} sub={fill(L.res.vInstead, { v: r0(s.v) }) + (mn90 ? fill(L.res.vStops, { v: nf(R.vStops, 1) }) : '')} />
              <Tile label={L.res.pp} tone={R.pp > 1.6 + 1e-9 ? 'low' : R.pp > 1.4 + 1e-9 ? 'mid' : undefined} value={<>{nf(R.pp, 2)}<U>bar</U></>} sub={dec(fill(L.res.ppMax, { m16: R.mod16, m14: R.mod14 }))} />
            </div>
            {msgs.map((m) => <Verdict key={m.t} tone={m.tone} title={m.t}>{m.x}</Verdict>)}
            <Viz s={s} R={R} L={L.viz} nf={nf} r0={r0} />
          </Card>
        </div>

        <HowCard title={L.calc.title}>
          <ol className="grid gap-1.5">
            {calc.map(([a, b, c]) => (
              <li key={a} className="rounded-xl bg-gray-50 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold text-gray-700">{a}</span>
                  <b className="whitespace-nowrap text-[15px] font-extrabold tabular-nums text-black">{b}</b>
                </div>
                <p className="mt-0.5 break-words text-xs font-medium tabular-nums text-gray-500">{dec(c)}</p>
              </li>
            ))}
          </ol>
        </HowCard>

        <HowCard title={L.how.title}>
          {L.how.paras.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
          {L.how.formulas.map((f) => <Formula key={f}>{f}</Formula>)}
          <Bullets items={L.how.items} />
          <p className={T.small}>{L.how.foot}</p>
        </HowCard>
      </div>

      {/* Barre résultat fixe en bas sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 text-white">
          <span className="text-[13px] font-semibold opacity-90">{fill(L.cta.label, { s: R.stops.map((x) => nf(x.real, 1)).join(' / ') })}</span>
          <b className="text-xl font-extrabold tabular-nums">{R.fict} m</b>
        </button>
      </div>
    </div>
  )
}
