'use client'

import React, { useRef, ReactNode } from 'react'
import { View } from '@react-three/drei'
import { PerspectiveCamera } from '@react-three/drei'
import { useView } from '@/providers/Canvas'
import { WebGLTunnel } from '../tunnel'

interface ViewportRendererProps {
  children: ReactNode
  className?: string
  interactive?: boolean
}

export function ViewportRenderer({ 
  children, 
  className = '', 
  interactive = false 
}: ViewportRendererProps) {
  const ref = useRef<HTMLDivElement>(null)
  const bounds = useView(ref)
  
  return (
    <>
      <div 
        ref={ref}
        className={`webgl-view ${className}`}
        style={{ 
          width: '100%', 
          height: '100%',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      />
      <WebGLTunnel>
        <View track={ref as React.RefObject<HTMLElement>}>
          <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={50} />
          {children}
        </View>
      </WebGLTunnel>
    </>
  )
}

// ViewManager removed - using View from @react-three/drei directly