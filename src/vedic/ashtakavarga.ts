/**
 * Ashtakavarga (BPHS 66-72): each of the seven planets receives a benefic
 * point (bindu) in a sign when that sign is at one of the listed distances
 * from each of eight reference points (the seven planets and the lagna).
 */
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
