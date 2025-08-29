import React from 'react'
import { Canvas } from '@react-three/fiber'
import { WebGLCarousel } from './index'

// Example images data
const carouselImages = [
  { image: '/assets/images/carousel/slide1.jpg' },
  { image: '/assets/images/carousel/slide2.jpg' },
  { image: '/assets/images/carousel/slide3.jpg' },
  { image: '/assets/images/carousel/slide4.jpg' },
  { image: '/assets/images/carousel/slide5.jpg' },
  { image: '/assets/images/carousel/slide6.jpg' },
  { image: '/assets/images/carousel/slide7.jpg' },
  { image: '/assets/images/carousel/slide8.jpg' },
]

// Standalone usage example
export const WebGLCarouselExample = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: '#000' }}
      >
        <ambientLight intensity={0.5} />
        <WebGLCarousel images={carouselImages} />
      </Canvas>
    </div>
  )
}

// Usage within existing canvas
export const WebGLCarouselInCanvas = () => {
  return <WebGLCarousel images={carouselImages} />
}