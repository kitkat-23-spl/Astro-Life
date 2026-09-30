import { ADVANCED } from './advanced'
import { BEGINNER } from './beginner'
import { INTERMEDIATE } from './intermediate'
import { JYOTISH } from './jyotish'
import type { Lesson, Level } from './types'
import { VEDIC } from './vedic'

const VEDIC_ORDER = [
  'vedic-intro', 'vedic-rashis', 'vedic-bhavas', 'vedic-nakshatras',
  'vedic-grahas', 'vedic-strength', 'vedic-planets-in-houses',
  'vedic-drishti', 'vedic-conjunctions', 'vedic-grahas-bhavas', 'vedic-functional', 'vedic-yogas',
  'vedic-vargas', 'vedic-dashas', 'vedic-transits',
  'vedic-career', 'vedic-marriage', 'vedic-matching', 'vedic-synthesis',
]
const vedicPool = [...VEDIC, ...JYOTISH]
export const VEDIC_COURSE: Lesson[] = VEDIC_ORDER.map((slug) => vedicPool.find((l) => l.slug === slug)!)
export const VEDIC_MODULES = ['Foundations', 'The planets', 'Planetary relationships', 'Divisional charts & timing', 'Applied Jyotish']

/** Lesson order used for prev/next navigation: the Jyotish course first, then the Western track. */
export const LESSONS: Lesson[] = [...VEDIC_COURSE, ...BEGINNER, ...INTERMEDIATE, ...ADVANCED]
export const WESTERN_LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced']

export function lessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug)
}

const KEY = 'astrolife:completed-lessons'

export function completedLessons(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function markLessonComplete(slug: string) {
  try {
    const done = completedLessons()
    done.add(slug)
    localStorage.setItem(KEY, JSON.stringify([...done]))
  } catch {
    // Storage unavailable (private mode); progress simply isn't remembered.
  }
}
