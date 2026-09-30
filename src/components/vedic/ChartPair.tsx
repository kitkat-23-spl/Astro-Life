import { useState } from 'react'
import type { VargaChart, VedicChart } from '../../vedic/sidereal'
import Segmented from '../Segmented'
import SquareChart, { type ChartStyle } from './SquareChart'
import { STYLE_KEY, itemsFor, lagnaFor, loadStyle } from './chartItems'

/** Two square charts side by side (e.g. D1 + D10) with the shared North/South style toggle. */
export function ChartPair({ chart, a, b, aTitle, bTitle }: { chart: VedicChart; a: VargaChart; b: VargaChart; aTitle: string; bTitle: string }) {
  const [style, setStyleState] = useState<ChartStyle>(loadStyle)
  const setStyle = (s: ChartStyle) => {
    setStyleState(s)
    try { localStorage.setItem(STYLE_KEY, s) } catch { /* not persisted */ }
  }
  return (
    <section className="chart-pair">
      <div className="chart-pair-bar">
        <Segmented label="Chart style" value={style} onChange={setStyle} options={[['north', 'North Indian'], ['south', 'South Indian']]} />
      </div>
      <div className="vedic-charts">
        {[[a, aTitle], [b, bTitle]].map(([vc, title]) => {
          const v = vc as VargaChart
          return <SquareChart key={title as string} style={style} lagnaSign={lagnaFor(v).sign} items={itemsFor(chart, v)} title={title as string} />
        })}
      </div>
    </section>
  )
}
