/**
 * Planetary and house strength after Brihat Parashara Hora Shastra (ch. 27-28)
 * and B. V. Raman's "Graha and Bhava Balas": Shadbala, Bhava bala,
 * Vimsopaka bala and the planetary avasthas (states).
 *
 * Values are in virupas (shashtiamsas); 60 virupas make one rupa.
 */
import * as Astronomy from 'astronomy-engine'
import { angDist, norm360 } from '../astro/constants'
import { EXALTATION, FRIENDS, MOOLATRIKONA, SEVEN, SIGN_LORD, houseFrom, type Graha } from './constants'
import { HORA_ORDER, WEEKDAY_LORD, hinduDay } from './panchang'
import { pos } from './query'
import type { VedicChart } from './sidereal'
import { vargaSign, type VargaN } from './varga'

/* ------------------------------------------------------------------ */
/* Relationships                                                        */
/* ------------------------------------------------------------------ */

export type Relation = 'great friend' | 'friend' | 'neutral' | 'enemy' | 'great enemy'

const natural = (a: Graha, b: Graha): 1 | 0 | -1 => {
  const r = FRIENDS[a]
  if (!r) return 0
  return r.friends.includes(b) ? 1 : r.enemies.includes(b) ? -1 : 0
}

/** Temporary friendship: planets in the 2nd, 3rd, 4th, 10th, 11th or 12th from each other. */
const temporal = (chart: VedicChart, a: Graha, b: Graha): 1 | -1 =>
  [2, 3, 4, 10, 11, 12].includes(houseFrom(pos(chart, a).sign, pos(chart, b).sign)) ? 1 : -1

/** Compound (panchadha) relationship of `a` towards `b`. */
export function compound(chart: VedicChart, a: Graha, b: Graha): Relation {
  const s = natural(a, b) + temporal(chart, a, b)
  return s >= 2 ? 'great friend' : s === 1 ? 'friend' : s === 0 ? 'neutral' : s === -1 ? 'enemy' : 'great enemy'
}

/* ------------------------------------------------------------------ */
/* Shadbala                                                             */
/* ------------------------------------------------------------------ */

export interface Shadbala {
  graha: Graha
  sthana: { uchcha: number; saptavargaja: number; ojhayugma: number; kendradi: number; drekkana: number; total: number }
  dig: number
  kala: { nathonnatha: number; paksha: number; tribhaga: number; abda: number; masa: number; vara: number; hora: number; ayana: number; total: number }
  cheshta: number
  naisargika: number
  drik: number
  total: number
  rupas: number
  required: number
  ratio: number
}

const REQUIRED: Partial<Record<Graha, number>> = { Sun: 390, Moon: 360, Mars: 300, Mercury: 420, Jupiter: 390, Venus: 330, Saturn: 300 }
const NAISARGIKA: Partial<Record<Graha, number>> = { Sun: 60, Moon: 51.43, Venus: 42.86, Jupiter: 34.29, Mercury: 25.71, Mars: 17.14, Saturn: 8.57 }
/** Mean daily motion, used to classify the eight kinds of motion for Cheshta bala. */
const MEAN_MOTION: Partial<Record<Graha, number>> = { Mars: 0.524, Mercury: 0.9856, Jupiter: 0.0831, Venus: 0.9856, Saturn: 0.0335 }
const SAPTAVARGA: VargaN[] = [1, 2, 3, 7, 9, 12, 30]
const REL_POINTS: Record<Relation, number> = { 'great friend': 22.5, friend: 15, neutral: 7.5, enemy: 3.75, 'great enemy': 1.875 }
const KALI_EPOCH_JD = 588465.5 // midnight at Ujjain, 18 Feb 3102 BCE (a Friday)

const jd = (d: Date) => d.getTime() / 86400000 + 2440587.5
const weekdayOfJd = (j: number) => Math.floor(j + 1.5) % 7 // 0 = Sunday

/** Aspect value (virupas) of a planet on a point `angle` degrees ahead of it (BPHS 26). */
export function drishtiValue(aspector: Graha, angle: number): number {
  const d = norm360(angle)
  let v = 0
  if (d >= 30 && d < 60) v = (d - 30) / 2
  else if (d >= 60 && d < 90) v = d - 60 + 15
  else if (d >= 90 && d < 120) v = (120 - d) / 2 + 30
  else if (d >= 120 && d < 150) v = 150 - d
  else if (d >= 150 && d < 180) v = (d - 150) * 2
  else if (d >= 180 && d < 300) v = (300 - d) / 2
  const inR = (a: number, b: number) => d >= a && d < b
  if (aspector === 'Mars' && (inR(90, 120) || inR(210, 240))) v += 15
  if (aspector === 'Jupiter' && (inR(120, 150) || inR(240, 270))) v += 30
  if (aspector === 'Saturn' && (inR(60, 90) || inR(270, 300))) v += 45
  return v
}

