'use client'

import React, { useRef, useMemo, useEffect, forwardRef, useImperativeHandle, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Atmosphere } from './Atmosphere'
import { Markers } from './Markers'
import { Arcs } from './Arcs'
import { Clouds } from './Clouds'
import { Countries } from './Countries'
import { latLngToVector3, vector3ToLatLng, getCentroid } from './utils'
import type {
  PolyAdv,
  VisaPolygon,
  AirportData,
  CountryBorder,
  VisaData,
  MichelinRestaurantData,
} from '@/blocks/TravelDataGlobeBlock/types'

// Export type for globe methods
export interface GlobeMethods {
  pauseAnimation: () => void
  resumeAnimation: () => void
  setPointOfView: (coords: { lat: number; lng: number; altitude?: number }) => void
  getGlobeRadius: () => number
  getCoords: (lat: number, lng: number, altitude?: number) => { x: number; y: number; z: number }
  toGeoCoords: (coords: { x: number; y: number; z: number }) => { lat: number; lng: number; altitude: number }
  focusOnLocation: (polygon: { geometry?: { type: string; coordinates: any } }) => void
}

interface TravelDataGlobeManualProps {
  polygons: Array<PolyAdv | VisaPolygon>
  _borders: CountryBorder
  airports: AirportData[]
  restaurants: MichelinRestaurantData[]
  
  globeImageUrl: string
  bumpImageUrl: string
  
