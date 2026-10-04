import { describe, expect, it } from 'vitest'
import { norm360 } from '../../astro/constants'
import { longitudeOf } from '../../astro/ephemeris'
import { BAV_TOTALS, ashtakavarga } from '../ashtakavarga'
import { tithiPravesh, varshaphal } from '../annual'
import { ashtottari, charaDasha, yogini } from '../dasha'
import { activatedHouses } from '../interpret'
import { bhavaChalit, kpChart, kpLords } from '../kp'
import { pos } from '../query'
import { computeVedicChart, siderealLongitude } from '../sidereal'
import { specialPoints, yogiPoints } from '../special'
import { avastha, bhavaBala, shadbala, vimsopaka } from '../strength'
import { gochara, monthlyOutlook, sadeSati, transitEvents, transitPositions } from '../transits'

const birth = { name: 'Einstein', date: '1879-03-14', time: '11:30', place: 'Ulm', latitude: 48.4, longitude: 10.0, timezone: 'UTC+0:40', houseSystem: 'placidus' as const }
const chart = computeVedicChart(birth)
const now = new Date('2026-10-01T00:00:00Z')

describe('ashtakavarga', () => {
  const av = ashtakavarga(chart)!
  it('distributes the classical number of bindus', () => {
    for (const [g, total] of Object.entries(BAV_TOTALS)) expect(av.bav[g].reduce((a, b) => a + b, 0)).toBe(total)
    expect(av.sav.reduce((a, b) => a + b, 0)).toBe(337)
  })
  it('needs a birth time', () => {
    expect(ashtakavarga(computeVedicChart({ ...birth, time: null }))).toBeNull()
  })
})

describe('strength', () => {
  const sb = shadbala(chart)!
  it('gives Shadbala in a sensible range for all seven planets', () => {
    expect(sb).toHaveLength(7)
    for (const s of sb) {
      expect(s.total).toBeGreaterThan(150)
      expect(s.total).toBeLessThan(900)
      expect(s.sthana.uchcha).toBeLessThanOrEqual(60)
    }
    // Mars is exalted in Capricorn: its uchcha bala is high.
    expect(sb.find((s) => s.graha === 'Mars')!.sthana.uchcha).toBeGreaterThan(50)
  })
  it('gives Bhava bala for twelve houses and Vimsopaka out of 20', () => {
    expect(bhavaBala(chart)).toHaveLength(12)
    for (const s of sb) {
      const v = vimsopaka(chart, s.graha)
      expect(v).toBeGreaterThan(0)
      expect(v).toBeLessThanOrEqual(20)
    }
  })
  it('names the avasthas', () => {
    expect(avastha(chart, 'Mars').mood).toMatch(/Deepta/) // exalted
    expect(avastha(chart, 'Moon').mood).toMatch(/Khala/) // debilitated
  })
})

describe('dasha systems', () => {
  it('starts Yogini dasha from (nakshatra + 3) mod 8', () => {
    expect(yogini(5, chart.utc)[0].name).toBe('Bhramari') // Ashwini
    const y = yogini(pos(chart, 'Moon').lon, chart.utc) // Jyeshtha (18): 21 mod 8 = 5, Bhadrika
    expect(y[0].name).toBe('Bhadrika')
    expect(y[1].start.getTime()).toBe(y[0].end.getTime())
  })
  it('starts Ashtottari from the Moon\'s group', () => {
    expect(ashtottari(70, chart.utc)[0].lord).toBe('Sun') // Ardra
    expect(ashtottari(5, chart.utc)[0].lord).toBe('Rahu') // Ashwini
  })
  it('builds Chara dasha from the lagna', () => {
    const c = charaDasha(chart.lagnaSign!, (g) => pos(chart, g).sign, (g) => pos(chart, g).dignity, (s) => chart.grahas.filter((x) => x.sign === s).length, chart.utc)
    expect(c[0].sign).toBe(chart.lagnaSign)
    for (const p of c.slice(0, 12)) {
      const y = (p.end.getTime() - p.start.getTime()) / (365.2425 * 86400000)
      expect(y).toBeGreaterThanOrEqual(1)
      expect(y).toBeLessThanOrEqual(13)
    }
  })
  it('lists the houses a dasha lord activates', () => {
    expect(activatedHouses(chart, 'Jupiter').length).toBeGreaterThan(1)
  })
})

describe('transits', () => {
  it('scores current transits from the Moon', () => {
    const rows = gochara(chart, now)
    expect(rows).toHaveLength(9)
    for (const r of rows) expect(['favourable', 'mixed', 'unfavourable']).toContain(r.verdict)
    expect(transitPositions(chart, now).find((p) => p.graha === 'Rahu')!.retrograde).toBe(true)
  })
  it('gives a 12-month outlook and dated events', () => {
    expect(monthlyOutlook(chart, now)).toHaveLength(12)
    const ev = transitEvents(chart, now, 12)
    expect(ev.length).toBeGreaterThan(3)
    for (let i = 1; i < ev.length; i++) expect(ev[i].date >= ev[i - 1].date).toBe(true)
  })
  it('finds a Sade Sati cycle with three phases', () => {
    const s = sadeSati(chart, now)
    expect(s.cycle.map((p) => p.phase)).toEqual(['first', 'peak', 'last'])
  })
})

describe('annual charts', () => {
  const v = varshaphal(chart, 30)!
  it('casts the solar return when the Sun returns to its natal longitude', () => {
    expect(Math.abs(siderealLongitude('Sun', v.start, chart.settings) - pos(chart, 'Sun').lon)).toBeLessThan(0.001)
    expect(v.muntha.sign).toBe((chart.lagnaSign! + 30) % 12)
    expect(v.officeBearers).toHaveLength(5)
    expect(v.mudda).toHaveLength(9)
    expect(Math.abs(v.mudda[8].end.getTime() - v.end.getTime())).toBeLessThan(1000)
  })
  it('finds the Tithi Pravesh moment', () => {
    const t = tithiPravesh(chart, 30)!
    const e = (d: Date) => norm360(longitudeOf('Moon', d) - longitudeOf('Sun', d))
    expect(Math.abs(e(t.moment) - e(chart.utc))).toBeLessThan(0.01)
  })
})

describe('special points and KP', () => {
  it('computes special lagnas and the Yogi point', () => {
    expect(specialPoints(chart).map((p) => p.name)).toContain('Gulika')
    const y = yogiPoints(chart)
    expect(norm360(y.avayogi - y.yogi)).toBeCloseTo(186 + 2 / 3, 6)
  })
  it('divides nakshatras into KP subs', () => {
    expect(kpLords(0.5)).toMatchObject({ sign: 'Mars', star: 'Ketu', sub: 'Ketu' })
    expect(kpLords(1).sub).toBe('Venus') // the Ketu sub of Ashwini ends at 0°46′40″
    const kp = kpChart(chart)!
    expect(kp.cusps).toHaveLength(12)
    expect(Math.abs(kp.cusps[0] - chart.lagna!)).toBeLessThan(1e-6)
  })
  it('builds the Bhava Chalit from the ascendant and MC', () => {
    const c = bhavaChalit(chart)!
    expect(c.madhya[0]).toBeCloseTo(chart.lagna!, 6)
    expect(c.madhya[9]).toBeCloseTo(chart.mc!, 6)
  })
})
