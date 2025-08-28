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
  colors?: string[]
  animate?: boolean
  intensity?: number
}

/**
 * Whatamesh Background Component
 * 
 * A flowing gradient background based on Stripe's WebGL animation.
 * Uses 4 colors from CSS variables (--gradient-color-1 through --gradient-color-4)
 */
export function WhatameshBackground(props: WhatameshBackgroundProps) {
  // console.log('WhatameshBackground rendering with props:', props)
  
  const { colors, ...whatameshProps } = props
  
  // Set CSS variables from props or use defaults
  useEffect(() => {
    const root = document.documentElement
    
    // Default gradient colors if not provided
    const defaultColors = [
      '#dca8d8', // Light purple/pink (from site settings default)
      '#a3d3f9', // Light blue
      '#fcd6d6', // Light pink
      '#eae2ff', // Light purple
    ]
    
    const colorsToUse = colors && colors.length >= 4 ? colors : defaultColors
    
    // Set each color variable
    for (let i = 0; i < 4; i++) {
      const varName = `--gradient-color-${i + 1}`
      root.style.setProperty(varName, colorsToUse[i])
    }
  }, [colors])
  
  return <Whatamesh {...whatameshProps} />
}

// Export the raw component for direct use
export { Whatamesh }

// Export default
export default WhatameshBackground