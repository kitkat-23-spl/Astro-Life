import * as Astronomy from 'astronomy-engine'
import { DateTime } from 'luxon'
import {
  ASPECTS, DIGNITIES, PLANETS, angDist, norm360, signOf,
  type AspectDef, type PlanetName, type PointName, type SignName,
} from './constants'
import { ascendant, computeHouses, houseOf, midheaven, type HouseSystem } from './houses'

export interface BirthData {
  name: string
  date: string // yyyy-mm-dd
  time: string | null // HH:mm, null = unknown
  place: string
  latitude: number
  longitude: number
  timezone: string // IANA zone, e.g. "Asia/Kolkata"
  houseSystem: HouseSystem
}

export type Dignity = 'domicile' | 'exaltation' | 'detriment' | 'fall' | null

export interface Placement {
  name: PointName
  longitude: number
  sign: SignName
  house: number | null
  retrograde: boolean
  speed: number // degrees per day
  dignity: Dignity
}

export interface Aspect {
  a: PointName
  b: PointName
  type: AspectDef
  orb: number
  applying: boolean
}

export interface Chart {
  birth: BirthData
  utc: string
  timeKnown: boolean
  placements: Placement[]
  ascendant: number | null
  midheaven: number | null
  cusps: number[] | null
  houseSystemUsed: HouseSystem | null
  houseFallback: boolean
  aspects: Aspect[]
  isDayChart: boolean | null
}

const BODY: Partial<Record<PlanetName, Astronomy.Body>> = {
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
  Uranus: Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
  Pluto: Astronomy.Body.Pluto,
}

/** Tropical geocentric ecliptic longitude (true ecliptic and equinox of date). */
export function longitudeOf(planet: PlanetName, date: Date): number {
  if (planet === 'Sun') return Astronomy.SunPosition(date).elon
  if (planet === 'Moon') return Astronomy.EclipticGeoMoon(date).lon
  if (planet === 'North Node') return meanNode(date)
  const body = BODY[planet]!
  return Astronomy.Ecliptic(Astronomy.GeoVector(body, date, true)).elon
}

/** Mean lunar ascending node (Meeus, Astronomical Algorithms, ch. 47). */
function meanNode(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5
  const T = (jd - 2451545.0) / 36525
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000)
}

function dignityOf(planet: PlanetName, sign: SignName): Dignity {
  const d = DIGNITIES[planet]
  if (!d) return null
  if (d.domicile.includes(sign)) return 'domicile'
  if (d.exaltation === sign) return 'exaltation'
  if (d.detriment.includes(sign)) return 'detriment'
  if (d.fall === sign) return 'fall'
  return null
}

/** Convert local civil birth time in an IANA zone to a UTC instant (handles historical DST). */
export function toUtc(date: string, time: string | null, zone: string): Date {
  const dt = DateTime.fromISO(`${date}T${time ?? '12:00'}`, { zone })
  if (!dt.isValid) throw new Error(`Invalid date, time or timezone: ${dt.invalidExplanation ?? ''}`)
  return dt.toJSDate()
}

function findAspects(points: { name: PointName; longitude: number; speed: number }[]): Aspect[] {
  const out: Aspect[] = []
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p = points[i]
      const q = points[j]
      // Node–angle and Asc–MC contacts are geometric, not interpretive, so skip them.
      const pair = new Set([p.name, q.name])
      if (pair.has('Ascendant') && pair.has('Midheaven')) continue
      if (pair.has('North Node') && (pair.has('Ascendant') || pair.has('Midheaven'))) continue
      const d = angDist(p.longitude, q.longitude)
      for (const type of ASPECTS) {
        let orb = type.orb
        // Luminaries get a wider orb; angles and the node a narrower one.
        if (pair.has('Sun') || pair.has('Moon')) orb += 2
        if (pair.has('North Node') || pair.has('Ascendant') || pair.has('Midheaven')) orb -= 2
        const diff = Math.abs(d - type.angle)
        if (diff <= orb) {
          // Applying if the separation is moving toward exact over the next small step.
          const dt = 0.01
          const d2 = angDist(p.longitude + p.speed * dt, q.longitude + q.speed * dt)
          out.push({ a: p.name, b: q.name, type, orb: diff, applying: Math.abs(d2 - type.angle) < diff })
          break
        }
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb)
}

