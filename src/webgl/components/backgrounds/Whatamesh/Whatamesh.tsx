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
  
  // Create uniforms with proper structure matching original Stripe gradient
  const uniforms = useMemo(() => {
    const baseUniforms: any = {
      u_time: { value: 1253106 }, // Start from same value as original
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
          incline: 0, // No incline (Math.tan(0) = 0)
          offsetTop: -0.5,
          offsetBottom: -0.5,
          noiseFreq: new THREE.Vector2(3, 4),
          noiseAmp: amplitude,
          noiseSpeed: 10,
          noiseFlow: 3,
          noiseSeed: seed,
        }
      },
      
      // Base color (first color) - default colors from original
      u_baseColor: { value: new THREE.Vector3(1, 0, 0) }, // Red
      
      // Wave layers array (for colors 2-4)
      u_waveLayers_length: { value: 3 },
    }
    
    // Add wave layer uniforms for remaining 3 colors
    const defaultColors = [
      [1, 0, 0],    // Red
      [1, 0, 1],    // Magenta  
      [0, 1, 0],    // Green
      [0, 0, 1],    // Blue
    ]
    
    for (let i = 0; i < 3; i++) {
      baseUniforms[`u_waveLayers[${i}].color`] = { 
        value: new THREE.Vector3(...defaultColors[i + 1]) 
      }
      baseUniforms[`u_waveLayers[${i}].noiseFreq`] = { 
        value: new THREE.Vector2(
          2 + (i + 1) / 4, 
          3 + (i + 1) / 4
        ) 
      }
      baseUniforms[`u_waveLayers[${i}].noiseSpeed`] = { value: 11 + 0.3 * (i + 1) }
      baseUniforms[`u_waveLayers[${i}].noiseFlow`] = { value: 6.5 + 0.3 * (i + 1) }
      baseUniforms[`u_waveLayers[${i}].noiseSeed`] = { value: seed + 10 * (i + 1) }
      baseUniforms[`u_waveLayers[${i}].noiseFloor`] = { value: 0.1 }
      baseUniforms[`u_waveLayers[${i}].noiseCeil`] = { value: 0.63 + 0.07 * (i + 1) }
    }
    
    return baseUniforms
  }, [size.width, size.height, amplitude, freqX, freqY, seed, darkenTop, shadowPower])
  
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
  
  // Update resolution and shadow power on resize
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.set(size.width, size.height)
      materialRef.current.uniforms.aspectRatio.value = size.width / size.height
      materialRef.current.uniforms.u_shadow_power.value = size.width < 600 ? 5 : 6
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
      
      // Get colors from CSS variables
      const computedStyle = getComputedStyle(document.documentElement)
      const colors: ([number, number, number] | null)[] = []
      
      for (const varName of colorVars) {
        let hex = computedStyle.getPropertyValue(varName).trim()
        
        if (hex && hex.indexOf('#') !== -1) {
          // Handle shorthand hex (#abc -> #aabbcc)
          if (hex.length === 4) {
            const hexTemp = hex.substring(1).split('').map(c => c + c).join('')
            hex = `#${hexTemp}`
          }
          
          // Convert to number and normalize
          const hexNum = parseInt(hex.substring(1), 16)
          colors.push(normalizeColor(hexNum))
        } else {
          colors.push(null)
        }
      }
      
      // Apply colors if all are loaded
      if (colors.every(c => c !== null)) {
        // Set base color (first color)
        if (colors[0]) {
          materialRef.current.uniforms.u_baseColor.value.fromArray(colors[0])
        }
        
        // Set wave layer colors (colors 2-4)
        for (let i = 0; i < 3; i++) {
          if (colors[i + 1] && materialRef.current.uniforms[`u_waveLayers[${i}].color`]) {
            materialRef.current.uniforms[`u_waveLayers[${i}].color`].value.fromArray(colors[i + 1]!)
          }
        }
      } else {
        // Use default colors if CSS vars not ready, retry after delay
        setTimeout(loadColors, 100)
      }
    }
    
    // Initial load
    loadColors()
    
    // Listen for theme changes
    const observer = new MutationObserver(loadColors)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    })
    
    return () => observer.disconnect()
  }, [])
  
  // Animation loop - mimics original timing
  useFrame(() => {
    if (!materialRef.current) return
    
    // Update time exactly like the original
    const elapsed = Date.now() - startTime.current
    const t = 1253106 + elapsed * speed
    
    materialRef.current.uniforms.u_time.value = t
  })
  
  // Calculate mesh scale to cover full viewport
  const meshScale = useMemo(() => {
    // Use viewport dimensions directly
    return [size.width, size.height, 1]
  }, [size])
  
  // Calculate segments based on density
  const segments = useMemo(() => {
    // Match original density settings [0.06, 0.16]
    const xSegCount = Math.ceil(size.width * 0.06)
    const ySegCount = Math.ceil(size.height * 0.16)
    return [xSegCount, ySegCount]
  }, [size])
  
  return (
    <mesh 
      ref={meshRef}
      position={[0, 0, -100]} // Position behind all other content
      scale={[1, 1, 1]}
    >
      <planeGeometry args={[meshScale[0], meshScale[1], segments[0], segments[1]]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default Whatamesh
