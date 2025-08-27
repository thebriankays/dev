export type CarouselLayout = 'circular' | 'helix' | 'wave' | 'cylinder'

export interface CarouselItem {
  id: string
  image: string
  title: string
  subtitle?: string
  description?: string
  link?: string
  metadata?: {
    rating?: number
    price?: string
    location?: string
    date?: string
    [key: string]: any
  }
}

export interface ThreeDCarouselBlockProps {
  items: CarouselItem[]
  layout?: CarouselLayout
  autoRotate?: boolean
  rotationSpeed?: number
  enableReflections?: boolean
  enableParticles?: boolean
  enableDepthFade?: boolean
  radius?: number
  spacing?: number
  itemsVisible?: number
  showControls?: boolean
  showIndicators?: boolean
  glassEffect?: {
    enabled: boolean
    variant?: 'card' | 'panel' | 'subtle' | 'frost' | 'liquid'
    intensity?: number
  }
  fluidOverlay?: {
    enabled: boolean
    intensity?: number
    color?: string
  }
  webglEffects?: {
    distortion?: number
    parallax?: number
    hover?: boolean
    transition?: 'fade' | 'slide' | 'morph'
  }
}