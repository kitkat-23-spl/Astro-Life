import { useSettings } from '../../lib/settings'
import type { VargaChart, VedicChart } from '../../vedic/sidereal'
import Segmented from '../Segmented'
import SquareChart from './SquareChart'
import { itemsFor, lagnaFor } from './chartItems'

export function ChartStyleToggle() {
  const { settings, update } = useSettings()
  return <Segmented label="Chart style" value={settings.chartStyle} onChange={(chartStyle) => update({ chartStyle })} options={[['north', 'North Indian'], ['south', 'South Indian']]} />
}

/** A square chart for any varga, drawn in the visitor's chosen style. */
export function VargaSquare({ chart, vc, title, subtitle, compact }: { chart: VedicChart; vc: VargaChart; title: string; subtitle?: string; compact?: boolean }) {
  const { settings } = useSettings()
  const l = lagnaFor(vc)
  return <SquareChart style={settings.chartStyle} lagnaSign={l.sign} lagnaIsMoon={l.moon && vc.n === 1} items={itemsFor(chart, vc)} title={title} subtitle={subtitle} compact={compact} />
}

/** Two square charts side by side (e.g. D1 and D10) with the shared style toggle. */
export function ChartPair({ chart, a, b, aTitle, bTitle }: { chart: VedicChart; a: VargaChart; b: VargaChart; aTitle: string; bTitle: string }) {
  return (
    <section className="chart-pair">
      <div className="chart-pair-bar"><ChartStyleToggle /></div>
      <div className="vedic-charts">
        <VargaSquare chart={chart} vc={a} title={aTitle} />
        <VargaSquare chart={chart} vc={b} title={bTitle} />
      </div>
    </section>
  )
}
