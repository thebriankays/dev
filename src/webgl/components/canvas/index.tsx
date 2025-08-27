'use client'

import React, { createContext, useContext, useRef, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import tunnel from 'tunnel-rat'

interface CanvasContextValue {
  WebGLTunnel: ReturnType<typeof tunnel>
  DOMTunnel: ReturnType<typeof tunnel>
}

const CanvasContext = createContext<CanvasContextValue | null>(null)

export const useCanvas = () => {
  const context = useContext(CanvasContext)
  if (!context) {
    throw new Error('useCanvas must be used within CanvasProvider')
  }
  return context
}

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const WebGLTunnel = useMemo(() => tunnel(), [])
  const DOMTunnel = useMemo(() => tunnel(), [])
  
  const value = useMemo(() => ({
    WebGLTunnel,
    DOMTunnel,
  }), [WebGLTunnel, DOMTunnel])

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  )
}

export * from './SharedCanvas'
export * from './webgl'