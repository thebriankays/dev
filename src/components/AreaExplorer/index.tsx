'use client'

import React, {
  useState,
  useRef,
  useEffect,
  useCallback
} from 'react'
import { usePlacesWidget } from 'react-google-autocomplete'
import { CesiumViewer, CesiumViewerHandle } from '@/components/CesiumViewer'
import { useDebounce } from '@/hooks/useDebounce'
import './area-explorer.scss'

// List of available place types
const POI_TYPES = [
  { value: 'restaurant', label: 'Restaurants', icon: '🍴' },
  { value: 'cafe', label: 'Cafes', icon: '☕' },
  { value: 'park', label: 'Parks', icon: '🌳' },
  { value: 'museum', label: 'Museums', icon: '🏛️' },
  { value: 'lodging', label: 'Hotels', icon: '🏨' },
  { value: 'shopping_mall', label: 'Shopping', icon: '🛍️' },
  { value: 'tourist_attraction', label: 'Attractions', icon: '📸' },
  { value: 'bank', label: 'Banks', icon: '🏦' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { value: 'hospital', label: 'Hospital', icon: '🏥' },
  { value: 'gas_station', label: 'Gas Station', icon: '⛽' },
  { value: 'parking', label: 'Parking', icon: '🅿️' }
]

interface AreaExplorerProps {
  /** Optionally preselect an initial location. Used by slug-based routes. */
  initialLocation?: {
    lat: number
    lng: number
    name?: string
  }
}

export function AreaExplorer({ initialLocation }: AreaExplorerProps) {
  const viewerRef = useRef<CesiumViewerHandle>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const [isMapReady, setMapReady] = useState(false)
  const hasInitializedLocation = useRef(false)

  // Camera state
  const [orbitType, setOrbitType] = useState<'dynamic' | 'fixed'>('dynamic')
  const [cameraSpeed, setCameraSpeed] = useState(20)
  const debouncedSpeed = useDebounce(cameraSpeed, 100)
  const [isOrbiting, setIsOrbiting] = useState(false)

  // Places state
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    name?: string
  } | null>(null)
  const [selectedPois, setSelectedPois] = useState<string[]>([])
  const [density, setDensity] = useState(50)
  const [searchRadius, setSearchRadius] = useState(2000)
  const debouncedRadius = useDebounce(searchRadius, 500)
  
  // Store places for details panel
  const [places, setPlaces] = useState<google.maps.places.PlaceResult[]>([])
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null)

  // Initialize Google Places service
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.google &&
      !placesServiceRef.current
    ) {
      const mapDiv = document.createElement('div')
      placesServiceRef.current = new google.maps.places.PlacesService(mapDiv)
    }
  }, [])

  // Set up Places Autocomplete
  const { ref: placesRef } = usePlacesWidget<HTMLInputElement>({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: place => {
      const location = place.geometry?.location
      if (location && viewerRef.current?.isReady()) {
        const newLocation = {
          lat: location.lat(),
          lng: location.lng(),
          name: place.name
        }
        setSelectedLocation(newLocation)
        viewerRef.current.flyTo({
          lat: newLocation.lat,
          lng: newLocation.lng,
          altitude: 1500,
          heading: 0,
          pitch: -45
        })
        setSelectedPlace(null) // Clear selected place on new search
      }
    },
    options: { types: ['(cities)'] }
  })

  // Handle marker clicks
  const handleMarkerClick = useCallback((placeId: string) => {
    const clickedPlace = places.find(p => p.place_id === placeId)
    if (clickedPlace) {
      setSelectedPlace(clickedPlace)
    }
  }, [places])

  // When map is ready and an initialLocation prop is provided,
  // fly to it exactly once
  useEffect(() => {
    if (!isMapReady || !initialLocation || hasInitializedLocation.current) return
    
    hasInitializedLocation.current = true
    const { lat, lng, name } = initialLocation
    setSelectedLocation({ lat, lng, name })
    viewerRef.current?.flyTo({
      lat,
      lng,
      altitude: 1500,
      heading: 0,
      pitch: -45
    })
  }, [isMapReady, initialLocation])

  // Control camera orbit
  useEffect(() => {
    if (!isMapReady || !viewerRef.current?.isReady()) return
    if (isOrbiting) {
      viewerRef.current.startOrbit(orbitType, debouncedSpeed)
    } else {
      viewerRef.current.stopOrbit()
    }
  }, [isMapReady, isOrbiting, orbitType, debouncedSpeed])

  // Fetch and display nearby places
  const fetchPlaces = useCallback(() => {
    if (
      !placesServiceRef.current ||
      !selectedLocation ||
      selectedPois.length === 0
    ) {
      viewerRef.current?.clearMarkers()
      setPlaces([])
      setSelectedPlace(null)
      return
    }
    
    viewerRef.current?.clearMarkers()
    setPlaces([])
    setSelectedPlace(null)

    const maxPlaces = Math.floor((density / 100) * 60)
    const allResults: google.maps.places.PlaceResult[] = []

    let completed = 0
    const checkCompletion = () => {
      completed++
      if (completed === selectedPois.length) {
        // All searches complete, add markers
        setPlaces(allResults)
        allResults.forEach(place => {
          if (place.place_id) {
            viewerRef.current?.addPlaceMarker(place, place.place_id)
          }
        })
      }
    }

    selectedPois.forEach(poiType => {
      placesServiceRef.current?.nearbySearch(
        {
          location: selectedLocation,
          radius: debouncedRadius,
          type: poiType
        },
        (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            const limited = results.slice(
              0,
              Math.ceil(maxPlaces / selectedPois.length)
            )
            allResults.push(...limited)
          }
          checkCompletion()
        }
      )
    })
  }, [selectedLocation, selectedPois, debouncedRadius, density])

  useEffect(() => {
    if (isMapReady && selectedLocation && selectedPois.length > 0) {
      fetchPlaces()
    } else if (isMapReady) {
      viewerRef.current?.clearMarkers()
      setPlaces([])
      setSelectedPlace(null)
    }
  }, [
    isMapReady,
    selectedLocation,
    selectedPois,
    debouncedRadius,
    density,
    fetchPlaces
  ])

  const handlePoiToggle = (poiType: string) => {
    setSelectedPois(prev =>
      prev.includes(poiType)
        ? prev.filter(p => p !== poiType)
        : [...prev, poiType]
    )
  }

  const handleClearAll = () => {
    setSelectedPois([])
    viewerRef.current?.clearMarkers()
    setPlaces([])
    setSelectedPlace(null)
  }

  return (
    <div className="area-explorer__container">
      <CesiumViewer
        ref={viewerRef}
        onLoad={() => setMapReady(true)}
        onMarkerClick={handleMarkerClick}
        initialLocation={
          initialLocation
            ? {
                lat: initialLocation.lat,
                lng: initialLocation.lng,
                altitude: 1500,
                heading: 0,
                pitch: -45
              }
            : undefined
        }
      />

      <div className="area-explorer__controls">
        <div className="area-explorer__header">
          <h2>3D Area Explorer</h2>
          {initialLocation?.name && (
            <h3 className="area-explorer__location-name">{initialLocation.name}</h3>
          )}
          <p>
            Choose your location and select the place types you want
            to show in the surrounding area.
          </p>
        </div>

        <div className="area-explorer__search-section">
          <input
            ref={placesRef}
            className="area-explorer__search-input"
            placeholder="🔍 Enter a location"
            disabled={!isMapReady}
          />
        </div>

        <div className="area-explorer__camera-section">
          <h3>Camera Settings</h3>
          <div className="area-explorer__camera-type">
            <span>Type:</span>
            <div className="area-explorer__radio-group">
              <label>
                <input
                  type="radio"
                  value="dynamic"
                  checked={orbitType === 'dynamic'}
                  onChange={() => setOrbitType('dynamic')}
                  disabled={!isMapReady}
                />
                <span>Dynamic orbit</span>
              </label>
              <label>
                <input
                  type="radio"
                  value="fixed"
                  checked={orbitType === 'fixed'}
                  onChange={() => setOrbitType('fixed')}
                  disabled={!isMapReady}
                />
                <span>Fixed orbit</span>
              </label>
            </div>
          </div>

          <div className="area-explorer__slider-group">
            <label className="area-explorer__slider-label">
              <span>Speed:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={cameraSpeed}
                onChange={e =>
                  setCameraSpeed(Number(e.target.value))
                }
                className="area-explorer__slider"
                disabled={!isMapReady}
              />
              <span className="area-explorer__slider-value">
                {cameraSpeed}
              </span>
            </label>
          </div>

          <button
            onClick={() => setIsOrbiting(prev => !prev)}
            className={`area-explorer__orbit-btn ${
              isOrbiting ? 'active' : ''
            }`}
            disabled={!isMapReady}
          >
            {isOrbiting
              ? '⏸ Stop Auto-Rotate'
              : '▶ Start Auto-Rotate'}
          </button>
        </div>

        <div className="area-explorer__poi-section">
          <div className="area-explorer__poi-header">
            <h3>Place Types</h3>
            {selectedPois.length > 0 && (
              <button
                onClick={handleClearAll}
                className="area-explorer__clear-btn"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="area-explorer__poi-types">
            {POI_TYPES.map(poi => (
              <button
                key={poi.value}
                onClick={() => handlePoiToggle(poi.value)}
                className={`area-explorer__poi-btn ${
                  selectedPois.includes(poi.value)
                    ? 'active'
                    : ''
                }`}
                disabled={
                  !selectedLocation || !isMapReady
                }
                title={poi.label}
              >
                <span className="area-explorer__poi-icon">
                  {poi.icon}
                </span>
                <span className="area-explorer__poi-label">
                  {poi.label}
                </span>
              </button>
            ))}
          </div>

          {selectedLocation && (
            <>
              <div className="area-explorer__slider-group">
                <label className="area-explorer__slider-label">
                  <span>Search Radius ({(searchRadius / 1000).toFixed(1)} km)</span>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={searchRadius}
                    onChange={e =>
                      setSearchRadius(Number(e.target.value))
                    }
                    className="area-explorer__slider area-explorer__slider--radius"
                    disabled={
                      !isMapReady || selectedPois.length === 0
                    }
                  />
                  <div className="area-explorer__slider-markers">
                    <span>0.5 km</span>
                    <span>{(searchRadius / 1000).toFixed(1)} km</span>
                    <span>5 km</span>
                  </div>
                </label>
              </div>

              <div className="area-explorer__slider-group">
                <label className="area-explorer__slider-label">
                  <span>Density</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={density}
                    onChange={e =>
                      setDensity(Number(e.target.value))
                    }
                    className="area-explorer__slider area-explorer__slider--density"
                    disabled={
                      !isMapReady || selectedPois.length === 0
                    }
                  />
                  <div className="area-explorer__slider-markers">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </label>
              </div>
            </>
          )}
        </div>

        {/* Place Details Panel */}
        {selectedPlace && (
          <div className="area-explorer__details-panel">
            <button 
              className="area-explorer__close-details"
              onClick={() => setSelectedPlace(null)}
              aria-label="Close details"
            >
              ×
            </button>
            <h3>{selectedPlace.name}</h3>
            {selectedPlace.vicinity && (
              <p className="area-explorer__details-address">{selectedPlace.vicinity}</p>
            )}
            {selectedPlace.rating && (
              <p className="area-explorer__details-rating">
                <span className="area-explorer__rating-stars">
                  {'★'.repeat(Math.round(selectedPlace.rating))}
                  {'☆'.repeat(5 - Math.round(selectedPlace.rating))}
                </span>
                <span className="area-explorer__rating-value">
                  {selectedPlace.rating.toFixed(1)}
                </span>
                {selectedPlace.user_ratings_total && (
                  <span className="area-explorer__rating-count">
                    ({selectedPlace.user_ratings_total} reviews)
                  </span>
                )}
              </p>
            )}
            {selectedPlace.opening_hours && (
              <p className={`area-explorer__details-hours ${
                selectedPlace.opening_hours.isOpen?.() ? 'open' : 'closed'
              }`}>
                {selectedPlace.opening_hours.isOpen?.() ? '✓ Open Now' : '✗ Closed'}
              </p>
            )}
            {selectedPlace.price_level !== undefined && (
              <p className="area-explorer__details-price">
                Price: {'$'.repeat(selectedPlace.price_level)}
              </p>
            )}
            {selectedPlace.types && (
              <div className="area-explorer__details-tags">
                {selectedPlace.types.slice(0, 3).map(type => (
                  <span key={type} className="area-explorer__tag">
                    {type.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedLocation && places.length > 0 && (
          <div className="area-explorer__status">
            <p>
              📍 {selectedPois.length}{' '}
              {selectedPois.length === 1
                ? 'type'
                : 'types'}{' '}
              selected
            </p>
            <p>
              📏 Found {places.length} places within{' '}
              {(searchRadius / 1000).toFixed(1)} km
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
