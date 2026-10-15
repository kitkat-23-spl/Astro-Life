import type { BirthData } from '../astro/ephemeris'

/**
 * Paid reports are switched on per deployment with VITE_PAYWALL=on, once the
 * payment account is live. Until then every reading stays free.
 */
export const PAYWALL = import.meta.env.VITE_PAYWALL === 'on'

/** Credit packs as shown on the Pricing page. The server holds the real prices (supabase/functions/_shared/common.ts). */
export const PACKS = [
  { id: 'p1', credits: 1, rupees: 299 },
  { id: 'p2', credits: 2, rupees: 499 },
  { id: 'p3', credits: 3, rupees: 699 },
  { id: 'p5', credits: 5, rupees: 1000 },
] as const
export type PackId = (typeof PACKS)[number]['id']
export const FROM_PRICE = PACKS[0].rupees

/** Identifies one person's birth details: the same details always give the same key. */
export function birthKey(b: Pick<BirthData, 'date' | 'time' | 'latitude' | 'longitude' | 'timezone'>): string {
  return [b.date, b.time ?? '', b.latitude.toFixed(2), b.longitude.toFixed(2), b.timezone].join('|')
}

/**
 * Stand-in text for locked content: same rhythm as real prose, but random, so
 * the real reading is never placed in the page until the chart is unlocked.
 */
export function scramble(seed: string, words: number): string {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const next = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296 }
  const letters = 'etaoinshrdlucmfwypvbgk'
  const out: string[] = []
  for (let i = 0; i < words; i++) {
    const len = 2 + Math.floor(next() * 8)
    let w = ''
    for (let j = 0; j < len; j++) w += letters[Math.floor(next() * letters.length)]
    out.push(i === 0 ? w[0].toUpperCase() + w.slice(1) : w)
  }
  return `${out.join(' ')}.`
}

/** Only same-site paths are allowed as a return address after checkout. */
export const safeReturn = (p: string | null): string | null => (p && /^\/(?![/\\])/.test(p) ? p : null)
