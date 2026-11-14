'use client'

import { useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  ACT_KEYS, ALT_SUITS, ACTIVITIES, DEFAULT_STATE, MM, SPECS, STORAGE_KEY, UNDER_KEYS, advice, compute, inputOf, lvlOf, sanitizeState,
} from '@/lib/bilan-thermique/engine'
import type { NumKey, Phase, ThermoResult, ThermoState } from '@/lib/bilan-thermique/engine'
import {
  Card, Fold, HowBlocks, HowCard, SectionHead, Segmented, Stepper, SubLabel, T, Toggle, U, Verdict, clampTo, copyText, fill, makeNum,
  secondaryBtn, stepValue, useToast, usePersistentState,
} from './tool-ui'
import type { Lvl } from './tool-ui'

type Labels = typeof fr.thermique
/** Pertes et production : camaïeu de bleus Orque, production en noir. */
const C = { met: '#131418', sens: '#0c4a6e', hum: '#bae6fd', body: '#1284c7', ext: '#7dd3fc' }
const LVL_TXT: Record<Lvl, string> = { ok: 'text-primary-600', mid: 'text-amber-700', low: 'text-red-700' }

function Chips<V extends string | number>({ value, items, onChange, cols }: { value: V; items: { v: V; t: string; s?: string }[]; onChange: (v: V) => void; cols: string }) {
  return (
    <div className={`grid gap-1.5 ${cols}`}>
      {items.map((it) => (
        <button key={String(it.v)} type="button" aria-pressed={it.v === value} onClick={() => onChange(it.v)}
          className={`min-h-11 rounded-xl border px-2 py-1.5 text-left leading-tight transition-colors ${it.v === value ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'}`}>
          <b className="block text-[13px] font-bold">{it.t}</b>
          {it.s && <small className={`block text-[11px] font-medium ${it.v === value ? 'text-white/85' : 'text-gray-500'}`}>{it.s}</small>}
        </button>
      ))}
    </div>
  )
}

