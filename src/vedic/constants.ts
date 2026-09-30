import type { SignName } from '../astro/constants'

export type Graha = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu'

export const GRAHAS: Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']
/** The seven visible planets, which own signs and take dignities. */
export const SEVEN: Graha[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']

export const GRAHA_INFO: Record<Graha, { sanskrit: string; abbr: string; karaka: string; nature: 'benefic' | 'malefic' }> = {
  Sun: { sanskrit: 'Surya', abbr: 'Su', karaka: 'soul, confidence, father, authority and vitality', nature: 'malefic' },
  Moon: { sanskrit: 'Chandra', abbr: 'Mo', karaka: 'mind, emotions, mother, comfort and public connection', nature: 'benefic' },
  Mars: { sanskrit: 'Mangala', abbr: 'Ma', karaka: 'energy, courage, siblings, land and competitive drive', nature: 'malefic' },
  Mercury: { sanskrit: 'Budha', abbr: 'Me', karaka: 'intellect, speech, learning, trade and adaptability', nature: 'benefic' },
  Jupiter: { sanskrit: 'Guru', abbr: 'Ju', karaka: 'wisdom, teachers, children, fortune and dharma', nature: 'benefic' },
  Venus: { sanskrit: 'Shukra', abbr: 'Ve', karaka: 'love, spouse, beauty, comforts, arts and vehicles', nature: 'benefic' },
  Saturn: { sanskrit: 'Shani', abbr: 'Sa', karaka: 'discipline, hard work, longevity, delays and justice', nature: 'malefic' },
  Rahu: { sanskrit: 'Rahu', abbr: 'Ra', karaka: 'ambition, obsession, foreign and unconventional paths, technology', nature: 'malefic' },
  Ketu: { sanskrit: 'Ketu', abbr: 'Ke', karaka: 'detachment, spirituality, intuition, past-life skills and sudden separation', nature: 'malefic' },
}

export const RASHI: Record<SignName, string> = {
  Aries: 'Mesha', Taurus: 'Vrishabha', Gemini: 'Mithuna', Cancer: 'Karka', Leo: 'Simha', Virgo: 'Kanya',
  Libra: 'Tula', Scorpio: 'Vrishchika', Sagittarius: 'Dhanu', Capricorn: 'Makara', Aquarius: 'Kumbha', Pisces: 'Meena',
}

/** Sign index (0 = Aries) → ruling graha. */
export const SIGN_LORD: Graha[] = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter']

/** Exaltation sign index and exact degree (Brihat Parashara Hora Shastra). Debilitation is the opposite point. */
export const EXALTATION: Partial<Record<Graha, { sign: number; degree: number }>> = {
  Sun: { sign: 0, degree: 10 }, Moon: { sign: 1, degree: 3 }, Mars: { sign: 9, degree: 28 },
  Mercury: { sign: 5, degree: 15 }, Jupiter: { sign: 3, degree: 5 }, Venus: { sign: 11, degree: 27 }, Saturn: { sign: 6, degree: 20 },
}

/** Moolatrikona sign index and degree range. */
export const MOOLATRIKONA: Partial<Record<Graha, { sign: number; from: number; to: number }>> = {
  Sun: { sign: 4, from: 0, to: 20 }, Moon: { sign: 1, from: 3, to: 30 }, Mars: { sign: 0, from: 0, to: 12 },
  Mercury: { sign: 5, from: 15, to: 20 }, Jupiter: { sign: 8, from: 0, to: 10 }, Venus: { sign: 6, from: 0, to: 15 }, Saturn: { sign: 10, from: 0, to: 20 },
}

/** Naisargika (natural) relationships. */
export const FRIENDS: Partial<Record<Graha, { friends: Graha[]; enemies: Graha[] }>> = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'] },
}

/** Orb (degrees from the Sun) within which a planet is combust (asta). */
export const COMBUSTION: Partial<Record<Graha, { direct: number; retro: number }>> = {
  Moon: { direct: 12, retro: 12 }, Mars: { direct: 17, retro: 17 }, Mercury: { direct: 14, retro: 12 },
  Jupiter: { direct: 11, retro: 11 }, Venus: { direct: 10, retro: 8 }, Saturn: { direct: 15, retro: 15 },
}

/** Directional strength (dig bala): house where each planet is strongest. */
export const DIG_BALA: Partial<Record<Graha, number>> = { Sun: 10, Mars: 10, Jupiter: 1, Mercury: 1, Moon: 4, Venus: 4, Saturn: 7 }

export interface BhavaInfo { name: string; topics: string; short: string }

export const BHAVA: BhavaInfo[] = [
  { name: 'Tanu', short: 'self', topics: 'self, body, health, personality and overall direction in life' },
  { name: 'Dhana', short: 'wealth', topics: 'wealth, family, speech, food and accumulated resources' },
  { name: 'Sahaja', short: 'courage', topics: 'courage, effort, siblings, communication and short journeys' },
  { name: 'Sukha', short: 'home', topics: 'mother, home, property, vehicles, inner peace and basic education' },
  { name: 'Putra', short: 'children & intellect', topics: 'children, intelligence, creativity, romance and past-life merit (purva punya)' },
  { name: 'Ari', short: 'obstacles', topics: 'enemies, disease, debts, competition, service and daily work' },
  { name: 'Kalatra', short: 'partnership', topics: 'spouse, marriage, business partnerships and public dealings' },
  { name: 'Ayu', short: 'transformation', topics: 'longevity, sudden events, inheritance, research, occult and transformation' },
  { name: 'Dharma', short: 'fortune', topics: 'fortune (bhagya), father, teachers, higher learning, dharma and long journeys' },
  { name: 'Karma', short: 'career', topics: 'career, status, authority, reputation and actions in the world' },
  { name: 'Labha', short: 'gains', topics: 'gains, income, elder siblings, networks and fulfilment of desires' },
  { name: 'Vyaya', short: 'release', topics: 'expenses, losses, foreign lands, solitude, sleep and moksha (liberation)' },
]

