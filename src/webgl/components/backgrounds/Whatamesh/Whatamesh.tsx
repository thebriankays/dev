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
}

// Convert hex color to normalized RGB
function normalizeColor(hexCode: number): [number, number, number] {
  return [
    ((hexCode >> 16) & 255) / 255,
    ((hexCode >> 8) & 255) / 255,
    (255 & hexCode) / 255,
  ]
}

// Get color from CSS variable
function getCSSColor(varName: string): [number, number, number] | null {
  if (typeof window === 'undefined') return null
  
  const computed = getComputedStyle(document.documentElement)
  let hex = computed.getPropertyValue(varName).trim()
  
  if (!hex || hex.indexOf('#') === -1) return null
  
  // Handle shorthand hex
  if (hex.length === 4) {
    const hexTemp = hex.substring(1).split('').map(c => c + c).join('')
    hex = `#${hexTemp}`
  }
  
  const hexNum = parseInt(hex.substring(1), 16)
  return normalizeColor(hexNum)
}

export function Whatamesh({
  amplitude = 320,
  speed = 1,
  freqX = 0.00014,
  freqY = 0.00029,
  seed = 5,
  darkenTop = false,
  shadowPower = 5,
}: WhatameshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree()
  const startTime = useRef(Date.now())
  const colorsReady = useRef(false)
  
  // Create uniforms with proper structure matching original
  const uniforms = useMemo(() => {
    const baseUniforms: any = {
      u_time: { value: 0 },
      u_shadow_power: { value: shadowPower },
      u_darken_top: { value: darkenTop ? 1.0 : 0.0 },
      u_active_colors: { value: new THREE.Vector4(1, 1, 1, 1) },
      
      // Common uniforms from MiniGL
      resolution: { value: new THREE.Vector2(size.width, size.height) },
      aspectRatio: { value: size.width / size.height },
      projectionMatrix: { value: new THREE.Matrix4() },
      modelViewMatrix: { value: new THREE.Matrix4() },
      
      // Global noise settings
      u_global: {
        value: {
          noiseFreq: new THREE.Vector2(freqX, freqY),
          noiseSpeed: 0.000005,
        }
      },
      
      // Vertex deformation settings
      u_vertDeform: {
        value: {
          incline: Math.tan(0), // angle = 0
          offsetTop: -0.5,
          offsetBottom: -0.5,
          noiseFreq: new THREE.Vector2(3, 4),
          noiseAmp: amplitude,
          noiseSpeed: 10,
          noiseFlow: 3,
          noiseSeed: seed,
        }
      },
      
      // Base color (first color)
      u_baseColor: { value: new THREE.Vector3(0.4, 0.5, 1.0) },
      
      // Wave layers array (for colors 2-4)
      u_waveLayers_length: { value: 3 },
    }
    
    // Add wave layer uniforms for remaining 3 colors
    for (let i = 0; i < 3; i++) {
      baseUniforms[`u_waveLayers[${i}].color`] = { value: new THREE.Vector3(0.5, 0.3, 0.9) }
      baseUniforms[`u_waveLayers[${i}].noiseFreq`] = { 
        value: new THREE.Vector2(2 + (i+1)/4, 3 + (i+1)/4) 
      }
      baseUniforms[`u_waveLayers[${i}].noiseSpeed`] = { value: 11 + 0.3 * (i+1) }
      baseUniforms[`u_waveLayers[${i}].noiseFlow`] = { value: 6.5 + 0.3 * (i+1) }
      baseUniforms[`u_waveLayers[${i}].noiseSeed`] = { value: seed + 10 * (i+1) }
      baseUniforms[`u_waveLayers[${i}].noiseFloor`] = { value: 0.1 }
      baseUniforms[`u_waveLayers[${i}].noiseCeil`] = { value: 0.63 + 0.07 * (i+1) }
    }
    
    return baseUniforms
  }, [size, amplitude, speed, freqX, freqY, seed, darkenTop, shadowPower])
  
  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  }, [uniforms])
  
  // Update material ref
  useEffect(() => {
    materialRef.current = material
  }, [material])
  
  // Update resolution on resize
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.set(size.width, size.height)
      materialRef.current.uniforms.aspectRatio.value = size.width / size.height
    }
  }, [size])
  
  // Load colors from CSS variables
  useEffect(() => {
    const loadColors = () => {
      if (!materialRef.current) return
      
      const colorVars = [
        '--gradient-color-1',
        '--gradient-color-2', 
        '--gradient-color-3',
        '--gradient-color-4'
      ]
      
      const colors = colorVars.map(varName => getCSSColor(varName))
      
      // Check if all colors loaded
      if (colors.every(c => c !== null)) {
        // Set base color
        if (colors[0]) {
          materialRef.current.uniforms.u_baseColor.value.fromArray(colors[0])
        }
        
        // Set wave layer colors
        for (let i = 0; i < 3; i++) {
          if (colors[i + 1] && materialRef.current.uniforms[`u_waveLayers[${i}].color`]) {
            materialRef.current.uniforms[`u_waveLayers[${i}].color`].value.fromArray(colors[i + 1]!)
          }
        }
        
        colorsReady.current = true
      } else {
        // Retry after a short delay if CSS vars not ready
        setTimeout(loadColors, 100)
      }
    }
    
    loadColors()
    
    // Also listen for theme changes
    const observer = new MutationObserver(loadColors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    })
    
    return () => observer.disconnect()
  }, [])
  
  // Animation loop
  useFrame(() => {
    if (!materialRef.current) return
    
    // Update time - mimicking the original's time calculation
    const elapsed = Date.now() - startTime.current
    const t = 1253106 + elapsed * speed // Start from same value as original
    
    materialRef.current.uniforms.u_time.value = t
  })
  
  // Calculate mesh scale and segments
  const meshScale = useMemo(() => {
    // Match the original's size calculation
    return [size.width, size.height, 1]
  }, [size])
  
  const segments = useMemo(() => {
    // Match original's density settings [0.06, 0.16]
    const xSegCount = Math.ceil(size.width * 0.06)
    const ySegCount = Math.ceil(size.height * 0.16)
    return [xSegCount, ySegCount]
  }, [size])
  
  return (
    <mesh 
      ref={meshRef}
      position={[0, 0, -1000]} // Behind everything
      scale={[1, 1, 1]}
    >
      <planeGeometry args={[meshScale[0], meshScale[1], segments[0], segments[1]]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default Whatamesh