/**
 * Divisional charts (vargas). Each function maps a sidereal longitude to the
 * sign index (0 = Aries) it occupies in that division.
 *
 * All vargas follow Brihat Parashara Hora Shastra (ch. 6) except D5, D6 and
 * D8, which are not among Parashara's sixteen and use later methods.
 */

export type VargaN = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 16 | 20 | 24 | 27 | 30 | 40 | 45 | 60

const isOdd = (sign: number) => sign % 2 === 0 // Aries (0) is an odd sign
const movable = (sign: number) => sign % 3 === 0 // Aries, Cancer, Libra, Capricorn
const fixed = (sign: number) => sign % 3 === 1 // Taurus, Leo, Scorpio, Aquarius
/** Start sign for movable / fixed / dual signs. */
const byQuality = (sign: number, m: number, f: number, d: number) => (movable(sign) ? m : fixed(sign) ? f : d)

/** Trimsamsa (D30) segments: [upper degree, sign index] for odd and even signs. */
const D30_ODD: [number, number][] = [[5, 0], [10, 10], [18, 8], [25, 2], [30, 6]] // Mars, Saturn, Jupiter, Mercury, Venus
const D30_EVEN: [number, number][] = [[5, 1], [12, 5], [20, 11], [25, 9], [30, 7]] // Venus, Mercury, Jupiter, Saturn, Mars

export function vargaSign(n: VargaN, lon: number): number {
  const L = ((lon % 360) + 360) % 360
  const sign = Math.floor(L / 30)
  const deg = L - sign * 30
  const part = Math.min(Math.floor((deg * n) / 30), n - 1)

  switch (n) {
    case 1: return sign
    case 2: return (deg < 15) === isOdd(sign) ? 4 : 3 // Hora: Leo (Sun) / Cancer (Moon)
    case 3: return (sign + part * 4) % 12 // same, 5th, 9th
    case 4: return (sign + part * 3) % 12 // same, 4th, 7th, 10th
    case 5: return (isOdd(sign) ? [0, 10, 8, 2, 6] : [1, 5, 11, 9, 7])[part]
    case 6: return ((isOdd(sign) ? 0 : 6) + part) % 12
    case 7: return (sign + (isOdd(sign) ? 0 : 6) + part) % 12
    case 8: return (byQuality(sign, 0, 8, 4) + part) % 12
    case 9: return Math.floor((L * 9) / 30) % 12
    case 10: return (sign + (isOdd(sign) ? 0 : 8) + part) % 12
    case 12: return (sign + part) % 12
    case 16: return (byQuality(sign, 0, 4, 8) + part) % 12 // Aries / Leo / Sagittarius
    case 20: return (byQuality(sign, 0, 8, 4) + part) % 12 // Aries / Sagittarius / Leo
    case 24: return ((isOdd(sign) ? 4 : 3) + part) % 12 // Leo / Cancer
    case 27: return Math.floor((L * 27) / 30) % 12 // fire from Aries, earth Cancer, air Libra, water Capricorn
    case 30: return (isOdd(sign) ? D30_ODD : D30_EVEN).find(([upto]) => deg < upto)![1]
    case 40: return ((isOdd(sign) ? 0 : 6) + part) % 12 // Aries / Libra
    case 45: return (byQuality(sign, 0, 4, 8) + part) % 12 // Aries / Leo / Sagittarius
    case 60: return (sign + part) % 12
  }
}

export interface VargaInfo {
  n: VargaN
  code: string
  name: string
  domain: string
  keyHouses: number[]
  karakas: string[]
  standard: boolean
  about: string
}

