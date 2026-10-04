import { DASHA_ORDER, DASHA_YEARS, type Graha } from './constants'
import { nakshatraOf } from './sidereal'

const YEAR_MS = 365.2425 * 86400000

export const LEVEL_NAMES = ['Mahadasha', 'Antardasha', 'Pratyantardasha', 'Sookshma dasha'] as const

export interface Period {
  lord: Graha
  start: Date
  end: Date
  level: number // 0 = mahadasha
  /** Lords from mahadasha down to this period, e.g. [Jupiter, Venus]. */
  path: Graha[]
  sub?: Period[] // antardashas are always present on mahadashas
}

/** Split a period into its nine sub-periods, in Vimshottari order starting with its own lord. */
export function subPeriods(p: Period): Period[] {
  const idx = DASHA_ORDER.indexOf(p.lord)
  const total = p.end.getTime() - p.start.getTime()
  let cursor = p.start.getTime()
  return Array.from({ length: 9 }, (_, i) => {
    const lord = DASHA_ORDER[(idx + i) % 9]
    const len = (total * DASHA_YEARS[lord]) / 120
    const sub: Period = { lord, start: new Date(cursor), end: new Date(cursor + len), level: p.level + 1, path: [...p.path, lord] }
    cursor += len
    return sub
  })
}

/**
 * Vimshottari dasha: a 120-year cycle that starts from the lord of the Moon's
 * nakshatra. The part of the nakshatra still to run at birth sets the balance
 * of the first mahadasha.
 */
export function vimshottari(moonLon: number, birth: Date, count = 9): Period[] {
  const nk = nakshatraOf(moonLon)
  const firstLord = nk.info.lord
  const startIdx = DASHA_ORDER.indexOf(firstLord)
  // The first mahadasha began before birth; back-date its start so every period is complete.
  let cursor = birth.getTime() - nk.fraction * DASHA_YEARS[firstLord] * YEAR_MS
  return Array.from({ length: count }, (_, i) => {
    const lord = DASHA_ORDER[(startIdx + i) % 9]
    const len = DASHA_YEARS[lord] * YEAR_MS
    const md: Period = { lord, start: new Date(cursor), end: new Date(cursor + len), level: 0, path: [lord] }
    md.sub = subPeriods(md)
    cursor += len
    return md
  })
}

const contains = (p: Period, at: Date) => p.start <= at && at < p.end

/** The running period at every level, mahadasha first. */
export function periodChain(periods: Period[], at = new Date(), depth = 4): Period[] {
  const chain: Period[] = []
  let level = periods
  for (let d = 0; d < depth; d++) {
    const p = level.find((x) => contains(x, at))
    if (!p) break
    chain.push(p)
    level = p.sub ?? subPeriods(p)
  }
  return chain
}

export function currentPeriods(periods: Period[], at = new Date()) {
  const [md = null, ad = null] = periodChain(periods, at, 2)
  return { md, ad }
}

/** The next `n` antardasha changes after `from`. */
export function upcomingAntardashas(periods: Period[], from = new Date(), n = 6): Period[] {
  return periods.flatMap((md) => md.sub ?? []).filter((ad) => ad.start > from).slice(0, n)
}

/* ------------------------------------------------------------------ */
/* Other dasha systems                                                  */
/* ------------------------------------------------------------------ */

/** A period in any dasha system. `sign` is set for sign-based systems such as Chara dasha. */
export interface DashaPeriod {
  name: string
  lord: Graha | null
  sign?: number
  start: Date
  end: Date
  sub?: DashaPeriod[]
}

export type DashaSystem = 'vimshottari' | 'yogini' | 'ashtottari' | 'chara'

interface Unit { name: string; lord: Graha; years: number }

/** Mahadashas from a starting unit and balance, each split proportionally into antardashas. */
function cycleDashas(units: Unit[], startIdx: number, elapsedYears: number, birth: Date, span = 120): DashaPeriod[] {
  const cycle = units.reduce((a, u) => a + u.years, 0)
  let cursor = birth.getTime() - elapsedYears * YEAR_MS
  const end = birth.getTime() + span * YEAR_MS
  const out: DashaPeriod[] = []
  for (let i = 0; cursor < end; i++) {
    const u = units[(startIdx + i) % units.length]
    const len = u.years * YEAR_MS
    const md: DashaPeriod = { name: u.name, lord: u.lord, start: new Date(cursor), end: new Date(cursor + len) }
    let c = cursor
    md.sub = units.map((_, j) => {
      const a = units[(startIdx + i + j) % units.length]
      const l = (len * a.years) / cycle
      const p: DashaPeriod = { name: a.name, lord: a.lord, start: new Date(c), end: new Date(c + l) }
      c += l
      return p
    })
    out.push(md)
    cursor += len
  }
  return out
}

const YOGINIS: Unit[] = [
  { name: 'Mangala', lord: 'Moon', years: 1 }, { name: 'Pingala', lord: 'Sun', years: 2 },
  { name: 'Dhanya', lord: 'Jupiter', years: 3 }, { name: 'Bhramari', lord: 'Mars', years: 4 },
  { name: 'Bhadrika', lord: 'Mercury', years: 5 }, { name: 'Ulka', lord: 'Saturn', years: 6 },
  { name: 'Siddha', lord: 'Venus', years: 7 }, { name: 'Sankata', lord: 'Rahu', years: 8 },
]

