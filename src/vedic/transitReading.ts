/**
 * Transit readings: what each planet's current transit means for this chart.
 * A reading combines the house it crosses (from the lagna and from the Moon),
 * the houses it rules and occupies at birth, contacts with natal planets, its
 * dignity in the transit sign and the running dasha.
 */
import { ordinal } from '../astro/constants'
import { RASHI, type Graha } from './constants'
import { periodChain, type Period } from './dasha'
import { aspectedSigns, housesRuledBy, pos } from './query'
import { dignityOf, signName, type VedicChart } from './sidereal'
import { gochara, signPeriods, transitPositions, type TransitPos } from './transits'

const MALEFIC: Graha[] = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']

/** What each planet does as it moves through a house. */
const THEME: Record<Graha, string> = {
  Sun: 'puts attention, ego and dealings with authority on',
  Moon: 'draws mood and attention to',
  Mars: 'brings energy, haste and possible disputes to',
  Mercury: 'brings talks, paperwork and short trips around',
  Jupiter: 'brings growth, help and opportunities to',
  Venus: 'brings comfort, pleasure and relationships into',
  Saturn: 'brings responsibility, delays and hard work to',
  Rahu: 'brings ambition, restlessness and unusual situations to',
  Ketu: 'brings detachment and sudden changes to',
}

/** Plain topics of each house, used in transit readings. */
export const HOUSE_TOPIC = [
  'self, health and appearance', 'money, family and speech', 'effort, siblings and communication', 'home, mother and property',
  'children, studies and creativity', 'work, health and competition', 'partner and partnerships', 'sudden events, shared money and research',
  'fortune, father and higher learning', 'career and status', 'income, friends and hopes', 'expenses, travel abroad and rest',
]

/** Classical results of each planet's transit by house from the natal Moon (Phaladeepika 26, summarised; nodes from later texts). */
const FROM_MOON: Record<Graha, string[]> = {
  Sun: ['fatigue and irritability; heart and eyes need care', 'expenses and strained family talks', 'success, courage and gains', 'unrest at home', 'worry and confusion; concerns about children', 'victory over rivals and better health', 'tiring travel and friction with the partner', 'health concerns and conflict with authority', 'friction with father or teachers', 'recognition and success at work', 'gains and honour', 'expenses and loss of standing'],
  Moon: ['comfort and good food', 'expenses', 'success and gains', 'anxiety', 'obstacles and mental strain', 'good health and success over rivals', 'pleasant company and gains', 'anxiety and low energy', 'obstacles', 'success at work', 'gains and happiness', 'expenses and fatigue'],
  Mars: ['anger, heat and risk of injury', 'family disputes and money loss', 'courage, success and gains through effort', 'quarrels at home and property issues', 'impulsive decisions; concerns about children', 'victory in competition and over rivals', 'friction with the partner', 'risk of accidents and illness; take care', 'disputes with father or teachers', 'pressure and setbacks at work', 'gains and achievement', 'expenses, losses and conflict'],
  Mercury: ['restlessness and minor losses', 'gains through speech and learning', 'trouble from opponents and anxiety', 'gains and family happiness', 'disagreements and mental unrest', 'success and recognition', 'friction in relationships', 'gains and success', 'obstacles', 'success in work and trade', 'gains and good news', 'expenses and losses'],
  Jupiter: ['change of place, expenses and restlessness', 'wealth and family happiness', 'obstacles and a change of position', 'worries at home', 'good decisions, learning and news about children', 'trouble from opponents and health issues', 'marriage, partnership and comfortable travel', 'obstacles and health concerns', 'fortune, guidance and pilgrimage', 'changes and stress at work', 'gains and honours', 'expenses, travel and spiritual pursuits'],
  Venus: ['comfort and pleasures', 'wealth and family pleasures', 'status and gains', 'friends and comforts', 'romance and good news about children', 'trouble from opponents and health issues', 'strain in relationships', 'comforts and gains', 'fortune and gifts', 'disputes at work', 'gains', 'comforts and gains'],
  Saturn: ['heavy responsibility, stress and health care (peak of Sade Sati)', 'money pressure and family strain (last phase of Sade Sati)', 'success through effort, courage and gains', 'pressure at home and property issues (Kantaka Shani)', 'worries about children and mental strain', 'victory over rivals and recovery', 'strain with the partner and tiring travel', 'obstacles and health care needed (Ashtama Shani)', 'delays in fortune and strain with father', 'heavy workload and career pressure', 'gains and stability', 'expenses, losses and isolation (first phase of Sade Sati)'],
  Rahu: ['confusion and health issues', 'family and money disputes', 'courage and gains', 'unrest at home', 'worries; avoid speculation', 'victory over rivals', 'strain in partnerships', 'sudden events', 'doubts and conflict with mentors', 'ambition and unusual career moves', 'gains', 'expenses and foreign connections'],
  Ketu: ['detachment and health issues', 'harsh speech and family issues', 'courage and success', 'detachment from home', 'confusion about children or studies', 'victory over rivals', 'distance in partnership', 'sudden events and interest in research', 'spiritual interest and doubts', 'uncertainty in career', 'gains', 'spiritual pursuits and expenses'],
}

