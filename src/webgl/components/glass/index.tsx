'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from './shaders/glass.vert'
import fragmentShader from './shaders/glass.frag'

export type GlassVariant = 'card' | 'panel' | 'subtle' | 'frost' | 'liquid'

interface GlassEffectProps {
  variant?: GlassVariant
  intensity?: number
  thickness?: number
  roughness?: number
  transmission?: number
  ior?: number
  chromaticAberration?: number
  distortion?: number
  scale?: number
}

export function GlassEffect({
  variant = 'panel',
  intensity = 0.5,
  thickness = 0.1,
  roughness = 0.1,
  transmission = 1.0,
  ior = 1.5,
  chromaticAberration = 0.02,
  distortion = 0.1,
  scale = 1,
}: GlassEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  
  // Variant-specific material properties
  const variantProps = useMemo(() => {
    switch (variant) {
      case 'card':
        return {
          transmission: 0.9,
          roughness: 0.05,
          thickness: 0.2,
          ior: 1.52,
          distortion: 0.05,
        }
      case 'panel':
        return {
          transmission: 0.95,
          roughness: 0.1,
          thickness: 0.15,
          ior: 1.5,
          distortion: 0.1,
        }
      case 'subtle':
        return {
          transmission: 0.7,
          roughness: 0.2,
          thickness: 0.05,
          ior: 1.3,
          distortion: 0.02,
        }
      case 'frost':
        return {
          transmission: 0.8,
          roughness: 0.4,
          thickness: 0.3,
          ior: 1.45,
          distortion: 0.15,
        }
      case 'liquid':
        return {
          transmission: 1.0,
          roughness: 0.0,
          thickness: 0.4,
          ior: 1.33,
          distortion: 0.2,
        }
      default:
        return {
          transmission: 0.95,
          roughness: 0.1,
          thickness: 0.15,
          ior: 1.5,
          distortion: 0.1,
        }
    }
  }, [variant])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: intensity },
        uThickness: { value: variantProps.thickness * thickness },
        uRoughness: { value: variantProps.roughness * roughness },
        uTransmission: { value: variantProps.transmission * transmission },
        uIOR: { value: variantProps.ior * ior },
        uChromaticAberration: { value: chromaticAberration },
        uDistortion: { value: variantProps.distortion * distortion },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uBackgroundTexture: { value: null },
      },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    })
  }, [
    variant,
    intensity,
    thickness,
    roughness,
    transmission,
    ior,
    chromaticAberration,
    distortion,
    variantProps,
  ])
  
  useFrame(({ clock, size }) => {
    if (!material) return
    
    material.uniforms.uTime.value = clock.getElapsedTime()
    material.uniforms.uResolution.value.set(size.width, size.height)
    
    // Scale mesh to viewport
    if (meshRef.current) {
      meshRef.current.scale.set(viewport.width * scale, viewport.height * scale, 1)
    }
  })
  
  return (
    <mesh ref={meshRef} position={[0, 0, -0.001]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}