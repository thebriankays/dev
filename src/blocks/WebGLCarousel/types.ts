import type { Media } from '@/payload-types'

export interface WebGLCarouselBlockType {
  id?: string
  blockType: 'webglCarousel'
  slides?: Array<{
    id?: string
    image?: string | Media
    title?: string
    description?: string
    cta?: {
      text?: string
      href?: string
    }
  }>
  autoPlay?: boolean
  autoPlayInterval?: number
  transitionEffect?: 'wave' | 'dissolve' | 'zoom' | 'distortion' | 'glitch'
  enableSwipe?: boolean
  enableKeyboard?: boolean
  showControls?: boolean
  showIndicators?: boolean
  glassEffect?: {
    enabled?: boolean
    variant?: 'card' | 'panel' | 'subtle' | 'frost' | 'liquid'
    intensity?: number
  }
  fluidOverlay?: {
    enabled?: boolean
    intensity?: number
    color?: string
  }
}