export type Element = 'Fire' | 'Earth' | 'Air' | 'Water'
export type Modality = 'Cardinal' | 'Fixed' | 'Mutable'

export type SignName =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces'

export type PlanetName =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter'
  | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto' | 'North Node'

export type PointName = PlanetName | 'Ascendant' | 'Midheaven'

export interface SignInfo {
  name: SignName
  glyph: string
  element: Element
  modality: Modality
  ruler: PlanetName
  modernRuler?: PlanetName
  symbol: string
  dates: string
}

// Glyphs use the text variation selector (U+FE0E) so they never render as emoji.
const T = '︎'

export const SIGNS: SignInfo[] = [
  { name: 'Aries', glyph: '♈' + T, element: 'Fire', modality: 'Cardinal', ruler: 'Mars', symbol: 'The Ram', dates: 'Mar 21 – Apr 19' },
  { name: 'Taurus', glyph: '♉' + T, element: 'Earth', modality: 'Fixed', ruler: 'Venus', symbol: 'The Bull', dates: 'Apr 20 – May 20' },
  { name: 'Gemini', glyph: '♊' + T, element: 'Air', modality: 'Mutable', ruler: 'Mercury', symbol: 'The Twins', dates: 'May 21 – Jun 20' },
  { name: 'Cancer', glyph: '♋' + T, element: 'Water', modality: 'Cardinal', ruler: 'Moon', symbol: 'The Crab', dates: 'Jun 21 – Jul 22' },
  { name: 'Leo', glyph: '♌' + T, element: 'Fire', modality: 'Fixed', ruler: 'Sun', symbol: 'The Lion', dates: 'Jul 23 – Aug 22' },
  { name: 'Virgo', glyph: '♍' + T, element: 'Earth', modality: 'Mutable', ruler: 'Mercury', symbol: 'The Maiden', dates: 'Aug 23 – Sep 22' },
  { name: 'Libra', glyph: '♎' + T, element: 'Air', modality: 'Cardinal', ruler: 'Venus', symbol: 'The Scales', dates: 'Sep 23 – Oct 22' },
  { name: 'Scorpio', glyph: '♏' + T, element: 'Water', modality: 'Fixed', ruler: 'Mars', modernRuler: 'Pluto', symbol: 'The Scorpion', dates: 'Oct 23 – Nov 21' },
  { name: 'Sagittarius', glyph: '♐' + T, element: 'Fire', modality: 'Mutable', ruler: 'Jupiter', symbol: 'The Archer', dates: 'Nov 22 – Dec 21' },
  { name: 'Capricorn', glyph: '♑' + T, element: 'Earth', modality: 'Cardinal', ruler: 'Saturn', symbol: 'The Sea-Goat', dates: 'Dec 22 – Jan 19' },
  { name: 'Aquarius', glyph: '♒' + T, element: 'Air', modality: 'Fixed', ruler: 'Saturn', modernRuler: 'Uranus', symbol: 'The Water-Bearer', dates: 'Jan 20 – Feb 18' },
  { name: 'Pisces', glyph: '♓' + T, element: 'Water', modality: 'Mutable', ruler: 'Jupiter', modernRuler: 'Neptune', symbol: 'The Fish', dates: 'Feb 19 – Mar 20' },
]

export const PLANET_GLYPHS: Record<PointName, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃',
  Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', 'North Node': '☊',
  Ascendant: 'AC', Midheaven: 'MC',
}

export const PLANETS: PlanetName[] = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node',
]

/** Traditional + modern essential dignities. */
export const DIGNITIES: Partial<Record<PlanetName, { domicile: SignName[]; exaltation?: SignName; detriment: SignName[]; fall?: SignName }>> = {
  Sun: { domicile: ['Leo'], exaltation: 'Aries', detriment: ['Aquarius'], fall: 'Libra' },
  Moon: { domicile: ['Cancer'], exaltation: 'Taurus', detriment: ['Capricorn'], fall: 'Scorpio' },
  Mercury: { domicile: ['Gemini', 'Virgo'], exaltation: 'Virgo', detriment: ['Sagittarius', 'Pisces'], fall: 'Pisces' },
  Venus: { domicile: ['Taurus', 'Libra'], exaltation: 'Pisces', detriment: ['Scorpio', 'Aries'], fall: 'Virgo' },
  Mars: { domicile: ['Aries', 'Scorpio'], exaltation: 'Capricorn', detriment: ['Libra', 'Taurus'], fall: 'Cancer' },
  Jupiter: { domicile: ['Sagittarius', 'Pisces'], exaltation: 'Cancer', detriment: ['Gemini', 'Virgo'], fall: 'Capricorn' },
  Saturn: { domicile: ['Capricorn', 'Aquarius'], exaltation: 'Libra', detriment: ['Cancer', 'Leo'], fall: 'Aries' },
  Uranus: { domicile: ['Aquarius'], detriment: ['Leo'] },
  Neptune: { domicile: ['Pisces'], detriment: ['Virgo'] },
  Pluto: { domicile: ['Scorpio'], detriment: ['Taurus'] },
}

export type AspectName = 'Conjunction' | 'Sextile' | 'Square' | 'Trine' | 'Opposition'

export interface AspectDef {
  name: AspectName
  angle: number
  orb: number
  glyph: string
  nature: 'blend' | 'flow' | 'tension'
}

export const ASPECTS: AspectDef[] = [
  { name: 'Conjunction', angle: 0, orb: 8, glyph: '☌', nature: 'blend' },
  { name: 'Sextile', angle: 60, orb: 4, glyph: '⚹', nature: 'flow' },
  { name: 'Square', angle: 90, orb: 7, glyph: '□', nature: 'tension' },
  { name: 'Trine', angle: 120, orb: 7, glyph: '△', nature: 'flow' },
  { name: 'Opposition', angle: 180, orb: 8, glyph: '☍', nature: 'tension' },
]

export const ELEMENT_COLORS: Record<Element, string> = {
  Fire: 'var(--fire)',
  Earth: 'var(--earth)',
  Air: 'var(--air)',
  Water: 'var(--water)',
}

export function signOf(longitude: number): SignInfo {
  return SIGNS[Math.floor(norm360(longitude) / 30) % 12]
}

export function norm360(x: number): number {
  const r = x % 360
  return r < 0 ? r + 360 : r
}

/** Smallest angular distance between two longitudes, 0..180. */
export function angDist(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b))
  return d > 180 ? 360 - d : d
}

/** "14°32′" within its sign. */
export function formatDegree(longitude: number): string {
  const inSign = norm360(longitude) % 30
  let deg = Math.floor(inSign)
  let min = Math.round((inSign - deg) * 60)
  if (min === 60) { deg += 1; min = 0 }
  return `${deg}°${String(min).padStart(2, '0')}′`
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
