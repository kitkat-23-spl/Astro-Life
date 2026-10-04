import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GoogleIcon } from '../components/UserMenu'
import { useAuth } from '../lib/auth'
import { deleteAllCharts, deleteChart, listCharts, type SavedChart } from '../lib/charts'
import { encodeBirth, isBirthData } from '../lib/share'
import { authEnabled } from '../lib/supabase'

export default function AccountPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const [charts, setCharts] = useState<SavedChart[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    listCharts().then(setCharts).catch((e: Error) => setError(e.message))
  }, [user])

  if (!authEnabled) {
    return (
      <div className="page-head">
        <h1>Accounts are not enabled</h1>
        <p className="lede">This deployment hasn’t been connected to Supabase yet. Charts still work fully without an account.</p>
      </div>
    )
  }
  if (loading) return <p className="muted">Loading…</p>
  if (!user) {
    return (
      <div className="page-head center">
        <h1>Your saved charts</h1>
        <p className="lede">Sign in with Google to save charts for yourself, family and friends, and come back to them anytime.</p>
        <button className="btn primary" onClick={() => signInWithGoogle().catch((e: Error) => setError(e.message))}><GoogleIcon /> Sign in with Google</button>
        {error && <p className="error">{error}</p>}
      </div>
    )
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this chart permanently?')) return
    try {
      await deleteChart(id)
      setCharts((c) => c?.filter((x) => x.id !== id) ?? null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const removeAll = async () => {
    if (!confirm('Delete ALL of your saved charts permanently? This cannot be undone.')) return
    try {
      await deleteAllCharts(user.id)
      setCharts([])
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div>
      <header className="page-head">
        <p className="eyebrow">Signed in as {user.email}</p>
        <h1>Your saved charts</h1>
      </header>
      {error && <p className="error">{error}</p>}
      {charts === null && !error && <p className="muted">Loading…</p>}
      {charts?.length === 0 && (
        <p className="muted">No saved charts yet. <Link to="/chart">Create one</Link></p>
      )}
      <div className="saved-grid">
        {charts?.filter((c) => isBirthData(c.birth)).map((c) => (
          <div key={c.id} className="card saved">
            <h3>{c.label}</h3>
            <p className="muted small">{c.birth.date}{c.birth.time ? ` · ${c.birth.time}` : ''} · {c.birth.place}</p>
            <div className="row">
              <Link className="btn primary small" to={{ pathname: '/chart', hash: encodeBirth(c.birth) }}>Open</Link>
              <button className="btn ghost small" onClick={() => remove(c.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {charts && charts.length > 0 && (
        <p className="danger-zone small">
          <button className="btn danger small" onClick={removeAll}>Delete all my data</button>
          <span className="muted">Permanently removes every chart saved to your account.</span>
        </p>
      )}
    </div>
  )
}
