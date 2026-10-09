import { useState } from 'react'
import type { VedicReading } from '../../../vedic/interpret'
import type { VedicChart } from '../../../vedic/sidereal'
import { VARGAS, VARGA_BY_N, type VargaN } from '../../../vedic/varga'
import Cards from '../Cards'
import { VargaSquare } from '../ChartPair'
import Term from '../../Term'

export default function VargasTab({ chart, reading }: { chart: VedicChart; reading: VedicReading }) {
  const [varga, setVarga] = useState<VargaN>(9)
  const info = VARGA_BY_N[varga]
  return (
    <>
      <div className="chip-row" role="group" aria-label="Divisional chart">
        {VARGAS.map((v) => (
          <button key={v.n} className={`chip ${varga === v.n ? 'active' : ''}`} aria-pressed={varga === v.n} onClick={() => setVarga(v.n)} title={`${v.name}: ${v.domain}`}>
            {v.code}{v.standard ? '' : '*'}
          </button>
        ))}
      </div>
      <div className="varga-layout">
        <div>
          <VargaSquare chart={chart} vc={reading.vargaCharts[varga]} title={`${info.code} ${info.name}`} subtitle={info.domain} />
          <p className="small">{info.about}</p>
          {!info.standard && <p className="callout warn small">* D5, D6 and D8 are not among Parashara's sixteen vargas. They use later methods.</p>}
          {varga >= 16 && !chart.timeKnown && <p className="callout warn small">Higher divisions change within minutes and need an exact birth time.</p>}
        </div>
        <div><Cards items={reading.vargas[varga]} list /></div>
      </div>
      <h2 className="section-title"><Term k="varga">All divisional charts</Term></h2>
      <div className="varga-grid">
        {VARGAS.map((v) => (
          <button key={v.n} className={`varga-thumb ${varga === v.n ? 'active' : ''}`} onClick={() => { setVarga(v.n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <VargaSquare chart={chart} vc={reading.vargaCharts[v.n]} title={`${v.code} ${v.name}`} compact />
          </button>
        ))}
      </div>
    </>
  )
}
