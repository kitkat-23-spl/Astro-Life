import { useMemo, useState } from 'react'
import { ordinal } from '../astro/constants'
import Segmented from '../components/Segmented'
import { ChartStyleToggle, VargaSquare } from '../components/vedic/ChartPair'
import { ReportNav } from '../components/vedic/ReportParts'
import { fmtDate, fmtDateTime, fmtLon, rashiName } from '../components/vedic/format'
import { useBirthFromHash, useVedicChart } from '../lib/useVedic'
import { MUNTHA_RESULT, runningAge, tithiPravesh, varshaphal } from '../vedic/annual'
import { BHAVA } from '../vedic/constants'
import { dignityPhrase, pos } from '../vedic/query'
import { vargaChart, type VedicChart } from '../vedic/sidereal'
import { NeedChart, NeedTime } from './ReportPage'

type Kind = 'varshaphal' | 'tithi'

export default function AnnualPage() {
  const { hash, birth } = useBirthFromHash()
  const chart = useVedicChart(birth)
  const now = useMemo(() => new Date(), [])
  const current = useMemo(() => (chart?.timeKnown ? runningAge(chart, now) : 0), [chart, now])
  const [age, setAge] = useState<number | null>(null)
  const [kind, setKind] = useState<Kind>('varshaphal')
  if (!birth || !chart) return <NeedChart what="annual chart" />
  if (!chart.timeKnown) return <NeedTime hash={hash} what="annual chart" />
  const year = age ?? current

  return (
    <div className="report">
      <ReportNav hash={hash} />
      <header className="report-head night">
        <div>
          <p className="eyebrow">Annual chart</p>
          <h1>{birth.name ? `${birth.name}: ` : ''}year {year + 1} of life</h1>
          <p className="lede">The chart for the moment of the {kind === 'varshaphal' ? 'solar return (the Sun back at its natal degree)' : 'return of the birth tithi near the birthday'}, cast for the birth place.</p>
          <div className="row">
            <button className="btn ghost small" onClick={() => setAge(Math.max(0, year - 1))} disabled={year === 0}>Previous year</button>
            <label className="sr-only" htmlFor="age">Age</label>
            <select id="age" className="age-select" value={year} onChange={(e) => setAge(Number(e.target.value))}>
              {Array.from({ length: 101 }, (_, i) => <option key={i} value={i}>Age {i}{i === current ? ' (current)' : ''}</option>)}
            </select>
            <button className="btn ghost small" onClick={() => setAge(Math.min(100, year + 1))} disabled={year === 100}>Next year</button>
            <Segmented label="Annual chart type" value={kind} onChange={setKind} options={[['varshaphal', 'Varshaphal'], ['tithi', 'Tithi Pravesh']]} />
          </div>
        </div>
      </header>
      {kind === 'varshaphal' ? <Varshaphal natal={chart} age={year} /> : <Tithi natal={chart} age={year} />}
    </div>
  )
}

function ChartBox({ chart, title, subtitle }: { chart: VedicChart; title: string; subtitle: string }) {
  return (
    <div>
      <div className="chart-pair-bar"><ChartStyleToggle /></div>
      <VargaSquare chart={chart} vc={vargaChart(chart, 1)} title={title} subtitle={subtitle} />
    </div>
  )
}

