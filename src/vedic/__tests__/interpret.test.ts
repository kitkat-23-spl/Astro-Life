import { describe, expect, it } from 'vitest'
import { computeVedicChart } from '../sidereal'
import { interpretVedic } from '../interpret'

const chart = computeVedicChart({
  name: 'Einstein', date: '1879-03-14', time: '11:30', place: 'Ulm',
  latitude: 48.4, longitude: 10.0, timezone: 'UTC+0:40', houseSystem: 'placidus',
})
const r = interpretVedic(chart)

describe('interpretVedic', () => {
  it('finds classic yogas in Einstein’s chart', () => {
    const ids = r.yogas.filter((y) => y.present).map((y) => y.def.id)
    expect(ids).toContain('gajakesari') // Jupiter in Aquarius, 4th from Scorpio Moon
    expect(ids).toContain('budhaditya') // Sun and Mercury in Pisces
    expect(ids).toContain('dharma-karma') // Jupiter and Saturn exchange signs
    expect(ids).not.toContain('mp-ruchaka') // Mars is exalted but in the 8th, not a kendra
  })
  it('evaluates exactly one Nabhasa sankhya yoga', () => {
    expect(r.yogas.filter((y) => y.def.id.startsWith('sankhya-') && y.present)).toHaveLength(1)
    expect(r.yogas.length).toBeGreaterThanOrEqual(75)
  })
  it('flags the debilitated Scorpio Moon', () => {
    expect(r.grahas.find((g) => g.id === 'graha-Moon')!.rule).toContain('debilitated')
  })
  it('produces readings for all divisional charts and 12 house lords', () => {
    expect(r.lords).toHaveLength(12)
    for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]) expect(r.vargas[n].length).toBeGreaterThan(0)
  })
  it('every insight states its rule', () => {
    const all = [...r.core, ...r.grahas, ...r.lords, ...r.dashaInsights, ...Object.values(r.vargas).flat()]
    for (const i of all) expect(i.rule.length).toBeGreaterThan(5)
  })
  it('works without a birth time', () => {
    const c = computeVedicChart({ ...chart.birth, time: null })
    const rr = interpretVedic(c)
    expect(rr.lords).toHaveLength(0)
    expect(rr.yogas.find((y) => y.def.id === 'raja')!.checked).toBe(false)
    expect(rr.grahas).toHaveLength(9)
  })
})
