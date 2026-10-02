import { Link } from 'react-router-dom'
import { lessonBySlug } from '../learn/lessons'
import Basis from './Basis'

export interface CardInsight {
  id: string
  title: string
  subtitle?: string
  body: string[]
  rule: string
  basis?: string[]
  lesson?: string
  tone?: 'good' | 'mixed' | 'challenge'
}

export const TONE_LABEL = { good: 'Strength', mixed: 'Mixed', challenge: 'Needs care' } as const

export default function InsightCard({ insight, highlight }: { insight: CardInsight; highlight?: boolean }) {
  const lesson = insight.lesson ? lessonBySlug(insight.lesson) : undefined
  return (
    <article className={`insight card ${highlight ? 'highlight' : ''} ${insight.tone ? `tone-${insight.tone}` : ''}`} id={insight.id}>
      <header className="insight-head">
        <h3>{insight.title}</h3>
        {insight.tone && <span className={`pill pill-${insight.tone}`}>{TONE_LABEL[insight.tone]}</span>}
      </header>
      {insight.subtitle && <p className="insight-sub">{insight.subtitle}</p>}
      <div className="insight-body">{insight.body.map((b, i) => <p key={i}>{b}</p>)}</div>
      <Basis items={insight.basis ?? insight.rule.split(' + ')} />
      {lesson && <Link className="learn-link" to={`/learn/${lesson.slug}`}>Learn more: {lesson.title} →</Link>}
    </article>
  )
}
