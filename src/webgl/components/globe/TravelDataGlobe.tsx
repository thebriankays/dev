'use client'

import React, { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { useTexture } from '@react-three/drei'
import { Line } from '@react-three/drei'
import { useGSAP, useAnimation } from '@/providers/Animation'
import { useCanvas } from '@/providers/Canvas'

interface PolygonData {
  feature: any // GeoJSON feature
  color: string
  altitude?: number
  opacity?: number
  data?: any
}

interface PointData {
  lat: number
  lng: number
  color?: string
  size?: number
  altitude?: number
  data?: any
}

interface ArcData {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color?: string
  strokeWidth?: number
  altitude?: number
  data?: any
}

interface TravelDataGlobeProps {
  // Polygon (country) data
  polygonsData?: PolygonData[]
  polygonAltitude?: (d: PolygonData) => number
  polygonCapColor?: (d: PolygonData) => string
  polygonOpacity?: number
  onPolygonClick?: (polygon: PolygonData) => void
  onPolygonHover?: (polygon: PolygonData | null) => void
  
  // Point data (restaurants, airports)
  pointsData?: PointData[]
  pointAltitude?: (d: PointData) => number
  pointColor?: (d: PointData) => string
  pointRadius?: (d: PointData) => number
  onPointClick?: (point: PointData) => void
  
  // Arc data (flight routes)
  arcsData?: ArcData[]
  arcColor?: (d: ArcData) => string
  arcAltitude?: (d: ArcData) => number
  arcStroke?: (d: ArcData) => number
  
  // Globe settings
  globeImageUrl: string
  bumpImageUrl?: string
  cloudsImageUrl?: string
  showAtmosphere?: boolean
  atmosphereColor?: string
  atmosphereAltitude?: number
  
  // Controls
  autoRotateSpeed?: number
  enableZoom?: boolean
  enableRotate?: boolean
  enablePan?: boolean
  
  radius?: number
}

// Helper function to convert lat/lng to 3D coordinates
function latLngToVector3(lat: number, lng: number, radius: number, altitude: number = 0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const r = radius * (1 + altitude)
  
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  )
}

// Helper to create arc points
function createArcPoints(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  radius: number,
  altitude: number = 0.15,
  segments: number = 64
): THREE.Vector3[] {
  const points: THREE.Vector3[] = []
  
  const start = latLngToVector3(startLat, startLng, radius)
  const end = latLngToVector3(endLat, endLng, radius)
  
  // Calculate control point for the arc
  const mid = start.clone().add(end).normalize().multiplyScalar(radius * (1 + altitude))
  
  // Create curve
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  
  // Get points along the curve
  for (let i = 0; i <= segments; i++) {
    const point = curve.getPoint(i / segments)
    points.push(point)
  }
  
  return points
}

