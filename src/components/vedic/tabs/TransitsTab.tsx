import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'
import { ordinal } from '../../../astro/constants'
import { useSettings } from '../../../lib/settings'
import { GRAHA_INFO, type Graha } from '../../../vedic/constants'
import type { VedicReading } from '../../../vedic/interpret'
import { vargaChart, type VedicChart } from '../../../vedic/sidereal'
import { slowTimeline, transitConjunctions, transitReadings, type TransitReading } from '../../../vedic/transitReading'
import { monthlyOutlook, sadeSati, transitEvents, transitPositions } from '../../../vedic/transits'
import Basis from '../../Basis'
import { TONE_LABEL } from '../../InsightCard'
import { ChartStyleToggle } from '../ChartPair'
import { ConditionBar } from '../ReportParts'
import SquareChart from '../SquareChart'
import { itemsFor } from '../chartItems'
import { fmtDate, rashiName } from '../format'

const PHASE_LABEL = { first: 'First phase', peak: 'Peak phase', last: 'Last phase' }
const PHASE_WHERE = { first: '12th from the Moon', peak: 'over the Moon', last: '2nd from the Moon' }
const SLOW: Graha[] = ['Saturn', 'Jupiter', 'Rahu', 'Ketu', 'Mars']

export default function TransitsTab({ chart, reading }: { chart: VedicChart; reading: VedicReading }) {
  const { settings } = useSettings()
  const [date, setDate] = useState(() => DateTime.now().toISODate()!)
  const at = useMemo(() => DateTime.fromISO(date).set({ hour: 12 }).toJSDate(), [date])
  const positions = useMemo(() => transitPositions(chart, at), [chart, at])
  const readings = useMemo(() => transitReadings(chart, at, reading.dashas), [chart, at, reading.dashas])
  const together = useMemo(() => transitConjunctions(chart, at), [chart, at])
  const timeline = useMemo(() => slowTimeline(chart, at, 10), [chart, at])
  const outlook = useMemo(() => monthlyOutlook(chart, at, 12), [chart, at])
  const events = useMemo(() => transitEvents(chart, at, 12), [chart, at])
  const ss = useMemo(() => sadeSati(chart, at), [chart, at])

  const lagnaSign = chart.lagnaSign ?? chart.grahas[1].sign
  const items = [
    ...itemsFor(chart, vargaChart(chart, 1)),
    ...positions.map((p) => ({ sign: p.sign, label: `${GRAHA_INFO[p.graha].abbr}${p.retrograde && p.graha !== 'Rahu' && p.graha !== 'Ketu' ? ' R' : ''}`, title: `Transit ${p.graha} in ${rashiName(p.sign)}`, tone: 'transit' as const })),
  ]
  const ref = chart.lagnaSign !== null ? 'lagna' : 'Moon'

  return (
    <>
      <div className="subnav row">
        <label className="small" htmlFor="tr-date">Transits on</label>
        <input id="tr-date" type="date" className="date-input" value={date} min="1900-01-01" max="2100-12-31" onChange={(e) => e.target.value && setDate(e.target.value)} />
      </div>

      <div className="varga-layout">
        <div>
          <div className="chart-pair-bar"><ChartStyleToggle /></div>
          <SquareChart style={settings.chartStyle} lagnaSign={lagnaSign} items={items} title="Natal and transit" subtitle={`Transits on ${fmtDate(at)}`} lagnaIsMoon={chart.lagnaSign === null} />
          <p className="muted small center">Natal planets in black; transiting planets in blue.</p>
        </div>
        <div className="card">
          <h2>Sade Sati</h2>
          <p className="big-verdict">{ss.active ? `Running: ${PHASE_LABEL[ss.active.phase].toLowerCase()}` : 'Not running'}</p>
          <p className="small">Saturn is {ordinal(ss.saturnFromMoon)} from the natal Moon.{ss.saturnFromMoon === 8 ? ' This is Ashtama Shani, a demanding transit.' : ss.saturnFromMoon === 4 ? ' This is Kantaka Shani, a demanding transit for home and peace of mind.' : ''}</p>
          {ss.cycle.length > 0 && (
            <ul className="upcoming">
              {ss.cycle.map((p) => (
                <li key={p.phase} className={ss.active?.phase === p.phase ? 'now-row' : ''}>
                  <strong>{PHASE_LABEL[p.phase]}</strong> <span className="muted small">({PHASE_WHERE[p.phase]})</span><br />
                  <span className="small">{fmtDate(p.start)} to {fmtDate(p.end)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="muted small">Saturn's passage over the 12th, 1st and 2nd signs from the natal Moon, about seven and a half years. It brings responsibility and pressure, and rewards patience and steady work.</p>
        </div>
      </div>

      <h2 className="section-title">What the transits mean for this chart</h2>
      <p className="muted small">Each planet is read by the house it crosses from the lagna, the classical result from the natal Moon (Phaladeepika 26), where it sits and what it rules at birth, the natal planets it meets or aspects, its strength in the sign and the running dasha. These are traditional indications, not forecasts.</p>
      <div className="insight-list">{readings.filter((r) => SLOW.includes(r.graha)).map((r) => <ReadingCard key={r.graha} r={r} />)}</div>
      <h3 className="sub-h">Faster planets</h3>
      <p className="muted small">The Sun, Venus and Mercury change sign every few weeks and the Moon every two to three days, so their effects are short.</p>
      <div className="insight-list">{readings.filter((r) => !SLOW.includes(r.graha)).map((r) => <ReadingCard key={r.graha} r={r} />)}</div>

      {together.length > 0 && (
        <>
          <h2 className="section-title">Planets together now</h2>
          <div className="insight-list">
            {together.map((c) => (
              <article key={c.sign} className="insight card">
                <header className="insight-head"><h3>{c.grahas.join(' and ')} in {rashiName(c.sign)}{c.house ? `, ${ordinal(c.house)} house` : ''}</h3></header>
                <div className="insight-body">{c.lines.map((l) => <p key={l}>{l}</p>)}</div>
              </article>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">Saturn, Jupiter and Rahu: the next 10 years</h2>
      <p className="muted small">The slow planets set the background of each period. Each row is a sign the planet will cross and the house it occupies for this chart; the reading is what that house covers and how the planet behaves there. "From Moon" is green where the classical texts count the transit as favourable.</p>
      {(['Saturn', 'Jupiter', 'Rahu'] as const).map((g) => (
        <section key={g} className="card table-wrap timeline-card">
          <h3>{g === 'Rahu' ? 'Rahu and Ketu' : g}</h3>
          <table className="data-table">
            <thead><tr><th>Dates</th><th>Sign</th><th>House</th><th>From Moon</th><th>Reading</th></tr></thead>
            <tbody>
              {timeline[g].map((row) => (
                <tr key={row.start.getTime()} className={row.start <= at && at < row.end ? 'selected' : ''}>
                  <td className="num">{fmtDate(row.start)}<br />to {fmtDate(row.end)}</td>
                  <td>{rashiName(row.sign)}{row.retrogradeReturn ? <span className="muted small"><br />retrograde return</span> : ''}</td>
                  <td className="num">{row.house ?? ''}</td>
                  <td className={row.favourableFromMoon ? 'pos' : 'neg'}>{row.fromMoon}</td>
                  <td className="small">{row.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <h2 className="section-title">Next 12 months</h2>
      <div className="outlook card">
        {outlook.map((m) => {
          const c = { checked: m.good.length + m.mixed.length + m.hard.length, supportive: m.good.length, mixed: m.mixed.length, challenging: m.hard.length, notMet: 0 }
          return (
            <div key={m.month.getTime()} className="outlook-row">
              <span className="outlook-month">{m.month.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              <ConditionBar c={c} />
              <span className="num small">{m.good.length}/{m.hard.length}</span>
              <span className="muted small outlook-why">{m.good.length ? `Supportive: ${m.good.join(', ')}` : ''}{m.good.length && m.hard.length ? '. ' : ''}{m.hard.length ? `Difficult: ${m.hard.join(', ')}` : ''}</span>
            </div>
          )
        })}
        <p className="muted small">Each planet's transit in the middle of the month, judged from the natal Moon with vedha and Ashtakavarga: green supportive, gold mixed, red difficult. The numbers are supportive / difficult planets.</p>
      </div>

      <h2 className="section-title">Retrograde periods and Mars</h2>
      <div className="card table-wrap">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Event</th><th>From {ref}</th><th>From Moon</th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.graha + e.kind + e.date.getTime()}>
                <td className="num">{fmtDate(e.date)}</td>
                <td>{e.kind === 'ingress' ? `${e.graha} enters ${rashiName(e.sign)}` : `${e.graha} turns ${e.kind} in ${rashiName(e.sign)}`}</td>
                <td>{ordinal(e.fromLagna ?? e.fromMoon)} house</td>
                <td>{ordinal(e.fromMoon)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Retrograde and direct stations of Mercury to Saturn, and Mars's sign changes, over the next 12 months.</p>
      </div>
    </>
  )
}

function ReadingCard({ r }: { r: TransitReading }) {
  return (
    <article className={`insight card tone-${r.tone}`}>
      <header className="insight-head">
        <h3>{r.graha} in {rashiName(r.sign)}{r.fromLagna ? `, ${ordinal(r.fromLagna)} house` : `, ${ordinal(r.fromMoon)} from the Moon`}</h3>
        <span className={`pill pill-${r.tone}`}>{TONE_LABEL[r.tone]}</span>
      </header>
      <p className="insight-sub">Until {fmtDate(r.until)}, then {rashiName(r.next.sign)}{r.next.house ? ` (${ordinal(r.next.house)} house)` : ''}</p>
      <div className="insight-body">{r.lines.map((l) => <p key={l}>{l}</p>)}</div>
      <Basis items={r.basis} />
    </article>
  )
}
