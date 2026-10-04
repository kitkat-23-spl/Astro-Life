import { useEffect, useId, useRef, useState } from 'react'
import { searchPlaces, type Place } from '../lib/geocode'

interface Props {
  label: string
  value: Place | null
  onChange: (p: Place | null) => void
}

/** City search with keyboard navigation (combobox pattern), backed by Open-Meteo geocoding. */
export default function PlaceSearch({ label, value, onChange }: Props) {
  const [query, setQuery] = useState(value?.label ?? '')
  const [results, setResults] = useState<Place[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const listId = useId()
  const inputId = useId()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (value && query === value.label) return
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
  }, [query, value])

  const choose = (p: Place) => {
    onChange(p)
    setQuery(p.label)
    setOpen(false)
  }

  return (
    <div className="field combo">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder="Start typing a city"
        value={query}
        maxLength={100}
        onChange={(e) => { setQuery(e.target.value); onChange(null) }}
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
      {searching && <span className="combo-status muted">Searching</span>}
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
      {value && <p className="muted small">{value.latitude.toFixed(2)}°, {value.longitude.toFixed(2)}° · time zone {value.timezone}</p>}
    </div>
  )
}
