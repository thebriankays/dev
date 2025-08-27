'use client'

import React from 'react'
import { BlockWrapper } from '@/blocks/_shared/BlockWrapper'
import { WebGLCarousel } from '@/webgl/components/carousels/WebGLCarousel'
import type { WebGLCarouselBlockType } from './types'

export function WebGLCarouselBlock(props: WebGLCarouselBlockType) {
  const {
    slides,
    autoPlay,
    autoPlayInterval,
    transitionEffect,
    enableSwipe,
    enableKeyboard,
    showControls,
    showIndicators,
    glassEffect,
    fluidOverlay,
  } = props

  // Transform slides data from Payload format
  const carouselSlides = slides?.map((slide) => ({
    id: slide.id || '',
    image: typeof slide.image === 'string' ? slide.image : slide.image?.url || '',
    title: slide.title || '',
    description: slide.description,
    cta: slide.cta ? {
      text: slide.cta.text || '',
      href: slide.cta.href || '',
    } : undefined,
  })) || []

  return (
    <BlockWrapper
      className="webgl-carousel-block"
      glassEffect={{
        enabled: glassEffect?.enabled || false,
        variant: glassEffect?.variant || 'panel',
        intensity: glassEffect?.intensity,
      }}
      fluidOverlay={{
        enabled: fluidOverlay?.enabled || false,
        intensity: fluidOverlay?.intensity,
        color: fluidOverlay?.color,
      }}
      interactive
    >
      <WebGLCarousel
        slides={carouselSlides}
        autoPlay={autoPlay}
        autoPlayInterval={autoPlayInterval}
        transitionEffect={transitionEffect}
        enableSwipe={enableSwipe}
        enableKeyboard={enableKeyboard}
        showControls={showControls}
        showIndicators={showIndicators}
      />
    </BlockWrapper>
  )
}