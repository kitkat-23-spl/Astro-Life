import { describe, expect, it } from 'vitest'
import { computeChart } from '../../astro/ephemeris'
import { interpret } from '../engine'

const chart = computeChart({
  name: 'Einstein', date: '1879-03-14', time: '11:30', place: 'Ulm',
  latitude: 48.4, longitude: 10.0, timezone: 'UTC+0:40', houseSystem: 'placidus',
})
const reading = interpret(chart)

describe('interpret', () => {
  it('builds the Big Three headline', () => {
    expect(reading.headline).toBe('Pisces Sun · Sagittarius Moon · Cancer Rising')
    expect(reading.chartRuler).toBe('Moon')
  })
  it('detects the 10th-house stellium', () => {
    expect(reading.insights.some((i) => i.id === 'stellium-house-10')).toBe(true)
    expect(reading.insights.some((i) => i.id === 'stellium-sign-Aries')).toBe(true)
  })
  it('flags Mars exalted in Capricorn', () => {
    const mars = reading.insights.find((i) => i.id === 'placement-Mars')!
    expect(mars.rule).toContain('exaltation')
  })
  it('every insight explains its rule', () => {
    for (const i of reading.insights) {
      expect(i.rule.length).toBeGreaterThan(3)
      expect(i.body.length).toBeGreaterThan(0)
    }
  })
  it('element percentages sum to ~100', () => {
    const sum = Object.values(reading.elements.percent).reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(2)
  })
})
