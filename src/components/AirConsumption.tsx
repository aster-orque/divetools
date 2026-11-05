'use client'

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'
import type { getDictionary } from '@/i18n/get-dictionary'
import {
  BI_VOLUMES_L,
  COLUMN,
  DEFAULT_SETTINGS,
  DEPTHS_M,
  FIELD_SPECS,
  GAUGE,
  MAX_DEPTH_M,
  MONO_VOLUMES_L,
  PRESSURE_TAB_TANK_BAR,
  PRESSURE_TAB_TANK_L,
  RESERVE_BAR,
  STORAGE_KEY,
  TAB_IDS,
  TANK_PRESETS,
  CONSO_LEVELS,
  autonomyMin,
  balloon,
  bottomConsumptionLpm,
  calcConso,
  clamp,
  columnDepthToY,
  columnYToDepth,
  compareDepths,
  compareTankList,
  consoScaleMax,
  consoScalePct,
  gaugeAngle,
  gaugeArcPath,
  gaugeDropBarPerMin,
  gaugeMaxBar,
  heatTable,
  heatTableDepths,
  parseFieldInput,
  polar,
  pressureAbsBar,
  rateConso,
  roundSacForShare,
  sameTank,
  sanitizeSettings,
  secondsPerBar,
  shownMinutes,
  stepValue,
  totalVolumeL,
  unitVolumeAfterModeSwitch,
} from '@/lib/consommation/engine'
import type { BoolKey, ConsoLevelKey, FieldSpec, NumericKey, Settings, StepperKey, TabId, Tank } from '@/lib/consommation/engine'

type Dict = Awaited<ReturnType<typeof getDictionary>>
/** Textes de l'outil : bloc `consumption` des dictionnaires fr/en. */
export type AirConsumptionLabels = Dict['consumption']

// ── Constantes de présentation ─────────────────────────────────────────────────
/** Délai avant répétition (ms) puis intervalle de répétition (ms) en appui long sur − / +. */
const HOLD_DELAY_MS = 400
const HOLD_INTERVAL_MS = 70
/** Marge (px) laissée sous la navbar quand on remonte au haut de l'outil en changeant d'onglet. */
const TOOL_SCROLL_GAP_PX = 12

/** Badge de conso : couleurs sémantiques (texte en teinte 700 pour un contraste AA). Le texte du badge porte l'info. */
const LEVEL_BADGE: Record<ConsoLevelKey, string> = {
  veryCalm: 'border-green-200 bg-green-50 text-green-700',
  calm: 'border-lime-200 bg-lime-50 text-lime-700',
  average: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  high: 'border-orange-200 bg-orange-50 text-orange-700',
  veryHigh: 'border-red-200 bg-red-50 text-red-700',
}

/** Segments de la jauge (mêmes seuils que le badge). */
const LEVEL_FILL: Record<ConsoLevelKey, string> = {
  veryCalm: 'bg-green-500',
  calm: 'bg-lime-500',
  average: 'bg-yellow-400',
  high: 'bg-orange-500',
  veryHigh: 'bg-red-500',
}

/** Couleurs A / B de l'onglet Comparer (classes de fond). */
const SIDE_BG = { A: 'bg-primary', B: 'bg-orange-500' } as const
/** Mêmes couleurs en hex, pour le remplissage dynamique des curseurs (style inline). */
const SIDE_HEX = { A: '#1284c7', B: '#f97316' } as const // primary, orange-500
const TRACK_HEX = '#e5e7eb' // gray-200

/** Remplissage d'un curseur jusqu'à la valeur, comme SliderRow de PressureConverter. */
function rangeFill(value: number, max: number, color: string): string {
  const pct = (value / max) * 100
  return `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, ${TRACK_HEX} ${pct}%, ${TRACK_HEX} 100%)`
}

const TAB_ICONS: Record<TabId, ReactNode> = {
  pression: <><path d="M12 3v14M7 12l5 5 5-5" /><path d="M4 21h16" /></>,
  conso: <><path d="M9 3h6M10 3v3a6 6 0 1 0 4 0V3" /><path d="M12 12l2-2" /></>,
  auto: <><circle cx="12" cy="13" r="8" /><path d="M12 13V9M10 2h4" /></>,
  comp: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
}

// ── Formatage ──────────────────────────────────────────────────────────────────
type Fmt = {
  /** Nombre à `digits` décimales fixes (non fini → 0), comme fmt() de l'original */
  n: (value: number, digits?: number) => string
  /** Idem, sans la décimale si elle vaut 0 (fmt(x, 1).replace(/,0$/, '') de l'original) */
  trim: (value: number, digits?: number) => string
}

function makeFmt(locale: string): Fmt {
  const cache = new Map<string, Intl.NumberFormat>()
  const get = (min: number, max: number) => {
    const key = `${min}-${max}`
    let nf = cache.get(key)
    if (!nf) {
      nf = new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max })
      cache.set(key, nf)
    }
    return nf
  }
  const safe = (v: number) => (Number.isFinite(v) ? v : 0)
  return {
    n: (v, d = 0) => get(d, d).format(safe(v)),
    trim: (v, d = 1) => get(0, d).format(safe(v)),
  }
}

/** Remplace {clé} par la valeur ; les clés inconnues restent (pour les slots de <Rich>). */
function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all))
}

