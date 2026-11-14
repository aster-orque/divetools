'use client'

import { useMemo } from 'react'
import type { ReactNode } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  DEFAULT_STATE, DEPTHS, LIMS, MIXES, SPECS, STORAGE_KEY, bestMix, disp, env, level, minDepth, mod, pp, sanitizeState,
} from '@/lib/ppo2/engine'
import type { Env, Level, NumKey, PpState } from '@/lib/ppo2/engine'
import {
  Bullets, Card, Formula, HowCard, Pill, SectionHead, Segmented, Stepper, SubLabel, T, clampTo, fill, makeNum, stepValue,
  useHeaderHeight, usePersistentState, ZONE_FILL, ZoneDefs, ZoneLegend,
} from './tool-ui'

type Labels = typeof fr.ppo2

const cls = (l: Level): 'ok' | 'mid' | 'low' => (l === 'ok' ? 'ok' : l === 'mid' ? 'mid' : 'low')

/** Colonne d'eau : zones de ppO2 selon la profondeur, paliers 3-6-9 m, profondeur choisie. */
function WaterColumn({ s, E, limTxt, t16, t016, depthTxt, aria }: {
  s: PpState; E: Env; limTxt: string; t16: string; t016: string; depthTxt: string; aria: string
}) {
  const o2 = s.o2, d = s.d, f = o2 / 100
  const at = (p: number) => (p / f - E.ps) * E.k
  const mL = at(s.lim), m16 = at(1.6), hyp = Math.max(0, at(0.16))
  const H = Math.min(150, Math.max(20, Math.ceil((Math.max(d, Math.min(m16, 100)) + 5) / 10) * 10))
  const W = 120, Tp = 10, B = 290, X0 = 34, X1 = 70
  const y = (m: number) => Tp + (Math.min(Math.max(m, 0), H) / H) * (B - Tp)
  const bands: ReactNode[] = []
  const band = (a: number, b: number, col: string) => {
    a = Math.max(a, 0)
    b = Math.min(b, H)
    if (b > a) bands.push(<rect key={`${a}-${col}`} x={X0} y={y(a)} width={X1 - X0} height={y(b) - y(a)} fill={col} />)
  }
  band(0, hyp, ZONE_FILL.bad)
  band(hyp, Math.max(hyp, mL), ZONE_FILL.ok)
  band(Math.max(hyp, mL), Math.max(hyp, m16), ZONE_FILL.mid)
  band(Math.max(hyp, m16), H, ZONE_FILL.bad)
  const step = H <= 30 ? 5 : H <= 80 ? 10 : 20
  const ticks: number[] = []
  for (let m = 0; m <= H; m += step) ticks.push(m)
  const marks: [number, string][] = [[mL, limTxt]]
  if (s.lim < 1.6) marks.push([m16, t16])
  if (hyp > 0) marks.push([hyp, t016])
  const yd = y(d)
  return (
    <svg viewBox={`0 0 ${W} 302`} role="img" aria-label={aria} className="block h-auto w-full">
      <ZoneDefs />
      <clipPath id="pp-col"><rect x={X0} y={Tp} width={X1 - X0} height={B - Tp} rx="8" /></clipPath>
      <g clipPath="url(#pp-col)">
        <rect x={X0} y={Tp} width={X1 - X0} height={B - Tp} fill="#f3f4f6" />
        {bands}
      </g>
      {s.lim < 1.6 && m16 > 0 && m16 < H && <line x1={X0} x2={X1} y1={y(m16)} y2={y(m16)} stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />}
      {ticks.map((m) => <text key={m} x={X0 - 5} y={y(m) + 3.5} fontSize="10" fontWeight="500" textAnchor="end" fill="#6b7280">{m}</text>)}
      {[3, 6, 9].map((p) => p < H && <line key={p} x1={X0} x2={X1} y1={y(p)} y2={y(p)} stroke="#fff" strokeWidth="1" strokeDasharray="3 3" />)}
      {/* Repères masqués s'ils tombent sous l'étiquette de profondeur (évite le chevauchement) */}
      {marks.map(([m, t]) => m > 0 && m < H && Math.abs(y(m) - Math.min(Math.max(yd, Tp + 8), B - 2)) > 12 && <text key={t} x={X1 + 4} y={y(m) + 3.5} fontSize="9.5" fontWeight="500" fill="#6b7280">{t}</text>)}
      <line x1={X0 - 2} x2={X1 + 2} y1={yd} y2={yd} stroke="#131418" strokeWidth="2.5" />
      <circle cx={(X0 + X1) / 2} cy={yd} r="5" fill="#131418" stroke="#fff" strokeWidth="2" />
      <text x={X1 + 4} y={Math.min(Math.max(yd, Tp + 8), B - 2) + 4} fontSize="11" fontWeight="700" fill="#131418">{depthTxt}</text>
      <text x={(X0 + X1) / 2} y={B + 11} fontSize="9" textAnchor="middle" fill="#6b7280">m</text>
    </svg>
  )
}

