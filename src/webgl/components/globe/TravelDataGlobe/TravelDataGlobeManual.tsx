'use client'

import React, { useRef, useEffect, useCallback, Suspense } from 'react'
import * as THREE from 'three'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl, Line, Html } from '@react-three/drei'
import type { OrbitControls } from 'three-stdlib'
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

// Globe sphere with textures
function GlobeSphere({ globeImageUrl, bumpImageUrl }: { globeImageUrl: string; bumpImageUrl: string }) {
  const [globeTexture, bumpTexture] = useLoader(THREE.TextureLoader, [globeImageUrl, bumpImageUrl])
  
  React.useEffect(() => {
    if (globeTexture) {
      globeTexture.colorSpace = THREE.SRGBColorSpace
      globeTexture.anisotropy = 16
    }
  }, [globeTexture])

  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshPhongMaterial 
        map={globeTexture}
        bumpMap={bumpTexture}
        bumpScale={0.01}
        specular={new THREE.Color('#333')}
        shininess={5}
      />
    </mesh>
  )
}

// Atmosphere glow effect
function Atmosphere({ color = '#4FC3F7', altitude = 0.15 }: { color?: string; altitude?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const atmosphereMaterial = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(color) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, intensity * 0.5);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    })
  }, [color])

  return (
    <mesh ref={meshRef} scale={[1 + altitude, 1 + altitude, 1 + altitude]}>
      <sphereGeometry args={[2, 50, 50]} />
      <primitive object={atmosphereMaterial} attach="material" />
    </mesh>
  )
}

