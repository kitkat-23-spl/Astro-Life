import { Link } from 'react-router-dom'
import type { Insight } from '../interpret/engine'
import { lessonBySlug } from '../learn/lessons'

export default function InsightCard({ insight, highlight }: { insight: Insight; highlight?: boolean }) {
  const lesson = insight.lesson ? lessonBySlug(insight.lesson) : undefined
  return (
    <article className={`insight card ${highlight ? 'highlight' : ''}`} id={insight.id}>
      <header>
        <h3>{insight.title}</h3>
        {insight.subtitle && <p className="insight-sub">{insight.subtitle}</p>}
      </header>
      {insight.body.map((b, i) => <p key={i}>{b}</p>)}
      <footer className="insight-foot">
        <details>
          <summary>Why am I seeing this?</summary>
          <p className="small">
            <strong>Rule:</strong> {insight.rule}. Every statement on Astro Life comes from a published rule like this one,
            applied to your calculated chart, with no guesswork or hidden AI.
          </p>
        </details>
        {lesson && <Link className="small" to={`/learn/${lesson.slug}`}>Learn: {lesson.title} →</Link>}
      </footer>
    </article>
  )
}
