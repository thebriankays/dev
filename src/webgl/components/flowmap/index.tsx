'use client'

import React, { createContext, useContext, useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FlowmapPass } from './FlowmapPass'
import { FluidSimulation } from './FluidSimulation'

type FlowmapType = 'flowmap' | 'fluid'

interface FlowmapContextValue {
  flowmap: FlowmapPass | null
  fluid: FluidSimulation | null
  type: FlowmapType
  updatePointer: (point: THREE.Vector2) => void
  texture: THREE.Texture | null
}

const FlowmapContext = createContext<FlowmapContextValue | null>(null)

export const useFlowmap = (preferredType?: FlowmapType) => {
  const context = useContext(FlowmapContext)
  if (!context) {
    throw new Error('useFlowmap must be used within FlowmapProvider')
  }
  
  // Return the preferred type if available, otherwise return what's available
  if (preferredType === 'fluid' && context.fluid) {
    return context.fluid
  } else if (preferredType === 'flowmap' && context.flowmap) {
    return context.flowmap
  }
  
  // Return whichever is available
  return context.fluid || context.flowmap
}

interface FlowmapProviderProps {
  children: React.ReactNode
  type?: FlowmapType
  config?: {
    // Flowmap config
    falloff?: number
    alpha?: number
    dissipation?: number
    // Fluid config
    simRes?: number
    dyeRes?: number
    densityDissipation?: number
    velocityDissipation?: number
    pressureDissipation?: number
    curlStrength?: number
    radius?: number
    iterations?: number
  }
}

export function FlowmapProvider({ 
  children, 
  type = 'flowmap',
  config = {}
}: FlowmapProviderProps) {
  const flowmapRef = useRef<FlowmapPass | null>(null)
  const fluidRef = useRef<FluidSimulation | null>(null)
  const { gl, size } = useThree()
  const pointer = useRef(new THREE.Vector2())
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  
  // Mouse tracking for fluid simulation
  useEffect(() => {
    if (type !== 'fluid') return
    
    const handleMouseMove = (e: MouseEvent) => {
      if (fluidRef.current) {
        fluidRef.current.updateMouse(e)
      }
    }
    
    const handleMouseDown = (e: MouseEvent) => {
      if (fluidRef.current && fluidRef.current.pointers[0]) {
        fluidRef.current.pointers[0].isDown = true
      }
    }
    
    const handleMouseUp = (e: MouseEvent) => {
      if (fluidRef.current && fluidRef.current.pointers[0]) {
        fluidRef.current.pointers[0].isDown = false
      }
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (fluidRef.current) {
        fluidRef.current.updateMouse(e)
      }
    }
    
    const handleTouchStart = (e: TouchEvent) => {
      if (fluidRef.current && fluidRef.current.pointers[0]) {
        fluidRef.current.pointers[0].isDown = true
      }
    }
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (fluidRef.current && fluidRef.current.pointers[0]) {
        fluidRef.current.pointers[0].isDown = false
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [type])
  
  // Initialize flowmap or fluid based on type
  useEffect(() => {
    if (type === 'flowmap') {
      flowmapRef.current = new FlowmapPass(gl, size.width, size.height)
      setTexture(flowmapRef.current.getTexture())
    } else if (type === 'fluid') {
      fluidRef.current = new FluidSimulation(gl, {
        simRes: config.simRes,
        dyeRes: config.dyeRes,
        densityDissipation: config.densityDissipation,
        velocityDissipation: config.velocityDissipation,
        pressureDissipation: config.pressureDissipation,
        curlStrength: config.curlStrength,
        radius: config.radius,
        iterations: config.iterations,
      })
      setTexture(fluidRef.current.uniform.value)
    }
    
    return () => {
      flowmapRef.current?.dispose()
      fluidRef.current?.dispose()
    }
  }, [gl, size.width, size.height, type, config])
  
  // Update loop
  useFrame(({ clock }, delta) => {
    if (type === 'flowmap' && flowmapRef.current) {
      flowmapRef.current.update(delta, pointer.current)
      setTexture(flowmapRef.current.getTexture())
    } else if (type === 'fluid' && fluidRef.current) {
      fluidRef.current.update(delta)
      setTexture(fluidRef.current.uniform.value)
    }
  })
  
  const updatePointer = (point: THREE.Vector2) => {
    pointer.current.copy(point)
    
    // Also update fluid simulation if active
    if (type === 'fluid' && fluidRef.current) {
      const prevPointer = fluidRef.current.pointers[0]
      if (prevPointer) {
        const dx = point.x - prevPointer.x
        const dy = point.y - prevPointer.y
        fluidRef.current.splat(point.x, point.y, dx * 10, dy * 10)
      }
    }
  }
  
  const value: FlowmapContextValue = {
    flowmap: flowmapRef.current,
    fluid: fluidRef.current,
    type,
    updatePointer,
    texture,
  }
  
  return (
    <FlowmapContext.Provider value={value}>
      {children}
    </FlowmapContext.Provider>
  )
}