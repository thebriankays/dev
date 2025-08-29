'use client'

import React from 'react'
import { BlockWrapper } from '@/blocks/_shared/BlockWrapper'
import { WebGLCarousel } from '@/webgl/components/carousels/WebGLCarousel'
import type { WebGLCarouselBlockType } from './types'
import type { Media } from '@/payload-types'

export function WebGLCarouselClient(props: WebGLCarouselBlockType) {
  const {
    images,
    enablePostProcessing = true,
    planeSettings,
  } = props

  // Transform images data from Payload format
  const carouselImages = images?.map((item) => {
    const media = item.image
    let imageUrl = ''
    if (typeof media === 'object' && 'url' in media) {
      imageUrl = media.url || ''
    }
    return { image: imageUrl }
  }).filter((item) => item.image !== '') || []

  return (
    <BlockWrapper
      className="webgl-carousel-block h-screen"
      webglContent={
        <WebGLCarousel
          images={carouselImages}
          enablePostProcessing={enablePostProcessing}
          planeSettings={planeSettings}
        />
      }
    >
      <></>
    </BlockWrapper>
  )
}