const KARAKA_SHORT: Record<Graha, string> = {
  Sun: 'confidence, father and authority', Moon: 'mind and emotions', Mars: 'energy and courage', Mercury: 'thinking and communication',
  Jupiter: 'wisdom, children and fortune', Venus: 'relationships and comforts', Saturn: 'duties and endurance', Rahu: 'ambitions', Ketu: 'detachment and past skills',
}
const VERB: Record<Graha, string> = {
  Sun: 'highlights', Moon: 'stirs', Mars: 'energises and agitates', Mercury: 'activates', Jupiter: 'expands and supports',
  Venus: 'softens and sweetens', Saturn: 'tests and slows', Rahu: 'amplifies and unsettles', Ketu: 'detaches you from',
}

/** Transiting planet over a natal planet: well-known combinations. */
const CONTACT: Record<string, string> = {
  'Saturn>Moon': 'emotional pressure; responsibilities weigh on the mind. This is the core of Sade Sati.',
  'Saturn>Sun': 'pressure on confidence and from authority figures; the father\'s health may need attention.',
  'Saturn>Venus': 'relationships are tested and commitments are reviewed.',
  'Saturn>Mars': 'frustration and blocked energy; take care with machinery and driving.',
  'Saturn>Jupiter': 'slow, steady growth; responsibility in teaching, advice or finance.',
  'Saturn>Mercury': 'serious study and careful contracts, with some nervous strain.',
  'Jupiter>Moon': 'emotional support, optimism and family happiness.',
  'Jupiter>Sun': 'recognition, support from superiors and better health.',
  'Jupiter>Venus': 'relationships and comforts grow.',
  'Jupiter>Mars': 'confident action; good for property and legal matters.',
  'Jupiter>Mercury': 'learning, writing and business deals do well.',
  'Jupiter>Saturn': 'long-term efforts begin to pay off.',
  'Rahu>Moon': 'restlessness, unusual desires and anxiety.',
  'Rahu>Sun': 'ambition, image concerns and conflict with authority.',
  'Rahu>Venus': 'intense attraction, unconventional relationships and higher spending.',
  'Ketu>Moon': 'detachment, introspection and emotional distance.',
  'Ketu>Sun': 'loss of drive and a turn towards inner life.',
  'Mars>Moon': 'emotional heat and quick reactions.',
  'Mars>Saturn': 'frustration and delays; avoid forcing matters.',
}

/** Transiting planets together in one sign. Keys are the planet names in alphabetical order. */
const TOGETHER: Record<string, string> = {
  'Jupiter+Saturn': 'the great conjunction, about every 20 years: long-term plans and institutions are reset.',
  'Jupiter+Rahu': 'Guru Chandala: unconventional choices about beliefs, money or advice; check information carefully.',
  'Jupiter+Ketu': 'interest in spirituality and detachment from material goals.',
  'Rahu+Saturn': 'pressure, fears and unusual burdens; disciplined effort works best.',
  'Ketu+Saturn': 'losses or withdrawal, followed by clarity.',
  'Mars+Saturn': 'frustration and friction; avoid risky work and confrontations.',
  'Mars+Rahu': 'Angaraka: heat, impulsiveness and accidents; slow down.',
  'Ketu+Mars': 'sudden actions and injuries; take care.',
  'Saturn+Sun': 'conflict between authority and duty; strain with superiors or the father.',
  'Rahu+Sun': 'an eclipse season: confidence and health need care.',
  'Ketu+Sun': 'an eclipse season: confidence and health need care.',
  'Mercury+Sun': 'good for planning, study and communication.',
  'Mercury+Venus': 'good for art, trade and pleasant talks.',
  'Jupiter+Venus': 'favourable for relationships, celebrations and comforts.',
  'Mars+Venus': 'strong attraction and passion; spending rises.',
  'Jupiter+Mars': 'confident, principled action; good for property and law.',
}

