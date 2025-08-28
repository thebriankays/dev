'use client'

import React, { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { WebGLTunnel } from '@/webgl/components/tunnel'
import { View } from '@react-three/drei'
import { WebGLImage } from './WebGLImage'
import { useCanvas, useView } from '@/providers/Canvas'
import './image.scss'

interface ImageProps {
  src: string
  alt?: string
  width?: number
  height?: number
  distortion?: number
  parallax?: number
  hover?: boolean
  transition?: 'fade' | 'slide' | 'morph'
  scale?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  loading?: 'lazy' | 'eager'
}

export function WebGLImageComponent({ 
  src, 
  alt = '',
  width,
  height,
  distortion = 0,
  parallax = 0.1,
  hover = true,
  transition = 'fade',
  scale = 1,
  className = '',
  priority = false,
  fill = false,
  sizes,
  quality,
  loading,
}: ImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const { isWebGL } = useCanvas()
  const bounds = useView(viewRef)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  return (
    <div 
      ref={containerRef}
      className={`webgl-image ${className}`}
      data-loaded={imageLoaded}
    >
      {/* WebGL view reference div */}
      <div
        ref={viewRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
      
      {/* WebGL version - rendered in the canvas via tunnel */}
      {isWebGL && src && imageLoaded && (
        <WebGLTunnel>
          <View track={viewRef as React.RefObject<HTMLElement>}>
            <WebGLImage
              src={src}
              distortion={distortion}
              parallax={parallax}
              hover={hover}
              transition={transition}
              scale={scale}
            />
          </View>
        </WebGLTunnel>
      )}
      
      {/* DOM version - always rendered but hidden when WebGL is active */}
      <div 
        className="webgl-image__dom"
        style={{ 
          opacity: isWebGL && imageLoaded ? 0 : 1,
          transition: 'opacity 0.3s ease-out'
        }}
      >
        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            quality={quality}
            priority={priority}
            loading={loading}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width || 800}
            height={height || 600}
            sizes={sizes}
            quality={quality}
            priority={priority}
            loading={loading}
            onLoad={() => setImageLoaded(true)}
          />
        )}
      </div>
    </div>
  )
}

// Export for backwards compatibility
export { WebGLImageComponent as WebGLImage }