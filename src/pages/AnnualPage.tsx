import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ordinal } from '../astro/constants'
import Segmented from '../components/Segmented'
import Term from '../components/Term'
import { ChartStyleToggle, VargaSquare } from '../components/vedic/ChartPair'
import { AreaVerdict, EffectPill, ChartNav, RuleGroups } from '../components/vedic/ReportParts'
import { fmtDate, fmtDateTime, fmtLon, rashiName } from '../components/vedic/format'
import { useBirthFromHash, useVedicChart } from '../lib/useVedic'
import { runningAge, tithiPravesh } from '../vedic/annual'
import { annualReading, type YearReading } from '../vedic/annualReading'
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
      <ChartNav hash={hash} />
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
      {kind === 'varshaphal' && <YearAhead natal={chart} current={current} selected={year} onPick={setAge} />}
      {kind === 'varshaphal' ? <Varshaphal natal={chart} age={year} hash={hash} /> : <Tithi natal={chart} age={year} />}
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

/** The running year and the next one side by side, each with its lean and how each area reads. */
function YearAhead({ natal, current, selected, onPick }: { natal: VedicChart; current: number; selected: number; onPick: (age: number) => void }) {
  const years = useMemo(() => [current, current + 1].map((a) => annualReading(natal, a)), [natal, current])
  return (
    <section className="year-ahead">
      {years.map((r, i) => r && (
        <article key={r.v.age} className={`card year-card${r.v.age === selected ? ' is-selected' : ''}`}>
          <p className="eyebrow">{i === 0 ? 'This year' : 'Next year'} · age {r.v.age}</p>
          <h2>{fmtDate(r.v.start)} to {fmtDate(r.v.end)}</h2>
          <p className="muted small">Year lord {r.v.yearLord} · muntha in the {ordinal(r.v.muntha.house)} house</p>
          <AreaVerdict s={r.summary} compact />
          <ul className="year-areas">
            {r.areas.map((a) => <li key={a.id}><span>{a.title}</span><EffectPill effect={a.summary.leaning} label={a.summary.label} /></li>)}
          </ul>
          {r.v.age === selected
            ? <p className="small muted">Shown in detail below.</p>
            : <button className="btn ghost small" onClick={() => onPick(r.v.age)}>Read this year in detail</button>}
        </article>
      ))}
    </section>
  )
}

function Varshaphal({ natal, age, hash }: { natal: VedicChart; age: number; hash: string }) {
  const r: YearReading | null = useMemo(() => annualReading(natal, age), [natal, age])
  if (!r) return null
  const { v } = r
  const zone = natal.birth.timezone
  const now = new Date()
  return (
    <>
      <div className="varga-layout">
        <ChartBox chart={v.chart} title="Varshaphal" subtitle={`Lagna ${rashiName(v.chart.lagnaSign!)}`} />
        <div className="card">
          <h2><Term k="varshaphal">The year at a glance</Term></h2>
          <table className="data-table panchang-table">
            <tbody>
              <tr><th scope="row">Begins</th><td>{fmtDateTime(v.start, zone)}</td></tr>
              <tr><th scope="row">Ends</th><td>{fmtDateTime(v.end, zone)}</td></tr>
              <tr><th scope="row">Year lagna</th><td>{rashiName(v.chart.lagnaSign!)} ({v.dayChart ? 'day' : 'night'} chart)</td></tr>
              <tr><th scope="row"><Term k="muntha">Muntha</Term></th><td>{rashiName(v.muntha.sign)}, {ordinal(v.muntha.house)} house, lord {v.muntha.lord}</td></tr>
              <tr><th scope="row"><Term k="yearlord">Year lord</Term></th><td><strong>{v.yearLord}</strong></td></tr>
            </tbody>
          </table>
          <AreaVerdict s={r.summary} />
        </div>
      </div>

      <h2 className="section-title"><Term k="lean">Areas of life this year</Term></h2>
      <p className="muted small">Each area is read from its house in the year chart (lord, occupants and aspects), its saham, the natal dasha lords that rule or occupy it, and Saturn, Jupiter and Rahu when they cross or aspect it during the year.</p>
      <div className="year-area-grid">
        {r.areas.map((a) => (
          <article key={a.id} className="card area-card">
            <span className="area-head"><strong>{a.title}</strong></span>
            <AreaVerdict s={a.summary} compact />
            {a.report && <Link className="area-open" to={{ pathname: `/chart/${a.report}`, hash }}>Birth chart report</Link>}
          </article>
        ))}
      </div>

      <h2 className="section-title"><Term k="mudda">Month by month</Term></h2>
      <div className="card table-wrap">
        <table className="data-table">
          <thead><tr><th>Dates</th><th>Mudda period</th><th>Focus</th><th>Reading</th></tr></thead>
          <tbody>
            {r.mudda.map((m) => (
              <tr key={m.lord} className={m.start <= now && now < m.end ? 'selected' : ''}>
                <td className="num">{fmtDate(m.start)}<br />to {fmtDate(m.end)}</td>
                <td><strong>{m.lord}</strong><br /><EffectPill effect={m.effect} /></td>
                <td>{m.focus}</td>
                <td className="small">{m.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Mudda dasha is Vimshottari compressed into the year, starting from (birth nakshatra number + age - 2) counted in Vimshottari order. Each period is read from its lord's dignity, house and lordship in the year chart; the focus is the houses it occupies and rules.</p>
      </div>

      <h2 className="section-title">Key dates</h2>
      <div className="card">
        {r.dates.length
          ? <ul className="upcoming key-dates">{r.dates.map((d) => <li key={d.date.getTime() + d.text}><span className="num">{fmtDate(d.date)}</span><span>{d.text}</span></li>)}</ul>
          : <p className="muted small">No dasha sub-period or slow-planet sign change falls inside this year.</p>}
        <p className="muted small">Natal Vimshottari sub-periods that begin during the year, and the sign changes of Saturn, Jupiter and Rahu, counted from the birth lagna.</p>
      </div>

      <h2 className="section-title">All rules for this year</h2>
      <p className="muted small">Rules from Tajika Neelakanthi for the year chart, Parashari house rules applied to it, the natal Vimshottari dasha and the classical transit results. The lean reads them the same way as the life-area reports: mostly supportive when supportive rules outnumber challenging ones two to one, more challenging when challenging rules are as many or more, mixed otherwise. These are traditional indications that have not been tested against real outcomes.</p>
      <RuleGroups groups={[...r.groups, ...r.areas.map((a) => a.group)]} />

      <h2 className="section-title">Reference</h2>
      <div className="grid-2">
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
          <h2><Term k="saham">Sahams</Term></h2>
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
