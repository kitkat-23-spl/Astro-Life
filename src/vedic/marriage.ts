import { SIGN_TEXT } from '../interpret/signs'
import { BHAVA, KENDRA, RASHI, SIGN_LORD, houseFrom, type Graha } from './constants'
import { vimshottari } from './dasha'
import {
  GOOD_DIGNITY, areaScore, aspectors, dashaHighlights, describeLord, dignityPhrase, dignityScore, h, houseQuality,
  influencesHouse, isBenefic, linked, occupants, rule, type DashaHighlight, type RuleResult,
} from './rules'
import { signName, vargaChart, type VedicChart } from './sidereal'
import { aspectsOnGraha, charaKarakas, conjunctWith, doubleTransitWindows, lordOfHouse, pos, upapada, type TransitWindow } from './techniques'

export type Gender = 'male' | 'female' | 'unspecified'

const SPOUSE_BY_PLANET: Record<Graha, string> = {
  Sun: 'dignified, proud and principled, possibly from a respected family; mutual respect for each other’s ego is key',
  Moon: 'caring, emotional, attractive and family-oriented',
  Mars: 'energetic, assertive, athletic and passionate; channel disagreements constructively',
  Mercury: 'youthful, witty, communicative and intelligent, often business-minded',
  Jupiter: 'wise, ethical, well educated and generous; fortune tends to grow after marriage',
  Venus: 'attractive, artistic, romantic and refined, with a love of comfort',
  Saturn: 'mature, responsible and serious, possibly older or from a different background; the bond deepens slowly',
  Rahu: 'unconventional and magnetic, possibly from a different culture, community or country',
  Ketu: 'spiritual, introspective and somewhat detached; conscious bonding keeps the relationship warm',
}

/** Classical sign-specific Mangal dosha cancellations: Mars in [house] in these signs does not cause dosha. */
const MANGAL_SIGN_EXCEPTIONS: Record<number, number[]> = { 1: [0, 7], 2: [2, 5], 4: [0, 7], 7: [3, 9], 8: [8, 11], 12: [1, 6] }

export interface SpouseTrait { text: string; source: string }
export interface MangalCheck { from: string; house: number; present: boolean }
export interface TimingFactor { label: string; direction: 'early' | 'delay'; source: string }

export interface MarriageReport {
  gender: Gender
  score: number
  headline: string
  tendency: { label: string; early: number; delay: number; factors: TimingFactor[] }
  style: { love: string[]; arranged: string[] }
  spouse: SpouseTrait[]
  mangal: { checks: MangalCheck[]; cancellations: string[]; status: 'none' | 'present' | 'cancelled' }
  groups: { title: string; results: RuleResult[] }[]
  vargas: { code: string; name: string; focus: string; verdict: 'strong' | 'moderate' | 'weak'; detail: string }[]
  dashas: DashaHighlight[]
  windows: TransitWindow[]
  upapadaSign: number
  darakaraka: Graha
}

