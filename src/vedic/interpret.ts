import { SIGNS, ordinal } from '../astro/constants'
import { SIGN_TEXT } from '../interpret/signs'
import { BHAVA, DIG_BALA, DUSTHANA, GRAHAS, GRAHA_INFO, KENDRA, NAKSHATRAS, RASHI, SIGN_LORD, UPACHAYA, houseFrom, type Graha } from './constants'
import { periodChain, vimshottari, type Period } from './dasha'
import { GOOD_DIGNITY, h, housesRuledBy, isStrongSign, lordOfHouse, pos } from './query'
import { siderealLongitude, signName, vargaChart, type GrahaPos, type VargaChart, type VedicChart, type VedicDignity } from './sidereal'
import { VARGAS, type VargaInfo } from './varga'
import { evaluateYogas, type YogaResult } from './yogas'

export interface VInsight {
  id: string
  title: string
  subtitle?: string
  body: string[]
  rule: string
  /** The concrete chart combinations that produced this reading. */
  basis?: string[]
  lesson?: string
  tone?: 'good' | 'mixed' | 'challenge'
}

export interface VedicReading {
  core: VInsight[]
  grahas: VInsight[]
  lords: VInsight[]
  yogas: YogaResult[]
  vargas: Record<number, VInsight[]>
  vargaCharts: Record<number, VargaChart>
  dashas: Period[]
  dashaInsights: VInsight[]
  dashaThemes: Partial<Record<Graha, string>>
}

const rashi = (i: number) => `${RASHI[signName(i)]} (${signName(i)})`

const DIGNITY_TEXT: Record<VedicDignity, string> = {
  exalted: 'is exalted, its strongest sign. It gives full results for what it signifies.',
  moolatrikona: 'is in its moolatrikona sign. It is strong and acts with authority.',
  own: 'is in its own sign. It is strong and protects the houses it rules.',
  friend: 'is in a friendly sign and gives mostly good results.',
  neutral: 'is in a neutral sign. Its results depend on house placement and aspects.',
  enemy: 'is in an enemy sign. Its results come with some friction or delay.',
  debilitated: 'is debilitated, its weakest sign. Its matters need more effort. Check the Yogas tab for a cancellation (neecha bhanga).',
}

/** Sign summary in reference style: element, quality, lord, keywords. */
function signSummary(sign: number): string {
  const s = SIGNS[sign]
  const quality = { Cardinal: 'movable', Fixed: 'fixed', Mutable: 'dual' }[s.modality]
  return `${rashi(sign)} is a ${s.element.toLowerCase()}, ${quality} sign ruled by ${SIGN_LORD[sign]}. Keywords: ${SIGN_TEXT[s.name].keywords.join(', ')}.`
}

function placementNote(nature: 'benefic' | 'malefic', house: number): { text: string; tone: VInsight['tone'] } {
  if (nature === 'benefic') {
    if ([1, 4, 7, 10, 5, 9].includes(house)) return { tone: 'good', text: 'A natural benefic in a kendra or trikona supports the matters of this house.' }
    if (DUSTHANA.includes(house)) return { tone: 'mixed', text: 'A natural benefic in a dusthana (6th, 8th or 12th) eases that house\'s difficulties, but its own results come with delay or through service, research or retreat.' }
    return { tone: 'good', text: 'A natural benefic here helps these matters grow.' }
  }
  if (UPACHAYA.includes(house)) return { tone: 'good', text: 'Malefics do well in upachaya houses (3, 6, 10, 11). It gives drive and competitive strength that grow with age.' }
  if (DUSTHANA.includes(house)) return { tone: 'mixed', text: 'A natural malefic in a dusthana can overcome that house\'s problems, though experiences here are intense.' }
  return { tone: 'challenge', text: 'A natural malefic here adds pressure and delay to these matters.' }
}

