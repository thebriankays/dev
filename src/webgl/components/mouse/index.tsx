'use client'

import React, { useRef, useCallback, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMouse } from '@/providers/MouseFollower'
import { useWebGLRect } from '@/hooks/use-webgl-rect'

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
  const rect = useWebGLRect()
  const { viewport, camera } = useThree()
  
  const mousePosition = useRef(new THREE.Vector2())
  const mouseWorld = useRef(new THREE.Vector3())
  const isHovered = useRef(false)
  
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!rect || !interactive) return
    
    // Calculate mouse position relative to WebGL canvas
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
  }, [rect, interactive, normalizedCoords, viewport, camera, onMouseMove])
  
  const handleMouseEnter = useCallback(() => {
    if (!interactive) return
    isHovered.current = true
    mouse.addState('-webgl')
    onMouseEnter?.()
  }, [interactive, mouse, onMouseEnter])
  
  const handleMouseLeave = useCallback(() => {
    if (!interactive) return
    isHovered.current = false
    mouse.removeState('-webgl')
    onMouseLeave?.()
  }, [interactive, mouse, onMouseLeave])
  
  useEffect(() => {
    if (!interactive) return
    
    const element = rect?.element
    if (!element) return
    
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [rect, interactive, handleMouseMove, handleMouseEnter, handleMouseLeave])
  
  return <>{children}</>
}

// Hook to get mouse position in WebGL coordinates
export function useWebGLMouse(normalizedCoords = true) {
  const mouse = useRef(new THREE.Vector2())
  const rect = useWebGLRect()
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!rect) return
      
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      if (normalizedCoords) {
        mouse.current.x = (x / rect.width) * 2 - 1
        mouse.current.y = -(y / rect.height) * 2 + 1
      } else {
        mouse.current.x = x
        mouse.current.y = y
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [rect, normalizedCoords])
  
  return mouse.current
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
  
  useFrame(() => {
    if (!meshRef.current) return
    
    // Update position to follow mouse
    meshRef.current.position.x = (mouse.x * viewport.width) / 2
    meshRef.current.position.y = (mouse.y * viewport.height) / 2
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