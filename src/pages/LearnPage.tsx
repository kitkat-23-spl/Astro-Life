import { Link } from 'react-router-dom'
import { LESSONS, VEDIC_COURSE, VEDIC_MODULES, WESTERN_LEVELS, completedLessons } from '../learn/lessons'
import type { Lesson } from '../learn/types'

const MODULE_BLURB: Record<string, string> = {
  Foundations: 'What Jyotish is, the sidereal zodiac, the 12 rashis, the 12 bhavas and the 27 nakshatras.',
  'The planets': 'The nine grahas in depth, how to judge their strength, and what each gives in every house.',
  'Planetary relationships': 'Drishti (aspects), conjunctions, house lordship, functional benefics and malefics, and yogas.',
  'Divisional charts & timing': 'D1–D10 vargas, Vimshottari dasha and transits (gochara), including Sade Sati and double transit.',
  'Applied Jyotish': 'Career, marriage, kundali matching and full-chart synthesis, with real-life examples.',
}
const WESTERN_BLURB: Record<string, string> = {
  Beginner: 'Tropical zodiac basics: signs, elements, planets and your Big Three.',
  Intermediate: 'Houses, angles, aspects and rulerships, plus a formula for reading any placement.',
  Advanced: 'Aspect patterns, the nodes, the maths of chart calculation, timing, and whole-chart synthesis.',
}

export default function LearnPage() {
  const done = completedLessons()
  const total = LESSONS.length
  const completed = LESSONS.filter((l) => done.has(l.slug)).length
  const vedicDone = VEDIC_COURSE.filter((l) => done.has(l.slug)).length
  return (
    <div className="learn">
      <header className="page-head night">
        <h1>Learn Jyotish from the ground up</h1>
        <p className="lede">From signs and houses to yogas, dashas and transits, with worked examples from real charts.</p>
        <div className="progress" aria-label={`${completed} of ${total} lessons completed`}>
          <span className="progress-bar"><span style={{ width: `${(completed / total) * 100}%` }} /></span>
          <span className="small muted">{completed} / {total} completed</span>
        </div>
      </header>

      <section className="track">
        <div className="track-head">
          <h2>Jyotish (Vedic astrology) course</h2>
          <span className="muted small">{vedicDone} / {VEDIC_COURSE.length} lessons</span>
        </div>
        {VEDIC_MODULES.map((m, mi) => (
          <Module key={m} index={mi + 1} title={m} blurb={MODULE_BLURB[m]} lessons={VEDIC_COURSE.filter((l) => l.module === m)} done={done} startIndex={VEDIC_COURSE.findIndex((l) => l.module === m)} />
        ))}
      </section>

      <section className="track">
        <div className="track-head">
          <h2>Western astrology</h2>
          <span className="muted small">Tropical zodiac, for comparison and the Western chart view</span>
        </div>
        {WESTERN_LEVELS.map((lv, i) => (
          <Module key={lv} index={i + 1} title={lv} blurb={WESTERN_BLURB[lv]} lessons={LESSONS.filter((l) => l.level === lv)} done={done} startIndex={0} western />
        ))}
      </section>
    </div>
  )
}

function Module({ index, title, blurb, lessons, done, startIndex, western }: { index: number; title: string; blurb: string; lessons: Lesson[]; done: Set<string>; startIndex: number; western?: boolean }) {
  return (
    <section className="level">
      <div className="level-head">
        <span className={`level-num ${western ? 'alt' : ''}`}>{index}</span>
        <div>
          <h3 className="module-title">{title}</h3>
          <p className="muted">{blurb}</p>
        </div>
      </div>
      <div className="lesson-grid">
        {lessons.map((l, i) => (
          <Link key={l.slug} to={`/learn/${l.slug}`} className={`card lesson-card ${done.has(l.slug) ? 'done' : ''}`}>
            <span className="lesson-idx">{western ? `${index}.${i + 1}` : `Lesson ${startIndex + i + 1}`}</span>
            <h3>{l.title}</h3>
            <p>{l.summary}</p>
            <span className="small muted">{l.minutes} min read{done.has(l.slug) ? ' · Completed' : ''}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