/** Yogini dasha (36-year cycle): the starting yogini is (birth nakshatra number + 3) mod 8. */
export function yogini(moonLon: number, birth: Date): DashaPeriod[] {
  const nk = nakshatraOf(moonLon)
  const r = (nk.index + 1 + 3) % 8
  const idx = r === 0 ? 7 : r - 1
  return cycleDashas(YOGINIS, idx, nk.fraction * YOGINIS[idx].years, birth)
}

const ASHTOTTARI: (Unit & { from: number; span: number })[] = [
  { name: 'Sun', lord: 'Sun', years: 6, from: 66 + 2 / 3, span: 53 + 1 / 3 },
  { name: 'Moon', lord: 'Moon', years: 15, from: 120, span: 40 },
  { name: 'Mars', lord: 'Mars', years: 8, from: 160, span: 53 + 1 / 3 },
  { name: 'Mercury', lord: 'Mercury', years: 17, from: 213 + 1 / 3, span: 40 },
  { name: 'Saturn', lord: 'Saturn', years: 10, from: 253 + 1 / 3, span: 40 },
  { name: 'Jupiter', lord: 'Jupiter', years: 19, from: 293 + 1 / 3, span: 40 },
  { name: 'Rahu', lord: 'Rahu', years: 12, from: 333 + 1 / 3, span: 53 + 1 / 3 },
  { name: 'Venus', lord: 'Venus', years: 21, from: 26 + 2 / 3, span: 40 },
]

/**
 * Ashtottari dasha (108 years). Nakshatras from Ardra are grouped four, three,
 * four, three... under eight lords; Abhijit belongs to Saturn's group. The
 * balance is the part of the Moon's group still to run.
 */
export function ashtottari(moonLon: number, birth: Date): DashaPeriod[] {
  const L = ((moonLon % 360) + 360) % 360
  const idx = ASHTOTTARI.findIndex((g) => ((L - g.from + 360) % 360) < g.span)
  const g = ASHTOTTARI[idx]
  const frac = ((L - g.from + 360) % 360) / g.span
  return cycleDashas(ASHTOTTARI, idx, frac * g.years, birth)
}

/** Signs whose dashas run forward (zodiacal) in K. N. Rao's Chara dasha. */
const SAVYA = [0, 1, 2, 6, 7, 8]

/** Chara dasha (Jaimini, K. N. Rao's method): sign-based mahadashas from the lagna. */
export function charaDasha(lagnaSign: number, signOf: (g: Graha) => number, dignityOf: (g: Graha) => string | null, occupantsOf: (sign: number) => number, birth: Date): DashaPeriod[] {
  const forward = SAVYA.includes((lagnaSign + 8) % 12)
  const LORDS: Record<number, Graha[]> = { 7: ['Mars', 'Ketu'], 10: ['Saturn', 'Rahu'] }
  const SIGN_RULER: Graha[] = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter']
  const lordOf = (s: number): Graha => {
    const pair = LORDS[s]
    if (!pair) return SIGN_RULER[s]
    const [a, b] = pair
    const inA = signOf(a) === s, inB = signOf(b) === s
    if (inA !== inB) return inA ? b : a
    return occupantsOf(signOf(a)) >= occupantsOf(signOf(b)) ? a : b
  }
  const years = (s: number) => {
    const l = lordOf(s)
    const ls = signOf(l)
    const count = SAVYA.includes(s) ? ((ls - s + 12) % 12) + 1 : ((s - ls + 12) % 12) + 1
    let y = count === 1 ? 12 : count - 1
    const d = dignityOf(l)
    if (d === 'exalted') y += 1
    if (d === 'debilitated') y -= 1
    return Math.max(1, y)
  }
  const first = Array.from({ length: 12 }, (_, i) => (forward ? (lagnaSign + i) % 12 : (lagnaSign - i + 12) % 12))
  const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
  const out: DashaPeriod[] = []
  let cursor = birth.getTime()
  const end = birth.getTime() + 120 * YEAR_MS
  for (let cycle = 0; cursor < end && cycle < 4; cycle++) {
    for (const s of first) {
      const y = cycle % 2 === 0 ? years(s) : 12 - years(s)
      if (y <= 0) continue
      const len = y * YEAR_MS
      out.push({ name: SIGN_NAMES[s], lord: lordOf(s), sign: s, start: new Date(cursor), end: new Date(cursor + len) })
      cursor += len
      if (cursor >= end) break
    }
  }
  return out
}

/** Vimshottari periods in the generic shape. */
export const asDashaPeriods = (periods: Period[]): DashaPeriod[] =>
  periods.map((md) => ({ name: md.lord, lord: md.lord, start: md.start, end: md.end, sub: md.sub?.map((ad) => ({ name: ad.lord, lord: ad.lord, start: ad.start, end: ad.end })) }))
