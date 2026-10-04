import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'
import PlaceSearch from '../components/PlaceSearch'
import type { Place } from '../lib/geocode'
import { useSettings } from '../lib/settings'
import { GRAHA_INFO } from '../vedic/constants'
import { computePanchang, type Limb, type Span } from '../vedic/panchang'
import { AYANAMSA_LABEL, DEFAULT_PLACE } from '../vedic/settings'

export default function PanchangPage() {
  const { settings, update } = useSettings()
  const saved = settings.place ?? DEFAULT_PLACE
  const [place, setPlace] = useState<Place | null>({ id: 0, name: saved.label, ...saved })
  const active = place ?? { id: 0, name: saved.label, ...saved }
  const today = DateTime.now().setZone(active.timezone).toISODate()!
  const [date, setDate] = useState(today)

  const choose = (p: Place | null) => {
    setPlace(p)
    if (p) update({ place: { label: p.label, latitude: p.latitude, longitude: p.longitude, timezone: p.timezone } })
  }

  const result = useMemo(() => {
    try {
      return { p: computePanchang(date, active.latitude, active.longitude, active.timezone, settings.ayanamsa) }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [date, active.latitude, active.longitude, active.timezone, settings.ayanamsa])

  const t = (d: Date | null) => (d ? DateTime.fromJSDate(d).setZone(active.timezone).toFormat('HH:mm') : 'None')
  const tDay = (d: Date | null) => {
    if (!d) return 'None'
    const x = DateTime.fromJSDate(d).setZone(active.timezone)
    return x.toISODate() === date ? x.toFormat('HH:mm') : x.toFormat('HH:mm, d LLL')
  }
  const now = new Date()
  const shift = (days: number) => setDate(DateTime.fromISO(date).plus({ days }).toISODate()!)

  return (
    <div className="panchang">
      <header className="page-head">
        <p className="eyebrow">Panchang</p>
        <h1>{DateTime.fromISO(date).toFormat('cccc, d LLLL yyyy')}</h1>
        <p className="lede">{active.label} · times in {active.timezone} · {AYANAMSA_LABEL[settings.ayanamsa]} ayanamsa</p>
      </header>

      <div className="card panchang-controls">
        <PlaceSearch label="Place" value={place} onChange={choose} />
        <div className="field">
          <label htmlFor="pc-date">Date</label>
          <div className="date-row">
            <button className="btn ghost small" onClick={() => shift(-1)} aria-label="Previous day">Previous</button>
            <input id="pc-date" type="date" min="1800-01-01" max="2100-12-31" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            <button className="btn ghost small" onClick={() => shift(1)} aria-label="Next day">Next</button>
            {date !== today && <button className="btn ghost small" onClick={() => setDate(today)}>Today</button>}
          </div>
        </div>
      </div>

      {'error' in result ? <p className="error">{result.error}</p> : (() => {
        const p = result.p
        const limb = (label: string, l: Limb, extra?: string) => (
          <tr><th scope="row">{label}</th><td><strong>{l.name}</strong>{extra ? ` ${extra}` : ''}</td><td className="muted">{l.ends ? `until ${tDay(l.ends)}, then ${l.next}` : 'all day'}</td></tr>
        )
        const period = (s: Span, bad = true) => (
          <tr className={bad ? 'neg' : 'pos'}><th scope="row">{s.name}</th><td>{t(s.start)} to {t(s.end)}</td></tr>
        )
        const isNow = (s: Span) => s.start <= now && now < s.end
        return (
          <>
            <div className="grid-2 section-gap">
              <section className="card">
                <h2>Five limbs</h2>
                <table className="data-table panchang-table">
                  <tbody>
                    {limb('Tithi', p.tithi, `(${p.tithi.paksha} paksha)`)}
                    <tr><th scope="row">Vara</th><td><strong>{p.vara.name}</strong></td><td className="muted">lord {p.vara.lord}</td></tr>
                    {limb('Nakshatra', p.nakshatra, `pada ${p.nakshatra.pada}`)}
                    {limb('Yoga', p.yoga, p.yoga.auspicious ? '' : '(avoided for new work)')}
                    {limb('Karana', p.karana)}
                  </tbody>
                </table>
                <p className="muted small">Values at sunrise. The Hindu day runs from sunrise to the next sunrise.</p>
              </section>
              <section className="card">
                <h2>Sun and Moon</h2>
                <table className="data-table panchang-table">
                  <tbody>
                    <tr><th scope="row">Sunrise</th><td>{t(p.sunrise)}</td></tr>
                    <tr><th scope="row">Sunset</th><td>{t(p.sunset)}</td></tr>
                    <tr><th scope="row">Moonrise</th><td>{t(p.moonrise)}</td></tr>
                    <tr><th scope="row">Moonset</th><td>{t(p.moonset)}</td></tr>
                    <tr><th scope="row">Lunar month</th><td>{p.masa.adhika ? 'Adhika ' : ''}{p.masa.name} (amanta)</td></tr>
                    <tr><th scope="row">Sun sign</th><td>{p.sunSign}</td></tr>
                    <tr><th scope="row">Moon sign</th><td>{p.moonSign}</td></tr>
                  </tbody>
                </table>
              </section>
            </div>

            <div className="grid-2 section-gap">
              <section className="card">
                <h2>Periods to avoid</h2>
                <table className="data-table panchang-table"><tbody>
                  {period(p.periods.rahuKaal)}
                  {period(p.periods.yamaganda)}
                  {period(p.periods.gulika)}
                </tbody></table>
                <p className="muted small">Each is one-eighth of the daytime, in a fixed order by weekday.</p>
              </section>
              <section className="card">
                <h2>Auspicious period</h2>
                <table className="data-table panchang-table"><tbody>{period(p.periods.abhijit, false)}</tbody></table>
                <p className="muted small">The 8th of the 15 daytime muhurtas, around local noon. Traditionally not used on Wednesdays.</p>
              </section>
            </div>

            <h2 className="section-title">Choghadiya</h2>
            <div className="grid-2">
              {(['day', 'night'] as const).map((k) => (
                <section key={k} className="card">
                  <h3>{k === 'day' ? 'Day' : 'Night'}</h3>
                  <ol className="slot-list">
                    {p.choghadiya[k].map((c) => (
                      <li key={c.start.getTime()} className={`slot q-${c.quality} ${isNow(c) ? 'now' : ''}`}>
                        <span>{c.name}</span><span className="muted">{t(c.start)} to {t(c.end)}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
            <p className="muted small">Amrit, Shubh and Labh are favourable; Char is neutral; Udveg, Kaal and Rog are unfavourable.</p>

            <h2 className="section-title">Hora</h2>
            <div className="card">
              <ol className="hora-grid">
                {p.horas.map((h) => (
                  <li key={h.start.getTime()} className={isNow(h) ? 'now' : ''}>
                    <strong>{h.lord}</strong> <span className="muted small">{GRAHA_INFO[h.lord!].sanskrit}</span>
                    <span className="muted small">{t(h.start)} to {t(h.end)}</span>
                  </li>
                ))}
              </ol>
              <p className="muted small">Twelve unequal hours by day and twelve by night. The first hora belongs to the lord of the weekday.</p>
            </div>
          </>
        )
      })()}
    </div>
  )
}
