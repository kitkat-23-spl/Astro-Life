/**
 * Transits (gochara): current positions against the natal chart, the
 * Ashtakavarga transit scorecard, a monthly outlook, upcoming sign changes
 * and stations, Sade Sati, and the double-transit rule used by reports.
 */
import { norm360 } from '../astro/constants'
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

export interface MonthOutlook { month: Date; good: Graha[]; mixed: Graha[]; hard: Graha[] }

/** Transit results for the middle of each month (the Moon is left out: it changes sign every two days). */
export function monthlyOutlook(chart: VedicChart, from: Date, months = 12): MonthOutlook[] {
  return Array.from({ length: months }, (_, i) => {
    const month = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 15))
    const rows = gochara(chart, month).filter((r) => r.graha !== 'Moon')
    const by = (v: GocharaRow['verdict']) => rows.filter((r) => r.verdict === v).map((r) => r.graha)
    return { month, good: by('favourable'), mixed: by('mixed'), hard: by('unfavourable') }
  })
}

/* ------------------------------------------------------------------ */
/* Upcoming events                                                      */
/* ------------------------------------------------------------------ */

export interface TransitEvent { date: Date; graha: Graha; kind: 'ingress' | 'retrograde' | 'direct'; sign: number; fromLagna: number | null; fromMoon: number }

function refine(f: (t: number) => boolean, a: number, b: number): Date {
  // f(a) is false, f(b) is true; narrow to within ten minutes.
  while (b - a > 600000) {
    const m = (a + b) / 2
    if (f(m)) b = m
    else a = m
  }
  return new Date(b)
}

const STATION_PLANETS: Graha[] = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']

/** Sampling step that cannot skip a whole sign for each planet. */
const STEP_DAYS: Record<Graha, number> = { Moon: 0.25, Sun: 2, Mercury: 1, Venus: 1, Mars: 2, Jupiter: 5, Saturn: 5, Rahu: 5, Ketu: 5 }

export interface SignPeriod { graha: Graha; sign: number; start: Date; end: Date; retrogradeReturn: boolean }

/**
 * The signs a planet occupies between two dates, with exact entry and exit
 * times. The first period starts when the planet entered its current sign.
 */
export function signPeriods(chart: VedicChart, g: Graha, from: Date, until: Date): SignPeriod[] {
  const step = STEP_DAYS[g] * DAY
  const signAt = (t: number) => Math.floor(siderealLongitude(g, new Date(t), chart.settings) / 30)
  const first = signAt(from.getTime())
  let t0 = from.getTime()
  const backLimit = t0 - 3 * 365.25 * DAY
  while (t0 > backLimit && signAt(t0 - step) === first) t0 -= step
  const start = t0 > backLimit ? refine((x) => signAt(x) === first, t0 - step, t0) : new Date(t0)
  // A sign entered while moving backwards is a retrograde return (the nodes always move backwards).
  const backwards = (t: number) => g !== 'Rahu' && g !== 'Ketu' && norm360(siderealLongitude(g, new Date(t + DAY / 2), chart.settings) - siderealLongitude(g, new Date(t - DAY / 2), chart.settings)) > 180
  const out: SignPeriod[] = [{ graha: g, sign: first, start, end: until, retrogradeReturn: false }]
  let prev = first
  // Scan past the window so the last period gets its real end (Saturn stays up to about 2.7 years in a sign).
  for (let t = from.getTime() + step; t <= until.getTime() + 3 * 365.25 * DAY; t += step) {
    const s = signAt(t)
    if (s === prev) continue
    const date = refine((x) => signAt(x) === s, t - step, t)
    out[out.length - 1].end = date
    if (date > until) break
    out.push({ graha: g, sign: s, start: date, end: until, retrogradeReturn: backwards(date.getTime()) })
    prev = s
  }
  return out
}

/** Mars sign changes and the retrograde and direct stations of Mercury to Saturn. */
export function transitEvents(chart: VedicChart, from: Date, months = 12): TransitEvent[] {
  const end = new Date(from.getTime() + months * 30.44 * DAY)
  const moonSign = pos(chart, 'Moon').sign
  const rel = (sign: number) => ({
    fromLagna: chart.lagnaSign === null ? null : ((sign - chart.lagnaSign + 12) % 12) + 1,
    fromMoon: ((sign - moonSign + 12) % 12) + 1,
  })
  const lon = (g: Graha, t: number) => siderealLongitude(g, new Date(t), chart.settings)
  const speed = (g: Graha, t: number) => { let d = lon(g, t + DAY / 2) - lon(g, t - DAY / 2); if (d > 180) d -= 360; if (d < -180) d += 360; return d }
  const out: TransitEvent[] = signPeriods(chart, 'Mars', from, end).slice(1)
    .map((p) => ({ date: p.start, graha: 'Mars' as Graha, kind: 'ingress' as const, sign: p.sign, ...rel(p.sign) }))
  for (const g of STATION_PLANETS) {
    let prevRetro = speed(g, from.getTime()) < 0
    for (let t = from.getTime() + DAY; t <= end.getTime(); t += DAY) {
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

/** Nakshatras counted from the birth star that malefic transits disturb (Charak, ch. XXIX). */
const SENSITIVE_STARS: Record<number, string> = { 1: 'Janma (the birth star)', 10: 'Karma (10th from the birth star)', 19: 'Adhana (19th from the birth star)', 3: 'Vipat (3rd)', 5: 'Pratyari (5th)', 7: 'Vadha (7th)', 22: 'Vainashika (22nd)' }

export interface StarTransit { graha: Graha; nakshatra: number; count: number; name: string }

/** Malefics (Sun, Mars, Saturn, Rahu, Ketu) now crossing a sensitive nakshatra from the birth star. */
export function sensitiveStarTransits(chart: VedicChart, positions: TransitPos[]): StarTransit[] {
  const birth = pos(chart, 'Moon').nakshatra
  return positions
    .filter((p) => (['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'] as Graha[]).includes(p.graha))
    .map((p) => {
      const nk = Math.floor(p.lon / (360 / 27)) % 27
      const count = ((nk - birth + 27) % 27) + 1
      return { graha: p.graha, nakshatra: nk, count, name: SENSITIVE_STARS[count] }
    })
    .filter((x) => x.name)
}
