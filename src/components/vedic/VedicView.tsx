import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { BirthData } from '../../astro/ephemeris'
import { encodeBirth } from '../../lib/share'
import { useSettings } from '../../lib/settings'
import { useVedicChart } from '../../lib/useVedic'
import { GRAHA_INFO, NAKSHATRAS, RASHI } from '../../vedic/constants'
import { LEVEL_NAMES, periodChain, subPeriods, upcomingAntardashas, type Period } from '../../vedic/dasha'
import { interpretVedic, type VInsight, type VedicReading } from '../../vedic/interpret'
import { REPORTS, buildReport, verdictOf } from '../../vedic/reports'
import { AYANAMSA_LABEL } from '../../vedic/settings'
import { signName, type VedicChart } from '../../vedic/sidereal'
import { VARGAS, VARGA_BY_N, type VargaN } from '../../vedic/varga'
import { YOGA_GROUPS, yogaTone } from '../../vedic/yogas'
import InsightCard from '../InsightCard'
import { ChartStyleToggle, VargaSquare } from './ChartPair'
import { ReportNav, YogaCard, fmtRange } from './ReportParts'

type Tab = 'overview' | 'grahas' | 'bhavas' | 'yogas' | 'vargas' | 'dasha'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'grahas', label: 'Planets' },
  { id: 'bhavas', label: 'Houses' },
  { id: 'yogas', label: 'Yogas' },
  { id: 'vargas', label: 'Divisional charts' },
  { id: 'dasha', label: 'Dasha' },
]

export default function VedicView({ birth, actions }: { birth: BirthData; actions?: ReactNode }) {
  const chart = useVedicChart(birth)!
  const reading = useMemo(() => interpretVedic(chart), [chart])
  const { settings } = useSettings()
  const [tab, setTab] = useState<Tab>('overview')
  const hash = encodeBirth(birth)

  const moon = chart.grahas[1]
  const nk = NAKSHATRAS[moon.nakshatra]
  const heading = [
    chart.lagnaSign !== null ? `${RASHI[signName(chart.lagnaSign)]} lagna` : null,
    `${RASHI[signName(moon.sign)]} rashi`,
    `${nk.name} nakshatra`,
  ].filter(Boolean).join(' · ')

  return (
    <div className="chart-view vedic">
      <ReportNav hash={hash} />
      <section className="vedic-hero night">
        <div className="chart-hero-text">
          <p className="eyebrow">{birth.name ? `${birth.name} · ` : ''}Janma kundali</p>
          <h1>{heading}</h1>
          <p className="muted">
            {new Date(birth.date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            {birth.time ? ` · ${birth.time}` : ' · time unknown'} · {birth.place}
          </p>
          <p className="muted small">
            {AYANAMSA_LABEL[settings.ayanamsa]} ayanamsa {fmtDeg(chart.ayanamsa)} · whole-sign houses · {settings.node} nodes · {settings.karakas} chara karakas · <Link to="/settings">Change</Link>
          </p>
          <div className="chart-actions">
            <ChartStyleToggle />
            {actions}
          </div>
          {!chart.timeKnown && <p className="callout note small">Without a birth time the lagna, houses and divisional-chart ascendants cannot be calculated. The charts use the Moon sign as the first house.</p>}
        </div>
        <div className="vedic-charts">
          <VargaSquare chart={chart} vc={reading.vargaCharts[1]} title="D1 Rashi" subtitle="Birth chart" />
          <VargaSquare chart={chart} vc={reading.vargaCharts[9]} title="D9 Navamsa" subtitle="Strength and marriage" />
        </div>
      </section>

      <nav className="tabs" role="tablist" aria-label="Kundali sections">
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`vtab-${t.id}`} aria-selected={tab === t.id} aria-controls={`vpanel-${t.id}`} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <section role="tabpanel" id={`vpanel-${tab}`} aria-labelledby={`vtab-${tab}`} className="tab-panel">
        {tab === 'overview' && <Overview chart={chart} reading={reading} hash={hash} onTab={setTab} />}
        {tab === 'grahas' && <Planets chart={chart} reading={reading} />}
        {tab === 'bhavas' && (reading.lords.length
          ? <><p className="muted">Each house is ruled by the lord of its sign. Where that lord sits shows how the house's matters develop.</p><Cards items={reading.lords} list /></>
          : <p className="muted">House lordships need a birth time.</p>)}
        {tab === 'yogas' && <Yogas reading={reading} />}
        {tab === 'vargas' && <Vargas chart={chart} reading={reading} />}
        {tab === 'dasha' && <DashaPanel reading={reading} />}
      </section>
      <p className="muted small center disclaimer">
        Jyotish is a traditional symbolic system. These rule-based readings describe tendencies, not fixed events, and are not a substitute for medical, legal, financial or marital advice.
      </p>
    </div>
  )
}

function Overview({ chart, reading, hash, onTab }: { chart: VedicChart; reading: VedicReading; hash: string; onTab: (t: Tab) => void }) {
  const { settings } = useSettings()
  const areas = useMemo(
    () => (chart.timeKnown ? REPORTS.map((r) => ({ ...r, report: buildReport(r.key, chart, settings.gender, reading.yogas) })) : []),
    [chart, reading.yogas, settings.gender],
  )
  const strong = reading.yogas.filter((y) => y.present && yogaTone(y) === 'good' && y.def.group !== 'Nabhasa').slice(0, 4)
  return (
    <>
      {areas.length > 0 && (
        <>
          <h2 className="section-title first">Life areas</h2>
          <div className="area-grid">
            {areas.map((a) => a.report && (
              <Link key={a.key} className={`card area-card ${a.report.score >= 60 ? 'hi' : a.report.score >= 40 ? 'mid' : 'lo'}`} to={{ pathname: `/chart/${a.key}`, hash }}>
                <span className="area-head"><strong>{a.title}</strong><span className="area-score">{a.report.score}</span></span>
                <span className="bar-track"><span className="bar-fill" style={{ width: `${a.report.score}%` }} /></span>
                <span className="area-verdict">{verdictOf(a.report.score)}</span>
                <span className="muted small">{a.summary}</span>
                <span className="area-open">Open report</span>
              </Link>
            ))}
          </div>
        </>
      )}
      <h2 className="section-title">Foundations</h2>
      <Cards items={reading.core} />
      <h2 className="section-title">Main yogas</h2>
      {strong.length ? <div className="insight-grid">{strong.map((y) => <YogaCard key={y.def.id} y={y} />)}</div> : <p className="muted">No major supportive yogas.</p>}
      <p className="small"><button className="linklike" onClick={() => onTab('yogas')}>See all {reading.yogas.length} yogas checked</button></p>
      <h2 className="section-title">Current period</h2>
      <Cards items={reading.dashaInsights} />
    </>
  )
}

function Planets({ chart, reading }: { chart: VedicChart; reading: VedicReading }) {
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
      <Cards items={reading.grahas} list />
    </>
  )
}

