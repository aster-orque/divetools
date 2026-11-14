'use client'

/**
 * Briques d'interface partagées par les outils MOD, PpO2, EAD, Best mix et Lestage
 * (mêmes styles que l'étiquette nitrox : cartes, steppers, encadrés, pastilles).
 */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'

const HOLD_DELAY_MS = 400
const HOLD_INTERVAL_MS = 70
const TOAST_MS = 1800

export const T = {
  sectionTitle: 'text-[17px] font-bold text-black',
  help: 'text-[13px] font-medium leading-relaxed text-gray-500',
  small: 'text-xs font-medium text-gray-500',
} as const
const FOCUS_RING = 'focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(18,132,199,0.1)]'

export const secondaryBtn =
  'min-h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-black shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary active:scale-[0.98]'

/** Remplace {clé} par sa valeur. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all))
}

/** Rend **gras** dans une chaîne de labels. */
export function Rich({ text, strongClass = 'font-bold text-black' }: { text: string; strongClass?: string }) {
  const parts: ReactNode[] = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0
  let i = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push(<strong key={i++} className={strongClass}>{m[1]}</strong>)
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts.map((p, k) => <Fragment key={k}>{p}</Fragment>)}</>
}

/** Formats numériques selon la langue. */
export function makeNum(locale: string) {
  const cache = new Map<string, Intl.NumberFormat>()
  const nf = (min: number, max: number) => {
    const k = `${min}-${max}`
    let f = cache.get(k)
    if (!f) {
      f = new Intl.NumberFormat(locale, { minimumFractionDigits: min, maximumFractionDigits: max })
      cache.set(k, f)
    }
    return f
  }
  return {
    /** Nombre avec exactement d décimales. */
    d: (x: number, d = 0) => nf(d, d).format(x),
    /** Nombre avec au plus d décimales. */
    upTo: (x: number, d = 1) => nf(0, d).format(x),
    /** Nombre avec entre min et max décimales. */
    r: (x: number, min: number, max: number) => nf(min, max).format(x),
  }
}
export type Num = ReturnType<typeof makeNum>

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string; id?: string; 'aria-live'?: 'polite' }) {
  return <section className={`rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-soft sm:p-5 ${className}`} {...rest}>{children}</section>
}

export function SectionHead({ no, title, help, className = 'mb-4' }: { no?: ReactNode; title: string; help?: string; className?: string }) {
  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      {no !== undefined && (
        <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{no}</span>
      )}
      <div className="min-w-0 flex-1">
        <h2 className={T.sectionTitle}>{title}</h2>
        {help && <p className={`mt-0.5 ${T.help}`}>{help}</p>}
      </div>
    </div>
  )
}

export function SubLabel({ children, first = false }: { children: ReactNode; first?: boolean }) {
  return <p className={`${first ? '' : 'mt-4'} mb-2 text-xs font-semibold text-gray-500`}>{children}</p>
}

export type Tone = 'ok' | 'mid' | 'low' | 'info'
/** Couleurs d'état : OK en bleu Orque (pas de vert), orange pour la vigilance, rouge pour le danger. */
export const TONE: Record<Tone, { wrap: string; title: string; text: string; border: string; soft: string }> = {
  ok: { wrap: 'border-l-primary bg-gray-50', title: 'text-primary-600', text: 'text-primary-600', border: 'border-primary', soft: 'bg-primary-50' },
  mid: { wrap: 'border-l-amber-500 bg-amber-50', title: 'text-amber-700', text: 'text-amber-700', border: 'border-amber-500', soft: 'bg-amber-50' },
  low: { wrap: 'border-l-red-600 bg-red-50', title: 'text-red-700', text: 'text-red-700', border: 'border-red-600', soft: 'bg-red-50' },
  info: { wrap: 'border-l-gray-200 bg-gray-50', title: 'text-black', text: 'text-black', border: 'border-gray-200', soft: 'bg-gray-50' },
}

