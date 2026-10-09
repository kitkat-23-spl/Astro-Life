import { DateTime } from 'luxon'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import SquareChart from '../components/vedic/SquareChart'
import { useSettings } from '../lib/settings'
import { GRAHA_INFO } from '../vedic/constants'
import { computePanchang } from '../vedic/panchang'
import { DEFAULT_PLACE } from '../vedic/settings'
import { computeVedicChart, signName } from '../vedic/sidereal'

const TOOLS: { to: string; title: string; text: string }[] = [
  { to: '/chart', title: 'Kundali', text: 'D1 to D60 vargas, Shadbala, Ashtakavarga, four dasha systems, transits, KP cusps and the annual chart.' },
  { to: '/chart', title: 'Life-area reports', text: 'Career, marriage, wealth, education and children, each read from classical rules, with the main supporting factors, cautions and timing windows.' },
  { to: '/match', title: 'Kundali matching', text: '36-point Ashtakoota, ten South Indian poruthams and Mangal dosha for both partners.' },
  { to: '/panchang', title: 'Panchang', text: 'Tithi, nakshatra, yoga, karana, Rahu Kaal, Choghadiya and Hora for any place and date.' },
  { to: '/learn', title: 'Learn Jyotish', text: 'A 19-lesson course from signs and houses to yogas, dashas and transits, with worked examples.' },
]

export default function HomePage() {
  const { settings } = useSettings()
  const place = settings.place ?? DEFAULT_PLACE
  const now = useMemo(() => {
    const dt = DateTime.now().setZone(place.timezone)
    return computeVedicChart({
      name: '', date: dt.toISODate()!, time: dt.toFormat('HH:mm'), place: place.label,
      latitude: place.latitude, longitude: place.longitude, timezone: place.timezone, houseSystem: 'whole-sign',
    }, settings)
  }, [place, settings])
  const today = useMemo(() => {
    try {
      return computePanchang(DateTime.now().setZone(place.timezone).toISODate()!, place.latitude, place.longitude, place.timezone, settings.ayanamsa)
    } catch {
      return null
    }
  }, [place, settings.ayanamsa])
  const t = (d: Date) => DateTime.fromJSDate(d).setZone(place.timezone).toFormat('HH:mm')

  const items = [
    { sign: now.lagnaSign!, label: 'Asc', title: `Lagna ${signName(now.lagnaSign!)}`, tone: 'asc' as const },
    ...now.grahas.map((g) => ({ sign: g.sign, label: `${GRAHA_INFO[g.graha].abbr} ${Math.floor(g.degree)}°`, title: `${g.graha} in ${signName(g.sign)}` })),
  ]

  return (
    <div className="home">
      <section className="hero night">
        <div className="hero-text">
          <h1>Kundali, Panchang and matching, with every rule shown.</h1>
          <div className="hero-cta">
            <Link to="/chart" className="btn primary">Create a kundali</Link>
            <Link to="/panchang" className="btn ghost">Today's Panchang</Link>
          </div>
        </div>
        <div className="hero-wheel">
          <SquareChart style={settings.chartStyle} lagnaSign={now.lagnaSign!} items={items} title="Sky now" subtitle={`${place.label} · Moon in ${signName(now.grahas[1].sign)}`} />
        </div>
      </section>

      {today && (
        <section className="card today">
          <div className="today-head">
            <h2>Today in {place.label.split(',')[0]}</h2>
            <Link to="/panchang" className="small">Full Panchang</Link>
          </div>
          <dl className="today-grid">
            <div><dt>Tithi</dt><dd>{today.tithi.paksha} {today.tithi.name}</dd></div>
            <div><dt>Nakshatra</dt><dd>{today.nakshatra.name}</dd></div>
            <div><dt>Yoga</dt><dd>{today.yoga.name}</dd></div>
            <div><dt>Sunrise</dt><dd>{t(today.sunrise)}</dd></div>
            <div><dt>Rahu Kaal</dt><dd>{t(today.periods.rahuKaal.start)} to {t(today.periods.rahuKaal.end)}</dd></div>
            <div><dt>Abhijit</dt><dd>{t(today.periods.abhijit.start)} to {t(today.periods.abhijit.end)}</dd></div>
          </dl>
        </section>
      )}

      <h2 className="section-title">Tools</h2>
      <div className="tool-grid">
        {TOOLS.map((x) => (
          <Link key={x.title} to={x.to} className="card tool-card">
            <strong>{x.title}</strong>
            <span>{x.text}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
