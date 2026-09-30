import { ordinal } from '../astro/constants'
import { longitudeOf } from '../astro/ephemeris'
import { SIGN_TEXT } from '../interpret/signs'
import {
  BHAVA, DIG_BALA, DUSTHANA, GRAHAS, GRAHA_INFO, KENDRA, NAKSHATRAS, RASHI, SEVEN, SIGN_LORD, UPACHAYA,
  houseFrom, type Graha,
} from './constants'
import { currentPeriods, vimshottari, type Period } from './dasha'
import { lahiriAyanamsa, signName, vargaChart, type GrahaPos, type VargaChart, type VedicChart, type VedicDignity } from './sidereal'
import { VARGAS, type VargaInfo, type VargaN } from './varga'

export interface VInsight {
  id: string
  title: string
  subtitle?: string
  body: string[]
  rule: string
  lesson?: string
  tone?: 'good' | 'mixed' | 'challenge'
}

export interface LifeArea { label: string; code: string; score: number; verdict: string; rule: string }

export interface VedicReading {
  core: VInsight[]
  grahas: VInsight[]
  lords: VInsight[]
  yogas: VInsight[]
  vargas: Record<number, VInsight[]>
  vargaCharts: Record<number, VargaChart>
  dashas: Period[]
  dashaInsights: VInsight[]
  dashaThemes: Partial<Record<Graha, string>>
  lifeAreas: LifeArea[]
}

const rashi = (i: number) => `${RASHI[signName(i)]} (${signName(i)})`
const h = (n: number) => `${ordinal(n)} house`
const DIGNITY_TEXT: Record<VedicDignity, string> = {
  exalted: 'is exalted (uchcha): at its most powerful, it gives excellent results for everything it signifies.',
  moolatrikona: 'is in its moolatrikona sign: very strong, it acts with authority, like a leader in their own office.',
  own: 'is in its own sign (swakshetra): comfortable and strong, it protects the houses it rules.',
  friend: 'is in a friendly sign: well supported, it gives mostly good results.',
  neutral: 'is in a neutral sign: its results depend largely on house placement and aspects.',
  enemy: 'is in an enemy’s sign: it works under strain, so its results come with some friction or delay.',
  debilitated: 'is debilitated (neecha): its natural qualities are weakened, and these areas require conscious effort. Check below for neecha bhanga (cancellation).',
}
const GOOD: VedicDignity[] = ['exalted', 'moolatrikona', 'own']

function lordsOf(chart: VedicChart, graha: Graha): number[] {
  if (chart.lagnaSign === null) return []
  const out: number[] = []
  for (let hse = 1; hse <= 12; hse++) if (SIGN_LORD[(chart.lagnaSign + hse - 1) % 12] === graha) out.push(hse)
  return out
}

function houseLord(chart: VedicChart, hse: number): Graha {
  return SIGN_LORD[(chart.lagnaSign! + hse - 1) % 12]
}

function pos(chart: VedicChart, g: Graha): GrahaPos {
  return chart.grahas.find((x) => x.graha === g)!
}

function associated(chart: VedicChart, a: Graha, b: Graha): 'conjunction' | 'exchange' | null {
  const pa = pos(chart, a), pb = pos(chart, b)
  if (a === b) return null
  if (pa.sign === pb.sign) return 'conjunction'
  if (SIGN_LORD[pa.sign] === b && SIGN_LORD[pb.sign] === a) return 'exchange'
  return null
}

function houseQuality(nature: 'benefic' | 'malefic', house: number): { text: string; tone: VInsight['tone'] } {
  if (nature === 'benefic') {
    if ([1, 4, 7, 10, 5, 9].includes(house)) return { tone: 'good', text: 'A natural benefic in a kendra or trikona is one of the most supportive placements: it protects and blesses this area of life.' }
    if (DUSTHANA.includes(house)) return { tone: 'mixed', text: 'A natural benefic in a dusthana (6th, 8th or 12th) softens the difficulties of that house, but its own gifts are harder to access or come through service, research or solitude.' }
    return { tone: 'good', text: 'A natural benefic here brings growth and support to these matters.' }
  }
  if (UPACHAYA.includes(house)) return { tone: 'good', text: 'Malefics do well in upachaya houses (3, 6, 10, 11): this planet gives drive and competitive strength that grow with age.' }
  if (DUSTHANA.includes(house)) return { tone: 'mixed', text: 'A natural malefic in a dusthana can fight the problems of that house, although it may also bring intense experiences here.' }
  return { tone: 'challenge', text: 'A natural malefic here adds pressure and friction to these matters, creating challenges that demand maturity and effort.' }
}

