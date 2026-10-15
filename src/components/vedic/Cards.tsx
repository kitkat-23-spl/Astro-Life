import type { VInsight } from '../../vedic/interpret'
import InsightCard from '../InsightCard'
import ToneBoard from '../ToneBoard'
import { LockedCard, MoreLocked, useChartAccess } from '../paywall/ChartAccess'

/** Insight cards as a grid, a list or a tone board. On a locked chart the first two stay readable. */
export default function Cards({ items, list, board }: { items: VInsight[]; list?: boolean; board?: boolean }) {
  const { locked } = useChartAccess()
  if (!items.length) return <p className="muted">Nothing notable here.</p>
  if (board) return <ToneBoard items={items.map((i) => ({ id: i.id, tone: i.tone ?? 'mixed', node: <InsightCard insight={i} /> }))} />
  const shown = locked ? 2 : items.length
  return (
    <>
      <div className={list ? 'insight-list' : 'insight-grid'}>
        {items.map((i, n) => (n < shown ? <InsightCard key={i.id} insight={i} /> : <LockedCard key={i.id} seed={i.id} />))}
      </div>
      <MoreLocked count={items.length - shown} noun="readings" />
    </>
  )
}
