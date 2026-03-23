'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab = 'calc' | 'bestmix' | 'cns'
type AlertLevel = 'safe' | 'warning' | 'danger'

// ── NOAA Single Dive Exposure Table ───────────────────────────────────────────
const NOAA_TABLE = [
  { ppo2: 0.6, time: 720 },
  { ppo2: 0.7, time: 570 },
  { ppo2: 0.8, time: 450 },
  { ppo2: 0.9, time: 360 },
  { ppo2: 1.0, time: 300 },
  { ppo2: 1.1, time: 240 },
  { ppo2: 1.2, time: 210 },
  { ppo2: 1.3, time: 180 },
  { ppo2: 1.4, time: 150 },
  { ppo2: 1.5, time: 120 },
  { ppo2: 1.6, time: 45 },
]

const COMMON_MIXES = [21, 26, 28, 30, 32, 36, 40]

// ── Calculs ───────────────────────────────────────────────────────────────────
function calcMOD(fo2Frac: number, ppo2: number) {
  return ((ppo2 / fo2Frac) - 1) * 10
}

function calcEAD(fo2Frac: number, depth: number) {
  return Math.max(0, ((fo2Frac / 0.21) * (depth + 10)) - 10)
}

function calcPO2(fo2Frac: number, depth: number) {
  return fo2Frac * (depth / 10 + 1)
}

function getNOAALimit(ppo2: number): number {
  const rounded = Math.round(ppo2 * 10) / 10
  const row = [...NOAA_TABLE].reverse().find((r) => rounded >= r.ppo2)
  return row?.time ?? 720
}

