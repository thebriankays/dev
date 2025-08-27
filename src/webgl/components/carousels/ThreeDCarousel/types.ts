export type CarouselLayout = 'circular' | 'helix' | 'wave' | 'cylinder'

export interface TravelDestination {
  id: string
  image: string
  title: string
  location: string
  description?: string
  rating?: number
  price?: string
}

export interface ThreeDCarouselProps {
  destinations: TravelDestination[]
  layout?: CarouselLayout
  autoRotate?: boolean
  rotationSpeed?: number
  enableReflections?: boolean
  enableParticles?: boolean
  enableDepthFade?: boolean
  radius?: number
  spacing?: number
  className?: string
}

export interface CarouselItemProps {
  destination: TravelDestination
  index: number
  total: number
  layout: CarouselLayout
  radius: number
  spacing: number
  rotation: number
  isActive: boolean
  isFocused: boolean
  onClick: () => void
}