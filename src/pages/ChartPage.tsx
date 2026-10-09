import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { computeChart, type BirthData, type Chart } from '../astro/ephemeris'
import BirthForm from '../components/BirthForm'
import ChartView from '../components/ChartView'
import Segmented from '../components/Segmented'
import VedicView from '../components/vedic/VedicView'
import { GoogleIcon } from '../components/UserMenu'
import { useAuth } from '../lib/auth'
import { saveChart } from '../lib/charts'
import { encodeBirth } from '../lib/share'
import { useSettings } from '../lib/settings'
import { useBirthFromHash } from '../lib/useVedic'
import { authEnabled } from '../lib/supabase'

export default function ChartPage() {
  const { hash, birth } = useBirthFromHash()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const { settings, update } = useSettings()
  const system = settings.system
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
          <h1>Birth details</h1>
          <p className="lede">The birth time and place set the lagna and houses. A time from a birth certificate is best.</p>
          {hash.length > 1 && !birth && <p className="error">This chart link is invalid or incomplete. Enter the details again.</p>}
          {result && 'error' in result && <p className="error">{result.error}</p>}
        </div>
        <BirthForm initial={birth ?? undefined} onSubmit={show} />
      </div>
    )
  }

  const actions = (
    <>
      <Segmented label="Astrology system" value={system} onChange={(v) => update({ system: v })} options={[['vedic', 'Vedic'], ['western', 'Western']]} />
      <ChartActions birth={birth} onEdit={() => setEditing(true)} />
    </>
  )
  return system === 'vedic'
    ? <VedicView birth={birth} actions={actions} />
    : <ChartView chart={result.chart} actions={actions} />
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
