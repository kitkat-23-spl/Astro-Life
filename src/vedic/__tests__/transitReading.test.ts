import { describe, expect, it } from 'vitest'
import { careerReport } from '../career'
import { vimshottari } from '../dasha'
import { pos } from '../query'
import { countConditions, summarise } from '../rules'
import { computeVedicChart } from '../sidereal'
import { houseLine, natalLink, slowTimeline, transitConjunctions, transitReadings } from '../transitReading'
import { signPeriods } from '../transits'

const birth = { name: 'Arjun', date: '1994-02-10', time: '07:45', place: 'New Delhi', latitude: 28.61, longitude: 77.21, timezone: 'Asia/Kolkata', houseSystem: 'placidus' as const }
const chart = computeVedicChart(birth)
const at = new Date('2026-10-05T06:30:00Z')
const dashas = vimshottari(pos(chart, 'Moon').lon, chart.utc)

describe('condition counts', () => {
  it('add up to the conditions checked', () => {
    const r = careerReport(chart, at)!
    const c = r.conditions
    expect(c.supportive + c.mixed + c.challenging + c.notMet).toBe(c.checked)
    expect(countConditions(r.groups)).toEqual(c)
  })
  it('summarises a report in words with its strongest factors', () => {
    const s = summarise(careerReport(chart, at)!)
    expect(['Mostly supportive', 'Mixed', 'More challenging']).toContain(s.label)
    expect(s.strengths.length).toBeLessThanOrEqual(2)
    expect(s.cautions.length).toBeLessThanOrEqual(1)
    if (s.leaning === 'supportive') expect(s.conditions.supportive).toBeGreaterThanOrEqual(2 * s.conditions.challenging)
  })
})

describe('transit readings', () => {
  const rs = transitReadings(chart, at, dashas)
  it('reads all nine planets, slow ones first', () => {
    expect(rs.map((r) => r.graha)).toEqual(['Saturn', 'Jupiter', 'Rahu', 'Ketu', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'])
    for (const r of rs) {
      expect(r.lines.length).toBeGreaterThan(1)
      expect(r.until.getTime()).toBeGreaterThan(at.getTime())
    }
  })
  it('links the natal house with the transit house', () => {
    // Saturn is in the 1st house at birth for this chart.
    const link = natalLink(chart, 'Saturn', 12)!
    expect(link.full).toMatch(/At birth Saturn is in your 1st house/)
    expect(link.short).toMatch(/self matters meet expenses/)
  })
  it('treats malefics in upachaya houses as supportive', () => {
    expect(houseLine('Saturn', 11).weight).toBe(1)
    expect(houseLine('Saturn', 12).weight).toBe(-1)
    expect(houseLine('Jupiter', 9).weight).toBe(1)
  })
  it('notes the running dasha lord', () => {
    const ju = rs.find((r) => r.graha === 'Jupiter')!
    expect(ju.lines.some((l) => /running mahadasha lord/.test(l))).toBe(true) // Jupiter mahadasha 2020-2036
  })
})

describe('sign periods and timeline', () => {
  it('gives contiguous sign periods', () => {
    const ps = signPeriods(chart, 'Saturn', at, new Date('2032-01-01'))
    expect(ps[0].start.getTime()).toBeLessThan(at.getTime())
    for (let i = 1; i < ps.length; i++) expect(ps[i].start.getTime()).toBe(ps[i - 1].end.getTime())
    expect(ps.find((p) => p.sign === 0)).toBeDefined() // Saturn reaches Mesha in 2027
  })
  it('builds the ten-year timeline with readings', () => {
    const t = slowTimeline(chart, at, 10)
    expect(t.Saturn.length).toBeGreaterThan(3)
    expect(t.Jupiter.length).toBeGreaterThan(8)
    expect(t.Rahu[0].text).toMatch(/Ketu is opposite/)
  })
  it('lists transit conjunctions', () => {
    for (const c of transitConjunctions(chart, at)) {
      expect(c.grahas.length).toBeGreaterThan(1)
      expect(c.lines.length).toBeGreaterThan(0)
    }
  })
})