/** Natural benefic for drishti and paksha purposes; the Moon is benefic while waxing. */
function isBeneficFor(chart: VedicChart, g: Graha): boolean {
  if (g === 'Moon') return norm360(pos(chart, 'Moon').lon - pos(chart, 'Sun').lon) < 180
  return g === 'Jupiter' || g === 'Venus' || g === 'Mercury'
}

function saptavargaja(chart: VedicChart, g: Graha): number {
  const p = pos(chart, g)
  return SAPTAVARGA.reduce((sum, n) => {
    const sign = vargaSign(n, p.lon)
    const lord = SIGN_LORD[sign]
    if (n === 1 && MOOLATRIKONA[g]!.sign === sign && p.degree >= MOOLATRIKONA[g]!.from && p.degree < MOOLATRIKONA[g]!.to) return sum + 45
    if (lord === g) return sum + 30
    return sum + REL_POINTS[compound(chart, g, lord)]
  }, 0)
}

function cheshtaFromMotion(g: Graha, speed: number): number {
  const r = speed / MEAN_MOTION[g]!
  if (r < 0) return 60 // vakra
  if (r < 0.1) return 15 // vikala (stationary)
  if (r < 0.5) return 15 // mandatara
  if (r < 0.9) return 30 // manda
  if (r <= 1.1) return 7.5 // sama
  if (r < 1.5) return 45 // chara
  return 30 // atichara
}

const cache = new WeakMap<VedicChart, Shadbala[] | null>()

/** Shadbala for the seven planets. Needs a birth time; returns null otherwise. */
export function shadbala(chart: VedicChart): Shadbala[] | null {
  if (cache.has(chart)) return cache.get(chart)!
  const result = computeShadbala(chart)
  cache.set(chart, result)
  return result
}

