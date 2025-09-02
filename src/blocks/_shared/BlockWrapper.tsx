'use client'

import React, { useRef, ReactNode, useEffect } from 'react'
import { View } from '@react-three/drei'
import { PerspectiveCamera } from '@react-three/drei'
import { useGlass } from '@/providers/Glass'
import { useView } from '@/providers/Canvas'
import { WebGLTunnel } from '@/webgl/components/tunnel'
import { FluidOverlay } from '@/webgl/components/overlays/FluidOverlay'
import cn from 'classnames'

interface BlockWrapperProps {
  children: ReactNode
  webglContent?: ReactNode
  glassEffect?: {
    enabled: boolean
    variant?: 'card' | 'panel' | 'subtle' | 'frost' | 'liquid'
    intensity?: number
  }
  fluidOverlay?: {
    enabled: boolean
    intensity?: number
    color?: string
  }
  className?: string
  interactive?: boolean
  id?: string
  disableDefaultCamera?: boolean
}

export function BlockWrapper({
  children,
  webglContent,
  glassEffect = { enabled: false },
  fluidOverlay = { enabled: false },
  className = '',
  interactive = false,
  id,
  disableDefaultCamera = false,
}: BlockWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const bounds = useView(ref)
  const glass = useGlass()
  
  useEffect(() => {
    if (!ref.current || !glassEffect.enabled) return
    
    glass.applyGlass(ref.current, glassEffect.variant)
    
    return () => {
      if (ref.current) {
        glass.removeGlass(ref.current)
      }
    }
  }, [glassEffect.enabled, glassEffect.variant, glass])
  
  return (
    <>
      <div
        ref={ref}
        id={id}
        className={cn(
          'block-wrapper',
          className,
          {
            'glass-effect': glassEffect.enabled,
            [`glass-${glassEffect.variant}`]: glassEffect.enabled && glassEffect.variant,
          }
        )}
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        {children}
      </div>
      
      {webglContent && (
        <WebGLTunnel>
          <View track={ref as React.RefObject<HTMLElement>}>
            {!disableDefaultCamera && (
              <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
            )}
            {fluidOverlay.enabled && (
              <FluidOverlay
                intensity={fluidOverlay.intensity}
                color={fluidOverlay.color}
              />
            )}
            {webglContent}
          </View>
        </WebGLTunnel>
      )}
    </>
  )
}