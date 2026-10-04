/**
 * Annual charts: Varshaphal (Tajika solar return) and Tithi Pravesh (return of
 * the birth tithi near the birthday). Both are cast for the birth place.
 */
import { norm360 } from '../astro/constants'
import { longitudeOf } from '../astro/ephemeris'
import { DASHA_ORDER, DASHA_YEARS, EXALTATION, FRIENDS, SIGN_LORD, type Graha } from './constants'
import { HORA_ORDER, WEEKDAY_LORD, hinduDay } from './panchang'
import { pos } from './query'
import { chartAt, siderealLongitude, type VedicChart } from './sidereal'
import { vargaSign } from './varga'

const DAY = 86400000
const SIDEREAL_YEAR = 365.25636
const norm180 = (x: number) => ((norm360(x) + 180) % 360) - 180

/** Moment the sidereal Sun returns to its natal longitude, `age` years after birth. */
export function solarReturn(chart: VedicChart, age: number): Date {
  const target = pos(chart, 'Sun').lon
  let t = chart.utc.getTime() + age * SIDEREAL_YEAR * DAY
  for (let i = 0; i < 6; i++) {
    const diff = norm180(siderealLongitude('Sun', new Date(t), chart.settings) - target)
    t -= (diff / 0.9856) * DAY
  }
  return new Date(t)
}

/* ------------------------------------------------------------------ */
/* Tajika strength and aspects                                          */
/* ------------------------------------------------------------------ */

/** Egyptian terms (hadda), as used in Tajika: [lord, upper degree] for each sign. */
const HADDA: [Graha, number][][] = [
  [['Jupiter', 6], ['Venus', 12], ['Mercury', 20], ['Mars', 25], ['Saturn', 30]],
  [['Venus', 8], ['Mercury', 14], ['Jupiter', 22], ['Saturn', 27], ['Mars', 30]],
  [['Mercury', 6], ['Jupiter', 12], ['Venus', 17], ['Mars', 24], ['Saturn', 30]],
  [['Mars', 7], ['Venus', 13], ['Mercury', 19], ['Jupiter', 26], ['Saturn', 30]],
  [['Jupiter', 6], ['Venus', 11], ['Saturn', 18], ['Mercury', 24], ['Mars', 30]],
  [['Mercury', 7], ['Venus', 17], ['Jupiter', 21], ['Mars', 28], ['Saturn', 30]],
  [['Saturn', 6], ['Mercury', 14], ['Jupiter', 21], ['Venus', 28], ['Mars', 30]],
  [['Mars', 7], ['Venus', 11], ['Mercury', 19], ['Jupiter', 24], ['Saturn', 30]],
  [['Jupiter', 12], ['Venus', 17], ['Mercury', 21], ['Saturn', 26], ['Mars', 30]],
  [['Mercury', 7], ['Jupiter', 14], ['Venus', 22], ['Saturn', 26], ['Mars', 30]],
  [['Mercury', 7], ['Venus', 13], ['Jupiter', 20], ['Mars', 25], ['Saturn', 30]],
  [['Venus', 12], ['Jupiter', 16], ['Mercury', 19], ['Mars', 28], ['Saturn', 30]],
]

export const haddaLord = (lon: number): Graha => {
  const s = Math.floor(norm360(lon) / 30), d = norm360(lon) % 30
  return HADDA[s].find(([, upto]) => d < upto)![0]
}

/** 1 = own sign, 0.5 = friend, 0.25 = neutral, 0.125 = enemy (natural relationship). */
function share(g: Graha, lord: Graha): number {
  if (g === lord) return 1
  const r = FRIENDS[g]!
  return r.friends.includes(lord) ? 0.5 : r.enemies.includes(lord) ? 0.125 : 0.25
}

