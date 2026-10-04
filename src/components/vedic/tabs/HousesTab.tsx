import { useMemo, useState } from 'react'
import { ordinal } from '../../../astro/constants'
import { BHAVA, GRAHA_INFO, SIGN_LORD } from '../../../vedic/constants'
import type { VedicReading } from '../../../vedic/interpret'
import { bhavaChalit, kpChart } from '../../../vedic/kp'
import { occupants, pos } from '../../../vedic/query'
import type { VedicChart } from '../../../vedic/sidereal'
import { bhavaBala } from '../../../vedic/strength'
import Segmented from '../../Segmented'
import Cards from '../Cards'
import { ChartStyleToggle } from '../ChartPair'
import SquareChart from '../SquareChart'
import { useSettings } from '../../../lib/settings'
import { fmtLon, rashiName } from '../format'

type View = 'lords' | 'chalit' | 'kp'

export default function HousesTab({ chart, reading }: { chart: VedicChart; reading: VedicReading }) {
  const [view, setView] = useState<View>('lords')
  if (!reading.lords.length) return <p className="muted">Houses need a birth time.</p>
  return (
    <>
      <div className="subnav">
        <Segmented label="House view" value={view} onChange={setView} options={[['lords', 'Lords and strength'], ['chalit', 'Bhava Chalit'], ['kp', 'KP cusps']]} />
      </div>
      {view === 'lords' && <Lords chart={chart} reading={reading} />}
      {view === 'chalit' && <ChalitView chart={chart} />}
      {view === 'kp' && <KpView chart={chart} />}
    </>
  )
}

function Lords({ chart, reading }: { chart: VedicChart; reading: VedicReading }) {
  const bb = useMemo(() => bhavaBala(chart), [chart])
  const rank = bb ? [...bb].sort((a, b) => b.total - a.total).map((b) => b.house) : []
  return (
    <>
      <div className="card table-wrap">
        <table className="data-table">
          <caption className="sr-only">Houses</caption>
          <thead><tr><th>House</th><th>Sign</th><th>Lord</th><th>Lord in</th><th>Occupants</th>{bb && <th>Bhava bala</th>}{bb && <th>Rank</th>}</tr></thead>
          <tbody>
            {BHAVA.map((b, i) => {
              const sign = (chart.lagnaSign! + i) % 12
              const lord = SIGN_LORD[sign]
              return (
                <tr key={i}>
                  <td>{ordinal(i + 1)} <span className="muted small">{b.short}</span></td>
                  <td>{rashiName(sign)}</td>
                  <td>{lord}</td>
                  <td>{ordinal(pos(chart, lord).house!)}</td>
                  <td>{occupants(chart, i + 1).map((g) => GRAHA_INFO[g].abbr).join(' ') || ''}</td>
                  {bb && <td className="num">{bb[i].rupas.toFixed(2)}</td>}
                  {bb && <td className="num">{rank.indexOf(i + 1) + 1}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
        {bb && <p className="muted small">Bhava bala in rupas: the lord's Shadbala plus directional strength by sign type plus aspects on the house middle (BPHS 28).</p>}
      </div>
      <p className="muted">Each house is ruled by the lord of its sign. Where that lord sits shows how the house's matters develop.</p>
      <Cards items={reading.lords} list />
    </>
  )
}

function ChalitView({ chart }: { chart: VedicChart }) {
  const { settings } = useSettings()
  const c = useMemo(() => bhavaChalit(chart), [chart])
  if (!c) return <p className="muted">Needs a birth time.</p>
  const moved = chart.grahas.filter((g) => c.planetHouse[g.graha] !== g.house)
  const items = [
    { sign: chart.lagnaSign!, label: 'Asc', title: 'Lagna', tone: 'asc' as const },
    ...chart.grahas.map((g) => ({ sign: (chart.lagnaSign! + c.planetHouse[g.graha] - 1) % 12, label: GRAHA_INFO[g.graha].abbr, title: `${g.graha} in bhava ${c.planetHouse[g.graha]}` })),
  ]
  return (
    <div className="varga-layout">
      <div>
        <div className="chart-pair-bar"><ChartStyleToggle /></div>
        <SquareChart style={settings.chartStyle} lagnaSign={chart.lagnaSign!} items={items} title="Bhava Chalit" subtitle="Planets by house, not sign" />
      </div>
      <div className="card">
        <h2>Bhava Chalit</h2>
        <p className="small">The ascendant and midheaven mark the middles of the 1st and 10th houses, and each quadrant is divided into three (Sripati). A planet near a sign boundary can fall in a different house than in the sign chart.</p>
        {moved.length
          ? <ul className="spouse-list">{moved.map((g) => <li key={g.graha}>{g.graha}: sign chart house {g.house}, chalit house {c.planetHouse[g.graha]}</li>)}</ul>
          : <p className="small">All planets are in the same house in both charts.</p>}
        <table className="data-table small">
          <thead><tr><th>House</th><th>Begins</th><th>Middle</th></tr></thead>
          <tbody>{c.madhya.map((m, i) => <tr key={i}><td>{i + 1}</td><td>{fmtLon(c.sandhi[i])}</td><td>{fmtLon(m)}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}

function KpView({ chart }: { chart: VedicChart }) {
  const { settings } = useSettings()
  const kp = useMemo(() => kpChart(chart), [chart])
  if (!kp) return <p className="muted">Needs a birth time.</p>
  return (
    <>
      {settings.ayanamsa !== 'kp' && <p className="callout note small">KP practice uses the Krishnamurti ayanamsa. Switch it in Settings for standard KP values; the current setting is used here.</p>}
      {kp.fellBack && <p className="callout warn small">Placidus houses are undefined at this latitude; equal houses from the ascendant are used.</p>}
      <div className="grid-2">
        <div className="card table-wrap">
          <h2>Cusps (Placidus)</h2>
          <table className="data-table small">
            <thead><tr><th>House</th><th>Cusp</th><th>Sign lord</th><th>Star lord</th><th>Sub lord</th><th>Sub-sub</th></tr></thead>
            <tbody>{kp.cusps.map((c, i) => <tr key={i}><td>{i + 1}</td><td className="num">{fmtLon(c)}</td><td>{kp.cuspLords[i].sign}</td><td>{kp.cuspLords[i].star}</td><td><strong>{kp.cuspLords[i].sub}</strong></td><td>{kp.cuspLords[i].subSub}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="card table-wrap">
          <h2>Planets</h2>
          <table className="data-table small">
            <thead><tr><th>Planet</th><th>Position</th><th>House</th><th>Sign lord</th><th>Star lord</th><th>Sub lord</th></tr></thead>
            <tbody>{chart.grahas.map((g) => <tr key={g.graha}><td>{g.graha}</td><td className="num">{fmtLon(g.lon)}</td><td>{kp.planetHouse[g.graha]}</td><td>{kp.planetLords[g.graha].sign}</td><td>{kp.planetLords[g.graha].star}</td><td><strong>{kp.planetLords[g.graha].sub}</strong></td></tr>)}</tbody>
          </table>
        </div>
      </div>
      <p className="muted small">Each nakshatra is divided among the nine Vimshottari lords in proportion to their years, starting from the nakshatra's own lord. In KP the cusp sub lord decides whether a house's matters are promised.</p>
    </>
  )
}
