export type Level = 'Beginner' | 'Intermediate' | 'Advanced' | 'Vedic'

/** Lesson content is structured data (never raw HTML), rendered safely by React. */
export type Block =
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'example'; title: string; text: string[] }
  | { type: 'callout'; tone: 'tip' | 'note' | 'warn'; text: string }
  | { type: 'try'; text: string }

export interface QuizQuestion {
  q: string
  options: string[]
  answer: number
  explain: string
}

export interface Lesson {
  slug: string
  level: Level
  module?: string
  title: string
  summary: string
  minutes: number
  blocks: Block[]
  quiz: QuizQuestion[]
}
