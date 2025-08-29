'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

export function PreserveBackgroundRenderer() {
  const clearedRef = useRef(false)
  
  // Clear depth buffer once per frame to ensure proper layering
  useFrame(({ gl }) => {
    if (!clearedRef.current) {
      const ctx = gl.getContext()
      ctx.clear(ctx.DEPTH_BUFFER_BIT)
      clearedRef.current = true
      // Reset flag next frame
      requestAnimationFrame(() => {
        clearedRef.current = false
      })
    }
  }, -1000) // High priority to run first
  
  return null
}