/**
 * Special lagnas and sensitive points: Bhava, Hora and Ghati lagnas, Sree
 * lagna, Pranapada, Indu lagna, Gulika, Yogi and Avayogi, Pushkara navamsa
 * and bhaga, the 64th navamsa and the 22nd drekkana.
 */
import { norm360 } from '../astro/constants'
import { NAKSHATRA_SPAN, NAKSHATRAS, SIGN_LORD, type Graha } from './constants'
import { hinduDay } from './panchang'
import { lordOfHouse, pos } from './query'
import { ayanamsaAt, nakshatraOf, siderealAngles, siderealLongitude, type VedicChart } from './sidereal'
import { vargaSign } from './varga'

export interface SpecialPoint { name: string; lon: number; note: string; lord?: Graha }

/** Planetary kalas used for Indu Lagna (Jataka Parijata). */
const KALA: Partial<Record<Graha, number>> = { Sun: 30, Moon: 16, Mars: 6, Mercury: 8, Jupiter: 10, Venus: 12, Saturn: 1 }

/**
 * Indu Lagna (wealth ascendant): add the kalas of the 9th lords from lagna and
 * Moon, take the remainder by 12 and count that many signs from the Moon.
 */
export function induLagna(chart: VedicChart): number {
  const moon = pos(chart, 'Moon').sign
  const total = KALA[lordOfHouse(chart, 9)]! + KALA[lordOfHouse(chart, 9, moon)]!
  const r = total % 12 || 12
  return (moon + r - 1) % 12
}

/** Saturn's portion of the day (1-based eighth) by weekday from Sunday, and of the night. */
const GULIKA_DAY = [7, 6, 5, 4, 3, 2, 1]
const GULIKA_NIGHT = [3, 2, 1, 7, 6, 5, 4]

/** Special lagnas and points. Most need a birth time; returns an empty list without one. */
export function specialPoints(chart: VedicChart): SpecialPoint[] {
  if (chart.lagna === null) return []
  const { latitude, longitude } = chart.birth
  const day = hinduDay(chart.utc, latitude, longitude)
  const out: SpecialPoint[] = []
  if (day) {
    const sunAtRise = siderealLongitude('Sun', day.sunrise, chart.settings)
    const minutes = (chart.utc.getTime() - day.sunrise.getTime()) / 60000
    out.push(
      { name: 'Bhava lagna', lon: norm360(sunAtRise + minutes * 0.25), note: 'Moves one sign every two hours from the Sun at sunrise. Used for overall prosperity.' },
      { name: 'Hora lagna', lon: norm360(sunAtRise + minutes * 0.5), note: 'Moves one sign every hour from the Sun at sunrise. Used for wealth.' },
      { name: 'Ghati lagna', lon: norm360(sunAtRise + minutes * 1.25), note: 'Moves one sign every 24 minutes from the Sun at sunrise. Used for power and status.' },
    )
    const sun = pos(chart, 'Sun')
    const offset = sun.sign % 3 === 0 ? 0 : sun.sign % 3 === 1 ? 240 : 120
    out.push({ name: 'Pranapada', lon: norm360(sun.lon + offset + minutes * 5), note: 'Moves one sign every six minutes, starting from the Sun (plus 240° for a fixed sign, 120° for a dual sign). Used to check the birth time and for health.' })
    const segs = day.isDay ? GULIKA_DAY : GULIKA_NIGHT
    const [a, b] = day.isDay ? [day.sunrise, day.sunset] : [day.sunset, day.nextSunrise]
    const t = new Date(a.getTime() + ((segs[day.weekday] - 1) * (b.getTime() - a.getTime())) / 8)
    const gulika = siderealAngles(t, latitude, longitude, ayanamsaAt(t, chart.settings.ayanamsa)).asc
    out.push({ name: 'Gulika', lon: gulika, note: 'The ascendant at the start of Saturn\'s eighth of the day or night. Treated as a strong malefic.' })
  }
  const nk = nakshatraOf(pos(chart, 'Moon').lon)
  out.push({ name: 'Sree lagna', lon: norm360(chart.lagna + nk.fraction * 360), note: 'The lagna advanced by the part of the Moon\'s nakshatra already passed, scaled to the zodiac. Used for fortune.' })
  const indu = induLagna(chart)
  out.push({ name: 'Indu lagna', lon: indu * 30 + 15, note: 'Sign from the kalas of the 9th lords from the lagna and Moon. Used for wealth; only the sign matters.' })
  return out.map((p) => ({ ...p, lord: SIGN_LORD[Math.floor(p.lon / 30)] }))
}

export interface YogiPoints { yogi: number; yogiPlanet: Graha; duplicateYogi: Graha; avayogi: number; avayogiPlanet: Graha }

/** Yogi point = Sun + Moon + 93°20′; its nakshatra lord is the Yogi planet. Avayogi is 186°40′ further. */
export function yogiPoints(chart: VedicChart): YogiPoints {
  const yogi = norm360(pos(chart, 'Sun').lon + pos(chart, 'Moon').lon + 93 + 1 / 3)
  const avayogi = norm360(yogi + 186 + 2 / 3)
  const lordAt = (l: number) => NAKSHATRAS[Math.floor(l / NAKSHATRA_SPAN)].lord
  return { yogi, yogiPlanet: lordAt(yogi), duplicateYogi: SIGN_LORD[Math.floor(yogi / 30)], avayogi, avayogiPlanet: lordAt(avayogi) }
}

/** Pushkara navamsas (by element: fire 7 and 9, earth 3 and 5, air 6 and 8, water 1 and 3) and Pushkara bhagas. */
const PUSHKARA_NAV: number[][] = [[7, 9], [3, 5], [6, 8], [1, 3]]
const PUSHKARA_BHAGA = [21, 14, 18, 8, 19, 9, 24, 11, 23, 14, 19, 9]

export function pushkara(lon: number): { navamsa: boolean; bhaga: boolean } {
  const sign = Math.floor(norm360(lon) / 30), deg = norm360(lon) % 30
  const nav = Math.floor(deg / (10 / 3)) + 1
  return { navamsa: PUSHKARA_NAV[sign % 4].includes(nav), bhaga: Math.abs(deg - PUSHKARA_BHAGA[sign]) <= 1 }
}

export interface SensitivePoint { name: string; from: string; lon: number; lord: Graha }

/** The 64th navamsa (from the Moon and lagna) and the 22nd drekkana (from the lagna), traditional danger points. */
export function sensitivePoints(chart: VedicChart): SensitivePoint[] {
  const out: SensitivePoint[] = []
  const nav64 = (l: number) => norm360(l + 63 * (10 / 3))
  const moon = pos(chart, 'Moon').lon
  out.push({ name: '64th navamsa', from: 'Moon', lon: nav64(moon), lord: SIGN_LORD[vargaSign(9, nav64(moon))] })
  if (chart.lagna !== null) {
    out.push({ name: '64th navamsa', from: 'Lagna', lon: nav64(chart.lagna), lord: SIGN_LORD[vargaSign(9, nav64(chart.lagna))] })
    const d22 = norm360(chart.lagna + 210)
    out.push({ name: '22nd drekkana (Khara)', from: 'Lagna', lon: d22, lord: SIGN_LORD[vargaSign(3, d22)] })
  }
  return out
}
