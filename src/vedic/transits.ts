/**
 * Transits (gochara): current positions against the natal chart, the
 * Ashtakavarga transit scorecard, a monthly outlook, upcoming sign changes
 * and stations, Sade Sati, and the double-transit rule used by reports.
 */
import { GRAHAS, type Graha } from './constants'
import type { Period } from './dasha'
import { aspectedSigns, lordOfHouse, pos } from './query'
import { ashtakavarga } from './ashtakavarga'
import { siderealLongitude, type VedicChart } from './sidereal'

const DAY = 86400000

export interface TransitPos { graha: Graha; lon: number; sign: number; speed: number; retrograde: boolean }

export function transitPositions(chart: VedicChart, at: Date): TransitPos[] {
  return GRAHAS.map((g) => {
    const lon = siderealLongitude(g, at, chart.settings)
    let d = siderealLongitude(g, new Date(at.getTime() + DAY / 2), chart.settings) - siderealLongitude(g, new Date(at.getTime() - DAY / 2), chart.settings)
    if (d > 180) d -= 360
    if (d < -180) d += 360
    return { graha: g, lon, sign: Math.floor(lon / 30), speed: d, retrograde: d < 0 }
  })
}

/* ------------------------------------------------------------------ */
/* Gochara from the Moon with vedha (Phaladeepika 26)                   */
/* ------------------------------------------------------------------ */

/** Favourable houses from the natal Moon, each paired with the house that obstructs it (vedha). */
const GOCHARA: Record<Graha, [number, number][]> = {
  Sun: [[3, 9], [6, 12], [10, 4], [11, 5]],
  Moon: [[1, 5], [3, 9], [6, 12], [7, 2], [10, 4], [11, 8]],
  Mars: [[3, 12], [6, 9], [11, 5]],
  Mercury: [[2, 5], [4, 3], [6, 9], [8, 1], [10, 8], [11, 12]],
  Jupiter: [[2, 12], [5, 4], [7, 3], [9, 10], [11, 8]],
  Venus: [[1, 8], [2, 7], [3, 1], [4, 10], [5, 9], [8, 5], [9, 11], [11, 6], [12, 3]],
  Saturn: [[3, 12], [6, 9], [11, 5]],
  Rahu: [[3, 12], [6, 9], [11, 5]],
  Ketu: [[3, 12], [6, 9], [11, 5]],
}
/** Pairs that do not obstruct each other: Sun and Saturn, Moon and Mercury. */
const NO_VEDHA: [Graha, Graha][] = [['Sun', 'Saturn'], ['Moon', 'Mercury']]

export interface GocharaRow {
  graha: Graha
  sign: number
  retrograde: boolean
  fromMoon: number
  fromLagna: number | null
  favourable: boolean
  vedhaBy: Graha[]
  bindus: number | null
  sav: number | null
  score: number
  verdict: 'favourable' | 'mixed' | 'unfavourable'
}

export function gochara(chart: VedicChart, at: Date, positions = transitPositions(chart, at)): GocharaRow[] {
  const moonSign = pos(chart, 'Moon').sign
  const av = ashtakavarga(chart)
  return positions.map((t) => {
    const fromMoon = ((t.sign - moonSign + 12) % 12) + 1
    const pair = GOCHARA[t.graha].find(([good]) => good === fromMoon)
    const vedhaBy = pair
      ? positions.filter((o) => o.graha !== t.graha && ((o.sign - moonSign + 12) % 12) + 1 === pair[1]
        && !NO_VEDHA.some(([a, b]) => (a === t.graha && b === o.graha) || (b === t.graha && a === o.graha))).map((o) => o.graha)
      : []
    const bindus = av && av.bav[t.graha] ? av.bav[t.graha][t.sign] : null
    const sav = av ? av.sav[t.sign] : null
    let score = pair ? (vedhaBy.length ? 0 : 1) : -1
    if (bindus !== null) score += bindus >= 5 ? 1 : bindus <= 2 ? -1 : 0
    return {
      graha: t.graha, sign: t.sign, retrograde: t.retrograde, fromMoon,
      fromLagna: chart.lagnaSign === null ? null : ((t.sign - chart.lagnaSign + 12) % 12) + 1,
      favourable: !!pair, vedhaBy, bindus, sav, score,
      verdict: score >= 1 ? 'favourable' : score <= -1 ? 'unfavourable' : 'mixed',
    }
  })
}

/** Weight of each planet in the monthly outlook: slow planets shape a month more than fast ones. */
const OUTLOOK_WEIGHT: Partial<Record<Graha, number>> = { Sun: 0.5, Mars: 0.75, Mercury: 0.5, Venus: 0.5, Jupiter: 1.5, Saturn: 1.5, Rahu: 1, Ketu: 0.5 }

