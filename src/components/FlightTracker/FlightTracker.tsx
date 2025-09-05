'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { gsap } from 'gsap'
import { Glass } from './Glass'
import FlightSearch from './FlightSearch'
import FlightCard from './FlightCard'
import { Flight, Coordinates } from './types'
import './FlightTracker.scss'

// Error boundary component for map
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map error:', error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return (
        <Glass className="flight-tracker__message flight-tracker__message--error" variant="card" rounded="md">
          <p>Error loading map. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#60a5fa', border: 'none', borderRadius: '0.375rem', color: 'white', cursor: 'pointer' }}
          >
            Refresh Page
          </button>
        </Glass>
      )
    }

    return this.props.children
  }
}

// Dynamic imports for performance
const FlightMap2D = dynamic(() => import('./FlightMap2D'), {
  ssr: false,
  loading: () => (
    <div className="flight-tracker__loading">
      <div className="flight-tracker__loading-spinner" />
      <p>Loading map...</p>
    </div>
  ),
})

// API rate limit compliant intervals - using position prediction between calls
const UPDATE_INTERVAL_AUTHENTICATED = 30000 // 30 seconds for authenticated users
const UPDATE_INTERVAL_ANONYMOUS = 60000 // 60 seconds for anonymous users
const ANIMATION_INTERVAL = 5000 // Update positions every 5 seconds using prediction (reduced for performance)

interface FlightTrackerProps {
  enableSearch?: boolean
  enableGeolocation?: boolean
  defaultLocation?: Coordinates
  searchRadius?: number
}

interface FlightWithPrediction extends Flight {
  predicted_position?: {
    longitude: number
    latitude: number
  }
  interpolated_position?: {
    longitude: number
    latitude: number
  }
  actual_position?: {
    longitude: number
    latitude: number
  }
  trajectory?: Array<[number, number]>
  display_longitude?: number
  display_latitude?: number
}

