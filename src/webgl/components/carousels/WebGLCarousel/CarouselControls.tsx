'use client'

import React from 'react'

interface CarouselControlsProps {
  onPrevious: () => void
  onNext: () => void
  disabled?: boolean
}

export function CarouselControls({
  onPrevious,
  onNext,
  disabled = false,
}: CarouselControlsProps) {
  return (
    <>
      <button
        className="carousel-control carousel-control--prev"
        onClick={onPrevious}
        disabled={disabled}
        aria-label="Previous slide"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      
      <button
        className="carousel-control carousel-control--next"
        onClick={onNext}
        disabled={disabled}
        aria-label="Next slide"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </>
  )
}