'use client'

import React, { useRef, useCallback, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMouse } from '@/providers/MouseFollower'
import { useCanvas } from '@/providers/Canvas'
import { useAnimation, useGSAP } from '@/providers/Animation'

interface WebGLMouseProps {
  children?: React.ReactNode
  interactive?: boolean
  onMouseMove?: (point: THREE.Vector2) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  normalizedCoords?: boolean
}

export function WebGLMouse({
  children,
  interactive = true,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  normalizedCoords = true,
}: WebGLMouseProps) {
  const mouse = useMouse()
  const { requestRender } = useCanvas()
  const { viewport, camera } = useThree()
  const animation = useAnimation()
  
  const mousePosition = useRef(new THREE.Vector2())
  const mouseWorld = useRef(new THREE.Vector3())
  const isHovered = useRef(false)
  const elementRef = useRef<HTMLElement | null>(null)
  
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!elementRef.current || !interactive) return
    
    const rect = elementRef.current.getBoundingClientRect()
    
    // Calculate mouse position relative to element
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    if (normalizedCoords) {
      // Normalized device coordinates (-1 to 1)
      mousePosition.current.x = (x / rect.width) * 2 - 1
      mousePosition.current.y = -(y / rect.height) * 2 + 1
    } else {
      // Pixel coordinates
      mousePosition.current.x = x
      mousePosition.current.y = y
    }
    
    // Calculate world position
    mouseWorld.current.set(
      (mousePosition.current.x * viewport.width) / 2,
      (mousePosition.current.y * viewport.height) / 2,
      0
    )
    mouseWorld.current.unproject(camera)
    
    onMouseMove?.(mousePosition.current)
    requestRender() // Request render on mouse move
  }, [interactive, normalizedCoords, viewport, camera, onMouseMove, requestRender])
  
  const handleMouseEnter = useCallback(() => {
    if (!interactive) return
    isHovered.current = true
    mouse.addState('-webgl')
    onMouseEnter?.()
    requestRender()
  }, [interactive, mouse, onMouseEnter, requestRender])
  
  const handleMouseLeave = useCallback(() => {
    if (!interactive) return
    isHovered.current = false
    mouse.removeState('-webgl')
    onMouseLeave?.()
    requestRender()
  }, [interactive, mouse, onMouseLeave, requestRender])
  
  // Set up scroll-based mouse interaction
  useGSAP((context) => {
    if (!interactive) return
    
    const { gsap } = animation
    
    // Find the nearest parent element with data-webgl attribute
    const findWebGLElement = () => {
      let el = elementRef.current
      while (el && !el.hasAttribute('data-webgl')) {
        el = el.parentElement
      }
      return el
    }
    
    elementRef.current = findWebGLElement() || document.body
    
    if (elementRef.current) {
      elementRef.current.addEventListener('mousemove', handleMouseMove)
      elementRef.current.addEventListener('mouseenter', handleMouseEnter)
      elementRef.current.addEventListener('mouseleave', handleMouseLeave)
    }
    
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('mousemove', handleMouseMove)
        elementRef.current.removeEventListener('mouseenter', handleMouseEnter)
        elementRef.current.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [interactive, handleMouseMove, handleMouseEnter, handleMouseLeave])
  
  return <>{children}</>
}

// Hook to get mouse position in WebGL coordinates
export function useWebGLMouse(normalizedCoords = true) {
  const mouse = useRef(new THREE.Vector2())
  const { requestRender } = useCanvas()
  const animation = useAnimation()
  const smoothMouse = useRef(new THREE.Vector2())
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = document.body.getBoundingClientRect()
      
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      if (normalizedCoords) {
        mouse.current.x = (x / window.innerWidth) * 2 - 1
        mouse.current.y = -(y / window.innerHeight) * 2 + 1
      } else {
        mouse.current.x = x
        mouse.current.y = y
      }
      
      requestRender()
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [normalizedCoords, requestRender])
  
  // Use Hamo for smooth interpolation
  useFrame(() => {
    if (animation.hamo) {
      smoothMouse.current.x = animation.hamo.lerp(
        smoothMouse.current.x,
        mouse.current.x,
        0.1
      )
      smoothMouse.current.y = animation.hamo.lerp(
        smoothMouse.current.y,
        mouse.current.y,
        0.1
      )
    } else {
      smoothMouse.current.copy(mouse.current)
    }
  })
  
  return smoothMouse.current
}

// Component for interactive mouse effects
export function MouseEffect({ 
  radius = 0.5,
  strength = 1.0,
  color = '#ffffff',
}: {
  radius?: number
  strength?: number
  color?: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const mouse = useWebGLMouse()
  const { viewport } = useThree()
  const animation = useAnimation()
  const { requestRender } = useCanvas()
  
  // Set up scroll-triggered effects
  useGSAP((context) => {
    if (!meshRef.current) return
    
    const { ScrollTrigger, gsap } = animation
    
    // Scale effect based on scroll
    ScrollTrigger.create({
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        if (!meshRef.current) return
        const scale = 1 + self.progress * 0.5
        meshRef.current.scale.setScalar(scale)
        requestRender()
      },
    })
    
    // Fade in on load
    gsap.fromTo(
      meshRef.current.material,
      { opacity: 0 },
      {
        opacity: strength * 0.2,
        duration: 1,
        ease: 'power2.out',
        onUpdate: () => requestRender(),
      }
    )
  }, [])
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Update position to follow mouse with Tempus time
    const time = animation.tempus ? animation.tempus.elapsed * 0.001 : state.clock.elapsedTime
    
    meshRef.current.position.x = (mouse.x * viewport.width) / 2
    meshRef.current.position.y = (mouse.y * viewport.height) / 2
    
    // Add subtle rotation
    meshRef.current.rotation.z = Math.sin(time) * 0.1
  })
  
  return (
    <mesh ref={meshRef} position-z={0.1}>
      <circleGeometry args={[radius, 32]} />
      <meshBasicMaterial 
        color={color} 
        transparent 
        opacity={strength * 0.2} 
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}