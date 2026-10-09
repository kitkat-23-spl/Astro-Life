import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import Basis from '../components/Basis'
import Segmented from '../components/Segmented'
import { ChartPair } from '../components/vedic/ChartPair'
import { fmtRange } from '../components/vedic/format'
import { AreaVerdict, DashaTimeline, MethodNote, ChartNav, RuleGroups, TransitWindows, VargaVerdicts } from '../components/vedic/ReportParts'
import { useSettings } from '../lib/settings'
import { useBirthFromHash, useVedicChart } from '../lib/useVedic'
import type { CareerReport, ModePeriod, ModeStrength } from '../vedic/career'
import type { ChildrenReport } from '../vedic/children'
import { GRAHA_INFO, RASHI } from '../vedic/constants'
import type { EducationReport } from '../vedic/education'
import type { MarriageReport } from '../vedic/marriage'
import { REPORTS, buildReport, type ReportKey } from '../vedic/reports'
import { summarise, type AreaReport } from '../vedic/rules'
import { signName, vargaChart } from '../vedic/sidereal'
import type { VargaN } from '../vedic/varga'
import type { WealthReport } from '../vedic/wealth'
import NotFound from './NotFound'

interface Config {
  varga: VargaN
  vargaTitle: string
  house: number
  method: string
  dashaNote: string
  transitNote: string
  lesson?: string
  usesGender?: boolean
}

const CONFIG: Record<ReportKey, Config> = {
  career: {
    varga: 10, vargaTitle: 'D10 Dasamsa', house: 10, lesson: 'vedic-career',
    method: 'D1, D2, D3, D9 and D10; the 10th house from the lagna, Moon and Sun; Phaladeepika livelihood rules; Jaimini karakas; yogas; Vimshottari dasha; Jupiter and Saturn transits.',
    dashaNote: 'Sub-periods ruled by career significators over the next 15 years.',
    transitNote: 'Periods when transiting Jupiter and Saturn both influence the 10th house or its lord. Strong windows coincide with a career dasha.',
  },
  marriage: {
    varga: 9, vargaTitle: 'D9 Navamsa', house: 7, lesson: 'vedic-marriage', usesGender: true,
    method: 'D1, D2, D4, D7 and D9; the 7th house from the lagna, Moon and Venus; karakas; Upapada; Mangal dosha; Vimshottari dasha; Jupiter and Saturn transits.',
    dashaNote: 'From age 18 (or today) for 15 years: periods of the 7th lord, Venus, the Darakaraka, planets in the 7th and the D9 7th lord.',
    transitNote: 'Periods when transiting Jupiter and Saturn both influence the 7th house or its lord. A window that coincides with a marriage dasha is the classical marriage signature.',
  },
  wealth: {
    varga: 2, vargaTitle: 'D2 Hora', house: 11, lesson: 'vedic-yogas',
    method: 'D1, D2, D4, D9 and D10; the 2nd and 11th houses; Jupiter; Dhana, Lakshmi and lunar yogas; Indu Lagna; Vimshottari dasha; Jupiter and Saturn transits.',
    dashaNote: 'Sub-periods of the 2nd and 11th lords, Jupiter and planets in the 2nd and 11th over the next 15 years.',
    transitNote: 'Periods when transiting Jupiter and Saturn both influence the 11th house or its lord.',
  },
  education: {
    varga: 24, vargaTitle: 'D24 Chaturvimsamsa', house: 9, lesson: 'vedic-vargas',
    method: 'D1, D9 and D24; the 4th, 5th, 9th and 2nd houses; Mercury, Jupiter and the Moon; learning yogas; Vimshottari dasha.',
    dashaNote: 'Sub-periods of the 4th, 5th and 9th lords, Mercury and Jupiter over the next 12 years.',
    transitNote: 'Periods when transiting Jupiter and Saturn both influence the 9th house (higher studies) or its lord.',
  },
  children: {
    varga: 7, vargaTitle: 'D7 Saptamsa', house: 5, lesson: 'vedic-vargas', usesGender: true,
    method: 'D1, D7 and D9; the 5th house from the lagna, Moon and Jupiter; Putrakaraka; Beeja and Kshetra sphuta; Vimshottari dasha.',
    dashaNote: 'From age 21 (or today) for 15 years: periods of the 5th lord, Jupiter, the Putrakaraka and the D7 5th lord.',
    transitNote: 'Periods when transiting Jupiter and Saturn both influence the 5th house or its lord.',
  },
}

