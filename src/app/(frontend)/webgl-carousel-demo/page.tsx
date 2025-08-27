import React from 'react'
import { Metadata } from 'next'
import { WebGLCarouselDemo } from './page.client'

export const metadata: Metadata = {
  title: 'WebGL Carousel Demo | Travel Destinations',
  description: 'Experience stunning travel destinations with our WebGL-powered carousel featuring smooth transitions and interactive effects',
}

export default async function WebGLCarouselDemoPage() {
  return <WebGLCarouselDemo />
}