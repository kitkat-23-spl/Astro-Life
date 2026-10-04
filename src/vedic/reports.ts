import { careerReport } from './career'
import { childrenReport } from './children'
import { educationReport } from './education'
import { marriageReport, type Gender } from './marriage'
import type { AreaReport } from './rules'
import type { VedicChart } from './sidereal'
import { wealthReport } from './wealth'
import type { YogaResult } from './yogas'

export type ReportKey = 'career' | 'marriage' | 'wealth' | 'children' | 'education'

export const REPORTS: { key: ReportKey; title: string; summary: string }[] = [
  { key: 'career', title: 'Career', summary: '10th house, D10, Amatyakaraka, suitable fields and timing' },
  { key: 'marriage', title: 'Marriage', summary: '7th house, D9, Upapada, Mangal dosha and timing' },
  { key: 'wealth', title: 'Wealth', summary: '2nd and 11th houses, Dhana yogas, Indu Lagna and D2' },
  { key: 'education', title: 'Education', summary: '4th, 5th and 9th houses, Mercury, Jupiter and D24' },
  { key: 'children', title: 'Children', summary: '5th house, Jupiter, Putrakaraka and D7' },
]

export function buildReport(key: ReportKey, chart: VedicChart, gender: Gender, yogas?: YogaResult[], now = new Date()): AreaReport | null {
  switch (key) {
    case 'career': return careerReport(chart, now, yogas)
    case 'marriage': return marriageReport(chart, gender, now)
    case 'wealth': return wealthReport(chart, now, yogas)
    case 'education': return educationReport(chart, now, yogas)
    case 'children': return childrenReport(chart, gender, now)
  }
}

export const verdictOf = (score: number) => (score >= 60 ? 'Above typical' : score >= 40 ? 'Typical' : 'Below typical')
