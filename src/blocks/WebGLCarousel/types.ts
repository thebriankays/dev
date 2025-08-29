import type { Media } from '@/payload-types'

export interface WebGLCarouselBlockType {
  id?: string
  blockType: 'webglCarousel'
  images?: Array<{
    id?: string
    image?: string | Media | number
  }>
  enablePostProcessing?: boolean
  planeSettings?: {
    width?: number
    height?: number
    gap?: number
  }
}