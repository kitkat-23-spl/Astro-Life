/**
 * A rule-based reading of one Varshaphal year. It combines the year chart
 * (Tajika: muntha, year lord, sahams, Mudda dasha), the natal Vimshottari
 * periods that run during the year and the slow transits that fall inside it,
 * first for the year as a whole and then for each area of life.
 */
import { ordinal } from '../astro/constants'
import { DUSTHANA, RASHI, SIGN_LORD, type Graha } from './constants'
import { MUNTHA_RESULT, varshaphal, type Varshaphal } from './annual'
import { vimshottari, type Period } from './dasha'
import { activatedHouses } from './interpret'
import { aspectedSigns, dignityPhrase, dignityScore, h, housesRuledBy, isBenefic, placementScore, pos } from './query'
import { aspectRule, countConditions, lordRule, occupantRule, rule, summarise, type AreaSummary, type Effect, type RuleGroup, type RuleResult } from './rules'
import { signName, type VedicChart } from './sidereal'
import { HOUSE_TOPIC, houseLine } from './transitReading'
import { sadeSati, signPeriods } from './transits'

const MALEFIC: Graha[] = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']
const SLOW = ['Saturn', 'Jupiter', 'Rahu'] as const
const GOOD_FROM_MOON: Record<(typeof SLOW)[number], number[]> = { Saturn: [3, 6, 11], Jupiter: [2, 5, 7, 9, 11], Rahu: [3, 6, 11] }

const rashi = (s: number) => RASHI[signName(s)]
const houseFrom = (ref: number, sign: number) => ((sign - ref + 12) % 12) + 1
const topic = (house: number) => HOUSE_TOPIC[house - 1]
const firstTopic = (house: number) => HOUSE_TOPIC[house - 1].split(',')[0]
const overlaps = (a: { start: Date; end: Date }, from: Date, until: Date) => a.start < until && a.end > from
const toEffect = (w: number, strong = 1.5): Effect => (w >= strong ? 'supportive' : w < 0 ? 'challenging' : 'mixed')

export interface YearArea { id: string; title: string; report?: string; summary: AreaSummary; group: RuleGroup }
export interface MuddaReading { lord: Graha; start: Date; end: Date; effect: Effect; focus: string; text: string }
export interface KeyDate { date: Date; text: string }
export interface YearReading {
  v: Varshaphal
  summary: AreaSummary
  groups: RuleGroup[]
  areas: YearArea[]
  mudda: MuddaReading[]
  dates: KeyDate[]
}

/** Rules evaluated on the year chart are labelled as such so they are not confused with the birth chart. */
const onYearChart = (r: RuleResult, prefix: string): RuleResult => ({
  ...r, id: `${prefix}-${r.id}`, chart: 'Varshaphal', title: `Year chart: ${r.title[0].toLowerCase()}${r.title.slice(1)}`,
})

/** How well a planet can deliver in the birth chart: dignity, house and the kind of houses it rules. */
function natalStrength(chart: VedicChart, g: Graha): number {
  const p = pos(chart, g)
  const ruled = housesRuledBy(chart, g)
  let w = dignityScore(p.dignity) + placementScore(p.house!, ruled.find((r) => DUSTHANA.includes(r)))
  if (ruled.some((r) => r === 5 || r === 9)) w += 1
  if (ruled.length > 0 && ruled.every((r) => DUSTHANA.includes(r))) w -= 1
  return w
}

const ruledText = (chart: VedicChart, g: Graha) => {
  const r = housesRuledBy(chart, g)
  return r.length ? `, ruling the ${r.map(ordinal).join(' and ')}` : ''
}

/* ------------------------------------------------------------------ */
/* The year as a whole                                                  */
/* ------------------------------------------------------------------ */

