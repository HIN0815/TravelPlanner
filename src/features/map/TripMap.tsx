import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import { useMemo } from 'react'
import { googleMapsApiKey } from '../../lib/maps'
import type { Spot, Transport } from '../../types/models'

interface TripMapProps {
  spots: Spot[]
  transports?: Transport[]
  height?: string
}

const defaultCenter = { lat: 22.3193, lng: 114.1694 }

export function TripMap({ spots, transports = [], height = '320px' }: TripMapProps) {
  const markers = useMemo(
    () => spots.filter((s) => s.lat != null && s.lng != null),
    [spots],
  )

  const center = markers[0]
    ? { lat: markers[0].lat!, lng: markers[0].lng! }
    : defaultCenter

  const paths = useMemo(() => {
    if (!window.google?.maps?.geometry) return []
    return transports
      .filter((t) => t.polyline)
      .map((t) => ({
        id: t.id,
        path: google.maps.geometry.encoding.decodePath(t.polyline),
      }))
  }, [transports])

  if (!googleMapsApiKey) {
    return <div className="map-fallback" style={{ height }}>Map API key missing</div>
  }

  if (!window.google?.maps) {
    return <div className="map-fallback" style={{ height }}>…</div>
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height, borderRadius: '12px' }}
      center={center}
      zoom={markers.length ? 12 : 10}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        styles: mapStyles,
      }}
    >
      {markers.map((s) => (
        <Marker key={s.id} position={{ lat: s.lat!, lng: s.lng! }} title={s.name} />
      ))}
      {paths.map((p) => (
        <Polyline
          key={p.id}
          path={p.path}
          options={{ strokeColor: '#1f6f5b', strokeWeight: 4, strokeOpacity: 0.85 }}
        />
      ))}
    </GoogleMap>
  )
}

const mapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f2efe8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3d3a34' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b8d4ce' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#e6e1d6' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#d5e4d0' }],
  },
]
