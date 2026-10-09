import { useState, type ReactNode } from 'react'

export type BoardTone = 'good' | 'mixed' | 'challenge'
export interface BoardItem { id: string; tone: BoardTone; node: ReactNode }

const ORDER: BoardTone[] = ['good', 'mixed', 'challenge']
const DEFAULT_LABELS: Record<BoardTone, string> = { good: 'Supportive', mixed: 'Mixed', challenge: 'Needs care' }

/**
 * Cards sorted into three columns by tone, so a reader sees the whole picture
 * at once. On a phone one column shows at a time, picked from a switch.
 */
export default function ToneBoard({ items, labels = DEFAULT_LABELS, caption }: { items: BoardItem[]; labels?: Record<BoardTone, string>; caption?: string }) {
  const cols = ORDER.map((tone) => ({ tone, list: items.filter((i) => i.tone === tone) }))
  const [active, setActive] = useState<BoardTone>(() => cols.find((c) => c.list.length)?.tone ?? 'good')
  if (!items.length) return <p className="muted">Nothing to show here.</p>
  return (
    <div className="board">
      <div className="board-switch" role="group" aria-label={caption ?? 'Show column'}>
        {cols.map((c) => (
          <button key={c.tone} type="button" className={`bs-${c.tone} ${active === c.tone ? 'active' : ''}`} aria-pressed={active === c.tone} onClick={() => setActive(c.tone)}>
            {labels[c.tone]} <span className="board-count">{c.list.length}</span>
          </button>
        ))}
      </div>
      <div className="board-cols">
        {cols.map((c) => (
          <section key={c.tone} className={`board-col col-${c.tone} ${active === c.tone ? 'active' : ''}`} aria-label={labels[c.tone]}>
            <h3 className="board-head">{labels[c.tone]} <span className="board-count">{c.list.length}</span></h3>
            {c.list.length ? c.list.map((i) => <div key={i.id} className="board-item">{i.node}</div>) : <p className="board-empty small">None</p>}
          </section>
        ))}
      </div>
    </div>
  )
}
