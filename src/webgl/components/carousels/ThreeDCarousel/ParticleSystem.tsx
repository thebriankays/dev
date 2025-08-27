'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Points, PointMaterial } from '@react-three/drei'

interface ParticleSystemProps {
  count?: number
  activeIndex: number
  total: number
  radius: number
  layout: string
}

export function ParticleSystem({
  count = 100,
  activeIndex,
  total,
  radius,
  layout
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null)
  
  // Generate particle positions and attributes
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // Position particles around the active item
      const angle = (activeIndex / total) * Math.PI * 2
      const spread = 5
      
      positions[i * 3] = (Math.random() - 0.5) * spread + Math.sin(angle) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread + Math.cos(angle) * radius
      
      // Golden/warm colors
      colors[i * 3] = 1.0 // R
      colors[i * 3 + 1] = Math.random() * 0.3 + 0.7 // G
      colors[i * 3 + 2] = Math.random() * 0.2 // B
      
      // Random sizes
      sizes[i] = Math.random() * 0.1 + 0.05
    }
    
    return { positions, colors, sizes }
  }, [count, activeIndex, total, radius])
  
  // Animate particles
  useFrame((state, delta) => {
    if (!pointsRef.current) return
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < count; i++) {
      // Float upward
      positions[i * 3 + 1] += delta * 0.5
      
      // Reset when too high
      if (positions[i * 3 + 1] > 5) {
        positions[i * 3 + 1] = -5
      }
      
      // Add some wave motion
      const time = state.clock.elapsedTime
      positions[i * 3] += Math.sin(time + i) * 0.01
      positions[i * 3 + 2] += Math.cos(time + i) * 0.01
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[particles.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}