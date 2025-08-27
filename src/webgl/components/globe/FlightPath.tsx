import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { FlightRoute } from './types'

interface FlightPathProps {
  from: THREE.Vector3
  to: THREE.Vector3
  route: FlightRoute
  onClick: () => void
  animationSpeed?: number
  particleCount?: number
}

export function FlightPath({
  from,
  to,
  route,
  onClick,
  animationSpeed = 0.5,
  particleCount = 20,
}: FlightPathProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const lineRef = useRef<THREE.Line>(null)
  const progressRef = useRef(0)

  // Calculate arc path
  const arcPoints = useMemo(() => {
    const points: THREE.Vector3[] = []
    const distance = from.distanceTo(to)
    const midPoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5)
    
    // Calculate arc height based on distance
    const arcHeight = Math.min(distance * 0.5, 0.8)
    midPoint.multiplyScalar(1 + arcHeight / midPoint.length())

    // Create smooth curve
    const curve = new THREE.QuadraticBezierCurve3(from, midPoint, to)
    const curvePoints = curve.getPoints(50)
    
    return curvePoints
  }, [from, to])

  // Create particle geometry
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      // Distribute particles along the path
      const t = i / (particleCount - 1)
      const pointIndex = Math.floor(t * (arcPoints.length - 1))
      const point = arcPoints[pointIndex]
      
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
      
      // Color gradient from white to blue
      const color = new THREE.Color().setHSL(0.6, 0.8, 0.8 - t * 0.3)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
      
      // Size gradient
      sizes[i] = (1 - t) * 0.02 * (route.popularity / 100)
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    return geometry
  }, [arcPoints, particleCount, route.popularity])

  // Particle material
  const particleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.02,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    })
  }, [])

  // Line material with gradient
  const lineMaterial = useMemo(() => {
    const opacity = Math.min(0.3 + (route.frequency / 200) * 0.4, 0.7)
    return new THREE.LineBasicMaterial({
      color: new THREE.Color(0x4ECDC4),
      transparent: true,
      opacity: opacity,
      linewidth: 2,
    })
  }, [route.frequency])

  // Animate particles along path
  useFrame((state, delta) => {
    if (!particlesRef.current) return

    progressRef.current += delta * animationSpeed
    if (progressRef.current > 1) progressRef.current -= 1

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < particleCount; i++) {
      // Calculate position along curve with offset for each particle
      const t = (progressRef.current + i / particleCount) % 1
      const pointIndex = Math.floor(t * (arcPoints.length - 1))
      const point = arcPoints[pointIndex]
      
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <group onClick={onClick}>
      {/* Flight path line */}
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(arcPoints.flatMap(p => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={lineMaterial.color}
          transparent={lineMaterial.transparent}
          opacity={lineMaterial.opacity}
          linewidth={lineMaterial.linewidth}
        />
      </line>

      {/* Animated particles */}
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />
    </group>
  )
}