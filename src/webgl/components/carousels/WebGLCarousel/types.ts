export interface CarouselSlideData {
  image: string
  title?: string
  description?: string
  link?: string
}

export type TransitionEffect = 'wave' | 'fade' | 'slide' | 'zoom'

export interface WebGLCarouselProps {
  images?: CarouselSlideData[]
  className?: string
  transitionEffect?: TransitionEffect
  autoPlay?: boolean
  autoPlayInterval?: number
}

export interface PlaneSettings {
  width: number
  height: number
  gap: number
}

export interface CarouselItemData {
  image: string
}