import type { VInsight } from '../../vedic/interpret'
import InsightCard from '../InsightCard'
import ToneBoard from '../ToneBoard'

export default function Cards({ items, list, board }: { items: VInsight[]; list?: boolean; board?: boolean }) {
  if (!items.length) return <p className="muted">Nothing notable here.</p>
  if (board) return <ToneBoard items={items.map((i) => ({ id: i.id, tone: i.tone ?? 'mixed', node: <InsightCard insight={i} /> }))} />
  return <div className={list ? 'insight-list' : 'insight-grid'}>{items.map((i) => <InsightCard key={i.id} insight={i} />)}</div>
}
