'use client'

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { View } from '@react-three/drei'
import { VerticalMarquee } from '@/components/VerticalMarquee/VerticalMarquee'
import { BlockWrapper } from '../_shared/BlockWrapper'
import { useGSAP } from '@/providers/Animation'
import gsap from 'gsap'
import type { 
  PolyAdv, 
  VisaPolygon, 
  AirportData, 
  MichelinRestaurantData,
  CountryBorder 
} from './types'
import './TravelGlobe.scss'

const GLOBE_RADIUS = 100

// Color maps for different data types
const LEVEL_COLOR: Record<number, string> = {
  1: '#4caf50', // green
  2: '#ffb300', // amber
  3: '#f4511e', // deep-orange
  4: '#b71c1c', // red
}

const VISA_COLOR: Record<string, string> = {
  visa_free: '#4caf50',
  visa_on_arrival: '#8bc34a',
  e_visa: '#03a9f4',
  eta: '#00bcd4',
  visa_required: '#f4511e',
  no_admission: '#b71c1c',
}

// Convert lat/lng to 3D position on sphere
function latLngToVector3(lat: number, lng: number, radius: number, altitude = 0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const r = radius + altitude
  
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

// Convert GeoJSON polygon to Three.js BufferGeometry
function geoJsonToBufferGeometry(geoJson: any, radius: number, altitude = 0): THREE.BufferGeometry | null {
  if (!geoJson) return null
  
  try {
    const vertices: number[] = []
    const indices: number[] = []
    let vertexIndex = 0
    
    const processPolygon = (coordinates: number[][]) => {
      const baseIndex = vertexIndex
      const polygonVertices: THREE.Vector3[] = []
      
      // Convert coordinates to 3D vertices
      coordinates.forEach((coord) => {
        const [lng, lat] = coord
        const vector = latLngToVector3(lat, lng, radius, altitude)
        vertices.push(vector.x, vector.y, vector.z)
        polygonVertices.push(vector)
        vertexIndex++
      })
      
      // Simple triangulation using fan method (works for convex polygons)
      // For better results with complex polygons, use earcut.js
      for (let i = 1; i < polygonVertices.length - 1; i++) {
        indices.push(baseIndex, baseIndex + i, baseIndex + i + 1)
      }
    }
    
    // Handle different GeoJSON types
    if (geoJson.type === 'Feature') {
      if (geoJson.geometry.type === 'Polygon') {
        geoJson.geometry.coordinates[0].forEach((ring: number[][]) => {
          if (ring.length > 2) processPolygon(ring)
        })
      } else if (geoJson.geometry.type === 'MultiPolygon') {
        geoJson.geometry.coordinates.forEach((polygon: number[][][]) => {
          polygon[0].forEach((ring: number[][]) => {
            if (ring.length > 2) processPolygon(ring)
          })
        })
      }
    }
    
    if (vertices.length === 0) return null
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    if (indices.length > 0) {
      geometry.setIndex(indices)
    }
    geometry.computeVertexNormals()
    
    return geometry
  } catch (error) {
    console.error('Error converting GeoJSON:', error)
    return null
  }
}

interface GlobeSceneProps {
  polygons?: PolyAdv[] | VisaPolygon[]
  borders?: CountryBorder
  airports?: AirportData[]
  restaurants?: MichelinRestaurantData[]
  currentView: string
  selectedCountry?: string | null
  hoveredCountry?: string | null
  onCountryClick?: (name: string) => void
  onCountryHover?: (name: string | null) => void
  onAirportClick?: (airport: AirportData) => void
  onRestaurantClick?: (restaurant: MichelinRestaurantData) => void
  autoRotateSpeed?: number
  atmosphereColor?: string
}

// Globe Scene Component
const GlobeScene = forwardRef<any, GlobeSceneProps>(({
  polygons = [],
  borders,
  airports = [],
  restaurants = [],
  currentView,
  selectedCountry,
  hoveredCountry,
  onCountryClick,
  onCountryHover,
  onAirportClick,
  onRestaurantClick,
  autoRotateSpeed = 0.5,
  atmosphereColor = '#4a90e2',
}, ref) => {
  const globeRef = useRef<THREE.Group>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const countryMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const { camera, gl, raycaster, pointer } = useThree()
  
  // Create globe textures
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader()
    return {
      earth: loader.load('/textures/globe/earth-day.jpg', 
        undefined, 
        undefined, 
        () => console.log('Failed to load earth texture')
      ),
      bump: loader.load('/textures/globe/earth-bump.jpg',
        undefined,
        undefined,
        () => console.log('Failed to load bump texture')
      ),
      clouds: loader.load('/textures/globe/clouds.png',
        undefined,
        undefined,
        () => console.log('Failed to load clouds texture')
      ),
    }
  }, [])
  
  // Create country polygon meshes
  useEffect(() => {
    const meshes = new Map<string, THREE.Mesh>()
    
    polygons.forEach((poly) => {
      const geometry = geoJsonToBufferGeometry(poly, GLOBE_RADIUS, 0.5)
      if (!geometry) return
      
      let color = '#666666'
      if ('level' in poly && currentView === 'travelAdvisory') {
        color = LEVEL_COLOR[poly.level] || '#666666'
      } else if ('requirement' in poly && currentView === 'visaRequirements') {
        color = VISA_COLOR[poly.requirement] || '#666666'
      }
      
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      mesh.userData = { polygon: poly, name: poly.properties?.name }
      meshes.set(poly.properties?.name || `poly-${meshes.size}`, mesh)
    })
    
    countryMeshesRef.current = meshes
  }, [polygons, currentView])
  
  // Update country colors based on selection/hover
  useEffect(() => {
    countryMeshesRef.current.forEach((mesh, name) => {
      const material = mesh.material as THREE.MeshBasicMaterial
      const poly = mesh.userData.polygon
      
      // Base color
      let color = '#666666'
      let opacity = 0.6
      
      if ('level' in poly && currentView === 'travelAdvisory') {
        color = LEVEL_COLOR[poly.level] || '#666666'
        opacity = 0.7
      } else if ('requirement' in poly && currentView === 'visaRequirements') {
        color = VISA_COLOR[poly.requirement] || '#666666'
        opacity = 0.7
      }
      
      // Highlight selected/hovered
      if (name === selectedCountry) {
        opacity = 1
        material.emissive = new THREE.Color(color)
        material.emissiveIntensity = 0.3
      } else if (name === hoveredCountry) {
        opacity = 0.9
      }
      
      material.color = new THREE.Color(color)
      material.opacity = opacity
      material.needsUpdate = true
    })
  }, [selectedCountry, hoveredCountry, currentView])
  
  // Mouse interaction
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObjects(
        Array.from(countryMeshesRef.current.values())
      )
      
      if (intersects.length > 0) {
        const name = intersects[0].object.userData.name
        onCountryHover?.(name)
        gl.domElement.style.cursor = 'pointer'
      } else {
        onCountryHover?.(null)
        gl.domElement.style.cursor = 'auto'
      }
    }
    
    const handleClick = () => {
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObjects(
        Array.from(countryMeshesRef.current.values())
      )
      
      if (intersects.length > 0) {
        const name = intersects[0].object.userData.name
        onCountryClick?.(name)
      }
    }
    
    gl.domElement.addEventListener('pointermove', handlePointerMove)
    gl.domElement.addEventListener('click', handleClick)
    
    return () => {
      gl.domElement.removeEventListener('pointermove', handlePointerMove)
      gl.domElement.removeEventListener('click', handleClick)
    }
  }, [camera, gl, raycaster, pointer, onCountryClick, onCountryHover])
  
  // Animation
  useFrame((state, delta) => {
    if (globeRef.current && autoRotateSpeed) {
      globeRef.current.rotation.y += autoRotateSpeed * delta * 0.1
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += autoRotateSpeed * delta * 0.12
    }
  })
  
  // Imperative handle for parent control
  useImperativeHandle(ref, () => ({
    pointOfView: (coords: { lat?: number; lng?: number; altitude?: number }, duration = 1000) => {
      // Implementation for camera movement
    }
  }))
  
  return (
    <group ref={globeRef}>
      {/* Earth sphere */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={textures.earth}
          bumpMap={textures.bump}
          bumpScale={0.5}
          specularMap={textures.bump}
          specular={new THREE.Color(0x333333)}
          shininess={5}
        />
      </mesh>
      
      {/* Country polygons */}
      {Array.from(countryMeshesRef.current.values()).map((mesh, index) => (
        <primitive key={index} object={mesh} />
      ))}
      
      {/* Atmosphere */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color={atmosphereColor}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Clouds */}
      <mesh ref={cloudsRef} scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshBasicMaterial
          map={textures.clouds}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>
      
      {/* Airport/Restaurant markers */}
      {currentView === 'airports' && airports.map((airport, i) => (
        <mesh
          key={i}
          position={latLngToVector3(airport.location.lat, airport.location.lng, GLOBE_RADIUS, 1)}
          onClick={() => onAirportClick?.(airport)}
        >
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      ))}
      
      {currentView === 'michelinRestaurants' && restaurants.map((restaurant, i) => (
        <mesh
          key={i}
          position={latLngToVector3(restaurant.location.lat, restaurant.location.lng, GLOBE_RADIUS, 1)}
          onClick={() => onRestaurantClick?.(restaurant)}
        >
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color={
            restaurant.rating === 3 ? '#FFD700' :
            restaurant.rating === 2 ? '#C0C0C0' :
            restaurant.rating === 1 ? '#CD7F32' : '#4CAF50'
          } />
        </mesh>
      ))}
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[100, 50, 100]} intensity={0.8} />
      <directionalLight position={[-100, -50, -100]} intensity={0.3} />
    </group>
  )
})

