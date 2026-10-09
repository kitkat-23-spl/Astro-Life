import { useState } from 'react'
import type { VedicReading } from '../../../vedic/interpret'
import type { GlossaryKey } from '../../../lib/glossary'
import { YOGA_GROUPS, yogaTone, type YogaGroup } from '../../../vedic/yogas'
import ToneBoard from '../../ToneBoard'
import Term from '../../Term'
import { YogaCard } from '../ReportParts'

const GROUP_TERM: Partial<Record<YogaGroup, GlossaryKey>> = { 'Pancha Mahapurusha': 'mahapurusha', Raja: 'raja', Dhana: 'dhana', Nabhasa: 'nabhasa' }

const label = (g: YogaGroup) => (GROUP_TERM[g] ? <Term k={GROUP_TERM[g]!}>{g}</Term> : g)

export default function YogasTab({ reading }: { reading: VedicReading }) {
  const [all, setAll] = useState(false)
  const present = reading.yogas.filter((y) => y.present)
  return (
    <>
      <div className="rule-toolbar">
        <p className="muted small"><Term k="yoga">{present.length} of {reading.yogas.length} classical yogas are present.</Term> Yogas give results mainly in the dashas of the planets that form them.</p>
        <label className="check small"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Show yogas that are not present</label>
      </div>
      <ToneBoard items={present.sort((a, b) => YOGA_GROUPS.indexOf(a.def.group) - YOGA_GROUPS.indexOf(b.def.group)).map((y) => ({ id: y.def.id, tone: yogaTone(y), node: <YogaCard y={y} eyebrow={label(y.def.group)} /> }))} />
      {all && (
        <section className="unmet-block">
          <h3 className="sub-h">Yogas that are not present ({reading.yogas.length - present.length})</h3>
          {YOGA_GROUPS.map((g) => {
            const list = reading.yogas.filter((y) => y.def.group === g && !y.present)
            if (!list.length) return null
            return (
              <section key={g} className="rule-group">
                <h3>{label(g)}</h3>
                <div className="insight-grid">{list.map((y) => <YogaCard key={y.def.id} y={y} />)}</div>
              </section>
            )
          })}
        </section>
      )}
    </>
  )
}
