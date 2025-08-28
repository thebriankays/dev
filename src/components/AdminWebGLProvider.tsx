'use client'

import React from 'react'
import { SharedCanvasProvider } from '@/providers/Canvas'
import SharedCanvas from '@/webgl/components/canvas/SharedCanvas'
import { AnimationProvider } from '@/providers/Animation'

export default function AdminWebGLProvider({ children }: { children: React.ReactNode }) {
  return (
    <AnimationProvider>
      <SharedCanvasProvider>
        {children}
        {/* Mount the single shared canvas for the entire admin application */}
        <SharedCanvas />
      </SharedCanvasProvider>
    </AnimationProvider>
  )
}