function yearChartRules(natal: VedicChart, v: Varshaphal): RuleResult[] {
  const c = v.chart, L = c.lagnaSign!
  const out: RuleResult[] = []
  const group = 'The year chart'

  const mh = v.muntha.house
  const mw = [9, 10, 11].includes(mh) ? 1.5 : [1, 2, 3, 5].includes(mh) ? 1 : -1.5
  out.push(rule({
    id: 'y-muntha', group, chart: 'Varshaphal', title: `Muntha in the ${h(mh)}`,
    effect: mw > 0 ? 'supportive' : 'challenging', weight: mw,
    detail: [`The muntha moves one sign a year from the birth lagna. This year it is in ${rashi(v.muntha.sign)}, the ${h(mh)} of the year chart, which is ${MUNTHA_RESULT(mh)}.`, `The year draws attention to ${topic(mh)}.`],
    rule: 'Muntha house in the Varshaphal (Tajika Neelakanthi)',
  }))

  const ml = pos(c, v.muntha.lord)
  const mlw = dignityScore(ml.dignity) + placementScore(ml.house!) - (ml.combust ? 1 : 0)
  out.push(rule({
    id: 'y-muntha-lord', group, chart: 'Varshaphal', title: `Muntha lord ${v.muntha.lord} is ${dignityPhrase(ml.dignity)} in the ${h(ml.house!)}`,
    effect: toEffect(mlw), weight: mlw,
    detail: [`A strong, well placed muntha lord carries out the muntha's promise; a weak one delays it.${ml.combust ? ` ${v.muntha.lord} is combust.` : ''}`],
    rule: 'Dignity and house of the muntha lord in the year chart',
  }))

  const withMuntha = c.grahas.filter((g) => g.sign === v.muntha.sign).map((g) => g.graha)
  const mjw = withMuntha.reduce((s, g) => s + (isBenefic(g) ? 1 : -1), 0)
  out.push(rule({
    id: 'y-muntha-with', group, chart: 'Varshaphal', fired: withMuntha.length > 0,
    title: withMuntha.length ? `Planets with the muntha: ${withMuntha.join(', ')}` : 'Planets with the muntha',
    effect: mjw > 0 ? 'supportive' : mjw < 0 ? 'challenging' : 'mixed', weight: mjw,
    detail: [`Benefics with the muntha help its matters during the year and malefics trouble them.`],
    rule: 'Benefics or malefics in the muntha sign',
  }))

  const yl = v.officeBearers.find((o) => o.graha === v.yearLord)!
  const sw = yl.strength >= 15 ? 1.5 : yl.strength >= 10 ? 0.5 : -1
  out.push(rule({
    id: 'y-lord-strength', group, chart: 'Varshaphal',
    title: `Year lord ${v.yearLord} has ${yl.strength >= 15 ? 'full' : yl.strength >= 10 ? 'middling' : yl.strength >= 5 ? 'little' : 'almost no'} strength`,
    effect: toEffect(sw), weight: sw,
    detail: [`Pancha-vargiya bala ${yl.strength.toFixed(1)} of 20. Tajika texts count above 15 as full strength, 10 to 15 as middling, 5 to 10 as little and below 5 as without strength. A strong year lord gives a good year.`],
    rule: 'Pancha-vargiya bala of the year lord (Tajika Neelakanthi)',
  }))

  const yp = pos(c, v.yearLord)
  const yw = dignityScore(yp.dignity) + placementScore(yp.house!) - (yp.combust ? 1 : 0)
  out.push(rule({
    id: 'y-lord-place', group, chart: 'Varshaphal', title: `Year lord ${v.yearLord} is ${dignityPhrase(yp.dignity)} in the ${h(yp.house!)}`,
    effect: toEffect(yw), weight: yw,
    detail: [`The year lord's house shows where the year's main events happen: ${topic(yp.house!)}.${yp.combust ? ` ${v.yearLord} is combust, which weakens it.` : ''}${yp.retrograde && v.yearLord !== 'Rahu' && v.yearLord !== 'Ketu' ? ` ${v.yearLord} is retrograde, so results may come after delays.` : ''}`],
    rule: 'Dignity and house of the year lord in the year chart',
  }))

  const fromBirth = houseFrom(natal.lagnaSign!, L)
  const lw = DUSTHANA.includes(fromBirth) ? -1 : [1, 5, 9, 10, 11].includes(fromBirth) ? 1 : 0
  out.push(rule({
    id: 'y-lagna-from-birth', group, chart: 'Varshaphal + D1', title: `Year lagna ${rashi(L)} is the ${h(fromBirth)} of the birth chart`,
    effect: lw > 0 ? 'supportive' : lw < 0 ? 'challenging' : 'mixed', weight: lw,
    detail: [lw < 0 ? 'A year lagna that falls in the 6th, 8th or 12th from the birth lagna is counted unfavourable: health and expenses need care.' : lw > 0 ? 'A year lagna that falls in the 1st, 5th, 9th, 10th or 11th from the birth lagna is counted favourable.' : 'This position is neither especially favourable nor unfavourable.'],
    rule: 'Year lagna counted from the birth lagna',
  }))

  out.push(onYearChart(lordRule(c, 1, group, 'y', 'The lagna lord of the year chart shows health, energy and how the year goes for you personally.'), 'y'))
  out.push(onYearChart(occupantRule(c, 1, group, 'y'), 'y'))

  const inGood = (['Jupiter', 'Venus', 'Mercury'] as Graha[]).filter((g) => [1, 4, 5, 7, 9, 10].includes(pos(c, g).house!))
  out.push(rule({
    id: 'y-benefic-kendra', group, chart: 'Varshaphal', fired: inGood.length > 0,
    title: inGood.length ? `Benefics in angles or trines: ${inGood.join(', ')}` : 'Benefics in angles or trines',
    effect: 'supportive', weight: inGood.reduce((s, g) => s + (g === 'Jupiter' ? 1 : 0.7), 0),
    detail: inGood.map((g) => `${g} in the ${h(pos(c, g).house!)} of the year chart.`),
    rule: 'Jupiter, Venus or Mercury in the 1st, 4th, 5th, 7th, 9th or 10th of the year chart',
  }))

  const upa = MALEFIC.filter((g) => [3, 6, 11].includes(pos(c, g).house!))
  out.push(rule({
    id: 'y-malefic-upachaya', group, chart: 'Varshaphal', fired: upa.length > 0,
    title: upa.length ? `Malefics in the 3rd, 6th or 11th: ${upa.join(', ')}` : 'Malefics in the 3rd, 6th or 11th',
    effect: 'supportive', weight: upa.length * 0.6,
    detail: ['Malefics in these houses give the drive to overcome rivals and obstacles.', ...upa.map((g) => `${g} in the ${h(pos(c, g).house!)}.`)],
    rule: 'Malefics in upachaya houses of the year chart',
  }))

  const bad = MALEFIC.filter((g) => [8, 12].includes(pos(c, g).house!))
  out.push(rule({
    id: 'y-malefic-dusthana', group, chart: 'Varshaphal', fired: bad.length > 0,
    title: bad.length ? `Malefics in the 8th or 12th: ${bad.join(', ')}` : 'Malefics in the 8th or 12th',
    effect: 'challenging', weight: -0.7 * bad.length,
    detail: ['Malefics here point to unexpected costs, worry or health matters that need attention.', ...bad.map((g) => `${g} in the ${h(pos(c, g).house!)}.`)],
    rule: 'Malefics in the 8th or 12th of the year chart',
  }))

  const moon = pos(c, 'Moon'), sun = pos(c, 'Sun')
  const waxing = (moon.lon - sun.lon + 360) % 360 < 180
  const moonW = DUSTHANA.includes(moon.house!) ? -1 : waxing && [1, 4, 5, 7, 9, 10, 11].includes(moon.house!) ? 1 : 0
  out.push(rule({
    id: 'y-moon', group, chart: 'Varshaphal', title: `Moon ${waxing ? 'waxing' : 'waning'} in the ${h(moon.house!)}`,
    effect: moonW > 0 ? 'supportive' : moonW < 0 ? 'challenging' : 'mixed', weight: moonW,
    detail: [`The Moon in the year chart shows peace of mind through the year. ${moonW < 0 ? 'In the 6th, 8th or 12th it points to worry and fatigue.' : moonW > 0 ? 'Waxing and well placed, it supports a settled mind.' : 'Its placement is moderate.'}`],
    rule: 'House and phase of the Moon in the year chart',
  }))
  return out
}

