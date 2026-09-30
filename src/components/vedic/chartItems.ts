import { GRAHA_INFO, type Graha } from '../../vedic/constants'
import { signName, type VargaChart, type VedicChart } from '../../vedic/sidereal'
import type { ChartItem, ChartStyle } from './SquareChart'

export const STYLE_KEY = 'astrolife:chart-style'
export function loadStyle(): ChartStyle {
  try {
    return localStorage.getItem(STYLE_KEY) === 'south' ? 'south' : 'north'
  } catch {
    return 'north'
  }
}

/** Chart items for any varga; D1 also shows degrees and retrograde marks. */
export function itemsFor(chart: VedicChart, vc: VargaChart): ChartItem[] {
  const items: ChartItem[] = vc.placements.map((p) => {
    const g = chart.grahas.find((x) => x.graha === p.graha)!
    const deg = vc.n === 1 ? ` ${Math.floor(g.degree)}°` : ''
    const retro = g.retrograde && g.graha !== 'Rahu' && g.graha !== 'Ketu' ? '℞' : ''
    return {
      sign: p.sign,
      label: `${GRAHA_INFO[p.graha as Graha].abbr}${deg}${retro}`,
      title: `${p.graha} in ${signName(p.sign)}${p.dignity && p.dignity !== 'neutral' ? ` (${p.dignity})` : ''}${retro ? ', retrograde' : ''}`,
      tone: p.dignity === 'exalted' || p.dignity === 'moolatrikona' || p.dignity === 'own' ? 'up' : p.dignity === 'debilitated' ? 'down' : undefined,
    }
  })
  if (vc.lagnaSign !== null) items.unshift({ sign: vc.lagnaSign, label: 'Asc', title: `Lagna in ${signName(vc.lagnaSign)}`, tone: 'asc' })
  return items
}

export function lagnaFor(vc: VargaChart) {
  if (vc.lagnaSign !== null) return { sign: vc.lagnaSign, moon: false }
  return { sign: vc.placements.find((p) => p.graha === 'Moon')!.sign, moon: true }
}

