import { Link } from 'react-router-dom'
import { LESSONS, LEVELS, completedLessons } from '../learn/lessons'

const LEVEL_BLURB = {
  Beginner: 'The building blocks: what a chart is, the signs, elements, planets and your Big Three.',
  Intermediate: 'Houses, angles, aspects and rulerships, plus a formula for reading any placement.',
  Advanced: 'Aspect patterns, the nodes, the maths of chart calculation, timing, and whole-chart synthesis.',
}

export default function LearnPage() {
  const done = completedLessons()
  const total = LESSONS.length
  const completed = LESSONS.filter((l) => done.has(l.slug)).length
  return (
    <div className="learn">
      <header className="page-head">
        <p className="eyebrow">Astrology school</p>
        <h1>Learn to read any birth chart</h1>
        <p className="lede">A structured path from zero to confident chart reader. Each lesson has worked examples, a short quiz and a prompt to explore your own chart.</p>
        <div className="progress" aria-label={`${completed} of ${total} lessons completed`}>
          <span className="progress-bar"><span style={{ width: `${(completed / total) * 100}%` }} /></span>
          <span className="small muted">{completed} / {total} completed</span>
        </div>
      </header>
      {LEVELS.map((level, li) => (
        <section key={level} className="level">
          <div className="level-head">
            <span className="level-num">{li + 1}</span>
            <div>
              <h2>{level}</h2>
              <p className="muted">{LEVEL_BLURB[level]}</p>
            </div>
          </div>
          <div className="lesson-grid">
            {LESSONS.filter((l) => l.level === level).map((l, i) => (
              <Link key={l.slug} to={`/learn/${l.slug}`} className={`card lesson-card ${done.has(l.slug) ? 'done' : ''}`}>
                <span className="lesson-idx">{li + 1}.{i + 1}</span>
                <h3>{l.title}</h3>
                <p>{l.summary}</p>
                <span className="small muted">{l.minutes} min read{done.has(l.slug) ? ' · ✓ Completed' : ''}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
