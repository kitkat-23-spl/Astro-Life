import {
  PLANET_GLYPHS, SIGNS, formatDegree, ordinal, signOf,
  type Element, type Modality, type PlanetName, type PointName, type SignName,
} from '../astro/constants'
import { placementOf, type Aspect, type Chart, type Placement } from '../astro/ephemeris'
import { ASPECT_TEXT, PAIR_THEME, POINT_NOUN, pairKey } from './aspects'
import { HOUSE_TEXT } from './houses'
import { PLANET_IN_SIGN, PLANET_TEXT } from './planets'
import { SIGN_TEXT } from './signs'

export type InsightCategory = 'core' | 'placement' | 'aspect' | 'pattern' | 'balance' | 'direction'

/**
 * A single interpretation. Every insight carries the rule that produced it,
 * so readers can see exactly why they are being told something.
 */
export interface Insight {
  id: string
  category: InsightCategory
  title: string
  subtitle?: string
  body: string[]
  rule: string
  /** The concrete chart combinations that produced this reading. */
  basis?: string[]
  lesson?: string // slug in the learning section
  weight: number // higher = more central to the chart
  point?: PointName
}

export interface Balance<K extends string> {
  scores: Record<K, number>
  percent: Record<K, number>
  dominant: K
  weakest: K
}

export interface Trait {
  label: string
  value: number // 0..100
  description: string
}

export interface Reading {
  bigThree: { sun: Placement; moon: Placement; rising: SignName | null }
  elements: Balance<Element>
  modalities: Balance<Modality>
  traits: Trait[]
  insights: Insight[]
  chartRuler: PlanetName | null
  headline: string
}

const WEIGHTS: Partial<Record<PointName, number>> = {
  Sun: 3, Moon: 3, Ascendant: 3, Mercury: 2, Venus: 2, Mars: 2, Jupiter: 1, Saturn: 1,
  Uranus: 0.5, Neptune: 0.5, Pluto: 0.5, Midheaven: 1,
}

const SIGN_BY_NAME = Object.fromEntries(SIGNS.map((s) => [s.name, s])) as Record<SignName, (typeof SIGNS)[number]>

function balance<K extends string>(keys: K[], pick: (sign: SignName) => K, points: { sign: SignName; weight: number }[]): Balance<K> {
  const scores = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>
  for (const p of points) scores[pick(p.sign)] += p.weight
  const total = keys.reduce((s, k) => s + scores[k], 0) || 1
  const percent = Object.fromEntries(keys.map((k) => [k, Math.round((scores[k] / total) * 100)])) as Record<K, number>
  const sorted = [...keys].sort((a, b) => scores[b] - scores[a])
  return { scores, percent, dominant: sorted[0], weakest: sorted[sorted.length - 1] }
}

const ELEMENT_MEANING: Record<Element, { strong: string; weak: string; trait: string }> = {
  Fire: {
    strong: 'Fire dominates your chart: you are energised by inspiration, action and enthusiasm, and you tend to lead with spirit and confidence.',
    weak: 'Fire is scarce in your chart, so motivation may come less from spontaneous enthusiasm and more from purpose or necessity. Deliberately doing things that excite you helps you recharge.',
    trait: 'Drive',
  },
  Earth: {
    strong: 'Earth dominates your chart: you are practical, grounded and focused on real, tangible results.',
    weak: 'Earth is scarce in your chart, so routines, money and the body may need conscious attention. Simple structures help your ideas land in reality.',
    trait: 'Groundedness',
  },
  Air: {
    strong: 'Air dominates your chart: you live in the world of ideas, conversation and connections between people.',
    weak: 'Air is scarce in your chart, so you may trust instinct or feeling over detached analysis. Talking things through or writing them down can bring welcome perspective.',
    trait: 'Curiosity',
  },
  Water: {
    strong: 'Water dominates your chart: you are emotionally perceptive, intuitive and deeply affected by the people around you.',
    weak: 'Water is scarce in your chart, so emotions may feel unfamiliar or be handled logically. Giving feelings time and space deepens your relationships.',
    trait: 'Sensitivity',
  },
}

