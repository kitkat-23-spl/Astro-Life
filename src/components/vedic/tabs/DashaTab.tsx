import { useMemo, useState } from 'react'
import { ordinal } from '../../../astro/constants'
import { BHAVA, GRAHA_INFO, type Graha } from '../../../vedic/constants'
import {
  LEVEL_NAMES, ashtottari, charaDasha, periodChain, subPeriods, upcomingAntardashas, yogini,
  type DashaPeriod, type DashaSystem, type Period,
} from '../../../vedic/dasha'
import { activatedHouses, type VedicReading } from '../../../vedic/interpret'
import { houseOf, lordOfHouse, pos } from '../../../vedic/query'
import type { VedicChart } from '../../../vedic/sidereal'
import Segmented from '../../Segmented'
import Cards from '../Cards'
import { fmtDate, fmtRange } from '../format'

const SYSTEMS: [DashaSystem, string][] = [['vimshottari', 'Vimshottari'], ['yogini', 'Yogini'], ['ashtottari', 'Ashtottari'], ['chara', 'Chara (Jaimini)']]
const ABOUT: Record<DashaSystem, string> = {
  vimshottari: '120-year cycle from the lord of the Moon\'s nakshatra. The main timing system in Parashari astrology.',
  yogini: '36-year cycle of eight yoginis, each ruled by a planet. Often used to confirm Vimshottari.',
  ashtottari: '108-year cycle of eight lords (no Ketu). BPHS applies it when Rahu is in a kendra or trikona from the lagna lord, but not in the lagna.',
  chara: 'Sign-based mahadashas from the lagna (K. N. Rao\'s method). Each lasts from 1 to 12 years depending on where the sign\'s lord sits. Mahadashas only.',
}

export default function DashaTab({ chart, reading }: { chart: VedicChart; reading: VedicReading }) {
  const [system, setSystem] = useState<DashaSystem>('vimshottari')
  const now = useMemo(() => new Date(), [])
  const moon = pos(chart, 'Moon')
  const other = useMemo((): DashaPeriod[] => {
    if (system === 'yogini') return yogini(moon.lon, chart.utc)
    if (system === 'ashtottari') return ashtottari(moon.lon, chart.utc)
    if (system === 'chara' && chart.lagnaSign !== null) {
      return charaDasha(chart.lagnaSign, (g) => pos(chart, g).sign, (g) => pos(chart, g).dignity, (s) => chart.grahas.filter((x) => x.sign === s).length, chart.utc)
    }
    return []
  }, [system, chart, moon.lon])
  const ashtottariApplies = chart.lagnaSign !== null && (() => {
    const r = pos(chart, 'Rahu')
    return r.house !== 1 && [1, 4, 5, 7, 9, 10].includes(houseOf(chart, 'Rahu', pos(chart, lordOfHouse(chart, 1)).sign))
  })()

  return (
    <>
      <div className="subnav">
        <Segmented label="Dasha system" value={system} onChange={setSystem} options={chart.lagnaSign !== null ? SYSTEMS : SYSTEMS.slice(0, 3)} />
      </div>
      <p className="muted small">{ABOUT[system]}{system === 'ashtottari' && chart.lagnaSign !== null ? ` For this chart the condition is ${ashtottariApplies ? 'met' : 'not met'}.` : ''}</p>
      {system === 'vimshottari'
        ? <Vimshottari chart={chart} reading={reading} now={now} />
        : <Generic chart={chart} periods={other} now={now} />}
    </>
  )
}

function ActiveHouses({ chart, lords }: { chart: VedicChart; lords: Graha[] }) {
  if (chart.lagnaSign === null) return null
  return (
    <section className="card">
      <h2>Houses in focus</h2>
      {lords.map((g) => (
        <div key={g} className="active-houses">
          <p className="small"><strong>{g}</strong> activates:</p>
          <ul className="small">
            {activatedHouses(chart, g).map((a) => <li key={a.house}>{ordinal(a.house)} house ({BHAVA[a.house - 1].short}): {a.via.join(', ')}</li>)}
          </ul>
        </div>
      ))}
      <p className="muted small">A dasha lord gives the results of the house it occupies and the houses it rules, and those ruled by its sign, star and navamsa lords.</p>
    </section>
  )
}

function Vimshottari({ chart, reading, now }: { chart: VedicChart; reading: VedicReading; now: Date }) {
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
          <h3 className="sub-h">Next antardashas</h3>
          <ul className="upcoming">
            {upcoming.map((p) => <li key={p.start.getTime()}><strong>{p.path.join(' / ')}</strong> <span className="muted small">from {fmtDate(p.start)}</span></li>)}
          </ul>
        </section>
        <ActiveHouses chart={chart} lords={chain.slice(0, 2).map((p) => p.lord)} />
      </div>
      <div className="section-gap"><Cards items={reading.dashaInsights} /></div>
      <h2 className="section-title">Timeline</h2>
      <p className="muted small">Open a mahadasha for its antardashas, and an antardasha for its pratyantardashas.</p>
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

function Generic({ chart, periods, now }: { chart: VedicChart; periods: DashaPeriod[]; now: Date }) {
  const md = periods.find((p) => p.start <= now && now < p.end)
  const ad = md?.sub?.find((p) => p.start <= now && now < p.end)
  const label = (p: DashaPeriod) => (p.lord && p.name !== p.lord ? `${p.name} (${p.lord})` : p.name)
  return (
    <>
      <div className="grid-2 section-gap">
        <section className="card">
          <h2>Running periods</h2>
          <ol className="chain">
            {md && <li><span className="muted small">Mahadasha</span><strong>{label(md)}</strong><span className="muted small">{fmtDate(md.start)} to {fmtDate(md.end)}</span></li>}
            {ad && <li><span className="muted small">Antardasha</span><strong>{label(ad)}</strong><span className="muted small">{fmtDate(ad.start)} to {fmtDate(ad.end)}</span></li>}
          </ol>
        </section>
        {md?.lord && <ActiveHouses chart={chart} lords={[...new Set([md.lord, ad?.lord].filter((g): g is Graha => !!g))]} />}
      </div>
      <h2 className="section-title">Timeline</h2>
      <ol className="dasha-list">
        {periods.map((p) => {
          const active = p.start <= now && now < p.end
          return (
            <li key={p.name + p.start.getTime()} className={`card dasha ${active ? 'active' : ''} ${p.end < now ? 'past' : ''}`}>
              <details open={active}>
                <summary>
                  <span className="dasha-lord">{label(p)}</span>
                  <span className="small muted">{fmtRange(p.start, p.end)}</span>
                  <span className="small muted">{((p.end.getTime() - p.start.getTime()) / (365.2425 * 86400000)).toFixed(1)} years</span>
                </summary>
                {p.sub ? (
                  <ul className="antar">
                    {p.sub.map((s) => <li key={s.name + s.start.getTime()} className={s.start <= now && now < s.end ? 'now' : ''}><span className="sub-row"><span>{label(s)}</span><span className="muted">{fmtDate(s.start)} to {fmtDate(s.end)}</span></span></li>)}
                  </ul>
                ) : <p className="small muted">{p.lord ? `Sign lord ${p.lord}.` : ''}</p>}
              </details>
            </li>
          )
        })}
      </ol>
    </>
  )
}
