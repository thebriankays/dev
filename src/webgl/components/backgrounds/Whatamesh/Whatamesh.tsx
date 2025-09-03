'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from './shaders/whatamesh.vert'
import fragmentShader from './shaders/whatamesh.frag'

// Custom geometry that includes uvNorm attribute
class WhatameshGeometry extends THREE.PlaneGeometry {
  constructor(width = 1, height = 1, widthSegments = 1, heightSegments = 1) {
    super(width, height, widthSegments, heightSegments)
    
    // Add uvNorm attribute (UV coordinates from -1 to 1)
    const uvNormArray = new Float32Array(this.attributes.uv.count * 2)
    const uvAttribute = this.attributes.uv
    
    for (let i = 0; i < uvAttribute.count; i++) {
      const u = uvAttribute.getX(i)
      const v = uvAttribute.getY(i)
      uvNormArray[i * 2] = u * 2 - 1      // Convert from [0,1] to [-1,1]
      uvNormArray[i * 2 + 1] = v * 2 - 1  // Convert from [0,1] to [-1,1]
    }
    
    this.setAttribute('uvNorm', new THREE.BufferAttribute(uvNormArray, 2))
  }
}

// Extend THREE to include our custom geometry
extend({ WhatameshGeometry })

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
  speed = 1.25,
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
  const timeRef = useRef(1253106) // Start time matching original
  const globalNoiseSpeed = 0.000005 // 5e-6 in decimal form
  
  // Parse colors from props or use defaults
  const sectionColors = useMemo(() => {
    if (colors && colors.length >= 4) {
      return colors.map(hex => {
        const num = parseInt(hex.replace('#', ''), 16)
        return normalizeColor(num)
      })
    }
    
    // Default Stripe gradient colors
    return [
      normalizeColor(0xef008f), // Base color - pink
      normalizeColor(0x6ec3f4), // Wave 1 - light blue
      normalizeColor(0x7038ff), // Wave 2 - purple  
      normalizeColor(0xffba27), // Wave 3 - orange
    ]
  }, [colors])
  
  // Create material with proper uniforms
  const material = useMemo(() => {
    // Prepare wave layer arrays
    const waveColors = sectionColors.slice(1).map(c => new THREE.Vector3(...c))
    const colorCount = sectionColors.length
    const waveNoiseFreq = [
      new THREE.Vector2(2 + 1/colorCount, 3 + 1/colorCount),
      new THREE.Vector2(2 + 2/colorCount, 3 + 2/colorCount),
      new THREE.Vector2(2 + 3/colorCount, 3 + 3/colorCount)
    ]
    const waveNoiseSpeed = [11.0, 11.3, 11.6]
    const waveNoiseFlow = [6.5, 6.8, 7.1]
    const waveNoiseSeed = [seed + 10, seed + 20, seed + 30]
    const waveNoiseFloor = [0.1, 0.1, 0.1]
    const waveNoiseCeil = [0.63, 0.70, 0.77]
    
    const uniforms = {
      // Core uniforms
      u_time: { value: timeRef.current },
      resolution: { value: new THREE.Vector2(size.width, size.height) },
      u_shadow_power: { value: shadowPower },
      u_darken_top: { value: darkenTop ? 1.0 : 0.0 },
      u_active_colors: { value: new THREE.Vector4(1, 1, 1, 1) }, // All colors active
      u_baseColor: { value: new THREE.Vector3(...sectionColors[0]) },
      
      // Global uniforms
      u_global_noiseFreq: { value: new THREE.Vector2(freqX, freqY) },
      u_global_noiseSpeed: { value: globalNoiseSpeed },
      
      // Vertex deform uniforms
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
      stencilWrite: false,
      colorWrite: true,
    })
  }, [size.width, size.height, sectionColors, shadowPower, darkenTop, freqX, freqY, amplitude, intensity, seed])
  
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
    
    // Update time exactly like the original
    const frameTime = Math.min(delta * 1000, 1000 / 15) // Cap at ~66ms
    timeRef.current += frameTime * speed
    material.uniforms.u_time.value = timeRef.current
  })
  
  // Calculate mesh scale to cover full viewport
  const meshScale = useMemo(() => {
    const frustumSize = size.height
    const aspect = size.width / size.height
    const width = frustumSize * aspect
    const height = frustumSize
    return [width * 1.2, height * 1.2, 1]
  }, [size])
  
  // Calculate segments based on density
  const segments = useMemo(() => {
    const densityX = 0.06
    const densityY = 0.16
    const xSegCount = Math.ceil(size.width * densityX)
    const ySegCount = Math.ceil(size.height * densityY)
    return [Math.max(10, xSegCount), Math.max(10, ySegCount)]
  }, [size])

  // Create geometry with uvNorm attribute
  const geometry = useMemo(() => {
    return new WhatameshGeometry(1, 1, segments[0], segments[1])
  }, [segments])

  return (
    <mesh 
      ref={meshRef}
      position={[0, 0, -2000]}
      scale={meshScale as [number, number, number]}
      renderOrder={-9999}
      frustumCulled={false}
      geometry={geometry}
      material={material}
    />
  )
}

export default Whatamesh