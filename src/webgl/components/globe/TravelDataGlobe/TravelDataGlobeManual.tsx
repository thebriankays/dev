'use client'

import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Atmosphere } from './Atmosphere'
import { Markers } from './Markers'
import { Arcs } from './Arcs'
import { latLngToVector3, vector3ToLatLng } from './utils'
import type {
  PolyAdv,
  VisaPolygon,
  AirportData,
  CountryBorder,
  VisaData,
  MichelinRestaurantData,
} from '@/blocks/TravelDataGlobeBlock/types'

// Type for polygon data
// type PolygonData = PolyAdv | VisaPolygon

// Export type for globe methods
export interface GlobeMethods {
  pauseAnimation: () => void
  resumeAnimation: () => void
  setPointOfView: (coords: { lat: number; lng: number; altitude?: number }) => void
  getGlobeRadius: () => number
  getCoords: (lat: number, lng: number, altitude?: number) => { x: number; y: number; z: number }
  toGeoCoords: (coords: { x: number; y: number; z: number }) => { lat: number; lng: number; altitude: number }
}

interface TravelDataGlobeManualProps {
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

// Simple camera controls using mouse/touch
function useCameraControls(enabled = true) {
  const { camera } = useThree()
  const spherical = useRef({
    radius: 3,
    theta: 0,
    phi: Math.PI / 2
  })
  const isUserInteracting = useRef(false)
  const onPointerDownMouseX = useRef(0)
  const onPointerDownMouseY = useRef(0)
  const onPointerDownLon = useRef(0)
  const onPointerDownLat = useRef(0)
  
  useEffect(() => {
    if (!enabled) return
    
    const handlePointerDown = (event: PointerEvent) => {
      isUserInteracting.current = true
      onPointerDownMouseX.current = event.clientX
      onPointerDownMouseY.current = event.clientY
      onPointerDownLon.current = spherical.current.theta
      onPointerDownLat.current = spherical.current.phi
    }
    
    const handlePointerMove = (event: PointerEvent) => {
      if (!isUserInteracting.current) return
      
      const deltaX = (onPointerDownMouseX.current - event.clientX) * 0.01
      const deltaY = (event.clientY - onPointerDownMouseY.current) * 0.01
      
      spherical.current.theta = onPointerDownLon.current + deltaX
      spherical.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, onPointerDownLat.current + deltaY))
    }
    
    const handlePointerUp = () => {
      isUserInteracting.current = false
    }
    
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      spherical.current.radius = Math.max(1.5, Math.min(10, spherical.current.radius + event.deltaY * 0.01))
    }
    
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
      document.removeEventListener('wheel', handleWheel)
    }
  }, [enabled])
  
  useFrame(() => {
    if (!enabled) return
    
    // Convert spherical to cartesian
    const x = spherical.current.radius * Math.sin(spherical.current.phi) * Math.cos(spherical.current.theta)
    const y = spherical.current.radius * Math.cos(spherical.current.phi)
    const z = spherical.current.radius * Math.sin(spherical.current.phi) * Math.sin(spherical.current.theta)
    
    camera.position.set(x, y, z)
    camera.lookAt(0, 0, 0)
  })
}

const TravelDataGlobeManual = forwardRef<GlobeMethods | undefined, TravelDataGlobeManualProps>(({
  polygons: _polygons,
  borders: _borders,
  airports,
  restaurants,
  globeImageUrl,
  bumpImageUrl,
  autoRotateSpeed,
  atmosphereColor,
  atmosphereAltitude: _atmosphereAltitude,
  onCountryClick: _onCountryClick,
  onAirportClick: _onAirportClick,
  onRestaurantClick: _onRestaurantClick,
  onCountryHover: _onCountryHover,
  selectedCountry,
  hoveredCountry: _hoveredCountry,
  currentView,
  visaArcs,
  showMarkers: _showMarkers,
}, ref) => {
  const globeRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const animationPaused = useRef(false)
  const globeRadius = 1
  
  // Load textures
  const colorMap = useMemo(() => {
    const loader = new THREE.TextureLoader()
    return loader.load(globeImageUrl)
  }, [globeImageUrl])
  
  const bumpMap = useMemo(() => {
    const loader = new THREE.TextureLoader()
    return loader.load(bumpImageUrl)
  }, [bumpImageUrl])
  
  // Expose methods
  useImperativeHandle(ref, () => ({
    pauseAnimation: () => { animationPaused.current = true },
    resumeAnimation: () => { animationPaused.current = false },
    setPointOfView: (coords) => {
      const pos = latLngToVector3(coords.lat, coords.lng, coords.altitude || 3)
      camera.position.copy(pos)
      camera.lookAt(0, 0, 0)
    },
    getGlobeRadius: () => globeRadius,
    getCoords: (lat, lng, altitude = 0) => {
      const vec = latLngToVector3(lat, lng, globeRadius + altitude)
      return { x: vec.x, y: vec.y, z: vec.z }
    },
    toGeoCoords: (coords) => {
      const vec = new THREE.Vector3(coords.x, coords.y, coords.z)
      return vector3ToLatLng(vec)
    },
  }), [camera])
  
  // Auto rotation
  useFrame((state, delta) => {
    if (groupRef.current && autoRotateSpeed && !animationPaused.current && !selectedCountry) {
      groupRef.current.rotation.y += autoRotateSpeed * delta * 0.1
    }
  })
  
  // Enable camera controls
  useCameraControls(!selectedCountry)
  
  // Convert data for components
  const markerData = useMemo(() => {
    if (currentView === 'airports') {
      return airports.map(airport => ({
        lat: airport.location.lat,
        lng: airport.location.lng,
        label: airport.name,
        color: '#00ffff',
        size: 0.01
      }))
    } else if (currentView === 'michelinRestaurants') {
      return restaurants.map(restaurant => ({
        lat: restaurant.location.lat,
        lng: restaurant.location.lng,
        label: restaurant.name,
        color: restaurant.rating === 3 ? '#FFD700' : 
               restaurant.rating === 2 ? '#C0C0C0' : 
               restaurant.rating === 1 ? '#CD7F32' : '#4CAF50',
        size: 0.01
      }))
    }
    return []
  }, [currentView, airports, restaurants])
  
  const arcData = useMemo(() => {
    if (currentView !== 'visaRequirements' || !visaArcs.length) return []
    
    return visaArcs
      .filter(visa => visa.requirement === 'visa_free' || visa.requirement === 'visa_on_arrival')
      .map(visa => ({
        startLat: 0, // You'll need to resolve these from country names
        startLng: 0,
        endLat: 0,
        endLng: 0,
        color: visa.requirement === 'visa_free' ? '#4caf50' : '#8bc34a',
        altitude: 0.15
      }))
  }, [currentView, visaArcs])
  
  return (
    <group ref={groupRef}>
      {/* Globe sphere */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[globeRadius, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.005}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      
      {/* Atmosphere */}
      <Atmosphere
        radius={globeRadius}
        color={atmosphereColor}
        intensity={0.15}
      />
      
      {/* Markers */}
      {markerData.length > 0 && (
        <Markers
          data={markerData}
          radius={globeRadius}
          showLabels={true}
        />
      )}
      
      {/* Arcs */}
      {arcData.length > 0 && (
        <Arcs
          data={arcData}
          radius={globeRadius}
        />
      )}
      
      {/* Lights */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} />
    </group>
  )
})

TravelDataGlobeManual.displayName = 'TravelDataGlobeManual'

export default TravelDataGlobeManual