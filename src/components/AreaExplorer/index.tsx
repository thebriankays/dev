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

// List of available place types with primary type for stricter filtering
const POI_TYPES = [
  { value: 'restaurant', label: 'Restaurants', icon: '🍴', primaryTypes: ['restaurant'] },
  { value: 'cafe', label: 'Cafes', icon: '☕', primaryTypes: ['cafe'] },
  { value: 'park', label: 'Parks', icon: '🌳', primaryTypes: ['park'] },
  { value: 'museum', label: 'Museums', icon: '🏛️', primaryTypes: ['museum'] },
  { value: 'lodging', label: 'Hotels', icon: '🏨', primaryTypes: ['lodging', 'hotel'] },
  { value: 'shopping_mall', label: 'Shopping', icon: '🛍️', primaryTypes: ['shopping_mall', 'department_store', 'clothing_store'] },
  { value: 'tourist_attraction', label: 'Attractions', icon: '📸', primaryTypes: ['tourist_attraction'] },
  { value: 'bank', label: 'Banks', icon: '🏦', primaryTypes: ['bank', 'atm'] },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊', primaryTypes: ['pharmacy', 'drugstore'] },
  { value: 'hospital', label: 'Hospital', icon: '🏥', primaryTypes: ['hospital', 'doctor'] },
  { value: 'gas_station', label: 'Gas Station', icon: '⛽', primaryTypes: ['gas_station'] },
  { value: 'parking', label: 'Parking', icon: '🅿️', primaryTypes: ['parking'] }
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
  const [showManualControls, setShowManualControls] = useState(false)
  const defaultCameraRef = useRef<{
    lat: number
    lng: number
    altitude: number
    heading: number
    pitch: number
  } | null>(null)

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
  const [showManualControlsInfo, setShowManualControlsInfo] = useState(false)

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
      return 800  // Reduced from 3000 - better for city overview
    }
    
    if (types.includes('establishment') || types.includes('point_of_interest')) {
      return 300  // Reduced from 500 - better for POI viewing
    }
    
    return 500  // Reduced from 1500 - default altitude
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
        
        // Store this as the new default camera position for reset
        setTimeout(() => {
          defaultCameraRef.current = {
            lat: newLocation.lat,
            lng: newLocation.lng,
            altitude: altitude,
            heading: 0,
            pitch: -45
          }
          console.log('Updated default camera position for new location')
        }, 2000) // Wait for flyTo to complete
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
      const altitude = 500
      viewerRef.current.flyTo({
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        altitude: altitude,
        heading: 0,
        pitch: -45
      })
      
      // Store this as the default camera position for reset
      setTimeout(() => {
        defaultCameraRef.current = {
          lat: initialLocation.lat,
          lng: initialLocation.lng,
          altitude: altitude,
          heading: 0,
          pitch: -45
        }
        console.log('Set default camera position for initial location')
      }, 2000)
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

  // Strict filter to check if place is primarily of the requested type
  const isPlacePrimaryType = (place: google.maps.places.PlaceResult, requestedType: string): boolean => {
    const placeTypes = place.types || []
    const poiTypeConfig = POI_TYPES.find(poi => poi.value === requestedType)
    
    if (!poiTypeConfig) return false
    
    // Check if the place's FIRST type matches any of the primary types
    // This ensures we only get places that are primarily of this type
    const firstType = placeTypes[0]
    if (poiTypeConfig.primaryTypes.includes(firstType)) {
      return true
    }
    
    // Also check if any of the primary types appear in the first 3 types
    // This helps catch places that are strongly typed as what we want
    const topTypes = placeTypes.slice(0, 3)
    return poiTypeConfig.primaryTypes.some(primaryType => 
      topTypes.includes(primaryType)
    )
  }

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
              // Use STRICT filtering to only include places that are PRIMARILY of the requested type
              const filteredResults = results.filter(place => 
                isPlacePrimaryType(place, poiType)
              )
              
              console.log(`Found ${results.length} places, filtered to ${filteredResults.length} ${poiType} places`)
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
              
              // Clear any previous selection highlighting
              viewerRef.current?.unhighlightMarkers()
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
    // Don't store default camera position here - we'll store it when a location is selected
  }, [])

  const handleMarkerClick = useCallback((placeId: string) => {
    const place = places.find(p => p.place_id === placeId)
    if (place) {
      setSelectedPlace(place)
      // Highlight the marker on the map
      if (viewerRef.current?.isReady()) {
        viewerRef.current.highlightMarker(placeId)
      }
      // Scroll the place into view in the list
      const placeElement = document.querySelector(`[data-place-id="${placeId}"]`)
      if (placeElement) {
        placeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
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

  const handleCameraMove = (direction: 'forward' | 'backward' | 'left' | 'right') => {
    if (viewerRef.current?.isReady()) {
      const distance = 50 // meters
      viewerRef.current.moveCamera(direction, distance)
    }
  }

  const handleCameraZoom = (zoomIn: boolean) => {
    if (viewerRef.current?.isReady()) {
      viewerRef.current.zoomCamera(zoomIn ? 0.5 : 2)
    }
  }

  const handleCameraTilt = (direction: 'up' | 'down') => {
    if (viewerRef.current?.isReady()) {
      const cameraInfo = viewerRef.current.getCameraInfo()
      if (cameraInfo) {
        const newPitch = direction === 'up' 
          ? Math.min(cameraInfo.pitch + 10, 0)
          : Math.max(cameraInfo.pitch - 10, -90)
        viewerRef.current.setCameraView({ pitch: newPitch })
      }
    }
  }

  const handleCameraRotate = (direction: 'left' | 'right') => {
    if (viewerRef.current?.isReady()) {
      const cameraInfo = viewerRef.current.getCameraInfo()
      if (cameraInfo) {
        const newHeading = direction === 'left'
          ? (cameraInfo.heading - 15 + 360) % 360
          : (cameraInfo.heading + 15) % 360
        viewerRef.current.setCameraView({ heading: newHeading })
      }
    }
  }

  const handleResetCamera = () => {
    if (viewerRef.current?.isReady() && defaultCameraRef.current) {
      viewerRef.current.flyTo({
        lat: defaultCameraRef.current.lat,
        lng: defaultCameraRef.current.lng,
        altitude: defaultCameraRef.current.altitude,
        heading: defaultCameraRef.current.heading,
        pitch: defaultCameraRef.current.pitch,
        duration: 1.5
      })
      setIsOrbiting(false)
    }
  }

  const handlePlaceClick = (place: google.maps.places.PlaceResult) => {
    setSelectedPlace(place)
    
    // Highlight the marker and fly to the place
    const location = place.geometry?.location
    if (location && viewerRef.current?.isReady()) {
      // Highlight the selected marker
      if (place.place_id) {
        viewerRef.current.highlightMarker(place.place_id)
      }
      
      // Fly to the place with better viewing angle
      viewerRef.current.flyTo({
        lat: location.lat(),
        lng: location.lng(),
        altitude: 150,  // Much lower altitude to see the place better
        heading: 0,
        pitch: -60,  // Steeper angle to look down at the marker
        duration: 1.5
      })
    }
  }

  // Get POI type icon for a place
  const getPlaceIcon = (place: google.maps.places.PlaceResult): string => {
    const types = place.types || []
    for (const poi of POI_TYPES) {
      if (poi.primaryTypes.some(pt => types.includes(pt))) {
        return poi.icon
      }
    }
    return '📍'
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
              ℹ️
            </button>
          </h3>
          {showOrbitInfo && (
            <div className="area-explorer__info-tooltip">
              <strong>Auto-Orbit:</strong> Automatically rotates the camera around the location<br/>
              <strong>Dynamic:</strong> Camera moves up and down while rotating<br/>
              <strong>Fixed:</strong> Camera maintains the same angle<br/>
              <strong>Speed:</strong> How fast the camera rotates (1-100)<br/>
              <strong>Manual Controls:</strong> Use arrows to move, rotate and tilt the camera
            </div>
          )}
          
          <div className="area-explorer__camera-mode-toggle">
            <button
              onClick={() => setShowManualControls(false)}
              className={`area-explorer__mode-btn ${!showManualControls ? 'active' : ''}`}
              disabled={!isMapReady}
            >
              🔄 Auto Orbit
            </button>
            <button
              onClick={() => {
                setShowManualControls(true)
                setIsOrbiting(false)
              }}
              className={`area-explorer__mode-btn ${showManualControls ? 'active' : ''}`}
              disabled={!isMapReady}
            >
              🎮 Manual Control
            </button>
          </div>

          {!showManualControls ? (
            <>
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
            </>
          ) : (
            <div className="area-explorer__manual-controls">
              <div className="area-explorer__control-info">
                <button
                  className="area-explorer__info-btn"
                  onClick={() => setShowManualControlsInfo(!showManualControlsInfo)}
                  title="Manual controls info"
                >
                  ℹ️
                </button>
                <span>Manual Camera Controls</span>
              </div>
              {showManualControlsInfo && (
                <div className="area-explorer__info-tooltip">
                  <strong>Mouse:</strong> Click and drag to rotate view<br/>
                  <strong>Scroll:</strong> Zoom in/out<br/>
                  <strong>Arrow buttons:</strong> Move camera position<br/>
                  <strong>Tilt:</strong> Look up/down<br/>
                  <strong>Rotate:</strong> Turn left/right<br/>
                  <strong>Reset:</strong> Return to default view
                </div>
              )}
              
              <div className="area-explorer__movement-controls">
                <div className="area-explorer__control-row">
                  <button
                    className="area-explorer__control-btn"
                    onClick={() => handleCameraMove('forward')}
                    disabled={!isMapReady}
                    title="Move forward"
                  >
                    ↑
                  </button>
                </div>
                <div className="area-explorer__control-row">
                  <button
                    className="area-explorer__control-btn"
                    onClick={() => handleCameraMove('left')}
                    disabled={!isMapReady}
                    title="Move left"
                  >
                    ←
                  </button>
                  <button
                    className="area-explorer__control-btn center"
                    disabled
                  >
                    ◉
                  </button>
                  <button
                    className="area-explorer__control-btn"
                    onClick={() => handleCameraMove('right')}
                    disabled={!isMapReady}
                    title="Move right"
                  >
                    →
                  </button>
                </div>
                <div className="area-explorer__control-row">
                  <button
                    className="area-explorer__control-btn"
                    onClick={() => handleCameraMove('backward')}
                    disabled={!isMapReady}
                    title="Move backward"
                  >
                    ↓
                  </button>
                </div>
              </div>

              <div className="area-explorer__view-controls">
                <div className="area-explorer__control-group">
                  <span className="area-explorer__control-label">Zoom</span>
                  <div className="area-explorer__control-buttons">
                    <button
                      className="area-explorer__control-btn small"
                      onClick={() => handleCameraZoom(false)}
                      disabled={!isMapReady}
                      title="Zoom out"
                    >
                      −
                    </button>
                    <button
                      className="area-explorer__control-btn small"
                      onClick={() => handleCameraZoom(true)}
                      disabled={!isMapReady}
                      title="Zoom in"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="area-explorer__control-group">
                  <span className="area-explorer__control-label">Tilt</span>
                  <div className="area-explorer__control-buttons">
                    <button
                      className="area-explorer__control-btn small"
                      onClick={() => handleCameraTilt('up')}
                      disabled={!isMapReady}
                      title="Tilt up"
                    >
                      ⬆
                    </button>
                    <button
                      className="area-explorer__control-btn small"
                      onClick={() => handleCameraTilt('down')}
                      disabled={!isMapReady}
                      title="Tilt down"
                    >
                      ⬇
                    </button>
                  </div>
                </div>

                <div className="area-explorer__control-group">
                  <span className="area-explorer__control-label">Rotate</span>
                  <div className="area-explorer__control-buttons">
                    <button
                      className="area-explorer__control-btn small"
                      onClick={() => handleCameraRotate('left')}
                      disabled={!isMapReady}
                      title="Rotate left"
                    >
                      ↶
                    </button>
                    <button
                      className="area-explorer__control-btn small"
                      onClick={() => handleCameraRotate('right')}
                      disabled={!isMapReady}
                      title="Rotate right"
                    >
                      ↷
                    </button>
                  </div>
                </div>
              </div>

              <button
                className="area-explorer__reset-btn"
                onClick={handleResetCamera}
                disabled={!isMapReady || !defaultCameraRef.current}
                title="Reset camera to default view"
              >
                🔄 Reset Camera View
              </button>
            </div>
          )}
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
                ℹ️
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
                ℹ️
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
            🔍 Searching for places...
          </div>
        )}

        {places.length > 0 && (
          <div className="area-explorer__places-list">
            <h3>Places Found ({places.length})</h3>
            <div className="area-explorer__places-scroll">
              {places.map((place, index) => (
                <div
                  key={place.place_id || index}
                  data-place-id={place.place_id}
                  className={`area-explorer__place-item ${
                    selectedPlace?.place_id === place.place_id ? 'selected' : ''
                  }`}
                  onClick={() => handlePlaceClick(place)}
                >
                  <div className="area-explorer__place-header">
                    <span className="area-explorer__place-number">{index + 1}</span>
                    <span className="area-explorer__place-icon">{getPlaceIcon(place)}</span>
                    <div className="area-explorer__place-info">
                      <div className="area-explorer__place-name">
                        {place.name}
                      </div>
                      <div className="area-explorer__place-address">
                        {place.vicinity}
                      </div>
                    </div>
                  </div>
                  <div className="area-explorer__place-meta">
                    {place.rating && (
                      <span className="area-explorer__place-rating">
                        ⭐ {place.rating}
                      </span>
                    )}
                    {place.price_level && (
                      <span className="area-explorer__place-price">
                        {'$'.repeat(place.price_level)}
                      </span>
                    )}

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPlace && (
          <div className="area-explorer__details-panel">
            <button
              className="area-explorer__close-btn"
              onClick={() => {
                setSelectedPlace(null)
                // Clear marker highlighting
                if (viewerRef.current?.isReady()) {
                  viewerRef.current.unhighlightMarkers()
                }
              }}
            >
              ✕
            </button>
            <h3>{selectedPlace.name}</h3>
            <p className="area-explorer__details-address">{selectedPlace.vicinity}</p>
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
            {selectedPlace.types && (
              <div className="area-explorer__place-types">
                <p className="area-explorer__types-label">Categories:</p>
                <div className="area-explorer__types-list">
                  {selectedPlace.types.slice(0, 5).map(type => (
                    <span key={type} className="area-explorer__type-badge">
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
