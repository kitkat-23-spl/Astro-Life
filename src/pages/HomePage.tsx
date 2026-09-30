import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DateTime } from 'luxon'
import SquareChart from '../components/vedic/SquareChart'
import { GRAHA_INFO } from '../vedic/constants'
import { computeVedicChart, signName } from '../vedic/sidereal'
import { SIGNS } from '../astro/constants'

export default function HomePage() {
  const now = useMemo(() => {
    const dt = DateTime.now().setZone('Asia/Kolkata')
    return computeVedicChart({
      name: 'The sky right now', date: dt.toISODate()!, time: dt.toFormat('HH:mm'), place: 'New Delhi',
      latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata', houseSystem: 'whole-sign',
    })
  }, [])
  const moon = now.grahas[1]
  const items = [
    { sign: now.lagnaSign!, label: 'Asc', title: `Lagna ${signName(now.lagnaSign!)}`, tone: 'asc' as const },
    ...now.grahas.map((g) => ({ sign: g.sign, label: `${GRAHA_INFO[g.graha].abbr} ${Math.floor(g.degree)}°`, title: `${g.graha} in ${signName(g.sign)}` })),
  ]

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Vedic kundali &amp; Western charts, clearly explained</p>
          <h1>Understand yourself through the sky you were born under.</h1>
          <p className="lede">
            Enter your birth details to get your Janma Kundali in North or South Indian style, with divisional charts D1–D10,
            yogas, dashas and plain-language insights. Every insight shows the classical rule behind it, so you can learn Jyotish as you go.
          </p>
          <div className="hero-cta">
            <Link to="/chart" className="btn primary">Create my free chart</Link>
            <Link to="/learn" className="btn ghost">Start learning</Link>
          </div>
          <ul className="trust-list">
            <li>Lahiri ayanamsa, astronomy-grade positions</li>
            <li>Calculated privately in your browser</li>
            <li>Transparent, rule-based readings</li>
          </ul>
        </div>
        <div className="hero-wheel">
          <SquareChart style="north" lagnaSign={now.lagnaSign!} items={items} title="Live kundali" subtitle={`Right now over New Delhi · Moon in ${signName(moon.sign)}`} />
        </div>
      </section>

      <section className="features">
        <div className="card feature">
          <span className="feature-icon" aria-hidden>☉</span>
          <h2>Accurate kundali</h2>
          <p>Sidereal positions (Lahiri) from the open-source Astronomy Engine, historical time zones, D1–D10 divisional charts and Vimshottari dasha. Western tropical charts are one click away.</p>
        </div>
        <div className="card feature">
          <span className="feature-icon" aria-hidden>⚖</span>
          <h2>Readings you can trust</h2>
          <p>No vague horoscopes. Each insight comes from a Parashari rule, such as house lordship, dignity, a yoga or a dasha, and tells you exactly why it applies.</p>
        </div>
        <div className="card feature">
          <span className="feature-icon" aria-hidden>✦</span>
          <h2>Learn step by step</h2>
          <p>A 19-lesson Jyotish course, from basics to drishti, yogas, dashas, transits, career and marriage, with real-life examples. A Western track is included too.</p>
        </div>
      </section>

      <section className="sign-strip" aria-label="The twelve signs">
        {SIGNS.map((s) => (
          <div key={s.name} className={`sign-chip el-${s.element.toLowerCase()}`}>
            <span className="sign-chip-glyph" aria-hidden>{s.glyph}</span>
            <span>{s.name}</span>
            <span className="muted small">{s.dates}</span>
          </div>
        ))}
      </section>

      <section className="how card">
        <h2>How it works</h2>
        <ol className="steps">
          <li><strong>Enter your birth date, time and place.</strong> The exact time matters for your rising sign and houses.</li>
          <li><strong>We calculate the sky.</strong> Your local time is converted to UTC, planets are placed along the ecliptic, and houses are computed for your latitude.</li>
          <li><strong>Rules turn geometry into insight.</strong> Clear, published rules combine planet, sign, house, dignity and aspect meanings into a reading about you.</li>
          <li><strong>Save it (optional).</strong> Sign in with Google to keep your charts. Only you can see them.</li>
        </ol>
      </section>
    </div>
  )
}