function computeShadbala(chart: VedicChart): Shadbala[] | null {
  if (chart.lagna === null || chart.mc === null) return null
  const { latitude, longitude } = chart.birth
  const day = hinduDay(chart.utc, latitude, longitude)
  if (!day) return null
  const t = chart.utc
  const sun = pos(chart, 'Sun'), moon = pos(chart, 'Moon')
  const elong = angDist(moon.lon, sun.lon) // 0..180
  const ha = Astronomy.HourAngle(Astronomy.Body.Sun, Astronomy.MakeTime(t), new Astronomy.Observer(latitude, longitude, 0)) * 15
  const fromNoon = Math.min(ha, 360 - ha) // 0 at noon, 180 at midnight
  const obliquity = Astronomy.e_tilt(Astronomy.MakeTime(t)).tobl

  // Lords of the year, month, weekday and hora.
  const ah = Math.floor(jd(t) - KALI_EPOCH_JD)
  const abdaLord = WEEKDAY_LORD[weekdayOfJd(KALI_EPOCH_JD + 360 * Math.floor(ah / 360))]
  const masaLord = WEEKDAY_LORD[weekdayOfJd(KALI_EPOCH_JD + 30 * Math.floor(ah / 30))]
  const varaLord = WEEKDAY_LORD[day.weekday]
  const horaIndex = Math.floor((t.getTime() - day.sunrise.getTime()) / 3600000)
  const horaLord = HORA_ORDER[(HORA_ORDER.indexOf(varaLord) + horaIndex) % 7]

  // Tribhaga: thirds of the day (Mercury, Sun, Saturn) and night (Moon, Venus, Mars).
  const third = day.isDay
    ? Math.min(2, Math.floor(((t.getTime() - day.sunrise.getTime()) * 3) / (day.sunset.getTime() - day.sunrise.getTime())))
    : Math.min(2, Math.floor(((t.getTime() - day.sunset.getTime()) * 3) / (day.nextSunrise.getTime() - day.sunset.getTime())))
  const tribhagaLord: Graha = (day.isDay ? ['Mercury', 'Sun', 'Saturn'] : ['Moon', 'Venus', 'Mars'])[third] as Graha

  const pakshaBenefic = elong / 3

  return SEVEN.map((g) => {
    const p = pos(chart, g)
    const debil = norm360(EXALTATION[g]!.sign * 30 + EXALTATION[g]!.degree + 180)
    const uchcha = angDist(p.lon, debil) / 3
    const svb = saptavargaja(chart, g)
    const navOdd = vargaSign(9, p.lon) % 2 === 0
    const rasiOdd = p.sign % 2 === 0
    const female = g === 'Moon' || g === 'Venus'
    const ojhayugma = (rasiOdd !== female ? 15 : 0) + (navOdd !== female ? 15 : 0)
    const h = p.house!
    const kendradi = [1, 4, 7, 10].includes(h) ? 60 : [2, 5, 8, 11].includes(h) ? 30 : 15
    const decan = Math.floor(p.degree / 10)
    const drekkana = (['Sun', 'Mars', 'Jupiter'].includes(g) && decan === 0) || (['Mercury', 'Saturn'].includes(g) && decan === 1) || (female && decan === 2) ? 15 : 0
    const sthana = { uchcha, saptavargaja: svb, ojhayugma, kendradi, drekkana, total: uchcha + svb + ojhayugma + kendradi + drekkana }

    const powerless = g === 'Sun' || g === 'Mars' ? chart.mc! + 180 : g === 'Jupiter' || g === 'Mercury' ? chart.lagna! + 180 : g === 'Moon' || g === 'Venus' ? chart.mc! : chart.lagna!
    const dig = angDist(p.lon, norm360(powerless)) / 3

    const diurnal = (60 * (180 - fromNoon)) / 180
    const nathonnatha = g === 'Mercury' ? 60 : ['Sun', 'Jupiter', 'Venus'].includes(g) ? diurnal : 60 - diurnal
    const paksha = g === 'Moon' ? pakshaBenefic * 2 : isBeneficFor(chart, g) ? pakshaBenefic : 60 - pakshaBenefic
    const tribhaga = g === 'Jupiter' || g === tribhagaLord ? 60 : 0
    const abda = g === abdaLord ? 15 : 0
    const masa = g === masaLord ? 30 : 0
    const vara = g === varaLord ? 45 : 0
    const hora = g === horaLord ? 60 : 0
    const kranti = (Math.asin(Math.sin((obliquity * Math.PI) / 180) * Math.sin(((p.lon + chart.ayanamsa) * Math.PI) / 180)) * 180) / Math.PI
    const k = g === 'Mercury' ? Math.abs(kranti) : g === 'Moon' || g === 'Saturn' ? -kranti : kranti
    const ayanaBase = ((24 + k) / 48) * 60
    const ayana = g === 'Sun' ? ayanaBase * 2 : ayanaBase
    const kala = { nathonnatha, paksha, tribhaga, abda, masa, vara, hora, ayana, total: nathonnatha + paksha + tribhaga + abda + masa + vara + hora + ayana }

    const cheshta = g === 'Sun' ? ayanaBase : g === 'Moon' ? pakshaBenefic : cheshtaFromMotion(g, p.speed)
    const naisargika = NAISARGIKA[g]!
    const drik = SEVEN.filter((a) => a !== g).reduce((s, a) => {
      const v = drishtiValue(a, p.lon - pos(chart, a).lon) / 4
      return s + (isBeneficFor(chart, a) ? v : -v)
    }, 0)

    const total = sthana.total + dig + kala.total + cheshta + naisargika + drik
    return { graha: g, sthana, dig, kala, cheshta, naisargika, drik, total, rupas: total / 60, required: REQUIRED[g]! / 60, ratio: total / REQUIRED[g]! }
  })
}

/** Shadbala ratio (strength / required minimum) for one planet, or null. */
export function shadbalaRatio(chart: VedicChart, g: Graha): number | null {
  return shadbala(chart)?.find((s) => s.graha === g)?.ratio ?? null
}

/* ------------------------------------------------------------------ */
/* Bhava bala                                                           */
/* ------------------------------------------------------------------ */

export interface BhavaBala { house: number; lord: Graha; adhipati: number; dig: number; drishti: number; total: number; rupas: number }

type SignKind = 'nara' | 'jala' | 'keeta' | 'chatushpada'
/** Sign type by longitude: Sagittarius and Capricorn change type at 15°. */
function signKind(lon: number): SignKind {
  const s = Math.floor(norm360(lon) / 30), d = norm360(lon) % 30
  if ([2, 5, 6, 10].includes(s) || (s === 8 && d < 15)) return 'nara'
  if ([3, 11].includes(s) || (s === 9 && d >= 15)) return 'jala'
  if (s === 7) return 'keeta'
  return 'chatushpada'
}
const STRONG_HOUSE: Record<SignKind, number> = { nara: 1, jala: 4, keeta: 7, chatushpada: 10 }

