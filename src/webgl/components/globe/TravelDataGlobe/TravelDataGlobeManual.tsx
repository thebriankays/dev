'use client'

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl } from '@react-three/drei'
import gsap from 'gsap'

import { Countries } from './Countries'
import { Arcs } from './Arcs'
import { Markers } from './Markers'
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

// Earth sphere with proper lighting and texture
function GlobeSphere({ globeImageUrl, bumpImageUrl }: { globeImageUrl: string; bumpImageUrl: string }) {
  const [textures, setTextures] = useState<{ earth?: THREE.Texture; bump?: THREE.Texture }>({})

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    
    Promise.all([
      new Promise<THREE.Texture>((resolve, _reject) => {
        loader.load(globeImageUrl, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          texture.anisotropy = 16
          resolve(texture)
        }, undefined, () => resolve(undefined as unknown as THREE.Texture))
      }),
      new Promise<THREE.Texture>((resolve) => {
        loader.load(bumpImageUrl, (texture) => {
          texture.anisotropy = 16
          resolve(texture)
        }, undefined, () => resolve(undefined as unknown as THREE.Texture))
      })
    ]).then(([earth, bump]) => {
      setTextures({ earth, bump })
    })
  }, [globeImageUrl, bumpImageUrl])

  if (!textures.earth) {
    return (
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color="#1a2332" roughness={0.8} metalness={0.2} />
      </mesh>
    )
  }

  return (
    <mesh>
      <sphereGeometry args={[2, 128, 128]} />
      <meshStandardMaterial
        map={textures.earth}
        bumpMap={textures.bump}
        bumpScale={0.01}
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  )
}

// Subtle atmosphere effect
function Atmosphere({ color = '#4FC3F7', altitude = 0.05 }: { color?: string; altitude?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  return (
    <mesh ref={meshRef} scale={[1 + altitude, 1 + altitude, 1 + altitude]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={0.05} 
        side={THREE.BackSide}
        depthWrite={false}
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
  atmosphereColor,
  atmosphereAltitude,
  onCountryClick,
  onAirportClick,
  onRestaurantClick,
  onCountryHover,
  selectedCountry,
  selectedCountryCode,
  hoveredCountry,
  passportCountry: _passportCountry,
  currentView,
  visaArcs,
  showMarkers,
  focusTarget,
}) => {
  const { camera, gl, scene } = useThree()
  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Ensure transparent background
  useEffect(() => {
    scene.background = null
    gl.setClearColor(0x000000, 0)
  }, [gl, scene])

  // Auto-rotation
  useFrame((_state, delta) => {
    if (groupRef.current && !selectedCountry && !focusTarget && autoRotateSpeed > 0) {
      groupRef.current.rotation.y += delta * autoRotateSpeed * 0.1
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
        // Type guard to check if iso_a2 exists
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
        x: 0, y: 0, z: 5,
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

  // Marker data for different views
  const markersData = useMemo(() => {
    if (currentView === 'airports') {
      return airports.map(a => ({
        id: `airport-${a.code}`,
        lat: a.location.lat,
        lng: a.location.lng,
        color: '#00ffff',
        size: 0.015,
        data: a,
        type: 'airport' as const,
        label: a.name
      }))
    }
    
    if (currentView === 'michelinRestaurants') {
      return restaurants.map(r => ({
        id: `rest-${r.id}`,
        lat: r.location.lat,
        lng: r.location.lng,
        color: r.greenStar ? '#4caf50' : '#ffd700',
        size: 0.015,
        data: r,
        type: 'restaurant' as const,
        label: r.name
      }))
    }
    
    if ((currentView === 'travelAdvisory' || currentView === 'visaRequirements') && selectedCountry) {
      const poly = polygons.find(p => p.properties?.name === selectedCountry)
      const cent = poly ? getCentroidFromPoly(poly) : null
      if (cent) {
        return [{
          id: 'selected-country',
          lat: cent.lat,
          lng: cent.lng,
          color: '#ffffff',
          size: 0.03,
          data: null,
          type: 'airport' as const, // Using airport type for country markers
          label: selectedCountry
        }]
      }
    }
    
    return []
  }, [currentView, airports, restaurants, selectedCountry, polygons])

  return (
    <>
      {/* Bright lighting setup */}
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />

      <OrbitControlsImpl
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        autoRotate={false}
      />

      <group ref={groupRef}>
        <GlobeSphere globeImageUrl={globeImageUrl} bumpImageUrl={bumpImageUrl} />
        <Atmosphere color={atmosphereColor} altitude={atmosphereAltitude} />

        {(currentView === 'travelAdvisory' || currentView === 'visaRequirements') && (
          <Countries
            polygons={polygons}
            radius={2}
            getColor={getPolygonColor}
            onCountryClick={onCountryClick}
            onCountryHover={onCountryHover}
          />
        )}

        {currentView === 'visaRequirements' && visaArcs.length > 0 && (
          <Arcs data={visaArcs} radius={2} />
        )}

        {showMarkers && markersData.length > 0 && (
          <Markers 
            data={markersData} 
            radius={2.05}
            onMarkerClick={(m) => {
              if (m.type === 'airport' && m.data) onAirportClick(m.data as AirportData)
              if (m.type === 'restaurant' && m.data) onRestaurantClick(m.data as MichelinRestaurantData)
            }}
          />
        )}
      </group>
    </>
  )
}

export default TravelDataGlobeManual