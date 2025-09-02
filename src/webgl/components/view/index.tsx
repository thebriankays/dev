'use client'

import React, { useRef } from 'react'
import { View } from '@react-three/drei'
import { WebGLTunnel } from '../tunnel'

interface ViewportRendererProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean
}

/**
 * NOTE: You should NOT use this component with TravelDataGlobe!
 * BlockWrapper already handles View tracking and tunneling.
 * This component is only kept for potential other uses.
 */
export function ViewportRenderer({ 
  children, 
  className = '', 
  interactive = false 
}: ViewportRendererProps) {
  const ref = useRef<HTMLDivElement>(null!)
  
  return (
    <>
      <div 
        ref={ref}
        className={`webgl-view ${className}`}
        style={{ 
          width: '100%', 
          height: '100%',
          pointerEvents: interactive ? 'auto' : 'none',
          background: 'transparent',
          position: 'relative',
          isolation: 'isolate'
        }}
      />
      <WebGLTunnel>
        <View index={1} track={ref as any}>
          {children}
        </View>
      </WebGLTunnel>
    </>
  )
}
