'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useField } from '@payloadcms/ui'
import { Loader } from '@googlemaps/js-api-loader'
import './itinerary-builder.scss'

// Type definitions for Google Maps 3D Element (beta API)
// Based on official Google Maps documentation
interface LatLngLiteral {
  lat: number
  lng: number
}

interface LatLngAltitude extends LatLngLiteral {
  altitude?: number
}

interface Map3DElement extends HTMLElement {
  center: LatLngAltitude | LatLngLiteral
  heading: number
  tilt: number
  range: number
  roll?: number
  mode?: string
  defaultUIDisabled?: boolean
  bounds?: unknown
  maxAltitude?: number
  minAltitude?: number
  maxHeading?: number
  minHeading?: number
  maxTilt?: number
  minTilt?: number
}

// Constructor type for Map3DElement
interface Map3DElementConstructor {
  new (options?: {
    center?: LatLngAltitude | LatLngLiteral
    heading?: number
    tilt?: number
    range?: number
    mode?: string
  }): Map3DElement
}

type StoryChapter = {
  id?: string
  title: string
  content?: string
  dateTime?: string
  locationType?: string
  coordinates?: {
    lat: number
    lng: number
  }
  address?: string
  cameraOptions?: {
    useCustomCamera?: boolean
    heading?: number
    pitch?: number
    roll?: number
  }
  focusOptions?: {
    showFocus?: boolean
    focusRadius?: number
    showLocationMarker?: boolean
  }
  duration?: number
}

