import { norm360 } from '../astro/constants'
import { RASHI, SIGN_LORD, type Graha } from './constants'
import { dignityPhrase, dignityScore, h, houseOf, lordOfHouse, occupants, placementScore, pos } from './query'
import {
  areaScore, areaTiming, aspectRule, effectOf, karakaRule, lordRule, occupantRule, rule, vargaVerdict, weigh,
  type AreaReport, type RuleResult, type VargaVerdict, type Weights,
} from './rules'
import { signName, vargaChart, type VedicChart } from './sidereal'
import { charaKarakas } from './techniques'
import { vargaSign } from './varga'
import type { Gender } from './marriage'

export interface Sphuta { name: string; for: string; sign: number; navamsa: number; favourable: boolean; rule: string }

export interface ChildrenReport extends AreaReport {
  sphutas: Sphuta[]
  putrakaraka: Graha
}

const odd = (s: number) => s % 2 === 0

/**
 * Children: supportive factors only. The report describes classical
 * indications for the 5th house; it does not predict whether or when a
 * person will have children.
 */
export function childrenReport(chart: VedicChart, gender: Gender, now = new Date()): ChildrenReport | null {
  if (chart.lagnaSign === null) return null
  const l5 = lordOfHouse(chart, 5)
  const jup = pos(chart, 'Jupiter')
  const pk = charaKarakas(chart).Putrakaraka!
  const group1 = '5th house'

  const g1: RuleResult[] = [
    lordRule(chart, 5, group1, 'ch', 'The 5th house (putra bhava) covers children, creativity and intelligence.'),
    occupantRule(chart, 5, group1, 'ch', -0.6, 1),
    aspectRule(chart, 5, group1, 'ch'),
  ]
  if (jup.house === 5) g1.push(rule({
    id: 'ch-jup-5', group: group1, chart: 'D1', title: 'Jupiter in the 5th house', effect: 'mixed', weight: 0,
    detail: ['Jupiter is the karaka of children. Some texts say a karaka in its own house can delay that house\'s matters (karako bhava nashaya); others treat it as protective. Read it together with the 5th lord.'],
    rule: 'Karaka in its own bhava',
  }))

  const group2 = 'Karakas'
  const g2: RuleResult[] = [karakaRule(chart, 'Jupiter', 'children', group2, 'ch')]
  const fromJ = SIGN_LORD[(jup.sign + 4) % 12], pj = pos(chart, fromJ)
  g2.push(rule({
    id: 'ch-5-from-jup', group: group2, chart: 'D1', title: `5th from Jupiter: ${RASHI[signName((jup.sign + 4) % 12)]}, lord ${fromJ} ${dignityPhrase(pj.dignity)}`,
    effect: effectOf(dignityScore(pj.dignity)), weight: dignityScore(pj.dignity) * 0.5,
    detail: ['Classical texts also read children from the 5th house counted from Jupiter.'],
    rule: '5th house counted from Jupiter',
  }))
  const moon = pos(chart, 'Moon')
  const fromM = SIGN_LORD[(moon.sign + 4) % 12], pm = pos(chart, fromM)
  g2.push(rule({
    id: 'ch-5-from-moon', group: group2, chart: 'D1', title: `5th from the Moon: lord ${fromM} ${dignityPhrase(pm.dignity)}`,
    effect: effectOf(dignityScore(pm.dignity)), weight: dignityScore(pm.dignity) * 0.3,
    detail: ['The 5th from the Moon is a supporting reference for the 5th house.'],
    rule: '5th house counted from the Moon',
  }))
  const d7 = vargaChart(chart, 7)
  const pkp = pos(chart, pk), pkD7 = d7.placements.find((p) => p.graha === pk)!
  const pkW = (dignityScore(pkp.dignity) + dignityScore(pkD7.dignity)) * 0.4
  g2.push(rule({
    id: 'ch-pk', group: group2, chart: 'D1 + D7', title: `Putrakaraka: ${pk}`, effect: effectOf(pkW, 0.5), weight: pkW,
    detail: [`In Jaimini astrology the Putrakaraka represents children. ${pk} is ${dignityPhrase(pkp.dignity)} in D1 and ${dignityPhrase(pkD7.dignity)} in D7.`],
    rule: 'Jaimini chara karaka: Putrakaraka',
  }))

  const group3 = 'Saptamsa (D7)'
  const g3: RuleResult[] = []
  if (d7.lagnaSign !== null) {
    const vp = (g: Graha) => d7.placements.find((p) => p.graha === g)!
    const ll = SIGN_LORD[d7.lagnaSign], llp = vp(ll)
    const d75 = SIGN_LORD[(d7.lagnaSign + 4) % 12], d75p = vp(d75)
    const jd7 = vp('Jupiter'), l5d7 = vp(l5)
    const wl = dignityScore(llp.dignity) * 0.5 + placementScore(llp.house!) * 0.5
    const w5 = dignityScore(d75p.dignity) * 0.8 + placementScore(d75p.house!, 5) * 0.8
    g3.push(rule({
      id: 'ch-d7-lagna', group: group3, chart: 'D7', title: `D7 lagna ${RASHI[signName(d7.lagnaSign)]}, lord ${ll} in the ${h(llp.house!)}`,
      effect: effectOf(wl, 0.5), weight: wl, detail: ['The D7 lagna lord shows the general support for progeny.'], rule: 'D7 lagna lord placement and dignity',
    }))
    g3.push(rule({
      id: 'ch-d7-5', group: group3, chart: 'D7', title: `D7 5th lord ${d75} is ${dignityPhrase(d75p.dignity)} in the ${h(d75p.house!)}`,
      effect: effectOf(w5, 0.5), weight: w5, detail: ['The 5th lord of D7 is the main indicator within the Saptamsa.'], rule: 'D7 5th lord placement and dignity',
    }))
    g3.push(rule({
      id: 'ch-d7-jup', group: group3, chart: 'D7', title: `Jupiter in D7 is ${dignityPhrase(jd7.dignity)}`,
      effect: effectOf(dignityScore(jd7.dignity)), weight: dignityScore(jd7.dignity) * 0.6, detail: ['The karaka of children re-examined in D7.'], rule: 'Dignity of Jupiter in D7',
    }))
    g3.push(rule({
      id: 'ch-d1-d7', group: group3, chart: 'D1 + D7', title: `D1 5th lord ${l5} in D7: ${dignityPhrase(l5d7.dignity)}, ${h(l5d7.house!)}`,
      effect: effectOf(dignityScore(l5d7.dignity)), weight: dignityScore(l5d7.dignity) * 0.5, detail: ['The D1 promise is confirmed when the 5th lord is also strong in D7.'], rule: 'D1 5th lord re-examined in D7',
    }))
  }

  const sphutas: Sphuta[] = []
  const mk = (name: string, forWhom: string, gs: Graha[], wantOdd: boolean): Sphuta => {
    const lon = norm360(gs.reduce((s, g) => s + pos(chart, g).lon, 0))
    const sign = Math.floor(lon / 30), nav = vargaSign(9, lon)
    return {
      name, for: forWhom, sign, navamsa: nav, favourable: odd(sign) === wantOdd && odd(nav) === wantOdd,
      rule: `${gs.join(' + ')} longitudes; favourable in an ${wantOdd ? 'odd' : 'even'} sign and ${wantOdd ? 'odd' : 'even'} navamsa`,
    }
  }
  if (gender !== 'female') sphutas.push(mk('Beeja sphuta', 'a man', ['Sun', 'Venus', 'Jupiter'], true))
  if (gender !== 'male') sphutas.push(mk('Kshetra sphuta', 'a woman', ['Moon', 'Mars', 'Jupiter'], false))
  const g4: RuleResult[] = sphutas.map((s) => rule({
    id: `ch-${s.name.split(' ')[0].toLowerCase()}`, group: 'Sphutas', chart: 'D1 + D9',
    title: `${s.name} (for ${s.for}) in ${RASHI[signName(s.sign)]}, navamsa ${RASHI[signName(s.navamsa)]}`,
    effect: s.favourable ? 'supportive' : 'mixed', weight: s.favourable ? 1 : 0,
    detail: [s.favourable ? 'Both the sign and the navamsa are of the favourable kind.' : 'Sign and navamsa are not both of the favourable kind. Classical texts treat this as a factor that needs other support, not a negative result on its own.'],
    rule: s.rule,
  }))

  const vargas: VargaVerdict[] = [
    vargaVerdict(chart, 1, 5, 'Rashi', 'promise of children'),
    vargaVerdict(chart, 7, 5, 'Saptamsa', 'children in detail'),
    vargaVerdict(chart, 9, 5, 'Navamsa', 'inner strength of the 5th'),
  ].filter((v): v is VargaVerdict => v !== null)

  const adult = new Date(chart.utc.getTime() + 21 * 365.25 * 86400000)
  const weights: Weights = {}
  weigh(weights, l5, 3, '5th lord (children)')
  weigh(weights, 'Jupiter', 2.5, 'Jupiter, karaka of children')
  occupants(chart, 5).forEach((g) => weigh(weights, g, 2, 'placed in the 5th'))
  weigh(weights, pk, 2, 'Putrakaraka')
  if (d7.lagnaSign !== null) weigh(weights, SIGN_LORD[(d7.lagnaSign + 4) % 12], 1.5, 'D7 5th lord')
  weigh(weights, lordOfHouse(chart, 9), 1, '9th lord (5th from the 5th)')
  const timing = areaTiming(chart, 5, weights, adult > now ? adult : now)

  const groups = [
    { title: '5th house', results: g1 },
    { title: 'Karakas', results: g2 },
    { title: 'Saptamsa (D7)', results: g3 },
    { title: 'Sphutas', results: g4 },
  ]
  const p5 = pos(chart, l5)
  const headline = `The 5th lord ${l5} is ${dignityPhrase(p5.dignity)} in the ${h(p5.house!)}, and Jupiter is ${houseOf(chart, 'Jupiter', chart.lagnaSign) === 5 ? 'in the 5th' : `in the ${h(jup.house!)}`}.`
  return { score: areaScore(groups.flatMap((g) => g.results), { median: 5.3, spread: 4.4 }), headline, groups, vargas, ...timing, sphutas, putrakaraka: pk }
}