// Cloud layer
function Clouds() {
  const meshRef = useRef<THREE.Mesh>(null)
  const cloudTexture = useLoader(THREE.TextureLoader, '/clouds.png')
  const CLOUDS_ALT = 0.004
  const CLOUDS_ROTATION_SPEED = -0.001

  React.useEffect(() => {
    if (cloudTexture) {
      cloudTexture.anisotropy = 16
    }
  }, [cloudTexture])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += CLOUDS_ROTATION_SPEED
    }
  })

  return (
    <mesh ref={meshRef} scale={[1.01, 1.01, 1.01]}>
      <sphereGeometry args={[2.02, 64, 64]} />
      <meshPhongMaterial 
        map={cloudTexture}
        transparent
        opacity={0.6}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

// 3D Marker
function Marker({ 
  position, 
  label, 
  sublabel, 
  color = '#ff4136', 
  onClick,
  size = 1
}: { 
  position: THREE.Vector3
  label: string
  sublabel?: string
  color?: string
  onClick?: () => void
  size?: number
}) {
  const [hovered, setHovered] = React.useState(false)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.lookAt(state.camera.position)
    }
  })

  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
      >
        <sphereGeometry args={[0.015 * size, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      <mesh>
        <ringGeometry args={[0.02 * size, 0.025 * size, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} opacity={0.5} transparent />
      </mesh>

      {hovered && (
        <Html
          center
          distanceFactor={4}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'system-ui',
              whiteSpace: 'nowrap',
              border: `1px solid ${color}`,
              boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
              transform: 'translateY(-100%)',
              marginTop: '-10px'
            }}
          >
            <div style={{ fontWeight: 600 }}>{label}</div>
            {sublabel && (
              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                {sublabel}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
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
  const controlsRef = useRef<OrbitControls>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Setup scene
  useEffect(() => {
    scene.background = null
    gl.setClearColor(0x000000, 0)
  }, [gl, scene])

  // Auto-rotation
  useFrame(() => {
    if (groupRef.current && !selectedCountry && !focusTarget && autoRotateSpeed > 0) {
      groupRef.current.rotation.y += autoRotateSpeed * 0.002
    }
  })

  // Camera animation
  const flyToLocation = useCallback((lat: number, lng: number) => {
    const pos = latLngToVector3(lat, lng, 2)
    const distance = 3.5
    
    gsap.to(camera.position, {
      x: pos.x * distance,
      y: pos.y * distance,
      z: pos.z * distance,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
        controlsRef.current?.update()
      },
    })
  }, [camera])

  // Handle focus changes
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
      gsap.to(camera.position, {
        x: 0, y: 0, z: 6,
        duration: 1.0,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.lookAt(0, 0, 0)
          camera.updateProjectionMatrix()
          controlsRef.current?.update()
        },
      })
    }
  }, [selectedCountry, selectedCountryCode, focusTarget, polygons, camera, flyToLocation])

  // Get polygon colors based on view
  const getPolygonColor = useCallback((poly: PolyAdv | VisaPolygon) => {
    const polyName = normalizeName(poly.properties?.name || '')
    const selectedName = normalizeName(selectedCountry || '')
    const hoveredName = normalizeName(hoveredCountry || '')
    
    if (selectedName && polyName === selectedName) return '#ffeb3b'
    if (hoveredName && polyName === hoveredName) return '#ffffff'
    
    if ('level' in poly) {
      const colors: Record<number, string> = { 
        1: '#4caf50',
        2: '#ffb300', 
        3: '#f4511e',
        4: '#b71c1c'
      }
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

  // Create visa arc lines
  const visaArcLines = React.useMemo(() => {
    if (!visaArcs || visaArcs.length === 0) return null
    
    return visaArcs.map((arc, i) => {
      const start = latLngToVector3(arc.startLat, arc.startLng, 2.01)
      const end = latLngToVector3(arc.endLat, arc.endLng, 2.01)
      const distance = start.distanceTo(end)
      const arcHeight = Math.min(distance * 0.3, 0.6)
      
      const points: THREE.Vector3[] = []
      const segments = 64
      
      for (let t = 0; t <= segments; t++) {
        const k = t / segments
        const point = new THREE.Vector3().lerpVectors(start, end, k)
        const height = Math.sin(k * Math.PI) * arcHeight
        point.normalize().multiplyScalar(2.01 + height)
        points.push(point)
      }
      
      return (
        <Line
          key={`arc-${i}`}
          points={points}
          color={arc.color}
          lineWidth={2}
          transparent
          opacity={0.6}
        />
      )
    })
  }, [visaArcs])

  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 3, 5]} 
        intensity={0.8}
      />
      <directionalLight 
        position={[-5, -3, -5]} 
        intensity={0.2}
      />
      
      {/* Camera controls */}
      <OrbitControlsImpl
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        zoomSpeed={0.6}
        minDistance={3}
        maxDistance={10}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.8}
      />

      <group ref={groupRef}>
        {/* Main globe */}
        <Suspense fallback={
          <mesh>
            <sphereGeometry args={[2, 32, 32]} />
            <meshBasicMaterial color="#1e4d8b" />
          </mesh>
        }>
          <GlobeSphere globeImageUrl={globeImageUrl} bumpImageUrl={bumpImageUrl} />
          <Clouds />
        </Suspense>
        
        {/* Atmosphere glow */}
        <Atmosphere color={atmosphereColor} altitude={atmosphereAltitude} />

        {/* Country polygons */}
        {(currentView === 'travelAdvisory' || currentView === 'visaRequirements') && (
          <Countries
            polygons={polygons}
            radius={2.01}
            getColor={getPolygonColor}
            onCountryClick={onCountryClick}
            onCountryHover={onCountryHover}
          />
        )}

        {/* Visa travel arcs */}
        {currentView === 'visaRequirements' && visaArcLines}

        {/* Airport markers */}
        {currentView === 'airports' && showMarkers && airports.map((airport, i) => {
          const position = latLngToVector3(airport.location.lat, airport.location.lng, 2.02)
          return (
            <Marker
              key={`airport-${i}`}
              position={position}
              label={`${airport.code} - ${airport.name}`}
              sublabel={`${airport.location.city}, ${airport.location.country}`}
              color="#00bcd4"
              onClick={() => onAirportClick(airport)}
              size={0.8}
            />
          )
        })}

        {/* Restaurant markers */}
        {currentView === 'michelinRestaurants' && showMarkers && restaurants.map((restaurant, i) => {
          const position = latLngToVector3(restaurant.location.lat, restaurant.location.lng, 2.02)
          const color = restaurant.greenStar ? '#4caf50' : '#ffd700'
          return (
            <Marker
              key={`restaurant-${i}`}
              position={position}
              label={restaurant.name}
              sublabel={`${'⭐'.repeat(Math.min(restaurant.rating, 3))} • ${restaurant.cuisine}`}
              color={color}
              onClick={() => onRestaurantClick(restaurant)}
              size={1}
            />
          )
        })}
      </group>
    </>
  )
}

export default TravelDataGlobeManual