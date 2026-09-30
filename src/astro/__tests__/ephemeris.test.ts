import { describe, expect, it } from 'vitest'
import { computeChart } from '../ephemeris'
import { angDist, signOf } from '../constants'

// Albert Einstein, 14 Mar 1879 11:30 LMT, Ulm (48°24'N 10°00'E). LMT = UTC+0:40.
// Reference values (Astrodienst): Sun 23°30' Pisces, Moon 14°31' Sagittarius,
// Asc 11°38' Cancer, MC in Pisces with the Sun in the 10th house.
const einstein = computeChart({
  name: 'Einstein', date: '1879-03-14', time: '11:30', place: 'Ulm',
  latitude: 48.4, longitude: 10.0, timezone: 'UTC+0:40', houseSystem: 'placidus',
})

function lon(name: string) {
  return einstein.placements.find((p) => p.name === name)!.longitude
}

describe('computeChart', () => {
  it('places the Sun and Moon correctly', () => {
    expect(angDist(lon('Sun'), 353.5)).toBeLessThan(0.1)
    expect(angDist(lon('Moon'), 254.52)).toBeLessThan(0.3)
  })
  it('computes the angles', () => {
    expect(signOf(einstein.ascendant!).name).toBe('Cancer')
    expect(angDist(einstein.ascendant!, 101.63)).toBeLessThan(0.5)
    expect(signOf(einstein.midheaven!).name).toBe('Pisces')
    expect(einstein.placements[0].house).toBe(10)
  })
  it('produces 12 ordered Placidus cusps', () => {
    const c = einstein.cusps!
    expect(c).toHaveLength(12)
    expect(c[0]).toBeCloseTo(einstein.ascendant!, 5)
    expect(c[9]).toBeCloseTo(einstein.midheaven!, 5)
  })
  it('handles unknown birth time', () => {
    const c = computeChart({ ...einstein.birth, time: null })
    expect(c.ascendant).toBeNull()
    expect(c.placements.every((p) => p.house === null)).toBe(true)
  })
  it('falls back to whole sign at polar latitudes', () => {
    const c = computeChart({ ...einstein.birth, latitude: 78.2 })
    expect(c.cusps).toHaveLength(12)
  })
})
