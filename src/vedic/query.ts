/**
 * Chart queries shared by every Vedic module: lordship, occupation,
 * Parashari drishti, links between planets and dignity scoring.
 */
import { ordinal } from '../astro/constants'
import { DUSTHANA, GRAHA_INFO, KENDRA, SIGN_LORD, houseFrom, type Graha } from './constants'
import type { GrahaPos, VedicChart, VedicDignity } from './sidereal'

export const h = (n: number) => `${ordinal(n)} house`

export function pos(chart: VedicChart, g: Graha): GrahaPos {
  return chart.grahas.find((x) => x.graha === g)!
}

/** Lord of a house counted from a sign (the lagna by default). */
export function lordOfHouse(chart: VedicChart, house: number, fromSign = chart.lagnaSign!): Graha {
  return SIGN_LORD[(fromSign + house - 1) % 12]
}

/** Houses (from the lagna) ruled by a graha. */
export function housesRuledBy(chart: VedicChart, g: Graha): number[] {
  if (chart.lagnaSign === null) return []
  const out: number[] = []
  for (let house = 1; house <= 12; house++) if (lordOfHouse(chart, house) === g) out.push(house)
  return out
}

/** Sign index of a house counted from a sign (the lagna by default). */
export const houseSign = (chart: VedicChart, house: number, fromSign = chart.lagnaSign!) => (fromSign + house - 1) % 12

export function occupants(chart: VedicChart, house: number, fromSign = chart.lagnaSign!): Graha[] {
  const sign = houseSign(chart, house, fromSign)
  return chart.grahas.filter((g) => g.sign === sign).map((g) => g.graha)
}

/* Drishti: every graha aspects the 7th; Mars also the 4th and 8th, Jupiter the
   5th and 9th, Saturn the 3rd and 10th. Rahu and Ketu take 5/7/9 as in most
   modern Parashari practice. */
export const DRISHTI: Record<Graha, number[]> = {
  Sun: [7], Moon: [7], Mercury: [7], Venus: [7],
  Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10],
  Rahu: [5, 7, 9], Ketu: [5, 7, 9],
}

export function aspectedSigns(graha: Graha, sign: number): number[] {
  return DRISHTI[graha].map((n) => (sign + n - 1) % 12)
}

/** Grahas aspecting a sign (not counting those in it). */
export function aspectsOnSign(chart: VedicChart, sign: number): Graha[] {
  return chart.grahas.filter((g) => g.sign !== sign && aspectedSigns(g.graha, g.sign).includes(sign)).map((g) => g.graha)
}

export function aspectors(chart: VedicChart, house: number, fromSign = chart.lagnaSign!): Graha[] {
  return aspectsOnSign(chart, houseSign(chart, house, fromSign))
}

export function aspectsOnGraha(chart: VedicChart, target: Graha): Graha[] {
  return aspectsOnSign(chart, pos(chart, target).sign)
}

export function conjunctWith(chart: VedicChart, target: Graha): Graha[] {
  const t = pos(chart, target)
  return chart.grahas.filter((g) => g.sign === t.sign && g.graha !== target).map((g) => g.graha)
}

/** Conjunction or sign exchange (sambandha in the strict sense). */
export function associated(chart: VedicChart, a: Graha, b: Graha): 'conjunction' | 'exchange' | null {
  if (a === b) return null
  const pa = pos(chart, a), pb = pos(chart, b)
  if (pa.sign === pb.sign) return 'conjunction'
  if (SIGN_LORD[pa.sign] === b && SIGN_LORD[pb.sign] === a) return 'exchange'
  return null
}

/** Conjunction, exchange or aspect in either direction. */
export function linked(chart: VedicChart, a: Graha, b: Graha): string | null {
  const assoc = associated(chart, a, b)
  if (assoc) return assoc === 'exchange' ? 'sign exchange' : 'conjunction'
  if (a === b) return null
  if (aspectsOnGraha(chart, b).includes(a)) return `${a} aspects ${b}`
  if (aspectsOnGraha(chart, a).includes(b)) return `${b} aspects ${a}`
  return null
}

/** Classical sambandha: conjunction, sign exchange or mutual aspect. */
export function sambandha(chart: VedicChart, a: Graha, b: Graha): 'conjunction' | 'sign exchange' | 'mutual aspect' | null {
  const assoc = associated(chart, a, b)
  if (assoc) return assoc === 'exchange' ? 'sign exchange' : 'conjunction'
  if (a === b) return null
  return aspectsOnGraha(chart, b).includes(a) && aspectsOnGraha(chart, a).includes(b) ? 'mutual aspect' : null
}

/** Jaimini rashi drishti: movable signs aspect fixed signs (except the adjacent one), fixed aspect movable (except the adjacent one), dual signs aspect each other. */
export function rashiDrishti(from: number, to: number): boolean {
  if (from === to) return false
  const q = from % 3, qt = to % 3
  if (q === 0) return qt === 1 && to !== (from + 1) % 12
  if (q === 1) return qt === 0 && to !== (from + 11) % 12
  return qt === 2
}

/** House of a graha counted from any sign (1..12). */
export const houseOf = (chart: VedicChart, g: Graha, fromSign: number) => houseFrom(fromSign, pos(chart, g).sign)

/** A graha occupies or aspects a house. */
export function influencesHouse(chart: VedicChart, g: Graha, house: number, fromSign = chart.lagnaSign!): 'occupies' | 'aspects' | null {
  const sign = houseSign(chart, house, fromSign)
  const p = pos(chart, g)
  if (p.sign === sign) return 'occupies'
  if (aspectedSigns(g, p.sign).includes(sign)) return 'aspects'
  return null
}

export const isBenefic = (g: Graha) => GRAHA_INFO[g].nature === 'benefic'

export const GOOD_DIGNITY: VedicDignity[] = ['exalted', 'moolatrikona', 'own']
export const isStrongSign = (d: VedicDignity | null) => d !== null && GOOD_DIGNITY.includes(d)

export function dignityScore(d: VedicDignity | null): number {
  return { exalted: 3, moolatrikona: 2.5, own: 2, friend: 1, neutral: 0, enemy: -1, debilitated: -2 }[d ?? 'neutral']
}

export function dignityPhrase(d: VedicDignity | null): string {
  if (!d) return 'placed'
  return { exalted: 'exalted', moolatrikona: 'in moolatrikona', own: 'in its own sign', friend: 'in a friendly sign', neutral: 'in a neutral sign', enemy: 'in an enemy sign', debilitated: 'debilitated' }[d]
}

export type HouseGroup = 'kendra' | 'trikona' | 'dusthana' | 'upachaya' | 'maraka'

export function houseGroup(house: number): HouseGroup {
  if (KENDRA.includes(house)) return 'kendra'
  if ([5, 9].includes(house)) return 'trikona'
  if (DUSTHANA.includes(house)) return 'dusthana'
  if ([3, 11].includes(house)) return 'upachaya'
  return 'maraka'
}

/** Placement score of a lord: good houses add, dusthanas subtract (unless the lord rules a dusthana itself). */
export function placementScore(house: number, ruledHouse?: number): number {
  const g = houseGroup(house)
  if (g === 'kendra' || g === 'trikona') return 1.5
  if (house === 11) return 1.5
  if (g === 'dusthana') return ruledHouse !== undefined && DUSTHANA.includes(ruledHouse) ? 1 : -1.5
  return 0.3
}

export const describeLord = (chart: VedicChart, house: number, lord: Graha) => {
  const p = pos(chart, lord)
  return `${ordinal(house)} lord ${lord} is ${dignityPhrase(p.dignity)} in the ${h(p.house!)}`
}
