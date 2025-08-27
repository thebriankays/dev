'use client'

import { useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

interface RAFProps {
  render?: boolean
  priority?: number
}

export function RAF({ render = true, priority = 0 }: RAFProps) {
  const { gl, scene, camera, advance, frameloop, invalidate } = useThree()
  
  useEffect(() => {
    if (!render) return
    
    let animationId: number
    
    const animate = (time: number) => {
      if (frameloop === 'never') {
        advance(time)
        gl.render(scene, camera)
      }
      
      animationId = requestAnimationFrame(animate)
    }
    
    animationId = requestAnimationFrame(animate)
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [render, gl, scene, camera, advance, frameloop])
  
  // Use frame for demand-based rendering
  useFrame((state: any, delta: number) => {
    if (render && frameloop === 'demand') {
      invalidate()
    }
  }, priority)
  
  return null
}

export const useRaf = (callback: (time: number, delta: number) => void, priority = 0) => {
  useFrame((state: any, delta: number) => {
    callback(state.clock.elapsedTime, delta)
  }, priority)
}