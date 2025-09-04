'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FlightMapProps } from './types'
import { gsap } from 'gsap'
import dynamic from 'next/dynamic'

// Dynamic import of Mapbox component
const MapComponent = dynamic(
  () => import('./MapboxMap').then((mod) => mod.default || mod.MapboxMap || mod), 
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        <div className="flight-tracker__loading">
          <div className="flight-tracker__loading-spinner" />
          <p>Loading map...</p>
        </div>
      </div>
    )
  }
)

export const FlightMap2D: React.FC<FlightMapProps> = (props) => {
  const [mapReady, setMapReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Animate container on mount
    if (containerRef.current) {
      const tween = gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
      )
      
      // Small delay to ensure proper rendering
      const timer = setTimeout(() => setMapReady(true), 100)
      
      return () => {
        tween.kill()
        clearTimeout(timer)
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
      {mapReady && <MapComponent {...props} />}
    </div>
  )
}

export default FlightMap2D