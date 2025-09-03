'use client'

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl } from '@react-three/drei'
import gsap from 'gsap'

import { latLngToVector3 } from './utils'

interface TravelDataGlobeProps {
  polygons: any[]
  borders: any
  airports: any[]
  restaurants: any[]
  globeImageUrl: string
  bumpImageUrl: string
  autoRotateSpeed: number
  atmosphereColor: string
  onCountryClick: (name: string) => void
  onAirportClick: (airport: any) => void
  onRestaurantClick: (restaurant: any) => void
  onCountryHover: (name: string | null) => void
  selectedCountry: string | null
  selectedCountryCode: string | null
  hoveredCountry: string | null
  passportCountry: string | null
  currentView: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  visaArcs: any[]
  showMarkers: boolean
  focusTarget: { lat: number; lng: number } | null
}

// Earth sphere with proper texture and lighting
function GlobeSphere({ globeImageUrl, bumpImageUrl }: { globeImageUrl: string; bumpImageUrl: string }) {
  const [textures, setTextures] = useState<{ earth?: THREE.Texture; bump?: THREE.Texture }>({})

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    
    Promise.all([
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(globeImageUrl, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          texture.anisotropy = 16
          resolve(texture)
        }, undefined, reject)
      }),
      new Promise<THREE.Texture>((resolve) => {
        loader.load(bumpImageUrl, (texture) => {
          texture.anisotropy = 16
          resolve(texture)
        }, undefined, () => resolve(undefined as any))
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
        emissiveMap={textures.earth}
        emissive={new THREE.Color(0xffffff)}
        emissiveIntensity={0.1}
      />
    </mesh>
  )
}

// Subtle atmosphere effect
function Atmosphere({ color = '#4FC3F7', altitude = 0.05 }: { color?: string; altitude?: number }) {
  return (
    <mesh scale={[1 + altitude, 1 + altitude, 1 + altitude]}>
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

// Country polygons
function Countries({ polygons, getColor, onCountryClick, onCountryHover }: any) {
  return (
    <group>
      {polygons.map((polygon: any, index: number) => {
        if (!polygon.geometry) return null
        
        const geometry = new THREE.BufferGeometry()
        const vertices: number[] = []
        
        // Simple polygon rendering (you may need to adjust based on your data structure)
        if (polygon.geometry.coordinates) {
          const coords = polygon.geometry.type === 'Polygon' 
            ? polygon.geometry.coordinates[0]
            : polygon.geometry.coordinates[0][0]
            
          coords.forEach(([lng, lat]: number[]) => {
            const pos = latLngToVector3(lat, lng, 2.01)
            vertices.push(pos.x, pos.y, pos.z)
          })
        }
        
        if (vertices.length === 0) return null
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        
        return (
          <mesh
            key={index}
            geometry={geometry}
            onClick={(e) => {
              e.stopPropagation()
              if (polygon.properties?.name) {
                onCountryClick(polygon.properties.name)
              }
            }}
            onPointerEnter={() => onCountryHover(polygon.properties?.name)}
            onPointerLeave={() => onCountryHover(null)}
          >
            <meshBasicMaterial 
              color={getColor(polygon)} 
              transparent 
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Helper functions
function normalizeName(s: string) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function getCentroidFromPoly(poly: any): { lat: number; lng: number } | null {
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

const TravelDataGlobe: React.FC<TravelDataGlobeProps> = ({
  polygons,
  borders: _borders,
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

  // Ensure transparent background
  useEffect(() => {
    scene.background = null
    gl.setClearColor(0x000000, 0)
  }, [gl, scene])

  // Auto-rotation
  useFrame((_, delta) => {
    if (groupRef.current && !selectedCountry && !focusTarget && autoRotateSpeed > 0) {
      groupRef.current.rotation.y += delta * autoRotateSpeed * 0.1
    }
  })

  // Camera animation
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

  // Handle focus changes
  useEffect(() => {
    if (focusTarget) {
      flyToLocation(focusTarget.lat, focusTarget.lng)
    } else if (selectedCountry || selectedCountryCode) {
      const poly = polygons.find((p: any) => 
        (selectedCountryCode && p.properties?.iso_a2?.toUpperCase() === selectedCountryCode.toUpperCase()) ||
        (selectedCountry && normalizeName(p.properties?.name) === normalizeName(selectedCountry))
      )
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

  // Get polygon colors
  const getPolygonColor = useCallback((poly: any) => {
    if (selectedCountry && poly.properties?.name === selectedCountry) return '#ffeb3b'
    if (hoveredCountry && poly.properties?.name === hoveredCountry) return '#ffffff'
    
    if ('level' in poly) {
      const colors: any = { 1: '#4caf50', 2: '#ffb300', 3: '#f4511e', 4: '#b71c1c' }
      return colors[poly.level] || '#666'
    }
    
    if ('requirement' in poly) {
      const colors: any = {
        visa_free: '#4caf50',
        visa_on_arrival: '#8bc34a',
        e_visa: '#03a9f4',
        visa_required: '#f4511e',
        no_data: '#3a3a3a'
      }
      return colors[poly.requirement] || '#666'
    }
    
    return '#666'
  }, [hoveredCountry, selectedCountry])

  // Calculate marker position
  const markerPosition = useMemo(() => {
    if (!selectedCountry && !selectedCountryCode) return null
    
    const poly = polygons.find((p: any) => 
      (selectedCountryCode && p.properties?.iso_a2?.toUpperCase() === selectedCountryCode.toUpperCase()) ||
      (selectedCountry && normalizeName(p.properties?.name) === normalizeName(selectedCountry))
    )
    
    const cent = poly ? getCentroidFromPoly(poly) : null
    return cent ? latLngToVector3(cent.lat, cent.lng, 2.05) : null
  }, [selectedCountry, selectedCountryCode, polygons])

  return (
    <>
      {/* Bright lighting setup */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={2} castShadow />
      <directionalLight position={[-5, -5, -5]} intensity={1} />
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
        <Atmosphere color={atmosphereColor} />

        {(currentView === 'travelAdvisory' || currentView === 'visaRequirements') && (
          <Countries
            polygons={polygons}
            getColor={getPolygonColor}
            onCountryClick={onCountryClick}
            onCountryHover={onCountryHover}
          />
        )}

        {/* Country marker */}
        {showMarkers && markerPosition && (
          <group position={markerPosition}>
            <mesh>
              <coneGeometry args={[0.02, 0.08, 8]} />
              <meshBasicMaterial color="white" />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshBasicMaterial color="white" />
            </mesh>
          </group>
        )}

        {/* Airport markers */}
        {currentView === 'airports' && airports.map((airport, i) => {
          const position = latLngToVector3(airport.location.lat, airport.location.lng, 2.01)
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
          const position = latLngToVector3(restaurant.location.lat, restaurant.location.lng, 2.01)
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

export default TravelDataGlobe