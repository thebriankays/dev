'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { useAnimation } from '@/providers/Animation'
import { useMouse } from '@/providers/MouseFollower'
import { useView } from '@/providers/Canvas'
import { WebGLTunnel } from '@/webgl/components/tunnel'
import { View } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { CarouselItem } from './CarouselItem'
import { ParticleSystem } from './ParticleSystem'
import { ReflectionPlane } from './ReflectionPlane'
import type { ThreeDCarouselProps, CarouselLayout } from './types'
import './carousel.scss'

export function ThreeDCarousel({
  destinations,
  layout = 'circular',
  autoRotate = true,
  rotationSpeed = 0.2,
  enableReflections = true,
  enableParticles = true,
  enableDepthFade = true,
  radius = 8,
  spacing = 3,
  className = '',
}: ThreeDCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [momentum, setMomentum] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<THREE.Group>(null)
  const rotationRef = useRef(0)
  const lastMouseX = useRef(0)
  const dragVelocity = useRef(0)
  
  const bounds = useView(viewRef)
  const mouse = useMouse()
  const animation = useAnimation()
  
  // Calculate rotation based on active index
  const targetRotation = -(activeIndex / destinations.length) * Math.PI * 2
  
  // Handle mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      
      const delta = e.deltaY > 0 ? 1 : -1
      const newIndex = (activeIndex + delta + destinations.length) % destinations.length
      setActiveIndex(newIndex)
      setMomentum(0) // Stop auto-rotation momentum
    }
    
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [activeIndex, destinations.length])
  
  // Handle mouse drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true)
    lastMouseX.current = e.clientX
    dragVelocity.current = 0
    setMomentum(0)
  }, [])
  
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    
    const deltaX = e.clientX - lastMouseX.current
    dragVelocity.current = deltaX * 0.01
    rotationRef.current += dragVelocity.current
    lastMouseX.current = e.clientX
  }, [isDragging])
  
  const handlePointerUp = useCallback(() => {
    if (!isDragging) return
    
    setIsDragging(false)
    setMomentum(dragVelocity.current * 20) // Apply momentum
    
    // Snap to nearest item
    const itemAngle = (Math.PI * 2) / destinations.length
    const nearestIndex = Math.round(-rotationRef.current / itemAngle) % destinations.length
    const normalizedIndex = (nearestIndex + destinations.length) % destinations.length
    setActiveIndex(normalizedIndex)
  }, [isDragging, destinations.length])
  
  // Handle item click
  const handleItemClick = useCallback((index: number) => {
    if (focusedIndex === index) {
      setFocusedIndex(null)
    } else {
      setActiveIndex(index)
      setFocusedIndex(index)
      setMomentum(0)
    }
  }, [focusedIndex])
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          setActiveIndex((prev) => (prev - 1 + destinations.length) % destinations.length)
          setMomentum(0)
          break
        case 'ArrowRight':
          setActiveIndex((prev) => (prev + 1) % destinations.length)
          setMomentum(0)
          break
        case 'Escape':
          setFocusedIndex(null)
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [destinations.length])
  
  // Mouse hover effects
  const handleMouseEnter = () => {
    mouse.addState('-3d-carousel')
    setMomentum(momentum * 0.5) // Slow down on hover
  }
  
  const handleMouseLeave = () => {
    mouse.removeState('-3d-carousel')
  }
  
  if (!destinations || destinations.length === 0) {
    return null
  }
  
  return (
    <div
      ref={containerRef}
      className={`three-d-carousel ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Info Overlay */}
      <div className="carousel-info">
        <h3 className="carousel-title">
          {focusedIndex !== null 
            ? destinations[focusedIndex].title 
            : destinations[activeIndex].title}
        </h3>
        <p className="carousel-location">
          {focusedIndex !== null 
            ? destinations[focusedIndex].location 
            : destinations[activeIndex].location}
        </p>
        {(focusedIndex !== null ? destinations[focusedIndex] : destinations[activeIndex]).description && (
          <p className="carousel-description">
            {focusedIndex !== null 
              ? destinations[focusedIndex].description 
              : destinations[activeIndex].description}
          </p>
        )}
      </div>
      
      {/* Navigation Dots */}
      <div className="carousel-nav">
        {destinations.map((_, index) => (
          <button
            key={index}
            className={`nav-dot ${index === activeIndex ? 'active' : ''}`}
            onClick={() => {
              setActiveIndex(index)
              setMomentum(0)
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
      {/* WebGL View Reference */}
      <div 
        ref={viewRef}
        className="carousel-webgl-view"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      
      {/* WebGL Content */}
      <WebGLTunnel>
        <View track={viewRef as React.RefObject<HTMLElement>}>
          <Scene
            destinations={destinations}
            layout={layout}
            radius={radius}
            spacing={spacing}
            activeIndex={activeIndex}
            focusedIndex={focusedIndex}
            targetRotation={targetRotation}
            rotationRef={rotationRef}
            groupRef={groupRef}
            momentum={momentum}
            setMomentum={setMomentum}
            autoRotate={autoRotate && !isDragging && focusedIndex === null}
            rotationSpeed={rotationSpeed}
            enableReflections={enableReflections}
            enableParticles={enableParticles}
            enableDepthFade={enableDepthFade}
            onItemClick={handleItemClick}
          />
        </View>
      </WebGLTunnel>
    </div>
  )
}

// Separate Scene component for WebGL content
interface SceneProps {
  destinations: any[]
  layout: CarouselLayout
  radius: number
  spacing: number
  activeIndex: number
  focusedIndex: number | null
  targetRotation: number
  rotationRef: React.MutableRefObject<number>
  groupRef: React.RefObject<THREE.Group | null>
  momentum: number
  setMomentum: (value: number) => void
  autoRotate: boolean
  rotationSpeed: number
  enableReflections: boolean
  enableParticles: boolean
  enableDepthFade: boolean
  onItemClick: (index: number) => void
}

function Scene({
  destinations,
  layout,
  radius,
  spacing,
  activeIndex,
  focusedIndex,
  targetRotation,
  rotationRef,
  groupRef,
  momentum,
  setMomentum,
  autoRotate,
  rotationSpeed,
  enableReflections,
  enableParticles,
  enableDepthFade,
  onItemClick,
}: SceneProps) {
  const { camera } = useThree()
  
  // Animate rotation
  useFrame((state, delta) => {
    if (!groupRef.current) return
    
    // Apply momentum
    if (Math.abs(momentum) > 0.001) {
      rotationRef.current += momentum * delta
      setMomentum(momentum * 0.95) // Damping
    }
    
    // Auto-rotate
    if (autoRotate) {
      rotationRef.current += rotationSpeed * delta
    }
    
    // Smooth rotation to target when not dragging
    if (!autoRotate && Math.abs(momentum) < 0.001) {
      rotationRef.current = THREE.MathUtils.lerp(
        rotationRef.current,
        targetRotation,
        0.1
      )
    }
    
    // Apply rotation to group
    if (layout === 'circular' || layout === 'cylinder' || layout === 'helix') {
      groupRef.current.rotation.y = rotationRef.current
    } else if (layout === 'wave') {
      groupRef.current.position.x = rotationRef.current * spacing * destinations.length * 0.1
    }
  })
  
  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[0, 2, 15]}
        fov={50}
        near={0.1}
        far={1000}
      />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={false}
        minDistance={10}
        maxDistance={30}
        target={[0, 0, 0]}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#ffd700" />
      
      {/* Carousel Items */}
      <group ref={groupRef}>
        {destinations.map((destination, index) => (
          <CarouselItem
            key={destination.id}
            destination={destination}
            index={index}
            total={destinations.length}
            layout={layout}
            radius={radius}
            spacing={spacing}
            rotation={rotationRef.current}
            isActive={index === activeIndex}
            isFocused={index === focusedIndex}
            onClick={() => onItemClick(index)}
          />
        ))}
      </group>
      
      {/* Reflection Ground */}
      {enableReflections && <ReflectionPlane />}
      
      {/* Particle Effects */}
      {enableParticles && (
        <ParticleSystem
          activeIndex={activeIndex}
          total={destinations.length}
          radius={radius}
          layout={layout}
        />
      )}
      
      {/* Fog for depth */}
      {enableDepthFade && <fog attach="fog" args={['#000000', 10, 50]} />}
    </>
  )
}