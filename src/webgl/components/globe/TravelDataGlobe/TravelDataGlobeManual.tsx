'use client'

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl, Html, PerspectiveCamera } from '@react-three/drei'
import type { OrbitControls } from 'three-stdlib'
import gsap from 'gsap'

// Removed unused Countries import
import { latLngToVector3 } from './utils'
import type {
  PolyAdv,
  VisaPolygon,
  CountryBorder,
  AirportData,
  MichelinRestaurantData,
} from '@/blocks/TravelDataGlobeBlock/types'

interface AirlineRoute {
  src: { lat: number; lng: number; iata: string; name: string }
  dst: { lat: number; lng: number; iata: string; name: string }
  color: string
}

interface AirportMarker {
  iata: string
  lat: number
  lng: number
  name: string
  city: string
  country: string
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

// Helper function to create arc curve with animated dash
function createArcCurve(start: THREE.Vector3, end: THREE.Vector3, height: number = 0.3): THREE.CatmullRomCurve3 {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
  const distance = start.distanceTo(end)
  mid.normalize().multiplyScalar(2 + height * distance * 0.5) // Dynamic height based on distance
  return new THREE.CatmullRomCurve3([start, mid, end], false, 'catmullrom', 0.5)
}

// Animated Arc component for airline routes and visa requirements
function AnimatedArc({ start, end, color, dashSize = 0.02, gapSize = 0.01, animationSpeed = 0.5 }: {
  start: THREE.Vector3
  end: THREE.Vector3
  color: string
  dashSize?: number
  gapSize?: number
  animationSpeed?: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const curve = useMemo(() => createArcCurve(start, end, 0.3), [start, end])
  
  // Create custom shader material for animated dashes
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        dashSize: { value: dashSize },
        gapSize: { value: gapSize },
        time: { value: 0 },
        opacity: { value: 0.8 },
      },
      vertexShader: `
        varying float vLineDistance;
        void main() {
          vLineDistance = position.x;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float dashSize;
        uniform float gapSize;
        uniform float time;
        uniform float opacity;
        varying float vLineDistance;
        
        void main() {
          float totalSize = dashSize + gapSize;
          float modulo = mod(vLineDistance + time, totalSize);
          float alpha = modulo < dashSize ? opacity : 0.0;
          if (alpha == 0.0) discard;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [color, dashSize, gapSize])

  useFrame(({ clock }) => {
    if (material.uniforms) {
      material.uniforms.time.value = clock.getElapsedTime() * animationSpeed
    }
  })

  return (
    <mesh ref={meshRef}>
      <tubeGeometry args={[curve, 64, 0.002, 8, false]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
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
        glowColor: { value: new THREE.Color(color) },
        viewVector: { value: new THREE.Vector3() }
      },
      vertexShader: `
        uniform vec3 viewVector;
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPositionNormal = normalize((modelViewMatrix * vec4(position, 1.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform vec3 viewVector;
        varying vec3 vNormal;
        varying vec3 vPositionNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vPositionNormal), 1.5);
          gl_FragColor = vec4(glowColor, intensity * 0.3);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    })
  }, [color])
  
  useFrame(({ camera }) => {
    if (atmosphereMaterial.uniforms.viewVector) {
      atmosphereMaterial.uniforms.viewVector.value.copy(camera.position)
    }
  })

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
  const CLOUDS_ROTATION_SPEED = -0.0005

  React.useEffect(() => {
    if (cloudTexture) {
      cloudTexture.anisotropy = 16
    }
  }, [cloudTexture])

  useFrame(() => {
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
        opacity={0.4}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

// 3D Marker with hover info
function Marker({ 
  position, 
  label, 
  sublabel, 
  color = '#ff4136', 
  onClick,
  size = 1,
  visible = true
}: { 
  position: THREE.Vector3
  label: string
  sublabel?: string
  color?: string
  onClick?: () => void
  size?: number
  visible?: boolean
}) {
  const [hovered, setHovered] = React.useState(false)
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.lookAt(state.camera.position)
    }
  })

  if (!visible) return null

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
  selectedCountryCode: _selectedCountryCode,
  hoveredCountry: _hoveredCountry,
  passportCountry: _passportCountry,
  currentView,
  visaArcs,
  showMarkers,
  focusTarget,
}) => {
  const { camera, scene } = useThree()
  const controlsRef = useRef<OrbitControls>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [airlineRoutes, setAirlineRoutes] = useState<AirlineRoute[]>([])
  const [airportMarkers, setAirportMarkers] = useState<AirportMarker[]>([])
  const [hoveredRouteAirports, setHoveredRouteAirports] = useState<string[]>([])

  // Load airline routes when in airports view
  useEffect(() => {
    if (currentView === 'airports') {
      Promise.all([
        fetch('/airline-routes/airports.dat').then(res => res.text()),
        fetch('/airline-routes/routes.dat').then(res => res.text())
      ])
      .then(([airportsData, routesData]) => {
        // Parse airports data
        const airportMap = new Map<string, AirportMarker>()
        const airportLines = airportsData.split('\n')
        
        airportLines.forEach(line => {
          if (!line.trim()) return
          const parts = line.split(',')
          // Format: ID,Name,City,Country,IATA,ICAO,Lat,Lng,...
          if (parts.length >= 8) {
            const iata = parts[4]?.replace(/"/g, '') || ''
            const lat = parseFloat(parts[6])
            const lng = parseFloat(parts[7])
            const name = parts[1]?.replace(/"/g, '') || ''
            const city = parts[2]?.replace(/"/g, '') || ''
            const country = parts[3]?.replace(/"/g, '') || ''
            
            if (iata && !isNaN(lat) && !isNaN(lng)) {
              airportMap.set(iata, { iata, lat, lng, name, city, country })
            }
          }
        })

        // Parse routes data (only US outbound international)
        const routes: AirlineRoute[] = []
        const routeLines = routesData.split('\n')
        
        routeLines.forEach(line => {
          if (!line.trim()) return
          const parts = line.split(',')
          // Format: Airline,AirlineID,Source,SourceID,Dest,DestID,...
          if (parts.length >= 6) {
            const srcIata = parts[2]?.replace(/"/g, '') || ''
            const dstIata = parts[4]?.replace(/"/g, '') || ''
            
            const srcAirport = airportMap.get(srcIata)
            const dstAirport = airportMap.get(dstIata)
            
            // Only show US outbound international routes
            if (srcAirport && dstAirport && 
                srcAirport.country === 'United States' && 
                dstAirport.country !== 'United States') {
              routes.push({
                src: {
                  lat: srcAirport.lat,
                  lng: srcAirport.lng,
                  iata: srcAirport.iata,
                  name: srcAirport.name
                },
                dst: {
                  lat: dstAirport.lat,
                  lng: dstAirport.lng,
                  iata: dstAirport.iata,
                  name: dstAirport.name
                },
                color: '#00ff88' // Green for visa-free style, matching the globe.gl example
              })
            }
          }
        })

        setAirlineRoutes(routes)
        setAirportMarkers(Array.from(airportMap.values()))
      })
      .catch(err => {
        console.error('Error loading airline data:', err)
      })
    }
  }, [currentView])

  // Setup scene for transparency
  useEffect(() => {
    scene.background = null
  }, [scene])

  // Auto-rotation and depth clearing
  useFrame((_state, delta) => {
    if (groupRef.current && autoRotateSpeed > 0) {
      // Always rotate unless user is interacting with controls
      if (!selectedCountry && !focusTarget) {
        groupRef.current.rotation.y += autoRotateSpeed * delta
      }
    }
  })

  // Camera animation - FIX: Increased min distance to prevent texture stretch
  const flyToLocation = useCallback((lat: number, lng: number) => {
    const pos = latLngToVector3(lat, lng, 2)
    const distance = 4.5 // Increased from 3.5 to prevent texture blow-up
    
    gsap.to(camera.position, {
      x: pos.x * distance,
      y: pos.y * distance,
      z: pos.z * distance,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(0, 0, 0)
        camera.updateProjectionMatrix()
        if (controlsRef.current) {
          controlsRef.current.update()
        }
      }
    })
  }, [camera])

  // Focus target animation
  useEffect(() => {
    if (focusTarget) {
      flyToLocation(focusTarget.lat, focusTarget.lng)
    } else if (!selectedCountry) {
      // Reset camera with better default distance
      gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 8, // Increased from 6
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.lookAt(0, 0, 0)
          camera.updateProjectionMatrix()
          if (controlsRef.current) {
            controlsRef.current.update()
          }
        }
      })
    }
  }, [focusTarget, selectedCountry, flyToLocation, camera])

  // Selected country camera animation
  useEffect(() => {
    if (selectedCountry && !focusTarget) {
      const poly = polygons.find(p => p.properties?.name === selectedCountry)
      if (poly?.geometry?.coordinates) {
        const coords = poly.geometry.type === 'Polygon' 
          ? poly.geometry.coordinates[0]
          : poly.geometry.coordinates[0][0]
        
        if (coords && coords.length > 0) {
          let sumLat = 0, sumLng = 0, count = 0
          coords.forEach(([lng, lat]: number[]) => {
            sumLat += lat
            sumLng += lng
            count++
          })
          if (count > 0) {
            flyToLocation(sumLat / count, sumLng / count)
          }
        }
      }
    }
  }, [selectedCountry, focusTarget, polygons, flyToLocation])

  return (
    <>
      {/* Camera setup */}
      <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />
      
      {/* Controls with proper limits */}
      <OrbitControlsImpl 
        ref={controlsRef as React.MutableRefObject<OrbitControls>}
        enableZoom={true}
        minDistance={3.5}
        maxDistance={12}
        enablePan={false}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        autoRotate={false} // We handle rotation manually
        makeDefault
      />

      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} />

      <group ref={groupRef}>
        <GlobeSphere globeImageUrl={globeImageUrl} bumpImageUrl={bumpImageUrl} />
        <Atmosphere color={atmosphereColor} altitude={atmosphereAltitude} />
        <Clouds />

        {/* Country polygons with click detection */}
        {(currentView === 'travelAdvisory' || currentView === 'visaRequirements') && 
          polygons.map((poly, index) => {
            const coords = poly.geometry.type === 'Polygon' 
              ? poly.geometry.coordinates[0]
              : poly.geometry.coordinates[0]?.[0] || []
            
            if (!coords || coords.length < 3) return null
            
            const points: THREE.Vector3[] = []
            coords.forEach(([lng, lat]: number[]) => {
              points.push(latLngToVector3(lat as number, lng as number, 2.01))
            })
            
            // Close the polygon
            if (points.length > 0) points.push(points[0].clone())
            
            // Determine color based on type and selection
            let color = '#666666'
            if ('level' in poly) {
              const colors: Record<number, string> = { 1: '#4caf50', 2: '#ffb300', 3: '#f4511e', 4: '#b71c1c' }
              color = colors[poly.level] || '#4caf50'
            } else if ('requirement' in poly) {
              const colors: Record<string, string> = {
                visa_free: '#4caf50',
                visa_on_arrival: '#8bc34a',
                e_visa: '#03a9f4',
                eta: '#00bcd4',
                visa_required: '#f4511e',
                no_admission: '#b71c1c'
              }
              color = colors[poly.requirement] || '#666666'
            }
            
            // Highlight selected country
            if (poly.properties?.name === selectedCountry) {
              color = '#ffff00'
            }
            
            return (
              <lineLoop key={index}>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
                  />
                </bufferGeometry>
                <lineBasicMaterial 
                  color={color} 
                  transparent 
                  opacity={0.8}
                />
                <mesh
                  onClick={(e) => {
                    e.stopPropagation()
                    if (poly.properties?.name) {
                      onCountryClick(poly.properties.name)
                    }
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation()
                    document.body.style.cursor = 'pointer'
                    if (poly.properties?.name) {
                      onCountryHover(poly.properties.name)
                    }
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation()
                    document.body.style.cursor = 'auto'
                    onCountryHover(null)
                  }}
                >
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
                    />
                  </bufferGeometry>
                  <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
                </mesh>
              </lineLoop>
            )
          })
        }

        {/* Visa arcs with animation */}
        {currentView === 'visaRequirements' && visaArcs.map((arc, i) => {
          const start = latLngToVector3(arc.startLat, arc.startLng, 2.01)
          const end = latLngToVector3(arc.endLat, arc.endLng, 2.01)
          return (
            <AnimatedArc
              key={`visa-arc-${i}`}
              start={start}
              end={end}
              color={arc.color}
              dashSize={0.015}
              gapSize={0.01}
              animationSpeed={0.3}
            />
          )
        })}

        {/* Airline route arcs */}
        {currentView === 'airports' && airlineRoutes.map((route, i) => {
          const start = latLngToVector3(route.src.lat, route.src.lng, 2.01)
          const end = latLngToVector3(route.dst.lat, route.dst.lng, 2.01)
          return (
            <group 
              key={`route-${i}`}
              onPointerOver={() => setHoveredRouteAirports([route.src.iata, route.dst.iata])}
              onPointerOut={() => setHoveredRouteAirports([])}
            >
              <AnimatedArc
                start={start}
                end={end}
                color={route.color}
                dashSize={0.02}
                gapSize={0.015}
                animationSpeed={0.4}
              />
            </group>
          )
        })}

        {/* Airport markers - visible on hover or selection */}
        {currentView === 'airports' && airportMarkers.map((airport) => {
          const isHovered = hoveredRouteAirports.includes(airport.iata)
          const airportData = airports.find(a => a.code === airport.iata)
          const position = latLngToVector3(airport.lat, airport.lng, 2.02)
          
          return (
            <Marker
              key={airport.iata}
              position={position}
              label={`${airport.iata} - ${airport.name}`}
              sublabel={`${airport.city}, ${airport.country}`}
              color="#00ffff"
              onClick={() => airportData && onAirportClick(airportData)}
              size={isHovered ? 1.5 : 1}
              visible={isHovered || showMarkers}
            />
          )
        })}

        {/* Restaurant markers */}
        {currentView === 'michelinRestaurants' && showMarkers && restaurants.map((restaurant) => {
          const position = latLngToVector3(restaurant.location.lat, restaurant.location.lng, 2.02)
          return (
            <Marker
              key={restaurant.id}
              position={position}
              label={restaurant.name}
              sublabel={`${restaurant.cuisine} • ${restaurant.rating} ★`}
              color={restaurant.greenStar ? '#4caf50' : '#ffd700'}
              onClick={() => onRestaurantClick(restaurant)}
            />
          )
        })}

        {/* Selected country marker */}
        {showMarkers && selectedCountry && currentView === 'travelAdvisory' && (() => {
          const poly = polygons.find(p => p.properties?.name === selectedCountry)
          if (!poly?.geometry?.coordinates) return null
          
          const coords = poly.geometry.type === 'Polygon' 
            ? poly.geometry.coordinates[0]
            : poly.geometry.coordinates[0][0]
          
          if (!coords || coords.length === 0) return null
          
          let sumLat = 0, sumLng = 0, count = 0
          coords.forEach(([lng, lat]: number[]) => {
            sumLat += lat
            sumLng += lng
            count++
          })
          
          if (count > 0) {
            const position = latLngToVector3(sumLat / count, sumLng / count, 2.03)
            return (
              <Marker
                position={position}
                label={selectedCountry}
                color="#ff4136"
                size={1.2}
              />
            )
          }
          return null
        })()}
      </group>
    </>
  )
}

export default TravelDataGlobeManual
