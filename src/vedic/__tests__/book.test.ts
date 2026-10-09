import { describe, expect, it } from 'vitest'
import { YONI_TABLE, matchCharts } from '../matching'
import { dayChecks, taaraOf, tithiGroup } from '../muhurta'
import { computePanchang } from '../panchang'
import { pos } from '../query'
import { computeVedicChart } from '../sidereal'
import { evaluateYogas } from '../yogas'

const delhi = (date: string, time: string) => computeVedicChart({ name: '', date, time, place: 'Delhi', latitude: 28.6, longitude: 77.2, timezone: 'Asia/Kolkata', houseSystem: 'whole-sign' })

describe('Charak worked example: matching (ch. XXVII)', () => {
  // Groom: Moon in Moola, early Dhanu. Bride: Moon in Uttara Bhadrapada, Meena 5°.
  const groom = delhi('1956-05-27', '06:00'), bride = delhi('1959-04-06', '19:45')
  it('reproduces the example Moons', () => {
    expect([pos(groom, 'Moon').sign, pos(groom, 'Moon').nakshatra]).toEqual([8, 18])
    expect([pos(bride, 'Moon').sign, pos(bride, 'Moon').nakshatra]).toEqual([11, 25])
  })
  it('scores each koota as the book does, 24 in all', () => {
    const r = matchCharts(groom, bride)
    const k = Object.fromEntries(r.kootas.map((x) => [x.name, x.score]))
    expect(k).toEqual({ Varna: 0, Vashya: 0.5, Tara: 1.5, Yoni: 2, 'Graha Maitri': 5, Gana: 0, Bhakoot: 7, Nadi: 8 })
    expect(r.total).toBe(24)
  })
  it('uses a symmetric yoni table with 4 on the diagonal', () => {
    YONI_TABLE.forEach((row, i) => row.forEach((v, j) => expect(v).toBe(YONI_TABLE[j][i])))
    YONI_TABLE.forEach((row, i) => expect(row[i]).toBe(4))
  })
})

describe('muhurta (ch. XXVI)', () => {
  it('counts Taara from the birth star', () => {
    expect(taaraOf(0, 0)).toBe(1)
    expect(taaraOf(0, 2)).toBe(3)
    expect(taaraOf(5, 4)).toBe(9)
    expect(taaraOf(0, 9)).toBe(1)
  })
  it('groups tithis', () => {
    expect([0, 1, 2, 3, 4, 5, 13, 14, 29].map(tithiGroup)).toEqual(['Nanda', 'Bhadra', 'Jaya', 'Rikta', 'Poorna', 'Nanda', 'Rikta', 'Poorna', 'Poorna'])
  })
  it('produces checks for a real day, with Taara when a birth star is given', () => {
    const p = computePanchang('2024-01-22', 28.6139, 77.209, 'Asia/Kolkata')
    const ids = dayChecks(p, 3).map((c) => c.id)
    expect(ids).toContain('tithi-group')
    expect(ids).toContain('taara')
    expect(dayChecks(p).map((c) => c.id)).not.toContain('taara')
  })
})

describe('yoga rules corrected to the book', () => {
  it('never counts a dusthana lord in its own house as vipareeta', () => {
    for (let i = 0; i < 60; i++) {
      const c = delhi(`19${40 + (i % 50)}-0${1 + (i % 9)}-1${i % 10}`, `${String(i % 24).padStart(2, '0')}:20`)
      for (const y of evaluateYogas(c).filter((r) => ['harsha', 'sarala', 'vimala'].includes(r.def.id) && r.present)) {
        const own = { harsha: 6, sarala: 8, vimala: 12 }[y.def.id as 'harsha']
        expect(y.matches[0].basis[1]).not.toBe(`in the ${own}th house`)
      }
    }
  })
})
