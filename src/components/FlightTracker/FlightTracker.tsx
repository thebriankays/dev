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

// API rate limit compliant intervals
const UPDATE_INTERVAL_AUTHENTICATED = 30000 // 30 seconds for authenticated users
const UPDATE_INTERVAL_ANONYMOUS = 60000 // 60 seconds for anonymous users

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

interface GeoJSONLineString {
  type: 'Feature'
  geometry: {
    type: 'LineString'
    coordinates: number[][]
  }
  properties: {
    flight: string
  }
}

interface WeatherData {
  origin?: unknown
  destination?: unknown
}

export const FlightTracker: React.FC<FlightTrackerProps> = ({
  enableSearch = true,
  defaultLocation = { lat: 40.7128, lng: -74.0060 }, // NYC default
  searchRadius = 2,
}) => {
  const [flights, setFlights] = useState<FlightWithPrediction[]>([])
  const [displayFlights, setDisplayFlights] = useState<FlightWithPrediction[]>([])
  const [selectedFlight, setSelectedFlight] = useState<FlightWithPrediction | null>(null)
  const [selectedFlightRoute, setSelectedFlightRoute] = useState<GeoJSONLineString | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<Coordinates>(defaultLocation)
  const [mapZoom, setMapZoom] = useState(9)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherData>({})

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(Date.now())
  const flightAnimationRefs = useRef<Map<string, gsap.core.Tween>>(new Map())

  /**
   * Get user location via IP-based geolocation (no browser permission needed)
   */
  const getIPLocation = useCallback(async () => {
    try {
      console.log('[FlightTracker] Getting IP-based location...')
      const response = await fetch('/api/geolocation')
      if (response.ok) {
        const data = await response.json()
        console.log('[FlightTracker] IP location:', data)
        setMapCenter({ lat: data.lat, lng: data.lng })
        return { lat: data.lat, lng: data.lng }
      }
    } catch (error) {
      console.error('[FlightTracker] IP geolocation failed:', error)
    }
    return defaultLocation
  }, [defaultLocation])

  /**
   * Animate flights using GSAP for smooth movement
   */
  const animateFlights = useCallback((flightList: FlightWithPrediction[]) => {
    flightList.forEach(flight => {
      if (!flight.predicted_position || !flight.velocity || flight.on_ground) {
        return
      }

      // Kill existing animation for this flight
      const existingAnim = flightAnimationRefs.current.get(flight.icao24)
      if (existingAnim) {
        existingAnim.kill()
      }

      // Create proxy object for animation
      const animatedPos = {
        lat: flight.display_latitude || flight.latitude,
        lng: flight.display_longitude || flight.longitude,
        rotation: flight.true_track || 0
      }

      // Calculate animation duration based on update interval
      const duration = (isAuthenticated ? UPDATE_INTERVAL_AUTHENTICATED : UPDATE_INTERVAL_ANONYMOUS) / 1000

      // Animate to predicted position
      const anim = gsap.to(animatedPos, {
        lat: flight.predicted_position.latitude,
        lng: flight.predicted_position.longitude,
        rotation: flight.true_track || 0,
        duration: duration,
        ease: "none", // Linear interpolation for constant velocity
        onUpdate: () => {
          // Update the flight's display position
          setFlights(prev => prev.map(f => {
            if (f.icao24 === flight.icao24) {
              return {
                ...f,
                display_latitude: animatedPos.lat,
                display_longitude: animatedPos.lng
              }
            }
            return f
          }))
          
          setDisplayFlights(prev => prev.map(f => {
            if (f.icao24 === flight.icao24) {
              return {
                ...f,
                display_latitude: animatedPos.lat,
                display_longitude: animatedPos.lng
              }
            }
            return f
          }))
        }
      })

      flightAnimationRefs.current.set(flight.icao24, anim)
    })
  }, [isAuthenticated])

  /**
   * Fetch flights from OpenSky API
   */
  const fetchFlights = useCallback(async (center?: Coordinates, radius?: number) => {
    try {
      const actualCenter = center || mapCenter
      const actualRadius = radius || searchRadius
      
      console.log(`[FlightTracker] Fetching flights for center:`, actualCenter, 'radius:', actualRadius)
      
      const response = await fetch(
        `/api/flights?lat=${actualCenter.lat}&lng=${actualCenter.lng}&radius=${actualRadius}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log(`[FlightTracker] Received ${data.flights?.length || 0} flights`)
      
      if (data.flights && Array.isArray(data.flights)) {
        setIsAuthenticated(data.authenticated || false)
        
        const validFlights = data.flights.filter((f: Flight) => 
          f.latitude !== null && 
          f.longitude !== null &&
          !isNaN(f.latitude) &&
          !isNaN(f.longitude)
        )

        console.log(`[FlightTracker] Valid flights after filtering: ${validFlights.length}`)
        
        // Update flight positions
        setFlights(prevFlights => {
          // Merge with existing flights to maintain animations
          const flightMap = new Map(prevFlights.map(f => [f.icao24, f]))
          
          validFlights.forEach((newFlight: FlightWithPrediction) => {
            const existingFlight = flightMap.get(newFlight.icao24)
            
            if (existingFlight) {
              // Update existing flight with new data
              newFlight.actual_position = {
                longitude: newFlight.longitude,
                latitude: newFlight.latitude
              }
              
              // Keep the animated position from the existing flight
              if (existingFlight.display_longitude !== undefined) {
                newFlight.display_longitude = existingFlight.display_longitude
                newFlight.display_latitude = existingFlight.display_latitude
              } else {
                newFlight.display_longitude = newFlight.longitude
                newFlight.display_latitude = newFlight.latitude
              }
            } else {
              // New flight - set initial display position
              newFlight.display_longitude = newFlight.longitude
              newFlight.display_latitude = newFlight.latitude
            }
            
            flightMap.set(newFlight.icao24, newFlight)
          })
          
          // Remove flights that are no longer in the data
          const currentIds = new Set(validFlights.map((f: Flight) => f.icao24))
          for (const [id] of flightMap.entries()) {
            if (!currentIds.has(id)) {
              // Clean up GSAP animation for removed flight
              const anim = flightAnimationRefs.current.get(id)
              if (anim) {
                anim.kill()
                flightAnimationRefs.current.delete(id)
              }
              flightMap.delete(id)
            }
          }
          
          const updatedFlights = Array.from(flightMap.values())
          setDisplayFlights(updatedFlights)
          
          // Start animations for new flights
          animateFlights(updatedFlights)
          
          return updatedFlights
        })
        
        lastUpdateRef.current = data.timestamp || Date.now()
        setError(null)
      }
    } catch (error) {
      console.error('[FlightTracker] Error fetching flights:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch flight data')
    } finally {
      setLoading(false)
    }
  }, [mapCenter, searchRadius, animateFlights])

  /**
   * Handle flight selection - fetch additional details and show route
   */
  const handleSelectFlight = useCallback(async (flight: Flight | null) => {
    console.log('[FlightTracker] Flight selected:', flight?.callsign)
    setSelectedFlight(flight as FlightWithPrediction)
    
    if (flight) {
      // Only show route for selected flight
      if (flight.originAirport && flight.destinationAirport) {
        // Type guards to check if airports are objects
        const origin = flight.originAirport
        const destination = flight.destinationAirport
        
        if (typeof origin === 'object' && typeof destination === 'object') {
          setSelectedFlightRoute({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [origin.longitude, origin.latitude],
                [destination.longitude, destination.latitude]
              ]
            },
            properties: {
              flight: flight.callsign || flight.icao24
            }
          })
        } else {
          setSelectedFlightRoute(null)
        }
      } else {
        setSelectedFlightRoute(null)
      }

      // Fetch weather data for origin and destination
      if (flight.originAirport && flight.destinationAirport) {
        const origin = flight.originAirport
        const destination = flight.destinationAirport
        
        if (typeof origin === 'object' && typeof destination === 'object') {
          try {
            const [originWeather, destWeather] = await Promise.all([
              fetch(`/api/weather?lat=${origin.latitude}&lng=${origin.longitude}`)
                .then(r => r.json())
                .catch(() => null),
              fetch(`/api/weather?lat=${destination.latitude}&lng=${destination.longitude}`)
                .then(r => r.json())
                .catch(() => null)
            ])
            
            setWeatherData({
              origin: originWeather,
              destination: destWeather
            })
          } catch (error) {
            console.error('[FlightTracker] Error fetching weather:', error)
          }
        }
      }
    } else {
      // Clear route when no flight selected
      setSelectedFlightRoute(null)
      setWeatherData({})
    }
  }, [])

  /**
   * Handle flight search
   */
  const handleSearchFlight = useCallback(async (query: string) => {
    if (!query) return
    
    console.log('[FlightTracker] Searching for flight:', query)
    setLoading(true)
    
    try {
      const response = await fetch(`/api/flights/search?query=${encodeURIComponent(query)}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.flights && data.flights.length > 0) {
          const flight = data.flights[0]
          
          // Center map on found flight
          if (flight.latitude && flight.longitude) {
            setMapCenter({ lat: flight.latitude, lng: flight.longitude })
            setMapZoom(12)
            
            // Select the flight
            handleSelectFlight(flight)
            
            // Fetch flights in that area
            await fetchFlights({ lat: flight.latitude, lng: flight.longitude }, searchRadius)
          }
        } else {
          setError('Flight not found')
        }
      }
    } catch (error) {
      console.error('[FlightTracker] Search error:', error)
      setError('Search failed')
    } finally {
      setLoading(false)
    }
  }, [fetchFlights, handleSelectFlight, searchRadius])

  /**
   * Initialize map and start data fetching
   */
  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      console.log('[FlightTracker] Initializing...')
      
      // Get IP-based location (no browser permission needed)
      const location = await getIPLocation()
      
      if (!mounted) return
      
      // Immediately fetch flights at that location
      await fetchFlights(location, searchRadius)
    }

    initialize()

    return () => {
      mounted = false
      
      // Clean up GSAP animations
      flightAnimationRefs.current.forEach(anim => anim.kill())
      flightAnimationRefs.current.clear()
    }
  }, [fetchFlights, getIPLocation, searchRadius]) // Include necessary dependencies

  // Update intervals when authentication status changes
  useEffect(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
    }
    
    const updateInterval = isAuthenticated ? UPDATE_INTERVAL_AUTHENTICATED : UPDATE_INTERVAL_ANONYMOUS
    
    updateIntervalRef.current = setInterval(() => {
      fetchFlights()
    }, updateInterval)

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [isAuthenticated, fetchFlights])

  const handleMapMove = useCallback((center: Coordinates, zoom: number) => {
    setMapCenter(center)
    setMapZoom(zoom)
  }, [])

  const handleRefresh = useCallback(() => {
    console.log('[FlightTracker] Manual refresh triggered')
    fetchFlights()
  }, [fetchFlights])

  return (
    <div className="flight-tracker">
      {enableSearch && (
        <div className="flight-tracker__search">
          <FlightSearch onSearch={handleSearchFlight} />
        </div>
      )}
      
      <div className="flight-tracker__main">
        <MapErrorBoundary>
          <FlightMap2D
            flights={displayFlights}
            selectedFlight={selectedFlight}
            selectedFlightRoute={selectedFlightRoute}
            onSelectFlight={handleSelectFlight}
            onMapMove={handleMapMove}
            center={mapCenter}
            zoom={mapZoom}
            loading={loading}
            error={error}
            onRefresh={handleRefresh}
            weatherData={weatherData}
          />
        </MapErrorBoundary>
        
        {selectedFlight && (
          <FlightCard
            flight={{
              ...selectedFlight,
              weatherOrigin: weatherData.origin,
              weatherDestination: weatherData.destination
            }}
            onClose={() => handleSelectFlight(null)}
          />
        )}
        
        {loading && !flights.length && (
          <Glass className="flight-tracker__message flight-tracker__message--loading" variant="card" rounded="md">
            <div className="flight-tracker__loading-spinner" />
            <p>Loading flights...</p>
          </Glass>
        )}
        
        {error && !loading && (
          <Glass className="flight-tracker__message flight-tracker__message--error" variant="card" rounded="md">
            <p>{error}</p>
            <button onClick={handleRefresh}>
              Retry
            </button>
          </Glass>
        )}
        
        {!loading && !error && flights.length === 0 && (
          <Glass className="flight-tracker__message flight-tracker__message--empty" variant="card" rounded="md">
            <p>No flights in this area. Try zooming out or searching for a specific flight.</p>
          </Glass>
        )}
        
        <div className="flight-tracker__stats">
          <Glass variant="panel" rounded="sm" className="flight-tracker__stats-panel">
            <span>{flights.length} aircraft</span>
            <span className="flight-tracker__stats-divider">|</span>
            <span>Mode: {isAuthenticated ? 'Authenticated' : 'Anonymous'}</span>
            <span className="flight-tracker__stats-divider">|</span>
            <span>Updated: {new Date(lastUpdateRef.current).toLocaleTimeString()}</span>
          </Glass>
        </div>
      </div>
    </div>
  )
}

export default FlightTracker