GlobeScene.displayName = 'GlobeScene'

// Main TravelGlobe Client Component
export function TravelGlobeClient(props: any) {
  const containerRef = useRef<HTMLDivElement>(null)
  const globeRef = useRef<any>(null)
  
  const [currentView, setCurrentView] = useState(props.initialView || 'travelAdvisory')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  
  // Tab configuration
  const tabConfig = {
    travelAdvisory: { label: 'Travel Advisories', icon: '⚠️' },
    visaRequirements: { label: 'Visa Requirements', icon: '📑' },
    michelinRestaurants: { label: 'Michelin Restaurants', icon: '🍽️' },
    airports: { label: 'Airports', icon: '✈️' },
  }
  
  // Tab indicator offset
  const tabIndicatorOffset = useMemo(() => {
    const index = props.enabledViews.indexOf(currentView)
    return `${index * 182}px`
  }, [currentView, props.enabledViews])
  
  // GSAP animations
  useGSAP(() => {
    if (!containerRef.current) return
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }
    )
  }, [])
  
  // WebGL content for shared canvas
  const webglContent = (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 400]} />
      <OrbitControls
        enableZoom={true}
        minDistance={200}
        maxDistance={800}
        autoRotate={!selectedCountry}
        autoRotateSpeed={props.autoRotateSpeed || 0.5}
      />
      <GlobeScene
        ref={globeRef}
        polygons={props.advisoryPolygons || props.visaPolygons || []}
        borders={props.borders}
        airports={props.airports || []}
        restaurants={props.michelinRestaurants || []}
        currentView={currentView}
        selectedCountry={selectedCountry}
        hoveredCountry={hoveredCountry}
        onCountryClick={setSelectedCountry}
        onCountryHover={setHoveredCountry}
        onAirportClick={(airport) => {
          console.log('Airport clicked:', airport)
          setShowDetails(true)
        }}
        onRestaurantClick={(restaurant) => {
          console.log('Restaurant clicked:', restaurant)
          setShowDetails(true)
        }}
        autoRotateSpeed={props.autoRotateSpeed}
        atmosphereColor={props.atmosphereColor}
      />
    </>
  )
  
  return (
    <BlockWrapper
      className="travel-globe-block"
      glassEffect={props.glassEffect}
      fluidOverlay={props.fluidOverlay}
      webglContent={webglContent}
    >
      <div className="tdg-container" ref={containerRef}>
        {/* Vertical Marquee */}
        <div className="tdg-vertical-marquee">
          <VerticalMarquee
            text="Sweet Serenity Getaways • Travel Tools"
            animationSpeed={0.5}
            position="left"
          />
        </div>
        
        {/* Glass Tab Bar */}
        <div className="tdg-tabs-wrapper">
          <div
            className="tdg-tabs-container"
            style={{
              '--tab-indicator-offset': tabIndicatorOffset,
              '--tab-indicator-color': props.tabIndicatorColor,
            } as React.CSSProperties}
          >
            {props.enabledViews.map((view: string) => (
              <button
                key={view}
                className={`tdg-tab ${currentView === view ? 'tdg-tab--active' : ''}`}
                onClick={() => setCurrentView(view)}
              >
                <span className="tdg-tab-icon">
                  {tabConfig[view as keyof typeof tabConfig].icon}
                </span>
                <span className="tdg-tab-label">
                  {tabConfig[view as keyof typeof tabConfig].label}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Side Panel */}
        <aside className="tdg-info-panels">
          <div className="tdg-info-panel-glass">
            <div className="tdg-info-panel">
              <h3 className="tdg-panel-heading">
                {currentView === 'travelAdvisory' && '🌍 U.S. Travel Advisories'}
                {currentView === 'visaRequirements' && '📑 Select Passport Country'}
                {currentView === 'michelinRestaurants' && '🍽️ Michelin Star Restaurants'}
                {currentView === 'airports' && '✈️ International Airports'}
              </h3>
              
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tdg-search-input"
              />
              
              <div className="tdg-list-content">
                {selectedCountry && (
                  <div className="tdg-selected-info">
                    <h4>{selectedCountry}</h4>
                    <p>Click for more details...</p>
                  </div>
                )}
                <p className="tdg-placeholder">
                  Connect to data collections for live information
                </p>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Globe Container */}
        <div className="tdg-globe-pane">
          {/* WebGL content renders through BlockWrapper's View */}
        </div>
        
        {/* Detail Overlay */}
        {showDetails && (
          <aside className="tdg-detail-overlay">
            <div className="tdg-detail-glass">
              <div className="tdg-detail-header">
                <span className="tdg-detail-title">{selectedCountry || 'Details'}</span>
                <button 
                  className="tdg-detail-close"
                  onClick={() => setShowDetails(false)}
                >
                  ×
                </button>
              </div>
              <div className="tdg-detail-content">
                <p>Travel information will appear here.</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </BlockWrapper>
  )
}

export default TravelGlobeClient
