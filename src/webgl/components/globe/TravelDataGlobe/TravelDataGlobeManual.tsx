'use client'

import React, { useRef, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import gsap from 'gsap'

import { Countries } from './Countries'
import { VisaArcs } from './VisaArcs'
import { latLngToVector3 } from './utils'
import type { 
  PolyAdv, 
  VisaPolygon, 
  CountryBorder,
  AirportData,
  MichelinRestaurantData,
  VisaRequirement
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
  hoveredCountry: string | null
  currentView: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'
  
  visaRequirements: VisaRequirement[]
  passportCountry: string | null
  showMarkers: boolean
}

// Globe sphere component with error handling
function GlobeSphere({ 
  globeImageUrl, 
  bumpImageUrl 
}: { 
  globeImageUrl: string
  bumpImageUrl: string 
}) {
  const [textures, setTextures] = useState<{ earth?: THREE.Texture; bump?: THREE.Texture }>({})
  const [error, setError] = useState(false)
  
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    
    Promise.all([
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          globeImageUrl,
          (texture) => resolve(texture),
          undefined,
          (err) => reject(err)
        )
      }),
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          bumpImageUrl,
          (texture) => resolve(texture),
          undefined,
          (err) => reject(err)
        )
      })
    ]).then(([earth, bump]) => {
      setTextures({ earth, bump })
    }).catch((err) => {
      console.warn('Failed to load globe textures, using fallback:', err)
      setError(true)
    })
  }, [globeImageUrl, bumpImageUrl])
  
  if (error || !textures.earth) {
    // Fallback globe without textures
    return (
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial 
          color="#2a4858"
          specular={new THREE.Color('#111111')}
          shininess={5}
        />
      </mesh>
    )
  }
  
  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshPhongMaterial 
        map={textures.earth}
        bumpMap={textures.bump}
        bumpScale={0.015}
        specularMap={textures.earth}
        specular={new THREE.Color('grey')}
        shininess={5}
      />
    </mesh>
  )
}

// Cloud layer component with error handling
function CloudLayer() {
  const cloudsRef = useRef<THREE.Mesh>(null)
  const [cloudTexture, setCloudTexture] = useState<THREE.Texture | null>(null)
  
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(
      '/clouds.png',
      (texture) => setCloudTexture(texture),
      undefined,
      (err) => console.warn('Failed to load cloud texture:', err)
    )
  }, [])
  
  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02
    }
  })
  
  return (
    <mesh ref={cloudsRef} scale={[1.01, 1.01, 1.01]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshPhongMaterial
        map={cloudTexture}
        transparent
        opacity={cloudTexture ? 0.3 : 0.1}
        depthWrite={false}
        color={cloudTexture ? '#ffffff' : '#e0e0e0'}
      />
    </mesh>
  )
}

