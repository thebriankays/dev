'use client'

import React, { createContext, useContext, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { FlowmapPass } from './FlowmapPass'

interface FlowmapContextValue {
  flowmap: FlowmapPass
  updatePointer: (point: THREE.Vector2) => void
}

const FlowmapContext = createContext<FlowmapContextValue | null>(null)

export const useFlowmap = () => {
  const context = useContext(FlowmapContext)
  if (!context) {
    throw new Error('useFlowmap must be used within FlowmapProvider')
  }
  return context
}

export function FlowmapProvider({ children }: { children: React.ReactNode }) {
  const flowmapRef = useRef<FlowmapPass | null>(null)
  const { gl, size } = useThree()
  const pointer = useRef(new THREE.Vector2())
  
  useEffect(() => {
    flowmapRef.current = new FlowmapPass(gl, size.width, size.height)
    
    return () => {
      flowmapRef.current?.dispose()
    }
  }, [gl, size.width, size.height])
  
  useFrame(({ clock }) => {
    if (flowmapRef.current) {
      flowmapRef.current.update(clock.getDelta(), pointer.current)
    }
  })
  
  const updatePointer = (point: THREE.Vector2) => {
    pointer.current.copy(point)
  }
  
  if (!flowmapRef.current) {
    return <>{children}</>
  }
  
  const value: FlowmapContextValue = {
    flowmap: flowmapRef.current,
    updatePointer,
  }
  
  return (
    <FlowmapContext.Provider value={value}>
      {children}
    </FlowmapContext.Provider>
  )
}