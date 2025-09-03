'use client'

import React, { useRef, useEffect, useCallback, Suspense } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl } from '@react-three/drei'
import gsap from 'gsap'

import { Countries } from './Countries'
import { latLngToVector3 } from './utils'
import type {
  PolyAdv,
  VisaPolygon,
  CountryBorder,
  AirportData,
  MichelinRestaurantData,
} from '@/blocks/TravelDataGlobeBlock/types'

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
  selectedCountryCode: string | null
  hoveredCountry: string | null
  passportCountry: string | null
  currentView: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  visaArcs: Array<{
    startLat: number
    startLng: number
    endLat: number
    endLng: number
    color: string
  }>
  showMarkers: boolean
  focusTarget: { lat: number; lng: number } | null
}

// Simple globe sphere with manual texture loading
function GlobeSphere({ globeImageUrl, bumpImageUrl }: { globeImageUrl: string; bumpImageUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [textureLoaded, setTextureLoaded] = React.useState(false)
  
  useEffect(() => {
    if (!meshRef.current) return
    
    const textureLoader = new THREE.TextureLoader()
    
    // Load main texture
    console.log('Loading globe texture from:', globeImageUrl)
    textureLoader.load(
      globeImageUrl,
      (texture) => {
        console.log('Globe texture loaded successfully')
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = 16
        
        if (meshRef.current) {
          const material = meshRef.current.material as THREE.MeshStandardMaterial
          material.map = texture
          material.needsUpdate = true
          setTextureLoaded(true)
        }
      },
      (progress) => {
        console.log('Loading texture...', progress)
      },
      (error) => {
        console.error('Failed to load globe texture:', error)
      }
    )
    
    // Load bump map
    console.log('Loading bump texture from:', bumpImageUrl)
    textureLoader.load(
      bumpImageUrl,
      (texture) => {
        console.log('Bump texture loaded successfully')
        if (meshRef.current) {
          const material = meshRef.current.material as THREE.MeshStandardMaterial
          material.bumpMap = texture
          material.bumpScale = 0.01
          material.needsUpdate = true
        }
      },
      undefined,
      (error) => {
        console.error('Failed to load bump texture:', error)
      }
    )
  }, [globeImageUrl, bumpImageUrl])

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        color={textureLoaded ? "#ffffff" : "#2a4d6e"}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  )
}

