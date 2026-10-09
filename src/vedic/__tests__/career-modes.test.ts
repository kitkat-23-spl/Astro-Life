import { describe, expect, it } from 'vitest'
import { careerReport, modePeriods, modeStrength } from '../career'
import { vimshottari } from '../dasha'
import { pos } from '../query'
import { computeVedicChart } from '../sidereal'

const chart = computeVedicChart({ name: '', date: '1990-08-15', time: '07:30', place: 'Mumbai', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata', houseSystem: 'whole-sign' })
const now = new Date('2026-10-09T00:00:00Z')

describe('mode of work', () => {
  it('grades the count of indicators', () => {
    expect([0, 1, 2, 3, 5].map(modeStrength)).toEqual(['none', 'weak', 'moderate', 'strong', 'strong'])
  })

  it('lists all five checks and agrees with the reasons', () => {
    const r = careerReport(chart, now)!
    for (const m of r.modes) {
      expect(m.checks).toHaveLength(5)
      expect(m.checks.filter((c) => c.met).map((c) => c.text)).toEqual(m.reasons)
      expect(m.strength).toBe(modeStrength(m.reasons.length))
    }
    const top = Math.max(...r.modes.map((m) => m.reasons.length))
    expect(r.modeVerdict.best).toEqual(r.modes.filter((m) => m.reasons.length === top).map((m) => m.label))
  })

  it('finds upcoming dashas of the mode planets only', () => {
    const periods = vimshottari(pos(chart, 'Moon').lon, chart.utc)
    const list = modePeriods(periods, ['Mars', 'Venus'], now)
    expect(list.length).toBeGreaterThan(0)
    expect(list.length).toBeLessThanOrEqual(3)
    for (const p of list) {
      expect(p.end.getTime()).toBeGreaterThan(now.getTime())
      expect(['Mars', 'Venus']).toContain(p.ad ?? p.md)
    }
    expect([...list].sort((a, b) => a.start.getTime() - b.start.getTime())).toEqual(list)
  })
})
