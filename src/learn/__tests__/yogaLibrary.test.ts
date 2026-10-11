import { describe, expect, it } from 'vitest'
import { YOGAS, evaluateYogas } from '../../vedic/yogas'
import { exampleChart } from '../exampleChart'
import { LESSONS } from '../lessons'
import type { Block } from '../types'

const blocks = LESSONS.flatMap((l) => l.blocks.map((b) => ({ lesson: l.slug, b })))
const yogaBlocks = blocks.flatMap(({ lesson, b }) => (b.type === 'yoga' ? [{ lesson, b: b as Extract<Block, { type: 'yoga' }> }] : []))

describe('yoga library', () => {
  it('covers every yoga in the engine exactly once', () => {
    const ids = yogaBlocks.map((y) => y.b.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual(YOGAS.map((y) => y.id).sort())
  })

  it('each example chart forms its yoga, checked by the engine', () => {
    const failures = yogaBlocks.flatMap(({ lesson, b }) => {
      const r = evaluateYogas(exampleChart(b.spec)).find((x) => x.def.id === b.id)!
      return r.present ? [] : [`${lesson}: ${b.id}${r.supersededBy ? ` (overridden by ${r.supersededBy})` : ''}`]
    })
    expect(failures).toEqual([])
  })

  it('each example shows the yoga in its intended tone', () => {
    const off = yogaBlocks.flatMap(({ b }) => {
      const r = evaluateYogas(exampleChart(b.spec)).find((x) => x.def.id === b.id)!
      const m = r.matches.find((x) => b.highlight.every((g) => x.basis.join(' ').includes(g))) ?? r.matches[0]
      return m?.tone && m.tone !== r.def.tone ? [`${b.id}: ${m.tone}`] : []
    })
    expect(off).toEqual([])
  })

  it('every chart block parses into a full chart', () => {
    for (const { b } of blocks) if (b.type === 'chart') expect(exampleChart(b.spec).grahas).toHaveLength(9)
  })
})

describe('lesson expansions', () => {
  it('every expansion targets a lesson in the course', async () => {
    const { EXPANSIONS } = await import('../expansions')
    for (const slug of Object.keys(EXPANSIONS)) expect(LESSONS.some((l) => l.slug === slug), slug).toBe(true)
  })
})

describe('claims made in chart captions', () => {
  const chartIn = (slug: string, title: string) => {
    const b = LESSONS.find((l) => l.slug === slug)!.blocks.find((x) => x.type === 'chart' && x.title === title)
    if (!b || b.type !== 'chart') throw new Error(`${slug}: ${title}`)
    return exampleChart(b.spec)
  }
  const present = (slug: string, title: string) => new Set(evaluateYogas(chartIn(slug, title)).filter((r) => r.present).map((r) => r.def.id))
  const cases: [string, string, string[], string[]?][] = [
    ['vedic-yogas', 'Several yogas in one chart', ['raja', 'gajakesari', 'mp-hamsa', 'mp-ruchaka', 'lakshmi']],
    ['vedic-bhavas', 'Judging the 4th house (home, mother, comfort)', ['gajakesari', 'raja']],
    ['vedic-synthesis', 'An eight-step reading', ['mp-hamsa', 'mp-ruchaka', 'mp-shasha', 'raja'], ['mp-malavya']],
    ['vedic-conjunctions', 'A crowded house', ['pravrajya', 'raja']],
    ['vedic-grahas-bhavas', 'Following three lords', ['dhana']],
    ['vedic-career', 'Career reading, step by step', ['dharma-karma']],
    ['vedic-functional', 'Vrishabha lagna: why Saturn is the best friend', ['yogakaraka']],
    ['vedic-dashas', 'Which dashas will matter in this chart?', ['mp-malavya', 'yogakaraka']],
    ['vedic-planets-in-houses', 'Reading three placements together', ['gajakesari']],
  ]
  it.each(cases)('%s: %s', (slug, title, yes, no = []) => {
    const p = present(slug, title)
    for (const id of yes) expect(p.has(id), id).toBe(true)
    for (const id of no) expect(p.has(id), id).toBe(false)
  })
  it('combustion claims hold', () => {
    const g = (slug: string, title: string, name: string) => chartIn(slug, title).grahas.find((x) => x.graha === name)!
    expect(g('vedic-strength', 'A quick strength grading', 'Mercury').combust).toBe(true)
    expect(g('vedic-conjunctions', 'A crowded house', 'Mercury').combust).toBe(false)
    expect(g('vedic-synthesis', 'An eight-step reading', 'Mars').combust).toBe(false)
  })
})
