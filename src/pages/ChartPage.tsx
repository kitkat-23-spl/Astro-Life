import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { computeChart, type BirthData, type Chart } from '../astro/ephemeris'
import BirthForm from '../components/BirthForm'
import ChartView from '../components/ChartView'
import { GoogleIcon } from '../components/UserMenu'
import { useAuth } from '../lib/auth'
import { saveChart } from '../lib/charts'
import { decodeBirth, encodeBirth } from '../lib/share'
import { authEnabled } from '../lib/supabase'

export default function ChartPage() {
  const { hash } = useLocation()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)

  const birth = useMemo(() => (hash.length > 1 ? decodeBirth(hash.slice(1)) : null), [hash])
  const result = useMemo((): { chart: Chart } | { error: string } | null => {
    if (!birth) return null
    try {
      return { chart: computeChart(birth) }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }, [birth])

  const show = (b: BirthData) => {
    setEditing(false)
    navigate({ pathname: '/chart', hash: encodeBirth(b) })
  }

  if (!birth || editing || !result || 'error' in result) {
    return (
      <div className="chart-form-page">
        <div className="form-intro">
          <p className="eyebrow">Free birth chart</p>
          <h1>Enter your birth details</h1>
          <p className="lede">Your exact birth time and place let us calculate your rising sign and houses. You’ll find them on a birth certificate, or ask a parent.</p>
          {hash.length > 1 && !birth && <p className="error">That chart link is invalid or incomplete. Please enter the details again.</p>}
          {result && 'error' in result && <p className="error">{result.error}</p>}
        </div>
        <BirthForm initial={birth ?? undefined} onSubmit={show} />
      </div>
    )
  }

  return <ChartView chart={result.chart} actions={<ChartActions birth={birth} onEdit={() => setEditing(true)} />} />
}

function ChartActions({ birth, onEdit }: { birth: BirthData; onEdit: () => void }) {
  const { user, signInWithGoogle } = useAuth()
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    setStatus(null)
    try {
      await saveChart(birth.name || 'My chart', birth)
      setStatus('Saved to your account.')
    } catch (e) {
      setStatus(`Could not save: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setStatus('Link copied. It contains the birth details, so share it only with people you trust.')
    } catch {
      setStatus('Copy failed. You can copy the address bar instead.')
    }
  }

  return (
    <>
      <button className="btn ghost small" onClick={onEdit}>Edit details</button>
      <button className="btn ghost small" onClick={copy}>Copy link</button>
      {authEnabled && (user ? (
        <>
          <button className="btn primary small" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save chart'}</button>
          <Link className="btn ghost small" to="/account">My charts</Link>
        </>
      ) : (
        <button className="btn primary small" onClick={() => signInWithGoogle().catch((e: Error) => setStatus(e.message))}>
          <GoogleIcon /> Sign in to save
        </button>
      ))}
      {status && <p className="small status" role="status">{status}</p>}
    </>
  )
}
