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
  const mapInstance = useRef<any>(null) // Map3DElement is beta, not in types
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const [status, setStatus] = useState('loading')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['restaurant', 'tourist_attraction'])
  const [places, setPlaces] = useState<google.maps.places.PlaceResult[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)

  const poiTypes = [
    'restaurant',
    'tourist_attraction', 
    'museum',
    'park',
    'cafe',
    'shopping_mall',
    'lodging'
  ]

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.map = null
    })
    markersRef.current = []
  }, [])

  const searchNearbyPlaces = useCallback(async (location: google.maps.LatLngLiteral) => {
    if (!placesServiceRef.current || selectedTypes.length === 0) return

    clearMarkers()
    const allResults: google.maps.places.PlaceResult[] = []

    for (const type of selectedTypes) {
      const request = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 1500,
        type: type as any
      }

      await new Promise<void>((resolve) => {
        placesServiceRef.current!.nearbySearch(request, (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            allResults.push(...results.slice(0, 5))
          }
          resolve()
        })
      })
    }

    setPlaces(allResults)
    createMarkers(allResults)
  }, [selectedTypes, clearMarkers])

  const createMarkers = useCallback(async (places: google.maps.places.PlaceResult[]) => {
    if (!mapInstance.current) return

    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary

    places.forEach((place) => {
      if (!place.geometry?.location) return

      const markerContent = document.createElement('div')
      markerContent.className = 'area-explorer__marker'
      markerContent.innerHTML = `
        <div class="area-explorer__marker-pin">
          <div class="area-explorer__marker-label">${place.name}</div>
        </div>
      `

      const marker = new AdvancedMarkerElement({
        map: mapInstance.current,
        position: place.geometry.location,
        content: markerContent,
        title: place.name
      })

      marker.addListener('click', () => {
        if (mapInstance.current) {
          const map3d = mapInstance.current
          map3d.center = place.geometry!.location!
          map3d.tilt = 65
          map3d.range = 500
        }
      })

      markersRef.current.push(marker)
    })
  }, [])

  useEffect(() => {
    let map3d: any = null

    const initMap = async () => {
      if (!mapContainerRef.current) return

      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'alpha',
          libraries: ['maps3d', 'places', 'marker']
        })

        // Load required libraries
        const [maps3dLib, placesLib] = await Promise.all([
          loader.importLibrary('maps3d'),
          loader.importLibrary('places')
        ])

        // Map3DElement is a beta feature, cast to any
        const Map3DElement = (maps3dLib as any).Map3DElement
        const { PlacesService, Autocomplete } = placesLib as typeof google.maps.places

        // Create 3D map element
        map3d = new Map3DElement({
          center: initialLocation || { lat: 37.7749, lng: -122.4194 },
          range: 1500,
          tilt: 65,
          heading: 0
        })

        mapInstance.current = map3d
        mapContainerRef.current.appendChild(map3d)

        // Create a temporary 2D map for Places Service
        const tempDiv = document.createElement('div')
        const tempMap = new google.maps.Map(tempDiv, {
          center: initialLocation || { lat: 37.7749, lng: -122.4194 },
          zoom: 15
        })
        placesServiceRef.current = new PlacesService(tempMap)

        // Setup autocomplete
        if (searchInputRef.current) {
          autocompleteRef.current = new Autocomplete(searchInputRef.current, {
            fields: ['geometry', 'name', 'formatted_address']
          })

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current!.getPlace()
            if (place.geometry?.location && map3d) {
              const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }
              map3d.center = location
              map3d.range = 1500
              searchNearbyPlaces(location)
            }
          })
        }

        // Initial search
        if (initialLocation) {
          searchNearbyPlaces(initialLocation)
        }

        setStatus('ready')
      } catch (error) {
        console.error('Failed to initialize Area Explorer:', error)
        setStatus('error')
      }
    }

    initMap()

    return () => {
      clearMarkers()
      if (map3d && mapContainerRef.current && mapContainerRef.current.contains(map3d)) {
        mapContainerRef.current.removeChild(map3d)
      }
    }
  }, [initialLocation])

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const newTypes = prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
      
      // Re-search with new types
      if (mapInstance.current) {
        const center = mapInstance.current.center as google.maps.LatLngLiteral
        searchNearbyPlaces(center)
      }
      
      return newTypes
    })
  }

  const handleCameraControl = (action: string) => {
    if (!mapInstance.current) return
    const map3d = mapInstance.current

    switch (action) {
      case 'rotateLeft':
        map3d.heading = (map3d.heading || 0) - 30
        break
      case 'rotateRight':
        map3d.heading = (map3d.heading || 0) + 30
        break
      case 'tiltUp':
        map3d.tilt = Math.min(90, (map3d.tilt || 0) + 10)
        break
      case 'tiltDown':
        map3d.tilt = Math.max(0, (map3d.tilt || 0) - 10)
        break
      case 'zoomIn':
        map3d.range = Math.max(100, (map3d.range || 1500) - 200)
        break
      case 'zoomOut':
        map3d.range = Math.min(10000, (map3d.range || 1500) + 200)
        break
    }
  }

  return (
    <div className="area-explorer__container">
      <div className="area-explorer__map-wrapper">
        <div ref={mapContainerRef} className="area-explorer__map" />
        {status === 'loading' && (
          <div className="area-explorer__overlay">Loading 3D Map...</div>
        )}
        {status === 'error' && (
          <div className="area-explorer__overlay">Failed to load map</div>
        )}
      </div>

      <div className="area-explorer__controls">
        <div className="area-explorer__search-section">
          <h3>Search Location</h3>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a place..."
            className="area-explorer__search-input"
          />
        </div>

        <div className="area-explorer__poi-section">
          <h3>Points of Interest</h3>
          <div className="area-explorer__poi-types">
            {poiTypes.map(type => (
              <button
                key={type}
                className={`area-explorer__poi-btn ${selectedTypes.includes(type) ? 'area-explorer__poi-btn--active' : ''}`}
                onClick={() => toggleType(type)}
              >
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="area-explorer__camera-section">
          <h3>Camera Controls</h3>
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
          </div>
        </div>

        {places.length > 0 && (
          <div className="area-explorer__places-section">
            <h3>Nearby Places ({places.length})</h3>
            <div className="area-explorer__places-list">
              {places.map((place, index) => (
                <div
                  key={`${place.place_id}-${index}`}
                  className="area-explorer__place-item"
                  onClick={() => {
                    if (place.geometry?.location && mapInstance.current) {
                      const map3d = mapInstance.current
                      map3d.center = place.geometry.location
                      map3d.tilt = 65
                      map3d.range = 500
                    }
                  }}
                >
                  <div className="area-explorer__place-name">{place.name}</div>
                  {place.rating && (
                    <div className="area-explorer__place-rating">★ {place.rating}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
