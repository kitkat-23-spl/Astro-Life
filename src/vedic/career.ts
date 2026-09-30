import { BHAVA, GRAHAS, KENDRA, RASHI, SEVEN, SIGN_LORD, type Graha } from './constants'
import { vimshottari, type Period } from './dasha'
import {
  GOOD_DIGNITY, areaScore, aspectors, dashaHighlights, describeLord, dignityPhrase, dignityScore, h, houseQuality,
  influencesHouse, isBenefic, linked, occupants, rule, type DashaHighlight, type RuleResult,
} from './rules'
import { signName, vargaChart, type VargaChart, type VedicChart } from './sidereal'
import { charaKarakas, doubleTransitWindows, lordOfHouse, pos, type TransitWindow } from './techniques'

export const PLANET_CAREERS: Record<Graha, string[]> = {
  Sun: ['Government & public administration', 'Politics & leadership', 'Medicine (especially cardiology)', 'Executive management', 'Defence leadership', 'Energy, power & gold'],
  Moon: ['Nursing, healthcare & caregiving', 'Hospitality, food & catering', 'Psychology & counselling', 'Public relations & customer-facing roles', 'Shipping, import/export & travel', 'Dairy, agriculture, water & liquids', 'Retail & public sales'],
  Mars: ['Engineering (mechanical, civil, electrical)', 'Army, police & security', 'Surgery & dentistry', 'Sports & fitness', 'Real estate & construction', 'Manufacturing & machinery', 'Metals, chemicals & fire services'],
  Mercury: ['Commerce, trade & accounting', 'Software, IT & data', 'Writing, journalism & media', 'Teaching & training', 'Marketing, sales & advertising', 'Consulting & analysis', 'Banking operations & audit'],
  Jupiter: ['Teaching, academia & research guidance', 'Law & judiciary', 'Finance, banking & investment advisory', 'Religious, spiritual & charitable work', 'Counselling & mentoring', 'Senior advisory roles', 'Publishing knowledge'],
  Venus: ['Arts, music, film & entertainment', 'Fashion, design & beauty', 'Luxury goods, jewellery & cosmetics', 'Hotels, hospitality & travel experiences', 'Interior design & architecture', 'Automobiles & vehicles', 'Wedding & event services'],
  Saturn: ['Manufacturing, mining & heavy industry', 'Oil, gas & infrastructure', 'Judicial & regulatory administration', 'HR, labour & social services', 'Agriculture & land-based work', 'Logistics, operations & public works', 'History, archaeology & elder care'],
  Rahu: ['Technology, AI & electronics', 'Multinational & foreign companies', 'Aviation & space', 'Mass media & film', 'Pharmaceuticals & chemical research', 'Politics & large-scale influence', 'Unconventional & emerging fields'],
  Ketu: ['Research & investigation', 'Programming, mathematics & precise technical work', 'Astrology, spirituality & occult sciences', 'Alternative medicine & healing', 'Languages & ancient knowledge', 'Niche specialist expertise'],
}

const TENTH_LORD_IN: string[] = [
  'A self-made career built on your personality and name; leadership or entrepreneurship.',
  'Career linked to finance, banking, family business, food, voice, speech or teaching.',
  'Career through communication, media, writing, sales, marketing, travel or skilled hands-on work; self-effort is the engine.',
  'Career linked to real estate, vehicles, education, agriculture or home-based work; stability and comfort at work matter.',
  'Career through intelligence and creativity: education, advisory, entertainment, investment, politics or work with children.',
  'Career in service and competition: employment, healthcare, law, defence or problem-solving roles; you excel against rivals.',
  'Career through partnerships, clients and trade; business ownership and public dealings are favoured.',
  'Career in research, investigation, insurance, taxation, surgery, mining or crisis work; expect sudden turns that transform your path.',
  'Career linked to teaching, law, religion, philosophy, publishing or long-distance travel; mentors open doors.',
  'A strong, self-directed career with authority and visibility; the 10th lord in its own house is a classic mark of professional success.',
  'Career brings strong gains: large organisations, networks, finance, technology or social enterprises.',
  'Career linked to foreign lands, multinationals, hospitals, research institutions, export or behind-the-scenes work.',
]