// Atmosphere component
function Atmosphere({ color = '#ffffff', altitude = 0.15 }: { color?: string; altitude?: number }) {
  return (
    <mesh scale={[1 + altitude, 1 + altitude, 1 + altitude]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.1}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

// Country marker component
function CountryMarker({ 
  selectedCountry, 
  polygons 
}: { 
  selectedCountry: string | null
  polygons: Array<PolyAdv | VisaPolygon> 
}) {
  const position = useMemo(() => {
    if (!selectedCountry) return null
    
    const poly = polygons.find(p => p.properties?.name === selectedCountry)
    if (!poly?.geometry?.coordinates) return null
    
    try {
      // Get centroid of the first polygon
      const coords = poly.geometry.type === 'Polygon' 
        ? poly.geometry.coordinates[0]
        : poly.geometry.coordinates[0][0]
      
      let sumLat = 0, sumLng = 0
      coords.forEach(([lng, lat]: number[]) => {
        sumLat += lat
        sumLng += lng
      })
      
      const centerLat = sumLat / coords.length
      const centerLng = sumLng / coords.length
      
      return latLngToVector3(centerLat, centerLng, 2.05)
    } catch {
      return null
    }
  }, [selectedCountry, polygons])
  
  if (!position) return null
  
  return (
    <group position={position}>
      {/* Marker pin */}
      <mesh>
        <coneGeometry args={[0.02, 0.08, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
      
      {/* Pulsing ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.08, 32]} />
        <meshBasicMaterial 
          color="white" 
          transparent 
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// Point markers for airports/restaurants
function PointMarkers({
  points,
  type,
  onPointClick
}: {
  points: AirportData[] | MichelinRestaurantData[]
  type: 'airports' | 'restaurants'
  onPointClick: (point: any) => void
}) {
  return (
    <group>
      {points.map((point, index) => {
        const position = latLngToVector3(
          point.location.lat,
          point.location.lng,
          2.01
        )
        
        const color = type === 'airports' ? '#00ffff' :
          type === 'restaurants' && 'rating' in point ? 
            point.rating === 3 ? '#FFD700' :
            point.rating === 2 ? '#C0C0C0' :
            '#CD7F32' : '#4CAF50'
        
        return (
          <mesh
            key={index}
            position={position}
            onClick={(e) => {
              e.stopPropagation()
              onPointClick(point)
            }}
          >
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
}

const TravelDataGlobeManual: React.FC<TravelDataGlobeManualProps> = ({
  polygons,
  // borders is not currently used but kept for future implementation
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
  hoveredCountry,
  currentView,
  visaRequirements,
  passportCountry,
  showMarkers
}) => {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  // Auto-rotate the globe
  useFrame((_, delta) => {
    if (groupRef.current && !selectedCountry && !passportCountry) {
      groupRef.current.rotation.y += delta * autoRotateSpeed * 0.1
    }
  })
  
  // Fly to selected country
  useEffect(() => {
    const targetCountry = currentView === 'visaRequirements' ? passportCountry : selectedCountry
    
    if (targetCountry && controlsRef.current) {
      const poly = polygons.find(p => p.properties?.name === targetCountry)
      if (!poly?.geometry?.coordinates) return
      
      try {
        // Get centroid
        const coords = poly.geometry.type === 'Polygon' 
          ? poly.geometry.coordinates[0]
          : poly.geometry.coordinates[0][0]
        
        let sumLat = 0, sumLng = 0
        coords.forEach(([lng, lat]: number[]) => {
          sumLat += lat
          sumLng += lng
        })
        
        const centerLat = sumLat / coords.length
        const centerLng = sumLng / coords.length
        const targetPos = latLngToVector3(centerLat, centerLng, 2)
        
        // Animate camera to look at the country
        gsap.to(camera.position, {
          x: targetPos.x * 2,
          y: targetPos.y * 2,
          z: targetPos.z * 2,
          duration: 1.5,
          ease: "power2.inOut",
          onUpdate: () => {
            camera.lookAt(0, 0, 0)
            controlsRef.current?.update()
          }
        })
      } catch (e) {
        console.error('Failed to fly to country:', e)
      }
    } else if (!targetCountry) {
      // Reset camera position
      gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 5,
        duration: 1.5,
        ease: "power2.inOut",
        onUpdate: () => {
          camera.lookAt(0, 0, 0)
          controlsRef.current?.update()
        }
      })
    }
  }, [selectedCountry, passportCountry, currentView, polygons, camera])
  
  // Get polygon colors based on view
  const getPolygonColor = useMemo(() => {
    return (poly: PolyAdv | VisaPolygon) => {
      // Highlight hovered country
      if (hoveredCountry && poly.properties?.name === hoveredCountry) {
        return '#ffffff'
      }
      // Highlight selected country
      if (selectedCountry && poly.properties?.name === selectedCountry) {
        return '#ffeb3b'
      }
      
      // Color based on view type
      if (currentView === 'travelAdvisory' && 'level' in poly) {
        const colors = {
          1: '#4caf50',
          2: '#ffb300', 
          3: '#f4511e',
          4: '#b71c1c'
        }
        return colors[poly.level] || '#666666'
      }
      
      if (currentView === 'visaRequirements' && 'requirement' in poly) {
        const colors = {
          visa_free: '#4caf50',
          visa_on_arrival: '#8bc34a',
          e_visa: '#03a9f4',
          eta: '#00bcd4',
          visa_required: '#f4511e',
          no_admission: '#b71c1c'
        }
        return colors[poly.requirement] || '#666666'
      }
      
      return '#333333'
    }
  }, [hoveredCountry, selectedCountry, currentView])
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      <pointLight position={[-5, -3, -5]} intensity={0.4} />
      
      {/* Controls */}
      <OrbitControlsImpl
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        autoRotate={!selectedCountry && !passportCountry}
        autoRotateSpeed={autoRotateSpeed}
      />
      
      {/* Globe group */}
      <group ref={groupRef}>
        {/* Main globe */}
        <GlobeSphere globeImageUrl={globeImageUrl} bumpImageUrl={bumpImageUrl} />
        
        {/* Cloud layer */}
        <CloudLayer />
        
        {/* Atmosphere */}
        <Atmosphere color={atmosphereColor} altitude={atmosphereAltitude} />
        
        {/* Countries */}
        {(currentView === 'travelAdvisory' || currentView === 'visaRequirements') && (
          <Countries
            polygons={polygons}
            radius={2}
            getColor={getPolygonColor}
            onCountryClick={onCountryClick}
            onCountryHover={onCountryHover}
          />
        )}
        
        {/* Visa arcs */}
        {currentView === 'visaRequirements' && passportCountry && (
          <VisaArcs
            visaRequirements={visaRequirements}
            passportCountry={passportCountry}
            polygons={polygons}
            radius={2}
          />
        )}
        
        {/* Country marker */}
        {showMarkers && currentView === 'travelAdvisory' && (
          <CountryMarker selectedCountry={selectedCountry} polygons={polygons} />
        )}
        
        {/* Point markers for airports/restaurants */}
        {currentView === 'airports' && (
          <PointMarkers
            points={airports}
            type="airports"
            onPointClick={onAirportClick}
          />
        )}
        
        {currentView === 'michelinRestaurants' && (
          <PointMarkers
            points={restaurants}
            type="restaurants"
            onPointClick={onRestaurantClick}
          />
        )}
      </group>
      
      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom 
          intensity={0.5}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.025}
        />
      </EffectComposer>
    </>
  )
}

export default TravelDataGlobeManual