export interface MonthOutlook { month: Date; score: number; good: Graha[]; hard: Graha[] }

/** Transit score for the middle of each month: 50 is neutral, higher is more favourable. */
export function monthlyOutlook(chart: VedicChart, from: Date, months = 12): MonthOutlook[] {
  const maxW = Object.values(OUTLOOK_WEIGHT).reduce((a, b) => a + b!, 0) * 2
  return Array.from({ length: months }, (_, i) => {
    const month = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 15))
    const rows = gochara(chart, month).filter((r) => r.graha !== 'Moon')
    const raw = rows.reduce((s, r) => s + r.score * OUTLOOK_WEIGHT[r.graha]!, 0)
    return {
      month, score: Math.round(50 + (raw / maxW) * 70),
      good: rows.filter((r) => r.verdict === 'favourable').map((r) => r.graha),
      hard: rows.filter((r) => r.verdict === 'unfavourable').map((r) => r.graha),
    }
  })
}

/* ------------------------------------------------------------------ */
/* Upcoming events                                                      */
/* ------------------------------------------------------------------ */

export interface TransitEvent { date: Date; graha: Graha; kind: 'ingress' | 'retrograde' | 'direct'; sign: number; fromLagna: number | null; fromMoon: number }

const INGRESS_PLANETS: Graha[] = ['Mars', 'Jupiter', 'Saturn', 'Rahu']
const STATION_PLANETS: Graha[] = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']

function refine(f: (t: number) => boolean, a: number, b: number): Date {
  // f(a) is false, f(b) is true; narrow to within ten minutes.
  while (b - a > 600000) {
    const m = (a + b) / 2
    if (f(m)) b = m
    else a = m
  }
  return new Date(b)
}