export function TravelDataGlobe({
  polygonsData = [],
  polygonAltitude = (d) => d.altitude || 0.01,
  polygonCapColor = (d) => d.color,
  polygonOpacity = 0.6,
  onPolygonClick,
  onPolygonHover,
  
  pointsData = [],
  pointAltitude = (d) => d.altitude || 0.01,
  pointColor = (d) => d.color || '#ffffff',
  pointRadius = (d) => d.size || 0.5,
  onPointClick,
  
  arcsData = [],
  arcColor = (d) => d.color || '#ffeb3b',
  arcAltitude = (d) => d.altitude || 0.15,
  arcStroke = (d) => d.strokeWidth || 1,
  
  globeImageUrl,
  bumpImageUrl,
  cloudsImageUrl,
  showAtmosphere = true,
  atmosphereColor = '#3a7ca5',
  atmosphereAltitude = 0.15,
  
  autoRotateSpeed = 0.5,
  enableZoom = true,
  enableRotate = true,
  enablePan = false,
  
  radius = 100,
}: TravelDataGlobeProps) {
  const globeRef = useRef<THREE.Group>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const { requestRender } = useCanvas()
  const animation = useAnimation()
  const rotationSpeed = useRef(autoRotateSpeed)
  const scrollProgress = useRef(0)
  
  // Load textures
  const textures = useTexture({
    map: globeImageUrl,
    bumpMap: bumpImageUrl || globeImageUrl,
  })
  
  // Set up scroll animations with GSAP
  useGSAP((context) => {
    if (!globeRef.current) return
    
    const { ScrollTrigger, gsap } = animation
    
    // Create scroll-based rotation
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        scrollProgress.current = self.progress
        requestRender() // Request render on scroll update
      },
    })
    
    // Animate globe scale on enter
    gsap.fromTo(
      globeRef.current.scale,
      { x: 0.8, y: 0.8, z: 0.8 },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.5,
        ease: 'power3.out',
        onUpdate: () => requestRender(),
      }
    )
    
    // Animate atmosphere opacity
    if (atmosphereRef.current) {
      gsap.fromTo(
        atmosphereRef.current.material,
        { opacity: 0 },
        {
          opacity: 0.1,
          duration: 2,
          ease: 'power2.inOut',
          onUpdate: () => requestRender(),
        }
      )
    }
  }, [])
  
  // Auto rotation with scroll influence and Hamo/Tempus integration
  useFrame((state, delta) => {
    if (globeRef.current && rotationSpeed.current) {
      // Combine auto rotation with scroll-based rotation
      const scrollInfluence = scrollProgress.current * Math.PI * 2
      const autoRotation = rotationSpeed.current * delta * 0.1
      
      // Use Hamo for smooth interpolation if available
      if (animation.hamo) {
        const targetRotation = globeRef.current.rotation.y + autoRotation + scrollInfluence
        globeRef.current.rotation.y = animation.hamo.lerp(
          globeRef.current.rotation.y,
          targetRotation,
          0.05
        )
      } else {
        globeRef.current.rotation.y += autoRotation
      }
      
      // Request render for continuous animation
      requestRender()
    }
  })
  
  // Create point meshes
  const pointMeshes = useMemo(() => {
    return pointsData.map((point, idx) => {
      const position = latLngToVector3(
        point.lat,
        point.lng,
        radius,
        pointAltitude(point)
      )
      
      return (
        <mesh
          key={`point-${idx}`}
          position={position}
          onClick={(e) => {
            e.stopPropagation()
            onPointClick?.(point)
          }}
        >
          <sphereGeometry args={[pointRadius(point), 16, 16]} />
          <meshPhongMaterial
            color={pointColor(point)}
            emissive={pointColor(point)}
            emissiveIntensity={0.5}
          />
        </mesh>
      )
    })
  }, [pointsData, radius, pointAltitude, pointRadius, pointColor, onPointClick])
  
  // Create arc lines
  const arcLines = useMemo(() => {
    return arcsData.map((arc, idx) => {
      const points = createArcPoints(
        arc.startLat,
        arc.startLng,
        arc.endLat,
        arc.endLng,
        radius,
        arcAltitude(arc)
      )
      
      return (
        <Line
          key={`arc-${idx}`}
          points={points}
          color={arcColor(arc)}
          lineWidth={arcStroke(arc)}
          transparent
          opacity={0.8}
        />
      )
    })
  }, [arcsData, radius, arcAltitude, arcColor, arcStroke])
  
  // Create country polygons (simplified as colored regions on sphere)
  // In a full implementation, you'd convert GeoJSON to 3D geometry
  const polygonMeshes = useMemo(() => {
    // This is a simplified version - in production you'd use proper GeoJSON to 3D conversion
    return polygonsData.map((polygon, idx) => {
      if (!polygon.feature?.properties?.ISO_A2) return null
      
      // For demo purposes, we'll create a small colored sphere at country center
      // In production, use libraries like d3-geo or three-geo to properly render polygons
      const lat = polygon.feature.properties.LAT || 0
      const lng = polygon.feature.properties.LON || 0
      
      if (!lat || !lng) return null
      
      const position = latLngToVector3(lat, lng, radius, polygonAltitude(polygon))
      
      return (
        <mesh
          key={`polygon-${idx}`}
          position={position}
          onClick={(e) => {
            e.stopPropagation()
            onPolygonClick?.(polygon)
          }}
          onPointerEnter={(e) => {
            e.stopPropagation()
            onPolygonHover?.(polygon)
          }}
          onPointerLeave={(e) => {
            e.stopPropagation()
            onPolygonHover?.(null)
          }}
        >
          <sphereGeometry args={[5, 16, 16]} />
          <meshPhongMaterial
            color={polygonCapColor(polygon)}
            transparent
            opacity={polygon.opacity || polygonOpacity}
          />
        </mesh>
      )
    }).filter(Boolean)
  }, [polygonsData, radius, polygonAltitude, polygonCapColor, polygonOpacity, onPolygonClick, onPolygonHover])
  
  return (
    <>
      {/* Controls */}
      <OrbitControls
        enableZoom={enableZoom}
        enablePan={enablePan}
        enableRotate={enableRotate}
        minDistance={radius * 1.2}
        maxDistance={radius * 4}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
      />
      
      {/* Globe group */}
      <group ref={globeRef}>
        {/* Earth sphere */}
        <mesh>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshPhongMaterial
            map={textures.map}
            bumpMap={textures.bumpMap}
            bumpScale={0.05}
            specular={new THREE.Color('#333')}
            shininess={5}
          />
        </mesh>
        
        {/* Atmosphere */}
        {showAtmosphere && (
          <mesh ref={atmosphereRef} scale={[1 + atmosphereAltitude, 1 + atmosphereAltitude, 1 + atmosphereAltitude]}>
            <sphereGeometry args={[radius, 64, 64]} />
            <meshPhongMaterial
              color={atmosphereColor}
              transparent
              opacity={0.1}
              side={THREE.BackSide}
            />
          </mesh>
        )}
        
        {/* Country polygons */}
        {polygonMeshes}
        
        {/* Points (restaurants, airports) */}
        {pointMeshes}
        
        {/* Arcs (flight routes) */}
        {arcLines}
      </group>
      
      {/* Lights */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 100, 100]} intensity={0.8} />
      <directionalLight position={[-100, -100, -100]} intensity={0.3} />
    </>
  )
}

export default TravelDataGlobe