export function bhavaBala(chart: VedicChart): BhavaBala[] | null {
  const sb = shadbala(chart)
  if (!sb || chart.lagna === null) return null
  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1
    const madhya = norm360(chart.lagna! + 30 * i)
    const lord = SIGN_LORD[Math.floor(madhya / 30)]
    const adhipati = sb.find((s) => s.graha === lord)!.total
    const gap = Math.abs(house - STRONG_HOUSE[signKind(madhya)])
    const dig = 60 - 10 * Math.min(gap, 12 - gap)
    const drishti = SEVEN.reduce((s, a) => {
      const v = drishtiValue(a, madhya - pos(chart, a).lon)
      if (a === 'Jupiter' || a === 'Mercury') return s + v
      return s + (isBeneficFor(chart, a) ? v / 4 : -v / 4)
    }, 0)
    const total = adhipati + dig + drishti
    return { house, lord, adhipati, dig, drishti, total, rupas: total / 60 }
  })
}

/* ------------------------------------------------------------------ */
/* Vimsopaka bala (Shodasavarga scheme, out of 20)                      */
/* ------------------------------------------------------------------ */

const SHODASAVARGA: [VargaN, number][] = [
  [1, 3.5], [2, 1], [3, 1], [4, 0.5], [7, 0.5], [9, 3], [10, 0.5], [12, 0.5],
  [16, 2], [20, 0.5], [24, 0.5], [27, 0.5], [30, 1], [40, 0.5], [45, 0.5], [60, 4],
]
const VIMSOPAKA_POINTS: Record<Relation, number> = { 'great friend': 18, friend: 15, neutral: 10, enemy: 7, 'great enemy': 5 }

export function vimsopaka(chart: VedicChart, g: Graha): number {
  const p = pos(chart, g)
  return SHODASAVARGA.reduce((sum, [n, w]) => {
    const sign = vargaSign(n, p.lon)
    const lord = SIGN_LORD[sign]
    const pts = lord === g || EXALTATION[g]!.sign === sign ? 20 : VIMSOPAKA_POINTS[compound(chart, g, lord)]
    return sum + (w * pts) / 20
  }, 0)
}

/* ------------------------------------------------------------------ */
/* Avasthas                                                             */
/* ------------------------------------------------------------------ */

export interface Avastha { age: string; ageResult: string; alertness: string; mood: string }

const AGE = ['Bala (infant)', 'Kumara (youth)', 'Yuva (adult)', 'Vriddha (old)', 'Mrita (dead)']
const AGE_RESULT = ['a quarter of its results', 'half of its results', 'its full results', 'little of its results', 'no results']

/** Baladi, Jagradadi and Deeptadi avasthas (BPHS 45; Phaladeepika 3). */
export function avastha(chart: VedicChart, g: Graha): Avastha {
  const p = pos(chart, g)
  const part = Math.min(4, Math.floor(p.degree / 6))
  const ageIdx = p.sign % 2 === 0 ? part : 4 - part
  const d = p.dignity
  const alertness = d === 'exalted' || d === 'moolatrikona' || d === 'own' ? 'Jagrat (awake): full results'
    : d === 'friend' || d === 'neutral' ? 'Swapna (dreaming): moderate results' : 'Sushupti (asleep): weak results'
  const rel = d === 'exalted' || d === 'own' || d === 'moolatrikona' || d === 'debilitated' ? null : compound(chart, g, SIGN_LORD[p.sign])
  const maleficWith = chart.grahas.some((x) => x.graha !== g && x.sign === p.sign && ['Mars', 'Saturn', 'Rahu', 'Ketu'].includes(x.graha))
  const mood = p.combust ? 'Kopa (angry): combust'
    : d === 'debilitated' ? 'Khala (wicked): debilitated'
      : d === 'exalted' ? 'Deepta (radiant): exalted'
        : d === 'own' || d === 'moolatrikona' ? 'Swastha (at ease): own sign'
          : maleficWith ? 'Vikala (distressed): with a malefic'
            : rel === 'great friend' ? 'Mudita (delighted): great friend\'s sign'
              : rel === 'friend' ? 'Shanta (calm): friend\'s sign'
                : rel === 'neutral' ? 'Deena (meek): neutral sign' : 'Duhkhita (grieved): enemy\'s sign'
  return { age: AGE[ageIdx], ageResult: AGE_RESULT[ageIdx], alertness, mood }
}
