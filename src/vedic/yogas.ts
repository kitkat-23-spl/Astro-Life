/**
 * Yoga catalogue. Each entry is a classical definition plus a check that
 * returns the concrete combinations found in a chart. Sources: Brihat
 * Parashara Hora Shastra (BPHS), Phaladeepika (PD), Saravali, Jaimini Sutras.
 */
import { ordinal } from '../astro/constants'
import { DUSTHANA, EXALTATION, KENDRA, SEVEN, SIGN_LORD, UPACHAYA, houseFrom, type Graha } from './constants'
import {
  GOOD_DIGNITY, aspectedSigns, aspectsOnGraha, conjunctWith, dignityPhrase, dignityScore, h, houseOf, housesRuledBy, isBenefic,
  lordOfHouse, occupants, pos, rashiDrishti, sambandha,
} from './query'
import { signName, type VedicChart } from './sidereal'
import { charaKarakas } from './jaimini'
import { vargaSign } from './varga'

export type YogaGroup = 'Pancha Mahapurusha' | 'Raja' | 'Dhana' | 'Solar' | 'Lunar' | 'Nabhasa' | 'Doshas and afflictions' | 'Other'
export type YogaTone = 'good' | 'mixed' | 'challenge'

export interface YogaMatch { basis: string[]; note?: string; tone?: YogaTone }

export interface YogaDef {
  id: string
  name: string
  group: YogaGroup
  tone: YogaTone
  /** What the chart must contain. */
  definition: string
  /** Classical result, in brief. */
  result: string
  source: string
  needsTime: boolean
  check: (chart: VedicChart) => YogaMatch[]
}

export interface YogaResult {
  def: YogaDef
  matches: YogaMatch[]
  present: boolean
  /** False when the yoga needs a birth time that is missing. */
  checked: boolean
  /** Formed, but overridden by another Nabhasa yoga (Charak, ch. XX). */
  supersededBy?: string
}

export const YOGA_GROUPS: YogaGroup[] = ['Pancha Mahapurusha', 'Raja', 'Dhana', 'Solar', 'Lunar', 'Other', 'Doshas and afflictions', 'Nabhasa']

const TARA: Graha[] = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
const BENEFICS: Graha[] = ['Mercury', 'Jupiter', 'Venus']
const MALEFICS: Graha[] = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu']

const strong = (chart: VedicChart, g: Graha) => { const d = pos(chart, g).dignity; return d !== null && GOOD_DIGNITY.includes(d) }
const inKendraFrom = (chart: VedicChart, g: Graha, sign: number) => KENDRA.includes(houseOf(chart, g, sign))
const fromMoon = (chart: VedicChart, g: Graha) => houseOf(chart, g, pos(chart, 'Moon').sign)
const fromLagna = (chart: VedicChart, g: Graha) => pos(chart, g).house!
const mutualKendra = (chart: VedicChart, a: Graha, b: Graha) => KENDRA.includes(houseFrom(pos(chart, a).sign, pos(chart, b).sign))
/** Lagna lord neither debilitated nor in a dusthana. */
const lagnaLordSound = (chart: VedicChart) => {
  const p = pos(chart, lordOfHouse(chart, 1))
  return p.dignity !== 'debilitated' && !DUSTHANA.includes(p.house!)
}
const one = (ok: boolean, basis: string[], note?: string): YogaMatch[] => (ok ? [{ basis, note }] : [])
const HARD: Graha[] = ['Mars', 'Saturn']
/** Tone of a yoga formed by the given planets: benefics good, malefics adverse, both mixed (Charak, ch. XXII). */
const formedBy = (gs: Graha[]): YogaTone | undefined => gs.every((g) => HARD.includes(g)) ? 'challenge' : gs.some((g) => HARD.includes(g)) ? 'mixed' : undefined
const formedNote = (gs: Graha[]) => gs.every((g) => HARD.includes(g)) ? 'Formed only by malefics, which the texts read as adverse.' : gs.some((g) => HARD.includes(g)) ? 'Formed by both benefics and malefics: a mixed result.' : undefined
/** Lords of the 2nd or 7th (marakas) joined with or aspecting a planet. */
const marakaOn = (c: VedicChart, g: Graha) => [lordOfHouse(c, 2), lordOfHouse(c, 7)].filter((m) => m !== g && (conjunctWith(c, g).includes(m) || aspectsOnGraha(c, g).includes(m)))
const seat = (chart: VedicChart, g: Graha) => `${g} in the ${h(fromLagna(chart, g))}`

/* ------------------------------------------------------------------ */
/* Pancha Mahapurusha                                                   */
/* ------------------------------------------------------------------ */

const MAHAPURUSHA: [Graha, string, string][] = [
  ['Mars', 'Ruchaka', 'Physical strength, courage, command over others and success in competitive or military work.'],
  ['Mercury', 'Bhadra', 'Sharp intellect, eloquence, skill in trade and learning, and a long, comfortable life.'],
  ['Jupiter', 'Hamsa', 'Wisdom, righteous conduct, respect from others and an inclination to teaching or spiritual work.'],
  ['Venus', 'Malavya', 'Comfort, vehicles, refined taste, artistic ability and a contented married life.'],
  ['Saturn', 'Shasha', 'Authority over people and organisations, endurance and influence that grows with age.'],
]

const mahapurusha: YogaDef[] = MAHAPURUSHA.map(([g, name, result]) => ({
  id: `mp-${name.toLowerCase()}`, name: `${name} yoga`, group: 'Pancha Mahapurusha', tone: 'good', needsTime: true,
  definition: `${g} in its own, moolatrikona or exaltation sign in a kendra (1st, 4th, 7th or 10th) from the lagna.`,
  result, source: 'BPHS 75',
  check: (c) => {
    if (!(KENDRA.includes(fromLagna(c, g)) && strong(c, g))) return []
    // Charak (ch. XXII): full results only when the Sun and Moon are also strong; otherwise ordinary results in its dasha.
    const weak = (['Sun', 'Moon'] as Graha[]).filter((l) => pos(c, l).dignity === 'debilitated' || DUSTHANA.includes(fromLagna(c, l)))
    return [{ basis: [`${g} ${dignityPhrase(pos(c, g).dignity)}`, seat(c, g)], note: weak.length ? `${weak.join(' and ')} ${weak.length > 1 ? 'are' : 'is'} weak, so the texts expect only modest results, mainly in ${g}'s dasha.` : undefined, tone: weak.length ? 'mixed' : undefined }]
  },
}))

/* ------------------------------------------------------------------ */
/* Solar yogas (planets around the Sun; Moon, Rahu, Ketu excluded)      */
/* ------------------------------------------------------------------ */

function aroundSun(c: VedicChart) {
  const sun = pos(c, 'Sun').sign
  return {
    second: TARA.filter((g) => houseOf(c, g, sun) === 2),
    twelfth: TARA.filter((g) => houseOf(c, g, sun) === 12),
  }
}

const solar: YogaDef[] = [
  {
    id: 'vesi', name: 'Vesi yoga', group: 'Solar', tone: 'good', needsTime: false,
    definition: 'A planet other than the Moon, Rahu or Ketu in the 2nd from the Sun, with the 12th from the Sun empty of them.',
    result: 'Truthful, balanced and industrious; steady fortune. Formed by benefics: eloquent and wealthy. By malefics: hardship and poor company.', source: 'BPHS 37; Charak XXII',
    check: (c) => { const s = aroundSun(c); return s.second.length > 0 && !s.twelfth.length ? [{ basis: [`${s.second.join(', ')} in the 2nd from the Sun`], note: formedNote(s.second), tone: formedBy(s.second) }] : [] },
  },
  {
    id: 'vasi', name: 'Vasi yoga', group: 'Solar', tone: 'good', needsTime: false,
    definition: 'A planet other than the Moon, Rahu or Ketu in the 12th from the Sun, with the 2nd from the Sun empty of them.',
    result: 'Learned, eloquent, charitable, good memory. Formed by benefics: intelligent and wealthy. By malefics: harsh and unwise.', source: 'BPHS 37; Charak XXII',
    check: (c) => { const s = aroundSun(c); return s.twelfth.length > 0 && !s.second.length ? [{ basis: [`${s.twelfth.join(', ')} in the 12th from the Sun`], note: formedNote(s.twelfth), tone: formedBy(s.twelfth) }] : [] },
  },
  {
    id: 'ubhayachari', name: 'Ubhayachari yoga', group: 'Solar', tone: 'good', needsTime: false,
    definition: 'Planets other than the Moon, Rahu or Ketu on both sides of the Sun (2nd and 12th from it).',
    result: 'Strong, able to carry great responsibility, learned and prosperous. Formed by malefics: hardship and ill health.', source: 'BPHS 37; Charak XXII',
    check: (c) => { const s = aroundSun(c); const all = [...s.second, ...s.twelfth]; return s.second.length > 0 && s.twelfth.length > 0 ? [{ basis: [`${s.second.join(', ')} in the 2nd from the Sun`, `${s.twelfth.join(', ')} in the 12th from the Sun`], note: formedNote(all), tone: formedBy(all) }] : [] },
  },
  {
    id: 'budhaditya', name: 'Budhaditya yoga', group: 'Solar', tone: 'good', needsTime: false,
    definition: 'The Sun and Mercury in the same sign.',
    result: 'Intelligence, analytical skill and good communication; useful in education, administration and business.', source: 'Saravali',
    check: (c) => {
      const s = pos(c, 'Sun'), m = pos(c, 'Mercury')
      return s.sign === m.sign ? [{ basis: [`Sun and Mercury in ${signName(s.sign)}`], note: m.combust ? 'Mercury is combust, which most authors say weakens the yoga.' : undefined, tone: m.combust ? 'mixed' : undefined }] : []
    },
  },
]