const MODALITY_MEANING: Record<Modality, { strong: string; trait: string }> = {
  Cardinal: { strong: 'Cardinal signs lead your chart: you are an initiator who likes to start things and set the direction.', trait: 'Initiative' },
  Fixed: { strong: 'Fixed signs lead your chart: you are persistent, loyal and able to stay the course long after others give up.', trait: 'Persistence' },
  Mutable: { strong: 'Mutable signs lead your chart: you are adaptable and versatile, and you are good at adjusting as circumstances change.', trait: 'Adaptability' },
}

const DIGNITY_TEXT = {
  domicile: 'is in its home sign (domicile), so this energy expresses itself naturally and with strength.',
  exaltation: 'is exalted here, so this energy is honoured and tends to show its best qualities.',
  detriment: 'is in detriment, far from home, so this energy works in an unfamiliar style. That brings challenge but also a distinctive, hard-won skill.',
  fall: 'is in its fall, so this energy may feel less confident at first and grows stronger with conscious development.',
} as const

function placementInsight(p: Placement): Insight {
  const pt = PLANET_TEXT[p.name]
  const st = SIGN_TEXT[p.sign]
  const body: string[] = []
  const custom = PLANET_IN_SIGN[p.name]?.[p.sign]
  const rules: string[] = [`${p.name} in ${p.sign}`]

  if (p.name === 'Sun') body.push(st.sun)
  else if (p.name === 'Moon') body.push(st.moon)
  else if (custom) body.push(custom)
  else body.push(`${capitalise(pt.domain)} operates ${st.style}.`)

  if (pt.generational) {
    body.push(`${p.name} moves slowly, so everyone born within a few years of you shares this sign placement. Its house position and aspects are what make it personal to you.`)
  }

  if (p.dignity) {
    body.push(`${p.name} ${DIGNITY_TEXT[p.dignity]}`)
    rules.push(`essential dignity: ${p.dignity}`)
  }

  if (p.house) {
    const h = HOUSE_TEXT[p.house - 1]
    body.push(`In the ${ordinal(p.house)} house (${h.area}): ${h.theme}`)
    rules.push(`${ordinal(p.house)} house`)
  }

  if (p.retrograde) {
    body.push(`${p.name} was retrograde (apparently moving backward) at your birth. Its themes tend to be processed inwardly first and revisited over time before they are expressed outwardly.`)
    rules.push('retrograde')
  }

  const weight = (WEIGHTS[p.name] ?? 0.5) + (p.dignity === 'domicile' || p.dignity === 'exaltation' ? 0.5 : 0) + (p.house === 1 || p.house === 10 ? 0.5 : 0)
  const glyph = PLANET_GLYPHS[p.name]
  return {
    id: `placement-${p.name}`,
    category: 'placement',
    title: `${p.name} in ${p.sign}${p.house ? ` · ${ordinal(p.house)} house` : ''}`,
    subtitle: `${glyph} ${formatDegree(p.longitude)} ${p.sign}${p.retrograde ? ' ℞' : ''} · ${pt.question}`,
    body,
    rule: rules.join(' + '),
    basis: rules,
    lesson: p.house ? 'houses' : 'planets',
    weight,
    point: p.name,
  }
}

function aspectInsight(a: Aspect): Insight {
  const t = ASPECT_TEXT[a.type.name]
  const theme = PAIR_THEME[pairKey(a.a, a.b)]
  const body = [
    `Your ${POINT_NOUN[a.a]} (${a.a}) and your ${POINT_NOUN[a.b]} (${a.b}) ${t.verb}.`,
    ...(theme ? [theme] : []),
    t.meaning,
  ]
  const tight = a.orb < 2
  if (tight) body.push(`At ${a.orb.toFixed(1)}° from exact, this is one of the tightest, and therefore strongest, aspects in your chart.`)
  const w = (WEIGHTS[a.a] ?? 0.5) + (WEIGHTS[a.b] ?? 0.5)
  return {
    id: `aspect-${a.a}-${a.b}`,
    basis: [`${a.a} ${a.type.name.toLowerCase()} ${a.b}`, `orb ${a.orb.toFixed(1)}°`, a.applying ? 'applying' : 'separating'],
    category: 'aspect',
    title: `${a.a} ${a.type.glyph} ${a.b}`,
    subtitle: `${a.type.name} · orb ${a.orb.toFixed(1)}° · ${a.applying ? 'applying' : 'separating'}`,
    body,
    rule: `${a.type.name} (${a.type.angle}°) within ${a.orb.toFixed(1)}° orb`,
    lesson: 'aspects',
    weight: w * (1 + (8 - Math.min(a.orb, 8)) / 8),
  }
}