export default function ThermalBalanceCalculator({ labels }: { labels: Labels }) {
  const L = labels
  const [s, setS] = usePersistentState<ThermoState>(STORAGE_KEY, DEFAULT_STATE, sanitizeState)
  const N = useMemo(() => makeNum(L.numberLocale), [L.numberLocale])
  const fmt = (x: number, d = 0) => N.d(Math.round(x * 10 ** d) / 10 ** d, d)
  const sgn = (x: number, d = 0) => { const r = Math.round(x * 10 ** d); return (r > 0 ? '+' : r < 0 ? '−' : '') + fmt(Math.abs(x), d) }
  const { say, node: toast } = useToast(true)
  const resRef = useRef<HTMLDivElement>(null)
  const sp = { decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase }
  const stp = (k: NumKey) => ({
    display: fmt(s[k]),
    onBump: (dir: -1 | 1) => setS((p) => ({ ...p, [k]: stepValue(p[k], dir, SPECS[k].step, SPECS[k].min, SPECS[k].max) })),
    onSet: (v: number) => setS((p) => ({ ...p, [k]: clampTo(Math.round(v / SPECS[k].step) * SPECS[k].step, SPECS[k].min, SPECS[k].max) })),
    ...sp,
  })
  const set = <K extends keyof ThermoState>(k: K, v: ThermoState[K]) => setS((p) => ({ ...p, [k]: v }))
  const suitName = (x: ThermoState) => x.type === 'etanche'
    ? fill(L.suitDry, { shell: L.shells[x.shell], under: L.unders[x.under].t.toLowerCase(), argon: x.suitGas === 'argon' ? L.argonSuffix : '' })
    : fill(L.suitWet, { type: L.types[x.type], mm: x.mm })

  // ── Calculs (modèle) ──
  const r = compute(inputOf(s))
  const lv = r.level
  const lvlKey = r.debtKJ >= 0 ? 'none' : lv
  const tone: Lvl = r.debtKJ >= 0 ? 'ok' : lv
  const dTtxt = r.debtKJ >= 0 ? '0' : sgn(r.dTbody, 1)
  const totalMin = s.fT + (s.palOn ? s.pT : 0)
  const tMin = Math.min(s.fW, s.palOn ? s.pW : 99)
  const ad = advice(tMin)
  const al: { k: 'warn' | 'info'; t: string }[] = []
  if (!s.covered && tMin < 20) al.push({ k: 'warn', t: fill(L.al.bare, { t: fmt(tMin) }) })
  else if (tMin <= 10) al.push({ k: 'info', t: L.al.hands })
  if (s.gas === 'tx' && s.type === 'etanche') al.push({ k: 'warn', t: L.al.txDry })
  if (s.gas === 'tx' && r.fond.resp.total > 0.3 * r.fond.losses) al.push({ k: 'info', t: fill(L.al.txResp, { p: fmt((r.fond.resp.total / r.fond.losses) * 100) }) })
  if (s.type !== 'etanche' && s.fD >= 25) al.push({ k: 'info', t: fill(L.al.crush, { d: s.fD, p: fmt(r.fond.skin.insulLeft * 100) }) })
  if (s.type === 'etanche' && s.suitGas === 'argon') al.push({ k: 'info', t: L.al.argon })
  if (r.fond.balance > 150) al.push({ k: 'info', t: L.al.hot })

  const phases: [string, Phase][] = [[L.phase.fond, r.fond], ...(r.palier ? [[L.phase.palier, r.palier] as [string, Phase]] : [])]
  const max = Math.max(...phases.map(([, p]) => Math.max(p.M, p.losses)))

  // Alternatives
  const cur = suitName(s)
  type Alt = { s: ThermoState; name: string; r: ThermoResult; me?: boolean }
  const list: Alt[] = ALT_SUITS.map((o) => ({ ...s, ...o, covered: true })).map((x) => ({ s: x, name: suitName(x), r: compute(inputOf(x)) }))
  if (!list.some((x) => x.name === cur && s.covered)) list.push({ s: { ...s }, name: cur, r, me: true })
  list.forEach((x) => { if (x.name === cur && x.s.covered === s.covered) x.me = true })
  if (!s.covered && !list.some((x) => x.name === cur && x.s.covered)) list.push({ s: { ...s, covered: true }, name: cur + L.alts.plusCover, r: compute(inputOf({ ...s, covered: true })) })
  list.sort((a, b) => a.r.dTbody - b.r.dTbody)

  const summary = () => [
    fill(L.copyTpl.l1, { suit: suitName(s), cov: s.covered ? L.copyTpl.cov : '' }),
    fill(L.copyTpl.fond, { d: s.fD, t: s.fT, w: s.fW, b: sgn(r.fond.balance) }),
    ...(r.palier ? [fill(L.copyTpl.palier, { d: s.pD, t: s.pT, w: s.pW, b: sgn(r.palier.balance) })] : []),
    fill(L.copyTpl.temp, { v: dTtxt, l: L.levels[lvlKey][0] }),
    fill(L.copyTpl.spent, { kj: fmt(r.spentKJ), kcal: fmt(r.spentKJ / 4.184) }),
  ].join('\n')

  const showNeo = s.type !== 'etanche' || s.shell === 'neoprene'
  const multi = phases.length > 1
  const row = (lbl: string, col: string | null, f: (p: Phase) => string) => (
    <tr className="border-t border-gray-100">
      <td className="px-2.5 py-1.5">{col && <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-[-1px]" style={{ background: col }} />}{lbl}</td>
      {phases.map(([n, p]) => <td key={n} className="px-2.5 py-1.5 text-right">{f(p)}</td>)}
      {multi && <td />}
    </tr>
  )
  const tot = (lbl: string, f: (p: Phase) => string, g: string) => (
    <tr className="border-t border-gray-200 bg-gray-50 font-bold text-black">
      <td className="px-2.5 py-1.5">{lbl}</td>
      {phases.map(([n, p]) => <td key={n} className="px-2.5 py-1.5 text-right">{f(p)}</td>)}
      {multi && <td className="px-2.5 py-1.5 text-right">{g}</td>}
    </tr>
  )
  const table = (head: string, children: ReactNode) => (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-[12.5px] tabular-nums">
        <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
          <tr><th className="px-2.5 py-2 text-left">{head}</th>{phases.map(([n]) => <th key={n} className="px-2.5 py-2 text-right">{n}</th>)}{multi && <th className="px-2.5 py-2 text-right">{L.det.total}</th>}</tr>
        </thead>
        <tbody className="font-medium text-gray-700">{children}</tbody>
      </table>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 pb-20 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-7 lg:pb-0">
      <div className="flex min-w-0 flex-col gap-3">
        <Card>
          <SectionHead no={1} title={L.s1.title} help={L.s1.help} />
          <SubLabel first>{L.s1.bottom}</SubLabel>
          <div className="grid gap-2">
            <Stepper label={L.s1.depth} unit="m" ariaLabel={`${L.s1.depth} · ${L.s1.bottom}`} {...stp('fD')} />
            <Stepper label={L.s1.time} unit="min" ariaLabel={`${L.s1.time} · ${L.s1.bottom}`} {...stp('fT')} />
            <Stepper label={L.s1.water} unit="°C" ariaLabel={`${L.s1.water} · ${L.s1.bottom}`} {...stp('fW')} />
          </div>
          <SubLabel>{L.s1.act}</SubLabel>
          <Chips cols="grid-cols-2" value={s.act} onChange={(a) => setS((p) => ({ ...p, act: a, fM: ACTIVITIES[a].M, fV: ACTIVITIES[a].rmv }))}
            items={ACT_KEYS.map((k) => ({ v: k, t: L.acts[k].t, s: L.acts[k].s }))} />
          <SubLabel>{L.s1.stop}</SubLabel>
          <Toggle label={L.s1.stopOn} sub={L.s1.stopSub} on={s.palOn} onChange={(v) => set('palOn', v)} />
          <div className={`mt-2 grid gap-2 transition-opacity ${s.palOn ? '' : 'pointer-events-none opacity-40'}`} aria-disabled={!s.palOn}>
            <Stepper label={L.s1.depth} unit="m" ariaLabel={`${L.s1.depth} · ${L.s1.stop}`} {...stp('pD')} />
            <Stepper label={L.s1.time} unit="min" ariaLabel={`${L.s1.time} · ${L.s1.stop}`} {...stp('pT')} />
            <Stepper label={L.s1.water} unit="°C" ariaLabel={`${L.s1.water} · ${L.s1.stop}`} {...stp('pW')} />
          </div>
        </Card>

        <Card>
          <SectionHead no={2} title={L.s2.title} help={L.s2.help} />
          <div className="mb-2.5 rounded-xl bg-primary-50 px-3 py-2 text-[13px] font-medium text-gray-700">
            {fill(L.s2.tip, { t: fmt(tMin) })} <b className="font-bold text-primary-600">{L.advice[ad]}</b>
          </div>
          <Segmented<ThermoState['type']> ariaLabel={L.s2.title} value={s.type}
            onChange={(t) => setS((p) => ({ ...p, type: t, mm: t !== 'etanche' && !MM[t].includes(p.mm) ? 7 : p.mm }))}
            options={(['humide', 'semi', 'etanche'] as const).map((t) => ({ v: t, label: L.types[t] }))} />
          {s.type !== 'etanche' ? (
            <>
              <SubLabel>{L.s2.mm}</SubLabel>
              <Chips cols="grid-cols-4" value={s.mm} onChange={(m) => set('mm', m)} items={MM[s.type].map((m) => ({ v: m, t: `${m} mm` }))} />
            </>
          ) : (
            <>
              <SubLabel>{L.s2.under}</SubLabel>
              <Chips cols="grid-cols-2 sm:grid-cols-4" value={s.under} onChange={(u) => set('under', u)} items={UNDER_KEYS.map((k) => ({ v: k, t: L.unders[k].t, s: L.unders[k].s }))} />
              <SubLabel>{L.s2.shell}</SubLabel>
              <Segmented<ThermoState['shell']> ariaLabel={L.s2.shell} value={s.shell} onChange={(v) => set('shell', v)}
                options={[{ v: 'trilam', label: L.shellsLong.trilam }, { v: 'neoprene', label: L.shellsLong.neoprene }]} />
              <SubLabel>{L.s2.suitGas}</SubLabel>
              <Segmented<ThermoState['suitGas']> ariaLabel={L.s2.suitGas} value={s.suitGas} onChange={(v) => set('suitGas', v)}
                options={[{ v: 'air', label: 'Air' }, { v: 'argon', label: 'Argon' }]} />
            </>
          )}
          <Toggle className="mt-3" label={L.s2.cover} sub={L.s2.coverSub} on={s.covered} onChange={(v) => set('covered', v)} />
        </Card>

        <Card className="lg:flex-1">
          <SectionHead no={3} title={L.s3.title} help={L.s3.help} />
          <SubLabel first>{L.s3.gas}</SubLabel>
          <Segmented<ThermoState['gas']> ariaLabel={L.s3.gas} value={s.gas} onChange={(v) => set('gas', v)}
            options={[{ v: 'air', label: L.s3.gasAir }, { v: 'tx', label: L.s3.gasTx }]} />
          <div className="mt-2 grid gap-2">
            {s.gas === 'tx' && <Stepper label={L.s3.he} sub={L.s3.heSub} unit="% He" ariaLabel={L.s3.he} {...stp('he')} />}
            <Stepper label={L.s3.fV} sub={L.s3.fVSub} unit="L/min" ariaLabel={L.s3.fV} {...stp('fV')} />
            <div className={s.palOn ? '' : 'pointer-events-none opacity-40'}><Stepper label={L.s3.pV} sub={L.s3.pVSub} unit="L/min" ariaLabel={L.s3.pV} {...stp('pV')} /></div>
            <Stepper label={L.s3.kg} unit="kg" ariaLabel={L.s3.kg} {...stp('kg')} />
            <Stepper label={L.s3.cm} unit="cm" ariaLabel={L.s3.cm} {...stp('cm')} />
          </div>
          <SubLabel>{L.s3.sens}</SubLabel>
          <Segmented<ThermoState['sens']> ariaLabel={L.s3.sens} value={s.sens} onChange={(v) => set('sens', v)}
            options={(['frileux', 'normal', 'resistant'] as const).map((k) => ({ v: k, label: L.s3.sensOpts[k] }))} />
          <Fold title={L.s3.adv}>
            <SubLabel first>{L.s3.water}</SubLabel>
            <Segmented<ThermoState['water']> ariaLabel={L.s3.water} value={s.water} onChange={(v) => set('water', v)}
              options={[{ v: 'mer', label: L.s3.sea }, { v: 'douce', label: L.s3.fresh }]} />
            <div className="mt-2 grid gap-2">
              <Stepper label={L.s3.fM} sub={L.s3.fMSub} unit="W" ariaLabel={L.s3.fM} {...stp('fM')} />
              <Stepper label={L.s3.pM} unit="W" ariaLabel={L.s3.pM} {...stp('pM')} />
              <Stepper label={L.s3.tE} sub={L.s3.tESub} unit="°C" ariaLabel={L.s3.tE} {...stp('tE')} />
            </div>
            <p className={`mt-2 ${T.small}`}>{L.s3.advFoot}</p>
          </Fold>
        </Card>
        <HowCard title={L.how.title}>
          <HowBlocks sections={L.how.sections} foot={L.how.foot} />
        </HowCard>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div ref={resRef} className="scroll-mt-24">
          <Card aria-live="polite" className={`border-l-[6px] ${tone === 'ok' ? 'border-l-primary' : tone === 'mid' ? 'border-l-amber-500' : 'border-l-red-600'}`}>
            <p className="text-[12.5px] font-semibold text-gray-500">{L.res.cap}</p>
            <p key={dTtxt} className={`animate-number-pop text-[52px] font-extrabold leading-[1.05] tabular-nums max-[380px]:text-[44px] ${tone === 'ok' ? 'text-black' : LVL_TXT[tone]}`}>{dTtxt}<U>°C</U></p>
            <Verdict tone={tone} title={L.levels[lvlKey][0]}>{L.levels[lvlKey][1]}</Verdict>
            <p className={`mt-2 ${T.small}`}>{fill(L.res.foot, { t: totalMin, kj: sgn(r.heatKJ), kcal: sgn(r.heatKJ / 4.184), suit: suitName(s) })}</p>
            {al.length > 0 && (
              <div className="mt-2.5 grid gap-1.5">
                {al.map((a) => (
                  <p key={a.t} className={`rounded-xl border-l-[5px] px-3 py-2 text-[13px] font-medium leading-snug ${a.k === 'warn' ? 'border-l-amber-500 bg-amber-50 text-amber-900' : 'border-l-gray-200 bg-gray-50 text-gray-700'}`}>{a.t}</p>
                ))}
              </div>
            )}
            <button type="button" className={`${secondaryBtn} mt-3 w-full`} onClick={() => copyText(summary(), say, L.copied, L.copyFail)}>{L.copy}</button>
          </Card>
        </div>

        <Card>
          <SectionHead title={L.phase.title} help={L.phase.help} className="mb-3" />
          <div className={`grid gap-2 ${multi ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {phases.map(([n, p]) => (
              <div key={n} className={`min-w-0 rounded-xl border px-3 py-2 ${p.balance < 0 ? 'border-gray-200' : 'border-primary-200 bg-primary-50'}`}>
                <small className="block text-xs font-semibold text-gray-500">{n} · {fmt(p.P, 1)} bar</small>
                <b className="block text-[22px] font-extrabold leading-tight tabular-nums text-black">{sgn(p.balance)}<U>W</U></b>
                {showNeo && <div className="text-[11.5px] font-medium leading-snug text-gray-500">{fill(L.phase.neo, { p: fmt(p.skin.insulLeft * 100) })}</div>}
                <div className="text-[11.5px] font-medium leading-snug text-gray-500">
                  {p.balance < 0 ? (Number.isFinite(p.minPerDeg) ? fill(L.phase.perDeg, { m: fmt(p.minPerDeg) }) : '') : L.phase.surplus}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-1.5">
            {phases.map(([n, p]) => (
              <div key={n} className="grid gap-1">
                {([
                  [`${n} +`, [[p.M, C.met, L.flow.met]]],
                  [`${n} −`, [[p.resp.sensible, C.sens, L.flow.sens], [p.resp.humid, C.hum, L.flow.hum], [p.skin.zones.body.Q, C.body, L.flow.body], [p.skin.zones.extr.Q, C.ext, L.flow.ext]]],
                ] as [string, [number, string, string][]][]).map(([lbl, segs]) => (
                  <div key={lbl} className="flex items-center gap-2">
                    <span className="w-[68px] shrink-0 text-xs font-semibold text-gray-500">{lbl}</span>
                    <div className="flex h-4 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                      {segs.map(([v, col, t]) => <i key={t} title={`${t} : ${fmt(v)} W`} style={{ width: `${((v / max) * 100).toFixed(2)}%`, background: col }} />)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div className="mt-1 flex flex-wrap gap-x-3.5 gap-y-1 text-xs font-medium text-gray-500">
              {([[C.met, L.flow.met], [C.body, L.flow.body], [C.ext, L.flow.ext], [C.sens, L.flow.sens], [C.hum, L.flow.hum]] as const).map(([col, t]) => (
                <span key={t}><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] align-[-1px] ring-1 ring-inset ring-black/5" style={{ background: col }} />{t}</span>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <SectionHead title={L.alts.title} help={L.alts.help} className="mb-3" />
          <div className="grid gap-1.5">
            {list.map((x) => (
              <button key={x.name + x.s.covered} type="button" disabled={x.me}
                onClick={() => setS((p) => ({ ...p, type: x.s.type, mm: x.s.mm, under: x.s.under, shell: x.s.shell, suitGas: x.s.suitGas, covered: x.s.covered }))}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${x.me ? 'border-primary bg-primary-50' : 'border-gray-200 hover:border-primary'}`}>
                <span className="min-w-0">
                  <b className="block text-[13.5px] font-bold text-black">{x.name}{x.me ? L.alts.current : ''}</b>
                  <small className="block text-xs font-medium text-gray-500">{x.s.covered ? L.alts.covered : L.alts.bare}</small>
                </span>
                <b className={`whitespace-nowrap text-[16px] font-extrabold tabular-nums ${x.r.debtKJ >= 0 ? 'text-black' : lvlOf(x.r.dTbody) === 'ok' ? 'text-black' : LVL_TXT[lvlOf(x.r.dTbody)]}`}>
                  {x.r.debtKJ >= 0 ? '0' : sgn(x.r.dTbody, 1)} °C
                </b>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:flex-1">
            <SectionHead title={L.det.title} className="mb-3" />
            <div className="space-y-3">
              {table(L.det.power, <>
                {row(L.flow.metLong, C.met, (p) => fmt(p.M))}
                {row(L.flow.sens, C.sens, (p) => '−' + fmt(p.resp.sensible))}
                {row(L.flow.hum, C.hum, (p) => '−' + fmt(p.resp.humid))}
                {row(L.flow.body, C.body, (p) => '−' + fmt(p.skin.zones.body.Q))}
                {row(L.flow.ext, C.ext, (p) => '−' + fmt(p.skin.zones.extr.Q))}
                {row(L.det.resp, null, (p) => '−' + fmt(p.resp.total))}
                {row(L.det.skin, null, (p) => '−' + fmt(p.skin.total))}
                {tot(L.det.balance, (p) => sgn(p.balance), '')}
              </>)}
              {table(L.det.energy, <>
                {tot(L.det.spentKJ, (p) => fmt(p.spentKJ), fmt(r.spentKJ))}
                {tot(L.det.spentKcal, (p) => fmt(p.spentKJ / 4.184), fmt(r.spentKJ / 4.184))}
                {tot(L.det.heatKJ, (p) => sgn(p.heatKJ), sgn(r.heatKJ))}
                {tot(L.det.heatKcal, (p) => sgn(p.heatKJ / 4.184), sgn(r.heatKJ / 4.184))}
              </>)}
              {table(L.det.refs, <>
                {row(L.det.pAbs, null, (p) => fmt(p.P, 2))}
                {row(L.det.rSuit, null, (p) => fmt(p.skin.rSuit.body, 3))}
                {row(L.det.cond, null, (p) => fmt(p.skin.G, 1))}
                {row(L.det.tSkin, null, (p) => fmt(p.skin.tSkin, 1))}
              </>)}
              <p className={T.small}>{fill(L.det.foot, { a: fmt(r.area, 2), te: s.tE, he: s.gas === 'tx' ? fill(L.det.he, { he: s.he }) : '' })}</p>
            </div>
        </Card>
      </div>

      {/* Barre résultat fixe en bas sur mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => resRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl px-4 text-white ${tone === 'ok' ? 'bg-primary' : tone === 'mid' ? 'bg-amber-600' : 'bg-red-600'}`}>
          <span className="text-[13px] font-semibold opacity-90">{L.levels[lvlKey][0]}</span>
          <b className="text-xl font-extrabold tabular-nums">{dTtxt} °C</b>
        </button>
      </div>
      {toast}
    </div>
  )
}