function grahaInsight(chart: VedicChart, g: GrahaPos, d9: VargaChart): VInsight {
  const info = GRAHA_INFO[g.graha]
  const body: string[] = []
  const rules: string[] = [`${g.graha} in ${signName(g.sign)}`]
  const deg = `${Math.floor(g.degree)}°${String(Math.floor((g.degree % 1) * 60)).padStart(2, '0')}′`
  body.push(`${info.sanskrit}, significator of ${info.karaka}, is in ${rashi(g.sign)}${g.house ? `, in the ${h(g.house)} (${BHAVA[g.house - 1].name}: ${BHAVA[g.house - 1].topics})` : ''}.`)
  let tone: VInsight['tone'] = 'mixed'
  if (g.dignity) {
    body.push(`${g.graha} ${DIGNITY_TEXT[g.dignity]}`)
    rules.push(`dignity: ${g.dignity}`)
    if (GOOD.includes(g.dignity)) tone = 'good'
    if (g.dignity === 'debilitated') tone = 'challenge'
  }
  if (g.house) {
    const q = houseQuality(info.nature, g.house)
    body.push(q.text)
    rules.push(`${info.nature} in ${h(g.house)}`)
    if (tone === 'mixed') tone = q.tone
    if (DIG_BALA[g.graha] === g.house) {
      body.push(`${g.graha} has directional strength (dig bala) in the ${h(g.house)}, which is one of the strongest positions it can occupy.`)
      rules.push('dig bala')
    }
    const owns = lordsOf(chart, g.graha)
    if (owns.length) {
      body.push(`As lord of the ${owns.map(ordinal).join(' and ')} house${owns.length > 1 ? 's' : ''} (${owns.map((o) => BHAVA[o - 1].short).join(', ')}), it links those matters to where it sits.`)
    }
  }
  if (g.combust) {
    body.push(`${g.graha} is combust (asta), too close to the Sun, so its significations can be overshadowed by ego or authority figures and need conscious expression.`)
    rules.push('combust')
  }
  if (g.retrograde && g.graha !== 'Rahu' && g.graha !== 'Ketu') {
    body.push(`Retrograde (vakri): in Jyotish a retrograde planet is considered strong (cheshta bala) but unconventional. Its results often come after revisiting or through a non-standard route.`)
    rules.push('retrograde')
  }
  const nk = NAKSHATRAS[g.nakshatra]
  body.push(`Nakshatra: ${nk.name} pada ${g.pada}, ruled by ${nk.lord}. It adds a ${nk.keywords} flavour.`)
  const d9p = d9.placements.find((p) => p.graha === g.graha)!
  if (d9p.sign === g.sign) {
    body.push(`Vargottama: it occupies the same sign in D1 and D9 (Navamsa), which greatly strengthens it and makes its promise reliable.`)
    rules.push('vargottama')
    tone = 'good'
  } else if (d9p.dignity && d9p.dignity !== 'neutral') {
    body.push(`In the Navamsa (D9) it is ${d9p.dignity === 'debilitated' ? 'debilitated, so its strength may fade later in life unless supported' : GOOD.includes(d9p.dignity) ? `${d9p.dignity}, a sign of inner strength that shows more with age` : `in a ${d9p.dignity}’s sign`}.`)
    rules.push(`D9 ${d9p.dignity}`)
  }
  return {
    id: `graha-${g.graha}`,
    title: `${g.graha} (${info.sanskrit}) in ${RASHI[signName(g.sign)]}${g.house ? ` · ${h(g.house)}` : ''}`,
    subtitle: `${deg} ${signName(g.sign)}${g.retrograde ? ' · ℞' : ''} · ${nk.name} ${g.pada}`,
    body, rule: rules.join(' + '), lesson: 'vedic-planets-in-houses', tone,
  }
}

function lordInsight(chart: VedicChart, hse: number): VInsight {
  const lord = houseLord(chart, hse)
  const p = pos(chart, lord)
  const to = p.house!
  const from = BHAVA[hse - 1], dest = BHAVA[to - 1]
  const body = [`The matters of the ${h(hse)} (${from.topics}) are carried by ${lord} into the ${h(to)} (${dest.topics}).`]
  let tone: VInsight['tone'] = 'mixed'
  let rule = `${ordinal(hse)} lord in ${h(to)}`
  if (to === hse) { body.push('The lord in its own house protects and strengthens these matters. They are a dependable part of life.'); tone = 'good' }
  else if (DUSTHANA.includes(hse) && DUSTHANA.includes(to)) { body.push('Viparita principle: a dusthana lord in another dusthana tends to destroy its own negativity, turning setbacks into unexpected gains.'); tone = 'good'; rule += ' (viparita)' }
  else if (KENDRA.includes(to)) { body.push('A kendra placement gives these matters stability, visibility and a central role in your life.'); tone = 'good' }
  else if ([5, 9].includes(to)) { body.push('A trikona placement blesses these matters with fortune, grace and ease.'); tone = 'good' }
  else if ([3, 11].includes(to)) body.push('An upachaya placement means these matters improve steadily with personal effort and time.')
  else if (to === 2) body.push('Linked with the 2nd house, these matters connect with wealth, family and speech.')
  else if (DUSTHANA.includes(to)) { body.push('A dusthana placement brings obstacles, delays or intensity to these matters, but also depth and resilience. Remedies and effort pay off here.'); tone = 'challenge' }
  if (p.dignity) body.push(`${lord} ${DIGNITY_TEXT[p.dignity]}`)
  if (p.dignity && GOOD.includes(p.dignity) && tone !== 'good') tone = 'mixed'
  if (p.dignity === 'debilitated' && tone === 'good') tone = 'mixed'
  return {
    id: `lord-${hse}`,
    title: `${ordinal(hse)} lord ${lord} in the ${h(to)}`,
    subtitle: `${from.name} → ${dest.name} · ${from.short} → ${dest.short}`,
    body, rule, lesson: 'vedic-grahas-bhavas', tone,
  }
}