function findPatterns(chart: Chart): Insight[] {
  const out: Insight[] = []
  const planets = chart.placements.filter((p) => p.name !== 'North Node')

  // Stelliums: 3+ planets in one sign or house.
  const bySign = groupBy(planets, (p) => p.sign)
  for (const [sign, ps] of Object.entries(bySign)) {
    if (ps.length >= 3) {
      const st = SIGN_TEXT[sign as SignName]
      out.push({
        id: `stellium-sign-${sign}`,
        category: 'pattern',
        title: `Stellium in ${sign}`,
        subtitle: ps.map((p) => PLANET_GLYPHS[p.name]).join(' '),
        body: [
          `${ps.length} planets (${ps.map((p) => p.name).join(', ')}) gather in ${sign}. This concentrates a lot of life energy in one style: ${st.keywords.join(', ')}.`,
          `Expect ${sign} qualities to be a defining theme, even more than your Sun sign might suggest. ${st.essence}`,
        ],
        rule: '3 or more planets in the same sign',
        basis: ps.map((p) => `${p.name} in ${sign}`),
        lesson: 'aspect-patterns',
        weight: 5 + ps.length,
      })
    }
  }
  if (chart.cusps) {
    const byHouse = groupBy(planets, (p) => String(p.house))
    for (const [house, ps] of Object.entries(byHouse)) {
      if (ps.length >= 3) {
        const h = HOUSE_TEXT[Number(house) - 1]
        out.push({
          id: `stellium-house-${house}`,
          category: 'pattern',
          title: `Stellium in the ${ordinal(Number(house))} house`,
          subtitle: `${h.title} · ${ps.map((p) => PLANET_GLYPHS[p.name]).join(' ')}`,
          body: [`${ps.length} planets (${ps.map((p) => p.name).join(', ')}) fall in the house of ${h.area}. A large share of your life focus and experience will centre on this area.`],
          rule: '3 or more planets in the same house',
          basis: ps.map((p) => `${p.name} in the ${ordinal(Number(house))} house`),
          lesson: 'aspect-patterns',
          weight: 5 + ps.length,
        })
      }
    }
  }

  // Grand trine / T-square / Grand cross among the 10 planets + angles.
  const has = (x: PointName, y: PointName, name: string) =>
    chart.aspects.some((a) => a.type.name === name && ((a.a === x && a.b === y) || (a.a === y && a.b === x)))
  const names = planets.map((p) => p.name) as PointName[]

  const seenTrine = new Set<string>()
  const seenT = new Set<string>()
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      for (let k = j + 1; k < names.length; k++) {
        const [a, b, c] = [names[i], names[j], names[k]]
        if (has(a, b, 'Trine') && has(b, c, 'Trine') && has(a, c, 'Trine')) {
          const key = [a, b, c].join()
          if (seenTrine.has(key)) continue
          seenTrine.add(key)
          const el = signOf(placementOf(chart, a)!.longitude).element
          out.push({
            id: `grand-trine-${key}`,
            category: 'pattern',
            title: `Grand Trine in ${el}`,
            subtitle: `${a} △ ${b} △ ${c}`,
            body: [
              `${a}, ${b} and ${c} form an equilateral triangle, a closed circuit of easy, harmonious energy in the ${el} element.`,
              'This is a real gift, and it can also be a comfort zone. Talents here come so easily that they reach their potential only when you consciously put them to work.',
            ],
            rule: 'three planets each 120° apart',
            basis: [`${a} trine ${b}`, `${b} trine ${c}`, `${a} trine ${c}`],
            lesson: 'aspect-patterns',
            weight: 8,
          })
        }
        // T-square: an opposition with a third planet square to both.
        for (const [x, y, apex] of [[a, b, c], [a, c, b], [b, c, a]] as [PointName, PointName, PointName][]) {
          if (has(x, y, 'Opposition') && has(x, apex, 'Square') && has(y, apex, 'Square')) {
            const key = [x, y, apex].sort().join()
            if (seenT.has(key)) continue
            seenT.add(key)
            out.push({
              id: `t-square-${key}`,
              category: 'pattern',
              title: `T-Square with ${apex} at the apex`,
              subtitle: `${x} ☍ ${y}, both □ ${apex}`,
              body: [
                `${x} and ${y} oppose each other, and both square ${apex}. The tension of the opposition is channelled through ${apex}, which becomes a powerful engine and focal point in your life.`,
                `Your ${POINT_NOUN[apex]} is where you work hardest and, over time, achieve the most.`,
              ],
              rule: 'opposition + two squares to a third planet',
              basis: [`${x} opposite ${y}`, `${x} square ${apex}`, `${y} square ${apex}`],
              lesson: 'aspect-patterns',
              weight: 8,
            })
          }
        }
      }
    }
  }
  return out
}

