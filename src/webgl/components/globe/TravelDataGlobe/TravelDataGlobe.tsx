'use client'

// IMPORTANT: Import setup before anything else to extend THREE namespace
import './setup-r3f-globe'

import React, { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { TravelDataGlobeWrapper as R3fGlobe } from './TravelDataGlobeWrapper'
import { useGSAP, useAnimation } from '@/providers/Animation'
import { useCanvas } from '@/providers/Canvas'
import centroid from '@turf/centroid'
import type {
  PolyAdv,
  VisaPolygon,
  AirportData,
  CountryBorder,
  VisaRequirementCode,
  VisaData,
  MichelinRestaurantData,
} from '@/blocks/TravelDataGlobeBlock/types'

// Type for polygon data
type PolygonData = PolyAdv | VisaPolygon

// Color maps
const LEVEL_COLOR: Record<1 | 2 | 3 | 4, string> = {
  1: '#4caf50', // green
  2: '#ffb300', // amber
  3: '#f4511e', // deep-orange
  4: '#b71c1c', // red
}

const VISA_COLOR: Record<VisaRequirementCode, string> = {
  visa_free: '#4caf50',
  visa_on_arrival: '#8bc34a',
  e_visa: '#03a9f4',
  eta: '#00bcd4',
  visa_required: '#f4511e',
  no_admission: '#b71c1c',
}

interface TravelDataGlobeProps {
  polygons: Array<PolyAdv | VisaPolygon>
  borders: CountryBorder
  airports: AirportData[]
  restaurants: MichelinRestaurantData[]
  
  globeImageUrl: string
  bumpImageUrl: string
  
  autoRotateSpeed: number
  atmosphereColor: string
  atmosphereAltitude: number
  
  onCountryClick: (name: string) => void
  onAirportClick: (airport: AirportData) => void
  onRestaurantClick: (restaurant: MichelinRestaurantData) => void
  onCountryHover: (name: string | null) => void
  
  selectedCountry: string | null
  hoveredCountry: string | null
  currentView: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  visaArcs: VisaData[]
  showMarkers: boolean
}

// Export type for globe methods
export interface GlobeMethods {
  pauseAnimation: () => void
  resumeAnimation: () => void
  setPointOfView: (coords: { lat: number; lng: number; altitude?: number }) => void
  getGlobeRadius: () => number
  getCoords: (lat: number, lng: number, altitude?: number) => { x: number; y: number; z: number }
  toGeoCoords: (coords: { x: number; y: number; z: number }) => { lat: number; lng: number; altitude: number }
}

const TravelDataGlobe = forwardRef<GlobeMethods | undefined, TravelDataGlobeProps>(({
  polygons,
  borders,
  airports,
  restaurants,
  globeImageUrl,
  bumpImageUrl,
  autoRotateSpeed,
  atmosphereColor,
  atmosphereAltitude,
  onCountryClick,
  onAirportClick,
  onRestaurantClick,
  onCountryHover,
  selectedCountry,
  hoveredCountry,
  currentView,
  visaArcs,
  showMarkers,
}, ref) => {
  // Using any type for r3f-globe ref as it doesn't export proper types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  const { requestRender } = useCanvas()
  const animation = useAnimation()
  const scrollProgress = useRef(0)
  const [globeReady, setGlobeReady] = useState(false)
  const { camera } = useThree()
  
  // Expose globe methods to parent
  useImperativeHandle(ref, () => ({
    pauseAnimation: () => globeRef.current?.pauseAnimation(),
    resumeAnimation: () => globeRef.current?.resumeAnimation(),
    setPointOfView: (coords) => globeRef.current?.setPointOfView(coords),
    getGlobeRadius: () => globeRef.current?.getGlobeRadius() || 100,
    getCoords: (lat, lng, altitude) => globeRef.current?.getCoords(lat, lng, altitude) || { x: 0, y: 0, z: 0 },
    toGeoCoords: (coords) => globeRef.current?.toGeoCoords(coords) || { lat: 0, lng: 0, altitude: 0 },
  }), [])

  // Set up scroll animations with GSAP
  useGSAP((_context) => {
    if (!groupRef.current) return
    
    const { ScrollTrigger, gsap } = animation
    
    // Create scroll-based rotation
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        scrollProgress.current = self.progress
        requestRender()
      },
    })
    
    // Animate globe scale on enter
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0.8, y: 0.8, z: 0.8 },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.5,
        ease: 'power3.out',
        onUpdate: () => requestRender(),
      }
    )
  }, [globeReady])

  // Auto rotation with scroll influence
  useFrame((_state, delta) => {
    if (groupRef.current && autoRotateSpeed && !selectedCountry) {
      const scrollInfluence = scrollProgress.current * Math.PI * 2
      const autoRotation = autoRotateSpeed * delta * 0.1
      
      if (animation.hamo) {
        const targetRotation = groupRef.current.rotation.y + autoRotation + scrollInfluence
        groupRef.current.rotation.y = animation.hamo.lerp(
          groupRef.current.rotation.y,
          targetRotation,
          0.05
        )
      } else {
        groupRef.current.rotation.y += autoRotation
      }
      
      requestRender()
    }
  })

  // Update camera point of view
  useEffect(() => {
    if (globeRef.current && camera) {
      // R3fGlobe needs camera object, not coordinates
      globeRef.current.setPointOfView(camera)
    }
  }, [camera])

  // Get polygon color
  const getPolygonColor = useMemo(
    () => (poly: PolygonData) => {
      if (hoveredCountry && poly.properties.name === hoveredCountry) {
        return '#ffffff'
      }
      if (selectedCountry && poly.properties.name === selectedCountry) {
        return '#ffff00'
      }
      return 'level' in poly ? LEVEL_COLOR[poly.level] : VISA_COLOR[poly.requirement]
    },
    [hoveredCountry, selectedCountry],
  )

  // Convert borders to path segments
  const borderSegments = useMemo(() => {
    if (!borders || !('geometry' in borders)) {
      return []
    }

    // Extract coordinates based on geometry type
    let coordinates: number[][][] = []
    if (borders.geometry.type === 'Polygon') {
      coordinates = borders.geometry.coordinates
    } else if (borders.geometry.type === 'MultiPolygon') {
      coordinates = borders.geometry.coordinates.flat()
    }

    return coordinates.map((line) => ({
      coords: line.map(([lng, lat]) => ({ lat, lng })),
    }))
  }, [borders])

  // Prepare visa arcs data
  const arcsData = useMemo(() => {
    if (currentView !== 'visaRequirements' || !visaArcs.length) return []

    return visaArcs
      .filter(visa => visa.requirement === 'visa_free' || visa.requirement === 'visa_on_arrival')
      .map(visa => {
        const sourcePolygon = polygons.find(
          p => p.properties.name.toLowerCase() === visa.passportCountry.toLowerCase()
        )
        const destPolygon = polygons.find(
          p => p.properties.name.toLowerCase() === visa.destinationCountry.toLowerCase()
        )

        if (!sourcePolygon || !destPolygon) return null

        // Handle centroid calculation
        let startCoords: [number, number]
        let endCoords: [number, number]
        
        try {
          const startCentroid = centroid(sourcePolygon)
          startCoords = startCentroid.geometry.coordinates as [number, number]
        } catch (e) {
          console.warn(`Failed to calculate centroid for ${visa.passportCountry}`, e)
          return null
        }
        
        try {
          const endCentroid = centroid(destPolygon)
          endCoords = endCentroid.geometry.coordinates as [number, number]
        } catch (e) {
          console.warn(`Failed to calculate centroid for ${visa.destinationCountry}`, e)
          return null
        }
        
        const [startLng, startLat] = startCoords
        const [endLng, endLat] = endCoords
        
        // Skip if coordinates seem invalid
        if (Math.abs(startLat) < 1 && Math.abs(startLng) < 1) {
          console.warn(`Invalid coordinates for ${visa.passportCountry}: ${startLat}, ${startLng}`)
          return null
        }
        if (Math.abs(endLat) < 1 && Math.abs(endLng) < 1) {
          console.warn(`Invalid coordinates for ${visa.destinationCountry}: ${endLat}, ${endLng}`)
          return null
        }

        return {
          startLat,
          startLng,
          endLat,
          endLng,
          color: VISA_COLOR[visa.requirement],
        }
      })
      .filter(Boolean) as Array<{
        startLat: number
        startLng: number
        endLat: number
        endLng: number
        color: string
      }>
  }, [currentView, visaArcs, polygons])

  // Prepare markers data for selected country
  const _markersData = useMemo(() => {
    if (!showMarkers || !selectedCountry) return []
    
    const selectedPolygon = polygons.find(p => p.properties.name === selectedCountry)
    if (!selectedPolygon) return []
    
    let coords: [number, number]
    try {
      const cent = centroid(selectedPolygon)
      coords = cent.geometry.coordinates as [number, number]
    } catch (e) {
      console.warn(`Failed to calculate centroid for marker`, e)
      return []
    }
    
    const [lng, lat] = coords
    
    // Skip if coordinates seem invalid
    if (Math.abs(lat) < 1 && Math.abs(lng) < 1) {
      console.warn(`Invalid marker coordinates: ${lat}, ${lng}`)
      return []
    }
    
    return [{ lat, lng, size: 40, color: '#FFFFFF' }]
  }, [showMarkers, selectedCountry, polygons])

  // Points data (airports/restaurants)
  const pointsData = useMemo(() => {
    if (currentView === 'airports') return airports
    if (currentView === 'michelinRestaurants') return restaurants
    return []
  }, [currentView, airports, restaurants])

  // Create marker HTML element
  const _markerHtml = (_d: unknown) => {
    const data = _d as { size: number; color: string }
    const el = document.createElement('div')
    el.style.color = data.color
    el.style.width = `${data.size}px`
    el.style.height = `${data.size}px`
    el.style.cursor = 'pointer'
    el.innerHTML = `
      <svg viewBox="-4 0 36 36" width="${data.size}" height="${data.size}">
        <path fill="${data.color}" stroke="rgba(0,0,0,0.5)" stroke-width="1" d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"/>
        <circle fill="rgba(0,0,0,0.7)" cx="14" cy="14" r="7" />
      </svg>
    `
    return el
  }

  return (
    <group ref={groupRef}>
      <R3fGlobe
        ref={globeRef}
        
        // Globe textures & atmosphere
        globeImageUrl={globeImageUrl}
        bumpImageUrl={bumpImageUrl}
        showAtmosphere={true}
        atmosphereColor={atmosphereColor}
        atmosphereAltitude={atmosphereAltitude}
        
        // Polygons (countries)
        polygonsData={currentView === 'airports' || currentView === 'michelinRestaurants' ? [] : polygons}
        polygonGeoJsonGeometry={(d: unknown) => {
          // The polygon data already contains the full GeoJSON feature
          // r3f-globe expects just the geometry part
          const data = d as PolygonData
          return data.geometry || data
        }}
        polygonCapColor={(d: unknown) => getPolygonColor(d as PolygonData)}
        polygonSideColor={() => 'rgba(0,0,0,0)'}
        polygonStrokeColor={() => '#111'}
        polygonAltitude={0.01}
        
        // Interaction handlers
        onClick={(layer: any, obj: any, _event: any) => {
          if (layer === 'polygon' && obj && currentView !== 'airports' && currentView !== 'michelinRestaurants') {
            onCountryClick((obj as PolygonData).properties?.name)
          } else if (layer === 'point' && obj) {
            if (currentView === 'airports') onAirportClick(obj as AirportData)
            if (currentView === 'michelinRestaurants') onRestaurantClick(obj as MichelinRestaurantData)
          }
        }}
        onHover={(layer: any, obj: any) => {
          if (layer === 'polygon' && obj) {
            onCountryHover((obj as PolygonData).properties?.name)
          } else if (!obj || layer !== 'polygon') {
            onCountryHover(null)
          }
        }}
        
        // Paths (borders)
        pathsData={borderSegments}
        pathPoints="coords"
        pathPointLat="lat"
        pathPointLng="lng"
        pathColor={() => 'rgba(255,255,255,0.35)'}
        pathStroke={() => 0.2}
        
        // Arcs (visa requirements)
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={0.5}
        arcAltitudeAutoScale={0.3}
        
        // Points (airports/restaurants)
        pointsData={pointsData}
        pointLat={(point: any) => (point as { location: { lat: number } }).location.lat}
        pointLng={(point: any) => (point as { location: { lng: number } }).location.lng}
        pointRadius={0.1}
        pointAltitude={0.01}
        pointColor={(point: any) => {
          if (currentView === 'airports') return '#00ffff'
          if (currentView === 'michelinRestaurants') {
            const restaurant = point as MichelinRestaurantData
            if (restaurant.rating === 3) return '#FFD700' // Gold for 3 stars
            if (restaurant.rating === 2) return '#C0C0C0' // Silver for 2 stars
            if (restaurant.rating === 1) return '#CD7F32' // Bronze for 1 star
            return '#4CAF50' // Green for others
          }
          return '#ffffff'
        }}
        
        // CRITICAL: Disable all HTML-related features to prevent R3F errors
        // r3f-globe internally creates HTML elements which conflict with R3F
        // HTML features removed by wrapper
        
        // Callback when globe is ready
        onGlobeReady={() => setGlobeReady(true)}
      />
      
      {/* Additional lights for better visibility */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 100, 100]} intensity={0.8} />
      <directionalLight position={[-100, -100, -100]} intensity={0.3} />
    </group>
  )
})

TravelDataGlobe.displayName = 'TravelDataGlobe'

export default TravelDataGlobe