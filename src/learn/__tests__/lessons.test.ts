import { describe, expect, it } from 'vitest'
import { careerReport } from '../../vedic/career'
import { interpretVedic } from '../../vedic/interpret'
import { computeVedicChart } from '../../vedic/sidereal'
import { interpret } from '../../interpret/engine'
import { computeChart } from '../../astro/ephemeris'
import { LESSONS, VEDIC_COURSE, VEDIC_MODULES, lessonBySlug } from '../lessons'

const birth = { name: 'x', date: '1990-06-15', time: '10:30', place: 'Mumbai', latitude: 19.07, longitude: 72.88, timezone: 'Asia/Kolkata', houseSystem: 'placidus' as const }

describe('curriculum', () => {
  it('has a complete, ordered Jyotish course', () => {
    expect(VEDIC_COURSE).toHaveLength(19)
    expect(VEDIC_COURSE.every(Boolean)).toBe(true)
    for (const l of VEDIC_COURSE) expect(VEDIC_MODULES).toContain(l.module)
  })
  it('has unique slugs and valid quizzes', () => {
    expect(new Set(LESSONS.map((l) => l.slug)).size).toBe(LESSONS.length)
    for (const l of LESSONS) for (const q of l.quiz) expect(q.answer).toBeLessThan(q.options.length)
  })
  it('every insight links to an existing lesson', () => {
    const v = interpretVedic(computeVedicChart(birth))
    const w = interpret(computeChart(birth))
    const all = [...v.core, ...v.grahas, ...v.lords, ...v.dashaInsights, ...Object.values(v.vargas).flat(), ...w.insights]
    for (const i of all) if (i.lesson) expect(lessonBySlug(i.lesson), i.lesson).toBeDefined()
    expect(careerReport(computeVedicChart(birth))).not.toBeNull()
  })
})
