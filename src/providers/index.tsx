'use client'

import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SharedCanvasProvider } from './Canvas'
import { GlassProvider } from './Glass'
import { MouseFollowerProvider } from './MouseFollower'
import { AnimationProvider } from './Animation'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AnimationProvider>
        <SharedCanvasProvider>
          <GlassProvider>
            <MouseFollowerProvider>
              <HeaderThemeProvider>{children}</HeaderThemeProvider>
            </MouseFollowerProvider>
          </GlassProvider>
        </SharedCanvasProvider>
      </AnimationProvider>
    </ThemeProvider>
  )
}

// Re-export individual providers for convenience
export { ThemeProvider } from './Theme'
export { HeaderThemeProvider } from './HeaderTheme'
export { SharedCanvasProvider, useCanvas, useView } from './Canvas'
export { GlassProvider, useGlass } from './Glass'
export { MouseFollowerProvider, useMouse, useCursorState } from './MouseFollower'
export { AnimationProvider, useAnimation, useGSAP } from './Animation'
