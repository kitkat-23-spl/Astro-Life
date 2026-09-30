import type { BirthData } from '../astro/ephemeris'
import type { HouseSystem } from '../astro/houses'

const HOUSE_SYSTEMS: HouseSystem[] = ['placidus', 'whole-sign', 'equal']

function toBase64Url(s: string) {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

/**
 * Birth data lives in the URL fragment (#…), which browsers never send to the
 * server, so it doesn't end up in hosting logs.
 */
export function encodeBirth(b: BirthData): string {
  return toBase64Url(JSON.stringify([b.name, b.date, b.time, b.place, +b.latitude.toFixed(4), +b.longitude.toFixed(4), b.timezone, b.houseSystem]))
}

/** Strictly validates shared data, which may come from anyone. */
export function decodeBirth(s: string): BirthData | null {
  try {
    if (s.length > 1000) return null
    const a = JSON.parse(fromBase64Url(s)) as unknown
    if (!Array.isArray(a) || a.length !== 8) return null
    const [name, date, time, place, lat, lon, tz, hs] = a
    if (typeof name !== 'string' || name.length > 60) return null
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
    if (time !== null && (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time))) return null
    if (typeof place !== 'string' || place.length > 120) return null
    if (typeof lat !== 'number' || lat < -90 || lat > 90) return null
    if (typeof lon !== 'number' || lon < -180 || lon > 180) return null
    if (typeof tz !== 'string' || !/^[A-Za-z0-9_+\-/:]{1,64}$/.test(tz)) return null
    if (!HOUSE_SYSTEMS.includes(hs)) return null
    return { name, date, time, place, latitude: lat, longitude: lon, timezone: tz, houseSystem: hs }
  } catch {
    return null
  }
}

export function isBirthData(x: unknown): x is BirthData {
  if (!x || typeof x !== 'object') return false
  try {
    return decodeBirth(encodeBirth(x as BirthData)) !== null
  } catch {
    return false
  }
}