export default function ReportPage() {
  const { report: key } = useParams()
  const { hash, birth } = useBirthFromHash()
  const chart = useVedicChart(birth)
  const { settings, update } = useSettings()
  const meta = REPORTS.find((r) => r.key === key)
  const report = useMemo(() => (chart && meta ? buildReport(meta.key, chart, settings.gender) : null), [chart, meta, settings.gender])

  if (!meta) return <NotFound />
  const cfg = CONFIG[meta.key]
  if (!birth || !chart) return <NeedChart what={meta.title.toLowerCase()} />
  if (!report) return <NeedTime hash={hash} what={meta.title.toLowerCase()} />

  return (
    <div className="report">
      <ChartNav hash={hash} />
      <header className="report-head night">
        <div>
          <p className="eyebrow">{meta.title} report</p>
          <h1>{birth.name ? `${birth.name}: ${meta.title.toLowerCase()}` : meta.title}</h1>
          <p className="lede">{report.headline}</p>
          {cfg.usesGender && (
            <div className="row gender-row">
              <span className="small muted">Apply gender-specific rules for</span>
              <Segmented label="Gender" value={settings.gender} onChange={(gender) => update({ gender })} options={[['male', 'Man'], ['female', 'Woman'], ['unspecified', 'Not specified']]} />
            </div>
          )}
          <p className="muted small">Uses {cfg.method}</p>
        </div>
        <AreaVerdict s={summarise(report)} />
      </header>

      <MethodNote />

      <ChartPair chart={chart} a={vargaChart(chart, 1)} b={vargaChart(chart, cfg.varga)} aTitle="D1 Rashi" bTitle={cfg.vargaTitle} />

      <Specific k={meta.key} report={report} />

      <h2 className="section-title">Divisional charts</h2>
      <VargaVerdicts items={report.vargas} />

      <h2 className="section-title">Timing</h2>
      <div className="timing-grid">
        <div>
          <h3>Dasha periods</h3>
          <p className="muted small">{cfg.dashaNote} Significators: {report.significators.join(', ')}.</p>
          <DashaTimeline items={report.dashas} empty="No significator periods in this window." />
        </div>
        <div>
          <h3>Double-transit windows</h3>
          <p className="muted small">{cfg.transitNote}</p>
          <TransitWindows items={report.windows} house={cfg.house} />
        </div>
      </div>

      <h2 className="section-title">All rules</h2>
      {cfg.lesson && <p className="small"><Link to={`/learn/${cfg.lesson}`}>How these rules work</Link></p>}
      <RuleGroups groups={report.groups} />
    </div>
  )
}

function Specific({ k, report }: { k: ReportKey; report: AreaReport }) {
  switch (k) {
    case 'career': return <CareerSection r={report as CareerReport} />
    case 'marriage': return <MarriageSection r={report as MarriageReport} />
    case 'wealth': return <WealthSection r={report as WealthReport} />
    case 'education': return <EducationSection r={report as EducationReport} />
    case 'children': return <ChildrenSection r={report as ChildrenReport} />
  }
}

function RankedPlanets({ items }: { items: { planet: keyof typeof GRAHA_INFO; score: number; list: string[]; reasons: string[] }[] }) {
  return (
    <div className="rank-grid">
      {items.map((f, i) => (
        <article key={f.planet} className={`card rank-card ${i === 0 ? 'top' : ''}`}>
          <header>
            <span className="rank-num">{i + 1}</span>
            <h3>{f.planet} <span className="muted small">{GRAHA_INFO[f.planet].sanskrit}</span></h3>
            <span className="tag">{f.reasons.length} {f.reasons.length === 1 ? 'indication' : 'indications'}</span>
          </header>
          <ul className="rank-list">{f.list.map((x) => <li key={x}>{x}</li>)}</ul>
          <Basis items={f.reasons} />
        </article>
      ))}
    </div>
  )
}

const STRENGTH: Record<ModeStrength, { label: string; pill: string }> = {
  strong: { label: 'Clear lean', pill: 'pill-good' },
  moderate: { label: 'Moderate', pill: 'pill-mixed' },
  weak: { label: 'Weak', pill: '' },
  none: { label: 'Not indicated', pill: '' },
}

const periodLabel = (p: ModePeriod) => `${p.ad ? `${p.md} / ${p.ad}` : `${p.md} mahadasha`}, ${fmtRange(p.start, p.end)}${p.now ? ' (running now)' : ''}`

