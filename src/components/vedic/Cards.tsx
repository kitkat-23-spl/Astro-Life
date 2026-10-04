import type { VInsight } from '../../vedic/interpret'
import InsightCard from '../InsightCard'

export default function Cards({ items, list }: { items: VInsight[]; list?: boolean }) {
  if (!items.length) return <p className="muted">Nothing notable here.</p>
  return <div className={list ? 'insight-list' : 'insight-grid'}>{items.map((i) => <InsightCard key={i.id} insight={i} />)}</div>
}
