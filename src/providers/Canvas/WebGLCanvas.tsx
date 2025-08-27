'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
import * as THREE from 'three'
import { useCanvas } from './'
import { PostProcessing } from '@/webgl/components/postprocessing'
import { RAF } from '@/webgl/components/raf'

interface WebGLCanvasProps {
  render?: boolean
  postprocessing?: boolean
  className?: string
  style?: React.CSSProperties
  interactive?: boolean
}

export function WebGLCanvas({
  render = true,
  postprocessing = false,
  className,
  style,
  interactive = true,
}: WebGLCanvasProps) {
  const { WebGLTunnel, DOMTunnel } = useCanvas()
  
  return (
    <div className={`webgl ${interactive ? 'interactive' : ''} ${className || ''}`} style={style}>
      <Canvas
        gl={{
          precision: 'highp',
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true,
          stencil: false,
          depth: postprocessing ? false : true,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.autoClear = false
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.NoToneMapping
          // Store reference for invalidation
          if (typeof window !== 'undefined') {
            (window as any).__r3f = { invalidate: () => gl.render }
          }
        }}
        dpr={[1, 2]}
        orthographic
        camera={{ position: [0, 0, 5000], near: 0.001, far: 10000, zoom: 1 }}
        frameloop="never"
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
        <View.Port />
        <Suspense fallback={null}>
          <WebGLTunnel.Out />
        </Suspense>
        {postprocessing && <PostProcessing />}
      </Canvas>
      <DOMTunnel.Out />
    </div>
  )
}