function Yogas({ reading }: { reading: VedicReading }) {
  const [all, setAll] = useState(false)
  const present = reading.yogas.filter((y) => y.present)
  return (
    <>
      <div className="rule-toolbar">
        <p className="muted small">{present.length} of {reading.yogas.length} classical yogas are present. Yogas give results mainly in the dashas of the planets that form them.</p>
        <label className="check small"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Show yogas that are not present</label>
      </div>
      {YOGA_GROUPS.map((g) => {
        const list = reading.yogas.filter((y) => y.def.group === g && (all || y.present))
        if (!list.length) return null
        return (
          <section key={g} className="rule-group">
            <h3>{g}</h3>
            <div className="insight-list">{list.map((y) => <YogaCard key={y.def.id} y={y} />)}</div>
          </section>
        )
      })}
    </>
  )
}

function Vargas({ chart, reading }: { chart: VedicChart; reading: VedicReading }) {
  const [varga, setVarga] = useState<VargaN>(9)
  const info = VARGA_BY_N[varga]
  return (
    <>
      <div className="chip-row" role="group" aria-label="Divisional chart">
        {VARGAS.map((v) => (
          <button key={v.n} className={`chip ${varga === v.n ? 'active' : ''}`} aria-pressed={varga === v.n} onClick={() => setVarga(v.n)} title={`${v.name}: ${v.domain}`}>
            {v.code}{v.standard ? '' : '*'}
          </button>
        ))}
      </div>
      <div className="varga-layout">
        <div>
          <VargaSquare chart={chart} vc={reading.vargaCharts[varga]} title={`${info.code} ${info.name}`} subtitle={info.domain} />
          <p className="small">{info.about}</p>
          {!info.standard && <p className="callout warn small">* D5, D6 and D8 are not among Parashara's sixteen vargas. They use later methods.</p>}
          {varga >= 16 && !chart.timeKnown && <p className="callout warn small">Higher divisions change within minutes and need an exact birth time.</p>}
        </div>
        <div>{varga === 1 ? <Cards items={[...reading.core, ...reading.lords.slice(0, 3)]} list /> : <Cards items={reading.vargas[varga]} list />}</div>
      </div>
      <h2 className="section-title">All divisional charts</h2>
      <div className="varga-grid">
        {VARGAS.map((v) => (
          <button key={v.n} className={`varga-thumb ${varga === v.n ? 'active' : ''}`} onClick={() => { setVarga(v.n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
            <VargaSquare chart={chart} vc={reading.vargaCharts[v.n]} title={`${v.code} ${v.name}`} compact />
          </button>
        ))}
      </div>
    </>
  )
}

function DashaPanel({ reading }: { reading: VedicReading }) {
  const now = new Date()
  const chain = periodChain(reading.dashas, now, 4)
  const upcoming = upcomingAntardashas(reading.dashas, now, 6)
  return (
    <>
      <div className="grid-2 section-gap">
        <section className="card">
          <h2>Running periods</h2>
          <ol className="chain">
            {chain.map((p) => (
              <li key={p.level}>
                <span className="muted small">{LEVEL_NAMES[p.level]}</span>
                <strong>{p.lord}</strong>
                <span className="muted small">{fmtDate(p.start)} to {fmtDate(p.end)}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="card">
          <h2>Next antardashas</h2>
          <ul className="upcoming">
            {upcoming.map((p) => <li key={p.start.getTime()}><strong>{p.path.join(' / ')}</strong> <span className="muted small">from {fmtDate(p.start)}</span></li>)}
          </ul>
        </section>
      </div>
      <div className="section-gap"><Cards items={reading.dashaInsights} /></div>
      <h2 className="section-title">Vimshottari dasha</h2>
      <p className="muted small">Open a mahadasha to see its antardashas, and an antardasha to see its pratyantardashas.</p>
      <ol className="dasha-list">
        {reading.dashas.map((md) => {
          const active = md.start <= now && now < md.end
          const pct = active ? ((now.getTime() - md.start.getTime()) / (md.end.getTime() - md.start.getTime())) * 100 : md.end < now ? 100 : 0
          return (
            <li key={md.lord + md.start.getTime()} className={`card dasha ${active ? 'active' : ''} ${md.end < now ? 'past' : ''}`}>
              <details open={active}>
                <summary>
                  <span className="dasha-lord">{md.lord} <span className="muted small">{GRAHA_INFO[md.lord].sanskrit}</span></span>
                  <span className="small muted">{fmtRange(md.start, md.end)}</span>
                  <span className="dasha-bar" aria-hidden><span style={{ width: `${pct}%` }} /></span>
                </summary>
                <p className="small dasha-theme">{reading.dashaThemes[md.lord]}</p>
                <ul className="antar">{md.sub!.map((ad) => <SubPeriod key={ad.lord} p={ad} now={now} />)}</ul>
              </details>
            </li>
          )
        })}
      </ol>
      <p className="muted small">Dates use a year of 365.2425 days. Some software uses 360 or 365.25 days, so boundaries can differ by a few weeks.</p>
    </>
  )
}

function SubPeriod({ p, now }: { p: Period; now: Date }) {
  const [open, setOpen] = useState(false)
  const active = p.start <= now && now < p.end
  return (
    <li className={active ? 'now' : ''}>
      <button className="linklike sub-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{p.path.join(' / ')}</span><span className="muted">{fmtDate(p.start)} to {fmtDate(p.end)}</span>
      </button>
      {open && <ul className="pratyantar">{subPeriods(p).map((pd) => <li key={pd.lord} className={pd.start <= now && now < pd.end ? 'now' : ''}><span>{pd.lord}</span><span className="muted">{fmtDate(pd.start)} to {fmtDate(pd.end)}</span></li>)}</ul>}
    </li>
  )
}

function Cards({ items, list }: { items: VInsight[]; list?: boolean }) {
  if (!items.length) return <p className="muted">Nothing notable here.</p>
  return <div className={list ? 'insight-list' : 'insight-grid'}>{items.map((i) => <InsightCard key={i.id} insight={i} />)}</div>
}

const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

function fmtDeg(d: number) {
  const deg = Math.floor(d)
  const min = Math.floor((d - deg) * 60)
  return `${deg}°${String(min).padStart(2, '0')}′`
}
