'use client'

import { useEffect, useRef } from 'react'
import type fr from '@/i18n/dictionaries/fr'
import { mountSaturation } from '@/lib/saturation-azote/ui'
import './saturation-azote.css'

type Labels = typeof fr.saturation

/**
 * Saturation en azote. Le squelette est rendu en JSX ; les graphiques SVG animés, les steppers et
 * la lecture sont pilotés par `mountSaturation` (port du script du modèle), monté une seule fois.
 */
export default function NitrogenSaturation({ labels, locale }: { labels: Labels; locale: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const L = labels.ui

  useEffect(() => {
    if (!rootRef.current) return
    return mountSaturation(rootRef.current, labels.ui, locale)
  }, [labels, locale])

  return (
    <div ref={rootRef} className="sa">
      {/* ============ 1. RÉGLAGES ============ */}
      <section className="card" id="sa-setCard">
        <div className="step"><i>1</i><h2>{L.step1Title}</h2></div>
        <p className="lead"><span id="sa-leadN">{L.leadSimple}</span> {L.leadTail}</p>

        <div className="set">
          <span className="k">{L.depth}</span><span className="big" id="sa-vDepth" />
          <input className="full" type="range" id="sa-rDepth" min={5} max={60} step={1} aria-label={L.depth} defaultValue={40} />
          <span className="why">{L.depthWhy}</span>
        </div>
        <div className="set">
          <span className="k">{L.time}</span><div id="sa-stpTime" />
          <span className="why">{L.timeWhy}</span>
        </div>
        <div className="set" id="sa-gasSet">
          <span className="k">{L.gas}</span><span className="tag" id="sa-bgMod" />
          <div className="pills full" id="sa-bgPills" />
          <div className="full o2row" id="sa-bgO2Row"><span>{L.o2Pct}</span><div id="sa-stpBgO2" /></div>
          <span className="why">{L.gasWhy}</span>
        </div>
        <div id="sa-checks" />

        <details className="more" id="sa-more">
          <summary>{L.more} <span id="sa-moreSum" /></summary>
          <div className="in">
            <div className="set">
              <span className="k">{L.stops}</span><button className="addbtn" type="button" id="sa-addStop">{L.addStop}</button>
              <div className="stops full" id="sa-stops" />
              <span className="why">{L.stopsWhy}</span>
            </div>
            <div className="set">
              <span className="k">{L.decoGas}</span><span className="tag" id="sa-dcMod" />
              <div className="pills full" id="sa-dcPills" />
              <div className="full o2row" id="sa-dcO2Row"><span>{L.o2Pct}</span><div id="sa-stpDcO2" /></div>
              <span className="why">{L.decoWhy}</span>
              <div className="full o2row" id="sa-swRow"><span>{L.switchAt}</span><div id="sa-stpSw" /></div>
            </div>
            <div className="set">
              <span className="k">{L.surf}</span><div id="sa-stpSurf" />
              <span className="why">{L.surfWhy}</span>
            </div>
            <div className="set">
              <span className="k">{L.asc}</span><div id="sa-stpAsc" />
              <span className="why">{L.ascWhy}</span>
            </div>
            <div className="set">
              <span className="k">{L.pp}</span>
              <span className="pps"><span id="sa-stpPpB" /><span id="sa-stpPpD" /></span>
              <span className="why">{L.ppWhy}</span>
            </div>
            <div className="set">
              <span className="k">{L.sp}</span><div id="sa-stpSp" />
              <span className="why">{L.spWhy}</span>
            </div>
          </div>
        </details>
      </section>

      {/* ============ 2. LE GRAPHIQUE ============ */}
      <section className="card">
        <div className="row-top">
          <div className="step"><i id="sa-step2N">2</i><h2>{L.step2Title}</h2></div>
          <div className="seg" id="sa-modeSeg" role="group" aria-label={L.modesAria}>
            <button type="button" data-mode="peda">{L.modes.peda}</button>
            <button type="button" data-mode="simple">{L.modes.simple}</button>
            <button type="button" data-mode="adv">{L.modes.adv}</button>
          </div>
        </div>
        <div className="legend2" id="sa-legTop">
          <span id="sa-lgAmb" />
          <span><i style={{ background: 'var(--n2)' }} /><span dangerouslySetInnerHTML={{ __html: L.legendBody }} /></span>
        </div>
        <div className="chart-head"><span>{L.depth}</span><span id="sa-chartAmb" /></div>
        <div className="prof-wrap" id="sa-profWrap"><svg id="sa-prof" role="img" aria-label={L.chartAria} /></div>
        <div id="sa-gauge" />
        <div className="legend2 small">
          <span id="sa-lgItemC"><i className="grad" id="sa-lgChargeI" /><span id="sa-lgCharge">{L.legendCharge}</span></span>
          <span id="sa-lgItemE"><i style={{ background: 'var(--down)' }} /><span>{L.legendEmpty}</span></span>
          <span id="sa-lgPlus" />
        </div>
        <p className="say" id="sa-say" aria-live="polite" />
        <p className="say2" id="sa-say2" />
        <div className="transport">
          <button className="tbtn play" type="button" id="sa-play" aria-label={L.play} />
          <button className="tbtn" type="button" id="sa-reset" aria-label={L.reset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4h4" /></svg>
          </button>
          <input type="range" id="sa-tSlider" min={0} max={1000} step={1} aria-label={L.timeSlider} defaultValue={0} />
          <span className="tlabel" id="sa-tLabel" />
        </div>
        <div className="speed" id="sa-speedRow">
          {L.speed}
          <span className="seg" id="sa-speedSeg">
            <button type="button" data-v="1">{L.speeds[0]}</button>
            <button type="button" data-v="2">{L.speeds[1]}</button>
            <button type="button" data-v="5">{L.speeds[2]}</button>
          </span>
        </div>
        <div className="cmp" id="sa-cmpAir" hidden>
          <h3 id="sa-cmpTitle" />
          <div className="cmp-vals" id="sa-cmpVals" />
          <div id="sa-cmpChart" />
          <ul className="cmp-facts" id="sa-cmpFacts" />
        </div>
        <p className="note" id="sa-advNote" hidden dangerouslySetInnerHTML={{ __html: L.advNote }} />
      </section>

      <div id="sa-advView" hidden>
        <details className="card info" id="sa-dCurves">
          <summary>{L.curvesTitle}</summary>
          <div className="body">
            <div className="vals" id="sa-gVals" />
            <div id="sa-gChart" />
            <p className="note">{L.curvesNote}</p>
          </div>
        </details>
        <details className="card info" id="sa-d16">
          <summary>{L.d16Title}</summary>
          <div className="body">
            <p style={{ marginTop: 0 }}>{L.d16Intro}</p>
            <div id="sa-bars" />
            <h4 id="sa-selTitle" />
            <div className="csel" id="sa-csel" />
            <div className="kpis" id="sa-kpis" />
            <div className="vals" id="sa-cVals" />
            <div id="sa-cChart" />
            <div className="tablewrap"><table className="ct" id="sa-ctab" /></div>
          </div>
        </details>
        <section className="card buhl">
          <h2>{labels.buhl.title}</h2>
          {labels.buhl.sections.map((s) => (
            <div key={s.h}>
              <h3>{s.h}</h3>
              {s.p.map((p, i) => <p key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