const RETURN: Partial<Record<Graha, string>> = {
  Saturn: 'Saturn return: about every 29.5 years Saturn comes back to its birth sign. It is a time to take stock and rebuild the structure of life.',
  Jupiter: 'Jupiter return: about every 12 years, the start of a new cycle of growth and learning.',
  Rahu: 'Nodal return: about every 18.6 years, a turning point in direction and ambition.',
  Ketu: 'Nodal return: about every 18.6 years, a turning point in direction and ambition.',
  Mars: 'Mars return: about every two years, a fresh start for effort and initiative.',
}

export type Tone = 'good' | 'mixed' | 'challenge'

export interface TransitReading {
  graha: Graha
  sign: number
  retrograde: boolean
  fromLagna: number | null
  fromMoon: number
  until: Date
  next: { sign: number; house: number | null }
  tone: Tone
  lines: string[]
  basis: string[]
}

const houseFrom = (ref: number, sign: number) => ((sign - ref + 12) % 12) + 1
const rashi = (s: number) => RASHI[signName(s)]

/** Reading of a planet in a house from the lagna: its theme, plus whether that house suits it. */
export function houseLine(g: Graha, house: number): { text: string; short: string; weight: number } {
  const malefic = MALEFIC.includes(g)
  let note: string, weight: number
  if (malefic && [3, 6, 10, 11].includes(house)) { note = 'Malefic planets do well in the 3rd, 6th, 10th and 11th houses: effort pays off here.'; weight = 1 }
  else if (malefic && [8, 12].includes(house)) { note = 'This is a difficult house for a malefic transit: expect obstacles or losses and keep plans conservative.'; weight = -1 }
  else if (malefic) { note = 'Expect some pressure on these matters; patience helps.'; weight = -1 }
  else if ([3, 6, 8, 12].includes(house)) { note = 'A benefic in this house gives mixed results.'; weight = 0 }
  else { note = 'A benefic transit here supports these matters.'; weight = 1 }
  const topic = HOUSE_TOPIC[house - 1]
  return { text: `${g} ${THEME[g]} your ${ordinal(house)} house: ${topic}. ${note}`, short: `${topic[0].toUpperCase() + topic.slice(1)}. ${note}`, weight }
}

/** How the natal position of the planet connects with the house it is now crossing. */
export function natalLink(chart: VedicChart, g: Graha, house: number): { full: string; short: string } | null {
  const natal = pos(chart, g).house
  if (!natal) return null
  const a = HOUSE_TOPIC[natal - 1].split(',')[0], b = HOUSE_TOPIC[house - 1].split(',')[0]
  if (natal === house) {
    const t = `At birth ${g} is in this same house, so its natal promise for ${HOUSE_TOPIC[house - 1]} is renewed.`
    return { full: t, short: t }
  }
  return {
    full: `At birth ${g} is in your ${ordinal(natal)} house (${HOUSE_TOPIC[natal - 1]}). While it crosses the ${ordinal(house)}, the two areas are linked: ${a} matters meet ${b}.`,
    short: `With natal ${g} in your ${ordinal(natal)}, ${a} matters meet ${b}.`,
  }
}

