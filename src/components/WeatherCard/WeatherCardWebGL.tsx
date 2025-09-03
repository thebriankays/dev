'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAnimation } from '@/providers/Animation'
import { useWebGLRect } from '@/hooks/use-webgl-rect'
import WeatherCardClient from './WeatherCardClient'
import type { WeatherData } from './types/weather'

interface WeatherCardWebGLProps {
  weatherData: WeatherData
  location?: string
  enableWebGL?: boolean
}

export default function WeatherCardWebGL({ 
  weatherData, 
  location,
  enableWebGL = true 
}: WeatherCardWebGLProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { tempus, lenis, ScrollTrigger, gsap } = useAnimation()
  const [isVisible, setIsVisible] = useState(true)
  const animationFrameRef = useRef<number | undefined>(undefined)
  
  // Setup WebGL effects if enabled - only when visible
  const rect = useWebGLRect(containerRef)

  // Setup scroll-triggered animations
  useEffect(() => {
    if (!containerRef.current || !ScrollTrigger) return

    const ctx = gsap.context(() => {
      // Fade in animation
      gsap.fromTo(
        containerRef.current,
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      )

      // Parallax effect for weather animations
      const weatherAnimations = containerRef.current?.querySelector('.weather-animations-container')
      if (weatherAnimations) {
        gsap.to(weatherAnimations, {
          y: -100,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [ScrollTrigger, gsap, weatherData])

  // Smooth scroll integration
  useEffect(() => {
    if (!lenis || !containerRef.current) return

    const handleWheel = (e: WheelEvent) => {
      const hoursContainer = containerRef.current?.querySelector('.hours-container')
      if (hoursContainer && hoursContainer.contains(e.target as Node)) {
        e.preventDefault()
        lenis.stop()
        
        // Handle horizontal scroll for hours
        const scrollAmount = e.deltaY * 0.5
        hoursContainer.scrollLeft += scrollAmount
        
        // Resume lenis after scroll
        setTimeout(() => lenis.start(), 100)
      }
    }

    const element = containerRef.current
    element.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      element.removeEventListener('wheel', handleWheel)
    }
  }, [lenis])

  // Tempus time integration for animations
  useEffect(() => {
    if (!tempus) return

    const handleTempusUpdate = () => {
      if (!containerRef.current) return
      
      // Update CSS custom properties for time-based animations
      const time = tempus?.elapsed || 0
      containerRef.current.style.setProperty('--weather-time', `${time}`)
      
      // Rotate sun/moon based on time
      const sun = containerRef.current.querySelector('.sun') as HTMLElement
      const moon = containerRef.current.querySelector('.moon') as HTMLElement
      
      if (sun || moon) {
        const hours = new Date().getHours()
        const minutes = new Date().getMinutes()
        const timeProgress = (hours + minutes / 60) / 24
        
        if (sun) {
          const sunRotation = timeProgress * 360 - 90
          sun.style.transform = `rotate(${sunRotation}deg)`
        }
        
        if (moon) {
          const moonRotation = (timeProgress * 360 + 180) % 360 - 90
          moon.style.transform = `rotate(${moonRotation}deg)`
        }
      }
    }

    // Tempus doesn't have a subscribe method, we'll use RAF instead
    const animate = () => {
      if (isVisible) {
        handleTempusUpdate()
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    }
    
    if (isVisible) {
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [tempus, isVisible])

  // Setup Intersection Observer for visibility detection
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.01
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const visible = entry.isIntersecting
        setIsVisible(visible)
        
        // Cancel animations when not visible
        if (!visible && animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = undefined
        }
      })
    }, options)

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="weather-card-webgl-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <WeatherCardClient 
        weatherData={weatherData}
        location={location}
        key={isVisible ? 'visible' : 'hidden'}
      />
      
      {enableWebGL && rect && isVisible && (
        <div 
          className="webgl-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            mixBlendMode: 'screen',
            opacity: 0.3,
            display: isVisible ? 'block' : 'none',
          }}
        />
      )}
    </div>
  )
}