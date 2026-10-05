import { RASHI, SIGN_LORD, type Graha } from './constants'
import { dignityPhrase, dignityScore, h, isBenefic, lordOfHouse, occupants, pos, sambandha } from './query'
import {
  countConditions, areaTiming, aspectRule, effectOf, karakaRule, lordRule, occupantRule, rule, vargaVerdict, weigh, yogaRule,
  type AreaReport, type RuleResult, type VargaVerdict, type Weights,
} from './rules'
import { signName, vargaChart, type VedicChart } from './sidereal'
import { induLagna } from './special'
import { evaluateYogas, type YogaResult } from './yogas'

/** What a house contributes when the 2nd or 11th lord sits in it. */
const GAIN_FROM: string[] = [
  'own effort, personality and initiative',
  'family, savings, food or speech',
  'communication, media, sales, short travel or siblings',
  'property, vehicles, land or the mother',
  'investments, speculation, creative work, advisory or children',
  'service, employment, lending or competition',
  'business, partnerships, clients or the spouse',
  'inheritance, insurance, research or other people\'s money',
  'fortune, father, teachers, law, religion or long-distance work',
  'career, status and authority',
  'networks, large organisations, elder siblings and regular income',
  'foreign countries, overseas work, hospitals or charitable institutions',
]

export interface GainSource { from: string; text: string }

export interface WealthReport extends AreaReport {
  sources: GainSource[]
  induSign: number
  hora: { sun: Graha[]; moon: Graha[] }
}