function yogas(chart: VedicChart): VInsight[] {
  const out: VInsight[] = []
  const P = (g: Graha) => pos(chart, g)
  const moon = P('Moon')
  const fromMoon = (g: Graha) => houseFrom(moon.sign, P(g).sign)

  // Gajakesari: Jupiter in a kendra from the Moon.
  if (KENDRA.includes(fromMoon('Jupiter'))) out.push({
    id: 'yoga-gajakesari', title: 'Gajakesari Yoga', tone: 'good', lesson: 'vedic-yogas',
    subtitle: `Jupiter is ${h(fromMoon('Jupiter'))} from the Moon`,
    body: ['The “elephant-lion” combination gives intelligence, good reputation, generosity and the ability to overcome opposition. Its strength depends on Jupiter’s dignity' + ` (here: ${P('Jupiter').dignity}).`],
    rule: 'Jupiter in 1st, 4th, 7th or 10th from the Moon',
  })
  if (P('Sun').sign === P('Mercury').sign) out.push({
    id: 'yoga-budhaditya', title: 'Budhaditya Yoga', tone: 'good', lesson: 'vedic-yogas',
    subtitle: `Sun and Mercury together in ${RASHI[signName(P('Sun').sign)]}`,
    body: ['The Sun and Mercury combine, giving sharp intelligence, analytical skill and good communication, which is valuable in education, business and administration.' + (P('Mercury').combust ? ' Mercury is combust here, so the yoga works best when you consciously give your own ideas space.' : '')],
    rule: 'Sun and Mercury in the same sign',
  })
  if (moon.sign === P('Mars').sign) out.push({
    id: 'yoga-chandra-mangala', title: 'Chandra–Mangala Yoga', tone: 'good', lesson: 'vedic-yogas',
    subtitle: 'Moon and Mars together',
    body: ['Emotion and drive combine, giving enterprise, a strong earning capacity and a determined, passionate temperament.'],
    rule: 'Moon and Mars in the same sign',
  })

  if (chart.lagnaSign !== null) {
    // Pancha Mahapurusha.
    const MP: Partial<Record<Graha, [string, string]>> = {
      Mars: ['Ruchaka', 'courage, leadership, physical strength and command'],
      Mercury: ['Bhadra', 'intellect, eloquence, business skill and learning'],
      Jupiter: ['Hamsa', 'wisdom, righteousness, respect and spiritual refinement'],
      Venus: ['Malavya', 'beauty, charm, artistic talent, comfort and a happy marriage'],
      Saturn: ['Shasha', 'discipline, authority over people and organisations, endurance'],
    }
    for (const [g, [name, gift]] of Object.entries(MP) as [Graha, [string, string]][]) {
      const p = P(g)
      if (p.house && KENDRA.includes(p.house) && p.dignity && GOOD.includes(p.dignity)) out.push({
        id: `yoga-${name}`, title: `${name} Yoga (Pancha Mahapurusha)`, tone: 'good', lesson: 'vedic-yogas',
        subtitle: `${g} ${p.dignity} in the ${h(p.house)}`,
        body: [`One of the five “great person” yogas. A strong ${g} in a kendra gives ${gift}. It is a signature strength of this chart.`],
        rule: `${g} in own, moolatrikona or exaltation sign in a kendra from the lagna`,
      })
    }

    // Raja yogas: kendra lord + trikona lord associated.
    const seen = new Set<string>()
    for (const k of [1, 4, 7, 10]) for (const t of [1, 5, 9]) {
      if (k === t) continue
      const a = houseLord(chart, k), b = houseLord(chart, t)
      const how = associated(chart, a, b)
      const key = [a, b].sort().join()
      if (how && !seen.has(key)) {
        seen.add(key)
        out.push({
          id: `yoga-raja-${key}`, title: 'Raja Yoga', tone: 'good', lesson: 'vedic-yogas',
          subtitle: `${ordinal(k)} lord ${a} + ${ordinal(t)} lord ${b} (${how})`,
          body: [`The lord of a kendra (action and effort) joins the lord of a trikona (fortune and grace). This is the classic combination for rise in status, success and recognition, and it activates especially during the dashas of ${a} and ${b}.`],
          rule: 'Kendra lord and trikona lord in conjunction or sign exchange',
        })
      }
    }
    // Yogakaraka.
    for (const g of SEVEN) {
      const owns = lordsOf(chart, g)
      if (owns.some((x) => [4, 7, 10].includes(x)) && owns.some((x) => [5, 9].includes(x))) out.push({
        id: `yoga-karaka-${g}`, title: `${g} is your Yogakaraka`, tone: 'good', lesson: 'vedic-yogas',
        subtitle: `Rules the ${owns.map(ordinal).join(' and ')} houses`,
        body: [`A single planet ruling both a kendra and a trikona is the most auspicious planet for this lagna. ${g}’s periods and placement (the ${h(P(g).house!)}) are key to your success.`],
        rule: 'One planet owning both a kendra (4/7/10) and a trikona (5/9)',
      })
    }
    // Dhana yoga.
    const dseen = new Set<string>()
    for (const w of [2, 11]) for (const t of [1, 5, 9]) {
      const a = houseLord(chart, w), b = houseLord(chart, t)
      const how = associated(chart, a, b)
      const key = [a, b].sort().join()
      if (how && !dseen.has(key)) {
        dseen.add(key)
        out.push({
          id: `yoga-dhana-${key}`, title: 'Dhana Yoga', tone: 'good', lesson: 'vedic-yogas',
          subtitle: `${ordinal(w)} lord ${a} + ${ordinal(t)} lord ${b} (${how})`,
          body: ['A wealth combination: the lords of income houses associate with the lords of fortune. It indicates good earning potential, especially in the dashas of these planets.'],
          rule: 'Lord of 2nd/11th in conjunction or exchange with lord of 1st/5th/9th',
        })
      }
    }
    // Viparita Raja Yoga.
    const VRY: Record<number, string> = { 6: 'Harsha', 8: 'Sarala', 12: 'Vimala' }
    for (const d of [6, 8, 12]) {
      const l = houseLord(chart, d)
      const at = P(l).house!
      if (DUSTHANA.includes(at) && at !== d) out.push({
        id: `yoga-vry-${d}`, title: `${VRY[d]} Yoga (Viparita Raja Yoga)`, tone: 'good', lesson: 'vedic-yogas',
        subtitle: `${ordinal(d)} lord ${l} in the ${h(at)}`,
        body: ['Success through adversity: difficulties tend to cancel each other out, and crises or rivals end up working in your favour.'],
        rule: 'Lord of 6th, 8th or 12th placed in another dusthana',
      })
    }
    // Mangal dosha.
    const mars = P('Mars')
    if ([1, 2, 4, 7, 8, 12].includes(mars.house!)) {
      const cancelled = mars.dignity === 'own' || mars.dignity === 'exalted' || mars.dignity === 'moolatrikona'
      out.push({
        id: 'dosha-mangal', title: `Mangal (Kuja) Dosha${cancelled ? ': largely cancelled' : ''}`, tone: cancelled ? 'mixed' : 'challenge', lesson: 'vedic-yogas',
        subtitle: `Mars in the ${h(mars.house!)}`,
        body: [
          'Mars in this house adds fire and intensity to partnership matters: strong passion, but also a tendency toward arguments or impatience in marriage.',
          cancelled ? 'Mars is strong in its own or exaltation sign here, which traditional texts treat as a cancellation.' : 'It is traditionally matched with a partner who has a similar Mars placement. Many cancellation rules exist; the effect is usually overstated.',
        ],
        rule: 'Mars in 1st, 2nd, 4th, 7th, 8th or 12th from the lagna',
      })
    }
  }

  // Parivartana (sign exchange).
  for (let i = 0; i < SEVEN.length; i++) for (let j = i + 1; j < SEVEN.length; j++) {
    const a = SEVEN[i], b = SEVEN[j]
    if (associated(chart, a, b) === 'exchange') {
      const ha = P(a).house, hb = P(b).house
      const kind = ha && hb ? ([ha, hb].some((x) => DUSTHANA.includes(x)) ? 'Dainya' : [ha, hb].includes(3) ? 'Khala' : 'Maha') : ''
      out.push({
        id: `yoga-parivartana-${a}-${b}`, title: `${kind ? kind + ' ' : ''}Parivartana Yoga`, tone: kind === 'Dainya' ? 'mixed' : 'good', lesson: 'vedic-yogas',
        subtitle: `${a} and ${b} exchange signs`,
        body: [`${a} sits in ${b}’s sign and ${b} in ${a}’s, so the two planets act as if each were in its own home, binding the ${ha ? h(ha) : 'houses'} and ${hb ? h(hb) : ''} together.${kind === 'Maha' ? ' An exchange between good houses is very auspicious.' : kind === 'Dainya' ? ' Involving a dusthana, it can bring early struggles that later become strength.' : ''}`],
        rule: 'Two planets in each other’s signs',
      })
    }
  }

  // Moon-based yogas (Sun, Rahu, Ketu excluded).
  const others: Graha[] = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
  const in2 = others.filter((g) => fromMoon(g) === 2)
  const in12 = others.filter((g) => fromMoon(g) === 12)
  if (in2.length && in12.length) out.push({ id: 'yoga-durdhara', title: 'Durdhara Yoga', tone: 'good', lesson: 'vedic-yogas', subtitle: `${[...in2, ...in12].join(', ')} flank the Moon`, body: ['Planets on both sides of the Moon support the mind, giving resources, generosity and emotional stability.'], rule: 'Planets (except Sun, Rahu, Ketu) in both the 2nd and 12th from the Moon' })
  else if (in2.length) out.push({ id: 'yoga-sunapha', title: 'Sunapha Yoga', tone: 'good', lesson: 'vedic-yogas', subtitle: `${in2.join(', ')} in the 2nd from the Moon`, body: ['Self-earned wealth, intelligence and a good reputation built by your own effort.'], rule: 'Planets (except Sun, Rahu, Ketu) in the 2nd from the Moon' })
  else if (in12.length) out.push({ id: 'yoga-anapha', title: 'Anapha Yoga', tone: 'good', lesson: 'vedic-yogas', subtitle: `${in12.join(', ')} in the 12th from the Moon`, body: ['Good health, dignified manners, and comfort with solitude and spiritual life.'], rule: 'Planets (except Sun, Rahu, Ketu) in the 12th from the Moon' })
  else {
    const kendraFromLagna = chart.lagnaSign !== null && others.some((g) => KENDRA.includes(P(g).house!))
    const withMoon = others.some((g) => P(g).sign === moon.sign)
    const cancelled = kendraFromLagna || withMoon
    out.push({
      id: 'yoga-kemadruma', title: `Kemadruma Yoga${cancelled ? ': cancelled' : ''}`, tone: cancelled ? 'mixed' : 'challenge', lesson: 'vedic-yogas',
      subtitle: 'No planets on either side of the Moon',
      body: [cancelled
        ? 'The Moon has no neighbours, which can bring phases of feeling emotionally unsupported, but it is cancelled by planets in kendras or conjunct the Moon. Expect self-reliance rather than hardship.'
        : 'The Moon stands alone, which can bring phases of loneliness or financial ups and downs. Building supportive routines and relationships is the traditional remedy.'],
      rule: 'No planets (except Sun, Rahu, Ketu) in 2nd or 12th from the Moon',
    })
  }

  // Neecha bhanga.
  for (const g of SEVEN) {
    const p = P(g)
    if (p.dignity !== 'debilitated') continue
    const dispositor = SIGN_LORD[p.sign]
    const d = P(dispositor)
    const inKendra = (x: GrahaPos) => (x.house !== null && KENDRA.includes(x.house)) || KENDRA.includes(houseFrom(moon.sign, x.sign))
    if (inKendra(d)) out.push({
      id: `yoga-neecha-bhanga-${g}`, title: `Neecha Bhanga: ${g}’s debilitation is cancelled`, tone: 'good', lesson: 'vedic-yogas',
      subtitle: `Dispositor ${dispositor} is in a kendra`,
      body: [`${g} is debilitated, but its sign lord ${dispositor} is in a kendra from the lagna or Moon. This is a classic cancellation: an early weakness can turn into notable strength, sometimes even a rise from humble beginnings.`],
      rule: 'Debilitated planet whose dispositor is in a kendra from lagna or Moon',
    })
  }

  // Kaal Sarp (modern).
  const rahu = P('Rahu').lon
  const between = SEVEN.map((g) => ((P(g).lon - rahu + 360) % 360) < 180)
  if (between.every(Boolean) || between.every((x) => !x)) out.push({
    id: 'dosha-kaal-sarp', title: 'Kaal Sarp configuration', tone: 'mixed', lesson: 'vedic-yogas',
    subtitle: 'All planets on one side of the Rahu–Ketu axis',
    body: ['All seven planets fall on one side of the nodal axis. Modern astrologers associate this with intense focus, karmic themes and sudden ups and downs. Note that it does not appear in the classical texts (BPHS), so treat it lightly.'],
    rule: 'All seven planets between Rahu and Ketu',
  })

  return out
}