function CareerSection({ r }: { r: CareerReport }) {
  const now = new Date()
  const v = r.modeVerdict
  const bestModes = r.modes.filter((m) => v.best.includes(m.label))
  const peaks = r.dashas.filter((d) => d.end > now).sort((a, b) => b.score - a.score).slice(0, 2).sort((a, b) => a.start.getTime() - b.start.getTime())
  const modes = [...r.modes].sort((a, b) => b.reasons.length - a.reasons.length)
  const [f1, f2] = r.fields
  return (
    <>
      <section className="card in-short">
        <h2>In short</h2>
        <dl className="short-list">
          <div>
            <dt>What to focus on</dt>
            <dd>{f1 ? <>{f1.planet}-ruled work: {f1.fields.slice(0, 3).join('; ').toLowerCase()}.{f2 && <> Next, {f2.planet}-ruled work: {f2.fields.slice(0, 2).join('; ').toLowerCase()}.</>}</> : 'No planet stands out; see the rules below.'}</dd>
          </div>
          <div>
            <dt>How to work</dt>
            <dd>{v.text}{v.least.length > 0 && <> Least indicated: {v.least.join(', ').toLowerCase()}.</>}</dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>
              {peaks.length > 0 && <>The strongest career periods ahead: {peaks.map((d) => `${d.md} / ${d.ad} (${fmtRange(d.start, d.end)})`).join(' and ')}. </>}
              {v.strength !== 'weak' && v.strength !== 'none' && bestModes.map((m) => m.periods.length > 0 && <span key={m.label}>For {m.label.toLowerCase()}, the dashas of {m.planets.join(' and ')}: {m.periods.slice(0, 2).map(periodLabel).join('; ')}. </span>)}
            </dd>
          </div>
        </dl>
        <p className="muted small">Read from the rules on this page. A dasha brings forward what its planet promises in the birth chart; it does not add a promise that is not there.</p>
      </section>

      <h2 className="section-title">Suitable fields</h2>
      <p className="muted">Independent classical rules each point to a planet. The planets named most often, and by the most important rules, indicate the fields that suit the chart. Every indication is listed.</p>
      <RankedPlanets items={r.fields.map((f) => ({ ...f, list: f.fields }))} />

      <h2 className="section-title">Mode of work</h2>
      <p className="muted small">Each way of working is tested against five classical indicators. An indicator is not good or bad by itself: each one that applies adds to the case for that mode. One on its own is weak, two is moderate and three or more is a clear lean. A low count means the chart does not point that way, not that it would fail.</p>
      <div className="mode-grid">
        {modes.map((m) => (
          <article key={m.label} className={`card mode-card ms-${m.strength}`}>
            <header className="insight-head">
              <h3>{m.label}</h3>
              <span className={`pill ${STRENGTH[m.strength].pill}`}>{STRENGTH[m.strength].label}</span>
            </header>
            <p className="small muted">{m.reasons.length} of 5 indicators apply</p>
            <span className="dots" aria-hidden="true">{m.checks.map((c, i) => <span key={i} className={c.met ? 'on' : ''} />)}</span>
            <ul className="checklist small">{m.checks.map((c) => <li key={c.text} className={c.met ? 'met' : 'unmet'}>{c.text}</li>)}</ul>
            <p className="small mode-when"><strong>Comes forward in the dashas of {m.planets.join(' and ')}</strong>{m.periods.length ? <>: {m.periods.map(periodLabel).join('; ')}.</> : ' (none in the next 15 years).'}</p>
          </article>
        ))}
      </div>
    </>
  )
}

