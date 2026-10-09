import { describe, expect, it } from 'vitest'
import { CLASSICAL_SIZE, grahaLines, lordLines } from '../classical'
import { GRAHAS } from '../constants'
import { computeVedicChart } from '../sidereal'

const birth = { name: 'Test', date: '1990-06-15', time: '10:30', place: 'New Delhi', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata', houseSystem: 'whole-sign' as const }

describe('classical indications', () => {
  it('has complete tables', () => {
    expect(CLASSICAL_SIZE.lordInHouse).toBe(144)
    expect(CLASSICAL_SIZE.inHouse).toBe(108)
    expect(CLASSICAL_SIZE.inSign).toBe(84)
    expect(CLASSICAL_SIZE.aspects).toBe(6 * 7 * 6 + 12 * 6)
  })
  it('gives a line for every house lord and every planet', () => {
    const c = computeVedicChart(birth)
    for (let h = 1; h <= 12; h++) {
      const ls = lordLines(c, h)
      expect(ls[0].id).toMatch(/^L\d+-H\d+$/)
      expect(ls[0].text.length).toBeGreaterThan(10)
    }
    for (const g of GRAHAS) {
      const ls = grahaLines(c, g)
      expect(ls.some((l) => l.id.startsWith(`${g}-H`))).toBe(true)
      for (const l of ls) expect(l.text).not.toMatch(/^[+~-]/)
    }
  })
  it('needs a birth time for lords', () => {
    expect(lordLines(computeVedicChart({ ...birth, time: null }), 1)).toEqual([])
  })
})
