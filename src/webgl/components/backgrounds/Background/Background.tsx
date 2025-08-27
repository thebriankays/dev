'use client'

import React, { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Mesh } from 'three'
import { useControls } from 'leva'

interface BackgroundControllerProps {
  children: React.ReactNode
  opacity?: number
  blendMode?: string
}

export function BackgroundController({ 
  children, 
  opacity = 1,
  blendMode = 'normal'
}: BackgroundControllerProps) {
  const meshRef = useRef<Mesh>(null)
  const { viewport } = useThree()
  
  // Leva controls for background
  const {
    bgOpacity,
    bgBlendMode,
  } = useControls('Background', {
    bgOpacity: { value: opacity, min: 0, max: 1, step: 0.01 },
    bgBlendMode: {
      value: blendMode,
      options: ['normal', 'add', 'multiply', 'screen', 'overlay'],
    },
  })
  
  // Update mesh scale to cover viewport
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(viewport.width, viewport.height, 1)
    }
  }, [viewport])
  
  // Update material opacity
  useEffect(() => {
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as any
      if ('opacity' in material) {
        material.opacity = bgOpacity
        material.transparent = bgOpacity < 1
      }
    }
  }, [bgOpacity])
  
  return (
    <group>
      <mesh ref={meshRef} position={[0, 0, -100]}>
        {children}
      </mesh>
    </group>
  )
}