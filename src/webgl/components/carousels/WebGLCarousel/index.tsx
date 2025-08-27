'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useGSAP } from '@/providers/Animation'
import { useMouse } from '@/providers/MouseFollower'
import { useView } from '@/providers/Canvas'
import { WebGLTunnel } from '@/webgl/components/tunnel'
import { View } from '@react-three/drei'
import { PerspectiveCamera } from '@react-three/drei'
import gsap from 'gsap'
import { CarouselSlide } from './CarouselSlide'
import { CarouselControls } from './CarouselControls'
import { CarouselIndicators } from './CarouselIndicators'
import { useAutoPlay } from './hooks/useAutoPlay'
import { useSwipeGestures } from './hooks/useSwipeGestures'
import type { CarouselSlideData, TransitionEffect } from './types'
import './carousel.scss'

interface WebGLCarouselProps {
  slides: CarouselSlideData[]
  autoPlay?: boolean
  autoPlayInterval?: number
  transitionEffect?: TransitionEffect
  enableSwipe?: boolean
  enableKeyboard?: boolean
  showControls?: boolean
  showIndicators?: boolean
  className?: string
}

export function WebGLCarousel({
  slides,
  autoPlay = true,
  autoPlayInterval = 5000,
  transitionEffect = 'wave',
  enableSwipe = true,
  enableKeyboard = true,
  showControls = true,
  showIndicators = true,
  className = '',
}: WebGLCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const bounds = useView(viewRef)
  const mouse = useMouse()

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentSlide) return

    setIsTransitioning(true)
    
    // Use GSAP for smooth transition timing
    gsap.timeline({
      onComplete: () => {
        setCurrentSlide(index)
        setIsTransitioning(false)
      },
    })
    .to({}, { duration: 1.2, ease: 'power2.inOut' })
  }, [currentSlide, isTransitioning])

  const goToNextSlide = useCallback(() => {
    const nextIndex = (currentSlide + 1) % slides.length
    goToSlide(nextIndex)
  }, [currentSlide, slides.length, goToSlide])

  const goToPreviousSlide = useCallback(() => {
    const prevIndex = (currentSlide - 1 + slides.length) % slides.length
    goToSlide(prevIndex)
  }, [currentSlide, slides.length, goToSlide])

  // Auto-play logic
  useAutoPlay({
    enabled: autoPlay && !isPaused,
    interval: autoPlayInterval,
    onNext: () => goToNextSlide(),
    dependencies: [currentSlide],
  })

  // Swipe gestures
  const swipeHandlers = useSwipeGestures({
    enabled: enableSwipe && !isTransitioning,
    onSwipeLeft: goToNextSlide,
    onSwipeRight: goToPreviousSlide,
  })

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return

      switch (e.key) {
        case 'ArrowLeft':
          goToPreviousSlide()
          break
        case 'ArrowRight':
          goToNextSlide()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboard, isTransitioning, goToPreviousSlide, goToNextSlide])

  // Mouse hover handling
  const handleMouseEnter = () => {
    setIsPaused(true)
    mouse.addState('-carousel-hover')
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
    mouse.removeState('-carousel-hover')
  }

  if (!slides || slides.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`webgl-carousel ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...swipeHandlers}
    >
      {/* HTML Content Layer */}
      <div className="carousel-content">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`carousel-slide-content ${
              index === currentSlide ? 'active' : ''
            }`}
          >
            <div className="slide-overlay">
              <h2 className="slide-title">{slide.title}</h2>
              <p className="slide-description">{slide.description}</p>
              {slide.cta && (
                <button className="slide-cta">{slide.cta.text}</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      {showControls && (
        <CarouselControls
          onPrevious={goToPreviousSlide}
          onNext={goToNextSlide}
          disabled={isTransitioning}
        />
      )}

      {/* Indicators */}
      {showIndicators && (
        <CarouselIndicators
          total={slides.length}
          current={currentSlide}
          onSelect={goToSlide}
        />
      )}

      {/* WebGL View Reference */}
      <div 
        ref={viewRef}
        className="carousel-webgl-view"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* WebGL Content - Rendered via Tunnel */}
      <WebGLTunnel>
        <View track={viewRef as React.RefObject<HTMLElement>}>
          <PerspectiveCamera makeDefault position={[0, 0, 1000]} />
          <group>
            {slides.map((slide, index) => (
              <CarouselSlide
                key={slide.id}
                data={slide}
                index={index}
                currentIndex={currentSlide}
                isTransitioning={isTransitioning}
                transitionEffect={transitionEffect}
              />
            ))}
          </group>
        </View>
      </WebGLTunnel>
    </div>
  )
}