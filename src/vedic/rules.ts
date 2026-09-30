import { ordinal } from '../astro/constants'
import { BHAVA, DUSTHANA, GRAHA_INFO, KENDRA, SIGN_LORD, type Graha } from './constants'
import { currentPeriods, type Period } from './dasha'
import { signName, type VedicChart, type VedicDignity } from './sidereal'
import { aspectedSigns, aspectsOnGraha, pos } from './techniques'

export type Effect = 'supportive' | 'challenging' | 'mixed' | 'info'

/** One evaluated rule. Rules that did not fire are kept too, so the full checklist is visible. */
export interface RuleResult {
  id: string
  group: string
  title: string
  fired: boolean
  effect: Effect
  detail: string[]
  rule: string
  chart: string // e.g. "D1", "D9", "D1 + D10"
  weight: number // contribution to the area score when fired (negative = challenging)
}

export interface DashaHighlight {
  md: Graha
  ad: Graha
  start: Date
  end: Date
  score: number
  why: string[]
}

export const GOOD_DIGNITY: VedicDignity[] = ['exalted', 'moolatrikona', 'own']

export const h = (n: number) => `${ordinal(n)} house`
export const rashiOf = (sign: number) => signName(sign)

export function dignityScore(d: VedicDignity | null): number {
  return { exalted: 3, moolatrikona: 2.5, own: 2, friend: 1, neutral: 0, enemy: -1, debilitated: -2 }[d ?? 'neutral']
}

export function dignityPhrase(d: VedicDignity | null): string {
  if (!d) return 'placed'
  return { exalted: 'exalted', moolatrikona: 'in moolatrikona', own: 'in its own sign', friend: 'in a friendly sign', neutral: 'in a neutral sign', enemy: 'in an enemy sign', debilitated: 'debilitated' }[d]
}

/** Placement quality of a house counted from the lagna. */
export function houseQuality(house: number): 'kendra' | 'trikona' | 'dusthana' | 'upachaya' | 'maraka' {
  if (KENDRA.includes(house)) return 'kendra'
  if ([5, 9].includes(house)) return 'trikona'
  if (DUSTHANA.includes(house)) return 'dusthana'
  if ([3, 11].includes(house)) return 'upachaya'
  return 'maraka' // 2nd (and 7th, already kendra)
}

/** Two grahas are linked by conjunction, sign exchange or aspect (either direction). */
export function linked(chart: VedicChart, a: Graha, b: Graha): string | null {
  if (a === b) return null
  const pa = pos(chart, a), pb = pos(chart, b)
  if (pa.sign === pb.sign) return 'conjunction'
  if (SIGN_LORD[pa.sign] === b && SIGN_LORD[pb.sign] === a) return 'sign exchange'
  if (aspectsOnGraha(chart, b).includes(a)) return `${a} aspects ${b}`
  if (aspectsOnGraha(chart, a).includes(b)) return `${b} aspects ${a}`
  return null
}

/** A graha influences a house (from lagna) by occupying or aspecting it. */
export function influencesHouse(chart: VedicChart, g: Graha, house: number, from = chart.lagnaSign!): 'occupies' | 'aspects' | null {
  const sign = (from + house - 1) % 12
  const p = pos(chart, g)
  if (p.sign === sign) return 'occupies'
  if (aspectedSigns(g, p.sign).includes(sign)) return 'aspects'
  return null
}

export function occupants(chart: VedicChart, house: number, from = chart.lagnaSign!): Graha[] {
  const sign = (from + house - 1) % 12
  return chart.grahas.filter((g) => g.sign === sign).map((g) => g.graha)
}

export function aspectors(chart: VedicChart, house: number, from = chart.lagnaSign!): Graha[] {
  const sign = (from + house - 1) % 12
  return chart.grahas.filter((g) => g.sign !== sign && aspectedSigns(g.graha, g.sign).includes(sign)).map((g) => g.graha)
}

export const isBenefic = (g: Graha) => GRAHA_INFO[g].nature === 'benefic'

export function describeLord(chart: VedicChart, house: number, lord: Graha): string {
  const p = pos(chart, lord)
  return `The ${h(house)} lord ${lord} is ${dignityPhrase(p.dignity)} in ${signName(p.sign)} in the ${h(p.house!)} (${BHAVA[p.house! - 1].short})`
}

/** Rank upcoming dasha sub-periods by how many significators they activate. */
export function dashaHighlights(periods: Period[], weights: Partial<Record<Graha, { w: number; why: string }>>, from: Date, years: number): DashaHighlight[] {
  const end = new Date(from.getTime() + years * 365.25 * 86400000)
  const out: DashaHighlight[] = []
  for (const md of periods) {
    for (const ad of md.sub ?? []) {
      if (ad.end < from || ad.start > end) continue
      const why: string[] = []
      let score = 0
      const mw = weights[md.lord], aw = weights[ad.lord]
      if (mw) { score += mw.w; why.push(`Mahadasha lord ${md.lord}: ${mw.why}`) }
      if (aw) { score += aw.w * 0.8; if (ad.lord !== md.lord) why.push(`Antardasha lord ${ad.lord}: ${aw.why}`) }
      if (score > 0) out.push({ md: md.lord, ad: ad.lord, start: ad.start, end: ad.end, score, why })
    }
  }
  return out
}

export { currentPeriods }

/** Area score: 50 ± weighted sum of fired rules, clamped. */
export function areaScore(results: RuleResult[], scale = 4): number {
  const s = results.filter((r) => r.fired).reduce((a, r) => a + r.weight, 0)
  return Math.max(10, Math.min(95, Math.round(50 + s * scale)))
}

export function rule(partial: Omit<RuleResult, 'fired' | 'effect' | 'weight' | 'detail'> & Partial<Pick<RuleResult, 'fired' | 'effect' | 'weight' | 'detail'>>): RuleResult {
  return { fired: true, effect: 'info', weight: 0, detail: [], ...partial }
}
