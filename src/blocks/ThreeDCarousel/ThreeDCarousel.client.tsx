'use client'

import React from 'react'
import type { ThreeDCarouselBlock } from '@/payload-types'
import { ThreeDCarouselComponent } from '@/webgl/components/carousels/ThreeDCarousel'
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

  return (
    <BlockWrapper
      glassEffect={glassEffect}
      fluidOverlay={fluidOverlay}
      webglContent={
        <ThreeDCarouselComponent
          items={carouselItems}
          layout={layout}
          autoRotate={autoRotate}
          rotationSpeed={rotationSpeed}
          enableReflections={enableReflections}
          enableParticles={enableParticles}
          enableDepthFade={enableDepthFade}
          radius={radius}
          spacing={spacing}
          itemsVisible={itemsVisible}
          showControls={showControls}
          showIndicators={showIndicators}
          webglEffects={webglEffects}
        />
      }
      {...blockProps}
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