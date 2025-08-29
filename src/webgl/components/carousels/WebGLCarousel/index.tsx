import React, { Suspense } from 'react'
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import Carousel from './Carousel'

// Preload textures
const preloadImages = (images: string[]) => {
  images.forEach((image) => {
    useLoader.preload(TextureLoader, image)
  })
}

interface WebGLCarouselProps {
  images?: Array<{ image: string }>
  enablePostProcessing?: boolean
  planeSettings?: {
    width?: number
    height?: number
    gap?: number
  }
}

const WebGLCarousel: React.FC<WebGLCarouselProps> = ({
  images = [
    { image: '/images/1.jpg' },
    { image: '/images/2.jpg' },
    { image: '/images/3.jpg' },
    { image: '/images/4.jpg' },
    { image: '/images/5.jpg' },
    { image: '/images/6.jpg' },
    { image: '/images/7.jpg' },
    { image: '/images/8.jpg' },
  ],
  enablePostProcessing,
  planeSettings,
}) => {
  // Preload all images
  React.useEffect(() => {
    const imageUrls = images.map((item) => item.image)
    preloadImages(imageUrls)
  }, [images])

  return (
    <group>
      <Suspense fallback={null}>
        <Carousel
          imageData={images}
          enablePostProcessing={enablePostProcessing}
          planeSettings={planeSettings}
        />
      </Suspense>
    </group>
  )
}

// Export for use in the shared canvas system
export default WebGLCarousel
export { WebGLCarousel }
