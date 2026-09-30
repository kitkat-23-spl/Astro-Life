import { useState } from 'react'
import type { RuleResult } from '../../vedic/rules'
import type { DashaHighlight } from '../../vedic/rules'
import type { TransitWindow } from '../../vedic/techniques'

export const fmtMonth = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

const EFFECT_LABEL = { supportive: 'Supportive', challenging: 'Challenging', mixed: 'Mixed', info: 'Context' } as const

export function ScoreDial({ value, label, caption, max = 100 }: { value: number; label: string; caption?: string; max?: number }) {
  const r = 52, c = 2 * Math.PI * r
  const pct = (value / max) * 100
  const tone = pct >= 65 ? 'var(--ok)' : pct >= 45 ? 'var(--gold)' : 'var(--err)'
  return (
    <figure className="dial" aria-label={`${label}: ${value} out of ${max}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="dial-track" />
        <circle cx="60" cy="60" r={r} className="dial-fill" stroke={tone} strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 60 60)" />
        <text x="60" y="58" textAnchor="middle" className="dial-num">{value}</text>
        <text x="60" y="78" textAnchor="middle" className="dial-of">/ {max}</text>
      </svg>
      <figcaption><strong>{label}</strong>{caption && <span className="muted small">{caption}</span>}</figcaption>
    </figure>
  )
}

export function RuleGroups({ groups }: { groups: { title: string; results: RuleResult[] }[] }) {
  const [showAll, setShowAll] = useState(false)
  const total = groups.reduce((s, g) => s + g.results.length, 0)
  const fired = groups.reduce((s, g) => s + g.results.filter((r) => r.fired).length, 0)
  return (
    <div className="rule-groups">
      <div className="rule-toolbar">
        <p className="muted small">{total} rules checked · {fired} apply to this chart</p>
        <label className="check small">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show rules that did not apply
        </label>
      </div>
      {groups.map((g) => (
        <section key={g.title} className="rule-group">
          <h3>{g.title}</h3>
          <div className="insight-list">
            {g.results.filter((r) => showAll || r.fired).map((r) => (
              <article key={r.id} className={`insight card rule-card ${r.fired ? `tone-${r.effect}` : 'not-fired'}`}>
                <header className="rule-head">
                  <h4>{r.fired ? '' : '✗ '}{r.title}</h4>
                  <span className="rule-tags">
                    <span className="tag">{r.chart}</span>
                    {r.fired && <span className={`tag effect-${r.effect}`}>{EFFECT_LABEL[r.effect]}</span>}
                    {!r.fired && <span className="tag">Not present</span>}
                  </span>
                </header>
                {r.fired && r.detail.map((d, i) => <p key={i}>{d}</p>)}
                <p className="rule-line small"><strong>Rule:</strong> {r.rule}</p>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function VargaVerdicts({ items }: { items: { code: string; name: string; focus: string; verdict: 'strong' | 'moderate' | 'weak'; detail: string }[] }) {
  return (
    <div className="varga-verdicts">
      {items.map((v) => (
        <div key={v.code} className={`card vv vv-${v.verdict}`}>
          <div className="vv-head"><strong>{v.code}</strong> <span className="muted small">{v.name}</span></div>
          <p className="small muted">{v.focus}</p>
          <p className="vv-verdict">{v.verdict === 'strong' ? 'Strong' : v.verdict === 'moderate' ? 'Moderate' : 'Needs support'}</p>
          <p className="small">{v.detail}</p>
        </div>
      ))}
    </div>
  )
}

export function DashaTimeline({ items, empty }: { items: DashaHighlight[]; empty: string }) {
  if (!items.length) return <p className="muted">{empty}</p>
  const max = Math.max(...items.map((i) => i.score))
  return (
    <ol className="timing-list">
      {items.map((d) => (
        <li key={d.md + d.ad + d.start.getTime()} className={`card timing ${d.score >= max * 0.7 ? 'peak' : ''}`}>
          <div className="timing-head">
            <strong>{d.md}–{d.ad}</strong>
            <span className="muted small">{fmtMonth(d.start)} – {fmtMonth(d.end)}</span>
            <span className="timing-bar" aria-label={`Strength ${Math.round((d.score / max) * 100)}%`}><span style={{ width: `${(d.score / max) * 100}%` }} /></span>
          </div>
          <ul className="small muted">{d.why.map((w) => <li key={w}>{w}</li>)}</ul>
        </li>
      ))}
    </ol>
  )
}

export function TransitWindows({ items, house }: { items: TransitWindow[]; house: number }) {
  if (!items.length) return <p className="muted">No double-transit window over the {house}th house in this period.</p>
  return (
    <ul className="windows">
      {items.map((w) => (
        <li key={w.start.getTime()} className={`window ${w.strength}`}>
          <span className="window-dates">{fmtMonth(w.start)} – {fmtMonth(w.end)}</span>
          <span className="small">{w.dasha ? `Dasha ${w.dasha.md}–${w.dasha.ad}` : ''}</span>
          <span className={`tag ${w.strength === 'strong' ? 'effect-supportive' : ''}`}>{w.strength === 'strong' ? `Strong: dasha of ${w.dashaMatch.join(' & ')}` : 'Transit only'}</span>
        </li>
      ))}
    </ul>
  )
}