// ── Sous-composants ────────────────────────────────────────────────────────────
/** Rend **gras** et {slot} (nœud React) dans une chaîne de labels. */
function Rich({ text, slots }: { text: string; slots?: Record<string, ReactNode> }) {
  const parts: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\{(\w+)\}/g
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      parts.push(<strong key={i++} className="font-semibold text-black">{m[1]}</strong>)
    } else {
      parts.push(<Fragment key={i++}>{slots?.[m[2]] ?? m[0]}</Fragment>)
    }
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-soft ${className}`}>
      {title && <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">{title}</h2>}
      {children}
    </div>
  )
}

/** Petite carte de résultat (pattern StatCard de PressureConverter, en version compacte dans une carte). */
function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3.5 py-3">
      <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
      <p className="flex items-baseline gap-1">
        <span key={value} className="tabular-nums text-xl font-bold leading-none text-black animate-number-pop">{value}</span>
        <span className="text-xs font-medium text-gray-400">{unit}</span>
      </p>
    </div>
  )
}

/** Pastille A / B : la couleur est toujours doublée de la lettre. */
function SideTag({ side, className = '' }: { side: 'A' | 'B'; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-sans font-bold text-black ${className}`}>
      <i aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${SIDE_BG[side]}`} />
      {side}
    </span>
  )
}

/** Stepper − valeur + : appui long répété, saisie libre avec virgule, validée au blur ou sur Entrée. */
function Stepper({
  id,
  label,
  value,
  spec,
  unit,
  fmt,
  decreaseLabel,
  increaseLabel,
  onBump,
  onSet,
}: {
  id?: string
  label: string
  value: number
  spec: FieldSpec
  unit: string
  fmt: Fmt
  decreaseLabel: string
  increaseLabel: string
  onBump: (dir: -1 | 1) => void
  onSet: (v: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current)
    if (interval.current) clearInterval(interval.current)
    timeout.current = null
    interval.current = null
  }, [])
  useEffect(() => stop, [stop])

  const start = (dir: -1 | 1) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    stop()
    // Une saisie en cours est validée d'abord : le pointerdown empêche le blur qui l'aurait appliquée.
    if (draft !== null) {
      commit()
      return
    }
    onBump(dir)
    timeout.current = setTimeout(() => {
      interval.current = setInterval(() => onBump(dir), HOLD_INTERVAL_MS)
    }, HOLD_DELAY_MS)
  }
  const key = (dir: -1 | 1) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onBump(dir)
    }
  }
  // Validation de la saisie : bornée et recalée sur le pas. Rien n'est appliqué si le texte n'a pas
  // changé (sinon une valeur hors pas, comme une conso partagée de 13,3, serait recalée par un simple focus).
  const commit = () => {
    if (draft !== null && draft !== fmt.trim(value)) {
      const v = parseFieldInput(draft, spec)
      if (v !== null) onSet(v)
    }
    setDraft(null)
  }
  const btn =
    'flex h-11 w-11 shrink-0 select-none touch-manipulation items-center justify-center rounded-xl border border-gray-200 bg-white text-xl leading-none text-gray-500 shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary active:scale-95 active:border-primary active:bg-primary active:text-white'

  return (
    <div className="flex min-w-0 items-center gap-1">
      <button type="button" aria-label={`${decreaseLabel}, ${label}`} className={btn}
        onPointerDown={start(-1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={key(-1)}>
        −
      </button>
      <div className="flex min-w-0 flex-1 flex-col items-center leading-tight">
        <input
          id={id}
          inputMode="decimal"
          aria-label={id ? undefined : label}
          value={draft ?? fmt.trim(value)}
          onFocus={(e) => {
            setDraft(fmt.trim(value))
            e.currentTarget.select()
          }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          onBlur={commit}
          className="w-full min-w-0 max-w-[96px] border-b-2 border-transparent bg-transparent px-0 text-center tabular-nums text-lg font-bold tracking-tight text-black outline-none transition-colors focus:border-primary"
        />
        <small className="text-xs font-medium text-gray-400">{unit}</small>
      </div>
      <button type="button" aria-label={`${increaseLabel}, ${label}`} className={btn}
        onPointerDown={start(1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={key(1)}>
        +
      </button>
    </div>
  )
}

/** Bloc de saisie du modèle HTML (.f), avec le focus des inputs Orque : label lié à l'input via htmlFor quand `htmlFor` est fourni. */
function Field({ label, htmlFor, children, wide = false }: { label: string; htmlFor?: string; children: ReactNode; wide?: boolean }) {
  const Tag = htmlFor ? 'label' : 'span'
  return (
    <div
      className={`rounded-xl border border-transparent bg-gray-50 px-3 pb-3 pt-2 transition-all duration-200 ease-out-expo focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(18,132,199,0.1)] ${wide ? 'col-span-full' : ''}`}
    >
      <Tag htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-gray-500">{label}</Tag>
      {children}
    </div>
  )
}

/** Segment à deux options (pattern ToggleGroup de PressureConverter, cibles de 44 px). */
function Segment<T extends string | boolean>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="inline-flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
      {options.map((opt) => (
        <button
          key={String(opt.id)}
          type="button"
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`min-h-9 rounded-lg px-4 text-sm font-semibold transition-all duration-200 ease-out-expo ${
            value === opt.id ? 'bg-white text-black shadow-soft' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Pill({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-3.5 tabular-nums text-sm font-semibold transition-all duration-200 ease-out-expo active:scale-95 ${
        pressed
          ? 'border-primary bg-primary-50 text-primary-600 shadow-[0_2px_8px_rgba(18,132,199,0.15)]'
          : 'border-gray-200 bg-white text-gray-600 shadow-soft hover:border-gray-300 hover:text-black'
      }`}
    >
      {children}
    </button>
  )
}

/** Barres verticales 0 → 60 m (piège des premiers mètres, même bloc à d'autres profondeurs). */
function DepthBars({
  items,
  unitM,
  onPick,
}: {
  items: { depth: number; value: string; heightPct: number; on: boolean }[]
  unitM: string
  onPick: (depth: number) => void
}) {
  return (
    <div className="mt-1.5 grid h-[120px] grid-cols-7 items-end gap-1">
      {items.map((it) => (
        <button
          key={it.depth}
          type="button"
          aria-pressed={it.on}
          onClick={() => onPick(it.depth)}
          className="group flex h-full flex-col items-center justify-end rounded-lg"
        >
          <b className={`mb-0.5 tabular-nums text-xs font-medium ${it.on ? 'text-black' : 'text-gray-500'}`}>{it.value}</b>
          <i
            className={`block w-full max-w-[42px] rounded-b-sm rounded-t-md transition-all duration-300 ease-out-expo ${
              it.on ? 'bg-primary' : 'bg-gray-200 group-hover:bg-primary-200'
            }`}
            style={{ height: `${it.heightPct}%` }}
          />
          <span className={`mt-1 text-[11px] ${it.on ? 'font-semibold text-black' : 'text-gray-500'}`}>{it.depth} {unitM}</span>
        </button>
      ))}
    </div>
  )
}

function TankPicker({
  unitL,
  bi,
  unitSpec,
  labels,
  fmt,
  onMode,
  onBump,
  onSet,
}: {
  unitL: number
  bi: boolean
  unitSpec: FieldSpec
  labels: AirConsumptionLabels
  fmt: Fmt
  onMode: (bi: boolean) => void
  onBump: (dir: -1 | 1) => void
  onSet: (v: number) => void
}) {
  const presets = bi ? BI_VOLUMES_L : MONO_VOLUMES_L
  return (
    <div className="grid items-center gap-x-4 gap-y-2.5 sm:grid-cols-[minmax(150px,220px)_1fr]">
      <div>
        <div className="mb-2">
          <Segment
            options={[{ id: false, label: labels.tank.mono }, { id: true, label: labels.tank.bi }]}
            value={bi}
            onChange={onMode}
          />
        </div>
        <div className="max-w-[240px]">
          <Stepper
            label={labels.tank.label}
            value={unitL}
            spec={unitSpec}
            unit={bi ? fill(labels.stepper.biTotal, { total: fmt.trim(unitL * 2) }) : labels.units.l}
            fmt={fmt}
            decreaseLabel={labels.stepper.decrease}
            increaseLabel={labels.stepper.increase}
            onBump={onBump}
            onSet={onSet}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((v) => (
          <Pill key={v} pressed={unitL === v} onClick={() => onSet(v)}>
            {bi ? labels.tank.biPrefix : ''}{v} {labels.units.l}
          </Pill>
        ))}
      </div>
    </div>
  )
}

/** Colonne d'eau : on fait glisser le ballon, son volume suit 1/P. */
function WaterColumn({
  depthM,
  ariaLabel,
  unitM,
  fmt,
  onDepth,
}: {
  depthM: number
  ariaLabel: string
  unitM: string
  fmt: Fmt
  onDepth: (d: number) => void
}) {
  const gradId = `wg-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const y = columnDepthToY(depthM)
  const b = balloon(depthM)
  const ticks: number[] = []
  for (let m = 0; m <= MAX_DEPTH_M; m += 10) ticks.push(m)

  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    onDepth(columnYToDepth((e.clientY - r.top) / r.height * COLUMN.height))
  }

  return (
    <svg
      viewBox={`0 0 ${COLUMN.width} ${COLUMN.height}`}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={MAX_DEPTH_M}
      aria-valuenow={depthM}
      aria-valuetext={`${depthM} ${unitM}`}
      className="block aspect-[3/8] h-auto w-full cursor-ns-resize touch-none rounded-xl"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        fromPointer(e)
      }}
      onPointerMove={(e) => {
        if (e.buttons) fromPointer(e)
      }}
      onKeyDown={(e) => {
        const delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
        if (delta) {
          e.preventDefault()
          onDepth(clamp(depthM + delta, 0, MAX_DEPTH_M))
        }
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="text-primary-500" stopColor="currentColor" />
          <stop offset="1" className="text-primary-900" stopColor="currentColor" />
        </linearGradient>
      </defs>
      <rect width={COLUMN.width} height={COLUMN.height} fill={`url(#${gradId})`} />
      <path d="M0 10 Q15 6 30 10 T60 10 T90 10 T120 10 V0 H0Z" className="fill-white" fillOpacity={0.9} />
      {ticks.map((m) => {
        const ty = columnDepthToY(m)
        return (
          <g key={m}>
            <line x1="0" x2="10" y1={ty} y2={ty} className="stroke-white" strokeOpacity={0.5} />
            <text x="14" y={ty + 4} className="fill-white" fontSize="10">{m} {unitM}</text>
          </g>
        )
      })}
      <line x1="40" x2="120" y1={y} y2={y} className="stroke-white" strokeDasharray="3 3" strokeOpacity={0.7} />
      <circle cx="80" cy={b.cy} r={b.r} className="fill-white" fillOpacity={0.9} />
      <text x="80" y={b.cy + 4} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-primary-800">
        {fmt.n(b.volumePct)}%
      </text>
    </svg>
  )
}

/** Manomètre : arc 270°, aiguille sur la pression de départ, minutes au centre. */
function PressureGauge({ startBar, minutes, caption, fmt }: { startBar: number; minutes: number; caption: string; fmt: Fmt }) {
  const max = gaugeMaxBar(startBar)
  const ticks: number[] = []
  for (let v = 0; v <= max; v += GAUGE.tickStepBar) ticks.push(v)
  const [nx, ny] = polar(gaugeAngle(startBar, max), 60)
  return (
    <svg viewBox="0 0 200 180" className="mx-auto block w-full max-w-[240px]">
      <path d={gaugeArcPath(0, max, max, 62)} className="stroke-gray-100" strokeWidth="14" fill="none" />
      <path d={gaugeArcPath(0, startBar, max, 62)} className="stroke-primary" strokeWidth="14" fill="none" />
      {ticks.map((v) => {
        const a = gaugeAngle(v, max)
        const [x0, y0] = polar(a, 70)
        const [x1, y1] = polar(a, 76)
        const [tx, ty] = polar(a, 88)
        return (
          <g key={v}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} className="stroke-gray-400" strokeWidth="1.5" />
            <text x={tx} y={ty + 3.5} textAnchor="middle" fontSize="9" className="fill-gray-400">{v}</text>
          </g>
        )
      })}
      <line x1={GAUGE.cx} y1={GAUGE.cy} x2={nx} y2={ny} className="stroke-black" strokeWidth="3" strokeLinecap="round" />
      <circle cx={GAUGE.cx} cy={GAUGE.cy} r="5" className="fill-black" />
      <text x="100" y="142" textAnchor="middle" fontSize="34" fontWeight="700" className="fill-black tabular-nums">
        {fmt.n(shownMinutes(minutes))}
      </text>
      <text x="100" y="176" textAnchor="middle" fontSize="10.5" className="fill-gray-500">{caption}</text>
    </svg>
  )
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function AirConsumption({ labels }: { labels: AirConsumptionLabels }) {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const baseId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const fmt = useMemo(() => makeFmt(labels.numberLocale), [labels.numberLocale])

  // Lecture des réglages mémorisés (après montage, pour éviter un écart d'hydratation).
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      setS(sanitizeSettings(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')))
    } catch {
      /* stockage indisponible ou JSON invalide : valeurs par défaut */
    }
    setLoaded(true)
  }, [])

  // Sauvegarde à chaque changement.
  useEffect(() => {
    if (!loaded || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      /* stockage plein ou bloqué */
    }
  }, [s, loaded])

  // ── Mises à jour de l'état ──
  const setNum = useCallback((k: NumericKey, v: number) => {
    setS((prev) => {
      const next = { ...prev }
      next[k] = v
      return next
    })
  }, [])
  const bump = useCallback((k: StepperKey, dir: -1 | 1) => {
    setS((prev) => {
      const next = { ...prev }
      next[k] = stepValue(prev[k], dir, FIELD_SPECS[k])
      return next
    })
  }, [])
  const setMode = useCallback((biKey: BoolKey, unitKey: 'cV' | 'V', toBi: boolean) => {
    setS((prev) => {
      const next = { ...prev }
      next[unitKey] = unitVolumeAfterModeSwitch(prev[unitKey], prev[biKey], toBi)
      next[biKey] = toBi
      return next
    })
  }, [])
  const show = useCallback((tab: TabId) => {
    setS((prev) => ({ ...prev, tab }))
    // Remonte au haut de l'outil (sous la navbar collante) seulement s'il est sorti de l'écran.
    const root = rootRef.current
    if (!root) return
    const headerH = document.querySelector('header')?.getBoundingClientRect().height ?? 0
    const top = root.getBoundingClientRect().top - headerH - TOOL_SCROLL_GAP_PX
    if (top < 0) window.scrollBy({ top })
  }, [])

  // Autonomie et Comparer ont chacun leurs champs sac/P0, tous deux dans le DOM : le préfixe garde les ids uniques.
  const fieldId = (k: StepperKey, scope = '') => `${baseId}-${scope}${k}`
  const stepper = (k: StepperKey, label: string, unit: string, scope = '') => (
    <Stepper
      id={fieldId(k, scope)}
      label={label}
      value={s[k]}
      spec={FIELD_SPECS[k]}
      unit={unit}
      fmt={fmt}
      decreaseLabel={labels.stepper.decrease}
      increaseLabel={labels.stepper.increase}
      onBump={(dir) => bump(k, dir)}
      onSet={(v) => setNum(k, v)}
    />
  )
  const tankPicker = (unitKey: 'cV' | 'V', biKey: BoolKey) => (
    <TankPicker
      unitL={s[unitKey]}
      bi={s[biKey]}
      unitSpec={FIELD_SPECS[unitKey]}
      labels={labels}
      fmt={fmt}
      onMode={(bi) => setMode(biKey, unitKey, bi)}
      onBump={(dir) => bump(unitKey, dir)}
      onSet={(v) => setNum(unitKey, v)}
    />
  )
  const tankName = (t: Tank) => `${t.bi ? labels.tank.biPrefix : ''}${fmt.trim(t.unitL)} ${labels.units.l}`
  const u = labels.units

  // ── 1. Pression ──
  const p = pressureAbsBar(s.d)
  const pressureTankMin = autonomyMin(PRESSURE_TAB_TANK_L, PRESSURE_TAB_TANK_BAR, s.sac, s.d)
  const lungs: [string, number][] = [[labels.pressure.surface, 1], [`${s.d} ${u.m}`, p]]

  // ── 2. Ma conso ──
  const conso = calcConso(totalVolumeL(s.cV, s.cBi), s.cP0, s.cP1, s.cT, s.cD)
  const level = rateConso(conso.sacLpm)
  const scaleMax = consoScaleMax(conso.sacLpm)
  const pct = (v: number) => consoScalePct(v, scaleMax)
  // Jauge en 5 segments, bornés par les seuils du badge (le dernier segment va jusqu'au max).
  const segments = CONSO_LEVELS.map((l, i) => {
    const from = i === 0 ? 0 : CONSO_LEVELS[i - 1].below
    return { key: l.key, from: pct(from), to: pct(Math.min(l.below, scaleMax)) }
  }).filter((sg) => sg.to > sg.from)
  const scaleTicks = [0, ...CONSO_LEVELS.map((l) => l.below).filter((v) => v < scaleMax), scaleMax]

  // ── 3. Autonomie ──
  const V = totalVolumeL(s.V, s.bi)
  const autoMin = autonomyMin(V, s.P0, s.sac, s.d)
  const bottomLpm = bottomConsumptionLpm(s.sac, s.d)
  const autoVals = DEPTHS_M.map((m) => autonomyMin(V, s.P0, s.sac, m))

  // ── 4. Comparer ──
  const cmp = compareDepths(V, s.P0, s.sac, s.ka, s.kb)
  const abMax = Math.max(cmp.aMin, cmp.bMin)
  const myTank: Tank = { unitL: s.V, bi: s.bi }
  const tankList = compareTankList(myTank)
  const tankRows = tankList.map((t) => {
    const tv = totalVolumeL(t.unitL, t.bi)
    return { t, me: sameTank(t, myTank), a: autonomyMin(tv, s.P0, s.sac, s.ka), b: autonomyMin(tv, s.P0, s.sac, s.kb) }
  })
  const barsMax = Math.max(...tankRows.flatMap((r) => [r.a, r.b]))
  const heatDepths = heatTableDepths(s.ka, s.kb)
  const heat = heatTable(heatDepths, s.P0, s.sac)

  const tabLabel: Record<TabId, string> = labels.tabs
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = TAB_IDS[(TAB_IDS.indexOf(s.tab) + dir + TAB_IDS.length) % TAB_IDS.length]
    show(next)
    document.getElementById(`${baseId}-tab-${next}`)?.focus()
  }
  const panelProps = (tab: TabId) => ({
    id: `${baseId}-panel-${tab}`,
    role: 'tabpanel' as const,
    'aria-labelledby': `${baseId}-tab-${tab}`,
    hidden: s.tab !== tab,
    className: 'space-y-3 animate-fade-in',
  })
  const fieldsGrid = 'grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5'

  return (
    // Colonne flex : sur mobile, la barre d'onglets passe en dernier (order-last) et colle au bas de
    // l'écran (sticky) tant que l'outil est visible, puis s'arrête à la fin de l'outil sans couvrir le footer.
    <div ref={rootRef} className="flex flex-col">
      {/* ── Barre d'onglets : en bas sur mobile, en haut à partir de 760 px ── */}
      <div className="sticky bottom-0 z-40 order-last -mx-4 mt-4 border-t border-gray-200 bg-white/95 px-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl min-[760px]:static min-[760px]:order-first min-[760px]:mx-0 min-[760px]:mb-6 min-[760px]:mt-0 min-[760px]:border-0 min-[760px]:bg-transparent min-[760px]:p-0 min-[760px]:backdrop-blur-none">
        <div
          role="tablist"
          aria-label={labels.tablistAria}
          onKeyDown={onTabKey}
          className="mx-auto flex max-w-3xl gap-1 min-[760px]:rounded-2xl min-[760px]:border min-[760px]:border-gray-200 min-[760px]:bg-gray-50 min-[760px]:p-1.5"
        >
          {TAB_IDS.map((id) => {
            const active = s.tab === id
            return (
              <button
                key={id}
                id={`${baseId}-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`${baseId}-panel-${id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => show(id)}
                className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[11.5px] font-semibold transition-all duration-200 ease-out-expo min-[760px]:flex-row min-[760px]:gap-2 min-[760px]:py-2.5 min-[760px]:text-sm min-[760px]:font-medium ${
                  active
                    ? 'bg-primary-50 text-primary-600 min-[760px]:bg-white min-[760px]:text-black min-[760px]:shadow-lifted'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" className="h-6 w-6 min-[760px]:h-5 min-[760px]:w-5">
                  {TAB_ICONS[id]}
                </svg>
                {tabLabel[id]}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 1. PRESSION ── */}
      <section {...panelProps('pression')}>
        <Card title={labels.pressure.sacTitle}>
          <Stepper
            label={labels.pressure.sacTitle}
            value={s.sac}
            spec={FIELD_SPECS.sac}
            unit={u.lpm}
            fmt={fmt}
            decreaseLabel={labels.stepper.decrease}
            increaseLabel={labels.stepper.increase}
            onBump={(dir) => bump('sac', dir)}
            onSet={(v) => setNum('sac', v)}
          />
          <p className="mt-2 text-xs font-medium text-gray-500">
            <Rich
              text={labels.pressure.hint}
              slots={{
                link: (
                  <button type="button" onClick={() => show('conso')} className="font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700">
                    {labels.pressure.hintLink}
                  </button>
                ),
              }}
            />
          </p>
        </Card>

        <Card>
          <div className="grid grid-cols-[110px_1fr] items-start gap-3 sm:grid-cols-[150px_1fr] sm:gap-4">
            <WaterColumn depthM={s.d} ariaLabel={labels.pressure.columnAria} unitM={u.m} fmt={fmt} onDepth={(d) => setNum('d', d)} />
            <div aria-live="polite">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{fill(labels.pressure.kicker, { depth: s.d })}</p>
              <p key={p} className="tabular-nums text-[52px] font-bold leading-none tracking-tight text-primary animate-number-pop sm:text-[64px]">×{fmt.trim(p)}</p>
              <p className="mt-1 text-sm font-medium text-gray-500">{labels.pressure.multiplierNote}</p>
              <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                <Stat label={labels.pressure.statPressure} value={fmt.n(p, 1)} unit={u.bar} />
                <Stat label={labels.pressure.statConso} value={fmt.n(s.sac * p)} unit={u.lpm} />
                <Stat label={labels.pressure.statTank} value={fmt.n(shownMinutes(pressureTankMin))} unit={u.min} />
              </div>
              <div className="mt-3 flex items-end gap-2.5">
                {lungs.map(([lbl, x]) => (
                  <div key={lbl} className="flex-1 text-center text-[11px] font-medium text-gray-500">
                    <i
                      className="mx-auto mb-1 block w-8 rounded-t bg-primary"
                      style={{ height: `${70 / Math.max(1, p) * x}px`, opacity: x === 1 ? 0.35 : 0.9 }}
                    />
                    {lbl}
                    <br />
                    <b className="tabular-nums text-black">{fmt.n(s.sac * x)} {u.l}</b>/{u.min}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title={labels.pressure.trapTitle}>
          <DepthBars
            unitM={u.m}
            onPick={(d) => setNum('d', d)}
            items={DEPTHS_M.map((m) => ({
              depth: m,
              value: `×${fmt.trim(pressureAbsBar(m))}`,
              heightPct: pressureAbsBar(m) / 7 * 80,
              on: m <= s.d,
            }))}
          />
          <p className="mt-2.5 text-xs font-medium text-gray-500"><Rich text={labels.pressure.trapNote} /></p>
        </Card>
      </section>

      {/* ── 2. MA CONSO ── */}
      <section {...panelProps('conso')}>
        <Card title={labels.conso.title}>
          <div className={fieldsGrid}>
            <Field label={labels.tank.label} wide>{tankPicker('cV', 'cBi')}</Field>
            <Field label={labels.conso.startPressure} htmlFor={fieldId('cP0')}>{stepper('cP0', labels.conso.startPressure, u.bar)}</Field>
            <Field label={labels.conso.endPressure} htmlFor={fieldId('cP1')}>{stepper('cP1', labels.conso.endPressure, u.bar)}</Field>
            <Field label={labels.conso.duration} htmlFor={fieldId('cT')}>{stepper('cT', labels.conso.duration, u.min)}</Field>
            <Field label={labels.conso.avgDepth} htmlFor={fieldId('cD')}>{stepper('cD', labels.conso.avgDepth, u.m)}</Field>
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-live="polite">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{labels.conso.resultKicker}</p>
              <p className="flex items-baseline gap-1.5">
                <span key={conso.sacLpm} className="tabular-nums text-[40px] font-bold leading-none tracking-tight text-black animate-number-pop sm:text-[46px]">
                  {conso.valid ? fmt.n(conso.sacLpm, 1) : '–'}
                </span>
                <span className="text-base text-gray-400">{u.lpm}</span>
              </p>
            </div>
            {conso.valid && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${LEVEL_BADGE[level]}`}>
                <i aria-hidden="true" className={`h-2 w-2 rounded-full ${LEVEL_FILL[level]}`} />
                {labels.conso.levels[level]}
              </span>
            )}
          </div>

          {/* Jauge : de 0 à un maximum qui s'adapte à la valeur */}
          <div aria-hidden="true" className="relative mb-1.5 mt-7 h-3.5 rounded-full bg-gray-100">
            {segments.map((sg, i) => (
              <span
                key={sg.key}
                className={`absolute inset-y-0 ${LEVEL_FILL[sg.key]} ${i === 0 ? 'rounded-l-full' : ''} ${sg.to >= 100 ? 'rounded-r-full' : ''}`}
                style={{ left: `${sg.from}%`, width: `${sg.to - sg.from}%` }}
              />
            ))}
            <div
              className="absolute -top-2 h-[30px] w-1 -translate-x-1/2 rounded-sm bg-black ring-2 ring-white transition-[left] duration-300 ease-out-expo"
              style={{ left: `${pct(conso.valid ? conso.sacLpm : 0)}%` }}
            >
              {conso.valid && (
                <span className="absolute bottom-[34px] left-1/2 -translate-x-1/2 whitespace-nowrap tabular-nums text-xs font-bold text-black">
                  {fmt.n(conso.sacLpm, 1)}
                </span>
              )}
            </div>
          </div>
          {/* Graduations aux seuils du badge (12, 16, 20, 25 L/min) */}
          <div aria-hidden="true" className="relative h-4 tabular-nums text-[11px] font-medium text-gray-500">
            {scaleTicks.map((v, i) => (
              <span
                key={v}
                className={`absolute top-0 ${i === 0 ? '' : i === scaleTicks.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
                style={{ left: `${pct(v)}%` }}
              >
                {fmt.n(v)}
              </span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
            <Stat label={labels.conso.statUsed} value={fmt.n(conso.usedL)} unit={u.l} />
            <Stat label={labels.conso.statAvgPressure} value={fmt.n(conso.avgPressureBar, 1)} unit={u.bar} />
            <Stat label={labels.conso.statBottom} value={fmt.n(conso.rmvLpm, 1)} unit={u.lpm} />
          </div>

          {!conso.valid ? (
            <p role="alert" className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{labels.conso.errorEndPressure}</p>
          ) : s.cP1 < RESERVE_BAR ? (
            <p className="mt-2.5 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
              {fill(labels.conso.reserveWarning, { pressure: s.cP1 })}
            </p>
          ) : null}

          <button
            type="button"
            disabled={!conso.valid}
            onClick={() => {
              setNum('sac', roundSacForShare(conso.sacLpm))
              show('auto')
            }}
            className="mt-3.5 w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(18,132,199,0.3)] transition-all duration-200 ease-out-expo hover:bg-primary-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 sm:w-auto"
          >
            {labels.conso.useButton}
          </button>
        </Card>
      </section>

      {/* ── 3. AUTONOMIE ── */}
      <section {...panelProps('auto')}>
        <div className="flex gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" className="mt-px h-[22px] w-[22px] shrink-0 text-primary">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 11v6M12 7.5v.5" />
          </svg>
          <div>
            <p className="mb-0.5 font-semibold text-black">{labels.autonomy.infoTitle}</p>
            <p className="text-gray-500"><Rich text={labels.autonomy.infoText} /></p>
            <p className="mt-1.5 text-xs font-medium text-gray-500">{labels.autonomy.idealGasNote}</p>
          </div>
        </div>

        <Card title={labels.autonomy.depthTitle}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={MAX_DEPTH_M}
              step={1}
              value={s.d}
              aria-label={labels.autonomy.depthTitle}
              onChange={(e) => setNum('d', parseFloat(e.target.value))}
              className="flex-1"
              style={{ background: rangeFill(s.d, MAX_DEPTH_M, SIDE_HEX.A) }}
            />
            <p className="min-w-[78px] text-right tabular-nums text-2xl font-bold text-black">
              {s.d}<span className="font-sans text-sm font-normal text-gray-400"> {u.m}</span>
            </p>
          </div>
          <div className={`${fieldsGrid} mt-2.5`}>
            <Field label={labels.tank.label} wide>{tankPicker('V', 'bi')}</Field>
            <Field label={labels.autonomy.startPressure} htmlFor={fieldId('P0')}>{stepper('P0', labels.autonomy.startPressure, u.bar)}</Field>
            <Field label={labels.autonomy.sac} htmlFor={fieldId('sac')}>{stepper('sac', labels.autonomy.sac, u.lpm)}</Field>
          </div>
        </Card>

        <Card>
          <div aria-live="polite" className="grid items-center gap-4 sm:grid-cols-[220px_1fr]">
            <PressureGauge startBar={s.P0} minutes={autoMin} caption={fill(labels.autonomy.gaugeCaption, { depth: s.d })} fmt={fmt} />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
              <Stat label={labels.autonomy.statBottom} value={fmt.n(bottomLpm)} unit={u.lpm} />
              <Stat label={labels.autonomy.statBar} value={fmt.n(secondsPerBar(V, bottomLpm))} unit={u.s} />
              <Stat label={labels.autonomy.statRate} value={fmt.n(gaugeDropBarPerMin(V, bottomLpm), 1)} unit={u.barPerMin} />
            </div>
          </div>
        </Card>

        <Card title={labels.autonomy.barsTitle}>
          <DepthBars
            unitM={u.m}
            onPick={(d) => setNum('d', d)}
            items={DEPTHS_M.map((m, i) => ({
              depth: m,
              value: `${fmt.n(shownMinutes(autoVals[i]))}${labels.autonomy.minuteMark}`,
              heightPct: autoVals[i] / autoVals[0] * 80,
              on: m === s.d,
            }))}
          />
          <p className="mt-2 text-xs font-medium text-gray-500">{labels.autonomy.barsNote}</p>
        </Card>
      </section>

      {/* ── 4. COMPARER ── */}
      <section {...panelProps('comp')}>
        <Card title={labels.compare.settingsTitle}>
          <div className={fieldsGrid}>
            <Field label={labels.compare.sac} htmlFor={fieldId('sac', 'cmp-')}>{stepper('sac', labels.compare.sac, u.lpm, 'cmp-')}</Field>
            <Field label={labels.compare.startPressure} htmlFor={fieldId('P0', 'cmp-')}>{stepper('P0', labels.compare.startPressure, u.bar, 'cmp-')}</Field>
            <Field label={labels.tank.myTank} wide>{tankPicker('V', 'bi')}</Field>
          </div>
        </Card>

        <Card title={labels.compare.abTitle}>
          <div className="grid grid-cols-2 gap-3">
            {([
              { tag: 'A', key: 'ka', depth: s.ka, min: cmp.aMin, aria: labels.compare.depthA },
              { tag: 'B', key: 'kb', depth: s.kb, min: cmp.bMin, aria: labels.compare.depthB },
            ] as const).map((side) => (
              <div key={side.tag} className="rounded-2xl bg-gray-50 p-3 text-center">
                <p className="flex justify-center text-sm font-medium"><SideTag side={side.tag} /></p>
                <p className="tabular-nums text-3xl font-bold leading-tight text-black">
                  {side.depth}<span className="font-sans text-base font-normal text-gray-400"> {u.m}</span>
                </p>
                <input
                  type="range"
                  min={0}
                  max={MAX_DEPTH_M}
                  step={1}
                  value={side.depth}
                  aria-label={side.aria}
                  onChange={(e) => setNum(side.key, parseFloat(e.target.value))}
                  className="w-full"
                  style={{ background: rangeFill(side.depth, MAX_DEPTH_M, SIDE_HEX[side.tag]) }}
                />
                <div className="my-1.5 flex h-[150px] items-end justify-center">
                  <div
                    className={`w-16 rounded-b-md rounded-t-xl transition-[height] duration-300 ease-out-expo ${SIDE_BG[side.tag]}`}
                    style={{ height: `${side.min / abMax * 100}%` }}
                  />
                </div>
                <p className="tabular-nums text-[34px] font-bold leading-none text-black" aria-live="polite">
                  <span key={side.min} className="inline-block animate-number-pop">{fmt.n(shownMinutes(side.min))}</span>
                  <span className="font-sans text-sm font-normal text-gray-400"> {u.min}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center text-[15px] text-gray-700" aria-live="polite">
            {s.ka === s.kb ? (
              <span className="text-gray-500">{labels.compare.sameDepth}</span>
            ) : (
              <>
                <Rich text={fill(labels.compare.diff, { lo: cmp.loDepthM, hi: cmp.hiDepthM, diff: fmt.n(cmp.diffMin), ratio: fmt.trim(cmp.ratio) })} />
                <br />
                <span className="text-xs font-medium text-gray-500">
                  {fill(labels.compare.diffSub, { tank: tankName(myTank), pressure: s.P0, sac: fmt.n(s.sac, 1) })}
                </span>
              </>
            )}
          </div>
        </Card>

        <Card title={labels.compare.otherTanksTitle}>
          <div className="mb-2 flex flex-wrap gap-3 text-xs font-medium text-gray-500">
            <span><SideTag side="A" /> · {s.ka} {u.m}</span>
            <span><SideTag side="B" /> · {s.kb} {u.m}</span>
          </div>
          {tankRows.map((r) => (
            <div
              key={`${r.t.unitL}-${r.t.bi}`}
              className={`-mx-2 grid grid-cols-[64px_1fr] items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium ${r.me ? 'bg-primary-50' : ''}`}
            >
              <span className={`tabular-nums font-bold ${r.me ? 'text-primary-600' : 'text-gray-700'}`}>
                {tankName(r.t)}
                {r.me && <span className="sr-only"> ({labels.tank.myTank})</span>}
              </span>
              <div className="grid gap-0.5">
                {(['A', 'B'] as const).map((side) => {
                  const val = side === 'A' ? r.a : r.b
                  return (
                  <div key={side} className="flex items-center gap-2">
                    <span aria-hidden="true" className="w-2.5 text-[10px] font-bold text-gray-500">{side}</span>
                    <span className="h-3 flex-1 overflow-hidden rounded bg-gray-100">
                      <i className={`block h-full rounded transition-[width] duration-300 ease-out-expo ${SIDE_BG[side]}`} style={{ width: `${val / barsMax * 100}%` }} />
                    </span>
                    <b className="w-14 text-right tabular-nums text-[13px] font-medium text-black">{fmt.n(shownMinutes(val))} {u.min}</b>
                  </div>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>

        <Card title={labels.compare.tableTitle}>
          {/* Défilement horizontal si besoin, colonne des profondeurs collante à gauche */}
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-[3px] tabular-nums">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white" />
                  {TANK_PRESETS.map((t) => (
                    <th key={`${t.unitL}-${t.bi}`} scope="col" className="whitespace-nowrap p-0.5 font-sans text-[11px] font-semibold text-gray-500 sm:text-xs">
                      {tankName(t)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatDepths.map((d, ri) => {
                  const tag = d === s.ka ? 'A' : d === s.kb ? 'B' : null
                  return (
                    <tr key={d}>
                      <th scope="row" className={`sticky left-0 z-10 whitespace-nowrap bg-white py-0.5 pl-0 pr-1 text-left font-sans text-[11px] font-semibold sm:text-xs ${tag ? 'text-black' : 'text-gray-500'}`}>
                        {tag && <SideTag side={tag} className="mr-1 text-[11px] font-medium" />}
                        {d} {u.m}
                      </th>
                      {TANK_PRESETS.map((t, ci) => {
                        const cell = heat[ri][ci]
                        const sel = tag !== null && sameTank(t, myTank)
                        return (
                          <td
                            key={`${t.unitL}-${t.bi}`}
                            // Texte toujours noir : ≥ 5,6:1 même sur la case la plus foncée (primary à 85 %),
                            // alors que le blanc tombe sous 2:1 sur les cases moyennes.
                            className={`relative overflow-hidden rounded-lg px-px py-[7px] text-center text-[12.5px] font-bold text-black sm:px-0.5 sm:py-2 sm:text-sm ${
                              sel ? 'ring-2 ring-inset ring-black' : ''
                            }`}
                          >
                            <span aria-hidden="true" className="absolute inset-0 bg-primary" style={{ opacity: cell.alpha }} />
                            <span className="relative">{fmt.n(cell.minutes)}</span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

    </div>
  )
}