interface DashaSlice { md: Period; ad: Period }

function dashaSlices(natal: VedicChart, v: Varshaphal): DashaSlice[] {
  return vimshottari(pos(natal, 'Moon').lon, natal.utc)
    .filter((md) => overlaps(md, v.start, v.end))
    .flatMap((md) => md.sub!.filter((ad) => overlaps(ad, v.start, v.end)).map((ad) => ({ md, ad })))
}

function dashaRules(natal: VedicChart, v: Varshaphal, slices: DashaSlice[]): RuleResult[] {
  return slices.map(({ md, ad }) => {
    const p = pos(natal, ad.lord), yp = pos(v.chart, ad.lord)
    const w = (natalStrength(natal, md.lord) + 2 * natalStrength(natal, ad.lord)) / 3 + (DUSTHANA.includes(yp.house!) ? -0.5 : 0.3)
    const focus = activatedHouses(natal, ad.lord).filter((a) => a.via.includes('occupies') || a.via.includes('rules')).map((a) => firstTopic(a.house))
    return rule({
      id: `y-dasha-${md.lord}-${ad.lord}`, group: 'Natal dasha', chart: 'D1 + Varshaphal',
      title: `${md.lord} mahadasha, ${ad.lord} sub-period`,
      effect: toEffect(w), weight: w,
      detail: [
        `${ad.lord} is ${dignityPhrase(p.dignity)} in the ${h(p.house!)} of the birth chart${ruledText(natal, ad.lord)}. During this sub-period the focus is on ${focus.join(', ')}.`,
        `In the year chart ${ad.lord} is in the ${h(yp.house!)}${DUSTHANA.includes(yp.house!) ? ', a difficult house, so its results this year come with effort' : ''}.`,
      ],
      rule: 'Vimshottari sub-period lord: natal dignity, house and lordship, and its house in the year chart',
    })
  })
}

