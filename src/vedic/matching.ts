import { SIGN_TEXT } from '../interpret/signs'
import { FRIENDS, NAKSHATRAS, SIGN_LORD, houseFrom, type Graha } from './constants'
import { currentPeriods, vimshottari } from './dasha'
import { marriageReport } from './marriage'
import { signName, type VedicChart } from './sidereal'
import { ordinal } from '../astro/constants'
import { pos } from './query'

/* ---------------------------- Classical tables ---------------------------- */

/** Varna by Moon sign: 4 Brahmin, 3 Kshatriya, 2 Vaishya, 1 Shudra. */
const VARNA = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4]
const VARNA_NAME = ['', 'Shudra', 'Vaishya', 'Kshatriya', 'Brahmin']

type VashyaGroup = 'Chatushpada' | 'Manava' | 'Jalachara' | 'Vanachara' | 'Keeta'
function vashyaOf(lon: number): VashyaGroup {
  const sign = Math.floor(lon / 30), deg = lon % 30
  switch (sign) {
    case 0: case 1: return 'Chatushpada'
    case 2: case 5: case 6: case 10: return 'Manava'
    case 3: case 11: return 'Jalachara'
    case 4: return 'Vanachara'
    case 7: return 'Keeta'
    case 8: return deg < 15 ? 'Manava' : 'Chatushpada'
    default: return deg < 15 ? 'Chatushpada' : 'Jalachara' // Capricorn
  }
}
const VASHYA_ORDER: VashyaGroup[] = ['Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta']
/** Charak, Elements of Vedic Astrology, table XXVII-2, as boy (row) × girl (col). A Vanachara (Simha) girl scores only with a Vanachara boy. */
const VASHYA_TABLE = [
  [2, 1, 1, 0, 1],
  [1, 2, 0.5, 0, 1],
  [1, 0.5, 2, 0, 1],
  [0.5, 0, 1, 2, 0],
  [1, 1, 1, 0, 2],
]

const YONI_ANIMALS = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion']
/** Yoni animal index for each of the 27 nakshatras. */
const NAK_YONI = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1]
/** Charak, table XXVII-4 (symmetric): same yoni 4, friendly 3, neutral 2, inimical 1, sworn enemies 0. */
export const YONI_TABLE = [
  [4, 2, 3, 2, 2, 3, 3, 2, 0, 1, 3, 2, 2, 1],
  [2, 4, 3, 2, 2, 3, 2, 3, 3, 1, 3, 2, 2, 0],
  [3, 3, 4, 2, 2, 3, 2, 3, 3, 1, 3, 0, 2, 1],
  [2, 2, 2, 4, 2, 1, 1, 2, 2, 2, 2, 1, 0, 2],
  [2, 2, 2, 2, 4, 1, 1, 2, 2, 2, 0, 2, 2, 2],
  [3, 3, 3, 1, 1, 4, 0, 3, 3, 2, 3, 2, 2, 2],
  [3, 2, 2, 1, 1, 0, 4, 3, 3, 2, 3, 2, 1, 2],
  [2, 3, 3, 2, 2, 3, 3, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 2, 2, 3, 3, 3, 4, 1, 3, 2, 2, 1],
  [1, 1, 1, 2, 2, 2, 2, 0, 1, 4, 1, 2, 2, 3],
  [3, 3, 3, 2, 0, 3, 3, 3, 3, 1, 4, 2, 2, 1],
  [2, 2, 0, 1, 2, 2, 2, 2, 2, 2, 2, 4, 2, 2],
  [2, 2, 2, 0, 2, 2, 1, 2, 2, 2, 2, 2, 4, 2],
  [1, 0, 1, 2, 2, 2, 2, 1, 1, 3, 1, 2, 2, 4],
]

/** Gana: 0 Deva, 1 Manushya, 2 Rakshasa. */
const NAK_GANA = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0]
const GANA_NAME = ['Deva', 'Manushya', 'Rakshasa']
/** Charak, table XXVII-6, as boy (row) × girl (col). */
const GANA_TABLE = [
  [6, 6, 0],
  [5, 6, 0],
  [1, 0, 6],
]

const NADI_NAME = ['Adi (Vata)', 'Madhya (Pitta)', 'Antya (Kapha)']
const nadiOf = (nak: number) => [0, 1, 2, 2, 1, 0][nak % 6]

