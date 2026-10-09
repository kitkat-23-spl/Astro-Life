import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { BirthData } from '../../astro/ephemeris'
import { encodeBirth } from '../../lib/share'
import { useSettings } from '../../lib/settings'
import { useVedicChart } from '../../lib/useVedic'
import { NAKSHATRAS, RASHI } from '../../vedic/constants'
import { interpretVedic } from '../../vedic/interpret'
import { AYANAMSA_LABEL } from '../../vedic/settings'
import { signName } from '../../vedic/sidereal'
import Term from '../Term'
import { ChartStyleToggle, VargaSquare } from './ChartPair'
import { ChartNav } from './ReportParts'
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
  const panelRef = useRef<HTMLElement>(null)
  // The open section lives in the URL (?tab=), so links, reloads and the back button keep it.
  const param = new URLSearchParams(search).get('tab') as Tab | null
  const tab: Tab = param && TABS.some((t) => t.id === param) ? param : 'overview'
  const go = (t: Tab) => navigate({ search: t === 'overview' ? '' : `?tab=${t}`, hash }, { preventScrollReset: true })
  // Bring the newly opened section into view; the overview starts at the top of the page.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      if (tab === 'overview') return
    }
    if (tab === 'overview') window.scrollTo({ top: 0 })
    else panelRef.current?.scrollIntoView({ block: 'start' })
  }, [tab])

  const moon = chart.grahas[1]
  const nk = NAKSHATRAS[moon.nakshatra]
  const heading = [
    chart.lagnaSign !== null ? <>{RASHI[signName(chart.lagnaSign)]} <Term k="lagna">lagna</Term></> : null,
    <>{RASHI[signName(moon.sign)]} <Term k="rashi">rashi</Term></>,
    <>{nk.name} <Term k="nakshatra">nakshatra</Term></>,
  ].filter(Boolean).map((h, i) => <span key={i}>{i > 0 && ' · '}{h}</span>)

  return (
    <div className="chart-view vedic">
      <ChartNav hash={encodeBirth(birth)} />
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

      <section id={`vpanel-${tab}`} aria-label={TABS.find((t) => t.id === tab)!.label} className="tab-panel" ref={panelRef}>
        {tab === 'overview' && <OverviewTab chart={chart} reading={reading} hash={encodeBirth(birth)} go={go} />}
        {tab === 'planets' && <PlanetsTab chart={chart} reading={reading} />}
        {tab === 'houses' && <HousesTab chart={chart} reading={reading} />}
        {tab === 'yogas' && <YogasTab reading={reading} />}
        {tab === 'vargas' && <VargasTab chart={chart} reading={reading} />}
        {tab === 'ashtakavarga' && <AshtakavargaTab chart={chart} />}
        {tab === 'dasha' && <DashaTab chart={chart} reading={reading} />}
        {tab === 'transits' && <TransitsTab chart={chart} reading={reading} />}
        {tab === 'special' && <SpecialTab chart={chart} />}
      </section>
      <p className="muted small center disclaimer">
        Jyotish is a traditional symbolic system. These rule-based readings describe tendencies, not fixed events, and are not a substitute for medical, legal, financial or marital advice.
      </p>
    </div>
  )
}
