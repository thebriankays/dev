'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useField, useDocumentInfo, useForm } from '@payloadcms/ui'
import { CesiumViewer, CesiumViewerHandle } from '@/components/CesiumViewer'
import type { CesiumViewer as CesiumViewerType } from '@/components/CesiumViewer'
import { usePlacesWidget } from 'react-google-autocomplete'
import './itinerary-editor.scss'

interface StoryChapter {
  id?: string
  title: string
  content?: string
  coordinates?: {
    lat: number
    lng: number
  }
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

interface CameraState {
  heading: number
  pitch: number
  altitude: number
}

export const ItineraryEditor: React.FC = () => {
  const viewerRef = useRef<CesiumViewerHandle>(null)
  const documentInfo = useDocumentInfo()
  
  // Get form context to mark fields as modified
  const { setModified } = useForm()
  
  // Get the storyChapters field value and setter
  const { value: storyChapters, setValue: setStoryChapters } = useField<StoryChapter[]>({ 
    path: 'storyChapters' 
  })

  const [isMapReady, setMapReady] = useState(false)
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number | null>(null)
  const [currentCamera, setCurrentCamera] = useState<CameraState>({ 
    heading: 0, 
    pitch: -45, 
    altitude: 1500 
  })

  // Setup places search
  const { ref: placesRef } = usePlacesWidget<HTMLInputElement>({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: (place) => {
      const location = place.geometry?.location
      if (location && selectedChapterIndex !== null && storyChapters) {
        const lat = location.lat()
        const lng = location.lng()
        
        // Update the selected chapter's coordinates
        const updatedChapters = [...storyChapters]
        updatedChapters[selectedChapterIndex] = {
          ...updatedChapters[selectedChapterIndex],
          coordinates: { lat, lng }
        }
        
        setStoryChapters(updatedChapters)
        
        // Fly to the new location
        viewerRef.current?.flyTo({ 
          lat, 
          lng,
          altitude: currentCamera.altitude,
          heading: currentCamera.heading,
          pitch: currentCamera.pitch
        })
        
        // Mark form as modified
        setModified(true)
      }
    },
    options: { 
      types: ['(cities)']
    }
  })

  // Select and navigate to a chapter
  const selectChapter = useCallback((index: number) => {
    setSelectedChapterIndex(index)
    const chapter = storyChapters?.[index]
    
    if (chapter?.coordinates?.lat && chapter?.coordinates?.lng) {
      viewerRef.current?.flyTo({
        lat: chapter.coordinates.lat,
        lng: chapter.coordinates.lng,
        altitude: currentCamera.altitude,
        heading: chapter.cameraOptions?.heading || 0,
        pitch: chapter.cameraOptions?.pitch || -45
      })
      
      // Update current camera state
      setCurrentCamera({
        heading: chapter.cameraOptions?.heading || 0,
        pitch: chapter.cameraOptions?.pitch || -45,
        altitude: currentCamera.altitude
      })
    }
  }, [storyChapters, currentCamera.altitude])

  // Save current camera view to the selected chapter
  const setCameraForChapter = () => {
    if (selectedChapterIndex !== null && storyChapters) {
      const updatedChapters = [...storyChapters]
      updatedChapters[selectedChapterIndex] = {
        ...updatedChapters[selectedChapterIndex],
        cameraOptions: {
          useCustomCamera: true,
          heading: currentCamera.heading,
          pitch: currentCamera.pitch,
          roll: 0
        }
      }
      
      setStoryChapters(updatedChapters)
      
      // Mark form as modified
      setModified(true)
      
      alert('Camera position saved for this chapter!')
    }
  }

  // Add a new chapter at current view
  const addChapterAtCurrentView = () => {
    if (!viewerRef.current?.isReady()) return
    
    const newChapter: StoryChapter = {
      id: `chapter_${Date.now()}`,
      title: `Chapter ${(storyChapters?.length || 0) + 1}`,
      content: '',
      coordinates: undefined, // Will be set when user searches for location
      cameraOptions: {
        useCustomCamera: true,
        heading: currentCamera.heading,
        pitch: currentCamera.pitch,
        roll: 0
      },
      duration: 10,
      focusOptions: {
        showLocationMarker: true,
        showFocus: false,
        focusRadius: 250
      }
    }
    
    const updatedChapters = [...(storyChapters || []), newChapter]
    setStoryChapters(updatedChapters)
    setSelectedChapterIndex(updatedChapters.length - 1)
    
    // Mark form as modified
    setModified(true)
  }

  // Remove a chapter
  const removeChapter = (index: number) => {
    if (!storyChapters) return
    
    const updatedChapters = storyChapters.filter((_, i) => i !== index)
    setStoryChapters(updatedChapters)
    
    if (selectedChapterIndex === index) {
      setSelectedChapterIndex(null)
    } else if (selectedChapterIndex !== null && selectedChapterIndex > index) {
      setSelectedChapterIndex(selectedChapterIndex - 1)
    }
    
    // Mark form as modified
    setModified(true)
  }

  // Handle viewer ready
  const handleViewerReady = useCallback((viewer: CesiumViewerType) => {
    // Setup camera change listener
    if (viewer?.camera?.changed) {
      const updateCameraState = () => {
        const camera = viewer.camera
        const heading = Math.round(camera.heading * 180 / Math.PI)
        const pitch = Math.round(camera.pitch * 180 / Math.PI)
        const altitude = Math.round(camera.positionCartographic.height)
        
        setCurrentCamera({ heading, pitch, altitude })
      }
      
      viewer.camera.changed.addEventListener(updateCameraState)
      
      // Initial update
      updateCameraState()
    }
  }, [])

  // Preview the itinerary
  const previewItinerary = () => {
    if (documentInfo?.id) {
      window.open(`/itinerary/${documentInfo.id}`, '_blank')
    }
  }

  return (
    <div className="itinerary-editor">
      <div className="itinerary-editor__sidebar">
        <div className="itinerary-editor__header">
          <h3>3D Story Editor</h3>
          <p>Edit your itinerary chapters with 3D map views</p>
        </div>

        <div className="itinerary-editor__search">
          <input
            ref={placesRef}
            type="text"
            placeholder="Search location for selected chapter..."
            className="itinerary-editor__search-input"
            disabled={selectedChapterIndex === null}
          />
        </div>

        <div className="itinerary-editor__chapters">
          <div className="itinerary-editor__chapters-header">
            <h4>Story Chapters ({storyChapters?.length || 0})</h4>
            <button
              type="button"
              onClick={addChapterAtCurrentView}
              className="itinerary-editor__add-btn"
            >
              + Add Chapter
            </button>
          </div>

          <div className="itinerary-editor__chapters-list">
            {storyChapters?.map((chapter, index) => (
              <div
                key={chapter.id || index}
                className={`itinerary-editor__chapter-item ${
                  selectedChapterIndex === index ? 'selected' : ''
                }`}
              >
                <div
                  className="itinerary-editor__chapter-main"
                  onClick={() => selectChapter(index)}
                >
                  <span className="itinerary-editor__chapter-number">
                    {index + 1}
                  </span>
                  <div className="itinerary-editor__chapter-info">
                    <span className="itinerary-editor__chapter-title">
                      {chapter.title || `Chapter ${index + 1}`}
                    </span>
                    {chapter.coordinates && (
                      <span className="itinerary-editor__chapter-coords">
                        📍 {chapter.coordinates.lat.toFixed(4)}, {chapter.coordinates.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeChapter(index)
                  }}
                  className="itinerary-editor__chapter-remove"
                  title="Remove chapter"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {storyChapters?.length === 0 && (
            <div className="itinerary-editor__empty">
              <p>No chapters yet. Add your first chapter to begin.</p>
            </div>
          )}
        </div>

        <div className="itinerary-editor__camera">
          <h4>Camera Settings</h4>
          <div className="itinerary-editor__camera-info">
            <div>Heading: {currentCamera.heading}°</div>
            <div>Pitch: {currentCamera.pitch}°</div>
            <div>Altitude: {currentCamera.altitude}m</div>
          </div>
          <button
            type="button"
            onClick={setCameraForChapter}
            disabled={selectedChapterIndex === null}
            className="itinerary-editor__camera-save"
          >
            Save Camera for Selected Chapter
          </button>
        </div>

        {documentInfo?.id && (
          <div className="itinerary-editor__actions">
            <button
              type="button"
              onClick={previewItinerary}
              className="itinerary-editor__preview-btn"
            >
              Preview Itinerary →
            </button>
          </div>
        )}
      </div>

      <div className="itinerary-editor__map-container">
        <CesiumViewer
          ref={viewerRef}
          onLoad={() => setMapReady(true)}
          onViewerReady={handleViewerReady}
          initialLocation={
            storyChapters?.[0]?.coordinates
              ? {
                  lat: storyChapters[0].coordinates.lat,
                  lng: storyChapters[0].coordinates.lng,
                  altitude: 1500,
                  heading: storyChapters[0].cameraOptions?.heading || 0,
                  pitch: storyChapters[0].cameraOptions?.pitch || -45
                }
              : undefined
          }
        />
        {!isMapReady && (
          <div className="itinerary-editor__loading">
            Loading 3D Map...
          </div>
        )}
      </div>
    </div>
  )
}

export default ItineraryEditor
