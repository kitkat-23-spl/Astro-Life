import { useState } from 'react'
import type { VedicReading } from '../../../vedic/interpret'
import { YOGA_GROUPS } from '../../../vedic/yogas'
import { YogaCard } from '../ReportParts'

export default function YogasTab({ reading }: { reading: VedicReading }) {
  const [all, setAll] = useState(false)
  const present = reading.yogas.filter((y) => y.present)
  return (
    <>
      <div className="rule-toolbar">
        <p className="muted small">{present.length} of {reading.yogas.length} classical yogas are present. Yogas give results mainly in the dashas of the planets that form them.</p>
        <label className="check small"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Show yogas that are not present</label>
      </div>
      {YOGA_GROUPS.map((g) => {
        const list = reading.yogas.filter((y) => y.def.group === g && (all || y.present))
        if (!list.length) return null
        return (
          <section key={g} className="rule-group">
            <h3>{g}</h3>
            <div className="insight-list">{list.map((y) => <YogaCard key={y.def.id} y={y} />)}</div>
          </section>
        )
      })}
    </>
  )
}