// Simple atmosphere
function Atmosphere() {
  return (
    <mesh scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial 
        color="#4a90e2"
        transparent 
        opacity={0.1}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

function normalizeName(s: string) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function getCentroidFromPoly(poly: PolyAdv | VisaPolygon): { lat: number; lng: number } | null {
  if (!poly?.geometry?.coordinates) return null
  try {
    const coords = poly.geometry.type === 'Polygon' 
      ? poly.geometry.coordinates[0] 
      : poly.geometry.coordinates[0][0]
    let sumLat = 0, sumLng = 0, count = 0
    coords.forEach(([lng, lat]: number[]) => { 
      sumLat += lat
      sumLng += lng
      count++
    })
    return count > 0 ? { lat: sumLat / count, lng: sumLng / count } : null
  } catch { 
    return null 
  }
}

const TravelDataGlobeManual: React.FC<TravelDataGlobeManualProps> = ({
  polygons,
  borders: _borders,
  airports,
  restaurants,
  globeImageUrl,
  bumpImageUrl,
  autoRotateSpeed,
  atmosphereColor: _atmosphereColor,
  atmosphereAltitude: _atmosphereAltitude,
  onCountryClick,
  onAirportClick,
  onRestaurantClick,
  onCountryHover,
  selectedCountry,
  selectedCountryCode,
  hoveredCountry,
  passportCountry: _passportCountry,
  currentView,
  visaArcs: _visaArcs,
  showMarkers,
  focusTarget,
}) => {
  const { camera, gl, scene } = useThree()
  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)

  // CRITICAL: Set transparent background
  useEffect(() => {
    scene.background = null
    gl.setClearColor(0x000000, 0)
  }, [gl, scene])

  // Auto-rotation
  useFrame((_state, delta) => {
    if (groupRef.current && !selectedCountry && !focusTarget && autoRotateSpeed > 0) {
      groupRef.current.rotation.y += delta * autoRotateSpeed * 0.05
    }
  })

  // Camera animation for focus
  const flyToLocation = useCallback((lat: number, lng: number) => {
    const pos = latLngToVector3(lat, lng, 2)
    gsap.to(camera.position, {
      x: pos.x * 2.5,
      y: pos.y * 2.5,
      z: pos.z * 2.5,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(0, 0, 0)
        controlsRef.current?.update()
      },
    })
  }, [camera])

  // Handle focus target changes
  useEffect(() => {
    if (focusTarget) {
      flyToLocation(focusTarget.lat, focusTarget.lng)
    } else if (selectedCountry || selectedCountryCode) {
      const poly = polygons.find((p: PolyAdv | VisaPolygon) => {
        const propsWithIso = p.properties as { name: string; iso_a2?: string }
        const hasIsoA2 = propsWithIso.iso_a2 !== undefined
        return (
          (selectedCountryCode && hasIsoA2 && propsWithIso.iso_a2?.toUpperCase() === selectedCountryCode.toUpperCase()) ||
          (selectedCountry && normalizeName(p.properties?.name) === normalizeName(selectedCountry))
        )
      })
      const cent = poly ? getCentroidFromPoly(poly) : null
      if (cent) flyToLocation(cent.lat, cent.lng)
    } else {
      // Reset camera
      gsap.to(camera.position, {
        x: 0, y: 0, z: 6,
        duration: 1.0,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.lookAt(0, 0, 0)
          controlsRef.current?.update()
        },
      })
    }
  }, [selectedCountry, selectedCountryCode, focusTarget, polygons, camera, flyToLocation])

  // Get color for polygons
  const getPolygonColor = useCallback((poly: PolyAdv | VisaPolygon) => {
    if (selectedCountry && poly.properties?.name === selectedCountry) return '#ffeb3b'
    if (hoveredCountry && poly.properties?.name === hoveredCountry) return '#ffffff'
    
    if ('level' in poly) {
      const colors: Record<number, string> = { 1: '#4caf50', 2: '#ffb300', 3: '#f4511e', 4: '#b71c1c' }
      return colors[poly.level] || '#666'
    }
    
    if ('requirement' in poly) {
      const colors: Record<string, string> = {
        visa_free: '#4caf50',
        visa_on_arrival: '#8bc34a',
        e_visa: '#03a9f4',
        eta: '#00bcd4',
        visa_required: '#f4511e',
        no_admission: '#b71c1c',
        no_data: '#3a3a3a'
      }
      return colors[poly.requirement] || '#666'
    }
    
    return '#666'
  }, [hoveredCountry, selectedCountry])

  return (
    <>
      {/* Bright lighting */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <pointLight position={[-5, -3, -5]} intensity={0.5} />

      <OrbitControlsImpl
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        autoRotate={false}
        enableDamping={true}
        dampingFactor={0.05}
      />

      <group ref={groupRef}>
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[2, 32, 32]} />
            <meshBasicMaterial color="#2a4d6e" wireframe />
          </mesh>
        }>
          <GlobeSphere globeImageUrl={globeImageUrl} bumpImageUrl={bumpImageUrl} />
        </Suspense>
        
        <Atmosphere />

        {(currentView === 'travelAdvisory' || currentView === 'visaRequirements') && (
          <Countries
            polygons={polygons}
            radius={2.01}
            getColor={getPolygonColor}
            onCountryClick={onCountryClick}
            onCountryHover={onCountryHover}
          />
        )}

        {/* Selected country marker */}
        {showMarkers && selectedCountry && (
          (() => {
            const poly = polygons.find(p => p.properties?.name === selectedCountry)
            const cent = poly ? getCentroidFromPoly(poly) : null
            if (!cent) return null
            const position = latLngToVector3(cent.lat, cent.lng, 2.05)
            
            return (
              <mesh position={position}>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshBasicMaterial color="white" />
              </mesh>
            )
          })()
        )}

        {/* Airport markers */}
        {currentView === 'airports' && airports.map((airport, i) => {
          const position = latLngToVector3(airport.location.lat, airport.location.lng, 2.02)
          return (
            <mesh 
              key={i} 
              position={position} 
              onClick={(e) => { 
                e.stopPropagation()
                onAirportClick(airport) 
              }}
            >
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshBasicMaterial color="#00ffff" />
            </mesh>
          )
        })}

        {/* Restaurant markers */}
        {currentView === 'michelinRestaurants' && restaurants.map((restaurant, i) => {
          const position = latLngToVector3(restaurant.location.lat, restaurant.location.lng, 2.02)
          const color = restaurant.greenStar ? '#4caf50' : '#ffd700'
          return (
            <mesh 
              key={i} 
              position={position} 
              onClick={(e) => { 
                e.stopPropagation()
                onRestaurantClick(restaurant) 
              }}
            >
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshBasicMaterial color={color} />
            </mesh>
          )
        })}
      </group>
    </>
  )
}

export default TravelDataGlobeManual