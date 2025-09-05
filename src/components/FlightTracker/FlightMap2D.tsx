'use client'

import React, { useEffect, useRef } from 'react'
import { FlightMapProps } from './types'
import { gsap } from 'gsap'
import dynamic from 'next/dynamic'

// Dynamic import of Mapbox component - simplified loading
const MapComponent = dynamic(
  () => import('./MapboxMap').then((mod) => mod.default || mod.MapboxMap || mod), 
  { 
    ssr: false,
    loading: () => null // Remove loading spinner to prevent delays
  }
)

export const FlightMap2D: React.FC<FlightMapProps> = (props) => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Simple container animation without delays
  useEffect(() => {
    if (containerRef.current) {
      const tween = gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      )
      
      return () => {
        tween.kill()
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="flight-tracker__map-container" style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      background: '#1a1a1a',
      isolation: 'isolate'
    }}>
      <MapComponent {...props} />
    </div>
  )
}

export default FlightMap2D