import { useState, type ReactNode } from 'react'
import { LockedCard, MoreLocked, useChartAccess } from './paywall/ChartAccess'

export type BoardTone = 'good' | 'mixed' | 'challenge'
export interface BoardItem { id: string; tone: BoardTone; node: ReactNode }

const ORDER: BoardTone[] = ['good', 'mixed', 'challenge']
const DEFAULT_LABELS: Record<BoardTone, string> = { good: 'Supportive', mixed: 'Mixed', challenge: 'Needs care' }

/**
 * Cards sorted into three columns by tone, so a reader sees the whole picture
 * at once. On a phone one column shows at a time, picked from a switch.
 */
export default function ToneBoard({ items, labels = DEFAULT_LABELS, caption }: { items: BoardItem[]; labels?: Record<BoardTone, string>; caption?: string }) {
  const { locked } = useChartAccess()
  // Free preview of a locked chart: the strongest supportive item and the strongest caution stay readable.
  const free = new Set(locked ? freePreview(items) : items.map((i) => i.id))
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
            {c.list.length ? c.list.map((i) => <div key={i.id} className="board-item">{free.has(i.id) ? i.node : <LockedCard seed={i.id} />}</div>) : <p className="board-empty small">None</p>}
          </section>
        ))}
      </div>
      <MoreLocked count={items.length - free.size} />
    </div>
  )
}

/** The first supportive item and the first item that needs care; two items if one kind is missing. */
export function freePreview(items: BoardItem[]): string[] {
  const good = items.find((i) => i.tone === 'good'), care = items.find((i) => i.tone === 'challenge')
  const picked = [good, care].filter((i): i is BoardItem => !!i).map((i) => i.id)
  for (const i of items) if (picked.length < 2 && !picked.includes(i.id)) picked.push(i.id)
  return picked
}
