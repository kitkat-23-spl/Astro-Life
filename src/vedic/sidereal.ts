import * as Astronomy from 'astronomy-engine'
import { norm360, angDist, SIGNS, type SignName } from '../astro/constants'
import { longitudeOf, toUtc, type BirthData } from '../astro/ephemeris'
import { ascendant } from '../astro/houses'
import {
  COMBUSTION, EXALTATION, FRIENDS, GRAHAS, MOOLATRIKONA, NAKSHATRAS, NAKSHATRA_SPAN, SIGN_LORD, houseFrom,
  type Graha,
} from './constants'
import { vargaSign, type VargaN } from './varga'

/**
 * Lahiri (Chitrapaksha) ayanamsa, as defined by the Indian Calendar Reform
 * Committee: 23°15′00.658″ at 21 March 1956 (JD 2435553.5, the value used by
 * the Swiss Ephemeris), advanced by IAU 2006 general precession in longitude.
 * Adding nutation gives the "true" ayanamsa used with true-of-date positions.
 */
export function lahiriAyanamsa(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5
  const p = (T: number) => 5028.796195 * T + 1.1054348 * T * T // arcseconds
  const T = (jd - 2451545.0) / 36525
  const T0 = (2435553.5 - 2451545.0) / 36525
  const mean = 23.245524743 + (p(T) - p(T0)) / 3600
  const nutation = Astronomy.e_tilt(Astronomy.MakeTime(date)).dpsi / 3600
  return mean + nutation
}

export type VedicDignity = 'exalted' | 'moolatrikona' | 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated'

export interface GrahaPos {
  graha: Graha
  lon: number // sidereal longitude
  sign: number // 0..11
  degree: number // within sign
  house: number | null // whole-sign house from lagna
  retrograde: boolean
  combust: boolean
  dignity: VedicDignity | null
  nakshatra: number // 0..26
  pada: number // 1..4
}

export interface VedicChart {
  birth: BirthData
  timeKnown: boolean
  ayanamsa: number
  lagna: number | null // sidereal longitude
  lagnaSign: number | null
  grahas: GrahaPos[]
  utc: Date
}

export function dignityOf(graha: Graha, sign: number, degree: number): VedicDignity | null {
  if (graha === 'Rahu' || graha === 'Ketu') return null
  const ex = EXALTATION[graha]!
  if (ex.sign === sign) return 'exalted'
  if ((ex.sign + 6) % 12 === sign) return 'debilitated'
  const mt = MOOLATRIKONA[graha]!
  if (mt.sign === sign && degree >= mt.from && degree < mt.to) return 'moolatrikona'
  const lord = SIGN_LORD[sign]
  if (lord === graha) return 'own'
  const rel = FRIENDS[graha]!
  if (rel.friends.includes(lord)) return 'friend'
  if (rel.enemies.includes(lord)) return 'enemy'
  return 'neutral'
}

export function nakshatraOf(lon: number) {
  const L = norm360(lon)
  const index = Math.floor(L / NAKSHATRA_SPAN)
  const within = L - index * NAKSHATRA_SPAN
  return { index, pada: Math.floor(within / (NAKSHATRA_SPAN / 4)) + 1, fraction: within / NAKSHATRA_SPAN, info: NAKSHATRAS[index] }
}

export function signName(i: number): SignName {
  return SIGNS[((i % 12) + 12) % 12].name
}

export function computeVedicChart(birth: BirthData): VedicChart {
  const timeKnown = birth.time !== null && birth.time !== ''
  const utc = toUtc(birth.date, timeKnown ? birth.time : null, birth.timezone)
  const ayanamsa = lahiriAyanamsa(utc)
  const t = Astronomy.MakeTime(utc)

  let lagna: number | null = null
  if (timeKnown) {
    const ramc = norm360(Astronomy.SiderealTime(t) * 15 + birth.longitude)
    lagna = norm360(ascendant(ramc, Astronomy.e_tilt(t).tobl, birth.latitude) - ayanamsa)
  }
  const lagnaSign = lagna === null ? null : Math.floor(lagna / 30)

  const hours = 3600000
  const tropical = (name: 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'North Node', d: Date) => longitudeOf(name, d)

  const raw = GRAHAS.map((g) => {
    const key = g === 'Rahu' || g === 'Ketu' ? 'North Node' : g
    const trop = tropical(key, utc)
    const before = tropical(key, new Date(utc.getTime() - 6 * hours))
    const after = tropical(key, new Date(utc.getTime() + 6 * hours))
    let delta = norm360(after - before)
    if (delta > 180) delta -= 360
    let lon = norm360(trop - ayanamsa)
    if (g === 'Ketu') lon = norm360(lon + 180)
    return { graha: g, lon, retrograde: g === 'Rahu' || g === 'Ketu' ? true : delta < 0 }
  })

  const sunLon = raw[0].lon
  const grahas: GrahaPos[] = raw.map(({ graha, lon, retrograde }) => {
    const sign = Math.floor(lon / 30)
    const degree = lon - sign * 30
    const comb = COMBUSTION[graha]
    const nk = nakshatraOf(lon)
    return {
      graha, lon, sign, degree, retrograde,
      house: lagnaSign === null ? null : houseFrom(lagnaSign, sign),
      combust: comb ? angDist(lon, sunLon) <= (retrograde ? comb.retro : comb.direct) : false,
      dignity: dignityOf(graha, sign, degree),
      nakshatra: nk.index,
      pada: nk.pada,
    }
  })

  return { birth, timeKnown, ayanamsa, lagna, lagnaSign, grahas, utc }
}

export interface VargaPlacement { graha: Graha | 'Lagna'; sign: number; house: number | null; dignity: VedicDignity | null }

export interface VargaChart {
  n: VargaN
  lagnaSign: number | null
  placements: VargaPlacement[]
}

/** Build a divisional chart. Houses are counted whole-sign from the divisional lagna. */
export function vargaChart(chart: VedicChart, n: VargaN): VargaChart {
  const lagnaSign = chart.lagna === null ? null : vargaSign(n, chart.lagna)
  const placements: VargaPlacement[] = chart.grahas.map((g) => {
    const sign = vargaSign(n, g.lon)
    // Within a varga, dignity is judged by sign only (the degree inside the division is not meaningful).
    return { graha: g.graha, sign, house: lagnaSign === null ? null : houseFrom(lagnaSign, sign), dignity: n === 1 ? g.dignity : dignityOf(g.graha, sign, 15) }
  })
  return { n, lagnaSign, placements }
}

/** Planet's sign lord (dispositor). */
export function lordOf(sign: number): Graha {
  return SIGN_LORD[sign]
}