export default function PpO2Calculator({ labels }: { labels: Labels }) {
  const L = labels
  const n = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const [s, setS] = usePersistentState<PpState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const headerH = useHeaderHeight()

  const f2 = (x: number) => n.d(x, 2)
  const fmtN = (x: number) => n.upTo(Math.round(x * 10) / 10, 1)
  const mixName = (o2: number) => (o2 === 21 ? L.mixAir : o2 === 100 ? L.mixO2 : o2 > 21 ? `Nx${fmtN(o2)}` : fill(L.mixLean, { o2: fmtN(o2) }))
  const limTxt = n.d(s.lim, 1)

  const set = (k: NumKey, v: number) => setS((p) => ({ ...p, [k]: v }))
  const bump = (k: NumKey) => (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) }))
  /** Saisie libre (modèle) : arrondie au dixième (altitude à l'unité), ramenée dans les bornes. */
  const typed = (k: NumKey) => (v: number) => set(k, clampTo(k === 'alt' ? Math.round(v) : Math.round(v * 10) / 10, SPECS[k].min, SPECS[k].max))
  const stp = (k: NumKey, display: string) => ({
    display, onBump: bump(k), onSet: typed(k), decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase,
  })

  // ── Calculs ──
  const E = env(s.water, s.alt)
  const o2 = s.o2, d = s.d, p = pp(o2, d, E), lv = level(p, s.lim)
  const hyp = minDepth(o2, 0.16, E)
  const sea = s.water === 'mer'
  const place = sea ? L.placeSea : s.alt > 0 ? fill(L.placeLakeAlt, { alt: n.d(s.alt) }) : L.placeFresh
  const setSum = fill(L.set.summary, { lim: limTxt, place: sea ? L.set.sea : s.alt > 0 ? fill(L.set.lakeAlt, { alt: n.d(s.alt) }) : L.set.freshShort })

  const verdict = (() => {
    switch (lv) {
      case 'hypo': return { c: 'low' as const, st: L.verdict.hypo, ln: fill(L.verdict.hypoLine, { d: hyp }) }
      case 'ok': return { c: 'ok' as const, st: L.verdict.ok, ln: fill(L.verdict.okLine, { lim: limTxt }) }
      case 'mid': return { c: 'mid' as const, st: fill(L.verdict.mid, { lim: limTxt }), ln: L.verdict.midLine }
      default: return { c: 'low' as const, st: L.verdict.tox, ln: L.verdict.toxLine }
    }
  })()
  const heroWrap = verdict.c === 'ok' ? 'border-l-primary' : verdict.c === 'mid' ? 'border-l-amber-500 bg-amber-50' : 'border-l-red-600 bg-red-50'
  const heroSt = verdict.c === 'ok' ? 'text-primary-600' : verdict.c === 'mid' ? 'text-amber-700' : 'text-red-700'

  const modTxt = (pm: number) => {
    const m = mod(o2, pm, E)
    return m < 0 ? '—' : <>{m} <em className="text-sm font-semibold not-italic text-gray-500">m</em></>
  }
  const second = hyp
    ? { l: L.minDepth, v: <>{hyp} <em className="text-sm font-semibold not-italic text-gray-500">m</em></> }
    : (() => { const r = s.lim < 1.6 ? 1.6 : 1.4; return { l: fill(L.maxAt, { pp: n.d(r, 1) }), v: modTxt(r) } })()
  const bm = bestMix(d, s.lim, E)

  const row = (label: string, sub: string, val: number, me = false) => {
    const c = cls(level(val, s.lim))
    return (
      <div key={label + sub} className={`grid grid-cols-[1fr_auto] items-center gap-x-2.5 rounded-xl px-3 py-2 ${
        c === 'mid' ? 'bg-amber-50' : c === 'low' ? 'bg-red-50' : me ? 'bg-primary-50' : 'bg-gray-50'
      }`}>
        <span className="text-[14px] font-semibold text-black">
          {label}
          {sub && <small className="block text-xs font-medium text-gray-500">{sub}</small>}
        </span>
        <b className={`text-[22px] font-extrabold tabular-nums ${c === 'mid' ? 'text-amber-700' : c === 'low' ? 'text-red-700' : 'text-black'}`}>{f2(disp(val))}<em className="ml-0.5 text-xs font-semibold not-italic text-gray-500">bar</em></b>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-start lg:gap-7">
      <div className="flex min-w-0 flex-col gap-3 lg:sticky" style={{ top: headerH + 16 }}>
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <div className="mb-1.5 grid grid-cols-6 gap-1.5">
            {MIXES.map((m) => {
              const on = s.o2 === m
              return (
                <button key={m} type="button" aria-pressed={on} onClick={() => set('o2', m)}
                  className={`min-h-[42px] rounded-xl border text-[13px] font-bold tabular-nums transition-all duration-200 ease-out-expo active:scale-95 max-[380px]:text-xs ${
                    on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'
                  }`}>
                  {m === 21 ? L.mixAir : m === 100 ? 'O2' : `Nx${m}`}
                </button>
              )
            })}
          </div>
          <Stepper label={L.s1.o2} sub={L.s1.o2Sub} unit={L.units.pctO2} ariaLabel={L.s1.o2Aria} {...stp('o2', fmtN(s.o2))} />
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <Stepper label={L.s2.depth} unit="m" ariaLabel={L.s2.depthAria} {...stp('d', fmtN(s.d))} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEPTHS.map((x) => <Pill key={x} on={s.d === x} onClick={() => set('d', x)}>{x} m</Pill>)}
          </div>
        </Card>

        <details className="group rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-soft sm:px-5"
          open={s.lim !== DEFAULT_STATE.lim || s.water !== DEFAULT_STATE.water ? true : undefined}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2.5 marker:hidden [&::-webkit-details-marker]:hidden">
            <h2 className="text-[15px] font-bold text-black">{L.set.title}</h2>
            <span className="flex items-center gap-2 text-right text-[13px] font-medium text-gray-500">
              {setSum}
              <span aria-hidden className="text-xl leading-none transition-transform duration-200 group-open:rotate-180">⌄</span>
            </span>
          </summary>
          <div className="mt-3">
            <SubLabel first>{L.set.limit}</SubLabel>
            <Segmented ariaLabel={L.set.limit} value={s.lim} onChange={(v) => setS((q) => ({ ...q, lim: v }))}
              options={LIMS.map((l) => ({ v: l, label: n.d(l, 1) }))} />
            <p className={`mx-0.5 mt-1.5 ${T.small}`}>{L.set.limitHint}</p>
            <SubLabel>{L.set.where}</SubLabel>
            <Segmented ariaLabel={L.set.where} value={s.water} onChange={(v) => setS((q) => ({ ...q, water: v }))}
              options={[{ v: 'mer', label: L.set.seaBtn }, { v: 'douce', label: L.set.freshBtn }]} />
            {s.water === 'douce' && (
              <div className="mt-1.5">
                <Stepper label={L.set.alt} sub={fill(L.set.psurf, { ps: n.d(E.ps, 2) })} unit="m" ariaLabel={L.set.altAria}
                  {...stp('alt', n.d(s.alt))} />
              </div>
            )}
          </div>
        </details>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <Card aria-live="polite" className={`border-l-[6px] ${heroWrap}`}>
          <p className="text-[12.5px] font-semibold text-gray-500">
            {fill(L.hero.cap, { d: fmtN(d), mix: mixName(o2) })}{sea ? '' : ` · ${place}`}
          </p>
          <p key={f2(disp(p))} className="animate-number-pop text-[52px] font-extrabold leading-[1.05] tracking-[-0.01em] tabular-nums text-black max-[380px]:text-[44px]">
            {f2(disp(p))}<em className="ml-1 text-xl font-semibold not-italic tracking-normal text-gray-500">bar</em>
          </p>
          <p className={`text-base font-bold ${heroSt}`}>{verdict.st}</p>
          <p className="mt-0.5 text-[13px] font-medium text-gray-500">{verdict.ln}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[{ l: fill(L.maxAt, { pp: limTxt }), v: modTxt(s.lim) }, second].map((t) => (
              <div key={t.l} className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                <small className="block text-xs font-semibold text-gray-500">{t.l}</small>
                <b className="text-2xl font-extrabold tabular-nums text-black">{t.v}</b>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2.5 rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-2 text-[13px] font-medium text-gray-600">
            {bm >= 21 ? (
              <>
                <span>{fill(L.best.label, { d: fmtN(d), lim: limTxt })}<br /><b className="text-base font-extrabold text-black">{mixName(bm)}</b></span>
                {bm !== o2 && (
                  <button type="button" onClick={() => set('o2', bm)}
                    className="min-h-[38px] shrink-0 rounded-full border border-primary px-3.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white">
                    {L.best.use}
                  </button>
                )}
              </>
            ) : (
              <span>{fill(L.best.trimix, { d: fmtN(d), lim: limTxt, max: bm })}</span>
            )}
          </div>
        </Card>

        <Card>
          <SectionHead title={L.stops.title} help={L.stops.help} />
          <div className="grid grid-cols-[118px_minmax(0,1fr)] items-start gap-3.5 max-[380px]:grid-cols-[100px_minmax(0,1fr)] max-[380px]:gap-2.5 lg:grid-cols-[150px_minmax(0,1fr)]">
            <WaterColumn s={s} E={E} limTxt={limTxt} t16={n.d(1.6, 1)} t016={n.d(0.16, 2)} depthTxt={`${fmtN(d)} m`} aria={L.stops.aria} />
            <div>
              <p className="mb-1 text-xs font-bold text-gray-500">{fill(L.stops.withMix, { mix: mixName(o2) })}</p>
              <div className="grid gap-1.5">
                {row(L.stops.bottom, `${fmtN(d)} m`, p, true)}
                {[9, 6, 3].filter((x) => x < d).map((x) => row(fill(L.stops.stop, { d: x }), '', pp(o2, x, E)))}
              </div>
              {o2 !== 100 && (
                <>
                  <p className="mb-1 mt-3 text-xs font-bold text-gray-500">{L.stops.o2Title}</p>
                  <div className="grid gap-1.5">
                    {[6, 3].map((x) => row(fill(L.stops.stop, { d: x }), L.stops.pureO2, pp(100, x, E)))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="mt-2.5">
            <ZoneLegend items={[
              { k: 'ok', label: fill(L.legend.ok, { lim: limTxt }) },
              ...(s.lim < 1.6 ? [{ k: 'mid' as const, label: fill(L.legend.mid, { lim: limTxt }) }] : []),
              { k: 'bad', label: L.legend.bad },
            ]} />
          </div>
        </Card>

        <HowCard title={L.how.title}>
          <p>{L.how.intro}</p>
          {L.how.formulas.map((f) => <Formula key={f}>{f}</Formula>)}
          <Bullets items={L.how.items} />
          <p className={T.small}>{L.how.foot}</p>
        </HowCard>
      </div>
    </div>
  )
}
