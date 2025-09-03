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

// Simple Earth sphere with fallback
function GlobeSphere({ globeImageUrl, bumpImageUrl }: { globeImageUrl: string; bumpImageUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [bumpTexture, setBumpTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    
    // Load main texture
    loader.load(
      globeImageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        setTexture(tex)
      },
      undefined,
      (err) => {
        console.error('Failed to load globe texture:', err)
      }
    )
    
    // Load bump map
    loader.load(
      bumpImageUrl,
      (tex) => {
        setBumpTexture(tex)
      },
      undefined,
      () => {
        console.warn('Failed to load bump texture')
      }
    )
  }, [globeImageUrl, bumpImageUrl])

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      {texture ? (
        <meshPhongMaterial
          map={texture}
          bumpMap={bumpTexture}
          bumpScale={0.005}
          color="#ffffff"
        />
      ) : (
        // Fallback material if texture doesn't load
        <meshPhongMaterial color="#2a4d6e" />
      )}
    </mesh>
  )
}

// Simple atmosphere
function Atmosphere() {
  return (
    <mesh scale={[1.1, 1.1, 1.1]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial 
        color="#4a90e2"
        transparent 
        opacity={0.1}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

// Simple country polygons
function CountryPolygons({ polygons, onCountryClick, selectedCountry }: any) {
  return (
    <group>
      {polygons.map((polygon: any, index: number) => {
        if (!polygon.geometry?.coordinates) return null
        
        const isSelected = selectedCountry === polygon.properties?.name
        let color = '#4caf50' // Default green
        
        if ('level' in polygon) {
          const colors: any = { 1: '#4caf50', 2: '#ffb300', 3: '#f4511e', 4: '#b71c1c' }
          color = colors[polygon.level] || '#666'
        }
        
        if (isSelected) color = '#ffeb3b'
        
        // Simple line around each country
        const points: THREE.Vector3[] = []
        const coords = polygon.geometry.type === 'Polygon' 
          ? polygon.geometry.coordinates[0]
          : polygon.geometry.coordinates[0]?.[0] || []
          
        coords.forEach(([lng, lat]: number[]) => {
          const pos = latLngToVector3(lat, lng, 2.01)
          points.push(pos)
        })
        
        if (points.length < 3) return null
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
        
        return (
          <line key={index}>
            <primitive object={lineGeometry} />
            <lineBasicMaterial color={color} linewidth={1} />
          </line>
        )
      })}
    </group>
  )
}

const TravelDataGlobe: React.FC<TravelDataGlobeProps> = ({
  polygons,
  borders: _borders,
  airports,
  restaurants,
  globeImageUrl,
  bumpImageUrl,
  autoRotateSpeed,
  atmosphereColor: _atmosphereColor,
  onCountryClick,
  onAirportClick,
  onRestaurantClick,
  onCountryHover: _onCountryHover,
  selectedCountry,
  selectedCountryCode: _selectedCountryCode,
  hoveredCountry: _hoveredCountry,
  passportCountry: _passportCountry,
  currentView,
  visaArcs: _visaArcs,
  showMarkers,
  focusTarget,
}) => {
  const { camera, gl, scene } = useThree()
  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Ensure scene is set up correctly
  useEffect(() => {
    scene.background = new THREE.Color(0x000814) // Very dark blue background
    gl.setClearColor(0x000814, 1)
  }, [gl, scene])

  // Auto-rotation
  useFrame((_state, delta) => {
    if (groupRef.current && !selectedCountry && !focusTarget && autoRotateSpeed > 0) {
      groupRef.current.rotation.y += delta * autoRotateSpeed * 0.05
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
    } else if (selectedCountry) {
      // Find country centroid and fly to it
      const poly = polygons.find(p => p.properties?.name === selectedCountry)
      if (poly?.geometry?.coordinates) {
        const coords = poly.geometry.type === 'Polygon' 
          ? poly.geometry.coordinates[0]
          : poly.geometry.coordinates[0]?.[0] || []
        
        if (coords.length > 0) {
          let sumLat = 0, sumLng = 0
          coords.forEach(([lng, lat]: number[]) => {
            sumLat += lat
            sumLng += lng
          })
          flyToLocation(sumLat / coords.length, sumLng / coords.length)
        }
      }
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
  }, [selectedCountry, focusTarget, polygons, camera, flyToLocation])

  return (
    <>
      {/* BRIGHT lighting to ensure visibility */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={2} />
      <directionalLight position={[-5, -5, -5]} intensity={1} />
      <pointLight position={[10, 10, 10]} intensity={1} />

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
        <GlobeSphere globeImageUrl={globeImageUrl} bumpImageUrl={bumpImageUrl} />
        <Atmosphere />
        
        {(currentView === 'travelAdvisory' || currentView === 'visaRequirements') && (
          <CountryPolygons 
            polygons={polygons}
            onCountryClick={onCountryClick}
            selectedCountry={selectedCountry}
          />
        )}
        
        {/* Simple marker for selected location */}
        {showMarkers && selectedCountry && (
          (() => {
            const poly = polygons.find(p => p.properties?.name === selectedCountry)
            if (!poly?.geometry?.coordinates) return null
            
            const coords = poly.geometry.type === 'Polygon' 
              ? poly.geometry.coordinates[0]
              : poly.geometry.coordinates[0]?.[0] || []
            
            if (coords.length === 0) return null
            
            let sumLat = 0, sumLng = 0
            coords.forEach(([lng, lat]: number[]) => {
              sumLat += lat
              sumLng += lng
            })
            
            const position = latLngToVector3(sumLat / coords.length, sumLng / coords.length, 2.05)
            
            return (
              <mesh position={position}>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
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

export default TravelDataGlobe