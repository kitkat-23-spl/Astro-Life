import { DateTime } from 'luxon'
import { describe, expect, it } from 'vitest'
import { computePanchang } from '../panchang'

describe('panchang', () => {
  // 22 January 2024, New Delhi (Ayodhya consecration day): Pausha Shukla Dwadashi, Mrigashira, Monday. Drik Panchang lists sunrise 07:13, Rahu Kaal 08:33-09:53.
  const p = computePanchang('2024-01-22', 28.6139, 77.209, 'Asia/Kolkata')
  it('matches published values', () => {
    expect(p.vara.name).toBe('Somavara')
    expect(p.tithi.name).toBe('Dwadashi')
    expect(p.tithi.paksha).toBe('Shukla')
    expect(p.nakshatra.name).toBe('Mrigashira')
    expect(p.masa.name).toBe('Pausha')
  })
  it('splits day and night into eight choghadiyas and 24 horas', () => {
    expect(p.choghadiya.day.map((c) => c.name)).toEqual(['Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit'])
    expect(p.choghadiya.night[0].name).toBe('Char')
    expect(p.horas).toHaveLength(24)
    expect(p.horas[0].lord).toBe('Moon')
    expect(p.horas[1].lord).toBe('Saturn')
  })
  it('places Rahu Kaal in the second eighth on Monday', () => {
    const len = (p.sunset.getTime() - p.sunrise.getTime()) / 8
    expect(Math.abs(p.periods.rahuKaal.start.getTime() - (p.sunrise.getTime() + len))).toBeLessThan(1000)
  })
})

describe('panchang timings', () => {
  const p = computePanchang('2024-01-22', 28.6139, 77.209, 'Asia/Kolkata')
  const t = (d: Date | null) => (d ? DateTime.fromJSDate(d).setZone('Asia/Kolkata').toFormat('HH:mm') : '-')
  it('matches published sunrise, end times and Rahu Kaal within two minutes', () => {
    const near = (a: string, b: string) => Math.abs(Number(a.slice(0, 2)) * 60 + Number(a.slice(3)) - Number(b.slice(0, 2)) * 60 - Number(b.slice(3))) <= 2
    expect(near(t(p.sunrise), '07:13')).toBe(true)
    expect(near(t(p.sunset), '17:51')).toBe(true)
    expect(near(t(p.tithi.ends), '19:51')).toBe(true)
    expect(near(t(p.yoga.ends), '08:47')).toBe(true)
    expect(near(t(p.periods.rahuKaal.start), '08:33')).toBe(true)
    expect(p.yoga.name).toBe('Brahma')
  })
})
