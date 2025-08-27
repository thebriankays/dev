'use client'

import React from 'react'
import { Whatamesh } from '../Whatamesh'

export type BackgroundType = 'whatamesh' | 'gradient' | 'none'

interface BackgroundProps {
  type?: BackgroundType
  props?: any
}

export function Background({ type = 'none', props = {} }: BackgroundProps) {
  switch (type) {
    case 'whatamesh':
      return <Whatamesh {...props} />
    case 'gradient':
      // Future: Add gradient background
      return null
    case 'none':
    default:
      return null
  }
}