function sadeSati(chart: VedicChart, at = new Date()): VInsight {
  const moonSign = pos(chart, 'Moon').sign
  const sat = (longitudeOf('Saturn', at) - lahiriAyanamsa(at) + 360) % 360
  const rel = houseFrom(moonSign, Math.floor(sat / 30))
  const phase = rel === 12 ? 'rising (first) phase' : rel === 1 ? 'peak (second) phase' : rel === 2 ? 'setting (third) phase' : null
  return {
    id: 'sade-sati',
    title: phase ? `Sade Sati is active: ${phase}` : 'Sade Sati is not active',
    subtitle: `Transiting Saturn in ${RASHI[signName(Math.floor(sat / 30))]}, ${h(rel)} from your Moon`,
    tone: phase ? 'mixed' : 'good',
    body: phase
      ? ['Saturn is moving through the 12th, 1st and 2nd signs from your natal Moon, a roughly 7½-year period of maturing through responsibility, pressure and reality checks. It rewards patience, discipline and simplicity, and many people make their most solid achievements during it.']
      : ['Saturn is not currently transiting the 12th, 1st or 2nd sign from your Moon. Sade Sati recurs roughly every 30 years.'],
    rule: 'Current sidereal Saturn in 12th/1st/2nd sign from the natal Moon',
    lesson: 'vedic-dashas',
  }
}