function grahaInsight(chart: VedicChart, g: GrahaPos, d9: VargaChart): VInsight {
  const info = GRAHA_INFO[g.graha]
  const body: string[] = []
  const basis: string[] = [`${g.graha} in ${signName(g.sign)}`]
  const deg = `${Math.floor(g.degree)}°${String(Math.floor((g.degree % 1) * 60)).padStart(2, '0')}′`
  body.push(`${g.graha} (${info.sanskrit}) signifies ${info.karaka}. It is in ${rashi(g.sign)}${g.house ? `, ${h(g.house)} (${BHAVA[g.house - 1].topics})` : ''}.`)
  let tone: VInsight['tone'] = 'mixed'
  if (g.dignity) {
    body.push(`${g.graha} ${DIGNITY_TEXT[g.dignity]}`)
    basis.push(g.dignity)
    if (isStrongSign(g.dignity)) tone = 'good'
    if (g.dignity === 'debilitated') tone = 'challenge'
  }
  if (g.house) {
    const q = placementNote(info.nature, g.house)
    body.push(q.text)
    basis.push(`${info.nature} in the ${h(g.house)}`)
    if (tone === 'mixed') tone = q.tone
    if (DIG_BALA[g.graha] === g.house) {
      body.push(`It has directional strength (dig bala) in the ${h(g.house)}.`)
      basis.push('dig bala')
    }
    const owns = housesRuledBy(chart, g.graha)
    if (owns.length) body.push(`As lord of the ${owns.map(ordinal).join(' and ')} (${owns.map((o) => BHAVA[o - 1].short).join(', ')}), it links those matters to the ${h(g.house)}.`)
  }
  if (g.combust) {
    body.push(`It is combust (within the Sun's orb), which weakens its independent results.`)
    basis.push('combust')
  }
  if (g.retrograde && g.graha !== 'Rahu' && g.graha !== 'Ketu') {
    body.push('Retrograde: strong in motional terms (cheshta bala) but indirect. Results often come after a delay or a second attempt.')
    basis.push('retrograde')
  }
  const nk = NAKSHATRAS[g.nakshatra]
  body.push(`Nakshatra ${nk.name}, pada ${g.pada}, ruled by ${nk.lord}.`)
  const d9p = d9.placements.find((p) => p.graha === g.graha)!
  if (d9p.sign === g.sign) {
    body.push('Vargottama: the same sign in D1 and D9, which makes its results dependable.')
    basis.push('vargottama')
    tone = 'good'
  } else if (d9p.dignity && d9p.dignity !== 'neutral') {
    body.push(`In the navamsa (D9) it is ${d9p.dignity === 'debilitated' ? 'debilitated, so its strength may fade in later years unless supported' : GOOD_DIGNITY.includes(d9p.dignity) ? `${d9p.dignity}, which adds strength that shows with age` : `in a ${d9p.dignity}'s sign`}.`)
    basis.push(`D9 ${d9p.dignity}`)
  }
  return {
    id: `graha-${g.graha}`,
    title: `${g.graha} in ${RASHI[signName(g.sign)]}${g.house ? `, ${h(g.house)}` : ''}`,
    subtitle: `${deg} ${signName(g.sign)}${g.retrograde ? ' · retrograde' : ''} · ${nk.name} ${g.pada}`,
    body, rule: basis.join(' + '), basis, lesson: 'vedic-planets-in-houses', tone,
  }
}

function lordInsight(chart: VedicChart, hse: number): VInsight {
  const lord = lordOfHouse(chart, hse)
  const p = pos(chart, lord)
  const to = p.house!
  const from = BHAVA[hse - 1], dest = BHAVA[to - 1]
  const body = [`The ${h(hse)} (${from.topics}) is ruled by ${lord}, which sits in the ${h(to)} (${dest.topics}).`]
  let tone: VInsight['tone'] = 'mixed'
  let rule = `${ordinal(hse)} lord in the ${h(to)}`
  if (to === hse) { body.push('A lord in its own house protects and strengthens that house.'); tone = 'good' }
  else if (DUSTHANA.includes(hse) && DUSTHANA.includes(to)) { body.push('Viparita principle: a dusthana lord in another dusthana tends to cancel its own harm, so setbacks can turn into gains.'); tone = 'good'; rule += ' (viparita)' }
  else if (KENDRA.includes(to)) { body.push('A kendra placement gives these matters stability and prominence.'); tone = 'good' }
  else if ([5, 9].includes(to)) { body.push('A trikona placement brings these matters good fortune.'); tone = 'good' }
  else if ([3, 11].includes(to)) body.push('An upachaya placement means these matters improve with effort and time.')
  else if (to === 2) body.push('These matters connect with wealth, family and speech.')
  else if (DUSTHANA.includes(to)) { body.push('A dusthana placement brings obstacles or delays to these matters, and resilience through dealing with them.'); tone = 'challenge' }
  if (p.dignity) body.push(`${lord} ${DIGNITY_TEXT[p.dignity]}`)
  if (p.dignity && GOOD_DIGNITY.includes(p.dignity) && tone !== 'good') tone = 'mixed'
  if (p.dignity === 'debilitated' && tone === 'good') tone = 'mixed'
  return {
    id: `lord-${hse}`,
    basis: [`${ordinal(hse)} lord ${lord}`, `in the ${h(to)}`, ...(p.dignity ? [`${lord} ${p.dignity}`] : [])],
    title: `${ordinal(hse)} lord ${lord} in the ${h(to)}`,
    subtitle: `${from.name} to ${dest.name} · ${from.short} to ${dest.short}`,
    body, rule, lesson: 'vedic-grahas-bhavas', tone,
  }
}

function sadeSati(chart: VedicChart, at = new Date()): VInsight {
  const moonSign = pos(chart, 'Moon').sign
  const satSign = Math.floor(siderealLongitude('Saturn', at, chart.settings.ayanamsa) / 30)
  const rel = houseFrom(moonSign, satSign)
  const phase = rel === 12 ? 'first phase' : rel === 1 ? 'peak phase' : rel === 2 ? 'last phase' : null
  return {
    id: 'sade-sati',
    title: phase ? `Sade Sati is running: ${phase}` : 'Sade Sati is not running',
    subtitle: `Transiting Saturn in ${RASHI[signName(satSign)]}, ${ordinal(rel)} from the Moon`,
    basis: [`Saturn in ${signName(satSign)}`, `${ordinal(rel)} from the natal Moon`],
    tone: phase ? 'mixed' : 'good',
    body: phase
      ? ['Saturn is crossing the 12th, 1st and 2nd signs from the natal Moon, a period of about seven and a half years. It brings responsibility, pressure and reality checks, and rewards patience and steady work.']
      : ['Saturn is not in the 12th, 1st or 2nd sign from the natal Moon. Sade Sati recurs about every 30 years.'],
    rule: 'Transiting sidereal Saturn in the 12th, 1st or 2nd sign from the natal Moon',
    lesson: 'vedic-dashas',
  }
}

function dashaText(chart: VedicChart, lord: Graha): string {
  const p = pos(chart, lord)
  const owns = housesRuledBy(chart, lord)
  const parts = [`${lord} (${GRAHA_INFO[lord].karaka})`]
  if (p.house) parts.push(`placed in the ${h(p.house)} (${BHAVA[p.house - 1].topics})`)
  if (owns.length) parts.push(`ruling the ${owns.map(ordinal).join(' and ')} (${owns.map((o) => BHAVA[o - 1].short).join(', ')})`)
  const q = p.dignity === 'debilitated' ? ' Debilitated, so the period asks for patience and effort.' : p.dignity && GOOD_DIGNITY.includes(p.dignity) ? ` ${p.dignity[0].toUpperCase() + p.dignity.slice(1)}, so the period is usually productive.` : ''
  return parts.join(', ') + '.' + q
}

function dashaInsights(chart: VedicChart, periods: Period[]): VInsight[] {
  const [md, ad, pd] = periodChain(periods, new Date(), 3)
  const out: VInsight[] = []
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  if (md) {
    out.push({
      id: 'dasha-current',
      basis: [`${md.lord} mahadasha`, ...(ad ? [`${ad.lord} antardasha`] : []), ...(pd ? [`${pd.lord} pratyantardasha`] : [])],
      title: `${md.lord} mahadasha${ad ? `, ${ad.lord} antardasha` : ''}`,
      subtitle: `${md.lord}: ${fmt(md.start)} to ${fmt(md.end)}${ad ? ` · ${ad.lord}: ${fmt(ad.start)} to ${fmt(ad.end)}` : ''}`,
      body: [
        `Major period: ${dashaText(chart, md.lord)}`,
        ...(ad ? [`Sub-period: ${dashaText(chart, ad.lord)}`] : []),
      ],
      rule: 'Vimshottari dasha from the Moon\'s nakshatra; results follow the lord\'s house, lordship and dignity',
      lesson: 'vedic-dashas', tone: 'mixed',
    })
  }
  out.push(sadeSati(chart))
  return out
}

/** Divisional chart reading: lagna, key houses, karakas, strong and weak planets. */
function vargaInsights(info: VargaInfo, vc: VargaChart, d1: VargaChart): VInsight[] {
  const out: VInsight[] = []
  const P = (g: Graha) => vc.placements.find((p) => p.graha === g)!
  const lesson = 'vedic-vargas'

  if (info.n === 2) {
    const sun = vc.placements.filter((p) => p.sign === 4).map((p) => p.graha)
    const moonH = vc.placements.filter((p) => p.sign === 3).map((p) => p.graha)
    out.push({
      id: 'D2-hora', title: `Hora balance: ${sun.length} in the Sun hora, ${moonH.length} in the Moon hora`,
      subtitle: `Sun (Leo): ${sun.join(', ') || 'none'} · Moon (Cancer): ${moonH.join(', ') || 'none'}`,
      basis: [`Sun hora: ${sun.join(', ') || 'none'}`, `Moon hora: ${moonH.join(', ') || 'none'}`],
      body: [
        sun.length > moonH.length
          ? 'The Sun hora dominates: wealth comes mainly through one\'s own effort, position and visible work.'
          : moonH.length > sun.length
            ? 'The Moon hora dominates: wealth comes mainly through accumulation, family, the public and support from others.'
            : 'The two horas are balanced: wealth comes through both effort and accumulation.',
        `Benefics in the Moon hora and malefics in the Sun hora are traditionally best. Jupiter, the karaka of wealth, is in the ${P('Jupiter').sign === 3 ? 'Moon' : 'Sun'} hora.`,
      ],
      rule: 'Parashari hora: each sign halved into Sun (Leo) and Moon (Cancer) horas', lesson, tone: 'mixed',
    })
    return out
  }

  if (vc.lagnaSign !== null) {
    const lagLord = SIGN_LORD[vc.lagnaSign]
    const ll = P(lagLord)
    out.push({
      id: `${info.code}-lagna`,
      basis: [`${info.code} lagna ${RASHI[signName(vc.lagnaSign)]}`, `lord ${lagLord} in the ${h(ll.house!)}`, ...(ll.dignity ? [`${lagLord} ${ll.dignity}`] : [])],
      title: `${info.code} lagna ${RASHI[signName(vc.lagnaSign)]}, lord ${lagLord} in the ${h(ll.house!)}`,
      subtitle: `${info.name}: ${info.domain}`,
      body: [
        `The ${info.name} lagna is ${signName(vc.lagnaSign)} (${SIGN_TEXT[signName(vc.lagnaSign)].keywords.slice(0, 3).join(', ')}).`,
        `Its lord ${lagLord} in the ${h(ll.house!)} directs this area towards ${BHAVA[ll.house! - 1].topics}${ll.dignity ? `; it is ${ll.dignity} there` : ''}.`,
      ],
      rule: `${info.code} lagna and its lord's house`, lesson,
      tone: ll.dignity && GOOD_DIGNITY.includes(ll.dignity) ? 'good' : ll.dignity === 'debilitated' || DUSTHANA.includes(ll.house!) ? 'challenge' : 'mixed',
    })
    for (const kh of info.keyHouses.filter((x) => x !== 1)) {
      const sign = (vc.lagnaSign + kh - 1) % 12
      const lord = SIGN_LORD[sign]
      const lp = P(lord)
      const occ = vc.placements.filter((p) => p.house === kh).map((p) => p.graha)
      const ben = occ.filter((g) => GRAHA_INFO[g].nature === 'benefic')
      const mal = occ.filter((g) => GRAHA_INFO[g].nature === 'malefic')
      const good = (lp.dignity && GOOD_DIGNITY.includes(lp.dignity)) || KENDRA.includes(lp.house!) || [5, 9, 11].includes(lp.house!)
      const bad = lp.dignity === 'debilitated' || DUSTHANA.includes(lp.house!)
      out.push({
        id: `${info.code}-house-${kh}`,
        title: `${info.code} ${h(kh)}: ${BHAVA[kh - 1].short}`,
        subtitle: `${RASHI[signName(sign)]} · lord ${lord} in the ${h(lp.house!)}${lp.dignity ? ` (${lp.dignity})` : ''}${occ.length ? ` · occupied by ${occ.join(', ')}` : ''}`,
        basis: [`${ordinal(kh)} lord ${lord} in the ${h(lp.house!)}`, ...(lp.dignity ? [`${lord} ${lp.dignity}`] : []), ...occ.map((g) => `${g} in the ${h(kh)}`)],
        body: [
          `The ${h(kh)} of the ${info.name} relates to ${info.domain}. Its lord ${lord} ${good && !bad ? 'is well placed, which supports these matters' : bad ? 'is in a difficult position, so results need more time and effort' : 'is moderately placed; results depend on the dashas'}.`,
          ...(ben.length ? [`${ben.join(' and ')} in this house ${ben.length > 1 ? 'support' : 'supports'} it.`] : []),
          ...(mal.length ? [`${mal.join(' and ')} here ${mal.length > 1 ? 'add' : 'adds'} pressure, along with drive.`] : []),
        ],
        rule: `${info.code}: ${ordinal(kh)} lord placement and occupants`, lesson,
        tone: good && !bad ? 'good' : bad ? 'challenge' : 'mixed',
      })
    }
  }

  const karakaNotes = info.karakas.map((k) => {
    const p = P(k as Graha)
    return `${k} ${p.dignity ?? 'placed'} in ${signName(p.sign)}${p.house ? ` (${h(p.house)})` : ''}`
  })
  const strongP = vc.placements.filter((p) => p.dignity && GOOD_DIGNITY.includes(p.dignity)).map((p) => `${p.graha} (${p.dignity})`)
  const weak = vc.placements.filter((p) => p.dignity === 'debilitated').map((p) => p.graha)
  const body = [
    ...(karakaNotes.length ? [`Karakas for this chart: ${karakaNotes.join('; ')}.`] : []),
    strongP.length ? `Strong: ${strongP.join(', ')}. ${strongP.length > 1 ? 'Their dashas tend' : 'Its dasha tends'} to give good results for ${info.domain}.` : 'No planet is in its own or exaltation sign here, so results rely on the D1 promise and the dashas.',
    ...(weak.length ? [`Weak: ${weak.join(', ')} (debilitated). Their periods need more effort in this area.`] : []),
  ]
  if (info.n === 9) {
    const vargottama = d1.placements.filter((p) => P(p.graha).sign === p.sign).map((p) => p.graha)
    if (vargottama.length) body.push(`Vargottama (same sign in D1 and D9): ${vargottama.join(', ')}.`)
    const improved = d1.placements.filter((p) => p.dignity === 'debilitated' && GOOD_DIGNITY.includes(P(p.graha).dignity ?? 'neutral')).map((p) => p.graha)
    if (improved.length) body.push(`${improved.join(', ')} ${improved.length > 1 ? 'are' : 'is'} debilitated in D1 but strong in D9: weakness early that becomes strength later.`)
  }
  out.push({
    id: `${info.code}-strength`,
    basis: [...strongP.map((x) => `${x} in ${info.code}`), ...weak.map((x) => `${x} debilitated in ${info.code}`)].slice(0, 6),
    title: `${info.code} planetary strength`, subtitle: 'Karakas and sign dignities', body,
    rule: `${info.code} sign dignities of all grahas`, lesson,
    tone: strongP.length > weak.length ? 'good' : weak.length > strongP.length ? 'challenge' : 'mixed',
  })
  return out
}

export function interpretVedic(chart: VedicChart): VedicReading {
  const vargaCharts: Record<number, VargaChart> = {}
  for (const v of VARGAS) vargaCharts[v.n] = vargaChart(chart, v.n)
  const d1 = vargaCharts[1], d9 = vargaCharts[9]
  const moon = pos(chart, 'Moon')
  const nk = NAKSHATRAS[moon.nakshatra]

  const core: VInsight[] = []
  if (chart.lagnaSign !== null) {
    const lord = SIGN_LORD[chart.lagnaSign]
    const lp = pos(chart, lord)
    core.push({
      id: 'core-lagna', title: `Lagna: ${rashi(chart.lagnaSign)}`, subtitle: `Lagna lord ${lord} in the ${h(lp.house!)}`,
      basis: [`Lagna ${RASHI[signName(chart.lagnaSign)]}`, `lagna lord ${lord}`, `${lord} in the ${h(lp.house!)}`, ...(lp.dignity ? [`${lord} ${lp.dignity}`] : [])],
      body: [
        `The lagna (ascendant) describes the body, temperament and general direction of life. ${signSummary(chart.lagnaSign)}`,
        `Its lord ${lord} is in the ${h(lp.house!)}, so the life focus turns to ${BHAVA[lp.house! - 1].topics}.${lp.dignity ? ` ${lord} ${DIGNITY_TEXT[lp.dignity]}` : ''}`,
      ],
      rule: 'Sidereal ascendant sign and the placement of its lord', lesson: 'vedic-intro', tone: lp.dignity === 'debilitated' || DUSTHANA.includes(lp.house!) ? 'mixed' : 'good',
    })
  }
  core.push({
    id: 'core-moon', title: `Moon sign (rashi): ${rashi(moon.sign)}`, subtitle: 'Used for transits and daily predictions',
    basis: [`Moon in ${RASHI[signName(moon.sign)]}`, ...(moon.dignity ? [`Moon ${moon.dignity}`] : []), ...(moon.house ? [`Moon in the ${h(moon.house)}`] : [])],
    body: [
      `The Moon describes the mind and emotional responses. ${signSummary(moon.sign)}`,
      'Many Indian traditions also read the chart from the Moon as a second lagna (Chandra lagna).',
    ],
    rule: 'Sidereal sign of the Moon', lesson: 'vedic-intro', tone: moon.dignity === 'debilitated' ? 'challenge' : moon.dignity && GOOD_DIGNITY.includes(moon.dignity) ? 'good' : 'mixed',
  })
  core.push({
    id: 'core-nakshatra', title: `Birth star: ${nk.name}, pada ${moon.pada}`, subtitle: `Lord ${nk.lord} · deity ${nk.deity} · symbol ${nk.symbol}`,
    basis: [`Moon in ${nk.name}`, `pada ${moon.pada}`, `star lord ${nk.lord}`],
    body: [
      `${nk.name} is associated with ${nk.keywords}.`,
      `Its lord ${nk.lord} rules the first Vimshottari dasha of life.`,
    ],
    rule: 'Nakshatra (13°20′ lunar mansion) occupied by the Moon', lesson: 'vedic-nakshatras', tone: 'mixed',
  })

  const grahaIns = GRAHAS.map((g) => grahaInsight(chart, pos(chart, g), d9))
  const lords = chart.lagnaSign === null ? [] : Array.from({ length: 12 }, (_, i) => lordInsight(chart, i + 1))
  const vargas: Record<number, VInsight[]> = {}
  for (const v of VARGAS) if (v.n !== 1) vargas[v.n] = vargaInsights(v, vargaCharts[v.n], d1)
  const dashas = vimshottari(moon.lon, chart.utc)

  return {
    core, grahas: grahaIns, lords, yogas: evaluateYogas(chart), vargas, vargaCharts, dashas,
    dashaInsights: dashaInsights(chart, dashas),
    dashaThemes: Object.fromEntries(GRAHAS.map((g) => [g, dashaText(chart, g)])),
  }
}
