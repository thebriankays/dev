'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import gsap from 'gsap'
import './storytelling.scss'

interface StoryChapter {
  id?: string
  title: string
  content?: string
  description?: any
  location?: { lat: number; lng: number }
  coordinates?: { lat: number; lng: number }
  camera?: {
    range?: number
    tilt?: number
    heading?: number
    altitude?: number
  }
  focusOptions?: {
    showFocus?: boolean
    focusRadius?: number
    showLocationMarker?: boolean
  }
  duration?: number
}

interface StorytellingProps {
  itinerary?: {
    title: string
    description?: string
    coverImage?: any
    storyChapters?: StoryChapter[]
    chapters?: StoryChapter[]
    storytellingConfig?: {
      autoPlay?: boolean
      autoPlayDelay?: number
      showNavigation?: boolean
      showTimeline?: boolean
      theme?: 'light' | 'dark'
    }
  }
}

export function Storytelling({ itinerary }: StorytellingProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null) // Map3DElement is beta, not in types
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [status, setStatus] = useState('loading')
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCover, setShowCover] = useState(true)

  // Get chapters from either format
  const chapters = itinerary?.storyChapters || itinerary?.chapters || []
  const config = itinerary?.storytellingConfig || {}
  const currentChapter = chapters[currentChapterIndex]

  // Clear markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      marker.map = null
    })
    markersRef.current = []
  }, [])

  // Go to specific chapter
  const goToChapter = useCallback((index: number) => {
    if (!mapInstance.current) return
    
    setCurrentChapterIndex(index)
    const map3d = mapInstance.current
    const chapter = chapters[index]
    const location = chapter.location || chapter.coordinates
    
    if (location) {
      gsap.to(map3d, {
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: function() {
          map3d.center = location
          map3d.range = chapter.camera?.range || 1500
          map3d.tilt = chapter.camera?.tilt || 65
          map3d.heading = chapter.camera?.heading || 0
        }
      })
    }
  }, [chapters])

  // Initialize the map
  useEffect(() => {
    let map3d: any = null

    const initMap = async () => {
      if (!mapContainerRef.current || chapters.length === 0) return

      try {
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'alpha',
          libraries: ['maps3d', 'marker', 'places']
        })

        const [maps3dLib, markerLib] = await Promise.all([
          loader.importLibrary('maps3d'),
          loader.importLibrary('marker')
        ])

        // Map3DElement is a beta feature, cast to any
        const Map3DElement = (maps3dLib as any).Map3DElement
        const { AdvancedMarkerElement } = markerLib as google.maps.MarkerLibrary

        const firstChapter = chapters[0]
        const initialLocation = firstChapter.location || firstChapter.coordinates || { lat: 48.8584, lng: 2.2945 }

        // Create 3D map
        map3d = new Map3DElement({
          center: initialLocation,
          range: firstChapter.camera?.range || 1500,
          tilt: firstChapter.camera?.tilt || 65,
          heading: firstChapter.camera?.heading || 0
        })

        mapInstance.current = map3d
        mapContainerRef.current.appendChild(map3d)

        // Create markers for all chapters
        clearMarkers()
        for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i]
          const location = chapter.location || chapter.coordinates
          if (!location) continue

          const markerContent = document.createElement('div')
          markerContent.className = 'storytelling__marker'
          markerContent.innerHTML = `
            <div class="storytelling__marker-number">${i + 1}</div>
          `

          const marker = new AdvancedMarkerElement({
            map: map3d,
            position: location,
            content: markerContent,
            title: chapter.title
          })

          marker.addListener('click', () => {
            goToChapter(i)
          })

          markersRef.current.push(marker)
        }

        setStatus('ready')
      } catch (error) {
        console.error('Failed to initialize Storytelling map:', error)
        setStatus('error')
      }
    }

    if (!showCover) {
      initMap()
    }

    return () => {
      clearMarkers()
      if (map3d && mapContainerRef.current && mapContainerRef.current.contains(map3d)) {
        mapContainerRef.current.removeChild(map3d)
      }
    }
  }, [chapters, showCover, clearMarkers, goToChapter])

  // Setup animation timeline
  useEffect(() => {
    if (status !== 'ready' || !mapInstance.current || chapters.length === 0) return

    const map3d = mapInstance.current

    // Create GSAP timeline
    timeline.current = gsap.timeline({ 
      paused: true,
      onComplete: () => setIsPlaying(false)
    })

    // Camera state for smooth transitions
    const cameraState = {
      lat: chapters[0].location?.lat || chapters[0].coordinates?.lat || 48.8584,
      lng: chapters[0].location?.lng || chapters[0].coordinates?.lng || 2.2945,
      range: chapters[0].camera?.range || 1500,
      tilt: chapters[0].camera?.tilt || 65,
      heading: chapters[0].camera?.heading || 0
    }

    // Add animations for each chapter
    chapters.forEach((chapter, index) => {
      const location = chapter.location || chapter.coordinates || cameraState
      const camera = chapter.camera || {}
      const duration = chapter.duration || 10

      timeline.current?.to(cameraState, {
        lat: location.lat,
        lng: location.lng,
        range: camera.range || 1500,
        tilt: camera.tilt || 65,
        heading: camera.heading || cameraState.heading,
        duration: 3, // Transition duration
        ease: 'power2.inOut',
        onStart: () => {
          setCurrentChapterIndex(index)
        },
        onUpdate: () => {
          map3d.center = { lat: cameraState.lat, lng: cameraState.lng }
          map3d.range = cameraState.range
          map3d.tilt = cameraState.tilt
          map3d.heading = cameraState.heading
        }
      })
      .to({}, { duration: duration - 3 }) // Pause at chapter
    })
  }, [status, chapters])

  const handlePlay = useCallback(() => {
    if (!timeline.current) return
    setIsPlaying(true)
    timeline.current.play()
  }, [])

  const handlePause = useCallback(() => {
    if (!timeline.current) return
    setIsPlaying(false)
    timeline.current.pause()
  }, [])

  const handleNext = useCallback(() => {
    if (currentChapterIndex < chapters.length - 1) {
      goToChapter(currentChapterIndex + 1)
    }
  }, [currentChapterIndex, goToChapter, chapters.length])

  const handlePrevious = useCallback(() => {
    if (currentChapterIndex > 0) {
      goToChapter(currentChapterIndex - 1)
    }
  }, [currentChapterIndex, goToChapter])

  const handleStart = useCallback(() => {
    setShowCover(false)
    if (config.autoPlay) {
      setTimeout(() => handlePlay(), 1000)
    }
  }, [config.autoPlay, handlePlay])

  // Show cover page
  if (showCover) {
    return (
      <div className="storytelling__cover">
        <div className="storytelling__cover-content">
          <h1 className="storytelling__cover-title">{itinerary?.title || 'Travel Story'}</h1>
          {itinerary?.description && (
            <p className="storytelling__cover-description">{itinerary.description}</p>
          )}
          <button 
            className="storytelling__cover-button"
            onClick={handleStart}
          >
            Begin Journey
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`storytelling__container ${config.theme ? `storytelling__container--${config.theme}` : ''}`}>
      <div ref={mapContainerRef} className="storytelling__map" />
      
      {status === 'loading' && (
        <div className="storytelling__overlay">Loading Story...</div>
      )}

      {status === 'ready' && currentChapter && (
        <>
          {/* Chapter Info Panel */}
          <div className="storytelling__chapter-panel">
            <div className="storytelling__chapter-content">
              <div className="storytelling__chapter-number">
                Chapter {currentChapterIndex + 1} of {chapters.length}
              </div>
              <h2 className="storytelling__chapter-title">{currentChapter.title}</h2>
              {currentChapter.content && (
                <p className="storytelling__chapter-description">
                  {currentChapter.content}
                </p>
              )}
            </div>
          </div>

          {/* Controls */}
          {config.showNavigation !== false && (
            <div className="storytelling__controls">
              <button 
                className="storytelling__control-btn"
                onClick={handlePrevious}
                disabled={currentChapterIndex === 0}
              >
                ← Previous
              </button>

              <div className="storytelling__play-controls">
                {!isPlaying ? (
                  <button 
                    className="storytelling__control-btn storytelling__control-btn--play"
                    onClick={handlePlay}
                  >
                    ▶ Play
                  </button>
                ) : (
                  <button 
                    className="storytelling__control-btn storytelling__control-btn--pause"
                    onClick={handlePause}
                  >
                    ⏸ Pause
                  </button>
                )}
              </div>

              <button 
                className="storytelling__control-btn"
                onClick={handleNext}
                disabled={currentChapterIndex === chapters.length - 1}
              >
                Next →
              </button>
            </div>
          )}

          {/* Timeline */}
          {config.showTimeline !== false && (
            <div className="storytelling__timeline">
              {chapters.map((chapter, index) => (
                <button
                  key={index}
                  className={`storytelling__timeline-dot ${
                    index === currentChapterIndex ? 'storytelling__timeline-dot--active' : ''
                  } ${
                    index < currentChapterIndex ? 'storytelling__timeline-dot--visited' : ''
                  }`}
                  onClick={() => goToChapter(index)}
                  title={chapter.title}
                />
              ))}
            </div>
          )}

          {/* Chapter List */}
          <div className="storytelling__chapters-list">
            <h3>Chapters</h3>
            <div className="storytelling__chapters-items">
              {chapters.map((chapter, index) => (
                <button
                  key={index}
                  className={`storytelling__chapter-item ${
                    index === currentChapterIndex ? 'storytelling__chapter-item--active' : ''
                  }`}
                  onClick={() => goToChapter(index)}
                >
                  <span className="storytelling__chapter-item-number">{index + 1}</span>
                  <span className="storytelling__chapter-item-title">{chapter.title}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