const RAJJU_NAME = ['Pada (feet)', 'Kati (waist)', 'Nabhi (navel)', 'Kantha (neck)', 'Shiro (head)']
const rajjuOf = (nak: number) => [0, 1, 2, 3, 4, 3, 2, 1, 0][nak % 9]

/** Vedha (mutually obstructing) nakshatra pairs. */
const VEDHA: [number, number][] = [[0, 17], [1, 16], [2, 15], [3, 14], [5, 21], [6, 20], [7, 19], [8, 18], [9, 26], [10, 25], [11, 24], [12, 23], [4, 22], [4, 13], [13, 22]]

function relation(a: Graha, b: Graha): 'friend' | 'neutral' | 'enemy' {
  if (a === b) return 'friend'
  const r = FRIENDS[a]!
  if (r.friends.includes(b)) return 'friend'
  if (r.enemies.includes(b)) return 'enemy'
  return 'neutral'
}

/** Count from nakshatra a to b, inclusive (1..27). */
const count = (a: number, b: number) => ((b - a + 27) % 27) + 1

/* -------------------------------- Types ---------------------------------- */

export interface Koota {
  name: string
  max: number
  score: number
  boy: string
  girl: string
  meaning: string
  note?: string
}

export interface Porutham { name: string; pass: boolean; detail: string; critical?: boolean }

export interface Check { title: string; effect: 'supportive' | 'challenging' | 'mixed' | 'info'; detail: string; rule: string }

export interface MatchReport {
  total: number
  verdict: string
  kootas: Koota[]
  doshas: Check[]
  poruthams: Porutham[]
  poruthamPass: number
  mangal: { boy: string; girl: string; verdict: Check }
  chart: Check[]
  timing: Check[]
  summary: string[]
}

/* ------------------------------- Matching -------------------------------- */

