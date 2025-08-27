'use client'

import React, { useState } from 'react'
import { BlockWrapper } from '@/blocks/_shared/BlockWrapper'
import { WebGLCarousel } from '@/webgl/components/carousels/WebGLCarousel'
import type { CarouselSlideData, TransitionEffect } from '@/webgl/components/carousels/WebGLCarousel/types'
import '@/webgl/components/carousels/WebGLCarousel/carousel.scss'
import './demo.scss'

// Demo travel destination slides
const demoSlides: CarouselSlideData[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop',
    title: 'Swiss Alps Adventure',
    description: 'Experience the breathtaking beauty of the Swiss Alps with pristine snow-capped peaks and crystal-clear mountain lakes.',
    cta: {
      text: 'Explore Tours',
      href: '/tours/swiss-alps',
    },
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1920&h=1080&fit=crop',
    title: 'Maldives Paradise',
    description: 'Discover turquoise waters and white sandy beaches in the tropical paradise of the Maldives.',
    cta: {
      text: 'View Packages',
      href: '/tours/maldives',
    },
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=1920&h=1080&fit=crop',
    title: 'Japanese Cherry Blossoms',
    description: 'Immerse yourself in the magical atmosphere of Japan during cherry blossom season.',
    cta: {
      text: 'Book Now',
      href: '/tours/japan',
    },
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=1920&h=1080&fit=crop',
    title: 'Iceland Northern Lights',
    description: 'Witness the spectacular Aurora Borealis dancing across the Icelandic night sky.',
    cta: {
      text: 'Learn More',
      href: '/tours/iceland',
    },
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1920&h=1080&fit=crop',
    title: 'Santorini Sunset',
    description: 'Experience the world-famous sunset views from the cliffs of Santorini, Greece.',
    cta: {
      text: 'Discover More',
      href: '/tours/santorini',
    },
  },
]

export function WebGLCarouselDemo() {
  const [transitionEffect, setTransitionEffect] = useState<TransitionEffect>('wave')
  const [autoPlay, setAutoPlay] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [showIndicators, setShowIndicators] = useState(true)
  const [glassEnabled, setGlassEnabled] = useState(true)

  return (
    <div className="webgl-carousel-demo">
      {/* Demo Controls */}
      <div className="demo-controls">
        <h1>WebGL Carousel Demo</h1>
        <div className="control-group">
          <label>
            Transition Effect:
            <select 
              value={transitionEffect} 
              onChange={(e) => setTransitionEffect(e.target.value as TransitionEffect)}
            >
              <option value="wave">Wave</option>
              <option value="dissolve">Dissolve</option>
              <option value="zoom">Zoom</option>
              <option value="distortion">Distortion</option>
              <option value="glitch">Glitch</option>
            </select>
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={autoPlay}
              onChange={(e) => setAutoPlay(e.target.checked)}
            />
            Auto Play
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={showControls}
              onChange={(e) => setShowControls(e.target.checked)}
            />
            Show Controls
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={showIndicators}
              onChange={(e) => setShowIndicators(e.target.checked)}
            />
            Show Indicators
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={glassEnabled}
              onChange={(e) => setGlassEnabled(e.target.checked)}
            />
            Glass Effect
          </label>
        </div>
      </div>

      {/* Carousel Component */}
      <BlockWrapper
        className="carousel-demo-wrapper"
        glassEffect={{
          enabled: glassEnabled,
          variant: 'panel',
          intensity: 0.5,
        }}
        fluidOverlay={{
          enabled: false,
          intensity: 0.3,
          color: '#0066ff',
        }}
        interactive
      >
        <WebGLCarousel
          slides={demoSlides}
          autoPlay={autoPlay}
          autoPlayInterval={5000}
          transitionEffect={transitionEffect}
          enableSwipe={true}
          enableKeyboard={true}
          showControls={showControls}
          showIndicators={showIndicators}
        />
      </BlockWrapper>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Carousel Features</h2>
          <div className="features-grid">
            <div className="feature">
              <h3>WebGL Transitions</h3>
              <p>Smooth shader-based transitions including wave, dissolve, zoom, distortion, and glitch effects.</p>
            </div>
            <div className="feature">
              <h3>Glass Morphism</h3>
              <p>Beautiful glass overlay effects for text content with customizable blur and transparency.</p>
            </div>
            <div className="feature">
              <h3>Touch Support</h3>
              <p>Full touch and swipe gesture support for mobile devices with smooth momentum scrolling.</p>
            </div>
            <div className="feature">
              <h3>GSAP Integration</h3>
              <p>Powered by GSAP for buttery-smooth animations and perfect timing control.</p>
            </div>
            <div className="feature">
              <h3>Responsive Design</h3>
              <p>Fully responsive layout that adapts to all screen sizes while maintaining visual quality.</p>
            </div>
            <div className="feature">
              <h3>Keyboard Navigation</h3>
              <p>Navigate through slides using arrow keys for improved accessibility.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}