function dashaText(chart: VedicChart, lord: Graha): string {
  const p = pos(chart, lord)
  const owns = lordsOf(chart, lord)
  const parts = [`${lord} (${GRAHA_INFO[lord].karaka})`]
  if (p.house) parts.push(`placed in the ${h(p.house)} (${BHAVA[p.house - 1].topics})`)
  if (owns.length) parts.push(`ruling the ${owns.map(ordinal).join(' & ')} (${owns.map((o) => BHAVA[o - 1].short).join(', ')})`)
  const q = p.dignity === 'debilitated' ? ' Because it is debilitated, this period asks for effort and patience.' : p.dignity && GOOD.includes(p.dignity) ? ` Because it is ${p.dignity}, this is typically a productive, rewarding period.` : ''
  return parts.join(', ') + '.' + q
}

function dashaInsights(chart: VedicChart, periods: Period[]): VInsight[] {
  const { md, ad } = currentPeriods(periods)
  const out: VInsight[] = []
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  if (md) {
    out.push({
      id: 'dasha-current', title: `Now: ${md.lord} Mahadasha${ad ? ` · ${ad.lord} Antardasha` : ''}`,
      subtitle: `${md.lord}: ${fmt(md.start)} – ${fmt(md.end)}${ad ? ` · ${ad.lord}: ${fmt(ad.start)} – ${fmt(ad.end)}` : ''}`,
      body: [
        `The major period brings the themes of ${dashaText(chart, md.lord)}`,
        ...(ad ? [`Within it, the sub-period colours events with ${dashaText(chart, ad.lord)}`] : []),
      ],
      rule: 'Vimshottari dasha from the Moon’s nakshatra; results follow the dasha lord’s house, lordship and dignity',
      lesson: 'vedic-dashas', tone: 'mixed',
    })
  }
  out.push(sadeSati(chart))
  return out
}

