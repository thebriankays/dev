'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from './fluid.vert'
import fragmentShader from './fluid.frag'
import { useFlowmap } from '@/webgl/components/flowmap'

interface FluidOverlayProps {
  intensity?: number
  color?: string
  scale?: number
}

export function FluidOverlay({
  intensity = 0.5,
  color = '#ffffff',
  scale = 1.1,
}: FluidOverlayProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { flowmap } = useFlowmap()
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uFlowmap: { value: null },
        uIntensity: { value: intensity },
        uColor: { value: new THREE.Color(color) },
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [intensity, color])
  
  useFrame(({ clock, size }: any) => {
    if (!material || !flowmap) return
    
    material.uniforms.uTime.value = clock.getElapsedTime()
    material.uniforms.uFlowmap.value = flowmap.getTexture()
    material.uniforms.uResolution.value.set(size.width, size.height)
  })
  
  return (
    <mesh ref={meshRef} scale={scale}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}