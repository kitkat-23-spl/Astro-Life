/**
 * Ashtakavarga (BPHS 66-72): each of the seven planets receives a benefic
 * point (bindu) in a sign when that sign is at one of the listed distances
 * from each of eight reference points (the seven planets and the lagna).
 */
import { ordinal } from '../astro/constants'
import { SEVEN, type Graha } from './constants'
import { pos } from './query'
import type { VedicChart } from './sidereal'

type Ref = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Lagna'
const REFS: Ref[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna']

/** Houses counted from each reference in which the planet contributes a bindu. */
const TABLE: Partial<Record<Graha, Record<Ref, number[]>>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11], Moon: [3, 6, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11], Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11], Venus: [6, 7, 12], Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11], Moon: [1, 3, 6, 7, 10, 11], Mars: [2, 3, 5, 6, 9, 10, 11], Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12], Venus: [3, 4, 5, 7, 9, 10, 11], Saturn: [3, 5, 6, 11], Lagna: [3, 6, 10, 11],
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11], Moon: [3, 6, 11], Mars: [1, 2, 4, 7, 8, 10, 11], Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12], Venus: [6, 8, 11, 12], Saturn: [1, 4, 7, 8, 9, 10, 11], Lagna: [1, 3, 6, 10, 11],
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12], Moon: [2, 4, 6, 8, 10, 11], Mars: [1, 2, 4, 7, 8, 9, 10, 11], Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12], Venus: [1, 2, 3, 4, 5, 8, 9, 11], Saturn: [1, 2, 4, 7, 8, 9, 10, 11], Lagna: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11], Moon: [2, 5, 7, 9, 11], Mars: [1, 2, 4, 7, 8, 10, 11], Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11], Venus: [2, 5, 6, 9, 10, 11], Saturn: [3, 5, 6, 12], Lagna: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    Sun: [8, 11, 12], Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12], Mars: [3, 5, 6, 9, 11, 12], Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11], Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11], Saturn: [3, 4, 5, 8, 9, 10, 11], Lagna: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11], Moon: [3, 6, 11], Mars: [3, 5, 6, 10, 11, 12], Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12], Venus: [6, 11, 12], Saturn: [3, 5, 6, 11], Lagna: [1, 3, 4, 6, 10, 11],
  },
}

/** Total bindus each planet distributes (BPHS). */
export const BAV_TOTALS: Partial<Record<Graha, number>> = { Sun: 48, Moon: 49, Mars: 39, Mercury: 54, Jupiter: 56, Venus: 52, Saturn: 39 }

export interface Ashtakavarga {
  /** Bindus by planet and sign (index 0 = Aries). */
  bav: Record<string, number[]>
  /** Sarvashtakavarga: the sum of the seven tables by sign. Totals 337. */
  sav: number[]
}

const cache = new WeakMap<VedicChart, Ashtakavarga | null>()

export function ashtakavarga(chart: VedicChart): Ashtakavarga | null {
  if (cache.has(chart)) return cache.get(chart)!
  let result: Ashtakavarga | null = null
  if (chart.lagnaSign !== null) {
    const refSign = (r: Ref) => (r === 'Lagna' ? chart.lagnaSign! : pos(chart, r).sign)
    const bav: Record<string, number[]> = {}
    for (const g of SEVEN) {
      const row = Array(12).fill(0)
      for (const r of REFS) for (const h of TABLE[g]![r]) row[(refSign(r) + h - 1) % 12]++
      bav[g] = row
    }
    const sav = Array.from({ length: 12 }, (_, s) => SEVEN.reduce((a, g) => a + bav[g][s], 0))
    result = { bav, sav }
  }
  cache.set(chart, result)
  return result
}

/** SAV by house from the lagna (index 0 = 1st house). */
export const savByHouse = (chart: VedicChart, av: Ashtakavarga) => Array.from({ length: 12 }, (_, i) => av.sav[(chart.lagnaSign! + i) % 12])

/** Classical meaning of the bindus in a planet's own table when it transits there (Charak, ch. XXX). */
export const BINDU_MEANING = [
  'Humiliation, illness and danger; malefic transits here are decidedly hard.',
  'Illness, hardship and aimless effort.',
  'Mental strain, trouble with authority, losses to theft.',
  'Physical and mental discomfort.',
  'Mixed: good and bad in equal measure.',
  'Learning, wealth, children and good things.',
  'Good character, success over opponents, wealth, vehicles and renown.',
  'Honours and great good fortune.',
  'Royal grace and glory.',
]

