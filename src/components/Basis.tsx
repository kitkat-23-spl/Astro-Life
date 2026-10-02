const FRIENDLY: Record<string, string> = {
  own: 'own sign', friend: 'friendly sign', enemy: 'enemy sign', exalted: 'exalted', debilitated: 'debilitated',
  moolatrikona: 'moolatrikona', domicile: 'home sign', exaltation: 'exalted', detriment: 'detriment', fall: 'fall',
}

/** The chart combinations behind a reading, shown as chips under it. */
export default function Basis({ items, label = 'Based on' }: { items: string[]; label?: string }) {
  const list = [...new Set(items
    .map((s) => s.trim().replace(/^(essential )?dignity: /i, ''))
    .map((s) => FRIENDLY[s] ?? s.replace(/^D9 (\w+)$/, (_, d: string) => `${FRIENDLY[d] ?? d} in D9`))
    // A neutral dignity says nothing useful, so it isn't shown.
    .filter((s) => s && !/(^|\s)neutral$/i.test(s)))]
  if (!list.length) return null
  return (
    <div className="basis">
      <span className="basis-label">{label}</span>
      <ul className="basis-chips">
        {list.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    </div>
  )
}