interface TransitSlice { g: (typeof SLOW)[number]; sign: number; start: Date; end: Date; house: number; fromMoon: number; retrogradeReturn: boolean }

function transitSlices(natal: VedicChart, v: Varshaphal): TransitSlice[] {
  const moon = pos(natal, 'Moon').sign
  return SLOW.flatMap((g) => signPeriods(natal, g, v.start, v.end)
    .filter((p) => overlaps(p, v.start, v.end))
    .map((p) => ({ g, sign: p.sign, start: p.start, end: p.end, house: houseFrom(natal.lagnaSign!, p.sign), fromMoon: houseFrom(moon, p.sign), retrogradeReturn: p.retrogradeReturn })))
}

/** One entry per planet and sign, so a retrograde back-and-forth is judged once. */
function bySign(slices: TransitSlice[]): TransitSlice[] {
  const out = new Map<string, TransitSlice>()
  for (const t of slices) {
    const k = `${t.g}-${t.sign}`, prev = out.get(k)
    out.set(k, prev ? { ...prev, start: prev.start < t.start ? prev.start : t.start, end: prev.end > t.end ? prev.end : t.end, retrogradeReturn: false } : t)
  }
  return [...out.values()]
}

function transitRule(natal: VedicChart, t: TransitSlice, group: string, prefix: string): RuleResult {
  const line = houseLine(t.g, t.house)
  const goodMoon = GOOD_FROM_MOON[t.g].includes(t.fromMoon)
  const kantaka = t.g === 'Saturn' && (t.fromMoon === 4 || t.fromMoon === 8)
  const w = line.weight + (goodMoon ? 0.5 : -0.3) + (kantaka ? -0.7 : 0)
  return rule({
    id: `${prefix}-tr-${t.g}-${t.sign}-${t.start.getTime()}`, group, chart: 'Transit + D1',
    title: `${t.g} through your ${h(t.house)} (${rashi(t.sign)})${t.retrogradeReturn ? ', retrograde return' : ''}`,
    effect: toEffect(w, 1), weight: w,
    detail: [
      line.text,
      `It is ${ordinal(t.fromMoon)} from the natal Moon, which the classical texts count as ${goodMoon ? 'favourable' : 'unfavourable'}.${kantaka ? ` Saturn ${t.fromMoon === 8 ? '8th from the Moon (Ashtama Shani)' : '4th from the Moon (Kantaka Shani)'} is a demanding transit.` : ''}${t.g === 'Rahu' ? ` Ketu is opposite, in your ${h(houseFrom(natal.lagnaSign!, (t.sign + 6) % 12))}.` : ''}`,
    ],
    rule: `${t.g} transit by house from the lagna and from the Moon`,
  })
}

