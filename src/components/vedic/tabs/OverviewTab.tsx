import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ordinal } from '../../../astro/constants'
import { useSettings } from '../../../lib/settings'
import { runningAge, varshaphal } from '../../../vedic/annual'
import { periodChain } from '../../../vedic/dasha'
import type { VedicReading } from '../../../vedic/interpret'
import { REPORTS, buildReport } from '../../../vedic/reports'
import type { VedicChart } from '../../../vedic/sidereal'
import { monthlyOutlook, sadeSati } from '../../../vedic/transits'
import { yogaTone } from '../../../vedic/yogas'
import Cards from '../Cards'
import { ConditionBar } from '../ReportParts'
import { fmtDate } from '../format'
import type { Tab } from '../VedicView'

/** A summary of the chart. Each item links to the tab or page with the full detail. */
export default function OverviewTab({ chart, reading, hash, go }: { chart: VedicChart; reading: VedicReading; hash: string; go: (t: Tab) => void }) {
  const { settings } = useSettings()
  const now = useMemo(() => new Date(), [])
  const areas = useMemo(
    () => (chart.timeKnown ? REPORTS.map((r) => ({ ...r, report: buildReport(r.key, chart, settings.gender, reading.yogas) })) : []),
    [chart, reading.yogas, settings.gender],
  )
  const chain = periodChain(reading.dashas, now, 3)
  const month = useMemo(() => monthlyOutlook(chart, now, 1)[0], [chart, now])
  const ss = useMemo(() => sadeSati(chart, now), [chart, now])
  const year = useMemo(() => (chart.timeKnown ? varshaphal(chart, runningAge(chart, now)) : null), [chart, now])
  const yogas = reading.yogas.filter((y) => y.present && yogaTone(y) === 'good' && y.def.group !== 'Nabhasa')

  return (
    <>
      {areas.length > 0 && (
        <>
          <h2 className="section-title first">Life areas</h2>
          <p className="muted small">Classical conditions checked for each area, and how many apply. Each report explains its rules; counts are not comparable between areas.</p>
          <div className="area-grid">
            {areas.map((a) => a.report && (
              <Link key={a.key} className="card area-card" to={{ pathname: `/chart/${a.key}`, hash }}>
                <span className="area-head"><strong>{a.title}</strong></span>
                <ConditionBar c={a.report.conditions} />
                <span className="area-counts small"><span className="pos">{a.report.conditions.supportive} supportive</span><span className="neg">{a.report.conditions.challenging} challenging</span><span className="muted">of {a.report.conditions.checked} checked</span></span>
                <span className="muted small">{a.summary}</span>
                <span className="area-open">Open report</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">Right now</h2>
      <ul className="now-list card">
        {chain.length > 0 && (
          <li>
            <span className="now-label">Dasha</span>
            <span>{chain.map((p) => p.lord).join(' / ')} <span className="muted small">until {fmtDate(chain[chain.length - 1].end)}</span></span>
            <button className="linklike" onClick={() => go('dasha')}>Dasha details</button>
          </li>
        )}
        <li>
          <span className="now-label">Transits</span>
          <span>{month.good.length} supportive, {month.hard.length} difficult transits this month <span className="muted small">{month.good.length ? `(supportive: ${month.good.join(', ')})` : ''}</span></span>
          <button className="linklike" onClick={() => go('transits')}>Transit details</button>
        </li>
        <li>
          <span className="now-label">Sade Sati</span>
          <span>{ss.active ? `Running, ${ss.active.phase} phase until ${fmtDate(ss.active.end)}` : ss.cycle.length ? `Next from ${fmtDate(ss.cycle[0].start)}` : 'Not within the next 30 years'}</span>
          <button className="linklike" onClick={() => go('transits')}>Saturn transit</button>
        </li>
        {year && (
          <li>
            <span className="now-label">This year</span>
            <span>Year lord {year.yearLord}, Muntha in the {ordinal(year.muntha.house)} house <span className="muted small">(from {fmtDate(year.start)})</span></span>
            <Link to={{ pathname: '/chart/annual', hash }}>Annual chart</Link>
          </li>
        )}
      </ul>

      <h2 className="section-title">Foundations</h2>
      <Cards items={reading.core} />

      <h2 className="section-title">Main yogas</h2>
      {yogas.length ? (
        <ul className="chip-list">
          {yogas.map((y) => <li key={y.def.id}><button className="chip" onClick={() => go('yogas')}>{y.def.name}</button></li>)}
        </ul>
      ) : <p className="muted">No major supportive yogas.</p>}
      <p className="small"><button className="linklike" onClick={() => go('yogas')}>All {reading.yogas.length} yogas checked, with their rules</button></p>
    </>
  )
}