export const FlightTracker: React.FC<FlightTrackerProps> = ({
  enableSearch = true,
  enableGeolocation = true,
  defaultLocation = { lat: 40.7128, lng: -74.0060 }, // NYC default
  searchRadius = 2,
}) => {
  const instanceId = useRef(Math.random().toString(36).substring(2, 11)).current
  
  const [flights, setFlights] = useState<FlightWithPrediction[]>([])
  const [displayFlights, setDisplayFlights] = useState<FlightWithPrediction[]>([])
  const [selectedFlight, setSelectedFlight] = useState<FlightWithPrediction | null>(null)
  const [userLocation, setUserLocation] = useState<Coordinates>(defaultLocation)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, setLastUpdateTime] = useState<number>(Date.now())
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const [isRateLimited, setIsRateLimited] = useState<boolean>(false)
  const [retryAfter, setRetryAfter] = useState<number>(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number>(0)
  const previousFlightsRef = useRef<Map<string, FlightWithPrediction>>(new Map())
  const lastFetchRef = useRef<{ location: string; timestamp: number } | null>(null)
  const displayFlightsRef = useRef<FlightWithPrediction[]>([])
  const MIN_FETCH_INTERVAL = 25000 // Minimum 25 seconds between fetches
  const fetchInProgressRef = useRef<boolean>(false)
  const geolocationRequestedRef = useRef<boolean>(false)

  // Get user location (only once)
  useEffect(() => {
    if (enableGeolocation && navigator.geolocation && !geolocationRequestedRef.current) {
      geolocationRequestedRef.current = true
      console.log('📍 Requesting location access...')
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log(`📍 Location found: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`)
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          
          let errorMessage = 'Location access denied'
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Using default location.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Using default location.'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Using default location.'
              break
          }
          
          setError(errorMessage)
          setTimeout(() => setError(null), 5000)
          
          console.log('Using default location')
          setUserLocation(defaultLocation)
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000
        }
      )
    } else if (!enableGeolocation) {
      setUserLocation(defaultLocation)
    }
  }, [enableGeolocation, defaultLocation]) // Dependencies for geolocation effect

  // Enrich flight data with airline info
  const enrichFlightData = async (flights: FlightWithPrediction[]): Promise<FlightWithPrediction[]> => {
    const processedFlights = flights.map(flight => flight)
    
    // Update previous flights reference for smooth animation
    const currentFlightIds = new Set(processedFlights.map(f => f.icao24))
    
    // Remove flights that are no longer present
    Array.from(previousFlightsRef.current.keys()).forEach(icao24 => {
      if (!currentFlightIds.has(icao24)) {
        previousFlightsRef.current.delete(icao24)
      }
    })
    
    // Store current flights for next animation cycle
    processedFlights.forEach(flight => {
      previousFlightsRef.current.set(flight.icao24, flight)
    })
    
    // Enrich with airline data in the background
    try {
      const response = await fetch('/api/flights/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flights: processedFlights })
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.flights
      }
    } catch (error) {
      console.error('Error enriching flights:', error)
    }
    
    return processedFlights
  }

  // Fetch flights from server API
  const fetchFlights = useCallback(async () => {
    if (isRateLimited && retryAfter > Date.now()) {
      return
    }
    
    if (!userLocation || userLocation.lat === null || userLocation.lng === null) {
      console.log('Skipping fetch - no user location')
      return
    }

    // Prevent concurrent fetches (but allow if it's been more than 30 seconds)
    if (fetchInProgressRef.current) {
      console.log(`[FlightTracker ${instanceId}] Skipping fetch - already in progress`)
      return
    }

    // Prevent excessive API calls
    const locationKey = `${userLocation.lat.toFixed(2)}_${userLocation.lng.toFixed(2)}_${searchRadius}`
    const now = Date.now()
    
    if (lastFetchRef.current && 
        lastFetchRef.current.location === locationKey && 
        now - lastFetchRef.current.timestamp < MIN_FETCH_INTERVAL) {
      console.log(`[FlightTracker ${instanceId}] Skipping fetch - too recent (${Math.round((now - lastFetchRef.current.timestamp) / 1000)}s ago)`)
      return
    }

    fetchInProgressRef.current = true
    
    console.log(`🌐 Fetching flights near ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)} (${searchRadius}° radius)`)
    
    try {
      const params = new URLSearchParams({
        lat: userLocation.lat.toString(),
        lng: userLocation.lng.toString(),
        radius: searchRadius.toString(),
      })
      
      const response = await fetch(`/api/flights?${params}`)
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      setAuthenticated(data.authenticated || false)
      
      if (data.error) {
        setError(data.error)
        
        if (data.error.includes('rate limit')) {
          setIsRateLimited(true)
          setRetryAfter(Date.now() + 60000)
          
          if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current)
            updateIntervalRef.current = null
          }
        }
        
        if (data.flights.length === 0) {
          return
        }
      }
      
      if (data.flights && Array.isArray(data.flights)) {
        const newFlights: FlightWithPrediction[] = data.flights
        
        console.log(`✈️ Loaded ${newFlights.length} flights`)
        
        // Update fetch cache
        lastFetchRef.current = {
          location: locationKey,
          timestamp: now
        }
        
        // Merge new flights with existing predicted positions to avoid jumping
        const mergedFlights = newFlights.map(newFlight => {
          const existingFlight = displayFlightsRef.current.find(f => f.icao24 === newFlight.icao24)
          if (existingFlight && existingFlight.interpolated_position) {
            // Keep the predicted position, but update the actual position for next prediction cycle
            return {
              ...newFlight,
              interpolated_position: existingFlight.interpolated_position,
              // Store the new actual position for future predictions
              actual_position: {
                longitude: newFlight.longitude,
                latitude: newFlight.latitude
              }
            }
          }
          return {
            ...newFlight,
            interpolated_position: {
              longitude: newFlight.longitude,
              latitude: newFlight.latitude
            },
            actual_position: {
              longitude: newFlight.longitude,
              latitude: newFlight.latitude
            }
          }
        })

        // Set flights for API data, but use merged flights for display to prevent jumping
        setFlights(newFlights)
        setDisplayFlights(mergedFlights)
        setLastUpdateTime(data.timestamp || Date.now())
        setError(null)
        // Don't reset animation frame - let prediction continue smoothly
        setInitialLoading(false)
        
        // Enrich flight data in the background without affecting display positions
        enrichFlightData(newFlights).then(enrichedFlights => {
          if (enrichedFlights && enrichedFlights.length > 0) {
            // Update flights data for future use, but don't reset display positions
            setFlights(enrichedFlights)
            
            // Merge enrichment data with current display flights without losing positions
            setDisplayFlights(prevDisplay => 
              prevDisplay.map(displayFlight => {
                const enriched = enrichedFlights.find(ef => ef.icao24 === displayFlight.icao24)
                if (enriched) {
                  return {
                    ...enriched,
                    interpolated_position: displayFlight.interpolated_position,
                    actual_position: displayFlight.actual_position || {
                      longitude: enriched.longitude,
                      latitude: enriched.latitude
                    }
                  }
                }
                return displayFlight
              })
            )
            console.log(`🔍 Enhanced ${enrichedFlights.length} flights with airline data`)
          }
        }).catch(error => {
          console.error('Error enriching flight data:', error)
          // Keep the original flights if enrichment fails
        })
      }
    } catch (err) {
      console.error('Error fetching flights:', err)
      setError('Failed to load flight data. Please check your connection.')
    } finally {
      setInitialLoading(false)
      fetchInProgressRef.current = false
    }
  }, [userLocation, searchRadius, isRateLimited, retryAfter, instanceId])

  // Keep displayFlightsRef synchronized with displayFlights state
  useEffect(() => {
    displayFlightsRef.current = displayFlights
  }, [displayFlights])

  // Animation system that uses position prediction without API calls
  useEffect(() => {
    const predictPositions = () => {
      const now = Date.now()
      const elapsedSinceLastFetch = lastFetchRef.current ? now - lastFetchRef.current.timestamp : 0
      
      const currentFlights = displayFlightsRef.current
      if (!currentFlights || currentFlights.length === 0) return
      
      const predictedFlights = currentFlights.map(flight => {
        if (flight.on_ground || !flight.velocity || !flight.true_track) {
          return {
            ...flight,
            interpolated_position: flight.interpolated_position || {
              longitude: flight.longitude,
              latitude: flight.latitude
            }
          }
        }
        
        // Use actual_position as base for prediction, or fall back to current longitude/latitude
        const basePosition = flight.actual_position || {
          longitude: flight.longitude,
          latitude: flight.latitude
        }
        
        // Predict position based on velocity and heading from the actual position
        const velocityMs = flight.velocity // m/s
        const headingDeg = flight.true_track // degrees
        const timeElapsedSec = elapsedSinceLastFetch / 1000
        
        // Convert to km/h and calculate distance
        const velocityKmh = velocityMs * 3.6
        const distanceKm = velocityKmh * (timeElapsedSec / 3600)
        
        // Simple prediction using bearing and distance
        const earthRadius = 6371 // km
        const bearingRad = (headingDeg * Math.PI) / 180
        const latRad = (basePosition.latitude * Math.PI) / 180
        const lonRad = (basePosition.longitude * Math.PI) / 180
        const distRad = distanceKm / earthRadius
        
        const newLatRad = Math.asin(
          Math.sin(latRad) * Math.cos(distRad) +
          Math.cos(latRad) * Math.sin(distRad) * Math.cos(bearingRad)
        )
        
        const newLonRad = lonRad + Math.atan2(
          Math.sin(bearingRad) * Math.sin(distRad) * Math.cos(latRad),
          Math.cos(distRad) - Math.sin(latRad) * Math.sin(newLatRad)
        )
        
        return {
          ...flight,
          interpolated_position: {
            longitude: (newLonRad * 180) / Math.PI,
            latitude: (newLatRad * 180) / Math.PI
          }
        }
      })
      
      setDisplayFlights(predictedFlights)
      
      // Update selected flight if it exists
      if (selectedFlight) {
        const updatedSelectedFlight = predictedFlights.find(f => f.icao24 === selectedFlight.icao24)
        if (updatedSelectedFlight) {
          setSelectedFlight(updatedSelectedFlight)
        }
      }
    }
    
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current)
    }
    
    // Only animate if we have flights and they're not loading
    if (flights.length > 0 && !initialLoading) {
      animationIntervalRef.current = setInterval(predictPositions, ANIMATION_INTERVAL)
    }
    
    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }
    }
  }, [flights.length, selectedFlight, initialLoading]) // Remove displayFlights to prevent excessive re-renders

  // Update rate limit countdown
  useEffect(() => {
    if (isRateLimited && retryAfter > Date.now()) {
      const interval = setInterval(() => {
        if (Date.now() >= retryAfter) {
          setIsRateLimited(false)
          setRetryAfter(0)
          clearInterval(interval)
        }
        setError(prev => prev)
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [isRateLimited, retryAfter])

  // Initial fetch - only when userLocation changes and we're not already fetching
  useEffect(() => {
    if (userLocation && userLocation.lat !== null && userLocation.lng !== null && !fetchInProgressRef.current) {
      console.log(`[FlightTracker ${instanceId}] Initial fetch for location: ${userLocation.lat}, ${userLocation.lng}`)
      fetchFlights()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation.lat, userLocation.lng])
  
  const fetchFlightsRef = useRef(fetchFlights)
  fetchFlightsRef.current = fetchFlights
  
  // Set up periodic updates with proper caching
  useEffect(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }
    
    if (isRateLimited) {
      return
    }
    
    const interval = authenticated ? UPDATE_INTERVAL_AUTHENTICATED : UPDATE_INTERVAL_ANONYMOUS
    console.log(`[FlightTracker ${instanceId}] Setting up flight update interval: ${interval/1000}s (${authenticated ? 'authenticated' : 'anonymous'})`)
    
    updateIntervalRef.current = setInterval(() => {
      console.log(`[FlightTracker ${instanceId}] Interval triggered - checking if fetch needed...`)
      // Only fetch if minimum interval has passed
      const now = Date.now()
      if (!lastFetchRef.current || now - lastFetchRef.current.timestamp >= MIN_FETCH_INTERVAL) {
        console.log(`[FlightTracker ${instanceId}] Fetching updates...`)
        fetchFlightsRef.current()
      } else {
        console.log(`[FlightTracker ${instanceId}] Skipping fetch - using prediction (${Math.round((now - lastFetchRef.current.timestamp) / 1000)}s since last fetch)`)
      }
    }, interval)
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
        updateIntervalRef.current = null
      }
    }
  }, [authenticated, isRateLimited, instanceId])

  // Search for specific flight
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSelectedFlight(null)
      return
    }

    const searchQuery = query.trim().toUpperCase()
    
    let found = displayFlights.find(flight => {
      const callsign = (flight.callsign || '').trim().toUpperCase()
      const icao = flight.icao24.toUpperCase()
      
      return callsign === searchQuery || 
             icao === searchQuery ||
             callsign.includes(searchQuery) || 
             icao.includes(searchQuery)
    })
    
    if (!found) {
      setLoading(true)
      try {
        const response = await fetch('/api/flights/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.flight) {
            const flightFromSearch = data.flight as FlightWithPrediction
            found = flightFromSearch
            
            if (flightFromSearch.longitude && flightFromSearch.latitude) {
              setDisplayFlights(prev => {
                const filtered = prev.filter(f => f.icao24 !== flightFromSearch.icao24)
                return [...filtered, flightFromSearch]
              })
              
              const distance = Math.sqrt(
                Math.pow(flightFromSearch.latitude - userLocation.lat, 2) + 
                Math.pow(flightFromSearch.longitude - userLocation.lng, 2)
              )
              
              // Only change location if flight is very far away (more than 4x radius)
              // and ask user confirmation to prevent unwanted location jumps
              if (distance > searchRadius * 4) {
                console.log(`Flight found ${distance.toFixed(2)} degrees away. Consider manually adjusting map view.`)
                // Don't automatically change location - let user decide
                // This prevents unexpected location jumps that clear the map
              }
            }
          } else {
            setError(`Flight "${query}" not found. It may not be airborne or the flight number may be incorrect.`)
            setTimeout(() => setError(null), 5000)
          }
        }
      } catch (error) {
        console.error('Search error:', error)
        setError('Failed to search for flight. Please try again.')
        setTimeout(() => setError(null), 5000)
      } finally {
        setLoading(false)
      }
    }
    
    if (found) {
      setSelectedFlight(found)
    }
  }, [displayFlights, userLocation, searchRadius])

  // GSAP animation for container
  useEffect(() => {
    if (containerRef.current) {
      const tween = gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      )
      
      return () => {
        tween.kill()
      }
    }
  }, [])

  const handleRefresh = async () => {
    if (isRateLimited && retryAfter > Date.now()) {
      const secondsLeft = Math.ceil((retryAfter - Date.now()) / 1000)
      setError(`Rate limited. Please wait ${secondsLeft} seconds before trying again.`)
      return
    }
    
    console.log('Manual refresh triggered')
    setLoading(true)
    setError(null)
    setIsRateLimited(false)
    animationFrameRef.current = 0
    
    try {
      await fetchFlights()
    } catch (error) {
      console.error('Manual refresh error:', error)
    } finally {
      setTimeout(() => setLoading(false), 1000) // Ensure loading state is cleared
    }
  }


  return (
    <div className={`flight-tracker ${selectedFlight ? 'flight-tracker--has-selection' : ''}`} ref={containerRef}>
      <div className="flight-tracker__main">
        <div className="flight-tracker__view">
          {initialLoading ? (
            <Glass className="flight-tracker__message" variant="card" rounded="md">
              <div className="flight-tracker__loading">
                <div className="flight-tracker__loading-spinner" />
                <p>Loading flights...</p>
              </div>
            </Glass>
          ) : isRateLimited && retryAfter > Date.now() ? (
            <Glass className="flight-tracker__message flight-tracker__message--error" variant="card" rounded="md">
              <p>{error}</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                Rate limit reached. Waiting {Math.ceil((retryAfter - Date.now()) / 1000)} seconds...
              </p>
            </Glass>
          ) : displayFlights.length === 0 && !error ? (
            <Glass className="flight-tracker__message" variant="card" rounded="md">
              <p>No flights detected in your area.</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                Try adjusting your search radius or location.
              </p>
            </Glass>
          ) : (
            <MapErrorBoundary>
              <FlightMap2D
                key="flight-map-2d"
                flights={displayFlights}
                selectedFlight={selectedFlight}
                onSelectFlight={setSelectedFlight}
                userLocation={userLocation}
              />
            </MapErrorBoundary>
          )}
          
          {/* Error message overlay */}
          {error && !isRateLimited && (
            <Glass className="flight-tracker__message flight-tracker__message--error flight-tracker__message--overlay" variant="card" rounded="md">
              <p>{error}</p>
              <button onClick={() => setError(null)} className="flight-tracker__dismiss-btn">&times;</button>
            </Glass>
          )}
          
          {/* Overlay controls */}
          <div className="flight-tracker__controls-overlay">
            <Glass variant="panel" rounded="lg" blur={10} style={{ width: 'auto', display: 'inline-block' }}>
              <div className="flight-tracker__controls">
                {enableSearch && <FlightSearch onSearch={handleSearch} />}
              </div>
            </Glass>
          </div>
          
          {/* Stats overlay */}
          {!loading && (
            <div className="flight-tracker__stats-overlay">
              <Glass variant="panel" rounded="md" blur={8} style={{ display: 'inline-flex' }}>
                <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem' }}>
                  <div className="flight-tracker__stat">
                    <span className="flight-tracker__stat-value">{displayFlights.length}</span>
                    <span className="flight-tracker__stat-label">Flights</span>
                  </div>
                  {displayFlights.length > 0 ? (
                    <>
                      <div className="flight-tracker__stat">
                        <span className="flight-tracker__stat-value">
                          {displayFlights.filter(f => !f.on_ground).length}
                        </span>
                        <span className="flight-tracker__stat-label">In Air</span>
                      </div>
                      <div className="flight-tracker__stat">
                        <span className="flight-tracker__stat-value">
                          {displayFlights.filter(f => f.on_ground).length}
                        </span>
                        <span className="flight-tracker__stat-label">Ground</span>
                      </div>
                    </>
                  ) : (
                    <div className="flight-tracker__stat">
                      <span className="flight-tracker__stat-value" style={{ fontSize: '0.75rem' }}>
                        {userLocation.lat.toFixed(2)}, {userLocation.lng.toFixed(2)}
                      </span>
                      <span className="flight-tracker__stat-label">Location</span>
                    </div>
                  )}
                  <div className="flight-tracker__stat">
                {authenticated && (
                  <span className="flight-tracker__auth-badge" title="Using authenticated API access">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                )}
                <button
                  className="flight-tracker__refresh-btn"
                  onClick={handleRefresh}
                  title="Refresh flight data"
                  disabled={isRateLimited}
                  style={{
                    opacity: isRateLimited ? 0.5 : 1,
                    cursor: isRateLimited ? 'not-allowed' : 'pointer'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M2.5 2v6h6M21.5 22v-6h-6"/>
                    <path d="M22 11.5A10 10 0 0 0 2.5 8M2 12.5A10 10 0 0 0 21.5 16"/>
                  </svg>
                </button>
                  </div>
                </div>
              </Glass>
            </div>
          )}
        </div>

        {selectedFlight && (
          <div className="flight-card" style={{ zIndex: 1000 }}>
            <FlightCard
              key={selectedFlight.icao24}
              flight={selectedFlight}
              onClose={() => {
                setSelectedFlight(null)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default FlightTracker