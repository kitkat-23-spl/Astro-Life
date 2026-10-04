import { DateTime } from 'luxon'
import { useMemo, useState } from 'react'
import { ordinal } from '../../../astro/constants'
import { useSettings } from '../../../lib/settings'
import { GRAHA_INFO } from '../../../vedic/constants'
import { vargaChart, type VedicChart } from '../../../vedic/sidereal'
import { gochara, monthlyOutlook, sadeSati, transitEvents, transitPositions } from '../../../vedic/transits'
import { ChartStyleToggle } from '../ChartPair'
import SquareChart from '../SquareChart'
import { itemsFor } from '../chartItems'
import { fmtDate, rashiName } from '../format'

const PHASE_LABEL = { first: 'First phase', peak: 'Peak phase', last: 'Last phase' }
const PHASE_WHERE = { first: '12th from the Moon', peak: 'over the Moon', last: '2nd from the Moon' }

export default function TransitsTab({ chart }: { chart: VedicChart }) {
  const { settings } = useSettings()
  const [date, setDate] = useState(() => DateTime.now().toISODate()!)
  const at = useMemo(() => DateTime.fromISO(date).set({ hour: 12 }).toJSDate(), [date])
  const positions = useMemo(() => transitPositions(chart, at), [chart, at])
  const rows = useMemo(() => gochara(chart, at, positions), [chart, at, positions])
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

      <h2 className="section-title">Transit scorecard</h2>
      <div className="card table-wrap">
        <table className="data-table">
          <caption className="sr-only">Transits judged from the Moon with vedha and Ashtakavarga</caption>
          <thead><tr><th>Planet</th><th>Sign</th><th>From Moon</th>{chart.lagnaSign !== null && <th>From lagna</th>}<th>Gochara</th><th>Vedha</th>{chart.lagnaSign !== null && <th>Bindus</th>}{chart.lagnaSign !== null && <th>SAV</th>}<th>Result</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.graha}>
                <td>{r.graha}{r.retrograde && r.graha !== 'Rahu' && r.graha !== 'Ketu' ? ' (R)' : ''}</td>
                <td>{rashiName(r.sign)}</td>
                <td className="num">{r.fromMoon}</td>
                {chart.lagnaSign !== null && <td className="num">{r.fromLagna}</td>}
                <td>{r.favourable ? 'Favourable house' : 'Unfavourable house'}</td>
                <td>{r.vedhaBy.length ? `Blocked by ${r.vedhaBy.join(', ')}` : ''}</td>
                {chart.lagnaSign !== null && <td className="num">{r.bindus ?? ''}</td>}
                {chart.lagnaSign !== null && <td className="num">{r.sav ?? ''}</td>}
                <td className={r.verdict === 'favourable' ? 'pos' : r.verdict === 'unfavourable' ? 'neg' : ''}>{r.verdict[0].toUpperCase() + r.verdict.slice(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Gochara: favourable houses from the natal Moon (Phaladeepika 26). A favourable transit is blocked (vedha) when another planet occupies its paired house, except between the Sun and Saturn or the Moon and Mercury. Bindus: the planet's own Ashtakavarga points in that sign (5 or more helps, 2 or fewer hurts).</p>
      </div>

      <h2 className="section-title">Next 12 months</h2>
      <div className="outlook card">
        {outlook.map((m) => (
          <div key={m.month.getTime()} className="outlook-row">
            <span className="outlook-month">{m.month.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            <span className="bar-track"><span className={`bar-fill ${m.score >= 55 ? 'good' : m.score <= 45 ? 'bad' : ''}`} style={{ width: `${m.score}%` }} /></span>
            <span className="num small">{m.score}</span>
            <span className="muted small outlook-why">{m.good.length ? `Supportive: ${m.good.join(', ')}` : ''}{m.good.length && m.hard.length ? '. ' : ''}{m.hard.length ? `Difficult: ${m.hard.join(', ')}` : ''}</span>
          </div>
        ))}
        <p className="muted small">Score for the middle of each month from the scorecard above, weighting Jupiter, Saturn and the nodes most. 50 is neutral.</p>
      </div>

      <h2 className="section-title">Upcoming changes</h2>
      <div className="card table-wrap">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Event</th><th>From {ref}</th><th>From Moon</th></tr></thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.graha + e.kind + e.date.getTime()}>
                <td className="num">{fmtDate(e.date)}</td>
                <td>{e.kind === 'ingress' ? `${e.graha} enters ${rashiName(e.sign)}${e.graha === 'Rahu' ? ` (Ketu enters ${rashiName((e.sign + 6) % 12)})` : ''}` : `${e.graha} turns ${e.kind} in ${rashiName(e.sign)}`}</td>
                <td>{ordinal(e.fromLagna ?? e.fromMoon)} house</td>
                <td>{ordinal(e.fromMoon)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Sign changes of Mars, Jupiter, Saturn and the nodes, and the retrograde and direct stations of Mercury to Saturn.</p>
      </div>
    </>
  )
}
