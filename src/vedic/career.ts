import { BHAVA, KENDRA, RASHI, SIGN_LORD, type Graha } from './constants'
import {
  GOOD_DIGNITY, aspectors, describeLord, dignityPhrase, dignityScore, h, houseGroup, influencesHouse, isBenefic, linked,
  lordOfHouse, occupants, pos,
} from './query'
import {
  Evidence, countConditions, areaTiming, effectOf, rule, shadbalaNote, vargaVerdict, weigh, yogaRule,
  type AreaReport, type RuleResult, type VargaVerdict, type Weights,
} from './rules'
import { signName, vargaChart, type VargaChart, type VedicChart } from './sidereal'
import { charaKarakas } from './jaimini'
import { vimshottari, type Period } from './dasha'
import { evaluateYogas, type YogaResult } from './yogas'

export const PLANET_CAREERS: Record<Graha, string[]> = {
  Sun: ['Government and public administration', 'Politics and leadership', 'Medicine (especially cardiology)', 'Executive management', 'Defence leadership', 'Energy, power and gold'],
  Moon: ['Nursing, healthcare and caregiving', 'Hospitality, food and catering', 'Psychology and counselling', 'Public relations and customer-facing roles', 'Shipping, import/export and travel', 'Dairy, agriculture, water and liquids', 'Retail and public sales'],
  Mars: ['Engineering (mechanical, civil, electrical)', 'Army, police and security', 'Surgery and dentistry', 'Sports and fitness', 'Real estate and construction', 'Manufacturing and machinery', 'Metals, chemicals and fire services'],
  Mercury: ['Commerce, trade and accounting', 'Software, IT and data', 'Writing, journalism and media', 'Teaching and training', 'Marketing, sales and advertising', 'Consulting and analysis', 'Banking operations and audit'],
  Jupiter: ['Teaching, academia and research', 'Law and the judiciary', 'Finance, banking and investment advice', 'Religious, spiritual and charitable work', 'Counselling and mentoring', 'Senior advisory roles', 'Publishing'],
  Venus: ['Arts, music, film and entertainment', 'Fashion, design and beauty', 'Luxury goods, jewellery and cosmetics', 'Hotels, hospitality and travel', 'Interior design and architecture', 'Automobiles and vehicles', 'Wedding and event services'],
  Saturn: ['Manufacturing, mining and heavy industry', 'Oil, gas and infrastructure', 'Judicial and regulatory administration', 'HR, labour and social services', 'Agriculture and land-based work', 'Logistics, operations and public works', 'History, archaeology and elder care'],
  Rahu: ['Technology, AI and electronics', 'Multinational and foreign companies', 'Aviation and space', 'Mass media and film', 'Pharmaceutical and chemical research', 'Politics and large-scale influence', 'New and unconventional fields'],
  Ketu: ['Research and investigation', 'Programming, mathematics and precise technical work', 'Astrology, spirituality and occult sciences', 'Alternative medicine and healing', 'Languages and ancient knowledge', 'Niche specialist expertise'],
}

/** Results of the 10th lord in each house, after Phaladeepika and common Parashari practice. */
const TENTH_LORD_IN: string[] = [
  'A self-made career built on personal ability and name; leadership or own enterprise.',
  'Career linked to finance, banking, family business, food, speech or teaching.',
  'Career through communication, media, writing, sales, travel or skilled hands-on work; self-effort drives it.',
  'Career linked to property, vehicles, education, agriculture or work from home; stability at work matters.',
  'Career through intelligence and creativity: education, advisory, entertainment, investment or politics.',
  'Career in service and competition: employment, healthcare, law, defence or problem-solving roles.',
  'Career through partnerships, clients and trade; business and public dealings are favoured.',
  'Career in research, investigation, insurance, taxation, surgery or mining; sudden changes in direction.',
  'Career in teaching, law, religion, philosophy, publishing or long-distance travel; mentors help.',
  'A strong, self-directed career with authority and visibility. The 10th lord in its own house is a classical mark of professional success.',
  'A career that brings strong gains: large organisations, networks, finance or technology.',
  'Career linked to foreign countries, multinationals, hospitals, research institutions or work behind the scenes.',
]

