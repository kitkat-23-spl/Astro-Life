import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { encodeBirth } from '../../lib/share'
import type { BirthData } from '../../astro/ephemeris'
import { GRAHA_INFO, NAKSHATRAS, RASHI } from '../../vedic/constants'
import { interpretVedic, type VInsight } from '../../vedic/interpret'
import { computeVedicChart, signName, type VargaChart } from '../../vedic/sidereal'
import { VARGAS, type VargaN } from '../../vedic/varga'
import InsightCard from '../InsightCard'
import Segmented from '../Segmented'
import SquareChart, { type ChartStyle } from './SquareChart'
import { STYLE_KEY, itemsFor, lagnaFor, loadStyle } from './chartItems'

const LIFE_ICON: Record<string, string> = {
  'Career & status': '💼', 'Marriage & partnership': '💍', Wealth: '💰', 'Home & property': '🏡', 'Children & creativity': '🧒', 'Courage & siblings': '💪',
}

type Tab = 'overview' | 'grahas' | 'bhavas' | 'yogas' | 'vargas' | 'dasha'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'grahas', label: 'Grahas' },
  { id: 'bhavas', label: 'Bhavas' },
  { id: 'yogas', label: 'Yogas & Doshas' },
  { id: 'vargas', label: 'D1–D10 Charts' },
  { id: 'dasha', label: 'Dasha' },
]

