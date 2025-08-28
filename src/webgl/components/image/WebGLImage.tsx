'use client'

import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAnimation, useGSAP } from '@/providers/Animation'
import { useCanvas } from '@/providers/Canvas'
import vertexShader from './shaders/image.vert'
import fragmentShader from './shaders/image.frag'

interface WebGLImageProps {
  src: string
  distortion?: number
  parallax?: number
  hover?: boolean
  transition?: 'fade' | 'slide' | 'morph'
  scale?: number
}

export function WebGLImage({ 
  src, 
  distortion = 0,
  parallax = 0.1,
  hover = true,
  transition = 'fade',
  scale = 1,
}: WebGLImageProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(src)
  const [hovered, setHovered] = useState(false)
  const { viewport } = useThree()
  const { requestRender } = useCanvas()
  const animation = useAnimation()
  
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
        uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
        uTransition: { value: 0 },
        uScrollY: { value: 0 },
      },
      side: THREE.DoubleSide,
      transparent: true,
    })
  }, [texture, distortion, parallax, viewport])
  
  // Set up scroll animations
  useGSAP((context) => {
    if (!meshRef.current) return
    
    const { gsap, ScrollTrigger } = animation
    
    // Fade in on scroll
    ScrollTrigger.create({
      trigger: 'body', // Will be scoped to View bounds
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        material.uniforms.uScrollY.value = self.progress
        material.uniforms.uTransition.value = self.progress
        requestRender()
      },
    })
    
    // Scale animation on enter
    gsap.fromTo(
      meshRef.current.scale,
      { x: 0.9 * scale, y: 0.9 * scale, z: 1 },
      {
        x: scale,
        y: scale,
        z: 1,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: 'body',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        onUpdate: () => requestRender(),
      }
    )
  }, [])
  
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
    
    // Use Tempus for time if available
    const time = animation.tempus ? animation.tempus.elapsed * 0.001 : clock.getElapsedTime()
    material.uniforms.uTime.value = time
    
    // Use Hamo for smooth mouse interpolation
    if (animation.hamo) {
      material.uniforms.uMouse.value.x = animation.hamo.lerp(
        material.uniforms.uMouse.value.x,
        pointer.x,
        0.1
      )
      material.uniforms.uMouse.value.y = animation.hamo.lerp(
        material.uniforms.uMouse.value.y,
        pointer.y,
        0.1
      )
    } else {
      material.uniforms.uMouse.value.set(pointer.x, pointer.y)
    }
    
    material.uniforms.uResolution.value.set(size.width, size.height)
    
    // Parallax effect on mouse move
    if (meshRef.current && parallax > 0) {
      meshRef.current.position.x = pointer.x * parallax * viewport.width * 0.1
      meshRef.current.position.y = pointer.y * parallax * viewport.height * 0.1
    }
    
    // Always render when animating
    if (hovered || Math.abs(material.uniforms.uHover.value - (hovered ? 1 : 0)) > 0.01) {
      requestRender()
    }
  })
  
  return (
    <mesh 
      ref={meshRef}
      onPointerEnter={() => {
        setHovered(true)
        requestRender()
      }}
      onPointerLeave={() => {
        setHovered(false)
        requestRender()
      }}
      scale={[viewport.width, viewport.height, 1]}
    >
      <planeGeometry args={[1, 1, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}