function MarriageSection({ r }: { r: MarriageReport }) {
  const t = r.tendency
  return (
    <>
      <div className="grid-2 section-gap">
        <section className="card">
          <h2>Timing tendency</h2>
          <p className="big-verdict">{t.label}</p>
          <div className="tendency-bar" aria-label={`${t.early} early factors, ${t.delay} delay factors`}>
            <span className="early" style={{ flex: t.early || 0.2 }}>Early {t.early}</span>
            <span className="delay" style={{ flex: t.delay || 0.2 }}>Delay {t.delay}</span>
          </div>
          <ul className="small factor-list">
            {t.factors.map((f) => <li key={f.label} className={f.direction}>{f.label} <span className="muted">· {f.source}</span></li>)}
          </ul>
        </section>
        <section className="card">
          <h2>The partner</h2>
          <ul className="spouse-list">{r.spouse.map((s) => <li key={s.text}>{s.text} <span className="tag">{s.source}</span></li>)}</ul>
          <p className="muted small">Upapada in {RASHI[signName(r.upapadaSign)]} · Darakaraka {r.darakaraka}</p>
        </section>
      </div>
      <div className="grid-2 section-gap">
        <section className="card">
          <h2>Love or arranged</h2>
          <p className="big-verdict">{r.style.love.length > r.style.arranged.length ? 'Leans towards a love marriage' : r.style.arranged.length > r.style.love.length ? 'Leans towards an arranged marriage' : 'No clear lean either way'}</p>
          <div className="two-col small">
            <div><strong>Love indicators ({r.style.love.length})</strong><ul>{r.style.love.map((x) => <li key={x}>{x}</li>)}{!r.style.love.length && <li className="muted">None</li>}</ul></div>
            <div><strong>Arranged indicators ({r.style.arranged.length})</strong><ul>{r.style.arranged.map((x) => <li key={x}>{x}</li>)}{!r.style.arranged.length && <li className="muted">None</li>}</ul></div>
          </div>
        </section>
        <section className="card">
          <h2>Mangal dosha</h2>
          <p className="big-verdict">{r.mangal.status === 'none' ? 'Not present' : r.mangal.status === 'cancelled' ? 'Present, cancelled' : 'Present'}</p>
          <table className="data-table small">
            <thead><tr><th>Counted from</th><th>Mars in house</th><th>Dosha</th></tr></thead>
            <tbody>{r.mangal.checks.map((c) => <tr key={c.from}><td>{c.from}</td><td>{c.house}</td><td className={c.present ? 'neg' : 'pos'}>{c.present ? 'Yes' : 'No'}</td></tr>)}</tbody>
          </table>
          {r.mangal.cancellations.length > 0 && <p className="small">Cancellations: {r.mangal.cancellations.join('; ')}.</p>}
          <p className="muted small">Mars in the 1st, 2nd, 4th, 7th, 8th or 12th from the lagna, Moon or Venus. Mainly relevant when matching two charts. <Link to="/match">Open kundali matching</Link></p>
        </section>
      </div>
    </>
  )
}

function WealthSection({ r }: { r: WealthReport }) {
  return (
    <div className="grid-2 section-gap">
      <section className="card">
        <h2>Sources of gain</h2>
        <ul className="spouse-list">{r.sources.map((s) => <li key={s.from}>{s.text[0].toUpperCase() + s.text.slice(1)} <span className="tag">{s.from}</span></li>)}</ul>
        <p className="muted small">The house occupied by the 11th lord (gains), the 2nd lord (savings) and Jupiter (karaka of wealth).</p>
      </section>
      <section className="card">
        <h2>Indu Lagna and hora</h2>
        <p className="big-verdict">Indu Lagna in {RASHI[signName(r.induSign)]}</p>
        <p className="small">Sun hora (earned income): {r.hora.sun.join(', ') || 'none'}</p>
        <p className="small">Moon hora (accumulated wealth): {r.hora.moon.join(', ') || 'none'}</p>
        <p className="muted small">Indu Lagna is the classical wealth ascendant, calculated from the 9th lords from the lagna and the Moon.</p>
      </section>
    </div>
  )
}

function EducationSection({ r }: { r: EducationReport }) {
  return (
    <>
      <h2 className="section-title">Subjects that suit the chart</h2>
      <p className="muted">Rules for the 4th, 5th and 9th houses and the D24 chart each point to a planet. The planets named most often indicate the subjects that come most naturally. Every indication is listed.</p>
      <RankedPlanets items={r.subjects.map((s) => ({ ...s, list: s.subjects }))} />
    </>
  )
}

function ChildrenSection({ r }: { r: ChildrenReport }) {
  return (
    <section className="card section-gap">
      <h2>Supportive factors</h2>
      <p className="muted small">This report lists classical factors for the 5th house. It does not predict whether or when someone will have children; medical advice is the right source for that.</p>
      <ul className="spouse-list">
        <li>Putrakaraka (Jaimini significator of children): {r.putrakaraka}</li>
        {r.sphutas.map((s) => (
          <li key={s.name}>{s.name} (for {s.for}) in {RASHI[signName(s.sign)]}, navamsa {RASHI[signName(s.navamsa)]}: {s.favourable ? 'favourable' : 'needs support from other factors'} <span className="tag">{s.rule}</span></li>
        ))}
      </ul>
    </section>
  )
}

export function NeedChart({ what }: { what: string }) {
  return (
    <div className="page-head center">
      <h1>Enter birth details first</h1>
      <p className="lede">The {what} report is calculated from a birth chart.</p>
      <Link to="/chart" className="btn primary">Enter birth details</Link>
    </div>
  )
}

export function NeedTime({ hash, what }: { hash: string; what: string }) {
  return (
    <div className="page-head center">
      <h1>Birth time needed</h1>
      <p className="lede">The {what} report uses houses and divisional charts, which need a birth time.</p>
      <Link to={{ pathname: '/chart', hash }} className="btn primary">Back to the chart</Link>
    </div>
  )
}
