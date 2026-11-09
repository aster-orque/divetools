'use client'

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import type { getDictionary } from '@/i18n/get-dictionary'
import {
  EPS,
  FIELD_SPECS,
  MIXES,
  STEP,
  STORAGE_KEY,
  TAB_IDS,
  TAB_STORAGE_KEY,
  TOL,
  analyse,
  analysisKey,
  bumpValue,
  computeBlend,
  defaultState,
  expectedAnalysisPct,
  gasCardKind,
  gasColor,
  gasFieldErrors,
  isCont,
  mod,
  nTanks,
  newGas,
  parseGasField,
  parseStepperInput,
  rampCount,
  sanitizeState,
  sanitizeTab,
  stockState,
} from '@/lib/gas-blender/engine'
import type {
  BlendGas,
  BlendState,
  FieldSpec,
  GasColor,
  GasInput,
  GasLabel,
  KoReason,
  NewGasKind,
  OkSolution,
  PlanView,
  StepperKey,
  Summary,
  TabId,
  Tile,
} from '@/lib/gas-blender/engine'

type Dict = Awaited<ReturnType<typeof getDictionary>>
/** Textes de l'outil : bloc `gasBlender` des dictionnaires fr/en. */
export type GasBlenderLabels = Dict['gasBlender']

// ── Constantes de présentation ─────────────────────────────────────────────────
/** Délai avant répétition (ms) puis intervalle de répétition (ms) en appui long sur − / +. */
const HOLD_DELAY_MS = 400
const HOLD_INTERVAL_MS = 70
/** Marge (px) laissée sous la navbar quand on remonte au haut de l'outil en changeant d'onglet. */
const TOOL_SCROLL_GAP_PX = 12

/** Couleurs des gaz (code usuel en station de gonflage, demandé par Maxime) : O2 vert, nitrox jaune,
 *  air bleu Orque (résiduel : gris hachuré). Le vert reste réservé à l'O2, jamais aux états « OK ». */
const GAS_BG: Record<GasColor, string> = { o2: 'bg-green-600', nx: 'bg-yellow-400', air: 'bg-primary' }
const GAS_FILL: Record<GasColor, string> = { o2: 'fill-green-600', nx: 'fill-yellow-400', air: 'fill-primary' }
const GAS_BORDER_L: Record<GasColor, string> = { o2: 'border-l-green-600', nx: 'border-l-yellow-400', air: 'border-l-primary' }

/** Niveaux d'état (tuiles, analyse) : OK en bleu Orque, ambre / rouge pour les alertes. */
type Level = 'ok' | 'mid' | 'low' | 'off'
const LEVEL_BORDER_L: Record<Level, string> = {
  ok: 'border-l-primary', mid: 'border-l-amber-500', low: 'border-l-red-600', off: 'border-l-gray-200',
}
const LEVEL_TEXT: Record<Level, string> = {
  ok: 'text-primary-600', mid: 'text-amber-700', low: 'text-red-700', off: 'text-gray-500',
}

const TAB_ICONS: Record<TabId, ReactNode> = {
  melange: <><rect x="7" y="6" width="10" height="16" rx="5" /><path d="M10 6V3h4v3M7 14h10" /></>,
  stocks: <><rect x="3" y="7" width="7" height="14" rx="3.5" /><rect x="14" y="7" width="7" height="14" rx="3.5" /><path d="M5.5 7V4h2v3M16.5 7V4h2v3M3 15h7M14 12h7" /></>,
  plan: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.5" /><circle cx="4.5" cy="12" r="1.5" /><circle cx="4.5" cy="18" r="1.5" /></>,
}

/** Hiérarchie typographique (reprise du modèle, en Poppins). */
const T = {
  /** Petit titre en capitales (kicker du plan, chips) */
  kicker: 'text-xs font-bold uppercase tracking-wider text-gray-500',
  /** Titre de bloc (« Tes blocs », « Plan de gonflage ») */
  sectionTitle: 'text-[17px] font-bold text-black',
  /** Unité à côté d'une grosse valeur */
  unit: 'text-[13px] font-semibold text-gray-500',
  /** Label d'un champ de saisie */
  fieldLabel: 'text-[14px] font-semibold leading-snug text-gray-700',
  /** Texte d'aide discret */
  help: 'text-[13px] font-medium leading-relaxed text-gray-500',
  small: 'text-xs font-medium text-gray-500',
} as const

const PRIMARY_SHADOW = 'shadow-[0_2px_8px_rgba(18,132,199,0.3)]'
const FOCUS_RING = 'focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(18,132,199,0.1)]'

// ── Formatage ──────────────────────────────────────────────────────────────────
/** Remplace {clé} par la valeur ; les clés inconnues restent. */
function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all))
}

type Fmt = {
  /** Entier arrondi (r0 de l'original) */
  r0: (x: number) => string
  /** Fraction → « 32,9 % » (pct de l'original) */
  pct: (x: number) => string
  /** Au dixième (fmt de l'original) */
  f1: (x: number) => string
  /** Valeur saisie affichée telle quelle (jusqu'à 2 décimales) */
  raw: (x: number) => string
}

function makeFmt(locale: string): Fmt {
  const int = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const one = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const two = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  const safe = (v: number) => (Number.isFinite(v) ? v : 0)
  return {
    r0: (x) => int.format(Math.round(safe(x))),
    pct: (x) => `${one.format(Math.round(safe(x) * 1000) / 10)}\u00a0%`,
    f1: (x) => one.format(Math.round(safe(x) * 10) / 10),
    raw: (x) => two.format(safe(x)),
  }
}

// ── Sous-composants ────────────────────────────────────────────────────────────
/** Rend **gras** et {slot} (nœud React) dans une chaîne de labels. */
function Rich({ text, slots, strongClass = 'font-semibold text-black' }: { text: string; slots?: Record<string, ReactNode>; strongClass?: string }) {
  const parts: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\{(\w+)\}/g
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1] !== undefined) parts.push(<strong key={i++} className={strongClass}>{m[1]}</strong>)
    else parts.push(<Fragment key={i++}>{slots?.[m[2]] ?? m[0]}</Fragment>)
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-soft sm:p-5 ${className}`}>{children}</div>
}

/** Rappel discret de la loi physique (petit texte gris). `**texte**` = gras. */
function LawNote({ title, text, className = '' }: { title: string; text: string; className?: string }) {
  return (
    <p className={`flex gap-2 rounded-xl bg-primary-50/60 px-3 py-2 text-[13px] font-medium leading-relaxed text-gray-600 ${className}`}>
      <span aria-hidden="true" className="font-bold text-primary">ⓘ</span>
      <span>
        <span className="font-semibold text-black">{title} </span>
        <Rich text={text} />
      </span>
    </p>
  )
}

/** Note d'avertissement (.note de l'original). */
function Note({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`rounded-lg bg-amber-50 px-3 py-1.5 text-[13px] font-medium leading-snug text-amber-800 ${className}`}>{children}</p>
}

/** État d'une étape numérotée : faite (pastille pleine), en cours (contour bleu), verrouillée (grise). */
type StepState = 'done' | 'todo' | 'locked'
type ChipTone = 'neutral' | 'ok' | 'mid' | 'low' | 'locked'
const CHIP_TONE: Record<ChipTone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  ok: 'bg-primary-50 text-primary-600',
  mid: 'bg-amber-50 text-amber-700',
  low: 'bg-red-50 text-red-700',
  locked: 'bg-gray-100 text-gray-500',
}

/** En-tête de section : numéro d'étape (optionnel), titre + phrase de contexte à côté, aide dessous. */
function SectionHead({ no, state = 'done', title, help, chip, tone = 'neutral' }: {
  no?: number; state?: StepState; title: string; help?: string; chip?: ReactNode; tone?: ChipTone
}) {
  const badge = state === 'done' ? 'bg-primary text-white'
    : state === 'todo' ? 'border-2 border-primary bg-white text-primary'
    : 'bg-gray-200 text-gray-500'
  return (
    <div className="mb-4 flex items-start gap-2.5">
      {no !== undefined && (
        <span className={`mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors duration-200 ${badge}`}>{no}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className={`${T.sectionTitle} ${state === 'locked' ? '!text-gray-500' : ''}`}>{title}</h2>
          {chip && <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${CHIP_TONE[tone]}`}>{chip}</span>}
        </div>
        {help && <p className={`mt-0.5 ${T.help}`}>{help}</p>}
      </div>
    </div>
  )
}

