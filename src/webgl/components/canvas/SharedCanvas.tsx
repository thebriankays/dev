'use client'

import React, { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
import * as THREE from 'three'
import { useCanvas } from './'
import { FlowmapProvider } from '../flowmap'
import { PostProcessing } from '../postprocessing'
import { RAF } from '../raf'
import { Preload } from '../preload'
import './canvas.scss'

interface SharedCanvasProps {
  render?: boolean
  postprocessing?: boolean
  className?: string
  style?: React.CSSProperties
  interactive?: boolean
  children?: React.ReactNode
}

export function SharedCanvas({
  render = true,
  postprocessing = false,
  className,
  style,
  interactive = true,
  children,
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
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            gl.autoClear = false
            gl.outputColorSpace = THREE.SRGBColorSpace
            gl.toneMapping = THREE.NoToneMapping
          }}
          dpr={[1, 2]}
          orthographic
          camera={{ position: [0, 0, 5000], near: 0.001, far: 10000, zoom: 1 }}
          frameloop="demand"
          style={{
            pointerEvents: interactive ? 'auto' : 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
          }}
          resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        >
          <RAF render={render} />
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