'use client'

import React, { useRef, useMemo } from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface ReflectionPlaneProps {
  size?: number
  position?: [number, number, number]
}

export function ReflectionPlane({ 
  size = 50, 
  position = [0, -3, 0] 
}: ReflectionPlaneProps) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <MeshReflectorMaterial
        resolution={1024}
        mirror={0.5}
        mixBlur={0.5}
        mixStrength={0.3}
        blur={300}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        depthScale={2}
        depthToBlurRatioBias={0.25}
        distortion={0.2}
        color="#101010"
        metalness={0.5}
        roughness={0.7}
        transparent
      />
    </mesh>
  )
}