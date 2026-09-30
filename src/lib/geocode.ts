export interface Place {
  id: number
  name: string
  label: string
  latitude: number
  longitude: number
  timezone: string
}

interface OpenMeteoResult {
  id: number
  name: string
  latitude: number
  longitude: number
  timezone?: string
  country?: string
  admin1?: string
}

/** Free, key-less place search (Open-Meteo geocoding, GeoNames data) that includes the IANA time zone. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim().slice(0, 100)
  if (q.length < 2) return []
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`
  let res: Response
  try {
    res = await fetch(url, { signal, referrerPolicy: 'no-referrer', credentials: 'omit' })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new Error('Place search is unavailable right now. Please check your connection and try again.')
  }
  if (!res.ok) throw new Error('Place search is unavailable right now. Please try again shortly.')
  const data = (await res.json()) as { results?: OpenMeteoResult[] }
  return (data.results ?? [])
    .filter((r) => r.timezone && Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map((r) => ({
      id: r.id,
      name: r.name,
      label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone!,
    }))
}
