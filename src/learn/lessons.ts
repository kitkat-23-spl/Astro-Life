import { ADVANCED } from './advanced'
import { BEGINNER } from './beginner'
import { INTERMEDIATE } from './intermediate'
import type { Lesson, Level } from './types'

export const LESSONS: Lesson[] = [...BEGINNER, ...INTERMEDIATE, ...ADVANCED]
export const LEVELS: Level[] = ['Beginner', 'Intermediate', 'Advanced']

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
