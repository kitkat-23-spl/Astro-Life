import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LockIcon } from '../components/paywall/ChartAccess'
import { GoogleIcon } from '../components/UserMenu'
import { useAuth } from '../lib/auth'
import { useEntitlements } from '../lib/entitlements'
import { PACKS, PAYWALL, safeReturn, type PackId } from '../lib/paywall'
import { authEnabled } from '../lib/supabase'

const INCLUDED = [
  'Every rule behind each life area: career, marriage, wealth, education and children',
  'The career summary, mode of work and the best dasha periods',
  'Timing: favourable dasha periods and double-transit windows',
  'The full year ahead, month by month',
  'All planet, house, yoga and divisional-chart readings from the classical texts',
  'Ashtakavarga readings and transit interpretations',
]

export default function PricingPage() {
  const { user, signInWithGoogle } = useAuth()
  const { credits, buy } = useEntitlements()
  const [params] = useSearchParams()
  const back = safeReturn(params.get('return'))
  const [busy, setBusy] = useState<PackId | null>(null)
  const [done, setDone] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const purchase = async (pack: PackId) => {
    setError(null)
    setDone(null)
    setBusy(pack)
    try { setDone(await buy(pack)) } catch (e) { setError((e as Error).message) } finally { setBusy(null) }
  }

  return (
    <div className="pricing">
      <header className="page-head center">
        <p className="eyebrow">Full readings</p>
        <h1>Unlock a chart, keep it for good</h1>
        <p className="lede">The chart, the Panchang, matching and the Jyotish course stay free. A credit unlocks every rule and report for one person, permanently, with no subscription.</p>
      </header>

      {!PAYWALL && <p className="callout note">All readings are free at the moment. Paid credits are not switched on yet.</p>}
      {credits && <p className="center small">You have <strong>{credits.remaining}</strong> credit{credits.remaining === 1 ? '' : 's'} left ({credits.used} used).</p>}
      {done !== null && (
        <p className="callout tip" role="status">
          Payment received: {done} credit{done === 1 ? '' : 's'} added. {back ? <Link to={back}>Go back to your chart and unlock it</Link> : <Link to="/chart">Open a chart to unlock it</Link>}.
        </p>
      )}
      {error && <p className="error center" role="alert">{error}</p>}

      <div className="pack-grid">
        {PACKS.map((p) => (
          <article key={p.id} className={`card pack ${p.credits === 3 ? 'featured' : ''}`}>
            {p.credits === 3 && <span className="pill pill-good pack-tag">Popular for families</span>}
            <h2>{p.credits} {p.credits === 1 ? 'chart' : 'charts'}</h2>
            <p className="pack-price">₹{p.rupees.toLocaleString('en-IN')}</p>
            <p className="small muted">{p.credits > 1 ? `₹${Math.round(p.rupees / p.credits)} per chart` : 'One person'}</p>
            {!authEnabled || !PAYWALL ? (
              <button className="btn primary" disabled>Not available yet</button>
            ) : !user ? (
              <button className="btn primary" onClick={() => signInWithGoogle().catch((e: Error) => setError(e.message))}><GoogleIcon /> Sign in to buy</button>
            ) : (
              <button className="btn primary" onClick={() => purchase(p.id)} disabled={busy !== null}>{busy === p.id ? 'Opening payment...' : 'Buy'}</button>
            )}
          </article>
        ))}
      </div>
      <p className="center small muted">Prices include all taxes. Pay by UPI, card, net banking or wallet through Razorpay.</p>

      <div className="grid-2 section-gap">
        <section className="card">
          <h2>What a credit unlocks</h2>
          <ul className="lesson-list">{INCLUDED.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
        <section className="card">
          <h2>How credits work</h2>
          <ul className="lesson-list">
            <li><LockIcon /> One credit is one person. Open their chart and choose <strong>Unlock</strong>.</li>
            <li>Once unlocked, that person's date, time and place are <strong>fixed</strong> to the credit. Editing them creates a different chart, which needs its own credit.</li>
            <li>Unlocked charts stay unlocked on any device where you sign in, and appear under <Link to="/account">My charts</Link>.</li>
            <li>Unused credits never expire. See the <Link to="/refunds">refund policy</Link> and <Link to="/terms">terms</Link>.</li>
          </ul>
        </section>
      </div>
      <p className="muted small center disclaimer">Readings are traditional, rule-based indications for reflection. They are not predictions of fixed events and not a substitute for medical, legal, financial or marital advice.</p>
    </div>
  )
}
