import { useJsApiLoader } from '@react-google-maps/api'
import type { ReactNode } from 'react'
import { googleMapsApiKey, mapsLibraries } from '../../lib/maps'

function MapsLoader({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'travelplanner-maps',
    googleMapsApiKey,
    libraries: mapsLibraries,
  })

  if (loadError) {
    return (
      <>
        <p className="banner warn">Google Maps failed to load</p>
        {children}
      </>
    )
  }
  if (!isLoaded) return <p>…</p>
  return <>{children}</>
}

export function MapsProvider({ children }: { children: ReactNode }) {
  if (!googleMapsApiKey) return <>{children}</>
  return <MapsLoader>{children}</MapsLoader>
}