function sadeSatiRule(natal: VedicChart, v: Varshaphal): RuleResult {
  const phases = sadeSati(natal, v.start).cycle.filter((p) => overlaps(p, v.start, v.end))
  const names = { first: 'first', peak: 'peak', last: 'last' }
  return rule({
    id: 'y-sade-sati', group: 'Slow transits', chart: 'Transit', fired: phases.length > 0,
    title: phases.length ? `Sade Sati runs this year (${phases.map((p) => names[p.phase]).join(' and ')} phase)` : 'Sade Sati',
    effect: 'challenging', weight: phases.some((p) => p.phase === 'peak') ? -1.5 : -1,
    detail: ['Saturn crosses the 12th, 1st and 2nd signs from the natal Moon. Expect responsibility and pressure; steady work and patience are rewarded.'],
    rule: 'Saturn in the 12th, 1st or 2nd from the natal Moon',
  })
}

/* ------------------------------------------------------------------ */
/* Areas of life                                                        */
/* ------------------------------------------------------------------ */

interface AreaDef { id: string; title: string; houses: number[]; sahams: string[]; report?: string; note: string }

const AREAS: AreaDef[] = [
  { id: 'career', title: 'Career and status', houses: [10], sahams: ['Karma'], report: 'career', note: 'The 10th house of the year chart shows work, position and recognition this year.' },
  { id: 'money', title: 'Money and gains', houses: [2, 11], sahams: ['Punya'], report: 'wealth', note: 'The 2nd house holds savings and family resources; the 11th, income and gains.' },
  { id: 'partner', title: 'Partner and relationships', houses: [7], sahams: ['Vivaha'], report: 'marriage', note: 'The 7th house of the year chart shows the partner, marriage and close dealings this year.' },
  { id: 'health', title: 'Health and energy', houses: [1], sahams: ['Roga'], note: 'The year lagna and its lord show vitality; the Roga saham marks illness.' },
  { id: 'home', title: 'Home and family', houses: [4], sahams: [], note: 'The 4th house of the year chart covers home, mother, property and peace of mind.' },
  { id: 'learning', title: 'Learning and children', houses: [5], sahams: ['Vidya', 'Putra'], report: 'education', note: 'The 5th house of the year chart covers studies, creativity and children.' },
]

function sahamRule(v: Varshaphal, name: string, group: string, prefix: string): RuleResult {
  const s = v.sahams.find((x) => x.name.startsWith(name))!
  const sign = Math.floor(s.lon / 30)
  const house = houseFrom(v.chart.lagnaSign!, sign)
  const lord = SIGN_LORD[sign]
  const lp = pos(v.chart, lord)
  const malefics = v.chart.grahas.filter((g) => g.sign === sign && MALEFIC.includes(g.graha)).map((g) => g.graha)
  const base = { id: `${prefix}-saham-${name}`, group, chart: 'Varshaphal', rule: `${s.name} saham: house, lord and malefics with it` }
  if (name === 'Roga') {
    const afflicted = DUSTHANA.includes(house) || malefics.length > 0
    return rule({
      ...base, title: `Roga saham in the ${h(house)}${malefics.length ? ` with ${malefics.join(', ')}` : ''}`,
      effect: afflicted ? 'challenging' : 'supportive', weight: afflicted ? -1 : 0.5,
      detail: [afflicted ? 'The illness point is in a difficult house or with malefics, so health needs more care this year.' : 'The illness point is free of affliction.'],
    })
  }
  const w = (DUSTHANA.includes(house) ? -1 : [1, 4, 5, 7, 9, 10, 11].includes(house) ? 1 : 0.3) + 0.5 * dignityScore(lp.dignity) + (DUSTHANA.includes(lp.house!) ? -0.5 : 0) - 0.5 * malefics.length
  return rule({
    ...base, title: `${s.name} saham in the ${h(house)}, lord ${lord} in the ${h(lp.house!)}`,
    effect: toEffect(w, 1), weight: w,
    detail: [`The saham for ${s.meaning} falls in ${rashi(sign)}. Its lord ${lord} is ${dignityPhrase(lp.dignity)} in the ${h(lp.house!)} of the year chart.${malefics.length ? ` ${malefics.join(' and ')} ${malefics.length > 1 ? 'are' : 'is'} with it.` : ''}`],
  })
}

