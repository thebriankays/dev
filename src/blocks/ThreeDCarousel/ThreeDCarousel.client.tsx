'use client'

import React from 'react'
import type { ThreeDCarouselBlock } from '@/payload-types'
import { ThreeDCarousel } from '@/webgl/components/carousels/ThreeDCarousel/ThreeDCarousel'
import './threed-carousel.scss'

export function ThreeDCarouselClient({
  items = [],
  showBanner = true,
  bannerImage,
  radius = 1.4,
  enableFog = true,
  scrollPages = 4,
}: ThreeDCarouselBlock) {
  // Handle null values from Payload
  const sanitizedProps = {
    showBanner: showBanner ?? true,
    bannerImage: bannerImage ?? undefined,
    radius: radius ?? 1.4,
    enableFog: enableFog ?? true,
    scrollPages: scrollPages ?? 4,
  }
  if (!items || items.length === 0) {
    return (
      <div className="threed-carousel threed-carousel--empty">
        <p>Please add exactly 8 images to the carousel</p>
      </div>
    )
  }

  if (items.length !== 8) {
    return (
      <div className="threed-carousel threed-carousel--empty">
        <p>This carousel requires exactly 8 images. Currently has {items.length} images.</p>
      </div>
    )
  }

  return (
    <ThreeDCarousel
      items={items}
      showBanner={sanitizedProps.showBanner}
      bannerImage={sanitizedProps.bannerImage}
      radius={sanitizedProps.radius}
      enableFog={sanitizedProps.enableFog}
      scrollPages={sanitizedProps.scrollPages}
    />
  )
}