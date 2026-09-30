import { useMemo, useState } from 'react'
import {
  ELEMENT_COLORS, PLANET_GLYPHS, SIGNS, formatDegree, ordinal, signOf,
  type Element, type Modality, type PointName, type SignName,
} from '../astro/constants'
import type { Chart } from '../astro/ephemeris'
import { HOUSE_SYSTEM_LABELS } from '../astro/houses'
import { interpret, type Insight, type Reading } from '../interpret/engine'
import { HOUSE_TEXT } from '../interpret/houses'
import { SIGN_TEXT } from '../interpret/signs'
import ChartWheel from './ChartWheel'
import InsightCard from './InsightCard'

type Tab = 'overview' | 'placements' | 'aspects' | 'patterns'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'placements', label: 'Placements' },
  { id: 'aspects', label: 'Aspects' },
  { id: 'patterns', label: 'Patterns & Path' },
]

const SIGN_INFO = Object.fromEntries(SIGNS.map((s) => [s.name, s])) as Record<SignName, (typeof SIGNS)[number]>

export default function ChartView({ chart, actions }: { chart: Chart; actions?: React.ReactNode }) {
  const reading = useMemo(() => interpret(chart), [chart])
  const [tab, setTab] = useState<Tab>('overview')
  const [selected, setSelected] = useState<PointName | null>(null)

  const selectPoint = (p: PointName | null) => {
    setSelected(p)
    if (p) {
      setTab('placements')
      requestAnimationFrame(() => document.getElementById(`placement-${p}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    }
  }

  const b = chart.birth
  const birthLine = `${new Date(b.date + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}${b.time ? ` · ${b.time}` : ' · time unknown'} · ${b.place}`

  return (
    <div className="chart-view">
      <section className="chart-hero">
        <div className="chart-hero-text">
          <p className="eyebrow">{b.name ? `${b.name}’s birth chart` : 'Birth chart'}</p>
          <h1>{reading.headline}</h1>
          <p className="muted">{birthLine}</p>
          <p className="lede">{essence(reading)}</p>
          <BigThree reading={reading} />
          {actions && <div className="chart-actions">{actions}</div>}
          {!chart.timeKnown && (
            <p className="callout note small">Without a birth time, the rising sign, houses and angles can’t be calculated. Planet signs are shown for noon local time.</p>
          )}
          {chart.houseFallback && (
            <p className="callout warn small">Placidus houses are undefined at this latitude, so Whole Sign houses are shown instead.</p>
          )}
        </div>
        <ChartWheel chart={chart} selected={selected} onSelect={selectPoint} />
      </section>

      <nav className="tabs" role="tablist" aria-label="Chart sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tab-panel">
        {tab === 'overview' && <Overview reading={reading} />}
        {tab === 'placements' && <Placements chart={chart} reading={reading} selected={selected} />}
        {tab === 'aspects' && <Aspects chart={chart} reading={reading} />}
        {tab === 'patterns' && <Patterns reading={reading} />}
      </section>
      <p className="muted small center disclaimer">
        Astrology is a symbolic language for self-reflection, not a science. Use these insights to reflect, not as a basis for medical, legal or financial decisions.
      </p>
    </div>
  )
}

function essence(r: Reading) {
  const sun = SIGN_TEXT[r.bigThree.sun.sign].keywords
  const moon = SIGN_TEXT[r.bigThree.moon.sign].keywords
  const rising = r.bigThree.rising ? SIGN_TEXT[r.bigThree.rising].keywords : null
  return `A soul built for ${sun[0]} and ${sun[1]}, with a heart that needs ${moon[0]}${rising ? `, meeting the world with ${rising[0]}` : ''}.`
}

function BigThree({ reading }: { reading: Reading }) {
  const items: { label: string; sign: SignName | null; glyph: string }[] = [
    { label: 'Sun', sign: reading.bigThree.sun.sign, glyph: '☉' },
    { label: 'Moon', sign: reading.bigThree.moon.sign, glyph: '☽' },
    { label: 'Rising', sign: reading.bigThree.rising, glyph: 'AC' },
  ]
  return (
    <div className="big-three">
      {items.map((i) => (
        <div key={i.label} className="b3" style={i.sign ? { ['--el' as string]: ELEMENT_COLORS[SIGN_INFO[i.sign].element] } : undefined}>
          <span className="b3-glyph" aria-hidden>{i.sign ? SIGN_INFO[i.sign].glyph : '?'}</span>
          <span className="b3-label">{i.glyph} {i.label}</span>
          <span className="b3-sign">{i.sign ?? 'Unknown'}</span>
        </div>
      ))}
    </div>
  )
}

function Bars<K extends string>({ title, data, colors }: { title: string; data: Record<K, number>; colors?: Record<K, string> }) {
  return (
    <div className="bars">
      <h3>{title}</h3>
      {(Object.keys(data) as K[]).map((k) => (
        <div key={k} className="bar-row">
          <span className="bar-label">{k}</span>
          <span className="bar-track"><span className="bar-fill" style={{ width: `${data[k]}%`, background: colors?.[k] ?? 'var(--accent)' }} /></span>
          <span className="bar-val">{data[k]}%</span>
        </div>
      ))}
    </div>
  )
}

function Overview({ reading }: { reading: Reading }) {
  const core = reading.insights.filter((i) => i.category === 'core')
  const top = reading.insights.filter((i) => i.category !== 'core').slice(0, 3)
  return (
    <div className="overview">
      <div className="grid-3">
        <div className="card">
          <Bars<Element> title="Elements" data={reading.elements.percent} colors={ELEMENT_COLORS} />
        </div>
        <div className="card">
          <Bars<Modality> title="Modalities" data={reading.modalities.percent} />
        </div>
        <div className="card traits">
          <h3>Your trait profile</h3>
          {reading.traits.map((t) => (
            <div key={t.label} className="trait" title={t.description}>
              <span>{t.label}</span>
              <meter min={0} max={100} value={t.value} aria-label={`${t.label}: ${t.value} of 100`} />
            </div>
          ))}
          <p className="muted small">Derived from your element, modality and aspect balance.</p>
        </div>
      </div>
      <h2 className="section-title">The core of you</h2>
      <div className="insight-grid">{core.map((i) => <InsightCard key={i.id} insight={i} />)}</div>
      <h2 className="section-title">What stands out most</h2>
      <div className="insight-grid">{top.map((i) => <InsightCard key={i.id} insight={i} />)}</div>
    </div>
  )
}

function Placements({ chart, reading, selected }: { chart: Chart; reading: Reading; selected: PointName | null }) {
  const cards = reading.insights.filter((i) => i.category === 'placement')
  const order: PointName[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Midheaven']
  cards.sort((a, b) => order.indexOf(a.point!) - order.indexOf(b.point!))
  return (
    <div>
      <div className="card table-wrap">
        <table className="data-table">
          <caption className="sr-only">Planet positions</caption>
          <thead>
            <tr><th>Planet</th><th>Sign</th><th>Degree</th>{chart.cusps && <th>House</th>}<th>Notes</th></tr>
          </thead>
          <tbody>
            {chart.placements.map((p) => (
              <tr key={p.name} className={selected === p.name ? 'selected' : ''}>
                <td><span className="glyph">{PLANET_GLYPHS[p.name]}</span> {p.name}</td>
                <td>{SIGN_INFO[p.sign].glyph} {p.sign}</td>
                <td className="num">{formatDegree(p.longitude)}</td>
                {chart.cusps && <td>{p.house ? `${ordinal(p.house)} · ${HOUSE_TEXT[p.house - 1].title}` : ''}</td>}
                <td className="muted">{[p.retrograde && 'Retrograde ℞', p.dignity && capital(p.dignity)].filter(Boolean).join(', ')}</td>
              </tr>
            ))}
            {chart.ascendant !== null && (
              <>
                <tr><td><span className="glyph">AC</span> Ascendant</td><td>{signOf(chart.ascendant).glyph} {signOf(chart.ascendant).name}</td><td className="num">{formatDegree(chart.ascendant)}</td><td>1st cusp</td><td /></tr>
                <tr><td><span className="glyph">MC</span> Midheaven</td><td>{signOf(chart.midheaven!).glyph} {signOf(chart.midheaven!).name}</td><td className="num">{formatDegree(chart.midheaven!)}</td><td /><td /></tr>
              </>
            )}
          </tbody>
        </table>
        {chart.houseSystemUsed && <p className="muted small">House system: {HOUSE_SYSTEM_LABELS[chart.houseSystemUsed]} · Tropical zodiac · Mean node</p>}
      </div>
      <div className="insight-list">{cards.map((i) => <InsightCard key={i.id} insight={i} highlight={i.point === selected} />)}</div>
    </div>
  )
}

function Aspects({ chart, reading }: { chart: Chart; reading: Reading }) {
  const [filter, setFilter] = useState<'all' | 'flow' | 'tension' | 'blend'>('all')
  const cards = reading.insights
    .filter((i) => i.category === 'aspect')
    .filter((i) => {
      if (filter === 'all') return true
      const a = chart.aspects.find((x) => `aspect-${x.a}-${x.b}` === i.id)
      return a?.type.nature === filter
    })
  return (
    <div>
      <div className="chip-row" role="group" aria-label="Filter aspects">
        {(['all', 'blend', 'flow', 'tension'] as const).map((f) => (
          <button key={f} className={`chip ${filter === f ? 'active' : ''}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {{ all: 'All', blend: 'Conjunctions', flow: 'Harmonious', tension: 'Challenging' }[f]}
          </button>
        ))}
      </div>
      <p className="muted small">Sorted by strength: tighter orbs and more personal planets come first.</p>
      <div className="insight-list">
        {cards.sort((a, b) => b.weight - a.weight).map((i) => <InsightCard key={i.id} insight={i} />)}
        {cards.length === 0 && <p className="muted">No aspects of this type in your chart.</p>}
      </div>
    </div>
  )
}

function Patterns({ reading }: { reading: Reading }) {
  const groups: { title: string; items: Insight[] }[] = [
    { title: 'Life direction', items: reading.insights.filter((i) => i.category === 'direction') },
    { title: 'Chart patterns', items: reading.insights.filter((i) => i.category === 'pattern') },
    { title: 'Balance & emphasis', items: reading.insights.filter((i) => i.category === 'balance') },
  ]
  return (
    <div>
      {groups.map((g) => (
        <div key={g.title}>
          <h2 className="section-title">{g.title}</h2>
          {g.items.length ? (
            <div className="insight-list">{g.items.map((i) => <InsightCard key={i.id} insight={i} />)}</div>
          ) : (
            <p className="muted">No major patterns: your chart’s energy is spread evenly rather than concentrated in one configuration.</p>
          )}
        </div>
      ))}
    </div>
  )
}

function capital(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
