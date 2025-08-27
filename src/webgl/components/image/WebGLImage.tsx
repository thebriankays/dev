'use client'

import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import vertexShader from './shaders/image.vert'
import fragmentShader from './shaders/image.frag'

interface WebGLImageProps {
  src: string
  rect: DOMRect | null
  distortion?: number
  parallax?: number
  hover?: boolean
  transition?: 'fade' | 'slide' | 'morph'
  scale?: number
}

export function WebGLImage({ 
  src, 
  rect,
  distortion = 0,
  parallax = 0.1,
  hover = true,
  transition = 'fade',
  scale = 1,
}: WebGLImageProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(src)
  const [hovered, setHovered] = useState(false)
  
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: texture },
        uDistortion: { value: distortion },
        uParallax: { value: parallax },
        uTime: { value: 0 },
        uHover: { value: 0 },
        uMouse: { value: new THREE.Vector2() },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTransition: { value: 0 },
      },
      side: THREE.DoubleSide,
      transparent: true,
    })
  }, [texture, distortion, parallax])
  
  // Update mesh position and scale based on DOM rect
  useEffect(() => {
    if (!meshRef.current || !rect) return
    
    // Convert DOM coordinates to WebGL coordinates
    const x = (rect.left + rect.width / 2) - window.innerWidth / 2
    const y = -(rect.top + rect.height / 2) + window.innerHeight / 2
    
    meshRef.current.position.set(x, y, 0)
    meshRef.current.scale.set(rect.width * scale, rect.height * scale, 1)
  }, [rect, scale])
  
  // Hover animations
  useEffect(() => {
    if (!material) return
    
    const targetValue = hovered && hover ? 1 : 0
    let animationId: number
    const startValue = material.uniforms.uHover.value
    const startTime = Date.now()
    const duration = 500
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = progress * progress * (3 - 2 * progress) // smoothstep
      
      material.uniforms.uHover.value = startValue + (targetValue - startValue) * eased
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      }
    }
    
    animate()
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [hovered, hover, material])
  
  useFrame(({ clock, pointer, size }) => {
    if (!material) return
    
    material.uniforms.uTime.value = clock.getElapsedTime()
    material.uniforms.uMouse.value.set(pointer.x, pointer.y)
    material.uniforms.uResolution.value.set(size.width, size.height)
    
    if (meshRef.current && parallax > 0 && rect) {
      const x = (rect.left + rect.width / 2) - window.innerWidth / 2
      const y = -(rect.top + rect.height / 2) + window.innerHeight / 2
      meshRef.current.position.x = x + pointer.x * parallax * rect.width
      meshRef.current.position.y = y + pointer.y * parallax * rect.height
    }
  })
  
  if (!rect) return null
  
  return (
    <mesh 
      ref={meshRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <planeGeometry args={[1, 1, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}