/** Divisional chart reading: lagna, key houses, karakas, strong/weak planets. */
function vargaInsights(info: VargaInfo, vc: VargaChart, d1: VargaChart): VInsight[] {
  const out: VInsight[] = []
  const P = (g: Graha) => vc.placements.find((p) => p.graha === g)!
  const lesson = 'vedic-vargas'
  const tag = info.standard ? '' : ' (supplementary chart)'

  if (info.n === 2) {
    const sun = vc.placements.filter((p) => p.sign === 4).map((p) => p.graha)
    const moonH = vc.placements.filter((p) => p.sign === 3).map((p) => p.graha)
    out.push({
      id: 'D2-hora', title: `Hora balance: ${sun.length} in Sun hora, ${moonH.length} in Moon hora`,
      subtitle: `Sun (Leo): ${sun.join(', ') || 'none'} · Moon (Cancer): ${moonH.join(', ') || 'none'}`,
      body: [
        sun.length > moonH.length
          ? 'The Sun’s hora dominates: wealth tends to come through your own effort, authority, courage and visible achievement. You earn rather than inherit.'
          : moonH.length > sun.length
            ? 'The Moon’s hora dominates: wealth tends to come through nurturing, public dealings, family, steady accumulation and support from others.'
            : 'The Sun and Moon horas are balanced: wealth comes through both self-effort and support, saving and earning.',
        `Benefics in the Moon hora and malefics in the Sun hora are traditionally best. Jupiter (the wealth karaka) is in the ${P('Jupiter').sign === 3 ? 'Moon' : 'Sun'} hora.`,
      ],
      rule: 'Parashari Hora: each sign halved into Sun (Leo) and Moon (Cancer) horas', lesson, tone: 'mixed',
    })
    return out
  }

  if (vc.lagnaSign !== null) {
    const lagLord = SIGN_LORD[vc.lagnaSign]
    const ll = P(lagLord)
    out.push({
      id: `${info.code}-lagna`,
      title: `${info.code} lagna ${RASHI[signName(vc.lagnaSign)]}; its lord ${lagLord} is in the ${h(ll.house!)}`,
      subtitle: `${info.name}: ${info.domain}`,
      body: [
        `In the ${info.name}${tag}, the rising sign ${signName(vc.lagnaSign)} sets the tone: ${SIGN_TEXT[signName(vc.lagnaSign)].keywords.slice(0, 3).join(', ')}.`,
        `Its lord ${lagLord} in the ${h(ll.house!)} directs this life area toward ${BHAVA[ll.house! - 1].topics}${ll.dignity ? `, and it is ${ll.dignity} there` : ''}.`,
      ],
      rule: `${info.code} lagna and its lord’s house`, lesson,
      tone: ll.dignity && GOOD.includes(ll.dignity) ? 'good' : ll.dignity === 'debilitated' || DUSTHANA.includes(ll.house!) ? 'challenge' : 'mixed',
    })
    for (const kh of info.keyHouses.filter((x) => x !== 1)) {
      const sign = (vc.lagnaSign + kh - 1) % 12
      const lord = SIGN_LORD[sign]
      const lp = P(lord)
      const occ = vc.placements.filter((p) => p.house === kh).map((p) => p.graha as Graha)
      const ben = occ.filter((g) => GRAHA_INFO[g].nature === 'benefic')
      const mal = occ.filter((g) => GRAHA_INFO[g].nature === 'malefic')
      const good = (lp.dignity && GOOD.includes(lp.dignity)) || KENDRA.includes(lp.house!) || [5, 9, 11].includes(lp.house!)
      const bad = lp.dignity === 'debilitated' || DUSTHANA.includes(lp.house!)
      out.push({
        id: `${info.code}-house-${kh}`,
        title: `${info.code} ${h(kh)}: ${BHAVA[kh - 1].short}`,
        subtitle: `${RASHI[signName(sign)]} · lord ${lord} in the ${h(lp.house!)}${lp.dignity ? ` (${lp.dignity})` : ''}${occ.length ? ` · occupied by ${occ.join(', ')}` : ''}`,
        body: [
          `The ${h(kh)} of the ${info.name} focuses on ${info.domain}. Its lord ${lord} ${good && !bad ? 'is well placed, which supports these matters and helps them flourish' : bad ? 'is in a difficult position, so results here need more patience, effort or remedial care' : 'is moderately placed, giving mixed results that depend on dashas'}.`,
          ...(ben.length ? [`${ben.join(' and ')} in this house ${ben.length > 1 ? 'bless' : 'blesses'} it directly.`] : []),
          ...(mal.length ? [`${mal.join(' and ')} here ${mal.length > 1 ? 'add' : 'adds'} pressure, although malefics can also give drive and ambition in this area.`] : []),
        ],
        rule: `${info.code}: ${ordinal(kh)} lord placement and occupants`, lesson,
        tone: good && !bad ? 'good' : bad ? 'challenge' : 'mixed',
      })
    }
  }

  const karakaNotes = info.karakas.map((k) => {
    const p = P(k as Graha)
    return `${k} is ${p.dignity ?? 'placed'} in ${signName(p.sign)}${p.house ? ` (${h(p.house)})` : ''}`
  })
  const strong = vc.placements.filter((p) => p.dignity && GOOD.includes(p.dignity)).map((p) => `${p.graha} (${p.dignity})`)
  const weak = vc.placements.filter((p) => p.dignity === 'debilitated').map((p) => p.graha)
  const body = [
    ...(karakaNotes.length ? [`Significators (karakas) for this chart: ${karakaNotes.join('; ')}.`] : []),
    strong.length ? `Strong here: ${strong.join(', ')}. ${strong.length > 1 ? 'Their dashas tend' : 'Its dasha tends'} to deliver good results for ${info.domain}.` : `No planet is in its own or exaltation sign in this chart, so results rely on the D1 promise and on dashas.`,
    ...(weak.length ? [`Weak here: ${weak.join(', ')} (debilitated). Their periods may need extra effort in this area.`] : []),
  ]
  if (info.n === 9) {
    const vargottama = d1.placements.filter((p) => P(p.graha as Graha).sign === p.sign).map((p) => p.graha)
    if (vargottama.length) body.push(`Vargottama (same sign in D1 and D9): ${vargottama.join(', ')}. These planets are exceptionally reliable in your life.`)
    const improved = d1.placements.filter((p) => p.dignity === 'debilitated' && GOOD.includes(P(p.graha as Graha).dignity ?? 'neutral')).map((p) => p.graha)
    if (improved.length) body.push(`${improved.join(', ')} ${improved.length > 1 ? 'are' : 'is'} debilitated in D1 but strong in D9, a pattern of weakness in youth that becomes strength with maturity.`)
  }
  out.push({ id: `${info.code}-strength`, title: `${info.code} planetary strength`, subtitle: 'Karakas, dignities and special combinations', body, rule: `${info.code} sign dignities of all grahas`, lesson, tone: strong.length > weak.length ? 'good' : weak.length > strong.length ? 'challenge' : 'mixed' })
  return out
}

