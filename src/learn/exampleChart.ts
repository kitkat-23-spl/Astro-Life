/**
 * Teaching charts: a lagna and a house for each planet, turned into a full
 * VedicChart so the same engine that reads real charts can check the example.
 */
import { angDist } from '../astro/constants'
import { COMBUSTION, GRAHAS, houseFrom, type Graha } from '../vedic/constants'
import { DEFAULT_SETTINGS } from '../vedic/settings'
import { dignityOf, nakshatraOf, type GrahaPos, type VedicChart } from '../vedic/sidereal'

export const SIGN_INDEX: Record<string, number> = {
  Mesha: 0, Vrishabha: 1, Mithuna: 2, Karka: 3, Simha: 4, Kanya: 5, Tula: 6, Vrishchika: 7, Dhanu: 8, Makara: 9, Kumbha: 10, Meena: 11,
}
export type SignKey = keyof typeof SIGN_INDEX

/** A house number, or [house, degree within the sign]. */
type Place = number | [number, number]

export interface ExampleSpec {
  lagna: SignKey
  /** Houses from the lagna for the seven planets and Rahu; Ketu is placed opposite Rahu. */
  at: Record<Exclude<Graha, 'Ketu'>, Place>
  /** Degree of the lagna within its sign (default 15). */
  lagnaDeg?: number
}

/** Default degrees, spread so planets sharing a sign with the Sun are not combust by accident. */
const DEFAULT_DEG: Record<Graha, number> = { Sun: 5, Moon: 12, Mars: 18, Mercury: 26, Jupiter: 22, Venus: 20, Saturn: 14, Rahu: 9, Ketu: 9 }
const SPEED: Record<Graha, number> = { Sun: 1, Moon: 13, Mars: 0.6, Mercury: 1.2, Jupiter: 0.1, Venus: 1.1, Saturn: 0.05, Rahu: -0.05, Ketu: -0.05 }

const cache = new WeakMap<ExampleSpec, VedicChart>()

export function exampleChart(spec: ExampleSpec): VedicChart {
  const hit = cache.get(spec)
  if (hit) return hit
  const L = SIGN_INDEX[spec.lagna]
  const lonOf = (g: Graha): number => {
    if (g === 'Ketu') return (lonOf('Rahu') + 180) % 360
    const p = spec.at[g]
    const [house, deg] = Array.isArray(p) ? p : [p, DEFAULT_DEG[g]]
    return ((L + house - 1) % 12) * 30 + deg
  }
  const sunLon = lonOf('Sun')
  const grahas: GrahaPos[] = GRAHAS.map((g) => {
    const lon = lonOf(g)
    const sign = Math.floor(lon / 30), degree = lon - sign * 30
    const comb = COMBUSTION[g]
    const nk = nakshatraOf(lon)
    return {
      graha: g, lon, sign, degree, retrograde: g === 'Rahu' || g === 'Ketu', speed: SPEED[g],
      house: houseFrom(L, sign), combust: comb ? angDist(lon, sunLon) <= comb.direct : false,
      dignity: dignityOf(g, sign, degree), nakshatra: nk.index, pada: nk.pada,
    }
  })
  const chart: VedicChart = {
    birth: { name: 'Example', date: '2000-01-01', time: '12:00', place: 'Example', latitude: 28.6, longitude: 77.2, timezone: 'Asia/Kolkata', houseSystem: 'whole-sign' },
    settings: DEFAULT_SETTINGS, timeKnown: true, ayanamsa: 23.85,
    lagna: L * 30 + (spec.lagnaDeg ?? 15), lagnaSign: L, mc: ((L + 9) % 12) * 30 + 15,
    grahas, utc: new Date('2000-01-01T06:30:00Z'),
  }
  cache.set(spec, chart)
  return chart
}

const ABBR: Record<string, Exclude<Graha, 'Ketu'>> = { Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu' }

/**
 * Short form for lesson charts: `ex('Mesha', 'Su10 Mo4 Ma1@15 Me10 Ju7 Ve11 Sa3 Ra6')`
 * puts each planet in a house from the lagna, optionally at a degree.
 */
export function ex(lagna: SignKey, s: string): ExampleSpec {
  const at: Partial<ExampleSpec['at']> = {}
  for (const tok of s.trim().split(/\s+/)) {
    const m = /^([A-Z][a-z])(\d{1,2})(?:@(\d+(?:\.\d+)?))?$/.exec(tok)
    const g = m && ABBR[m[1]]
    if (!m || !g) throw new Error(`Bad chart token "${tok}"`)
    const house = Number(m[2])
    if (house < 1 || house > 12) throw new Error(`Bad house in "${tok}"`)
    at[g] = m[3] ? [house, Number(m[3])] : house
  }
  if (Object.keys(at).length !== 8) throw new Error(`Chart "${s}" must place all seven planets and Rahu`)
  return { lagna, at: at as ExampleSpec['at'] }
}
