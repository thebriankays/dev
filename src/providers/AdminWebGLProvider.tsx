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
        {/* Mount the shared canvas with interactive=false so it doesn't block UI clicks */}
        <SharedCanvas 
          interactive={false}
          background="none"
          style={{ 
            pointerEvents: 'none',
            zIndex: -1 
          }} 
        />
      </SharedCanvasProvider>
    </AnimationProvider>
  )
}