function groupBy<T>(items: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const i of items) (out[key(i)] ??= []).push(i)
  return out
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function interpret(chart: Chart): Reading {
  const sun = chart.placements.find((p) => p.name === 'Sun')!
  const moon = chart.placements.find((p) => p.name === 'Moon')!
  const risingSign = chart.ascendant !== null ? signOf(chart.ascendant).name : null

  const weighted: { sign: SignName; weight: number }[] = chart.placements
    .filter((p) => WEIGHTS[p.name])
    .map((p) => ({ sign: p.sign, weight: WEIGHTS[p.name]! }))
  if (risingSign) weighted.push({ sign: risingSign, weight: WEIGHTS.Ascendant! })
  if (chart.midheaven !== null) weighted.push({ sign: signOf(chart.midheaven).name, weight: WEIGHTS.Midheaven! })

  const elements = balance<Element>(['Fire', 'Earth', 'Air', 'Water'], (s) => SIGN_BY_NAME[s].element, weighted)
  const modalities = balance<Modality>(['Cardinal', 'Fixed', 'Mutable'], (s) => SIGN_BY_NAME[s].modality, weighted)

  const insights: Insight[] = []

  // --- Core: Big Three -----------------------------------------------------
  insights.push({
    id: 'core-sun', category: 'core', point: 'Sun', basis: [`Sun in ${sun.sign}`, ...(sun.house ? [`${ordinal(sun.house)} house`] : [])],
    title: `Sun in ${sun.sign}: your core self`,
    subtitle: SIGN_TEXT[sun.sign].keywords.join(' · '),
    body: [SIGN_TEXT[sun.sign].essence, SIGN_TEXT[sun.sign].sun],
    rule: 'The Sun’s sign describes identity and life purpose',
    lesson: 'big-three', weight: 10,
  })
  const moonNote = chart.timeKnown ? [] : ['Your birth time is unknown, and the Moon moves about 13° a day, so if it sits near the edge of a sign, check the neighbouring sign too.']
  insights.push({
    id: 'core-moon', category: 'core', point: 'Moon', basis: [`Moon in ${moon.sign}`, ...(moon.house ? [`${ordinal(moon.house)} house`] : [])],
    title: `Moon in ${moon.sign}: your emotional world`,
    subtitle: SIGN_TEXT[moon.sign].keywords.join(' · '),
    body: [SIGN_TEXT[moon.sign].moon, ...moonNote],
    rule: 'The Moon’s sign describes emotional needs and instincts',
    lesson: 'big-three', weight: 9.5,
  })
  if (risingSign) {
    insights.push({
      id: 'core-rising', category: 'core', point: 'Ascendant', basis: [`Ascendant in ${risingSign}`],
      title: `${risingSign} Rising: how you meet the world`,
      subtitle: `Ascendant ${formatDegree(chart.ascendant!)} ${risingSign}`,
      body: [SIGN_TEXT[risingSign].rising],
      rule: 'The sign on the eastern horizon at birth (Ascendant)',
      lesson: 'big-three', weight: 9,
    })
  }

  // --- Chart ruler ---------------------------------------------------------
  let chartRuler: PlanetName | null = null
  if (risingSign) {
    chartRuler = SIGN_BY_NAME[risingSign].ruler
    const r = chart.placements.find((p) => p.name === chartRuler)!
    insights.push({
      id: 'chart-ruler', category: 'direction', point: chartRuler, basis: [`${risingSign} rising`, `ruled by ${chartRuler}`, `${chartRuler} in ${r.sign}`, ...(r.house ? [`${ordinal(r.house)} house`] : [])],
      title: `Chart ruler: ${chartRuler} in ${r.sign}${r.house ? `, ${ordinal(r.house)} house` : ''}`,
      subtitle: `${risingSign} rising is ruled by ${chartRuler}`,
      body: [
        `The planet ruling your rising sign acts like the captain of your chart. ${capitalise(PLANET_TEXT[chartRuler].domain)} becomes a central thread in your whole life story.`,
        `Because it sits in ${r.sign}, you steer your life ${SIGN_TEXT[r.sign].style}.` +
          (r.house ? ` Its placement in the ${ordinal(r.house)} house points your life toward ${HOUSE_TEXT[r.house - 1].area}.` : ''),
      ],
      rule: 'Traditional ruler of the Ascendant sign',
      lesson: 'rulership', weight: 8.5,
    })
  }

  // --- Element & modality balance -------------------------------------------
  insights.push({
    id: 'balance-element', category: 'balance',
    title: `Elemental emphasis: ${elements.dominant}`,
    subtitle: (['Fire', 'Earth', 'Air', 'Water'] as Element[]).map((e) => `${e} ${elements.percent[e]}%`).join(' · '),
    body: [
      ELEMENT_MEANING[elements.dominant].strong,
      ...(elements.percent[elements.weakest] <= 12 ? [ELEMENT_MEANING[elements.weakest].weak] : []),
    ],
    rule: 'Weighted count: Sun, Moon, Asc ×3; Mercury, Venus, Mars ×2; Jupiter, Saturn, MC ×1; outer planets ×0.5',
    basis: (['Fire', 'Earth', 'Air', 'Water'] as Element[]).map((e) => `${e} ${elements.percent[e]}%`),
    lesson: 'elements-modalities', weight: 7,
  })
  insights.push({
    id: 'balance-modality', category: 'balance',
    title: `Modal emphasis: ${modalities.dominant}`,
    subtitle: (['Cardinal', 'Fixed', 'Mutable'] as Modality[]).map((m) => `${m} ${modalities.percent[m]}%`).join(' · '),
    body: [MODALITY_MEANING[modalities.dominant].strong],
    rule: 'Same weighting as elements, grouped by modality',
    basis: (['Cardinal', 'Fixed', 'Mutable'] as Modality[]).map((m) => `${m} ${modalities.percent[m]}%`),
    lesson: 'elements-modalities', weight: 6.5,
  })

  // --- Hemispheres ---------------------------------------------------------
  if (chart.cusps) {
    const planets = chart.placements.filter((p) => p.name !== 'North Node' && p.house)
    const above = planets.filter((p) => p.house! >= 7).length
    const east = planets.filter((p) => p.house! >= 10 || p.house! <= 3).length
    const lines: string[] = []
    if (above >= 7) lines.push('Most of your planets are above the horizon: much of your life plays out in public, and you are oriented toward the wider world and career.')
    else if (above <= 3) lines.push('Most of your planets are below the horizon: your life is oriented toward private experience, inner development, family and personal foundations.')
    if (east >= 7) lines.push('Most of your planets are in the eastern hemisphere: you are self-directed and prefer to shape your own destiny.')
    else if (east <= 3) lines.push('Most of your planets are in the western hemisphere: you grow through others, collaboration and responding to what life brings you.')
    if (lines.length) {
      insights.push({
        id: 'hemispheres', category: 'balance', title: 'Hemisphere emphasis',
        subtitle: `${above} of ${planets.length} above horizon · ${east} of ${planets.length} in the east`,
        body: lines, rule: 'Count of planets by chart hemisphere (7+ of 10 = strong emphasis)',
        basis: [`${above} planets above the horizon`, `${east} planets in the east`],
        lesson: 'houses', weight: 5,
      })
    }
  }

  // --- Nodes ---------------------------------------------------------------
  const node = chart.placements.find((p) => p.name === 'North Node')!
  const southSign = signOf(node.longitude + 180).name
  insights.push({
    id: 'nodes', category: 'direction', point: 'North Node', basis: [`North Node in ${node.sign}`, `South Node in ${southSign}`, ...(node.house ? [`${ordinal(node.house)} house`] : [])],
    title: `North Node in ${node.sign}: your growth direction`,
    subtitle: `South Node in ${southSign}`,
    body: [
      `The South Node in ${southSign} represents familiar strengths and default habits (${SIGN_TEXT[southSign].keywords.slice(0, 2).join(', ')}). They are comfortable, but relying on them alone can leave you feeling stuck.`,
      `The North Node in ${node.sign} points toward growth through ${SIGN_TEXT[node.sign].keywords.join(', ')}. It feels unfamiliar, yet it is deeply fulfilling as you lean into it over time.`,
      ...(node.house ? [`Its ${ordinal(node.house)}-house placement suggests this growth happens through ${HOUSE_TEXT[node.house - 1].area}.`] : []),
    ],
    rule: 'Mean lunar node; South Node is the opposite point',
    lesson: 'nodes', weight: 6,
  })

  // --- Planet placements ---------------------------------------------------
  for (const p of chart.placements) {
    if (p.name === 'North Node') continue
    insights.push(placementInsight(p))
  }
  if (chart.midheaven !== null) {
    const mcSign = signOf(chart.midheaven).name
    insights.push({
      id: 'placement-Midheaven', category: 'placement', point: 'Midheaven',
      title: `Midheaven in ${mcSign}`,
      subtitle: `MC ${formatDegree(chart.midheaven)} ${mcSign} · What am I here to build publicly?`,
      body: [`Your public path and vocation are shaped by ${mcSign}: you are drawn to be known for ${SIGN_TEXT[mcSign].keywords.slice(0, 3).join(', ')}. You build a reputation ${SIGN_TEXT[mcSign].style}.`],
      rule: 'Sign on the Midheaven (cusp of the 10th house region)',
      basis: [`Midheaven in ${mcSign}`],
      lesson: 'angles', weight: 4,
    })
  }

  // --- Aspects & patterns --------------------------------------------------
  for (const a of chart.aspects) insights.push(aspectInsight(a))
  insights.push(...findPatterns(chart))

  // --- Traits (creative summary scores) ------------------------------------
  const traits: Trait[] = [
    ...(['Fire', 'Earth', 'Air', 'Water'] as Element[]).map((e) => ({
      label: ELEMENT_MEANING[e].trait, value: scale(elements.percent[e], 45),
      description: `${e} signs: ${elements.percent[e]}% of your weighted chart`,
    })),
    ...(['Cardinal', 'Fixed', 'Mutable'] as Modality[]).map((m) => ({
      label: MODALITY_MEANING[m].trait, value: scale(modalities.percent[m], 60),
      description: `${m} signs: ${modalities.percent[m]}% of your weighted chart`,
    })),
    {
      label: 'Inner Harmony',
      value: harmonyScore(chart.aspects),
      description: 'Share of flowing (trine, sextile) vs. tense (square, opposition) aspects',
    },
  ]

  const headline = `${sun.sign} Sun · ${moon.sign} Moon${risingSign ? ` · ${risingSign} Rising` : ''}`
  insights.sort((a, b) => b.weight - a.weight)
  return { bigThree: { sun, moon, rising: risingSign }, elements, modalities, traits, insights, chartRuler, headline }
}

function scale(percent: number, max: number) {
  return Math.min(100, Math.round((percent / max) * 100))
}

function harmonyScore(aspects: Aspect[]) {
  let flow = 0, tension = 0
  for (const a of aspects) {
    if (a.type.nature === 'flow') flow++
    if (a.type.nature === 'tension') tension++
  }
  return flow + tension === 0 ? 50 : Math.round((flow / (flow + tension)) * 100)
}

/** Aspects touching a given point, for tooltips and detail views. */
export function aspectsOf(chart: Chart, name: PointName) {
  return chart.aspects.filter((a) => a.a === name || a.b === name)
}
