'use client'

import React, { createContext, useContext, ReactNode, useRef, useState, useEffect } from 'react'
import tunnel from 'tunnel-rat'
import { useThree } from '@react-three/fiber'
import type { Mesh, Camera, Scene } from 'three'

interface SharedCanvasContextValue {
  WebGLTunnel: ReturnType<typeof tunnel>
  DOMTunnel: ReturnType<typeof tunnel>
  isReady: boolean
  isWebGL: boolean
  invalidate: () => void
  requestRender: () => void
}

const SharedCanvasContext = createContext<SharedCanvasContextValue | null>(null)

export const useCanvas = () => {
  const context = useContext(SharedCanvasContext)
  if (!context) {
    throw new Error('useCanvas must be used within SharedCanvasProvider')
  }
  // Context access debugging removed for cleaner console output
  return context
}

export function SharedCanvasProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const [isWebGL, setIsWebGL] = useState(true) // Assume WebGL is available by default
  const WebGLTunnel = useRef(tunnel()).current
  const DOMTunnel = useRef(tunnel()).current
  const renderRequest = useRef<number | null>(null)
  
  useEffect(() => {
    // Check WebGL support
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    setIsWebGL(!!gl)
    setIsReady(true)
    
    return () => {
      if (renderRequest.current) {
        cancelAnimationFrame(renderRequest.current)
      }
    }
  }, [])

  const invalidate = () => {
    // Trigger re-render of canvas
    if ((window as any).__r3f) {
      (window as any).__r3f.invalidate()
    }
  }

  const requestRender = () => {
    if (renderRequest.current) return
    
    renderRequest.current = requestAnimationFrame(() => {
      invalidate()
      renderRequest.current = null
    })
  }

  const value: SharedCanvasContextValue = {
    WebGLTunnel,
    DOMTunnel,
    isReady,
    isWebGL,
    invalidate,
    requestRender,
  }

  return (
    <SharedCanvasContext.Provider value={value}>
      {children}
    </SharedCanvasContext.Provider>
  )
}

// Hook to track Views for shared canvas rendering
export const useView = (ref: React.RefObject<HTMLElement | null>) => {
  const canvas = useCanvas()
  const [bounds, setBounds] = useState({ left: 0, top: 0, width: 0, height: 0 })
  
  useEffect(() => {
    if (!ref.current) return
    
    const updateBounds = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      setBounds({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      })
    }
    
    updateBounds()
    window.addEventListener('resize', updateBounds)
    window.addEventListener('scroll', updateBounds)
    
    return () => {
      window.removeEventListener('resize', updateBounds)
      window.removeEventListener('scroll', updateBounds)
    }
  }, [ref])
  
  return bounds
}