export const VARGAS: VargaInfo[] = [
  { n: 1, code: 'D1', name: 'Rashi', domain: 'the whole life', keyHouses: [1], karakas: [], standard: true,
    about: 'The birth chart. A divisional chart refines one area of D1 and cannot deliver what D1 does not promise.' },
  { n: 2, code: 'D2', name: 'Hora', domain: 'wealth', keyHouses: [2, 11], karakas: ['Jupiter'], standard: true,
    about: 'Each sign is halved into a Sun hora (Leo) and a Moon hora (Cancer). Sun hora planets point to earned income; Moon hora planets to accumulated and family wealth.' },
  { n: 3, code: 'D3', name: 'Drekkana', domain: 'siblings and courage', keyHouses: [3, 11], karakas: ['Mars'], standard: true,
    about: 'Three parts of 10° per sign. Used for siblings, initiative and self-effort.' },
  { n: 4, code: 'D4', name: 'Chaturthamsa', domain: 'property and home', keyHouses: [4], karakas: ['Moon', 'Mars', 'Venus'], standard: true,
    about: 'Four parts of 7°30′ per sign. Used for land, houses, vehicles and domestic contentment.' },
  { n: 5, code: 'D5', name: 'Panchamsa', domain: 'fame and authority', keyHouses: [1, 5, 10], karakas: ['Sun', 'Jupiter'], standard: false,
    about: 'Not one of Parashara’s sixteen vargas. Some traditions use it for status and power.' },
  { n: 6, code: 'D6', name: 'Shashthamsa', domain: 'health and disputes', keyHouses: [1, 6], karakas: ['Mars', 'Saturn'], standard: false,
    about: 'Not one of Parashara’s sixteen vargas. Some traditions use it for illness, debt and conflict.' },
  { n: 7, code: 'D7', name: 'Saptamsa', domain: 'children', keyHouses: [5], karakas: ['Jupiter'], standard: true,
    about: 'Seven parts per sign. Used for children and progeny.' },
  { n: 8, code: 'D8', name: 'Ashtamsa', domain: 'sudden events', keyHouses: [1, 8], karakas: ['Saturn'], standard: false,
    about: 'Not one of Parashara’s sixteen vargas. Some traditions use it for longevity and sudden events.' },
  { n: 9, code: 'D9', name: 'Navamsa', domain: 'marriage and inner strength', keyHouses: [1, 7, 9], karakas: ['Venus', 'Jupiter'], standard: true,
    about: 'The most used divisional chart. It shows the real strength of each planet, the nature of marriage and the dharma of the native.' },
  { n: 10, code: 'D10', name: 'Dasamsa', domain: 'career', keyHouses: [1, 10], karakas: ['Sun', 'Saturn', 'Mercury'], standard: true,
    about: 'Ten parts of 3° per sign. Used for profession, status and achievement.' },
  { n: 12, code: 'D12', name: 'Dwadasamsa', domain: 'parents', keyHouses: [4, 9], karakas: ['Sun', 'Moon'], standard: true,
    about: 'Twelve parts of 2°30′ per sign, counted from the sign itself. Used for father (9th, Sun) and mother (4th, Moon).' },
  { n: 16, code: 'D16', name: 'Shodasamsa', domain: 'vehicles and comforts', keyHouses: [4], karakas: ['Venus'], standard: true,
    about: 'Sixteen parts per sign. Used for vehicles, conveyances and everyday comforts.' },
  { n: 20, code: 'D20', name: 'Vimsamsa', domain: 'spiritual practice', keyHouses: [5, 9], karakas: ['Jupiter', 'Ketu'], standard: true,
    about: 'Twenty parts per sign. Used for worship, spiritual discipline and devotion.' },
  { n: 24, code: 'D24', name: 'Chaturvimsamsa', domain: 'education', keyHouses: [4, 5, 9], karakas: ['Mercury', 'Jupiter'], standard: true,
    about: 'Twenty-four parts per sign, also called Siddhamsa. Used for learning, degrees and knowledge.' },
  { n: 27, code: 'D27', name: 'Bhamsa', domain: 'strengths and weaknesses', keyHouses: [1], karakas: [], standard: true,
    about: 'Twenty-seven parts per sign, one per nakshatra pada group. Used for physical and mental stamina.' },
  { n: 30, code: 'D30', name: 'Trimsamsa', domain: 'misfortune and health', keyHouses: [6, 8], karakas: ['Saturn', 'Mars'], standard: true,
    about: 'Unequal parts ruled by Mars, Saturn, Jupiter, Mercury and Venus. Used for adversity, illness and character flaws.' },
  { n: 40, code: 'D40', name: 'Khavedamsa', domain: 'maternal legacy', keyHouses: [4], karakas: ['Moon'], standard: true,
    about: 'Forty parts per sign. Used for good and bad effects inherited through the mother’s line.' },
  { n: 45, code: 'D45', name: 'Akshavedamsa', domain: 'paternal legacy and character', keyHouses: [9], karakas: ['Sun'], standard: true,
    about: 'Forty-five parts per sign. Used for character and effects inherited through the father’s line.' },
  { n: 60, code: 'D60', name: 'Shashtiamsa', domain: 'past karma', keyHouses: [1], karakas: [], standard: true,
    about: 'Sixty parts of 30′ per sign. Parashara gives it great weight, but it changes every two minutes of birth time, so it needs an exact time.' },
]

export const VARGA_BY_N = Object.fromEntries(VARGAS.map((v) => [v.n, v])) as Record<VargaN, VargaInfo>
