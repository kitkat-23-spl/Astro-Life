import { describe, expect, it } from 'vitest'
import { computeVedicChart, lahiriAyanamsa, signName, vargaChart } from '../sidereal'
import { vargaSign } from '../varga'
import { currentPeriods, vimshottari } from '../dasha'

const einstein = computeVedicChart({
  name: 'Einstein', date: '1879-03-14', time: '11:30', place: 'Ulm',
  latitude: 48.4, longitude: 10.0, timezone: 'UTC+0:40', houseSystem: 'placidus',
})
const g = (name: string) => einstein.grahas.find((x) => x.graha === name)!

describe('Lahiri ayanamsa', () => {
  it('matches the reference value at J2000 (23°51′ ≈ 23.857°)', () => {
    const mean = lahiriAyanamsa(new Date('2000-01-01T12:00:00Z'))
    expect(Math.abs(mean - 23.857)).toBeLessThan(0.01) // nutation adds at most ±0.005°
  })
  it('matches the reference at 21 Mar 1956 (23°15′)', () => {
    expect(Math.abs(lahiriAyanamsa(new Date('1956-03-21T00:00:00Z')) - 23.2455)).toBeLessThan(0.006)
  })
})

describe('Einstein sidereal chart', () => {
  it('has Gemini lagna, Scorpio Moon in Jyeshtha, Pisces Sun', () => {
    expect(signName(einstein.lagnaSign!)).toBe('Gemini')
    expect(signName(g('Moon').sign)).toBe('Scorpio')
    expect(g('Moon').nakshatra).toBe(17) // Jyeshtha
    expect(signName(g('Sun').sign)).toBe('Pisces')
  })
  it('places Rahu and Ketu exactly opposite, always retrograde', () => {
    expect(Math.abs(((g('Rahu').lon - g('Ketu').lon + 360) % 360) - 180)).toBeLessThan(1e-9)
    expect(g('Rahu').retrograde && g('Ketu').retrograde).toBe(true)
  })
  it('flags Mars exalted in Capricorn and uses whole-sign houses', () => {
    expect(signName(g('Mars').sign)).toBe('Capricorn')
    expect(g('Mars').dignity).toBe('exalted')
    expect(g('Sun').house).toBe(10) // Pisces is 10th from Gemini
  })
  it('starts in Mercury dasha (Jyeshtha is ruled by Mercury)', () => {
    const d = vimshottari(g('Moon').lon, einstein.utc)
    expect(d[0].lord).toBe('Mercury')
    expect(d[1].lord).toBe('Ketu')
    expect(d[0].start < einstein.utc && einstein.utc < d[0].end).toBe(true)
    const total = d.reduce((s, p) => s + (p.end.getTime() - p.start.getTime()), 0) / (365.2425 * 86400000)
    expect(Math.round(total)).toBe(120)
    expect(d[0].sub![0].lord).toBe('Mercury')
    expect(currentPeriods(d, new Date('1900-01-01')).md).not.toBeNull()
  })
})

describe('vargas', () => {
  const lon = (sign: number, deg: number) => sign * 30 + deg
  it('Navamsa follows movable/fixed/dual rules', () => {
    expect(vargaSign(9, lon(0, 1))).toBe(0) // Aries → Aries
    expect(vargaSign(9, lon(1, 1))).toBe(9) // Taurus (fixed) → 9th = Capricorn
    expect(vargaSign(9, lon(2, 1))).toBe(6) // Gemini (dual) → 5th = Libra
    expect(vargaSign(9, lon(11, 29.9))).toBe(11) // last navamsa of Pisces = Pisces (vargottama)
  })
  it('Hora uses only Leo and Cancer', () => {
    expect(vargaSign(2, lon(0, 5))).toBe(4) // odd sign, first half → Sun (Leo)
    expect(vargaSign(2, lon(1, 5))).toBe(3) // even sign, first half → Moon (Cancer)
  })
  it('Drekkana, Chaturthamsa, Saptamsa, Dasamsa', () => {
    expect(vargaSign(3, lon(0, 15))).toBe(4) // Aries 2nd decanate → Leo
    expect(vargaSign(4, lon(0, 8))).toBe(3) // Aries 2nd quarter → Cancer
    expect(vargaSign(7, lon(1, 0.5))).toBe(7) // Taurus (even) starts from 7th → Scorpio
    expect(vargaSign(10, lon(1, 4))).toBe(10) // Taurus (even) from 9th = Capricorn, 2nd part → Aquarius
    expect(vargaSign(10, lon(0, 29.99))).toBe(9) // Aries 10th part → Capricorn
  })
  it('D5, D6, D8 stay within range', () => {
    for (const n of [5, 6, 8] as const) for (let d = 0; d < 360; d += 0.7) {
      const s = vargaSign(n, d)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThan(12)
    }
  })
  it('builds a full D9 chart with houses from its own lagna', () => {
    const d9 = vargaChart(einstein, 9)
    expect(d9.placements).toHaveLength(9)
    expect(d9.placements.every((p) => p.house! >= 1 && p.house! <= 12)).toBe(true)
  })
})
