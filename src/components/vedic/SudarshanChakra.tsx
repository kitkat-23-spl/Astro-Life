import { GRAHA_INFO } from '../../vedic/constants'
import type { VedicChart } from '../../vedic/sidereal'

const C = 210
const RINGS: [number, number][] = [[62, 112], [112, 162], [162, 208]]
const rad = (d: number) => (d * Math.PI) / 180
const at = (r: number, deg: number) => [C + r * Math.cos(rad(deg)), C + r * Math.sin(rad(deg))]

/**
 * Sudarshan Chakra: the chart read from the lagna (inner ring), Moon (middle)
 * and Sun (outer). House 1 of every ring is at the top; houses run anticlockwise.
 */
export default function SudarshanChakra({ chart }: { chart: VedicChart }) {
  const refs: [string, number][] = [
    [chart.lagnaSign !== null ? 'Lagna' : 'Lagna (unknown)', chart.lagnaSign ?? chart.grahas[1].sign],
    ['Moon', chart.grahas[1].sign],
    ['Sun', chart.grahas[0].sign],
  ]
  const centre = (h: number) => -90 - (h - 1) * 30
  return (
    <figure className="sudarshan">
      <svg viewBox="0 0 420 420" role="img" aria-label="Sudarshan Chakra: the chart from the lagna, Moon and Sun">
        {RINGS.slice().reverse().map(([, outer], i) => <circle key={i} cx={C} cy={C} r={outer} className={`sc-ring sc-ring-${2 - i}`} />)}
        <circle cx={C} cy={C} r={RINGS[0][0]} className="sc-core" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = centre(i + 1) + 15
          const [x1, y1] = at(RINGS[0][0], a), [x2, y2] = at(RINGS[2][1], a)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="sc-spoke" />
        })}
        {refs.map(([, ref], ring) => Array.from({ length: 12 }, (_, i) => {
          const sign = (ref + i) % 12
          const [r0, r1] = RINGS[ring]
          const mid = (r0 + r1) / 2
          const planets = chart.grahas.filter((g) => g.sign === sign).map((g) => GRAHA_INFO[g.graha].abbr)
          const [nx, ny] = at(r1 - 9, centre(i + 1) - 10)
          const [px, py] = at(mid + 2, centre(i + 1))
          return (
            <g key={`${ring}-${i}`}>
              <text x={nx} y={ny} className="sc-num" textAnchor="middle" dominantBaseline="central">{sign + 1}</text>
              {planets.length > 0 && (
                <text x={px} y={py} className="sc-planets" textAnchor="middle" dominantBaseline="central" fontSize={planets.length > 2 ? 9 : 11}>
                  {planets.length > 2 ? <><tspan x={px} dy="-0.5em">{planets.slice(0, 2).join(' ')}</tspan><tspan x={px} dy="1.1em">{planets.slice(2).join(' ')}</tspan></> : planets.join(' ')}
                </text>
              )}
            </g>
          )
        }))}
        <text x={C} y={C - 8} className="sc-title" textAnchor="middle">Sudarshan</text>
        <text x={C} y={C + 10} className="sc-title" textAnchor="middle">Chakra</text>
      </svg>
      <figcaption className="vchart-cap">Inner ring: lagna · Middle: Moon · Outer: Sun. Numbers are signs (1 = Aries).</figcaption>
    </figure>
  )
}
