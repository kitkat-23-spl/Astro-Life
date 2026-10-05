import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { AreaSummary, ConditionCount, DashaHighlight, RuleGroup, VargaVerdict } from '../../vedic/rules'
import { REPORTS } from '../../vedic/reports'
import type { TransitWindow } from '../../vedic/transits'
import { yogaTone, type YogaResult } from '../../vedic/yogas'
import Basis from '../Basis'
import { fmtRange } from './format'
import { TONE_LABEL } from '../InsightCard'


const EFFECT_LABEL = { supportive: 'Supportive', challenging: 'Needs care', mixed: 'Mixed', info: 'Note' } as const
const EFFECT_PILL = { supportive: 'good', challenging: 'challenge', mixed: 'mixed', info: 'info' } as const

/** Navigation between the kundali overview and every life-area report, keeping the chart in the URL. */
export function ReportNav({ hash }: { hash: string }) {
  return (
    <nav className="report-nav" aria-label="Chart sections">
      <NavLink to={{ pathname: '/chart', hash }} end>Kundali</NavLink>
      <NavLink to={{ pathname: '/chart/annual', hash }}>Annual</NavLink>
      {REPORTS.map((r) => <NavLink key={r.key} to={{ pathname: `/chart/${r.key}`, hash }}>{r.title}</NavLink>)}
    </nav>
  )
}

