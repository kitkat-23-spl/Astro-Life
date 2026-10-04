import * as Astronomy from 'astronomy-engine'
import { angDist, norm360, SIGNS, type SignName } from '../astro/constants'
import { longitudeOf, toUtc, type BirthData } from '../astro/ephemeris'
import { ascendant, midheaven } from '../astro/houses'
import {
  COMBUSTION, EXALTATION, FRIENDS, GRAHAS, MOOLATRIKONA, NAKSHATRAS, NAKSHATRA_SPAN, SIGN_LORD, houseFrom,
  type Graha,
} from './constants'
import { DEFAULT_SETTINGS, type Ayanamsa, type CalcSettings, type NodeMode } from './settings'
import { vargaSign, type VargaN } from './varga'

/* ------------------------------------------------------------------ */
/* Ayanamsa                                                             */
/* ------------------------------------------------------------------ */

/** IAU 2006 general precession in longitude, arcseconds since J2000. */
const precession = (T: number) => 5028.796195 * T + 1.1054348 * T * T
const julianDay = (d: Date) => d.getTime() / 86400000 + 2440587.5

/** Reference epochs and values (same definitions as the Swiss Ephemeris). */
const AYANAMSA_EPOCH: Record<Exclude<Ayanamsa, 'true-chitra'>, { jd: number; value: number }> = {
  lahiri: { jd: 2435553.5, value: 23.245524743 }, // ICRC: 23°15′00.658″ on 21 Mar 1956
  raman: { jd: 2415020.0, value: 21.014444 },
  kp: { jd: 2415020.0, value: 22.363889 },
}

// Spica (α Virginis), J2000 position. Used for the True Chitra ayanamsa.
let spicaDefined = false
function spicaLongitude(date: Date): number {
  if (!spicaDefined) {
    Astronomy.DefineStar(Astronomy.Body.Star1, 13 + 25 / 60 + 11.579 / 3600, -(11 + 9 / 60 + 40.75 / 3600), 250)
    spicaDefined = true
  }
  return Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Star1, date, true)).elon
}

/** True (nutation-corrected) ayanamsa, to subtract from true-of-date tropical longitudes. */
export function ayanamsaAt(date: Date, kind: Ayanamsa = 'lahiri'): number {
  if (kind === 'true-chitra') return norm360(spicaLongitude(date) - 180)
  const e = AYANAMSA_EPOCH[kind]
  const T = (julianDay(date) - 2451545.0) / 36525
  const T0 = (e.jd - 2451545.0) / 36525
  const mean = e.value + (precession(T) - precession(T0)) / 3600
  return mean + Astronomy.e_tilt(Astronomy.MakeTime(date)).dpsi / 3600
}

/** Sidereal longitude of any graha at any date (used for transits and annual charts). */
export function siderealLongitude(g: Graha, date: Date, s: Pick<CalcSettings, 'ayanamsa' | 'node'> = DEFAULT_SETTINGS) {
  const trop = g === 'Rahu' || g === 'Ketu' ? nodeLongitude(date, s.node) + (g === 'Ketu' ? 180 : 0) : longitudeOf(g, date)
  return norm360(trop - ayanamsaAt(date, s.ayanamsa))
}

/* ------------------------------------------------------------------ */
/* Nodes                                                                */
/* ------------------------------------------------------------------ */

/** Tropical longitude of Rahu. "True" is the osculating node of the Moon's orbit. */
export function nodeLongitude(date: Date, mode: NodeMode): number {
  if (mode === 'mean') return longitudeOf('North Node', date)
  const state = Astronomy.RotateState(Astronomy.Rotation_EQJ_ECT(date), Astronomy.GeoMoonState(date))
  // Orbit normal h = r × v; the ascending node lies along (h.x, h.y) rotated by −90°.
  const hx = state.y * state.vz - state.z * state.vy
  const hy = state.z * state.vx - state.x * state.vz
  return norm360((Math.atan2(hx, -hy) * 180) / Math.PI)
}

/* ------------------------------------------------------------------ */
/* Chart                                                                */
/* ------------------------------------------------------------------ */

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
  speed: number // degrees per day; negative when retrograde
}

export interface VedicChart {
  birth: BirthData
  settings: CalcSettings
  timeKnown: boolean
  ayanamsa: number
  lagna: number | null // sidereal longitude
  lagnaSign: number | null
  /** Sidereal midheaven (10th cusp), when the time is known. */
  mc: number | null
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

/** Sidereal ascendant and midheaven for a moment and place. */
export function siderealAngles(date: Date, latitude: number, longitude: number, ayanamsa: number) {
  const t = Astronomy.MakeTime(date)
  const ramc = norm360(Astronomy.SiderealTime(t) * 15 + longitude)
  const obl = Astronomy.e_tilt(t).tobl
  return { asc: norm360(ascendant(ramc, obl, latitude) - ayanamsa), mc: norm360(midheaven(ramc, obl) - ayanamsa), ramc, obliquity: obl }
}

export function computeVedicChart(birth: BirthData, settings: CalcSettings = DEFAULT_SETTINGS): VedicChart {
  const timeKnown = birth.time !== null && birth.time !== ''
  return chartAt(birth, toUtc(birth.date, timeKnown ? birth.time : null, birth.timezone), timeKnown, settings)
}

/** Chart for an exact moment at the birth place (used for annual charts). */
export function chartAt(birth: BirthData, utc: Date, timeKnown: boolean, settings: CalcSettings = DEFAULT_SETTINGS): VedicChart {
  const ayanamsa = ayanamsaAt(utc, settings.ayanamsa)

  let lagna: number | null = null
  let mc: number | null = null
  if (timeKnown) {
    const a = siderealAngles(utc, birth.latitude, birth.longitude, ayanamsa)
    lagna = a.asc
    mc = a.mc
  }
  const lagnaSign = lagna === null ? null : Math.floor(lagna / 30)

  const tropical = (g: Graha, d: Date) => (g === 'Rahu' || g === 'Ketu' ? nodeLongitude(d, settings.node) : longitudeOf(g, d))
  const sixHours = 6 * 3600000
  const raw = GRAHAS.map((g) => {
    let lon = norm360(tropical(g, utc) - ayanamsa)
    if (g === 'Ketu') lon = norm360(lon + 180)
    let delta = norm360(tropical(g, new Date(utc.getTime() + sixHours)) - tropical(g, new Date(utc.getTime() - sixHours)))
    if (delta > 180) delta -= 360
    if (g === 'Rahu' || g === 'Ketu') return { graha: g, lon, retrograde: true, speed: delta * 2 }
    return { graha: g, lon, retrograde: delta < 0, speed: delta * 2 }
  })

  const sunLon = raw[0].lon
  const grahas: GrahaPos[] = raw.map(({ graha, lon, retrograde, speed }) => {
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
      speed,
    }
  })

  return { birth, settings, timeKnown, ayanamsa, lagna, lagnaSign, mc, grahas, utc }
}

/* ------------------------------------------------------------------ */
/* Divisional charts                                                    */
/* ------------------------------------------------------------------ */

export interface VargaPlacement { graha: Graha; sign: number; house: number | null; dignity: VedicDignity | null }

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
    // Within a varga, dignity is judged by sign only.
    return { graha: g.graha, sign, house: lagnaSign === null ? null : houseFrom(lagnaSign, sign), dignity: n === 1 ? g.dignity : dignityOf(g.graha, sign, 15) }
  })
  return { n, lagnaSign, placements }
}
