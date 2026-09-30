import { longitudeOf } from '../astro/ephemeris'
import { DASHA_ORDER, SEVEN, SIGN_LORD, houseFrom, type Graha } from './constants'
import type { Period } from './dasha'
import { lahiriAyanamsa, type GrahaPos, type VedicChart } from './sidereal'

/* ------------------------------------------------------------------ */
/* Drishti (Parashari planetary aspects)                                */
/* ------------------------------------------------------------------ */

/**
 * Houses (counted from the planet, inclusive) that each graha aspects.
 * Every graha aspects the 7th; Mars also the 4th and 8th, Jupiter the 5th and
 * 9th, Saturn the 3rd and 10th. Rahu and Ketu are given Jupiter-like 5/7/9
 * aspects, as in most modern Parashari practice.
 */
export const DRISHTI: Record<Graha, number[]> = {
  Sun: [7], Moon: [7], Mercury: [7], Venus: [7],
  Mars: [4, 7, 8], Jupiter: [5, 7, 9], Saturn: [3, 7, 10],
  Rahu: [5, 7, 9], Ketu: [5, 7, 9],
}

/** Signs aspected by a graha placed in `sign`. */
export function aspectedSigns(graha: Graha, sign: number): number[] {
  return DRISHTI[graha].map((n) => (sign + n - 1) % 12)
}

/** Grahas that aspect a sign (by Parashari drishti). */
export function aspectsOnSign(chart: VedicChart, sign: number): Graha[] {
  return chart.grahas.filter((g) => aspectedSigns(g.graha, g.sign).includes(sign)).map((g) => g.graha)
}

/** Grahas aspecting another graha. */
export function aspectsOnGraha(chart: VedicChart, target: Graha): Graha[] {
  const t = chart.grahas.find((g) => g.graha === target)!
  return aspectsOnSign(chart, t.sign).filter((g) => g !== target)
}

/** Grahas in the same sign as the target (conjunction). */
export function conjunctWith(chart: VedicChart, target: Graha): Graha[] {
  const t = chart.grahas.find((g) => g.graha === target)!
  return chart.grahas.filter((g) => g.sign === t.sign && g.graha !== target).map((g) => g.graha)
}

/* ------------------------------------------------------------------ */
/* Jaimini chara karakas and Upapada                                    */
/* ------------------------------------------------------------------ */

export type CharaKaraka = 'Atmakaraka' | 'Amatyakaraka' | 'Bhratrikaraka' | 'Matrikaraka' | 'Putrakaraka' | 'Gnatikaraka' | 'Darakaraka'
const KARAKA_NAMES: CharaKaraka[] = ['Atmakaraka', 'Amatyakaraka', 'Bhratrikaraka', 'Matrikaraka', 'Putrakaraka', 'Gnatikaraka', 'Darakaraka']

/** Seven-karaka scheme: the seven planets ranked by degree within their sign, highest first. */
export function charaKarakas(chart: VedicChart): Record<CharaKaraka, Graha> {
  const ranked = chart.grahas.filter((g) => SEVEN.includes(g.graha)).sort((a, b) => b.degree - a.degree)
  return Object.fromEntries(KARAKA_NAMES.map((k, i) => [k, ranked[i].graha])) as Record<CharaKaraka, Graha>
}

/** Arudha of a house (Jaimini): count from the house to its lord, then the same count again from the lord. */
export function arudha(chart: VedicChart, house: number): number {
  const hSign = (chart.lagnaSign! + house - 1) % 12
  const lord = pos(chart, SIGN_LORD[hSign])
  const n = houseFrom(hSign, lord.sign)
  let a = (lord.sign + n - 1) % 12
  // Exception: the arudha cannot fall in the house itself or the 7th from it; take the 10th from there instead.
  if (a === hSign || a === (hSign + 6) % 12) a = (a + 9) % 12
  return a
}

/** Upapada Lagna = arudha of the 12th house: the “image” of marriage. */
export function upapada(chart: VedicChart): number {
  return arudha(chart, 12)
}

export function pos(chart: VedicChart, g: Graha): GrahaPos {
  return chart.grahas.find((x) => x.graha === g)!
}

export function lordOfHouse(chart: VedicChart, house: number, fromSign = chart.lagnaSign!): Graha {
  return SIGN_LORD[(fromSign + house - 1) % 12]
}

/* ------------------------------------------------------------------ */
/* Transits (gochara) and the double-transit rule                       */
/* ------------------------------------------------------------------ */

export function siderealAt(g: 'Jupiter' | 'Saturn', date: Date): number {
  return (((longitudeOf(g, date) - lahiriAyanamsa(date)) % 360) + 360) % 360
}

export interface TransitWindow {
  start: Date
  end: Date
  dasha: { md: Graha; ad: Graha } | null
  dashaMatch: Graha[] // dasha lords that are significators
  strength: 'strong' | 'moderate'
}

/**
 * Double transit (popularised by K. N. Rao): an event is likely when transiting
 * Jupiter AND transiting Saturn both influence (occupy or aspect) the relevant
 * house or its lord's natal sign, and the running dasha connects to it.
 */
export function doubleTransitWindows(
  chart: VedicChart, house: number, significators: Graha[], periods: Period[], from: Date, years: number,
): TransitWindow[] {
  if (chart.lagnaSign === null) return []
  const houseSign = (chart.lagnaSign + house - 1) % 12
  const lordSign = pos(chart, lordOfHouse(chart, house)).sign
  const targets = new Set([houseSign, lordSign])
  const influences = (g: 'Jupiter' | 'Saturn', sign: number) => targets.has(sign) || aspectedSigns(g, sign).some((s) => targets.has(s))

  const step = 15 * 86400000
  const endMs = from.getTime() + years * 365.25 * 86400000
  const samples: { t: number; on: boolean; md: Graha | null; ad: Graha | null }[] = []
  for (let t = from.getTime(); t <= endMs; t += step) {
    const d = new Date(t)
    const on = influences('Jupiter', Math.floor(siderealAt('Jupiter', d) / 30)) && influences('Saturn', Math.floor(siderealAt('Saturn', d) / 30))
    const md = periods.find((p) => p.start <= d && d < p.end)
    const ad = md?.sub?.find((p) => p.start <= d && d < p.end)
    samples.push({ t, on, md: md?.lord ?? null, ad: ad?.lord ?? null })
  }
  const out: TransitWindow[] = []
  let i = 0
  while (i < samples.length) {
    if (!samples[i].on) { i++; continue }
    // Split windows where the antardasha changes so each window has one dasha label.
    let j = i
    while (j + 1 < samples.length && samples[j + 1].on && samples[j + 1].ad === samples[i].ad && samples[j + 1].md === samples[i].md) j++
    const s = samples[i]
    const dashaMatch = [s.md, s.ad].filter((g): g is Graha => !!g && significators.includes(g))
    out.push({
      start: new Date(s.t), end: new Date(samples[j].t + step),
      dasha: s.md && s.ad ? { md: s.md, ad: s.ad } : null,
      dashaMatch: [...new Set(dashaMatch)],
      strength: dashaMatch.length ? 'strong' : 'moderate',
    })
    i = j + 1
  }
  return out
}

/** Order significators by dasha sequence for display. */
export function sortByDasha(gs: Graha[]): Graha[] {
  return [...new Set(gs)].sort((a, b) => DASHA_ORDER.indexOf(a) - DASHA_ORDER.indexOf(b))
}
