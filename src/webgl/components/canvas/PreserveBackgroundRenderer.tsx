'use client'

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

/**
 * Ensures background is preserved when rendering Views
 * Clears depth to prevent stamping while keeping Whatamesh
 */
export function PreserveBackgroundRenderer() {
  const { gl, camera, scene } = useThree()
  const lastClearFrame = useRef(0)

  useEffect(() => {
    // Critical settings to preserve Whatamesh background
    gl.autoClear = false
    gl.autoClearColor = false // Never clear color buffer
    gl.autoClearDepth = false // We'll manually control depth clearing
    gl.autoClearStencil = false

    // Ensure scene has no background
    scene.background = null

    // Enable all layers
    camera.layers.enableAll()
  }, [gl, camera, scene])

  // Clear depth buffer periodically to prevent stamping
  useFrame((state) => {
    // Get current frame number using elapsed time
    const currentFrame = Math.floor(state.clock.elapsedTime * 60) // Approximate frame count at 60fps

    // Clear depth buffer every frame to prevent globe stamping
    // but never clear color to preserve Whatamesh
    if (currentFrame !== lastClearFrame.current) {
      state.gl.clear(false, true, false) // clear color: false, depth: true, stencil: false
      lastClearFrame.current = currentFrame
    }
  }, -1) // Run early in the frame

  return null
}
