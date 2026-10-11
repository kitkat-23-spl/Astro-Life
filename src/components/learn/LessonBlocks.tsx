import { useMemo } from 'react'
import { exampleChart, type ExampleSpec } from '../../learn/exampleChart'
import { useSettings } from '../../lib/settings'
import { parseClassical } from '../../vedic/classical'
import { GRAHA_INFO, GRAHAS, type Graha } from '../../vedic/constants'
import { signName } from '../../vedic/sidereal'
import { YOGAS, evaluateYogas } from '../../vedic/yogas'
import { TONE_LABEL } from '../InsightCard'
import RichText from '../RichText'
import SquareChart, { type ChartItem } from '../vedic/SquareChart'

const GROUP_LABEL: Record<string, string> = { 'Pancha Mahapurusha': 'Mahapurusha', 'Doshas and afflictions': 'Dosha' }

/** A teaching chart in the reader's chart style. Highlighted planets are bold; the rest are dimmed. */
export function ExampleChart({ spec, highlight, title, subtitle }: { spec: ExampleSpec; highlight?: Graha[]; title: string; subtitle?: string }) {
  const { settings } = useSettings()
  const chart = exampleChart(spec)
  const items: ChartItem[] = [
    { sign: chart.lagnaSign!, label: 'Asc', title: `Lagna in ${signName(chart.lagnaSign!)}`, tone: 'asc' },
    ...GRAHAS.map((g): ChartItem => {
      const p = chart.grahas.find((x) => x.graha === g)!
      const d = p.dignity && p.dignity !== 'neutral' ? ` (${p.dignity})` : ''
      return {
        sign: p.sign,
        label: GRAHA_INFO[g].abbr,
        title: `${g} in ${signName(p.sign)}, house ${p.house}${d}`,
        tone: !highlight?.length ? undefined : highlight.includes(g) ? 'focus' : 'dim',
      }
    }),
  ]
  return <SquareChart style={settings.chartStyle} lagnaSign={chart.lagnaSign!} items={items} title={title} subtitle={subtitle} />
}

export function ChartBlock({ title, spec, highlight, caption }: { title: string; spec: ExampleSpec; highlight?: Graha[]; caption?: string[] }) {
  return (
    <section className="lesson-chart">
      <ExampleChart spec={spec} highlight={highlight} title="Example chart" subtitle={`${spec.lagna} lagna`} />
      <div className="lesson-chart-text">
        <h3>{title}</h3>
        {caption?.map((t, i) => <p key={i}><RichText text={t} /></p>)}
        {highlight && highlight.length > 0 && <p className="small muted">Highlighted: {highlight.join(', ')}. The other planets are shown faintly.</p>}
      </div>
    </section>
  )
}

/** One yoga with its definition from the engine and an example chart that the engine checks as the page loads. */
export function YogaBlock({ id, spec, highlight, why, weak }: { id: string; spec: ExampleSpec; highlight: Graha[]; why: string[]; weak?: string }) {
  const def = YOGAS.find((y) => y.id === id)
  const result = useMemo(() => evaluateYogas(exampleChart(spec)).find((r) => r.def.id === id), [spec, id])
  if (!def) return null
  const tone = def.tone
  // Show the combination the example is about: the match that names every highlighted planet.
  const match = result?.matches.find((m) => highlight.every((g) => m.basis.join(' ').includes(g))) ?? result?.matches[0]
  return (
    <article className={`card yoga-lesson insight tone-${tone}`} id={`yoga-${id}`}>
      <header>
        <h3>{def.name}</h3>
        <span className="yl-meta">
          <span className="pill">{GROUP_LABEL[def.group] ?? def.group}</span>
          <span className={`pill pill-${tone}`}>{TONE_LABEL[tone]}</span>
        </span>
      </header>
      <dl>
        <dt>Meaning</dt><dd>{def.result}</dd>
        <dt>Rule</dt><dd>{def.definition} <span className="muted small">({def.source})</span></dd>
      </dl>
      <section className="lesson-chart">
        <ExampleChart spec={spec} highlight={highlight} title="Example" subtitle={`${spec.lagna} lagna`} />
        <div className="lesson-chart-text">
          <h4>Why it forms here</h4>
          <ol className="lesson-list">{why.map((t, i) => <li key={i}><RichText text={t} /></li>)}</ol>
          {result && (
            <p className={`engine-check ${result.present ? '' : result.supersededBy ? 'over' : 'no'}`}>
              <strong>{result.present ? 'Checked by the Astro Life engine: formed.' : result.supersededBy ? `Checked by the engine: formed, but overridden by ${result.supersededBy}.` : 'Checked by the engine: not formed.'}</strong>
              {result.present && match && <><br />{match.basis.map((b) => <span key={b} className="basis-chip">{b}</span>)}</>}
              {result.present && match?.note && <><br /><span className="small">{match.note}</span></>}
              {result.present && match?.tone && match.tone !== tone && <><br />In this example it reads as {TONE_LABEL[match.tone].toLowerCase()}.</>}
            </p>
          )}
          {weak && <p className="small yl-weak"><strong>What weakens or cancels it:</strong> <RichText text={weak} /></p>}
        </div>
      </section>
    </article>
  )
}

export function ClassicalBlock({ title, rows, source }: { title: string; rows: [string, string][]; source: string }) {
  return (
    <section className="card classical-table">
      <h3>{title}</h3>
      <ul>
        {rows.map(([label, raw]) => {
          const { tone, text } = parseClassical(raw)
          return <li key={label} className={`cl-${tone}`}><span className="cl-label">{label}:</span> {text}</li>
        })}
      </ul>
      <p className="classical-src">{source}. Green is supportive, amber mixed, red needs care.</p>
    </section>
  )
}

/** Links to every yoga on the page. */
export function YogaContents({ ids }: { ids: string[] }) {
  return (
    <nav className="card toc" aria-label="Yogas in this lesson">
      <strong>In this lesson ({ids.length} yogas)</strong>
      <ol>{ids.map((id) => <li key={id}><a href={`#yoga-${id}`}>{YOGAS.find((y) => y.id === id)?.name ?? id}</a></li>)}</ol>
    </nav>
  )
}
