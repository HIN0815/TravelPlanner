import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { isMapsConfigured } from '../../lib/maps'

interface PlaceResult {
  name: string
  placeId: string | null
  lat: number | null
  lng: number | null
}

interface PlaceSearchProps {
  onSelect: (place: PlaceResult) => void
  disabled?: boolean
}

export function PlaceSearch({ onSelect, disabled }: PlaceSearchProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isMapsConfigured || !inputRef.current || disabled) return
    if (!window.google?.maps?.places) return

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['place_id', 'name', 'geometry', 'formatted_address'],
    })

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const loc = place.geometry?.location
      onSelect({
        name: place.name || place.formatted_address || '',
        placeId: place.place_id ?? null,
        lat: loc ? loc.lat() : null,
        lng: loc ? loc.lng() : null,
      })
      if (inputRef.current) inputRef.current.value = ''
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [onSelect, disabled])

  return (
    <input
      ref={inputRef}
      type="text"
      className="input"
      placeholder={t('trips.searchPlace')}
      disabled={disabled || !isMapsConfigured}
    />
  )
}
