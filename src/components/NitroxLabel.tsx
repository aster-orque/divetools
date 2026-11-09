'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode, Ref } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import {
  CHECKS_END, CHECKS_START, DEFAULT_STATE, HIGHLIGHT, MIXES, PP_CHOICES, PRESSURES, STEP_COUNT,
  STORAGE_KEY, TOL, DECO_O2, allChecked, analysis, bump, clamp, modLabel, nxComputer, nxLabel, sanitizeState,
  shortDate, todayIso,
} from '@/lib/etiquette-nitrox/engine'
import type { CheckId, LabelField, LabelState, NumKey, View } from '@/lib/etiquette-nitrox/engine'

type Labels = typeof fr.nitroxLabel

// ── Présentation ──────────────────────────────────────────────────────────────
const HOLD_DELAY_MS = 400
const HOLD_INTERVAL_MS = 70
const TOAST_MS = 1800
const TOOL_SCROLL_GAP_PX = 12

const T = {
  sectionTitle: 'text-[17px] font-bold text-black',
  help: 'text-[13px] font-medium leading-relaxed text-gray-500',
  small: 'text-xs font-medium text-gray-500',
  kicker: 'text-xs font-bold uppercase tracking-wider text-gray-500',
} as const
const FOCUS_RING = 'focus-within:border-primary focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(18,132,199,0.1)]'
const PRIMARY_SHADOW = 'shadow-[0_2px_8px_rgba(18,132,199,0.3)]'

/** Étiquette = objet physique : couleurs fixes, valeurs « écrites au feutre » (police manuscrite du modèle). */
const LABEL_INK = '#1a3d8f'
const HAND_FONT = "'Segoe Print','Bradley Hand','Chalkboard SE','Comic Sans MS','Marker Felt',cursive"

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all))
}

/** Rend **gras** dans une chaîne de labels. */
function Rich({ text, strongClass = 'font-bold text-black' }: { text: string; strongClass?: string }) {
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

function makeFmt(locale: string) {
  const one = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const int = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const two = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })
  return {
    f1: (x: number) => one.format(Math.round(x * 10) / 10),
    r0: (x: number) => int.format(Math.round(x)),
    pp: (x: number) => one.format(x),
    two: (x: number) => two.format(x),
  }
}
type Fmt = ReturnType<typeof makeFmt>

// ── Sous-composants ───────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-soft sm:p-5 ${className}`}>{children}</div>
}

function SectionHead({ no, title, help, chip }: { no: ReactNode; title: string; help: string; chip?: string }) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{no}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className={T.sectionTitle}>{title}</h2>
          {chip && <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-gray-700">{chip}</span>}
        </div>
        <p className={`mt-0.5 ${T.help}`}>{help}</p>
      </div>
    </div>
  )
}

function SubLabel({ children, first = false }: { children: ReactNode; first?: boolean }) {
  return <p className={`${first ? '' : 'mt-4'} mb-2 text-xs font-semibold text-gray-500`}>{children}</p>
}

type BoxTone = 'ok' | 'mid' | 'low' | 'info'
const BOX: Record<BoxTone, { wrap: string; title: string }> = {
  ok: { wrap: 'border-l-primary bg-gray-50', title: 'text-primary-600' },
  mid: { wrap: 'border-l-amber-500 bg-amber-50', title: 'text-amber-700' },
  low: { wrap: 'border-l-red-600 bg-red-50', title: 'text-red-700' },
  info: { wrap: 'border-l-gray-200 bg-gray-50', title: 'text-black' },
}
/** Encadré d'info (.box du modèle). */
function Box({ tone = 'info', title, children, className = '' }: { tone?: BoxTone; title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`mt-2.5 rounded-xl border-l-[5px] px-3 py-2.5 ${BOX[tone].wrap} ${className}`}>
      {title && <p className={`text-base font-extrabold leading-snug ${BOX[tone].title}`}>{title}</p>}
      <p className="text-[13px] font-medium leading-snug text-gray-600">{children}</p>
    </div>
  )
}

/** Rappel de la loi physique, façon cours de plongée. */
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