/** Encadré d'info (.box des modèles). */
export function Box({ tone = 'info', title, children, className = '' }: { tone?: Tone; title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={`mt-2.5 rounded-xl border-l-[5px] px-3 py-2.5 ${TONE[tone].wrap} ${className}`}>
      {title && <p className={`text-[15px] font-extrabold leading-snug ${TONE[tone].title}`}>{title}</p>}
      {children && <p className="text-[13px] font-medium leading-snug text-gray-600">{children}</p>}
    </div>
  )
}

/** Stepper − valeur + (appui long répété, saisie libre validée au blur ou sur Entrée). */
export function Stepper({ label, sub, unit, display, onBump, onSet, decreaseLabel, increaseLabel, ariaLabel }: {
  label: ReactNode; sub?: ReactNode; unit: string; display: string
  onBump: (dir: -1 | 1) => void; onSet: (v: number) => void; decreaseLabel: string; increaseLabel: string; ariaLabel: string
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

  const commit = () => {
    if (draft !== null && draft !== display) {
      const v = parseFloat(draft.replace(/\s/g, '').replace(',', '.'))
      if (Number.isFinite(v)) onSet(v)
    }
    setDraft(null)
  }
  const start = (dir: -1 | 1) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    stop()
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
  const btn = 'flex h-11 w-11 shrink-0 select-none touch-manipulation items-center justify-center rounded-full border border-gray-200 bg-white text-xl font-medium leading-none text-black shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary active:scale-95 active:border-primary active:bg-primary active:text-white max-[380px]:h-10 max-[380px]:w-10'
  return (
    <div className={`flex min-w-0 items-center justify-between gap-2 rounded-xl border border-transparent bg-gray-50 py-1.5 pl-3 pr-1.5 transition-all duration-200 ease-out-expo ${FOCUS_RING}`}>
      <span className="min-w-0 text-[14px] font-semibold leading-snug text-gray-700">
        {label}
        {sub && <small className="block text-xs font-medium text-gray-500">{sub}</small>}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" aria-label={`${decreaseLabel}, ${ariaLabel}`} className={btn}
          onPointerDown={start(-1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={key(-1)}>
          −
        </button>
        <div className="flex w-[78px] flex-col items-center leading-tight max-[380px]:w-[68px]">
          <input
            inputMode="decimal"
            aria-label={ariaLabel}
            value={draft ?? display}
            onFocus={(e) => {
              setDraft(display)
              e.currentTarget.select()
            }}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
            onBlur={commit}
            className="w-full min-w-0 border-b-2 border-transparent bg-transparent p-0 text-center text-[24px] font-extrabold leading-tight tracking-tight tabular-nums text-black outline-none transition-colors focus:border-primary"
          />
          <small className="whitespace-nowrap text-xs font-semibold leading-tight text-gray-500">{unit}</small>
        </div>
        <button type="button" aria-label={`${increaseLabel}, ${ariaLabel}`} className={btn}
          onPointerDown={start(1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={key(1)}>
          +
        </button>
      </div>
    </div>
  )
}

/** Bouton de choix rapide en grille (mélanges, ppO2…). */
export function Choice({ on, onClick, children, className = '' }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-1 text-[13px] font-bold tabular-nums transition-all duration-200 ease-out-expo active:scale-95 ${
        on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'
      } ${className}`}
    >
      {children}
    </button>
  )
}

/** Pastille ronde (raccourcis de profondeur). */
export function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-10 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold tabular-nums transition-all duration-200 ease-out-expo active:scale-95 ${
        on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-black hover:border-primary hover:text-primary'
      }`}
    >
      {children}
    </button>
  )
}

/** Sélecteur segmenté (fond gris, option active en blanc). */
export function Segmented<V extends string | number>({ value, options, onChange, ariaLabel, className = '' }: {
  value: V; options: { v: V; label: ReactNode; sub?: ReactNode }[]; onChange: (v: V) => void; ariaLabel: string; className?: string
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={`grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 ${className}`}>
      {options.map((o) => {
        const on = o.v === value
        return (
          <button
            key={String(o.v)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.v)}
            className={`min-h-10 rounded-lg px-1 text-[13.5px] font-semibold leading-tight tabular-nums transition-all duration-200 ease-out-expo ${
              on ? 'bg-white text-black shadow-soft' : 'text-gray-500 hover:text-black'
            }`}
          >
            {o.label}
            {o.sub && <small className="block text-[11px] font-medium text-gray-500">{o.sub}</small>}
          </button>
        )
      })}
    </div>
  )
}

/** Puce d'info (« Calcul exact 33,8 m »). */
export function Chip({ children, tone }: { children: ReactNode; tone?: 'low' }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-medium tabular-nums text-gray-700 ${tone === 'low' ? 'bg-red-50' : 'bg-gray-100'}`}>
      {children}
    </span>
  )
}

/** Carte repliable « Comment c'est calculé ». */
export function HowCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-soft sm:px-5">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-bold text-black marker:hidden [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="text-xl font-normal text-gray-400 transition-transform duration-200 group-open:rotate-45">+</span>
      </summary>
      <div className="mt-3 space-y-2 text-[13.5px] font-medium leading-relaxed text-gray-700">{children}</div>
    </details>
  )
}

/** Formule mise en avant (en Poppins, pas de police mono). */
export function Formula({ children }: { children: ReactNode }) {
  return <p className="overflow-x-auto whitespace-nowrap rounded-lg bg-gray-50 px-3 py-2 text-[13px] font-semibold text-black">{children}</p>
}

/** Liste à puces discrète. */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  )
}

/** Message éphémère en bas d'écran. */
export function useToast(lift = false) {
  const [toast, setToast] = useState<{ msg: string; n: number } | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(t)
  }, [toast])
  const say = useCallback((msg: string) => setToast((p) => ({ msg, n: (p?.n ?? 0) + 1 })), [])
  const node = (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed ${lift ? 'bottom-[calc(90px+env(safe-area-inset-bottom))] lg:bottom-6' : 'bottom-[calc(24px+env(safe-area-inset-bottom))]'} left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-black px-4 py-2 text-[13px] font-semibold text-white transition-opacity duration-200 ${
        toast ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {toast?.msg}
    </div>
  )
  return { say, node }
}

/** Copie un texte et le signale. */
export async function copyText(text: string, say: (m: string) => void, ok: string, fail: string) {
  try {
    await navigator.clipboard.writeText(text)
    say(ok)
  } catch {
    say(fail)
  }
}

/**
 * État mémorisé dans le localStorage (lecture après montage : pas d'écart d'hydratation).
 * `sanitize` valide ce qui est relu ; il renvoie null si c'est inutilisable.
 */
export function usePersistentState<S>(key: string, initial: S, sanitize: (raw: unknown) => S | null) {
  const [s, setS] = useState<S>(initial)
  const [loaded, setLoaded] = useState(false)
  const sanitizeRef = useRef(sanitize)
  useEffect(() => {
    try {
      const saved = sanitizeRef.current(JSON.parse(window.localStorage.getItem(key) || 'null'))
      if (saved) setS(saved)
    } catch {
      /* stockage indisponible : valeurs par défaut */
    }
    setLoaded(true)
  }, [key])
  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(key, JSON.stringify(s))
    } catch {
      /* stockage indisponible */
    }
  }, [key, s, loaded])
  return [s, setS, loaded] as const
}

/** Hauteur de la navbar collante (pour coller une colonne dessous en desktop). */
export function useHeaderHeight() {
  const [h, setH] = useState(0)
  useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const update = () => setH(header.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])
  return h
}

/** Arrondi d'un pas de stepper (évite 1,4500000001). */
export function stepValue(v: number, dir: -1 | 1, step: number, min: number, max: number) {
  const next = Math.round(Math.round((v + dir * step) / step) * step * 1000) / 1000
  return Math.min(max, Math.max(min, next))
}
export function clampTo(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
export const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/**
 * Zones de profondeur, même langage graphique que la jauge MOD : eau en dégradé bleu Orque
 * (zone OK), hachures orange claires (au-delà de ta limite), hachures rouges claires (danger).
 */
export const ZONE_FILL = { ok: 'url(#zone-ok)', mid: 'url(#zone-mid)', bad: 'url(#zone-bad)' } as const
export function ZoneDefs({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <defs>
      <linearGradient id="zone-ok" x1="0" y1="0" x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>
        <stop offset="0" stopColor="#bae6fd" />
        <stop offset="1" stopColor="#0369a1" />
      </linearGradient>
      <pattern id="zone-mid" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="#fffbeb" />
        <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="3" opacity=".45" />
      </pattern>
      <pattern id="zone-bad" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="#f9fafb" />
        <line x1="0" y1="0" x2="0" y2="8" stroke="#dc2626" strokeWidth="3" opacity=".35" />
      </pattern>
    </defs>
  )
}
/** Pastilles de légende assorties aux zones. */
export const ZONE_SWATCH = {
  ok: { background: 'linear-gradient(180deg,#bae6fd,#0369a1)' },
  mid: { background: 'repeating-linear-gradient(45deg,rgba(245,158,11,.5) 0 2px,#fffbeb 2px 5px)' },
  bad: { background: 'repeating-linear-gradient(45deg,rgba(220,38,38,.4) 0 2px,#f9fafb 2px 5px)' },
} as const
export function ZoneLegend({ items }: { items: { k: keyof typeof ZONE_SWATCH; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs font-medium text-gray-500">
      {items.map((it) => (
        <span key={it.label}>
          <i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-[3px] align-[-1px] ring-1 ring-inset ring-black/5" style={ZONE_SWATCH[it.k]} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

/**
 * Jauge horizontale (CNS, OTU) : piste grise, zones de vigilance hachurées (même langage que la
 * jauge MOD), remplissage bleu Orque, orange ou rouge selon le niveau, repères et graduations.
 */
export function Gauge({ max, value, tone, ghost, zones = [], ticks = [], scale = [], hatchUntil }: {
  max: number; value: number; tone: 'ok' | 'mid' | 'low'
  /** Valeur de départ en gris clair derrière le remplissage (ex. CNS en sortant). */
  ghost?: number
  zones?: { from: number; to: number; k: 'mid' | 'bad' }[]
  ticks?: { v: number; dashed?: boolean }[]
  scale?: { v: number; label: string }[]
  /** Part hachurée au début du remplissage (ex. résiduel). */
  hatchUntil?: number
}) {
  const pc = (v: number) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`
  const fillCls = tone === 'ok' ? 'bg-primary' : tone === 'mid' ? 'bg-amber-500' : 'bg-red-600'
  return (
    <div aria-hidden>
      <div className="relative mt-3 h-3.5 rounded-full bg-gray-100">
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {zones.map((z) => (
            <i key={`${z.from}-${z.k}`} className="absolute inset-y-0 opacity-70" style={{ left: pc(z.from), width: `calc(${pc(z.to)} - ${pc(z.from)})`, ...ZONE_SWATCH[z.k] }} />
          ))}
          {ghost !== undefined && ghost > 0 && <i className="absolute inset-y-0 left-0 rounded-full bg-gray-300/70" style={{ width: pc(ghost) }} />}
          <i className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out-expo ${fillCls}`} style={{ width: pc(value) }} />
          {hatchUntil !== undefined && hatchUntil > 0 && (
            <i className="absolute inset-y-0 left-0 rounded-l-full" style={{ width: pc(Math.min(hatchUntil, value)), background: 'repeating-linear-gradient(135deg,rgba(255,255,255,.55) 0 3px,transparent 3px 6px)' }} />
          )}
        </div>
        {ticks.map((t) => (
          <i key={t.v} className={`absolute -bottom-1 -top-1 w-0 border-l-2 ${t.dashed ? 'border-dashed border-black/50' : 'border-black/40'}`} style={{ left: pc(t.v) }} />
        ))}
      </div>
      {scale.length > 0 && (
        <div className="relative mt-1.5 h-4 text-[11px] font-medium tabular-nums text-gray-500">
          {scale.map((s, i) => (
            <span key={s.v} className="absolute whitespace-nowrap" style={{
              left: pc(s.v),
              transform: i === 0 && s.v === 0 ? 'none' : s.v >= max ? 'translateX(-100%)' : 'translateX(-50%)',
            }}>{s.label}</span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Heure (hh:mm) avec bouton optionnel ; vide = non renseignée. */
export function TimeField({ label, sub, value, onChange, aria, clearLabel, action }: {
  label: ReactNode; sub?: ReactNode; value: string; onChange: (v: string) => void; aria: string; clearLabel?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className={`flex min-w-0 items-center justify-between gap-2 rounded-xl border border-transparent bg-gray-50 py-1.5 pl-3 pr-1.5 ${FOCUS_RING}`}>
      <span className="min-w-0 text-[14px] font-semibold leading-snug text-gray-700">
        {label}
        {sub && <small className="block text-xs font-medium text-gray-500">{sub}</small>}
      </span>
      <div className="flex shrink-0 items-center gap-1.5">
        {action && (
          <button type="button" onClick={action.onClick}
            className="min-h-10 rounded-full border border-primary px-3 text-[13px] font-semibold text-primary transition-colors hover:bg-primary hover:text-white">
            {action.label}
          </button>
        )}
        <div className="flex flex-col items-center">
          <input type="time" aria-label={aria} value={value} onChange={(e) => onChange(e.target.value)}
            className="min-h-11 w-[124px] rounded-xl border border-gray-200 bg-white px-2 text-center text-[19px] font-bold tabular-nums text-black outline-none focus:border-primary" />
          {clearLabel && value && (
            <button type="button" onClick={() => onChange('')} className="pt-0.5 text-xs font-medium text-gray-500 underline underline-offset-2 hover:text-primary">{clearLabel}</button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Tuile de chiffre clé (petit libellé, gros chiffre, ligne d'aide). */
export function Tile({ label, value, sub, tone }: { label: ReactNode; value: ReactNode; sub?: ReactNode; tone?: 'mid' | 'low' }) {
  return (
    <div className={`min-w-0 rounded-xl border px-3 py-2 ${tone === 'low' ? 'border-red-200 bg-red-50' : tone === 'mid' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <small className="block text-xs font-semibold text-gray-500">{label}</small>
      <b className={`block text-[22px] font-extrabold leading-tight tabular-nums ${tone === 'low' ? 'text-red-700' : tone === 'mid' ? 'text-amber-700' : 'text-black'}`}>{value}</b>
      {sub && <div className="mt-0.5 text-[11.5px] font-medium leading-snug text-gray-500">{sub}</div>}
    </div>
  )
}

/** Unité en petit gris après un gros chiffre. */
export function U({ children }: { children: ReactNode }) {
  return <em className="ml-0.5 text-[0.55em] font-semibold not-italic tracking-normal text-gray-500">{children}</em>
}

/** Couleurs de niveau (texte, encadré, remplissage) : bleu Orque, orange, rouge. */
export type Lvl = 'ok' | 'mid' | 'low'
export const LVL_TXT: Record<Lvl, string> = { ok: 'text-primary-600', mid: 'text-amber-700', low: 'text-red-700' }
export const LVL_BOX: Record<Lvl, string> = { ok: 'border-l-primary bg-gray-50', mid: 'border-l-amber-500 bg-amber-50', low: 'border-l-red-600 bg-red-50' }
export const LVL_FILL: Record<Lvl, string> = { ok: 'bg-primary', mid: 'bg-amber-500', low: 'bg-red-600' }

/** Encadré de verdict (titre coloré + texte). */
export function Verdict({ tone, title, children }: { tone: Lvl; title: ReactNode; children?: ReactNode }) {
  return (
    <div className={`mt-2.5 rounded-xl border-l-[5px] px-3 py-2.5 ${LVL_BOX[tone]}`}>
      <p className={`text-[15px] font-extrabold leading-snug ${LVL_TXT[tone]}`}>{title}</p>
      {children && <p className="text-[13px] font-medium leading-snug text-gray-600">{children}</p>}
    </div>
  )
}
