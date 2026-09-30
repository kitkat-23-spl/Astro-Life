import { DASHA_ORDER, DASHA_YEARS, type Graha } from './constants'
import { nakshatraOf } from './sidereal'

const YEAR_MS = 365.2425 * 86400000

export interface Period {
  lord: Graha
  start: Date
  end: Date
  sub?: Period[]
}

/**
 * Vimshottari dasha: a 120-year cycle whose starting point is set by the
 * Moon's nakshatra. The portion of the nakshatra still to be travelled at
 * birth gives the balance of the first mahadasha.
 */
export function vimshottari(moonLon: number, birth: Date, count = 9): Period[] {
  const nk = nakshatraOf(moonLon)
  const firstLord = nk.info.lord
  const startIdx = DASHA_ORDER.indexOf(firstLord)
  // The first mahadasha began before birth; back-date its start so every period is complete.
  let cursor = birth.getTime() - nk.fraction * DASHA_YEARS[firstLord] * YEAR_MS
  const out: Period[] = []
  for (let i = 0; i < count; i++) {
    const lord = DASHA_ORDER[(startIdx + i) % 9]
    const len = DASHA_YEARS[lord] * YEAR_MS
    const start = new Date(cursor)
    const end = new Date(cursor + len)
    out.push({ lord, start, end, sub: antardashas(lord, cursor, len) })
    cursor += len
  }
  return out
}

function antardashas(md: Graha, startMs: number, lenMs: number): Period[] {
  const idx = DASHA_ORDER.indexOf(md)
  const out: Period[] = []
  let cursor = startMs
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(idx + i) % 9]
    const len = (lenMs * DASHA_YEARS[lord]) / 120
    out.push({ lord, start: new Date(cursor), end: new Date(cursor + len) })
    cursor += len
  }
  return out
}

export function currentPeriods(periods: Period[], at = new Date()) {
  const md = periods.find((p) => p.start <= at && at < p.end) ?? null
  const ad = md?.sub?.find((p) => p.start <= at && at < p.end) ?? null
  return { md, ad }
}
