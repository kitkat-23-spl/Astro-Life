import { useMemo } from 'react'
import { useSettings } from '../../../lib/settings'
import { SEVEN } from '../../../vedic/constants'
import { BINDU_MEANING, ashtakavarga, kakshyaCheck, savByHouse, savReadings } from '../../../vedic/ashtakavarga'
import type { VedicChart } from '../../../vedic/sidereal'
import { transitPositions } from '../../../vedic/transits'
import Term from '../../Term'
import { ChartStyleToggle } from '../ChartPair'
import SquareChart from '../SquareChart'
import { rashiName } from '../format'

const TONE_CLASS = { good: 'cl-good', mixed: 'cl-mixed', challenge: 'cl-challenge' } as const

export default function AshtakavargaTab({ chart }: { chart: VedicChart }) {
  const { settings } = useSettings()
  const av = useMemo(() => ashtakavarga(chart), [chart])
  const today = useMemo(() => kakshyaCheck(chart, transitPositions(chart, new Date())), [chart])
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
          <h2><Term k="sav">Reading the totals</Term></h2>
          <p className="small">The seven planets give 337 bindus in all. 28 in a sign is average: more makes its house stronger and transits through it easier, fewer makes it weaker.</p>
          <p className="small"><strong>Strong houses (28+):</strong> {strong.join(', ') || 'none'}<br /><strong>Weak houses (under 25):</strong> {weak.join(', ') || 'none'}</p>
          <div className="classical">
            <ul>{savReadings(chart, av).map((r) => <li key={r.id} className={TONE_CLASS[r.tone]}>{r.text}</li>)}</ul>
            <p className="classical-src">Charak XXX</p>
          </div>
        </div>
      </div>

      {today && (
        <>
          <h2 className="section-title"><Term k="kakshya">Today by kakshya</Term></h2>
          <div className="card">
            <p><strong>{today.verdict}:</strong> {today.count} of 7 planets are passing through a kakshya that holds a bindu in their own table.</p>
            <div className="table-wrap">
              <table className="data-table small">
                <thead><tr><th>Planet</th><th>Sign now</th><th>Kakshya</th><th>Ruled by</th><th>Bindu</th></tr></thead>
                <tbody>
                  {today.rows.map((r) => (
                    <tr key={r.graha}><td>{r.graha}</td><td>{rashiName(r.sign)}</td><td className="num">{r.kakshya} of 8</td><td>{r.lord}</td><td className={r.bindu ? 'pos' : 'neg'}>{r.bindu ? 'Yes' : 'No'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted small">Each sign is split into eight kakshyas of 3°45′, ruled in turn by Saturn, Jupiter, Mars, the Sun, Venus, Mercury, the Moon and the lagna. The book uses this count for daily timing, always below the dasha and the birth chart.</p>
          </div>
        </>
      )}

      <h2 className="section-title"><Term k="ashtakavarga">Bhinnashtakavarga</Term></h2>
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
                  {row.map((n, i) => <td key={i} className={`num ${n >= 5 ? 'pos' : n <= 2 ? 'neg' : ''}`} title={BINDU_MEANING[n]}>{n}</td>)}
                  <td className="num">{row.reduce((a, b) => a + b, 0)}</td>
                </tr>
              )
            })}
            <tr className="total"><td><strong>SAV</strong></td>{byHouse.map((n, i) => <td key={i} className={`num ${n >= 28 ? 'pos' : n < 25 ? 'neg' : ''}`}><strong>{n}</strong></td>)}<td className="num"><strong>337</strong></td></tr>
          </tbody>
        </table>
        <p className="muted small">Columns are houses from the lagna. When a planet transits a sign, the bindus in its own row for that sign set the tone:</p>
        <ul className="bindu-key small">
          {BINDU_MEANING.map((m, n) => <li key={n}><strong className={n >= 5 ? 'pos' : n <= 3 ? 'neg' : ''}>{n}</strong> {m}</li>)}
        </ul>
      </div>
    </>
  )
}
