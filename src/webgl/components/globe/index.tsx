'use client'

import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react'
import { useFrame, useThree, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { TextureLoader } from 'three'
import { useGSAP } from '@/providers/Animation'
import gsap from 'gsap'
import { ViewportRenderer } from '../view'
import { TravelDestination } from './TravelDestination'
import { FlightPath } from './FlightPath'
import { AtmosphereGlow } from './AtmosphereGlow'
import { ControlPanel } from './ControlPanel'
import { ParticleTrail } from './ParticleTrail'
import { useMouse } from '@/providers/MouseFollower'
import vertexShader from './shaders/globe.vert'
import fragmentShader from './shaders/globe.frag'
import atmosphereVertexShader from './shaders/atmosphere.vert'
import atmosphereFragmentShader from './shaders/atmosphere.frag'
import type { Destination, FlightRoute, FilterOptions } from './types'

interface TravelDataGlobeProps {
  destinations?: Destination[]
  routes?: FlightRoute[]
  interactive?: boolean
  autoRotate?: boolean
  rotationSpeed?: number
  showAtmosphere?: boolean
  showClouds?: boolean
  showNightLights?: boolean
  enableFilters?: boolean
  onDestinationClick?: (destination: Destination) => void
  onRouteClick?: (route: FlightRoute) => void
}

// Default travel data
const defaultDestinations: Destination[] = [
  { id: 'nyc', name: 'New York City', position: [40.7128, -74.0060], visitors: 62800000, category: 'city' },
  { id: 'paris', name: 'Paris', position: [48.8566, 2.3522], visitors: 38000000, category: 'city' },
  { id: 'tokyo', name: 'Tokyo', position: [35.6762, 139.6503], visitors: 31900000, category: 'city' },
  { id: 'london', name: 'London', position: [51.5074, -0.1278], visitors: 30000000, category: 'city' },
  { id: 'dubai', name: 'Dubai', position: [25.2048, 55.2708], visitors: 16700000, category: 'city' },
  { id: 'singapore', name: 'Singapore', position: [1.3521, 103.8198], visitors: 14700000, category: 'city' },
  { id: 'sydney', name: 'Sydney', position: [-33.8688, 151.2093], visitors: 13900000, category: 'city' },
  { id: 'rome', name: 'Rome', position: [41.9028, 12.4964], visitors: 10000000, category: 'historic' },
  { id: 'bali', name: 'Bali', position: [-8.4095, 115.1889], visitors: 6300000, category: 'beach' },
  { id: 'maldives', name: 'Maldives', position: [3.2028, 73.2207], visitors: 1700000, category: 'beach' },
]

const defaultRoutes: FlightRoute[] = [
  { id: 'nyc-london', from: 'nyc', to: 'london', frequency: 185, popularity: 95 },
  { id: 'london-paris', from: 'london', to: 'paris', frequency: 120, popularity: 90 },
  { id: 'tokyo-singapore', from: 'tokyo', to: 'singapore', frequency: 90, popularity: 85 },
  { id: 'dubai-london', from: 'dubai', to: 'london', frequency: 75, popularity: 80 },
  { id: 'nyc-paris', from: 'nyc', to: 'paris', frequency: 65, popularity: 75 },
  { id: 'sydney-singapore', from: 'sydney', to: 'singapore', frequency: 55, popularity: 70 },
]

export function TravelDataGlobe({
  destinations = defaultDestinations,
  routes = defaultRoutes,
  interactive = true,
  autoRotate = true,
  rotationSpeed = 0.001,
  showAtmosphere = true,
  showClouds = true,
  showNightLights = true,
  enableFilters = true,
  onDestinationClick,
  onRouteClick,
}: TravelDataGlobeProps) {
  const globeRef = useRef<THREE.Group>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const { size, camera } = useThree()
  const mouse = useMouse()
  
  const [hoveredDestination, setHoveredDestination] = useState<string | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterOptions>({
    categories: [],
    minVisitors: 0,
    showRoutes: true,
  })

  // Create placeholder textures while real ones load
  const [texturesLoaded, setTexturesLoaded] = useState(false)
  const [earthDayMap, setEarthDayMap] = useState<THREE.Texture | null>(null)
  const [earthNightMap, setEarthNightMap] = useState<THREE.Texture | null>(null)
  const [earthBumpMap, setEarthBumpMap] = useState<THREE.Texture | null>(null)
  const [earthSpecularMap, setEarthSpecularMap] = useState<THREE.Texture | null>(null)
  const [cloudsMap, setCloudsMap] = useState<THREE.Texture | null>(null)

  // Load textures with fallback
  useEffect(() => {
    const loader = new THREE.TextureLoader()
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    
    // Create gradient placeholder for earth
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#1a5f7a')
    gradient.addColorStop(0.3, '#2d8659')
    gradient.addColorStop(0.6, '#57c4ad')
    gradient.addColorStop(1, '#1a5f7a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add some land masses
    ctx.fillStyle = '#2d5016'
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width
      const y = Math.random() * canvas.height
      const w = Math.random() * 100 + 50
      const h = Math.random() * 50 + 25
      ctx.fillRect(x, y, w, h)
    }
    
    const placeholderTexture = new THREE.CanvasTexture(canvas)
    placeholderTexture.needsUpdate = true
    
    // Set placeholder textures immediately
    setEarthDayMap(placeholderTexture)
    setEarthNightMap(placeholderTexture)
    setEarthBumpMap(new THREE.Texture())
    setEarthSpecularMap(new THREE.Texture())
    setCloudsMap(new THREE.Texture())
    
    // Try to load real textures
    Promise.all([
      loader.loadAsync('/textures/globe/earth-day.jpg').catch(() => placeholderTexture),
      loader.loadAsync('/textures/globe/earth-night.jpg').catch(() => placeholderTexture),
      loader.loadAsync('/textures/globe/earth-bump.jpg').catch(() => new THREE.Texture()),
      loader.loadAsync('/textures/globe/earth-specular.jpg').catch(() => new THREE.Texture()),
      loader.loadAsync('/textures/globe/earth-clouds.jpg').catch(() => new THREE.Texture()),
    ]).then(([day, night, bump, specular, clouds]) => {
      setEarthDayMap(day)
      setEarthNightMap(night)
      setEarthBumpMap(bump)
      setEarthSpecularMap(specular)
      setCloudsMap(clouds)
      setTexturesLoaded(true)
    })
  }, [])

  // Create globe material
  const globeMaterial = useMemo(() => {
    if (!earthDayMap || !earthNightMap || !earthBumpMap || !earthSpecularMap) return null
    
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uDayTexture: { value: earthDayMap },
        uNightTexture: { value: earthNightMap },
        uBumpTexture: { value: earthBumpMap },
        uSpecularTexture: { value: earthSpecularMap },
        uTime: { value: 0 },
        uSunDirection: { value: new THREE.Vector3(1, 0.5, 0.5).normalize() },
        uShowNightLights: { value: showNightLights ? 1.0 : 0.0 },
        uAtmosphereColor: { value: new THREE.Color(0x4a90e2) },
      },
    })
  }, [earthDayMap, earthNightMap, earthBumpMap, earthSpecularMap, showNightLights])

  // Create atmosphere material
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAtmosphereColor: { value: new THREE.Color(0x4a90e2) },
        uIntensity: { value: 1.5 },
      },
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    })
  }, [])

  // Create clouds material
  const cloudsMaterial = useMemo(() => {
    if (!cloudsMap) return null
    
    return new THREE.MeshPhongMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    })
  }, [cloudsMap])

  // Filter destinations and routes based on current filters
  const filteredDestinations = useMemo(() => {
    return destinations.filter(dest => {
      if (filters.categories.length > 0 && !filters.categories.includes(dest.category)) {
        return false
      }
      if (dest.visitors < filters.minVisitors) {
        return false
      }
      return true
    })
  }, [destinations, filters])

  const filteredRoutes = useMemo(() => {
    if (!filters.showRoutes) return []
    
    return routes.filter(route => {
      const fromDest = filteredDestinations.find(d => d.id === route.from)
      const toDest = filteredDestinations.find(d => d.id === route.to)
      return fromDest && toDest
    })
  }, [routes, filteredDestinations, filters.showRoutes])

  // Convert lat/lon to 3D position
  const latLonToVector3 = (lat: number, lon: number, radius: number = 2) => {
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lon + 180) * (Math.PI / 180)
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta))
    const y = radius * Math.cos(phi)
    const z = radius * Math.sin(phi) * Math.sin(theta)
    
    return new THREE.Vector3(x, y, z)
  }

  // Handle mouse interactions
  useEffect(() => {
    if (!interactive) return

    const handleClick = (event: MouseEvent) => {
      // Raycasting logic for destination selection
      // Implementation would go here
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [interactive, filteredDestinations, onDestinationClick])

  // Animation
  useFrame((state, delta) => {
    if (!globeRef.current) return

    // Auto-rotate
    if (autoRotate) {
      globeRef.current.rotation.y += rotationSpeed
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += rotationSpeed * 1.1
      }
    }

    // Update shader uniforms
    if (globeMaterial && globeMaterial.uniforms) {
      globeMaterial.uniforms.uTime.value += delta
    }
    if (atmosphereMaterial.uniforms) {
      atmosphereMaterial.uniforms.uTime.value += delta
    }

    // Mouse influence
    if (interactive && mouse) {
      const targetRotationX = mouse.y * 0.2
      const targetRotationY = mouse.x * 0.2
      
      globeRef.current.rotation.x += (targetRotationX - globeRef.current.rotation.x) * 0.05
      globeRef.current.rotation.y += (targetRotationY - globeRef.current.rotation.y) * 0.05
    }
  })

  return (
    <group>
      <group ref={globeRef}>
        {/* Main globe */}
        {globeMaterial ? (
          <mesh material={globeMaterial}>
            <sphereGeometry args={[2, 64, 64]} />
          </mesh>
        ) : (
          <mesh>
            <sphereGeometry args={[2, 64, 64]} />
            <meshStandardMaterial color="#1a5f7a" wireframe />
          </mesh>
        )}

        {/* Clouds layer */}
        {showClouds && cloudsMaterial && (
          <mesh ref={cloudsRef} material={cloudsMaterial}>
            <sphereGeometry args={[2.02, 64, 64]} />
          </mesh>
        )}

        {/* Destinations */}
        {filteredDestinations.map(destination => (
          <TravelDestination
            key={destination.id}
            destination={destination}
            position={latLonToVector3(destination.position[0], destination.position[1])}
            isHovered={hoveredDestination === destination.id}
            isSelected={selectedDestination === destination.id}
            onHover={setHoveredDestination}
            onClick={() => {
              setSelectedDestination(destination.id)
              onDestinationClick?.(destination)
            }}
          />
        ))}

        {/* Flight paths */}
        {filteredRoutes.map(route => {
          const fromDest = destinations.find(d => d.id === route.from)
          const toDest = destinations.find(d => d.id === route.to)
          if (!fromDest || !toDest) return null

          return (
            <FlightPath
              key={route.id}
              from={latLonToVector3(fromDest.position[0], fromDest.position[1])}
              to={latLonToVector3(toDest.position[0], toDest.position[1])}
              route={route}
              onClick={() => onRouteClick?.(route)}
            />
          )
        })}
      </group>

      {/* Atmosphere */}
      {showAtmosphere && (
        <AtmosphereGlow
          ref={atmosphereRef}
          material={atmosphereMaterial}
          scale={1.15}
        />
      )}

      {/* Control panel */}
      {enableFilters && (
        <ControlPanel
          filters={filters}
          onFiltersChange={setFilters}
          destinations={destinations}
        />
      )}
    </group>
  )
}

// Wrapper component for ViewportRenderer
export function TravelDataGlobeWrapper(props: TravelDataGlobeProps) {
  return (
    <ViewportRenderer>
      <Suspense fallback={<LoadingGlobe />}>
        <TravelDataGlobe {...props} />
      </Suspense>
    </ViewportRenderer>
  )
}

// Loading component
function LoadingGlobe() {
  return (
    <mesh>
      <sphereGeometry args={[2, 32, 32]} />
      <meshBasicMaterial color="#1a1a1a" wireframe />
    </mesh>
  )
}

export default TravelDataGlobeWrapper