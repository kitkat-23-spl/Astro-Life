import { Link } from 'react-router-dom'
import { lessonBySlug } from '../learn/lessons'
import Basis from './Basis'
import Term from './Term'

export interface CardInsight {
  id: string
  title: string
  subtitle?: string
  body: string[]
  rule: string
  basis?: string[]
  lesson?: string
  tone?: 'good' | 'mixed' | 'challenge'
  classical?: { id: string; label: string; text: string; tone: 'good' | 'mixed' | 'challenge'; source: string }[]
}

export const TONE_LABEL = { good: 'Supportive', mixed: 'Mixed', challenge: 'Needs care' } as const

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
      {insight.classical && insight.classical.length > 0 && (
        <div className="classical">
          <p className="classical-head"><Term k="classical">From the classical texts</Term></p>
          <ul>
            {insight.classical.map((c) => (
              <li key={c.id} className={`cl-${c.tone}`}><span className="cl-label">{c.label}:</span> {c.text}</li>
            ))}
          </ul>
          <p className="classical-src">{[...new Set(insight.classical.map((c) => c.source))].join(' · ')}</p>
        </div>
      )}
      <Basis items={insight.basis ?? insight.rule.split(' + ')} />
      {lesson && <Link className="learn-link" to={`/learn/${lesson.slug}`}>Lesson: {lesson.title}</Link>}
    </article>
  )
}
