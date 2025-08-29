'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

export function PreserveBackgroundRenderer() {
  const { gl } = useThree()
  
  useEffect(() => {
    const originalRender = gl.render.bind(gl)
    let renderCount = 0
    
    // Override the render method to handle clearing per view
    gl.render = function(scene, camera) {
      const isScissorEnabled = gl.getParameter(gl.SCISSOR_TEST)
      
      if (isScissorEnabled) {
        // Always clear both buffers for Views to ensure proper rendering
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        
        // Debug log
        if (scene.background) {
          console.log('Rendering View with background:', scene.background)
        }
      } else {
        // Main canvas render - clear depth only on first render of frame
        if (renderCount === 0) {
          gl.clear(gl.DEPTH_BUFFER_BIT)
        }
      }
      
      // Call original render
      originalRender.call(this, scene, camera)
      
      // Reset render count if not in scissor test (main canvas render)
      if (!isScissorEnabled) {
        renderCount++
      }
    }
    
    // Reset render count each frame
    const resetCount = () => {
      renderCount = 0
      requestAnimationFrame(resetCount)
    }
    const rafId = requestAnimationFrame(resetCount)
    
    // Cleanup on unmount
    return () => {
      gl.render = originalRender
      cancelAnimationFrame(rafId)
    }
  }, [gl])
  
  return null
}