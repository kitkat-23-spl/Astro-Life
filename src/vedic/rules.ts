/**
 * The rule framework shared by every life-area report: rule results, condition counts,
 * evidence accumulation, divisional-chart verdicts and timing.
 */
import { ordinal } from '../astro/constants'
import { BHAVA, GRAHAS, SIGN_LORD, type Graha } from './constants'
import { vimshottari, type Period } from './dasha'
import { aspectors, describeLord, dignityPhrase, dignityScore, h, isBenefic, occupants, placementScore, pos } from './query'
import { vargaChart, type VedicChart } from './sidereal'
import { doubleTransitWindows, type TransitWindow } from './transits'
import type { VargaN } from './varga'
import { shadbalaRatio } from './strength'
import { yogaTone, type YogaResult } from './yogas'

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

export interface RuleGroup { title: string; results: RuleResult[] }

export interface DashaHighlight {
  md: Graha
  ad: Graha
  start: Date
  end: Date
  score: number
  why: string[]
}

export interface VargaVerdict { code: string; name: string; focus: string; verdict: 'strong' | 'moderate' | 'weak'; detail: string }

/**
 * How many classical conditions a report checked and how many apply. Rules that
 * only state a fact (effect 'info') are not counted as conditions.
 */
export interface ConditionCount {
  checked: number
  supportive: number
  challenging: number
  mixed: number
  notMet: number
}

/** Fields every life-area report shares. */
export interface AreaReport {
  conditions: ConditionCount
  headline: string
  groups: RuleGroup[]
  vargas: VargaVerdict[]
  dashas: DashaHighlight[]
  windows: TransitWindow[]
  significators: Graha[]
}

export function rule(partial: Omit<RuleResult, 'fired' | 'effect' | 'weight' | 'detail'> & Partial<Pick<RuleResult, 'fired' | 'effect' | 'weight' | 'detail'>>): RuleResult {
  return { fired: true, effect: 'info', weight: 0, detail: [], ...partial }
}

/** Effect implied by a weight. */
export const effectOf = (w: number, strong = 1): Effect => (w >= strong ? 'supportive' : w < 0 ? 'challenging' : 'mixed')

export function countConditions(groups: RuleGroup[]): ConditionCount {
  const conds = groups.flatMap((g) => g.results).filter((r) => r.effect !== 'info')
  const met = (e: Effect) => conds.filter((r) => r.fired && r.effect === e).length
  return {
    checked: conds.length,
    supportive: met('supportive'),
    challenging: met('challenging'),
    mixed: met('mixed'),
    notMet: conds.filter((r) => !r.fired).length,
  }
}

export type Leaning = 'supportive' | 'mixed' | 'challenging'

/** A plain-language reading of a report: its overall lean and the factors that matter most. */
export interface AreaSummary {
  leaning: Leaning
  label: string
  strengths: string[]
  cautions: string[]
  conditions: ConditionCount
}

/**
 * Mostly supportive when supportive conditions outnumber challenging ones at
 * least two to one; more challenging when challenging ones are as many or
 * more; mixed otherwise. The strongest factors are the rules with the largest
 * effect on either side.
 */
export function summarise(report: Pick<AreaReport, 'groups' | 'conditions'>): AreaSummary {
  const fired = report.groups.flatMap((g) => g.results).filter((r) => r.fired)
  const c = report.conditions
  const leaning: Leaning = c.supportive >= 2 * c.challenging && c.supportive >= 3 ? 'supportive'
    : c.challenging >= c.supportive && c.challenging >= 2 ? 'challenging' : 'mixed'
  return {
    leaning,
    label: leaning === 'supportive' ? 'Mostly supportive' : leaning === 'challenging' ? 'More challenging' : 'Mixed',
    strengths: fired.filter((r) => r.effect === 'supportive').sort((a, b) => b.weight - a.weight).slice(0, 2).map((r) => r.title),
    cautions: fired.filter((r) => r.effect === 'challenging').sort((a, b) => a.weight - b.weight).slice(0, 1).map((r) => r.title),
    conditions: c,
  }
}

