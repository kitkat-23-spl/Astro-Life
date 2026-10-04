import { useMemo, useRef, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { BirthData } from '../../astro/ephemeris'
import { encodeBirth } from '../../lib/share'
import { useSettings } from '../../lib/settings'
import { useVedicChart } from '../../lib/useVedic'
import { NAKSHATRAS, RASHI } from '../../vedic/constants'
import { interpretVedic } from '../../vedic/interpret'
import { AYANAMSA_LABEL } from '../../vedic/settings'
import { signName } from '../../vedic/sidereal'
import { ChartStyleToggle, VargaSquare } from './ChartPair'
import { ReportNav } from './ReportParts'
import { fmtDeg } from './format'
import AshtakavargaTab from './tabs/AshtakavargaTab'
import DashaTab from './tabs/DashaTab'
import HousesTab from './tabs/HousesTab'
import OverviewTab from './tabs/OverviewTab'
import PlanetsTab from './tabs/PlanetsTab'
import SpecialTab from './tabs/SpecialTab'
import TransitsTab from './tabs/TransitsTab'
import VargasTab from './tabs/VargasTab'
import YogasTab from './tabs/YogasTab'

export type Tab = 'overview' | 'planets' | 'houses' | 'yogas' | 'vargas' | 'ashtakavarga' | 'dasha' | 'transits' | 'special'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'planets', label: 'Planets' },
  { id: 'houses', label: 'Houses' },
  { id: 'yogas', label: 'Yogas' },
  { id: 'vargas', label: 'Vargas' },
  { id: 'ashtakavarga', label: 'Ashtakavarga' },
  { id: 'dasha', label: 'Dasha' },
  { id: 'transits', label: 'Transits' },
  { id: 'special', label: 'Special points' },
]

export default function VedicView({ birth, actions }: { birth: BirthData; actions?: ReactNode }) {
  const chart = useVedicChart(birth)!
  const reading = useMemo(() => interpretVedic(chart), [chart])
  const { settings } = useSettings()
  const { search, hash } = useLocation()
  const navigate = useNavigate()
  const tabsRef = useRef<HTMLElement>(null)
  // The open tab lives in the URL (?tab=), so links, reloads and the back button keep it.
  const param = new URLSearchParams(search).get('tab') as Tab | null
  const tab: Tab = param && TABS.some((t) => t.id === param) ? param : 'overview'
  const setTab = (t: Tab) => navigate({ search: t === 'overview' ? '' : `?tab=${t}`, hash }, { preventScrollReset: true })
  const go = (t: Tab) => {
    setTab(t)
    tabsRef.current?.scrollIntoView({ block: 'start' })
  }

  const moon = chart.grahas[1]
  const nk = NAKSHATRAS[moon.nakshatra]
  const heading = [
    chart.lagnaSign !== null ? `${RASHI[signName(chart.lagnaSign)]} lagna` : null,
    `${RASHI[signName(moon.sign)]} rashi`,
    `${nk.name} nakshatra`,
  ].filter(Boolean).join(' · ')

  return (
    <div className="chart-view vedic">
      <ReportNav hash={encodeBirth(birth)} />
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

      <nav className="tabs" role="tablist" aria-label="Kundali sections" ref={tabsRef}>
        {TABS.map((t) => (
          <button key={t.id} role="tab" id={`vtab-${t.id}`} aria-selected={tab === t.id} aria-controls={`vpanel-${t.id}`} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <section role="tabpanel" id={`vpanel-${tab}`} aria-labelledby={`vtab-${tab}`} className="tab-panel">
        {tab === 'overview' && <OverviewTab chart={chart} reading={reading} hash={encodeBirth(birth)} go={go} />}
        {tab === 'planets' && <PlanetsTab chart={chart} reading={reading} />}
        {tab === 'houses' && <HousesTab chart={chart} reading={reading} />}
        {tab === 'yogas' && <YogasTab reading={reading} />}
        {tab === 'vargas' && <VargasTab chart={chart} reading={reading} />}
        {tab === 'ashtakavarga' && <AshtakavargaTab chart={chart} />}
        {tab === 'dasha' && <DashaTab chart={chart} reading={reading} />}
        {tab === 'transits' && <TransitsTab chart={chart} />}
        {tab === 'special' && <SpecialTab chart={chart} />}
      </section>
      <p className="muted small center disclaimer">
        Jyotish is a traditional symbolic system. These rule-based readings describe tendencies, not fixed events, and are not a substitute for medical, legal, financial or marital advice.
      </p>
    </div>
  )
}
