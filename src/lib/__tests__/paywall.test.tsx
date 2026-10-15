import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ChartAccessContext } from '../../components/paywall/ChartAccess'
import ToneBoard, { freePreview, type BoardItem } from '../../components/ToneBoard'
import { AuthProvider } from '../auth'
import { EntitlementsProvider } from '../entitlements'
import { PACKS, birthKey, safeReturn, scramble } from '../paywall'
import server from '../../../supabase/functions/_shared/common.ts?raw'
import sql from '../../../supabase/migrations/20261015000000_chart_credits.sql?raw'

const birth = { date: '1990-05-17', time: '06:30', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' }

describe('birthKey', () => {
  it('is the same for the same person and changes when any detail changes', () => {
    expect(birthKey(birth)).toBe(birthKey({ ...birth, latitude: 12.9749 }))
    expect(birthKey(birth)).not.toBe(birthKey({ ...birth, time: '06:31' }))
    expect(birthKey(birth)).not.toBe(birthKey({ ...birth, date: '1990-05-18' }))
    expect(birthKey(birth)).not.toBe(birthKey({ ...birth, longitude: 77.7 }))
    expect(birthKey(birth).length).toBeGreaterThanOrEqual(10)
  })
})

describe('scramble', () => {
  it('is deterministic per seed and has the requested number of words', () => {
    expect(scramble('a', 12)).toBe(scramble('a', 12))
    expect(scramble('a', 12)).not.toBe(scramble('b', 12))
    expect(scramble('a', 12).split(' ')).toHaveLength(12)
  })
})

describe('safeReturn', () => {
  it('allows same-site paths only', () => {
    expect(safeReturn('/chart/career#abc')).toBe('/chart/career#abc')
    expect(safeReturn('//evil.example')).toBeNull()
    expect(safeReturn('/\\evil.example')).toBeNull()
    expect(safeReturn('https://evil.example')).toBeNull()
    expect(safeReturn(null)).toBeNull()
  })
})

describe('packs', () => {
  it('match the prices the payment server charges', () => {
    for (const p of PACKS) {
      const m = server.match(new RegExp(`${p.id}: \\{ credits: (\\d+), paise: (\\d+)`))
      expect(m, p.id).not.toBeNull()
      expect(Number(m![1])).toBe(p.credits)
      expect(Number(m![2])).toBe(p.rupees * 100)
    }
    for (const p of PACKS) expect(sql).toContain(`'${p.id}'`)
  })
})

const item = (id: string, tone: BoardItem['tone']): BoardItem => ({ id, tone, node: <p>REAL-{id}</p> })
const items = [item('m1', 'mixed'), item('g1', 'good'), item('g2', 'good'), item('c1', 'challenge'), item('c2', 'challenge')]

describe('free preview', () => {
  it('keeps the first supportive and the first caution readable', () => {
    expect(freePreview(items)).toEqual(['g1', 'c1'])
    expect(freePreview([item('m1', 'mixed'), item('m2', 'mixed'), item('m3', 'mixed')])).toEqual(['m1', 'm2'])
  })

  const render = (locked: boolean) => renderToStaticMarkup(
    <MemoryRouter>
      <AuthProvider>
        <EntitlementsProvider>
          <ChartAccessContext.Provider value={{ locked, birth: { ...birth, name: 'Test', place: 'Bengaluru' } as never }}>
            <ToneBoard items={items} />
          </ChartAccessContext.Provider>
        </EntitlementsProvider>
      </AuthProvider>
    </MemoryRouter>,
  )

  it('leaves locked readings out of the page entirely', () => {
    const html = render(true)
    expect(html).toContain('REAL-g1')
    expect(html).toContain('REAL-c1')
    for (const id of ['m1', 'g2', 'c2']) expect(html).not.toContain(`REAL-${id}`)
    expect(html).toContain('3 more rules')
  })

  it('shows everything when the chart is unlocked', () => {
    const html = render(false)
    for (const i of items) expect(html).toContain(`REAL-${i.id}`)
    expect(html).not.toContain('more rules')
  })
})
