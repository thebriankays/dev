'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import * as Cesium from 'cesium'
import { CesiumViewer, CesiumViewerRef } from '@/components/CesiumViewer'
import { loadGoogleMaps } from '@/lib/google-maps/loader'
import './area-explorer.scss'

interface AreaExplorerProps {
  initialLocation?: {
    lat: number
    lng: number
    name?: string
  }
}

export function AreaExplorer({ initialLocation }: AreaExplorerProps) {
  const cesiumRef = useRef<CesiumViewerRef>(null)
  const [isReady, setIsReady] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(initialLocation || { lat: 37.7749, lng: -122.4194, name: 'San Francisco' })
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const autoRotateRef = useRef<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const handleViewerReady = useCallback((viewer: Cesium.Viewer) => {
    console.log('Cesium viewer ready for AreaExplorer')
    setIsReady(true)
    
    // Enable mouse controls for free exploration
    viewer.scene.screenSpaceCameraController.enableRotate = true
    viewer.scene.screenSpaceCameraController.enableTranslate = true
    viewer.scene.screenSpaceCameraController.enableZoom = true
    viewer.scene.screenSpaceCameraController.enableTilt = true
    viewer.scene.screenSpaceCameraController.enableLook = true
  }, [])

  const handleCameraControl = useCallback((action: string) => {
    const viewer = cesiumRef.current?.viewer
    if (!viewer) return

    const camera = viewer.camera
    const currentHeading = camera.heading
    const currentPitch = camera.pitch
    const currentPosition = camera.positionCartographic

    switch (action) {
      case 'rotateLeft':
        camera.setView({
          orientation: {
            heading: currentHeading - Cesium.Math.toRadians(15),
            pitch: currentPitch,
            roll: 0
          }
        })
        break
      
      case 'rotateRight':
        camera.setView({
          orientation: {
            heading: currentHeading + Cesium.Math.toRadians(15),
            pitch: currentPitch,
            roll: 0
          }
        })
        break
      
      case 'tiltUp':
        camera.setView({
          orientation: {
            heading: currentHeading,
            pitch: Math.min(currentPitch + Cesium.Math.toRadians(10), 0),
            roll: 0
          }
        })
        break
      
      case 'tiltDown':
        camera.setView({
          orientation: {
            heading: currentHeading,
            pitch: Math.max(currentPitch - Cesium.Math.toRadians(10), -Cesium.Math.PI_OVER_TWO),
            roll: 0
          }
        })
        break
      
      case 'zoomIn':
        camera.zoomIn(currentPosition.height * 0.5)
        break
      
      case 'zoomOut':
        camera.zoomOut(currentPosition.height * 0.5)
        break
      
      case 'reset':
        cesiumRef.current?.flyTo({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          altitude: 1500,
          heading: 0,
          pitch: -45,
          duration: 1.5
        })
        break
    }
  }, [currentLocation])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    // Google Places Autocomplete handles the search
  }, [])

  const startAutoRotate = useCallback(() => {
    const viewer = cesiumRef.current?.viewer
    if (!viewer || autoRotateRef.current) return

    setIsAutoRotating(true)
    
    const animate = () => {
      const camera = viewer.camera
      
      // Rotate around the current center point
      const currentHeading = camera.heading
      camera.setView({
        orientation: {
          heading: currentHeading + Cesium.Math.toRadians(0.2), // Rotate 0.2 degrees per frame
          pitch: camera.pitch,
          roll: 0
        }
      })

      autoRotateRef.current = requestAnimationFrame(animate)
    }
    
    animate()
  }, [])

  const stopAutoRotate = useCallback(() => {
    if (autoRotateRef.current) {
      cancelAnimationFrame(autoRotateRef.current)
      autoRotateRef.current = null
    }
    setIsAutoRotating(false)
  }, [])

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        await loadGoogleMaps()
        
        if (searchInputRef.current && window.google) {
          // Create autocomplete instance
          const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ['geometry', 'name', 'formatted_address'],
            types: ['geocode', 'establishment']
          })
          
          // Add listener for place selection
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat()
              const lng = place.geometry.location.lng()
              const name = place.name || place.formatted_address || 'Selected Location'
              
              // Update location and fly to it
              setCurrentLocation({ lat, lng, name })
              setSearchInput(name)
              
              if (cesiumRef.current) {
                cesiumRef.current.flyTo({
                  lat,
                  lng,
                  altitude: 1500,
                  heading: 0,
                  pitch: -45,
                  duration: 2
                })
              }
            }
          })
          
          autocompleteRef.current = autocomplete
        }
      } catch (error) {
        console.error('Failed to initialize Google Places Autocomplete:', error)
      }
    }
    
    initAutocomplete()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoRotateRef.current) {
        cancelAnimationFrame(autoRotateRef.current)
      }
    }
  }, [])

  return (
    <div className="area-explorer__container">
      <div className="area-explorer__map-wrapper">
        <CesiumViewer
          ref={cesiumRef}
          onViewerReady={handleViewerReady}
          initialLocation={{
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            altitude: 1500,
            pitch: -45
          }}
        />
      </div>

      <div className="area-explorer__controls">
        <div className="area-explorer__search-section">
          <h3>Search Location</h3>
          <form onSubmit={handleSearch} className="area-explorer__search-form">
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter city, address, or landmark..."
              className="area-explorer__search-input"
              disabled={!isReady}
            />
            <button 
              type="submit" 
              disabled={!isReady}
              className="area-explorer__search-button"
              style={{ display: 'none' }} // Hide since autocomplete handles search
            >
              Search
            </button>
          </form>
        </div>

        <div className="area-explorer__camera-section">
          <h3>3D Map Controls</h3>
          <div className="area-explorer__auto-rotate-control">
            <button 
              onClick={isAutoRotating ? stopAutoRotate : startAutoRotate}
              disabled={!isReady}
              className={`area-explorer__auto-rotate-btn ${isAutoRotating ? 'area-explorer__auto-rotate-btn--active' : ''}`}
            >
              {isAutoRotating ? '⏸ Stop Auto-Rotate' : '▶ Start Auto-Rotate'}
            </button>
          </div>
          <div className="area-explorer__camera-controls">
            <button 
              onClick={() => handleCameraControl('rotateLeft')} 
              disabled={!isReady || isAutoRotating}
            >
              ← Rotate Left
            </button>
            <button 
              onClick={() => handleCameraControl('rotateRight')} 
              disabled={!isReady || isAutoRotating}
            >
              Rotate Right →
            </button>
            <button 
              onClick={() => handleCameraControl('tiltUp')} 
              disabled={!isReady}
            >
              ↑ Tilt Up
            </button>
            <button 
              onClick={() => handleCameraControl('tiltDown')} 
              disabled={!isReady}
            >
              ↓ Tilt Down
            </button>
            <button 
              onClick={() => handleCameraControl('zoomIn')} 
              disabled={!isReady}
            >
              + Zoom In
            </button>
            <button 
              onClick={() => handleCameraControl('zoomOut')} 
              disabled={!isReady}
            >
              - Zoom Out
            </button>
            <button 
              onClick={() => handleCameraControl('reset')} 
              disabled={!isReady}
            >
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
            <li>Left click + drag to pan</li>
            <li>Right click + drag to rotate/tilt</li>
            <li>Scroll to zoom in/out</li>
            <li>Middle click + drag to rotate view</li>
            <li>Use controls for precise movement</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
