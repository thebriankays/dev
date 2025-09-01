'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as Cesium from 'cesium'
import { CesiumViewer, CesiumViewerRef } from '@/components/CesiumViewer'
import './storytelling.scss'

interface StoryChapter {
  id?: string
  title: string
  content?: string
  description?: string | Record<string, unknown>
  location?: { lat: number; lng: number }
  coordinates?: { lat: number; lng: number }
  camera?: {
    range?: number
    tilt?: number
    heading?: number
    altitude?: number
    zoom?: number
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
    coverImage?: unknown
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
  const cesiumRef = useRef<CesiumViewerRef>(null)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCover, setShowCover] = useState(true)
  const playTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Get chapters from either format - memoized to prevent dependency issues
  const chapters = useMemo(
    () => itinerary?.storyChapters || itinerary?.chapters || [],
    [itinerary?.storyChapters, itinerary?.chapters]
  )
  const config = itinerary?.storytellingConfig || {}
  const currentChapter = chapters[currentChapterIndex]

  // Handle viewer ready
  const handleViewerReady = useCallback((viewer: Cesium.Viewer) => {
    console.log('Cesium viewer ready for Storytelling')
    setIsReady(true)
    
    // Reduce mouse sensitivity for smoother cinematic experience
    viewer.scene.screenSpaceCameraController.enableRotate = false
    viewer.scene.screenSpaceCameraController.enableTranslate = false
    viewer.scene.screenSpaceCameraController.enableZoom = true
    viewer.scene.screenSpaceCameraController.enableTilt = false
    viewer.scene.screenSpaceCameraController.enableLook = false
  }, [])

  // Go to specific chapter with smooth camera animation
  const goToChapter = useCallback((index: number) => {
    if (!cesiumRef.current || !chapters[index]) return

    setCurrentChapterIndex(index)
    const chapter = chapters[index]
    const location = chapter.location || chapter.coordinates
    
    if (!location) return

    console.log(`Navigating to chapter ${index + 1}: ${chapter.title}`, location)

    // Calculate altitude based on range or use default
    const altitude = chapter.camera?.range || chapter.camera?.altitude || 1500
    
    // Convert tilt to pitch (Cesium uses negative pitch for looking down)
    const pitch = chapter.camera?.tilt ? -(90 - chapter.camera.tilt) : -45

    cesiumRef.current.flyTo({
      lat: location.lat,
      lng: location.lng,
      altitude: altitude,
      heading: chapter.camera?.heading || 0,
      pitch: pitch,
      duration: 2.5 // Smooth camera transition
    })
  }, [chapters])

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !isReady || chapters.length === 0) {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current)
        playTimerRef.current = null
      }
      return
    }

    console.log('Auto-play active, scheduling next chapter...')
    
    const duration = (currentChapter?.duration || 10) * 1000
    playTimerRef.current = setTimeout(() => {
      const nextIndex = currentChapterIndex + 1
      
      if (nextIndex < chapters.length) {
        console.log(`Auto-advancing to chapter ${nextIndex + 1}`)
        goToChapter(nextIndex)
      } else {
        console.log('Reached end, stopping auto-play')
        setIsPlaying(false)
      }
    }, duration)

    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current)
        playTimerRef.current = null
      }
    }
  }, [isPlaying, isReady, currentChapterIndex, chapters, currentChapter, goToChapter])

  const handleStart = () => {
    setShowCover(false)
    if (isReady) {
      goToChapter(0)
      if (config.autoPlay) {
        setIsPlaying(true)
      }
    }
  }

  const handlePrevious = () => {
    const prevIndex = currentChapterIndex > 0 ? currentChapterIndex - 1 : chapters.length - 1
    goToChapter(prevIndex)
  }

  const handleNext = () => {
    const nextIndex = (currentChapterIndex + 1) % chapters.length
    goToChapter(nextIndex)
  }

  const togglePlay = () => {
    console.log('Toggle play clicked, current state:', isPlaying)
    if (!isPlaying) {
      setIsPlaying(true)
      // If at the last chapter, restart from beginning
      if (currentChapterIndex === chapters.length - 1) {
        goToChapter(0)
      } else {
        // Otherwise advance to next chapter immediately
        goToChapter(currentChapterIndex + 1)
      }
    } else {
      setIsPlaying(false)
    }
  }

  // Early return if no itinerary
  if (!itinerary || chapters.length === 0) {
    return (
      <div className="storytelling__container">
        <div className="storytelling__overlay">
          No itinerary data provided.
        </div>
      </div>
    )
  }

  // Get initial location from first chapter
  const firstChapter = chapters[0]
  const initialLocation = firstChapter?.location || firstChapter?.coordinates || { lat: 48.8584, lng: 2.2945 }

  return (
    <>
      {showCover && (
        <div className="storytelling__cover">
          <div className="storytelling__cover-content">
            <h1 className="storytelling__cover-title">{itinerary.title}</h1>
            {itinerary.description && (
              <p className="storytelling__cover-description">{itinerary.description}</p>
            )}
            <button 
              className="storytelling__cover-button" 
              onClick={handleStart}
              disabled={!isReady}
            >
              {isReady ? 'Start Journey' : 'Loading 3D Map...'}
            </button>
          </div>
        </div>
      )}
      
      <div className={`storytelling__container ${config.theme === 'light' ? 'storytelling__container--light' : ''}`}>
        <div className="storytelling__map">
          <CesiumViewer
            ref={cesiumRef}
            onViewerReady={handleViewerReady}
            initialLocation={{
              lat: initialLocation.lat,
              lng: initialLocation.lng,
              altitude: firstChapter?.camera?.range || 1500,
              heading: firstChapter?.camera?.heading || 0,
              pitch: firstChapter?.camera?.tilt ? -(90 - firstChapter.camera.tilt) : -45
            }}
          />
        </div>

        {!showCover && currentChapter && (
          <div className="storytelling__panel">
            <div className="storytelling__chapter">
              <div className="storytelling__chapter-number">
                Chapter {currentChapterIndex + 1} of {chapters.length}
              </div>
              <h2 className="storytelling__chapter-title">{currentChapter.title}</h2>
              {currentChapter.content && (
                <p className="storytelling__chapter-content">{currentChapter.content}</p>
              )}
            </div>

            {config.showNavigation && (
              <div className="storytelling__controls">
                <button 
                  className="storytelling__control-btn"
                  onClick={handlePrevious}
                  disabled={!isReady}
                >
                  ← Previous
                </button>
                
                <button 
                  className="storytelling__control-btn storytelling__control-btn--play"
                  onClick={togglePlay}
                  disabled={!isReady}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                
                <button 
                  className="storytelling__control-btn"
                  onClick={handleNext}
                  disabled={!isReady}
                >
                  Next →
                </button>
              </div>
            )}

            {config.showTimeline && (
              <div className="storytelling__timeline">
                {chapters.map((chapter, index) => (
                  <button
                    key={index}
                    className={`storytelling__timeline-dot ${
                      index === currentChapterIndex ? 'storytelling__timeline-dot--active' : ''
                    }`}
                    onClick={() => goToChapter(index)}
                    title={chapter.title}
                    disabled={!isReady}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
