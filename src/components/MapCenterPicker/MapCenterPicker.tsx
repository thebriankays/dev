'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'
import { loadGoogleMaps } from '@/lib/google-maps/loader'
import './map-center-picker.scss'

interface Coordinates {
  lat: number
  lng: number
}

interface MapCenterPickerProps {
  path: string
  label?: string
  required?: boolean
}

const MapCenterPicker: React.FC<MapCenterPickerProps> = ({ 
  path, 
  label = 'Map Center', 
  required 
}) => {
  const { value, setValue } = useField<Coordinates>({ path })
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapRef.current || isLoaded) return

    loadGoogleMaps()
      .then((google) => {
        if (!mapRef.current) return

        const initialCenter = value || { lat: 0, lng: 0 }
        
        // Create map
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: value ? 10 : 2,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
        })

        // Create marker
        markerRef.current = new google.maps.Marker({
          position: initialCenter,
          map: mapInstanceRef.current,
          draggable: true,
          title: 'Drag to set map center',
        })

        // Update coordinates on marker drag
        markerRef.current.addListener('dragend', () => {
          const position = markerRef.current.getPosition()
          if (position) {
            const newCoords = {
              lat: position.lat(),
              lng: position.lng(),
            }
            setValue(newCoords)
          }
        })

        // Update marker on map click
        mapInstanceRef.current.addListener('click', (event: any) => {
          if (event.latLng) {
            const newCoords = {
              lat: event.latLng.lat(),
              lng: event.latLng.lng(),
            }
            setValue(newCoords)
            markerRef.current.setPosition(event.latLng)
          }
        })

        setIsLoaded(true)
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err)
        setError('Failed to load map. Please check your API key.')
      })
  }, [isLoaded, value, setValue])

  // Update marker position when value changes externally
  useEffect(() => {
    if (markerRef.current && value && isLoaded) {
      const position = new (window as any).google.maps.LatLng(value.lat, value.lng)
      markerRef.current.setPosition(position)
      mapInstanceRef.current.setCenter(position)
    }
  }, [value, isLoaded])

  const handleInputChange = (coord: 'lat' | 'lng', valueStr: string) => {
    const numValue = parseFloat(valueStr)
    if (!isNaN(numValue)) {
      const newCoords = {
        ...value,
        [coord]: numValue,
      } as Coordinates
      setValue(newCoords)
    }
  }

  return (
    <div className="map-center-picker">
      <div className="field-label">
        {label}
        {required && <span className="required">*</span>}
      </div>
      
      <div className="map-center-picker__controls">
        <div className="coordinate-input">
          <label>Latitude</label>
          <input
            type="number"
            step="0.000001"
            value={value?.lat || 0}
            onChange={(e) => handleInputChange('lat', e.target.value)}
            placeholder="0.000000"
          />
        </div>
        <div className="coordinate-input">
          <label>Longitude</label>
          <input
            type="number"
            step="0.000001"
            value={value?.lng || 0}
            onChange={(e) => handleInputChange('lng', e.target.value)}
            placeholder="0.000000"
          />
        </div>
      </div>

      {error ? (
        <div className="map-center-picker__error">{error}</div>
      ) : (
        <div className="map-center-picker__map" ref={mapRef} />
      )}
      
      <p className="field-description">
        Click on the map or drag the marker to set the center coordinates
      </p>
    </div>
  )
}

export default MapCenterPicker