import React from 'react'
import type { Metadata } from 'next'
import { ThreeDCarouselDemo } from './page.client'

export const metadata: Metadata = {
  title: '3D Carousel Demo',
  description: 'Interactive 3D carousel showcasing travel destinations with WebGL effects',
}

export default function ThreeDCarouselDemoPage() {
  return <ThreeDCarouselDemo />
}