import { RASHI } from '../../vedic/constants'
import { signName } from '../../vedic/sidereal'

export type ChartStyle = 'north' | 'south'

export interface ChartItem {
  sign: number
  label: string
  title: string // full description for tooltips / screen readers
  tone?: 'up' | 'down' | 'asc'
}

interface Props {
  style: ChartStyle
  lagnaSign: number
  items: ChartItem[]
  title: string
  subtitle?: string
  lagnaIsMoon?: boolean
  compact?: boolean
}

const S = 400

/** North Indian: houses are fixed (1st at top), signs rotate. */
const P = { A: [0, 0], B: [S, 0], C: [S, S], D: [0, S], T: [S / 2, 0], R: [S, S / 2], Bm: [S / 2, S], L: [0, S / 2], O: [S / 2, S / 2], P1: [S / 4, S / 4], P2: [(3 * S) / 4, S / 4], P3: [(3 * S) / 4, (3 * S) / 4], P4: [S / 4, (3 * S) / 4] } as const
type K = keyof typeof P
const NORTH_HOUSES: K[][] = [
  ['T', 'P2', 'O', 'P1'], ['A', 'T', 'P1'], ['A', 'P1', 'L'], ['L', 'P1', 'O', 'P4'], ['L', 'P4', 'D'], ['D', 'P4', 'Bm'],
  ['Bm', 'P4', 'O', 'P3'], ['Bm', 'P3', 'C'], ['C', 'P3', 'R'], ['R', 'P3', 'O', 'P2'], ['R', 'P2', 'B'], ['B', 'P2', 'T'],
]
/** Items per row by house shape: diamonds are wide, side triangles are narrow. */
const NORTH_PER_ROW = [2, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2]

/** South Indian: signs are fixed in a 4×4 ring, starting with Pisces top-left. */
const SOUTH_CELL: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [3, 0], [2, 0], [1, 0], [0, 0],
] // [row, col] for Aries..Pisces

function centroid(pts: readonly (readonly number[])[]) {
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length]
}

function ItemsBlock({ items, cx, cy, perRow, size }: { items: ChartItem[]; cx: number; cy: number; perRow: number; size: number }) {
  const rows: ChartItem[][] = []
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow))
  const lh = size * 1.35
  const top = cy - ((rows.length - 1) * lh) / 2
  const colW = size * 4.1
  return (
    <>
      {rows.map((row, ri) =>
        row.map((it, ci) => (
          <text
            key={it.label + ri + ci}
            x={cx + (ci - (row.length - 1) / 2) * colW}
            y={top + ri * lh}
            className={`vc-item ${it.tone ?? ''}`}
            fontSize={size}
            textAnchor="middle"
            dominantBaseline="central"
          >
            <title>{it.title}</title>
            {it.label}
          </text>
        )),
      )}
    </>
  )
}

export default function SquareChart({ style, lagnaSign, items, title, subtitle, lagnaIsMoon, compact }: Props) {
  const size = compact ? 15 : 13
  const label = `${title}: ${style === 'north' ? 'North' : 'South'} Indian chart, lagna ${signName(lagnaSign)}. ` +
    items.filter((i) => i.tone !== 'asc').map((i) => i.title).join('; ')

  return (
    <figure className={`vchart ${compact ? 'compact' : ''}`}>
      <svg viewBox={`-2 -2 ${S + 4} ${S + 4}`} role="img" aria-label={label}>
        <rect x={0} y={0} width={S} height={S} className="vc-frame" />
        {style === 'north' ? (
          <>
            <line x1={0} y1={0} x2={S} y2={S} className="vc-line" />
            <line x1={S} y1={0} x2={0} y2={S} className="vc-line" />
            <polygon points={`${S / 2},0 ${S},${S / 2} ${S / 2},${S} 0,${S / 2}`} className="vc-line" fill="none" />
            <polygon points={NORTH_HOUSES[0].map((k) => P[k].join(',')).join(' ')} className="vc-lagna" />
            {NORTH_HOUSES.map((poly, i) => {
              const pts = poly.map((k) => P[k])
              const [cx, cy] = centroid(pts)
              const sign = (lagnaSign + i) % 12
              // Sign number sits toward the house's innermost corner.
              const inner = pts.reduce((best, p) => (Math.hypot(p[0] - S / 2, p[1] - S / 2) < Math.hypot(best[0] - S / 2, best[1] - S / 2) ? p : best))
              const nx = cx + (inner[0] - cx) * 0.62
              const ny = cy + (inner[1] - cy) * 0.62
              const here = items.filter((it) => it.sign === sign)
              return (
                <g key={i}>
                  <text x={nx} y={ny} className="vc-num" textAnchor="middle" dominantBaseline="central">
                    <title>{`House ${i + 1}: ${RASHI[signName(sign)]} (${signName(sign)})`}</title>
                    {sign + 1}
                  </text>
                  <ItemsBlock items={here} cx={cx + (cx - nx) * 0.12} cy={cy + (cy - ny) * 0.12} perRow={NORTH_PER_ROW[i]} size={size} />
                </g>
              )
            })}
          </>
        ) : (
          <>
            {SOUTH_CELL.map(([r, c], sign) => {
              const x = c * 100, y = r * 100
              const here = items.filter((it) => it.sign === sign)
              const isLagna = sign === lagnaSign
              return (
                <g key={sign}>
                  <rect x={x} y={y} width={100} height={100} className={`vc-cell ${isLagna ? 'vc-lagna' : ''}`} />
                  {isLagna && <line x1={x} y1={y + 22} x2={x + 22} y2={y} className="vc-line strong" />}
                  <text x={x + 94} y={y + 12} className="vc-num" textAnchor="end" dominantBaseline="central">
                    <title>{`${RASHI[signName(sign)]} (${signName(sign)})`}</title>
                    {RASHI[signName(sign)].slice(0, 3)}
                  </text>
                  <ItemsBlock items={here} cx={x + 50} cy={y + 58} perRow={here.length > 4 ? 2 : 1} size={here.length > 4 ? size - 2 : size} />
                </g>
              )
            })}
            <rect x={100} y={100} width={200} height={200} className="vc-center" />
          </>
        )}
        {style === 'south' && (
          <>
            <text x={200} y={188} className="vc-title" textAnchor="middle">{title}</text>
            {subtitle && <text x={200} y={214} className="vc-sub" textAnchor="middle">{subtitle}</text>}
          </>
        )}
      </svg>
      {style === 'north' && (
        <figcaption className="vchart-cap">
          <strong>{title}</strong>{subtitle ? ` · ${subtitle}` : ''}
        </figcaption>
      )}
      {lagnaIsMoon && <p className="muted small center">Birth time unknown: the Moon’s sign is used as the lagna (Chandra lagna).</p>}
    </figure>
  )
}
