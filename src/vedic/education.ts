import { RASHI, SIGN_LORD, type Graha } from './constants'
import { dignityPhrase, dignityScore, h, lordOfHouse, occupants, placementScore, pos } from './query'
import {
  Evidence, areaScore, areaTiming, effectOf, karakaRule, lordRule, occupantRule, rule, vargaVerdict, weigh, yogaRule,
  type AreaReport, type RuleResult, type VargaVerdict, type Weights,
} from './rules'
import { signName, vargaChart, type VedicChart } from './sidereal'
import { evaluateYogas, type YogaResult } from './yogas'

export const PLANET_SUBJECTS: Record<Graha, string[]> = {
  Sun: ['Public administration', 'Political science', 'Medicine', 'Physics'],
  Moon: ['Psychology', 'Nursing', 'Hospitality', 'Literature', 'Marine studies'],
  Mars: ['Engineering', 'Surgery', 'Defence studies', 'Sports science', 'Chemistry'],
  Mercury: ['Mathematics', 'Commerce and accounting', 'Computer science', 'Languages', 'Journalism'],
  Jupiter: ['Law', 'Finance and economics', 'Philosophy', 'Education', 'Theology'],
  Venus: ['Fine arts', 'Music', 'Design and fashion', 'Architecture', 'Media'],
  Saturn: ['Geology and mining', 'History and archaeology', 'Civil engineering', 'Labour and social studies'],
  Rahu: ['Computer technology', 'Aviation', 'Foreign languages', 'Pharmacology'],
  Ketu: ['Mathematics', 'Programming', 'Linguistics', 'Astrology and philosophy', 'Research'],
}

export interface SubjectSuggestion { planet: Graha; score: number; subjects: string[]; reasons: string[] }

export interface EducationReport extends AreaReport {
  subjects: SubjectSuggestion[]
}