function areaRules(natal: VedicChart, v: Varshaphal, a: AreaDef, slices: DashaSlice[], transits: TransitSlice[]): RuleResult[] {
  const group = a.title, p = `a-${a.id}`
  const out: RuleResult[] = []
  for (const house of a.houses) {
    out.push(onYearChart(lordRule(v.chart, house, group, p, a.note), p))
    out.push(onYearChart(occupantRule(v.chart, house, group, p), p))
    out.push(onYearChart(aspectRule(v.chart, house, group, p), p))
  }
  for (const s of a.sahams) out.push(sahamRule(v, s, group, p))

  const natalSigns = a.houses.map((house) => (natal.lagnaSign! + house - 1) % 12)
  for (const t of transits) {
    if (a.houses.includes(t.house)) out.push(transitRule(natal, t, group, p))
    else if (t.g === 'Jupiter' && aspectedSigns('Jupiter', t.sign).some((s) => natalSigns.includes(s))) {
      const house = a.houses.find((x) => aspectedSigns('Jupiter', t.sign).includes((natal.lagnaSign! + x - 1) % 12))!
      out.push(rule({
        id: `${p}-jup-asp-${t.sign}-${t.start.getTime()}`, group, chart: 'Transit + D1', title: `Transit Jupiter aspects your ${h(house)}`,
        effect: 'supportive', weight: 1,
        detail: [`From ${rashi(t.sign)} (your ${h(t.house)}) Jupiter aspects the ${h(house)}, which supports ${topic(house)} while it lasts.`],
        rule: 'Jupiter\'s 5th, 7th and 9th aspects in transit',
      }))
    } else if (t.g === 'Saturn' && aspectedSigns('Saturn', t.sign).some((s) => natalSigns.includes(s))) {
      const house = a.houses.find((x) => aspectedSigns('Saturn', t.sign).includes((natal.lagnaSign! + x - 1) % 12))!
      out.push(rule({
        id: `${p}-sat-asp-${t.sign}-${t.start.getTime()}`, group, chart: 'Transit + D1', title: `Transit Saturn aspects your ${h(house)}`,
        effect: 'challenging', weight: -0.5,
        detail: [`From ${rashi(t.sign)} (your ${h(t.house)}) Saturn aspects the ${h(house)}: ${topic(house)} need patience and steady effort.`],
        rule: 'Saturn\'s 3rd, 7th and 10th aspects in transit',
      }))
    }
  }

  const seen = new Set<string>()
  for (const { md, ad } of slices) {
    for (const lord of [md.lord, ad.lord]) {
      const hits = activatedHouses(natal, lord).filter((x) => a.houses.includes(x.house) && (x.via.includes('occupies') || x.via.includes('rules')))
      if (!hits.length || seen.has(lord)) continue
      seen.add(lord)
      const w = natalStrength(natal, lord)
      const np = pos(natal, lord)
      out.push(rule({
        id: `${p}-dasha-${lord}`, group, chart: 'D1', title: `Running dasha of ${lord} activates the ${hits.map((x) => ordinal(x.house)).join(' and ')}`,
        effect: toEffect(w), weight: w,
        detail: [`${lord} ${hits.map((x) => x.via.filter((y) => y === 'occupies' || y === 'rules').join(' and ')).join('; ')} the ${hits.map((x) => h(x.house)).join(' and ')} in the birth chart, so its ${lord === md.lord ? 'major period' : 'sub-period'} brings these matters forward. It is ${dignityPhrase(np.dignity)} in the ${h(np.house!)}${ruledText(natal, lord)}.`],
        rule: 'Dasha lord that occupies or rules the house in the birth chart',
      }))
    }
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Month by month and key dates                                         */
/* ------------------------------------------------------------------ */

function muddaReadings(v: Varshaphal): MuddaReading[] {
  return v.mudda.map((m) => {
    const p = pos(v.chart, m.lord)
    const ruled = housesRuledBy(v.chart, m.lord)
    const w = dignityScore(p.dignity) + placementScore(p.house!, ruled.find((r) => DUSTHANA.includes(r))) - (p.combust ? 1 : 0)
    const effect = toEffect(w)
    const houses = [...new Set([p.house!, ...ruled])]
    const verdict = effect === 'supportive' ? 'A productive stretch for these matters.' : effect === 'challenging' ? 'These matters need care and patience in this stretch.' : 'Results come with effort.'
    return {
      lord: m.lord, start: m.start, end: m.end, effect,
      focus: houses.map(firstTopic).join(', '),
      text: `${m.lord} is ${dignityPhrase(p.dignity)} in the ${h(p.house!)} of the year chart${ruled.length ? `, ruling the ${ruled.map(ordinal).join(' and ')}` : ''}. ${verdict}`,
    }
  })
}

function keyDates(natal: VedicChart, v: Varshaphal, slices: DashaSlice[], transits: TransitSlice[]): KeyDate[] {
  const inYear = (d: Date) => d >= v.start && d < v.end
  const out: KeyDate[] = []
  for (const { md, ad } of slices) if (inYear(ad.start)) out.push({ date: ad.start, text: `${md.lord} / ${ad.lord} sub-period begins: focus on ${activatedHouses(natal, ad.lord).filter((x) => x.via.includes('occupies') || x.via.includes('rules')).map((x) => firstTopic(x.house)).join(', ')}.` })
  for (const t of transits) {
    if (!inYear(t.start)) continue
    out.push({ date: t.start, text: `${t.g} ${t.retrogradeReturn ? 'moves back' : 'moves'} into ${rashi(t.sign)}, your ${h(t.house)} (${firstTopic(t.house)})${t.g === 'Rahu' ? `, with Ketu in your ${h(houseFrom(natal.lagnaSign!, (t.sign + 6) % 12))}` : ''}.` })
  }
  for (const p of sadeSati(natal, v.start).cycle) if (inYear(p.start)) out.push({ date: p.start, text: `Sade Sati ${p.phase === 'peak' ? 'peak' : p.phase} phase begins.` })
  return out.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/* ------------------------------------------------------------------ */

export function annualReading(natal: VedicChart, age: number): YearReading | null {
  const v = varshaphal(natal, age)
  if (!v) return null
  const slices = dashaSlices(natal, v)
  const transits = transitSlices(natal, v)
  const merged = bySign(transits)
  const groups: RuleGroup[] = [
    { title: 'The year chart', results: yearChartRules(natal, v) },
    { title: 'Natal dasha', results: dashaRules(natal, v, slices) },
    { title: 'Slow transits', results: [...merged.map((t) => transitRule(natal, t, 'Slow transits', 'y')), sadeSatiRule(natal, v)] },
  ]
  const areas = AREAS.map((a) => {
    const group = { title: a.title, results: areaRules(natal, v, a, slices, merged) }
    return { id: a.id, title: a.title, report: a.report, group, summary: summarise({ groups: [group], conditions: countConditions([group]) }) }
  })
  return {
    v, groups, areas,
    summary: summarise({ groups, conditions: countConditions(groups) }),
    mudda: muddaReadings(v),
    dates: keyDates(natal, v, slices, transits),
  }
}
