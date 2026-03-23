'use client'

import { useState } from 'react'

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

const PPO2_HINTS: Record<number, string> = {
  1.2: 'Très conservateur — profils longs ou technique',
  1.4: 'Recommandé pour la plongée loisir',
  1.5: 'Limite recommandée PADI / SSI',
  1.6: 'Maximum absolu NOAA — ne pas maintenir',
}

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
  safe: 'border-gray-200 bg-white',
  warning: 'border-amber-200 bg-amber-50',
  danger: 'border-red-200 bg-red-50',
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
    <div className={`rounded-xl border p-4 transition-colors ${alertCard[alert]}`}>
      <p className="mb-1 text-xs font-medium text-gray-400">{label}</p>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-mono text-3xl font-bold leading-none ${
            alert !== 'safe' ? alertText[alert] : 'text-black'
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {sub && (
        <p
          className={`mt-1.5 text-xs leading-relaxed ${
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
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium text-gray-700">
          {label}
        </label>
        <span className="font-mono font-semibold text-black tabular-nums">
          {value}
          {unit}
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
      />
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
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
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

// ── Main component ────────────────────────────────────────────────────────────
export default function NitroxCalculator() {
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
    { id: 'calc', label: 'Calculateur' },
    { id: 'bestmix', label: 'Meilleur mélange' },
    { id: 'cns', label: 'Toxicité CNS' },
  ]

  return (
    <div className="animate-fade-in">
      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1 — Main calculator ────────────────────────────── */}
      {tab === 'calc' && (
        <div className="space-y-6 animate-slide-up">
          {/* Mix */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Mélange (FO&#8322;)
            </p>
            <SliderRow
              label="Fraction O\u2082"
              id="fo2"
              min={21}
              max={40}
              step={0.5}
              value={fo2}
              unit="%"
              onChange={setFo2}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {[21, 28, 32, 36, 40].map((v) => (
                <button
                  key={v}
                  onClick={() => setFo2(v)}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                    fo2 === v
                      ? 'bg-primary text-white'
                      : 'border border-gray-200 bg-white text-gray-500 hover:border-primary hover:text-primary'
                  }`}
                >
                  EANx{v}
                </button>
              ))}
            </div>
          </div>

          {/* PPO2 max */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              PPO&#8322; maximale
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[1.2, 1.4, 1.5, 1.6].map((v) => (
                <button
                  key={v}
                  onClick={() => setPpo2(v)}
                  className={`rounded-xl border py-2.5 font-mono text-sm font-semibold transition-all ${
                    ppo2 === v
                      ? v >= 1.6
                        ? 'border-red-300 bg-red-50 text-red-600'
                        : 'border-primary bg-primary-50 text-primary'
                      : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:text-gray-600'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">{PPO2_HINTS[ppo2]}</p>
          </div>

          {/* MOD results */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Profondeur maximale
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="MOD"
                value={mod.toFixed(1)}
                unit="m"
                sub={`Formule : (${ppo2} / ${fo2Frac.toFixed(2)} − 1) × 10`}
              />
              <StatCard
                label="PO\u2082 à la MOD"
                value={po2AtMod.toFixed(2)}
                unit="bar"
                sub="Vérification : FO\u2082 × (MOD/10 + 1)"
              />
            </div>
            {/* Visual bar */}
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="mb-1 flex justify-between text-xs text-gray-400">
                <span>0 m</span>
                <span>MOD : {mod.toFixed(1)} m</span>
                <span>60 m</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min((mod / 60) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Depth */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Profondeur prévue
            </p>
            <SliderRow
              label="Profondeur"
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
              Résultats à {depth} m
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="EAD (profondeur air équiv.)"
                value={ead.toFixed(1)}
                unit="m"
                sub={
                  parseFloat(eadSaving) > 0
                    ? `−${eadSaving} m vs air`
                    : "Équivalent à l'air"
                }
              />
              <StatCard
                label="PO\u2082 à cette profondeur"
                value={po2AtDepth.toFixed(2)}
                unit="bar"
                alert={depthAlertLevel}
                sub={
                  depthAlertLevel === 'danger'
                    ? 'DANGER — dépasse 1.6 bar'
                    : depthAlertLevel === 'warning'
                    ? 'Attention — au-delà de la PPO\u2082 cible'
                    : 'Dans les limites'
                }
              />
            </div>

            {/* Status banner */}
            <div
              className={`mt-3 rounded-xl border p-4 text-sm leading-relaxed ${alertBanner[depthAlertLevel]}`}
            >
              {depth > mod ? (
                <span className="text-red-600">
                  La profondeur {depth} m dépasse la MOD de {mod.toFixed(1)} m.
                  PPO&#8322; = {po2AtDepth.toFixed(2)} bar —{' '}
                  <strong>DANGEREUX</strong>.
                </span>
              ) : depth > mod * 0.9 ? (
                <span className="text-amber-600">
                  Proche de la MOD — il reste {(mod - depth).toFixed(1)} m de
                  marge. Restez vigilant.
                </span>
              ) : (
                <span className="text-green-600">
                  Profondeur sûre — {(mod - depth).toFixed(1)} m de marge
                  jusqu&apos;à la MOD.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2 — Best mix ───────────────────────────────────── */}
      {tab === 'bestmix' && (
        <div className="space-y-6 animate-slide-up">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Paramètres
            </p>
            <div className="grid grid-cols-2 gap-4">
              <NumInput
                label="Profondeur cible"
                value={targetDepth}
                min={5}
                max={60}
                step={1}
                unit="m"
                onChange={setTargetDepth}
              />
              <NumInput
                label="PPO\u2082 cible"
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
              Résultat
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Meilleur mélange (FO\u2082)"
                value={bestFo2.toFixed(1)}
                unit="%"
                sub={
                  rawBestFo2 > 40
                    ? 'Plafonné à EANx40'
                    : rawBestFo2 < 21
                    ? 'Minimum : air (21%)'
                    : `EANx${Math.round(bestFo2)} — optimal pour ${targetDepth} m`
                }
              />
              <StatCard
                label="MOD de ce mélange"
                value={bestMod.toFixed(1)}
                unit="m"
                sub={`Avec PPO\u2082 max ${targetPpo2} bar`}
              />
            </div>

            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              {bestFo2 >= 36
                ? `EANx${Math.round(bestFo2)} est un mélange très enrichi. Bénéfices décompression optimaux pour ${targetDepth} m. Vérifiez la compatibilité O\u2082 de votre équipement.`
                : bestFo2 >= 30
                ? `EANx${Math.round(bestFo2)} — bon équilibre enrichissement / disponibilité. Standard pour la plongée tropicale entre 25 et 35 m.`
                : `EANx${Math.round(bestFo2)} — enrichissement modéré. Pour profiter pleinement du nitrox, envisagez un mélange plus riche si la profondeur le permet.`}
            </div>
          </div>

          {/* Reference table */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Tableau de référence — MOD par mélange
            </p>
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-400">
                      Mélange
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">
                      MOD 1.4 bar
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-400">
                      MOD 1.6 bar
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
                        className={`border-b border-gray-100 last:border-0 transition-colors ${
                          isHighlighted ? 'bg-primary-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td
                          className={`px-4 py-2.5 font-mono font-medium ${
                            isHighlighted ? 'text-primary' : 'text-gray-700'
                          }`}
                        >
                          EANx{mix}
                          {isHighlighted && (
                            <span className="ml-2 text-xs font-normal text-primary opacity-60">
                              &larr; recommandé
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                          {m14} m
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-400">
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
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
              Paramètres de la plongée
            </p>
            <div className="grid grid-cols-2 gap-4">
              <NumInput
                label="FO\u2082 du mélange"
                value={cnsFo2}
                min={21}
                max={40}
                step={0.5}
                unit="%"
                onChange={setCnsFo2}
              />
              <NumInput
                label="Profondeur"
                value={cnsDepth}
                min={5}
                max={60}
                step={1}
                unit="m"
                onChange={setCnsDepth}
              />
              <NumInput
                label="Durée de la plongée"
                value={cnsTime}
                min={1}
                max={240}
                step={1}
                unit="min"
                onChange={setCnsTime}
              />
              <NumInput
                label="% CNS initial"
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
              Résultats
            </p>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="PPO\u2082 calculée"
                value={cnsPpo2 > 1.6 ? '> 1.6' : cnsPpo2.toFixed(2)}
                unit="bar"
                alert={getAlertLevel(cnsPpo2)}
              />
              <StatCard
                label="Limite NOAA à cette PPO\u2082"
                value={cnsPpo2 > 1.6 ? '—' : String(cnsLimit)}
                unit={cnsPpo2 > 1.6 ? '' : 'min'}
                sub={
                  cnsPpo2 > 1.6
                    ? 'Hors table NOAA'
                    : `Pour PPO\u2082 = ${(Math.round(cnsPpo2 * 10) / 10).toFixed(1)} bar`
                }
              />
            </div>

            {/* CNS bar */}
            <div
              className={`mt-3 rounded-xl border p-4 ${alertCard[cnsAlertLevel]}`}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-xs font-medium text-gray-400">
                  CNS total après cette plongée
                </p>
                <span
                  className={`font-mono text-2xl font-bold ${
                    alertText[cnsAlertLevel] || 'text-black'
                  }`}
                >
                  {cnsPpo2 > 1.6 ? '—' : `${cnsTotal.toFixed(1)} %`}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full transition-all duration-500"
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
              <div className="mt-1.5 flex justify-between text-xs text-gray-400">
                <span>0 %</span>
                <span>80 % recommandé / jour</span>
                <span>100 %</span>
              </div>
            </div>

            {/* CNS message */}
            <div
              className={`mt-3 rounded-xl border p-4 text-sm leading-relaxed ${alertBanner[cnsAlertLevel]}`}
            >
              {cnsPpo2 > 1.6 ? (
                <span className="text-red-600">
                  PPO&#8322; dépasse 1.6 bar — hors limites NOAA. Cette profondeur
                  n&apos;est pas plongeable en nitrox avec ce mélange.
                </span>
              ) : cnsTotal > 100 ? (
                <span className="text-red-600">
                  CNS total de {cnsTotal.toFixed(1)} % — dépasse 100 %. Risque de
                  convulsions O&#8322;. Réduisez la durée ou la profondeur.
                </span>
              ) : cnsTotal > 80 ? (
                <span className="text-amber-600">
                  CNS de {cnsTotal.toFixed(1)} % — proche de la limite journalière
                  recommandée (80 %). Évitez une plongée supplémentaire sans
                  récupération.
                </span>
              ) : (
                <span className="text-green-600">
                  CNS de {cnsTotal.toFixed(1)} % — dans les limites acceptables.
                  Marge restante : {(80 - cnsTotal).toFixed(1)} % avant le seuil de
                  80 %.
                </span>
              )}
            </div>

            {/* NOAA mini table */}
            <div className="mt-4">
              <p className="mb-2 text-xs text-gray-400">
                Table NOAA — limites d&apos;exposition
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-400">
                        PPO&#8322;
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-400">
                        Limite unique
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-400">
                        % CNS / min
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {NOAA_TABLE.slice(4).map((row) => {
                      const isActive = Math.abs(cnsPpo2 - row.ppo2) < 0.05
                      return (
                        <tr
                          key={row.ppo2}
                          className={`border-b border-gray-100 last:border-0 ${
                            isActive ? 'bg-primary-50' : ''
                          }`}
                        >
                          <td
                            className={`px-3 py-1.5 font-mono ${
                              isActive
                                ? 'font-semibold text-primary'
                                : 'text-gray-600'
                            }`}
                          >
                            {row.ppo2.toFixed(1)} bar
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-gray-600">
                            {row.time} min
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-gray-400">
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
