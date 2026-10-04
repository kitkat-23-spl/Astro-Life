import { describe, expect, it } from 'vitest'
import { careerReport } from '../career'
import { marriageReport } from '../marriage'
import { matchCharts } from '../matching'
import { computeVedicChart } from '../sidereal'
import { aspectedSigns } from '../query'
import { charaKarakas, upapada } from '../techniques'

const birth = { name: 'Einstein', date: '1879-03-14', time: '11:30', place: 'Ulm', latitude: 48.4, longitude: 10.0, timezone: 'UTC+0:40', houseSystem: 'placidus' as const }
const chart = computeVedicChart(birth)
const now = new Date('2026-09-30T00:00:00Z')

describe('techniques', () => {
  it('gives special drishti to Mars, Jupiter and Saturn', () => {
    expect(aspectedSigns('Mars', 0)).toEqual([3, 6, 7])
    expect(aspectedSigns('Jupiter', 0)).toEqual([4, 6, 8])
    expect(aspectedSigns('Saturn', 0)).toEqual([2, 6, 9])
    expect(aspectedSigns('Venus', 0)).toEqual([6])
  })
  it('ranks chara karakas by degree in sign', () => {
    const k = charaKarakas(chart)
    // Degrees: Mars 4.7, Jupiter 5.3, Sun 1.3 lowest → Darakaraka Sun; Venus 24.8 highest → Atmakaraka.
    expect(k.Atmakaraka).toBe('Venus')
    expect(k.Darakaraka).toBe('Sun')
  })
  it('computes an Upapada sign', () => {
    const ul = upapada(chart)
    expect(ul).toBeGreaterThanOrEqual(0)
    expect(ul).toBeLessThan(12)
  })
})

describe('career report', () => {
  const r = careerReport(chart, now)!
  it('finds the Dharma–Karmadhipati yoga (Jupiter–Saturn exchange)', () => {
    const dk = r.groups.flatMap((g) => g.results).find((x) => x.id === 'y-dharma-karma')!
    expect(dk.fired).toBe(true)
  })
  it('suggests ranked fields with reasons', () => {
    expect(r.fields.length).toBeGreaterThan(0)
    expect(r.fields[0].reasons.length).toBeGreaterThan(0)
    expect(r.modes).toHaveLength(5)
    expect(r.vargas.map((v) => v.code)).toEqual(['D1', 'D10', 'D9', 'D2', 'D3'])
  })
  it('returns null without a birth time', () => {
    expect(careerReport(computeVedicChart({ ...birth, time: null }), now)).toBeNull()
  })
})

describe('marriage report', () => {
  it('evaluates for both genders with Jupiter added for women', () => {
    const m = marriageReport(chart, 'male', now)!
    const f = marriageReport(chart, 'female', now)!
    expect(m.groups.flatMap((g) => g.results).some((x) => x.id === 'm-karaka-Jupiter')).toBe(false)
    expect(f.groups.flatMap((g) => g.results).some((x) => x.id === 'm-karaka-Jupiter')).toBe(true)
    expect(m.mangal.checks).toHaveLength(3)
    expect(m.spouse.length).toBeGreaterThan(2)
    expect(m.darakaraka).toBe('Sun')
  })
})

describe('Ashtakoota matching', () => {
  it('scores identical Moons 28/36 with Nadi dosha', () => {
    const r = matchCharts(chart, chart, now)
    expect(r.kootas.map((k) => k.score)).toEqual([1, 2, 3, 4, 5, 6, 7, 0])
    expect(r.total).toBe(28)
    expect(r.doshas[0].effect).toBe('challenging')
    expect(r.poruthams).toHaveLength(10)
  })
  it('scores a different pair within bounds', () => {
    const other = computeVedicChart({ ...birth, date: '1882-07-02', time: '06:00' })
    const r = matchCharts(chart, other, now)
    expect(r.total).toBeGreaterThanOrEqual(0)
    expect(r.total).toBeLessThanOrEqual(36)
    for (const k of r.kootas) expect(k.score).toBeLessThanOrEqual(k.max)
  })
})
