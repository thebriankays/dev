'use client'

import React, { useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/**
 * Ensures background is preserved when rendering Views
 * Prevents whatamesh from being wiped
 */
export function PreserveBackgroundRenderer() {
  const { gl, camera } = useThree()
  
  useEffect(() => {
    // Critical: Don't clear the color buffer
    gl.autoClear = false
    gl.autoClearColor = false
    gl.autoClearDepth = true
    gl.autoClearStencil = true
    
    // Enable all layers on camera to see background
    camera.layers.enableAll()
  }, [gl, camera])
  
  return null
}
