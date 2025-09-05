import React, { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useTempus } from 'tempus/react'
import { Flight, FlightMapProps } from './types'

// Set Mapbox token
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
}

interface FlightWithPrediction extends Flight {
  predicted_position?: { longitude: number; latitude: number }
  interpolated_position?: { longitude: number; latitude: number }
  trajectory?: Array<[number, number]>
  departureAirport?: string
  destinationAirport?: string
}

interface RouteFeature {
  type: 'Feature'
  properties: {
    icao24: string
    callsign: string | null
    selected: boolean
  }
  geometry: {
    type: 'LineString'
    coordinates: number[][]
  }
}

export const MapboxMap: React.FC<FlightMapProps> = ({
  flights,
  selectedFlight,
  onSelectFlight,
  userLocation,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const mapLoaded = useRef<boolean>(false)
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({})
  const [isMapReady, setIsMapReady] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return
    
    try {
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: userLocation ? [userLocation.lng, userLocation.lat] : [-74.0060, 40.7128],
        zoom: 9,
        pitch: 0,
        bearing: 0,
        antialias: true,
        trackResize: true,
      })
      
      map.current = newMap

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // Add user location marker
      if (userLocation) {
        const el = document.createElement('div')
        el.className = 'user-location-marker'
        el.style.cssText = `
          width: 20px;
          height: 20px;
          background-color: #60a5fa;
          border: 3px solid #fff;
          border-radius: 50%;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          animation: pulse 2s infinite;
        `
        new mapboxgl.Marker(el).setLngLat([userLocation.lng, userLocation.lat]).addTo(map.current)
      }

      // Wait for map to load
      map.current.on('load', () => {
        mapLoaded.current = true
        setIsMapReady(true)
        
        // Add sources and layers for route lines
        map.current!.addSource('flight-routes', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        })
        
        map.current!.addLayer({
          id: 'flight-routes',
          type: 'line',
          source: 'flight-routes',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#60a5fa',
            'line-width': 2,
            'line-opacity': 0.6
          }
        })
        
        // Add layer for selected flight route (highlighted)
        map.current!.addLayer({
          id: 'selected-flight-route',
          type: 'line',
          source: 'flight-routes',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#fbbf24',
            'line-width': 4,
            'line-opacity': 0.8
          },
          filter: ['==', ['get', 'selected'], true]
        })
      })
      
      // Ensure proper map resize
      map.current.on('resize', () => {
        map.current?.resize()
      })
    } catch (error) {
      console.error('Error initializing map:', error)
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
        mapLoaded.current = false
      }
    }
  }, [userLocation])

  // Update user location
  useEffect(() => {
    if (map.current && mapLoaded.current && userLocation) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 9,
        essential: true,
        duration: 1500,
      })
    }
  }, [userLocation])

  // Function to update route lines
  const updateRouteLines = useCallback(() => {
    if (!map.current || !mapLoaded.current || !isMapReady) return
    if (!flights || !Array.isArray(flights) || flights.length === 0) return

    // Create features for flights with route information
    const routeFeatures: RouteFeature[] = []

    flights.forEach((flight: FlightWithPrediction) => {
      // Check if flight has valid data and route information
      if (!flight || typeof flight !== 'object') return
      if (!flight.longitude || !flight.latitude) return
      if (!flight.departureAirport && !flight.destinationAirport) return
      
      try {
        // For now, create a simple great circle route between current position and destination
        // In a real implementation, you'd use the actual route waypoints
        const currentPos = flight.interpolated_position || {
          longitude: flight.longitude,
          latitude: flight.latitude,
        }

        // Create a simple route line from current position extending in the direction of travel
        // This is a placeholder - ideally you'd have airport coordinates and waypoints
        const routeCoordinates: number[][] = []
        
        // Add current position
        routeCoordinates.push([currentPos.longitude, currentPos.latitude])
        
        // Use smart flight path if available
        if ('flightPath' in flight && flight.flightPath && Array.isArray(flight.flightPath)) {
          // Flight path is already a complete great circle route
          routeCoordinates.length = 0 // Clear and use the full path
          routeCoordinates.push(...flight.flightPath)
        } else if (flight.trajectory && flight.trajectory.length > 0) {
          // Use trajectory data from the server
          routeCoordinates.push(...flight.trajectory)
        } else if (flight.true_track !== null && flight.velocity) {
          // Create a simple projected path based on heading and velocity
          const headingRad = (flight.true_track * Math.PI) / 180
          const distance = 2 // degrees (rough approximation)
          const endLng = currentPos.longitude + distance * Math.sin(headingRad)
          const endLat = currentPos.latitude + distance * Math.cos(headingRad)
          routeCoordinates.push([endLng, endLat])
        }

        if (routeCoordinates.length >= 2) {
          const isSelected = !!(selectedFlight && selectedFlight.icao24 === flight.icao24)
          
          routeFeatures.push({
            type: 'Feature',
            properties: {
              icao24: flight.icao24,
              callsign: flight.callsign,
              selected: isSelected
            },
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates
            }
          })
        }
      } catch (error) {
        console.warn('Error creating route line for flight:', flight.icao24, error)
      }
    })

    // Update the route source
    const source = map.current.getSource('flight-routes') as mapboxgl.GeoJSONSource
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: routeFeatures
      })
    }
  }, [flights, selectedFlight, isMapReady])

  // Create update markers callback
  const updateMarkers = useCallback(() => {
    if (!map.current || !mapLoaded.current || !isMapReady) return

    // Remove markers for flights that no longer exist
    Object.entries(markers.current).forEach(([icao24, marker]) => {
      const stillExists = flights.some(f => f.icao24 === icao24)
      if (!stillExists) {
        marker.remove()
        delete markers.current[icao24]
      }
    });

    // Update or add markers
    flights.forEach((flight: FlightWithPrediction) => {
      const position = flight.interpolated_position || {
        longitude: flight.longitude,
        latitude: flight.latitude,
      }

      if (markers.current[flight.icao24]) {
        // Update existing marker position
        markers.current[flight.icao24].setLngLat([position.longitude, position.latitude])
        
        // Update rotation
        if (flight.true_track !== null) {
          const element = markers.current[flight.icao24].getElement()
          element.style.transform = `rotate(${flight.true_track}deg)`
        }
      } else {
        // Create new marker
        const el = document.createElement('div')
        el.className = 'flight-marker'
        el.innerHTML = flight.on_ground ? '🛬' : '✈️'
        el.style.cssText = `
          width: 32px;
          height: 32px;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.3s;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        `
        
        if (flight.true_track !== null && !flight.on_ground) {
          el.style.transform = `rotate(${flight.true_track}deg)`
        }
        
        el.addEventListener('click', () => {
          onSelectFlight(flight)
        })
        
        const marker = new mapboxgl.Marker(el)
          .setLngLat([position.longitude, position.latitude])
          .addTo(map.current!)
        
        markers.current[flight.icao24] = marker
        
        // Add popup
        const popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="color: black; padding: 5px;">
              <strong>${flight.callsign || flight.icao24}</strong><br/>
              ${flight.airline || flight.origin_country}<br/>
              ${flight.on_ground ? 'On Ground' : `${Math.round((flight.baro_altitude || 0) * 3.28084)} ft`}
            </div>
          `)
        
        marker.setPopup(popup)
      }
      
      // Highlight selected flight
      const isSelected = selectedFlight && selectedFlight.icao24 === flight.icao24
      const element = markers.current[flight.icao24]?.getElement()
      if (element) {
        element.style.filter = isSelected 
          ? 'drop-shadow(0 0 10px #60a5fa)' 
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
        element.style.zIndex = isSelected ? '10' : '1'
      }
    })

    // Update route lines for flights with departure/arrival airports
    if (flights && Array.isArray(flights)) {
      updateRouteLines()
    }
  }, [flights, selectedFlight, onSelectFlight, isMapReady, updateRouteLines])

  // Use tempus for smooth marker updates
  useTempus(() => {
    updateMarkers()
  }, { priority: 10 })

  // Center on selected flight
  useEffect(() => {
    if (map.current && selectedFlight && mapLoaded.current) {
      const position = (selectedFlight as FlightWithPrediction).interpolated_position || {
        longitude: selectedFlight.longitude,
        latitude: selectedFlight.latitude,
      }
      
      map.current.flyTo({
        center: [position.longitude, position.latitude],
        zoom: 11,
        essential: true,
        duration: 1000,
      })
    }
  }, [selectedFlight])

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }}>
      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(96, 165, 250, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(96, 165, 250, 0);
          }
        }
        
        .mapboxgl-popup {
          max-width: 200px;
        }
        
        .mapboxgl-popup-content {
          background: white;
          border-radius: 8px;
          padding: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}

export default MapboxMap