export function computeChart(birth: BirthData): Chart {
  const timeKnown = birth.time !== null && birth.time !== ''
  const utcDate = toUtc(birth.date, timeKnown ? birth.time : null, birth.timezone)
  const astroTime = Astronomy.MakeTime(utcDate)

  const oneHour = 3600000
  const placements: Placement[] = PLANETS.map((name) => {
    const lon = norm360(longitudeOf(name, utcDate))
    const before = longitudeOf(name, new Date(utcDate.getTime() - 6 * oneHour))
    const after = longitudeOf(name, new Date(utcDate.getTime() + 6 * oneHour))
    let delta = norm360(after - before)
    if (delta > 180) delta -= 360
    const speed = delta * 2 // degrees per day (12h window)
    const sign = signOf(lon).name
    return {
      name,
      longitude: lon,
      sign,
      house: null,
      retrograde: name !== 'North Node' && speed < 0,
      speed,
      dignity: name === 'North Node' ? null : dignityOf(name, sign),
    }
  })

  let asc: number | null = null
  let mc: number | null = null
  let cusps: number[] | null = null
  let houseSystemUsed: HouseSystem | null = null
  let houseFallback = false
  let isDayChart: boolean | null = null

  if (timeKnown) {
    const gast = Astronomy.SiderealTime(astroTime) // hours
    const ramc = norm360(gast * 15 + birth.longitude)
    const obliquity = Astronomy.e_tilt(astroTime).tobl
    const houses = computeHouses(birth.houseSystem, ramc, obliquity, birth.latitude)
    cusps = houses.cusps
    houseFallback = houses.fellBack
    houseSystemUsed = houses.fellBack ? 'whole-sign' : birth.houseSystem
    // The angles are the same in every house system (Whole Sign cusps start at 0° of the rising sign).
    asc = ascendant(ramc, obliquity, birth.latitude)
    mc = midheaven(ramc, obliquity)
    for (const p of placements) p.house = houseOf(p.longitude, cusps)
    const sun = placements[0]
    // Day chart when the Sun is above the horizon (houses 7–12 from the true Ascendant).
    const sunFromAsc = norm360(sun.longitude - asc)
    isDayChart = sunFromAsc >= 180
  }

  const aspectPoints: { name: PointName; longitude: number; speed: number }[] = placements.map((p) => ({ name: p.name, longitude: p.longitude, speed: p.speed }))
  if (asc !== null && mc !== null) {
    aspectPoints.push({ name: 'Ascendant', longitude: asc, speed: 360 }, { name: 'Midheaven', longitude: mc, speed: 360 })
  }
  const aspects = findAspects(aspectPoints)

  return {
    birth,
    utc: utcDate.toISOString(),
    timeKnown,
    placements,
    ascendant: asc,
    midheaven: mc,
    cusps,
    houseSystemUsed,
    houseFallback,
    aspects,
    isDayChart,
  }
}

export function placementOf(chart: Chart, name: PointName): Placement | undefined {
  if (name === 'Ascendant' && chart.ascendant !== null) {
    return { name, longitude: chart.ascendant, sign: signOf(chart.ascendant).name, house: 1, retrograde: false, speed: 0, dignity: null }
  }
  if (name === 'Midheaven' && chart.midheaven !== null) {
    return { name, longitude: chart.midheaven, sign: signOf(chart.midheaven).name, house: chart.cusps ? houseOf(chart.midheaven, chart.cusps) : 10, retrograde: false, speed: 0, dignity: null }
  }
  return chart.placements.find((p) => p.name === name)
}
