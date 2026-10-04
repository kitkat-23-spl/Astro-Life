import { DateTime } from 'luxon'
import { RASHI } from '../../vedic/constants'
import { signName } from '../../vedic/sidereal'

export const fmtMonth = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
export const fmtRange = (a: Date, b: Date) => `${fmtMonth(a)} to ${fmtMonth(b)}`
export const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtDateTime = (d: Date, zone: string) => DateTime.fromJSDate(d).setZone(zone).toFormat('d LLL yyyy, HH:mm')

/** Degrees and minutes within a sign, e.g. 12°05′. */
export function fmtDeg(d: number) {
  const deg = Math.floor(d)
  const min = Math.floor((d - deg) * 60)
  return `${deg}°${String(min).padStart(2, '0')}′`
}

/** Sidereal longitude as degree and rashi, e.g. 12°05′ Simha. */
export const fmtLon = (lon: number) => `${fmtDeg(lon % 30)} ${RASHI[signName(Math.floor(lon / 30))]}`
export const rashiName = (sign: number) => RASHI[signName(sign)]