function getAlertLevel(po2: number): AlertLevel {
  if (po2 > 1.6) return 'danger'
  if (po2 > 1.4) return 'warning'
  return 'safe'
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const alertCard: Record<AlertLevel, string> = {
  safe: 'border-gray-200 bg-white shadow-soft',
  warning: 'border-amber-200 bg-amber-50 shadow-soft',
  danger: 'border-red-200 bg-red-50 shadow-soft',
}

const alertText: Record<AlertLevel, string> = {
  safe: 'text-green-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
}

const alertBanner: Record<AlertLevel, string> = {
  safe: 'border-green-200 bg-green-50',
  warning: 'border-amber-200 bg-amber-50',
  danger: 'border-red-200 bg-red-50',
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  unit,
  sub,
  alert = 'safe',
}: {
  label: string
  value: string
  unit?: string
  sub?: string
  alert?: AlertLevel
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 ease-out-expo ${alertCard[alert]}`}
    >
      <p className="mb-1.5 text-xs font-medium text-gray-400">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span
          key={value}
          className={`font-mono text-3xl font-bold leading-none animate-number-pop ${
            alert !== 'safe' ? alertText[alert] : 'text-black'
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {sub && (
        <p
          className={`mt-2 text-xs leading-relaxed ${
            alert !== 'safe' ? alertText[alert] : 'text-gray-400'
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

function SliderRow({
  label,
  id,
  min,
  max,
  step,
  value,
  unit,
  onChange,
}: {
  label: string
  id: string
  min: number
  max: number
  step: number
  value: number
  unit: string
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium text-gray-700">
          {label}
        </label>
        <span
          key={value}
          className="font-mono font-semibold text-black tabular-nums animate-number-pop"
        >
          {value}
          {unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #1284c7 0%, #1284c7 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-300">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  )
}

function NumInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-3 shadow-soft transition-all duration-200 ease-out-expo focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(18,132,199,0.1)]">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || min)}
          className="w-full bg-transparent font-mono text-sm text-black outline-none placeholder:text-gray-300"
        />
        <span className="shrink-0 text-xs text-gray-400">{unit}</span>
      </div>
    </div>
  )
}

// ── Animated tab bar ──────────────────────────────────────────────────────────
function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: Tab; label: string }[]
  active: Tab
  onChange: (id: Tab) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 })

  const updatePill = () => {
    if (!containerRef.current) return
    const activeBtn = containerRef.current.querySelector(
      `[data-tab="${active}"]`
    ) as HTMLElement | null
    if (activeBtn) {
      setPillStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      })
    }
  }

  useLayoutEffect(updatePill, [active])
  useEffect(() => {
    window.addEventListener('resize', updatePill)
    return () => window.removeEventListener('resize', updatePill)
  }, [active])

  return (
    <div
      ref={containerRef}
      className="relative mb-6 flex gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1.5"
    >
      {/* Animated pill */}
      <div
        className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-white shadow-lifted transition-all duration-300 ease-out-expo"
        style={{ left: pillStyle.left, width: pillStyle.width }}
      />
      {tabs.map((t) => (
        <button
          key={t.id}
          data-tab={t.id}
          onClick={() => onChange(t.id)}
          className={`relative z-10 flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
            active === t.id ? 'text-black' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Labels type ──────────────────────────────────────────────────────────────
type NitroxLabels = {
  tabs: { calc: string; bestmix: string; cns: string }
  calc: {
    mixSection: string
    fractionLabel: string
    ppo2Section: string
    ppo2Hints: Record<number, string>
    modSection: string
    modLabel: string
    po2AtModLabel: string
    modVerification: string
    depthSection: string
    depthLabel: string
    resultsAtDepth: string
    eadLabel: string
    eadSub: string
    eadSubAir: string
    po2AtDepthLabel: string
    dangerLabel: string
    warningLabel: string
    safeLabel: string
    dangerMsg: string
    warningMsg: string
    safeMsg: string
  }
  bestmix: {
    paramsSection: string
    depthLabel: string
    ppo2Label: string
    resultSection: string
    bestMixLabel: string
    bestMixCapped: string
    bestMixMin: string
    bestMixOptimal: string
    modLabel: string
    modSub: string
    adviceHigh: string
    adviceMid: string
    adviceLow: string
    tableSection: string
    tableMix: string
    tableMod14: string
    tableMod16: string
    recommended: string
  }
  cns: {
    paramsSection: string
    fo2Label: string
    depthLabel: string
    durationLabel: string
    initialLabel: string
    resultSection: string
    ppo2Label: string
    noaaLimitLabel: string
    noaaOutOfRange: string
    noaaForPpo2: string
    cnsTotalLabel: string
    cnsRecommended: string
    dangerPpo2Msg: string
    dangerCnsMsg: string
    warningCnsMsg: string
    safeCnsMsg: string
    noaaTableTitle: string
    noaaTablePpo2: string
    noaaTableLimit: string
    noaaTableRate: string
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NitroxCalculator({ labels }: { labels: NitroxLabels }) {
  const [tab, setTab] = useState<Tab>('calc')
  const [fo2, setFo2] = useState(32)
  const [ppo2, setPpo2] = useState(1.4)
  const [depth, setDepth] = useState(30)

  const [targetDepth, setTargetDepth] = useState(30)
  const [targetPpo2, setTargetPpo2] = useState(1.4)

  const [cnsFo2, setCnsFo2] = useState(32)
  const [cnsDepth, setCnsDepth] = useState(30)
  const [cnsTime, setCnsTime] = useState(45)
  const [cnsInitial, setCnsInitial] = useState(0)

  // ── Tab 1 calculations ──────────────────────────────────────────────────
  const fo2Frac = fo2 / 100
  const mod = calcMOD(fo2Frac, ppo2)
  const ead = calcEAD(fo2Frac, depth)
  const po2AtDepth = calcPO2(fo2Frac, depth)
  const po2AtMod = calcPO2(fo2Frac, mod)
  const depthAlertLevel = getAlertLevel(po2AtDepth)
  const eadSaving = (depth - ead).toFixed(1)

  // ── Tab 2 calculations ──────────────────────────────────────────────────
  const rawBestFo2 = (targetPpo2 / (targetDepth / 10 + 1)) * 100
  const bestFo2 = Math.min(40, Math.max(21, rawBestFo2))
  const bestFo2Frac = bestFo2 / 100
  const bestMod = calcMOD(bestFo2Frac, targetPpo2)

  // ── Tab 3 calculations ──────────────────────────────────────────────────
  const cnsPpo2 = calcPO2(cnsFo2 / 100, cnsDepth)
  const cnsLimit = getNOAALimit(cnsPpo2)
  const cnsDive = cnsPpo2 <= 1.6 ? (cnsTime / cnsLimit) * 100 : 999
  const cnsTotal = Math.min(200, cnsInitial + cnsDive)
  const cnsAlertLevel: AlertLevel =
    cnsTotal > 100 ? 'danger' : cnsTotal > 80 ? 'warning' : 'safe'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'calc', label: labels.tabs.calc },
    { id: 'bestmix', label: labels.tabs.bestmix },
    { id: 'cns', label: labels.tabs.cns },
  ]

  return (
    <div className="animate-fade-in">
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* ── TAB 1 — Main calculator ────────────────────────────── */}
      {tab === 'calc' && (
        <div className="space-y-6 animate-slide-up">
          {/* Mix */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.calc.mixSection}
            </p>
            <SliderRow
              label={labels.calc.fractionLabel}
              id="fo2"
              min={21}
              max={40}
              step={0.5}
              value={fo2}
              unit="%"
              onChange={setFo2}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {[21, 28, 32, 36, 40].map((v) => (
                <button
                  key={v}
                  onClick={() => setFo2(v)}
                  className={`rounded-xl px-3.5 py-2 font-mono text-xs font-medium transition-all duration-200 ease-out-expo active:scale-95 ${
                    fo2 === v
                      ? 'bg-primary text-white shadow-[0_2px_8px_rgba(18,132,199,0.3)]'
                      : 'border border-gray-200 bg-white text-gray-500 shadow-soft hover:border-gray-300 hover:shadow-lifted hover:text-gray-700'
                  }`}
                >
                  EANx{v}
                </button>
              ))}
            </div>
          </div>

          {/* PPO2 max */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.calc.ppo2Section}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[1.2, 1.4, 1.5, 1.6].map((v) => (
                <button
                  key={v}
                  onClick={() => setPpo2(v)}
                  className={`rounded-xl border py-3 font-mono text-sm font-semibold transition-all duration-200 ease-out-expo active:scale-95 ${
                    ppo2 === v
                      ? v >= 1.6
                        ? 'border-red-300 bg-red-50 text-red-600 shadow-[0_2px_8px_rgba(239,68,68,0.15)]'
                        : 'border-primary bg-primary-50 text-primary shadow-[0_2px_8px_rgba(18,132,199,0.15)]'
                      : 'border-gray-200 bg-white text-gray-400 shadow-soft hover:border-gray-300 hover:text-gray-600 hover:shadow-lifted'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">{labels.calc.ppo2Hints[ppo2]}</p>
          </div>

          {/* MOD results */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.calc.modSection}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label={labels.calc.modLabel}
                value={mod.toFixed(1)}
                unit="m"
                sub={`Formule : (${ppo2} / ${fo2Frac.toFixed(2)} \u2212 1) \u00d7 10`}
              />
              <StatCard
                label={labels.calc.po2AtModLabel}
                value={po2AtMod.toFixed(2)}
                unit="bar"
                sub={labels.calc.modVerification}
              />
            </div>
            {/* Visual bar */}
            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex justify-between text-xs text-gray-400">
                <span>0 m</span>
                <span className="font-medium text-gray-600">
                  MOD : {mod.toFixed(1)} m
                </span>
                <span>60 m</span>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary transition-all duration-500 ease-out-expo"
                  style={{ width: `${Math.min((mod / 60) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Depth */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.calc.depthSection}
            </p>
            <SliderRow
              label={labels.calc.depthLabel}
              id="depth"
              min={5}
              max={60}
              step={1}
              value={depth}
              unit=" m"
              onChange={setDepth}
            />
          </div>

          {/* EAD + PO2 at depth */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.calc.resultsAtDepth.replace('{depth}', String(depth))}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label={labels.calc.eadLabel}
                value={ead.toFixed(1)}
                unit="m"
                sub={
                  parseFloat(eadSaving) > 0
                    ? labels.calc.eadSub.replace('{saving}', eadSaving)
                    : labels.calc.eadSubAir
                }
              />
              <StatCard
                label={labels.calc.po2AtDepthLabel}
                value={po2AtDepth.toFixed(2)}
                unit="bar"
                alert={depthAlertLevel}
                sub={
                  depthAlertLevel === 'danger'
                    ? labels.calc.dangerLabel
                    : depthAlertLevel === 'warning'
                    ? labels.calc.warningLabel
                    : labels.calc.safeLabel
                }
              />
            </div>

            {/* Status banner */}
            <div
              className={`mt-3 rounded-2xl border p-4 text-sm leading-relaxed transition-colors duration-300 ${alertBanner[depthAlertLevel]}`}
            >
              {depth > mod ? (
                <span className="text-red-600">
                  {labels.calc.dangerMsg
                    .replace('{depth}', String(depth))
                    .replace('{mod}', mod.toFixed(1))
                    .replace('{po2}', po2AtDepth.toFixed(2))}
                </span>
              ) : depth > mod * 0.9 ? (
                <span className="text-amber-600">
                  {labels.calc.warningMsg.replace('{margin}', (mod - depth).toFixed(1))}
                </span>
              ) : (
                <span className="text-green-600">
                  {labels.calc.safeMsg.replace('{margin}', (mod - depth).toFixed(1))}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2 — Best mix ───────────────────────────────────── */}
      {tab === 'bestmix' && (
        <div className="space-y-6 animate-slide-up">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.bestmix.paramsSection}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <NumInput
                label={labels.bestmix.depthLabel}
                value={targetDepth}
                min={5}
                max={60}
                step={1}
                unit="m"
                onChange={setTargetDepth}
              />
              <NumInput
                label={labels.bestmix.ppo2Label}
                value={targetPpo2}
                min={1.0}
                max={1.6}
                step={0.1}
                unit="bar"
                onChange={setTargetPpo2}
              />
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.bestmix.resultSection}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label={labels.bestmix.bestMixLabel}
                value={bestFo2.toFixed(1)}
                unit="%"
                sub={
                  rawBestFo2 > 40
                    ? labels.bestmix.bestMixCapped
                    : rawBestFo2 < 21
                    ? labels.bestmix.bestMixMin
                    : labels.bestmix.bestMixOptimal
                        .replace('{mix}', String(Math.round(bestFo2)))
                        .replace('{depth}', String(targetDepth))
                }
              />
              <StatCard
                label={labels.bestmix.modLabel}
                value={bestMod.toFixed(1)}
                unit="m"
                sub={labels.bestmix.modSub.replace('{ppo2}', String(targetPpo2))}
              />
            </div>

            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
              {bestFo2 >= 36
                ? labels.bestmix.adviceHigh
                    .replace('{mix}', String(Math.round(bestFo2)))
                    .replace('{depth}', String(targetDepth))
                : bestFo2 >= 30
                ? labels.bestmix.adviceMid.replace('{mix}', String(Math.round(bestFo2)))
                : labels.bestmix.adviceLow.replace('{mix}', String(Math.round(bestFo2)))}
            </div>
          </div>

          {/* Reference table */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.bestmix.tableSection}
            </p>
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-soft">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                      {labels.bestmix.tableMix}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">
                      {labels.bestmix.tableMod14}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">
                      {labels.bestmix.tableMod16}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMMON_MIXES.map((mix) => {
                    const f = mix / 100
                    const m14 = calcMOD(f, 1.4).toFixed(0)
                    const m16 = calcMOD(f, 1.6).toFixed(0)
                    const isHighlighted = Math.abs(mix - bestFo2) < 1
                    return (
                      <tr
                        key={mix}
                        className={`border-b border-gray-100 last:border-0 transition-colors duration-150 ${
                          isHighlighted ? 'bg-primary-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td
                          className={`px-4 py-3 font-mono font-medium ${
                            isHighlighted ? 'text-primary' : 'text-gray-700'
                          }`}
                        >
                          EANx{mix}
                          {isHighlighted && (
                            <span className="ml-2 text-xs font-normal text-primary opacity-60">
                              &larr; {labels.bestmix.recommended}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700">
                          {m14} m
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-400">
                          {m16} m
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3 — CNS toxicity ───────────────────────────────── */}
      {tab === 'cns' && (
        <div className="space-y-6 animate-slide-up">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.cns.paramsSection}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <NumInput
                label={labels.cns.fo2Label}
                value={cnsFo2}
                min={21}
                max={40}
                step={0.5}
                unit="%"
                onChange={setCnsFo2}
              />
              <NumInput
                label={labels.cns.depthLabel}
                value={cnsDepth}
                min={5}
                max={60}
                step={1}
                unit="m"
                onChange={setCnsDepth}
              />
              <NumInput
                label={labels.cns.durationLabel}
                value={cnsTime}
                min={1}
                max={240}
                step={1}
                unit="min"
                onChange={setCnsTime}
              />
              <NumInput
                label={labels.cns.initialLabel}
                value={cnsInitial}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={setCnsInitial}
              />
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.cns.resultSection}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label={labels.cns.ppo2Label}
                value={cnsPpo2 > 1.6 ? '> 1.6' : cnsPpo2.toFixed(2)}
                unit="bar"
                alert={getAlertLevel(cnsPpo2)}
              />
              <StatCard
                label={labels.cns.noaaLimitLabel}
                value={cnsPpo2 > 1.6 ? '\u2014' : String(cnsLimit)}
                unit={cnsPpo2 > 1.6 ? '' : 'min'}
                sub={
                  cnsPpo2 > 1.6
                    ? labels.cns.noaaOutOfRange
                    : labels.cns.noaaForPpo2.replace('{ppo2}', (Math.round(cnsPpo2 * 10) / 10).toFixed(1))
                }
              />
            </div>

            {/* CNS bar */}
            <div
              className={`mt-3 rounded-2xl border p-5 transition-colors duration-300 ${alertCard[cnsAlertLevel]}`}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-xs font-medium text-gray-400">
                  {labels.cns.cnsTotalLabel}
                </p>
                <span
                  key={cnsTotal.toFixed(1)}
                  className={`font-mono text-2xl font-bold animate-number-pop ${
                    alertText[cnsAlertLevel] || 'text-black'
                  }`}
                >
                  {cnsPpo2 > 1.6 ? '\u2014' : `${cnsTotal.toFixed(1)} %`}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out-expo"
                  style={{
                    width: `${Math.min(100, cnsPpo2 > 1.6 ? 100 : cnsTotal)}%`,
                    background:
                      cnsTotal > 100
                        ? '#ef4444'
                        : cnsTotal > 80
                        ? '#f59e0b'
                        : '#10b981',
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-400">
                <span>0 %</span>
                <span>{labels.cns.cnsRecommended}</span>
                <span>100 %</span>
              </div>
            </div>

            {/* CNS message */}
            <div
              className={`mt-3 rounded-2xl border p-4 text-sm leading-relaxed transition-colors duration-300 ${alertBanner[cnsAlertLevel]}`}
            >
              {cnsPpo2 > 1.6 ? (
                <span className="text-red-600">
                  {labels.cns.dangerPpo2Msg}
                </span>
              ) : cnsTotal > 100 ? (
                <span className="text-red-600">
                  {labels.cns.dangerCnsMsg.replace('{cns}', cnsTotal.toFixed(1))}
                </span>
              ) : cnsTotal > 80 ? (
                <span className="text-amber-600">
                  {labels.cns.warningCnsMsg.replace('{cns}', cnsTotal.toFixed(1))}
                </span>
              ) : (
                <span className="text-green-600">
                  {labels.cns.safeCnsMsg
                    .replace('{cns}', cnsTotal.toFixed(1))
                    .replace('{margin}', (80 - cnsTotal).toFixed(1))}
                </span>
              )}
            </div>

            {/* NOAA mini table */}
            <div className="mt-4">
              <p className="mb-2 text-xs text-gray-400">
                {labels.cns.noaaTableTitle}
              </p>
              <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-soft">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2.5 text-left font-medium text-gray-400">
                        {labels.cns.noaaTablePpo2}
                      </th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-400">
                        {labels.cns.noaaTableLimit}
                      </th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-400">
                        {labels.cns.noaaTableRate}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {NOAA_TABLE.slice(4).map((row) => {
                      const isActive = Math.abs(cnsPpo2 - row.ppo2) < 0.05
                      return (
                        <tr
                          key={row.ppo2}
                          className={`border-b border-gray-100 last:border-0 transition-colors duration-150 ${
                            isActive ? 'bg-primary-50' : ''
                          }`}
                        >
                          <td
                            className={`px-3 py-2 font-mono ${
                              isActive
                                ? 'font-semibold text-primary'
                                : 'text-gray-600'
                            }`}
                          >
                            {row.ppo2.toFixed(1)} bar
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-600">
                            {row.time} min
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-400">
                            {(100 / row.time).toFixed(2)} %
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