function lifeAreas(chart: VedicChart, vcs: Record<number, VargaChart>): LifeArea[] {
  if (chart.lagnaSign === null) return []
  const specs: { label: string; n: VargaN; house: number; karaka: Graha }[] = [
    { label: 'Career & status', n: 10, house: 10, karaka: 'Sun' },
    { label: 'Marriage & partnership', n: 9, house: 7, karaka: 'Venus' },
    { label: 'Wealth', n: 1, house: 2, karaka: 'Jupiter' },
    { label: 'Home & property', n: 4, house: 4, karaka: 'Moon' },
    { label: 'Children & creativity', n: 7, house: 5, karaka: 'Jupiter' },
    { label: 'Courage & siblings', n: 3, house: 3, karaka: 'Mars' },
  ]
  const dScore = (d: VedicDignity | null) => ({ exalted: 3, moolatrikona: 2.5, own: 2, friend: 1, neutral: 0, enemy: -1, debilitated: -2 }[d ?? 'neutral'])
  return specs.map(({ label, n, house, karaka }) => {
    const score = (vc: VargaChart) => {
      const sign = (vc.lagnaSign! + house - 1) % 12
      const lord = vc.placements.find((p) => p.graha === SIGN_LORD[sign])!
      let s = dScore(lord.dignity)
      if (KENDRA.includes(lord.house!) || [5, 9, 11].includes(lord.house!)) s += 1.5
      if (DUSTHANA.includes(lord.house!) && !DUSTHANA.includes(house)) s -= 1.5
      for (const p of vc.placements.filter((x) => x.house === house)) s += GRAHA_INFO[p.graha as Graha].nature === 'benefic' ? 1 : UPACHAYA.includes(house) ? 0.5 : -0.75
      s += dScore(vc.placements.find((p) => p.graha === karaka)!.dignity) * 0.5
      return s
    }
    // Blend the D1 promise (60%) with the divisional confirmation (40%).
    const raw = n === 1 ? score(vcs[1]) : score(vcs[1]) * 0.6 + score(vcs[n]) * 0.4
    const value = Math.max(15, Math.min(92, Math.round(50 + raw * 7)))
    return {
      label, code: n === 1 ? 'D1' : `D1 + D${n}`, score: value,
      verdict: value >= 65 ? 'Naturally supported' : value >= 45 ? 'Mixed: grows with effort' : 'Needs patience and effort',
      rule: `${ordinal(house)} lord dignity & placement, occupants and ${karaka} (karaka), in D1${n === 1 ? '' : ` and D${n}`}`,
    }
  })
}