/** Pancha-vargiya bala (Tajika Neelakanthi): sign 30, exaltation 20, hadda 15, drekkana 10, navamsa 5; divided by 4. */
export function panchaVargiya(chart: VedicChart, g: Graha): number {
  const p = pos(chart, g)
  const kshetra = 30 * share(g, SIGN_LORD[p.sign])
  const debil = norm360(EXALTATION[g]!.sign * 30 + EXALTATION[g]!.degree + 180)
  const uchcha = Math.abs(norm180(p.lon - debil)) / 9
  const hadda = 15 * share(g, haddaLord(p.lon))
  const drekkana = 10 * share(g, SIGN_LORD[vargaSign(3, p.lon)])
  const navamsa = 5 * share(g, SIGN_LORD[vargaSign(9, p.lon)])
  return (kshetra + uchcha + hadda + drekkana + navamsa) / 4
}

/** Tajika aspects work by sign: 3/11 and 5/9 friendly, 4/10 and 1/7 inimical; 2, 6, 8 and 12 have none. */
export const tajikaAspects = (fromSign: number, toSign: number) => [1, 3, 4, 5, 7, 9, 10, 11].includes(((toSign - fromSign + 12) % 12) + 1)

/** Tri-rashi lords by element, for day and night charts. */
const TRI_RASHI: Record<number, [Graha, Graha]> = { 0: ['Sun', 'Jupiter'], 1: ['Venus', 'Moon'], 2: ['Saturn', 'Mercury'], 3: ['Venus', 'Mars'] }

/* ------------------------------------------------------------------ */
/* Varshaphal                                                           */
/* ------------------------------------------------------------------ */

export interface OfficeBearer { role: string; graha: Graha; strength: number; aspectsLagna: boolean }
export interface Saham { name: string; lon: number; meaning: string }
export interface MuddaPeriod { lord: Graha; start: Date; end: Date }

export interface Varshaphal {
  age: number
  start: Date
  end: Date
  chart: VedicChart
  dayChart: boolean
  muntha: { sign: number; house: number; lord: Graha }
  officeBearers: OfficeBearer[]
  yearLord: Graha
  sahams: Saham[]
  mudda: MuddaPeriod[]
}

/** Muntha houses traditionally favourable (9, 10, 11), good (1, 2, 3, 5) or difficult. */
export const MUNTHA_RESULT = (house: number) =>
  [9, 10, 11].includes(house) ? 'favourable: gains, recognition and success in efforts'
    : [1, 2, 3, 5].includes(house) ? 'good: steady progress in the matters of that house'
      : 'difficult: obstacles, health care or expenses need attention'

export function varshaphal(natal: VedicChart, age: number): Varshaphal | null {
  if (natal.lagnaSign === null) return null
  const start = solarReturn(natal, age)
  const end = solarReturn(natal, age + 1)
  const chart = chartAt(natal.birth, start, true, natal.settings)
  const L = chart.lagnaSign!
  const sun = pos(chart, 'Sun'), moon = pos(chart, 'Moon')
  const dayChart = norm360(sun.lon - chart.lagna!) >= 180

  const munthaSign = (natal.lagnaSign + age) % 12
  const muntha = { sign: munthaSign, house: ((munthaSign - L + 12) % 12) + 1, lord: SIGN_LORD[munthaSign] }

  const roles: [string, Graha][] = [
    ['Muntha lord', muntha.lord],
    ['Birth lagna lord', SIGN_LORD[natal.lagnaSign]],
    ['Year lagna lord', SIGN_LORD[L]],
    ['Tri-rashi lord', TRI_RASHI[L % 4][dayChart ? 0 : 1]],
    [dayChart ? 'Day lord (Sun\'s sign)' : 'Night lord (Moon\'s sign)', SIGN_LORD[(dayChart ? sun : moon).sign]],
  ]
  const officeBearers = roles.map(([role, g]) => ({ role, graha: g, strength: panchaVargiya(chart, g), aspectsLagna: tajikaAspects(pos(chart, g).sign, L) }))
  const candidates = officeBearers.filter((o) => o.aspectsLagna)
  const yearLord = (candidates.length ? candidates : officeBearers).reduce((a, b) => (b.strength > a.strength ? b : a)).graha

  const A = chart.lagna!
  const saham = (name: string, a: number, b: number, meaning: string, correct = true): Saham => {
    let lon = norm360(a - b + A)
    if (correct && !(norm360(A - b) < norm360(a - b))) lon = norm360(lon + 30)
    return { name, lon, meaning }
  }
  const P = (g: Graha) => pos(chart, g).lon
  const sahams = [
    dayChart ? saham('Punya (fortune)', P('Moon'), P('Sun'), 'general fortune and merit') : saham('Punya (fortune)', P('Sun'), P('Moon'), 'general fortune and merit'),
    dayChart ? saham('Vidya (learning)', P('Sun'), P('Moon'), 'education and knowledge') : saham('Vidya (learning)', P('Moon'), P('Sun'), 'education and knowledge'),
    saham('Vivaha (marriage)', P('Venus'), P('Saturn'), 'marriage and partnership'),
    saham('Putra (children)', P('Jupiter'), P('Moon'), 'children'),
    saham('Karma (work)', P('Mars'), P('Mercury'), 'work and profession'),
    saham('Roga (illness)', A, P('Moon'), 'health', false),
  ]

  // Mudda dasha: Vimshottari compressed into the year, starting from (birth star + age - 2) mod 9.
  const r = (pos(natal, 'Moon').nakshatra + 1 + age - 2) % 9
  const startIdx = (r + 1 + 9) % 9
  const yearMs = end.getTime() - start.getTime()
  let cursor = start.getTime()
  const mudda = Array.from({ length: 9 }, (_, i) => {
    const lord = DASHA_ORDER[(startIdx + i) % 9]
    const len = (yearMs * DASHA_YEARS[lord]) / 120
    const p = { lord, start: new Date(cursor), end: new Date(cursor + len) }
    cursor += len
    return p
  })

  return { age, start, end, chart, dayChart, muntha, officeBearers, yearLord, sahams, mudda }
}

