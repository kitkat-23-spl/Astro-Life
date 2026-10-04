/**
 * Krishnamurti Paddhati (KP) cusps with sign, star and sub lords, and the
 * Bhava Chalit chart (Sripati houses, with the cusps as house middles).
 */
import { norm360 } from '../astro/constants'
import { computeHouses, houseOf } from '../astro/houses'
import { DASHA_ORDER, DASHA_YEARS, NAKSHATRA_SPAN, SIGN_LORD, type Graha } from './constants'
import { siderealAngles, type VedicChart } from './sidereal'

export interface KpLords { sign: Graha; star: Graha; sub: Graha; subSub: Graha }

/** Sign, star (nakshatra) and sub lords. Each nakshatra is divided in proportion to Vimshottari years. */
export function kpLords(lon: number): KpLords {
  const L = norm360(lon)
  const nk = Math.floor(L / NAKSHATRA_SPAN)
  const star = DASHA_ORDER[nk % 9]
  const split = (start: number, span: number, from: Graha, at: number): { lord: Graha; start: number; span: number } => {
    let cursor = start
    const i0 = DASHA_ORDER.indexOf(from)
    for (let i = 0; i < 9; i++) {
      const lord = DASHA_ORDER[(i0 + i) % 9]
      const w = (span * DASHA_YEARS[lord]) / 120
      if (at < cursor + w || i === 8) return { lord, start: cursor, span: w }
      cursor += w
    }
    throw new Error('unreachable')
  }
  const sub = split(nk * NAKSHATRA_SPAN, NAKSHATRA_SPAN, star, L)
  const subSub = split(sub.start, sub.span, sub.lord, L)
  return { sign: SIGN_LORD[Math.floor(L / 30)], star, sub: sub.lord, subSub: subSub.lord }
}

export interface KpChart {
  /** Placidus cusps (sidereal), index 0 = 1st house. */
  cusps: number[]
  cuspLords: KpLords[]
  /** KP house of each planet, from the Placidus cusps. */
  planetHouse: Record<string, number>
  planetLords: Record<string, KpLords>
  /** Placidus is undefined at polar latitudes; equal houses are used instead. */
  fellBack: boolean
}

export function kpChart(chart: VedicChart): KpChart | null {
  if (chart.lagna === null) return null
  const a = siderealAngles(chart.utc, chart.birth.latitude, chart.birth.longitude, chart.ayanamsa)
  const h = computeHouses('placidus', a.ramc, a.obliquity, chart.birth.latitude)
  const cusps = h.fellBack
    ? Array.from({ length: 12 }, (_, i) => norm360(chart.lagna! + i * 30))
    : h.cusps.map((c) => norm360(c - chart.ayanamsa))
  return {
    cusps,
    cuspLords: cusps.map(kpLords),
    planetHouse: Object.fromEntries(chart.grahas.map((g) => [g.graha, houseOf(g.lon, cusps)])),
    planetLords: Object.fromEntries(chart.grahas.map((g) => [g.graha, kpLords(g.lon)])),
    fellBack: h.fellBack,
  }
}

export interface Chalit {
  /** House middles (bhava madhya), index 0 = 1st. */
  madhya: number[]
  /** House beginnings (bhava sandhi), index 0 = start of the 1st. */
  sandhi: number[]
  planetHouse: Record<string, number>
}

/**
 * Bhava Chalit (Sripati): the ascendant and MC are the middles of the 1st and
 * 10th houses, the quadrants are trisected, and each house begins halfway
 * between two middles.
 */
export function bhavaChalit(chart: VedicChart): Chalit | null {
  if (chart.lagna === null || chart.mc === null) return null
  const asc = chart.lagna, mc = chart.mc, ic = norm360(mc + 180), dsc = norm360(asc + 180)
  const tri = (a: number, b: number) => { const s = norm360(b - a) / 3; return [norm360(a + s), norm360(a + 2 * s)] }
  const [h2, h3] = tri(asc, ic), [h5, h6] = tri(ic, dsc), [h8, h9] = tri(dsc, mc), [h11, h12] = tri(mc, asc)
  const madhya = [asc, h2, h3, ic, h5, h6, dsc, h8, h9, mc, h11, h12]
  const sandhi = madhya.map((m, i) => norm360(madhya[(i + 11) % 12] + norm360(m - madhya[(i + 11) % 12]) / 2))
  return { madhya, sandhi, planetHouse: Object.fromEntries(chart.grahas.map((g) => [g.graha, houseOf(g.lon, sandhi)])) }
}
