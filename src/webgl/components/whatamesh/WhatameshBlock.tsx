'use client'

import React from 'react'
import { Whatamesh } from './index'
import { ViewportRenderer } from '../view'

interface WhatameshBlockProps {
  // Content props
  title?: string
  subtitle?: string
  content?: string
  
  // Whatamesh configuration
  variant?: 'default' | 'sunset' | 'ocean' | 'aurora' | 'volcanic'
  speed?: number
  amplitude?: number
  opacity?: number
  interactive?: boolean
}

// Predefined color variants
const colorVariants = {
  default: {
    colorStart: '#667eea',
    colorEnd: '#764ba2',
    colorAccent: '#f093fb',
  },
  sunset: {
    colorStart: '#ff6b6b',
    colorEnd: '#feca57',
    colorAccent: '#ff9ff3',
  },
  ocean: {
    colorStart: '#0abde3',
    colorEnd: '#006ba6',
    colorAccent: '#48dbfb',
  },
  aurora: {
    colorStart: '#00d2d3',
    colorEnd: '#5f27cd',
    colorAccent: '#54a0ff',
  },
  volcanic: {
    colorStart: '#eb2f06',
    colorEnd: '#f39c12',
    colorAccent: '#e74c3c',
  },
}

export function WhatameshBlock({
  title,
  subtitle,
  content,
  variant = 'default',
  speed = 0.3,
  amplitude = 0.5,
  opacity = 0.8,
  interactive = true,
}: WhatameshBlockProps) {
  const colors = colorVariants[variant]
  
  return (
    <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Whatamesh Background */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        zIndex: 0,
      }}>
        <ViewportRenderer interactive={interactive}>
          <Whatamesh
            {...colors}
            speed={speed}
            amplitude={amplitude}
            opacity={opacity}
            frequency={1.5}
            gradientSpeed={0.2}
            position={[0, 0, -500]}
            interactive={interactive}
            mouseInfluence={interactive}
          />
        </ViewportRenderer>
      </div>
      
      {/* Content Overlay */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: '1200px',
          width: '100%',
          textAlign: 'center',
        }}>
          {title && (
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 900,
              margin: '0 0 1rem',
              color: 'white',
              textShadow: '0 0 40px rgba(0,0,0,0.3)',
            }}>
              {title}
            </h1>
          )}
          
          {subtitle && (
            <h2 style={{
              fontSize: 'clamp(1.25rem, 3vw, 2rem)',
              fontWeight: 300,
              margin: '0 0 2rem',
              color: 'rgba(255,255,255,0.9)',
              textShadow: '0 0 20px rgba(0,0,0,0.3)',
            }}>
              {subtitle}
            </h2>
          )}
          
          {content && (
            <div style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.85)',
              maxWidth: '800px',
              margin: '0 auto',
              textShadow: '0 0 20px rgba(0,0,0,0.3)',
            }}>
              {content}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default WhatameshBlock