/* ------------------------------------------------------------------ */
/* Lunar yogas                                                          */
/* ------------------------------------------------------------------ */

function aroundMoon(c: VedicChart) {
  return { second: TARA.filter((g) => fromMoon(c, g) === 2), twelfth: TARA.filter((g) => fromMoon(c, g) === 12) }
}

function adhi(c: VedicChart, ref: number, label: string): YogaMatch[] {
  const placed = BENEFICS.filter((g) => [6, 7, 8].includes(houseOf(c, g, ref)))
  if (placed.length < 2) return []
  const spoil = MALEFICS.filter((g) => [6, 7, 8].includes(houseOf(c, g, ref)))
  const notes = [placed.length === 3 ? 'All three benefics take part: the full form of the yoga.' : 'Two of the three benefics take part: a partial form (the book asks for all three).']
  if (spoil.length) notes.push(`${spoil.join(' and ')} also ${spoil.length > 1 ? 'occupy' : 'occupies'} these houses, which spoils the yoga.`)
  return [{ basis: placed.map((g) => `${g} ${ordinal(houseOf(c, g, ref))} from the ${label}`), note: notes.join(' '), tone: spoil.length ? 'mixed' : undefined }]
}

const lunar: YogaDef[] = [
  {
    id: 'sunapha', name: 'Sunapha yoga', group: 'Lunar', tone: 'good', needsTime: false,
    definition: 'A planet other than the Sun, Rahu or Ketu in the 2nd from the Moon, with the 12th from the Moon empty of them.',
    result: 'Self-earned wealth, intelligence and a good name built by one\'s own effort.', source: 'BPHS 38',
    check: (c) => { const m = aroundMoon(c); return m.second.length > 0 && !m.twelfth.length ? [{ basis: [`${m.second.join(', ')} in the 2nd from the Moon`], note: formedNote(m.second), tone: formedBy(m.second) === 'challenge' ? 'mixed' : undefined }] : [] },
  },
  {
    id: 'anapha', name: 'Anapha yoga', group: 'Lunar', tone: 'good', needsTime: false,
    definition: 'A planet other than the Sun, Rahu or Ketu in the 12th from the Moon, with the 2nd from the Moon empty of them.',
    result: 'Good health, dignified manners and comfort; at ease with solitude in later life.', source: 'BPHS 38',
    check: (c) => { const m = aroundMoon(c); return m.twelfth.length > 0 && !m.second.length ? [{ basis: [`${m.twelfth.join(', ')} in the 12th from the Moon`], note: formedNote(m.twelfth), tone: formedBy(m.twelfth) === 'challenge' ? 'mixed' : undefined }] : [] },
  },
  {
    id: 'durdhara', name: 'Durdhara yoga', group: 'Lunar', tone: 'good', needsTime: false,
    definition: 'Planets other than the Sun, Rahu or Ketu in both the 2nd and the 12th from the Moon.',
    result: 'Resources, generosity and emotional stability when benefics form it. Malefics on both sides of the Moon constrict it instead.', source: 'BPHS 38; Charak XXII',
    check: (c) => {
      const m = aroundMoon(c), all = [...m.second, ...m.twelfth]
      return m.second.length > 0 && m.twelfth.length > 0 ? [{ basis: [`${m.second.join(', ')} in the 2nd from the Moon`, `${m.twelfth.join(', ')} in the 12th from the Moon`], note: all.every((g) => HARD.includes(g)) ? 'Formed by malefics, which hem in the Moon: adverse (Charak).' : formedNote(all), tone: formedBy(all) }] : []
    },
  },
  {
    id: 'kemadruma', name: 'Kemadruma yoga', group: 'Lunar', tone: 'challenge', needsTime: false,
    definition: 'No planet other than the Sun, Rahu or Ketu in the 2nd or 12th from the Moon. Cancelled by planets in kendras from the lagna or the Moon, by all planets aspecting the Moon, or by a strong Moon in a kendra with benefic influence.',
    result: 'Periods of feeling unsupported and uneven finances; it weakens raja yogas. In practice it is usually cancelled.', source: 'BPHS 38; Charak XXII',
    check: (c) => {
      const m = aroundMoon(c)
      if (m.second.length || m.twelfth.length) return []
      const moon = pos(c, 'Moon').sign
      const reasons: string[] = []
      const inKendra = TARA.filter((g) => inKendraFrom(c, g, moon) || (c.lagnaSign !== null && KENDRA.includes(fromLagna(c, g))))
      if (inKendra.length) reasons.push(`${inKendra.join(', ')} in a kendra from the lagna or Moon`)
      const onMoon = aspectsOnGraha(c, 'Moon')
      if ((['Sun', ...TARA] as Graha[]).every((g) => onMoon.includes(g))) reasons.push('all planets aspect the Moon')
      const mo = pos(c, 'Moon')
      if (c.lagnaSign !== null && KENDRA.includes(mo.house!) && mo.dignity !== 'debilitated' && BENEFICS.some((g) => onMoon.includes(g) || conjunctWith(c, 'Moon').includes(g))) reasons.push('the Moon is in a kendra with a benefic joining or aspecting it')
      return [{
        basis: ['2nd and 12th from the Moon empty'],
        note: reasons.length ? `Cancelled: ${reasons.join('; ')}.` : 'No cancellation found.',
        tone: reasons.length ? 'mixed' : 'challenge',
      }]
    },
  },
  {
    id: 'gajakesari', name: 'Gajakesari yoga', group: 'Lunar', tone: 'good', needsTime: false,
    definition: 'Jupiter in a kendra from the Moon, not debilitated or combust. Full results need benefic influence on Jupiter and a Moon that is neither debilitated nor combust.',
    result: 'Intelligence, a lasting reputation, generosity and the ability to overcome opponents.', source: 'BPHS 36',
    check: (c) => {
      const j = pos(c, 'Jupiter'), mo = pos(c, 'Moon')
      if (!KENDRA.includes(fromMoon(c, 'Jupiter')) || j.dignity === 'debilitated' || j.combust) return []
      const missing: string[] = []
      if (mo.dignity === 'debilitated') missing.push('the Moon is debilitated')
      if (mo.combust) missing.push('the Moon is combust')
      if (![...conjunctWith(c, 'Jupiter'), ...aspectsOnGraha(c, 'Jupiter')].some((x) => BENEFICS.includes(x) || x === 'Moon')) missing.push('no benefic joins or aspects Jupiter')
      return [{ basis: [`Jupiter ${ordinal(fromMoon(c, 'Jupiter'))} from the Moon`, `Jupiter ${dignityPhrase(j.dignity)}`], note: missing.length ? `A weak form: ${missing.join('; ')} (Charak).` : undefined, tone: missing.length ? 'mixed' : undefined }]
    },
  },
  {
    id: 'chandra-mangala', name: 'Chandra-Mangala yoga', group: 'Lunar', tone: 'good', needsTime: false,
    definition: 'The Moon and Mars together, or Mars in the 7th from the Moon.',
    result: 'Enterprise and strong earning capacity, often through trade, property or determined effort.', source: 'PD 6',
    check: (c) => one([1, 7].includes(fromMoon(c, 'Mars')), [fromMoon(c, 'Mars') === 1 ? 'Moon and Mars together' : 'Mars opposite the Moon']),
  },
  {
    id: 'adhi-moon', name: 'Adhi yoga (from the Moon)', group: 'Lunar', tone: 'good', needsTime: false,
    definition: 'Natural benefics (Mercury, Jupiter, Venus) in the 6th, 7th and 8th from the Moon; at least two of them.',
    result: 'Leadership positions, trust from others, comfort and victory over opponents.', source: 'BPHS 36',
    check: (c) => adhi(c, pos(c, 'Moon').sign, 'Moon'),
  },
  {
    id: 'shakata', name: 'Shakata yoga', group: 'Lunar', tone: 'challenge', needsTime: false,
    definition: 'Jupiter in the 6th, 8th or 12th from the Moon. Cancelled when Jupiter is in a kendra from the lagna.',
    result: 'Fortune that rises and falls like a cart wheel; recovery after setbacks.', source: 'PD 6',
    check: (c) => {
      const n = fromMoon(c, 'Jupiter')
      if (![6, 8, 12].includes(n)) return []
      const cancelled = c.lagnaSign !== null && KENDRA.includes(fromLagna(c, 'Jupiter'))
      const bothStrong = strong(c, 'Jupiter') && strong(c, 'Moon')
      const note = cancelled ? 'Cancelled: Jupiter is in a kendra from the lagna.' : bothStrong ? 'Softened: the Moon and Jupiter are both in their own or exaltation signs (Charak).' : undefined
      return [{ basis: [`Jupiter ${ordinal(n)} from the Moon`], note, tone: cancelled || bothStrong ? 'mixed' : undefined }]
    },
  },
  {
    id: 'amala', name: 'Amala yoga', group: 'Lunar', tone: 'good', needsTime: false,
    definition: 'A natural benefic (Mercury, Jupiter, Venus) in the 10th from the lagna or from the Moon.',
    result: 'A clean reputation, ethical conduct and lasting fame through good work.', source: 'PD 6',
    check: (c) => {
      const out = BENEFICS.filter((g) => fromMoon(c, g) === 10).map((g) => `${g} 10th from the Moon`)
      if (c.lagnaSign !== null) out.push(...BENEFICS.filter((g) => fromLagna(c, g) === 10).map((g) => `${g} in the 10th house`))
      return one(out.length > 0, out)
    },
  },
  {
    id: 'vasumati', name: 'Vasumati yoga', group: 'Lunar', tone: 'good', needsTime: false,
    definition: 'All three natural benefics in upachaya houses (3, 6, 10, 11) from the lagna or the Moon.',
    result: 'Wealth that accumulates steadily; financial independence.', source: 'PD 6',
    check: (c) => {
      const moon = pos(c, 'Moon').sign
      if (BENEFICS.every((g) => UPACHAYA.includes(houseOf(c, g, moon)))) return [{ basis: BENEFICS.map((g) => `${g} ${ordinal(houseOf(c, g, moon))} from the Moon`) }]
      if (c.lagnaSign !== null && BENEFICS.every((g) => UPACHAYA.includes(fromLagna(c, g)))) return [{ basis: BENEFICS.map((g) => seat(c, g)) }]
      return []
    },
  },
]

