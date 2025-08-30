'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import './area-explorer.scss'

interface AreaExplorerProps {
  initialLocation?: {
    lat: number
    lng: number
    name?: string
  }
}

export function AreaExplorer({ initialLocation }: AreaExplorerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const [status, setStatus] = useState('loading')
  const [currentLocation, setCurrentLocation] = useState(initialLocation)

  useEffect(() => {
    let mounted = true;
    let map: google.maps.Map | null = null;
    
    const initMap = async () => {
      if (!mapContainerRef.current || !mounted) return

      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
        
        if (!apiKey) {
          throw new Error('Google Maps API key is missing')
        }
        
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['marker', 'core'],
          mapIds: mapId ? [mapId] : []
        })

        await loader.load()

        // Default to San Francisco if no initial location
        const defaultLocation = { lat: 37.7749, lng: -122.4194 }
        const centerLocation = initialLocation && 
          typeof initialLocation.lat === 'number' && 
          typeof initialLocation.lng === 'number' 
          ? initialLocation 
          : defaultLocation

        // Create standard Google Maps with 3D tiles enabled via mapId
        map = new google.maps.Map(mapContainerRef.current, {
          center: centerLocation,
          zoom: 17,
          tilt: 65,
          heading: 0,
          mapId: mapId || '', // This enables 3D tiles
          disableDefaultUI: false,
          gestureHandling: 'greedy',
          // Enable 3D controls
          tiltInteractionEnabled: true,
          headingInteractionEnabled: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
          }
        })

        mapInstance.current = map
        console.log('Map created successfully with 3D tiles enabled')

        if (mounted) {
          setStatus('ready')
          setCurrentLocation(centerLocation)
        }
      } catch (error) {
        console.error('Failed to initialize Area Explorer:', error)
        if (mounted) {
          setStatus('error')
        }
      }
    }

    initMap()

    return () => {
      mounted = false;
      // Clean up map instance
      if (map) {
        // Google Maps doesn't have a destroy method, but we can clear the container
        if (mapContainerRef.current) {
          mapContainerRef.current.innerHTML = ''
        }
      }
    }
  }, []) // Empty dependency to run only once

  const handleCameraControl = (action: string) => {
    if (!mapInstance.current) return

    const map = mapInstance.current
    const currentHeading = map.getHeading() || 0
    const currentTilt = map.getTilt() || 0
    const currentZoom = map.getZoom() || 17

    switch (action) {
      case 'rotateLeft':
        map.setHeading(currentHeading - 30)
        break
      case 'rotateRight':
        map.setHeading(currentHeading + 30)
        break
      case 'tiltUp':
        map.setTilt(Math.min(currentTilt + 10, 67.5))
        break
      case 'tiltDown':
        map.setTilt(Math.max(currentTilt - 10, 0))
        break
      case 'zoomIn':
        map.setZoom(Math.min(currentZoom + 1, 21))
        break
      case 'zoomOut':
        map.setZoom(Math.max(currentZoom - 1, 10))
        break
      case 'reset':
        if (currentLocation) {
          map.setCenter(currentLocation)
          map.setZoom(17)
          map.setTilt(65)
          map.setHeading(0)
        }
        break
    }
  }

  if (status === 'error') {
    return (
      <div className="area-explorer__container">
        <div className="area-explorer__overlay">
          Failed to load Google Maps. Please check your API key and try again.
        </div>
      </div>
    )
  }

  return (
    <div className="area-explorer__container">
      <div ref={mapContainerRef} className="area-explorer__map-wrapper">
        {status === 'loading' && (
          <div className="area-explorer__overlay">Loading 3D Map...</div>
        )}
      </div>

      <div className="area-explorer__controls">
        <div className="area-explorer__camera-section">
          <h3>3D Map Controls</h3>
          <div className="area-explorer__camera-controls">
            <button onClick={() => handleCameraControl('rotateLeft')}>
              ← Rotate Left
            </button>
            <button onClick={() => handleCameraControl('rotateRight')}>
              Rotate Right →
            </button>
            <button onClick={() => handleCameraControl('tiltUp')}>
              ↑ Tilt Up
            </button>
            <button onClick={() => handleCameraControl('tiltDown')}>
              ↓ Tilt Down
            </button>
            <button onClick={() => handleCameraControl('zoomIn')}>
              + Zoom In
            </button>
            <button onClick={() => handleCameraControl('zoomOut')}>
              - Zoom Out
            </button>
            <button onClick={() => handleCameraControl('reset')}>
              ⟲ Reset View
            </button>
          </div>
        </div>

        {currentLocation && (
          <div className="area-explorer__location-info">
            <h3>Current Location</h3>
            <p className="area-explorer__location-name">
              {currentLocation.name || 'Custom Location'}
            </p>
            <p className="area-explorer__location-coords">
              Lat: {currentLocation.lat.toFixed(6)}<br/>
              Lng: {currentLocation.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="area-explorer__info">
          <h3>Navigation Tips</h3>
          <ul>
            <li>Drag to pan around the map</li>
            <li>Scroll to zoom in/out</li>
            <li>Ctrl + drag to rotate and tilt</li>
            <li>Use the controls above for precise movement</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