export function wealthReport(chart: VedicChart, now = new Date(), yogas: YogaResult[] = evaluateYogas(chart)): WealthReport | null {
  if (chart.lagnaSign === null) return null
  const l2 = lordOfHouse(chart, 2), l11 = lordOfHouse(chart, 11), l9 = lordOfHouse(chart, 9)
  const p2 = pos(chart, l2), p11 = pos(chart, l11)
  const group1 = '2nd and 11th houses'

  const g1: RuleResult[] = [
    lordRule(chart, 2, group1, 'w', 'The 2nd house holds accumulated wealth, savings and family resources.'),
    lordRule(chart, 11, group1, 'w', 'The 11th house shows income, gains and the fulfilment of desires.'),
    occupantRule(chart, 2, group1, 'w', -0.6, 1),
    // Malefics do well in the 11th (an upachaya), so both kinds add.
    occupantRule(chart, 11, group1, 'w', 0.6, 1),
    aspectRule(chart, 2, group1, 'w'),
  ]
  const link = l2 !== l11 ? sambandha(chart, l2, l11) : null
  g1.push(rule({
    id: 'w-2-11', group: group1, chart: 'D1', fired: !!link || p2.house === 11 || p11.house === 2,
    title: '2nd and 11th lords connected', effect: 'supportive', weight: 2,
    detail: [`${l2} (2nd lord) and ${l11} (11th lord) are connected${link ? ` by ${link}` : ' by placement'}. Income flows into savings.`],
    rule: '2nd and 11th lords in conjunction, exchange, mutual aspect or in each other\'s houses',
  }))

  const group2 = 'Karakas and fortune'
  const g2: RuleResult[] = [
    karakaRule(chart, 'Jupiter', 'wealth', group2, 'w', 1),
    karakaRule(chart, 'Venus', 'comforts and luxury', group2, 'w', 0.4),
    lordRule(chart, 9, group2, 'w', 'The 9th house is bhagya, fortune. A strong 9th lord supports lasting prosperity.', 0.6),
  ]
  const moon = pos(chart, 'Moon')
  const l11m = SIGN_LORD[(moon.sign + 10) % 12], p11m = pos(chart, l11m)
  g2.push(rule({
    id: 'w-11-moon', group: group2, chart: 'D1', title: `11th from the Moon: lord ${l11m} is ${dignityPhrase(p11m.dignity)}`,
    effect: effectOf(dignityScore(p11m.dignity)), weight: dignityScore(p11m.dignity) * 0.4,
    detail: [`Counted from the Moon, the lord of gains is ${l11m} in ${signName(p11m.sign)}.`],
    rule: '11th house counted from the Moon',
  }))

  const group3 = 'Wealth yogas'
  const g3: RuleResult[] = [
    yogaRule(yogas, 'dhana', group3, 2),
    yogaRule(yogas, 'lakshmi', group3, 2.5),
    yogaRule(yogas, 'vasumati', group3, 2),
    yogaRule(yogas, 'chandra-mangala', group3, 1),
    yogaRule(yogas, 'kalanidhi', group3, 1),
    yogaRule(yogas, 'gajakesari', group3, 1),
    yogaRule(yogas, 'sunapha', group3, 1),
    yogaRule(yogas, 'durdhara', group3, 1),
    yogaRule(yogas, 'maha-parivartana', group3, 1),
    yogaRule(yogas, 'daridra', group3, -2),
    yogaRule(yogas, 'kemadruma', group3, -1),
    yogaRule(yogas, 'shakata', group3, -1),
  ]

  const group4 = 'Indu Lagna and Hora (D2)'
  const indu = induLagna(chart)
  const induOcc = chart.grahas.filter((g) => g.sign === indu).map((g) => g.graha)
  const induLord = SIGN_LORD[indu], pil = pos(chart, induLord)
  const induW = induOcc.reduce((s, g) => s + (isBenefic(g) ? 1 : -0.4), 0) + dignityScore(pil.dignity) * 0.4
  const g4: RuleResult[] = [rule({
    id: 'w-indu', group: group4, chart: 'D1', title: `Indu Lagna in ${RASHI[signName(indu)]} (${h(((indu - chart.lagnaSign + 12) % 12) + 1)})`,
    effect: effectOf(induW, 0.5), weight: induW,
    detail: [
      `Indu Lagna is calculated from the kalas of the 9th lords from the lagna and the Moon. Planets in it, and its lord, show the capacity to hold wealth.`,
      induOcc.length ? `Occupied by ${induOcc.join(', ')}.` : 'No planets occupy it.',
      `Its lord ${induLord} is ${dignityPhrase(pil.dignity)}.`,
    ],
    rule: 'Indu Lagna (Jataka Parijata): occupants and lord',
  })]
  const d2 = vargaChart(chart, 2)
  const sunH = d2.placements.filter((p) => p.sign === 4).map((p) => p.graha)
  const moonH = d2.placements.filter((p) => p.sign === 3).map((p) => p.graha)
  const horaGood = [...moonH.filter((g) => isBenefic(g)), ...sunH.filter((g) => !isBenefic(g))].length
  g4.push(rule({
    id: 'w-hora', group: group4, chart: 'D2', title: `Hora: ${sunH.length} planets in the Sun hora, ${moonH.length} in the Moon hora`,
    effect: horaGood >= 5 ? 'supportive' : 'mixed', weight: (horaGood - 4.5) * 0.4,
    detail: [
      `Sun hora (Leo): ${sunH.join(', ') || 'none'}. Moon hora (Cancer): ${moonH.join(', ') || 'none'}.`,
      'Benefics in the Moon hora and malefics in the Sun hora are traditionally favourable. Sun hora planets point to earned income; Moon hora planets to accumulated and inherited wealth.',
    ],
    rule: 'Parashari hora: benefics in the Moon hora, malefics in the Sun hora',
  }))
  const jD2 = d2.placements.find((p) => p.graha === 'Jupiter')!
  g4.push(rule({
    id: 'w-hora-jup', group: group4, chart: 'D2', title: `Jupiter in the ${jD2.sign === 3 ? 'Moon' : 'Sun'} hora`,
    effect: jD2.sign === 3 ? 'supportive' : 'info', weight: jD2.sign === 3 ? 0.8 : 0,
    detail: ['Jupiter, the karaka of wealth, is best placed in the Moon hora (Cancer, where it is exalted).'],
    rule: 'Hora placement of Jupiter',
  }))

  const sources: GainSource[] = [
    { from: `11th lord ${l11} in the ${h(p11.house!)}`, text: GAIN_FROM[p11.house! - 1] },
    { from: `2nd lord ${l2} in the ${h(p2.house!)}`, text: GAIN_FROM[p2.house! - 1] },
    { from: `Jupiter in the ${h(pos(chart, 'Jupiter').house!)}`, text: GAIN_FROM[pos(chart, 'Jupiter').house! - 1] },
  ]

  const vargas: VargaVerdict[] = [
    vargaVerdict(chart, 1, 2, 'Rashi', 'accumulated wealth'),
    vargaVerdict(chart, 1, 11, 'Rashi', 'income and gains'),
    vargaVerdict(chart, 9, 2, 'Navamsa', 'lasting wealth'),
    vargaVerdict(chart, 10, 11, 'Dasamsa', 'income from work'),
    vargaVerdict(chart, 4, 4, 'Chaturthamsa', 'property and fixed assets'),
  ].filter((v): v is VargaVerdict => v !== null)

  const weights: Weights = {}
  weigh(weights, l11, 3, '11th lord (income)')
  weigh(weights, l2, 2.5, '2nd lord (savings)')
  weigh(weights, 'Jupiter', 2, 'Jupiter, karaka of wealth')
  occupants(chart, 11).forEach((g) => weigh(weights, g, 1.5, 'placed in the 11th'))
  occupants(chart, 2).forEach((g) => weigh(weights, g, 1.2, 'placed in the 2nd'))
  weigh(weights, l9, 1.5, '9th lord (fortune)')
  const timing = areaTiming(chart, 11, weights, now)

  const groups = [
    { title: '2nd and 11th houses', results: g1 },
    { title: 'Karakas and fortune', results: g2 },
    { title: 'Wealth yogas', results: g3 },
    { title: 'Indu Lagna and Hora (D2)', results: g4 },
  ]
  const headline = `Income is shown by the 11th lord ${l11} in the ${h(p11.house!)} and savings by the 2nd lord ${l2} in the ${h(p2.house!)}. Main source of gain: ${GAIN_FROM[p11.house! - 1]}.`
  return {
    conditions: countConditions(groups), headline, groups, vargas, ...timing,
    sources: sources.filter((s, i, a) => a.findIndex((x) => x.text === s.text) === i), induSign: indu, hora: { sun: sunH, moon: moonH },
  }
}