export function ScoreDial({ value, label, caption, max = 100 }: { value: number; label: string; caption?: string; max?: number }) {
  const r = 52, c = 2 * Math.PI * r
  const pct = (value / max) * 100
  const tone = pct >= 60 ? 'var(--ok)' : pct >= 40 ? 'var(--gold)' : 'var(--err)'
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

/** Stacked bar of the conditions checked: supportive, mixed, challenging and not present. */
export function ConditionBar({ c }: { c: ConditionCount }) {
  const pct = (n: number) => `${(n / Math.max(1, c.checked)) * 100}%`
  return (
    <span className="cond-bar" aria-hidden="true">
      <span className="cond-good" style={{ width: pct(c.supportive) }} />
      <span className="cond-mixed" style={{ width: pct(c.mixed) }} />
      <span className="cond-bad" style={{ width: pct(c.challenging) }} />
    </span>
  )
}

const LEAN_PILL = { supportive: 'good', mixed: 'mixed', challenging: 'challenge' } as const

/** The overall lean of a report, its strongest supporting factors and its main caution. */
export function AreaVerdict({ s, compact }: { s: AreaSummary; compact?: boolean }) {
  const c = s.conditions
  return (
    <div className={`area-verdict-box ${compact ? 'compact' : ''}`}>
      <span className={`pill lean pill-${LEAN_PILL[s.leaning]}`}>{s.label}</span>
      {(s.strengths.length > 0 || s.cautions.length > 0) && (
        <ul className="factors">
          {s.strengths.map((t) => <li key={t} className="plus">{t}</li>)}
          {s.cautions.map((t) => <li key={t} className="minus">{t}</li>)}
        </ul>
      )}
      <ConditionBar c={c} />
      <span className="small muted">{compact ? `${c.supportive} supportive · ${c.challenging} challenging · ${c.checked} rules` : `${c.supportive} supportive, ${c.mixed} mixed and ${c.challenging} challenging, of ${c.checked} classical rules`}</span>
    </div>
  )
}

/** Plain explanation of what the counts are and are not. */
export function MethodNote() {
  return (
    <section className="card method-note">
      <h2>How to read this report</h2>
      <p className="small">Each line in this report is a rule from classical texts (Brihat Parashara Hora Shastra, Phaladeepika and the Jaimini Sutras), such as "the 10th lord is exalted" or "Jupiter aspects the 7th house". Every rule, including the ones that do not apply, is listed under All rules below.</p>
      <p className="small">The summary at the top reads the rules simply. It says <strong>mostly supportive</strong> when supportive rules outnumber challenging ones at least two to one, <strong>more challenging</strong> when challenging rules are as many or more, and <strong>mixed</strong> otherwise. The lines marked + and − are the rules with the largest effect on each side. The summary changes with the birth time and the calculation settings.</p>
      <p className="small">These are traditional indications. They have not been tested against real outcomes, and controlled studies of astrology have not found it to predict events. Use them for study and reflection, not for decisions.</p>
    </section>
  )
}

export function RuleGroups({ groups }: { groups: RuleGroup[] }) {
  const [showAll, setShowAll] = useState(false)
  const total = groups.reduce((s, g) => s + g.results.length, 0)
  const fired = groups.reduce((s, g) => s + g.results.filter((r) => r.fired).length, 0)
  return (
    <div className="rule-groups">
      <div className="rule-toolbar">
        <p className="muted small">{fired} of {total} rules apply to this chart</p>
        <label className="check small">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show rules that do not apply
        </label>
      </div>
      {groups.map((g) => (
        <section key={g.title} className="rule-group">
          <h3>{g.title}</h3>
          <div className="insight-list">
            {g.results.filter((r) => showAll || r.fired).map((r) => (
              <article key={r.id} className={`insight card rule-card ${r.fired ? `tone-${EFFECT_PILL[r.effect]}` : 'not-fired'}`}>
                <header className="insight-head">
                  <h4>{r.title}</h4>
                  {r.fired
                    ? <span className={`pill pill-${EFFECT_PILL[r.effect]}`}>{EFFECT_LABEL[r.effect]}</span>
                    : <span className="pill">Not present</span>}
                </header>
                {r.fired && <div className="insight-body">{r.detail.map((d, i) => <p key={i}>{d}</p>)}</div>}
                <Basis items={[r.chart, r.rule.replace(/\s*\([^)]*\)/g, '')]} label={r.fired ? 'Based on' : 'Requires'} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function VargaVerdicts({ items }: { items: VargaVerdict[] }) {
  return (
    <div className="varga-verdicts">
      {items.map((v) => (
        <div key={v.code + v.focus} className={`card vv vv-${v.verdict}`}>
          <div className="vv-head"><strong>{v.code}</strong> <span className="muted small">{v.name}</span></div>
          <p className="small muted">{v.focus}</p>
          <p className="vv-verdict">{v.verdict === 'strong' ? 'Strong' : v.verdict === 'moderate' ? 'Moderate' : 'Weak'}</p>
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
            <strong>{d.md} / {d.ad}</strong>
            <span className="muted small">{fmtRange(d.start, d.end)}</span>
            <span className="timing-bar" aria-label={`Strength ${Math.round((d.score / max) * 100)}%`}><span style={{ width: `${(d.score / max) * 100}%` }} /></span>
          </div>
          <ul className="small muted">{d.why.map((w) => <li key={w}>{w}</li>)}</ul>
        </li>
      ))}
    </ol>
  )
}

export function TransitWindows({ items, house }: { items: TransitWindow[]; house: number }) {
  if (!items.length) return <p className="muted">No double-transit window over house {house} in this period.</p>
  return (
    <ul className="windows">
      {items.map((w) => (
        <li key={w.start.getTime()} className={`window ${w.strength}`}>
          <span className="window-dates">{fmtRange(w.start, w.end)}</span>
          <span className="small">{w.dasha ? `Dasha ${w.dasha.md} / ${w.dasha.ad}` : ''}</span>
          <span className={`tag ${w.strength === 'strong' ? 'effect-supportive' : ''}`}>{w.strength === 'strong' ? `With dasha of ${w.dashaMatch.join(' and ')}` : 'Transit only'}</span>
        </li>
      ))}
    </ul>
  )
}

export function YogaCard({ y }: { y: YogaResult }) {
  const tone = y.present ? yogaTone(y) : null
  return (
    <article className={`insight card yoga-card ${tone ? `tone-${tone}` : 'not-fired'}`}>
      <header className="insight-head">
        <h3>{y.def.name}</h3>
        {tone ? <span className={`pill pill-${tone}`}>{TONE_LABEL[tone]}</span> : <span className="pill">{y.checked ? 'Not present' : 'Needs birth time'}</span>}
      </header>
      {y.present && <p className="insight-body">{y.def.result}</p>}
      {y.matches.map((m, i) => (
        <div key={i}>
          <Basis items={m.basis} />
          {m.note && <p className="small muted">{m.note}</p>}
        </div>
      ))}
      <p className="small muted yoga-def">{y.present ? 'Rule' : 'Requires'}: {y.def.definition} <span className="yoga-src">{y.def.source}</span></p>
    </article>
  )
}
