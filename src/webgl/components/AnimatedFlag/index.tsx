'use client'

import { useState, useEffect } from 'react'
import { ViewportRenderer } from '@/webgl/components/view'
import { AnimatedFlagMesh } from './AnimatedFlagMesh'
import cn from 'clsx'
import './styles.scss'

export interface AnimatedFlagProps extends React.HTMLAttributes<HTMLDivElement> {
  flagSvg?: string
  flagImage?: string
  animationSpeed?: number
  wireframe?: boolean
  segments?: number
  frequency?: {
    x: number
    y: number
  }
  strength?: number
  showControls?: boolean
  className?: string
  containerHeight?: number | string
  layer?: 'content' | 'background' | 'overlay'
  width?: number
  height?: number
}

export function AnimatedFlag({ 
  flagSvg,
  flagImage,
  animationSpeed,
  wireframe,
  segments,
  frequency,
  strength,
  showControls = false,
  className,
  containerHeight = 400,
  layer = 'content',
  width: _width,
  height: _height,
  style,
  ...props 
}: AnimatedFlagProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const containerStyle: React.CSSProperties = {
    height: typeof containerHeight === 'number' ? `${containerHeight}px` : containerHeight,
    position: 'relative',
    width: '100%',
    ...style
  }

  return (
    <div 
      className={cn('animated-flag', className)}
      style={containerStyle}
      {...props}
    >
      {mounted && (
        <ViewportRenderer>
          <AnimatedFlagMesh
            position={[0, 0, 0]}
            scale={[1, 1, 1]}
            visible={true}
            flagImage={flagImage || flagSvg}
            animationSpeed={animationSpeed}
            wireframe={wireframe}
            segments={segments}
            frequency={frequency}
            strength={strength}
            layer={layer}
          />
        </ViewportRenderer>
      )}
      
      {showControls && (
        <div className="animated-flag__controls">
          <div className="animated-flag__controls-inner">
            <p><strong>Three.js Flag Animation</strong></p>
            <p>Flag Image: {flagImage || 'Default flag'}</p>
            <p>Animation Speed: {animationSpeed || 6}</p>
            <p>Segments: {segments || 64}</p>
            <p>Frequency: {frequency?.x || 3}, {frequency?.y || 2}</p>
            <p>Strength: {strength || 0.15}</p>
            <p>Wireframe: {wireframe ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export { AnimatedFlagMesh }