/* ------------------------------------------------------------------ */
/* Raja yogas                                                           */
/* ------------------------------------------------------------------ */

function lordPairs(c: VedicChart, as: number[], bs: number[]): YogaMatch[] {
  const seen = new Set<string>()
  const out: YogaMatch[] = []
  for (const x of as) for (const y of bs) {
    if (x === y) continue
    const a = lordOfHouse(c, x), b = lordOfHouse(c, y)
    if (a === b) continue
    const key = [a, b].sort().join()
    const how = sambandha(c, a, b)
    if (how && !seen.has(key)) {
      seen.add(key)
      out.push({ basis: [`${ordinal(x)} lord ${a}`, `${ordinal(y)} lord ${b}`, how] })
    }
  }
  return out
}

/** Lord of a dusthana placed in a dusthana (Viparita Raja yoga). */
function viparita(c: VedicChart, house: number): YogaMatch[] {
  const l = lordOfHouse(c, house)
  const at = fromLagna(c, l)
  // Charak (ch. XXI, XXII): the lord must sit in one of the other two dusthanas, not its own house.
  return one(DUSTHANA.includes(at) && at !== house, [`${ordinal(house)} lord ${l}`, `in the ${h(at)}`])
}

function exchanges(c: VedicChart, kind: 'maha' | 'khala' | 'dainya' | 'viparita'): YogaMatch[] {
  const out: YogaMatch[] = []
  for (let i = 0; i < SEVEN.length; i++) for (let j = i + 1; j < SEVEN.length; j++) {
    const a = SEVEN[i], b = SEVEN[j]
    if (sambandha(c, a, b) !== 'sign exchange') continue
    const hs = [fromLagna(c, a), fromLagna(c, b)]
    const k = hs.every((x) => DUSTHANA.includes(x)) ? 'viparita' : hs.some((x) => DUSTHANA.includes(x)) ? 'dainya' : hs.includes(3) ? 'khala' : 'maha'
    if (k === kind) out.push({ basis: [`${a} in the ${h(hs[0])}`, `${b} in the ${h(hs[1])}`, 'sign exchange'] })
  }
  return out
}

function neechaBhanga(c: VedicChart): YogaMatch[] {
  const out: YogaMatch[] = []
  const moon = pos(c, 'Moon').sign
  const kendraAny = (g: Graha) => inKendraFrom(c, g, moon) || (c.lagnaSign !== null && KENDRA.includes(fromLagna(c, g)))
  for (const g of SEVEN) {
    const p = pos(c, g)
    if (p.dignity !== 'debilitated') continue
    const reasons: string[] = []
    const disp = SIGN_LORD[p.sign]
    if (kendraAny(disp)) reasons.push(`dispositor ${disp} in a kendra`)
    const exLord = SIGN_LORD[EXALTATION[g]!.sign]
    if (exLord !== disp && kendraAny(exLord)) reasons.push(`${exLord}, lord of its exaltation sign, in a kendra`)
    if (vargaSign(9, p.lon) === EXALTATION[g]!.sign) reasons.push('exalted in the navamsa')
    const near = [...conjunctWith(c, g), ...aspectsOnGraha(c, g)]
    if (disp !== g && near.includes(disp)) reasons.push(`joined or aspected by its dispositor ${disp}`)
    if (exLord !== g && exLord !== disp && near.includes(exLord)) reasons.push(`joined or aspected by ${exLord}, lord of its exaltation sign`)
    if (sambandha(c, g, disp) === 'sign exchange') reasons.push(`exchanges signs with ${disp}`)
    const otherNeecha = SEVEN.find((o) => o !== g && pos(c, o).dignity === 'debilitated' && aspectsOnGraha(c, g).includes(o) && aspectsOnGraha(c, o).includes(g))
    if (otherNeecha) reasons.push(`mutual aspect with the debilitated ${otherNeecha}`)
    if (reasons.length) out.push({ basis: [`${g} debilitated`, ...reasons] })
  }
  return out
}