export const KENDRA = [1, 4, 7, 10]
export const TRIKONA = [1, 5, 9]
export const DUSTHANA = [6, 8, 12]
export const UPACHAYA = [3, 6, 10, 11]

export interface Nakshatra { name: string; lord: Graha; deity: string; symbol: string; keywords: string }

export const NAKSHATRAS: Nakshatra[] = [
  { name: 'Ashwini', lord: 'Ketu', deity: 'Ashwini Kumaras', symbol: 'Horse’s head', keywords: 'swift, healing, pioneering, energetic' },
  { name: 'Bharani', lord: 'Venus', deity: 'Yama', symbol: 'Yoni', keywords: 'intense, creative, responsible, bearing burdens' },
  { name: 'Krittika', lord: 'Sun', deity: 'Agni', symbol: 'Razor / flame', keywords: 'sharp, purifying, determined, critical' },
  { name: 'Rohini', lord: 'Moon', deity: 'Brahma', symbol: 'Chariot', keywords: 'fertile, charming, artistic, material growth' },
  { name: 'Mrigashira', lord: 'Mars', deity: 'Soma', symbol: 'Deer’s head', keywords: 'searching, curious, gentle, restless' },
  { name: 'Ardra', lord: 'Rahu', deity: 'Rudra', symbol: 'Teardrop', keywords: 'stormy, transformative, intellectual, raw' },
  { name: 'Punarvasu', lord: 'Jupiter', deity: 'Aditi', symbol: 'Quiver of arrows', keywords: 'renewal, optimism, return, generosity' },
  { name: 'Pushya', lord: 'Saturn', deity: 'Brihaspati', symbol: 'Cow’s udder', keywords: 'nourishing, dutiful, protective, spiritual' },
  { name: 'Ashlesha', lord: 'Mercury', deity: 'Nagas', symbol: 'Coiled serpent', keywords: 'penetrating, strategic, mystical, binding' },
  { name: 'Magha', lord: 'Ketu', deity: 'Pitris (ancestors)', symbol: 'Throne', keywords: 'regal, traditional, ancestral pride, leadership' },
  { name: 'Purva Phalguni', lord: 'Venus', deity: 'Bhaga', symbol: 'Front legs of a bed', keywords: 'pleasure, romance, creativity, rest' },
  { name: 'Uttara Phalguni', lord: 'Sun', deity: 'Aryaman', symbol: 'Back legs of a bed', keywords: 'loyal, generous, contractual, helpful' },
  { name: 'Hasta', lord: 'Moon', deity: 'Savitar', symbol: 'Hand', keywords: 'skilful, clever, crafty, healing hands' },
  { name: 'Chitra', lord: 'Mars', deity: 'Vishvakarma', symbol: 'Bright jewel', keywords: 'artistic, brilliant, design-minded, striking' },
  { name: 'Swati', lord: 'Rahu', deity: 'Vayu', symbol: 'Young sprout in the wind', keywords: 'independent, flexible, business-minded, diplomatic' },
  { name: 'Vishakha', lord: 'Jupiter', deity: 'Indra-Agni', symbol: 'Triumphal arch', keywords: 'goal-driven, ambitious, determined, focused' },
  { name: 'Anuradha', lord: 'Saturn', deity: 'Mitra', symbol: 'Lotus', keywords: 'devoted, friendly, organised, resilient' },
  { name: 'Jyeshtha', lord: 'Mercury', deity: 'Indra', symbol: 'Earring / umbrella', keywords: 'senior, protective, powerful, responsible' },
  { name: 'Mula', lord: 'Ketu', deity: 'Nirriti', symbol: 'Bunch of roots', keywords: 'root-seeking, investigative, radical, uprooting' },
  { name: 'Purva Ashadha', lord: 'Venus', deity: 'Apas (waters)', symbol: 'Fan', keywords: 'invincible, persuasive, purifying, proud' },
  { name: 'Uttara Ashadha', lord: 'Sun', deity: 'Vishvadevas', symbol: 'Elephant tusk', keywords: 'righteous, enduring, final victory, principled' },
  { name: 'Shravana', lord: 'Moon', deity: 'Vishnu', symbol: 'Ear', keywords: 'listening, learning, connecting, wise' },
  { name: 'Dhanishta', lord: 'Mars', deity: 'Eight Vasus', symbol: 'Drum', keywords: 'rhythmic, wealthy, musical, ambitious' },
  { name: 'Shatabhisha', lord: 'Rahu', deity: 'Varuna', symbol: 'Empty circle', keywords: 'healing, secretive, scientific, solitary' },
  { name: 'Purva Bhadrapada', lord: 'Jupiter', deity: 'Aja Ekapada', symbol: 'Front of a funeral cot', keywords: 'intense, idealistic, transformative, fiery' },
  { name: 'Uttara Bhadrapada', lord: 'Saturn', deity: 'Ahir Budhnya', symbol: 'Back of a funeral cot', keywords: 'deep, patient, wise, controlled' },
  { name: 'Revati', lord: 'Mercury', deity: 'Pushan', symbol: 'Fish / drum', keywords: 'nurturing, safe journeys, compassionate, completing' },
]

export const NAKSHATRA_SPAN = 360 / 27

/** Vimshottari dasha sequence and years. */
export const DASHA_ORDER: Graha[] = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
export const DASHA_YEARS: Record<Graha, number> = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 }

export function houseFrom(fromSign: number, sign: number): number {
  return ((sign - fromSign + 12) % 12) + 1
}