const IN_TENTH: Record<Graha, string> = {
  Sun: 'The Sun in the 10th has directional strength: authority, government favour, leadership and a visible public role.',
  Moon: 'The Moon in the 10th gives a public-facing career, popularity and changes of role; you do well with people and the public.',
  Mars: 'Mars in the 10th has directional strength: drive, command, technical or engineering ability and competitive ambition.',
  Mercury: 'Mercury in the 10th gives an intellect-driven career in commerce, communication, analysis or technology.',
  Jupiter: 'Jupiter in the 10th gives a respected, ethical profession in teaching, advisory, law or finance, and trust from superiors.',
  Venus: 'Venus in the 10th brings charm at work and success in the arts, design, luxury, hospitality or client-facing roles.',
  Saturn: 'Saturn in the 10th gives slow but lasting rise through hard work, large organisations, service and responsibility; authority comes with age.',
  Rahu: 'Rahu in the 10th gives ambition and a sudden rise, often in technology, foreign or unconventional fields, with strong hunger for status.',
  Ketu: 'Ketu in the 10th gives specialised technical or spiritual work, and some detachment from titles; frequent re-evaluation of your path.',
}

export interface FieldSuggestion { planet: Graha; score: number; fields: string[]; reasons: string[] }
export interface ModeScore { label: string; score: number; reasons: string[] }
export interface VargaVerdict { code: string; name: string; focus: string; verdict: 'strong' | 'moderate' | 'weak'; detail: string }

export interface CareerReport {
  score: number
  headline: string
  fields: FieldSuggestion[]
  modes: ModeScore[]
  groups: { title: string; results: RuleResult[] }[]
  vargas: VargaVerdict[]
  dashas: DashaHighlight[]
  windows: TransitWindow[]
  significators: Graha[]
}

