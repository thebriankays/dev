'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGSAP } from '@/providers/Animation'
import * as THREE from 'three'
import gsap from 'gsap'
import vertexShader from './shaders/whatamesh.vert'
import fragmentShader from './shaders/whatamesh.frag'
import { useMouse } from '@/providers/MouseFollower'
import { ViewportRenderer } from '../view'

interface WhatameshProps {
  // Color configuration
  colorStart?: string
  colorEnd?: string
  colorAccent?: string
  
  // Animation configuration
  speed?: number
  amplitude?: number
  frequency?: number
  gradientSpeed?: number
  
  // Display configuration
  opacity?: number
  position?: [number, number, number]
  scale?: number
  segments?: number
  
  // Interactive features
  interactive?: boolean
  mouseInfluence?: boolean
}

export function Whatamesh({
  colorStart = '#667eea',
  colorEnd = '#764ba2',
  colorAccent = '#f093fb',
  speed = 0.3,
  amplitude = 0.5,
  frequency = 1.5,
  gradientSpeed = 0.2,
  opacity = 0.8,
  position = [0, 0, -500],
  scale = 1,
  segments = 128,
  interactive = true,
  mouseInfluence = true,
}: WhatameshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const mouse = useMouse()
  const { size } = useThree()
  
  // Convert hex colors to THREE.Color
  const colors = useMemo(() => ({
    start: new THREE.Color(colorStart),
    end: new THREE.Color(colorEnd),
    accent: new THREE.Color(colorAccent),
  }), [colorStart, colorEnd, colorAccent])
  
  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uColorStart: { value: colors.start },
        uColorEnd: { value: colors.end },
        uColorAccent: { value: colors.accent },
        uSpeed: { value: speed },
        uAmplitude: { value: amplitude },
        uFrequency: { value: frequency },
        uGradientSpeed: { value: gradientSpeed },
        uOpacity: { value: opacity },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  }, [colors, speed, amplitude, frequency, gradientSpeed, opacity])
  
  // Store material ref
  useEffect(() => {
    materialRef.current = material
  }, [material])
  
  // Calculate mesh scale based on viewport
  const meshScale = useMemo(() => {
    const aspect = size.width / size.height
    const baseScale = Math.max(size.width, size.height) / 100
    return [baseScale * aspect * scale, baseScale * scale, 1]
  }, [size, scale])
  
  // Animate properties
  useGSAP((context) => {
    if (!materialRef.current || !context) return
    
    // Fade in on mount
    context.add(() => {
      if (materialRef.current && 'uniforms' in materialRef.current) {
        gsap.from((materialRef.current as any).uniforms.uOpacity, {
        value: 0,
        duration: 2,
        ease: 'power2.out',
        })
      }
    })
    
    // Animate amplitude on hover (if interactive)
    if (interactive && mouseInfluence) {
      mouse.addState('-background')
    }
    
    return () => {
      if (interactive && mouseInfluence) {
        mouse.removeState('-background')
      }
    }
  }, [interactive, mouseInfluence, mouse])
  
  // Animation loop
  useFrame(({ clock, pointer }) => {
    if (!materialRef.current) return
    
    // Update time
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    
    // Update mouse position with smoothing
    if (mouseInfluence) {
      const targetX = (pointer.x + 1) * 0.5
      const targetY = (pointer.y + 1) * 0.5
      
      materialRef.current.uniforms.uMouse.value.x += 
        (targetX - materialRef.current.uniforms.uMouse.value.x) * 0.1
      materialRef.current.uniforms.uMouse.value.y += 
        (targetY - materialRef.current.uniforms.uMouse.value.y) * 0.1
    }
  })
  
  return (
    <mesh 
      ref={meshRef}
      position={position}
      scale={meshScale as any}
    >
      <planeGeometry args={[2, 2, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// Wrapper component for use with ViewportRenderer
export function WhatameshBackground(props: WhatameshProps) {
  return (
    <ViewportRenderer interactive={props.interactive}>
      <Whatamesh {...props} />
    </ViewportRenderer>
  )
}

// Export utilities for external control
export const WhatameshUtils = {
  // Update colors dynamically
  updateColors: (
    material: THREE.ShaderMaterial,
    colors: { start?: string; end?: string; accent?: string }
  ) => {
    if (colors.start) {
      material.uniforms.uColorStart.value = new THREE.Color(colors.start)
    }
    if (colors.end) {
      material.uniforms.uColorEnd.value = new THREE.Color(colors.end)
    }
    if (colors.accent) {
      material.uniforms.uColorAccent.value = new THREE.Color(colors.accent)
    }
  },
  
  // Update animation parameters
  updateAnimation: (
    material: THREE.ShaderMaterial,
    params: { speed?: number; amplitude?: number; frequency?: number }
  ) => {
    if (params.speed !== undefined) {
      material.uniforms.uSpeed.value = params.speed
    }
    if (params.amplitude !== undefined) {
      material.uniforms.uAmplitude.value = params.amplitude
    }
    if (params.frequency !== undefined) {
      material.uniforms.uFrequency.value = params.frequency
    }
  },
}

// Export default
export default Whatamesh