export function matchCharts(boy: VedicChart, girl: VedicChart, now = new Date()): MatchReport {
  const bm = pos(boy, 'Moon'), gm = pos(girl, 'Moon')
  const bNak = bm.nakshatra, gNak = gm.nakshatra
  const bSign = bm.sign, gSign = gm.sign
  const bLord = SIGN_LORD[bSign], gLord = SIGN_LORD[gSign]
  const kootas: Koota[] = []

  // 1. Varna
  const varnaScore = VARNA[bSign] >= VARNA[gSign] ? 1 : 0
  kootas.push({ name: 'Varna', max: 1, score: varnaScore, boy: VARNA_NAME[VARNA[bSign]], girl: VARNA_NAME[VARNA[gSign]], meaning: 'Spiritual and temperamental compatibility, work ethic' })

  // 2. Vashya
  const bv = vashyaOf(bm.lon), gv = vashyaOf(gm.lon)
  kootas.push({ name: 'Vashya', max: 2, score: VASHYA_TABLE[VASHYA_ORDER.indexOf(bv)][VASHYA_ORDER.indexOf(gv)], boy: bv, girl: gv, meaning: 'Mutual attraction and influence over each other' })

  // 3. Tara
  const taraOk = (n: number) => ![3, 5, 7].includes(n % 9 === 0 ? 9 : n % 9)
  const t1 = taraOk(count(gNak, bNak)), t2 = taraOk(count(bNak, gNak))
  kootas.push({ name: 'Tara', max: 3, score: (t1 ? 1.5 : 0) + (t2 ? 1.5 : 0), boy: NAKSHATRAS[bNak].name, girl: NAKSHATRAS[gNak].name, meaning: 'Destiny, health and wellbeing of each other', note: `Girl→boy ${t1 ? 'auspicious' : 'inauspicious'} tara, boy→girl ${t2 ? 'auspicious' : 'inauspicious'} tara` })

  // 4. Yoni
  const by = NAK_YONI[bNak], gy = NAK_YONI[gNak]
  kootas.push({ name: 'Yoni', max: 4, score: YONI_TABLE[by][gy], boy: YONI_ANIMALS[by], girl: YONI_ANIMALS[gy], meaning: 'Physical and intimate compatibility' })

  // 5. Graha Maitri
  const r1 = relation(bLord, gLord), r2 = relation(gLord, bLord)
  const rs = [r1, r2].sort().join('-')
  const maitri = bLord === gLord ? 5 : ({ 'friend-friend': 5, 'friend-neutral': 4, 'neutral-neutral': 3, 'enemy-friend': 1, 'enemy-neutral': 0.5, 'enemy-enemy': 0 } as Record<string, number>)[rs]
  kootas.push({ name: 'Graha Maitri', max: 5, score: maitri, boy: `${signName(bSign)} (${bLord})`, girl: `${signName(gSign)} (${gLord})`, meaning: 'Mental compatibility and friendship', note: `${bLord} sees ${gLord} as ${r1}; ${gLord} sees ${bLord} as ${r2}` })

  // 6. Gana
  const bg = NAK_GANA[bNak], gg = NAK_GANA[gNak]
  kootas.push({ name: 'Gana', max: 6, score: GANA_TABLE[bg][gg], boy: GANA_NAME[bg], girl: GANA_NAME[gg], meaning: 'Temperament and nature' })

  // 7. Bhakoot
  const dist = houseFrom(gSign, bSign), back = houseFrom(bSign, gSign)
  const pair = [dist, back].sort((a, b) => a - b).join('/')
  const bhakootBad = ['2/12', '5/9', '6/8'].includes(pair)
  const friendlyLords = bLord === gLord || (relation(bLord, gLord) === 'friend' && relation(gLord, bLord) === 'friend')
  // Charak (b159): a 6/8 pair is mild when the 6th is counted from an even sign (or the 8th from an odd one), since the lords are then friendly;
  // a 2/12 pair is much eased by friendly lords. The book gives no relief for 5/9.
  const sixth = dist === 6 ? gSign : back === 6 ? bSign : -1
  const bhakootRelief = !bhakootBad ? null
    : pair === '6/8' && sixth >= 0 && sixth % 2 === 1 ? 'the 6/8 pair counts from an even sign, so the Moon-sign lords are friendly'
      : pair === '2/12' && friendlyLords ? 'the Moon-sign lords are friendly'
        : null
  const bhakootCancel = bhakootRelief !== null
  kootas.push({ name: 'Bhakoot', max: 7, score: bhakootBad ? 0 : 7, boy: signName(bSign), girl: signName(gSign), meaning: 'Emotional bond, family welfare and prosperity', note: `Moon signs are ${pair} from each other${bhakootBad ? (bhakootCancel ? ` (dosha eased: ${bhakootRelief})` : ' (Bhakoot dosha)') : bSign === gSign && bNak !== gNak ? ' (same sign, different nakshatras: favourable)' : ''}` })

  // 8. Nadi
  const bn = nadiOf(bNak), gn = nadiOf(gNak)
  const nadiBad = bn === gn
  const nadiCancel: string[] = []
  if (nadiBad) {
    if (bSign === gSign && bNak !== gNak) nadiCancel.push('same Moon sign but different nakshatras')
    if (bNak === gNak && bSign !== gSign) nadiCancel.push('same nakshatra but different Moon signs')
    if (bNak === gNak && bm.pada !== gm.pada) nadiCancel.push('same nakshatra but different padas')
    if (bLord === gLord && bNak !== gNak) nadiCancel.push('Moon-sign lords are the same (different nakshatras)')
  }
  kootas.push({ name: 'Nadi', max: 8, score: nadiBad ? 0 : 8, boy: NADI_NAME[bn], girl: NADI_NAME[gn], meaning: 'Health, genetics and progeny', note: nadiBad ? `Nadi dosha${nadiCancel.length ? ` (cancellation: ${nadiCancel.join('; ')})` : ''}` : undefined })

  const total = kootas.reduce((s, k) => s + k.score, 0)
  const verdict = total >= 33 ? 'Excellent match' : total >= 25 ? 'Very good match' : total >= 18 ? 'Acceptable match' : 'Below the traditional threshold (18)'

  // Doshas.
  const doshas: Check[] = [
    { title: nadiBad ? (nadiCancel.length ? 'Nadi dosha: cancelled' : 'Nadi dosha present') : 'No Nadi dosha', effect: nadiBad ? (nadiCancel.length ? 'mixed' : 'challenging') : 'supportive', detail: nadiBad ? `Both are ${NADI_NAME[bn]} nadi. Traditionally the most serious dosha, associated with health and progeny.${nadiCancel.length ? ` Classical cancellations apply: ${nadiCancel.join('; ')}.` : ''}` : 'Different nadis: good for health and children.', rule: 'Same nadi = 0/8 points' },
    { title: bhakootBad ? (bhakootCancel ? 'Bhakoot dosha: eased' : 'Bhakoot dosha present') : 'No Bhakoot dosha', effect: bhakootBad ? (bhakootCancel ? 'mixed' : 'challenging') : 'supportive', detail: bhakootBad ? `Moon signs ${pair} apart: ${pair === '6/8' ? 'friction between the partners' : pair === '2/12' ? 'financial strain' : 'differences over children'} is traditionally indicated.${bhakootCancel ? ` Eased because ${bhakootRelief}.` : ''}` : 'Moon signs are in a harmonious relationship.', rule: '2/12, 5/9 or 6/8 Moon signs = Bhakoot dosha' },
    { title: GANA_TABLE[bg][gg] <= 1 ? 'Gana dosha present' : 'No Gana dosha', effect: GANA_TABLE[bg][gg] <= 1 ? 'challenging' : 'supportive', detail: GANA_TABLE[bg][gg] <= 1 ? `${GANA_NAME[bg]} and ${GANA_NAME[gg]} temperaments differ strongly; conscious adjustment is needed.${maitri >= 4 ? ' Largely offset by good Graha Maitri.' : ''}` : 'Temperaments are compatible.', rule: 'Gana score of 0 or 1' },
  ]

  // South Indian Dashakoota (poruthams).
  const gToB = count(gNak, bNak)
  const rem = gToB % 9
  const poruthams: Porutham[] = [
    { name: 'Dina', pass: [2, 4, 6, 8, 0].includes(rem), detail: `Count from girl’s to boy’s star is ${gToB}; remainder ${rem} of 9. Governs daily harmony and health.` },
    { name: 'Gana', pass: GANA_TABLE[bg][gg] >= 5, detail: `${GANA_NAME[bg]} and ${GANA_NAME[gg]}.` },
    { name: 'Mahendra', pass: [4, 7, 10, 13, 16, 19, 22, 25].includes(gToB), detail: `Boy’s star is ${gToB} from the girl’s. Prosperity and progeny.` },
    { name: 'Stree Deergha', pass: gToB > 13, detail: `Distance ${gToB} (more than 13 is good; more than 9 is acceptable). Wellbeing and longevity of the wife.` },
    { name: 'Yoni', pass: YONI_TABLE[by][gy] >= 2, detail: `${YONI_ANIMALS[by]} and ${YONI_ANIMALS[gy]}.` },
    { name: 'Rasi', pass: !bhakootBad || bhakootCancel, detail: `Moon signs ${pair} apart.` },
    { name: 'Rasi Adhipathi', pass: r1 !== 'enemy' && r2 !== 'enemy', detail: `${bLord} and ${gLord}: ${r1}/${r2}.` },
    { name: 'Vashya', pass: VASHYA_TABLE[VASHYA_ORDER.indexOf(bv)][VASHYA_ORDER.indexOf(gv)] >= 1, detail: `${bv} and ${gv}.` },
    { name: 'Rajju', pass: rajjuOf(bNak) !== rajjuOf(gNak), critical: true, detail: `Boy ${RAJJU_NAME[rajjuOf(bNak)]}, girl ${RAJJU_NAME[rajjuOf(gNak)]}. The same rajju is considered serious in South India (longevity of the bond).` },
    { name: 'Vedha', pass: !VEDHA.some(([a, b]) => (a === bNak && b === gNak) || (a === gNak && b === bNak)), critical: true, detail: `${NAKSHATRAS[bNak].name} and ${NAKSHATRAS[gNak].name}${VEDHA.some(([a, b]) => (a === bNak && b === gNak) || (a === gNak && b === bNak)) ? ' obstruct each other (vedha)' : ' do not obstruct each other'}.` },
  ]

  // Mangal dosha comparison.
  const bmr = marriageReport(boy, 'male', now), gmr = marriageReport(girl, 'female', now)
  const mdesc = (r: ReturnType<typeof marriageReport>, c: VedicChart) => {
    if (!r) {
      const m = pos(c, 'Mars'), mo = pos(c, 'Moon')
      return [1, 2, 4, 7, 8, 12].includes(houseFrom(mo.sign, m.sign)) ? 'present from the Moon (no birth time)' : 'none from the Moon (no birth time)'
    }
    return r.mangal.status === 'none' ? 'none' : r.mangal.status === 'cancelled' ? `cancelled (${r.mangal.cancellations[0]})` : `present (from ${r.mangal.checks.filter((x) => x.present).map((x) => x.from).join(', ')})`
  }
  const bHas = (bmr?.mangal.status ?? 'none') === 'present', gHas = (gmr?.mangal.status ?? 'none') === 'present'
  // Charak (b153): a one-sided Mars dosha is balanced when the other chart has another malefic (Sun, Saturn, Rahu or Ketu) in the 1st, 4th, 7th, 8th or 12th from its lagna or Moon.
  const balancer = (c: VedicChart) => {
    const refs = [pos(c, 'Moon').sign, ...(c.lagnaSign !== null ? [c.lagnaSign] : [])]
    return (['Sun', 'Saturn', 'Rahu', 'Ketu'] as Graha[]).find((g) => refs.some((r) => [1, 4, 7, 8, 12].includes(houseFrom(r, pos(c, g).sign))))
  }
  const other = bHas && !gHas ? balancer(girl) : gHas && !bHas ? balancer(boy) : undefined
  const balanced = bHas === gHas || other !== undefined
  const mangal = {
    boy: mdesc(bmr, boy), girl: mdesc(gmr, girl),
    verdict: {
      title: bHas === gHas ? (bHas ? 'Mangal dosha on both sides: balanced' : 'No uncancelled Mangal dosha on either side') : other ? `Mangal dosha on one side, balanced by ${other} in the other chart` : 'Mangal dosha on one side only',
      effect: (balanced ? 'supportive' : 'challenging') as Check['effect'],
      detail: bHas === gHas ? 'Traditionally, when both or neither partner has Mangal dosha, it is considered matched.'
        : other ? `${other} occupies a Mangal-dosha house (1st, 4th, 7th, 8th or 12th from the lagna or Moon) in the other partner's chart, which the classical texts accept as a balance.`
          : 'Traditionally a Manglik is matched with a Manglik, or with a chart that has another malefic in the same houses. The effect is said to weaken with age; weigh it alongside the rest of the chart.',
      rule: 'Mars in 1/2/4/7/8/12 from lagna, Moon or Venus, after cancellations; balanced by the partner\'s Mars or another malefic in the same houses (Charak, ch. XXVII)',
    },
  }

  // Chart-level checks (beyond the Moon).
  const chart: Check[] = []
  const el = (s: number) => ['Fire', 'Earth', 'Air', 'Water'][s % 4]
  const harmonious = (a: number, b: number) => { const d = houseFrom(a, b); return [1, 5, 9, 3, 11, 7].includes(d) }
  if (boy.lagnaSign !== null && girl.lagnaSign !== null) {
    const d = houseFrom(boy.lagnaSign, girl.lagnaSign)
    chart.push({ title: `Lagnas: ${signName(boy.lagnaSign)} and ${signName(girl.lagnaSign)}`, effect: harmonious(boy.lagnaSign, girl.lagnaSign) ? 'supportive' : [6, 8].includes(d) ? 'challenging' : 'mixed', detail: `The ascendants are ${d === 1 ? 'the same' : `${d}/${houseFrom(girl.lagnaSign, boy.lagnaSign)} apart`} (${el(boy.lagnaSign)} and ${el(girl.lagnaSign)}). ${harmonious(boy.lagnaSign, girl.lagnaSign) ? 'Their approaches to life support each other.' : 'Different approaches to life that need understanding.'}`, rule: 'Lagna-to-lagna relationship (trines, sextiles and oppositions harmonise)' })
    const b7 = (boy.lagnaSign + 6) % 12, g7 = (girl.lagnaSign + 6) % 12
    const cross: string[] = []
    if (b7 === girl.lagnaSign) cross.push('his 7th house is her lagna')
    if (g7 === boy.lagnaSign) cross.push('her 7th house is his lagna')
    if (b7 === gSign) cross.push('his 7th house is her Moon sign')
    if (g7 === bSign) cross.push('her 7th house is his Moon sign')
    chart.push({ title: '7th-house cross links', effect: cross.length ? 'supportive' : 'info', detail: cross.length ? `A classical sign of attraction and destiny: ${cross.join('; ')}.` : 'No direct 7th-house cross links, which is common and not a negative.', rule: 'One partner’s 7th house sign = the other’s lagna or Moon sign' })
  }
  const bv2 = pos(boy, 'Venus').sign, bma = pos(boy, 'Mars').sign, gv2 = pos(girl, 'Venus').sign, gma = pos(girl, 'Mars').sign
  const attraction = [harmonious(bma, gv2) && 'his Mars and her Venus harmonise', harmonious(gma, bv2) && 'her Mars and his Venus harmonise', bv2 === gv2 && 'Venus in the same sign'].filter(Boolean) as string[]
  chart.push({ title: 'Venus–Mars chemistry', effect: attraction.length >= 2 ? 'supportive' : attraction.length ? 'mixed' : 'info', detail: attraction.length ? `Romantic and physical chemistry: ${attraction.join('; ')}.` : 'Venus and Mars are not in harmonious signs; attraction then rests on other factors (Yoni, Vashya).', rule: 'Mars of one in trine, sextile or opposition to Venus of the other' })
  const moonRel = houseFrom(bSign, gSign)
  const moonTone: Check['effect'] = !bhakootBad ? 'supportive' : bhakootCancel ? 'mixed' : 'challenging'
  chart.push({ title: 'Moon-to-Moon emotional rhythm', effect: moonTone, detail: `Her Moon is ${ordinal(moonRel)} from his: his ${SIGN_TEXT[signName(bSign)].keywords[0]} meets her ${SIGN_TEXT[signName(gSign)].keywords[0]}. ${moonTone === 'supportive' ? 'Emotional rhythms fit together easily.' : moonTone === 'mixed' ? 'Different emotional rhythms, softened by friendly Moon-sign lords.' : 'Different emotional rhythms that need conscious care.'}`, rule: 'Moon sign relationship (same basis as Bhakoot)' })
  const bj = pos(boy, 'Jupiter').sign, gj = pos(girl, 'Jupiter').sign
  const jupBless = [houseFrom(bj, gSign), houseFrom(gj, bSign)].some((d) => [1, 5, 7, 9].includes(d))
  chart.push({ title: 'Jupiter’s blessing across charts', effect: jupBless ? 'supportive' : 'info', detail: jupBless ? 'One partner’s Jupiter aspects or joins the other’s Moon, bringing guidance, protection and goodwill in the relationship.' : 'No cross-Jupiter influence on the Moons.', rule: 'Jupiter of one partner in 1/5/7/9 from the other’s Moon' })

  // Timing checks.
  const timing: Check[] = []
  const bp = currentPeriods(vimshottari(bm.lon, boy.utc), now), gp = currentPeriods(vimshottari(gm.lon, girl.utc), now)
  const sandhi = (c: VedicChart) => {
    const ps = vimshottari(pos(c, 'Moon').lon, c.utc)
    const soon = new Date(now.getTime() + 365.25 * 86400000)
    return ps.find((p) => p.end > now && p.end <= soon)
  }
  const bs = sandhi(boy), gs = sandhi(girl)
  timing.push({ title: `Current dashas: ${bp.md?.lord ?? '?'}–${bp.ad?.lord ?? '?'} (him), ${gp.md?.lord ?? '?'}–${gp.ad?.lord ?? '?'} (her)`, effect: 'info', detail: 'The running Vimshottari periods of each partner. Marriage often takes place in periods of the 7th lord, Venus, Jupiter or planets in the 7th.', rule: 'Vimshottari dasha from each Moon' })
  timing.push({ title: bs && gs ? 'Dasha sandhi for both within a year' : bs || gs ? 'Dasha sandhi for one partner within a year' : 'No dasha sandhi in the coming year', effect: bs && gs ? 'challenging' : bs || gs ? 'mixed' : 'supportive', detail: bs || gs ? `A mahadasha changes soon (${[bs && `his ${bs.lord}`, gs && `her ${gs.lord}`].filter(Boolean).join(', ')}). The junction of two mahadashas is traditionally avoided for the wedding date.` : 'Neither partner is at a mahadasha junction, which is favourable for fixing a wedding date soon.', rule: 'Mahadasha ending within 12 months (dasha sandhi)' })

  const summary = [
    `Ashtakoota Guna Milan: ${total} / 36, ${verdict.toLowerCase()}.`,
    `South Indian poruthams: ${poruthams.filter((p) => p.pass).length} of 10 agree${poruthams.some((p) => p.critical && !p.pass) ? ` (critical failures: ${poruthams.filter((p) => p.critical && !p.pass).map((p) => p.name).join(', ')})` : ''}.`,
    `Mangal dosha: ${mangal.verdict.title.toLowerCase()}.`,
    ...doshas.filter((d) => d.effect === 'challenging').map((d) => `${d.title}.`),
  ]

  return { total, verdict, kootas, doshas, poruthams, poruthamPass: poruthams.filter((p) => p.pass).length, mangal, chart, timing, summary }
}
