'use client'

import { useState, useRef, useEffect, useLayoutEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab = 'converter' | 'comparison' | 'table'
type WaterType = 'theory' | 'salt' | 'fresh'
type DepthPref = 'm' | 'ft' | 'both'
type PressurePref = 'bar' | 'psi' | 'both'
type TempPref = 'c' | 'f'

// ── Constants ──────────────────────────────────────────────────────────────────
const BAR_TO_PSI = 14.5038
const PSI_TO_BAR = 0.0689476
const M_TO_FT = 3.28084
const FT_TO_M = 0.3048

const COMPARISON_DEPTHS = [0, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 100]
const TABLE_DEPTHS = [0, 3, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100]

// ── Calculations ───────────────────────────────────────────────────────────────
function calcPabs(depth: number, type: WaterType): number {
  if (type === 'theory') return depth / 10 + 1
  if (type === 'salt') return depth / 10 + 1.013
  return depth / 10.3 + 1.013
}

function calcDepthFromPabs(pabs: number, type: WaterType): number {
  let d: number
  if (type === 'theory') d = (pabs - 1) * 10
  else if (type === 'salt') d = (pabs - 1.013) * 10
  else d = (pabs - 1.013) * 10.3
  return Math.max(0, d)
}

function calcPrel(pabs: number, type: WaterType): number {
  const patm = type === 'theory' ? 1 : 1.013
  return Math.max(0, pabs - patm)
}

function calcTemp(surfaceTemp: number, depth: number): number {
  let t: number
  if (depth <= 15) {
    t = surfaceTemp - depth * 0.1
  } else {
    t = surfaceTemp - 1.5 - (depth - 15) * 0.3
  }
  return Math.max(4, t)
}

function cToF(c: number): number {
  return c * 9 / 5 + 32
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  unit,
  sub,
  color,
}: {
  label: string
  value: string
  unit?: string
  sub?: string
  color?: string
}) {
  return (
    <div className={`rounded-2xl border p-5 transition-all duration-300 ease-out-expo ${color || 'border-gray-200 bg-white shadow-soft'}`}>
      <p className="mb-1.5 text-xs font-medium text-gray-400">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span
          key={value}
          className="font-mono text-3xl font-bold leading-none text-black animate-number-pop"
        >
          {value}
        </span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {sub && <p className="mt-2 text-xs leading-relaxed text-gray-400">{sub}</p>}
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
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)))
          }}
          className="w-full bg-transparent font-mono text-sm text-black outline-none placeholder:text-gray-300"
        />
        <span className="shrink-0 text-xs text-gray-400">{unit}</span>
      </div>
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
        <label htmlFor={id} className="font-medium text-gray-700">{label}</label>
        <span key={value} className="font-mono font-semibold text-black tabular-nums animate-number-pop">
          {value}{unit}
        </span>
      </div>
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
      <div className="flex justify-between text-xs text-gray-300">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

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
    const activeBtn = containerRef.current.querySelector(`[data-tab="${active}"]`) as HTMLElement | null
    if (activeBtn) {
      setPillStyle({ left: activeBtn.offsetLeft, width: activeBtn.offsetWidth })
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

function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ease-out-expo ${
            value === opt.id
              ? 'bg-white text-black shadow-soft'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function GlossaryCard({ term, definition }: { term: string; definition: string }) {
  const [open, setOpen] = useState(false)
  return (
    <button
      onClick={() => setOpen(!open)}
      className={`group w-full rounded-2xl border p-5 text-left transition-all duration-300 ease-out-expo ${
        open
          ? 'border-primary/20 bg-primary-50/40 shadow-lifted'
          : 'border-gray-200 bg-white shadow-soft hover:border-gray-300 hover:shadow-lifted'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 ${
          open ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary'
        }`}>
          {term.charAt(0)}
        </div>
        <span className={`flex-1 text-sm font-semibold transition-colors duration-200 ${
          open ? 'text-primary' : 'text-gray-700 group-hover:text-gray-900'
        }`}>
          {term}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition-all duration-300 ease-out-expo ${
            open ? 'rotate-180 text-primary' : 'text-gray-300 group-hover:text-gray-400'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <div className={`overflow-hidden transition-all duration-300 ease-out-expo ${
        open ? 'mt-3 max-h-40 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <p className="text-sm leading-relaxed text-gray-500">{definition}</p>
      </div>
    </button>
  )
}

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-2xl border transition-all duration-300 ease-out-expo ${
      open ? 'border-gray-300 bg-white shadow-lifted' : 'border-gray-200 bg-white shadow-soft hover:shadow-lifted'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start gap-4 p-5 text-left"
      >
        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold transition-all duration-300 ${
          open ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
        }`}>
          {index + 1}
        </span>
        <span className={`flex-1 text-sm font-medium leading-snug transition-colors duration-200 ${
          open ? 'text-black' : 'text-gray-700'
        }`}>
          {question}
        </span>
        <svg
          className={`mt-0.5 h-4 w-4 shrink-0 transition-all duration-300 ease-out-expo ${
            open ? 'rotate-180 text-primary' : 'text-gray-300'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-out-expo ${
        open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="border-t border-gray-100 px-5 pb-5 pt-4">
          <p className="pl-10 text-sm leading-relaxed text-gray-500">{answer}</p>
        </div>
      </div>
    </div>
  )
}

// ── Labels type ────────────────────────────────────────────────────────────────
type ConverterLabels = {
  tabs: { converter: string; comparison: string; table: string }
  prefs: { depth: string; pressure: string; temperature: string; both: string }
  model: { label: string; theory: string; salt: string; fresh: string; theoryNote: string }
  conv: {
    depthToPressure: string; depthLabel: string; pressureAbs: string; pressureRel: string
    formulaLabel: string; formulaTheory: string; formulaSalt: string; formulaFresh: string
    pressureToDepth: string; pressureLabel: string; depthResult: string; quickRule: string; swap: string
  }
  comparison: {
    sliderLabel: string; theoryCard: string; saltCard: string; freshCard: string
    synthesis: string; negligible: string; notable: string
    tableTitle: string; colDepth: string; colTheory: string; colSalt: string; colFresh: string
  }
  table: { title: string; colM: string; colFt: string; colTheory: string; colSalt: string; colFresh: string; colPsi: string }
  glossary: { title: string; terms: { term: string; definition: string }[] }
  faq: { title: string; items: { q: string; a: string }[] }
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PressureConverter({ labels }: { labels: ConverterLabels }) {
  const [tab, setTab] = useState<Tab>('converter')
  const [waterType, setWaterType] = useState<WaterType>('theory')
  const [prefDepth, setPrefDepth] = useState<DepthPref>('m')
  const [prefPressure, setPrefPressure] = useState<PressurePref>('bar')
  const [prefTemp, setPrefTemp] = useState<TempPref>('c')

  // Tab 1 state
  const [depthM, setDepthM] = useState(30)
  const [depthFt, setDepthFt] = useState(Math.round(30 * M_TO_FT * 10) / 10)
  const [barValue, setBarValue] = useState(4)
  const [psiValue, setPsiValue] = useState(Math.round(4 * BAR_TO_PSI * 10) / 10)

  // Tab 2 state
  const [cmpDepth, setCmpDepth] = useState(30)

  // Depth sync helpers
  const handleDepthM = (v: number) => {
    setDepthM(v)
    setDepthFt(Math.round(v * M_TO_FT * 10) / 10)
  }
  const handleDepthFt = (v: number) => {
    setDepthFt(v)
    setDepthM(Math.round(v * FT_TO_M * 10) / 10)
  }
  const handleBarValue = (v: number) => {
    setBarValue(v)
    setPsiValue(Math.round(v * BAR_TO_PSI * 10) / 10)
  }
  const handlePsiValue = (v: number) => {
    setPsiValue(v)
    setBarValue(Math.round(v * PSI_TO_BAR * 10000) / 10000)
  }

  // Tab 1 calculations
  const pabs = calcPabs(depthM, waterType)
  const prel = calcPrel(pabs, waterType)
  const depthFromBar = calcDepthFromPabs(barValue, waterType)
  const tempBottom = calcTemp(25, depthM)

  // Formula text
  const formulaText =
    waterType === 'theory' ? labels.conv.formulaTheory
    : waterType === 'salt' ? labels.conv.formulaSalt
    : labels.conv.formulaFresh

  const modelColors: Record<WaterType, string> = {
    theory: 'border-amber-200 bg-amber-50 text-amber-700',
    salt: 'border-blue-200 bg-blue-50 text-blue-700',
    fresh: 'border-green-200 bg-green-50 text-green-700',
  }

  // Tab 2 calculations
  const cmpTheory = calcPabs(cmpDepth, 'theory')
  const cmpSalt = calcPabs(cmpDepth, 'salt')
  const cmpFresh = calcPabs(cmpDepth, 'fresh')
  const deltaSalt = Math.abs(cmpTheory - cmpSalt)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'converter', label: labels.tabs.converter },
    { id: 'comparison', label: labels.tabs.comparison },
    { id: 'table', label: labels.tabs.table },
  ]

  // Format helpers based on prefs
  const fmtDepth = (m: number) => {
    const ft = (m * M_TO_FT).toFixed(1)
    if (prefDepth === 'ft') return `${ft} ft`
    if (prefDepth === 'both') return `${m.toFixed(1)} m / ${ft} ft`
    return `${m.toFixed(1)} m`
  }

  const fmtPressure = (bar: number) => {
    const psi = (bar * BAR_TO_PSI).toFixed(1)
    if (prefPressure === 'psi') return `${psi} psi`
    if (prefPressure === 'both') return `${bar.toFixed(3)} bar / ${psi} psi`
    return `${bar.toFixed(3)} bar`
  }

  const fmtTemp = (c: number) => {
    if (prefTemp === 'f') return `${cToF(c).toFixed(1)} °F`
    return `${c.toFixed(1)} °C`
  }

  return (
    <div className="animate-fade-in">
      {/* ── Unit preferences ─────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">{labels.prefs.depth}</p>
            <ToggleGroup
              options={[
                { id: 'm', label: 'm' },
                { id: 'ft', label: 'ft' },
                { id: 'both', label: labels.prefs.both },
              ]}
              value={prefDepth}
              onChange={(v) => setPrefDepth(v as DepthPref)}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">{labels.prefs.pressure}</p>
            <ToggleGroup
              options={[
                { id: 'bar', label: 'bar' },
                { id: 'psi', label: 'psi' },
                { id: 'both', label: labels.prefs.both },
              ]}
              value={prefPressure}
              onChange={(v) => setPrefPressure(v as PressurePref)}
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-400">{labels.prefs.temperature}</p>
            <ToggleGroup
              options={[
                { id: 'c', label: '°C' },
                { id: 'f', label: '°F' },
              ]}
              value={prefTemp}
              onChange={(v) => setPrefTemp(v as TempPref)}
            />
          </div>
        </div>
      </div>

      {/* ── Model selector ───────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
          {labels.model.label}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(['theory', 'salt', 'fresh'] as WaterType[]).map((wt) => {
            const colors: Record<WaterType, { active: string; inactive: string }> = {
              theory: {
                active: 'border-amber-300 bg-amber-50 text-amber-700 shadow-[0_2px_8px_rgba(245,158,11,0.15)]',
                inactive: 'border-gray-200 bg-white text-gray-400 shadow-soft hover:border-gray-300 hover:text-gray-600 hover:shadow-lifted',
              },
              salt: {
                active: 'border-blue-300 bg-blue-50 text-blue-700 shadow-[0_2px_8px_rgba(59,130,246,0.15)]',
                inactive: 'border-gray-200 bg-white text-gray-400 shadow-soft hover:border-gray-300 hover:text-gray-600 hover:shadow-lifted',
              },
              fresh: {
                active: 'border-green-300 bg-green-50 text-green-700 shadow-[0_2px_8px_rgba(34,197,94,0.15)]',
                inactive: 'border-gray-200 bg-white text-gray-400 shadow-soft hover:border-gray-300 hover:text-gray-600 hover:shadow-lifted',
              },
            }
            return (
              <button
                key={wt}
                onClick={() => setWaterType(wt)}
                className={`rounded-xl border py-3 text-sm font-semibold transition-all duration-200 ease-out-expo active:scale-95 ${
                  waterType === wt ? colors[wt].active : colors[wt].inactive
                }`}
              >
                {labels.model[wt]}
              </button>
            )
          })}
        </div>
        {waterType === 'theory' && (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-700">
            {labels.model.theoryNote}
          </p>
        )}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* ── TAB 1 — Converter ────────────────────────────────────── */}
      {tab === 'converter' && (
        <div className="space-y-6 animate-slide-up">
          {/* Depth → Pressure */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.conv.depthToPressure}
            </p>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <NumInput
                    label={`${labels.conv.depthLabel} (m)`}
                    value={depthM}
                    min={0}
                    max={300}
                    step={0.1}
                    unit="m"
                    onChange={handleDepthM}
                  />
                </div>
                <button
                  onClick={() => handleDepthM(depthM)}
                  className="mb-[2px] flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg text-gray-400 shadow-soft transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-lifted active:scale-95"
                >
                  {labels.conv.swap}
                </button>
                <div className="flex-1">
                  <NumInput
                    label={`${labels.conv.depthLabel} (ft)`}
                    value={depthFt}
                    min={0}
                    max={1000}
                    step={0.1}
                    unit="ft"
                    onChange={handleDepthFt}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard
                label={`${labels.conv.pressureAbs} (bar)`}
                value={pabs.toFixed(3)}
                unit="bar"
              />
              <StatCard
                label={`${labels.conv.pressureAbs} (psi)`}
                value={(pabs * BAR_TO_PSI).toFixed(1)}
                unit="psi"
              />
              <StatCard
                label={labels.conv.pressureRel}
                value={prel.toFixed(3)}
                unit="bar"
                sub={`${(prel * BAR_TO_PSI).toFixed(1)} psi`}
              />
            </div>

            {/* Formula block */}
            <div className={`mt-3 rounded-2xl border p-4 text-sm font-mono ${modelColors[waterType]}`}>
              <span className="text-xs font-sans font-medium opacity-70">{labels.conv.formulaLabel}</span>
              <br />
              {formulaText} = {pabs.toFixed(3)} bar
            </div>

            {/* Temperature estimate */}
            <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">🌡 {labels.prefs.temperature}</span>
                <span className="font-mono font-semibold text-gray-700">{fmtTemp(tempBottom)}</span>
              </div>
            </div>
          </div>

          {/* Pressure → Depth */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.conv.pressureToDepth}
            </p>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <NumInput
                    label={`${labels.conv.pressureLabel} (bar)`}
                    value={barValue}
                    min={0}
                    max={100}
                    step={0.001}
                    unit="bar"
                    onChange={handleBarValue}
                  />
                </div>
                <button
                  onClick={() => handleBarValue(barValue)}
                  className="mb-[2px] flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg text-gray-400 shadow-soft transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-lifted active:scale-95"
                >
                  {labels.conv.swap}
                </button>
                <div className="flex-1">
                  <NumInput
                    label={`${labels.conv.pressureLabel} (psi)`}
                    value={psiValue}
                    min={0}
                    max={1500}
                    step={0.1}
                    unit="psi"
                    onChange={handlePsiValue}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <StatCard
                label={labels.conv.depthResult}
                value={depthFromBar.toFixed(1)}
                unit="m"
                sub={`${(depthFromBar * M_TO_FT).toFixed(1)} ft`}
              />
              <StatCard
                label={labels.conv.quickRule}
                value={(psiValue / 15).toFixed(1)}
                unit="bar"
                sub={`${psiValue.toFixed(0)} psi ÷ 15`}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2 — Comparison ───────────────────────────────────── */}
      {tab === 'comparison' && (
        <div className="space-y-6 animate-slide-up">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
            <SliderRow
              label={labels.comparison.sliderLabel}
              id="cmpDepth"
              min={0}
              max={100}
              step={1}
              value={cmpDepth}
              unit=" m"
              onChange={setCmpDepth}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label={labels.comparison.theoryCard}
              value={cmpTheory.toFixed(3)}
              unit="bar"
              color="border-amber-200 bg-amber-50 shadow-soft"
            />
            <StatCard
              label={labels.comparison.saltCard}
              value={cmpSalt.toFixed(3)}
              unit="bar"
              color="border-blue-200 bg-blue-50 shadow-soft"
            />
            <StatCard
              label={labels.comparison.freshCard}
              value={cmpFresh.toFixed(3)}
              unit="bar"
              color="border-green-200 bg-green-50 shadow-soft"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-500">
            {labels.comparison.synthesis
              .replace('{depth}', String(cmpDepth))
              .replace('{deltaSalt}', deltaSalt.toFixed(3))
              .replace('{verdict}', deltaSalt < 0.1 ? labels.comparison.negligible : labels.comparison.notable)}
          </div>

          {/* Comparison table */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              {labels.comparison.tableTitle}
            </p>
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-soft">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">{labels.comparison.colDepth}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-amber-500">{labels.comparison.colTheory}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-blue-500">{labels.comparison.colSalt}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-green-500">{labels.comparison.colFresh}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_DEPTHS.map((d) => {
                    const isActive = d === cmpDepth
                    return (
                      <tr
                        key={d}
                        className={`border-b border-gray-100 last:border-0 transition-colors duration-150 ${
                          isActive ? 'bg-primary-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className={`px-4 py-3 font-mono ${isActive ? 'font-semibold text-primary' : 'text-gray-700'}`}>
                          {d} m
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">
                          {calcPabs(d, 'theory').toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">
                          {calcPabs(d, 'salt').toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">
                          {calcPabs(d, 'fresh').toFixed(3)}
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

      {/* ── TAB 3 — Reference table ──────────────────────────────── */}
      {tab === 'table' && (
        <div className="space-y-6 animate-slide-up">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {labels.table.title}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-400">{labels.table.colM}</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-400">{labels.table.colFt}</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-amber-500">{labels.table.colTheory}</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-blue-500">{labels.table.colSalt}</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-green-500">{labels.table.colFresh}</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-400">{labels.table.colPsi}</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_DEPTHS.map((d) => {
                  const pTheory = calcPabs(d, 'theory')
                  const pSalt = calcPabs(d, 'salt')
                  const pFresh = calcPabs(d, 'fresh')
                  const activePabs = calcPabs(d, waterType)
                  return (
                    <tr key={d} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-3 py-2.5 font-mono font-medium text-gray-700">{d}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-500">{(d * M_TO_FT).toFixed(1)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-600">{pTheory.toFixed(3)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-600">{pSalt.toFixed(3)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-600">{pFresh.toFixed(3)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-500">{(activePabs * BAR_TO_PSI).toFixed(1)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pedagogical zone (below tabs, always visible) ─────────── */}
      <div className="mt-12 border-t border-gray-200 pt-10">
        {/* Glossary */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-black">{labels.glossary.title}</h2>
        </div>
        <p className="mb-5 text-sm text-gray-400">7 termes essentiels</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {labels.glossary.terms.map((t) => (
            <GlossaryCard key={t.term} term={t.term} definition={t.definition} />
          ))}
        </div>

        {/* FAQ */}
        <div className="mb-2 mt-12 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-black">{labels.faq.title}</h2>
        </div>
        <p className="mb-5 text-sm text-gray-400">{labels.faq.items.length} questions</p>
        <div className="space-y-2">
          {labels.faq.items.map((item, i) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
