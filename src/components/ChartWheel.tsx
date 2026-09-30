import { useMemo, useState } from 'react'
import { ELEMENT_COLORS, PLANET_GLYPHS, SIGNS, formatDegree, norm360, type PointName } from '../astro/constants'
import type { Chart } from '../astro/ephemeris'

const SIZE = 600
const C = SIZE / 2
const R_OUT = 290
const R_SIGN = 248
const R_HOUSE_IN = 110
const R_PLANET = 212
const R_ASPECT = 104

interface Props {
  chart: Chart
  selected?: PointName | null
  onSelect?: (p: PointName | null) => void
  caption?: string
}

/** Spread labels so glyphs never overlap, keeping each as close to its true degree as possible. */
function spread(items: { name: PointName; lon: number }[], minGap = 8.5) {
  const sorted = [...items].sort((a, b) => a.lon - b.lon).map((i) => ({ ...i, pos: i.lon }))
  for (let iter = 0; iter < 60; iter++) {
    let moved = false
    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i]
      const b = sorted[(i + 1) % sorted.length]
      let gap = norm360(b.pos - a.pos)
      if (sorted.length === 1) break
      if (gap < minGap) {
        const push = (minGap - gap) / 2
        a.pos = norm360(a.pos - push)
        b.pos = norm360(b.pos + push)
        gap = minGap
        moved = true
      }
    }
    if (!moved) break
  }
  return sorted
}

