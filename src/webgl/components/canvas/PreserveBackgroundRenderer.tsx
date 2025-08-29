'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

export function PreserveBackgroundRenderer() {
  const { gl, camera } = useThree()
  
  useEffect(() => {
    // Ensure autoClear is disabled to preserve Whatamesh background
    gl.autoClear = false
    
    // Enable all layers on camera to see Whatamesh
    camera.layers.enableAll()
  }, [gl, camera])
  
  return null
}