export function transitEvents(chart: VedicChart, from: Date, months = 12): TransitEvent[] {
  const end = from.getTime() + months * 30.44 * DAY
  const moonSign = pos(chart, 'Moon').sign
  const rel = (sign: number) => ({
    fromLagna: chart.lagnaSign === null ? null : ((sign - chart.lagnaSign + 12) % 12) + 1,
    fromMoon: ((sign - moonSign + 12) % 12) + 1,
  })
  const lon = (g: Graha, t: number) => siderealLongitude(g, new Date(t), chart.settings)
  const speed = (g: Graha, t: number) => { let d = lon(g, t + DAY / 2) - lon(g, t - DAY / 2); if (d > 180) d -= 360; if (d < -180) d += 360; return d }
  const out: TransitEvent[] = []
  for (const g of INGRESS_PLANETS) {
    let prev = Math.floor(lon(g, from.getTime()) / 30)
    for (let t = from.getTime() + DAY; t <= end; t += DAY) {
      const s = Math.floor(lon(g, t) / 30)
      if (s !== prev) {
        const date = refine((x) => Math.floor(lon(g, x) / 30) === s, t - DAY, t)
        out.push({ date, graha: g, kind: 'ingress', sign: s, ...rel(s) })
        prev = s
      }
    }
  }
  for (const g of STATION_PLANETS) {
    let prevRetro = speed(g, from.getTime()) < 0
    for (let t = from.getTime() + DAY; t <= end; t += DAY) {
      const retro = speed(g, t) < 0
      if (retro !== prevRetro) {
        const date = refine((x) => (speed(g, x) < 0) === retro, t - DAY, t)
        const s = Math.floor(lon(g, date.getTime()) / 30)
        out.push({ date, graha: g, kind: retro ? 'retrograde' : 'direct', sign: s, ...rel(s) })
        prevRetro = retro
      }
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/* ------------------------------------------------------------------ */
/* Sade Sati                                                            */
/* ------------------------------------------------------------------ */

export interface SadeSatiPhase { phase: 'first' | 'peak' | 'last'; start: Date; end: Date }
export interface SadeSati { active: SadeSatiPhase | null; cycle: SadeSatiPhase[]; saturnFromMoon: number }

/**
 * Saturn's transit through the 12th, 1st and 2nd signs from the natal Moon.
 * Returns the running or next cycle with its three phases. Brief retrograde
 * exits are merged into the surrounding phase.
 */
export function sadeSati(chart: VedicChart, at: Date): SadeSati {
  const moonSign = pos(chart, 'Moon').sign
  const house = (t: number) => ((Math.floor(siderealLongitude('Saturn', new Date(t), chart.settings) / 30) - moonSign + 12) % 12) + 1
  const PHASE: Record<number, SadeSatiPhase['phase']> = { 12: 'first', 1: 'peak', 2: 'last' }
  const step = 5 * DAY
  // Start far enough back to catch a cycle already in progress.
  const t0 = at.getTime() - 9 * 365.25 * DAY
  const t1 = at.getTime() + 31 * 365.25 * DAY
  const raw: SadeSatiPhase[] = []
  let cur: SadeSatiPhase | null = null
  for (let t = t0; t <= t1; t += step) {
    const p = PHASE[house(t)]
    if (p && cur && cur.phase === p) { cur.end = new Date(t); continue }
    if (cur) raw.push(cur)
    cur = p ? { phase: p, start: new Date(t), end: new Date(t) } : null
  }
  if (cur) raw.push(cur)
  // Group segments into cycles (gaps shorter than a year are retrograde exits), then date each
  // phase from Saturn's first entry into its sign; the cycle ends with the last exit.
  const groups: SadeSatiPhase[][] = []
  for (const p of raw) {
    const g = groups[groups.length - 1]
    if (g && p.start.getTime() - g[g.length - 1].end.getTime() < 400 * DAY) g.push(p)
    else groups.push([p])
  }
  const order: SadeSatiPhase['phase'][] = ['first', 'peak', 'last']
  const cycles: SadeSatiPhase[][] = groups.map((g) => {
    const starts = order.map((ph) => g.filter((x) => x.phase === ph).map((x) => x.start.getTime())).map((xs) => (xs.length ? Math.min(...xs) : null))
    const endAll = Math.max(...g.map((x) => x.end.getTime()))
    return order.flatMap((ph, i) => {
      if (starts[i] === null) return []
      const next = starts.slice(i + 1).find((x) => x !== null) ?? endAll
      return [{ phase: ph, start: new Date(starts[i]!), end: new Date(next) }]
    })
  })
  const cycle = cycles.find((c) => c[c.length - 1].end >= at) ?? []
  const active = cycle.find((p) => p.start <= at && at <= p.end) ?? null
  return { active, cycle, saturnFromMoon: house(at.getTime()) }
}

/* ------------------------------------------------------------------ */
/* Double transit (used by the life-area reports)                       */
/* ------------------------------------------------------------------ */

export interface TransitWindow {
  start: Date
  end: Date
  dasha: { md: Graha; ad: Graha } | null
  dashaMatch: Graha[]
  strength: 'strong' | 'moderate'
}

/**
 * Double transit (K. N. Rao): an event is likely when transiting Jupiter and
 * transiting Saturn both occupy or aspect the house or its lord's natal sign,
 * and the running dasha connects to that house.
 */
export function doubleTransitWindows(
  chart: VedicChart, house: number, significators: Graha[], periods: Period[], from: Date, years: number,
): TransitWindow[] {
  if (chart.lagnaSign === null) return []
  const targets = new Set([(chart.lagnaSign + house - 1) % 12, pos(chart, lordOfHouse(chart, house)).sign])
  const influences = (g: 'Jupiter' | 'Saturn', sign: number) => targets.has(sign) || aspectedSigns(g, sign).some((s) => targets.has(s))
  const signAt = (g: 'Jupiter' | 'Saturn', d: Date) => Math.floor(siderealLongitude(g, d, chart.settings) / 30)

  const step = 15 * DAY
  const endMs = from.getTime() + years * 365.25 * DAY
  const samples: { t: number; on: boolean; md: Graha | null; ad: Graha | null }[] = []
  for (let t = from.getTime(); t <= endMs; t += step) {
    const d = new Date(t)
    const md = periods.find((p) => p.start <= d && d < p.end)
    const ad = md?.sub?.find((p) => p.start <= d && d < p.end)
    samples.push({ t, on: influences('Jupiter', signAt('Jupiter', d)) && influences('Saturn', signAt('Saturn', d)), md: md?.lord ?? null, ad: ad?.lord ?? null })
  }
  const out: TransitWindow[] = []
  for (let i = 0; i < samples.length; i++) {
    if (!samples[i].on) continue
    let j = i
    while (j + 1 < samples.length && samples[j + 1].on && samples[j + 1].ad === samples[i].ad && samples[j + 1].md === samples[i].md) j++
    const s = samples[i]
    const dashaMatch = [...new Set([s.md, s.ad].filter((g): g is Graha => !!g && significators.includes(g)))]
    out.push({
      start: new Date(s.t), end: new Date(samples[j].t + step),
      dasha: s.md && s.ad ? { md: s.md, ad: s.ad } : null,
      dashaMatch, strength: dashaMatch.length ? 'strong' : 'moderate',
    })
    i = j
  }
  return out
}
