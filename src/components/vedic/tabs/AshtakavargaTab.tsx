import { useMemo } from 'react'
import { useSettings } from '../../../lib/settings'
import { SEVEN } from '../../../vedic/constants'
import { ashtakavarga, savByHouse } from '../../../vedic/ashtakavarga'
import type { VedicChart } from '../../../vedic/sidereal'
import { ChartStyleToggle } from '../ChartPair'
import SquareChart from '../SquareChart'
import { rashiName } from '../format'

export default function AshtakavargaTab({ chart }: { chart: VedicChart }) {
  const { settings } = useSettings()
  const av = useMemo(() => ashtakavarga(chart), [chart])
  if (!av) return <p className="muted">Ashtakavarga needs a birth time.</p>
  const byHouse = savByHouse(chart, av)
  const items = av.sav.map((n, sign) => ({ sign, label: String(n), title: `${rashiName(sign)}: ${n} bindus`, tone: n >= 28 ? ('up' as const) : n < 25 ? ('down' as const) : undefined }))
  const strong = byHouse.map((n, i) => [i + 1, n] as const).filter(([, n]) => n >= 28).map(([h]) => h)
  const weak = byHouse.map((n, i) => [i + 1, n] as const).filter(([, n]) => n < 25).map(([h]) => h)
  return (
    <>
      <div className="varga-layout">
        <div>
          <div className="chart-pair-bar"><ChartStyleToggle /></div>
          <SquareChart style={settings.chartStyle} lagnaSign={chart.lagnaSign!} items={items} title="Sarvashtakavarga" subtitle="Bindus per sign" />
        </div>
        <div className="card">
          <h2>Reading the totals</h2>
          <p className="small">The seven planets distribute 337 bindus. A sign with 28 or more is strong: its house gives good results and transits through it are easier. Fewer than 25 marks a weak house.</p>
          <p className="small"><strong>Strong houses:</strong> {strong.join(', ') || 'none'}<br /><strong>Weak houses:</strong> {weak.join(', ') || 'none'}</p>
          <p className="small">Traditionally the 11th should hold more bindus than the 10th, and the 10th more than the 9th, for gains to exceed effort; and the 12th fewer than the 11th, for income to exceed expenses.</p>
          <p className="small">9th {byHouse[8]} · 10th {byHouse[9]} · 11th {byHouse[10]} · 12th {byHouse[11]}</p>
        </div>
      </div>

      <h2 className="section-title">Bhinnashtakavarga</h2>
      <div className="card table-wrap">
        <table className="data-table av-table">
          <caption className="sr-only">Bindus for each planet by house</caption>
          <thead><tr><th>Planet</th>{byHouse.map((_, i) => <th key={i} className="num">{i + 1}<span className="muted small"> {rashiName((chart.lagnaSign! + i) % 12).slice(0, 3)}</span></th>)}<th className="num">Total</th></tr></thead>
          <tbody>
            {SEVEN.map((g) => {
              const row = Array.from({ length: 12 }, (_, i) => av.bav[g][(chart.lagnaSign! + i) % 12])
              return (
                <tr key={g}>
                  <td>{g}</td>
                  {row.map((n, i) => <td key={i} className={`num ${n >= 5 ? 'pos' : n <= 2 ? 'neg' : ''}`}>{n}</td>)}
                  <td className="num">{row.reduce((a, b) => a + b, 0)}</td>
                </tr>
              )
            })}
            <tr className="total"><td><strong>SAV</strong></td>{byHouse.map((n, i) => <td key={i} className={`num ${n >= 28 ? 'pos' : n < 25 ? 'neg' : ''}`}><strong>{n}</strong></td>)}<td className="num"><strong>337</strong></td></tr>
          </tbody>
        </table>
        <p className="muted small">Columns are houses from the lagna. In a planet's own table, 5 or more bindus in a sign makes its transit there favourable; 2 or fewer makes it difficult (BPHS 66).</p>
      </div>
    </>
  )
}
