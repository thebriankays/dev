'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGSAP } from '@/providers/Animation'
import gsap from 'gsap'
import type { CarouselSlideData, TransitionEffect } from './types'
import { getTransitionShaders } from './shaders'

interface CarouselSlideProps {
  data: CarouselSlideData
  index: number
  currentIndex: number
  isTransitioning: boolean
  transitionEffect: TransitionEffect
}

export function CarouselSlide({
  data,
  index,
  currentIndex,
  isTransitioning,
  transitionEffect,
}: CarouselSlideProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const texture = useTexture(data.image)
  
  const isActive = index === currentIndex
  const isNext = index === (currentIndex + 1) % 3 // Assuming max 3 slides visible
  const isPrev = index === (currentIndex - 1 + 3) % 3

  // Get appropriate shaders based on transition effect
  const { vertexShader, fragmentShader } = useMemo(
    () => getTransitionShaders(transitionEffect),
    [transitionEffect]
  )

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: texture },
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uTransition: { value: 0 },
        uDistortion: { value: 0 },
        uMouse: { value: new THREE.Vector2() },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uParallax: { value: 0.1 },
        uOpacity: { value: 1 },
        uBlur: { value: 0 },
        uScale: { value: 1 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    })
  }, [texture, vertexShader, fragmentShader])

  // Update material ref
  useEffect(() => {
    materialRef.current = material
  }, [material])

  // Position and scale based on active state
  const targetPosition = useMemo(() => {
    if (isActive) return new THREE.Vector3(0, 0, 0)
    if (isNext) return new THREE.Vector3(800, 0, -200)
    if (isPrev) return new THREE.Vector3(-800, 0, -200)
    return new THREE.Vector3(0, 0, -1000)
  }, [isActive, isNext, isPrev])

  const targetScale = useMemo(() => {
    if (isActive) return 1
    if (isNext || isPrev) return 0.8
    return 0.5
  }, [isActive, isNext, isPrev])

  // GSAP animations for transitions
  useGSAP((context) => {
    if (!meshRef.current || !materialRef.current || !context) return

    context.add(() => {
      // Animate position
      gsap.to(meshRef.current!.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.2,
        ease: 'power2.inOut',
      })

      // Animate scale
      gsap.to(meshRef.current!.scale, {
        x: targetScale,
        y: targetScale,
        z: 1,
        duration: 1.2,
        ease: 'power2.inOut',
      })

      // Animate material uniforms
      if (isActive) {
        gsap.to(materialRef.current!.uniforms.uOpacity, {
          value: 1,
          duration: 0.8,
          ease: 'power2.out',
        })
        gsap.to(materialRef.current!.uniforms.uBlur, {
          value: 0,
          duration: 0.8,
          ease: 'power2.out',
        })
        gsap.to(materialRef.current!.uniforms.uDistortion, {
          value: 0,
          duration: 1,
          ease: 'power2.out',
        })
      } else {
        gsap.to(materialRef.current!.uniforms.uOpacity, {
          value: 0.6,
          duration: 0.8,
          ease: 'power2.out',
        })
        gsap.to(materialRef.current!.uniforms.uBlur, {
          value: 0.002,
          duration: 0.8,
          ease: 'power2.out',
        })
        gsap.to(materialRef.current!.uniforms.uDistortion, {
          value: 0.1,
          duration: 1,
          ease: 'power2.out',
        })
      }

      // Handle transition effect
      if (isTransitioning && isActive) {
        gsap.fromTo(
          materialRef.current!.uniforms.uTransition,
          { value: 0 },
          {
            value: 1,
            duration: 1.2,
            ease: 'power2.inOut',
            onComplete: () => {
              gsap.set(materialRef.current!.uniforms.uTransition, { value: 0 })
            },
          }
        )
      }
    })
  }, [isActive, targetPosition, targetScale, isTransitioning])

  // Frame updates
  useFrame(({ clock, pointer }: any) => {
    if (!materialRef.current) return

    materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    materialRef.current.uniforms.uMouse.value.lerp(pointer, 0.1)
    
    // Add subtle floating animation for active slide
    if (isActive && meshRef.current) {
      meshRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.02
      meshRef.current.position.y += Math.sin(clock.getElapsedTime() * 0.5) * 0.001
    }
  })

  // Calculate aspect ratio for proper sizing
  const aspectRatio = texture.image.width / texture.image.height
  const width = 600
  const height = width / aspectRatio

  return (
    <mesh
      ref={meshRef}
      position={[targetPosition.x, targetPosition.y, targetPosition.z]}
      scale={[targetScale, targetScale, 1]}
    >
      <planeGeometry args={[width, height, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}