/** Generic rule: dignity and placement of a house lord. */
export function lordRule(chart: VedicChart, house: number, group: string, idPrefix: string, note?: string, scale = 1): RuleResult {
  const lord = pos(chart, SIGN_LORD[(chart.lagnaSign! + house - 1) % 12]).graha
  const p = pos(chart, lord)
  const sb = shadbalaNote(chart, lord)
  const w = (dignityScore(p.dignity) + placementScore(p.house!, house) - (p.combust ? 1 : 0) + sb.adjust) * scale
  return rule({
    id: `${idPrefix}-${house}lord`, group, chart: 'D1',
    title: `${ordinal(house)} lord ${lord} is ${dignityPhrase(p.dignity)} in the ${h(p.house!)}`,
    effect: effectOf(w, scale), weight: w,
    detail: [`${describeLord(chart, house, lord)}${p.combust ? ', combust' : ''}. ${note ?? `The ${h(house)} covers ${BHAVA[house - 1].topics}.`}`, ...sb.text],
    rule: `Dignity, house and Shadbala of the ${ordinal(house)} lord`,
  })
}

/** A catalogue yoga as a report rule. Cancelled or softened yogas count half. */
export function yogaRule(yogas: YogaResult[], id: string, group: string, weight: number): RuleResult {
  const y = yogas.find((r) => r.def.id === id)
  if (!y) throw new Error(`Unknown yoga ${id}`)
  const tone = y.present ? yogaTone(y) : y.def.tone
  const w = tone === y.def.tone ? weight : weight / 2
  return rule({
    id: `y-${id}`, group, chart: 'D1', title: y.def.name, fired: y.present,
    effect: tone === 'good' ? 'supportive' : tone === 'challenge' ? 'challenging' : 'mixed',
    weight: y.present ? w * Math.min(y.matches.length, 2) : 0,
    detail: y.present ? [y.def.result, ...y.matches.map((m) => `${m.basis.join(', ')}.${m.note ? ` ${m.note}` : ''}`)] : [],
    rule: `${y.def.definition} (${y.def.source})`,
  })
}

/** Shadbala adjustment: up to one point either way for strength above or below the required minimum. */
export function shadbalaNote(chart: VedicChart, g: Graha): { adjust: number; text: string[] } {
  const r = shadbalaRatio(chart, g)
  if (r === null) return { adjust: 0, text: [] }
  return {
    adjust: Math.max(-1, Math.min(1, (r - 1) * 2)),
    text: [`Shadbala: ${Math.round(r * 100)}% of the required strength${r >= 1 ? '' : ', so it delivers less than its placement suggests'}.`],
  }
}

/** Generic rule: condition of a natural karaka (dignity, placement, combustion, Shadbala). */
export function karakaRule(chart: VedicChart, g: Graha, role: string, group: string, idPrefix: string, scale = 1): RuleResult {
  const p = pos(chart, g)
  const sb = shadbalaNote(chart, g)
  const w = (dignityScore(p.dignity) + (p.house ? placementScore(p.house) : 0) - (p.combust ? 1 : 0) + sb.adjust) * scale
  return rule({
    id: `${idPrefix}-karaka-${g}`, group, chart: 'D1',
    title: `${g}, karaka of ${role}, is ${dignityPhrase(p.dignity)}${p.house ? ` in the ${h(p.house)}` : ''}`,
    effect: effectOf(w, scale), weight: w,
    detail: [`${g} is the natural significator of ${role}.${p.combust ? ' It is combust, which weakens it.' : ''}${p.retrograde && g !== 'Rahu' && g !== 'Ketu' ? ' It is retrograde.' : ''}`, ...sb.text],
    rule: `Condition of ${g}: dignity, house, combustion and Shadbala`,
  })
}