export default function VedicView({ birth, actions }: { birth: BirthData; actions?: ReactNode }) {
  const chart = useMemo(() => computeVedicChart(birth), [birth])
  const reading = useMemo(() => interpretVedic(chart), [chart])
  const [tab, setTab] = useState<Tab>('overview')
  const [style, setStyleState] = useState<ChartStyle>(loadStyle)
  const [varga, setVarga] = useState<VargaN>(9)
  const setStyle = (s: ChartStyle) => {
    setStyleState(s)
    try { localStorage.setItem(STYLE_KEY, s) } catch { /* not persisted */ }
  }

  const moon = chart.grahas[1]
  const nk = NAKSHATRAS[moon.nakshatra]
  const d1 = reading.vargaCharts[1]
  const d9 = reading.vargaCharts[9]
  const chartFor = (vc: VargaChart, title: string, subtitle?: string, compact?: boolean) => {
    const l = lagnaFor(vc)
    return <SquareChart style={style} lagnaSign={l.sign} lagnaIsMoon={l.moon && vc.n === 1} items={itemsFor(chart, vc)} title={title} subtitle={subtitle} compact={compact} />
  }

  const b = chart.birth
  const heading = [
    chart.lagnaSign !== null ? `${RASHI[signName(chart.lagnaSign)]} Lagna` : null,
    `${RASHI[signName(moon.sign)]} Rashi`,
    `${nk.name} Nakshatra`,
  ].filter(Boolean).join(' · ')

  return (
    <div className="chart-view vedic">
      <section className="vedic-hero night">
        <div className="chart-hero-text">
          <p className="eyebrow">{b.name ? `${b.name}’s Janma Kundali` : 'Janma Kundali'} · Vedic / Jyotish</p>
          <h1>{heading}</h1>
          <p className="muted">
            {new Date(b.date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            {b.time ? ` · ${b.time}` : ' · time unknown'} · {b.place}
          </p>
          <p className="muted small">Sidereal zodiac · Lahiri ayanamsa {fmtDeg(chart.ayanamsa)} · Whole-sign houses · Mean nodes</p>
          <div className="chart-actions">
            <Segmented label="Chart style" value={style} onChange={setStyle} options={[['north', 'North Indian'], ['south', 'South Indian']]} />
            {actions}
          </div>
          {!chart.timeKnown && <p className="callout note small">Without a birth time the lagna, houses and divisional-chart ascendants can’t be calculated. Charts use the Moon’s sign as the lagna.</p>}
        </div>
        <div className="vedic-charts">
          {chartFor(d1, 'D1 Rashi', 'Birth chart')}
          {chartFor(d9, 'D9 Navamsa', 'Strength & marriage')}
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
        {tab === 'overview' && (
          <>
            {reading.lifeAreas.length > 0 && (
              <div className="card life-areas">
                <h3>Life areas at a glance</h3>
                <div className="life-grid">
                  {reading.lifeAreas.map((a) => (
                    <div key={a.label} className={`life-area ${a.score >= 65 ? 'hi' : a.score >= 45 ? 'mid' : 'lo'}`}>
                      <div className="life-head"><span className="life-icon" aria-hidden>{LIFE_ICON[a.label] ?? '✦'}</span><span>{a.label}</span></div>
                      <meter min={0} max={100} low={45} high={65} optimum={90} value={a.score} aria-label={`${a.label}: ${a.verdict}`} />
                      <span className="life-verdict">{a.verdict}</span>
                      <span className="life-basis">{a.rule.replace(/ dignity & placement/, '').replace(/, in /, ' · ')}</span>
                    </div>
                  ))}
                </div>

              </div>
            )}
            {chart.timeKnown && (
              <div className="explore">
                <Link className="card explore-card" to={{ pathname: '/chart/career', hash: encodeBirth(b) }}>
                  <span className="explore-icon" aria-hidden>♄</span>
                  <span><strong>Explore your career</strong><span className="muted small">Suitable fields, job vs business, D10 and 5 other vargas, yogas, and the best dasha and transit periods.</span></span>
                  <span aria-hidden>→</span>
                </Link>
                <Link className="card explore-card" to={{ pathname: '/chart/marriage', hash: encodeBirth(b) }}>
                  <span className="explore-icon" aria-hidden>♀</span>
                  <span><strong>Explore marriage</strong><span className="muted small">Timing, partner traits, D9 and Upapada, Mangal dosha, love or arranged, and favourable marriage windows.</span></span>
                  <span aria-hidden>→</span>
                </Link>
                <Link className="card explore-card" to="/match">
                  <span className="explore-icon" aria-hidden>⚭</span>
                  <span><strong>Match two charts</strong><span className="muted small">36-point Guna Milan, poruthams and dosha matching with a partner.</span></span>
                  <span aria-hidden>→</span>
                </Link>
              </div>
            )}
            <h2 className="section-title">The foundations</h2>
            <Cards items={reading.core} />
            <h2 className="section-title">Key yogas</h2>
            <Cards items={reading.yogas.filter((y) => y.tone === 'good').slice(0, 3)} />
            <h2 className="section-title">Current period</h2>
            <Cards items={reading.dashaInsights} />
          </>
        )}
        {tab === 'grahas' && (
          <>
            <div className="card table-wrap">
              <table className="data-table">
                <caption className="sr-only">Graha positions</caption>
                <thead><tr><th>Graha</th><th>Rashi</th><th>Degree</th><th>Nakshatra</th>{chart.lagnaSign !== null && <th>House</th>}<th>Dignity</th><th>Notes</th></tr></thead>
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
                      <td className={g.dignity === 'debilitated' ? 'neg' : g.dignity && ['exalted', 'moolatrikona', 'own'].includes(g.dignity) ? 'pos' : ''}>{g.dignity ?? '—'}</td>
                      <td className="muted">{[g.retrograde && (g.graha === 'Rahu' || g.graha === 'Ketu' ? 'always ℞' : 'Retrograde'), g.combust && 'Combust'].filter(Boolean).join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Cards items={reading.grahas} list />
          </>
        )}
        {tab === 'bhavas' && (
          reading.lords.length ? (
            <>
              <p className="muted">Each house is ruled by the lord of the sign on it. Where that lord sits shows how the house’s matters play out: Bhavat Bhavam, the core Parashari technique.</p>
              <Cards items={reading.lords} list />
            </>
          ) : <p className="muted">House lordships need a birth time.</p>
        )}
        {tab === 'yogas' && (
          <>
            <p className="muted">Yogas are planetary combinations with specific classical results. Their strength depends on the dignity of the planets involved, and they deliver mainly during the dashas of those planets.</p>
            <Cards items={reading.yogas} list />
          </>
        )}
        {tab === 'vargas' && (
          <>
            <div className="chip-row" role="group" aria-label="Divisional chart">
              {VARGAS.map((v) => (
                <button key={v.n} className={`chip ${varga === v.n ? 'active' : ''}`} aria-pressed={varga === v.n} onClick={() => setVarga(v.n)} title={v.name}>
                  {v.code}{v.standard ? '' : '*'}
                </button>
              ))}
            </div>
            {(() => {
              const info = VARGAS.find((v) => v.n === varga)!
              return (
                <div className="varga-layout">
                  <div>
                    {chartFor(reading.vargaCharts[varga], `${info.code} ${info.name}`, info.domain.split(',')[0])}
                    <p className="small">{info.about}</p>
                    {!info.standard && <p className="callout warn small">* D5, D6 and D8 are not among Parashara’s sixteen vargas. They are included for completeness using later methods.</p>}
                  </div>
                  <div>
                    {varga === 1
                      ? <Cards items={[...reading.core, ...reading.lords.slice(0, 3)]} list />
                      : <Cards items={reading.vargas[varga]} list />}
                  </div>
                </div>
              )
            })()}
            <h2 className="section-title">All divisional charts</h2>
            <div className="varga-grid">
              {VARGAS.map((v) => (
                <button key={v.n} className={`varga-thumb ${varga === v.n ? 'active' : ''}`} onClick={() => { setVarga(v.n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                  {chartFor(reading.vargaCharts[v.n], `${v.code} ${v.name}`, undefined, true)}
                </button>
              ))}
            </div>
          </>
        )}
        {tab === 'dasha' && <DashaPanel reading={reading} />}
      </section>
      <p className="muted small center disclaimer">
        Jyotish is a traditional symbolic system for reflection. These rule-based readings are not predictions of fixed events and are not a substitute for medical, legal, financial or marital advice.
      </p>
    </div>
  )
}

function DashaPanel({ reading }: { reading: ReturnType<typeof interpretVedic> }) {
  const now = new Date()
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  return (
    <>
      <Cards items={reading.dashaInsights} />
      <h2 className="section-title">Vimshottari Mahadasha timeline</h2>
      <ol className="dasha-list">
        {reading.dashas.map((md) => {
          const active = md.start <= now && now < md.end
          const pct = active ? ((now.getTime() - md.start.getTime()) / (md.end.getTime() - md.start.getTime())) * 100 : md.end < now ? 100 : 0
          return (
            <li key={md.lord + md.start.getTime()} className={`card dasha ${active ? 'active' : ''} ${md.end < now ? 'past' : ''}`}>
              <details open={active}>
                <summary>
                  <span className="dasha-lord">{md.lord} <span className="muted small">{GRAHA_INFO[md.lord].sanskrit}</span></span>
                  <span className="small muted">{fmt(md.start)} – {fmt(md.end)}</span>
                  <span className="dasha-bar" aria-hidden><span style={{ width: `${pct}%` }} /></span>
                </summary>
                <p className="small dasha-theme">Themes: {reading.dashaThemes[md.lord]}</p>
                <ul className="antar">
                  {md.sub!.map((ad) => (
                    <li key={ad.lord} className={ad.start <= now && now < ad.end ? 'now' : ''}>
                      <span>{md.lord}–{ad.lord}</span><span className="muted">{fmt(ad.start)} – {fmt(ad.end)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          )
        })}
      </ol>
      <p className="muted small">Dates use a 365.2425-day year. Traditions differ slightly (some use 360 or 365.25 days), so boundaries can vary by a few weeks between software.</p>
    </>
  )
}

function Cards({ items, list }: { items: VInsight[]; list?: boolean }) {
  if (!items.length) return <p className="muted">Nothing notable here.</p>
  return <div className={list ? 'insight-list' : 'insight-grid'}>{items.map((i) => <InsightCard key={i.id} insight={i} />)}</div>
}


function fmtDeg(d: number) {
  const deg = Math.floor(d)
  const min = Math.floor((d - deg) * 60)
  return `${deg}°${String(min).padStart(2, '0')}′`
}