export function transitReadings(chart: VedicChart, at: Date, dashas: Period[]): TransitReading[] {
  const positions = transitPositions(chart, at)
  const rows = gochara(chart, at, positions)
  const L = chart.lagnaSign
  const [md, ad] = periodChain(dashas, at, 2)
  const order: Graha[] = ['Saturn', 'Jupiter', 'Rahu', 'Ketu', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon']
  return order.map((g) => {
    const t = positions.find((p) => p.graha === g)!
    const row = rows.find((r) => r.graha === g)!
    const periods = signPeriods(chart, g, at, new Date(at.getTime() + 3 * 365.25 * 86400000))
    const until = periods[0].end
    const nextSign = periods[1]?.sign ?? (t.retrograde ? (t.sign + 11) % 12 : (t.sign + 1) % 12)
    const fromLagna = L === null ? null : houseFrom(L, t.sign)
    const lines: string[] = []
    const basis: string[] = [`${g} in ${signName(t.sign)}`]
    let weight = row.score

    if (fromLagna) {
      const hl = houseLine(g, fromLagna)
      lines.push(hl.text)
      weight += hl.weight
      basis.push(`${ordinal(fromLagna)} from the lagna`)
      if (L !== null && g !== 'Moon') {
        const link = natalLink(chart, g, fromLagna)
        if (link) lines.push(link.full)
        const rules = housesRuledBy(chart, g)
        if (rules.length) lines.push(`${g} rules your ${rules.map(ordinal).join(' and ')} house${rules.length > 1 ? 's' : ''} (${rules.map((h) => HOUSE_TOPIC[h - 1].split(',')[0]).join('; ')}), so those matters are drawn in too.`)
      }
    }
    lines.push(`From the Moon (${ordinal(row.fromMoon)}): ${FROM_MOON[g][row.fromMoon - 1]}.${row.vedhaBy.length ? ` The good effect is blocked (vedha) by ${row.vedhaBy.join(' and ')}.` : ''}`)
    basis.push(`${ordinal(row.fromMoon)} from the Moon`, row.favourable ? (row.vedhaBy.length ? 'blocked by vedha' : 'favourable from the Moon') : 'unfavourable from the Moon')
    if (row.bindus !== null) {
      basis.push(`${row.bindus} Ashtakavarga bindus`)
      if (row.bindus >= 5) lines.push(`${g} has ${row.bindus} of 8 Ashtakavarga bindus in this sign, which strengthens good results.`)
      if (row.bindus <= 2) lines.push(`${g} has only ${row.bindus} of 8 Ashtakavarga bindus in this sign, which weakens it.`)
    }

    if (g !== 'Rahu' && g !== 'Ketu') {
      const d = dignityOf(g, t.sign, t.lon % 30)
      if (d === 'exalted' || d === 'own' || d === 'moolatrikona') { lines.push(`${g} is ${d === 'own' ? 'in its own sign' : d} here, so its results are fuller.`); weight += 0.5; basis.push(d) }
      if (d === 'debilitated') { lines.push(`${g} is debilitated in this sign, so its results are weaker.`); weight -= 0.5; basis.push('debilitated') }
    }

    if (g !== 'Moon') {
      const natalSign = pos(chart, g).sign
      if (t.sign === natalSign && RETURN[g]) lines.push(RETURN[g]!)
      else if (houseFrom(natalSign, t.sign) === 7 && ['Saturn', 'Jupiter', 'Rahu', 'Ketu'].includes(g)) lines.push(`${g} is opposite its birth sign: matters it set in motion at birth come to a point of balance or tension.`)
      lines.push(...contacts(chart, t))
    }

    if (md?.lord === g || ad?.lord === g) {
      lines.push(`${g} is also your running ${md?.lord === g ? 'mahadasha' : 'antardasha'} lord, so this transit is more noticeable now.`)
      basis.push(`${g} dasha running`)
    }
    if (t.retrograde && g !== 'Rahu' && g !== 'Ketu') lines.push(`${g} is retrograde: matters tend to be revisited or delayed.`)

    return {
      graha: g, sign: t.sign, retrograde: t.retrograde, fromLagna, fromMoon: row.fromMoon, until,
      next: { sign: nextSign, house: L === null ? null : houseFrom(L, nextSign) },
      tone: weight >= 1 ? 'good' : weight <= -1 ? 'challenge' : 'mixed',
      lines, basis,
    }
  })
}

/** Conjunctions with natal planets (same sign) and Parashari aspects onto natal planets. */
function contacts(chart: VedicChart, t: TransitPos): string[] {
  const out: string[] = []
  for (const n of chart.grahas) {
    if (n.sign !== t.sign || (t.graha === 'Rahu' && n.graha === 'Ketu') || (t.graha === 'Ketu' && n.graha === 'Rahu')) continue
    const gap = Math.abs(n.lon - t.lon)
    const rules = housesRuledBy(chart, n.graha)
    const special = CONTACT[`${t.graha}>${n.graha}`]
    out.push(`Over your natal ${n.graha}${gap <= 3 ? ` (within ${gap.toFixed(1)}°, strongest now)` : ''}: ${special ?? `${t.graha} ${VERB[t.graha]} ${KARAKA_SHORT[n.graha]}.`}${rules.length ? ` Natal ${n.graha} rules your ${rules.map(ordinal).join(' and ')}.` : ''}`)
  }
  const aspected = chart.grahas.filter((n) => n.sign !== t.sign && aspectedSigns(t.graha, t.sign).includes(n.sign)).map((n) => n.graha)
  if (aspected.length) out.push(`It aspects your natal ${aspected.join(', ')}, which ${aspected.length > 1 ? 'feel' : 'feels'} its influence as well.`)
  return out
}

export interface TransitConjunction { grahas: Graha[]; sign: number; house: number | null; natal: Graha[]; lines: string[] }

/** Transiting planets (Moon excluded) sharing a sign now. */
export function transitConjunctions(chart: VedicChart, at: Date): TransitConjunction[] {
  const positions = transitPositions(chart, at).filter((p) => p.graha !== 'Moon')
  const bySign = new Map<number, Graha[]>()
  for (const p of positions) bySign.set(p.sign, [...(bySign.get(p.sign) ?? []), p.graha])
  return [...bySign.entries()].filter(([, gs]) => gs.length > 1).map(([sign, gs]) => {
    const lines: string[] = []
    for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) {
      const key = [gs[i], gs[j]].sort().join('+')
      if (TOGETHER[key]) lines.push(`${gs[i]} with ${gs[j]}: ${TOGETHER[key]}`)
    }
    if (!lines.length) lines.push(`${gs.join(' and ')} together: their themes combine in this part of the chart.`)
    const house = chart.lagnaSign === null ? null : houseFrom(chart.lagnaSign, sign)
    if (house) lines.push(`This happens in your ${ordinal(house)} house: ${HOUSE_TOPIC[house - 1]}.`)
    const natal = chart.grahas.filter((n) => n.sign === sign).map((n) => n.graha)
    if (natal.length) lines.push(`Your natal ${natal.join(', ')} ${natal.length > 1 ? 'are' : 'is'} in this sign, so ${natal.length > 1 ? 'they are' : 'it is'} directly involved.`)
    return { grahas: gs, sign, house, natal, lines }
  })
}

