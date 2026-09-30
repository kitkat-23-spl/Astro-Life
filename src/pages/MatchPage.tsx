import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { BirthData } from '../astro/ephemeris'
import BirthForm from '../components/BirthForm'
import { ScoreDial } from '../components/vedic/ReportParts'
import SquareChart from '../components/vedic/SquareChart'
import { itemsFor, lagnaFor, loadStyle } from '../components/vedic/chartItems'
import { decodeBirth, encodeBirth } from '../lib/share'
import { NAKSHATRAS, RASHI } from '../vedic/constants'
import { matchCharts, type Check } from '../vedic/matching'
import { computeVedicChart, signName, vargaChart, type VedicChart } from '../vedic/sidereal'

export default function MatchPage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const parsed = useMemo(() => {
    const [a, b] = hash.slice(1).split('.')
    const boy = a ? decodeBirth(a) : null, girl = b ? decodeBirth(b) : null
    return boy && girl ? { boy, girl } : null
  }, [hash])
  const [boy, setBoy] = useState<BirthData | null>(null)
  const [girl, setGirl] = useState<BirthData | null>(null)
  const [editing, setEditing] = useState(false)

  if (!parsed || editing) {
    const go = (b: BirthData | null, g: BirthData | null) => {
      if (b && g) { setEditing(false); navigate({ pathname: '/match', hash: `${encodeBirth(b)}.${encodeBirth(g)}` }) }
    }
    return (
      <div>
        <header className="page-head">
          <p className="eyebrow">Kundali matching</p>
          <h1>Compare two charts for marriage</h1>
          <p className="lede">Enter both partners’ birth details. We compute the 36-point Ashtakoota Guna Milan, the ten South Indian poruthams, Mangal dosha on both sides and chart-level harmony, all by classical rules.</p>
        </header>
        <div className="match-forms">
          <section>
            <h2>Boy / groom {boy && <span className="tag effect-supportive">✓ {boy.name || 'Saved'}</span>}</h2>
            <BirthForm key="boy" initial={boy ?? parsed?.boy} submitLabel={boy ? 'Update groom’s details' : 'Use these details'} compact onSubmit={(b) => { setBoy(b); go(b, girl) }} />
          </section>
          <section>
            <h2>Girl / bride {girl && <span className="tag effect-supportive">✓ {girl.name || 'Saved'}</span>}</h2>
            <BirthForm key="girl" initial={girl ?? parsed?.girl} submitLabel={girl ? 'Update bride’s details' : 'Use these details'} compact onSubmit={(g) => { setGirl(g); go(boy, g) }} />
          </section>
        </div>
        <p className="muted small center">The match opens automatically once both sets of details are entered. Everything is calculated in your browser.</p>
      </div>
    )
  }
  return <MatchResult boy={parsed.boy} girl={parsed.girl} onEdit={() => { setBoy(parsed.boy); setGirl(parsed.girl); setEditing(true) }} />
}

