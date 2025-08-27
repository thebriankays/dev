import React from 'react'
import type { ThreeDCarouselBlock } from '@/payload-types'
import { ThreeDCarouselClient } from './ThreeDCarousel.client'

export function ThreeDCarouselBlock(props: ThreeDCarouselBlock) {
  return <ThreeDCarouselClient {...props} />
}