const IN_TENTH: Record<Graha, string> = {
  Sun: 'Sun in the 10th has directional strength: authority, government connections, leadership and a visible public role.',
  Moon: 'Moon in the 10th gives a public-facing career, popularity and changes of role.',
  Mars: 'Mars in the 10th has directional strength: drive, command, technical or engineering ability and ambition.',
  Mercury: 'Mercury in the 10th gives a career based on intellect: commerce, communication, analysis or technology.',
  Jupiter: 'Jupiter in the 10th gives a respected, ethical profession in teaching, advisory work, law or finance.',
  Venus: 'Venus in the 10th favours the arts, design, luxury, hospitality and client-facing roles.',
  Saturn: 'Saturn in the 10th gives a slow but lasting rise through hard work in large organisations; authority comes with age.',
  Rahu: 'Rahu in the 10th gives strong ambition and sudden rises, often in technology, foreign or unconventional fields.',
  Ketu: 'Ketu in the 10th gives specialised technical or spiritual work and detachment from titles; the path is re-evaluated often.',
}

export interface FieldSuggestion { planet: Graha; score: number; fields: string[]; reasons: string[] }
export type ModeStrength = 'strong' | 'moderate' | 'weak' | 'none'
/** A dasha period ruled by a planet that carries a mode of work. `ad` is absent for a whole mahadasha. */
export interface ModePeriod { md: Graha; ad?: Graha; start: Date; end: Date; now: boolean }
export interface ModeScore {
  label: string
  score: number
  /** Indicators that apply. */
  reasons: string[]
  /** All five indicators, met or not. */
  checks: { text: string; met: boolean }[]
  strength: ModeStrength
  /** Planets that carry this mode, whose dashas bring it forward. */
  planets: Graha[]
  periods: ModePeriod[]
}
export interface ModeVerdict { best: string[]; least: string[]; strength: ModeStrength; text: string }

/** Five indicators per mode: three or more is a clear lean, two moderate, one on its own is weak. */
export const modeStrength = (n: number): ModeStrength => (n >= 3 ? 'strong' : n === 2 ? 'moderate' : n === 1 ? 'weak' : 'none')

export interface CareerReport extends AreaReport {
  fields: FieldSuggestion[]
  modes: ModeScore[]
  modeVerdict: ModeVerdict
}

