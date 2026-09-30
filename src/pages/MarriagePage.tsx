import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Segmented from '../components/Segmented'
import { ChartPair } from '../components/vedic/ChartPair'
import { DashaTimeline, RuleGroups, ScoreDial, TransitWindows, VargaVerdicts } from '../components/vedic/ReportParts'
import { decodeBirth } from '../lib/share'
import { RASHI } from '../vedic/constants'
import { marriageReport, type Gender } from '../vedic/marriage'
import { computeVedicChart, signName, vargaChart } from '../vedic/sidereal'
import { NeedChart, NeedTime } from './CareerPage'

const GENDER_KEY = 'astrolife:gender'
function loadGender(): Gender {
  try {
    const g = localStorage.getItem(GENDER_KEY)
    return g === 'male' || g === 'female' ? g : 'unspecified'
  } catch {
    return 'unspecified'
  }
}

export default function MarriagePage() {
  const { hash } = useLocation()
  const [gender, setGenderState] = useState<Gender>(loadGender)
  const setGender = (g: Gender) => {
    setGenderState(g)
    try { localStorage.setItem(GENDER_KEY, g) } catch { /* not persisted */ }
  }
  const birth = useMemo(() => (hash.length > 1 ? decodeBirth(hash.slice(1)) : null), [hash])
  const chart = useMemo(() => (birth ? computeVedicChart(birth) : null), [birth])
  const report = useMemo(() => (chart ? marriageReport(chart, gender) : null), [chart, gender])

  if (!birth || !chart) return <NeedChart what="marriage" />
  if (!report) return <NeedTime hash={hash} what="marriage" />
  const t = report.tendency

  return (
    <div className="report">
      <nav className="crumbs small"><Link to={{ pathname: '/chart', hash }}>← Back to {birth.name ? `${birth.name}’s` : 'the'} kundali</Link></nav>
      <header className="report-head">
        <div>
          <p className="eyebrow">Marriage report · Vedic</p>
          <h1>{birth.name ? `${birth.name}’s marriage & partnership` : 'Marriage & partnership'}</h1>
          <p className="lede">{report.headline}</p>
          <div className="row" style={{ alignItems: 'center' }}>
            <span className="small muted">Read this chart as:</span>
            <Segmented label="Gender for karaka rules" value={gender} onChange={setGender} options={[['male', 'Man'], ['female', 'Woman'], ['unspecified', 'Not specified']]} />
          </div>
          <p className="muted small">Classical texts use Venus as the spouse significator, and additionally Jupiter for a woman’s husband. Choose to apply the matching rules.</p>
        </div>
        <ScoreDial value={report.score} label="Marriage support" caption="Weighted sum of every marriage rule that applies" />
      </header>

      <ChartPair chart={chart} a={vargaChart(chart, 1)} b={vargaChart(chart, 9)} aTitle="D1 Rashi" bTitle="D9 Navamsa" />

      <div className="grid-2 section-gap">
        <section className="card">
          <h2>When: timing tendency</h2>
          <p className="big-verdict">{t.label}</p>
          <div className="tendency-bar" aria-label={`${t.early} early factors, ${t.delay} delay factors`}>
            <span className="early" style={{ flex: t.early || 0.2 }}>Early {t.early}</span>
            <span className="delay" style={{ flex: t.delay || 0.2 }}>Delay {t.delay}</span>
          </div>
          <ul className="small factor-list">
            {t.factors.map((f) => <li key={f.label} className={f.direction}><span>{f.direction === 'early' ? '↑' : '↓'}</span> {f.label} <span className="muted">· {f.source}</span></li>)}
          </ul>
        </section>
        <section className="card">
          <h2>Who: the partner</h2>
          <ul className="spouse-list">
            {report.spouse.map((s) => <li key={s.text}>{s.text} <span className="tag">{s.source}</span></li>)}
          </ul>
          <p className="muted small">Upapada in {RASHI[signName(report.upapadaSign)]} · Darakaraka {report.darakaraka}</p>
        </section>
      </div>

      <div className="grid-2 section-gap">
        <section className="card">
          <h2>How: love or arranged?</h2>
          <p className="big-verdict">{report.style.love.length > report.style.arranged.length ? 'Leans toward a love marriage' : report.style.arranged.length > report.style.love.length ? 'Leans toward an arranged or family-guided marriage' : 'Balanced: either path is indicated'}</p>
          <div className="two-col small">
            <div><strong>Love indicators ({report.style.love.length})</strong><ul>{report.style.love.map((x) => <li key={x}>{x}</li>)}{!report.style.love.length && <li className="muted">None</li>}</ul></div>
            <div><strong>Arranged indicators ({report.style.arranged.length})</strong><ul>{report.style.arranged.map((x) => <li key={x}>{x}</li>)}{!report.style.arranged.length && <li className="muted">None</li>}</ul></div>
          </div>
        </section>
        <section className="card">
          <h2>Mangal dosha</h2>
          <p className="big-verdict">{report.mangal.status === 'none' ? 'Not present' : report.mangal.status === 'cancelled' ? 'Present but cancelled' : 'Present'}</p>
          <table className="data-table small">
            <thead><tr><th>Counted from</th><th>Mars in</th><th>Dosha?</th></tr></thead>
            <tbody>{report.mangal.checks.map((c) => <tr key={c.from}><td>{c.from}</td><td>{c.house}</td><td className={c.present ? 'neg' : 'pos'}>{c.present ? 'Yes' : 'No'}</td></tr>)}</tbody>
          </table>
          {report.mangal.cancellations.length > 0 && <p className="small">Cancellations: {report.mangal.cancellations.join('; ')}.</p>}
          <p className="muted small">Mars in the 1st, 2nd, 4th, 7th, 8th or 12th from lagna, Moon or Venus. It matters mainly when matching two charts.</p>
        </section>
      </div>

      <h2 className="section-title">What each divisional chart says</h2>
      <VargaVerdicts items={report.vargas} />

      <h2 className="section-title">Best timing for marriage</h2>
      <div className="timing-grid">
        <div>
          <h3>Favourable dasha periods</h3>
          <p className="muted small">From age 18 (or today) for 15 years. Periods of the 7th lord, Venus{gender === 'female' ? ', Jupiter' : ''}, the Darakaraka, planets in the 7th and the D9 7th lord.</p>
          <DashaTimeline items={report.dashas} empty="No marriage-significator periods in this window." />
        </div>
        <div>
          <h3>Double-transit windows</h3>
          <p className="muted small">Transiting Jupiter and Saturn both influencing your 7th house or its lord. When a window coincides with a marriage dasha (“Strong”), it is the classical signature of the marriage year.</p>
          <TransitWindows items={report.windows} house={7} />
        </div>
      </div>

      <h2 className="section-title">Complete rule analysis</h2>
      <p className="small"><Link to="/learn/vedic-marriage">Learn the method behind this report →</Link></p>
      <RuleGroups groups={report.groups} />

      <div className="card cta-card">
        <div>
          <h3>Comparing with a partner?</h3>
          <p className="muted">Kundali matching compares two charts: 36-point Guna Milan, South Indian poruthams, Mangal dosha and chart-level harmony.</p>
        </div>
        <Link to="/match" className="btn primary">Open kundali matching</Link>
      </div>
      <p className="muted small center disclaimer">These are traditional Jyotish indications produced by fixed rules, not predictions of fixed events. Marriage decisions deserve far more than a chart.</p>
    </div>
  )
}
