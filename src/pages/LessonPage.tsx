import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import RichText from '../components/RichText'
import { LESSONS, lessonBySlug, markLessonComplete } from '../learn/lessons'
import type { Block, QuizQuestion } from '../learn/types'
import NotFound from './NotFound'

export default function LessonPage() {
  const { slug } = useParams()
  const lesson = slug ? lessonBySlug(slug) : undefined
  if (!lesson) return <NotFound />
  const idx = LESSONS.indexOf(lesson)
  const prev = LESSONS[idx - 1]
  const next = LESSONS[idx + 1]

  return (
    <article className="lesson" key={lesson.slug}>
      <nav className="crumbs small" aria-label="Breadcrumb">
        <Link to="/learn">Learn</Link> / <span>{lesson.level}</span>
      </nav>
      <header>
        <p className="eyebrow">{lesson.level} · {lesson.minutes} min</p>
        <h1>{lesson.title}</h1>
        <p className="lede">{lesson.summary}</p>
      </header>
      {lesson.blocks.map((b, i) => <BlockView key={i} block={b} />)}
      {lesson.quiz.length > 0 && <Quiz questions={lesson.quiz} onPass={() => markLessonComplete(lesson.slug)} />}
      <nav className="lesson-nav">
        {prev ? <Link to={`/learn/${prev.slug}`} className="btn ghost">← {prev.title}</Link> : <span />}
        {next ? <Link to={`/learn/${next.slug}`} className="btn primary">{next.title} →</Link> : <Link to="/chart" className="btn primary">Read your chart →</Link>}
      </nav>
    </article>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'h':
      return <h2>{block.text}</h2>
    case 'p':
      return <p><RichText text={block.text} /></p>
    case 'list': {
      // Items written as "1. …" render as a real ordered list.
      const ordered = block.items.every((t) => /^\d+\.\s/.test(t))
      const items = block.items.map((t, i) => <li key={i}><RichText text={ordered ? t.replace(/^\d+\.\s/, '') : t} /></li>)
      return ordered ? <ol className="lesson-list">{items}</ol> : <ul className="lesson-list">{items}</ul>
    }
    case 'table':
      return (
        <div className="table-wrap card">
          <table className="data-table">
            <thead><tr>{block.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{block.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )
    case 'example':
      return (
        <section className="example card">
          <h3>{block.title}</h3>
          {block.text.map((t, i) => <p key={i}><RichText text={t} /></p>)}
        </section>
      )
    case 'callout':
      return <p className={`callout ${block.tone}`}><RichText text={block.text} /></p>
    case 'try':
      return (
        <p className="callout try">
          <strong>Try it:</strong> <RichText text={block.text} /> <Link to="/chart">Open my chart →</Link>
        </p>
      )
  }
}

function Quiz({ questions, onPass }: { questions: QuizQuestion[]; onPass: () => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(questions.map(() => null))
  const answered = answers.every((a) => a !== null)
  const correct = answers.filter((a, i) => a === questions[i].answer).length
  const passed = answered && correct === questions.length

  const pick = (qi: number, oi: number) => {
    if (answers[qi] !== null) return
    const nextAnswers = answers.map((a, i) => (i === qi ? oi : a))
    setAnswers(nextAnswers)
    if (nextAnswers.every((a, i) => a === questions[i].answer)) onPass()
  }

  return (
    <section className="quiz card" aria-labelledby="quiz-title">
      <h2 id="quiz-title">Check your understanding</h2>
      {questions.map((q, qi) => (
        <fieldset key={qi} className="quiz-q">
          <legend>{q.q}</legend>
          <div className="quiz-options">
            {q.options.map((o, oi) => {
              const chosen = answers[qi] === oi
              const state = answers[qi] === null ? '' : oi === q.answer ? 'right' : chosen ? 'wrong' : ''
              return (
                <button key={oi} type="button" className={`quiz-opt ${state}`} onClick={() => pick(qi, oi)} disabled={answers[qi] !== null} aria-pressed={chosen}>
                  {o}
                </button>
              )
            })}
          </div>
          {answers[qi] !== null && (
            <p className={`small ${answers[qi] === q.answer ? 'ok' : 'error'}`} role="status">
              {answers[qi] === q.answer ? 'Correct. ' : 'Not quite. '}{q.explain}
            </p>
          )}
        </fieldset>
      ))}
      {answered && (
        <div className="quiz-result">
          <p><strong>{correct} / {questions.length}</strong> {passed ? '· Lesson complete ✓' : '· Review the lesson and try again.'}</p>
          {!passed && <button className="btn ghost small" onClick={() => setAnswers(questions.map(() => null))}>Retry quiz</button>}
        </div>
      )}
    </section>
  )
}
