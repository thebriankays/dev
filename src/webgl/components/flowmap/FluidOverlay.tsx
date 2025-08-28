'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Flowmap } from './index'

interface FluidOverlayProps {
  intensity?: number
  color?: string
  opacity?: number
  blendMode?: 'normal' | 'additive' | 'multiply'
}

export function FluidOverlay({ 
  intensity = 0.1,
  color = '#ffffff',
  opacity = 0.3,
  blendMode = 'normal'
}: FluidOverlayProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  
  const material = useMemo(() => {
    const blending = {
      normal: THREE.NormalBlending,
      additive: THREE.AdditiveBlending,
      multiply: THREE.MultiplyBlending,
    }[blendMode]
    
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: opacity,
      blending,
    })
  }, [color, opacity, blendMode])
  
  useFrame(() => {
    if (!meshRef.current) return
    
    // Scale to cover viewport
    meshRef.current.scale.set(viewport.width, viewport.height, 1)
  })
  
  return (
    <Flowmap type="flowmap" config={{ 
      falloff: 0.3 * intensity,
      alpha: 0.5,
      dissipation: 0.96,
    }}>
      <mesh 
        ref={meshRef}
        material={material}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[1, 1, 1, 1]} />
      </mesh>
    </Flowmap>
  )
}

// Export default for convenience
export default FluidOverlay