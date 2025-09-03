'use client'

import React, { useRef, useEffect, useCallback, Suspense, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl, Line, Html } from '@react-three/drei'
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
  const meshRef = useRef<THREE.Mesh>(null)
  const [textureLoaded, setTextureLoaded] = React.useState(false)
  
  useEffect(() => {
    if (!meshRef.current) return
    
    const textureLoader = new THREE.TextureLoader()
    
    // Load main texture
    textureLoader.load(
      globeImageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.anisotropy = 16
        
        if (meshRef.current) {
          const material = meshRef.current.material as THREE.MeshStandardMaterial
          material.map = texture
          material.needsUpdate = true
          setTextureLoaded(true)
        }
      },
      undefined,
      (error) => {
        console.error('Failed to load globe texture:', error)
      }
    )
    
    // Load bump map
    textureLoader.load(
      bumpImageUrl,
      (texture) => {
        if (meshRef.current) {
          const material = meshRef.current.material as THREE.MeshStandardMaterial
          material.bumpMap = texture
          material.bumpScale = 0.01
          material.needsUpdate = true
        }
      },
      undefined,
      (error) => {
        console.warn('Failed to load bump texture:', error)
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

// Improved subtle atmosphere with shader
function Atmosphere({ color = '#4FC3F7' }: { color?: string }) {
  const atmosphereShader = {
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
        gl_FragColor = vec4(uColor, 1.0) * intensity * 0.6;
      }
    `
  }

  const colorVec = new THREE.Color(color)

  return (
    <mesh scale={[1.1, 1.1, 1.1]}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        vertexShader={atmosphereShader.vertexShader}
        fragmentShader={atmosphereShader.fragmentShader}
        uniforms={{
          uColor: { value: colorVec }
        }}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        transparent
      />
    </mesh>
  )
}

// Clouds layer
function Clouds({ opacity = 0.3 }: { opacity?: number }) {
  const cloudsRef = useRef<THREE.Mesh>(null)
  const [cloudsTexture, setCloudsTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(
      '/clouds.png',
      (texture) => {
        texture.anisotropy = 8
        setCloudsTexture(texture)
      },
      undefined,
      () => {
        // Clouds are optional, continue without them
      }
    )
  }, [])

  useFrame((_, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.01
    }
  })

  if (!cloudsTexture) return null

  return (
    <mesh ref={cloudsRef} scale={[1.01, 1.01, 1.01]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        map={cloudsTexture}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}

// 3D marker pin
function MapPin({ position, color = '#ff4136' }: { position: THREE.Vector3; color?: string }) {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Pin stem */}
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.025, 0.12, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Pin head */}
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.035, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Pulse ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <ringGeometry args={[0.04, 0.055, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// Interactive marker with tooltip
function InteractiveMarker({ 
  position, 
  label, 
  sublabel, 
  color = '#00e5ff', 
  onClick 
}: { 
  position: THREE.Vector3
  label: string
  sublabel?: string
  color?: string
  onClick?: () => void 
}) {
  const [hovered, setHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const scale = hovered ? 1.5 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <octahedronGeometry args={[0.02, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
        />
      </mesh>
      
      {hovered && (
        <Html
          position={[0, 0.08, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'var(--font-fk-grotesk-neue)',
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
  useFrame((_, delta) => {
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

  // Get color for polygons based on advisory level or visa requirement
  const getPolygonColor = useCallback((poly: PolyAdv | VisaPolygon) => {
    if (selectedCountry && poly.properties?.name === selectedCountry) return '#ffeb3b'
    if (hoveredCountry && poly.properties?.name === hoveredCountry) return '#ffffff'
    
    if ('level' in poly) {
      // Advisory level colors
      const colors: Record<number, string> = { 
        1: '#4caf50',  // Green - Exercise Normal Precautions
        2: '#ffb300',  // Yellow - Exercise Increased Caution
        3: '#f4511e',  // Orange - Reconsider Travel
        4: '#b71c1c'   // Red - Do Not Travel
      }
      return colors[poly.level] || '#666'
    }
    
    if ('requirement' in poly) {
      // Visa requirement colors
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
      const start = latLngToVector3(arc.startLat, arc.startLng, 2.0)
      const end = latLngToVector3(arc.endLat, arc.endLng, 2.0)
      
      // Create smooth arc
      const points: THREE.Vector3[] = []
      const segments = 40
      for (let t = 0; t <= segments; t++) {
        const k = t / segments
        const point = new THREE.Vector3().lerpVectors(start, end, k)
        // Arc height based on distance
        const arcHeight = Math.sin(k * Math.PI) * 0.3
        point.normalize().multiplyScalar(point.length() + arcHeight)
        points.push(point)
      }
      
      return (
        <Line
          key={`arc-${i}`}
          points={points}
          color={arc.color}
          lineWidth={2}
          transparent
          opacity={0.7}
        />
      )
    })
  }, [visaArcs])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={1.0} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <pointLight position={[-5, -3, -5]} intensity={0.5} />

      {/* Fix scroll wheel zoom issue */}
      <OrbitControlsImpl
        ref={controlsRef}
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        autoRotate={false}
        enableDamping={true}
        dampingFactor={0.05}
        // Disable mouse wheel zoom to prevent scroll interference
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        // Only allow pinch zoom on touch devices
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
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
        
        {/* Atmosphere and clouds */}
        <Atmosphere color={atmosphereColor} />
        <Clouds opacity={0.3} />

        {/* Country polygons with proper colors */}
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
            
            return <MapPin position={position} color="#ffffff" />
          })()
        )}

        {/* Visa arcs */}
        {currentView === 'visaRequirements' && visaArcLines}

        {/* Airport markers */}
        {currentView === 'airports' && airports.map((airport, i) => {
          const position = latLngToVector3(airport.location.lat, airport.location.lng, 2.02)
          return (
            <InteractiveMarker
              key={`airport-${i}`}
              position={position}
              label={`${airport.code} - ${airport.name}`}
              sublabel={airport.displayLocation}
              color="#00e5ff"
              onClick={() => onAirportClick(airport)}
            />
          )
        })}

        {/* Restaurant markers */}
        {currentView === 'michelinRestaurants' && restaurants.map((restaurant, i) => {
          const position = latLngToVector3(restaurant.location.lat, restaurant.location.lng, 2.02)
          const color = restaurant.greenStar ? '#4caf50' : '#ffd700'
          return (
            <InteractiveMarker
              key={`restaurant-${i}`}
              position={position}
              label={restaurant.name}
              sublabel={`${'⭐'.repeat(restaurant.rating)} • ${restaurant.cuisine}`}
              color={color}
              onClick={() => onRestaurantClick(restaurant)}
            />
          )
        })}
      </group>
    </>
  )
}

export default TravelDataGlobeManual