/** Generic rule: planets in a house, benefics adding and malefics subtracting. */
export function occupantRule(chart: VedicChart, house: number, group: string, idPrefix: string, malefic = -0.6, benefic = 1): RuleResult {
  const occ = occupants(chart, house)
  const w = occ.reduce((s, g) => s + (isBenefic(g) ? benefic : malefic), 0)
  return rule({
    id: `${idPrefix}-${house}occ`, group, chart: 'D1', fired: occ.length > 0,
    title: occ.length ? `Planets in the ${h(house)}: ${occ.join(', ')}` : `The ${h(house)} is empty`,
    effect: occ.length ? effectOf(w, 0.5) : 'info', weight: w,
    detail: occ.map((g) => `${g} (${isBenefic(g) ? 'benefic' : 'malefic'}) in the ${h(house)}.`),
    rule: `Occupants of the ${h(house)}`,
  })
}

/** Generic rule: aspects on a house, benefics adding and malefics subtracting. */
export function aspectRule(chart: VedicChart, house: number, group: string, idPrefix: string, malefic = -0.5, benefic = 0.8): RuleResult {
  const asp = aspectors(chart, house)
  const w = asp.reduce((s, g) => s + (g === 'Jupiter' ? benefic * 1.5 : isBenefic(g) ? benefic : malefic), 0)
  return rule({
    id: `${idPrefix}-${house}asp`, group, chart: 'D1', fired: asp.length > 0,
    title: asp.length ? `Aspects on the ${h(house)} from ${asp.join(', ')}` : `No aspects on the ${h(house)}`,
    effect: asp.length ? effectOf(w, 0.5) : 'info', weight: w,
    detail: [asp.includes('Jupiter') ? `Jupiter's aspect protects the ${h(house)}.` : `Parashari drishti on the ${h(house)}.`],
    rule: `Parashari drishti on the ${h(house)}`,
  })
}

/** Strength of a house lord inside a divisional chart. */
export function vargaVerdict(chart: VedicChart, n: VargaN, house: number, name: string, focus: string): VargaVerdict | null {
  const vc = vargaChart(chart, n)
  if (vc.lagnaSign === null) return null
  const lord = SIGN_LORD[(vc.lagnaSign + house - 1) % 12]
  const p = vc.placements.find((x) => x.graha === lord)!
  const s = dignityScore(p.dignity) + placementScore(p.house!, house)
  return {
    code: `D${n}`, name, focus, verdict: s >= 2 ? 'strong' : s >= 0 ? 'moderate' : 'weak',
    detail: `${ordinal(house)} lord ${lord} is ${dignityPhrase(p.dignity)} in the ${h(p.house!)}.`,
  }
}

/** Collects points for each graha from independent rules (career fields, subjects, income sources). */
export class Evidence {
  private s = new Map<Graha, { score: number; reasons: string[] }>(GRAHAS.map((g) => [g, { score: 0, reasons: [] }]))
  add(g: Graha, points: number, why: string) {
    const e = this.s.get(g)!
    e.score += points
    e.reasons.push(why)
  }
  ranked(n: number) {
    return [...this.s.entries()]
      .map(([planet, e]) => ({ planet, score: Math.round(e.score * 10) / 10, reasons: e.reasons }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
  }
}

export type Weights = Partial<Record<Graha, { w: number; why: string }>>

/** Set a timing weight unless the graha already has one. */
export function weigh(weights: Weights, g: Graha, w: number, why: string) {
  if (!weights[g]) weights[g] = { w, why }
}

/** Rank dasha sub-periods by how many significators they activate. */
export function dashaHighlights(periods: Period[], weights: Weights, from: Date, years: number): DashaHighlight[] {
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
  return out.sort((a, b) => a.start.getTime() - b.start.getTime())
}

/** Dasha highlights and double-transit windows for one house. */
export function areaTiming(chart: VedicChart, house: number, weights: Weights, from: Date, dashaYears = 15, transitYears = 8) {
  const periods = vimshottari(pos(chart, 'Moon').lon, chart.utc)
  const significators = Object.keys(weights) as Graha[]
  return {
    significators,
    dashas: dashaHighlights(periods, weights, from, dashaYears),
    windows: doubleTransitWindows(chart, house, significators, periods, from, transitYears),
  }
}
