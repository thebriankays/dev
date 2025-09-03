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
  const { size, invalidate } = useThree()
  const timeRef = useRef(1253106) // Start time matching original
  const globalNoiseSpeed = 5e-6 // Original speed value
  
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
  
  // Create material only once
  const material = useMemo(() => {
    // Use default colors for initial material
    const defaultColors = [
      normalizeColor(0xdca8d8), // Light purple/pink
      normalizeColor(0xa3d3f9), // Light blue  
      normalizeColor(0xfcd6d6), // Light pink
      normalizeColor(0xeae2ff), // Light purple
    ]
    
    // Initialize wave layers to match original structure
    const waveLayers = [];
    for (let i = 1; i < defaultColors.length; i++) {
      waveLayers.push({
        color: new THREE.Vector3(...defaultColors[i]),
        noiseFreq: new THREE.Vector2(
          2 + (i - 1) / defaultColors.length,
          3 + (i - 1) / defaultColors.length
        ),
        noiseSpeed: 11 + 0.3 * (i - 1),
        noiseFlow: 6.5 + 0.3 * (i - 1),
        noiseSeed: 5 + 10 * i, // Use default seed  
        noiseFloor: 0.1,
        noiseCeil: 0.63 + 0.07 * (i - 1)
      });
    }
    
    const uniforms = {
      // Core uniforms
      u_time: { value: timeRef.current },
      resolution: { value: new THREE.Vector2(1920, 1080) }, // Default resolution
      u_shadow_power: { value: 5 },
      u_darken_top: { value: 0.0 },
      u_active_colors: { value: new THREE.Vector4(1, 1, 1, 1) },
      u_baseColor: { value: new THREE.Vector3(...defaultColors[0]) },
      
      // Global uniforms
      u_global_noiseFreq: { value: new THREE.Vector2(0.00014, 0.00029) }, // Default freqX/Y
      u_global_noiseSpeed: { value: globalNoiseSpeed },
      
      // Vertex deform uniforms
      u_vertDeform_incline: { value: 0 },
      u_vertDeform_offsetTop: { value: -0.5 },
      u_vertDeform_offsetBottom: { value: -0.5 },
      u_vertDeform_noiseFreq: { value: new THREE.Vector2(3, 4) },
      u_vertDeform_noiseAmp: { value: 320 }, // Default amplitude
      u_vertDeform_noiseSpeed: { value: 10 },
      u_vertDeform_noiseFlow: { value: 3 },
      u_vertDeform_noiseSeed: { value: 5 }, // Default seed
      
      // Wave layers arrays
      u_waveLayers_color: { value: waveLayers.map(l => l.color) },
      u_waveLayers_noiseFreq: { value: waveLayers.map(l => l.noiseFreq) },
      u_waveLayers_noiseSpeed: { value: waveLayers.map(l => l.noiseSpeed) },
      u_waveLayers_noiseFlow: { value: waveLayers.map(l => l.noiseFlow) },
      u_waveLayers_noiseSeed: { value: waveLayers.map(l => l.noiseSeed) },
      u_waveLayers_noiseFloor: { value: waveLayers.map(l => l.noiseFloor) },
      u_waveLayers_noiseCeil: { value: waveLayers.map(l => l.noiseCeil) }
    }
    
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: false,
      depthWrite: false, // Don't write to depth buffer
      depthTest: false, // Don't test depth
      stencilWrite: false, // Don't write to stencil
      colorWrite: true, // Do write color
    })
  }, []) // Empty dependency array - create material only once
  
  // Update material ref
  useEffect(() => {
    materialRef.current = material
  }, [material])
  
  // Update uniforms when props change
  useEffect(() => {
    if (material) {
      // Update base color
      material.uniforms.u_baseColor.value = new THREE.Vector3(...sectionColors[0])
      
      // Update wave layers - matching original stripe gradient exactly
      const waveLayers = [];
      for (let i = 1; i < sectionColors.length && i < 4; i++) {
        waveLayers.push({
          color: new THREE.Vector3(...sectionColors[i]),
          noiseFreq: new THREE.Vector2(
            2 + (i - 1) / sectionColors.length,
            3 + (i - 1) / sectionColors.length
          ),
          noiseSpeed: 11 + 0.3 * (i - 1),
          noiseFlow: 6.5 + 0.3 * (i - 1),
          noiseSeed: seed + 10 * i,
          noiseFloor: 0.1,
          noiseCeil: 0.63 + 0.07 * (i - 1)
        });
      }
      
      // Update wave layer arrays
      material.uniforms.u_waveLayers_color.value = waveLayers.map(l => l.color);
      material.uniforms.u_waveLayers_noiseFreq.value = waveLayers.map(l => l.noiseFreq);
      material.uniforms.u_waveLayers_noiseSpeed.value = waveLayers.map(l => l.noiseSpeed);
      material.uniforms.u_waveLayers_noiseFlow.value = waveLayers.map(l => l.noiseFlow);
      material.uniforms.u_waveLayers_noiseSeed.value = waveLayers.map(l => l.noiseSeed);
      material.uniforms.u_waveLayers_noiseFloor.value = waveLayers.map(l => l.noiseFloor);
      material.uniforms.u_waveLayers_noiseCeil.value = waveLayers.map(l => l.noiseCeil);
      
      // Update other uniforms
      material.uniforms.u_shadow_power.value = shadowPower
      material.uniforms.u_darken_top.value = darkenTop ? 1.0 : 0.0
      material.uniforms.u_global_noiseFreq.value.set(freqX, freqY)
      material.uniforms.u_vertDeform_noiseAmp.value = amplitude * intensity
      material.uniforms.u_vertDeform_noiseSeed.value = seed
      
      // Force a re-render
      invalidate()
    }
  }, [material, sectionColors, shadowPower, darkenTop, freqX, freqY, amplitude, intensity, seed, invalidate])
  
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
    
    // Update time exactly like the original (delta in seconds, convert to ms)
    const frameTime = Math.min(delta * 1000, 1000 / 15) // Cap at ~66ms like original
    timeRef.current += frameTime * speed
    material.uniforms.u_time.value = timeRef.current
  })
  
  // Calculate mesh scale to cover full viewport
  const meshScale = useMemo(() => {
    // For orthographic camera, the frustum size equals the viewport height
    // and the width is height * aspect ratio
    const frustumSize = size.height
    const aspect = size.width / size.height
    const width = frustumSize * aspect
    const height = frustumSize
    
    // Add extra padding to ensure full coverage even with camera movement
    return [width * 1.2, height * 1.2, 1]
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
      position={[0, 0, -2000]} // Position far behind content
      scale={meshScale as [number, number, number]}
      renderOrder={-9999} // Ensure it renders first
      frustumCulled={false} // Always render
    >
      <planeGeometry args={[1, 1, segments[0], segments[1]]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default Whatamesh
