'use client'

import React, { useState } from 'react'
import { ThreeDCarousel } from '@/webgl/components/carousels/ThreeDCarousel'
import type { TravelDestination, CarouselLayout } from '@/webgl/components/carousels/ThreeDCarousel/types'
import './demo.scss'

// Sample travel destinations
const travelDestinations: TravelDestination[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=1200&fit=crop',
    title: 'Santorini',
    location: 'Greece',
    description: 'Stunning white-washed buildings overlooking the Aegean Sea',
    rating: 4.8,
    price: 'From $2,499',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1200&fit=crop',
    title: 'Swiss Alps',
    location: 'Switzerland',
    description: 'Majestic mountain peaks and pristine alpine villages',
    rating: 4.9,
    price: 'From $3,299',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&h=1200&fit=crop',
    title: 'Bali',
    location: 'Indonesia',
    description: 'Tropical paradise with ancient temples and rice terraces',
    rating: 4.7,
    price: 'From $1,899',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=800&h=1200&fit=crop',
    title: 'Tokyo',
    location: 'Japan',
    description: 'Vibrant city blending tradition with cutting-edge technology',
    rating: 4.9,
    price: 'From $2,799',
  },
  {
    id: '5',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=1200&fit=crop',
    title: 'Dubai',
    location: 'UAE',
    description: 'Futuristic cityscape rising from the desert',
    rating: 4.6,
    price: 'From $2,199',
  },
  {
    id: '6',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=1200&fit=crop',
    title: 'Maldives',
    location: 'Indian Ocean',
    description: 'Crystal clear waters and overwater bungalows',
    rating: 4.9,
    price: 'From $4,599',
  },
  {
    id: '7',
    image: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=800&h=1200&fit=crop',
    title: 'Paris',
    location: 'France',
    description: 'The City of Light with iconic landmarks and culture',
    rating: 4.8,
    price: 'From $2,399',
  },
  {
    id: '8',
    image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=1200&fit=crop',
    title: 'Iceland',
    location: 'Nordic Island',
    description: 'Land of fire and ice with otherworldly landscapes',
    rating: 4.9,
    price: 'From $3,199',
  },
]

export function ThreeDCarouselDemo() {
  const [layout, setLayout] = useState<CarouselLayout>('circular')
  const [autoRotate, setAutoRotate] = useState(true)
  const [enableReflections, setEnableReflections] = useState(true)
  const [enableParticles, setEnableParticles] = useState(true)
  const [enableDepthFade, setEnableDepthFade] = useState(true)
  
  return (
    <div className="three-d-carousel-demo">
      
      {/* Controls Panel */}
      <div className="demo-controls">
        <h2>3D Carousel Controls</h2>
        
        <div className="control-group">
          <label>Layout:</label>
          <select 
            value={layout} 
            onChange={(e) => setLayout(e.target.value as CarouselLayout)}
          >
            <option value="circular">Circular</option>
            <option value="cylinder">Cylinder</option>
            <option value="helix">Helix</option>
            <option value="wave">Wave</option>
          </select>
        </div>
        
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={autoRotate}
              onChange={(e) => setAutoRotate(e.target.checked)}
            />
            Auto Rotate
          </label>
        </div>
        
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={enableReflections}
              onChange={(e) => setEnableReflections(e.target.checked)}
            />
            Reflections
          </label>
        </div>
        
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={enableParticles}
              onChange={(e) => setEnableParticles(e.target.checked)}
            />
            Particles
          </label>
        </div>
        
        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={enableDepthFade}
              onChange={(e) => setEnableDepthFade(e.target.checked)}
            />
            Depth Fade
          </label>
        </div>
      </div>
      
      {/* Carousel Component */}
      <ThreeDCarousel
        destinations={travelDestinations}
        layout={layout}
        autoRotate={autoRotate}
        rotationSpeed={0.2}
        enableReflections={enableReflections}
        enableParticles={enableParticles}
        enableDepthFade={enableDepthFade}
        radius={8}
        spacing={3}
      />
    </div>
  )
}