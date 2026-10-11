import { ADVANCED } from './advanced'
import { BEGINNER } from './beginner'
import { BOOK_LESSONS } from './bookLessons'
import { EXPANSIONS } from './expansions'
import { INTERMEDIATE } from './intermediate'
import { JYOTISH } from './jyotish'
import type { Lesson, Level } from './types'
import { VEDIC } from './vedic'
import { YOGA_LIBRARY_1 } from './yogaLibrary1'
import { YOGA_LIBRARY_2 } from './yogaLibrary2'

const VEDIC_ORDER = [
  'vedic-intro', 'vedic-rashis', 'vedic-bhavas', 'vedic-nakshatras',
  'vedic-grahas', 'vedic-strength', 'vedic-planets-in-houses',
  'vedic-drishti', 'vedic-conjunctions', 'vedic-grahas-bhavas', 'vedic-functional', 'vedic-yogas',
  'results-lords-1', 'results-lords-2', 'results-planets-houses', 'results-planets-signs',
  'yogas-how', 'yogas-mahapurusha', 'yogas-raja', 'yogas-vipareeta', 'yogas-dhana', 'yogas-sun-moon', 'yogas-special', 'yogas-doshas', 'yogas-nabhasa-1', 'yogas-nabhasa-2',
  'vedic-vargas', 'vedic-dashas', 'vedic-transits',
  'practice-gochara', 'practice-ashtakavarga', 'practice-varshaphal', 'practice-muhurta', 'practice-prashna', 'practice-health',
  'vedic-career', 'vedic-marriage', 'vedic-matching', 'practice-matching-tables', 'vedic-synthesis',
]
/** Adds a lesson's extra depth before its closing "try it" box, and its extra questions. */
function expand(l: Lesson): Lesson {
  const x = EXPANSIONS[l.slug]
  if (!x) return l
  const last = l.blocks[l.blocks.length - 1]
  const blocks = last?.type === 'try' ? [...l.blocks.slice(0, -1), ...x.blocks, last] : [...l.blocks, ...x.blocks]
  return { ...l, blocks, quiz: [...l.quiz, ...(x.quiz ?? [])], minutes: l.minutes + x.blocks.length }
}
const vedicPool = [...VEDIC, ...JYOTISH, ...BOOK_LESSONS, ...YOGA_LIBRARY_1, ...YOGA_LIBRARY_2].map(expand)
export const VEDIC_COURSE: Lesson[] = VEDIC_ORDER.map((slug) => vedicPool.find((l) => l.slug === slug)!)
export const VEDIC_MODULES = ['Foundations', 'The planets', 'Planetary relationships', 'Classical results', 'Yoga library', 'Divisional charts & timing', 'Timing and practice', 'Applied Jyotish']

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