function Varshaphal({ natal, age }: { natal: VedicChart; age: number }) {
  const v = useMemo(() => varshaphal(natal, age), [natal, age])
  if (!v) return null
  const zone = natal.birth.timezone
  const yl = pos(v.chart, v.yearLord)
  const now = new Date()
  return (
    <>
      <div className="varga-layout">
        <ChartBox chart={v.chart} title="Varshaphal" subtitle={`Lagna ${rashiName(v.chart.lagnaSign!)}`} />
        <div className="card">
          <h2>The year at a glance</h2>
          <table className="data-table panchang-table">
            <tbody>
              <tr><th scope="row">Begins</th><td>{fmtDateTime(v.start, zone)}</td></tr>
              <tr><th scope="row">Ends</th><td>{fmtDateTime(v.end, zone)}</td></tr>
              <tr><th scope="row">Year lagna</th><td>{rashiName(v.chart.lagnaSign!)} ({v.dayChart ? 'day' : 'night'} chart)</td></tr>
              <tr><th scope="row">Muntha</th><td>{rashiName(v.muntha.sign)}, {ordinal(v.muntha.house)} house, lord {v.muntha.lord}</td></tr>
              <tr><th scope="row">Year lord</th><td><strong>{v.yearLord}</strong>, {dignityPhrase(yl.dignity)} in the {ordinal(yl.house!)} house</td></tr>
            </tbody>
          </table>
          <p className="small">Muntha in the {ordinal(v.muntha.house)} ({BHAVA[v.muntha.house - 1].short}) is {MUNTHA_RESULT(v.muntha.house)}.</p>
          <p className="small">The year lord {v.yearLord} sets the tone of the year through the {ordinal(yl.house!)} house ({BHAVA[yl.house! - 1].topics}). {yl.dignity === 'exalted' || yl.dignity === 'own' || yl.dignity === 'moolatrikona' ? 'It is strong, so the year tends to go well in these matters.' : yl.dignity === 'debilitated' ? 'It is debilitated, so these matters need more care this year.' : ''}</p>
        </div>
      </div>

      <div className="grid-2 section-gap">
        <section className="card table-wrap">
          <h2>Office bearers</h2>
          <table className="data-table small">
            <thead><tr><th>Role</th><th>Planet</th><th>Strength</th><th>Aspects lagna</th></tr></thead>
            <tbody>
              {v.officeBearers.map((o) => (
                <tr key={o.role} className={o.graha === v.yearLord ? 'selected' : ''}>
                  <td>{o.role}</td><td>{o.graha}</td><td className="num">{o.strength.toFixed(1)} / 20</td><td>{o.aspectsLagna ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">The year lord is the strongest of the five (Pancha-vargiya bala) that aspects the year lagna by Tajika aspect (Tajika Neelakanthi).</p>
        </section>
        <section className="card table-wrap">
          <h2>Sahams</h2>
          <table className="data-table small">
            <thead><tr><th>Saham</th><th>Position</th><th>House</th><th>About</th></tr></thead>
            <tbody>
              {v.sahams.map((s) => (
                <tr key={s.name}><td>{s.name}</td><td className="num">{fmtLon(s.lon)}</td><td className="num">{((Math.floor(s.lon / 30) - v.chart.lagnaSign! + 12) % 12) + 1}</td><td className="muted">{s.meaning}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">Sensitive points of the annual chart (Arabic parts). A saham in a good house, or with its lord strong, supports that matter this year.</p>
        </section>
      </div>

      <h2 className="section-title">Mudda dasha</h2>
      <div className="card">
        <ol className="chain">
          {v.mudda.map((m) => (
            <li key={m.lord} className={m.start <= now && now < m.end ? 'now-row' : ''}>
              <strong>{m.lord}</strong>
              <span />
              <span className="muted small">{fmtDate(m.start)} to {fmtDate(m.end)}</span>
            </li>
          ))}
        </ol>
        <p className="muted small">Vimshottari compressed into the year, starting from (birth nakshatra number + age - 2) counted in Vimshottari order.</p>
      </div>
    </>
  )
}

function Tithi({ natal, age }: { natal: VedicChart; age: number }) {
  const t = useMemo(() => tithiPravesh(natal, age), [natal, age])
  if (!t) return <p className="muted">The tithi return could not be found near this birthday.</p>
  const yl = pos(t.chart, t.yearLord)
  return (
    <div className="varga-layout">
      <ChartBox chart={t.chart} title="Tithi Pravesh" subtitle={`Lagna ${rashiName(t.chart.lagnaSign!)}`} />
      <div className="card">
        <h2>Tithi Pravesh</h2>
        <table className="data-table panchang-table">
          <tbody>
            <tr><th scope="row">Moment</th><td>{fmtDateTime(t.moment, natal.birth.timezone)}</td></tr>
            <tr><th scope="row">Year lagna</th><td>{rashiName(t.chart.lagnaSign!)}</td></tr>
            <tr><th scope="row">Year lord</th><td><strong>{t.yearLord}</strong> (lord of the weekday), {dignityPhrase(yl.dignity)} in the {ordinal(yl.house!)} house</td></tr>
            <tr><th scope="row">Hora lord</th><td>{t.horaLord}</td></tr>
          </tbody>
        </table>
        <p className="small">Tithi Pravesh is the moment the Sun and Moon return to their birth angle (the birth tithi) while the Sun is in its birth sign. The lord of that weekday rules the year, and its house in this chart shows where the year's main events occur: the {ordinal(yl.house!)} house, {BHAVA[yl.house! - 1].topics}.</p>
      </div>
    </div>
  )
}
