/**
 * Panchang: the five limbs of the Hindu day (tithi, vara, nakshatra, yoga,
 * karana) for a place and date, with sunrise-based periods (Rahu Kaal,
 * Yamaganda, Gulika, Abhijit), Choghadiya and Hora.
 */
import * as Astronomy from 'astronomy-engine'
import { DateTime } from 'luxon'
import { norm360 } from '../astro/constants'
import { longitudeOf } from '../astro/ephemeris'
import { NAKSHATRAS, NAKSHATRA_SPAN, RASHI, type Graha } from './constants'
import type { Ayanamsa } from './settings'
import { ayanamsaAt, signName } from './sidereal'

export const TITHIS = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
  'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
]
export const YOGAS_27 = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shoola',
  'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti',
]
/** Yogas traditionally avoided for new undertakings. */
const INAUSPICIOUS_YOGAS = new Set(['Vishkambha', 'Atiganda', 'Shoola', 'Ganda', 'Vyaghata', 'Vajra', 'Vyatipata', 'Parigha', 'Vaidhriti'])
const MOVABLE_KARANAS = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti']
export const VARAS = ['Ravivara', 'Somavara', 'Mangalavara', 'Budhavara', 'Guruvara', 'Shukravara', 'Shanivara']
const WEEKDAY_LORD: Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']
const MASAS = ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwin', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna']

/** One-eighth segment of daytime (1-based), by weekday from Sunday. */
const RAHU_KAAL = [8, 2, 7, 5, 6, 4, 3]
const YAMAGANDA = [5, 4, 3, 2, 1, 7, 6]
const GULIKA = [7, 6, 5, 4, 3, 2, 1]

const CHOGHADIYA = ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'] as const
type ChoghadiyaName = (typeof CHOGHADIYA)[number]
const DAY_START: ChoghadiyaName[] = ['Udveg', 'Amrit', 'Rog', 'Labh', 'Shubh', 'Char', 'Kaal']
const NIGHT_START: ChoghadiyaName[] = ['Shubh', 'Char', 'Kaal', 'Udveg', 'Amrit', 'Rog', 'Labh']
export const CHOGHADIYA_QUALITY: Record<ChoghadiyaName, 'good' | 'neutral' | 'bad'> = {
  Amrit: 'good', Shubh: 'good', Labh: 'good', Char: 'neutral', Udveg: 'bad', Kaal: 'bad', Rog: 'bad',
}
/** Chaldean order used for horas. */
const HORA_ORDER: Graha[] = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars']

export interface Limb { name: string; index: number; ends: Date | null; next?: string }
export interface Span { name: string; start: Date; end: Date; quality?: 'good' | 'neutral' | 'bad'; lord?: Graha }

export interface Panchang {
  date: string
  zone: string
  sunrise: Date
  sunset: Date
  nextSunrise: Date
  moonrise: Date | null
  moonset: Date | null
  vara: { name: string; lord: Graha }
  tithi: Limb & { paksha: 'Shukla' | 'Krishna' }
  nakshatra: Limb & { pada: number; lord: Graha }
  yoga: Limb & { auspicious: boolean }
  karana: Limb
  masa: { name: string; adhika: boolean }
  sunSign: string
  moonSign: string
  ayanamsa: number
  periods: { rahuKaal: Span; yamaganda: Span; gulika: Span; abhijit: Span }
  choghadiya: { day: Span[]; night: Span[] }
  horas: Span[]
}

const sun = (d: Date) => longitudeOf('Sun', d)
const moon = (d: Date) => longitudeOf('Moon', d)
/** Moon minus Sun, 0..360: drives tithi and karana. */
const elongation = (d: Date) => norm360(moon(d) - sun(d))

const indexers = (kind: Ayanamsa) => ({
  tithi: (d: Date) => Math.floor(elongation(d) / 12),
  karana: (d: Date) => Math.floor(elongation(d) / 6),
  nakshatra: (d: Date) => Math.floor(norm360(moon(d) - ayanamsaAt(d, kind)) / NAKSHATRA_SPAN),
  yoga: (d: Date) => Math.floor(norm360(sun(d) + moon(d) - 2 * ayanamsaAt(d, kind)) / NAKSHATRA_SPAN),
})

/** First moment after `from` when the index changes (to the minute), searching up to `hours`. */
function nextChange(f: (d: Date) => number, from: Date, hours = 36): Date | null {
  const start = f(from)
  const step = 30 * 60000
  const t0 = from.getTime()
  for (let t = t0 + step; t <= t0 + hours * 3600000; t += step) {
    if (f(new Date(t)) !== start) {
      let a = t - step, b = t
      while (b - a > 30000) {
        const m = (a + b) / 2
        if (f(new Date(m)) === start) a = m
        else b = m
      }
      return new Date(b)
    }
  }
  return null
}

const karanaName = (k: number) => (k === 0 ? 'Kimstughna' : k >= 57 ? ['Shakuni', 'Chatushpada', 'Naga'][k - 57] : MOVABLE_KARANAS[(k - 1) % 7])
const tithiName = (i: number) => (i === 14 ? 'Purnima' : i === 29 ? 'Amavasya' : TITHIS[i % 15])

function riseSet(body: Astronomy.Body, observer: Astronomy.Observer, dir: 1 | -1, from: Date, days = 1): Date | null {
  const r = Astronomy.SearchRiseSet(body, observer, dir, from, days)
  return r ? r.date : null
}

function segment(start: Date, end: Date, parts: number, n: number): { start: Date; end: Date } {
  const len = (end.getTime() - start.getTime()) / parts
  return { start: new Date(start.getTime() + (n - 1) * len), end: new Date(start.getTime() + n * len) }
}

