'use client'

import React, { useState } from 'react'
import { Button } from '@payloadcms/ui'
import { useField } from '@payloadcms/ui'

export const GeocodeLocationButton: React.FC = () => {
  const { value: locationSearch, setValue: setLocationSearch } = useField<string>({ path: 'locationSearch' })
  const { setValue: setCoordinates } = useField<{ lat: number; lng: number }>({ path: 'coordinates' })
  const { setValue: setAddress } = useField<string>({ path: 'address' })
  
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [status, setStatus] = useState<string>('')

  const handleGeocode = async () => {
    if (!locationSearch) {
      setStatus('Please enter a location to search')
      return
    }

    setIsGeocoding(true)
    setStatus('Searching...')

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: locationSearch }),
      })

      if (!response.ok) {
        throw new Error('Failed to geocode location')
      }

      const result = await response.json()
      
      if (result.lat && result.lng) {
        setCoordinates({ lat: result.lat, lng: result.lng })
        setAddress(result.formatted_address || locationSearch)
        setStatus('Location found!')
      } else {
        setStatus('Location not found')
      }
    } catch (error) {
      console.error('Error geocoding:', error)
      setStatus('Error finding location')
    } finally {
      setIsGeocoding(false)
    }
  }

  return (
    <div style={{ marginTop: '10px' }}>
      <Button
        onClick={handleGeocode}
        disabled={isGeocoding || !locationSearch}
        size="small"
      >
        {isGeocoding ? 'Searching...' : 'Find Coordinates'}
      </Button>
      {status && (
        <p style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
          {status}
        </p>
      )}
    </div>
  )
}

export default GeocodeLocationButton