export interface TimelineRow { sign: number; start: Date; end: Date; retrogradeReturn: boolean; house: number | null; fromMoon: number; text: string; favourableFromMoon: boolean }

/** Saturn, Jupiter and Rahu (with Ketu opposite) sign by sign over the coming years. */
export function slowTimeline(chart: VedicChart, from: Date, years = 10): Record<'Saturn' | 'Jupiter' | 'Rahu', TimelineRow[]> {
  const until = new Date(from.getTime() + years * 365.25 * 86400000)
  const moonSign = pos(chart, 'Moon').sign
  const GOOD: Record<string, number[]> = { Saturn: [3, 6, 11], Jupiter: [2, 5, 7, 9, 11], Rahu: [3, 6, 11] }
  const row = (g: 'Saturn' | 'Jupiter' | 'Rahu') => signPeriods(chart, g, from, until).map((p) => {
    const house = chart.lagnaSign === null ? null : houseFrom(chart.lagnaSign, p.sign)
    const fromMoon = houseFrom(moonSign, p.sign)
    let text = house ? houseLine(g, house).short : `${g} ${THEME[g]} the ${ordinal(fromMoon)} from your Moon.`
    if (house) {
      const link = natalLink(chart, g, house)
      if (link) text += ` ${link.short}`
    }
    if (g === 'Rahu') {
      const ketu = (p.sign + 6) % 12
      text += ` Ketu is opposite in ${rashi(ketu)}${chart.lagnaSign === null ? '' : `, your ${ordinal(houseFrom(chart.lagnaSign, ketu))} house (${HOUSE_TOPIC[houseFrom(chart.lagnaSign, ketu) - 1].split(',')[0]})`}.`
    }
    return { sign: p.sign, start: p.start, end: p.end, retrogradeReturn: p.retrogradeReturn, house, fromMoon, text: text.trim(), favourableFromMoon: GOOD[g].includes(fromMoon) }
  })
  return { Saturn: row('Saturn'), Jupiter: row('Jupiter'), Rahu: row('Rahu') }
}
