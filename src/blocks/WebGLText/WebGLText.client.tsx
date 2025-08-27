'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import { Text } from 'troika-three-text'
import { useFrame } from '@react-three/fiber'
import { useGSAP } from '@/providers/Animation'
import * as THREE from 'three'
import gsap from 'gsap'
import vertexShader from '@/webgl/components/text/shaders/distortion.vert'
import fragmentShader from '@/webgl/components/text/shaders/distortion.frag'

interface WebGLTextClientProps {
  text: string
  fontSize: string
  effect: string
  webglEffects?: {
    distortion?: number
    parallax?: number
    hover?: boolean
  }
}

export function WebGLTextClient({ 
  text, 
  fontSize,
  effect,
  webglEffects = {},
}: WebGLTextClientProps) {
  const textRef = useRef<Text>(null)
  const mouse = useRef({ x: 0, y: 0 })
  
  // Map fontSize prop to actual size
  const sizeMap = {
    small: 24,
    medium: 48,
    large: 72,
    xlarge: 96,
  }
  
  const material = useMemo(() => {
    if (effect === 'distortion') {
      return new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uDistortion: { value: webglEffects.distortion || 0.5 },
          uMouse: { value: new THREE.Vector2() },
        },
        transparent: true,
      })
    }
    return null
  }, [effect, webglEffects.distortion])
  
  useEffect(() => {
    if (!textRef.current) return
    
    const textMesh = textRef.current
    textMesh.text = text
    textMesh.fontSize = sizeMap[fontSize as keyof typeof sizeMap] || 48
    textMesh.font = '/fonts/Humane-Bold.ttf'
    textMesh.anchorX = 'center'
    textMesh.anchorY = 'middle'
    textMesh.color = 0xffffff
    
    if (material) {
      textMesh.material = material
    }
    
    // Trigger sync
    textMesh.sync()
  }, [text, fontSize, material])
  
  useFrame(({ clock, pointer }) => {
    if (!material) return
    
    material.uniforms.uTime.value = clock.getElapsedTime()
    material.uniforms.uMouse.value.x = pointer.x
    material.uniforms.uMouse.value.y = pointer.y
  })
  
  useGSAP((context) => {
    if (!textRef.current || !context) return
    
    context.add(() => {
      // Entrance animation
      gsap.from(textRef.current!.position, {
        y: -100,
        duration: 1.5,
        ease: 'power3.out',
      })
      
      gsap.from(textRef.current!, {
        fillOpacity: 0,
        duration: 1.5,
        ease: 'power2.out',
      })
    })
  }, [])
  
  return (
    <primitive
      ref={textRef}
      object={new Text()}
      position={[0, 0, 0]}
    />
  )
}