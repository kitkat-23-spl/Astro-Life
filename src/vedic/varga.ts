/**
 * Divisional charts (vargas). Each function maps a sidereal longitude to the
 * sign index (0 = Aries) it occupies in that division.
 *
 * D1, D2, D3, D4, D7, D9 and D10 follow Brihat Parashara Hora Shastra.
 * D5, D6 and D8 are not part of Parashara's sixteen vargas; we use the
 * methods found in later texts and common Jyotish software, and label them as
 * supplementary.
 */

export type VargaN = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

const isOdd = (sign: number) => sign % 2 === 0 // Aries (0) is an odd sign
const movable = (sign: number) => sign % 3 === 0 // Aries, Cancer, Libra, Capricorn
const fixed = (sign: number) => sign % 3 === 1 // Taurus, Leo, Scorpio, Aquarius

export function vargaSign(n: VargaN, lon: number): number {
  const L = ((lon % 360) + 360) % 360
  const sign = Math.floor(L / 30)
  const deg = L - sign * 30
  const part = (size: number) => Math.min(Math.floor(deg / size), Math.round(30 / size) - 1)

  switch (n) {
    case 1:
      return sign
    case 2: // Hora: odd signs Sun (Leo) then Moon (Cancer); even signs the reverse.
      return (deg < 15) === isOdd(sign) ? 4 : 3
    case 3: // Drekkana: same sign, 5th, 9th.
      return (sign + part(10) * 4) % 12
    case 4: // Chaturthamsa: same sign, 4th, 7th, 10th.
      return (sign + part(7.5) * 3) % 12
    case 5: { // Panchamsa: odd signs Aries, Aquarius, Sagittarius, Gemini, Libra; even signs Taurus, Virgo, Pisces, Capricorn, Scorpio.
      const odd = [0, 10, 8, 2, 6]
      const even = [1, 5, 11, 9, 7]
      return (isOdd(sign) ? odd : even)[part(6)]
    }
    case 6: // Shashthamsa: odd signs from Aries, even signs from Libra.
      return ((isOdd(sign) ? 0 : 6) + part(5)) % 12
    case 7: // Saptamsa: odd signs from the sign itself, even signs from the 7th.
      return (sign + (isOdd(sign) ? 0 : 6) + part(30 / 7)) % 12
    case 8: // Ashtamsa: movable from Aries, fixed from Sagittarius, dual from Leo.
      return ((movable(sign) ? 0 : fixed(sign) ? 8 : 4) + part(3.75)) % 12
    case 9: // Navamsa: movable from itself, fixed from the 9th, dual from the 5th (= continuous count from Aries).
      return Math.floor((L * 9) / 30) % 12
    case 10: // Dasamsa: odd signs from the sign itself, even signs from the 9th.
      return (sign + (isOdd(sign) ? 0 : 8) + part(3)) % 12
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
  { n: 1, code: 'D1', name: 'Rashi', domain: 'the whole life: body, personality and all events', keyHouses: [1], karakas: [], standard: true,
    about: 'The main birth chart. Every other division refines one area of it, and a promise must exist in D1 before a divisional chart can deliver it.' },
  { n: 2, code: 'D2', name: 'Hora', domain: 'wealth and the way resources are earned and kept', keyHouses: [2, 11], karakas: ['Jupiter'], standard: true,
    about: 'Each sign is split into a Sun half (Leo) and a Moon half (Cancer). Sun hora planets show wealth through effort, authority and self-made income; Moon hora planets show wealth through nurturing, public dealings, family and accumulation.' },
  { n: 3, code: 'D3', name: 'Drekkana', domain: 'siblings, courage, initiative and co-workers', keyHouses: [3, 11], karakas: ['Mars'], standard: true,
    about: 'Divides each sign into three 10° parts. It refines 3rd-house matters: siblings, courage, self-effort and the drive to act.' },
  { n: 4, code: 'D4', name: 'Chaturthamsa', domain: 'home, property, vehicles, fixed assets and inner contentment', keyHouses: [4], karakas: ['Moon', 'Mars', 'Venus'], standard: true,
    about: 'Divides each sign into four 7°30′ parts. Called the chart of fortune (bhagya) regarding residence, land and emotional security.' },
  { n: 5, code: 'D5', name: 'Panchamsa', domain: 'fame, authority, power and past merit (supplementary)', keyHouses: [1, 5, 10], karakas: ['Sun', 'Jupiter'], standard: false,
    about: 'Not one of Parashara’s sixteen vargas. Later traditions use it for fame, power and spiritual merit. Treat its readings as secondary.' },
  { n: 6, code: 'D6', name: 'Shashthamsa', domain: 'health, disease, debts and struggles (supplementary)', keyHouses: [1, 6], karakas: ['Mars', 'Saturn'], standard: false,
    about: 'Not one of Parashara’s sixteen vargas. Used in some traditions to examine health and the capacity to overcome illness and conflict.' },
  { n: 7, code: 'D7', name: 'Saptamsa', domain: 'children, progeny and creative legacy', keyHouses: [5], karakas: ['Jupiter'], standard: true,
    about: 'Divides each sign into seven parts. It refines 5th-house matters: children, relationships with them and what you create and pass on.' },
  { n: 8, code: 'D8', name: 'Ashtamsa', domain: 'sudden events, longevity and hidden matters (supplementary)', keyHouses: [1, 8], karakas: ['Saturn'], standard: false,
    about: 'Not one of Parashara’s sixteen vargas. Some traditions use it for unexpected events and longevity. Use with caution.' },
  { n: 9, code: 'D9', name: 'Navamsa', domain: 'marriage, dharma, inner strength and the second half of life', keyHouses: [1, 7, 9], karakas: ['Venus', 'Jupiter'], standard: true,
    about: 'The most important divisional chart. It shows the true strength of each planet (a planet weak in D1 but strong in D9 improves with time), the nature of marriage and your spiritual path.' },
  { n: 10, code: 'D10', name: 'Dasamsa', domain: 'career, profession, status and achievements', keyHouses: [1, 10], karakas: ['Sun', 'Saturn', 'Mercury'], standard: true,
    about: 'Divides each sign into ten 3° parts. It refines 10th-house matters: profession, rise in status, the kind of work that suits you and recognition.' },
]