/** Contenu d'une section verrouillée : grisé et inactif tant que l'étape précédente n'est pas faite. */
function Lockable({ locked, children }: { locked: boolean; children: ReactNode }) {
  return (
    <div aria-disabled={locked || undefined} inert={locked || undefined}
      className={`transition-opacity duration-300 ${locked ? 'pointer-events-none select-none opacity-40 grayscale' : ''}`}>
      {children}
    </div>
  )
}

function Dot({ color, className = '' }: { color: GasColor; className?: string }) {
  return <i aria-hidden="true" className={`inline-block h-3 w-3 shrink-0 rounded-full ${GAS_BG[color]} ${className}`} />
}

/** Stepper − valeur + : appui long répété, saisie libre avec virgule, validée au blur ou sur Entrée. */
function Stepper({
  id, label, value, spec, unit, fmt, decreaseLabel, increaseLabel, onBump, onSet,
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

  const shown = fmt.f1(value)
  // Validation de la saisie : bornée (pas recalée sur le pas, comme l'original). Rien si le texte n'a pas changé.
  const commit = () => {
    if (draft !== null && draft !== shown) {
      const v = parseStepperInput(draft, spec)
      if (v !== null) onSet(v)
    }
    setDraft(null)
  }
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
  const btn = 'flex h-11 w-11 shrink-0 select-none touch-manipulation items-center justify-center rounded-full border border-gray-200 bg-white text-xl font-medium leading-none text-black shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary active:scale-95 active:border-primary active:bg-primary active:text-white'

  return (
    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 lg:w-full lg:justify-between">
      <button type="button" aria-label={`${decreaseLabel}, ${label}`} className={btn}
        onPointerDown={start(-1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={key(-1)}>
        −
      </button>
      <div className="flex w-[70px] min-w-0 shrink flex-col items-center leading-tight min-[380px]:w-[78px] lg:w-auto lg:flex-1">
        <input
          id={id}
          inputMode="decimal"
          aria-label={id ? undefined : label}
          value={draft ?? shown}
          onFocus={(e) => {
            setDraft(shown)
            e.currentTarget.select()
          }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          onBlur={commit}
          className="w-full min-w-0 max-w-[96px] border-b-2 border-transparent bg-transparent p-0 text-center text-[24px] font-extrabold leading-tight tracking-tight tabular-nums text-black outline-none transition-colors focus:border-primary"
        />
        <small className="whitespace-nowrap text-xs font-semibold leading-tight text-gray-500">{unit}</small>
      </div>
      <button type="button" aria-label={`${increaseLabel}, ${label}`} className={btn}
        onPointerDown={start(1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={key(1)}>
        +
      </button>
    </div>
  )
}

/** Case de saisie (.f de l'original) : label à gauche et stepper à droite ; en desktop, label au-dessus. */
function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className={`flex min-w-0 items-center justify-between gap-2 rounded-xl border border-transparent bg-gray-50 py-1.5 pl-3 pr-1.5 transition-all duration-200 ease-out-expo lg:flex-col lg:items-stretch lg:gap-1 lg:px-2.5 lg:pb-2 lg:pt-2 ${FOCUS_RING}`}>
      <label htmlFor={htmlFor} className={`block min-w-0 ${T.fieldLabel} lg:text-center lg:text-xs lg:font-semibold lg:text-gray-500`}>{label}</label>
      {children}
    </div>
  )
}

/** Bouton pilule (raccourcis, ajout de gaz, ouverture) : 44 px de haut. `on` = choix actif. */
function Pill({ onClick, children, on }: { onClick: () => void; children: ReactNode; on?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-11 rounded-full border px-3 py-1.5 text-[13px] font-semibold leading-tight transition-all duration-200 ease-out-expo active:scale-95 ${
        on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-black hover:border-primary hover:text-primary'
      }`}
    >
      {children}
    </button>
  )
}

/** Champ d'une carte gaz (.gf3 label de l'original) : petit label (unité comprise), valeur dessous. Appliqué à chaque frappe. */
function GasField({
  label, value, bad = false, placeholder, onValue,
}: {
  label: string
  value: number | ''
  bad?: boolean
  placeholder?: string
  onValue: (raw: string) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = value === '' ? '' : String(value)
  return (
    <label
      className={`flex min-w-0 flex-col items-center justify-between gap-0.5 rounded-lg border bg-gray-50 px-2 pb-1.5 pt-1.5 text-center transition-all duration-200 ease-out-expo ${
        bad ? 'border-red-600 bg-red-50' : `border-transparent ${FOCUS_RING}`
      }`}
    >
      <span className={`text-[11px] font-semibold leading-tight ${bad ? 'text-red-700' : 'text-gray-500'}`}>{label}</span>
      <input
        inputMode="decimal"
        aria-invalid={bad || undefined}
        placeholder={placeholder}
        value={draft ?? shown}
        onFocus={(e) => {
          setDraft(shown)
          e.currentTarget.select()
        }}
        onChange={(e) => {
          setDraft(e.target.value)
          onValue(e.target.value)
        }}
        onBlur={() => setDraft(null)}
        className="w-full min-w-0 border-0 bg-transparent p-0 text-center text-[19px] font-extrabold leading-tight tabular-nums text-black outline-none placeholder:text-gray-400"
      />
    </label>
  )
}

/** Mini-bloc des tuiles : niveau avant (pâle) et après (plein), échelle 300 bar ; ∞ pour un compresseur. */
function MiniTank({ color, before, after }: { color: GasColor; before: number | null; after: number | null }) {
  const clipId = `mt-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const top = 10
  const bot = 64
  const H = bot - top
  const y = (p: number) => bot - H * Math.min(p, 300) / 300
  return (
    <svg viewBox="0 0 30 66" aria-hidden="true" className="absolute right-3 top-3 w-[30px]">
      <rect x="11" y="1" width="8" height="7" rx="1.5" className="fill-gray-400" />
      <rect x="2" y={top} width="26" height={H} rx="11" className="fill-gray-100" />
      {before === null || after === null ? (
        <text x="15" y={top + H / 2 + 6} textAnchor="middle" fontSize="18" fontWeight="800" className={GAS_FILL[color]}>∞</text>
      ) : (
        <>
          <clipPath id={clipId}><rect x="2" y={top} width="26" height={H} rx="11" /></clipPath>
          <g clipPath={`url(#${clipId})`}>
            <rect x="2" y={y(before)} width="26" height={bot - y(before)} fillOpacity={0.3} className={GAS_FILL[color]} />
            <rect x="2" y={y(after)} width="26" height={bot - y(after)} className={GAS_FILL[color]} />
          </g>
        </>
      )}
      <rect x="2" y={top} width="26" height={H} rx="11" fill="none" strokeWidth="1.5" className="stroke-gray-300" />
    </svg>
  )
}

/** Hachures du résiduel (dessin et légende) : gris franc pour rester lisible. */
const HATCH_STYLE: CSSProperties = { backgroundImage: 'repeating-linear-gradient(45deg, #9ca3af 0 3px, #e5e7eb 3px 6px)' } // gray-400 / gray-200

/** Bloc dessiné : résiduel hachuré puis une couche numérotée par gaz ajouté, pressions à droite (tankSVG). */
function TankSvg({ view, fmt, aria }: { view: PlanView; fmt: Fmt; aria: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const { sol: s, p1, p2, bleed } = view
  const start = bleed ?? p1
  const max = Math.max(p2, p1, s.p)
  const top = 36
  const bot = 300
  const H = bot - top
  const x0 = 10
  const W = 80
  const y = (p: number) => bot - H * p / max
  const marks = [start, ...s.steps.map((st) => st.gauge)].filter((v, i, a) => v > 0 && a.indexOf(v) === i)
  const shownMarks: number[] = []
  let lastY = 1e9
  for (const m of marks.slice().reverse()) {
    const ym = y(m)
    if (Math.abs(ym - lastY) < 16) continue
    lastY = ym
    shownMarks.push(m)
  }
  return (
    <svg viewBox="0 0 150 306" role="img" aria-label={aria} className="block h-auto w-full">
      <defs>
        <clipPath id={`${id}c`}><rect x={x0} y={top} width={W} height={H} rx="32" /></clipPath>
        <pattern id={`${id}h`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="9" height="9" className="fill-gray-200" />
          <rect width="4" height="9" className="fill-gray-400" />
        </pattern>
        <linearGradient id={`${id}g`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".22" stopColor="#fff" stopOpacity=".3" />
          <stop offset=".42" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".1" />
        </linearGradient>
      </defs>
      {/* Robinet */}
      <rect x="30" y="2" width="40" height="8" rx="4" className="fill-gray-500" />
      <rect x="40" y="8" width="20" height="16" rx="3" className="fill-gray-500" />
      <rect x="44" y="22" width="12" height="16" className="fill-gray-400" />
      <g clipPath={`url(#${id}c)`}>
        <rect x={x0} y={top} width={W} height={H} className="fill-gray-50" />
        {start > 0 && <rect x={x0} y={y(start)} width={W} height={bot - y(start)} fill={`url(#${id}h)`} />}
        {s.steps.map((st, i) => {
          const y0 = y(st.gauge)
          const h = y(st.gauge - st.bar) - y0
          return (
            <g key={i}>
              <rect x={x0} y={y0} width={W} height={h} className={GAS_FILL[gasColor(st.gas.f)]} />
              <line x1={x0} x2={x0 + W} y1={y0} y2={y0} stroke="#fff" strokeOpacity=".85" strokeWidth="2" />
              {h >= 22 && (
                <>
                  <circle cx={x0 + W / 2} cy={y0 + h / 2} r="11" className="fill-white" />
                  <text x={x0 + W / 2} y={y0 + h / 2 + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" className="fill-black">
                    {i + 1 + (bleed !== null ? 1 : 0)}
                  </text>
                </>
              )}
            </g>
          )
        })}
        <rect x={x0} y={top} width={W} height={H} fill={`url(#${id}g)`} />
      </g>
      <rect x={x0} y={top} width={W} height={H} rx="32" fill="none" strokeWidth="2.5" className="stroke-gray-300" />
      {shownMarks.map((m) => {
        const ym = y(m)
        const big = m === s.p
        return (
          <g key={m}>
            <line x1={x0 + W + 3} x2={x0 + W + 12} y1={ym} y2={ym} strokeWidth="2" className={big ? 'stroke-black' : 'stroke-gray-400'} />
            <text x={x0 + W + 16} y={ym + 5} fontSize={big ? 16 : 14} fontWeight={big ? 800 : 700} className={`tabular-nums ${big ? 'fill-black' : 'fill-gray-500'}`}>
              {fmt.r0(m)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function GasBlender({ labels }: { labels: GasBlenderLabels }) {
  const L = labels
  const defaults = useMemo(() => defaultState(L.gases.defaults), [L.gases.defaults])
  const [s, setS] = useState<BlendState>(defaults)
  const [tab, setTab] = useState<TabId>('melange')
  const [loaded, setLoaded] = useState(false)
  const baseId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const fmt = useMemo(() => makeFmt(L.numberLocale), [L.numberLocale])

  // Hauteur de la navbar collante du site : la barre d'onglets (mobile) et la colonne de saisie (desktop) se collent dessous.
  const [headerH, setHeaderH] = useState(0)
  useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const update = () => setHeaderH(header.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])

  // Desktop : colonne de saisie « collante intelligente », sans défilement interne.
  // Elle défile avec la page ; si elle est plus haute que l'écran, elle se bloque quand son bas arrive
  // en bas de l'écran (en descendant) ou quand son haut réapparaît sous la navbar (en remontant).
  // Une seule barre de défilement : toutes les sections restent accessibles.
  const inRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = inRef.current
    if (!el) return
    const mq = window.matchMedia('(min-width: 1024px)')
    const GAP = 16
    let top = headerH + GAP
    let lastY = window.scrollY
    const apply = () => {
      if (!mq.matches) { el.style.top = ''; return }
      const max = headerH + GAP
      const min = Math.min(max, window.innerHeight - el.offsetHeight - GAP)
      const y = window.scrollY
      top = Math.max(min, Math.min(max, top - (y - lastY)))
      lastY = y
      el.style.top = `${top}px`
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    window.addEventListener('scroll', apply, { passive: true })
    window.addEventListener('resize', apply)
    mq.addEventListener('change', apply)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
      mq.removeEventListener('change', apply)
    }
  }, [headerH])

  // Lecture des saisies mémorisées (après montage, pour éviter un écart d'hydratation).
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = sanitizeState(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null'), defaults)
      if (saved) setS(saved)
      setTab(sanitizeTab(window.localStorage.getItem(TAB_STORAGE_KEY)))
    } catch {
      /* stockage indisponible ou JSON invalide : valeurs par défaut */
    }
    setLoaded(true)
  }, [defaults])

  // Sauvegarde à chaque changement.
  useEffect(() => {
    if (!loaded || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
      window.localStorage.setItem(TAB_STORAGE_KEY, tab)
    } catch {
      /* stockage plein ou bloqué */
    }
  }, [s, tab, loaded])

  // ── Mises à jour de l'état ──
  type MainKey = Exclude<StepperKey, 'ana'>
  const bump = useCallback((k: MainKey, dir: -1 | 1) => {
    setS((prev) => ({ ...prev, [k]: bumpValue(prev[k], dir, FIELD_SPECS[k]) }))
  }, [])
  const setNum = useCallback((k: MainKey, v: number) => setS((prev) => ({ ...prev, [k]: v })), [])
  const updateGas = useCallback((i: number, patch: Partial<GasInput>) => {
    setS((prev) => ({ ...prev, gases: prev.gases.map((g, j) => (j === i ? { ...g, ...patch } : g)) }))
  }, [])
  const removeGas = (i: number) => setS((prev) => ({ ...prev, gases: prev.gases.filter((_, j) => j !== i) }))
  const addGas = (kind: NewGasKind) => setS((prev) => ({ ...prev, gases: [...prev.gases, newGas(kind, L.gases.defaults[kind])] }))

  const show = useCallback((next: TabId) => {
    setTab(next)
    // Remonte au haut de l'outil (sous la navbar collante) seulement s'il est sorti de l'écran.
    const root = rootRef.current
    if (!root) return
    const h = document.querySelector('header')?.getBoundingClientRect().height ?? 0
    const top = root.getBoundingClientRect().top - h - TOOL_SCROLL_GAP_PX
    if (top < 0) window.scrollBy({ top })
  }, [])

  // ── Calcul ──
  const out = useMemo(() => computeBlend(s), [s])
  const nb = rampCount(s.nb)
  const ramp = nb > 1
  const chosen = out.status === 'computed' ? out.chosen : null
  const targetF = out.status === 'computed' ? out.f2 : 0

  // Analyse : le % saisi repart du % attendu dès que le gonflage demandé change.
  const aKey = analysisKey(s)
  const expectedAna = chosen ? expectedAnalysisPct(chosen) : 0
  const anaValue = s.anaKey === aKey && typeof s.ana === 'number' ? s.ana : expectedAna
  const analysis = useMemo(
    () => (out.status === 'computed' && out.chosen ? analyse(out.gases, out.V, out.f2, out.chosen.p, anaValue) : null),
    [out, anaValue],
  )
  const bumpAna = (dir: -1 | 1) => setS((prev) => {
    const cur = prev.anaKey === aKey && typeof prev.ana === 'number' ? prev.ana : expectedAna
    return { ...prev, ana: bumpValue(cur, dir, FIELD_SPECS.ana), anaKey: aKey }
  })
  const setAna = (v: number) => setS((prev) => ({ ...prev, ana: v, anaKey: aKey }))

  // ── Parcours progressif : 1-3 saisies → 4 gonflage (étapes à cocher) → 5 analyse ──
  const mainView: PlanView | null = out.status !== 'computed' ? null
    : out.main.kind === 'plan' ? out.main.plan : out.main.best?.plan ?? null
  const stepCount = mainView ? mainView.sol.steps.length + (mainView.bleed !== null ? 1 : 0) : 0
  // Les coches repartent de zéro dès que le plan change.
  const planSig = mainView ? `${mainView.bleed ?? ''}|${mainView.sol.steps.map((st) => `${st.gas.id}:${st.gauge}`).join(',')}` : ''
  const [progress, setProgress] = useState<{ sig: string; done: number[]; unlocked: boolean }>({ sig: '', done: [], unlocked: false })
  const cur = progress.sig === planSig ? progress : { sig: planSig, done: [], unlocked: false }
  const doneSteps = cur.done
  const toggleStep = (n: number) => setProgress(() => {
    const done = cur.done.includes(n) ? cur.done.filter((x) => x !== n) : [...cur.done, n]
    return { sig: planSig, done, unlocked: cur.unlocked || done.length >= stepCount }
  })
  const unlockAnalysis = () => setProgress({ sig: planSig, done: cur.done, unlocked: true })
  const allDone = stepCount > 0 && doneSteps.length >= stepCount
  const anaUnlocked = cur.unlocked || allDone
  const anaTouched = s.anaKey === aKey

  const errs = out.status === 'error' ? out.errors : []
  const ok1 = s.vol > 0 && s.p1 >= 0 && s.f1 >= 0 && s.f1 <= 100
  const ok2 = s.p2 > 0 && s.f2 >= 0 && s.f2 <= 100
  const ok3 = !errs.includes('noGas') && !s.gases.some((g) => Object.values(gasFieldErrors(g)).some(Boolean))
  const planLocked = out.status === 'error'

  // ── Formatage des noms ──
  const gasName = (l: GasLabel) => {
    const base = (l.name || fill(L.gases.unnamed, { f: fmt.raw(l.fPct) })) + (l.times ? ` ×${l.times}` : '')
    return l.seq ? fill(L.gases.numbered, { name: base, n: l.seq }) : base
  }
  const withPct = (g: BlendGas) => fill(L.gases.withPct, { name: gasName(g.label), f: fmt.raw(Math.round(g.f * 1000) / 10) })
  const titleOf = (gases: BlendGas[]) => gases.map((g) => gasName(g.label)).join(L.plan.join)
  const again = (k: number) => {
    const n = k >= 20 ? '20+' : k
    if (k === 0) return ramp ? L.stocks.again0Ramp : L.stocks.again0Block
    return ramp
      ? fill(k > 1 ? L.stocks.againRampN : L.stocks.againRamp1, { n, nb })
      : fill(k > 1 ? L.stocks.againBlockN : L.stocks.againBlock1, { n })
  }
  const koReason = (r: KoReason) => {
    switch (r.kind) {
      case 'alreadyAbove': return L.rejected.alreadyAbove
      case 'notRichEnough': return L.rejected.notRichEnough
      case 'tooRich': return fill(L.rejected.tooRich, { mix: fmt.pct(r.maxF) })
      case 'gapTooSmall': return L.rejected.gapTooSmall
      case 'blocked': {
        const i = r.info
        return i.kind === 'buffer'
          ? fill(L.rejected.bufferShort, { name: gasName(i.name), req: fmt.r0(i.requiredBar), where: i.plural ? L.rejected.whereMany : L.rejected.whereOne, has: fmt.r0(i.hasBar) })
          : fill(L.rejected.continuousShort, { name: gasName(i.name), max: fmt.raw(i.maxBar), need: fmt.r0(i.needBar) })
      }
    }
  }

  // ── Résumé pour la carte « Voir le plan » et les pastilles d'onglets ──
  type Go = { txt: string; bad: boolean; badge: string; sub?: string }
  let go: Go
  if (out.status === 'error') go = { txt: L.cta.incomplete, bad: true, badge: '!' }
  else if (out.status === 'nothing') go = { txt: L.cta.nothing, bad: false, badge: '✓' }
  else if (!out.chosen) go = { txt: L.cta.none, bad: true, badge: '!' }
  else {
    const c = out.chosen
    const steps = fill(c.steps.length > 1 ? L.cta.stepsN : L.cta.steps1, { n: c.steps.length })
    go = {
      txt: fill(L.cta.result, { p: fmt.r0(c.p), mix: fmt.pct(c.mix) }),
      bad: out.mode === 'reduced',
      badge: fmt.pct(c.mix).replace(/\s/g, ''),
      sub: fill(out.mode === 'bleed' ? L.cta.subBleed : L.cta.sub, { steps }) + (out.mode === 'reduced' ? L.cta.reduced : ''),
    }
  }
  const tiles = out.status === 'computed' ? out.tiles : []
  const stockBadge: Level | null = tiles.some((t) => t.level === 'low') ? 'low' : tiles.some((t) => t.level === 'mid') ? 'mid' : null

  // ── Onglets mobiles ──
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = TAB_IDS[(TAB_IDS.indexOf(tab) + dir + TAB_IDS.length) % TAB_IDS.length]
    show(next)
    document.getElementById(`${baseId}-tab-${next}`)?.focus()
  }
  /** Section visible sur mobile seulement dans son onglet ; toujours visible en desktop. */
  const vis = (t: TabId) => (tab === t ? 'max-lg:animate-fade-in' : 'max-lg:hidden')

  const fieldId = (k: StepperKey) => `${baseId}-${k}`
  const stepper = (k: MainKey, label: string, unit: string) => (
    <Field label={label} htmlFor={fieldId(k)}>
      <Stepper
        id={fieldId(k)}
        label={label}
        value={s[k]}
        spec={FIELD_SPECS[k]}
        unit={unit}
        fmt={fmt}
        decreaseLabel={L.stepper.decrease}
        increaseLabel={L.stepper.increase}
        onBump={(dir) => bump(k, dir)}
        onSet={(v) => setNum(k, v)}
      />
    </Field>
  )
  // Cases de saisie (comme le modèle) : lignes sur mobile/tablette, 2 colonnes label au-dessus en desktop.
  const fieldsGrid = 'grid grid-cols-[minmax(0,1fr)] gap-1.5 lg:grid-cols-2 lg:gap-2'

  // ── Rendus de résultat ──
  const compBar = (sol: OkSolution) => {
    const o = Math.round(sol.mix * 1000) / 10
    return (
      <div className="mt-3">
        <div className="flex h-6 overflow-hidden rounded-md text-xs font-bold">
          <i className="flex items-center overflow-hidden whitespace-nowrap bg-green-700 px-2 not-italic text-white" style={{ width: `${o}%` }}>
            {fill(L.plan.compO2, { v: fmt.f1(o) })}
          </i>
          <i className="flex flex-1 items-center justify-end overflow-hidden whitespace-nowrap bg-gray-200 px-2 not-italic text-black">
            {fill(L.plan.compN2, { v: fmt.f1(100 - o) })}
          </i>
        </div>
        <p className={`mt-1 ${T.small}`}>{ramp ? L.plan.compCaptionRamp : L.plan.compCaption}</p>
      </div>
    )
  }

  const legend = (view: PlanView) => {
    const start = view.bleed ?? view.p1
    const sw = 'inline-block h-3 w-3 shrink-0 rounded-[3px]'
    return (
      <div className="flex flex-col gap-1 text-xs font-semibold text-gray-600 sm:mt-2">
        {ramp && <span className="font-bold text-black">{fill(L.plan.legendRamp, { n: nb })}</span>}
        {start > 0 && (
          <span className="flex items-center gap-1.5">
            <i aria-hidden="true" className={sw} style={HATCH_STYLE} />
            {L.plan.legendResidual}
          </span>
        )}
        {view.sol.steps.map((st, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <i aria-hidden="true" className={`${sw} ${GAS_BG[gasColor(st.gas.f)]}`} />
            {gasName(st.gas.label)}
          </span>
        ))}
      </div>
    )
  }

  /** Étapes : lignes séparées par un filet (.step de l'original). */
  const stepsList = (view: PlanView, checkable = false) => {
    let i = 0
    const row = 'flex items-center gap-3 border-t border-gray-200 py-3'
    const numBase = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold'
    /** Numéro d'étape ; sur le plan principal, on le touche pour cocher l'étape une fois faite. */
    const numEl = (n: number) => {
      if (!checkable) return <span className={`${numBase} bg-gray-100 text-black`}>{n}</span>
      const done = doneSteps.includes(n)
      return (
        <button
          type="button"
          aria-pressed={done}
          aria-label={fill(done ? L.flow.stepUncheck : L.flow.stepCheck, { n })}
          onClick={() => toggleStep(n)}
          className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        >
          <span className={`${numBase} transition-all duration-200 ease-out-expo ${done ? 'bg-primary text-white' : 'border-2 border-primary bg-white text-primary hover:bg-primary-50'}`}>
            {done ? '✓' : n}
          </span>
        </button>
      )
    }
    const to = (small: string, value: string) => (
      <div className="shrink-0 text-right">
        <small className="block text-[11px] font-semibold leading-tight text-gray-500">{small}</small>
        <b key={value} className="inline-block animate-number-pop whitespace-nowrap tabular-nums text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-primary">
          {value} <span className="text-[13px] font-semibold tracking-normal text-gray-500">{L.units.bar}</span>
        </b>
      </div>
    )
    return (
      <ol>
        {view.bleed !== null && (
          <li className={row}>
            {numEl(++i)}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold leading-snug text-black">{ramp ? L.plan.bleedRamp : L.plan.bleedBlock}</p>
              <p className={`mt-0.5 ${T.small}`}>{L.plan.bleedMeta}</p>
            </div>
            {to(L.plan.upTo, fmt.raw(view.bleed))}
          </li>
        )}
        {view.sol.steps.map((st, k) => {
          const tight = st.rest !== null && st.rest - st.gauge < STEP
          const members = st.gas.members
          return (
            <li key={k} className={`${row} ${checkable && doneSteps.includes(i + 1) ? 'opacity-60' : ''}`}>
              {numEl(++i)}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[15px] font-bold leading-snug text-black"><Dot color={gasColor(st.gas.f)} />{withPct(st.gas)}</p>
                <p className={`mt-0.5 tabular-nums ${T.small}`}>
                  {fill(L.plan.stepMeta, { bar: fmt.r0(st.bar), mix: fmt.pct(st.mix) })}
                  {st.rest !== null && fill(L.plan.stepRest, { rest: fmt.r0(st.rest) })}
                  {st.used.length > 1 && members && (
                    <>
                      <br />
                      {fill(L.plan.cascade, {
                        list: st.used.map((u) => fill(L.plan.cascadeItem, { name: gasName(members[u].label), p: fmt.raw(members[u].pmax) })).join(L.plan.cascadeSep),
                      })}
                    </>
                  )}
                </p>
                {tight && <Note className="mt-1.5">{fill(L.plan.tight, { p: fmt.r0(st.gauge) })}</Note>}
              </div>
              {to(L.plan.fillUpTo, fmt.r0(st.gauge))}
            </li>
          )
        })}
      </ol>
    )
  }

  const notes = (sol: OkSolution) => {
    const n: string[] = []
    if (sol.dev > TOL) n.push(L.plan.noteDev)
    if (sol.o2 > EPS) n.push(L.plan.noteO2)
    if (sol.steps.length) n.push(L.plan.noteSlow)
    return n.length ? <div className="mt-2.5 grid gap-1.5">{n.map((x) => <Note key={x}>{x}</Note>)}</div> : null
  }

  /** Bloc dessiné + légende à gauche (côte à côte sur mobile), étapes à droite (.plangrid de l'original). */
  const planGrid = (view: PlanView, checkable = false) => (
    <div className="mt-3 grid gap-1.5 sm:grid-cols-[124px_minmax(0,1fr)] sm:items-start sm:gap-4">
      <div className="flex items-center justify-center gap-4 sm:block">
        <div className="w-[118px] sm:w-full"><TankSvg view={view} fmt={fmt} aria={L.plan.tankAria} /></div>
        {legend(view)}
      </div>
      <div className="min-w-0">
        {checkable && <p className={`mb-1 ${T.small}`}>{L.flow.stepTip}</p>}
        {stepsList(view, checkable)}
      </div>
    </div>
  )

  const planCard = (view: PlanView) => {
    const sol = view.sol
    const good = view.good
    const title = view.bleed === null ? titleOf(sol.gases) : sol.steps.length ? fill(L.plan.titleBleed, { title: titleOf(sol.gases) }) : L.plan.titleBleedOnly
    return (
      <div className={`rounded-xl border p-3.5 sm:p-4 ${good ? 'border-primary' : 'border-2 border-amber-500'}`}>
        {/* En-tête : kicker + titre à gauche, % obtenu à droite (.planhead / .result de l'original) */}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <div className="min-w-0">
            <p className={`text-xs font-bold uppercase tracking-wider ${good ? 'text-primary' : 'text-amber-700'}`}>{good ? L.plan.kickerGood : L.plan.kickerOff}</p>
            <p className="mt-0.5 text-base font-bold text-black">{title}</p>
          </div>
          <div className="ml-auto text-right">
            <p key={sol.mix} className={`animate-number-pop tabular-nums text-[36px] font-extrabold leading-none tracking-[-0.02em] ${good ? 'text-black' : 'text-amber-700'}`}>
              {fmt.pct(sol.mix)}
            </p>
            <p className={`mt-1 tabular-nums ${T.small}`}>
              {fill(L.plan.target, { p: fmt.r0(sol.p), target: fmt.pct(targetF) })}{good ? ' ✓' : ''}
            </p>
            <p className={`tabular-nums ${T.small}`}><Rich text={fill(L.plan.modLine, { mod: mod(sol.mix, 1.4) })} /></p>
          </div>
        </div>
        {compBar(sol)}
        {planGrid(view, true)}
        {notes(sol)}
        <LawNote className="mt-3" title={L.laws.daltonTitle} text={L.laws.dalton} />
      </div>
    )
  }
  const tileCard = (t: Tile) => {
    const g = t.gas
    const color = gasColor(g.f)
    const members = g.members
    const lines: ReactNode[] = []
    const to = ramp ? L.stocks.toEach : L.stocks.toBlock
    if (t.gives) {
      lines.push(<Rich key="gives" text={t.gives.gauge === null
        ? fill(L.stocks.givesContinuous, { bar: fmt.r0(t.gives.bar), to, max: fmt.raw(t.gives.max ?? 0) })
        : fill(L.stocks.givesBuffer, { bar: fmt.r0(t.gives.bar), to, gauge: fmt.r0(t.gives.gauge) })} />)
    }
    if (t.members && members) {
      t.members.forEach(({ member: m, after }, i) => {
        const who = members.length > 1 ? gasName(m.label) : m.k > 1 ? fill(L.stocks.memberEnsemble, { k: m.k }) : L.stocks.memberSingle
        lines.push(<Rich key={`m${i}`} text={fill(L.stocks.memberLine, { who, before: fmt.raw(m.pmax), after: fmt.r0(after) })} />)
      })
    }
    if (t.cascade) lines.push(fill(L.stocks.cascade, { list: t.cascade.map((m) => gasName(m.label)).join(L.plan.cascadeSep) }))
    if (t.again !== null) lines.push(again(t.again))
    if (t.shortage) {
      const sh = t.shortage
      lines.push(<Rich key="short" text={sh.multi
        ? fill(L.stocks.shortageMulti, { name: gasName(sh.who), has: fmt.r0(sh.has), req: fmt.r0(sh.req) })
        : fill(L.stocks.shortageSingle, { has: fmt.r0(sh.has), req: fmt.r0(sh.req) })} />)
      lines.push(fill(L.stocks.shortageLimit, { limit: fmt.r0(sh.limit), need: fmt.r0(sh.need) }))
    }
    if (t.status === 'unused') {
      if (members) {
        members.forEach((m) => lines.push(members.length > 1
          ? fill(L.stocks.unusedMulti, { name: gasName(m.label), p: fmt.raw(m.pmax), vol: fmt.raw(m.vol) })
          : m.k > 1
            ? fill(L.stocks.unusedEnsemble, { k: m.k, p: fmt.raw(m.pmax), unit: fmt.raw(m.unit) })
            : fill(L.stocks.unusedSingle, { p: fmt.raw(m.pmax), vol: fmt.raw(m.vol) })))
      } else lines.push(fill(L.stocks.unusedComp, { p: fmt.raw(g.pmax) }))
    }
    const status = t.status === 'enoughFor' ? fill(L.stocks.status.enoughFor, { p: fmt.raw(out.status === 'computed' ? out.pfin : 0) }) : L.stocks.status[t.status]
    return (
      <div
        key={g.id}
        className={`relative grid min-h-[96px] content-start gap-1 rounded-xl border-l-[5px] py-3 pl-3.5 pr-3 ${LEVEL_BORDER_L[t.level]} ${t.level === 'low' ? 'bg-red-50/70' : 'bg-gray-50'}`}
      >
        <MiniTank color={color} before={t.icon.before} after={t.icon.after} />
        <h3 className="flex items-center gap-1.5 pr-10 text-[15px] font-bold text-black">
          <Dot color={color} />
          <span className="min-w-0">{gasName(g.label)}</span>
          <small className="whitespace-nowrap text-[13px] font-semibold text-gray-500">{fmt.raw(Math.round(g.f * 1000) / 10)} %</small>
        </h3>
        <p className={`pr-10 font-extrabold leading-tight ${LEVEL_TEXT[t.level]} ${t.level === 'off' ? 'text-base' : 'text-[24px]'}`}>
          {t.level === 'low' && <span aria-hidden="true">⚠ </span>}{status}
        </p>
        {lines.map((l, i) => (
          <p key={i} className="pr-8 text-[13px] font-medium tabular-nums leading-snug text-gray-500 [&_strong]:font-bold [&_strong]:text-black">{l}</p>
        ))}
        {t.missing && (
          <p className="text-[13px] font-semibold tabular-nums text-red-700">
            {fill(t.missing.reduced ? L.stocks.missingReduced : L.stocks.missingBleed, { p: fmt.r0(t.missing.p2), req: fmt.r0(t.missing.req) })}
          </p>
        )}
      </div>
    )
  }

  /** Stock des tampons d'une autre option (stockHTML de l'original). */
  const altStock = (sol: OkSolution, V: number) => {
    const tanks = sol.steps.filter((st) => st.rest !== null)
    if (!tanks.length) return null
    return (
      <div className="mt-3 border-t border-gray-200 pt-3">
        <h4 className={T.kicker + ' mb-1.5'}>{L.stocks.altTitle}</h4>
        {tanks.map((st, i) => {
          const st8 = stockState(st, V)
          const before = st.gas.pmax
          const rest = st.rest ?? 0
          const scale = Math.max(300, before) // jauge sur 300 bar
          const color = gasColor(st.gas.f)
          const pill = st8.level === 'ok' ? L.stocks.pillOk : L.stocks.status[st8.level]
          return (
            <div key={i} className="grid grid-cols-[1fr_auto] items-center gap-x-2.5 gap-y-1 py-1.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-black"><Dot color={color} />{gasName(st.gas.label)}</span>
              <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${st8.cls === 'ok' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-700'}`}>{pill}</span>
              <span className="col-span-2 flex h-2.5 overflow-hidden rounded-full bg-gray-100">
                <i className={`block h-full ${GAS_BG[color]}`} style={{ width: `${rest / scale * 100}%` }} />
                <i className={`block h-full opacity-[.35] ${GAS_BG[color]}`} style={{ width: `${(before - rest) / scale * 100}%` }} />
              </span>
              <span className={`col-span-2 tabular-nums ${T.small}`}>
                {fill(L.stocks.altLine, { before: fmt.raw(before), after: fmt.r0(rest), again: again(st8.k).toLocaleLowerCase(L.numberLocale) })}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  const summaryChips = (sm: Summary) => {
    const chip = (key: string, label: string, value: string, unit: string | null, sub: ReactNode, warn = false) => (
      <div key={key} className={`flex flex-col items-center gap-1 rounded-xl px-3.5 py-3 text-center ${warn ? 'border border-red-600 bg-red-50/60' : 'bg-gray-50'}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-wide ${warn ? 'text-red-700' : 'text-gray-500'}`}>{label}</p>
        <b key={value} className={`animate-number-pop whitespace-nowrap tabular-nums text-[28px] font-extrabold leading-none tracking-[-0.02em] ${warn ? 'text-red-700' : 'text-black'}`}>
          {value}{unit && <span className={`ml-1 ${T.unit} tracking-normal`}>{unit}</span>}
        </b>
        <p className="text-xs font-medium leading-snug text-gray-500">{sub}</p>
      </div>
    )
    const u = L.units
    const items: ReactNode[] = []
    if (sm.bleed) {
      items.push(chip('bleed', L.summary.bleed, fmt.r0(sm.bleed.to), u.bar,
        fill(sm.bleed.thenAdd ? L.summary.bleedThen : L.summary.bleedOnly, { d: fmt.r0(sm.bleed.drop) })))
    }
    if (sm.add?.kind === 'plan') {
      items.push(chip('add', L.summary.add, `+${fmt.r0(sm.add.bar)}`, u.bar,
        (ramp ? L.summary.addPerBlock : '') + (sm.add.o2Bar !== null ? fill(L.summary.addWithO2, { o2: fmt.r0(sm.add.o2Bar) }) : L.summary.addNoO2)))
    } else if (sm.add?.kind === 'total') {
      items.push(chip('add', L.summary.add, `+${fmt.r0(sm.add.bar)}`, u.bar, L.summary.addTotal))
    }
    if (sm.litres) {
      items.push(chip('litres', fill(L.summary.litres, { n: nb }), `≈ ${fmt.r0(sm.litres.total)}`, u.l,
        sm.litres.perGas.map((x) => fill(L.summary.litresItem, { name: gasName(x.gas.label), l: fmt.r0(x.litres) })).join(L.summary.sep)))
    }
    if (sm.drain !== null) items.push(chip('drain', L.summary.drain, fmt.r0(sm.drain), u.bar, L.summary.drainSub))
    items.push(chip('mod', L.summary.mod, String(sm.mod.mod14), u.m,
      fill(L.summary.modSub, { m16: sm.mod.mod16 }) + (sm.mod.expectedDiffers ? fill(L.summary.modExpected, { mix: fmt.pct(sm.mod.f) }) : '')))
    if (sm.o2Alert) items.push(chip('alert', `⚠ ${L.summary.alert}`, L.summary.alertValue, null, L.summary.alertSub, true))
    return <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">{items}</div>
  }

  const summary = out.status === 'error' ? null : out.summary

  /** Carte « Voir le plan » qui termine les onglets de saisie (mobile seulement). */
  const cta = (t: TabId, order: string) => (
    <div className={`flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-soft lg:hidden ${order} ${go.bad ? 'border-2 border-red-600' : 'border border-gray-200'} ${vis(t)}`}>
      <div className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-gray-500">
        {go.sub ?? L.cta.defaultSub}
        <b className="block tabular-nums text-[17px] font-extrabold leading-tight text-black min-[380px]:text-lg">{go.txt}</b>
      </div>
      <button
        type="button"
        onClick={() => show('plan')}
        className={`min-h-12 whitespace-nowrap rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-all duration-200 ease-out-expo hover:bg-primary-600 active:scale-95 ${PRIMARY_SHADOW}`}
      >
        {L.cta.button}
      </button>
    </div>
  )

  const detailsBox = 'group rounded-xl border border-gray-200 bg-white'
  const summaryRow = 'flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 marker:hidden [&::-webkit-details-marker]:hidden'
  const chevron = <span aria-hidden className="text-gray-500 transition-transform duration-200 group-open:rotate-180">⌄</span>
  const mixPresetMod = (m: number) => Math.floor((1.4 / (m / 100) - 1) * 10)

  return (
    <div ref={rootRef} className="flex flex-col">
      {/* ── Barre d'onglets mobile : en haut, collée sous la navbar ── */}
      <div
        style={{ top: headerH }}
        className="sticky z-40 -mx-4 mb-4 border-b border-gray-200 bg-white/95 px-1.5 py-1.5 backdrop-blur-xl lg:hidden"
      >
        <div role="tablist" aria-label={L.tablistAria} onKeyDown={onTabKey} className="mx-auto flex max-w-3xl gap-1">
          {TAB_IDS.map((id) => {
            const active = tab === id
            const badge = id === 'plan' ? { txt: go.badge, cls: go.bad ? 'bg-red-600' : 'bg-primary' }
              : id === 'stocks' && stockBadge ? { txt: '!', cls: stockBadge === 'low' ? 'bg-red-600' : 'bg-amber-500' } : null
            return (
              <button
                key={id}
                id={`${baseId}-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => show(id)}
                className={`relative flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[12.5px] font-semibold transition-all duration-200 ease-out-expo ${
                  active ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-black'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
                  {TAB_ICONS[id]}
                </svg>
                {L.tabs[id]}
                {badge && badge.txt && (
                  <span className={`absolute left-[calc(50%+8px)] top-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none tabular-nums text-white ${badge.cls}`}>
                    {badge.txt}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* ── Colonne saisies (mobile : sections réparties dans les onglets) ──
            Desktop : suit le défilement de la page (position calculée par inRef), sans barre de défilement propre. */}
        <div ref={inRef} className="contents lg:sticky lg:flex lg:flex-col lg:gap-6">
          {/* 1. Tes blocs */}
          <section className={`order-1 lg:order-none ${vis('melange')}`}>
            <Card>
              <SectionHead no={1} state={ok1 ? 'done' : 'todo'} title={L.tank.title} help={L.tank.help}
                chip={fill(ramp ? L.flow.tankChipRamp : L.flow.tankChip, { n: nb, vol: fmt.raw(s.vol), p: fmt.raw(s.p1), f: fmt.raw(s.f1) })} />
              <div className={fieldsGrid}>
                {stepper('vol', L.tank.volume, L.units.litres)}
                {stepper('nb', L.tank.count, L.units.blocks)}
                {stepper('p1', L.tank.pressure, L.units.bar)}
                {stepper('f1', L.tank.o2, L.units.pctO2)}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Pill onClick={() => setS((p) => ({ ...p, p1: 0, f1: 21 }))}>{L.tank.quickEmpty}</Pill>
                <Pill onClick={() => setS((p) => ({ ...p, f1: 21 }))}>{L.tank.quickAir}</Pill>
                <Pill onClick={() => setS((p) => ({ ...p, f1: p.f2 }))}>{L.tank.quickSame}</Pill>
              </div>
            </Card>
          </section>

          {/* 2. Mélange voulu */}
          <section className={`order-2 lg:order-none ${vis('melange')}`}>
            <Card>
              <SectionHead no={2} state={ok2 ? 'done' : 'todo'} title={L.mix.title} help={L.mix.help}
                chip={fill(L.flow.mixChip, { m: fmt.raw(s.f2), p: fmt.raw(s.p2), mod: mod(s.f2 / 100, 1.4) })} />
              <div className="mb-2 grid grid-cols-7 gap-1">
                {MIXES.map((m) => {
                  const on = s.f2 === m
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setS((p) => ({ ...p, f2: m }))}
                      className={`flex min-h-12 flex-col items-center justify-center rounded-xl border py-1.5 text-center tabular-nums transition-all duration-200 ease-out-expo active:scale-95 ${
                        on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'
                      }`}
                    >
                      <span className="text-[13px] font-extrabold leading-tight min-[400px]:text-sm">{fill(L.mix.shortcut, { m })}</span>
                      <small className={`text-[11px] font-semibold leading-tight ${on ? 'text-white/85' : 'text-gray-500'}`}>
                        {fill(L.mix.shortcutMod, { mod: mixPresetMod(m) })}
                      </small>
                    </button>
                  )
                })}
              </div>
              <div className={fieldsGrid}>
                {stepper('f2', L.mix.o2, L.units.pctO2)}
                {stepper('p2', L.mix.pressure, L.units.bar)}
              </div>
              <LawNote
                className="mt-2.5"
                title={L.laws.modTitle}
                text={fill(L.laws.mod, { m: fmt.raw(s.f2), p: fmt.raw(Math.round(140 / s.f2 * 100) / 100), mod: mod(s.f2 / 100, 1.4) })}
              />
            </Card>
          </section>

          {cta('melange', 'order-3')}

          {/* 3. Gaz disponibles */}
          <section className={`order-5 lg:order-none ${vis('stocks')}`}>
            <Card>
              <SectionHead no={3} state={ok3 ? 'done' : 'todo'} title={L.gases.title} help={L.gases.help}
                chip={fill(s.gases.length > 1 ? L.flow.gasesChipN : L.flow.gasesChip1, { n: s.gases.length })} tone={ok3 ? 'neutral' : 'low'} />
              <div className="grid min-w-0 gap-2.5">
                {s.gases.map((g, i) => {
                  const color = gasColor(+g.f / 100)
                  const cont = isCont(g)
                  const kind = gasCardKind(g)
                  const bad = gasFieldErrors(g)
                  const kindTxt = kind.kind === 'continuous' ? L.gases.kindContinuous
                    : kind.kind === 'buffer' ? L.gases.kindBuffer
                    : fill(kind.together ? L.gases.kindTogether : L.gases.kindCascade, { n: kind.n })
                  const nameId = `${baseId}-gas-${i}`
                  return (
                    <div key={i} className={`min-w-0 rounded-xl border border-l-[5px] border-gray-200 bg-white py-1 pl-2.5 pr-1 pb-2.5 ${GAS_BORDER_L[color]}`}>
                      <div className="flex items-center gap-2">
                        <Dot color={color} />
                        {/* Nom et type sur une ligne ; le type passe dessous s'il manque de place */}
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
                          <input
                            id={nameId}
                            value={g.name}
                            aria-label={L.gases.nameAria}
                            onChange={(e) => updateGas(i, { name: e.target.value })}
                            className="min-w-[7.5rem] flex-1 border-b-2 border-transparent bg-transparent py-1 text-[15px] font-bold text-black outline-none focus:border-primary"
                          />
                          <span className="ml-auto whitespace-nowrap text-[11px] font-semibold text-gray-500">{kindTxt}</span>
                        </div>
                        <button
                          type="button"
                          title={L.gases.remove}
                          aria-label={`${L.gases.remove} ${g.name}`}
                          onClick={() => removeGas(i)}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-gray-400 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                      <div className={`mt-1 grid gap-1.5 pr-1.5 ${cont ? 'grid-cols-3' : 'grid-cols-4'}`}>
                        <GasField label={L.gases.o2} value={g.f} bad={bad.f} onValue={(raw) => updateGas(i, { f: parseGasField(raw, 'f') })} />
                        <GasField label={cont ? L.gases.pressureMax : L.gases.pressure} value={g.p} bad={bad.p} onValue={(raw) => updateGas(i, { p: parseGasField(raw, 'p') })} />
                        <GasField label={L.gases.volume} value={g.v} placeholder="∞" onValue={(raw) => updateGas(i, { v: parseGasField(raw, 'v') })} />
                        {!cont && (
                          <GasField label={L.gases.count} value={g.n || 1} placeholder="1" onValue={(raw) => updateGas(i, { n: parseGasField(raw, 'n') })} />
                        )}
                      </div>
                      {!cont && nTanks(g) > 1 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 pr-1.5">
                          <span className="text-xs font-semibold text-gray-500">{L.gases.opening}</span>
                          <Pill on={g.c !== false} onClick={() => updateGas(i, { c: true })}>{L.gases.cascade}</Pill>
                          <Pill on={g.c === false} onClick={() => updateGas(i, { c: false })}>{L.gases.together}</Pill>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-500">{L.gases.add}</span>
                <Pill onClick={() => addGas('o2')}>{L.gases.addO2}</Pill>
                <Pill onClick={() => addGas('nx')}>{L.gases.addNx}</Pill>
                <Pill onClick={() => addGas('airb')}>{L.gases.addAir}</Pill>
                <Pill onClick={() => addGas('comp')}>{L.gases.addComp}</Pill>
              </div>
            </Card>
            <p className="mt-1.5">
              <button type="button" onClick={() => setS(defaults)} className="min-h-11 px-1 text-[13px] font-semibold text-gray-500 underline underline-offset-2 hover:text-black">
                {L.gases.reset}
              </button>
            </p>
          </section>

          {cta('stocks', 'order-6')}
        </div>

        {/* ── Colonne résultats ── */}
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          {/* Plan de gonflage */}
          <section className={`order-7 lg:order-none ${vis('plan')}`} aria-live="polite">
            <Card>
            <SectionHead no={4} state={planLocked ? 'locked' : allDone || out.status === 'nothing' ? 'done' : 'todo'} title={L.plan.title} help={L.plan.help}
              chip={planLocked ? L.flow.planLocked : stepCount ? fill(L.flow.planChip, { done: doneSteps.length, n: stepCount }) : undefined}
              tone={planLocked ? 'locked' : allDone ? 'ok' : 'neutral'} />
            {out.status === 'error' ? (
              out.errors.map((e) => <p key={e} role="alert" className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-600">🔒 {L.errors[e]}</p>)
            ) : out.status === 'nothing' ? (
              <p className="text-center text-base font-semibold text-black">✓ {L.plan.nothing}</p>
            ) : out.main.kind === 'plan' ? (
              planCard(out.main.plan)
            ) : (
              <div className="grid gap-3">
                <div className="rounded-2xl border-2 border-red-600 bg-red-50/60 px-4 py-4 sm:p-5">
                  <p className="text-base font-bold text-red-700">⚠ {fill(L.plan.impossible, { p: fmt.r0(out.p2), mix: fmt.pct(out.f2) })}</p>
                  <p className={`mt-1.5 ${T.help}`}>
                    {out.main.best
                      ? <Rich text={fill(L.plan.bestHint, { p: fmt.raw(out.main.best.pf), mix: fmt.pct(out.f2) })} />
                      : L.plan.noneHint}
                  </p>
                </div>
                {out.main.best && planCard(out.main.best.plan)}
              </div>
            )}
            </Card>
          </section>

          {/* Tes stocks */}
          {out.status === 'computed' && (
            <section className={`order-4 lg:order-none ${vis('stocks')}`} aria-live="polite">
              <Card>
              <SectionHead title={L.stocks.title} help={L.stocks.help}
                chip={stockBadge === 'low' ? L.flow.stocksLow : stockBadge === 'mid' ? L.flow.stocksMid : L.flow.stocksOk}
                tone={stockBadge ?? 'ok'} />
              {out.ignored > 0 && <Note className="mb-2">{fill(out.ignored > 1 ? L.stocks.ignoredN : L.stocks.ignored1, { n: out.ignored })}</Note>}
              <div className="grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">{out.tiles.map(tileCard)}</div>
              </Card>
            </section>
          )}

          {/* Analyse finale */}
          {chosen && analysis && (
            <section className={`order-9 lg:order-none ${vis('plan')}`}>
              <Card>
              <SectionHead no={5} state={!anaUnlocked ? 'locked' : anaTouched ? 'done' : 'todo'} title={L.analysis.title} help={L.analysis.help}
                chip={anaUnlocked ? undefined : L.flow.anaLocked} tone="locked" />
              {!anaUnlocked && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2.5">
                  <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-gray-600">{L.flow.anaHint}</p>
                  <button type="button" onClick={unlockAnalysis}
                    className="min-h-11 whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 text-[13px] font-semibold text-black transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary active:scale-95">
                    {L.flow.anaUnlock}
                  </button>
                </div>
              )}
              <Lockable locked={!anaUnlocked}>
                <Field label={L.analysis.field} htmlFor={fieldId('ana')}>
                  <Stepper
                    id={fieldId('ana')}
                    label={L.analysis.field}
                    value={anaValue}
                    spec={FIELD_SPECS.ana}
                    unit={L.units.pctO2}
                    fmt={fmt}
                    decreaseLabel={L.stepper.decrease}
                    increaseLabel={L.stepper.increase}
                    onBump={bumpAna}
                    onSet={setAna}
                  />
                </Field>
                <div aria-live="polite">
                  {!analysis.valid ? (
                    <p role="alert" className="mt-2.5 font-semibold text-red-700">{L.analysis.invalid}</p>
                  ) : (
                    <>
                      {ramp && <p className={`mt-2.5 ${T.small}`}>{L.analysis.ramp}</p>}
                      {/* Verdict + étiquette (.anabox de l'original) */}
                      <div className={`mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border-l-[5px] bg-gray-50 px-3 py-2.5 ${LEVEL_BORDER_L[analysis.level]}`}>
                        <div className="min-w-0">
                          <p className={`text-[20px] font-extrabold leading-tight ${LEVEL_TEXT[analysis.level]}`}>
                            {analysis.level === 'ok' ? '✓ ' : '⚠ '}
                            {analysis.level === 'ok' ? L.analysis.status.ok
                              : analysis.level === 'mid' ? (analysis.d > 0 ? L.analysis.status.richMid : L.analysis.status.leanMid)
                              : (analysis.d > 0 ? L.analysis.status.richLow : L.analysis.status.leanLow)}
                          </p>
                          <p className={`tabular-nums ${T.small}`}>
                            {fill(Math.abs(analysis.d * 100) >= 2 ? L.analysis.gapN : L.analysis.gap1, {
                              d: (analysis.d > 0.0005 ? '+' : '') + fmt.f1(analysis.d * 100),
                              target: fmt.pct(targetF),
                            })}
                          </p>
                        </div>
                        <div className="ml-auto text-right">
                          <p className={T.small}>{L.analysis.labelTitle}</p>
                          <p key={analysis.fa} className="animate-number-pop tabular-nums text-[30px] font-extrabold leading-none tracking-[-0.02em] text-black">{fmt.pct(analysis.fa)}</p>
                          <p className={`mt-1 tabular-nums ${T.small}`}>{fill(L.analysis.labelMod, { m14: analysis.mod14, m16: analysis.mod16 })}</p>
                        </div>
                      </div>
                      {analysis.fix !== undefined && (
                        <div className="mt-2.5 text-[14px] font-medium text-gray-700">
                          {analysis.fix ? (
                            <>
                              <p className="font-bold text-black">{fill(L.analysis.fixTitle, { target: fmt.pct(targetF) })}</p>
                              <ol className="my-1.5 grid gap-1">
                                {[
                                  fill(ramp ? L.analysis.fixBleedRamp : L.analysis.fixBleedBlock, { p: fmt.raw(analysis.fix.pd) }),
                                  ...analysis.fix.sol.steps.map((st) => fill(L.analysis.fixStep, { gas: withPct(st.gas), p: fmt.r0(st.gauge) })),
                                ].map((txt, i) => (
                                  <li key={i} className="flex items-center gap-2.5">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-black">{i + 1}</span>
                                    <span><Rich text={txt} strongClass="font-extrabold text-primary" /></span>
                                  </li>
                                ))}
                              </ol>
                              <p className={T.small}>{fill(L.analysis.fixResult, { mix: fmt.pct(analysis.fix.sol.mix), label: fmt.pct(analysis.fa) })}</p>
                            </>
                          ) : (
                            <p className={T.small}>{fill(L.analysis.fixNone, { label: fmt.pct(analysis.fa) })}</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Lockable>
              </Card>
            </section>
          )}

          {/* Autres options (repliées) */}
          {out.status === 'computed' && out.alts.length > 0 && (
            <section className={`order-10 lg:order-none ${vis('plan')}`}>
              <Card>
              <SectionHead title={L.alts.title} help={L.alts.help} />
              <div className="grid gap-2">
                {out.alts.map((sol, i) => {
                  const view: PlanView = { sol, p1: out.p1, p2: out.p2, bleed: null, good: sol.dev <= TOL }
                  return (
                    <details key={i} className={detailsBox}>
                      <summary className={summaryRow}>
                        <span className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-black">
                          {sol.steps.map((st, k) => <Dot key={k} color={gasColor(st.gas.f)} />)}
                          <span className="truncate">{titleOf(sol.gases)}</span>
                        </span>
                        <span className="ml-auto whitespace-nowrap text-[13px] font-semibold tabular-nums text-gray-500">
                          {fmt.pct(sol.mix)}{sol.o2 > EPS ? fill(L.alts.withO2, { o2: fmt.r0(sol.o2) }) : L.alts.noO2}
                        </span>
                        {chevron}
                      </summary>
                      <div className="px-4 pb-3">
                        {compBar(sol)}
                        {planGrid(view)}
                        {notes(sol)}
                        {altStock(sol, out.V)}
                      </div>
                    </details>
                  )
                })}
              </div>
              </Card>
            </section>
          )}

          {/* En bref : récap, en dernier */}
          {summary && (
            <section className={`order-11 lg:order-none ${vis('plan')}`} aria-live="polite">
              <Card>
              <SectionHead title={L.summary.title} help={L.summary.help} chip={L.flow.summaryChip} />
              {summaryChips(summary)}
              </Card>
            </section>
          )}

          {/* Combinaisons écartées (repliées) */}
          {out.status === 'computed' && out.rejected.length > 0 && (
            <details className={`order-12 lg:order-none ${detailsBox} ${vis('plan')}`}>
              <summary className={summaryRow}>
                <span className="text-[15px] font-semibold text-black">{L.rejected.title}</span>
                <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold tabular-nums text-gray-600">{out.rejected.length}</span>
                {chevron}
              </summary>
              <div className="px-4 pb-3">
                {out.rejected.map((k, i) => (
                  <div key={i} className="flex gap-2.5 border-t border-gray-100 py-2 text-[13px] first:border-t-0 max-sm:flex-col max-sm:gap-0.5">
                    <span className="min-w-0 flex-1 font-semibold text-black">{titleOf(k.gases)}</span>
                    <span className="flex-[1.3] font-medium text-red-700">{koReason(k.reason)}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