export const ItineraryBuilder: React.FC<{ path: string }> = ({ path }) => {
  const { value: chapters, setValue } = useField<StoryChapter[]>({ path })
  const mapRef = useRef<HTMLDivElement>(null)
  // Map3DElement is beta API - using custom type
  const mapInstance = useRef<Map3DElement | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const [isMapReady, setIsMapReady] = useState(false)
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.map = null
    })
    markersRef.current = []
  }, [])

  const goToChapter = useCallback((index: number) => {
    if (!mapInstance.current || !chapters || !chapters[index]) return
    
    const chapter = chapters[index]
    if (!chapter.coordinates) return

    const map3d = mapInstance.current
    map3d.center = chapter.coordinates
    map3d.tilt = chapter.cameraOptions?.pitch || 65
    map3d.heading = chapter.cameraOptions?.heading || 0
    map3d.range = 1500
    
    setSelectedChapterIndex(index)
  }, [chapters])

  const updateMarkers = useCallback(async () => {
    if (!mapInstance.current || !chapters) return
    
    clearMarkers()

    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary

    chapters.forEach((chapter, index) => {
      if (!chapter.coordinates) return

      const markerContent = document.createElement('div')
      markerContent.className = 'itinerary-builder-marker'
      markerContent.innerHTML = `
        <div class="itinerary-builder-marker-number ${selectedChapterIndex === index ? 'selected' : ''}">${index + 1}</div>
      `

      // Map3DElement doesn't directly support AdvancedMarkerElement
      // We need to cast it as the marker expects a Map interface
      const marker = new AdvancedMarkerElement({
        map: mapInstance.current as unknown as google.maps.Map | null,
        position: chapter.coordinates,
        content: markerContent,
        title: chapter.title
      })

      marker.addListener('click', () => {
        setSelectedChapterIndex(index)
        goToChapter(index)
      })

      markersRef.current.push(marker)
    })
  }, [chapters, selectedChapterIndex, clearMarkers, goToChapter])





  const initMap = useCallback(async () => {
    if (!mapRef.current) return

    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'alpha',
        libraries: ['maps3d', 'places', 'marker']
      })

      const [maps3dLib, placesLib] = await Promise.all([
        loader.importLibrary('maps3d'),
        loader.importLibrary('places')
      ])

      // Map3DElement is a beta feature
      const Map3DElement = (maps3dLib as { Map3DElement: Map3DElementConstructor }).Map3DElement
      const { Autocomplete } = placesLib as typeof google.maps.places

      // Get initial center from first chapter or default
      const initialCenter = chapters?.[0]?.coordinates || { lat: 48.8584, lng: 2.2945 }

      // Create 3D map
      const map3d = new Map3DElement({
        center: initialCenter,
        range: 1500,
        tilt: 65,
        heading: 0
      })

      mapInstance.current = map3d
      mapRef.current.appendChild(map3d)

      // Setup autocomplete
      if (searchInputRef.current) {
        autocompleteRef.current = new Autocomplete(searchInputRef.current, {
          fields: ['geometry', 'name', 'formatted_address']
        })

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current!.getPlace()
          if (place.geometry?.location) {
            const location = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }
            map3d.center = location
            map3d.range = 1500
          }
        })
      }

      setIsMapReady(true)
      updateMarkers()
    } catch (error) {
      console.error('Error loading Google Maps:', error)
    }
  }, [chapters, updateMarkers])

  useEffect(() => {
    initMap()
    return () => {
      clearMarkers()
      // Store ref value in variable to avoid stale closure issues
      const mapContainer = mapRef.current
      const map = mapInstance.current
      if (map && mapContainer && mapContainer.contains(map)) {
        mapContainer.removeChild(map)
      }
    }
  }, [initMap, clearMarkers])

  useEffect(() => {
    if (isMapReady) {
      updateMarkers()
    }
  }, [chapters, isMapReady, updateMarkers])

  const addChapterFromCurrentView = () => {
    if (!mapInstance.current) return

    const map3d = mapInstance.current
    const currentChapters = chapters || []
    
    const newChapter: StoryChapter = {
      id: `chapter_${Date.now()}`,
      title: `Chapter ${currentChapters.length + 1}`,
      content: '',
      coordinates: map3d.center as LatLngLiteral,
      cameraOptions: {
        useCustomCamera: true,
        heading: map3d.heading || 0,
        pitch: map3d.tilt || 65,
      },
      duration: 10,
      focusOptions: {
        showLocationMarker: true,
        showFocus: false,
        focusRadius: 250
      }
    }

    setValue([...currentChapters, newChapter])
  }

  const updateChapterFromView = (index: number) => {
    if (!mapInstance.current || !chapters) return

    const map3d = mapInstance.current
    const updatedChapters = [...chapters]
    
    updatedChapters[index] = {
      ...updatedChapters[index],
      coordinates: map3d.center as LatLngLiteral,
      cameraOptions: {
        useCustomCamera: true,
        heading: map3d.heading || 0,
        pitch: map3d.tilt || 65,
      }
    }
    
    setValue(updatedChapters)
  }

  const removeChapter = (index: number) => {
    if (!chapters) return
    const updatedChapters = chapters.filter((_, i) => i !== index)
    setValue(updatedChapters)
    if (selectedChapterIndex === index) {
      setSelectedChapterIndex(null)
    }
  }

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    if (!chapters) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= chapters.length) return

    const updatedChapters = [...chapters]
    const temp = updatedChapters[index]
    updatedChapters[index] = updatedChapters[newIndex]
    updatedChapters[newIndex] = temp
    setValue(updatedChapters)
  }

  return (
    <div className="itinerary-builder">
      <div className="itinerary-builder-sidebar">
        <div className="itinerary-builder-header">
          <h3>3D Story Builder</h3>
          <p>Navigate the map and capture views to create chapters</p>
        </div>

        <div className="itinerary-builder-search">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location..."
            className="itinerary-builder-search-input"
          />
        </div>

        <div className="itinerary-builder-chapters">
          <div className="itinerary-builder-chapters-header">
            <h4>Chapters ({chapters?.length || 0})</h4>
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className="itinerary-builder-edit-btn"
            >
              {editMode ? 'Done' : 'Edit'}
            </button>
          </div>

          <div className="itinerary-builder-chapters-list">
            {chapters?.map((chapter, index) => (
              <div
                key={chapter.id || index}
                className={`itinerary-builder-chapter-item ${selectedChapterIndex === index ? 'selected' : ''}`}
              >
                <div className="itinerary-builder-chapter-info">
                  <span className="itinerary-builder-chapter-number">{index + 1}</span>
                  <span className="itinerary-builder-chapter-title">{chapter.title}</span>
                </div>
                
                <div className="itinerary-builder-chapter-actions">
                  <button
                    type="button"
                    onClick={() => goToChapter(index)}
                    className="itinerary-builder-action-btn"
                    title="Go to chapter"
                  >
                    👁
                  </button>
                  {editMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateChapterFromView(index)}
                        className="itinerary-builder-action-btn"
                        title="Update from current view"
                      >
                        📷
                      </button>
                      <button
                        type="button"
                        onClick={() => moveChapter(index, 'up')}
                        className="itinerary-builder-action-btn"
                        disabled={index === 0}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveChapter(index, 'down')}
                        className="itinerary-builder-action-btn"
                        disabled={index === chapters.length - 1}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeChapter(index)}
                        className="itinerary-builder-action-btn itinerary-builder-delete-btn"
                        title="Delete chapter"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addChapterFromCurrentView}
            className="itinerary-builder-add-btn"
            disabled={!isMapReady}
          >
            + Add Chapter from Current View
          </button>
        </div>

        <div className="itinerary-builder-instructions">
          <h4>How to use:</h4>
          <ol>
            <li>Navigate the 3D map to find locations</li>
            <li>Adjust the camera angle and zoom</li>
            <li>Click &quot;Add Chapter&quot; to capture the view</li>
            <li>Edit chapter details in the form below</li>
            <li>Reorder or update chapters as needed</li>
          </ol>
        </div>
      </div>

      <div className="itinerary-builder-map-container">
        <div ref={mapRef} className="itinerary-builder-map" />
        {!isMapReady && (
          <div className="itinerary-builder-map-loader">Loading 3D Map...</div>
        )}
        
        <div className="itinerary-builder-camera-controls">
          <button
            type="button"
            onClick={() => {
              if (mapInstance.current) {
                const map3d = mapInstance.current
                map3d.heading = (map3d.heading || 0) - 30
              }
            }}
            className="itinerary-builder-camera-btn"
            title="Rotate left"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={() => {
              if (mapInstance.current) {
                const map3d = mapInstance.current
                map3d.heading = (map3d.heading || 0) + 30
              }
            }}
            className="itinerary-builder-camera-btn"
            title="Rotate right"
          >
            ↷
          </button>
          <button
            type="button"
            onClick={() => {
              if (mapInstance.current) {
                const map3d = mapInstance.current
                map3d.tilt = Math.min(90, (map3d.tilt || 0) + 10)
              }
            }}
            className="itinerary-builder-camera-btn"
            title="Tilt up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => {
              if (mapInstance.current) {
                const map3d = mapInstance.current
                map3d.tilt = Math.max(0, (map3d.tilt || 0) - 10)
              }
            }}
            className="itinerary-builder-camera-btn"
            title="Tilt down"
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  )
}
