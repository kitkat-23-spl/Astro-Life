import { createContext, useContext, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { BirthData } from '../../astro/ephemeris'
import { useAuth } from '../../lib/auth'
import { useEntitlements } from '../../lib/entitlements'
import { FROM_PRICE, PAYWALL, scramble } from '../../lib/paywall'
import { authEnabled } from '../../lib/supabase'

interface Access { locked: boolean; birth: BirthData | null }
const Ctx = createContext<Access>({ locked: false, birth: null })
/** Exposed for tests; pages use ChartAccessProvider. */
export const ChartAccessContext = Ctx

/** Wraps a chart's pages: everything inside knows whether this person's chart is unlocked. */
export function ChartAccessProvider({ birth, children }: { birth: BirthData; children: ReactNode }) {
  const { isUnlocked } = useEntitlements()
  return <Ctx.Provider value={{ locked: PAYWALL && !isUnlocked(birth), birth }}>{children}</Ctx.Provider>
}

/** Outside a chart (Panchang, lessons) nothing is locked. */
export const useChartAccess = () => useContext(Ctx)

const labelOf = (b: BirthData | null) => (b?.name?.trim() ? `${b.name.trim()}'s` : 'this')

export function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="lock-icon">
      <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

/** Blurred stand-in text. The real reading is not in the page until the chart is unlocked. */
export function LockedText({ seed, words = 12, as = 'span' }: { seed: string; words?: number; as?: 'span' | 'p' | 'li' }) {
  const Tag = as
  return <Tag className="locked-text" aria-hidden="true">{scramble(seed, words)}</Tag>
}

/** A locked card in a board or list. */
export function LockedCard({ seed }: { seed: string }) {
  return (
    <article className="insight card locked-card" aria-label="Locked: part of the full report">
      <header className="insight-head"><h4 className="locked-text" aria-hidden="true">{scramble(`${seed}-t`, 5)}</h4><LockIcon /></header>
      <p className="locked-text small" aria-hidden="true">{scramble(`${seed}-a`, 16)}</p>
      <p className="locked-text small" aria-hidden="true">{scramble(`${seed}-b`, 9)}</p>
    </article>
  )
}

/** The action that unlocks the current chart: sign in, spend a credit, or buy credits. */
export function UnlockButton({ small }: { small?: boolean }) {
  const { birth } = useChartAccess()
  const { user, signInWithGoogle } = useAuth()
  const { credits, unlock } = useEntitlements()
  const loc = useLocation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cls = `btn primary ${small ? 'small' : ''}`
  const back = encodeURIComponent(loc.pathname + loc.search + loc.hash)

  if (!birth) return null
  if (!authEnabled) return <Link to="/pricing" className={cls}>See plans</Link>
  if (!user) return <button className={cls} onClick={() => signInWithGoogle().catch((e: Error) => setError(e.message))}>Sign in to unlock</button>
  if (credits && credits.remaining > 0) {
    const go = async () => {
      const when = `${birth.date}${birth.time ? `, ${birth.time}` : ''}, ${birth.place}`
      if (!confirm(`Unlock the full reading for ${birth.name?.trim() || 'this chart'}?\n\n${when}\n\nThis uses 1 of your ${credits.remaining} credits. The birth details are then fixed to this credit and cannot be changed or used for another person.`)) return
      setBusy(true)
      setError(null)
      try { await unlock(birth, birth.name?.trim() || birth.place) } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
    }
    return (
      <span className="unlock-action">
        <button className={cls} onClick={go} disabled={busy}><LockIcon /> {busy ? 'Unlocking...' : `Unlock with 1 credit (${credits.remaining} left)`}</button>
        {error && <span className="error small" role="alert">{error}</span>}
      </span>
    )
  }
  return (
    <span className="unlock-action">
      <Link to={`/pricing?return=${back}`} className={cls}><LockIcon /> Unlock from ₹{FROM_PRICE}</Link>
      {error && <span className="error small" role="alert">{error}</span>}
    </span>
  )
}

/** Shown near the top of a locked chart, and as a small badge once unlocked. */
export function PreviewBanner() {
  const { locked, birth } = useChartAccess()
  if (!PAYWALL || !birth) return null
  if (!locked) return <p className="unlocked-badge small"><LockIcon size={12} /> Full reading unlocked. These birth details are fixed to your credit.</p>
  return (
    <section className="preview-banner card">
      <div>
        <strong>Free preview of {labelOf(birth)} chart</strong>
        <p className="small muted">You can see the chart, the overall lean of each life area, how many rules support or challenge it, and two key rules. Unlock every rule, the full reports, timing windows and the year ahead for this person, permanently.</p>
      </div>
      <UnlockButton />
    </section>
  )
}

/** Locks a whole section: a blurred stand-in with a small unlock link. */
export function Gate({ seed, lines = 4, children }: { seed: string; lines?: number; children: ReactNode }) {
  const { locked } = useChartAccess()
  if (!locked) return <>{children}</>
  return (
    <div className="card gate">
      {Array.from({ length: lines }, (_, i) => <LockedText key={i} as="p" seed={`${seed}-${i}`} words={10 + ((i * 7) % 9)} />)}
      <div className="gate-cta"><LockIcon /> <span className="small">Part of the full report.</span> <UnlockButton small /></div>
    </div>
  )
}

/** After a list with hidden items: how many are locked, and the way to unlock them. */
export function MoreLocked({ count, noun = 'rules' }: { count: number; noun?: string }) {
  const { locked } = useChartAccess()
  if (!locked || count <= 0) return null
  return (
    <div className="more-locked card">
      <span><LockIcon /> <strong>{count} more {count === 1 ? noun.replace(/s$/, '') : noun}</strong> in the full report for this chart.</span>
      <UnlockButton small />
    </div>
  )
}
