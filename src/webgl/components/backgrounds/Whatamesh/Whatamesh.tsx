'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from './shaders/whatamesh.vert'
import fragmentShader from './shaders/whatamesh.frag'

interface WhatameshProps {
  amplitude?: number
  speed?: number
  freqX?: number
  freqY?: number
  seed?: number
  darkenTop?: boolean
  shadowPower?: number
  animate?: boolean
  intensity?: number
  colors?: string[]
}

// Convert hex color to normalized RGB
function normalizeColor(hexCode: number): [number, number, number] {
  return [
    ((hexCode >> 16) & 255) / 255,
    ((hexCode >> 8) & 255) / 255,
    (255 & hexCode) / 255,
  ]
}

export function Whatamesh({
  amplitude = 320,
  speed = 0.5,
  freqX = 0.00014,
  freqY = 0.00029,
  seed = 5,
  darkenTop = false,
  shadowPower = 5,
  animate = true,
  intensity = 1,
  colors,
}: WhatameshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree()
  const startTime = useRef(Date.now())
  const timeRef = useRef(1253106) // Start time matching original
  
  // Parse colors from props or CSS variables
  const sectionColors = useMemo(() => {
    if (colors && colors.length >= 4) {
      return colors.map(hex => {
        const num = parseInt(hex.replace('#', ''), 16)
        return normalizeColor(num)
      })
    }
    
    // Default colors
    return [
      normalizeColor(0xdca8d8), // Light purple/pink
      normalizeColor(0xa3d3f9), // Light blue  
      normalizeColor(0xfcd6d6), // Light pink
      normalizeColor(0xeae2ff), // Light purple
    ]
  }, [colors])
  
  // Create material with array-based uniforms (simpler approach)
  const material = useMemo(() => {
    // Prepare wave layer arrays
    const waveColors = sectionColors.slice(1).map(c => new THREE.Vector3(...c))
    const waveNoiseFreq = [
      new THREE.Vector2(2.25, 3.25),
      new THREE.Vector2(2.5, 3.5),
      new THREE.Vector2(2.75, 3.75)
    ]
    const waveNoiseSpeed = [11.3, 11.6, 11.9]
    const waveNoiseFlow = [6.8, 7.1, 7.4]
    const waveNoiseSeed = [seed + 10, seed + 20, seed + 30]
    const waveNoiseFloor = [0.1, 0.1, 0.1]
    const waveNoiseCeil = [0.70, 0.77, 0.84]
    
    const uniforms = {
      // Core uniforms
      u_time: { value: timeRef.current },
      resolution: { value: new THREE.Vector2(size.width || 1920, size.height || 1080) },
      u_shadow_power: { value: shadowPower },
      u_darken_top: { value: darkenTop ? 1.0 : 0.0 },
      u_active_colors: { value: new THREE.Vector4(1, 1, 1, 1) },
      u_baseColor: { value: new THREE.Vector3(...sectionColors[0]) },
      
      // Global settings
      u_global_noiseFreq: { value: new THREE.Vector2(freqX, freqY) },
      u_global_noiseSpeed: { value: 0.000005 },
      
      // Vertex deform
      u_vertDeform_incline: { value: 0 },
      u_vertDeform_offsetTop: { value: -0.5 },
      u_vertDeform_offsetBottom: { value: -0.5 },
      u_vertDeform_noiseFreq: { value: new THREE.Vector2(3, 4) },
      u_vertDeform_noiseAmp: { value: amplitude * intensity },
      u_vertDeform_noiseSpeed: { value: 10 },
      u_vertDeform_noiseFlow: { value: 3 },
      u_vertDeform_noiseSeed: { value: seed },
      
      // Wave layers as arrays
      u_waveColors: { value: waveColors },
      u_waveNoiseFreq: { value: waveNoiseFreq },
      u_waveNoiseSpeed: { value: waveNoiseSpeed },
      u_waveNoiseFlow: { value: waveNoiseFlow },
      u_waveNoiseSeed: { value: waveNoiseSeed },
      u_waveNoiseFloor: { value: waveNoiseFloor },
      u_waveNoiseCeil: { value: waveNoiseCeil },
    }
    
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: false,
      depthWrite: false,
      depthTest: false,
    })
  }, [sectionColors, amplitude, freqX, freqY, seed, darkenTop, shadowPower, intensity, size])
  
  // Update material ref
  useEffect(() => {
    materialRef.current = material
  }, [material])
  
  // Update resolution on resize
  useEffect(() => {
    if (material) {
      material.uniforms.resolution.value.set(size.width, size.height)
      material.uniforms.u_shadow_power.value = size.width < 600 ? 5 : 6
    }
  }, [size, material])
  
  // Animation loop
  useFrame((state, delta) => {
    if (!material || !animate) return
    
    // Update time with proper speed
    timeRef.current += Math.min(delta * 1000, 1000 / 15) * speed
    material.uniforms.u_time.value = timeRef.current
  })
  
  // Calculate mesh scale to cover full viewport
  const meshScale = useMemo(() => {
    const width = size.width || 1920
    const height = size.height || 1080
    return [width, height, 1]
  }, [size])
  
  // Calculate segments based on density
  const segments = useMemo(() => {
    const width = size.width || 1920
    const height = size.height || 1080
    const xSegCount = Math.max(10, Math.ceil(width * 0.06))
    const ySegCount = Math.max(10, Math.ceil(height * 0.16))
    return [xSegCount, ySegCount]
  }, [size])

  return (
    <mesh 
      ref={meshRef}
      position={[0, 0, -1000]} // Position far behind content
      scale={meshScale as [number, number, number]}
      renderOrder={-1} // Ensure it renders first
    >
      <planeGeometry args={[1, 1, segments[0], segments[1]]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default Whatamesh
