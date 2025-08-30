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
  const mapInstance = useRef<any>(null) // Map3DElement type
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

  // Go to specific chapter
  const goToChapter = useCallback((index: number) => {
    if (!mapInstance.current) return
    
    setCurrentChapterIndex(index)
    const map = mapInstance.current // Map3DElement
    const chapter = chapters[index]
    const location = chapter.location || chapter.coordinates
    
    if (location) {
      console.log(`Navigating to chapter ${index + 1}: ${chapter.title}`, location)
      
      // Animate camera properties for Map3DElement
      const cameraProps = {
        lat: map.center?.lat || location.lat,
        lng: map.center?.lng || location.lng,
        range: map.range || 1500,
        tilt: map.tilt || 65,
        heading: map.heading || 0
      }
      
      gsap.to(cameraProps, {
        lat: location.lat,
        lng: location.lng,
        range: chapter.camera?.range || 1500,
        tilt: chapter.camera?.tilt || 65,
        heading: chapter.camera?.heading || 0,
        duration: 2,
        ease: 'power2.inOut',
        onUpdate: function() {
          // Update Map3DElement properties during animation
          map.center = {
            lat: cameraProps.lat,
            lng: cameraProps.lng,
            altitude: 0
          }
          map.range = cameraProps.range
          map.tilt = cameraProps.tilt
          map.heading = cameraProps.heading
        },
        onComplete: function() {
          console.log('Animation complete for chapter', index + 1)
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
          version: 'alpha', // Required for Map3DElement
          libraries: ['maps3d'],
          mapIds: mapId ? [mapId] : []
        })

        // Use importLibrary instead of deprecated load() method
        const { Map3DElement } = await loader.importLibrary("maps3d") as any
        console.log('Maps3d library loaded')

        const firstChapter = chapters[0]
        const initialLocation = firstChapter.location || firstChapter.coordinates || { lat: 48.8584, lng: 2.2945 }
        console.log('Initial location:', initialLocation)

        // Create Map3DElement for photorealistic 3D tiles
        console.log('Creating Map3DElement instance...')
        console.log('Using Map ID:', mapId)
        
        const map = new Map3DElement({
          center: {
            lat: initialLocation.lat,
            lng: initialLocation.lng,
            altitude: 0
          },
          range: 1500,
          tilt: firstChapter.camera?.tilt || 65,
          heading: firstChapter.camera?.heading || 0,
          mapId: mapId || '',
        })
        
        // Listen for initialization errors
        map.addEventListener('gmp-error', (event: any) => {
          const { code, message } = event.detail || {}
          console.error(`Map3DElement error: [${code}] ${message}`)
          console.error('Make sure your Map ID is created with:')
          console.error('1. Map Type: Vector')
          console.error('2. Tilt checkbox: Enabled')
          console.error('3. Rotation checkbox: Enabled')
          setStatus('error')
        })
        
        // Set explicit dimensions
        map.style.width = '100%'
        map.style.height = '100%'
        map.style.display = 'block'
        map.style.position = 'absolute'
        
        // Append to container
        mapContainerRef.current.appendChild(map)

        mapInstance.current = map
        console.log('Map created successfully:', map)
        
        // Note: Standard Maps API with 3D vector buildings
        // Map3DElement didn't work even with demo Map ID
        // This provides 3D buildings but not photorealistic tiles

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
      // Clean up Map3DElement
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = ''
      }
      mapInstance.current = null
    }
  }, []) // Run once on mount

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || chapters.length === 0) {
      console.log('Auto-play stopped:', { isPlaying, chaptersLength: chapters.length })
      return
    }
    
    console.log('Auto-play active, scheduling next chapter...')
    const timer = setTimeout(() => {
      const nextIndex = (currentChapterIndex + 1) % chapters.length
      console.log(`Auto-advancing from chapter ${currentChapterIndex + 1} to ${nextIndex + 1}`)
      goToChapter(nextIndex)
      
      // Stop at the end if not looping
      if (nextIndex === 0) {
        console.log('Reached end, stopping auto-play')
        setIsPlaying(false)
      }
    }, (currentChapter?.duration || 10) * 1000)

    return () => {
      console.log('Clearing auto-play timer')
      clearTimeout(timer)
    }
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
    console.log('Toggle play clicked, current state:', isPlaying)
    if (!isPlaying) {
      // Start playing - immediately advance to trigger animation
      setIsPlaying(true)
      // If at the last chapter, restart from beginning
      if (currentChapterIndex === chapters.length - 1) {
        goToChapter(0)
      } else {
        // Otherwise advance to next chapter immediately
        goToChapter(currentChapterIndex + 1)
      }
    } else {
      // Stop playing
      setIsPlaying(false)
    }
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
      
      <div className={`storytelling__container ${config.theme === 'light' ? 'storytelling__container--light' : ''}`}>
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
              
              {/* Debug button to test direct navigation */}
              <button 
                className="storytelling__control-btn"
                onClick={() => goToChapter(1)}
                style={{ marginLeft: '10px', background: '#4CAF50' }}
              >
                Go to Ch.2 (Test)
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