export function careerReport(chart: VedicChart, now = new Date(), yogas: YogaResult[] = evaluateYogas(chart)): CareerReport | null {
  if (chart.lagnaSign === null) return null
  const L = chart.lagnaSign
  const moon = pos(chart, 'Moon'), sun = pos(chart, 'Sun')
  const d9 = vargaChart(chart, 9), d10 = vargaChart(chart, 10)
  const vp = (vc: VargaChart, g: Graha) => vc.placements.find((p) => p.graha === g)!
  const tenthLord = lordOfHouse(chart, 10)
  const tl = pos(chart, tenthLord)
  const amk = charaKarakas(chart).Amatyakaraka!
  const ev = new Evidence()

  const g1: RuleResult[] = []
  const tq = houseGroup(tl.house!)
  const tsb = shadbalaNote(chart, tenthLord)
  const tw = dignityScore(tl.dignity) + tsb.adjust
  g1.push(rule({
    id: 'c-10lord-dignity', group: '10th house', chart: 'D1', title: `10th lord ${tenthLord} is ${dignityPhrase(tl.dignity)}`,
    effect: effectOf(tw, 0.5), weight: tw,
    detail: [`${describeLord(chart, 10, tenthLord)}. The strength of the career lord shows how easily professional matters progress.`, ...tsb.text],
    rule: 'Dignity and Shadbala of the 10th lord (BPHS: a strong karmesha gives a successful profession)',
  }))
  g1.push(rule({
    id: 'c-10lord-house', group: '10th house', chart: 'D1', title: `10th lord in the ${h(tl.house!)}`,
    effect: tq === 'dusthana' && tl.house !== 6 ? 'challenging' : tq === 'kendra' || tq === 'trikona' || tl.house === 11 ? 'supportive' : 'mixed',
    weight: tq === 'kendra' || tq === 'trikona' || tl.house === 11 ? 2 : tq === 'dusthana' ? (tl.house === 6 ? 0 : -1.5) : 0.5,
    detail: [TENTH_LORD_IN[tl.house! - 1]],
    rule: 'House placement of the 10th lord',
  }))
  ev.add(tenthLord, 3, 'Lord of the 10th house in D1')

  const occ10 = occupants(chart, 10)
  g1.push(rule({
    id: 'c-10-occupants', group: '10th house', chart: 'D1', fired: occ10.length > 0,
    title: occ10.length ? `Planets in the 10th: ${occ10.join(', ')}` : 'No planets in the 10th house',
    effect: occ10.length ? 'supportive' : 'info', weight: occ10.reduce((s, g) => s + (isBenefic(g) || ['Sun', 'Mars', 'Saturn', 'Rahu'].includes(g) ? 1 : 0.3), 0),
    detail: occ10.length ? occ10.map((g) => IN_TENTH[g]) : ['An empty 10th is common. The career is then judged from the 10th lord and aspects.'],
    rule: 'Occupants of the 10th house; malefics also do well in the 10th (an upachaya)',
  }))
  occ10.forEach((g) => ev.add(g, 2.5, 'Placed in the 10th house'))

  const asp10 = aspectors(chart, 10)
  const benAsp = asp10.filter(isBenefic), malAsp = asp10.filter((g) => !isBenefic(g))
  g1.push(rule({
    id: 'c-10-drishti', group: '10th house', chart: 'D1', fired: asp10.length > 0,
    title: asp10.length ? `Aspects on the 10th from ${asp10.join(', ')}` : 'No aspects on the 10th',
    effect: benAsp.length && !malAsp.length ? 'supportive' : asp10.length ? 'mixed' : 'info',
    weight: benAsp.length * 0.8 + malAsp.filter((g) => g === 'Saturn' || g === 'Mars').length * 0.3,
    detail: [
      ...(benAsp.length ? [`${benAsp.join(' and ')} ${benAsp.length > 1 ? 'support' : 'supports'} the career through drishti.`] : []),
      ...(malAsp.length ? [`${malAsp.join(' and ')} ${malAsp.length > 1 ? 'add' : 'adds'} pressure and drive. Malefic aspects on the 10th usually mean achievement through hard work.`] : []),
    ],
    rule: 'Parashari drishti on the 10th house',
  }))
  asp10.forEach((g) => ev.add(g, 1, 'Aspects the 10th house'))

  for (const [ref, refSign] of [['Moon', moon.sign], ['Sun', sun.sign]] as const) {
    const l = SIGN_LORD[(refSign + 9) % 12]
    const lp = pos(chart, l)
    const occ = occupants(chart, 10, refSign)
    g1.push(rule({
      id: `c-10-from-${ref}`, group: '10th house', chart: 'D1',
      title: `10th from the ${ref}: ${RASHI[signName((refSign + 9) % 12)]}, lord ${l}`,
      effect: effectOf(dignityScore(lp.dignity)), weight: dignityScore(lp.dignity) * 0.4,
      detail: [`Counted from the ${ref}, the career lord is ${l}, ${dignityPhrase(lp.dignity)} in ${signName(lp.sign)}.${occ.length ? ` Occupied by ${occ.join(', ')}.` : ''}`],
      rule: `10th house counted from the ${ref} (Phaladeepika 5)`,
    }))
    ev.add(l, ref === 'Moon' ? 1.5 : 1, `Lord of the 10th from the ${ref}`)
    occ.forEach((g) => ev.add(g, 1, `In the 10th from the ${ref}`))
  }

  const g2: RuleResult[] = []
  for (const [ref, refSign] of [['Lagna', L], ['Moon', moon.sign], ['Sun', sun.sign]] as const) {
    const lord = SIGN_LORD[(refSign + 9) % 12]
    const navSign = vp(d9, lord).sign
    const disp = SIGN_LORD[navSign]
    g2.push(rule({
      id: `c-navamsa-${ref}`, group: 'Source of livelihood', chart: 'D1 + D9',
      title: `From the ${ref}: 10th lord ${lord} in ${RASHI[signName(navSign)]} navamsa, ruled by ${disp}`,
      detail: [`The lord of the navamsa occupied by the 10th lord shows the source of earnings. Here it is ${disp}: ${PLANET_CAREERS[disp].slice(0, 3).join('; ')}.`],
      rule: 'Phaladeepika 5.1-2: navamsa dispositor of the 10th lord from lagna, Moon and Sun',
    }))
    ev.add(disp, ref === 'Lagna' ? 3 : 1.5, `Navamsa dispositor of the 10th lord from the ${ref}`)
  }
  const amkP = pos(chart, amk), amkD10 = vp(d10, amk)
  const amkW = (dignityScore(amkP.dignity) + dignityScore(amkD10.dignity)) * 0.4
  g2.push(rule({
    id: 'c-amk', group: 'Source of livelihood', chart: 'D1 + D10', title: `Amatyakaraka: ${amk}`,
    effect: amkW > 0 ? 'supportive' : 'mixed', weight: amkW,
    detail: [
      `In Jaimini astrology the planet with the second-highest degree is the Amatyakaraka, the significator of career. ${amk} is ${dignityPhrase(amkP.dignity)} in D1 (${h(amkP.house!)}) and ${dignityPhrase(amkD10.dignity)} in D10 (${h(amkD10.house!)}).`,
      `Fields associated with ${amk}: ${PLANET_CAREERS[amk].slice(0, 4).join('; ')}.`,
    ],
    rule: 'Jaimini chara karaka: second-highest degree = Amatyakaraka',
  }))
  ev.add(amk, 2.5, 'Amatyakaraka (Jaimini career significator)')
  const sat = pos(chart, 'Saturn')
  g2.push(rule({
    id: 'c-saturn', group: 'Source of livelihood', chart: 'D1', title: `Saturn, karaka of work, is ${dignityPhrase(sat.dignity)} in the ${h(sat.house!)}`,
    effect: dignityScore(sat.dignity) > 0 || [3, 6, 10, 11].includes(sat.house!) ? 'supportive' : dignityScore(sat.dignity) < 0 ? 'challenging' : 'mixed',
    weight: dignityScore(sat.dignity) * 0.5 + ([3, 6, 10, 11].includes(sat.house!) ? 1 : 0),
    detail: ['Saturn is the natural significator of work and perseverance. A strong Saturn gives stamina and a long, stable career.'],
    rule: 'Natural karaka of the 10th house: Saturn, with the Sun, Mercury and Jupiter',
  }))

  const g3: RuleResult[] = []
  if (d10.lagnaSign !== null) {
    const dl = SIGN_LORD[d10.lagnaSign], dlp = vp(d10, dl)
    const d10tl = SIGN_LORD[(d10.lagnaSign + 9) % 12], d10tlp = vp(d10, d10tl)
    const occD10 = d10.placements.filter((p) => p.house === 10).map((p) => p.graha)
    const kendraD10 = d10.placements.filter((p) => KENDRA.includes(p.house!)).map((p) => p.graha)
    const good = (x: number) => KENDRA.includes(x) || [5, 9, 11].includes(x)
    const bad = (x: number) => [6, 8, 12].includes(x)
    g3.push(rule({
      id: 'c-d10-lagna', group: 'Dasamsa (D10)', chart: 'D10', title: `D10 lagna ${RASHI[signName(d10.lagnaSign)]}, lord ${dl} in the ${h(dlp.house!)}`,
      effect: dignityScore(dlp.dignity) > 0 || KENDRA.includes(dlp.house!) ? 'supportive' : dlp.dignity === 'debilitated' || bad(dlp.house!) ? 'challenging' : 'mixed',
      weight: dignityScore(dlp.dignity) * 0.6 + (good(dlp.house!) ? 1 : bad(dlp.house!) ? -1 : 0),
      detail: [`The D10 lagna shows the professional persona. Its lord in the ${h(dlp.house!)} directs career effort towards ${BHAVA[dlp.house! - 1].topics}.`],
      rule: 'D10 lagna lord placement and dignity',
    }))
    ev.add(dl, 1.5, 'D10 lagna lord')
    g3.push(rule({
      id: 'c-d10-10lord', group: 'Dasamsa (D10)', chart: 'D10', title: `D10 10th lord ${d10tl} is ${dignityPhrase(d10tlp.dignity)} in the ${h(d10tlp.house!)}`,
      effect: dignityScore(d10tlp.dignity) > 0 || good(d10tlp.house!) ? 'supportive' : bad(d10tlp.house!) || d10tlp.dignity === 'debilitated' ? 'challenging' : 'mixed',
      weight: dignityScore(d10tlp.dignity) * 0.8 + (good(d10tlp.house!) ? 1.5 : bad(d10tlp.house!) ? -1.5 : 0),
      detail: [`Within the career chart, the 10th lord shows how far the profession rises. ${TENTH_LORD_IN[d10tlp.house! - 1]}`],
      rule: 'D10 10th lord placement and dignity',
    }))
    ev.add(d10tl, 2, 'D10 10th lord')
    g3.push(rule({
      id: 'c-d10-occ', group: 'Dasamsa (D10)', chart: 'D10', fired: occD10.length > 0,
      title: occD10.length ? `D10 10th house holds ${occD10.join(', ')}` : 'D10 10th house is empty',
      effect: occD10.length ? 'supportive' : 'info', weight: occD10.length ? 1 : 0,
      detail: occD10.length ? [`Planets in the 10th of D10 colour the profession: ${occD10.map((g) => `${g} (${PLANET_CAREERS[g][0]})`).join('; ')}.`] : ['The D10 10th lord carries the career story.'],
      rule: 'Occupants of the 10th house in D10',
    }))
    occD10.forEach((g) => ev.add(g, 2, 'In the 10th house of D10'))
    kendraD10.filter((g) => !occD10.includes(g)).forEach((g) => ev.add(g, 0.7, 'In a kendra of D10'))
    const d10strong = d10.placements.filter((p) => p.dignity && GOOD_DIGNITY.includes(p.dignity)).map((p) => p.graha)
    const d10weak = d10.placements.filter((p) => p.dignity === 'debilitated').map((p) => p.graha)
    g3.push(rule({
      id: 'c-d10-strength', group: 'Dasamsa (D10)', chart: 'D10', fired: d10strong.length + d10weak.length > 0,
      title: `D10 strong: ${d10strong.join(', ') || 'none'} · weak: ${d10weak.join(', ') || 'none'}`,
      effect: d10strong.length > d10weak.length ? 'supportive' : d10weak.length > d10strong.length ? 'challenging' : 'mixed',
      weight: (d10strong.length - d10weak.length) * 0.6,
      detail: ['Planets in their own or exaltation signs in D10 give professional success in their dashas; debilitated ones bring setbacks in their periods unless supported.'],
      rule: 'Sign dignity of all planets in D10',
    }))
    d10strong.forEach((g) => ev.add(g, 1, 'Own or exaltation sign in D10'))
    const tlD10 = vp(d10, tenthLord)
    g3.push(rule({
      id: 'c-d1-d10-link', group: 'Dasamsa (D10)', chart: 'D1 + D10', title: `D1 10th lord ${tenthLord} in D10: ${dignityPhrase(tlD10.dignity)}, ${h(tlD10.house!)}`,
      effect: dignityScore(tlD10.dignity) > 0 || KENDRA.includes(tlD10.house!) ? 'supportive' : tlD10.dignity === 'debilitated' || bad(tlD10.house!) ? 'challenging' : 'mixed',
      weight: dignityScore(tlD10.dignity) * 0.5 + (KENDRA.includes(tlD10.house!) ? 0.8 : 0),
      detail: ['The D1 career lord should also be well placed in D10 for the D1 promise to be fully delivered.'],
      rule: 'D1 10th lord re-examined in D10',
    }))
  }

  const g4: RuleResult[] = [
    yogaRule(yogas, 'dharma-karma', 'Career yogas', 3),
    yogaRule(yogas, 'amala', 'Career yogas', 1.5),
    ...['mp-ruchaka', 'mp-bhadra', 'mp-hamsa', 'mp-malavya', 'mp-shasha'].map((id) => yogaRule(yogas, id, 'Career yogas', 2)),
    yogaRule(yogas, 'jaimini-raja', 'Career yogas', 1.5),
  ]
  for (const y of yogas.filter((r) => r.present && r.def.id.startsWith('mp-'))) {
    const g = (['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as Graha[]).find((x) => y.matches[0].basis[0].startsWith(x))!
    ev.add(g, 2, `Forms ${y.def.name}`)
  }
  const rajaWith10: string[] = []
  for (const t of [1, 5]) {
    const tlord = lordOfHouse(chart, t)
    const how = linked(chart, tenthLord, tlord)
    if (how && tlord !== tenthLord) rajaWith10.push(`${t === 1 ? '1st' : '5th'} lord ${tlord} (${how})`)
  }
  g4.push(rule({
    id: 'c-raja-10', group: 'Career yogas', chart: 'D1', fired: rajaWith10.length > 0, title: 'Raja yoga with the 10th lord',
    effect: 'supportive', weight: 1.5 * rajaWith10.length,
    detail: [`The 10th lord is linked with ${rajaWith10.join('; ')}. Kendra-trikona links raise status.`],
    rule: '10th lord linked with the 1st or 5th lord',
  }))
  const l11 = lordOfHouse(chart, 11)
  g4.push(rule({
    id: 'c-10-11', group: 'Career yogas', chart: 'D1', fired: tl.house === 11 || pos(chart, l11).house === 10 || !!linked(chart, tenthLord, l11),
    title: 'Career and gains linked (10th and 11th)', effect: 'supportive', weight: 1.5,
    detail: ['The career lord and the lord of gains are connected, so professional effort turns into income.'],
    rule: '10th lord in the 11th, 11th lord in the 10th, or the two lords linked',
  }))
  g4.push(rule({
    id: 'c-budhaditya-10', group: 'Career yogas', chart: 'D1', fired: sun.sign === pos(chart, 'Mercury').sign && [1, 10].includes(sun.house!),
    title: 'Budhaditya yoga in the 1st or 10th', effect: 'supportive', weight: 1,
    detail: ['Sun and Mercury together in an angle connected with career: good for administration, analysis and advisory roles.'],
    rule: 'Sun and Mercury together in the 1st or 10th house',
  }))
  const tlDusthana = [6, 8, 12].includes(tl.house!) && !(tl.dignity && GOOD_DIGNITY.includes(tl.dignity))
  g4.push(rule({
    id: 'c-10lord-weak', group: 'Career yogas', chart: 'D1', fired: tlDusthana || tl.combust, title: 'Career lord under strain', effect: 'challenging', weight: -1.5,
    detail: [`${tenthLord}${tl.combust ? ' is combust' : ''}${tlDusthana ? `${tl.combust ? ' and' : ''} sits in the ${h(tl.house!)}, a dusthana` : ''}. The career is built through obstacles, changes or service before it stabilises. Strength in D10 or the dashas can offset this.`],
    rule: '10th lord in the 6th, 8th or 12th without dignity, or combust',
  }))

  const modes: ModeScore[] = []
  const periods = vimshottari(moon.lon, chart.utc)
  const mode = (label: string, planets: Graha[], checks: [boolean, string][]) => {
    const fired = checks.filter(([ok]) => ok).map(([, r]) => r)
    const carriers = [...new Set(planets)]
    modes.push({
      label, score: Math.round((fired.length / checks.length) * 100), reasons: fired,
      checks: checks.map(([met, text]) => ({ text, met })), strength: modeStrength(fired.length),
      planets: carriers, periods: modePeriods(periods, carriers, now),
    })
  }
  const l7 = lordOfHouse(chart, 7), l6 = lordOfHouse(chart, 6), l1 = lordOfHouse(chart, 1), l12 = lordOfHouse(chart, 12)
  const p7 = pos(chart, l7), p1 = pos(chart, l1), merc = pos(chart, 'Mercury')
  mode('Business or trade', [l7, 'Mercury'], [
    [!!linked(chart, l7, tenthLord) || tl.house === 7, `7th lord ${l7} linked with the 10th lord, or 10th lord in the 7th`],
    [KENDRA.includes(p7.house!) || [5, 9, 11].includes(p7.house!), `7th lord ${l7} well placed (${h(p7.house!)})`],
    [dignityScore(merc.dignity) >= 1 || KENDRA.includes(merc.house!), 'Mercury strong or in a kendra'],
    [!!influencesHouse(chart, 'Mercury', 10) || !!influencesHouse(chart, 'Mercury', 7), 'Mercury influences the 10th or 7th'],
    [occupants(chart, 7).some(isBenefic), 'Benefic in the 7th house'],
  ])
  mode('Employment', [l6, 'Saturn'], [
    [!!linked(chart, l6, tenthLord) || tl.house === 6, `6th lord ${l6} linked with the 10th lord, or 10th lord in the 6th`],
    [!!influencesHouse(chart, 'Saturn', 10), 'Saturn influences the 10th'],
    [pos(chart, l6).house === 10, '6th lord in the 10th'],
    [[6, 8, 12].includes(tl.house!), '10th lord in a dusthana'],
    [!(KENDRA.includes(p1.house!) && dignityScore(p1.dignity) > 0), 'Lagna lord not dominant'],
  ])
  mode('Government or public sector', ['Sun', 'Jupiter'], [
    [!!influencesHouse(chart, 'Sun', 10), 'Sun occupies or aspects the 10th'],
    [dignityScore(sun.dignity) >= 2 || sun.house === 10, 'Sun strong (own, exalted or dig bala)'],
    [!!linked(chart, 'Sun', tenthLord) || tenthLord === 'Sun', 'Sun linked with the 10th lord'],
    [!!influencesHouse(chart, 'Jupiter', 10), 'Jupiter influences the 10th'],
    [!!vp(d10, 'Sun').dignity && GOOD_DIGNITY.includes(vp(d10, 'Sun').dignity!), 'Sun strong in D10'],
  ])
  mode('Foreign or multinational', ['Rahu', l12], [
    [[12, 9].includes(tl.house!), '10th lord in the 12th or 9th'],
    [!!influencesHouse(chart, 'Rahu', 10) || !!linked(chart, 'Rahu', tenthLord), 'Rahu influences the 10th or its lord'],
    [pos(chart, l12).house === 10 || !!linked(chart, l12, tenthLord), `12th lord ${l12} linked with the career`],
    [[0, 3, 6, 9].includes((L + 9) % 12), 'Movable sign on the 10th'],
    [moon.house === 12 || moon.house === 9, 'Moon in the 9th or 12th'],
  ])
  mode('Own venture', [l1, 'Mars'], [
    [KENDRA.includes(p1.house!) && dignityScore(p1.dignity) >= 0, `Lagna lord ${l1} strong in a kendra`],
    [!!linked(chart, l1, tenthLord) || tl.house === 1, 'Lagna lord linked with the 10th lord, or 10th lord in the 1st'],
    [!!influencesHouse(chart, 'Mars', 10) || !!influencesHouse(chart, 'Sun', 1), 'Mars on the 10th or Sun on the 1st'],
    [pos(chart, lordOfHouse(chart, 3)).house === 10 || tl.house === 3, '3rd lord (self-effort) linked with the 10th'],
    [!!linked(chart, l7, l1), 'Lagna lord linked with the 7th lord (clients)'],
  ])

  const vargas: VargaVerdict[] = [
    vargaVerdict(chart, 1, 10, 'Rashi', 'career promise'),
    vargaVerdict(chart, 10, 10, 'Dasamsa', 'profession and status'),
    vargaVerdict(chart, 9, 10, 'Navamsa', 'inner strength of the career lord'),
    vargaVerdict(chart, 2, 2, 'Hora', 'earning capacity'),
    vargaVerdict(chart, 3, 3, 'Drekkana', 'initiative and self-effort'),
  ].filter((v): v is VargaVerdict => v !== null)

  const fields: FieldSuggestion[] = ev.ranked(4).map((f) => ({ ...f, fields: PLANET_CAREERS[f.planet] }))

  const weights: Weights = {}
  weigh(weights, tenthLord, 3, '10th lord (career)')
  occ10.forEach((g) => weigh(weights, g, 2.5, 'placed in the 10th'))
  weigh(weights, amk, 2, 'Amatyakaraka (career significator)')
  weigh(weights, l11, 1.5, '11th lord (gains)')
  fields.slice(0, 2).forEach((f) => weigh(weights, f.planet, 1.5, 'top career significator'))
  const timing = areaTiming(chart, 10, weights, now)

  const groups = [
    { title: 'The 10th house from the lagna, Moon and Sun', results: g1 },
    { title: 'Sources of livelihood', results: g2 },
    { title: 'Dasamsa (D10)', results: g3 },
    { title: 'Career yogas and obstacles', results: g4 },
  ]
  const top = fields[0]
  const headline = top
    ? `The strongest indications point to ${top.planet}-ruled fields (${top.fields.slice(0, 2).join(', ').toLowerCase()}). The 10th lord ${tenthLord} is in the ${h(tl.house!)}.`
    : `The 10th lord ${tenthLord} in the ${h(tl.house!)} shapes the career.`
  return { conditions: countConditions(groups), headline, fields, modes, modeVerdict: verdictOf(modes), groups, vargas, ...timing }
}

/**
 * Upcoming dashas that bring a mode forward: whole mahadashas of its planets,
 * then sub-periods of its planets inside other mahadashas. The nearest three are kept.
 */
export function modePeriods(periods: Period[], planets: Graha[], from: Date, years = 15): ModePeriod[] {
  const until = new Date(from.getTime() + years * 365.25 * 86400000)
  const out: ModePeriod[] = []
  for (const md of periods) {
    if (md.end < from || md.start > until) continue
    if (planets.includes(md.lord)) {
      out.push({ md: md.lord, start: md.start, end: md.end, now: md.start <= from && from < md.end })
      continue
    }
    for (const ad of md.sub ?? []) {
      if (ad.end < from || ad.start > until || !planets.includes(ad.lord)) continue
      out.push({ md: md.lord, ad: ad.lord, start: ad.start, end: ad.end, now: ad.start <= from && from < ad.end })
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime()).slice(0, 3)
}

function verdictOf(modes: ModeScore[]): ModeVerdict {
  const top = Math.max(...modes.map((m) => m.reasons.length))
  const best = modes.filter((m) => m.reasons.length === top).map((m) => m.label)
  const least = modes.filter((m) => m.reasons.length === 0).map((m) => m.label)
  const strength = modeStrength(top)
  const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]).toLowerCase()
  const text = top >= 2
    ? `${best.length > 1 ? `${list(best)} are` : `${list(best)} is`} the clearest fit, with ${top} of its 5 indicators${best.length > 1 ? ' each' : ''} (${strength}).`
    : 'No way of working stands out: none has more than one of its five indicators. Let the fields and the timing guide the choice more than the mode.'
  return { best, least, strength, text: text.charAt(0).toUpperCase() + text.slice(1) }
}