/* ------------------------------------------------------------------ */
/* Tithi Pravesh                                                        */
/* ------------------------------------------------------------------ */

export interface TithiPravesh { age: number; moment: Date; chart: VedicChart; yearLord: Graha; horaLord: Graha }

const elongation = (d: Date) => norm360(longitudeOf('Moon', d) - longitudeOf('Sun', d))

/**
 * The moment, near the birthday of the given age, when the Moon-Sun angle
 * equals its natal value while the Sun is in its natal sidereal sign.
 * The lord of that weekday rules the year.
 */
export function tithiPravesh(natal: VedicChart, age: number): TithiPravesh | null {
  if (natal.lagnaSign === null) return null
  const target = elongation(natal.utc)
  const sunSign = pos(natal, 'Sun').sign
  const around = solarReturn(natal, age).getTime()
  const f = (t: number) => norm180(elongation(new Date(t)) - target)
  const roots: number[] = []
  const step = DAY / 2
  for (let t = around - 40 * DAY; t < around + 40 * DAY; t += step) {
    const a = f(t), b = f(t + step)
    if (a < 0 && b >= 0) {
      let lo = t, hi = t + step
      while (hi - lo > 30000) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m }
      roots.push(hi)
    }
  }
  if (!roots.length) return null
  const inSign = roots.filter((t) => Math.floor(siderealLongitude('Sun', new Date(t), natal.settings) / 30) === sunSign)
  const pool = inSign.length ? inSign : roots
  const moment = pool.reduce((a, b) => (Math.abs(b - around) < Math.abs(a - around) ? b : a))
  const date = new Date(moment)
  const chart = chartAt(natal.birth, date, true, natal.settings)
  const day = hinduDay(date, natal.birth.latitude, natal.birth.longitude)
  const weekday = day ? day.weekday : date.getUTCDay()
  const yearLord = WEEKDAY_LORD[weekday]
  const horaIndex = day ? Math.floor((moment - day.sunrise.getTime()) / 3600000) : 0
  return { age, moment: date, chart, yearLord, horaLord: HORA_ORDER[(HORA_ORDER.indexOf(yearLord) + horaIndex) % 7] }
}

/** Completed years at a date, by solar returns (the age whose annual chart is running). */
export function runningAge(natal: VedicChart, at: Date): number {
  let age = Math.max(0, Math.floor((at.getTime() - natal.utc.getTime()) / (SIDEREAL_YEAR * DAY)))
  if (age > 0 && solarReturn(natal, age) > at) age--
  if (solarReturn(natal, age + 1) <= at) age++
  return age
}
