/**
 * Muhurta checks for a day, after K.S. Charak, Elements of Vedic Astrology,
 * ch. XXVI (from Muhurta Chintamani and related texts): tithi groups, tithi
 * and weekday combinations, nakshatra classes, nakshatra and weekday yogas,
 * Panchaka, travel directions, avoided yogas and karanas, gandanta and Taara.
 */
import { NAKSHATRAS, type Graha } from './constants'
import { WEEKDAY_LORD, type Panchang } from './panchang'

export type DayEffect = 'good' | 'mixed' | 'bad' | 'info'
export interface DayCheck { id: string; title: string; effect: DayEffect; detail: string; rule: string }

const TITHI_GROUPS = ['Nanda', 'Bhadra', 'Jaya', 'Rikta', 'Poorna'] as const
type TithiGroup = (typeof TITHI_GROUPS)[number]
const GROUP_USES: Record<TithiGroup, string> = {
  Nanda: 'arts, music, farming, festivals, building and new clothes',
  Bhadra: 'marriage, ceremonies, travel, jewellery and vehicles',
  Jaya: 'contests, building, medical treatment and farming',
  Rikta: 'only harsh or routine work; auspicious beginnings are avoided',
  Poorna: 'ceremonies, marriage, travel and taking office',
}
const WEEKDAY_USES = [
  'investiture, fire rituals, starting medical treatment, travel, and dealings in gold or copper',
  'silver and pearls, planting, water, farming, food, music and clothes',
  'work with fire or metal, surgery and contests',
  'arts, writing, learning and marriage',
  'religious work, ceremonies, travel, medicine, vehicles and building',
  'arts, decoration, land, clothes, shopping and festivals',
  'building and moving house, initiation, and long-lasting work',
]
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
/** Direction to avoid travelling in, by weekday (disha shool). */
const AVOID_DIRECTION = ['west', 'east', 'north', 'north', 'south', 'west', 'east']

/** Nakshatra classes (0-based nakshatra numbers) and what they suit. */
const NAK_CLASS: { name: string; stars: number[]; use: string; effect: DayEffect }[] = [
  { name: 'Dhruva (fixed)', stars: [3, 11, 20, 25], use: 'lasting work: foundations, sowing, moving in', effect: 'good' },
  { name: 'Chara (movable)', stars: [6, 14, 21, 22, 23], use: 'travel, vehicles and change', effect: 'good' },
  { name: 'Ugra (harsh)', stars: [1, 9, 10, 19, 24], use: 'only forceful or competitive work', effect: 'mixed' },
  { name: 'Mishra (mixed)', stars: [2, 15], use: 'routine and mixed work', effect: 'mixed' },
  { name: 'Kshipra (swift)', stars: [0, 7, 12], use: 'shopping, trade, learning, medicine and the arts', effect: 'good' },
  { name: 'Mridu (gentle)', stars: [4, 13, 16, 26], use: 'the arts, friendship, clothes and celebrations', effect: 'good' },
  { name: 'Teekshna (sharp)', stars: [5, 8, 17, 18], use: 'only decisive or severing work', effect: 'mixed' },
]

/* Nakshatra and weekday yogas, Sunday first (0-based nakshatra numbers). */
const SIDDHA_YOGA = [18, 21, 25, 2, 6, 10, 14]
const AMRITA_SIDDHI = [12, 21, 0, 16, 7, 26, 3]
const MRITYU_YOGA = [16, 20, 23, 0, 4, 8, 12]
const SARVARTHA: number[][] = [
  [0, 7, 12, 18, 11, 20, 25],
  [3, 4, 7, 16, 21],
  [0, 2, 8, 25],
  [2, 3, 4, 12, 16],
  [0, 6, 7, 16, 26],
  [0, 6, 16, 21, 26],
  [3, 14, 21],
]
const SIDDHA_DAY: Partial<Record<TithiGroup, number>> = { Nanda: 5, Bhadra: 3, Jaya: 2, Rikta: 6, Poorna: 4 }
/** Dagdha (burnt) tithi groups by weekday. */
const DAGDHA: TithiGroup[] = ['Nanda', 'Bhadra', 'Nanda', 'Jaya', 'Rikta', 'Bhadra', 'Poorna']

