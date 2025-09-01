'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import './glass.scss'

interface GlassConfig {
  blur: number
  saturation: number
  brightness: number
  opacity: number
  borderRadius: number
  borderWidth: number
  borderColor: string
  backgroundColor: string
  variant: 'card' | 'panel' | 'subtle' | 'frost' | 'liquid'
}

interface GlassContextValue {
  config: GlassConfig
  setConfig: (config: Partial<GlassConfig>) => void
  applyGlass: (element: HTMLElement, variant?: GlassConfig['variant']) => void
  removeGlass: (element: HTMLElement) => void
}

const defaultConfig: GlassConfig = {
  blur: 12,
  saturation: 1.2,
  brightness: 1.1,
  opacity: 0.8,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.18)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  variant: 'card',
}

const GlassContext = createContext<GlassContextValue | null>(null)

export const useGlass = () => {
  const context = useContext(GlassContext)
  if (!context) {
    throw new Error('useGlass must be used within GlassProvider')
  }
  return context
}

export function GlassProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<GlassConfig>(defaultConfig)

  useEffect(() => {
    // Set CSS variables based on config
    const root = document.documentElement
    root.style.setProperty('--glass-blur', `${config.blur}px`)
    root.style.setProperty('--glass-saturation', `${config.saturation}`)
    root.style.setProperty('--glass-brightness', `${config.brightness}`)
    root.style.setProperty('--glass-opacity', `${config.opacity}`)
    root.style.setProperty('--glass-border-radius', `${config.borderRadius}px`)
    root.style.setProperty('--glass-border-width', `${config.borderWidth}px`)
    root.style.setProperty('--glass-border-color', config.borderColor)
    root.style.setProperty('--glass-bg-color', config.backgroundColor)
  }, [config])

  const setConfig = (newConfig: Partial<GlassConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }))
  }

  const applyGlass = (element: HTMLElement, variant: GlassConfig['variant'] = config.variant) => {
    element.classList.add('glass-effect', `glass-${variant}`)
    element.setAttribute('data-glass', variant)
  }

  const removeGlass = (element: HTMLElement) => {
    if (!element) return
    const variant = element.getAttribute('data-glass')
    element.classList.remove('glass-effect')
    if (variant) {
      element.classList.remove(`glass-${variant}`)
      element.removeAttribute('data-glass')
    }
  }

  const value: GlassContextValue = {
    config,
    setConfig,
    applyGlass,
    removeGlass,
  }

  return (
    <GlassContext.Provider value={value}>
      {children}
    </GlassContext.Provider>
  )
}