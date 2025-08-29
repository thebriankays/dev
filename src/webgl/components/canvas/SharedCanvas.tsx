'use client'

import React, { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
import * as THREE from 'three'
import { useCanvas } from '@/providers/Canvas'
import { FlowmapProvider } from '../flowmap'
import { PostProcessing } from '../postprocessing'
import { RAF } from '../raf'
import { Preload } from '../preload'
import { WhatameshBackground } from '../backgrounds/Whatamesh'
import './canvas.scss'

interface SharedCanvasProps {
  render?: boolean
  postprocessing?: boolean
  className?: string
  style?: React.CSSProperties
  interactive?: boolean
  children?: React.ReactNode
  background?: 'whatamesh' | 'none'
  backgroundProps?: any
}

export function SharedCanvas({
  render = true,
  postprocessing = false,
  className,
  style,
  interactive = true,
  children,
  background = 'whatamesh',
  backgroundProps = {},
}: SharedCanvasProps) {
  const { WebGLTunnel, DOMTunnel } = useCanvas() as any
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  return (
    <>
      <div className={`webgl-canvas ${interactive ? 'interactive' : ''} ${className || ''}`} style={style}>
        <Canvas
          ref={canvasRef}
          gl={{
            precision: 'highp',
            powerPreference: 'high-performance',
            antialias: true,
            alpha: true,
            stencil: false,
            depth: !postprocessing,
          }}
          onCreated={(state) => {
            const { gl } = state
            gl.setClearColor(0x000000, 0)
            gl.autoClear = false // Don't auto clear to preserve background
            gl.outputColorSpace = THREE.SRGBColorSpace
            gl.toneMapping = THREE.NoToneMapping
            // Store R3F state globally for invalidation
            ;(window as any).__r3f = state
          }}
          dpr={[1, 2]}
          orthographic
          camera={{ position: [0, 0, 1000], near: -5000, far: 5000, zoom: 1 }}
          frameloop="demand"
          style={{
            pointerEvents: interactive ? 'auto' : 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
          }}
          resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        >
          <RAF render={render} />
          
          {/* Background gradient - render first so it's behind everything */}
          {background === 'whatamesh' && <WhatameshBackground {...backgroundProps} />}
          <FlowmapProvider>
            <View.Port />
            <Suspense fallback={null}>
              <WebGLTunnel.Out />
            </Suspense>
            {children}
            {postprocessing && <PostProcessing />}
          </FlowmapProvider>
          <Preload />
        </Canvas>
      </div>
      <DOMTunnel.Out />
    </>
  )
}

// Default export for backward compatibility
export default SharedCanvas