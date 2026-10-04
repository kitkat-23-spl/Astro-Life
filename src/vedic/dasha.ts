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
