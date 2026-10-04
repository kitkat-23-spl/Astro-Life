/** Calculation and display preferences. Stored per browser; share links carry only birth data. */

export type Ayanamsa = 'lahiri' | 'raman' | 'kp' | 'true-chitra'
export type NodeMode = 'mean' | 'true'
export type KarakaScheme = 7 | 8
export type ChartStyle = 'north' | 'south'
export type Gender = 'male' | 'female' | 'unspecified'
export type AstroSystem = 'vedic' | 'western'

export interface CalcSettings {
  ayanamsa: Ayanamsa
  node: NodeMode
  karakas: KarakaScheme
}

export interface Preferences extends CalcSettings {
  chartStyle: ChartStyle
  /** Used for the gender-specific karaka rules in the marriage and children reports. */
  gender: Gender
  system: AstroSystem
  /** Place used by the Panchang page. */
  place: SavedPlace | null
}

export interface SavedPlace { label: string; latitude: number; longitude: number; timezone: string }

const NEW_DELHI: SavedPlace = { label: 'New Delhi, India', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' }
export const DEFAULT_PLACE = NEW_DELHI

function validPlace(p: unknown): SavedPlace | null {
  const x = p as SavedPlace | null
  return x && typeof x.label === 'string' && Number.isFinite(x.latitude) && Number.isFinite(x.longitude) && Math.abs(x.latitude) <= 90 && typeof x.timezone === 'string'
    ? { label: x.label.slice(0, 120), latitude: x.latitude, longitude: x.longitude, timezone: x.timezone.slice(0, 64) }
    : null
}

export const DEFAULT_SETTINGS: Preferences = { ayanamsa: 'lahiri', node: 'mean', karakas: 7, chartStyle: 'north', gender: 'unspecified', system: 'vedic', place: null }

export const AYANAMSA_LABEL: Record<Ayanamsa, string> = {
  lahiri: 'Lahiri (Chitrapaksha)',
  raman: 'B. V. Raman',
  kp: 'Krishnamurti (KP)',
  'true-chitra': 'True Chitra (Spica at 180°)',
}

const KEY = 'astrolife:settings'
/** Keys used by earlier versions, read once so existing visitors keep their choices. */
const LEGACY = { chartStyle: 'astrolife:chart-style', gender: 'astrolife:gender', system: 'astrolife:system' }

export function loadSettings(): Preferences {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Preferences>
    const legacy = (k: keyof typeof LEGACY) => localStorage.getItem(LEGACY[k])
    const style = raw.chartStyle ?? legacy('chartStyle')
    const gender = raw.gender ?? legacy('gender')
    const system = raw.system ?? legacy('system')
    return {
      ayanamsa: raw.ayanamsa && raw.ayanamsa in AYANAMSA_LABEL ? raw.ayanamsa : DEFAULT_SETTINGS.ayanamsa,
      node: raw.node === 'true' ? 'true' : 'mean',
      karakas: raw.karakas === 8 ? 8 : 7,
      chartStyle: style === 'south' ? 'south' : 'north',
      gender: gender === 'male' || gender === 'female' ? gender : 'unspecified',
      system: system === 'western' ? 'western' : 'vedic',
      place: validPlace(raw.place),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: Preferences) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
    for (const k of Object.values(LEGACY)) localStorage.removeItem(k)
  } catch {
    // Storage unavailable: settings last for this visit only.
  }
}