/** Case à cocher (geste à faire). */
function Check({ checked, need, title, sub, onChange, children }: {
  checked: boolean; need: boolean; title: string; sub: ReactNode; onChange: (v: boolean) => void; children?: ReactNode
}) {
  return (
    <li>
      <label className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200 ease-out-expo ${
        need ? 'border-amber-500 bg-amber-50' : 'border-transparent bg-gray-50 hover:border-gray-200'
      }`}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span aria-hidden="true" className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold text-white transition-all duration-200 ease-out-expo peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ${
          checked ? 'border-primary bg-primary' : need ? 'border-amber-500 bg-white' : 'border-gray-300 bg-white'
        }`}>
          {checked && '✓'}
        </span>
        <span className="min-w-0 text-[14px] font-semibold leading-snug text-black">
          {title}
          <small className="mt-0.5 block text-xs font-medium text-gray-500">{sub}</small>
          {children}
        </span>
      </label>
    </li>
  )
}

/** Stepper − valeur + (appui long répété, saisie libre validée au blur ou sur Entrée). */
function Stepper({ label, sub, unit, display, onBump, onSet, decreaseLabel, increaseLabel, ariaLabel }: {
  label: string; sub?: string; unit: string; display: string
  onBump: (dir: -1 | 1) => void; onSet: (v: number) => void; decreaseLabel: string; increaseLabel: string; ariaLabel?: string
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
      const v = parseFloat(draft.replace(',', '.'))
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
  const btn = 'flex h-11 w-11 shrink-0 select-none touch-manipulation items-center justify-center rounded-full border border-gray-200 bg-white text-xl font-medium leading-none text-black shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary active:scale-95 active:border-primary active:bg-primary active:text-white'
  return (
    <div className={`flex min-w-0 items-center justify-between gap-2 rounded-xl border border-transparent bg-gray-50 py-1.5 pl-3 pr-1.5 transition-all duration-200 ease-out-expo ${FOCUS_RING}`}>
      <span className="min-w-0 text-[14px] font-semibold leading-snug text-gray-700">
        {label}
        {sub && <small className="block text-xs font-medium text-gray-500">{sub}</small>}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <button type="button" aria-label={`${decreaseLabel}, ${label}`} className={btn}
          onPointerDown={start(-1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={key(-1)}>
          −
        </button>
        <div className="flex w-[78px] flex-col items-center leading-tight">
          <input
            inputMode="decimal"
            aria-label={ariaLabel ?? label}
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
        <button type="button" aria-label={`${increaseLabel}, ${label}`} className={btn}
          onPointerDown={start(1)} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onKeyDown={key(1)}>
          +
        </button>
      </div>
    </div>
  )
}

/** Champ texte (.tf du modèle). */
function TextField({ label, value, onChange, need = false, ...rest }: {
  label: string; value: string; onChange: (v: string) => void; need?: boolean
  placeholder?: string; maxLength?: number; type?: string; autoComplete?: string; inputRef?: Ref<HTMLInputElement>
}) {
  const { inputRef, ...inputProps } = rest
  return (
    <label className={`block rounded-xl border border-transparent bg-gray-50 px-3 pb-2.5 pt-2 transition-all duration-200 ease-out-expo ${FOCUS_RING}`}>
      <span className="mb-0.5 block text-xs font-semibold text-gray-500">{label}</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...inputProps}
        className={`w-full border-0 border-b-2 bg-transparent px-0 py-0.5 text-xl font-bold text-black outline-none placeholder:font-medium placeholder:text-gray-400 focus:border-primary ${
          need ? 'border-amber-500' : 'border-transparent'
        }`}
      />
    </label>
  )
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold tabular-nums transition-all duration-200 ease-out-expo active:scale-95 ${
        on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-black hover:border-primary hover:text-primary'
      }`}
    >
      {children}
    </button>
  )
}

/** Aperçu de l'étiquette : cases titrées, valeurs « écrites à la main ». Tailles en cqw (proportionnelles à la largeur). */
function LabelPreview({ L, values, highlight }: {
  L: Labels; values: Record<LabelField, ReactNode>; highlight: LabelField[]
}) {
  const line = '0.4cqw solid #141414'
  const cell: CSSProperties = { borderTop: line, padding: '1.6cqw 2.4cqw 1.8cqw', minHeight: '15cqw', display: 'flex', flexDirection: 'column', minWidth: 0 }
  const caption: CSSProperties = { fontSize: '2.6cqw', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#555', whiteSpace: 'nowrap' }
  const field = (f: LabelField, size: string, grow = true): ReactNode => {
    const hl = highlight.includes(f)
    return (
      <span
        className={hl ? 'animate-label-pulse' : ''}
        style={{
          flex: grow ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1.2cqw',
          minHeight: grow ? '8cqw' : 0, minWidth: grow ? undefined : '10cqw', fontFamily: HAND_FONT, fontWeight: 700, color: LABEL_INK,
          fontSize: size, lineHeight: 1.05, whiteSpace: 'nowrap', transition: 'background .2s',
          background: hl ? 'rgba(18,132,199,.12)' : undefined, boxShadow: hl ? '0 0 0 .5cqw rgba(18,132,199,.6)' : undefined,
        }}
      >
        {values[f]}
      </span>
    )
  }
  return (
    <div className="mx-auto max-w-[460px] [container-type:inline-size]">
      <div
        role="img"
        aria-label={L.label.aria}
        style={{
          background: '#fff', color: '#141414', border: '0.6cqw solid #141414', borderRadius: '2cqw', overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,.12)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        }}
      >
        <div style={{ gridColumn: '1 / -1', padding: '1.6cqw', background: '#141414', color: '#fff', fontSize: '4.2cqw', fontWeight: 900, letterSpacing: '0.3em', textAlign: 'center' }}>
          {L.label.title}
        </div>
        <div style={{ ...cell, gridColumn: '1 / -1', alignItems: 'center', minHeight: '22cqw', borderTop: 'none' }}>
          <em style={{ ...caption, fontStyle: 'normal' }}>{L.label.mix}</em>
          {field('type', '13cqw')}
        </div>
        <div style={{ ...cell, gridColumn: '1 / -1', alignItems: 'center', textAlign: 'center', minHeight: '30cqw' }}>
          <em style={{ ...caption, fontStyle: 'normal', fontSize: '3cqw' }}>{L.label.mod}</em>
          {field('mod', '17cqw')}
          <span style={{ fontSize: '3.4cqw', fontWeight: 700, color: '#555', display: 'flex', alignItems: 'baseline', gap: '1.4cqw' }}>
            {L.label.atPp} {field('pp', '4.6cqw', false)}
          </span>
        </div>
        <div style={cell}>
          <em style={{ ...caption, fontStyle: 'normal' }}>{L.label.pressure}</em>
          {field('p', '6.4cqw')}
        </div>
        <div style={{ ...cell, borderLeft: line }}>
          <em style={{ ...caption, fontStyle: 'normal' }}>{L.label.date}</em>
          {field('date', '5cqw')}
        </div>
        <div style={{ ...cell, borderLeft: line }}>
          <em style={{ ...caption, fontStyle: 'normal' }}>{L.label.ini}</em>
          {field('ini', '6.4cqw')}
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function NitroxLabel({ labels }: { labels: Labels }) {
  const L = labels
  const fmt: Fmt = useMemo(() => makeFmt(L.numberLocale), [L.numberLocale])
  const [s, setS] = useState<LabelState>(DEFAULT_STATE)
  const [loaded, setLoaded] = useState(false)
  const [need, setNeed] = useState<Partial<Record<CheckId | 'ini', boolean>>>({})
  const [toast, setToast] = useState<{ msg: string; n: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const iniRef = useRef<HTMLInputElement>(null)

  // Hauteur de la navbar collante : l'aperçu de l'étiquette se colle dessous (desktop).
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

  // Lecture des saisies mémorisées (après montage : pas d'écart d'hydratation). La date repart du jour.
  useEffect(() => {
    let next: LabelState = { ...DEFAULT_STATE, date: todayIso() }
    try {
      const saved = sanitizeState(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null'))
      if (saved) next = saved
    } catch {
      /* stockage indisponible : valeurs par défaut */
    }
    setS(next)
    setLoaded(true)
  }, [])
  useEffect(() => {
    if (!loaded) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      /* stockage indisponible */
    }
  }, [s, loaded])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), TOAST_MS)
    return () => clearTimeout(t)
  }, [toast])
  const say = (msg: string) => setToast((p) => ({ msg, n: (p?.n ?? 0) + 1 }))

  const scrollToTool = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const h = document.querySelector('header')?.getBoundingClientRect().height ?? 0
    const top = root.getBoundingClientRect().top - h - TOOL_SCROLL_GAP_PX
    if (top < 0) window.scrollBy({ top, behavior: 'smooth' })
  }, [])

  // ── Calculs ──
  const nl = nxLabel(s.o2)
  const nc = nxComputer(s.o2)
  const m = modLabel(s.pp, s.o2)
  const ana = analysis(s.o2, s.mix)
  const r = s.reached
  const startOk = allChecked(s.chk, CHECKS_START)
  const endOk = allChecked(s.chk, CHECKS_END)
  const countChecked = (ids: CheckId[]) => ids.filter((id) => s.chk[id]).length

  // ── Actions ──
  const setNum = (k: NumKey, v: number) => setS((p) => {
    const val = clamp(k, v)
    return k === 'mix' ? { ...p, mix: val, o2: val } : { ...p, [k]: val }
  })
  const bumpNum = (k: NumKey, dir: -1 | 1) => setS((p) => {
    const val = bump(k, p[k], dir)
    return k === 'mix' ? { ...p, mix: val, o2: val } : { ...p, [k]: val }
  })
  const setCheck = (id: CheckId, v: boolean) => {
    setS((p) => ({ ...p, chk: { ...p.chk, [id]: v } }))
    setNeed((n) => ({ ...n, [id]: false }))
  }
  const go = (i: number) => {
    setS((p) => {
      const step = Math.max(0, Math.min(STEP_COUNT - 1, i))
      return { ...p, step, reached: Math.max(p.reached, step) }
    })
    scrollToTool()
  }
  const flag = (ids: CheckId[]) => setNeed((n) => {
    const out = { ...n }
    ids.forEach((id) => { if (!s.chk[id]) out[id] = true })
    return out
  })
  const next = () => {
    if (s.step === 0 && !startOk) {
      flag(CHECKS_START)
      say(L.toast.checkAll)
      return
    }
    if (s.step === 4 && !s.ini) {
      setNeed((n) => ({ ...n, ini: true }))
      iniRef.current?.focus()
      say(L.toast.ini)
      return
    }
    if (s.step === 5) {
      if (endOk) say(L.toast.done)
      else {
        flag(CHECKS_END)
        say(L.toast.remaining)
      }
      return
    }
    go(s.step + 1)
  }
  const setView = (view: View) => {
    setS((p) => ({ ...p, view }))
    scrollToTool()
  }
  const nextCylinder = () => {
    setS((p) => ({ ...p, o2: p.mix, p: DEFAULT_STATE.p, bloc: '', step: 0, reached: 0, chk: {} }))
    setNeed({})
    scrollToTool()
  }
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      say(L.toast.copied)
    } catch {
      say(L.toast.copyFail)
    }
  }
  const dateTxt = shortDate(s.date)
  const labelText = () => fill(L.copyText.label, { nx: nl, o2: fmt.f1(s.o2), mod: m, pp: fmt.pp(s.pp), p: fmt.r0(s.p), date: dateTxt, ini: s.ini || '—' })
  const regText = () => fill(L.copyText.reg, { date: dateTxt, bloc: s.bloc || '—', nom: s.nom || '—', mix: s.mix, o2: fmt.f1(s.o2), nx: nl, p: fmt.r0(s.p), mod: m, pp: fmt.pp(s.pp) })

  // ── Étiquette : se remplit au fil des étapes atteintes ──
  const small = (u: string) => <small style={{ fontSize: '0.55em', marginLeft: '0.2em' }}>{u}</small>
  const values: Record<LabelField, ReactNode> = {
    type: r >= 1 ? `${L.units.nx} ${nl}` : '',
    o2: r >= 1 ? <>{fmt.f1(s.o2)}{small(L.units.pct)}</> : '',
    mod: r >= 2 ? <>{m}<small style={{ fontSize: '0.4em', marginLeft: '0.2em' }}>{L.units.m}</small></> : '',
    pp: r >= 2 ? fmt.pp(s.pp) : '',
    p: r >= 3 ? <>{fmt.r0(s.p)}{small(L.units.bar)}</> : '',
    date: r >= 4 ? dateTxt : '',
    ini: r >= 4 ? s.ini : '',
  }
  const preview = (
    <div className="lg:sticky lg:order-2" style={{ top: headerH + 16 }}>
      <p className="mb-1.5 flex justify-between gap-2 text-xs font-semibold text-gray-500">
        <span>{s.step < 5 ? L.preview.filling : L.preview.ready}</span>
        <span>{s.step < 5 ? fill(L.preview.step, { n: s.step + 1, total: STEP_COUNT }) : L.preview.done}</span>
      </p>
      <LabelPreview L={L} values={values} highlight={HIGHLIGHT[s.step]} />
    </div>
  )

  const stepperProps = { decreaseLabel: L.stepper.decrease, increaseLabel: L.stepper.increase }
  const nextLabel = s.step === 4 ? L.nav.toLabel : s.step === 5 ? (endOk ? L.nav.finish : L.nav.remaining) : L.nav.next
  const nextWaiting = (s.step === 0 && !startOk) || (s.step === 5 && !endOk)

  // ── Contenu des étapes ──
  const stepBody = (() => {
    switch (s.step) {
      case 0:
        return (
          <Card>
            <SectionHead no={1} title={L.s0.title} help={L.s0.help} chip={fill(L.s0.chip, { n: countChecked(CHECKS_START) })} />
            <ul className="grid gap-1.5">
              {CHECKS_START.map((id) => {
                const c = L.s0.checks[id as keyof typeof L.s0.checks]
                return <Check key={id} checked={!!s.chk[id]} need={!!need[id]} title={c.t} sub={c.s} onChange={(v) => setCheck(id, v)} />
              })}
            </ul>
          </Card>
        )
      case 1:
        return (
          <Card>
            <SectionHead no={2} title={L.s1.title} help={L.s1.help} />
            <SubLabel first>{L.s1.asked}</SubLabel>
            <div className="grid grid-cols-4 gap-1.5 min-[400px]:grid-cols-7">
              {MIXES.map((mx) => {
                const on = s.mix === mx
                return (
                  <button
                    key={mx}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setNum('mix', mx)}
                    className={`min-h-11 rounded-xl border text-[13px] font-extrabold tabular-nums transition-all duration-200 ease-out-expo active:scale-95 ${
                      on ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-gray-50 text-black hover:border-primary'
                    }`}
                  >
                    {L.units.nx}{mx}
                  </button>
                )
              })}
            </div>
            <div className="mt-1.5">
              <Stepper label={L.s1.other} unit={L.units.nx} display={fmt.r0(s.mix)} ariaLabel={L.s1.otherAria}
                onBump={(d) => bumpNum('mix', d)} onSet={(v) => setNum('mix', v)} {...stepperProps} />
            </div>
            <SubLabel>{L.s1.read}</SubLabel>
            <ol className="grid gap-1 text-[13.5px] font-medium text-gray-700">
              {L.s1.how.map((h, i) => (
                <li key={h} className="flex items-baseline gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">{i + 1}</span>
                  {h}
                </li>
              ))}
            </ol>
            <div className="mt-2.5">
              <Stepper label={L.s1.o2} sub={L.s1.o2Sub} unit={L.units.pctO2} display={fmt.f1(s.o2)}
                onBump={(d) => bumpNum('o2', d)} onSet={(v) => setNum('o2', v)} {...stepperProps} />
            </div>
            <div aria-live="polite">
              {ana.level === 'ok' ? (
                <Box tone="ok" title={`✓ ${L.s1.ok}`}>{fill(L.s1.okLine, { gap: fmt.f1(ana.gap), mix: s.mix, tol: TOL })}</Box>
              ) : (
                <Box tone={ana.level} title={`⚠ ${fill(L.s1.gap, { gap: fmt.f1(ana.gap) })}`}>
                  {fill(L.s1.gapLine, { dir: ana.richer ? L.s1.richer : L.s1.leaner, mix: s.mix })}
                </Box>
              )}
              {s.o2 > DECO_O2 && <Box tone="mid" title={`⚠ ${L.s1.decoTitle}`}>{L.s1.decoLine}</Box>}
              <Box>
                <Rich text={fill(L.s1.write, { nx: nl })} />
                {nl !== s.mix && fill(L.s1.writeNot, { mix: s.mix })}
                {nl !== s.o2 ? fill(L.s1.writeRounded, { o2: fmt.f1(s.o2) }) : L.s1.writeEnd}
                {L.s1.writeTail}
              </Box>
            </div>
          </Card>
        )
      case 2:
        return (
          <Card>
            <SectionHead no={3} title={L.s2.title} help={L.s2.help} />
            <div className="grid grid-cols-2 gap-2">
              {PP_CHOICES.map((pp, i) => {
                const on = s.pp === pp
                return (
                  <button
                    key={pp}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setNum('pp', pp)}
                    className={`flex flex-col items-center rounded-xl border-2 px-3 py-3 text-center transition-all duration-200 ease-out-expo active:scale-[0.98] ${
                      on ? 'border-primary bg-primary-50' : 'border-transparent bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-500">{fill(L.s2.modAt, { pp: fmt.pp(pp) })}</span>
                    <span key={`${pp}-${nl}`} className="animate-number-pop tabular-nums text-[34px] font-extrabold leading-tight tracking-[-0.02em] text-black">
                      {modLabel(pp, s.o2)} <span className="text-base font-semibold tracking-normal text-gray-500">{L.units.m}</span>
                    </span>
                    <span className="text-xs font-medium text-gray-500">{i === 0 ? L.s2.pp14 : L.s2.pp16}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-2">
              <Stepper label={L.s2.other} unit={L.units.bar} display={fmt.pp(s.pp)} ariaLabel={L.s2.otherAria}
                onBump={(d) => bumpNum('pp', d)} onSet={(v) => setNum('pp', v)} {...stepperProps} />
            </div>
            <Box><Rich text={fill(L.s2.box, { mod: m, pp: fmt.pp(s.pp) })} /></Box>
            <LawNote className="mt-2.5" title={L.s2.lawTitle}
              text={fill(L.s2.law, { nx: nl, pp: fmt.pp(s.pp), abs: fmt.two(Math.round(s.pp / (nl / 100) * 100) / 100), mod: m })} />
          </Card>
        )
      case 3:
        return (
          <Card>
            <SectionHead no={4} title={L.s3.title} help={L.s3.help} />
            <Stepper label={L.s3.field} sub={L.s3.sub} unit={L.units.bar} display={fmt.r0(s.p)}
              onBump={(d) => bumpNum('p', d)} onSet={(v) => setNum('p', v)} {...stepperProps} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESSURES.map((p) => <Pill key={p} on={s.p === p} onClick={() => setNum('p', p)}>{p} {L.units.bar}</Pill>)}
            </div>
          </Card>
        )
      case 4:
        return (
          <Card>
            <SectionHead no={5} title={L.s4.title} help={L.s4.help} />
            <div className="grid gap-1.5">
              <TextField label={L.s4.ini} value={s.ini} placeholder={L.s4.iniPh} maxLength={4} autoComplete="off" inputRef={iniRef}
                need={!s.ini && !!need.ini}
                onChange={(v) => {
                  setS((p) => ({ ...p, ini: v.toUpperCase().trim() }))
                  setNeed((n) => ({ ...n, ini: false }))
                }} />
              <TextField label={L.s4.date} type="date" value={s.date} onChange={(v) => setS((p) => ({ ...p, date: v }))} />
            </div>
          </Card>
        )
      default:
        return (
          <Card>
            <SectionHead no={6} title={L.s5.title} help={L.s5.help} chip={fill(L.s5.chip, { n: countChecked(CHECKS_END) })} />
            <ul className="grid gap-1.5">
              <Check checked={!!s.chk.copy} need={!!need.copy} title={L.s5.checks.copy.t} sub={L.s5.checks.copy.s} onChange={(v) => setCheck('copy', v)} />
              <Check checked={!!s.chk.reg} need={!!need.reg} title={L.s5.checks.reg.t} sub={L.s5.checks.reg.s} onChange={(v) => setCheck('reg', v)}>
                <button type="button" onClick={(e) => { e.preventDefault(); setView('reg') }}
                  className="mt-1 block min-h-8 text-[13px] font-semibold text-primary underline underline-offset-2">
                  {L.s5.seeReg}
                </button>
              </Check>
              <Check checked={!!s.chk.ordi} need={!!need.ordi} title={L.s5.checks.ordi.t}
                sub={fill(L.s5.checks.ordi.s, { o2: nc, pp: fmt.pp(s.pp) })} onChange={(v) => setCheck('ordi', v)} />
            </ul>
            {nl !== nc && (
              <div className="mt-3 text-[13px]">
                {[
                  [L.s5.ruleLabel, `${L.units.nx} ${nl}`, L.s5.ruleLabelSub],
                  [L.s5.ruleComputer, `${nc} ${L.units.pct}`, L.s5.ruleComputerSub],
                ].map(([k, v, sub], i) => (
                  <div key={k} className={`grid grid-cols-[1fr_auto] items-baseline gap-x-2.5 gap-y-0.5 py-1.5 ${i ? 'border-t border-gray-200' : ''}`}>
                    <span className="font-semibold text-gray-700">{k}</span>
                    <b className="text-lg font-extrabold tabular-nums text-black">{v}</b>
                    <small className="col-span-2 text-xs font-medium text-gray-500">{sub}</small>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => copy(labelText())} className={secondaryBtn}>{L.s5.copy}</button>
              <button type="button" onClick={nextCylinder} className={secondaryBtn}>{L.s5.next}</button>
            </div>
            <p className={`mt-2.5 ${T.small}`}>{L.s5.foot}</p>
          </Card>
        )
    }
  })()

  // ── Registre ──
  const regDone = r >= 4 && !!s.ini
  const todo = <b className="text-[12.5px] font-semibold text-amber-700">{L.reg.todo}</b>
  const byBlender = <b className="text-[12.5px] font-medium text-gray-400">{L.reg.byBlender}</b>
  const hand = (v: string) => <b style={{ fontFamily: HAND_FONT, color: LABEL_INK }} className="text-right text-base font-bold">{v}</b>
  const row = (id: string, k: string, v: ReactNode) => (
    <div key={id} className="flex items-baseline justify-between gap-3 border-t border-gray-200 px-3 py-2">
      <span className="text-[13px] font-medium text-gray-700">{k}</span>
      {v}
    </div>
  )
  const grp = (t: string) => <p className="bg-gray-100 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">{t}</p>
  const R = L.reg.rows

  return (
    <div ref={rootRef} className="pb-24 lg:pb-0">
      {/* Étiquette / Registre */}
      <div role="tablist" aria-label={L.views.aria} className="mb-4 grid max-w-[520px] grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {(['eti', 'reg'] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={s.view === v}
            onClick={() => setView(v)}
            className={`min-h-10 rounded-lg text-sm font-semibold transition-all duration-200 ease-out-expo ${
              s.view === v ? 'bg-white text-black shadow-soft' : 'text-gray-500 hover:text-black'
            }`}
          >
            {L.views[v]}
          </button>
        ))}
      </div>

      {s.view === 'eti' ? (
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_520px] lg:items-start lg:gap-7">
          {preview}

          <div className="min-w-0 lg:order-1">
            {/* Progression */}
            <nav aria-label={L.progressAria} className="mb-3 grid grid-cols-6 gap-1">
              {L.steps.map((name, i) => {
                const on = i === s.step
                const done = i <= r && !on
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={i > r}
                    aria-current={on ? 'step' : undefined}
                    onClick={() => go(i)}
                    className={`min-w-0 text-left text-[11px] font-semibold disabled:cursor-default ${on ? 'text-primary' : done ? 'text-gray-700' : 'text-gray-400'}`}
                  >
                    <i className={`mb-1 block h-1.5 rounded-full transition-colors duration-300 ${on ? 'bg-primary' : done ? 'bg-primary-200' : 'bg-gray-200'}`} />
                    <span className="block truncate">{name}</span>
                  </button>
                )
              })}
            </nav>

            <div key={s.step} className="animate-fade-in">{stepBody}</div>

            {/* Navigation : barre fixe en bas sur mobile, sous l'étape sur ordi */}
            <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-gray-200 bg-white/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:static lg:mt-3 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
              <button
                type="button"
                aria-label={L.nav.back}
                disabled={s.step === 0}
                onClick={() => go(s.step - 1)}
                className="min-h-12 rounded-xl border border-gray-200 bg-gray-50 px-5 text-lg font-bold text-black transition-all duration-200 ease-out-expo hover:border-primary disabled:opacity-35 disabled:hover:border-gray-200"
              >
                ←
              </button>
              <button
                type="button"
                onClick={next}
                className={`min-h-12 flex-1 rounded-xl bg-primary px-5 text-[15px] font-bold text-white transition-all duration-200 ease-out-expo hover:bg-primary-600 active:scale-[0.98] ${PRIMARY_SHADOW} ${nextWaiting ? 'opacity-55' : ''}`}
              >
                {nextLabel}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-[640px]">
          <Card>
            <SectionHead no="✎" title={L.reg.title} help={L.reg.help} />
            {!regDone && <Box tone="mid" title={L.reg.warnTitle} className="!mt-0 mb-3">{L.reg.warnLine}</Box>}
            <div className="grid gap-1.5 sm:grid-cols-2">
              <TextField label={L.reg.bloc} value={s.bloc} placeholder={L.reg.blocPh} maxLength={12} autoComplete="off" need={!s.bloc}
                onChange={(v) => setS((p) => ({ ...p, bloc: v.toUpperCase().trim() }))} />
              <TextField label={L.reg.nom} value={s.nom} placeholder={L.reg.nomPh} maxLength={40} autoComplete="name" need={!s.nom}
                onChange={(v) => setS((p) => ({ ...p, nom: v }))} />
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-300 bg-white">
              <p className="flex justify-between gap-2 bg-black px-3 py-2 text-xs font-extrabold uppercase tracking-wider text-white">
                {L.reg.line}<span className="font-semibold normal-case tracking-normal opacity-75">{dateTxt}</span>
              </p>
              {grp(L.reg.blender)}
              {row('blendMix', R.blendMix, byBlender)}
              {row('blendO2', R.blendO2, byBlender)}
              {row('blendP', R.blendP, byBlender)}
              {row('blendName', R.blendName, byBlender)}
              {grp(L.reg.diver)}
              {row('date', R.date, hand(dateTxt))}
              {row('bloc', R.bloc, s.bloc ? hand(s.bloc) : todo)}
              {row('nom', R.nom, s.nom.trim() ? hand(s.nom.trim()) : todo)}
              {row('asked', R.asked, hand(`${L.units.nx} ${s.mix}`))}
              {row('o2', R.o2, r >= 1 ? hand(`${fmt.f1(s.o2)} ${L.units.pct}`) : todo)}
              {row('kept', R.kept, r >= 1 ? hand(`${L.units.nx} ${nl}`) : todo)}
              {row('p', R.p, r >= 3 ? hand(`${fmt.r0(s.p)} ${L.units.bar}`) : todo)}
              {row('mod', R.mod, r >= 2 ? hand(`${m} ${L.units.m} · ppO2 ${fmt.pp(s.pp)}`) : todo)}
              {row('sign', R.sign, <b className="text-[12.5px] font-semibold text-amber-700">{L.reg.byHand}</b>)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => copy(regText())} className={secondaryBtn}>{L.reg.copy}</button>
              <button type="button" onClick={() => setView('eti')} className={secondaryBtn}>{L.reg.back}</button>
            </div>
          </Card>
        </div>
      )}

      {/* Toast */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-[calc(84px+env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full bg-black px-4 py-2 text-[13px] font-semibold text-white transition-opacity duration-200 lg:bottom-6 ${
          toast ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {toast?.msg}
      </div>
    </div>
  )
}

const secondaryBtn = 'min-h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-black shadow-soft transition-all duration-200 ease-out-expo hover:border-primary hover:text-primary active:scale-[0.98]'