const raja: YogaDef[] = [
  {
    id: 'raja', name: 'Raja yoga', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'A kendra lord (1, 4, 7, 10) and a trikona lord (1, 5, 9) related by conjunction, sign exchange, mutual aspect, or one in the other\'s sign aspected by it.',
    result: 'Rise in status, authority and recognition, delivered mainly in the dashas of the planets involved.', source: 'BPHS 39',
    check: (c) => lordPairs(c, [1, 4, 7, 10], [1, 5, 9]),
  },
  {
    id: 'yogakaraka', name: 'Yogakaraka planet', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'One planet that rules both a kendra (4, 7, 10) and a trikona (5, 9).',
    result: 'The most beneficial planet for the lagna. Its dashas and condition matter more than any other.', source: 'BPHS 34',
    check: (c) => SEVEN.flatMap((g) => {
      const owns = housesRuledBy(c, g)
      return owns.some((x) => [4, 7, 10].includes(x)) && owns.some((x) => [5, 9].includes(x))
        ? [{ basis: [`${g} rules the ${owns.map(ordinal).join(' and ')}`, seat(c, g)] }] : []
    }),
  },
  {
    id: 'dharma-karma', name: 'Dharma-Karmadhipati yoga', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'The lords of the 9th and 10th joined by conjunction, sign exchange or mutual aspect.',
    result: 'Work and purpose align; a strong indicator of professional standing and recognition.', source: 'BPHS 39',
    check: (c) => lordPairs(c, [9], [10]),
  },
  {
    id: 'jaimini-raja', name: 'Jaimini Raja yoga', group: 'Raja', tone: 'good', needsTime: false,
    definition: 'The Atmakaraka and Amatyakaraka together or in mutual rashi drishti (sign aspect).',
    result: 'Authority and success in one\'s chosen field, especially in the dashas of either karaka.', source: 'Jaimini Sutras 1.3',
    check: (c) => {
      const k = charaKarakas(c)
      const ak = k.Atmakaraka!, amk = k.Amatyakaraka!
      const a = pos(c, ak).sign, b = pos(c, amk).sign
      return one(a === b || rashiDrishti(a, b), [`Atmakaraka ${ak}`, `Amatyakaraka ${amk}`, a === b ? 'same sign' : 'rashi drishti'])
    },
  },
  {
    id: 'adhi-lagna', name: 'Adhi yoga (from the lagna)', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'Natural benefics (Mercury, Jupiter, Venus) in the 6th, 7th and 8th from the lagna; at least two of them.',
    result: 'Positions of trust and command, a comfortable life and success over rivals.', source: 'BPHS 36',
    check: (c) => adhi(c, c.lagnaSign!, 'lagna'),
  },
  {
    id: 'neecha-bhanga', name: 'Neecha Bhanga Raja yoga', group: 'Raja', tone: 'good', needsTime: false,
    definition: 'A debilitated planet whose debilitation is cancelled: its dispositor or exaltation-sign lord in a kendra from the lagna or Moon, or joining or aspecting it; an exchange with its dispositor; mutual aspect with another debilitated planet; or exaltation in the navamsa.',
    result: 'An early weakness that turns into strength; rise from modest beginnings.', source: 'PD 7; Charak XXII',
    check: neechaBhanga,
  },
  {
    id: 'harsha', name: 'Harsha yoga', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'The 6th lord in the 8th or 12th house.', result: 'Rise in status, fame and money in its dasha; victory over opponents.', source: 'Charak XXI; PD 6',
    check: (c) => viparita(c, 6),
  },
  {
    id: 'sarala', name: 'Sarala yoga', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'The 8th lord in the 6th or 12th house.', result: 'Rise in status, fame and money in its dasha; resilience in crises.', source: 'Charak XXI; PD 6',
    check: (c) => viparita(c, 8),
  },
  {
    id: 'vimala', name: 'Vimala yoga', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'The 12th lord in the 6th or 8th house.', result: 'Rise in status, fame and money in its dasha; expenses kept under control.', source: 'Charak XXI; PD 6',
    check: (c) => viparita(c, 12),
  },
  {
    id: 'maha-parivartana', name: 'Maha Parivartana yoga', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'Two planets in each other\'s signs, neither in a dusthana (6, 8, 12) or the 3rd.',
    result: 'Each planet acts as if in its own sign; the two houses support each other. Wealth, status and comfort.', source: 'PD 6',
    check: (c) => exchanges(c, 'maha'),
  },
  {
    id: 'khala-parivartana', name: 'Khala yoga', group: 'Other', tone: 'mixed', needsTime: true,
    definition: 'A sign exchange involving the 3rd house (and no dusthana).',
    result: 'Fluctuating fortune, with periods of effort followed by gains.', source: 'PD 6',
    check: (c) => exchanges(c, 'khala'),
  },
  {
    id: 'dainya-parivartana', name: 'Dainya yoga', group: 'Doshas and afflictions', tone: 'mixed', needsTime: true,
    definition: 'A sign exchange between a dusthana (6th, 8th or 12th) and any other house.',
    result: 'Early struggles in the matters of the houses involved, improving as the native matures.', source: 'PD 6',
    check: (c) => exchanges(c, 'dainya'),
  },
  {
    id: 'viparita-parivartana', name: 'Vipareeta exchange', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'Two dusthana lords (of the 6th, 8th and 12th) in each other\'s signs.',
    result: 'Prosperity and a rise in status after difficulties; adverse houses cancel each other.', source: 'Charak XXI',
    check: (c) => exchanges(c, 'viparita'),
  },
  {
    id: 'raja-parashara', name: 'Raja yoga (Parashara\'s special combinations)', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'Any of: the 5th and 9th lords together or in mutual aspect; the 4th and 10th lords exchanging signs with the 5th or 9th lord joining or aspecting; the 5th lord with the lagna or 9th lord in the 1st, 4th or 10th; Jupiter and Venus together in the 9th or with the 5th lord; Venus in the lagna aspected by the Moon and Jupiter; the 10th lord exalted or in its own sign aspecting the lagna.',
    result: 'High status; in modern terms, senior government or institutional positions.', source: 'BPHS; Charak XXI',
    check: (c) => {
      const out: YogaMatch[] = []
      const L = (n: number) => lordOfHouse(c, n)
      const link59 = L(5) !== L(9) && sambandha(c, L(5), L(9))
      if (link59 && (link59 === 'conjunction' || link59 === 'mutual aspect')) out.push({ basis: [`5th lord ${L(5)} and 9th lord ${L(9)}: ${link59}`] })
      if (sambandha(c, L(4), L(10)) === 'sign exchange' && [L(5), L(9)].some((g) => g !== L(4) && g !== L(10) && (conjunctWith(c, L(4)).includes(g) || aspectsOnGraha(c, L(4)).includes(g) || conjunctWith(c, L(10)).includes(g) || aspectsOnGraha(c, L(10)).includes(g))))
        out.push({ basis: [`4th lord ${L(4)} and 10th lord ${L(10)} exchange signs`, 'the 5th or 9th lord joins or aspects them'] })
      const l5 = L(5)
      if ([1, 4, 10].includes(fromLagna(c, l5)) && [L(1), L(9)].some((g) => g !== l5 && conjunctWith(c, l5).includes(g))) out.push({ basis: [`5th lord ${l5} with the lagna or 9th lord`, seat(c, l5)] })
      if (pos(c, 'Jupiter').sign === pos(c, 'Venus').sign && (fromLagna(c, 'Jupiter') === 9 || conjunctWith(c, 'Jupiter').includes(l5))) out.push({ basis: ['Jupiter and Venus together', fromLagna(c, 'Jupiter') === 9 ? 'in the 9th house' : `with the 5th lord ${l5}`] })
      if (fromLagna(c, 'Venus') === 1 && ['Moon', 'Jupiter'].every((g) => aspectsOnGraha(c, 'Venus').includes(g as Graha))) out.push({ basis: ['Venus in the lagna', 'aspected by the Moon and Jupiter'] })
      const l10 = L(10), p10 = pos(c, l10)
      if ((p10.dignity === 'exalted' || p10.dignity === 'own' || p10.dignity === 'moolatrikona') && (fromLagna(c, l10) === 1 || aspectedSigns(l10, p10.sign).includes(c.lagnaSign!))) out.push({ basis: [`10th lord ${l10} ${dignityPhrase(p10.dignity)}`, fromLagna(c, l10) === 1 ? 'in the lagna' : 'aspecting the lagna'] })
      return out
    },
  },
  {
    id: 'neecha-dusthana-raja', name: 'Raja yoga from debilitated dusthana lords', group: 'Raja', tone: 'good', needsTime: true,
    definition: 'A debilitated lord of the 3rd, 6th, 8th or 12th, with a strong lagna lord that occupies or aspects the lagna.',
    result: 'A rise in status during the dasha of the debilitated lord.', source: 'BPHS; Charak XXI',
    check: (c) => {
      const ll = lordOfHouse(c, 1), pl = pos(c, ll)
      const llOk = (strong(c, ll) || dignityScore(pl.dignity) >= 1) && (pl.house === 1 || aspectedSigns(ll, pl.sign).includes(c.lagnaSign!))
      if (!llOk) return []
      return [3, 6, 8, 12].map((n) => lordOfHouse(c, n)).filter((g, i, a) => a.indexOf(g) === i && g !== ll && pos(c, g).dignity === 'debilitated')
        .map((g) => ({ basis: [`${g}, lord of the ${housesRuledBy(c, g).filter((x) => [3, 6, 8, 12].includes(x)).map(ordinal).join(' and ')}, debilitated`, `lagna lord ${ll} ${dignityPhrase(pl.dignity)} ${pl.house === 1 ? 'in' : 'aspecting'} the lagna`] }))
    },
  },
]

/* ------------------------------------------------------------------ */
/* Dhana and other named yogas                                          */
/* ------------------------------------------------------------------ */