export interface SavReading { id: string; text: string; tone: 'good' | 'mixed' | 'challenge' }

/** Observations from the Sarvashtakavarga by house (Charak, ch. XXX). */
export function savReadings(chart: VedicChart, av: Ashtakavarga): SavReading[] {
  const b = savByHouse(chart, av)
  const H = (n: number) => b[n - 1]
  const out: SavReading[] = []
  const health = H(1) > 28 && H(8) > 28
  out.push({ id: 'health', tone: health ? 'good' : H(1) < 28 && H(8) < 28 ? 'challenge' : 'mixed', text: `1st house ${H(1)} and 8th house ${H(8)}: ${health ? 'both above the average of 28, which the texts read as good health and stamina' : H(1) < 28 && H(8) < 28 ? 'both below the average of 28, so health needs steadier care' : 'one above and one below average'}.` })
  out.push({ id: '11-10', tone: H(11) > H(10) ? 'good' : 'mixed', text: `11th ${H(11)} against 10th ${H(10)}: ${H(11) > H(10) ? 'more in the 11th, so gains come with less effort' : 'the 10th is not exceeded by the 11th, so gains follow hard work'}.` })
  out.push({ id: '12-11', tone: H(12) > H(11) ? 'mixed' : 'good', text: `12th ${H(12)} against 11th ${H(11)}: ${H(12) > H(11) ? 'more in the 12th, so spending can outrun income, or income comes from abroad' : 'income exceeds expenses'}.` })
  out.push({ id: '2-12', tone: H(2) > H(12) ? 'good' : 'mixed', text: `2nd ${H(2)} against 12th ${H(12)}: ${H(2) > H(12) ? 'more in the 2nd, so the stress is on saving' : 'more in the 12th, so the stress is on spending and enjoyment'}.` })
  if (H(6) >= 30) out.push({ id: '6', tone: 'mixed', text: `A strong 6th house (${H(6)}): struggle and competition are prominent, and health needs attention.` })
  if (H(5) > H(10) && H(11) < 28) out.push({ id: '5-10', tone: 'mixed', text: `5th (${H(5)}) above 10th (${H(10)}) with a weak 11th (${H(11)}): Col. A.K. Gaur observed setbacks in career here. The author calls this a matter for research.` })
  const jumps = b.map((n, i) => [i + 1, n - b[(i + 11) % 12]] as const).filter(([, d]) => Math.abs(d) >= 8)
  for (const [h, d] of jumps) out.push({ id: `jump-${h}`, tone: d > 0 ? 'good' : 'challenge', text: `A jump of ${d > 0 ? '+' : ''}${d} bindus into the ${ordinal(h)} house: a marked ${d > 0 ? 'rise' : 'fall'} as planets move into it.` })
  return out
}

/** Kakshya lords in order through each sign (3°45′ each). */
export const KAKSHYA_ORDER: Ref[] = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Lagna']

export interface KakshyaRow { graha: Graha; sign: number; kakshya: number; lord: Ref; bindu: boolean }

/**
 * Daily use of Ashtakavarga (Charak, ch. XXX): a transiting planet does well in
 * a kakshya whose lord contributed a bindu to that sign in the planet's own table.
 */
export function kakshyaCheck(chart: VedicChart, positions: { graha: Graha; lon: number }[]): { rows: KakshyaRow[]; count: number; verdict: string } | null {
  if (chart.lagnaSign === null) return null
  const refSign = (r: Ref) => (r === 'Lagna' ? chart.lagnaSign! : pos(chart, r).sign)
  const rows = positions.filter((p) => SEVEN.includes(p.graha)).map((p) => {
    const sign = Math.floor(p.lon / 30), k = Math.floor((p.lon % 30) / 3.75)
    const lord = KAKSHYA_ORDER[k]
    const bindu = TABLE[p.graha]![lord].includes(((sign - refSign(lord) + 12) % 12) + 1)
    return { graha: p.graha, sign, kakshya: k + 1, lord, bindu }
  })
  const count = rows.filter((r) => r.bindu).length
  const verdict = count >= 6 ? 'Excellent' : count === 5 ? 'Very good' : count === 4 ? 'Good (the borderline)' : count === 3 ? 'Average, with some difficulties' : 'Difficult; go carefully'
  return { rows, count, verdict }
}
