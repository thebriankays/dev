'use client'

import React, { useRef, ReactNode, useEffect } from 'react'
import { View, PerspectiveCamera } from '@react-three/drei'
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
  fixedWebGL?: boolean
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
  fixedWebGL = false,
}: BlockWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  useView(ref)
  const glass = useGlass()

  useEffect(() => {
    if (!ref.current || !glassEffect.enabled) return
    const element = ref.current
    glass.applyGlass(element, glassEffect.variant)
    return () => {
      if (element) glass.removeGlass(element)
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
          minHeight: '100vh',
          contain: 'layout',
          isolation: 'isolate',
          transform: 'translateZ(0)', // Force layer creation
        }}
      >
        {children}
      </div>

      {webglContent && (
        <WebGLTunnel>
          <View
            track={fixedWebGL ? undefined : ref as React.RefObject<HTMLElement>}
            className="webgl-view"
            style={{ 
              pointerEvents: interactive ? 'auto' : 'none',
              position: 'fixed',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          >
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