const dhana: YogaDef[] = [
  {
    id: 'dhana', name: 'Dhana yoga', group: 'Dhana', tone: 'good', needsTime: true,
    definition: 'Two of the lords of the 1st, 2nd, 5th, 9th and 11th related by conjunction, exchange, mutual aspect, or one in the other\'s sign aspected by it.',
    result: 'Good earning capacity, realised mainly in the dashas of the planets involved. Full results need a strong lagna and lagna lord.', source: 'BPHS 41; Charak XXI',
    check: (c) => [...lordPairs(c, [2, 11], [1, 5, 9]), ...lordPairs(c, [2], [11]), ...lordPairs(c, [1], [5, 9]), ...lordPairs(c, [5], [9])],
  },
  {
    id: 'lakshmi', name: 'Lakshmi yoga', group: 'Dhana', tone: 'good', needsTime: true,
    definition: 'The 9th lord in its own, moolatrikona or exaltation sign in a kendra, with a strong lagna lord.',
    result: 'Wealth, good fortune, a respected family life and generosity.', source: 'BPHS 36',
    check: (c) => {
      const l9 = lordOfHouse(c, 9), at = fromLagna(c, l9)
      return one(strong(c, l9) && KENDRA.includes(at) && lagnaLordSound(c), [`9th lord ${l9} ${dignityPhrase(pos(c, l9).dignity)}`, `in the ${h(at)}`])
    },
  },
  {
    id: 'saraswati', name: 'Saraswati yoga', group: 'Dhana', tone: 'good', needsTime: true,
    definition: 'Jupiter, Venus and Mercury in kendras, trikonas or the 2nd house, with Jupiter in its own, exaltation or a friendly sign.',
    result: 'Learning, eloquence, skill in writing, music or the arts, and recognition for knowledge.', source: 'PD 6',
    check: (c) => {
      const ok = BENEFICS.every((g) => [1, 2, 4, 5, 7, 9, 10].includes(fromLagna(c, g)))
      const jd = pos(c, 'Jupiter').dignity
      return one(ok && (jd === 'friend' || (jd !== null && GOOD_DIGNITY.includes(jd))), BENEFICS.map((g) => seat(c, g)))
    },
  },
  {
    id: 'kalanidhi', name: 'Kalanidhi yoga', group: 'Dhana', tone: 'good', needsTime: true,
    definition: 'Jupiter in the 2nd or 5th, joined or aspected by both Mercury and Venus.',
    result: 'Talent in the arts and learning, honour and comfortable means.', source: 'Saravali',
    check: (c) => {
      const near = [...conjunctWith(c, 'Jupiter'), ...aspectsOnGraha(c, 'Jupiter')]
      return one([2, 5].includes(fromLagna(c, 'Jupiter')) && near.includes('Mercury') && near.includes('Venus'), [seat(c, 'Jupiter'), 'Mercury and Venus join or aspect it'])
    },
  },
  {
    id: 'parijata', name: 'Parijata yoga', group: 'Other', tone: 'good', needsTime: true,
    definition: 'The dispositor of the lagna lord in a kendra or trikona, in its own or exaltation sign.',
    result: 'Steady rise through life; happiness and respect especially in middle and later years.', source: 'BPHS 36',
    check: (c) => {
      const ll = lordOfHouse(c, 1), d = SIGN_LORD[pos(c, ll).sign]
      return one(d !== ll && [1, 4, 5, 7, 9, 10].includes(fromLagna(c, d)) && strong(c, d), [`Lagna lord ${ll} in ${signName(pos(c, ll).sign)}`, `dispositor ${d} ${dignityPhrase(pos(c, d).dignity)}`, seat(c, d)])
    },
  },
  {
    id: 'chamara', name: 'Chamara yoga', group: 'Other', tone: 'good', needsTime: true,
    definition: 'The lagna lord exalted in a kendra and aspected by Jupiter, or two benefics together in the 1st, 7th, 9th or 10th.',
    result: 'Honour from authorities, learning and a long, distinguished life.', source: 'BPHS 36',
    check: (c) => {
      const ll = lordOfHouse(c, 1), p = pos(c, ll)
      const out = one(p.dignity === 'exalted' && KENDRA.includes(p.house!) && aspectsOnGraha(c, ll).includes('Jupiter'), [`Lagna lord ${ll} exalted`, seat(c, ll), 'Jupiter aspects it'])
      for (const hse of [1, 7, 9, 10]) {
        const b = occupants(c, hse).filter((g) => BENEFICS.includes(g))
        if (b.length >= 2) out.push({ basis: [`${b.join(' and ')} together in the ${h(hse)}`] })
      }
      return out
    },
  },
  {
    id: 'shankha', name: 'Shankha yoga', group: 'Other', tone: 'good', needsTime: true,
    definition: 'The 5th and 6th lords in kendras from each other with a strong lagna, or the lagna and 10th lords in movable signs with a strong 9th lord.',
    result: 'Humane, prosperous and long-lived; a comfortable family life.', source: 'BPHS 36',
    check: (c) => {
      const a = lordOfHouse(c, 5), b = lordOfHouse(c, 6)
      const out = one(a !== b && mutualKendra(c, a, b) && lagnaLordSound(c), [`5th lord ${a} and 6th lord ${b} in mutual kendras`])
      const l1 = lordOfHouse(c, 1), l10 = lordOfHouse(c, 10), l9 = lordOfHouse(c, 9)
      if (pos(c, l1).sign % 3 === 0 && pos(c, l10).sign % 3 === 0 && strong(c, l9)) out.push({ basis: [`Lagna lord ${l1} and 10th lord ${l10} in movable signs`, `9th lord ${l9} ${dignityPhrase(pos(c, l9).dignity)}`] })
      return out
    },
  },
  {
    id: 'bheri', name: 'Bheri yoga', group: 'Other', tone: 'good', needsTime: true,
    definition: 'Venus, Jupiter and the lagna lord in kendras, with a strong 9th lord.',
    result: 'Wealth, a good family, fame and a long life.', source: 'BPHS 36',
    check: (c) => {
      const ll = lordOfHouse(c, 1), l9 = lordOfHouse(c, 9)
      const all = (['Venus', 'Jupiter', ll] as Graha[]).every((g) => KENDRA.includes(fromLagna(c, g)))
      return one(all && dignityScore(pos(c, l9).dignity) >= 1, [seat(c, 'Venus'), seat(c, 'Jupiter'), `Lagna lord ${ll} in the ${h(fromLagna(c, ll))}`, `9th lord ${l9} ${dignityPhrase(pos(c, l9).dignity)}`])
    },
  },
  {
    id: 'kahala', name: 'Kahala yoga', group: 'Other', tone: 'good', needsTime: true,
    definition: 'The 4th and 9th lords in kendras from each other, with a sound lagna lord.',
    result: 'Boldness, leadership and command over others.', source: 'BPHS 36',
    check: (c) => {
      const a = lordOfHouse(c, 4), b = lordOfHouse(c, 9)
      return one(a !== b && mutualKendra(c, a, b) && lagnaLordSound(c), [`4th lord ${a} and 9th lord ${b} in mutual kendras`])
    },
  },
  {
    id: 'guru-mangala', name: 'Guru-Mangala yoga', group: 'Other', tone: 'good', needsTime: false,
    definition: 'Jupiter and Mars together or opposite each other.',
    result: 'Courage guided by principle; success in law, engineering, administration or property.', source: 'Saravali',
    check: (c) => { const n = houseFrom(pos(c, 'Jupiter').sign, pos(c, 'Mars').sign); return one(n === 1 || n === 7, [n === 1 ? 'Jupiter and Mars together' : 'Jupiter opposite Mars']) },
  },
  {
    id: 'shubha-kartari', name: 'Shubha Kartari yoga', group: 'Other', tone: 'good', needsTime: true,
    definition: 'Natural benefics in both the 2nd and the 12th from the lagna, and no malefics there.',
    result: 'The lagna is protected: good health, character and support from others.', source: 'PD 6',
    check: (c) => {
      const s = occupants(c, 2), t = occupants(c, 12)
      return one(s.some(isBenefic) && t.some(isBenefic) && ![...s, ...t].some((g) => MALEFICS.includes(g)), [`${s.join(', ')} in the 2nd`, `${t.join(', ')} in the 12th`])
    },
  },
  {
    id: 'daridra', name: 'Daridra yoga', group: 'Doshas and afflictions', tone: 'challenge', needsTime: true,
    definition: 'The 11th lord in the 6th, 8th or 12th house.',
    result: 'Income that is hard to retain; gains come through effort and need careful management.', source: 'PD 6',
    check: (c) => {
      const l = lordOfHouse(c, 11), p = pos(c, l)
      if (!DUSTHANA.includes(p.house!)) return []
      const soft = dignityScore(p.dignity) >= 2
      return [{ basis: [`11th lord ${l}`, `in the ${h(p.house!)}`], note: soft ? `${l} is ${dignityPhrase(p.dignity)}, which reduces the effect.` : undefined, tone: soft ? 'mixed' : undefined }]
    },
  },
  {
    id: 'pravrajya', name: 'Pravrajya yoga', group: 'Other', tone: 'mixed', needsTime: false,
    definition: 'Four or more of the seven planets in one sign; or the Moon-sign lord aspected by Saturn alone; or the Moon in a Saturn drekkana aspected by Mars and Saturn, or in a Mars navamsa aspected by Saturn; or Jupiter in the 9th with Saturn aspecting the lagna, the Moon and Jupiter.',
    result: 'A strong pull towards renunciation, spiritual discipline or a life devoted to one cause.', source: 'BPHS 77; Charak XXII',
    check: (c) => {
      const out: YogaMatch[] = []
      for (let s = 0; s < 12; s++) {
        const here = SEVEN.filter((g) => pos(c, g).sign === s)
        if (here.length >= 4) out.push({ basis: [`${here.join(', ')} in ${signName(s)}`] })
      }
      const moon = pos(c, 'Moon'), dl = SIGN_LORD[moon.sign]
      const onDl = aspectsOnGraha(c, dl)
      if (dl !== 'Saturn' && onDl.length === 1 && onDl[0] === 'Saturn') out.push({ basis: [`The Moon-sign lord ${dl} aspected by Saturn alone`] })
      const dr = SIGN_LORD[vargaSign(3, moon.lon)]
      const onMoon = aspectsOnGraha(c, 'Moon')
      if (dr === 'Saturn' && onMoon.includes('Mars') && onMoon.includes('Saturn')) out.push({ basis: ['The Moon in a Saturn drekkana', 'aspected by Mars and Saturn'] })
      if (SIGN_LORD[vargaSign(9, moon.lon)] === 'Mars' && onMoon.includes('Saturn')) out.push({ basis: ['The Moon in a Mars navamsa', 'aspected by Saturn'] })
      if (c.lagnaSign !== null && fromLagna(c, 'Jupiter') === 9) {
        const satOn = (s: number) => aspectedSigns('Saturn', pos(c, 'Saturn').sign).includes(s) || pos(c, 'Saturn').sign === s
        if (satOn(c.lagnaSign) && satOn(moon.sign) && satOn(pos(c, 'Jupiter').sign)) out.push({ basis: ['Jupiter in the 9th', 'Saturn aspects the lagna, the Moon and Jupiter'], note: 'Associated with founding a school of thought.' })
      }
      return out
    },
  },
  {
    id: 'dhana-parashara', name: 'Dhana yoga (Parashara\'s special combinations)', group: 'Dhana', tone: 'good', needsTime: true,
    definition: 'A planet in its own sign in the 5th with set planets in the 11th (for example Jupiter in the 5th and Mercury in the 11th); a planet in its own sign in the lagna under the influence of set planets (for example the Sun in Simha lagna with Mars and Jupiter); or one planet ruling the 2nd and 7th placed in the 4th.',
    result: 'Wealth along the 5/11 axis of gains, or through the native\'s own standing.', source: 'BPHS; Charak XXI',
    check: (c) => {
      const out: YogaMatch[] = []
      const own = (g: Graha) => SIGN_LORD[pos(c, g).sign] === g
      const FIVE: [Graha, Graha[]][] = [['Mercury', ['Moon', 'Mars', 'Jupiter']], ['Sun', ['Moon', 'Jupiter', 'Saturn']], ['Saturn', ['Sun', 'Moon']], ['Jupiter', ['Mercury']], ['Mars', ['Venus']], ['Moon', ['Saturn']]]
      for (const [g, eleven] of FIVE) if (fromLagna(c, g) === 5 && own(g) && eleven.every((x) => fromLagna(c, x) === 11)) out.push({ basis: [`${g} in its own sign in the 5th`, `${eleven.join(', ')} in the 11th`] })
      if (fromLagna(c, 'Venus') === 5 && own('Venus') && fromLagna(c, 'Mars') === 1) out.push({ basis: ['Venus in its own sign in the 5th', 'Mars in the lagna'] })
      const LAGNA: [Graha, Graha[]][] = [['Sun', ['Mars', 'Jupiter']], ['Moon', ['Mercury', 'Jupiter']], ['Mars', ['Mercury', 'Venus', 'Saturn']], ['Mercury', ['Jupiter', 'Saturn']], ['Jupiter', ['Mars', 'Mercury']], ['Venus', ['Mercury', 'Saturn']], ['Saturn', ['Mars', 'Jupiter']]]
      for (const [g, inf] of LAGNA) {
        if (fromLagna(c, g) !== 1 || !own(g)) continue
        const near = [...conjunctWith(c, g), ...aspectsOnGraha(c, g)]
        if (inf.every((x) => near.includes(x))) out.push({ basis: [`${g} in its own sign in the lagna`, `influenced by ${inf.join(' and ')}`] })
      }
      const l2 = lordOfHouse(c, 2)
      if (l2 === lordOfHouse(c, 7) && fromLagna(c, l2) === 4) out.push({ basis: [`${l2} rules the 2nd and 7th`, 'placed in the 4th'] })
      return out
    },
  },
  {
    id: 'daridrya-parashara', name: 'Daridrya yoga (Parashara)', group: 'Doshas and afflictions', tone: 'challenge', needsTime: true,
    definition: 'Any of: the lagna and 12th lords exchanging places, or the lagna and 6th lords, with a maraka (2nd or 7th lord) joining or aspecting; the lagna or Moon with Ketu and the lagna lord in the 8th under maraka influence; an afflicted lagna lord in a dusthana with the 2nd lord debilitated or in the 6th; Mars and Saturn in the 2nd; Saturn in the 2nd aspected by the Sun, or the Sun in the 2nd aspected by Saturn.',
    result: 'Financial strain and effort needed to hold on to resources.', source: 'BPHS; Charak XXI',
    check: (c) => {
      const out: YogaMatch[] = []
      const L = (n: number) => lordOfHouse(c, n)
      const l1 = L(1), p1 = pos(c, l1)
      const mk = (gs: Graha[]) => [...new Set(gs.flatMap((g) => marakaOn(c, g)))]
      for (const n of [12, 6]) {
        const ln = L(n)
        if (ln !== l1 && p1.house === n && fromLagna(c, ln) === 1) {
          const m = mk([l1, ln])
          if (m.length) out.push({ basis: [`Lagna lord ${l1} in the ${h(n)}`, `${ordinal(n)} lord ${ln} in the lagna`, `maraka ${m.join(', ')} joins or aspects`] })
        }
      }
      const ketuWith = pos(c, 'Ketu').sign === c.lagnaSign || pos(c, 'Ketu').sign === pos(c, 'Moon').sign
      if (ketuWith && p1.house === 8 && mk([l1]).length) out.push({ basis: ['Ketu with the lagna or Moon', `lagna lord ${l1} in the 8th`, `maraka ${mk([l1]).join(', ')} influences it`] })
      const afflicted = [...conjunctWith(c, l1), ...aspectsOnGraha(c, l1)].some((g) => MALEFICS.includes(g))
      const p2 = pos(c, L(2))
      if (afflicted && DUSTHANA.includes(p1.house!) && (p2.dignity === 'debilitated' || p2.house === 6)) out.push({ basis: [`Afflicted lagna lord ${l1} in the ${h(p1.house!)}`, `2nd lord ${L(2)} ${p2.dignity === 'debilitated' ? 'debilitated' : 'in the 6th'}`] })
      if (fromLagna(c, 'Mars') === 2 && fromLagna(c, 'Saturn') === 2) {
        const merc = aspectsOnGraha(c, 'Mars').includes('Mercury')
        out.push({ basis: ['Mars and Saturn in the 2nd'], note: merc ? 'Mercury aspects them, which the book says turns this into wealth.' : undefined, tone: merc ? 'good' : undefined })
      }
      if (fromLagna(c, 'Saturn') === 2 && aspectsOnGraha(c, 'Saturn').includes('Sun')) out.push({ basis: ['Saturn in the 2nd', 'aspected by the Sun'] })
      if (fromLagna(c, 'Sun') === 2 && aspectsOnGraha(c, 'Sun').includes('Saturn')) out.push({ basis: ['The Sun in the 2nd', 'aspected by Saturn'] })
      return out
    },
  },
  {
    id: 'arishta-lords', name: 'Arishta yoga (dusthana lords)', group: 'Doshas and afflictions', tone: 'challenge', needsTime: true,
    definition: 'The lagna lord related to the lord of the 6th, 8th or 12th, or two of the 6th, 8th and 12th lords related to each other.',
    result: 'Pressure on health and vitality, which modifies raja and dhana yogas. Stronger when the 2nd or 7th lord also joins.', source: 'Charak XXI',
    check: (c) => [...lordPairs(c, [1], [6, 8, 12]), ...lordPairs(c, [6], [8, 12]), ...lordPairs(c, [8], [12])].map((m) => {
      const lords = m.basis.slice(0, 2).map((b) => b.split(' ').pop() as Graha)
      const mk = [...new Set(lords.flatMap((g) => marakaOn(c, g)))].filter((g) => !lords.includes(g))
      return mk.length ? { ...m, note: `${mk.join(' and ')} (lord of the 2nd or 7th) also joins or aspects, which the texts call worse.` } : m
    }),
  },
  {
    id: 'parvata', name: 'Parvata yoga', group: 'Other', tone: 'good', needsTime: true,
    definition: 'The 6th and 8th houses empty or holding only benefics, with benefics in the kendras and no malefic there; or the lagna and 12th lords in mutual kendras aspected by benefics.',
    result: 'Fame, wealth, generosity, eloquence and leadership.', source: 'BPHS; Charak XXII',
    check: (c) => {
      const out: YogaMatch[] = []
      const clean = (n: number) => occupants(c, n).every((g) => BENEFICS.includes(g))
      const kb = BENEFICS.filter((g) => KENDRA.includes(fromLagna(c, g))), km = MALEFICS.filter((g) => KENDRA.includes(fromLagna(c, g)))
      if (clean(6) && clean(8) && kb.length && !km.length) out.push({ basis: ['6th and 8th free of malefics', `${kb.join(', ')} in kendras`, 'no malefic in a kendra'] })
      const l1 = lordOfHouse(c, 1), l12 = lordOfHouse(c, 12)
      const asp = (g: Graha) => aspectsOnGraha(c, g).some((x) => BENEFICS.includes(x))
      if (l1 !== l12 && mutualKendra(c, l1, l12) && asp(l1) && asp(l12)) out.push({ basis: [`Lagna lord ${l1} and 12th lord ${l12} in mutual kendras`, 'both aspected by benefics'] })
      return out
    },
  },
  {
    id: 'maha-bhagya', name: 'Maha-bhagya yoga', group: 'Other', tone: 'good', needsTime: true,
    definition: 'For a man: a day birth with the lagna, Sun and Moon all in odd signs. For a woman: a night birth with all three in even signs.',
    result: 'Great good fortune: liberal, renowned, of good character, with land and standing.', source: 'BPHS; Charak XXII',
    check: (c) => {
      const day = ((pos(c, 'Sun').lon - c.lagna! + 360) % 360) >= 180
      const odd = [c.lagnaSign!, pos(c, 'Sun').sign, pos(c, 'Moon').sign].map((x) => x % 2 === 0)
      if (day && odd.every(Boolean)) return [{ basis: ['Day birth', 'lagna, Sun and Moon in odd signs'], note: 'This is the form for a man\'s chart.' }]
      if (!day && odd.every((x) => !x)) return [{ basis: ['Night birth', 'lagna, Sun and Moon in even signs'], note: 'This is the form for a woman\'s chart.' }]
      return []
    },
  },
  {
    id: 'chatussagara', name: 'Chatus-saagara yoga', group: 'Other', tone: 'good', needsTime: true,
    definition: 'All four kendras (1st, 4th, 7th and 10th) occupied by planets.',
    result: 'Wealth and high status; said to counter many arishtas.', source: 'Charak XXII',
    check: (c) => one(KENDRA.every((k) => occupants(c, k).length > 0), KENDRA.map((k) => `${occupants(c, k).join(', ')} in the ${h(k)}`)),
  },
  {
    id: 'hatha-hanta', name: 'Hatha-hantaa yoga', group: 'Doshas and afflictions', tone: 'challenge', needsTime: true,
    definition: 'The Moon in the 11th house and the Sun in Karka.',
    result: 'Setbacks brought on by one\'s own rash decisions; a call to act deliberately.', source: 'Charak XXII',
    check: (c) => one(fromLagna(c, 'Moon') === 11 && pos(c, 'Sun').sign === 3, ['The Moon in the 11th', 'the Sun in Karka']),
  },
]

