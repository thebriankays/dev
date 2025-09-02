'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { latLngToVector3 } from './utils'

interface ArcData {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color?: string
  altitude?: number
  dashLength?: number
  dashGap?: number
  dashAnimateTime?: number
}

interface ArcsProps {
  data: ArcData[]
  radius: number
}

// Create a gradient texture programmatically
const createGradientTexture = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Create gradient from white (head) to transparent (tail)
  const gradient = ctx.createLinearGradient(0, 0, 256, 0)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.1)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)')
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)')
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.9, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 1)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

interface AnimatedArcProps {
  startPos: THREE.Vector3
  endPos: THREE.Vector3
  color: string
  altitude: number
  animateTime: number
  dashLength: number
  dashGap: number
}

const AnimatedArc: React.FC<AnimatedArcProps> = ({ 
  startPos, 
  endPos, 
  color, 
  altitude,
  animateTime = 2000,
  dashLength = 0.35,
  dashGap = 0.15
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const textureRef = useRef<THREE.Texture | null>(null)
  
  // Create the arc curve with higher peak for longer distances
  const tubeGeometry = useMemo(() => {
    const distance = startPos.distanceTo(endPos)
    const arcHeight = altitude * (0.5 + distance * 0.25) // Higher arcs for longer distances
    
    // Calculate midpoint for the arc peak
    const midPoint = new THREE.Vector3()
      .addVectors(startPos, endPos)
      .multiplyScalar(0.5)
    
    // Push midpoint outward to create arc height
    midPoint.normalize().multiplyScalar(midPoint.length() * (1 + arcHeight))
    
    // Create a curved path using CatmullRom for smoother arcs
    const arcCurve = new THREE.CatmullRomCurve3([startPos, midPoint, endPos])
    
    // Create tube geometry along the curve
    const tubeGeometry = new THREE.TubeGeometry(
      arcCurve,
      64, // segments
      0.005, // radius of tube
      8, // radial segments
      false // closed
    )
    
    return tubeGeometry
  }, [startPos, endPos, altitude])

  // Create gradient texture on mount
  useEffect(() => {
    const texture = createGradientTexture()
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping
      texture.repeat.set(1 / dashLength, 1)
      textureRef.current = texture
    }
    
    return () => {
      texture?.dispose()
    }
  }, [dashLength])

  // Animate the texture offset for moving dash effect
  useFrame((state) => {
    if (materialRef.current && textureRef.current && animateTime > 0) {
      const time = state.clock.getElapsedTime() * 1000
      const phase = (time % animateTime) / animateTime
      
      // Animate texture offset to create moving effect
      textureRef.current.offset.x = -phase * (1 + dashGap)
      
      // Pulse opacity for extra effect
      materialRef.current.opacity = 0.4 + Math.sin(phase * Math.PI * 2) * 0.2
    }
  })

  return (
    <mesh ref={meshRef} geometry={tubeGeometry}>
      <meshBasicMaterial
        ref={materialRef}
        map={textureRef.current}
        color={new THREE.Color(color)}
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Alternative implementation using Line for dashed lines (simpler but less fancy)
const DashedArc: React.FC<AnimatedArcProps> = ({ 
  startPos, 
  endPos, 
  color, 
  altitude,
  animateTime = 2000,
  dashLength = 0.4,
  dashGap = 0.2
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.LineDashedMaterial>(null)
  const dashOffset = useRef(0)
  
  const { geometry, line } = useMemo(() => {
    const distance = startPos.distanceTo(endPos)
    const arcHeight = altitude * (0.5 + distance * 0.25)
    
    const midPoint = new THREE.Vector3()
      .addVectors(startPos, endPos)
      .multiplyScalar(0.5)
    
    midPoint.normalize().multiplyScalar(midPoint.length() * (1 + arcHeight))
    
    const curve = new THREE.CatmullRomCurve3([startPos, midPoint, endPos])
    const points = curve.getPoints(50)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    
    const material = new THREE.LineDashedMaterial({
      color: new THREE.Color(color),
      dashSize: dashLength,
      gapSize: dashGap,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    })
    
    const line = new THREE.Line(geometry, material)
    line.computeLineDistances()
    materialRef.current = material
    
    return { geometry, line }
  }, [startPos, endPos, altitude, color, dashLength, dashGap])

  // Animate dash offset
  useFrame((state) => {
    if (materialRef.current && animateTime > 0) {
      const time = state.clock.getElapsedTime() * 1000
      const phase = (time % animateTime) / animateTime
      dashOffset.current = -phase * (dashLength + dashGap)
      // Note: dashOffset animation doesn't work well in Three.js R3F
      // The texture-based approach in AnimatedArc works better
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={line} />
    </group>
  )
}

export const Arcs: React.FC<ArcsProps> = ({ data, radius }) => {
  const USE_TUBE_ARCS = true // Set to false to use simpler dashed lines
  
  const arcs = useMemo(() => {
    return data.map((arc, index) => {
      const startPos = latLngToVector3(arc.startLat, arc.startLng, radius)
      const endPos = latLngToVector3(arc.endLat, arc.endLng, radius)
      
      return {
        key: `arc-${index}-${arc.startLat}-${arc.startLng}-${arc.endLat}-${arc.endLng}`,
        startPos,
        endPos,
        color: arc.color || '#4FC3F7',
        altitude: arc.altitude || 0.15,
        animateTime: arc.dashAnimateTime || 2000,
        dashLength: arc.dashLength || 0.35,
        dashGap: arc.dashGap || 0.15
      }
    })
  }, [data, radius])
  
  const ArcComponent = USE_TUBE_ARCS ? AnimatedArc : DashedArc
  
  return (
    <group>
      {arcs.map((arc) => (
        <ArcComponent
          key={arc.key}
          startPos={arc.startPos}
          endPos={arc.endPos}
          color={arc.color}
          altitude={arc.altitude}
          animateTime={arc.animateTime}
          dashLength={arc.dashLength}
          dashGap={arc.dashGap}
        />
      ))}
    </group>
  )
}
