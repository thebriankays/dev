'use client'

import React from 'react'

interface CarouselIndicatorsProps {
  total: number
  current: number
  onSelect: (index: number) => void
}

export function CarouselIndicators({
  total,
  current,
  onSelect,
}: CarouselIndicatorsProps) {
  return (
    <div className="carousel-indicators">
      {Array.from({ length: total }, (_, index) => (
        <button
          key={index}
          className={`carousel-indicator ${index === current ? 'active' : ''}`}
          onClick={() => onSelect(index)}
          aria-label={`Go to slide ${index + 1}`}
        >
          <span className="carousel-indicator-dot" />
        </button>
      ))}
    </div>
  )
}