import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { BirthData } from '../astro/ephemeris'
import { HOUSE_SYSTEM_LABELS, type HouseSystem } from '../astro/houses'
import { searchPlaces, type Place } from '../lib/geocode'

interface Props {
  initial?: Partial<BirthData>
  onSubmit: (b: BirthData) => void
  submitLabel?: string
  compact?: boolean
}

const MIN_DATE = '1800-01-01'
const MAX_DATE = '2100-12-31'

export default function BirthForm({ initial, onSubmit, submitLabel = 'Reveal my chart', compact }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [time, setTime] = useState(initial?.time ?? '')
  const [unknownTime, setUnknownTime] = useState(initial ? initial.time === null : false)
  const [houseSystem, setHouseSystem] = useState<HouseSystem>(initial?.houseSystem ?? 'placidus')
  const [place, setPlace] = useState<Place | null>(
    initial?.place && initial.latitude !== undefined && initial.longitude !== undefined && initial.timezone
      ? { id: 0, name: initial.place, label: initial.place, latitude: initial.latitude, longitude: initial.longitude, timezone: initial.timezone }
      : null,
  )
  const [query, setQuery] = useState(initial?.place ?? '')
  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const listId = useId()
  const uid = useId()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (place && query === place.label) return
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setSearching(true)
      setSearchError(null)
      try {
        const r = await searchPlaces(q, ctrl.signal)
        setResults(r)
        setOpen(true)
        setActiveIndex(r.length ? 0 : -1)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setSearchError((e as Error).message)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, place])

  const choose = (p: Place) => {
    setPlace(p)
    setQuery(p.label)
    setOpen(false)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!date || date < MIN_DATE || date > MAX_DATE) return setError('Please enter a birth date between 1800 and 2100.')
    if (!unknownTime && !/^\d{2}:\d{2}$/.test(time)) return setError('Please enter a birth time, or tick "I don’t know my birth time".')
    if (!place) return setError('Please choose your birthplace from the suggestions.')
    onSubmit({
      name: name.trim().slice(0, 60),
      date,
      time: unknownTime ? null : time,
      place: place.label.slice(0, 120),
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone,
      houseSystem,
    })
  }

  return (
    <form className="birth-form card" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor={`bf-name-${uid}`}>Name <span className="muted">(optional)</span></label>
        <input id={`bf-name-${uid}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoComplete="given-name" placeholder="e.g. Maya" />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor={`bf-date-${uid}`}>Birth date</label>
          <input id={`bf-date-${uid}`} type="date" required min={MIN_DATE} max={MAX_DATE} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor={`bf-time-${uid}`}>Birth time</label>
          <input id={`bf-time-${uid}`} type="time" value={time} disabled={unknownTime} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <label className="check">
        <input type="checkbox" checked={unknownTime} onChange={(e) => setUnknownTime(e.target.checked)} />
        I don’t know my birth time <span className="muted">(no rising sign or houses)</span>
      </label>

      <div className="field combo">
        <label htmlFor={`bf-place-${uid}`}>Birthplace</label>
        <input
          id={`bf-place-${uid}`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder="Start typing a city…"
          value={query}
          maxLength={100}
          onChange={(e) => { setQuery(e.target.value); setPlace(null) }}
          onFocus={() => results.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open || !results.length) return
            if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => (i + 1) % results.length) }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => (i - 1 + results.length) % results.length) }
            if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); choose(results[activeIndex]) }
            if (e.key === 'Escape') setOpen(false)
          }}
        />
        {searching && <span className="combo-status muted">Searching…</span>}
        {open && results.length > 0 && (
          <ul className="combo-list" id={listId} role="listbox">
            {results.map((r, i) => (
              <li
                key={r.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={i === activeIndex ? 'active' : ''}
                onMouseDown={(e) => { e.preventDefault(); choose(r) }}
              >
                <span>{r.label}</span>
                <span className="muted small">{r.timezone}</span>
              </li>
            ))}
          </ul>
        )}
        {open && !searching && query.trim().length >= 2 && results.length === 0 && !searchError && (
          <p className="muted small">No places found. Try the nearest larger town.</p>
        )}
        {searchError && <p className="error small">{searchError}</p>}
        {place && (
          <p className="muted small">
            {place.latitude.toFixed(2)}°, {place.longitude.toFixed(2)}° · time zone {place.timezone}
          </p>
        )}
      </div>

      <details className="advanced">
        <summary>Advanced options</summary>
        <div className="field">
          <label htmlFor={`bf-houses-${uid}`}>House system <span className="muted">(Western charts; Vedic always uses whole-sign)</span></label>
          <select id={`bf-houses-${uid}`} value={houseSystem} onChange={(e) => setHouseSystem(e.target.value as HouseSystem)}>
            {(Object.keys(HOUSE_SYSTEM_LABELS) as HouseSystem[]).map((h) => (
              <option key={h} value={h}>{HOUSE_SYSTEM_LABELS[h]}</option>
            ))}
          </select>
        </div>
      </details>

      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn primary block" type="submit">{submitLabel}</button>
      {!compact && <p className="muted small center">Calculated privately in your browser. Nothing is stored unless you choose to save it.</p>}
    </form>
  )
}
