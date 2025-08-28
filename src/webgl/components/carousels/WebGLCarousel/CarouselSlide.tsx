'use client'

import React, { useRef, useMemo, useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGSAP, useAnimation } from '@/providers/Animation'
import { useCanvas } from '@/providers/Canvas'
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
  const { requestRender } = useCanvas()
  const animation = useAnimation()
  
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

    const { gsap, ScrollTrigger } = animation

    context.add(() => {
      // Animate position
      gsap.to(meshRef.current!.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: () => requestRender(),
      })

      // Animate scale
      gsap.to(meshRef.current!.scale, {
        x: targetScale,
        y: targetScale,
        z: 1,
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: () => requestRender(),
      })

      // Animate material uniforms
      if (isActive) {
        gsap.to(materialRef.current!.uniforms.uOpacity, {
          value: 1,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => requestRender(),
        })
        gsap.to(materialRef.current!.uniforms.uBlur, {
          value: 0,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => requestRender(),
        })
        gsap.to(materialRef.current!.uniforms.uDistortion, {
          value: 0,
          duration: 1,
          ease: 'power2.out',
          onUpdate: () => requestRender(),
        })
      } else {
        gsap.to(materialRef.current!.uniforms.uOpacity, {
          value: 0.6,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => requestRender(),
        })
        gsap.to(materialRef.current!.uniforms.uBlur, {
          value: 0.002,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => requestRender(),
        })
        gsap.to(materialRef.current!.uniforms.uDistortion, {
          value: 0.1,
          duration: 1,
          ease: 'power2.out',
          onUpdate: () => requestRender(),
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
            onUpdate: () => requestRender(),
            onComplete: () => {
              gsap.set(materialRef.current!.uniforms.uTransition, { value: 0 })
              requestRender()
            },
          }
        )
      }
    })
  }, [isActive, targetPosition, targetScale, isTransitioning])

  // Frame updates
  useFrame(({ clock, pointer }: any) => {
    if (!materialRef.current) return

    // Use Tempus for time if available
    const time = animation.tempus ? animation.tempus.elapsed * 0.001 : clock.getElapsedTime()
    
    materialRef.current.uniforms.uTime.value = time
    
    // Use Hamo for smooth mouse interpolation
    if (animation.hamo) {
      materialRef.current.uniforms.uMouse.value.x = animation.hamo.lerp(
        materialRef.current.uniforms.uMouse.value.x,
        pointer.x,
        0.1
      )
      materialRef.current.uniforms.uMouse.value.y = animation.hamo.lerp(
        materialRef.current.uniforms.uMouse.value.y,
        pointer.y,
        0.1
      )
    } else {
      materialRef.current.uniforms.uMouse.value.lerp(pointer, 0.1)
    }
    
    // Add subtle floating animation for active slide
    if (isActive && meshRef.current) {
      meshRef.current.rotation.y = Math.sin(time * 0.3) * 0.02
      meshRef.current.position.y += Math.sin(time * 0.5) * 0.001
      requestRender()
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