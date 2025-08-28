'use client'

import React, { useEffect } from 'react'
import { Whatamesh } from './Whatamesh'

export interface WhatameshBackgroundProps {
  amplitude?: number
  speed?: number
  freqX?: number
  freqY?: number
  seed?: number
  darkenTop?: boolean
  shadowPower?: number
}

/**
 * Whatamesh Background Component
 * 
 * A flowing gradient background based on Stripe's WebGL animation.
 * Uses 4 colors from CSS variables (--gradient-color-1 through --gradient-color-4)
 */
export function WhatameshBackground(props: WhatameshBackgroundProps) {
  // Set CSS variables if not already set
  useEffect(() => {
    const root = document.documentElement
    const computed = getComputedStyle(root)
    
    // Default gradient colors if not set
    const defaultColors = [
      '#667eea', // Purple
      '#764ba2', // Dark Purple
      '#f093fb', // Pink
      '#feca57', // Yellow
    ]
    
    // Check and set each color variable
    for (let i = 1; i <= 4; i++) {
      const varName = `--gradient-color-${i}`
      const currentValue = computed.getPropertyValue(varName).trim()
      
      if (!currentValue) {
        root.style.setProperty(varName, defaultColors[i - 1])
      }
    }
  }, [])
  
  return <Whatamesh {...props} />
}

// Export the raw component for direct use
export { Whatamesh }

// Export default
export default WhatameshBackground