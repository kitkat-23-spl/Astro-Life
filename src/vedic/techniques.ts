import { DASHA_ORDER, SEVEN, SIGN_LORD, houseFrom, type Graha } from './constants'
import type { Period } from './dasha'
import { aspectedSigns, lordOfHouse, pos } from './query'
import { siderealLongitude, type VedicChart } from './sidereal'

/* ------------------------------------------------------------------ */
/* Jaimini chara karakas, arudhas, Upapada                              */
/* ------------------------------------------------------------------ */

export type CharaKaraka =
  | 'Atmakaraka' | 'Amatyakaraka' | 'Bhratrikaraka' | 'Matrikaraka' | 'Pitrikaraka'
  | 'Putrakaraka' | 'Gnatikaraka' | 'Darakaraka'

const SEVEN_NAMES: CharaKaraka[] = ['Atmakaraka', 'Amatyakaraka', 'Bhratrikaraka', 'Matrikaraka', 'Putrakaraka', 'Gnatikaraka', 'Darakaraka']
const EIGHT_NAMES: CharaKaraka[] = ['Atmakaraka', 'Amatyakaraka', 'Bhratrikaraka', 'Matrikaraka', 'Pitrikaraka', 'Putrakaraka', 'Gnatikaraka', 'Darakaraka']

/**
 * Chara karakas ranked by degree within sign, highest first. The 8-karaka
 * scheme includes Rahu, whose degree is counted backwards (30° minus degree).
 */
export function charaKarakas(chart: VedicChart): Partial<Record<CharaKaraka, Graha>> {
  const eight = chart.settings.karakas === 8
  const pool = chart.grahas
    .filter((g) => SEVEN.includes(g.graha) || (eight && g.graha === 'Rahu'))
    .map((g) => ({ graha: g.graha, deg: g.graha === 'Rahu' ? 30 - g.degree : g.degree }))
    .sort((a, b) => b.deg - a.deg)
  const names = eight ? EIGHT_NAMES : SEVEN_NAMES
  return Object.fromEntries(names.map((k, i) => [k, pool[i].graha]))
}

/** Arudha of a house: count from the house to its lord, then the same count again from the lord. */
export function arudha(chart: VedicChart, house: number): number {
  const hSign = (chart.lagnaSign! + house - 1) % 12
  const lord = pos(chart, SIGN_LORD[hSign])
  const n = houseFrom(hSign, lord.sign)
  let a = (lord.sign + n - 1) % 12
  // The arudha cannot fall in the house itself or the 7th from it; take the 10th from there instead.
  if (a === hSign || a === (hSign + 6) % 12) a = (a + 9) % 12
  return a
}

/** Upapada Lagna: arudha of the 12th house. */
export const upapada = (chart: VedicChart) => arudha(chart, 12)

/** Planetary kalas used for Indu Lagna (Jataka Parijata). */
const KALA: Partial<Record<Graha, number>> = { Sun: 30, Moon: 16, Mars: 6, Mercury: 8, Jupiter: 10, Venus: 12, Saturn: 1 }

/**
 * Indu Lagna (wealth ascendant): add the kalas of the 9th lords from lagna and
 * Moon, take the remainder by 12 and count that many signs from the Moon.
 */
export function induLagna(chart: VedicChart): number {
  const moon = pos(chart, 'Moon').sign
  const total = KALA[lordOfHouse(chart, 9)]! + KALA[lordOfHouse(chart, 9, moon)]!
  const r = total % 12 || 12
  return (moon + r - 1) % 12
}

/* ------------------------------------------------------------------ */
/* Transits and the double-transit rule                                 */
/* ------------------------------------------------------------------ */

export interface TransitWindow {
  start: Date
  end: Date
  dasha: { md: Graha; ad: Graha } | null
  dashaMatch: Graha[]
  strength: 'strong' | 'moderate'
}

/**
 * Double transit (K. N. Rao): an event is likely when transiting Jupiter and
 * transiting Saturn both occupy or aspect the house or its lord's natal sign,
 * and the running dasha connects to that house.
 */
export function doubleTransitWindows(
  chart: VedicChart, house: number, significators: Graha[], periods: Period[], from: Date, years: number,
): TransitWindow[] {
  if (chart.lagnaSign === null) return []
  const targets = new Set([(chart.lagnaSign + house - 1) % 12, pos(chart, lordOfHouse(chart, house)).sign])
  const influences = (g: 'Jupiter' | 'Saturn', sign: number) => targets.has(sign) || aspectedSigns(g, sign).some((s) => targets.has(s))
  const signAt = (g: 'Jupiter' | 'Saturn', d: Date) => Math.floor(siderealLongitude(g, d, chart.settings.ayanamsa) / 30)

  const step = 15 * 86400000
  const endMs = from.getTime() + years * 365.25 * 86400000
  const samples: { t: number; on: boolean; md: Graha | null; ad: Graha | null }[] = []
  for (let t = from.getTime(); t <= endMs; t += step) {
    const d = new Date(t)
    const md = periods.find((p) => p.start <= d && d < p.end)
    const ad = md?.sub?.find((p) => p.start <= d && d < p.end)
    samples.push({ t, on: influences('Jupiter', signAt('Jupiter', d)) && influences('Saturn', signAt('Saturn', d)), md: md?.lord ?? null, ad: ad?.lord ?? null })
  }
  const out: TransitWindow[] = []
  for (let i = 0; i < samples.length; i++) {
    if (!samples[i].on) continue
    let j = i
    while (j + 1 < samples.length && samples[j + 1].on && samples[j + 1].ad === samples[i].ad && samples[j + 1].md === samples[i].md) j++
    const s = samples[i]
    const dashaMatch = [...new Set([s.md, s.ad].filter((g): g is Graha => !!g && significators.includes(g)))]
    out.push({
      start: new Date(s.t), end: new Date(samples[j].t + step),
      dasha: s.md && s.ad ? { md: s.md, ad: s.ad } : null,
      dashaMatch, strength: dashaMatch.length ? 'strong' : 'moderate',
    })
    i = j
  }
  return out
}

export function sortByDasha(gs: Graha[]): Graha[] {
  return [...new Set(gs)].sort((a, b) => DASHA_ORDER.indexOf(a) - DASHA_ORDER.indexOf(b))
}
