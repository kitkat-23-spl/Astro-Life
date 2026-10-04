import { describe, expect, it } from 'vitest'
import { childrenReport } from '../children'
import { periodChain, subPeriods, upcomingAntardashas, vimshottari } from '../dasha'
import { educationReport } from '../education'
import { ayanamsaAt, computeVedicChart, nodeLongitude } from '../sidereal'
import { vargaSign } from '../varga'
import { wealthReport } from '../wealth'
import { evaluateYogas, mangalDosha } from '../yogas'
import { DEFAULT_SETTINGS } from '../settings'

const birth = { name: 'Einstein', date: '1879-03-14', time: '11:30', place: 'Ulm', latitude: 48.4, longitude: 10.0, timezone: 'UTC+0:40', houseSystem: 'placidus' as const }
const chart = computeVedicChart(birth)
const now = new Date('2026-09-30T00:00:00Z')

describe('ayanamsa options', () => {
  const d = new Date('2000-01-01T12:00:00Z')
  it('orders the common ayanamsas as published', () => {
    const lahiri = ayanamsaAt(d, 'lahiri'), kp = ayanamsaAt(d, 'kp'), raman = ayanamsaAt(d, 'raman'), chitra = ayanamsaAt(d, 'true-chitra')
    expect(Math.abs(kp - 23.76)).toBeLessThan(0.02) // KP (new) ~23°45′ at J2000
    expect(Math.abs(raman - 22.41)).toBeLessThan(0.02) // Raman ~22°24′ at J2000
    expect(Math.abs(chitra - lahiri)).toBeLessThan(0.05) // True Chitra stays close to Lahiri
  })
  it('true and mean nodes stay within 2 degrees', () => {
    const diff = Math.abs(((nodeLongitude(d, 'true') - nodeLongitude(d, 'mean') + 540) % 360) - 180)
    expect(diff).toBeLessThan(2)
  })
  it('applies settings to the chart', () => {
    const k = computeVedicChart(birth, { ...DEFAULT_SETTINGS, ayanamsa: 'raman' })
    expect(k.ayanamsa).toBeLessThan(chart.ayanamsa)
    expect(k.settings.ayanamsa).toBe('raman')
  })
})

describe('higher vargas', () => {
  it('follows the Parashari rules at sample points', () => {
    expect(vargaSign(12, 2)).toBe(0) // first dwadasamsa of Aries is Aries
    expect(vargaSign(12, 29)).toBe(11)
    expect(vargaSign(16, 31)).toBe(4) // fixed sign starts from Leo
    expect(vargaSign(24, 1)).toBe(4) // odd sign starts from Leo
    expect(vargaSign(24, 31)).toBe(3) // even sign starts from Cancer
    expect(vargaSign(30, 3)).toBe(0) // odd sign, 0-5° Mars (Aries)
    expect(vargaSign(30, 33)).toBe(1) // even sign, 0-5° Venus (Taurus)
    expect(vargaSign(60, 0.2)).toBe(0)
  })
})

describe('dasha levels', () => {
  const ps = vimshottari(chart.grahas[1].lon, chart.utc)
  it('nests four levels that tile their parent', () => {
    const chain = periodChain(ps, new Date('1905-06-01T00:00:00Z'), 4)
    expect(chain).toHaveLength(4)
    const subs = subPeriods(chain[2])
    expect(subs[0].start.getTime()).toBe(chain[2].start.getTime())
    expect(Math.abs(subs[8].end.getTime() - chain[2].end.getTime())).toBeLessThan(2)
  })
  it('lists upcoming antardashas', () => {
    expect(upcomingAntardashas(ps, new Date('1900-01-01T00:00:00Z'), 3)).toHaveLength(3)
  })
})

describe('yoga catalogue', () => {
  it('evaluates every yoga without throwing for many charts', () => {
    for (let i = 0; i < 40; i++) {
      const c = computeVedicChart({ ...birth, date: `19${50 + (i % 40)}-0${1 + (i % 9)}-1${i % 10}`, time: `${String(i % 24).padStart(2, '0')}:15` })
      const ys = evaluateYogas(c)
      expect(ys.filter((y) => y.def.id.startsWith('sankhya-') && y.present)).toHaveLength(1)
    }
  })
  it('computes Mangal dosha from lagna, Moon and Venus', () => {
    expect(mangalDosha(chart).checks).toHaveLength(3)
  })
})

describe('new reports', () => {
  it('builds the wealth report', () => {
    const r = wealthReport(chart, now)!
    expect(r.score).toBeGreaterThanOrEqual(10)
    expect(r.sources.length).toBeGreaterThan(0)
    expect(r.groups).toHaveLength(4)
  })
  it('builds the children report with sphutas per gender', () => {
    expect(childrenReport(chart, 'male', now)!.sphutas.map((s) => s.name)).toEqual(['Beeja sphuta'])
    expect(childrenReport(chart, 'unspecified', now)!.sphutas).toHaveLength(2)
  })
  it('builds the education report with subjects', () => {
    const r = educationReport(chart, now)!
    expect(r.subjects.length).toBeGreaterThan(0)
    expect(r.vargas.some((v) => v.code === 'D24')).toBe(true)
  })
  it('returns null without a birth time', () => {
    const c = computeVedicChart({ ...birth, time: null })
    expect(wealthReport(c, now)).toBeNull()
    expect(childrenReport(c, 'male', now)).toBeNull()
    expect(educationReport(c, now)).toBeNull()
  })
})
