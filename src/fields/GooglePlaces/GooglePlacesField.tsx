'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { useField, useAllFormFields } from '@payloadcms/ui'
import regionToContinentMap from '@/utilities/continentMap'
import { getByCountryName } from '@/lib/countries/countriesUtils'
import { loadGoogleMaps } from '@/lib/google-maps/loader'

type Coordinates = { lat: number; lng: number }

export type LocationDataValue = {
  address?: string
  coordinates?: Coordinates | null
  placeID?: string
  country?: string
  continent?: string
  city?: string
  tempCountryData?: {
    countryName?: string
    countryCode?: string
    currencyCode?: string
    languageCode?: string
    region?: string
  }
}

type Props = {
  path: string
  label?: string
  required?: boolean
}

export default function GooglePlacesField({
  path,
  label = 'Location',
  required = false,
}: Props) {
  const { value, setValue } = useField<LocationDataValue>({ path })
  const [_allFields, dispatch] = useAllFormFields()
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    loadGoogleMaps().then(() => {
      if (!inputRef.current || autocompleteRef.current) return

      // Create autocomplete instance
      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
        fields: ['address_components', 'formatted_address', 'geometry', 'place_id', 'name'],
      })

      // Add listener
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (!place || !place.geometry?.location) return

        // Extract location details
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()

        // Get address components
        const countryComp = place.address_components?.find((c: any) =>
          c.types.includes('country')
        )
        const countryName = countryComp?.long_name || ''
        const staticData = getByCountryName(countryName)
        const continent = staticData ? regionToContinentMap[staticData.code] || staticData.region : ''

        const cityComp = place.address_components?.find((c: any) =>
          ['locality', 'administrative_area_level_3', 'administrative_area_level_2'].some(t => c.types.includes(t))
        )
        const city = cityComp?.long_name || place.name || ''

        // Set value
        const nextVal: LocationDataValue = {
          address: place.formatted_address || '',
          coordinates: { lat, lng },
          placeID: place.place_id || '',
          country: staticData ? staticData.label : countryName,
          continent,
          city,
          tempCountryData: staticData ? {
            countryName: staticData.label,
            countryCode: staticData.code,
            currencyCode: staticData.currency?.code,
            languageCode: staticData.language?.code || undefined,
            region: staticData.region,
          } : undefined,
        }

        setValue(nextVal)

        // Mirror to flat fields
        dispatch({ type: 'UPDATE', path: 'continent', value: continent })
        dispatch({ type: 'UPDATE', path: 'city', value: city })

        // Set title
        const titleVal = city && (staticData ? staticData.label : countryName)
          ? `${city}, ${staticData ? staticData.label : countryName}`
          : ''
        dispatch({ type: 'UPDATE', path: 'title', value: titleVal })
      })
    }).catch(err => {
      console.error('Failed to load Google Maps:', err)
    })

    return () => {
      if (autocompleteRef.current) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [setValue, dispatch])

  return (
    <div className="field-type">
      <label className="field-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      
      <input
        ref={inputRef}
        type="text"
        className="field-type__input"
        placeholder="Search for a location"
        defaultValue={value?.address || ''}
      />

      {value && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
          {value.city && <div><strong>City:</strong> {value.city}</div>}
          {value.country && <div><strong>Country:</strong> {value.country}</div>}
          {value.continent && <div><strong>Continent:</strong> {value.continent}</div>}
          {value.coordinates && (
            <div>
              <strong>Coordinates:</strong> {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}