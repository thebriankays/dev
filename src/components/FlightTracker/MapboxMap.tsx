import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { gsap } from 'gsap'
import { Flight, FlightMapProps } from './types'

// Set Mapbox token - use a fallback token if not set
if (typeof window !== 'undefined') {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiZGV2LW1hcGJveCIsImEiOiJjbG93MG5yNmQwMGJhMmpwY3Zld3RmMnB3In0.8H5FcN6K7peOmM4wLrKBXg'
}

interface FlightWithDisplay extends Flight {
  display_longitude?: number
  display_latitude?: number
}

interface AnimationRef {
  kill: () => void
}

export const MapboxMap: React.FC<FlightMapProps> = ({
  flights,
  selectedFlight,
  selectedFlightRoute,
  onSelectFlight,
  onMapMove,
  center = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  zoom = 9,
  onRefresh,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const animationRefs = useRef<Map<string, AnimationRef>>(new Map())
  const [isMapReady, setIsMapReady] = useState(false)
  const selectedMarkerRef = useRef<mapboxgl.Marker | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    try {
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [center.lng, center.lat],
        zoom: zoom,
        projection: 'mercator',
        maxZoom: 18,
        minZoom: 2,
      })

      // Add controls
      newMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-right')

      // Add refresh button
      class RefreshControl {
        onAdd(_map: mapboxgl.Map) {
          const container = document.createElement('div')
          container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
          
          const button = document.createElement('button')
          button.className = 'mapboxgl-ctrl-icon'
          button.type = 'button'
          button.title = 'Refresh flights'
          button.innerHTML = '🔄'
          button.style.fontSize = '18px'
          button.style.lineHeight = '29px'
          
          button.addEventListener('click', () => {
            if (onRefresh) onRefresh()
          })
          
          container.appendChild(button)
          return container
        }
        onRemove() {
          // Cleanup if needed
        }
      }
      
      newMap.addControl(new RefreshControl() as mapboxgl.IControl, 'bottom-left')

      // Handle map events
      newMap.on('load', () => {
        console.log('[MapboxMap] Map loaded')
        setIsMapReady(true)
        
        // Add route source and layer (initially empty)
        newMap.addSource('flight-route', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        })

        newMap.addLayer({
          id: 'flight-route-line',
          type: 'line',
          source: 'flight-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#60a5fa',
            'line-width': 3,
            'line-opacity': 0.7,
            'line-dasharray': [2, 2]
          }
        })

        // Add airport markers source
        newMap.addSource('airports', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        })

        newMap.addLayer({
          id: 'airport-markers',
          type: 'symbol',
          source: 'airports',
          layout: {
            'icon-image': 'airport-15',
            'icon-size': 1.5,
            'text-field': ['get', 'code'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 1.5],
            'text-anchor': 'top'
          },
          paint: {
            'text-color': '#fff',
            'text-halo-color': 'rgba(0, 0, 0, 0.8)',
            'text-halo-width': 1
          }
        })
      })

      newMap.on('move', () => {
        const mapCenter = newMap.getCenter()
        const mapZoom = newMap.getZoom()
        if (onMapMove) {
          onMapMove({ lat: mapCenter.lat, lng: mapCenter.lng }, mapZoom)
        }
      })

      map.current = newMap

      // Store refs for cleanup
      const currentAnimationRefs = animationRefs.current
      const currentMarkers = markers.current

      return () => {
        // Clean up animations
        currentAnimationRefs.forEach(anim => anim.kill())
        currentAnimationRefs.clear()
        
        // Remove markers
        currentMarkers.forEach(marker => marker.remove())
        currentMarkers.clear()
        
        // Remove map
        map.current?.remove()
        map.current = null
      }
    } catch (error) {
      console.error('[MapboxMap] Error initializing map:', error)
    }
  }, [center.lat, center.lng, zoom, onMapMove, onRefresh]) // Include all dependencies

  // Update map center when it changes
  useEffect(() => {
    if (map.current && center) {
      map.current.flyTo({
        center: [center.lng, center.lat],
        duration: 1000,
      })
    }
  }, [center])

  // Update zoom when it changes
  useEffect(() => {
    if (map.current && zoom !== undefined) {
      map.current.zoomTo(zoom, { duration: 1000 })
    }
  }, [zoom])

  // Update route when selected flight changes
  useEffect(() => {
    if (!map.current || !isMapReady) return

    const source = map.current.getSource('flight-route') as mapboxgl.GeoJSONSource
    if (!source) return

    if (selectedFlightRoute) {
      // Show route for selected flight only
      source.setData({
        type: 'FeatureCollection',
        features: [selectedFlightRoute]
      })

      // Add airport markers if we have them
      if (selectedFlight?.originAirport && selectedFlight?.destinationAirport) {
        // Type guards to ensure we have AirportData objects
        const origin = selectedFlight.originAirport
        const destination = selectedFlight.destinationAirport
        
        if (typeof origin === 'object' && typeof destination === 'object') {
          const airportsSource = map.current.getSource('airports') as mapboxgl.GeoJSONSource
          if (airportsSource) {
            airportsSource.setData({
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [origin.longitude, origin.latitude]
                  },
                  properties: {
                    code: origin.iata,
                    name: origin.name
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [destination.longitude, destination.latitude]
                  },
                  properties: {
                    code: destination.iata,
                    name: destination.name
                  }
                }
              ]
            })
          }
        }
      }
    } else {
      // Clear route when no flight is selected
      source.setData({
        type: 'FeatureCollection',
        features: []
      })
      
      // Clear airport markers
      const airportsSource = map.current.getSource('airports') as mapboxgl.GeoJSONSource
      if (airportsSource) {
        airportsSource.setData({
          type: 'FeatureCollection',
          features: []
        })
      }
    }
  }, [selectedFlightRoute, selectedFlight, isMapReady])

  // Update flight markers with GSAP animations
  useEffect(() => {
    if (!map.current || !isMapReady) return

    const validFlights = flights.filter((f: FlightWithDisplay) => 
      f.latitude !== null && 
      f.longitude !== null &&
      !isNaN(f.latitude) &&
      !isNaN(f.longitude)
    )

    console.log(`[MapboxMap] Updating ${validFlights.length} flight markers`)

    // Create a set of current flight IDs
    const currentFlightIds = new Set(validFlights.map(f => f.icao24))

    // Update or create markers for each flight
    validFlights.forEach((flight: FlightWithDisplay) => {
      const markerId = flight.icao24
      let marker = markers.current.get(markerId)

      // Use display position if available (from GSAP animation), otherwise use actual position
      const lng = flight.display_longitude ?? flight.longitude
      const lat = flight.display_latitude ?? flight.latitude

      if (!marker) {
        // Create new marker
        const el = document.createElement('div')
        el.className = 'flight-marker'
        el.style.width = '24px'
        el.style.height = '24px'
        el.style.cursor = 'pointer'
        el.style.transition = 'transform 0.2s'
        
        // Create airplane icon
        const icon = document.createElement('div')
        icon.innerHTML = '✈️'
        icon.style.fontSize = '20px'
        icon.style.transform = `rotate(${flight.true_track || 0}deg)`
        icon.style.transformOrigin = 'center'
        icon.style.filter = flight.on_ground ? 'grayscale(1)' : 'none'
        el.appendChild(icon)

        // Add hover effect
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.5)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)'
        })

        // Add click handler
        el.addEventListener('click', () => {
          console.log(`[MapboxMap] Flight clicked: ${flight.callsign}`)
          onSelectFlight?.(flight)
        })

        marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([lng, lat])
          .addTo(map.current!)

        // Add popup with flight info
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: false,
        }).setHTML(`
          <div style="padding: 8px;">
            <strong>${flight.callsign || flight.icao24}</strong><br/>
            ${flight.airline || flight.origin_country}<br/>
            Alt: ${flight.baro_altitude ? Math.round(flight.baro_altitude * 3.28084).toLocaleString() : 'N/A'} ft<br/>
            Speed: ${flight.velocity ? Math.round(flight.velocity * 2.23694) : 'N/A'} mph
          </div>
        `)
        
        marker.setPopup(popup)
        markers.current.set(markerId, marker)
      } else {
        // Update existing marker position smoothly with GSAP
        const markerEl = marker.getElement()
        const iconEl = markerEl.querySelector('div') as HTMLElement
        
        if (iconEl) {
          // Update rotation
          gsap.to(iconEl, {
            rotation: flight.true_track || 0,
            duration: 0.5,
            ease: "power2.inOut"
          })
          
          // Update ground status
          iconEl.style.filter = flight.on_ground ? 'grayscale(1)' : 'none'
        }

        // Animate marker position
        const currentPos = marker.getLngLat()
        const newPos = { lng, lat }

        // Kill existing animation for this marker
        const existingAnim = animationRefs.current.get(markerId)
        if (existingAnim) {
          existingAnim.kill()
        }

        // Create smooth animation to new position
        const posProxy = { lng: currentPos.lng, lat: currentPos.lat }
        const anim = gsap.to(posProxy, {
          lng: newPos.lng,
          lat: newPos.lat,
          duration: 2,
          ease: "none",
          onUpdate: () => {
            marker?.setLngLat([posProxy.lng, posProxy.lat])
          }
        })

        animationRefs.current.set(markerId, anim)
      }

      // Highlight selected flight
      if (marker && selectedFlight && flight.icao24 === selectedFlight.icao24) {
        const el = marker.getElement()
        el.style.zIndex = '1000'
        el.style.transform = 'scale(1.5)'
        selectedMarkerRef.current = marker
      } else if (marker && selectedMarkerRef.current === marker) {
        const el = marker.getElement()
        el.style.zIndex = 'auto'
        el.style.transform = 'scale(1)'
        selectedMarkerRef.current = null
      }
    })

    // Remove markers for flights that are no longer in the data
    markers.current.forEach((marker, id) => {
      if (!currentFlightIds.has(id)) {
        // Kill animation for this marker
        const anim = animationRefs.current.get(id)
        if (anim) {
          anim.kill()
          animationRefs.current.delete(id)
        }
        
        marker.remove()
        markers.current.delete(id)
      }
    })
  }, [flights, selectedFlight, isMapReady, onSelectFlight])

  return (
    <div 
      ref={mapContainer} 
      className="flight-map"
      style={{ width: '100%', height: '100%' }}
    />
  )
}

export default MapboxMap
