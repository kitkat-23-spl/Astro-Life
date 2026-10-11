import type { Graha } from '../vedic/constants'
import type { ExampleSpec } from './exampleChart'

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
  /** A teaching chart drawn in the reader's chart style; highlighted planets stand out. */
  | { type: 'chart'; title: string; spec: ExampleSpec; highlight?: Graha[]; caption?: string[] }
  /** One yoga: its classical meaning and rule from the engine, an example chart the engine checks live, and a walkthrough. */
  | { type: 'yoga'; id: string; spec: ExampleSpec; highlight: Graha[]; why: string[]; weak?: string; overridden?: boolean }
  /** Classical indications in our own words; each text starts with a tone marker (+, ~ or -). */
  | { type: 'classical'; title: string; rows: [string, string][]; source: string }

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
