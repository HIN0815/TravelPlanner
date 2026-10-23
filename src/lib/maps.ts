export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

export const isMapsConfigured = Boolean(googleMapsApiKey)

export const mapsLibraries: ('places' | 'routes' | 'geometry')[] = [
  'places',
  'routes',
  'geometry',
]

export type TravelModeKey = 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT'

export const travelModeOptions: { value: TravelModeKey; labelKey: string }[] = [
  { value: 'WALK', labelKey: 'transport.walk' },
  { value: 'TRANSIT', labelKey: 'transport.transit' },
  { value: 'DRIVE', labelKey: 'transport.drive' },
  { value: 'BICYCLE', labelKey: 'transport.bicycle' },
]

export async function fetchRouteBetween(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  travelMode: TravelModeKey,
): Promise<{
  durationSeconds: number
  distanceMeters: number
  polyline: string
  mode: TravelModeKey
} | null> {
  if (!isMapsConfigured) return null

  const url = 'https://routes.googleapis.com/directions/v2:computeRoutes'
  const body = {
    origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
    destination: {
      location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
    },
    travelMode,
    computeAlternativeRoutes: false,
    languageCode: 'zh-HK',
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleMapsApiKey,
      'X-Goog-FieldMask':
        'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('Routes API error', await res.text())
    return null
  }

  const data = (await res.json()) as {
    routes?: Array<{
      duration?: string
      distanceMeters?: number
      polyline?: { encodedPolyline?: string }
    }>
  }

  const route = data.routes?.[0]
  if (!route) return null

  const durationSeconds = Number((route.duration ?? '0s').replace('s', '')) || 0

  return {
    durationSeconds,
    distanceMeters: route.distanceMeters ?? 0,
    polyline: route.polyline?.encodedPolyline ?? '',
    mode: travelMode,
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}
