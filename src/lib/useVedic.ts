import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import type { BirthData } from '../astro/ephemeris'
import { computeVedicChart } from '../vedic/sidereal'
import { decodeBirth } from './share'
import { useSettings } from './settings'

/** Birth data carried in the URL hash (#...), or null. */
export function useBirthFromHash(): { hash: string; birth: BirthData | null } {
  const { hash } = useLocation()
  const birth = useMemo(() => (hash.length > 1 ? decodeBirth(hash.slice(1)) : null), [hash])
  return { hash, birth }
}

/** Vedic chart computed with the visitor's calculation settings. */
export function useVedicChart(birth: BirthData | null) {
  const { settings } = useSettings()
  const { ayanamsa, node, karakas } = settings
  return useMemo(() => (birth ? computeVedicChart(birth, { ayanamsa, node, karakas }) : null), [birth, ayanamsa, node, karakas])
}
