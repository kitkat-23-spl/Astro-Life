/** Jaimini techniques: chara karakas and arudhas (padas). */
import { SEVEN, SIGN_LORD, houseFrom, type Graha } from './constants'
import { pos } from './query'
import type { VedicChart } from './sidereal'

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

export const ARUDHA_NAMES = [
  'Arudha Lagna (AL)', 'Dhana pada (A2)', 'Vikrama pada (A3)', 'Matri pada (A4)', 'Mantra pada (A5)', 'Roga pada (A6)',
  'Dara pada (A7)', 'Mrityu pada (A8)', 'Bhagya pada (A9)', 'Rajya pada (A10)', 'Labha pada (A11)', 'Upapada (UL)',
]