  autoRotateSpeed: number
  atmosphereColor: string
  
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

// Camera controller component
function CameraController({ 
  targetPosition, 
  enabled = true 
}: { 
  targetPosition?: THREE.Vector3 | null, 
  enabled?: boolean 
}) {
  const { camera } = useThree()
  const spherical = useRef({
    radius: 2,  // Changed from 2.5 to 2
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
      spherical.current.radius = Math.max(1.2, Math.min(3, spherical.current.radius + event.deltaY * 0.002))
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
    
    // Smoothly transition to target position if set
    if (targetPosition) {
      camera.position.lerp(targetPosition, 0.05)
      camera.lookAt(0, 0, 0)
    } else {
      // Convert spherical to cartesian
      const x = spherical.current.radius * Math.sin(spherical.current.phi) * Math.cos(spherical.current.theta)
      const y = spherical.current.radius * Math.cos(spherical.current.phi)
      const z = spherical.current.radius * Math.sin(spherical.current.phi) * Math.sin(spherical.current.theta)
      
      camera.position.set(x, y, z)
      camera.lookAt(0, 0, 0)
    }
  })
  
  return null
}

const TravelDataGlobeManualComponent = forwardRef<GlobeMethods | undefined, TravelDataGlobeManualProps>(({
  polygons,
  _borders,
  airports,
  restaurants,
  globeImageUrl,
  bumpImageUrl,
  autoRotateSpeed,
  atmosphereColor,
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
  const globeRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const animationPaused = useRef(false)
  const [targetCameraPosition, setTargetCameraPosition] = useState<THREE.Vector3 | null>(null)
  const globeRadius = 1.2  // Increased from 1
  
  // Load textures
  const [textures, setTextures] = useState<Record<string, THREE.Texture | null>>({
    colorMap: null,
    bumpMap: null,
    cloudsMap: null,
    specularMap: null,
  })
  
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    const loadedTextures: Record<string, THREE.Texture | null> = {
      colorMap: null,
      bumpMap: null,
      cloudsMap: null,
      specularMap: null,
    }
    
    // Load main globe texture
    loader.load(
      globeImageUrl,
      (texture) => {
        console.log('Globe texture loaded successfully')
        loadedTextures.colorMap = texture
        setTextures(prev => ({ ...prev, colorMap: texture }))
      },
      undefined,
      (error) => {
        console.error('Failed to load globe texture:', error)
      }
    )
    
    // Load bump map
    loader.load(
      bumpImageUrl,
      (texture) => {
        console.log('Bump map loaded successfully')
        loadedTextures.bumpMap = texture
        setTextures(prev => ({ ...prev, bumpMap: texture }))
      },
      undefined,
      (error) => {
        console.error('Failed to load bump map:', error)
      }
    )
    
    // Load clouds texture if available
    loader.load(
      '/clouds.png',
      (texture) => {
        setTextures(prev => ({ ...prev, cloudsMap: texture }))
      },
      undefined,
      () => {
        console.log('Clouds texture not available')
      }
    )
    
    // Load specular map if available  
    loader.load(
      '/earth-lights.jpg',
      (texture) => {
        setTextures(prev => ({ ...prev, specularMap: texture }))
      },
      undefined,
      () => {
        console.log('Specular map not available')
      }
    )
  }, [globeImageUrl, bumpImageUrl])
  
  // Expose methods
  useImperativeHandle(ref, () => ({
    pauseAnimation: () => { 
      animationPaused.current = true 
    },
    resumeAnimation: () => { 
      animationPaused.current = false 
    },
    setPointOfView: (coords) => {
      const pos = latLngToVector3(coords.lat, coords.lng, coords.altitude || 2.5)
      setTargetCameraPosition(pos)
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
    focusOnLocation: (polygon) => {
      if (!polygon || !polygon.geometry) return
      
      // Get centroid of the polygon
      const centroid = getCentroid(polygon)
      if (!centroid) return
      
      const [lng, lat] = centroid
      
      // Animate to position
      animationPaused.current = true
      const pos = latLngToVector3(lat, lng, 1.8)
      setTargetCameraPosition(pos)
      
      // Resume rotation after animation
      setTimeout(() => {
        animationPaused.current = false
      }, 2000)
    }
  }), [])
  
  // Auto rotation
  useFrame((state, delta) => {
    if (groupRef.current && autoRotateSpeed && !animationPaused.current && !selectedCountry) {
      groupRef.current.rotation.y += autoRotateSpeed * delta * 0.1
    }
    
    // Rotate clouds slightly slower
    if (cloudsRef.current && autoRotateSpeed && !animationPaused.current) {
      cloudsRef.current.rotation.y += autoRotateSpeed * delta * 0.05
    }
  })
  
  // Convert data for components
  const markerData = useMemo(() => {
    if (currentView === 'airports' && showMarkers) {
      return airports.map(airport => ({
        id: airport.code,
        lat: airport.location.lat,
        lng: airport.location.lng,
        label: airport.name,
        data: airport,
        color: '#00bcd4',
        size: 0.015,
        type: 'airport' as const
      }))
    } else if (currentView === 'michelinRestaurants' && showMarkers) {
      return restaurants.map(restaurant => ({
        id: restaurant.id,
        lat: restaurant.location.lat,
        lng: restaurant.location.lng,
        label: restaurant.name,
        data: restaurant,
        color: restaurant.rating === 3 ? '#FFD700' : 
               restaurant.rating === 2 ? '#FFC0CB' : '#B8860B',
        size: 0.01 + (restaurant.rating * 0.003),
        type: 'restaurant' as const
      }))
    }
    return []
  }, [currentView, airports, restaurants, showMarkers])
  
  // Prepare arc data for visa requirements
  const arcData = useMemo(() => {
    if (currentView !== 'visaRequirements' || !visaArcs.length) return []
    
    // You would need to resolve country coordinates here
    // This is a simplified version
    return visaArcs
      .filter(visa => visa.requirement === 'visa_free' || visa.requirement === 'visa_on_arrival')
      .slice(0, 50) // Limit for performance
      .map(visa => ({
        startLat: 0, // Need to resolve from passport country
        startLng: 0,
        endLat: 0, // Need to resolve from destination country
        endLng: 0,
        color: visa.requirement === 'visa_free' ? '#4caf50' : '#8bc34a',
        altitude: 0.15
      }))
      .filter(arc => arc.startLat !== 0 && arc.endLat !== 0)
  }, [currentView, visaArcs])
  
  // Get polygon colors based on view
  const getPolygonColor = useMemo(() => {
    return (poly: PolyAdv | VisaPolygon) => {
      // Highlight hovered country
      if (hoveredCountry && poly.properties.name === hoveredCountry) {
        return '#ffffff'
      }
      // Highlight selected country
      if (selectedCountry && poly.properties.name === selectedCountry) {
        return '#ffeb3b'
      }
      
      // Color based on view type
      if (currentView === 'travelAdvisory' && 'level' in poly) {
        const levelColors: Record<number, string> = {
          1: '#4caf50',
          2: '#ffb300',
          3: '#f4511e',
          4: '#b71c1c'
        }
        return levelColors[poly.level] || '#666666'
      } else if (currentView === 'visaRequirements' && 'requirement' in poly) {
        const visaColors: Record<string, string> = {
          visa_free: '#4caf50',
          visa_on_arrival: '#8bc34a',
          e_visa: '#03a9f4',
          eta: '#00bcd4',
          visa_required: '#f4511e',
          no_admission: '#b71c1c'
        }
        return visaColors[poly.requirement] || '#666666'
      }
      
      return '#333333'
    }
  }, [hoveredCountry, selectedCountry, currentView])
  
  // Set initial camera position
  useEffect(() => {
    if (camera) {
      camera.position.set(0, 0, 2.5)  // Adjusted for proper view
      camera.lookAt(0, 0, 0)
      // Ensure camera updates
      camera.updateProjectionMatrix()
    }
  }, [camera])

  return (
    <>
      {/* Camera Controller */}
      <CameraController 
        targetPosition={targetCameraPosition} 
        enabled={!selectedCountry}
      />
      
      {/* Ambient lighting - reduced for testing */}
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={0.3} castShadow />
      <directionalLight position={[-5, -3, -5]} intensity={0.1} />
      
      <group ref={groupRef}>
        {/* Main Globe */}
        <mesh ref={globeRef} castShadow receiveShadow>
          <sphereGeometry args={[globeRadius, 64, 64]} />
          {textures.colorMap ? (
            <meshPhongMaterial
              map={textures.colorMap}
              bumpMap={textures.bumpMap}
              bumpScale={0.005}
              specularMap={textures.specularMap}
              specular={new THREE.Color('#111111')}
              shininess={3}
              transparent={false}
              emissive={new THREE.Color('#000033')}
              emissiveIntensity={0.05}
            />
          ) : (
            // Fallback material while texture loads
            <meshPhongMaterial
              color={new THREE.Color('#1a4d7f')}
              specular={new THREE.Color('#111111')}
              shininess={3}
              transparent={false}
              emissive={new THREE.Color('#000033')}
              emissiveIntensity={0.05}
            />
          )}
        </mesh>
        
        {/* Clouds Layer - only render if texture is loaded */}
        {textures.cloudsMap && (
          <Clouds 
            ref={cloudsRef}
            radius={globeRadius}
            cloudsMap={textures.cloudsMap}
            opacity={0.6}
          />
        )}
        
        {/* Countries overlay */}
        {(currentView === 'travelAdvisory' || currentView === 'visaRequirements') && (
          <Countries
            polygons={polygons}
            radius={globeRadius}
            getColor={getPolygonColor}
            onCountryClick={onCountryClick}
            onCountryHover={onCountryHover}
          />
        )}
        
        {/* Atmosphere */}
        <Atmosphere
          radius={globeRadius}
          color={atmosphereColor}
          intensity={0.02}
        />
        
        {/* Markers for airports and restaurants */}
        {markerData.length > 0 && (
          <Markers
            data={markerData}
            radius={globeRadius}
            onMarkerClick={(marker) => {
              if (marker.type === 'airport') {
                onAirportClick(marker.data as AirportData)
              } else if (marker.type === 'restaurant') {
                onRestaurantClick(marker.data as MichelinRestaurantData)
              }
            }}
            showLabels={false}
          />
        )}
        
        {/* Arcs for visa connections */}
        {arcData.length > 0 && (
          <Arcs
            data={arcData}
            radius={globeRadius}
          />
        )}
      </group>
    </>
  )
})

TravelDataGlobeManualComponent.displayName = 'TravelDataGlobeManual'

const TravelDataGlobeManual = TravelDataGlobeManualComponent
export default TravelDataGlobeManual
