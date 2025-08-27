'use client'

import React, { useRef, useState, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useGSAP } from '@/providers/Animation'
import * as THREE from 'three'
import gsap from 'gsap'
import vertexShader from './shaders/image.vert'
import fragmentShader from './shaders/image.frag'
import { useMouse } from '@/providers/MouseFollower'

interface WebGLImageProps {
  src: string
  distortion?: number
  parallax?: number
  hover?: boolean
  transition?: 'fade' | 'slide' | 'morph'
  scale?: number
  position?: [number, number, number]
}

export function WebGLImage({ 
  src, 
  distortion = 0,
  parallax = 0.1,
  hover = true,
  transition = 'fade',
  scale = 1,
  position = [0, 0, 0],
}: WebGLImageProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useTexture(src)
  const [hovered, setHovered] = useState(false)
  const mouse = useMouse()
  
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
  
  useGSAP((context) => {
    if (!material || !context) return
    
    if (hovered && hover) {
      context.add(() => {
        gsap.to(material.uniforms.uHover, {
          value: 1,
          duration: 0.5,
          ease: 'power2.out'
        })
      })
      mouse.addState('-media')
    } else {
      context.add(() => {
        gsap.to(material.uniforms.uHover, {
          value: 0,
          duration: 0.5,
          ease: 'power2.out'
        })
      })
      mouse.removeState('-media')
    }
  }, [hovered, hover, material, mouse])
  
  useFrame(({ clock, pointer, size }: any) => {
    if (!material) return
    
    material.uniforms.uTime.value = clock.getElapsedTime()
    material.uniforms.uMouse.value.set(pointer.x, pointer.y)
    material.uniforms.uResolution.value.set(size.width, size.height)
    
    if (meshRef.current && parallax > 0) {
      meshRef.current.position.x = position[0] + pointer.x * parallax
      meshRef.current.position.y = position[1] + pointer.y * parallax
    }
  })
  
  return (
    <mesh 
      ref={meshRef}
      position={position}
      scale={scale}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <planeGeometry args={[1, 1, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}