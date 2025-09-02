'use client'

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
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
  selectedCountryCode: string | null
  hoveredCountry: string | null
  passportCountry: string | null
  currentView: 'travelAdvisory' | 'visaRequirements' | 'michelinRestaurants' | 'airports'

  visaRequirements: VisaRequirement[]
  showMarkers: boolean
  focusTarget: { lat: number; lng: number } | null
}

function GlobeSphere({ globeImageUrl, bumpImageUrl }: { globeImageUrl: string; bumpImageUrl: string }) {
  const [textures, setTextures] = useState<{ earth?: THREE.Texture; bump?: THREE.Texture }>({})
  const [error, setError] = useState(false)

  useEffect(() => {
    console.log('Loading textures:', { globeImageUrl, bumpImageUrl })
    const loader = new THREE.TextureLoader()
    Promise.all([
      new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(
          globeImageUrl, 
          (t) => {
            console.log('Earth texture loaded successfully')
            resolve(t)
          }, 
          undefined, 
          (err) => {
            console.error('Failed to load earth texture:', err)
            reject(new Error('earth fail'))
          }
        )
      }),
      new Promise<THREE.Texture | undefined>((resolve) => {
        loader.load(
          bumpImageUrl, 
          (t) => {
            console.log('Bump texture loaded successfully')
            resolve(t)
          }, 
          undefined, 
          () => {
            console.warn('Failed to load bump texture, continuing without it')
            resolve(undefined)
          }
        )
      }),
    ])
      .then(([earth, bump]) => {
        console.log('Textures loaded, setting state')
        setTextures({ earth, bump })
      })
      .catch((err) => {
        console.error('Failed to load textures:', err)
        setError(true)
      })
  }, [globeImageUrl, bumpImageUrl])

  if (error || !textures.earth) {
    return (
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial color="#2a4858" specular={new THREE.Color('#111111')} shininess={5} />
      </mesh>
    )
  }

  return (
    <mesh>
      <sphereGeometry args={[2, 64, 64]} />
      <meshPhongMaterial
        map={textures.earth}
        bumpMap={textures.bump}
        bumpScale={textures.bump ? 0.015 : 0}
        specularMap={textures.earth}
        specular={new THREE.Color('grey')}
        shininess={5}
      />
    </mesh>
  )
}

function CloudLayer() {
  const cloudsRef = useRef<THREE.Mesh>(null)
  const [cloudTexture, setCloudTexture] = useState<THREE.Texture | null>(null)
  useEffect(() => {
    new THREE.TextureLoader().load('/clouds.png', (t) => setCloudTexture(t), undefined, () => setCloudTexture(null))
  }, [])
  useFrame((_, delta) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.02
  })
  return (
    <mesh ref={cloudsRef} scale={[1.01, 1.01, 1.01]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshPhongMaterial map={cloudTexture || undefined} transparent opacity={cloudTexture ? 0.3 : 0.1} depthWrite={false} />
    </mesh>
  )
}

function Atmosphere({ color = '#ffffff', altitude = 0.15 }: { color?: string; altitude?: number }) {
  return (
    <mesh scale={[1 + altitude, 1 + altitude, 1 + altitude]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.BackSide} />
    </mesh>
  )
}

function getCentroidFromPoly(poly: any): { lat: number; lng: number } | null {
  if (!poly?.geometry?.coordinates) return null
  try {
    const coords = poly.geometry.type === 'Polygon' ? poly.geometry.coordinates[0] : poly.geometry.coordinates[0][0]
    let sumLat = 0
    let sumLng = 0
    coords.forEach(([lng, lat]: number[]) => {
      sumLat += lat
      sumLng += lng
    })
    return { lat: sumLat / coords.length, lng: sumLng / coords.length }
  } catch {
    return null
  }
}

