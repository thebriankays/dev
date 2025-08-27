export type TransitionEffect = 'wave' | 'dissolve' | 'zoom' | 'distortion' | 'glitch'

export interface CarouselSlideData {
  id: string
  image: string
  title: string
  description?: string
  cta?: {
    text: string
    href: string
  }
}