/** Lunar month (amanta): named from the Sun's sidereal sign at the new moon that starts it. */
function masaAt(d: Date, kind: Ayanamsa) {
  const prev = Astronomy.SearchMoonPhase(0, d, -32)
  const next = Astronomy.SearchMoonPhase(0, d, 32)
  if (!prev || !next) return { name: '', adhika: false }
  const sign = (t: Date) => Math.floor(norm360(sun(t) - ayanamsaAt(t, kind)) / 30)
  const s0 = sign(prev.date), s1 = sign(next.date)
  return { name: MASAS[(s0 + 1) % 12], adhika: s0 === s1 }
}

export function computePanchang(date: string, latitude: number, longitude: number, zone: string, kind: Ayanamsa = 'lahiri'): Panchang {
  const midnight = DateTime.fromISO(date, { zone }).startOf('day')
  if (!midnight.isValid) throw new Error('Invalid date or time zone')
  const observer = new Astronomy.Observer(latitude, longitude, 0)
  const sunrise = riseSet(Astronomy.Body.Sun, observer, 1, midnight.toJSDate())
  const sunset = sunrise && riseSet(Astronomy.Body.Sun, observer, -1, sunrise)
  const nextSunrise = sunset && riseSet(Astronomy.Body.Sun, observer, 1, sunset)
  if (!sunrise || !sunset || !nextSunrise) throw new Error('The Sun does not rise or set on this date at this latitude.')
  const moonrise = riseSet(Astronomy.Body.Moon, observer, 1, midnight.toJSDate())
  const moonset = riseSet(Astronomy.Body.Moon, observer, -1, midnight.toJSDate())
  const dayEnd = midnight.plus({ days: 1 }).toJSDate()

  const ix = indexers(kind)
  const weekday = midnight.weekday % 7 // luxon: Monday 1 ... Sunday 7
  const ti = ix.tithi(sunrise), ki = ix.karana(sunrise), ni = ix.nakshatra(sunrise), yi = ix.yoga(sunrise)
  const moonSid = norm360(moon(sunrise) - ayanamsaAt(sunrise, kind))
  const sunSid = norm360(sun(sunrise) - ayanamsaAt(sunrise, kind))

  const day = (n: number) => ({ ...segment(sunrise, sunset, 8, n) })
  const span = (name: string, s: { start: Date; end: Date }): Span => ({ name, ...s })
  const muhurta = (sunset.getTime() - sunrise.getTime()) / 15

  const chog = (start: Date, end: Date, first: ChoghadiyaName, step: number): Span[] => {
    const i0 = CHOGHADIYA.indexOf(first)
    return Array.from({ length: 8 }, (_, n) => {
      const name = CHOGHADIYA[(((i0 + step * n) % 7) + 7) % 7]
      return { name, ...segment(start, end, 8, n + 1), quality: CHOGHADIYA_QUALITY[name] }
    })
  }

  const h0 = HORA_ORDER.indexOf(WEEKDAY_LORD[weekday])
  const horas: Span[] = Array.from({ length: 24 }, (_, n) => {
    const lord = HORA_ORDER[(h0 + n) % 7]
    const s = n < 12 ? segment(sunrise, sunset, 12, n + 1) : segment(sunset, nextSunrise, 12, n - 11)
    return { name: lord, lord, ...s }
  })

  const ends = (f: (d: Date) => number) => {
    const t = nextChange(f, sunrise)
    return t && t < new Date(nextSunrise.getTime() + 6 * 3600000) ? t : null
  }

  return {
    date, zone, sunrise, sunset, nextSunrise,
    moonrise: moonrise && moonrise < dayEnd ? moonrise : null,
    moonset: moonset && moonset < dayEnd ? moonset : null,
    vara: { name: VARAS[weekday], lord: WEEKDAY_LORD[weekday] },
    tithi: { name: tithiName(ti), index: ti, paksha: ti < 15 ? 'Shukla' : 'Krishna', ends: ends(ix.tithi), next: tithiName((ti + 1) % 30) },
    nakshatra: { name: NAKSHATRAS[ni].name, index: ni, pada: Math.floor((moonSid % NAKSHATRA_SPAN) / (NAKSHATRA_SPAN / 4)) + 1, lord: NAKSHATRAS[ni].lord, ends: ends(ix.nakshatra), next: NAKSHATRAS[(ni + 1) % 27].name },
    yoga: { name: YOGAS_27[yi], index: yi, auspicious: !INAUSPICIOUS_YOGAS.has(YOGAS_27[yi]), ends: ends(ix.yoga), next: YOGAS_27[(yi + 1) % 27] },
    karana: { name: karanaName(ki), index: ki, ends: ends(ix.karana), next: karanaName((ki + 1) % 60) },
    masa: masaAt(sunrise, kind),
    sunSign: `${RASHI[signName(Math.floor(sunSid / 30))]} (${signName(Math.floor(sunSid / 30))})`,
    moonSign: `${RASHI[signName(Math.floor(moonSid / 30))]} (${signName(Math.floor(moonSid / 30))})`,
    ayanamsa: ayanamsaAt(sunrise, kind),
    periods: {
      rahuKaal: span('Rahu Kaal', day(RAHU_KAAL[weekday])),
      yamaganda: span('Yamaganda', day(YAMAGANDA[weekday])),
      gulika: span('Gulika Kaal', day(GULIKA[weekday])),
      abhijit: { name: 'Abhijit muhurta', start: new Date(sunrise.getTime() + 7 * muhurta), end: new Date(sunrise.getTime() + 8 * muhurta) },
    },
    choghadiya: {
      day: chog(sunrise, sunset, DAY_START[weekday], 1),
      night: chog(sunset, nextSunrise, NIGHT_START[weekday], -2),
    },
    horas,
  }
}
