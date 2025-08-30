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
  // Early return if no itinerary provided
  if (!itinerary) {
    return (
      <div className="storytelling__container">
        <div className="storytelling__overlay">
          No itinerary data provided.
        </div>
      </div>
    )
  }
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [status, setStatus] = useState('loading')
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCover, setShowCover] = useState(false) // Start with false to allow map container to render

  // Get chapters from either format
  const chapters = itinerary?.storyChapters || itinerary?.chapters || []
  const config = itinerary?.storytellingConfig || {}
  const currentChapter = chapters[currentChapterIndex]
  
  // Debug current status
  useEffect(() => {
    console.log('Current status:', status)
    console.log('Show cover:', showCover) 
    console.log('Chapters available:', chapters.length)
  }, [status, showCover, chapters.length])

  // Clear markers
  const clearMarkers = useCallback(() => {
    if (markersRef.current && Array.isArray(markersRef.current)) {
      markersRef.current.forEach(marker => {
        if (marker && marker.map) {
          marker.map = null
        }
      })
      markersRef.current = []
    }
  }, [])

  // Go to specific chapter
  const goToChapter = useCallback((index: number) => {
    if (!mapInstance.current) return
    
    setCurrentChapterIndex(index)
    const map = mapInstance.current
    const chapter = chapters[index]
    const location = chapter.location || chapter.coordinates
    
    if (location) {
      // Animate camera to chapter location
      gsap.to({}, {
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: function() {
          map.setCenter(location)
          map.setZoom(chapter.camera?.zoom || 17)
          map.setTilt(chapter.camera?.tilt || 65)
          map.setHeading(chapter.camera?.heading || 0)
        }
      })
    }
  }, [chapters])

  // Initialize the map
  useEffect(() => {
    let mounted = true;
    
    const initMap = async () => {
      // Don't initialize if already initialized or no container
      if (!mapContainerRef.current || !mounted || mapInstance.current) {
        console.log('Skipping initialization:', {
          hasContainer: !!mapContainerRef.current,
          mounted,
          hasMapInstance: !!mapInstance.current
        })
        return
      }
      
      // Handle no chapters case
      if (chapters.length === 0) {
        console.warn('No chapters provided to Storytelling component')
        if (mounted) {
          setStatus('error')
        }
        return
      }

      try {
        console.log('Starting map initialization...')
        console.log('Chapters:', chapters)
        
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
        
        if (!apiKey) {
          throw new Error('Google Maps API key is missing')
        }
        
        console.log('Loading Google Maps libraries...')
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['marker', 'places'],
          mapIds: mapId ? [mapId] : []
        })

        await loader.load()
        console.log('Google Maps libraries loaded')
        
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary
        console.log('Marker library loaded')

        const firstChapter = chapters[0]
        const initialLocation = firstChapter.location || firstChapter.coordinates || { lat: 48.8584, lng: 2.2945 }
        console.log('Initial location:', initialLocation)

        // Create standard Google Maps with 3D tiles
        console.log('Creating map instance...')
        const map = new google.maps.Map(mapContainerRef.current, {
          center: initialLocation,
          zoom: firstChapter.camera?.zoom || 17,
          tilt: firstChapter.camera?.tilt || 65,
          heading: firstChapter.camera?.heading || 0,
          mapId: mapId || '', // Enables 3D tiles
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          tiltInteractionEnabled: true,
          headingInteractionEnabled: true,
        })

        mapInstance.current = map
        console.log('Map created successfully:', map)

        // Create markers for all chapters
        console.log('Creating markers...')
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
            map: map,
            position: location,
            content: markerContent,
            title: chapter.title
          })

          marker.addListener('click', () => {
            goToChapter(i)
          })

          markersRef.current.push(marker)
        }
        console.log('Markers created:', markersRef.current.length)

        if (mounted) {
          console.log('Setting status to ready and showing cover...')
          setStatus('ready')
          setShowCover(true)
          console.log('Status updated to:', 'ready')
        } else {
          console.log('Component unmounted, not updating status')
        }
      } catch (error) {
        console.error('Failed to initialize Storytelling:', error)
        console.error('Error details:', error)
        if (mounted) {
          setStatus('error')
        }
      }
    }

    initMap()

    return () => {
      mounted = false;
      clearMarkers()
    }
  }, []) // Run once on mount

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || chapters.length === 0) return

    const timer = setTimeout(() => {
      const nextIndex = (currentChapterIndex + 1) % chapters.length
      goToChapter(nextIndex)
      
      // Stop at the end if not looping
      if (nextIndex === 0) {
        setIsPlaying(false)
      }
    }, (currentChapter?.duration || 10) * 1000)

    return () => clearTimeout(timer)
  }, [isPlaying, currentChapterIndex, chapters.length, currentChapter, goToChapter])

  const handleStart = () => {
    setShowCover(false)
    goToChapter(0)
    if (config.autoPlay) {
      setIsPlaying(true)
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
    setIsPlaying(!isPlaying)
  }

  if (status === 'error') {
    return (
      <div className="storytelling__container">
        <div className="storytelling__overlay">
          Failed to load the storytelling experience. Please try again.
        </div>
      </div>
    )
  }

  return (
    <>
      {showCover && itinerary && status === 'ready' && (
        <div className="storytelling__cover">
          <div className="storytelling__cover-content">
            <h1 className="storytelling__cover-title">{itinerary.title}</h1>
            {itinerary.description && (
              <p className="storytelling__cover-description">{itinerary.description}</p>
            )}
            <button className="storytelling__cover-button" onClick={handleStart}>
              Start Journey
            </button>
          </div>
        </div>
      )}
      
      <div className={`storytelling__container ${config.theme === 'light' ? 'storytelling__container--light' : ''} ${showCover ? 'storytelling__container--hidden' : ''}`}>
        <div ref={mapContainerRef} className="storytelling__map">
          {/* Map renders here */}
        </div>

        {status === 'loading' && (
          <div className="storytelling__overlay">Loading experience...</div>
        )}

      {currentChapter && (
        <div className="storytelling__panel">
          <div className="storytelling__chapter">
            <div className="storytelling__chapter-number">Chapter {currentChapterIndex + 1}</div>
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
                disabled={chapters.length === 0}
              >
                ← Previous
              </button>
              
              <button 
                className="storytelling__control-btn storytelling__control-btn--play"
                onClick={togglePlay}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <button 
                className="storytelling__control-btn"
                onClick={handleNext}
                disabled={chapters.length === 0}
              >
                Next →
              </button>
            </div>
          )}

          {config.showTimeline && (
            <div className="storytelling__timeline">
              {chapters.map((_, index) => (
                <button
                  key={index}
                  className={`storytelling__timeline-dot ${
                    index === currentChapterIndex ? 'storytelling__timeline-dot--active' : ''
                  }`}
                  onClick={() => goToChapter(index)}
                  title={chapters[index].title}
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
