import { describe, expect, it } from 'vitest'
import { annualReading } from '../annualReading'
import { runningAge } from '../annual'
import { computeVedicChart } from '../sidereal'

const birth = { name: 'Test', date: '1990-06-15', time: '10:30', place: 'New Delhi', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata', houseSystem: 'whole-sign' as const }
const chart = computeVedicChart(birth)
const age = runningAge(chart, new Date('2026-10-01T00:00:00Z'))

describe('annual reading', () => {
  const r = annualReading(chart, age)!
  it('reads the running year', () => {
    expect(age).toBe(36)
    expect(r.v.start < new Date('2026-10-01') && r.v.end > new Date('2026-10-01')).toBe(true)
    expect(['Mostly supportive', 'Mixed', 'More challenging']).toContain(r.summary.label)
  })
  it('covers six areas, each with its own rules', () => {
    expect(r.areas.map((a) => a.id)).toEqual(['career', 'money', 'partner', 'health', 'home', 'learning'])
    for (const a of r.areas) expect(a.summary.conditions.checked).toBeGreaterThan(2)
    const ids = r.areas.flatMap((a) => a.group.results.map((x) => x.id)).concat(r.groups.flatMap((g) => g.results.map((x) => x.id)))
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('judges a retrograde back-and-forth once per sign', () => {
    const titles = r.groups[2].results.map((x) => x.title)
    expect(new Set(titles).size).toBe(titles.length)
  })
  it('lists the dasha sub-periods and transits inside the year', () => {
    expect(r.groups[1].results.length).toBeGreaterThan(0)
    expect(r.mudda).toHaveLength(9)
    for (const d of r.dates) expect(d.date >= r.v.start && d.date < r.v.end).toBe(true)
  })
  it('needs a birth time', () => {
    expect(annualReading(computeVedicChart({ ...birth, time: null }), age)).toBeNull()
  })
})