/* ------------------------------------------------------------------ */
/* Doshas and afflictions                                               */
/* ------------------------------------------------------------------ */

/** Mars-related dosha from lagna, Moon and Venus with classical cancellations. */
const MANGAL_SIGN_EXCEPTIONS: Record<number, number[]> = { 1: [0, 7], 2: [2, 5], 4: [0, 7], 7: [3, 9], 8: [8, 11], 12: [1, 6] }

export interface MangalCheck { from: string; house: number; present: boolean }
export interface MangalDosha { checks: MangalCheck[]; cancellations: string[]; status: 'none' | 'present' | 'cancelled' }

export function mangalDosha(c: VedicChart): MangalDosha {
  const mars = pos(c, 'Mars')
  const refs: [string, number][] = [['Moon', pos(c, 'Moon').sign], ['Venus', pos(c, 'Venus').sign]]
  if (c.lagnaSign !== null) refs.unshift(['Lagna', c.lagnaSign])
  const checks = refs.map(([from, s]) => {
    const house = houseFrom(s, mars.sign)
    return { from, house, present: [1, 2, 4, 7, 8, 12].includes(house) }
  })
  const cancellations: string[] = []
  if (mars.dignity && GOOD_DIGNITY.includes(mars.dignity)) cancellations.push(`Mars is ${dignityPhrase(mars.dignity)}`)
  const first = checks[0]
  if (c.lagnaSign !== null && first.present && MANGAL_SIGN_EXCEPTIONS[first.house]?.includes(mars.sign)) cancellations.push(`Mars in ${signName(mars.sign)} in the ${h(first.house)} is a classical sign exception`)
  const near = [...aspectsOnGraha(c, 'Mars'), ...conjunctWith(c, 'Mars')]
  if (near.includes('Jupiter')) cancellations.push('Jupiter aspects or joins Mars')
  if (conjunctWith(c, 'Mars').includes('Moon')) cancellations.push('The Moon joins Mars')
  if (c.lagnaSign !== null && [...occupants(c, 1), ...occupants(c, 7)].some((g) => g === 'Jupiter' || g === 'Venus')) cancellations.push('Jupiter or Venus in the 1st or 7th house')
  const any = checks.some((x) => x.present)
  return { checks, cancellations, status: !any ? 'none' : cancellations.length ? 'cancelled' : 'present' }
}