export function careerReport(chart: VedicChart, now = new Date()): CareerReport | null {
  if (chart.lagnaSign === null) return null
  const L = chart.lagnaSign
  const moon = pos(chart, 'Moon'), sun = pos(chart, 'Sun')
  const d9 = vargaChart(chart, 9), d10 = vargaChart(chart, 10)
  const vp = (vc: VargaChart, g: Graha) => vc.placements.find((p) => p.graha === g)!
  const tenthLord = lordOfHouse(chart, 10)
  const tl = pos(chart, tenthLord)
  const karakas = charaKarakas(chart)
  const amk = karakas.Amatyakaraka

  // Evidence accumulator for career fields.
  const ev: Record<Graha, { s: number; r: string[] }> = Object.fromEntries(GRAHAS.map((g) => [g, { s: 0, r: [] as string[] }])) as unknown as Record<Graha, { s: number; r: string[] }>
  const add = (g: Graha, s: number, why: string) => { ev[g].s += s; ev[g].r.push(why) }

  const g1: RuleResult[] = [] // 10th house in D1
  const tq = houseQuality(tl.house!)
  g1.push(rule({
    id: 'c-10lord-dignity', group: '10th house (D1)', chart: 'D1', title: `10th lord ${tenthLord} is ${dignityPhrase(tl.dignity)}`,
    effect: dignityScore(tl.dignity) > 0 ? 'supportive' : dignityScore(tl.dignity) < 0 ? 'challenging' : 'mixed', weight: dignityScore(tl.dignity),
    detail: [`${describeLord(chart, 10, tenthLord)}. The dignity of the career lord shows how easily professional matters flow.`],
    rule: 'Dignity of the 10th lord (BPHS: strong karmesha = successful profession)',
  }))
  g1.push(rule({
    id: 'c-10lord-house', group: '10th house (D1)', chart: 'D1', title: `10th lord in the ${h(tl.house!)}`,
    effect: tq === 'dusthana' && tl.house !== 6 ? 'challenging' : tq === 'kendra' || tq === 'trikona' || tl.house === 11 ? 'supportive' : 'mixed',
    weight: tq === 'kendra' || tq === 'trikona' ? 2 : tl.house === 11 ? 2 : tq === 'dusthana' ? (tl.house === 6 ? 0 : -1.5) : 0.5,
    detail: [TENTH_LORD_IN[tl.house! - 1]],
    rule: '10th lord’s house placement (Bhavat Bhavam)',
  }))
  add(tenthLord, 3, `Lord of the 10th house (career) in D1`)

  const occ10 = occupants(chart, 10)
  g1.push(rule({
    id: 'c-10-occupants', group: '10th house (D1)', chart: 'D1', fired: occ10.length > 0,
    title: occ10.length ? `Planets in the 10th: ${occ10.join(', ')}` : 'No planets in the 10th house',
    effect: occ10.length ? 'supportive' : 'info', weight: occ10.reduce((s, g) => s + (isBenefic(g) ? 1 : ['Sun', 'Mars', 'Saturn', 'Rahu'].includes(g) ? 1 : 0.3), 0),
    detail: occ10.length ? occ10.map((g) => IN_TENTH[g]) : ['An empty 10th is normal; the career is then judged from the 10th lord and aspects.'],
    rule: 'Occupants of the 10th house; malefics are also good in the 10th (an upachaya house)',
  }))
  occ10.forEach((g) => add(g, 2.5, 'Placed in the 10th house'))

  const asp10 = aspectors(chart, 10)
  const benAsp = asp10.filter(isBenefic), malAsp = asp10.filter((g) => !isBenefic(g))
  g1.push(rule({
    id: 'c-10-drishti', group: '10th house (D1)', chart: 'D1', fired: asp10.length > 0,
    title: asp10.length ? `Drishti on the 10th from ${asp10.join(', ')}` : 'No planetary aspects on the 10th',
    effect: benAsp.length && !malAsp.length ? 'supportive' : malAsp.length && !benAsp.length ? 'mixed' : asp10.length ? 'mixed' : 'info',
    weight: benAsp.length * 0.8 + malAsp.filter((g) => g === 'Saturn' || g === 'Mars').length * 0.3,
    detail: [
      ...(benAsp.length ? [`${benAsp.join(' and ')} ${benAsp.length > 1 ? 'protect' : 'protects'} and ${benAsp.length > 1 ? 'bless' : 'blesses'} the career through drishti.`] : []),
      ...(malAsp.length ? [`${malAsp.join(' and ')} ${malAsp.length > 1 ? 'add' : 'adds'} pressure, discipline and drive. Malefic aspects on the 10th often make a person work very hard for achievement.`] : []),
    ],
    rule: 'Parashari drishti on the 10th house (all 7th; Mars 4/8; Jupiter 5/9; Saturn 3/10; nodes 5/9)',
  }))
  asp10.forEach((g) => add(g, 1, 'Aspects the 10th house'))

  // 10th from Moon and Sun (Phaladeepika considers all three).
  for (const [ref, refSign] of [['Moon', moon.sign], ['Sun', sun.sign]] as const) {
    const l = SIGN_LORD[(refSign + 9) % 12]
    const lp = pos(chart, l)
    const occ = occupants(chart, 10, refSign)
    g1.push(rule({
      id: `c-10-from-${ref}`, group: '10th house (D1)', chart: 'D1',
      title: `10th from the ${ref}: ${RASHI[signName((refSign + 9) % 12)]}, lord ${l}`,
      effect: dignityScore(lp.dignity) >= 1 ? 'supportive' : dignityScore(lp.dignity) < 0 ? 'challenging' : 'mixed', weight: dignityScore(lp.dignity) * 0.4,
      detail: [`Counting from the ${ref}, the career lord is ${l}, ${dignityPhrase(lp.dignity)} in ${signName(lp.sign)}.${occ.length ? ` Occupied by ${occ.join(', ')}.` : ''}`],
      rule: `10th house counted from the ${ref} (Phaladeepika ch. 5)`,
    }))
    add(l, ref === 'Moon' ? 1.5 : 1, `Lord of the 10th from the ${ref}`)
    occ.forEach((g) => add(g, 1, `In the 10th from the ${ref}`))
  }

  // Livelihood significators.
  const g2: RuleResult[] = []
  for (const [ref, refSign] of [['Lagna', L], ['Moon', moon.sign], ['Sun', sun.sign]] as const) {
    const lord = SIGN_LORD[(refSign + 9) % 12]
    const navSign = vp(d9, lord).sign
    const disp = SIGN_LORD[navSign]
    g2.push(rule({
      id: `c-navamsa-${ref}`, group: 'Source of livelihood', chart: 'D1 + D9',
      title: `${ref}: 10th lord ${lord} is in ${RASHI[signName(navSign)]} navamsa, ruled by ${disp}`,
      effect: 'info', weight: 0,
      detail: [`Classical rule: the lord of the navamsa occupied by the 10th lord shows the source of earnings. Here that is ${disp}, pointing toward: ${PLANET_CAREERS[disp].slice(0, 3).join('; ')}.`],
      rule: 'Phaladeepika 5.1–2: navamsa dispositor of the 10th lord (from lagna, Moon, Sun) indicates the means of livelihood',
    }))
    add(disp, ref === 'Lagna' ? 3 : 1.5, `Navamsa dispositor of the 10th lord from the ${ref}`)
  }
  const amkP = pos(chart, amk), amkD10 = vp(d10, amk)
  g2.push(rule({
    id: 'c-amk', group: 'Source of livelihood', chart: 'D1 + D10',
    title: `Amatyakaraka (career significator): ${amk}`,
    effect: dignityScore(amkD10.dignity) + dignityScore(amkP.dignity) > 0 ? 'supportive' : 'mixed', weight: (dignityScore(amkP.dignity) + dignityScore(amkD10.dignity)) * 0.4,
    detail: [
      `In Jaimini astrology the planet with the second-highest degree is the Amatyakaraka, the “minister” that guides your career. ${amk} is ${dignityPhrase(amkP.dignity)} in D1 (${h(amkP.house!)}) and ${dignityPhrase(amkD10.dignity)} in D10 (${h(amkD10.house!)}).`,
      `Fields associated with ${amk}: ${PLANET_CAREERS[amk].slice(0, 4).join('; ')}.`,
    ],
    rule: 'Jaimini chara karaka: second-highest degree among the seven planets = Amatyakaraka',
  }))
  add(amk, 2.5, 'Amatyakaraka (Jaimini career significator)')
  const sat = pos(chart, 'Saturn')
  g2.push(rule({
    id: 'c-saturn', group: 'Source of livelihood', chart: 'D1', title: `Karma karaka Saturn is ${dignityPhrase(sat.dignity)} in the ${h(sat.house!)}`,
    effect: dignityScore(sat.dignity) > 0 || [3, 6, 10, 11].includes(sat.house!) ? 'supportive' : dignityScore(sat.dignity) < 0 ? 'challenging' : 'mixed',
    weight: dignityScore(sat.dignity) * 0.5 + ([3, 6, 10, 11].includes(sat.house!) ? 1 : 0),
    detail: ['Saturn is the natural significator of work and perseverance. A strong Saturn gives stamina and a long, stable career; a weak one asks for patience and discipline.'],
    rule: 'Naisargika karaka of the 10th house: Saturn (with the Sun, Mercury and Jupiter as supporting karakas)',
  }))

  // D10.
  const g3: RuleResult[] = []
  if (d10.lagnaSign !== null) {
    const dl = SIGN_LORD[d10.lagnaSign], dlp = vp(d10, dl)
    const d10tenthSign = (d10.lagnaSign + 9) % 12, d10tl = SIGN_LORD[d10tenthSign], d10tlp = vp(d10, d10tl)
    const occD10 = d10.placements.filter((p) => p.house === 10).map((p) => p.graha as Graha)
    const kendraD10 = d10.placements.filter((p) => KENDRA.includes(p.house!)).map((p) => p.graha as Graha)
    g3.push(rule({
      id: 'c-d10-lagna', group: 'Dasamsa (D10)', chart: 'D10', title: `D10 lagna ${RASHI[signName(d10.lagnaSign)]}; lord ${dl} in the ${h(dlp.house!)}`,
      effect: dignityScore(dlp.dignity) > 0 || KENDRA.includes(dlp.house!) ? 'supportive' : dlp.dignity === 'debilitated' || [6, 8, 12].includes(dlp.house!) ? 'challenging' : 'mixed',
      weight: dignityScore(dlp.dignity) * 0.6 + (KENDRA.includes(dlp.house!) || [5, 9, 11].includes(dlp.house!) ? 1 : [6, 8, 12].includes(dlp.house!) ? -1 : 0),
      detail: [`The D10 lagna shows your professional persona; its lord in the ${h(dlp.house!)} directs career energy toward ${BHAVA[dlp.house! - 1].topics}.`],
      rule: 'D10 lagna lord placement and dignity',
    }))
    add(dl, 1.5, 'D10 lagna lord')
    g3.push(rule({
      id: 'c-d10-10lord', group: 'Dasamsa (D10)', chart: 'D10', title: `D10 10th lord ${d10tl} is ${dignityPhrase(d10tlp.dignity)} in the ${h(d10tlp.house!)}`,
      effect: dignityScore(d10tlp.dignity) > 0 || KENDRA.includes(d10tlp.house!) || [5, 9, 11].includes(d10tlp.house!) ? 'supportive' : [6, 8, 12].includes(d10tlp.house!) || d10tlp.dignity === 'debilitated' ? 'challenging' : 'mixed',
      weight: dignityScore(d10tlp.dignity) * 0.8 + (KENDRA.includes(d10tlp.house!) || [5, 9, 11].includes(d10tlp.house!) ? 1.5 : [6, 8, 12].includes(d10tlp.house!) ? -1.5 : 0),
      detail: [`Within the career chart itself, the 10th lord shows how far the profession rises. ${TENTH_LORD_IN[d10tlp.house! - 1]}`],
      rule: 'D10 10th lord placement and dignity',
    }))
    add(d10tl, 2, 'D10 10th lord')
    g3.push(rule({
      id: 'c-d10-occ', group: 'Dasamsa (D10)', chart: 'D10', fired: occD10.length > 0,
      title: occD10.length ? `D10 10th house holds ${occD10.join(', ')}` : 'D10 10th house is empty',
      effect: occD10.length ? 'supportive' : 'info', weight: occD10.length ? 1 : 0,
      detail: occD10.length ? [`Planets in the 10th of D10 strongly colour the profession: ${occD10.map((g) => `${g} (${PLANET_CAREERS[g][0]})`).join('; ')}.`] : ['The D10 10th lord carries the career story.'],
      rule: 'Occupants of the 10th house in D10',
    }))
    occD10.forEach((g) => add(g, 2, 'In the 10th house of D10'))
    kendraD10.filter((g) => !occD10.includes(g)).forEach((g) => add(g, 0.7, 'In a kendra of D10'))
    const d10strong = d10.placements.filter((p) => p.dignity && GOOD_DIGNITY.includes(p.dignity)).map((p) => p.graha as Graha)
    const d10weak = d10.placements.filter((p) => p.dignity === 'debilitated').map((p) => p.graha as Graha)
    g3.push(rule({
      id: 'c-d10-strength', group: 'Dasamsa (D10)', chart: 'D10', fired: d10strong.length + d10weak.length > 0,
      title: `D10 strong: ${d10strong.join(', ') || 'none'} · weak: ${d10weak.join(', ') || 'none'}`,
      effect: d10strong.length > d10weak.length ? 'supportive' : d10weak.length > d10strong.length ? 'challenging' : 'mixed',
      weight: d10strong.length * 0.6 - d10weak.length * 0.6,
      detail: ['Planets in own or exaltation signs in D10 deliver professional success during their dashas; debilitated ones bring setbacks in their periods unless supported.'],
      rule: 'Sign dignity of all planets in D10',
    }))
    d10strong.forEach((g) => add(g, 1, 'Strong (own/exalted) in D10'))
    const tlD10 = vp(d10, tenthLord)
    g3.push(rule({
      id: 'c-d1-d10-link', group: 'Dasamsa (D10)', chart: 'D1 + D10', title: `D1 10th lord ${tenthLord} in D10: ${dignityPhrase(tlD10.dignity)}, ${h(tlD10.house!)}`,
      effect: dignityScore(tlD10.dignity) > 0 || KENDRA.includes(tlD10.house!) ? 'supportive' : tlD10.dignity === 'debilitated' || [6, 8, 12].includes(tlD10.house!) ? 'challenging' : 'mixed',
      weight: dignityScore(tlD10.dignity) * 0.5 + (KENDRA.includes(tlD10.house!) ? 0.8 : 0),
      detail: ['Confirmation rule: the D1 career lord should also be well placed in D10 for the promise of D1 to be fully delivered.'],
      rule: 'D1 10th lord re-examined in D10',
    }))
  }

  // Yogas relevant to career.
  const g4: RuleResult[] = []
  const ninthLord = lordOfHouse(chart, 9)
  const dk = linked(chart, ninthLord, tenthLord)
  g4.push(rule({
    id: 'c-dharma-karma', group: 'Career yogas', chart: 'D1', fired: !!dk && ninthLord !== tenthLord,
    title: 'Dharma–Karmadhipati Yoga', effect: 'supportive', weight: 3,
    detail: [dk ? `9th lord ${ninthLord} and 10th lord ${tenthLord} are linked (${dk}). This is the most celebrated career Raja Yoga: purpose and profession align, bringing recognition.` : 'The 9th and 10th lords are not linked.'],
    rule: 'Lords of the 9th and 10th houses linked by conjunction, exchange or aspect',
  }))
  const rajaWith10: string[] = []
  for (const t of [1, 5, 9]) {
    const tlord = lordOfHouse(chart, t)
    const how = linked(chart, tenthLord, tlord)
    if (how && tlord !== tenthLord && t !== 9) rajaWith10.push(`${t === 1 ? '1st' : `${t}th`} lord ${tlord} (${how})`)
  }
  g4.push(rule({
    id: 'c-raja-10', group: 'Career yogas', chart: 'D1', fired: rajaWith10.length > 0, title: 'Raja Yoga involving the 10th lord',
    effect: 'supportive', weight: 1.5 * rajaWith10.length,
    detail: [rajaWith10.length ? `The 10th lord is linked with ${rajaWith10.join('; ')}: kendra–trikona links raise status.` : 'No additional kendra–trikona links with the 10th lord.'],
    rule: 'Kendra lord (10th) linked with trikona lords (1st, 5th)',
  }))
  const amala = [...occupants(chart, 10), ...occupants(chart, 10, moon.sign)].filter(isBenefic).filter((g) => g !== 'Moon')
  g4.push(rule({
    id: 'c-amala', group: 'Career yogas', chart: 'D1', fired: amala.length > 0, title: 'Amala Yoga', effect: 'supportive', weight: 1.5,
    detail: [amala.length ? `${[...new Set(amala)].join(', ')} in the 10th from lagna or Moon: a spotless reputation and ethical success.` : 'No natural benefic in the 10th from lagna or Moon.'],
    rule: 'Natural benefic in the 10th from lagna or Moon',
  }))
  const mp = (['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as Graha[]).filter((g) => { const p = pos(chart, g); return KENDRA.includes(p.house!) && p.dignity && GOOD_DIGNITY.includes(p.dignity) })
  g4.push(rule({
    id: 'c-mahapurusha', group: 'Career yogas', chart: 'D1', fired: mp.length > 0, title: 'Pancha Mahapurusha Yoga', effect: 'supportive', weight: 2 * mp.length,
    detail: [mp.length ? `${mp.join(', ')} strong in a kendra: a signature talent that shapes a distinguished career (${mp.map((g) => PLANET_CAREERS[g][0]).join('; ')}).` : 'No Mahapurusha yoga.'],
    rule: 'Mars/Mercury/Jupiter/Venus/Saturn in own or exaltation sign in a kendra',
  }))
  mp.forEach((g) => add(g, 2, 'Forms a Pancha Mahapurusha yoga'))
  const tlIn11 = tl.house === 11, l11 = lordOfHouse(chart, 11), l11in10 = pos(chart, l11).house === 10
  g4.push(rule({
    id: 'c-10-11', group: 'Career yogas', chart: 'D1', fired: tlIn11 || l11in10 || !!linked(chart, tenthLord, l11), title: 'Career–gains link (10th ↔ 11th)', effect: 'supportive', weight: 1.5,
    detail: ['The career lord and the lord of gains are connected: professional effort converts readily into income.'],
    rule: '10th lord in 11th, 11th lord in 10th, or the two lords linked',
  }))
  const budh = pos(chart, 'Sun').sign === pos(chart, 'Mercury').sign && [1, 10].includes(pos(chart, 'Sun').house!)
  g4.push(rule({
    id: 'c-budhaditya-10', group: 'Career yogas', chart: 'D1', fired: budh, title: 'Budhaditya Yoga in the 1st or 10th', effect: 'supportive', weight: 1,
    detail: ['Sun and Mercury together in an angle of career: intelligence recognised by authority, good for administration, analytics and advisory roles.'],
    rule: 'Sun + Mercury conjunct in the 1st or 10th house',
  }))
  const tlDusthana = [6, 8, 12].includes(tl.house!) && !(tl.dignity && GOOD_DIGNITY.includes(tl.dignity))
  g4.push(rule({
    id: 'c-10lord-weak', group: 'Career yogas', chart: 'D1', fired: tlDusthana || tl.combust, title: 'Career lord under strain', effect: 'challenging', weight: -1.5,
    detail: [`${tenthLord}${tl.combust ? ' is combust' : ''}${tlDusthana ? ` sits in the ${h(tl.house!)}, a dusthana` : ''}. Expect a career built through obstacles, changes or service before stability. Strength elsewhere (D10, dasha) can offset this.`],
    rule: '10th lord in 6th/8th/12th without dignity, or combust',
  }))

  // Mode of work.
  const modes: ModeScore[] = []
  const mode = (label: string, checks: [boolean, string][]) => {
    const fired = checks.filter(([ok]) => ok).map(([, r]) => r)
    modes.push({ label, score: Math.min(100, Math.round((fired.length / checks.length) * 100)), reasons: fired })
  }
  const l7 = lordOfHouse(chart, 7), l6 = lordOfHouse(chart, 6), l1 = lordOfHouse(chart, 1), l12 = lordOfHouse(chart, 12)
  const p7 = pos(chart, l7), p1 = pos(chart, l1), merc = pos(chart, 'Mercury')
  mode('Business / trade', [
    [!!linked(chart, l7, tenthLord) || tl.house === 7, `7th lord ${l7} linked with the 10th lord, or 10th lord in the 7th`],
    [KENDRA.includes(p7.house!) || [5, 9, 11].includes(p7.house!), `7th lord ${l7} well placed (${h(p7.house!)})`],
    [dignityScore(merc.dignity) >= 1 || KENDRA.includes(merc.house!), 'Mercury (commerce) strong or in a kendra'],
    [!!influencesHouse(chart, 'Mercury', 10) || !!influencesHouse(chart, 'Mercury', 7), 'Mercury influences the 10th or 7th'],
    [occupants(chart, 7).some(isBenefic), 'Benefic in the 7th house'],
  ])
  mode('Employment / service', [
    [!!linked(chart, l6, tenthLord) || tl.house === 6, `6th lord ${l6} linked with the 10th lord, or 10th lord in the 6th`],
    [!!influencesHouse(chart, 'Saturn', 10), 'Saturn (servant, organisations) influences the 10th'],
    [pos(chart, l6).house === 10, '6th lord in the 10th'],
    [[6, 8, 12].includes(tl.house!), '10th lord in a dusthana (work under others)'],
    [!(KENDRA.includes(p1.house!) && dignityScore(p1.dignity) > 0), 'Lagna lord not dominant (prefers structure)'],
  ])
  mode('Government / public sector', [
    [!!influencesHouse(chart, 'Sun', 10), 'Sun occupies or aspects the 10th'],
    [dignityScore(sun.dignity) >= 2 || sun.house === 10, 'Sun strong (own, exalted or dig bala)'],
    [!!linked(chart, 'Sun', tenthLord) || tenthLord === 'Sun', 'Sun linked with the 10th lord'],
    [!!influencesHouse(chart, 'Jupiter', 10), 'Jupiter (dharma, ministers) influences the 10th'],
    [vp(d10, 'Sun').dignity !== null && GOOD_DIGNITY.includes(vp(d10, 'Sun').dignity!), 'Sun strong in D10'],
  ])
  mode('Foreign / multinational', [
    [[12, 9].includes(tl.house!), '10th lord in the 12th or 9th (foreign lands, long journeys)'],
    [!!influencesHouse(chart, 'Rahu', 10) || !!linked(chart, 'Rahu', tenthLord), 'Rahu influences the 10th or the 10th lord'],
    [pos(chart, l12).house === 10 || !!linked(chart, l12, tenthLord), `12th lord ${l12} linked with the career`],
    [[0, 3, 6, 9].includes((L + 9) % 12), 'Movable sign on the 10th (travel, change)'],
    [pos(chart, 'Moon').house === 12 || pos(chart, 'Moon').house === 9, 'Moon in the 9th or 12th'],
  ])
  mode('Self-employment / own venture', [
    [KENDRA.includes(p1.house!) && dignityScore(p1.dignity) >= 0, `Lagna lord ${l1} strong in a kendra`],
    [!!linked(chart, l1, tenthLord) || tl.house === 1, 'Lagna lord linked with the 10th lord, or 10th lord in the 1st'],
    [!!influencesHouse(chart, 'Mars', 10) || !!influencesHouse(chart, 'Sun', 1), 'Mars on the 10th or Sun on the 1st (initiative)'],
    [pos(chart, lordOfHouse(chart, 3)).house === 10 || tl.house === 3, '3rd lord (self-effort) linked with the 10th'],
    [!!linked(chart, l7, l1), 'Lagna lord linked with the 7th lord (clients)'],
  ])

  // Divisional charts relevant to career.
  const vargas: VargaVerdict[] = []
  const vv = (n: 2 | 3 | 5 | 9 | 10, name: string, focus: string, house: number) => {
    const vc = vargaChart(chart, n)
    if (vc.lagnaSign === null) return
    const lord = SIGN_LORD[(vc.lagnaSign + house - 1) % 12]
    const p = vp(vc, lord)
    const s = dignityScore(p.dignity) + (KENDRA.includes(p.house!) || [5, 9, 11].includes(p.house!) ? 1.5 : [6, 8, 12].includes(p.house!) ? -1.5 : 0)
    vargas.push({
      code: `D${n}`, name, focus, verdict: s >= 2 ? 'strong' : s >= 0 ? 'moderate' : 'weak',
      detail: `${h(house)} lord ${lord} is ${dignityPhrase(p.dignity)} in the ${h(p.house!)} of D${n}.`,
    })
  }
  vv(10, 'Dasamsa', 'profession & status', 10)
  vv(9, 'Navamsa', 'inner strength of the career lord', 10)
  vv(2, 'Hora', 'earning capacity', 2)
  vv(3, 'Drekkana', 'initiative & self-effort', 3)
  vv(5, 'Panchamsa', 'fame & authority (supplementary)', 10)
  vargas.unshift({
    code: 'D1', name: 'Rashi', focus: 'career promise', verdict: dignityScore(tl.dignity) + (tq === 'kendra' || tq === 'trikona' || tl.house === 11 ? 1.5 : tq === 'dusthana' ? -1.5 : 0) >= 2 ? 'strong' : tq === 'dusthana' && dignityScore(tl.dignity) <= 0 ? 'weak' : 'moderate',
    detail: `10th lord ${tenthLord} is ${dignityPhrase(tl.dignity)} in the ${h(tl.house!)}.`,
  })

  // Fields.
  const fields: FieldSuggestion[] = SEVEN.concat(['Rahu', 'Ketu'])
    .map((g) => ({ planet: g, score: Math.round(ev[g].s * 10) / 10, fields: PLANET_CAREERS[g], reasons: ev[g].r }))
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  // Timing.
  const significators: Graha[] = [...new Set<Graha>([tenthLord, ...occ10, amk, ...fields.slice(0, 2).map((f) => f.planet), lordOfHouse(chart, 11)])]
  const weights: Partial<Record<Graha, { w: number; why: string }>> = {}
  weights[tenthLord] = { w: 3, why: '10th lord (career)' }
  occ10.forEach((g) => (weights[g] = { w: 2.5, why: 'placed in the 10th' }))
  weights[amk] = weights[amk] ?? { w: 2, why: 'Amatyakaraka (career significator)' }
  if (!weights[l11]) weights[l11] = { w: 1.5, why: '11th lord (gains)' }
  fields.slice(0, 2).forEach((f) => { if (!weights[f.planet]) weights[f.planet] = { w: 1.5, why: 'top career significator' } })
  const periods: Period[] = vimshottari(moon.lon, chart.utc)
  const dashas = dashaHighlights(periods, weights, now, 15).sort((a, b) => a.start.getTime() - b.start.getTime())
  const windows = doubleTransitWindows(chart, 10, significators, periods, now, 8)

  const groups = [
    { title: 'The 10th house in D1 (from lagna, Moon and Sun)', results: g1 },
    { title: 'Sources of livelihood: classical & Jaimini significators', results: g2 },
    { title: 'Dasamsa (D10): the career chart', results: g3 },
    { title: 'Career yogas and obstacles', results: g4 },
  ]
  const score = areaScore(groups.flatMap((g) => g.results))
  const top = fields[0]
  const headline = top
    ? `Your chart points most strongly to ${top.planet}-ruled fields (${top.fields.slice(0, 2).join(', ').toLowerCase()}), with the 10th lord ${tenthLord} in the ${h(tl.house!)}.`
    : `The 10th lord ${tenthLord} in the ${h(tl.house!)} shapes your career.`
  return { score, headline, fields, modes, groups, vargas, dashas, windows, significators }
}

