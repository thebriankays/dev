'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { CesiumViewer, CesiumViewerHandle } from '@/components/CesiumViewer'
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
  const cesiumRef = useRef<CesiumViewerHandle>(null)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCover, setShowCover] = useState(true)
  const autoPlayTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Normalize chapters from either storyChapters or chapters prop
  const chapters = itinerary?.storyChapters || itinerary?.chapters || []
  
  // Get current chapter
  const currentChapter = chapters[currentChapterIndex]

  // Define flyToChapter function before using it
  const flyToChapter = useCallback((chapter: StoryChapter) => {
    if (!cesiumRef.current?.isReady()) return

    const location = chapter.location || chapter.coordinates
    if (!location) return

    const camera = chapter.camera || {}
    cesiumRef.current.flyTo({
      lat: location.lat,
      lng: location.lng,
      altitude: camera.range || camera.altitude || 1500,
      heading: camera.heading || 0,
      pitch: camera.tilt !== undefined ? camera.tilt : -45,
      duration: 2.5
    })
  }, [])

  // Initialize and load the first chapter
  useEffect(() => {
    if (isReady && currentChapter) {
      flyToChapter(currentChapter)
    }
  }, [isReady, currentChapter, flyToChapter])

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && !showCover) {
      const duration = currentChapter?.duration || 10
      autoPlayTimeoutRef.current = setTimeout(() => {
        if (currentChapterIndex < chapters.length - 1) {
          setCurrentChapterIndex(prev => prev + 1)
        } else {
          setIsPlaying(false)
        }
      }, duration * 1000)

      return () => {
        if (autoPlayTimeoutRef.current) {
          clearTimeout(autoPlayTimeoutRef.current)
        }
      }
    }
  }, [isPlaying, currentChapterIndex, showCover, currentChapter, chapters.length])

  const handleStartStory = () => {
    setShowCover(false)
    setCurrentChapterIndex(0)
    if (itinerary?.storytellingConfig?.autoPlay) {
      setIsPlaying(true)
    }
  }

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(prev => prev + 1)
    }
  }

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1)
    }
  }

  const handleChapterSelect = (index: number) => {
    setCurrentChapterIndex(index)
    setIsPlaying(false)
  }

  const togglePlayPause = () => {
    setIsPlaying(prev => !prev)
  }

  if (!itinerary || chapters.length === 0) {
    return (
      <div className="storytelling__empty">
        <p>No itinerary data available</p>
      </div>
    )
  }

  const config = itinerary.storytellingConfig || {}
  const theme = config.theme || 'dark'

  return (
    <div className={`storytelling__container storytelling--${theme}`}>
      <CesiumViewer
        ref={cesiumRef}
        onLoad={() => setIsReady(true)}
        initialLocation={
          chapters[0]?.location || chapters[0]?.coordinates
            ? {
                lat: (chapters[0].location || chapters[0].coordinates)!.lat,
                lng: (chapters[0].location || chapters[0].coordinates)!.lng,
                altitude: chapters[0].camera?.range || chapters[0].camera?.altitude || 1500,
                heading: chapters[0].camera?.heading || 0,
                pitch: chapters[0].camera?.tilt !== undefined ? chapters[0].camera.tilt : -45
              }
            : undefined
        }
      />

      {/* Cover Page */}
      {showCover && (
        <div className="storytelling__cover">
          <div className="storytelling__cover-content">
            <h1 className="storytelling__title">{itinerary.title}</h1>
            {itinerary.description && (
              <p className="storytelling__description">{itinerary.description}</p>
            )}
            <button 
              className="storytelling__start-btn"
              onClick={handleStartStory}
            >
              Begin Interactive Story
            </button>
          </div>
        </div>
      )}

      {/* Story Panel */}
      {!showCover && (
        <div className="storytelling__panel">
          <div className="storytelling__chapter">
            <h2 className="storytelling__chapter-title">
              {currentChapter?.title}
            </h2>
            {currentChapter?.content && (
              <div className="storytelling__chapter-content">
                {typeof currentChapter.content === 'string' 
                  ? <p>{currentChapter.content}</p>
                  : currentChapter.content
                }
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          {config.showNavigation !== false && (
            <div className="storytelling__controls">
              <button
                className="storytelling__control-btn"
                onClick={handlePrevChapter}
                disabled={currentChapterIndex === 0}
                aria-label="Previous chapter"
              >
                ←
              </button>
              
              <button
                className="storytelling__control-btn storytelling__play-btn"
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              
              <button
                className="storytelling__control-btn"
                onClick={handleNextChapter}
                disabled={currentChapterIndex === chapters.length - 1}
                aria-label="Next chapter"
              >
                →
              </button>
            </div>
          )}

          {/* Chapter Timeline */}
          {config.showTimeline !== false && (
            <div className="storytelling__timeline">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id || index}
                  className={`storytelling__timeline-dot ${
                    index === currentChapterIndex ? 'active' : ''
                  } ${index < currentChapterIndex ? 'visited' : ''}`}
                  onClick={() => handleChapterSelect(index)}
                  aria-label={`Go to chapter ${index + 1}: ${chapter.title}`}
                  title={chapter.title}
                />
              ))}
            </div>
          )}

          {/* Chapter Cards */}
          <div className="storytelling__chapters">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id || index}
                className={`storytelling__chapter-card ${
                  index === currentChapterIndex ? 'active' : ''
                }`}
                onClick={() => handleChapterSelect(index)}
              >
                <div className="storytelling__chapter-number">{index + 1}</div>
                <div className="storytelling__chapter-info">
                  <h3>{chapter.title}</h3>
                  {chapter.location && (
                    <p className="storytelling__chapter-location">
                      📍 Location
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="storytelling__progress">
            <div 
              className="storytelling__progress-bar"
              style={{ 
                width: `${((currentChapterIndex + 1) / chapters.length) * 100}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
