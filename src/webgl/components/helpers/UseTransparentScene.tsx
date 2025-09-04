'use client'

import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'

/**
 * Ensures the scene doesn't clear the canvas background
 */
export function UseTransparentScene() {
  const { gl, scene } = useThree()
  
  useLayoutEffect(() => {
    // No background on the scene
    scene.background = null
    // Don't let this view auto-clear
    gl.autoClear = false
  }, [gl, scene])
  
  return null
}
