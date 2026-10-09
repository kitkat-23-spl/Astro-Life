import { useMemo } from 'react'
import { ordinal } from '../../../astro/constants'
import { GRAHA_INFO, NAKSHATRAS, NAKSHATRA_SPAN } from '../../../vedic/constants'
import { ARUDHA_NAMES, arudha } from '../../../vedic/jaimini'
import type { VedicChart } from '../../../vedic/sidereal'
import { pushkara, sensitivePoints, specialPoints, yogiPoints } from '../../../vedic/special'
import SudarshanChakra from '../SudarshanChakra'
import { fmtLon, rashiName } from '../format'
import Term from '../../Term'

const houseFromLagna = (chart: VedicChart, sign: number) => (chart.lagnaSign === null ? null : ((sign - chart.lagnaSign + 12) % 12) + 1)

export default function SpecialTab({ chart }: { chart: VedicChart }) {
  const sp = useMemo(() => specialPoints(chart), [chart])
  const yogi = useMemo(() => yogiPoints(chart), [chart])
  const sens = useMemo(() => sensitivePoints(chart), [chart])
  const push = chart.grahas.map((g) => ({ g: g.graha, ...pushkara(g.lon) })).filter((x) => x.navamsa || x.bhaga)
  const nakOf = (lon: number) => NAKSHATRAS[Math.floor(lon / NAKSHATRA_SPAN)].name

  return (
    <>
      <div className="varga-layout">
        <SudarshanChakra chart={chart} />
        <div className="card">
          <h2><Term k="sudarshan">Sudarshan Chakra</Term></h2>
          <p className="small">The same planets read from three references: the lagna (body and circumstances), the Moon (mind) and the Sun (soul and authority). A house that is strong in all three rings gives reliable results; the Sudarshan dasha moves one house per year in all three rings at once.</p>
          <h3 className="sub-h"><Term k="yogi">Yogi and Avayogi</Term></h3>
          <p className="small">Yogi point {fmtLon(yogi.yogi)} ({nakOf(yogi.yogi)}). <strong>Yogi planet: {yogi.yogiPlanet}</strong>, which brings fortune in its periods; duplicate Yogi (sign lord): {yogi.duplicateYogi}.</p>
          <p className="small">Avayogi point {fmtLon(yogi.avayogi)} ({nakOf(yogi.avayogi)}). <strong>Avayogi planet: {yogi.avayogiPlanet}</strong>, which brings obstacles in its periods.</p>
          <h3 className="sub-h"><Term k="pushkara">Pushkara</Term></h3>
          <p className="small">{push.length ? push.map((p) => `${p.g} is in a Pushkara ${p.navamsa && p.bhaga ? 'navamsa and bhaga' : p.navamsa ? 'navamsa' : 'bhaga'}`).join('. ') + '. These degrees strengthen and protect the planet.' : 'No planet is in a Pushkara navamsa or Pushkara bhaga.'}</p>
        </div>
      </div>

      {sp.length > 0 && (
        <>
          <h2 className="section-title"><Term k="indu">Special lagnas</Term></h2>
          <div className="card table-wrap">
            <table className="data-table">
              <thead><tr><th>Lagna</th><th>Position</th><th>House</th><th>Sign lord</th><th>Used for</th></tr></thead>
              <tbody>
                {sp.map((p) => (
                  <tr key={p.name}>
                    <td>{p.name}</td>
                    <td className="num">{p.name === 'Indu lagna' ? rashiName(Math.floor(p.lon / 30)) : fmtLon(p.lon)}</td>
                    <td className="num">{houseFromLagna(chart, Math.floor(p.lon / 30))}</td>
                    <td>{p.lord}</td>
                    <td className="small muted">{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {chart.lagnaSign !== null && (
        <>
          <h2 className="section-title"><Term k="arudha">Arudhas (padas)</Term></h2>
          <div className="card table-wrap">
            <table className="data-table">
              <thead><tr><th>House</th><th>Arudha</th><th>Sign</th><th>House from lagna</th><th>Occupants</th></tr></thead>
              <tbody>
                {ARUDHA_NAMES.map((name, i) => {
                  const s = arudha(chart, i + 1)
                  return (
                    <tr key={name}>
                      <td>{ordinal(i + 1)}</td>
                      <td>{name}</td>
                      <td>{rashiName(s)}</td>
                      <td className="num">{houseFromLagna(chart, s)}</td>
                      <td>{chart.grahas.filter((g) => g.sign === s).map((g) => GRAHA_INFO[g.graha].abbr).join(' ')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="muted small">An arudha is the image of a house: count from the house to its lord, then the same number again. It cannot fall in the house itself or the 7th from it (the 10th from there is used instead). The Arudha Lagna shows how the world sees the person; the Upapada shows the marriage.</p>
          </div>
        </>
      )}

      <h2 className="section-title"><Term k="special">Sensitive points</Term></h2>
      <div className="card table-wrap">
        <table className="data-table">
          <thead><tr><th>Point</th><th>Counted from</th><th>Position</th><th>Lord</th></tr></thead>
          <tbody>{sens.map((p) => <tr key={p.name + p.from}><td>{p.name}</td><td>{p.from}</td><td className="num">{fmtLon(p.lon)}</td><td>{p.lord}</td></tr>)}</tbody>
        </table>
        <p className="muted small">The 64th navamsa and the 22nd drekkana are traditional danger points. Transits of malefics over them, and the dashas of their lords, are watched for health.</p>
      </div>
    </>
  )
}
