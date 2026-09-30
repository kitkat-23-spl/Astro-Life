import { norm360 } from './constants'

export type HouseSystem = 'placidus' | 'whole-sign' | 'equal'

export const HOUSE_SYSTEM_LABELS: Record<HouseSystem, string> = {
  placidus: 'Placidus',
  'whole-sign': 'Whole Sign',
  equal: 'Equal',
}

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

/** Midheaven: the ecliptic degree culminating on the local meridian. */
export function midheaven(ramc: number, obliquity: number): number {
  const r = ramc * RAD
  const e = obliquity * RAD
  return norm360(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(e)) * DEG)
}

/** Ascendant: the ecliptic degree rising on the eastern horizon. */
export function ascendant(ramc: number, obliquity: number, latitude: number): number {
  const r = ramc * RAD
  const e = obliquity * RAD
  const phi = latitude * RAD
  const asc = Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) * DEG
  return norm360(asc)
}

/** Ecliptic longitude whose right ascension is `ra` (point on the ecliptic). */
function raToLongitude(ra: number, obliquity: number): number {
  const r = ra * RAD
  return norm360(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(obliquity * RAD)) * DEG)
}

/**
 * Placidus cusp by iteration. A Placidus cusp is the ecliptic point that has
 * travelled a fixed fraction of its own diurnal (or nocturnal) semi-arc.
 * Returns null where the cusp is undefined (polar latitudes).
 */
function placidusCusp(ramc: number, obliquity: number, latitude: number, offset: number, fraction: number, nocturnal: boolean): number | null {
  const e = obliquity * RAD
  const tanPhi = Math.tan(latitude * RAD)
  let lon = raToLongitude(ramc + offset, obliquity)
  for (let i = 0; i < 60; i++) {
    const dec = Math.asin(Math.sin(e) * Math.sin(lon * RAD))
    const x = tanPhi * Math.tan(dec)
    if (Math.abs(x) > 1) return null
    const ad = Math.asin(x) * DEG // ascensional difference
    const ra = nocturnal
      ? ramc + 180 - fraction * (90 - ad)
      : ramc + fraction * (90 + ad)
    const next = raToLongitude(ra, obliquity)
    if (Math.abs(norm360(next - lon + 180) - 180) < 1e-7) return next
    lon = next
  }
  return lon
}

export interface HouseResult {
  cusps: number[] // 12 cusp longitudes, index 0 = 1st house
  system: HouseSystem
  fellBack: boolean
}

export function computeHouses(system: HouseSystem, ramc: number, obliquity: number, latitude: number): HouseResult {
  const asc = ascendant(ramc, obliquity, latitude)
  const mc = midheaven(ramc, obliquity)

  if (system === 'placidus') {
    const c11 = placidusCusp(ramc, obliquity, latitude, 30, 1 / 3, false)
    const c12 = placidusCusp(ramc, obliquity, latitude, 60, 2 / 3, false)
    const c2 = placidusCusp(ramc, obliquity, latitude, 120, 2 / 3, true)
    const c3 = placidusCusp(ramc, obliquity, latitude, 150, 1 / 3, true)
    if (c11 !== null && c12 !== null && c2 !== null && c3 !== null) {
      // Houses 4–9 are the points opposite 10, 11, 12, 1, 2, 3.
      const cusps = [
        asc, c2, c3, norm360(mc + 180),
        norm360(c11 + 180), norm360(c12 + 180), norm360(asc + 180),
        norm360(c2 + 180), norm360(c3 + 180),
        mc, c11, c12,
      ]
      return { cusps, system, fellBack: false }
    }
    // Placidus is undefined inside the polar circles; fall back to Whole Sign.
    return { ...computeHouses('whole-sign', ramc, obliquity, latitude), fellBack: true }
  }

  if (system === 'equal') {
    return { cusps: Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30)), system, fellBack: false }
  }

  const start = Math.floor(asc / 30) * 30
  return { cusps: Array.from({ length: 12 }, (_, i) => norm360(start + i * 30)), system, fellBack: false }
}

/** 1-based house number for a longitude given 12 cusps. */
export function houseOf(longitude: number, cusps: number[]): number {
  const lon = norm360(longitude)
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]
    const end = cusps[(i + 1) % 12]
    const span = norm360(end - start)
    if (norm360(lon - start) < span) return i + 1
  }
  return 1
}
