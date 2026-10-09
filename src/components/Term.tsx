import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { GLOSSARY, type GlossaryKey } from '../lib/glossary'

/**
 * A term with a small info button. The explanation shows on hover or keyboard
 * focus, and toggles on tap for touch screens. Escape or a tap elsewhere closes it.
 */
export default function Term({ k, children }: { k: GlossaryKey; children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const id = useId()
  const ref = useRef<HTMLSpanElement>(null)
  const show = open || pinned

  useEffect(() => {
    if (!pinned) return
    const away = (e: Event) => { if (!ref.current?.contains(e.target as Node)) setPinned(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPinned(false); setOpen(false) } }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc) }
  }, [pinned])

  return (
    <span className="term" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      <button
        type="button"
        className="term-i"
        aria-label={`What does this mean?`}
        aria-describedby={show ? id : undefined}
        aria-expanded={show}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPinned(!pinned) }}
        onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setPinned(false) } }}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="4.8" r="1" fill="currentColor" /><path d="M8 7.2v4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      </button>
      {show && <span role="tooltip" id={id} className="term-tip">{GLOSSARY[k]}</span>}
    </span>
  )
}