export default function ChartWheel({ chart, selected, onSelect, caption }: Props) {
  const [hover, setHover] = useState<PointName | null>(null)
  const active = hover ?? selected ?? null
  // Rotate so the Ascendant sits at 9 o'clock. Without a birth time, 0° Aries sits there instead.
  const asc = chart.ascendant ?? 0

  const xy = (lon: number, r: number) => {
    const a = ((180 + lon - asc) * Math.PI) / 180
    return [C + r * Math.cos(a), C - r * Math.sin(a)] as const
  }

  const points = useMemo(() => {
    const list: { name: PointName; lon: number }[] = chart.placements.map((p) => ({ name: p.name, lon: p.longitude }))
    return spread(list)
  }, [chart])

  const retro = new Set(chart.placements.filter((p) => p.retrograde).map((p) => p.name))
  const lonOf = (n: PointName) =>
    n === 'Ascendant' ? chart.ascendant! : n === 'Midheaven' ? chart.midheaven! : chart.placements.find((p) => p.name === n)!.longitude

  const arc = (r1: number, r2: number, from: number, to: number) => {
    const [x1, y1] = xy(from, r1)
    const [x2, y2] = xy(to, r1)
    const [x3, y3] = xy(to, r2)
    const [x4, y4] = xy(from, r2)
    // Increasing longitude runs counter-clockwise on screen (sweep-flag 0).
    return `M${x1},${y1} A${r1},${r1} 0 0 0 ${x2},${y2} L${x3},${y3} A${r2},${r2} 0 0 1 ${x4},${y4} Z`
  }

  const activeLabel = active
    ? `${active} ${formatDegree(lonOf(active))} ${SIGNS[Math.floor(norm360(lonOf(active)) / 30)].name}${retro.has(active) ? ' (retrograde)' : ''}`
    : null

  return (
    <figure className="wheel">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Birth chart wheel for ${chart.birth.name || 'this chart'}`}
        onMouseLeave={() => setHover(null)}
      >
        <circle cx={C} cy={C} r={R_OUT} className="wheel-bg" />

        {/* Zodiac ring */}
        {SIGNS.map((s, i) => {
          const from = i * 30
          const [gx, gy] = xy(from + 15, (R_OUT + R_SIGN) / 2)
          return (
            <g key={s.name}>
              <path d={arc(R_OUT, R_SIGN, from, from + 30)} fill={ELEMENT_COLORS[s.element]} className="sign-seg" />
              <text x={gx} y={gy} className="sign-glyph" textAnchor="middle" dominantBaseline="central">
                {s.glyph}
                <title>{s.name}</title>
              </text>
            </g>
          )
        })}
        {/* Degree ticks */}
        {Array.from({ length: 72 }, (_, i) => {
          const lon = i * 5
          const [x1, y1] = xy(lon, R_SIGN)
          const [x2, y2] = xy(lon, R_SIGN - (i % 6 === 0 ? 10 : 5))
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="tick" />
        })}
        <circle cx={C} cy={C} r={R_SIGN} className="ring" />
        <circle cx={C} cy={C} r={R_HOUSE_IN} className="ring" />

        {/* House cusps */}
        {chart.cusps?.map((cusp, i) => {
          const angular = i % 3 === 0
          const [x1, y1] = xy(cusp, R_HOUSE_IN)
          const [x2, y2] = xy(cusp, angular ? R_OUT + 6 : R_SIGN)
          const next = chart.cusps![(i + 1) % 12]
          const mid = cusp + norm360(next - cusp) / 2
          const [nx, ny] = xy(mid, R_HOUSE_IN + 14)
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className={angular ? 'cusp angular' : 'cusp'} />
              <text x={nx} y={ny} className="house-num" textAnchor="middle" dominantBaseline="central">{i + 1}</text>
            </g>
          )
        })}
        {chart.ascendant !== null && (
          <>
            <AngleLabel xy={xy} lon={chart.ascendant} label="AC" />
            <AngleLabel xy={xy} lon={chart.midheaven!} label="MC" />
          </>
        )}

        {/* Aspect lines */}
        <circle cx={C} cy={C} r={R_ASPECT} className="aspect-bg" />
        {chart.aspects
          .filter((a) => a.type.name !== 'Conjunction')
          .map((a) => {
            const [x1, y1] = xy(lonOf(a.a), R_ASPECT)
            const [x2, y2] = xy(lonOf(a.b), R_ASPECT)
            const on = active ? a.a === active || a.b === active : true
            return (
              <line
                key={`${a.a}-${a.b}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                className={`aspect ${a.type.nature} ${on ? '' : 'dim'}`}
                strokeWidth={Math.max(0.6, 2.4 - a.orb / 3)}
              />
            )
          })}

        {/* Planets */}
        {points.map((p) => {
          const [tx1, ty1] = xy(p.lon, R_SIGN)
          const [tx2, ty2] = xy(p.lon, R_SIGN - 12)
          const [lx, ly] = xy(p.pos, R_PLANET)
          const [dx, dy] = xy(p.pos, R_PLANET - 22)
          const isActive = active === p.name
          return (
            <g
              key={p.name}
              className={`planet ${isActive ? 'active' : ''}`}
              tabIndex={0}
              role="button"
              aria-label={`${p.name} at ${formatDegree(p.lon)} ${SIGNS[Math.floor(p.lon / 30)].name}`}
              onMouseEnter={() => setHover(p.name)}
              onFocus={() => setHover(p.name)}
              onBlur={() => setHover(null)}
              onClick={() => onSelect?.(selected === p.name ? null : p.name)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(selected === p.name ? null : p.name) } }}
            >
              <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} className="planet-tick" />
              <circle cx={lx} cy={ly} r={15} className="planet-hit" />
              <text x={lx} y={ly} className="planet-glyph" textAnchor="middle" dominantBaseline="central">
                {PLANET_GLYPHS[p.name]}
              </text>
              <text x={dx} y={dy} className="planet-deg" textAnchor="middle" dominantBaseline="central">
                {Math.floor(norm360(p.lon) % 30)}°{retro.has(p.name) ? '℞' : ''}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="wheel-caption" aria-live="polite">
        {activeLabel ?? caption ?? (chart.timeKnown ? 'Hover or tap a planet to trace its aspects.' : 'Birth time unknown: houses and angles are hidden; 0° Aries is shown on the left.')}
      </figcaption>
    </figure>
  )
}

function AngleLabel({ xy, lon, label }: { xy: (l: number, r: number) => readonly [number, number]; lon: number; label: string }) {
  const [lx, ly] = xy(lon - 5, R_HOUSE_IN + 34)
  return (
    <text x={lx} y={ly} className="angle-label" textAnchor="middle" dominantBaseline="central">{label}</text>
  )
}
