import React from 'react'
import type { ThreeDCarouselBlock } from '@/payload-types'
import { ThreeDCarouselClient } from './ThreeDCarousel.client'
import { BlockWrapper } from '../_shared/BlockWrapper'

export function ThreeDCarouselBlock(props: ThreeDCarouselBlock) {
  return (
    <BlockWrapper
      className="threed-carousel-block h-screen min-h-[600px]"
      webglContent={<ThreeDCarouselClient {...props} />}
    >
      {/* Children is required but empty - all content is in WebGL */}
      <></>
    </BlockWrapper>
  )
}