export function educationReport(chart: VedicChart, now = new Date(), yogas: YogaResult[] = evaluateYogas(chart)): EducationReport | null {
  if (chart.lagnaSign === null) return null
  const l4 = lordOfHouse(chart, 4), l5 = lordOfHouse(chart, 5), l9 = lordOfHouse(chart, 9), l2 = lordOfHouse(chart, 2)
  const ev = new Evidence()
  const group1 = 'Houses of learning'
  const g1: RuleResult[] = [
    lordRule(chart, 4, group1, 'e', 'The 4th house covers schooling and formal education.'),
    lordRule(chart, 5, group1, 'e', 'The 5th house covers intelligence, understanding and memory.'),
    lordRule(chart, 9, group1, 'e', 'The 9th house covers higher education, teachers and advanced study.', 0.8),
    lordRule(chart, 2, group1, 'e', 'The 2nd house covers early learning and speech.', 0.4),
    occupantRule(chart, 5, group1, 'e', -0.4, 1),
    occupantRule(chart, 4, group1, 'e', -0.4, 0.8),
  ]
  ev.add(l5, 2.5, '5th lord (intelligence)')
  ev.add(l4, 1.5, '4th lord (schooling)')
  ev.add(l9, 1.5, '9th lord (higher studies)')
  ev.add(l2, 0.5, '2nd lord (early learning)')
  occupants(chart, 5).forEach((g) => ev.add(g, 2, 'In the 5th house'))
  occupants(chart, 4).forEach((g) => ev.add(g, 1, 'In the 4th house'))

  const group2 = 'Karakas'
  const g2: RuleResult[] = [
    karakaRule(chart, 'Mercury', 'intellect and analysis', group2, 'e'),
    karakaRule(chart, 'Jupiter', 'knowledge and wisdom', group2, 'e'),
    karakaRule(chart, 'Moon', 'memory and concentration', group2, 'e', 0.5),
  ]
  for (const g of ['Mercury', 'Jupiter'] as Graha[]) {
    const p = pos(chart, g)
    const s = dignityScore(p.dignity) + placementScore(p.house!)
    if (s > 0) ev.add(g, s * 0.6, `${g} well placed`)
  }

  const group3 = 'Chaturvimsamsa (D24)'
  const g3: RuleResult[] = []
  const d24 = vargaChart(chart, 24)
  if (d24.lagnaSign !== null) {
    const vp = (g: Graha) => d24.placements.find((p) => p.graha === g)!
    const ll = SIGN_LORD[d24.lagnaSign], llp = vp(ll)
    const wl = dignityScore(llp.dignity) * 0.6 + placementScore(llp.house!) * 0.6
    g3.push(rule({
      id: 'e-d24-lagna', group: group3, chart: 'D24', title: `D24 lagna ${RASHI[signName(d24.lagnaSign)]}, lord ${ll} in the ${h(llp.house!)}`,
      effect: effectOf(wl, 0.5), weight: wl, detail: ['The D24 lagna lord shows the overall capacity for formal learning.'], rule: 'D24 lagna lord placement and dignity',
    }))
    ev.add(ll, 1.5, 'D24 lagna lord')
    for (const house of [4, 5, 9]) {
      const lord = SIGN_LORD[(d24.lagnaSign + house - 1) % 12], lp = vp(lord)
      const w = (dignityScore(lp.dignity) + placementScore(lp.house!, house)) * 0.5
      g3.push(rule({
        id: `e-d24-${house}`, group: group3, chart: 'D24', title: `D24 ${h(house)} lord ${lord} is ${dignityPhrase(lp.dignity)} in the ${h(lp.house!)}`,
        effect: effectOf(w, 0.5), weight: w, detail: [`The ${h(house)} of D24 refines the ${house === 4 ? 'schooling' : house === 5 ? 'intelligence' : 'higher education'} picture.`],
        rule: `D24 ${h(house)} lord placement and dignity`,
      }))
    }
    for (const g of ['Mercury', 'Jupiter'] as Graha[]) {
      const d = vp(g).dignity
      g3.push(rule({
        id: `e-d24-${g}`, group: group3, chart: 'D24', title: `${g} in D24 is ${dignityPhrase(d)}`,
        effect: effectOf(dignityScore(d)), weight: dignityScore(d) * 0.4, detail: [`${g} re-examined in the chart of learning.`], rule: `Dignity of ${g} in D24`,
      }))
    }
  }

  const group4 = 'Yogas for learning'
  const g4: RuleResult[] = [
    yogaRule(yogas, 'saraswati', group4, 2.5),
    yogaRule(yogas, 'budhaditya', group4, 1),
    yogaRule(yogas, 'kalanidhi', group4, 1.5),
    yogaRule(yogas, 'gajakesari', group4, 1),
    yogaRule(yogas, 'mp-bhadra', group4, 1.5),
    yogaRule(yogas, 'mp-hamsa', group4, 1.5),
  ]

  const vargas: VargaVerdict[] = [
    vargaVerdict(chart, 1, 4, 'Rashi', 'schooling'),
    vargaVerdict(chart, 1, 5, 'Rashi', 'intelligence'),
    vargaVerdict(chart, 24, 4, 'Chaturvimsamsa', 'formal education'),
    vargaVerdict(chart, 24, 9, 'Chaturvimsamsa', 'higher education'),
    vargaVerdict(chart, 9, 5, 'Navamsa', 'inner strength of the 5th'),
  ].filter((v): v is VargaVerdict => v !== null)

  const subjects: SubjectSuggestion[] = ev.ranked(3).map((s) => ({ ...s, subjects: PLANET_SUBJECTS[s.planet] }))

  const weights: Weights = {}
  weigh(weights, l9, 2.5, '9th lord (higher education)')
  weigh(weights, l4, 2, '4th lord (education)')
  weigh(weights, l5, 2, '5th lord (intelligence)')
  weigh(weights, 'Jupiter', 1.5, 'Jupiter, karaka of knowledge')
  weigh(weights, 'Mercury', 1.5, 'Mercury, karaka of intellect')
  const timing = areaTiming(chart, 9, weights, now, 12, 6)

  const groups = [
    { title: 'Houses of learning', results: g1 },
    { title: 'Karakas', results: g2 },
    { title: 'Chaturvimsamsa (D24)', results: g3 },
    { title: 'Yogas for learning', results: g4 },
  ]
  const top = subjects[0]
  const headline = `The 5th lord ${l5} is in the ${h(pos(chart, l5).house!)} and the 4th lord ${l4} in the ${h(pos(chart, l4).house!)}.${top ? ` The strongest subject indications come from ${top.planet}: ${top.subjects.slice(0, 2).join(', ').toLowerCase()}.` : ''}`
  return { score: areaScore(groups.flatMap((g) => g.results), { median: 8.9, spread: 6.9 }), headline, groups, vargas, ...timing, subjects }
}
