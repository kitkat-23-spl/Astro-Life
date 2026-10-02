import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GRAHA_INFO } from '../vedic/constants'
import { careerReport } from '../vedic/career'
import { computeVedicChart, vargaChart } from '../vedic/sidereal'
import { DashaTimeline, RuleGroups, ScoreDial, TransitWindows, VargaVerdicts } from '../components/vedic/ReportParts'
import Basis from '../components/Basis'
import { ChartPair } from '../components/vedic/ChartPair'
import { decodeBirth } from '../lib/share'

export default function CareerPage() {
  const { hash } = useLocation()
  const birth = useMemo(() => (hash.length > 1 ? decodeBirth(hash.slice(1)) : null), [hash])
  const chart = useMemo(() => (birth ? computeVedicChart(birth) : null), [birth])
  const report = useMemo(() => (chart ? careerReport(chart) : null), [chart])

  if (!birth || !chart) return <NeedChart what="career" />
  if (!report) return <NeedTime hash={hash} what="career" />

  return (
    <div className="report">
      <nav className="crumbs small"><Link to={{ pathname: '/chart', hash }}>← Back to {birth.name ? `${birth.name}’s` : 'the'} kundali</Link></nav>
      <header className="report-head night">
        <div>
          <p className="eyebrow">Career report · Vedic</p>
          <h1>{birth.name ? `${birth.name}’s career path` : 'Career path'}</h1>
          <p className="lede">{report.headline}</p>
          <p className="muted small">Combines D1, D2, D3, D5, D9 and D10, the 10th house from lagna, Moon and Sun, classical livelihood rules (Phaladeepika), Jaimini karakas, yogas, Vimshottari dasha and Jupiter–Saturn transits.</p>
        </div>
        <ScoreDial value={report.score} label="Career support" caption="Weighted sum of every career rule that applies" />
      </header>

      <ChartPair chart={chart} a={vargaChart(chart, 1)} b={vargaChart(chart, 10)} aTitle="D1 Rashi" bTitle="D10 Dasamsa" />

      <h2 className="section-title">Suggested career fields</h2>
      <p className="muted">Each planet collects evidence from independent rules. The strongest planets point to the fields that suit you, and every contribution is listed.</p>
      <div className="field-grid">
        {report.fields.map((f, i) => (
          <article key={f.planet} className={`card field ${i === 0 ? 'top' : ''}`}>
            <header>
              <span className="field-rank">{i + 1}</span>
              <h3>{f.planet} <span className="muted small">{GRAHA_INFO[f.planet].sanskrit}</span></h3>
              <span className="tag">{f.score} pts</span>
            </header>
            <ul className="field-list">{f.fields.map((x) => <li key={x}>{x}</li>)}</ul>
            <Basis items={f.reasons} />
          </article>
        ))}
      </div>

      <h2 className="section-title">Mode of work</h2>
      <div className="card modes">
        {report.modes.map((m) => (
          <div key={m.label} className="mode">
            <div className="mode-head"><span>{m.label}</span><span className="muted small">{m.reasons.length}/5 indicators</span></div>
            <span className="bar-track"><span className="bar-fill" style={{ width: `${m.score}%`, background: 'var(--accent)' }} /></span>
            {m.reasons.length > 0 && <p className="small muted">{m.reasons.join(' · ')}</p>}
          </div>
        ))}
      </div>

      <h2 className="section-title">What each divisional chart says</h2>
      <VargaVerdicts items={report.vargas} />

      <h2 className="section-title">Career timing</h2>
      <div className="timing-grid">
        <div>
          <h3>Favourable dasha periods (next 15 years)</h3>
          <p className="muted small">Sub-periods ruled by career significators ({report.significators.join(', ')}). Longer bars mean more significators are active.</p>
          <DashaTimeline items={report.dashas} empty="No career-significator periods in this window." />
        </div>
        <div>
          <h3>Double-transit windows (next 8 years)</h3>
          <p className="muted small">When transiting Jupiter and Saturn both touch your 10th house or its lord, career events such as promotions, new roles or changes tend to happen. “Strong” windows coincide with a career dasha.</p>
          <TransitWindows items={report.windows} house={10} />
        </div>
      </div>

      <h2 className="section-title">Complete rule analysis</h2>
      <p className="small"><Link to="/learn/vedic-career">Learn the method behind this report →</Link></p>
      <RuleGroups groups={report.groups} />
      <p className="muted small center disclaimer">These are traditional Jyotish indications produced by fixed rules, not guarantees. Use them for reflection alongside your own interests, skills and professional advice.</p>
    </div>
  )
}

export function NeedChart({ what }: { what: string }) {
  return (
    <div className="page-head center">
      <h1>Create your chart first</h1>
      <p className="lede">The {what} report is built from your birth chart.</p>
      <Link to="/chart" className="btn primary">Enter birth details</Link>
    </div>
  )
}

export function NeedTime({ hash, what }: { hash: string; what: string }) {
  return (
    <div className="page-head center">
      <h1>A birth time is needed</h1>
      <p className="lede">The {what} report depends on houses and divisional charts, which require your birth time. Add it to your details to unlock this report.</p>
      <Link to={{ pathname: '/chart', hash }} className="btn primary">Back to chart</Link>
    </div>
  )
}