const conj = (c: VedicChart, a: Graha, bs: Graha[]) => bs.filter((b) => pos(c, a).sign === pos(c, b).sign)

const doshas: YogaDef[] = [
  {
    id: 'mangal-dosha', name: 'Mangal dosha', group: 'Doshas and afflictions', tone: 'challenge', needsTime: false,
    definition: 'Mars in the 1st, 4th, 7th, 8th or 12th from the lagna or the Moon (South Indian practice adds the 2nd house and counting from Venus), unless a classical cancellation applies.',
    result: 'Friction or impatience in marriage. Mainly used when matching two charts, where the partner\'s Mars or another malefic in the same houses balances it.', source: 'Muhurta texts; Charak XXVII',
    check: (c) => {
      const m = mangalDosha(c)
      if (m.status === 'none') return []
      return [{
        basis: m.checks.filter((x) => x.present).map((x) => `Mars ${ordinal(x.house)} from the ${x.from}`),
        note: m.cancellations.length ? `Cancelled: ${m.cancellations.join('; ')}.` : undefined,
        tone: m.status === 'cancelled' ? 'mixed' : undefined,
      }]
    },
  },
  {
    id: 'kaal-sarp', name: 'Kaal Sarp configuration', group: 'Doshas and afflictions', tone: 'mixed', needsTime: false,
    definition: 'All seven planets on one side of the Rahu-Ketu axis.',
    result: 'Associated by modern authors with intense focus and sudden turns. It is not described in BPHS or other classical texts.', source: 'Modern',
    check: (c) => {
      const rahu = pos(c, 'Rahu').lon
      const side = SEVEN.map((g) => ((pos(c, g).lon - rahu + 360) % 360) < 180)
      return one(side.every(Boolean) || side.every((x) => !x), ['All seven planets between Rahu and Ketu'])
    },
  },
  {
    id: 'guru-chandala', name: 'Guru Chandala yoga', group: 'Doshas and afflictions', tone: 'challenge', needsTime: false,
    definition: 'Jupiter together with Rahu or Ketu.',
    result: 'Unorthodox views and friction with teachers or tradition; Jupiter\'s judgement needs care.', source: 'Later texts',
    check: (c) => conj(c, 'Jupiter', ['Rahu', 'Ketu']).map((n) => ({ basis: [`Jupiter with ${n} in ${signName(pos(c, n).sign)}`] })),
  },
  {
    id: 'grahan', name: 'Grahan yoga', group: 'Doshas and afflictions', tone: 'challenge', needsTime: false,
    definition: 'The Sun or the Moon together with Rahu or Ketu.',
    result: 'The luminary is eclipsed: confidence (Sun) or peace of mind (Moon) needs conscious support.', source: 'Later texts',
    check: (c) => (['Sun', 'Moon'] as Graha[]).flatMap((l) => conj(c, l, ['Rahu', 'Ketu']).map((n) => ({ basis: [`${l} with ${n} in ${signName(pos(c, n).sign)}`] }))),
  },
  {
    id: 'angaraka', name: 'Angaraka yoga', group: 'Doshas and afflictions', tone: 'challenge', needsTime: false,
    definition: 'Mars together with Rahu.', result: 'Short temper and impulsive action; energy that needs a constructive outlet.', source: 'Later texts',
    check: (c) => conj(c, 'Mars', ['Rahu']).map(() => ({ basis: [`Mars with Rahu in ${signName(pos(c, 'Mars').sign)}`] })),
  },
  {
    id: 'vish', name: 'Vish yoga', group: 'Doshas and afflictions', tone: 'challenge', needsTime: false,
    definition: 'The Moon together with Saturn.', result: 'A serious, cautious mind prone to worry; emotional maturity comes early.', source: 'Later texts',
    check: (c) => conj(c, 'Moon', ['Saturn']).map(() => ({ basis: [`Moon with Saturn in ${signName(pos(c, 'Moon').sign)}`] })),
  },
  {
    id: 'papa-kartari', name: 'Papa Kartari yoga', group: 'Doshas and afflictions', tone: 'challenge', needsTime: true,
    definition: 'Malefics in both the 2nd and the 12th from the lagna.',
    result: 'The lagna is hemmed in: pressure on health and self-confidence, eased by a strong lagna lord.', source: 'PD 6',
    check: (c) => {
      const s = occupants(c, 2).filter((g) => MALEFICS.includes(g)), t = occupants(c, 12).filter((g) => MALEFICS.includes(g))
      return one(s.length > 0 && t.length > 0, [`${s.join(', ')} in the 2nd`, `${t.join(', ')} in the 12th`])
    },
  },
]

/* ------------------------------------------------------------------ */
/* Nabhasa yogas (BPHS 35): patterns formed by the seven planets         */
/* ------------------------------------------------------------------ */

const SANKHYA: [number, string, string][] = [
  [7, 'Veena (Vallaki)', 'Fond of music and learning, with many friends and a comfortable life.'],
  [6, 'Dama', 'Generous and helpful to others; prosperity and a good reputation.'],
  [5, 'Pasha', 'Earns through skill and effort; many dependants and commitments.'],
  [4, 'Kedara', 'Useful to others, truthful and prosperous; often linked to land or agriculture.'],
  [3, 'Shoola', 'Sharp, brave and outspoken; gains through struggle.'],
  [2, 'Yuga', 'An unconventional path; finances need care.'],
  [1, 'Gola', 'Narrow focus; resources come with difficulty.'],
]

const signsOccupied = (c: VedicChart) => new Set(SEVEN.map((g) => pos(c, g).sign)).size
const housesOccupied = (c: VedicChart) => new Set(SEVEN.map((g) => fromLagna(c, g)))
/** All seven planets occupy exactly the given houses, each of them at least once. */
const exactly = (c: VedicChart, hs: number[]) => {
  const occ = housesOccupied(c)
  return occ.size === hs.length && hs.every((x) => occ.has(x))
}
const range = (start: number, n: number) => Array.from({ length: n }, (_, i) => ((start + i - 1) % 12) + 1)