export function marriageReport(chart: VedicChart, gender: Gender, now = new Date()): MarriageReport | null {
  if (chart.lagnaSign === null) return null
  const L = chart.lagnaSign
  const moon = pos(chart, 'Moon'), venus = pos(chart, 'Venus'), jup = pos(chart, 'Jupiter'), mars = pos(chart, 'Mars')
  const l7 = lordOfHouse(chart, 7), p7 = pos(chart, l7)
  const l1 = lordOfHouse(chart, 1)
  const d9 = vargaChart(chart, 9), d7 = vargaChart(chart, 7)
  const vp = (vc: typeof d9, g: Graha) => vc.placements.find((p) => p.graha === g)!
  const karakas = charaKarakas(chart)
  const dk = karakas.Darakaraka
  // Spouse karaka: Venus for everyone; Jupiter additionally for a woman’s husband (classical).
  const karakasForSpouse: Graha[] = gender === 'female' ? ['Jupiter', 'Venus'] : ['Venus']

  const g1: RuleResult[] = []
  const q7 = houseQuality(p7.house!)
  g1.push(rule({
    id: 'm-7lord', group: '7th house', chart: 'D1', title: `7th lord ${l7} is ${dignityPhrase(p7.dignity)} in the ${h(p7.house!)}`,
    effect: dignityScore(p7.dignity) > 0 || q7 === 'kendra' || q7 === 'trikona' ? 'supportive' : p7.dignity === 'debilitated' || q7 === 'dusthana' ? 'challenging' : 'mixed',
    weight: dignityScore(p7.dignity) + (q7 === 'kendra' || q7 === 'trikona' || p7.house === 11 ? 1.5 : q7 === 'dusthana' ? -1.5 : 0),
    detail: [
      `${describeLord(chart, 7, l7)}.`,
      p7.house === 7 ? 'The 7th lord in its own house is a classic sign of a stable, committed partnership.'
        : q7 === 'dusthana' ? `In the ${h(p7.house!)} the partnership matures through challenges: ${BHAVA[p7.house! - 1].topics} enter the relationship story.`
          : `Partnership connects with ${BHAVA[p7.house! - 1].topics}.`,
    ],
    rule: 'Dignity and house of the 7th lord (kalatra bhava lord)',
  }))
  const occ7 = occupants(chart, 7)
  g1.push(rule({
    id: 'm-7occ', group: '7th house', chart: 'D1', fired: occ7.length > 0, title: occ7.length ? `Planets in the 7th: ${occ7.join(', ')}` : 'The 7th house is empty',
    effect: occ7.every(isBenefic) ? 'supportive' : occ7.some((g) => ['Saturn', 'Mars', 'Rahu', 'Ketu', 'Sun'].includes(g)) ? 'mixed' : 'info',
    weight: occ7.reduce((s, g) => s + (isBenefic(g) ? 1.2 : -0.8), 0),
    detail: occ7.length ? occ7.map((g) => `${g} in the 7th: a partner who is ${SPOUSE_BY_PLANET[g]}.`) : ['An empty 7th is common; its lord and aspects describe the marriage.'],
    rule: 'Occupants of the 7th house (natural benefics support; malefics add intensity or delay)',
  }))
  const asp7 = aspectors(chart, 7)
  const ben7 = asp7.filter(isBenefic), mal7 = asp7.filter((g) => !isBenefic(g))
  g1.push(rule({
    id: 'm-7drishti', group: '7th house', chart: 'D1', fired: asp7.length > 0, title: asp7.length ? `Drishti on the 7th from ${asp7.join(', ')}` : 'No aspects on the 7th',
    effect: ben7.length > mal7.length ? 'supportive' : mal7.length > ben7.length ? 'challenging' : 'mixed',
    weight: ben7.length * (ben7.includes('Jupiter') ? 1.5 : 1) - mal7.length * 0.8,
    detail: [
      ...(ben7.includes('Jupiter') ? ['Jupiter’s aspect on the 7th is the single most protective influence on marriage: it brings wisdom, blessings and staying power.'] : []),
      ...(ben7.filter((g) => g !== 'Jupiter').length ? [`${ben7.filter((g) => g !== 'Jupiter').join(', ')} add warmth.`] : []),
      ...(mal7.includes('Saturn') ? ['Saturn’s aspect on the 7th often delays marriage or brings a mature, duty-bound partnership.'] : []),
      ...(mal7.includes('Mars') ? ['Mars’s aspect on the 7th adds passion and the potential for arguments.'] : []),
      ...(mal7.filter((g) => !['Saturn', 'Mars'].includes(g)).length ? [`${mal7.filter((g) => !['Saturn', 'Mars'].includes(g)).join(', ')} add intensity or unconventional elements.`] : []),
    ],
    rule: 'Parashari drishti on the 7th house',
  }))
  const l7afflict = [6, 8, 12].map((n) => lordOfHouse(chart, n)).filter((g) => g !== l7 && linked(chart, g, l7))
  g1.push(rule({
    id: 'm-7lord-dusthana-lords', group: '7th house', chart: 'D1', fired: l7afflict.length > 0, title: '7th lord linked with dusthana lords', effect: 'challenging', weight: -1,
    detail: [`${l7} is linked with ${[...new Set(l7afflict)].join(', ')} (lords of the 6th, 8th or 12th). This brings disagreements, distance or periods of strain that need patience and communication.`],
    rule: '7th lord conjunct, exchanged with or aspected by the 6th/8th/12th lord',
  }))
  const l1l7 = linked(chart, l1, l7)
  g1.push(rule({
    id: 'm-1-7', group: '7th house', chart: 'D1', fired: !!l1l7 && l1 !== l7, title: 'Lagna lord and 7th lord linked', effect: 'supportive', weight: 1.5,
    detail: [`${l1} and ${l7} are linked (${l1l7}): self and partner are naturally drawn together, which is a strong indicator of marriage and mutual attachment.`],
    rule: 'Lord of the 1st linked with lord of the 7th',
  }))
  for (const [ref, refSign] of [['Moon', moon.sign], ['Venus', venus.sign]] as const) {
    const s7 = (refSign + 6) % 12, lord = SIGN_LORD[s7], lp = pos(chart, lord), occ = occupants(chart, 7, refSign)
    const mal = occ.filter((g) => !isBenefic(g))
    g1.push(rule({
      id: `m-7-from-${ref}`, group: '7th house', chart: 'D1', title: `7th from the ${ref}: ${RASHI[signName(s7)]}${occ.length ? `, holding ${occ.join(', ')}` : ''}`,
      effect: mal.length ? 'mixed' : dignityScore(lp.dignity) >= 1 ? 'supportive' : 'info', weight: -mal.length * 0.5 + dignityScore(lp.dignity) * 0.3,
      detail: [`Counting from the ${ref}${ref === 'Venus' ? ' (karaka of marriage)' : ' (the mind)'}, the 7th lord is ${lord}, ${dignityPhrase(lp.dignity)}.${mal.length ? ` ${mal.join(', ')} here add emotional intensity to partnership.` : ''}`],
      rule: `7th house counted from the ${ref}`,
    }))
  }

  // Karakas.
  const g2: RuleResult[] = []
  for (const k of karakasForSpouse) {
    const p = k === 'Venus' ? venus : jup
    const aff = [...conjunctWith(chart, k), ...aspectsOnGraha(chart, k)].filter((g) => ['Saturn', 'Rahu', 'Ketu', 'Mars'].includes(g))
    const w = dignityScore(p.dignity) - (p.combust ? 1 : 0) - aff.length * 0.5 + (KENDRA.includes(p.house!) || [5, 9].includes(p.house!) ? 0.8 : 0)
    g2.push(rule({
      id: `m-karaka-${k}`, group: 'Karakas', chart: 'D1', title: `${k} (${k === 'Venus' ? 'karaka of love and spouse' : 'karaka of the husband'}) is ${dignityPhrase(p.dignity)} in the ${h(p.house!)}`,
      effect: w >= 1 ? 'supportive' : w < 0 ? 'challenging' : 'mixed', weight: w,
      detail: [
        `${k} describes the quality of partnership and the partner.${p.combust ? ` It is combust, so ${k.toLowerCase() === 'venus' ? 'romantic expression' : 'guidance in marriage'} can be overshadowed by ego or career; conscious attention helps.` : ''}`,
        ...(aff.length ? [`It is influenced by ${[...new Set(aff)].join(', ')}, which bring ${aff.includes('Saturn') ? 'delay and seriousness' : ''}${aff.includes('Rahu') ? ' unconventional attraction' : ''}${aff.includes('Ketu') ? ' detachment' : ''}${aff.includes('Mars') ? ' passion and friction' : ''}.`] : []),
      ],
      rule: `Condition of ${k}: dignity, combustion, malefic conjunction or aspect`,
    }))
  }
  const dkp = pos(chart, dk), dkD9 = vp(d9, dk)
  g2.push(rule({
    id: 'm-darakaraka', group: 'Karakas', chart: 'D1 + D9', title: `Darakaraka (spouse significator): ${dk}`,
    effect: dignityScore(dkp.dignity) + dignityScore(dkD9.dignity) > 0 ? 'supportive' : dignityScore(dkp.dignity) + dignityScore(dkD9.dignity) < 0 ? 'challenging' : 'mixed',
    weight: (dignityScore(dkp.dignity) + dignityScore(dkD9.dignity)) * 0.4,
    detail: [`In Jaimini astrology the planet with the lowest degree is the Darakaraka, and it represents the spouse. ${dk} suggests a partner who is ${SPOUSE_BY_PLANET[dk]}. It is ${dignityPhrase(dkp.dignity)} in D1 and ${dignityPhrase(dkD9.dignity)} in D9.`],
    rule: 'Jaimini chara karaka: lowest degree among the seven planets = Darakaraka',
  }))

  // Navamsa.
  const g3: RuleResult[] = []
  if (d9.lagnaSign !== null) {
    const s7 = (d9.lagnaSign + 6) % 12, d9l7 = SIGN_LORD[s7], d9l7p = vp(d9, d9l7)
    const d9occ7 = d9.placements.filter((p) => p.house === 7).map((p) => p.graha as Graha)
    const d9ll = SIGN_LORD[d9.lagnaSign], d9llp = vp(d9, d9ll)
    g3.push(rule({
      id: 'm-d9-7', group: 'Navamsa (D9)', chart: 'D9', title: `D9 7th house ${RASHI[signName(s7)]}; lord ${d9l7} in the ${h(d9l7p.house!)}${d9occ7.length ? `; holds ${d9occ7.join(', ')}` : ''}`,
      effect: dignityScore(d9l7p.dignity) > 0 || KENDRA.includes(d9l7p.house!) || [5, 9, 11].includes(d9l7p.house!) ? 'supportive' : [6, 8, 12].includes(d9l7p.house!) || d9l7p.dignity === 'debilitated' ? 'challenging' : 'mixed',
      weight: dignityScore(d9l7p.dignity) * 0.8 + (KENDRA.includes(d9l7p.house!) || [5, 9, 11].includes(d9l7p.house!) ? 1.2 : [6, 8, 12].includes(d9l7p.house!) ? -1.2 : 0) + d9occ7.reduce((s, g) => s + (isBenefic(g) ? 0.6 : -0.4), 0),
      detail: ['The Navamsa is the chart of marriage. Its 7th house and lord show how the marriage feels from the inside and how it matures over time.', `The D9 7th sign ${signName(s7)} suggests a partner with ${SIGN_TEXT[signName(s7)].keywords.slice(0, 3).join(', ')}.`],
      rule: 'D9 7th house, its lord and occupants',
    }))
    g3.push(rule({
      id: 'm-d9-lagna', group: 'Navamsa (D9)', chart: 'D9', title: `D9 lagna ${RASHI[signName(d9.lagnaSign)]}; lord ${d9ll} ${dignityPhrase(d9llp.dignity)} in the ${h(d9llp.house!)}`,
      effect: dignityScore(d9llp.dignity) >= 1 || KENDRA.includes(d9llp.house!) ? 'supportive' : [6, 8, 12].includes(d9llp.house!) ? 'challenging' : 'mixed',
      weight: dignityScore(d9llp.dignity) * 0.5,
      detail: ['The D9 lagna shows who you become within marriage and in the second half of life.'],
      rule: 'D9 lagna lord placement',
    }))
    for (const k of karakasForSpouse) {
      const kp = vp(d9, k)
      g3.push(rule({
        id: `m-d9-${k}`, group: 'Navamsa (D9)', chart: 'D9', title: `${k} in D9: ${dignityPhrase(kp.dignity)} (${RASHI[signName(kp.sign)]})`,
        effect: dignityScore(kp.dignity) > 0 ? 'supportive' : dignityScore(kp.dignity) < 0 ? 'challenging' : 'mixed', weight: dignityScore(kp.dignity) * 0.8,
        detail: [`The true strength of ${k} for marriage is judged in D9. ${dignityScore(kp.dignity) > 0 ? 'Strong here, it sustains harmony and attraction over the years.' : dignityScore(kp.dignity) < 0 ? 'Weak here, relationship happiness grows through effort, understanding and shared values.' : 'Moderate strength.'}`],
        rule: `${k}’s dignity in the Navamsa`,
      }))
    }
    const l7d9 = vp(d9, l7)
    g3.push(rule({
      id: 'm-d1-d9-7lord', group: 'Navamsa (D9)', chart: 'D1 + D9', title: `D1 7th lord ${l7} in D9: ${dignityPhrase(l7d9.dignity)}${l7d9.sign === p7.sign ? ' (vargottama)' : ''}`,
      effect: l7d9.sign === p7.sign || dignityScore(l7d9.dignity) > 0 ? 'supportive' : dignityScore(l7d9.dignity) < 0 ? 'challenging' : 'mixed',
      weight: (l7d9.sign === p7.sign ? 1.5 : 0) + dignityScore(l7d9.dignity) * 0.5,
      detail: ['Confirmation rule: the D1 promise of marriage is delivered fully when the 7th lord is also strong in the Navamsa.'],
      rule: 'D1 7th lord re-examined in D9; vargottama = same sign in both',
    }))
  }

  // Upapada.
  const g4: RuleResult[] = []
  const ul = upapada(chart)
  const ul2 = (ul + 1) % 12
  const ul2occ = chart.grahas.filter((g) => g.sign === ul2).map((g) => g.graha)
  const ulLord = SIGN_LORD[ul], ulLordP = pos(chart, ulLord)
  const ul2mal = ul2occ.filter((g) => ['Saturn', 'Rahu', 'Ketu', 'Sun', 'Mars'].includes(g))
  const ul2ben = ul2occ.filter((g) => ['Jupiter', 'Venus', 'Mercury', 'Moon'].includes(g))
  g4.push(rule({
    id: 'm-upapada', group: 'Upapada Lagna (Jaimini)', chart: 'D1', title: `Upapada in ${RASHI[signName(ul)]} (${h(houseFrom(L, ul))}); its lord ${ulLord} is ${dignityPhrase(ulLordP.dignity)}`,
    effect: dignityScore(ulLordP.dignity) > 0 ? 'supportive' : dignityScore(ulLordP.dignity) < 0 ? 'challenging' : 'mixed', weight: dignityScore(ulLordP.dignity) * 0.5,
    detail: [`The Upapada (arudha of the 12th) shows the image and tangible reality of marriage. In ${signName(ul)} it suggests a partnership coloured by ${SIGN_TEXT[signName(ul)].keywords.slice(0, 3).join(', ')}.`],
    rule: 'Upapada = arudha of the 12th house (count 12th → its lord, same count again; skip 1st/7th from itself)',
  }))
  g4.push(rule({
    id: 'm-ul2', group: 'Upapada Lagna (Jaimini)', chart: 'D1', fired: ul2occ.length > 0,
    title: ul2occ.length ? `2nd from Upapada holds ${ul2occ.join(', ')}` : '2nd from Upapada is empty',
    effect: ul2mal.length > ul2ben.length ? 'challenging' : ul2ben.length ? 'supportive' : 'info', weight: ul2ben.length * 0.8 - ul2mal.length * 0.8,
    detail: ul2occ.length ? [ul2ben.length ? `${ul2ben.join(', ')} in the 2nd from Upapada sustain the marriage: continuity and shared resources.` : '', ul2mal.length ? `${ul2mal.join(', ')} here test the continuity of marriage; patience and shared purpose are the remedy.` : ''].filter(Boolean) : ['No planets here; the sustenance of marriage is judged by the Upapada lord.'],
    rule: 'Jaimini Sutras: the 2nd from Upapada shows the sustenance or break of marriage',
  }))

  // Supporting houses.
  const g5: RuleResult[] = []
  const house8occ = occupants(chart, 8), house8mal = house8occ.filter((g) => !isBenefic(g))
  g5.push(rule({
    id: 'm-8th', group: 'Supporting houses', chart: 'D1', fired: house8occ.length > 0 || gender === 'female', title: `8th house (${gender === 'female' ? 'mangalya sthana, ' : ''}longevity of marriage)${house8occ.length ? `: ${house8occ.join(', ')}` : ''}`,
    effect: house8mal.length ? 'mixed' : 'info', weight: -house8mal.length * (gender === 'female' ? 0.8 : 0.4),
    detail: [gender === 'female' ? 'For a woman, classical texts read the 8th house as the mangalya sthana (the bond and the spouse’s longevity).' : 'The 8th house shows shared resources, in-laws and the depth of intimacy.', house8mal.length ? `${house8mal.join(', ')} here bring intensity; strong benefic aspects soften it.` : 'No malefic occupation.'],
    rule: '8th house occupants (malefics add strain)',
  }))
  const l2 = lordOfHouse(chart, 2), p2 = pos(chart, l2)
  g5.push(rule({
    id: 'm-2nd', group: 'Supporting houses', chart: 'D1', title: `2nd house (family life): lord ${l2} ${dignityPhrase(p2.dignity)} in the ${h(p2.house!)}`,
    effect: dignityScore(p2.dignity) >= 1 && ![6, 8, 12].includes(p2.house!) ? 'supportive' : [6, 8, 12].includes(p2.house!) ? 'mixed' : 'info', weight: dignityScore(p2.dignity) * 0.3,
    detail: ['The 2nd house is kutumba, the family you build after marriage.'],
    rule: '2nd lord condition',
  }))
  const l4 = lordOfHouse(chart, 4), p4 = pos(chart, l4)
  g5.push(rule({
    id: 'm-4th', group: 'Supporting houses', chart: 'D1', title: `4th house (domestic happiness): lord ${l4} ${dignityPhrase(p4.dignity)} in the ${h(p4.house!)}`,
    effect: dignityScore(p4.dignity) >= 1 ? 'supportive' : [6, 8, 12].includes(p4.house!) ? 'mixed' : 'info', weight: dignityScore(p4.dignity) * 0.3,
    detail: ['The 4th house is sukha: peace at home and emotional contentment in family life.'],
    rule: '4th lord condition',
  }))
  if (d7.lagnaSign !== null) {
    const s5 = (d7.lagnaSign + 4) % 12, l5 = SIGN_LORD[s5], l5p = vp(d7, l5), jd7 = vp(d7, 'Jupiter')
    g5.push(rule({
      id: 'm-d7', group: 'Supporting houses', chart: 'D7', title: `Children (D7): 5th lord ${l5} ${dignityPhrase(l5p.dignity)} in the ${h(l5p.house!)}; Jupiter ${dignityPhrase(jd7.dignity)}`,
      effect: dignityScore(l5p.dignity) + dignityScore(jd7.dignity) > 0 ? 'supportive' : dignityScore(l5p.dignity) + dignityScore(jd7.dignity) < 0 ? 'mixed' : 'info', weight: 0,
      detail: ['The Saptamsa (D7) shows progeny, the joy of children and your creative legacy within family life.'],
      rule: 'D7 5th lord and Jupiter (putra karaka)',
    }))
  }

  // Mangal dosha from lagna, Moon and Venus.
  const checks: MangalCheck[] = ([['Lagna', L], ['Moon', moon.sign], ['Venus', venus.sign]] as const).map(([from, s]) => {
    const house = houseFrom(s, mars.sign)
    return { from, house, present: [1, 2, 4, 7, 8, 12].includes(house) }
  })
  const cancellations: string[] = []
  if (mars.dignity && GOOD_DIGNITY.includes(mars.dignity)) cancellations.push(`Mars is ${dignityPhrase(mars.dignity)}`)
  const lagnaCheck = checks[0]
  if (lagnaCheck.present && MANGAL_SIGN_EXCEPTIONS[lagnaCheck.house]?.includes(mars.sign)) cancellations.push(`Mars in ${signName(mars.sign)} in the ${h(lagnaCheck.house)} is a classical sign exception`)
  if (aspectsOnGraha(chart, 'Mars').includes('Jupiter') || conjunctWith(chart, 'Mars').includes('Jupiter')) cancellations.push('Jupiter aspects or joins Mars')
  if (conjunctWith(chart, 'Mars').includes('Moon')) cancellations.push('Moon joins Mars (Chandra–Mangala)')
  if ([...occupants(chart, 1), ...occupants(chart, 7)].some((g) => g === 'Jupiter' || g === 'Venus')) cancellations.push('Jupiter or Venus in the 1st or 7th house')
  const anyPresent = checks.some((c) => c.present)
  const mangal = { checks, cancellations, status: (!anyPresent ? 'none' : cancellations.length ? 'cancelled' : 'present') as 'none' | 'present' | 'cancelled' }

  // Timing tendency.
  const factors: TimingFactor[] = []
  const fac = (ok: boolean, label: string, direction: 'early' | 'delay', source: string) => { if (ok) factors.push({ label, direction, source }) }
  fac(!!influencesHouse(chart, 'Saturn', 7), 'Saturn occupies or aspects the 7th house', 'delay', 'D1 7th house')
  fac(!!linked(chart, 'Saturn', l7), `Saturn is linked with the 7th lord ${l7}`, 'delay', 'D1 7th lord')
  fac(!!linked(chart, 'Saturn', 'Venus'), 'Saturn is linked with Venus', 'delay', 'Karaka')
  fac([6, 8, 12].includes(p7.house!), `7th lord in the ${h(p7.house!)}`, 'delay', 'D1 7th lord')
  fac(venus.combust || venus.dignity === 'debilitated', `Venus is ${venus.combust ? 'combust' : 'debilitated'}`, 'delay', 'Karaka')
  fac(conjunctWith(chart, 'Moon').includes('Saturn'), 'Moon–Saturn conjunction (emotional caution)', 'delay', 'D1')
  fac(occupants(chart, 7).some((g) => g === 'Rahu' || g === 'Ketu'), 'Rahu or Ketu in the 7th', 'delay', 'D1 7th house')
  fac(KENDRA.includes(venus.house!) || [5, 9, 11].includes(venus.house!), `Venus well placed in the ${h(venus.house!)}`, 'early', 'Karaka')
  fac(dignityScore(venus.dignity) >= 2, `Venus is ${dignityPhrase(venus.dignity)}`, 'early', 'Karaka')
  fac([1, 2, 7, 11].includes(p7.house!), `7th lord in the ${h(p7.house!)}`, 'early', 'D1 7th lord')
  fac(!!influencesHouse(chart, 'Jupiter', 7) || !!linked(chart, 'Jupiter', l7), 'Jupiter influences the 7th house or its lord', 'early', 'D1')
  fac(!!l1l7 && l1 !== l7, 'Lagna lord and 7th lord linked', 'early', 'D1')
  fac(!!linked(chart, 'Venus', 'Mars'), 'Venus–Mars link (strong attraction)', 'early', 'Karaka')
  const early = factors.filter((f) => f.direction === 'early').length, delay = factors.filter((f) => f.direction === 'delay').length
  const tendency = { label: early - delay >= 2 ? 'Timely or early marriage indicated' : delay - early >= 2 ? 'Marriage tends to come later, after maturity' : 'Average timing: depends on the dashas', early, delay, factors }

  // Love vs arranged.
  const l5 = lordOfHouse(chart, 5), l9 = lordOfHouse(chart, 9)
  const love: string[] = [], arranged: string[] = []
  const l5l7 = linked(chart, l5, l7); if (l5l7 && l5 !== l7) love.push(`5th lord ${l5} and 7th lord ${l7} linked (${l5l7})`)
  if (pos(chart, l5).house === 7) love.push('5th lord in the 7th'); if (p7.house === 5) love.push('7th lord in the 5th')
  const vr = linked(chart, 'Venus', 'Rahu'); if (vr) love.push(`Venus–Rahu link (${vr})`)
  const vm = linked(chart, 'Venus', 'Mars'); if (vm) love.push(`Venus–Mars link (${vm})`)
  const mv = linked(chart, 'Moon', 'Venus'); if (mv) love.push(`Moon–Venus link (${mv})`)
  const l9l7 = linked(chart, l9, l7); if (l9l7 && l9 !== l7) arranged.push(`9th lord ${l9} (family tradition) linked with the 7th lord`)
  const l2l7 = linked(chart, l2, l7); if (l2l7 && l2 !== l7) arranged.push(`2nd lord ${l2} (family) linked with the 7th lord`)
  if (influencesHouse(chart, 'Jupiter', 7)) arranged.push('Jupiter (elders, dharma) influences the 7th')
  if (influencesHouse(chart, 'Saturn', 7)) arranged.push('Saturn (tradition) influences the 7th')

  // Spouse portrait.
  const spouse: SpouseTrait[] = []
  const s7 = (L + 6) % 12
  spouse.push({ text: `${signName(s7)} on the 7th: ${SIGN_TEXT[signName(s7)].keywords.join(', ')}.`, source: 'D1 7th sign' })
  occ7.forEach((g) => spouse.push({ text: `${g} in the 7th: ${SPOUSE_BY_PLANET[g]}.`, source: 'D1 7th house' }))
  spouse.push({ text: `7th lord ${l7} in ${signName(p7.sign)}: the partner may be connected to ${BHAVA[p7.house! - 1].topics.split(',').slice(0, 2).join(' and ')}.`, source: 'D1 7th lord' })
  spouse.push({ text: `Darakaraka ${dk}: ${SPOUSE_BY_PLANET[dk]}.`, source: 'Jaimini' })
  if (d9.lagnaSign !== null) {
    const s = (d9.lagnaSign + 6) % 12
    spouse.push({ text: `D9 7th sign ${signName(s)}: ${SIGN_TEXT[signName(s)].keywords.slice(0, 3).join(', ')}.`, source: 'Navamsa' })
  }
  if (p7.house === 9 || p7.house === 12 || occ7.includes('Rahu')) spouse.push({ text: 'Indications of a partner from a distant place, another culture or abroad.', source: '7th lord in 9th/12th or Rahu in 7th' })

  // Divisional charts relevant to marriage.
  const vargas: MarriageReport['vargas'] = []
  const vv = (n: 1 | 2 | 4 | 7 | 9, code: string, name: string, focus: string, house: number) => {
    const vc = n === 1 ? null : vargaChart(chart, n)
    const lord = n === 1 ? l7 : SIGN_LORD[(vc!.lagnaSign! + house - 1) % 12]
    const p = n === 1 ? { dignity: p7.dignity, house: p7.house } : vp(vc!, lord)
    const s = dignityScore(p.dignity) + (KENDRA.includes(p.house!) || [5, 9, 11].includes(p.house!) ? 1.5 : [6, 8, 12].includes(p.house!) ? -1.5 : 0)
    vargas.push({ code, name, focus, verdict: s >= 2 ? 'strong' : s >= 0 ? 'moderate' : 'weak', detail: `${h(house)} lord ${lord} is ${dignityPhrase(p.dignity)} in the ${h(p.house!)}.` })
  }
  vv(1, 'D1', 'Rashi', 'promise of marriage', 7)
  vv(9, 'D9', 'Navamsa', 'quality of married life', 7)
  vv(7, 'D7', 'Saptamsa', 'children', 5)
  vv(2, 'D2', 'Hora', 'family resources', 2)
  vv(4, 'D4', 'Chaturthamsa', 'home & domestic happiness', 4)

  // Timing: dashas from age 18 onward and double transits over the 7th.
  const periods = vimshottari(moon.lon, chart.utc)
  const adult = new Date(chart.utc.getTime() + 18 * 365.25 * 86400000)
  const from = adult > now ? adult : now
  const weights: Partial<Record<Graha, { w: number; why: string }>> = {}
  weights[l7] = { w: 3, why: '7th lord (marriage)' }
  weights.Venus = weights.Venus ?? { w: 2.5, why: 'Venus, karaka of marriage' }
  if (gender === 'female' && !weights.Jupiter) weights.Jupiter = { w: 2.5, why: 'Jupiter, karaka of the husband' }
  occ7.forEach((g) => (weights[g] = weights[g] ?? { w: 2, why: 'placed in the 7th' }))
  weights[dk] = weights[dk] ?? { w: 2, why: 'Darakaraka (spouse significator)' }
  if (d9.lagnaSign !== null) { const g = SIGN_LORD[(d9.lagnaSign + 6) % 12]; weights[g] = weights[g] ?? { w: 1.5, why: 'D9 7th lord' } }
  ;(['Rahu', 'Ketu'] as Graha[]).forEach((g) => { if ([1, 7].includes(pos(chart, g).house!)) weights[g] = weights[g] ?? { w: 1.5, why: 'node on the 1st/7th axis' } })
  weights[l2] = weights[l2] ?? { w: 1, why: '2nd lord (addition to family)' }
  const significators = Object.keys(weights) as Graha[]
  const dashas = dashaHighlights(periods, weights, from, 15).sort((a, b) => a.start.getTime() - b.start.getTime())
  const windows = doubleTransitWindows(chart, 7, significators, periods, from, 8)

  const groups = [
    { title: '7th house and its lord (from lagna, Moon and Venus)', results: g1 },
    { title: 'Karakas: Venus, Jupiter and the Darakaraka', results: g2 },
    { title: 'Navamsa (D9): the marriage chart', results: g3 },
    { title: 'Upapada Lagna (Jaimini)', results: g4 },
    { title: 'Family, home and children', results: g5 },
  ]
  const score = areaScore(groups.flatMap((g) => g.results))
  const headline = `The 7th lord ${l7} in the ${h(p7.house!)}, ${gender === 'female' ? 'Jupiter and Venus' : 'Venus'} as karaka${gender === 'female' ? 's' : ''}, and a ${signName(s7)} 7th house shape your marriage story. ${tendency.label}.`
  return { gender, score, headline, tendency, style: { love, arranged }, spouse, mangal, groups, vargas, dashas, windows, upapadaSign: ul, darakaraka: dk }
}