export function interpretVedic(chart: VedicChart): VedicReading {
  const vargaCharts: Record<number, VargaChart> = {}
  for (const v of VARGAS) vargaCharts[v.n] = vargaChart(chart, v.n)
  const d1 = vargaCharts[1], d9 = vargaCharts[9]
  const moon = pos(chart, 'Moon')
  const nk = NAKSHATRAS[moon.nakshatra]

  const core: VInsight[] = []
  if (chart.lagnaSign !== null) {
    const lagSign = signName(chart.lagnaSign)
    const lord = SIGN_LORD[chart.lagnaSign]
    const lp = pos(chart, lord)
    core.push({
      id: 'core-lagna', title: `Lagna: ${RASHI[lagSign]} (${lagSign})`, subtitle: `Lagna lord ${lord} in the ${h(lp.house!)}`,
      body: [
        `The lagna (ascendant) is the most important point in Jyotish: your body, temperament and the lens for the whole chart. ${SIGN_TEXT[lagSign].rising}`,
        `Its lord ${lord} sits in the ${h(lp.house!)}, so your life energy flows toward ${BHAVA[lp.house! - 1].topics}.${lp.dignity ? ` ${lord} ${DIGNITY_TEXT[lp.dignity]}` : ''}`,
      ],
      rule: 'Sidereal ascendant sign + placement of its lord', lesson: 'vedic-intro', tone: 'good',
    })
  }
  core.push({
    id: 'core-moon', title: `Chandra Rashi (Moon sign): ${RASHI[signName(moon.sign)]} (${signName(moon.sign)})`, subtitle: 'Used for daily horoscopes and transits in India',
    body: [SIGN_TEXT[signName(moon.sign)].moon, `Many Indian traditions read the chart from the Moon as a second lagna (Chandra lagna), because the Moon shows the mind that experiences everything.`],
    rule: 'Sidereal sign of the Moon', lesson: 'vedic-intro', tone: 'mixed',
  })
  core.push({
    id: 'core-nakshatra', title: `Janma Nakshatra: ${nk.name}, pada ${moon.pada}`, subtitle: `Ruled by ${nk.lord} · deity ${nk.deity} · symbol ${nk.symbol}`,
    body: [
      `Your birth star is ${nk.name}. Its qualities (${nk.keywords}) describe your instinctive emotional nature.`,
      `Because it is ruled by ${nk.lord}, your life begins in ${nk.lord}’s Vimshottari dasha.`,
    ],
    rule: 'Nakshatra (13°20′ lunar mansion) occupied by the Moon', lesson: 'vedic-nakshatras', tone: 'mixed',
  })

  const grahaIns = GRAHAS.map((g) => grahaInsight(chart, pos(chart, g), d9))
  const lords = chart.lagnaSign === null ? [] : Array.from({ length: 12 }, (_, i) => lordInsight(chart, i + 1))
  const vargas: Record<number, VInsight[]> = {}
  for (const v of VARGAS) if (v.n !== 1) vargas[v.n] = vargaInsights(v, vargaCharts[v.n], d1)
  const dashas = vimshottari(moon.lon, chart.utc)

  return {
    core, grahas: grahaIns, lords, yogas: yogas(chart), vargas, vargaCharts, dashas,
    dashaInsights: dashaInsights(chart, dashas), lifeAreas: lifeAreas(chart, vargaCharts),
    dashaThemes: Object.fromEntries(GRAHAS.map((g) => [g, dashaText(chart, g)])),
  }
}

