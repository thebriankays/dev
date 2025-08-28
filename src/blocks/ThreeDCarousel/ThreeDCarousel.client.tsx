'use client'

import React from 'react'
import type { ThreeDCarouselBlock } from '@/payload-types'
import { ThreeDCarousel } from '@/webgl/components/carousels/ThreeDCarousel'
import { BlockWrapper } from '@/blocks/_shared/BlockWrapper'
import './threed-carousel.scss'

export function ThreeDCarouselClient({
  items = [],
  layout = 'circular',
  autoRotate = true,
  rotationSpeed = 1,
  enableReflections = true,
  enableParticles = false,
  enableDepthFade = true,
  radius = 3,
  spacing = 1,
  itemsVisible = 5,
  showControls = true,
  showIndicators = true,
  glassEffect,
  fluidOverlay,
  webglEffects,
  ...blockProps
}: ThreeDCarouselBlock) {
  // Convert Payload media items to carousel format
  const carouselItems = items?.map((item, index) => ({
    id: `item-${index}`,
    image: typeof item.image === 'object' && item.image?.url ? item.image.url : '',
    title: item.title || '',
    subtitle: item.subtitle || undefined,
    description: item.description || undefined,
    link: item.link || undefined,
    metadata: item.metadata || undefined,
  })) || []

  if (carouselItems.length === 0) {
    return (
      <div className="threed-carousel threed-carousel--empty">
        <p>No carousel items configured</p>
      </div>
    )
  }

  // Filter out null values from blockProps
  const filteredBlockProps = Object.entries(blockProps).reduce((acc, [key, value]) => {
    if (value !== null) {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)

  return (
    <BlockWrapper
      glassEffect={glassEffect ? {
        enabled: glassEffect.enabled || false,
        variant: glassEffect.variant || undefined,
        intensity: glassEffect.intensity || undefined,
      } : undefined}
      fluidOverlay={fluidOverlay ? {
        enabled: fluidOverlay.enabled || false,
        intensity: fluidOverlay.intensity || undefined,
        color: fluidOverlay.color || undefined,
      } : undefined}
      webglContent={
        <ThreeDCarousel
          destinations={carouselItems.map(item => ({
            ...item,
            location: item.metadata?.location || item.title || '', // Add required location field
          }))}
          layout={layout || 'circular'}
          autoRotate={autoRotate || false}
          rotationSpeed={rotationSpeed || 1}
          enableReflections={enableReflections || true}
          enableParticles={enableParticles || false}
          enableDepthFade={enableDepthFade || true}
          radius={radius || 3}
          spacing={spacing || 1}
        />
      }
      {...filteredBlockProps}
    >
      <div className="threed-carousel threed-carousel--dom">
        {/* DOM fallback - simple grid */}
        <div className="threed-carousel__grid">
          {carouselItems.map((item, index) => (
            <div key={item.id} className="threed-carousel__item">
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="threed-carousel__image"
                />
              )}
              <div className="threed-carousel__content">
                <h3 className="threed-carousel__title">{item.title}</h3>
                {item.subtitle && (
                  <p className="threed-carousel__subtitle">{item.subtitle}</p>
                )}
                {item.description && (
                  <p className="threed-carousel__description">{item.description}</p>
                )}
                {item.metadata?.rating && (
                  <div className="threed-carousel__rating">
                    Rating: {item.metadata.rating}/5
                  </div>
                )}
                {item.metadata?.price && (
                  <div className="threed-carousel__price">{item.metadata.price}</div>
                )}
                {item.link && (
                  <a 
                    href={item.link} 
                    className="threed-carousel__link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Learn More
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </BlockWrapper>
  )
}