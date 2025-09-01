'use client'

import React, { useRef, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import ThreeGlobe from 'three-globe'
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

interface TravelDataGlobeNativeProps {
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

const TravelDataGlobeNative = forwardRef<GlobeMethods | undefined, TravelDataGlobeNativeProps>(({
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
  const globeRef = useRef<ThreeGlobe | null>(null)
  const groupRef = useRef<THREE.Group>(null)
  const { requestRender } = useCanvas()
  const animation = useAnimation()
  const scrollProgress = useRef(0)
  const [globeReady, setGlobeReady] = useState(false)
  const { camera, raycaster, pointer, scene } = useThree()
  const [isPaused, setIsPaused] = useState(false)
  
  // Initialize globe
  useEffect(() => {
    const globe = new ThreeGlobe()
      .globeImageUrl(globeImageUrl)
      .bumpImageUrl(bumpImageUrl)
      .showAtmosphere(true)
      .atmosphereColor(atmosphereColor)
      .atmosphereAltitude(atmosphereAltitude)
    
    globeRef.current = globe
    
    if (groupRef.current) {
      groupRef.current.add(globe)
    }
    
    setGlobeReady(true)
    
    return () => {
      if (groupRef.current && globe) {
        groupRef.current.remove(globe)
      }
    }
  }, [globeImageUrl, bumpImageUrl, atmosphereColor, atmosphereAltitude])
  
  // Update polygons
  useEffect(() => {
    if (!globeRef.current || !globeReady) return
    
    const globe = globeRef.current
    
    if (currentView === 'airports' || currentView === 'michelinRestaurants') {
      globe.polygonsData([])
    } else {
      globe
        .polygonsData(polygons)
        .polygonGeoJsonGeometry((d: unknown) => {
          const data = d as PolygonData
          return data.geometry || data
        })
        .polygonCapColor((d: unknown) => {
          const poly = d as PolygonData
          if (hoveredCountry && poly.properties.name === hoveredCountry) {
            return '#ffffff'
          }
          if (selectedCountry && poly.properties.name === selectedCountry) {
            return '#ffff00'
          }
          return 'level' in poly ? LEVEL_COLOR[poly.level] : VISA_COLOR[poly.requirement]
        })
        .polygonSideColor(() => 'rgba(0,0,0,0)')
        .polygonStrokeColor(() => '#111')
        .polygonAltitude(0.01)
    }
    
    requestRender()
  }, [polygons, currentView, hoveredCountry, selectedCountry, globeReady, requestRender])
  
  // Update borders
  useEffect(() => {
    if (!globeRef.current || !globeReady || !borders) return
    
    const globe = globeRef.current
    
    // Convert borders to path segments
    let coordinates: number[][][] = []
    if (borders.geometry.type === 'Polygon') {
      coordinates = borders.geometry.coordinates
    } else if (borders.geometry.type === 'MultiPolygon') {
      coordinates = borders.geometry.coordinates.flat()
    }
    
    const borderSegments = coordinates.map((line) => ({
      coords: line.map(([lng, lat]) => ({ lat, lng })),
    }))
    
    globe
      .pathsData(borderSegments)
      .pathPoints('coords')
      .pathPointLat((d: any) => d.lat)
      .pathPointLng((d: any) => d.lng)
      .pathColor(() => 'rgba(255,255,255,0.35)')
      .pathStroke(() => 0.2)
    
    requestRender()
  }, [borders, globeReady, requestRender])
  
  // Update arcs
  useEffect(() => {
    if (!globeRef.current || !globeReady) return
    
    const globe = globeRef.current
    
    if (currentView !== 'visaRequirements' || !visaArcs.length) {
      globe.arcsData([])
      requestRender()
      return
    }
    
    const arcsData = visaArcs
      .filter(visa => visa.requirement === 'visa_free' || visa.requirement === 'visa_on_arrival')
      .map(visa => {
        const sourcePolygon = polygons.find(
          p => p.properties.name.toLowerCase() === visa.passportCountry.toLowerCase()
        )
        const destPolygon = polygons.find(
          p => p.properties.name.toLowerCase() === visa.destinationCountry.toLowerCase()
        )
        
        if (!sourcePolygon || !destPolygon) return null
        
        try {
          const startCentroid = centroid(sourcePolygon)
          const endCentroid = centroid(destPolygon)
          const [startLng, startLat] = startCentroid.geometry.coordinates
          const [endLng, endLat] = endCentroid.geometry.coordinates
          
          return {
            startLat,
            startLng,
            endLat,
            endLng,
            color: VISA_COLOR[visa.requirement],
          }
        } catch (e) {
          console.warn(`Failed to calculate centroid`, e)
          return null
        }
      })
      .filter(Boolean)
    
    globe
      .arcsData(arcsData)
      .arcStartLat('startLat')
      .arcStartLng('startLng')
      .arcEndLat('endLat')
      .arcEndLng('endLng')
      .arcColor('color')
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(1500)
      .arcStroke(0.5)
      .arcAltitudeAutoScale(0.3)
    
    requestRender()
  }, [currentView, visaArcs, polygons, globeReady, requestRender])
  
  // Update points
  useEffect(() => {
    if (!globeRef.current || !globeReady) return
    
    const globe = globeRef.current
    const pointsData = currentView === 'airports' ? airports : 
                      currentView === 'michelinRestaurants' ? restaurants : []
    
    globe
      .pointsData(pointsData)
      .pointLat((point: any) => point.location.lat)
      .pointLng((point: any) => point.location.lng)
      .pointRadius(0.1)
      .pointAltitude(0.01)
      .pointColor((point: any) => {
        if (currentView === 'airports') return '#00ffff'
        if (currentView === 'michelinRestaurants') {
          const restaurant = point as MichelinRestaurantData
          if (restaurant.rating === 3) return '#FFD700' // Gold for 3 stars
          if (restaurant.rating === 2) return '#C0C0C0' // Silver for 2 stars
          if (restaurant.rating === 1) return '#CD7F32' // Bronze for 1 star
          return '#4CAF50' // Green for others
        }
        return '#ffffff'
      })
    
    requestRender()
  }, [currentView, airports, restaurants, globeReady, requestRender])
  
  // Handle mouse interactions
  useEffect(() => {
    if (!globeRef.current || !globeReady) return
    
    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
      
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObject(globeRef.current as any, true)
      
      if (intersects.length > 0) {
        const coords = globeRef.current.toGeoCoords(intersects[0].point)
        
        // Find hovered polygon
        if (currentView !== 'airports' && currentView !== 'michelinRestaurants') {
          const hoveredPoly = polygons.find(poly => {
            // Simple point-in-polygon check (this is a simplified version)
            // You might want to use a proper point-in-polygon algorithm
            return poly.properties.name // Placeholder
          })
          
          if (hoveredPoly) {
            onCountryHover(hoveredPoly.properties.name)
          } else {
            onCountryHover(null)
          }
        }
      } else {
        onCountryHover(null)
      }
    }
    
    const handleClick = (event: MouseEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
      
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObject(globeRef.current as any, true)
      
      if (intersects.length > 0) {
        const coords = globeRef.current.toGeoCoords(intersects[0].point)
        
        if (currentView === 'airports') {
          const clickedAirport = airports.find(a => 
            Math.abs(a.location.lat - coords.lat) < 1 && 
            Math.abs(a.location.lng - coords.lng) < 1
          )
          if (clickedAirport) onAirportClick(clickedAirport)
        } else if (currentView === 'michelinRestaurants') {
          const clickedRestaurant = restaurants.find(r => 
            Math.abs(r.location.lat - coords.lat) < 1 && 
            Math.abs(r.location.lng - coords.lng) < 1
          )
          if (clickedRestaurant) onRestaurantClick(clickedRestaurant)
        } else {
          // Simplified - you'd need proper point-in-polygon check
          const clickedPoly = polygons.find(poly => poly.properties.name)
          if (clickedPoly) onCountryClick(clickedPoly.properties.name)
        }
      }
    }
    
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('click', handleClick)
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('click', handleClick)
    }
  }, [polygons, airports, restaurants, currentView, camera, raycaster, pointer, 
      onCountryClick, onAirportClick, onRestaurantClick, onCountryHover, globeReady])
  
  // Expose globe methods to parent
  useImperativeHandle(ref, () => ({
    pauseAnimation: () => setIsPaused(true),
    resumeAnimation: () => setIsPaused(false),
    setPointOfView: (coords) => {
      if (globeRef.current) {
        const { x, y, z } = globeRef.current.getCoords(coords.lat, coords.lng, coords.altitude || 2)
        camera.position.set(x, y, z)
        camera.lookAt(0, 0, 0)
      }
    },
    getGlobeRadius: () => globeRef.current?.getGlobeRadius() || 100,
    getCoords: (lat, lng, altitude) => 
      globeRef.current?.getCoords(lat, lng, altitude) || { x: 0, y: 0, z: 0 },
    toGeoCoords: (coords) => 
      globeRef.current?.toGeoCoords(coords) || { lat: 0, lng: 0, altitude: 0 },
  }), [camera])
  
  // Set up scroll animations with GSAP
  useGSAP((_context) => {
    if (!groupRef.current) return
    
    const { ScrollTrigger, gsap } = animation
    
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
    if (groupRef.current && autoRotateSpeed && !selectedCountry && !isPaused) {
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
  
  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 100, 100]} intensity={0.8} />
      <directionalLight position={[-100, -100, -100]} intensity={0.3} />
    </group>
  )
})

TravelDataGlobeNative.displayName = 'TravelDataGlobeNative'

export default TravelDataGlobeNative