const TAARA = ['Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra', 'Ati-mitra']
const TAARA_GOOD = [true, true, false, true, false, true, false, true, true]

/** Tithi number within the paksha (1 to 15; Amavasya counts as 15 of the waning half, number 30). */
export const tithiNumber = (index: number) => (index % 15) + 1
export const tithiGroup = (index: number): TithiGroup => TITHI_GROUPS[(tithiNumber(index) - 1) % 5]

/** Count from the birth star to the day's star (inclusive), as a Taara 1 to 9. */
export const taaraOf = (birthNak: number, dayNak: number) => (((dayNak - birthNak + 27) % 27) % 9) + 1

export function dayChecks(p: Panchang, birthNak?: number | null): DayCheck[] {
  const wd = WEEKDAY_LORD.indexOf(p.vara.lord as Graha)
  const ti = p.tithi.index, tn = tithiNumber(ti), grp = tithiGroup(ti)
  const nk = p.nakshatra.index
  const out: DayCheck[] = []
  const src = 'Charak XXVI (muhurta)'

  out.push({ id: 'tithi-group', title: `${p.tithi.name} is a ${grp} tithi`, effect: grp === 'Rikta' ? 'bad' : 'good', detail: `Suited to ${GROUP_USES[grp]}.`, rule: `${src}: Nanda 1, 6, 11 · Bhadra 2, 7, 12 · Jaya 3, 8, 13 · Rikta 4, 9, 14 · Poorna 5, 10, 15` })

  const shukla = p.tithi.paksha === 'Shukla'
  const moonStrong = (shukla && tn >= 10) || (!shukla && tn <= 5)
  const moonWeak = (!shukla && tn >= 10) || (shukla && tn <= 5)
  out.push({ id: 'moon-strength', title: moonStrong ? 'The Moon is strong (near full)' : moonWeak ? 'The Moon is weak (near new)' : 'The Moon is of middling strength', effect: moonStrong ? 'good' : moonWeak ? 'bad' : 'mixed', detail: 'The five days on either side of the full Moon are favourable for beginnings; the five on either side of the new Moon are not.', rule: `${src}: tithi strength` })

  if (SIDDHA_DAY[grp] === wd) out.push({ id: 'siddha-tithi', title: `Siddha tithi: ${grp} on ${WEEKDAY[wd]}`, effect: 'good', detail: 'An auspicious tithi and weekday pair that offsets other flaws in a chosen time.', rule: `${src}: Siddha tithis` })
  if (DAGDHA[wd] === grp) out.push({ id: 'dagdha-tithi', title: `Dagdha tithi: ${grp} on ${WEEKDAY[wd]}`, effect: 'bad', detail: 'A "burnt" tithi and weekday pair, avoided for auspicious work.', rule: `${src}: Dagdha tithis` })
  if (wd + 1 + tn === 13) out.push({ id: 'krakacha', title: 'Krakacha yoga', effect: 'bad', detail: `The weekday number (${wd + 1}) and the tithi number (${tn}) add up to 13, which is avoided.`, rule: `${src}: weekday + tithi = 13` })

  out.push({ id: 'weekday', title: `${WEEKDAY[wd]} (ruled by ${p.vara.lord})`, effect: 'info', detail: `Suited to ${WEEKDAY_USES[wd]}. The same work can also be done in ${p.vara.lord}'s hora on other days.`, rule: `${src}: weekday` })

  const cls = NAK_CLASS.find((c) => c.stars.includes(nk))
  if (cls) out.push({ id: 'nak-class', title: `${NAKSHATRAS[nk].name} is a ${cls.name} nakshatra`, effect: cls.effect, detail: `Suited to ${cls.use}.${nk === 7 ? ' Pushya suits every auspicious act except marriage.' : ''}`, rule: `${src}: nakshatra classes` })

  if (SIDDHA_YOGA[wd] === nk) out.push({ id: 'siddha-yoga', title: 'Siddha yoga', effect: 'good', detail: `${NAKSHATRAS[nk].name} on ${WEEKDAY[wd]}: good for all work.`, rule: `${src}: nakshatra and weekday` })
  if (AMRITA_SIDDHI[wd] === nk) out.push({ id: 'amrita-siddhi', title: 'Amrita-siddhi yoga', effect: 'good', detail: `${NAKSHATRAS[nk].name} on ${WEEKDAY[wd]}: said to bring success.`, rule: `${src}: nakshatra and weekday` })
  if (SARVARTHA[wd].includes(nk)) out.push({ id: 'sarvartha-siddhi', title: 'Sarvartha-siddhi yoga', effect: 'good', detail: `${NAKSHATRAS[nk].name} on ${WEEKDAY[wd]}: good for all pursuits.`, rule: `${src}: nakshatra and weekday` })
  if (MRITYU_YOGA[wd] === nk) out.push({ id: 'mrityu-yoga', title: 'Mrityu yoga', effect: 'bad', detail: `${NAKSHATRAS[nk].name} on ${WEEKDAY[wd]}: avoided, especially for travel.`, rule: `${src}: nakshatra and weekday` })

  if (/Aquarius|Pisces/.test(p.moonSign)) out.push({ id: 'panchaka', title: 'Panchaka is running', effect: 'bad', detail: 'The Moon is in Kumbha or Meena. Travel south, roofing, gathering wood or grass and making beds are avoided.', rule: `${src}: Panchaka` })

  out.push({ id: 'disha', title: `Avoid travelling ${AVOID_DIRECTION[wd]} today`, effect: 'info', detail: `On ${WEEKDAY[wd]} the texts advise against setting out towards the ${AVOID_DIRECTION[wd]} (disha shool).`, rule: `${src}: travel and weekday` })

  const y = p.yoga.index
  if (y === 16 || y === 26) out.push({ id: 'bad-yoga', title: `${p.yoga.name} yoga`, effect: 'bad', detail: 'Vyatipata and Vaidhriti are avoided entirely for important work.', rule: `${src}: Panchang yogas` })
  else if (y === 18) out.push({ id: 'parigha', title: 'Parigha yoga', effect: 'mixed', detail: 'Avoid the first half of Parigha for important work.', rule: `${src}: Panchang yogas` })
  else if (y === 0 || y === 14) out.push({ id: 'yoga-start', title: `${p.yoga.name} yoga`, effect: 'mixed', detail: 'Avoid the first 3 ghatis (about 72 minutes) of this yoga.', rule: `${src}: Panchang yogas` })
  else if (y === 5 || y === 9) out.push({ id: 'yoga-start', title: `${p.yoga.name} yoga`, effect: 'mixed', detail: 'Avoid the first 6 ghatis (about 2 hours 24 minutes) of this yoga.', rule: `${src}: Panchang yogas` })

  if (/vishti/i.test(p.karana.name)) out.push({ id: 'bhadra', title: 'Vishti (Bhadra) karana', effect: 'bad', detail: 'Bhadra is avoided for auspicious work while it lasts.', rule: `${src}: karanas` })

  if ([0, 8, 9, 17, 18, 26].includes(nk)) out.push({ id: 'gandanta', title: `${NAKSHATRAS[nk].name} is a gandanta nakshatra`, effect: 'mixed', detail: 'The junction nakshatras (Ashwini, Ashlesha, Magha, Jyeshtha, Moola and Revati) are treated with caution for marriage and other auspicious acts, especially near their junction degrees.', rule: `${src}: gandanta` })
  if (grp === 'Poorna' && p.tithi.ends) out.push({ id: 'tithi-gandanta', title: 'Tithi gandanta at the change of tithi', effect: 'mixed', detail: 'The last 24 minutes of a Poorna tithi and the first 24 minutes of the next (a Nanda tithi) are avoided.', rule: `${src}: gandanta` })

  if (birthNak !== undefined && birthNak !== null) {
    const t = taaraOf(birthNak, nk)
    out.push({ id: 'taara', title: `Taara ${t}: ${TAARA[t - 1]}`, effect: TAARA_GOOD[t - 1] ? 'good' : 'bad', detail: `Counted from your birth star ${NAKSHATRAS[birthNak].name} to today's ${NAKSHATRAS[nk].name}. Taaras 3, 5 and 7 are avoided for important work.${shukla ? ' In the waxing half the Moon\'s strength matters more than the Taara.' : ' In the waning half the Taara matters most.'}`, rule: `${src}: Taara` })
  }
  return out
}
