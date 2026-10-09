import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { AreaSummary, ConditionCount, Effect, DashaHighlight, RuleGroup, VargaVerdict } from '../../vedic/rules'
import { REPORTS } from '../../vedic/reports'
import type { TransitWindow } from '../../vedic/transits'
import { yogaTone, type YogaResult } from '../../vedic/yogas'
import Basis from '../Basis'
import ToneBoard, { type BoardItem } from '../ToneBoard'
import { fmtRange } from './format'
import { TONE_LABEL } from '../InsightCard'


const EFFECT_LABEL = { supportive: 'Supportive', challenging: 'Needs care', mixed: 'Mixed', info: 'Note' } as const
const EFFECT_PILL = { supportive: 'good', challenging: 'challenge', mixed: 'mixed', info: 'info' } as const

interface NavItem { label: string; path: string; tab?: string }
interface NavGroup { label: string; items: NavItem[] }

/** Chart sections, grouped so a reader sees four choices first and the detail only when needed. */
const CHART_GROUPS: NavGroup[] = [
  { label: 'Summary', items: [{ label: 'Overview', path: '/chart' }] },
  { label: 'Life areas', items: REPORTS.map((r) => ({ label: r.title, path: `/chart/${r.key}` })) },
  { label: 'Timing', items: [{ label: 'Dasha periods', path: '/chart', tab: 'dasha' }, { label: 'Transits now', path: '/chart', tab: 'transits' }, { label: 'Year ahead', path: '/chart/annual' }] },
  {
    label: 'Chart details',
    items: [
      { label: 'Planets', path: '/chart', tab: 'planets' }, { label: 'Houses', path: '/chart', tab: 'houses' }, { label: 'Yogas', path: '/chart', tab: 'yogas' },
      { label: 'Divisional charts', path: '/chart', tab: 'vargas' }, { label: 'Ashtakavarga', path: '/chart', tab: 'ashtakavarga' }, { label: 'Special points', path: '/chart', tab: 'special' },
    ],
  },
]

/** One navigation for every chart page: four groups, with the active group's sections underneath. Keeps the chart in the URL. */
export function ChartNav({ hash }: { hash: string }) {
  const { pathname, search } = useLocation()
  const tab = new URLSearchParams(search).get('tab')
  const isActive = (i: NavItem) => i.path === pathname && (i.tab ?? null) === (i.path === '/chart' ? tab : null)
  const current = CHART_GROUPS.find((g) => g.items.some(isActive)) ?? CHART_GROUPS[0]
  const to = (i: NavItem) => ({ pathname: i.path, search: i.tab ? `?tab=${i.tab}` : '', hash })
  return (
    <nav className="chart-nav" aria-label="Chart sections">
      <div className="chart-nav-groups">
        {CHART_GROUPS.map((g) => (
          <Link key={g.label} to={to(g.items[0])} className={g === current ? 'active' : ''} aria-current={g === current ? 'true' : undefined}>{g.label}</Link>
        ))}
      </div>
      {current.items.length > 1 && (
        <div className="chart-nav-items">
          {current.items.map((i) => (
            <Link key={i.label} to={to(i)} className={isActive(i) ? 'active' : ''} aria-current={isActive(i) ? 'page' : undefined}>{i.label}</Link>
          ))}
        </div>
      )}
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

/** Coloured label for a rule effect or a summary lean. */
export function EffectPill({ effect, label, className = '' }: { effect: Effect; label?: string; className?: string }) {
  return <span className={`pill pill-${EFFECT_PILL[effect]} ${className}`.trim()}>{label ?? EFFECT_LABEL[effect]}</span>
}

/** The overall lean of a report, its strongest supporting factors and its main caution. */
export function AreaVerdict({ s, compact }: { s: AreaSummary; compact?: boolean }) {
  const c = s.conditions
  return (
    <div className={`area-verdict-box ${compact ? 'compact' : ''}`}>
      <EffectPill effect={s.leaning} label={s.label} className="lean" />
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
  const all = groups.flatMap((g) => g.results.map((r) => ({ r, group: g.title })))
  const fired = all.filter(({ r }) => r.fired).sort((a, b) => Math.abs(b.r.weight) - Math.abs(a.r.weight))
  const unmet = all.filter(({ r }) => !r.fired)
  const items: BoardItem[] = fired.map(({ r, group }) => ({
    id: r.id,
    tone: r.effect === 'supportive' ? 'good' : r.effect === 'challenging' ? 'challenge' : 'mixed',
    node: (
      <article className={`insight card rule-card tone-${EFFECT_PILL[r.effect]}`}>
        <p className="card-eyebrow">{group}</p>
        <header className="insight-head">
          <h4>{r.title}</h4>
          {r.effect === 'info' && <span className="pill pill-info">Note</span>}
        </header>
        <div className="insight-body">{r.detail.map((d, i) => <p key={i}>{d}</p>)}</div>
        <Basis items={[r.chart, r.rule.replace(/\s*\([^)]*\)/g, '')]} />
      </article>
    ),
  }))
  return (
    <div className="rule-groups">
      <div className="rule-toolbar">
        <p className="muted small">{fired.length} of {all.length} rules apply to this chart, strongest first in each column</p>
        <label className="check small">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show rules that do not apply
        </label>
      </div>
      <ToneBoard items={items} />
      {showAll && unmet.length > 0 && (
        <section className="unmet-block">
          <h3 className="sub-h">Rules that do not apply ({unmet.length})</h3>
          <ul className="unmet-list small">
            {unmet.map(({ r, group }) => <li key={r.id}><strong>{r.title}</strong> <span className="muted">· {group} · requires {r.rule.replace(/\s*\([^)]*\)/g, '')}</span></li>)}
          </ul>
        </section>
      )}
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

export function YogaCard({ y, eyebrow }: { y: YogaResult; eyebrow?: ReactNode }) {
  const tone = y.present ? yogaTone(y) : null
  return (
    <article className={`insight card yoga-card ${tone ? `tone-${tone}` : 'not-fired'}`}>
      {eyebrow && <p className="card-eyebrow">{eyebrow}</p>}
      <header className="insight-head">
        <h3>{y.def.name}</h3>
        {tone ? <span className={`pill pill-${tone}`}>{TONE_LABEL[tone]}</span> : <span className="pill">{y.supersededBy ? 'Overridden' : y.checked ? 'Not present' : 'Needs birth time'}</span>}
      </header>
      {y.present && <p className="insight-body">{y.def.result}</p>}
      {y.supersededBy && <p className="small muted">Formed, but {y.supersededBy} takes precedence when Nabhasa yogas overlap (Charak XX).</p>}
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
