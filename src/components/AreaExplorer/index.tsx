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

// Major city centers - better coordinates than Google's defaults
const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'London': { lat: 51.5074, lng: -0.1278 },
  'New York': { lat: 40.7580, lng: -73.9855 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Barcelona': { lat: 41.3851, lng: 2.1734 },
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  'Berlin': { lat: 52.5200, lng: 13.4050 },
  'Dubai': { lat: 25.2048, lng: 55.2708 },
  'Singapore': { lat: 1.2897, lng: 103.8501 },
  'Hong Kong': { lat: 22.2855, lng: 114.1577 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'Miami': { lat: 25.7617, lng: -80.1918 },
  'Las Vegas': { lat: 36.1699, lng: -115.1398 },
  'Boston': { lat: 42.3601, lng: -71.0589 },
  'Washington': { lat: 38.8951, lng: -77.0364 },
  'Seattle': { lat: 47.6062, lng: -122.3321 },
}

interface AreaExplorerProps {
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
  const [isPlacesReady, setPlacesReady] = useState(false)

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
  } | null>(initialLocation || null)
  const [selectedPois, setSelectedPois] = useState<string[]>([])
  const [density, setDensity] = useState(30)
  const [searchRadius, setSearchRadius] = useState(2000)
  const debouncedRadius = useDebounce(searchRadius, 500)
  
  // Store places for list and details
  const [places, setPlaces] = useState<google.maps.places.PlaceResult[]>([])
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Tooltip states
  const [showRadiusInfo, setShowRadiusInfo] = useState(false)
  const [showDensityInfo, setShowDensityInfo] = useState(false)
  const [showOrbitInfo, setShowOrbitInfo] = useState(false)

  // Initialize Google Places service
  useEffect(() => {
    const initPlacesService = () => {
      if (placesServiceRef.current) {
        console.log('Places service already initialized')
        return
      }
      
      if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
        try {
          const mapDiv = document.createElement('div')
          placesServiceRef.current = new window.google.maps.places.PlacesService(mapDiv)
          setPlacesReady(true)
          console.log('Places service initialized successfully')
        } catch (error) {
          console.error('Failed to initialize Places service:', error)
        }
      } else {
        console.log('Google Maps not ready yet, retrying...')
        setTimeout(initPlacesService, 500)
      }
    }

    initPlacesService()
  }, [])

  // Helper function to get better coordinates
  const getBetterCoordinates = (place: google.maps.places.PlaceResult) => {
    const name = place.name || ''
    const location = place.geometry?.location
    
    if (!location) return null
    
    for (const [cityName, coords] of Object.entries(CITY_CENTERS)) {
      if (name.includes(cityName) || place.formatted_address?.includes(cityName)) {
        console.log(`Using predefined center for ${cityName}`)
        return coords
      }
    }
    
    if (place.geometry?.viewport) {
      const viewport = place.geometry.viewport
      const centerLat = (viewport.getNorthEast().lat() + viewport.getSouthWest().lat()) / 2
      const centerLng = (viewport.getNorthEast().lng() + viewport.getSouthWest().lng()) / 2
      console.log('Using viewport center:', { lat: centerLat, lng: centerLng })
      return { lat: centerLat, lng: centerLng }
    }
    
    return { lat: location.lat(), lng: location.lng() }
  }

  // Helper function to determine appropriate altitude
  const getAppropriateAltitude = (place: google.maps.places.PlaceResult): number => {
    const types = place.types || []
    
    if (types.includes('locality') || types.includes('administrative_area_level_1')) {
      return 3000
    }
    
    if (types.includes('establishment') || types.includes('point_of_interest')) {
      return 500
    }
    
    return 1500
  }

  // Set up Places Autocomplete
  const { ref: placesRef } = usePlacesWidget<HTMLInputElement>({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: place => {
      if (place && viewerRef.current?.isReady()) {
        const betterCoords = getBetterCoordinates(place)
        if (!betterCoords) return
        
        const altitude = getAppropriateAltitude(place)
        
        const newLocation = {
          lat: betterCoords.lat,
          lng: betterCoords.lng,
          name: place.name || place.formatted_address
        }
        
        console.log('New location selected:', newLocation, 'Altitude:', altitude)
        setSelectedLocation(newLocation)
        setSelectedPlace(null)
        setPlaces([]) // Clear previous places
        
        viewerRef.current.flyTo({
          lat: newLocation.lat,
          lng: newLocation.lng,
          altitude: altitude,
          heading: 0,
          pitch: -45
        })
      }
    },
    options: { 
      types: ['(cities)'],
      fields: ['geometry', 'name', 'formatted_address', 'types']
    },
    libraries: ['places']
  })

  // Handle initial location
  useEffect(() => {
    if (initialLocation && isMapReady && viewerRef.current?.isReady()) {
      console.log('Flying to initial location:', initialLocation)
      viewerRef.current.flyTo({
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        altitude: 1500,
        heading: 0,
        pitch: -45
      })
    }
  }, [initialLocation, isMapReady])

  // Handle orbit changes
  useEffect(() => {
    if (isMapReady && viewerRef.current?.isReady() && isOrbiting) {
      console.log('Starting orbit:', orbitType, 'speed:', debouncedSpeed)
      viewerRef.current.startOrbit(orbitType, debouncedSpeed)
    } else if (viewerRef.current?.isReady()) {
      viewerRef.current.stopOrbit()
    }
  }, [isMapReady, isOrbiting, orbitType, debouncedSpeed])

  // Handle POI search
  useEffect(() => {
    const searchPlaces = () => {
      const service = placesServiceRef.current
      
      if (!service || !selectedLocation || !isMapReady || !viewerRef.current?.isReady() || !isPlacesReady) {
        return
      }

      // Clear existing markers
      viewerRef.current.clearMarkers()
      setPlaces([])
      setSelectedPlace(null)

      if (selectedPois.length === 0) {
        console.log('No POI types selected')
        return
      }

      setIsSearching(true)
      console.log('Searching for places:', {
        location: selectedLocation,
        radius: debouncedRadius,
        types: selectedPois
      })

      // Search for each type separately
      const allResults: google.maps.places.PlaceResult[] = []
      let completedSearches = 0
      
      selectedPois.forEach(poiType => {
        service.nearbySearch(
          {
            location: selectedLocation,
            radius: debouncedRadius,
            type: poiType as any
          },
          (results, status) => {
            completedSearches++
            
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              // Filter results to ONLY include the requested type
              const filteredResults = results.filter(place => {
                const placeTypes = place.types || []
                return placeTypes.includes(poiType)
              })
              
              console.log(`Found ${filteredResults.length} ${poiType} places`)
              allResults.push(...filteredResults)
            } else if (status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              console.error(`Places service error for ${poiType}:`, status)
            } else {
              console.log(`No ${poiType} places found`)
            }
            
            // When all searches are complete
            if (completedSearches === selectedPois.length) {
              // Remove duplicates based on place_id
              const uniquePlaces = Array.from(
                new Map(allResults.map(p => [p.place_id, p])).values()
              )
              
              // Sort by rating if available
              uniquePlaces.sort((a, b) => {
                const ratingA = a.rating || 0
                const ratingB = b.rating || 0
                return ratingB - ratingA
              })
              
              // Apply density filter
              const maxPlaces = Math.ceil((density / 100) * uniquePlaces.length)
              const filteredResults = uniquePlaces.slice(0, maxPlaces || uniquePlaces.length)
              
              console.log(`Displaying ${filteredResults.length} total places`)
              setPlaces(filteredResults)
              setIsSearching(false)
              
              // Add markers for each place
              filteredResults.forEach(place => {
                if (place.place_id) {
                  viewerRef.current?.addPlaceMarker(place, place.place_id)
                }
              })
            }
          }
        )
      })
    }

    searchPlaces()
  }, [selectedLocation, selectedPois, debouncedRadius, density, isMapReady, isPlacesReady])

  const handleMapLoad = useCallback(() => {
    console.log('Map loaded and ready')
    setMapReady(true)
  }, [])

  const handleMarkerClick = useCallback((placeId: string) => {
    const place = places.find(p => p.place_id === placeId)
    if (place) {
      setSelectedPlace(place)
    }
  }, [places])

  const handlePoiToggle = (poiType: string) => {
    setSelectedPois(prev => {
      const newPois = prev.includes(poiType)
        ? prev.filter(p => p !== poiType)
        : [...prev, poiType]
      console.log('POI types updated:', newPois)
      return newPois
    })
  }

  const handlePlaceClick = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place)
    
    // Fly to the place
    const location = place.geometry?.location
    if (location && viewerRef.current?.isReady()) {
      viewerRef.current.flyTo({
        lat: location.lat(),
        lng: location.lng(),
        altitude: 300,
        heading: 0,
        pitch: -45,
        duration: 1.5
      })
    }
  }

  return (
    <div className="area-explorer">
      <CesiumViewer
        ref={viewerRef}
        onLoad={handleMapLoad}
        onMarkerClick={handleMarkerClick}
        initialLocation={initialLocation}
      />

      <div className="area-explorer__controls">
        <div className="area-explorer__search-section">
          <h3>Choose Location</h3>
          <input
            ref={placesRef}
            className="area-explorer__search-input"
            placeholder="Enter a city or location"
            disabled={!isMapReady}
          />
          {selectedLocation && (
            <div className="area-explorer__current-location">
              📍 {selectedLocation.name || `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`}
            </div>
          )}
        </div>

        <div className="area-explorer__camera-section">
          <h3>
            Camera Settings
            <button
              className="area-explorer__info-btn"
              onClick={() => setShowOrbitInfo(!showOrbitInfo)}
              title="Camera info"
            >
              ℹ
            </button>
          </h3>
          {showOrbitInfo && (
            <div className="area-explorer__info-tooltip">
              <strong>Auto-Orbit:</strong> Automatically rotates the camera around the location<br/>
              <strong>Dynamic:</strong> Camera moves up and down while rotating<br/>
              <strong>Fixed:</strong> Camera maintains the same angle<br/>
              <strong>Speed:</strong> How fast the camera rotates (1-100)
            </div>
          )}
          <div className="area-explorer__orbit-toggle">
            <button
              onClick={() => {
                const newOrbiting = !isOrbiting
                setIsOrbiting(newOrbiting)
                console.log('Orbit toggled:', newOrbiting)
              }}
              className={`area-explorer__play-btn ${isOrbiting ? 'active' : ''}`}
              disabled={!isMapReady}
            >
              {isOrbiting ? '⏸ Stop Orbit' : '▶ Start Auto-Orbit'}
            </button>
          </div>
          <div className="area-explorer__radio-group">
            <label>
              <input
                type="radio"
                value="dynamic"
                checked={orbitType === 'dynamic'}
                onChange={() => setOrbitType('dynamic')}
                disabled={!isMapReady}
              />
              Dynamic Orbit
            </label>
            <label>
              <input
                type="radio"
                value="fixed"
                checked={orbitType === 'fixed'}
                onChange={() => setOrbitType('fixed')}
                disabled={!isMapReady}
              />
              Fixed Orbit
            </label>
          </div>
          <label className="area-explorer__slider-label">
            Speed: {cameraSpeed}
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={cameraSpeed}
            onChange={e => setCameraSpeed(Number(e.target.value))}
            className="area-explorer__slider"
            disabled={!isMapReady}
          />
        </div>

        <div className="area-explorer__poi-section">
          <h3>Place Types</h3>
          {!selectedLocation && (
            <p className="area-explorer__help-text">
              Search for a city first to enable place search
            </p>
          )}
          {!isPlacesReady && selectedLocation && (
            <p className="area-explorer__help-text">
              Loading Google Places service...
            </p>
          )}
          
          <div className="area-explorer__slider-group">
            <label className="area-explorer__slider-label">
              Search Radius: {searchRadius}m
              <button
                className="area-explorer__info-btn"
                onClick={() => setShowRadiusInfo(!showRadiusInfo)}
                title="Radius info"
              >
                ℹ
              </button>
            </label>
            {showRadiusInfo && (
              <div className="area-explorer__info-tooltip">
                How far from the center point to search for places. Larger radius = wider search area.
              </div>
            )}
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={searchRadius}
              onChange={e => setSearchRadius(Number(e.target.value))}
              className="area-explorer__slider"
              disabled={!selectedLocation || !isMapReady || !isPlacesReady}
            />
          </div>

          <div className="area-explorer__slider-group">
            <label className="area-explorer__slider-label">
              Density: {density}%
              <button
                className="area-explorer__info-btn"
                onClick={() => setShowDensityInfo(!showDensityInfo)}
                title="Density info"
              >
                ℹ
              </button>
            </label>
            {showDensityInfo && (
              <div className="area-explorer__info-tooltip">
                Controls how many places to show. Lower = fewer markers (less cluttered). Higher = more markers.
              </div>
            )}
            <input
              type="range"
              min="10"
              max="100"
              step="10"
              value={density}
              onChange={e => setDensity(Number(e.target.value))}
              className="area-explorer__slider"
              disabled={!selectedLocation || !isMapReady || !isPlacesReady}
            />
          </div>

          <div className="area-explorer__poi-grid">
            {POI_TYPES.map(poi => (
              <button
                key={poi.value}
                onClick={() => handlePoiToggle(poi.value)}
                className={`area-explorer__poi-btn ${
                  selectedPois.includes(poi.value) ? 'active' : ''
                }`}
                disabled={!selectedLocation || !isMapReady || !isPlacesReady}
                title={poi.label}
              >
                <span className="area-explorer__poi-icon">{poi.icon}</span>
                <span className="area-explorer__poi-label">{poi.label}</span>
              </button>
            ))}
          </div>
        </div>

        {isSearching && (
          <div className="area-explorer__loading">
            Searching for places...
          </div>
        )}

        {places.length > 0 && (
          <div className="area-explorer__places-list">
            <h3>Places Found ({places.length})</h3>
            <div className="area-explorer__places-scroll">
              {places.map((place, index) => (
                <div
                  key={place.place_id || index}
                  className={`area-explorer__place-item ${
                    selectedPlace?.place_id === place.place_id ? 'selected' : ''
                  }`}
                  onClick={() => handlePlaceClick(place)}
                >
                  <div className="area-explorer__place-name">
                    {index + 1}. {place.name}
                  </div>
                  {place.rating && (
                    <div className="area-explorer__place-rating">
                      ⭐ {place.rating}
                    </div>
                  )}
                  <div className="area-explorer__place-address">
                    {place.vicinity}
                  </div>
                  {place.price_level && (
                    <div className="area-explorer__place-price">
                      {'$'.repeat(place.price_level)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPlace && (
          <div className="area-explorer__details-panel">
            <button
              className="area-explorer__close-btn"
              onClick={() => setSelectedPlace(null)}
            >
              ✕
            </button>
            <h3>{selectedPlace.name}</h3>
            <p>{selectedPlace.vicinity}</p>
            {selectedPlace.rating && (
              <p className="area-explorer__rating">
                Rating: {selectedPlace.rating} ⭐
                {selectedPlace.user_ratings_total && 
                  ` (${selectedPlace.user_ratings_total} reviews)`}
              </p>
            )}
            {selectedPlace.price_level && (
              <p className="area-explorer__price">
                Price: {'$'.repeat(selectedPlace.price_level)}
              </p>
            )}
            {selectedPlace.opening_hours && (
              <p className={`area-explorer__status ${
                selectedPlace.opening_hours.open_now ? 'open' : 'closed'
              }`}>
                {selectedPlace.opening_hours.open_now ? '🟢 Open Now' : '🔴 Closed'}
              </p>
            )}
            {selectedPlace.website && (
              <a
                href={selectedPlace.website}
                target="_blank"
                rel="noopener noreferrer"
                className="area-explorer__website-link"
              >
                Visit Website →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