interface Akriti { name: string; def: string; result: string; sets: number[][]; test?: (c: VedicChart) => boolean }
const AKRITI: Akriti[] = [
  { name: 'Gada', def: 'All seven planets in two successive kendras.', result: 'Wealth through steady effort; learned and respected.', sets: [[1, 4], [4, 7], [7, 10], [10, 1]] },
  { name: 'Shakata (Nabhasa)', def: 'All seven planets in the 1st and 7th.', result: 'Fortunes that alternate; livelihood through vehicles or physical work.', sets: [[1, 7]] },
  { name: 'Vihaga', def: 'All seven planets in the 4th and 10th.', result: 'Much travel; work as an envoy, messenger or go-between.', sets: [[4, 10]] },
  { name: 'Shringataka', def: 'All seven planets in the 1st, 5th and 9th.', result: 'Happiness in later life; fortunate and principled.', sets: [[1, 5, 9]] },
  { name: 'Hala', def: 'All seven planets in one trine other than the lagna trine (2-6-10, 3-7-11 or 4-8-12).', result: 'Hard-working; livelihood from land or practical labour.', sets: [[2, 6, 10], [3, 7, 11], [4, 8, 12]] },
  { name: 'Kamala', def: 'All seven planets in the four kendras.', result: 'Virtue, fame and long life; respected widely.', sets: [[1, 4, 7, 10]] },
  { name: 'Vapi', def: 'No planet in a kendra: all seven in the other eight houses (some authors restrict it to the panapharas or the apoklimas).', result: 'Accumulates and keeps wealth; small but lasting comforts.', sets: [], test: (c) => SEVEN.every((g) => !KENDRA.includes(fromLagna(c, g))) },
  { name: 'Yupa', def: 'All seven planets in the four houses from the 1st.', result: 'Generous and devoted to duty or ritual.', sets: [range(1, 4)] },
  { name: 'Shara', def: 'All seven planets in the four houses from the 4th.', result: 'Harsh in speech; skilled with tools or weapons.', sets: [range(4, 4)] },
  { name: 'Shakti', def: 'All seven planets in the four houses from the 7th.', result: 'Success in contests after sustained struggle.', sets: [range(7, 4)] },
  { name: 'Danda', def: 'All seven planets in the four houses from the 10th.', result: 'Serves others; distance from family.', sets: [range(10, 4)] },
  { name: 'Nauka', def: 'All seven planets in the seven houses from the 1st.', result: 'Earnings connected with water or travel; well known.', sets: [range(1, 7)] },
  { name: 'Koota', def: 'All seven planets in the seven houses from the 4th.', result: 'Cunning and secretive; works in enclosed or hidden places.', sets: [range(4, 7)] },
  { name: 'Chhatra', def: 'All seven planets in the seven houses from the 7th.', result: 'Protective of others; happiness in later life.', sets: [range(7, 7)] },
  { name: 'Chapa', def: 'All seven planets in the seven houses from the 10th.', result: 'Brave and restless; happiness in middle life.', sets: [range(10, 7)] },
  { name: 'Ardha Chandra', def: 'All seven planets in seven consecutive houses starting from a house that is not a kendra.', result: 'Leadership, wealth and a pleasing appearance.', sets: [2, 3, 5, 6, 8, 9, 11, 12].map((s) => range(s, 7)) },
  { name: 'Chakra', def: 'All seven planets in the six odd houses from the 1st (1, 3, 5, 7, 9, 11).', result: 'Status comparable to a ruler in classical terms.', sets: [[1, 3, 5, 7, 9, 11]] },
  { name: 'Samudra', def: 'All seven planets in the six even houses (2, 4, 6, 8, 10, 12).', result: 'Wealthy and generous; enjoys a comfortable life.', sets: [[2, 4, 6, 8, 10, 12]] },
]

const nabhasa: YogaDef[] = [
  ...SANKHYA.map(([n, name, result]): YogaDef => ({
    id: `sankhya-${n}`, name: `${name} yoga`, group: 'Nabhasa', tone: n >= 4 ? 'good' : 'mixed', needsTime: false,
    definition: `The seven planets occupy exactly ${n} sign${n > 1 ? 's' : ''}.`, result, source: 'BPHS 35',
    check: (c) => one(signsOccupied(c) === n, [`Seven planets in ${n} sign${n > 1 ? 's' : ''}`]),
  })),
  ...([[0, 'Rajju', 'movable', 'Fond of travel; may settle away from the place of birth.'], [1, 'Musala', 'fixed', 'Firm in purpose, proud and prosperous.'], [2, 'Nala', 'dual', 'Adaptable and skilled; fortunes vary.']] as const).map(([q, name, kind, result]): YogaDef => ({
    id: `ashraya-${name.toLowerCase()}`, name: `${name} yoga`, group: 'Nabhasa', tone: 'mixed', needsTime: false,
    definition: `All seven planets in ${kind} signs.`, result, source: 'BPHS 35',
    check: (c) => one(SEVEN.every((g) => pos(c, g).sign % 3 === q), [`Seven planets in ${kind} signs`]),
  })),
  {
    id: 'mala', name: 'Mala yoga', group: 'Nabhasa', tone: 'good', needsTime: true,
    definition: 'Benefics occupy three kendras and no malefic is in a kendra.', result: 'Comforts, vehicles and pleasures through life.', source: 'BPHS 35',
    check: (c) => {
      const ks = new Set(BENEFICS.filter((g) => KENDRA.includes(fromLagna(c, g))).map((g) => fromLagna(c, g)))
      return one(ks.size >= 3 && !(['Sun', 'Mars', 'Saturn'] as Graha[]).some((g) => KENDRA.includes(fromLagna(c, g))), ['Benefics in three kendras', 'no malefic in a kendra'])
    },
  },
  {
    id: 'sarpa', name: 'Sarpa yoga', group: 'Nabhasa', tone: 'challenge', needsTime: true,
    definition: 'Malefics (Sun, Mars, Saturn) occupy three kendras and no benefic is in a kendra.', result: 'Hardship and dependence on others; relief through discipline.', source: 'BPHS 35',
    check: (c) => {
      const ks = new Set((['Sun', 'Mars', 'Saturn'] as Graha[]).filter((g) => KENDRA.includes(fromLagna(c, g))).map((g) => fromLagna(c, g)))
      return one(ks.size >= 3 && !BENEFICS.some((g) => KENDRA.includes(fromLagna(c, g))), ['Malefics in three kendras', 'no benefic in a kendra'])
    },
  },
  {
    id: 'vajra', name: 'Vajra yoga', group: 'Nabhasa', tone: 'good', needsTime: true,
    definition: 'Benefics only in the 1st and 7th; malefics only in the 4th and 10th.', result: 'Happy in early and late life; brave and good-looking.', source: 'BPHS 35',
    check: (c) => one(BENEFICS.every((g) => [1, 7].includes(fromLagna(c, g))) && (['Sun', 'Mars', 'Saturn'] as Graha[]).every((g) => [4, 10].includes(fromLagna(c, g))), ['Benefics in the 1st and 7th', 'Malefics in the 4th and 10th']),
  },
  {
    id: 'yava', name: 'Yava yoga', group: 'Nabhasa', tone: 'good', needsTime: true,
    definition: 'Malefics only in the 1st and 7th; benefics only in the 4th and 10th.', result: 'Happy in middle life; charitable and steady.', source: 'BPHS 35',
    check: (c) => one(BENEFICS.every((g) => [4, 10].includes(fromLagna(c, g))) && (['Sun', 'Mars', 'Saturn'] as Graha[]).every((g) => [1, 7].includes(fromLagna(c, g))), ['Malefics in the 1st and 7th', 'Benefics in the 4th and 10th']),
  },
  ...AKRITI.map((a): YogaDef => ({
    id: `akriti-${a.name.toLowerCase().replace(/[^a-z]+/g, '-')}`, name: `${a.name} yoga`, group: 'Nabhasa', tone: 'mixed', needsTime: true,
    definition: a.def, result: a.result, source: 'BPHS 35',
    check: (c) => {
      if (a.test) return one(a.test(c), ['No planet in a kendra'])
      const hit = a.sets.find((s) => exactly(c, s))
      return one(!!hit, hit ? [`Planets in houses ${hit.join(', ')}`] : [])
    },
  })),
]

export const YOGAS: YogaDef[] = [...mahapurusha, ...raja, ...dhana, ...solar, ...lunar, ...doshas, ...nabhasa]

export function evaluateYogas(chart: VedicChart): YogaResult[] {
  const results: YogaResult[] = YOGAS.map((def) => {
    const checked = !def.needsTime || chart.lagnaSign !== null
    const matches = checked ? def.check(chart) : []
    return { def, matches, present: matches.length > 0, checked }
  })
  return applyNabhasaPrecedence(results)
}

/**
 * When Nabhasa yogas overlap (Charak, ch. XX): an Aakriti yoga overrides any
 * Sankhya or Aashraya yoga; Kedara, Shoola and Yuga lapse when an Aashraya
 * yoga forms; Gola overrides an Aashraya yoga.
 */
function applyNabhasaPrecedence(results: YogaResult[]): YogaResult[] {
  const on = (pred: (id: string) => boolean) => results.find((r) => r.present && pred(r.def.id))
  const akriti = on((id) => id.startsWith('akriti-'))
  const ashraya = on((id) => id.startsWith('ashraya-'))
  const gola = on((id) => id === 'sankhya-1')
  const supersede = (r: YogaResult, by: YogaResult) => { r.present = false; r.supersededBy = by.def.name }
  for (const r of results) {
    if (!r.present) continue
    const id = r.def.id
    if (akriti && (id.startsWith('sankhya-') || id.startsWith('ashraya-'))) supersede(r, akriti)
    else if (ashraya && ['sankhya-4', 'sankhya-3', 'sankhya-2'].includes(id)) supersede(r, ashraya)
    else if (gola && id.startsWith('ashraya-')) supersede(r, gola)
  }
  return results
}

/** Present yogas by id, for use inside reports. */
export function presentYogas(results: YogaResult[], ids: string[]): YogaResult[] {
  return results.filter((r) => r.present && ids.includes(r.def.id))
}

/** Effective tone of a present yoga (a cancellation can soften it). */
export const yogaTone = (r: YogaResult): YogaTone => r.matches.some((m) => m.tone === undefined) ? r.def.tone : r.matches[0].tone ?? r.def.tone
