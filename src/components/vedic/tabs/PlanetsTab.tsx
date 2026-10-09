import { useMemo, useState } from 'react'
import { GRAHA_INFO, NAKSHATRAS, RASHI } from '../../../vedic/constants'
import type { VedicReading } from '../../../vedic/interpret'
import { signName, type VedicChart } from '../../../vedic/sidereal'
import { avastha, shadbala, vimsopaka } from '../../../vedic/strength'
import Cards from '../Cards'
import { fmtDeg } from '../format'
import Term from '../../Term'

const n1 = (x: number) => x.toFixed(1)

export default function PlanetsTab({ chart, reading }: { chart: VedicChart; reading: VedicReading }) {
  const sb = useMemo(() => shadbala(chart), [chart])
  const [open, setOpen] = useState(false)
  const rank = sb ? [...sb].sort((a, b) => b.ratio - a.ratio).map((s) => s.graha) : []
  return (
    <>
      <div className="card table-wrap">
        <table className="data-table">
          <caption className="sr-only">Planet positions</caption>
          <thead><tr><th>Planet</th><th>Sign</th><th>Degree</th><th>Nakshatra</th>{chart.lagnaSign !== null && <th>House</th>}<th>Dignity</th><th>Notes</th></tr></thead>
          <tbody>
            {chart.lagna !== null && (
              <tr><td><span className="glyph">As</span> Lagna</td><td>{RASHI[signName(chart.lagnaSign!)]}</td><td className="num">{fmtDeg(chart.lagna % 30)}</td><td>{NAKSHATRAS[Math.floor(chart.lagna / (360 / 27))].name}</td><td>1</td><td /><td /></tr>
            )}
            {chart.grahas.map((g) => (
              <tr key={g.graha}>
                <td><span className="glyph">{GRAHA_INFO[g.graha].abbr}</span> {g.graha} <span className="muted small">{GRAHA_INFO[g.graha].sanskrit}</span></td>
                <td>{RASHI[signName(g.sign)]}</td>
                <td className="num">{fmtDeg(g.degree)}</td>
                <td>{NAKSHATRAS[g.nakshatra].name} {g.pada}</td>
                {chart.lagnaSign !== null && <td>{g.house}</td>}
                <td className={g.dignity === 'debilitated' ? 'neg' : g.dignity && ['exalted', 'moolatrikona', 'own'].includes(g.dignity) ? 'pos' : ''}>{g.dignity ?? ''}</td>
                <td className="muted">{[g.retrograde && g.graha !== 'Rahu' && g.graha !== 'Ketu' && 'Retrograde', g.combust && 'Combust'].filter(Boolean).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title"><Term k="shadbala">Strength and states</Term></h2>
      {sb ? (
        <div className="card table-wrap">
          <table className="data-table">
            <caption className="sr-only">Shadbala, Vimsopaka bala and avasthas</caption>
            <thead><tr><th>Planet</th><th>Shadbala</th><th>Required</th><th>Strength</th><th>Rank</th><th>Vimsopaka</th><th>Age</th><th>Alertness</th><th>Mood</th></tr></thead>
            <tbody>
              {sb.map((s) => {
                const av = avastha(chart, s.graha)
                return (
                  <tr key={s.graha}>
                    <td>{s.graha}</td>
                    <td className="num">{s.rupas.toFixed(2)}</td>
                    <td className="num">{s.required}</td>
                    <td className={`num ${s.ratio >= 1 ? 'pos' : 'neg'}`}>{Math.round(s.ratio * 100)}%</td>
                    <td className="num">{rank.indexOf(s.graha) + 1}</td>
                    <td className="num">{vimsopaka(chart, s.graha).toFixed(1)} / 20</td>
                    <td>{av.age.split(' ')[0]}</td>
                    <td>{av.alertness.split(' ')[0]}</td>
                    <td>{av.mood.split(' ')[0]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="muted small">Shadbala in rupas (60 virupas each), after BPHS 27. Strength is Shadbala as a share of the classical minimum. Vimsopaka uses the sixteen vargas. Cheshta bala uses the eight kinds of motion; Yuddha bala (planetary war) is not applied.</p>
          <button className="linklike small" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'} the six components (virupas)</button>
          {open && (
            <table className="data-table small">
              <thead><tr><th>Planet</th><th>Sthana</th><th>Dig</th><th>Kala</th><th>Cheshta</th><th>Naisargika</th><th>Drik</th><th>Total</th></tr></thead>
              <tbody>
                {sb.map((s) => (
                  <tr key={s.graha}><td>{s.graha}</td><td className="num">{n1(s.sthana.total)}</td><td className="num">{n1(s.dig)}</td><td className="num">{n1(s.kala.total)}</td><td className="num">{n1(s.cheshta)}</td><td className="num">{n1(s.naisargika)}</td><td className="num">{n1(s.drik)}</td><td className="num"><strong>{n1(s.total)}</strong></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : <p className="muted">Shadbala needs a birth time.</p>}

      <h2 className="section-title"><Term k="dignity">Planet by planet</Term></h2>
      <Cards items={reading.grahas} list />
    </>
  )
}