function MatchResult({ boy, girl, onEdit }: { boy: BirthData; girl: BirthData; onEdit: () => void }) {
  const bc = useMemo(() => computeVedicChart(boy), [boy])
  const gc = useMemo(() => computeVedicChart(girl), [girl])
  const r = useMemo(() => matchCharts(bc, gc), [bc, gc])
  const pct = Math.round((r.total / 36) * 100)
  const style = loadStyle()
  const bName = boy.name || 'Groom', gName = girl.name || 'Bride'

  return (
    <div className="report">
      <header className="report-head">
        <div>
          <p className="eyebrow">Kundali matching</p>
          <h1>{bName} &amp; {gName}</h1>
          <p className="lede">{r.verdict}: {r.total} of 36 gunas.</p>
          <ul className="summary-list">{r.summary.map((s) => <li key={s}>{s}</li>)}</ul>
          <div className="row">
            <button className="btn ghost small" onClick={onEdit}>Edit details</button>
            <button className="btn ghost small" onClick={() => navigator.clipboard?.writeText(window.location.href)}>Copy link</button>
          </div>
        </div>
        <ScoreDial value={r.total} max={36} label={`${pct}% compatibility`} caption="Ashtakoota Guna Milan" />
      </header>

      <div className="match-people">
        {[[bName, bc], [gName, gc]].map(([name, c]) => {
          const vc = c as VedicChart
          const moon = vc.grahas[1]
          const d1 = vargaChart(vc, 1)
          return (
            <div key={name as string} className="card person">
              <h3>{name as string}</h3>
              <p className="small muted">Moon: {RASHI[signName(moon.sign)]} · {NAKSHATRAS[moon.nakshatra].name} pada {moon.pada}{vc.lagnaSign !== null ? ` · Lagna ${RASHI[signName(vc.lagnaSign)]}` : ''}</p>
              <SquareChart style={style} lagnaSign={lagnaFor(d1).sign} lagnaIsMoon={lagnaFor(d1).moon} items={itemsFor(vc, d1)} title="D1 Rashi" compact />
            </div>
          )
        })}
      </div>

      <h2 className="section-title">Ashtakoota Guna Milan (36 points)</h2>
      <p className="small"><Link to="/learn/vedic-matching">How kundali matching works →</Link></p>
      <div className="card table-wrap">
        <table className="data-table koota-table">
          <thead><tr><th>Koota</th><th>Checks</th><th>{bName}</th><th>{gName}</th><th>Score</th></tr></thead>
          <tbody>
            {r.kootas.map((k) => (
              <tr key={k.name}>
                <td><strong>{k.name}</strong></td>
                <td className="small">{k.meaning}{k.note && <div className="muted">{k.note}</div>}</td>
                <td>{k.boy}</td>
                <td>{k.girl}</td>
                <td className="num"><span className={k.score === k.max ? 'pos' : k.score === 0 ? 'neg' : ''}>{k.score}</span> / {k.max}
                  <span className="koota-bar"><span style={{ width: `${(k.score / k.max) * 100}%` }} /></span>
                </td>
              </tr>
            ))}
            <tr className="total"><td colSpan={4}><strong>Total</strong></td><td className="num"><strong>{r.total} / 36</strong></td></tr>
          </tbody>
        </table>
        <p className="muted small">Traditional guidance: below 18 is not recommended, 18–24 acceptable, 25–32 very good, 33 and above excellent. Some koota tables vary slightly between regional schools.</p>
      </div>

      <h2 className="section-title">Doshas</h2>
      <Checks items={[...r.doshas, r.mangal.verdict]} />
      <p className="small muted">Mangal dosha: {bName}: {r.mangal.boy}. {gName}: {r.mangal.girl}.</p>

      <h2 className="section-title">South Indian poruthams (Dashakoota): {r.poruthamPass} / 10</h2>
      <div className="porutham-grid">
        {r.poruthams.map((p) => (
          <div key={p.name} className={`card porutham ${p.pass ? 'pass' : 'fail'}`}>
            <div className="porutham-head"><strong>{p.name}</strong><span className={p.pass ? 'pos' : 'neg'}>{p.pass ? '✓ Agrees' : '✗ Does not agree'}</span></div>
            <p className="small muted">{p.detail}</p>
            {p.critical && <span className="tag">Critical in South Indian tradition</span>}
          </div>
        ))}
      </div>

      <h2 className="section-title">Beyond the Moon: chart-level harmony</h2>
      <Checks items={r.chart} />

      <h2 className="section-title">Timing</h2>
      <Checks items={r.timing} />

      <p className="muted small center disclaimer">Kundali matching is a traditional practice. Scores come from fixed classical tables and rules. They are not a verdict on a relationship, which depends on mutual respect, values and communication.</p>
    </div>
  )
}

function Checks({ items }: { items: Check[] }) {
  return (
    <div className="insight-list">
      {items.map((c) => (
        <article key={c.title} className={`insight card tone-${c.effect === 'supportive' ? 'good' : c.effect === 'challenging' ? 'challenge' : 'mixed'}`}>
          <h3>{c.title}</h3>
          <p>{c.detail}</p>
          <p className="rule-line small"><strong>Rule:</strong> {c.rule}</p>
        </article>
      ))}
    </div>
  )
}
