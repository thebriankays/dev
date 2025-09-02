'use client'

import React, { useEffect, useRef, useCallback } from 'react'

interface WeatherAnimationsProps {
  weatherType: string
  lightningDuration: number
}

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  scale: number
  rotation?: number
}

interface RainDrop {
  x: number
  y: number
  l: number
  xs: number
  ys: number
}

const WeatherAnimations: React.FC<WeatherAnimationsProps> = ({ weatherType, lightningDuration }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snowCanvasRef = useRef<HTMLCanvasElement>(null)
  const cloudCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const snowAnimationRef = useRef<number | undefined>(undefined)
  const cloudAnimationRef = useRef<number | undefined>(undefined)
  const raindropsRef = useRef<RainDrop[]>([])
  const snowflakesRef = useRef<Particle[]>([])
  const cloudParticlesRef = useRef<Particle[]>([])
  const cloudImageRef = useRef<HTMLImageElement | null>(null)
  const cloudImageLoadedRef = useRef(false)

  // Initialize rain particles
  useEffect(() => {
    const maxParts = 300
    const drops: RainDrop[] = []
    const width = window.innerWidth || 350
    const height = window.innerHeight || 500
    for (let i = 0; i < maxParts; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        l: Math.random() * 1,
        xs: -4 + Math.random() * 4 + 2,
        ys: Math.random() * 10 + 10,
      })
    }
    raindropsRef.current = drops
  }, [])

  // Initialize snow particles
  useEffect(() => {
    const width = window.innerWidth || 350
    const height = window.innerHeight || 500
    const particles: Particle[] = []
    const count = 200

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 2 + 1,
        opacity: Math.random() * 0.8 + 0.2,
        scale: 1,
        rotation: Math.random() * 360,
      })
    }
    snowflakesRef.current = particles
  }, [])

  // Initialize cloud particles
  useEffect(() => {
    // Load cloud image
    const img = new Image()
    img.src = '/fluffycloud.png'
    img.onload = () => {
      cloudImageRef.current = img
      cloudImageLoadedRef.current = true
      
      // Initialize cloud particles
      const width = window.innerWidth || 350
      const particles: Particle[] = []
      const count = 5

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width * 1.5,
          y: Math.random() * 150 + 50,
          size: Math.random() * 100 + 150,
          speedX: Math.random() * 2 + 1,
          speedY: 0,
          opacity: Math.random() * 0.5 + 0.5,
          scale: Math.random() * 0.5 + 0.8,
        })
      }
      cloudParticlesRef.current = particles
    }
    
    img.onerror = () => {
      console.warn('Failed to load cloud image, using fallback')
      cloudImageLoadedRef.current = false
    }
  }, [])

  // Rain animation
  const animateRain = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Get actual container dimensions
    const container = canvas.parentElement
    if (container) {
      canvas.width = container.offsetWidth
      canvas.height = container.offsetHeight - 130 // Subtract hours container height
    } else {
      canvas.width = 350
      canvas.height = 453
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      if (weatherType === 'rainy' || weatherType === 'thunderstorm') {
        ctx.strokeStyle = 'rgba(174,194,224,0.6)'
        ctx.lineWidth = 1
        ctx.lineCap = 'round'

        raindropsRef.current.forEach((p) => {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + p.l * p.xs, p.y + p.l * p.ys)
          ctx.stroke()

          p.x += p.xs
          p.y += p.ys

          if (p.x > canvas.width || p.y > canvas.height) {
            p.x = Math.random() * canvas.width
            p.y = -20
          }
        })
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [weatherType])

  // Snow animation
  const animateSnow = useCallback(() => {
    const canvas = snowCanvasRef.current
    if (!canvas || weatherType !== 'snowy') return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = canvas.parentElement
    if (container) {
      canvas.width = container.offsetWidth
      canvas.height = container.offsetHeight
    } else {
      canvas.width = 350
      canvas.height = 583
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      snowflakesRef.current.forEach((p) => {
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        
        // Draw a more detailed snowflake
        ctx.beginPath()
        ctx.fillStyle = 'white'
        
        // Simple 6-pointed snowflake
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3)
          ctx.moveTo(0, 0)
          ctx.lineTo(0, -p.size)
          ctx.strokeStyle = 'white'
          ctx.lineWidth = p.size / 4
          ctx.stroke()
        }
        
        // Center dot
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.restore()

        p.x += p.speedX
        p.y += p.speedY
        p.rotation = (p.rotation || 0) + 1

        // Reset snowflake if it goes off screen
        if (p.y > canvas.height) {
          p.y = -10
          p.x = Math.random() * canvas.width
        }
        if (p.x > canvas.width) {
          p.x = 0
        } else if (p.x < 0) {
          p.x = canvas.width
        }
      })

      snowAnimationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (snowAnimationRef.current) {
        cancelAnimationFrame(snowAnimationRef.current)
      }
    }
  }, [weatherType])

  // Cloud animation
  const animateClouds = useCallback(() => {
    const canvas = cloudCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const container = canvas.parentElement
    if (container) {
      canvas.width = container.offsetWidth
      canvas.height = container.offsetHeight
    } else {
      canvas.width = 350
      canvas.height = 583
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Show clouds for multiple weather types
      const showClouds = ['cloudy', 'partly-cloudy', 'partly-cloudy-night', 'rainy', 'thunderstorm'].includes(weatherType)
      
      if (showClouds) {
        cloudParticlesRef.current.forEach((p) => {
          ctx.globalAlpha = p.opacity

          if (cloudImageLoadedRef.current && cloudImageRef.current) {
            // Draw cloud image if loaded
            ctx.drawImage(
              cloudImageRef.current,
              p.x,
              p.y,
              p.size * p.scale,
              p.size * p.scale * 0.6
            )
          } else {
            // Fallback: Draw cloud shape with canvas
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
            
            // Create cloud shape with circles
            const cloudWidth = p.size * p.scale
            const cloudHeight = cloudWidth * 0.6
            
            // Bottom larger circles
            ctx.beginPath()
            ctx.arc(p.x + cloudWidth * 0.25, p.y + cloudHeight * 0.7, cloudWidth * 0.3, 0, Math.PI * 2)
            ctx.fill()
            
            ctx.beginPath()
            ctx.arc(p.x + cloudWidth * 0.75, p.y + cloudHeight * 0.7, cloudWidth * 0.3, 0, Math.PI * 2)
            ctx.fill()
            
            // Top circles
            ctx.beginPath()
            ctx.arc(p.x + cloudWidth * 0.5, p.y + cloudHeight * 0.4, cloudWidth * 0.35, 0, Math.PI * 2)
            ctx.fill()
            
            // Fill center
            ctx.fillRect(p.x + cloudWidth * 0.2, p.y + cloudHeight * 0.5, cloudWidth * 0.6, cloudHeight * 0.3)
          }

          p.x -= p.speedX

          // Reset cloud if it goes off screen
          if (p.x + p.size * p.scale < 0) {
            p.x = canvas.width + p.size
            p.y = Math.random() * 150 + 50
            p.opacity = Math.random() * 0.5 + 0.5
          }

          // Animate opacity
          p.opacity += (Math.random() - 0.5) * 0.01
          p.opacity = Math.max(0.2, Math.min(1, p.opacity))
        })
      }

      cloudAnimationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (cloudAnimationRef.current) {
        cancelAnimationFrame(cloudAnimationRef.current)
      }
    }
  }, [weatherType])

  // Setup animations
  useEffect(() => {
    const rainCleanup = animateRain()
    return rainCleanup
  }, [animateRain])

  useEffect(() => {
    if (weatherType === 'snowy') {
      const snowCleanup = animateSnow()
      return snowCleanup
    }
  }, [weatherType, animateSnow])

  useEffect(() => {
    const cloudCleanup = animateClouds()
    return cloudCleanup
  }, [animateClouds])

  return (
    <>
      <div
        id="thunderstorm"
        style={{ 
          '--lightning-duration': `${lightningDuration}s`,
          opacity: weatherType === 'thunderstorm' ? 1 : 0,
        } as React.CSSProperties}
      >
        <div id="lightning"></div>
      </div>
      <div className="sun"></div>
      <div className="moon"></div>
      <canvas 
        ref={cloudCanvasRef} 
        id="cloud"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - 130px)',
          pointerEvents: 'none',
          zIndex: 5,
          opacity: ['cloudy', 'partly-cloudy', 'partly-cloudy-night', 'rainy', 'thunderstorm'].includes(weatherType) ? 0.9 : 0,
          transition: 'opacity 2s',
        }}
      />
      <canvas 
        ref={canvasRef} 
        id="rain"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - 130px)',
          pointerEvents: 'none',
          zIndex: 10,
          opacity: (weatherType === 'rainy' || weatherType === 'thunderstorm') ? 1 : 0,
          transition: 'opacity 2s',
        }}
      />
      <canvas 
        ref={snowCanvasRef} 
        id="snow"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - 130px)',
          pointerEvents: 'none',
          zIndex: 10,
          opacity: weatherType === 'snowy' ? 1 : 0,
          transition: 'opacity 2s',
        }}
      />
    </>
  )
}

export default WeatherAnimations