function normalizeName(s: string) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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
  passportCountry,
  currentView,
  visaRequirements,
  showMarkers,
  focusTarget,
}) => {
  const { camera, gl, scene } = useThree()
  const controlsRef = useRef<any>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Force transparent background to kill the white canvas
  useEffect(() => {
    scene.background = null
    gl.setClearColor(0x000000, 0) // alpha 0
    gl.setClearAlpha(0)
    const canvas = gl.getContext().canvas as HTMLCanvasElement
    if (canvas) canvas.style.background = 'transparent'
  }, [gl, scene])

  // Auto-rotate when there's no selection or focus
  useFrame((_, delta) => {
    if (groupRef.current && !selectedCountry && !passportCountry && !focusTarget) {
      groupRef.current.rotation.y += delta * autoRotateSpeed * 0.1
    }
  })

  // Fly to a centroid (by ISO code first, then by name)
  const flyToCountry = useCallback((code: string | null, name: string | null) => {
    const byCode = code
      ? polygons.find((p: any) => (p.properties?.iso_a2 || '').toUpperCase() === code.toUpperCase())
      : null
    const poly = byCode || (name ? polygons.find((p: any) => normalizeName(p.properties?.name) === normalizeName(name)) : null)
    const cent = poly ? getCentroidFromPoly(poly) : null
    if (!cent) return
    const pos = latLngToVector3(cent.lat, cent.lng, 2)
    gsap.to(camera.position, {
      x: pos.x * 2,
      y: pos.y * 2,
      z: pos.z * 2,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(0, 0, 0)
        controlsRef.current?.update()
      },
    })
  }, [camera, polygons])

  // Fly to explicit lat/lng (restaurants/airports or external focus)
  const flyToLatLng = useCallback((lat: number, lng: number) => {
    const pos = latLngToVector3(lat, lng, 2)
    gsap.to(camera.position, {
      x: pos.x * 2,
      y: pos.y * 2,
      z: pos.z * 2,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(0, 0, 0)
        controlsRef.current?.update()
      },
    })
  }, [camera])

  // Respond to country selections & focus targets
  useEffect(() => {
    if (focusTarget) {
      flyToLatLng(focusTarget.lat, focusTarget.lng)
      return
    }
    if (currentView === 'visaRequirements' && passportCountry) {
      flyToCountry(null, passportCountry)
      return
    }
    if (selectedCountry || selectedCountryCode) {
      flyToCountry(selectedCountryCode, selectedCountry)
      return
    }
    // Reset camera
    gsap.to(camera.position, {
      x: 0,
      y: 0,
      z: 5,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(0, 0, 0)
        controlsRef.current?.update()
      },
    })
  }, [selectedCountry, selectedCountryCode, passportCountry, focusTarget, currentView, polygons, camera])

  const getPolygonColor = useMemo(() => {
    return (poly: PolyAdv | VisaPolygon) => {
      if (hoveredCountry && poly.properties?.name === hoveredCountry) return '#ffffff'
      if (selectedCountry && poly.properties?.name === selectedCountry) return '#ffeb3b'
      if ('level' in poly) {
        return ({ 1: '#4caf50', 2: '#ffb300', 3: '#f4511e', 4: '#b71c1c' } as any)[poly.level] || '#666'
      }
      if ('requirement' in poly) {
        return (
          {
            visa_free: '#4caf50',
            visa_on_arrival: '#8bc34a',
            e_visa: '#03a9f4',
            eta: '#00bcd4',
            visa_required: '#f4511e',
            no_admission: '#b71c1c',
          } as any
        )[poly.requirement] || '#666'
      }
      return '#333'
    }
  }, [hoveredCountry, selectedCountry])

  // Country marker (advisory view)
  const countryMarkerPosition = useMemo(() => {
    const byCode = selectedCountryCode
      ? (polygons as any[]).find(p => (p.properties?.iso_a2 || '').toUpperCase() === selectedCountryCode.toUpperCase())
      : null
    const poly = byCode || (selectedCountry ? (polygons as any[]).find(p => normalizeName(p.properties?.name) === normalizeName(selectedCountry)) : null)
    const cent = poly ? getCentroidFromPoly(poly) : null
    return cent ? latLngToVector3(cent.lat, cent.lng, 2.05) : null
  }, [selectedCountry, selectedCountryCode, polygons])

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      <pointLight position={[-5, -3, -5]} intensity={0.4} />

      <OrbitControlsImpl
        ref={controlsRef}
        enablePan={false}
        enableZoom={false}
        minDistance={3}
        maxDistance={10}
        autoRotate={!selectedCountry && !passportCountry && !focusTarget}
        autoRotateSpeed={autoRotateSpeed}
      />

      <group ref={groupRef}>
        <GlobeSphere globeImageUrl={globeImageUrl} bumpImageUrl={bumpImageUrl} />
        <CloudLayer />
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

        {currentView === 'visaRequirements' && passportCountry && (
          <VisaArcs visaRequirements={visaRequirements} passportCountry={passportCountry} polygons={polygons as any[]} radius={2} />
        )}

        {showMarkers && currentView === 'travelAdvisory' && countryMarkerPosition && (
          <group position={countryMarkerPosition}>
            <mesh>
              <coneGeometry args={[0.02, 0.08, 8]} />
              <meshBasicMaterial color="white" />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshBasicMaterial color="white" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.05, 0.08, 32]} />
              <meshBasicMaterial color="white" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )}

        {currentView === 'airports' &&
          airports.map((point, i) => {
            const position = latLngToVector3(point.location.lat, point.location.lng, 2.01)
            return (
              <mesh key={i} position={position} onClick={(e) => { e.stopPropagation(); onAirportClick(point) }}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshBasicMaterial color="#00ffff" />
              </mesh>
            )
          })}

        {currentView === 'michelinRestaurants' &&
          restaurants.map((point, i) => {
            const position = latLngToVector3(point.location.lat, point.location.lng, 2.01)
            const color = point.rating === 3 ? '#FFD700' : point.rating === 2 ? '#C0C0C0' : '#CD7F32'
            return (
              <mesh key={i} position={position} onClick={(e) => { e.stopPropagation(); onRestaurantClick(point) }}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshBasicMaterial color={color} />
              </mesh>
            )
          })}
      </group>

      <EffectComposer>
        <Bloom intensity={0.5} luminanceThreshold={0.9} luminanceSmoothing={0.025} />
      </EffectComposer>
    </>
  )
}

export default TravelDataGlobeManual
