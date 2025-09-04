'use client'

import React, { useRef, useEffect, useCallback, Suspense } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
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

// Globe sphere with proper texture loading
function GlobeSphere({ globeImageUrl, bumpImageUrl }: { globeImageUrl: string; bumpImageUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const textureLoader = useRef(new THREE.TextureLoader())

  useEffect(() => {
    if (!meshRef.current) return

    const material = meshRef.current.material as THREE.MeshPhongMaterial

    // Load main texture
    textureLoader.current.load(
      globeImageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        material.map = texture
        material.needsUpdate = true
      }
    )

    // Load bump map
    textureLoader.current.load(
      bumpImageUrl,
      (texture) => {
        material.bumpMap = texture
        material.bumpScale = 0.01
        material.needsUpdate = true
      }
    )
  }, [globeImageUrl, bumpImageUrl])

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 75, 75]} />
      <meshPhongMaterial 
        color="#ffffff"
        emissive="#000000"
        shininess={15}
      />
    </mesh>
  )
}

// Proper atmosphere with shaders similar to globe.gl
function Atmosphere({ color = '#4FC3F7', altitude = 0.15 }: { color?: string; altitude?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const atmosphereShader = React.useMemo(() => ({
    uniforms: {
      coeficient: { value: 1.0 },
      power: { value: 2 },
      glowColor: { value: new THREE.Color(color) }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPositionNormal;
      void main() {
        vNormal = normalize( normalMatrix * normal );
        vPositionNormal = normalize(( modelMatrix * vec4(position, 1.0) ).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: `
      uniform float coeficient;
      uniform float power;
      uniform vec3 glowColor;
      varying vec3 vPositionNormal;
      varying vec3 vNormal;
      void main() {
        float intensity = pow( coeficient + dot(vNormal, vPositionNormal), power );
        gl_FragColor = vec4( glowColor, intensity );
      }
    `
  }), [color])

  return (
    <mesh ref={meshRef} scale={[1 + altitude, 1 + altitude, 1 + altitude]}>
      <sphereGeometry args={[2, 50, 50]} />
      <shaderMaterial
        args={[atmosphereShader]}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent={true}
      />
    </mesh>
  )
}

// Cloud layer with proper material
function Clouds() {
  const cloudsRef = useRef<THREE.Mesh>(null)
  const textureLoader = useRef(new THREE.TextureLoader())
  const CLOUDS_ALT = 0.004
  const CLOUDS_ROTATION_SPEED = -0.006

  useEffect(() => {
    if (!cloudsRef.current) return

    textureLoader.current.load(
      '/clouds.png',
      (texture) => {
        const material = cloudsRef.current!.material as THREE.MeshPhongMaterial
        material.map = texture
        material.transparent = true
        material.opacity = 0.8
        material.needsUpdate = true
      }
    )
  }, [])

  useFrame(() => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += CLOUDS_ROTATION_SPEED * Math.PI / 180
    }
  })

  return (
    <mesh ref={cloudsRef} scale={[1 + CLOUDS_ALT, 1 + CLOUDS_ALT, 1 + CLOUDS_ALT]}>
      <sphereGeometry args={[2.008, 75, 75]} />
      <meshPhongMaterial 
        transparent={true}
        opacity={0}
      />
    </mesh>
  )
}

// HTML-based marker similar to globe.gl
function HtmlMarker({ 
  position, 
  label, 
  sublabel, 
  color = '#ff4136', 
  onClick,
  size = 30
}: { 
  position: THREE.Vector3
  label: string
  sublabel?: string
  color?: string
  onClick?: () => void
  size?: number
}) {
  const [hovered, setHovered] = React.useState(false)

  const markerSvg = `
    <svg viewBox="-4 0 36 36" style="width: ${size}px; height: ${size}px;">
      <path fill="currentColor" d="M14,0 C21.732,0 28,5.641 28,12.6 C28,23.963 14,36 14,36 C14,36 0,24.064 0,12.6 C0,5.641 6.268,0 14,0 Z"></path>
      <circle fill="white" cx="14" cy="14" r="7"></circle>
    </svg>
  `

  return (
    <Html
      position={position}
      center
      style={{
        pointerEvents: 'auto',
        cursor: 'pointer',
        transition: 'all 0.3s',
        transform: hovered ? 'scale(1.2)' : 'scale(1)',
      }}
      distanceFactor={4}
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
        onPointerOver={() => {
          setHovered(true)
        }}
        onPointerOut={() => {
          setHovered(false)
        }}
        style={{
          color,
          transition: 'opacity 250ms',
          opacity: hovered ? 1 : 0.85,
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: markerSvg }} />
        
        {hovered && (
          <div
            style={{
              position: 'absolute',
              top: -45,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'var(--font-saira-extra-condensed, sans-serif)',
              whiteSpace: 'nowrap',
              border: `1px solid ${color}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ fontWeight: 600 }}>{label}</div>
            {sublabel && (
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {sublabel}
              </div>
            )}
          </div>
        )}
      </div>
    </Html>
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
  useFrame((_, delta) => {
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
          controlsRef.current?.update()
        },
      })
    }
  }, [selectedCountry, selectedCountryCode, focusTarget, polygons, camera, flyToLocation])

  // Get polygon color
  const getPolygonColor = useCallback((poly: PolyAdv | VisaPolygon) => {
    if (selectedCountry && normalizeName(poly.properties?.name) === normalizeName(selectedCountry)) return '#ffeb3b'
    if (hoveredCountry && normalizeName(poly.properties?.name) === normalizeName(hoveredCountry)) return '#ffffff'
    
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

  // Create visa arcs
  const visaArcLines = React.useMemo(() => {
    if (!visaArcs || visaArcs.length === 0) return null
    
    return visaArcs.map((arc, i) => {
      const start = latLngToVector3(arc.startLat, arc.startLng, 2.01)
      const end = latLngToVector3(arc.endLat, arc.endLng, 2.01)
      
      const points: THREE.Vector3[] = []
      const segments = 50
      for (let t = 0; t <= segments; t++) {
        const k = t / segments
        const point = new THREE.Vector3().lerpVectors(start, end, k)
        const arcHeight = Math.sin(k * Math.PI) * 0.3
        point.normalize().multiplyScalar(2.01 + arcHeight)
        points.push(point)
      }
      
      return (
        <Line
          key={`arc-${i}`}
          points={points}
          color={arc.color}
          lineWidth={2}
          transparent
          opacity={0.8}
        />
      )
    })
  }, [visaArcs])

  return (
    <>
      {/* Lighting similar to globe.gl */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[1, 1, 1]} 
        intensity={0.8}
      />
      <directionalLight 
        position={[-1, -0.5, -1]} 
        intensity={0.2}
      />

      {/* Controls */}
      <OrbitControlsImpl
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        zoomSpeed={0.5}
        minDistance={3}
        maxDistance={10}
        autoRotate={autoRotateSpeed > 0}
        autoRotateSpeed={autoRotateSpeed * 0.35}
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
        
        <Atmosphere color={atmosphereColor} altitude={atmosphereAltitude} />
        <Clouds />

        {(currentView === 'travelAdvisory' || currentView === 'visaRequirements') && (
          <Countries
            polygons={polygons}
            radius={2.01}
            getColor={getPolygonColor}
            onCountryClick={onCountryClick}
            onCountryHover={onCountryHover}
          />
        )}

        {currentView === 'visaRequirements' && visaArcLines}

        {currentView === 'airports' && showMarkers && airports.map((airport, i) => {
          const position = latLngToVector3(airport.location.lat, airport.location.lng, 2.03)
          return (
            <HtmlMarker
              key={`airport-${i}`}
              position={position}
              label={`${airport.code}`}
              sublabel={airport.name}
              color="#00bcd4"
              onClick={() => onAirportClick(airport)}
              size={25}
            />
          )
        })}

        {currentView === 'michelinRestaurants' && showMarkers && restaurants.map((restaurant, i) => {
          const position = latLngToVector3(restaurant.location.lat, restaurant.location.lng, 2.03)
          const color = restaurant.greenStar ? '#4caf50' : '#ffd700'
          return (
            <HtmlMarker
              key={`restaurant-${i}`}
              position={position}
              label={restaurant.name}
              sublabel={`${'⭐'.repeat(Math.min(restaurant.rating, 3))}`}
              color={color}
              onClick={() => onRestaurantClick(restaurant)}
              size={30}
            />
          )
        })}
      </group>
    </>
  )
}

export default TravelDataGlobeManual